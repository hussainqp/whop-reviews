import { waitUntil } from "@vercel/functions";
import type { Payment, PaymentSucceededWebhookEvent, UnwrapWebhookEvent } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import db from "@/lib/db";
import { merchants, productConfigs, reviews, processedEvents, emailLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendEmail } from "@/app/actions/email";
import { render } from '@react-email/render';
import ReviewRequestEmail from '@/components/email/review-request-email';

// Helper function to log processed events (idempotency)
async function logProcessedEvent(
	eventId: string,
	eventType: string,
	payload?: any
) {
	await db.insert(processedEvents).values({
		eventId,
		eventType,
		payload: payload || null,
	});
}

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate the webhook to ensure it's from Whop
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);
		// TODO: Uncomment this when we have a valid webhook signature
		// const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
      const webhookData = JSON.parse(requestBodyText) as UnwrapWebhookEvent;

		// Handle the webhook event
		if (webhookData.type === "payment.succeeded") {
			waitUntil(handlePaymentSucceeded(webhookData));
		}

		// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
		return new Response("OK", { status: 200 });
	} catch (error) {
		// Log the error for debugging
		console.error("[WEBHOOK ERROR]", error);
		
		// Return 400 for invalid webhook signatures or malformed requests
		// This will cause Whop to retry the webhook
		return new Response("Bad Request", { status: 400 });
	}
}

