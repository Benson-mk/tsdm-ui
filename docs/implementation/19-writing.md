# Retain one source writing context

Issue [#19](https://github.com/Benson-mk/tsdm-ui/issues/19): **Retain one source writing context through navigation, refresh and session changes**. Baseline `6ccaee92c8b0016433e2d9e774d1dfd0b1ccf328`, original integration branch `implement/issue-15`; original isolated implementation branch `ticket/19-writing`. The current integrated continuation uses `ticket/19-verification`; its [acceptance audit](19-acceptance.md) controls the historical checkpoints below.

## Plan and confirmed seams

Use the already accepted complete layout → workspace → public forum client → host E2E seam, replacing only external HTTP. Browser storage, history, input and document navigation remain real. The separate public Node consumer remains the library seam. No unit/component layer is added. Named expectations precede each implementation slice. Installed qualification uses macOS Edge then Chrome and official Tampermonkey MCP source loading; actual input and lifecycle observations stay distinct from synthetic evidence.

1. Prepare the ordinary new-thread current form in the forum client, exposing inert serializable source/options/identity. Render complete source editing and explicit one-context replacement choices through the workspace.
2. Extend the existing single page-session record and serialization owner with writing snapshots/revisions and selection. Preserve old navigation records; distinguish missing/incompatible/refused recovery and keep live work on refusal.
3. Preserve original-account work when identity changes or is unconfirmed. Prepare current-account text copying afresh and require deliberate replacement confirmation.
4. Defer view transitions during composition, then qualify keyboard, native CJK input, responsive transitions, remount and installed lifecycle. Existing appearance controls are checked where available; #18 and later editor tickets keep this contract.
5. Complete standards/spec reviews and BDFL validation, verify each criterion, then commit one ticket change.

## Reachable failures and named expectations (before feature code)

- J5.prepare-source: a token with no member identity must not authenticate; wrong board/action, missing source, duplicate required controls, challenge, permission, invalid JSON/envelope and network failure must not produce a fabricated form. Native JSON-preferring HTML fallback is consumed once. Unknown BBCode and existing reference text stay literal; retention performs no POST or forum draft save.
- J5.single-context: opening the same board/action returns without re-preparing; another board cannot replace work before Return or deliberate local discard. Failed replacement preparation preserves original work. Overview/reading navigation unmounts the view without losing context.
- J5.revision-recovery: fast source/title/category/options changes and selected range survive a compatible reload; one record contains navigation plus acknowledged writing revision, never tokens, cookies or file bytes. Older save completion cannot mark newer work acknowledged.
- J5.refusal: real quota exhaustion keeps live edits visible, labels unacknowledged revisions, and offers safe text copying. No fallback or silent history eviction. Invalid/incompatible records are preserved until deliberate reset; earlier navigation-only schema remains compatible.
- J5.tabs-remount: real independent tabs remain separate; opener/browser copies may inherit then diverge without synchronization. Canonical redirect/remount retains writing and exact navigation. Idle/close/restore/browser restart/manager restart/update record actual page-session behavior, never unconditional persistence.
- J11.account-copy: expiry/change/unknown identity pauses sending and retains original text. Fresh preparation plus explicit confirmation copies title/source only; category/options/uploads/ownership are fresh. Cancel retains the sole original context; unresolved attachment references remain visible. Stale preparations cannot replace current-account work.
- J5.ime-selection: composition defers view swaps; keyboard, selection, caret and logical target survive away/return and viewport changes. Synthetic composition events do not establish actual CJK IME acceptance.

## Research and operation choice

Current native ordinary new-thread form was read on macOS Edge on 2026-10-19 without submission. It has POST `postform`, board-bound newthread action, `subject`, complete `message`, category `typeid`, signature/parsing, thread-price and other ordinary posting options. A form token exists independently of identity. Disabled options remain disabled. Specialized rush-reply controls are outside ordinary-thread support. The visible native auto-save restore affordance is unrelated to this application's recovery and was not invoked.

Evaluate page JSON on preparation, retaining the returned current HTML form because structured read metadata alone does not describe authoring controls. Use the existing portable parser and account decoder. No experiment source bytes are adopted; historical form inventory at experiment `c8348e6c4c4aaf0011f174394733be3d580f59e5` is evidence only and checked against the current form. No new dependencies are planned.

## Trade-offs

Actual choices are recorded here as implementation proceeds, once each. Inherited sessionStorage authority, finite synchronous quota, accepted copying/restoration, safe history and evidence costs remain ADR0003 and the prior ledger; they are not counted again.

## Acceptance

All six issue criteria remain unverified until implementation, current evidence and review are complete. No recovery, publication, forum-write or release qualification is claimed by this plan.

## Current form follow-up

A JSON-preferring GET of the same native preparation URL returned HTTP 200 `text/html; charset=utf-8` on 2026-10-19. Its original inert form includes thirteen category choices; the native page's executed replacement widget leaves only its selected option in the live select. The implementation therefore consumes the returned form bytes through the portable parser, not the post-script widget state. Current ordinary options match the historical inventory. No token values, member identifiers or raw authenticated captures are included in this document.

## Actual implementation choices

1. Complete source uses a native textarea in this ticket. It preserves unfamiliar source literally and provides native input/selection behavior; visual conversion and a persistent editor undo history remain the later editor workflow.
2. Current-form preparation requests JSON first and consumes the useful HTML returned by this operation. This preserves native category/options meaning without a duplicate request; it requires maintaining a portable current-form decoder.
3. Expose the known ordinary posting controls with their returned labels, values, choices and disabled state. Specialized rush-reply fields remain outside ordinary-thread preparation; this avoids presenting a partially supported special-thread workflow, while unfamiliar future ordinary controls require explicit decoder qualification.
4. Extend the one record to schema 2 and read validated schema 1 navigation records as writing-null. Unknown records remain intact with inert inspection and deliberate reset, which prevents silent source loss but requires user intervention instead of partial salvage. Older candidate rollback still needs source-copy precautions; it is not a compatible writing downgrade.
5. Keep the selected source range in the same writing snapshot and revision as content/options. This makes refreshed/remounted selection reproducible, while selection changes also serialize a snapshot through the existing finite synchronous record owner.
6. During IME composition retain the view and defer the latest requested view transition until the end event and final input settle. This preserves active input; multiple navigation requests during composition resolve to the latest intent instead of replaying a queue.
7. Account text-copy preparation is transient until deliberate replacement and transfers title/source only. Fresh category/options and no transferred upload ownership make the boundary clear; existing attachment references remain literal and require reattachment or explicit removal.

8. Give the source editor its own scrollable workspace pane and allow focused source to scroll into view. This preserves keyboard access in short windows and keeps navigation controls available; reading and writing use separate scroll positions.
9. Use local application/library version 0.3.0 for the expanded public interfaces. The concurrently integrated #29 result-contract change owns the common unreleased version bump; #19 retains that version and adds its prepared-writing consumer check. Consumers must pin the combined declarations and artifact; no dependency changes or registry publication are involved.
10. Move incomplete #19 work into its own managed worktree so the shared integration branch can accept verified #18/#28/#29 work while actual input/lifecycle gates remain pending. This avoids blocking unrelated completed tickets, at the cost of merging and requalifying their combined tip before #19 completion. The move preserves source/evidence byte-for-byte and does not create an incomplete feature commit.

## Development evidence so far

The first source-preparation RED was `2026-10-19T08-36-15.283Z`; first GREEN `08-39-30.503Z`. Subsequent named REDs preceded recovery, identity/copy, IME deferral, incompatible-record preservation, preparation-account invalidation, delayed-replacement races and short-window focus corrections. The writing file passed 25/25 at `08-53-20.968Z`; its eight images were inspected. The later short-window correction passed all three affected input/recovery cases at `08-56-50.179Z`; all three images were inspected. Existing navigation passed 42/42 at `08-55-17.202Z`. The clean public Node consumer, including serializable prepared writing and secret exclusion without DOM globals, passed at `consumer-2026-10-19T08-55-16.893Z`.

Current-form HTML response and native live-widget category inventories are distinct observations. Synthetic fixture corrections retain their failed runs; the redirect fixture's corrected native table/last-reply structure passed the real302 writing/remount case. No synthetic failure is relabelled an installed defect or hidden by a later targeted pass.

Final complete baseline, combined available appearance/section checks, installed actual input/lifecycle/account checks and completed-work standards/spec/BDFL review remain pending. These intermediate results do not verify all six criteria or authorize a complete commit.

The two updated focus/composition cases passed again at `2026-10-19T09-04-29.934Z`; both settled images were inspected and the eight-file artifact manifest verified. The rapid-resize probe confirmed one root/workspace/header and no page overflow at390/960/1600; the earlier repeated-strip capture is retained as an anomaly rather than silently accepted. No production source changed for that observation. [Acceptance](19-acceptance.md) and [source provenance](19-provenance.md) now separate completed evidence and remaining gates.

The complete writing file passed **30/30** at `2026-10-19T09-09-39.508Z`, including malformed JSON/envelope, network and rate-limit failures during fresh text-copy preparation. Original context/revision remained exact, sending paused, no confirmation appeared and no automatic retry occurred. The ten-image contact sheet was inspected and sixteen-file manifest verified. These tests complete previously enumerated failure checks; they required no production correction. The final combined application baseline is still pending #18 integration.

## Repeated appearance reflow integration

The existing J5.appearance-context case failed after the writing toolbar changed pane geometry (85.53125px drift; repeated focused RED `2026-10-19T10-20-29.932Z`). A geometry probe established that100→70 preserved the original paragraph, but the shorter toolbar revealed the tail of the preceding paragraph. Recapturing the first intersecting block on70→90 chose that preceding paragraph and shifted the intended anchor. The dialog opening alone caused no movement; scroll bounds had room and the first restoration worked. The additional failure-first J5.appearance-new-anchor ensures scrolling after a reflow establishes a new block before further changes. The correction keeps the last restored block only while its pane has not scrolled and its node remains connected.

11. Retain the reading block across consecutive appearance reflows until the pane's scroll position changes. This preserves the intended paragraph when shrinking controls reveals preceding content, at the cost of one small layout-local anchor record per pane. User scrolling or replaced content selects a fresh block; no history, recovery format, network or workspace ownership change is introduced.

## Verified local #18 integration

The isolated branch now starts at verified #18 commit `6584a3febc1ea22afb9b71d598ca015b420d7e79`. Shared integration remains under the #28/#29 merger. A verified pre-merge archive and retained stash preserve the earlier #19 work. Both features were retained across README, workspace, layout and CSS overlaps.

Named E2Es preceded the section/composition, Settings/About, theme/Compact target floors and authored-label localization adaptations. Native labels, choices and literal source remain unchanged in all three interface languages. Valid schema1 section metadata migrates into the sole schema2 record. The writing and appearance files pass **71/71** at `2026-10-19T10-23-13.285Z` (40 writing,31 appearance), with strict typechecking, zero-warning lint and both builds passing. Userscript SHA-256 is `e0952fbb943fc2bd40328d5e7296b92843a7d4b07a64c9b12390b73b7f9a02e9`. All seventeen completed10:xx evidence packages were verified for exact file coverage/bytes/hashes after the focused screenshot follow-up.

All55 images from the71-case run were inspected. The narrow section-overview image contains the previously observed rapid-resize repeated-strip anomaly. The existing case now waits two paint frames and records independent geometry; its focused pass `2026-10-19T10-25-25.367Z` has one root/header, viewport-sized workspace, no page overflow and a clean inspected image. No production correction was inferred from that capture anomaly. The eight-file follow-up manifest verifies.

This remains intermediate evidence. Final #28/#29 integration, the complete application/consumer baseline, exact installed observations and completed-work review are pending. No complete acceptance criterion or release qualification is claimed.

## Verified local #28 integration

Canonical #28 commit `edfcad82c857a945184d6893078a6819ba14d077` is now the isolated branch base. A24-file pre-integration archive and retained stash preserve the prior #19 source; no incomplete writing commit was created. Four additive conflicts retained both forum-client operations/types, download presentation, writing state and guarded navigation cancellation.

The prewritten J8.writing-download expectation reproduced a late binary request after Return to writing at `2026-10-19T10-34-22.607Z`. New-thread preparation already invalidated the request but left a stale download failure on return to reading; its meaningful RED is `10-36-05.980Z`. The earlier two-case run also contains an invalid null-context expectation for newly created writing; that diagnostic is retained, not claimed as a production failure. Both entry cases pass at `10-36-53.952Z` after applying the existing ephemeral-download cancellation when writing becomes visible. The three affected files then pass112/112 at `10-37-35.775Z`; clean combined public consumption passes at `consumer-2026-10-19T10-38-18.413Z`.

J11.download-account-writing-8/guest then reproduced an observed changed/expired actor leaving hidden writing unpaused (RED `10-39-09.161Z`). Download preparation now propagates changed client account generations into the existing workspace/writing observation boundary, retains original writing, and invalidates old-account reader snapshots. A subsequent inherited download expectation caught the lost visible failure explanation; that explanation now remains in the existing unavailable-snapshot alert. The correction retains the expectation; one intermediate run used a misquoted unavailable label and is recorded as a locator diagnostic. All44writing+39download cases pass83/83 at `10-42-18.679Z`. Its57-file manifest verifies; all36images were inspected and five authored saved files independently rehash to the expected55bytes/SHA. Typecheck, lint and both builds pass. Exact current userscript SHA-256: `424a34415f4c10caf8f5b741ff538ebb9a5df226d2dc960cf94b62411b73940e`.

12. Observe writing visibility synchronously within the workspace to apply the existing ephemeral-download cancellation to both first preparation and Return. This covers every actual writing entry without expanding the writing module's callback interface, at the cost of one narrowly scoped reactive observer. Already dispatched requests/saves retain their existing uncertainty; cancellation does not claim rollback. Propagating new account observations and retaining the existing failure explanation restore accepted boundaries without introducing another policy.

Final #29 integration, final complete baseline, exact installed lifecycle/input/account checks and completed-work reviews remain pending. The #28/#29 merger owns the shared integration checkout and browser slot throughout these isolated checks.

## Verified local #29 integration

Canonical #29 `e6dfc2531c958e3d8dcbbe1e66ae654b55d5daff` is now the isolated base. The preceding verified24-file archive and retained stash `cf24f6cc546a73ad3da2e46c98fad9695bfc1c56` preserve writing before integration. Shared integration is unchanged. The browser/source slot was explicitly released to #19 after #29 completion.

Additive conflicts retain Search, downloads, writing, optional source provenance and the common0.3.0 public contract. The new Search/writing expectation failed at `2026-10-19T11-48-20.605Z`; composition and guest/changed-account Search checks failed at `11-49-17.270Z`. The old guarded section implementation still opened a placeholder instead of preparing Search. Restoring #29's Search routing inside the existing writing composition guard makes all five affected cases pass at `11-49-47.644Z`. The section-return expectation now permits the one safe current-form GET, with no implicit POST. Schema1 Search effective/edited/results data migrates intact before sharing schema2 with new writing, without another search, at `11-50-40.142Z`. No new production trade-off was introduced.

The final full baseline, clean combined consumer and exact installed checks follow. Installed observations and completion review are still required; none of the six full criteria is marked complete yet.

## Full-baseline account-state correction

The first combined baseline `2026-10-19T11-52-08.690Z` passed248/249. Its inherited adjacent Search pager account-change case exposed a stale unavailable-snapshot flag after safely retaining criteria for the newly observed account. The additional failure-first `J11.search-refresh-writing` failed at `11-54-20.481Z`, proving the same stale flag accompanied a successful fresh current-account form. Clearing that flag when a valid fresh result or safely retained Search context is installed corrects both; seven affected pager/Search/writing/download-account cases pass at `11-54-46.443Z`. Old-account snapshots still invalidate, original writing still pauses, and no request is repeated. This is a state correction, with no new policy or trade-off. The failed baseline is retained unchanged; a complete replacement baseline follows.

## Frozen combined baseline

The complete combined application suite passes **250/250** at `2026-10-19T11-55-35.052Z`, including50 writing cases. Typecheck, zero-warning lint, formatting, app/library build and diff checks pass. The clean external consumer passes at `consumer-2026-10-19T11-52-09.850Z`; all public-library bytes are independently unchanged by the subsequent workspace-only correction. All173 baseline images were inspected and the219-file manifest verified. The earlier248/249 baseline and focused RED/GREEN artifacts remain intact.

Frozen version0.3.0 candidate:809693bytes, SHA-256 `c855ad44a4708c5afa03fdd39ab254362e468dea4e39e3423e647dd47b0969cc`, based on verified#29 `e6dfc2531c958e3d8dcbbe1e66ae654b55d5daff`. The private35-file candidate archive includes source, tests, docs, app/library artifacts, patch and receipt.

Installed verification has started in macOS Edge using the official MCP after user pairing. The prior#29 source was backed up and independently hashed; the new official source readback is byte-exact, and the one executing userscript contains the exact candidate. Current-form controls, rapid edits/reload and all five section returns have passed initial installed checks. These partial observations do not complete the required lifecycle, account, native-input, Chrome or review gates. All six full acceptance criteria remain unchecked.

13. Use the retained schema2-compatible `bb575bb67117` predecessor for a real differently hashed app-replacement rehearsal. This checks actual source replacement and recovery compatibility without inventing an artificial update, at the cost of temporarily installing a predecessor with the already documented Search unavailable-flag defect. The bounded rehearsal exercised retained writing only; final `c855ad44a470` was immediately restored and independently verified. It does not count as a manager software update.

## Completed-review failure inventory before corrections

Review failure inventory before any production correction:

1. A fresh guest or changed-member account observation is lost when Return to writing cancels the awaiting check.
2. The same observation is lost when the cancelled action was preparing a text copy; cancellation must still suppress its copy confirmation.
3. Accepted account invalidation affects only in-memory navigation, allowing old-account results to revive after reload. Exercise settled and cancelled check/copy paths for both guest and different member.
4. A stale superseded response must not reverse a newer account observation or revive a copy. Existing J11.stale-preparation is the control.
5. Invalidation persistence must preserve the exact original writing identity/revision/source/options/account and use the existing acknowledged owner, without new requests on reload.
6. Any portable attachment-reference extraction must remain usable through the public package without Vue/DOM, preserve literal source, deduplicate references, respect known uploaded IDs, and retain the existing visible unresolved warning. The public consumer seam and application reference cases will qualify this if advisor validates the boundary finding.

## Completed-review corrections

Standards and Spec reviews, independently validated by the advisor, confirmed attachment meaning in Vue and two account-observation lifecycle defects. Eight new full-application cases failed against unchanged c855 at `2026-10-19T16-12-39.004Z`: cancelled check/copy dropped an accepted account observation; settled check/copy invalidated reading only in memory. Both guest and different-member variants reproduced. The public-consumer expectation also failed before production changes because the portable reference operation was absent.

Accepted non-stale observations now propagate before local view/copy cancellation, while stale responses remain excluded. Only actual navigation-record invalidation triggers persistence through the existing owner; original writing remains untouched. Attachment analysis now belongs to the public portable client and is derived through writing/workspace, with Vue retaining translated rendering.

14. Expose one small pure public attachment-reference operation. This makes the accepted source semantics reusable outside Vue at the cost of a maintained public export/declaration. It keeps the existing bounded syntax and does not infer server ownership, add a full parser or persist derived state. Account ordering and persistence corrections restore existing guarantees without new product policy.

The completed correction passes16/16 affected E2Es, the clean public consumer, and258/258 full application E2Es. Standards, Spec and advisor delta reviews confirm all three code findings resolved. Exact f36 installed correction cases pass8/8 in Edge and8/8 in Chrome, using authored external HTTP responses with unchanged installed code and real storage. All189 baseline and39 installed-delta screenshots were inspected; manifests verify243 and105 files respectively. See the current acceptance audit for the remaining explicit qualification gaps.

15. Bound the new candidate's installed rerun to the changed account-observation/persistence/reference behavior, while retaining exact c855 identity for prior native input and disruptive lifecycle evidence. This avoids repeating the user's completed sign-outs, account switches, IME entries and browser quits, at the cost of leaving final-candidate lifecycle/native-input qualification incomplete. It is not a waiver: those acceptance rows stay unchecked and a local commit requires explicit user approval. Controlled response delays give repeatable cancellation coverage without changing real forum login; their receipts identify the external substitution.

## Integrated verification continuation — 2026-10-21

The [current acceptance audit](19-acceptance.md) and [installed report](19-installed-integrated/report.md) describe the continuation on `2091d671d2cbab34ed6f9050554238007c8d1044`. Original implementation commit `3eda353b66ddabc032cfc9de92ac2fb8194c93dd` and its approved unchecked AC4/AC6 remain historical. New observations qualify only integrated candidate `fdcdb05289d30032cae26aad01bd67b37be7af6d6e66edaba845792fc4bc3e81`; no production or test edits were needed. The new failure inventory preceded the installed operations and retained wrong-identity, rapid-save, hidden-view, idle, tab-copy/divergence, native restore, redirect, quota/refusal, incompatible-schema, appearance/IME and cleanup failures as explicit cases.

The continuation’s distinct actual trade-offs are:

16. Keep the already installed integrated #31 candidate for #19 instead of rolling back f36. This avoids disrupting parallel work and exercises current notice integration, while limiting every new result to fdc bytes rather than qualifying f36.
17. Use a separate owned continuation checkout. This preserves the original clean implementation checkout/commit and avoids editing another chat’s work or rewriting history, at the cost of another checkout and separately scoped evidence commit.
18. Use twelve appearance cases per browser. They cover every theme/language pair, four text sizes, three measured widths and Compact transitions while bounding repetition; this does not establish the exhaustive interaction cross-product.
19. Use human native controls when automation collides with another active profile or protected work. This preserves actual browser copy/reopen/lifecycle semantics and avoids unrelated-window actions, at the cost of operator participation and limited unattended repeatability.

The public package preserves failed/inconclusive interpretations and private-evidence limits. It does not add a recovery fallback, cross-tab synchronization or durable-draft promise. Current lifecycle/review/commit disposition is recorded in the acceptance audit, avoiding any reinterpretation of earlier historical checkpoints.
