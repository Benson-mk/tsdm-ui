# Single-row composer and full expanded tools — 2026-11-13

Owner feedback on the composer input shell at 905×870: “in one line”, with
“a expand mode should keep full function.” Continue the isolated approval MVP on
`feat/improve-ui-ux`. Interpret this as a single compact action/input row and an
expanded editor that retains all current writing tools and behavior.

## Plan and failure inventory before implementation

The current input and action footer are two separate rows. Use one grid containing
the existing tools group, editor/expand control and Send; keep the same editor
instance across presentation changes. In compact mode show +, writing field,
expand and Send on one row. Let authored multiline text grow, as previously
approved. Keep the shortcut description accessible and show it in + tools; reserve
the permanent hint for expanded mode. Use an icon-only, named Send in compact mode
to leave useful writing width on narrow screens. Expanded mode exposes attachments,
emoji, formatting, complete BBCode and Preview above the larger editor and keeps
Send and keyboard guidance below it. These are the MVP's existing functions,
including its local simulations, not new production forum capabilities.

This is a reversible prototype layout choice with no new storage or publication
contract, so it does not trigger the one-way-decision advisor requirement.

Before code, verify these potential failures through browser journeys:

1. Compact +, input, expand and Send wrap or overlap at 905px and 390px/125% text.
   Measure their rectangles and capture screenshots; targets remain at least 44px.
2. Expansion remounts the editor, loses source/selection, hides tools or leaves no
   reading area. Keep one editor in the DOM and exercise both modes with formatted,
   multiline source, reply context and an attachment.
3. Hidden shortcut text becomes undiscoverable or tools lose keyboard access.
   Associate the editor with its mode-specific description and expose the same
   hint in the compact tools popup; inspect names, Tab focus and Escape.
4. Source/visual toggles, tools or the moved Send bind incorrectly. Exercise
   formatting, emoji, attachment, Preview, source Enter and visual send/newline,
   plus an IME simulation. Preserve all existing user writing; use an empty sample.
5. Expanded tools cover the editor at narrow sizes or overflow with target/chips.
   Allow tool labels to wrap and the editor to shrink/scroll within the reader's
   existing height cap. Verify visible reading and reachable Send.

## Delivery acceptance

- [x] Compact controls and writing field occupy one row at normal and narrow sizes.
- [x] Expanded mode retains all current tools, source editing, Preview and Send.
- [x] Switching presentation preserves writing, target and attachments.
- [x] Keyboard access, shortcuts and representative responsive states are verified.
- [x] Save repeatable evidence and pass relevant static checks before committing.

Owner visual approval remains pending; GitHub ticket publication and production
integration remain later work.

## Delivered behavior and verification

The compact composer now places +, the writing field with expansion, and the Send
arrow in a single grid row. Empty/short writing occupies a 76px dock at 905×870
and the normal 794×871 viewport, down from the preceding 128px design. At 390×844
with 125% app text, a short reply occupies approximately 79px. Multiline writing,
reply context, attachment chips and recovery notices can still add height.

Expanded mode keeps a visible strip for attachments, emoji, formatting, complete
BBCode and optional Preview. The existing formatting dialog retains Bold, Italic,
Underline, Quote and Link. The larger editor, keyboard hint and labelled Send are
present together; collapse keeps the same draft and editor session. The compact
tools popup retains text labels and shows keyboard guidance. Both visual and
source inputs reference the mode-specific shortcut description with aria-describedby.

Recorded browser journeys at `evidence/runs/composer-inline-2026-11-13/` cover:

- Tab from + to the editor, Escape from tools back to the editor, accessible
  shortcut descriptions, and at least 44×44px observed action targets.
- Bold applied through Formatting and inspected as exact `[b]...[/b]` source;
  source Enter retains a newline, visual/source switching, emoji insertion,
  sample attachment selection, target selection and formatted Preview.
- Collapse/re-expand retains the text, formatting, reply target and attachment.
  The initially empty fourth sample thread was used for authored test data;
  pre-existing first/third-thread content was not rewritten or reset.
- A synthetic IME confirmation in expanded visual mode does not send. Expanded
  source Ctrl+Enter sends the retained sample snapshot, and the next draft remains
  editable. Compact Shift+Enter adds a line; Enter sends the next local sample.
- At 390px/125%, compact tools fit the viewport. Expanded tools remain in one icon
  row; target/chip/source states keep Send reachable without page overflow. The
  most crowded final target-plus-attachment view leaves about 114px of reading;
  its extra IME status line leaves about 93px. Ordinary expanded writing at 905px
  leaves about 284px of reading. Viewport and text-size overrides were reset.

The package contains 27 observations, DOM snapshots, screenshots, replay steps,
source snapshots and a SHA-256 manifest. Verify with:
`npm run evidence:verify -- evidence/runs/composer-inline-2026-11-13`.
Typecheck, ESLint, Prettier and whitespace checks pass. Final browser warnings and
errors are recorded in `console.json`. No unit tests were added.

Early screenshots of a 905px emulated viewport tiled the area beyond the native
794px surface. Accurate final captures use an explicit viewport clip with capture
beyond the native surface; the early captures remain historical evidence. The
first expanded toolbar used visible text labels, which occupied three rows on
narrow/enlarged screens. The final icon strip retains names and titles while
reserving more room for editing. A shared hover rule initially turned Send gray;
a scoped primary-action hover rule now preserves the black/white appearance.

The first static run found the new optional description prop needed a default.
Using undefined conflicted with exact optional property types; an empty default
with omitted empty DOM attributes passes both checks. The final description/source
switch was rechecked in the browser after this correction.

These are local preview simulations on Node 26.0.0/npm 11.12.1, not release
qualification. Actual forum posting/uploads, OS IME input and physical touch
keyboards remain outside this evidence; existing persistence/recovery semantics
were not redesigned.

## Trade-offs made in this revision

1. A single row reserves fixed space for +, expansion and Send, reducing text width
   while saving 52px of resting dock height. Long text still wraps/grows instead of
   being truncated to enforce a literal one-line text limit.
2. Compact Send uses an arrow with an accessible name and title; its visible word
   returns in expanded mode. This preserves writing width but relies more on icon
   recognition when compact.
3. The shortcut hint moves out of the compact row into + tools and the editor's
   accessible description. This reduces clutter but makes keyboard instructions
   less immediately visible; expanded mode shows them continuously.
4. Expanded tools use icons with titles and accessible names, while compact popup
   entries keep text labels. This avoids a tall wrapped toolbar but lowers visual
   discoverability, particularly for touch users. Formatting keeps its existing
   secondary dialog instead of introducing another set of formatting controls.
5. Both layouts share one editor and one set of tool handlers. Grid placement adds
   presentation rules, but expansion avoids replacing the editor session or
   duplicating command behavior. The optional description prop adds a small
   prototype interface for semantic shortcut guidance.
6. Expanded editor height is bounded and can shrink/scroll when context, chips or
   notices compete for room. All controls remain usable, but the crowded narrow
   example leaves less reading area; it does not promise a fixed reading minimum.
7. Expanded tool buttons pause during IME composition, matching the existing
   compact + and expansion guards. This briefly delays tool activation to avoid
   changing modes during text composition.
8. A scoped hover override protects the primary Send palette from generic shared
   button rules. It adds specificity in the prototype stylesheet without changing
   production styling.
9. Verification focuses on the rearranged controls and representative authoring
   paths; earlier conflict/storage/failure evidence remains applicable context.
   The complete previous recovery matrix was not repeated for this layout edit.

All delivery criteria above are verified. Owner approval of the new visual layout
is still a separate next step, and this record does not publish a ticket.
