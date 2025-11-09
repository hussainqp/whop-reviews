'use client';

import { useState } from 'react';
import { ReviewDisplay } from '@/app/experiences/[experienceId]/review-displays';
import { DisplaySettings } from './display-settings';
import { Trophy } from 'lucide-react';
import type { ApprovedReview } from '@/app/experiences/[experienceId]/types';

type DisplayFormat = 'grid' | 'list' | 'cards';

interface PreviewSectionProps {
	reviews: ApprovedReview[];
	initialFormat: DisplayFormat;
	companyId: string;
}

export function PreviewSection({ reviews, initialFormat, companyId }: PreviewSectionProps) {
	const [previewFormat, setPreviewFormat] = useState<DisplayFormat>(initialFormat);

	return (
		<>
			{/* Display Settings */}
			<DisplaySettings 
				companyId={companyId} 
				currentFormat={initialFormat}
				onFormatChange={setPreviewFormat}
			/>

			{/* Preview Section */}
			<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4 sm:p-6 overflow-hidden">
				<div className="mb-4 sm:mb-6">
					<h3 className="text-4 sm:text-5 lg:text-6 font-semibold text-gray-12 mb-2">Preview</h3>
					<p className="text-xs sm:text-sm text-gray-10">
						This is how your reviews will appear on the public experience page
					</p>
				</div>

				{/* Hall of Fame Header */}
				<div className="mb-6 sm:mb-8 md:mb-12 text-center">
					<div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-600" />
						<h2 className="text-4 sm:text-5 md:text-6 lg:text-7 font-bold bg-gradient-to-r from-gray-12 to-gray-10 bg-clip-text text-transparent">
							Hall of Reviews
						</h2>
						<Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-600" />
					</div>
					<p className="text-xs sm:text-sm md:text-base lg:text-4 text-gray-10 max-w-2xl mx-auto px-2 sm:px-4">
						Showcasing authentic reviews from our amazing customers
					</p>
				</div>

				<div className="w-full overflow-hidden">
					<ReviewDisplay reviews={reviews} format={previewFormat} />
				</div>
			</div>
		</>
	);
}

