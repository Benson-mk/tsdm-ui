# #109 — Let users choose between conflicting reply drafts

Base: `c6cf001b953bb6553e54796b9e75ce5dcda153da` on integration
`feat/improve-ui-ux`; isolated implementation branch `feat/ui-ux-109`.
Current executable: `d10612a534def6b53150a21e2116ee0f69401af73532411af86e72d6e26f8e54`.
This delivers parent #95 C10 at ordinary-reply scope. All nine ticket criteria are
verified within the approved current qualification scope. Installed Edge acceptance
and the selected 308-case regression union use the exact executable above; this
does not claim completion of parent #95 or the #112 qualification gates.

## Research and accepted gate

Read repository/domain/glossary/ADRs, exact109 and parent context, the107/108
ledgers/advisor decisions, and actual raw validation, parent/checkpoint, queue,
current-actor, immutable attempt, effect and editor ownership code before changes.
Applied `implement-spec`, `tdd`, and `domain-modeling` for the ADR amendment.
The already-approved seam is emitted userscript plus real mounted workspace,
editor, forum client and native IndexedDB/sessionStorage. Only external HTTP and
browser-host boundaries are substituted; no internal mocks or unit tests were added.

The pre-code proposal and failure inventory are
`/private/tmp/tsdm-ui-implementation-95/109-contract-proposal.md` and
`109-failure-inventory.md`. The required gpt-6.1-sol/xhigh advisor evaluated them
using `validate-gpt-code-review`; root accepted all R1–R6 in `109-root-gate.md`
before feature changes. The complete evaluation is `109-advisor-evaluation.md`.
This was the narrow required design gate; general code review remains112.
The first actual two-tab E2E failed only on the absent Continue control on exact
108 executable96af; root separately reproduced baseline native contention in
installed Edge. Neither baseline is109 acceptance.

## Delivered contract

IDB database/version/store remain unchanged. Legacy row schema1 is readable.
A deliberate choice creates schema2 with nonempty current `variants` and separate
`retained` alternatives. All version/parent IDs and raw inert contexts remain exact
when classification changes. Normal writes replace only their own current parent,
deduplicate only current heads and preserve retained alternatives unchanged.
Raw validation covers both lists and their combined unique IDs before any legacy
owner materialization. Older108 refuses schema2 intact; its whole-store validator
can make all durable ordinary recovery unavailable after seeing one newer row.

Choice and explicit retained-version discard compare the complete observed raw row
inside one strict readwrite transaction. Stale choices/confirmations write nothing.
A third edit after commit invalidates sole-current readback. Chosen tombstones are
disclosed no-draft choices, preserve other versions and remain discoverable when no
reply editor is active. Discard requires its separate captured-version confirmation.

The existing save queue owns transient per-thread resolution epochs. Successful
native commit advances the epoch before readback; old captures cannot overwrite
from a newly selected checkpoint or acknowledge skipped work. Exact-before adoption
checks include history and callback/composition ownership. Refusal immediately
captures the latest local slot under its unchanged parent without waiting for a new
event. Clean observers adopt a sole selected head automatically; clean archived
observers do not resurrect their version during a subsequent conflict. Dirty stale
writing creates a competitor even if its source equals an archived alternative.

Explicit stored-version handoff invalidates transient reviews, editor state and byte
capability, normalizes foreign pending/upload/removal observations honestly in the
selected operational descendant, and preserves original immutable submission identity.
Unchosen raw snapshots remain unchanged. Actual originating callbacks retain their
owner and may create a distinct competing observation; statuses are never ranked or
merged. Current actor and attachment provenance follow108 unchanged.

A separate per-thread projection of retained unsettled evidence blocks publication,
including the final existing EffectGuard. It does not disable original read-only
result checks. Unsettled alternatives cannot be discarded; destructive ordinary
current replacement/disposal is refused before losing its evidence, with a native
null-save backstop. Navigation retaining that owner remains possible. Selecting the
owning version and checking its own original result may establish a settled branch
that can then be explicitly disposed. Unknown results remain held; another version's
status is not an override. Attachment outcomes without authoritative checks remain
visibly limited, and108 local-intent removal does not claim remote absence.

