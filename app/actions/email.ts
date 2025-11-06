'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import ReviewRequestEmail from '@/components/email/review-request-email';
import db from '@/lib/db';
import { emailLogs, merchants } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dQAuvrNY_3v15njhcNTWNjiCJQqnU544B');

interface SendEmailProps {
	to: string;
	subject: string;
	html?: string;
	// Template props (alternative to raw HTML)
	customerName?: string;
	productName?: string;
	promoDetails?: string;
	brandName?: string;
	reviewLink?: string;
	// Email logging
	merchantId?: string;
	reviewId?: string;
	emailType: 'review_request' | 'reward_delivery' | 'review_rejection';
	metadata?: Record<string, unknown>;
}

/**
 * Server action to send an email via Resend and log to emailLogs table
 * 
 * @param props - Email configuration
 * @param props.to - Recipient email address
 * @param props.subject - Email subject line
 * @param props.html - Raw HTML content (optional, if not using template)
 * @param props.customerName - Customer name for template
 * @param props.productName - Product name for template
 * @param props.promoDetails - Promo code details for template
 * @param props.brandName - Brand name for template
 * @param props.reviewLink - Review submission link
 * @param props.merchantId - Merchant ID for logging
 * @param props.reviewId - Review ID for logging (optional)
 * @param props.emailType - Type of email being sent
 * @param props.metadata - Additional metadata for logging
 * 
 * @returns Promise with result from Resend API
 */
export async function sendEmail(props: SendEmailProps) {
	let emailLogId: string | null = null;
	const { 
		to, 
		subject, 
		html, 
		customerName, 
		productName, 
		promoDetails, 
		brandName, 
		reviewLink,
		merchantId,
		reviewId,
		emailType,
		metadata
	} = props;

	try {
		if (!to || !subject) {
			throw new Error('Email "to" and "subject" are required');
		}

		// If template props are provided, render the React Email template
		// Otherwise, use the provided HTML
		let emailHtml = html;

		if (customerName && productName && promoDetails && brandName && reviewLink && !html) {
			emailHtml = await render(
				ReviewRequestEmail({
					customerName,
					productName,
					promoDetails,
					brandName,
					reviewLink,
				})
			);
		} else if (!emailHtml) {
			throw new Error('Either provide HTML content or all template props (customerName, productName, promoDetails, brandName, reviewLink)');
		}

		const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

		// Send email via Resend
		const result = await resend.emails.send({
			from: fromEmail,
			to,
			subject,
			html: emailHtml,
		});

		console.log('[SEND EMAIL] Email sent successfully:', result);

		// Log successful email send to emailLogs if merchantId is provided
		if (merchantId) {
			try {
				const messageId = result.data?.id || null;
				const [emailLog] = await db
					.insert(emailLogs)
					.values({
						merchantId,
						reviewId: reviewId || null,
						emailType,
						recipient: to,
						subject,
						status: 'sent',
						sendgridMessageId: messageId,
						metadata: metadata || null,
					})
					.returning({ id: emailLogs.id });

				emailLogId = emailLog.id;
				console.log('[SEND EMAIL] Email logged successfully:', emailLogId);
			} catch (logError) {
				console.error('[SEND EMAIL] Error logging email (email still sent):', logError);
				// Don't throw - email was sent successfully, logging failure is non-critical
			}
		}

		// Deduct credit from merchant
		await db
			.update(merchants)
			.set({ creditBalance: sql`${merchants.creditBalance} - 1` })
			.where(eq(merchants.id, merchantId as string));

		return {
			success: true,
			data: result,
			emailLogId,
		};
	} catch (error) {
		console.error('[SEND EMAIL] Error:', error);
		// Log failed email to emailLogs if merchantId is provided
		if (merchantId) {
			try {
				const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
				const [emailLog] = await db
					.insert(emailLogs)
					.values({
						merchantId,
						reviewId: reviewId || null,
						emailType,
						recipient: to,
						subject,
						status: 'failed',
						errorMessage,
						metadata: metadata || null,
					})
					.returning({ id: emailLogs.id });

				emailLogId = emailLog.id;
				console.log('[SEND EMAIL] Failed email logged:', emailLogId);
			} catch (logError) {
				console.error('[SEND EMAIL] Error logging failed email:', logError);
			}
		}
		throw new Error('Failed to send email');
	}
}
