'use client';

import { useState } from 'react';
import { updateReviewDisplayFormat } from '@/app/actions/company';
import { Button } from '@whop/react/components';
import { Grid3x3, LayoutGrid, List, SquareStack } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

type DisplayFormat = 'grid' | 'carousel' | 'list' | 'cards';

interface DisplaySettingsProps {
	companyId: string;
	currentFormat: DisplayFormat;
	onFormatChange?: (format: DisplayFormat) => void;
}

const formatOptions: { value: DisplayFormat; label: string; icon: React.ReactNode; description: string }[] = [
	{
		value: 'grid',
		label: 'Grid',
		icon: <Grid3x3 className="h-5 w-5" />,
		description: 'Masonry grid layout with parallax effects',
	},
	{
		value: 'carousel',
		label: 'Carousel',
		icon: <LayoutGrid className="h-5 w-5" />,
		description: 'Horizontal scrollable carousel',
	},
	{
		value: 'list',
		label: 'List',
		icon: <List className="h-5 w-5" />,
		description: 'Vertical list with detailed information',
	},
	{
		value: 'cards',
		label: 'Cards',
		icon: <SquareStack className="h-5 w-5" />,
		description: 'Card layout with rating bars',
	},
];

export function DisplaySettings({ companyId, currentFormat, onFormatChange }: DisplaySettingsProps) {
	const [selectedFormat, setSelectedFormat] = useState<DisplayFormat>(currentFormat);
	const [isSaving, setIsSaving] = useState(false);
	const { showToast } = useToast();

	const handleFormatSelect = (format: DisplayFormat) => {
		setSelectedFormat(format);
		// Immediately update preview
		if (onFormatChange) {
			onFormatChange(format);
		}
	};

	const handleSave = async () => {
		if (selectedFormat === currentFormat) return;

		setIsSaving(true);
		try {
			await updateReviewDisplayFormat(companyId, selectedFormat);
			showToast('Display format updated successfully', 'success');
		} catch (error) {
			showToast('Failed to update display format', 'error');
			console.error('Error updating display format:', error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-6">
			<div className="mb-4">
				<h3 className="text-6 font-semibold text-gray-12 mb-2">Review Display Format</h3>
				<p className="text-sm text-gray-10">
					Choose how reviews are displayed on your public experience page
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				{formatOptions.map((option) => (
					<button
						key={option.value}
						onClick={() => handleFormatSelect(option.value)}
						className={`p-4 rounded-lg border-2 transition-all text-left ${
							selectedFormat === option.value
								? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
								: 'border-gray-a4 bg-gray-a2 hover:border-gray-a6'
						}`}
					>
						<div className="flex items-center gap-3 mb-2">
							<div
								className={`${
									selectedFormat === option.value ? 'text-blue-600' : 'text-gray-10'
								}`}
							>
								{option.icon}
							</div>
							<span
								className={`font-semibold ${
									selectedFormat === option.value ? 'text-blue-600' : 'text-gray-12'
								}`}
							>
								{option.label}
							</span>
						</div>
						<p className="text-xs text-gray-10">{option.description}</p>
					</button>
				))}
			</div>

			<Button
				variant="classic"
				size="3"
				onClick={handleSave}
				disabled={isSaving || selectedFormat === currentFormat}
			>
				{isSaving ? 'Saving...' : 'Save Changes'}
			</Button>
		</div>
	);
}

