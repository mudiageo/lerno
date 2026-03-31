# Environment Variables — Complete Reference

Every environment variable used in StudyScroll, with description, where it's used, and how to obtain it.

> **Rule:** Variables prefixed `PUBLIC_` are exposed to the browser. Everything else is server-only. Never put secret keys in `PUBLIC_` variables.

---

## Required for Basic Dev (Minimum Set)

These are the only variables you need to run the app locally with minimal features:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studyscroll
BETTER_AUTH_SECRET=any-32-char-random-string-here-ok
BETTER_AUTH_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
GEMINI_API_KEY=AIza...   # get from aistudio.google.com
```

---

## Full Variable Reference

### Database

| Variable | Required | Description | How to get |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (via PgBouncer in prod) | Render dashboard → Database → Connection String |
| `DATABASE_DIRECT_URL` | Prod only | Direct connection (no pooler) — used by Drizzle migrations | Render dashboard → Database → Internal connection |

```bash
# Local dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studyscroll

# Production (PgBouncer pooler URL)
DATABASE_URL=postgresql://studyscroll:pass@oregon-postgres.render.com:5432/studyscroll?pgbouncer=true

# Production (direct, for migrations only)
DATABASE_DIRECT_URL=postgresql://studyscroll:pass@oregon-postgres.render.com:5432/studyscroll
```

---

### Authentication

| Variable | Required | Description | How to get |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | ✅ | Session signing secret (≥32 chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Public base URL of the app | Your Vercel deployment URL |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID | console.cloud.google.com → Credentials |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret | Same as above |

```bash
BETTER_AUTH_SECRET=n8fK2mQpLxR9vTj3bYwZ6hDe4cAg7sUo
BETTER_AUTH_URL=https://app.studyscroll.dev
GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQr
```

---

### AI Providers

| Variable | Required | Description | How to get |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (primary AI) | aistudio.google.com → Get API key |
| `ANTHROPIC_API_KEY` | Optional | Claude API key (fallback AI) | console.anthropic.com → API Keys |

```bash
GEMINI_API_KEY=AIzaSyB...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

> Gemini free tier: 15 req/min, 1M tokens/day (more than enough for dev).  
> The fallback proxy automatically switches to Claude if Gemini returns HTTP 429.

---

### Storage — Cloudflare R2

| Variable | Required | Description | How to get |
|---|---|---|---|
| `R2_ENDPOINT` | ✅ | R2 S3-compatible endpoint | Cloudflare dashboard → R2 → Manage R2 API tokens |
| `R2_ACCESS_KEY` | ✅ | R2 access key ID | Same — create API token |
| `R2_SECRET_KEY` | ✅ | R2 secret access key | Same |
| `R2_BUCKET` | ✅ | R2 bucket name | Create bucket in dashboard |
| `R2_PUBLIC_URL` | ✅ | Public CDN URL for the bucket | R2 bucket → Settings → Custom domain |

```bash
R2_ENDPOINT=https://abcdef1234567890.r2.cloudflarestorage.com
R2_ACCESS_KEY=abc123...
R2_SECRET_KEY=xyz789...
R2_BUCKET=studyscroll-media
R2_PUBLIC_URL=https://media.studyscroll.dev
```

> **Dev shortcut:** Use a local MinIO instance as an S3-compatible replacement:
> ```bash
> docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
> R2_ENDPOINT=http://localhost:9000
> R2_ACCESS_KEY=minioadmin
> R2_SECRET_KEY=minioadmin
> R2_BUCKET=studyscroll-dev
> R2_PUBLIC_URL=http://localhost:9000/studyscroll-dev
> ```

---

### Video — Cloudflare Stream

| Variable | Required | Description | How to get |
|---|---|---|---|
| `CF_STREAM_TOKEN` | ✅ (video uploads) | Cloudflare Stream API token | Cloudflare dashboard → Stream → API tokens |
| `CF_ACCOUNT_ID` | ✅ (video uploads) | Cloudflare account ID | Cloudflare dashboard → top-right account dropdown |
| `CF_CUSTOMER_CODE` | ✅ (video uploads) | Stream delivery subdomain | Cloudflare dashboard → Stream → Overview → Subdomain |

```bash
CF_STREAM_TOKEN=v1.0-aAbBcCdD...
CF_ACCOUNT_ID=1234abcd5678efgh
CF_CUSTOMER_CODE=abcd1234   # your playback URL prefix
```

> **Dev:** You can skip Stream entirely in development — use direct file URLs from R2 for video.

---

### Email

| Variable | Required | Description | How to get |
|---|---|---|---|
| `RESEND_API_KEY` | ✅ (primary email) | Resend API key | resend.com → API Keys |
| `EMAIL_FROM` | ✅ | From address (must be verified domain) | resend.com → Domains |
| `SMTP_HOST` | ✅ (fallback) | SMTP server hostname | Your email provider |
| `SMTP_PORT` | ✅ (fallback) | SMTP port (587 for TLS) | Your email provider |
| `SMTP_USER` | ✅ (fallback) | SMTP username | Your email provider |
| `SMTP_PASS` | ✅ (fallback) | SMTP password or app password | Your email provider |

