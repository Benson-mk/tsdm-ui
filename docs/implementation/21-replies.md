# Reply and quick quote

Issue #21, integration base `4cadc77`. The initial implementation record below is retained historically. Current isolated implementation and acceptance status are in [21-acceptance.md](21-acceptance.md); installed/live verification and completed-work reviews remain coordinator-owned.

## Failure inventory before implementation

Application seam: real Vue layout → workspace → portable client → browser host; only external HTTP is substituted. Public consumer seam: separately built library, without DOM/Vue/GM. Existing acceptance authorizes these seams.

- J4.reply-current: wrong thread/board/post, stale or absent member/token, changed successful controls/options and unsupported native variants must refuse. Ordinary reply must preserve complete literal source/options and independently verify returned actor/post/source.
- J4.quote-target: one Quick Quote retains native author/post references and one addressed target. Another action needs replacement confirmation; manually added source quote blocks cannot retarget.
- J4.reply-merge: returned existing post must preserve complete pre-send baseline and appended source, with explicit independently verified merge boundaries; partial suffix checks cannot establish full preservation. Unknown merge grammar remains uncertain pending qualification.
- J4.reply-outcomes: validation refusal, moderation, response loss, unsafe callbacks, wrong returned post/thread/author/source/options, and reader failure remain distinct. An older result cannot overwrite later local edits.
- J5.reply-recovery: persist pending attempt before POST; reload never repeats; explicit check retains original attempt and baseline; unavailable recovery blocks send. No invented reply draft-save action.
- J11.reply-session: account changes before preparation/send, while in flight, and during readback retain original writing and possible unknown effects, with no atomic cookie isolation promise.
- J4.reply-mentions: fresh supported forum identity list, malformed/unavailable/changed account, exact selection, literal unresolved @ text, and independently stored markup versus unknown delivery are distinct.

- J4.reply-mention-context: replacing a writing context during a pending person lookup must clear transient busy/results; the old response cannot disable or populate the new context.

## Plan

Add reply-specific portable preparation/publication with narrow action metadata while preserving shared revision/attempt/account/recovery guarantees. Extend shared composition guards and presentation additively; siblings have separate worktrees and shared-file changes require merger reconciliation. Keep synthetic qualification separate from current native proof.

## Actual trade-offs

1. Extend the existing immutable publication/attempt lifecycle with narrow reply action metadata instead of duplicating its account, revision, persistence and one-use logic. This keeps one guard owner; the historical ThreadPublication name now also carries reply commands and action branches must remain explicit.
2. Keep opaque addressed notice controls private and re-read them for the selected post. Native addressed forms begin with blank body; the UI identifies the addressed author/post and preserves separately authored quote source without synthesizing or collecting quote blocks. This retains current native targeting while requiring the member to author additional quoted content explicitly.
3. Normalize a supported returned pid/page into the existing exact-post navigation anchor, rejecting conflicting fragments. The result identifies a stored post without claiming a new allocation; unsupported callback variants stay uncertain.
4. Resolve individual mentions through the current literal atplus capability and insert its marked username only after explicit UID/name selection. Fresh identity checks add lookup/form requests at review and send; literal @ text stays unchanged and group mentions are outside this person-selection workflow. Notification delivery remains unverified.
5. Parse the literal JSON atplus configuration without executing forum scripts, and permit only its observed same-origin person-search endpoint. Changed scripts/configuration require qualification instead of silently falling back to the obsolete getatuser/bare-name convention.
6. Retain complete before-source/options for owned posts on the observed thread page and recheck them immediately before sending. This adds GETs and recovery-record volume, does not establish a complete thread census or predicted merge selector, and cannot provide atomic account/content isolation. A later unobserved existing target remains without a before baseline.
7. Retain complete before and observed source for explicit comparison. Confirm a known existing returned post only when its complete prior source, complete submitted source after the qualified selected-person conversion, observed supplement wrapper, actor, valid date/minute and persistent options match. Unknown wrappers and unbaselined merges remain uncertain; this bounded observation does not establish timestamp provenance, notification delivery, causality or a complete merge algorithm. Complete source copies consume finite session storage; acknowledged persistence remains required before send.
8. Clear transient mention lookup state when writing is replaced and fence responses by writing-context identity. The old HTTP lookup may finish, but cannot populate or keep the replacement busy; transport cancellation is not required for correctness.

9. Reuse complete reply-comparison snapshots instead of adding normalization variants to the public verification/recovery schema. Serialized compatibility is preserved; consumers inspect full before/observed snapshots to distinguish exact source from qualified reply preservation.
10. Use the accepted Edge routine-development browser. This reduces duplicate development checks while risking later discovery of browser differences; both installed browsers remain acceptance requirements under ADR 0002.

11. Extract only the reply changes from the initial isolated patch and later bounded comparator work instead of including the accumulated multi-ticket frontier. This preserves the requested first-unblocked-ticket scope and unrelated working changes, at the cost of reconstructing integration context and repeating acceptance for this smaller candidate.

12. Independently version the portable library at 0.5.0 while retaining the byte-identical 0.4.0 userscript. This preserves the documented public contract and completed installed evidence without an unrelated application identity change, at the cost of tracking two explicitly named artifact versions. No runtime abstraction is added.

## Provenance and qualification limits

Current native source and raw form observations were captured privately on 2026-10-22 (Asia/Hong_Kong). They establish current field/identity syntax, not successful reply submission, server merging, mention conversion, or notification delivery. No authenticated raw capture is copied into this repository. Synthetic forms are authored independently.

