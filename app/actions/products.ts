'use server';

import { whopsdk } from "@/lib/whop-sdk";
import { verifyUser } from "./authentication";
import { getCompanyDataFromDB } from "./company";
import db from "@/lib/db";
import { productConfigs, merchants } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export const getProducts = async (companyId: string, types: string[] = ["regular", "experience_upsell", "app", "api_only"]) => {
	try {
		if (!companyId) {
			throw new Error("companyId is required");
		}
		await verifyUser(companyId);
		const products = [];
		// Automatically fetches more pages as needed
		for await (const product of whopsdk.products.list({ company_id: companyId, order: 'created_at', direction: 'desc', product_types: types as Array<'regular' | 'app' | 'experience_upsell' | 'api_only'> })) {
			products.push(product);
		}

		return {
			data: products,
		};
	} catch (err: unknown) {
		console.error('[GET PRODUCTS] Error while getting products:', err);
		throw new Error("Failed to retrieve products");
	}
};

export async function syncProductsToDB(companyId: string) {
	try {
		if (!companyId) {
			throw new Error("companyId is required");
		}
		await verifyUser(companyId);
		
		// Get merchant data to get merchantId
		const merchant = await getCompanyDataFromDB(companyId);
		if (!merchant) {
			console.log('[SYNC PRODUCTS TO DB] Merchant not found. Please complete onboarding first.');
			throw new Error("Merchant not found. Please complete onboarding first.");
		}

		// Get all products from Whop
		const { data: products } = await getProducts(companyId);

		// Insert products into productConfigs table
		if (products.length > 0) {
			await db
				.insert(productConfigs)
				.values(
					products.map((product) => {
						// Extract visibility from Whop product - default to 'visible' if not available
						const whopVisibility = (product as any).visibilities || 'visible';
						let status: 'visible' | 'hidden' | 'archived' | 'quick_link' = 'visible';
						
						// Map Whop visibility to our enum values
						if (typeof whopVisibility === 'string') {
							const visibilityLower = whopVisibility.toLowerCase();
							if (['hidden'].includes(visibilityLower)) {
								status = 'hidden';
							} else if (['archived'].includes(visibilityLower)) {
								status = 'archived';
							} else if (['quick_link'].includes(visibilityLower)) {
								status = 'quick_link';
							} else {
								// Default to visible for 'visible', 'all', 'not_quick_link', 'not_archived'
								status = 'visible';
							}
						}
						
						return {
							merchantId: merchant.id,
							whopProductId: product.id,
							productName: product.title ?? "Untitled Product",
							status,
						};
					})
				)
				.onConflictDoNothing({ target: productConfigs.whopProductId });
		}

		return { success: true, count: products.length } as const;
	} catch (err: unknown) {
		console.error('[SYNC PRODUCTS TO DB] Error while syncing products:', err);
		throw new Error("Failed to sync products");
	}
}

