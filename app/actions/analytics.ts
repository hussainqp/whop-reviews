'use server';

import { cache } from 'react';
import db from '@/lib/db';
import { reviews, merchants, productConfigs, processedEvents, emailLogs } from '@/lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getCompanyDataFromDB } from './company';
import { verifyUser } from './authentication';

export async function getAnalyticsStats(companyId: string) {
	try {
		await verifyUser(companyId);
		const merchant = await getCompanyDataFromDB(companyId);
		if (!merchant) {
			throw new Error('Merchant not found');
		}

		// Get all review statistics
		const reviewStats = await db
			.select({
				status: reviews.status,
				count: sql<number>`count(*)::int`,
			})
			.from(reviews)
			.where(eq(reviews.merchantId, merchant.id))
			.groupBy(reviews.status);

		// Get total reviews
		const totalReviews = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(reviews)
			.where(eq(reviews.merchantId, merchant.id));

		// Get total emails sent (from processedEvents with payment.succeeded type)
		// TODO: Fix the query to get the total emails sent
		const emailsSent = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(emailLogs)
			.where(
				and(
					eq(emailLogs.merchantId, merchant.id),
					eq(emailLogs.status, 'sent')
				)
			);

			// Get failed emails count
		const failedEmails = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(emailLogs)
		.where(
			and(
				eq(emailLogs.merchantId, merchant.id),
				eq(emailLogs.status, 'failed')
			)
		);


		// Get total products configured
		const productsCount = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(productConfigs)
			.where(eq(productConfigs.merchantId, merchant.id));

		// Get enabled products count
		const enabledProducts = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(productConfigs)
			.where(and(eq(productConfigs.merchantId, merchant.id), eq(productConfigs.isEnabled, true)));

		
		// Transform review stats into a map
		const statsMap = reviewStats.reduce(
			(acc, stat) => {
				acc[stat.status] = stat.count;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			totalEmailsSent: emailsSent[0]?.count || 0,
			failedEmails: failedEmails[0]?.count || 0,
			totalReviews: totalReviews[0]?.count || 0,
			approvedReviews: statsMap.approved || 0,
			rejectedReviews: statsMap.rejected || 0,
			pendingApproval: statsMap.pending_approval || 0,
			pendingSubmission: statsMap.pending_submission || 0,
			totalProducts: productsCount[0]?.count || 0,
			enabledProducts: enabledProducts[0]?.count || 0,
			creditBalance: merchant.creditBalance,
		};
	} catch (err: unknown) {
		console.error('[GET ANALYTICS STATS] Error while fetching analytics stats:', err);
		throw new Error("Failed to fetch analytics stats");
	}
}

