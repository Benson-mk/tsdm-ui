# Deliberate, account-bound Messages peer list

Implements [#75](https://github.com/Benson-mk/tsdm-ui/issues/75) under
[#64](https://github.com/Benson-mk/tsdm-ui/issues/64). This slice exposes private
peer listing and exact native conversation continuation. Private history and
sending remain the later tickets' work.

The design is `Benson-mk/tsdm-ui-experiment` commit
`bd64a5f48989cf33a2830768f07581c7fac07a2a`, `DESIGN.md` and
`docs/design/sample.html`. The root verified that the owner's current local
references match those bytes. The ticket is integrated with the three-region shell at `7cca5ab`: Messages
occupies the 300px list pane and preserves retained forum reading. It retains
the parent's explicit production adaptations: Text size/derived Compact spacing, all three languages,
one writing context, source-first editing, immutable review and acknowledged
browser page-session recovery.

## Native contract and evidence boundaries

Authorized installed Edge observations on 2026-11-04 established the native
private-list destination `home.php?mod=space&do=pm`, active
`filter=privatepm` tab, account header and empty `.emp` state. A controlled
incoming conversation then established one populated `dl#pmlist_<id>` row,
matching profile UID and returned `subop=view&touid=<uid>#last` destination,
`dd.pm_c` preview/date and `newpm` row flag. Authenticated raw captures and
screenshots remain private; no member names, message text, form tokens or raw
captures belong in this report.

The newer native-client source is pinned to
`6d8518167a68d5d7750f5dc7a4aff65f21c14eac`, independently of the older checked-out
client. Its notification repository documents that reading the native list
clears the new-private-message prompt; its `pmlist` API path uses a separate
`seen` operation for that effect. This is source-backed behavior. The observed
header prompt was already zero, so this run does not empirically prove clearing
a nonzero prompt. Conversation unread is the row's `newpm` class, not the
`newpm_avt` decoration present on every X5 row.

The current controlled account has a single-page list and supplied no pager.
The implementation follows only actual safe, same-origin private-list `.pg`
links, retaining their complete URLs and current-page marker. It rejects a
foreign filter, unknown operation, duplicate query or inconsistent current
marker. Multi-page handling is exercised through the existing complete-app HTTP
seam with independently authored native pager structure; installed multi-page
behavior remains unobserved. No messages were manufactured to fill pages, and
no page count or next URL is inferred from peer counts.

The parser preserves native summary text as a preview, never claiming complete
private history. Native delete, ignore, mark-read, send handlers and scripts are
inert. Missing/ambiguous peers or recipient mismatches refuse the complete list
rather than silently dropping rows. Login, challenge, permission, rate limit,
network loss and unconfirmed account remain distinct from an empty list.

## Operation, recovery and compatibility

Opening Messages is passive. Load/Refresh and an offered page are deliberate
reads, with prompt-effect disclosure before loading. Network loss retains
previous peers as stale and requires a deliberate retry. The operation shares
the existing client request sequence and account generation; an old response
cannot replace a newer destination or another account's peers.

Local Back retains the in-memory list. Peer names/previews are excluded from the
single owner's serialized navigation record. Reload shows Messages with a
Load action and performs no private request; this prevents a new document from
showing a prior account's private peers before fresh account confirmation.
Existing writing, uncertain attempts and other schema-2 entries remain intact.
New clients accept existing schema-2 recovery. Older application versions may
reject a record containing the new Messages section and show the existing
incompatible-record recovery path; this is explicit incompatibility, not silent
discard or migration of writing. No durable preference stores private content.

Portable client version **0.17.0** adds `readMessages`, `Messages`, `MessagePeer`
and the `messages` result/destination kind. Structural client implementations
must add the method; exhaustive result consumers must handle the new case.
Generic `readPage` refuses effectful Messages loading. The API remains
serializable and DOM-free. Version 0.16.0 belongs to the independently developed
thread-history contract and must remain in the merged package history.

## Failure-first verification

Approved seam: built userscript, actual Vue layout/workspace/client/browser host,
only external HTTP substituted. No unit tests were added. Failure inventory
covered accidental loading/replay, loss or ambiguous outcome, wrong account,
recipient mismatch, false unread flags, malformed/foreign paging, unsafe native
content, private recovery visibility and localization. Test expectations preceded
the corresponding implementation changes.

| Observation                                                   | Evidence run                        | Result      |
| ------------------------------------------------------------- | ----------------------------------- | ----------- |
| Missing Messages entry after verified app mount               | `2026-11-04T08-45-32.267Z`          | Genuine red |
| Empty deliberate list and passive Back                        | `2026-11-04T08-48-16.813Z`          | Pass        |
| Populated peer contract before implementation                 | `2026-11-04T08-49-21.977Z`          | Genuine red |
| Populated identity, native target, inert preview, unread flag | `2026-11-04T08-50-32.010Z`          | Pass        |
| Private preview serialized on reload                          | `2026-11-04T08-51-41.126Z`          | Genuine red |
| Memory-only peers with passive reload                         | `2026-11-04T08-52-44.215Z`          | Pass        |
| Refusal visibility and strict response recognition            | `2026-11-04T08-53-34.584Z`          | Genuine red |
| Account/refusal/stale completion matrix                       | `2026-11-04T08-56-03.572Z`          | 14 pass     |
| Network loss and deliberate retry                             | `2026-11-04T08-56-58.005Z`          | Pass        |
| Returned pagination before implementation                     | `2026-11-04T08-57-38.974Z`          | Genuine red |
| Completed Messages matrix                                     | `2026-11-04T08-58-56.037Z`          | 16 pass     |
| Existing notices, writing presentation, recovery              | `2026-11-04T08-59-58.117Z`          | 66 pass     |
| Clean packed consumer/declarations                            | `consumer-2026-11-04T09-00-24.234Z` | Pass        |

Two earlier runs (`08-42-19.524Z`, `08-43-10.551Z`) used an external-script
harness that did not mount the application. They are retained as harness
failures, not feature evidence. The first also lost its screenshot at browser
teardown. `08-58-15.109Z` retained an incomplete pager implementation failure;
the corrected run is separate. The first consumer invocation failed an old
0.15.0 assertion; the version-aligned rerun passed. No earlier failure is
relabelled as passing.

Candidate userscript SHA-256:
`de526a62399e525d49b70ccc053afe7f576411734f075a9efaf0db69f99c6143`
(1,819,456 bytes). Node 24.22.0/npm 11.21.1, Playwright 1.64.1, Edge.
Typecheck, lint, formatting and build passed. The existing consumer check passed
an isolated packed install and strict declarations without DOM types. Reports,
receipts, manifests, authored scenarios and screenshots/request ledgers are
retained for each run under `evidence/runs/<run-id>` and copied to the task's
external evidence directory before worktree cleanup.

Replay with the pinned toolchain: `npm run build`,
`npm run test:e2e -- tests/e2e/messages.spec.ts`,
`npm run test:e2e -- tests/e2e/notices.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/recovery-origin.spec.ts`,
and `npm run test:consumer`. Installed checks must compare the manager-stored
source with this candidate and reload one enabled copy. Synthetic success does
not qualify installed host behavior.

## Installed sent-last regression and correction

The first installed candidate `57959fe007e6b6f5512ac86404a9dd569959ae4f119af8c8f58eb96c4aa0b963`
failed the controlled current list after a native reply changed the latest
message direction. The raw post-send response was replayed privately through the
built application; it reproduced the same unavailable-peer result. An authored
minimal outgoing row reproduced the failure in `2026-11-04T09-18-56.458Z`.

The native incoming row styles the peer sender link with `xw1`; the outgoing row
styles the current user's sender **span**, leaving the peer link unstyled. A
one-variable probe adding only that class made the old parser pass. The fix binds
the direct peer profile link by the already established peer UID, same origin and
native path. Exact conversation-recipient checks remain intact. No parser
instrumentation or private fixture remains in committed tests.

The original private response and all 18 authored Messages cases pass on corrected
candidate `70d83c70` in `2026-11-04T09-21-05.625Z` (19 total, including one private
replay). The original-response replay and its authenticated input remain private;
the authored `J75.messages-sent-last-peer` test is independently replayable. The
first installed candidate remains failed. Root confirmed corrected standalone
source `70d83c70` through installed Edge and BDFL validation; sealed installed
evidence is `75-installed-final-2026-11-04`. This correction adds no distinct trade-off beyond
using native identity/structure already recorded below.

## Three-region shell integration

The branch fast-forwarded to integration commit `7cca5ab` before reapplying this
ticket. The retained-reader template from #65 is authoritative. Messages uses
the list pane's existing visibility control, reveals that pane on entry, and
retains the current forum thread and reading offset during Load/Refresh. Private
history remains separately scoped. The new complete-app test first failed on
the hidden pane (`2026-11-04T09-41-16.023Z`) before these adaptations.

The first combined run (`2026-11-04T09-43-25.690Z`) passed 25 cases, including
the new integrated behavior, but exposed a locale test selector coupled to the
old first header button. Selecting the named Settings control repairs that
harness assumption. All 26 Messages/three-region cases then passed in
`2026-11-04T09-45-24.125Z`; the clean packed consumer passed in
`consumer-2026-11-04T09-45-50.838Z`. Typecheck, lint, format and build passed.
The integrated candidate's installed smoke and BDFL delta remain pending.

## Thread-history integration

The branch then fast-forwarded to accepted integration `ad9a1bf` before
reapplying #75. Conflicts were limited to the contract version constants/package
history and adjacent translation entries. Both 0.16.0 history metadata and 0.17.0
Messages contracts are preserved. No additional production behavior changed.

The first combined run (`2026-11-04T11-19-05.311Z`) passed 44 cases but exposed
an obsolete raw-scroll assertion in the Messages integration case. A targeted
probe (`2026-11-04T11-20-18.989Z`) measured the same visible post at 88.453px
before and 88.359px after entry/load, while the reader top changed 46.094px.
This is #68's accepted visible-anchor behavior, not lost reading context. The
subsequent assertion used that visible post; a strict less-than-0.5px threshold
failed on exactly 0.5px integer-scroll rounding (`2026-11-04T11-20-43.518Z`).
The final assertion bounds the same post to one pixel and requires a nonzero
reading position. No diagnostic instrumentation remains in the source or tests.

All 45 Messages, three-region and thread-history Edge cases passed in
`2026-11-04T11-21-20.514Z`. The clean consumer passed in
`consumer-2026-11-04T11-20-48.932Z`; build, typecheck, lint and formatting passed.
Earlier failing receipts remain preserved. The `c1ae266e` candidate then underwent the installed probe below.

## Installed same-destination reveal correction

Installed Edge on `c1ae266e` exposed two additional shell integration gaps before
a private read: a retained reader also rendered the Boards-only empty-list
placeholder inside Messages, and selecting Messages again after collapsing its
list did not reveal the unchanged destination. The complete-app journey first
reproduced the duplicate list ID (`2026-11-04T11-26-58.136Z`), then reproduced
the hidden same-section list after the placeholder fix
(`2026-11-04T11-27-31.119Z`). These are genuine product failures, not fixtures.

The placeholder now requires the Boards section, coordinated with #66/#67's
identical correction. A layout `selectSection` action handles explicit Messages
reselection under the existing writing-composition guard. It reveals the list
and restores visible positions without creating a navigation entry or request.
The normal workspace operation and existing result watcher remain authoritative
for a changed destination. This stays within layout ownership and adds no new
trade-off beyond the already accepted split between layout and workspace.

All 45 combined Edge cases passed in `2026-11-04T11-28-11.714Z`, including the
new duplicate-ID and passive reselection assertions. Build, typecheck, lint and
formatting passed. The public client is unchanged from the clean consumer run
above. Root's corrected installed Edge smoke passed on exact candidate `de526a62`.
The sealed bundle is `75-installed-integrated-corrected-2026-11-04` in the
integration evidence directory. Overview and loaded-list reselection reveal the
single 300px list pane; the controlled real peer and exact native conversation
URL remain intact alongside 10 retained public posts. The ledger contains one
deliberate private-list GET and no POST. Reload exposes no peer/preview and makes
no private-list request. Authenticated content remains private. Final BDFL validation accepted this exact corrected candidate, including the
sealed installed bundle, all ticket criteria and the five distinct trade-offs.

## Actual trade-offs

1. Use pinned newer source and current authorized empty/populated observations
   together. Historical fixtures support interpretation without being presented
   as current deployment proof; this adds an evidence gate before adapter work.
2. Use native HTML/page-JSON list reads instead of the source-only `pmlist` action
   contract. This preserves returned identity/targets and existing client
   authority, at the cost of markup interpretation and disclosed prompt effects.
3. Follow actual returned native pager links through the established pagination
   model. This avoids guessed pages and unnecessary live social activity, while
   retaining the explicit lack of installed multi-page evidence.
4. Keep peer previews in document memory and omit them from recovery snapshots.
   This preserves local Back and account privacy across reload, at the cost of a
   deliberate new list load after reload. Existing writing recovery is retained.
5. Render preview text and native continuation for each peer. This keeps current
   native controls inert and avoids implying complete private history, at the
   cost of leaving history/authoring to their separately specified slices.

## Acceptance status

- [x] Current empty/populated list routes, identity, account and native peer
      destinations observed before adapter code; effect authority is distinguished
      from observation, later history/send capabilities remain separately scoped.
- [x] Shared serializable client operation, route, workspace section and all three
      interface languages implemented.
- [x] Real peer destinations, observed unread markers, controlled returned paging,
      empty/refusal/login/challenge/network and stale-account cases verified.
- [x] Native continuation labels pending integrated private history honestly.
- [x] Failure-first whole-app artifacts and packed-client compatibility verified;
      existing writing and recovery regressions pass.
- [x] Affected exact-source installed Edge checks — corrected integrated
      `de526a62` passed; sealed bundle identified above.
- [x] Completed-slice BDFL validation — exact corrected candidate and final
      sealed installed bundle accepted.

Chrome is deferred to the final integrated ticket under the owner's November 4
instruction. Stable/BETA Tampermonkey are treated equivalently for this task per
the latest owner instruction. No release or full-Messages completion is claimed.
