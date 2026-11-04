# Safe-area edges — #73

## Premises and failure inventory before implementation

Base: accepted integration `406608dfb55f2d55b10ba4cf69a138f465489386`. The pinned experiment DESIGN.md and sample.html define edge ownership; ADR0001–0003 retain host, workflow and recovery ownership. The accepted complete built-userscript Edge seam substitutes only external HTTP. Browser CDP safe-area environment overrides exercise real CSS environment values, layout, ShadowRoot and portals; they do not establish physical mobile support. Root owns installed qualification and final BDFL validation. #74 owns visualViewport resizing and keyboard behavior.

Reachable failures: padding the whole shell leaves exposed edges transparent; adding normal gutter and lateral inset wastes space; inset applied to internal boundaries or twice at drawer top; collapse fails to transfer leading-edge ownership; current bottom changes shrink history despite a supported larger maximum; absent environment APIs yield invalid or guessed dimensions; bottom reserve scrolls away with controls or hides final list items; full-height drawer and centered portals clip cutouts/close actions; global/local notices miss their owning lateral edge; theme changes alter geometry or neutral Mono; viewport/theme declarations conflict with native metadata, erase unknown directives or disable zoom; missing/duplicate metadata cannot restore exact original nodes/content/order; native continuation, startup failure or page-session restoration leaves stale browser hints.

## Planned vertical slices

1. Named complete-app geometry tests for zero/portrait/lateral browser insets, pane collapse, retained composer and final list rows; then owning-surface CSS.
2. Named drawer/settings/review/notice portal geometry and theme parity tests; then scoped safe rectangles.
3. Named userscript/native metadata lifecycle tests; then a host-owned reversible declaration owner. No portable client change is planned.

## Acceptance status

- [x] Owning opaque surfaces extend to edges; external insets apply once with maximum/current/zero fallbacks.
- [x] Leading-edge transfer, final list rows, drawer top ownership, notices and portal controls are verified.
- [x] Viewport/theme metadata has one reversible host owner; native continuation restores missing/single/duplicate declarations exactly.
- [x] Root/ShadowRoot/portal portrait/lateral/zero geometry, retained rounded controls, neutral Mono and theme parity are verified.
- [x] Browser-emulated evidence and affected installed Edge observations are complete at the bounded scope recorded below.
- [x] Pinned design, ADR boundaries, source-first sole writing, immutable review and existing operation/account/source guarantees are preserved.
- [x] Failure inventory and named built-app expectations precede corresponding feature code; replayable failed and passing artifacts remain distinct. No unit tests were added.
- [x] Static/full-build gates, affected installed Edge and final BDFL acceptance pass for the final integrated candidate. Chrome remains assigned to #79. No physical mobile, native system-bar/icon or release support is claimed.

## Delivered behavior

The real ShadowRoot host exposes browser safe-area environment values with zero fallbacks. The global bar, pane backgrounds, composer and drawer extend to available edges; content uses the greater of its existing gutter and the exposed inset. Boards owns the leading edge until collapsed, then the list, then the conversation. Internal pane boundaries retain ordinary gutters. The composer reserve is outside its scrolling content and inside its existing46% height budget. The larger current/maximum bottom value protects end rows and actions. An outer conversation scroll target also reserves that edge, so a short-window action can be scrolled above the gesture area. Drawer headings own top protection exactly once; settings and retained-writing review dialogs fit within the safe rectangle.

A browser-host metadata owner temporarily replaces existing viewport/theme declarations with one active declaration each, retaining the original DOM nodes in exact order via comment positions. Unknown directives from the first viewport declaration are retained; width/initial-scale/cover and zoom restrictions are normalized only while the workspace owns the page. The theme hint follows the selected root surface. Pagehide restores native declarations; pageshow reacquires ownership, and the existing native menu/startup catch disposes the owner. Complete-app native navigation verifies missing, single and duplicate original declarations. This does not claim a physical BFCache/device/native-system-bar observation.

