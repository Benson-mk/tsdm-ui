# Resize every visible column through quiet boundaries

Ticket: #88. Base: `1470a065760f9c444dbfd68d2c758a531ed97ba4`.

## Research and failure inventory

The layout already owns transient docking and writing presentation, one mounted writer, visible text-range anchor capture/restoration, and suppression of scroll-triggered history loading. Settings owns the visible settings surface, while preferences/recovery have distinct persisted owners. Column sizing will remain layout-local memory and use those existing DOM restoration boundaries. No portable or persistence change is selected.

The already approved seam is the complete built application in Edge with only external HTTP responses substituted. The tests observe rendered separators, pointer and keyboard interactions, actual widths and visible reading text, the existing editor and request ledger. No isolated/unit seam is introduced. Red/green work proceeds in vertical slices.

Reachable failures identified before feature code:

- Missing, button-shaped or partial-height boundaries; missing accessible names/values or keyboard focus; wrong physical keyboard direction and no individual/global reset.
- Board/thread/writer widths cross nominal bounds or consume the reader; responsive clamping overwrites desired widths; hidden panes retain a track or target; browse-only results become an artificial narrow column.
- Pointer capture lost outside the workspace, cancelled drags retain an unintended width, non-primary inputs resize, text gets selected, or a wide hit strip steals nearby Settings/menu/writing actions.
- Width reflow loses the actual visible character/post at a nonzero scroll offset, induces earlier/later history requests, or settles against a stale reader after navigation.
- Resizing remounts the writer, changes exact source/selection/undo/target, ends IME incorrectly, or exposes implicit review/send.
- Wide-writing threshold, short/narrow views, long titles, coarse pointers, high text size, themes/forced colors or Settings reset produce overflow, inaccessible controls or invalid separator ranges.

## Verification

Receipts below are retained under `evidence/runs/`. The full application uses Edge and substituted external HTTP only; the UI fixture is test-only and never enters production. Parent coordinator owns installed Edge and designated advisor validation. Chrome remains deferred to #93.

- `2026-11-07T06-19-22.387Z` was a fixture-startup failure (missing charset), not a feature red. `2026-11-07T06-20-01.006Z` is the first genuine red on unchanged accepted #87: Resize Boards was absent.
- Keyboard sizing progressed through `06-21-12.034Z` and `06-22-23.671Z`; the native parser correctly rejected the malformed reply fixture's missing subject. The fixture was corrected without relaxing production validation. `2026-11-07T06-24-00.203Z` passes the keyboard/default/global-reset slice.
- `2026-11-07T06-25-02.625Z` is the pointer red: Boards remained216 instead of276. `06-25-54.863Z` exposed a probe timing error (no two-frame settled geometry wait); `06-26-36.875Z` incorrectly expected empty document selection despite deliberately selecting `original` in the textarea. `2026-11-07T06-27-11.022Z` passes keyboard and pointer continuity with the same genuinely visible Range/post/character/offset and exact selected editor text.
- `2026-11-07T06-28-51.316Z` passes coupled extremes/restoration but its browse assertion incorrectly assumed TSDM navigation discards the retained reader. Fresh-directory and real-reload cases now test those independently without changing retained-reader behavior.
- `2026-11-07T06-29-49.458Z` and diagnostic `06-30-24.977Z` reproduce a genuine near-end reader-anchor defect: expansion moved the captured character from20.27px below the reader top to49.27px above it. The scroll listener remembered geometry before compact-title spacing settled. Refreshing the shared anchor on Vue's next tick after title compaction fixes that stale snapshot. `2026-11-07T06-31-32.973Z` passes all six sizing/history cases without weakening the fully-visible/one-pixel offset assertions or triggering adjacent history requests.
- `2026-11-07T06-34-17.771Z` passes all three coarse touch drags/cancellations and interrupted-pointer cases. Its reachability failure was an incorrect exact menu name (`Thread options` versus observed `More thread options`); `2026-11-07T06-34-47.676Z` passes the corrected short/light/dark/forced-color check without production changes.
- `2026-11-07T06-35-27.221Z` passes visual browser composition and preserves source browser composition through all boundaries, but its subsequent source Undo assertion typed a new character before the existing30ms composition settlement. The test now waits for the observable enabled Undo control before starting the separate edit. This is a browser composition probe, not actual OS CJK qualification; installed qualification owns that distinction.

