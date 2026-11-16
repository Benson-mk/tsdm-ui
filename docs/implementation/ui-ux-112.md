# Qualify the integrated browsing-to-reply experience — #112

Ticket: [#112](https://github.com/Benson-mk/tsdm-ui/issues/112), under
[#95](https://github.com/Benson-mk/tsdm-ui/issues/95). The owner approved the exact
012ccb8 appearance. Final affected installed Edge/Chrome qualification is verified
at the explicit historical-reuse scope below. All141 affected maintenance identities
map to actual passing observations; the bounded run itself records140passes/1failure,
followed by5/5 corrected-case repetitions. This document preserves earlier phases
and does not close or edit the parent specification.

## Delivered correction

The complete-app replay reproduced two short-viewport failures on the exact #111
base: the addressed composer could leave its content with zero height, and its
focused source editor could extend beyond the usable viewport. The writer now
keeps a 64px content minimum and compact inputs use a viewport-relative maximum:
20% of visual viewport height, bounded between 44px and 140px. Both original
geometric cases pass after these two CSS changes. No public API, durable schema,
operation authority, editor model or reply ownership changed.

Installed Chrome source IME exposed a second-tab race on the provisional 4cff
candidate. A clean inactive observer could queue old retained text, accept a newer
remote checkpoint, then replay its old capture as if newly authored. The exact
complete-app two-tab sequence reproduced at the third preedit; disabling only
advisory BroadcastChannel delivery made it pass. Successful exact remote adoption
now advances the existing per-thread save-queue epoch, preventing pre-adoption
captures from re-authoring obsolete text. The existing immediate post-adoption save
retains the current slot. Genuine dirty-edit comparisons and conflicts are unchanged.

Installed account-sharing then exposed Failed Edit refusing a saved newer draft
after only its cursor/local revision changed. The saved fingerprint intentionally
excludes those two top-level fields; retention had compared them anyway. The
failure-first ArrowLeft/Edit journey reproduced the refusal. The advisor and root
accepted a local retainFailed-only exception for top-level revision and selection.
Sole head, exact parent, all other validated context fields and full expected send
remain exact; nested submitted revisions are untouched. Send reservation is
unchanged, supported by passing before/after Send and Retry selection controls.

The final spec review's adjacent-history hypotheses were confirmed in complete-app
red journeys. Rate and Report had re-fetched the entry page for a post appended
from another page; author filters from that page were absent. Both actions now use
the existing per-post source URL. The transient page membership retains its native
filters and supplies only the selected post's source filters to its menu. Initial
activation, appended loads, fresh replacement and retained ranges share that
metadata lifecycle. Native actor, PID, permission and form checks stay unchanged;
no filter URL is invented and no portable or durable model changes.

The final standards review found no hard violation. Its low-priority suggestion
to combine rating/report transient lifecycle code is left unchanged: these native
operations have distinct outcomes and validation contracts, and the review showed
no behavior defect justifying a new abstraction in this qualification ticket.

## Qualification seam and candidate

All new journeys run the emitted production userscript, real Vue/editor/workspace,
portable forum client, IndexedDB and page-session storage. Only external HTTP and
explicit browser mechanisms are controlled. There are no unit tests or internal
runtime mocks. The preimplementation failure inventory and original failing
receipts are retained with the private evidence package.

Historical pre-owner-revision userscript SHA-256:
`6f7ebdab2aae100d6b96a78373057077e697cb219e2d3ec682dad48afc6f0eca`.
Pinned toolchain: Node24.22.0, npm11.21.1, Playwright1.64.1. Runtime versions,
source files, emitted hashes, requests and screenshots are recorded per receipt.
The immutable provisional candidate is retained separately from the final seal.

The new `integrated-ui-ux.spec.ts` exercises filtered/pinned browsing, page selection,
exact permalink copying, post menus, protected/table source editing, same-editor
selection across expansion, retarget/removal, independent thread writing, Send,
newer typing, rejection, explicit failed-Edit version roundtrip and reload at
1440px and390px. Six owner-review cases capture board, reader, compact, expanded
and retained-recovery states at 1440/905/390px and 100/125% text.

The account journey changes the external signed-in actor while the original
request is held. A second tab observes Writer8 through its actual native thread
response, continues shared writing, cannot check a form or send through the hold,
and cannot Retry Writer7's eventual rejection. Exact original actor, target and
publication remain unchanged through reload, with one POST total.

The conflict journey disables advisory BroadcastChannel delivery at the browser
boundary so a third tab can retain a genuinely stale risk confirmation. One
explicitly accepted successor is admitted; the stale confirmation cannot dispatch
another. Late original completion and incompatible raw history create a visible
conflict. Explicit choice restores editing while the pending successor still
blocks Send. Both submitted snapshots and newer writing survive recovery. Two
physical requests exist because the author deliberately accepted duplicate risk;
this is one active coordination lineage, not a claim of exactly-once execution.

## Parent requirement reconciliation

Each row identifies final replay cases and the original responsible child ledger.
Final run IDs and installed evidence are recorded in the private requirement report.

| ID  | Final affected/integrated evidence                                        | Responsible child |
| --- | ------------------------------------------------------------------------- | ----------------- |
| B1  | stable-board-browsing; navigation row anchors; integrated thread return   | 96                |
| B2  | B2 metadata/partial/touch/CJK; integrated source-backed latest metadata   | 97                |
| B3  | B3 staged-native/no-match/clear; integrated six-group filter              | 98                |
| B4  | B4 heading/pins; integrated pinned destination                            | 98                |
| B5  | UX99 board/reader quiet, failure, boundaries, explicit arrival            | 99                |
| R1  | UX100 totals/adjacent/shrink/writing; integrated page2                    | 100               |
| R2  | UX101 menu/filter/capability; qualified Rate/Report flows                 | 101–103           |
| R3  | UX101 gestures/link/keyboard; zero preparation POSTs                      | 101               |
| R4  | UX104 copy/refusal/redirect/touch; integrated exact4222 copy              | 104               |
| C1  | UI105 resting/growth/geometry; short-viewport reds→green; six owner units | 105               |
| C2  | UI105 continuity/tools/preview; integrated protected/table exact source   | 105               |
| C3  | UX101 retarget/quote; retained replies; integrated42→43→42                | 101,106           |
| C4  | explicit reply mode/IME/shortcuts; installed OS IME gate                  | 110               |
| C5  | explicit reply fresh-preflight/races; integrated one-Send POST            | 110               |
| C6  | pending replies; integrated delayed original/newer draft                  | 111               |
| C7  | pending rejection/Edit/Retry/Unknown; integrated failed-Edit roundtrip    | 111               |
| C8  | retained/shared replies; integrated account-during-send; process restart  | 107–108           |
| C9  | shared attachment ownership/loss/repair/removal complete-app cases        | 108               |
| C10 | native storage/conflict cases; integrated stale-risk explicit choice      | 107,109           |
| Q1  | accessible enlarged/narrow/full-context captures; owner approval gate     | 105,112           |
| Q2  | manifests, replay ledger, independent build, installed Edge/Chrome gates  | 112               |

## Inherited assertion reconciliation

Original receipts remain preserved, including the original 23-case replay with
21 failures on exact #111. Changes are justified by the approved parent contract;
they do not convert those original runs into passes.

- `DESIGN.composer` and `PROTOTYPE.writing`: close the explicit source-mode tools
  before measuring compact rest; expanded writing belongs below the reader in its
  column. General destination stays accessible but intentionally visually quiet.
- `UI92.external-edges` / `browsing-edges`: fixed unselected list and placeholder
  own different exposed edges. Preserve48px exposed protection and 24px internal
  list padding under the approved fixed-column geometry.
- `UI92.matrix-*`: preserve the exact captured glyph/range and original offset
  whenever it physically fits; a 99px reader cannot contain a 187px glyph offset.
  In that case require the same glyph fully visible at the bounded offset, within
  one pixel. Original failures and before/after geometry remain available.
- `IM74.extremely-short` / `UI92.short-review`: genuine production regressions;
  unchanged geometric assertions pass with the two CSS corrections above.
- `J6.J7.funded-draft-pending-recovery`: reload can observe a genuine lost-response
  Unknown instead of the earlier Pending-restored phrase. Still require exact
  original attempt/submission, unchecked uncertainty, one command and one debit.
- `J7.packet-schema`: the original assertion passed initially. A final replay
  exposed its live corruption being overwritten by the outgoing page's normal
  save. Inject malformed native session storage at the next document startup,
  then require the same incompatible-recovery warning, exact raw retention and
  zero publication. This deterministically exercises the intended decoder boundary.
- `J77.public-private-history`: ADR0003/#109 refuses destructive replacement of an
  unsettled public reply. Verify refusal/reason, Keep/Return, original attempt and
  newer writing, public reload, available Check, disabled Send and one POST.
  The obsolete expectation of a private editor is explicitly superseded.
- `review.check-published` / `review.check-moderation`: #104 changed post-number
  activation to Copy. Verify exact native referral-free findpost URL through the
  clipboard, unchanged result/source and no extra read requests.
- Historical #97 navigation: fresh permission evidence proves the current member
  while retained content remains unverified; verify row-relative anchor after
  reflow, and use the actual page picker including the mobile page 2 request.
  Discovery/composition/About paths and the #101/UI87 reading anchor are replayed.
- New combined flows await acknowledged version adoption before switching editor
  mode. A pending shared operation correctly disables explicit form checking;
  the changed account is proved by a fresh native thread response instead.

- `IM68` writing and `UX100.writing`: select source mode through its public control
  before typing; retained hidden-source assertions still require exact text,
  editor-node identity and selection after navigation. Loaded post numbers now
  copy the exact permalink without a read or target change under #104.
- `UX109.narrow`: wait for the workspace's observed narrow-docking state after a
  browser resize, then keep the original 391px containment bounds. The immediate
  desktop measurement is preserved; five corrected repetitions passed.
- The source-filter cache control uses an uncached page Go followed by Back.
  Native author links intentionally navigate the document and do not preserve
  an in-memory range; their exact destination is verified separately.

## Final automated evidence

The final userscript passes all 425 affected UI, integrated and reply cases across
run `2026-11-14T19-43-39.710Z` (424 passed, one resize-observation failure) and
`2026-11-14T19-49-42.967Z` (five corrected narrow repetitions). The separate final
107-case run `2026-11-14T19-50-16.701Z` passes native action/history, B5/R1 and
historical composing/recovery reconciliation. Actual earlier #104/#107/#108/#110
executables remain preserved with their hashes for upgrade/downgrade replay.

Actual isolated Edge and Chrome pending-process restarts passed on this exact
candidate: `2026-11-14T19-51-35.257Z` and `2026-11-14T19-52-36.929Z`. Native rows were
read after relaunch before starting the app, then recovered through the real app
without automatic replay. The latter run also passes the deterministic malformed
packet-recovery control. These isolated checks complement installed host evidence.

The independent offline rebuild reproduces all 36 distribution files. All 33
portable artifacts remain byte-identical to #111. Typecheck, lint and formatting
checks pass. Original failing/interrupted receipts remain unchanged; the private
case audit and requirement-to-case report preserve their actual counts and scope.
The broad 614-case invocation was stopped during an unchanged real-timer test
(three passed, one interrupted, 610 not run), rather than claimed qualified.

## Historical installed phases and then-open gates

Four root-owned installed phases are sealed and hash-verified in the private
package. Edge `6582415` covers the complete filters/pins/page/copy/reply journey,
short writing, second-tab newer text, original rejection, cursor-only Failed Edit,
version roundtrip and exact deliberate Retry with independent confirmation. It
recorded two primary intercepted POSTs and zero secondary POSTs. Its later
truncated cleanup event read remains separate from bounded qualification evidence.

Final Edge `6f7ebda` has exact installed source readback and verifies the changed
adjacent post actions: entry post101 remains while201 is appended; Rate201 exposes
two native score controls and Report201 five reasons after fresh page2 reads;
the actual author9 native filter route is followed. These actions produce zero
POSTs. Task tabs, interceptors and viewport overrides are cleared and the clipboard
is restored. The original user's durable draft matches the fresh baseline; exact
page-session restoration differs only in the refreshed reading marker timestamp.
Task-session reimport and its exact cleanup remain preserved in the private record.

Chrome `1ab605d` supplies genuine native source/visual Cantonese IME and the
actor7/actor8 pending/newer-writing observation. Its Failed Edit refusal is retained
as a discovered defect, not a pass. Complete production-source comparisons justify
only the specified unchanged native IME and Edge658 Send/Retry paths on final6f7;
new menu behavior and the Failed Edit correction have separate final observations.

Final Chrome6f7 verifies Failed Edit/version roundtrip and adjacent Rate/Report/
author paths with zero newPOST. On2026-11-16 the owner confirmed a full Chrome
quit/reopen. The original test tab was absent; a fresh native-exclusion tab had
zero app roots and empty sessionStorage. Before starting the app, all three
IndexedDB rows42/43/50 matched the guarded pre-quit baseline exactly under
canonical whole-row comparison. The real app then restored exact source50,
addressedpost5002, actor8, Signatureoff and unavailable localattachment intent,
with zeroPOST. This verifies durable installed-profile recovery independently
of the previous page session.

Chrome cleanup archived all rows/session, cleared interception, and compared every
field before deleting only the three known synthetic rows. The exact archived
task-session key was removed and the task tab closed; the reopened owner NewTab
was untouched. The empty database container remains. Local attachment bytes had
already become reselect intent during native guard navigation before quitting;
the restart is not claimed as their first loss.

All30 final owner screenshots are byte-identical to the earlier1ab review units.
On2026-11-16 the owner explicitly selected “Changes needed — I’ll describe them”.
Root has asked for specifics; details remain pending. Visual acceptance is
unchecked and no completion commit is authorized while these changes are
unresolved. The short-height recovery view can require ordinary reader scrolling
to expose an action below the retained banner; this is the recorded recovery
pressure, not a new claim that every control is simultaneously visible.

## Historical owner revision — implementation and qualification

On 2026-11-16 the owner requested full-column expanded editing with an icon toolbar,
removal of its redundant plus, and a popup for other-thread recovery beside a new
draft. Root approved that bounded presentation plan, preserving the exact editor
and existing choose/discard methods. Active-thread conflict panels remain inline.
No host, storage, schema or public API changed in this revision.

The first sealed revision is
`4fdd9a8eea08e41adf104d4612f08c01333d11fa65cae413cf76d3885e796632`.
Its 473-file source archive, 36-file distribution archive and independent offline
rebuild proof are preserved privately. All 36 emitted files matched; the 33 portable
library files remained identical to 6f7ebda. The review sheet has 36 screenshots:
1440/905/390px, 100/125% text, and board/reader/compact/expanded/recovery-entry/
recovery-popup units. The owner selected further changes needed on this sheet;
additional details are pending. Root owns the partial installed Edge qualification
and deliberately leaves the review tab untouched while the owner inspects it.
4fdd9a8 is historical and is not approved for completion.

The affected 127-case replay at `2026-11-16T03-41-49.779Z` passed 106 cases. Its
21 failures remain preserved. Most asserted the superseded simultaneous reader,
expanded plus, or automatic global recovery panel; their revised journeys keep
exact source, selection, undo, anchor and operation checks. One isolated process
restart invocation lacked its required candidate hash; replay with the explicit
hash passed. The 23-case replay at `2026-11-16T03-46-22.307Z` passed 20 and left
three pre-110 uncertain-send assertions. Those expected the obsolete Check result
button and original text in the successor draft; the actual ordinary-reply contract
uses Check reply status and immutable submitted text beside a new blank draft.

Correcting those legacy expectations exposed a real presentation regression:
expanded editing also hid ReplySends inside the reader. Five dedicated cases failed
on missing actual pending/rejected/uncertain controls at
`2026-11-16T03-48-02.155Z`. Root approved a CSS-only correction: the existing reader
uses display:contents when it contains submissions, its other children remain
hidden, and the same ReplySends node occupies a bounded scrollable area above the
same editor. No attempt component or state is duplicated or remounted.

Historical unsealed runtime was
`a2bc58dc9fc0cae90b0a91370db9faee34639d6c84a42c3a00b92e46859d6472`.
On this hash the three actual uncertain-send/source/visual-IME cases and two
existing exact reader-anchor cases passed in `2026-11-16T03-49-09.931Z`. The new
pending/rejected tests originally compared the editor from before Send with its
intentional post-Send successor; that observer was corrected to capture the
successor before presentation changes. At `2026-11-16T03-51-22.693Z`, both desktop
and narrow cases verified exact submitted/newer source, one POST, the retained
successor editor and submission nodes, and the same rendered reading line after
compact return. An earlier desktop baseline incorrectly scrolled past the short
synthetic article; the corrected baseline observes an actual visible paragraph.
The final focused-action replay at `2026-11-16T03-53-25.181Z` passes both widths
and verifies keyboard focus and action bounds inside the scrolling submission area
with the established one-pixel geometry tolerance. A strict 100% intersection assertion observed 99.929% at narrow width
because of fractional browser scroll rounding; that failed receipt is retained.

Typecheck, lint and format checks pass after fixing Vue attribute ordering. Earlier
failed lint output remains diagnostic history. At that stage broad replay, final source/evidence
seal, installed qualification and fresh owner approval awaited the remaining visual
changes. The later approved revision and current status are recorded below. No commit, issue closure, release or new
review is authorized at this point. The original 6f7ebda delivery and all earlier
seals are preserved unchanged; new revision evidence stays separate.

## Owner's toolbar and recovery revision

The owner subsequently approved one grouped ordinary-reply toolbar and requested
Ctrl/Cmd+Enter Send in both actual editor modes. Plain Enter and Shift+Enter now
insert newlines. IME/composition, repeated keys, key229 and parameter inputs retain
their non-Send guards. ADR0001 explicitly records this owner-authorized replacement
of #110's visual Enter shortcut. Nonreply authoring retains its Review policy.

The existing editor/session remains mounted. Reka Toolbar supplies roving keyboard
navigation and mode toggles; labelled Popovers group Text, Paragraph, Insert, Table,
Mentions and native Options. Attachments opens the same native file chooser. More
contains Preview, fresh form/account checking, addressed-to-ordinary conversion and
Return to reading. Parameter commands preserve selection, focus the actual editor
on success, and respect composition. Native invalid options open their Popover and
receive focus plus the existing accessible validation description. Ordinary Details
prose is removed. A compact nonreply Details visibility regression was caught by a
new full-app red and corrected without changing its existing actions.

The owner clarified that normal recovery diagnostics should disappear in every
authoring context. SourceWriting now shows recovery prose only for real failure;
acknowledgement/version/lifetime disclosure is absent on success. Genuine storage
refusal still blocks admission before POST and preserves current text. Explicit
conflict, attachment repair and submitted-outcome controls remain available.

Conflict cards preserve exact source and existing choose/discard/hold semantics,
while replacing raw JSON with board/thread, addressed author/post, human option
values and named attachment status/size. Same-source competing drafts that differ
only in options, target or file intent have independent whole-app choice tests.
No hidden form fields, auth tokens or durable context IDs are shown.

The expanded reader-visibility rule also hid existing conversation-status errors.
Desktop/narrow failure-first journeys reproduced the inaccessible real preparation
failure. The bounded CSS correction keeps that existing status region visible
beside ReplySends and the same writer; it adds no new status/state component. The
initial chained :not selector accidentally overrode the ReplySends exception;
its preserved failing receipt led to a single :not selector with both exemptions.

Historical d31dc4294847b8937564cf832c882c1e841785f6ece308e8e00b8b76a68ecb26
contains these presentation corrections. The independent offline build reproduced
all36 emitted files; all33 portable artifacts remained identical to6f7. Its userscript
is2,547,044bytes (542,108gzip), compared with pretoolbar a2bc's2,478,692bytes
(531,581gzip). The separate review sheet contains78 concrete captures at1440/905/390
and100/125% text, including seven open toolbar panels. Owner visual acceptance and
final installed-browser mapping remain root-owned gates.

The focused23-case d31 replay passed at2026-11-16T04-36-19.186Z. The subsequent
329-case advanced/editor/attachment/writing replay passed323 and failed6 at
2026-11-16T04-39-08.149Z: one removed successful Recoverydetails disclosure and five
obsolete schema5 expectations. The latter now require actual #111 schema6 while
retaining every original payload/history assertion. Success-prose waits have been
replaced with observations of actual IndexedDB head content and page-session
checkpoint; no application function is invoked. The canonical observer sorts object
keys to avoid false differences from JSON property order. Original failed receipts
and provisional archives remain preserved unchanged.

The scoped spec review then identified same-name/same-size uploaded attachments
whose uninserted server references and uploader identity differed while the normal
cards looked identical. Actual uploads88/89 under actors7/8 and stale independent
local removals produced the failure at2026-11-16T04-56-47.690Z. The root approved
conditional identity disclosure: compare files across displayed versions with the
same name/size/status, show reference only if it differs, and uploader only if it
differs. There is no durable or authority change. An initial fixture assumed both
owners' files were unavailable; actor9 made that premise explicit. A post-fix
reload race initially navigated before choice acknowledgement; the final journey
waits actual dismissal and the committed checkpoint before reload.

Current candidate:
`65ffae006c829de7efee552a48d70d8126b74423cbfc46ac59f1b2d96f0f4ff7`.
Only ReplyConflict.vue and localized layout strings changed fromd31. All36 emitted
files reproduce independently; all33 portable files are unchanged. The7-case replay
at2026-11-16T04-58-04.117Z passes three actual attachment identity/choice/reload cases
in English, Simplified Chinese and Traditional Chinese, two existing meaningful
chooser cases and two actual grouped list/Undo/table keyboard/reload journeys.

The broad365-case d31 invocation at2026-11-16T04-44-57.545Z passed304, failed15,
skipped3 absent-baseline cases and left43 unrun after its failure cap. The53-case
65ff follow-up at2026-11-16T04-59-22.759Z passed46 and failed7 stale assertions or
observer premises: legacy projection intentionally strips extra option fields,
other-thread recovery counts versions, and grouped actions wait for composition.
The consolidated65ff replay at2026-11-16T05-04-30.917Z used the exact preserved
#107/#108 baselines and completed699 cases:696passed,3failed, no skips. Two mention
journeys inspected toolbar presence before reply preparation completed; the helper
now waits for the real editor before selecting its group. Both pass five repeats.
The remaining risk-choice case reproduced one exact-CAS refusal in five diagnostic
repeats. Its screenshot truthfully asks for another choice; all versions and both
send records remain intact. The journey now observes either acknowledged dismissal
or this explicit stale result, verifies every observed version and unchanged send
registry, then allows one fresh deliberate choice. It waits for actual adoption
before changing editor mode. An intermediate premature-mode failure is preserved;
the final risk sequence passes ten repeats at2026-11-16T05-20-01.723Z. This does not
relax any production comparison or count an automatic retry as author intent.

The original61-case layout/viewport/tools matrix completed58passes and3obsolete
control/geometry failures at2026-11-16T05-21-22.740Z; the three focused corrections
pass at2026-11-16T05-24-05.948Z. The fourteen-width safe-area matrix now checks actual
visible characters while compact, then full-column expansion and exact compact
return. Expanded-preview cases require zero reader height and restored compact
history. All original source/selection, resize bounds and no-publication checks
remain. A preceding failure-capped run is retained rather than counted as complete.

The moved More action under native scale2 pinch required separating keyboard and
pointer evidence. Keyboard activation and viewport bounds passed first. Initial
native touch experiments used stale focus-return viewport offsets or incorrect
coordinate units and hit HTML rather than the control; their artifacts remain.
After the actual two-animation-frame viewport settlement, native touch in visual
viewport CSS coordinates reaches the real More button, opens its menu and passes
all original orientation/source/bounds assertions. The captured pointer/touch/click
paths prove the target. Runs2026-11-16T05-31-11.182Z and05-36-03.909Z both pass; no
pointer qualification is inferred solely from keyboard activation.

A further37 existing journeys touched by the control audit now all have passing
observations. Earlier failures exposed inherited assumptions already superseded by
#106/#110 or the approved full-column revision: source-first mode, the replacement
guard for independently retained replies, a separate Writing resize column, and
prepared ordinary publication review. Fixtures now select Source explicitly,
observe passive hidden source without requiring visibility, verify automatic
retained return, resize the remaining navigation columns, and use inert Preview
while retaining exact source/selection and zeroPOST assertions. The bottom-safe
results check no longer imposes an unrelated hidden-placeholder assertion; its
actual final-row safe bound remains unchanged. Normal recovery disclosure is
absent in nonreply editors while conflict, lost outcome, quota and financial
consequence assertions remain. Options popovers are deliberately dismissed before
switching editor mode. Runs05-24-32.798Z,05-31-46.901Z and05-34-26.527Z preserve all
intermediate failures; final passing observations include05-31-46.901Z,
05-34-26.527Z and05-36-03.909Z.

The final six-case run at2026-11-16T05-36-03.909Z also recaptures the meaningful
attachment-choice viewport in all three languages and verifies exact chosen and
retained identities through reload. All699 core cases,61 original presentation
cases and37 additional journeys map to passing65ff observations. These sets and
repeat runs overlap; their counts must not be summed as distinct requirements.
Production sources and all36 distribution outputs still exactly match the immutable
65ff seal and independent build. Current source/evidence are sealed separately;
no provisional archive, failed receipt or earlier installed attribution is replaced.
The exact-name revision audit preserves every case title and run, with parent
requirement mappings and explicit root-owned installed/visual gates.

## Owner single-mode and conditional-menu revision — 012ccb8

The owner requested one mode button, Visual by default, and then chose to simplify
the menu. Ordinary replies now expose the current-mode icon and a localized
next-action label/tooltip. Existing session mode survives presentation/navigation;
a fresh ordinary editor begins Visual, while unresolved recovery keeps its existing
Source safeguard. Nonreply controls and defaults are unchanged.

More contains Preview only in Source, Check only when the account is unverified or
a real nonlocal form preparation failed, and retarget only for an addressed reply.
It disappears when empty. Preview closes on leaving Source; closing the menu returns
focus to the editor, including when its last action removes the trigger. The direct
ordinary Return to reading action is removed. Compact reduces expanded writing and
keeps the composer beside the reader; it does not hide the composer.

A real permission-failure red showed that accountVerified alone cannot represent
form failure: the client verifies the actor before decoding the refused form. Root
approved a transient context-ID form-failure affordance. Existing sequence/context
guards reject late failures from an older context; successful checking/preparation
and context resets clear it. Local validation never sets it. This display signal
adds no storage field or publishing authority.

The focused complete-app run 2026-11-16T06-09-17.878Z passed31/31 on exact userscript
012ccb8d2b652319a20e9008066cb3c784ac886efbf59f80310d05c63ca1f4a1:
six owner units/78 named screenshots, six expansion/compact journeys, four exact
Ctrl/Meta Send variants, grouped navigation/selection, attachment/options/retarget,
composition guards, list/table editing, three locales, browser IME in both modes,
conditional menu/recheck/recovery and an awaited late-preflight context race.
Typecheck and scoped ESLint passed. Formatting-only test cleanup followed the run;
production bytes and runtime stayed unchanged. All original and intermediate reds
are retained, including the genuine missing Check after permission failure.

Root explicitly requested bounded qualification for this reversible revision.
The historical699/61/37 reconciliation belongs to65ff; it is not a fresh full-suite
pass on012ccb. The final bounded maintenance below reconciles affected qualified
ordinary-reply selectors; unqualified legacy suites remain explicitly outside scope.
The 65ff-to012 proof isolates four production files and byte-identical editor
handlers, submission/serialization/operation guards,45 host/client/editor/schema
files, and33 portable outputs. It does not claim writing.ts is wholly unchanged.
Native OS IME provenance remains attributed to the actual earlier candidates;
current automated browser composition checks are distinct. The final owner and
installed dispositions follow.

## Final affected maintenance and acceptance — unchanged012

The bounded run `2026-11-16T06-51-33.391Z` records140passes and1failure across141
selected cases. It covers the106 maintained case identities, the31 focused
mode/menu/owner cases, the account-during-send journey, and three nonreply
rich-upload controls for the shared helper. The remaining actual107-upgrade case
selected Source on an old editor just before clean remote adoption installed the
successor in Visual. Its failure snapshot preserves the exact successor text.
Waiting for that real visible adoption before selecting Source passed twice; the
third repetition exposed an earlier baseline-capture race. Uploaded Insert became
visible before the old browser checkpoint was acknowledged. The test now waits for
the existing native-storage acknowledgement before capturing the exact old session
and row. All checkpoint, fingerprint, parent, ownership and conflict comparisons
remain exact. The corrected case passed5/5 repetitions in
`2026-11-16T06-56-10.919Z`; no retry policy or production change was introduced.
The141-case receipt is not relabelled as141/141.

Ordinary Hide/Return and fixed bottom-resume assumptions now explicitly exercise
Compact beside the mounted reader, or actual parent-list/thread navigation where
hidden writing is required. One mode button uses localized next-action labels.
Account changes introduced by fixtures are observed through real native thread
Refresh; genuine cold recovery or actual form failure still exercises Check.
The same-owner attachment-disappearance case requires cold recovery because a
verified same-actor reader can retain its attachment proof. No helper silently
aliases absent Check to Send or internal application state. Mixed nonreply callers
keep their existing two buttons and Hide/Resume; all six rich-upload callers pass.

Cancel-pending retains six full stored-context snapshots. Its proposal leaves the
stored snapshot unchanged while revoking the prior in-memory revision. Parent-list
navigation persists that one increment; it creates no new authored mutation.
The same-thread return, Return to writing and awaited obsolete response preserve
that full navigated context exactly, including selection and revision. Original
failed probes remain in their original receipts. Browser short-height checks keep
the same visible-edge bounds but scroll the actual composer now owning the action.
Pinch testing explicitly refocuses More after Escape correctly restores the editor.
No production input, viewport threshold, permission or publication assertion was
weakened by maintenance.

The private `final-suite-mapping-012.json` preserves each original699/61/37 title
and prior attribution, mapping affected identities to fresh passes. The private
`final-parent-reconciliation.json` identifies all B1–B5, R1–R4, C1–C10 and Q1/Q2
observations with their exact runs/candidates. Earlier qualified unchanged paths
are reused through the preserved source/authority/timer/native-input proofs.
The unqualified legacy UI91 palette, UX62 mixed, UX59 frozen/invalidation, UX60 body,
J5 authoring-reply and UI88 composition contracts have zero entries in those mapped
sets and remain outside this gate. This is not a full repository-wide E2E pass.

The owner explicitly selected “Approve this appearance” for exact012 at
http://127.0.0.1:8770/ (question `call_1f401b6cb85542b4b23a5aea6c27e3c5`). Root's
final installed report seals18 Edge012 files and10 Chrome012 files. Both managers
read back every byte of the2,527,380-byte userscript. Both demonstrate Visual
default, one switch, no empty More, Source-only inert Preview, exact mode-change
source, actual form-refusal Check and focus restoration when the last action clears.
Chrome also recovers the exact draft after reload; Edge checks failed Edit and the
other-thread recovery popup. Both bounded final phases record zeroPOSTs.

The installed acceptance deliberately retains original attribution for Edgea7fe
native Visual/Source input and intercepted shortcuts, Chromed31 native Visual and
shortcuts, and earlier Chrome Source input. Interrupted fresh Chrome Source checks
are not passes. Edge startup cursor/interception gaps are explicit; continuous
zero-request observation is not claimed across startup. Earlier actual restart,
pending/account and clipboard observations are reused only at their documented
scope. Exact synthetic cleanup preserved genuine Edge1269763/1271508 drafts and
restored both owner tabs; Chrome's original URL/Settings/session were restored.
Tampermonkey Beta/stable equivalence follows the owner's explicit instruction.

The final source seal changes only22 E2E/helper files and this evidence ledger from
the approved012 seal. Every production/build input and all36 distribution files
remain byte-identical; the independent build remains valid. All33 portable outputs
are unchanged. Final typecheck, E2E ESLint/Prettier and whitespace checks pass.
The two final bounded production reviews and the22-file maintenance semantic review
report no actionable findings. The semantic reviewer independently confirmed exact
legacy checkpoint/row retention, observed remote adoption and the cancel-pending
revision persistence boundary. The final installed report includes this disposition.
Root's final package/staging inspection is the remaining commit-clearance step.

## Distinct trade-offs

1. A 64px content minimum keeps short-viewport writing usable but can require
   inner/outer scrolling and reduce simultaneously visible reading.
2. The compact input's 20%-of-visual-height cap gives focus and controls room under
   a short keyboard viewport, at the cost of showing fewer text lines. Its 44px
   minimum and 140px ceiling keep normal-size behavior bounded.
3. Safe-edge reconciliation preserves an exact reading glyph at a bounded offset
   when the previous offset cannot physically fit. This gives up impossible
   screen-position equality while retaining exact content and full visibility.
4. Integrated external HTTP replay and native storage observations give repeatable
   identity/request evidence but cannot prove native OS IME or installed manager
   behavior. Those remain separate installed-host gates. Schema-coupled row
   assertions inherit #111's already recorded storage-verification cost.

5. Accepted remote adoption invalidates obsolete queued captures. Current text
   therefore needs the existing post-adoption save and truthful failure handling,
   rather than replaying obsolete snapshots. This extends transient queue epochs
   without weakening authored-conflict comparisons or dropping owned outcomes.

6. Failed Edit can accept the latest cursor/local revision without creating another
   durable authored head. This adds a narrow comparison seam that must stay
   separate from live-capture equality and compatibility-normalized fingerprints;
   all future fields remain exact by default.

7. Per-page native filters add transient memory to the existing loaded range.
   This preserves exact source provenance for appended post menus without merging
   potentially conflicting page filters into the entry toolbar. Metadata must be
   replaced with its source page on refresh and retained with its cached range.

8. Final qualification reuses previously qualified unchanged real-timer cadence,
   backoff and visibility behavior, supported by exact source-region comparisons.
   This avoids repeating the unrelated release matrix, but does not provide a
   new wall-clock timing observation for the final bundle. Changed/integrated
   status, history, recovery and browser paths have separate final-candidate runs.

9. Expanded ordinary editing temporarily gives its full thread column to writing;
   compact/reading restores the mounted reader and exact visible line. Submitted
   outcomes retain a bounded scrolling area, so checking their longer source or
   lower actions can require scrolling within that area.
10. Common expanded tools use icons to reduce visual weight. Accessible names and
    tooltips preserve their labels, while new users may need hover/focus discovery.
    Grouping Text/Paragraph/Insert/Table/Mentions adds one reveal for commands;
    commands retain text labels inside their panels. One mode control reduces clutter
    but its current-mode icon and next-action tooltip require discovery.
11. Other-thread conflict/alternative versions require opening a counted recovery
    dialog. This frees space for the current thread and new draft, at the cost of
    one deliberate reveal. Active-thread versions remain inline. The zero-count
    trigger persists with the last outcome so closing the last discarded version
    can restore focus to a real control.
12. A 220px minimum for full editing prioritizes usable text area; short or enlarged
    views may scroll attachment/options controls. Only inherited toolbar padding
    was tightened, preserving controls and text scaling.
13. display:contents keeps the original submission/editor instances while separating
    status visibility from reading visibility. The CSS now depends on ReplySends
    remaining a direct reader child and conversation-status remaining its sibling;
    full-app failure visibility, focus, bounds and compact-return anchor checks cover
    this layout coupling.
14. Reka roving navigation and portalled grouped forms improve keyboard discovery
    while adding focus-return, selection and native validation exposure complexity.
    Group triggers wait for composition to finish. The toolbar revision adds about
    48,688 raw bytes and6,700 deterministic gzip bytes over pretoolbar a2bc. Conditional menu removal also needs
    explicit editor focus restoration when the trigger disappears.
15. Ctrl/Cmd+Enter makes Send consistent between source and visual modes but changes
    the learned visual Enter shortcut. Visible localized hints and ADR0001 describe
    the replacement; plain Enter and Shift+Enter remain text.
16. Quiet successful recovery removes visible save acknowledgements. Meaningful
    target/options/attachment cards replace diagnostic JSON; genuine failures stay
    visible and storage-backed E2E synchronization inherits trade-off4.
17. Otherwise-identical attachments expose a server reference and, only when
    ownership differs, an uploader identity. This adds a small presentation-only
    comparison across displayed versions so the author can make an informed choice;
    distinguishable entries and local-only files remain uncluttered.

18. Conditional More actions reduce routine clutter, but the menu contents and
    trigger vary with mode, target and actual recheck need. Preview requires Source.
    Verified ordinary replies no longer offer proactive manual account/form Check;
    it returns for unverified recovery or a genuine form failure. A same-owner file
    disappearance therefore needs cold recovery or another real recheck trigger,
    as demonstrated by the retained-attachment availability journey.
19. Removing ordinary Return to reading loses the direct hide-composer action.
    Compact still restores reading alongside the composer, as explicitly accepted.
20. A transient context-bound form-failure flag preserves a useful Check action
    after verified-account form refusal; guarded set/clear points add synchronization
    maintenance without changing durable state or permission authority.

All prior distinct choices remain recorded once in their child ledgers. No new
one-way architecture decision was introduced; root accepted the transient epoch
correction as enforcement of the existing exact-adoption contract.

## Acceptance and limits

- [x] Reconcile every parent ID against final candidate evidence and explicit reuse.
- [x] Complete combined cross-slice browsing/editing/recovery paths.
- [x] Verify account/conflict during send preserves writing and operation identity.
- [x] Collect concrete owner visual approval for exact012 at review8770.
- [x] Complete affected installed Edge/Chrome qualification on exact012 at the
      documented reuse scope; historical phases and observation gaps stay explicit.
- [x] Reuse only justified unchanged evidence; replay affected paths.
- [x] Seal repeatable source/build/runtime/request/screenshot artifacts.
- [x] Keep unverified gates explicit; do not edit/close95 or publish a release.

Windows qualification and manager-software-update observations remain deferred;
Tampermonkey Beta/stable are equivalent only under the owner's explicit instruction.
The historical global chooser pressure remains in the earlier evidence. Final012
appearance and affected installed paths are accepted; earlier native Source and
restart observations keep their original attribution. Repository-wide legacy test
reconciliation, Windows and manager-update qualification are not claimed. No release,
parent-spec edit or issue closure is performed by this implementation ledger.
