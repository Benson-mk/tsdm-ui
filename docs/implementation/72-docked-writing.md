# #72 — one docked or expanded editor

## Premises and failure inventory (before feature code)

Base: integration 7cca5abd7bcaa646fd5a237bab46c24a9cd07ce7. The approved built-userscript E2E seam runs the real layout, writing workspace, editor session, client and browser host; only external HTTP is substituted. The pinned experiment DESIGN.md and sample.html define geometry. Production retains source-first editing, acknowledged page-session recovery, immutable review and explicit approval.

Reachable failures:

- Composer appears above reading, expansion hides history, or grid changes remount the editor.
- A resized/hidden editor loses source, selection, mode, undo/redo, options, attachments or exact target; composition is committed or focus stolen during programmatic transitions.
- Long/localized controls consume history, exceed 46% viewport height, clip actions or shrink target/form floors. Compact/expanded body minima diverge from 64px and 140px (100px below560).
- Plain Enter prepares a write; modifier Enter bypasses validation, triggers during composition/keyCode229/repeat, approves review, or resends pending/uncertain work.
- A saved-draft shortcut calls consequential publishDraft instead of the existing preparation guard.
- Addressed writing silently copies post text or retargets while browsing. Replacement/ordinary-reply controls discard without their existing deliberate guard.
- Layout changes trigger network operations, hide refusal/conflict/financial guidance or lose acknowledged recovery state.

## Planned vertical slices

1. Named IM72 geometry and same-node expectations in writing-presentation E2Es; retain red then dock the existing SourceWriting once under reading in a stable conversation region. Keep both modes bounded and independently scrollable.
2. Named IM72 keyboard expectations for ordinary/addressed/new/edit plus composing/repeat/stale/delayed guards; retain red then route shortcut through the existing reviewPublication entry. Saved drafts retain their existing explicit workflow; no shortcut calls publishDraft.
3. Run affected existing whole-app presentation, reply/edit/draft/review/recovery suites, static/build checks, then parent-owned installed Edge and final BDFL validation.

## Decisions and trade-offs

No portable-client contract change was needed. Native IME and installed manager evidence belongs to the coordinator and is not established by synthetic composition events.

## Delivered behavior and explicit boundaries

A stable conversation region owns its heading, independently scrollable post history and the sole mounted SourceWriting instance. Thread title and contextual controls sit above the history scroller so its minimum height belongs to actual posts rather than being consumed by chrome. Both compact and expanded presentations stay below reading; changing size, reading/writing visibility or pane width preserves the existing editor session. The composer is bounded to 46dvh, uses a separate content scroller, and keeps a 96px reading minimum through an outer short-height scroller. Compact source/visual fields have a 64px minimum; expansion uses 140px and 100px below560. Existing 44px actions and 48px form controls remain. Native host viewport/safe-inset adaptation belongs to #73/#74.

Ctrl/Cmd+Enter in editor fields invokes the current action's preparation entry. Plain Enter remains input. Composition, keyCode229 and repeated keys do not prepare; an existing immutable review is retained by shortcut repetition. A deliberate visible Review click can prepare a fresh review, preserving the existing workflow for rechecking updated native controls. Neither shortcut chooses approval or resend.

Saved drafts now use the same prepared-content renderer and existing transient review slot. Review reads the current saved draft, binds its account/version and checks complete saved source/settings/attachment metadata before freezing the local submission. Local changes must be saved explicitly before review. Separate final approval calls the existing publishDraft path, which independently rechecks current native controls, original attempts, account and saved version before an effect. Existing funding/save/resend/recovery contracts are not replaced. The portable client and recovery schema are unchanged.

The addressed destination has the native exact-post resolver link. Start an ordinary reply calls the existing replacement guard; the original source, independently authored quotes and target remain until the author deliberately decides. No native request is made merely by opening that guard.

## Actual trade-offs

