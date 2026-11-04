# Progressive drawers — #66

## Failure inventory before implementation

Approved seam: built userscript in Edge, with only external HTTP substituted; existing evidence reporter seals replayable run receipts, manifests, screenshots, geometry and request ledgers. Installed Edge and final BDFL validation remain required.

Reachable failures: shared breakpoint hides both panes; equality docks incorrectly; responsive changes erase manual choices; collapsed panes leave tracks; simultaneous drawers stack; unbounded or translucent surface; missing title/Close or escaped keyboard focus; Escape during composition overwrites deferred intent; inside space/crossing drag/cancelled or nonprimary gestures dismiss; the other pane threshold closes a drawer; board browsing fails to reveal results or changes the reader; selecting a thread bypasses navigation ownership; moving nodes resets nonzero list scroll (documented sample regression), selection or reader anchor; moving/remounting editors loses selection, undo or quote context; narrow/large text overflows. Tests are added before each corresponding feature change. No unit-test layer is added.

The pinned DESIGN/sample and ADR0001–0003 remain authoritative. The sample's known list-scroll reset is a production regression to fix, not accepted parity. No portable client contract change is planned.

## Delivered behavior

One layout-width rule docks Boards at 960px and Threads at 768px, including equality. Independent manual choices survive responsive changes. One retained modal uses the project's existing Reka focus/portal primitive. Vue Teleports move the existing regions between their docked position and the drawer; their scrolling is captured before movement and restored after the modal is actually visible. This timing fixes the sample's documented reset on reparenting. The reader uses its existing stable block anchor across pane-width changes.

The drawer is opaque, named and bounded to `min(340px, viewport − 32px)`, with Close, contained Tab navigation and focus return. Outside dismissal requires a primary outside press and outside click, and cancels on pointer cancellation. Composition Escape does not replace a deferred writing presentation intent. An open drawer closes only when its own pane can dock. Explicit board/list browsing reveals the result in the docked list or replaces Boards with Threads. Actual thread changes close the drawer only after the navigation owner changes the retained reader.

The inherited public `openThread` path retained writing but did not ask before switching threads. At the parent's explicit assignment, this slice adds a workspace-owned pending thread transition. Continue editing preserves the current reader; Keep writing and read thread explicitly retains the complete original writing/target for deliberate return. Nothing submits, saves or discards writing. The confirmation is tied to the retained context id; another context cannot reuse the previous approval. The existing account/source/uncertainty and preparation owners remain unchanged. This does not invent forum draft save for replies or edits.

Narrow navigation's former nonmodal disclosure and duplicate destination picker are replaced by the actual Boards controls. Narrow Back/native/new-thread utilities move with Boards; desktop contextual relocation remains the following composer/integration slice. A new writing context closes the drawer, and preparing a favorite action closes it so its existing confirmation surface remains reachable. Non-board views cannot show the board-only empty-list placeholder over their controls (coordinated with #67).

## Verification ledger

All runs use the pinned Node 24.22.0/npm 11.21.1 and complete built userscript in Edge. Failed runs retain their real statuses and candidate identities.

- `2026-11-04T09-41-29.073Z`: authentic progressive-threshold failure, 959px incorrectly used one track.
- `2026-11-04T09-43-25.037Z`: progressive threshold/manual-choice scenario passed.
- `2026-11-04T09-48-40.486Z`: authentic missing modal drawer failure.
- `2026-11-04T09-50-00.315Z`: selector ambiguity between drawer and nested board headings; scoped to the named heading without weakening the accessibility expectation.
- `2026-11-04T09-51-05.441Z`: authentic initial-focus failure, corrected at the modal's open autofocus lifecycle.
- `2026-11-04T09-51-33.732Z`: authentic outside-dismissal failure before pointer/click tracking.
- `2026-11-04T09-52-03.904Z`: 2/3; gesture handling passed, nonzero list scroll still reset before the modal became visible.
- `2026-11-04T09-53-25.306Z`: modal focus, independent docking, retained node and list-scroll scenario passed after visibility-timed restoration.
- `2026-11-04T09-55-40.014Z`: two synthetic reply fixtures failed the existing complete-native-form contract; hidden-control types and the ordinary option/subject fields were corrected.
- `2026-11-04T09-57-22.784Z` and `2026-11-04T09-58-48.674Z`: retained-reader failure exposed the old narrow board-view CSS hiding the reader. The latter includes before/open/selected geometry showing the zero rectangle rather than an assumed scroll failure.
- `2026-11-04T10-00-21.494Z`: authentic absent thread-change guard failures at 390px and 900px after reader visibility was fixed.
- Two intermediate build attempts were interrupted by shared disk exhaustion (`ENOSPC`); neither is a successful build. The integration driver reclaimed only regenerable dependencies from completed external-consumer temporary directories before the next successful build.
- `2026-11-04T10-08-18.224Z`: 5/5 progressive, modal, gesture, intermediate/narrow board+guard cases.
- `2026-11-04T10-08-51.376Z`: 6/6 existing populated-result continuity, both original IME deferred intents, and three-language/four-theme/twelve-width responsive coverage.
- `2026-11-04T11-14-53.862Z`: 13/21 affected existing journeys. Failures were an overwritten pre-resize reader anchor, nonmodal navigation selectors, the duplicate board placeholder intercepting Saved controls, and the former disclosed-menu-only expanded-writing minimum.
- `2026-11-04T11-18-49.831Z`: 5/6 affected corrections passed. Narrow New search required the normal Boards-opening step because that navigation now lives in the modal Boards region.
- `2026-11-04T11-21-00.414Z`: both Saved widths and narrow deliberate New search passed, 3/3. The updated steps use actual visible controls and retain the original no-extra-search and confirmed synthetic favorite outcome assertions.

