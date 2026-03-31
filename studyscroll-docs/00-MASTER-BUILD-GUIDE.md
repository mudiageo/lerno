# Lerno — Master Build Guide
## Step-by-Step, Phase-by-Phase Construction Manual

> **How to use this guide:** This document is your single source of truth for WHAT to build, in WHAT ORDER, and WHICH documentation file to consult at each step. Follow phases in order. Do not skip phases — each one builds on the last.

---

## Before You Start — Read These First

| Document | Why |
|---|---|
| `00-overview/01-vision.md` | Understand the product you're building |
| `00-overview/02-feature-map-and-personas.md` | Know all features + who you're building for |
| `16-monorepo-apps/01-all-apps-and-services.md` | Understand the 7-app architecture before writing a line |

**Time investment:** 2 hours reading. Saves you weeks of rework.

---

## Phase 0 — Environment & Toolchain Setup
**Duration:** 1 day  
**Goal:** Machine ready, all tools installed, nothing to build yet

### Steps

**0.1 Install prerequisites**
→ See `01-architecture/05-setup-guide.md` → Section "Prerequisites"
```
Node.js 22+, pnpm 10+, vite-plus (npm i -g vite-plus), Rust + Tauri CLI
```

**0.2 Create GitHub repository**
```bash
mkdir lerno && cd lerno
git init
gh repo create lerno --private
```

**0.3 Set up project secrets in GitHub**
→ See `11-infra/02-cdn-scaling-monitoring-env.md` → "Complete Environment Variables Reference"

Add these as GitHub Secrets for CI:
- `DATABASE_URL`, `BETTER_AUTH_SECRET`
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`
- `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `R2_*` keys, `VAPID_*` keys
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**0.4 Provision cloud services (accounts only, no billing yet)**

| Service | Action |
|---|---|
| Vercel | Create account + 3 projects: `web`, `admin`, `landing` |
| Render | Create account + PostgreSQL (Standard plan) |
| Cloudflare | Create account + R2 bucket + Stream enabled |
| Resend | Create account + verify sending domain |
| Google Cloud | Create project + enable YouTube Data API v3 + Gemini API |
| Anthropic | Create account + get API key |
| Paystack | Create account (test mode) |
| Stripe | Create account (test mode) |
| Sentry | Create project |
| PostHog | Create project |

**0.5 Local environment**
```bash
cp .env.example .env.local   # create from template in 11-infra/02-cdn-scaling-monitoring-env.md
# Fill in all values
```

---

## Phase 1 — Monorepo Scaffold
**Duration:** 1 day  
**Goal:** Empty but correctly structured monorepo, all packages wired together

### Steps

**1.1 Create monorepo structure**
→ See `01-architecture/02-monorepo-structure.md` → "Directory Tree" and "pnpm-workspace.yaml"

```bash
# Create all directories
mkdir -p apps/{web,admin,institution,landing,docs,desktop}
mkdir -p packages/{db,ai,storage,email,payments,jobs,auth,ui}

# Root config files
# Create: pnpm-workspace.yaml, vite.config.ts, .gitignore, package.json
# (copy from 01-architecture/02-monorepo-structure.md)
```

**1.2 Create root Vite+ config**
→ See `01-architecture/02-monorepo-structure.md` → "Root Vite+ config"
→ See `16-monorepo-apps/01-all-apps-and-services.md` → "Monorepo Workspace Config (Updated)"

Copy the full `vite.config.ts` with all tasks including admin, institution, landing.

**1.3 Scaffold SvelteKit apps**
→ See `01-architecture/05-setup-guide.md` → Steps 3, 4

```bash
# Main student app
cd apps/web && pnpm create svelte@latest .

# Admin app (same scaffold, different config later)
cd apps/admin && pnpm create svelte@latest .

# Institution app
cd apps/institution && pnpm create svelte@latest .

# Landing (static)
cd apps/landing && pnpm create svelte@latest .
```

**1.4 Initialize all packages**
→ See `01-architecture/02-monorepo-structure.md` → each package's `package.json`

For each package in `packages/`: create `package.json` with correct name and entry point.

**1.5 Install all dependencies**
```bash
# From monorepo root
vp install
```

**1.6 Verify**
```bash
vp run dev    # should start apps/web on :5173
vp check      # should pass with no errors
```

✅ **Phase 1 complete when:** `vp run dev` starts successfully, `vp check` passes.

---

## Phase 2 — Database Foundation
**Duration:** 1–2 days  
**Goal:** Complete PostgreSQL schema, all tables created, migrations working

### Steps