### Implementation scope

`ColumnSeparator` owns pointer capture/cancellation and keyboard mechanics. `WorkspaceLayout` owns only in-memory desired widths, responsive effective bounds and the existing reading restoration lifecycle. `SettingsDialog` emits the reset intent back to that layout owner. Existing preferences, workspace recovery, editor state/transaction history and portable contracts remain their existing owners.

Default216/300/420 and nominal160–360/220–520/280–640 are tightened against the actual available layout, retaining desired widths for later restoration. Browse-only results fill the remaining space. Invisible panes and minimized/below-reader writing have no corresponding target or empty grid track. Pointer gestures keep the existing editor focus, while keyboard separators keep keyboard focus. Drag cancellation restores the pre-gesture desired-width snapshot. No new reload storage is written.

### Frozen candidate and current acceptance

The frozen candidate is `88-provisional-build-2026-11-07/tsdm-ui.user.js`, SHA-256 `17cbd790575d63b916361b52de4c7e1911a12458ecf25b887de4ff2938e84a42`, 2,171,241 bytes. A fresh complete build is byte-identical to the tested executable; the complete33-file build manifest is verified. All30 portable `forum-client` artifacts remain byte-identical to accepted #87, so no new external-consumer run is required.

`2026-11-07T06-36-32.883Z` passes112 of113 affected cases, including all11 new #88 cases. Replay:

```sh
npm run test:e2e -- tests/e2e/column-resizing.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/thread-tools.spec.ts tests/e2e/automatic-history.spec.ts tests/e2e/thread-history.spec.ts --max-failures=3
```

The unchanged `UI85.cached-native-inline-board` fails its absolute-screen-position assertion by11.75px. The same actual text remains fully visible and its relative reader offset changes only31.6875→31.671875px. Two focused repetitions in `2026-11-07T06-38-04.830Z` reproduce it. Exact accepted #87 executable a129 reproduces the identical11.75px failure in `2026-11-07T06-38-53.061Z`, establishing inherited cross-navigation behavior. The assertion and production cached-navigation behavior are unchanged; this case remains failed and is not counted as passing evidence. The designated advisor accepted this as disclosed inherited behavior rather than a blocker for the verified #88 resizing criteria; the failed case remains failed.

All new resizing tests use actual pointer/keyboard input and rendered dimensions. Coarse touch uses Edge's browser input dispatch and18px targets; source/visual composition uses browser composition dispatch, explicitly distinct from actual OS IME. The three themes' nearby menu/Settings/writing controls remain operable, and rendered controls' center hit tests are not intercepted by separators. Near-history-edge tests retain the same visible character within1px across viewport and direct width reflow, with no extra requests; cancellation preserves the exact source and selection and subsequent Undo/Redo. Real reload resets the page-local desired widths.

Build, typecheck, lint, formatting and diff checks pass. `88-offline-checks-2026-11-07` preserves command outputs, source identities, production diff and candidate metadata. The responsive minimum-width and short forced-color screenshots were visually inspected: quiet edges, readable content and reachable Settings/input/Review remain present; the expanded writer scrolls its existing rich controls within the bounded aside.

- [x] Quiet full-height visible boundaries and Reading residual sizing.
- [x] Pointer/cancellation, named keyboard separators, values and individual/global resets.
- [x] Parent defaults/bounds, protected reader, desired widths restored after responsive clamping, real reload reset.
- [x] Hidden unavailable edges/tracks, coarse reachability/focus and neighboring control operation.
- [x] Genuine nonzero visible-character/post/offset, exact editor identity/content/selection/undo, no resize-induced history loads or new page selection.
- [x] Every boundary/extreme/cancellation/reset/responsive/minimized/wide/long-title/overflow scenario.
- [x] Existing architecture/source/recovery/guarded navigation/review owners retained; no portable or persistence change.
- [x] Pre-feature failure inventory and named full-app red/green expectations with repeatable identity/artifact receipts; no unit tests.
- [x] Static/build checks, affected installed Edge qualification and final designated advisor validation pass on exact frozen17cbd. All nine criteria are verified; inherited failed cached-navigation evidence remains disclosed above. Chrome remains deferred to #93, not passed.

