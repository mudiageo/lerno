# Database Schema — Complete Drizzle ORM

## Overview

All tables use:
- `uuid` primary keys with `defaultRandom()`
- `timestamptz` for all timestamps
- `jsonb` for flexible/polymorphic content
- PostgreSQL arrays for tags/lists
- Enum types for constrained string values

---

## Schema Files

### packages/db/src/schema/users.ts

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamptz, integer, pgEnum } from 'drizzle-orm/pg-core';

export const themeEnum = pgEnum('theme', ['light', 'dark', 'oled', 'system']);
export const planEnum = pgEnum('plan', ['free', 'premium', 'institutional']);

export const users = pgTable('users', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  username:            varchar('username', { length: 40 }).unique().notNull(),
  displayName:         varchar('display_name', { length: 80 }),
  email:               varchar('email', { length: 255 }).unique().notNull(),
  emailVerified:       boolean('email_verified').default(false),
  avatarUrl:           text('avatar_url'),
  bio:                 text('bio'),
  plan:                planEnum('plan').default('free').notNull(),
  aiEnabled:           boolean('ai_enabled').default(true),
  theme:               themeEnum('theme').default('system'),
  dyslexiaFont:        boolean('dyslexia_font').default(false),
  reducedMotion:       boolean('reduced_motion').default(false),
  xp:                  integer('xp').default(0),
  streakDays:          integer('streak_days').default(0),
  lastActiveDate:      timestamptz('last_active_date'),
  referralCode:        varchar('referral_code', { length: 16 }).unique(),
  referredBy:          uuid('referred_by').references(() => users.id),
  institutionId:       uuid('institution_id'),
  createdAt:           timestamptz('created_at').defaultNow(),
  updatedAt:           timestamptz('updated_at').defaultNow(),
});
```

### packages/db/src/schema/courses.ts

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamptz, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const eventTypeEnum = pgEnum('event_type', ['exam', 'quiz', 'lab', 'assignment', 'presentation', 'other']);
export const semesterEnum = pgEnum('semester', ['first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3']);

export const userCourses = pgTable('user_courses', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  code:         varchar('code', { length: 20 }).notNull(),         // e.g. CPE461
  title:        text('title').notNull(),
  description:  text('description'),
  semester:     semesterEnum('semester'),
  year:         integer('year'),
  creditUnits:  integer('credit_units'),
  active:       boolean('active').default(true),
  color:        varchar('color', { length: 7 }),                   // hex for UI
  createdAt:    timestamptz('created_at').defaultNow(),
});

export const courseSchedule = pgTable('course_schedule', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId:      uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  eventType:     eventTypeEnum('event_type').notNull(),
  title:         text('title').notNull(),
  description:   text('description'),
  scheduledAt:   timestamptz('scheduled_at').notNull(),
  durationMins:  integer('duration_mins'),
  weightPct:     integer('weight_pct'),                            // % of final grade
  location:      text('location'),
  reminderSent:  boolean('reminder_sent').default(false),
  createdAt:     timestamptz('created_at').defaultNow(),
});

export const courseMaterials = pgTable('course_materials', {
  id:          uuid('id').primaryKey().defaultRandom(),
  courseId:    uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  userId:      uuid('user_id').references(() => users.id).notNull(),
  type:        varchar('type', { length: 20 }).notNull(),         // pdf|note|image|url
  title:       text('title').notNull(),
  storageKey:  text('storage_key'),                               // R2 key
  url:         text('url'),
  ocrText:     text('ocr_text'),                                  // extracted text
  processed:   boolean('processed').default(false),
  createdAt:   timestamptz('created_at').defaultNow(),
});
```

### packages/db/src/schema/posts.ts

