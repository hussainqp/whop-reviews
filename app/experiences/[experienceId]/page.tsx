import { getApprovedReviewsByExperience } from "@/app/actions/reviews";
import { getExperienceDataFromDBPublic } from "@/app/actions/company";
import { ExperienceTabs } from "./experience-tabs";
import type { ApprovedReview } from "./types";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	// This is a public page - no authentication required, but we'll try to get user if available

	// Try to get user ID if authenticated (optional - won't fail if not authenticated)
	let userId: string | null = null;
	try {
		const headersList = await headers();
		const { userId: authenticatedUserId } = await whopsdk.verifyUserToken(headersList);
		userId = authenticatedUserId;
	} catch (error) {
		// User is not authenticated, which is fine for a public page
		userId = null;
	}

	// Fetch approved reviews and merchant settings
	let approvedReviews: ApprovedReview[] = [];
	let displayFormat: 'grid' | 'list' | 'cards' = 'grid';
	
	try {
		// Get merchant first to get display format
		const merchant = await getExperienceDataFromDBPublic(experienceId);
		if (merchant?.reviewDisplayFormat) {
			const format = merchant.reviewDisplayFormat as 'grid' | 'list' | 'cards' | 'carousel';
			// Fallback to 'grid' if format is 'carousel' (legacy) or invalid
			if (format === 'carousel' || (format !== 'grid' && format !== 'list' && format !== 'cards')) {
				displayFormat = 'grid';
			} else {
				displayFormat = format;
			}
		}
		
		// Then fetch reviews
		approvedReviews = await getApprovedReviewsByExperience(experienceId, false);
	} catch (error) {
		// If merchant not found or other error, show empty state
		console.error('[EXPERIENCE PAGE] Error fetching reviews:', error);
		approvedReviews = [];
	}

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-1 via-gray-2 to-gray-3">
			<div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
				<ExperienceTabs 
					approvedReviews={approvedReviews} 
					displayFormat={displayFormat}
					experienceId={experienceId}
					userId={userId}
				/>
			</div>
		</div>
	);
}
