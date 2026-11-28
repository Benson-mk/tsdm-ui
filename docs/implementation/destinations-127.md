# Keep destinations reachable during deep browsing — #127

## Failure inventory before changing the UI

| Journey                              | Baseline failure to exercise                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep phone Reader → Messages / More  | The header exposes pane toggles, not labelled persistent destinations. Messages takes the Boards drawer plus a second activation; there is no More surface with six actual secondary entries.                        |
| Thread → Boards → Threads            | All boards is behind the sidebar or drawer. At tablet and desktop widths the retained Reader competes with the unrelated directory; a Threads pane toggle does not select retained Board results from the directory. |
| Direct Thread → Threads              | A direct entry has a qualified parent link but no loaded Board list. Exposing Threads must not turn that link into a speculative request.                                                                            |
| Scrolled desktop hierarchy           | The destination rows scroll with the hierarchy. The fixed footer does not offer a named route to Main destinations; opening or dismissing that control must not move the Board sidebar, Threads, or Reader.          |
| 959/960, cutout and reduced viewport | There is no focus handoff between narrow primary navigation and a desktop destinations control, or layout reserve for a phone destination bar alongside the live reply composer.                                     |

The pre-agreed seam is the built production userscript in isolated Edge with only HTTP responses replaced. The test injects the built bytes into the routed document and rejects every request except explicit GETs for the document, Board hierarchy, one Thread, the search form and the unsent reply form. No installed browser profile, Chrome, live forum, or publication is used.

## Replay and evidence

With the locked dependencies and pinned Node 24.22.0 / npm 11.21.1, run:

```sh
npm run build
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- tests/e2e/persistent-destinations.spec.ts
npm run evidence:verify -- evidence/runs/<reported-run-directory>
```

The matching original build from `2ebdbb5` had SHA-256 `b5cfe9a97c9c8a405b916416ee1fee352bdc3c97df5e4e37c91c57331cc32178`. Before production changes, `2026-11-28T18-44-38.976Z-msedge-oePWBC` observed five missing-control reds after reaching the fixture Thread or deep desktop hierarchy. The separate `2026-11-28T18-45-20.137Z-msedge-aofmab` run used the already existing All boards action and observed the unrelated Reader still visible in the desktop directory. These are real product reds; the earlier sandbox launch and script-loading failures do not count. To replay an original run, build `2ebdbb5` and use that receipt's `synthetic/persistent-destinations.spec.ts` in `tests/e2e/`; use `--grep NAV127.directory-canvas` for the second receipt.

Green cases check the measured 390, 768, 959, 960 and 1440 CSS px views; touch, keyboard focus, active labels, explicit section entry, actual Back/Forward, no Board prefetch, and composer reachability after scale-one visual-viewport reduction. The exact HTTP ledger, visible surfaces, focus, screenshots and accessible-name snapshots are attached to the run. The portrait VisualViewport fallback regression now checks that the destination bar owns the bottom inset once and that the Send control ends above it. The production package's existing Vite configuration warning is unrelated.

## Trade-offs

- Keep the legacy pane switches and the one Board tree alongside the new destinations. This adds a fixed desktop header affordance and some visual redundancy, but preserves independent pane controls and keeps shortcuts usable after hierarchy scrolling. Keep the existing 768 px split until the user explicitly selects Threads below 960 px.
- Put the narrow bar in normal layout flow and assign it the safe bottom inset. This reduces space for browsing and writing, but needs no overlay or second inset reserve and uses the existing visual-viewport owner.
- Hide retained reading while the directory owns the main canvas rather than discarding it. An explicit return to writing temporarily replaces the directory; readers who want side-by-side reference must leave that canvas.
- Reuse account-compatible Board results from current history, never guess a Board or request a missing list. Returning from another destination creates a normal Back/Forward entry when a Board is retained; when it is not, people must deliberately choose one.
- Keep secondary destinations one activation deeper. Account presents existing passive identity evidence and never polls for authority. Settings reuses the one existing dialog, returning to the current breakpoint's opener instead of stacking modal focus traps.
- Use fail-closed HTTP fixtures and isolated Edge rather than installed or live verification. This makes the request and geometry evidence replayable but does not qualify Tampermonkey, Chrome, a physical keyboard/IME, or screen-reader speech; #134 owns the later browser and installed qualification. The cached lockfile install initially used an engine override before the pinned tools were found; the product red and green builds and browser replays use the pinned tools.
