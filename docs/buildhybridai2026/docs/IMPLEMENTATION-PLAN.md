# Implementation plan — Lerno × #BuildHybridAI 2026

Read `RULES.md` first. Everything below is scoped to the fixed 30 Nov 2026, 2:00 PM PT deadline.

## Situation at the start of implementation

- Repo: `https://github.com/mudiageo/lerno`, local path `C:\Users\User\lerno`.
- Product: Lerno — social learning platform turning scrolling into active, exam-ready study. Code name `lerno`; docs also call it StudyScroll. Entry category: **Web/Chrome**.
- Existing AI: `packages/ai` uses `@google/generative-ai`, `@anthropic-ai/sdk` and `@google/genai` directly, called from `packages/jobs`. `apps/web` does **not** import `@lerno/ai`. Prompts live in `packages/ai/src/prompts/content.ts` (quiz, flashcard, tutor, OCR, mock exam, moderation).
- Missing: root `LICENSE` file; root `license` field.
- Existing app with public usage: yes — needs the existing-app disclosure and "what I built during the contest" summary.
- Demo URL supplied by entrant: `lerno.mudiageo.tech` (verify live and public through 16 Dec).
- Recent fix commits (27–28 Nov) are real activity but not a significant feature update. The features below provide that.

## Entrant facts

Solo entrant: Mudia, Nigeria. Age of majority satisfied; Nigeria eligible. Firebase project: entrant will create. Video: entrant will record and upload a public ≤3-minute YouTube video. Tauri v2 mobile work is handled by the entrant separately.

## Architecture decision

Firebase AI Logic is a **client SDK**. On-device Gemini Nano uses Chrome's Prompt API and App Check lives in the browser. The server-side `packages/jobs` workers cannot perform hybrid inference. Therefore:

- All judged inference moves into `apps/web`.
- Existing prompts, schemas, orchestration and rate-limit design in `packages/ai` are **reused** (satisfying "retain our previous AI logic").
- The jobs package stays in the repo, disclosed as pre-existing code and not used at runtime for this submission.
- If a reviewer asks why other model SDKs remain in the repo: they are disclosed pre-existing code, not called by the running app.

## Features, in build order

### 1. Firebase plumbing + capability readout (in progress)

- Dependency: `firebase@^13.4.0` added to `apps/web/package.json`; `@firebase/util` build script allowed in `pnpm-workspace.yaml`; lockfile updated. No source files written yet.
- New module: `apps/web/src/lib/ai/firebase.ts` (client-only; guard with `browser` from `$app/env`).
  - `initializeApp(config)` from `firebase/app` with public config from `import.meta.env.VITE_PUBLIC_FIREBASE_*` — project convention already used for `VITE_PUBLIC_APP_URL` in `apps/web/src/lib/auth.svelte.ts`.
  - App Check: `initializeAppCheck` + `ReCaptchaV3Provider` from `firebase/app-check`. In debug, set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` **before** initialisation; never commit the token.
  - `getAI(app, { backend: new GoogleAIBackend() })`, then `getGenerativeModel(ai, { mode, onDeviceParams, inCloudParams })`.
  - Verified API in installed `firebase@13.4.0` / `@firebase/ai@3.1.0`: `InferenceMode.PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `ONLY_IN_CLOUD`, `PREFER_IN_CLOUD` (values are lowercase strings); `InferenceSource.ON_DEVICE` / `IN_CLOUD`; `result.response.inferenceSource`; `model.initializeDeviceModel(onProgress)`.
  - `initializeDeviceModel()` must be called on a user gesture and before the first query; model download can take minutes.
  - On-device supports single-turn text only, text+image (JPEG/PNG) and structured output — no chat.
- Capability readout: detect `(globalThis as any).LanguageModel?.availability()` → `available | downloadable | downloading | unavailable`; missing API means webview/no Chrome Prompt API. UI shows "On-device model available" or "On-device model unavailable — using cloud", plus a per-answer `ON_DEVICE` / `IN_CLOUD` badge from `inferenceSource`.
- Env vars to add to `.env.example`: `VITE_PUBLIC_FIREBASE_API_KEY`, `VITE_PUBLIC_FIREBASE_AUTH_DOMAIN`, `VITE_PUBLIC_FIREBASE_PROJECT_ID`, `VITE_PUBLIC_FIREBASE_APP_ID`, `VITE_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`, `VITE_PUBLIC_FIREBASE_APPCHECK_DEBUG`. Firebase web config is public-safe by design; App Check debug token is not.

