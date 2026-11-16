## Problem Statement

The forum workspace still feels uneven when moving from browsing to reading and
replying. An unopened thread list stretches unnaturally; opening or switching
threads can lose the reader's place. Repeated thread titles in latest-reply links
do not explain who replied. Expanded filters, full pinned rows, board statistics
styled as titles, and reserved status space push useful threads down the screen.

The reader gives passive history/checking state too much prominence, omits the
total page count, and makes common post actions awkward. The reply composer feels
like a separate form rather than part of the forum's IM-style interface. The owner
wants quick replies in one compact row, full editing when expanded, and dependable
continuity across threads, browser restarts and signed-in accounts.

This specification consolidates the seven original browser comments, four later
board comments, the confirmed Q1–Q15 composer decisions and subsequent style and
single-row feedback. Prototype delivery is not production delivery. The fixed-list
direction and specified composer behavior are confirmed; final reader, board and
composer visual approval remains outstanding.

## Solution

Deliver one coherent browsing, reading and ordinary-reply experience, using small
reviewable UI units within the existing forum design language.

**Browsing and board controls**

- Keep a compact desktop thread-list column in the same position and width before
  and after opening a thread. Use the approved 300px preview as the reference,
  with a calm reader placeholder before selection and flat, readable rows.
- Show source-backed latest-replier name and time beside the actual latest-post
  destination. Missing information stays explicitly unavailable; never substitute
  the original author or repeat the thread title as supposed activity metadata.
- Preserve the visible row and relative offset through opening, switching,
  closing and returning. On narrow screens, restore the list anchor after reflow,
  including changes to text size while the list is hidden.
- Collapse board filters into a compact control. Preserve all source-supported
  category, type, reward, sort, time and order groups and their actual semantics.
  Show active criteria/count, apply changes deliberately, support Cancel and Clear,
  and offer recovery from no matches.
- Present the board name as the title and today/topic/rank statistics as secondary
  information. Separate these from native source structure, not guessed title
  substrings.
- Remove empty quiet-status reservation. Keep actual checking, failure, Retry,
  Details and new-thread reveal discoverable and truthful. Preserve the user's
  place when asynchronous status appears; do not silently prepend arrivals.
- Collapse pinned threads behind a labelled pin/count disclosure. Opening it
  exposes usable thread destinations without changing the selected reader or
  losing writing. Preserve source-backed filtering/pin semantics; the prototype's
  choice to keep pins independent of filters is not an approved new policy.

**Reader and post actions**

- Move refresh mode/check controls into thread options. Place useful status and
  retry/new-reply actions near their context and history boundaries near the actual
  start/end of posts. Remove the prominent passive “Manual refresh / Beginning of
  thread” block. Preserve the reading anchor when actionable status appears.
- Display current page / total pages using the visible post's source page and a
  qualified total. Preserve an explicit unknown-total state. The page picker keeps
  explicit Go and Cancel; viewing or cancelling choices does not navigate.
- Provide the same post menu from right-click and a visible keyboard/touch ⋯
  control: Reply, Show only this author's posts, Rate and Report. Reflect actual
  capabilities and permission/unavailability states. Rate/Report must use qualified
  forum flows; opening the menu must never perform either action.
- Double-clicking empty post space prepares a reply to that post. Text double-click
  continues word selection; links and other controls keep their ordinary gestures.
  Preparing a reply never submits it.
- Activating a post number copies that exact post's permalink without referral
  information. Show a success toast only after clipboard success. On failure,
  provide a selectable URL and a truthful explanation.

**Ordinary reply composer**

- Dock the composer at the reader bottom. At rest, put ＋, the writing field with
  expansion control, and Send in one horizontal row. Authored multiline content
  may grow; “one row” does not mean one line of allowed text. Reply context,
  attachment chips and meaningful recovery information may occupy additional space.
- Match the established white 8px input surfaces, black pill actions, stroked SVG
  controls, quiet metadata, pastel reply context, 8px menus and 24px dialogs. Use
  accessible names, visible focus, readable contrast and usable touch targets.
  Do not add a sender avatar/name beside Send.
