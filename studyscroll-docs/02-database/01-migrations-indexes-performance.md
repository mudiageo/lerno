# Database — Migrations, Indexes & Performance

## Migration Workflow

```bash
# 1. Edit schema files in packages/db/src/schema/
# 2. Generate migration SQL
vp run db:generate
# → creates packages/db/migrations/0001_*.sql

# 3. Review the generated SQL before applying
cat packages/db/migrations/0001_*.sql

# 4. Apply migration
vp run db:migrate

# 5. Verify in Drizzle Studio
vp run db:studio
```

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Schema Index (re-exports all tables)

```typescript
// packages/db/src/schema/index.ts
export * from './users';
export * from './courses';
export * from './posts';
export * from './interactions';
export * from './mastery';
export * from './payments';
export * from './communities';
export * from './notifications';
export * from './live';
export * from './jobs';

// Additional tables referenced in schema files above
export * from './youtube-cache';
export * from './dmca';
export * from './push-subscriptions';
```

### YouTube Cache Table

```typescript
// packages/db/src/schema/youtube-cache.ts
import { pgTable, uuid, text, jsonb, timestamptz } from 'drizzle-orm/pg-core';

export const youtubeCache = pgTable('youtube_cache', {
  id:         uuid('id').primaryKey().defaultRandom(),
  cacheKey:   text('cache_key').unique().notNull(),
  results:    jsonb('results').notNull(),
  createdAt:  timestamptz('created_at').defaultNow(),
});
```

### DMCA Requests Table

```typescript
// packages/db/src/schema/dmca.ts
import { pgTable, uuid, text, timestamptz, pgEnum } from 'drizzle-orm/pg-core';
import { posts } from './posts';

export const dmcaStatusEnum = pgEnum('dmca_status', ['pending', 'actioned', 'counter_filed', 'resolved']);

export const dmcaRequests = pgTable('dmca_requests', {
  id:             uuid('id').primaryKey().defaultRandom(),
  postId:         uuid('post_id').references(() => posts.id).notNull(),
  reason:         text('reason').notNull(),
  reporterEmail:  text('reporter_email').notNull(),
  status:         dmcaStatusEnum('status').default('pending'),
  resolutionNote: text('resolution_note'),
  createdAt:      timestamptz('created_at').defaultNow(),
  resolvedAt:     timestamptz('resolved_at'),
});
```

---

## Complete Index Strategy

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE UNIQUE INDEX idx_users_email    ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_plan           ON users(plan);
CREATE INDEX idx_users_institution    ON users(institution_id) WHERE institution_id IS NOT NULL;

-- Trigram for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_username_trgm ON users USING GIN(username gin_trgm_ops);
CREATE INDEX idx_users_name_trgm     ON users USING GIN(display_name gin_trgm_ops);

-- ============================================================
-- COURSES
-- ============================================================
CREATE INDEX idx_courses_user_active  ON user_courses(user_id, active);
CREATE INDEX idx_courses_code         ON user_courses(code);
CREATE INDEX idx_schedule_upcoming    ON course_schedule(user_id, scheduled_at)
  WHERE scheduled_at > now();
CREATE INDEX idx_materials_course     ON course_materials(course_id);
CREATE INDEX idx_materials_unprocessed ON course_materials(processed)
  WHERE processed = false;

-- ============================================================
-- POSTS — Core feed queries
-- ============================================================
-- Primary feed query (course-scoped, visible, not reply, time-ordered)
CREATE INDEX idx_posts_feed ON posts(course_id, is_visible, parent_id, created_at DESC)
  WHERE is_visible = true AND parent_id IS NULL;

-- Engagement ranking
CREATE INDEX idx_posts_engagement ON posts(engagement_score DESC, created_at DESC)
  WHERE is_visible = true;

-- By author
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC)
  WHERE is_visible = true;

-- AI-generated pool (for content generation dedup checks)
CREATE INDEX idx_posts_ai_course ON posts(course_id, ai_generated, post_type, created_at DESC)
  WHERE ai_generated = true AND is_visible = true;

-- Post type filter (watch/study mode)
CREATE INDEX idx_posts_type_course ON posts(post_type, course_id, created_at DESC)
  WHERE is_visible = true;

-- Flagged content (moderation queue)
CREATE INDEX idx_posts_flagged ON posts(created_at DESC)
  WHERE is_flagged = true;

-- Full-text search
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(content->>'body', '') || ' ' ||
      coalesce(content->>'question', '') || ' ' ||
      coalesce(content->>'front', '') || ' ' ||
      array_to_string(topic_tags, ' ')
    )
  ) STORED;
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- GIN on topic_tags array
CREATE INDEX idx_posts_tags ON posts USING GIN(topic_tags);

-- ============================================================
-- INTERACTIONS
-- ============================================================
-- Check if user liked/bookmarked a specific post
CREATE UNIQUE INDEX idx_interactions_unique ON interactions(user_id, post_id, type)
  WHERE post_id IS NOT NULL;

-- Aggregation for engagement score updates
CREATE INDEX idx_interactions_post_type ON interactions(post_id, type);

-- User interaction history (feed dedup)
CREATE INDEX idx_interactions_user_views ON interactions(user_id, created_at DESC)
  WHERE type = 'view';

