# Favorites — accepted feature candidate

Issue [#30](https://github.com/Benson-mk/tsdm-ui/issues/30), part of [#15](https://github.com/Benson-mk/tsdm-ui/issues/15), completed feature verification on 2026-10-24 (Asia/Hong_Kong). This report supersedes the pending gates in the historical [development audit](30-acceptance.md) and [continuation](30-continuation.md); it does not change their original candidate attribution.

Saved provides separate populated board/thread lists, explicit favorite confirmation and removal, target opening and Back return. The portable client distinguishes record, target and kind, independently verifies membership, retains original uncertain attempts and prevents stale preparations from acquiring resend authority. The client contract is version 0.10.0; application display version remains 0.4.0. No application release or package publication is part of this ticket.

## Acceptance criteria

- [x] Separate Boards/Threads lists, explicit add/remove, target opening and return, and shared attempt/account/result-check behavior. Complete-app cases cover both kinds and responsive navigation; the corrected manager-installed candidate completed both-kind lifecycle in Edge and Chrome with controlled HTTP and with current authorized native favorites. Each live cycle opened the target and returned to Saved before removal.
- [x] Independent favorite record, target and kind; named already-present/absent outcomes; favorite removal cannot delete the target. Deterministic request/effect ledgers cover named idempotent outcomes and record-specific removal. Four native cycles produced distinct new favorite records, removed only those records and restored exact original native lists. Both target resources remained readable afterward.
- [x] Distinguishable missing/deleted/inaccessible targets, permitted removal, failed-target record preservation and actual remaining-page reconciliation. Named complete-app cases cover unavailable native explanation, absent target URL, failed reader return, final-page fallback and malformed/failed pagination. Current live lists and removal forms agree with the supported record/target semantics; they offer neither unavailable entries nor extra pages. No live unavailable-target or multi-page example is claimed or artificially created. Installed opening/Back behavior passed in both browsers.
- [x] Independent both-kind presence/absence and E2E receipts for duplicate activation, uncertainty/manual resend, session races and pagination failures. Controlled complete-app cases and clean public-consumer scenarios verify these failures, including stale concurrent preparations. Installed duplicate/recovery/check cases in both browsers retain one effect, original actor and token-free uncertainty across reload. Four authorized native cycles independently read absent → present → absent from fresh native lists.

The BDFL advisor independently validated all four criteria against the normative ticket and ADR0002, including the boundary between deterministic variants, current native semantics and installed host checks. No required feature criterion is waived. Stable-manager, Windows, full frozen-release baseline and actual replacement qualification remain separate release work.

## Exact candidate and verification

| Artifact                        |     Bytes | SHA-256                                                            |
| ------------------------------- | --------: | ------------------------------------------------------------------ |
| Corrected userscript            | 1,652,241 | `6b987014b7d773616590c5532eb52f3517775b8d541bb89fb8724668639add9c` |
| Public client 0.10.0 JavaScript |   342,821 | `67ee1dc877973ced48d783fed8146f78c2af1ec018c1d30eab04c4ff011ca9d9` |

- Before the operation-local review correction: 758/758 complete-app Edge E2Es, zero retries, run `2026-10-24T06-27-34.380Z`. This belongs to the preceding userscript hash recorded in the continuation.
- Corrected candidate: 21/21 affected complete-app E2Es, zero retries, run `2026-10-24T06-46-00.789Z`; clean packed consumer with inherited cases and ten favorite cases, run `consumer-2026-10-24T06-45-47.300Z`; typecheck/build/lint/format/whitespace and evidence integrity passed.
- Four public-consumer race expectations failed before production correction. Completed Spec review found that defect, Standards review found no actionable issues in the corrected tree, and BDFL independently verified the correction. No after-code unit-test layer was introduced.
- Corrected installed Edge/Chrome source matches the frozen candidate in both official manager readback and executing runtime. Four controlled lifecycle and two uncertainty/recovery receipts pass their repeatable verifiers. Preferences and interception were restored.
- Current native Edge/Chrome verification completed exactly the authorized four cycles. Original favorites were preserved; test tabs were closed. The bounded native authorization is consumed and does not authorize any further writes, cleanup, uploads, spending or publication.

An initial installed Edge recovery harness expected the wrong accessible label and failed; its receipt is preserved, and the corrected fresh run passed. The initial live Edge lookup guessed an unsupported record-specific button label and timed out before mutation; the visible actual target-scoped control was then used. A final read-only board-heading capture used an unsupported role option and was corrected to its observed exact name. These are harness failures, not counted as successful assertions or additional native attempts.

## Evidence and repeatability

The local retained evidence index is `evidence/runs/issue-30-completion-retained/README.md`, with `manifest.json` and `verify-retained.py`. It preserves exact corrected outputs, development receipts, controlled installed receipts, scripts and review reports. Replay complete-app and clean consumer checks from the accepted ticket tree using the declared Node 24.22.0/npm 11.21.1 toolchain and commands in the continuation. Installed procedure documentation explains manager source equality and controlled HTTP scope.

Raw native member screenshots/list captures remain private outside the repository at the local audit location referenced by the retained index. The authored native summary records outcomes without account/target/record identifiers or raw captures. Public evidence is not a raw authenticated dump; live checks require an operator's own authorized resources. This is development acceptance on the observed macOS Chrome/Edge and BETA Tampermonkey setup, not release qualification.

## Actual trade-offs

The complete ledger is reported once across [30-favorites.md](30-favorites.md) items 1–12 and [30-continuation.md](30-continuation.md) items 13–15. Those choices remain in force; rejected alternatives are not counted as implemented decisions.

16. Reuse the established synthetic HTTP documents across ordinary and installed tests to reduce fixture divergence. The tests therefore share fixture assumptions; separate current-native observations and authorized native presence/absence checks validate live semantics independently.
17. Run the complete failure matrix in primary Edge and repeat affected installed-host workflows in Edge and Chrome under the accepted cadence. This bounds repeated work and native effects, while leaving full cross-platform and stable-release qualification to the release tickets.

Integration preserves the broader root working-tree overlay while accepting only this ticket's isolated tree, as already recorded in choice 13. Consequently, root working-tree files may differ from accepted HEAD; verification applies to the isolated candidate and retained artifacts. The branch/index transition uses an exclusive index lock, expected-old-ref check and before/after identity checks. It has a small interruption window between ref and index updates, covered by saved old/new index bytes and explicit recovery evidence; it is not claimed to be one atomic Git transaction.
