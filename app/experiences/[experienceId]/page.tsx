import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getApprovedReviewsByExperience } from "@/lib/actions/reviews";
import { ApprovedReviewsGrid } from "./approved-reviews-grid";
import type { ApprovedReview } from "./types";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch approved reviews for this experience (experienceId maps to companyId)
	let approvedReviews: ApprovedReview[];
	try {
		approvedReviews = await getApprovedReviewsByExperience(experienceId);
	} catch (error) {
		// If merchant not found or other error, show empty state
		approvedReviews = [];
	}

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-1 via-gray-2 to-gray-3">
			{/* Hero Section */}
			<div className="relative overflow-hidden py-16 px-8">
				<div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-blue-600/10 to-purple-600/10" />
				<div className="relative max-w-4xl mx-auto text-center">
					<h1 className="text-10 font-bold mb-4 bg-gradient-to-r from-gray-12 via-gray-11 to-gray-10 bg-clip-text text-transparent">
						Customer Reviews
					</h1>
					<p className="text-4 text-gray-10 max-w-2xl mx-auto">
						{approvedReviews.length > 0
							? `Discover ${approvedReviews.length} authentic review${approvedReviews.length === 1 ? "" : "s"} from our community`
							: "Discover authentic reviews from our community"}
					</p>
				</div>
			</div>

			{/* Hall of Fame Grid Section */}
			<div className="px-8 pb-16">
				<ApprovedReviewsGrid reviews={approvedReviews} />
			</div>
		</div>
	);
}
