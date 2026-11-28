# Decisions log

| #   | Decision                                                                | Source               | Notes                                                                                                 |
| --- | ----------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Enter as **solo Mudia**, Nigeria                                        | Entrant              | Age of majority met; Nigeria not excluded                                                             |
| 2   | **Repoint all AI calls to Firebase AI Logic, retain previous AI logic** | Entrant              | Keep prompts/orchestration, replace inference path; old providers disclosed and not called at runtime |
| 3   | Firebase project does not exist yet; entrant will create it             | Entrant              | Needs config + App Check setup before implementation can be verified                                  |
| 4   | Demo URL: `lerno.mudiageo.tech`                                         | Entrant              | Verify live, public, free through 16 Dec                                                              |
| 5   | Entrant will record and upload a public ≤3-minute YouTube video         | Entrant              | Video is mandatory; upload early for processing                                                       |
| 6   | Entry category: Web/Chrome                                              | Derived              | Only `apps/web` exists; Tauri mobile is not eligible as a native platform                             |
| 7   | Build cache-first, add service worker only if time allows               | Entrant              | Airplane-mode demo works with page loaded; SW is stretch                                              |
| 8   | Private Pass uses regex **plus** on-device prompt                       | Entrant              | Deterministic masking plus contextual scrubbing                                                       |
| 9   | Add Snap-and-Mark to the feature set                                    | Entrant              | Photographed past question + answer, marked on-device                                                 |
| 10  | Tauri v2 mobile is entrant's separate work                              | Entrant              | Demonstrates cloud fallback when Nano unavailable; separate branch, out of submitted runtime          |
| 11  | Firebase AI Logic hybrid SDK is the only runtime inference path         | Rules + architecture | Client SDK cannot run in server jobs; generation moves into `apps/web`                                |
| 12  | Show `inferenceSource` on-device/cloud badges                           | Plan                 | Directly answers the Technological Implementation criterion and organiser demo advice                 |
| 13  | Google Drive import uses **pasted public file links, no API key**       | Entrant              | Avoids committed credentials; no folder listing                                                       |
| 14  | Curriculum Bootstrap appears in **both onboarding and settings**        | Entrant              | Share one component and one bulk-insert remote function                                               |
| 15  | Service worker is the first cut, then Snap-and-Mark                     | Plan                 | Features 1–5 carry the entry                                                                          |
| 16  | Commit the plan docs before implementation                              | Entrant              | Allows work to continue elsewhere                                                                     |

## Open items

- Firebase web config values from entrant.
- App Check site key and debug token safelisting.
- Exact Devpost submission form fields and word limits (requires logged-in session).
- Verify `lerno.mudiageo.tech` is reachable and shows the current build.
- Root `LICENSE` file and `license` field (Apache-2.0 preferred).
- README section disclosing pre-existing code and summarising contest-period work.
