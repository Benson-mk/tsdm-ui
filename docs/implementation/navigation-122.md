# #122 — Restore the exact Post and Board position

| Acceptance                                                                                                                                                                        | Built-userscript Edge checks                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Filtered Board, current Thread, independent Board and Threads scroll, contextual Back, same- and cross-Board history, exact nonterminal Post and reflow                           | `J122.history`, `IM65.browse`                                              |
| Back and Forward with the Boards drawer open at 900 CSS px, exact focused Posts and no forum read                                                                                 | `J122.drawer`                                                              |
| Delayed refresh leaves the drawer usable, preserves focus and position, distinguishes pending/failure/recovery, only retries deliberately, and cannot supersede a newer selection | `J122.refresh*`, `IM71.*`                                                  |
| Qualified exact Latest in the existing Thread tools, distinct row actions, no redundant history/read when loaded, and no Board list preload on direct Post entry                  | `J122.latest*`, `IM68.latest`, `D7.combined-journey`, `J120.direct-parent` |

## Replay

Use the lockfile dependencies and Microsoft Edge. This run executes the built
production userscript as a fixture script in an offline Playwright context;
routes reject unrecognized fixture operations. It does not qualify real forum
behavior, a Tampermonkey installation, Chrome, or physical device interaction.

```sh
npm run build
npm run test:e2e -- tests/e2e/{navigation-history,three-region,thread-history,navigation,d-browsing-journey,destination-states,drafts,notices,search,private-history,messages,favorites,progressive-drawers,thread-checks,thread-refresh}.spec.ts \
  --grep 'J122\.|IM65.browse|IM68.latest|J120.direct-parent|D7.combined-journey|IM66\.(drawer|progressive)|UI89\.(status-geometry-100-en|stale-check|unqualified)|IM71\.(refresh-range|current-position|stale-navigation|cached-cooldown|new-later-page)|#123 |J3.search-(pages-return|submit|overview)|J75.messages-passive-entry|J76.private-open|J9.saved-navigation'
npm run evidence:verify -- evidence/runs/navigation-122/green
```

The retained evidence under `evidence/runs/navigation-122/` includes receipts,
SHA-256 manifests, authored journeys, screenshots, measured geometry/focus
and exact application read URLs. The primary red run used `17ee4d4`; the isolated
`latest-loaded-end` red run later isolated an additional redundant unfiltered
read, `refresh-unpaged` isolated the missing pane status when pagination
was unavailable, and `latest-retained` confirmed that the Reader Latest
would reread a loaded Post and replace the current Board with a Thread
history stop. To replay the original red, build `17ee4d4` and copy
`red/synthetic/navigation-history.spec.ts` to `tests/e2e/navigation-history.spec.ts`,
then run that spec and `three-region.spec.ts` with `--grep 'J122\.|IM65.browse'`.
The original delayed Thread refresh already passed and was retained as a
regression gate, not credited as a newly fixed failure. The inherited
`IM65.browse` reload drift measured 36.296875 CSS px before correction.

## Trade-offs

- Dismiss the drawer only through the existing actual browser-history restoration hook, without asking normal modal dismissal to return focus to its opener. A background check doesn't get a new modal policy, history entry, or focus move. The browser's opaque history addresses and normal Escape behavior stay intact.
- Keep extra live viewport data keyed to existing entry/position objects. Board navigation and Threads list positions don't displace Reader position or require new storage fields; extra navigation and character data is unavailable after a full document reload. Existing page-session markers still restore the saved Post/offset.
- Keep the Threads list's raw position at unchanged width, and use its retained visible row when the list reflows. Restoration remains subject to browser scroll bounds; the absence of a retained row uses the established numeric position.
- Preserve exact Post coordinates on a same-layout history return, even when restored chrome changes the top of the pane; only rebase the viewport if the Post would otherwise be outside it. On width changes, prefer the saved visible glyph and its coordinate subject to clamping; if its content no longer matches, fall back to the saved Post. Background reads retain their separate status-reflow rules.
- Use the forum's matching-scope exact Last link where offered and verified unfiltered terminal pagination plus ordered floors where available. When an unfiltered Last link only resolves after a read, retain the existing deliberate resolver; don't redirect an unqualified author-filtered Last link outside its reading scope. Qualified but unloaded targets still need a read.
- Replace the current history entry when the exact Post is already held on its matching source page; this preserves the reading range, prevents duplicate reads, and doesn't offer another Back stop for that in-entry jump. Thread title, row latest-Post link and metadata disclosure remain separate controls.
- For a loaded Post reached from Latest in a retained Reader, move just the Reader. The current Board address, list position and original Thread history entry stay distinct. Only the Reader tools use this narrower intent; an explicit Board row selection still opens a Thread history entry. Closing Page options via Latest gives focus to the Post instead of returning it to the toolbar; other dismissals keep normal focus return.
- Keep the existing refresh cooldown, committed-content and quiet-observation workflows rather than auto-retrying or adding a second status owner. Explicit unpaged Thread refresh uses that same owner, without granting unknown pagination a newest check or automatic reads. The tests use synthetic network delay and browser time control; they don't measure native forum latency.