## Actual distinct trade-offs

The pinned design already records maximum-bottom reserve, max(gutter,inset), opaque surfaces and browser-emulation limits; those inherited choices are not counted again here.

1. Temporarily detach native viewport/theme nodes and retain placeholder positions while the workspace is active. This avoids conflicting declarations and restores exact nodes/attributes/order, at the cost of a small browser-host lifecycle owner and temporarily unavailable native declarations to page queries.
2. Normalize active width/initial-scale/cover and remove native zoom restrictions while retaining other directives from the first viewport declaration. This enables usable workspace cover and user zoom, at the cost of temporarily overriding the native page's viewport policy; exact original declarations return on native continuation.
3. Keep safe-edge CSS in a localized override block to preserve existing component recipes and make edge ownership explicit. This limits unrelated edits but requires maintaining cascade precedence alongside existing Compact/responsive rules.
4. Add the bottom reserve to the outer conversation's scroll-target padding. This keeps the selected action above the unsafe edge, at the cost of slightly more outer scrolling when bringing a low action into view.

## Evidence ledger

All runs retain real statuses, source/build identities, manifests and browser screenshots/geometry/request ledgers. CDP inset overrides are browser-environment emulation; the absent VisualViewport case explicitly emulates an unavailable browser API. No internal application collaborator is substituted.

- `2026-11-04T12-50-09.336Z`: invalid-baseline diagnostic; the integration checkout's ignored dist was stale and lacked current reply controls. No feature conclusion follows. The accepted source was rebuilt locally before genuine expectations.
- `2026-11-04T12-51-06.043Z`: genuine top-inset red, expected30px versus6px.
- `2026-11-04T12-51-46.893Z`: edge ownership/current-max-zero fallback/retained composer green.
- `2026-11-04T12-52-38.799Z`: fixture selectors incorrectly retriggered an already-open drawer and assumed a theme select rather than existing radios; kept separately.
- `2026-11-04T12-54-21.425Z`: genuine drawer and portal safe-bound reds.
- `2026-11-04T12-54-59.014Z`: initial three edge/drawer/theme cases green.
- `2026-11-04T12-56-00.242Z`: genuine missing/duplicate/noncover viewport and lateral notice reds.
- `2026-11-04T12-57-06.549Z`:6/7, notice geometry passes; retained-writing journey had an ambiguous visible/underlying board link selector.
- `2026-11-04T12-57-49.571Z`:6/7, corrected board selection; exact dialog label needed its existing question mark. Static typecheck/lint passed.
- `2026-11-04T12-58-35.565Z`: broader affected run104/111. Seven completed new cases pass. Six inherited failures and a portrait measurement failure remain distinct.
- `2026-11-04T13-01-28.936Z`, in the accepted #72 worktree: exact accepted `617cab9a…` baseline independently reproduces all three representative inherited failure families: old Main destinations navigation, old960-only result visibility/reader-height geometry, and Back list offset400→370. The other three appearance failures differ only by theme. These are not #73 regressions or passed checks; coordinator assigned list offset to #67 and old navigation/geometry to #74/#79.
- `2026-11-04T13-01-44.555Z`: corrected portrait observation measures the essential Review action rather than requiring an entire overflowing composer visible. Genuine unsafe action bottom824.77px exceeded810px.
- `2026-11-04T13-02-15.358Z`: portrait safe-action green after outer scroll-target padding; screenshot visually inspected.
- `2026-11-04T13-04-00.388Z`:53/53 final scoped cases pass on the #72-based candidate: all8 safe-area cases, complete progressive drawer/modal gestures, three-language/four-theme/twelve-width matrix, writing selection/undo/source/visual/browser-composition continuity, shortcuts and actual-history cases. The inherited UX53 offset case is explicitly excluded, not relabelled.

