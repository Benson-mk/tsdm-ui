# Keep Board and Reader controls in reach — #129

## Failure inventory before changing the UI

- The Board heading and New thread, Filter and Pinned scroll away with the results. Board Refresh is in overflow instead of grouped with the browse controls; the separate Check for new threads operation is not equivalent to Refresh.
- Reader Page is persistent but Refresh requires Thread overflow and qualified Latest requires Page details. An unqualified page total dominates the compact button as `/ unknown`; the detail must still explain the absence of a verified total.
- Pinning chrome could mask focused rows, change the qualified Board restoration anchor, or take too much room at narrow widths. The title, exact Latest and metadata must stay independently named, visible, focusable and actionable rather than become one row action.
- Existing controls are effect boundaries: opening or cancelling Page, Filter or an overflow, expanding pins/metadata, or revisiting cached history cannot issue reads or navigate. Confirming Page or Filter and activating Refresh must preserve the exact qualified requests. Latest must not escape an author filter, reread a loaded exact Post, or target a guessed Post.
- Direct Thread entry must keep the qualified parent Board link and writing fallback without a speculative Board load. Native continuation must retain the current exact target. Moving controls must not reintroduce unrelated content into the #127–128 task canvas.

The agreed seam is the built production userscript in Edge, with only forum
HTTP substituted. Real controls, scroll, focus, history and layout are observed
through the browser. No isolated components, installed profiles or live effects
are needed for this ticket.

## Replay

From the ticket worktree, install the locked dependencies and build the
production userscript before launching Edge. The browser needs shell
escalation on this machine; the normal browser fixtures stay offline with
explicit HTTP substitutions, and the real-redirect fixtures use a loopback
proxy that cannot forward to the live forum.

```sh
export PATH=/Users/benson/Documents/code/tsdm-ui/evidence/runs/38-edge-20261101/toolchain/node_modules/.bin:$PATH
npm ci --offline --no-audit --no-fund --logs-dir="$PWD/.npm-logs"
npm run build
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- tests/e2e/board-reader-controls.spec.ts --timeout=20000
npm run evidence:verify -- evidence/runs/<run-directory>
```

The strict fixture permits one exact method, URL, body and navigation type per
deliberate operation. Everything else is refused, recorded and fails the case,
including operations that get no response. Geometry records include control
bounds, hit tests, scroll positions, focused nodes, focus outlines and the
actual Latest Post and native continuation target. Accessible names and
screenshots are attached. For the adjacent regression run:

```sh
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- \
  tests/e2e/{board-reader-controls,compact-board-controls,d-browsing-journey,latest-reply,navigation-history,new-thread,writing-presentation,thread-tools,page-picker,task-canvas,persistent-destinations,board-checks,favorites,integrated-journey,navigation,post-permalink,rating,reading-memory,report,thread-checks,thread-history,thread-refresh,ui-ux}.spec.ts \
  --grep 'CONTROLS129|D[1-9]|B[23]\.|J122\.|J124\.|NAV121\.(board-writing|direct-parent-actions)|UI85\.|UI86\.|UX100\.|CANVAS128|NAV127|UI90\.(stage-reveal|filtered-distant)|J9\.favorite-attempt-forum|UI93\.recovery-error|J2\.(rich-page-target|refresh-stale|canonical-lastpost:|nonfinal-lastpost)|UX104\.legacy:|UX10[23]\.unavailable|UX103\.legacy-snapshot|IM70\.(local-ranges|direct-priority|explicit-page-back|explicit-range-history)|UI89\.growing-target|IM68\.latest|IM71\.(refresh-range|returned-later)|UX\.thread-pages' \
  --grep-invert 'UI85\.character-fallback' --timeout=20000
```

## Evidence ledger

Run IDs are UTC. `receipt.json` in each run records the source and userscript
hashes and measured Edge version. Source can be dirty in a receipt because the
candidate is qualified before commit; its per-file manifest and built hash
identify the bytes independently of the baseline revision.

