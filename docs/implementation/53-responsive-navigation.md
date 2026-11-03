# Navigate and read comfortably across narrow and wide windows

Ticket: #53, part of #52. Integration base: `3f4d91d` on `feat/improve-ui-ux`. The prior board filter and top pager are already committed; they are preserved independently of this ticket's acceptance.

## Before implementation

Confirmed seam: built userscript → real layout → workspace → forum client → browser host, with only external HTTP replaced. Use Edge. No unit test layer. Installed Edge/Chrome checks remain separate and are coordinated by the driving agent.

Reachable failure modes:

1. Persistent header/action/navigation rows leave less than half the 844px reader viewport or clip primary controls in translated/enlarged text.
2. Disclosure steals focus, Escape navigates unexpectedly, closes an IME composition, changes reader position or hides a warning.
3. Disclosing navigation or resizing mutates the selected thread/post, retained writing, request state or repeats search/notice/write effects.
4. Reclaiming an absent results track also removes populated results or loses their selected row, returned filter/page URLs and nonzero reading offset.
5. Narrow-only navigation becomes inaccessible at medium/large transitions or native continuation is hidden without a reachable entry.
6. Appearance and locale changes overflow the shell; prior directory filtering and top/bottom thread pagination regress.

Budget selected before feature code: at 390 × 844, ordinary signed-in thread, default text/spacing, hidden retained writing and no blocker, persistent chrome ends by **240 CSS pixels**, leaving at least **604 pixels** before reader padding and at least **422 pixels** actual scrolling pane. Navigation and routine secondary authoring actions will be deliberately disclosed. Active warnings are exempt from this ordinary-state budget and remain expanded.

Baseline measurement and failing expectations will be retained by the existing evidence reporter before modifying feature code.

The unchanged built application measured **412.28125px** persistent chrome and **431.71875px** reader height at 390 × 844, matching the specification's approximately 414px observation. The first preimplementation E2E failed the selected 240px budget as expected. Baseline report, receipt, manifest, geometry JSON, screenshot and scenario snapshots: `evidence/runs/2026-11-03T06-49-48.220Z/`.

Implementation plan: preserve all workspace navigation and writing owners. Add a nonmodal, guarded narrow disclosure with a named current destination, explicit expanded state and Escape return to the opener; retain the existing controls in place. Keep all active warnings outside the disclosure. Reclaim only the genuinely absent thread results track, retaining populated result panes and the existing return adapter. This introduces no persistent schema or portable-model change.

## Delivered presentation and distinct trade-offs

1. Narrow navigation uses an **inline nonmodal disclosure**. Opening keeps focus on its button, Tab follows the ordinary page order, and Escape closes it and returns to its button through the existing composition guard. This keeps the editor and reader mounted and avoids a second portal/focus boundary; the disclosed controls temporarily consume reader height, and the page remains keyboard reachable rather than trapping focus.
2. **Settings stays directly reachable** beside the account and navigation entry. Its persistent row costs space but keeps appearance adjustment available without opening navigation. Final ordinary chrome is 185.1875px, within the 240px budget.
3. Direct wide-thread arrival **retains orientation rails while reclaiming only the absent results track**. This preserves familiar board/destination access while using less width than a completely rail-free reader; populated board/search/favorite/notice result contexts keep their existing panes.
4. The existing **959px breakpoint is reflected in the layout's resize state** as well as CSS, so control availability and expanded state can be exposed accessibly without a new navigation owner. These two expressions must remain aligned. Resizing changes shell presentation only; it does not enqueue an action in the writing owner's single deferred-intent slot or replace the editor.
5. Expanded reading width exposed **fractional scroll-rounding accumulation** across appearance changes. Retaining each anchor's intended offset and pane top, in addition to its node and actual scroll position, adds two transient measurements while preserving its original position across repeated reflow. A deliberate reader scroll still establishes a fresh anchor. Navigation disclosure and viewport changes rebase the retained appearance sequence so an old absolute coordinate is not reused in a new pane frame.

The parent specification already records the general compact-navigation/progressive-disclosure, selective-style and bounded-testing trade-offs; they are not repeated as additional decisions here.

## Verification and owner-selected cadence

