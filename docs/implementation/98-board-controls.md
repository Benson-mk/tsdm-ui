# Board filters, heading and pins — #98

## Failure inventory recorded before production changes

Approved seam: complete built userscript with actual workspace, editor, storage and forum client; only external HTTP/browser-host boundaries are substituted. No internal mocks or unit tests.

- Native heading statistics contaminate the title; structurally extract the direct board anchor and sibling statistics, preserve native labels/values, and omit absent statistics.
- Collapsed pins hide real destinations permanently, count unrepresented rows, reorder native rows, or retarget reading when disclosed. Count only represented pinned rows; toggle their visibility without navigation, keep source order and usable keyboard destinations.
- Expanded filters consume browsing space. The collapsed control must retain effective criteria/count and expose every returned menu/subgroup with native provenance.
- Selecting a tentative choice navigates or Cancel alters the active query. Neither may send a request; Apply sends exactly the returned URL.
- Guessed combinations, translated labels or sample Order precedence silently change meaning. Native category-active board16 evidence shows other menus drop category. Stage one exact returned destination, display complete proposed criteria and removed/changed criteria before Apply. Do not concatenate parameters; source-backed combined destinations remain intact.
- Clear invents a URL or discards reading/writing. Use only a qualified same-board native heading destination; stage it through Apply, retain the existing workspace reading/writing context.
- No-match results strand the user. Keep Filters/Clear available even when no rows return.
- Filter removes the selected row or pin collapse hides focused row. Return to a stable filter/disclosure control; never rely on a removed row for focus.
- Dialog spills outside 905px/390px at 125% text or loses Escape/focus. Use the established portal/dialog and bounded scrolling; test keyboard focus return and dimensions.
- New optional model fields break legacy navigation/consumer data. Validate optional fields, retain legacy fallback and run the external consumer check.

## Source research and plan

Read ADR0001–0003, existing board reader/filter provenance, navigation retention and board-check ownership, navigation recovery validator, prior #54/#84/#96/#97 journeys and prototype. Parent inspected current native board16: h1 direct board anchor followed by span.xs1.xw0.i statistics; distinct category/type/reward/More-sort/More-time/order native sources. Sort/order labels and values overlap but selector semantics differ. More native LI labels remain verbatim. Other menus drop an active category; composing arbitrary combinations is not qualified.

Vertical sequence: title/pin E2E red then minimal presentation/model; filter staged navigation E2E red then client metadata + dialog; writing/no-match/focus/narrow failure paths red then necessary fixes. Relevant regressions and external consumer, frozen build identity, installed Edge acceptance from parent, one commit after all criteria verified. Chrome qualification deferred by owner to #112.

## Delivered behavior and ownership

The forum client separates the qualified direct board-name anchor from its native statistics sibling. Optional `statistics`, `clearFilter` and `filterChoices` metadata are serializable and versioned in portable client 0.22.0; old structural Board values remain valid. Browser recovery validates the optional fields and leaves legacy records readable with an explicit reload requirement before staged filters become available.

The layout opens all returned native groups in a bounded dialog. One pending exact destination shows its native group/choice, proposed criteria and removed/changed active criteria. Apply alone navigates; Cancel/Escape leave the query untouched. Clear stages the qualified heading destination. Native selected category `li.xw1.a` supplies the current category's label even when its active link points to Clear. Reward-menu labels describe reward status and never rename the carried thread type. Sort/order selector distinctions remain explicit; native combinations are preserved verbatim.

Pins are hidden in place, counted from the current source's represented rows, and revealed without navigation or source reordering. Filtering retains the existing workspace reader and writing session, including source node/selection. A stable filter trigger receives focus even when the selected row disappears. Native filter responses may remove all pins; no independent pin filtering policy was introduced.

A responsive integration experiment reconciled the old UX54 raw-scroll assertions with actual visible-row identity/relative offset. It exposed resize capture occurring after CSS reflow. The bounded layout correction restores the last observed board anchor after raw pane restoration, using existing navigation ownership. Meaningful 390/768/1440 reflow, hidden 125% text, drawer/docking and editor continuity cases pass. Older full-width desktop and cross-reflow raw-scroll expectations were updated to the approved compact-width/visible-row contracts.

