# Scaling Strategy — Performance, Growth & Infrastructure Roadmap

## Scaling Phases

### Phase 1: 0 → 10,000 Users (Current Architecture)
- Single PostgreSQL on Render Standard
- Vercel serverless (auto-scales)
- In-process in-memory cache
- Single pg-boss worker
- Cloudflare R2 + Stream handles all media
- Cost: ~$82/month

### Phase 2: 10,000 → 100,000 Users
- Add PgBouncer connection pooler
- Add PostgreSQL read replica (Render)
- Move in-memory cache to Redis (Upstash — serverless)
- Split pg-boss into 3 workers (content generation / email+push / analytics)
- Add Cloudflare Workers for edge caching of feed data
- Cost: ~$300/month

### Phase 3: 100,000 → 1,000,000 Users
- Multi-region PostgreSQL (primary EU-West + replica US-East + replica AF-South)
- Redis cluster with read replicas
- Horizontally scale pg-boss workers on Render
- Move SFU (mediasoup) to dedicated instances per region
- Consider moving to managed Kubernetes (Render K8s or GKE)
- CDN: move from Vercel to Cloudflare Pages for lower latency globally
- Cost: ~$2,000–5,000/month

---

## Database Scaling

### Read Replica Routing

```typescript
// packages/db/src/client.ts — Phase 2+

const primaryClient = postgres(process.env.DATABASE_URL!, { max: 10 });
const replicaClient = process.env.DATABASE_REPLICA_URL
  ? postgres(process.env.DATABASE_REPLICA_URL, { max: 20, prepare: false })
  : primaryClient;

export const db = drizzle(primaryClient, { schema });     // writes
export const readDb = drizzle(replicaClient, { schema }); // reads

// Usage pattern:
// Feed queries → readDb (high volume, tolerates slight staleness)
// Payments, auth → db (must be consistent)
// Background jobs → db (writes)
```

### Redis (Phase 2)

```typescript
// packages/cache/src/index.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Replace in-memory cache:
export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function cacheSet(key: string, value: any, ttlSecs: number) {
  return redis.setex(key, ttlSecs, value);
}

export async function cacheDelete(key: string) {
  return redis.del(key);
}

// Rate limiting (replaces in-memory Map):
export async function incrementRateLimit(key: string, windowSecs: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSecs);
  return count;
}
```

---

## Feed Performance at Scale

### Problem
At 100k+ users, computing personalized scores for 100+ candidates per feed request in application code becomes slow.

### Solution: Pre-scored Candidate Pool + User-Specific Ranking

```typescript
// Phase 2: Two-tier feed system

// Tier 1 (background job, every 5 min):
// Pre-score all recent posts and store in post_scores materialized view
// (engagement + recency factors — same for all users)

// Tier 2 (per-request, fast):
// Apply user-specific multipliers (course relevance, weak topic boost)
// to pre-scored candidates — much less computation per request

export const getFeedFast = query(async ({ userId, cursor }) => {
  // 1. Get user context (cached in Redis, TTL 60s)
  const userCtx = await getUserContext(userId); // courses, mastery, schedule

  // 2. Fetch pre-scored candidates (from materialized view — fast index scan)
  const candidates = await readDb.execute(sql`
    SELECT ps.*, p.*
    FROM post_scores ps
    JOIN posts p ON p.id = ps.id
    WHERE ps.course_id = ANY(${userCtx.courseIds})
      AND p.is_visible = true
      AND p.parent_id IS NULL
      ${cursor ? sql`AND p.created_at < ${cursor}` : sql``}
    ORDER BY ps.recency_score DESC
    LIMIT 60
  `);

  // 3. Apply user-specific scoring in JS (fast, no DB round-trip)
  return scoreAndFilter(candidates, userCtx).slice(0, 20);
});
```

---

## CDN & Edge Caching

### Cloudflare Workers — Feed Edge Cache (Phase 2+)

