# Destination and private-conversation components

Research date: 2026-11-17. Source baseline: `028b3ed` on
`research/improve-ui-ux-2026-11-17`. This note covers all seven assigned destination
components. Findings are **source observations and design hypotheses**; no live
private content was inspected and no listed E2E was rerun by this subtask.

The principal opportunity is consistency of information hierarchy. Public reading
now keeps passive controls quiet; private reading, Messages and Notices still
present substantial operational explanation before the user's content. Simplify
their presentation while retaining truthful disclosure at the action that can
have an effect. Search can consume credits/quota; notice requests can mark read;
private-list loads can clear prompts; private reads can mark a conversation read.
These distinctions are explicit in [localized product copy](../../src/layouts/strings.ts#L174)
and are not interchangeable with a harmless local view switch.

## Reka fit and ownership

None of these seven files imports Reka UI directly. Their native forms, links,
checkboxes, buttons, `<details>` and live regions remain useful primitives.
`PrivateWritingContent` composes the shared `PostEditor`; it does not own a second
editor. The layout wires destination events to workspace actions
([WorkspaceLayout.vue:3158](../../src/layouts/WorkspaceLayout.vue#L3158)).

Reka should supply interaction behavior where the proposed interaction needs it:
an action menu, a check-settings popover, or genuine mutually exclusive panels.
It does not supply request authorization, private-data lifetime, read-state
authority, visual density, or the right content hierarchy. Preserve the
[forum-client/workspace/layout boundary](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md)
and [private versus ordinary-reply recovery distinctions](../adr/0003-use-browser-page-session-recovery.md).

One consequential trap: installed Reka `2.11.0` defaults Tabs to automatic
activation; its trigger changes the selected value on focus. This is directly
visible in installed `src/Tabs/TabsRoot.vue:38–41,64–67` and
`src/Tabs/TabsTrigger.vue:69–75`. A future tab-like category UI must not turn arrow
focus into a search or notice/private read. Keep actual navigation as links, or
explicitly use manual activation when a real tab-panel pattern is justified.
Do not replace native selects merely to make all controls Reka-branded.

## D1. SearchView — distinguish criteria from results

**Current contract.** The native form renders source-backed text, select,
radio/checkbox groups, read-only/disabled constraints and maximum lengths. Loading
disables controls. Effective submitted criteria remain separate from edited
criteria, with an explicit status when they diverge. Secondary reading presentation
hides the form but retains results, effective criteria and pagination
([SearchView.vue:45](../../src/components/SearchView.vue#L45),
[form:73](../../src/components/SearchView.vue#L73),
[results:131](../../src/components/SearchView.vue#L131)).

**Design direction.** Keep the primary search field and explicit Search action
prominent. Trial an “Additional criteria” disclosure for supported secondary fields,
with active criteria summarized when closed. After submission, show a compact
“Results for…” summary and a clear Edit criteria action. Preserve visible credit or
quota consequences before submission and the distinction between unsent edits and
the displayed results. This is a presentation hypothesis: dynamic form fields
cannot be safely classified by guessed names or positions.

**Reka/accessibility.** Native `<form>`, `<fieldset>/<legend>`, labels and selects
already express the job. A native disclosure is sufficient for one additional-
criteria group; Reka Collapsible is optional if controlled state is needed. Retain
the input boundary, focus ring and native multiple-selection semantics. Do not
implement search-as-you-type. Result layout currently scrolls to its heading; that
is not itself a screen-reader result announcement
([layout:2186](../../src/layouts/WorkspaceLayout.vue#L2186)). Verify announcement and
focus rather than claiming them from scrolling.

**Failure-first evidence.** Extend `J3.search-overview`, `search-submit`,
`search-native-controls`, `search-readonly`, `search-pages-return` and
`J11.search-pending` in [search.spec.ts](../../tests/e2e/search.spec.ts#L74).
Check hidden active criteria, unsent-edits confusion, Enter duplication, long
source labels, 320px reflow and return focus. Do not regress current-form validation
or passive Back/Forward/reload.

## D2. FavoritesView — make saving and removal unequal in emphasis

**Current contract.** Saved kinds are two “Load saved…” buttons; the loaded kind is
identified by the section heading. Records expose title, unavailable explanation,
time, optional note and a repeated Remove favorite button. Missing targets can
remain removable, and selection is retained by favorite-record identity
([FavoritesView.vue:29](../../src/components/FavoritesView.vue#L29)). Remove only
emits intent; the layout calls `prepareFavorite`, not immediate deletion
([layout:3180](../../src/layouts/WorkspaceLayout.vue#L3180)).

**Design direction.** Keep the destination title primary, with notes and time
secondary. Give the current saved kind a visible and programmatic selected state.
Trial a quiet per-record action menu for Remove, preserving unavailable records
and the existing preparation/confirmation flow. Do not turn “Remove favorite” into
“Delete thread,” or add bulk deletion as incidental cleanup.

**Reka/accessibility.** A Reka DropdownMenu is appropriate only if secondary record
actions are grouped; its trigger needs the record's name and focus must return to
a surviving record/control after removal. A true Boards/Threads tab interface is
possible with manual activation and explicit loading/error states; native buttons
with clear current-kind state are a smaller option. The current two controls do
not declare `aria-pressed`/tab selection; the loaded heading supplies context.

**Failure-first evidence.** Reuse `J9.saved-navigation`, `favorite-responsive`,
`favorite-unavailable-record`, `favorite-last-page` and `favorite-uncertain` in
[favorites.spec.ts](../../tests/e2e/favorites.spec.ts#L65). Verify keyboard menu
entry/escape, retained selected record, last-row focus and exact removal identity;
opening a menu must not prepare or perform an effect.

## D3. NoticesView — put attention ahead of loading machinery

**Current contract.** The view renders Notices, “Load notices deliberately,” two
explanations and Load/Refresh before entries. Loaded state distinguishes observed,
absent and uninterpretable unread information; category/page destinations are actual
links. Rich notice bodies stay inert through `ContentView`
([NoticesView.vue:25](../../src/components/NoticesView.vue#L25)). Category controls
already adapt between sidebar, native picker and inline navigation
([layout:2566](../../src/layouts/WorkspaceLayout.vue#L2566),
[styles:903](../../src/styles.css#L903)); absence from one local component does not
mean the feature is missing.

**Design direction.** Keep the deliberate initial Load state. Once loaded, use one
primary title, a concise read-effect disclosure adjacent to Refresh/category
actions, the active category and content. Move longer scope/native-tool explanations
into a named details region. Preserve unknown unread wording; never translate
“unknown” into zero or invent a live unread badge. Do not hide actual failures.

**Reka/accessibility.** Category/page links are appropriate navigation. Reka Tabs
is not an automatic upgrade, especially if focus activates a read. Native details
can hold background explanation; failure/status changes need a tested announcement.
The article's stable ID and programmatic focus target support return navigation
([NoticesView.vue:57](../../src/components/NoticesView.vue#L57)).

**Failure-first evidence.** Reuse `J10.notices-deliberate-complete`,
`notices-effects-*`, `notices-return-remount`, `notices-layout-*` and
`notices-responsive-categories` in [notices.spec.ts](../../tests/e2e/notices.spec.ts#L287).
Assert zero requests on local reveal/focus, truthful partial/unknown information,
complete notice bodies and identical category/page behavior at every width.

## D4. MessagesView — make the peer the navigation target

**Current contract.** Before loading, Messages shows a private-conversation heading,
list/read-effect disclosures and Load. Every peer then has name, time, preview,
source-backed unread wording, a long “Read private conversation with…” link and a
second native-conversation link. Selection belongs to the peer, not the most recent
sender ([MessagesView.vue:22](../../src/components/MessagesView.vue#L22)).

**Design direction.** Trial a conventional peer row: name and time first, preview
second, genuine unread cue clearly separate. Make the peer name the primary link
with a full accessible name. Move native continuation into a secondary action while
keeping it available for each peer. This reduces repeated phrasing without inventing
avatars, presence, delivery or unread information. The shared title/activity density
cost is already recorded in the [CPO ledger, T7](forum-im-cpo-audit-2026-11-17.md#trade-off-ledger).

**Reka/accessibility.** Keep the list as ordinary links/articles, not a Listbox:
opening a private conversation is navigation and can mark it read. Use Reka
DropdownMenu only for actual secondary actions; preserve a real anchor via
`as-child` and avoid nesting buttons inside the primary link. The selected peer
must remain discernible without color alone.

**Failure-first evidence.** Reuse `J75.messages-native-peers`,
`messages-sent-last-peer`, `messages-transient-reload`, `messages-returned-paging`
and `messages-network-retry` in [messages.spec.ts](../../tests/e2e/messages.spec.ts#L216).
Add long names/previews and keyboard/touch target checks. Preserve intentional loads,
account clearing and the rule that private previews do not reappear automatically
after a new document.

## D5. PrivateConversationView — the largest consistency opportunity

**Current contract.** The persistent heading includes peer identity, read-effect
copy, automatic-check checkbox, check-effect explanation, passive mode/status,
Refresh, possible failure, reserved timestamp space, arrivals, earlier/later
controls, history-completeness text and native escape
([PrivateConversationView.vue:33](../../src/components/PrivateConversationView.vue#L33)).
Unavailable checking uses `visibility: hidden`; the timestamp has a minimum height
([styles:2260](../../src/styles.css#L2260)). Unlike the public reader's quieter
controls, this hierarchy retains passive information in the reading header.

**Design direction.** Trial a compact peer heading and a dedicated private-options
surface. Put the two-minute policy and read-effect disclosure with its opt-in;
keep failures/retry/new arrivals visible near the reading context. Put genuine
earlier/later boundaries beside their respective history edges. Preserve private
semantics rather than directly reusing a public ThreadTools model. Source confirms
the structural difference; its actual viewport cost needs fixture/browser evidence.

**Reka/accessibility.** Reka Popover fits a short settings form containing a native
checkbox and explanation; a menu checkbox fits only if its interaction semantics
match the final design. Use the established ShadowRoot portal and safe-area bounds.
Escape/focus return and a newly appearing failure must not move the reading anchor.

**Failure-first evidence.** Reuse `J76.private-pages`, `private-missing-target`,
`private-delayed-writing-*` in [private-history.spec.ts](../../tests/e2e/private-history.spec.ts#L185),
and `J78.private-check-policy`, `private-check-failure`,
`private-outer-return-*`, `private-follow-visible-*` in
[private-updates.spec.ts](../../tests/e2e/private-updates.spec.ts#L498).
No hidden read, automatic reenabling, false completeness or public/private ID
collision is acceptable. Do not claim this proposal is already mobile-qualified.

## D6. PrivateWritingContent — preserve a distinct sending contract

**Current contract.** The view names the private destination, explains plain-text
limitations and maximum length, reports page-session recovery acknowledgement,
and pauses sending when actor/recipient checks are missing. It composes one plain
`PostEditor`; expansion and validation explicitly refocus that editor. Prepared
review displays the exact text and a separate Send action with consumed-review
handling ([PrivateWritingContent.vue:19](../../src/components/PrivateWritingContent.vue#L19),
[review:78](../../src/components/PrivateWritingContent.vue#L78)).

**Design direction.** Retain visible recipient and private context. Group capability
and maximum-length guidance near the text field; distinguish routine retention
information from an actual unsaved failure. A concise acknowledged-state treatment
can be explored, but private page-session recovery must not inherit the ordinary
reply's durable-storage promise. Keep the explicit review/send policy: ordinary
reply one-step Send does not authorize changing private messaging.

**Reka/accessibility.** Native input/review structure is sufficient. Reka cannot
replace exact-text review, recipient binding or IME safeguards. A new modal review
is not justified by library availability; it would change focus and reading context.
Keep validation linked to the editor, and avoid announcing successful retention
on every keystroke without a screen-reader check.

**Failure-first evidence.** Reuse `DESIGN.private-entry`, `J77.private-field-errors`,
`private-review-recovery`, `private-language-layout`, `private-composition` and
`private-storage-refusal` in [private-writing.spec.ts](../../tests/e2e/private-writing.spec.ts#L201).
Verify recipient/source preservation, truthful retained/unsaved status, review
consumption and zero send from Enter/IME confirmation.

## D7. PrivateAttemptHistory — keep recovery inspectable

**Current contract.** Each immutable attempt names original sender and recipient,
shows an outcome status, provides original text under native `<details>`, offers
Check only when uncertain, and links the original private conversation. The check
disclosure states that it may mark read and will not resend
([PrivateAttemptHistory.vue:10](../../src/components/PrivateAttemptHistory.vue#L10)).

**Design direction.** Retain this recovery pattern. Give its outcome a concise
human-readable heading and keep the appropriate next action adjacent; original
text remains inspectable. Distinguish this historical actor/destination from the
currently edited message. Do not introduce a generic Retry button or infer delivery
or read receipts from stored-content confirmation.

**Reka/accessibility.** Native details and a named Check button are adequate. No
new dialog is needed. Verify that multiple status regions do not produce confusing
announcements as an old attempt changes while newer text is being edited.

**Failure-first evidence.** Reuse `J77.private-uncertain-recovery`,
`private-delayed`, `private-pending-reload`, `private-peer-guard` and
`J78.private-uncertain-original` in
[private-writing.spec.ts](../../tests/e2e/private-writing.spec.ts#L426). Check the
original recipient/source survives a peer switch and later edits; result checking
must never repeat the POST.

## Distinct proposal trade-offs

These supplement the existing CPO/source-research ledgers; inherited research
limits, row-density choices and destination-context costs are not counted again.

| ID   | Choice                                                                  | Benefit                                                                        | Cost                                                                                                                     |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| D-T1 | Collapse supported secondary search criteria, retaining active summary  | Shorter initial form                                                           | Hidden active criteria can be misunderstood; source-backed classification and explicit reveal are required               |
| D-T2 | Put infrequent record actions/native continuation in a menu             | Gives opening/reading greater emphasis                                         | Adds a reveal action and focus-return work; keep frequent primary navigation direct                                      |
| D-T3 | Separate concise action-adjacent effects from longer explanatory copy   | Reduces repeated operational prose without removing informed action            | Copy must still disclose distinct search/read effects at every relevant entry; generic reused wording could become false |
| D-T4 | Move private policy controls into options and history controls to edges | Gives actual private messages more room and aligns public/private presentation | Adds reveal/focus/collision handling and anchor sensitivity; private policy and completeness remain separate             |

The native-control versus Reka-adoption trade-off is recorded once in the
[Reka guidance](reka-component-guidance-2026-11-17.md#bounded-follow-up-checks-and-distinct-trade-offs).

Coverage: **7/7 components inspected**, including their event wiring, relevant
styling and named E2E definitions. This note verifies research coverage, not the
current runtime success of those tests. No production code, tests, private data,
storage contract or irreversible design was changed.