1. Keeping the full existing toolset in a bounded dock makes more reading visible and preserves one editor owner, but long forms require scrolling inside the composer. At short heights the conversation also scrolls to retain its reading minimum; this adds a scroll region instead of clipping controls or hiding history.
2. The fixed reference body minima override textarea row-based sizing. Authors can still resize source fields and use expanded mode, while the surrounding dock remains bounded; expansion increases editable body space rather than taking over the entire workspace.
3. Saved-draft review adds an authoritative read before the original final publication checks. This costs requests and a deliberate confirmation, but avoids a new portable publication API and preserves the original command/uncertainty owner. The existing transient publication slot is reused so editor/account invalidation cannot leave a separate stale draft-review state.
4. Modifier repetition preserves an already prepared review; clicking the visible Review action deliberately refreshes it. This distinguishes an accidental held/repeated shortcut from an explicit recheck without changing immutable approval semantics.
5. The native findpost resolver supplies the exact addressed post on any history page. Following it may need a server redirect/read, instead of assuming the addressed post is on the currently loaded page.
6. Returning to an ordinary reply uses the existing deliberate replacement guard. It does not silently carry quotes/body into a newly addressed context; cancelling retains everything, while explicitly replacing follows the existing blank-new-action behavior.
7. Existing operation controls are relocated into their board or conversation context, leaving one global bar followed by panes. Their actions and labels remain available, but users reach board creation through the board region and thread refresh/save through the conversation. Board and section selectors remain in the Boards drawer; thread operations stay beside the conversation at every width.
8. The conversation heading stays outside the independently scrollable history. This reserves actual post space when the composer expands and keeps thread actions present; a long heading still participates in the outer short-height scroller instead of vanishing with history scroll.
9. Confirmed draft-result navigation carries the immutable original submission context ID through the local workspace callback. The existing result navigation proceeds for that same context, while a historical result against unrelated current writing still requires the existing explicit guard choice. This adds identity information to the internal callback without extending the portable client or bypassing guards for other contexts.

These choices retain the parent's explicit Text size, source-first editor, immutable review and acknowledged page-session recovery adaptations. No native OS IME, installed-manager, live-write or release claim follows from fixture/CDP evidence.

## Evidence so far

All listed synthetic directories contain an authored report, machine receipt, source/build hashes, manifest and scenario snapshots; applicable cases attach screenshots, geometry, retained writing and HTTP ledgers. Earlier failures remain distinct.

- `2026-11-04T09-47-59.688Z`: genuine preimplementation docking red (both widths had writing above reading).
- `2026-11-04T09-49-41.188Z`: first docking green,2/2.
- `2026-11-04T09-51-31.196Z`: genuine shortcut red,4/4 missing review. Later attempts exposed incomplete successful-form fixture controls and a textContent/innerText assertion mismatch; corrected to the established native form contract.
- `2026-11-04T09-55-55.417Z`: genuine saved-draft review red.
- `2026-11-04T10-01-34.421Z`: first complete docking/ordinary shortcuts/draft review green,7/7.
- `2026-11-04T10-03-28.825Z`: exploratory affected regression225/232. It found an obsolete pre-#65 direct-reader width assertion, validation scroll rounding, deliberate primary re-review suppression, and two observations that passed targeted replay. No failure was relabelled.
- `2026-11-04T10-08-34.112Z`: genuine addressed-link red.
- `2026-11-04T11-15-07.155Z`: corrected viewport/continuity10/11; remaining test locator matched both destination and review links and was narrowed to its named group.
- `2026-11-04T11-15-38.605Z`:3/3 saved-draft immutable review, delayed stale revision/account barrier and browser-owned visual composition shortcut.
- `2026-11-04T11-15-53.724Z`: draft publication/funding/attachment/recovery103/104; remaining original moderation warning wording was restored and passed targeted replay.
- `2026-11-04T11-16-26.146Z`:2/2 exact addressed link/guard and modifier-Enter on focused final approval (no effect).
- `2026-11-04T11-18-33.356Z`:54/56; the two prior-attachment cases exposed suppressed deliberate re-review. Primary Review refresh was restored while repeated shortcuts retain the review.
- `2026-11-04T11-19-09.382Z`: short390×360,150% Traditional Chinese geometry/reachability passes.
- `2026-11-04T11-19-55.491Z`:12/12 corrected affected cases, including prior-attachment re-review, all IM72 presentation/keyboard/addressed/short-window journeys.

