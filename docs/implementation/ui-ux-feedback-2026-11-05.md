# Sidebar feedback and approval preview — 2026-11-05

Branch: `feat/improve-ui-ux`. Status: feedback captured; design approval pending.
This is a local feedback record for later GitHub tickets, not a published ticket or an accepted production change.

## Feedback captured

| Comment | Request                                               | Evidence and proposed direction                                                                                                                                                                                                                                                                                                                  |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | Replace text symbols with icons; we already use Reka. | `WorkspaceLayout.vue` uses `sectionSymbols` and header glyphs. Reka UI supplies headless interaction primitives, not a general-purpose icon set. Preview consistent inline SVG icons; select a maintained Vue icon set for production after approval.                                                                                            |
| 2       | Are board dots all one color?                         | Yes: `styles.css` assigns `var(--support)` to every dot. Keep that baseline and offer an illustrative group-color comparison. Colors must not imply unread/status information. Actual board grouping and fallback behavior need agreement before implementation.                                                                                 |
| 3       | Is a Chinese font missing?                            | The configured stack already includes Noto Sans CJK TC, PingFang TC and Microsoft JhengHei, after system-ui. The supplied screenshot renders Chinese glyphs. Their actual resolved font is not established. Compare the current stack with explicit Simplified/Traditional Chinese stacks on tagged text; do not claim a missing-font diagnosis. |
| 4       | Highlight all buttons on hover.                       | Global buttons currently underline on hover; board cards already change border color and underline the title. Preview a clearer surface tint plus border on actionable cards/rows/buttons, retain keyboard focus, and keep disabled controls distinct. A later implementation needs a complete control audit.                                    |
| 5       | Keep sign-in information visible without scrolling.   | `.navigation-account` is inside the scrolling `.boards-region`. Preview a non-scrolling footer with the navigation body scrolling independently. Preserve accurate member/guest/unknown/restored wording in production.                                                                                                                          |
| 6       | Move Settings and About beside sign-in information.   | Both triggers currently live in the header. Compare compact icon actions beside the account with a labelled action row below it. Production must preserve existing Reka dialogs, portals, focus return, collapsed-pane access and mobile drawers.                                                                                                |

## Preview question and plan

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

## Run and inspect

Run `npm run dev -- --port 5173`, then open:

`http://127.0.0.1:5173/src/layouts/sidebar-feedback.prototype.html?variant=A`

Variant A places icon actions beside the account. Variant B places labelled actions below it. The comparison bar changes the URL variant; arrow keys switch variants outside editable/form controls. Dot/font choices live only in memory. Scroll the sidebar and try Settings/About, hover, keyboard focus, and the larger-text control. Dialogs are illustrative native-dialog stubs, not the existing Reka integration.

## Actual trade-offs

1. A synthetic, isolated preview with the real stylesheet gives a concrete approval artifact without changing live forum behavior; it cannot qualify production navigation, Reka focus/portal behavior or installed browsers.
2. Reserving a fixed footer keeps identity and tools visible but reduces the board list's visible height. The entire navigation body scrolls, keeping primary destinations reachable even at short heights.
3. Compact icon actions preserve vertical space but rely on accessible names/tooltips for discoverability. The labelled alternative is clearer and handles long names more comfortably at the cost of a taller footer.
4. Inline SVGs make this throwaway comparison dependency-free and consistent in size; production icon-library selection and its bundle/license cost remain pending.
5. Local script-specific font fallbacks avoid font downloads and favor appropriate Chinese faces; appearance still varies by OS and installed fonts, and correct language tagging is required.
6. Optional group colors add visual differentiation but require meaningful, stable group mapping; the preview uses illustrative groups and retains a one-color option. Color never carries the only identifying information.
7. Surface-tint hover feedback is more visible but adds visual emphasis to controls; selected states remain stronger and keyboard focus uses an independent outline.

## Verification and approval

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
