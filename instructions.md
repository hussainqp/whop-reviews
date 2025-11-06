# Product Requirements Document (PRD)

## ReviewDrop: The UGC & Loyalty App for Whop

### 1. Introduction

**Product:** ReviewDrop  
**Date:** October 30, 2025  
**Author:** Product Team  
**Status:** Final v4.0

#### 1.1. Overview

ReviewDrop is a Whop marketplace application that automates User-Generated Content (UGC) collection through incentivized reviews. The system operates on a freemium, credit-based subscription model, allowing merchants to start free with limited capacity and upgrade to Pro for enhanced features.

The platform automates the complete review lifecycle: purchase detection → email trigger → review submission → merchant approval → reward delivery.

#### 1.2. The Problem

- **Lack of Social Proof:** Photo and video reviews drive conversions but are difficult to collect at scale
- **Manual UGC Process:** Manual customer outreach, tracking, and reward distribution doesn't scale
- **Broken Loyalty Loop:** Missed opportunities to re-engage customers post-purchase
- **Trust Barriers:** Generic review requests have low engagement rates

#### 1.3. The Solution

ReviewDrop integrates with Whop's ecosystem via OAuth and webhooks. When a customer completes a purchase, the system:

1. Listens to the payment webhook
2. Sends a personalized email with submission link
3. Hosts a mobile-optimized submission page
4. Stores media in Supabase Storage with automatic CDN delivery
5. Enables merchant review moderation via dashboard
6. Auto-generates and delivers single-use Whop promo codes upon approval

---

### 2. Goals & Objectives

| Goal | Objective | Success Metric |
|------|-----------|----------------|
| Increase Merchant Social Proof | Collect authentic photo/video reviews from verified buyers | 1000+ reviews/month across platform |
| Drive Repeat Business | Issue single-use discount codes to incentivize return purchases | 25%+ promo code redemption rate |
| Automate UGC Collection | Eliminate manual review solicitation and reward management | 80%+ of reviews auto-processed |
| Monetize the Application | Convert free users to Pro through demonstrated value | 15%+ Free→Pro conversion rate |

---

### 3. User Personas

#### 3.1. The Merchant (Alex the Creator)

- **Profile:** Digital product seller, course creator, or community owner on Whop
- **Technical Comfort:** Medium (can handle OAuth, embed codes, basic DNS)
- **Needs:**
  - Fast, responsive dashboard (Next.js App Router + React Server Components)
  - Real-time review notifications
  - Simple product configuration (toggle-based UI)
  - Beautiful review showcase embeds
  - Transparent credit usage tracking
  - Optional custom domain email sending (Pro)

#### 3.2. The Customer (Sam the Buyer)

- **Profile:** Just purchased from a Whop merchant
- **Device:** Primarily mobile (70%+ of traffic expected)
- **Needs:**
  - Trustworthy email sender (DMARC/SPF/DKIM compliant)
  - Frictionless mobile upload experience
  - Clear value proposition (discount amount visible)
  - Fast reward delivery (< 5 minutes post-approval)
  - No account creation required

---

### 4. Core User Flows & Features

#### Flow 1: Merchant Onboarding & Configuration

**F-1.1: Whop OAuth Connection**

- **Trigger:** Merchant clicks "Install ReviewDrop" on Whop marketplace
- **Process:**
  1. Create merchant record: `plan_type: 'free'`, `credit_balance: 10`, `credit_reset_date: NOW() + INTERVAL '30 days'`
- **Edge Cases:**
  - Duplicate merchant → update tokens, don't duplicate record

**F-1.2: Product Sync & Configuration Dashboard**

- **UI Components:**
  - Product list table (React Server Component with streaming)
  - Real-time sync status indicator
  - Per-product configuration cards with toggle switches
- **API Integration:**
  - Call Whop API: `GET /v5/products` (paginated, max 100 per page)
  - Upsert to `product_configs` table via Drizzle
  - Poll API every 5 minutes for new products (background job)
- **Configuration Fields:**
  - **Enable/Disable Toggle:** Default OFF for safety
  - **Review Type:** Photo only | Video only | Photo or Video
  - **Discount Type:** Percentage | Fixed Amount
  - **Discount Value:** Integer (1-100 for %, cents for fixed)
  - **Max Uses:** Default 1 (single-use codes)
  - **Expiration:** Default 30 days from issuance
- **Validation:**
  - Discount % must be 1-99
  - Fixed discount must be > 0 and < product price
  - At least one product must be enabled to activate campaigns

**F-1.3: Webhook Setup**

- **Process:**
  1. After OAuth success, automatically call Whop API: `POST /v5/webhooks`
  2. Register webhook URL: `https://[project-ref].supabase.co/functions/v1/whop-webhook`
  3. Subscribe to events: `order.paid`, `subscription.paid`, `subscription.canceled`
  4. Store webhook secret in Supabase Vault for signature verification
  5. Display webhook ID in dashboard "Settings > Integrations"
- **Security:**
  - Verify Whop webhook signatures using `X-Whop-Signature` header
  - Implement idempotency using `event_id` to prevent duplicate processing
  - Rate limit: 100 requests/minute per merchant

**F-1.4: Email Template Customization**

