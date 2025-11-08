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

export const columns: ColumnDef<Review>[] = [
	{
		accessorKey: "customerName",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					Customer Name
					<ArrowUpDown className="h-4 w-4" />
				</button>
			);
		},
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue("customerName")}</div>
		),
	},
	{
		accessorKey: "productName",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					Product
					<ArrowUpDown className="h-4 w-4" />
				</button>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					Status
					<ArrowUpDown className="h-4 w-4" />
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
				pending_submission: "Pending Submission",
				pending_approval: "Pending Approval",
				approved: "Approved",
				rejected: "Rejected",
			};
			return (
				<span className={statusColors[status] || "text-gray-10"}>
					{statusLabels[status] || status}
				</span>
			);
		},
	},
	{
		accessorKey: "rating",
		header: "Rating",
		cell: ({ row }) => {
			const rating = row.getValue("rating") as number | null;
			return rating ? (
				<div className="flex items-center gap-1">
					<span>{rating}</span>
					<span className="text-yellow-600">★</span>
				</div>
			) : (
				<span className="text-gray-10">-</span>
			);
		},
	},
	{
		accessorKey: "fileType",
		header: "Type",
		cell: ({ row }) => {
			const fileType = row.getValue("fileType") as string | null;
			return fileType ? (
				<span className="capitalize">{fileType}</span>
			) : (
				<span className="text-gray-10">-</span>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					Created At
					<ArrowUpDown className="h-4 w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string | null;
			return date ? (
				<span>{new Date(date).toLocaleDateString()}</span>
			) : (
				<span className="text-gray-10">-</span>
			);
		},
	},
];

interface ReviewsTableProps {
	data: Review[];
}

export function ReviewsTable({ data }: ReviewsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "createdAt",
			desc: true, // Default to descending (newest first)
		},
	]);

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

	return (
		<div className="w-full">
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
			<div className="flex items-center justify-between px-2 py-4">
				<div className="text-sm text-gray-10">
					{table.getFilteredRowModel().rows.length} of {data.length} row(s)
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="classic"
						size="3"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<div className="text-sm text-gray-10">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</div>
					<Button
						variant="classic"
						size="3"
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