- Default to visual editing and retain complete BBCode as an advanced mode.
  Compact secondary tools live under ＋. Expanded mode stays within the same reader
  column, leaves reading visible, and retains **all existing production tools**,
  not merely the smaller prototype toolbar. Preview is optional.
- Preserve the same editor session across compact/expanded presentation, including
  content, formatting, selection, undo, target and attachments. Keep all commands
  reachable at narrow widths and enlarged text; avoid page overflow and stranded
  Send controls.
- Retain a local reply draft for each thread and restore it on return, with a small
  draft indicator in the thread list. Retain it across browser restarts and share
  its content across signed-in accounts in the same browser profile. This is
  local unfinished writing, not a server-owned Forum draft.
- Retargeting a reply within the same thread preserves writing. A target strip
  shows the author's name and a short excerpt; removing it returns to a general
  thread reply. Inserting quoted content is separate and explicit.
- In visual mode Enter sends, Shift+Enter inserts a newline, and IME confirmation
  never sends. In complete BBCode mode Enter inserts a newline and Ctrl/Cmd+Enter
  sends. Make the current mode's guidance discoverable in compact tools and the
  accessible input description, and visible in expanded mode.
- One explicit Send initiates an ordinary reply without mandatory Preview or a
  separate prepared-content confirmation. Preserve fresh account/form/permission
  checks, exact submitted revision, one-use command control and duplicate-send
  protection. Changes during preparation must not publish text or a destination
  the author did not submit.
- Retain the submitted snapshot as Sending in the thread, clear the input for the
  next draft and keep typing available. Only one send per thread may remain
  unsettled. Confirm success from authoritative forum evidence, including any
  moderation distinction; optimistic display is not success.
- Keep a failed reply visible with deliberate Retry and Edit. Editing it preserves
  any newer unfinished writing separately. An unknown result offers Check status;
  retries must obey the existing uncertainty controls and never happen
  automatically on recovery, account change or restart.
- Keep unavailable attachments as chips with Reattach/Remove, preserve text and
  block sending until unresolved attachments are repaired or removed. Account-
  shared text does not transfer upload ownership or publishing authority.
- If tabs edit the same draft incompatibly, retain both versions and ask which to
  continue. Ordinary switching restores automatically; no silent last-write-wins
  loss. Surface failed storage acknowledgements without claiming content is saved.

## User Stories

