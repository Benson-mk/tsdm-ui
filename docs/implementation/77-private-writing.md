# #77 — Send and recover recipient-bound private writing safely

## Research and premises before implementation

Base integration: `56d643d57262fcd5e8b152231f463eb4bce4d7aa`. The implement-spec and tdd skills apply at the owner-approved complete-built-application seam: real Vue workspace, sole writing owner, editor, headless client and browser host, with only external HTTP substituted. Routine browser is Edge; Chrome and complete OS CJK qualification remain #79. No further outgoing live authority exists; the coordinator owns installed qualification and any exact-message approval.

The pinned experiment DESIGN.md and sample.html commit `bd64a5f48989cf33a2830768f07581c7fac07a2a` remain controlling, with source-first editing, immutable review/separate approval, Text size/derived Compact and acknowledged browser page-session recovery. ADR0001 keeps private send semantics in the portable client; ADR0003 keeps one serialized owner and visible incompatibility/refusal.

Existing #76 provides qualified one-to-one recipient, sender UID, chronological message IDs, inert complete body nodes and returned page links. Native controlled observations establish `#pmform` POST to `/home.php?mod=spacecp&ac=pm&op=send&pmid=<returned id>&daterange=0&handlekey=pmsend&pmsubmit=yes`, with native AJAX adding `inajax=1`; body contains only message (CRLF), formhash and topmuid. A separate fresh history independently returned the approved exact text/newlines under the current sender and selected recipient. Response callback syntax was not captured and will not be assumed. Toolbar presence does not qualify BBCode, visual editing, attachments, broadcasts or group messages. Authenticated raw captures and tokens remain outside the repository; tests use authored aliases.

## Early irreversible design decision

The BDFL approved an explicit public/private discriminated union under the same `state.context`, snapshot, acknowledgement and replacement owner. Private portable models are separate from public PreparedWriting; no fake board/reply fields or parallel persisted draft store. Private variants reject mixed-domain/token-bearing data, accept old public records unchanged and retain incompatible raw data. The initially considered additive schema2 was superseded by the advisor-approved schema3 decision below: older permissive public validators otherwise could lose historical private attempts after switching the active context back to public. Historical public/draft/private attempts survive deliberate context changes. Recovered pending attempts become uncertain; approvals and form tokens stay transient.

## Reachable failure inventory before feature code

- Wrong sender, recipient, origin, account envelope/header, form action or topmuid; conflicting/multiple controls, disabled fieldsets, missing/duplicate/empty token, unknown consequential controls or form owners.
- Treating public-post options, BBCode/visual formatting, uploaded files or groups as supported private content; silently transforming source/newlines; losing current restriction guidance or field errors.
- Preparing or sending on passive entry/reload, plain Enter, active composition/keyCode229/repeated modifier; final approval implicitly triggered by a shortcut.
- Review mutates after edits; account/generation/context changes during delayed preparation or fresh final form check; approval reused or double activated; forged/stale portable approval.
- Public/private/peer/account navigation silently transfers text, replaces the sole editor or discards historical uncertain attempts; cancelled replacement still reads/sends or late preparation overwrites newer writing.
- Submission response or optimistic append reported as success without a separate authoritative observation of new message ID, sender, recipient and exact text; old identical messages, duplicate fresh matches, wrong page/peer/account or altered content falsely confirm.
- Lost/delayed/refused command outcome loses original attempt, clears later text or retries automatically; stale result writes into another context; verification replays a command.
- Pending attempt is sent before acknowledged storage; quota/refusal still sends; restored pending/review silently sends; malformed private or mixed-domain recovery is accepted; tokens or received private history enter the single record.
- Native escape or resize/IME/focus paths lose source; unsupported restrictions conceal the truthful native recovery route; original uncertain private attempts become resends through public context controls.
- Exported private contract is unversioned or depends on DOM/Vue; clean external consumer cannot prepare, approve, independently verify and recover through supported interfaces.

## Planned vertical slices

1. Named app E2E for explicit recipient-bound source/review/reload with no outgoing command; first genuine red before adding private context and recovery support.
2. Named complete send journey before the portable command path, with independent synthetic server state and strict one-use approval plus acknowledged pending recovery before exposure.
3. Failure-first recipient/form/account/revision/uncertainty/storage/transition cases, bounded meaningful regression, changed packed-consumer checks, exact installed Edge and final BDFL acceptance.

## Actual trade-offs

1. An explicit private/public union adds shared-path narrowing and strict compatibility validation in return for honest destination/account semantics and one recovery owner. Older clients reject private records visibly; public records remain compatible.

