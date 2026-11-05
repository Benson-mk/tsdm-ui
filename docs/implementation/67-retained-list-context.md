# Retained Search, Saved, Notices and forum drafts (#67)

Parent: [#64](https://github.com/Benson-mk/tsdm-ui/issues/64). Ticket:
[Browse search, saved items, notices and forum drafts beside retained reading](https://github.com/Benson-mk/tsdm-ui/issues/67).

The current experiment `DESIGN.md` and `docs/design/sample.html`, matching
`bd64a5f48989cf33a2830768f07581c7fac07a2a`, are the design inputs. This slice
extends #65's list/reading ownership. Search, Saved, Notices and forum drafts
retain the active public thread and visible source editor while browsing.
Their operations still use the existing forum client and writing guards.

Search opening still requests the current form; only deliberate submission
searches. Saved, Notices and Drafts overviews do not fetch their lists. Explicit
notice loads retain their actual read effects. Search identity and edited
criteria, favorite record identity, notice category and body, returned links,
and native destinations retain their existing semantics.

All four lists use the shared results scroll owner. A selected result keeps its
selection in the target entry as well as the originating list. Forum draft list
pages now have validated, account-bound snapshots in navigation entries, so
Back, Forward and browser page-session recovery restore their own rows and
nonzero positions without another request. Restored drafts explicitly say their
account/content have not been rechecked. A fresh changed or unknown account
invalidates private draft snapshots. Choosing a draft still invokes the sole
writing context's existing replacement and current-source checks.

## Failure inventory and seam

The approved seam is the complete built userscript in Edge with only external
HTTP substituted. Tests observe visible controls, geometry, source, request
and effect ledgers. They do not mock workspace/client functions. The initial
research/failure inventory was recorded before feature code at
`evidence/runs/79-private-document-aliases-2026-11-05/references/67-research.md`.

- List presentation may replace the reader, reset its position, or hide the
  active source editor; a current-form fetch must not become a search.
- A selected result may lose its search ID, edited criteria, record identity,
  category, selection or nonzero list offset. History must not replay effects.
- Draft pagination may overwrite a global list, resume the wrong row, bypass
  the writing guard, or expose another account's snapshot.
- Direct entry must not invent a reader or fetch a thread automatically.
- A delayed or uncertain operation must not gain authority from presentation,
  passive history, or recovery. Existing operation suites remain applicable.
- Recovery must distinguish an old snapshot from a fresh account/content
  observation and remain honest when storage is unavailable.

## Verification and evidence

`tests/e2e/list-context.spec.ts` contains nine named J67 application journeys;
`tests/e2e/messages.spec.ts` adds a shared-list-owner regression journey.
Each attaches a screenshot plus list/reader geometry and the independent HTTP
request/server-effect state. The repository reporter adds report, receipt,
source/build identity, source fixtures and manifest to each run.

Recorded vertical slices:

| Run (UTC on 2026-11-04) | Observation                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 09-52-14.201Z           | Genuine red: opening Search removes the active thread.                                                                                         |
| 09-53-41.676Z           | Search retained-reader/history slice green.                                                                                                    |
| 09-54-50.190Z           | Saved selection red; a notice fixture label failure is distinct.                                                                               |
| 09-56-07.270Z           | Search/Saved/Notices three journeys green.                                                                                                     |
| 09-58-16.913Z           | Genuine red: draft Back cannot restore the prior list page.                                                                                    |
| 10-00-07.242Z           | Four list/history journeys green.                                                                                                              |
| 10-01-26.791Z           | Genuine red: draft selection is not represented.                                                                                               |
| 10-02-32.046Z           | 201/206 affected cases passed; three search result-heading regressions, one now-ambiguous favorite-page selector, one ENOSPC artifact failure. |
| 10-07-36.342Z           | Genuine red: restored draft snapshot lacks its old-content notice.                                                                             |
| 10-09-25.523Z           | Interrupted run without final report/receipt; unqualified.                                                                                     |
| 11-15-20.892Z           | Typecheck/lint and 32 focused/regression cases passed, including the previously failing search/favorite cases and draft account invalidation.  |
| 11-16-30.007Z           | Direct-entry placeholder red; review fixture initially omitted a required own-post source response and is not a product failure.               |
| 11-16-55.797Z           | Genuine red: selected favorite/notice loses its selected state while the target is open.                                                       |
| 11-17-54.254Z           | All eight J67 journeys green.                                                                                                                  |

Early 09-47-56.666Z, 09-49-42.465Z and 09-51-03.428Z runs diagnose fixture
encoding/form completeness; they are not feature-red evidence. Evidence is
retained under `evidence/runs/<timestamp>/`. A final merged-candidate run is
required after integration dependencies arrive.

Integration with accepted #66/#68/#75 at
`66e879ec6835277c47d7986bda4bec46eac9e4ab` preserves `selectSection`, the
progressive Teleport drawers, thread-range ownership and redirect writing
guards. The 12-23-27.062Z run passed 18/21: Search's raw scroll delta reflects
the accepted absolute-anchor contract when snapshot chrome changes; replacing
that assertion with visible-row coordinates passes. The 12-25-03.030Z run
demonstrated genuine Saved/Notices drift: a restored list anchor was incorrectly
passed to `scrollIntoView` when the retained reader was at zero. Requiring an
explicit post target fixes both, verified at 12-26-35.465Z. Draft rows then
failed their visual-anchor assertion at 12-27-30.359Z and joined the shared
capture selector. All 21 list/drawer/redirect cases passed at 12-28-09.132Z,
including the 767→768px draft/source/history journey.

The 12-29-46.229Z regression showed the interim destination-kind switch lost
the existing Messages pane's nonzero offset. Selecting the actual shared list
owner (`#thread-list-pane`) preserves it without changing private persistence
or read semantics. All 13 targeted list/Messages cases passed at
12-30-21.656Z. These corrections adopt the existing shared-pane and visible-anchor
contracts; they introduce no additional operation or persistence policy.

The accepted #72 composer integration at
`406608dfb55f2d55b10ba4cf69a138f465489386` places the honest direct-entry
placeholder inside its conversation wrapper. No editor or publication code was
changed by #67. Typecheck/build passed; all 15 focused J67, Messages-region,
docked-writing, contextual-chrome and visible-history journeys passed at
12-49-26.558Z. Lint/format passed; all six current draft resume, publication,
pending/uncertain recovery and immutable-review/account-change cases passed at
12-50-27.939Z. Runtime build SHA-256 is
`c576ce10f381d6dc82fab91d0ac6b31e42a1d2b2a6e2c981e452aeff9b8bf52a`.
Final installed/advisor acceptance remains pending.

The UX53 baseline investigation preserves the original failures at
13-06-13.120Z and 13-07-05.782Z. The accepted #72 baseline's raw offset was
400→370; #67's existing explicit-target correction produces 400→436. The
geometry attachment establishes why the latter is correct: the list pane top
changes 59.390625→95.6875px as snapshot chrome appears, while the selected row
remains at 787.25→787.546875px (0.297px rounding). Per the accepted #68 contract
and integration-owner direction, UX53 now requires a nonzero offset and no more
than 0.5px visible-row drift, preserving its category/native/request assertions.
Exact numeric offset remains the unchanged #66 same-list drawer-docking rule.
No runtime correction was needed for this obsolete assertion. Accepted #69 at
`4c45df7c8545f9cbacabb9c93af4f4e63e1a72cb` merged without conflicts; final
qualification waits for #76's integration.
Typecheck/build and nine J67 cases passed at 13-09-50.408Z; that run's UX53
artifact attachment failed with ENOSPC before its assertions and is not counted
as a behavioral failure or pass. The isolated retry at 13-10-35.650Z passed
UX53 with the geometry attachment and all existing request/native/category
checks intact.

Accepted #76 at `56d643d57262fcd5e8b152231f463eb4bce4d7aa` is integrated.
Shared navigation retains private activation, explicit private target ownership,
and its resumed-writing/composition focus guard. The direct-entry placeholder
is absent while private reading or its deliberate-load presentation is active.
The first combined run at 13-18-53.667Z passed 24/26: private-browse-list hit
ENOSPC while attaching evidence, and the Messages list-owner test still required
an obsolete exact raw offset. The diagnostic run at 13-19-44.817Z preserved
that assertion failure and passed private-browse-list; its error-context write
also hit ENOSPC. Messages geometry showed pane top 59.390625→95.6875px,
scroll offset 320→356, and peer-row drift of only 0.297px. Like UX53, that
test now checks nonzero scrolling and no more than 0.5px row drift while keeping
the no-additional-request assertion. No runtime change was needed for the
test correction. All 26 focused list, Messages, private target/focus/composition,
draft resume/review and UX53 cases passed at 13-20-37.594Z.

Current candidate userscript SHA-256:
`e7b62675fe76cdf0db2daf9f724befb8f4d83a7a262135a4af47b224cf7d3256`.
Typecheck, lint, formatting and full application/library build pass. The shared Git stash race during
reconciliation was recovered by restoring only the accidental #70 application,
then applying #67's immutable stash hash. Both original stashes and extra-file
safety copies remain preserved; the final diff contains only #67's scope.

Final installed Edge evidence is sealed at
`evidence/runs/67-installed-2026-11-04/`.
Its six-file manifest covers the exact full manager source, receipt, observations,
report and two screenshots. The installed candidate retained public reading and
local writing while loading two real Saved records, selecting a Saved thread
through Keep current writing, and restoring the original reader/list/selection
with Back. Passive Messages browsing and the 390×800 Saved drawer also retained
reading and source. The viewport override was reset. No consequential action
or private fetch was performed in this verification.

The live list has two rows; nonzero large-list offsets and Search/Notices/forum
draft journeys remain deterministic full-application coverage. The installed
evidence makes no extension-host request-count claim. Final BDFL review accepted
the exact candidate, the 26-case/94-file automated evidence, all six installed
files and both documented trade-offs with no material finding. Chrome and final
OS CJK remain #79; no release qualification is claimed.

Replay with Node 24.22.0 / npm 11.21.1:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright test tests/e2e/list-context.spec.ts tests/e2e/search.spec.ts tests/e2e/notices.spec.ts tests/e2e/favorites.spec.ts tests/e2e/drafts.spec.ts
```

The affected suites cover draft resume/save/publication, pending and uncertain
attempts, current-account refusal, search restrictions/redirects, notice
effects/categories, and favorite operations. The portable forum-client contract
is unchanged. Installed Edge qualification and final BDFL validation are owned
by the integration agent. Chrome remains deferred to #79 under the user's
approved cadence. No live read/write authority is implied by these fixtures.

## Distinct implementation trade-offs

1. Per-entry draft snapshots use more browser page-session storage than the
   previous single in-memory list. They make passive page/offset restoration
   truthful and avoid hidden reloads; existing storage-failure handling remains
   authoritative, and snapshots are never presented as a new server check.
2. Keeping selection metadata on both the origin and target entry adds a small
   amount of navigation bookkeeping. It preserves the originating list's
   highlighted record while reading the target and on Back/Forward without
   guessing a favorite/notice identity from a thread ID.

## Acceptance status at the approved ticket scope

- [x] Existing destination context beside retained reading and source writing;
      honest direct entry; shared list/reading ownership.
- [x] Existing operation semantics and account/source guards retained in
      affected application journeys.
- [x] Selection and nonzero list offset on Back/Forward without operation replay;
      validated draft page-session recovery.
- [x] Representative destination journeys, draft resume guard, review entry,
      account invalidation, pending/uncertain operation regressions.
- [x] Failure-first complete-application tests and replayable local artifacts.
- [x] Integrated #76 candidate static/build and focused affected checks.
- [x] Affected installed Edge qualification and final BDFL validation.

This checklist is implementation evidence, not a change to the GitHub ticket.
