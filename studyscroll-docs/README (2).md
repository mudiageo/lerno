# StudyScroll — Complete Build Documentation (v2)

> **39 specification files** covering every layer of StudyScroll: student app, admin dashboards, institution portal, SaaS management, scaling, legal, AI, and operations.

> **Positive Doomscrolling. Curriculum-Aligned. Cross-Platform.**

Everything needed to build StudyScroll from scratch — architecture, schema, prompts, payments, legal, design, and deployment — all in one place.

---

## Quick Start

```bash
# 1. Setup environment
cat 01-architecture/04-environment-variables.md

# 2. Follow dev setup guide
cat 01-architecture/05-setup-guide.md

# 3. Apply database schema
cat 02-database/02-schema-drizzle.md

# 4. Run
vp dev
```

---

## Document Map

### 00 — Overview
| File | Covers |
|---|---|
| [00-overview/01-vision.md](00-overview/01-vision.md) | Product concept, 3 modes, business model, KPIs |
| [00-overview/02-feature-map-and-personas.md](00-overview/02-feature-map-and-personas.md) | Complete feature table (free/premium), 4 user personas |

---

### 01 — Architecture
| File | Covers |
|---|---|
| [01-architecture/01-tech-stack.md](01-architecture/01-tech-stack.md) | Full stack table with rationale, Remote Functions pattern, AI + Storage abstractions with code |
| [01-architecture/02-monorepo-structure.md](01-architecture/02-monorepo-structure.md) | Annotated directory tree, pnpm workspace, svelte.config.js, Tauri conf |
| [01-architecture/03-data-flow-auth-remote-functions.md](01-architecture/03-data-flow-auth-remote-functions.md) | Request lifecycle, all 3 RF types with code, better-auth setup, route protection, onboarding flow |
| [01-architecture/04-environment-variables.md](01-architecture/04-environment-variables.md) | Every env var, how to get each one, `.env.example`, Vercel/CI setup |
| [01-architecture/05-setup-guide.md](01-architecture/05-setup-guide.md) | Step-by-step dev setup from zero to `vp dev` |

---

### 02 — Database
| File | Covers |
|---|---|
| [02-database/01-schema-overview.md](02-database/01-schema-overview.md) | Text ERD, table inventory, relationship summary, JSONB strategy, cascade rules |
| [02-database/02-schema-drizzle.md](02-database/02-schema-drizzle.md) | Full Drizzle ORM schema: all tables with types, enums, and relations |
| [02-database/01-migrations-indexes-performance.md](02-database/01-migrations-indexes-performance.md) | Migration workflow, drizzle.config.ts, all SQL indexes, connection pooling, N+1 prevention, materialized view |

---

### 03 — API & Backend
| File | Covers |
|---|---|
| [03-api/03-feed-algorithm.md](03-api/03-feed-algorithm.md) | Scoring formula (5 factors), full Remote Function impl, adaptive quiz failure loop, surprise question injection |
| [03-api/01-storage-email-jobs-search-notifications-moderation.md](03-api/01-storage-email-jobs-search-notifications-moderation.md) | Presigned upload flow, Cloudflare Stream upload, FTS search, SSE notifications, Web Push, all pg-boss job handlers, moderation pipeline |

---

### 04 — Frontend
| File | Covers |
|---|---|
| [04-frontend/01-setup-theming-animations-a11y-offline.md](04-frontend/01-setup-theming-animations-a11y-offline.md) | svelte.config.js, root layout, theme store, platform detection, animation utilities, accessibility, service worker, offline strategy |

---

### 05 — Features
| File | Covers |
|---|---|
| [05-features/01-all-features.md](05-features/01-all-features.md) | App shell layout, PostComposer, Watch mode grid, Study mode (FSRS flashcards, Pomodoro), social (communities, follows), analytics, mock exam generator, note upload/OCR, push registration |
| [05-features/04-post-types.md](05-features/04-post-types.md) | Every post type — Valibot schemas, content contracts, feed rendering rules, visibility by mode, poll voting, link preview, image grid, past exam card, create command |
| [05-features/07-gamification.md](05-features/07-gamification.md) | XP table (14 events), 10-level system, streak logic, leaderboard query, 20 achievement badges, XP float animation |

---

### 06 — AI
| File | Covers |
|---|---|
| [06-ai/01-generation-tutor-ocr-ratelimiting.md](06-ai/01-generation-tutor-ocr-ratelimiting.md) | Nightly batch generation job, per-type prompt builders, AI tutor chatbot component + RF, rate limiting (free/premium/institutional), cost controls |

---

### 07 — Payments
| File | Covers |
|---|---|
| [07-payments/01-subscription-model.md](07-payments/01-subscription-model.md) | Tier definitions, Paystack + Stripe full implementations with webhook handlers, factory auto-select by currency, offline DRM |
| [07-payments/04-institutional.md](07-payments/04-institutional.md) | Institutional licensing tiers, seat management, full schema additions, admin dashboard RFs, cohort analytics, at-risk detection, billing flow, auto-downgrade |