```javascript
// cloudflare-workers/feed-cache.js
// Cache feed responses at Cloudflare edge for 30 seconds
// Reduces Vercel invocations by ~80% during peak hours

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Only cache GET requests to /api/feed
  if (!request.url.includes('/api/feed') || request.method !== 'GET') {
    return fetch(request);
  }

  const cacheKey = new Request(request.url, request);
  const cache = caches.default;

  let response = await cache.match(cacheKey);
  if (response) return response;

  response = await fetch(request);
  const toCache = new Response(response.body, response);
  toCache.headers.set('Cache-Control', 's-maxage=30');
  event.waitUntil(cache.put(cacheKey, toCache.clone()));
  return toCache;
}
```

---

## Background Job Scaling

### Phase 1: Single Worker
```
jobs worker (Render starter)
  ├── AI content generation
  ├── Email sending
  ├── Push notifications
  ├── Upload processing (OCR)
  └── Analytics updates
```

### Phase 2+: Split Workers

```yaml
# render.yaml additions
services:
  - name: worker-content
    type: worker
    plan: standard
    startCommand: node dist/worker-content.js
    # Handles: generate-content, process-upload

  - name: worker-comms
    type: worker
    plan: starter
    startCommand: node dist/worker-comms.js
    # Handles: send-email, send-push, notifications

  - name: worker-analytics
    type: worker
    plan: starter
    startCommand: node dist/worker-analytics.js
    # Handles: update-engagement, refresh-leaderboards, detect-at-risk
```

---

## Performance Monitoring & SLOs

### Target SLOs

| Metric | Target | Alert at |
|---|---|---|
| Feed API p50 latency | < 200ms | > 500ms |
| Feed API p99 latency | < 1000ms | > 2000ms |
| Uptime | 99.9% | < 99.5% |
| AI generation success rate | > 95% | < 90% |
| Email delivery rate | > 98% | < 95% |
| Push notification delivery | > 90% | < 80% |

### Sentry Performance Monitoring

```typescript
// apps/web/src/hooks.server.ts
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.05,
  integrations: [
    new Sentry.Integrations.Postgres(),   // trace DB queries
  ],
});

// Custom performance marks for feed
export const handle = Sentry.wrapHandleHook(async ({ event, resolve }) => {
  const span = Sentry.startSpan({ name: 'feed.load', op: 'http.server' }, () =>
    resolve(event)
  );
  return span;
});
```

---

## AI Cost Scaling

### Gemini API Cost Management

```typescript
// As user base grows, AI generation costs scale linearly.
// Key levers:

// 1. Batch generation (already implemented) — generate for all users nightly,
//    not per-request. This amortizes API calls.

// 2. Content reuse — generated posts are shared across users enrolled in
//    the same course. 1000 users in CPE461 share the same pool of AI posts.

// 3. Quota-aware generation — skip users who haven't been active in 7+ days.

// 4. Model routing:
//    - Simple posts (text, flashcard) → gemini-flash (cheaper, faster)
//    - Complex generation (mock exam, thread) → gemini-2.5-pro
//    - Vision/OCR → gemini-pro-vision

export const MODEL_ROUTING: Record<string, string> = {
  text:      'gemini-1.5-flash',
  flashcard: 'gemini-1.5-flash',
  poll:      'gemini-1.5-flash',
  quiz:      'gemini-1.5-flash',
  thread:    'gemini-2.5-pro',
  mock_exam: 'gemini-2.5-pro',
  ocr:       'gemini-1.5-pro',
  tutor:     'gemini-1.5-flash',
};
```

---

## Multi-Region Deployment (Phase 3)

```
                    Cloudflare (Global CDN + DNS)
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   Vercel EU-West   Vercel US-East   Vercel AP-Southeast
          │                │                │
          └────────────────┼────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         Render EU    Render US    Render AF
         (Primary DB) (Read Replica) (Read Replica)
              │
         pg-boss workers (EU only — all writes here)
```

Routing: Cloudflare routes each user to the closest Vercel region. Reads go to the nearest DB replica. Writes always go to the EU primary. pg-boss workers only run in EU to avoid distributed write conflicts.