Typecheck, lint, formatting and full application/library build pass. Scoped userscript SHA-256: `b74df8a2a0da30db768d92a94637a839a0af5cb4b2cf6d44d70c2527c29d2328`. Portable library SHA-256 `0b3d0915ad06285e7eeaf902331e931540b769e895a177f86adfa2674c140e2d` remains identical to #72; no portable contract change or conditional consumer obligation arose. Latest-tip reconciliation, installed Edge and final BDFL acceptance remain pending.

## Accepted #69 integration

Accepted integration `4c45df7c8545f9cbacabb9c93af4f4e63e1a72cb` merged cleanly. Current combined userscript SHA-256 is `7e992610c5a9456b2081026c83b97c7bc54f85187ee33c7e660110afc96863ac`. Typecheck and full build pass; the combined safe-area/automatic-history/progressive-drawer run passes31/31. This validates automatic pagination boundaries, modal pauses, source continuity and all eight safe-edge journeys together. The earlier53-case run retains its pre-#69 source identity.

## Accepted #76 integration and frozen candidate

Accepted integration `56d643d57262fcd5e8b152231f463eb4bce4d7aa` merged without conflicts. The corrected private delayed-reading focus/composition guard is retained unchanged. Combined run `2026-11-04T13-16-48.513Z` passes56/56: all8 safe-edge cases, all25 private-history cases,16 automatic-history cases and7 progressive-drawer cases. The previous31/53-case results retain their own candidate identities.

Frozen combined userscript SHA-256: **`482639645a2979b7b7c7deea29495b2f0a93f197cf9a252356c468a9b6cfd458`**. Typecheck and full build pass. The entire generated0.18 portable library tree is byte-identical to accepted #76, including index hash `20190918a01c18b60f3aeb84a7094cb4906a9e337985cba4be982f31b8baba55`; its qualified consumer evidence is reused without a new contract claim.

The coordinator byte-verified and deduplicated this worktree's evidence/runs to the integration's canonical directory. Original paths resolve through that symlink; new runs write the same canonical store. No directory-wide recopy is needed. Installed Edge and final BDFL validation remain pending; no executable source changed after this build.

## Advisor bottom-owner correction

The supplied P2 is independently confirmed. The attempted last-child selectors never matched the actual read-only reader/placeholder because the conversation always contains a following status wrapper. Hidden retained writing is nested in that wrapper, and SourceWriting stays mounted through v-show. The private final native link could not be scrolled above the40px bottom reserve. This is an actual #73 scope defect, not #74 keyboard work or an intentional short-window trade-off.

Named public/private/placeholder/hidden-writing expectations were added before repair. `2026-11-04T13-26-29.873Z` records genuine public/placeholder/hidden-writing failures plus one transitional private-reader selector issue. `2026-11-04T13-27-27.895Z` waits for the real private reader and records its genuine final-action bottom900.45px against a860px safe edge.

The conversation now exposes the existing writing visibility as one presentation attribute. When the composer is absent or hidden, the opaque conversation owner reserves the safe bottom for its actual reader/placeholder/status children. When the composer is visible, that outer reserve is zero and the composer keeps its own reserve. This avoids guessing visibility from DOM sibling position or inline display strings, and preserves the mounted hidden editor. The public/private focus and history owners are unchanged.

Additional distinct trade-off5: expose existing writing visibility to the layout CSS and reserve the read-only bottom on the conversation owner. This adds a small explicit presentation-state coupling and reduces its available content rectangle by the reported reserve; it replaces brittle last-child inference and avoids reserving the same edge again beside the visible composer. The inherited maximum-reserve blank-space cost remains recorded in the pinned design.

