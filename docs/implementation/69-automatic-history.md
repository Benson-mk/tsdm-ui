# Automatic adjacent history — implementation record

Ticket #69, parent #64, starts from accepted manual-history commit `ad9a1bff`.
The tdd skill is applied at the already user-approved built-app Edge seam; only
external HTTP is substituted. Root owns installed verification and final BDFL.

## Before implementation: failure inventory and plan

- Boundary events may repeat, both edges may be near on short content, a response
  may be slow, or a range may already be exhausted. Use the delivered manual load
  path and one request guard; automatic calls must never retry a failed edge.
- A deliberate navigation/search/form preparation can start during passive work.
  Preserve shared client sequencing and fence the passive response; never make a
  parallel client or allow passive work to invalidate a prepared operation.
- Restoring a post, an exact target or a previous range can emit scroll events.
  Do not mistake restoration for a new boundary approach or chain through pages.
- Modal/hidden/inactive reading must not start passive requests. Existing controls
  remain available after returning, and a blocked event must not become deferred
  work that runs after another task has taken priority.
- Incoming pages can overlap, change identity/filter/account, contain delayed
  media, fail permission/network, or repeat an already loaded page. Inherit manual
  qualification and retry behavior; loaded content and writing remain intact.
- A long rich range increases DOM and heap use. Measure representative authored
  content and layout costs before choosing bounds; no speculative eviction or
  spacers are part of this implementation.

The first tracer is `IM69.boundaries`: scroll to 161px then 160px, verify only the
latter triggers earlier loading, then approach later; delayed requests and repeated
scrolls must still yield exactly pages 2, 1, 3 and seven unique chronological posts.
Subsequent vertical cases cover failure/Retry, stale navigation, deliberate writing
and search priority, modal pause, late media and measured rich-range growth.

## Trade-offs

1. Activate on reader scroll approaches instead of eagerly filling the viewport on
   mount. This avoids unsolicited page chains and preserves explicit targets;
   initially short/static ranges retain their manual controls until an approach.
2. Coalesce repeated scroll events into one animation-frame check and suppress
   restoration-generated events through the following rendering frame. This
   prevents navigation/reflow/media restoration from becoming network activity,
   while a fresh scroll after that brief restoration interval initiates loading.
3. Drop events while hidden, modal, disconnected or deliberately busy instead of
   queuing background work for later. Returning to reading may require a new
   boundary approach, but cannot unexpectedly replay an obsolete passive intent.
4. Prefer the earlier eligible edge when both unloaded edges are within 160px.
   This gives deterministic chronological expansion without concurrent reads;
   exhausted, unknown or failed earlier edges cannot mask an eligible later edge.

The complete-content retention and shared transport trade-offs already recorded
in #68 remain unchanged; they are not duplicated here. No eviction or new
performance infrastructure was introduced.

## Implementation and evidence

The layout owns boundary geometry and transient scheduling. The existing workspace
loader accepts an internal automatic flag that only permits an unloaded boundary;
manual Retry retains the same path. Existing request priority, account/filter
qualification, deduplication, attachment provenance, and anchor restoration remain
the single shared implementation. Public client bytes and contract are unchanged.

Authentic failure/repair evidence:

- `2026-11-04T11-20-31.914Z`: no automatic request at 160px before feature code.
  First green in `11-20-59.625Z` proves 161px no read, 160px earlier, later edge,
  delayed responses/repeated events, chronological deduplication and no end loop.
- `11-21-46.479Z`: modal background scroll incorrectly fetched. The same run had
  an incorrect target-class assertion; that harness mistake is not a product red.
  Corrected target-attribute expectation independently proves an unwanted read in
  `11-22-07.614Z`. Both guard repairs pass in `11-22-40.875Z`.
- `11-24-48.030Z`: pane collapse at an unloaded boundary incorrectly fetched.
  Restoration suppression fixes it in `11-25-11.006Z`.
- `11-30-00.825Z`: when both edges were near, a known beginning masked the unloaded
  later edge. Eligible-direction selection fixes it in `11-30-30.678Z`.

All **226** affected Edge history, navigation, search, reader, three-region and
writing-presentation tests pass in `2026-11-04T11-27-50.906Z`. After the narrow
eligible-direction correction, all **33** automatic/manual history cases pass in
`2026-11-04T11-30-30.678Z`. They include manual Retry, current-form priority in both
request orderings, explicit search, stale navigation/account responses, late media,
actual attachment bytes and short-height writing. No after-code unit tests exist.

## Rich-range resource measurement

The authored 25-page fixture retains **476 complete posts**, **476 images, tables
and code blocks**, about **2.36 million text characters** and **10,010 reader DOM
elements**. The 226-case run measures approximately **4.33MB → 21.13MB JS heap after
GC** between one and 25 pages, **0.162s cumulative layout** and **0.008s style
recalculation** during growth. Per-page completion in this local fixture ranged
from **52ms to 116ms**, including browser/test scheduling. Exact samples and all
page times are attached as `rich-range-resources.json` in the evidence package.
The final narrow rerun retains a fresh measurement of the same case.

These are bounded authored-fixture observations, not network performance or a
production capacity limit. They show expected retained-content growth without
establishing a need for an eviction policy. The earlier `11-26-24.333Z` measurement
used unsupported SVG URLs that rendered notices rather than images; it remains
historical, and the PNG-URL final fixture explicitly asserts all 476 image nodes.

Installed candidate qualification and final BDFL validation remain pending.

