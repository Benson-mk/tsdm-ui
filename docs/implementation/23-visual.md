# Ordinary visual authoring — issue #23

## Failure inventory before feature code

The confirmed seam is application layout → workspace → forum client → browser host, with only HTTP replaced for deterministic evidence.

- Import/export or visual/source switches normalize casing, whitespace, CRLF, repeated formatting, unknown wrappers or references.
- Visual edits discard unaffected spans or incorrectly reinterpret pasted bracket syntax.
- A malformed or deeply nested input throws, truncates content or hides the complete source fallback.
- Undo/redo loses source or operates on a disposed view; a layout remount loses shared document history.
- Toolbar focus replaces the saved selection; composition/view changes lose actual CJK input.
- Nested font sizes multiply global Text size; 90%/100% spacing changes alter source or target.
- A pending submit/recovery completion overwrites later source changes.
- Formatted source is submitted optimistically without independent stored-source readback.
- Source-derived URLs load automatically or HTML executes in the editor.
- Interpretation uncertainty is lost across navigation/refresh and allows unintended submission.

## Named expectations

J5.editor-preservation: source→visual→source retains exact unfamiliar syntax; one visual text edit preserves unrelated source; publication confirms fresh saved source.
J5.editor-tools: ordinary formatting commands create independently expected BBCode with undo/redo and selection recovery.
J5.editor-lifecycle: appearance, layout/navigation and refresh retain complete source and target; composition changes defer.
J5.editor-fallback: malformed/deep source remains editable and protected references remain inert.
J5.editor-installed: actual native CJK IME and keyboard/focus in installed Chrome and Edge, tied to exact candidate bytes.

## Implementation and qualification boundary

`PostEditor` is the shared authoring body inside `SourceWriting`. Workspace writing owns one editor session for the writing-context ID; disposing a Vue view destroys only its ProseMirror view. Source and visual edits use the same reversible lexical document/history. Undo and redo survive reading/navigation remounts. Refresh restores acknowledged source, source-coordinate selection, target and interpretation uncertainty; it does not persist the undo stack.

The ordinary controls cover bold, italic, underline, strike, font, size, color, subscript, superscript, alignment, indentation, ordered/unordered lists, links, email, image URLs, emoticon tokens, named quotes and code. Unknown fragments and references are visible inert content. A protected-fragment notice directs deliberate edits to complete source mode. Failed conversion retains complete source. Pasted or typed bracket syntax with unresolved representation blocks publication; explicit source interpretation is required, including after refresh or an account text copy.

Source starts as the default editing mode. Toolbar commands preserve the selected source/visual range. Global Text size is applied once to absolute visual sizes; nested identical size wrappers retain both original source wrappers without multiplying scale. The source control and visual view share the existing composition deferral guard, so the final input event settles before a requested view change.

## Acceptance audit

- [x] Selective experiment reuse is pinned; shared codec/session and disposable Vue views are separate, and no editor instance is deep-reactive. See `23-provenance.md`.
- [x] All nineteen ordinary tools pass final application and broad `81de77c7` installed Edge/Chrome exact-source save/readback checks. Native spelling references and the representative native bold example retain their bounded attribution; see `23-installed/report.md`.
- [x] Application cases verify no-op source preservation, unrelated-span preservation, unknown/malformed/deep fragments, inert references, and complete source fallback with visible limitations.
- [x] Application and broad `81de77c7` installed checks verify undo/redo, native focus/selection, source fallback, navigation/refresh, appearance/viewport/single scaling and later-edit preservation. Actual Edge IME on `81de77c7` survives formatting and controlled save/readback. Historical Chrome human IME is carried forward only with verified unchanged-path equivalence; see `23-installed/report.md`.
- [x] New-thread, reply, Quick Quote and owned-edit views reuse the same editor and session. Full-application shared-context visual formatting cases confirm exact saved source and target/options/reference preservation. Draft integration belongs to its following ticket; the later full-release authoring matrix remains required.

The isolated implementation is reconstructed on accepted #22, commit `4f359b65c60ec83aaf69e782be22190f8c359c87`. Installed/native attribution and completed BDFL/Standards/Spec review are recorded in `23-installed/report.md`. All five feature criteria are verified; this does not claim full release qualification.