The original responsive tests' nonmodal-focus assertions were replaced with the required modal contract. Their populated-result context, retained source, IME deferred intent, language/theme/size and resize coverage remain. Source-writing selection/undo, touch dismissal and final combined-source runs remain in the final qualification below. No portable client contract changed; its conditional external-consumer check is not triggered.

## Actual distinct trade-offs

The parent already records fixed thresholds/narrower reading, separate manual visibility state, explicit result reveal and drawer gesture tracking. This implementation adds:

1. Reuse the existing Reka modal stack and keep its hidden content target mounted, moving the same panes with Vue Teleport. This preserves compatibility with the existing dialog/focus infrastructure and pane identity, at the cost of a retained empty modal target and explicit scroll restoration at the visibility lifecycle.
2. Require an explicit Keep writing and read thread choice for another public thread while any writing context is retained. This preserves acknowledged recovery and uncertain attempts without inventing discard/save behavior, at the cost of one confirmation even for an otherwise blank retained context or a supported redirect that does not declare its destination thread. The pending choice is transient; reloading preserves writing through its existing owner but does not replay the choice.

3. Preserve the list's numeric scroll offset exactly when moving between the 340px drawer and 300px docked region, while the reader separately retains its stable content anchor. This fixes the documented reset and keeps the saved offset, at the cost of a wrapped list row potentially occupying a different fraction of the viewport after its width changes.

## Combined candidate qualification

Integrated `f2db895fd04163d041731cf8cc44591bf60630a0` before final qualification. Conflict resolution retained #68's shared history/anchor ownership and #75's Messages section, native controls, scoped private-list lifecycle and explicit same-section reveal handler. `selectSection` now uses the guarded reveal path for every explicit list selection; passive restoration into an actual thread remains conversation-first.

- `2026-11-04T11-29-56.125Z` verifies the remaining editor backward selection, native undo, exact reply target and outside touch dismissal at a 320px viewport, 2/2, on the preintegration candidate.
- `2026-11-04T11-36-12.791Z` is the integrated affected run, 25/28. It includes the four remaining old-navigation journeys adapted to actual drawer controls (download cancellation, localized notices and two synthetic composition/end-input journeys), Messages reselect/retained reading, history range, enlarged authoring, theme/size/language coverage and shell behavior. Its three failures remain authentic: list offset 430 became 447 during docking, and two board selections moved the reader 18px.
- `2026-11-04T11-38-58.403Z` retains the diagnostic DOM scroll trace. The navigation/history owner correctly restored the reader after its temporary loading row; the drawer then incorrectly reapplied a stale relative anchor. The test-only scroll setter probe was removed after diagnosis.
- Final affected `2026-11-04T11-40-07.206Z` passes 9/9 after correction: the drawer no longer duplicates the navigation/resize reader-restoration owner, and docking restores the saved list offset after reader anchor restoration. All seven #66 scenarios, the pre-existing viewport paragraph invariant and #68's retained loaded-range board journey pass. Other successful cases remain tied to their exact earlier combined candidate, rather than relabelling the 25/28 run as wholly passed.

The first integrated candidate was **`da8da8ca0774c2ed0d963b427a8d98be5f7e6038ea0fd183c90c61f8aacb6e3b`**. Its static/build checks passed; the supplied advisor redirect finding below required a subsequent candidate.

## Advisor redirect correction and affected qualification

The supplied P2 finding was independently confirmed: the public thread-change guard recognized `thread` routes only, while the native board Last reply link uses the already-supported `redirect` route. Complete original source survived, but the explicit choice was skipped before a real 302 traversal. This is a functional acceptance defect, not a new attacker/security model or a reason to alter the forum client.

The shared navigation entry now guards both thread and redirect routes. It uses the same `ptid` then `tid` precedence as existing redirect-remount validation. A supported findpost redirect with no declared thread requires the generic choice; its target is not inferred or fetched first. Known same-thread lastpost/findpost links retain their existing behavior. Per-link interception and fetching first to discover a target were rejected because they would duplicate the shared transition policy or perform the read before the choice.

