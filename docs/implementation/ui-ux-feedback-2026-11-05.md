# Sidebar feedback and approval preview — 2026-11-05

Branch: `feat/improve-ui-ux`. Status: final A selections captured; reader controls and compact-reply preview verified and advisor-validated.
This is a local feedback record for later GitHub tickets, not a published ticket or an accepted production change.

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
