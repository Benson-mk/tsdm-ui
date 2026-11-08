# Compose and resume one reply across footer and wide writing views

Ticket: #87. Base: `c623888d45ac325d103f0e139c21491fcb45fd7b`.

## Research and failure inventory

The existing workspace owns one keyed `SourceWriting` and `PostEditor`, with a writing-owned editor session. Presentation uses visibility rather than remounting. Source/visual history, composition deferral, immutable preparation, account-bound recovery and replacement guards are already implemented. This slice changes presentation at those existing boundaries; no portable or persistence contract is planned.

The owner-confirmed test seam is the complete built application in Edge with only external HTTP substituted. Existing writing-presentation, visual/advanced-editor, prepared-review, recovery and responsive journeys remain the regression foundation. No unit-test seam is introduced.

Reachable failures, enumerated before feature code:

- Compact writing buries input/Review under duplicated context, routine explanations and rich tools; hiding those tools could remove source/media/table access or hide consequential warnings.
- Expanding, minimizing or changing width remounts the editor, loses selection/undo/source or silently retargets the author/thread/quoted post.
- Resume appears in the header, leaves a large empty expanded region, hides the original destination, or disappears when browsing another pane.
- Header Reply duplicates the footer action or prepares the wrong reader destination; guarded replacement is bypassed.
- A wide aside consumes the reader below usable bounds, appears below1440px, changes ownership through teleportation, or retains aside space after minimization.
- Short/narrow/enlarged/keyboard-constrained views clip input, Review, warnings or useful history; scroll regions cannot reveal focused controls.
- Actual source/visual composition is interrupted by presentation actions; Enter implicitly submits, review uses a new reader target, or public/private/account/conflict/recovery protections disappear.

## Verification

All receipts below are under `evidence/runs/`; failures remain failed and earlier candidates keep their original scope. Final offline regression reconciliation is recorded below; terminal advisor validation and actual OS CJK IME qualification are complete. All ten acceptance criteria are verified for final a129; earlier pending states and failed receipts remain historical. Chrome remains deferred to #93.

- Compact/tool baseline red `2026-11-07T00-03-28.649Z`; first green `2026-11-07T00-04-41.366Z`.
- Footer/aside red `2026-11-07T00-05-41.929Z`; source selection, undo and boundary geometry then passed. Resize assertions wait for the browser viewport update rather than sampling an intermediate frame.
- Retained-target mismatch red `2026-11-07T00-07-48.771Z`; source-qualified category red `2026-11-07T00-12-33.909Z`. The fixture was corrected to the previously qualified native category container before asserting category meaning; no board-name guess was introduced.
- Provisional `2059a3189520d282c55c52bd3227c0718a0dfc1723fdd2a846a6858135c39631`, `87-provisional-build-2026-11-07`, passed eight focused cases in `2026-11-07T00-16-22.956Z`. Installed visual inspection identified the inherited duplicate pre-review destination in compact writing.
- The duplicate-context assertion failed after input in `2026-11-07T00-20-54.819Z`. Compact now omits the duplicate and places routine Details after input. Existing independent Recovery details and active recovery status remain prominent.
- Corrected compact candidate `37632a9207d732997f417b2fdd446a5a6c9d1cef2ec3fcf40c1c7472840d9168`, `87-compact-build-2026-11-07`, passed eight focused cases in `2026-11-07T00-23-01.116Z`. Installed Edge found two short-view defects; that installed run is explicitly not a pass for those checks.
- The actual clipped-history and unscrollable resume defects reproduced before repair in `2026-11-07T00-27-32.420Z`: only49.27px of history remained visible at375×420, while enlarged resume content started above its scrollable top. `2026-11-07T00-28-28.165Z` passes both after removing the redundant active-writer Reply entry and using start-aligned, stacked short resume overflow. Assertions use the visible reader intersection and actual descendant rectangles, not clientHeight alone.

Existing full-application journeys are migrated through explicit Expand, Details and the bottom resume surface, preserving their source/target/selection/request assertions. Existing advanced-table and hidden-content readback cases also ignored the retained-writing navigation guard; exact accepted #86 executable `08d027…` reproduced both failures in `2026-11-07T00-17-11.698Z`. Those journeys now explicitly choose Keep writing and read thread before their original independent readback assertions. No production navigation or recovery behavior was changed for a stale test.

### Final candidate and current acceptance evidence

