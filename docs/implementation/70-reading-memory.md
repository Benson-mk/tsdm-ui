# Loaded thread range and position recovery — #70

This slice implements #70 under parent #64 from integration commit `ad9a1bf`.
Final acceptance is complete on integration base `6bbd4ca` and executable
`a0fe0266ecc2af4c6499e769fcaac7d86e1051d45fc9b782a73d488e1db20e9e`.
The evidence history below preserves earlier candidate failures and their
then-pending qualification; the final acceptance section records the outcome.
The reference remains the experiment's `DESIGN.md` and `docs/design/sample.html`
at `bd64a5f`, with the parent's accepted source-first writing, page-session
recovery and immutable final-review adaptations. The range is a public-thread
workspace concern; private history is owned by its separate integration ticket.

## Research and failure inventory before implementation

The #68 range belonged only to the active reading entry. Leaving for another
thread rebuilt one page, losing appended pages and the visible anchor. Existing
navigation recovery already owned one parsed page per entry, list positions,
writing and uncertain attempts. The chosen seam extends that owner with a minimal
marker and keeps additional complete pages in transient workspace memory.

Failure-first application E2Es were authored for these reachable failures:

- A multi-page A → B → A return or Back/Forward refetches already loaded pages,
  loses posts or loses the nonzero anchor; independent list positions are displaced.
- Explicit page, PID, permalink, latest or different filter incorrectly yields to
  memory; account changes reuse the previous account's range.
- A pending adjacent request restores a permanently loading boundary after leaving;
  stale completion changes another context.
- Reload serializes all pages or guesses the containing page instead of using the
  actual qualified URL; direct ordinary arrival ignores a compatible marker.
- Back after reloading another thread fails to reconstruct the missing anchor.
- Deleted PID, unavailable page, changed account or incompatible returned route
  falsely claims restoration or loops.
- Malformed or unavailable storage discards acknowledged writing silently, leaks
  tokens into markers or replaces existing schema compatibility.
- Complete rich ranges grow without measurement or an arbitrary eviction policy
  silently defeats exact local return.

The E2E seam loads the built userscript through the real host, client, workspace
and layout in Edge; only external HTTP responses are substituted. No unit tests
were added. Each run produces a report, receipt, source/build manifest and relevant
screenshots, request ledger, recovery JSON and geometry through the existing
reporter. Network stubs are synthetic evidence, not installed forum qualification.

## Implemented behavior

Transient entry-to-range identities retain the original one-page result, all
loaded posts and boundaries, page-to-post provenance and the reader anchor.
Separate aliases keyed by origin, account, thread, author filter and order choose
the latest compatible range only for ordinary navigation. Ordinary aliases share
the same range object, so subsequent loads remain shared without replacing the
range belonging to another explicit history entry. Explicit page/PID/hash reads
create their own range; Back/Forward restores that entry's range. Account
observations invalidate both maps for other accounts.

The existing schema-2 navigation entry accepts an optional `readingMarker` with
qualified containing-page URL, account, PID/offset/scroll position and local
`savedAt` timestamp. No additional pages enter the serialized entry. The marker is
validated against its owning thread/account/filter and same-origin route; known
sensitive parameter names are rejected. Older records lacking markers still load.
Malformed new metadata uses the existing visible incompatible-record/export path.

Scroll persistence is debounced by 150 ms, and pagehide makes a best-effort final
capture through the same recovery owner. On reload, a missing anchor causes one
fresh read of its actual returned containing-page URL. A successful reconstruction
restores that PID and viewport offset. The rest of the previous multi-page range
must be loaded again. If the PID vanished, the existing missing-target state is
visible. Changed account/thread/filter and unavailable responses expose existing
failure states and do not retry in a loop. Writing is not retargeted.

Ordinary direct arrivals first read their requested URL to establish current
account authority, then use the newest compatible marker if one exists. Explicit
targets bypass memory. Local timestamps express only this tab's reading history;
there is no server unread claim or cross-device synchronization.

