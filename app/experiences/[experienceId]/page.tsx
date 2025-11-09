import { getApprovedReviewsByExperience } from "@/app/actions/reviews";
import { getExperienceDataFromDBPublic } from "@/app/actions/company";
import { ReviewDisplay } from "./review-displays";
import { Trophy } from "lucide-react";
import type { ApprovedReview } from "./types";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	// This is a public page - no authentication required

	// Fetch approved reviews and merchant settings
	let approvedReviews: ApprovedReview[] = [];
	let displayFormat: 'grid' | 'list' | 'cards' = 'grid';
	
	try {
		// Get merchant first to get display format
		const merchant = await getExperienceDataFromDBPublic(experienceId);
		if (merchant?.reviewDisplayFormat) {
			const format = merchant.reviewDisplayFormat as 'grid' | 'list' | 'cards';
			// Fallback to 'grid' if format is 'carousel' (legacy)
			displayFormat = format === 'carousel' ? 'grid' : format;
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
			{/* Hero Section */}
			{/* <div className="relative overflow-hidden py-16 px-8">
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
			</div> */}

			{/* Hall of Fame Section */}
			<div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-6 sm:pt-8">
				{/* Hall of Fame Header */}
				<div className="mb-8 sm:mb-12 text-center">
					<div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
						<h2 className="text-5 sm:text-6 lg:text-7 font-bold bg-gradient-to-r from-gray-12 to-gray-10 bg-clip-text text-transparent">
							Hall of Reviews
						</h2>
						<Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
					</div>
					<p className="text-sm sm:text-base lg:text-4 text-gray-10 max-w-2xl mx-auto px-4">
						Showcasing authentic reviews from our amazing customers
					</p>
				</div>
				<ReviewDisplay reviews={approvedReviews} format={displayFormat} />
			</div>
		</div>
	);
}
