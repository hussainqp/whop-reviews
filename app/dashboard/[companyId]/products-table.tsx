"use client";

import * as React from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ProductEditModal } from "./product-edit-modal";

type ProductConfig = {
	id: string;
	whopProductId: string;
	productName: string;
	status: "visible" | "hidden" | "archived" | "quick_link";
	isEnabled: boolean;
	reviewType: "photo" | "video" | "any" | null;
	promoCode: string | null;
	promoCodeName: string | null;
};

export const columns: ColumnDef<ProductConfig>[] = [
	{
		accessorKey: "productName",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Product Name</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => <div className="font-medium text-xs sm:text-sm">{row.getValue("productName")}</div>,
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hidden md:flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Status</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const status = row.getValue("status") as "visible" | "hidden" | "archived" | "quick_link";
			const statusColors: Record<string, { bg: string; text: string }> = {
				visible: { bg: "#22c55e", text: "Visible" },
				hidden: { bg: "#6b7280", text: "Hidden" },
				archived: { bg: "#9ca3af", text: "Archived" },
				quick_link: { bg: "#3b82f6", text: "Quick Link" },
			};
			const statusColor = statusColors[status] || statusColors.visible;
			return (
				<div className="hidden md:flex items-center gap-2">
					<div
						className="h-4 w-4 rounded-full"
						style={{
							backgroundColor: statusColor.bg,
						}}
					/>
					<span className="capitalize text-xs sm:text-sm">{statusColor.text}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "reviewType",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hidden md:flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Review Type</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const type = row.getValue("reviewType") as string | null;
			return <div className="capitalize text-xs sm:text-sm hidden md:block">{type ?? "—"}</div>;
		},
	},
	{
		accessorKey: "isEnabled",
		header: ({ column }) => {
			return (
				<button
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity text-xs sm:text-sm"
				>
					<span className="whitespace-nowrap">Enabled</span>
					<ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
				</button>
			);
		},
		cell: ({ row }) => {
			const isEnabled = row.getValue("isEnabled") as boolean;
			return (
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 sm:h-4 sm:w-4 rounded-full"
						style={{
							backgroundColor: isEnabled ? "#22c55e" : "#ef4444",
						}}
					/>
					<span className="capitalize text-xs sm:text-sm">{isEnabled ? "Yes" : "No"}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "promoCodeName",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap hidden md:inline">Promo Code</span>,
		cell: ({ row }) => {
			const code = row.getValue("promoCodeName") as string | null;
			return <div className="font-mono text-xs sm:text-sm hidden md:block">{code ?? "—"}</div>;
		},
	},
	{
		id: "actions",
		header: () => <span className="text-xs sm:text-sm whitespace-nowrap">Actions</span>,
		cell: ({ row }) => {
			// This will be handled by the component
			return null;
		},
	},
];

interface ProductsTableProps {
	data: ProductConfig[];
	isLoading?: boolean;
	companyId: string;
}

export function ProductsTable({ data, isLoading = false, companyId }: ProductsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [editingProduct, setEditingProduct] = React.useState<ProductConfig | null>(null);
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const handleEdit = (product: ProductConfig) => {
		setEditingProduct(product);
		setIsModalOpen(true);
	};

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
		},
	});

	if (isLoading) {
		return (
			<div className="w-full flex items-center justify-center py-12">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-gray-10" />
					<p className="text-sm text-gray-10">Loading products...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-4 gap-4">
				<Input
					placeholder="Filter by product name..."
					value={(table.getColumn("productName")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("productName")?.setFilterValue(event.target.value)
					}
					className="w-full sm:max-w-sm"
				/>
			</div>
			<div className="rounded-md border border-gray-a4 overflow-x-auto -mx-4 sm:mx-0">
				<div className="min-w-[400px] sm:min-w-[600px]">
					<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
									if (header.id === "actions") {
										return (
											<TableHead key={header.id} className="w-[100px] sm:w-[150px]">
												Actions
											</TableHead>
										);
									}
									return (
										<TableHead key={header.id} className={header.id === "status" || header.id === "reviewType" || header.id === "promoCodeName" ? "hidden md:table-cell" : ""}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
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
									{row.getVisibleCells().map((cell) => {
									if (cell.column.id === "actions") {
										const product = row.original;
										return (
											<TableCell key={cell.id}>
												<button
													onClick={() => handleEdit(product)}
													className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-gray-a3 transition-colors text-gray-10"
													type="button"
													title="Edit product"
												>
													<Edit className="h-3 w-3 sm:h-4 sm:w-4" />
													<span className="sr-only">Edit</span>
												</button>
											</TableCell>
										);
									}
									return (
										<TableCell 
											key={cell.id}
											className={cell.column.id === "status" || cell.column.id === "reviewType" || cell.column.id === "promoCodeName" ? "hidden md:table-cell" : ""}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									);
								})}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length + 1} className="h-24 text-center">
									No products found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				</div>
			</div>
			<div className="flex-1 text-xs sm:text-sm text-gray-10">
				{table.getFilteredRowModel().rows.length} of {data.length} row(s)
			</div>

			<ProductEditModal
				product={editingProduct}
				open={isModalOpen}
				companyId={companyId}
				onOpenChange={(open) => {
					setIsModalOpen(open);
					if (!open) {
						setEditingProduct(null);
					}
				}}
				onSave={() => {
					// Table will refresh via router.refresh() in the modal
				}}
			/>
		</div>
	);
}