The owner explicitly changed the acceptance cadence during this implementation: **Edge on each ticket; Chrome in final ticket #62**. Tampermonkey beta and stable are treated equivalently at the owner's request. This overrides the earlier per-ticket two-browser wording, reducing repeated qualification on intermediate candidates while deferring discovery of Chrome-specific regressions until the integrated #62 check. Chrome and deferred Windows/manager-update evidence are not represented as passed.

The first completed candidate userscript was SHA-256 `bdea56f7c818c8b5a2be3e89fa8933ce928f56816c94402570260e1c38805fbb`, built with Node 24.22.0/npm 11.21.1. The unchanged baseline is kept separately from passing and failed reruns.

Targeted completed run `evidence/runs/2026-11-03T06-56-51.709Z/` passes 7/7: five new complete-application cases plus the existing exact paragraph-resize and repeated-appearance anchor cases. It records 185.1875px chrome and 658.8125px scrolling reader at 390 × 844: a 227.09375px (55.1%) reduction from the measured 412.28125px baseline, with 78.1% of viewport height available to the reader. Source and attachment-reference text, native destinations, populated result rows/selection/criteria/returned page links/nonzero offsets, three locales, four themes, text-size endpoints/Compact spacing and three viewport sizes are exercised. Request ledgers establish no additional forum requests during passive disclosure/presentation changes.

The first broad regression run (`evidence/runs/2026-11-03T06-53-44.357Z/`) retained 81 passes and five failures. Three older journeys attempted controls now deliberately behind navigation and were adapted with an ordinary visible UI step. One new assertion incorrectly expected canonical query parameters in the browser URL despite the established opaque-history contract; it now observes the exact native-continuation destination and returned links. The remaining failure exposed fractional anchor drift and drove the measured-offset correction above. Failed receipts remain distinct from passing reruns.

Replay:

```sh
npm run build
npm run typecheck
npm run lint
npm run test:e2e -- tests/e2e/responsive-navigation.spec.ts tests/e2e/appearance.spec.ts tests/e2e/ui-ux.spec.ts tests/e2e/navigation.spec.ts tests/e2e/writing.spec.ts tests/e2e/search.spec.ts tests/e2e/notices.spec.ts
```

The existing reporter retains report, receipt, input/build hashes, manifests, authored fixture/scenario snapshots, synthetic screenshots and request/geometry artifacts. Installed Edge evidence and final advisor validation are tracked by the driving agent before the ticket completion commit.

The full affected application run `evidence/runs/2026-11-03T06-57-45.843Z/` exercised 283 cases against that first completed candidate: 278 passed and five older narrow entry steps timed out. Those five were corrected to await/open the deliberately disclosed controls and all passed in the targeted rerun `evidence/runs/2026-11-03T07-03-06.073Z/`. Successful cases were not repeated solely to increase counts. Both receipts identify that exact same `bdea56f7…` userscript; the failed broad run remains failed. The existing pending/uncertain authoring gate cases also pass 5/5 in `evidence/runs/2026-11-03T07-00-24.914Z/`, covering no-replay recovery, changed-account refusal, later edits surviving an old result, quota refusal and retained original unknown attempts. No live forum action was performed.

Build, typecheck, full repository lint, formatting and diff whitespace checks pass. Baseline, the first completed broad failure, and all final-candidate receipts above have independently rechecked manifest sizes and SHA-256 hashes. No exported portable contract changed, so the clean-consumer check is not required for this ticket.

Acceptance reconciliation before completion commit:

- [x] Same-state baseline and preimplementation chrome budget recorded; measured reduction and more than half-height scrolling reader verified.
- [x] Named narrow entry, current destination, ordinary nonmodal keyboard order, Escape/opener return, 44px minimum primary controls and reachable native continuation verified.
- [x] Direct wide-thread empty track reclaimed; populated board rows, selection, criteria, returned paging and nonzero scroll restoration retained; existing top/bottom/single-page pager cases pass.
- [x] Passive disclosure, reflow and appearance retain reading/writing context without unintended forum requests; existing composition, account/recovery, pending/uncertain and guarded replacement cases pass.
- [x] Failure inventory and named complete-application expectations preceded feature code; no unit tests added.
- [x] Required viewport matrix, representative enlarged/Compact text, four themes, three languages and keyboard behavior verified through complete-application Edge journeys.
- [x] Corrected-candidate installed Edge workflow, static/build checks, retained evidence and final BDFL validation verified. Chrome is expressly deferred to #62 by the owner.

