# Favorites — implementation and verification

Issue [#30](https://github.com/Benson-mk/tsdm-ui/issues/30), part of #15. Work begins at integration `4cadc771e8c246bf5d487cb8cc09bc33c762ec99`. This record describes a synthetic development candidate; it does not claim installed or live acceptance.

## Failure inventory recorded before feature code

- `J9.saved-navigation`: preserve Board/Thread kind, favorite record versus target identity, returned pages, target opening and useful Back context. Malformed/missing lists are not empty. Foreign or unsupported pagers are not complete coverage. Failed target loads never remove favorites.
- `J9.favorite-attempts`: duplicate activation, stale/altered preparation, account changes before/during send, lost response, misleading callbacks and incomplete readback cannot create duplicate sends or false confirmation. Checking is not resending. A checked inconclusive attempt permits only a warned deliberate new attempt; the old uncertainty remains visible.
- `J9.favorite-reconciliation`: independently observe presence/absence for both kinds. One empty page does not establish category absence. Last-item removal uses actual remaining-page links; failed page reads retain context. Already-present/absent are named. Removal identifies the favorite record, never a board/thread delete action.
- Recovery must persist pending identity before a send, restore uncertainty without replay and retain no form tokens. Current unknown/different account observations invalidate private saved-list snapshots.
- Global language, medium/narrow controls, selected favorite focus and unavailable-target explanations remain usable. Complete-app expectations precede each correction; no unit-test layer was added.

The spec's confirmed boundary is the real maintained layout → workspace → public forum client → browser host, replacing only external HTTP. E2Es inspect visible outcomes and independently maintained synthetic server state/effect counts. The clean external Node package additionally checks altered preparations, replay refusal, token-free serialization, independent presence and recovered checks without browser globals. Its failure inventory was recorded before its acceptance fixture.

## Delivered behavior

Saved explicitly loads separate thread/board lists and preserves returned pagination. Each record carries its own ID, target ID, kind, offered target URL, time, note and native removal availability. Unavailable native targets remain removable when offered; their native explanation is rendered as inert text. Reader failures preserve the record and return context.

`prepareFavorite`, `changeFavorite` and `checkFavoriteResult` use the existing forum client's account generation and transport. Private current controls never enter public commands or recovery. Add preparation reads the current target and does not activate its possibly effectful favorite GET. Explicit confirmation rechecks current account/list/target and then follows the offered native add control. Removal reads the native confirmation form and submits only a supported current same-origin favorite-record action and successful controls. No board/thread delete endpoint exists in this workflow.

An HTTP response or callback does not confirm success. A fresh traversal of actual returned favorite pages establishes the desired record/target state independently. Incomplete, changed-account or failed traversal remains uncertain. The original attempt survives checks and warned manual resend. Recovered pending attempts become uncertain without another request. Known confirmation remains a separate fact when a later check fails.

## Provenance and interpretation

The adjacent `30-source-provenance.json` pins inspected native-client and experiment source bytes. No source implementation was copied wholesale. The production parser adapts the evidenced favorite record/target shape, native add control and delete form meanings; it does not inherit the experiment's artificial unpaged restriction or raw callback execution. Current private native board HTTP and thread/list DOM observations agree with the observed control/list shape. They are not write authorization, submitted-result evidence or installed qualification. Raw authenticated captures and tokens remain outside the repository.

## Actual trade-offs

1. Preserve current native add href semantics, including an effectful GET, instead of assuming a harmless add-dialog request. Preparation can be read-only and the effect remains explicit, but unsupported current native controls stop the workflow and require qualification.
2. Prefer one page-JSON request and consume its returned HTML directly. Native mutation routes retain their offered form/control representation. This avoids representation retries and duplicate effects while retaining separate parsing paths.
3. Verify membership by traversing the actual returned page graph, with a 100-page inspection bound. This costs extra reads and latency; exceeding the bound or losing a page stays uncertain instead of asserting absence. Ordinary browsing itself has no 100-page limit.
4. Revalidate current list/account plus target/form immediately before sending, sharing client account generations. This reduces stale actions but cannot provide atomic isolation from an ambient cookie change or rollback of an already-sent request.
5. Keep private prepared native controls in memory and store only serializable intent/attempt/result metadata in the existing tab recovery record. Reload requires fresh preparation/checking, but never persists form tokens or silently replays a pending action. Optional schema-2 attempt data keeps old supported records readable. A failed pending-snapshot acknowledgment blocks a new effect, trading immediate action availability for recoverable attempt identity.
6. Use operation-specific favorite command APIs with the existing account/transport/result-check conventions rather than introducing a generic command framework during parallel ticket delivery. The public intent stays narrow, at the cost of small operation-specific orchestration analogous to thread publication.
7. Confirm independently observed desired presence/absence even when the submit response is unusable; do not claim that the request alone caused that state. This preserves truthful recovery and named already-present/absent outcomes without inventing a transactional server receipt.
8. Reconcile visited Saved entries using fresh returned pages; if the old page disappeared, use the first actually observed remaining page. This preserves kind and useful context without inventing total-page arithmetic, at the cost of resetting the vanished page's exact position.
9. Retain native unavailable-target explanations as inert text and keep record identity separately. No target URL is invented when none is offered; opening that target waits for a supported link while permitted record removal remains available.
10. Keep favorite translations in one feature helper, using the shared explanation fallback. This isolates the new vocabulary from concurrently edited layout text but adds a small presentation module.
11. Retain attempt readback pages with the original attempt as well as reconcile navigation snapshots. This costs tab-record space, but prevents later display failure from rewriting the historical confirmation. These are point-in-time observations, not a coherent server transaction across multiple pages.

12. Use a neighboring Saved list for a wide/medium thread reader, inline kind actions when the sidebar is hidden, and one visible target pane at narrow widths. Board targets use the existing board pane while Back restores Saved. This preserves useful return context while sacrificing simultaneous list visibility where there is insufficient room. The action history has bounded on-screen height and scrolls rather than consuming the whole reader.

## Acceptance status and bounded live proposal

All exact ticket criteria remain unchecked until root-owned affected installed/live qualification completes. Synthetic passes alone do not close them.

- [ ] Separate populated Boards/Threads lists, explicit add/remove, opening/return and shared operation guarantees: implemented and exercised synthetically; both installed browsers remain required.
- [ ] Independent favorite record/target/kind and named already-present/absent outcomes: synthetic independent server records verify no target deletion; actual native add/delete/readback remain required.
- [ ] Missing/deleted/inaccessible targets, preserved failed-target record and actual last-page reconciliation: deterministic variants cover these states; current deployed cases and installed return must be qualified at their available scope.
- [ ] Both-kind independent presence/absence plus duplicate, uncertainty/resend, session and pager failures: complete-app and portable consumer evidence exist; installed effects and current native authoritative readback remain required.

Root can propose a concrete bounded live run after source review: identify one already-readable board and one already-readable thread for the current member; read before-state favorite lists in both browser sessions; explicitly authorize at most one add and one removal per kind per selected session, never a target deletion. Existing favorites must not be removed merely to make room without explicit approval. Verify exact record/target/kind and presence/absence via fresh native lists independent of submit response. Record original state and only perform separately authorized restoration. Each installed browser must run the same exact hashed candidate; deterministic uncertain/session/pager cases may use the installed controlled network boundary. No credit spending, new forum content, or application publication is included. Complete current remove-form behavior and real pager availability are live evidence gates, not presumed facts.

## Verification chronology

Named application failures preceded their changes: initial Saved browsing (`2026-10-21T17-19-14.296Z`), explicit mutations (`2026-10-21T17-23-58.516Z`), recovery/resend (`2026-10-21T17-27-24.924Z`), saved-board target (`2026-10-21T17-30-04.623Z`), Chinese controls (`2026-10-21T17-33-00.614Z`), unavailable reason and pager (`2026-10-21T17-40-03.751Z`), unknown account (`2026-10-21T17-41-23.972Z`), small-width kinds (`2026-10-21T17-48-07.069Z`) in-viewport thread reading (`2026-10-21T17-48-32.781Z`), and visible original attempt actor (`2026-10-21T17-51-22.310Z`), and pending-recovery quota (`2026-10-21T17-52-31.121Z`). The first language and unknown-account harness attempts used an incorrect existing accessible label; corrected red runs above establish the actual feature failures. The first medium-width responsive harness tried an unavailable section picker before entering Saved; its narrow-width sibling established the actual hidden-kind-control failure. The corrected medium run uses the existing destination rail.

The first complete regression (`2026-10-21T17-44-52.698Z`) passed 398/399 and exposed an established empty-Saved overview heading omission; that heading was restored. Failed and intermediate candidates retain their own receipts and cannot qualify the final candidate. Final source/build identities and successful runs are recorded in the accompanying acceptance audit after the frozen candidate passes.