```typescript
import { pgTable, uuid, text, boolean, timestamptz, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { userCourses } from './courses';

export const postTypeEnum = pgEnum('post_type', [
  'text', 'image', 'video', 'quiz', 'flashcard', 'poll',
  'thread', 'short', 'link', 'past_exam_q', 'mock_exam',
]);

export const posts = pgTable('posts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  authorId:         uuid('author_id').references(() => users.id, { onDelete: 'set null' }), // null = AI
  courseId:         uuid('course_id').references(() => userCourses.id, { onDelete: 'set null' }),
  parentId:         uuid('parent_id'),                            // for replies/threads
  repostOfId:       uuid('repost_of_id'),                        // for reposts
  quoteOfId:        uuid('quote_of_id'),                         // for quote posts
  postType:         postTypeEnum('post_type').notNull(),
  content:          jsonb('content').notNull(),                   // see content schemas below
  topicTags:        text('topic_tags').array().default(sql`'{}'`),
  aiGenerated:      boolean('ai_generated').default(false),
  isVisible:        boolean('is_visible').default(true),
  isFlagged:        boolean('is_flagged').default(false),
  isPremium:        boolean('is_premium').default(false),         // premium-only content
  // Computed engagement fields (updated by triggers/jobs)
  likeCount:        integer('like_count').default(0),
  replyCount:       integer('reply_count').default(0),
  repostCount:      integer('repost_count').default(0),
  viewCount:        integer('view_count').default(0),
  engagementScore:  integer('engagement_score').default(0),
  // Search
  searchVector:     text('search_vector'),                        // tsvector stored as text for Drizzle
  createdAt:        timestamptz('created_at').defaultNow(),
  updatedAt:        timestamptz('updated_at').defaultNow(),
});

/*
Content JSON schemas by postType:

text:      { body: string (max 500 chars) }
image:     { body?: string, images: [{ url: string, alt: string, width: number, height: number }] }
video:     { title: string, description?: string, videoUrl: string, thumbnailUrl: string, durationSecs: number, cloudflareStreamId?: string }
short:     { videoUrl: string, thumbnailUrl: string, durationSecs: number (max 60), caption?: string }
quiz:      { question: string, options: string[], correctIndex: number, explanation: string, difficulty: 'easy'|'medium'|'hard' }
flashcard: { front: string, back: string, hint?: string }
poll:      { question: string, options: string[], endsAt: string (ISO) }
thread:    { body: string, threadIds: string[] }  (parent post)
link:      { url: string, title: string, description: string, imageUrl?: string }
past_exam_q: { question: string, year?: number, source?: string, answer?: string, marking_scheme?: string }
mock_exam:   { title: string, courseCode: string, questions: QuizContent[], timeLimitMins: number }
*/
```

### packages/db/src/schema/interactions.ts

```typescript
import { pgTable, uuid, varchar, jsonb, timestamptz, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { posts } from './posts';

export const interactionTypeEnum = pgEnum('interaction_type', [
  'like', 'repost', 'bookmark', 'view',
  'quiz_answer', 'flashcard_flip', 'poll_vote',
  'follow', 'block', 'report',
]);

export const interactions = pgTable('interactions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId:      uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  targetUserId:uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  type:        interactionTypeEnum('type').notNull(),
  payload:     jsonb('payload'),
  /*
    quiz_answer:   { selectedIndex: number, correct: boolean, timeMs: number }
    flashcard_flip:{ knew: boolean }
    poll_vote:     { optionIndex: number }
  */
  createdAt:   timestamptz('created_at').defaultNow(),
});

export const follows = pgTable('follows', {
  followerId:  uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt:   timestamptz('created_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.followerId, t.followingId] }) }));
```

### packages/db/src/schema/mastery.ts

