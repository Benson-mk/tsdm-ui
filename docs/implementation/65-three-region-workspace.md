# Three-region board browsing — #65

## Before implementation

The approved whole-application seam loads the built userscript in Edge and substitutes only external HTTP. Existing navigation, writing, recovery and rich-reader journeys remain regression coverage. The pinned reference is experiment commit `bd64a5f48989cf33a2830768f07581c7fac07a2a`; production retains Text size, page-session recovery and deliberate immutable publication review.

Reachable failures to exercise before feature code:

- The former destination rail creates a fourth track; fixed tracks leave blank space after collapse or cap a large reader.
- Browsing a board/filter replaces the active thread, hides current writing, resets the reader or loses the previous result list's selection and nonzero offset.
- Back/Forward restores only one of the independent list/reader contexts or repeats reads.
- A direct thread has no useful list entry; empty boards erase reading or manufacture rows.
- Session/account changes retain another account's reader. Incompatible optional recovery fields bypass structural validation; legacy records lose writing.
- Theme, text size or collapse remounts the editor, changes source or issues forum requests; neutral Mono inherits a tinted post surface.
- Dense result rows clip long titles, reader prose exceeds 48em, narrow legacy navigation becomes unreachable, or controls shrink below 44px.

Named tests in `tests/e2e/three-region.spec.ts` precede feature code. Existing tests cover source preservation, uncertainty, account isolation, rich content, preferences and narrow navigation. Each run uses the existing evidence reporter with source/build identities, report, receipt, manifest, geometry, request ledger and screenshot attachments. Installed Edge and final BDFL validation remain required before completion.

## Delivered slice and compatibility

The navigation destinations and Boards links now share a 216px scrolling region. Board results occupy 300px; the reader uses the remaining width without a workspace cap. Both header toggles remove their track, retain the user's independent choices and perform no forum operation. Explicit board/directory browsing reveals the list. The earlier narrow disclosure remains functional until #66 supplies progressive drawers.

`WorkspaceState.reading` identifies the active thread independently of `result`, which continues to represent the browsed destination. Board/directory navigation retains reading and visible writing; an explicit thread choice uses the existing navigation/writing mechanisms. Thread downloads and post actions address the retained reader. Return navigation stores independent reader/results offsets and row selection. Board/directory failure does not manufacture a thread or erase the retained reading context.

The existing page-session schema 2 gains optional `readingKey`, `readingScrollTop` and `resultsScrollTop` fields. The reader key references an existing entry rather than serializing another copy of its rich posts. The validator checks key membership and finite, nonnegative offsets; absent fields retain legacy interpretation. Reading resolution checks the observed account and account invalidation clears incompatible content. Writing acknowledgement, original uncertain attempts and the client contract are unchanged. No external-consumer check is required because no portable model/operation changes; the library still builds from unchanged client sources.

Post presentation is flat and chronological, with complete source content, 48em prose, 24px/16px external reading gutters, 24px/16px default/Compact vertical post padding, 24px thread titles and 16px result titles. Global Text size composes once. Mono remains neutral; all palettes share geometry. Narrow titles use the pinned 20px baseline. Settings, focus, target sizes and the three interface languages remain available.

## Actual trade-offs

The pinned parent already records the costs of three fixed regions, independent pane state, retained reading, existing recovery/Text size and the HTTP-edge evidence seam. This slice adopts those decisions. The additional choices are:

1. Optional pointers and per-pane offsets extend schema 2 instead of migrating every compatible navigation/writing record. This preserves earlier recovery and avoids duplicate rich-page storage, at the cost of depending on the referenced entry and leaving older application versions unable to render the new simultaneous reader/list relationship. Missing or invalid records still use the explicit recovery path.
2. Destinations and board links share one scrolling region instead of separate independently scrolling columns. This delivers the three-track design and gives boards more width, at the cost of scrolling back toward the destination buttons after exploring a long board directory. The header controls and keyboard navigation remain reachable.

## Verification and artifacts

The preimplementation baseline is `evidence/runs/2026-11-04T08-32-11.631Z/`: all six new cases failed on the original four-track geometry or loss of the reader while browsing. Subsequent failed runs remain failed; none was relabelled as passing.

