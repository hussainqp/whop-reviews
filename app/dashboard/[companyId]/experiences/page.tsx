import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getApprovedReviewsByExperience } from "@/app/actions/reviews";
import { getCompanyDataFromDB } from "@/app/actions/company";
import { PreviewSection } from "../experiences/preview-section";
import type { ApprovedReview } from "@/app/experiences/[experienceId]/types";

export default async function ExperiencesPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Check if company exists in our DB
	const existing = await getCompanyDataFromDB(companyId);

	// If not onboarded yet, show message
	if (!existing) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md text-center">
					<h1 className="mb-4 text-2xl font-semibold text-gray-12">Please Complete Onboarding</h1>
					<p className="text-gray-10">Please complete onboarding first to view experiences.</p>
				</div>
			</div>
		);
	}

	// Fetch approved reviews and merchant settings
	let approvedReviews: ApprovedReview[] = [];
	let displayFormat: 'grid' | 'list' | 'cards' = 'grid';
	
	try {
		approvedReviews = await getApprovedReviewsByExperience(companyId, true);
		if (existing?.reviewDisplayFormat) {
			const format = existing.reviewDisplayFormat as 'grid' | 'list' | 'cards';
			// Fallback to 'grid' if format is 'carousel' (legacy)
			displayFormat = format === 'carousel' ? 'grid' : format;
		}
	} catch (error) {
		// If merchant not found or other error, show empty state
		approvedReviews = [];
	}

	return (
		<div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
			{/* Header */}
			<div>
				<h1 className="text-6 sm:text-7 lg:text-9 font-bold text-gray-12 mb-2">Hall Of Reviews</h1>
				<p className="text-sm sm:text-base lg:text-3 text-gray-10">Preview and customize how reviews are displayed to your customers</p>
			</div>

			<PreviewSection reviews={approvedReviews} initialFormat={displayFormat} companyId={companyId} />
		</div>
	);
}