Final installed acceptance is recorded below. The initial native controlled observation establishes protocol premises separately from the later installed sender qualification.

## Verified development cycles (not final acceptance)

- `2026-11-04T13-25-08.865Z`: authored bootstrap setup failure; not the feature red. Corrected fixture injects the complete built userscript after the real document loads.
- `2026-11-04T13-27-27.777Z`: genuine missing Write private message entry red. `13-31-36.279Z` first review/edit/reload journey green.
- `13-36-41.094Z`: genuine missing Send approval and schema2-versus3 reds. Send/readback/reload and explicit schema3 pass in `13-42-28.871Z` after retained failures `13-39-40.794Z` (missing attempt presentation) and `13-41-12.686Z` (second activation hit a newly exposed native link).
- `13-45-02.500Z`: 15/17 complete-app checks passed; missing field error/focus and duplicate alert failed. Targeted corrections pass 2/2 in `13-46-20.337Z`.
- `13-48-51.803Z`: 5/7 pass; strict raw verification and immediate persistence of restored uncertainty failed. Those corrections pass 3/3 in `13-53-06.165Z`; the fourth case was a narrow drawer fixture setup failure. Corrected setup exposes the genuine language label red in `13-54-30.580Z`. `13-56-09.365Z` ran the older build after a template build error and is explicitly not qualification of the translation candidate.
- `consumer-2026-11-04T13-50-44.001Z`: clean external Node consumer 0.19.0 passes one-use duplicate refusal, acknowledged baseline, independent exact stored readback including native br/newline rendering, storage refusal and serialized uncertain-attempt verification after client restart. Later changed candidates require the final consumer check.

These are retained reporter bundles with authored fixtures, receipts, report, inputs/build hashes and attachments. Intermediate passes do not qualify a later candidate. The coordinator owns installed Edge source identity and affected browser checks; no additional live outgoing authority has been used by this implementer.

## Additional actual trade-offs

2. Schema3 is emitted once private-capable writing exists and retained through later public-context changes. New clients accept public schema1/2, but older clients cannot interpret schema3 and preserve it as incompatible raw recovery. This prevents older permissive public validators from silently losing private uncertainty.
3. The initial send capability requires a complete observed current private history. Paginated/partial history uses native continuation because a partial baseline cannot distinguish an older identical message moving onto a page from a newly stored message. This bounds convenience in exchange for independent result identity without assuming unobserved ID ordering.
4. Submission responses are never interpreted as proof of storage or definitive refusal because the native response callback contract was not captured. A command without unique independent stored readback remains uncertain, even when the forum appears to refuse it. Fresh form/account/recovery failures before POST are reported not sent.
5. Result verification examines strict raw private body nodes independently of the reading sanitizer. Only qualified plaintext, native br/newline layout and matching automatic URL links establish exact text; hidden, executable or richer markup remains uncertain rather than being silently flattened.
6. The consumed review remains visible and disabled until deliberate dismissal or editing. This occupies more dock space but keeps duplicate activation from falling through onto an unrelated control when asynchronous results change the layout.
7. Private writing reuses the existing source editor/session and sole writing owner; visual/rich tools are hidden for this action, and BBCode-like source requires native continuation rather than being advertised as qualified plaintext. This preserves undo, selection, composition and recovery behavior without implying public-post formatting/attachment capability.
8. Original immutable private attempts survive the established explicit replacement policy alongside public and draft attempts. No automatic retry or in-app uncertain resend is added; deliberate checking targets the original recipient and native continuation remains available. This favors avoiding duplicates over convenient repetition while the native outcome is unresolved.

## Later verified development cycles

- `2026-11-04T14-02-49.075Z`: language/enlarged geometry and peer guard pass; pmid/schema-string/markup expectations fail genuinely. Composition setup fired inside the existing finalization interval, and was corrected to wait for the review control to become enabled.
- `14-08-12.635Z`: four corrected guards pass. The public-history fixture failed setup separately.
- `14-09-55.912Z`: genuine missing retained public-history presentation red. The private pane now exposes original public/draft prepared snapshots, immutable destinations and deliberate original-result checking.
- `14-12-23.734Z`: 30/31 private cases pass; the remaining assertion did not open the nested Complete prepared source disclosure. Its fixture interaction was corrected before final qualification.
- Clean consumer `14-19-50.377Z` passes the genuine refused-new-review invalidation red (`evidence/runs/79-private-document-aliases-2026-11-05/references/77-consumer-refusal-red.log`). Subsequent portable failure-first checks exposed delayed older preparation reviving approval (`77-consumer-sequence-red.log`) and known not-sent becoming uncertain on check (`77-consumer-known-not-sent-red.log`). A preparation sequence now fences delayed preparation and sends awaiting acknowledgement; not-sent checks retain their authoritative result without a read.
- Final clean external consumer `consumer-2026-11-04T14-22-03.412Z` passes all portable private cases, including refused/newer/delayed preparation invalidation, replacement during recovery acknowledgement, storage refusal, duplicate activation, exact native newline readback, restart checking and known not-sent preservation. Typecheck, lint, format, build and whitespace checks also pass on this source candidate.

