# #123 — Visit workspace destinations without replaying forum actions

## Scope and replay

This ticket covers the production Main destinations in the built userscript, not the navigation prototype. The supported test seam is the visible workspace, browser Back/Forward and routed HTTP. The Playwright project selects Edge (`msedge`) and starts its usual fixture contexts offline; cases exercising a real synthetic 302 use the existing local-only proxy. Production forum operation contracts, privacy limits, write authority and polling policy are unchanged.

```sh
npm run typecheck
npm run lint
npm run build
npm run test:e2e -- tests/e2e/{destination-states,drafts,favorites,messages,notices,private-history,search}.spec.ts
npm run evidence:verify -- <run-directory>
```

The reporter records userscript SHA-256, source identity, outcome, fixture copies, synthesized request ledgers and screenshots. The initial Search disclosure, list-state and Forward-refusal checks failed before their respective changes; the exact Search Post already passed before the Search presentation change. No Chrome run, installed userscript-manager qualification, or live forum action is evidence for this ticket.

The seven-suite replay before integration passed 248 of 254 cases. The six failures also reproduce against unchanged #120 (`17ee4d4`) at the same assertions: `J6.pending-refresh` (pending-save recovery copy), `J10.notices-native-default-pager`, `J10.notices-target-delayed-image` and `J10.notices-return-remount` (36-pixel Notice list offset), `J10.notices-responsive-categories` (two matching category links), and `J3.search-integrated-appearance-zh-TW` (enlarged form width). The scoped acceptance checks verify the exact selected Notice item and Post, not pixel-identical Notice list scroll. These pre-existing deviations remain outside this change.

| Requirement                                                                                                      | Observable evidence                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search is deliberate, reports a single generic warning next to submission and keeps distinct native restrictions | `J3.search-overview`, `J3.search-submit`, `J3.search-pages-return` and Search refusal cases; one form GET, no edit POST, a single explicit POST before exact Post navigation, no additional request on Back/Forward/reload                                          |
| Four list destinations distinguish passive entry, pending, explicit empty, populated and refused outcomes        | `destination-states.spec.ts`, populated `J9.saved-navigation`, and the exact draft/private/Notice cases; each empty-to-refused fixture records 0 list reads at entry, 1 on load, 1 in the empty state, 2 after explicit refresh, and still 2 after Back and Forward |
| Read consequences and exact private message/Notice Post return                                                   | `J75.messages-passive-entry`, `J76.private-open`, `#123 Notices`; one explicit inbox/notice-list read and one requested private-history/Post read respectively, with no restoration read; absent unread evidence is not zero                                        |
| Resume exact Forum draft and return without writing                                                              | `#123 Drafts: resume the exact saved source`; 1 deliberate list request plus the existing 3 resume GETs (fresh list for ownership, Thread, edit form); exact title, complete source and retained selected row, with zero saves, publications or return requests     |

## Trade-offs

- Own presentation and in-document failure restoration in the workspace, not the portable forum client. This preserves native classification, account checks and historical request counts; other hosts receive no new status controls.
- Keep the existing results and neutral Saved cards rather than redesigning lists. The pane labels a previous result as such when a new read is pending or refused; empty explanations and native diagnostics still supply the concrete detail instead of a second generic empty message.
- Offer refresh on the actual Saved/draft page and keep existing deliberate Saved kind loads, inbox/list refreshes, Search form refresh and explicit effective-criteria rerun. This removes the ambiguous generic control on passive lists, at the cost of an additional named Saved action once a page is loaded; Back returns to the earlier observation rather than treating refresh as an overwrite.
- Reuse a recognized generic native Search warning at the submit button, otherwise use the workspace warning. Exact recognition favors keeping every unfamiliar, possibly distinct restriction instead of guessing that it is generic. Such a restriction can resemble the generic wording if the forum changes it.
- Associate existing effects text with the particular request controls instead of adding a confirmation dialog or repeating the same copy at every row. The action remains a deliberate single activation; descriptions do not establish speech output or change read-state semantics.
- Restore list failures through Back/Forward only in the current document; discard diagnostics on conflicting account observation rather than serializing private errors or carrying them across reload. Active requests and private inbox/history bodies do not gain a new recovery promise, and restoring an entry does not retry a request.
- Verify the built userscript through synthetic fixtures, not isolated components, live effects or Chrome. This demonstrates request deltas and accessible control descriptions in Edge while deferring installed behavior, native page changes and cross-browser qualification.