Corrected runtime SHA-256: `eac1ef902b0d71ab3b07c8037987b6e04051d0eafe3690f904da8dab49b80ac9`. Typecheck, lint, formatting and full build pass. All four corrected assertions completed in `2026-11-04T13-28-11.390Z`, and all17 directly affected assertions completed in `2026-11-04T13-30-15.038Z`; both runs remain **unqualified because evidence attachment writes failed with ENOSPC**. Neither is relabelled as a passing run. Root is coordinating disk capacity before the bounded rerun. The earlier installed48263964 bundle remains limited to its original observed scope. Corrected installed and BDFL acceptance remain pending; no commit has been made.

After root verified disk capacity and serialized browser work, corrected run **`2026-11-04T13-34-20.555Z` passes17/17** with no evidence errors. Its106-file manifest verifies exact coverage, sizes and SHA-256. All12 safe-area cases, private opening/delayed source/composition cases and both docked-composer widths pass. The private final action is reachable above the reported bottom reserve, and hidden retained writing returns to the same editor with outer reserve0 and composer reserve52px. The corrected private-reader screenshot was visually inspected. The browser closed before releasing the execution slot to other workers. Runtime remains frozen at `eac1ef90…`; affected installed observation and final BDFL acceptance remain pending.

## Accepted #67 integration and final frozen source

Accepted `d42de646b5f2d8bfc25a9a5c8ba62169fd2e19f5` merged through the verified immutable #73 stash `a347b3680e0cd50429cec373e2a75301087c3da0`. Restoring its saved index first rejected moved layout context without modifying source; three-way content application then succeeded. The only #73 layout change remains the writing-visibility presentation attribute. #67's direct-entry placeholder and explicit-target focus/anchor ownership are retained.

Final combined **`2026-11-04T13-43-56.622Z` passes26/26**: all12 safe-area journeys,9 retained-list journeys,4 private-history/drawer/delayed-writing journeys and the corrected UX53 context contract. Its120-file manifest verifies. #67 separately records the original raw-offset failure and accepted visible-anchor correction; the integrated UX53 pass does not relabel that older failure. The inherited old appearance/navigation cases remain assigned to #74/#79.

Current frozen userscript SHA-256: **`84cd757d8d7e9970636ac39a34739ebae82e0c7227f65015726cd095ba74f9ac`**. Typecheck, full build, lint, formatting and whitespace checks pass. The portable0.18 artifact remains unchanged. No additional trade-off was introduced by integration. The browser closed before the slot was released; source stays frozen while root completes corrected installed Edge and final advisor acceptance.

## Final installed Edge and BDFL acceptance

The sealed `evidence/runs/73-installed-corrected-2026-11-04/` contains seven verified files. Its complete retained Tampermonkey source matches **`84cd757d…`**, and a reload mounted that source. The actual viewport was1119×596: the requested1280×900 override did not apply to this tab, so no larger-viewport observation is claimed. The browser safe-area bottom12/max40 override did apply.

With public writing retained but hidden beside controlled private history, the conversation reserve was40px, status ended556px (596−40), reading ended441.906px, and its final native action ended442.031px. Exact public source remained intact. Returning to writing changed outer reserve to0 and composer padding to52px, with composer height274.156px (46% of596). The original48263964 nine-file installed bundle remains historical evidence for unaffected lateral/top/theme/drawer behavior; it is not relabelled as the corrected candidate. Long/no-writing/private/public/placeholder variants are separately covered by the exact-candidate complete-app cases.

All inset/viewport overrides were reset. Active viewport/theme metadata was singular; actual native private continuation showed the independently known native message identities with the workspace absent and both original metadata declarations absent again. No send, publication or release occurred. These are browser-emulated edges, not physical cutout/system-bar or OS-icon support. Chrome and final native CJK qualification remain #79.

Final BDFL acceptance was received directly for this exact source and accepted #67 base after independent bottom-owner reproduction, verification of all120 final application-manifest files and all7 corrected installed-manifest files, and exact manager-source comparison. No material finding remains and no additional distinct trade-off beyond the five recorded above was identified. All eight ticket acceptance criteria are verified at this scoped cadence. Earlier failures and ENOSPC runs retain their actual status.
