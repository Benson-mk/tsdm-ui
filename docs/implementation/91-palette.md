# Read and review content with the documented palette and soft boundaries — #91

Parent #81, stories 3 and 53–57, outcomes A10/A12. Integration base: `84757a0ec6d08a69801b4d0fdd62e93e8964ddc4`. The separate [failure inventory](91-palette-failures.md) was written before feature code. Tests use the approved complete built application in Edge with only external HTTP substituted; no unit tests, portable client changes, new persistence or production endpoints are introduced.

## Delivered scope

The existing #84 source category owner now also supplies source category filters and the existing public reader avatars. #87's retained destination remains the category owner for compact/expanded/minimized writing; real immutable Review receives that same category explicitly. Unknown source identity remains neutral. Category cards retain their fill and title underlining, while selected thread actions and editor mode controls use the exact monochrome action pair.

Quotes in reading, rich editing and real Review use the exact base role and black text/rule. Existing table headings use cool/black, and table bodies explicitly inherit their actual surrounding foreground, including Dark documents whose native table defaults would otherwise make cells black on black. Named quote metadata stays fully readable. Original media is not filtered; the existing font stack is unchanged.

Ordinary actionable hover uses the soft role; selected actions preserve their fills. Disabled controls use a solid soft/regular pair without hover decoration or opacity-generated tints. Protected editor fragments use soft/regular, and selected table cells use inverse/white. Native accents stay monochrome. Category, ordinary and selected-action focus rings use their actual surface pairing.

Decorative header, pane, footer, card, writer and menu lines yield to the pinned 6% floating/directional shadows; dialogs/drawers use the pinned 24% modal shadow and 60% scrim. Posts remain flat with existing 24px default and 16px Compact top padding. Input, table and quote boundaries remain functional. Dark and forced colors retain minimal region/floating-layer boundaries. The explicit stacking order puts menus above pane/resize layers, drawers above menus, ordinary dialogs above drawers and navigation guards above those dialogs. The inherited opening-edit Settings/Resize Threads interception is covered by differential evidence.

## Distinct actual trade-offs

1. Category presentation stays in the existing layout catalogue and is passed into real Review rather than added to frozen portable publication data. This avoids changing the public client/recovery contract, while retaining the existing neutral fallback before source identity is discovered or after account invalidation. Filter color is applied only to source-classified category filters; sorting/time/unclassified controls do not acquire a guessed category meaning.
2. Soft shadows and whitespace reduce explicit decoration and retain flat posts, at the cost of less sharply separated regions in light themes. Dark and forced colors deliberately keep one-pixel functional boundaries because black shadows cannot distinguish those surfaces. Existing density and functional field/quote/table rules remain.
3. Solid inverse selection for table cells and solid soft disabled/protected surfaces avoid generated tints. These states occupy more visual weight than translucent overlays; inverse white text and explicit disabled/selection semantics keep their meanings readable without new colors.
4. A single explicit overlay order gives dialogs and guards priority over resize strips and floating menus. Resizing is consequently unavailable beneath an active modal; this prevents the demonstrated pointer interception while preserving ordinary quiet-edge interaction outside modals.
5. Selected thread rows use the exact monochrome action pair rather than the inherited cool fill. Selection is more visually prominent, while category meaning remains independently visible in the category label/filter/avatar/breadcrumb and retained writing destination.

6. The final 60-byte focus-selector correction uses 24 affected current-candidate cases plus the explicitly scoped preceding broad result. This avoids repeating all 340 cases after a narrowly understood selector repair; the limit is that the complete broad matrix is not claimed as a final `9088` pass. Eight exact-baseline legacy failures remain outstanding for #93.

The Edge-first cadence, Chrome deferral to #93, source-fidelity/immutable Review guarantees and browser page-session policy are inherited constraints, not new choices in this slice.

## Failure-first and verification record

Preserved setup failures: `2026-11-07T09-54-01.245Z` (fixture encoding), `09-55-08.498Z` (incomplete native form fixture), `09-56-04.630Z` (editor accessible-name setup). The genuine quote/table red is `09-56-28.349Z`, followed by green `09-57-00.762Z`. Category red `09-57-43.524Z` becomes green `09-58-11.567Z`. Controls red `09-59-01.464Z` becomes green `09-59-45.297Z`.

Boundary/Dark red is `10-01-10.839Z`. `10-01-26.323Z` records a wrong regression-file selector with no tests; it is not a pass. The actual inherited `UX62.integrated-edit-opening` failure is reproduced at `10-01-48.979Z`. Explicit layer ordering passes it at `10-02-44.618Z`; that run retains one new test's overly broad overlay locator failure, corrected with an open-overlay selector and a non-vacuous modal/resize intersection assertion. Static type checking also caught an accidental category binding on author filters and an optional prop mismatch before qualification; both were corrected without changing author-filter semantics.

