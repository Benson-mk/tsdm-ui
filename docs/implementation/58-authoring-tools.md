# Direct formatting and advanced authoring tools — #58

Base before feature code: clean integration `d86422e122ed7971584be1ef17333c47cb24ec18`, isolated `implement/ui-ux-58`. Canonical #52/#58, domain glossary, ADR0001/0002/0003, existing editor/session/commands, source/visual/advanced/table/mention/attachment and owned-edit journeys read before implementation. Flutter's mobile collapse/desktop expansion is a reference for contextual tools, not a prescribed desktop sheet.

## Before-code failure inventory and plan

Confirmed complete-application seam: built userscript → layout → workspace → forum client → browser host; only external forum HTTP is substituted. No internal mock seam or unit tests.

Reachable failures: direct buttons apply wrong command or lose selection on pointer/keyboard activation; a disclosure switches mode/converts source or emits lookup/effect; argument fields for irrelevant commands stay visible; hidden fields leak a stale value into another command; ordinary commands bypass composition/eligibility guards; explicit source-first or active mode becomes unclear; exact unfamiliar/protected markup, CRLF, table/hidden/mention/attachment source changes on inspection; failed command loses source/selection or hides refusal; continued typing or Undo/Redo fails after tooling; table drag/rectangle/keyboard semantics regress; mention disclosure resolves a native identity without deliberate action or drops account binding; active account/recovery/conflict/conversion/uncertainty/financial warnings disappear inside closed tools; widths/locales/enlarged text clip or horizontally scroll primary controls.

Plan: keep existing editor/session command semantics and mode switching. Replace generic ordinary-format configuration with direct named buttons. Deliberately disclose named advanced groups and show an argument field only for the selected parameterized tool. Keep table and mention operations on existing guarded workspace/session methods; disclosure only changes local presentation. Use existing whole-application cases as preservation oracles and add UX58 journeys before runtime changes, including independent page-session/request readback, retained screenshots, pointer and keyboard use. Root owns installed Edge/native observation and final BDFL gate; owner defers Chrome to #62 and treats Tampermonkey beta/stable equally.

## Actual trade-offs

1. Keep seven frequent operations directly named in the ordinary surface: Bold, Italic, Underline, Strike, Unordered list, Ordered list and Code. The remaining supported operations take one deliberate advanced-disclosure step. This reduces ordinary configuration and persistent tool density while making less frequent operations less immediate.
2. Use one native disclosure with named fieldsets for text appearance, links/media, quotes/hidden content, tables and mentions. The same desktop groups wrap at smaller widths instead of becoming a mobile sheet. Native keyboard disclosure avoids another dialog/focus lifecycle; opening the full advanced set uses more vertical scrolling than opening a single narrow tool group. The retained editor DOM/history stays mounted, and disclosure state is transient rather than recovered.
3. Parameterized tool selection reveals one command-specific argument field and a named Apply action; changing the selected parameterized tool clears its unapplied argument. Commands without arguments dismiss the previous field. This prevents irrelevant/stale values leaking between tools, at the cost of re-entering an unapplied value when returning to a different tool.
4. Actual formatting retains the established source-selection-to-visual command path and focuses the visual editor after the command. Source-first initialization, explicit mode switches and inert disclosure remain. This avoids adding a second source transformation/eligibility path; a successful formatting command initiated in source mode still activates visual mode, as the previous generic Apply did. Active mode has an accessible pressed state plus visible weight/outline. A later exact differential confirms that this unchanged command path can also mark the following CRLF at a selected line boundary; both CRLF byte sequences remain intact. That inherited serialization boundary is retained here rather than silently normalizing supported source semantics.
5. Move the existing mention search/results presentation into the editor's named advanced group, keeping the same workspace methods, current native identity resolution and account/composition guards. This removes a permanently visible remote-tool area while adding mention presentation to the editor component; it neither adds a resolver nor changes attachment/operation ownership.
6. Keep ordinary post options visible under the ticket's optional “may be disclosed” scope. This retains their current visual density while avoiding hiding meaningful selected/disabled values and financial/access settings in a new disclosure. Account, recovery, conflict, conversion, pending/uncertain and financial warnings remain outside the closed advanced group.

7. Bound installed native verification to a physical owner CJK commit followed by independent exact readback and real UI formatting/history operations. The visual AX selection attempt targeted the wrong line and was undone; the accepted visual command uses a standard DOM Range verified against the exact visible phrase. This qualifies the command/selection path and native focus while leaving physical visual mouse-range selection unclaimed. The physical-input request ledger was truncated during the wait; a fresh complete zero-request tool/layout ledger retains its narrower scope.

