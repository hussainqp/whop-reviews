'use server';

import db from "@/lib/db";
import { reviews, productConfigs, merchants } from "@/lib/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { getCompanyDataFromDB } from "./company";
import { sendEmail } from "./email";
import { render } from '@react-email/render';
import ReviewApprovalEmail from '@/components/email/review-approval-email';
import ReviewRejectionEmail from '@/components/email/review-rejection-email';

export async function getReviewByToken(submissionToken: string) {
	try {
		if (!submissionToken) {
			throw new Error("Submission token is required");
		}

		// Fetch review with product config
		const result = await db
			.select({
				review: reviews,
				productConfig: productConfigs,
			})
			.from(reviews)
			.innerJoin(productConfigs, eq(reviews.productConfigId, productConfigs.id))
			.where(eq(reviews.submissionToken, submissionToken))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		const { review, productConfig } = result[0];

		// Check if token is expired
		const now = new Date();
		const expiresAt = new Date(review.tokenExpiresAt);
		if (expiresAt < now) {
			return { error: "This link has expired" };
		}

		// Check if review is still pending submission
		if (review.status !== "pending_submission") {
			return { error: "This review has already been submitted" };
		}

		return {
			review: {
				id: review.id,
				customerName: review.customerName,
				customerEmail: review.customerEmail,
				status: review.status,
				submissionToken: review.submissionToken,
				tokenExpiresAt: review.tokenExpiresAt,
			},
			productConfig: {
				id: productConfig.id,
				productName: productConfig.productName,
				reviewType: productConfig.reviewType,
			},
		};
	} catch (err: unknown) {
		console.error('[GET REVIEW BY TOKEN] Error while fetching review by token:', err);
		throw new Error("Failed to fetch review by token");
	}
}

export async function submitReview(formData: FormData) {
	try {
		const file = formData.get("file") as File;
		const submissionToken = formData.get("submissionToken") as string;
		const comment = (formData.get("comment") as string) || null;
		const fileType = formData.get("fileType") as "photo" | "video";
		// TODO: get rating from formData
		const rating = formData.get("rating") as number | null;

		// Validate inputs
		if (!file || !submissionToken || !fileType) {
			throw new Error("Missing required fields");
		}

		// Validate token and get review
		const reviewRows = await db
			.select()
			.from(reviews)
			.where(
				and(
					eq(reviews.submissionToken, submissionToken),
					eq(reviews.status, "pending_submission")
				)
			)
			.limit(1);

		if (reviewRows.length === 0) {
			throw new Error("Invalid or expired token");
		}

		const review = reviewRows[0];

		// Check if token is expired
		const now = new Date();
		const expiresAt = new Date(review.tokenExpiresAt);
		if (expiresAt < now) {
			throw new Error("This link has expired");
		}

		// Generate unique file path
		const fileExtension = file.name.split(".").pop();
		const fileName = `${randomUUID()}.${fileExtension}`;
		const filePath = `${review.merchantId}/${review.id}/${fileName}`;

		// Upload file to Supabase Storage
		const fileBuffer = await file.arrayBuffer();
		const { error: uploadError } = await supabase.storage
			.from("reviews")
			.upload(filePath, fileBuffer, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) {
			console.error("[REVIEW SUBMIT] Upload error:", uploadError);
			throw new Error("Failed to upload file. Please try again.");
		}

		// Get public URL for the uploaded file
		const { data: urlData } = supabase.storage
			.from("reviews")
			.getPublicUrl(filePath);

		// Update review in database
		await db
			.update(reviews)
			.set({
				fileUrl: urlData.publicUrl,
				fileType: fileType,
				comment: comment,
				status: "pending_approval",
				rating: rating,
				submittedAt: new Date(),
			})
			.where(eq(reviews.id, review.id));

		return { success: true, message: "Review submitted successfully" };
	} catch (error) {
		console.error("[REVIEW SUBMIT] Error:", error);
		throw new Error('An error occurred while submitting the review');
	}
}

