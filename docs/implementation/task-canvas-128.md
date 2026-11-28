# Give Search and personal destinations the main canvas — #128

## Failure inventory before changing the UI

- From an open Thread, Search, Saved, Notices, Drafts and Messages may inherit its Reader; the chosen task must take the canvas at desktop and narrow widths. A Saved Board is a related result, not permission to show the old Thread.
- Re-entering Messages from a Private conversation can leave that conversation active instead of showing a passive entry or retained Peer list. A list must never choose the first Peer for the member. Qualified private history must still restore the exact Peer, message and focus without reading again.
- Exact Search, Saved and Notice links and Forum draft resume must keep their offered target/action. A return must focus the applicable selected result or Peer and must not replay a read, refresh, search or draft action.
- Leaving a Thread with a scrolled Board list, a separately scrolled Reader and a parked addressed reply must not conflate their positions or change source, target, options or attachment intent. Returning across reflow qualifies the existing anchor fallback, not pixel identity across widths.
- The built userscript, actual browser history and real workspace are the only test seam. Allow only exact forum requests for each deliberate operation, record method, URL, body and disposition, and retain geometry, accessibility and focus observations. Existing Notice-list offset/category deviations are excluded.

## Replay

From the ticket worktree, use the locked dependencies with Node 24.22.0 and npm
11.21.1. On the qualification machine the pinned toolchain, offline install and
Edge replay are:

```sh
export PATH=/Users/benson/Documents/code/tsdm-ui/evidence/runs/38-edge-20261101/toolchain/node_modules/.bin:$PATH
npm ci --offline --no-audit --no-fund --logs-dir="$PWD/.npm-logs"
npm run build
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- \
  tests/e2e/task-canvas.spec.ts tests/e2e/destination-states.spec.ts \
  tests/e2e/navigation-history.spec.ts tests/e2e/private-history.spec.ts \
  tests/e2e/search.spec.ts tests/e2e/favorites.spec.ts tests/e2e/drafts.spec.ts \
  tests/e2e/notices.spec.ts tests/e2e/persistent-destinations.spec.ts \
  --grep 'CANVAS128|#123|J122\.(history|drawer)|J124\.combined|J76\.(private-open|private-context-return|private-direct-reload|private-browse-list|private-writing-guard|private-drawer|private-locales)|J3\.(search-integrated-(origin|legacy-section|reader-refresh|section|narrow-new|depart|appearance)|search-expiry)|J9\.saved-(board|thread)-target|NAV127' \
  --timeout=20000
npm run evidence:verify -- evidence/runs/<run-directory>
```

Launch Edge outside the shell sandbox on this machine; its sandboxed launch
aborts. The browser contexts themselves are offline and the new cases fail
closed at the forum HTTP boundary. For just the nine strict ticket cases, run
the same Edge command with only `tests/e2e/task-canvas.spec.ts` and `--timeout=20000`.
The allowlist opens exact method/URL/body slots immediately before the intended
control activation. Every extra or unmatched request is refused, recorded and
fails the case. Separate fixture checks qualify pending and refused loads,
localized Search and Private controls, and the established #127/#124 journeys.

## Evidence ledger

All run IDs below are UTC and are under `evidence/runs/` in the isolated ticket
worktree. `receipt.json` identifies the candidate, exact runtime and source
manifest. The per-case attachment arrays identify the exact HTTP ledger,
screenshots, accessibility snapshots, and visible pane, scroll, anchor and
focus observations.

| Run                                      | Evidence                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `2026-11-28T18-58-08.514Z-msedge-3qIZIk` | Before UI edits on `e8cfa2a`: Search, Saved, Notices and Drafts showed unrelated reading; Messages and opened Saved detail lacked visible Back, Messages re-entry left the old Peer open, and Draft resume left the old Reader visible. Eleven prior-art cases passed. The Search result fixture in this run did not qualify and is not a product red. |
| `2026-11-28T19-00-00.351Z-msedge-oJJWTS` | Before UI edits on the same built baseline: Search reached its exact result Post after the permitted preflight and submission, then failed on missing Back. Both pre-edit receipts use userscript SHA-256 `08a5292c0369ec174a232e8099271bf3c37ed2f4c13dd99362dcca045edfc573`.                                                                          |
| `2026-11-28T19-04-12.346Z-msedge-XjecWe` | Before the related-list refinement, an exact link from the selected Search Post opened a different Thread but still displayed the previous Search results beside it.                                                                                                                                                                                   |
| `2026-11-28T19-05-06.220Z-msedge-JmYlSI` | 48 green Edge cases, including nine strict ticket journeys; userscript SHA-256 `e4a5b3a5cf57f352eadf81ca3b5df57078f2d6b36b1250084b8cedd4f0e02eed`. The built bytes are identified independently of the uncommitted source revision in this receipt.                                                                                                    |

Strict evidence covers main-canvas entry at 390, 768, 959, 960 and 1440 CSS px;
exact Search and Notice Posts, Saved Thread and Board, and Forum draft resume;
passive Messages, two deliberate Peer reads, retained list re-entry and an
explicit refresh. Browser Back and Forward and the labelled Back return restore
the applicable selected row/Peer and Post focus with no request replay. The
Search journey also restores the independently scrolled Board row and Reader
Post across 1440→1160 reflow, and resumes its addressed reply with original
source, target, unchecked Signature and named local attachment intent without
uploading. The deliberate Search rerun is also exercised in `J3.search-expiry`.
Synthetic responses do not demonstrate actual forum or installed-manager
behavior. Chrome, installed profiles, physical IME and screen-reader speech
were not exercised. Notice-list offset/category deviations remain unchanged;
the private-compose dock is #133.

## Trade-offs

- Qualify Reader activation from the exact task entry, not a retained pointer from another task. This gives the destination the canvas and avoids unrelated reconstruction; cross-task reference reading now requires leaving the task. Existing Board browsing companions still work.
- Keep related public lists alongside a desktop Reader only with a qualified selection; same-Thread navigation can carry that selection, while a different linked Thread or narrow detail gets the canvas alone. This gives up simultaneous results in narrow detail but preserves the original task and its return path.
- Reuse only the current conversation's same-member retained Peer list for Messages re-entry. Entry can therefore require a deliberate Load after unrelated navigation or reload; this avoids taking a list from another context, guessing a Peer, or adding private-history storage.
- Use one labelled Back in existing header chrome and the browser's actual stack. It takes header space and steps through intermediate passive and loaded entries instead of skipping history or adding another path store.
- Prefer the qualified selection for result focus and prevent stale resize work from resetting a newly restored Board row. Keep the existing thread/row anchor and reflow fallback, not raw-pixel guarantees; active writing retains its existing focus guard.
- Hide unrelated active writing using the existing workspace action, not a new writing state. This takes an explicit Return to writing to resume, while preserving the exact context and existing replacement, save, Review and attachment guards.
- Keep the read-only Search form fetch on entry and the established initiating controls and HTTP operations. This preserves current forum-defined criteria and disclosures at the cost of a form round trip; history still does not submit, rerun or repeat a list or read-affecting action.
- Add the stricter ordered ledger beside the older focused regression fixtures rather than rewrite all of them. Exact fixture order/body checks cost maintenance but expose extra requests and make the nine new journeys repeatable without a live or installed run.
