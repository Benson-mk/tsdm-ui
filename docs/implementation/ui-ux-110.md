# #110 — Send ordinary replies explicitly with mode-aware keyboard shortcuts

Base: `40ed281c97420faa70921db0bdaded14d5b8c49a` on integration
`feat/improve-ui-ux`; isolated implementation branch `feat/ui-ux-110`.
Production executable:
`b2f16e8fd1e7f12854c511c2775927bc094f5aca3bf6b4f22f578b815e7bd4ce`.
This delivers parent #95 C4/C5 at ordinary-reply scope; it does not deliver
#111's next-draft or unsettled-send registry or complete parent #95.

## Research and accepted scope

Read repository/domain/glossary/qualification and ownership ADRs, exact #110 and
parent scope, prior #107–109 ledgers, actual editor/workspace publication and
native recovery boundaries before changes. Applied implement-spec and tdd;
diagnosing-bugs for visual post-composition Enter and domain-modeling for the
required ADR policy amendment. Proposal and failure inventory preceded feature
code: `110-contract-proposal.md`, `110-failure-inventory.md`, `110-scope-note.md`
and root acceptance `110-root-gate.md`, preserved in the delivery.

Root accepted bounded reversible orchestration without a new durable schema or
public portable contract; no new costly decision or advisor gate was selected.
General review remains the parent's final #112 stage. Testing uses the emitted
userscript, real mounted application/editor/workspace/forum client and native
storage. Only external HTTP/browser-host boundaries are substituted. No unit tests,
internal mocks, live forum mutations or new compatibility deferrals were added.

## Delivered behavior

Ordinary Send captures the complete current operation before awaiting fresh
preparation. It consumes only its own accepted publication while the initial
actor/context/generation remains current, then uses existing acknowledged-pending,
one-use command and final EffectGuard publication. Changed source, target, options,
selection, identity or ownership cannot inherit activation. Unknown current actor
triggers a check and asks for a fresh deliberate Send after identity is established.
The synchronous transient latch and native multi-click/repeat filtering reject
concurrent duplicate activation. Checked uncertain results retain the existing
explicit duplicate-risk gate, now truthfully labeled accept-and-send.

Visual unmodified Enter sends; visual Shift+Enter inserts a represented newline
through the existing source-faithful editor command. Source Enter remains native
newline and Ctrl/Cmd+Enter sends. Shortcut ownership is restricted to actual editor
surfaces; tool/dialog/menu keys do not bubble into an ordinary root Send handler.
Native composition/isComposing/keyCode229 and the existing settling guard exclude
confirmation keys. Visual confirmation immediately after compositionend is also
consumed before ProseMirror's base Enter can add an unwanted paragraph.

The primary action is Send with an accessible Send reply name and paper-plane
icon. Current-mode localized guidance appears in compact tools/expanded mode and
input description, alongside required-source errors. Optional inert Preview remains
source-faithful. New-thread/edit/draft/private/red-packet policy is unchanged.
ADR0001 explicitly reconciles #95/#110's ordinary policy with #52/#59's earlier
mandatory prepared-content review. No storage or portable interface changed.

## Distinct actual trade-offs

1. One ordinary Send removes mandatory content inspection and second confirmation.
   Users may inspect the optional inert Preview; excluded workflows retain their
   existing review policy.
2. Binding the complete canonical context conservatively cancels an activation even
   after selection-only changes. A fresh deliberate Send is required instead of
   deciding which revision differences are harmless.
3. An unverified actor check cannot inherit the original activation. Restored writing
   may require a current-account check followed by a fresh Send; this preserves
   explicit authority and prevents a newly discovered account from silently sending.
4. A workspace-wide transient in-flight latch suppresses further activations until
   orchestration finishes. It queues no attempt and introduces none of #111's
   concurrent-send/next-draft lifecycle.
5. The existing 30ms composition settling guard consumes a visual confirmation Enter
   and can briefly suppress a deliberate Enter immediately following confirmation.
6. Visual Shift+Enter uses the represented newline within the existing structure,
   preserving exact BBCode instead of applying browser paragraph/list splitting.
7. Checked-uncertain explicit duplicate-risk acceptance directly sends rather than
   opening an intermediate review. Clear action wording preserves the deliberate
   risk gate and immutable original-attempt checks.
8. Regression fixtures move old two-step UI timing windows to bounded external
   HTTP/storage gates. This yields repeatable ordering evidence for those schedules;
   it does not establish arbitrary-timing or live-forum guarantees. Installed
   qualification also substitutes only external responses and rejects unexpected
   routes; result observations qualify application handling, not live forum effects.

9. Mode guidance reuses the existing bounded tools scroller. Expanded narrow
   layouts with long history can initially clip the hint after focus/resize;
   ordinary scrolling exposes it. It is visible and accessible but not pinned,
   avoiding another permanent strip while retaining the existing nested-scroll
   limitation for the parent's final layout qualification.

