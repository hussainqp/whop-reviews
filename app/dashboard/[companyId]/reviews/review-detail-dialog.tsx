'use client';

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { approveReview, rejectReview } from "@/app/actions/reviews";
import type { Review } from "./types";
import { useRouter } from "next/navigation";

interface ReviewDetailDialogProps {
	review: Review;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: 'pending_approval' | 'approved' | 'rejected';
}

export function ReviewDetailDialog({ review, open, onOpenChange, status }: ReviewDetailDialogProps) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectInput, setShowRejectInput] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleDownload = async () => {
		if (!review.fileUrl) return;
		
		setIsDownloading(true);
		setError(null);
		
		try {
			// Fetch the file as a blob to handle CORS and properly set filename
			const response = await fetch(review.fileUrl);
			if (!response.ok) {
				throw new Error('Failed to download file');
			}
			
			const blob = await response.blob();
			
			// Determine file extension from content type or URL
			let extension = 'jpg'; // default
			if (review.fileType === 'video') {
				extension = 'mp4';
			} else {
				// Try to get extension from content type
				const contentType = response.headers.get('content-type');
				if (contentType?.includes('png')) {
					extension = 'png';
				} else if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
					extension = 'jpg';
				} else if (contentType?.includes('webp')) {
					extension = 'webp';
				} else {
					// Fallback: try to extract from URL
					const urlMatch = review.fileUrl.match(/\.([a-z0-9]+)(?:\?|$)/i);
					if (urlMatch) {
						extension = urlMatch[1];
					}
				}
			}
			
			const fileName = `review-${review.id}.${extension}`;
			
			// Create object URL and trigger download
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the object URL
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download failed:', error);
			setError('Failed to download file. Trying alternative method...');
			
			// Fallback: try direct download first, then open in new tab
			try {
				const link = document.createElement('a');
				link.href = review.fileUrl;
				link.download = `review-${review.id}.${review.fileType === 'video' ? 'mp4' : 'jpg'}`;
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} catch (fallbackError) {
				// Last resort: open in new tab
				window.open(review.fileUrl, '_blank');
			}
		} finally {
			setIsDownloading(false);
		}
	};

	const handleApprove = async () => {
		setIsProcessing(true);
		setError(null);

		try {
			await approveReview(review.id);
			router.refresh();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to approve review");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleReject = async () => {
		if (showRejectInput) {
			// Actually reject with reason
			setIsProcessing(true);
			setError(null);

			try {
				await rejectReview(review.id, rejectionReason || undefined);
				router.refresh();
				onOpenChange(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to reject review");
			} finally {
				setIsProcessing(false);
			}
		} else {
			// Show rejection reason input
			setShowRejectInput(true);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Review Details</DialogTitle>
					<DialogDescription>
						Review from {review.customerName} for {review.productName}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Media */}
					{review.fileUrl && (
						<div className="rounded-lg overflow-hidden bg-gray-a3">
							{review.fileType === "photo" ? (
								<img
									src={review.fileUrl}
									alt="Review"
									className="w-full h-auto max-h-96 object-contain"
								/>
							) : (
								<video
									src={review.fileUrl}
									controls
									className="w-full h-auto max-h-96"
								/>
							)}
						</div>
					)}

					{/* Comment */}
					{review.comment && (
						<div className="space-y-2">
							<Label className="text-gray-10">Comment</Label>
							<p className="text-gray-12 whitespace-pre-wrap">{review.comment}</p>
						</div>
					)}

					{/* Rejection Reason Input */}
					{showRejectInput && (
						<div className="space-y-2">
							<Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
							<Input
								id="rejection-reason"
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Provide a reason for rejection..."
								disabled={isProcessing}
							/>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="rounded-md border border-red-6 bg-red-2 p-4 text-sm text-red-11">
							{error}
						</div>
					)}
				</div>

				<DialogFooter>
					{status === 'pending_approval' ? (
						// Show approve/reject buttons for pending reviews
						!showRejectInput ? (
							<>
								<button
									type="button"
									onClick={handleReject}
									disabled={isProcessing}
									className="rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm font-medium text-gray-12 transition-colors hover:bg-gray-a3 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Reject
								</button>
								<button
									type="button"
									onClick={handleApprove}
									disabled={isProcessing}
									className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isProcessing ? "Processing..." : "Approve"}
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => {
										setShowRejectInput(false);
										setRejectionReason("");
									}}
									disabled={isProcessing}
									className="rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm font-medium text-gray-12 transition-colors hover:bg-gray-a3 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleReject}
									disabled={isProcessing}
									className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isProcessing ? "Processing..." : "Confirm Rejection"}
								</button>
							</>
						)
					) : (
						// Show download button for approved/rejected reviews
						<>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm font-medium text-gray-12 transition-colors hover:bg-gray-a3"
							>
								Close
							</button>
							{review.fileUrl && (
								<button
									type="button"
									onClick={handleDownload}
									disabled={isDownloading}
									className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									<svg
										className="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									{isDownloading ? 'Downloading...' : `Download ${review.fileType === 'photo' ? 'Photo' : 'Video'}`}
								</button>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

