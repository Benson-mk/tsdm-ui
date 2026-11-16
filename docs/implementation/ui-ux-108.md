# #108 — Share reply drafts across accounts and repair unavailable attachments

## Scope and research

Base: `0cf6b8247c3bd5dc4d6504175ad09dc2eb1af18a`. Ordinary replies already share a per-thread durable lineage, but current actor mismatch requires explicit text copying. Attachlist controls are candidate metadata, not independent ownership proof. Existing operation histories own their original submitted identity. Nonreply workflows retain their current ownership rules.

The owner-approved complete-app seam is the built userscript with mounted workspace/editor/forum client and native browser storage. Only external HTTP/browser-host boundaries are substituted. Chrome is deferred to #112; installed Edge is coordinated by the root agent. No live posting/upload/removal is authorized by synthetic tests.

## Failure inventory recorded before implementation

1. A→B→A with bold/literal unknown/quote source, addressed post and signature option: same editor/source and same stored lineage context ID; current actor shown, fresh review under actor; no explicit text-copy branch needed.
2. Prepared A review then server reports B: review revoked and zero POST until fresh B permission/form preparation. Denied form retains exact text, no effect. Late checks from prior actor do not adopt authority.
3. A server upload under B: named chip unavailable, Send blocked even if maliciously permissive attachlist returns controls. A return with qualifying live form/list restores usable upload without bytes; missing list stays unavailable.
4. Restart selected file: intent/name persists, unavailable byte capability, explicit Reattach/Remove, source untouched. Restart uploaded server row: fresh current actor/list revalidated, no blind trust.
5. Reattach unavailable ID: chosen replacement uploaded under current actor, new server ID replaces all deliberate exact original attachment-tag occurrences; unrelated text/formatting/quote text exact; payload includes only repaired ID fields. Failure/stale account/conflict leaves original intent and source intact; no automatic retry.
6. Remove unavailable ID: explicit source/reference removal, no remote deletion; available server file still requires existing confirmation. Local no-ID row removal leaves text exact.
7. Same-thread two tabs: sharing/account switches cannot replace a conflicting variant, effect remains blocked; deliberate existing conflict resolution required.
8. Storage denial: edited content remains unsaved, no false durable success and no effects crossing checkpoint failure.
9. Immutable prior publication attempt actor and target survive active actor rebinding, reload and history inspection. Active dispatched effects retain original owner until settled; current actor cannot hijack history.
10. Nonreply newthread/edit/draft/private-message behavior stays original account/copy semantics. Consumer check validates optional portable contract addition.

Seam: built userscript + actual mounted UI/workspace/editor/forum-client/native storage; only HTTP and browser-host failures substituted. No internal-module mocks/unit tests. Each case records request ledger + screenshot; evidence reporter preserves exact source/build/runtime hashes and failed red runs. Installed Edge controlled by parent using same HTTP fixture. Chrome deferred to final112 per user.

## Evidence and decisions

- First red: `2026-11-14T11-58-12.609Z`, `UX108.account-roundtrip` reached actor B and failed on the original-account mismatch. Source/option setup succeeded. This remains a failed baseline observation.
- Contract/schema proposal submitted to required BDFL advisor before production changes. Accepted decisions, actual trade-offs and verified acceptance are recorded below.

## Advisor failure-first refinements

Extend the already-recorded inventory before feature code. Use emitted userscript,
actual UI/editor/workspace/client/storage; only external HTTP or browser-host
substitution. Keep per-case request ledger, exact source/storage evidence, screenshots,
candidate/runtime identities/hashes and failed red runs. These are observable
obligations, not new isolated unit tests:

1. A→B→A preserves exact raw bold/unknown/quote/code content, target, signature,
   context ID, editor undo and one lineage. Repeated account/form/availability checks
   in two otherwise clean tabs produce no authored conflict or new competing head.
   A's still-live selected bytes survive a no-op remote read; a fresh document cannot
   use them. Current accessible actor wording is B, then A (or explicitly unverified).