## Evidence and replay

Use the repository's exact Node 24.22.0 / npm 11.21.1 pair and locked dependencies:

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e -- tests/e2e/new-thread.spec.ts tests/e2e/writing.spec.ts tests/e2e/visual-editor.spec.ts
npm run test:consumer
```

The normal evidence reporter records receipts, reports, source/build identities, network ledgers and screenshots. Historical failures are retained separately. The initial red run `2026-10-21T17-19-06.011Z` fails at the absent Visual editor control. Later failure receipts exposed actual selection/recovery, non-text paste, multiword-font and account-copy-interpretation defects. Early runs used Node 24.22.0 with npm 11.12.1 accidentally; their receipts state this and are not exact-tool acceptance. Final validation uses npm 11.21.1 explicitly.

The pre-migration candidate passed 143/143 affected application cases in `evidence/runs/2026-10-21T17-40-59.139Z`, followed by the previously unexercised CRLF readback case in `evidence/runs/2026-10-21T17-43-01.622Z` with unchanged executable bytes. Its userscript SHA-256 is `82bf9b70d15014b050538c9c5cdf7e3243a6d4cd6ddf1458e8ba1baa168ad362`. Both receipts record Node 24.22.0 / npm 11.21.1. The clean public consumer passed at `evidence/runs/consumer-2026-10-21T17-42-32.088Z`; typecheck, lint, format and build also passed. Those synthetic package manifests were independently verified. A synthetic visual-editor screenshot was inspected for layout. Synthetic fixtures establish application behavior, not current server acceptance or native IME.

The strict TypeScript candidate passes all 144 affected application cases together at `evidence/runs/2026-10-21T17-50-32.858Z`, including the CRLF readback case. The receipt records Node 24.22.0 / npm 11.21.1 and userscript SHA-256 `f9b9d1895638b1e9f57e5df832aae7f611e4f865360413a5ca02d4fd47a3d5b0`. Strict typecheck, lint, format and build pass; compiler file listing confirms all five implementation modules and their shared internal types are included. The evidence package manifest is verified. The public forum-client executable remains byte-for-byte unchanged at SHA-256 `b156110866a90cc8f31999c8dfc03e4a96696703ab2620acaf20ee1e0d7d67bf`, so its existing consumer evidence is retained without claiming a new consumer run.

## Historical installed/live verification proposal

After the integration owner has a concrete authorized target and candidate, compare installed-source bytes in Edge and Chrome with the candidate. In each browser, inspect unknown/source/reference content without changes, exercise keyboard selection and undo/redo, enter real CJK text through the OS IME, cross 90%/100% Text size with nested sizes, change language/theme/viewport and navigate away/return/refresh. Use one explicitly authorized composition per required browser workflow, submit it once, and independently fetch current saved source/options/actor/target. Record server normalization separately. Keep later edits during an earlier completion, and preserve the exact candidate/attempt evidence. No live action is authorized by this proposal.

## Actual trade-offs

1. Selectively adapt the pinned codec/session, then migrate its five implementation modules to strict TypeScript. This preserves the established preservation algorithm while checking internal AST, provenance, commands and history instead of trusting declaration facades. The cost is maintaining explicit local contracts alongside ProseMirror’s dynamic attributes, with narrow schema/index invariant assertions; no broad `any`, whole-file suppression or compiler relaxation is used. Discriminated raw-node replacement replaces mutable tag-kind changes so the parser stays typechecked.
2. Use ProseMirror's document/selection/view machinery and pinned dependencies. This avoids recreating browser editing behavior but increases the userscript bundle and dependency surface. The raw forum-client library does not import the editor.
3. Keep source as the initial mode so the complete-source fallback and existing authoring behavior remain directly accessible. Visual editing is an explicit mode switch.
4. Render source references as inert visible atoms and restrict font/color/size CSS to bounded values. This avoids automatic network requests and executable content; authoring does not provide remote image previews or reproduce every unknown visual style.
5. Import clipboard content as plain text, preserve source-bearing reference text on copy, and refuse non-text paste without deleting selection. This protects the document from browser HTML normalization; pasted external rich formatting is not imported.
6. Keep document/history in the workspace session across view mounts, while persisting only source/selection/context and an interpretation blocker for refresh. This avoids serializing library object graphs; undo history and fine-grained interpretation choices do not survive refresh, so recovered ambiguity requires deliberate complete-source review.
7. Use a shared format selector/value control instead of a large ribbon or many popovers. All ordinary commands remain keyboard-accessible and localized, at the cost of less immediate discoverability and explicit value entry for URLs, fonts and emoticon tokens.
8. Retain the codec's table/hidden/reference preservation machinery while withholding their controls for #24. This preserves existing content and a single document model, but carries some dependency/code weight before those controls ship.
9. Generate new formatting in captured native syntax while preserving all imported spelling. Named quotes use a visible author line within ordinary quote markup; this avoids inventing native semantics but does not create a post reference or guarantee notification delivery.
10. Reuse existing complete authoring/recovery cases and keep the new network fixture local to the editor spec. This exposes cross-feature regressions without introducing a unit layer, but duplicates a small fixture boundary instead of undertaking a test-harness refactor during editor implementation.
11. Preserve and report synthetic/installed/live evidence separately. This allows deterministic progress without unapproved writes, while leaving the required native/installed acceptance work explicit and preventing an incomplete acceptance commit.

12. Compare viewport preservation with the actual initial relative position using the existing one-pixel tolerance. This tests retained reading context while accepting browser subpixel scroll quantization; it does not require an initially scrolled paragraph to align with a mathematically exact pane origin.

13. Integrate the isolated accepted ticket tree while preserving the broader root working overlay for later tickets. This avoids losing pending work or silently accepting later features; it costs explicit per-file reconciliation, separate artifact identities and additional integration checks.

14. Translate known authored editor diagnostics at the UI boundary, retaining the qualified codec/session and passing unexpected diagnostics through unchanged. This avoids changing the editor error protocol but requires maintaining exact message mappings when core wording changes.

## Current ticket reconstruction

The original strict-TypeScript ordinary editor was applied to accepted #22. `SourceWriting` delegates body editing to `PostEditor` while retaining accepted reply/Quick Quote/owned-edit controls. Workspace reconciliation combines the editor readiness/selection owner with the existing source, target, option, mention, revision and attempt guards. No ordinary editor-core or DOM-view behavior changed from the pinned historical #23 implementation. Later table/hidden-block controls and their adaptations were not imported from the mixed working copy.

The additional `J5.editor-shared-reply`, `J5.editor-shared-quote` and `J5.editor-shared-edit` cases apply visual formatting and confirm exact independent saved-source readback in those existing contexts. All three passed three targeted repetitions without executable changes. Their failure inventory preceded any potential integration correction; no feature correction was necessary.

The inherited reading resize check failed at 1.015625px in both this candidate and a separately exported/build-verified accepted #22 baseline. Geometry diagnostics showed a starting offset of -0.015625px and a final offset of -1.015625px. The expectation now measures displacement from the actual initial paragraph/row position, retaining the existing one-pixel limit and all DOM identity/history/request checks. It passes three repetitions. This changes verification precision, not production scrolling.

The broad `81de77c7` combined Edge suite passes **275/275**, zero retries, at `evidence/runs/2026-10-23T03-47-01.958Z`. Its clean public-consumer evidence is `consumer-2026-10-23T03-40-06.712Z`; its library entry remains unchanged. See `23-acceptance.md` for the completed criterion-to-evidence map.

A fresh independent Standards review subsequently found untranslated authored command/session explanations. BDFL validated this P2. New full-application failure expectations reproduced the issue before the three-file presentation correction; screenshot review also exposed and reproduced the adjacent readiness translation omission. Final independent Standards and BDFL reviews confirm zero outstanding code findings. Final `d5f25133` passes **288/288**, zero retries, at `evidence/runs/2026-10-23T04-30-04.075Z`; public-consumer evidence is `consumer-2026-10-23T04-24-58.476Z`. Final installed localization, source/selection and controlled save/readback are separately attributed in the installed report. Its metadata-correction receipt preserves stale helper annotations and uses exact runtime bytes to establish final identity. The actual IME and nineteen-tool installed evidence retain their earlier candidate identities.
