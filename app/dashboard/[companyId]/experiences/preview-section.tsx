'use client';

import { useState } from 'react';
import { ReviewDisplay } from '@/app/experiences/[experienceId]/review-displays';
import { DisplaySettings } from './display-settings';
import { Trophy } from 'lucide-react';
import type { ApprovedReview } from '@/app/experiences/[experienceId]/types';

type DisplayFormat = 'grid' | 'carousel' | 'list' | 'cards';

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
			<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-6">
				<div className="mb-6">
					<h3 className="text-6 font-semibold text-gray-12 mb-2">Preview</h3>
					<p className="text-sm text-gray-10">
						This is how your reviews will appear on the public experience page
					</p>
				</div>

				{/* Hall of Fame Header */}
				<div className="mb-12 text-center">
					<div className="inline-flex items-center gap-3 mb-4">
						<Trophy className="h-8 w-8 text-yellow-600" />
						<h2 className="text-7 font-bold bg-gradient-to-r from-gray-12 to-gray-10 bg-clip-text text-transparent">
							Hall of Reviews
						</h2>
						<Trophy className="h-8 w-8 text-yellow-600" />
					</div>
					<p className="text-4 text-gray-10 max-w-2xl mx-auto">
						Showcasing authentic reviews from our amazing customers
					</p>
				</div>

				<ReviewDisplay reviews={reviews} format={previewFormat} />
			</div>
		</>
	);
}