- **Editor:** TipTap (or Lexical) WYSIWYG editor
- **Templates:**
  1. **Review Request Email:**
     - Subject: Configurable (default: "Love your purchase? Share your experience!")
     - Body: Rich text with merge fields: `{{customer_name}}`, `{{product_name}}`, `{{discount_value}}`, `{{review_link}}`
     - CTA Button: Configurable text + color
  2. **Reward Delivery Email:**
     - Subject: Configurable (default: "Your {{discount_value}} discount code is ready!")
     - Body: Rich text with merge fields: `{{promo_code}}`, `{{expiration_date}}`, `{{merchant_name}}`
- **Constraints:**
  - HTML output must pass SendGrid spam filter check
  - Max template size: 100KB
  - Auto-inject unsubscribe link (CAN-SPAM compliance)

**F-1.5: Email Domain Authentication (PRO ONLY)**

- **UI Gating:**
  - Free users see: "Upgrade to Pro to send from your own domain" banner
  - Show visual comparison: `reviews@reviewdrop.com` vs. `reviews@yourbrand.com`
- **DNS Setup Process (Pro Users):**
  1. Merchant enters their domain (e.g., `yourbrand.com`)
  2. App generates SendGrid Domain Authentication records
  3. Display DNS records in copy-paste format:
     - CNAME for domain verification
     - TXT for SPF
     - CNAME records for DKIM (typically 2-3)
  4. Poll SendGrid API every 5 minutes to check verification status
  5. Show green checkmark when verified
- **Fallback Logic:**
  - Free Plan: Send from `[Merchant Name] <reviews@reviewdrop.com>`
  - Pro Plan (unverified): Same as Free
  - Pro Plan (verified): Send from `[Merchant Name] <reviews@merchant-domain.com>`
- **Technical Implementation:**
  - Store domain verification status in `merchants` table: `custom_domain`, `domain_verified: boolean`
  - Use SendGrid Whitelabel API for automated setup

---

#### Flow 2: Customer Purchase & Review Submission

**F-2.1: Order Webhook Processing**

- **Endpoint:** Supabase Edge Function: `/functions/v1/whop-webhook`
- **Webhook Payload (Whop):**
```json
{
  "event": "order.paid",
  "data": {
    "id": "order_xyz",
    "product_id": "prod_abc",
    "user": {
      "id": "user_123",
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "merchant_id": "merchant_456",
    "amount": 4999,
    "created_at": "2025-10-30T12:00:00Z"
  }
}
```
- **Processing Logic (Edge Function with Drizzle):**
```typescript
// 1. Verify webhook signature
const isValid = verifyWhopSignature(request, webhookSecret);
if (!isValid) return new Response('Unauthorized', { status: 401 });

// 2. Check idempotency
const existingEvent = await db
  .select()
  .from(processedEvents)
  .where(eq(processedEvents.eventId, eventData.id))
  .limit(1);
if (existingEvent.length > 0) return new Response('Already processed', { status: 200 });

// 3. Fetch product config
const productConfig = await db
  .select()
  .from(productConfigs)
  .where(eq(productConfigs.whopProductId, eventData.data.product_id))
  .limit(1);

if (!productConfig[0]?.isEnabled) {
  return new Response('Campaign not enabled', { status: 200 });
}

// 4. Fetch merchant and check credits
const merchant = await db
  .select()
  .from(merchants)
  .where(eq(merchants.whopId, eventData.data.merchant_id))
  .limit(1);

if (merchant[0].creditBalance <= 0) {
  // TODO V2: Trigger low-credit notification
  return new Response('Insufficient credits', { status: 200 });
}

// 5. Generate secure token (crypto.randomUUID() + timestamp)
const reviewToken = `${crypto.randomUUID()}-${Date.now()}`;

// 6. Create review record
await db.insert(reviews).values({
  id: crypto.randomUUID(),
  merchantId: merchant[0].id,
  productId: eventData.data.product_id,
  customerEmail: eventData.data.user.email,
  customerName: eventData.data.user.name,
  status: 'pending_submission',
  submissionToken: reviewToken,
  tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date()
});

// 7. Send email via SendGrid
await sendEmail({
  to: eventData.data.user.email,
  from: merchant[0].customDomainVerified 
    ? `${merchant[0].name} <reviews@${merchant[0].customDomain}>`
    : `${merchant[0].name} <reviews@reviewdrop.com>`,
  templateId: merchant[0].reviewRequestTemplateId,
  dynamicData: {
    customer_name: eventData.data.user.name,
    product_name: productConfig[0].productName,
    discount_value: formatDiscount(productConfig[0]),
    review_link: `https://reviewdrop.com/submit/${reviewToken}`
  }
});

// 8. Decrement credit balance
await db
  .update(merchants)
  .set({ creditBalance: sql`${merchants.creditBalance} - 1` })
  .where(eq(merchants.id, merchant[0].id));

// 9. Log event as processed
await db.insert(processedEvents).values({
  eventId: eventData.id,
  processedAt: new Date()
});

