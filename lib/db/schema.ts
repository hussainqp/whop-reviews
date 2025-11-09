import { pgTable, index, timestamp, integer, boolean, text, jsonb, uuid } from 'drizzle-orm/pg-core';

// Reusable timestamp columns
const timestamps = {
	createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).$onUpdate(() => new Date().toISOString()).notNull().defaultNow(),
};


// ============================================================================
// MERCHANTS TABLE
// ============================================================================
export const merchants = pgTable('merchants', {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: text('company_id').notNull().unique(), // Whop company/merchant ID
	email: text('email'),
	name: text('name'), // Merchant business name
	
	// Subscription & billing
	creditBalance: integer('credit_balance').notNull().default(10),
	whopSubscriptionId: text('whop_subscription_id'),
	
	// Custom domain email settings (Pro feature)
	customDomain: text('custom_domain'),
	customDomainVerified: boolean('custom_domain_verified').default(false),
	
	// Email template IDs (SendGrid)
	reviewRequestTemplateId: text('review_request_template_id'),
	rewardDeliveryTemplateId: text('reward_delivery_template_id'),
	
	// Review display settings
	reviewDisplayFormat: text('review_display_format', { 
		enum: ['grid', 'list', 'cards'] 
	}).notNull().default('grid'),
	
	...timestamps,
}, (table: any) => ({
	companyIdIdx: index('merchants_company_id_idx').on(table.companyId)
}));

// ============================================================================
// PRODUCT CONFIGS TABLE
// ============================================================================
export const productConfigs = pgTable('product_configs', {
	id: uuid("id").primaryKey().defaultRandom(),
	merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
	whopProductId: text('whop_product_id').notNull().unique(),
	productName: text('product_name').notNull(),
	
	// Product visibility/status from Whop
	status: text('status', { enum: ['visible', 'hidden', 'archived', 'quick_link'] }).notNull().default('visible'),
	
	// Campaign settings
	isEnabled: boolean('is_enabled').notNull().default(false),
	reviewType: text('review_type', { enum: ['photo', 'video', 'any'] }).notNull().default('any'),
	
	// Discount configuration
	promoCode: text('promo_code'), // Whop promo ID for tracking
	promoCodeName: text('promo_code_name'), // Promo code name for display
	
	...timestamps,
}, (table: any) => ({
	merchantProductIdx: index('product_configs_merchant_product_idx').on(table.merchantId, table.whopProductId),
	merchantEnabledIdx: index('product_configs_merchant_enabled_idx').on(table.merchantId, table.isEnabled),
	whopProductIdIdx: index('product_configs_whop_product_id_idx').on(table.whopProductId),
	statusIdx: index('product_configs_status_idx').on(table.status),
}));

// ============================================================================
// REVIEWS TABLE
// ============================================================================
export const reviews = pgTable('reviews', {
	id: uuid("id").primaryKey().defaultRandom(),
	merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
	productConfigId: uuid('product_config_id').notNull().references(() => productConfigs.id, { onDelete: 'cascade' }),
	
	// Customer information
	customerEmail: text('customer_email'),
	customerName: text('customer_name').notNull(),
	customerWhopId: text('customer_whop_id').notNull(), // Whop user ID
	
	// Review status workflow
	status: text('status', { 
		enum: ['pending_submission', 'pending_approval', 'approved', 'rejected'] 
	}).notNull().default('pending_submission'),
	
	// Submission token & expiry
	submissionToken: text('submission_token').notNull().unique(),
	tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
	
	// Review content
	fileUrl: text('file_url'), // Supabase Storage path
	fileType: text('file_type', { enum: ['photo', 'video'] }),
	comment: text('comment'),
	rating: integer('rating'), // Optional 1-5 star rating
	
	// Reward/promo code
	promoCodeSent: text('promo_code_sent'),
	promoCodeId: text('promo_code_id'), // Whop promo ID for tracking
	
	// Rejection handling
	rejectionReason: text('rejection_reason'),
	
	// Timestamps for each status
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	submittedAt: timestamp('submitted_at', { withTimezone: true }),
	approvedAt: timestamp('approved_at', { withTimezone: true }),
	rejectedAt: timestamp('rejected_at', { withTimezone: true }),
}, (table: any) => ({
	merchantStatusIdx: index('reviews_merchant_status_idx').on(table.merchantId, table.status),
	tokenIdx: index('reviews_token_idx').on(table.submissionToken),
	merchantProductIdx: index('reviews_merchant_product_idx').on(table.merchantId, table.productConfigId),
	statusCreatedIdx: index('reviews_status_created_idx').on(table.status, table.createdAt),
}));

// ============================================================================
// PROCESSED EVENTS TABLE (Idempotency)
// ============================================================================
export const processedEvents = pgTable('processed_events', {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: text('event_id').notNull().unique(), // Whop webhook event ID
	eventType: text('event_type').notNull(),
	payload: jsonb('payload'), // Store full webhook payload for debugging
	processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table: any) => ({
	eventIdIdx: index('processed_events_event_id_idx').on(table.eventId),
	eventTypeIdx: index('processed_events_event_type_idx').on(table.eventType),
	processedAtIdx: index('processed_events_processed_at_idx').on(table.processedAt),
}));

// ============================================================================
// EMAIL LOGS TABLE
// ============================================================================
export const emailLogs = pgTable('email_logs', {
	id: uuid("id").primaryKey().defaultRandom(),
	merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
	reviewId: uuid('review_id'),
	
	// Email details
	emailType: text('email_type', { enum: ['review_request', 'reward_delivery', 'review_rejection'] }).notNull(),
	recipient: text('recipient').notNull(),
	subject: text('subject'),
	
	// Delivery status
	status: text('status', { enum: ['sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'] }).notNull(),
	sendgridMessageId: text('sendgrid_message_id'),
	errorMessage: text('error_message'),
	
	// Metadata
	metadata: jsonb('metadata'), // Additional tracking data
	
	...timestamps,
}, (table: any) => ({
	merchantEmailTypeIdx: index('email_logs_merchant_email_type_idx').on(table.merchantId, table.emailType),
	reviewIdIdx: index('email_logs_review_id_idx').on(table.reviewId),
	statusIdx: index('email_logs_status_idx').on(table.status),
	createdAtIdx: index('email_logs_created_at_idx').on(table.createdAt),
}));


// ============================================================================
// TYPE EXPORTS (for TypeScript inference)
// ============================================================================
export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;

export type ProductConfig = typeof productConfigs.$inferSelect;
export type NewProductConfig = typeof productConfigs.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type ProcessedEvent = typeof processedEvents.$inferSelect;
export type NewProcessedEvent = typeof processedEvents.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