`2026-11-04T12-06-48.922Z` records authentic failures for lastpost, findpost/ptid and unknown-thread findpost; both known same-thread variants passed. Corrected `2026-11-04T12-07-45.020Z` passes 7/7: all five real-302 variants plus the ordinary intermediate/narrow guarded journeys. Cancel performs no redirect or new read. Confirm follows the existing fetch/document route exactly once and preserves original source and addressed target. The advisor's original unminimized reproduction was also rerun separately without overwriting its failed artifacts: guard visible, Thread 99 absent, zero redirects, three original reads unchanged, source exact. Those diagnostic files are retained locally under `tsdm-advisor-66-redirect-guard-fixed`.

Current corrected userscript SHA-256: **`da885156fe128d199bab0332f5c4af686f30609fe40ad3cab03703c64c8dfc65`**. Typecheck, full build, lint and formatting pass. No executable source changed after this build.

The sealed installed bundle `evidence/runs/66-installed-initial-2026-11-04/` remains evidence for the earlier `da8da8ca…` candidate: 900px Boards modal with docked 300px list; nonzero 350px list offset through 767px close/reopen and 768px docking; Boards remaining open at 959px and closing at 960px; all four 960px manual track choices with no overflow; contained Shift+Tab, Escape focus return and exact retained source. Hidden retained modal DOM nodes are distinguished from visible drawers. The attempted OS input-menu inspection timed out and establishes no native IME result; the deterministic composition cases remain explicitly synthetic. The corrected installed observation below qualifies the changed transition path; final BDFL acceptance is recorded below.

## Corrected installed Edge qualification

The sealed `evidence/runs/66-installed-corrected-2026-11-04/` bundle identifies the current **`da885156…`** build by complete Tampermonkey stored-source comparison after stripping only the manager Last modified suffix. The existing single script was replaced. The six-file manifest retains the exact userscript, bounded request observations, composition trace, outside-dismissal result, screenshot and report.

Actual native board Last reply to another public thread now shows the retained-writing choice before any Fetch/Document request. Continue editing keeps reading and exact unsent source. A subsequent deliberate activation and Keep writing and read thread follows the real redirect, displays the other thread, and retains the original account/action/board/thread and source. The empty pre-choice ledger is nontruncated and establishes no pre-choice Fetch/Document request. The post-confirmation installed ledger is truncated, so it does not establish complete request counts or effect absence after confirmation; DOM observations establish the delivered thread and retained writing, and the complete synthetic real-302 ledger separately verifies the effect contract. Corrected-candidate outside press/click dismissal returns focus to Boards and preserves source. The unchanged layout remains supported by the separately identified initial installed bundle; it is not relabelled as a repeated current-candidate run.

Installed browser composition-engine checks use CDP input through the real editor. Pointer activation ends composition before the click and keeps raw input, matching the owner's accepted #57 interaction. Direct commit without pointer intervention replaces raw syllables with the CJK phrase. Starts, updates, input and pointer/click events are trusted; compositionend is observed as untrusted without inferring why. An initial probe's active-candidate expectation was incorrect under that established contract and is retained separately. This is browser-engine evidence, not actual OS candidate UI evidence. Native OS input-menu inspection timed out; the parent final-candidate CJK qualification remains assigned to #79. All temporary listeners/properties were removed and viewport overrides reset. No send/save, private read or release action occurred.

## Acceptance status

- [x] Independent exact thresholds and all four manual choices, reachable toggles and no empty tracks/overflow are verified in complete-app scenarios.
- [x] One named opaque bounded modal, Close, keyboard containment, composition-safe Escape/focus return and independent docking are verified.
- [x] Outside primary press/click, inside clicks, crossing drags and cancellation semantics are verified; existing deferred IME intents survive.
- [x] Intermediate/narrow board selection reveals results; another-thread selection waits for an explicit retained-writing choice before any new thread GET.
- [x] Final combined candidate's nonzero list scroll, mounted editor/selection/undo, exact addressed target and stable reader anchor are verified after integrating #68 and #75.
- [x] Pinned design, ADRs, original writing/operation/account ownership and approved production adaptations are retained.
- [x] Failure inventory and named built-app E2Es preceded the corresponding feature changes; failing artifacts remain distinct, with no unit-test layer.
- [x] Final combined static/build checks and affected installed Edge source/behavior identity pass. Final BDFL validates corrected candidate `da885156…` with no remaining material finding, including the explicit installed post-confirmation ledger limitation. Chrome is deferred to #79 and is not a passed check. No release or additional live-effect permission is claimed.

Final BDFL adds no distinct implementation trade-off beyond the three recorded above. The installed evidence wording correction changes no runtime behavior. All eight acceptance criteria are verified at the owner-approved Edge cadence and the bounded evidence scope above.
