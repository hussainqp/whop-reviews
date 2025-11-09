"use client";

import * as React from "react";
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

	return (
		<div className="w-full">
			<div className="overflow-x-auto -mx-4 sm:mx-0 md:mx-0">
				<div className="flex justify-center md:justify-start md:w-full">
					<div className="rounded-md border border-gray-a4 min-w-[400px] sm:min-w-[600px] md:min-w-0 md:w-full">
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
		</div>
	);
}

