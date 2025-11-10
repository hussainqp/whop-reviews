'use client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type EmailLog = {
	id: string;
	emailType: 'review_request' | 'reward_delivery' | 'review_rejection';
	recipient: string;
	subject: string | null;
	status: 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';
	errorMessage: string | null;
	createdAt: string | Date | null;
	reviewId: string | null;
	sendgridMessageId?: string | null;
	metadata?: unknown;
};

interface EmailLogDetailDialogProps {
	emailLog: EmailLog | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EmailLogDetailDialog({ emailLog, open, onOpenChange }: EmailLogDetailDialogProps) {
	if (!emailLog) return null;

	const getStatusColor = (status: string) => {
		const statusColors: Record<string, string> = {
			sent: "text-blue-600",
			delivered: "text-green-600",
			opened: "text-green-700",
			clicked: "text-green-800",
			failed: "text-red-600",
			bounced: "text-orange-600",
		};
		return statusColors[status] || "text-gray-10";
	};

	const getStatusLabel = (status: string) => {
		const statusLabels: Record<string, string> = {
			sent: "Sent",
			delivered: "Delivered",
			opened: "Opened",
			clicked: "Clicked",
			failed: "Failed",
			bounced: "Bounced",
		};
		return statusLabels[status] || status;
	};

	const getEmailTypeLabel = (type: string) => {
		const typeLabels: Record<string, string> = {
			review_request: "Review Request",
			reward_delivery: "Reward Delivery",
			review_rejection: "Review Rejection",
		};
		return typeLabels[type] || type;
	};

	const formatDate = (date: string | Date | null) => {
		if (!date) return 'N/A';
		return new Date(date).toLocaleString();
	};

	const formatMetadata = (metadata: unknown) => {
		if (!metadata) return 'N/A';
		if (typeof metadata === 'object') {
			return JSON.stringify(metadata, null, 2);
		}
		return String(metadata);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Email Log Details</DialogTitle>
					<DialogDescription>
						Complete information about this email log entry
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Recipient */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Recipient</Label>
						<div className="text-sm text-gray-12">{emailLog.recipient}</div>
					</div>

					{/* Email Type */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Email Type</Label>
						<div className="text-sm text-gray-12">{getEmailTypeLabel(emailLog.emailType)}</div>
					</div>

					{/* Subject */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Subject</Label>
						<div className="text-sm text-gray-12">{emailLog.subject || 'N/A'}</div>
					</div>

					{/* Status */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Status</Label>
						<div className={`text-sm font-medium ${getStatusColor(emailLog.status)}`}>
							{getStatusLabel(emailLog.status)}
						</div>
					</div>

					{/* Error Message (if failed) */}
					{emailLog.errorMessage && (
						<div className="grid gap-2">
							<Label className="text-sm font-semibold text-red-600">Error Message</Label>
							<div className="text-sm text-red-600 bg-red-a2 border border-red-a4 p-3 rounded-md whitespace-pre-wrap break-words">
								{emailLog.errorMessage}
							</div>
						</div>
					)}

					{/* SendGrid Message ID */}
					{emailLog.sendgridMessageId && (
						<div className="grid gap-2">
							<Label className="text-sm font-semibold">SendGrid Message ID</Label>
							<div className="text-sm text-gray-12 font-mono break-all">{emailLog.sendgridMessageId}</div>
						</div>
					)}

					{/* Review ID */}
					{emailLog.reviewId && (
						<div className="grid gap-2">
							<Label className="text-sm font-semibold">Review ID</Label>
							<div className="text-sm text-gray-12 font-mono break-all">{emailLog.reviewId}</div>
						</div>
					)}

					{/* Created At */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Sent At</Label>
						<div className="text-sm text-gray-12">{formatDate(emailLog.createdAt)}</div>
					</div>

					{/* Metadata */}
					{emailLog.metadata && (
						<div className="grid gap-2">
							<Label className="text-sm font-semibold">Metadata</Label>
							<div className="text-xs text-gray-12 bg-gray-a2 border border-gray-a4 p-3 rounded-md font-mono whitespace-pre-wrap break-words overflow-x-auto">
								{formatMetadata(emailLog.metadata)}
							</div>
						</div>
					)}

					{/* Email Log ID */}
					<div className="grid gap-2">
						<Label className="text-sm font-semibold">Email Log ID</Label>
						<div className="text-xs text-gray-10 font-mono break-all">{emailLog.id}</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

