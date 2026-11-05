# Sidebar feedback and approval preview — 2026-11-05

Branch: `feat/improve-ui-ux`. Status: final A selections captured; revised preview inspected and advisor-validated.
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
