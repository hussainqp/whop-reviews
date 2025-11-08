'use client';

import Image from 'next/image';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { ApprovedReview } from './types';

interface ReviewDetailDialogProps {
	review: ApprovedReview;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ReviewDetailDialog({ review, open, onOpenChange }: ReviewDetailDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Review Details</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Media */}
					{review.fileUrl && (
						<div className="rounded-lg overflow-hidden bg-gray-a3">
							{review.fileType === 'photo' ? (
								<Image
									src={review.fileUrl}
									alt="Review"
									width={800}
									height={600}
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
				</div>

				<DialogFooter>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm font-medium text-gray-12 transition-colors hover:bg-gray-a3"
					>
						Close
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