export async function getReviewsByStatus(
	companyId: string,
	status: "pending_approval" | "approved" | "rejected"
) {
	try {
		// Get merchant from companyId
		const merchant = await getCompanyDataFromDB(companyId);
		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// Fetch reviews with product config by status
		const result = await db
			.select({
				review: reviews,
				productConfig: productConfigs,
			})
			.from(reviews)
			.innerJoin(productConfigs, eq(reviews.productConfigId, productConfigs.id))
			.where(
				and(
					eq(reviews.merchantId, merchant.id),
					eq(reviews.status, status)
				)
			)
			.orderBy(desc(reviews.submittedAt));

		return result.map(({ review, productConfig }) => ({
			id: review.id,
			customerName: review.customerName,
			customerEmail: review.customerEmail,
			fileUrl: review.fileUrl,
			fileType: review.fileType,
			comment: review.comment,
			rating: review.rating,
			status: review.status,
			submittedAt: review.submittedAt ? review.submittedAt.toISOString() : null,
			productName: productConfig.productName,
		}));
	} catch (err: unknown) {
		console.error('[GET REVIEWS BY STATUS] Error while fetching reviews by status:', err);
		const message = (err as { message?: string })?.message || "Failed to fetch reviews";
		throw new Error(message);
	}
}

// Keep the old function for backwards compatibility
export async function getPendingReviews(companyId: string) {
	return getReviewsByStatus(companyId, "pending_approval");
}

export async function getApprovedReviewsByExperience(experienceId: string) {
	try {
		// Get merchant from experienceId (which should be companyId)
		const merchant = await getCompanyDataFromDB(experienceId);
		if (!merchant) {
			// Return empty array if merchant not found (for public-facing page)
			return [];
		}

		// Fetch approved reviews with product config
		const result = await db
			.select({
				review: reviews,
				productConfig: productConfigs,
			})
			.from(reviews)
			.innerJoin(productConfigs, eq(reviews.productConfigId, productConfigs.id))
			.where(
				and(
					eq(reviews.merchantId, merchant.id),
					eq(reviews.status, "approved")
				)
			)
			.orderBy(desc(reviews.approvedAt));

		return result.map(({ review, productConfig }) => ({
			id: review.id,
			customerName: review.customerName,
			customerEmail: review.customerEmail,
			fileUrl: review.fileUrl,
			fileType: review.fileType,
			comment: review.comment,
			rating: review.rating,
			status: review.status as "approved",
			approvedAt: review.approvedAt ? review.approvedAt.toISOString() : null,
			productName: productConfig.productName,
		}));
	} catch (err: unknown) {
		// Log error but return empty array for graceful degradation
		console.error('[GET APPROVED REVIEWS BY EXPERIENCE] Error while fetching approved reviews by experience:', err);
		return [];
	}
}

