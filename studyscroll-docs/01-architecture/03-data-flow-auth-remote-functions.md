# Data Flow, Remote Functions & Authentication

## Request Lifecycle

```
Browser/Tauri                SvelteKit Server              Database
     │                            │                            │
     │── GET /feed ───────────────▶                            │
     │                            │── +page.server.ts load()  │
     │                            │── getFeed() Remote Fn ────▶│
     │                            │                     ◀─────│
     │◀─ HTML (SSR) + data ───────│                            │
     │                            │                            │
     │  [TanStack Query hydrates] │                            │
     │                            │                            │
     │── scroll → fetchNextPage() │                            │
     │── RF call: getFeed(cursor) ▶                            │
     │                            │── DB query ───────────────▶│
     │                            │◀──────────────────────────│
     │◀─ JSON posts ──────────────│                            │
     │                            │                            │
     │── likePost(postId) ────────▶                            │
     │  [optimistic update first] │── DB insert ──────────────▶│
     │                            │◀──────────────────────────│
     │◀─ { ok: true } ────────────│                            │
```

---

## SvelteKit Remote Functions — Complete Pattern

Remote Functions are SvelteKit's built-in RPC layer. They replace REST endpoints for all data operations that aren't webhooks.

### Three Remote Function Types

```typescript
import { query, command, form } from '$app/server';

// QUERY — read-only, cacheable, runs on GET
// Use for: feed, post detail, user profile, leaderboard, search
export const getPost = query(async ({ postId }: { postId: string }) => {
  return db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { author: true },
  });
});

// COMMAND — mutation, not cached, runs on POST
// Use for: like, repost, quiz answer, create post, follow
export const createPost = command(async (input: CreatePostInput) => {
  const validated = createPostSchema.parse(input);
  const [post] = await db.insert(posts).values(validated).returning();
  return post;
});

// FORM — progressive enhancement, works without JS
// Use for: settings forms, onboarding, course setup
export const updateSettings = form(async (data: FormData) => {
  const theme = data.get('theme') as string;
  const aiEnabled = data.get('aiEnabled') === 'true';
  await db.update(users).set({ theme, aiEnabled }).where(eq(users.id, session.userId));
});
```

### Calling from Svelte Components

```svelte
<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { getPost } from '$lib/server/remote/posts';
  import { likePost } from '$lib/server/remote/interactions';

  let { postId } = $props();
  const qc = useQueryClient();

  // Query — with caching
  const postQuery = createQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost({ postId }),
    staleTime: 60_000,
  });

  // Mutation — with optimistic update
  const likeMutation = createMutation({
    mutationFn: likePost,
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ['post', postId] });
      const prev = qc.getQueryData(['post', postId]);
      qc.setQueryData(['post', postId], (old: any) => ({
        ...old,
        likeCount: old.likeCount + 1,
        liked: true,
      }));
      return { prev };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(['post', postId], ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
</script>
```

### Remote Functions File Organization

```
src/lib/server/remote/
├── feed.ts          → getFeed, getWatchFeed, getStudyFeed
├── posts.ts         → getPost, createPost, updatePost, deletePost
├── interactions.ts  → likePost, repostPost, bookmarkPost, reportPost
├── quiz.ts          → submitQuizAnswer, getQuizHistory
├── flashcards.ts    → submitFlashcardReview, getFlashcardDeck, getDueCards
├── users.ts         → getUser, updateProfile, getFollowers, getFollowing
├── courses.ts       → getCourses, addCourse, updateCourse, deleteCourse
├── schedule.ts      → getSchedule, addEvent, updateEvent, deleteEvent
├── search.ts        → searchPosts, searchUsers, searchCommunities
├── communities.ts   → getCommunity, joinCommunity, createCommunity
├── live.ts          → createStream, getStream, endStream, getRoomToken
├── ai.ts            → askTutor, generateMockExam, generateFlashcards
├── payments.ts      → createCheckout, getSubscription, cancelSubscription
├── notifications.ts → getNotifications, markRead, markAllRead
├── study.ts         → getStudySession, completeStudySession, getMastery
├── analytics.ts     → getMasteryHistory, getActivityHeatmap, getStats
└── uploads.ts       → getPresignedUploadUrl, confirmUpload, deleteMedia
```