9. Private contexts expose retained public/draft snapshots and original-result checks, but no public resend controls. This keeps historical uncertainty inspectable across domain replacement without introducing a second active editor or allowing private-context controls to publish an older public revision.
10. Private preparation invalidates earlier approval immediately, including on refusal, and fences delayed preparations and sends still awaiting recovery. A consumer must request fresh review after starting a new preparation even if it later fails; this avoids stale authorization becoming usable again.

## Current acceptance accounting

- [x] Native one-to-one form/account/recipient/content/command/readback semantics researched before adapter implementation, with unqualified rich/private capabilities kept on native continuation.
- [x] Sole private context/editor, immutable review, explicit approval, restrictions/errors, modifier-Enter review boundary and retained original attempts implemented and exercised during failure-first application cycles.
- [x] Page-session schema3, strict compatibility, token exclusion, acknowledgement refusal, pending reload and stale preparation/account guards implemented; clean external consumer passes the changed 0.19.0 contract.
- [x] Final exact-candidate bounded application regression, including the corrected nested public-history disclosure interaction (276/276, run `2026-11-04T15-10-17.243Z`).
- [x] Exact installed Edge affected qualification: one separately authorized historical send `H77-message-A` and final `e461cf...` nonmutating review/recovery/readback after accepted74 integration.
- [x] Final BDFL review accepted `e461cf...` after validating both bounded repairs, final evidence and all ten distinct trade-offs.

Chrome and complete operating-system CJK/IME qualification are explicitly deferred to #79 and are not claimed here. Required installed and final-review evidence is now present and accepted at the exact final candidate below.

## Frozen application regression

`2026-11-04T14-42-07.400Z` exercised 275 complete-application Edge cases on userscript SHA256 `31250233aec6d324870b98d60c8726b12db6bc15bad6247875b12a0e9e80717c`: **262 passed, 13 failed**. All 31 new private-writing cases passed, including the corrected nested original-public-source disclosure. The 724-file manifest passes exact hash/size/coverage verification. Private history, Messages, writing-entry/presentation and prepared-review suites passed.

The failures are preserved and not characterized as passed acceptance: two original draft-result checks expect a former full-page empty state; writing composition-to-section/search expects the editor to disappear despite progressive drawers; appearance tests old wrapper padding rather than current derived Compact labels; redirect/download/parameterized account-return fixtures await obsolete navigation/control paths. The later accepted-base reproduction below distinguished prior integration assumptions from #77 regressions. No fixture assertion or application source was weakened in this run. Final baseline repairs, installed Edge and BDFL acceptance were completed in the subsequent records.

## Accepted-base diagnosis and fixture reconciliation

All 13 shared failures reproduced unchanged on accepted #70 userscript `a0fe0266ecc2af4c6499e769fcaac7d86e1051d45fc9b782a73d488e1db20e9e` in integration run `2026-11-04T14-53-09.656Z` (48-file manifest verified). Its explicit `--timeout=10000` bounded diagnosis of missing controls differs from the ordinary 30-second candidate timeout; outcomes/assertions were unchanged. These failures were repaired as test interaction debt rather than excluded:

- Two original draft-result checks now explicitly load the passive Drafts view before asserting the same absent draft, while retaining the two-command limit.
- Two composition-to-section/search cases now assert the sole editor remains visible behind the progressive drawer, then focus it after Escape. Exact final composition, identity, account, board, selection and HTTP assertions remain.
- Compact appearance measures the actual label margin change (12 to 8 pixels), retaining 44-pixel controls, text/selection/history and theme assertions. The former dock wrapper padding is zero in both modes.
- Redirect and three attachment cases explicitly accept the retained-writing read guard and wait for the reader before accessing the original target/download. Redirect Back restores the active writing dock; it no longer requires an absent resume button before hiding it.
- Four account-cancellation variants hide then resume the dock to cancel the pending preparation, retaining all account/source/recovery/no-effect assertions.

