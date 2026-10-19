# Integrated Search installed development evidence

The final repaired candidate passed the installed Search checks in **Edge then Chrome** on 2026-10-19. This deliberately authored summary uses run-local query, result and target aliases. Raw account/member captures, tokens, credit balances, forum identifiers and workstation paths remain private.

Candidate: version **0.3.0**, **764,321 bytes**, SHA-256 `097021995d5ba06a5ded15fac76859e9aba3c7da857079bc73f2be2e04e7b159`. Official local Tampermonkey MCP backed up the preceding source, installed this candidate and read the stored source back completely. Excluding the MCP response metadata footer, both readbacks equal the candidate byte-for-byte. Each manager lists one TSDM Workspace source and each reloaded page exposes one executing workspace ShadowRoot.

Runtime observations identify macOS **15.6.0 arm64**, Edge **155.0.4283.62** / Chromium **155.0.8059.85**, and Chrome **155.0.8059.84**. Selected Tampermonkey BETA **5.6.6242** and Editors **1.0.7** remain user-reported. This qualifies the accepted development scope. Stable-manager/browser, Windows and complete parent-spec release qualification remain later gates.

## Explicit queries and returned pages

| Browser | Run-local query          | Visible outcome                                                                                                          | Complete scoped request observation                                                                                 | Fresh independent credit observation            |
| ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Edge    | author-A                 | Populated native result set, returned identity result-A; no pager offered                                                | One fresh form GET, one deliberate POST, normal 302 followed by its result GET; JSON form and HTML result, no retry | Before and after agree; zero observed debit     |
| Chrome  | title-A                  | Populated title result set with 492 native results, returned identity result-B                                           | One fresh form GET, one deliberate POST, normal 302 followed by its result GET; JSON form and HTML result, no retry | Before and after agree; zero observed debit     |
| Chrome  | title-A, adjacent page 2 | Page 2 loaded from the visible pager beside an open result thread; edited draft-A stayed separate from effective title-A | Exactly one offered-page GET using result-B, HTTP 200 JSON; zero POSTs and no new search                            | Same title-query observation; no observed debit |
| Chrome  | zero-A                   | Native explicit count zero and application “No matching threads.”                                                        | One fresh form GET, one deliberate POST, normal 302 followed by its result GET; JSON form and HTML result, no retry | Before and after agree; zero observed debit     |

The three searches above used the final candidate. Earlier attempts remain attributed to their original artifacts. Across the authorized session, five of six allowed deliberate searches were used, leaving one unused; fresh observations showed zero search-credit debit against the ten-credit cap. A separately authorized earlier nine-credit paid-download fixture purchase was not repeated by these Search checks. The implementation contains no purchase path.

## Exact targets and passive restoration

Edge opened thread-A from author-A, then activated its actual exposed exact-post link. The application performed its prepared manual/fetch redirect and a full document navigation ending at post-A. The complete scoped ledger records five forum GET events including two normal 301 transitions and the post-remount JSON read; the redirected fetch was cancelled as the document handoff proceeded. It records zero Search requests. Independent native navigation timing, the targeted article and retained Search overview agree.

Chrome opened thread-B from result-B page 2 and activated post-B. Native navigation timing establishes a full document navigation ending at that post, with the exact article targeted, page-2 overview retained and zero current-document Search resources. Its initial remount network buffer was truncated, so that buffer is not claimed as a complete request ledger.

Each browser then completed all six passive actions below. Every accepted per-action network ledger is complete and untruncated. “Safe forum GET” means a document request to the safe history destination; it does not contain a Search query, returned search identity or effectful Search endpoint.

| Passive action          | Edge safe forum GETs | Chrome safe forum GETs | Search requests in each browser | Retained state                                                                             |
| ----------------------- | -------------------: | ---------------------: | ------------------------------: | ------------------------------------------------------------------------------------------ |
| Back to reader          |                    1 |                      1 |                               0 | Selected Search result and reader position                                                 |
| Back to results         |                    0 |                      0 |                               0 | Effective criteria, selected result, saved result position; Chrome page 2                  |
| Reload results          |                    1 |                      1 |                               0 | Same result page and effective criteria; direct textbox readback confirms unsubmitted edit |
| Forward to reader       |                    0 |                      0 |                               0 | Adjacent Search overview, selected result and pane positions                               |
| Forward to exact target |                    1 |                      1 |                               0 | Exact post selection and useful reader position                                            |
| Reload exact target     |                    1 |                      1 |                               0 | Exact target and retained Search context                                                   |

The result-pane scroll offsets matched across result reload; reader offsets matched across exact-target reload. Six key screenshots were inspected for selected results, exact-post highlighting, page 2 and explicit zero. These private screenshots support the authored observations; they are not copied into the public package.

## Limits and excluded diagnostics

The initial Edge multi-navigation ledger and Chrome's initial remount/Back-reader ledgers were truncated. They are retained privately as diagnostics. Complete subsequent per-action ledgers establish passive restoration; Chrome's remount uses the separate native timing/DOM/current-document-resource observations stated above.

An extra manual navigation to a previously observed Edge exact-post URL bypassed the application's prepared handoff and started a new Boards-origin arrival. It is not counted as preserved Search context. The application link was subsequently exercised independently and passed. This diagnostic did not submit Search.

An initial diagnostic selector required an explicit input `type=text` attribute, while the application uses the default textbox type. Its empty list is not evidence of lost edits. Accessible snapshots and direct textbox value readbacks establish the edits. Read-only snapshot/wait timeouts during remount and a temporary approval-service error were followed by fresh read-only observations; no query was repeated because of them.

Direct native effectful arrivals, expiry, missing/incompatible snapshots and induced cost/throttle/permission/session/challenge/invalid/network failures are covered by complete-application deterministic cases. They were not induced through additional live effects. The final baseline passes **199/199**, including **61 Search cases**. The public library's 12 files are byte-identical to the artifact qualified by the retained clean external consumer receipt. Final Standards review has no actionable finding; the sole final Spec P2 was corrected failure-first and accepted by both Spec reviewer and BDFL. Final installed BDFL reconciliation independently verified the exact source, all 149 private evidence files, request/target/state/balance observations and all five criteria; no unresolved finding remains.

No new production trade-off arose during installed verification. The ledger remains six Search choices, five download choices and the one optional-provenance integration choice, plus the separate canonical-history orchestration choice. Replay using the [procedure](procedure.md), inspect the [authored receipt](receipt.json), and verify the package manifest before using this report. It does not authorize new spending or publication.
