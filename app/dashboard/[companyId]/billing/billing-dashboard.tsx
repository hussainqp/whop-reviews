'use client';

import { CreditPackageCard } from './credit-package-card';

interface BillingDashboardProps {
	merchantId: string;
}

export function BillingDashboard({ merchantId }: BillingDashboardProps) {
	const creditPackages = [
		{
			id: 'starter',
			name: 'Starter',
			credits: 10,
			price: 5,
			badge: undefined,
			badgeColor: '',
			borderColor: 'border-gray-a6',
			popular: true,
			planId: "plan_i8yfYCw7atmJg",
			message: 'Ideal for testing or occasional use',
		},
		{
			id: 'popular',
			name: 'Popular',
			credits: 100,
			price: 10,
			badge: undefined,
			badgeColor: '',
			borderColor: 'border-blue-600',
			popular: false,
			planId: "plan_SFq16YxgxwMqa",
			message: 'Great for growing engagement',
		},
		{
			id: 'premium',
			name: 'Premium',
			credits: 1000,
			price: 50,
			badge: undefined,
			badgeColor: '',
			borderColor: 'border-purple-600',
			popular: false,	
			planId:  "plan_xgqPIQMkiZln2",
			message: 'Perfect for bulk messaging or business use',
		},
	];

	return (
		<div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div>
					<h1 className="text-6 sm:text-7 lg:text-9 font-bold">Billing</h1>
					<p className="text-sm sm:text-base lg:text-3 text-gray-10">Buy credits to send review invites</p>
				</div>
			</div>

			{/* Available Credit Packages */}
			<div className="space-y-4">
				<h2 className="text-4 sm:text-5 lg:text-6 font-semibold text-gray-12">Buy Credits</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{creditPackages.map((pkg) => (
						<CreditPackageCard key={pkg.id} package={pkg} merchantId={merchantId} />
					))}
				</div>
			</div>
		</div>
	);
}

