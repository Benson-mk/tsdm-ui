# Bounded reply replay procedure

Use this procedure to produce new evidence for the exact source under examination. It does not authorize a live forum write, and an older receipt does not qualify new executable bytes.

## Build and deterministic replay

Use Node 24.22.0 and npm 11.21.1 with the repository lockfile. Build the isolated issue #21 source, then record the complete source and emitted artifact hashes. The recorded userscript is 925120 bytes with SHA-256 `409c25e3b34e02f99426d9835b1cfa357cabcb1c49a609625412e23302e81c68`.

```sh
npm ci
npm run build
npm run test:e2e -- tests/e2e/replies.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/writing.spec.ts
npm run test:consumer
npm run evidence:verify -- evidence/runs/<run-id>
```

The application scenarios and independent literals in `tests/e2e/replies.spec.ts` define the authored reply forms, one addressed post, current options, person-selection markers, response variants and bounded source comparison. `tests/consumer/replies.mjs` independently exercises ordinary replies and serialized original merged-attempt checks through the installed public package. Run against the exact installed package rather than importing private implementation files.

## Installed manager and external HTTP boundary

For each installed browser, preserve the existing manager source before replacing it. Save the exact candidate through the manager, read back the complete stored source and compare its bytes. Reload the task document and enumerate executing userscripts; retain one exact candidate runtime and no duplicate TSDM loader. Record browser, OS and manager versions with their observation provenance. The source display version alone is insufficient.

Use a task-owned page and browser-level request interception for only the external application HTTP seam. Supply independently authored fixtures equivalent to the repository application cases. Do not replace application methods, storage or browser controls. Distinguish ordinary application Fetch requests from native Document/static/background traffic; no effectful request should escape the controlled fixture. Keep every request/event scope bounded and complete, retaining truncation or setup failures separately.

Exercise addressed source and options, explicit refusal and moderation, and ordinary reply completion while later local source has changed. Before Send, check the localized review identifies the reply action, revision, actor, thread and board, with the addressed post/author visible for Quick Quote. Extra source quote blocks must not change that addressed target. Refusal/moderation must remain distinct from independently confirmed stored source.

For the merged recovery case in each browser:

1. Load an authored existing owned post with complete prior editable source. Prepare one addressed reply, insert an explicitly selected synthetic person, and retain additional literal source.
2. Review and send once. The controlled endpoint records the submitted command but loses the response. Save the original uncertain attempt, immutable publication and full before/submitted source.
3. Change local unsent source and reload. Confirm recovery retains the original attempt and newer local writing without another POST.
4. Supply the authored candidate exact-post URL and invoke **Check result**. Return the full independently authored stored source using the qualified supplement header and selected-person spelling. Count only GETs during this explicit check.
5. Compare original and checked attempt ID/publication, complete before/submitted/observed sources, exact returned post/thread/actor and option state. Confirm one total reply POST, no resend and preserved newer local text. Open the returned actual post where the scenario requires navigation.
6. Retain complete request scope ledgers and state snapshots privately, plus screenshots showing the visible outcome. Author a separate public result with aliases, exact candidate identity, observed counts and explicit limits; do not publish authenticated DOM or raw request captures.

Repeat unsafe/unknown source variants using the deterministic application scenarios; unknown transformations must remain uncertain. Native form and source-grammar observations require separately attributed current or retained native evidence. Do not generate additional live writes solely to duplicate an already successful observation.

## Separately attributed native preparation

When native access is authorized, use a task-owned existing thread in each browser to prepare an ordinary reply and one addressed reply to its opening post. Search for an intended person using the current native capability, explicitly select the verified UID/name, and review. Retain the exact thread/post context and marked source privately. Stop before Send unless a separate applicable authorization and evidence need require a live write. Label ordinary/addressed form GETs and the semantic read-only person-search POST accurately; they are current native compatibility observations, not publication evidence. Keep retained historical native before/submitted/after sources under their original hashes and timestamps.
