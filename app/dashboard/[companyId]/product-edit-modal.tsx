"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@whop/react/components";
import { Switch } from "@/components/ui/switch";
import { updateProductConfig } from "@/app/actions/products";
import { getPromoCodes } from "@/app/actions/promo";
import { useRouter } from "next/navigation";

type ProductConfig = {
	id: string;
	isEnabled: boolean;
	reviewType: "photo" | "video" | "any" | null;
	promoCode: string | null;
	promoCodeName: string | null;
};

interface ProductEditModalProps {
	product: ProductConfig | null;
	open: boolean;
	companyId: string;
	onOpenChange: (open: boolean) => void;
	onSave?: () => void;
}

export function ProductEditModal({
	product,
	open,
	companyId,
	onOpenChange,
	onSave,
}: ProductEditModalProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [promoCodes, setPromoCodes] = useState<Array<{ id: string; code: string }>>([]);
	const [isLoadingPromoCodes, setIsLoadingPromoCodes] = useState(false);

	const [formData, setFormData] = useState({
		isEnabled: product?.isEnabled ?? false,
		reviewType: product?.reviewType ?? "any",
		promoCode: product?.promoCode ?? "",
		promoCodeName: product?.promoCodeName ?? "",
	});

	// Fetch promo codes when modal opens
	React.useEffect(() => {
		if (open && companyId) {
			setIsLoadingPromoCodes(true);
			getPromoCodes(companyId)
				.then((response) => {
					// Only show active promo codes (already filtered in getPromoCodes)
					const codes = response.data.map((pc: any) => ({
						id: pc.id,
						code: pc.code,
					}));
					setPromoCodes(codes);

					// Auto-select promo code if it matches one in the list (by ID)
					// If the product's promo code is not in the active list, clear it
					if (product?.promoCode && codes.length > 0) {
						const matchingPromo = codes.find((pc) => pc.id === product.promoCode);
						if (matchingPromo) {
							// Promo code ID from DB matches one in the active list - keep it selected
							setFormData((prev) => ({
								...prev,
								promoCode: matchingPromo.id,
								promoCodeName: matchingPromo.code,
							}));
						} else {
							// Promo code ID from DB doesn't match any active promo code - clear it
							setFormData((prev) => ({
								...prev,
								promoCode: "",
								promoCodeName: "",
							}));
						}
					} else if (product?.promoCode && codes.length === 0) {
						// No active promo codes available, clear the selected one
						setFormData((prev) => ({
							...prev,
							promoCode: "",
							promoCodeName: "",
						}));
					}
				})
				.catch((err) => {
					// Don't throw error - just log and show empty state with helpful message
					console.error("Failed to fetch promo codes:", err);
					setPromoCodes([]);
				})
				.finally(() => {
					setIsLoadingPromoCodes(false);
				});
		}
	}, [open, companyId, product?.promoCode]);

	// Update form data when product changes
	React.useEffect(() => {
		if (product) {
			setFormData({
				isEnabled: product.isEnabled ?? false,
				reviewType: product.reviewType ?? "any",
				promoCode: product.promoCode ?? "",
				promoCodeName: product.promoCodeName ?? "",
			});
			setError(null);
		}
	}, [product]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!product) return;

		// Validate required fields
		if (!formData.reviewType) {
			setError("Review type is required");
			return;
		}

		// Validate promo code - only required if product is being enabled
		if (formData.isEnabled) {
			// Product is enabled - promo code is required
			if (promoCodes.length === 0 && !isLoadingPromoCodes) {
				setError("Promo codes are not available. Please create a promo code in your Whop dashboard first.");
				return;
			}

			// Check if selected promo code ID exists in the list
			const selectedPromoExists = promoCodes.some((pc) => pc.id === formData.promoCode);
			
			if (!formData.promoCode || formData.promoCode.trim() === "" || !selectedPromoExists) {
				setError("Please select a valid promo code from the list. Promo code is required when product is enabled.");
				return;
			}
		}
		// If product is disabled, promo code is optional - no validation needed

		startTransition(async () => {
			try {
				await updateProductConfig(product.id, {
					isEnabled: formData.isEnabled,
					reviewType: formData.reviewType as "photo" | "video" | "any",
					promoCode: formData.promoCode.trim() || null,
					promoCodeName: formData.promoCodeName.trim() || null,
				});
				onOpenChange(false);
				// Call onSave callback if provided
				if (onSave) {
					onSave();
				}
				// Force a hard refresh to update the table data
				router.refresh();
			} catch (e) {
				const errorMessage = (e as { message?: string }).message || "Failed to update product";
				setError(errorMessage);
				console.error("Error updating product:", e);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Product Configuration</DialogTitle>
					<DialogDescription>
						Update the product settings for review campaigns.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="flex items-center justify-between gap-4 p-4 border border-gray-a4 rounded-lg bg-gray-a2">
							<div className="flex flex-col gap-1">
								<Label htmlFor="isEnabled" className="text-base font-semibold">
									Status
								</Label>
								<span className="text-sm text-gray-10">
									{formData.isEnabled ? "Product is enabled" : "Product is disabled"}
								</span>
							</div>
							<div className="relative">
								<Switch
									id="isEnabled"
									checked={formData.isEnabled}
									onCheckedChange={(checked) =>
										setFormData({ ...formData, isEnabled: checked })
									}
									className="!data-[state=checked]:!bg-[#22c55e] !data-[state=unchecked]:!bg-[#ef4444]"
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="reviewType">Review Type</Label>
							<Select
								value={formData.reviewType}
								onValueChange={(value) =>
									setFormData({ ...formData, reviewType: value as "photo" | "video" | "any" })
								}
							>
								<SelectTrigger id="reviewType">
									<SelectValue placeholder="Select review type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="photo">Photo</SelectItem>
									<SelectItem value="video">Video</SelectItem>
									<SelectItem value="any">Any</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="promoCode">
								Promo Code {formData.isEnabled && <span className="text-red-600">*</span>}
							</Label>
							<Select
								value={formData.promoCode || undefined}
								onValueChange={(value) => {
									const selectedPromo = promoCodes.find((pc) => pc.id === value);
									setFormData({ 
										...formData, 
										promoCode: selectedPromo?.id || "",
										promoCodeName: selectedPromo?.code || "",
									});
								}}
								disabled={isLoadingPromoCodes || (promoCodes.length === 0 && !isLoadingPromoCodes)}
							>
								<SelectTrigger id="promoCode">
									<SelectValue placeholder={isLoadingPromoCodes ? "Loading promo codes..." : promoCodes.length === 0 ? "No promo codes available" : formData.isEnabled ? "Select a promo code (required)" : "Select a promo code (optional)"} />
								</SelectTrigger>
								{promoCodes.length > 0 && (
									<SelectContent>
										{promoCodes.map((pc) => (
											<SelectItem key={pc.id} value={pc.id}>
												{pc.code}
											</SelectItem>
										))}
									</SelectContent>
								)}
							</Select>
							{formData.isEnabled && promoCodes.length === 0 && !isLoadingPromoCodes && (
								<p className="text-xs text-red-600">
									Promo code is required when product is enabled.{" "}
									<a
										href="https://apps.whop.com/billing/promotions"
										target="_blank"
										rel="noopener noreferrer"
										className="underline hover:text-red-700"
									>
										Create a promo code in your Whop dashboard
									</a>
								</p>
							)}
							{!formData.isEnabled && (
								<p className="text-xs text-gray-10">
									Promo code is optional when product is disabled
								</p>
							)}
						</div>

						{error && (
							<div className="text-sm text-red-10 bg-red-a2 border border-red-a4 p-2 rounded">
								{error}
							</div>
						)}
					</div>

					<DialogFooter className="pt-4">
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
							className="px-4 py-2 rounded-md border border-gray-a4 bg-gray-a2 hover:bg-gray-a3 text-gray-12 disabled:opacity-50 transition-colors"
						>
							Cancel
						</button>
						<Button 
							type="submit" 
							variant="classic" 
							disabled={
								isPending || 
								// Only require promo code validation if product is enabled
								(formData.isEnabled && (
									(promoCodes.length === 0 && !isLoadingPromoCodes) ||
									(promoCodes.length > 0 && (!formData.promoCode || !promoCodes.some((pc) => pc.id === formData.promoCode)))
								))
							}
							className="px-6 py-2"
						>
							{isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