`10-04-25.524Z` passes the then-five #91 cases plus the exact inherited opening-edit regression. The selected-thread role red is `10-04-54.615Z`; all six #91 cases pass at `10-05-44.123Z`. Visual inspection then exposed black table-body text in Dark, beyond the already-tested headings. The explicit table-body red is `10-07-41.985Z`; its correction inherits the surrounding foreground. `10-07-18.351Z` is the preceding unchanged quote check and does not claim the later table-body assertion. An attachment MIME mismatch in earlier quote receipts omitted their observations JSON; final runs use the reporter's exact JSON MIME and retain that artifact.

At this prequalification checkpoint, affected regression, frozen source/build identity, installed Edge and designated advisor validation remained to be recorded. The completed gates are recorded below.

## Final synthetic qualification and inherited scope

`2026-11-07T10-08-09.039Z` passes all six #91 cases after the Dark table-body correction. The final affected matrix at `2026-11-07T10-09-15.382Z` passes **330/340** cases on userscript SHA-256 `85bfe6eb1f79755b9f20b412e630b80f07ddc088abba87a20c37f1f04153c0cf`. It includes appearance, source categories, rich editing/tables, private writing, immutable Review, navigation, page/menu controls, direct resizing and board presentation. All #91 cases and the former opening-edit interception case pass.

The exact accepted #90 frozen source/build (`8d128ade845e9d8bc9f99c3df419189ebeb06b9cb6bddce28cf57ede4efda7ad`) independently reproduces these eight legacy failures in `91-baseline90-2026-11-07` (original run `2026-11-07T10-12-09.949Z`). They remain explicitly outstanding for #93; they are not globally waived, fixed or passed by #91:

| Case                                       | Baseline #90 observation                                                                    | #91 observation           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------- |
| J5.appearance-locales                      | Looks for Simplified Chinese Refresh as a button outside More; missing                      | Same missing old selector |
| J5.appearance-localized-reader-and-failure | Looks for Traditional Chinese Refresh as a button outside More; timeout                     | Same missing old selector |
| J5.appearance-roles                        | Old 24px heading expectation; observed 18.2/23.4/26/24px at 70/90/100/150%, with compaction | Same four observations    |
| J5.appearance-resize-context               | Paragraph offset 60.671875px against ≤1px                                                   | 59.671875px against ≤1px  |
| J5.appearance-context                      | Paragraph offset 1.140625px against ≤1px                                                    | Same 1.140625px           |
| J5.appearance-new-anchor                   | Paragraph offset 1.078125px against ≤1px                                                    | Same 1.078125px           |
| DESIGN.composer                            | Pre-wide-layout height limit 414px; actual 844px                                            | Same 844px                |
| UI82.same-retained-thread                  | Actual first-line offset 36px against ≤1px                                                  | Same 36px                 |

The remaining two broad failures are qualified separately by `2026-11-07T10-14-17.194Z`: unchanged `DESIGN.cover-390-light` passes after its browser-context startup timeout; `UI87.target-color` passes after scoping its formerly ambiguous selector to the named Writing destination. Expanded writing's Review destination now intentionally also carries category presentation. No production change or relaxed geometric threshold was used to clear these cases, and the complete broad run was not repeated after this test-only locator repair.

The parent accepted this bounded differential disposition while retaining all eight failures for #93. Static typecheck, lint, formatting and diff-whitespace checks pass; build succeeds under Node 24.22.0/npm 11.21.1. All 30 emitted portable client artifacts are byte-for-byte unchanged, so no external-consumer requalification is required. Representative Light editing, Dark real Review, forced-color narrow menu and floating-menu screenshots were visually inspected; the corrected Dark table body is visibly readable. Installed Edge and final designated advisor acceptance remained separate pending gates at this checkpoint.

The initial frozen `85bfe6eb` candidate is superseded. A focused audit found that the category descendant focus selector also reached ordinary navigation links inside a categorized section. `2026-11-07T10-17-54.073Z` confirms a black main outline on the regular black Dark surface. Restricting the category rule to the focused colored element leaves ordinary navigation with its regular-surface focus pair. The existing two-pixel contrasting halo had kept some indication visible, but it did not justify the wrong main outline. The original freeze, broad observations and partial installed setup remain tied to their original bytes; final focused evidence follows on the corrected candidate.

The corrected candidate passes **24/24** focused Edge cases at `2026-11-07T10-18-52.788Z`: all six #91 journeys, all twelve #84 source-category/account cases, forced-color resize reachability, More/guard focus, former opening-edit interception, retained writing category and the previously interrupted narrow design case. Typecheck, lint, formatting, build and diff-whitespace checks pass again. The only executable change from the broad-run candidate is removal of the overbroad category-descendant focus selector; the affected focus/category/modal interactions are qualified on the corrected bytes. The older broad result and eight inherited failures retain their original scope. Final frozen build is `91-final-build2-2026-11-07`; installed/advisor gates remained pending at this checkpoint.

## Installed Edge qualification

Final candidate `9088fb3ef401b9b1badb4573dbcdb3917e4efd898b8cf86a5b174498ac933b8e` is **2,203,242 bytes / 2,138,436 UTF-16 units**. The sealed `91-installed-final-2026-11-07` package retains **73 files** plus its manifest. Its `verify.py` passes the retained color/source/target/focus/layer/containment/restoration assertions and exact manifest verification. The earlier accepted-90 baseline and partial `85b` installed setup remain separate sealed packages; neither is relabeled final qualification.

