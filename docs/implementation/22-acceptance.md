# Issue22 acceptance record

All four acceptance criteria in [issue22](https://github.com/Benson-mk/tsdm-ui/issues/22) are verified for development feature acceptance. The final candidate has repeatable whole-application and public-consumer evidence, affected installed Edge/Chrome checks, current native read-only compatibility and separately attributed historical native saved edits. [Installed report](22-installed/report.md), [receipt](22-installed/receipt.json) and [procedure](22-installed/procedure.md) record that evidence without publishing authenticated content. [22-editing.md](22-editing.md) records the failure inventory and every actual trade-off; [public contract0.6.0](22-public-contract.md) records consumer migration.

## Accepted candidate

The isolated source starts at accepted integration commit `e5c1cc1da9bb067d6db41dcba258707c2f7dd495`. Application/userscript version **0.4.0** and library **0.6.0** are independently versioned. Userscript: **965429 bytes**, SHA-256 `8d7f55b7f177b18c30c10ac5357bbd8f2ba2854eff032381b93c9ed5334a6970`. Public entry: **281785 bytes**, SHA-256 `2de2a0405871eae1d932115f804cec7c014788f2ab8cf79f96c41dae3bcf416f`.

Both installed managers read back this exact candidate; each final executing-source capture contains it once. Runtime is Edge155.0.4283.62/Chrome156.0.8078.48 on macOS15.6.0 arm, with Tampermonkey BETA5.6.6242. Edge manager version is dashboard-observed; Chrome manager version is user-attested. Full stable-manager, Windows and frozen-release qualification remain subsequent work.

## Verified criteria

- [x] **Load actual editable source and metadata for the selected owned post.** Complete source, unknown syntax, disabled/effective options and attachment references are preserved; title-less replies do not acquire an invented title. Thirty-three editing E2Es cover source/options/reference preservation, absent versus explicitly empty attachment option values, ownership, malformed targets and required capability refusal. Both installed browsers match current native complete source/title/options/reference metadata. Historical actual native edits independently verify the sampled preserved metadata and textual transport; disabled/nonzero and unavailable thread-read-permission variants are explicitly synthetic coverage.
- [x] **Preserve local work on detected server changes and offer deliberate choices.** Both installed browsers display latest source and metadata, protect reload with cancellation/explicit discard, support manual reconciliation and require warned overwrite. Fresh preflight detects later changes. Saved bodies and independent synthetic server states preserve adopted metadata; later local source survives older confirmation and reload. No automatic merge or atomic conflict guarantee is claimed.
- [x] **Apply current-form, revision, session and uncertain-attempt behavior without a forum-draft edit action.** Full application and both installed runs preserve immutable attempts, pending/local revisions, account binding and acknowledged page-session recovery. Unavailable source and changed accounts prevent additional writes. Lost responses remain uncertain until original-result checks establish matching saved source without replay; moderation stays pending. Selected identities resolve through the actual edit capability and are revalidated across review/preflight awaits; drift/capability loss blocks sends. Current native lookup/review passed with zero forum edit POSTs.
- [x] **Independently verify saved actor/post/content/options and unaffected references, including required failure permutations.** Final-candidate deterministic and installed controlled checks verify complete saved revisions and references against independent HTTP-edge state, including latest-source changes, unavailable content, later local edits, moderation and uncertainty. Separately audited historical real edits in both browsers captured URL-encoded bodies and native actor/target/complete-source/options/reference readback on their own `92ea8152…` candidate. Each original immutable attempt was checked while its submitted revision was current. Those writes are not relabeled as new-candidate native sends.

## Repeatable verification

Use Node24.22.0/npm11.21.1, unchanged locked dependencies and installed Microsoft Edge:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e -- tests/e2e/edit-post.spec.ts tests/e2e/replies.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/writing.spec.ts
npm run test:consumer
```

Final application run `2026-10-23T02-58-28.911Z` passed **231/231**, zero retries:33 editing,64 reply and134 publication/writing cases. The exact0.6.0 packed public consumer passed at `consumer-2026-10-23T02-58-38.786Z`, including the exported baseline helper and closed DOM-free declarations. Typecheck, lint, formatting, build and diff checks passed. The230-file application and3-file consumer manifests were independently verified; final synthetic screenshots were visually inspected. Subsequent finalization changes only evidence documentation, leaving executable bytes unchanged.

The current installed evidence audit passed with60 verified artifact hashes; historical native audit passed with117. Private artifacts, failures, source/artifact identities and repeatable scripts are retained in `evidence/runs/issue-22-completion-retained/`. Earlier checkpoint/replacement/deletion-selector, attachment/mention and missing-public-export failures remain distinct. Browser-launch/cache/setup diagnostics and hidden-target expectations initially aimed at the wrong refusal stage are not presented as valid feature failures. Prior `91495` installed evidence and `d997` build evidence retain their own identities.

## Completed review and limits

Completed Standards/Spec review and BDFL validation confirmed three findings: attachment-select serialization, edit mention routing/revalidation, and the baseline helper's private import. Each received pre-code failing expectations and a focused correction. All thirteen new correction cases passed, followed by the full231-case regression and packed consumer. Final BDFL delta validation cleared all three findings.

Existing stored person URLs and literal at-text remain intact. A newly inserted edit marker that the server transforms into a different source representation stays explicitly uncertain until an edit-specific normalization is qualified; no unsupported confirmation or notification-delivery guarantee is claimed. Native current checks were read-only, and previously successful native edits were audited without repeating an unchanged write. Moderation, browser-controlled page-session lifetime and post-preflight races retain their documented limits. The accepted result is issue22 feature completion, not complete product release qualification.
