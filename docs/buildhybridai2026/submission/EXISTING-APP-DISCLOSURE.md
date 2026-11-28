# Existing app disclosure + contest-period work

## Existing before the contest

Lerno was already a functioning social learning app with authentication, course feeds, communities, a spaced-repetition study deck, mock exams, LiveKit live rooms, gamification, a Drizzle/Postgres schema, and Vercel/Cloudflare deployments. It already had AI prompt builders and server-side Gemini/Anthropic generation in `packages/ai` and `packages/jobs`.

This prior work is not presented as new for the hackathon.

## Built during the contest (11–30 Nov 2026)

- Firebase AI Logic + App Check in the web client, with visible on-device/cloud capability detection and per-answer `inferenceSource` badges.
- All judged runtime generation moved into `apps/web/src/lib/ai/*`, reusing the pre-existing prompt builders through `@lerno/ai/prompts`.
- IndexedDB note cache, Offline Revision Pack with reconnect sync, Private Pass redaction, Instant + Enhanced answers, PDF/Drive Curriculum Bootstrap with editable confirmation, Snap-and-Mark with cloud escalation, and an aggregate data-saved counter.
- New public `/hybrid` demo surface, plus entry points in onboarding, Study, Settings and the sidebar.
- MIT licence, deployment migration fix, and contest documentation.

The older provider SDK packages remain in the repository for disclosed historical context. They are not called by the submitted app's inference path.
