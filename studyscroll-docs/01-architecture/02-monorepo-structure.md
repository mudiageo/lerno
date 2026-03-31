# Monorepo Structure — Complete Directory Guide

## Overview

StudyScroll is a pnpm monorepo managed by Vite+. A single `apps/web` SvelteKit source powers the web app, desktop (Tauri), and Android (Tauri Android) — no code duplication across platforms.

---

## Directory Tree

```
studyscroll/                          ← monorepo root
├── vite.config.ts                    ← Vite+ unified config (lint, fmt, test, tasks)
├── package.json                      ← root scripts, devDependencies
├── pnpm-workspace.yaml               ← workspace package paths
├── .env.example                      ← template for all env vars
├── .gitignore
├── .prettierignore                   ← managed by Vite+
│
├── apps/
│   ├── web/                          ← SvelteKit 2 — THE single source for all platforms
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── +layout.server.ts   ← session load, user context
│   │   │   │   ├── +layout.svelte      ← root layout (theme, toast, modal portals)
│   │   │   │   │
│   │   │   │   ├── (auth)/             ← unauthenticated layout
│   │   │   │   │   ├── login/+page.svelte
│   │   │   │   │   ├── register/+page.svelte
│   │   │   │   │   └── forgot-password/+page.svelte
│   │   │   │   │
│   │   │   │   ├── (app)/              ← authenticated shell layout
│   │   │   │   │   ├── +layout.svelte  ← sidebar, bottom nav, command palette
│   │   │   │   │   │
│   │   │   │   │   ├── feed/           ← Scroll Mode (BlueSky/X)
│   │   │   │   │   │   ├── +page.svelte
│   │   │   │   │   │   └── +page.server.ts
│   │   │   │   │   │
│   │   │   │   │   ├── watch/          ← Watch Mode (YouTube)
│   │   │   │   │   │   ├── +page.svelte       ← video grid
│   │   │   │   │   │   ├── [videoId]/
│   │   │   │   │   │   │   └── +page.svelte   ← video player page
│   │   │   │   │   │   └── shorts/
│   │   │   │   │   │       └── +page.svelte   ← shorts/clips player
│   │   │   │   │   │
│   │   │   │   │   ├── study/          ← Study Mode (focused)
│   │   │   │   │   │   ├── +page.svelte       ← mode selector
│   │   │   │   │   │   ├── flashcards/+page.svelte
│   │   │   │   │   │   ├── quiz/+page.svelte
│   │   │   │   │   │   ├── mock-exam/+page.svelte
│   │   │   │   │   │   └── pomodoro/+page.svelte
│   │   │   │   │   │
│   │   │   │   │   ├── live/           ← Live streams + Spaces
│   │   │   │   │   │   ├── +page.svelte       ← live directory
│   │   │   │   │   │   ├── [streamId]/
│   │   │   │   │   │   │   └── +page.svelte   ← stream viewer/host
│   │   │   │   │   │   └── spaces/[roomId]/
│   │   │   │   │   │       └── +page.svelte   ← audio space
│   │   │   │   │   │
│   │   │   │   │   ├── communities/    ← Communities
│   │   │   │   │   │   ├── +page.svelte
│   │   │   │   │   │   └── [slug]/+page.svelte
│   │   │   │   │   │
│   │   │   │   │   ├── search/+page.svelte
│   │   │   │   │   ├── notifications/+page.svelte
│   │   │   │   │   ├── leaderboard/+page.svelte
│   │   │   │   │   │
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── +page.svelte       ← own profile
│   │   │   │   │   │   └── [username]/+page.svelte
│   │   │   │   │   │
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   ├── +page.svelte       ← settings hub
│   │   │   │   │   │   ├── courses/+page.svelte
│   │   │   │   │   │   ├── account/+page.svelte
│   │   │   │   │   │   ├── appearance/+page.svelte   ← dark/light/OLED
│   │   │   │   │   │   ├── accessibility/+page.svelte
│   │   │   │   │   │   └── billing/+page.svelte
│   │   │   │   │   │
│   │   │   │   │   └── onboarding/
│   │   │   │   │       ├── +page.svelte
│   │   │   │   │       └── courses/+page.svelte
│   │   │   │   │
│   │   │   │   └── api/                ← server-only API routes (webhooks etc.)
│   │   │   │       ├── auth/[...all]/+server.ts    ← better-auth handler
│   │   │   │       ├── webhooks/
│   │   │   │       │   ├── paystack/+server.ts
│   │   │   │       │   └── stripe/+server.ts
│   │   │   │       ├── upload/+server.ts            ← presigned URL generator
│   │   │   │       └── push/subscribe/+server.ts   ← web push subscription
│   │   │   │
│   │   │   ├── lib/                    ← $lib alias
│   │   │   │   ├── components/
│   │   │   │   │   ├── feed/
│   │   │   │   │   │   ├── PostCard.svelte
│   │   │   │   │   │   ├── QuizPost.svelte
│   │   │   │   │   │   ├── FlashcardPost.svelte
│   │   │   │   │   │   ├── PollPost.svelte
│   │   │   │   │   │   ├── VideoPost.svelte
│   │   │   │   │   │   ├── SurpriseQuestion.svelte
│   │   │   │   │   │   ├── PostComposer.svelte
│   │   │   │   │   │   └── InfiniteFeed.svelte
│   │   │   │   │   ├── video/
│   │   │   │   │   │   ├── VideoPlayer.svelte       ← custom player
│   │   │   │   │   │   ├── YouTubeEmbed.svelte
│   │   │   │   │   │   ├── ShortsPlayer.svelte
│   │   │   │   │   │   ├── VideoCard.svelte
│   │   │   │   │   │   └── VideoUploader.svelte
│   │   │   │   │   ├── study/
│   │   │   │   │   │   ├── FlashcardDeck.svelte
│   │   │   │   │   │   ├── QuizSession.svelte
│   │   │   │   │   │   ├── MockExamPaper.svelte
│   │   │   │   │   │   ├── PomodoroTimer.svelte
│   │   │   │   │   │   └── MasteryHeatmap.svelte
│   │   │   │   │   ├── live/
│   │   │   │   │   │   ├── StreamViewer.svelte
│   │   │   │   │   │   ├── StreamHost.svelte
│   │   │   │   │   │   └── SpaceRoom.svelte
│   │   │   │   │   ├── gamification/
│   │   │   │   │   │   ├── XPBadge.svelte
│   │   │   │   │   │   ├── StreakCounter.svelte
│   │   │   │   │   │   ├── LeaderboardCard.svelte
│   │   │   │   │   │   └── AchievementToast.svelte
│   │   │   │   │   ├── layout/
│   │   │   │   │   │   ├── Sidebar.svelte
│   │   │   │   │   │   ├── BottomNav.svelte
│   │   │   │   │   │   ├── Header.svelte
│   │   │   │   │   │   ├── CommandPalette.svelte
│   │   │   │   │   │   └── ThemeToggle.svelte
│   │   │   │   │   └── ui/             ← shadcn-svelte components (auto-generated)
│   │   │   │   │
│   │   │   │   ├── server/
│   │   │   │   │   ├── remote/         ← Remote Functions (server-only)
│   │   │   │   │   │   ├── feed.ts
│   │   │   │   │   │   ├── posts.ts
│   │   │   │   │   │   ├── quiz.ts
│   │   │   │   │   │   ├── users.ts
│   │   │   │   │   │   ├── courses.ts
│   │   │   │   │   │   ├── payments.ts
│   │   │   │   │   │   ├── study.ts
│   │   │   │   │   │   ├── live.ts
│   │   │   │   │   │   └── ai.ts
│   │   │   │   │   └── db.ts           ← db client for use in routes
│   │   │   │   │
│   │   │   │   ├── stores/             ← Svelte stores + TanStack Query keys
│   │   │   │   │   ├── auth.svelte.ts
│   │   │   │   │   ├── theme.svelte.ts
│   │   │   │   │   ├── feed.svelte.ts
│   │   │   │   │   └── notifications.svelte.ts
│   │   │   │   │
│   │   │   │   ├── utils/
│   │   │   │   │   ├── platform.ts     ← isTauri, isAndroid, isDesktop
│   │   │   │   │   ├── format.ts       ← date, number, duration formatters
│   │   │   │   │   └── debounce.ts
│   │   │   │   │
│   │   │   │   └── types/              ← shared TypeScript types
│   │   │   │       ├── post.ts
│   │   │   │       ├── user.ts
│   │   │   │       └── course.ts
│   │   │   │
│   │   │   ├── app.css                 ← Tailwind v4 + @theme tokens
│   │   │   ├── app.html
│   │   │   └── hooks.server.ts         ← auth session, request context
│   │   │
│   │   ├── static/
│   │   ├── svelte.config.js
│   │   └── package.json
│   │
│   └── desktop/                        ← Tauri v2 shell (no UI code here)
│       ├── src-tauri/
│       │   ├── tauri.conf.json         ← frontendDist → ../../web/build
│       │   ├── capabilities/
│       │   │   └── default.json        ← Tauri capability grants
│       │   └── src/
│       │       └── main.rs
│       └── package.json
│
└── packages/
    ├── db/                             ← Drizzle ORM schema + client
    │   ├── src/
    │   │   ├── schema/
    │   │   │   ├── index.ts            ← re-export all tables
    │   │   │   ├── users.ts
    │   │   │   ├── courses.ts
    │   │   │   ├── posts.ts
    │   │   │   ├── interactions.ts
    │   │   │   ├── quizzes.ts
    │   │   │   ├── mastery.ts
    │   │   │   ├── payments.ts
    │   │   │   ├── live.ts
    │   │   │   ├── communities.ts
    │   │   │   ├── notifications.ts
    │   │   │   └── jobs.ts
    │   │   └── client.ts               ← db = drizzle(pool)
    │   ├── migrations/
    │   ├── drizzle.config.ts
    │   └── package.json
    │
    ├── ai/                             ← AI provider abstraction
    │   ├── src/
    │   │   ├── provider.ts             ← AIProvider interface
    │   │   ├── gemini.ts
    │   │   ├── claude.ts
    │   │   ├── index.ts                ← factory + proxy fallback
    │   │   └── prompts/
    │   │       ├── content.ts          ← post generation prompts
    │   │       ├── tutor.ts
    │   │       ├── moderation.ts
    │   │       └── exam.ts
    │   └── package.json
    │
    ├── storage/                        ← Storage provider abstraction
    │   ├── src/
    │   │   ├── provider.ts
    │   │   ├── r2.ts
    │   │   └── index.ts
    │   └── package.json
    │
    ├── email/                          ← Email provider (Resend + Nodemailer)
    │   ├── src/
    │   │   ├── provider.ts
    │   │   ├── resend.ts
    │   │   ├── nodemailer.ts
    │   │   ├── index.ts
    │   │   └── templates/
    │   │       ├── verify-email.ts
    │   │       ├── reset-password.ts
    │   │       ├── exam-reminder.ts
    │   │       ├── welcome.ts
    │   │       └── subscription-receipt.ts
    │   └── package.json
    │
    ├── payments/                       ← Payment gateway abstraction
    │   ├── src/
    │   │   ├── provider.ts
    │   │   ├── paystack.ts
    │   │   ├── stripe.ts
    │   │   └── index.ts
    │   └── package.json
    │
    └── jobs/                           ← pg-boss background worker
        ├── src/
        │   ├── worker.ts               ← registers all job handlers
        │   ├── jobs/
        │   │   ├── generate-content.ts
        │   │   ├── send-email.ts
        │   │   ├── send-push.ts
        │   │   ├── process-upload.ts
        │   │   └── update-mastery.ts
        │   └── cron.ts                 ← scheduled jobs
        └── package.json
```