return new Response('OK', { status: 200 });
```

- **Error Handling:**
  - Database errors: Retry with exponential backoff (1s, 2s, 4s)
  - SendGrid errors: Log to Supabase, display in merchant dashboard
  - Invalid payload: Return 400, log for debugging

**F-2.2: Review Submission Page**

- **Route:** `/submit/[token]` (Next.js dynamic route)
- **Page Load Logic:**
  1. Validate token exists and hasn't expired
  2. Check status is `pending_submission` (prevent re-submission)
  3. Fetch product details from Whop API for display
  4. If invalid: Show "This link has expired" message
- **UI Components (Tailwind CSS):**
  - Hero section with product name + merchant logo
  - Clear value prop: "Submit your review, get {{discount_value}} off your next purchase"
  - Mobile-optimized file upload:
    - Drag-and-drop zone
    - Native camera access on mobile (`<input accept="image/*,video/*" capture="environment">`)
    - File size validation: Max 50MB for video, 10MB for photo
    - Format validation: JPEG, PNG, WebP, MP4, MOV, WebM
  - Optional text area: "Tell us more about your experience" (max 500 chars)
  - Prominent "Submit Review" button
- **Submission Flow (Client-Side):**
```typescript
const handleSubmit = async (file: File, comment: string) => {
  // 1. Client-side validation
  if (!validateFileType(file) || !validateFileSize(file)) {
    showError('Invalid file');
    return;
  }

  // 2. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('review-media')
    .upload(`${merchantId}/${reviewToken}/${file.name}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    showError('Upload failed. Please try again.');
    return;
  }

  // 3. Update review record via API route
  const response = await fetch(`/api/reviews/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: reviewToken,
      fileUrl: uploadData.path,
      comment: comment
    })
  });

  if (response.ok) {
    showSuccess('Review submitted! Your discount will arrive soon.');
  } else {
    showError('Submission failed. Please contact support.');
  }
};
```

- **API Route (`/api/reviews/submit`):**
  - Validate token again (server-side)
  - Update review record: `status: 'pending_approval'`, `fileUrl`, `comment`, `submittedAt: NOW()`
  - Trigger real-time notification to merchant (Supabase Realtime)
  - Return success response

- **Success Page:**
  - Confirmation message
  - Expected timeline: "Your discount code will arrive within 24-48 hours"
  - Optional: Social share buttons to amplify UGC

---

#### Flow 3: Merchant Review Management

**F-3.1: Review Approval Queue**

- **Dashboard Route:** `/dashboard/reviews` (protected by Supabase Auth)
- **Header Components:**
  - Current plan badge: "Free Plan" or "Pro Plan"
  - Credit counter: "7/10 Credits Used" with progress bar
  - "Upgrade to Pro" CTA button (if on Free plan)
- **Review Queue UI:**
  - Tabs: "Pending Approval" | "Approved" | "Rejected" | "All"
  - Default view: Pending, sorted by `submittedAt DESC`
  - Each review card shows:
    - Thumbnail preview (video: first frame + play icon)
    - Customer name (optionally anonymized: "John D.")
    - Product name
    - Submission date
    - Comment text (if provided)
    - Action buttons: "✓ Approve" (green) | "✕ Reject" (red)
- **Real-Time Updates:**
  - Subscribe to Supabase Realtime on `reviews` table
  - New reviews auto-appear in queue (no refresh needed)
- **Filtering & Search:**
  - Filter by product
  - Search by customer email
  - Date range picker

**F-3.2: Approval Logic**

- **Client Action:** Merchant clicks "Approve" button
- **API Route:** `POST /api/reviews/approve`
- **Request Body:**
```json
{
  "reviewId": "uuid-of-review"
}
```
- **Server-Side Logic:**
```typescript
// 1. Fetch review details
const review = await db
  .select()
  .from(reviews)
  .where(eq(reviews.id, reviewId))
  .limit(1);

if (!review[0] || review[0].status !== 'pending_approval') {
  return res.status(400).json({ error: 'Invalid review' });
}

// 2. Fetch product config for discount details
const productConfig = await db
  .select()
  .from(productConfigs)
  .where(eq(productConfigs.whopProductId, review[0].productId))
  .limit(1);

// 3. Generate promo code via Whop API
const promoCodeResponse = await fetch('https://api.whop.com/v5/promotions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${merchant.whopAccessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: `REVIEW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, // e.g., REVIEW-A3F7B2C1
    type: productConfig[0].discountType === 'percent' ? 'percentage' : 'fixed_amount',
    value: productConfig[0].discountValue,
    max_uses: 1,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicable_products: [review[0].productId]
  })
});

const promoCode = await promoCodeResponse.json();

// 4. Send reward email via SendGrid
await sendEmail({
  to: review[0].customerEmail,
  from: merchant.customDomainVerified 
    ? `${merchant.name} <reviews@${merchant.customDomain}>`
    : `${merchant.name} <reviews@reviewdrop.com>`,
  templateId: merchant.rewardDeliveryTemplateId,
  dynamicData: {
    promo_code: promoCode.code,
    discount_value: formatDiscount(productConfig[0]),
    expiration_date: new Date(promoCode.expires_at).toLocaleDateString(),
    merchant_name: merchant.name,
    product_link: `https://whop.com/checkout?promo=${promoCode.code}`
  }
});

// 5. Update review record
await db
  .update(reviews)
  .set({
    status: 'approved',
    promoCodeSent: promoCode.code,
    approvedAt: new Date()
  })
  .where(eq(reviews.id, reviewId));

return res.status(200).json({ success: true });
```

- **Error Handling:**
  - Whop API error (rate limit, invalid token): Show error in dashboard, allow retry
  - SendGrid error: Mark review as approved but flag "Email Failed" for manual retry
  - Promo code already exists: Generate new code and retry

**F-3.3: Rejection Logic**

- **API Route:** `POST /api/reviews/reject`
- **Server-Side Logic:**
```typescript
await db
  .update(reviews)
  .set({
    status: 'rejected',
    rejectedAt: new Date(),
    rejectionReason: requestBody.reason || null // Optional field
  })
  .where(eq(reviews.id, reviewId));