- `2026-11-04T11-23-43.098Z`: genuine global-chrome red.
- `2026-11-04T11-24-50.025Z`:7/7 contextual placement, shortcut and geometry green.
- `2026-11-04T11-27-10.931Z`:15/15 after accepting #68; compact/short history anchors and preparation priority stay intact.
- `2026-11-04T11-30-01.589Z`: deliberately interrupted exploratory310-case run,52 passed/5 failed/1 interrupted/252 not run. Failures required clicking a redundant Return to writing control while the editor was already visible. Assertions now verify visible retained source directly; this run is not a broad passing claim.
- `2026-11-04T11-33-25.853Z`: genuine actual-post visibility red. A reading-pane height alone concealed that heading chrome left only25.64px of actual post visible.
- `2026-11-04T11-35-05.144Z`:26/26 after separating conversation heading/history; verifies actual visible post>=96px, source continuity, short/enlarged controls, keyboard boundaries, saved-draft review, #68 history anchors and corrected recovery/save journeys. Expanded1440 screenshot was visually inspected and shows opening post content above the retained source editor.

- `2026-11-04T11-38-35.441Z`: complete334-case affected regression,326 passed/8 failed. All #68 and #72 cases passed. Six failures were obsolete Return to writing clicks after the editor was already visible; one needed the now-separate draft approval before exercising the original awaited mention barrier; one measured history top using the old combined heading/history box.
- `2026-11-04T11-44-24.348Z`:10/11 corrected journeys passed, preserving original effect/source/refusal assertions. The mixed journey exposed a remaining9.58px reduction against its existing422px actual-history floor.
- `2026-11-04T11-45-22.837Z`:15/16 after tightening heading padding; the old422px actual-history floor and all #72/#68 affected geometry passed. The mixed journey then reached an exact retained-list Back offset failure881→785. This was subsequently resolved through #66 integration and actual drawer navigation, preserving the exact offset assertion.

Accepted #75 was integrated at f2db895; both its private-message translations and #72 review translations were retained. The feature and earlier own stashes remain recoverable and uncommitted.

## Final integrated candidate

Accepted #66 (`66e879ec6835277c47d7986bda4bec46eac9e4ab`) is integrated, including its `ptid ?? tid` redirect identity handling and generic unknown-thread guard. Its drawer/list ownership remains intact. #72 replaces the old utility row with contextual thread actions and board selectors/creation in Boards, and wraps the sole conversation/editor as the grid item.

The mixed journey now follows visible contextual Back and explicitly opens Threads. Its exact list offset, reading offset, retained source/selection, frozen review and single publication assertions pass. The former reader-box422px budget included the heading; after splitting that owner, the assertion measures the same combined heading/history area and separately asserts at least96px of actual scrollable history. The narrow accepted #66 topbar and contextual actions yielded272px of actual history in the observed390×844 case. Resize geometry journeys now await #66's effective docking attributes before measuring, retaining all existing overflow, viewport and state assertions.

Integration evidence:

- `2026-11-04T12-22-24.528Z`:28/29; all #66 redirects/drawers, #68 anchors and #72 cases passed. Mixed geometry exposed board selectors incorrectly sharing the narrow thread header.
- `2026-11-04T12-23-30.869Z`: selector relocation verified by screenshot; old combined reader-box metric still needed its heading/history owner adjustment.
- `2026-11-04T12-24-32.337Z`: complete mixed journey passes with the original exact list-offset assertion.
- `2026-11-04T12-25-17.550Z`:161/172. Six cases exposed #66 intercepting confirmed draft-result navigation. Five others exposed moved heading lookup, newly explicit thread-switch choice and unsettled resize measurement assumptions.
- `2026-11-04T12-29-17.860Z`:23/24 corrected cases. All prior failures passed; an additional historical-result case correctly required the guard for unrelated current writing. Its journey now explicitly checks retained source, target and unchanged effects before choosing to read the original result.
- **`2026-11-04T12-30-24.921Z`:197/197 final combined built-app Edge cases pass**, covering full writing presentation, prepared review, draft lifecycle/recovery, progressive drawers, native redirects, thread history and Messages.

