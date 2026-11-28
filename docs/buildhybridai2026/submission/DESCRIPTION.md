# Devpost description draft

Lerno turns scrolling into active studying. Students paste notes, upload a prospectus or photograph a past question, and get short flashcards, quizzes and exam feedback they can actually use.

The #BuildHybridAI entry adds a real hybrid inference layer to the existing Web/Chrome app. Every generation call now goes through Firebase AI Logic, and every answer shows `ON_DEVICE` or `IN_CLOUD` so the handoff is visible.

The most useful feature is the Offline Revision Pack. Notes are cached locally, so with the page already loaded and the network off, Lerno uses on-device Gemini Nano to build flashcards and queues them for sync when reconnecting. Private Pass regex-masks obvious identifiers, then asks the on-device model to remove contextual names and locations before anything is eligible for cloud use. Instant + Enhanced answers the same private-passed question twice: a fast hybrid answer and a deeper cloud answer. Curriculum Bootstrap reads a PDF, a public Google Drive link or pasted text; scanned pages are transcribed on device, Private Pass runs before cloud extraction, and an editable course preview appears before saving. Snap-and-Mark reads a photographed answer on-device and escalates only ambiguous cases to the cloud.

An aggregate counter shows how many answers stayed on device and the estimated upload avoided. The old prompts from the existing app were reused; the previous server provider code remains as disclosed pre-existing code and is not the submitted runtime inference path.
