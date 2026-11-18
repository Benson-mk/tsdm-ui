# Browse and inspect compact D thread rows — #116

## Plan and failure inventory, before implementation

Use the approved assembled production userscript seam with only external HTTP
responses substituted. Preserve the parser, workspace, host and existing stable
row IDs. The production baseline is `abb4987`; D at `35d8a26` is visual reference
only. The parent issue approves this seam. No schema or public API changes are
needed. The existing Reka Collapsible can retain the footer trigger while its
content occupies the following full-width line.

Failure modes to exercise before feature code:

- Original and latest authors/times become conflated; unknown counts become zero.
- Missing qualified destinations erase known latest metadata or become fake links.
- Disclosure moves its trigger, steals focus, selects a row or sends a request.
- Long CJK titles, footer values or detail values clip at 320px/150% text.
- Selected dark text, hovered controls, local draft flags or focus lose contrast.
- New action names omit visible wording/thread identity or remain English-only.
- Row structure breaks supplied redirect/PID navigation, list anchors or writing.
- Prototype imports or global style changes affect other results/reader surfaces.

Extend latest-reply tests for data, naming, disclosure geometry and responsive
appearance; retain redirect assertions. Extend the existing retained-replies
journey for inspection while exact addressed writing/options remain active.
Reconcile only the obsolete flat/no-shadow assertion in stable-board-browsing.
Run affected Edge E2Es, static checks and build, preserving failed and passing
reporter artifacts separately. Root performs installed Edge checks on the exact
candidate. The owner explicitly deferred Chrome to #118 and treats Tampermonkey
stable/BETA equivalently; this slice does not claim Chrome qualification.

## Trade-offs

Inherited presentation/ownership choices: parent #115 S1–S4 and prototype D2–D4.
Actual implementation choices and verification results will be recorded below.

1. Keep the row markup in the existing production layout, with the existing
   row ID, title selector and host-owned navigation. This avoids a new component
   boundary for a single consumer, at the cost of additional layout markup.
2. Retain category and status flags as separate secondary text after the full
   title. This preserves their independent production meaning and the title's
   accessible name, at the cost of a little more height than the prototype's
   category embedded within its title link.
3. Allow the footer to wrap when long source values or translated unavailable
   wording exhaust its width. All text remains available and the disclosure is
   stationary within that layout; narrow rows can consequently occupy more
   vertical space. Expanded metadata uses the following full-width line.
4. Keep the existing compact-spacing padding below 100% text while adopting D's
   14px padding at default/enlarged sizes. This preserves the current appearance
   preference, at the cost of two padding regimes.

The selected accent foreground adaptation, local contrast overrides, rounded
rows, dark/forced-color boundaries, compact visible wording, longer accessible
names and transient Reka disclosure are the inherited D decisions above. No new
dependency, public client contract, storage schema or one-way-door choice was
introduced. The owner-approved Chrome deferral reduces duplicate interim runs
and accepts later discovery of Chrome-specific problems; #118 owns that check.

## Verification and replay

Candidate SHA-256:
`3c181cb6e5ed7e41e918f41f22d05ea5c15d5e9c8403c5c782d0739d86f26b0c`.
Build inputs are recorded in each receipt's source manifest. Runtime used Node
26.0.0 and npm 11.12.1, versus repository pins 24.22.0/11.21.1; this is an explicit
toolchain limitation. Playwright/runtime/browser details are in receipts and
scenario annotations. Build, typecheck, ESLint and full formatting passed.

Retain the following packages under `evidence/runs/`; each contains a receipt,
report, source identities, authored fixture snapshots and hash manifest:

| Run (UTC)                  | Observation                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-17T18-17-08.222Z` | Expected red: the baseline has no detail disclosure.                                                                                |
| `2026-11-17T18-18-10.584Z` | First green: stationary pointer/Enter/Space disclosure.                                                                             |
| `2026-11-17T18-19-00.595Z` | Expected red: baseline action names lack thread/action identity.                                                                    |
| `2026-11-17T18-19-39.918Z` | Invalid fixture attempt (incorrect recovery field), preserved as failed; replaced with real title/Back navigation.                  |
| `2026-11-17T18-20-34.314Z` | Action names pass; selected ordinary text contrast fails at 3.657:1 before adaptation.                                              |
| `2026-11-17T18-21-16.553Z` | 110/115 pass; two obsolete zero-border assertions, plus three authoring/list-context failures retained for baseline classification. |
| `2026-11-17T18-24-46.927Z` | 6/6 pass: D border reconciliation, disclosure and addressed local reply source/options/target continuity.                           |
| `2026-11-17T18-24-52.929Z` | 29/33 appearance cases pass; four failures only at the obsolete default row-padding assertion.                                      |
| `2026-11-17T18-26-25.100Z` | 4/4 appearance matrix reruns pass with the D/default versus existing compact padding contract.                                      |
| `2026-11-17T18-26-56.907Z` | 13/13 D row/latest cases pass, including real 302/PID navigation.                                                                   |

Supplemental packages retain further observations:

- `2026-11-17T18-27-31.357Z`: four affected cases pass (board-check
  identity/reveal, redirect refusal and real redirected writing); five legacy
  IM66 authoring-control timeouts and one old Page 2 text lookup fail before the
  changed row action.
- `2026-11-17T18-30-39.817Z`: 2/2 pass, covering 1440x900 disclosure/keyboard
  order and independently absent original author/date/counts with known non-link
  latest activity.
- `2026-11-17T18-33-27.657Z`: 2/2 pass; unselected category, title, metadata
  and footer control text meet 4.5:1 through row/link/control hover in light and
  dark appearances, including the actual hovered control background.

The driving agent reproduced the three broad-run authoring/list failures on the
unmodified `abb4987` baseline in `2026-11-17T18-27-21.236Z`. They are retained
baseline failures, not passes or row regressions. The earlier baseline run
`2026-11-17T18-26-49.836Z` failed at sandbox browser launch and has no behavioral
authority. Additional legacy redirect failures remain explicit in their own run;
the modern B2 real-302 and exact-PID cases, addressed local-reply switching, and
`J5.redirect-writing` cover the affected navigation and writing behavior. The
baseline package `2026-11-17T18-31-12.913Z` independently reproduces
`IM66.redirect-lastpost` at its hidden Complete source fill (Visual is the
default editor) and `J2.session-redirect` at the old Page 2 text lookup. Those
failures precede the changed latest-post action and remain explicit.

Replay the affected suites using the production build:

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/latest-reply.spec.ts tests/e2e/stable-board-browsing.spec.ts tests/e2e/list-context.spec.ts tests/e2e/retained-replies.spec.ts tests/e2e/compact-board-controls.spec.ts tests/e2e/design-fidelity.spec.ts
npx playwright test tests/e2e/appearance.spec.ts
node scripts/verify-evidence.mjs evidence/runs/<run-id>
```

