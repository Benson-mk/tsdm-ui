# Browse board context and controls in the D layout — #117

## Plan and failure inventory, before implementation

Base this slice on integration `8699332`, preserving the qualified #116 rows.
Use D at `35d8a26` as a presentation reference only. The approved seam is the
assembled production userscript with external HTTP responses replaced; no new
mock seam, public model, parser or recovery change is needed. Existing category
provenance remains authoritative. A generic board icon uses the established icon
vocabulary without implying that every board is music.

Move real statistics and complete subordinate board cards into a transient About
disclosure. Put visible compact filter/pin wording and page state together, keep
checks reachable and their meaningful status conditional, and expose the exact
supplied clear-filter destination beside active criteria. Preserve existing filter
dialog staging, row order and workspace navigation/writing ownership.

Failure inventory:

- About invents guidance/statistics/category or loses subordinate metadata/URLs.
- Unknown and zero/one/multiple subordinate contexts become conflated.
- Disclosure steals focus, sends requests, changes selection or remounts writing.
- Compact labels conceal native filtering, pin source order or current page.
- Clear invents a destination or loses retained writing and return context.
- Check states disappear, reserve a blank strip, overflow or move list anchors.
- Long localized text and subordinate descriptions overflow narrow/150% layouts.
- New ordinary-size text or focus loses contrast in dark/forced-color modes.
- Prototype CSS/transport or optional reader/authoring work leaks into production.

Write focused About and control E2Es before feature code, then extend the existing
board-check, compact-control and retained-writing journeys. Retain red and green
receipts separately with screenshots, geometry/focus and request ledgers. The
driving agent performs installed Edge checks on the exact candidate; Chrome is
explicitly deferred by the owner to #118. Stable/BETA Tampermonkey equivalence is
owner-authorized. No one-way-door decision is proposed.

## Trade-offs

Inherited product, ownership, disclosure and evidence costs remain in #115 S1–S4,
the D prototype ledger and #116's implementation ledger. In particular, this
slice retains the existing production layout ownership, transient Reka
disclosures, exact host-owned navigation and Chrome deferral already recorded
there. Distinct adaptations made here:

1. Use the existing generic boards icon with the observed category color. This
   keeps a recognizable board identity without inventing specialized semantics,
   at the cost of less board-specific visual character than the music example.
2. Keep About available when neither statistics nor subordinate boards are
   supplied, with an explicit localized unavailable message. This gives unknown
   context an honest, consistent destination but adds an otherwise empty control.
3. Keep the operational check action alongside the named filter/pin controls and
   current page. Native checks remain immediately reachable; the extra control
   and complete translated labels sometimes wrap beyond the preview's one line.
4. Use one column for subordinate cards inside About so full descriptions remain
   readable in the board pane. This uses more vertical space when the pane is
   wide enough that a multi-column card arrangement might fit.

No dependency, public contract, parser, recovery schema, publication policy or
one-way-door choice changed. The pale criteria surface with black foreground is
the established D accent treatment, verified independently in both light and dark.

## Verification and replay

Candidate SHA-256:
`213ed1f546514a93fb532b9129d05d6e150d8c45434db3e6d26e17e6285644c4`.
Receipts retain exact source/build inputs and runtime identity. Automated cases
ran in Edge 157.0.4341.60 through Playwright 1.64.1. Node 26.0.0/npm 11.12.1 differ
from repository pins 24.22.0/11.21.1; the inherited toolchain limitation remains
explicit. Build, typecheck, ESLint, formatting and `git diff --check` passed.

Each run below is retained separately under `evidence/runs/`, including failed
attempts. Packages contain receipts, reports, source identities, authored
screenshots, request/geometry/focus observations and SHA-256 manifests.

