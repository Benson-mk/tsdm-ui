# Forum IM: component-by-component product audit

2026-11-17 · `research/improve-ui-ux-2026-11-17` · application baseline `8b04f4a`.
This extends the [first CPO assessment](forum-im-cpo-audit-2026-11-17.md) after the
request to inspect every component with **Reka UI** explicitly in view.

## Recommendation

**Keep Reka UI. Improve the application-owned component contracts around it.**
The installed and pinned version is **2.11.0**. It already supplies Dialog,
DropdownMenu, Popover and Toolbar behavior in twelve production files. It does
not supply TSDM's visual language, editorial hierarchy, editor state or forum
operation semantics. The clearest new problems are inconsistent component
styling and unclear state presentation, not a missing component library.

The next reviewable slice should cover the formatting controls: theme the native
argument fields, align the popover shell with documented depth, preserve editor
selection/focus, and show the expanded destination from the earlier assessment.
This is smaller and more directly evidenced than replacing navigation or adopting
a new wrapper framework.

## Coverage and evidence

**28/28 production render components inspected:** 27 Vue components and
`ContentView.ts`, plus the inline visual units in `WorkspaceLayout.vue`. The seven
support modules for strings, attachment labels and editor DOM rendering were
considered through their owning components; they are not separate screens.
Prototype files are excluded from the production inventory.

The [machine-readable inventory](forum-im-component-inventory-2026-11-17.json)
lists every render component, its Reka imports, source hash and detailed audit.
The three companion studies provide depth without hiding components in an
aggregate score:

- [Writing and recovery: 10 components](forum-im-writing-components-2026-11-17.md).
- [Search, saved items, notices and private conversations: 7 components](forum-im-destination-components-2026-11-17.md).
- [Reka 2.11.0 contracts and official guidance](reka-component-guidance-2026-11-17.md).

The remaining eleven components and inline workspace units are assessed below.
“Observed” means current browser evidence; “source-backed” means inspected code;
“proposal” means a reversible experiment, not a proven usability improvement.

The live in-app userscript again matches SHA-256
`8db22dbd2a00a7d6ecbd237047a466e2bb6478e43f4d9aa35da603010f5f20f6` after removing
only the manager wrapper. The walkthrough covered menus, an empty editor,
formatting popovers, Settings and page selection at 905×760 and 390×844. No text,
report, rating, message, upload or other consequential submission was made.
The temporary tab and viewport override were removed; editor presentation was
returned to compact Visual before closing it.

## New findings, ranked by strength of evidence

### C1. Formatting fields fall outside the application's control recipe — P1

The live **Font** argument field is correctly labelled, but measures **21.5px**
high, uses **13.3333px Arial**, a browser-default **2px inset border**, and
`1px 2px` padding. It has no placeholder or associated value guidance. The same
application's page-number field measures **44.1px**, uses **18px** type, a themed
1px boundary and `8px 12px` padding. This is a direct within-application comparison,
not an inferred defect from a screenshot.

