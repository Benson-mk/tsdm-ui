# Recover local reply drafts after browser restart — #107

Implementation base: `f51a5cba5913cff3a6dd145703ad41f74294a43d`.
The current frozen executable is SHA-256
`6acd65f314e2d0ace75c4db85ca1e69039fca7170bde62f981d15aa4edf3484b`,
2,362,335 bytes. This implements parent #95 C8/C10 at the ordinary-reply scope.
Affected synthetic verification and installed Edge acceptance are complete at the
owner-approved scope. The coordinator accepted the exact6acd candidate after the
second owner-confirmed browser restart on2026-11-14. The first restart source
discrepancy remains explicitly unresolved.
Automatic account activation, conflict choice, one-action send and pending-next-draft
ownership remain #108–111. Chrome is expressly deferred to #112.

## Delivered contract

The browser host retains ordinary replies in origin-scoped IndexedDB, database
`tsdm.workspace.reply-drafts`, version 1, store `threads`. Each thread row contains
schema1 current variants with opaque version/parent identities and an inert writing
context or explicit tombstone. A strict readwrite transaction compares and preserves
heads atomically; request success alone never acknowledges durability. Readback and
schema5 session checkpoint establish current acknowledgement. A retained competitor
is not a sole-current authorization. No automatic conflict winner or eviction exists.

Schema5 extends the existing page-session owner with `replyCheckpoints` and pending
`replyDisposals`; schemas1–4 remain readable. Navigation/nonreply writing remains
page-session scoped. The latest entire session is captured synchronously before
queued work, including immediate navigation/reload. Durable completion checkpoints
that latest snapshot. A successfully committed branch baseline survives a later
readback/checkpoint failure, preventing retry from forking its own source.

Clean single-head updates can be adopted safely. Advisory BroadcastChannel/focus
notifications do not authorize overwrite: transactional reads and final effect
checks remain controlling. Exact capture comparison prevents an old acknowledgement
from marking newer writing/history saved. A retained conflict in another thread
does not block the active thread's exact current acknowledgement. Incompatible
session data is preserved independently of valid durable writing; session reset
cannot clear the durable store. Future DB versions and corrupt rows are refused
without reset/delete fallback.

Conflict pauses source, target, attachment and effect mutations in the workspace,
including delayed preparation and acknowledgement continuations. Complete variants
remain read-only and copyable. Original effects retain their owner and actual outcome
after dispatch. Queued captured descendants may advance their own branch without
erasing competitors. A live observer preserves exact pending status; actual document
recovery turns unsettled operations uncertain. Unequal historical observations of
the same attempt remain separate even if source is identical.

Recursive projection constructs only approved inert fields, including existing
historical private/draft/nonreply attempts already owned by an ordinary context.
Unknown authority/byte keys and unqualified metadata URLs/native attachment or
option names do not enter durable writing. Authored source, including token-like literal text, stays exact.
Only current selected-file intent projects as unavailable `reselect`; original live
bytes remain usable. All historical statuses and immutable actors/targets remain
exact. No automatic forum request is replayed.

The optional portable `EffectGuard` in library 0.25.0 checks captured caller validity
after async native preflight, then synchronously checks validity/account immediately
before publication, upload or effectful attachment-removal GET. It is transient and
never supplies forum authority. An already-dispatched request cannot be recalled.

## Research and failure inventory

Before backend/schema selection, the implementer read repository/domain/ADR context,
inspected the real ownership and native effect boundaries, captured primary MDN and
Tampermonkey documentation, and ran a disposable native IndexedDB capability probe.
The root accepted the mandatory gpt-6.1-sol/xhigh BDFL evaluation using
`validate-gpt-code-review`, including R1–R6, before feature implementation. The selected
file projection addendum was separately accepted before that correction.

The complete preimplementation proposal, primary-source snapshots, manifest, probe,
advisor evaluation and installed-host plan are retained under
`/private/tmp/tsdm-ui-implementation-95/107-*`. The actual approved seam is the emitted
userscript with real workspace/editor/storage/forum client; substitutions are solely
external HTTP and browser-host boundaries. No internal-module mock or isolated
unit-test runner was introduced.

