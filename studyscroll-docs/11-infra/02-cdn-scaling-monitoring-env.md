# Infrastructure — CDN, Scaling, Monitoring & Environment Variables

## CDN Strategy (Cloudflare)

```
User Request
     │
     ▼
Cloudflare Edge (100+ PoPs)
     │
     ├── Static assets (JS/CSS/fonts) → Cache HIT → immediate response
     │
     ├── API routes (/api/*) → Cache BYPASS → Vercel serverless
     │
     ├── Media (images, PDFs) → R2 + Cloudflare CDN → cache at edge
     │
     └── Videos → Cloudflare Stream → adaptive HLS/DASH at edge
```

### Cloudflare Page Rules / Cache Rules

```
Rule 1: Cache static assets
  Pattern: *.studyscroll.dev/_app/*
  Cache: Edge TTL 1 year, Browser TTL 1 day
  
Rule 2: Don't cache API routes
  Pattern: *.studyscroll.dev/api/*
  Cache: Bypass

Rule 3: Cache thumbnails from YouTube
  Pattern: img.youtube.com/*
  (Handled by browser cache — we don't proxy YouTube)

Rule 4: R2 public bucket CDN
  R2 custom domain: media.studyscroll.dev → R2 bucket
  Cache: Edge TTL 30 days for images, 7 days for PDFs
```

### R2 Bucket Organization

```
studyscroll-media/
├── avatars/
│   └── {userId}/{uuid}.webp
├── post_image/
│   └── {userId}/{uuid}.webp
├── note_pdf/
│   └── {userId}/{courseId}/{uuid}.pdf
└── downloads/
    └── {postId}/{uuid}.mp4    ← offline premium downloads
```

---

## Database Connection Pooling & Scaling

### PgBouncer via Render

```bash
# render.yaml (additions)
services:
  - type: pserv   # private service (internal only)
    name: pgbouncer
    runtime: docker
    dockerfilePath: ./docker/pgbouncer.Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase: { name: studyscroll-db, property: connectionString }
      - key: MAX_CLIENT_CONN
        value: 200
      - key: DEFAULT_POOL_SIZE
        value: 20
```

```ini
# pgbouncer.ini
[databases]
studyscroll = host=db.render.com port=5432 dbname=studyscroll

[pgbouncer]
pool_mode = transaction     # transaction pooling for serverless
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
server_idle_timeout = 600
```

### Read Replicas (Future)

When the platform reaches ~1M MAU, add a Render read replica and route heavy read queries (leaderboard, search, analytics) to the replica:

```typescript
// packages/db/src/client.ts
const writeDb = drizzle(postgres(process.env.DATABASE_URL!), { schema });
const readDb = process.env.DATABASE_REPLICA_URL
  ? drizzle(postgres(process.env.DATABASE_REPLICA_URL, { max: 20 }), { schema })
  : writeDb;

export { writeDb as db, readDb };

// Usage:
// import { readDb } from '@studyscroll/db';
// const leaderboard = await readDb.select()... (heavy read)
```

---

## Caching Strategy (In-Memory + PostgreSQL)

For v1, use PostgreSQL for all caching (no Redis needed). Use pg-boss + Drizzle for rate limiting and session storage.

```typescript
// Simple in-memory cache for hot data (per-process, not distributed)
// Fine for single Render worker instance

const cache = new Map<string, { value: any; expires: number }>();

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) { cache.delete(key); return null; }
  return entry.value as T;
}

export function cacheSet(key: string, value: any, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires < now) cache.delete(key);
  }
}, 5 * 60_000);

// Example usage: cache leaderboard for 30 seconds
export async function getCachedLeaderboard(scope: string) {
  const cached = cacheGet<LeaderboardEntry[]>(`leaderboard:${scope}`);
  if (cached) return cached;

  const result = await computeLeaderboard(scope);
  cacheSet(`leaderboard:${scope}`, result, 30_000);
  return result;
}
```

---

## Monitoring — Sentry + PostHog

See `11-infra/01-deployment.md` for initialization code.

### Key Events to Track (PostHog)

```typescript
// src/lib/utils/analytics.ts
import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const track = {
  feedScrolled:      (depth: number) => capture('feed_scrolled', { depth }),
  postViewed:        (postId: string, postType: string) => capture('post_viewed', { postId, postType }),
  quizAnswered:      (correct: boolean, topic: string) => capture('quiz_answered', { correct, topic }),
  flashcardFlipped:  (knew: boolean) => capture('flashcard_flipped', { knew }),
  videoWatched:      (videoId: string, pct: number) => capture('video_watched', { videoId, pct }),
  studySessionStart: (mode: string) => capture('study_session_start', { mode }),
  examReminder:      (daysLeft: number) => capture('exam_reminder_shown', { daysLeft }),
  paymentStarted:    (plan: string, currency: string) => capture('payment_started', { plan, currency }),
  paymentComplete:   (plan: string, currency: string) => capture('payment_complete', { plan, currency }),
  achievementEarned: (badge: string) => capture('achievement_earned', { badge }),
};

function capture(event: string, props?: object) {
  if (browser && typeof posthog !== 'undefined') {
    posthog.capture(event, props);
  }
}
```