```bash
# Resend (primary)
RESEND_API_KEY=re_AbCdEfGh_1234567890
EMAIL_FROM=StudyScroll <noreply@studyscroll.dev>

# Nodemailer fallback (only used if RESEND_API_KEY is not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourapp@gmail.com
SMTP_PASS=your-app-password   # Google → Account → Security → App Passwords
```

---

### Payments

| Variable | Required | Description | How to get |
|---|---|---|---|
| `PAYSTACK_SECRET_KEY` | ✅ (Africa payments) | Paystack secret key | dashboard.paystack.com → Settings → API Keys |
| `STRIPE_SECRET_KEY` | ✅ (global payments) | Stripe secret key | dashboard.stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | ✅ (Stripe webhooks) | Stripe webhook signing secret | dashboard.stripe.com → Developers → Webhooks |
| `PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ | Paystack publishable key (browser) | Same Paystack dashboard |
| `PUBLIC_STRIPE_PUBLIC_KEY` | ✅ | Stripe publishable key (browser) | Same Stripe dashboard |

```bash
PAYSTACK_SECRET_KEY=sk_live_abcdefghij...
STRIPE_SECRET_KEY=sk_live_51AbCdEfGhIj...
STRIPE_WEBHOOK_SECRET=whsec_abcdefghij...

PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_abcdefghij...
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51AbCdEfGhIj...
```

> **Dev:** Use test keys (`sk_test_`, `pk_test_`) — Paystack and Stripe both have test modes with no real charges.

---

### Live Streaming

| Variable | Required | Description | How to get |
|---|---|---|---|
| `LIVE_PROVIDER` | ✅ | `custom` or `livekit` — controls which SFU is used | Set manually |
| `SFU_URL` | ✅ (custom mode) | Public URL of your mediasoup SFU server | Your Render SFU worker URL |
| `SFU_ANNOUNCED_IP` | ✅ (custom mode) | Public IP of the SFU server for ICE | Render → SFU service → IP address |
| `LIVEKIT_URL` | ✅ (livekit mode) | LiveKit cloud WebSocket URL | cloud.livekit.io → Project → Settings |
| `LIVEKIT_API_KEY` | ✅ (livekit mode) | LiveKit API key | Same |
| `LIVEKIT_API_SECRET` | ✅ (livekit mode) | LiveKit API secret | Same |
| `PUBLIC_LIVEKIT_URL` | ✅ (livekit mode) | Same as LIVEKIT_URL (browser needs it) | Same |

```bash
# Custom WebRTC (default)
LIVE_PROVIDER=custom
SFU_URL=https://sfu.studyscroll.dev
SFU_ANNOUNCED_IP=203.0.113.42

# OR LiveKit fallback
LIVE_PROVIDER=livekit
LIVEKIT_URL=wss://studyscroll-abcd1234.livekit.cloud
LIVEKIT_API_KEY=APIabcdefgh
LIVEKIT_API_SECRET=abcdefghijklmnopqrstuvwxyz1234567890
PUBLIC_LIVEKIT_URL=wss://studyscroll-abcd1234.livekit.cloud
```

---

### Push Notifications

| Variable | Required | Description | How to get |
|---|---|---|---|
| `VAPID_PUBLIC_KEY` | ✅ | VAPID public key for Web Push | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | ✅ | VAPID private key | Same command |
| `VAPID_SUBJECT` | ✅ | Contact URL or email for push service | `mailto:push@studyscroll.dev` |
| `PUBLIC_VAPID_PUBLIC_KEY` | ✅ | Same as `VAPID_PUBLIC_KEY` (browser needs it for subscription) | Copy from above |

```bash
# Generate once:
npx web-push generate-vapid-keys
# → Public Key:  BNxyz...
# → Private Key: abc123...

VAPID_PUBLIC_KEY=BNxyz...
VAPID_PRIVATE_KEY=abc123...
VAPID_SUBJECT=mailto:push@studyscroll.dev
PUBLIC_VAPID_PUBLIC_KEY=BNxyz...   # same value as VAPID_PUBLIC_KEY
```

---

### YouTube API

| Variable | Required | Description | How to get |
|---|---|---|---|
| `YOUTUBE_API_KEY` | ✅ (video search) | YouTube Data API v3 key | console.cloud.google.com → APIs → YouTube Data API v3 → Credentials |
| `PUBLIC_YOUTUBE_API_KEY` | Optional | Same key exposed to browser (restrict to your domain!) | Same key — add HTTP referrer restriction |

```bash
YOUTUBE_API_KEY=AIzaSyC...
PUBLIC_YOUTUBE_API_KEY=AIzaSyC...   # restrict to studyscroll.dev in Google Console
```

> **Quota:** Free tier is 10,000 units/day. Each search costs 100 units. Cache results aggressively (24h).

---

### Security

| Variable | Required | Description | How to get |
|---|---|---|---|
| `DOWNLOAD_SECRET` | ✅ | HMAC secret for offline download tokens | `openssl rand -base64 32` |

```bash
DOWNLOAD_SECRET=p8mK3nQrLxT6wYj4bVuZ9hFe1cBg5sWo
```

---

### Monitoring

| Variable | Required | Description | How to get |
|---|---|---|---|
| `SENTRY_DSN` | Optional | Sentry error tracking DSN | sentry.io → Project → Settings → DSN |
| `SENTRY_AUTH_TOKEN` | CI only | For uploading source maps | sentry.io → Settings → Auth Tokens |
| `PUBLIC_SENTRY_DSN` | Optional | Same DSN (browser Sentry) | Same |
| `PUBLIC_POSTHOG_KEY` | Optional | PostHog project API key | app.posthog.com → Project Settings |
| `PUBLIC_POSTHOG_HOST` | Optional | PostHog instance URL | `https://app.posthog.com` or self-hosted |