export async function approveReview(reviewId: string) {
	try {
		// Fetch review with product config and merchant info
		const result = await db
			.select({
				review: reviews,
				productConfig: productConfigs,
				merchant: merchants,
			})
			.from(reviews)
			.innerJoin(productConfigs, eq(reviews.productConfigId, productConfigs.id))
			.innerJoin(merchants, eq(reviews.merchantId, merchants.id))
			.where(eq(reviews.id, reviewId))
			.limit(1);

		if (result.length === 0) {
			throw new Error("Review not found");
		}

		const { review, productConfig, merchant } = result[0];

		// Check if review is in pending approval status
		if (review.status !== "pending_approval") {
			throw new Error("Review is not in pending approval status");
		}

		// Check if customer email is available
		if (!review.customerEmail) {
			console.log('[APPROVE REVIEW] Customer email not available, skipping email:', reviewId);
			// Still approve the review, just don't send email
			await db
				.update(reviews)
				.set({
					status: "approved",
					approvedAt: new Date(),
				})
				.where(eq(reviews.id, reviewId));

			return { success: true };
		}

		// Update review status first
		await db
			.update(reviews)
			.set({
				status: "approved",
				approvedAt: new Date(),
				promoCodeSent: productConfig.promoCodeName || null,
			})
			.where(eq(reviews.id, reviewId));

		// Send approval email with promo code if available
		if (productConfig.promoCode && productConfig.promoCodeName) {
			try {
				const emailHtml = await render(
					ReviewApprovalEmail({
						customerName: review.customerName,
						productName: productConfig.productName,
						promoCode: productConfig.promoCodeName,
						brandName: merchant.name || "Our Team",
					})
				);

				await sendEmail({
					to: review.customerEmail,
					subject: "Thank You for Your Review! 🎉",
					html: emailHtml,
					merchantId: merchant.id,
					reviewId: review.id,
					emailType: "reward_delivery",
					metadata: {
						productId: productConfig.whopProductId,
						productName: productConfig.productName,
						promoCode: productConfig.promoCode,
						promoCodeName: productConfig.promoCodeName,
					},
				});

				console.log('[APPROVE REVIEW] Approval email sent successfully:', reviewId);
			} catch (emailError) {
				console.error('[APPROVE REVIEW] Error sending approval email:', emailError);
				// Don't throw - review is already approved, email failure is non-critical
			}
		} else {
			console.log('[APPROVE REVIEW] No promo code configured for product, skipping email:', reviewId);
		}

		return { success: true };
	} catch (err: unknown) {
		console.error('[APPROVE REVIEW] Error while approving review:', err);
		const message = (err as { message?: string })?.message || "Failed to approve review";
		throw new Error(message);
	}
}

export async function rejectReview(reviewId: string, rejectionReason?: string) {
	try {
		// Fetch review with product config and merchant info
		const result = await db
			.select({
				review: reviews,
				productConfig: productConfigs,
				merchant: merchants,
			})
			.from(reviews)
			.innerJoin(productConfigs, eq(reviews.productConfigId, productConfigs.id))
			.innerJoin(merchants, eq(reviews.merchantId, merchants.id))
			.where(eq(reviews.id, reviewId))
			.limit(1);

		if (result.length === 0) {
			throw new Error("Review not found");
		}

		const { review, productConfig, merchant } = result[0];

		// Check if review is in pending approval status
		if (review.status !== "pending_approval") {
			throw new Error("Review is not in pending approval status");
		}

		// Update review status first
		await db
			.update(reviews)
			.set({
				status: "rejected",
				rejectionReason: rejectionReason || null,
				rejectedAt: new Date(),
			})
			.where(eq(reviews.id, reviewId));

		// Send rejection email if customer email is available
		if (review.customerEmail) {
			try {
				const emailHtml = await render(
					ReviewRejectionEmail({
						customerName: review.customerName,
						productName: productConfig.productName,
						rejectionReason: rejectionReason || undefined,
						brandName: merchant.name || "Our Team",
					})
				);

				await sendEmail({
					to: review.customerEmail,
					subject: "Update on Your Review Submission",
					html: emailHtml,
					merchantId: merchant.id,
					reviewId: review.id,
					emailType: "review_rejection",
					metadata: {
						productId: productConfig.whopProductId,
						productName: productConfig.productName,
						rejectionReason: rejectionReason || null,
					},
				});

				console.log('[REJECT REVIEW] Rejection email sent successfully:', reviewId);
			} catch (emailError) {
				console.error('[REJECT REVIEW] Error sending rejection email:', emailError);
				// Don't throw - review is already rejected, email failure is non-critical
			}
		} else {
			console.log('[REJECT REVIEW] Customer email not available, skipping email:', reviewId);
		}

		return { success: true };
	} catch (err: unknown) {
		console.error('[REJECT REVIEW] Error while rejecting review:', err);
		throw new Error("Failed to reject review");
	}
}