**2.1 Write Drizzle schema**
→ See `02-database/02-schema-drizzle.md` — copy every schema file verbatim:

Write in this order (dependencies first):
1. `packages/db/src/schema/users.ts`
2. `packages/db/src/schema/courses.ts`
3. `packages/db/src/schema/posts.ts`
4. `packages/db/src/schema/interactions.ts`
5. `packages/db/src/schema/mastery.ts`
6. `packages/db/src/schema/payments.ts`
7. `packages/db/src/schema/communities.ts`
8. `packages/db/src/schema/notifications.ts`
9. `packages/db/src/schema/live.ts`
10. `packages/db/src/schema/youtube-cache.ts`
11. `packages/db/src/schema/dmca.ts`
12. `packages/db/src/schema/staff.ts` (from `15-saas-admin/01-roles-permissions-rbac.md`)
13. `packages/db/src/schema/support.ts` (from `15-saas-admin/04-customer-support.md`)
14. `packages/db/src/schema/api-keys.ts` (from `16-monorepo-apps/03-api-gateway-integrations.md`)
15. `packages/db/src/schema/index.ts` (re-exports all)

**2.2 Configure Drizzle**
→ See `02-database/01-migrations-indexes-performance.md` → "drizzle.config.ts"

**2.3 Generate and run first migration**
```bash
vp run db:generate    # generates SQL migration file
vp run db:migrate     # applies to PostgreSQL
```

**2.4 Apply all indexes**
→ See `02-database/01-migrations-indexes-performance.md` → "Complete Index Strategy"

Run all `CREATE INDEX` statements against your database.

**2.5 Set up materialized view for feed scoring**
→ See `02-database/01-migrations-indexes-performance.md` → "Materialized view for pre-scored posts"

**2.6 Verify**
```bash
vp run db:studio      # open Drizzle Studio at :4983
# Verify all tables exist with correct columns
```

✅ **Phase 2 complete when:** All 15+ tables exist in PostgreSQL, Drizzle Studio shows them correctly.

---

## Phase 3 — Shared Packages
**Duration:** 2–3 days  
**Goal:** All 8 shared packages implemented and tested

### Steps

**3.1 `packages/db` — Database client**
→ See `02-database/01-migrations-indexes-performance.md` → "drizzle client setup"
→ See `11-infra/02-cdn-scaling-monitoring-env.md` → "Connection Pooling"

**3.2 `packages/auth` — Authentication**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "better-auth setup"
→ See `15-saas-admin/01-roles-permissions-rbac.md` → "RBAC Implementation"

Include: email/password, Google OAuth, session config, role-based guards, RBAC helpers.

**3.3 `packages/ai` — AI Provider**
→ See `01-architecture/01-tech-stack.md` → "AI Provider Abstraction"

Implement:
- `provider.ts` — interface
- `gemini.ts` — GeminiProvider
- `claude.ts` — ClaudeProvider
- `index.ts` — factory with proxy fallback
- `prompts/content.ts` — all content generation prompts (from `14-prompts/02-all-prompts.md`)
- `prompts/tutor.ts` — AI tutor prompts
- `prompts/moderation.ts` — moderation prompt
- `rate-limiter.ts` (from `06-ai/01-generation-tutor-ocr-ratelimiting.md`)

**3.4 `packages/storage` — File Storage**
→ See `01-architecture/01-tech-stack.md` → "Storage Abstraction"

Implement R2Provider with: upload, download, delete, getSignedUrl, getPublicUrl.

**3.5 `packages/email` — Email**
→ See `11-infra/01-deployment.md` → "Email — Resend + Nodemailer"

Implement: ResendProvider, NodemailerProvider, auto-select factory, all email templates.

**3.6 `packages/payments` — Payments**
→ See `07-payments/01-subscription-model.md` — copy PaystackProvider, StripeProvider, factory.

**3.7 `packages/jobs` — Background Workers**
→ See `03-api/01-storage-email-jobs-search-notifications-moderation.md` → "All Job Handlers"
→ See `11-infra/01-deployment.md` → "Background Jobs"

Implement all job handlers + cron schedules.

**3.8 `packages/ui` — Shared Components**
→ See `16-monorepo-apps/01-all-apps-and-services.md` → "`packages/ui`"

Start minimal: StatCard, DataTable, LoadingSpinner, EmptyState.

**3.9 Test all packages**
```bash
vp test       # run package unit tests
```

✅ **Phase 3 complete when:** All packages compile, unit tests pass, no TypeScript errors.

---

## Phase 4 — Authentication & Onboarding
**Duration:** 2 days  
**Goal:** Users can register, log in, set up courses, complete onboarding

