# Writing and recovery: information that earns its place

2026-11-17 · application baseline `8b04f4a` · research only.
This deepens the [ten-component writing audit](forum-im-writing-components-2026-11-17.md)
by asking what each visible fact lets a member decide **now**, rather than whether
it accurately describes implementation. All ten components were inspected again,
including conditions, parent placement and relevant CSS. Recommendations below
are source-backed hypotheses, not newly observed usability improvements.

## Decision rule and constraints

Keep information visible when it identifies the intended content/destination,
changes the consequence of the next action, explains a real block, or distinguishes
outcomes the member must act on differently. Defer exact supporting evidence when
a summary is sufficient; omit only a known irrelevant or genuinely repeated fact.
Do not replace unknown, unavailable or unresolved with “none.” A fact can move
between these categories as the state changes.

The [accepted ownership and Send rules](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md#explicit-ordinary-reply-send--110)
and [recovery rules](../adr/0003-use-browser-page-session-recovery.md) remain intact.
Ordinary replies retain direct Send, Ctrl/Cmd+Enter, full-column expansion and no
sender label beside Send. Nonreply review, original historical actors, independent
outgoing attempts and explicit conflict choices retain their meanings. Reka owns
interaction mechanics; it cannot decide whether evidence is sufficient to hide a
warning or declare success. No architecture, schema or production behavior changes.

## 1. PostEditor — explain the command that can work on this selection

**Decision / smallest adequate presentation.** “What am I editing, what formatting
will change, and how do I send?” Keep the active editor, its accessible name,
mode-switch meaning, reachable tools and the established shortcut guidance. In a
parameter form, show its label, value, accepted-value guidance and Apply. Tool
labels are useful information, not clutter to replace indiscriminately with icons.

**What the source actually shows.** The reply toolbar has one mode switch; the
nonreply fallback has separate Visual/Source buttons. The controls are already
hidden in compact writing with tools closed ([template](../../src/components/PostEditor.vue#L553)).
The shortcut is associated with the editor and shown in its tools/expanded surface
([association](../../src/components/PostEditor.vue#L56),
[hint](../../src/components/PostEditor.vue#L916)). Do not claim these are permanent
extra rows in every composer.

**Deeper reduction candidate.** The Table popup simultaneously presents rows,
columns and Insert, followed by an operation selector and Apply
([Table controls](../../src/components/PostEditor.vue#L651)). The latter operations
require a table selection; failure currently produces “Select a table cell or a
rectangular group of cells…” ([handler](../../src/components/PostEditor.vue#L116)).
Trial distinct **Insert table** and **Edit selected table** sections, showing
selection-dependent controls only when their prerequisite is established or
keeping them disabled with an explanation. Do not remove the whole Table entry
outside a table: insertion remains a valid job. Do not assume document focus alone
proves a rectangular selection. This is a new experiment, not a reproduced bug.

**Retain / counterexample.** Protected markup, conversion failure, ambiguous input
and field validation are separately gated ([messages](../../src/components/PostEditor.vue#L920)).
They can refer to different problems. A single generic “Something went wrong”
would erase the appropriate remedy. Merge repeated notices only after proving they
refer to the same cause and action. Mention result IDs can distinguish similar
names; do not delete them globally to reduce technical text. Formatting
selected/mixed state is presently missing information, covered by W1; guidance for
parameter values is W2, and local mention feedback remains W9 after global feedback
has been checked.

**Failure-first verification.** Begin outside a table, inside one cell, across a
rectangular selection and in Source; verify which commands remain available and
that returning from the popup preserves selection/undo. A table failure must
explain the actual prerequisite without publishing. Verify simultaneous protected
content plus invalid input still gives both distinct remedies. Reuse
[advanced editor](../../tests/e2e/advanced-editor.spec.ts) and
[integrated toolbar cases](../../tests/e2e/integrated-ui-ux.spec.ts).
Trade-offs: existing W1/W2/W9; new IW1 below.

## 2. SourceWriting — a compact normal path, explicit exceptional paths

**Decision / smallest adequate presentation.** “What am I answering, what have I
attached, and can I send?” Keep the destination when surrounding reader context
is absent, addressed author/excerpt when applicable, editor and Send. Show actual
blocks near the relevant control. The reply-target strip's quote insertion and
remove-target actions are distinct; neither is redundant with Send.

**Avoid a false cleanup.** The recovery summary function contains success and
pending strings, but its visible section is gated to unavailable/problem states
([summary](../../src/components/SourceWriting.vue#L218),
[render gate](../../src/components/SourceWriting.vue#L545)). It does **not** display
“saved successfully” continuously merely because that string exists. Likewise,
More is conditional, Preview is Source-only, and Check is need-based
([More](../../src/components/SourceWriting.vue#L769)). Retain these existing choices.

**Omit / defer / condition.** The optional Source preview repeats a long statement
about rendering, notification delivery and publication
([preview](../../src/components/SourceWriting.vue#L831)). A candidate concise lead is
“Local preview; the forum may render it differently.” Keep explanation of inert
links/media and protected source available beside preview. If BBCode is disabled,
explicitly identify the literal view; do not present literal syntax as a renderer
failure. This narrows explanation to the member's current inspection decision,
without making a new claim about sending. It reuses W8.

Attachment repair text is conditional and consequential, not general documentation.
Reattach can replace exact references even inside quoted/code examples; local
removal and immediate server-file removal have different effects
([repair](../../src/components/SourceWriting.vue#L1591),
[server removal](../../src/components/SourceWriting.vue#L1560)). Keep the relevant
consequence adjacent to the chosen action. A state-specific next action and
separate repair paragraph are already W4; do not hide the disclosure in a generic
Help menu. A file name alone is insufficient when Selected, Uploaded, Referenced
and Unavailable demand different next steps.

**Counterexample / timing.** An account change, failed storage acknowledgement or
missing attachment can arrive while writing is compact. Simplification must let
the new block become visible at that moment, while preserving the text and focus.
The presence of a warning is not permission to replace the current writing or
retry an operation. The current normal reply's full WritingDestination is visually
hidden by its parent ([placement](../../src/components/SourceWriting.vue#L478));
adding a recognizable expanded destination is T6, not deleting an existing visible
ID block.

**Failure-first verification.** Start with no attachments/no problems and confirm
there is no empty instructional reservation. Then introduce unavailable bytes,
unknown upload, server-removal uncertainty, storage refusal and a target outside
the current reader. Each needs its own truthful next action without losing writing
or causing a request by disclosure alone. Reuse
[reply layout](../../tests/e2e/reply-layout.spec.ts),
[shared replies](../../tests/e2e/shared-replies.spec.ts) and
[attachment authoring](../../tests/e2e/attachment-authoring.spec.ts).
Trade-offs: T6, W4 and W8; no new distinct choice.

## 3. ReplyToolbarPopover — retain orientation inside an overlay

**Decision / minimum.** “Which group did I open, and how do I return to writing?”
The wrapper contributes one heading, trigger name and slotted controls
([wrapper](../../src/components/ReplyToolbarPopover.vue#L35)). Keep the heading:
its trigger is an icon, and an opened overlay benefits from a visible identity.
Reka's accessible linkage does not make that visible identity unnecessary.

**No-removal judgment.** Table/Mentions templates contain legends matching the
popover title, but [CSS already hides the legends](../../src/styles.css#L3622).
They are not two visible headings to remove. Separately verify fieldset naming
if touched; this audit does not claim the hidden legend names it in every
accessibility tree. The wrapper contains no persistent operational essay or
empty success message. Most information reduction belongs to its slot owner.

**Counterexample / verification.** Keep the title and parameter label distinct:
“Text formatting” names the task group while “Font” names a field. With keyboard,
zoom and a narrow viewport, verify the open group is identifiable and Apply,
Escape and outside focus preserve their different return paths. Reuse
[explicit-reply keyboard cases](../../tests/e2e/explicit-replies.spec.ts).
Existing Reka focus/tooltip trade-offs apply; no new reduction is selected.

## 4. WritingDestination — one identity summary per decision boundary

**Decision / minimum.** “Where will this content go, and whose operation am I
reviewing?” Prefer known board/thread/recipient names, addressed author and an
exact target link. Preserve a trustworthy ID fallback where names are missing or
ambiguous. The component currently has no thread-title prop, so a future title
must come from verified metadata rather than reconstructing it from an ID
([component](../../src/components/WritingDestination.vue#L45)).

**Defer / condition.** Board ID repeats a known board label; raw account ID often
repeats a recognizable account name. Move those into inspectable details where
identity remains unambiguous. Keep original actor/destination available in history,
and visible when an account mismatch changes eligibility. A title alone is not a
unique destination. Ordinary Send still gets no sender label.

**Actual contextual duplication.** Expanded nonreply writing can contain the
compact destination at the top and another review-style destination before action
controls ([second placement](../../src/components/SourceWriting.vue#L1420)). These
may orient different points of a long form. Consolidate only if the same target
is available at the point of action without a long scroll. Once review exists,
its frozen destination is not interchangeable with the editable context above it.
Private composition/review similarly needs its recipient bound to each decision;
never deduplicate just because two strings happen to match now.

**Counterexample / verification.** Use two similarly named threads, edit versus new
thread, an account switch, an addressed post and a retained operation belonging to
a different destination. Ensure the user can identify the exact target before
acting, without confusing historical actor with current actor. Preserve unchanged
submission authority and test [frozen review](../../tests/e2e/prepared-review.spec.ts).
Trade-offs reuse T6/T10 and W5; no new technical boundary is needed.

## 5. InertSourcePreview — do not subtract authored information

**Decision / minimum.** “Does this source express the content I intend?” This
component is almost entirely the interpreted content, with names for scrollable
code/table regions and protected-content labels
([renderer](../../src/components/InertSourcePreview.vue#L13)). It has no standalone
heading or explanation to remove. Those belong to its parents.

**No-removal judgment.** Keep authored text, complete tables, code and protected
source. Scroll-region labels, hidden-block meaning and source preservation support
comprehension and access; they are not decorative metadata. A blank preview can be
truthful when source is blank, so avoid adding a generic “preview successful” badge.

**Counterexample / verification.** An unusual BBCode block may look verbose because
it is intentionally retained literally. Shortening it can hide meaning or suggest
that the forum will discard it. Verify nested formatting, long code/table overflow,
BBCode-off parent rendering and unchanged source. Reuse
[prepared review literal/overflow cases](../../tests/e2e/prepared-review.spec.ts).
The explanation-placement cost is already W8; no new removal proposal.

## 6. PreparedPublication — review consequences before internal inventory

**Decision / minimum.** For a current review: “Is this the exact content and set of
consequences I authorize?” For retained history: “What did that earlier operation
submit?” These are different jobs using one renderer.

**Source-backed excess.** Every rendering includes “Prepared publication review,”
a revision number, all options, and two attachment-reference lines even when both
are empty ([template](../../src/components/PreparedPublication.vue#L45)). Select
values append raw machine values to labels ([formatter](../../src/components/PreparedPublication.vue#L35)).
The body and long generic caveat come after this inventory. These are actual
rendered sections, unlike the SourceWriting success strings.

**Omit / defer / retain.** Lead with destination, body, material settings and the
appropriate explicit action supplied by the caller. Defer revision number and raw
reference/option encoding. Omit a zero-attachment summary only when the frozen
model establishes no uploaded references, source references, file rows, attachment
fields or unresolved attachment issue; an uploaded file absent from the source is
a discrepancy to inspect, not “none.” Never suppress a setting merely because its
value is zero/false: free price, permission level, BBCode-off, subscription and
notification choices can change meaning. Source-backed defaults must be understood
before any default-only collapse. Keep passphrases masked.

**New framing distinction.** In retained history the current heading still calls
it a review ([historical use](../../src/components/RetainedPublicAttempts.vue#L74)).
Trial “Submitted content” there, preserving the frozen body/options and removing
any implication that reading it authorizes a fresh publication. For current review,
use action-specific “Review new thread” or “Review changes” only when the caller
provides the actual operation. This is IW2; no new approval step is proposed.

**Counterexample / verification.** Include an empty-attachment case, attachment
references without known filenames, uploaded but unreferenced files, paid content,
BBCode disabled and an unknown/nonstandard source option. Current review must show
what will change; historical inspection must show what did get submitted. Editing
the live context afterward must never mutate either frozen display. Reuse
[prepared-review](../../tests/e2e/prepared-review.spec.ts) and funded-draft cases.
Trade-offs: W5/W8 plus IW2.

## 7. ReplySends — presentation depends on outcome and what the user is doing

**Decision / minimum.** “Which reply is this, did it arrive, and what can I do?”
Keep a recognizable submitted-content identity and a truthful outcome. Exact source,
original actor and destination remain inspectable. The current component exposes
all of them plus a URL field/status check regardless of status
([status/source](../../src/components/ReplySends.vue#L54),
[unconditional verification form](../../src/components/ReplySends.vue#L231)).

| State                                                 | Information that should lead                                        | Information that can be secondary                                |
| ----------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Sending                                               | Submitted content, Sending, ability to write the next reply         | Repeated explanation that Sending is not confirmation; exact IDs |
| Confirmed without exceptional differences             | Confirmed result and Open post                                      | Original source, actor ID, verification URL input and checks     |
| Awaiting moderation                                   | Moderation outcome and available checking path                      | Full source inventory, provided it stays accessible              |
| Rejected / not sent                                   | Specific reason and eligible Retry/Edit actions                     | Technical evidence supporting the reason                         |
| Unknown                                               | Explicit uncertainty, Check status and preserved submitted identity | Candidate-URL entry until needed, with a discoverable route      |
| Confirmed with merge/normalization/effect differences | The actual difference and its consequence                           | Only unrelated inventory                                         |

This does not merge distinct domain states. A generic status message may add a
reason not present in the heading; inspect it before treating it as duplicate.
An original account name matters especially after switching accounts, because Retry
and Edit do not have identical eligibility. An exact submitted source is also the
only visible content when the forum has not supplied a corresponding post.

**Timing matters.** If the member is selecting submitted text or entering a
candidate URL when a background result settles, do not suddenly collapse that
focused inspection. Apply the concise summary when it is not disrupting an active
inspection, or leave its opened details open. Keep completion perceivable and
focus stable. This adds IW4 to W5, and does not authorize automatic deletion,
history expiry or silent dismissal.

**Counterexample / verification.** Test pending→confirmed while a later reply is
being typed, pending→unknown after recovery, moderated and merged outcomes,
rejected edits with newer writing, account change and focused URL/source
inspection during result arrival. Verify exact original source/actor and zero
unrequested sends. Reuse [pending replies](../../tests/e2e/pending-replies.spec.ts).

## 8. ReplyConflict — repeated context can shrink; differences cannot

**Decision / minimum.** “Which retained meaning do I want to continue?” Keep both
sources, meaningful target/options/files differences, the effect of choosing, and
distinct Continue/Discard actions. A removed-draft version is an explicit choice,
not an empty source to omit.

**Deeper candidate.** Each card repeats thread ID in its first line and again with
the board label in its context; the whole comparison already concerns one row
([cards](../../src/components/ReplyConflict.vue#L100),
[context](../../src/components/ReplyConflict.vue#L145)). Group a trustworthy shared
thread heading once, then emphasize per-version differences. Each action still
needs a distinguishable accessible name and correct captured version. Common
options may be available in shared details only after comparing exact meaning;
matching text does not prove matching targets or files.

**Retain / counterexample.** The component already exposes uploader/reference IDs
selectively when otherwise similar file rows differ
([comparison rule](../../src/components/ReplyConflict.vue#L64)). Do not classify
those numbers as universally superfluous: they distinguish versions that otherwise
look identical. “Other versions are kept,” a hold preventing discard, and the
specific destructive confirmation remain decision-relevant. No timestamp,
position or more-successful-looking outcome should become a recommended winner.

**Failure-first verification.** Same text/different target; same filename and
size/different server reference or uploader; same source/different options; explicit
removal; unresolved send hold; competing version arriving during choice/discard.
The reduced view must expose the difference before commitment and preserve exact
choice semantics. Reuse [conflicting replies](../../tests/e2e/conflicting-replies.spec.ts).
This deepens W6, rather than introducing another comparison trade-off.

## 9. ReplyRecoveryDialog — a count is not an urgency signal

**Decision / minimum.** “Is there another thread whose versions I need to inspect?”
Keep a named entry point, the scope (other threads), distinguishable versions and
completed-resolution feedback. The count sums conflict variants **and** safely
retained alternatives ([count](../../src/components/ReplyRecoveryDialog.vue#L23)).
Consequently “4” does not mean four unsent replies, four threads or four failures.

**Condition / defer.** W7 already calls for count units and recognizable thread
labels. Go further: distinguish **needs a choice** from **kept alternatives** inside
the dialog, and avoid treating their combined count as a universal urgent badge.
A candidate neutral trigger is “Saved reply versions · N”; an actual conflict can
be identified separately using the existing conflict classification. Do not invent
an unread model, auto-discard alternatives or require every retained version to be
resolved. This is IW3.

**Retain / counterexample.** Zero does not mean the dialog can immediately vanish.
Its [lifetime condition](../../src/components/ReplyRecoveryDialog.vue#L75) deliberately
retains the open dialog/resolution and its focus destination. A member who resolved
the final item still needs acknowledgement and a stable Close action. Also retain
the active-thread exclusion; copying its already-present conflict UI into this
dialog would add confusion rather than useful redundancy.

**Failure-first verification.** Mix two conflicts and retained alternatives across
threads; resolve the last conflict while alternatives remain, then remove the last
allowed alternative while focus is inside. Verify truthful units, no invented
urgency, stable result feedback and no mutation of active writing. Reuse
[other-thread recovery cases](../../tests/e2e/conflicting-replies.spec.ts).

## 10. RetainedPublicAttempts — keep public history distinct inside private writing

**Decision / minimum.** “What earlier public operation still matters while I am
writing privately?” This component is mounted inside
[PrivateWritingContent](../../src/components/PrivateWritingContent.vue#L119), not as
another unconditional ordinary-reply panel. Its source/option inventory is already
inside native details, and Check only appears for uncertain/moderation outcomes
([template](../../src/components/RetainedPublicAttempts.vue#L52)). Do not report it
as having ReplySends' always-visible verification form.

**Defer / retain.** The repeated long heading can become a compact specific label,
such as “Earlier public post” or “Earlier Forum draft,” when supported by the
actual operation, with its original destination and state adjacent. Preserve the
public-versus-private distinction; removing it would make historical public content
look like part of the current private message. Keep native continuation because
its fallback can be the original board, draft or thread, not necessarily a
confirmed post. “Open published post” would therefore be false in some cases.

**Counterexample.** Packet state and credit rows are independently observed; their
explanation appears only when a packet result exists
([packet section](../../src/components/RetainedPublicAttempts.vue#L81)). A thread
confirmation is not proof of refund or packet closure. Keep material distinctions
visible and supporting ledger rows in the existing details. Generic “Done” would
lose the reason this historical surface exists.

**Failure-first verification.** Enter private writing after an earlier public
attempt; verify original actor/target and public label survive. Check a retained
Forum draft versus actual publication, uncertain packet/credit result, absent
confirmed URL and read-only status checking. No original Check may resubmit.
Reuse [prepared-review](../../tests/e2e/prepared-review.spec.ts) and
[private writing](../../tests/e2e/private-writing.spec.ts).
Trade-offs reuse W5 and IW2; no additional dialog or generic history subsystem.

## Distinct additional trade-offs

Existing ledgers remain authoritative: [T6/T10](forum-im-cpo-audit-2026-11-17.md#trade-off-ledger),
[W1–W9](forum-im-writing-components-2026-11-17.md#experiment-order-and-additional-trade-offs)
and [Reka focus/primitive choices](reka-component-guidance-2026-11-17.md#bounded-follow-up-checks-and-distinct-trade-offs).
The source-only evidence scope reuses T2/T5 and the prior method limits. Do not
count the same benefit/cost again merely because a second component uses it.

| ID  | Additional proposal                                                             | Benefit                                                          | Cost / limit                                                                                                                     |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| IW1 | Present table editing commands according to established selection prerequisites | Avoids unrelated command choices and teaches the valid next step | Adds selection-dependent presentation; operations may be harder to discover, so insertion and explanations must remain reachable |
| IW2 | Frame a current review differently from historical submitted-content inspection | Makes authorization versus evidence clear in a shared renderer   | Requires explicit caller context and maintained labels; shared content must remain the same immutable snapshot                   |
| IW3 | Distinguish conflicts needing choice from merely retained alternatives          | Prevents a count from implying false urgency or failure          | Adds categories/summary work and requires clear units when both coexist                                                          |
| IW4 | Preserve an actively inspected outgoing-attempt view when its result settles    | Avoids losing focus, selection or entered candidate URLs         | Concise presentation may be delayed; requires transient view state and completion feedback                                       |

These are reversible proposals. No one-way technical decision or advisor gate is
selected. No unit/E2E tests, application edits or consequential live actions were
performed in this study. Previous browser observations and twelve passing selected
E2Es retain their original candidate and scope; they are not fresh pass evidence
for any proposal here. Future changes must first enumerate the failure cases
above, then preserve complete-app screenshots, focus/source observations and
request ledgers. Inventory coverage: **10/10 named components**.