The frozen final candidate is `87-short-build-2026-11-07/tsdm-ui.user.js`, SHA-256 `a129963a34acc0245410c3b68d85bb563f4520d9fe1354a8a82b324a548ec041`, 2,161,355 bytes. All 30 portable `forum-client` files remain byte-identical to accepted #86. No portable contract changed, so no new external-consumer qualification is required.

- `2026-11-07T00-29-14.724Z`: all 43 writing-presentation cases passed on the final candidate, including actual short-view clipping and full scroll reachability.
- `2026-11-07T00-38-51.749Z`: 204 of 205 cases passed across advanced tools, frozen review, private writing, visual editing, entry and presentation; only the mention-drift helper race failed. All 43 presentation cases passed. Replay: `npm run test:e2e -- tests/e2e/advanced-editor.spec.ts tests/e2e/private-writing.spec.ts tests/e2e/prepared-review.spec.ts tests/e2e/visual-editor.spec.ts tests/e2e/writing-entry.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/replies.spec.ts:599 --max-failures=5`.
- `2026-11-07T00-41-57.420Z`: the single mention-drift case passed after the helper wait repair; its original changed UID refusal and zero-publication assertions are unchanged. Replay: `npm run test:e2e -- tests/e2e/replies.spec.ts:599 --max-failures=1`.
- `2026-11-07T00-36-09.610Z`: all 29 selected entry, recovery, failed preparation and keyboard-focus cases passed. Replay: `npm run test:e2e -- tests/e2e/writing-entry.spec.ts tests/e2e/writing.spec.ts -g 'UX56|UX61|short-window-focus|prepare-failure' --max-failures=5`.
- `2026-11-07T00-36-40.947Z`: 52 of 53 targeted secondary journeys passed. The pending draft-save legacy probe failed on its obsolete exact warning expectation; it is not counted as passing. Replay: `npm run test:e2e -- tests/e2e/attachment-authoring.spec.ts tests/e2e/draft-attachments.spec.ts tests/e2e/edit-post.spec.ts tests/e2e/funded-drafts.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/replies.spec.ts -g 'repair-selection|repair-account|integrated-ordinary-upload-copy|review-file-read|image-instruction|draft-upload-recovery|edit-conflict|editor-shared|integrated-packet-upload-copy|balance-server-authority|pending-copy|uncertain-copy|UX60.order-history|J4.reply-current|J4.reply-mentions' --max-failures=6`.
- Typecheck, lint, format and diff checks passed after the test navigation migrations. The production executable has not changed since the final short-view repair build.

The current recovery/account acceptance is supported by passing `UX61.local-recovery`, real quota `UX61.recovery-refusal`, raw-data `UX61.incompatible-recovery`, four `UX61.appearance` variations and both localized refusal cases. These assert complete writing, plain warning visibility outside closed recovery disclosure, refusal preservation and no automatic effects. Four `J5.prepare-failure` cases preserve original account-bound writing after invalid JSON/envelope, network failure or restricted preparation. Passing secondary checks cover six attachment account-observation phases, ordinary and funded text-copy ownership, file-read/account-copy binding, fresh same-account upload recovery, `J5.edit-conflict`, both server-authority balance refusals, `J11.pending-copy` and `J11.uncertain-copy`. Their original request counts, exact source, immutable preparation and uncertainty assertions remain intact.

Final command outputs, source manifest and reproducible build identity are retained in `87-offline-checks-2026-11-07`.

The parent coordinator owns installed evidence in the integration checkout. Earlier installed `2059` checks verified identical source/visual DOM nodes, selection, real Bold/Undo/Redo, width transitions and original target 1270653 while reading 1265238. Installed `37632` verified fresh form/account preparation and immutable original-target review without sending. Its short defects remain failed in that historical scope. Final installed `87-installed-short-2026-11-07` verifies exact final readback/reload and native 375×420 repairs: 96px actual visible history, 64px input, 44px Review, initially reachable author/destination in minimized state, and the mismatch visible after a real wheel scroll. Normal 1119×629 was restored. These earlier scopes did not establish native OS CJK composition; the separate final native qualification below supplies that evidence.

### Legacy journey migrations and preserved failures

Each actual interaction assumption changed by this slice is listed here; the source, review, selection and request outcomes were retained:

