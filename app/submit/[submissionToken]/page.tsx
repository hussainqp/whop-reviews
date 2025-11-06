import { getReviewByToken } from "@/lib/actions/reviews";
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
			<div className="flex min-h-screen items-center justify-center p-4">
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
		<div className="min-h-screen bg-gray-a1 p-4">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8 text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-12">Submit Your Review</h1>
					<p className="text-gray-10">
						Share your experience with <strong>{productConfig.productName}</strong>
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