1. As a board reader, I want a compact list before selecting a thread, so that browsing feels natural.
2. As a reader, I want the list to stay in place when a thread opens, so that I retain my bearings.
3. As a reader, I want my visible row restored when switching or closing threads, so that I can continue browsing where I stopped.
4. As a narrow-screen reader, I want returning from a thread to preserve my list anchor after text reflow, so that enlarged text does not lose my place.
5. As a board reader, I want the actual latest replier and time, so that I can judge recent activity.
6. As a reader, I want latest-reply links to reach the latest post, so that their destination matches their meaning.
7. As a reader, I want unavailable metadata identified honestly, so that I am not misled by invented information.
8. As a board reader, I want collapsed filters, so that threads receive most of the screen.
9. As a reader using filters, I want every supported filter group retained, so that density does not remove useful choices.
10. As a reader, I want active filter criteria visible while collapsed, so that I understand the list I am seeing.
11. As a reader changing filters, I want Apply and Cancel, so that tentative choices do not unexpectedly change my list.
12. As a reader with no matches, I want to clear or revise filters, so that I can recover without losing my reader or writing.
13. As a board reader, I want statistics styled below the board title, so that the board's identity remains clear.
14. As a reader, I want quiet board checks to consume little space, so that an empty status area does not obscure threads.
15. As a reader whose check fails, I want visible failure, Retry and Details, so that compactness does not conceal a problem.
16. As a reader, I want new threads and replies revealed deliberately, so that arrivals do not move what I am reading.
17. As a reader, I want pinned threads accessible through a pin/count disclosure, so that announcements remain available without dominating the list.
18. As a reader, I want pin counts and filtering to reflect the forum source, so that the compact presentation remains truthful.
19. As a thread reader, I want refresh settings in thread options, so that passive settings do not dominate reading.
20. As a reader, I want real history boundaries near the posts they describe, so that their meaning is clear.
21. As a reader, I want current and total pages, so that I know my position in a long thread.
22. As a reader, I want unknown totals shown as unknown, so that unqualified page counts do not imply certainty.
23. As a reader, I want page selection to require Go and support Cancel, so that examining the picker does not move me.
24. As a mouse user, I want post actions in a context menu, so that they are close to the post.
25. As a keyboard or touch user, I want the same menu through ⋯, so that I can use all post actions without right-clicking.
26. As a reader, I want Show only this author's posts, so that I can follow that author's contributions.
27. As a reader, I want qualified Rate and Report actions with truthful availability, so that I can use supported forum actions confidently.
28. As a writer, I want empty-space double-click to prepare a reply, so that addressing a post is quick.
29. As a reader selecting text or following a link, I want normal gestures preserved, so that the reply shortcut does not interfere.
30. As a reader sharing a post, I want its exact permalink copied, so that the recipient reaches the intended post.
31. As a reader, I want truthful copy feedback and a selectable fallback, so that clipboard refusal is recoverable.
32. As a writer, I want one compact input/action row, so that short replies leave more reading space.
33. As a writer, I want multiline writing to grow naturally, so that compact mode does not constrain my content.
34. As a writer, I want the composer to match the forum's IM styling, so that it feels part of the reader.
35. As a writer, I want visual editing by default, so that I can see ordinary formatting while composing.
36. As an advanced writer, I want complete BBCode and protected-source preservation, so that visual editing cannot silently discard content.
37. As a writer, I want secondary tools under ＋, so that they remain available without a permanent compact toolbar.
38. As a writer composing longer replies, I want expansion in the same reader column, so that I keep the thread in view.
39. As a writer, I want full production editing functions when expanded, so that expansion is not a reduced demo editor.
40. As a writer changing presentation, I want content, selection, undo, target and attachments preserved, so that I can switch without restarting.
41. As a writer, I want optional Preview, so that I can inspect a reply when useful without a mandatory extra step.
42. As a writer moving among threads, I want each thread's unfinished reply restored and indicated, so that I can resume it later.
43. As a writer restarting the browser, I want local reply drafts retained, so that closing the browser does not intentionally discard my writing.
44. As a writer switching signed-in accounts, I want shared draft content, so that I do not manage separate copies for each account.
45. As a writer, I want upload ownership and submission identity checked afresh, so that shared text does not reuse another account's authority.
46. As a writer addressing a different post in the same thread, I want my text retained with a clear target strip, so that retargeting is safe.
47. As a writer, I want removing the target and inserting a quote to be separate actions, so that neither silently rewrites my text.
48. As a writer, I want visual Enter-to-send and Shift+Enter-to-newline, so that quick replies use familiar IM behavior.
49. As an IME user, I want confirmation keys to finish composition only, so that choosing characters never publishes a reply.
50. As a BBCode writer, I want Enter for newlines and Ctrl/Cmd+Enter for Send with mode-specific guidance, so that source editing stays practical.
51. As a writer, I want one explicit Send with internal validation, so that ordinary replies are quick without bypassing operation safeguards.
52. As a writer, I want my submitted snapshot shown as Sending while I write the next reply, so that network delay does not block composition.
53. As a writer, I want only one unsettled send per thread, so that duplicate or uncertain submissions do not accumulate accidentally.
54. As a writer, I want failed replies retained with Retry and Edit, so that I can recover my content deliberately.
55. As a writer with newer text, I want editing an older failure to preserve both versions, so that recovery cannot overwrite my next reply.
56. As a writer with an unknown result, I want Check status and controlled retry, so that uncertainty does not cause an automatic duplicate.
57. As a writer with an unavailable attachment, I want Reattach/Remove and intact text, so that I can repair the reply explicitly.
58. As a writer using multiple tabs, I want conflicting drafts retained and a choice of which to continue, so that concurrent editing does not silently lose work.
59. As a writer whose storage fails, I want a truthful unsaved state and recoverable current text, so that I know the limits of retention.
60. As a keyboard, touch or enlarged-text user, I want reachable controls, readable context and stable focus, so that density does not reduce usability.