### Steps

**4.1 better-auth routes**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "Auth Route Handler"

Create `apps/web/src/routes/api/auth/[...all]/+server.ts`.

**4.2 SvelteKit hooks**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "SvelteKit Hook"

Create `apps/web/src/hooks.server.ts`.

**4.3 Auth pages**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "Client Auth"

Build:
- `/login` — email/password + Google OAuth button
- `/register` — sign up form
- `/forgot-password` — password reset request

**4.4 Onboarding flow**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "Onboarding Flow"

Build 5-step onboarding: name → courses → schedule → notes upload (optional) → preferences.

**4.5 Route protection**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "Route Protection"

Protect all `(app)` routes, redirect to `/login` if unauthenticated.

**4.6 Verify**
- Register a new account
- Complete onboarding (add 2 courses, 1 exam date)
- Log out and log back in
- Verify session persists

✅ **Phase 4 complete when:** Full auth flow works end-to-end.

---

## Phase 5 — Core Feed (Scroll Mode)
**Duration:** 3–4 days  
**Goal:** The main feed works — users can scroll posts, like, reply, create posts

### Steps

**5.1 Tailwind v4 + design system**
→ See `01-architecture/05-setup-guide.md` → Step 4  
→ See `13-design/01-design-system.md` → "Color System", "Typography"

Copy the full `app.css` with all `@theme` tokens, dark/OLED variants.

**5.2 App shell layout**
→ See `05-features/01-all-features.md` → "App Layout (Authenticated Shell)"
→ See `13-design/02-components-watchmode-mobile.md` → "Sidebar", "BottomNav"

Build: Sidebar (desktop), BottomNav (mobile), Header, ThemeToggle.

**5.3 Feed remote functions**
→ See `03-api/03-feed-algorithm.md` → "Remote Function Implementation"

Implement `getFeed()` query with full scoring algorithm. Start simple — can optimize later.

**5.4 Feed route + infinite scroll**
→ See `04-frontend/01-setup-theming-animations-a11y-offline.md` → root layout setup  
→ See `13-design/01-design-system.md` → "Infinite Scroll Implementation"

Build `apps/web/src/routes/(app)/feed/+page.svelte` with TanStack Query infinite scroll.

**5.5 PostCard component**
→ See `13-design/01-design-system.md` → "PostCard" component  
→ See `05-features/04-post-types.md` — understand all content schemas

Build PostCard that renders `text`, `image`, `link` types first. Add others in Phase 6.

**5.6 Post interactions**
→ See `05-features/01-all-features.md` → social features

Implement like, repost, bookmark Remote Functions with optimistic UI.

**5.7 Post composer**
→ See `05-features/01-all-features.md` → "Post Composer"

Build composer for `text` type first. Add tabs for quiz/flashcard/poll in Phase 6.

**5.8 Content moderation**
→ See `03-api/01-storage-email-jobs-search-notifications-moderation.md` → "Content Moderation Pipeline"

Wire moderation into `createPost` — AI check before visibility.

**5.9 Verify**
- Feed loads and scrolls infinitely
- Can create a text post
- Like/unlike works with optimistic update
- Dark mode toggle works

✅ **Phase 5 complete when:** Basic feed scrolls, posts created and visible.

---

## Phase 6 — Study Content Types
**Duration:** 3–4 days  
**Goal:** Quiz posts, flashcard posts, polls work — mastery tracking active

### Steps

**6.1 Quiz post type**
→ See `13-design/02-components-watchmode-mobile.md` → "Quiz Post Component (In Feed)"  
→ See `05-features/04-post-types.md` → "`quiz`" type

Build QuizPost with: 4 options, correct reveal, explanation, XP float animation.

**6.2 Quiz answer submission**
→ See `03-api/03-feed-algorithm.md` → "submitQuizAnswer"

Wire up mastery update, XP award, consecutive failure detection.

**6.3 Flashcard post type**
→ See `13-design/01-design-system.md` → "Flashcard 3D Flip Component"

Build 3D flip card with Got it / Didn't know buttons, FSRS update.

**6.4 FSRS algorithm**
→ See `05-features/01-all-features.md` → "FSRS Spaced Repetition"

Implement the FSRS scheduler in `src/lib/utils/fsrs.ts`.

**6.5 Poll post type**
→ See `05-features/04-post-types.md` → "`poll`" type

Build poll with vote buttons and animated results reveal.

**6.6 Surprise questions**
→ See `03-api/03-feed-algorithm.md` → "Surprise Question Injection"

Implement Fibonacci position injection in the feed.