1. Rich tools and source/visual mode controls used to be immediately visible. Shared helpers now deliberately expand writing before the named control, including formatting, list/table/media and Undo/Redo operations.
2. Account/form checks, current-account text copy and routine explanation used to be inline. Journeys now open the actual Details disclosure before those controls or explanation assertions.
3. Compact reply current options, including Signature, used to be inline. Journeys now reveal them through Details or expansion before editing them.
4. Retained writing used to be a disclosure/header resume surface. Journeys now assert and operate the bottom resume surface while keeping consequential retained-warning assertions.
5. Compact writing used to repeat the pre-review destination. The old pre-review identity assertion now explicitly expands; the actual prepared-review identity and original target assertions are unchanged.
6. Keyboard Tab from source used to land directly on account checking. It now lands on Details; the journey uses Enter to open it and Tab to reach the same check action.
7. Some advanced saved-readback journeys ignored the already-existing retained-writing navigation guard. They now explicitly choose Keep writing and read thread before the same independent readback assertions. Accepted #86 reproduced representative failures before migration.
8. Asynchronous reply preparation could complete after the helper immediately checked whether Expand was visible. The helper now waits for the visible Expand/Compact control before deciding; this is an interaction wait, not a production delay. The original mention-identity change and zero-publication assertions remain unchanged.
9. A mixed review journey assumed formatting had left writing compact and clicked Expand unconditionally. Its helper now checks whether expansion is needed.

Earlier broad receipts `2026-11-07T00-18-08.839Z`, `2026-11-07T00-23-19.884Z`, `2026-11-07T00-30-43.918Z` and `2026-11-07T00-33-51.262Z` remain failed or incomplete; later targeted passes do not rewrite them. The 161-case run at 00-30 passed 147, failed six and left eight unrun; it is not a wholly passing suite.

The exact accepted #86 executable was temporarily replayed, then final a129 was restored and its hash checked. Baseline receipt `2026-11-07T00-37-31.794Z` reproduces nine failures among ten selected legacy probes: pending reply, pending draft save, three reply-action storage mutations and four reply-comparison storage mutations. Mention-identity drift passed. Replay command: `npm run test:e2e -- tests/e2e/replies.spec.ts tests/e2e/draft-attachments.spec.ts -g 'J5.reply-pending|J4.reply-mention-drift|J5.reply-action-binding|J5.reply-comparison-binding|draft-upload-recovery-pending-save' --max-failures=12`, with the receipt's #86 candidate installed as `dist/tsdm-ui.user.js`.

The two pending-at-reload probes expected older warning strings; observed prominent warnings instead said the response was lost/no send repeated and draft saving may have succeeded/check original attempt. The seven storage-mutation probes displayed the intact original writer and current-account recheck pause rather than their expected rejected record. Their setup mutates session storage before reload; overwrite by the existing recovery save is a possible setup race, not a diagnosed cause or a proven application defect. Those original assertions remain unchanged and failed. They do not count as mutation-rejection coverage. The terminal advisor accepted unchanged recovery ownership plus the passing current UX61 refusal/raw-data/account journeys as adequate coverage for this presentation-only slice. The baseline failures remain failed; they were not counted as passing mutation-rejection evidence.

### Advisor correction: isolated review invalidation

The advisor finding was confirmed: the test migration guarded only `revealWritingTools()` while `Signature.uncheck()` ran unconditionally in the four parameterized `UX59.invalidate` journeys. Historical `2026-11-07T00-38-51.749Z` captured state verifies Signature was false in all four; source/title/category cases had also mutated an option. Their reported passes are retained historically but do not independently establish each named invalidation trigger.

Both actions are now inside the option-only block. Focused replay `2026-11-07T00-47-13.864Z` passes all four cases with the original review removal, revision increment, fresh review and zero-POST assertions intact. Attached state independently confirms Signature remains true for source/title/category and becomes false only for option. Replay: `npm run test:e2e -- tests/e2e/prepared-review.spec.ts -g 'UX59.invalidate-(source|title|category|option):' --max-failures=1`.

`87-advisor-correction-2026-11-07` retains before/after state excerpts with their source artifact paths, correction-specific static command output and current source identities. Earlier offline-check and run packages were not changed. This is a test control-flow correction; production a129 and its prior build/installed scope remain unchanged. No new production design trade-off was introduced. The terminal advisor accepted this four-case correction. Native OS CJK was pending at that review stage and has since passed the separate final qualification below.

### Completed terminal advisor validation

The gpt-6.1-sol/xhigh advisor completed terminal validation using `validate-gpt-code-review` and found no remaining implementation blocker after accepting the isolated four-case correction. Its focused run `2026-11-07T00-47-18.208Z` passed 33/33 cases on exact a129, covering presentation/geometry/retained target, immutable review/account/uncertainty, current public and private recovery failures, and browser composition/no-implicit-send boundaries. Its exact 144-file manifest was verified. No additional distinct trade-offs were identified.