Conflict, recoverable alternatives, stale/in-progress resolution, actual storage
refusal, incompatible raw data and unsettled-operation holds are distinct. Actual
page-session capture status is separate from the boolean sole-current draft/effect
acknowledgement, so a conflict does not falsely claim navigation recovery loss.
Buttons, source/details, confirmation/cancel and announced outcomes are keyboard
accessible. Outcome/cancellation focus is restored. All new controls/statuses have
English, simplified Chinese and traditional Chinese wording.

## Failure-first expectations

The original12-case inventory and advisor's11 refinements were recorded before their
production changes. They cover actual simultaneous/three-tab edits; choice and
reload/fresh-tab restore; chosen alternatives/tombstones; exact target/options/source/
file intent; stale row/confirmation and concurrent resolvers; queued source/history
without revision changes; before/after-commit and checkpoint refusal; strict raw and
prior108 compatibility; immutable operation ownership/normalization; retained/current
unsettled-disposal guards; independent threads; keyboard/narrow/enlarged-text states;
and zero choice/disposition publication/upload/server-removal effects. Newly observed
clean-version resurrection, false navigation-loss wording and focus loss received
failing complete-app expectations before correction.

## Distinct actual trade-offs

1. Schema2 distinguishes current heads from recoverable alternatives without a new
   backend or database upgrade. Explicit choices restore automatically, but old
   clients refuse newer rows and may refuse the complete durable read. Session6 and
   the portable forum-client contract remain unchanged.
2. Whole-row comparison makes intent precise and protects third edits/confirmations.
   Any intervening row change conservatively requires reinspection rather than
   guessing which newer state the user meant.
3. Choosing an inert stored version is an explicit operational handoff. Resetting
   transient editor/review/file-byte capability avoids inheriting foreign authority,
   but requires fresh validation or reattachment and resets the selected editor's
   transient undo session. Ordinary no-op observers retain their existing behavior.
4. Alternatives remain until explicit disposition, preserving recoverable content at
   the cost of storage and an additional discoverable comparison/discard surface.
   This is not a permanent archive of every later keystroke; chosen current writing
   still advances linearly under its own parent.
5. The finite unsettled-evidence hold avoids merging historical observations or
   implementing111's operation registry. Each unresolved observation can require its
   own original check, destructive disposal may be refused, and an outcome that the
   forum cannot establish may need native continuation or later111 handling.
6. Transient epochs preserve the existing serialized queue without adding persistent
   resolver authority. They require exact adoption comparison, unsuccessful skipped
   acknowledgements and immediate fresh capture after refusal, including histories
   that change without a revision increment.
7. Bounded native transaction/completion scheduling makes races repeatable at the
   external host seam. It establishes preservation/ordering at those schedules,
   not a performance benchmark or arbitrary timing guarantee; installed observations
   remain separately identified.

8. Target-specific CSS viewport emulation supplied reproducible installed narrow
   layout evidence after a browser-wide override had no measured effect. It
   qualifies responsive layout, not native window resizing or OS accessibility
   scaling; complete-app enlarged-text coverage is separately identified.

Inherited107 durability/eviction/origin limits and108 provenance/byte limits are not
new choices and are not repeated as additional trade-offs. The advisor introduced
no distinct decision beyond the refined first six entries.

## Acceptance and evidence

All nine #109 criteria were checked against the final implementation and evidence:

- [x] Actual tabs and durable parent/checkpoint data distinguish automatic restore
      from incompatible concurrent edits without selecting the latest timestamp.
      `UX109.choose`, `third-before`, `third-after`, `simultaneous-choice`, retained
      reply regressions and the installed two-tab native contention probe verify it.
- [x] Both versions expose exact target/source context; choice preserves the other
      recoverable version until separate explicit disposition. `choose`,
      `disposition`, `target-intent`, `tombstone` and installed selection/edit/reload,
      alternative reselection, cancel equality and exact-version discard verify it.