### Completed advisor validation

The designated gpt-6.1-sol/xhigh advisor completed terminal validation using `validate-gpt-code-review`. It verified acceptance criteria1–8, found no implementation blocker and recorded no additional distinct actual trade-off. Its independent11/11 Edge replay is retained in `2026-11-07T06-41-48.803Z`; the87-file evidence manifest was verified. These checks qualify the unchanged frozen17cbd candidate and do not substitute for installed extension qualification.

After reconnection and installed qualification, the designated advisor accepted criterion9 and all nine criteria for unchanged17cbd, with no blockers or additional distinct trade-offs. Historical failures retain their original dispositions, and Chrome remains explicitly deferred to #93.

### Final installed Edge and native CJK qualification

`88-installed-2026-11-07/report.md`, `receipt.json` and repeatable `verify.py` retain the final installed evidence. The exact90-file manifest was verified (91 physical files including the manifest), and the evidence was copied and verified in the integration checkout. Full Tampermonkey MCP readback matches frozen17cbd exactly: 2,171,241 bytes, 2,107,362 characters. A fresh forum tab executed that installed script after the browser restart. The installed context has reader and writer1265238, board4; differing reader/writer targets remain covered by controlled full-application evidence.

Captures01–23 verify available quiet separators, defaults, every drag/keyboard/Home/global reset, coupled maxima360/520/506 with Reading320,1440 clamping360/480/280, hidden767 edges,1706 desired-width restoration, native Escape rollback and minimized/resumed writing. Captures04–18 own the genuine nonzero visible-character continuity assertions, within1px of the original reader-relative12.4765625px. The bounded reading-resize interval has no requests. Actual Bold, exact Undo/Redo, same source element and selection survive writer420→480.

The owner selected macOS Phonetic–Cantonese. Source captures25–27 record trusted native composition starts, updates and inputs before/after writer420→480, the same focused textarea and exact pending text, followed by native Space converting only the final `nei` to `你`. Visual captures34–37 repeat that sequence on the same focused contenteditable, with exact source readback `[b]UI88 visual evidence retention你[/b]` and no requests in the bounded native resize interval. These keystrokes used the native app, not browser composition dispatch. Application-generated compositionend events remain marked untrusted and are not treated as native events.

Capture24 is an incomplete Latin-only setup probe and is not an OS IME pass. Initial Visual captures28–31 were superseded for event qualification after geometry/event filename collisions;34–37 retain the complete repeated sequence with distinct names. The owner moved reading scroll while preparing native input, so native-phase geometry does not claim preservation of the earlier reading Range. The earlier anchor and later native-composition scopes remain separate.

Final capture38 restores the initial empty unsent reply and216/300/420 desired defaults, resets the explicit viewport override to the user's current natural1520×741 window, and removes passive listeners and the temporary probe. No Review, Send, upload or forum save occurred. Authenticated captures stay private and outside the commit. No production change or additional trade-off was introduced by qualification.

## Distinct actual trade-offs

1. Responsive allocation deterministically gives Boards its desired available width, then Threads, then Writing from the residual while reserving320px for Reading. Thus tightening may shrink a later pane before an earlier one; all desired widths remain available when space returns. With manual sizing, the wide writer can fit at280px plus320px Reading (600px measured conversation width), replacing #87's preferred420px plus320px placement threshold while keeping the1440px viewport rule.
2. The12px/18px hit areas overlay the pane boundary and consume no grid track. They extend equally into each neighbor to keep quiet edges reachable; preventDefault and pointer capture retain editor focus/selection, while Escape, pointer cancellation, lost capture and unmount roll back the entire original width snapshot. This requires a short-lived global Escape listener during the captured gesture, cleaned up on every finish.
3. Reflow reuses the layout's existing visible-character Range and restoration/history-suppression owner rather than introducing a second anchor model. Refreshing that snapshot after compact-title geometry settles fixes near-end viewport resizing too; it adds one Vue next-tick measurement only when title compaction actually changes.

Parent-mandated defaults/bounds, in-memory-only widths, quiet boundaries, full-app network-edge testing and the Edge-first cadence are inherited decisions, not additional trade-offs.
