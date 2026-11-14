# Independent Sending replies and deliberate failure recovery — #111

Ticket: [#111](https://github.com/Benson-mk/tsdm-ui/issues/111), under
[#95](https://github.com/Benson-mk/tsdm-ui/issues/95). All eleven criteria are verified at the root-accepted scope: final complete-app
qualification plus installed Edge behavior and complementary isolated process restart.
Chrome is explicitly deferred by the owner to #112.

## Delivered behavior

After strict durable pending acknowledgement, ordinary Send preserves the exact
submitted source, target, options and original actor as an immutable thread-owned
submission, clears only the unchanged submitted input and allows a newer draft.
Sending, confirmed, rejected, moderation and Unknown remain distinct. An independent
per-thread registry preserves operation coordination through newer writing,
navigation, conflict choice and recovery. Qualified result interpretation remains
owned by the unchanged portable forum client.

Failed Retry uses the exact original submission and fresh original-actor authority.
Failed Edit preserves newer intent as a separate recoverable version and uses the
existing explicit version choice. Original actor provenance does not prevent shared
content editing. Check status is read-only. Checked Unknown requires explicit
risk acceptance before one atomic successor can be admitted; the earlier Unknown
remains visible and may still be physically in flight. No automatic replay, timeout
release or exactly-once guarantee is claimed.

The preimplementation failure inventory, full-app reds, advisor evaluation and root
gates are retained in the private delivery. They approve the existing IndexedDB
schema3 row registry, exact observation CAS and narrow historical rejected/not-sent
enrollment. [ADR0001](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md)
and [ADR0003](../adr/0003-use-browser-page-session-recovery.md) record the ownership
and compatibility decision. No public portable interface changes are selected.

## Distinct trade-offs

1. Duplicating exact operation identities/observations outside raw context history
   costs additional storage and schema compatibility work. Raw alternatives remain
   untouched, registry-only rows retain a tombstone, and no pruning policy is added.
2. No timeout or lease expiry releases Unknown automatically. A thread can remain
   held until deliberate checking and recovery, avoiding fabricated absence proof.
3. Exact observation CAS can reject a late real result after another observation.
   The tab retains its evidence visibly unsaved and asks for another qualified Check
   instead of ranking statuses or silently overwriting concurrent evidence.
4. Input clears at acknowledged admission, so a later native preflight refusal can
   leave an empty next draft. The immutable failed snapshot and explicit Retry/Edit
   provide recovery without replacing newer input.
5. Failed Edit always uses retained-version choice, including blank newer source,
   because target, options and attachment intent may still differ. This adds a
   deliberate selection step while preserving both compositions.
6. Checked Unknown succession permits one active coordination lineage while an
   earlier physical request may still exist. It prevents duplicate successors and
   preserves the ancestor but cannot guarantee exactly-once forum publication.
7. Clearing a submitted input creates a fresh undo/editor session while preserving
   mode. Undo cannot bring submitted text into the new draft, and the previous undo
   history remains unavailable except through the immutable source/Edit path.
8. Direct enrollment of unchanged legacy rejected/not-sent observations avoids an
   unnecessary remote check that could turn known historical failure into Unknown.
   It costs strict all-occurrence equality, commit/readback/coherent acknowledgement
   and no reusable outcome authority. Not-sent is invocation-scoped no-dispatch
   evidence from the supported actual110 producer, never global forum absence.
   The same narrow bookkeeping precedes legacy Failed Edit, without actor-gating
   shared content or granting future attachment/publication permission.
9. Recovery actions use one transient workspace-wide busy flag. Different threads
   may own simultaneous sends, but manual Check/Retry/Edit and attachment-check actions wait for another
   recovery action to finish, keeping action feedback and version choice coherent.
10. Immutable source is a read-only copyable textarea rather than an optimistic
    rendered post. This exposes complete BBCode and unsupported source faithfully,
    at the cost of a less post-like preview. Sending never implies confirmation.
11. The installed restart attempted native-exclusion URL containment because HTTP
    interception cannot survive process exit, but those URLs did not persist. The
    restored app had already booted, and neither pending-at-exit nor absence of POSTs
    across that observation gap is established. Qualification combines installed
    preservation/recovery with a separate real isolated Edge process restart that
    observes exact durable pending before app startup. This gives bounded lifecycle
    evidence at the cost of two complementary environments rather than one continuous
    installed trace; it does not relabel the failed containment attempt as passed.
12. Byte-check feedback for a submitted attachment stays in the current tab, so
    reload requires another check. This preserves immutable raw submission history
    without adding persistent inspection state to its durable schema.
13. The result/recovery E2Es observe native durable registry rows alongside public UI.
    This gives exact actor/publication/observation proof but couples those storage
    boundary assertions to the versioned row schema; they remain complete-app
    tests, not internal state mocks.
14. Malformed historical-session fixtures seed their copies from an actually
    observed qualified registry result. This preserves precise corruption coverage
    after completion moves out of raw history, at the cost of setup depending on
    that observed evidence rather than a standalone hand-written example.

The reply fixture worker's three trade-offs are reconciled here: registry schema
coupling is item 13, observed-evidence malformed seeding is item 14, and separate
empty-next-input plus immutable-source assertions are the verification consequence
of item 4, not a second implementation trade-off. The full per-case rationale is in
the private delivery's `replies-reconciliation/notes.md`; retained fixture rationale
is in `retained-reconciliation/111-retained-reconciliation-notes.md`. Both preserve original assertions/results
alongside explicit parent-contract changes.

## Qualification status

The complete-app seam uses emitted production userscript, real Vue workspace,
editor, portable client and native IndexedDB/sessionStorage. External HTTP responses
and explicit browser-host failures are the only substitutions. There are no new
unit tests or internal module mocks. Recorded failures precede production changes.

Dedicated cases cover immutable delayed send/newer writing; genuine tab contention;
failed Retry/Edit; blank-source newer target/options/file intent; original actor;
strict acknowledgement/readback/checkpoint failures; late callback CAS; three-tab
stale-risk succession; independent pending threads; actual110 migration/downgrade;
malformed lineage; legacy all-copy ambiguity and stale-check refusal; localization,
390px layout and duplicate-risk keyboard focus. The final dedicated audit verifies all 52 IDs.

Original affected-suite failures remain preserved. Fixture reconciliation must
retain exact identity, content, request counts and raw evidence while reflecting
explicit #111 changes: input clearing, independent navigation, thread-owned result
registry and original-submission risk Retry. Real production bugs found by those
journeys are fixed separately and replayed; obsolete expectations are not counted
as passing unchanged tests. The sixteen inherited #112 assertions remain unresolved
only where their paths are unchanged; this ticket adds no blanket deferral.

## Final candidate and acceptance mapping

Production userscript SHA-256:
`3f38aee487a947adf19e3f87f42c72e9d0b8fea2084ec6d4018d1fcface0a2ac`.
A fresh offline lockfile install independently reproduced all 36 emitted files.
All 33 portable forum-client artifacts are byte-identical to exact #110; no new
consumer compatibility check is required for an unchanged public artifact.
Pinned runtime: Node 24.22.0, npm 11.21.1, Playwright 1.64.1, macOS arm64 Edge
157.0.4341.46. Installed manager/runtime readback belongs to the root receipt.

| Ticket criterion                                                                                | Verified evidence                                                                                          | Status |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| Acknowledged immutable Sending and independent next draft                                       | `UX111.sending`, `ack-change`, `ack-selection`, `final-preflight`, target/navigation cases                 | [x]    |
| One active per-thread lineage across tabs/recovery; preserve newer writing                      | `other-tab`, `simultaneous`, `late-ancestor`, `legacy-contention`, `independent-threads`                   | [x]    |
| Qualified distinct outcomes; optimistic display is not confirmation                             | `retry`, `unknown`, `moderated-rapid`, source/readback/identity suites                                     | [x]    |
| Deliberate Failed Retry/Edit with explicit recovery of either version                           | `retry`, `edit`, `blank-intent-edit`, legacy Edit for actors 7 and 8                                       | [x]    |
| Unknown Check, risk confirmation and no automatic replay                                        | `unknown`, `late-ancestor`, actual110/reload/second-tab cases                                              | [x]    |
| Original actor/target remain independent of current shared writing                              | `original-actor`, `target-navigation`, `final-preflight-actor`, legacy addressed Retry                     | [x]    |
| Delays/rejection/loss, rapid sends, real tab contention, restart, newer intent and exact counts | 311 final cases including actual isolated pending-process restart; installed restart preservation accepted | [x]    |
| Failed pending acknowledgement keeps recoverable input and sends nothing                        | `pending-refused`, `reservation-readback`, `reservation-checkpoint`, `completion-refused`                  | [x]    |
| Failure-first complete-app seam, real editor/client/storage and repeatable evidence             | Retained inventory, baseline reds, emitted-app receipts, native faults/HTTP fixtures                       | [x]    |
| Relevant E2Es, affected installed checks and retained verifiable artifacts                      | Final synthetic and installed Edge evidence accepted; cleanup verified; Chrome owner-deferred to #112      | [x]    |
| Ownership and nonreply exclusions; compatibility where changed                                  | ADRs, unchanged portable artifacts, existing nonreply policy and original-history boundaries               | [x]    |

All **52 dedicated IDs** have a passed receipt on the final hash, with no missing
IDs in the generated audit. Run `2026-11-14T17-31-04.907Z` and targeted late-ancestor
run `2026-11-14T17-33-39.676Z` form that exact-ID coverage; the original failed
schedule remains preserved. The **95 explicit/conflict/shared reply cases** passed
on the final hash in `2026-11-14T17-36-05.130Z`, including real exact107 migration
and refusal probes with no skipped baseline cases. Final **100 reply cases** passed in `2026-11-14T17-44-42.864Z` and **63 retained-writing
cases** passed in `2026-11-14T17-44-53.046Z`, both on the same final hash. Thus all
**310 dedicated/affected cases** have final-candidate evidence; the inherited J77
private-replacement assertion remains explicitly outside that passing count.

The additional `UX111.process-restart` passed in `2026-11-14T18-26-39.500Z`, bringing
the final total to **311 passing complete-app cases**. A normal awaited isolated
persistent Edge close/relaunch preserved the entire durable row, still pending,
observed from an inert page before app startup with no page-session record. Cold
app recovery preserved exact original and newer meaning, showed Unknown, blocked
Send/Ctrl+Enter and emitted zero restart POSTs. No forced process termination or
production changes were needed. The original 310-case evidence remains unchanged.

## Installed acceptance and cleanup

Root acceptance is recorded in the private delivery's `root-acceptance.json` and
`installed-final/root-installed-acceptance.json`. Full Tampermonkey source readbacks
before and after the owner restart matched the final distributed bytes; the manager's
stale last-modified footer was not used as source identity. The owner treats BETA and
stable as equivalent. Installed checks verified immutable Send, independent newer
source/target/options, real second-tab exclusion, Failed Edit round-trip choice,
original-submission Retry with independent readback, and Unknown recovery after restart.
The installed rejection originated on the preceding a26 candidate; final synthetic
cases separately verify fresh rejection. Existing unchanged OS IME evidence is reused
at #110's recorded scope, without claiming a new IME or manager-update qualification.

The attempted installed startup URL guard failed to persist and the initial debugger
events were truncated. The raw registry changed pending to uncertain at an unknown
time relative to exit; the generic response-interpreter message does not identify
its cause. No claim of zero POSTs spans this unobserved interval. The separately
observed isolated pending-process restart above supplies that bounded lifecycle proof.

Initial no-URL Check activation had no observed effect and remains inconclusive.
Explicit original-thread URL checking first failed closed on a missing fixture GET;
after supplying that exact observed external route, it produced qualified Unknown
mismatch and exposed duplicate-risk controls. Cancelling the risk dialog preserved
source and emitted zero POSTs. Original failed/inconclusive probes remain retained.

Both fixture writers were stopped before exact-whole-row-equality deletion of archived
synthetic rows 42/43. The original row 1269763 remained identical. Because the original
tab was absent after browser restart, a task tab was restored to the preserved original
page-session and URL, with all writing fields identical and editor hidden. The second
task tab was closed and interception cleared. Raw authenticated evidence stays private.
No live forum publication was authorized or intentionally dispatched.

## Reconciliations and limits

- Original submitted input now clears after acknowledgement; assertions check both
  the empty next input and the exact immutable submission. Deliberately typed newer
  input remains exact through callbacks, navigation, checks and reload.
- A fresh native preflight after acknowledgement remains bound to the original
  submission while newer input may change. Pre-ack input/selection changes still
  cancel. Account/conflict/registry changes still block actual dispatch.
- Operational results now live in the independent registry. Tests retain exact
  raw historical observations, allowing only the existing documented recovery
  normalization from pending to uncertain. They check exact immutable publication,
  actor, target, source/options and qualified registry result separately.
- Checked-Unknown Retry submits the original source and preserves the newer draft;
  it does not submit unrelated newer writing under an old risk confirmation.
- The already-completed first mouse click may replace the editor/button node.
  The second-click test targets the actual current control after confirmed first
  completion, retains the gesture detail and verifies one POST and exact source.
- Confirmed original attachment byte checking stays on its immutable submission.
  It requires the original actor and exact confirmed result, never restores upload
  permission or inserts into newer writing.
- An induced replacement-upload checkpoint refusal is proven at the native storage
  boundary and through visible operation failure/zero upload. Once unchanged prior
  intent is acknowledged again, its saved status is truthful; a transient storage
  error need not remain as a false unsaved claim.
- The original late-ancestor schedule can let a stale confirmation preserve a
  competing raw history branch before it observes the successor. One successor and
  exact evidence remain, but existing conflict policy makes writing read-only until
  choice. The corrected isolation types newer input before those confirmations;
  it proves preservation/late-result exclusion, not editing through conflict. The
  exact combined schedule is a mandatory #112 input, with its original failure.
- `J77.public-private-history` now waits on the actual registry boundary and reaches
  the same inherited private-replacement refusal assertion as exact109/110. The
  original private-editor expectation remains unpassed. This does not authorize
  discarding unsettled public history or claim private replacement is delivered.
- The remaining inherited 16 assertion IDs and the two earlier prepared-review link
  cases stay recorded for #112 only where their paths are unchanged. Chrome is not
  inferred from Edge. No live forum publication or upload was performed here.

Initial intermediate receipts preserve source hashes/scenario files/ledgers/images
but do not all preserve complete executable/source pairs. Several later manually
listed source archives omitted `vite.editor-focus.ts`; they remain honestly marked
incomplete. The final Git-scoped source archive includes every relevant tracked or
untracked source, and its clean rebuild reproduces all emitted files. No historical
failure or incomplete archive was relabeled as a final qualification pass.

The incomplete intermediate source archives are exactly
`candidates/legacy-enrollment/source.tar.gz`, `candidates/legacy-controls/source.tar.gz`,
`candidates/fixture-reconciliation/source.tar.gz` and
`candidates/reader-fallback/source.tar.gz`. The later
`reader-fallback/source-complete.tar.gz` corrects the archive inventory without
rewriting those originals. The final replay source is
`candidates/final-3f38aee/source-qualified.tar.gz`, SHA-256
`d2b4f062d13e09d9d4e926ccf4ef5086675bb80d0e084e0669e0062bfd8e858e`,
with `source-qualified-manifest.json`; it contains the exact corrected late-ancestor
fixture (SHA-256 `81f12c1e161a2d5fa04ae27a8473bb8ead3bfb3db47eb2132e4b0cc348b50585`).
Its production sources match the clean-build-verified original final seal exactly.
