import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { getCompanyDataFromDB } from '@/app/actions/company';
import { BillingDashboard } from './billing-dashboard';

export default async function BillingPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Check if company exists in our DB
	const existing = await getCompanyDataFromDB(companyId);

	// If not onboarded yet, show message
	if (!existing) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="w-full max-w-md text-center">
					<h1 className="mb-4 text-2xl font-semibold text-gray-12">Please Complete Onboarding</h1>
					<p className="text-gray-10">Please complete onboarding first to view billing.</p>
				</div>
			</div>
		);
	}

	return (
		<BillingDashboard merchantId={existing.companyId} />
	);
}