## Final advisor corrections and corrected candidate

The BDFL advisor validated two evidence-backed defects in the first candidate after implementation. An Escape used to cancel CJK composition could enqueue a later menu collapse and focus transfer, also overwriting an already deferred Settings intent. A retained absolute appearance anchor could survive a menu-origin shift and cause a later Text size change to jump the reader by about 264 px. Both were reproduced with named complete-application expectations before correction: `evidence/runs/2026-11-03T07-07-35.767Z/` and the strengthened composing-state settlement run `evidence/runs/2026-11-03T07-08-21.106Z/`. Failed receipts remain failed.

The correction ignores composing Escape and browser-ordering keyCode229 before enqueueing a view action. It rebases the appearance-anchor sequence after navigation disclosure and viewport frame changes, retaining fractional offset preservation within an ordinary appearance sequence. These restore the already required composition and reading-position guarantees and introduce no additional distinct design trade-off.

The corrected candidate userscript SHA-256 is **`a3b7e7d53c4a1fae79d2f3a002e95abf7df8b808d11ea2c565d203595a0ae1ed`**. The affected final rerun `evidence/runs/2026-11-03T07-08-55.485Z/` passes **18/18**: all eight responsive cases including the three new regressions, exact repeated-appearance/new-anchor/resize retention, and the existing IME/section/dialog/writing preservation cases. The earlier broader and pending-operation evidence remains bound to its own candidate; the final runtime correction gets this fresh affected coverage rather than relabelling older runs. Installed affected checks likewise need the corrected exact bytes.

The designated gpt-6.1-sol/xhigh BDFL advisor applied `validate-gpt-code-review`, independently checked the corrected source, runtime-source hashes, exact userscript and 18/18 receipt, and confirmed both causes resolved with no remaining code finding from the supplied hypotheses, no new owner, and no additional distinct trade-off. Final installed Edge and static reconciliation is complete as recorded below.

## Installed Edge acceptance

The driving agent verified the corrected **a3b7e7d…** candidate under Edge 156.0.4314.58 on macOS 15.6 arm64. Actual manager-stored source bytes match the build. The manager popup confirms one enabled TSDMUI copy: Tampermonkey BETA 5.6.6242 enabled, stable 5.5.1 disabled, Editors 1.0.7. The owner's beta/stable equivalence instruction applies; Chrome remains scheduled for #62.

In the ordinary retained-writing reader, measured chrome is 185.1875 px and the scrolling reader is 658.8125 px. Direct arrival at 1440 × 900 has no results pane (reader left 328 px, width 1112 px). Resizing through 768, 1440 and 390 pixels retains 59 populated result rows and the exact 1749.5 px reading offset, and no horizontal overflow. A fresh board→thread→Back journey returns to the exact 10703.5 px board offset. Complete local source survives reload, account/form recheck, appearance/disclosure, resizing and Back.

The corrected menu/appearance cycle retains its visible table anchor and returns to the same 60.5 px relative position and 1749.5 px scroll offset at 100% Text size, without carrying the menu-open frame into later changes. Native composition was exercised directly after an inconclusive owner observation: physical `n` entered while the editor was focused and Navigation open disabled the toolbar during real composition; native Escape cancelled that input, kept Navigation expanded, kept focus in the textarea and restored the exact pre-probe source. The inconclusive earlier observation is not labelled a pass.

No forum operation POST was observed. The final bounded ledger of 16 requests contains one automatic Cloudflare `/cdn-cgi/challenge-platform` POST; the observed application fetch operations were GETs for the reply form and two thread views. This evidence does **not** claim zero total POST requests. No forum publication, forum draft save, upload, removal or spending action was performed.

Persistent installed report, machine-readable receipt, exact candidate identity and manifest: `evidence/runs/53-installed-edge-2026-11-03/` in the integration checkout. The previous bdea56f7… installed observations remain historical. Every #53 acceptance criterion is verified under the owner's Edge-per-ticket/Chrome-in-#62 cadence.