```typescript
import { pgTable, uuid, text, integer, real, timestamptz, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { userCourses } from './courses';

export const topicMastery = pgTable('topic_mastery', {
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId:     uuid('course_id').references(() => userCourses.id, { onDelete: 'cascade' }).notNull(),
  topic:        text('topic').notNull(),
  score:        integer('score').default(50).notNull(),             // 0-100 Bayesian estimate
  attempts:     integer('attempts').default(0),
  correct:      integer('correct').default(0),
  // FSRS spaced repetition fields
  fsrsDue:      timestamptz('fsrs_due'),
  fsrsStability:real('fsrs_stability'),
  fsrsDifficulty: real('fsrs_difficulty'),
  fsrsReps:     integer('fsrs_reps').default(0),
  fsrsLapses:   integer('fsrs_lapses').default(0),
  updatedAt:    timestamptz('updated_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.courseId, t.topic] }) }));

export const xpEvents = pgTable('xp_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType:    text('event_type').notNull(),
  /*
    events: post_created, quiz_correct, quiz_incorrect, flashcard_knew,
            streak_day, daily_login, course_complete, exam_pass,
            first_post, first_quiz, level_up
  */
  xpAwarded:    integer('xp_awarded').notNull(),
  metadata:     jsonb('metadata'),
  createdAt:    timestamptz('created_at').defaultNow(),
});

export const achievements = pgTable('achievements', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badge:        text('badge').notNull(),
  /*
    badges: first_scroll, streak_7, streak_30, quiz_master, flashcard_100,
            top_poster, community_hero, exam_ace, night_owl, early_bird
  */
  earnedAt:     timestamptz('earned_at').defaultNow(),
});
```

### packages/db/src/schema/payments.ts

```typescript
import { pgTable, uuid, text, varchar, integer, boolean, timestamptz, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const paymentProviderEnum = pgEnum('payment_provider', ['paystack', 'stripe']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'active', 'cancelled', 'expired', 'failed']);
export const billingPeriodEnum = pgEnum('billing_period', ['monthly', 'yearly', 'one_time', 'institutional']);

export const subscriptions = pgTable('subscriptions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider:         paymentProviderEnum('provider').notNull(),
  providerSubId:    text('provider_sub_id').notNull(),             // Paystack/Stripe subscription ID
  plan:             varchar('plan', { length: 30 }).notNull(),    // 'premium_monthly', 'premium_yearly'
  status:           paymentStatusEnum('status').default('pending'),
  billingPeriod:    billingPeriodEnum('billing_period').notNull(),
  amount:           integer('amount').notNull(),                   // in smallest currency unit
  currency:         varchar('currency', { length: 3 }).notNull(), // NGN, USD, GHS
  currentPeriodEnd: timestamptz('current_period_end'),
  cancelAtEnd:      boolean('cancel_at_end').default(false),
  createdAt:        timestamptz('created_at').defaultNow(),
  updatedAt:        timestamptz('updated_at').defaultNow(),
});

export const paymentEvents = pgTable('payment_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id),
  provider:     paymentProviderEnum('provider').notNull(),
  eventType:    text('event_type').notNull(),                      // raw webhook event type
  amount:       integer('amount'),
  currency:     varchar('currency', { length: 3 }),
  status:       paymentStatusEnum('status'),
  rawPayload:   jsonb('raw_payload'),
  createdAt:    timestamptz('created_at').defaultNow(),
});

export const institutions = pgTable('institutions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  domain:         varchar('domain', { length: 100 }),              // e.g. unilag.edu.ng
  logoUrl:        text('logo_url'),
  brandColor:     varchar('brand_color', { length: 7 }),
  seatLimit:      integer('seat_limit').notNull(),
  seatsUsed:      integer('seats_used').default(0),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  active:         boolean('active').default(true),
  createdAt:      timestamptz('created_at').defaultNow(),
});
```

### packages/db/src/schema/communities.ts

```typescript
import { pgTable, uuid, text, varchar, boolean, timestamptz, integer, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const communityRoleEnum = pgEnum('community_role', ['member', 'moderator', 'admin']);

export const communities = pgTable('communities', {
  id:           uuid('id').primaryKey().defaultRandom(),
  slug:         varchar('slug', { length: 60 }).unique().notNull(),
  name:         text('name').notNull(),
  description:  text('description'),
  avatarUrl:    text('avatar_url'),
  bannerUrl:    text('banner_url'),
  isPrivate:    boolean('is_private').default(false),
  courseCode:   varchar('course_code', { length: 20 }),            // optional course tie-in
  memberCount:  integer('member_count').default(0),
  createdBy:    uuid('created_by').references(() => users.id),
  createdAt:    timestamptz('created_at').defaultNow(),
});

export const communityMembers = pgTable('community_members', {
  communityId:  uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }).notNull(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role:         communityRoleEnum('role').default('member'),
  joinedAt:     timestamptz('joined_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.communityId, t.userId] }) }));
```

