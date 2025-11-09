'use client';

import { Mail, CheckCircle2, Clock, XCircle, Star, TrendingUp } from 'lucide-react';
import { ReviewsTable } from './reviews-table';

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

type Review = {
	id: string;
	customerName: string;
	customerEmail: string | null;
	fileUrl: string | null;
	fileType: 'photo' | 'video' | null;
	comment: string | null;
	rating: number | null;
	status: 'pending_submission' | 'pending_approval' | 'approved' | 'rejected';
	createdAt: string | null;
	submittedAt: string | null;
	approvedAt: string | null;
	rejectedAt: string | null;
	productName: string;
};

interface AnalyticsDashboardProps {
	stats: AnalyticsStats;
	companyId: string;
	reviews: Review[];
}

export function AnalyticsDashboard({ stats, companyId, reviews }: AnalyticsDashboardProps) {
	return (
		<div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div>
					<h1 className="text-6 sm:text-7 lg:text-9 font-bold text-gray-12">Analytics</h1>
					<p className="text-sm sm:text-base lg:text-3 text-gray-10">Review your review campaign performance</p>
				</div>
			</div>

			{/* Monthly Usage Section */}
			<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4 sm:p-6 transition-all hover:shadow-md">
				<div className="flex flex-col items-center justify-center gap-2">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-10" />
						<h2 className="text-4 sm:text-5 lg:text-6 font-semibold text-gray-12">Credit Usage</h2>
					</div>
					<div className="text-center">
					<p className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-none pr-3 text-gray-12`}>{stats.creditBalance}</p>
						<div className="text-xs sm:text-sm text-gray-10">credits remaining</div>
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
				{/* Pending Submission */}
				<StatCard
					icon={<Clock className="h-5 w-5 text-yellow-600" />}
					label="Pending Submission"
					value={stats.pendingSubmission}
					color="text-yellow-600"
				/>

				{/* Pending Approval */}
				<StatCard
					icon={<Clock className="h-5 w-5 text-orange-600" />}
					label="Pending Approval"
					value={stats.pendingApproval}
					color="text-orange-600"
				/>

				{/* Approved Reviews */}
				<StatCard
					icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
					label="Approved"
					value={stats.approvedReviews}
					color="text-green-600"
				/>

				{/* Rejected Reviews */}
				<StatCard
					icon={<XCircle className="h-5 w-5 text-red-600" />}
					label="Rejected"
					value={stats.rejectedReviews}
					color="text-red-600"
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

			{/* Reviews Table */}
			<div className="mt-4 sm:mt-8">
				<h2 className="text-4 sm:text-5 lg:text-6 font-semibold text-gray-12 mb-4">All Reviews</h2>
				<ReviewsTable data={reviews} />
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
		<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-3 sm:p-4 flex items-center justify-between min-h-[70px] sm:min-h-[80px] transition-all hover:border-gray-a6 hover:shadow-md">
			<div className="flex flex-col gap-1">
				<div className="text-gray-10">{icon}</div>
				<p className="text-xs sm:text-sm text-gray-10">{label}</p>
			</div>
			<p className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-none pr-2 sm:pr-3 ${color}`}>{value.toLocaleString()}</p>
		</div>
	);
}