## Acceptance mapping

- [x] Frequent commands are direct named buttons; parameter fields are command-specific; active source/visual mode is pressed and visually distinct. Source-first initialization and explicit switches remain.
- [x] Named advanced appearance, links/media, quote/hidden, table and mention groups retain all supported tools. Ordinary options remain visible, including selected/disabled semantics. No active warning moved inside the disclosure.
- [x] Whole-application selection-based source/visual formatting, continued typing/Undo/Redo, protected/unfamiliar syntax, CRLF, tables, hidden content, mentions and attachments pass. Localized refusals retain exact source and selected words.
- [x] Existing command eligibility/composition/native mention/attachment guarantees verified in affected application journeys; installed physical CJK, exact formatting/history/focus and inert disclosure evidence pass at the recorded scope.
- [x] Three widths/locales and keyboard disclosure/activation work; owned editing and persistent option journeys remain part of affected verification.
- [x] Failure inventory and named application expectations preceded feature/corrections. Only external HTTP substituted; independent state/request readback and repeatable artifacts retained.
- [x] Representative390×844,768×900,1440×900;100%/150% and70% Compact;Light/Dark/Mono/Alias;English/Simplified/Traditional, keyboard and resize pass without editor horizontal overflow or presentation effects.
- [x] Static/build and316-case latest union pass with exact evidence; source/spec/synthetic and final installed BDFL validation pass with no actionable findings. Owner defers Chrome to #62.

## Application verification and exact candidate

Frozen userscript SHA-256 `81538579c32996297a8d344df3c86d9d54e0e684ca1489c79b43ac70594375bc` (1,744,249 UTF-8 bytes). No forum-client, workspace or editor-session contract changed. Typecheck, ESLint, formatting, build and diff checks pass. Vite retains its existing future native-config-loader warning.

Private evidence lives under `evidence/runs/`; `58-candidates-2026-11-03/index.json` retains exact per-run source archives, source manifests, distributed userscript/meta/build manifests and SHA-256 manifests. Reporter directories retain authentic outcomes, screenshots, state/request readbacks and scenario snapshots. Earlier failures remain failures.