## Actual trade-offs

- Collapsed filters and pins reserve more space for ordinary rows but require an explicit reveal action, as approved in #95. Hidden pin DOM is retained in source order, keeping selected-reader identity and interleaved native ordering at the cost of retaining those nodes.
- One pending exact native destination prevents invented combinations and silent criterion loss, while limiting combinations to those offered by the current source. Apply confirms the visible replacement; it does not add a second confirmation dialog. Raw per-parameter values remain fallback where the native option names a combined destination rather than an independently qualified parameter; the actual selected group/option is shown prominently.
- A persistent proposed-change area keeps consequential filter removals beside Apply; choices and unusually long summaries have separate bounded scrolling and show fewer options at once on a narrow screen.
- Structural statistics remain a native text string. This preserves source labels, missing values and zero values without guessing numeric meanings, but does not offer independent sorting or translation of individual statistics.
- Additive source metadata increases serialized board snapshots and requires a portable minor-version update plus consumer qualification. Existing records remain readable; records without metadata need an explicit reload for reviewed filtering, and Clear stays unavailable without a qualified source destination.
- Responsive restoration now favors the last observed visible board anchor over the raw scrollTop measured after CSS reflow. The scrollTop can therefore change across widths. A cached complete-row fallback is used only when a heavily clipped row would disappear after shrinking; this adds a small local anchor record and can change that clipped row's offset to keep a usable row stationary. The fallback stays selected for the return resize. Navigation revision checks and existing pane restoration still control ownership.
- Dialog-local Escape handling adds explicit coordination with composition and child controls so the native body's keyboard veto cannot keep the dialog open. If responsive docking hides the opener, focus returns to the reachable Threads control.
- Complete-application E2Es and retained red/green artifacts cost more execution/storage than isolated tests and directly cover workspace/editor/storage integration. The exact125% host-boundary method and owner-selected Edge/Chrome cadence reuse #96/#97's recorded decisions; Chrome remains deferred to #112, not passed.

## Verification and replay

