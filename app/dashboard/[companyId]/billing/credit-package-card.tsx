'use client';

import { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useIframeSdk } from "@whop/react";
import { Button } from "@whop/react/components";
import { whopsdk } from '@/lib/whop-sdk';
import { useToast } from '@/components/ui/toast-provider';
import { createCheckoutConfiguration } from '@/app/actions/credits';

interface CreditPackage {
	id: string;
	name: string;
	credits: number;
	price: number;
	badge?: string;
	badgeColor: string;
	borderColor: string;
	popular: boolean;
	planId: string;
	message?: string;
}

interface CreditPackageCardProps {
	package: CreditPackage;
	merchantId: string;
}

export function CreditPackageCard({ package: pkg, merchantId }: CreditPackageCardProps) {
	const iframeSdk = useIframeSdk();
	const { showToast } = useToast();
	const [isProcessing, setIsProcessing] = useState(false);

	const pricePerCredit = (pkg.price / pkg.credits).toFixed(3);

	const handleBuy = async (planId: string, merchantId: string) => {
		setIsProcessing(true);
		try {
			const checkoutConfiguration = await createCheckoutConfiguration(planId, merchantId);

			const res = await iframeSdk.inAppPurchase({
				planId: checkoutConfiguration.plan.id,
				id: checkoutConfiguration.id,
			});

			if (res.status === "ok") {
				showToast("Purchase successful", 'success');
				window.location.reload(); // Refresh to show updated credits
			} else {
				const errorMessage =
					typeof res.error === 'string'
						? res.error
						: (res.error as any)?.message || (res.error as any)?.code || 'Purchase failed. Please try again.';
				showToast(errorMessage, 'error');
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'An error occurred during purchase. Please try again.';
			showToast(errorMessage, 'error');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div
			className={`rounded-lg border-2 ${pkg.borderColor} bg-gray-a2 p-6 flex flex-col ${
				pkg.popular ? 'ring-2 ring-blue-600 ring-opacity-50' : ''
			}`}
		>
			{/* Badge */}
			{pkg.badge && (
				<div className="mb-4">
					<span
						className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${pkg.badgeColor}`}
					>
						{pkg.badge}
					</span>
				</div>
			)}

			{/* Package Name */}
			<div className="flex items-center gap-2 mb-4">
				<Sparkles className="h-5 w-5 text-purple-600" />
				<h3 className="text-6 font-semibold text-gray-12">{pkg.name}</h3>
			</div>

			{/* Price and Credits */}
			<div className="mb-4">
				<div className="mb-3">
					<span className="text-gray-12 font-bold" style={{ fontSize: '3rem', lineHeight: '1' }}>${pkg.price}</span>
				</div>
				
				<div className="flex items-baseline gap-2 mb-1">
					<span className="text-3xl font-bold text-gray-12" style={{ fontSize: '2rem', lineHeight: '1' }}>{pkg.credits}</span>
					<span className="text-1xl font-bold text-gray-12"  style={{ fontSize: '1rem', lineHeight: '1' }}>credits</span>
					<p className="text-sm text-gray-10">(${pricePerCredit} per credit)</p>
				</div>
			
			</div>

			{/* Features */}
			<div className="flex-1 space-y-3 mb-6">
				<div className="flex items-start gap-2">
					<CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
					<span className="text-sm text-gray-10">Send upto {pkg.credits} emails</span>
				</div>
				<div className="flex items-start gap-2">
					<CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
					<span className="text-sm text-gray-10">Credits never expire</span>
				</div>
				<div className="flex items-start gap-2">
					<CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
					<span className="text-sm text-gray-10">Instant delivery</span>
				</div>
				<div className="flex items-start gap-2">
					<CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
					<span className="text-sm text-gray-10">{pkg.message}</span>
				</div>
				
			</div>

			{/* Buy Button */}
			<Button
				variant="classic"
				size="4"
				onClick={() => handleBuy(pkg.planId, merchantId)}
				disabled={isProcessing}
				className="w-full"
			>
				{isProcessing ? 'Processing...' : `Buy ${pkg.credits} Credits`}
			</Button>
		</div>
	);
}