### packages/db/src/schema/notifications.ts

```typescript
import { pgTable, uuid, text, boolean, timestamptz, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type:        text('type').notNull(),
  /*
    types: like, reply, repost, quote, follow, mention,
           quiz_due, exam_reminder, achievement, streak_at_risk,
           live_started, space_started, community_invite
  */
  actorId:     uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  targetId:    uuid('target_id'),                                  // post_id or user_id depending on type
  body:        text('body'),
  metadata:    jsonb('metadata'),
  read:        boolean('read').default(false),
  createdAt:   timestamptz('created_at').defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint:     text('endpoint').notNull(),
  p256dh:       text('p256dh').notNull(),
  auth:         text('auth').notNull(),
  platform:     text('platform'),                                  // web | tauri | android
  createdAt:    timestamptz('created_at').defaultNow(),
});
```

### packages/db/src/schema/live.ts

```typescript
import { pgTable, uuid, text, boolean, timestamptz, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { userCourses } from './courses';

export const streamStatusEnum = pgEnum('stream_status', ['scheduled', 'live', 'ended']);
export const streamProviderEnum = pgEnum('stream_provider', ['custom_webrtc', 'livekit']);

export const streams = pgTable('streams', {
  id:           uuid('id').primaryKey().defaultRandom(),
  hostId:       uuid('host_id').references(() => users.id).notNull(),
  courseId:     uuid('course_id').references(() => userCourses.id),
  title:        text('title').notNull(),
  description:  text('description'),
  thumbnailUrl: text('thumbnail_url'),
  status:       streamStatusEnum('status').default('scheduled'),
  provider:     streamProviderEnum('provider').default('custom_webrtc'),
  roomId:       text('room_id'),                                   // WebRTC/LiveKit room ID
  rtmpKey:      text('rtmp_key'),
  viewerCount:  integer('viewer_count').default(0),
  peakViewers:  integer('peak_viewers').default(0),
  isAudioOnly:  boolean('is_audio_only').default(false),           // Spaces
  scheduledAt:  timestamptz('scheduled_at'),
  startedAt:    timestamptz('started_at'),
  endedAt:      timestamptz('ended_at'),
  recordingUrl: text('recording_url'),
  createdAt:    timestamptz('created_at').defaultNow(),
});
```

---

## Database Indexes

```sql
-- Feed query performance
CREATE INDEX idx_posts_course_created ON posts(course_id, created_at DESC);
CREATE INDEX idx_posts_engagement ON posts(engagement_score DESC, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_visible ON posts(is_visible) WHERE is_visible = true;
CREATE INDEX idx_posts_type ON posts(post_type);
CREATE INDEX idx_posts_ai ON posts(ai_generated);
CREATE INDEX idx_posts_tags ON posts USING GIN(topic_tags);

-- Full-text search
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content->>'body', '') || ' ' || array_to_string(topic_tags, ' '))
  ) STORED;
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Trigram similarity for username/title search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_username_trgm ON users USING GIN(username gin_trgm_ops);
CREATE INDEX idx_posts_trgm ON posts USING GIN((content->>'body') gin_trgm_ops);

-- Interactions
CREATE INDEX idx_interactions_post ON interactions(post_id, type);
CREATE INDEX idx_interactions_user ON interactions(user_id, type, created_at DESC);

-- Mastery lookups
CREATE INDEX idx_mastery_user_course ON topic_mastery(user_id, course_id);
CREATE INDEX idx_mastery_fsrs_due ON topic_mastery(user_id, fsrs_due) WHERE fsrs_due IS NOT NULL;

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = false;

-- Schedule urgency queries
CREATE INDEX idx_schedule_user_upcoming ON course_schedule(user_id, scheduled_at)
  WHERE scheduled_at > now();
```