2. Ready A review → observed B/guest/unknown immediately revokes the review; delayed
   A preparation/list/file delivery cannot install B authority. Refused B permissions
   retain source and issue no publication/removal/upload effect. IME actor change
   preserves composing source and never sends. Fresh deliberate B operation submits
   exact captured B content/target; old immutable A attempts/history stay A.
3. A-owned upload under B stays named/unavailable even with deliberately permissive
   qualified B attachlist. A return + exact fresh native form/list can restore usable
   state; missing/mismatched controls, stale actor generation, retarget during check,
   uncertain upload/removal state and unknown/null provenance cannot. A proof does
   not reset authored attachment field values or change durable heads.
4. Reload/restart recovers uploaded intent without assuming current usability;
   selected/reselect intent loses bytes truthfully. Known B upload in stable A
   composition retains owner B through session and IDB. Legacy absent owner is
   inferred only from the pre-sharing original context; null never becomes A or B.
5. Load an old schema5 ordinary snapshot and old row/checkpoint, including a dirty
   stale version and competitor: exact source/histories survive and no parent is
   refreshed from dirty writing. New writes are schema6. Run retained #107 executable
   against schema6 session-only input with B owner/A provenance and absent/refused
   durable data: incompatible raw session stays exact and no owner-stripped row is
   created. A new owner-bearing schema1 row is refused intact by old107; prove no
   rewrite/delete. This bounds downgrade behavior rather than claiming support.
6. Reattach in source and visual visits changes only exact intended ID/tag-name
   spans as specified; include mixed case, whitespace, repeated attach/attachimg,
   quoted/code/protected examples, another ID, plain numbers, malformed/parameterized
   tags, Unicode and CRLF. Assert exact resulting raw source and POST fields, not
   only rendered text. Include different returned reference kind. Fail/stale/conflict
   after upload retains old intent and discloses any already-sent result; no automatic
   retry/delete. Checkpoints never acknowledge half-repaired metadata/source.
7. Unavailable Remove changes only selected row/reference/fields and matching literal
   spans, sends zero remote deletion/publication requests, and no-ID removal preserves
   all text. Available server Remove still needs existing confirmation. Undo cannot
   manufacture availability. Unavailable rows block Send even with no source tag.
8. Conflict/refusal during revalidation, file read, native preflight or final guard
   prevents a new effect; conflict after dispatch retains original owner/callback and
   both versions. Count effectful GET `deleteattach`, multipart upload and publication
   POST separately. Storage refusal remains visible and never reads as saved.
9. B can perform ordinary retarget and qualified mention lookup/insertion through the
   same actor seam; late A mention results cannot insert. Read/check/retry of an older
   A attempt remains original actor/target and never silently resends as B. Keep
   new-thread/edit/private/Forum-draft account/copy behavior, including draft-only
   sameDraftContext/blocksDraft checks, unchanged. Run the affected existing E2Es and
   public consumer check. Installed Edge remains root-owned; Chrome remains #112
   deferred, never marked passed by this report.

## Accepted legacy refinement failure inventory

Record these externally observable cases before this refinement's feature edits:

- Start from the retained #107 executable's actual schema5 session, raw row/version
  and checkpoint. Restore legacy uploaded A intent into schema6, then repeat readonly
  account/list checks and reload in two clean tabs. Raw head version, parent and
  original stored row stay unchanged; source/history stay exact; the new current
  session owner is explicit A. A subsequent real authored change creates one normal
  descendant with explicit A, rather than an upgrade-only competitor.
- Delay another tab while a clean legacy/materialized tab receives a genuine newer
  head. The unchanged tab adopts it automatically under existing clean-parent rules;
  owner stamping alone must not fork. Separately start with dirty stale source under
  the old checkpoint: neither materialization nor normalized comparison may bless
  that source as clean or choose a winner. Both genuinely competing contents survive.
- Schema6 missing current server owner remains incompatible/raw, never inferred;
  explicit null is accepted but unavailable; known B in stable A remains B and cannot
  become A. Check the actual new stored/session metadata and Send/effect outcomes.
  Include original same-owner and nested historical owner/null/cross-owner fields
  whose bytes/observations must remain exact through new writes.
