'use client';

import { useState } from "react";
import { ReviewDetailDialog } from "./review-detail-dialog";
import type { Review } from "./types";

interface ReviewsGridProps {
	reviews: Review[];
	status: 'pending_approval' | 'approved' | 'rejected';
}

export function ReviewsGrid({ reviews, status }: ReviewsGridProps) {
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);

		if (reviews.length === 0) {
			const statusMessages = {
				pending_approval: 'No pending reviews',
				approved: 'No approved reviews',
				rejected: 'No rejected reviews',
			};
			return (
				<div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-a4 bg-gray-a2">
					<div className="text-center">
						<p className="text-lg text-gray-10">{statusMessages[status]}</p>
						<p className="mt-2 text-sm text-gray-10">
							{status === 'pending_approval' 
								? 'All caught up! Reviews will appear here when customers submit them.'
								: ``}
						</p>
					</div>
				</div>
			);
		}

	return (
		<>
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{reviews.map((review) => (
					<button
						key={review.id}
						onClick={() => setSelectedReview(review)}
						className="group relative overflow-hidden rounded-md border border-gray-a4 bg-gray-a2 transition-all hover:border-gray-a6 hover:shadow-md flex flex-col"
					>
						{review.fileUrl && (
							<div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-a3">
								{review.fileType === "photo" ? (
									<img
										src={review.fileUrl}
										alt={`Review by ${review.customerName}`}
										className="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
								) : (
									<div className="relative w-full h-full">
										<video
											src={review.fileUrl}
											className="h-full w-full object-cover"
											preload="metadata"
										/>
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="rounded-full bg-black/50 p-1.5">
												<svg
													className="h-6 w-6 text-white"
													fill="currentColor"
													viewBox="0 0 24 24"
												>
													<path d="M8 5v14l11-7z" />
												</svg>
											</div>
										</div>
									</div>
								)}
							</div>
						)}
						<div className="p-2 flex-1 flex flex-col">
							<div className="flex items-center justify-between mb-1">
								<p className="text-xs font-medium text-gray-12 truncate flex-1">{review.customerName}</p>
								{review.rating && (
									<div className="flex items-center gap-0.5 shrink-0 ml-1">
										<span className="text-[10px] text-yellow-600">★</span>
										<span className="text-[10px] text-gray-10">{review.rating}</span>
									</div>
								)}
							</div>
							<p className="text-[10px] text-gray-10 line-clamp-1 mb-0.5">{review.productName}</p>
							{review.comment && (
								<p className="text-[9px] text-gray-10 line-clamp-2 mt-0.5 leading-tight">{review.comment}</p>
							)}
						</div>
					</button>
				))}
			</div>

			{selectedReview && (
				<ReviewDetailDialog
					review={selectedReview}
					open={!!selectedReview}
					onOpenChange={(open: boolean) => !open && setSelectedReview(null)}
					status={status}
				/>
			)}
		</>
	);
}

