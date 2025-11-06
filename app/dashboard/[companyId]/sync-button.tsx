"use client";

import { useState, useTransition } from "react";
import { Button } from "@whop/react/components";
import { syncProducts } from "@/app/actions/products";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface SyncResult {
	success: true;
	added: number;
	updated: number;
	deleted: number;
	total: number;
}

export function SyncButton({ companyId }: { companyId: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleSync() {
		setError(null);
		setSyncResult(null);
		setIsDialogOpen(false);
		startTransition(async () => {
			try {
				const result = await syncProducts(companyId);
				setSyncResult(result);
				setIsDialogOpen(true);
				router.refresh();
			} catch (e) {
				setError((e as { message?: string }).message || "Failed to sync products");
				setIsDialogOpen(true);
			}
		});
	}

	return (
		<>
			<Button
				variant="classic"
				size="3"
				onClick={handleSync}
				disabled={isPending}
			>
				{isPending ? "Syncing..." : "Sync Products"}
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{error ? "Sync Failed" : "Sync Completed"}
						</DialogTitle>
						<DialogDescription>
							{error
								? "An error occurred while syncing products."
								: "Products have been successfully synced with Whop."}
						</DialogDescription>
					</DialogHeader>

					{error ? (
						<div className="py-4">
							<p className="text-red-10 text-sm">{error}</p>
						</div>
					) : syncResult ? (
						<div className="py-4 space-y-3">
							<div className="flex items-center justify-between p-3 bg-gray-a3 rounded-lg">
								<span className="text-sm text-gray-11">Products Added</span>
								<span className="text-sm font-semibold text-green-10">
									{syncResult.added}
								</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-gray-a3 rounded-lg">
								<span className="text-sm text-gray-11">Products Updated</span>
								<span className="text-sm font-semibold text-blue-10">
									{syncResult.updated}
								</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-gray-a3 rounded-lg">
								<span className="text-sm text-gray-11">Products Deleted</span>
								<span className="text-sm font-semibold text-red-10">
									{syncResult.deleted}
								</span>
							</div>
							<div className="flex items-center justify-between pt-2 border-t border-gray-a4">
								<span className="text-sm font-medium text-gray-12">
									Total Products
								</span>
								<span className="text-sm font-semibold text-gray-12">
									{syncResult.total}
								</span>
							</div>
						</div>
					) : null}

					<DialogFooter>
						<Button
							variant="classic"
							size="3"
							onClick={() => setIsDialogOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

