# Stable board browsing — #96

## Before implementation

The confirmed seam is the complete built application in Edge, replacing only
external HTTP responses. Workspace, editor, forum client and browser storage stay
real. Installed-manager checks supplement this seam. No portable contract change
is planned.

Failure inventory and observable expectations, recorded before feature code:

- An unopened board stretches to fill the reader; opening then shrinks and reflows
  its rows. Expect a compact list with identical position/width before and after
  selection and a calm empty reader.
- Selecting or switching a visible row may change its position, refetch the board,
  or repeat navigation. Measure the first visible row identity/relative offset
  before direct pointer/keyboard activation, then assert retained geometry and
  unchanged board-request count.
- Closing/Back may restore a raw scroll offset after different wrapping. Expect
  the same visible identity/relative position, a usable focus target and no fetch.
- A hidden narrow list may reflow at 125% text. Return must restore the measured
  identity/offset, not the obsolete scrollTop.
- Long CJK titles/usernames may overflow or hide selection/ordinary links. Check
  content bounds, current-row indication, normal link URLs and keyboard use.
- Existing saved/search/draft list presentation and column resizing may regress.
  Run the affected existing complete-app journeys after the bounded fix.

Replay and observed results will be added after each red/green run. Each run uses
the repository evidence reporter to preserve source/build hashes, screenshots,
request observations and failures separately.

## Delivered behavior and diagnosis

Desktop boards now keep their existing resizable 300px default thread column before
and after selection, with a centered empty-reader hint. Board rows use flat
separators and retain the selected contrast. Other result screens retain their
existing browsing layout.

The first complete-app red measured a 1064px unopened list shrinking to 300px on
selection. Keeping the board column present removed that reflow. Further reds
showed a 36px relative offset loss when Back introduced snapshot chrome, and a
hidden narrow list returning to row 46 instead of row 47 at 125% text. The layout
now retains a board row plus pane-relative offset across hiding, and navigation
positions optionally retain the board pane top for history restoration. Existing
records remain accepted; old records without that optional value use their prior
fallback. This is an internal navigation field, not a portable forum-client API.

The final keyboard check exposed focus being sent to a nonfocusable row div after
Back. Board return now focuses the selected or anchored subject link with
`preventScroll`, keeping the same reading position and a usable keyboard target.

## Verification and replay

Use the pinned Node 24.22.0/npm 11.21.1 toolchain and locked dependencies:

```sh
npm ci
npm run build
npm run test:e2e -- tests/e2e/stable-board-browsing.spec.ts
npm run test:e2e -- tests/e2e/responsive-navigation.spec.ts tests/e2e/column-resizing.spec.ts tests/e2e/list-context.spec.ts
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/<run-directory>
```

The regression journeys use built production bytes, real workspace/editor/client
and browser storage, and only replace external forum HTTP. Pointer actions use
measured coordinates; keyboard activation uses browser key input after focusing
with `preventScroll`. Anchor observations occur before any locator action that
could scroll. Exact 125% is a browser presentation-boundary override because the
existing Settings slider accepts 10% increments. Installed evidence additionally
exercises real Settings at 130%.

Final userscript SHA-256:
`a3377a2e38f0c258c941f398c4bace180397e3c25a84072f79f51ed5326371b1`.

Retained run directories under `evidence/runs/`:

