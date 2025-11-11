"use client";

import * as React from "react";
import { useState } from "react";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@whop/react/components";
import { EmailLogDetailDialog } from "./email-log-detail-dialog";

type EmailLog = {
	id: string;
	emailType: 'review_request' | 'reward_delivery' | 'review_rejection';
	recipient: string;
	subject: string | null;
	status: 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';
	errorMessage: string | null;
	createdAt: string | Date | null;
	reviewId: string | null;
};

export const emailLogColumns: ColumnDef<EmailLog>[] = [
	{
		accessorKey: "recipient",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Recipient</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => (
			<div className="font-medium text-xs sm:text-sm">{row.getValue("recipient")}</div>
		),
	},
	{
		accessorKey: "emailType",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Type</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const type = row.getValue("emailType") as string;
			const typeLabels: Record<string, string> = {
				review_request: "Review Request",
				reward_delivery: "Reward Delivery",
				review_rejection: "Review Rejection",
			};
			return (
				<span className="text-xs sm:text-sm capitalize">
					{typeLabels[type] || type}
				</span>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Status</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			const statusColors: Record<string, string> = {
				sent: "text-blue-600",
				delivered: "text-green-600",
				opened: "text-green-700",
				clicked: "text-green-800",
				failed: "text-red-600",
				bounced: "text-orange-600",
			};
			const statusLabels: Record<string, string> = {
				sent: "Sent",
				delivered: "Delivered",
				opened: "Opened",
				clicked: "Clicked",
				failed: "Failed",
				bounced: "Bounced",
			};
			return (
				<span className={`text-xs sm:text-sm ${statusColors[status] || "text-gray-10"}`}>
					{statusLabels[status] || status}
				</span>
			);
		},
	},
	{
		accessorKey: "subject",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap hidden md:inline">Subject</span>,
		cell: ({ row }) => {
			const subject = row.getValue("subject") as string | null;
			return subject ? (
				<span className="text-xs sm:text-sm hidden md:inline line-clamp-1">{subject}</span>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm hidden md:inline">-</span>
			);
		},
	},
	{
		accessorKey: "errorMessage",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap hidden lg:inline">Error</span>,
		cell: ({ row }) => {
			const error = row.getValue("errorMessage") as string | null;
			return error ? (
				<span className="text-xs sm:text-sm text-red-600 hidden lg:inline line-clamp-2" title={error}>
					{error}
				</span>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm hidden lg:inline">-</span>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Sent At</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string | Date | null;
			return date ? (
				<span className="text-xs sm:text-sm whitespace-nowrap">
					{new Date(date).toLocaleString()}
				</span>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm">-</span>
			);
		},
	},
];

interface EmailLogsTableProps {
	data: EmailLog[];
}

export function EmailLogsTable({ data }: EmailLogsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "createdAt",
			desc: true, // Default to descending (newest first)
		},
	]);
	const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

	const table = useReactTable({
		data,
		columns: emailLogColumns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
		state: {
			sorting,
		},
	});

	const statusColors: Record<string, string> = {
		sent: "text-blue-600",
		delivered: "text-green-600",
		opened: "text-green-700",
		clicked: "text-green-800",
		failed: "text-red-600",
		bounced: "text-orange-600",
	};
	const statusLabels: Record<string, string> = {
		sent: "Sent",
		delivered: "Delivered",
		opened: "Opened",
		clicked: "Clicked",
		failed: "Failed",
		bounced: "Bounced",
	};
	const typeLabels: Record<string, string> = {
		review_request: "Review Request",
		reward_delivery: "Reward Delivery",
		review_rejection: "Review Rejection",
	};

	return (
		<div className="w-full">
			{/* Mobile Card View */}
			<div className="md:hidden space-y-3">
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) => {
						const emailLog = row.original;
						return (
							<div
								key={row.id}
								onClick={() => setSelectedEmailLog(emailLog)}
								className="rounded-md border border-gray-a4 bg-gray-a2 p-4 cursor-pointer hover:bg-gray-a3 transition-colors"
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm text-gray-12 truncate">
												{emailLog.recipient}
											</div>
											<div className="text-xs text-gray-10 mt-0.5">
												{typeLabels[emailLog.emailType] || emailLog.emailType}
											</div>
										</div>
										<span className={`text-xs font-medium whitespace-nowrap ${statusColors[emailLog.status] || "text-gray-10"}`}>
											{statusLabels[emailLog.status] || emailLog.status}
										</span>
									</div>
									{(emailLog.subject || emailLog.errorMessage || emailLog.createdAt) && (
										<div className="flex flex-col gap-2 text-xs text-gray-10">
											{emailLog.subject && (
												<div className="line-clamp-1">
													<span className="font-medium">Subject: </span>
													{emailLog.subject}
												</div>
											)}
											{emailLog.errorMessage && (
												<div className="text-red-600 line-clamp-2">
													<span className="font-medium">Error: </span>
													{emailLog.errorMessage}
												</div>
											)}
											{emailLog.createdAt && (
												<div>
													<span className="font-medium">Sent: </span>
													{new Date(emailLog.createdAt).toLocaleString()}
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						);
					})
				) : (
					<div className="rounded-md border border-gray-a4 bg-gray-a2 p-8 text-center">
						<p className="text-sm text-gray-10">No email logs found.</p>
					</div>
				)}
			</div>

			{/* Desktop Table View */}
			<div className="hidden md:block w-full">
				<div className="rounded-md border border-gray-a4">
					<Table className="w-full">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className={
												header.id === "subject" || header.id === "errorMessage"
													? "hidden md:table-cell"
													: header.id === "errorMessage"
													? "hidden lg:table-cell"
													: ""
											}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										onClick={() => setSelectedEmailLog(row.original)}
										className="cursor-pointer hover:bg-gray-a3"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={
													cell.column.id === "subject" || cell.column.id === "errorMessage"
														? "hidden md:table-cell"
														: cell.column.id === "errorMessage"
														? "hidden lg:table-cell"
														: ""
												}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={emailLogColumns.length} className="h-24 text-center">
										No email logs found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			<div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
				<div className="text-xs sm:text-sm text-gray-10">
					{table.getFilteredRowModel().rows.length} of {data.length} row(s)
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="classic"
						size="2"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<div className="text-xs sm:text-sm text-gray-10">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</div>
					<Button
						variant="classic"
						size="2"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>

			{selectedEmailLog && (
				<EmailLogDetailDialog
					emailLog={selectedEmailLog}
					open={!!selectedEmailLog}
					onOpenChange={(open: boolean) => !open && setSelectedEmailLog(null)}
				/>
			)}
		</div>
	);
}

