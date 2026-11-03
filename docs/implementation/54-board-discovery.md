# #54 — Board discovery and grouped filters

Canonical scope: https://github.com/Benson-mk/tsdm-ui/issues/54, parent #52.
Based on integration `7733db8`. Preserve committed current-page filtering and #53 navigation. The owner directs Edge checks per ticket, Chrome only in #62, and treats stable/beta Tampermonkey equivalently.

## Confirmed seam and implementation plan

The previously confirmed seam is built userscript → actual layout → workspace → forum client → browser host. Replace only external forum HTTP; retain existing E2E/reporter and packed external Node-consumer machinery. Enumerate failures, prove metadata reaches grouped UI, then directory/subordinate hierarchy and responsive/failure outcomes in vertical E2E slices before feature code. Root owns installed Edge and final BDFL acceptance.

## Reachable failures identified before feature code

- Flat menus lose category/order/type/time meaning; translated labels can cause invented classifications.
- Unknown menus disappear; nested menus duplicate choices or lose source ordering.
- Returned destinations, criteria and pagination are synthesized or passive Back repeats requests.
- HTML and supported JSON wrappers diverge; empty/restricted/unsupported boards lose native continuation.
- Group titles absorb moderator text; legitimate repeated board destinations across groups are deduplicated.
- Subordinate descriptions/stats disappear; long multilingual names or links overflow with enlarged text.
- Current-page scope/count/clear/no-match/pagination or Back state regresses and filtering triggers requests.
- Metadata rejects legacy recovery, accepts malformed origin-modified data, breaks structural consumers or adds DOM dependencies.
- Keyboard, resizing or appearance loses context or causes effectful requests.

## Delivered behavior and compatibility

Directory group titles prefer the native h2 instead of surrounding moderator text. Existing per-group deduplication preserves featured and ordinary groups containing the same board. Subordinate linked cards expose existing title/description/stats.

Portable `Board.filterGroups` is optional and additive in independently versioned forum-client **0.14.0**. Each group carries native `sourceId`, semantic `kind`, optional actual subgroup `sourceLabel`, and returned links. Flat `filters` remains available. Older structural Board models and page-session records can omit groups; their choices appear as Other filters. New recovery metadata requires exact string kinds and optional string labels. No host/client methods or browser/DOM dependencies are added. Application metadata remains 0.1.0.

Known source-menu IDs supply category/order/type/time groups. Unknown native `filter_*_menu` and `dhnav`/`dhnavs` choices remain unclassified. Actual mixed More menus (`ul.pop_moremenu > li`) preserve source labels such as `排序:` and `时间:` without inferring semantic kinds from their translated words. Label extraction excludes choice links and following separators; unlabelled subgroups remain Other filters. Incomplete unfamiliar subgroup structure falls back to all returned choices in an unclassified group. Nested menus assign choices to their nearest menu.

Criterion labels require the exact explicit `filter=<criterion-key>` selector, or matching known source-group provenance without a conflicting selector. A matching parameter carried as another choice’s context cannot name that criterion; absent eligible provenance, display the exact raw current value. No returned destination, parameter, combination or source choice is synthesized.

The supported structured board envelope in the base is JSON containing HTML `document` and optional `head`. HTML and this wrapper are exercised independently. There is no Variables board adapter; an explicit Variables fixture verifies visible unavailability/native continuation. No Variables-profile grouping support is claimed.

## Trade-offs