Tampermonkey's complete source readback matches the exact final source plus its recorded metadata suffix; one matching TSDM UI entry is confirmed, and the tab is reloaded. Edge is 157.0.4341.42 on macOS. The manager continued to expose an older timestamp, so that timestamp is not used as proof of replacement time.

Actual native reader quotes/rating-table headings, the visible rich editor and real frozen Review qualify all four themes. A scoped Review capture also measures the mounted hidden editor, while separate earlier editing captures establish its visible presentation. Actual Community writing for board4/thread1265238 remains retained while browsing Anime board20/thread1270774 through the real guard. Original source, author and destination survive theme/review/viewport steps; nonempty source selection [107,137] survives Dark→Light. The ordinary Dark board link has the corrected white 3px focus ring. Menus and Settings retain exact shadows and containment; forced-color emulation retains functional boundaries; text150/70 and an actually measured 390×720 narrow viewport preserve access. Original media remains unfiltered.

The original empty writer, original board/filter/page and reverse reader are restored with writing minimized, Light100%, checking off, no active Review and no display emulation. Restored snapshot/account-not-rechecked status remains truthful. No Send, save, upload or other social-write action was activated; installed captures do not claim a network-ledger proof of zero POSTs. Controlled E2Es own explicit request assertions. Chrome remains deferred to #93, and this presentation-only slice does not claim a new native OS IME qualification.

Preserved installed non-passes are explicit: capture24's first viewport request stayed at1520px and is not narrow evidence; capture25 independently confirms390×720. A final pointer protocol timeout left the writer unchanged; ordinary keyboard activation completed restoration. Neither event is silently labeled an application pass. The final advisor gate remained pending at the installed checkpoint; its acceptance and commit authorization are recorded below.

### Acceptance evidence map

| Verified criterion                                   | Verified evidence                                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x] 1. Exact roles/source category/foregrounds/media | UI91.quote-review, category-retention, selected-thread; all UI84 cases; native four-theme colors and unchanged media                                              |
| [x] 2. Retained writing independent of reader/list   | UI91.category-retention, UI87.target-color; actual Community→Anime retained mismatch and immutable Review                                                         |
| [x] 3. Base quotations/cool table headings           | UI91.quote-review including regular table bodies; actual reader, visible rich editor and real Review                                                              |
| [x] 4. Hover/disabled/native controls/focus/font     | UI91.controls and selected-thread; actual corrected Dark navigation focus, native Settings; existing font declaration unchanged                                   |
| [x] 5. Soft boundaries/flat density/functional rules | UI91.boundaries; existing appearance density, editor and review coverage; inspected screenshots                                                                   |
| [x] 6. Layer ordering/Dark/forced colors             | UI91.dark-forced, UI88.reachability, UI85.more/guards, UX62.integrated-edit-opening; installed menu/Settings/forced-color observations                            |
| [x] 7. Complete theme/retention/Review journey       | Six #91 cases plus installed native four-theme writing/Review and source/selection mismatch journeys                                                              |
| [x] 8. Existing architecture and guarantees          | Scoped broad330/340 plus final24/24, immutable Review/private-writing/account/recovery regression scope; unchanged portable artifacts and persistence owners      |
| [x] 9. Failure-first built Edge evidence             | Pre-code inventory and preserved red receipts, final source archive/388-input manifest, report/receipt/screenshots/requests/geometry and installed73-file package |
| [x] 10. Static/build/installed/advisor/trade-offs    | Static/build and affected installed Edge verified; six distinct trade-offs recorded; designated final advisor accepted all ten criteria                           |

Eight exact-baseline failures retain their explicit #93 disposition above. This is a bounded #91 acceptance map, not a claim of complete integrated #81/#93 qualification.

## Final advisor acceptance and preservation

The designated gpt-6.1-sol/xhigh advisor applied `validate-gpt-code-review` after implementation and installed qualification. The advisor accepted all ten #91 criteria on the exact `9088fb3e` candidate with no blocking findings and no additional distinct trade-offs. Its independent complete-application Edge replay at `2026-11-07T10-33-12.660Z` passes **24/24**; the exact 153-file manifest is verified. The advisor also independently verified static checks, candidate/source identity, installed manifests and unchanged portable artifacts. The parent accepted this result and authorized the single #91 commit.

All ten criteria in the evidence map above are verified within #91's approved scope. The eight exact-baseline failures remain outstanding for #93, and Chrome remains deferred to #93. Neither is represented as a pass in this ticket. Historical evidence retains its original candidate identity.

Before commit, all 31 completed historical, red, differential, frozen, installed advisor-replay and separately sealed advisor-verdict packages were copied unchanged into the integration checkout's ignored `evidence/runs`. All 3,151 manifested files and 31 manifests have exact byte-for-byte source/destination equality, full path coverage, sizes and SHA-256 checks. The final source/build package remains immutable; only this final acceptance prose postdates its source archive.