### Sentry Error Boundaries

```svelte
<!-- src/lib/components/ui/ErrorBoundary.svelte -->
<script lang="ts">
  import * as Sentry from '@sentry/sveltekit';
  import { onMount } from 'svelte';

  let { children } = $props();
  let error = $state<Error | null>(null);

  // Svelte doesn't have error boundaries yet — use global handler
  onMount(() => {
    const handler = (event: ErrorEvent) => {
      error = event.error;
      Sentry.captureException(event.error);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  });
</script>

{#if error}
  <div class="flex flex-col items-center justify-center py-16 gap-4">
    <span class="text-4xl">⚠️</span>
    <h2 class="text-lg font-semibold">Something went wrong</h2>
    <button onclick={() => location.reload()}
            class="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm">
      Reload Page
    </button>
  </div>
{:else}
  {@render children()}
{/if}
```

---

## Complete Environment Variables Reference

```bash
# ============================================================
# DATABASE
# ============================================================
DATABASE_URL=postgresql://user:pass@db.host:5432/studyscroll
DATABASE_DIRECT_URL=postgresql://user:pass@db.host:5432/studyscroll
# (DIRECT_URL = no PgBouncer, used for Drizzle migrations)

# ============================================================
# AUTH
# ============================================================
BETTER_AUTH_SECRET=32-char-random-string
BETTER_AUTH_URL=https://app.studyscroll.dev
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# ============================================================
# AI PROVIDERS
# ============================================================
GEMINI_API_KEY=AIza...             # Primary — required
ANTHROPIC_API_KEY=sk-ant-...       # Fallback — optional in dev

# ============================================================
# STORAGE — Cloudflare R2
# ============================================================
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_BUCKET=studyscroll-media
R2_PUBLIC_URL=https://media.studyscroll.dev

# ============================================================
# VIDEO — Cloudflare Stream
# ============================================================
CF_STREAM_TOKEN=xxx
CF_ACCOUNT_ID=xxx
CF_CUSTOMER_CODE=xxx               # From Stream dashboard → Subdomain

# ============================================================
# EMAIL
# ============================================================
RESEND_API_KEY=re_xxx              # Primary
SMTP_HOST=smtp.gmail.com           # Nodemailer fallback
SMTP_PORT=587
SMTP_USER=noreply@studyscroll.dev
SMTP_PASS=xxx
EMAIL_FROM=StudyScroll <noreply@studyscroll.dev>

# ============================================================
# PAYMENTS
# ============================================================
PAYSTACK_SECRET_KEY=sk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ============================================================
# LIVE STREAMING
# ============================================================
SFU_URL=https://sfu.studyscroll.dev       # Custom mediasoup SFU
SFU_ANNOUNCED_IP=xxx.xxx.xxx.xxx           # Public IP of SFU server
LIVE_PROVIDER=custom                       # or 'livekit'
LIVEKIT_URL=wss://studyscroll.livekit.cloud
LIVEKIT_API_KEY=xxx
LIVEKIT_API_SECRET=xxx

# ============================================================
# PUSH NOTIFICATIONS
# ============================================================
VAPID_PUBLIC_KEY=BNxxx...          # Generate with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:push@studyscroll.dev

# ============================================================
# YOUTUBE
# ============================================================
YOUTUBE_API_KEY=AIza...            # YouTube Data API v3 key

# ============================================================
# SECURITY
# ============================================================
DOWNLOAD_SECRET=random-32-char-string    # For signed download tokens

# ============================================================
# MONITORING
# ============================================================
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx                    # For source maps upload in CI

# ============================================================
# PUBLIC (exposed to browser, must start with PUBLIC_)
# ============================================================
PUBLIC_APP_URL=https://app.studyscroll.dev
PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx
PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
PUBLIC_YOUTUBE_API_KEY=${YOUTUBE_API_KEY}   # Restrict to studyscroll.dev in Google Console
PUBLIC_POSTHOG_KEY=phc_xxx
PUBLIC_POSTHOG_HOST=https://app.posthog.com
PUBLIC_SENTRY_DSN=${SENTRY_DSN}
PUBLIC_LIVEKIT_URL=${LIVEKIT_URL}

# ============================================================
# DEVELOPMENT ONLY
# ============================================================
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studyscroll
BETTER_AUTH_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
```

---

## Render Infrastructure Sizing

| Service | Plan | Specs | Monthly Cost (est.) |
|---|---|---|---|
| PostgreSQL | Standard | 1 vCPU, 1GB RAM, 10GB SSD | $25 |
| Job Worker | Starter | 0.5 vCPU, 512MB RAM | $7 |
| SFU Worker | Standard Plus | 2 vCPU, 2GB RAM | $50 |
| **Total** | | | **~$82/mo** |

Cloudflare (R2 + Stream + CDN) free tier covers up to ~10GB storage and 1M requests/month. Stream costs $5/1000 min stored after free tier.

Vercel free tier handles up to 100GB bandwidth and 1M serverless invocations. Pro plan ($20/mo) required for commercial use.
