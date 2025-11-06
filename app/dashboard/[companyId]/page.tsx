import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCompany } from "@/lib/actions/company";
import { getCompanyDataFromDB, saveInitialCompany } from "@/lib/actions/company";
import Onboarding from "./onboarding";
import { syncProductsToDB, getProductConfigs } from "@/lib/actions/products";
import { ProductsTable } from "./products-table";
import { SyncButton } from "./sync-button";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// First, check if company exists in our DB
	const existing = await getCompanyDataFromDB(companyId);

	async function handleOnboardingGetStarted() {
		"use server";
		// Fetch from Whop then persist minimal required fields
		const whopCompany = await getCompany(companyId);
		await saveInitialCompany({
			companyId,
			name: whopCompany.title ?? null,
		});
		await syncProductsToDB(companyId);
	}

	// If not onboarded yet, show onboarding flow
	if (!existing) {
		return <Onboarding onGetStarted={handleOnboardingGetStarted} />;
	}

	// Fetch the neccessary data we want from whop.
	const [company, user, access, productConfigs] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(companyId, { id: userId }),
		getProductConfigs(companyId),
	]);

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="flex flex-col p-8 gap-4">
			<div className="flex justify-between items-center gap-4">
				<h1 className="text-9">
					Hi <strong>{displayName}</strong>!
				</h1>
				<SyncButton companyId={companyId} />
			</div>

			<p className="text-3 text-gray-10">
				Welcome to your whop app! Manage your products and review campaigns below.
			</p>

			<h3 className="text-6 font-bold">Products</h3>
			<ProductsTable data={productConfigs} companyId={companyId} />
		</div>
	);
}