- Compare retained actual checkpoint values and row identities through the complete
  application/real storage to demonstrate old-hash preservation. These are E2E storage
  observations with the emitted application and browser/HTTP substitutions, not
  isolated fingerprint unit tests. Preserve failures and replay evidence as before.

## Accepted implementation and compatibility

The root accepted the required gpt-6.1-sol/xhigh advisor evaluation and its narrow
legacy-owner addendum before the corresponding feature changes. The final advisor
source SHA-256 is `d4205644964ca9f1761411d0491c37deb3632def14df1c34bcc5f553ece402f5`;
root acceptance is retained in `108-root-gate-acceptance.md`. ADR0001/0003 now state
the ordinary-reply exception explicitly. No account-only durable rebinding, new
backend, account-indexed collection, cross-owner transfer inference or checkpoint
migration was introduced. Historical attempts retain their original actor/target.

The portable package is 0.26.0. `checkReplyAttachments` is optional for existing
structural clients; `ownerId` supports known, explicit unknown and genuine legacy
provenance. Native usability is a transient observation, not prepared publication
authority. The clean external consumer checks old structural client compatibility,
optional invocation and known/null/legacy upload shapes with DOM-free declarations.

## Distinct actual trade-offs

These choices include the advisor's additional refinements once each. Inherited
#107 storage-eviction, origin-authority and memory-only-file limitations are not new
decisions and are not counted again here.

1. Stable composition provenance plus transient current-actor capture avoids
   account-only authored heads and false conflicts. Every ordinary actor-sensitive
   action and current-writing presentation must use that seam; historical identity
   remains separate. Read-only retarget accepts the latest source under the same context/actor/generation/conflict constraints so typing can continue during preparation; effectful actions still require their exact captured composition.
2. Session schema6 with unchanged IDB version1/row schema1 keeps the existing
   backend and strict raw validation. Older applications visibly refuse new
   owner-bearing data rather than stripping it; downgrade compatibility is bounded
   by actual record discriminants.
3. Explicit null means unknown owner, while absence is reserved for legacy input.
   This adds a provenance state but prevents present-account inference after
   sharing. Unknown intent stays unavailable until deliberate repair/removal.
4. Usability proofs are transient and require fresh native form/profile/list
   evidence after account, target or document changes. This avoids durable
   availability churn at the cost of additional reads. The proof key contains the
   native usability inputs, not incidental row messages/progress/stored-post
   presentation; uncertain/removal-uncertain states remain separately blocked.
   Deliberate Review awaits an existing in-flight check and performs fresh recovery
   checks when needed, preserving one-click Review with that read latency.
5. Same-owner qualification is conservative: a permissive attachment list from B
   cannot establish ownership of A's upload. The user must return to the known
   owner or deliberately replace/remove the intent instead of receiving an inferred
   account-transfer capability.
6. Legacy explicit-A and implicit-A current top-level intents intentionally share
   fingerprint input. This preserves genuine #107 hashes and old parents without
   rewriting checkpoints, at the cost of a narrowly bounded normalization: a
   fingerprint is not whole stored-object byte identity. Raw validation, null,
   cross-owner and nested historical distinctions remain exact.
7. Repair/removal rewrites every balanced exact literal attach/attachimg span for
   the selected ID, including disclosed quoted and code examples. This is
   deterministic and preserves unrelated bytes, but deliberately changes examples
   that refer to that same ID; it does not infer an author's semantic intent or
   repair malformed/parameterized tags.
8. Local-byte replacement selects bytes without uploading; replacing an existing
   server reference explicitly uploads immediately under the current actor. This
   preserves the existing separate Upload step for local selection while making a
   server-reference repair one disclosed action.
9. A pending replacement is represented by the existing separate upload row.
   Dispatched stale/uncertain outcomes remain attributed to that captured uploader
   alongside original intent, so an extra unresolved row can require deliberate
   handling. No retry or remote deletion is inferred from a failed local adoption.