- [x] Third edits and stale commands cannot overwrite unobserved writing or discard
      the wrong version. `third-before`, `third-after`, `stale-discard`, `epoch`,
      `history-epoch`, `dirty-archived-equality` and `simultaneous-choice` verify the
      native raw rows and retained source/history at the relevant boundaries.
- [x] Ordinary switching restores automatically; conflict, unsaved and incompatible
      record states remain distinct and keyboard accessible. Retained/shared reply
      regressions, `distinct-conflict`, `raw-*`, `choice-*`, `focus`, `narrow` and
      installed keyboard choice/disposition plus clean-tab adoption verify it.
- [x] Submitted identities and unequal observations are not merged or reattributed;
      resolution sends nothing and does not lift unsettled guards. `unsettled`,
      `foreign-pending`, `history-epoch`, target/file-intent assertions and request
      ledgers verify final publication holds, original checks and immutable history.
- [x] Simultaneous edits, conflict reload, delayed notification, intervening edits,
      storage refusal and independent threads retain before/after content evidence.
      The 25 dedicated cases and affected retained/shared reply cases cover these
      complete-app paths; installed evidence supplements the two-tab/reload path.
- [x] Failure inventory, externally observable E2E expectations and advisor/root gate
      precede their feature changes. Actual workspace/editor/storage/forum client
      remain mounted; only HTTP/browser-host boundaries are substituted. No internal
      module mock or after-the-fact unit test was added.
- [x] Relevant complete-app E2Es and affected installed Edge checks passed in the
      current approved qualification scope, with exact identities, screenshots,
      request/native-data evidence, replay and preserved failures. Chrome, actual OS
      IME and final owner visual approval remain explicitly #112-deferred. The two
      inherited Post101 assertions `review.check-published` and
      `review.check-moderation` remain #112-scoped and were not selected or claimed
      as passes. No new deferral was introduced by this ticket.
- [x] Layout/workspace/forum-client/host ownership and non-reply exclusions remain
      intact. All 33 public portable artifacts are byte-identical to final #108;
      there is no public portable contract change, so the conditional consumer
      compatibility rerun is not triggered. ADR0001 and ADR0003 record the seam.

The broad receipt `2026-11-14T14-14-28.895Z` is **304 passed, 1 failed, 3 skipped**,
not a passed run. All 25 dedicated #109 cases passed in it. The three skipped actual
#107 compatibility cases lacked `TSDM_UI_107_BASELINE`; supplying the retained actual
binary produced three passes in `2026-11-14T14-20-21.947Z`. That follow-up also passed
the unchanged fourth geometry assertion that failed in the broad run.

The original geometry failure sampled target width58/scroll116 immediately after
rapid resizing. Its subsequent screenshot already displayed the full-width target.
Exact #108 passed the unchanged assertion three times in
`2026-11-14T14-20-22.199Z`; no stable product overflow was established. A bounded
`expect.poll` now records intermediate and settled viewport/client/scroll geometry
and applies the same <=1px overflow assertion. All four target layout cases passed
three times on final #109 (`2026-11-14T14-22-21.908Z`) and exact #108
(`2026-11-14T14-22-25.355Z`). Both measured equal client/scroll widths:358 at390,
420 at768, and876 at1440. Root accepted this measurement correction; no production
CSS changed. The failed broad receipt and all follow-ups remain separate.

`109-coverage-audit.json` maps every selected case to its passing receipt on exact
d106: **308 distinct cases verified, none remaining**, including 25 new #109 cases.
This is union verification, not a relabeled all-green broad receipt or a claim that
repeat runs add distinct coverage.

A separate locked offline `npm ci` and build from a frozen complete source archive
reproduced all 36 distribution files byte-for-byte. `109-independent-proof.json`
records exact d106, the 33 unchanged portable artifacts, Node24.22.0/npm11.21.1,
source archive SHA256
`545369d1e7add315fd231e7f026b74011dbbf80ed4609303b27ae7495271e545`, and successful
typecheck/lint/format logs. Later source changes affect only the geometry fixture
and this ledger; the final build rechecks the unchanged executable, and final main
checkout typecheck, lint, format and diff whitespace checks are retained separately.

