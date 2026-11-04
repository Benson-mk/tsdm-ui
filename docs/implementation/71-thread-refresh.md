# Thread refresh and local arrivals — implementation record

Ticket #71 starts at `4c45df7`, with accepted #68 manual and #69 automatic history.
Accepted #76 (`56d643d`), #67 (`d42de64`), #73 (`6bbd4ca`) and #70
(`70c5bfb`) are integrated before final qualification.
The tdd skill uses the already approved complete built-app Edge seam and external
HTTP substitution. Root owns current native observations, installed qualification
and final BDFL. No live social traffic or fixture timer is production evidence.

## Research and premise verification before implementation

Current native observation `71-live-refresh.json` (root, 2026-11-04) reloaded the
actual returned public thread1269743 page5. The response was200, not disk cached;
no Cache-Control/Expires/Pragma/Retry-After/ETag/Last-Modified/Age or meta-refresh
was observed. Pager current5, prior4, no next, and IDs78298708/78306905 agree with
#68 native evidence. #68 also qualifies classed last links and native latest/exact
redirects. This establishes a supported fresh reread, not a server polling rate.

The delivered host supports `readPage(url,{fresh:true})` via cache:no-store and
shared client request sequencing. Public refresh can reuse that operation without
new portable models. Opaque latest redirects may require document navigation, so
background checks will use the actually returned newest loaded page rather than
manufacturing or silently navigating a redirect. Only a qualified ascending final
loaded page enables opt-in checks. An intermediate page remains manually refreshable.

App policy:120seconds between successful checks while active, off initially;
failures stop automatic checking and expose deliberate recovery with exponentially
increasing cooldown (2,4,8,16, then30minutes). This bounds a single tab's successful
checking to at most30reads/hour and backs off without retry loops. These are
conservative app choices, not server-endorsed limits or instant-delivery promises.
A newly offered later page is followed only through the existing returned boundary;
no guessed page number, skipped-page pseudo-range or inferred unread count is used.

## Failure inventory and vertical plan

- Refresh must not discard loaded earlier pages, duplicate IDs, or count edits and
  same-ID merged replies as arrivals. A post first seen from an older page is not
  a new reply. Refreshing an intermediate range cannot establish latest provenance.
- The reader may scroll during a delayed request. Capture current position just
  before applying: follow only within64px AND the prior loaded boundary was known
  latest. Else preserve its stable post/offset and offer a local distinct-ID count.
- A refreshed final page may reveal a new server page. Keep actual next/latest URLs;
  do not invent contents, counts, or force a document navigation in the background.
- Checks and boundary loads share one pending owner. Deliberate navigation/search/
  preparation invalidate old completions; account/filter/thread changes cannot mix.
- Hidden pages, another active destination and any rendered modal pause checks.
  Visibility restoration must not replay a backlog, and merely enabling checks
  must not fetch immediately. Failure pauses until explicit recovery after cooldown.
- A stale or permission/network/challenge/throttle response keeps compatible posts
  readable, exposes status, and never claims a successful refresh or schedules a loop.
- New-reply activation must resolve to known content, clear only the local indicator,
  and never imply server unread/read receipt. Writing source/target and review guards
  must remain unchanged during passive checks or scrolling.

First tracer: manual refresh on a range ending at page3 retains earlier loaded IDs,
updates an existing post without counting it, discovers108 once, preserves an
off-bottom anchor and offers New replies(1); repeated refresh cannot recount108.
Then vertical tests establish <=64px following vs65px/nonfinal, opt-in timing,
failure cooldown, modal/destination pause and shared request priority.

## Implementation and measured evidence

The reader now refreshes its actual newest loaded public page through the existing
fresh read contract. Per-page membership replaces that page's returned IDs while
retaining other loaded pages; stable IDs update existing complete posts, and a
separate seen-ID set prevents a temporarily absent ID from being counted again.
The arrival action targets the loaded end and clears only the local indicator.
The current reading position is captured after the request completes, before DOM
insertion. Both prior and freshly returned latest boundaries plus at most64px
follow; a newly exposed unloaded page disqualifies following. Otherwise the anchor is
restored. Delayed images preserve that decision until a new reader scroll intent.

Automatic checks share the boundary owner and epoch. A one-second lifecycle tick
starts no network request unless the opt-in, qualified public destination,
visibility, dialog and deliberate-work guards all pass. A paused-to-active
transition starts a complete new120second interval, including after browser timer
suspension. Failure keeps compatible posts readable and requires a deliberate
Refresh thread after the displayed cooldown. Manual/checking/paused/failed states
and opt-in are translated in all three languages. The label is a44px hit target.

Evidence packages retain reports, receipts, source/build identities, manifests,
scenario snapshots, request ledgers, screenshots and reading geometry. Relevant
runs, in `evidence/runs/`:

- `2026-11-04T13-12-27.538Z`: genuine initial range-refresh red (earlier pages lost).
- `2026-11-04T13-15-40.089Z`: genuine64px follow red, before follow implementation.
- `2026-11-04T13-19-34.206Z`: genuine missing status/policy/removal reds; delayed
  current-position expectation already green through the inherited anchor owner.