Final focused verification passes all **14** automatic-history cases on
`2026-11-04T11-33-13.574Z`, candidate SHA-256
`f3c53d7bc6527dbfcd66441245a864e9708097b00091533e97622e231a595147`.
The intervening source edit corrected Vue attribute ordering for lint and added a
comment; behavior is unchanged. Typecheck, build, lint, formatting and diff checks
pass. The latest integration tip remains `ad9a1bff`. Portable ESM SHA-256 stays
`d29586549dc612478a62e668700417c7b4efb9070739c10299e90d54272d2b1d`, identical to
#68's qualified consumer artifact, so no new consumer contract check is needed.

## Integration with qualified Messages peer listing

Accepted #75 commit `f2db895` was merged before final installed acceptance, with
no manual conflict or functional change to #69. Its public contract stays at
**0.17.0**, including the earlier 0.16.0 history metadata. All **52** automatic
history/manual history/Messages E2Es pass in `2026-11-04T11-35-18.726Z`.
Typecheck, build, lint, formatting and diff checks pass.

The integrated candidate SHA-256 is
`2ca6099cd175813b92dd565a8fe8b22249960d4a9b57b583fa6e16c291bf17bc`.
Its portable ESM SHA-256 is
`0b3d0915ad06285e7eeaf902331e931540b769e895a177f86adfa2674c140e2d`, confirmed in
#75's preserved clean-consumer receipt `consumer-2026-11-04T11-20-48.932Z`.
The original pre-75 candidate remains historical; installed and final advisor
acceptance must use this integrated candidate or a subsequently qualified one.

## Integration with progressive drawers

Accepted #66 commit `66e879e` was merged while awaiting the #72 wrapper. The first
combined run `2026-11-04T12-22-21.184Z` exposed a genuine guard incompatibility:
closed drawers remain mounted, so checking merely for a dialog node blocked all
automatic history. The run retains two failed cases, two passing cases and one
interrupted case; remaining cases were not run after the clear common cause.

The modal check now considers dialogs with rendered client rectangles. Both new
`IM69.drawer-pause` cases exercise the actual Boards and Threads drawers at 390px:
scrolling the reader underneath the modal and closing it produce no request;
a fresh reader approach afterward loads the qualified later page. All **28**
automatic-history, progressive-drawer and redirect-writing-guard cases pass in
`2026-11-04T12-23-49.736Z`. This adapts the existing modal-pause decision without
adding a distinct trade-off. #72 compatibility and final installed/BDFL gates
remain pending; this intermediate build is not the final acceptance candidate.

## Integration with docked writing

Accepted #72 commit `406608d` is integrated. The only content conflict was the
moved reader template: #72's conversation region and contextual heading are
retained, with the automatic scroll listener attached to its actual reading pane.
No new automatic-history policy or distinct trade-off was introduced.

All **56** affected automatic-history, docked-writing and progressive-drawer Edge
cases pass in `2026-11-04T12-49-12.996Z`. Coverage includes both real drawers,
preparation priority, complete source/visual undo and browser composition,
modifier-key review guards, and retained reading with the docked editor.
Typecheck, build, lint, formatting and whitespace checks pass.

The frozen combined userscript SHA-256 is
`3383e7fdcee873ae49234ed0cb0ff8d93079c943db619642355100a330ac35e0`.
Portable ESM remains the accepted 0.17.0 artifact `0b3d0915…` with no #69 changes.
Scoped installed Edge and final BDFL acceptance remain pending.

## Final scoped acceptance

Root sealed installed Edge evidence in
`evidence/runs/69-installed-2026-11-04` in the integration checkout. All seven
manifested files and the full manager-returned source match exact `3383e7fd…`.
Native scrolling on public thread `H69-thread-A` loaded earlier from 10 to 20 unique
posts and later from 20 to 30 in returned chronological order. Exact retained
writing source/account/target stayed intact. Appending retained the former loaded
end position rather than jumping to the new end. The actual Boards drawer at
900×800 opened and closed over that retained range without changing source.

The prepend samples bracket both deliberate user scrolling and response insertion;
they do not independently establish zero response drift. The installed drawer
observation establishes coexistence, not a complete background-request ledger.
Exact insertion geometry and induced suppression/priority/failure cases remain
supported by the separate full-app synthetic evidence at their stated scope.
No publication was invoked. Chrome and final native OS CJK remain #79 obligations.

Final BDFL accepted this exact candidate after tracing the shared loader and
verifying the **56/56** final cases, **226-file** synthetic manifest and seven-file
installed package. No material finding or additional distinct trade-off remains.
Later #76 private-history integration requires its own affected checks under the
changed candidate identity; this acceptance does not pre-qualify that feature.

All eight #69 acceptance criteria are verified under the owner-approved cadence:

- [x] Qualified earlier/later boundaries load within 160px through the manual path;
      repeated events do not overlap, duplicate or loop exhausted/failed edges.
- [x] Manual controls/Retry, complete loaded content, stable anchors and context
      isolation remain intact through loading/refusal/failure.
- [x] Deliberate navigation/search/current-form preparation retain shared-client
      priority and stale completions cannot claim success.
- [x] Full-app cases cover both directions, overlap, delay, rapid navigation,
      late media and concurrent writing/preparation with ordered HTTP ledgers.
- [x] Representative long rich-range resource use is measured; no speculative
      eviction, virtualization or arbitrary retention bound was introduced.
- [x] Pinned design, ADR ownership/recovery and inherited writing/account/source/
      financial guarantees are retained at this slice's scope.
- [x] Failure inventories and named full-app expectations precede functional
      changes; replayable artifacts retain genuine failures separately.
- [x] Static/build, affected installed Edge and final BDFL pass; the portable
      contract is unchanged, four distinct trade-offs are recorded, and no
      additional live social/write/read-effect or release authority was used.