- `2026-11-04T08-34-44.438Z`: 5/6; the remaining empty-board fixture lacked the already-required native `emp` marker. The fixture was corrected to the existing client contract.
- `2026-11-04T08-35-29.895Z`: 79/83 navigation/reader/responsive cases. The old sidebar measurement was updated to its new combined scrolling owner, a positional Settings selector became a named control, direct-entry geometry adopted the new list region, and the empty fixture correction was completed. This exploratory run overlapped a source edit; it is not the final candidate receipt.
- `2026-11-04T08-37-47.781Z`: 9/9 targeted corrected cases.
- `2026-11-04T08-38-42.970Z`: 207/217 search/favorites/notices/appearance/writing cases. The failures identified superseded title/spacing expectations, duplicated medium-width New search/Saved controls, and an older narrow Saved test attempting a still-disclosed control without opening navigation. Search and Saved duplicates were corrected; the test now performs the ordinary disclosure step.
- `2026-11-04T08-39-13.785Z`: a separate authentic failing directory-collapse case, added before its fix.
- `2026-11-04T08-41-42.367Z`: addressed-writing continuity passed with the same visible editor node, complete source and exact original target; only the intended board GET occurred.
- `2026-11-04T08-43-51.601Z`: pinned-runtime run, 15/19. The four appearance covering cases found a remaining narrow Compact padding override. The actual cascade was corrected to the pinned 12px/16px list recipe.
- **Final affected run `2026-11-04T08-44-42.477Z`: 12/12 passed** on Node **24.22.0**, npm **11.21.1**, Edge. It covers all four themes at twelve widths, four text-size values and rotated three-language settings; all collapse combinations; 960px equality and uncapped 1920px reading; directory/board/empty-list retention; selection/nonzero reader and result offsets through Back/Forward and reload without reads; direct entry; and editor/source/addressed-target continuity through browsing and collapse.

Pre-review userscript SHA-256: `9988771a30f8dfad29231ee83cc5723a583a1f64dd91f8896e0705539bd661c1`.

Every run directory contains `report.md`, `receipt.json`, `manifest.json`, replayable scenario snapshots and applicable screenshots/geometry/request ledgers. Earlier exploratory runs used the shell's Node 26.0.0; the final candidate and affected verification use the repository-pinned tools. Earlier successful operation cases support unchanged contracts at their recorded candidate identities, rather than claiming those cases ran against the final bytes.

