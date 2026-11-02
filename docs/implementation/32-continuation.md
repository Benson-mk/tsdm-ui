# Direct red-packet publication: sequential integration continuation

This candidate starts exactly at accepted integration `9a96e9468056982eb5096ee760505c0aed1f254d` (#30). Only #32 is active; its sole blocker #22 is closed. This report supplements the original failure inventory and trade-offs in `32-hongbao.md`. That original note's October 22 runs remain attributed to the old candidate, not the current candidate.

## Scoped provenance

The fourteen-path original delta and its SHA-256 before/after manifest reconstruct all fourteen original before states exactly by reverse application. A three-way transplant then applies those feature changes to the accepted #30 baseline. Conflicts preserve the newer shared mention validator, ordinary source/reply behavior, upload field validation, draft deletion protection, and favorite uncertainty repair. No #33 funded draft, #34 client overhaul, #35 replacement or #36 release tooling was copied. Packet creation explicitly disables ordinary Save draft; funded drafts remain a separate ticket.

The new worktree shares the integration checkout's installed dependencies through an untracked `node_modules` symlink. The link is excluded from the scoped change. No root overlay file was edited. No new unit tests were added.

## Failure-first and current verification

The original feature's named failure inventory and red/green receipts remain in the original note. Before production transplantation, its `J7.packet-current-controls` E2E fails against the accepted base because New red packet is absent. The new public 0.11.0 expectation also fails against the exported 0.10.0 base. These two fresh red receipts used the host Node 26 runtime inadvertently; all current green candidate checks use the pinned Node 24.22.0/npm 11.21.1 runtime. This difference is retained rather than relabelled.

The first transplanted packet run, `2026-10-24T07-23-47.192Z`, has 22 passes and one harness failure. The older pending-edit case assumes the Complete source textarea stays visible after publication begins. The current accepted editor has switched to its Visual editor tab; the failure screenshot retains the complete source and pending operation. The test now explicitly selects Source editor before changing the later revision. No product change was made for this failure. Its original failure receipt is retained.

Final packet run `2026-10-24T07-24-58.831Z`: 23/23 pass, no retries. Includes all eight native settings/limits, actual minimum-per-share validation, separate source/packet/credit results, missing/wrong-target status, ledger attribution unknown, lost-response/recovery/check-result, warned manual resend retaining both attempts, current-account/limit changes, pending duplicate activation/newer writing, content-only edits, nondefault hidden routing, localized UI and malformed recovery. Evidence integrity verified all 74 files.

Clean public packed consumer `consumer-2026-10-24T07-25-39.520Z` passes all inherited checks including the favorite uncertainty repair cases. Packed metadata and exported contract now both identify 0.11.0; the accepted base exported 0.10.0 while packaging and its old metadata assertion still identified 0.9.0. The additive direct-packet types and optional prepareNewThread parameter are documented in the packed readme. Evidence integrity verified all 3 files.

The 5 selected ordinary publication regression checks also pass (`2026-10-24T07-24-15.977Z`). Current typecheck, build, ESLint, formatting and diff whitespace checks pass. The final full shared-writing baseline `2026-10-24T07-25-19.748Z` passes **781/781**, zero retries. It includes all current ordinary source/editor, attachment, draft, reply, favorite, navigation, search, appearance and recovery cases alongside all 23 packet cases. No executable source changed between the final targeted checks and this full baseline. Exact evidence integrity passes for the full package.

Pre-review emitted userscript: 1,677,031 bytes, SHA-256 `6607714344a3ced2e938e3c2454a7c81bdf3aa4331d6979e3b671fcd585fbea4`. Public client JS: 352,077 bytes, SHA-256 `314d380f89bdf96bf59e055f3a57c1fbd0f575d69b2fd9327dca464a1481aa04`. Application version remains 0.4.0.

## Completed-review correction: historical saved-edit confirmation

Spec review and the BDFL advisor confirmed a P2 defect in the newly reachable Check result path for confirmed packet edits. A later failed thread read or different stored revision cleared an already verified save and exposed an uncertain-attempt resend. The shared edit verifier now follows the publication verifier: when the original attempt is confirmed and has a result, an inconclusive recheck preserves its identity, submitted revision and stored verification, and explicitly says previous confirmation is retained while current readback was not verified. Never-confirmed and moderation cases retain their existing behavior. Packet and ledger observations continue independently; no public API or schema was added.

Failure modes were enumerated before the repair. Two new complete-application E2Es first failed against the pre-review build (`2026-10-24T07-38-20.537Z`), then passed against the correction (`2026-10-24T07-39-02.905Z`). They retain the original result/link/revision after a failed thread read and after later server-source changes, preserve newer local writing, deny the spurious resend affordance, independently refresh packet/ledger information, then retain content confirmation when packet/ledger become unavailable. Each checks one actual save effect and no further writes, with screenshots and acknowledged recovery plus independent server receipts.

The repaired affected run `2026-10-24T07-39-24.433Z` passes **162/162**, zero retries: all 25 packet cases, ordinary edit cases and attachment-authoring regressions, including uncertainty, moderation, conflict and association readback. Its 357-file evidence package verifies exactly. The two-case green package verifies all 28 files. The supplied public reproducer now retains confirmed/result with one write.

The first corrected consumer run exposed an inherited assertion expecting a confirmed edit to become uncertain after a later attachment-description change. That failed receipt is retained. The existing scenario was aligned with the repaired historical-confirmation contract and now asserts preserved result/publication plus the explicit current-difference explanation. Final packed consumer `consumer-2026-10-24T07-41-42.922Z` passes, with its three-file evidence integrity verified. No new unit-test layer or after-code unit test was added. Typecheck, build, lint, formatting and whitespace checks pass. Only that consumer expectation and this evidence note changed after the 162-case application run; executable bytes and application cases remained unchanged.

The original **781-case full baseline remains bound to the pre-review build** above. The local shared result-check correction warranted packet/edit/attachment regressions; it does not relabel that old baseline or require another unrelated full run.

Corrected userscript: **1,677,237 bytes**, SHA-256 `bd8e8e2d1ad1d2a86efd94c2b7118def7e22ffee5426207a44e0c19e3c9c25be`. Corrected public client JS: **352,253 bytes**, SHA-256 `94cee7a1dfae9032090832a708654101623e05fb7297b80cd49c1e2e77f83b8f`. The uncommitted contract remains 0.11.0. Installed acceptance must use these corrected bytes.

## Remaining acceptance gates

Development-only synthetic evidence does not establish native spending or installed manager acceptance. Root owns current native observations, the separately authorized bounded direct publication and independent thread/packet/credit readbacks, installed Edge/Chrome qualification on the exact candidate, and completed Standards/Spec/BDFL reviews. No native mutation, credit spend, install, tracker mutation, commit or publication was performed by this worker. The ticket is not claimed accepted.

## Additional distinct trade-offs

10. Reconstruct and merge the pinned feature delta into accepted #30 rather than replacing shared files wholesale. This preserves accepted authoring/attachment/favorite corrections but requires explicit conflict resolution and a broad current baseline.
11. Advance the additive public contract to 0.11.0 and align packaging with exports. This restores one exact identity for the new consumable contract and requires consumers to repin; it does not change the separately versioned application.

12. Preserve historical verified edit confirmation while reporting a later readback as inconclusive or changed, and continue refreshing packet/ledger observations independently. This avoids false save uncertainty and spurious resend affordances, at the cost that the confirmed link represents a historical result rather than proof of the current server revision. Explicit freshness messaging and fresh-save conflict checks carry that distinction.

The original nine trade-offs remain recorded once in `32-hongbao.md`; no one-way product or architecture decision required early advisor consultation. The selector/runtime corrections are disclosed verification events, not new product trade-offs.