The first corrected run `2026-11-04T15-03-34.754Z` passed 13/14 (including the already-green new-writing download case); redirect reached a later obsolete resume-button expectation, which was corrected separately. No product assertion was weakened, and all former failures remain retained.

## Final advisor findings and bounded repairs

The validate-gpt-code-review skill was applied to two supplied boundary hypotheses. Both are valid at supported boundaries: mutable external consumer input could change source after initial validation, and serialized malformed private writing nested in a public draft attempt could pass the union validator and crash its public renderer. These are contract integrity/compatibility defects, not a claimed hostile-user security exploit.

- Failure-first clean consumer `77-advisor-mutable-red.log` demonstrated approved source changed to unqualified BBCode while the form read awaited. The client now clones caller input before validation or asynchronous work. Clean consumer `consumer-2026-11-04T15-06-40.780Z` passes on accepted #71 base `1fe329a2fbcf3eaeba75c89a5ae34f72f68bf37a`.
- A named whole-application `private-incompatible-private-draft` case requires visible incompatible-recovery guidance, raw-record retention and no private command/read before the historical draft validator is repaired. Its genuine red is `2026-11-04T15-08-22.241Z`; final276 and post74 private32 pass the repaired boundary.

The accepted #71 integration was applied cleanly after preserving immutable #77 snapshot `7076c2f71cd6a36b3f3659f3353c493036e41bcb`; the earlier installed live-send source remains historical qualification, not final corrected-source identity. The coordinator independently confirmed exactly one newly authorized stored message `H77-message-A` on that historical candidate; no further send authority remains.

## Final corrected candidate verification

Base `1fe329a2fbcf3eaeba75c89a5ae34f72f68bf37a`; userscript SHA256 `9df696476b006296f5b3c8c3c33e6c6633f0cea23e4cae34a80dfe7ea7dc385d`; portable package 0.19.0.

- `2026-11-04T15-08-22.241Z` is the genuine malformed-private-as-draft application red; its 47-file manifest is verified. The bounded repair uses the existing public validator for historical public draft submissions, so private union variants cannot reach the public renderer.
- `consumer-2026-11-04T15-09-51.733Z` passes the final clean external consumer, including immutable input at preparation entry. All 10 manifest files are verified.
- `2026-11-04T15-10-17.243Z`: **276/276 complete-application Edge cases pass** on the final corrected source, including all 32 private cases, all 13 reconciled baseline failures, public writing/review/entry/recovery, private history/Messages and progressive/redirect drawers. All 747 manifest files are verified. The preceding 262/275 and 13/14 runs remain distinct retained failures.
- Typecheck, lint, format, build and whitespace checks pass. One test-only unused binding was corrected before these checks; failed builds were never followed by application runs against stale output.

Both advisor findings are fixed at their boundary with no added store or generalized framework. Input is copied at the start instead of after asynchronous validation; public historical draft validation stays in the public domain. These enforce the existing immutable review and explicit union trade-offs above, rather than introducing new product capability.

## Ticket acceptance matrix at final candidate

| Criterion                                                                                                                        | Evidence and current status                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native recipient/sender/form/token/content/command and independent readback researched before adapter                            | Verified by controlled native observation and retained research; one-to-one plaintext/newlines only.                                                                                                                                                 |
| Sole owner/editor, explicit identity/restrictions/errors, immutable review, separate approval and modifier-Enter boundary        | Verified by private32 plus shared writing/presentation/prepared-review cases.                                                                                                                                                                        |
| Guard domain/peer/account changes, edits and duplicate activation; independently verify stored identity                          | Verified by failure-first fixture state and final consumer. Historical installed source independently stored the one newly approved message `H77-message-A`; final installed follow-up verifies its retained original identity without another send. |
| Retain original attempt and later text, deliberate checking/native recovery, no automatic retry                                  | Verified by delayed/uncertain/reload and original-history cases, plus consumer restart checks.                                                                                                                                                       |
| Acknowledged serialization, schema compatibility, token exclusions, storage refusal, reload/native escape                        | Verified by schema3, quota, malformed private/public nesting, pending reload and shared native redirect journey.                                                                                                                                     |
| Successful/refused/delayed/uncertain/stale-account fixture and exact installed behavior, proper live authority, changed consumer | Fixture and consumer verified; exactly one historical installed send independently read back under new approval. Final exact-source nonmutating installed qualification passed after accepted74 integration.                                         |
| Pinned design and explicit adaptations; existing operations/account/source/financial guarantees                                  | Verified by reused source-first dock, shared owner and final affected regression. Original public/draft/packet outcome identities remain separately inspectable.                                                                                     |
| Failure inventory and named complete-app expectations before implementation, replayable artifacts, no after-code unit tests      | Verified in retained red/green chronology and hash-verified reporter bundles. External HTTP alone is substituted in app E2Es; consumer checks use the packed external library.                                                                       |
| Static/build, affected installed Edge, changed consumer, final BDFL and trade-offs                                               | Static/build/consumer/final276 and ten distinct trade-offs verified; final corrected installed qualification and BDFL acceptance passed. Chrome/OS CJK remain explicitly #79.                                                                        |