async function handlePaymentSucceeded(webhookData: PaymentSucceededWebhookEvent) {
	try {
		console.log("[PAYMENT SUCCEEDED]", webhookData);
		// 1. Check idempotency - prevent duplicate processing
		const existingEvent = await db
			.select()
			.from(processedEvents)
			.where(eq(processedEvents.eventId, webhookData.id))
			.limit(1);
		if (existingEvent.length > 0) {
			console.log("[PAYMENT SUCCEEDED] Event already processed:", webhookData.id);
			return;
		}

		
		// Extract data from payment object based on actual Whop payload structure
		const reviewId = randomUUID();
		const payment = webhookData.data;
		const paymentId = payment.id;
		const productId = payment.product?.id;
		const userId = (payment as any).user?.id;
		const userEmail = (payment as any).user?.email;
		const userName = (payment as any).user?.name || (payment as any).user?.username;
		const companyId = (payment as any).company?.id;
		const planId = (payment as any).plan?.id;
		const metadata = (payment as any).metadata;

		if(process.env.WEBHOOK_LOG_ENABLE === "true") {
			await logProcessedEvent(webhookData.id, "payment.succeeded", webhookData);
		}

		// Handle payment of plan and increment credits
		if(planId === process.env.PLANID_1 || planId === process.env.PLANID_2 || planId === process.env.PLANID_3) {
			if(!metadata.merchantId) {
				console.error("[PAYMENT SUCCEEDED] Merchant ID not found in metadata:", metadata);
				return;
			}
			console.log("[PAYMENT SUCCEEDED] Merchant ID found in metadata:", metadata.merchantId);
			
			// Verify merchant exists before updating
			const merchantRows = await db
				.select()
				.from(merchants)
				.where(eq(merchants.companyId, metadata.merchantId))
				.limit(1);
			
			if (merchantRows.length === 0) {
				console.error("[PAYMENT SUCCEEDED] Merchant not found for companyId:", metadata.merchantId);
				return;
			}
			
			const currentBalance = merchantRows[0].creditBalance;
			let creditIncrement = 0;
			let result;
			
			if(planId === process.env.PLANID_1) {
				creditIncrement = 10;
				console.log(`[PAYMENT SUCCEEDED] Increment credits by ${creditIncrement} for merchant:`, metadata.merchantId, "Current balance:", currentBalance);
				result = await db
					.update(merchants)
					.set({ creditBalance: sql`${merchants.creditBalance} + 10` })
					.where(eq(merchants.companyId, metadata.merchantId))
					.returning({ creditBalance: merchants.creditBalance });
			} else if(planId === process.env.PLANID_2) {
				creditIncrement = 50;
				console.log(`[PAYMENT SUCCEEDED] Increment credits by ${creditIncrement} for merchant:`, metadata.merchantId, "Current balance:", currentBalance);
				result = await db
					.update(merchants)
					.set({ creditBalance: sql`${merchants.creditBalance} + 50` })
					.where(eq(merchants.companyId, metadata.merchantId))
					.returning({ creditBalance: merchants.creditBalance });
			} else if(planId === process.env.PLANID_3) {
				creditIncrement = 100;
				console.log(`[PAYMENT SUCCEEDED] Increment credits by ${creditIncrement} for merchant:`, metadata.merchantId, "Current balance:", currentBalance);
				result = await db
					.update(merchants)
					.set({ creditBalance: sql`${merchants.creditBalance} + 100` })
					.where(eq(merchants.companyId, metadata.merchantId))
					.returning({ creditBalance: merchants.creditBalance });
			} else {
				console.error("[PAYMENT SUCCEEDED] Unknown plan ID:", planId);
				return;
			}
			
			if (result.length > 0) {
				console.log(`[PAYMENT SUCCEEDED] Credits updated successfully. New balance:`, result[0].creditBalance);
			} else {
				console.error("[PAYMENT SUCCEEDED] Failed to update credits - no rows affected");
			}
			
			return;
		}
		
		// Validate required fields
		if (!productId || !userId || !companyId) {
			console.error("[PAYMENT SUCCEEDED] Missing required fields:", { productId, userId, companyId });
			return;
		}

		// 2. Get merchant data from database using companyId
		const merchantRows = await db
			.select()
			.from(merchants)
			.where(eq(merchants.companyId, companyId))
			.limit(1);
		if (merchantRows.length === 0) {
			console.error("[PAYMENT SUCCEEDED] Merchant not found for companyId:", companyId);
			return;
		}
		const [merchant] = merchantRows;
			
		// 3. Get product config from database
		const productConfigRows = await db
			.select()
			.from(productConfigs)
			.where(eq(productConfigs.whopProductId, productId))
			.limit(1);
		if (productConfigRows.length === 0) {
			console.error("[PAYMENT SUCCEEDED] Product config not found for productId:", productId);
			return;
		}
		const productConfig = productConfigRows[0];

		// 4. Check if product is enabled
		if (!productConfig.isEnabled) {
			console.log("[PAYMENT SUCCEEDED] Product not enabled:", productId);
			return;
		}

		// 7. Product is enabled - create review record and deduct credits
		const submissionToken = `${randomUUID()}-${Date.now()}`;
		const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
		
		// Fetch promo code details from Whop
		let promoDetails: string | null = null;
		let promoCodeError: string | null = null;
		if (productConfig.promoCode) {
			try {
				const promoCode = await whopsdk.promoCodes.retrieve(productConfig.promoCode);
				
				// Only use promo code if it's active
				if (promoCode.status && promoCode.status !== 'active') {
					promoCodeError = `Promo code is not active (status: ${promoCode.status})`;
					console.error("[PAYMENT SUCCEEDED] Promo code is not active:", promoCode.status);
				} else {
					const promoAmountOff = promoCode.amount_off;
					const promoCurrency = promoCode.currency;
					const promoProduct = promoCode.product?.title;
					const promoType = promoCode.promo_type;
					
					// Use placeholder for review request (don't reveal code until approval)
					// The actual code name will be shown in approval email
					if (promoType === 'percentage') {
						promoDetails = `XXXXXX - ${promoAmountOff}% off` + (promoProduct ? ` on ${promoProduct}` : '');
					} else if (promoType === 'flat_amount') {
						promoDetails = `XXXXXX - ${promoAmountOff} ${promoCurrency} off` + (promoProduct ? ` on ${promoProduct}` : '');
					}
				}
				
			} catch (promoError) {
				promoCodeError = `Failed to fetch promo code: ${promoError instanceof Error ? promoError.message : 'Unknown error'}`;
				console.error("[PAYMENT SUCCEEDED] Error fetching promo code:", promoError);
			}
		}
		// If promo code is required but not available, log email as failed
		if (productConfig.promoCode && !promoDetails) {
			
			await db.insert(emailLogs).values({
				merchantId: merchant.id,
				reviewId: reviewId,
				emailType: "review_request",
				recipient: userEmail,
				subject: "Review Request",
				status: "failed",
				errorMessage: promoCodeError || "Promo code not available",
				metadata: {
					productId: productId,
					productName: productConfig.productName,
					submissionToken,
					promoCode: productConfig.promoCode,
				},
			});


			console.error("[PAYMENT SUCCEEDED] Email not sent - promo code issue:", promoCodeError);
			return;
		}


		// 6. Proceed only if customer email is available
		if (!userEmail) {
			console.log("[PAYMENT SUCCEEDED] Customer email not available, skipping:", paymentId);
			await db.insert(emailLogs).values({
				merchantId: merchant.id,
				reviewId: reviewId,
				emailType: "review_request",
				recipient: "",
				subject: "Review Request",
				status: "failed",
				errorMessage: "User email not available for userId: " + userId,
				metadata: {
					productId: productId,
					productName: productConfig.productName,
					submissionToken,
					promoCode: productConfig.promoCode,
				},
			});
			return;
		}

		// 5. Check if merchant has credits
		if (merchant.creditBalance <= 0) {
			console.log("[PAYMENT SUCCEEDED] Merchant has no credits:", merchant.id);
			await db.insert(emailLogs).values({
				merchantId: merchant.id,
				reviewId: reviewId,
				emailType: "review_request",
				recipient: userEmail,
				subject: "Review Request",
				status: "failed",
				errorMessage: "Merchant has no credits",
				metadata: {
					productId: productId,
					productName: productConfig.productName,
					submissionToken,
					promoCode: productConfig.promoCode,
				},
			});
			return;
		}
		
			await db.insert(reviews).values({
				id: reviewId,
				merchantId: merchant.id,
				productConfigId: productConfig.id,
				customerEmail: userEmail || null,
				customerName: userName,
				customerWhopId: userId,
				status: "pending_submission",
				submissionToken,
				tokenExpiresAt,
			});
		
		// Send review request email to customer
		const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://trustloop-whop.vercel.app"}/submit/${submissionToken}`;
		const finalPromoDetails = promoDetails || "Special Reward";
		const emailHtml = await render(
			ReviewRequestEmail({
				customerName: userName,
				productName: productConfig.productName,
				promoDetails: finalPromoDetails,
				brandName: merchant.name || "Our Team",
				reviewLink,
			})
		);
		await sendEmail({
			to: userEmail,
			subject: "Review Request",
			html: emailHtml,
			merchantId: merchant.id,
			reviewId: reviewId,
			emailType: "review_request",
			metadata: {
				productId: productId,
				productName: productConfig.productName,
				submissionToken,
				promoCode: productConfig.promoCode || null,
			},
		});
		
		await db.insert(emailLogs).values({
			merchantId: merchant.id,
			reviewId: reviewId,
			emailType: "review_request",
			recipient: userEmail,
			subject: "Review Request",
			status: "sent",
			metadata: {
				productId: productId,
				productName: productConfig.productName,
				submissionToken,
				promoCode: productConfig.promoCode || null,
			},
		});

		console.log("[PAYMENT SUCCEEDED] Review created successfully:", reviewId);
	} catch (error) {
		console.error("[PAYMENT SUCCEEDED] Error processing payment:", error);
		// Don't throw - we've already returned 200 to Whop
	}
}