Root accepted installed Edge157.0.4341.46/Tampermonkey core on exact d106 after full
manager source readback (2,411,596 bytes), independently opened tabs, native get-only
contention, exact Unicode/protected source and addressed target/options, keyboard
selection, editing, reload, alternative reselection, discard cancellation/equality,
confirmed discard and clean-tab adoption. Target-specific viewport measured390x844.
No publication/upload/server-removal control was activated. The scoped intercepted
request ledger is not a browser-wide zero-traffic proof. Both task writers stopped
before exact-row cleanup; original thread1269763 raw hash remained
`dc1d0099531a0d3900f4eb89742559d1536068fbc9a7ab9d6ed6683b1eb5c47e`.
No temporary helper, lock or task row remains; d106 stays installed. Complete reports,
including the exact #108 installed baseline, are preserved separately.

## Failure and harness accounting

All original failures are retained. The first missing Continue, missing disposition,
unsettled-guard, strengthened third-edit/clean-archived-resurrection, false generic
navigation-loss and focus assertions failed before their corresponding fixes. The
early count-only postcommit race observation was insufficient and is not final
proof; strengthened exact-source expectations supplied that proof.

Preserved fixture failures include expecting all writing to be unsaved when only
choice failed, a wrong Return label, a missing test import, omission of the original
result candidate URL, and a retarget setup that serialized clean adoption instead of
creating a genuine conflict. Corrections established the intended external states;
passing follow-ups do not erase original outcomes. The broad omitted-baseline skips
and transient geometry failure are accounted for above.

Independent tooling corrections retain the initial nonexistent-working-directory
launch (no command ran), the overbroad comparison that included the application
build manifest instead of only portable artifacts, and a manifest-reader assumption
that did not support installed `files` arrays. Final verification supports both
manifest forms. Installed reports also retain an incomplete transfer detected before
installation, an automatically rejected oversized inline hashing call safely
replaced with a small in-memory hash, an incorrect source locator, an expired
interception after reload and the ineffective browser-wide viewport override. None
is relabeled as a successful product observation.

## Preservation and replay

The delivery package is `/private/tmp/tsdm-ui-109-delivery`. It contains complete final
source/dist archives and hashes, every candidate archive, every original E2E receipt
and attachment, baseline geometry receipts, actual #107/#108 executables, both sealed
installed packages, failure inventories/gates/logs/proofs/audit, independent build
distribution, this ledger and the final patch/commit receipt. Recursive delivery
hashes and original nested manifests are verified without rewriting original data.
The delivery README explains the paths and manifest verification. Evidence is
preserved outside the managed worktree before handoff or later archival.

Replay from extracted `final-source/source.tar.gz` with Node24.22.0/npm11.21.1 and
Edge157.0.4341.46 available. Use `npm ci`, `npm run build`, and compare every output to
`final-source/dist-manifest.json`. From that checkout:

```sh
export TSDM_UI_107_BASELINE=/private/tmp/tsdm-ui-109-delivery/baselines/107.user.js
export TSDM_UI_108_BASELINE=/private/tmp/tsdm-ui-109-delivery/baselines/108.user.js
npm run test:e2e -- tests/e2e/conflicting-replies.spec.ts tests/e2e/retained-replies.spec.ts tests/e2e/shared-replies.spec.ts tests/e2e/replies.spec.ts tests/e2e/private-history.spec.ts tests/e2e/writing-entry.spec.ts tests/e2e/prepared-review.spec.ts --grep-invert 'review.check-published|review.check-moderation'
npm run test:e2e -- tests/e2e/writing-entry.spec.ts --grep 'UX56.target-' --repeat-each=3
npm run typecheck
npm run lint
npm run format:check
```

For an original failing receipt, choose the candidate whose source manifest matches
that receipt and use its preserved test snapshots. Keep the original outcome and any
new replay distinct. Installed replay uses the detailed procedure and exact binary
in `installed-candidate/report.md`; the automated seam does not install a manager.
