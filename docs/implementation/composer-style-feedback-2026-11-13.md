# Reply composer visual alignment — 2026-11-13

Owner feedback: “`reply composer` ui style did not match current forum IM design
style.” Continue the single approval MVP on `feat/improve-ui-ux`; preserve the
approved Q1–Q15 behavior. Visual approval remains pending. No ticket publication
or production integration is part of this correction.

Subsequent owner feedback requests a single compact row with full expanded tools.
See [the next MVP revision](composer-inline-feedback-2026-11-13.md).

## Premises and plan before implementation

Compare the actual preview and the current forum at the same 794×871 viewport,
then trace the visual differences to `tsdm-ui-experiment/DESIGN.md`, its design
sample, the sidebar approval prototype and the shared workspace stylesheet.
The baseline has a gray 14px input shell, a 10px Send rectangle, Unicode utility
icons and a doubled focus treatment. The established language uses white 8px
inputs, black pill actions, stroked SVG icons, quiet metadata, 8px menus and 24px
dialogs. The current forum's writer uses a subtle dock shadow and a pastel
destination strip. Earlier writer heights and always-visible tools are obsolete
for this MVP; the approved compact behavior remains the governing requirement.

Correct only prototype presentation: white input with one focus boundary, a quiet
toolbar, pill Send, matching icons, contextual reply strip, flat submitted-post
presentation, standard menus/dialogs and inherited semantic colors. Inspect the
result within the existing reader. This reversible style correction makes no
costly-to-reverse architectural decision and does not require an advisor.

## Failure inventory and verification plan before code

1. Shared styles override disabled controls or leave a second inner focus ring.
   Compare computed styles and screenshots, then Tab through the composer.
2. SVG replacement removes accessible names or changes click targets. Check names,
   44px targets, expansion, target removal, tools, source and Preview.
3. Toolbar or target wraps badly at narrow/enlarged sizes; menus clip; expansion
   leaves no reading area. Inspect 794×871 and 390×844 with 125% app text.
4. Presentation edits alter source or existing scratch drafts. Preserve existing
   writing; use a different empty sample thread for behavior smoke and verify
   source round-trip, submission snapshot, newer draft and failed-reply actions.
5. Styling leaks into the other approval units. Keep selectors prefixed and inspect
   the existing board route. Retain screenshots, observations and replay steps.

## Delivery acceptance

- [x] Match the reference surface, control, icon, spacing and overlay conventions.
- [x] Show a single editor focus treatment and reachable, named controls.
- [x] Fit compact/expanded/tools/target states at normal and narrow/enlarged sizes.
- [x] Verify affected interactions and preserve existing drafts and send behavior.
- [x] Save repeatable browser evidence, pass relevant static checks and inspect scope.

Owner visual approval is separate from these delivery checks.

## Result and verification

The same composer URL now uses the workspace's white 8px input, quiet dock shadow,
black pill Send, shared expand/compact SVGs, matching prototype utility SVGs and
pastel reply context. Input focus has one outer ring; controls keep independent
keyboard focus. Tools use an 8px menu, dialogs use the reference 24px geometry and
modal shadow, and submitted replies align with the flat forum post stream.
Warning text and dashed boundaries replace the unrelated amber palette.

Evidence: `evidence/runs/composer-style-2026-11-13/`. The local package contains
26 recorded observations, screenshots and DOM snapshots, the live forum reference,
source snapshots, replay instructions, static-check output and a SHA-256 manifest.
Verify with `npm run evidence:verify -- evidence/runs/composer-style-2026-11-13`.

At 794×871 the empty/one-line composer is 128px tall, versus 142px in the baseline.
Expanded one-line writing leaves 337px of visible reading. A long reply-target
name at 390×844 with 125% app text remains readable, all observed composer/dialog
buttons meet 44px targets, and expansion leaves 232px of reading. No page
horizontal overflow was observed. Tools remain inside the viewport. The source
editor, formatted Preview, quote insertion, target removal, attachment
unavailability/reattachment/removal, pending snapshot, newer writing, confirmed
success, failed reply Edit and return to the newer draft were exercised. Reload
restored the sample writing; the original first thread's existing submission was
preserved. All writing for this check used an initially empty third sample thread.

The board preview still shows compact Filters, the pin disclosure, secondary
statistics and its empty reader. Vue typecheck, ESLint on changed Vue files,
Prettier and whitespace checks pass. Browser warning/error capture is empty.
Only prototype presentation, one new prototype icon component and delivery docs
changed; the editor/store/submission logic and production files did not.

The initial `narrow-target` and `narrow-expanded` observations still measured
794px: the browser-level viewport override did not target this tab. They remain
in the evidence as enlarged desktop observations. The later `narrow-*-verified`
and `narrow-expanded-final` records measure 390px using the documented tab CDP
capability. Native screenshot capture scaled those views incorrectly; the two
`*-cdp.png` screenshots retain the accurate narrow rendering. Both viewport
overrides and the text-size option were reset. One attempted dialog-close click
found no dialog because Add unavailable attachment had already closed it; the
resulting attachment state was inspected before continuing. Confirm pending reply
always confirms success; the failure check used a subsequent explicitly failed
send, rather than relabelling that successful result.

This verifies the current light preview. It does not qualify other themes, actual
forum publication/uploads, OS IME input, touch keyboards or production integration.
Those behaviors were not altered by this correction. Node 26.0.0/npm 11.12.1
differs from the pinned release runtime. No unit tests were added.

## Trade-offs made in this correction

1. The white text field and separate action row follow the existing workspace
   hierarchy. A bounded field remains visible at rest, costing an extra boundary
   compared with a completely borderless writer; the whole gray enclosing box is
   removed and compact height drops by approximately 14px.
2. Focus moves to the text-field container while editing, suppressing the inner
   editor's inherited shadow. This avoids the doubled ring but includes the
   expansion control inside the outlined region. Tabbed controls retain their own
   ring, and the field ring turns off when focus moves to them.
3. The reply target uses the existing pastel context surface with an explicit reply
   icon. Long author names wrap instead of truncating identity, consuming more
   vertical space; only the excerpt truncates. This favors knowing the destination.
4. Submitted snapshots now use flat, aligned post presentation. They lose the
   immediate “my chat bubble” cue; the status and Retry/Edit actions distinguish
   their local outcome without adding another visual language.
5. Warnings use explicit words and dashed boundaries with the shared monochrome
   palette. They lose amber's color salience but avoid an undocumented semantic
   color and remain identifiable without color perception. Draft labels also use
   existing muted metadata styling.
6. Existing expand/compact icons are reused; missing utility icons live in one
   prototype-only component with the same stroke conventions. This duplicates a
   small SVG wrapper but keeps experimental glyphs out of the production icon API.
7. The tools popup grows from 238px to 256px and the keyboard hint from 11px to
   12px. Both improve legibility and icon alignment, at the cost of more reading
   area being covered while tools are open and more wrapping on small screens.
8. Verification targets changed presentation and affected interactions, retaining
   the previous full behavioral evidence rather than repeating every conflict,
   storage and IME scenario. This bounds a reversible style correction while
   leaving the earlier simulation and production-verification limits explicit.

The approved behavioral choices and earlier implementation trade-offs remain in
the design interview and original MVP record. This correction is ready for owner
visual approval; it does not record that approval or publish a GitHub ticket.