```
- **No email sent to customer** (to avoid negative experience)
- **Credit not refunded** (prevents abuse)

---

#### Flow 4: Review Showcase & Display

**F-4.1: "Discover" Page Gallery**

- **Route:** `/embed/gallery` (public, no auth required)
- **Query Params:** `?merchant=<merchant_id>&theme=<light|dark>`
- **Functionality:**
  - Fetch all approved reviews for merchant
  - Display in masonry grid layout (Pinterest-style)
  - Infinite scroll pagination (20 reviews per load)
  - Lightbox for full-size view (photo) or video player
  - Filter by product (dropdown)
- **Embed Code (provided in dashboard):**
```html
<iframe 
  src="https://reviewdrop.com/embed/gallery?merchant=YOUR_MERCHANT_ID" 
  width="100%" 
  height="600" 
  frameborder="0"
  loading="lazy"
></iframe>
```
- **Branding:**
  - Free Plan: "Powered by ReviewDrop" badge in bottom-right corner
  - Pro Plan: No badge, fully white-labeled

**F-4.2: On-Product Widget**

- **Route:** `/embed/product` (public)
- **Query Params:** `?product=<product_id>&limit=<number>&theme=<light|dark>`
- **Functionality:**
  - Show only reviews for specific product
  - Carousel/slider layout for space efficiency
  - Max 10 reviews visible
  - "See all reviews" link to full gallery
- **Embed Code:**
```html
<iframe 
  src="https://reviewdrop.com/embed/product?product=YOUR_PRODUCT_ID&limit=5" 
  width="100%" 
  height="400" 
  frameborder="0"
  loading="lazy"
></iframe>
```

---

#### Flow 5: Billing & Subscription Management

**F-5.1: Plan Tiers & Billing**

- **Billing Provider:** Whop Billing API (native integration)
- **How It Works:**
  1. Merchant clicks "Upgrade to Pro" in ReviewDrop dashboard
  2. Redirect to Whop checkout: `https://whop.com/checkout?plan=reviewdrop_pro`
  3. On successful payment, Whop sends `subscription.paid` webhook
  4. ReviewDrop webhook handler upgrades merchant's account

**F-5.2: Plan Definitions**

| Feature | Free Plan | Pro Plan |
|---------|-----------|----------|
| **Price** | $0/month | $49/month |
| **Credits** | 10/month | 300/month |
| **Reset Frequency** | Monthly (30 days) | Monthly (30 days) |
| **Email Sending** | `reviews@reviewdrop.com` | Custom domain + fallback |
| **Embed Branding** | "Powered by ReviewDrop" badge | No badge (white-label) |
| **Analytics** | Basic (total reviews, approval rate) | Advanced (conversion tracking, ROI) |
| **Priority Support** | Community (48hr response) | Email (4hr response) |
| **Custom Templates** | 2 default templates | Unlimited custom templates |
| **API Access** | ❌ | ✅ (V2 feature) |

**F-5.3: Credit & Subscription Webhook Logic**

- **Webhook Endpoint:** `POST /api/webhooks/whop-billing`
- **Event: `subscription.paid`**
```typescript
const handleSubscriptionPaid = async (eventData) => {
  const { merchant_id, plan_id, subscription_id } = eventData.data;

  // Determine plan type from Whop plan ID
  const planType = plan_id === 'reviewdrop_pro' ? 'pro' : 'free';
  const creditAllocation = planType === 'pro' ? 300 : 10;

  await db
    .update(merchants)
    .set({
      planType: planType,
      creditBalance: creditAllocation,
      creditResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      whopSubscriptionId: subscription_id
    })
    .where(eq(merchants.whopId, merchant_id));

  // Trigger welcome email (Pro plan only)
  if (planType === 'pro') {
    await sendEmail({
      to: merchant.email,
      templateId: 'pro_welcome',
      dynamicData: { merchant_name: merchant.name }
    });
  }
};
```

- **Event: `subscription.canceled`**
```typescript
const handleSubscriptionCanceled = async (eventData) => {
  const { merchant_id, subscription_id } = eventData.data;

  // Downgrade to free plan (keep current credits until reset)
  await db
    .update(merchants)
    .set({
      planType: 'free',
      whopSubscriptionId: null
      // Note: Do NOT reset creditBalance immediately (grace period)
    })
    .where(eq(merchants.whopId, merchant_id));

  // On next credit reset, they'll get 10 credits instead of 300
};
```

**F-5.4: Credit Reset Cron Job**

- **Trigger:** Daily at 00:00 UTC (Supabase Cron Function)
- **SQL Query:**
```sql
UPDATE merchants
SET 
  credit_balance = CASE 
    WHEN plan_type = 'pro' THEN 300
    WHEN plan_type = 'free' THEN 10
  END,
  credit_reset_date = NOW() + INTERVAL '30 days'
WHERE credit_reset_date <= NOW();
```
- **Notification:** Send email to merchants when credits are reset

---

### 6. Database Schema (Drizzle ORM)