**6.7 Post composer tabs**
→ See `05-features/01-all-features.md` → "Post Composer"

Add quiz/flashcard/poll creation tabs to PostComposer.

**6.8 Content validation**
→ See `05-features/04-post-types.md` → "Valibot Content Schemas"

Add Valibot validation to all post creation paths.

✅ **Phase 6 complete when:** All 3 interactive post types work, mastery updates on quiz answers.

---

## Phase 7 — AI Content Generation
**Duration:** 2–3 days  
**Goal:** AI posts automatically populate the feed, AI tutor works

### Steps

**7.1 AI generation pipeline**
→ See `06-ai/01-generation-tutor-ocr-ratelimiting.md` → "Nightly Batch Job"

Implement `packages/jobs/src/jobs/generate-content.ts`.

**7.2 All prompt builders**
→ See `14-prompts/01-system-prompts.md` and `14-prompts/02-all-prompts.md`

Implement all prompt builder functions in `packages/ai/src/prompts/content.ts`.

**7.3 Trigger generation on onboarding**
→ See `01-architecture/03-data-flow-auth-remote-functions.md` → "completeOnboarding"

Queue first content generation job when onboarding completes.

**7.4 AI tutor chatbot**
→ See `06-ai/01-generation-tutor-ocr-ratelimiting.md` → "AI Tutor Chatbot"

Build AiTutor.svelte component, `askTutor` Remote Function.

**7.5 Rate limiting**
→ See `06-ai/01-generation-tutor-ocr-ratelimiting.md` → "Rate Limiting & Cost Controls"

Implement quota checks for free vs premium users.

**7.6 Test end-to-end**
```bash
# Start jobs worker
vp run jobs:dev
# Trigger for a test user
```

✅ **Phase 7 complete when:** Feed auto-populates with AI content within minutes of onboarding.

---

## Phase 8 — Study Mode
**Duration:** 3 days  
**Goal:** Dedicated study mode: flashcard sessions, quizzes, mock exams, pomodoro

### Steps

**8.1 Study mode routes**
→ See `01-architecture/02-monorepo-structure.md` → `/study` route tree

Create: `/study`, `/study/flashcards`, `/study/quiz`, `/study/mock-exam`, `/study/pomodoro`.

**8.2 Flashcard deck session**
→ See `05-features/01-all-features.md` → "FSRS Spaced Repetition"

Build FlashcardDeck.svelte with due-card queue, progress, completion screen.

**8.3 Quiz session**
→ See `05-features/01-all-features.md` → "Study Mode"

Build timed quiz session: 10 questions, score summary, mastery update.

**8.4 Pomodoro timer**
→ See `05-features/01-all-features.md` → "Pomodoro Timer"

Build PomodoroTimer.svelte with work/break toggle, session counter, chime sound.

**8.5 Mock exam generator**
→ See `05-features/01-all-features.md` → "Mock Exam Generator"  
→ See `14-prompts/02-all-prompts.md` → "Mock Exam Paper" prompt

Build mock exam UI: full paper, timer, section navigation, MCQ auto-marking.

**8.6 Mastery analytics dashboard**
→ See `05-features/01-all-features.md` → "Student Analytics Dashboard"

Build per-course topic mastery heatmap + activity stats.

✅ **Phase 8 complete when:** All study modes work, FSRS correctly schedules cards.

---

## Phase 9 — Watch Mode & Video
**Duration:** 2–3 days  
**Goal:** Watch mode grid, YouTube embeds, own video upload, Shorts player

### Steps

**9.1 Watch mode route + grid**
→ See `05-features/01-all-features.md` → "Watch Mode"  
→ See `13-design/02-components-watchmode-mobile.md` → "Watch Mode UI Layout"

Build video grid with `VideoCard` components.

**9.2 YouTube search + caching**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "YouTube Integration"

Implement `searchYouTubeCurriculum` with 24h PostgreSQL cache.

**9.3 YouTube embed component**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "YouTubeEmbed.svelte"

Lazy-load iframe with thumbnail placeholder, nocookie domain.

**9.4 Own video upload (Cloudflare Stream)**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "Cloudflare Stream"

Build VideoUploader with TUS resumable upload, encoding status polling.

**9.5 HLS video player**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "VideoPlayer.svelte (hls.js)"

Build custom player with hls.js for adaptive bitrate playback.

**9.6 Shorts player**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "Shorts Player"

Build vertical swipe player. Touch + keyboard navigation.

**9.7 Offline downloads (Premium)**
→ See `08-video/01-strategy-youtube-stream-shorts-offline.md` → "Offline Video"

