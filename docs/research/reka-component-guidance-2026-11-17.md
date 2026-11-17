# Reka UI: component guidance for the forum IM audit

Research date: 2026-11-17. Baseline: research branch after `028b3ed`; installed
`reka-ui` **2.11.0**, matching the exact dependency in `package.json`. This note
supports the component audit. It changes neither the application nor its accepted
interaction contracts. Source inspection identifies integration questions; it does
not prove an observed user failure.

## The useful boundary

Reka is an unstyled interaction foundation. It supplies primitives for semantics,
keyboard movement, focus, dismissal and positioning; TSDM still owns information
hierarchy, labels, usable dimensions, contrast, content preservation and forum
operations. Even a dialog overlay's viewport coverage is application CSS, not a
library guarantee. [Introduction](https://reka-ui.com/docs/overview/introduction)
and [styling guidance](https://reka-ui.com/docs/guides/styling) explicitly establish
that boundary.

Therefore the design question is not whether every component uses a Reka import.
It is whether each interaction uses the right semantics and consistently applies
the project's palette, documented depth, whitespace and safe-area rules. Ordinary
buttons, links, fields and readable content do not need a library replacement to
belong to the design system.

## Actual usage and appropriate roles

Twelve production source files import Reka. The imported families are Dialog,
DropdownMenu, Popover and Toolbar. No production Tooltip, Separator, Splitter,
ContextMenu, Toast, Select, RadioGroup or Slider import was found; prototype files
were excluded. This is an inventory, not a missing-feature checklist.

| Primitive / existing owner                                                                                                                           | Suitable job and contract                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dialog:** `SettingsDialog`, `RatingDialog`, `ReportDialog`, `ReplyRecoveryDialog`, `ReplySends`, `PostPermalink`, `ThreadTools`, `WorkspaceLayout` | A bounded task or decision: settings, filters, page choice, recovery, clipboard fallback, rating/reporting or a navigation guard. Supply a useful title/description, explicit dismissal, initial focus and a meaningful return destination. Reka Dialog defaults to modal; the application can override close behavior. |
| **DropdownMenu:** `PostActions`, `ThreadTools`, `SourceWriting`                                                                                      | A list of commands or destinations. Use Reka items for arrow-key movement, typeahead and selection; use native links for genuine destinations through `as-child`. A menu is not a generic container for arbitrary form controls. The current app explicitly makes these menus nonmodal.                                 |
| **Popover:** `ReplyToolbarPopover`                                                                                                                   | Rich secondary editing controls and parameter forms, where ordinary Tab movement between fields is appropriate. Its nonmodal default permits returning to the editor. Reka uses dialog semantics and links the content name to its trigger.                                                                             |
| **Toolbar:** `PostEditor`, `SourceWriting`, `ReplyToolbarPopover`                                                                                    | A related command group with one roving focus sequence. Keep a useful group name, coherent ordering and disabled state. Wrapped visual rows remain one logical toolbar rather than becoming separate menus.                                                                                                             |
| **Native controls:** settings, search, authoring, filters                                                                                            | Retain their native labels, values, validation, grouping and disabled behavior unless a specific unmet interaction requires another primitive. Style their shared roles consistently.                                                                                                                                   |
| **Custom `ColumnSeparator`**                                                                                                                         | An interactive splitter with pointer capture, bounded values, keyboard adjustment, reset and cancellation. This is different from a decorative line or Reka's structural Separator.                                                                                                                                     |

The official component descriptions support this mapping:
[Dialog](https://reka-ui.com/docs/components/dialog),
[DropdownMenu](https://reka-ui.com/docs/components/dropdown-menu),
[Popover](https://reka-ui.com/docs/components/popover),
[Toolbar](https://reka-ui.com/docs/components/toolbar).
Current application examples are
[SettingsDialog](../../src/components/SettingsDialog.vue),
[PostActions](../../src/components/PostActions.vue),
[ReplyToolbarPopover](../../src/components/ReplyToolbarPopover.vue) and
[PostEditor](../../src/components/PostEditor.vue).

## Focus and dismissal are part of each component's product contract

Installed source confirms these important defaults:

- `DialogRoot` defaults `modal` to true. Modal content traps focus while open and
  normally returns focus to `DialogTrigger` on close. `DialogContentImpl` wires
  the title and description IDs to `role="dialog"`.
- `PopoverRoot` defaults `modal` to false. Its nonmodal close logic returns to
  the trigger only when the member has not deliberately interacted outside.
  `PopoverContentImpl` already supplies `aria-labelledby` from the trigger.
- `DropdownMenuRoot` defaults to modal, but the app's menus deliberately use
  `:modal="false"`. Menu content manages focus and selection rather than ordinary
  form Tab navigation.
- `ToolbarRoot` uses `RovingFocusGroup`; disabled `ToolbarButton` elements are
  excluded from the focusable group. The current reply toolbar supplies a label
  and enables looping.

Sources, all from installed 2.11.0:
`src/Dialog/DialogRoot.vue:54`, `DialogContentModal.vue:37`,
`DialogContentImpl.vue:79`; `src/Popover/PopoverRoot.vue:48`,
`PopoverContentNonModal.vue:22`, `PopoverContentImpl.vue:68`;
`src/DropdownMenu/DropdownMenuRoot.vue:33`;
`src/Toolbar/ToolbarRoot.vue:41`, `ToolbarButton.vue:19`, under
`node_modules/reka-ui/`.

TSDM has valid reasons for explicit focus handling: menu triggers can disappear
after an action, navigation can change the visible pane, and editing must retain
its selection. Assess every override by its outcome: Escape returns to the
initiating control, a completed editor command can return to writing, and an
outside click should preserve the member's intended new focus. Removing custom
handlers solely because the library has defaults would ignore those contracts.

For example, [SourceWriting](../../src/components/SourceWriting.vue), line 791,
always prevents the More menu's close autofocus and focuses the editor. Compare
this with the outside-interaction handling in
[PostActions](../../src/components/PostActions.vue), lines 153–160, and
[ThreadTools](../../src/components/ThreadTools.vue), lines 303–311. **Research
question:** when closing More by clicking a different focusable control, does the
editor reclaim focus unexpectedly? This needs a browser reproduction; source
asymmetry alone is not a demonstrated defect. A subsequent live check observed
that an outside click from writing More to Boards correctly opened the drawer and
focused Close. That path did not reproduce a focus-stealing failure; other paths
remain unverified.

## Portals, ShadowRoot and the available viewport

[main.ts](../../src/main.ts), lines 43–48, creates a dedicated portal element
inside the application's open ShadowRoot. Existing Reka portals receive that
element through `:to="portal"`. Preserve it: installed Reka's Teleport primitive
falls back to `body` when neither an explicit target nor a configured target is
provided (`src/Teleport/Teleport.vue:39`). Moving an overlay to body changes its
style/DOM context and must not happen accidentally during component extraction.

Reka 2.11.0 contains explicit ShadowRoot-aware focus code:
`src/shared/getActiveElement.ts:7` descends through active shadow elements, and
`src/FocusScope/FocusScope.vue:96` attaches root-aware listeners. That is useful
implementation evidence, not certification of every combination of native forum
handlers, nested dialogs, editor selection and browser behavior.

Popover/Menu positioning supports collision boundaries and padding and exposes
available-size CSS variables. The official
[Popover size example](https://reka-ui.com/docs/components/popover) leaves CSS
constraints to the consumer. Installed `src/Popper/PopperContent.vue:25` enables
collision avoidance; lines 95–111 define the additional boundary and padding.
Collision avoidance cannot infer the application's custom safe-area rectangle.

The project already supplies `.safe-viewport-boundary`, calculated from safe
insets and visual viewport dimensions, in [styles.css](../../src/styles.css),
lines 2925–2936. Thread/Post menus and reply toolbar popovers pass it to Reka.
The writing More menu at `SourceWriting.vue:785–791` supplies only padding.
**Research question:** can that menu be reached completely with a panned,
keyboard-constrained viewport or asymmetric insets? Compare outcomes before
standardizing; simply having a portal and a high z-index is not enough.

## Composition, disabled state and icon explanations

`as-child` forwards a primitive's behavior to its child. It does not repair an
inappropriate element. A trigger still needs a focusable button/link with correct
events, name and state. The official
[composition guide](https://reka-ui.com/docs/guides/composition) makes that consumer
responsibility explicit. Avoid nested buttons when composing toolbar and overlay
triggers; the existing `ToolbarButton as-child` + `PopoverTrigger` construction
is an appropriate pattern.

Disabled state should agree at both layers. Reka's `MenuItem` checks its `disabled`
prop before selecting; `MenuItemImpl` uses it for `aria-disabled`, styling state
and pointer focus (`src/Menu/MenuItem.vue:32`, `MenuItemImpl.vue:38,79`). In
`ThreadTools.vue:382–397`, Refresh and Save disable their native child buttons but
do not pass that state to `DropdownMenuItem`; adjacent Check/Copy items do.
This is a consistency concern to test with arrow navigation and concurrent state
changes, not evidence of an unauthorized operation. Native disabled buttons still
have their own browser behavior.

The application uses `aria-label` and native `title` for many icon buttons.
Those are not equivalent to a deliberate keyboard-visible explanation. Reka's
[Tooltip](https://reka-ui.com/docs/components/tooltip) opens on focus/hover and
closes on activation/Escape; it is a candidate for unfamiliar icons, not a place
for interactive form controls or essential instructions. It also cannot solve
touch discoverability by itself. Retain useful accessible names regardless of
whether a tooltip is added; visible task labels remain a separate product choice.

## The clearest visual inconsistency belongs to application CSS

`styles.css:2569–2600` gives thread menus the documented `--floating-shadow` and
44px menu items. In contrast, `styles.css:3602–3631` gives reply toolbar popovers:

- `border: 1px solid var(--boundary)`;
- a 12px corner radius;
- `box-shadow: 0 8px 32px #0002` (approximately 13.3% black);
- 40px minimum height for internal buttons.

These are confirmed source differences, not library defaults. They explain why
using Reka everywhere does not produce a coherent visual language. Inspect actual
popover contents before classifying the outer border as decorative or functional.
Then compare a shared documented floating-surface treatment, while keeping input
boundaries and dark/forced-color distinctions. Forty pixels is also not by itself
a WCAG failure; it is a departure from the product's common 44px target, requiring
actual hit-area and spacing assessment.

Do not globally rewrite primitive styles to remove one inconsistency. Component
classes and Reka's `data-state`, `data-highlighted` and `data-disabled` hooks are
already sufficient for scoped treatment. A new universal wrapper layer is not a
prerequisite for this research direction.

## Separators, splitters and native forms

Reka [Separator](https://reka-ui.com/docs/components/separator) provides structural
separation and orientation; its installed `BaseSeparator.vue` contains no resize
interaction. Replacing [ColumnSeparator](../../src/components/ColumnSeparator.vue)
with it would lose behavior. The current custom control has 10px arrow steps,
Home reset, Escape cancellation, pointer capture, bounds and begin/end callbacks.

Reka does offer a distinct [Splitter](https://reka-ui.com/docs/components/splitter).
Installed `SplitterPanel.vue:21` supports both percent and **pixel** size units;
it would be incorrect to reject it as percent-only. A migration still needs to
demonstrate parity with the workspace's anchor preservation, progressive collapse,
preferences and cancellation semantics. Do not undertake that migration merely
to increase library usage.

Similarly, [SettingsDialog](../../src/components/SettingsDialog.vue), lines 82–107,
uses a labelled native range and grouped radio inputs. Reka Slider/RadioGroup can
be evaluated if custom interaction needs arise; their absence is not a defect.
Preserving native forms also matters for server-supplied options and validation.

## Bounded follow-up checks and distinct trade-offs

Extend existing complete-app journeys only when a change is proposed: menu
keyboard activation and disabled transitions; dialog opening/closing/return focus;
toolbar roving focus with editor selection; outside-click focus; missing triggers;
and short safe-viewport overlays. Existing entry points include
`post-actions.spec.ts`, `thread-tools.spec.ts`, `navigation-settings.spec.ts`,
`reply-layout.spec.ts` and `browser-edges.spec.ts`. This subtask ran no application
tests and makes no new runtime or accessibility-pass claim.

Additional trade-offs, distinct from the earlier CPO ledger:

1. **Use Reka selectively.** Retains proven native field behavior and avoids a broad
   migration; the application must maintain consistent styling across native and
   primitive-based components.
2. **Keep context-specific focus rules.** Preserves editor and navigation intent;
   each override needs outcome tests and can diverge from useful library defaults.
3. **Consider tooltips selectively.** Offers focus/hover explanations without
   permanently expanding every control; adds timing/layer behavior and leaves
   touch comprehension to visible context or labels.
4. **Retain the custom splitter pending a parity case.** Avoids an unrelated layout
   migration; keeps its bespoke input/cancellation code as a maintenance cost.

All recommendations are reversible presentation or verification proposals. No new
storage, server contract or other costly-to-reverse decision is made.

Official pages were retrieved directly on the research date; they displayed
v2.11.0. Installed package source was used to resolve defaults and integration
details. The search connector was unavailable; no claims rely on its failure or
on search snippets. Source paths/lines refer to the inspected installed package
and repository baseline, not an assertion about future Reka releases.
