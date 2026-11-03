# Reader hierarchy — #55

Base verified before feature code: integration `feat/improve-ui-ux` at `549f3912f64178e70ebb77b6617b473aa4d91361`; isolated branch `implement/ui-ux-55`.

## Before-code failure inventory and test plan

Confirmed seam: built userscript → real layout → workspace → forum client → browser host. Substitute only external forum HTTP, using an isolated Edge context with fail-closed offline routing. No internal mocks or after-code unit tests.

Reachable failures: long author names or dates exceed a flex header; an inline prose URL inherits control geometry; nested quotes reduce available measure; wide code/table escapes its already named region; a global breaking rule damages code/table structure; clipping hides ordinary prose; repeated unsupported wrappers obscure content or duplicate warning text; grouping removes protected content or actionable warnings; grouping across posts loses local meaning; guessed author identity associates another member's filter; stale page/filter context alters returned URLs; unknown/ambiguous identity is falsely labelled; filter click or resize causes extra reads/effects; language/theme/text preferences lose hierarchy or native content; footer changes break reply/edit semantics, source, recovery, account or attachment guarantees.

Named complete-app expectations written before feature code in `tests/e2e/reader-hierarchy.spec.ts`:

- `UX55.reader-*`: full title, long prose/URL, actual ancestor geometry, distinct author/floor/date/quote/actions and bounded keyboard-scrollable structure at representative widths/preferences/themes/locales, plus resize.
- `UX55.notices`: consolidate repeated same formatting per post with available details; preserve children, distinct unsupported/hidden/permission meanings and per-post scope.
- `UX55.author-filter`: established author URL identity controls placement/name; exact returned URL, keyboard activation and passive Back without extra HTTP.
- `UX55.unknown-filter`: absent or ambiguous identity remains generic, no guessed author or effects.

Planned preservation coverage: existing rich thread, navigation/session/recovery/source/account/attachment/reply/edit uncertain-outcome application journeys. Changes touch no portable contract unless later evidence requires it. Installed Edge and final BDFL are root-owned acceptance gates; Chrome is scheduled for #62 by owner direction. No commit before root acceptance.

## Diagnosis

Repeatable minimal whole-app red: `npx playwright test tests/e2e/reader-hierarchy.spec.ts --grep native-wrapper-prose`, run `evidence/runs/2026-11-03T08-07-54.329Z`. A native `.pcb` contains a layout table with `td.t_f#postmessage_ID`; the parser preferred `.pcb`, treating that layout as authored content. Measured article364/header316/content316 are bounded, while the named table region is316px with401px content. Installed real forum observation independently measured316→448 for the same native structure.

Ranked falsifiable hypotheses before correction: (1) selecting actual native postmessage contents removes only the layout table; (2) prose links inherit control layout and independently overflow; (3) intrinsic quote/table sizes persist after selecting the content boundary. One-variable rendered-DOM extraction in `08-08-39.101Z` changes region401 to no region and prose remains316/316; restoring the wrapper restores401. This isolates hypothesis1 without changing CSS. The initial selector-only correction passed the minimal prose case but failed the subsequently identified native-sibling case (`08-10-53.272Z`). The final correction retains the whole `.pcb` and unwraps only native table structure identified by ancestry of the exact `postmessage_ID`; sibling content, permission notices, and nested authored tables remain intact. The long URL/quote hypothesis was falsified by all four representative profiles: existing wrapping already works, so no new prose-wrapping CSS was added.

## Actual trade-offs

1. Use exact native `postmessage_ID` ancestry to unwrap forum layout table structure, retaining whole-container siblings and existing mobile/fallback behavior. This is more selective than treating every one-cell table as layout; unknown structures retain the existing bounded table rendering.
2. Put author above smaller floor/date/permalink metadata and group contextual actions after content. Actions require reaching the post end, while the reading flow and quote boundaries remain distinct without adding avatars or large decorative gaps. Existing quote styling/reading measure are retained.
3. Consolidate formatting notices only when a formatting kind repeats within a post; keep content in place and list all formatting kinds/counts in one keyboard disclosure. This trades inline location of duplicate explanations for a concise post summary. Interactive/hidden/permission and actionable explanations remain inline; other ContentView callers retain existing behavior.
4. Associate filters only from actual native controls (`.pi`/`.authi` or the established `postlist_filters` container), through same-thread URL and consistent known native-profile author identity, with exact returned URLs. Post-body references and pagination carrying author context are excluded; unfamiliar author-control structures require native continuation instead of guessed promotion. Missing/conflicting/foreign identities retain explicit generic author-filter labels. Contextual actions can repeat beside multiple posts by the same author, keeping placement local without introducing new public metadata or guessed associations.