All required evidence has been accepted; the final ticket commit is authorized. No further send authority remains after message `H77-message-A`.

## Accepted #74 integration and final bounded qualification

Accepted #74 (`e6c15dc66acfa0442c4551e53bf7c64a058341da`) was integrated cleanly after immutable #77 snapshot `e4111225e60b1dad1e6a8eca72d8222d1ab6e52a`. The final userscript is **`e461cf438676af63dd5f8bea4d766376310982a8defe5d44dfa95d1831bc5327`**. Its shared visual-viewport layout is qualified by `2026-11-04T15-21-13.553Z`: **76/76 passed** (32 private, seven visual viewport, 25 draft recovery, 12 corrected public writing paths). This bounded run follows the complete 276/276 corrected-source run; changes between them are the accepted #74 shared layout and its test synchronization helper.

Typecheck, lint, formatting, build and whitespace checks pass after this integration. Every file in the packed public portable contract (all seven packaged artifacts, including metadata) is byte-identical to clean-consumer run `consumer-2026-11-04T15-09-51.733Z`; comparison receipt is `evidence/runs/79-private-document-aliases-2026-11-05/references/77-final74-byte-comparison.json`. Internal emitted declarations that are excluded from the package are not presented as packed artifacts.

The coordinator also completed nonmutating installed review/edit-dismissal, original confirmed `H77-message-A` readback and later-unsent-source reload recovery on the preceding corrected `9df696...` source. Final installed repetition on `e461cf...` and BDFL acceptance passed as recorded below; no second outgoing command is authorized or required.

## Final installed acceptance and completion

Installed sender, recipient and stored-message identities below use the run-local
aliases `H77-sender`, `H77-recipient` and `H77-message-A`. The exact mapping and
pre-correction summaries remain in the ignored private bundle
`evidence/runs/79-private-document-aliases-2026-11-05`.

The final six-file installed bundle `77-installed-integrated74-2026-11-04` verifies exact complete Tampermonkey source **`e461cf438676af63dd5f8bea4d766376310982a8defe5d44dfa95d1831bc5327`**. Reload preserves later unsent source and the original confirmed `H77-message-A` attempt without received private history. At390×600 the original textarea remains focused and visible (vertical bounds439.414–539.414), with exact source and recipient. Fresh account/recipient preparation produces an immutable review, which is dismissed without sending. Deliberate guarded history loading independently returns the same four controlled message IDs and exact original `H77-message-A` text while keeping later writing separate; return restores the composition. The viewport override is reset.

Historical bundle `77-installed-2026-11-04` retains its actual31250233 source identity for the exactly one newly authorized app send: fresh form/history GET, one POST, independent GET, and separate native readback establishing new stored `H77-message-A`, sender `H77-sender` → recipient `H77-recipient` and exact approved newlines/content. Bundle `77-installed-corrected-2026-11-04` records the intermediate9df nonmutating follow-up and is not relabelled as the final source. Raw authenticated evidence stays local and ignored. Storage is verified; delivery/read status is not claimed. No further outgoing authority remains.

The final BDFL accepted all requirements at the owner-approved scope after rechecking the two reproduced boundary repairs, final276, final76, byte-identical clean portable artifacts, exact installed source and bounded historical-send evidence. All nine ticket acceptance criteria are verified. Chrome and operating-system CJK/IME remain explicitly deferred to #79 under the agreed cadence. The ten actual trade-offs above are the complete ledger; the final review introduced no additional distinct trade-off.

All2991 implementer evidence files, including original failures, are preserved in integration through verified immutable hardlinks without overwrites; receipt `evidence/runs/79-private-document-aliases-2026-11-05/references/77-evidence-preservation-final.json`. The final installed six-file manifest is separately verified in integration. No issue mutation, push, extra send or release occurs as part of this ticket commit.