10. Installed cleanup removes only archived synthetic rows under whole-row equality
    and retains the original writing. Ordinary recovery/navigation metadata advances
    rather than restoring an obsolete whole-session snapshot, so cleanup preserves
    the original draft but does not promise identical session bytes. The qualified
    candidate remains installed and the user's selected IME remains selected.

Inherited recovery/provenance/uncertainty constraints are not new trade-offs. No
advisor added a distinct decision. Installed qualification choices, if any, are
recorded separately when confirmed by the coordinator.

## Acceptance audit

- [x] Ordinary one-action Send freshly prepares and publishes with optional Preview;
      excluded workflows retain their existing policies. Dedicated explicit-reply
      and reconciled authoring/review E2Es exercise both paths.
- [x] Submitted source/revision, target, options and current actor are captured at
      activation. Delayed source/options/selection/target/thread/account cases prove
      zero stale dispatch and exact deliberate later content.
- [x] Existing permission/form/account, conversion, one-use, attachment and durable
      pending safeguards remain. Refused pending storage, rapid/fast double-click,
      delayed final-preflight and unresolved/lost-attachment cases verify boundaries.
- [x] Both source modes and genuine installed IME confirmation are qualified.
      Exactb2f1native Cantonese IME confirmation yields trusted composing keyCode229
      Enter with exact你好, no newline and no request in both editors. Source/
      visual key and post-composition ordering cases also pass.
- [x] Accessible localized current-mode hints accompany compact/expanded inputs and
      validation. Actual menu/settings/tool inputs cannot send the retained reply.
      The390x844two-history case verifies complete hint intersection with every
      clipping ancestor after public scrolling, plus exact source/description and
      zero additional effects; it does not claim perpetual visibility.
- [x] Preview remains optional/inert/source-faithful. ADR0001 explicitly records the
      superseded ordinary mandatory-review policy and preserved excluded policies.
- [x] Exact POST content/target/actor, duplicate activation, changed native evidence,
      delayed preparation, source modes and genuine installed IME are verified.
      Existing uncertainty remains recoverable before #111 enhancement, including
      installed explicit duplicate-risk recovery after an external fixture error.
- [x] Failure inventories and externally observable red E2Es preceded production
      changes. Preserved receipts use full application and only external boundaries.
- [x] Relevant complete-app E2Es and exact-source installed Edge qualification
      are audited with replayable artifacts, runtime/source identities and preserved
      failures. Root accepted installed4/7/9 at110scope. Owner deferred Chrome to
      #112; that is the existing qualification scope.
- [x] Ownership and nonreply exclusions remain. All 33 portable distribution files
      are byte-identical to #109, so no public-contract consumer check is triggered.

## Verification and preserved limits

The candidate-specific audit records **795 distinct passing case IDs**, including
**633 on exact final b2f1** and all **37 dedicated UX110 cases**. The remaining162
passing IDs retain their earlier candidate hashes; they are not claimed as exact
final-binary runs. The source-only listener narrowing from dec6 to b2f1 is covered
by the dedicated mode/modifier/composition cases and final affected policy runs.
Every case maps to its original receipt in `110-final-case-audit.json`.

- Main integration run `2026-11-14T15-09-54.711Z`:230passed/2legacy locale
  control failures; exact original receipt preserved. Subsequent corrected cases
  passed. Includes the adopted63retained and25conflict cases from scoped helpers.
- Editor reconciliation `2026-11-14T15-24-56.374Z`:241passed/8fixture migration
  failures/13unrun. It includes all36dedicated cases. Original failures remain;
  explicit account checks, correct public labels and mode controls repaired setup.
- Final affected policy run `2026-11-14T15-35-05.805Z`:140passed/1unchanged
  private-history baseline failure/3environment skips. All33shared/current-actor
  cases passed. The three exact107 compatibility cases subsequently all passed in
  `2026-11-14T15-40-16.938Z`; there are no unresolved compatibility skips.
- Independent-build excluded-policy run `2026-11-14T15-34-35.710Z`:218passed/
  2unchanged baseline recovery-text failures; no excluded production code changed.
- Affected narrow geometry retains original assertions. Both optional-Preview
  history-clipping cases pass in `2026-11-14T15-39-14.947Z`, after explicit Source
  selection on recovery. Earlier5targeted layout cases also passed; inherited
  prototype geometry failures below remain failed.

Typecheck, lint, formatting and whitespace checks passed after fixture migration.
Independent offline npm-ci/build reproduced all36distribution files; all33portable
files remain byte-identical to109. Exact runtime: Node24.22.0/npm11.21.1,
Playwright1.64.1, Edge157.0.4341.46. Candidate source/dist/runtime identities,
independent output and digests are preserved.

The root explicitly classified the following untouched baseline failures as
outside110's ordinary-send/keyboard criteria and mandatory112integration work,
**neither passed nor user-waived**. Original assertions were not weakened:

| Assertion                                                                                            | Exact109baseline reproduction |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- |
| UI92.browsing-edges48px expected versus24px safe padding                                             | `2026-11-14T15-31-38.672Z`    |
| UI92.short-review bottom304maximum versus396.15625                                                   | `2026-11-14T15-37-51.951Z`    |
| IM74.extremely-short content64minimum versus0                                                        | `2026-11-14T15-39-17.805Z`    |
| DESIGN.composer compact324maximum/old aside placement; PROTOTYPE.writing old visible destination     | `2026-11-14T15-40-04.251Z`    |
| J6.J7.funded-draft-pending-recovery and J7.packet-schema old recovery text                           | `2026-11-14T15-36-28.866Z`    |
| J77.public-private-history expects destructive replacement despite retained uncertain public attempt | `2026-11-14T15-37-51.951Z`    |

Baseline geometry attribution uses the same reconciled public Source-mode setup;
prototype baseline controls keep their original Review label. All baseline
production is exact109/d106. UI92.external-edges and seven UI92.matrix cases also
retain original hidden-source setup failures; the public-mode setup was corrected,
but those unrelated full journeys were not rerun or claimed passed. Their original
receipts remain112audit inputs. The audit therefore has16unresolved legacy case
IDs, distinct from110's verified feature criteria. Existing parent112Post101
result-link and Chrome qualifications remain the parent's obligations.

The installed-derived guidance case in`2026-11-14T15-45-09.405Z` closes the
DOM-only visibility gap using ancestor clipping geometry and a screenshot. Its
first probe`2026-11-14T15-44-12.337Z` incorrectly expected two confirmed-label
nodes from a fixture reusing one result post ID. The correction verifies two native
nonpending histories, including the truthfully uncertain second observation;
production did not change.

Original red/setup/failure/interrupted receipts remain unchanged. The first Send,
keyboard, hints, checked-uncertain actions and post-composition source cases went
red before their corrections. Locale setup failures used invented visual-mode
labels and were corrected to existing labels. Legacy mandatory-Review failures
were reconciled only at ordinary-reply scope, keeping exact source/target/options,
actor/history, native request count, storage/reload and timing-boundary assertions.
Recovered-actor refusal in rich authoring fixtures required an explicit account
check before deliberate Send; it was not treated as a production failure.

## Installed Edge qualification

Root accepted exactb2f1in the installed Edge157/macOS profile. Tampermonkey MCP
full-source readback after cleanup independently matched the candidate's
2,416,487UTF-8bytes and SHA256. Stable and Beta are treated equivalently as
requested. `installed-b2f1/README.md` preserves the39-file producer manifest,
observed request/event ledgers, source and screenshots. `installed-preflight`
retains earlier raw/inconclusive observations separately; private local forum
recovery data stays local and is not part of this committed ledger.

Genuine Cantonese IME confirmation passed in both modes with trusted composing
keydown/keyCode229 and trusted composition input, exact你好, no newline and no
new request. The observed compositionend event was untrusted; no claim is made
that every event was trusted. Explicit Send, visual Enter/Shift+Enter and source
Enter/Ctrl+Enter were exercised. Cmd+Enter is verified by full-app E2E and was not
separately repeated installed. Exact source, target, options and actor were
observed at POST boundaries; independent view/edit GETs confirmed the visual send.
The source shortcut fixture reused its result post ID, correctly producing an
existing-post comparison with uncertain merge rather than invented new success.

An initial installed stale fixture closure blocked a Send response. The app
retained source and truthful uncertainty; corrected external responses plus
original-result checking and deliberate duplicate-risk acceptance produced one
further POST and source-confirming GETs. The failure remains preserved. Earlier
network-trace overflow, expired captured-cursor replays, a screenshot that ended
composition before Enter, and the old2e53human handoff are explicitly limited.
The screenshot-interrupted probe was cancelled by source change before POST;
no synthetic event is presented as genuine OS input. An unrelated expired
challenge request was retained privately, without solving or forwarding it.

Optional Preview preserved exact source and unknown literal markup with zero
requests; the source description resolved to the current-mode hint. Narrow
expanded guidance was visibly reachable by ordinary nested scrolling, with no
pinned-visibility claim. Fixture writers stopped before guarded archive/deletion;
original writing remained intact, the original URL was restored and editor hidden,
viewport override/interception were cleared and the task tab closed. No live forum
publication, upload, rating or report was sent.

No passing union relabels an original failed run. Installed timing/permission/
duplicate cases were not all repeated independently; the exact-candidate complete
application evidence and installed observations jointly establish110's scope.
Chrome, inherited baseline failures and whole-parent qualification remain112.

## Replay and preservation

Use the sealed delivery README, manifest and candidate source/dist archives.
Extract source into an empty folder, use pinned Node/npm, run `npm ci`, `npm run
build`, and compare every distribution digest. Run the preserved test snapshots
with installed Edge against their authored HTTP fixtures. Receipt case entries map
each result to source/runtime/candidate identity; screenshots, request ledgers,
storage snapshots and original logs are in each immutable run. No real publication
is required or authorized by replay.
