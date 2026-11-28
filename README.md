# Lerno — StudyScroll

Lerno turns lecture notes, past questions and course prospectuses into short, active study material: flashcards, quizzes, feed posts and exam practice. This repository is the **Web/Chrome** entry for the **#BuildHybridAI 2026 Firebase Hybrid AI Hackathon**.

- Public demo: <https://lerno.mudiageo.tech>
- Source: <https://github.com/mudiageo/lerno>
- Licence: [MIT](./LICENSE)
- Hackathon notes: [HACKATHON.md](./HACKATHON.md)

## What the hybrid AI features do

All judged runtime inference in `apps/web` goes through **Firebase AI Logic**. Every answer shows where it actually ran: `ON_DEVICE` or `IN_CLOUD`.

- **Capability readout** — detects Chrome's on-device model, shows whether it is ready/downloading/unavailable, and lets the user prepare the model from a click.
- **Offline Revision Pack** — caches pasted notes locally in IndexedDB. With the page already loaded and the network off, it uses `ONLY_ON_DEVICE` to create flashcards, queues them locally, and syncs into the study deck after reconnect.
- **Private Pass** — regex-masks emails, phone numbers, student IDs and URLs, then uses `ONLY_ON_DEVICE` inference to remove contextual names and locations. Only the sanitised text is eligible for cloud calls.
- **Instant + Enhanced** — one private-passed question produces a fast hybrid answer and a deeper cloud answer, each with its own source badge.
- **Curriculum Bootstrap** — extracts courses from a PDF, a pasted public Google Drive link, or pasted text. It runs Private Pass before structured cloud extraction, shows an editable preview, and saves only after confirmation. It is available both in onboarding and in Settings.
- **Snap-and-Mark** — reads a photo of a past question and handwritten answer on-device, marks it against an answer key, and escalates only ambiguous cases to the cloud.
- **Data-saved counter** — an aggregate count of on-device answers and estimated upload avoided. No user content is stored in the counter.

The old prompt functions in `packages/ai/src/prompts/content.ts` are reused. The existing provider SDK code in `packages/ai` and `packages/jobs` remains in the repository as disclosed pre-existing code; it is not the submitted app's runtime inference path.

## Existing-app disclosure

Lerno existed before the contest with its feed, courses, communities, study deck, LiveKit live rooms, gamification, Better Auth, Drizzle schema, deployment on Vercel/Cloudflare, and AI generation via server-side Gemini/Anthropic providers in `packages/ai` and `packages/jobs`.

**Work done during the contest (11–30 Nov 2026):**

1. Added Firebase AI Logic and App Check to the web client, with explicit hybrid inference modes and an on-device/cloud capability readout.
2. Moved every judged generation path into `apps/web/src/lib/ai/*`, reusing the pre-existing prompt builders through `@lerno/ai/prompts`.
3. Added local IndexedDB caching, an offline revision pack with reconnect sync, Private Pass redaction, dual-answer tutoring, PDF/Drive curriculum import with editable confirmation, image marking with cloud escalation, and an aggregate data-saved counter.
4. Added the public `/hybrid` demo surface and wired it into onboarding, Study, Settings and the sidebar.
5. Added an OSS MIT licence, fixed deployment migration plumbing, and documented the submission.

The earlier app is not being presented as new work. The new work is the Firebase AI Logic hybrid layer and the features above.

## Local development

```bash
vp install
vp dev
```

For Web/Chrome on-device inference, use Chrome Desktop 139+ and enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, then restart Chrome. Pre-download the model by pressing **Prepare model** in the Hybrid AI Lab before demonstrating airplane-mode generation.

Firebase web config values are public-safe. A gitignored `apps/web/.env.local` file already contains the Firebase web config and the public Fraud Defense site key; `FIREBASE_APPCHECK_PROVIDER=recaptcha-enterprise`. Add the same values to Vercel and redeploy to make `/hybrid` show **Web config loaded** in production. Env vars are named `FIREBASE_*` (no `VITE_PUBLIC_` prefix) because `src/env.ts` declares them as public via `$app/env/public`. Obvious placeholders are deliberately detected as “web config missing” so a placeholder build never pretends to be live. App Check must be enabled: the reCAPTCHA **secret** key belongs in the Firebase console only, the **site** key goes in the env var; use the debug provider only in local development. **Never commit a debug token, secret key, `.env` file or personal data.** Exact console steps are in `docs/buildhybridai2026/docs/FIREBASE-SETUP.md`.

## Validation

```bash
vp check --no-fmt
vp -C apps/web build
WORKERS_CI=1 vp -C apps/web build
vp run test -r
```

`vp check --no-fmt` skips the repository-wide formatter check because pre-existing files have mixed line endings; type and lint checks report 0 errors. `vp run test -r` still has known pre-existing placeholder test failures unrelated to the hybrid features. See [HACKATHON.md](./HACKATHON.md) and `docs/buildhybridai2026/` for the full handoff packet.

## Deployment

Vercel uses the root `vercel.json`: dependencies are installed with the frozen lockfile, canonical migrations are applied with `pnpm --filter @lerno/db run migrate:deploy`, then the web app is built with `pnpm --filter web build`. Cloudflare Workers builds use `WORKERS_CI=1` and the existing `apps/web/wrangler.jsonc`.