Final userscript SHA-256: `617cab9af64b580cbc5538a0a0ceff5227c3ef4cc73b833ce8acac2d9a45d213`.

Portable library SHA-256: `0b3d0915ad06285e7eeaf902331e931540b769e895a177f86adfa2674c140e2d`, byte-identical to accepted #66. No portable contract change or new consumer obligation arose.

Typecheck, lint, formatting, complete application/library build and whitespace checks pass. Executable source is frozen at the final run; subsequent changes only update this report. All synthetic run artifacts are retained locally and copied to the integration worktree's ignored evidence/runs directory.

## Scoped acceptance

Installed Edge qualification is sealed in `evidence/runs/72-installed-2026-11-04`: all7 manifested files were independently verified, and the full retained manager source matches frozen `617cab9a…`. At1440×900 the same textarea expands64→140px, the composer is414px (46% viewport), and source/target survive reading another public thread. Plain Enter inserts a newline; Cmd+Enter requires the recovered account/form check and then prepares immutable revision12 with separate Send reply approval. Cancel retains the same editor. Send was never activated.

At390×600 expanded source is100px. Native scrolling exposes real public post text and the Review publication action at y461.09–507.19; textarea identity and exact source including its trailing newline remain intact. The96px raw history contains46.09px sticky controls, leaving about50px of post content. This is a documented readability and extra-scroll cost, not96px of body visibility. Stronger simultaneous-content adaptation remains #74. No extra live public publication, private message, forum draft save or release occurred.

Final BDFL acceptance was received for this exact candidate after review of the sole editor, context controls, shortcut approval boundary, saved-draft account/revision/generation invalidation, independent final command checks and original-context navigation. No material finding remains. The nine recorded trade-offs suffice; the advisor identified no additional distinct one.

All nine ticket criteria are verified at the owner-approved scoped cadence:

- [x] One docked/expanded source/visual session preserves source, mode, selection, undo/redo, browser composition, fields, attachments and target; the reading return entry is retained.
- [x] Reference64/140/100px body minima,46% height budget, scrolling, localization, Text size and action/form floors are verified, with the installed short-window readability cost recorded above.
- [x] Enter remains input; Ctrl/Cmd+Enter prepares the current action, ignores composition/keyCode229/repetition and never approves or resends; final approval remains separate.
- [x] Action/account/destination and exact addressed author/post links remain explicit; blank addressed bodies, independent quotes and deliberate ordinary-reply replacement are preserved.
- [x] Existing advanced tools, guidance, form/account checks, immutable reviews, refusals/conflicts, source, drafts, attachments, finance and original pending/uncertain attempts remain intact without presentation effects.
- [x] Representative reply/addressed/new/edit/draft, refusal, stale/delayed and recovery paths are qualified; ADR0003 acknowledgements remain intact and affected installed focus/reachability checks have begun.
- [x] The pinned design and source-first, Text size/derived Compact, sole-context, immutable-review and operation/account/source/finance adaptations are preserved at this slice's scope.
- [x] Failure inventories and named complete-app E2Es precede feature changes; replayable reports, receipts, identity, manifests and relevant artifacts retain failed runs separately. No after-code unit tests were added.
- [x] Static/build gates, affected installed Edge qualification and final BDFL validation pass; the portable artifact is unchanged, all nine trade-offs are reported and unavailable final-integration evidence remains explicitly deferred.

Browser-engine composition evidence is not complete native OS CJK candidate qualification. Final OS CJK and Chrome remain assigned to #79 under the owner-approved cadence; neither is claimed complete by #72.