- `2026-11-04T13-21-41.483Z`: genuine late-media follow red607px; stale-navigation,
  account-change and preparation collisions green.
- `2026-11-04T13-24-09.097Z`: genuine reappearing-ID and26px hit-target reds.
  A latest-link expectation omitted the established `#lastpost` suffix and was
  corrected without weakening returned-destination behavior; this is a fixture
  expectation correction, not a product regression.
- `2026-11-04T13-25-08.653Z`: all17 #71 built-app Edge cases pass in6.2minutes.
  Includes actual120second failure cooldown, deliberate failure progression to
  fourminutes, actual120second opt-in cadence and modal pause without backlog.
- `2026-11-04T13-26-28.550Z`: all35 existing #68/#69 Edge cases pass.
- `2026-11-04T13-50-39.699Z`: genuine overlap attachment-source and newly exposed
  later-page follow reds; top-anchor expectation already green. A post retained
  by an older page cannot use a newest page that no longer contains it.
- `2026-11-04T13-51-26.156Z`: six targeted cases pass after those bounded fixes,
  including64/65px and preserved-range regressions. Membership now uses page
  identity with each actual returned URL; surviving IDs resolve to a page that
  still contains them.

Typecheck, lint, formatting and both builds passed before final #70 integration.
No portable contract was changed by #71. Earlier exploratory long runs overlapped
later test development and are superseded by the frozen17-case run above.

A native headed Playwright experiment returned `document.hidden=false` for both
pages after bringing the other forward. A native lifecycle freeze/active also
produced no visibility event. Neither is claimed as hidden-tab qualification and
no clock, document visibility or internal application collaborator was mocked.
Actual installed Edge background-tab timing was qualified separately by root in
the final installed evidence described below.
Accepted #70 is integrated with its explicit-entry/shared-ordinary-range identity
intact. Cached returns restore membership, seen IDs and absolute failure cooldown;
they clear in-flight and automatic-check flags. A local successful-check timestamp
is displayed for freshness and stays unchanged on failure. It is the client clock
when a check succeeded, not a forum read receipt or server time.

`2026-11-04T14-15-49.063Z` preserves genuine cache-cooldown, cached-opt-in,
paused-toggle and missing-timestamp reds. `2026-11-04T14-16-46.931Z` and
`2026-11-04T14-18-11.828Z` retain intermediate outcomes. The accepted #67 behavior
keeps three prior reading posts beside Search, so IM69/71 expectations now assert
those three posts and absence of the delayed new ID rather than expecting an empty
reader. This is an integration expectation correction; retained search criteria
and request-ledger assertions remain unchanged. The paused-toggle test uses a
click because uncheck waits for a control that correctly disappears once disabled
on an unqualified range; unchanged executable passes that corrected assertion in
`2026-11-04T14-20-29.494Z`.

Candidate frozen on `70c5bfb`: userscript SHA-256
`17af4860c13056a653424d3d2d32203d459bc0237112921f10912e4a69541fce`.
The first complete124-case run `2026-11-04T14-22-13.027Z` passes120 and exposes
four real control occlusions. Expanded sticky refresh/history controls covered
links at remembered anchors and the post reply in a narrow recovery-banner view.
All23 #71 cases, including both actual timers, passed in that run; its four
regressions remain failed evidence. In coordination with #74, the entire history
control group now lives as the final child of the existing conversation heading,
with static positioning. It no longer overlays post content or introduces another
header. `2026-11-04T14-30-54.155Z` passes21 short #71 cases and three former
regressions. The remaining #70 automatic-cache test issued its synthetic scroll
inside the existing two-frame restoration fence; waiting the same two animation
frames already used by #69 before expressing a scroll intent passes in
`2026-11-04T14-31-58.511Z` on unchanged corrected bytes. The actual history/cache
expectations remain unchanged.

The corrected candidate above subsequently passed final affected Edge qualification,
exact installed Edge and final BDFL acceptance, as recorded below.

## Distinct trade-offs

1. Refresh rereads the actual newest loaded page instead of invoking an opaque
   latest redirect in the background. This preserves a contiguous verified range
   and avoids implicit document navigation, while a newly exposed server page
   requires the existing returned Load later/Jump to latest action.
2. Automatic checking is opt-in and qualified only for an ascending final page.
   Intermediate and reverse-order views remain manually refreshable. This narrows
   automatic availability to the directly observed case instead of asserting an
   unobserved polling contract.
3. The120second success interval and2/4/8/16/30minute failure cooldown are explicit
   per-context app policy. They trade immediacy and instant manual retry for bounded
   traffic; no server-approved rate or Retry-After handling is claimed. Failures
   stop automatic work and require a deliberate retry rather than a retry loop.
4. Pauses restart a full interval. This avoids bursts after hidden/modal/conflicting
   work at the cost of delaying the next discovery even if a check was nearly due.
   The one-second lifecycle tick keeps scheduling simple and observable with up to
   one second of ordinary timing granularity.
