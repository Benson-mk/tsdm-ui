# First-principles information audit: destinations and private conversations

2026-11-17 · research parent `d315626` · application baseline `8b04f4a`.
This deepens the [seven-component assessment](forum-im-destination-components-2026-11-17.md).
Every finding below comes from current source, including parent conditions and
localized strings. None is a new live-private observation or a fresh E2E pass.
Recommendations change presentation only; they do not select a new interaction,
storage or forum-operation contract.

The test is: **what decision becomes harder if this information is absent here?**
Omit only what is known to be inapplicable or equivalently represented. Defer
inspection detail. Show a condition when it changes the user's interpretation or
next action. Preserve consequential uncertainty even when it makes the view less
minimal. A source field with no value does not prove a semantic default.

None of these seven components directly imports Reka. Native links, labels,
disclosures and existing shared editor components already fit most of these jobs.
Reka would support an eventual options surface; it cannot decide what information
is relevant. Existing [Reka guidance](reka-component-guidance-2026-11-17.md) and
[ADR0001](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md) still govern
interaction and domain ownership. Private composition retains the page-session
contract in [ADR0003](../adr/0003-use-browser-page-session-recovery.md).

## 1. SearchView

**Decision:** what should I search for, what will submission cost, and which result
matches the submitted criteria? The smallest adequate view is a labelled form,
explicit Search, applicable restrictions/costs, and results identified by the
criteria that actually produced them. Results need a title, useful match context
and destination; a board label can be essential in a cross-board search.