Implement signed download tokens. Gate behind premium check.

✅ **Phase 9 complete when:** YouTube embeds work, own videos upload and play, Shorts swipeable.

---

## Phase 10 — Gamification
**Duration:** 1–2 days  
**Goal:** XP, streaks, leaderboards, badges all live

### Steps

**10.1 XP system**
→ See `05-features/07-gamification.md` → "XP System"

Implement XP awards in every relevant action: quiz, flashcard, login, post creation.

**10.2 Streak tracking**
→ See `05-features/07-gamification.md` → "Streak System"

Implement `recordDailyLogin`, streak increment, milestone bonuses.

**10.3 Leaderboard**
→ See `05-features/07-gamification.md` → "Leaderboard"  

Build `/leaderboard` with scope tabs: Global / Course / Friends.

**10.4 Achievement badges**
→ See `05-features/07-gamification.md` → "Achievement Badges"

Implement badge checks in relevant events. Build `AchievementToast` popup.

**10.5 XP UI elements**
→ See `13-design/02-components-watchmode-mobile.md` → "XP Level Progress Bar"  
→ See `05-features/07-gamification.md` → "XP Float Animation"

Add XP progress bar to profile. XP float animation on quiz correct.

✅ **Phase 10 complete when:** XP accumulates, streak shows in header, leaderboard renders.

---

## Phase 11 — Communities & Social
**Duration:** 2 days  
**Goal:** Communities, follow system, notifications

### Steps

**11.1 Communities**
→ See `05-features/01-all-features.md` → "Communities"

Build: community list, community feed, join/leave, create community.

**11.2 Follow system**
→ See `05-features/01-all-features.md` → "Follow System"

Implement `toggleFollow`, profile follow/unfollow button, followers list.

**11.3 Notifications**
→ See `03-api/01-storage-email-jobs-search-notifications-moderation.md` → "Notifications (SSE + Web Push)"

Build: SSE stream, notification bell with unread count, notification list page.

**11.4 Push notifications**
→ See `05-features/01-all-features.md` → "Push Notification Service Worker Registration"

Register service worker, VAPID keys, subscription storage, exam reminder delivery.

**11.5 Search**
→ See `03-api/01-storage-email-jobs-search-notifications-moderation.md` → "Search"  
→ See `13-design/02-components-watchmode-mobile.md` → "Command Palette"

Build `/search` page + Command Palette (Cmd+K).

✅ **Phase 11 complete when:** Communities browsable, follow works, notifications appear.

---

## Phase 12 — Payments & Premium
**Duration:** 2–3 days  
**Goal:** Paystack + Stripe subscriptions work, premium gates enforced

### Steps

**12.1 Payment providers**
→ See `07-payments/01-subscription-model.md` — copy all payment code

Implement PaystackProvider, StripeProvider, factory, webhook handlers.

**12.2 Webhook routes**
→ See `07-payments/01-subscription-model.md` → "Webhook Handlers"

Create `/api/webhooks/paystack/+server.ts` and `/api/webhooks/stripe/+server.ts`.

**12.3 Billing settings page**
→ See `00-overview/02-feature-map-and-personas.md` → billing features

Build `/settings/billing`: show plan, upgrade button, cancel subscription, payment history.

**12.4 Premium gates**
→ See `05-features/01-all-features.md` → feature flags per plan

Add `isPremium` checks to: mock exam generator, offline downloads, unlimited AI tutor, AI content limits.

**12.5 Stripe/Paystack test flow**
- Create test subscription in Paystack sandbox
- Verify webhook fires, user plan upgrades
- Test cancellation flow

**12.6 Institutional licensing**
→ See `07-payments/04-institutional-licensing.md`

Implement `joinInstitution` via invite code, seat allocation, institutional plan upgrade.

✅ **Phase 12 complete when:** Full payment flow works end-to-end in test mode, premium features gated correctly.

---

## Phase 13 — Email & Notifications
**Duration:** 1 day  
**Goal:** All transactional emails send, exam reminders fire

### Steps

**13.1 Email templates**
→ See `11-infra/01-deployment.md` → "Email — Resend + Nodemailer"

Implement all templates: verify-email, reset-password, exam-reminder, welcome, subscription-receipt, CSAT survey, staff invite, institution welcome.

**13.2 Exam reminder job**
→ See `03-api/01-storage-email-jobs-search-notifications-moderation.md` → "exam-reminders.ts"

Wire up the 1/3/7-day reminder job.

**13.3 Streak at-risk notifications**
→ See `17-operations/01-operations-runbooks.md` → "Churn Prevention"

