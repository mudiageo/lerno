# Database Schema Overview — ERD & Table Relationships

## Entity Relationship Diagram (Text)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           CORE ENTITIES                                    │
└────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐       ┌──────────────────┐       ┌──────────────────────┐
 │   USERS      │──────▶│  USER_COURSES     │──────▶│  COURSE_SCHEDULE     │
 │              │  1:N  │                  │  1:N  │  (exams, deadlines)  │
 │ id (PK)      │       │ id (PK)           │       │                      │
 │ username     │       │ userId (FK)       │       │ courseId (FK)        │
 │ email        │       │ code              │       │ eventType            │
 │ plan         │       │ title             │       │ scheduledAt          │
 │ xp           │       │ active            │       │ reminderSent         │
 │ streakDays   │       └──────────────────┘       └──────────────────────┘
 │ institutionId│               │ 1:N
 └──────┬───────┘               │
        │ 1:N                   ▼
        │               ┌──────────────────┐
        │               │ COURSE_MATERIALS  │
        │               │ (PDFs, notes)     │
        │               │                  │
        │               │ ocrText          │
        │               │ processed        │
        │               └──────────────────┘
        │
        │ 1:N (authorId)                         1:N (courseId)
        ▼                                              ▼
 ┌──────────────┐  ──────────────────────────▶ ┌─────────────────┐
 │   POSTS      │                              │  POSTS          │
 │              │  (same table, FK to itself)  │  (courseId)     │
 │ id (PK)      │◀── parentId (thread/reply)   │                 │
 │ authorId(FK) │◀── repostOfId                │ postType        │
 │ courseId(FK) │◀── quoteOfId                 │ content (JSONB) │
 │ postType     │                              │ topicTags[]     │
 │ content JSONB│                              │ aiGenerated     │
 │ topicTags[]  │                              │ likeCount       │
 │ aiGenerated  │                              │ engagementScore │
 │ likeCount    │                              └─────────────────┘
 │ searchVector │
 └──────┬───────┘
        │ 1:N
        ▼
 ┌──────────────────┐
 │  INTERACTIONS    │
 │                  │
 │ userId (FK)      │
 │ postId (FK)      │──── type: like|view|repost|
 │ targetUserId(FK) │         bookmark|quiz_answer|
 │ type             │         flashcard_flip|poll_vote|
 │ payload (JSONB)  │         follow|block|report
 └──────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                         SOCIAL GRAPH                                       │
└────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐  N:M via FOLLOWS  ┌──────────────┐
 │   USERS      │◀─────────────────▶│   USERS      │
 │  (follower)  │                   │  (following) │
 └──────────────┘                   └──────────────┘

 ┌──────────────┐  N:M via COMMUNITY_MEMBERS  ┌──────────────────┐
 │   USERS      │◀──────────────────────────▶│  COMMUNITIES     │
 │              │  role: member|mod|admin     │                  │
 └──────────────┘                            │ slug (unique)    │
                                             │ courseCode (opt) │
                                             └──────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                           LEARNING LOOP                                    │
└────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐      ┌──────────────────┐      ┌──────────────────┐
 │   USERS      │──────▶  TOPIC_MASTERY   │      │  XP_EVENTS       │
 │              │  1:N  │                  │      │                  │
 │              │       │ (userId,         │      │ userId (FK)      │
 │              │       │  courseId,       │      │ eventType        │
 │              │       │  topic) PK       │      │ xpAwarded        │
 │              │       │ score 0-100      │      │ metadata (JSONB) │
 │              │       │ fsrsDue          │      └──────────────────┘
 │              │       │ fsrsStability    │
 │              │       │ fsrsDifficulty   │      ┌──────────────────┐
 │              │       └──────────────────┘      │  ACHIEVEMENTS    │
 │              │──────────────────────────────▶  │                  │
 │              │  1:N                            │ userId (FK)      │
 └──────────────┘                                 │ badge (unique)   │
                                                  └──────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENTS                                          │
└────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐  1:N  ┌──────────────────┐  1:1  ┌──────────────────┐
 │   USERS      │──────▶│  SUBSCRIPTIONS   │──────▶│  INSTITUTIONS    │
 │              │       │                  │       │                  │
 │ plan         │       │ provider         │       │ seatLimit        │
 │ institutionId│       │ providerSubId    │       │ seatsUsed        │
 └──────────────┘       │ status           │       └──────────────────┘
                        │ billingPeriod    │
                        └──────────────────┘

 ┌──────────────┐  N:M via INSTITUTION_MEMBERS  ┌──────────────────┐
 │   USERS      │◀────────────────────────────▶│  INSTITUTIONS    │
 │              │  role: student|lecturer|admin │                  │
 └──────────────┘                              └──────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                          LIVE & NOTIFICATIONS                              │