-- Quiz answer history per topic
CREATE INDEX idx_interactions_quiz_user ON interactions(user_id, created_at DESC)
  WHERE type = 'quiz_answer';

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================================
-- MASTERY
-- ============================================================
CREATE INDEX idx_mastery_user_course ON topic_mastery(user_id, course_id);
CREATE INDEX idx_mastery_weak_topics ON topic_mastery(user_id, score)
  WHERE score < 70;

-- FSRS due cards
CREATE INDEX idx_mastery_fsrs_due ON topic_mastery(user_id, fsrs_due)
  WHERE fsrs_due IS NOT NULL;

-- ============================================================
-- GAMIFICATION
-- ============================================================
CREATE INDEX idx_xp_events_user ON xp_events(user_id, created_at DESC);
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE UNIQUE INDEX idx_achievements_unique ON achievements(user_id, badge);

-- Leaderboard (needs to be fast)
CREATE INDEX idx_users_xp_leaderboard ON users(xp DESC, streak_days DESC);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_provider_id ON subscriptions(provider_sub_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status)
  WHERE status = 'active';
CREATE INDEX idx_payment_events_user ON payment_events(user_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read = false;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);

-- ============================================================
-- COMMUNITIES
-- ============================================================
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_communities_course ON communities(course_code)
  WHERE course_code IS NOT NULL;

-- ============================================================
-- LIVE STREAMS
-- ============================================================
CREATE INDEX idx_streams_live    ON streams(status, scheduled_at)
  WHERE status = 'live';
CREATE INDEX idx_streams_host    ON streams(host_id, created_at DESC);
CREATE INDEX idx_streams_course  ON streams(course_id, status);

-- ============================================================
-- YOUTUBE CACHE
-- ============================================================
CREATE INDEX idx_yt_cache_key    ON youtube_cache(cache_key);
CREATE INDEX idx_yt_cache_age    ON youtube_cache(created_at);
```

---

## Connection Pooling

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// For serverless (Vercel edge functions) — use connection pooling
const isEdge = process.env.VERCEL_REGION !== undefined;

const client = postgres(process.env.DATABASE_URL!, {
  max: isEdge ? 1 : 10,       // 1 connection in serverless, pool in workers
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !isEdge,           // prepared statements don't work in serverless
});

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === 'development' });
export type DB = typeof db;
```

### External Connection Pooler (Render + PgBouncer)

For production, add PgBouncer via Render's managed database connection pooling:

```
DATABASE_URL=postgresql://user:pass@pooler.render.com:6543/studyscroll?pgbouncer=true
DATABASE_DIRECT_URL=postgresql://user:pass@db.render.com:5432/studyscroll
# Use DIRECT_URL for migrations (Drizzle needs direct connection)
```

```typescript
// drizzle.config.ts — use direct URL for migrations
export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
```

---

## Query Performance Patterns

### Feed Query — Efficient Scoring

Instead of computing scores in application code for large datasets, push heavy scoring to PostgreSQL:

```sql
-- Materialized view for pre-scored posts (refreshed every 5 minutes by pg-boss)
CREATE MATERIALIZED VIEW post_scores AS
SELECT
  p.id,
  p.course_id,
  p.post_type,
  p.ai_generated,
  p.topic_tags,
  p.created_at,
  -- Engagement score (normalized)
  LOG(GREATEST(p.like_count + p.reply_count * 2 + p.repost_count * 3, 1)) / 10.0 AS engagement_score,
  -- Recency (exponential decay, half-life 24h)
  EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS recency_score
FROM posts p
WHERE p.is_visible = true AND p.parent_id IS NULL;

CREATE UNIQUE INDEX ON post_scores(id);
CREATE INDEX ON post_scores(course_id, recency_score DESC);
```

```typescript
// Refresh via pg-boss job every 5 minutes
await pgBoss.schedule('refresh-post-scores', '*/5 * * * *', {});
// Handler:
async function refreshPostScores() {
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY post_scores`);
}
```

### N+1 Prevention — Use Drizzle Relations

```typescript
// ❌ N+1 — don't do this
const posts = await db.select().from(posts).limit(20);
for (const post of posts) {
  post.author = await db.query.users.findFirst({ where: eq(users.id, post.authorId) });
}

// ✅ Single query with JOIN
const posts = await db.query.posts.findMany({
  limit: 20,
  with: {
    author: {
      columns: { id: true, username: true, displayName: true, avatarUrl: true },
    },
  },
});
```

### Engagement Score Update (Trigger vs. Job)

Use a pg-boss job (not a DB trigger) to keep `engagement_score` updated — triggers on high-traffic tables cause lock contention.

```typescript
// packages/jobs/src/jobs/update-engagement.ts
export async function updateEngagementScores() {
  // Update scores for posts that had interactions in the last 10 minutes
  await db.execute(sql`
    UPDATE posts SET
      engagement_score = (
        like_count * 1 + reply_count * 2 + repost_count * 3 + view_count * 0.1
      )::integer
    WHERE id IN (
      SELECT DISTINCT post_id FROM interactions
      WHERE created_at > now() - interval '10 minutes'
      AND post_id IS NOT NULL
    )
  `);
}
// Runs every 10 minutes via pg-boss schedule
```