## Evidence and failure history

All run IDs below identify separate `evidence/runs/2026-11-04T…` directories.
Authentic feature reds are preserved: `11-22-59.401Z` lost the seven-post range;
`11-24-46.445Z` lacked the marker; `11-26-33.891Z` reconstructed the page but lost
the anchor; `11-28-41.691Z` lacked ordinary direct restoration;
`11-30-42.010Z` left a restored loading boundary; `11-31-48.416Z` missed Back
reconstruction after reload.

Fixture-only failures remain distinct: `11-21-30` put the other-thread link outside
parsed post content; `11-22-11` replaced the return-link TID accidentally;
`11-28-41` expected transport wording for a parsed HTTP503 document; `11-33-00`
tampered storage before the outgoing pagehide save could overwrite it. Storage
corruption now runs in the next document's init script and retains the same
malicious metadata assertion.

Scoped greens include local/reload `11-27-22`, six cases `11-29-47.963Z`, pending
and account/writing preservation `11-31-25.882Z`, ten cases `11-32-30.012Z`, and
malformed-storage/resource cases `11-35-48.642Z`.

The initial affected run `11-33-48.932Z` passed119/124. Two existing tests needed
new-document storage injection and viewport-anchor assertions respectively. The
measured #65 anchor stayed at -161.55px → -161.25px while raw scrollTop changed
700 → 736 because restored-state chrome adds36px. `11-39-38.862Z` confirms these
two cases pass with the corrected assertions.

Two existing pending-draft reload cases initially failed because they asserted
only the pending-on-load uncertainty message. Diagnostic `11-38-23.743Z` used the
accepted #68 binary with current test/source metadata and passed2/2; it is a
baseline binary diagnostic, not candidate source qualification. Diagnostic
`11-40-16.088Z` removed only the pagehide listener temporarily and passed2/2. With
the complete candidate, browser cancellation settles before outgoing restoration
and records the existing already-uncertain message. The callback returns without
saving on these board-only views. The tests now accept either truthful lifecycle
message while additionally comparing the full prior attempt identity, submission,
uncertain status and unchecked state, and preserving exact effect/no-replay counts.
No writing runtime logic was changed for this observed timing difference.

The corrected scoped affected run `11-41-41.274Z` passed124/124 Edge cases.
Typecheck, lint, format and the complete build passed on the scoped source.
The current scoped userscript hash is
`124daebb0efdf500ce93ff22d217ce320887233181815d936625033f75d3a7de`.
These checks precede latest-tip reconciliation and do not claim installed or BDFL
acceptance.

Integration with accepted #75 and #66 (`66e879e`) applied without conflicts.
Run `12-22-31.921Z` passes44/44 range, manual-history, real-drawer and public-writing
redirect-guard cases. Two newly authored combined drawer→marker→reload scenarios
at390px and900px pass in `12-23-54.195Z` before any runtime adaptation. The old
marker-free record compatibility fixture was also moved to next-document init so
pagehide cannot rewrite it; `12-24-07.344Z` passes that writing/reload scenario.
Final qualification is held for accepted #72 contextual-heading integration and
coordination with #69 automatic history.

Accepted #72 and #69 (`4c45df7`) applied without conflicts. The combined
automatic/range/reload/drawer/guard run `13-05-57.960Z` passes43/43. A newly
authored `IM70.automatic-cached-range` journey then verifies automatic page
loading, ordinary A→B→A cached return, a real390px drawer, and one qualified
reload reconstruction in `13-07-10.485Z`; the two pending-draft cases pass too.
That four-case run preserves one obsolete fixture failure: #72 moved the
contextual title outside the scrolling reader, so the old reader-contained
heading locator matched nothing. Keeping the exact heading assertion at page
scope makes `IM65.browse` pass in `13-07-50.865Z`, with its nonzero anchor and
request assertions unchanged. No runtime repair was needed. Typecheck and lint
pass on this combined source. Final freeze awaits accepted #76 integration.