Relevant named cases map to the parent contract:

- **D2/D3:** `D2-D5.details`, `B2.metadata`, `B2.partial`, `B2.touch-*` and
  `D8-D9.*` retain complete titles, category, original metadata, truthful missing
  activity and explicit zero counts. Existing pin/control cases retain statuses.
- **D4:** `B2.latest-unopened`, `B2.latest-selected`, `B2.exact-pid` assert title
  and qualified latest destinations, a real local 302 and exact post 105.
- **D5/D9:** `D2-D5.details` records row-relative geometry, pointer/Enter/Space,
  retained focus, keyboard order and an unchanged request ledger. `D8-D9.*`
  covers localized accessible actions, selected-text contrast, 44px triggers,
  forced colors and full-width detail reachability after scrolling.
  `D9.unselected-*` measures unselected secondary text and actual control hover
  backgrounds in light/dark; the addressed-writing journey retains and captures
  the selected local-reply flag with its high-contrast foreground pair.
- **D7:** `B1.*` preserves list width/anchors; `UX106.switch` opens details while
  addressed local writing/options survive switching and return. The retained
  reply suite also passes all unchanged storage/recovery behavior.
- **D8:** `D8-D9.*` covers all four themes and all three interface languages at
  390x844 and 320x640/150% text with long CJK/category data. The wider existing
  appearance matrix covers default and compact sizes through 1440px and beyond.
- **D10:** Only production layout/styles/strings changed; no prototype component,
  fixture, transport, inspector, reserve or alternative host was imported.
- **D11:** Installed Edge results are supplied separately by the driving agent;
  Chrome remains explicitly deferred to #118. Synthetic accessibility assertions
  and forced-color captures are not a screen-reader audit.

## Installed Edge and bounded acceptance

The driving agent verified byte-for-byte installed source equality with the
candidate above in Edge 157.0.4341.46 (Chromium 157.0.8103.39), macOS 15.6.0
and Tampermonkey BETA 5.6.6242, with the owner's stable/BETA equivalence.
This running-browser attribution was corrected during #118 using high-entropy
user-agent data; the earlier .60 value described the app bundle pending restart,
not the installed session observed here. Automated runs retain their separately
recorded runtime versions. The private package
`evidence/runs/d-installed-2026-11-18/` contains 15 files sealed by SHA256SUMS,
including the authored report, exact source comparison, request ledger, corrected
geometry/focus observations, writing/return observations and screenshots.

On live-row-A, pointer/Enter/Space retained row-relative trigger bounds
164.891/85.664/73.109/44 and focus with zero requests. Supplied title navigation
opened the thread. Nonempty local source, a changed form option and exact writing
destination survived inspection, Back and cross-thread navigation/remount. A
second supplied latest-post destination, live-row-B, resolved its exact final-page
post anchor and focused the matching article. Dark selected metadata/local draft
and actual installed AX names/states were inspected. No forum POST occurred; own
test text, form option and theme were restored.

Limits remain explicit: live-row-A's first latest redirect refused exact
resolution after the forum returned an inconsistent page boundary. The second
successful destination does not turn that refusal into a pass. The parser,
navigation and host are unchanged by this ticket. An initial geometry probe
selected a hidden pinned row; its original result is retained, and only the
corrected explicit visible-row probe is acceptance evidence. Installed AX
inspection is not a screen-reader speech audit. Chrome remains deferred to #118.

- [x] D hierarchy, full source wording, category/status meaning, zero/unknown
      metadata and original/latest distinction verified at the assembled seam.
- [x] Supplied title/latest routes, real 302/exact post and no added effects
      verified synthetically and on the successful installed representative.
- [x] Stationary pointer/Enter/Space disclosure, full-width details, focus,
      reader/list state and addressed local writing/options/destination verified.
- [x] All supported locales, four themes, narrow/enlarged geometry, ordinary-text
      contrast, hover, forced colors and usable targets verified.
- [x] Failure inventory preceded implementation; build and relevant static checks
      passed; development-only graph exclusions verified.
- [x] Edge assembled/installed evidence retained with hashes, replay instructions
      and explicit baseline/live limitations.
- [ ] Chrome installed checks — deferred to #118 with explicit owner approval.