### 2. Offline Revision Pack — cache first

- IndexedDB cache of course notes and past questions; small local wrapper (no new heavy dependency).
- With the page loaded and network off, on-device generation produces flashcards/hints/explanations. Results queue locally and sync into the existing study deck via `study.remote.ts` on reconnect.
- No service worker in the first pass; the airplane-mode demo works with the page already loaded.

### 3. Private Pass — regex + on-device prompt

- Regex masks phone numbers, matric numbers, emails and URLs.
- An `ONLY_ON_DEVICE` prompt catches contextual names and addresses the regex misses.
- Only sanitised text reaches the cloud. UI reports how many details stayed on device.

### 4. Instant + Enhanced

- One question, two answers: `PREFER_ON_DEVICE`/`ONLY_ON_DEVICE` for the instant answer, `ONLY_IN_CLOUD` with `inCloudParams.model` for the enhanced answer. Both labelled with `inferenceSource`.

### 5. Curriculum Bootstrap

- New "Set up your courses" flow, reachable **both** from onboarding and settings, sharing one component and one bulk-insert remote function.
- Upload a prospectus/curriculum PDF. `pdfjs-dist` extracts text in the browser; scanned pages render to JPEG/PNG and use text+image input.
- Structured JSON output maps to existing `packages/db/src/schema/courses.ts`: `{ code, title, units, outline, topics[] }[]`.
- Run Private Pass before any cloud call.
- Editable preview table; confirm before bulk insert.
- Google Drive import: **pasted public file links only, no API key**. Parse `drive.google.com/file/d/<id>/view` and `uc?id=<id>`; fetch `uc?export=download&id=<id>&confirm=t` (the `confirm=t` handles the large-file scan interstitial). Only "anyone with the link" files work. Per-file status and course-match suggestions; nothing written until confirm.

### 6. Snap-and-Mark

- Photograph a past question and handwritten answer (JPEG/PNG). On-device image input extracts both, marks against a cached answer key with structured JSON output; ambiguous answers escalate to cloud.

### 7. Data-saved counter

- Count on-device answers and estimate upload avoided. Small UI element across all features.

### 8. Service worker — stretch only

- App shell cache for installability and offline reload. Cut this first if time is short.

## Cut line

Features 1–5 carry the entry. Feature 6 is next, then 7, then 8. If the clock bites: drop 8, then 6.

## Video plan (entrant records)

First 30 seconds: who it's for, the problem, what Firebase AI Logic makes possible. Then show: capability badge, airplane-mode generation, Private Pass masking count, the `ON_DEVICE` → `IN_CLOUD` handoff, Curriculum Bootstrap from a PDF/Drive link, and (if built) Snap-and-Mark. Optional second beat: Tauri mobile build where Nano is unavailable, showing cloud fallback still works.

## Tauri v2 mobile (entrant's separate work)

Keep in a separate branch/repo, out of the submitted runtime. The FAQ says only Web/Chrome, Android and iOS qualify; a Tauri webview is not the native SDK path, so do not select Android/iOS on the form. README should label it an experimental companion that demonstrates cloud fallback. No committed debug tokens or keys. Anything unfinished by the deadline is dead weight.

## Firebase console checklist (entrant)

1. Create project → AI Services → AI Logic → Get started → Gemini Developer API (free).
2. Register web app; copy config object into env.
3. App Check: debug provider for local with safelisted token; reCAPTCHA v3 production attestation and authorised domain for `lerno.mudiageo.tech`.
4. Chrome 139+ → enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart, pre-download with `await LanguageModel.create()` in DevTools before recording.

## Validation

- `vp check` — expect 0 errors; 44 pre-existing warnings.
- `vp build` and `WORKERS_CI=1 vp build` — both must pass.
- `vp test` — 6 pre-existing placeholder failures (`fn is not a function`), 2 passing. Do not treat as regressions.
- `git status` before commit: **never stage `AGENTS.md`** (line-ending noise only).

## Commit protocol

Doc checkpoint commit first (`docs/buildhybridai2026/` and `HACKATHON.md` only). Dependency changes to `apps/web/package.json`, `pnpm-workspace.yaml` and `pnpm-lock.yaml` are deliberately left uncommitted in this checkpoint and should be committed with the implementation.