Accepted #76 (`56d643d`) is included in the final candidate. Three overlapping
workspace merge sites preserve private-history activation and retained positions
while adding only the public-cache fallback. Private result omission in the sole
recovery owner remains unchanged. Run `13-18-15.032Z` passes **27/27** targeted
cases: all 16 reading-memory journeys, private body/peer omission, account and
context separation, both delayed-writing focus/composition corrections, private
manual-only scrolling, public-writing guards and pending-draft uncertainty.
The built portable 0.18.0 artifacts match all seven sealed artifact identities in
accepted consumer receipt `consumer-2026-11-04T12-49-58.907Z`; no portable change
requires a repeated consumer run. Final installed and BDFL checks remain pending.

The first frozen candidate `401715ca…` is **not accepted**: BDFL reproduced
explicit page2 → page1 → Back showing page1 content at the page2 destination.
Failure-first application run `13-29-52.441Z` independently reproduces that defect
and its loaded-range/page/PID variants (three genuine reds). The implementation
now distinguishes entry/range identity from the latest ordinary-navigation alias,
without adding persisted metadata. Run `13-31-15.883Z` passes all three corrections
plus ordinary local return, account invalidation and automatic cached-range
recovery (six cases). The earlier successful installed ordinary-return check does
not qualify this correction. Final affected checks and a replacement frozen
candidate remain pending while browser testing is paused for disk recovery.

Corrected final run `13-35-07.583Z` passes **31/31**: all 20 reading-memory
journeys (including the three explicit-entry regressions and later growth shared
through ordinary aliases), plus private separation/focus/manual-only history and
uncertain-writing compatibility. Typecheck, lint, formatting, full build and
whitespace checks pass. The corrected executable SHA-256 is
`137c392d0ef9088c1d76393505c799cbddbb28a3d854fa8c34f63021eaf0c932`.
The earlier frozen candidate and all genuine failures remain separate artifacts.
Replacement installed Edge and BDFL acceptance remain pending.

Final integration includes accepted #67 (`d42de646`) and #73 (`6bbd4ca`).
The one #67 overlap preserves draft snapshot restoration alongside public reading
positions; shared list ownership, selection metadata and safe-area ownership
remain intact. The first final run `13-57-07.573Z` completed 39 assertions but
failed its reporter with ENOSPC while writing a private-focus attachment. That
run remains **unqualified**, with its incomplete evidence preserved. After the
integration coordinator reclaimed byte-identical immutable evidence storage, the
bounded repeat `13-58-51.525Z` passes **39/39**, with every manifest file verified:
all 20 reading-memory cases, draft snapshot/account/drawer cases, private
omission/focus/manual boundaries, and the accepted safe-area cases. Static/build
checks pass. Final executable SHA-256:
`a0fe0266ecc2af4c6499e769fcaac7d86e1051d45fc9b782a73d488e1db20e9e`.
Installed Edge and BDFL acceptance of this exact integrated candidate remain pending.

## Retention measurement

`11-35-48.642Z` loads five complete rich pages, 200 posts, through five GETs. The
rendered reading pane has3216 elements and784871 UTF-8 HTML bytes. The recovery
record is161683 bytes, retaining one page and minimal metadata rather than all
five pages. CDP reports JS heap used7293912 →16086988 bytes and heap capacity
13631488 →28409856 bytes while growing from40 to200 posts. These browser-wide,
non-GC-controlled snapshots measure a representative workload; they do not prove
a hard per-range memory bound or isolate the map's retained heap.

## Distinct trade-offs

1. Complete tab-lifetime range retention preserves rich content and exact local
   return. Explicit history entries retain distinct ranges even within one
   account/thread/filter context, increasing memory with explicit navigation.
   Ordinary-return aliases share one object and its subsequent loads. These maps
   remain unbounded; no eviction is introduced without an accepted measured
   threshold. Closing/reloading releases those transient ranges.