Replay final affected checks after installing locked dependencies with the pinned runtime:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e -- tests/e2e/three-region.spec.ts tests/e2e/appearance.spec.ts tests/e2e/writing-presentation.spec.ts --grep 'IM65|appearance-covering'
```

## Acceptance status

- [x] Desktop three-region geometry, collapse combinations, no empty collapsed track and manual choices, with functional existing narrow navigation.
- [x] Independent board/list and active reader; retained source/editor/target; populated directory/subboards/grouped filters/actual links and selected result/nonzero list offset.
- [x] Board/thread/another-board navigation, direct entry, truthful empty results and passive Back/Forward/reload.
- [x] Pinned baseline typography/flat rich reader/bounded prose/Mono/shared geometry, supported Text size, three languages and reachable controls.
- [x] Existing writing/recovery/account/uncertainty contracts remain in their owner; presentation changes have no forum requests and board browsing only its intended read.
- [x] Scope retains the pinned source and declared production adaptations; no later drawer/history/private feature is claimed here.
- [x] Failure inventory and named application expectations preceded feature code; authentic red/green artifacts retained; no unit-test layer added.
- [x] Final affected installed Edge qualification and BDFL validation completed against `2e80661a…`, with source equality and evidence below. Chrome remains deferred to #79. No release qualification or publication is claimed.

## BDFL correction and current candidate

The advisor's global-pane finding was confirmed through a new named whole-application test before its correction. On the prior candidate, collapsing Threads while reading a Search result left the Search list visible in the enlarged reader track. `evidence/runs/2026-11-04T09-00-34.947Z/` retains that authentic failure.

Search, Favorites, Notices and the existing Drafts overview now bind to the same mounted list visibility and `thread-list-pane` identity as board results. Their existing operations and destination ownership are unchanged. Favorites previously rendered both a separate sidebar and inline kind controls; retaining only its existing inline toolbar makes it one list root and removes duplicate control ownership. This avoids another layout-only wrapper or per-destination collapse state; it moves the saved-kind controls into the list, at the cost of requiring that list to be open to change its kind. This is an additional actual presentation trade-off.

Corrected candidate SHA-256: **`3c586122f0050e904a2d90241b4a85c24145df6e8a89ff9ab7089385c9eadfb7`**. Pinned-runtime `evidence/runs/2026-11-04T09-01-43.863Z/` passes **7/7** affected cases: Search's independent pane toggles, exact track geometry, visible reader and accessible list identity with no requests; Saved navigation, target reading and medium/narrow controls; Notices category access; and Search result-origin return. Typecheck, lint and build pass. The prior candidate's installed observations do not qualify these changed bytes; the current final candidate received the affected installed rerun and advisor validation recorded below.

Direct comparison with the pinned sample confirms the three fixed tracks, independently collapsed regions, flat left-aligned full posts, bounded prose, baseline thread/result type and neutral reader surfaces. The existing global Back/Refresh/native and new-thread/red-packet/save operation rows remain above the panes, so this intermediate slice has more persistent chrome than the sample's single bar. The earlier composer remains pending #72. These are explicit intermediate differences for final integration to reconcile, not a claim of literal sample parity. Text size, recovery and immutable preparation/review remain the parent-approved production adaptations.

### Rich-content typography correction

The advisor's comparison also established that inherited rich-post code and semantic headings still used the previous defaults. The new `IM65.rich-type` application case failed before correction in `evidence/runs/2026-11-04T09-04-52.826Z/`, measuring author, h2–h6, block code and inline code at 70%, 100% and 150% Text size.

Rich-post h2 now uses DESIGN's explicit headline recipe (26px/540/1.35), h3 its card-title recipe (24px/700/1.45), and h4–h6 body at weight 540 (18px/540/1.45). Code uses 14px/400/1.7 with the reference mono fallback stack, while post authors use the sample's 14px/540/1.45 identity role. The earlier reader-hierarchy assertion now verifies the author's stronger weight rather than requiring a larger size than the date. Mixed-language forum text retains normal tracking.

The semantic h2 rule deliberately follows DESIGN's explicit rich-post mapping instead of the sample's simplified 20px h2. This preserves distinct heading levels at the cost of a larger h2 than the sample demonstrates; it is the explicit precedence decision for this conflict, rather than an accidental visual mismatch.

Current final userscript SHA-256: **`2e80661ad54d7e327f00d1379050396dae4495f817944ffae5ecbba777c2138a`**. The pinned-runtime targeted run `evidence/runs/2026-11-04T09-06-54.340Z/` passes eight cases covering the new role measurements, existing three-language/narrow/enlarged rich-reader journeys, 48em bounds, scaling with browser font preference and the global Search-pane correction. Typecheck, lint, formatting and build pass. Earlier installed checks remain tied to their older hashes; the current-candidate affected observation is recorded below.

## Installed Edge and final acceptance

The integration driver completed and sealed `evidence/runs/65-installed-final-2026-11-04/` against the final **`2e80661ad54d7e327f00d1379050396dae4495f817944ffae5ecbba777c2138a`** candidate. Its `manager-stored.user.js` hashes to those exact bytes, and the receipt records full Tampermonkey source equality. The selected installation uses the owner's explicit Beta/stable equivalence.

The affected installed observations confirm that the real Search list is hidden with a zero rectangle when Threads/both panes collapse, controlled unsent source survives reload and these presentations, the actual author role is 14px/540/20.3px, and a real 19-row board retains the active thread with 216/300/924 geometry at 1440×900. At 390×844, Navigation opens, Escape returns focus, and client/scroll widths both remain 390px. The temporary viewport was cleared. No search was submitted and no forum mutation occurred.

Broader installed observations in `evidence/runs/65-installed-2026-11-04/` remain historical evidence for the earlier `9988771a…` candidate; its bounded request ledger is not presented as a current-candidate full ledger. Rich semantic heading/code combinations are established by the final-hash deterministic application run, while the live author measurement verifies the installed style path. Raw authenticated images and geometry remain local; the repository report contains only authored findings and relative evidence pointers. All synthetic run directories and installed bundles were preserved in the integration checkout before worktree cleanup.

The designated gpt-6.1-sol/xhigh BDFL advisor, applying `validate-gpt-code-review`, accepted the final slice after the two reproduced corrections with no remaining findings. Every #65 acceptance criterion is verified at the scoped evidence boundaries above. No portable forum-client contract changed, so its conditional external-consumer check was not triggered. Chrome, progressive drawers, later list/history integration and docked-writing work remain with their designated subsequent tickets. Executable source and its final hash were unchanged by this documentation/commit step.
