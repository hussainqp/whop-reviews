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
import { ReviewDetailDialog } from "./review-detail-dialog";
import type { Review } from "./types";

export const columns: ColumnDef<Review>[] = [
	{
		accessorKey: "customerName",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Customer</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => (
			<div className="font-medium text-xs sm:text-sm">{row.getValue("customerName")}</div>
		),
	},
	{
		accessorKey: "productName",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Product</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => (
			<div className="text-xs sm:text-sm">{row.getValue("productName")}</div>
		),
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
				pending_submission: "text-yellow-600",
				pending_approval: "text-orange-600",
				approved: "text-green-600",
				rejected: "text-red-600",
			};
			const statusLabels: Record<string, string> = {
				pending_submission: "Pending",
				pending_approval: "Pending",
				approved: "Approved",
				rejected: "Rejected",
			};
			return (
				<span className={`text-xs sm:text-sm ${statusColors[status] || "text-gray-10"}`}>
					{statusLabels[status] || status}
				</span>
			);
		},
	},
	{
		accessorKey: "rating",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap hidden md:inline">Rating</span>,
		cell: ({ row }) => {
			const rating = row.getValue("rating") as number | null;
			return rating ? (
				<div className="hidden md:flex items-center gap-1">
					<span className="text-xs sm:text-sm">{rating}</span>
					<span className="text-yellow-600 text-xs sm:text-sm">★</span>
				</div>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm hidden md:inline">-</span>
			);
		},
	},
	{
		accessorKey: "fileType",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap hidden md:inline">Type</span>,
		cell: ({ row }) => {
			const fileType = row.getValue("fileType") as string | null;
			return fileType ? (
				<span className="capitalize text-xs sm:text-sm hidden md:inline">{fileType}</span>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm hidden md:inline">-</span>
			);
		},
	},
	{
		accessorKey: "submittedAt",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hidden md:flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Submitted</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("submittedAt") as string | null;
			return date ? (
				<span className="text-xs sm:text-sm whitespace-nowrap hidden md:inline">{new Date(date).toLocaleDateString()}</span>
			) : (
				<span className="text-gray-10 text-xs sm:text-sm hidden md:inline">-</span>
			);
		},
	},
];

interface ReviewsTableProps {
	data: Review[];
	status: 'pending_approval' | 'approved' | 'rejected';
}

export function ReviewsTable({ data, status }: ReviewsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "submittedAt",
			desc: true, // Default to descending (newest first)
		},
	]);
	const [selectedReview, setSelectedReview] = React.useState<Review | null>(null);

	const table = useReactTable({
		data,
		columns,
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

	const handleRowClick = (review: Review) => {
		setSelectedReview(review);
	};

	const statusColors: Record<string, string> = {
		pending_submission: "text-yellow-600",
		pending_approval: "text-orange-600",
		approved: "text-green-600",
		rejected: "text-red-600",
	};
	const statusLabels: Record<string, string> = {
		pending_submission: "Pending",
		pending_approval: "Pending",
		approved: "Approved",
		rejected: "Rejected",
	};

	return (
		<>
			{/* Mobile Card View */}
			<div className="md:hidden space-y-3">
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) => {
						const review = row.original;
						return (
							<div
								key={row.id}
								onClick={() => handleRowClick(review)}
								className="rounded-md border border-gray-a4 bg-gray-a2 p-4 cursor-pointer hover:bg-gray-a3 transition-colors"
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm text-gray-12 truncate">
												{review.customerName}
											</div>
											<div className="text-xs text-gray-10 mt-0.5 truncate">
												{review.productName}
											</div>
										</div>
										<span className={`text-xs font-medium whitespace-nowrap ${statusColors[review.status] || "text-gray-10"}`}>
											{statusLabels[review.status] || review.status}
										</span>
									</div>
									{(review.rating || review.fileType || review.submittedAt) && (
										<div className="flex flex-wrap items-center gap-3 text-xs text-gray-10">
											{review.rating && (
												<div className="flex items-center gap-1">
													<span>{review.rating}</span>
													<span className="text-yellow-600">★</span>
												</div>
											)}
											{review.fileType && (
												<span className="capitalize">{review.fileType}</span>
											)}
											{review.submittedAt && (
												<span>{new Date(review.submittedAt).toLocaleDateString()}</span>
											)}
										</div>
									)}
								</div>
							</div>
						);
					})
				) : (
					<div className="rounded-md border border-gray-a4 bg-gray-a2 p-8 text-center">
						<p className="text-sm text-gray-10">No reviews found.</p>
					</div>
				)}
			</div>

			{/* Desktop Table View */}
			<div className="hidden md:block w-full">
				<div className="rounded-md border border-gray-a4">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
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
										onClick={() => handleRowClick(row.original)}
										className="cursor-pointer hover:bg-gray-a3 transition-colors"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No reviews found.
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

			{selectedReview && (
				<ReviewDetailDialog
					review={selectedReview}
					open={!!selectedReview}
					onOpenChange={(open: boolean) => !open && setSelectedReview(null)}
					status={status}
				/>
			)}
		</>
	);
}