Failure expectations covered empty-session fresh document/process restart; strict
transaction refusal/quota/abort/weak durability; post-commit readback/checkpoint
failure; queued concurrent source; clean/dirty legacy recovery; incompatible schema
and future database; explicit/stale disposal; same-attempt unequal observations;
selected-byte ownership; conflict during preparation/acknowledgement/final preflight;
actual effect completion after conflict; nested authority exclusion; nonreply scope
and current-account copy continuity. Each newly found implementation failure was
recorded before its correction through that same complete-app seam.

## Acceptance mapping

- [x] Mandatory advisor gate and approved storage/ownership design; ADR0001/0003 reconciled.
- [x] Acknowledged versioned host retention and supported installed restart; real strict host checks and second owner-confirmed installed restart passed.
- [x] Legacy coexistence, visible refusal/quota/incompatibility, dual-store crash boundaries without silent deletion.
- [x] Recursive authority/byte exclusion, exact original historical identity and no automatic replay.
- [x] Competing versions preserved with workspace mutation/effect pause and copyable inspection.
- [x] Same-account installed restart and unchanged cross-account safeguards; exact native head/source recovered with empty session and current-account checks retained.
- [x] Actual installed reload/restart/fault/legacy/conflict/corrupt-record observations retained, including the unresolved first restart discrepancy.
- [x] Preimplementation failure inventory and complete-app external-boundary verification.
- [x] Relevant E2Es, static/consumer checks, installed Edge and artifact verification complete; Chrome explicitly deferred to #112.
- [x] Ownership boundaries/nonreply exclusions and external 0.25.0 compatibility; clean consumer passed with unchanged library bytes on final candidate.

## Verification and retained failures