Use pinned Node24.22.0/npm11.21.1 and Playwright1.64.1 with installed Edge. From the committed checkout run `npm ci`, `npm run build`, then:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test:consumer
npx playwright test tests/e2e/compact-board-controls.spec.ts
npx playwright test tests/e2e/stable-board-browsing.spec.ts
npx playwright test tests/e2e/navigation.spec.ts tests/e2e/board-checks.spec.ts -g 'UX54|J2.boards-returned|J5.appearance-pinned|UI90.stale-context|UI90.writing-recovery'
npx playwright test tests/e2e/progressive-drawers.spec.ts tests/e2e/refined-navigation.spec.ts -g 'IM66.progressive|IM66.drawer|IM66.editor-continuity|UI82.browse-first|UI82.native-body-anchor|UI82.same-current-thread'
```

HTTP fixtures fail closed offline; there are no internal mocks and no live publication requests. Reports/manifests retain screenshots, request ledgers, geometry, exact source/build identities and browser annotations. Failures remain in their original run packages: initial missing build/charset setup, pre-feature title/pin/filter failures, reward/type provenance, offscreen proposal/removal, selected native-category labeling, and both obsolete and meaningful responsive assertions. Green reruns do not relabel those failures. Unchanged multi-minute scheduler cases were not rerun for this slice.

The parent agent owns installed Edge qualification and immutable source equality checks. The original inherited nine-failure inventory from #97 remains historical evidence; this slice replaces and passes its three UX54 discovery assertions with meaningful row-anchor cases. Other inherited failures remain for integrated reconciliation; this ticket does not claim whole-parent completion.

Installed follow-up failure inventory, before its correction: a row clipped to its last20px at300px column width can shrink by more than20px after390px reflow. Retaining its negative top offset makes that row invisible and drifts the next complete row on the return resize. The full-application expectation is to preserve the next complete row's identity/offset through905→390→905 while retaining the reader and issuing no board refetch. Normal partial-row/B1 behavior must remain unchanged.

Installed Escape follow-up: the observed native body handler prevents default Escape before the dialog library's window handler. Source-shaped complete-app coverage now opens at905 with a retained reader, resizes to390, settles the actual docked state, presses Escape from the dialog and a child control, reloads and repeats. It proves closure, reachable focus and no extra requests. The local handler follows the existing Settings dialog ownership pattern; no host-wide keyboard interception was added.

## Final criterion audit and retained results

Accepted userscript SHA-256: `85a4977bc7b69b8265c1a781a8b8bdcb1c768c40fdd6ed6700ca3b17cb8e9b4c`. The parent confirmed final installed acceptance on 2026-11-13 with Edge 157.0.4341.46 and Tampermonkey BETA 5.6.6242. The installed manager source matched before and after the affected checks.

Each ticket criterion is verified at the current owner-approved scope:

- [x] All native category/type/reward/sort/time/order groups remain available: `B3.staged-native`, `B3.native-meaning`, `B3.selected-native-category`, and installed source/group observations.
- [x] Collapsed effective criteria/count, deliberate Apply, inert Cancel, Clear and no-match recovery: staged-native and writing-focus cases verify exact requests, retained reader, editor source node, selection and writing target; installed filter observations confirm the unchanged live behavior.
- [x] Qualified navigation semantics: Apply sends a returned destination, with its proposed criteria and removals visible. Native active-category replacement and sort/order provenance are exercised; unsupported independent combinations are never composed.
- [x] Native heading hierarchy: heading-pins cases cover present, zero and missing statistics; only the direct qualified board-name anchor supplies the title.
- [x] Accessible pin disclosure: heading-pins cases verify named count, keyboard reveal/open/collapse, touch-size bounds, source order and stable reader on disclosure toggles.
- [x] Source-backed pin counts/filter semantics: staged-native and heading-pins cover returned entries and source responses that remove pins; no prototype-only pin policy or inferred order precedence is introduced.
- [x] Compact and 390px/125% fit, focus and writing: writing-focus, native-escape and installed geometry verify inner choice bounds, visible proposal/actions, removed-row focus and editor continuity. The clipped-row resize regression preserves the next complete row through the roundtrip.
- [x] Failure modes and externally observable expectations preceded production changes. Retained red runs use the built application and only external HTTP/browser-host substitutions; no unit tests or internal-module mocks were added.
- [x] Relevant E2Es and current installed qualification passed with replay artifacts, runtime/source hashes and preserved failures. Chrome is explicitly deferred by the owner to #112 and is not claimed passed.
- [x] Ownership and non-reply exclusions remain intact: source interpretation stays in the portable client, recovery validation in the host and UI state in the layout. No new publication action or storage schema is introduced. The external consumer passes for additive optional client metadata in 0.22.0.

Final evidence under `evidence/runs/`:

- `2026-11-13T10-56-09.281Z`: all 12 compact-board cases passed on the accepted hash, including native Escape after responsive docking and recovery.
- `2026-11-13T10-47-46.148Z`: all 10 affected resize/B1/discovery/drawer cases passed; resize code is unchanged in the accepted candidate.
- `2026-11-13T10-53-33.791Z`: existing Settings keyboard checks passed. This package also retains a filter-test timing failure: dismissal succeeded, but the focus assertion preceded docking. The final suite waits for the observable docked state and passes.
- `consumer-2026-11-13T10-28-23.226Z`: external packed client 0.22.0 compatibility passed; portable library bytes are unchanged afterward.
- `installed-98-85a`: final source equality, dialog Escape/focus, zero requests after cancelling a pending category, and six groups within the 310px inner width. Owner-authorized evidence reuse is explicit: `installed-98-75d` covers unchanged clipped-row restoration (maximum offset difference 0.25px and zero roundtrip drift); `installed-98-42be` covers unchanged filter/pin/native-source behavior. Earlier failed resize/Escape observations retain their failed status.
- `candidate-98-85a4977b`: exact executable, complete build-input archive, source diff, replay report and independent rebuild result. Extracted source reproduced the exact accepted userscript using pinned Node/npm and the existing qualified locked dependencies; the replay does not claim a fresh dependency installation or portable-library byte equality across symlinked build paths.

Typecheck, lint, formatting and diff whitespace checks pass. All evidence package manifests are verified for exact file coverage, byte size and SHA-256 before commit. The remaining inherited failures and deferred Chrome qualification belong to the parent integration/#112; they are not silently marked passed here.