1. Retain optional grouped metadata alongside flat filters. This duplicates a small serializable link list to preserve existing structural consumers and recovery snapshots; legacy metadata remains honestly unclassified. Advance only the portable contract to 0.14.0.
2. Classify recognized source-menu IDs and preserve nearest-menu ownership/document order. Unknown menus remain unclassified even when link labels resemble categories; this deliberately forgoes guessed semantics and combinations.
3. Prefer the source group h2, falling back to the header for older structures. Preserve per-group duplicates so featured and ordinary groups can repeat a destination.
4. Reuse linked cards for subordinate descriptions/stats and labelled wrapping filter groups. Scan detail adds some vertical height without adding a new navigation mechanism or an oversized overview.
5. Preserve actual native subgroup labels instead of translating their words or guessing semantic kinds. Accurate mixed-menu grouping can therefore retain native-language headings in another selected UI locale. Incomplete structures keep all choices honestly unclassified.
6. Prefer raw current values over friendly labels from unclassified/incidental matching links. Some mixed-menu criteria are less conversational, but one choice cannot falsely name unrelated criteria.

## Final candidate and verification

Frozen userscript SHA256: `c4c56394f171fcda685bb049ebac290322f3c93e41b7880c8d35e097a51ff151`.
Build identity: `dist/build-manifest.json`; portable library 0.14.0.

- Typecheck, ESLint, formatting, complete userscript/library/declaration build and diff checks passed with pinned Node 24.22.0/npm 11.21.1. Existing Vite future-loader warning is unchanged.
- `evidence/runs/2026-11-03T07-54-18.847Z`: **38/38 affected Edge E2Es** pass final candidate. Includes all 13 UX54 journeys, returned context, session/recovery/real302/remount and bounded board responses/native continuation. Synthetic screenshot visually confirms `Sort: lastpost`, `Time: 一周`, correct native subgroups and honest unknown group. `07-55-21.055Z` adds a scrolled, visually inspected readback of all seven criteria with contextual parameters on earlier choices.
- `evidence/runs/consumer-2026-11-03T07-54-33.138Z`: clean packed external Node consumer passes final public metadata, native labels, honest criteria, exact destinations, serialization, legacy structural types and DOM/Vue/GM-free package boundary.
- Earlier `c015b663…`, `evidence/runs/2026-11-03T07-35-40.049Z`: 60/60 affected navigation/UX cases, including existing local scope/count/clear/no-match/Back/pagination, all supported themes and source/account/recovery guarantees. Later runtime changes received the affected final rerun above; unchanged journeys were not multiplied.
- Earlier `c5295f90…` installed receipt is retained by root in integration `evidence/runs/54-installed-edge-2026-11-03/c529-installed-receipt.json`: real 49-card directory/filter/clear/no-match and three widths, category/page/passive return and retained writing. It is historical; final affected filter workflow remains pending root below.

Responsive cases cover 390×844 / 768×900 / 1440×900, English / Simplified / Traditional Chinese, 100% / 150% / derived Compact 70%, light/dark/mono and existing all-theme control checks. Keyboard activates returned choices. Resize checks retain context and assert one workspace. Screenshot capture waits two browser paint frames: immediate post-resize captures had compositor remnants despite one workspace; synchronized captures are clean (`07-38-13.471Z`), requiring no runtime repair.

Changed-journey request ledgers assert zero effectful requests. Native IME/writing code is unchanged. Authenticated installed material remains private. Root copies all ignored evidence before worktree cleanup.

## Retained red and correction evidence

- `07-30-38.612Z`: absent grouped headings before first feature code, HTML and JSON wrapper.
- `07-31-35.584Z`: grouped UI worked, but test incorrectly expected Current criteria instead of existing Effective criteria; test label corrected.
- `07-32-14.715Z`: moderator text contaminated group titles before hierarchy code.
- `07-34-43.392Z`: unfamiliar native menu dropped its choice before fallback code.
- `07-38-39.519Z`: advisor reproduced coercible array kind accepted by recovery before exact string guard.
- `07-40-55.921Z`: installed native mixed More menu incorrectly labelled all choices Time before native subgroup metadata.
- `07-41-27.487Z`: array source label accepted before optional label validation.
- `07-47-41.319Z` and `07-48-19.697Z`: ambiguous/incidental link labels named sort criteria; direct red shows `Sort: 全部时间` before provenance correction.
- `07-52-25.891Z`: generalized carried context incorrectly named all seven criteria with the earlier order choice before one eligibility rule was applied to all keys.
- `07-53-30.649Z`: 37 affected cases passed; an audit fixture added an unsupported constructor query and correctly hit existing route refusal. The out-of-scope fixture query was removed, preserving route restrictions.

