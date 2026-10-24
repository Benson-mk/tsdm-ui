# Favorites — isolated continuation

Issue [#30](https://github.com/Benson-mk/tsdm-ui/issues/30) continues on `implement/issue-30-favorites`, based on accepted integration `c5b00bac95dfc4154a770b67a357975c162cf229`. The broader root checkout contains intentional later-ticket work; this candidate contains only favorites changes on the accepted #27 tree.

## Implementation provenance and scope

The original #30 worker's diff was merged onto the current integration base, preserving accepted replies, editing, visual composition, drafts and attachments. All four new production files match the preserved root implementation exactly. Shared-file conflicts were additive: favorite exports and operations were retained alongside current draft/upload APIs, favorite navigation alongside current writing/navigation, and favorite CSS alongside current editor CSS. No hongbao, funded-draft, release-tooling or appearance-overlay changes were adopted. Existing favorites fixtures retain the root's explicit synthetic token sentinel names.

The failure inventory, original red/green chronology, native-source provenance and twelve existing choices remain in [30-favorites.md](30-favorites.md). The historical acceptance candidate and format-equivalence record remain attributed to their original bytes and tests. This continuation does not reinterpret those historical runs as verification of the current integration.

The public client advances from 0.9.0 to 0.10.0 for the additive Favorite models and operations. The external-consumer expectation was changed first and failed against 0.9.0 before the implementation constant changed. The application display version stays 0.4.0.

## Verification

The confirmed boundaries remain the complete application in Microsoft Edge with only external HTTP substituted, and the packed public library installed in a separate clean Node consumer. No unit-test layer or new post-implementation unit tests were added.

- Initial isolated candidate: 21/21 favorite E2Es passed, no retries, in `evidence/runs/2026-10-24T06-24-10.557Z`.
- Initial isolated public consumer: passed all inherited cases and five favorites cases in `evidence/runs/consumer-2026-10-24T06-24-16.376Z`.
- Both initial evidence packages passed exact-coverage, safe-path, byte-size and SHA-256 verification (65 and 3 files respectively).
- The first full regression was deliberately interrupted before the version update: 102 passed, one interrupted, 655 did not run. `evidence/runs/2026-10-24T06-24-54.331Z` remains an interrupted run, not a qualification pass.
- The version expectation's intended red output is retained privately at `/private/tmp/tsdm-next-context/30-version-red.log`; its assertion is exactly `0.9.0 !== 0.10.0`.
- Final versioned candidate results and hashes will be appended after verification.

Visual inspection of the narrow removal outcome and wide Saved/thread reader screenshots found readable controls, original actor/record identity, and the intended useful panes. Synthetic records and screenshots contain authored fixture data.

## Distinct continuation trade-offs

13. Transplant the existing failure-first favorites implementation onto the accepted integration tree instead of adopting the broader uncommitted integration. This preserves ticket isolation and prior behavioral work, at the cost of resolving shared-file conflicts and rerunning the complete application to verify that accepted authoring and navigation remain intact.
14. Give the additive public contracts a new exact package version, 0.10.0. Consumers can identify and pin the Favorite-capable contract, at the cost of explicitly repinning their dependency; the application display version remains unchanged because no release is being published.

The twelve original choices are not counted again. Root owns completed Standards/Spec/BDFL reviews and affected installed/native qualification. All four exact ticket criteria remain pending those required observations; this continuation alone does not approve a commit or issue closure. No native forum effects, installation, tracker mutation, commit, push or application publication were performed by this worker.

## Frozen candidate development result

The final versioned candidate passed **758/758 complete application E2Es in Edge**, with zero retries, in `evidence/runs/2026-10-24T06-27-34.380Z`. Exact package verification checked all 1,061 evidence files. This includes the 21 affected favorites cases and the accepted navigation, recovery, notices, reading, search, authoring, draft and attachment regressions. The earlier interrupted run remains separate.

The public 0.10.0 package passed the complete clean external consumer in `evidence/runs/consumer-2026-10-24T06-26-59.806Z`; its three-file evidence package also passed integrity verification. The intended version-red run is separately retained in `evidence/runs/consumer-2026-10-24T06-26-43.143Z`. Typecheck, lint, formatting, build and whitespace checks passed. Integration merge verification reported Already up to date.

| Artifact                        |     Bytes | SHA-256                                                            |
| ------------------------------- | --------: | ------------------------------------------------------------------ |
| Application 0.4.0 userscript    | 1,651,421 | `0adcb83c15c6fc840ac9be69e0dfa1a26dd3480af199710e681c7097b2538912` |
| Public client 0.10.0 JavaScript |   342,281 | `fb18bba90d8a1b21fa529e27a561ff84c7c88297bcc7de86f2e4f882686735eb` |

The version constant is not emitted into the application bundle, so the public-client version update left the userscript byte-identical to the initial 21-case candidate. The complete 758-case run was nevertheless performed against the frozen versioned source. All 218 retained source/build inputs matched their pre-run hashes at completion. A private source/build archive and manifest preserve the exact test inputs, including documentation before this result appendix; adding this appendix does not change executable sources or artifacts.

Replay from this ticket tree with the declared Node 24.22.0/npm 11.21.1 toolchain: `npm run build`, `npm exec -- playwright test`, `npm run test:consumer`, and `npm run evidence:verify -- evidence/runs/<run-id>`. The existing installed/native requirements and all four criterion gates above remain unclaimed by these development results.

## Completed-review correction: stale preparation authority

The completed Spec review reproduced an additional favorite request from a second previously prepared public command after the first command became uncertain. BDFL independently confirmed the defect as P2. The current workspace's busy guard limited ordinary UI exposure, but the public forum client needed its own execution-time guarantee.

Before production correction, the clean installed package consumer gained four failing scenarios: two ordinary preparations separated by a lost result; two authorized retries separated by newer unchecked uncertainty; uncertainty appearing while preparation awaited a read; and checked recovered uncertainty imported while execution awaited final preflight. An unrelated-target control passed. The failed consumer receipt is `evidence/runs/consumer-2026-10-24T06-44-23.304Z`; private diagnostics retain the four assertion failures. This is a public-package integration boundary, not a unit-test layer.

Preparations now privately retain the explicitly checked prior-attempt identity and the unresolved identities present before preparation reads. A shared predicate requires current unresolved attempts to be checked, the prior identity to match the complete intent, and no newly unresolved identity since authorization. The predicate runs before and after preparation and again at execution, including immediately before the effectful request after asynchronous preflight. Original outcomes remain intact; a fresh checked, explicitly authorized preparation can proceed. Public command serialization and the 0.10.0 API are unchanged.

The alternative was a per-target invalidation epoch. Deleting sibling preparations alone misses an already-running asynchronous preparation; an epoch would need additional timing rules and invalidate preparations after harmless outcomes. The selected predicate expresses the existing uncertainty contract directly within this operation.

15. Bind each favorite preparation's send authorization to the unresolved attempts known when it was prepared, and recheck at execution. This prevents an old preparation from silently becoming a resend and preserves token-free public commands; the cost is small private bookkeeping and fresh preparation when intervening attempts change uncertainty. No generic command framework, durable store or cross-tab lock is introduced.

The corrected package passed all inherited consumer cases plus ten favorite cases in `evidence/runs/consumer-2026-10-24T06-45-47.300Z`, including exactly one newly authorized retry, preserved original attempts and unrelated-target progress. All **21/21 affected application favorites E2Es passed**, zero retries, in `evidence/runs/2026-10-24T06-46-00.789Z`. Typecheck, build, lint, formatting and whitespace checks passed. An intermediate exact-optional metadata declaration failed typechecking before build; its declaration was corrected before these passing checks. The correction is confined to favorite command authority and its external consumer scenarios; the earlier 758-case baseline remains attributed to its original bytes and was not relabelled as a complete baseline of this corrected candidate.

| Corrected artifact              |     Bytes | SHA-256                                                            |
| ------------------------------- | --------: | ------------------------------------------------------------------ |
| Application 0.4.0 userscript    | 1,652,241 | `6b987014b7d773616590c5532eb52f3517775b8d541bb89fb8724668639add9c` |
| Public client 0.10.0 JavaScript |   342,821 | `67ee1dc877973ced48d783fed8146f78c2af1ec018c1d30eab04c4ff011ca9d9` |

These new executable bytes require their own affected installed Edge/Chrome checks and completed correction review. The original installed lifecycle observations remain tied to the preceding candidate. Root owns those gates; this correction performs no native effect, tracker change, commit or installation.
