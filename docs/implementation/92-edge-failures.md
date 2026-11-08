# Browser-edge failure inventory — #92

Research precedes feature edits. The accepted seam is the complete built application in Microsoft Edge with external HTTP responses substituted. Browser safe-area emulation and VisualViewport event simulation are declared inputs; neither establishes physical-device or native-system-bar behavior. No isolated/unit seam is introduced.

Existing owners: browser-chrome owns viewport metadata; WorkspaceLayout owns scale-one visual viewport sizing/pan, pinch/layout distinction and reading anchors; CSS owns exposed surface padding; Reka owns menu/dialog portals; ColumnSeparator owns direct resizing. Preserve these owners, production source/review/recovery, and the portable client.

Reachable failures and named expectations, implemented one vertical slice at a time:

- UI92.external-edges: wide writing transfers the right external edge from the reader to the writer; collapsing side panes transfers only the reader's left edge. Reusing the entire conversation inset on both wide columns adds spurious internal safe padding. Header/account/reply backgrounds must reach their owning edges without outer framing. Resize strips must end above the reserved bottom region.
- UI92.browsing-edges: directory/board-only results reach the right viewport edge and need lateral protection there. Minimized writing and account/browse surfaces must not reserve the same bottom region twice.
- UI92.safe-overlays: More menus, Settings, Review and drawers remain within the scale-one panned safe rectangle. Keyboard navigation/focus and direct resize strips remain reachable without intercepting modals. A menu bounded only by the layout viewport can cover the system bottom reserve.
- UI92.short-review: short keyboard-constrained writing retains source/selection/target, real immutable Review and useful post history with scrollable controls and no document overflow. Magnified orientation must change the actual layout while pure magnification retains it.
- UI92.breakpoint-matrix: cover 375, 504, 589, 714, 717, 734, 767/768, 779, 959/960, 1439/1440 and 1706 widths with justified combinations of normal/short height, asymmetric/portrait/current-only safe insets, expanded/minimized writing and pointer/keyboard resizing. Reuse unchanged successful existing viewport/pinch/fallback cases where their scenarios still cover the refined owners.
- Investigate the inherited geometry failures J5.appearance-resize-context/context/new-anchor and UI82.same-retained-thread wherever #92 affects their behavior; do not relax thresholds or silently waive failures. DESIGN.composer's pre-wide height expectation is incompatible with the approved wide writer and must qualify actual presentations distinctly.

Each run retains report/receipt/source manifest, screenshots, geometry and external request ledger. A final frozen source/build package and installed Edge qualification remain separate gates. Chrome is deferred to #93 by owner instruction. The designated root advisor runs only after implementation and evidence are complete; no costly irreversible decision currently requires early consultation.

## Installed recovery-state discovery before correction

Installed99ef at390px width and a300px scale-one visual viewport combines an80px safe header,56.59375px truthful restored-snapshot banner and90px bottom Resume. This leaves only73.40625px for the conversation, so a96px reader node is still clipped. UI92.restored-short-history must reproduce through real browser reload/page-session recovery and require at least95px actually visible history, retained source/target, accessible full warning and reachable Resume. Preserve normal geometry and truthful status; do not suppress the banner or relax the reading threshold.
