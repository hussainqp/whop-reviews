'use client';

import { useState } from 'react';
import { ReviewDisplay } from './review-displays';
import { YourReviewsTab } from './your-reviews-tab';
import { Trophy } from 'lucide-react';
import type { ApprovedReview } from './types';

interface ExperienceTabsProps {
	approvedReviews: ApprovedReview[];
	displayFormat: 'grid' | 'list' | 'cards';
	experienceId: string;
	userId: string | null;
}

export function ExperienceTabs({ approvedReviews, displayFormat, experienceId, userId }: ExperienceTabsProps) {
	const [activeTab, setActiveTab] = useState<'hall' | 'your-reviews'>('hall');

	return (
		<div className="w-full">
			{/* Tab Navigation - At Header Position */}
			<div className="flex border-b border-gray-a4 mb-6 sm:mb-8">
				<button
					onClick={() => setActiveTab('hall')}
					className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
						activeTab === 'hall'
							? 'border-yellow-600 text-yellow-600'
							: 'border-transparent text-gray-10 hover:text-gray-12'
					}`}
				>
					Hall of Reviews
				</button>
				<button
					onClick={() => setActiveTab('your-reviews')}
					className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
						activeTab === 'your-reviews'
							? 'border-yellow-600 text-yellow-600'
							: 'border-transparent text-gray-10 hover:text-gray-12'
					}`}
				>
					Your Reviews
				</button>
			</div>

			{/* Hero Text - Below Tabs (only for Hall of Reviews) */}
			{activeTab === 'hall' && (
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
			)}

			{/* Tab Content */}
			{activeTab === 'hall' && (
				<ReviewDisplay reviews={approvedReviews} format={displayFormat} />
			)}
			{activeTab === 'your-reviews' && (
				<YourReviewsTab experienceId={experienceId} userId={userId} />
			)}
		</div>
	);
}

