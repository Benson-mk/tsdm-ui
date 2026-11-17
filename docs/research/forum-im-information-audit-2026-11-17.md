# First-principles information audit: what earns space in each component

2026-11-17 · `research/improve-ui-ux-2026-11-17` · production baseline `8b04f4a`.
Follow-up to the [component audit](forum-im-component-audit-2026-11-17.md).
This is research and an implementation brief, not a production redesign.

## Product judgment

**The largest opportunity is to stop presenting every stage of an operation at
once.** The user needs different information while choosing, acting, waiting,
reading a result, and recovering. A completed form, a retained submission and an
operation's diagnostic record can all describe the same action, but they do not
all need equal prominence forever.

Ask of each element: **If this were absent in this state, what decision would the
member get wrong, and where else can they obtain the necessary information?**
If there is no concrete answer, it is a candidate for omission. If the answer is
troubleshooting, put it in details. If the answer concerns destination, consequence,
authority, failure or uncertainty, retain it at the decision point.

This test concerns application presentation. It does not license removing member
content, source-backed choices, accessible names, historical evidence or operation
safeguards. Reka 2.11.0 remains the interaction foundation; another primitive cannot
decide which facts matter to a member.

## Coverage and evidence

All **28 production render components** were reconsidered, plus the ten inline
workspace units below. Each has a member decision, minimum useful presentation,
state-dependent omission/defer/retain rules, counterexamples and failure-first
verification. Supporting strings, parent gates and CSS were inspected to avoid
mistaking source text for currently visible clutter.

- This document owns the eleven shared/reading components and inline workspace.
- [Writing and recovery](forum-im-information-writing-2026-11-17.md) owns ten.
- [Destinations and private conversations](forum-im-information-destinations-2026-11-17.md) owns seven.
- The [coverage/evidence record](forum-im-information-evidence-2026-11-17.json)
  maps all 28 to their report, preserves source hashes and records fresh replay.

Source facts are distinguished from proposals throughout. Three existing offline
complete-app Edge cases were rerun on the unchanged bundle: qualified page jumps,
confirmed rating, and a preset-reason report with an uncertain result. All three
passed. The first sandboxed attempt failed before any case ran because Edge could
not launch; its failed receipt remains separate. Screenshots from the successful
replay were visually inspected, confirming the result-stage presentation described
below. No new member study, live private inspection or consequential live action
was performed.

## Rules for removing information

| Treatment        | Required evidence                                                          | Example                                                 | Counterexample                                                         |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Omit             | Proven inapplicable or semantically identical information adds no decision | A second exact copy of a selected preset report reason  | A different submitted message, validation error or transformed payload |
| Defer            | Information supports inspection rather than the immediate decision         | Raw revision and reference inventory                    | A price, missing attachment or changed recipient before submission     |
| Make conditional | Its relevance is tied to a specific state                                  | Character count while composing an Other report         | An overlength preset still needs an explanation even without free text |
| Retain           | Removal creates ambiguity, conceals consequences or blocks recovery        | Unknown send result and Check status                    | Do not replace an uncertain result with generic success                |
| Add or clarify   | The necessary fact is currently missing or ambiguous                       | Thread title during expanded writing; active formatting | Adding guessed unread, delivery, sender or permission data             |

Known empty is different from not loaded, unsupported, unknown and missing. A
numeric zero may be a real setting, permission, price or score. A label saying
“default” does not prove an option is unimportant. Screen-reader structure and
labels do not become redundant merely because a sighted user can infer them.

## Eleven shared and reading components

### S1. WorkspaceBrand