| Receipt                             | Observation                                                                                                                                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-13T16-49-23.795Z`          | 59/59 retained-reply cases passed on a694, including all27 inherited UX106 and32 then-current UX107.                                                                                                                                                |
| `2026-11-13T16-52-11.836Z`          | Delayed preparation/acknowledgement conflict checks and deliberate copy focus/reload passed.                                                                                                                                                        |
| `2026-11-13T16-54-12.573Z`          | Deliberate current-account copy survives focus/reload/fresh independent document with actor8 eligibility and exact original actor7 confirmed history; one deliberate fixture POST only.                                                             |
| `2026-11-13T17-00-48.329Z`          | Final option-control pause and related9-case fault/account/race check passed on e68.                                                                                                                                                                |
| `2026-11-13T17-02-16.938Z`          | All61 retained-reply cases and40 presentation cases passed on e68. Two obsolete cross-thread-prompt fixtures failed; one was interrupted to avoid contaminating root's intended native restart;67 cases did not run.                                |
| `2026-11-13T17-09-36.503Z`          | Failure-first injected native `formhash` option name exposed an authority projection hole on e68. The6acd allowlist correction refuses that record while preserving original session writing; historical authored packet controls remain supported. |
| `2026-11-13T17-12-50.880Z`          | All11 native authority, legacy schema2–4, account/history, session-reset and differing-legacy cases passed on6acd.                                                                                                                                  |
| `2026-11-13T17-13-29.825Z`          | All24 corrected private/history/source-entry fixtures passed6acd.                                                                                                                                                                                   |
| `2026-11-13T17-13-31.492Z`          | 62 remaining writing/presentation/process-restart cases passed6acd;10 older writing.spec assertions failed and were subsequently reconciled below.                                                                                                  |
| `2026-11-14T05-47-52.677Z`          | Exact106 baseline5052:4/11 original writing cases passed;7 failed at old drawer/About/typography/schema expectations. Preserved separately under baseline evidence.                                                                                 |
| `2026-11-14T05-48-37.730Z`          | Reconciled writing fixtures on6acd:9/11 passed;2 narrow composition cases retained source but incorrectly expected Escape to switch the results pane.                                                                                               |
| `2026-11-14T05-49-41.419Z`          | Both remaining cases passed6acd using the actual Threads pane toggle, with original source/account/target/selection and no-effect assertions retained. All11 bounded cases pass across9+2 receipts.                                                 |
| `consumer-2026-11-13T17-01-02.255Z` | Clean external0.25.0 consumer passed old-call compatibility and optional DOM-free guard signatures. Its library output is byte-identical in6acd.                                                                                                    |

Typecheck, lint, formatting and whitespace checks pass. Independent clean locked
installation/rebuild of both e68 and6acd reproduced all36 distribution files
byte-for-byte. The final proof is `107-independent-6acd-proof.json`; source archives,
installation/build logs and exact outputs remain retained. All completed evidence
manifests are checked again before final delivery.

Installed6acd host observations are retained in
`/private/tmp/tsdm-ui-107-installed-6acd/host-faults/report.md`, with a16-file
verified package manifest and exact manager source readback before/after. The
unmodified production userscript used real strict IndexedDB transactions in marked
isolated test namespaces; a temporary document-start helper substituted only host
boundaries. Production storage remained outside that namespace. The helper was
removed and both test tabs closed afterward.

- Delayed completion delivery held saved feedback pending despite a real native
  commit; releasing completion established saved feedback with exact source.
- Induced QuotaExceededError and SecurityError retained live unsaved text and showed
  refusal. An independent tab recovered the prior acknowledged source after quota
  refusal. Clearing refusal restored acknowledgement.
- Concurrent fills produced two heads sharing one parent and distinct versions.
  Both variants and the exact thread/post target survived reload. Both UIs exposed
  conflict, made source read-only, and disabled review, target removal and signature.
- Isolated future schema999 and corrupt schema1 records remained inspectable as exact
  raw data with global incompatibility feedback and retained session source. The
  captured two-head row was restored after the checks.

These host-fault observations are separate from the restart qualification below. Quota,
refusal and delayed-ack states have transcript/host-event evidence without a
screenshot at each earlier moment; conflict/incompatible/corrupt states have
screenshots and text receipts. Tab B's exported176-request buffer contains no POST
but is explicitly truncated and begins after initial load. Tab A was closed before
its buffer was exported. This evidence does not support a complete browser-wide
zero-request claim. No publication, upload, rating or reporting was invoked.
The initial Source-editor checkbox locator failed; subsequent DOM inspection found
the actual button. Sequential edits safely adopted a clean remote head and were
not called conflicts; attempted notification suppression did not isolate all
refresh, and actual simultaneous fills established the conflict observation.

The original production probe remained saved with its exact source, target,
unchecked signature and named reselect intent. `restart-ready.json` captures this
pre-restart state. Manager is Tampermonkey BETA5.6.6242, observed user-agent
Edg/157.0.0.0. Post-restart UAData independently identifies Edge157.0.4341.46,
Chromium157.0.8103.39 and macOS15.6.0. Installed Chrome remains expressly deferred
to112.

Every failed observation remains failed. Early failures include fresh-tab loss,
missing conflict inspection/adoption, publication/upload/removal escaping native
preflight, discarded source returning, hidden incompatible data, lost original
selected-byte capability, and inherited immediate-reload navigation rollback.
Later corrected production failures include aggregate conflicts blocking another
thread, live observation applying restart normalization, unsafe legacy metadata
entering durable content, stale local-attachment controls mutating paused writing,
nonreply acknowledgement falsely depending on durable replies, and enabled native
option controls during conflict. The last native option-name authority case failed
e68 at17:09:36 and passed the bounded6acd whitelist correction. Authored token-like
literal text remains exact.

Fixture-only failures from hidden composers, variant ordering, an injection racing
an existing session writer, obsolete default-source mode, removed reading prompts,
hidden semantic-group geometry and unqualified synthetic native form controls remain
separately retained. Exact106baseline observations establish the inherited UI
assumptions, including source-entry-adjusted checks; see
`107-fixture-reconciliation-notes.md` and `/private/tmp/tsdm-ui-107-baseline-regression`.
The original affected run remains94passed/18failed/1interrupted/111notrun at
`2026-11-13T16-54-32.842Z`; subsequent passes do not relabel it. The baseline browser
launch refused by sandbox remains a tool failure, not product evidence.

Two failed consumer invocations are retained: an obsolete0.24.1 test expectation,
then the actual exported0.24.1/package0.25.0 mismatch corrected before final consumer
verification. The previously qualified native `tsdmapp=json` observation qualifier
was initially omitted by an overstrict URL whitelist; the resulting pre-dispatch
refusals remain failed receipts before correction.

The two inherited saved-result Post101-link assertions remain expressly #112-scoped;
they are not relabeled passing. No general integration review was performed. Final
candidate source archives and exact binaries exist for every build from a1d9fbce
onward, separately from the bounded reconstruction limitation below.

## Replay and evidence scope

Use Node24.22.0/npm11.21.1 and the locked dependencies. Extract a retained candidate
`source.tar.gz` into an empty directory, run `npm ci`, `npm run build`, and compare
`dist/tsdm-ui.user.js` SHA-256 to the archived executable. Run `npx playwright test
 tests/e2e/retained-replies.spec.ts` using installed Edge. Tests use disposable
profiles and offline HTTP fixtures. `UX107.process-restart` actually closes/relaunches
a separate Edge process/profile and verifies empty initial sessionStorage; it is
complete-app synthetic evidence, separate from installed Tampermonkey qualification.
The corrected affected-case audit records197 distinct passing case names across
e68/6acd; all27 UX106 and36 UX107 cases pass. Three obsolete UI87 case names have
explicit passing replacements. The e68-to6acd delta is only the separately verified
native-option projection allowlist; portable library artifacts are identical.
Each E2E receipt preserves exact tests, source/runtime/binary identities, authored
request/screenshot evidence and its observed verdict. The consumer replay instructions
and source are in its own generated evidence package.

Early reconstruction is explicitly bounded. `/private/tmp/tsdm-ui-107-early-reconstruction`
retains 2,253 verified files,82,745,819 bytes, plus
`107-early-evidence-reconstruction.md`. Base5052, core28295 and conflict102cc were
reconstructed and independently rebuilt exactly. Seven other early executable
identities remain unreconstructed; their original receipts, source hashes and test
snapshots are retained, but those intermediate production sources/binaries are not
claimed replayable. This limitation concerns retrospective intermediate evidence;
current/final artifacts retain full source and exact binary.

The immutable preinstalled preservation package at
`/private/tmp/tsdm-ui-107-delivery/preinstalled` contains 8,648 verified files,
367,539,180 bytes, including worktree receipts/candidates, baseline receipts, the
bounded early reconstruction and research logs. Its root manifest verifies exact
coverage, size and SHA-256. This snapshot predates installed acceptance and later
fixture reconciliation; subsequent evidence is retained separately. The original
authenticated session is excluded.

Installed original authenticated session material remains private and must not enter
public evidence. The root's production-namespace fresh-tab/native restart runs are
separate from the isolated native-storage namespace used for induced faults. An
injected quota/refusal is induced-host evidence, never spontaneous OS/disk failure.
Failed installed quit shortcuts and the subsequently timed-out native Dock control
call do not establish browser restart; root explicitly observed no restart from
those attempts. The installed6acd source was read back exactly and reload recovery
retained the root's own source/target/signature and unavailable selected-file intent.
The subsequent `edge://restart` action was rejected by browser URL security policy
with an explicit prohibition on alternate routes to the same action; no workaround
was attempted. The owner subsequently performed manual quit/relaunch twice; only the second
qualified exact-source recovery as described below.
Strict acknowledgement does not promise arbitrary power-loss survival, backup,
protection from eviction/site-data deletion or private-profile lifetime.