| Observed source                          | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Current `at-panel.js` v1.7.0             | `05fc6d2c49679a95a659565b37f11106140b81b6adde59a5958c9884b2991eaf` |
| Ordinary reply HTTP body                 | `55f2fbb435634da2a781158c06a674b0ed74b6e8bc45053784157d838475c2d6` |
| Addressed reply HTTP body                | `887c55d1173884c6f5ec99998798960147572e9b18a0431af0b3faf0bf836ebd` |
| Owned edit HTTP body                     | `bd59118a9a33a6a00f5d2122bfd2b312d40771a4e1f0e291fd821cba1dbffa5c` |
| Current mention search response envelope | `63285153f01a983a3f300a7362bff40ca4ba0b355a9ca52ba5680c91c10a5bd1` |

Consulted experiment revision `c8348e6c4c4aaf0011f174394733be3d580f59e5`, `src/integration/live-reply-form.js` (`e4a21db9fa67994b4b5ebea7c886c8a28966250258f6a7a40a3b1f133133000a`) and `live-reply-response.js` (`92bd72a608e280ad2feb27b650310a7555a4b147792edfdc48f47e38abe94b51`) for opaque addressed controls and callback semantics. No source bytes were ported. Historical merge121/reply245 research identifies missing deployed supplement grammar; its stricter historical authorization policies are not inherited as current task authority.

An offline experiment loaded current private captured responses through the actual public client, with all POSTs forbidden. Ordinary and addressed preparation both reached review-ready, each with four local fixture reads and one known owned baseline. This is captured-native compatibility only. The private program/result are retained by the coordinating task; they contain no proof of an installed send.

## Repeatable development evidence

Run with Node 24.22.0, npm 11.21.1 and the locked dependencies. Every application run below has its own `receipt.json`, `report.md`, `manifest.json`, source/build identities and synthetic attachments under `evidence/runs/<run-id>/`. Failed runs remain separate from corrected runs.

```sh
npm run build
npm run test:e2e -- tests/e2e/replies.spec.ts tests/e2e/writing.spec.ts
npm run test:consumer
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/<run-id>
```

| Slice                                                       | Retained evidence                                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary reply, addressed quote, current mention syntax     | First meaningful REDs `2026-10-21T17-19-11.103Z`, `17-22-41.027Z`, `17-24-34.697Z`; all three GREEN `2026-10-21T17-27-35.622Z`                                                        |
| Unsafe callback and recovered action/target bindings        | Five REDs `2026-10-21T17-30-23.164Z`; corrected cases included in subsequent passing reply suites                                                                                     |
| Full known before/result retention and changed prior source | Two REDs `2026-10-21T17-31-44.996Z`; 27 reply cases GREEN `2026-10-21T17-37-51.809Z`                                                                                                  |
| Recovered comparison baseline/actor binding                 | Four REDs `2026-10-21T17-38-21.237Z`; 169 affected application cases GREEN `2026-10-21T17-40-12.234Z`                                                                                 |
| Fresh account establishment in recovered public consumer    | Existing consumer found a stale-generation regression; corrected library passed `consumer-2026-10-21T17-42-29.751Z`, and 107 reply/new-thread cases passed `2026-10-21T17-42-23.003Z` |
| Reply confirmation in both Chinese interface locales        | Two REDs `2026-10-21T17-43-27.295Z`; 33 replies GREEN `2026-10-21T17-46-52.670Z`                                                                                                      |
| Pending mention lookup across writing replacement           | RED `2026-10-21T17-47-35.185Z`; final 34 reply + 58 shared-writing cases GREEN `2026-10-21T17-48-09.076Z`                                                                             |

The earlier 169-case pass does not establish later executable bytes. The final targeted 92-case pass covers the last context replacement correction; the library bytes are unchanged from the corrected public-consumer pass. Fixture-only timing corrections are retained in earlier failures: account mutation initially occurred before POST instead of in-flight, and the changed-board fixture initially hit the newly added preflight instead of result checking. Neither was relabeled as a passing run.

## Initial handoff acceptance (historical; superseded by 21-acceptance.md)

- [ ] Exact reply/quick-quote preparation and composition guards: implemented and synthetic cases pass; affected installed Edge/Chrome and live current-form acceptance still required.
- [ ] Preserved author/post references and supported resolved mentions: current native identity syntax observed and synthetic tests pass; actual stored-source conversion and installed behavior remain unqualified. Delivery is explicitly unknown.
- [ ] Shared session/revision/attempt guards and complete merged result confirmation: guards and exact nonmerge readback pass; known existing returned posts retain full comparison but are not confirmed. A bounded current-native merge wrapper/preservation comparator and full prior/appended verification remain required.
- [ ] Ordinary/addressed/merged/moderated/refused/uncertain/later-edit artifacts: synthetic coverage exists, but merged confirmation, installed/live evidence, reply-specific independent consumer integration and completed-work review remain open. No reply draft-save endpoint was invented.

Concrete next qualification: in an isolated authorized owned thread, capture full prior editable source/title/options, review one distinctive harmless reply, and send only once under separately applicable authorization. Independently fetch its returned exact post. Retain full before, submitted and after source if merging occurs; qualify the bounded observed wrapper, then use GET-only result checking against the original attempt. Do not resend to obtain duplicate evidence. Unknown transformations, unbaselined prior identities and notification effects stay uncertain. Root coordinates this action and the final BDFL/Standards/Spec review. No commit or completion claim is warranted yet.