export async function syncProducts(companyId: string) {
	try {
		if (!companyId) {
			throw new Error("companyId is required");
		}
		await verifyUser(companyId);

		// Get merchant data to get merchantId
		const merchant = await getCompanyDataFromDB(companyId);
		if (!merchant) {
			console.log('[SYNC PRODUCTS] Merchant not found. Please complete onboarding first.');
			throw new Error("Merchant not found. Please complete onboarding first.");
		}

		// Fetch products from DB and Whop in parallel for performance
		const [dbProducts, whopProductsResponse] = await Promise.all([
			getProductConfigs(companyId),
			getProducts(companyId),
		]);

		const whopProducts = whopProductsResponse.data;

		// Create Map for O(1) lookups - keyed by whopProductId
		const dbProductsMap = new Map(
			dbProducts.map((p) => [p.whopProductId, p])
		);

		// Create Set of Whop product IDs for O(1) lookups
		const whopProductIdsSet = new Set(whopProducts.map((p) => p.id));

		// Identify products to insert and update
		const productsToInsert: Array<{
			merchantId: string;
			whopProductId: string;
			productName: string;
			status: 'visible' | 'hidden' | 'archived' | 'quick_link';
		}> = [];
		const productsToUpdate: Array<{
			whopProductId: string;
			productName: string;
			status?: 'visible' | 'hidden' | 'archived' | 'quick_link';
		}> = [];
		const productsToDelete: Array<{
			whopProductId: string;
		}> = [];

		// Helper function to extract status from Whop product visibility
		const getProductStatus = (product: any): 'visible' | 'hidden' | 'archived' | 'quick_link' => {
			const whopVisibility = product.visibility || 'visible';
			if (typeof whopVisibility === 'string') {
				const visibilityLower = whopVisibility.toLowerCase();
				if (['hidden'].includes(visibilityLower)) {
					return 'hidden';
				} else if (['archived'].includes(visibilityLower)) {
					return 'archived';
				} else if (['quick_link'].includes(visibilityLower)) {
					return 'quick_link';
				}
				// Default to visible for 'visible', 'all', 'not_quick_link', 'not_archived'
			}
			return 'visible';
		};

		// Iterate through Whop products
		for (const whopProduct of whopProducts) {
			const dbProduct = dbProductsMap.get(whopProduct.id);
			const whopProductName = whopProduct.title ?? "Untitled Product";
			const whopStatus = getProductStatus(whopProduct);

			if (!dbProduct) {
				// Product exists in Whop but not in DB - insert it
				productsToInsert.push({
					merchantId: merchant.id,
					whopProductId: whopProduct.id,
					productName: whopProductName,
					status: whopStatus,
				});
			} else {
				// Product exists in both - check if name or status changed
				const needsUpdate = dbProduct.productName !== whopProductName || 
					(dbProduct.status !== whopStatus);
				
				if (needsUpdate) {
					productsToUpdate.push({
						whopProductId: whopProduct.id,
						productName: whopProductName,
						status: whopStatus,
					});
				}
			}
		}

		// Find stale products - exist in DB but not in Whop
		for (const dbProduct of dbProducts) {
			if (!whopProductIdsSet.has(dbProduct.whopProductId)) {
				productsToDelete.push({
					whopProductId: dbProduct.whopProductId,
				});
			}
		}

		// Batch insert new products
		if (productsToInsert.length > 0) {
			await db.insert(productConfigs).values(productsToInsert).onConflictDoNothing({
				target: productConfigs.whopProductId,
			});
		}

		// Batch update products with changed names or status
		// Use a transaction for multiple updates
		if (productsToUpdate.length > 0) {
			await db.transaction(async (tx) => {
				for (const product of productsToUpdate) {
					const updatePayload: Record<string, unknown> = {
						productName: product.productName,
						updatedAt: new Date().toISOString(),
					};
					if (product.status !== undefined) {
						updatePayload.status = product.status;
					}
					await tx
						.update(productConfigs)
						.set(updatePayload)
						.where(eq(productConfigs.whopProductId, product.whopProductId));
				}
			});
		}

		// Batch delete stale products
		if (productsToDelete.length > 0) {
			const staleProductIds = productsToDelete.map((p) => p.whopProductId);
			await db
				.delete(productConfigs)
				.where(inArray(productConfigs.whopProductId, staleProductIds));
		}

		return {
			success: true,
			added: productsToInsert.length,
			updated: productsToUpdate.length,
			deleted: productsToDelete.length,
			total: whopProducts.length,
		} as const;
	} catch (err: unknown) {
		console.error('[SYNC PRODUCTS] Error while syncing products:', err);
		throw new Error("Failed to sync products");
	}
}


export const getProductConfigs = async (companyId: string) => {
	try {
		if (!companyId) {
			throw new Error("companyId is required");
		}
		await verifyUser(companyId);
		
		// Get merchant data to get merchantId
		const merchant = await getCompanyDataFromDB(companyId);
		if (!merchant) {
			return [];
		}

		// Get all product configs for this merchant
		const configs = await db
			.select()
			.from(productConfigs)
			.where(eq(productConfigs.merchantId, merchant.id));

		return configs;
	} catch (err: unknown) {
		console.error('[GET PRODUCT CONFIGS] Error while retrieving product configs:', err);
		throw new Error("Failed to retrieve product configs");
	}
};

export async function updateProductConfig(
	productId: string,
	updates: {
		isEnabled?: boolean;
		reviewType?: "photo" | "video" | "any" | null;
		promoCode?: string | null;
		promoCodeName?: string | null;
	}
) {
	try {
		if (!productId) {
			throw new Error("productId is required");
		}
		// Get the product to verify it exists and get merchantId for auth
		const product = await db
			.select()
			.from(productConfigs)
			.where(eq(productConfigs.id, productId))
			.limit(1);

		if (product.length === 0) {
			console.error('[UPDATE PRODUCT CONFIG] Product not found:', productId);
			throw new Error("Product not found");
		}

		const merchant = await db
			.select()
			.from(merchants)
			.where(eq(merchants.id, product[0].merchantId))
			.limit(1);

		if (merchant.length === 0) {
			console.error('[UPDATE PRODUCT CONFIG] Merchant not found:', merchant[0].companyId);
			throw new Error("Merchant not found");
		}

		// Verify user has access (using companyId from merchant)
		await verifyUser(merchant[0].companyId);

		// Update the product - filter out undefined values and handle nulls properly
		const updatePayload: Record<string, unknown> = {
			updatedAt: new Date().toISOString(),
		};

		if (updates.isEnabled !== undefined) updatePayload.isEnabled = updates.isEnabled;
		if (updates.reviewType !== undefined) updatePayload.reviewType = updates.reviewType;
		if (updates.promoCode !== undefined) updatePayload.promoCode = updates.promoCode;
		if (updates.promoCodeName !== undefined) updatePayload.promoCodeName = updates.promoCodeName;

		await db
			.update(productConfigs)
			.set(updatePayload)
			.where(eq(productConfigs.id, productId));

		return { success: true } as const;
	} catch (err: unknown) {
		console.error('[UPDATE PRODUCT CONFIG] Error while updating product:', err);
		throw new Error("Failed to update product");
	}
}