```bash
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890
SENTRY_AUTH_TOKEN=sntrys_eyJ...
PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890
PUBLIC_POSTHOG_KEY=phc_AbCdEfGhIjKlMnOpQr
PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

### App URLs

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_APP_URL` | ✅ | Canonical base URL — used in emails, OAuth redirects, OG tags |

```bash
# Dev
PUBLIC_APP_URL=http://localhost:5173

# Production
PUBLIC_APP_URL=https://app.studyscroll.dev
```

---

## `.env.example` (Complete Template)

```bash
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studyscroll
DATABASE_DIRECT_URL=

# ── Auth ──────────────────────────────────────────────────────────────────────
BETTER_AUTH_SECRET=change-me-to-32-char-random-string
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── AI ────────────────────────────────────────────────────────────────────────
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# ── Storage ───────────────────────────────────────────────────────────────────
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=studyscroll-media
R2_PUBLIC_URL=

# ── Video (Cloudflare Stream) ─────────────────────────────────────────────────
CF_STREAM_TOKEN=
CF_ACCOUNT_ID=
CF_CUSTOMER_CODE=

# ── Email ─────────────────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=StudyScroll <noreply@studyscroll.dev>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ── Payments ──────────────────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ── Live Streaming ────────────────────────────────────────────────────────────
LIVE_PROVIDER=livekit
SFU_URL=
SFU_ANNOUNCED_IP=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# ── Push Notifications ────────────────────────────────────────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:push@studyscroll.dev

# ── YouTube ───────────────────────────────────────────────────────────────────
YOUTUBE_API_KEY=

# ── Security ──────────────────────────────────────────────────────────────────
DOWNLOAD_SECRET=change-me-to-random-string

# ── Monitoring ────────────────────────────────────────────────────────────────
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# ── Public (safe for browser) ─────────────────────────────────────────────────
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_PAYSTACK_PUBLIC_KEY=
PUBLIC_STRIPE_PUBLIC_KEY=
PUBLIC_VAPID_PUBLIC_KEY=
PUBLIC_YOUTUBE_API_KEY=
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://app.posthog.com
PUBLIC_SENTRY_DSN=
PUBLIC_LIVEKIT_URL=
```

---

## Loading Variables in SvelteKit

```typescript
// Server-side (hooks.server.ts, +page.server.ts, remote functions)
import { DATABASE_URL, GEMINI_API_KEY } from '$env/static/private';
// or for dynamic access:
import { env } from '$env/dynamic/private';

// Client-side (browser-safe PUBLIC_ vars only)
import { PUBLIC_APP_URL, PUBLIC_POSTHOG_KEY } from '$env/static/public';
// or:
import { env } from '$env/dynamic/public';

// In packages (not SvelteKit context) — use process.env directly
const apiKey = process.env.GEMINI_API_KEY!;
```

---

## Vercel Environment Setup

In the Vercel dashboard, go to **Project → Settings → Environment Variables** and add each variable for the appropriate environments (Production / Preview / Development).

For CI deployments, set them as **GitHub repository secrets** at `Settings → Secrets and Variables → Actions`.

```yaml
# .github/workflows/ci.yml excerpt
env:
  DATABASE_URL:          ${{ secrets.DATABASE_URL }}
  BETTER_AUTH_SECRET:    ${{ secrets.BETTER_AUTH_SECRET }}
  GEMINI_API_KEY:        ${{ secrets.GEMINI_API_KEY }}
  PAYSTACK_SECRET_KEY:   ${{ secrets.PAYSTACK_SECRET_KEY }}
  STRIPE_SECRET_KEY:     ${{ secrets.STRIPE_SECRET_KEY }}
  STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
  R2_ENDPOINT:           ${{ secrets.R2_ENDPOINT }}
  R2_ACCESS_KEY:         ${{ secrets.R2_ACCESS_KEY }}
  R2_SECRET_KEY:         ${{ secrets.R2_SECRET_KEY }}
  RESEND_API_KEY:        ${{ secrets.RESEND_API_KEY }}
  VAPID_PUBLIC_KEY:      ${{ secrets.VAPID_PUBLIC_KEY }}
  VAPID_PRIVATE_KEY:     ${{ secrets.VAPID_PRIVATE_KEY }}
  DOWNLOAD_SECRET:       ${{ secrets.DOWNLOAD_SECRET }}
  PUBLIC_APP_URL:        https://app.studyscroll.dev
```