| Run (UTC)                  | Observation                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-17T18-42-15.528Z` | Required red: all three About cases fail because baseline has no About.                                                                            |
| `2026-11-17T18-43-05.640Z` | One pass, two fixture-selector failures: an unscoped child lookup found existing sidebar links. Preserved; corrected by scoping to the board pane. |
| `2026-11-17T18-43-50.309Z` | 5/5 About/heading cases pass, including absent, zero, one and multiple contexts.                                                                   |
| `2026-11-17T18-44-08.814Z` | Required red: compact filter control lacks visible wording.                                                                                        |
| `2026-11-17T18-45-18.307Z` | 5/5 About, compact controls and native staged-filter cases pass.                                                                                   |
| `2026-11-17T18-47-09.552Z` | 3/3 localized light/dark/narrow matrix and exact retained source/options/subordinate navigation cases pass.                                        |
| `2026-11-17T18-49-35.190Z` | 3/3 existing UX54 discovery cases at 390/768/1440 pass after opening About; original metadata and visible-row anchor assertions retained.          |
| `2026-11-17T18-50-44.793Z` | 2/2 expanded appearance cases pass, including long active criteria and exact clear link in all three languages at 390/320 and 150% text.           |

Replay against the production userscript:

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/compact-board-controls.spec.ts tests/e2e/board-checks.spec.ts tests/e2e/quiet-status-appearance.spec.ts tests/e2e/stable-board-browsing.spec.ts
npx playwright test tests/e2e/navigation.spec.ts -g UX54.discovery
node scripts/verify-evidence.mjs evidence/runs/<run-id>
```

Coverage mapping:

- **D1:** `D1.context-*` covers pointer/Enter/Space, expanded state/focus,
  complete child labels/descriptions/known-zero stats/exact URLs, missing fields,
  genuine board title and no sample music guidance. `D1.taxonomy` observes the
  directory category and retains it with the real heading/icon.
- **D6:** `D6.compact-controls`, `B3.staged-native` and existing compact-control
  cases retain source group semantics, exact Apply/Clear, Cancel/focus, pins in
  native order, represented counts, current page, empty results and truthful
  check availability. The empty check-status strip is absent.
- **D7:** `D7.board-context` keeps the same editor instance while toggling About
  and pins, with no requests. Exact literal CJK/BBCode source, changed Signature
  option and destination survive exact child navigation and Back. Existing
  stable-board and UX54 journeys retain reader/list anchors.
- **D8/D9:** `D8-D9.board-*` covers all three interface languages in light/dark
  at 390x844 and 320x640/150% text. Long context and active criteria wrap without
  horizontal overflow. Text, including actual hover states, meets 4.5:1; controls
  and child/clear links meet 44px targets. Forced-colors screenshots and keyboard
  focus/state are retained. This is not a screen-reader speech audit.
- **D10/D11:** Only production layout/styles/strings and assembled-user-facing
  E2Es changed. The exact candidate is supplied to the driving agent for installed
  Edge qualification; the owner defers Chrome to #118 and equates manager
  stable/BETA. No preview host, mock transport, inspector or fixture is imported.

The appearance matrix's minimum observed normal-state text contrast is 5.74:1 in
both light and dark; hover checks independently meet 4.5:1. Every measured narrow
pane has equal client/scroll width. Existing discovery journeys open About both
before examining complete subordinate metadata and after native filter navigation
resets the transient disclosure. Their content and visible-row anchor assertions
are unchanged. The board-check ownership/recovery journeys now explicitly select
the existing Source mode before accessing source text; the current default is
Visual. This reconciles obsolete test navigation without weakening check or
writing assertions. Their targeted run `2026-11-17T18-53-25.203Z` passes 2/2,
including pending-response ownership, node/selection, IME and reload assertions.

The broad diagnostic run `2026-11-17T18-47-57.126Z` passed 53/63. Its ten failures
were one obsolete immediate Source lookup, four quiet-spacing probes using the
wrong parent, one retry observation behind collapsed Details, and four assertions
expecting the previous number-only controls. The package retains every failure.
Test-only reconciliation overlapped that diagnostic sweep; the final rerun below
is the authority for the final test sources. Production bytes did not change.
The quiet spacing probes now compare About's actual bottom with the controls and
still assert no status element/blank reservation. Retry explicitly reopens Details
after the checking state; elapsed delay, deliberate retry, doubled backoff and
unchanged rows remain asserted. Compact controls now assert the selected visible
wording while preserving icon, target, focus, selection and forced-color checks.

