# Modern IM reply composer approval MVP — 2026-11-13

Branch: `feat/improve-ui-ux`. The owner confirmed the consolidated
[Q1–Q15 design](composer-feedback-design-2026-11-13.md). Build one isolated
interactive unit for visual approval; production integration and GitHub ticket
publication remain later work.

The owner subsequently rejected the visual match with the existing forum IM.
See [the visual correction and its evidence](composer-style-feedback-2026-11-13.md).
The revised MVP still awaits owner visual approval.

## Plan and feasibility before implementation

Use the prototype skill's existing-page UI approach at
`src/layouts/thread-browsing.prototype.html?unit=composer`. The owner's single
unit/current-branch workflow overrides the skill's default three variants and
throwaway branch. Keep the existing reader, post menus and list-position behavior.
Add a clearly named prototype component and scoped styles, using the existing
source-preserving editor session and inert editor DOM renderer. Real forum
publication and uploads are simulated and clearly identified in preview controls.

Persistence is explicitly part of the design being explored. Use a separate,
versioned localhost prototype namespace, storing fictional writing and submitted
snapshots. Retain separate revisions to make cross-tab conflicts inspectable and
recoverable; do not choose a production storage architecture or modify ADRs.
Expose simulation controls and relevant state outside the proposed product flow.
This reversible prototype introduces no one-way technical decision requiring an
advisor. It is not release qualification.

## Failure inventory and E2E expectations before code

1. Resting composer occupies too much space; expansion obscures all reading or
   narrow/enlarged layouts clip tools. Inspect desktop, 907px and 390px/125%.
2. Visual/source transitions alter BBCode, lose text/selection or fetch referenced
   content. Exercise formatted text, source round-trip and optional inert preview.
3. Enter/newline/IME handling sends unexpectedly or repeats. Exercise visual Enter,
   Shift+Enter, source Enter/Ctrl+Enter and a labelled synthetic IME sequence.
4. Retargeting or changing threads loses writing. Exercise two threads, target
   replacement/removal, separate quoting and list draft indicators.
5. Reload or another account loses shared writing; incompatible uploads become
   silently valid. Exercise reload/new-tab restoration, simulated account switch,
   unavailable attachment chips and reattachment/removal.
6. Send clears the only copy, duplicates on repeated activation or marks unknown
   results successful. Exercise pending snapshots, further typing, send blocking,
   success/failure/unknown/check-result transitions and reload while pending.
7. Editing a failed reply overwrites a newer draft. Exercise a separate correction
   context and returning to the retained newer draft.
8. Cross-tab updates overwrite conflicting text. Exercise actual separate tabs,
   concurrent branches, choosing a version and access to the retained alternative.
9. Storage refusal silently loses content or allows send without retention.
   Exercise a labelled refusal scenario and recovery without discarding text.
10. Existing default/reader/board previews regress. Smoke-check their routes.

## Preview-delivery acceptance

- [x] Present compact/growing/expanded visual authoring, + tools, source and Preview.
- [x] Exercise target changes, keyboard behavior and per-thread shared restoration.
- [x] Exercise pending/success/failure/uncertain outcomes and preserved newer writing.
- [x] Exercise unavailable attachments, cross-tab conflict retention and storage refusal.
- [x] Inspect responsive/enlarged layouts, existing routes and relevant static checks.
- [x] Retain repeatable browser observations, screenshots, source snapshots and hashes.

All six preview-delivery criteria are verified at the local simulation scope below.
Owner visual approval remains separate from delivery acceptance.

## Delivered unit

Run `npm run dev -- --port 5173`, then open
`http://127.0.0.1:5173/src/layouts/thread-browsing.prototype.html?unit=composer`.
The first sample thread opens with the composer ready to use. The earlier default,
reader and board routes keep their existing previews. No production entry point
imports the new composer resources.

The unit provides visual authoring, exact BBCode access, optional inert Preview,
formatting/link/quote/emoji tools, sample attachment chips, expansion, removable
reply targeting and empty-post-space reply access. Draft badges do not change row
height. Thread-specific source, target and attachment metadata restore from the
prototype's local history. There is no sender label in the composer.

Use **Preview controls** in the footer for simulated success/failure/uncertainty,
held sends, current-account changes, unavailable files, storage refusal, conflicting
versions and a synthetic IME event sequence. Inspection details and sample controls
are outside the proposed product composer. **Reset prototype data** clears only
this demonstration's namespaced records; the real workspace is never touched.

## Verification and replay

Evidence: `evidence/runs/composer-preview-2026-11-13/` (Git-ignored local artifact).
The package contains 55 observations, 22 screenshots, console capture, replay steps,
source/dependency snapshots and a SHA-256 manifest. The evidence verifier passed
exact coverage, safe paths, byte sizes and hashes for all 50 package files. Verify with:

```sh
npm run evidence:verify -- evidence/runs/composer-preview-2026-11-13
```

Observed journeys:

- Bold selection retains `[b]...[/b]` in source. Link formatting retains the exact
  `[url=https://example.com/reference]Useful reference[/url]` source and renders as
  inert underlined text. Explicit quoting inserts a block; removing/retargeting
  the addressed-post strip preserves existing text and quotes. Emoji inserts in
  both visual and source modes. Optional Preview shows the same inert rendering.
- Source Enter inserts a newline; Ctrl+Enter sends. Visual Shift+Enter retains an
  actual line break and Enter sends. The labelled synthetic IME sequence does not
  submit. Actual OS input-method composition was not exercised.
