# Writing through viewport changes — #74

## Premises and failure inventory before implementation

Base: accepted `6bbd4ca39298feb6aee48d4b021eef7fd8e1d818`. The pinned DESIGN/sample hashes remain `77814305…` / `f4dcacfd…`. ADRs 0001–0003 preserve forum, workspace, browser-host and recovery boundaries. Use the accepted built-userscript Edge seam: only external HTTP is substituted; VisualViewport keyboard/pan values are explicitly browser-environment emulation, while page scale is changed through the real browser. Root owns installed qualification, final BDFL and serial browser slots. No physical keyboard/device support follows from emulation.

The product currently listens only to window resize and sizes its shell/composer/overlays with dvh. The reference sync distinguishes pinch-only changes from actual layout/orientation resizing while magnified. Its known historical orientation-at-zoom bug is an explicit regression to avoid. #73 owns safe edges and reversible browser metadata; its five trade-offs are inherited rather than repeated.

Reachable failures: visual resize/pan does not move or shrink the root/ShadowRoot portals; shell and dialog coordinate systems disagree; inner/outer editor or overlay minima clip close/review/blockers/protected source on short viewports; fixed history controls consume the entire nominal reading minimum; pinch-only changes reflow layout or scroll against magnification; orientation during pinch leaves stale dimensions or pane/drawer state; missing/invalid API values yield NaN/zero size or guessed keyboard detection; repeated resize events overwrite prior reading/list anchors; delayed layout restoration or focus calls end composition, change selection, lose undo or target; a keyboard pan restores focus into a hidden source while a modal owns it; viewport events trigger unintended automatic history reads; cleanup leaves listeners on a disposed layout.

## Planned vertical slices

1. Named reduced/panned scale-one root, composer and portal expectations with retained source/selection/reading anchors, then integrate browser geometry with the existing layout/anchor owner.
2. Named missing/invalid API and real page-scale/orientation expectations, then preserve magnification while updating genuine unscaled layout changes.
3. Named short portrait/landscape actual-history and essential-action reachability expectations; adapt only measured clipping, preserving sole source/visual editor and guarded IME behavior.
4. Qualify affected existing suites and inherited old navigation/appearance assertions against current accepted contracts; never weaken a valid invariant merely because the baseline fails.

At the time of this plan, no feature code or new unit tests had been written. No one-way architecture decision required early advisor consultation.

## Observed tracer-bullet results

- `2026-11-04T14-01-12.511Z`: genuine baseline red; simulated scale-one visual height 480 / top 100 left real host height 900. Native VisualViewport getter override successfully exercised the browser-environment boundary.
- `2026-11-04T14-05-07.925Z`: reduced/panned geometry green, then real browser scale 2 / orientation red; shell height 187.5 instead of layout height 375. Both artifacts completed. The first feature owns explicit height/top variables on real host and portal CSS. The second change distinguishes pinch-only events from genuine inner dimensions.

## Distinct implementation trade-offs (in progress)

1. Keep browser viewport synchronization alongside the existing layout/reading-anchor owner, using inherited height/top CSS variables for fixed portals and composer budgets. This avoids a second restoration loop and transformed containing block, at the cost of updating each explicitly viewport-sized surface when new ones are added.
2. Preserve the last layout rectangle during pinch-only events and use unscaled inner dimensions for a genuine resize while magnified. This keeps magnification/panning independent of application reflow and handles orientation, while a keyboard-induced viewport change during magnification alone does not acquire a new application rectangle. Browser scrolling remains responsible for reaching magnified controls; no keyboard detection or physical-keyboard claim is introduced.

3. Put public history loading/status controls in the existing conversation context header so the 96px reader floor is actual post space. The controls scroll with the outer conversation and are no longer pinned over post text. This adds no new context/anchor owner; on short windows the outer conversation scroll is needed to revisit its header.
4. Preserve a 64px inner writer content floor and allow its bounded outer shell to scroll when presentation buttons plus content cannot fit its 46% budget. This retains meaningful input/action space without increasing the composer's viewport share, at the cost of an additional scroll boundary in extremely short windows.