**Source finding.** The [heading and explanations](../../src/components/SearchView.vue#L67)
remain above results even in secondary presentation, where the form is absent.
The [effective-criteria mapper](../../src/components/SearchView.vue#L51) enumerates
every returned field, falling back to raw field names/values and “Forum default.”
The [result summary](../../src/components/SearchView.vue#L137), empty-result
sentence, full criteria list and page number then precede rows. The template
proves the arrangement, not that the server's summary always duplicates the
empty-state sentence. [The parent](../../src/layouts/WorkspaceLayout.vue#L3158)
passes secondary mode while a thread is open; [CSS](../../src/styles.css#L894)
does not hide this introductory copy on desktop.

**Treatment by state.**

- **Before submission:** retain current restrictions and the credit/quota effect.
  “Editing criteria does not run a search” can become short form guidance rather
  than a permanent introduction above subsequent results.
- **Results unchanged:** prioritize “Results for…” using effective criteria;
  defer the complete field inventory. Preserve any criterion that materially
  narrows or orders the results. Do not label criteria from the currently edited
  form as the result's criteria.
- **Edited after submission:** retain a visible distinction, for example “These
  results use your previous search. Submit to apply your changes.” The existing
  [changed predicate](../../src/components/SearchView.vue#L45) supplies this fact.
- **Secondary reading:** form instructions can recede; submitted criteria,
  pagination effects and a route back to editing still matter. No control reveal
  or focus should rerun a search.
- **No matches:** keep the actual empty result and a way to revise criteria.
  Consolidate with the source summary only if they are proven to say the same
  thing; do not discard an opaque summary that might contain restrictions.

**Counterexample.** Empty or “default” criteria can still restrict search. The
[field model](../../src/forum-client/types.ts#L395) has values and capabilities,
but no semantic “irrelevant default” flag. Raw-name fallback signals a presentation
gap, not permission to drop the criterion or guess its meaning. Missing results
also do not mean zero matches. Keep the existing unsent/effective distinction.

**Failure-first verification:** in [search.spec.ts](../../tests/e2e/search.spec.ts),
compare effective versus edited criteria through thread open/return, an unknown
field, a disabled field, no matches, a source restriction and a credit-bearing
submission. Verify exact request counts, no request on disclosure/focus, and
retained board/snippet context. Reuse D-T1/D-T3 for the costs of concealed criteria
and shorter guidance; no semantic default classification is selected here.

## 2. FavoritesView

**Decision:** reopen a saved destination, distinguish it from similar records, or
remove the saved reference. The minimum is an identifiable saved kind, destination,
useful authored note, selection and deliberate removal access.

**Source finding.** “Saved boards and threads” already appears only before data
loads; the loaded Threads/Boards heading supplies different information. Do not
call those simultaneous duplicate headings. [Each record](../../src/components/FavoritesView.vue#L48)
renders a title, optional unavailable explanation, time, optional note and a Remove
favorite action. The [parent](../../src/layouts/WorkspaceLayout.vue#L3170) hides this
component for a board target and routes removal into preparation. This is not an
immediate deletion button.

**Treatment by state.** Before load, use one Saved heading and clearly named
Boards/Threads load choices. After load, make the selected kind unambiguous and
reduce repeated “Load saved…” wording only if deliberate loading remains clear.
Prioritize the destination and note. A saved date is secondary; if shown, identify
it as saved-time rather than suggesting it is the thread's latest activity. Keep
the exact date inspectable. Move removal to a named secondary action only when
the final interaction justifies its extra step.

**Counterexample.** An unavailable destination still represents a saved record.
Its explanation and removal path are useful, not empty-state clutter. An authored
note may be the user's only reason for recognizing a record; never hide notes by
the same rule as incidental metadata. The current empty copy says “No favorites
on this page”; shortening it to “Nothing saved” would overclaim across pagination.
Two otherwise identical saved targets can have different record identities: no
deduplication or title-based removal follows from this presentation proposal.

**Failure-first verification:** exercise unavailable/removable records, identical
titles with different notes/IDs, an empty later page, long notes, and returning
from a saved board/thread in [favorites.spec.ts](../../tests/e2e/favorites.spec.ts).
Verify the exact record removal, its confirmation and a surviving focus target.
Trade-offs reuse T7 for secondary metadata and D-T2 for secondary actions.

## 3. NoticesView

**Decision:** inspect a notice and knowingly choose a request that can affect
unread state. The minimum is Notices, the active category, actual notice bodies,
time/destination, pagination, and a concise effect disclosure beside requesting
controls.

**Source finding.** [The opening block](../../src/components/NoticesView.vue#L25)
always includes “Notices,” “Load notices deliberately,” an overview explanation
and the effect paragraph, even after notices are loaded. The latter paragraph
does essential work: [its wording](../../src/layouts/strings.ts#L424) covers load,
refresh, category and page requests, including failed requests. It is not
equivalent to the overview's explanation that opening the local view makes no
request. The [native-tool footer](../../src/components/NoticesView.vue#L79)
also remains regardless of state.

**Treatment by state.**

- Before load, retain one title, Load notices, and “Loading can mark notices read,
  even if loading fails.” Keep the available native escape.
- Once loaded, omit the obsolete “Load notices deliberately” subheading and move
  local-view/background-polling explanation into help. Keep a concise statement
  covering Refresh, category and page actions; a load-only warning is insufficient.
- For observed unread data, use snapshot wording such as “Forum reported N unread”
  with the limitation that the request may already have changed it. Do not turn
  it into a current live badge.
- For absent/uninterpretable data, a short visible “Unread count unavailable”
  can carry the common user implication. Details must preserve whether no
  indicator was returned or interpretation failed. Neither state is zero.
- Keep actual failures and source empty-state messages. Move the broader
  explanation of broadcast/native capabilities into a clearly named secondary
  region, with its actual links still accessible.

**Counterexample.** Category navigation appears in the workspace, a narrow picker
and inline links, but [responsive CSS](../../src/styles.css#L903) intentionally
changes their availability. Multiple source declarations do not prove three
visible copies. The extra effect paragraph in the workspace's
[missing-snapshot branch](../../src/layouts/WorkspaceLayout.vue#L2707) belongs to
recovery; it is not an unconditional duplicate to delete.

**Failure-first verification:** cover null/loading/loaded/error, observed zero,
observed nonzero, absent and uninterpretable unread state in
[notices.spec.ts](../../tests/e2e/notices.spec.ts). Preserve evidence after failed
requests; check category/page behavior at each responsive width and no request
on help disclosure. The copy/depth cost remains D-T3, not a new unread policy.

## 4. MessagesView

**Decision:** which peer should I open, and what changes when I load the list or
open that conversation? A useful row contains one primary peer link, preview,
time, actual unread cue and available secondary continuation.

**Source finding.** [The initial block](../../src/components/MessagesView.vue#L22)
has Messages, Private conversations, list-load effects and conversation-read
effects. Every [peer row](../../src/components/MessagesView.vue#L38) repeats the
name in the heading, “Read private conversation with…” link, and the native link.
The list and conversation effects are distinct: list loading may clear a prompt;
opening a peer may mark that conversation read. They cannot be merged into a
generic “Messages are marked read” statement.

**Treatment by state.** Keep the navigation destination name and express its
private scope once. Put list-load effects next to Load/Refresh and a concise
conversation-read consequence near peer navigation. Link the peer's name instead
of adding a second prose sentence containing it. Keep a full accessible link
name. Put native continuation among secondary actions. On reload, preserve the
explicit Load state and explain the missing previews there; repeating storage
lifetime prose over every already-loaded list is unnecessary.

**Counterexample.** The preview is not evidence of who sent it. The
[peer model](../../src/forum-client/types.ts#L167) supplies peer identity, preview,
time and unread, but no latest-sender field. Do not add “You:” or a sender avatar
by inference. A false unread flag is not a delivery/read receipt. Never replace
the peer with the last sender or silently revive private previews on reload.
Names can collide; retain exact destinations and provide identity detail where
needed for disambiguation.

**Failure-first verification:** cover a sent-last conversation, duplicate names,
unread absence, reload, account change, failed list load and return to the same
peer in [messages.spec.ts](../../tests/e2e/messages.spec.ts). Verify shortening the
row does not alter links, private effect disclosures or focus/selection.
Trade-offs reuse T7, D-T2 and D-T3.

## 5. PrivateConversationView

**Decision:** who am I speaking with, what did each person say, what history is
available, and is there new content or a retrieval problem? Minimum normal
presentation: one private/peer heading, messages with truthful sender/time, a
writing entry point, relevant history edges and arrivals.

**Source finding.** [The heading](../../src/components/PrivateConversationView.vue#L33)
shows “Private conversation” followed by “Private conversation with [peer].”
This duplicates the context noun. Below it, the template always renders the check
effect paragraph and passive mode status; earlier/later controls and history
completeness live above the reading body. Refresh failure can generate both a
generic retry/cooldown status and a detailed failure message. Those can differ in
meaning, so repeated error appearance is not proof that either is redundant.

**Treatment by state.** Express “Private · [peer]” once, retaining a complete
accessible heading. Defer refresh policy/timestamp to options and put applicable
read effects with the controls. A checkbox already expresses automatic on/off;
do not repeat that same normal state as a separate status paragraph. Keep active
checking, paused-with-consequence, retry cooldown, actual failure and new-arrival
actions understandable. Compose a concise reason plus available next step instead
of stacking a generic failure and the same reason if they are demonstrably equal.
Move completeness/earlier/later information to the relevant history edge.

The [message database ID link](../../src/components/PrivateConversationView.vue#L150)
can become a named secondary permalink action. Do not invent a sequential floor:
the [private model](../../src/forum-client/types.ts#L176) supplies no ordinal. Keep
sender and time until grouping has a demonstrated comprehension benefit; raw-ID
demotion does not justify deleting authorship context.

**Counterexample.** “All known messages loaded” is conditional on both boundaries;
unknown history must never become “Beginning of conversation.” A missing requested
message remains actionable. A hidden automatic-control label does not mean the
member can safely be told checks are enabled. Refresh can itself have a read
effect even when automatic checks are off.

**Failure-first verification:** partial history, true end, missing target, paused
checking, cooldown, late arrivals and different failure messages in
[private-history.spec.ts](../../tests/e2e/private-history.spec.ts) and
[private-updates.spec.ts](../../tests/e2e/private-updates.spec.ts). Verify stable
anchors and no request from options/focus. D-T4 owns the policy/edge relocation
cost; T10's exact-identity demotion applies without assuming public ordinals.

## 6. PrivateWritingContent

**Decision:** is this the right recipient, can this exact text be sent, and what
happened after Send? The minimum is recognizable private destination, plain-text
editor, applicable limit, validation/recovery exceptions, and the existing
explicit review/send progression.

**Source finding.** [Normal writing](../../src/components/PrivateWritingContent.vue#L38)
shows a Private message title, WritingDestination, a complete unsupported-feature
sentence, the maximum-length paragraph and a recovery-status paragraph. There is
then a separate immutable review with another destination and exact source.
Two destinations are not inherently redundant: they identify current writing
and approved text, which have different authority.

There is a stronger lifecycle-specific duplication. The
[review branch](../../src/components/PrivateWritingContent.vue#L78) remains mounted
when consumed, with full source, destination, consumed explanation and disabled
Send. [sendPrivate](../../src/workspace/writing.ts#L1473) sets consumed before
dispatch, appends the immutable attempt, and after completion clears publishing
without clearing privateReview. [PrivateAttemptHistory](../../src/components/PrivateWritingContent.vue#L119)
then also presents that attempt. This is source-proven presentation overlap, not
a newly measured viewport problem.

**Treatment by state.**

- **Editing:** combine capability and length guidance near the field, for example
  “Plain text only · Maximum N characters” when the bound is known. Keep details
  of unsupported features available. Retain recipient and account meaning.
- **Acknowledged recovery:** reduce routine acknowledgement to quiet, accurately
  scoped information. Any wording must still say page session, not imply durable
  saved drafts or cross-account private sharing. Failed/pending acknowledgement
  must remain perceptible with its existing protective action.
- **Unconsumed review:** retain exact text, recipient, effects and explicit Send.
  Do not remove review because ordinary replies use direct Send.
- **Consumed review with corresponding retained attempt:** trial a compact
  transition to that attempt's outcome/inspection, retiring the obsolete disabled
  Send and duplicate full review. Preserve a clear return-to-writing action and
  meaningful focus destination. Hide only when the exact original submission is
  available through its retained attempt; neither status nor matching text alone
  proves that correspondence. No domain deletion is proposed.

**Counterexample.** Removing a consumed review immediately could move focus or
leave a dispatch without inspectable evidence. A failed recovery acknowledgement
must not resemble success. The shared [parent state](../../src/components/SourceWriting.vue#L90)
sets its public context to null for private writing; its public
PrivateAttemptHistory and this child's history are not two simultaneous copies.

**Failure-first verification:** use delayed sends, not-sent, unknown, confirmed,
changed recipient/account, storage refusal, immutable-review priority and keyboard
focus cases in [private-writing.spec.ts](../../tests/e2e/private-writing.spec.ts).
Record exact original source/recipient and POST count before and after collapsing
consumed presentation; inspection never resends. See new ID1/ID2 below.

## 7. PrivateAttemptHistory

**Decision:** did this particular private message get stored, to whom, and what
can I safely do next? The minimum is original sender/recipient, truthful outcome,
original-text inspection, appropriate Check and original continuation.

**Source finding.** [The component](../../src/components/PrivateAttemptHistory.vue#L21)
already keeps full source behind details, shows Check only for uncertain outcomes,
and conditionally discloses that checking may mark read and will not resend.
These are successful information choices. Do not propose adding those conditions
as if they were absent. The remaining low-priority fields are the recipient's raw
ID in the heading and revision number in the disclosure label.

**Treatment by state.** Keep names and outcome first. Use “Original message” for
the disclosure, with revision and exact identity inside when needed. Keep original
actor visible if the user has switched accounts; never substitute the current
actor or current peer. Shorten the native continuation label only when its
historical destination remains unambiguous. For confirmed storage, preserve the
distinction from delivery/read status; for uncertainty, retain the actual reason
and Check consequence. No generic Retry is added.

**Counterexample.** This component also appears in public writing to carry older
private attempts. A short “Open conversation” link or unnamed outcome can point
to a different recipient from the active editor. It therefore needs more context
than a current-conversation message. Raw IDs remain a valid disambiguation fallback
when names are absent or ambiguous. Multiple identical texts still represent
different attempts; do not merge them by their visible source.

**Failure-first verification:** retain original actor/recipient/source through a
peer or public-writing switch, repeated equal text, unknown-to-confirmed checking,
reload and concurrent newer text in
[private-writing.spec.ts](../../tests/e2e/private-writing.spec.ts). Check only the
original destination, never repeat POST, and avoid duplicate announcements when
the originating review presentation retires. Exact-inspection/identity costs
reuse W5 and T10.

## Distinct trade-offs and verification boundary

Existing trade-offs are reused rather than counted again:
[T7/T10](forum-im-cpo-audit-2026-11-17.md#trade-off-ledger) cover secondary metadata
and exact identity; [D-T1–D-T4](forum-im-destination-components-2026-11-17.md#distinct-proposal-trade-offs)
cover criteria, secondary actions, contextual effects and private policy/history
placement; [W5](forum-im-writing-components-2026-11-17.md#experiment-order-and-additional-trade-offs)
covers summary-first outcomes with exact inspection.

| ID  | Additional proposal                                                                                                  | Benefit                                                                     | Distinct cost / limit                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID1 | Retire the consumed private-review presentation only after its exact submission is represented by a retained attempt | Removes an obsolete Send control and duplicate full review after activation | Requires an exact correspondence rule, a stable focus transition and preserved inspection during delayed or failed operations; presentation retirement cannot discard evidence or authorize another send         |
| ID2 | Quiet routine private recovery acknowledgement while retaining its page-session scope                                | Reduces repetitive status during typing                                     | Members may mistake silence or a short “saved” label for durable persistence; first-use/help wording and failure/pending states must communicate the actual lifetime without borrowing ordinary-reply guarantees |

All seven components were inspected with parent gates, source models and relevant
strings. Each has a minimum presentation, removal/defer judgment, counterexample
and failure-first verification path. No production changes, tests, private reads,
social writes or irreversible decisions were made. Existing browser/E2E evidence
from the earlier audit remains tied to its original candidate and scope; it does
not validate the proposed reductions. Future implementation must establish that
members can still explain destinations, effects and outcomes after information
is shortened or moved.