10. Source/reference/field adoption uses one coherent checkpoint and the existing
    editor session. An exact captured rollback after final acknowledgement refusal
    can restore that operation's intent while conflict blocks new user mutations;
    it never chooses a competing head. An already committed intermediate head is
    not falsely described as transaction rollback. Editor Undo restores source,
    never old upload authority, and unresolved references still block publication.
11. The portable usability operation is optional, preserving structural consumer
    compatibility. A host/client without it cannot establish usable recovered
    intent and therefore exposes conservative unavailable treatment.
12. Installed fixture replay uses reviewed static data phases because the browser
    policy rejected dynamically importing/executing the fixture renderer. This
    preserves actual installed XHR plumbing and fails closed on unknown requests,
    at the cost of explicit phase preparation/selection.
13. The proposed installed storage-namespace helper did not reliably isolate the
    069 journey. That mapping failure is observed; its mechanism remains unresolved,
    and a blanket Tampermonkey-sandbox explanation is not established. Accepted installed
    qualification therefore uses native storage with one known synthetic row42,
    exact original-row hash preservation and guarded removal of only task-owned
    data. An older executable can visibly refuse the newer synthetic row until
    cleanup/reload; no user row is edited. Active test documents must be stopped
    before cleanup because an unloading document can re-save its retained test copy.
    The observed resurrection and corrected cleanup are preserved. The failed helper
    package and corrected baseline-isolation qualification are retained.

14. Regression acceptance combines unchanged9a observations with final96af targeted
    and complete ordinary/shared regression. This avoids repeating hundreds of
    unaffected cases while explicitly bounding reuse by the retained source/dist
    delta; it is not a claim that either interrupted broad run passed.
15. Early build identities were reconstructed from retained exact base, generation
    sequence and receipt hashes using existing pinned dependencies. This recovers
    replayable inputs but does not establish that later source-only snapshots were
    the source of earlier executed binaries; those states remain separate. Final
    production also has an independent fresh dependency installation/rebuild.

## Failed observations and limits retained

Original failed runs remain failed, including baseline account-copy requirements,
missing owner plumbing, unavailable repair controls, stale source/metadata adoption
and legacy compatibility failures. The early source reconstruction package exactly
reproduced all eight pre-freeze executable identities across20 receipts, preserving
3560 files and all1931 test-source identities. Receipts12:18:16 and12:34:09 captured
later unbuilt source alongside earlier executables; both source-only states and
actual executable input archives are separately retained, not called same-source
builds. All subsequent production builds have frozen source archives and binaries.

Later qualified corrections include the confirmed B reply's stale draft badge,
stored-file checking against stable A provenance, exact-intent rollback rejected by
a newly discovered conflict, presentation-only upload changes invalidating usable
proofs, and recovered Review failing to await the current actor/native usability
check. File-read cancellation, unavailable local-byte recovery, stale dispatched
outcomes, native final-write refusal, conflict-before/after dispatch and source undo
have separate full-app cases. Harness corrections include awaiting asynchronous
file selection/account checks, reopening retained writing, using the actual thread
menu and distinguishing mention-search POST from publication/upload effects.

The clean consumer initially caught the unchanged exported0.25 constant; its failed
receipt remains retained. A later Vue typecheck exposed optional-method narrowing
inside the pending-check closure; the final source captures that method and
preserves its client receiver. These failures are not reclassified as passes.

Composition qualification uses browser-dispatched composition events, not a real OS
IME session. Synthetic HTTP acceptance does not prove a live forum publication,
upload/removal or cross-account transfer. No live consequential forum effect was
authorized by these tests. Installed Chrome remains explicitly deferred to #112.

## Verified acceptance at the approved ticket scope

Final emitted/installed candidate SHA-256:
`96af364c643ebc237909a8e0e5ec78d9e9ba8f45020217e230b628aab579b530`
(2,388,888 bytes). Main and independently installed/rebuilt checkout match all 36
`dist` files. The portable package is 0.26.0. Final source, executable, receipts,
fixtures and all historical failed observations are preserved in
`/private/tmp/tsdm-ui-108-delivery`; `manifest.json` covers every delivered file.