---

## pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
overrides:
  # Required for Vite+ alpha — redirect vite/vitest to Vite+ core
  vite:   'npm:@voidzero-dev/vite-plus-core@latest'
  vitest: 'npm:@voidzero-dev/vite-plus-test@latest'
```

---

## Root package.json

```json
{
  "name": "studyscroll",
  "private": true,
  "scripts": {
    "dev":           "vp run dev",
    "build":         "vp run build:web",
    "build:desktop": "vp run build:desktop",
    "build:android": "vp run build:android",
    "test":          "vp test",
    "check":         "vp check",
    "db:migrate":    "vp run db:migrate",
    "db:studio":     "vp run db:studio",
    "prepare":       "vp prepare"
  },
  "devDependencies": {
    "vite-plus": "latest",
    "@tauri-apps/cli": "^2",
    "drizzle-kit": "latest",
    "typescript": "^5"
  }
}
```

---

## apps/web/svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $db:      '../../packages/db/src',
      $ai:      '../../packages/ai/src',
      $storage: '../../packages/storage/src',
      $email:   '../../packages/email/src',
      $payments:'../../packages/payments/src',
    },
  },
};
```

---

## Tauri Config

```json
// apps/desktop/src-tauri/tauri.conf.json
{
  "build": {
    "frontendDist": "../../web/build",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "cd ../../web && vp dev",
    "beforeBuildCommand": "cd ../../web && vp build"
  },
  "bundle": {
    "identifier": "dev.studyscroll.app",
    "productName": "StudyScroll",
    "version": "0.1.0",
    "targets": ["dmg", "msi", "deb", "appimage", "apk", "aab"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  },
  "app": {
    "windows": [
      {
        "title": "StudyScroll",
        "width": 1280,
        "height": 800,
        "minWidth": 375,
        "minHeight": 600,
        "decorations": true
      }
    ],
    "security": { "csp": null }
  }
}
```
