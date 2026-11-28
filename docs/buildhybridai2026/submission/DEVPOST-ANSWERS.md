# Devpost answer bank

Field labels and word limits differ by hackathon. Verify each field when logged in, then paste/trim the relevant answer below. Do not include secrets, debug tokens, `.env` contents or personal data.

## Short description (≤100 words)

Lerno turns notes, past questions and course prospectuses into flashcards, quizzes and exam feedback. For #BuildHybridAI, every judged runtime generation call in the Web/Chrome app goes through Firebase AI Logic, with visible `ON_DEVICE` / `IN_CLOUD` badges. Offline Revision Pack works with the page loaded and the network off, Private Pass redacts identifiers on-device before cloud use, and Curriculum Bootstrap imports PDFs or public Drive links with an editable preview.

## Inspiration

Students study on buses, in hostels and in lecture halls with unreliable connectivity. Their notes also contain names, matric numbers and other details they should not casually send to a cloud model. Firebase AI Logic's hybrid mode lets Lerno do useful work on-device first, fall back to cloud only when needed, and show the user exactly where each answer ran.

## What it does

- **Offline Revision Pack** caches notes locally and generates flashcards with `ONLY_ON_DEVICE` when offline, queueing them for sync after reconnect.
- **Private Pass** regex-masks obvious identifiers, then asks the on-device model to remove contextual names and locations before any cloud call.
- **Instant + Enhanced** produces a fast hybrid answer and a deeper cloud answer from the same private-passed question.
- **Curriculum Bootstrap** extracts courses from a PDF, public Google Drive link or pasted text, then waits for user confirmation before saving.
- **Snap-and-Mark** marks a photographed answer on-device and escalates only ambiguous cases to cloud review.
- The capability chip and per-answer badges make the hybrid handoff visible.

## How I built it

I kept Lerno's existing app shell, Drizzle schema and prompt builders, then added a browser-only Firebase AI Logic client in `apps/web/src/lib/ai/`. It initialises the public Firebase config and App Check, selects explicit inference modes, parses `inferenceSource`, and exposes one generation entry point used by all judged features. Local IndexedDB caching and an aggregate data-saved counter support the offline/privacy story. A shared remote function syncs queued packs and saves confirmed courses.

## Challenges I ran into

Firebase AI Logic is a client SDK, so the existing server-side generation jobs could not perform hybrid inference. I moved runtime generation into the web app and left the old provider code in place only as disclosed pre-existing code. On-device web inference also needs Chrome 139+, a flag and a preparatory download from a user gesture, so the UI includes a **Prepare model** control and a truthful capability readout.

## Accomplishments that I'm proud of

The hybrid handoff is visible rather than decorative: every answer says where it ran. Private Pass fails closed when Nano is unavailable, and Curriculum Bootstrap never sends original scanned page images to the cloud. The offline Revision Pack still works with the page already loaded, then syncs when connectivity returns.

## What I learned

Hybrid AI is not just "cloud with a fallback". It requires designing for capability detection, user-consented model downloads, structured output constraints that work in both modes, and honest privacy boundaries. Showing `inferenceSource` builds trust because users can verify the claim.

## What's next

Add a service worker for full offline reload, expand Snap-and-Mark to batch marking, and use the queued revision packs for spaced-repetition scheduling. The Tauri v2 mobile companion remains separate and outside this Web/Chrome entry.

## Built with

SvelteKit 3, Svelte 5 runes, Vite+, TypeScript, Firebase AI Logic, Firebase App Check, Chrome Prompt API / Gemini Nano, IndexedDB, pdfjs-dist, Drizzle ORM, Postgres, Tailwind CSS, shadcn-svelte, Lucide icons, Vercel and Cloudflare Workers.

## Existing app disclosure

See [`EXISTING-APP-DISCLOSURE.md`](./EXISTING-APP-DISCLOSURE.md). Paste the relevant paragraphs into whichever Devpost field asks about prior work or use of existing code.

## Links

- Repository: <https://github.com/mudiageo/lerno>
- Demo: <https://lerno.mudiageo.tech> (DNS pending)
- Video: pending public YouTube upload