| Ticket criterion                                                                 | Verified observation                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x] One shared local reply per thread across accounts                            | `UX108.account-roundtrip`, `publication-actor`, `actual107-upgrade`, updated `UX106.account`; A→B→A preserves source/target/options and lineage. Installed core phase repeats this through the real manager.                                                                                          |
| [x] Revoke stale authority; retain historical identity                           | `authority-*`, `late-*`, `publication-actor`, `repair-stale-*`, `UX106.effect`, pending/history and `UX107.after-dispatch` cases. Fresh actor/form required; original submitted actor/target remains unchanged.                                                                                       |
| [x] Revalidate uploads; expose unavailable intent truthfully                     | `attachment-availability`, `attachment-proof-*`, `upload-owner`, `owner-*`, `lost-local-bytes`, `UX107.file-capability` and process restart. One-click recovery Review awaits current native checks.                                                                                                  |
| [x] Explicit reattach/remove; preserve remote confirmation                       | `reattach-spans`, `repaired-payload`, `remove-intent`, `actor-tools`, `repair-undo`, `repair-adoption-refusal`; installed exact88→89 replacement and removal, available-file confirmation cancelled.                                                                                                  |
| [x] Preserve literal content and truthful storage refusal                        | `raw-crlf-repair`, `composing-actor`, account roundtrip, `repair-storage-refusal` and all existing `UX107.storage-*`/acknowledgement cases.                                                                                                                                                           |
| [x] Verify A→B→A, ownership, file loss, repair payload and authority             | All33 dedicated UX108 full-app cases pass on96af. Installed core/recovery/final-retarget phases qualify corresponding real manager/UI paths.                                                                                                                                                          |
| [x] Preserve competing versions and block unresolved effects                     | Existing UX107 conflicts plus `repair-conflict-before/after`, corrected `UX107.stale-control` assert source/intent remains intact even when a stale DOM control is forcibly enabled.                                                                                                                  |
| [x] Failure-first complete-application testing                                   | Inventory above and preserved negative-case/advisor notes precede corresponding implementation slices. Tests execute emitted userscript, mounted workspace/editor/client and native storage; only external HTTP/browser-host boundaries are substituted. No added unit tests.                         |
| [x] Relevant E2Es, installed checks and verifiable artifacts under current scope | Edge installed acceptance recorded in `installed/tsdm-ui-108-installed-96af/report.md`; all exact runtime/request/screenshot/cleanup evidence retained. Chrome explicitly deferred by user to112, not claimed passed. Two inherited Post101 result-link assertions remain root-approved112 deferrals. |
| [x] Maintain ownership boundaries/nonreply scope and portable compatibility      | Layout presents operations; workspace owns actor/repair lifecycle; client decodes/checks native evidence; host owns durable projection. New-thread/edit/draft/private/history/prepared-review regressions and clean external0.26 consumer pass within the coverage qualifications below.              |

## Regression accounting and fixture reconciliation

`context/108-final-coverage-audit.json` maps769 distinct verified cases of771
selected affected cases to original immutable receipts and exact candidates. This
is a union of observations, not a claim that an interrupted broad run passed.
The selected suites are advanced-editor, attachment-authoring, authoring-integration,
draft-attachments, draft-recovery, edit-post, new-thread, prepared-review,
private-history, private-writing, replies, retained-replies, shared-replies and
writing-entry. The original broad selection was756; final accounting adds15
writing-entry cases. Schema6 wording in one renamed private-writing case is
accounted under its final name.

The broad13:08:27 run remains570 passed/18 failed/1 interrupted/167 not run. Final
bounded changes from9a to96af are preserved as source patch and dist comparison:
optional-method receiver/narrowing correction and read-only retarget accepting
latest typed source while retaining context/actor/generation/conflict guards.
The retarget/recovery/authority paths were rerun, all33 UX108 cases rerun on96af,
and all ordinary/retained cases completed across the final receipts. Passing
unaffected9a observations are reused only within that recorded delta.

