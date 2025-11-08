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
			<div className="flex min-h-screen items-center justify-center p-4 bg-black">
				<div className="w-full max-w-md text-center">
					<h1 className="mb-4 text-2xl font-semibold text-white">
						{!data ? "Invalid Link" : data.error === "This link has expired" ? "Link Expired" : "Already Submitted"}
					</h1>
					<p className="text-gray-300">
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
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
			<div className="mx-auto w-full max-w-[600px] p-0">
				<div className="my-2 p-3 text-center">
					<h1 className="mx-0 mt-4 mb-2 p-0 text-center font-normal text-3xl text-white">
						💬 Submit Your Review
					</h1>
					<p className="text-lg text-gray-200">
						Share your experience with <strong className="text-white">{productConfig.productName}</strong>
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