5. Identify changed portable parsing behavior as patch 0.14.1 while keeping serializable models and required host/client methods unchanged. Consumers can pin the corrected behavior but need a new exact artifact; no shape migration is introduced.
6. Use representative appearance combinations and rerun the affected final paths after corrections, retaining broad earlier-candidate coverage with its original identity. This reduces repeated unchanged journeys while keeping the final candidate's narrower fresh scope explicit.

## Verification and acceptance

Final userscript SHA256: `fa932f8cb99b4bdf82f4d6e39541ad84b8ce2f49f91f5e471f6a696c1b500b4e`. Portable runtime patch0.14.1; no model shape/method/host contract changes. The exported version constant and package/consumer guards agree. Updating the portable-only constant from0.14.0 to0.14.1 leaves the exact userscript bytes unchanged (unused public export is removed from its build).

Pinned Node24.22.0/npm11.21.1 build, typecheck, ESLint, formatting and diff checks pass. Vite's existing future native-loader warning remains.

- `evidence/runs/2026-11-03T08-14-11.849Z`: broad **340/342** affected Edge cases passed on c2c346e2, including all10 initial UX55 cases, appearance, navigation, account/recovery/source preservation, replies/edits/uncertain outcomes and attachment behavior. Two old narrow download entry steps attempted controls behind Navigation; the preserved failures were corrected with an ordinary visible reveal step.
- `evidence/runs/2026-11-03T08-20-41.308Z`: **26/27** final-runtime affected Edge cases passed on fa932f8c, including both corrected download steps, rich native content, session/real302/remount, all10 prior UX55 cases, unknown/conflicting/foreign profile identity and faithful native message layout. The new provenance case passed its functional assertions but used an incorrect pager accessible label.
- `evidence/runs/2026-11-03T08-22-02.845Z`: corrected label expectation makes that provenance case **1/1** pass against the identical fa932f8c runtime. Author control remains one contextual action; carried pagination stays in its existing top/bottom pagers, and authored filtered links stay content.
- `evidence/runs/consumer-2026-11-03T08-22-54.134Z`: clean packed **0.14.1** external Node consumer passes with DOM/Vue/GM-free package boundary and existing serialized/structural contracts. Earlier consumer failed receipts (`08-21-12.054Z`, `08-22-10.224Z`) retain the old version-guard/constant mismatch rather than being relabelled.

The appearance matrix uses390×844 default/light/English;390×844 enlarged150%/dark/Simplified;768×900 derived Compact70%/mono/Traditional;1440×900 enlarged150%/alias/English, plus resize through768→390→original. All four themes, three languages, ordinary prose, long mixed-language URLs, nested quotes, protected content and named table/code keyboard scrolling are covered. Changed presentation/filter journeys assert GET-only ledgers and no extra reads from resize or passive Back. Existing preservation journeys retain their original candidate identities.

Synthetic screenshots were visually inspected: native Chinese prose wraps within the article, author/floor/date/permalink remain distinct, quote boundaries are visible, and the concise formatting disclosure precedes contextual post actions. Two paint frames before screenshot capture avoid known post-resize compositor remnants; no runtime workaround was added for capture artifacts.

## Retained red and diagnostic evidence

Every run above retains report/receipt/manifest, replay fixture snapshots and synthetic screenshots/state/request artifacts under its own directory. The runtime source hashes from every historical red receipt were independently matched; historical userscripts were rebuilt byte-identically using pinned inputs and retained under `evidence/runs/55-candidates-2026-11-03` with exact source archives, build identities and manifests.