## Implementation Decisions

- Preserve the established boundaries: layouts own presentation/focus, the
  workspace owns navigation and writing state, the forum client owns source
  interpretation and consequential operation semantics, and hosts own browser
  storage, requests and clipboard mechanisms. Do not put forum actions directly
  into menu or editor components.
- Extend source-backed Board/Thread/Post metadata only where needed: separate
  board statistics, latest-replier metadata, qualified page counts, exact post
  destinations and qualified action capabilities. Preserve source links,
  unavailable states and portable serializable contracts. Prefer current native
  forms/capabilities over invented Rate/Report endpoints.
- Qualify supported Rate/Report flows through their current forms, explicit user
  action, correct post/actor binding and truthful success/failure/uncertainty
  feedback. A placement stub or a button that does nothing is not implementation
  of a supported action. Capability absence must remain distinguishable from a
  failed attempt, and opening/cancelling a flow must not perform its effect.
- Keep list and reader anchors as visible identities plus relative positions.
  Raw scroll offsets alone are insufficient after reflow. Filter application and
  explicitly expanding pins may change list contents/layout; preserve meaningful
  selected-reader, writing and focus context, and do not promise the same row when
  the user deliberately filters it out.
- Collapsing filters or pins changes presentation, not forum meaning. Retain real
  filter-group distinctions and source behavior. Do not copy the prototype's local
  sample matching, Order precedence or independent pin-count policy. Count only
  qualified pinned entries and describe count scope accurately.
- Keep one active editor session while retaining inactive per-thread local reply
  drafts. Expanded functionality includes undo/redo; bold, italic, underline and
  strike; ordered/unordered lists; code; fonts, size, color, sub/superscript,
  alignment and indentation; links/email/images/emoticons; named quotes, spoilers,
  hidden blocks and unwrapping; table creation, selection, row/column operations,
  merging/splitting and removal; mentions; attachment operations; complete BBCode;
  and optional Preview. Preserve all applicable existing ordinary-reply options
  and capability restrictions. Reorganizing controls must not remove commands.
- Preserve unsupported/protected BBCode through visual/source transitions.
  Conversion ambiguity remains actionable and cannot be silently published as
  altered content. Do not require a visual round-trip to edit complete source.
- The new ordinary-reply Send policy supersedes the mandatory inspect-and-confirm
  step from the earlier prepared-review specification for this scope only. Bind
  the submitted content/target revision and current actor to the explicit Send;
  fresh preparation must reject stale authority or changed submitted meaning.
  Later typing cannot mutate the captured attempt or authorize a new attempt.
- Distinguish current local writing, immutable submitted snapshots and confirmed
  forum posts. Keep unsettled attempts bound to their original account and target,
  including through reload and cross-tab recovery. Retain at most one unsettled
  send per thread under the supported shared-draft/tab behavior; recovery never
  constitutes authorization to resend. Continue using qualified confirmation and
  uncertainty handling rather than optimistic success or unsafe retries.
- Account-shared drafts share authored content, not tokens, form authority,
  permissions, upload ownership or prior submission identity. Validate attachment
  usability for the current account. Unuploaded file bytes must not be silently
  promised to survive restart; retain unavailable intent with repair controls.
- Durable per-thread, account-shared, conflict-retaining local reply drafts
  deliberately change the prior account-bound page-session recovery contract.
  Reconcile the writing ownership and recovery ADRs before implementing a durable
  contract. Specify versioning, legacy-session coexistence/migration, invalid or
  incompatible records, acknowledged writes, capacity/refusal, concurrent edits
  and recovered uncertain attempts. Retain recoverable old writing or explain its
  incompatibility; do not silently erase it.
- No production storage backend, schema, append-only log or synchronization
  algorithm is selected by this spec. The prototype's localStorage mechanism is
  evidence for interaction only. Evaluate costly-to-reverse storage/contract
  choices with the project-required advisor before implementation. Browser-local
  storage failure or user-cleared storage cannot honestly guarantee durability;
  expose those limits without weakening normal restart retention.
