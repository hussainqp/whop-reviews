'use server';

import { whopsdk } from '@/lib/whop-sdk';

export async function createCheckoutConfiguration(planId: string, merchantId: string) {
	try {
		console.log('[CREATE CHECKOUT] Creating checkout configuration for planId:', planId, 'and merchantId:', merchantId);
		const checkoutConfiguration = await whopsdk.checkoutConfigurations.create({
			plan_id: planId,
			metadata: {
				merchantId: merchantId,
			},
		});
		return checkoutConfiguration;
	} catch (error) {
		console.error('[CREATE CHECKOUT] Error:', error);
		throw new Error('Failed to create checkout configuration');
	}
}
