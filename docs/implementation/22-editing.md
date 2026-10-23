# Owned-post editing — issue 22

Issue: [#22](https://github.com/Benson-mk/tsdm-ui/issues/22), part of [#15](https://github.com/Benson-mk/tsdm-ui/issues/15). This document describes the accepted implementation, pre-code failures and actual trade-offs. The completed evidence map is in [22-acceptance.md](22-acceptance.md); installed and native observations retain their distinct candidate identities in [22-installed/report.md](22-installed/report.md).

## Failure inventory written before implementation

The approved E2E seam is layout → workspace → forum client → browser host, replacing only external HTTP. Reachable failures: wrong actor/post; guest/session changes; missing or ambiguous source; unsupported required controls; unknown BBCode rewritten; disabled price/read permission lost; attachment references/metadata dropped; server changes before review or send; reload discarding local text without protection; obsolete confirmation erasing later edits; rejected/moderated/lost response treated as confirmed; duplicate resend; restored form tokens; malformed recovery targets; rendered content substituted for source.

Initial named expectations: `J4.edit-preservation`, `J5.edit-conflict`, `J5.edit-reload`, `J11.edit-capability`, `J5.edit-newer-revision`, `J4.edit-uncertainty`. Later vertical slices cover ownership, attachment metadata, title-less replies, preflight/session races, manual reconciliation and native attachment layout. No unit-test layer was added.

The first baseline fixture lacked a document body, so its missing-entrypoint failure was not valid feature evidence. That diagnostic was retained. The corrected fixture was replayed against an independently built export of integration commit `4cadc771e8c246bf5d487cb8cc09bc33c762ec99`; the mounted application lacks Edit post, as expected. A preliminary external-artifact override run has a receipt pointing at the current worktree build and is diagnostic only. The canonical corrected baseline runs from the exported original tree with its own accurate userscript/input manifest. These histories are kept separate rather than relabelled as valid red evidence.

## Delivered offline behavior

Owned posts offer Edit post. Preparation independently checks the selected post's author and loads the complete native edit form; rendered post content never replaces source. Title-less reply forms keep the existing thread title. Source, current options, disabled/effective price and read permission, attachment references and exposed preservation metadata are retained in one account-bound writing context.

The client compares fresh source/options/attachment metadata with a complete baseline at review and immediately before dispatch. A detected change exposes the latest server version beside retained local source. Reload requires explicit discard confirmation. Manual reconciliation retains local title/source and explicitly adopts latest options/attachment metadata before further editing. Save my version requires an overwrite warning and another fresh review; incompatible current disabled settings or missing required controls still block sending.

Edits use the existing revision, pending-attempt recovery, account generation and uncertain-result behavior. Tokens remain private to fresh client requests, never in recovery. There is no forum-draft action for published-post edits. Independent readback verifies actor, post identity, complete source, options and unaffected reference metadata. An older successful revision advances the next baseline without replacing newer local text. Explicit moderation remains pending even if owner-only source matches: the pre-existing public post does not prove the edited revision was released.

## Repeatable verification

Use the declared Node 24.22.0 / npm 11.21.1 runtime and locked dependencies:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e -- tests/e2e/edit-post.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/writing.spec.ts
npm run test:consumer
```

Each E2E run writes `evidence/runs/<run>/receipt.json`, `report.md`, a hash manifest, exact fixture sources, screenshots and independently recorded synthetic server-state/request effects. The existing clean consumer runner packages and imports the built public library outside this repository. No live forum mutation occurs in these tests.

The initial historical implementation passed 148 affected cases and then 14 editing cases after presentation changes. Those original receipts remain historical. The corrected isolated final candidate passed 231 affected cases (33 editing, 64 reply, 134 publication/writing), zero retries, at `2026-10-23T02-58-28.911Z`. The final clean 0.6.0 public consumer passed at `consumer-2026-10-23T02-58-38.786Z`. Typecheck, lint, formatting, build and diff checks passed. Subsequent documentation finalization does not change executable bytes.

All four ticket criteria are verified in [22-acceptance.md](22-acceptance.md). Both installed browsers exercised the affected controlled workflow and current native form/mention lookup/review with zero forum edit POSTs. Separately audited real native edits establish sampled source/options/reference preservation and URL-encoded transport on their own historical candidate. Completed Standards/Spec/BDFL review and final correction validation cleared the three confirmed findings. This is feature acceptance, not the full stable/Windows release matrix.

## Provenance and capability limits

Current native opening-post edit HTTP was observed read-only on 2026-10-22 Asia/Hong_Kong. The form uses `action=edit`, hidden `fid`/`tid`/`pid`/`page`, `editsubmit`, `delattachop`, and multipart encoding. The earlier rendered DOM serialization omitted hidden value attributes and is not the source contract. A private captured-response replay through the built public client successfully prepared both editable source and current save review with zero POSTs. Raw authenticated captures/tokens remain private; none were copied into fixtures or this repository. That initial read-only replay proved interpretation only. The subsequently audited actual attachment-bearing native edits and corrected-candidate installed checks supply the separate acceptance evidence, with their own runtime/candidate attribution in the installed report.

Semantic references were inspected, not copied wholesale:

- `tsdm-ui-experiment` commit `c8348e6c4c4aaf0011f174394733be3d580f59e5`, `src/integration/live-edit-contract.js` and `live-attachments-preservation.js`: native action/target controls and dormant attachment fields outside `postform`.
- `tsdm_client` commit `365f7fabde2e98821f55fa1910a055ac19b964bb`, `lib/features/post/repository/post_edit_repository.dart`: existing edit transport and title/category differences for replies.

Existing attachment preservation recognizes controls within the current form or the native `e_attachlist`/`e_imgattachlist` containers. Only unchanged `attachupdate` markers and description/read-permission/price fields are supported. Unknown, duplicate, differently associated, replacement or deletion controls block preparation. Upload, new association, replacement and deletion remain owned by their separate tickets.

## Actual trade-offs

1. Store a complete exposed source/options/reference baseline in browser page-session recovery. This costs additional synchronous storage and conservatively detects representation/order changes, while making observed server changes inspectable without an automatic merge or atomic-lock promise.
2. Reuse the existing attempt/revision/session machinery and successful-control serializer, with narrow edit dispatch and separate edit modules. This avoids a second writing state machine but adds optional edit metadata and public methods that require coordinated package versioning and sibling-ticket integration.
3. Perform fresh ownership and source reads during review, preflight and result verification. The extra requests reduce stale authority and false confirmation; they cannot prevent a server/account race after the last check.
4. Keep exact source and persistent metadata comparison, allowing only the already-qualified inherited blank-price-to-zero normalization. Other differences remain uncertain rather than accepting a lossy edit as success.
5. Manual reconciliation deliberately adopts all latest options and attachment metadata while retaining local title/source. This provides a usable path when disabled effective settings change, at the cost of the user reapplying desired editable option changes after inspecting the disclosed reset.
6. Limit attachment serialization to recognized preservation controls and containers, including current external dormant controls. This preserves existing references without granting upload/replacement/deletion authority, but unfamiliar layouts or controls require a capability failure and further qualification.
7. Reuse the host's URL-encoded textual form transport although the observed native edit form declares multipart encoding. Captured historical actual edits and independent native readbacks qualify the sampled textual source/reference preservation. Unknown attachment shapes still require separate qualification; synthetic success alone is not representation equivalence.
8. Preserve an explicit moderation outcome until release is independently established. A matching owner edit form and existing public post are insufficient, so the UI may remain pending after a moderator acts until a suitable authoritative signal is available.
9. Keep title absence explicit for reply edits instead of substituting the thread heading. This adds one optional availability field while avoiding invented title writes and hiding an unavailable editing control.
10. Retain the completed writing context and immutable attempts rather than clearing source on success. This preserves later edits and recovery evidence, while requiring explicit user replacement when starting another action.

11. Advance the independently packaged forum client to 0.6.0 for the widened action/result unions and added methods, while retaining application 0.4.0. This imposes explicit consumer migration without a misleading application release claim.
12. Reconstruct and commit the isolated accepted ticket tree on the accepted #21 baseline while preserving unrelated work as an unstaged root overlay. This retains proven reply behavior and avoids erasing pending draft/upload/editor/hongbao work, but the dirty root build may differ from the accepted installed artifact; exact candidate identities and shared integration regressions remain necessary.

13. Expose the existing pure baseline snapshot helper through the portable public entry so workspace and external consumers share one contract. This adds a small API/declaration maintenance obligation and ships its closed declaration dependency graph.

14. Reuse the previously authorized sequential native attachment fixture and its immutable successful edit/readback receipts, while rechecking current native forms read-only and exercising changed behavior on both installed browsers. This avoids redundant remote writes/public clutter but gives up independently created native fixtures and a fresh live edit on the corrected candidate; separate candidate identities and full current compatibility checks bound that evidence reuse.
15. Let the controlled delayed-response fixture update its fake server before releasing the response. This makes submitted-versus-later-local revision behavior deterministic, while it cannot model an atomic remote edit or prove network/server timing guarantees.

## Integration failure inventory before corrections (2026-10-23)

The accepted reply implementation also treats a board with no reply target as the same writing action. With owned edits now present, that can mistake an active edit for a request to start a new thread in the same board. `J5.edit-to-new-thread-guard` must preserve the edit and offer explicit replacement. The retained `J4.edit-native-attachment-layout` regression also reloads its writing context before review, exposing account-generation adoption during the first owned source read. These whole-application expectations precede the corresponding integration corrections. Historical code and red runs remain retained independently.

The public-consumer failure inventory additionally covers stale package versions/missing edit declarations, source/reference loss, missed conflicts, incorrect confirmation and duplicate original attempts. Its 0.6.0 expectation failed against the retained 0.5.0 artifact before the contract bump. The new [migration record](22-public-contract.md) explains the expanded action/result unions and four edit methods.

Before finalization, inspecting the qualified native contract exposed a reachable failure: the whitelisted `delattachop` could carry an active deletion choice. The whole-application `J11.edit-deletion-control` expectation requires review to refuse, retain local complete source and send zero POSTs; it precedes the narrow serializer guard. The earlier native reference explicitly requires `delattachop=0`. Companion `J11.edit-hidden-target-*` checks confirm the existing decoder already refuses mismatched or duplicate hidden destinations at loading. Their first expectations incorrectly awaited a loaded editor and are diagnostic only; no redundant target guard was added.

## Completed-review correction failures (before code)

BDFL validated three findings after the full implementation review. The existing approved whole-application seam will cover `J4.edit-attachment-select-{implicit,explicit-empty}`: an accepted attachment restriction select must post its actual option text when the value attribute is absent and preserve a deliberately empty attribute; the independently mutable synthetic server must reflect the POST, not hold the old restriction fixed. `J4.edit-mention-*` and `J11.edit-mention-*` cover actual selected edit-form lookup with new-thread capability unavailable, retained complete old source, selected identity drift/capability loss before review and dispatch, account changes during lookup, and server source changes during revalidation. A server conversion of a newly inserted edit marker has no qualified native edit evidence; the complete-source result must remain uncertain while retaining submitted and observed source. No broader normalization is planned. A clean public consumer must import the existing baseline helper and compile its shipped declarations; a missing export/declaration must fail before the export correction. No unit layer or new live write is authorized.

Completed review corrections share selected-person revalidation between publication and edits, use the actual edit form for lookup, and repeat fresh owned-source observation after review lookup. Preflight validates people before the final source read. Existing stored person URLs and literal at-text remain unchanged; an unqualified new-marker conversion remains uncertain under the existing exact-source rule. Attachment serialization now uses the same absent-versus-explicit-value interpretation as preparation. These are conformance repairs; their request/preservation costs are already covered by trade-offs 3, 4 and 6.