---

### 08 — Video
| File | Covers |
|---|---|
| [08-video/01-strategy-youtube-stream-shorts-offline.md](08-video/01-strategy-youtube-stream-shorts-offline.md) | Hybrid video strategy, YouTube Data API v3 with 24h cache, privacy-enhanced embed component, timestamp deep-links, Cloudflare Stream TUS upload, HLS player, Shorts swipeable player, offline download (premium, own platform only) |

---

### 09 — Live
| File | Covers |
|---|---|
| [09-live/01-webrtc-livekit-spaces.md](09-live/01-webrtc-livekit-spaces.md) | mediasoup SFU server (workers, rooms, transports, produce/consume), SFU API route, LiveKit fallback token generation, env-var provider switch, StreamHost component (full WebRTC flow), SpaceRoom audio component |

---

### 10 — Native (Tauri v2)
| File | Covers |
|---|---|
| [10-native/01-tauri-desktop-android.md](10-native/01-tauri-desktop-android.md) | tauri.conf.json, capabilities, Rust main.rs, build commands, Android prerequisites + signing, platform-aware component patterns, native push, offline video downloads, GitHub Actions CI |

---

### 11 — Infrastructure
| File | Covers |
|---|---|
| [11-infra/01-deployment.md](11-infra/01-deployment.md) | Vercel config, Render render.yaml, GitHub Actions CI/CD, Sentry + PostHog init, email provider, pg-boss worker + all cron schedules |
| [11-infra/02-cdn-scaling-monitoring-env.md](11-infra/02-cdn-scaling-monitoring-env.md) | Cloudflare CDN rules, R2 bucket structure, PgBouncer config, read replica strategy, in-memory cache, PostHog event tracking, Sentry error boundary, cost estimate |

---

### 12 — Legal & Compliance
| File | Covers |
|---|---|
| [12-legal/01-content-ownership.md](12-legal/01-content-ownership.md) | ToS clauses, YouTube API compliance, DMCA takedown flow, GDPR/NDPR data table + student rights, AI content labelling |

---

### 13 — Design
| File | Covers |
|---|---|
| [13-design/01-design-system.md](13-design/01-design-system.md) | oklch color system (light/dark/OLED), typography scale, spacing, animation keyframes, PostCard, 3D flashcard flip, InfiniteFeed |
| [13-design/02-components-watchmode-mobile.md](13-design/02-components-watchmode-mobile.md) | Sidebar, BottomNav, CommandPalette, QuizPost, Watch mode layout spec, responsive breakpoints, safe area, skeleton loaders, XP progress bar |

---

### 14 — Prompts
| File | Covers |
|---|---|
| [14-prompts/01-system-prompts.md](14-prompts/01-system-prompts.md) | Content generation system prompt, all per-type prompts, AI tutor prompt, moderation prompt, OCR prompt, generation pipeline code, rate limiter |
| [14-prompts/02-all-prompts.md](14-prompts/02-all-prompts.md) | Complete prompt reference, urgency-aware personalization prompt, referral/streak/achievement notification copy |

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | SvelteKit Remote Functions | Replaces Express; zero-config RPC |
| Primary AI | Gemini 2.5 Pro | Cheaper, faster, Vision for OCR |
| AI fallback | Claude Sonnet | Higher quality; auto-swapped via proxy |
| Storage | Cloudflare R2 | No egress fees, S3-compatible |
| Video CDN | Cloudflare Stream | Adaptive HLS/DASH, no server transcoding |
| YouTube | Embed-only (nocookie IFrame) | ToS compliance; never download to server |
| Payments (Africa) | Paystack | NGN/GHS/KES support |
| Payments (Global) | Stripe | USD/EUR, subscriptions |
| Live | Custom mediasoup SFU + LiveKit fallback | Built from scratch; swap via `LIVE_PROVIDER` env var |
| Mobile/Desktop | Tauri v2 | Single `apps/web` source, no code duplication |
| Toolchain | Vite+ (`vp`) | Replaces ESLint + Prettier + Vitest + Turborepo |
| Styling | Tailwind CSS v4 | CSS-first `@theme`, no config file |
| Auth | better-auth | Session-based, OAuth, email/password |
| ORM | Drizzle | Type-safe, migration-first, no runtime overhead |
| Search | PostgreSQL FTS + pg_trgm | No extra service needed |
| Queue | pg-boss | PostgreSQL-backed; no Redis needed |

---

## Build Commands

```bash
vp dev                              # start dev server :5173
vp check                            # type-check + lint
vp check --fix                      # auto-fix all issues
vp test                             # run tests
vp run build:web                    # production web build
vp run build:desktop                # Tauri desktop (macOS/Win/Linux)
vp run build:android                # Tauri Android APK/AAB
vp run db:generate                  # generate Drizzle migration from schema changes
vp run db:migrate                   # apply pending migrations
vp run db:studio                    # open Drizzle Studio :4983
vp run jobs:dev                     # start pg-boss worker
npx web-push generate-vapid-keys    # generate VAPID keys for Web Push
```