└────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐  1:N  ┌──────────────────┐
 │   USERS      │──────▶│  STREAMS         │
 │  (hostId)    │       │                  │
 │              │       │ roomId           │
 │              │       │ status           │
 │              │       │ provider         │
 │              │       │ isAudioOnly      │
 └──────────────┘       └──────────────────┘

 ┌──────────────┐  1:N  ┌──────────────────┐
 │   USERS      │──────▶│  NOTIFICATIONS   │
 │              │       │                  │
 │              │       │ type             │
 │              │       │ actorId (FK)     │
 │              │       │ targetId         │
 │              │       │ read             │
 └──────────────┘       └──────────────────┘

 ┌──────────────┐  1:N  ┌──────────────────┐
 │   USERS      │──────▶│ PUSH_SUBSCRIPTIONS│
 │              │       │                  │
 │              │       │ endpoint         │
 │              │       │ p256dh           │
 │              │       │ auth             │
 └──────────────┘       └──────────────────┘
```

---

## Table Inventory

| Table | Rows (est. @ 10k users) | Key FKs | Notes |
|---|---|---|---|
| `users` | 10,000 | institutionId | Core entity |
| `user_courses` | 40,000 | userId | avg 4 courses/user |
| `course_schedule` | 80,000 | userId, courseId | avg 2 events/course |
| `course_materials` | 30,000 | userId, courseId | PDFs, notes |
| `posts` | 500,000+ | authorId, courseId | ~50/user/day AI gen |
| `interactions` | 2,000,000+ | userId, postId | likes, views, quizzes |
| `follows` | 100,000 | followerId, followingId | composite PK |
| `topic_mastery` | 200,000 | userId, courseId | composite PK per topic |
| `xp_events` | 300,000 | userId | append-only log |
| `achievements` | 50,000 | userId | one row per badge earned |
| `subscriptions` | 5,000 | userId | active subs |
| `payment_events` | 20,000 | userId | webhook log |
| `institutions` | 100 | subscriptionId | |
| `institution_members` | 15,000 | institutionId, userId | |
| `institution_courses` | 1,000 | institutionId, lecturerId | |
| `institution_invites` | 5,000 | institutionId | expire after 7d |
| `communities` | 500 | createdBy | |
| `community_members` | 30,000 | communityId, userId | composite PK |
| `notifications` | 500,000 | userId, actorId | prune >90d |
| `push_subscriptions` | 8,000 | userId | |
| `streams` | 2,000 | hostId, courseId | |
| `youtube_cache` | 10,000 | cacheKey | expire >24h |
| `dmca_requests` | rare | postId | legal log |

---

## Relationship Summary

| Relationship | Type | Via |
|---|---|---|
| user → courses | 1:N | `user_courses.userId` |
| user → posts | 1:N | `posts.authorId` |
| course → posts | 1:N | `posts.courseId` |
| post → replies | 1:N | `posts.parentId` → `posts.id` |
| post → repost | 1:1 | `posts.repostOfId` → `posts.id` |
| post → quote | 1:1 | `posts.quoteOfId` → `posts.id` |
| user ↔ user (follows) | N:M | `follows` table |
| user ↔ community | N:M | `community_members` table |
| user ↔ institution | N:M | `institution_members` table |
| user → mastery (per course+topic) | 1:N | `topic_mastery` composite PK |
| user → subscription | 1:N | `subscriptions.userId` |
| institution → subscription | 1:1 | `institutions.subscriptionId` |
| user → notifications | 1:N | `notifications.userId` |
| user → streams | 1:N | `streams.hostId` |

---

## JSONB Content Column Strategy

The `posts.content` column is `jsonb`. Each `post_type` has its own contract (see `05-features/04-post-types.md`). The shape is validated on write by Valibot, and on read the TypeScript type is narrowed by `postType`.

**Why JSONB over separate tables?**
- Avoids a JOIN per post type (massive at scale)
- Flexible schema evolution without migrations for minor content changes
- PostgreSQL JSONB supports GIN indexing on keys if needed
- Full-text search extracts text from JSONB in the generated `search_vector` column

**Tradeoff:** No FK integrity on content fields (e.g., `youtubeId`). Enforced at application layer.

---

## Cascade & Soft Delete Strategy

| Table | Delete strategy | Reason |
|---|---|---|
| `users` | Soft delete (flag `deleted_at`) + 30-day wipe job | GDPR right to erasure with grace period |
| `posts` | `is_visible = false` first; hard delete after 30 days if DMCA | Preserve engagement counts |
| `interactions` | `ON DELETE CASCADE` from user | No orphaned likes |
| `notifications` | Cron prune after 90 days | Storage control |
| `institution_members` | Set `active = false`, downgrade user plan | Audit trail |
| `push_subscriptions` | Hard delete on 410 response from push service | Stale endpoint removal |
| `youtube_cache` | Hard delete after 24h (search) / 7d (metadata) via cron | API quota compliance |
