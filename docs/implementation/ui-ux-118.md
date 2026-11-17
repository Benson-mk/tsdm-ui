# Integrate and qualify the complete D browsing journey — #118

## Plan and failure inventory, before integration work

Start from integration `dcff5eb`, which deliberately adopts the two production
slices over `abb4987`. The selected prototype is a visual reference, never a
merge source. The accepted test seam remains the assembled production userscript
with only external HTTP responses replaced; it exercises the real parser,
workspace, editor, layout and browser host. Installed Edge and Chrome observation
is owned by the driving agent. No public API, durable schema or new test seam is
proposed, and no costly-to-reverse decision is needed.

The existing slice evidence already covers individual controls and appearance.
Add one combined journey before changing any product code, then a combined
geometry/viewport observation. A failing interaction would receive its smallest
fix only after its E2E demonstrates the failure. A pass requires no artificial
product change merely to create a red/green cycle.

Failure inventory:

- About, pins and row details together shift their own trigger or steal focus.
- Subordinate/filter/page navigation drops exact source, options or destination.
- Title and latest activity become the same destination or select the wrong post.
- A board check or newly visible status moves the retained list anchor or reader.
- Returning across threads loses the local reply indicator or revives stale text.
- Long CJK text, simultaneous context and status overflow at 320px/150% text.
- Production assembly accidentally includes preview transport, controls or reserve.
- Evidence reuses a different executable, hides failures or overstates installed
  accessibility, runtime identity or release qualification.

Record request ledgers, exact writing observations, row-relative geometry,
screenshots and source/candidate manifests. Reuse unaffected byte-identical
long-timer #117 observations as permitted by ADR0002. The final implementation
review follows all three slices; commit only after installed evidence and review
are supplied. Keep parent #115 and release publication outside this ticket.

## Trade-offs

