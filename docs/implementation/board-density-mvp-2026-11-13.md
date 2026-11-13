# Compact board controls approval MVP — 2026-11-13

Branch: `feat/improve-ui-ux`. Four new browser comments, distinct from the earlier
reader comments 4–7. Record for later GitHub tickets and preview one bounded unit
for owner approval. No ticket publication or production implementation is requested.

## Evidence and plan before implementation

The owner supplied annotated 878×871 browser evidence:

1. “collapse the fliter, in a denser way IM style” — the board's category/type/
   reward/sort/time/order groups consume most of the page before any thread.
2. “what this space for?” — the selected board-check actions look empty.
3. “it is a additional info not title” — today/thread/rank statistics are included
   in the bold board heading.
4. “collapse the pinned thread to pin” — several full pinned cards precede ordinary
   threads. Interpret as one labelled pin/count control that reveals pinned titles.

Source inspection: `WorkspaceLayout.vue` renders all board filter groups expanded.
`styles.css` reserves two rows in `.board-check-status`, including an action row
of at least 44px. The details control uses visibility:hidden when no failure, so
its space remains. This reservation was intentional for stable rows in #90. The
screenshot's empty appearance does not prove a particular active failure state;
retain failure/retry visibility in the proposal instead of removing failure UI.
`read-board.ts` currently takes the entire native h1 text as board.title. The
portable board has no separate board statistics field; production must parse
source structure rather than guess by splitting translated title strings.
Pinned status is already explicit on ThreadRow (native stick/list_top provenance).

Use the prototype skill already used in this chat. Extend the existing browsing
preview behind `?unit=board`, keeping its approved fixed list and reader. The older
Boards-directory filter preview concerns a different screen and stays pending.
User's one-MVP/current-branch workflow overrides the skill's default variants and
throwaway branch. No costly-to-reverse decision is involved, so no advisor is
required by the updated instructions.

Proposal: board title alone; a smaller muted statistics line; a 44px toolbar for
Filters (with active count), Pinned (with count), and Refresh. Filters open a
compact native dialog with the six source groups retained. Apply/Cancel protects
unfinished choices; selected criteria stay visible when collapsed and Clear
restores all samples. Use explicitly fictional local category/type/reward/time
matching and ordering. Pinned rows are a collapsed group with title-only rows,
not removed threads. All available pinned samples stay accessible independent of
ordinary-list filtering, with a visible note explaining that choice. No persistence.
Refresh scenarios are labelled simulations; quiet reserves no status space,
failure exposes Retry and Details, checking is visible, arrivals reveal only by
explicit action. No actual forum requests.

## Failure inventory before implementation

1. Collapsing filters hides active criteria, loses Cancel semantics or removes a
   source group by assuming Sort and Order are duplicates.
2. The compact toolbar clips at 300px/390px or enlarged text, or action targets
   become too small to use with touch/keyboard.
3. Failure disappears with the removed blank space; a failed check looks successful.
4. Counts or title statistics look like live values, or fabricated parsing is
   mistaken for a production title fix.
5. Pinned threads disappear entirely, lose destinations or become unreachable after
   filtering; expanding/collapsing them unexpectedly navigates the selected reader.
6. Filtering loses selected reader/writing or back-to-list focus targets a hidden row.
7. A filter combination with no matches lacks clear recovery.
8. The enhanced board unit changes the existing reader/default routes unexpectedly.
9. New controls shift list position during open/switch/close, or scope grows into
   redesigning production navigation and refresh owners.

## Preview-delivery acceptance

- [x] Capture all four comments with source facts and intended outcomes.
- [x] Exercise collapsed filters, Apply/Cancel, active criteria and no-match recovery.
- [x] Exercise compact status/failure/retry and pinned reveal/open/collapse.
- [x] Inspect title/stat hierarchy, desktop/narrow/enlarged layout and list continuity.
- [x] Pass relevant static checks and retain repeatable browser evidence.

Owner design approval is separate from delivery acceptance. Actual trade-offs and
verification will be recorded after the preview is exercised.

## Delivered unit

Run `npm run dev -- --port 5173`, then open
`http://127.0.0.1:5173/src/layouts/thread-browsing.prototype.html?unit=board`.
The default and `?unit=reader` previews retain their earlier presentation. Only
explicitly named prototype resources changed; no production entry point imports
the board-density module.

The board now has a title-only h1, a muted statistics line, and a toolbar with
Filters, Pinned · 2 and Refresh. Six filter groups fit into a compact dialog;
active choices appear below the toolbar and can be cleared. Pinned titles reveal
on demand and open the same reader. Quiet status occupies no space; failed,
checking and new-thread scenarios can be exercised from the labelled footer.

## Actual trade-offs

1. Collapsing filter groups into a dialog greatly reduces their default footprint
   but requires opening the control to see choices. Active criteria and count stay
   visible. Apply/Cancel adds a confirmation step and allows several choices to be
   changed together without navigating immediately. At narrow widths the dialog
   uses one column and may scroll instead of shrinking action targets.
2. The labelled pin/count control is clearer than an unexplained icon but consumes
   more toolbar width. Collapsed pins put ordinary threads first; opening the group
   moves the list below it. Expanded pins show titles only, leaving author/activity
   details to the reader rather than reproducing full thread cards.
