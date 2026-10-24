# Direct red-packet publication — issue 32

## Before implementation: failure inventory and test seam

The approved seam is the complete installed-source application from layout through workspace, forum client and browser host, with only external HTTP replaced. Deterministic tests run in Edge and retain screenshots, independent synthetic server request/state receipts and the standard machine/human evidence reports. They do not qualify native spending or installed managers.

Reachable failures to cover incrementally, before the corresponding feature code:

- Missing, duplicate, disabled or unexpected packet fields; an ordinary form returned for a packet request; changed control limits, account, target or settings between review and send; absent cross-field constraints; malformed numeric values and unsupported recipient identities.
- Invalid amount/share minimum, step, maximum, expiry choice, passphrase/greeting lengths and invalid recipient names. Limits are returned form data, not universal research constants.
- Double activation, stale review, edits during preparation or submission, account change, expired login, challenge, permission rejection, unavailable storage and recovered pending attempts.
- Silent/lost response, explicit rejection, moderation, thread-only success, missing packet, malformed/wrong-target status, packet mismatch, failed packet/ledger reads, unrelated ledger rows and opaque funding identity. Thread/source confirmation cannot establish funding or a refund.
- A read-only result check that stays inconclusive; warned deliberate resend preserving the original attempt and possible additional deduction; no automatic replay.
- Existing published-content edit with absent packet-creation controls: preserve source, options and attachments, omit funding fields, do not silently create a packet, top up, refund or reset conditions.
- Expired/withdrawn/done status versus actual observed ledger refund; missing expected refund offers moderator assistance without promising timing or contacting anyone.

First tracer: `J7.packet-current-controls` exposes every returned creation control and its actual constraints without sending a mutation. Subsequent tracer names and red/green evidence are recorded as implemented.

## Provenance and evidence boundaries

Frozen v4 prerequisite source manifest is retained privately as `32-baseline-manifest.json`. The accepted bounded lifecycle is repository object `abbc812ffbe99bfcd4d770b641d51e0f45d21929:docs/research/funded-hongbao-lifecycle.md`. The parent's current read-only native form observation is retained privately as `32-current-native-form-private.json`; no private account values belong in public fixtures.

The pinned experiment `c8348e6c4c4aaf0011f174394733be3d580f59e5` has no packet-creation implementation to reuse. Its discovery map documents only read/claim APIs, so creation semantics come from native form evidence. Existing production parser/source/attempt behavior is reused at its typed seams. Historical research does not authorize spending and is not current application qualification.

Native bounded direct publication and installed qualification remain unverified. No issue closure or commit is claimed.

## Delivered behavior and verification

The shared new-thread flow prepares a red-packet form, renders its eight native settings and numeric/text/choice limits, reviews the intended debit and conditions, resolves exact designated member names through the current advertised identity-search capability, and performs fresh validation immediately before one consequential POST. The ordinary revision, account, recovery, duplicate-activation and explicit-resend guards remain in force. A confirmed packet context cannot silently create another funded thread.

Thread/source confirmation, packet status and credit observations are separate. A bare thread can be confirmed while its packet is absent or unknown. Status flags describe only the returned conditions; they do not establish the exact passphrase, recipient list, total, shares or expiry deadline. The credit view displays current-page native HBS/HBR/HBG rows and keeps attribution unknown because those rows expose no packet/funding identifier. Missing expected refunds offer moderator assistance without promising automatic refund timing. A validation callback is not treated as proof of financial rollback; the original attempt remains uncertain until checked.

An existing packet card marks owned-content editing. Fresh native hidden metadata is preserved without inventing redacted values; creation settings are not added to that edit. Source and attachment verification remain shared with the existing editor. No claim, withdrawal, purchase, top-up, deletion or automatic retry operation was added.

The exact final application-synthetic run is `evidence/runs/2026-10-22T07-30-52.697Z`: **311 passed, zero retries**, including **23 packet scenarios** and affected ordinary publication, editing, replies, writing/recovery, drafts, authoring integration and appearance. Each packet scenario retains an independent network-edge state/effect receipt and screenshot; the run retains authored fixture sources, a machine-readable receipt, human-readable report and SHA-256 manifest. Build, typecheck, ESLint and formatting checks passed. The userscript SHA-256 is `ab9027e5a9720aadfd738cf18996f5fe7f52cd4423a00dcd66729401914fa913`. This is a rebuilt synthetic candidate, not the installed frozen v4 candidate.