- Use the existing localization, semantic styling, accessible overlay and focus
  conventions. Compact Send may use a named arrow and expanded Send a label;
  toolbar grouping and exact dimensions remain reversible presentation choices.
  Preserve the accepted same-column expansion and single-row resting layout.

## Testing Decisions

Use the existing **complete-application browser E2E seam**: the built userscript,
real layout, workspace, editor, forum client and browser host, substituting only
external forum HTTP responses for deterministic scenarios. Drive actual UI and
real browser storage, including multiple tabs. Do not mock internal workspace,
editor, draft or forum-client modules. Fault injection belongs at external
responses or the browser/host boundary. The owner confirmed this seam, including
affected installed Edge/Chrome checks, on 2026-11-13: “Yes—use this existing E2E seam.”

Existing prior art covers list context, board/thread checks, page selection,
ordinary replies, visual/source editing, writing presentation, recovery and
browser edges. Extend those journeys where appropriate rather than creating a
separate component seam. If a portable public contract changes, also run the
existing external-consumer compatibility check; this is not a new UI test seam.

Write the failure inventory and externally observable E2E expectations before
feature implementation. Do not add unit tests after implementation. Assert user
outcomes, source preservation, request counts and exact submitted meaning rather
than private component state or incidental DOM structure.

The production acceptance matrix is intentionally unchecked:

| ID  | Acceptance criterion and failure cases                                                                                                                                                      | Required observable evidence                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Stable compact desktop list before selection/open/switch/close; narrow return restores the visible row after enlarged-text reflow.                                                          | Screenshots and row/offset observations at desktop and narrow sizes; direct interactions that do not auto-scroll targets before measurement.                                                          |
| B2  | Actual latest author/time and latest-post destination, including absent metadata and long CJK content.                                                                                      | Qualified source fixtures, rendered metadata and actual navigation target; no invented author.                                                                                                        |
| B3  | Collapsed filters retain all six supported groups, active criteria, Apply/Cancel, Clear and no-match recovery.                                                                              | UI/request evidence of native filter semantics and no navigation on Cancel; reader/writing retention.                                                                                                 |
| B4  | Board name/statistics separated; pins collapsed but reachable with truthful count/filter semantics.                                                                                         | Source variants and before/reveal/open/collapse screenshots, selected-thread and focus outcomes.                                                                                                      |
| B5  | Quiet board/reader status has no empty reservation; checking/failure/retry/details/boundaries/arrivals stay truthful and preserve anchors.                                                  | Quiet → actionable → quiet observations at top and mid-scroll; explicit reveal and duplicate-free request ledger.                                                                                     |
| R1  | Current/total tracks visible source page; unknown stays unknown; page picker Go/Cancel works.                                                                                               | Multi-page, filtered-history and unknown-total cases, visible page labels and navigation requests.                                                                                                    |
| R2  | Right-click and ⋯ expose equivalent actions with capability states; author filtering retains genuine source semantics.                                                                      | Keyboard/touch/pointer journeys, focus return, supported/unsupported Rate/Report forms, cancellation and permission changes.                                                                          |
| R3  | Empty-space double-click prepares the exact reply; text selection, links and menu gestures do not send.                                                                                     | Target identity, preserved selection and zero publication requests from preparation gestures.                                                                                                         |
| R4  | Post-number copy uses exact post identity and no referral; success toast follows success only; refusal has selectable fallback.                                                             | Clipboard success/refusal and malformed/missing native permalink cases with resolved URL evidence.                                                                                                    |
| C1  | Compact ＋/input/expand/Send stay in one row for short text; multiline grows; expanded stays in-column with reading visible and full tools reachable.                                       | Desktop, approximately 905px and 390px views, 100%/125% text, long CJK names, chips/notices and applicable keyboard/viewport states; no horizontal overflow.                                          |
| C2  | Full production command inventory and reply options remain available; compact/expanded and visual/source preserve exact content, selection, undo, target and attachments.                   | Representative formatted, table, mention, attachment and protected-BBCode journeys; command inventory reconciliation, source snapshots and repeatable screenshots.                                    |
| C3  | Same-thread retarget preserves text, removing target makes a general reply, quote insertion is explicit; other-thread return restores its own writing/indicator.                            | Draft and target observations before/after each transition, with two threads and nonempty writing.                                                                                                    |
| C4  | Visual Enter sends, Shift+Enter adds a line; BBCode Enter adds a line, Ctrl/Cmd+Enter sends; IME confirmation never sends.                                                                  | UI/keyboard assertions, visible/accessibly associated hints and publication request counts; genuine installed IME observation in addition to synthetic events.                                        |
| C5  | One explicit Send binds the exact revision/target/actor with fresh checks and duplicate protection; Preview is optional.                                                                    | Delayed preparation, account/permission/form changes, rapid activation, target/content changes and exact POST/request ledger; stale preparation cannot send changed meaning.                          |
| C6  | Sending snapshot stays independent of next draft; only one unsettled send per thread; confirmed/rejected/moderated/unknown outcomes stay distinct.                                          | Delayed/lost/rejected responses, same-thread second-tab attempts, reconciliation and authoritative readback; no automatic replay.                                                                     |
| C7  | Failed Retry/Edit preserves newer writing; Unknown Check status and later deliberate retry obey uncertainty rules.                                                                          | Independent old snapshot/new draft observations through edit/return/reload; request counts prove no duplicate retry.                                                                                  |
| C8  | Per-thread content survives supported restart and account switching; authority and old attempts remain bound to original actors.                                                            | Real storage and browser lifecycle observations, fresh actor checks and attachment invalidation; no automatic send after restore.                                                                     |
| C9  | Unavailable attachments retain text and chips, block send, and offer Reattach/Remove without pretending bytes/ownership survived.                                                           | Reload/account-change/file-loss cases and server-file operation controls; repaired payload or deliberately removed reference.                                                                         |
| C10 | Concurrent incompatible drafts keep both; ordinary switching restores automatically; refusal, quota, corrupt/incompatible data and legacy recovery never silently lose recoverable writing. | Actual multiple tabs and storage/lifecycle failure cases, both conflicting versions available for explicit choice, truthful saved/unsaved state.                                                      |
| Q1  | Dense controls remain accessible and match the established forum IM style.                                                                                                                  | Accessible names, keyboard focus/escape, menu bounds, usable touch targets, enlarged-text screenshots and owner visual review of board, reader and composer units.                                    |
| Q2  | Production claims have repeatable, candidate-specific evidence and required installed-host qualification.                                                                                   | Requirement-to-case report, screenshots/observations, synthetic request ledger, source/build/runtime identity, manifest hashes and replay instructions; limitations and failures retained explicitly. |

- [ ] B1–B5 verified against the assembled production application.
- [ ] R1–R4 verified against the assembled production application.
- [ ] C1–C10 verified against the assembled production application.
- [ ] Q1 visual/accessibility acceptance and Q2 evidence/host qualification completed.

Use Edge for routine deterministic development checks with network interception
failing closed. Follow the current installed-release qualification ADR for affected
Edge and Chrome workflows on the same candidate. Storage/restart, native IME,
clipboard, focus/keyboard and manager integration require affected installed-host
evidence; synthetic responses or events alone cannot establish those guarantees.
Keep existing deferred Windows and genuine manager-software-update work separate;
do not mark either passed here or invent new deferrals.

Retain a verifiable, repeatable artifact at the end of each E2E run using the
existing evidence reporter/manifest workflow. Preserve failures and targeted
reruns separately. Synthetic public fixtures and authored reports may be shared;
raw authenticated captures, member data and workstation paths remain private.
Live consequential actions use authorized accounts and deliberately chosen test
targets; fixture tests do not authorize unsolicited replies, ratings or reports.

## Out of Scope

- Redesigning new-thread authoring, existing-post editing, private messaging,
  server-owned Forum drafts, funding, purchases or unrelated forum workflows.