5. Refresh reconciles only the newest page. Other loaded pages stay readable as
   previously observed snapshots, rather than issuing a multi-page reread that
   could discard the reading context or multiply server traffic. Membership and
   seen-ID metadata retain complete content and prevent false repeat arrivals;
   this extends the accepted #68/#69 no-speculative-eviction decision.
6. New replies is a local distinct-ID indicator for the loaded context, not server
   unread state. Edited/merged posts and ordinary old-page loads remain uncounted;
   a reload/new context does not claim to reconstruct historical unread counts.
7. Following requires both prior and returned latest-page evidence and uses the
   exact64px pre-insertion reading threshold. It preserves
   bottom position through pending media only until user scroll intent. This gives
   near-end readers continuity while prioritizing a later deliberate move over
   following content that was already arriving.

8. Leaving and restoring a cached range resets automatic checking off, while
   retaining local arrivals, last success and the absolute cooldown. Re-enabling
   remains deliberate and cannot bypass failure backoff via Back; this costs an
   extra opt-in after a cached return. Browsing with the same retained reader
   pauses its existing setting instead of reconstructing a range.
9. The displayed last-success timestamp records the local completion clock. It
   helps readers judge freshness and remains meaningful through failure, without
   claiming server time, unread state or durable history.

10. The growing history/check controls join the existing conversation heading
    instead of staying over the reader as a sticky overlay. This keeps links and
    post actions reachable at remembered offsets and preserves the existing
    minimum reading region. A long context heading can require the established
    outer conversation scroll; no second header or competing placement is added.
    #74 uses this same placement and will reuse it at integration.

Inherited request cancellation, source-first writing, owner/account guards,
complete rich-content retention and recovery ownership reuse the trade-offs in
#68/#69/#70/#76; they are not counted again here.

## Final qualification and acceptance

The corrected exact candidate `17af4860c13056a653424d3d2d32203d459bc0237112921f10912e4a69541fce`
passes all122 final affected cases in `2026-11-04T14-50-49.422Z`; its386 manifest
files verify. This includes all21 untimed #71 cases and all existing public manual
history, automatic history, reading memory, retained-list context, private history
and safe-area cases. The two real-time cases remain passed separately in the
prior124-case run on the same scheduler implementation; they are not represented
as having run in the122-case corrected candidate package. Static checks, build and
whitespace checks pass. The portable contract remains unchanged by this ticket.

Root qualified the exact corrected manager source in
`71-installed-corrected-2026-11-04`: manual refresh, default off, actual hidden
pause and a complete resumed visible interval. With user assistance actual visible
state began at14:56:48.784UTC; the local successful-check time advanced at14:58:50,
121.216seconds later, while exact source and12 loaded IDs remained unchanged.
Interrupted earlier intervals remain historical observations, not passed intervals.
The earlier candidate's161second hidden observation retains its historical scope;
the corrected candidate independently shows actual hidden pause. Its final CDP
buffer contained no request events, so no exact installed request count or full
network ledger is claimed. Whole-app request-ledger cases independently qualify
request ownership, no overlap, cooldown and cadence.

The five installed evidence files verify. After recording, automatic checks were
turned off and the temporary passive visibility listener removed; normal actual
visibility remained enabled. No publication or message occurred. A pause prevents
new checks; an already-issued nonconflicting read can still settle. No visibility
abort or cancellation of already-issued HTTP is claimed.

Root's final gpt-6.1-sol/xhigh BDFL validation accepted source, final synthetic and
installed evidence with no material finding or additional distinct trade-off.
All eight acceptance criteria are verified at the owner-approved scope. Chrome
and final OS CJK qualification remain #79. Root authorized the single ticket commit;
issue closure and pushing remain root-owned and outside this worker's action.

Acceptance mapping against the issue:

- [x] Current returned-page refresh/latest semantics, explicit conservative
      cadence/backoff policy, manual refresh and default-off automatic checks.
- [x] One history/check owner; lifecycle/modal/destination/deliberate-work guards;
      translated manual/checking/paused/failed states and deliberate recovery.
- [x] Exact64px pre-insertion following with both prior and returned latest
      evidence; intermediate ranges and newly exposed later pages do not qualify.
- [x] Stable anchor otherwise; distinct local arrival IDs, known-content action,
      same-ID edits/merges/old-page loads and reappearing IDs do not recount.
- [x] Complete installed automatic cadence qualification passes through an actual
      uninterrupted visible interval; synthetic cooldown/overlap/stale account and
      context, top/off-bottom/bottom, latest and preparation/search collisions pass.
- [x] Scoped inherited design, single writing/review context, source/account and
      financial guards preserved by the full affected regression suite.
- [x] Failure inventory and named complete-app Edge expectations preceded their
      repairs; receipts, manifests, source/build identities and artifacts are retained.
- [x] Static/build, final synthetic, exact installed Edge timing and final BDFL
      acceptance pass. Chrome and final OS CJK remain #79 under the owner-approved
      cadence.
