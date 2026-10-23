# Isolated reply and quick-quote acceptance

Issue #21, “Reply and quote the intended post with supported mention identities”, is the first open unblocked ticket selected by the coordinator. This implementation starts at integration commit `4cadc771e8c246bf5d487cb8cc09bc33c762ec99` on `ticket/21-finish-20261023`. Existing unrelated working changes remain in the original checkout.

## Scope and source

The isolated initial eleven-file reply implementation was recovered from its retained handoff. The bounded native-source comparator and its pre-existing application/public-consumer expectations were extracted from the later native-comparison work. Owned editing, visual editor, drafts, favorites, uploads, hongbao and release tooling are absent. The independent consumer retains only ordinary reply and original merged-attempt recheck cases from its multi-feature predecessor.

The failure inventory, native provenance and historical RED evidence remain in [21-replies.md](21-replies.md) and [21-native-comparison.md](21-native-comparison.md). The complete application and separately installed public Node package are the established testing seams. No unit-test layer was introduced and no live forum operation occurred in this isolated implementation.

## Verified behavior and completed acceptance

| Criterion                                                                                         | Evidence assembled                                                                                                                                                                                                                                                                                                                                                                                     | Review disposition                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Exact reply/quick-quote preparation, current options, replacement guards and one addressed target | Isolated application cases cover current target/options and replacement races. Final installed Edge addressed and Chrome ordinary journeys exercise the same candidate; both browsers retain one target through merged recovery.                                                                                                                                                                       | Verified; final review complete.               |
| Attribution and supported resolved mentions                                                       | Current-native syntax/source provenance remains separately pinned; final-candidate ordinary/addressed preparation and explicit person selection/review were freshly observed in both browsers. Both installed final-candidate merged journeys retain explicit person identity and exact qualified stored-source conversion; literal source remains separate and notification delivery remains unknown. | Verified against the documented native bounds. |
| Shared revisions, attempts, accounts and complete merged-result verification                      | Application/package boundary cases pass. Final installed Edge/Chrome original-attempt checks retain immutable ID/publication and complete prior/appended source, use two GETs with no resend, and preserve newer writing.                                                                                                                                                                              | Verified; final review complete.               |
| Ordinary/addressed/merged/moderated/refused/uncertain/later-edit artifacts; no reply draft-save   | Application and public-package artifacts plus installed Edge refusal/moderation/addressed and Chrome later-edit observations are retained. Replies expose no server draft-save operation.                                                                                                                                                                                                              | Verified; completed review finding corrected.  |

The [authored installed summary](21-installed/report.md), [receipt](21-installed/receipt.json) and [replay procedure](21-installed/procedure.md) distinguish actual manager/browser execution with controlled HTTP from deterministic application tests and historical native observations. Current captures identify both browser versions and the Edge manager version; the current Chrome manager version is separately attributed to the user's direct report. Exact installed source/runtime measurements remain independent. Completed Standards/Spec/BDFL review accepted the distinct evidence layers; its one confirmed public-version finding is corrected as recorded below. These development observations do not qualify stable managers, Windows or the complete release matrix.

## Repeatable verification

Use Node 24.22.0 and npm 11.21.1 with locked dependencies and installed Microsoft Edge. The local run reused the matching existing dependency installation; no package/dependency change was needed.

```sh
npm ci
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:e2e -- tests/e2e/replies.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/writing.spec.ts
npm run test:consumer
npm run evidence:verify -- evidence/runs/<run-id>
```

| Retained run                        | Result                                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `2026-10-23T01-40-51.153Z`          | Inconclusive sandbox browser-launch failure; no behavior was exercised.                                                                                                                                      |
| `2026-10-23T01-41-05.325Z`          | Meaningful RED: both existing native supplement/person-link expectations fail before importing the comparator.                                                                                               |
| `consumer-2026-10-23T01-41-17.511Z` | Installed public package reports uncertain instead of confirmed for the complete merged recheck. The separately retained cache-permission failure is not a behavioral RED.                                   |
| `2026-10-23T01-41-50.613Z`          | **192/192 passed**, zero retries: 58 reply, 76 new-thread and 58 writing cases. Includes independently checked request/readback state and inspectable artifacts. Manifest verification passes all 154 files. |
| `consumer-2026-10-23T01-43-27.978Z` | Clean packed-package installation/import, declarations without DOM, existing publication cases, ordinary reply and serialized original merged-attempt GET-only recheck pass.                                 |
| `2026-10-23T01-45-19.086Z`          | Both explicit browser-launch appearance cases pass in Edge after the channel change. The corrected reporter now accurately labels its browser precondition.                                                  |

The 192-case receipt inherited the stale precondition string “Isolated Chrome context”; its frozen Playwright configuration actually selects `msedge`. The reporter wording is corrected for future runs. The historical receipt is preserved unchanged. The subsequent changes remove an unused consumer-only constant, improve consumer report wording and correct this reporter label; at that stage, application/library executable bytes remained those exercised by the 192-case pass. The later installed-summary correction below changes the userscript and has its own affected verification. Typecheck, zero-warning lint, formatting, both builds and whitespace checks pass.