- Changing the meaning of author filtering, merging native filter groups, or
  adopting the prototype's independent pinned-thread filter/count policy.
- A new cross-device/cloud draft service, account-separated copies of ordinary
  reply drafts, persistence of credentials/form tokens or automatic resubmission.
- Selecting a production storage algorithm by copying prototype code, or treating
  simulated ratings/reports/uploads/posting as qualified forum capabilities.
- Replacing the full editor with the prototype's limited formatting subset.
- Approving all preview visuals, claiming installed qualification, publishing a
  release or marking production implementation complete through this spec.
- The older Boards-directory filter suggestion, which concerns a different screen
  from the selected board's thread-list filters.

## Further Notes

**Precedence and related work.** The accepted ordinary-reply behavior changes the
mandatory prepared-review policy in #59 and #52, the side-column expansion and
account-bound writing assumptions in #87, and writing/recovery policy in ADR0001
and ADR0003. It preserves forum-client authority and immutable operation guarantees.
The latest same-thread retargeting decision supersedes the earlier reader demo's
nonempty-writing replacement block. The latest single-row composer supersedes its
earlier two-row footer. Quiet status removal changes the visual reservation from
#90 while retaining meaningful position and truthful failure handling.

Other predecessor issues include #65/#67 for retained browsing, #68–#71 for
history/checking, #74 for viewport behavior, #84 for board groups, #85/#86 for
thread tools/page selection, #89/#90 for checks and #91 for palette. These closed
issues provide context, not evidence that the new behavior is implemented.

**Approval boundary.** “ok” approved the first fixed-list MVP direction. The
shared post menu and empty-space reply gesture were explicitly confirmed. All
Q1–Q15 composer behaviors were confirmed, with shared account-independent draft
content and no sender label as explicit corrections. Board density and the latest
reader/composer appearance still need final visual review. This issue authorizes
implementation of the stated requirements, not silent approval of incidental demo
choices. Use reviewable units for presentation acceptance.

**Prototype evidence.** Local prototypes exist on branch `feat/improve-ui-ux`.
Reference revisions include `1835368` (composer decisions), `fb8f02d` (composer
preview), `2aefe73` (style), `7550bea` (single row/full expanded demo tools),
`9d3d790` (board controls) and `ed829c8` (reader controls). These are local revision
references, not promised public artifacts. Retained prototype screenshots and
hash manifests document simulated UI behavior; they do not prove production
durability, real posting/uploads, full production tool preservation or installed
host qualification. No private evidence needs to be uploaded to understand this
self-contained specification.

**Trade-offs carried forward.** A fixed list reserves reader space before a
selection. Collapsed filters, pins and tools reduce clutter while adding a reveal
action. Removing blank status bands requires anchor handling when meaningful
status appears. One-row controls leave less text width; multiline/expanded writing
uses more height. Icon controls and quieter shortcut hints reduce persistent text
but require accessible names and discoverable guidance. Same-column expansion
reduces visible posts while retaining reading context. Visual editing needs exact
source preservation and a complete advanced path. Optional Preview and Enter-to-
send reduce steps while placing more responsibility on explicit send semantics
and IME handling. Omitting a nearby sender label reduces visual detail but removes
that local account cue. Durable shared drafts add lifecycle, concurrency and
attachment-authority work. Pending snapshots enable continued typing but add
distinct failure/unknown states and can delay another send. Repairable attachments
and conflict choice preserve intent at the cost of deliberate recovery steps.

**Specification trade-offs.** One issue keeps the interdependent list, reader and
composer decisions together but is a larger implementation task; its acceptance
matrix and small review units bound progress. Existing source semantics remain
the default where the prototype introduced unapproved policies, limiting accidental
scope expansion while leaving exact pin/toolbar presentation to visual review.
Storage mechanism selection is deferred to deliberate design, preserving the
confirmed product requirements without pretending the prototype settles production
architecture. Complete-app E2Es provide realistic integration evidence at greater
setup/runtime cost; focused installed checks cover browser guarantees the fixture
seam cannot prove. Exact preview heights are reference observations, not brittle
universal pixel requirements. No runtime functionality is changed by publication.