- `08-06-13.189Z`: initial synthetic script lacked UTF8 content-type; browser rejected a Unicode regex before mount. Fixture encoding corrected.
- `08-07-16.412Z`: URL assertion expected unescaped CJK path; corrected to the standard encoded URL while retaining full visible source text.
- `08-07-54.329Z`: minimal actual native message layout produces an unnecessary scrollable table (316→401px).
- `08-08-39.101Z`: one-variable DOM extraction makes that layout overflow disappear, restoration reproduces it.
- `08-09-52.687Z`: first selector correction passes native prose/URL geometry, exposes still-unimplemented hierarchy/summary/filter expectations.
- `08-10-53.272Z`: selector-only narrowing drops meaningful siblings, driving native-layout unwrapping while retaining the whole container.
- `08-12-19.694Z`:8/9 feature cases pass; fallback text was present beside a notice, so exact-element lookup was corrected to visible content containment.
- `08-13-18.388Z`: foreign profile UID incorrectly establishes author association before strict native-profile validation.
- `08-19-20.766Z`: pager and authored body links create3 contextual actions before native-control provenance correction.

## Replay and acceptance gates

Use pinned toolchain on PATH; `npm run build`, `npx playwright test tests/e2e/reader-hierarchy.spec.ts`, the affected navigation/appearance/responsive/reply/edit/download suites above, and `npm run test:consumer`. `npm run evidence:verify -- <run-directory>` verifies reporter and consumer packages. Historical failures are retained independently; no after-code unit tests were added.

- [x] Complete titles, distinct author/floor/date/quotes/actions, existing restrictions/metadata/reading measure/pagination verified at all three widths through complete-app Edge cases.
- [x] Actual native wrapper overflow reproduced, ancestor geometry inspected and correction experimentally isolated before CSS; prose/URLs remain fully visible without global breaking or hidden overflow.
- [x] Authored wide table/code structure and named bounded keyboard scroll preserved, including a real authored one-cell table.
- [x] Repeated same formatting consolidated per post with available details, all retained children, protected/hidden/interactive/permission meaning preserved.
- [x] Correct native identity/control association and generic unknown/conflicting/foreign fallback verified, exact returned URLs and passive restoration without extra effects.
- [x] Before-feature failure inventory and named complete-app expectations at the approved seam; new discovered regressions red before each correction.
- [x] Representative widths/text/Compact/themes/locales/keyboard/resize and relevant preservation/no-effect guarantees verified.
- [x] Final installed Edge changed workflow and final BDFL validation passed for the exact fa932f8c candidate. Owner schedules Chrome in#62; the installed/synthetic evidence scopes remain distinct.

## Installed acceptance and final BDFL disposition

Root verified the final fa932f8c userscript through exact manager-source readback, with one enabled script and one workspace. In a fresh native thread, ordinary Chinese prose previously rendered inside a316px scroll region with448px contents now remains plain316/316px content with no authored table introduced. A real quote retains its blockquote boundary, and all10 observed native author controls are associated with the correct authors. Keyboard activation follows the exact returned filter URL and shows two posts by that author; passive Back restores the10-author view and the same504.5px offset without HTTP.

Installed appearance checks cover390×844,768×900 and1440×900 with150% Text size, Dark and Traditional Chinese, with bounded content and no horizontal overflow. Root restored100% Text size, Alias, English and the normal viewport; the exact unsent CJK source remained unchanged. The final untruncated ledger contains125 GETs and zero POSTs. No publication, forum-draft save, upload, removal or spending was performed. No live unsupported-format variant was present; final synthetic coverage establishes that variant explicitly rather than claiming a live observation.

Persistent integration evidence is `evidence/runs/55-installed-edge-2026-11-03/`, containing report, receipt, manifest and exact candidate artifacts. Root copied all ignored synthetic/consumer runs and source candidates into integration and independently verified the final83/32/10-file manifests. Earlier340/342 and26/27 receipts remain failed at their original scopes; subsequent targeted passes resolve their recorded failures without relabelling them.

The designated gpt-6.1-sol/xhigh BDFL advisor applied validate-gpt-code-review to the final fa932f8c implementation and evidence, confirmed no remaining actionable findings and added no distinct trade-off. All eight acceptance criteria are verified under the owner's Edge-per-ticket and Chrome-in#62 schedule. Parent#52 remains unchanged.