---

## Authentication — better-auth

### Setup

```typescript
// packages/auth/src/index.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@studyscroll/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    // better-auth manages its own sessions/accounts tables
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: 'Reset your StudyScroll password',
        html: resetPasswordTemplate({ name: user.name, url }),
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: 'Verify your StudyScroll email',
        html: verifyEmailTemplate({ name: user.name, url }),
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,     // 30 days
    updateAge: 60 * 60 * 24,           // refresh if older than 1 day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  user: {
    additionalFields: {
      username:     { type: 'string', required: true },
      plan:         { type: 'string', defaultValue: 'free' },
      aiEnabled:    { type: 'boolean', defaultValue: true },
      streakDays:   { type: 'number', defaultValue: 0 },
      xp:           { type: 'number', defaultValue: 0 },
    },
  },

  plugins: [],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

### SvelteKit Hook

```typescript
// apps/web/src/hooks.server.ts
import { auth } from '@studyscroll/auth';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  return resolve(event);
};

const securityHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
};

export const handle = sequence(authHandle, securityHandle);
```

### Route Protection

```typescript
// apps/web/src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  if (!locals.user) redirect(302, '/login');

  // Redirect to onboarding if no courses set up
  const hasCourses = await db.query.userCourses.findFirst({
    where: and(eq(userCourses.userId, locals.user.id), eq(userCourses.active, true)),
  });

  if (!hasCourses && !event.url.pathname.startsWith('/onboarding')) {
    redirect(302, '/onboarding');
  }

  return { user: locals.user };
}
```

### Auth Route Handler

```typescript
// apps/web/src/routes/api/auth/[...all]/+server.ts
import { auth } from '@studyscroll/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = (event) => auth.handler(event.request);
export const POST: RequestHandler = (event) => auth.handler(event.request);
```

### Client Auth

```typescript
// src/lib/stores/auth.svelte.ts
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_APP_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

---

## Session & Platform Context

```typescript
// src/app.d.ts — SvelteKit type declarations
import type { Session, User } from '@studyscroll/auth';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface PageData {
      user?: User | null;
    }
  }
}
```

---

## Onboarding Flow

```
/onboarding
    │
    ├── Step 1: Welcome + name/username
    │
    ├── Step 2: Add courses
    │   ├── Search course catalog (by institution)
    │   └── Manual add: code + title + semester
    │
    ├── Step 3: Schedule import
    │   ├── Add exam/assignment dates manually
    │   └── (Optional) Import from .ics calendar file
    │
    ├── Step 4: Upload notes (optional)
    │   └── PDF/image → queues OCR job → generates initial content
    │
    └── Step 5: Theme + preferences
        ├── Dark/Light/OLED
        ├── AI content on/off
        └── Notification preferences
            → /feed
```

```typescript
// src/lib/server/remote/onboarding.ts
export const completeOnboarding = command(async ({
  userId, courses, events, preferences,
}) => {
  // 1. Insert courses
  if (courses.length > 0) {
    await db.insert(userCourses).values(
      courses.map(c => ({ ...c, userId, active: true }))
    );
  }

  // 2. Insert schedule events
  if (events.length > 0) {
    await db.insert(courseSchedule).values(
      events.map(e => ({ ...e, userId }))
    );
  }

  // 3. Apply preferences
  await db.update(users).set({
    theme: preferences.theme,
    aiEnabled: preferences.aiEnabled,
  }).where(eq(users.id, userId));

  // 4. Queue initial content generation
  await pgBoss.send('generate-content', { userId }, { startAfter: 5 });

  // 5. Award first-login XP
  await db.insert(xpEvents).values({
    userId, eventType: 'daily_login', xpAwarded: 5,
  });

  return { success: true };
});
```
