'use server';

import { cache } from "react";
import { whopsdk } from "@/lib/whop-sdk";
import { verifyUser } from "./authentication";

export const getPromoCodes = cache(async (companyId: string) => {
	try {
		if (!companyId) {
			throw new Error("companyId is required");
		}
		await verifyUser(companyId);

		const promoCodes = [];
		for await (const promoCode of whopsdk.promoCodes.list({ company_id: companyId })) {
			// Only include active promo codes
			// Check if status exists and is 'active', or if status doesn't exist, assume it's active
			if (!promoCode.status || promoCode.status === 'active') {
				promoCodes.push(promoCode);
			}
		}

		return {
			data: promoCodes,
		};
	} catch (err: unknown) {
		console.error('[GET PROMO CODES] Error while retrieving promo codes:', err);
		throw new Error("Failed to retrieve promo codes");
	}
});