`2026-11-04T14-11-01.699Z` passed reduced/panned geometry, real scale 2 landscape essential-action bounds, missing API fallback and browser-engine composition/undo/anchor retention. Invalid scale exposed a genuine 600 → 20px sizing failure. Its ordinary-writing short case had an external fixture mistake (addressed form supplied for an ordinary reply), fixed separately without declaring feature success.

`2026-11-04T14-14-53.587Z` passed five cases and established both remaining genuine layout reds: only 9.71875px of post content under sticky history controls and 35.296875px of inner editor content at a 240px visual height. The controls and scrolling fixes above follow those failures.

Accepted #70 (`70c5bfb`) is integrated. The local pre-merge tracked patch remains recoverable as immutable Git object `57dd182bcdb0294e5284f5523ca6d752bcd13d14`; no shared mutable stash index was used. No integration trade-off was introduced.

Inherited assertions are reconciled with accepted contracts: result docking begins at 768px; the separated public context header means the history minimum is 96px of reader space, not 160px of the old combined box. The navigation test helper waits for Vue's narrow docking transition before inspecting its trigger, because browser viewport completion precedes DOM settlement. These are test synchronization/contract corrections, not new product thresholds.

The #71 candidate independently exposed sticky-control occlusion against existing #70/#73 journeys. By coordinator agreement, #71 adopts the exact existing-header placement authored after #74’s short-history red. #74 will integrate that accepted correction rather than introduce another placement. Historical authorship and both evidence chains remain recorded; the shared placement trade-off is consolidated once in #79.

No portable core contract changes. Installed qualification and final BDFL remain pending; no acceptance criterion is marked complete yet.

`2026-11-04T14-32-41.395Z`: short writer/protected source/validation is green; stronger visible-rectangle expectations found the still-focused textarea below the keyboard rectangle (bottom 907.65625 versus 580). The fix scrolls the existing focused writing node after layout/anchor restoration without focusing or remounting it. The actual post intersection is 95.5625px after deliberate history reveal; a 1px clipping tolerance covers fractional browser scroll rounding while retaining the 96px CSS floor.

5. A scale-one geometry change reveals the currently focused writing control through existing nested scrolling. This can scroll conversation context out of view when the keyboard consumes space, but keeps editing reachable without another focus/composition event. Magnified-only events remain browser-owned; dialogs do not cause a hidden composer to reclaim focus.

## Current verification

`2026-11-04T14-52-31.115Z` passes **7/7** named viewport cases. All **73** manifest files were independently verified. Candidate SHA-256 is `a21af017fb94cb4ef0d47067de1faa602d49bc90d791f033b27551f4b6cf1299` on accepted #70. Screenshot inspection confirms the retained selected textarea inside the simulated keyboard rectangle and the essential presentation controls reachable at actual browser scale 2 in landscape. Keyboard/pan geometry is explicitly simulated; no physical mobile keyboard claim follows. Browser-engine composition is tested with CDP, distinct from final OS CJK qualification.

Typecheck, lint, formatting, full library/userscript build and whitespace checks pass. Final broad qualification waits for accepted #71 shared-layout integration. Installed Edge and BDFL remain pending; this seven-case result is not final integrated acceptance.

`2026-11-04T14-56-24.932Z`: **107/108** affected cases pass before #71 integration. The sole red is inherited `J2.section-overviews`, which expected zero posts after opening Search. Accepted #67 intentionally retains the selected reading context beside each overview. The correction asserts twelve retained posts and exact first PID101; its narrow-navigation/reload continuation still requires a rerun. All four appearance width/locale matrices, safe edges, responsive anchors, thread-history workflows and source/visual/browser-composition journeys pass. The broader run remains a distinct pre-integration result, not final acceptance.

`2026-11-04T15-02-47.668Z`: the corrected J2 journey passes completely, including exact retained post identity, reload, Back, medium/narrow navigation, settled shell geometry and the original independent request-count bounds. This closes the lone inherited assertion failure from the 108-case run; final same-candidate integration qualification remains pending.

## Final integrated candidate

Accepted #71 (`1fe329a2fbcf3eaeba75c89a5ae34f72f68bf37a`) is integrated. Its shared history-header placement is retained exactly; no duplicate control block or competing restoration owner was introduced. The local patch is recoverable from immutable Git object `78c315ee6e5d203c7bf3acf7e9bbbaa0a67c5eca`.