**Decision:** identify this workspace and return through its brand link. The
[component](../../src/components/WorkspaceBrand.vue#L1) is a decorative SVG;
[the parent](../../src/layouts/WorkspaceLayout.vue#L2446) supplies TSDM text and
the link name. There is no redundant explanatory prose to remove here.

**Minimum:** recognizable brand and working named destination. Retain the palette
and single accessible name. Removing the name to save pixels would not resolve the
larger content hierarchy problems. **Verify:** identity and destination at narrow
widths and in each existing theme; the SVG must not create another focus stop.

### S2. WorkspaceIcon

**Decision:** recognize an action. [The SVG](../../src/components/WorkspaceIcon.vue#L49)
is already hidden from accessibility APIs; the control owns its name. No local
information should be deleted. At call sites, an unfamiliar icon may need more
visible context, particularly when narrow CSS hides its label.

**Minimum:** meaningful affordance, accessible name and visible state where needed.
Do not count `aria-label` plus visible text as two visual labels, or replace a
useful verb with another unexplained glyph. **Verify:** keyboard, touch and
uncoached destination recognition; reuse prior T9 and Reka tooltip trade-offs.

### S3. ColumnSeparator

**Decision:** resize a pane and recover its previous size. The [separator](../../src/components/ColumnSeparator.vue#L78)
has a name, current/min/max values, pointer behavior and keyboard adjustment;
those numeric values are programmatic, not a visible dashboard. No routine
information removal is recommended.

**Minimum:** discoverable handle/focus plus accessible value and orientation. Do
not remove its focus boundary because the design avoids decorative borders, or
replace it with a structural Reka Separator. **Verify:** pointer bounds, 10px key
steps, Home, Escape cancellation and reading anchors in `column-resizing.spec.ts`.

### S4. SettingsDialog

**Decision:** choose appearance and checking policy, understanding when changes
apply. [The dialog](../../src/components/SettingsDialog.vue#L80) already states
immediate preview/save; its raw preferences and reset warnings appear only during
incompatibility. They are not everyday clutter.

**Minimum:** named controls with current values, immediate-save explanation and
Close. Keep text-size percentage: the value matters. “Compact/default spacing”
also describes a real density change, so do not remove it as an internal metric.
The [baseline explanation](../../src/components/SettingsDialog.vue#L171) can lead
with the practical limit, “Earlier unseen content may not be counted as new,”
while exact boundary/filter mechanics sit in details beside the policy. Keep the
policy interval and active-only condition. About already has the correct low-
frequency home; it need not move to the reading surface.

**Counterexample:** “Column widths last for this page session and reset on reload”
explains a real limitation. “Changes save automatically” alone would conceal that
exception. **Verify:** normal preferences, unavailable storage, incompatible data,
checking unavailable and immediate value changes; retain the exact reset scope.
Reuse D-T3 for concise operational explanations.

### S5. ThreadTools

**Decision:** know reading position, choose another page, or perform a thread
command. The [page dialog](../../src/components/ThreadTools.vue#L203) repeats
the total in `pageLabel` and a separate total paragraph, uses “Choose a page returned
by the forum” unconditionally, and has both Cancel and a trailing Close.

**Minimum:** current position, separately labelled pending destination, explicit
Go/Cancel, and the relevant capability limit. A qualified `pageJump` supports
[unlisted pages](../../src/components/ThreadTools.vue#L86), so returned-link wording
is unnecessarily restrictive in that state. Trial “Choose a page; Go opens it.”
For unknown totals, retain the actual returned-page restriction. Do not remove the
current-page label simply because pendingPage initially equals it: after changing
the input, those values answer different questions.

Omit a second total only when it is the same qualified total; retain one dismissal
action if it remains reachable after long content. The separate empty-links
paragraph at [line 278](../../src/components/ThreadTools.vue#L278) should describe
an unavailable navigation path only after considering `pageJump` and history
targets, not merely `pages.links.length`. The slider and exact input are alternate
input methods, not redundant information.

The [options menu](../../src/components/ThreadTools.vue#L314) is already a good home
for mode and last-check time. “Newest baseline established” exposes an internal
term; attach the practical coverage limit when relevant rather than displaying it
as a perpetual achievement. Keep unavailable-check reasons and all source-backed
filters. Grouping costs remain in the prior component audit.

**Verify:** known/unknown/shrinking totals, sparse links, unlisted valid pages,
pending versus current values, cancellation and short-height dismissal. The fresh
`UI86.native-bounds` replay passed; it does not validate proposed copy changes.

### S6. PostActions

**Decision:** act on this exact post. The [four-action menu](../../src/components/PostActions.vue#L163)
already exposes only commands and meaningful unavailability. The visible menu
trigger plus right-click are two access methods, not duplicate information.

**Minimum:** Reply, author filter, Rate and Report with truthful capability states.
Keep “availability not verified” distinct from permission denied. A menu opened
deliberately is an appropriate place to explain why a requested action is disabled.
Do not delete those rows solely to make the menu shorter. The separate inline Reply
fast path is a workflow decision requiring task evidence before removal.

**Verify:** guest/member, missing source capability, unavailable author filter,
same actions from pointer/keyboard/touch, and no submission from opening the menu.
Existing `post-actions.spec.ts` is the seam; this pass did not rerun it.

### S7. PostPermalink

**Decision:** refer to or share this exact contribution. [The normal label](../../src/components/PostPermalink.vue#L70)
is `Post {database ID}`, while the parent separately shows floor. Apply prior T10:
one truthful ordinal/copy affordance where available, with exact identity retained.

**Minimum:** named target, copy action and actual completion feedback. The fallback
dialog, selectable URL and failure explanation are all necessary when clipboard
access fails. “Copied” is not superfluous: it answers whether the requested action
worked. **Verify:** missing ordinal, valid referral-free target, failed clipboard,
correct status and return focus. Do not invent floor numbers from array position.

### S8. RatingDialog

**Decision:** choose a score and consequences, then understand the result. The
[form](../../src/components/RatingDialog.vue#L97) repeats post ID in title and
description and supplies raw account ID; prefer a qualified human-readable target
while retaining exact identity on inspection. Actual score labels, ranges,
remaining allowance and Notify are decision-bearing. A zero score is not a reason
to hide an available score control before submission.

**New observed result-state issue:** the successful synthetic replay shows the
entire disabled form, unused suggested-reason selector, zero-valued score, and a
button still called **Cancel** beneath the confirmed result. The underlying
operation has already completed; the default visual hierarchy still describes
preparation. Trial a result-first receipt: “Rating confirmed,” target and actual
score changes, inspectable submitted details, and **Close**. Do not claim the
author received a notification simply because Notify was requested.

**Counterexample:** rejected/unknown outcomes require different explanations and
next steps; do not apply the confirmed summary to them. Keep original actor even
after account changes, and retain any relevant native notice. **Verify:** distinct
outcomes, no accidental retry, exact original submission, focused-control
continuity and Close semantics. `UX102.confirm` passed on this bundle; the screenshot
confirms current presentation, not user misunderstanding or redesigned usability.
Result-detail cost reuses W5; lifecycle-label cost is IS2 below.

### S9. ReportDialog

**Decision:** choose the reason and submit it to moderators; then know what is
established about receipt. [Preset selection](../../src/components/ReportDialog.vue#L51)
copies the reason into `message`. [The template](../../src/components/ReportDialog.vue#L88)
then repeats that identical text in a paragraph and displays a character count
even though the selected preset is not editable. Fresh replay confirms the visible
duplicate, `4 / 200`, the uncertain result and a trailing **Cancel**.

**Minimum before submit:** recognizable post, consequence, selected reason, Other
input when applicable, and explicit Submit/Cancel. Omit the duplicate paragraph
only while the selected preset exactly represents the submitted message. Show
the counter for free text and an actionable explanation for any invalid preset;
do not hide validation simply because the text was supplied by the forum.

**After submit:** put the actual outcome first and call dismissal Close. Preserve
the selected reason/source in a receipt, without the whole disabled choice list
dominating it. The tested server acknowledgement remains **uncertain** because
independent report status is unavailable; “Report sent” would be an unsupported
upgrade. “The forum may have received this report. It will not be retried; independent
status is unavailable” retains the practical meaning in fewer clauses.

**Verify:** preset versus Other, Unicode count/limit, changed source choices,
uncertain/rejected outcomes and zero duplicate requests. `UX103.builtin` passed.
Conditional-omission cost is IS1; result/dismissal costs reuse W5/IS2.

### S10. ThreadHistoryBoundary

**Decision:** understand whether more history exists and how to recover a failed
load. [The component](../../src/components/ThreadHistoryBoundary.vue#L16) already
omits unloaded state and distinguishes loading, retry, known end and unverified
coverage at the relevant boundary. It does not justify another global status panel.

**Minimum:** one accurate edge state and retry when actionable. Keep “Latest known
content” distinct from “Everything is current.” A concise “Earlier history unknown”
could be tested for comprehension, but do not eliminate the qualifier or create
freshness guarantees. **Verify:** both directions, reversed ordering, failure,
unknown coverage, delayed arrivals and unchanged reading anchors in history E2Es.

### S11. ContentView

**Decision:** understand the member's contribution and any rendering limitation.
The [renderer](../../src/components/ContentView.ts#L7) already consolidates repeated
unsupported-formatting descriptions when the parent enables it. It retains author
text and labels table/code overflow for keyboard access. Neither is app clutter.

The technical occurrence count in the [summary](../../src/components/ContentView.ts#L112)
can be secondary to a concise “Some formatting is unavailable” description, with
exact types/counts retained in details (existing W8). That is appropriate only for
the same formatting-only classification; permission, missing content, file or other
unsupported notices cannot be swept into it. A one-off notice and repeated notices
need separate fixtures; the current summary is not universal.

Native-continuation suffixes describe individual destinations. Removing them
globally because a header has a native link could hide where a specific link goes.
**Verify:** complete content preserved, repeated/unique formatting, tables, code,
external/native links and unavailable content in `reader-hierarchy.spec.ts` and
`downloads.spec.ts`. No removal of member-authored typography, rules or quotes.

## Ten inline workspace units

These need the same test even though they share `WorkspaceLayout.vue`.

| Unit and evidence                                                                            | Minimum useful information / proposed reduction                                                                                                                                                | Counterexample and verification                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Header and main destinations](../../src/layouts/WorkspaceLayout.vue#L2446)                  | Keep identity, current location and navigation. The “Main destinations” caption is a candidate for omission; retain landmark naming and actual destination labels.                             | Narrow icon-only navigation already needs clearer context (T9). Global native escape may target browsing rather than a retained reader: compare exact destinations before deduplicating local native links.                                                                                                                                                                                                |
| [Progressive drawers](../../src/layouts/WorkspaceLayout.vue#L2405)                           | Keep the drawer's title and Close; do not add instructional paragraphs about pane mechanics.                                                                                                   | Drawer content and docked content are teleported/reused, not necessarily simultaneous duplicates. Check all widths, Settings nesting and vanished trigger focus before removing anything.                                                                                                                                                                                                                  |
| [Board groups and directory](../../src/layouts/WorkspaceLayout.vue#L3226)                    | Board names/grouping and filter scope matter. “Choose a board to read its threads” can be omitted when the named destinations already communicate the action. De-emphasize generic stats (T7). | Descriptions may contain restrictions; do not trim them by length or assumed irrelevance. Filter result count is useful after a query; zero is meaningful. Preserve unknown-group handling and clear-no-matches recovery.                                                                                                                                                                                  |
| [Board heading and subordinate boards](../../src/layouts/WorkspaceLayout.vue#L3314)          | Identity first, statistics secondary; use prior T8 for long board/sub-board context.                                                                                                           | A subordinate board is a different destination. Required rules, entry restrictions and genuine announcements remain available at the relevant action.                                                                                                                                                                                                                                                      |
| [Thread rows and pagination](../../src/layouts/WorkspaceLayout.vue#L3473)                    | Apply T7: title, latest activity and local draft indicator lead. Keep current page and meaningful criteria. A category is omittable only if it adds no distinction in that actual list.        | Latest activity and original author are different facts. Missing latest metadata is not “no replies”; do not borrow original metadata. Preserve row shadows, exact targets, title access and anchors.                                                                                                                                                                                                      |
| [Board filter dialog](../../src/layouts/WorkspaceLayout.vue#L2271)                           | Applied criteria, pending change, replaced criteria and Apply/Cancel answer different questions. Keep them.                                                                                    | Apparently duplicate criteria cease to be duplicates when the member stages a replacement. Native combinations are not independent checkbox choices. Check Cancel/no-effect and no-match recovery.                                                                                                                                                                                                         |
| [Board checks and reader status](../../src/layouts/WorkspaceLayout.vue#L3341)                | Already conditional on activity, failure, arrivals or unavailable capability. Normal successful status is already quiet; no new omission is needed.                                            | [Global missing-context state](../../src/layouts/WorkspaceLayout.vue#L2707) always includes a search-credit explanation, even for non-search loss. `restoreHistory` can [set missing on Boards](../../src/workspace/index.ts#L1564). Scope that explanation to relevant search return/replay context, preserving notice/private effects where relevant. Keep storage failure and stale-content qualifiers. |
| [Post identity/footer/downloads](../../src/layouts/WorkspaceLayout.vue#L3776)                | Author, useful time, one ordinal/permalink and content. Footer Reply duplicates a menu access route, not necessarily wasted information; test before removing.                                 | Download/Save file are distinct prepare/delivery stages. The filename in an active download may be needed to distinguish targets. Do not rename “requested” to saved or remove paid/permission consequences.                                                                                                                                                                                               |
| [Forum draft list and operation panels](../../src/layouts/WorkspaceLayout.vue#L3063)         | “Forum drafts” plus a brief distinction from local replies; prioritize title, qualified board name and Resume. Apply W5 to settled favorite/draft attempt summaries.                           | Uncertain save candidate checks beside several rows represent possible matches, not duplicate submissions. Preserve explicit candidate identity, funded-draft consequences and independent packet/credit status. Do not auto-choose a row to shorten the screen.                                                                                                                                           |
| [Navigation guards and retained-writing resume](../../src/layouts/WorkspaceLayout.vue#L4050) | Affected writing, recognizable destination and Resume; show actual blocking conditions.                                                                                                        | Hidden editor does not remove its risk. Source/target/account/file/conflict warnings must remain reachable. Global and local alerts may describe different storage layers; do not merge solely because their wording resembles “unsaved.”                                                                                                                                                                  |

The account footer's [snapshot versus current-observation wording](../../src/layouts/WorkspaceLayout.vue#L2230)
is also essential context: a restored name is not proof of a currently signed-in
actor. It should not become another sender label beside ordinary Send.

## Counterfactual walkthroughs and implementation order

These are reasoned state experiments plus the three current fixture replays, not
participant results or a claim that proposed UI has been implemented.

| Experiment                                                | What the removal test establishes                                                                    | What must remain                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Select a preset report, then switch to Other              | Exact repeated preset message/count adds little when no text is editable; relevance changes in Other | Actual submitted meaning, validation and explicit Submit                             |
| Complete a rating                                         | Disabled preparation controls are no longer the primary task; Cancel describes the wrong stage       | Result, actual score changes, original actor, inspectable submission and Close       |
| Change pending page while reading page 2                  | Current and pending initially match but become distinct                                              | Both roles, truthful total/capability and explicit Go                                |
| Lose a Boards history entry                               | Unconditional search-credit instructions can be unrelated to the active recovery task                | What is missing, what Reload does, relevant effects and no automatic request         |
| Inspect a confirmed reply while it settles                | A compact result is useful, but sudden collapse can interrupt selection/copy                         | Focus/selection continuity and deliberate access to exact source (IW4)               |
| Finish a private review, then switch peer/account         | Consumed review and retained attempt may repeat exact content                                        | One inspectable immutable record, original identity, mandatory pre-send review (ID1) |
| Compare identical reply text with different targets/files | Text equality does not establish equivalent meaning                                                  | Distinguishing destination/options/attachment facts before Continue                  |

Implement in reviewable slices, after writing failure cases:

1. Remove only proven empty/identical presentation and correct result-stage
   dismissal labels. Include report preset/Other, known/unknown page bounds and
   irrelevant recovery copy. Preserve the existing controls' operations.
2. Redesign settled-operation summaries and consumed review handoff, verifying
   exact historical identity and focus/selection continuity before hiding details.
3. Reduce routine operational prose and adjust directory/list metadata hierarchy;
   preserve action-adjacent consequences and state-dependent exceptions.
4. Validate contextual editor tools, recovery urgency and recognition with members.
   Do not use expert inspection to declare that fewer visible choices are faster.

For any subsequent implementation, preserve the existing palette, approved row
shadows, protected edge-to-edge content, full-column expanded writing, Ctrl/Cmd+Enter
and forum/private domain distinctions. Use native disclosure for document details,
Reka Dialog for bounded decisions, menus for commands and Popover for tool forms.
No new storage model, automatic request, wrapper framework or architecture is chosen.

## Trade-offs, acceptance and evidence limits

Inherited choices retain their owners: [T6–T10](forum-im-cpo-audit-2026-11-17.md#trade-off-ledger),
[W1–W9](forum-im-writing-components-2026-11-17.md#experiment-order-and-additional-trade-offs),
[D-T1–D-T4](forum-im-destination-components-2026-11-17.md#distinct-proposal-trade-offs),
and [Reka guidance](reka-component-guidance-2026-11-17.md#bounded-follow-up-checks-and-distinct-trade-offs).
The new companion ledgers own IW1–IW4 and ID1–ID2. Two additional shared proposals:

| ID  | Choice                                                                                                                          | Benefit                                                                                               | Cost / limit                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| IS1 | Omit proven identical/inapplicable output using explicit state predicates, rather than moving every fragment into another panel | Removes zero-decision reading work without adding disclosure controls                                 | Predicates must track changing source forms, unknown states and context; an incorrect classification can conceal material information  |
| IS2 | Change operation dialog presentation and dismissal wording with its lifecycle                                                   | Makes completed/uncertain outcomes understandable and avoids suggesting cancellation after submission | Adds state-specific copy/translation and transition checks instead of one uniform form/label; focus and submitted meaning must survive |

No costly-to-reverse decision was made. Source review, bounded fixture replay and
research-only delivery reuse earlier T2–T5 method trade-offs. No full suite,
installed-host or user-comprehension pass is claimed.

- [x] Reconcile all 28 render components and ten inline workspace units.
- [x] Give state-specific keep/omit/defer rules, counterexamples and verification paths.
- [x] Check source/parent/CSS gates and correct false duplication claims.
- [x] Preserve source-backed consequences, identity, uncertainty and recovery semantics.
- [x] Replay three selected complete-app cases and retain both launch failure and successful rerun.
- [x] Check report links, source identity, evidence manifests and document formatting.
- [x] Record each additional proposal trade-off once; make no production edits.

Successful run: `evidence/runs/2026-11-17T06-52-56.406Z/`; launch-failed run:
`evidence/runs/2026-11-17T06-52-12.969Z/`. The machine-readable companion contains
case names, replay command and hashes. Candidate SHA-256 remains
`8db22dbd2a00a7d6ecbd237047a466e2bb6478e43f4d9aa35da603010f5f20f6`.
Available Node 26.0.0/npm 11.12.1 differs from pinned 24.22.0/11.21.1; the existing
bundle was tested without rebuilding. Earlier 12 passing component cases and the
separate obsolete no-shadow baseline failure retain their original scopes.