- **Pre-edit red:** `evidence/runs/2026-11-28T19-11-15.049Z-msedge-R2Yk5F`.
  Built `070f305` userscript SHA-256
  `e4a5b3a5cf57f352eadf81ca3b5df57078f2d6b36b1250084b8cedd4f0e02eed`.
  The Board controls scrolled out of reach at 390 and 1440, both Readers lacked
  header Refresh, and the direct Reader displayed `Page 1 / unknown`. Both
  independent row-action checks passed before UI edits. Replay the red with
  the archived `synthetic/board-reader-controls.spec.ts` from this receipt and
  the built `070f305` userscript.
- **Existing deviations:** `UI85.character-fallback-changed-text` and
  `UI85.character-fallback-missing-post` failed both on this change and at
  the unchanged `070f305` runtime. The separate baseline receipt is
  `evidence/runs/baseline-070f305/evidence/runs/2026-11-28T19-16-22.084Z-msedge-yLlX8i`;
  the candidate comparison is
  `evidence/runs/2026-11-28T19-14-21.307Z-msedge-yPxqaO`. The former case
  loses the end Post's copied text on reload; the latter chooses `pid101`
  instead of `pid999` after refresh. Neither fallback is changed by #129.
- **Final Edge:** `evidence/runs/2026-11-28T19-19-47.640Z-msedge-of8juF`.
  All seven strict ticket journeys and 133 adjacent cases passed on the
  production userscript, SHA-256
  `e2f8bdc70cdbcdb3aaf35613a4f16d96d2494cd7950ee3317fa91ba33ac724d4`.
  The one optional `UX104.legacy` replacement case skipped because it requires
  the separate pre-#104 userscript. It is not a #129 acceptance criterion.

Chrome, installed Tampermonkey, live forum effects, physical IME and
screen-reader speech were not tested.

## Trade-offs

- Keep the original Board scroll owner and pin its header inside it. The chrome
  consumes vertical space and requires measured scroll padding and a
  header-relative visible row boundary, but needs no new pane, route, recovery
  schema or raw-pixel guarantee across reflow.
- Shorten the Board identity visually to a single line with the full heading
  still available as its accessible text and title. This protects the labelled
  actions at narrow widths at the cost of showing less of a long name at a glance.
- Give New thread the sole filled Board treatment and group Filter, Pinned and
  existing current-Board Refresh. Save board and New red packet take an extra
  activation rather than competing for header space; the distinct Check for
  new threads operation remains with Board context and its existing reveal
  behavior, not a substitute for Refresh.
- Keep Pinned as a local disclosure, not a jump to the pins. From deep in the
  Board a member can toggle pins without leaving their position, but may need
  to scroll up to see the affected rows.
- Keep the direct-entry parent link and writing fallback in the existing Reader
  breadcrumb and Boards rail/drawer. The fallback may require opening the
  drawer, but never requests Board results or creates new Board capabilities.
- Put one qualified Latest link and one Refresh control in Reader chrome and
  leave low-frequency actions in overflow. The control group may wrap; Latest
  no longer has a duplicate in Page details, which still offer the returned
  page choices and deliberate range loads.
- Show a known source-backed total on Page, but disclose an unknown total in
  the accessible description and in the picker rather than the visible button.
  A sighted member must open Page to learn why the total is absent.
- Keep the three existing Thread-row targets and their compact presentation
  instead of redesigning the rows to match the header. Check actual focus and
  activation at the application seam, including the exact Post and native URL.
- Keep a strict ordered HTTP ledger for ticket journeys and reuse broader
  regressions at their existing fixture seams. This costs fixture maintenance
  but exposes extra effects without relying on live data; browser/host
  qualification beyond Edge is deferred to #134.

These are reversible presentation and test changes. No new client API,
stored-data format, navigation contract or effect authority needed an advisor
decision.