- Two threads keep distinct text and draft badges; switching restores the first
  thread's quote/content. Reload and a newly opened second tab restore retained
  writing. A simulated account switch retains the same draft and makes another
  account's sample attachment unavailable; Reattach restores its sample readiness.
  A real browser-process restart was not exercised.
- A held send retains a separate submitted snapshot, clears the composer and permits
  newer writing. Another shortcut activation does not create a second attempt.
  Reload changes that interrupted attempt to Unconfirmed, retaining the newer
  draft. Check status can establish Not sent before Retry/Edit becomes available.
- Editing a failed reply uses a separate correction context. Back to draft restores
  newer writing; reopening Edit restores the correction. Sending the correction
  restores the newer draft while its submitted snapshot waits. The explicit retry
  path was also observed through confirmed sample success with the newer text intact.
- Two actual browser tabs start from one draft. Pausing incoming updates in the
  second tab models a delayed event; both tabs then edit that common version.
  Both conflicting texts appear in Choose draft. Choosing one updates the other
  tab; Saved alternatives still contains both originals. Explicit thread switching
  also restores the correct draft while the delayed-update simulation is enabled.
- Simulated storage refusal leaves the unsaved text visible, disables sending and
  prevents changing threads. Try saving again acknowledges the retained text;
  reload restores it. No fallback writes into the production recovery namespace.
- At 907×871, the one-line compact composer is approximately 142px tall; addressed
  expansion is approximately 336px, leaving 269px of visible reading. At 390×844
  with 125% app text, expanded addressed writing leaves approximately 265px of
  reading. Tools, source editing and return-to-list remain reachable without page
  horizontal overflow. Temporary viewport/text overrides were reset. The final
  user-facing sample is retained at the app's normal viewport.
- Existing reader Reply still opens its previous local textarea. Board filters and
  the pin/count control remain present, with no modern composer mounted. The
  default preview still opens its empty-reader placeholder.

Early observations are preserved rather than relabelled: `thread-two-newline`
exposed a missing Shift+Enter binding, corrected and verified in `shift-enter-fixed`.
The original correction-context switch lost focus on an unmounted editor; the
final `failed-edit-focus-fixed` observation confirms focus on the replacement.
Storage-failure navigation was guarded and rerun in
`storage-refusal-blocks-switch`, `storage-recovered` and `recovered-text-reloads`.
During live reload, one source-mode selector became stale; the actual editor mode
was inspected and the source-send journey resumed successfully.

Final static checks: Vue typecheck; ESLint on changed Vue/TS modules; Prettier on
changed code; extracted HTML-module syntax; and whitespace checks pass. The browser
warning/error capture is empty. Node 26.0.0/npm 11.12.1 differs from the pinned
release runtime. No unit tests were added; these are local end-to-end preview
observations, not installed userscript or server-operation qualification.

## Additional implementation trade-offs

The 14 accepted behavioral trade-offs remain in the design interview record. The
following are distinct choices made to deliver this prototype:

1. Reusing the real editor session and inert node/mark renderer demonstrates source
   fidelity without coupling to a live writing context. This carries the editor's
   existing interpretation limits into the preview; unsupported source is retained
   rather than approximated by a new HTML-to-BBCode converter.
2. An append-only, versioned localhost scratch history makes competing draft
   revisions and alternatives inspectable. Every edit adds a record, increasing
   storage use; there is no compaction, migration or production storage selection.
   Explicit Reset removes this disposable history. Browser storage refusal remains
   visible and blocks switching while unsaved text exists, adding an interruption.
3. Draft source, target and attachment metadata persist; caret position, expansion,
   editor-mode selection and scenario settings are transient. Reload starts in the
   visual presentation where the source can be represented. This keeps persistence
   focused on writing content rather than reproducing the whole UI session.
4. Submission, account and attachment outcomes are labelled local simulations.
   Successful outcomes settle after 1.6 seconds unless held. There are no real file
   bytes, upload requests or forum preparation/readback. Attachment selection uses
   two fictional samples, showing recovery placement without qualifying uploads.
   This cannot establish real cross-account reuse or forum rendering/permission rules.
5. Submitted snapshots and corrections are separate from the next ordinary draft.
   A session-local owner identifies interrupted pending simulations on reload;
   status is rechecked through a scenario control. This models recovery without
   claiming atomic cross-tab submission exclusion, crash guarantees or automatic
   server reconciliation. The sample requires nonempty body text to send.
6. Native dialogs and ordinary focusable buttons keep tool/recovery controls usable
   by keyboard with minimal overlay machinery. The + popover uses normal Tab order;
   it is not a fully qualified production menu. Representative narrow/enlarged
   layouts were inspected; physical touch, virtual keyboards and all OS input
   methods remain outside this preview evidence.
7. The new component is gated by `unit=composer` in the existing sample reader.
   Sample-only reader/HTML files gain a small integration surface, and prefixed
   styles coexist with shared CSS. Reusing that context avoids rebuilding a parallel
   workspace, but shared styles can affect the prototype later; exact sources are
   retained. Only affected prior routes were smoke-checked.
8. Manual browser journeys with recorded state, screenshots, replay instructions
   and hashes make the approval artifact repeatable without adding a regression
   suite to throwaway code. Historical exploratory failures remain in the evidence;
   final observations identify their corrections. This is design evidence at the
   stated environment, not release acceptance.

All interaction results above concern the local prototype. Owner visual approval,
production implementation, production storage/contract decisions and GitHub ticket
publication remain pending.