| Run                        | Observed result                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-13T08-20-34.958Z` | Fixture setup failed without explicit UTF-8 script charset; not a product red.                                                   |
| `2026-11-13T08-21-24.592Z` | Desktop width red: 1064px to 300px.                                                                                              |
| `2026-11-13T08-22-36.186Z` | Minimal stable-column case green.                                                                                                |
| `2026-11-13T08-25-38.075Z` | Pointer/keyboard Back offset red; 125% slider input rejected by existing step constraint.                                        |
| `2026-11-13T08-26-54.540Z` | Hidden 125% reflow red: expected row 47, observed 46.                                                                            |
| `2026-11-13T08-31-46.126Z` | Four geometry journeys green.                                                                                                    |
| `2026-11-13T08-35-27.140Z` | Flat-row requirement red: raised card shadow still present.                                                                      |
| `2026-11-13T08-41-28.855Z` | 29/31 focused cases pass; search restoration accidentally changed and board regression still asserted old absolute coordinate.   |
| `2026-11-13T08-47-52.360Z` | 31/31 focused cases pass after scoping restoration to boards and reconciling the board regression with pane-relative acceptance. |
| `2026-11-13T09-05-20.951Z` | 3/4 strengthened acceptance cases pass; Back focus red retained.                                                                 |
| `2026-11-13T09-17-40.151Z` | Corrected final candidate passes all four strengthened #96 cases, including keyboard return focus, links and CJK bounds.         |
| `2026-11-13T09-21-53.517Z` | Five final cases pass on unchanged executable bytes, adding loaded-reader Back after hidden 125% reflow.                         |

All listed run manifests were verified for exact file coverage, byte counts and
SHA-256. Each retains source identities, replay fixtures, observed failures,
request/geometry attachments and screenshots. Final desktop and narrow synthetic
screenshots were inspected; long CJK text wraps without page overflow, selected
rows remain legible, and the empty reader is calm. The report and fixtures are
tracked; full packages must be retained in the integration checkout before
archiving the implementation worktree.

The initial installed package `installed-96-2026-11-13` qualifies candidate
`397a576a26463a403dcee5d65074ccdb8ab0c6c3d5a83eefdc97ec513a57c3b5` for desktop
pointer/keyboard geometry and hidden 125%/real-Settings 130% reflow. It records
Edge 157.0.4341.46 and Tampermonkey BETA 5.6.6242, exact manager-source readback,
zero board rereads/POSTs, and at most 0.1875px relative-anchor drift. Its two
invalid diagnostic measurements remain excluded. The final focus correction
has a separately recorded affected installed recheck; earlier observations are
not relabelled as final-candidate observations. Final desktop and narrow Back
return focus to a usable subject link; native Enter opens that subject. The loaded
narrow reader at 125% returns the same row within 0.109375px, with scrollTop
2532→3054.5. An earlier attempt that never reached a loaded reader is retained as
an invalid-precondition diagnostic, not a failed or passed reflow result.

The owner explicitly accepts Tampermonkey beta/stable equivalently and defers
Chrome testing to #112. Neither Chrome nor final parent visual approval is claimed
here. No live replies, ratings, reports or release publication occurred.

## Actual trade-offs

1. Keeping the compact board column reserves reader space before selection, but
   avoids opening-time width and row reflow. Existing manual resizing remains
   available rather than imposing 300px at every viewport.
2. Board rows become flat separated rows while retaining the existing high-contrast
   selected-row treatment. This removes raised-card density without expanding the
   ticket into a new selection or metadata design.
3. Hidden board restoration retains a live row identity and relative offset in
   addition to the existing raw fallback. It adds small layout-local bookkeeping
   while avoiding obsolete scroll offsets after reflow; a removed row falls back
   to the established scroll behavior.
4. Board history stores an optional pane-top measurement to preserve row position
   relative to the pane when snapshot chrome moves it. This adds one backward-
   compatible internal field; older records preserve their prior fallback. Other
   result lists keep their previous absolute-position semantics, limiting scope.
5. Back focuses a board subject instead of its nonfocusable row container, with
   scrolling suppressed. This restores keyboard continuity while retaining the
   geometry chosen by navigation.
6. Exact 125% uses the approved browser presentation boundary, supplemented by
   real installed 130% Settings. This verifies the specified reflow without
   widening #96 into a change to the product's existing 10% text-size steps.
7. The owner-selected Edge cadence and beta/stable equivalence reduce duplicate
   per-ticket host checks. Chrome remains explicitly deferred to final #112;
   this ticket does not establish browser equivalence or release qualification.
8. Complete-app evidence is retained for each failed and successful iteration,
   including superseded candidates. This costs storage but prevents later passes
   from erasing the diagnosis or overstating earlier evidence.

## Acceptance reconciliation

- [x] Stable compact desktop board column, flat rows and empty reader.
- [x] Opening, switching and Back retain visible identity/relative offset without
      board refetch or publication side effects.
- [x] Narrow return restores the same row after hidden 125% reflow, with changed
      scrollTop rather than blindly replaying the old offset.
- [x] Long CJK content, selected indication, ordinary links and Back keyboard focus
      verified in complete-app journeys and inspected screenshots.
- [x] Pointer and keyboard desktop/narrow journeys measure the visible anchor
      without locator auto-scroll masking the transition.
- [x] Failure inventory and E2E expectations predate feature code; no internal mocks
      or after-the-fact unit tests were introduced.
- [x] Final corrected candidate passes affected installed Edge focus/reflow checks;
      synthetic receipts preserve each failure and final pass. TypeScript, lint, format
      and diff checks pass. Chrome is owner-deferred to #112.
- [x] Layout/workspace/host ownership remains intact. Portable forum-client bytes
      and public contracts are unchanged; no new consumer compatibility run is needed.

The exact final build and source archive are retained in
`evidence/runs/96-final-build-2026-11-13`, including source-manifest identities,
locked tool versions, userscript/metadata and an exact file manifest.

Corrected installed receipt: evidence/runs/installed-96-corrected-2026-11-13.
