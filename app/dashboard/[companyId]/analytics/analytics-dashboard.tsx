'use client';

import { Mail, CheckCircle2, Clock, XCircle, Star, ShoppingBag, CreditCard, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsStats {
	totalEmailsSent: number;
	failedEmails: number;
	totalReviews: number;
	approvedReviews: number;
	rejectedReviews: number;
	pendingApproval: number;
	pendingSubmission: number;
	totalProducts: number;
	enabledProducts: number;
	creditBalance: number;
}

interface AnalyticsDashboardProps {
	stats: AnalyticsStats;
	companyId: string;
}

export function AnalyticsDashboard({ stats, companyId }: AnalyticsDashboardProps) {
	return (
		<div className="flex flex-col p-8 gap-4">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-9 font-bold text-gray-12">Analytics</h1>
					<p className="text-3 text-gray-10">Review your review campaign performance</p>
				</div>
			</div>

			{/* Monthly Usage Section */}
			<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-6 transition-all hover:shadow-md">
				<div className="flex flex-col items-center justify-center gap-2">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5 text-gray-10" />
						<h2 className="text-6 font-semibold text-gray-12">Credit Usage</h2>
					</div>
					<div className="text-center">
					<p className={`text-4xl font-bold leading-none pr-3 text-gray-12`} style={{ fontSize: '2.5rem' }}>{stats.creditBalance}</p>
						<div className="text-sm text-gray-10">credits remaining</div>
					</div>
				</div>
				{/* <div className="space-y-2">
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-10">Credit Usage</span>
					</div>
					<div className="w-full h-3 bg-gray-a3 rounded-full overflow-hidden">
						<div
							className="h-full transition-all duration-300"
							style={{ 
								width: `${Math.min(creditPercentage, 100)}%`,
								background: 'linear-gradient(to right, #2563eb, #3b82f6)'
							}}
						/>
					</div>
				</div> */}
			</div>

			{/* Reviews Statistics Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{/* Total Reviews */}
				<StatCard
					icon={<Star className="h-5 w-5" />}
					label="Total Reviews"
					value={stats.totalReviews}
					color="text-gray-12"
				/>

				{/* Approved Reviews */}
				<StatCard
					icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
					label="Approved"
					value={stats.approvedReviews}
					color="text-green-600"
				/>

				{/* Pending Reviews */}
				<StatCard
					icon={<Clock className="h-5 w-5 text-yellow-600" />}
					label="Pending"
					value={stats.pendingApproval}
					color="text-yellow-600"
				/>

				{/* Rejected Reviews */}
				<StatCard
					icon={<XCircle className="h-5 w-5 text-gray-10" />}
					label="Rejected"
					value={stats.rejectedReviews}
					color="text-gray-12"
				/>
			</div>

			{/* Email Statistics Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{/* Total Emails Sent */}
				<StatCard
					icon={<Mail className="h-5 w-5" />}
					label="Total Emails Sent"
					value={stats.totalEmailsSent}
					color="text-gray-12"
				/>

				{/* Failed Emails */}
				<StatCard
					icon={<XCircle className="h-5 w-5 text-red-600" />}
					label="Failed to Deliver"
					value={stats.failedEmails}
					color="text-red-600"
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<ActionCard
					icon={<ShoppingBag className="h-5 w-5" />}
					label="Products"
					description="Manage product configurations"
					href={`/dashboard/${companyId}`}
				/>
				<ActionCard
					icon={<Star className="h-5 w-5" />}
					label="Reviews"
					description="Review and manage submissions"
					href={`/dashboard/${companyId}/reviews`}
				/>
				<ActionCard
					icon={<CreditCard className="h-5 w-5" />}
					label="Billing"
					description='Manage your billing and subscription'
					href={`/dashboard/${companyId}/billing`}
				/>
			</div>
		</div>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: number;
	color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
	return (
		<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-3 flex items-center justify-between min-h-[80px] transition-all hover:border-gray-a6 hover:shadow-md">
			<div className="flex flex-col gap-1">
				<div className="text-gray-10">{icon}</div>
				<p className="text-xs text-gray-10">{label}</p>
			</div>
			<p className={`text-4xl font-bold leading-none pr-3 ${color}`} style={{ fontSize: '2.5rem' }}>{value.toLocaleString()}</p>
		</div>
	);
}

interface ActionCardProps {
	icon: React.ReactNode;
	label: string;
	description: string;
	href: string;
}

function ActionCard({ icon, label, description, href }: ActionCardProps) {
	return (
		<Link
			href={href}
			className="rounded-lg border border-gray-a4 bg-gray-a2 p-4 hover:border-gray-a6 hover:bg-gray-a3 transition-colors"
		>
			<div className="flex items-center gap-3 mb-2">
				<div className="text-gray-10">{icon}</div>
				<p className="font-medium text-gray-12">{label}</p>
			</div>
			<p className="text-sm text-gray-10">{description}</p>
		</Link>
	);
}

