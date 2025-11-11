import { getReviewByToken } from "@/app/actions/reviews";
import { ReviewUploadForm } from "./review-upload-form";

export default async function SubmitReviewPage({
	params,
}: {
	params: Promise<{ submissionToken: string }>;
}) {
	const { submissionToken } = await params;

	// Fetch review and product config
	const data = await getReviewByToken(submissionToken);

	// Handle errors or invalid tokens
	if (!data || "error" in data) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4 bg-gray-a1">
				<div className="w-full max-w-md text-center">
					<h1 className="mb-4 text-2xl font-semibold text-gray-12">
						{!data ? "Invalid Link" : data.error === "This link has expired" ? "Link Expired" : "Already Submitted"}
					</h1>
					<p className="text-gray-10">
						{!data 
							? "This review link is invalid or has expired. Please contact support if you believe this is an error."
							: data.error}
					</p>
				</div>
			</div>
		);
	}

	const { review, productConfig } = data;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-1 via-gray-2 to-gray-3 p-4 sm:p-6 lg:p-8">
			<div className="mx-auto w-full max-w-[600px] p-0">
				<div className="my-2 p-3 sm:p-4 text-center">
					<h1 className="mx-0 mt-2 sm:mt-4 mb-2 p-0 text-center font-normal text-2xl sm:text-3xl text-gray-12">
						💬 Submit Your Review
					</h1>
					<p className="text-base sm:text-lg text-gray-10">
						Share your experience with <strong className="text-gray-12">{productConfig.productName}</strong>
					</p>
				</div>

				<ReviewUploadForm
					submissionToken={submissionToken}
					reviewType={productConfig.reviewType}
					productName={productConfig.productName}
					customerName={review.customerName}
				/>
			</div>
		</div>
	);
}

