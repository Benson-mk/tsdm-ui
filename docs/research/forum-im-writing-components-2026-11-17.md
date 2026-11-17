# Forum IM: writing and recovery component audit

Date: 2026-11-17. Research branch: `research/improve-ui-ux-2026-11-17`.
Application baseline: `8b04f4a`; this deepens the
[CPO assessment](forum-im-cpo-audit-2026-11-17.md). Scope: ten writing, publication
and recovery components. No application behavior, tests or architecture changed.

**The best next step is to improve the presentation of existing capabilities.**
Reka already supplies the toolbar, popover, dropdown and dialog interactions.
The remaining gaps belong mainly to application styling, meaningful state
presentation and the relationship between editing and publication. Converting
every native control to a Reka component would not solve those gaps.

Evidence below distinguishes source facts, current browser observations from
the component audit, and proposed experiments. The observed userscript was
reverified with SHA-256
`8db22dbd2a00a7d6ecbd237047a466e2bb6478e43f4d9aa35da603010f5f20f6`.
Source inspection establishes what
the templates render; it does not establish that a member understands them or
that every focus/recovery path currently passes. Listed E2Es are existing coverage
to reuse, not fresh pass claims. Browser captures remain private under
`evidence/runs/research-components-2026-11-17-private/`.

## Ownership and constraints

| Owner                      | Responsibility in this workflow                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reka UI                    | Toolbar traversal, popover/menu/dialog mechanics, portal placement and interaction hooks. Application code still owns names, styling, appropriate focus destinations and correct composition of primitives. |
| Native HTML                | Labelled fields, file selection, progress, readonly source, disclosure and ordinary action buttons. Use native semantics where they already fit.                                                            |
| ProseMirror/editor session | Document, selection, undo, commands, composition and Visual/Source continuity. Toolbar presentation must reflect this state.                                                                                |
| Writing/workspace domain   | Destination, immutable submissions, attachment identity, authority of server results, conflicts, retries and durable recovery. A primitive must never infer these facts.                                    |

The [accepted owner decisions](../implementation/ui-ux-112.md) remain controlling:
Ctrl/Cmd+Enter sends in both modes; Enter/Shift+Enter inserts a newline; expanded
ordinary writing owns the full thread column; Compact returns the reader. Keep
one current-mode icon with a next-action name, Visual as default, conditional More,
Source-only Preview and need-based Check. Do not restore mandatory review for an
ordinary reply, add a sender beside Send, or surface successful-storage diagnostics.
Use the inherited colors and documented depth; retain functional field, focus and
forced-color boundaries. None of this report requires a new architectural seam.

## 1. PostEditor

