# NEXUS ACADEMY

AI-powered learning platform with LINE integration, Stripe subscriptions, and usage limits.

## Features

- LINE Login authentication with server-side ID token verification
- PWA support with manifest and service worker
- Plan-based feature differentiation (FREE/PLUS)
- Stripe subscription management
- Daily usage limits for FREE users
- Advertisement flow for FREE users
- 6 main features accessible via rich menu

## Rich Menu URLs

All rich menu buttons should point to the LIFF app with query parameters:

- Material Generation: `https://your-liff-domain/liff?to=/generator`
- Quiz: `https://your-liff-domain/liff?to=/quiz`
- AI Support: `https://your-liff-domain/liff?to=/ai`
- Online Classroom: `https://your-liff-domain/liff?to=/classroom`
- Calendar: `https://your-liff-domain/liff?to=/calendar`
- Settings: `https://your-liff-domain/liff?to=/settings`

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your environment variables
3. Run `npm install`
4. Initialize database: The app will auto-create tables on first run
5. Run `npm run dev`

## Environment Variables

See `.env.local.example` for all required variables.

### Stripe Setup

1. Create a Stripe account and get your secret key
2. Create a product and price for NEXUS ACADEMY PLUS (¥1,500/month)
3. Set up webhook endpoint: `https://your-domain/api/stripe/webhook`
4. Configure webhook events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
5. For local development, use `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Required Environment Variables

```
# LINE Integration
NEXT_PUBLIC_LIFF_ID=your_liff_id
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_academy

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PRODUCT_PLUS_PRICE_ID=price_...

# Usage Limits (optional, defaults provided)
GEN_MAX_PER_DAY=10
NAVI_MAX_PER_DAY=3
```

## API Endpoints

### Authentication
- `POST /api/auth/line` - LINE ID token verification and session creation
- `GET /api/me` - Get current user information

### Stripe Integration
- `POST /api/stripe/checkout` - Create Stripe Checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Usage Limits
- `GET /api/limits` - Get current usage limits for user
- `POST /api/usage/increment` - Increment usage count (server-side only)

### Content Generation
- `POST /api/generate/start` - Start material generation (dummy implementation)
- `GET /api/generate/status` - Check generation status (dummy implementation)

### Feature Validation
- `POST /api/ai/features` - Validate AI feature access
- `POST /api/quiz/levels` - Validate quiz level access

## Plan Features

### FREE Plan
- Material generation: 10 times per day with 5-second ads
- Solution navigator: 3 times per day
- Quiz: Basic and Standard levels only
- AI Support: Solution Navigator only

### PLUS Plan (¥1,500/month)
- Unlimited material generation without ads
- Unlimited solution navigator
- Quiz: All levels including Advanced
- AI Support: All 5 features unlocked
- Future: Weakness analysis, monthly PDF reports, calendar editing

## Development Notes

### Cookie Settings
- Uses `SameSite=Lax` for LINE in-app browser compatibility
- Secure cookies in production only

### Timezone Handling
- Usage logs use Tokyo timezone for consistent daily limits
- Server-side date calculation: `new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })`

### Testing Stripe Webhooks
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
```

## Database Schema

### users table
- `id` (UUID, PK)
- `line_user_id` (TEXT, UNIQUE)
- `display_name` (TEXT)
- `plan` (TEXT, default 'free')
- `paid_until` (TIMESTAMPTZ, nullable)
- `stripe_customer_id` (TEXT, nullable)
- `stripe_subscription_id` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ, default NOW())

### usage_logs table
- `id` (BIGSERIAL, PK)
- `user_id` (UUID, FK to users)
- `date` (DATE)
- `gen_count` (INTEGER, default 0)
- `navi_count` (INTEGER, default 0)
- UNIQUE constraint on (user_id, date)