Inherited costs remain in the #115 specification and the
[#116](ui-ux-116.md) and [#117](ui-ux-117.md) implementation ledgers. No product
or ownership change was needed. One distinct verification choice was made:

1. Keep the combined and reference-density HTTP fixtures local to their new E2Es
   instead of refactoring the established suite fixtures. This limits changes to
   qualified tests, at the cost of some duplicated external-response setup and
   explicitly copied authored reference values. They do not create an alternate
   application seam or enter the shipped graph.

Reusing compatible unchanged timer observations follows the accepted evidence
policy, with original run and source identities retained rather than presenting
them as new executions. The existing last-interacted list cursor and editor-mode
lifetime are preserved, not redesigned; their limitations are described below.

## Qualification

The assembled candidate is byte-identical to #117:
`213ed1f546514a93fb532b9129d05d6e150d8c45434db3e6d26e17e6285644c4`.
Only E2Es and implementation evidence change in #118. Automated observations use
Edge 157.0.4341.60 through Playwright 1.64.1 on macOS/arm64, Node 26.0.0 and npm
11.12.1. Repository pins are Node 24.22.0/npm 11.21.1; those pinned runtime
versions were not exercised. Installed runtimes are reported separately.

Build, typecheck, ESLint, full formatting and `git diff --check` pass. Source
inspection confirms the only production changes relative to `abb4987` are the
layout, its strings and stylesheet. The production entry still constructs the
real forum client, browser transport/navigation/preferences/downloads and
workspace. The experimental branch was not merged. No comparison switcher,
inspector, sample transport, simulated receipt or memory-only replacement host
enters that entry graph. The remaining 100px CSS values belong to established
writing inputs, not a reserved preview strip.

### Combined observations

`D7.combined-journey` exercises real parsed About/subordinate navigation and
Back, staged native Apply/Clear, pin disclosure, page 2 and page 1, check/arrival
reveal, original metadata, title versus exact page-2/PID202 navigation,
cross-thread switching and browser Back. Literal multiline CJK/BBCode source,
unchecked Signature and writing destination survive. About and details preserve
the same editor node, focus and row-relative trigger bounds without requests.
The complete journey's request ledger contains GETs only. Returning to writing
uses the existing visible action when navigation parks it; an editor remount can
restore Visual mode, so exact source is inspected through the existing Source
control instead of assuming the prior editor mode survives.

The existing list cursor and reader are separate observations: after selecting
thread 43 then Back, the reader and writing return to thread 42 while the list's
last-interacted cursor remains on 43. A new assertion expecting cursor 42 failed
on both this candidate and unchanged `abb4987`; `openThread` already records the
clicked selection on the previous navigation entry. The final case asserts the
actual inherited cursor 43 alongside reader/PID202 and exact thread-42 writing.
This preserves existing navigation ownership and does not claim to repair that
potentially surprising distinction. The failed diagnostic remains retained.

`D8-D9.combined-geometry` keeps About, pins, row details and a meaningful arrival
status present together. A check retains the mid-list row 45 at offset 3.859375px
and the 300px list width. All three locales in light/dark at 390x844 and
320x640/150% preserve full long CJK titles, reachable metadata, focused stationary
44px-or-larger disclosure and equal pane client/scroll widths, with no overflowing
rows. Forced-colors focus is also captured. These observations complement the
same-candidate four-theme row contrast and board-context contrast matrices.

`D8-D10.reference-density` feeds the same ten authored D sample rows through the
production HTTP/parser path. At 1440x900/default text it shows three complete
initial rows, with the first 144.296875px high, versus historical D's four rows
and 116px first row. The production pane reaches the actual viewport bottom at
900px and has 20px bottom padding. The difference is explained by the documented
separate category/status line, full production targets and complete control
labels/check action, including control wrapping. These are the #116/#117
adaptation costs, not a new universal density requirement. The screenshot and
geometry make the comparison reviewable without copying the 100px preview
reserve or forcing four rows for every language/content combination.

### Runs and replay

Every listed run remains separate under `evidence/runs/`, with receipt, report,
source/candidate identities, authored scenarios, screenshots, observations and
request ledgers covered by a verified manifest. Raw installed material remains
private. No failed run is relabelled as passed.

| Run (UTC)                               | Observation                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-17T19-11-24.734Z`              | Combined test incorrectly inspected opaque app history as a native page URL; exact native continuation/request destination replaces that test assumption.                   |
| `2026-11-17T19-12-13.903Z`              | Test tried to inspect parked writing; corrected to use existing Return to writing.                                                                                          |
| `2026-11-17T19-13-02.268Z`              | Test assumed Source mode survives an editor remount; corrected to select Source before comparing exact retained bytes.                                                      |
| `2026-11-17T19-13-44.780Z`              | Initial combined geometry passes, including all 12 locale/theme/viewport combinations and forced colors.                                                                    |
| `2026-11-17T19-14-31.952Z`              | Reader-42/list-cursor-43 diagnostic fails the new cursor-42 assumption.                                                                                                     |
| `baseline-118/2026-11-17T19-16-03.874Z` | Exact unchanged `abb4987` reproduces that list-cursor failure; baseline package and test source retained.                                                                   |
| `2026-11-17T19-17-24.313Z`              | Affected sweep passes 171/172. The only failure is the new geometry case checking visibility before Vue's viewport docking render completed.                                |
| `2026-11-17T19-19-12.741Z`              | Equivalent authored D reference-density case passes; screenshot and row bounds retained.                                                                                    |
| `2026-11-17T19-20-47.298Z`              | Final combined journey, geometry and density pass twice, 6/6. The test now waits for responsive rendering before choosing Threads, matching the existing navigation helper. |

The final sweep covers the complete affected latest-reply, compact-control,
stable-board, board-check (except real timers), retained-reply and appearance
suites. All 172 selected scenarios have passing evidence after the focused
geometry correction, plus the additional reference-density scenario. No product
bytes changed during test correction. The four unchanged real-timer scenarios
retain their #117 same-candidate observations: automatic/modal pause, serial
reader/board ownership with hidden/resume, two/four-minute retry backoff, and
mid-scroll failure/recovery. Their original receipts at
`2026-11-17T18-47-57.126Z` and `2026-11-17T19-01-29.850Z` remain the authority;
they were not rerun or represented as new runs here.

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/d-browsing-journey.spec.ts tests/e2e/latest-reply.spec.ts tests/e2e/compact-board-controls.spec.ts tests/e2e/stable-board-browsing.spec.ts tests/e2e/board-checks.spec.ts tests/e2e/retained-replies.spec.ts tests/e2e/appearance.spec.ts --grep-invert real-timer
npx playwright test tests/e2e/d-browsing-journey.spec.ts tests/e2e/d-density.spec.ts --repeat-each 2
node scripts/verify-evidence.mjs evidence/runs/<run-id>
```

The final #117 quiet-status/UX54 cases and unchanged long timers remain compatible
under ADR0002 because executable bytes match. Historical #116 results retain
their earlier candidate identity; the affected row/appearance/continuity cases
are rerun on this final candidate above. Earlier baseline authoring/list-context
and obsolete redirect assertions remain failed as described in #116, with their
unchanged-baseline reproductions; modern exact-302/PID and retained-writing cases
provide the affected passing observations, not a claim of a completely green
unrelated repository suite.

### D1–D11 reconciliation

| Requirement              | Named cases and observation authority                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 identity/context      | `D1.context-0/1/2`, `D1.taxonomy`, `D7.board-context` in the final affected sweep: real title/category, missing/zero/multiple context, exact child URLs and no sample identity.                                                                   |
| D2 hierarchy             | `D2-D5.details`, `B2.metadata`, `D8-D9.*`, `D7.combined-journey` and `D8-D10.reference-density`: full titles, category, original metadata, local-reply/pinned meaning and selected surface.                                                       |
| D3 truthful partial data | `D3.unknown`, `B2.partial`, `B2.touch-html/json`, context-zero and details-zero: independent missing values, known non-link activity and explicit zero counts.                                                                                    |
| D4 destinations          | `B2.latest-unopened/selected` (real local HTTP302), `B2.exact-pid`, combined title/page2/PID202 and GET ledger. Live successes/refusals are separately bounded below.                                                                             |
| D5 stationary disclosure | `D2-D5.details`, `D7.combined-journey`, `D8-D9.combined-geometry`: pointer/Enter/Space, exact row-relative bounds, focused trigger, keyboard order, full-width metadata and no disclosure requests.                                               |
| D6 production controls   | `D6.compact-controls`, `B3.staged-native`, `B3.writing-focus-*`, all `UI90.*`/`UX99.board-*` cases, and combined child/filter/pin/page/check/reveal flow. Unchanged real timers retain the explicit #117 run identities above.                    |
| D7 continuity            | `UX106.switch` and full retained-reply suite, `B1.*`, `D7.board-context`, both combined cases: one local reply, exact source/options/target, reader PID, editor node, list cursor and anchors.                                                    |
| D8 appearance            | Four-theme `D8-D9.*` row cases, light/dark board cases, complete `J5.appearance-*` matrix, combined 12-setting reflow and equivalent-reference density screenshots.                                                                               |
| D9 accessibility         | Same row/board matrices and combined geometry: localized distinct names/expanded state, actual keyboard focus/order, 44px targets, selected/hover text contrast and forced colors. Installed AX checks remain distinct from screen-reader speech. |
| D10 isolation            | Production source/build inspection plus `D8-D10.reference-density`: real assembly, no comparison UI, no preview reserve, no imported prototype modules.                                                                                           |
| D11 installed/evidence   | Same-candidate Edge/Chrome source readback, runtime/AX, geometry/focus, request ledgers and screenshots below. Completed synthetic/baseline manifests and private installed SHA256SUMS verify; exact replays above.                               |

### Installed observations and final review

The driving agent supplied `edge118-report.json` and `chrome118-report.json` in
the private `evidence/runs/d-installed-2026-11-18/` package. Its 41 files are
sealed by a verified SHA256SUMS manifest. Both managers read back exactly the
candidate SHA above. Edge runs 157.0.4341.46/Chromium 157.0.8103.39; Chrome runs
157.0.8103.79/Chromium 157.0.8103.79. Both use macOS 15.6.0 and Tampermonkey
BETA 5.6.6242, under the owner's stable/BETA equivalence. One enabled copy is
observed in each browser. Browser runtime attribution is independent of app
bundle versions pending restart; #116's earlier attribution is corrected here.

Installed Edge verifies simultaneous About/pins/long-CJK details with stationary
pointer/Enter/Space bounds and retained focus, with zero requests for that
bounded disclosure interval. Nonempty literal source, Signature disabled and the
original writing destination survive child/Back, native filter Apply/exact Clear,
page 2/Back and an explicit check from checking to idle. A different thread's
supplied latest link resolves to its exact page-5 post and focuses that article;
Back restores the original thread's source/options/destination. The byte-identical
#117 320px/150% Traditional Chinese dark observation is reused, not represented
as a new Edge narrow run.

Installed Chrome verifies an accessible supplied title, local draft indicator,
literal source/disabled Signature/destination, About and row pointer/Enter/Space,
44px targets, child/Back, staged-filter Cancel/focus, Apply/exact Clear,
page 2/Back, checks and cross-thread/Back. The supplied latest redirect reaches
its exact post through a real native remount while retaining writing. In that
same-thread composing context the remounted editor retains autofocus; no claim
is made that the article owns focus. A fresh bounded disclosure repeat records
zero requests without truncation. The 320x640/150% Traditional Chinese dark
observation has pane client/scroll width 319/319 and no row overflow, with context,
pins and details reachable. Actual installed accessibility names/states and
keyboard focus are recorded; no screen-reader speech audit was performed.

Installed limits are retained explicitly:

- #116's first latest-link refusal after an inconsistent native page boundary
  remains failed. A successful representative does not change that result.
- Chrome's first chosen thread returned a native permission refusal. It remains
  separate from the accessible representative used for the completed journey.
- Chrome's long request ledger is truncated across native remounts. It does not
  establish a complete zero-effect ledger. Observed POSTs are Cloudflare RUM or
  challenge requests, not forum writing; no Send action was performed. The
  untruncated bounded disclosure repeat and assembled synthetic ledger establish
  their narrower request claims. An earlier disclosure interval includes one
  inherited native board-check GET and is not reported as zero requests.
- Chrome's existing writing-options popover did not dismiss on Escape in that
  run; its trigger closed it. This is recorded outside the changed board surface.
- Initial Edge child observations taken before fetching settled are retained;
  only the settled child/Back observations establish their destination claim.

Own test text and changed options were restored. Chrome's normal viewport,
English/light/100% appearance was restored. Raw authenticated screenshots and
URLs stay private; the public examples and screenshots use authored fixtures.
No release, Windows qualification or manager-software-update claim is made.

Installed replay, using an authenticated account and its own accessible supplied
destinations:

1. Export/read the enabled manager source and compare SHA-256 with the frozen
   candidate. Record running browser, OS and manager identities separately.
2. Open a board with real child context, pins and a long title. Start a nonempty
   ordinary reply, change a native form option, and record literal source/target.
3. Toggle About and details with pointer/Enter/Space while measuring row-relative
   bounds, focus, AX expanded state and a fresh bounded request interval.
4. Follow the supplied child then Back; stage/Cancel and Apply/Clear a filter;
   page forward/Back and explicitly check. Compare exact writing after each.
5. Open the supplied title and latest link, inspect the exact resulting post and
   actual focus owner, then switch threads/Back and inspect retained writing.
6. Inspect 320x640/150% Traditional Chinese dark with context/pins/details open;
   record overflow, targets and reachable metadata. Restore test content/options
   and presentation, seal captures and verify the manifest.

After both behavior slices and this integration work were complete, the driving
agent ran the code-review skill's independent Standards and Spec reviews against
fixed production baseline `abb4987`, including this ticket's pending changes.
Standards reported zero actionable findings; Spec reported zero actionable
findings. The reviews accepted the bounded layout/fixture choices and the
explicit inherited cursor distinction. No production correction or new
costly-to-reverse decision was required. The nine synthetic/baseline packages and
the installed package retain their original identities and limits.

The feature-acceptance result is complete at this declared scope: D's production
presentation, composition and affected installed Edge/Chrome journeys are
verified. The individual historical baseline failures, native refusal, incomplete
Chrome long ledger, focus-owner distinction and unaudited screen-reader speech
remain limitations; none is reported as repaired or fully observed. Release
publication, Windows and manager-update qualification remain separate work.

## Acceptance checklist

- [x] Both production slices integrated from `abb4987` without the experimental
      branch or a replacement host/client/workspace.
- [x] Combined complete-application context/control/destination/return journey
      retains exact nonempty local source/options/destination and list semantics,
      without submitting writing or extra effectful requests.
- [x] Combined disclosure, pinned content, arrival status and long-CJK responsive
      geometry/focus/list anchors verified.
- [x] Complete localized theme/contrast/target/forced-colors/narrow150% coverage
      and equivalent-reference desktop density comparison retained.
- [x] Relevant E2Es precede any integration fix; no product fix was necessary.
      Build/static checks and affected regressions pass with failures preserved.
- [x] Same-executable installed Edge and Chrome affected journeys verified at
      the explicitly bounded scope, with source/runtime identity and limitations.
- [x] D1–D11 report maps named cases, exact replays, synthetic screenshots,
      geometry/focus, request observations and verified manifests.
- [x] Final implementation review completed after integration: Standards and
      Spec each report zero actionable findings; distinct trade-offs recorded.
- [x] Final feature-acceptance result records limitations without unverified
      checked criteria; release, deferred Windows/manager-update work and parent
      issue state/body remain outside scope.