## Installed restart acceptance and final preservation

The first owner-confirmed quit/reopen recovered a durable child containing an
unexplained `q` in `[b]qEdge`, compared with the earlier `[b]Edge` receipt. The
parent/head and revision changed. The owner did not confirm typing that character.
The bounded read-only source-path inspection found no recovery source rewrite;
selection plus input could explain the two-revision increment, but event origin
and timing remain unproven. This first exact-source observation remains failed
and unresolved. No speculative production correction was made.

For the second manual restart, the coordinator restored the exact probe through
public UI, waited for saved feedback, hid the editor and captured the native row
immediately before shutdown. After the owner confirmed full quit/reopen, only a
New Tab remained. An independent native-excluded tab had null opener and no
session recovery key. Before application bootstrap, native IndexedDB contained
the identical head `e31f693b-7402-4043-9548-fb1333a7caec`, revision73 and exact source.
The application then recovered exact source, original target/account, unchecked
signature and named unavailable file intent with saved feedback. The scoped
post-native-excluded capture contained166GET/0POST, not truncated and no further
page; this does not claim browser-wide traffic absence. Post-restart Tampermonkey
readback again matched exact6acd. The coordinator accepted installed Edge at the
current scope based on this independently bounded pass, preserving the earlier
unresolved result.

Cleanup restored only the coordinator-owned probe to the original blank reply,
visual editor, checked signature, no file intent and hidden writing, retaining
its target in a replacement tab because the original was closed during restart.
No temporary helper remains. The original private session baseline stays private;
no live publication/upload/rating/report occurred.

