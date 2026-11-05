# Read a selected private conversation

Implements [#76](https://github.com/Benson-mk/tsdm-ui/issues/76) under
[#64](https://github.com/Benson-mk/tsdm-ui/issues/64). The initial integration base
was `f2db895`; accepted drawer/guard `66e879e` and docked-writing
`406608d` are integrated. Private sending belongs to #77; this slice exposes no sender.

## Qualified contract and boundaries

The reference is experiment commit `bd64a5f48989cf33a2830768f07581c7fac07a2a`.
The current DESIGN.md and sample hashes were independently checked against the
parent's pinned values. Existing Text size/derived Compact spacing, three
languages, source-first writing, immutable review and page-session recovery are
retained adaptations.

Before code, the current controlled native history and pinned native-client
source `6d8518167a68d5d7750f5dc7a4aff65f21c14eac` established the route
`home.php?mod=space&do=pm&subop=view&touid=<peer>`, named peer header,
`#membernum`, `#pm_ul > dl#pmlist_<id>`, sender profile UID, complete body after
the first line break and before the trailing native date, and the returned
`#last` marker. The observed messages are in chronological DOM order. The
native client's reversed collection supports its own UI and is not imported as
a reason to reverse the observed forum history.

Root owns the authorized live controlled conversation. Opening that history
removed its native unread prompt. Opening/fetching may mark it read; the UI
states that effect before selection and loading. Local anchors do not establish
server read receipts. Direct native arrival may already have had a read effect;
the workspace never repeats it automatically. Authenticated raw captures include
private content and tokens and remain private. Public tests use authored aliases.

The current controlled history is one page. Native source supports returned
`.pg` links and previous/next provenance; authored application cases exercise
those shapes. No extra conversations/messages were manufactured to fill pages.
Installed multipage behavior remains unobserved. The parser accepts only returned
same-origin same-recipient pages, not guessed endpoints or numeric maxima. A
complete loaded count must match the returned conversation total before the UI
claims all known messages loaded; other boundaries remain unknown.

## Implementation and compatibility

`PrivateConversation` and `PrivateMessage` are distinct serializable models.
`readPrivateConversation` uses the same client sequence and account generation
as public operations. Generic `readPage` refuses effectful private reads.
Identity conflicts, public-thread responses and malformed private structure are
refused rather than reinterpreted. Rendered body nodes use the existing content
sanitizer; scripts, forms and native delete/report/send handlers stay inert.
Supported prose, line breaks, links, quotations, code and images retain content.
This does not qualify additional private authoring transforms or attachments.

The private range owner retains pages by navigation context in document memory.
Manual returned earlier/later loading deduplicates stable IDs, preserves the
visible message across insertion/late media and keeps loaded content on failure.
New requests and account/recipient changes fence stale results. Exact message
links already in the loaded range focus locally without rereading. Missing
explicit targets remain visibly unresolved.

Peer lists remain alongside the private reader, with current peer and nonzero
list scroll retained. Public/private and peer history entries remain distinct.
Browsing Boards retains the private reader without creating a second placeholder.
Private list previews and full conversation results are omitted from the existing
single recovery serialization owner. Reload shows an explicit Load action and
no private body/request. Compatible writing and uncertain-attempt snapshots remain
unchanged. No new persistent private record shape is accepted. Older versions
may reject the newly recognized private destination visibly through their
existing incompatible-record path; no silent migration is promised.

Portable contract **0.18.0** adds the operation, models and private-conversation
result/destination kind. Structural clients and exhaustive consumers must update.
The 0.16.0 history and 0.17.0 peer-list contract notes remain intact. The packed
consumer verifies strict declarations without DOM types and the new method.

## Failure-first application evidence

The approved seam uses the built userscript with real Vue/workspace/client/host
and only external HTTP substituted. No unit tests were added. The preimplementation
inventory at `evidence/runs/79-private-document-aliases-2026-11-05/references/76-research.md` covers implicit reads,
recipient/account confusion, stale responses, unsafe content, guessed paging,
anchor loss, private serialization, writing transfer and compatibility.

| Slice or observation                                                  | Run                                 | Outcome                                  |
| --------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------- |
| Missing integrated private entry/read-effect disclosure               | `2026-11-04T11-39-03.748Z`          | Genuine red                              |
| Named reader, complete body, chronological IDs, native last target    | `2026-11-04T11-41-30.470Z`          | Pass                                     |
| Missing passive direct-arrival Load                                   | `2026-11-04T11-42-12.006Z`          | Genuine red                              |
| Intermediate Vue template URL constructor error                       | `2026-11-04T11-42-45.816Z`          | Failed implementation, retained          |
| Passive direct arrival/reload and no private body serialization       | `2026-11-04T11-43-41.809Z`          | 2 pass                                   |
| Missing manual returned-page controls                                 | `2026-11-04T11-44-25.222Z`          | Genuine red                              |
| Returned paging/dedup/anchor and known complete count                 | `2026-11-04T11-46-08.166Z`          | 3 pass                                   |
| Local target reread and unsupported genuine empty state               | `2026-11-04T11-47-05.495Z`          | 2 genuine reds, 4 refusal passes         |
| Local targets, genuine empty, native identity/refusal cases           | `2026-11-04T11-47-49.896Z`          | 9 pass                                   |
| Network retry, account change, delayed prior peer                     | `2026-11-04T11-48-28.201Z`          | 3 pass                                   |
| Lost peer-list offset and missing exact-target disclosure             | `2026-11-04T11-49-18.812Z`          | 2 genuine reds                           |
| Public/private/peer return and target disclosure                      | `2026-11-04T11-50-19.506Z`          | 14 pass                                  |
| Late image/quote/code and three interface languages                   | `2026-11-04T11-51-13.248Z`          | 2 pass                                   |
| Duplicate empty-reader placeholder during board browsing              | `2026-11-04T11-51-46.948Z`          | Genuine red                              |
| Complete initial private-reading set                                  | `2026-11-04T11-52-38.511Z`          | 17 pass                                  |
| Existing affected peer/public-history/writing/recovery                | `2026-11-04T11-53-13.809Z`          | 66 pass, 2 native-link selector failures |
| Clean packed 0.18.0 consumer                                          | `consumer-2026-11-04T11-53-20.860Z` | Pass                                     |
| Explicit native-link selectors and private set                        | `2026-11-04T11-54-36.044Z`          | 36 pass                                  |
| Redirect URL contradicts native current-page marker                   | `2026-11-04T12-02-24.373Z`          | Genuine red                              |
| Refuse contradictory actual private page identity                     | `2026-11-04T12-03-09.528Z`          | Pass                                     |
| Local private target overwrote browsed board destination              | `2026-11-04T12-04-05.877Z`          | Genuine red                              |
| Retained private target preserves board destination and return        | `2026-11-04T12-04-32.764Z`          | 2 pass                                   |
| Complete affected Messages/private set after identity/context repairs | `2026-11-04T12-05-16.072Z`          | 38 pass; pending writing guard excluded  |
| Private transition missing retained-writing decision                  | `2026-11-04T11-57-26.099Z`          | Genuine red; #66 integration pending     |

The old #75 tests assumed one link per peer. The integrated read action adds a
second link; the assertions now identify native continuation by its accessible
name while checking its exact URL. The first guard runs (`11-55-42.312Z`,
`11-56-18.205Z`, `11-56-41.447Z`) failed the test's form/locator setup before a
writing context existed. They are harness failures, not guard evidence. The first redirect attempts
(`12-01-08.068Z`, `12-01-31.132Z`) met the routed suite's intentional offline
boundary and are network-fixture failures. The correction was reverted before
using the existing local HTTPS/proxy fixture to reproduce the actual identity
failure. The board-context case first met an ambiguous board-link selector
(`12-03-35.710Z`), corrected before its genuine red.

Every run retains its report, receipt, source/build identity, manifest and authored
screenshots/request ledgers. Node 24.22.0/npm 11.21.1 and Edge are used. Replay
with `npm run build` followed by `npm run test:e2e -- tests/e2e/private-history.spec.ts`.
Typecheck, lint and formatting passed on the initial slice; the subsequent
integration and corrected qualification are recorded below.

After integrating accepted #66, private peer changes and direct private loading
use the same retained-writing decision as public thread changes. The original
writing identity, source, action and destination remain unchanged; cancellation
restores editing without a private GET. Local exact targets within the same peer
remain local. The existing drawer closes only when public/private reading actually
changes; reopening the peer list retains its selection and nonzero offset. The
public writing guard's extra decision cost is the existing #66 trade-off, reused
here rather than introducing a second guard owner.

The accepted-shell guard still failed at `12-21-51.196Z`, then passed at
`12-22-46.550Z`. Narrow private selection failed to dismiss the drawer at
`12-22-56.058Z`, then passed at `12-23-39.818Z`. Its initial run `12-22-08.686Z`
failed because the test had not closed the initial results drawer. Expanded guard
runs `12-24-15.543Z` and `12-25-10.076Z` tried the reader Reply action through an
unnecessary modal; these are fixture-control errors. The corrected narrow guard
passed at `12-25-55.852Z`; desktop and narrow guards plus passive reload/cancel
both passed at `12-26-28.316Z`.

The integrated affected run `12-27-24.892Z` retained 51 passes and two failures:
an ENOSPC screenshot mkdir in an existing Messages case, and a test observation
that sampled the list offset after its drawer had already hidden. The latter
now samples the visible offset before selection and compares it after reopening;
after disk recovery, `12-28-59.654Z` passed the two affected cases plus both desktop
and narrow retained-writing/reload journeys (4/4). Static checks and build passed
for this accepted-#66 integration. That preliminary candidate was followed by
accepted #72/#69 reconciliation and final qualification below.

## Initial integrated candidate (superseded by focus repair)

Accepted #72 (`406608dfb55f2d55b10ba4cf69a138f465489386`) is merged. Private
reading and passive arrival live inside the same conversation region as retained
public writing. The immutable confirmed-publication context callback remains
unchanged. No additional writer, sender or private persistence was introduced.

- Userscript SHA-256: `af62a4afbe6c74c13de5285b11532249f656d0011cfc7eca263ab9c0487cb586`.
- Userscript bytes: 1,874,735.
- Messages/private application set: **41/41**, `2026-11-04T12-48-57.251Z`.
- Focused shared public history, drawers, writing/IME and saved-draft review:
  **46/46**, `2026-11-04T12-49-43.586Z`.
- Clean external 0.18.0 consumer: `consumer-2026-11-04T12-49-58.907Z`, pass.
- Typecheck, lint, formatting, application/library build and whitespace pass.

Root's controlled installed checks on this candidate observed complete three-message
history, unchanged retained source, drawer behavior, passive reload and direct
arrival; the sealed bundle is `76-installed-2026-11-04`. These observations do not
qualify the corrected candidate below. Final BDFL review found the delayed-focus
failure, so this candidate was not accepted.

## Final review correction

The advisor's P2 delayed-focus finding was independently validated through the
built app and browser. After a guarded private read starts, the member can return
to writing before its response arrives. The common view adapter then focused the
returned exact message, stealing focus from that resumed writing. The named
plain-source and actual CDP browser-composition cases both failed on `af62a4af`
at `2026-11-04T12-58-37.263Z`; ordinary explicit private selection focus passed.

The repair suppresses only target/selection focus while writing is visible or
composing. Target markers, returned history and scroll/anchor restoration remain.
No old focus intent is queued for composition end. The corrected seven affected
cases passed at `2026-11-04T12-59-34.639Z`, including unchanged ordinary target
focus, source usability, and committing the composed Chinese text after response
arrival. CDP browser composition is not an OS input-method qualification. The
corrected candidate's final integration, installed and advisor acceptance are
recorded below.

## Corrected integrated candidate

Accepted automatic public history #69 (`4c45df7c8545f9cbacabb9c93af4f4e63e1a72cb`)
is integrated. Its scroll listener remains attached only to public history; the
private boundary-scroll journey verifies deliberate manual loading.

- Userscript SHA-256: `c926aefc7a26eef99181893e6ee9b7052396d24b4227e5065968828932e0f763`.
- Userscript bytes: 1,876,457.
- Corrected complete private/Messages plus affected automatic history,
  drawers, source/visual writing and browser composition: **85/85**, run
  `2026-11-04T13-05-56.317Z`.
- Typecheck, lint, formatting, application/library build and whitespace pass.
- All seven portable artifacts and every consumer input hash are unchanged
  from the passing `consumer-2026-11-04T12-49-58.907Z`; that evidence is reused.
- Corrected installed Edge and final BDFL validation passed at this slice's scope.
  The exact executable remains unchanged for the ticket commit.

## Corrected installed qualification and final validation

The sealed `76-installed-corrected-2026-11-04` bundle contains eight files plus
its manifest. Full Tampermonkey manager source matches the corrected hash, and
the installed script was reloaded. Controlled private history returned the same
three native messages with complete known contents and the named peer. Passive
reload retained the original public writing and required a deliberate private
load through the existing keep-writing decision. Returning to writing preserved
its original action, thread, account, exact text and source focus.

The live response finished before the resumed-source sample. This verifies
real-data/focus continuity, not a timed live reproduction of the delayed race.
The named application cases and independent advisor browser reproduction provide
the controlled delay: the same textarea stays focused, source remains exact,
and trusted active composition has no end/blur at response completion. Those
separate authored runs recorded four GETs and no POST. They qualify browser-engine
composition rather than an operating-system candidate window. The installed
extension-host run has no tab-CDP request-count ledger; it does not borrow the
authored count. One controlled peer/page was observed; installed multipage remains
unobserved. No live send or publication was performed.

Final BDFL review accepted exact `c926aefc` with no remaining material findings.
It independently verified the corrected focus behavior, all 250 final-run
manifest entries and executable inputs, the eight installed files, and all seven
portable artifacts against the passing 0.18 consumer. The original `af62a4af`
installed bundle, genuine failing cases and corrected evidence remain distinct.
Chrome and final OS CJK qualification remain assigned to #79 under the approved
cadence; no broader release qualification is claimed.

## Actual trade-offs

1. Interpret qualified native HTML/page-JSON history through strict recipient,
   account and structural checks. This preserves returned content/targets and
   existing client authority at the cost of markup coupling and bounded native
   capability evidence; installed multipage is explicitly unobserved.
2. Keep full private ranges and positions in document memory, omitting them from
   page-session snapshots. This preserves local navigation and account privacy,
   at the cost of memory for visited ranges and a deliberate reload afterward.
3. Use a distinct private range owner and model while sharing client authority,
   content sanitization and view anchors. This avoids applying public thread
   identity/actions to private messages, at the cost of another small range
   state machine and a coordinated portable contract version.
4. Discard the superseded reading focus intent while the member has resumed
   writing, rather than replaying it after composition. This preserves active
   input at the cost of not automatically moving focus to the earlier requested
   message; its target marker and reading position remain available.

## Acceptance status

- [x] Qualify current private routes, peer/message identities, chronological
      content, returned targets and native read effects before adapter code;
      refuse public-thread responses as private history.
- [x] Deliver named private reading, complete supported content, returned manual
      earlier/later pages, exact targets, truthful states and native continuation.
- [x] Retain peer selection/nonzero list offset and use the sole shared writing
      guard for public/private transitions without transferring source or targets.
- [x] Preserve anchors through manual paging, rich media and pane changes;
      scope ranges and in-flight results to account/recipient with truthful local markers.
- [x] Verify public/private/peer return, passive direct arrival, paging/failure
      and changed-account journeys through the app; expose no send control.
- [x] Preserve the pinned design, ADRs, Text size/Compact, source-first sole
      writing context, immutable review and existing operation/account/financial guarantees.
- [x] Record failure inventories and failure-first complete-app expectations;
      preserve replayable reports, receipts, identities, manifests and distinct failures.
- [x] Pass static/build, 85 final affected Edge E2Es, scoped corrected installed
      Edge, unchanged-byte 0.18 consumer and final BDFL; report all four trade-offs
      and retain explicit installed multipage, Chrome and OS CJK evidence limits.

Chrome is deferred to final integrated acceptance per the owner's November 4
instruction; stable/BETA Tampermonkey are equivalent for this task. No sending,
release, full Messages or parent-spec completion is claimed.