Implement 8pm daily push for streak-at-risk users.

✅ **Phase 13 complete when:** Test user receives exam reminder email and push notification.

---

## Phase 14 — Live Streaming
**Duration:** 3–4 days  
**Goal:** WebRTC streams work, LiveKit fallback configured, Spaces (audio) work

### Steps

**14.1 mediasoup SFU**
→ See `09-live/01-webrtc-livekit-spaces.md` → "Custom WebRTC SFU"

Implement SFU in `packages/jobs/src/live/sfu.ts`. Start on Render worker.

**14.2 SFU API routes**
→ See `09-live/01-webrtc-livekit-spaces.md` → "SFU API Route"

Create `/api/live/[action]/+server.ts`.

**14.3 Stream host UI**
→ See `09-live/01-webrtc-livekit-spaces.md` → "Stream Host UI"

Build StreamHost.svelte with camera preview, go-live button, viewer count.

**14.4 Stream viewer UI**
→ See `09-live/01-webrtc-livekit-spaces.md`

Build StreamViewer.svelte with consume flow, live chat.

**14.5 LiveKit fallback**
→ See `09-live/01-webrtc-livekit-spaces.md` → "LiveKit Fallback"

Configure LiveKit token generation, env-var provider switch.

**14.6 Spaces (audio rooms)**
→ See `09-live/01-webrtc-livekit-spaces.md` → "Spaces (Audio-Only Rooms)"

Build SpaceRoom.svelte — audio-only, raise hand, participant grid.

✅ **Phase 14 complete when:** Two-person WebRTC stream works. Switch `LIVE_PROVIDER=livekit` and verify fallback.

---

## Phase 15 — Native Apps (Tauri)
**Duration:** 2–3 days  
**Goal:** Desktop app builds and runs, Android APK builds

### Steps

**15.1 Tauri v2 setup**
→ See `10-native/01-tauri-desktop-android.md` → "Tauri v2 Configuration"

Create `apps/desktop/src-tauri/` with tauri.conf.json, capabilities, main.rs.

**15.2 Platform detection**
→ See `10-native/01-tauri-desktop-android.md` → "Platform-Aware Component Patterns"

Implement `src/lib/utils/platform.ts` — isTauri, isAndroid, isDesktop, isWeb.

**15.3 Native share + file access**
→ See `10-native/01-tauri-desktop-android.md` → "Rust Main"

Add share and get_download_dir Tauri commands.

**15.4 Native push notifications**
→ See `10-native/01-tauri-desktop-android.md` → "Native Push Notifications"

`@tauri-apps/plugin-notification` for desktop/Android.

**15.5 Desktop build**
```bash
vp run build:web
vp run build:desktop
```

**15.6 Android setup + build**
→ See `10-native/01-tauri-desktop-android.md` → "Android Setup"

```bash
tauri android init
vp run build:android
```

✅ **Phase 15 complete when:** Desktop .dmg/.exe installs and runs. Android .apk installs on device.

---

## Phase 16 — Admin & Staff Dashboard
**Duration:** 4–5 days  
**Goal:** `apps/admin` fully functional for all staff roles

### Steps

**16.1 Admin app auth**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "Admin App Route Guards"

Staff-only login, role check on every route, redirect non-staff.

**16.2 RBAC middleware**
→ See `15-saas-admin/01-roles-permissions-rbac.md` → "RBAC Implementation"

Implement `hasPermission`, `requirePermission`, admin route guards.

**16.3 Audit logging**
→ See `15-saas-admin/01-roles-permissions-rbac.md` → "Audit Logging"

Implement `logAuditEvent` — call on every write action in admin.

**16.4 SuperAdmin dashboard**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "Dashboard — Superadmin Overview"

Build KPI cards, DAU/revenue charts, alert feed.

**16.5 User management**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "User Management"

Searchable user table, user detail page, suspend/delete actions.

**16.6 Content moderation queue**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "Content Moderation Queue"

Build moderation review UI — approve/remove with keyboard shortcuts.

**16.7 Support ticket system**
→ See `15-saas-admin/04-customer-support.md` — full ticket system

Agent ticket list, ticket thread with reply, macros, quick actions sidebar.

**16.8 Analytics dashboard**
→ See `15-saas-admin/05-analytics-finance.md` → "Analytics Dashboard"

User growth, DAU, conversion funnel, top courses, content breakdown.

**16.9 Finance dashboard**
→ See `15-saas-admin/05-analytics-finance.md` → "Finance Dashboard"

MRR/ARR, revenue by provider, institutional accounts table, refund processing.

