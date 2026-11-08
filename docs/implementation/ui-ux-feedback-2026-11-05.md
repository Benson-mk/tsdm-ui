# Sidebar feedback and approval preview — 2026-11-05

Branch: `feat/improve-ui-ux`. Status: selected MVP refinements captured; the consolidated production specification is published as [issue #81](https://github.com/Benson-mk/tsdm-ui/issues/81) with `ready-for-agent`.
This is the historical feedback and prototype-evidence record. Issue publication does not establish owner visual approval or production acceptance; earlier no-publication statements describe their respective iteration dates.

## Follow-up selections — 2026-11-05

The owner selected group colors, discarded the Chinese-font experiment, initially selected footer B, then corrected item 6 to A, and moved About inside Settings. These supersede the original comparison options below. No font-stack change is requested. Keep one accessible Settings icon beside the account; show About as a section in Settings, without an additional nested dialog.

The owner also asked whether the hover color came from `/Users/benson/Documents/code/tsdm-ui-experiment/DESIGN.md` and whether the MVP was edge-to-edge. Inspection confirmed that the original `#edf2f7` hover color, sample dot colors and blue focus ring were outside its palette. Correct the preview to approved tokens: soft hover `#eeeeee`; Community `#ebf5e8`, Anime `#dda49f`, Creative `#a29bba`, Music `#a6c6e1`; black/white focus treatment. Keep selected primary fill unchanged and underline its label on hover as specified. Group assignments remain synthetic pending real forum group mapping.

The initial preview filled the viewport but did not implement the complete edge-to-edge contract in DESIGN.md: `viewport-fit=cover`, safe content insets, visual-viewport keyboard behavior and device checks. Rounded cards and pane gutters are allowed by that contract. For this revision add viewport cover and basic safe-area protection to the sample's owning surfaces/content, and use the documented 216px/300px desktop tracks. This is still a sidebar preview, not qualification of system bars, physical cutouts, keyboard handling, drawers or the full mobile workflow.

Before editing, check these failure cases: About remains independently visible in the footer; discarded font CSS/toggles remain active; comparison controls can restore rejected B; approved colors are assigned to the wrong illustrative categories; hover overrides selected fill; the footer moves while scrolling; safe-area padding clips the footer/dialog; imported CSS overrides the intended focus ring. Verify the revised Settings section, scroll geometry and computed palette values in the browser after editing.

## Original feedback captured

| Comment | Request                                               | Evidence and proposed direction                                                                                                                                                                                                                                                                                                                  |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | Replace text symbols with icons; we already use Reka. | `WorkspaceLayout.vue` uses `sectionSymbols` and header glyphs. Reka UI supplies headless interaction primitives, not a general-purpose icon set. Preview consistent inline SVG icons; select a maintained Vue icon set for production after approval.                                                                                            |
| 2       | Are board dots all one color?                         | Yes: `styles.css` assigns `var(--support)` to every dot. Keep that baseline and offer an illustrative group-color comparison. Colors must not imply unread/status information. Actual board grouping and fallback behavior need agreement before implementation.                                                                                 |
| 3       | Is a Chinese font missing?                            | The configured stack already includes Noto Sans CJK TC, PingFang TC and Microsoft JhengHei, after system-ui. The supplied screenshot renders Chinese glyphs. Their actual resolved font is not established. Compare the current stack with explicit Simplified/Traditional Chinese stacks on tagged text; do not claim a missing-font diagnosis. |
| 4       | Highlight all buttons on hover.                       | Global buttons currently underline on hover; board cards already change border color and underline the title. Preview a clearer surface tint plus border on actionable cards/rows/buttons, retain keyboard focus, and keep disabled controls distinct. A later implementation needs a complete control audit.                                    |
| 5       | Keep sign-in information visible without scrolling.   | `.navigation-account` is inside the scrolling `.boards-region`. Preview a non-scrolling footer with the navigation body scrolling independently. Preserve accurate member/guest/unknown/restored wording in production.                                                                                                                          |
| 6       | Move Settings and About beside sign-in information.   | Both triggers currently live in the header. Compare compact icon actions beside the account with a labelled action row below it. Production must preserve existing Reka dialogs, portals, focus return, collapsed-pane access and mobile drawers.                                                                                                |

## Original preview question and plan

Can one fixed account footer make identity and workspace tools reachable while the board list scrolls, and are compact icons or visible labels preferable?

Use one small sidebar MVP with two footer arrangements, plus optional font and dot comparisons. This intentionally follows the user's minimal-unit request rather than generating three unrelated redesigns. Render synthetic content with the real workspace stylesheet and surrounding header, board cards and reader placeholder. Keep the prototype unimported by the production entry point. The requested feature branch takes precedence over the prototype skill's throwaway-branch default. No irreversible architecture choice is required; advisor validation follows the completed preview.

Before writing the preview, consider these failure modes:

1. The account footer scrolls away or covers the last board; reserve its space outside the scrolling body.
2. A long account name or larger Chinese text collides with controls; allow wrapping and compare a labelled two-row footer.
3. Icon-only actions lose names, focus or touch targets; provide accessible labels and 44px targets.
4. Colors look like unread/activity state; identify the color comparison as illustrative grouping only.
5. Font changes are misrepresented as installed/downloaded fonts; use local fallbacks and show both scripts without claiming identical cross-platform rendering.
6. A broad hover rule obscures the current destination or styles disabled buttons as active; keep selected and disabled states distinct.
7. A preview is mistaken for functional forum integration; label synthetic content and stub actions, with no forum requests or writes.
8. Moving controls makes them inaccessible in a collapsed production sidebar; defer integration until the drawer/header entry behavior is verified through E2E expectations written before implementation.

## Run the revised preview

Run `npm run dev -- --port 5173`, then open:

`http://127.0.0.1:5173/src/layouts/sidebar-feedback.prototype.html?variant=A`

The selected A layout places a Settings icon beside the account, with About as a section inside Settings. Group colors are enabled using the design palette, and the font experiment and A/B switcher have been removed. Scroll the sidebar and try Settings, hover, keyboard focus, and the larger-text control. The dialog remains an illustrative native-dialog stub, not the existing Reka integration.

## Actual trade-offs

1. A synthetic, isolated preview with the real stylesheet gives a concrete approval artifact without changing live forum behavior; it cannot qualify production navigation, Reka focus/portal behavior or installed browsers.
2. Reserving a fixed footer keeps identity and tools visible but reduces the board list's visible height. The entire navigation body scrolls, keeping primary destinations reachable even at short heights.
3. Compact icon actions preserve vertical space but rely on accessible names/tooltips for discoverability. The labelled alternative is clearer and handles long names more comfortably at the cost of a taller footer.
4. Inline SVGs make this throwaway comparison dependency-free and consistent in size; production icon-library selection and its bundle/license cost remain pending.
5. Original preview only, now discarded: local script-specific font fallbacks avoided font downloads but varied by OS and installed fonts. The revised preview uses the unchanged application stack.
6. Selected group colors add visual differentiation but require meaningful, stable group mapping; the revised preview uses illustrative groups with the approved category palette. Color never carries the only identifying information. The one-color comparison was removed after selection.
7. Surface-tint hover feedback is more visible but adds visual emphasis to controls; selected states remain stronger and keyboard focus uses an independent outline.

## Original preview verification — commit 51a8585

Preview-delivery acceptance:

- [x] Capture all six comments with evidence and separate confirmed facts from proposals.
- [x] Provide a runnable, isolated approval preview on the requested branch using synthetic content.
- [x] Show both footer arrangements and dot/font comparisons; inspect fixed-footer scrolling, enlarged text, hover and the illustrative Settings dialog.
- [x] Preserve repeatable inspection instructions, screenshots, receipt and source hashes.
- [x] Complete final advisor validation and record all actual trade-offs.

At the reported 1014×874 viewport, the compact footer remained at y=722 with height=69 before and after navigation scrollTop=579. The Settings stub opened; Escape closed it and returned focus to Settings. The labelled footer was inspected at 125% text with both Chinese scripts and sample group colors. A hovered card had background `rgb(237, 242, 247)` and border `rgb(102, 102, 102)`. Browser console inspection returned no errors. Prettier, extracted module syntax and Git whitespace checks passed. No automated tests were added for this throwaway preview.

At 390×844, DOM geometry showed the labelled footer within the viewport and no document horizontal overflow. The narrow screenshot was malformed/scaled and does **not** establish visual mobile acceptance. Preserve it as a capture limitation. A checkbox automation action after resetting the viewport also failed; fresh navigation restored baseline and the subsequent font toggle worked. These observations remain separate from successful checks.

Local evidence: `evidence/runs/sidebar-preview-2026-11-05/` contains `report.md`, `receipt.json`, `manifest.json` and screenshots. This directory is Git-ignored. The preview ran with the available Node 26.0.0 / npm 11.12.1 / Vite 8.3.4 runtime; it is not a qualification run using the pinned production toolchain. Replay the source and instructions above to generate fresh observations.

The requested gpt-6.1-sol advisor at xhigh reasoning applied `validate-gpt-code-review` after the preview was complete. It confirmed the source hypotheses and found no significant preview-scope defect or egregious decision, with no distinct additional trade-offs. It identified the narrow capture limitation, now recorded above, and did not independently rerun the browser observations.

Design approval remains pending. The prototype is not imported by `src/main.ts` or the Vite production entry. Production implementation, E2E expectations written before implementation, existing Reka dialog integration, collapsed/mobile access and installed-browser qualification remain future work. Approval of a preview is not installed-browser acceptance or permission to publish GitHub tickets immediately.

## Revision trade-offs and verification

Additional actual trade-offs in this revision:

8. Putting About inside Settings simplifies the footer, with one additional action to reach that information. A section within the same dialog avoids a second modal/focus layer.
9. The documented 216px/300px desktop tracks restore the reference proportions and give more room to the reader, at the cost of more wrapping in the sidebar than the initial 264px track.
10. Basic safe-area padding keeps essential preview controls inside browser-reported insets but reduces usable content space when those insets are nonzero. It cannot establish physical keyboard/cutout behavior; the complete viewport and drawer integration remains outside this visual preview.

Revision acceptance:

- [x] Enable approved category colors and remove the font experiment.
- [x] Apply the final A selection with one named Settings icon beside the account and About inside Settings.
- [x] Correct hover/focus colors using DESIGN.md and accurately distinguish partial edge-to-edge support from the complete contract.
- [x] Inspect the revised footer, Settings/About, hover and enlarged text; preserve repeatable artifacts.
- [x] Pass formatting/module-syntax/whitespace checks and final advisor validation.

Final A browser observations at 1052×874: the footer stayed at y=742, height=69 after navigation scrollTop=1022.5. Settings contained a visible About section; Escape returned focus to Settings. Computed group colors matched all four approved Light roles; hover was `rgb(238, 238, 238)` and the font stack was unchanged. At 125% text the footer bottom was 811, within viewport height 874, with no document horizontal overflow. No console errors were observed. No automated tests were added for this visual preview.

Final artifacts are in `evidence/runs/sidebar-preview-2026-11-05-revision-a/`: screenshots, `observations.json`, replay report, receipt with source/reference hashes, and manifest. Intermediate B evidence stays separate in the `revision-b` directory. These are Git-ignored local artifacts. The actual reference document was read but not modified.

The same gpt-6.1-sol xhigh advisor validated the final A source and artifacts using `validate-gpt-code-review`, found no significant preview-scope defect, confirmed the partial edge-to-edge wording, and identified no additional trade-offs. It did not independently repeat browser checks. Production integration and physical-device edge-to-edge acceptance remain future work.

## Header feedback — compact pane controls

The owner reported Threads wrapping at 779px, Boards/Threads separating at 714px, and Threads disappearing at 504px; icon-only controls are accepted for narrow views. The prior A/footer, group colors, unchanged fonts and About-inside-Settings selections remain active.

Before editing, browser geometry reproduced the 779px separate rows and 504px `display:none`. At 714px the Boards button stretched to 415.875px, separating its left-aligned content from Threads even though the button boxes were adjacent. The inherited header is a three-column grid while the prototype has four direct children; hiding the caption then shifts button placement. The prototype explicitly hides Threads below 540px.

Plan: explicitly own the prototype header layout with flex; group pane buttons in one non-wrapping trailing container; use icon-only 44px controls below 960px, retaining accessible names and tooltips; keep labels at 960px and wider. Remove the rule hiding Threads. This is a contained visual-prototype correction, so use a repeatable browser geometry check instead of adding a production E2E/unit-test suite. The browser probe is written and exercised before the fix.

Failure cases to verify: both controls remain visible; they share a row and stay adjacent; neither target shrinks below 44px; icon-only controls retain names; keyboard navigation reaches both; labels return at the breakpoint; 125% text and a 375px viewport do not hide or push controls outside the header. Preserve baseline and corrected geometry with screenshots and replay instructions.

Additional actual trade-off: below 960px, removing pane-button text and the decorative caption preserves a compact, stable header but makes icon recognition more important. Accessible names, native tooltips and 44px targets retain keyboard/assistive access; full text returns on wider screens.

Browser verification passed at 375, 504, 714, 779, 959, 960 and 1280px, at both 100% and 125% text. Both buttons share a row, have an 8px gap, remain inside the viewport, and retain at least 44×44px targets. Below 960px both are exactly 44px wide with labels visually hidden; at 960px and wider labels return. At 375px, Tab moved from Boards to Threads and Enter activated the Threads preview action. No console errors were observed. Formatting, module syntax and whitespace checks pass.

Evidence is in `evidence/runs/sidebar-header-2026-11-05/`, including baseline/final measurements, the reusable read-only `geometry-probe.js`, screenshots, source hashes and replay instructions. The initial box-adjacency probe returned true at 714px because the stretched button boxes touched correctly; its measured 415.875px Boards width demonstrates the visual separation. The final probe also requires exact compact button widths, preventing that false-positive interpretation. These are browser checks of the isolated preview, not installed-browser or functional-drawer qualification.

Header revision acceptance:

- [x] Keep both pane controls visible, adjacent and on the same row at all three reported widths.
- [x] Use accessible icon-only 44px controls below 960px and retain visible labels at wider widths.
- [x] Verify keyboard access, 125% text and both sides of the breakpoint; preserve repeatable artifacts.
- [x] Pass static checks and final advisor validation; record the new trade-off.

The gpt-6.1-sol xhigh advisor applied `validate-gpt-code-review` to the completed correction and retained evidence. It found no significant preview defect or distinct additional trade-off, and confirmed the inherited-grid/explicit-hide diagnosis. It did not independently rerun browser checks.

## Browse-first narrow view, collapsible groups and contextual tools

New feedback: the live workspace at 717px can leave an empty conversation surface when no thread is selected; show useful browsing content instead. Allow board groups to collapse. Reconsider sidebar Back/Refresh and move Continue in native forum into the header.

Source context: the production layout docks Threads only at 768px and wider and always renders a conversation region, with a placeholder when no public/private reader is selected. Directory/board arrival can reveal a drawer, but closing it can leave an empty conversation surface: the placeholder markup exists, while CSS hides `.reader-placeholder` below 960px. The proposed no-selection fallback changes that presentation policy and will require production layout acceptance later. It must not auto-select/read a thread or override an already-open public/private conversation or writing context.

Back is not simply disposable: `workspace.back()` uses the writing view-change guard before host history navigation. Refresh is context-specific: public thread history, messages and notices have their own loaders, and searches have deliberate rerun controls. Keep these functions, but preview them alongside the content rather than as a permanent sidebar block. Move the native escape to a persistent header control; preserve its exact destination and recovery/guard behavior when integrated. No global browser reload is introduced.

Preview plan: below 768px start with a full-width board directory, then a full-width thread list after selecting a board, then a reader after selecting a sample thread. Boards/Threads header controls switch the visible preview surface; retain the selected sample reader when browsing again. Use independently collapsible native disclosure groups with names/counts and approved colors. Preserve disclosure state during in-page browsing only. Header native continuation remains an explicitly stubbed action in this synthetic preview.

Before implementation, verify these failure scenarios: initial narrow screen is empty; choosing a board does not expose threads; opening/returning from a thread loses the list or selection; changing board silently destroys the retained reader; collapsing one group closes others or loses destinations; keyboard cannot toggle groups; native continuation disappears at narrow widths; adding its third icon reintroduces header wrapping; Refresh/Back disappear from their meaningful context; group state is falsely promised across reload. No new unit tests: use repeatable browser journeys for this isolated MVP.

Additional actual trade-offs:

- A full-width browse/list surface gives an immediate next action on small screens, while switching between browsing and reading takes an explicit action. The reader stays retained, and the prototype's single-screen switch is not the production modal-drawer implementation.
- Collapsible groups shorten a long directory, at the cost of hiding board links until expanded. All groups start expanded, with counts and keyboard-operable disclosure controls; state lasts only for the mounted preview.
- Moving Back/Refresh into the content makes their target clearer but reduces their global visibility. The list uses All boards and the reader uses Back to threads; production guarded history and refresh semantics must be retained.
- Header native continuation is always reachable but adds a third control to the compact header. Its icon uses the same 44px target and tooltip/accessibility name as the pane controls.

Browse/navigation preview acceptance:

- [x] At narrow widths, show the full-width directory/list before selection and open the reader only after selecting a sample thread.
- [x] Return to the list with its selected row retained; expose Return to reading and retain the previous reader when browsing another board.
- [x] Collapse groups independently with keyboard-operable disclosures and preserve all 19 sample board destinations.
- [x] Remove the sidebar history block, preview contextual return/refresh controls, and keep native continuation in the header.
- [x] Keep all three header controls visible together at narrow widths and 125% text, with accessible names and 44px targets.
- [x] Preserve repeatable browser evidence and pass formatting, module-syntax and whitespace checks.

At 375×874 and 717×874, the initial results surface fills the viewport width and the empty reader is hidden. The board → sample thread → return journey preserves selection; changing to the Anime board leaves the Community reader available through Return to reading. Keyboard Enter collapsed only Community; that disclosure state remained unchanged through browsing. Community/Anime/Creative/Music retain 8/2/7/2 destinations, matching their displayed counts. All groups start expanded after reload; persistence across reload is not implemented.

Header geometry passes at 375, 504, 717, 767, 768, 959, 960 and 1024px, at both 100% and 125% text. All three controls share a row, remain in the viewport and have at least 44×44px targets; below 960px each is exactly 44px wide with its visible label hidden. Native continuation and list refresh report that no forum action occurred. No browser console errors were observed. Prettier, extracted inline-module syntax and Git whitespace checks pass. No unit tests were added.

Evidence: `evidence/runs/browse-first-2026-11-05/` contains observations, a reusable read-only header probe, replay instructions, source hashes, receipt, manifest and screenshots. The final `narrow-threads.jpg` (717×874) and `grouped-sidebar.jpg` (1024×874) were visually inspected. An initial narrow capture was scaled incorrectly; the final replacement is the approval image, and other early narrow captures are not used to establish visual acceptance. Viewport overrides and text enlargement were reset after verification. This remains a synthetic MVP using the available development runtime, not installed-browser, production drawer, writing-context or full edge-to-edge qualification.

The gpt-6.1-sol xhigh advisor applied `validate-gpt-code-review` to the completed iteration, relevant production paths and retained artifacts. It found no significant preview-scope defect or egregious technical choice, and no distinct additional trade-off. It clarified that the production narrow placeholder is hidden by CSS, leaving an empty surface; the source-context wording above reflects that distinction. It did not independently rerun browser checks. All scoped preview acceptance criteria are verified; user design approval and production implementation remain pending.

## Narrow Threads toggle and redundant return action

The owner questioned Return to reading and reported that Threads could not be turned off at 589px. That return button existed solely to expose a retained reader after browsing. A browser reproduction with a retained thread confirmed that clicking active Threads left `data-mobile-view="results"`, `aria-pressed="true"` and the reader hidden. The handler toggled only Boards; Threads always selected results. Reader loss and CSS visibility were alternative explanations, excluded by the retained title and unchanged selected view.

Plan before editing: on narrow screens, clicking active Threads returns to a retained reader; clicking it again reopens the unchanged directory/list. Remove the now-redundant Return to reading control. With no retained reader, keep useful results visible instead of showing an empty surface. Keep the wider preview's docked-pane presentation unchanged. No irreversible decision requires early advisor consultation.

Failure cases to replay: active Threads cannot close with a retained reader; reopening loses the selected row, browsing board or collapsed groups; removing Return to reading strands a reader after switching boards or returning to the directory; toggling without a retained reader yields blank content; keyboard activation differs from clicks; behavior changes unexpectedly at the 767/768 boundary. Use the already-failing browser journey and save before/after observations, not post-implementation unit tests.

Actual trade-off: removing the explicit return button reduces duplicate controls but makes resuming reading depend on recognizing the Threads toggle. Its accessible name, pressed state and tooltip remain available. With no selected thread, the list remains the useful fallback and cannot toggle into an empty reader. This supersedes the previous iteration's explicit Return to reading choice.

Toggle revision acceptance:

- [x] Active Threads closes to the retained reader below 768px; another activation restores the current directory/list.
- [x] Remove Return to reading without stranding the reader after directory or board changes.
- [x] Preserve selected row on list return and collapsed groups through toggling; keyboard Enter works.
- [x] With no selected thread keep results visible; preserve docked presentation from 768px.
- [x] Save repeatable before/after browser evidence and pass formatting, module-syntax and whitespace checks.

The original 589px reproduction changed from failing to passing: active results/pressed true/reader hidden becomes reader/pressed false/reader visible. The duplicate return control count is now zero. Click and keyboard journeys preserve the first selected row; returning from the directory or another board still shows the retained 事务所 reader. The collapsed Community group stays collapsed. Toggle checks pass at 375, 589 and 767px; at 768px repeated Threads activation retains the docked results and visible reader. The fresh no-selection state remains useful results. No browser console errors were observed. Screenshots at 589×874 were inspected; viewport overrides were reset. Evidence and replay instructions are retained in `evidence/runs/threads-toggle-2026-11-05/`. No unit tests or production changes were added.

The gpt-6.1-sol xhigh advisor validated the finished correction with `validate-gpt-code-review`, found no significant defect or distinct additional trade-off, and confirmed the one-way-handler diagnosis. It reviewed retained artifacts without independently rerunning browser checks. In observations.json, `before` and `after` both record the failed baseline click; `reopened`, `closed`, keyboard and width records describe the fixed behavior. All scoped preview criteria above are verified.

## Reader controls and compact writing — 2026-11-06

New feedback: remove the duplicate reader Back to boards action; question the crowded reader toolbar and compact writing; use a page slider like tsdm_client; put infrequently used options such as reverse order in a menu.

Research before editing: WorkspaceLayout.vue teleports workspace Back/Refresh/native/save actions into the reader tool row, then adds the parent board and Reply. These have distinct functions but do not all need permanent equal prominence. The prototype's reader-back is only a list-return action and can be removed because the header Threads control now returns to that list. Production Back is guarded host history, not the same action, so retain it as a More option in the proposal. Native continuation already belongs in the header; the board name can be a breadcrumb; keep Reply visible, with Refresh/Save/reverse order/history in More.

SourceWriting.vue renders the presentation caption, another heading, full WritingDestination, local-writing explanation and recovery summary before its editor. The compact CSS constrains that same form to 280px; it does not select a smaller content set. This explains the repeated labels and why the input is pushed out of the visible compact region. Preview an ordinary reply with a concise destination/account line, visible text input, expand/minimize icons and Review reply. Put routine explanations in Details; hiding the composer retains its text and original target. Preserve production account/permission/recovery failures and uncertain-write information prominently; they must not be blindly hidden with routine help. The prototype does not exercise those exceptional production paths.

Reference: tsdm_client/lib/features/jump_page/widgets/jump_page_dialog.dart uses a slider synchronized with a numeric field, with Cancel/OK; list_app_bar.dart supplies min=1 and performs the jump only after confirmation. Preview the same interaction with Previous, Page N / 92 and Next. Opening the page button reveals slider plus exact entry; Go applies once, Cancel/Escape does not navigate. Page count and posts are synthetic. Real integration must derive available pages/targets from forum data, preserve filters and guarded writing, and handle unknown totals without inventing URLs.

Plan/failure cases before implementation: remove only duplicate reader-return UI and obsolete code; verify header navigation still returns to the retained list. Keep the More disclosure keyboard-operable and show active reverse order outside it. Check slider/number synchronization, invalid values, cancellation, endpoints, and no change while dragging. Check that the compact input is visible at 375/734/911px, and text/target survive minimize, expand and thread switching. Review is a preview with no submission. Keep prior sidebar decisions intact. This reversible MVP requires final advisor validation, not early one-way-door consultation.

Actual trade-offs for this iteration:

- Removing reader-return and placing secondary tools in More gives reading more room, but history/refresh/save/filter actions take an additional action to discover. The parent board stays a breadcrumb and the active reverse-order state stays visible. Native escape remains in the header.
- A confirmed slider plus exact page entry replaces many page links, reducing clutter but adding a dialog and confirmation for distant jumps. Previous/Next remain direct; slider movement alone cannot navigate.
- A compact reply prioritizes input and concise destination/account context over repeated headings and routine explanations. Details/expanded writing provide supporting information; exceptional failures still require prominent production treatment. Minimize preserves text in memory, at the cost of needing Resume reply; this preview provides no durable save or real publication.

Reader revision acceptance:

- [x] Remove the duplicate reader return button; header Threads still returns to the selected list and retained reader.
- [x] Keep the board breadcrumb and Reply prominent; put history/refresh/save/reverse order in More, and retain header native continuation.
- [x] Make More keyboard-operable and show the active order outside the disclosure.
- [x] Preview a synchronized slider and exact number entry, with explicit Go, cancellation, invalid-range protection and Previous/Next boundaries.
- [x] Show the compact reply input and Review without scrolling the composer at 375, 734 and 911px; retain text and original destination through minimize/expand and thread switching.
- [x] Provide a clearly synthetic review with no submission, and preserve replay artifacts with passing static checks.

Browser observations: slider keyboard increment synchronized number2 while current page stayed1; Cancel preserved1. Invalid93 could not submit; valid46 synchronized slider then applied on Go. End selected92 with Next disabled; Previous reached91 and Next returned92. Home followed by Escape left92 unchanged. More opened with Enter, reverse order closed it and exposed Newest first, and Escape closed it. Refresh reported the explicit no-forum-action stub status. Reverse order only reverses the three illustrative posts on the synthetic page; it is not an implementation of forum reverse pagination.

The compact input measured92px high and fully within its composer, with Review also visible and no document horizontal overflow, at375/734/911×874 and with the preview's125% text control enabled at375px. This is the existing selective text-scale control, not OS/browser zoom or complete text-scaling qualification. The sample text survived expand/compact/minimize/resume. Selecting a different thread preserved both text and the original target and showed an explicit mismatch notice; Review displayed that same original target and text with only Back to writing, no send action. Header navigation returned to selected row2 and back to the retained reader after reader-back was removed. No console errors were observed. Prettier, module syntax and whitespace checks passed; no unit tests were added.

Evidence is in `evidence/runs/reader-simplification-2026-11-06/`: observations, page/reply DOM probes, three inspected screenshots, replay report, source hashes, receipt and manifest. The local server had stopped between sessions; it was restarted and a fresh preview tab used after the old browser tab failed to attach. Live forum tabs were not changed. Viewport override was reset. Native dialogs and disclosures are standalone prototype choices; production Reka integration, real pagination targets/filters and exceptional writing/recovery states remain future work. No tickets have been published.

The gpt-6.1-sol xhigh advisor applied `validate-gpt-code-review` to the completed source, production/reference paths and evidence. It found no significant preview-scope defect or additional distinct trade-off. Its minor More-menu observations were corrected: 6px scrollport clearance preserves the outer focus ring and the shadow now uses DESIGN.md’s exact `0 4px 16px rgba(0,0,0,0.06)` floating recipe. The final menu screenshot and compact-layout measurements were refreshed. One screenshot captured immediately after repeated viewport changes was cropped incorrectly; it was replaced after the viewport settled, and the final full-width image was inspected. The advisor did not independently rerun browser checks. All scoped preview criteria are verified; full component/theme/accessibility conformance and production integration remain unqualified.

## Expanded formatting, bottom resume and wide aside — 2026-11-06

The owner requested rich-text tools only in expanded writing, a distinct Compact icon, Copy URL in More, minimized writing as a bottom drawer bar instead of a header Resume action, and expanded writing beside reading on wide screens.

Research/plan before editing: PostEditor.vue already uses ProseMirror plus createEditorSession, editorNode/editorMark and commands for formatting/lists, with one source/document/history owner. Reuse those existing editor primitives in the isolated HTML preview instead of implementing contenteditable formatting or stripping markup when compacting. Use the same mounted editor in every presentation; only toolbar visibility and CSS geometry change. Preview Bold/Italic/Underline, lists, quote/code and Undo/Redo; full production source/media/table tools remain outside this MVP. Change outward corners to inward corners when expanded. Retain original reply target/text when minimized or when viewing another thread; only the bottom bar resumes it.

Wide aside proposal: at viewport1440px and above, an expanded composer becomes a 360–420px right-hand pane within the reading region; below1440 it remains below reading. With the existing216px/300px tracks,1440 leaves roughly400px for reading plus420px for writing. This is a proposed change to DESIGN.md’s bottom-docked composer policy, not existing production compliance. Keep the same DOM/editor/selection across the boundary. When minimized, release the side column and show the footer resume bar.

Copy URL: the synthetic samples have no real forum thread identities. Copy a reloadable local preview deep link containing only sample board/thread/page/order; never invent a real forum URL or copy the private workspace hash. Label success as a preview URL and expose selectable text if clipboard access fails. Production should copy the canonical public thread URL with its relevant page/filter context. Writing text is excluded from URLs and remains memory-only.

Failure cases before code: formatting is decorative or lost on compact/expand; selection is lost when clicking tools; the icon/name disagree; header Resume remains; bottom resume scrolls away with posts or loses the target; wide layout squeezes reading or keeps an empty aside when minimized; resize recreates the editor; Copy URL reports success without a write or produces a dead link; copied URL includes writing text; copied page/order is not restored. Verify these through browser journeys and retain source hashes/screenshots/replay instructions. No post-implementation unit tests.

Actual trade-offs:

- Reusing the existing rich-editor session gives real formatting and preserves one editor across presentations, while coupling the throwaway preview to those modules. The toolbar is a bounded subset; full source/media/table and production IME behavior are not qualified here.
- A persistent bottom resume bar keeps minimized writing near its original location but reserves reading height. It retains expansion and destination; the header no longer carries Resume.
- The wide aside allows simultaneous reading/writing but narrows the reader. A1440px threshold protects smaller layouts and keeps the360–420px editor usable; this breakpoint is a proposal for approval.
- A local preview deep link makes Copy URL demonstrable and reloadable, but it cannot stand in for a real forum permalink. It contains browsing context only, with no reply persistence or text sharing.

Expanded reply preview acceptance:

- [x] Expanded writing exposes working Bold/Italic/Underline, lists, quote/code and Undo/Redo; compact writing hides the toolbar and preserves formatting.
- [x] Expand/Compact changes the SVG icon, accessible name and expanded state together.
- [x] Minimize replaces the header action with a bottom Resume bar, retains the original target/formatted text/expansion, and releases the wide editor column.
- [x] At1440px and above expanded writing sits beside reading; below1440px it stays below reading, with usable controls at375px.
- [x] Copy URL writes a reloadable local preview link preserving board/thread/page/order and excluding reply text.
- [x] Rich review preserves formatting and the original destination without submission; browser evidence and static checks are retained.

Browser verification: Bold, Italic, Underline, bullet/numbered lists, quote and code each changed the actual editor DOM; Undo reversed them and Redo restored Bold. The formatted Chinese sample survived compact/expand, minimize/resume, widths1439/1440/911/375/1706 and switching to another thread. Resuming on that other thread retained the original target and displayed the mismatch notice. Review retained the bold span and original target and offered no send action. The toolbar wraps at375px; the expanded composer can scroll vertically to its footer. No horizontal document overflow was observed. At1440px the editor is420px wide and the reading scrollport444px; at1706px the reader scrollport is710px. Minimizing restores the full reading width and a56px bottom bar; its position stays fixed while posts scroll.

Copy URL was read back from the clipboard and reopened in a temporary tab: board0/thread2/page6/reverse=true restored 事务所 / 本周交流与提问 / Page6 / Newest first, with sample posts18/17/16 and an empty reply. Clipboard-denied fallback exists but was not exercised. Reply text remains memory-only; full editor IME, paste, source/media/table workflows and production canonical URLs are unqualified.

Evidence: `evidence/runs/expanded-reply-2026-11-06/` contains observations, read-only probes, replay instructions and inspected wide/narrow/footer screenshots. Viewport overrides were reset and the temporary link-verification tab closed. Prettier, extracted module syntax and Git whitespace checks pass. No unit tests or production edits were added; no tickets were published.

Advisor correction: the original toolbar read marks only at the selection start, so selecting all bold text could show Bold inactive. It also omitted the editor command's remove flag, so repeated Bold/Italic/Underline did not toggle off. A shared selection-aware predicate now drives both pressed state and removal. Browser reproduction confirmed the original failure; after correction a mixed bold/plain range becomes fully bold on click, then fully plain on the next click. Italic/Underline apply/remove states and caret typing with Bold on/off also pass. The wide screenshot was refreshed after correction. Console warning/error logs are empty.

Additional actual trade-off: mixed-format selections display the toggle as inactive and the first click applies formatting to the whole selection. This keeps a two-state toolbar with predictable apply-all behavior instead of exposing an indeterminate third state.

The gpt-6.1-sol xhigh advisor used validate-gpt-code-review, confirmed the toolbar correction against code and retained browser evidence, and found no remaining significant preview-scope issue. Its distinct mixed-selection trade-off is recorded above. It did not independently rerun browser checks. All scoped preview acceptance criteria are verified; design approval, ticket publication and production integration remain pending.

## Persistent reader tools and direct column sizing — 2026-11-06

New feedback: group Page with More, remove Previous/Next for continuous reading, keep the group at the head while scrolling, and adjust every column directly rather than only through Settings. The latest clarification supersedes the earlier Settings-only adjust-mode suggestion.

Research before implementation: the preview currently puts More beside the title and pagination inside reader-scroll, so both disappear with posts. DESIGN.md describes chronological single-column waterfall loading, explicitly not staggered masonry cards, with a page/post jump facility. Interpret the owner's Masonry reference here as continuous reading; remove the redundant stepping controls while retaining the confirmed jump dialog. This MVP still renders three synthetic posts per selected page and does not prove automatic loading. DESIGN.md fixes the navigation/list at216/300px and records omitting drag handles as an intentional simplification. Direct sizing is a proposed revision to that policy; it does not change the ADR's ownership boundaries.

Plan: keep an opaque compact Page/More group in a non-scrolling reader bar, with Reply and active-order context nearby. Give the visible boundaries between Boards, Threads, Reading and expanded Writing direct44px drag grips and keyboard Left/Right/Home controls. Reading receives the remaining width and can be resized from either adjacent boundary; responsive hidden panes have no handle. Clamp widths to keep all visible panes usable, retain desired widths in memory across narrower layouts, and offer Reset column widths in Settings. Reuse the editor and preserve the first visible sample-post offset during resizing. No early advisor consultation is needed for these reversible preview choices.

Failure cases before code: More/page scroll away or menu clips beneath posts; grouped controls wrap apart on narrow screens; stale Previous/Next handlers break rendering; dragging selects text or loses pointer capture; keyboard sizing disagrees with drag; widths create horizontal overflow or squeeze the reader/editor below bounds; hidden panes leave grips; viewport resizing loses preferences or writing; a resize jumps the visible post; Reset does not restore defaults. Replay browser journeys and retain screenshots/measurements rather than adding post-implementation unit tests.

Actual trade-offs for this iteration:

- A persistent Page/More bar keeps controls reachable but consumes reading height. The title/breadcrumb still scroll; expanded bottom writing now leaves space for the bar plus a96px history viewport at the checked375×874 size, with the composer itself scrolling to reach its footer.
- Removing Previous/Next reduces clutter for the intended continuous reader, but the synthetic MVP now requires the page-jump dialog for another sample page. It does not implement waterfall loading, retries or automatic current-page tracking.
- Always-visible44px grips make direct sizing discoverable and keyboard operable but add visual furniture. Width limits protect the reader/editor; Reading uses remaining space, so resizing its neighbors changes its width and may clamp another pane.
- Desired widths survive responsive constraints in memory, allowing wider layouts to restore them, but reload resets them. Settings offers a global reset rather than another sizing mode.
- The isolated prototype uses a small pointer/keyboard sizing controller and CSS tracks, keeping the experiment local. Production integration still needs its existing layout/preferences lifecycle and full reading-anchor/selection qualification; the synthetic anchor check is deliberately bounded.

Reader controls and sizing acceptance:

- [x] Group Page and More together in a persistent reader bar and remove Previous/Next controls and their handlers.
- [x] Keep the page-jump confirmation/cancellation and keyboard More menu usable, including narrow layouts.
- [x] Directly resize visible Boards/Threads/Reading/Writing boundaries using pointer grips or Left/Right keys; Home resets an individual width.
- [x] Clamp visible widths without horizontal document overflow, hide unavailable grips and restore desired widths after responsive transitions.
- [x] Reset widths from Settings and retain reply text through sizing and minimize/resume.
- [x] Preserve a visible sample post's offset during a checked resize; keep reader tools stationary during scrolling.
- [x] Retain repeatable browser artifacts and pass formatting, module syntax and whitespace checks.

Browser observations: at1706px, pointer drags changed Boards216→276, Threads300→360 and Writing420→500; keyboard increased Threads to376 while the same visible sample post stayed at offset41.09375px. Extreme widths clamped; at1440px Reading stayed320px and Writing280px, with no document overflow. Responsive checks at375/767/768/959/960/1439/1440/1706px hid the appropriate grips and restored desired360/520/434px widths on returning wide. The typed Chinese reply stayed intact. At768px Boards view exposed only the Boards boundary and keyboard resizing worked. Minimize hid the Writing grip; resume restored it and the text. Home reset Threads to300; Settings reset Boards/Threads to216/300 (Writing preference420).

Page jump applied92 and cancelling a pending6 left92. Previous/Next element count is zero. More opens with Enter and closes with Escape. An initial right-anchored menu clipped after grouping; anchoring its left edge to the group corrected it, verified at375 and1706px. At1095×874, scrolling history to124px left the bar unchanged at y121.5px. The first375px expanded-editor measurement after reserving the fixed bar leaves96px nominal history; the editor footer can be reached by scrolling the composer. No console warnings/errors were captured.

Evidence is in `evidence/runs/direct-columns-2026-11-06/`: observations, read-only probe, replay instructions and inspected screenshots. The new preview uses a separate local tab; viewport overrides were reset. No unit tests, production edits or published tickets. Full device/zoom/safe-area, touch cancellation, production anchor/selection and continuous-loading workflows remain unqualified.

The final gpt-6.1-sol xhigh advisor used validate-gpt-code-review and identified one minor anchor issue: the first post below the visible history could be treated as visible, shifting the title when its line wrapping changed. At768px with expanded writing, resizing Threads220→408 reproduced scroll0→35 while no post was visible. The predicate now requires intersection with both viewport edges; the same journey stays0→0, and a genuinely visible post3 retains offset−92.9375px on resizing. The advisor found no remaining significant preview-scope defect or distinct additional trade-off. It reviewed retained evidence and independently checked syntax/whitespace, without independently rerunning browser journeys. All scoped acceptance criteria are verified; owner approval and production implementation remain pending.

## Quiet resize edges, compact title and continuous-reader MVP — 2026-11-06

New feedback removes the visible resize buttons, asks for separate Page and More controls grouped like Boards/Threads, places them beside the title, and explores a smaller title during scrolling. The owner also asks for a Masonry MVP to exercise Page; a concise clarification distinguishes single-column continuous reading from staggered multi-column cards. Existing DESIGN.md specifies single-column waterfall. Independent edge/header work can proceed while that clarification is pending.

Plan before implementation: replace the44px grip boxes with full-height draggable separator edges, keeping focusable separator semantics and existing keyboard controls. Use a narrow transparent hit strip centered in the gutters so it does not intercept neighboring actions. Put Page and More in a borderless adjacent group beside the persistent title. Collapse the title and breadcrumb after scrolling, with distinct enter/leave thresholds to avoid flicker; retain the full accessible title. Check the menu against the new right edge. These are reversible MVP changes; final advisor review remains appropriate.

Failure cases: border resizing disappears entirely or intercepts nearby controls; keyboard resizing stops after changing element type; hidden panes leave edges; title/header resizing causes page jumping or oscillation; long titles crowd out Page/More; the menu clips in narrow readers; expanded writing leaves no usable history. For continuous reading, verify the displayed page follows the first visible post, jump confirmation scrolls to its destination, cancel stays put, copied context follows reading, and start/end/reverse/resize behaviors remain coherent. Keep synthetic content and record implementation limits.

After allowing time for clarification, proceed with the existing single-column waterfall interpretation. For this bounded prototype, use92 available synthetic pages (three posts each) in one scrollable stream. Vary sample post heights so page tracking is exercised by actual visible content rather than assumed pixels. The Page label follows the first visible post; confirmed page selection scrolls to that page's first displayed post. Reverse reorders the same whole synthetic stream; copy/reload uses the visible page. Keep page-dialog edits separate from live page state. This answers navigation/geometry questions using local sample pages; network failure/retry and virtualization remain outside the preview.

The owner explicitly confirmed “Continuous scrolling in one column,” validating that interpretation.

The owner further specified “like the newest build.” Source research in WorkspaceLayout.vue approachHistory and workspace/thread-history.ts confirms adjacent loading within160px of either edge, guarded against restoration scroll events, with a retained loaded range and post-anchor restoration. Revise the local fixture to load a small window around a jump target and append/prepend adjacent sample pages on approaching its boundaries. Preserve the visible post on prepend; suppress extension during jump/resize restoration. Add failure cases for duplicated/out-of-order pages, repeated loads from restoration events, stale target after reverse/jump, and live page labels at both actual thread ends. No network request or retry simulation is needed to demonstrate this interaction.

Actual trade-offs for this iteration:

- Quiet full-height edge strips replace visible44px grip boxes. Their12px pointer targets (18px for coarse pointers), resize cursor and hover/focus line reduce visual clutter but are less discoverable and harder to hit; this deliberately departs from the earlier button-sized sizing affordance. Keyboard Left/Right/Home remains available. Touch usability is unqualified.
- Separate Page and More controls beside the title give context and controls one persistent location, but long titles wrap initially and truncate with an ellipsis when compact. The full title remains in the heading/accessibility text and native tooltip. The breadcrumb hides in compact mode. Thresholds32px/8px avoid oscillation; dynamic editor-height reservation protects reading space as the header changes size.
- The fixture mirrors the newest build's160px adjacent-page extension and restoration suppression using local synthetic content. It supports navigation testing without network variability, but does not qualify real requests, failures, permissions, retries, arrival polling or server page URLs. Page jumps reset the local loaded window around the target.
- Page indicates the first post at the reading edge, except at the actual end where it reports the final page even when an earlier page remains partially visible. This makes the last-page jump useful but is not percentage progress. Three posts per page is only fixture data, not a production pagination assumption.
- Loaded sample pages remain mounted while browsing, keeping prepend anchors simple and stable but growing the DOM. The fixture is bounded to92 pages/276 posts and resets on a jump; production retention/virtualization policy is not changed.

Continuous reader acceptance:

- [x] Replace button-shaped grips with full-height draggable edges, retaining keyboard sizing/reset and hiding edges for unavailable columns.
- [x] Present Page and More as separate controls in one borderless group beside the title; keep them reachable while scrolling.
- [x] Show a compact title during scrolling and restore the full title at the top, without horizontal overflow in checked responsive layouts.
- [x] Append/prepend adjacent local pages during continuous scrolling, retain ordered unique posts, and update Page from reading position.
- [x] Support confirmed exact page jumps, cancellation, reverse reading, actual endpoints and copy/reopen of the current page/order.
- [x] Preserve reply text through sizing and presentation changes; retain usable history and reachable Review at375px with enlarged text.
- [x] Preserve repeatable browser evidence and pass formatting, module syntax and whitespace checks.

Browser results: the initial ascending window contains6 posts (pages1–2); scrolling extends it to9 and changes Page1→2. Jump46 gives pages45–47 and post136 at the reading edge. Scrolling back prepends44, yielding12 unique ordered IDs130–141 while old first post133 stays at offset6.046875px. Cancelling pending12 leaves46. Exact jumps1/2/3/12/46/91/92 all show the requested page. At actual end92, further downward scrolling does not add posts; reverse starts92 and scrolling reaches91. A copied URL for board1/thread1/page91/reverse=true reopened at91 with the correct order.

At994px, the normal header is132.1875px high with26px title; scrolling makes it56px with16px title. Returning to the top restores the full title. Page and More retain separate44px-high targets and an8px gap, with no enclosing border. Boards edge dragging216→256 and keyboard Threads300→316 work; Settings remains reachable next to the edge. Wide Writing dragging420→472, Home, minimize/resume retain text. Widths375/767/768/959/960/1439/1440/1706 show no horizontal document overflow and hide unavailable edges. The More menu remains within the375px reader.

One verification correction: enlarging text to125% while the full title and expanded writer were visible initially reduced history to40px because the height reserve was stale. Recomputing sizing after the preview text-scale change restores102px history (including6px scroll padding), and Review is reachable through composer scrolling. This is the preview's selective text-scale control, not full browser/OS zoom qualification.

Evidence: `evidence/runs/continuous-title-2026-11-06/` contains observations, a read-only probe, replay instructions, source hashes and inspected expanded/compact/narrow screenshots. No console warning/error logs were captured. Viewport/text overrides were reset and the temporary copied-link tab closed. No unit tests, production edits or published tickets. User confirmation established single-column continuous reading; the newest-build source supplied the extension behavior.

Final advisor correction: with a312px reader, reverse order active and Reply unopened, the initial compact control row consumed the entire title width and extended14.24px into the gutter. A reader-width container query now moves order/Reply below Page/More at400px and below. The312px case retains148.62px of title width and every control stays inside the header; the More menu also fits. Checks at400/401px reader widths and375px viewport pass. The normal994px expanded/compact images were refreshed.

Additional actual trade-off: in narrow readers, the second action row preserves title space and control sizes but can increase compact-header height from56px to104px. This applies to reader width, so it also works after manual column resizing.

The gpt-6.1-sol xhigh advisor used validate-gpt-code-review, validated the source, newest-build reference and retained browser evidence, and confirmed this correction. It found no remaining significant preview-scope concern. It independently checked syntax/whitespace but did not rerun browser journeys. All scoped acceptance criteria are verified; owner design approval and production integration remain pending.

## Footer reply and fresh-content MVP — 2026-11-06

Feedback: move Reply to the footer; order reader tools Newest first, Page, More; explore an end-of-thread refresh or automatic updates for the open thread and board. Scope remains the approval MVP on feat/improve-ui-ux; no ticket publication or production integration.

Research before implementation: production thread-history.ts has an opt-in120-second check, qualified only at the ascending newest boundary, with visibility/busy guards, backoff and arrivals. The inspected tsdm_client v1 post_list.dart uses EasyRefresh with a refresh header and a load-more footer; the footer itself is not evidence of newest-post polling. No production board-polling capability is assumed.

Plan: footer Reply shares the existing writing lifecycle; put the order indicator before the Page/More pair, wrapping the whole controls row below the title in cramped readers. Propose manual checks plus optional two-minute automatic checks for visible open contexts. Stage detected content until an explicit reveal, preserving the post stream and board list during checks. The local simulation has two additional posts on page92 and one new board thread per context, with a preview-only arrival button and clock advance to exercise the same polling path. Settings holds the opt-in; state is memory-only. This reversible experiment does not require early advisor consultation.

Failure cases before code: header control overlap at minimum widths; Reply duplicated in header or inaccessible at footer; minimized writing lost or retargeted; checking unexpectedly jumps/reorders content; arrivals leak across boards/threads; repeated checks/reveal duplicate items; reverse order reveals the wrong end; jumping or copying loses existing page semantics; automatic checks happen while disabled, hidden or a dialog is open; returning from pause triggers a burst. Verify through browser journeys and retain repeatable observations/screenshots, without post-implementation unit tests.

Actual trade-offs for this iteration:

- Footer Reply and Resume share one writing lifecycle and stay reachable, consuming56px when closed/minimized. The header now orders Newest first → Page → More; readers400px or narrower put the complete row below the title, spending more height to preserve title width and action order.
- Manual newest-end checks coexist with a More refresh and board-header refresh. This duplicates access intentionally so refresh is available both at the newest boundary and while reading older posts. In reverse order, the newest boundary is above the posts rather than the bottom.
- Optional two-minute polling checks only visible open contexts, with no backlog after a pause. This saves requests and avoids background work but delays discovery for hidden panes; navigation starts a fresh interval. It extends beyond production's ascending/newest-only qualification and proposes board polling, so neither capability is claimed as integrated.
- Detected updates require an explicit Show action, even at the newest boundary. This preserves reading and list order at the cost of an extra action. Show posts jumps to the first newly shown post; Show thread inserts the sample at the top and focuses it. A reserved status strip consumes at least44px to avoid shifting the reading edge when a notice appears.
- Local fixtures model one batch of two new posts on existing page92 and one new thread per context. Keyed in-memory maps prevent cross-context leakage and duplicates but reload clears arrivals, shown posts, writing and the opt-in. A deep link to the sample new thread reconstructs its list entry; copied links do not serialize simulated arrival state.
- The prototype uses instantaneous checks and an accelerated-clock control feeding the same timer path. This makes the interaction repeatable without forum traffic but does not qualify network latency, cancellation, errors/backoff, permissions, real timer throttling or page-count growth. The 92-page fixture stays bounded.

Acceptance and verification:

- [x] Move Reply to the fixed reader footer and retain the existing minimize/resume writing lifecycle.
- [x] Order visible controls Newest first, Page, More; keep responsive title space and contained controls.
- [x] Provide a newest-boundary check and board refresh; detection does not insert content or change the visible post offset.
- [x] Explicit reveal adds the sample posts/thread once, supports reverse order and retains context isolation.
- [x] Keep automatic checks off by default; the opt-in and accelerated two-minute path check visible contexts only.
- [x] Retain repeatable browser observations/screenshots and pass formatting, module syntax and whitespace checks.

Browser observations: at994px, manual detection retained post273 at6.046875px offset and unchanged IDs; board IDs stayed1/2/3 until reveal. Reveal showed reverse post278 at6px and board IDs4/1/2/3. Repeated checks retained counts2/1 with no insertion. With automatic checks disabled, staging and advancing left both Not checked. Enabled at994px, advancing detected both contexts. At375px on a different board/thread, only the visible reader detected arrivals; the hidden board stayed Not checked until switched into view and advanced. The new context initially had no prior arrivals. Ascending order retained sorted unique IDs271–278 and the newest-end refresh was clickable. Footer reply text survived minimize/resume, expanded writing and1706px aside. At375px with125% text, expanded writing retained102px of history and Review opened with the original text. Layout measurements at375/768/960/994/1440/1706px showed no document overflow. Screenshots were inspected.

Evidence: `evidence/runs/fresh-content-2026-11-06/`. The accelerated path checks timer gating; real two-minute timing, native hidden-tab suspension and modal pause have source inspection only, not independent end-to-end timing qualification. No new unit tests, production changes or published tickets.

Verification corrections: the first arrival notice combined a status sentence and Show button, wrapping the board strip and shifting existing rows. Showing only the actionable notice keeps it44px; the first board thread stayed184.5px below the list top before/after detection. The advisor also identified a reverse-prepend ordering defect: revealing the newest-end marker after anchor restoration could shift the post. The marker visibility now updates before compensation. Jump90 in reverse, then scroll upward to prepend92: IDs276–265 are unique and post273 stays at6.046875px. These corrections retain the existing trade-offs rather than adding a new policy. Copy/reopen of board0/thread4/page1/ascending succeeded. Console warnings/errors were empty.

Final gpt-6.1-sol xhigh advisor review used validate-gpt-code-review and found no remaining significant concern or distinct trade-off beyond the six recorded above. It inspected source, screenshots, observations and replay instructions and independently passed syntax/whitespace checks; it did not rerun browser journeys. All scoped MVP acceptance criteria are verified. Owner design approval and production implementation remain pending.

## Icon actions and supplied brand MVP — 2026-11-06

Feedback: use icons for the newest-end check and Resume reply; replace the header brand with the supplied Downloads/tsdm_client.svg using our palette. Inspecting the supplied SVG found eight static path/polygon shapes and four blue fills; no scripts or linked assets. DESIGN.md and src/styles.css provide inverse purple, lavender, blue and pale green tokens.

Plan before implementation: reuse the existing refresh glyph and add a compose glyph for Resume; keep44px targets, accessible action names/tooltips and the visible retained reply destination. Replace the full header brand with a44px version of the supplied mark, preserving its geometry and mapping its four blue tones to inverse/secondary-accent/support/accent. Store a minimal prototype SVG beside the MVP and import it inline so palette variables inherit. Remove exporter metadata and the unused placeholder brand glyph. Keep the user's original download untouched. All choices are reversible; advisor review follows verification.

Failure cases: icon-only buttons lose accessible names, targets shrink, refresh/resume stops working, reply destination/text is lost, global20px SVG styling shrinks the logo, pale fills disappear at header size, SVG introduces external content, or the narrow header overflows. Verify browser interactions and screenshots; no post-implementation unit tests.

Owner clarification during implementation: keep the TSDM word beside the supplied mark. Retain the24px wordmark and use the recolored SVG in place of the old star symbol.

Actual trade-offs:

- Icon-only refresh and resume reduce label clutter but make the actions less explicit visually; accessible names, native tooltips, keyboard operation and the retained reply destination provide context. The existing initial Reply label stays unchanged because the feedback targeted Resume.
- The supplied geometry retains its four-tone segmentation in our inverse-purple/lavender/blue/pale-green palette. Pale green is subtler against white than the original saturated blue; the retained black TSDM word supplies clear brand identification.
- A44px mark preserves more of the supplied detail than the previous24px star, at the cost of additional header width. The wordmark and pane controls fit together at the checked375px width.
- A small inline SVG asset inherits existing palette variables and avoids a separate image request; it adds a prototype-specific asset. The downloaded original is unchanged, and unnecessary exporter metadata/DTD/IDs are omitted from the copy.

Acceptance:

- [x] Replace newest-end refresh text with the refresh icon while retaining its accessible name,44px target and working check.
- [x] Replace Resume reply text with a compose icon, retaining destination description, keyboard activation and writing content.
- [x] Replace the placeholder symbol with the supplied SVG geometry recolored through our four palette tokens, keeping the TSDM word.
- [x] Verify desktop/narrow presentation and retain repeatable browser evidence, passing formatting/syntax/whitespace checks.

Browser checks at994×874 and375×874: refresh is44×44px, resume is56px high, header contains the new44px SVG plus TSDM without document overflow. Staging then clicking the refresh icon detected two new posts. Enter on Resume restored “保留图标测试回复” and the original target; minimizing retained both. Enter also activated refresh in the narrow view. Computed fills match#6d5175/#a29bba/#a6c6e1/#ebf5e8. Desktop/narrow screenshots were inspected and console warnings/errors were empty. Evidence: `evidence/runs/icon-brand-2026-11-06/`. This qualifies the local MVP; touch/device, full zoom and theme variants were not independently exercised. No production changes, ticket publication or new unit tests.

Final gpt-6.1-sol xhigh advisor review used validate-gpt-code-review and found no significant issue or distinct additional trade-off. It independently verified all eight SVG shapes/viewBox, palette mapping, retained TSDM text, accessibility attributes, syntax and whitespace, and inspected browser observations/screenshots without rerunning the journeys. Every scoped acceptance criterion is verified; visual approval and production integration remain pending.

## Edge-to-edge MVP — 2026-11-06

Request: apply Android's edge-to-edge design to the MVP. Research: https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge describes backgrounds/dividers reaching the available edges while critical controls respect system/cutout insets. https://developer.chrome.com/docs/css-ui/edge-to-edge supplies the browser viewport-fit/safe-area mechanism; browser content cannot control native status/navigation bars. DESIGN.md already records the corresponding web adaptation.

Plan before implementation: let the workspace itself own the full viewport, moving the prototype banner and simulation bar into Settings → MVP controls. Header, reader/footer/composer and navigation surfaces reach their edges; put spacing on content rather than around these surfaces. Make sample post dividers span the reader and keep text gutters. Apply top/bottom insets once on the owning surfaces, lateral insets only on exposed panes, and a stable maximum bottom reserve with a current-inset fallback. Keep the TSDM mark/word and all existing navigation. Include labeled portrait/landscape inset simulation in the MVP controls so browser geometry is reviewable. Adapt the shell to visual viewport height/pan at scale1, leaving pinch zoom alone. No native wrapper or production integration is implied. These reversible MVP choices need final advisor review only.

Failure cases before code: double top/bottom insets, exposed reader/list text under lateral cutouts, internal panes incorrectly inset, footer floating above the viewport, edge-spanning dividers still clipped by pane padding, Settings/simulation controls inaccessible, clock advancement always paused inside Settings, focus rings clipped at scrollport edges, narrow header overflow, editor hidden by reduced viewport, resizing or new geometry loses reading anchors/text, and wide writer boundary/width regressions. Verify browser journeys with recorded geometry/screenshots; no new unit tests.

Actual trade-offs:

- Moving the preview banner and persistent simulation bar into Settings → MVP controls gives their space to the workspace. Simulation controls and stub-action feedback now take an extra navigation step to inspect; the desktop caption retains an MVP label.
- Flat sample-post rows and full-width dividers make the reader continuous, replacing its prior card-like separation. Text keeps24px gutters, reduced to16px on narrow screens, while board cards and dialogs keep their component radii. The expanded writer meets the reader at a divider with no inter-pane gap.
- Each exposed surface owns its content insets; internal boundaries keep ordinary gutters. The bottom reserve prefers the stable maximum safe-area inset to reduce browser-chrome reflow, potentially retaining more blank space than the current inset. Browsers without that variable use the current inset or zero.
- The shell follows visualViewport height and vertical offset at scale1, adding resize/scroll handling to keep reduced-height layouts available. Pinch zoom uses the ordinary viewport instead of resizing the application around the magnified area. Physical keyboard, cutout and browser-chrome behavior still require device qualification; the labeled CSS presets only demonstrate inset ownership.
- Very short viewports allow the reader's outer surface to scroll as well as the post stream/composer. This preserves access to writing and Review at the cost of another scroll region. A short More menu also scrolls internally so its last action stays reachable above the bottom reserve.
- These rules stay in the throwaway preview and override its imported production stylesheet. This keeps the approved experiment isolated but adds a local cascade that can need adjustment if shared styles change.

Acceptance and verification (completed2026-11-07):

- [x] Fill the viewport with workspace surfaces, including the header, account/footer and expanded writer, and let sample-post dividers reach both reader edges.
- [x] Keep content inside simulated portrait/landscape insets on exposed panes, without adding lateral cutout space at internal pane boundaries; contain the tested menus and dialogs.
- [x] Keep Settings → MVP controls reachable and exercise staged arrivals plus the accelerated automatic check after the modal closes, without moving the current post or inserting content.
- [x] Retain exact page jumps, cancellation and ordered unique posts during continuous reading.
- [x] Retain reply text through narrow/short/wide layouts and minimize/resume; keep Review reachable and direct column resizing functional.
- [x] Retain repeatable browser evidence and pass scoped formatting, module syntax and whitespace checks.

Browser observations: at994×874 the shell is(0,0,994,874), header starts at y0, reader/account surfaces end at y874, and posts span the478px reader with radius0. At375×874 with24px top/bottom simulation, the brand starts at y32 and the reply/resume target ends at y850 while its surrounding surface ends at874. Portrait Settings fits x16–359/y40–834. At844×500 with44px lateral/24px bottom simulation, the exposed navigation/list/reader edge receives44px while internal text gutters remain24px; footer and resize edges stop at y476. The wide writer is420px and reaches the bottom edge; its internal divider gets ordinary padding, its exposed edge the inset.

Direct resizing changed Boards216→248, Threads300→316 by keyboard, and Writing420→460 by dragging; Settings reset restored defaults. The same reply text survived compact/expanded/minimized presentations and widths375/768/960/1440/1706. At375×420 with125% text and portrait insets, Review scrolled into view at y336–380 and opened a contained, scrollable dialog. No horizontal document overflow was observed in the checked layouts. All captured console warning/error logs were empty.

Verification corrections: eliminating post gaps exposed the old6px page-jump offset's subpixel ambiguity, causing the previous page to remain the first visible row. Jumps and reveal now align the target divider to the reading edge; requested46/90/91/92 report those pages with offsets within0.05px. Cancellation preserves the current page, and reverse continuous loading produces unique ordered IDs276–265. The short-view More menu initially extended into the bottom reserve; it now measures the available room and scrolls, ending at y388 above the24px reserve in a420px viewport. Its horizontal position also uses the group's existing content gutter instead of applying that gutter twice. Finally,4px status-strip padding moved posts when an update notice appeared; removing it restored a fixed-height strip. Staging and advancing through Settings detected2 posts/1 thread with post273 remaining at0.046875px and the loaded IDs unchanged.

Evidence: `evidence/runs/edge-to-edge-2026-11-06/` contains read-only DOM probes, observations, screenshots, replay instructions and source/artifact hashes. The folder uses the iteration start date; final verification finished on2026-11-07. The observations retain named before-correction records; final-prefixed records describe the corrected implementation. Browser viewport, text and inset overrides were reset. Device insets, physical touch/keyboard, full browser/OS zoom and native Android system bars are not qualified by this browser MVP. Visual approval and production implementation remain pending; no tickets were published.

Final gpt-6.1-sol xhigh advisor review used validate-gpt-code-review and found no remaining significant issue or distinct additional trade-off. It inspected the diff, adjacent viewport/inset logic and retained screenshots/observations, and independently passed module syntax and whitespace checks. It did not independently rerun the browser journeys. All scoped MVP acceptance criteria are verified; owner visual approval remains pending.

## Softer boundaries MVP — 2026-11-07

Request: minimize borders and use shadows to indicate boundaries where possible. This revises the current edge-to-edge direction of the MVP on feat/improve-ui-ux; production integration and ticket publication remain later work.

Research and plan before implementation: DESIGN.md defines a floating shadow of `0 4px 16px rgba(0,0,0,0.06)` and a modal shadow of `0 16px 48px rgba(0,0,0,0.24)`. It currently prescribes hairlines for cards and decorative separators; the owner's new preference authorizes exploring a broader shadow treatment in this MVP. Reuse those black compositing values, orient the subtle shadow toward each pane boundary, and remove decorative outlines from the header, panes, account/reply docks, cards, menu and dialogs. Keep the post stream flat, separating posts with whitespace rather than lifting every post. Use the existing black/white selection pairing when removing the selected thread's outline. Keep field boundaries, quote semantics, resize hover/focus indicators and keyboard focus rings where they carry useful information. This is a reversible visual adjustment; required advisor review follows verification.

Failure cases before code: a pane's shadow is clipped or hidden behind its neighbor; changed stacking blocks menus or drag edges; borderless cards lose their selected/hover/focus distinction; field affordances or focus contrast disappear; shadows create overflow or break the edge-to-edge safe-area geometry; changed row heights break exact page jumps; menu/composer controls become obscured. Verify focused browser journeys and retain repeatable screenshots/measurements. No new unit tests.

Actual trade-offs:

- Subtle shadows replace decorative hairlines on the workspace, cards, docks and floating surfaces. This extends DESIGN.md's floating treatment to more surfaces at the owner's request: boundaries are softer but less sharply defined on white, and this light MVP does not qualify Dark or forced-color presentation.
- Posts remain flat and borderless, with vertical padding increased from 16px to 24px. Whitespace supplies separation without making every post appear elevated, at the cost of lower reading density.
- A selected thread uses the existing black surface/white text pairing instead of an outline. Selection stays explicit with strong contrast but carries more visual weight in the list.
- Thin input boundaries, semantic quote rules and keyboard focus rings remain. This preserves editing affordances, content meaning and navigation clarity while deliberately retaining some lines.
- Explicit pane/header/dock stacking makes directional shadows visible over neighboring surfaces. It adds a layer-order dependency; the divider targets and menus were checked against that order, and future overlapping surfaces must respect it.

Acceptance and verification:

- [x] Remove decorative outlines from the header, panes, account/reply docks, board/thread cards, menu and dialogs; use the documented shadow values and whitespace for their boundaries.
- [x] Retain explicit selected-thread styling, keyboard focus and usable input boundaries; preserve the existing hover rules.
- [x] Keep direct column sizing, exact page navigation, reply editing/review/minimize/resume and safe-area layout usable in the checked desktop, wide and narrow views.
- [x] Save repeatable browser evidence and pass scoped formatting, inline-module syntax and whitespace checks.

Browser checks at 993×874, 1706×874, 375×874 and 375×420: inspected screenshots show soft pane/dock shadows, borderless cards and flat post rows. Computed decorative borders are 0px; floating effects resolve to black at 6% with 4px offset/16px blur, and Settings resolves to the documented 24% modal shadow. Keyboard-focused thread cards retain a 3px black outline and 2px white gap plus their shadow. Selection is white on black; the filter and editor retain 1px field boundaries. Filter entry returns one matching board, and selecting its thread works. Existing hover behavior was inspected in CSS, rather than separately qualified with pointer-hover automation.

Boards drag resizing changed 216→248 and Threads keyboard sizing changed 300→316; Home restored both. Jump 46 selects post 138 in reverse at −0.046875px, and cancelling 12 retains 46. The same sample writing text survived the wide aside, narrow expanded composer, Review and keyboard Resume. With portrait insets in a 375×420 viewport, the borderless More menu ends at y388 above the bottom reserve; Refresh activates and closes it. No horizontal document overflow or browser warning/error logs were observed. The viewport/inset simulation was reset and the deliverable tab retained.

Evidence: `evidence/runs/softer-boundaries-2026-11-07/` contains screenshots, DOM observations/probe, replay instructions and source/artifact hashes. These are local browser checks of the approval MVP; physical devices, full zoom and other themes remain unqualified. Owner visual approval remains pending.

Final gpt-6.1-sol xhigh advisor review used validate-gpt-code-review and found no significant scoped defect or distinct additional trade-off. It inspected the source, recorded measurements and screenshots, independently passed formatting/module-syntax/whitespace checks, and verified the four source hashes and 14 artifact hashes. It did not independently replay browser journeys. All scoped acceptance criteria are verified.

## Apply the documented palette MVP — 2026-11-07

Request: follow the Color Palette in `/Users/benson/Documents/code/tsdm-ui-experiment/DESIGN.md` while retaining the current edge-to-edge, softer-boundary direction.

Research and plan before implementation: the current Light MVP's individual colors are already allowed, but most category color is confined to tiny navigation dots and the logo. DESIGN.md explicitly applies Community `section-base` #ebf5e8, Anime `section-pink` #dda49f, Creative `section-alt` #a29bba and Music `section-cool` #a6c6e1 to discovery cards, category labels and reader breadcrumbs. Deep purple #6d5175 serves inverse content and the supplied brand; the document keeps everyday reading white with black text, and primary/selected actions black with white text. Apply the four category roles consistently to board cards, sidebar group labels, the board-list category label and the reader breadcrumb. Color writing's destination label from its retained target, and use the prescribed pale-green quote surface in the rich editor. Preserve exact palette values, monochrome actions, existing shadows and focus rules. Colored board cards retain their category fill on hover and underline their title for feedback. The existing Light appearance remains the bounded MVP scope; adding other themes or new announcement/avatar/table features is outside this adjustment.

Failure cases before code: category colors drift from exact tokens; one generic accent represents every group; colored surfaces inherit gray/white low-contrast text; hover removes category identity or focus disappears; navigating the list recolors a retained reader/writing target incorrectly; deep links omit the category; a new label causes narrow overflow; quote formatting or page jumps regress. Verify colors and contrast against the document plus browser journeys, then retain screenshots/replay artifacts. No new unit tests. All choices are reversible; advisor review follows completed verification.

The browser audit also found `accent-color:auto` on the native checkboxes and #767676 browser-default boundaries on Page number/Copy URL, outside the documented control-boundary token. Explicitly use the monochrome action accent and #666666 field boundary. Apply the quotation surface to the Review clone as well as the editor so the same content keeps its palette when reviewed.

Actual trade-offs:

- Category fills and visible names now identify discovery cards, group labels, the current board and the reader breadcrumb. They make group identity easier to follow but add visual weight and a little label height; long-form reading stays white with black text and selected actions remain monochrome.
- Board-card hover underlines the title while retaining the category fill. Category identity remains stable, but the hover change is subtler than replacing the whole surface with gray. Keyboard focus retains the black ring and white gap.
- Writing's color follows its retained destination independently of the current board or reader. This makes the original target explicit when browsing elsewhere, while allowing different category colors to appear in adjacent panes.
- The explicit Color application section of DESIGN.md controls quotation color for this palette request: pale green with black text/rule. Its generic quote component and later rich-content prose still describe a soft neutral surface. Following the specific color guidance gives the requested treatment, but that inconsistency in the external document remains; this MVP does not edit the design source.
- Prototype category roles alias the existing shared color variables, with the missing rose role defined locally. This reuses the current palette without changing production styles, at the cost of keeping the prototype's role mapping aligned with those shared variables.
- Native checkboxes, page fields and the inset selector receive explicit monochrome accents/field colors while retaining their native widgets. This avoids custom control behavior, but browser/platform rendering of their internal details can still differ.

Acceptance and verification:

- [x] Apply the exact documented Community, Anime, Creative and Music roles consistently to existing category surfaces, names, dots and reader context; use black text on pastel surfaces and retain monochrome selection/actions.
- [x] Keep the reply destination's category tied to the retained writing target and render the documented quotation palette in both editing and Review.
- [x] Preserve edge-to-edge surfaces, soft shadows, keyboard focus and usable desktop/narrow/wide layouts; retain page navigation and reply content in the checked journeys.
- [x] Save repeatable browser observations/screenshots and pass scoped formatting, inline-module syntax and whitespace checks.

Computed category colors are Community #ebf5e8, Anime #dda49f, Creative #a29bba and Music #a6c6e1, all with black text. Contrast is respectively 18.759:1, 9.885:1, 7.934:1 and 11.786:1. Navigation through all four groups updates the list and reader categories; switching from Anime writing to a Music reader preserves the rose destination and its quoted text. Review retains the pale-green quote and original Anime target. Native control accents resolve to black and the explicit field boundaries to #666666.

Browser evidence covers 993×874, 375×874 and 1706×874. The colored card's keyboard focus has a 3px black outline and 2px white gap plus its retained shadow. The same text survives narrow editing, Review, minimize/resume and the wide writing aside. Page 46 lands at post 136 in forward order within 0.16px of the reading edge. No horizontal document overflow or console warning/error was observed. Board-card hover was checked in the source cascade, not separately exercised with pointer-hover automation.

Evidence: `evidence/runs/palette-2026-11-07/` includes the read-only DOM probe, observations, screenshots, replay report, receipt and hashes. These checks qualify the local Light approval MVP only. Physical devices, full zoom and other themes remain unqualified; owner visual approval and production integration remain pending. Feedback is retained here for later ticketing; no issue was published.

Final gpt-6.1-sol xhigh advisor review used validate-gpt-code-review and found no significant scoped defect or distinct additional trade-off beyond the six recorded. It confirmed the specific quote-color guidance, context behavior and contrast calculations, inspected all six screenshots and relevant observations, independently passed formatting/module-syntax/whitespace checks, and verified all five source hashes and 11 artifact hashes before this disposition was appended. It inspected browser evidence without independently replaying the journeys. All four scoped acceptance criteria are verified; owner visual approval remains pending.

## Consolidated spec publication — 2026-11-07

The owner explicitly invoked the to-spec skill to synthesize and publish this conversation. The resulting specification is [Refine forum workspace navigation, continuous reading and writing — #81](https://github.com/Benson-mk/tsdm-ui/issues/81), labelled `ready-for-agent`. It covers the full feedback sequence rather than only the final palette adjustment, with 60 user stories, 18 implementation decisions, 12 open production-acceptance outcomes and a consolidated 16-item trade-off ledger.

The owner confirmed the proposed existing full-workspace browser E2E boundary with controlled external forum responses, plus affected installed Edge/Chrome checks required by the ADRs, without a new unit-test seam. The spec retains production ownership, page-session recovery and the already-qualified latest-end follow contract; synthetic MVP simplifications do not replace those guarantees. Additional board/reverse automatic checks require real capability qualification. Existing completed work in #64/#79 is the foundation, while deferred #39/#47 remain untouched.

The designated gpt-6.1-sol xhigh advisor applied validate-gpt-code-review to the completed draft and found no material publication blocker or distinct additional trade-off beyond its ledger. This was source/spec review, not new browser verification. Template validation confirmed all seven required sections, sequential user stories, open acceptance outcomes and no workstation paths. Prettier passed. A fresh GitHub readback confirmed that the published body matches the reviewed draft, the issue is open and the required label is present. Publication is complete; implementation and its acceptance criteria remain outstanding.

## Approved ticket publication — 2026-11-07

The owner approved the twelve-ticket breakdown and selected Edge for feature testing, with Chrome deferred to final integration. [Tickets #82–#93](https://github.com/Benson-mk/tsdm-ui/issues/81) are now native sub-issues of #81, all labelled `ready-for-agent`, with thirteen verified native blocking relationships. Final ticket #93 owns deferred Chrome and same-candidate Edge/Chrome qualification. The parent specification’s body and state remain unchanged; production acceptance remains open. See the [published plan, cadence, trade-offs and verification](81-ticket-plan.md).
