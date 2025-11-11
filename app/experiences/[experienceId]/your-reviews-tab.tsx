'use client';

import { useState, useEffect } from 'react';
import { getPendingSubmissionsByExperience } from '@/app/actions/reviews';
import { ReviewUploadForm } from '@/app/submit/[submissionToken]/review-upload-form';
import { Clock } from 'lucide-react';

interface PendingSubmission {
	id: string;
	customerName: string;
	customerEmail: string | null;
	status: string;
	submissionToken: string;
	tokenExpiresAt: string | null;
	createdAt: string | null;
	productName: string;
	reviewType: 'photo' | 'video' | 'any' | null;
}

interface YourReviewsTabProps {
	experienceId: string;
	userId: string | null;
}

export function YourReviewsTab({ experienceId, userId }: YourReviewsTabProps) {
	const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);

	useEffect(() => {
		async function fetchPendingSubmissions() {
			console.log('fetchPendingSubmissions', experienceId, userId);
			if (!userId) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const submissions = await getPendingSubmissionsByExperience(experienceId, userId);
				setPendingSubmissions(submissions);
			} catch (error) {
				console.error('Error fetching pending submissions:', error);
				setPendingSubmissions([]);
			} finally {
				setLoading(false);
			}
		}

		fetchPendingSubmissions();
	}, [experienceId, userId]);

	const handleSubmissionComplete = (token: string) => {
		// Remove the submitted review from the list
		setPendingSubmissions(prev => prev.filter(sub => sub.submissionToken !== token));
		setSelectedSubmission(null);
	};

	if (!userId) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<p className="text-base sm:text-lg text-gray-10 text-center">
					Please log in to view your pending reviews.
				</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mb-4"></div>
				<p className="text-sm text-gray-10">Loading your reviews...</p>
			</div>
		);
	}

	if (selectedSubmission) {
		return (
			<div className="space-y-4">
				<button
					onClick={() => {
						setSelectedSubmission(null);
					}}
					className="text-sm text-gray-10 hover:text-gray-12 transition-colors flex items-center gap-2 mb-4"
				>
					← Back to list
				</button>
				<div className="bg-gradient-to-br from-gray-a2 via-gray-a1 to-gray-a2 rounded-xl p-4 sm:p-6 border border-gray-a4">
					<div className="mb-4 text-center">
						<h2 className="text-xl sm:text-2xl font-semibold text-gray-12 mb-2">
							💬 Submit Your Review
						</h2>
						<p className="text-base sm:text-lg text-gray-10">
							Share your experience with <strong className="text-gray-12">{selectedSubmission.productName}</strong>
						</p>
					</div>
					<ReviewUploadForm
						submissionToken={selectedSubmission.submissionToken}
						reviewType={selectedSubmission.reviewType || 'any'}
						productName={selectedSubmission.productName}
						customerName={selectedSubmission.customerName}
						onSuccess={() => {
							handleSubmissionComplete(selectedSubmission.submissionToken);
						}}
					/>
				</div>
			</div>
		);
	}

	if (pendingSubmissions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<Clock className="h-12 w-12 text-gray-10 mb-4" />
				<p className="text-lg sm:text-xl font-semibold text-gray-12 mb-2">
					No Pending Reviews
				</p>
				<p className="text-sm sm:text-base text-gray-10 text-center max-w-md">
					You have no pending reviews right now. Reviews will appear here when you receive a review request.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-10 mb-4">
				You have {pendingSubmissions.length} pending review{pendingSubmissions.length === 1 ? '' : 's'} to submit.
			</p>
			<div className="grid gap-4">
				{pendingSubmissions.map((submission) => (
					<div
						key={submission.id}
						onClick={() => setSelectedSubmission(submission)}
						className="rounded-lg border border-gray-a4 bg-gray-a2 p-4 sm:p-6 cursor-pointer hover:bg-gray-a3 transition-colors"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1 min-w-0">
								<h3 className="text-base sm:text-lg font-semibold text-gray-12 mb-2">
									{submission.productName}
								</h3>
								{submission.createdAt && (
									<p className="text-xs sm:text-sm text-gray-10">
										Requested: {new Date(submission.createdAt).toLocaleDateString()}
									</p>
								)}
								{submission.tokenExpiresAt && (
									<p className="text-xs sm:text-sm text-gray-10 mt-1">
										Expires: {new Date(submission.tokenExpiresAt).toLocaleDateString()}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-600 border border-yellow-600/30">
									Pending
								</span>
								<button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
									Submit Review
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