The completed28-file installed package is
`/private/tmp/tsdm-ui-107-installed-6acd`, including `restart/replay.md`, both restart
observations, exact userscript and cleanup. Its structured producer manifest is
preserved unchanged as `producer-manifest.json` in the compatible immutable
`/private/tmp/tsdm-ui-107-delivery/installed-final` wrapper. The wrapper also retains
the bounded discrepancy inspection. Earlier immutable `preinstalled`,
`fixture-qualified` and `installed-pre-restart` packages remain unchanged. Final
committed source, commit identity, static logs and acceptance audit are added to
`/private/tmp/tsdm-ui-107-delivery/committed` after the single ticket commit.

## Distinct actual trade-offs

1. Origin-scoped IndexedDB supplies atomic transactions without manager grants;
   content remains forum-origin readable/evictable and does not migrate across a
   changed supported origin.
2. Strict per-edit commits improve acknowledged persistence at async/write overhead;
   exit may precede acknowledgement, so the latest unacknowledged keystroke is not
   promised to survive.
3. Separate page-session navigation/nonreply and durable ordinary stores bound scope
   but require schema5 baselines and explicit non-atomic crash reconciliation.
4. Linear progression retains current heads rather than every old revision; all
   competitors remain without eviction, accepting quota exhaustion and later explicit
   resolution.
5. Conservative authored/history conflict preservation avoids silent inferred merges
   but can require manual recovery for observations a human could reconcile.
6. Advisory notifications plus transactional verification tolerate delayed events at
   the cost of coordination/UI state; native site scripts remain outside cooperation.
7. Ambiguous legacy content keeps both versions rather than preferring the newer
   store; old clients refuse schema5 and ambiguity may need explicit resolution.
8. #107 supplies read-only conflict inspection/pause; #109 completes choice/resume,
   so currently conflicted users must preserve/copy versions meanwhile.
9. Omitting origin-wide persistence permission avoids changing the whole forum's
   storage policy; eviction, deletion and private-profile limits remain explicit.
10. Shared authored meaning excludes incidental live composition/account identity but
    preserves exact historical identity, requiring explicit comparison/projection
    rules rather than hashing the entire context indiscriminately.
11. Already-captured queued descendants and actual owned completions can advance their
    own still-current branch during conflict, retaining latest entered text/outcomes
    without a new head per keystroke; preservation must remain distinct from new
    authorization.
12. Authorization is bounded at final pre-dispatch validity instead of holding
    cross-tab locks through network effects. Later conflict can coexist with an
    already-dispatched immutable operation; stronger unsettled-send coordination is #111.
13. Optional portable EffectGuard closes the demonstrated native-preflight gap at the
    cost of API version/consumer verification, keeping browser storage policy out of
    the forum client and account generation truthful.
14. Installed isolated storage namespaces protect real drafts while making those
    failure observations induced-host evidence, separate from genuine production
    namespace restart.
15. Bounded early evidence reconstruction preserves original outcomes and seven
    explicit replay limitations instead of spending unbounded effort reconstructing
    missing intermediate edits or presenting hashes as replayable artifacts.

16. Fixture reconciliation checks private-writing replacement/cancellation and
    per-thread parked-reply restoration at the current ownership transitions; removed
    reading prompts and same-DOM-across-deactivation claims are no longer asserted.
    Original source, target, history, focus and viewport outcomes remain checked.
    Writing fixtures likewise use the current Settings About section and narrow
    results-pane toggle, and construct actual schema1 shapes without later fields.
17. Source-specific fixture journeys use the actual source-mode controls while
    separately checking default visual focus, accepting extra UI steps to preserve
    meaningful entry-focus and source/visual-selection coverage.
18. Geometry checks measure the visible target strip while retaining semantic identity
    assertions on the accessible hidden group. Checking actual prepared review adds
    a fresh GET, so no-effect and no-extra-read assertions use their appropriate phases.
19. Qualified target-review fixtures omit unsupported ordinary-reply attachment
    controls while keeping literal attachment source exact; five separate retention
    cases continue to verify attachment metadata, without claiming upload eligibility.

The current selected-file projection clarification adds no distinct trade-off beyond
items3/10 and excluded-byte lifetime. Inherited dependency reuse and isolated copies
extend the already-recorded project evidence practice rather than creating a duplicate
trade-off. Existing #106 effect-owner/history decisions are reaffirmed, not counted twice.