3. Pins remain independently accessible while ordinary threads are filtered. This
   prevents announcements from disappearing but means the pin count is not a count
   of filter matches. The expanded group states this explicitly. Approval of this
   interpretation of “collapse … to pin” remains pending.
4. Removing reserved quiet status space brings threads higher, but visible
   checking/error/new-thread strips now move rows when state changes. This differs
   from #90's stable reservation and is a proposed visual policy, not a production
   change to that guarantee. Failure and Retry/Details remain visible; details take
   an extra action. Ordinary thread open/switch/close retains list position.
5. Statistics use smaller muted text to establish secondary importance, making
   them less prominent. Fictional separate fields demonstrate this hierarchy;
   production must separate native heading structure and statistics in the parser,
   rather than assume a CSS-only fix or split arbitrary board names.
6. The existing HTML preview receives a small DOM/CSS module behind `?unit=board`.
   It reuses the approved list/reader and shared styles without adding a framework
   abstraction. Hidden rows require anchor/focus handling, and shared CSS can change
   the preview later, so source snapshots are retained. The native dialog provides
   ordinary modal/keyboard behavior but is not full production overlay/accessibility
   qualification. Existing default/reader routes were smoke-checked.
7. Sample data, reduced category choices and local filter/order simulations make
   the interaction quick to inspect without forum requests. They do not qualify
   real filter combinations, source URLs, account rules, refresh scheduling or
   arrival ordering. Both source-labelled sort groups remain visible; the demo
   gives Order precedence rather than deciding whether production can merge them.
   Refresh resolves locally after 700ms; manual scenarios demonstrate failure and
   explicit reveal. One additional sample appears only after Show. State is in
   memory and resets on reload, with no persistence/recovery promise.
8. Manual end-to-end browser journeys plus screenshots, observations, source
   snapshots and hashes provide repeatable approval evidence without an automated
   regression suite. No unit tests were added after implementation. This is local
   preview verification, not installed userscript, physical touch or release
   qualification. Node 26.0.0/npm 11.12.1 differs from the pinned release runtime.

## Verification and replay

Evidence: `evidence/runs/board-density-preview-2026-11-13/` (Git-ignored).
Verify it with `npm run evidence:verify --` followed by that directory.

- At the normal 824×871 viewport, the list remains 300px wide. The h1 is 24px and
  statistics are 12px; the toolbar including its separator/padding is 53px tall,
  with 44px action targets. Quiet mode has no status element occupying layout.
  This is not a pixel-for-pixel before/after claim against the supplied screenshots,
  which show additional native content not reconstructed in this bounded unit.
- Filters → Category 生活 → Cancel retains all 21 sample ordinary threads and
  returns focus to Filters; reopening resets the uncommitted choice. Apply gives
  seven rows with a visible criterion/count. Adding Reward 已解決 gives zero rows;
  Clear filters restores 21 and focus. Thread type 投票 + time 一週 + both sort
  groups yields four samples in the indicated demo order. Escape also restores
  focus. All six groups remain reachable.
- Pinned reveals two title rows, each 52px tall including row padding. Opening a
  pin targets its reader. Collapsing pins leaves that reader intact; Back focuses
  the list when the selected pin is hidden. Pins stay available with ordinary
  filters active. Filtering out an open ordinary thread preserves its reader and
  sample reply text; Back likewise focuses the visible list rather than a hidden
  title.
- Check failed shows Couldn't refresh, Retry and Details. Details explains that
  retained threads remain available and discloses the simulation. Keyboard Retry
  shows checking and returns focus to Refresh when the local completion restores
  quiet. New threads stages one sample; Show changes 21 to 22 only on activation.
- Direct clicks on visible rows 910007 and 910008 at desktop keep scrollTop=871
  through open/switch/close. The normal fixed list remains mounted.
- At 878×871 and 125% text the 300px column/toolbar fits without horizontal
  overflow. At 390×844 and 125% the filter dialog's one-column fields and actions
  remain reachable. Returning after text reflow preserves row 910005 at y=23.484375
  before and y=23.375 after, with scrollTop adjusting 591→650. Temporary viewport
  overrides were reset.
- Default-route smoke check retains its prior empty-reader layout and scrolled
  list action; `?unit=reader` still opens the earlier reader MVP. The application
  warning/error capture is empty. Browser automation's own SDK warnings are not
  application console errors.

During exploration, the exact label locator for Category included option text in
its implicit label; the browser's accessibility tree correctly named the control.
Verification used the observed select name. Keyboard Retry initially removed its
focused button; the final preview focuses checking and restores Refresh on
completion. A first-child separator depended on hidden-row ordering; an explicit
board-only rule now avoids that 1px variation. Early observations retain their
scope; final focus observations and screenshots are identified in the report.

Static verification: Vue typecheck, changed-module ESLint, JS and extracted HTML
module syntax, changed-file Prettier and whitespace checks pass. Vite's existing
config-loader warning concerns a future Vite default and does not prevent this
preview. The sandbox initially denied the local listener; the approved local
server launch succeeded. No production tests/build or live forum changes occurred.

All preview-delivery criteria are verified. Owner approval, production integration
and ticket publication remain pending. No irreversible design decision was made;
under the replacement AGENTS instructions this task did not require an advisor.
