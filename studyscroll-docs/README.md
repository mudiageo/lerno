# StudyScroll — Complete Build Documentation

> **Positive Doomscrolling. Curriculum-Aligned. Cross-Platform.**

This repository contains every guide, spec, schema, prompt, and design decision needed to build StudyScroll from scratch — a social learning platform that transforms mindless scrolling into active, exam-ready study.

---

## Document Index

### 00 — Overview
- [00-overview/01-vision.md](00-overview/01-vision.md) — Product vision, concept, and goals
- [00-overview/02-feature-map.md](00-overview/02-feature-map.md) — Complete feature list across all modes
- [00-overview/03-user-personas.md](00-overview/03-user-personas.md) — Target users and use cases

### 01 — Architecture
- [01-architecture/01-tech-stack.md](01-architecture/01-tech-stack.md) — Full stack with rationale
- [01-architecture/02-monorepo-structure.md](01-architecture/02-monorepo-structure.md) — Directory tree and workspace config
- [01-architecture/03-data-flow.md](01-architecture/03-data-flow.md) — Request lifecycle, SSR, remote functions
- [01-architecture/04-environment-variables.md](01-architecture/04-environment-variables.md) — All env vars, secrets, config
- [01-architecture/05-setup-guide.md](01-architecture/05-setup-guide.md) — Step-by-step dev environment setup

### 02 — Database
- [02-database/01-schema-overview.md](02-database/01-schema-overview.md) — ERD, table relationships
- [02-database/02-schema-drizzle.md](02-database/02-schema-drizzle.md) — Full Drizzle ORM schema code
- [02-database/03-migrations.md](02-database/03-migrations.md) — Migration workflow
- [02-database/04-indexes-performance.md](02-database/04-indexes-performance.md) — Query optimization

### 03 — API & Backend
- [03-api/01-remote-functions.md](03-api/01-remote-functions.md) — SvelteKit Remote Functions (Query/Command/Form)
- [03-api/02-auth.md](03-api/02-auth.md) — better-auth setup, sessions, OAuth
- [03-api/03-feed-algorithm.md](03-api/03-feed-algorithm.md) — Feed scoring engine, adaptive weights
- [03-api/04-storage.md](03-api/04-storage.md) — Abstract storage API (R2 default)
- [03-api/05-email.md](03-api/05-email.md) — Resend + Nodemailer setup, templates
- [03-api/06-background-jobs.md](03-api/06-background-jobs.md) — pg-boss job queue, cron tasks
- [03-api/07-search.md](03-api/07-search.md) — PostgreSQL full-text search
- [03-api/08-notifications.md](03-api/08-notifications.md) — SSE + Web Push notifications
- [03-api/09-content-moderation.md](03-api/09-content-moderation.md) — AI moderation pipeline

### 04 — Frontend
- [04-frontend/01-sveltekit-setup.md](04-frontend/01-sveltekit-setup.md) — SvelteKit config, adapters, routing
- [04-frontend/02-ui-system.md](04-frontend/02-ui-system.md) — shadcn-svelte, Tailwind v4, design tokens
- [04-frontend/03-animations.md](04-frontend/03-animations.md) — Motion, transitions, special effects
- [04-frontend/04-infinite-scroll.md](04-frontend/04-infinite-scroll.md) — Virtual scroll, intersection observer
- [04-frontend/05-offline.md](04-frontend/05-offline.md) — Service worker, offline cache strategy
- [04-frontend/06-accessibility.md](04-frontend/06-accessibility.md) — a11y, screen readers, dyslexia toggle
- [04-frontend/07-theming.md](04-frontend/07-theming.md) — Dark/light/OLED themes

### 05 — Features
- [05-features/01-feed-scroll-mode.md](05-features/01-feed-scroll-mode.md) — Scroll mode UI and logic
- [05-features/02-watch-mode.md](05-features/02-watch-mode.md) — YouTube-style video grid and player
- [05-features/03-study-mode.md](05-features/03-study-mode.md) — Flashcards, spaced repetition, pomodoro
- [05-features/04-post-types.md](05-features/04-post-types.md) — All post type specs and schemas
- [05-features/05-social.md](05-features/05-social.md) — Follows, threads, polls, communities
- [05-features/06-quiz-surprise.md](05-features/06-quiz-surprise.md) — Quiz gates, surprise questions
- [05-features/07-gamification.md](05-features/07-gamification.md) — XP, streaks, leaderboards, badges
- [05-features/08-student-analytics.md](05-features/08-student-analytics.md) — Personal mastery dashboard
- [05-features/09-notes-pdf.md](05-features/09-notes-pdf.md) — Note upload, OCR, PDF ingestion
- [05-features/10-exam-generator.md](05-features/10-exam-generator.md) — AI mock exam paper generator
- [05-features/11-push-notifications.md](05-features/11-push-notifications.md) — Exam reminders, web push

### 06 — AI
- [06-ai/01-ai-abstraction.md](06-ai/01-ai-abstraction.md) — Provider abstraction (Gemini default / Claude fallback)
- [06-ai/02-content-generation.md](06-ai/02-content-generation.md) — Content pipeline, post types, scheduling
- [06-ai/03-feed-personalization.md](06-ai/03-feed-personalization.md) — Mastery scoring, adaptive content
- [06-ai/04-ai-tutor.md](06-ai/04-ai-tutor.md) — In-feed AI tutor chatbot
- [06-ai/05-ocr-notes.md](06-ai/05-ocr-notes.md) — Note/PDF processing with Gemini Vision
- [06-ai/06-rate-limiting.md](06-ai/06-rate-limiting.md) — Quota management, cost controls
- [06-ai/07-moderation.md](06-ai/07-moderation.md) — Content safety and filtering

