'use client';

import { CreditCard } from 'lucide-react';

interface CurrentCreditsDisplayProps {
	creditBalance: number;
}

export function CurrentCreditsDisplay({ creditBalance }: CurrentCreditsDisplayProps) {
	return (
		<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-6">
			<div className="flex items-center gap-3 mb-4">
				<CreditCard className="h-5 w-5 text-gray-10" />
				<h3 className="text-6 font-semibold text-gray-12">Current Credits</h3>
			</div>

			<div className="flex items-baseline gap-2">
				<span className="text-4xl font-bold text-gray-12">{creditBalance}</span>
				<span className="text-lg text-gray-10">credits available</span>
			</div>
		</div>
	);
}