Apply the existing native-field recipe and command-specific guidance. Keep native
labels and validation; replacing the field with a different library is unnecessary.
Post content colors/fonts are user-authored formatting, so the UI palette must not
restrict otherwise supported BBCode values. See [PostEditor details](forum-im-writing-components-2026-11-17.md#1-posteditor).

### C2. Two Reka surfaces use different, partly undocumented styling — P1

| Computed live property | Thread options menu          | Text formatting popover         |
| ---------------------- | ---------------------------- | ------------------------------- |
| Shadow                 | `0 4px 16px`, 6% black       | `0 8px 32px`, about 13.3% black |
| Outer border           | 0px                          | 1px `#666666`                   |
| Corner radius          | 0px                          | 12px                            |
| Internal action height | Existing 44px menu-item rule | Measured 40px buttons           |

The popover values are hardcoded in [styles.css:3602](../../src/styles.css#L3602).
They are **application CSS**, not Reka defaults. Standardize the floating-surface
role around the documented shadow and an intentional corner treatment. The legacy
design's radius is reference material, not an automatic new mandate. Preserve
functional field/focus boundaries and Dark/forced-color distinctions. A 40px button
is not automatically a WCAG failure, but it differs from the product's common
44px control target. Do not remove every border indiscriminately.

### C3. Formatting actions do not communicate selection state — P1 experiment

The current formatting buttons expose neither pressed nor mixed formatting state.
Source inspection and the inspected popover agree on the absence of that state;
no member-comprehension result is claimed. Make Bold/Italic/etc reflect the actual
editor selection and stored marks. Consider Reka Toggle/ToolbarToggle primitives
only after defining the state contract with ProseMirror. A click-local boolean
would become false information after selection changes, keyboard edits or undo.

### C4. Attachment and outgoing-attempt hierarchy need state-specific treatment — P2

Source shows compact attachment buttons hidden with the tools closed, and long
repair paragraphs sharing the short-chip treatment. Exercise selected, uploaded,
inserted and unavailable states before choosing the one next action to expose.
Source also shows settled outgoing attempts retaining detailed source/status-check
controls. Trial a concise settled summary with exact inspection still available.
Failed, unknown, moderated and merged results must remain distinct. These are
source-backed opportunities, not newly reproduced recovery failures. See
[SourceWriting](forum-im-writing-components-2026-11-17.md#2-sourcewriting) and
[ReplySends](forum-im-writing-components-2026-11-17.md#7-replysends).

### C5. Private reading has a different hierarchy from public reading — P2

The private-reader template still places policy, explanatory copy, passive
checking state, timestamp, history controls and native escape in its persistent
header. Public reading has already moved passive controls into options. Trial a
compact peer heading and an appropriate private-options surface, preserving the
different read effects and explicit opt-in. This was inspected in source; no live
private content was opened. See [PrivateConversationView](forum-im-destination-components-2026-11-17.md#d5-privateconversationview--the-largest-consistency-opportunity).

### C6. Two integration asymmetries remain questions, not confirmed defects

The writing More menu omits the safe-viewport collision boundary used by neighboring
menus and always focuses the editor on close. An actual outside click from that
menu to Boards **correctly opened the drawer and focused Close**. Do not report a
reproduced focus-stealing bug. Panned/asymmetric-inset and other outside-focus paths
still need targeted fixtures.

Refresh/Save in `ThreadTools` disable their native buttons without setting the same
disabled prop on their Reka menu-item wrappers. Test keyboard traversal and state
changes before calling this a behavior bug; native disabled behavior still exists.
The [Reka study](reka-component-guidance-2026-11-17.md#composition-disabled-state-and-icon-explanations)
explains the exact integration contract.

## The eleven shared and reading components

| Component                                                                   | Current contract and product assessment                                                                                                                                                       | Direction / verification                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [WorkspaceBrand](../../src/components/WorkspaceBrand.vue)                   | Decorative SVG uses existing palette variables; enclosing brand link supplies the name. This is identity, not a Reka control.                                                                 | Retain. Do not turn a palette-colored mark into additional UI accents or make its SVG separately focusable. Check brand legibility in existing themes.                                                                                                                                                                      |
| [WorkspaceIcon](../../src/components/WorkspaceIcon.vue#L49)                 | One stroked, current-color SVG system, correctly hidden from accessibility APIs. The enclosing control owns the accessible name.                                                              | Retain the icon system. Audit control names and visible state at call sites. Selective Reka Tooltip can help focus/hover discovery; touch still needs context. Do not make tooltips the only source of essential instructions.                                                                                              |
| [ColumnSeparator](../../src/components/ColumnSeparator.vue#L78)             | Custom interactive separator with numeric ARIA values, pointer capture, 10px arrow steps, Home reset and Escape cancellation.                                                                 | Retain pending a parity reason to migrate. Reka **Separator is not a splitter**. Reka Splitter supports pixels, but migration must preserve anchors, collapse behavior and cancellation. Reuse `column-resizing.spec.ts` and safe-edge cases.                                                                               |
| [SettingsDialog](../../src/components/SettingsDialog.vue#L57)               | Reka Dialog; native range/radios/select; explicit immediate-preview/save wording; conditional storage failures; settings and reset actions grouped.                                           | Native controls fit. Keep immediate-save semantics visible and exceptional recovery separate from everyday preferences. Longer checking explanation can share the concise/action-adjacent hierarchy from D-T3. Current drawer→Settings return-focus and completed-overlay-click tests pass.                                 |
| [ThreadTools](../../src/components/ThreadTools.vue#L164)                    | Reka Dialog for staged page choice; nonmodal DropdownMenu for commands/filters; clipboard fallback dialog. The inspected menu has 12 items and is 578px tall, including seven author filters. | Separate global actions, ordering and author filters with labelled groups; consider a submenu only if content warrants its extra navigation. Keep source-backed choices, explicit Go/Cancel, unknown totals and truthful clipboard feedback. Menu Escape and page-choice E2Es pass; disabled-wrapper question remains open. |
| [PostActions](../../src/components/PostActions.vue#L135)                    | One Reka DropdownMenu backs visible ⋯ and right-click; empty-space double-click prepares a reply while preserving text selection and interactive content. Capabilities remain truthful.       | Retain equivalence and a visible touch/keyboard trigger. Group available actions clearly without hiding why a requested action is unavailable. Do not replace it with a ContextMenu merely to match the gesture name. Current menu/filter E2E passes.                                                                       |
| [PostPermalink](../../src/components/PostPermalink.vue#L70)                 | Native named copy button, completion-dependent status, selectable fallback in Reka Dialog and explicit return focus. Visible label currently exposes the post ID.                             | Apply prior F5/T10: use a trustworthy ordinal as the everyday label, retaining exact identity and honest missing-data fallback. Keep copy asynchronous and success truthful. Narrow copy/fallback E2E passes; no extra Toast subsystem is needed for this alone.                                                            |
| [RatingDialog](../../src/components/RatingDialog.vue#L83)                   | Reka Dialog; native source-qualified score/reason/notify controls; loading, unavailable, confirmed/rejected/unknown states; explicit submit.                                                  | Lead with understandable post/author context and consequences while retaining exact IDs where necessary. Keep score bounds and remaining allowance visible. Do not style a consequential rating as a lightweight reaction. Keyboard return-focus and narrow-layout E2Es pass.                                               |
| [ReportDialog](../../src/components/ReportDialog.vue#L63)                   | Reka Dialog with actual forum reasons, Other text, code-point count, validation, explicit submit and result states.                                                                           | Retain the reason-first form. Keep reporting distinct from a social reaction and preserve unavailable/unknown explanations. Context label improvements reuse earlier target/ID trade-offs. Narrow/enlarged keyboard and IME-Escape E2E passes.                                                                              |
| [ThreadHistoryBoundary](../../src/components/ThreadHistoryBoundary.vue#L16) | Native inline states for loading, failure/retry, genuine end and unknown coverage, placed at the relevant history edge.                                                                       | Retain state vocabulary and placement. Avoid a blanket Spinner or success badge that erases “unknown.” Verify new feedback preserves anchors; do not reserve empty passive bands. Existing history/quiet-status tests are named coverage, not rerun here.                                                                   |
| [ContentView](../../src/components/ContentView.ts#L7)                       | Renders parsed inert content, local overflow regions for tables/code, qualified native links and a disclosure summarizing repeated unsupported formatting.                                    | Retain native content semantics. Forum-authored rules, tables and quote boundaries are not decorative app borders. Check long CJK, nested quotes, media and keyboard overflow in reader fixtures. Do not convert every post into a Reka Card-like wrapper.                                                                  |

## Inline workspace components also matter

These are real product components even though they have not been extracted into
separate Vue files. Extraction is not a prerequisite for improving them.

| Inline unit                                        | Assessment and Reka fit                                                                                                                                                                                                                                                    | Failure cases / existing seam                                                                                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header, main destinations, progressive drawers     | Pane buttons already expose controls/expanded state; navigation marks current destination. Reka Dialog correctly supplies modal narrow drawers and custom focus continuity. Earlier F4 covers unclear narrow icon labels. Keep actual navigation distinct from tab panels. | `refined-navigation`, `progressive-drawers`, `drawer-redirect-guard`: disappearing triggers, Escape, nested Settings and retained writing.                                                                        |
| Board groups and directory                         | Native disclosure buttons, links, category colors, board filter and counts. Familiar labels and source-backed groups matter more than adding Accordion.                                                                                                                    | `board-groups`, `responsive-navigation`: unknown category, no matches, collapsed groups, large text and retained selection.                                                                                       |
| Board heading, subordinate boards and thread rows  | Existing F2/F3 covers low choice density. Preserve approved row shadows, actual latest activity, local draft indicator, selected state and the stable 300px column. These are navigable records, not Listbox options.                                                      | `compact-board-controls`, `stable-board-browsing`, `latest-reply`: exact destinations, source semantics, anchor restoration and full title access.                                                                |
| Board filter dialog                                | Reka Dialog contains staged native filter groups and Apply/Cancel/Clear. This is a form, not a command menu.                                                                                                                                                               | Keep exact native combinations and replacement disclosures; opening/focusing/cancelling cannot filter or publish. Existing B3 cases cover these paths.                                                            |
| Board checks and reader status                     | Quiet success and explicit actionable arrivals/failures already exist. They should not become generic notifications solely because Reka offers Toast.                                                                                                                      | `board-checks`, `thread-checks`, `quiet-status-appearance`: no silent prepend, no false freshness, visible retry and stable anchors.                                                                              |
| Reader identity, post footer and downloads         | Author/date/floor plus permalink/menu and inline reply/edit/filter coexist. Downloads remain explicit qualified operations. Prior F5 covers metadata hierarchy; post-menu and footer coexistence needs task testing before removing a fast path.                           | `post-actions`, `post-permalink`, `downloads`, `reader-hierarchy`: pointer/text selection, exact post, download capability and no accidental paid action.                                                         |
| Forum draft list and operation panels              | Explicit loading, named Resume, source-backed board identity, pagination and uncertain-save checks. Forum drafts are server-owned and separate from local reply drafts. Native list/actions are appropriate.                                                               | `drafts`, `draft-review-controls`, funded-draft suites: mistaken ownership, changed target, hidden charge or uncertain result. These states were source-inspected, not exercised live.                            |
| Navigation guards, retained writing and resume bar | Reka Dialog presents guarded decisions; native inline state exposes unresolved authority/storage/files. Exact writer identity and return context remain workspace-owned.                                                                                                   | `writing-presentation`, `retained-replies`, `prepared-review`: loss through navigation, wrong destination, hidden warning or implicit publish. Preserve nonreply guards rather than copying ordinary-reply rules. |

Implementation references: [layout overlays](../../src/layouts/WorkspaceLayout.vue#L2232),
[header/navigation](../../src/layouts/WorkspaceLayout.vue#L2444),
[forum drafts](../../src/layouts/WorkspaceLayout.vue#L3060),
[board directory](../../src/layouts/WorkspaceLayout.vue#L3212),
[thread rows](../../src/layouts/WorkspaceLayout.vue#L3470),
[post identity/actions](../../src/layouts/WorkspaceLayout.vue#L3772),
[retained writing](../../src/layouts/WorkspaceLayout.vue#L4050).

## A consistent component contract, without a library migration

For every touched component specify: its user job, primary action, visible and
programmatic state, focus entry/exit, loading/empty/error/disabled behavior,
space/depth role, safe-viewport behavior and effects of activation.

Use **Dialog for bounded tasks/decisions**, **DropdownMenu for commands**,
**Popover for rich secondary forms**, **Toolbar for related editor commands**,
and native HTML for ordinary fields, links and disclosures. Keep all existing
portals inside the app's ShadowRoot. Apply collision bounds and available-size CSS
deliberately; high z-index alone does not protect a keyboard-constrained viewport.
Retain user zoom, safe insets and browser-viewport handling from the existing work.

Do not automatically substitute Tabs for category buttons: installed Reka defaults
to activation on focus, while search/notices/private reads can have credits or
read-state effects. Do not assume using a primitive supplies the right label or
the editor's formatting state. No universal wrapper layer, storage change or
architecture migration is selected by this research.

## Verification, experiments and trade-offs

**12/12 existing complete-app Edge cases passed**, covering Settings dismissal and
return focus, page-picker staging and short layouts, shared post menus, narrow
clipboard fallback, rating/report keyboard behavior and thread-menu Escape.
Run: `evidence/runs/2026-11-17T04-09-40.073Z/`.
The [evidence summary](forum-im-component-evidence-2026-11-17.json) includes exact
case names, runtime, candidate hash, artifact-manifest hash and replay command.
Node/npm remain the available 26.0.0/11.12.1, rather than the repository's pinned
24.22.0/11.21.1; no rebuild or release qualification is claimed.

These passes do not cover every inspected state and do not erase the earlier
obsolete no-shadow test failure. Private content, attachments, conflicts and
publication outcomes were evaluated through source and existing test definitions,
not manufactured live activity. Raw screenshots stay in the ignored private
research run; public artifacts contain measurements and authored summaries.

For the first slice, write E2E expectations before application edits: open every
formatting group, exercise native parameter input and validation, preserve actual
selection/undo, check mixed formatting, and traverse Apply/Escape/outside focus at
narrow/enlarged/Dark/forced-color states. Keep complete source and user-authored
formatting intact. Retain screenshots, geometry/focus observations and request
ledgers. Separately test the two C6 questions; do not silently turn hypotheses into
acceptance failures.

Trade-offs are recorded once by their owner: earlier T1–T10 remain in the initial
CPO ledger; W1–W9 cover writing/formatting/recovery proposals; D-T1–D-T4 cover
destination hierarchy; the four Reka-study entries cover selective primitive use,
focus overrides, tooltips and retaining the custom splitter. This audit adds one
distinct proposal: **group long author-filter menus** to improve scanning, at the
cost of more navigation if a submenu is used; keep all source-supported filters
available and verify submenu focus/collision if adopted. No costly-to-reverse
choice was made, so no advisor gate was invoked.

## Research acceptance

- [x] Inventory all 28 production render components and inline workspace units.
- [x] Inspect actual Reka 2.11.0 use and verify relevant library contracts.
- [x] Give each component a role, retain/change judgment and failure-first verification path.
- [x] Separate live evidence, source facts, hypotheses and existing test coverage.
- [x] Reproduce component styling differences and preserve candidate-specific evidence.
- [x] Run the selected complete-app component journeys and preserve their results.
- [x] Report all distinct trade-offs without declaring a new architecture or production acceptance.

All research criteria are verified. Implementation and member validation remain
subsequent work. Production files and tests are unchanged.