The two positive native-comparison screenshots were inspected. Complete comparison and request JSON accompanies the merged recovery screenshot; the screenshot itself shows preserved newer unsent writing after reload. No screenshot or synthetic fixture is presented as an installed manager observation.

## Trade-offs

All twelve actual distinct implementation choices are recorded once in [21-replies.md](21-replies.md#actual-trade-offs). The source/provenance and evidence isolation choices do not expand the supported native contract. Unknown transformations remain uncertain rather than being accepted by substring matching.

## Installed review-summary correction

Before correction, the coordinator observed the exact installed isolated candidate describing public-thread creation, price and read permission when reviewing a Quick Quote. Inspection confirmed that SourceWriting selected the existing new-thread summary unconditionally even though it selected the reply send button correctly. Six application expectations (ordinary/addressed replies in English, Simplified Chinese and Traditional Chinese) are written before correction: the confirmation must name the reply revision, actor, thread and board, disclose possible addition or merge, retain addressed attribution and issue no POST until Send. Existing new-thread summary semantics remain unchanged.

The six new cases failed on the original installed candidate at `2026-10-23T01-49-52.219Z`. The correction adds one reply-specific review string in all three locales and selects it from the immutable publication's reply target. It names the thread, actor, board and revision and describes possible addition or merge; the existing attribution line continues to identify the addressed post and author. There is no new distinct trade-off: this corrects the displayed operation within the existing publication flow.

The corrected candidate ran all 140 reply/new-thread cases at `2026-10-23T01-51-12.956Z`: 139 passed, including all six new localized expectations and all 76 new-thread cases. One existing reply test expected the obsolete literal “Review revision”; it was updated to “Review reply revision” and passed separately at `2026-10-23T01-52-36.147Z`. The failed aggregate receipt remains failed and retained. No executable bytes changed between those runs. Screenshots of the addressed review in all three locales were inspected.

At the summary-correction checkpoint, the userscript is 925120 bytes, SHA-256 `409c25e3b34e02f99426d9835b1cfa357cabcb1c49a609625412e23302e81c68`. At that checkpoint the public library and declarations remain byte-identical to the earlier successful clean-consumer candidate (public index SHA-256 `6c5e6152a9da78da8ee27eb38bad6c1ecf0ef6b1c3e7aca2880809df885e099f`). Both builds, typecheck, zero-warning lint, formatting and whitespace checks pass. The earlier installed candidate is historical. The final installed observations linked above identify these corrected userscript bytes; review remains pending.

## Final review and public contract

Standards review raised one bounded P2 finding: the exported writing-action union and required client methods expanded without advancing the portable contract version. Spec review found no actionable implementation defect. BDFL validation confirmed the version finding and accepted the evidence map: retained native writes/readbacks, fresh final-candidate native form/person checks and exact-candidate installed controlled outcomes satisfy development feature acceptance without repeating a live write solely for another receipt.

The [library migration](21-public-contract.md) advances only the portable contract to **0.5.0**. The new expectation failed against 0.4.0 before correction; the final clean consumer `consumer-2026-10-23T02-13-39.319Z` passes against the corrected package. Public entry SHA-256 is `ced10cb3d32f15233f375a9faea18916635791051d46012499a7f1f4d1e273fe`. The rebuilt 0.4.0 userscript remains byte-for-byte `409c25e3b34e02f99426d9835b1cfa357cabcb1c49a609625412e23302e81c68`, so the completed installed observations still identify the exact application. Earlier 0.4.0 library receipts remain historical and are not relabeled.

- [x] Prepare reply/quick-quote actions for the exact thread/post with current options and composition-replacement guards. One Quick Quote has one addressed target; extra source quote blocks do not silently retarget it. Verified by affected application cases, fresh native preparation in both browsers and installed addressed/ordinary flows.
- [x] Preserve quote author/post references and resolve mentions through supported forum identity semantics. Text resembling a mention and notification delivery are not assumed confirmed. Verified by pinned native inputs, fresh explicit identity selection/review, negative application cases and complete installed source comparisons.
- [x] Use shared revision/attempt/session guards and result checking. Confirm complete merged results, including prior and appended content, and open the returned post. Verified by application/public-package cases, exact-candidate installed original-attempt GET-only checks in both browsers and observed returned-post navigation; historical uncertain native attempts retain their original status.
- [x] Cover ordinary, addressed, merged, moderated, refused, uncertain and later-edit cases with independent state readback and repeatable artifacts. Replies have no invented server draft-save action. Verified by retained application/consumer artifacts, installed controlled observations and the reviewed public API/UI.

These checks establish ticket development acceptance, not publication or full release qualification. Commit, integration and issue closure are coordinator-owned subsequent actions.
