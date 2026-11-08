# Persistent thread tools — #85

Canonical scope: [ticket #85](https://github.com/Benson-mk/tsdm-ui/issues/85), parent #81 decisions 9–11. Base `cf4aff8`; Edge during delivery, Chrome deferred to #93. This document records implementation evidence, not a second tracker.

## Research and failure inventory (before feature code)

The existing heading already sits outside `.reading-pane`. Workspace owns guarded Back/navigation, retained public reading and favorite preparation; thread history owns refresh and source-page provenance. Layout owns scroll and restoration suppression. Browser clipboard belongs in a host adapter. No portable-client or persistence change is needed.

The confirmed seam is the complete emitted application in Edge, replacing only external HTTP. Native browser permissions exercise clipboard completion/refusal. No component or unit seam is introduced.

Reachable failures and planned named expectations:

- `UI85.heading`: long CJK/Latin title crowds controls; compact title loses accessible text; 32/8px thresholds oscillate after compensation; heading reflow moves an actually visible post line or triggers adjacent loading.
- `UI85.reader-width`: manually narrowed reader wraps individual buttons or shrinks hit targets; complete Newest first/Page/More row must wrap together based on available reader width.
- `UI85.page`: no usable Page trigger until #86; invented totals or lost returned context; unknown totals must remain truthful and returned links remain usable.
- `UI85.more`: keyboard/menu dismissal/focus return fail in ShadowRoot; short view clips menu; actions refer current board instead of retained reader; save preparation must not publish implicitly.
- `UI85.copy`: copied opaque history keys, referrals or credentials; wrong page/order/author context; false clipboard success; browser permission refusal must expose selectable canonical URL.
- `UI85.guards`: More Back/order changes bypass retained writing guard; refresh erases writing or targets another board; menu dismissal cannot cause navigation by itself.

Implementation proceeds in failure-first vertical increments; failures and later passes remain separately retained by the existing reporter. Installed Edge and final designated advisor are gates before commit.

## Implemented behavior

`ThreadTools.vue` owns the presentation of separate Page and More controls, source order/filter links and canonical URL copying. Workspace retains navigation/history, refresh, favorite preparation, writing guards and recovery ownership. Clipboard writes live in the browser host adapter and are awaited; refusal opens a selectable readonly URL dialog. The canonical link keeps origin, thread, numeric page and supported order/author parameters; source navigation links retain their exact returned targets independently.

The title and controls remain outside the reading scroller. Full title is 26px, compact title is 16px after scrollTop >32, and restoration requires scrollTop <8. Tooltip and accessible text retain the full title. Breadcrumb becomes visually clipped while compact and can reappear on focus. The complete order/Page/More group wraps according to reader width with 44px targets.

Compaction transfers released heading height to an inert transient spacer inside the scroller. The original user scroll is qualified for automatic history before reflow; generated reflow scrolls cannot create a second request. A resized compact reader retains an actual text-character Range and its former offset when it fits, otherwise moves only far enough to expose the same complete line. The search handles DIV/inline/BR native content and skips collapsed leading whitespace rather than treating a zero-area glyph as a reading anchor. Title measurements and the spacer update settle in one render. Precompaction post and end-distance intent are retained only until another scroll or content revision, preventing a newly exposed preceding tail or integer rounding from changing recovery/follow behavior.

History restoration settles the compact heading synchronously before measuring the viewport. A transient revision invalidates only resize restoration queued before a newer explicit history restore; subsequent resize work still runs. This avoids both the expanded-heading overcompensation and a measured short-view race that overwrote restored scroll682 with106. Neither fix adds persistence fields or changes a portable API.

Live history also records a memory-only character descriptor alongside the existing post position. It is used only for a changed reader width and only when thread, post, text-node index, complete text value and character offset still match. This preserves the actual text when responsive timestamp metadata changes its distance from the post top. Missing/revised content and reloaded positions use the existing post-anchor fallback; no fuzzy matching or schema expansion is introduced.

The affected Saved journey also exposed an inherited retained-board overlap: its list covered the Saved kind controls on unchanged `cf4aff8`. The minimal repair retains the board DOM/context but shows that list only while board browsing or an actual board result owns the list region. Real Saved board targets and retained readers remain usable.

## Verification and migration audit

Feature expectations exercise the emitted application in Microsoft Edge; external HTTP alone is substituted. `UI85.heading` verifies exact32/33/8/7 boundaries and a genuinely visible character Range before/after compaction. Manual320px reader constraint is explicitly a geometry experiment because #88 owns production resize controls; natural375/820px layouts separately verify targets and whole-row containment. Page navigation preserves returned order/author/signature context. More covers keyboard/outside/Escape dismissal, trigger focus, retained-reader refresh and save beside another board, Back, same-thread writing continuity, and no-send preparation. Clipboard success reads the real browser clipboard; failure uses an actual Permissions-Policy response.

The native-document Escape fixture first failed for both Page and More, reproducing installed native key handling. Local Escape handlers repair that browser integration. The narrow resize fixture matches1119×629 to375×420 with a minimized retained writer and a long title. It requires a second compact-mode scroll before resizing so the remembered viewport reflects compact geometry. It failed with zero visible text in `2026-11-06T22-06-01.044Z`; the identical probe passed against unmodified `cf4aff8` in `/private/tmp/tsdm-85-base/evidence/runs/2026-11-06T22-06-22.621Z`. The repaired complete feature/history run passed29/29 in `2026-11-06T22-06-53.531Z`.

Existing journeys now reach moved controls through real Page/More UI helpers. Their request, account, source, writing, anchor and immutable-review assertions remain. All final refresh journeys use actual visible More/menu clicks, including the formerly synthetic click-isolation cases. The temporary dispatch helper was removed; no workspace methods or internal state are invoked. Category selectors now locate the breadcrumb without changing category expectations. Single-page readers have a truthful Page dialog with zero supported targets.

The old automatic-history Threads case assumed a modal drawer. That assumption fails unchanged on `cf4aff8` (`/private/tmp/tsdm-85-base/evidence/runs/2026-11-06T21-59-03.997Z`), because #82 made Threads an in-place primary pane. Its migration verifies hidden-reader/no-fetch/return/fresh-scroll behavior; Boards retains covered-reader/modal assertions. A hidden display:none pane has zero scrollHeight, so the explicit post-return boundary scroll differs from the covered Boards case.

The independent baseline audit also confirmed five inherited half-pixel anchor failures, the pending-favorite uncertainty wording race, and refresh/reload assertions that assumed unchanged pane chrome. The half-pixel checks now accept exactly0.5px rather than requiring less than0.5; no larger tolerance was added. Pending reload must remain uncertain with one write/no replay and may truthfully report either a recovered pending attempt or its already-lost response. Refresh/reload observation matches the exact post, text and line, including inline links before paragraphs: retain its screen coordinate when it fits, otherwise retain its pane-relative offset with full containment and1px rendering tolerance. Only the explicit edited-post test normalizes its known edited prefix. The intermediate F79 case has a pane top movement of8px while its actual text screen coordinate is unchanged, so it uses that same conditional contract.

The old mixed prepared-review journey also failed on untouched base (`/private/tmp/tsdm-85-base/evidence/runs/2026-11-06T22-35-04.524Z`): Escape does not leave in-place Threads browsing. Its final journey shows the retained writer then returns through the real Threads control, and still verifies exact frozen source and one independent send.

The current-only F79 cached-return failures were not relaxed. All three passed untouched base in `22-38-55.854Z`; the feature failed in `22-30-40.691Z`. DOM-only diagnostic receipts `22-42-17.796Z` and `22-44-22.439Z` identify expanded-title overcompensation and stale queued resize respectively. Their existing exact text/line/offset assertions now pass, including390×500, and the latter also verifies a subsequent deliberate resize still preserves its current line.

Installed7c6 exposed a further width-changing return defect: a retained board and minimized writer kept the original post at the same absolute position, but wrapped post metadata shifted its first text by20.89px. The guard itself did not move reading; a height-only return passed. Under the diagnosing-bugs loop, the full-application direct and retained-board cases both failed20.984px in `22-58-20.142Z`. Removing only the returned timestamp passed `22-57-17.195Z`, confirming metadata reflow rather than stale board identity. Exact character descriptors repaired both cases in `22-59-39.150Z`; final affected coverage also verifies changed/missing accepted content with identical old text in another post and a passive reload. Those fallback checks exercise natural source revision, not private state mutation.

Earlier failures remain separate evidence: initial missing tooltip/Page/More expectations; fixture encoding, unsupported initial URL and favorite-form setup errors; a genuine swallowed automatic-history edge request repaired before final verification; native Escape and duplicate Back regressions; and resize clipping described above. Setup failures and interrupted runs are not passed production checks.

## Final qualification receipts

Frozen userscript SHA-256: `4677abe3b667695fa2fd45e61b4252030979ebf722f58d1e500c07dd9d08fb5d`. User/meta/manifest are preserved under `evidence/runs/candidates/<sha256>/`. The source executable is frozen; later ledger edits do not rebuild it.

- `evidence/runs/2026-11-06T23-02-01.359Z`: **159/159** affected feature, history, reading-memory, refresh, reader-hierarchy, board-group, favorites and UI cases on the final candidate, including the subsequent post-return resize assertion.
- `evidence/runs/2026-11-06T23-02-21.566Z`: **28/28** affected cross-feature account, downloads, navigation, writing, immutable-review and recovery cases on the final candidate.
- `evidence/runs/2026-11-06T22-45-29.744Z`: **30/30** focused UI85/F79/pager/prepared-review cases on earlier7c6, before the native width-history repair and additional later-resize assertion; retained as scoped intermediate evidence.
- `evidence/runs/2026-11-06T22-30-40.691Z`: the earlier `d6bee37…` receipt retains **both real-clock policy/cooldown passes**. Its unrelated failures remain recorded. These two unchanged policy cases are not claimed as rerun on4677; the final candidate rechecks affected restoration, follow, overlap and cached-cooldown behavior. This scope follows the parent-approved cadence instead of repeating six minutes of unchanged clock waits solely to unify receipts.

Installed Edge source readback and corrected native geometry are retained in the integration checkout under `evidence/runs/85-installed-anchor-2026-11-07` (9-file manifest independently verified). Final4677 preserves the exact original note in the retained-board+writer journey from1119×629 to390×500: relative32.1875→32.171875px, followed by a legitimate390×600 resize and reload at the same post/text/offset. Earlier native menus, source Page1→2→1, canonical Copy/reopen/order/author, Save preparation, Saved board access, Escape/focus and exact threshold checks remain scoped to `85-installed-edge-2026-11-07`; repaired restoration scope is explicit. `85-installed-restore-2026-11-07` retains the failed7c6 width-return evidence rather than being overwritten. No social write was performed in installed checks.

The designated gpt-6.1-sol/xhigh advisor completed final `validate-gpt-code-review` validation with no blockers or additional distinct trade-offs. Its independent18/18 replay is `evidence/runs/2026-11-06T23-07-45.755Z`, with a verified117-file manifest and matching production/assertion identities. All nine acceptance criteria are verified within the documented per-candidate and Edge-first scope. Final build artifacts are preserved in the integration checkout at `evidence/runs/85-final-build-2026-11-07`.

The latest verification set is189 distinct passing application scenarios (159+28+2), with per-candidate scope above. Receipts include executable identity, complete source manifest, fixture snapshots and artifact manifests. Relevant artifacts include exact character/line geometry, canonical clipboard readback, HTTP ledgers, restored positions, state, source, screenshots and immutable send readback. The short-view and compact-inline screenshots were visually inspected. All automated forum responses are identified as authored external HTTP substitutions; they are not live forum evidence.

Replay from this checkout with Node24.22.0 and Edge:

```sh
npm run build
npm run test:e2e -- tests/e2e/thread-tools.spec.ts tests/e2e/automatic-history.spec.ts tests/e2e/thread-history.spec.ts tests/e2e/thread-refresh.spec.ts tests/e2e/reading-memory.spec.ts tests/e2e/reader-hierarchy.spec.ts tests/e2e/board-groups.spec.ts tests/e2e/favorites.spec.ts tests/e2e/ui-ux.spec.ts --grep-invert 'IM71.failure-recovery|IM71.auto-policy'
npm run test:e2e -- tests/e2e/attachment-authoring.spec.ts tests/e2e/downloads.spec.ts tests/e2e/foundation.spec.ts tests/e2e/navigation.spec.ts tests/e2e/prepared-review.spec.ts tests/e2e/replies.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/search.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/writing.spec.ts -g 'repair-account|download-section-cancel|download-stale-inflight|download-passive-return-cancels|stale-account|anchor-during-read|workspace-panes|refresh-account|UX54.grouped|UX62.mixed-journey|image-writing-recovery|UX53.result-context|search-integrated-reader-refresh|contextual-chrome|redirect-writing|legacy-section-recovery|schema1-search-writing'
npm run evidence:verify -- evidence/runs/2026-11-06T23-02-01.359Z
npm run evidence:verify -- evidence/runs/2026-11-06T23-02-21.566Z
```

## Acceptance evidence

- [x] Persistent heading and separate adjacent Page/More; active order precedes both; complete row wraps with44px targets (`UI85.heading`, `reader-width`, `natural-width-*`).
- [x] Full/compact accessible title, exact32/33/8/7 hysteresis, visually clipped breadcrumb, actual visible-text stability and no oscillation (`UI85.heading`, native-shaped resize fixtures, F79 cached-return cases).
- [x] Interim Page connects only returned supported targets and retains current-page context without totals (`UI85.page`, thread-history and pager journeys).
- [x] More reaches history, refresh, favorite preparation and source filters; retained writing and refresh guards remain intact (`UI85.more`, `save`, `back`, `guards`, affected regression suites).
- [x] Canonical URL copy reports awaited real clipboard completion and actual permission refusal offers selectable text (`UI85.copy-*`).
- [x] Long/narrow/manual geometry, menu keyboard/dismissal/focus, short containment, action context and copied-link context covered (`UI85.*`).
- [x] Parent architecture/account recovery/source fidelity/guarded navigation/immutable-review guarantees retained; no portable contract or persistence change (189 distinct latest passing application scenarios with candidate scopes above).
- [x] Failure inventory and full-application E2E expectations preceded feature code; reports/receipts/manifests/screenshots/geometry/request/state artifacts retained; no unit tests introduced.
- [x] Build/typecheck/lint/format/diff and verified artifact manifests pass; installed repaired-candidate qualification passes. Final designated advisor accepted all nine criteria with no blockers or additional distinct trade-offs. Chrome remains explicitly deferred to #93. The unchanged portable package does not require a new external-consumer qualification.

## Distinct actual trade-offs

1. Released title height becomes a transient inert spacer inside scrolling content. This preserves actual screen anchors even when a long heading shrinks by more than32px, at the cost of temporarily retaining blank space above the first post until it scrolls away. No persistent position schema is added.
2. When compact compensation leaves the remembered first line outside a newly shortened viewport, resize moves that line to the closest fully visible position. Exact old relative offset is retained whenever it still fits; a clipped old offset cannot be preserved while keeping text readable.
3. Page exposes existing returned source links until #86 supplies the confirmed picker. It gives usable navigation now without inventing totals or a slider.
4. Canonical Copy URL uses an allowlist, dropping referral/signature/highlight/opaque extras while retaining supported page/order/author context. Exact source navigation remains independent and unchanged.
5. Local Escape handlers supplement Reka document dismissal because native document handling can consume Escape. This duplicates a narrow dismissal responsibility to ensure installed behavior and focus recovery.
6. Narrow readers use an additional whole control row when title/tools cannot fit. Compact title can visually truncate, while full accessible text and tooltip remain available.
7. The manual320px check constrains container geometry because production manual resizing is owned by #88. Natural375/820px checks complement the experiment; manual resize UI is not claimed as delivered.
8. Title thresholds and pre-restore settlement perform synchronous height measurements and bounded DOM attribute/style updates alongside Vue state. This avoids deferred scroll overwrites and intermediate expanded-title restoration, at the cost of layout reads and a narrow synchronous rendering responsibility.
9. A transient precompaction post/end-distance record preserves original recovery/follow intent until a different scroll or content revision. This adds local view state but avoids treating newly exposed preceding content or rounding64→65 as user movement.
10. Refresh/reload assertions distinguish valid absolute text stability from required pane-relative rebasing when changed chrome clips the old coordinate. They use exact post/text/line identity and a bounded rendering tolerance; this is more detailed than raw scrollTop equality but preserves the actual reading contract.
11. The small inherited Saved repair adds a visibility ownership condition instead of unmounting retained board context. It resolves intercepted Saved controls while preserving the board DOM and actual Saved board targets.
12. A local restoration revision cancels only pending resize work superseded by a newer history restore. This adds ordering state but prevents an older pre-restore text anchor from overwriting the accepted restored viewport, while subsequent legitimate resizes remain active.
13. Exact character descriptors live in a WeakMap tied to existing history position objects and require strict context/text identity. This adds small per-position memory and text-node lookup work for live width-changing restoration, while avoiding a persisted schema change; missing/changed/reloaded descriptors retain the established post-anchor fallback.

Inherited full-app HTTP seam, Edge-first cadence, memory and dependency-symlink choices remain recorded in #81/#82 and are not new trade-offs here.