Final executable SHA-256: `f751cfd79090f599bac5c2673ea38fd32d82706008a72c5f20b3adb02dba3004`.
Frozen source/executable: `evidence/runs/74-final-integrated71/`.

`2026-11-04T15-06-20.624Z` passes **129/129** final affected Edge cases: seven viewport cases, writing presentation/composition/immutable review, safe edges, all appearance width/locale matrices, responsive navigation, thread history and 21 fast refresh/arrival/anchor cases. The two actual cadence timer cases remain covered by accepted #71's unchanged scheduler; they were not relabelled as rerun in #74. Static checks and full build pass. Portable client contract and library bytes are unchanged, so no new external-consumer claim is required.

Repeat on Node24.22.0 with `npm run build`, then:

```sh
npm run test:e2e -- tests/e2e/visual-viewport.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/safe-area-edges.spec.ts tests/e2e/appearance.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/thread-history.spec.ts tests/e2e/thread-refresh.spec.ts --grep-invert 'IM71.(auto-policy|failure-recovery)'
```

Installed Edge and final BDFL acceptance of this exact candidate remain pending. No commit or issue mutation yet.

## Final acceptance criteria

1. [x] Scale-one shell/portal height and offset respond to visual resize and pan; API absence/invalid scale falls back to layout units. Dynamic units are selected when supported, otherwise regular viewport units.
2. [x] Actual page-scale magnification preserves layout; orientation at scale 2 updates unscaled height/panes and leaves essential controls reachable without zooming out.
3. [x] Bounded overlay/writer/conversation scrolling exposes protected source, validation and presentation controls. The ordinary short reader preserves a 96px CSS floor with one-pixel clipping tolerance.
4. [x] Same source/visual nodes, exact source/selection, browser-engine composition, undo/redo, addressed target, manual pane state and reader/list anchors survive qualified cycles.
5. [x] Synthetic keyboard/pan, short landscape, missing API and real page-scale artifacts pass; exact-candidate installed focus/browser-composition observations pass with explicit simulation and OS-IME limits.
6. [x] Pinned design hashes and ADR boundaries remain intact; source-first sole-context, immutable review and existing operation/account/source/financial behavior pass affected suites. All 29 portable artifacts match accepted #71 byte-for-byte.
7. [x] Failure inventory and named whole-app expectations preceded the respective changes. Genuine reds, fixture errors, inherited contract corrections and final passing artifacts remain distinct; no after-code unit tests were added.
8. [x] Static/full build, 129 final affected Edge cases, exact-candidate installed Edge and final BDFL pass. Chrome and actual OS CJK remain explicitly deferred to #79 under the approved cadence.

## Final installed and BDFL acceptance

The coordinator and BDFL accepted the exact `f751cfd79090f599bac5c2673ea38fd32d82706008a72c5f20b3adb02dba3004` candidate on accepted #71. All eight criteria above are verified at the owner-approved scope. The final application manifest contains **419 verified files**; the installed manifest contains **10 verified files**.

Installed report: [74-installed-2026-11-04/report.md](../../evidence/runs/74-installed-2026-11-04/report.md). Complete Tampermonkey source identity matches. On a 900×900 layout, the explicitly simulated 480px/top100 viewport keeps the same focused source, exact backward selection and a 96px reader; source bottom567.78125 remains inside the visible580px bottom. Panning to140 places Settings within156–604. Actual browser scale2 preserves the900px shell; real landscape812×375 changes shell height to375 and bounded scrolling exposes source within the panned visual rectangle.

Installed browser-engine composition survives resize; committing 測試 and Undo restore exact original source. This does not claim actual OS CJK or physical mobile keyboard evidence. Diagnostic viewport overrides and page scale were restored. Native continuation removed all workspace roots and owned metadata, and browser Back recovered exact source. No live preparation or submission occurred in this qualification.

All evidence is already preserved in the canonical main checkout through the existing `evidence/runs` symlink; no archive can remove those artifacts. Earlier genuine failures, fixture corrections, pre-integration runs and frozen snapshots remain immutable and distinct. The five trade-offs remain the complete list, with the shared history-header placement consolidated once across #71/#74/#79. No additional integration or acceptance trade-off was introduced.