Run `2026-11-17T19-01-29.850Z` passes all five retry/quiet-spacing cases, including
the actual two-minute delay before deliberate retry and the subsequent four-minute
backoff. The broad run independently passed the unchanged four-minute automatic
check/modal-pause case, six-minute serial ownership/hidden-pause/resume case and
two-minute mid-scroll failure/recovery case. These passing wall-clock observations
are retained and not repeated solely for test-label reconciliation.

Final run `2026-11-17T19-03-53.957Z` passes 59/59 against fixed final test sources:
the four affected suites with `--grep-invert real-timer`. Combined with the four
real-timer observations above and the three UX54 discovery cases, every selected
scenario now has passing evidence on the unchanged candidate. Every completed
package's exact file coverage, byte sizes and SHA-256 manifest verifies.

## Installed Edge

The driving agent supplied installed desktop observations on the exact candidate
above, with byte-for-byte manager source readback, Edge 157.0.4341.46
(Chromium 157.0.8103.39), macOS 15.6.0 and Tampermonkey BETA 5.6.6242. The owner
accepts stable/BETA equivalence. Private captures and authored observations are
under `evidence/runs/d-installed-2026-11-18/`, using the `edge117-*` prefix.
The authored `edge117-report.json` records these observations; the shared package
contains 25 files, with every SHA256SUMS entry verified by the driving agent.

Pointer/Enter/Space preserve About's 44px trigger and keyboard focus with zero
requests. The observed directory category, actual statistics and supplied child
navigation/Back retain literal local source and writing destination. Staged
filter selection/Cancel restores focus without requesting a destination. Pins
reveal 16 native row identities in source order. An explicit check enters checking
then idle with the expected GET. No forum POST occurs.

An initial installed narrow attempt was blocked by browser extension UI; it is
retained as blocked, not passed. After the owner dismissed that UI, the installed
320x640/150% Traditional Chinese dark check passed: pane client/scroll width
319/319, no row horizontal overflow, reachable About/child and expanded row
metadata, and a focused 44px disclosure. Normal viewport, 100% text, English and
light appearance were restored, and the test source was cleared. Chrome remains
explicitly deferred to #118.

## Acceptance checklist

- [x] Real title/category/icon vocabulary and zero/one/multiple About contexts
      retain exact supplied labels, descriptions, known statistics and links.
- [x] Localized pointer/keyboard About, expanded state and retained focus preserve
      reading/writing; existing action-time restrictions remain in place.
- [x] Compact filtering retains native groups, staged Apply/Cancel/focus, selected
      criteria and exact supplied Clear destinations without inferred combinations.
- [x] Pins retain loaded-row counts, native order and row/reader/writing identity.
- [x] Current page, native paging, empty results and unavailable states retain
      truthful existing navigation/composition behavior.
- [x] Checking, arrivals/reveal, failure/retry, delay and unavailable behavior pass,
      without a permanently reserved status band or shifted mid-scroll anchor.
- [x] Board/control light/dark, all supported languages, keyboard/focus,
      forced-colors, contrast, 44px targets and desktop/narrow/150% checks pass.
- [x] Context/control/child navigation and Back retain reader/list context and
      exact local source/options/destination without recovery/publication changes.
- [x] Failure inventory and initial relevant E2E expectations precede feature
      code; existing board-check, compact-control and appearance assertions remain.
- [x] Production build/static checks, complete-app Edge E2Es and affected installed
      Edge context/control/focus/return checks pass, with replayable bounded evidence
      and exact candidate/runtime identities; preview-only artifacts stay excluded.
- [ ] Installed Chrome checks — explicitly deferred by the owner to final #118.