All timestamps refer to `evidence/runs/2026-11-03T<timestamp>`. Earlier `c015b663…`, `657b9928…`, `c5295f90…` and `079fc758…` candidates are superseded; their observations retain their original scope. The first mixed consumer fixture used unsupported Empty text; its failed receipt remains retained and the fixture uses the established No threads marker. No after-code unit tests were added.

## Replay and acceptance

Use pinned toolchain on PATH: `npm run build`, `npx playwright test tests/e2e/navigation.spec.ts tests/e2e/ui-ux.spec.ts`, `npm run test:consumer`. Target the corrected paths with `--grep 'UX54|J2.session|J2.board-response|J2.boards-returned-context'`. Reporter packages retain exact source/build identity, receipts, manifests, replay fixtures and synthetic screenshots/state/request artifacts. `npm run evidence:verify -- <run-directory>` verifies retained package hashes.

- [x] Populated multilingual directory, real groups/repeated destinations and subordinate metadata remain distinct, with directly accessible forum tasks.
- [x] Existing current-page filter scope/count/clear/no-match, returned links, pagination and passive Back preserved.
- [x] Actual source-menu/subgroup metadata reaches model and labelled UI through supported HTML/JSON wrapper; unknowns remain honest, source order/URLs/criteria preserved.
- [x] Group choice, exact pagination/passive Back, nested/unknown groups, empty/unsupported/unavailable boards, long labels and native continuation exercised.
- [x] Additive optional contract documented/versioned and clean packed portable consumer passed.
- [x] Failure inventory and named complete-application expectations preceded feature code at the confirmed seam.
- [x] Three widths, representative text/Compact/locales/themes, keyboard and resize exercised without effectful requests; relevant source/account/recovery guarantees retained.
- [x] Final installed Edge workflow and BDFL acceptance passed on the identified final candidate; Chrome expressly scheduled only for #62 by owner direction.

The final criteria audit also found the same carried-parameter defect across category/time/type/digest/author/reward. `UX54.criteria-provenance` was written before the general correction and failed in `evidence/runs/2026-11-03T07-52-25.891Z`, showing every field incorrectly labelled with the earlier order choice. One eligibility rule now governs all criterion keys, with explicit selectors or non-conflicting known-group provenance and raw fallback. Criterion-name lookup uses own properties; existing route parameter restrictions remain unchanged. This generalizes trade-off 6 instead of adding one-key patches.

## Installed acceptance and BDFL disposition

Root verified the final `c4c56394…` manager source by exact byte readback, one script/workspace, fresh authenticated native menu groups and truthful two-day/week criteria, exact returned destinations/page2, passive Back with zero HTTP, exact retained unsent CJK source, 390×844 without overflow and restored normal viewport. The final bounded ledger records 127 GETs and zero POSTs, with no publication, forum-draft save, upload, removal or spending. Earlier c529 directory observations are reused only for unchanged hierarchy/filter and 390/768/1440 presentation, retaining their original candidate identity.

Persistent integration evidence: `evidence/runs/54-installed-edge-2026-11-03/receipt.json`, `report.md`, `manifest.json` and exact userscript/meta/build artifacts. Root copied all ignored synthetic/consumer runs before cleanup and independently verified final 55/10/30-file manifests.

The designated gpt-6.1-sol/xhigh BDFL advisor used validate-gpt-code-review and accepted the final source/runtime/portable package and installed observations with no remaining actionable issue. The six trade-offs above are complete; advisor adds none. All eight ticket criteria are verified under the owner's Edge-per-ticket/Chrome-in-#62 cadence. Parent #52 remains unchanged.
