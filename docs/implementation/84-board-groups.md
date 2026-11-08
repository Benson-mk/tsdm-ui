# #84 — Browse collapsible board groups with stable category colors

This slice implements [#84](https://github.com/Benson-mk/tsdm-ui/issues/84) from parent [#81](https://github.com/Benson-mk/tsdm-ui/issues/81) on the completed #83 integration base `ac2b8d9`.

## Delivered behavior and ownership

Boards navigation retains source-returned groups, names, counts and all returned board links. Each named button has `aria-expanded`, supports native keyboard activation and independently hides its own links. All boards remains available. Filtering changes only the directory results; group disclosure survives filtering, reordered native responses, pane toggles and browsing. Disclosure state is layout memory and starts expanded after document reload.

The directory parser preserves optional native `sourceId` and the same-origin supported heading `sourceURL`. Desktop heading provenance is scoped to its `h2`, excluding adjacent moderator profile links. The public library is version `0.20.0`; the independently versioned application remains `0.1.0` as recorded in the emitted build manifest. Existing `{ title, boards }` directory groups remain valid, including older page-session recovery. Recovery validates the new optional fields through the existing inert-record boundary. No host method, server schema, durable store or dependency was added.

A single layout category resolver serves directory/subordinate cards, navigation board dots, list context and reader breadcrumb. The catalogue is the last observed directory for the observed account, held in memory. A different authoritative account signature clears it, including any favorite-board aggregate. The existing workspace account observer exposes its latest accepted identity through a readonly, memory-only signal; this remains distinct from retained public content. Before a fresh observation, restored snapshots retain their existing recovery behavior. Current list and retained reader look up their own board IDs independently. Direct entry without discovered category evidence stays neutral. Source labels remain visible; decorative dots are hidden from accessibility APIs and have no unread semantics.

## Source evidence and exact roles

The implementation was informed by the parent's installed native directory inspection (`84-live-taxonomy.json` and `84-native-groups.json` under the local implementation evidence directory). Native `category_1` is 天使·后花园, `category_21` is 天使·动漫讨论区 and `category_393` is 天使·美工部. 天使·分享区 contains both music and anime boards and cannot be classified from either child. Favorites `category_0` has the scoped heading route `home.php?mod=space&do=favorite&type=forum` and is an aggregate rather than a second canonical membership.

| Exact group name                                    | Role           |
| --------------------------------------------------- | -------------- |
| Community; 天使·后花园; 天使·後花園                 | Community/base |
| Anime; 天使·动漫讨论区; 天使·動漫討論區             | Anime/pink     |
| Creative; 天使·美工部                               | Creative/alt   |
| Music                                               | Music/cool     |
| Every other name, including mixed native categories | Neutral/soft   |

The traditional equivalents are exact character equivalents, not substring classification. The current native directory has no separate Music top-level group; the exact English alias is exercised by controlled source fixtures. Do not infer category from position or a child board's label. A board duplicated in Favorites keeps its unique canonical category. Distinct conflicting canonical memberships stay neutral, with their source names retained together. Unknown category names stay visible with neutral fill.

| Role      | Light   | Alias   | Mono    | Dark    | Foreground |
| --------- | ------- | ------- | ------- | ------- | ---------- |
| Community | #ebf5e8 | #ebf5e8 | #e9e9e9 | #ebf5e8 | Black      |
| Anime     | #dda49f | #c2b8da | #e3e3e3 | #dda49f | Black      |
| Creative  | #a29bba | #c2b8da | #e4e4e4 | #a29bba | Black      |
| Music     | #a6c6e1 | #a6c6e1 | #b8b8b8 | #a6c6e1 | Black      |
| Neutral   | #eeeeee | #eeeeee | #eeeeee | #666666 | Theme ink  |

Hover/focus retains each category fill and underlines the card title. Ordinary reading surfaces are unchanged. This slice adds the dedicated pink token while reusing existing exact base/alt/cool/soft tokens; broader boundary treatment belongs to #91.

## Failure-first verification and replay

The reachable-failure inventory was written before feature implementation at `/private/tmp/tsdm-81-implementation/84-failure-analysis.md`. The emitted userscript was exercised in Edge, replacing only external HTTP. The first disclosure case failed on missing source disclosures (`2026-11-06T20-56-00.320Z`); the clean consumer failed on missing native provenance before the portable change. Palette/continuity/direct-entry cases failed on absent category presentation (`2026-11-06T21-01-34.113Z`). Failed and inconclusive receipts remain separate.

`UI84.disclosures` covers complete access/counts, keyboard collapse, same-name native identities, filter/reorder continuity, pane browsing and reload reset. `UI84.palette` checks exact fills, text colors, decorative dots, hover, aggregate favorites and true conflicting membership across all four themes. `UI84.continuity` checks independent retained-reader/list labels and exact theme pairings, then clears private favorites navigation on a confirmed account change. `UI84.direct` checks honest unknown context. Four `UI84.recovery-*` cases cover legacy optional metadata and invalid types/origin without automatic requests. `UI84.native-aliases` checks observed Chinese source roles, mixed neutrality and reordering. The clean Node consumer checks optional typings, scoped source links, native IDs and JSON round-tripping without DOM APIs.

Use pinned Node 24.22.0 / npm 11.21.1:

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:e2e -- tests/e2e/board-groups.spec.ts tests/e2e/navigation.spec.ts tests/e2e/ui-ux.spec.ts tests/e2e/navigation-settings.spec.ts tests/e2e/refined-navigation.spec.ts tests/e2e/three-region.spec.ts tests/e2e/list-context.spec.ts tests/e2e/design-fidelity.spec.ts
npm run test:consumer
npm run evidence:verify -- evidence/runs/<run>
```

The existing evidence reporter records report/receipt, build/source identity, fixtures, screenshot/request/geometry observations and a content manifest. Installed Edge and final advisor dispositions are required before commit; Chrome qualification is explicitly deferred to #93 under the owner's cadence.

## Existing-journey adaptations

The first broad run (`2026-11-06T21-03-57.103Z`) passed 97/103. Two global exact-text assertions became ambiguous because source group names now appear in both navigation and directory; they now address the original directory headings. The short-window traversal includes the new disclosure tab stop and measures the #83 `.navigation-body` scroller, retaining full final-link focus/visibility/overflow assertions.

Four older layout assumptions were independently reproduced on freshly built integration `ac2b8d9` (`2026-11-06T21-05-46.719Z` in the integration checkout): #82 hides an empty reader on direct Saved entry; its narrow Threads control shows results in place; #83 moved navigation scrolling to `.navigation-body`; and browse-only width at 70% text allows a two-row board fixture to fit without overflow. The saved/draft tests now assert those approved presentations while retaining no invented conversation, exact retained source/history and request assertions. Dense discovery returns 12 additional native fixture thread rows to establish actual nonzero overflow at the wide setting; its exact scroll-retention and node-identity assertions remain. The narrow list journeys wait for docking and open Threads only when it is actually collapsed, preserving an already exposed result view. No production workaround or relaxed offset tolerance was introduced.

Visual inspection of the initial candidate also caught the inherited positional blue pseudo-dot next to the new source category dot. A rendered pseudo-element assertion failed (`2026-11-06T21-09-22.654Z`) before the obsolete rule was removed. Explicit fallback board dots remain neutral. The superseded candidate `163101c2…` is not accepted installed evidence.

An initial integration comparison used stale `dist` bytes and is not baseline evidence. It was superseded by the freshly built comparison above; the original receipts are retained.

## Distinct actual trade-offs

1. Exact source aliases and neutral ambiguity handling give up color differentiation for mixed/unrecognized categories to preserve source meaning. Favorites provenance avoids a false conflict; true multi-category memberships are intentionally neutral across every board surface.
2. Optional serializable source provenance expands the portable contract and requires version 0.20.0/consumer qualification, but makes same-name native groups stable without positional or display-name guesses. The legacy fallback uses origin, title and sorted board IDs; membership changes reset its disclosure, and wholly identical legacy groups cannot be distinguished without native evidence.
3. Keeping the discovered catalogue and disclosure memory inside layout avoids new persistence and server requests. Reload/direct entry may therefore show neutral board context until a directory is observed. Account-signature changes discard the catalogue conservatively, including an unknown observation, so uncertain transitions can reduce navigation context.
4. Visible source-category labels and named disclosure controls occupy additional navigation/list/reader space, while decorative dots remain supplemental and not unread indicators. Source board names and all board destinations remain available.
5. Controlled HTTP E2Es cover exact aliases, ambiguity and theme combinations repeatably; installed native evidence is separately needed for current forum markup and host behavior. The current native directory has no standalone Music category, so its role is qualified synthetically rather than claimed as a live observation.

6. A readonly signal from the existing workspace account observer adds a small workspace/layout interface dependency. It distinguishes accepted account observations from retained public results without a competing account owner or persistent schema; watching only result/failure presentation would miss other existing observation paths.

The inherited development dependency-symlink trade-off from #82 applies unchanged. No additional trade-off is implied by repairing static readonly typing or migrating old UI assertions to the already approved #82/#83 behavior.

## Acceptance disposition

Current repaired candidate SHA-256: `e922a8fcbbf58b4fa0ff628de5f140bfdd93aae97dc8b9d1ca44812771269312`. The following 110-case and installed records describe prior `a25931…` at their original scope; repair qualification follows below.

- Final affected Edge application batch: **110/110 passed**, `evidence/runs/2026-11-06T21-10-32.929Z`. Includes all nine UI84 cases and existing navigation, UI UX, Settings, refined navigation, retained list/reader, three-region and design-fidelity journeys.
- Clean external consumer: **passed**, `evidence/runs/consumer-2026-11-06T21-10-51.098Z`.
- Both evidence manifests verified exact coverage, paths, byte sizes and SHA-256 (256 and 10 package files respectively).
- Build, TypeScript, ESLint, Prettier and `git diff --check` passed. Merging the integration tip `ac2b8d9` reported already up to date.
- Installed Edge passed on the identical candidate; see the sealed 18-file package `evidence/runs/84-installed-edge-2026-11-07` in the integration checkout. The advisor subsequently found the account-observation defect documented below; the repaired candidate subsequently passed affected installed recheck and advisor re-review, recorded below. Chrome remains deferred to #93.

Synthetic evidence verifies source groups/access/counts; in-session disclosure/filter context; exact category roles/themes/foregrounds; board-to-reader and independent list identity; conservative account-bound catalogue lifecycle; backward-compatible recovery; and repeatable failure-first application/consumer artifacts. The repaired candidate passed the affected installed recheck and final advisor re-review recorded below. These passes are not owner visual approval.

## Installed Edge acceptance

The sealed installed package `evidence/runs/84-installed-edge-2026-11-07` contains report, receipt, candidate source, observations and an 18-file manifest. Microsoft Edge 156.0.4314.58 with Tampermonkey BETA 5.6.6242 loaded candidate `a25931b06dc72d132c665571c15c4baeafd5c0fadae99b3086666b63ff8595e0`; full manager readback matched after removing only the tool's Last modified suffix, with one matching script. Beta and stable are equivalent under the owner's instruction.

| Acceptance requirement                    | Installed observation                                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source groups, counts and complete access | All nine native groups and 50 board occurrences are represented; each count equals its group's links.                                                                                   |
| Independent keyboard disclosures          | Enter and Space independently collapse Community and Creative.                                                                                                                          |
| Filter, pane and browsing continuity      | Filtering for 若闲 shows two favorite/canonical matches; clearing, toggling panes and browsing preserve both collapsed groups.                                                          |
| Exact theme and category roles            | Light, Alias, Mono and Dark match Community, Anime, Creative and neutral fills/foregrounds; mixed Sharing stays neutral. Favorite fid4 and its canonical card share Community identity. |
| Independent list and retained reader      | Opening Anime board20 from Community board4/thread1270653 changes the list category while retaining the reader's Community source label and black-on-base role.                         |
| Retained reading position                 | Actual visible text in post78312819 remains at y377.3671875 before and after cross-board browsing.                                                                                      |
| Short navigation and footer access        | At verified 375×420, the last navigation link is fully reachable and 44px high; account/Settings remains at y350–419.                                                                   |
| Disclosure reset and source recovery      | Returning to the directory preserves state; document reload expands all nine groups and restores optional source metadata through existing page-session recovery.                       |

Current native source has no standalone Music top-level group. Music, artificial unknown/conflicting/same-name/reordering and account-change variants remain explicitly controlled full-application evidence. An initial browser-wide viewport override targeted another existing test tab; its 1119px observations are not narrow acceptance. Accepted narrow captures use a verified tab-scoped 375px override. Both overrides were reset, Light and 100% Text size restored, and no forum publication occurred. The superseded `163101…` candidate was loaded but not qualified. Raw authenticated captures remain private; no physical-device, Chrome or release qualification is implied.

## Advisor finding and account-observation repair

The final advisor supplied a complete-app reproduction of member7 directory → Refresh returning an unknown-account native challenge. The existing workspace deliberately retains old public directory content on a failed read, so a watcher of `state.result` alone did not see the unknown observation and kept the new member-only Favorites navigation. This was a confirmed blocker for account-bound catalogue invalidation, not an intentional neutral-color fallback. The initial completion claim did not cover this path.

Before production repair, `UI84.account-observation` failed with eight retained groups (`2026-11-06T21-24-46.965Z`). A strengthened aggregate-only board-link assertion then exposed the adjacent legacy flattened-directory fallback (`2026-11-06T21-26-38.915Z`). Both failures are retained. The same-member permission case initially used the wrong English assertion and was corrected to the actual board permission message; that setup failure is not attributed to production.

The existing workspace `observeAccount` now exposes a readonly memory-only identity signal. Catalogue discovery watches that accepted identity as well as the rendered result; a retained directory whose account differs cannot repopulate navigation. The old flat navigation fallback applies only to direct board context, so invalidating the catalogue cannot reveal an aggregate-only link through a second presentation path. Existing public stale-result handling, page-session recovery and account ownership remain intact. A null observation means no fresh account observation yet, preserving existing restored-snapshot behavior. No portable client contract or persistence schema changed in this repair.

The new cases also verify successful fresh-directory rediscovery, unchanged category navigation after an accepted same-member permission failure, and a delayed obsolete unknown challenge completing after a newer accepted board read. The stale case waits for the old HTTP response to finish and browser frames to settle before checking that no old warning/category invalidation appears. Existing successful member transition and legacy recovery cases remain green.

Repaired candidate `e922a8fcbbf58b4fa0ff628de5f140bfdd93aae97dc8b9d1ca44812771269312` passed all 12 UI84 cases (`2026-11-06T21-27-24.079Z`) plus build, TypeScript, ESLint and formatting. The repaired candidate also passed **113/113** affected Edge cases (`evidence/runs/2026-11-06T21-27-59.038Z`); its evidence manifest verified exact paths, sizes and SHA-256. The portable build remains unchanged from the passed 0.20.0 clean-consumer qualification. Affected installed recheck passed as recorded below; final advisor re-review passed as recorded below. The `a25931…` installed report remains evidence only for its original candidate and exercised scope.

## Repaired-candidate installed recheck

The sealed five-file package `evidence/runs/84-installed-account-fix-2026-11-07` in the integration checkout contains the report, receipt, exact source and manifest for repaired candidate `e922a8fcbbf58b4fa0ff628de5f140bfdd93aae97dc8b9d1ca44812771269312`. Tampermonkey MCP replacement and complete source readback matched after excluding only the tool's Last modified suffix. The script was reloaded in Microsoft Edge 156.0.4314.58 / Tampermonkey BETA 5.6.6242.

- Existing page-session recovery displayed all nine source groups with truthful Snapshot account wording.
- A real directory Refresh confirmed the same current account and retained source provenance/category membership.
- Navigation from a favorite to its canonical Community board and onward to an Anime board preserved the collapsed Community group.
- After the fresh account observations, the current Anime list remained independent of the retained Community reader, with exact black-on-pastel roles.

Unknown-account challenge, aggregate-only fallback clearing, same-member permission failure, fresh rediscovery and awaited stale-response behavior are controlled complete-application Edge evidence. No live logout or account challenge was induced. The prior `a25931…` installed package retains only its original layout, palette and reading-position scope. No new viewport override was added; Light and 100% Text size remain restored, with no social write. Chrome remains deferred to #93. Final advisor re-review passed as recorded below.

## Final advisor disposition and verified acceptance

The designated gpt-6.1-sol/xhigh advisor, applying `validate-gpt-code-review`, approved repaired candidate `e922a8fcbbf58b4fa0ff628de5f140bfdd93aae97dc8b9d1ca44812771269312` with no remaining blocker. Its independent rerun of the three account-observation cases passed in `evidence/runs/2026-11-06T21-31-54.352Z`; the 59-file manifest verifies exact coverage, sizes and SHA-256. The confirmed catalogue blocker and aggregate fallback consequence are repaired; no additional distinct trade-off was reported beyond the six recorded above.

| Ticket acceptance criterion                                                                                      | Verified evidence                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source groups/names, complete access, keyboard disclosures and accurate counts                                   | UI84.disclosures, native nine-group/50-occurrence installed checks and short-window keyboard traversal.                                                                    |
| In-session disclosure retention, directory filtering and selected-board context without cross-reload persistence | UI84.disclosures, existing directory/history journeys and installed filter/pane/browse/reload checks.                                                                      |
| Exact Community/Anime/Creative/Music roles, neutral ambiguity and no positional/unread identity                  | UI84.palette/native-aliases, explicit pseudo-dot regression, all four computed theme pairs; native Music absence remains explicit.                                         |
| Consistent source category across cards/navigation/list/reader with names and foregrounds                        | UI84.palette/continuity plus native favorite/canonical role and four-theme installed observations.                                                                         |
| Independent current-list and retained-reader identity through existing layout/workspace ownership                | UI84.continuity, installed Community reader/Anime list, unchanged actual visible reading line.                                                                             |
| Counts, access, keyboard, filtering/reordering, unknown/same-name context, themes and continuity coverage        | All 12 UI84 cases and the 113-case affected Edge batch.                                                                                                                    |
| Parent architecture and production guarantees, including account-bound recovery and guarded navigation           | Existing recovery/writing/list/reader regression coverage, backward-compatible provenance consumer, advisor-confirmed account repair and independent negative-case replay. |
| Failure inventory and named full-application failures before feature/repair code, repeatable artifacts           | Preserved initial and repair red receipts, authored HTTP fixtures, final source/build identity, screenshots/request observations and verified manifests; no unit seam.     |
| Static/build, affected installed Edge, changed portable consumer, final advisor and trade-off reporting          | All checks passed; 0.20.0 clean consumer, original installed scope plus repaired-candidate recheck and final advisor approval. Chrome remains explicitly deferred to #93.  |

All nine #84 acceptance criteria are verified under the owner-approved Edge cadence. Final emitted userscript, metadata, build manifest and complete portable library are preserved in `evidence/runs/84-final-build-2026-11-07` before removing the temporary dependency symlink. This acceptance does not grant release authority or imply final integrated Chrome/physical-device/owner visual approval.