| Run                        | Observation                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-03T12-11-03.357Z` | Pre-feature red: table tools are permanently exposed.                                                                                                                |
| `2026-11-03T12-11-22.600Z` | Pre-feature red: advanced disclosure does not exist.                                                                                                                 |
| `2026-11-03T12-12-39.223Z` | Initial1/9: disclosure passes, eight tests assumed the inherited redo source caret was the word end. Named formatting itself preserves the expected source.          |
| `2026-11-03T12-14-02.369Z` | Initial20/20: direct source/visual journeys, all ordinary formats and localized refusal/selection cases pass after test-only deliberate subsequent-caret correction. |
| `2026-11-03T12-14-54.669Z` | Red-before-correction: a no-argument command leaves the previously selected Font argument visible.                                                                   |
| `2026-11-03T12-15-23.421Z` | 58/59: editor/advanced cases pass except old table-after-reload helper trying a correctly collapsed tool. Helper now explicitly discloses it.                        |
| `2026-11-03T12-16-48.722Z` | Red-before-styling: mode is announced pressed but has no distinct visual weight.                                                                                     |
| `2026-11-03T12-17-20.898Z` | Frozen81538579:79/79 editor/advanced/presentation cases pass, including the initial10 UX58 cases and prior57 native-engine/raw-retention controls.                   |

During diff inspection an accidental loss of the compact visual selector prefix was found and restored before the frozen candidate; this was an unintended broadening of CSS, not a selected presentation policy. Its original passing/failed run packages remain unchanged.

Inspected frozen screenshots for390×844/150% Dark/Simplified retained source and the open named advanced groups/link argument. Source remains below the reserved presentation strip; groups and applicable field wrap without page-wide overflow. Also inspected the repeated direct toolbar screenshot with clearly outlined/bold active source mode, seven named common controls and closed advanced tools. Installed and final review findings remain with root.

Replay with pinned Node24.22.0/npm11.21.1 and installed Edge, unpacking the exact selected source archive. Use `npm ci`, `npm run build`, and compare the distributed userscript hash before running:

```sh
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/visual-editor.spec.ts tests/e2e/advanced-editor.spec.ts tests/e2e/writing-presentation.spec.ts
npx playwright test tests/e2e/replies.spec.ts tests/e2e/edit-post.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/drafts.spec.ts tests/e2e/attachment-authoring.spec.ts tests/e2e/funded-drafts.spec.ts tests/e2e/authoring-integration.spec.ts tests/e2e/draft-attachments.spec.ts --grep 'mention|editor-shared|rich|conflict|uncertain|attempt-recovery|funded-draft-lifecycle|funded-draft-original-check|J8.editor-cell|J8.editor-composition'
```

These fixture commands exercise only substituted external HTTP, including simulated writes; they provide no authority for live forum effects.

## CRLF boundary comparison

Two additional strict-literal CRLF expectations failed on frozen815385 (`2026-11-03T12-21-25.945Z`): selecting `words` in the source-projected visual document produced `[b]words[/b][b]\r\n[/b]`, rather than leaving the following line break unmarked. The original run remains11/13, including the successful mention-replacement helper recheck.

Applied diagnosing-bugs with a0.4-second application loop. Ranked hypotheses before the comparison: inherited formatter projection/serialization; direct-button selection/focus regression; CRLF display-offset boundary. The controlled four-case differential (`2026-11-03T12-23-08.611Z`) passes the observed literal result on baseline32a02 generic Apply and frozen815385 named Bold, in both source and visual modes. All four select exactly `words` from the same DOM range, preserve the original two raw CRLF sequences and surrounding unknown/attachment syntax, and make no effectful request. This establishes unchanged behavior, not the internal cause and not a formatter correction. Root confirms retaining that existing serialization under #58's no-source-semantic-change scope. The final CRLF expectations explicitly assert it.

The comparison is diagnostic evidence, not a four-case current-candidate qualification run: two cases deliberately route baseline32a02 from its exact retained executable, while the reporter's default candidate field identifies the current815385 dist file. Per-case attachments identify the actual baseline/current route and before/after source and selection. The temporary comparison spec is removed from maintained tests and retained in its exact archived source plus `/private/tmp/tsdm-ui-implementation-52/58-crlf-comparison.spec.ts`. Original failed strict expectations remain immutable.

## Final application result

Frozen815385 now has a latest named-case union of316/316 passing complete-application Edge cases, including all12 UX58 cases. This is a union, not a claimed single rerun:79/79 editor/advanced/presentation,151/152 affected mention/attachment/conflict/uncertain cases plus its deliberately reopened replacement-helper recheck,15/15 targeted direct/CRLF/attachment cases, and81/81 writing-entry/navigation/recovery/composition cases. `58-candidates-2026-11-03/latest-case-union.json` maps each named case to its authentic latest receipt. The strict-literal CRLF failures and diagnostic baseline comparison are preserved and excluded from pass claims.

Final typecheck, ESLint, formatting and diff checks pass; integration merge check reports Already up to date atd86422e. Runtime remains the exact frozen815385 executable. Maintained diagnostic comparison/probe code is absent. All13 per-run exact source/build packages verify. No commit has been created. Installed Edge/native results and final BDFL acceptance are recorded below; all eight criteria are verified before the ticket commit.

## Advisor source/specification and synthetic-evidence validation

The designated BDFL independently verified all13 source/build packages and reporter artifacts, recalculated the316/316 latest named-case union including12 UX58 cases, checked representative screenshots and validated the unchanged CRLF boundary comparison. No actionable source/specification finding or distinct additional trade-off remains. Keeping ordinary options visible satisfies the ticket’s optional disclosure clause. The final installed audit below satisfies the remaining native/focus/formatting/appearance and no-effect evidence gate.

## Installed Edge evidence

The exact manager-stored815385 source matches (1744249UTF-8bytes/1693573characters). The owner physically committed測試輸入 in foreground tab914; UI/storage readback confirmed361characters/rev21. Source Bold, exact verified visual Italic, continued source/visual typing, Undo/Redo, focus and byte-identical advanced-disclosure retention passed. All temporary formatting/test characters were undone. All361 owner characters and original account/target/options/attachment identities remain exact, unsaved, focused at selection361 (revision56). Earlier wrong-tab owner entries are preserved, not used as current-candidate native passes.

The actual390/768/1440 widths were confirmed through layout metrics after an ineffective high-level override attempt. At owner-approved150/Dark/Simplified, all five advanced group scroll/client widths agree; source is exact. Original100/Alias/English and browser sizing were restored. The fresh bounded tool/layout ledger contains zero requests with no truncation. The separate physical-input ledger remains incomplete and is not promoted to a no-effect proof. Exact artifacts/report/receipt/manifest are in58-installed-edge-2026-11-03. Final installed BDFL validation passes; all eight acceptance criteria are verified at the recorded owner-authorized scope, with no actionable finding or additional distinct advisor trade-off.