At the offline terminal-review stage, eight criteria were verified and criteria 7 and 10 were held for actual OS CJK. The designated advisor subsequently accepted the native final evidence, verifying all ten criteria for unchanged a129. Browser composition evidence was not substituted for actual OS input.

### Final installed native CJK qualification

`87-installed-native-final-2026-11-07/report.md` and its verified 32-file manifest qualify the unchanged installed a129 with actual macOS Phonetic – Cantonese input in Edge. The user selected that input source and physically typed `nei`; subsequent native key presses generated trusted compositionstart/update/input events in both the source textarea and the existing visual contenteditable. Space converted fresh composition to exactly one `你`. No CDP composition/input synthesis or pasted CJK was used for qualification; CDP supplied passive listeners and read-only observations.

Source composition survived Expand, Compact and minimize/resume with exact text, selection and the same mounted textarea. The retained bottom destination remained thread 1270653 while the reader showed 1265238. Composing Enter did not add a newline or trigger Review/Send. Real Undo removed exactly the last converted character and Redo restored it. Visual composition survived Compact and a fresh conversion; exact source readback preserved the original bold markup and expected suffix. The disposable unsent source was restored afterward, with normal 1119×630 viewport and account-recheck pause retained.

The network receipt records zero requests only from after the first Space conversion through the subsequent presentation, Enter, history, visual-composition and restoration steps; it makes no claim before that cursor. No Review/Send was clicked. Screenshots document marked composing text and conversion, not a standalone native candidate popup. Trusted native starts/updates/input are distinguished from application-generated untrusted compositionend events. Passive listeners and the temporary probe property were removed. The earlier Latin-only probe remains incomplete historical evidence.

The designated advisor accepted this exact native scope and criteria 7 and 10. No production change or additional trade-off was introduced, and Chrome remains deferred to #93.

### Acceptance gate status

- [x] Footer Reply, concise compact context/input/Review and routine Details; consequential warning behavior covered by current refusal/account/conflict journeys.
- [x] Existing rich tools retained and exposed on expansion with distinct names/icons; advanced/source/visual regressions exercise exact source and independent saved readback.
- [x] One mounted editor/session, original author/destination/quote context and exact formatting/source/selection/history retained across presentation, widths and permitted reading.
- [x] Bottom resume releases expanded region, exposes original destination and mismatch, and retains replacement guards.
- [x] Wide placement uses the 1440px threshold plus measured usable fit; otherwise below, protecting reader and preferred writer size.
- [x] Narrow/short input, Review, actual reading history and scroll reachability; current immutable review, account recovery and private/public journeys qualify those boundaries.
- [x] Formatting/selection/resume/original-target/conflict/recovery/CJK-focus/no-implicit-send criterion: automated and installed scopes pass, including actual trusted source/visual OS CJK composition, preserved text/selection/history and composing Enter without implicit review or send.
- [x] Existing ownership, source fidelity, guarded navigation and immutable review retained; no production persistence/API contract change or synthetic runtime data.
- [x] Failures enumerated and named full-app expectations authored before feature changes; red/green receipts and repeatable source/build/manifest evidence retained; no after-code unit tests.
- [x] Final static/build/installed/advisor gate: static/build, affected installed Edge including actual OS CJK, and final designated advisor validation passed. Chrome is explicitly deferred to #93, not passed.

## Distinct actual trade-offs

1. Wide writing requires the measured conversation area to fit the preferred420px writer plus a320px reader (740px), as well as the1440px viewport threshold. A ResizeObserver adds a small presentation-only measurement lifecycle; the writer falls below instead of shrinking its preferred width before #88 supplies manual sizing.
2. The bottom resume bar is a reserved row of the fixed workspace rather than an overlapping overlay. It consumes height across the workspace but cannot cover reading or focused controls; narrow and enlarged content stacks and scrolls from its true top to make the whole retained context reachable.
3. The routine reader-footer Reply entry is hidden while writing is already open, preserving actual short-view history. It returns when writing is minimized; post-specific reply controls and all replacement guards remain available. Starting another ordinary reply may require minimizing first.
4. Compact Details controls the visibility of secondary attachment selection and current form options, while existing selections, errors, unresolved attempts and recovery/account/conflict warnings stay outside that hiding rule. This retains the full original controls with a small local disclosure state; option validation reveals its field even while Details is closed.

Inherited one-editor ownership, rich tools on expansion, source-qualified neutral category fallback, full-app HTTP seam, Edge-first cadence and in-memory presentation decisions are already recorded in #81/#82/#84 and are not new trade-offs here.