**Member job:** write and format a reply without losing their place or accidentally
sending it. [The component](../../src/components/PostEditor.vue#L40) binds a
workspace-owned editor session; disposing its ProseMirror view does not dispose
the writing. Its [guarded shortcut](../../src/components/PostEditor.vue#L364)
accounts for composition, key code 229 and repeat. Visual and Source surfaces stay
mounted with `v-show`; expansion should not create a new document or undo history.

The Reka toolbar groups Text formatting, Paragraph, Insert, Table and Mentions.
[Parameterized commands](../../src/components/PostEditor.vue#L204) focus their
argument field; applying a command can suppress trigger-focus restoration so
the editor receives focus. These are valuable existing behaviors, not missing
features.

Three opportunities need different evidence levels:

- **Observed:** the labelled Font field at 905px and 390px was 21.5px high, used
  13.3333px Arial, a 2px inset native border and 1px/2px padding. It had no placeholder
  or `aria-describedby`. The [generic argument field](../../src/components/PostEditor.vue#L622)
  has a label, but leaks browser-default styling and gives no accepted-value
  guidance. The same app's page-picker number field measured approximately 44.1px
  high with an 18px font and themed 8px/12px padding, establishing an internal
  control-recipe inconsistency. Apply the application field treatment and add
  command-specific hints backed by the actual editor dialect. A color picker or
  font list must not narrow accepted source values accidentally. Member-authored
  post colors are independent of the application chrome palette; preserve complete
  BBCode and arbitrary supported formatting. Captures: `font-field-905.jpg` and
  `font-field-390.jpg` in the private run above.
- **Source fact/proposal:** [formatting command buttons](../../src/components/PostEditor.vue#L599)
  expose whether a parameter panel is expanded, but no selected/mixed formatting
  state. Derive meaningful state from the editor selection before choosing a Reka
  toggle primitive. Click-local toggle state would lie after keyboard edits,
  selection changes, undo or mixed selections.
- **Investigation:** [Mentions](../../src/components/PostEditor.vue#L711) disables
  Search while finding and renders returned people; this local template has no
  loading/empty explanation. Check global feedback before declaring feedback
  absent. Trial a local progress/no-results message only if the whole workflow
  needs it; preserve exact person identity and keyboard insertion.

Fail on selection loss, stale active formatting, IME-triggered command/send,
invisible validation, or search feedback that announces stale results. Reuse
[toolbar/parameter E2Es](../../tests/e2e/integrated-ui-ux.spec.ts#L1535),
[mention E2Es](../../tests/e2e/advanced-editor.spec.ts#L659) and
[keyboard growth](../../tests/e2e/reply-layout.spec.ts#L548).

## 2. SourceWriting

**Member job:** understand what they are answering, add the necessary material
and send with predictable consequences. This component composes the editor with
targeting, attachments, options, recovery and publication. Its
[addressed-reply strip](../../src/components/SourceWriting.vue#L488) separates
inserting a quote from removing the target. The general destination is
[intentionally visually hidden in ordinary replies](../../src/components/SourceWriting.vue#L478);
the expanded-context problem and its trade-off are already F1/T6 in the main audit.

Reka owns Options/More/popover behavior; native controls own files and form values;
the writing domain owns meaning. [Validation](../../src/components/SourceWriting.vue#L175)
can open Options and focus the actual field. Keep its native constraints and
error association instead of replacing a select just for visual consistency.
The conditional More menu and [Source-only preview](../../src/components/SourceWriting.vue#L831)
already reflect the later owner direction.

The strongest source-backed attachment hypothesis concerns the next action.
[Compact CSS](../../src/styles.css#L3413) hides all direct attachment buttons when
tools are closed, including Upload, Insert and Remove. The underlying
[lifecycle UI](../../src/components/SourceWriting.vue#L1556) carefully distinguishes
selection, upload, association and unavailable bytes. Trial one appropriate next
action beside each compact attachment; keep broader operations in the tools
surface. Do not silently upload or treat an upload as insertion. Also separate
short status chips from long repair text: [the current rule](../../src/styles.css#L3405)
gives every direct attachment paragraph the same pill treatment.

Failures include a selected file mistaken for an uploaded attachment, unavailable
bytes without a repair path, unintended server removal, a hidden validation field
and target loss through expansion. Retain explicit server-removal warning and
quiet successful recovery. Reuse
[attachment-chip layout](../../tests/e2e/reply-layout.spec.ts#L599),
[shared attachment recovery](../../tests/e2e/shared-replies.spec.ts#L324),
[attachment authoring](../../tests/e2e/attachment-authoring.spec.ts) and
[conditional menu cases](../../tests/e2e/integrated-ui-ux.spec.ts#L2034).

## 3. ReplyToolbarPopover

**Member job:** operate a focused editing tool, then continue at the same selection.
[This wrapper](../../src/components/ReplyToolbarPopover.vue#L35) correctly uses
Reka Popover and a ToolbarButton trigger, portals into the application root,
provides a safe-viewport collision boundary and guards composition-time Escape.
Its close callback deliberately distinguishes returning focus to the trigger from
returning it to the editor. Preserve that distinction.

**Observed and source-confirmed:** [its CSS](../../src/styles.css#L3602) uses a 1px
`--boundary` border, 12px radius and `0 8px 32px #0002` shadow, diverging from the
documented 6% floating shadow. Its radius also differs from the inspected thread
menu's 0px; the legacy 8px menu recipe is a reference, not an automatic new mandate.
The live Text formatting
popover computed a `#666` border and approximately 13.3% black shadow; internal
buttons measured 40px. These are application styling decisions, not Reka defaults.
Align the floating shell with the existing tokens; assess internal touch targets
against the repository's control requirements. Keep input and focus boundaries.

Width and available-height scrolling already exist. Do not propose them as new
features. Fail on obscured controls, a popup outside the safe region, trapped
scroll, selection loss or incorrect focus after Apply/Escape. Reuse the parameter
and [menu/dialog keyboard cases](../../tests/e2e/explicit-replies.spec.ts#L1008),
adding narrow, enlarged-text, Dark and forced-color evidence for any styling edit.

## 4. WritingDestination

**Member job:** verify the board, thread, addressed post and acting account for a
particular operation. [This native labelled group](../../src/components/WritingDestination.vue#L46)
renders exact IDs and a board label; it has no thread-title prop. It distinguishes
the current actor from an immutable submission's actor and constructs the exact
addressed-post URL. These are domain facts, not dialog mechanics.

Use known thread metadata for a recognizable presentation label while preserving
exact identity in review/details. Never infer a different destination from a
truncated title. Ordinary expanded writing needs the small visible context
proposed by F1, not the full review block or a sender beside Send. Fail on stale
title after a context change, an incorrect addressed link or replacing the
original sender in history with the current account. Reuse
[continuity](../../tests/e2e/reply-layout.spec.ts#L235),
[retarget/menu context](../../tests/e2e/integrated-ui-ux.spec.ts#L2162) and
[frozen publication](../../tests/e2e/prepared-review.spec.ts#L786) coverage.

## 5. InertSourcePreview

**Member job:** inspect the current interpretation of source without changing it.
[The renderer](../../src/components/InertSourcePreview.vue#L13) reuses editor
interpretation without creating a mutable EditorView, commands or active external
URLs. Tables and code receive labelled, keyboard-focusable overflow regions.
This is content rendering; there is no reason to wrap it in another Reka primitive.

Keep preview local and optional in Source. Trial concise wording in the parent
that distinguishes local interpretation from the forum's eventual rendering when
that distinction affects a decision; avoid permanent instructional clutter. Keep
complete source inspectable and overflow local. Fail if preview changes source,
executes content, misrepresents BBCode-off text or creates page-wide horizontal
scroll. Reuse [literal preview](../../tests/e2e/prepared-review.spec.ts#L1171) and
[tools/preview layout](../../tests/e2e/reply-layout.spec.ts#L450).

## 6. PreparedPublication

**Member job:** inspect exactly what an explicit reviewed operation will publish.
[The component](../../src/components/PreparedPublication.vue#L20) reads the frozen
submission, including destination, settings, attachment references and source.
It hides passphrase values, handles BBCode-off content literally, and offers native
`details` for complete prepared source. Semantic sections, definition lists and
disclosure already fit; Reka does not own immutable publication meaning.

Trial leading with destination, content and material consequences, with revision
and reference inventory available in details. Keep charges, source differences
and attachment problems prominent whenever relevant. This hierarchy belongs to
operations that already require review; ordinary reply Send stays direct.
Fail on displaying mutable writing as the prepared snapshot, concealed financial
effects, stale options, password exposure or incomplete source inspection. Reuse
[frozen new-thread](../../tests/e2e/prepared-review.spec.ts#L786), literal-preview
and [attachment-label](../../tests/e2e/prepared-review.spec.ts#L1324) cases.

## 7. ReplySends

**Member job:** determine whether a particular reply arrived and take the correct
next step without endangering newer writing. [The component](../../src/components/ReplySends.vue#L54)
distinguishes pending, confirmed, moderation, unknown, rejected and not-sent.
Every attempt presents exact destination, readonly source, status, attachments and
original sender. Confirmed results can link to the post; merged replies expose a
before/after comparison. Preserve all these distinctions.

**Source fact:** the optional published-URL field and Check status action render
[for every status](../../src/components/ReplySends.vue#L231), including confirmed.
Trial a summary-first settled attempt with inspectable exact details and a
state-appropriate action hierarchy. Pending, failed, moderation and unknown states
must remain explicit. Do not collapse meaningful merged/normalization differences
into a generic success toast or mistake transport completion for confirmation.

Reka appropriately owns the [duplicate-risk dialog](../../src/components/ReplySends.vue#L265).
It prevents outside dismissal, starts focus on Cancel and restores the trigger.
Retain explicit risk acceptance and the unknown original outcome. The bordered
submission card is not automatically a decorative violation: an
[existing acceptance case](../../tests/e2e/pending-replies.spec.ts#L1748) explicitly
requires a distinct bordered submission. Document its functional distinction
before revising that boundary.

Fail on premature success, duplicate retry without acknowledgement, lost newer
writing, hidden rejection or incorrect original-account identity. Reuse
[sending/retry/unknown](../../tests/e2e/pending-replies.spec.ts#L126),
[editing failed attempts](../../tests/e2e/pending-replies.spec.ts#L337) and
[risk keyboard behavior](../../tests/e2e/pending-replies.spec.ts#L1781).

## 8. ReplyConflict

**Member job:** choose between retained versions based on their actual differences.
[The inline component](../../src/components/ReplyConflict.vue#L100) exposes source,
Continue, retained alternatives, target, options and attachment identity. It already
uses human-readable option values and shows server/uploader differences selectively.
Discard captures the exact version and returns focus to its initiating button on
cancel. Native inline controls fit; the other-thread wrapper supplies the dialog.

Choice actions precede [target/options/file details](../../src/components/ReplyConflict.vue#L145).
Trial a short meaningful-difference summary near each source and choice, especially
when text is identical but target, options or files differ. Derive this presentation
from existing domain facts. Do not introduce automatic merge, newest-wins or an
unjustified recommended version. Fail if a member cannot distinguish same-text
variants, the wrong captured version is discarded, or a recovery choice silently
publishes. Reuse [focus](../../tests/e2e/conflicting-replies.spec.ts#L915),
[narrow recovery](../../tests/e2e/conflicting-replies.spec.ts#L1277),
[choice context](../../tests/e2e/conflicting-replies.spec.ts#L1526) and
[attachment identity](../../tests/e2e/conflicting-replies.spec.ts#L1631).

## 9. ReplyRecoveryDialog

**Member job:** resolve saved versions from other threads without interrupting the
current reply. [The count](../../src/components/ReplyRecoveryDialog.vue#L23) excludes
the active thread and counts versions, not threads, ordinary drafts or unread
notices. Reka owns modal mechanics; application code defers view changes during
composition, guards Escape and focuses completed resolution feedback.

Trial naming the count unit explicitly and grouping with recognizable thread
metadata where available, retaining exact-ID fallback. Do not turn the recovery
trigger into a general drafts manager. Its [zero-count survival](../../src/components/ReplyRecoveryDialog.vue#L75)
while open or showing resolution is intentional: removing the final version should
not destroy feedback or the focus-return target. Fail on count ambiguity, current
draft contamination, lost trigger, escaped IME dismissal or offscreen resolution.
Reuse [other-thread popup](../../tests/e2e/conflicting-replies.spec.ts#L1482) and
the conflict focus/context matrix.

## 10. RetainedPublicAttempts

**Member job:** inspect an earlier public operation and verify its outcome.
[This component](../../src/components/RetainedPublicAttempts.vue#L16) keeps retained
publications separate from Forum draft history. It provides original-page links,
status, native details containing PreparedPublication, separate packet/credit
observations and a read-only status check. The original URL is an important escape
route, not a redundant link.

Harmonize summary anatomy with ReplySends—operation, destination, status, relevant
next action and exact details—without merging statuses or mutation handlers.
Different operations have different consequences. Native disclosure remains
adequate; Reka is useful only for an actual overlay/interaction need. Fail on a
Forum draft presented as published, an original destination replaced with the
current one, conflated observations or a check that resubmits. Reuse
[prepared-review](../../tests/e2e/prepared-review.spec.ts) and
[nonreply policy](../../tests/e2e/explicit-replies.spec.ts#L942) scenarios.

## Experiment order and additional trade-offs

1. Correct observed field/popover styling and verify focus/selection at narrow
   widths. Pair with the main audit's visible expanded destination.
2. Exercise compact attachment states before choosing the smallest visible next
   action. Record actual member interpretation of selected/uploaded/inserted.
3. Prototype attempt and review hierarchy using confirmed, merged, failed and
   unknown fixtures; verify exact inspection and risk paths remain available.
4. Validate formatting state, conflict summaries and recovery count wording with
   realistic selections and same-source/different-context versions.

Write the failure inventory above into the implementation plan before editing.
Use complete-app E2E fixtures, then preserve screenshots, focus observations,
source hashes and request ledgers. Source review alone cannot close these cases.

Each distinct additional trade-off is recorded once below. Main-audit T2/T4/T5
already cover bounded live work, private evidence and research-only scope; T6
covers the expanded destination. The following are proposals, not implemented
product decisions.

| ID  | Choice                                                                      | Benefit                                              | Cost / limit                                                                        |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| W1  | Derive selected/mixed formatting from editor state                          | Truthful toolbar feedback through selection and undo | Requires reliable command/state mapping, including mixed selections                 |
| W2  | Theme native argument fields and add dialect-backed value guidance          | Usable, predictable formatting inputs                | More form content and ongoing alignment with accepted source values                 |
| W3  | Align popovers to existing floating tokens; preserve functional boundaries  | Consistent documented depth                          | Less popup emphasis; Dark/forced-color and focus need explicit verification         |
| W4  | Expose a state-specific compact attachment action and separate repair prose | Discoverable lifecycle and repair                    | Consumes composer height; long filenames and multiple files need reflow             |
| W5  | Summarize settled attempts and review inventory, retaining exact details    | Prioritizes outcome and next action                  | Detailed inspection may take another action; consequential differences stay visible |
| W6  | Summarize meaningful recovery-version differences                           | Supports informed choice for identical text          | Adds comparison/presentation work and must never imply a preferred authority        |
| W7  | Name recovery count units and known thread labels                           | Clarifies what requires attention                    | Uses header/dialog space and needs honest missing-metadata fallbacks                |
| W8  | Explain local preview limits only when decision-relevant                    | Reduces false confidence in rendering                | Adds guidance whose usefulness must justify its visual cost                         |
| W9  | Add local mention search feedback only after checking existing feedback     | Makes waiting and no matches understandable          | Requires stale-result/announcement handling and can duplicate global messages       |

The source-wide/selected-live evidence limit reuses the earlier CPO T2 and
source-study scope trade-offs; it is not a separate product decision.

No costly-to-reverse decision is made. The component boundaries and publication
authority stay intact; implementation acceptance requires the focused E2E and
member checks described here.
