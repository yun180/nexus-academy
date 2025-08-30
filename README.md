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

## Day3 Features (BullMQ + Google Calendar + Enhanced Upsell)

### BullMQ Setup
1. Install and start Redis server:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis-server
   
   # macOS
   brew install redis
   brew services start redis
   ```

2. Set REDIS_URL in .env.local:
   ```
   REDIS_URL=redis://localhost:6379
   ```

### Google Calendar Integration
1. Create a Google Cloud Project and enable Calendar API
2. Create a service account and download the JSON key
3. Set environment variables:
   ```
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_CALENDAR_ID=primary
   ```
4. Share your calendar with the service account email (Editor permissions)

### New API Endpoints
- `POST /api/generate/start` - Start BullMQ generation job
- `GET /api/generate/status?jobId=` - Check job status and progress
- `POST /api/classroom/book` - Create Google Calendar event with Meet link
- `GET /api/calendar/feed` - Fetch upcoming calendar events

### Enhanced UI Features
- Usage limit modals with direct Stripe checkout
- Plan comparison table in settings
- Real-time job progress tracking
- Google Meet URL copying
- Calendar event display

### Testing Procedures
1. **BullMQ Queue System:**
   ```bash
   # Start multiple generation jobs
   curl -X POST http://localhost:3000/api/generate/start \
     -H "Content-Type: application/json" \
     -d '{"content":"数学","difficulty":"基礎"}'
   
   # Check job status
   curl http://localhost:3000/api/generate/status?jobId=YOUR_JOB_ID
   ```

2. **Google Calendar Integration:**
   ```bash
   # Book classroom session
   curl -X POST http://localhost:3000/api/classroom/book \
     -H "Content-Type: application/json" \
     -d '{
       "start":"2024-01-15T10:00:00",
       "end":"2024-01-15T11:00:00",
       "topic":"数学授業",
       "attendeeEmail":"student@example.com"
     }'
   ```

3. **Upsell Flow:**
   - Use FREE account
   - Generate 10+ materials to hit limit
   - Verify modal appears with Stripe checkout

### Troubleshooting
- **Redis Connection:** Ensure Redis server is running on port 6379
- **Google Calendar:** Verify service account has calendar sharing permissions
- **BullMQ Jobs:** Check Redis for job data: `redis-cli KEYS "*"`
- **Timezone Issues:** All dates use Asia/Tokyo timezone