Before this documentation update, every file in the run's source manifest and every retained evidence artifact was checked against its recorded hash with no mismatch. Subsequent changes only finalize this implementation note. Historical paths remain in the original evidence; root integration subsequently moved to the primary checkout without changing this feature worktree.

Reproduce with pinned Node 24.22.0/npm 11.21.1, installed exact lockfile dependencies, `npm run build`, then `npm run test:e2e -- tests/e2e/hongbao.spec.ts`. The broader affected run additionally selects `new-thread`, `edit-post`, `replies`, `writing`, `drafts`, `draft-recovery`, `authoring-integration` and `appearance` spec files. Its named tests exercise the real layout → workspace → client → host with only external HTTP substituted.

Red receipts are retained privately under `32-controls-red.log`, `32-publication-red.log`, `32-recovery-red.log`, `32-edit-red-corrected.log`, `32-hardening-red.log`, `32-outcomes-red.log`, `32-refusal-red.log` and `32-routing-red.log`. The first owned-edit run used an incorrect button selector for a link; that setup failure is separate from the corrected genuine red. The resend assertion initially expected the original lost-response message after Check result had correctly replaced it with an inconclusive check message; the final test asserts both the preserved original and new attempt plus two independent commands. Those test corrections did not relabel setup failures as product defects.

## Acceptance boundary

- [x] Synthetic current controls/limits, explicit cost/condition review and fresh-form/attempt guards.
- [x] Synthetic independent thread, packet and bounded ledger observations; thread-only and unknown-credit states.
- [x] Synthetic content editing preserves native hidden metadata without adding funding controls; shared attachment behavior remains intact in affected edit tests.
- [x] Synthetic original-attempt check, warned resend/additional-debit risk, expiry and moderator-assistance explanation.
- [x] Full-setting, partial-failure, changed-account/limits, pending/race, recovery-schema and language fixtures.
- [ ] Separately authorized bounded native direct publication/readback and installed qualification. No live spending or new publication was performed by this implementation worker.
- [ ] Completed-work BDFL review and integration. Root coordinates these against the exact delta; no premature review or acceptance claim is made here.

The native hidden routing literals remain redacted in research observations. The implementation preserves the values returned by each actual fresh form; authored routing strings in synthetic tests establish serialization behavior only. Native packet status exposes no complete saved condition version or immutable funding identity. This implementation intentionally retains those unknowns rather than claiming the synthetic fixture proves them. The issue remains uncommitted and open until its remaining acceptance gates are resolved.

## Actual trade-offs

1. Reuse the shared new-thread/attempt path with an optional packet discriminator. This keeps revision/account/recovery guarantees together and adds conditional handling in shared code rather than another operation store.
2. Interpret demonstrated native packet controls and returned numeric/cross-field hints without executing forum scripts. Unknown controls or an unrecognized minimum explanation refuse preparation, so native markup changes can require an explicit capability update.
3. Reuse the current advertised identity-search capability for exact designated names before review and send. This avoids unresolved recipients but adds read-semantic POST lookups and depends on that capability being available.
4. Show the current returned ledger page and preserve unknown financial attribution. This exposes useful evidence without inventing a packet-to-row join, but does not add complete ledger pagination or automatically confirm a specific debit/refund.
5. Preserve fresh hidden routing values without hardcoding redacted research literals. This retains native metadata while leaving the actual installed contract to bounded live qualification.
6. Refuse another direct publication from a confirmed packet context while retaining deliberately warned resend for unresolved attempts. This reduces accidental repeated funding; an intentionally separate packet requires a separate writing context.
7. Keep requested full settings distinct from observed status flags. Exact secrets, recipients, amounts, shares and deadlines remain unconfirmed where the native status response does not expose them.
8. Treat a packet validation callback as an uncertain compound outcome. This requires result checking even after refusal text, because that text does not establish thread/packet rollback or no debit.
9. Reuse the integration checkout's installed dependencies through an isolated-worktree symlink. This avoided another installation during implementation but the later integration relocation broke that link; historical evidence remains valid, while a future local rerun needs a valid dependency location.

The seven product trade-offs above and the refusal/dependency choices are this worker's complete distinct decision ledger. They supplement the existing frontier ledger without renumbering or repeating its earlier entries. The root's completed-work advisor may add distinct findings after evaluating this result.