2. An optional schema-2 marker keeps older snapshots compatible and avoids a
   second recovery owner. Malformed optional metadata rejects the record visibly
   under the existing policy rather than silently salvaging parts of it.
3. Reload stores one qualified route and anchor, then reconstructs its containing
   page. This keeps recovery small but does not restore every previously loaded
   page or promise durable/cross-device history.
4. An ordinary direct arrival verifies the account before trusting a marker. It
   can cost a second GET when the remembered post belongs to another page.
5. Debounced scroll saving and a pagehide capture balance frequent reading with
   best-effort session recovery. Abrupt process termination may lose the last
   fraction of a second, and lifecycle cancellation may settle an operation before
   restoration rather than during restoration; either path remains uncertain.
6. A visible PID and viewport offset take priority over raw scrollTop across
   changed chrome/geometry. The same reading position can require a different
   absolute scroll value.
7. A cached pending boundary becomes unloaded when left, while the old request
   stays fenced. Returning permits an explicit fresh load without claiming the
   discarded request succeeded or automatically retrying it.

## Acceptance and remaining qualification

- [x] Failure inventory and named complete-app expectations preceded feature code.
- [x] Scoped evidence covers local multi-page return, Back/Forward and explicit
      target priority with independent request counts and nonzero anchors.
- [x] Scoped evidence covers actual containing-page reconstruction, older records,
      exact writing/reply target preservation, account changes, missing/unavailable
      anchors and visible storage incompatibility/refusal.
- [x] Schema choice, resource measurement, limitations and trade-offs are recorded.
- [x] Final corrected integrated affected suite and static/build checks.
- [x] Affected installed Edge qualification against the exact candidate hash.
- [x] Final scoped BDFL validation.

Chrome is deferred explicitly to final integration #79. The portable client
contract is unchanged by this slice; its extra fields are workspace/host internals.
No live social operation, message, release or issue mutation is authorized here.

Repeat with Node24.22.0/npm11.21.1: `npm run build`, then
`npx playwright test tests/e2e/reading-memory.spec.ts tests/e2e/thread-history.spec.ts tests/e2e/navigation.spec.ts tests/e2e/recovery-origin.spec.ts tests/e2e/draft-recovery.spec.ts tests/e2e/three-region.spec.ts`.
Final evidence must be reconciled with the integration tip before acceptance.

## Final acceptance

The integration coordinator's sealed installed report is
`evidence/runs/70-installed-corrected-2026-11-04/report.md`. The complete stored
Tampermonkey source matches the final `a0fe0266…` executable. Actual installed
Edge verifies page3 → explicit page1 → Back → Forward → Back with exact returned
post IDs, repairing the original range-identity failure. After earlier page2
loaded, ordinary navigation to the actual linked thread and Back retained all
20 posts, identical absolute geometry and exact unsent source.

Reload from page2 post `H70-post-A` reconstructed only its containing page (10 posts)
and restored absolute post top259.796875px, equal to the pre-reload position,
while preserving source characters and newlines. Writing recovery changed the
reader's dimensions, so this evidence asserts the post's absolute anchor rather
than equal pane dimensions. The viewport was1119×643. No live write was performed;
installed extension request counts are not claimed. Deterministic request
ownership is covered by the final complete-application ledger evidence.

Final BDFL acceptance verified all168 files in the 39-case application manifest,
all7 installed manifest files, the complete manager source, the explicit-entry
correction and the integration with accepted67/73/76 behavior. No material finding
or distinct omitted trade-off remains. All ticket criteria are verified under
the owner-approved Edge cadence. Chrome and actual native OS CJK/IME remain final
integration obligations; they are not claimed here. The seven trade-offs above
remain the complete list for this slice.
