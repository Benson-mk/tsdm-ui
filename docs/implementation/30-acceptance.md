# Favorites — development acceptance audit

Current isolated continuation and acceptance evidence are tracked in [30-continuation.md](30-continuation.md). The candidate identities and observations below are historical and remain bound to their original source.

Issue #30 remains open. The implementation is ready for completed-work review and root-coordinated affected installed/live qualification; it is not yet approved for a ticket commit.

The complete-app tests drive the actual userscript, Vue layout, workspace, public forum client and browser host with only external HTTP substituted. The public consumer installs the built package outside this checkout. No unit-test layer, live forum mutation, browser installation, publication, issue edit or commit was performed by this worker.

## Exact criteria

| Ticket criterion                                                                                                             | Verified development observations                                                                                                                                                                           | Remaining gate                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Separate Boards/Threads lists, explicit add/remove, target opening/return, shared attempt/account/check behavior             | Both kinds, returned paging, responsive Saved, missing target, populated board and thread target, focused Back return, explicit review, duplicate refusal                                                   | Same affected installed workflow in Chrome and Edge; current native add/removal form and list semantics |
| Separate favorite record, target and kind; named present/absent; no target deletion                                          | Independent fixture records and request ledger verify `942` versus target `42`, `805` versus board `5`, GET add and favorite-record POST removal; already-present/absent are named                          | Authorized actual presence/absence readback for both kinds; no inferred live pass                       |
| Distinguishable unavailable targets, permitted removal, preserved failed-target record and real remaining pages              | Native unavailable explanation, removal without target URL, failed target return, actual last-page fallback, unrecognized/failed pagers remain incomplete                                                   | Current deployed unavailable/pager observations and exact installed navigation evidence                 |
| Independent both-kind state, duplicate activation, uncertainty/manual resend, account races and pager failures with receipts | Lost/pending recovery, no replay/check-only, warned new attempt with original unknown, original actor display, unknown-account clearing, quota acknowledgment gate, public tamper/reuse/fresh-client checks | Installed storage/session behavior and separately authorized native write/readback                      |

All four exact criteria remain `[ ]` at this audit because required installed/live observations are outstanding. Tests establish the narrower development observations above.

## Review and trade-offs

Root owns completed Standards/Spec/BDFL review using the designated `validate-gpt-code-review` advisor. No premature review was requested. All 12 distinct actual trade-offs and the bounded live proposal are recorded once in `30-favorites.md`. This acceptance audit adds no distinct technical trade-off.

## Final candidate and evidence

- Userscript: **942284 bytes**, SHA-256 `6a5966a0fe705e5151365789bf38b25da695aafe7046efa8c3016509f63fc19f`.
- Portable library JavaScript: SHA-256 `725d85c0fe5ae397cba3d49e3c0fe412ce5a52becbc0946a9a06e42c9b7bcb40`.
- Complete application regression: `evidence/runs/2026-10-21T17-54-25.223Z`, **403/403 passed**, no retries.
- Affected workflows: `evidence/runs/2026-10-21T17-53-25.158Z`, **22/22 passed** (21 favorite cases and the inherited section overview).
- Clean external Node consumer: `evidence/runs/consumer-2026-10-21T17-54-26.543Z`, five favorite contract cases plus inherited publication/reading/search/notices/download contracts passed.
- Node 24.22.0, npm 11.21.1, Playwright 1.64.1, primary synthetic browser Chrome. This does not identify a manager installation or installed source.
- Typecheck, lint, format check, library declaration/package build and `git diff --check` passed. Full/affected/consumer package manifests were verified for exact file coverage, safe paths, byte sizes and hashes.
- Visual inspection checked the authored 390px removal workflow and wide selected-thread reader artifacts. Both retain operative controls and readable target/context panes; original actor/record remain visible in attempt history.

The final format check changed only Boolean-predicate indentation in `src/forum-client/favorites.ts`. A fresh build emitted **all 21 files byte-identically**, including the userscript, portable JS and every declaration/package file. `30-format-equivalence.json` records both source hashes and the complete emitted manifest. The tests remain attributed to their captured original source inputs; byte equality connects the formatted source build to exactly the tested executable artifacts. Unchanged E2Es were not repeated solely for whitespace.

Integration `implement/issue-15-next` remained at the task base; the final merge check reported Already up to date. The work is intentionally uncommitted pending the required installed/live acceptance and root-owned completed-work review.
