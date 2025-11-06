'use client';

import { useState, useTransition } from 'react';
import { getReviewsByStatus } from '@/app/actions/reviews';
import { ReviewsGrid } from './reviews-grid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Review } from './types';

interface ReviewsClientProps {
	companyId: string;
	initialStatus: 'pending_approval' | 'approved' | 'rejected';
	initialReviews: Review[];
}

export function ReviewsClient({ companyId, initialStatus, initialReviews }: ReviewsClientProps) {
	const [status, setStatus] = useState<'pending_approval' | 'approved' | 'rejected'>(initialStatus);
	const [reviews, setReviews] = useState<Review[]>(initialReviews);
	const [isPending, startTransition] = useTransition();

	const handleStatusChange = (newStatus: 'pending_approval' | 'approved' | 'rejected') => {
		setStatus(newStatus);
		startTransition(async () => {
			try {
				const data = await getReviewsByStatus(companyId, newStatus);
				setReviews(data);
			} catch (error) {
				console.error('Failed to fetch reviews:', error);
				setReviews([]);
			}
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center gap-4">
				<div>
					<h1 className="text-9 font-bold">Review Queue</h1>
					{/* <p className="text-3 text-gray-10">
						{reviews.length === 0
							? `No ${status === 'pending_approval' ? 'pending' : status} reviews`
							: `${reviews.length} review${reviews.length === 1 ? '' : 's'} ${status === 'pending_approval' ? 'pending approval' : status}`}
					</p> */}
				</div>
				<Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="pending_approval">Pending Approval</SelectItem>
						<SelectItem value="approved">Approved</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isPending ? (
				<div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-a4 bg-gray-a2">
					<p className="text-gray-10">Loading reviews...</p>
				</div>
			) : (
				<ReviewsGrid reviews={reviews} status={status} />
			)}
		</div>
	);
}

