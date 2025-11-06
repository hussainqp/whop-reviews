import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCompanyDataFromDB } from "@/lib/actions/company";
import { getReviewsByStatus } from "@/lib/actions/reviews";
import Onboarding from "../onboarding";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Check if company exists in our DB
	const existing = await getCompanyDataFromDB(companyId);

	// If not onboarded yet, show onboarding flow
	if (!existing) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md text-center">
					<h1 className="mb-4 text-2xl font-semibold text-gray-12">Please Complete Onboarding</h1>
					<p className="text-gray-10">
						Please complete onboarding first to view reviews.
					</p>
				</div>
			</div>
		);
	}

	// Fetch pending reviews by default
	const initialStatus = "pending_approval" as const;
	const initialReviews = await getReviewsByStatus(companyId, initialStatus);

	return (
		<div className="flex flex-col p-8 gap-4">
			<ReviewsClient
				companyId={companyId}
				initialStatus={initialStatus}
				initialReviews={initialReviews}
			/>
		</div>
	);
}

