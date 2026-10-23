# Issue #23 acceptance

This ticket adds ordinary visual authoring to the accepted new-thread, reply, Quick Quote and owned-edit workflows on commit `4f359b65c60ec83aaf69e782be22190f8c359c87`. It does not qualify a release or deliver the later table/hidden-block, visual mention, forum draft, upload or hongbao controls.

## Candidate

- Final application `0.4.0`; userscript **1,454,506 bytes**, SHA-256 `d5f25133e1b5045c7ec005c7aa9844d62176d7dc7e3ccbcd3bab96051d8595f8`.
- Broad installed editor/IME observations belong to the earlier **1,451,144-byte** candidate `81de77c7d6a779fe4a2e35b6cdfaaaa6a3ffb85d772404568e21cdc6253ec2a1`. They are not relabelled as final-bundle runs.
- Forum-client library `0.6.0`; entry 281,785 bytes, SHA-256 `2de2a0405871eae1d932115f804cec7c014788f2ab8cf79f96c41dae3bcf416f`, byte-identical to accepted #22. Editor dependencies and browser views stay out of its public imports.
- Node `24.22.0`, npm `11.21.1`, locked dependencies. Source and artifact manifests distinguish this ticket from the mixed later-ticket working copy.

## Criteria

1. **Verified:** selective experiment provenance is pinned in `23-provenance.md`; the codec, document and history live in the workspace session. `EditorView` is disposable, held in a plain lexical binding; snapshots use `shallowRef`. Strict TypeScript checks every editor implementation module.
2. **Verified:** all nineteen ordinary controls pass final full-application exact-source creation/readback and broad installed Edge/Chrome checks on `81de77c7`. Both browsers exercise the final `d5f25133` localization correction, retained source/selection and controlled formatting/save/readback. Pinned native spellings and the native bold example retain their bounded scope in `23-installed/report.md`.
3. **Verified:** no-op inspection, source/visual switches, unknown and malformed fragments, deep input, references, CRLF, clipboard protections and unaffected-span editing pass full-application cases. Unsafe interpretation retains complete editable source and blocks publication until explicitly resolved. Final locale cases verify authored refusals and publication blocking without mutating source or selection.
4. **Verified:** application and broad `81de77c7` installed checks cover undo/redo, native caret/focus, fallback, navigation/refresh, themes/languages, viewport, 90%/100% single scaling and later-writing preservation. Human Edge IME text `輸入測試` remains in the bold immutable submission and independent controlled saved-source readback on `81de77c7`. Historical Chrome human IME remains attributed to v4 `92ea8152`. The final correction changes only authored-message presentation in three UI files; codec/session, input handlers, view script, workspace bridge/mount and dependencies remain unchanged. Event trust limits and this bounded evidence carry-forward are explicit; no final-bundle human IME rerun is claimed.
5. **Verified:** new-thread/reply/Quick Quote/edit use the single `PostEditor` and workspace session; shared-context visual formatting tests verify actual saving and independent source readback. The complete release authoring matrix remains later work.

## Evidence and review boundaries

Synthetic application tests replace only HTTP and exercise layout → workspace → forum-client → browser host. They produce screenshots, independent fixture ledgers, machine-readable receipts and reports. The initial launch failure under the process sandbox occurred before test behavior ran and is retained separately. A first normally launched run passed 271/272; its inherited viewport assertion also failed on untouched accepted #22. Diagnostics justified measuring displacement from the initial relative offset with the original one-pixel tolerance unchanged. The broad `81de77c7` regression subsequently passed **275/275**, zero retries, at `2026-10-23T03-47-01.958Z`.

The initial zero-finding Standards conclusion was superseded by a fresh independent P2 finding: authored command errors and pinned session explanations bypassed interface localization. BDFL validated it. Failure-first complete-application cases reproduced the command/session failures, language-change failure and an adjacent workspace readiness-warning failure before their corrections. `PostEditor` now translates the authored diagnostic; `editor-strings` maps known messages and four Chinese aliases while preserving unexpected diagnostics; `layouts/strings` translates the readiness warning. Final Standards review confirms the P2 is resolved with zero remaining material findings.

Final `d5f25133` regression passes **288/288**, zero retries, at `2026-10-23T04-30-04.075Z`. The [installed report](23-installed/report.md), [receipt](23-installed/receipt.json) and [procedure](23-installed/procedure.md) distinguish the broad original evidence from final targeted checks. Final BDFL delta validation confirms zero outstanding code findings and the unchanged input path. Final independent installed-evidence audit passes for both browsers and retains a portable verifier, exact runtime proof, request/readback observations and metadata correction under `evidence/runs/issue-23-completion-retained/final-correction/`. All five criteria and final review/evidence gates are verified. Stable-manager, Windows and full-release integration remain later qualification work.

## Current validation

- Final complete Edge application regression: **288/288**, zero retries, `2026-10-23T04-30-04.075Z` (visual editor, appearance, new thread, writing/recovery, replies and owned edits).
- Clean packed public consumer: `consumer-2026-10-23T04-24-58.476Z` passes, including strict DOM-free declarations and the public edit helper. Its artifact is byte-identical to the final public entry.
- Typecheck, lint, formatting, build and diff checks pass with the pinned tools.
- All six editor implementation modules and `editor-dom.ts` match the historical qualified bytes. `PostEditor`'s entire script/input/event handling remains identical; its only change is the localized message expression. Historical runtime observations retain their original candidate identities.

Final installed capture annotations retain a stale earlier candidate identity because helper closures retained their earlier values. The explicit metadata-correction receipt reconciles these unchanged raw annotations against exact frozen final runtime bytes and matching runtime/traffic tab IDs. The adjacent workspace readiness-warning translation has final application E2E coverage only, not an installed DOM observation.