**16.10 Staff management**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "Staff Management"

Staff list, invite new staff, change roles, audit log view.

**16.11 System config (superadmin only)**
→ See `15-saas-admin/02-superadmin-staff-dashboard.md` → "System Configuration"

Feature flags, AI config, maintenance mode toggle.

✅ **Phase 16 complete when:** All 6 staff roles can log in and only see their permitted sections.

---

## Phase 17 — Institution Dashboard
**Duration:** 2–3 days  
**Goal:** `apps/institution` fully functional for institution admins and lecturers

### Steps

**17.1 Institution app auth**
→ See `15-saas-admin/03-institution-dashboard.md`

Institution-scoped login, role guard (institution_admin / lecturer only).

**17.2 Institution overview dashboard**
→ See `15-saas-admin/03-institution-dashboard.md` → "Institution Dashboard — Overview"

KPI cards, engagement chart, course mastery grid, at-risk alerts.

**17.3 Student management**
→ See `15-saas-admin/03-institution-dashboard.md` → "Student Detail"

Student list with filters, individual student profile + mastery view.

**17.4 At-risk detection**
→ See `15-saas-admin/03-institution-dashboard.md` → "At-Risk Detection Algorithm"

Implement and schedule the at-risk detection job.

**17.5 Course management**
→ See `15-saas-admin/03-institution-dashboard.md` → "Course Management"

Course list, create/edit course, bulk material upload.

**17.6 Billing management**
→ See `15-saas-admin/03-institution-dashboard.md` → "Billing & Seat Management"

Plan overview, seat usage bar, add seats, download invoices.

**17.7 Lecturer management**
→ See `15-saas-admin/03-institution-dashboard.md`

Invite lecturers, assign to courses, manage access.

✅ **Phase 17 complete when:** Institution admin can monitor their students, upload materials, manage billing.

---

## Phase 18 — Landing Site & Help Center
**Duration:** 1–2 days  
**Goal:** `apps/landing` and `apps/docs` deployed and polished

### Steps

**18.1 Landing page**
→ See `16-monorepo-apps/02-landing-site.md` → "Homepage Sections"

Build all sections: hero, stats, how-it-works, three modes, gamification, testimonials, pricing, CTA.

**18.2 Pricing page**
→ See `16-monorepo-apps/02-landing-site.md` → "Pricing Page"

Currency toggle (NGN/USD), period toggle (monthly/yearly), 3-column plan cards.

**18.3 Institution landing**
→ See `16-monorepo-apps/02-landing-site.md` → "Institution Landing Page"

B2B landing with features, social proof, "Request a demo" CTA.

**18.4 Help center**
→ See `18-help-docs/01-help-center.md` → "Content Structure"

Write the 40+ help articles. Implement client-side search with FlexSearch.

**18.5 Contextual help widget**
→ See `18-help-docs/01-help-center.md` → "In-App Help Widget"

Add floating ? button to student app with route-aware article suggestions.

**18.6 Deploy both**
```bash
vp run build:landing   # deploys to lerno.dev
vp run build:docs      # deploys to docs.lerno.dev
```

✅ **Phase 18 complete when:** Both sites live, help center searchable, contextual help works in app.

---

## Phase 19 — External API Gateway
**Duration:** 1–2 days  
**Goal:** `apps/api-gateway` deployed, institutions can sync students via REST

### Steps

**19.1 Express app scaffold**
→ See `16-monorepo-apps/03-api-gateway-integrations.md` → "Implementation"

Create Express app with: apiKeyAuth middleware, /v1/students, /v1/courses, /v1/analytics routes.

**19.2 API key management**
→ See `16-monorepo-apps/03-api-gateway-integrations.md` → "Authentication"

Create/revoke API keys from institution dashboard.

**19.3 Webhook delivery**
→ See `16-monorepo-apps/03-api-gateway-integrations.md` → "Webhooks (Outbound)"

Implement webhook dispatch on: student.at_risk, exam.reminder_sent.

**19.4 OpenAPI spec**
→ See `16-monorepo-apps/03-api-gateway-integrations.md` → "OpenAPI Spec"

Generate Swagger UI at `/v1/docs`.

✅ **Phase 19 complete when:** Institution can call `GET /v1/students` and get their cohort data.

---

## Phase 20 — CI/CD, Monitoring & Production Deploy
**Duration:** 1–2 days  
**Goal:** Everything in production, automated pipeline, monitoring active

### Steps

**20.1 GitHub Actions pipeline**
→ See `11-infra/01-deployment.md` → "GitHub Actions CI/CD"