#### `merchants` Table
```typescript
export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  whopId: text('whop_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'), // Merchant business name
  whopAccessToken: text('whop_access_token').notNull(), // Encrypted at rest
  whopRefreshToken: text('whop_refresh_token').notNull(), // Encrypted at rest
  planType: text('plan_type', { enum: ['free', 'pro'] }).notNull().default('free'),
  creditBalance: integer('credit_balance').notNull().default(10),
  creditResetDate: timestamp('credit_reset_date').notNull(),
  whopSubscriptionId: text('whop_subscription_id'),
  customDomain: text('custom_domain'),
  customDomainVerified: boolean('custom_domain_verified').default(false),
  reviewRequestTemplateId: text('review_request_template_id'),
  rewardDeliveryTemplateId: text('reward_delivery_template_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

#### `product_configs` Table
```typescript
export const productConfigs = pgTable('product_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  whopProductId: text('whop_product_id').notNull().unique(),
  productName: text('product_name').notNull(), // Cached from Whop API
  isEnabled: boolean('is_enabled').notNull().default(false),
  reviewType: text('review_type', { enum: ['photo', 'video', 'any'] }).notNull().default('any'),
  discountType: text('discount_type', { enum: ['percent', 'fixed'] }).notNull().default('percent'),
  discountValue: integer('discount_value').notNull(), // Percentage (1-99) or cents
  promoMaxUses: integer('promo_max_uses').notNull().default(1),
  promoExpirationDays: integer('promo_expiration_days').notNull().default(30),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  merchantProductIdx: index('merchant_product_idx').on(table.merchantId, table.whopProductId)
}));
```

#### `reviews` Table
```typescript
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(), // Whop product ID
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  status: text('status', { 
    enum: ['pending_submission', 'pending_approval', 'approved', 'rejected'] 
  }).notNull().default('pending_submission'),
  submissionToken: text('submission_token').notNull().unique(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  fileUrl: text('file_url'), // Supabase Storage path
  fileType: text('file_type', { enum: ['photo', 'video'] }),
  comment: text('comment'),
  promoCodeSent: text('promo_code_sent'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at')
}, (table) => ({
  merchantStatusIdx: index('merchant_status_idx').on(table.merchantId, table.status),
  tokenIdx: index('token_idx').on(table.submissionToken)
}));
```

#### `processed_events` Table (Idempotency)
```typescript
export const processedEvents = pgTable('processed_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(), // Whop webhook event ID
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow()
}, (table) => ({
  eventIdIdx: index('event_id_idx').on(table.eventId)
}));
```

#### `email_logs` Table (Debugging)
```typescript
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  emailType: text('email_type', { enum: ['review_request', 'reward_delivery'] }).notNull(),
  recipient: text('recipient').notNull(),
  status: text('status', { enum: ['sent', 'failed', 'bounced'] }).notNull(),
  sendgridMessageId: text('sendgrid_message_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});
```

---

### 7. Technical Architecture & Stack

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **App Framework** | Next.js 14+ (App Router) | React Server Components for optimal performance, built-in API routes, streaming SSR |
| **Styling** | Tailwind CSS v3 + shadcn/ui | Utility-first CSS, pre-built accessible components, responsive design system |
| **Backend as a Service** | Supabase | Unified platform: Postgres, Auth, Storage, Edge Functions, Realtime, Cron |
| **Database** | Supabase Postgres 15 | ACID compliant, row-level security, full-text search, JSON support |
| **ORM** | Drizzle ORM | Lightweight, type-safe SQL queries, excellent TypeScript DX, migration support |
| **Authentication** | Whop OAuth 2.0 + Supabase Auth | Whop for merchant API access, Supabase for dashboard session management |
| **Subscription Management** | Whop Billing API | Native Whop integration, handles payments, invoicing, subscription lifecycle |
| **File Storage** | Supabase Storage | S3-compatible, automatic CDN, image transformations, signed URLs |
| **Webhooks** | Supabase Edge Functions (Deno) | Low latency, auto-scaling, built-in logging, deploy via CLI |
| **Cron Jobs** | Supabase Cron (pg_cron) | Native Postgres scheduling, reliable, simple SQL-based configuration |
| **API Routes** | Next.js App Router API Routes | Co-located with frontend, Edge Runtime support, middleware for auth |
| **Email Service** | SendGrid (primary) / Postmark (backup) | High deliverability, custom domain authentication, webhook events, template engine |
| **Monitoring** | Sentry (errors) + Supabase Logs | Real-time error tracking, performance monitoring, structured logging |
| **Analytics** | PostHog (product) + Stripe Sigma (revenue) | Event tracking, funnel analysis, A/B testing, subscription metrics |

---

### 8. API Specifications

#### 8.1. External APIs (Whop)

**Authentication:**
- All requests include: `Authorization: Bearer {access_token}`
- Token refresh logic handles expired tokens automatically

**Key Endpoints:**

```typescript
// Get merchant products
GET https://api.whop.com/v5/products
Response: {
  data: [
    {
      id: "prod_xyz",
      name: "Premium Course",
      price: 4999, // cents
      currency: "USD"
    }
  ],
  pagination: { next: "cursor_token" }
}

// Create promo code
POST https://api.whop.com/v5/promotions
Body: {
  code: "REVIEW-ABC123",
  type: "percentage", // or "fixed_amount"
  value: 20, // 20% or $20.00
  max_uses: 1,
  expires_at: "2025-11-30T23:59:59Z",
  applicable_products: ["prod_xyz"]
}
Response: {
  id: "promo_789",
  code: "REVIEW-ABC123",
  created_at: "2025-10-30T12:00:00Z"
}

// Register webhook
POST https://api.whop.com/v5/webhooks
Body: {
  url: "https://xyz.supabase.co/functions/v1/whop-webhook",
  events: ["order.paid", "subscription.paid", "subscription.canceled"]
}
Response: {
  id: "webhook_456",
  secret: "whsec_xxxxxxxxxxxxx"
}
```

#### 8.2. Internal APIs (Next.js)

**Base URL:** `https://reviewdrop.com/api`

**Authentication:** Session-based (Supabase Auth cookie)

**Endpoints:**

```typescript
// Submit review
POST /api/reviews/submit
Body: {
  token: string,
  fileUrl: string,
  comment?: string
}
Response: {
  success: boolean,
  reviewId: string
}

// Approve review
POST /api/reviews/approve
Headers: { Cookie: "sb-access-token=..." }
Body: { reviewId: string }
Response: {
  success: boolean,
  promoCode: string
}

// Reject review
POST /api/reviews/reject
Headers: { Cookie: "sb-access-token=..." }
Body: {
  reviewId: string,
  reason?: string
}
Response: { success: boolean }

// Update product config
PATCH /api/products/{productId}/config
Headers: { Cookie: "sb-access-token=..." }
Body: {
  isEnabled?: boolean,
  reviewType?: "photo" | "video" | "any",
  discountType?: "percent" | "fixed",
  discountValue?: number
}
Response: { success: boolean, config: ProductConfig }

// Verify custom domain
POST /api/settings/domain/verify
Headers: { Cookie: "sb-access-token=..." }
Body: { domain: string }
Response: {
  verified: boolean,
  dnsRecords: {
    type: string,
    name: string,
    value: string
  }[]
}

// Get analytics
GET /api/analytics?startDate=2025-10-01&endDate=2025-10-30
Headers: { Cookie: "sb-access-token=..." }
Response: {
  totalReviews: number,
  approvalRate: number,
  redemptionRate: number,
  creditUsage: {
    used: number,
    total: number,
    resetDate: string
  }
}
```

---

### 9. Security & Compliance

#### 9.1. Data Protection

**Encryption:**
- At-rest: Supabase encrypts all data with AES-256
- In-transit: TLS 1.3 for all connections
- Sensitive fields (OAuth tokens): Additional application-layer encryption using Supabase Vault

**Access Control:**
- Row Level Security (RLS) on all Supabase tables
- Merchants can only access their own data
- Review submission tokens expire after 7 days
- API routes protected by middleware checking Supabase session

**Example RLS Policy:**
```sql
-- Merchants can only read their own data
CREATE POLICY "merchants_select_own" ON merchants
FOR SELECT
USING (auth.uid() = id);

-- Merchants can only update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
FOR UPDATE
USING (merchant_id IN (
  SELECT id FROM merchants WHERE auth.uid() = id
));
```

#### 9.2. Email Compliance

**CAN-SPAM Act:**
- Unsubscribe link in every email
- Physical mailing address in footer
- Accurate "From" name and subject line
- Honor opt-outs within 10 business days

**GDPR (if applicable):**
- Privacy policy link in all emails
- Data retention policy: Reviews stored indefinitely unless merchant deletes
- Right to deletion: Merchants can delete reviews via dashboard
- Data export: Merchants can export all data as JSON

#### 9.3. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Webhook ingestion | 100 req/min per merchant | 1 minute |
| Dashboard API routes | 60 req/min per session | 1 minute |
| File uploads | 20 uploads/hour per IP | 1 hour |
| Email sending | 500 emails/day per merchant | 24 hours |

**Implementation:** Supabase Edge Functions with Upstash Redis for distributed rate limiting

#### 9.4. Content Moderation

**Automated Checks (Pre-Approval):**
- File virus scanning via ClamAV
- Explicit content detection via AWS Rekognition (Pro plan only)
- Text profanity filter on comments

**Manual Review Queue:**
- All submissions require merchant approval
- Future V2: AI pre-screening to flag suspicious content

---

### 10. Performance Requirements

#### 10.1. Page Load Targets

| Page | Target (P95) | Strategy |
|------|--------------|----------|
| Dashboard home | < 1.5s | React Server Components, streaming SSR |
| Review submission | < 2s | Static generation, edge caching |
| Gallery embed | < 1s | CDN caching (1 hour TTL), lazy loading |
| Product widget | < 800ms | Preload critical images, defer non-critical JS |

#### 10.2. API Response Times

| Endpoint | Target (P95) | Strategy |
|----------|--------------|----------|
| Webhook processing | < 500ms | Edge Functions, connection pooling |
| Review approval | < 2s | Async promo code generation |
| File upload | < 5s for 10MB | Direct-to-storage upload, resumable |

#### 10.3. Scalability

- **Database:** Supabase auto-scales; monitor connection pool usage
- **Storage:** Supabase Storage leverages Cloudflare CDN (global)
- **Edge Functions:** Auto-scale to zero, handle 10k+ concurrent requests
- **Email:** SendGrid scales to millions; implement queuing for bulk sends

---

### 11. Error Handling & Monitoring

#### 11.1. Error Categories

**Critical Errors (Page developer immediately):**
- Webhook signature verification failures (potential attack)
- Database connection failures
- Email service downtime affecting > 10% of sends

**High Priority (Alert within 15 minutes):**
- Whop API rate limit exceeded
- Credit balance calculation errors
- File upload failures > 5% error rate

**Medium Priority (Alert within 1 hour):**
- Individual email delivery failures
- Slow API response times (> 3s)
- OAuth token refresh failures

#### 11.2. Logging Strategy

**Structured Logs (JSON format):**
```typescript
{
  timestamp: "2025-10-30T12:00:00Z",
  level: "info" | "warn" | "error",
  service: "edge-function" | "api-route" | "cron",
  merchantId: "uuid",
  event: "webhook_processed" | "review_approved" | "email_sent",
  metadata: {
    reviewId: "uuid",
    duration: 234, // ms
    success: true
  }
}
```

**Retention:**
- Info logs: 7 days
- Warn logs: 30 days
- Error logs: 90 days

#### 11.3. Monitoring Dashboards

**Merchant Dashboard (Per-Merchant):**
- Credit usage over time (line chart)
- Review submission funnel (sankey diagram)
- Approval rate trend
- Promo code redemption rate

**Admin Dashboard (Internal):**
- Active merchants (total, free vs. pro)
- System health (API response times, error rates)
- Revenue metrics (MRR, churn, ARPU)
- Email deliverability (open rate, bounce rate)

---

### 12. Testing Strategy

#### 12.1. Unit Tests

**Coverage Target:** 80% for business logic

**Key Areas:**
- Token generation and validation
- Credit balance calculations
- Discount formatting functions
- Webhook signature verification

**Framework:** Vitest (faster than Jest for Next.js)

#### 12.2. Integration Tests

**Test Scenarios:**
- End-to-end review submission flow
- Whop OAuth handshake
- Promo code generation via Whop API
- Email delivery via SendGrid
- File upload to Supabase Storage

**Framework:** Playwright for browser automation

#### 12.3. Load Testing

**Tool:** k6 by Grafana Labs

**Scenarios:**
- 1000 concurrent webhook requests (order.paid)
- 500 concurrent file uploads
- 100 concurrent dashboard page loads

**Success Criteria:**
- < 1% error rate
- P95 response time within targets
- No database connection pool exhaustion

---

### 13. Deployment & Infrastructure

#### 13.1. Environments

| Environment | URL | Purpose | Deploy Trigger |
|-------------|-----|---------|----------------|
| Development | localhost:3000 | Local development | Manual |
| Staging | staging.reviewdrop.com | QA testing | Push to `staging` branch |
| Production | reviewdrop.com | Live app | Push to `main` branch |

#### 13.2. CI/CD Pipeline

**Tool:** GitHub Actions

**Workflow:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Deploy Supabase Functions
        run: |
          supabase functions deploy whop-webhook
          supabase functions deploy credit-reset-cron
```

#### 13.3. Database Migrations

**Tool:** Drizzle Kit

**Process:**
1. Create migration: `npx drizzle-kit generate`
2. Review SQL in `migrations/` folder
3. Test in staging: `npm run migrate:staging`
4. Deploy to production: `npm run migrate:production`
5. Automatic rollback on failure

**Example Migration:**
```sql
-- migrations/0001_add_custom_domain_fields.sql
ALTER TABLE merchants 
ADD COLUMN custom_domain TEXT,
ADD COLUMN custom_domain_verified BOOLEAN DEFAULT false;

CREATE INDEX merchants_custom_domain_idx ON merchants(custom_domain);
```

---

### 14. Future Enhancements (V2 Roadmap)

#### Phase 1 (Q1 2026)
- **AI-Powered Content Moderation:** Auto-approve low-risk reviews, flag suspicious content
- **Advanced Analytics Dashboard:** Conversion tracking, attribution modeling, cohort analysis
- **Mobile App (iOS/Android):** Native review submission experience
- **Multi-Language Support:** Spanish, French, German translations

#### Phase 2 (Q2 2026)
- **Video Testimonial Builder:** In-app video editor with captions, branding overlays
- **Social Media Auto-Posting:** Publish approved reviews to Instagram, TikTok, Twitter
- **Review Remix Feature:** Combine multiple reviews into highlight reels
- **Referral Program:** Merchants earn credits by referring other merchants

#### Phase 3 (Q3 2026)
- **Public API & Webhooks:** Allow merchants to build custom integrations
- **Zapier Integration:** Connect ReviewDrop to 5000+ apps
- **White-Label Solution:** Agencies can rebrand ReviewDrop for clients
- **Enterprise Plan:** Custom credit limits, dedicated support, SLA guarantees

---

### 15. Success Metrics & KPIs

#### 15.1. Product Metrics

| Metric | Target (Month 3) | Target (Month 6) | Measurement |
|--------|------------------|------------------|-------------|
| Active Merchants | 100 | 500 | Merchants with ≥1 enabled product |
| Total Reviews Collected | 5,000 | 25,000 | Sum of approved reviews |
| Review Submission Rate | 15% | 25% | (Submitted / Emails Sent) × 100 |
| Approval Rate | 80% | 85% | (Approved / Submitted) × 100 |
| Promo Code Redemption | 20% | 30% | (Redeemed / Issued) × 100 |

#### 15.2. Business Metrics

| Metric | Target (Month 3) | Target (Month 6) | Measurement |
|--------|------------------|------------------|-------------|
| Free → Pro Conversion | 10% | 15% | (Pro Users / Total Users) × 100 |
| Monthly Recurring Revenue | $2,000 | $12,000 | Sum of Pro subscriptions |
| Churn Rate | < 10% | < 5% | (Canceled / Active) × 100 |
| Average Revenue Per User | $20 | $25 | MRR / Active Merchants |
| Customer Acquisition Cost | < $100 | < $75 | Marketing Spend / New Users |

#### 15.3. Technical Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Uptime | 99.9% | < 99.5% |
| P95 Response Time | < 2s | > 3s |
| Error Rate | < 0.1% | > 1% |
| Email Deliverability | > 95% | < 90% |
| Database Query Time | < 100ms | > 500ms |

---

### 16. Launch Checklist

#### Pre-Launch (2 weeks before)
- [ ] Security audit completed (penetration testing)
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Privacy policy and Terms of Service reviewed by legal
- [ ] Email templates tested across 10+ email clients
- [ ] Whop marketplace listing approved
- [ ] Onboarding tutorial video recorded
- [ ] Support documentation written (Help Center)
- [ ] Error monitoring configured (Sentry)
- [ ] Backup and disaster recovery plan tested

#### Launch Week
- [ ] Deploy to production with feature flags (gradual rollout)
- [ ] Monitor error rates and performance metrics hourly
- [ ] Onboard 10 beta merchants manually
- [ ] Collect feedback via in-app surveys
- [ ] Fix critical bugs within 24 hours
- [ ] Publish launch announcement on Whop community
- [ ] Social media marketing campaign begins

#### Post-Launch (Week 2-4)
- [ ] Weekly merchant feedback calls
- [ ] Iterate on onboarding flow based on drop-off data
- [ ] A/B test email templates for higher submission rates
- [ ] Optimize gallery embed performance
- [ ] Plan feature prioritization based on usage data
- [ ] Prepare investor/stakeholder progress report

---

### 17. Support & Documentation

#### 17.1. Help Center Structure

**Getting Started:**
- How to connect your Whop account
- Setting up your first review campaign
- Understanding credits and billing

**For Merchants:**
- How to approve/reject reviews
- Customizing email templates
- Setting up custom domain email (Pro)
- Embedding review galleries on your site
- Understanding analytics

**For Customers:**
- How to submit a review
- When will I receive my discount code?
- Troubleshooting upload issues

**Technical:**
- Webhook signature verification
- API documentation (V2)
- Database schema reference

#### 17.2. Support Channels

**Free Plan:**
- Help Center (self-service)
- Community forum (peer support)
- Email support (48-hour SLA)

**Pro Plan:**
- All Free plan channels
- Priority email support (4-hour SLA)
- Live chat (business hours)
- Monthly check-in call (optional)

---

### 18. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Whop API changes break integration | Medium | High | Monitor Whop API changelog, maintain staging environment, implement API versioning |
| Low free-to-pro conversion | High | High | A/B test pricing, add more pro features, improve onboarding to show value faster |
| Email deliverability issues | Medium | High | Use SendGrid + Postmark redundancy, monitor bounce rates, implement DMARC/DKIM |
| Spam/abuse of review system | Medium | Medium | Implement rate limiting, content moderation, require purchase verification |
| Supabase outage | Low | High | Implement graceful degradation, queue critical operations, set up status page |
| GDPR compliance violations | Low | High | Regular compliance audits, data retention policies, clear consent flows |
| Merchant churn due to complexity | High | Medium | Simplify onboarding, provide video tutorials, offer onboarding assistance |

---

### 19. Glossary

- **UGC:** User-Generated Content (photos, videos, reviews created by customers)
- **Review Token:** Unique, single-use URL parameter for review submission
- **Credit:** Unit of measurement for review request emails (1 credit = 1 email)
- **Promo Code:** Single-use discount code generated via Whop API
- **Webhook:** HTTP callback triggered by Whop when events occur (e.g., order.paid)
- **Edge Function:** Serverless function running on Supabase/Deno Deploy at the edge
- **RLS:** Row Level Security (Postgres feature for access control)
- **Idempotency:** Property ensuring duplicate webhook events are processed only once
- **DKIM/SPF/DMARC:** Email authentication protocols for preventing spoofing

---

### 20. Appendix

#### A. Competitor Analysis

| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| Loox (Shopify) | Mature product, large user base | Shopify-only, expensive ($299/mo) | Whop-native, cheaper, video-first |
| Stamped.io | Good analytics, review syndication | Complex UI, slow support | Simpler UX, faster setup |
| Yotpo | Enterprise features, SMS reviews | Very expensive ($1000+/mo) | Affordable for SMBs, same core features |

#### B. User Feedback Quotes (Beta Testing)

> "Setup took me 5 minutes. I got my first video review within an hour!" — Alex, Course Creator

> "The credit system is genius. I know exactly how many reviews I can collect each month." — Sarah, eBook Seller

> "I wish I could customize the gallery colors more, but overall it's exactly what I needed." — Mike, Community Owner

#### C. Technical Debt Items

1. **Webhook retry logic:** Currently fails silently; need exponential backoff
2. **Image optimization:** Not using Next.js Image component in all places
3. **Database indexes:** Need composite index on (merchant_id, status, created_at)
4. **Test coverage:** Only at 65%, goal is 80%+

---

**Document Version:** 4.0  
**Last Updated:** October 30, 2025  
**Next Review:** November 30, 2025