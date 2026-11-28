# #BuildHybridAI 2026 — Lerno entry

This repository is being entered as Lerno's **Web/Chrome** submission to the Firebase Hybrid AI Hackathon.

**Deadline: 30 Nov 2026, 2:00 PM PT / 22:00 UTC.** Commits pushed after the deadline are not evaluated.

The detailed handoff packet lives in [`docs/buildhybridai2026/`](docs/buildhybridai2026/README.md).

## Start here

1. [`docs/buildhybridai2026/docs/IMPLEMENTATION-PLAN.md`](docs/buildhybridai2026/docs/IMPLEMENTATION-PLAN.md) — feature scope, build order, Firebase SDK details, env vars, demo plan.
2. [`docs/buildhybridai2026/docs/RULES.md`](docs/buildhybridai2026/docs/RULES.md) — official rules digest and clauses that affect Lerno.
3. [`docs/buildhybridai2026/docs/DECISIONS.md`](docs/buildhybridai2026/docs/DECISIONS.md) — entrant facts and locked decisions.
4. [`docs/buildhybridai2026/docs/PROGRAM.md`](docs/buildhybridai2026/docs/PROGRAM.md) — dates, eligibility, prizes, judging and submission requirements.
5. [`docs/buildhybridai2026/research/evidence-ledger.csv`](docs/buildhybridai2026/research/evidence-ledger.csv) — official sources and access dates.

## Current state

- Official rules and program brief: captured.
- Entrant facts and product decisions: captured.
- Firebase SDK dependency: installed.
- Runtime implementation: not started.
- Devpost form: not started.
- YouTube demo: not recorded.

## Critical reminders

- All runtime inference in the submitted app must go through **Firebase AI Logic**. Keep the old providers only as disclosed pre-existing code, not as the running app's inference path.
- Show `inferenceSource` on answers so the on-device/cloud handoff is visible.
- Firebase web config values are public-safe; API keys, App Check debug tokens, `.env` files and PII are not.
- Existing-app disclosure is mandatory: disclose pre-existing code and summarise what changed during the contest.
- Do not stage `AGENTS.md`; it has unrelated line-ending noise.
