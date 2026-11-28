# #BuildHybridAI 2026 — Lerno entry

This repository is being entered as Lerno's **Web/Chrome** submission to the Firebase Hybrid AI Hackathon.

**Deadline: 30 Nov 2026, 2:00 PM PT / 22:00 UTC.** Commits pushed after the deadline are not evaluated.

The detailed handoff packet lives in [`docs/buildhybridai2026/`](docs/buildhybridai2026/README.md).

## Start here

1. [`docs/buildhybridai2026/docs/FIREBASE-SETUP.md`](docs/buildhybridai2026/docs/FIREBASE-SETUP.md) — remaining console, App Check, Chrome and domain steps.
2. [`docs/buildhybridai2026/docs/IMPLEMENTATION-PLAN.md`](docs/buildhybridai2026/docs/IMPLEMENTATION-PLAN.md) — feature scope, build order, Firebase SDK details, env vars, demo plan.
3. [`docs/buildhybridai2026/docs/RULES.md`](docs/buildhybridai2026/docs/RULES.md) — official rules digest and clauses that affect Lerno.
4. [`docs/buildhybridai2026/docs/DECISIONS.md`](docs/buildhybridai2026/docs/DECISIONS.md) — entrant facts and locked decisions.
5. [`docs/buildhybridai2026/docs/PROGRAM.md`](docs/buildhybridai2026/docs/PROGRAM.md) — dates, eligibility, prizes, judging and submission requirements.
6. [`docs/buildhybridai2026/submission/`](docs/buildhybridai2026/submission/) — description draft, Devpost answer bank, existing-app disclosure and demo script.
7. [`docs/buildhybridai2026/research/evidence-ledger.csv`](docs/buildhybridai2026/research/evidence-ledger.csv) — official sources and access dates.

## Current state

- Official rules and program brief: captured.
- Entrant facts and product decisions: captured.
- Firebase AI Logic runtime, App Check wiring, capability readout and all judged features: implemented in `apps/web/src/lib/ai/*` and surfaced at `/hybrid`.
- Existing-app disclosure, description draft and demo script: see `docs/buildhybridai2026/submission/`.
- MIT licence added at repo root.
- Final validation and deployment config: done; all changes committed and pushed.
- Firebase project: created. Public web config and Fraud Defense site key are wired in gitignored `apps/web/.env.local`; `FIREBASE_APPCHECK_PROVIDER=recaptcha-enterprise`. Vercel is deployed and `/hybrid` shows **Web config loaded** — see `FIREBASE-SETUP.md`.
- Demo domain DNS: live; `lerno.mudiageo.tech` resolves to Vercel and returns 200.
- Cloudflare Workers: fixed a global-scope crash by lazily constructing the email provider (`08555d7`); redeploy and retest pending.
- Devpost form: not started.
- YouTube demo: not recorded.

## Critical reminders

- All runtime inference in the submitted app must go through **Firebase AI Logic**. Keep the old providers only as disclosed pre-existing code, not as the running app's inference path.
- Show `inferenceSource` on answers so the on-device/cloud handoff is visible.
- Firebase web config values and the App Check site key are public-safe; App Check secret keys, debug tokens, `.env` files and PII are not.
- Existing-app disclosure is mandatory: disclose pre-existing code and summarise what changed during the contest.
- Do not stage `AGENTS.md`; it has unrelated line-ending noise.