### 07 — Payments
- [07-payments/01-subscription-model.md](07-payments/01-subscription-model.md) — Tier definitions, free limits, premium
- [07-payments/02-paystack.md](07-payments/02-paystack.md) — Paystack integration (Africa-first)
- [07-payments/03-stripe.md](07-payments/03-stripe.md) — Stripe integration (global)
- [07-payments/04-institutional.md](07-payments/04-institutional.md) — School/university licensing
- [07-payments/05-offline-drm.md](07-payments/05-offline-drm.md) — Downloaded content protection

### 08 — Video
- [08-video/01-strategy.md](08-video/01-strategy.md) — Hybrid video strategy overview
- [08-video/02-youtube-embed.md](08-video/02-youtube-embed.md) — oEmbed, YouTube IFrame API, clipping
- [08-video/03-cloudflare-stream.md](08-video/03-cloudflare-stream.md) — Adaptive bitrate for uploaded video
- [08-video/04-shorts.md](08-video/04-shorts.md) — Shorts/clips UI and player
- [08-video/05-offline-download.md](08-video/05-offline-download.md) — Premium offline video (own content only)

### 09 — Live
- [09-live/01-strategy.md](09-live/01-strategy.md) — Build-from-scratch vs LiveKit decision
- [09-live/02-webrtc-scratch.md](09-live/02-webrtc-scratch.md) — Custom WebRTC + SFU implementation
- [09-live/03-livekit-backup.md](09-live/03-livekit-backup.md) — LiveKit fallback configuration
- [09-live/04-spaces-audio.md](09-live/04-spaces-audio.md) — Audio-only Spaces rooms
- [09-live/05-stream-ui.md](09-live/05-stream-ui.md) — Stream viewer/host UI components

### 10 — Native (Tauri)
- [10-native/01-tauri-setup.md](10-native/01-tauri-setup.md) — Tauri v2 config, shared web source
- [10-native/02-desktop.md](10-native/02-desktop.md) — Desktop-specific features and build
- [10-native/03-android.md](10-native/03-android.md) — Android build, signing, Play Store
- [10-native/04-platform-detection.md](10-native/04-platform-detection.md) — Runtime platform branching

### 11 — Infrastructure
- [11-infra/01-deployment.md](11-infra/01-deployment.md) — Vercel (web) + Render (workers/DB)
- [11-infra/02-ci-cd.md](11-infra/02-ci-cd.md) — GitHub Actions pipeline
- [11-infra/03-monitoring.md](11-infra/03-monitoring.md) — Sentry, Plausible, PostHog
- [11-infra/04-cdn.md](11-infra/04-cdn.md) — Cloudflare CDN + R2 storage
- [11-infra/05-scaling.md](11-infra/05-scaling.md) — DB connection pooling, caching strategy

### 12 — Legal & Compliance
- [12-legal/01-content-ownership.md](12-legal/01-content-ownership.md) — ToS, user content, licensing
- [12-legal/02-dmca.md](12-legal/02-dmca.md) — DMCA takedown flow
- [12-legal/03-youtube-tos.md](12-legal/03-youtube-tos.md) — YouTube API compliance
- [12-legal/04-privacy.md](12-legal/04-privacy.md) — GDPR/NDPR data handling
- [12-legal/05-ai-disclosure.md](12-legal/05-ai-disclosure.md) — AI content labelling requirements

### 13 — Design
- [13-design/01-design-system.md](13-design/01-design-system.md) — Colors, typography, spacing, tokens
- [13-design/02-component-library.md](13-design/02-component-library.md) — All custom components spec
- [13-design/03-scroll-mode-ui.md](13-design/03-scroll-mode-ui.md) — Feed/scroll UI wireframes (text)
- [13-design/04-watch-mode-ui.md](13-design/04-watch-mode-ui.md) — Watch mode layout spec
- [13-design/05-animations-spec.md](13-design/05-animations-spec.md) — Animation library, easing, timing
- [13-design/06-mobile-responsive.md](13-design/06-mobile-responsive.md) — Responsive breakpoints, mobile-first

### 14 — Prompts
- [14-prompts/01-system-prompts.md](14-prompts/01-system-prompts.md) — All AI system prompts
- [14-prompts/02-content-generation-prompts.md](14-prompts/02-content-generation-prompts.md) — Per post-type generation prompts
- [14-prompts/03-tutor-prompts.md](14-prompts/03-tutor-prompts.md) — AI tutor conversation prompts
- [14-prompts/04-moderation-prompts.md](14-prompts/04-moderation-prompts.md) — Content safety prompts
- [14-prompts/05-exam-generator-prompts.md](14-prompts/05-exam-generator-prompts.md) — Mock exam generation prompts

---

## Quick Start

```bash
# 1. Read the setup guide first
cat 01-architecture/05-setup-guide.md

# 2. Scaffold the monorepo
# Follow 01-architecture/02-monorepo-structure.md

# 3. Set up DB
# Follow 02-database/02-schema-drizzle.md

# 4. Configure AI
# Follow 06-ai/01-ai-abstraction.md
```

---

*Total: 54 detailed specification files covering every layer of StudyScroll.*