Set up: check → preview deploy on PR → production deploy on merge to main.

**20.2 Database migrations in CI**
→ See `11-infra/01-deployment.md`

Auto-run `db:migrate` before each production deploy.

**20.3 Sentry setup**
→ See `11-infra/01-deployment.md` → "Monitoring"  
→ See `19-scaling/01-scaling-strategy.md` → "Sentry Performance Monitoring"

Initialize Sentry in both client and server hooks. Source map upload in CI.

**20.4 PostHog analytics**
→ See `19-scaling/01-scaling-strategy.md` → "Key Events to Track"

Initialize PostHog, add all `track.*` calls to key user actions.

**20.5 Cloudflare CDN rules**
→ See `11-infra/02-cdn-scaling-monitoring-env.md` → "CDN Strategy"

Set up page rules: cache static assets aggressively, bypass API routes.

**20.6 Domain configuration**

| Domain | Points to |
|---|---|
| `lerno.dev` | Vercel (landing) |
| `app.lerno.dev` | Vercel (web) |
| `admin.lerno.dev` | Vercel (admin) — add IP allowlist |
| `school.lerno.dev` | Vercel (institution) |
| `docs.lerno.dev` | Vercel (docs) |
| `api.lerno.dev` | Render (api-gateway) |
| `media.lerno.dev` | Cloudflare R2 public URL |

**20.7 Final legal setup**
→ See `12-legal/01-content-ownership.md`

Add Privacy Policy + Terms of Service pages (linked from footer of landing + settings).

**20.8 Switch payments to live mode**

Change Paystack and Stripe keys from test to live. Test one real payment before launch.

✅ **Phase 20 complete when:** CI green on main, production URLs live, one real test payment successful.

---

## Post-Launch — Ongoing Operations

### Week 1–4 after launch:
→ See `17-operations/01-operations-runbooks.md` → "Daily Admin Checklist"  
→ See `17-operations/01-operations-runbooks.md` → "AI Content Quality Review"

- Monitor AI content quality daily
- Clear moderation queue daily
- Respond to support tickets within 4 hours
- Watch Sentry for unexpected errors

### Month 2–3:
→ See `19-scaling/01-scaling-strategy.md` → "Phase 2: 10,000 → 100,000 Users"

- Add PgBouncer if connections > 70%
- Add Redis (Upstash) to replace in-memory cache
- Split pg-boss workers into 3 specialized instances

### Month 6+:
→ See `19-scaling/01-scaling-strategy.md` → "Phase 3: 100,000 → 1,000,000 Users"

- Multi-region PostgreSQL
- Redis cluster
- Dedicated SFU instances per region

---

## Quick Reference — Phase Summary

| Phase | What you build | Duration |
|---|---|---|
| 0 | Environment + accounts | 1 day |
| 1 | Monorepo scaffold | 1 day |
| 2 | Database schema | 1–2 days |
| 3 | Shared packages (AI, storage, email, payments) | 2–3 days |
| 4 | Authentication + onboarding | 2 days |
| 5 | Core feed (Scroll Mode) | 3–4 days |
| 6 | Study content types (quiz, flashcard, poll) | 3–4 days |
| 7 | AI content generation + tutor | 2–3 days |
| 8 | Study Mode (flashcard sessions, mock exam, pomodoro) | 3 days |
| 9 | Watch Mode + video | 2–3 days |
| 10 | Gamification (XP, streaks, leaderboard) | 1–2 days |
| 11 | Communities + social + notifications | 2 days |
| 12 | Payments + premium gating | 2–3 days |
| 13 | Email + push notifications | 1 day |
| 14 | Live streaming + Spaces | 3–4 days |
| 15 | Tauri desktop + Android apps | 2–3 days |
| 16 | Admin + staff dashboard | 4–5 days |
| 17 | Institution dashboard | 2–3 days |
| 18 | Landing site + help center | 1–2 days |
| 19 | External API gateway | 1–2 days |
| 20 | CI/CD + production deploy | 1–2 days |
| **Total** | | **~45–60 days solo** |

> With a 3-person team splitting frontend/backend/infra, target **20–30 days** to MVP (Phases 0–13 + 20).

---

## MVP Shortcut — What to Build First for Launch

If you need to launch in **under 30 days**, build only these phases for v1:

```
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 10 → 12 → 20
```

That gives you:
- Working feed with AI content
- Quiz + flashcard posts
- XP + streaks
- Paystack/Stripe subscriptions
- Deployed to production

Everything else (live streaming, native apps, admin panel, institution dashboard) becomes v1.1 and beyond.