Final principal receipts include:

- `2026-11-14T13-14-18.459Z` in the independent checkout:9/9 bounded correction,
  rich recovery, actor/late tools, exactCRLF and source-entry cases.
- `2026-11-14T13-20-33.195Z`:6/6 retarget, authoring preservation/ambiguity,
  pending draft/new-thread recovery and render-failure reconciliations.
- `2026-11-14T13-24-18.874Z`:59 passed,2 failed,1 interrupted,134 not run;
  localized source-entry failures retained.
- `2026-11-14T13-27-44.667Z`:146 passed/3 failed, including all33 UX108 passes;
  old retained-label expectations retained as failures.
- `2026-11-14T13-28-39.506Z`:15/15 writing-entry.
- `2026-11-14T13-30-42.441Z`:2 passed/1 failed (hidden Details selector).
- `2026-11-14T13-31-09.394Z`:1/1 corrected visible destination and persisted
  uncertain original-actor attempt.
- `consumer-2026-11-14T13-08-40.303Z`: clean external portable consumer pass.
  All portable dist files are byte-identical between consumer-tested9a and96af.

Inherited fixtures now choose the actual visible Source mode before filling,
including localized review; visual formatting explicitly visits Visual mode.
Actual107 reproduces the original hidden-source failures and passes the revised
localized/editor8 cases and action/comparison/recovery9 cases. Obsolete recovery
acknowledgement wording is updated without relaxing incompatible-session absence
checks. Private recovery output expects schema6 while legacy inputs remain legacy.
Pending reload accepts either genuinely restored-pending wording or the observed
aborted-request uncertainty, and checks persisted uncertain state. A return button
is used only when writing is not already visible.

The old account-copy test now asserts sharing with immutable A history; removed
server intent now exposes unavailable Reattach/Remove. The stale-control case uses
the unavailable Remove control and checks unchanged source/conflict after forced
DOM enablement. Pending ordinary recovery checks visible unverified-current-actor
wording plus persisted original actor/status. These are changed contract/UI
expectations, not suppressed effect, storage or history assertions. Failed
provisional assertions and sandboxed browser launch failures remain preserved.

The two unresolved inherited assertions are
`review.check-published` and `review.check-moderation`: both expect a Post101 link
that the current UI exposes as a button. Actual107 reproduces both. Root explicitly
retains their reconciliation for112; they are not called passing or fixed here.
No new108 acceptance failure remains at this approved scope.

## Replay and preservation

Use pinned Node24.22.0/npm11.21.1 and Microsoft Edge. Extract `source.tar.gz`, run
`npm ci`, `npm run build`, compare all dist hashes with
`context/108-final-clean-build-proof.json`, then run:

```sh
TSDM_UI_107_BASELINE=/path/to/retained-107/tsdm-ui.user.js \
  npx playwright test tests/e2e/shared-replies.spec.ts \
  tests/e2e/retained-replies.spec.ts tests/e2e/replies.spec.ts
npm run test:consumer
npm run typecheck
npm run lint
npm run format:check
```

The preserved actual107 binary/source is included under early reconstruction;
its exact executable hash is recorded in that package. Tests fail closed for
unknown external HTTP routes. Installed replay uses the retained static phase
fixtures, native file chooser and narrow viewport instructions in the installed
reports. Never forward synthetic effects to live forum services. Stop active test
writers before guarded removal of synthetic row42; preserve the original row hash.

Delivery includes complete final tracked/new source (including tracked evidence
schemas), final executable/library, all main/baseline/independent evidence,
unchanged candidate archives, original logs/scripts, advisor gate and installed
root preservation. Early reconstruction copies only its manifest-listed files,
excluding dependency work directories; its original manifest is retained. All
package manifests are verified without rewriting original outcomes. The final
source archive corrects the earlier candidate helper's broad `evidence` exclusion;
no claim that earlier archives contained those schemas is made.
