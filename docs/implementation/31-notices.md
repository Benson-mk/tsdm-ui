# Deliberate complete standard notices — #31

The confirmed application E2E boundary is the real layout → workspace → forum
client → browser host, replacing only the external network. The clean external
Node consumer is the additional public-library boundary. Live and installed
observations remain separate acceptance gates.

## Failure inventory before feature code

- Entering Notices, restoring history, reload or remount silently fetches an
  effectful notice route; polling, fallback or retry repeats the effect.
- A recent API slice, missing list, unrecognized rows, missing body/time, duplicate
  notice identity or unsupported pager is reported as a complete or empty inbox.
- Category/pager controls are invented, truncated, taken from the global header,
  cross account/category boundaries or lose their returned destination.
- Body markup executes, native actions activate while parsing, text/targets are
  lost, exact-post links open a guessed page or the target is absent.
- Read indicators conflate an absent badge, unrecognized state, observed zero and
  stale returned observations with authoritative current unread state. Failed
  loading is reported as having no server effect.
- A changed, conflicting, unknown or guest identity exposes a prior member's
  notices; delayed results replace a newer destination or revive an old session.
- A notice list loses category, page, selected notice, position or full bodies on
  exact-target navigation, Back/Forward/reload/remount. Missing snapshots trigger
  a hidden reload; direct native arrival hides possible pre-startup effects.
- Recovery retains a formhash, active forum controls or unvalidated content;
  refused/incompatible storage falsely promises recovery.
- Deferred PM/broadcast/activity destinations appear implemented, standard social
  notices are deferred, or a native action runs through an application link.
- Narrow navigation hides the list/reader return route; translated controls,
  keyboard focus or rich full bodies become inaccessible. Returned categories
  fail to occupy the desktop secondary pane or its medium-width picker, leaving
  destination navigation inaccessible while a reader is open.
- A direct-arrival/failure warning occupies an auto-placed navigation grid
  column or a second clipped grid row; its presence in accessibility text
  conceals unreadable width or a required read-effects paragraph outside the
  viewport. Shared error presentation needs a usable full-width region at
  desktop, medium and narrow sizes, including short desktop windows.
- Repeated returned category URLs overwrite their active state; a social row's
  native DOM identity replaces its actual notice identity; a legal definition
  list inside the rich body is interpreted as another notice row.
- The clean external consumer cannot import notice declarations without DOM
  types, serialize full notice bodies, preserve returned category/page targets,
  bind results to fresh account generations or reject unoffered targets without
  network effects. A failed transport might retry the read or use the passive
  `readPage` entry to make an effectful notice request.

## Planned vertical E2E slices

1. `J10.notices-deliberate-complete`: no overview/preload/polling; one deliberate
   load; full inert bodies/time and every returned standard category/page.
2. `J10.notices-effects-*`: independent request/effect ledger; returned
   unknown/absent/zero/read indicators; one-attempt failures and fresh identities.
3. `J10.notices-return-*`: exact targets and passive local list restoration,
   safe history, missing recovery, direct arrival and full-document remount.
4. `J10.notices-session-*`: changed/unknown identity, late results, recovery
   validation, deliberate native continuations and narrow/localized journeys.

Each slice's named expectation is written and observed red before its feature
code. Each run retains the existing receipt, report, scenario source and authored
screenshots/effect readbacks under `evidence/runs/`. Synthetic results cannot
qualify populated current categories, current effects or installed browser
continuity.

## Evidence and acceptance

The current reader-correction candidate is version **0.3.0**, **844870 bytes**,
SHA-256 `edb8bc8f1f2f7dabb73f4aafcfd16a2e396d59f0a14477840bcce6fb2d573d64`.
It retains the pagination correction and adds bounded late-image target
restoration described [below](#late-image-target-failure-and-correction).
Exact-source affected installed observations and the independent installed
acceptance audit are complete. All five development criteria are verified, as
recorded in the current acceptance audit below. Earlier installed observations
belong to their original candidates.

The earlier corrected candidate is version **0.3.0**, **842336 bytes**, SHA-256
`fdcdb05289d30032cae26aad01bd67b37be7af6d6e66edaba845792fc4bc3e81`.
The ticket branch includes integration tip `76d6ca9`. On 2026-10-21
(Asia/Hong_Kong), the human explicitly approved a single local #31 commit with
AC2, AC3 and AC4 unchecked for the evidence gaps then present. The later
populated-mention continuation below verified AC4; actual returned pagination
still left AC2 and AC3 unchecked at that checkpoint. This is a development
candidate; the approval does not accept the whole ticket or authorize issue
closure, push or publication.

### Delivered behavior

`forum-client/notices.ts` decodes one returned HTML/page-JSON response, resolves
the current member from independent header/envelope identity, and projects full
notice bodies and returned timestamps into serializable inert content. It
recognizes the actual `notice` identity separately from the native row ID,
including social friend-request rows. It takes standard category and pager
links only from returned controls outside notice bodies. Duplicate category
URLs preserve any returned active state. It neither fabricates a pager nor
uses the recent-notify/seen APIs as a complete inbox.

`readNotices` makes one fresh JSON-preferring request and consumes useful
returned HTML directly. There is no representation retry, fallback or polling.
Given a prior list, only its current URL and offered category/page destinations
are eligible. A changed/unknown account or malformed/incomplete response does
not expose a successful partial inbox. Failure text preserves possible server
read effects. `readPage` refuses notice routes so passive general reads cannot
load them accidentally.

The workspace owns deliberate loads and account-bound local return snapshots.
The layout uses desktop secondary category navigation, a medium picker and
narrow inline navigation. Full bodies remain available beside a reader at
supported desktop widths; narrow Back returns to the local list. The existing
exact-post/manual-redirect/document-remount path preserves the notice origin,
category/page, selected notice focus and useful scroll position. Passive
restoration makes no notice request and identifies stale content. Missing
snapshots require explicit loading; direct native notice arrivals disclose
possible pre-startup effects without repeating their request.

Native PM/broadcast/activity destinations have explicit continuation links.
Formhash-bearing body links/images become inert unsupported-content messages
with their useful text preserved. The serializable core remains independent
of browser/native-navigation presentation. Existing recovery validation checks
the notice variant and its full content tree before restoration.

### Repeatable synthetic evidence

Use the pinned Node 24.22.0 / npm 11.21.1 pair:

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e
npm run test:consumer
npm run evidence:verify -- evidence/runs/<run>
git diff --check
```

The ticket worktree reused the integration's identical locked dependencies
through a local `node_modules` symlink. That symlink is environment setup and
must not be staged. The public consumer installs a freshly packed library in
an independent temporary directory and compiles its declarations with no DOM
types or browser globals.

- Initial deliberate-load red: `2026-10-20T15-41-06.788Z`; first green:
  `2026-10-20T15-44-26.038Z`.
- Read-state/completeness/session reds: `2026-10-20T15-45-57.524Z`; all first
  nineteen cases green: `2026-10-20T15-49-48.938Z`.
- Exact-target/remount/native-arrival reds: `2026-10-20T15-51-14.745Z`;
  focused green: `2026-10-20T15-52-19.732Z`.
- Native targets/body-navigation/localized errors red:
  `2026-10-20T15-54-44.807Z` and `2026-10-20T15-55-23.877Z`.
- Duplicate-category active-state red: `2026-10-20T16-00-16.568Z`;
  green: `2026-10-20T16-00-47.211Z`.
- Definition-list full-body red: `2026-10-20T16-01-09.882Z`; all thirty notice
  cases then green: `2026-10-20T16-01-36.024Z`.
- Responsive secondary-navigation red: `2026-10-20T16-04-10.359Z`;
  focused green: `2026-10-20T16-04-39.668Z`.
- Clean external notices consumer: `consumer-2026-10-20T16-02-41.434Z`.
  It checks exported models/declarations, serialization, full body/time/target,
  returned category/page URLs, fresh account generations, rejected unoffered
  destinations, passive `readPage` refusal and one-attempt failure effects.
- Initial candidate complete application regression: **289/289 passed**, including all
  **31 notice cases**, at `2026-10-20T16-05-27.610Z`.
- Final frozen-library consumer: **passed** at
  `consumer-2026-10-20T16-07-19.866Z`.

Each named run is under `evidence/runs/` with receipt, human-readable report,
scenario-source snapshot, authored screenshots/effect ledgers and manifest.
The exact-post case uses a real local HTTPS 302 and document remount; browser
history, storage and app collaborators remain real. Only the external network
is substituted. Static checking, lint, formatting, both builds and whitespace
checking pass. Final application/consumer manifests verify exact coverage,
safe paths, byte sizes and SHA-256 for **306** and **3** package files.
Initial desktop and narrow localized notice screenshots were inspected.
Completed-work Standards/Spec/BDFL reviews found no code defects and retained
the two live/installed evidence gates for the initial frozen candidate. The
later installed visual defect below supersedes that candidate. The corrected
candidate subsequently passed completed-work Standards/Spec/BDFL reviews with
no code defects; its completed installed audit is recorded below.

### Installed visual failure and shared-layout correction

Root's installed Edge checks of the initial **842342-byte** candidate
`c0fef35a5c31ce6826d17a3ddf64e727b0244f922f679fe84e90dd6f04ceb6fc`
found a visually failed direct native notice arrival. The common error section
was an unplaced child of the content grid. Alongside the Notices overview it
landed in the 128px navigation column and a second clipped row; required
pre-startup read-effect text was outside the short-window viewport. Earlier
text-presence assertions did not establish readable presentation.

Four new full-application expectations at widths **1280, 1265, 1000 and 390**,
all **540px high**, failed against those exact c0 bytes at
`2026-10-20T16-57-53.214Z`. They independently record panel/paragraph bounds,
horizontal overflow and the external request ledger before asserting readable
width and the full warning's viewport visibility. Desktop/medium panels were
128px; the narrow warning ended at 587.61px, beyond the 540px viewport.

The existing generic board/search/notices error section now lives in the
existing full-width workspace-status region, outside the content grid, without
its independent pane class. This fixes the shared placement cause without
changing client, session, navigation or request behavior. All four cases pass
at `2026-10-20T16-58-48.583Z`, including reload with **zero notice fetches**.
At 1265px the warning now ends at 262.49px; at 390px it ends at 390.18px. Final
authored desktop/medium and narrow screenshots were inspected.

The shared-layout change justifies one complete regression: **293/293 passed**,
including all **35 notice cases**, at `2026-10-20T16-59-22.032Z`. Its **314**
package files verify exact coverage, safe paths, byte sizes and SHA-256. The
four-case red and focused-green packages each verify **18** files. Typecheck,
lint, formatting, both builds and whitespace checks pass.
The rebuilt public library packs to SHA-256
`32e6e8da5fda46838fc7d8afd3f474bac2bf1c5bf5ec2e019381e607a74d492d`,
byte-identical to the already-passing final external consumer's package, so no
consumer contract code changed and that consumer evidence remains applicable.

Initial c0 Edge observations independently matched current native full
body/time/ordered targets for populated reply/rating/system/friend categories,
and verified an actual exact-post remount plus local Back/Forward/reload with
zero notice fetches. Its early truncated target ledgers remain inconclusive;
the later complete scoped observations are distinct. **These observations are
historical c0 evidence, not passes for the corrected candidate.** c0 direct
arrival is explicitly a visual failure. Corrected-candidate observations are
recorded separately below; no historical c0 result is promoted to new bytes.

### Earlier corrected installed development evidence

This section retains the first corrected-candidate audit and its disposition
before the human switched to the account with a populated mention. The later
[populated-mention continuation](#populated-mention-continuation) supplies the
current additional evidence. The original `31-installed/` package remains
unchanged; its earlier gaps are historical rather than the current acceptance
disposition.

The parent installed and observed the exact corrected **842336-byte** candidate
in **Edge then Chrome on macOS 15.6**, using the approved **BETA development
manager**. Official stored-source readbacks and one matching executing script
per browser establish the same frozen SHA-256. Unchanged manager timestamps
were not treated as freshness evidence. The completed installed BDFL audit
independently checked the raw comparisons, scoped ledgers, focus/scroll readback
and readable warning images. It verifies **AC1 and AC5** for this development
scope and leaves **AC2, AC3 and AC4 partial**.

The authored [installed report](31-installed/report.md),
[receipt](31-installed/receipt.json) and
[current comparison](31-installed/current-native-comparison.json) retain the
exact candidate and evidence modes. The repository package is a documentation
derivative of the reviewed root package: its report/receipt now incorporate
the completed acceptance judgment, and its comparison remains byte-identical.
Original reviewed input identities are recorded separately from this
derivative's [manifest](31-installed/manifest.json). New derivative hashes must
not be described as the advisor's original reviewed hashes. Verify its exact
coverage, safe paths, sizes and SHA-256 with:

```sh
npm run evidence:verify -- docs/implementation/31-installed
```

Chrome's overview made zero notice requests. Edge restored its existing
direct-arrival snapshot without another effectful native arrival; its overview
and warning reload made zero notice requests. Both installed warnings are
readable: Edge's paragraph ends at **273px within 540px**, and Chrome's at
**260.59px within 621px**. Chrome's authorized direct arrival made exactly one
Document notice request with zero repeated notice fetches. Each deliberate
load/category/refresh scope made one notice request without a representation
retry. Idle scopes of **82.97s** and **85.068s** contained no notice request.

Independent native-versus-installed comparisons match every identity, returned
time, complete body text and ordered target in all five populated category
views in each browser: all **14**, replies **4**, rating **1**, system **8** and
friend **1**. Mentions and default social were explicitly empty. The plain
unread label remains **unknown**, with no inferred numeric zero. Both actual
returned reply targets followed real **301** redirects and a document remount
to the intended focused post. Complete Back/Forward/second-Back/list-reload
scopes contain zero notice requests, retain all fourteen equal row records,
restore selected-notice focus and keep useful list positions of **870px** and
**1206.5px**. Snapshots remain visibly stale until a deliberate recheck. Native
PM/broadcast/friend-action continuations are explicit; those actions were not
executed. Captured notice DOM had zero scripts, inline handlers or formhash
links. No pager URL was invented.

The initial truncated identification ledger remains inconclusive; later
complete scopes are separate. Earlier wrong-element waits and startup-timed
readbacks did not trigger another target click or notice read. Representative
corrected Edge warning/target/restored-list and Chrome warning/target images
were actually inspected; screenshots and raw authenticated captures remain
private and are excluded from the repository package.

At that audit, populated mentions and their exact target, an actual returned
pager and a current unread-to-read transition remained unavailable. The human supplied
the exact tool versions on 2026-10-21 (Asia/Hong_Kong): **Microsoft Edge
155.0.4283.62**, **Google Chrome 155.0.8059.85**, and **Tampermonkey BETA
5.6.6242 in both browsers**. These are human-reported metadata, supplied after
browser policy blocked the internal version page; reduced request headers do
not independently establish the patch versions. This closes the metadata-only
gap without another notice operation. Stable-manager/release and the other-OS
matrix, plus #19 AC4/AC6, remain separate. The human explicitly approved the
single local commit with AC2/AC3/AC4 unchecked; no full #31/#15 or release
qualification, issue closure, push or publication is claimed. This documentation
adds no distinct trade-off.

### Populated-mention continuation

After that earlier audit and the approved local commit, the human switched
both installed browsers to an existing account containing a populated mention.
The parent observed the unchanged corrected candidate in Edge then Chrome;
one executing copy in each matched the exact **842336-byte fdc** source above.
Prior official stored-source readbacks remain their own evidence. The manager
connector was disconnected, so this continuation claims no fresh official
readback or source replacement. Browser/manager versions are the same
human-reported metadata above, on macOS 15.6. No mention was manufactured and
no post, edit, PM, social action, upload or spend was performed.

The authored [continuation report](31-installed-mentions/report.md),
[receipt](31-installed-mentions/receipt.json) and
[comparison](31-installed-mentions/comparison.json) record the completed
observations and independent BDFL judgment. This is a documentation derivative:
the report/receipt incorporate the completed judgment and bounded read-effect
claim; the comparison remains byte-identical. The receipt preserves the
advisor's original reviewed file identities separately from the derivative's
[manifest](31-installed-mentions/manifest.json). Verify exact package coverage,
safe paths, sizes and SHA-256 with:

```sh
npm run evidence:verify -- docs/implementation/31-installed-mentions
```

Four independent nonempty comparisons match all **five All rows** and the
**one mention row** in each browser for identity, returned time, complete
native notice body text and ordered targets. A forum-provided post excerpt
is preserved as the complete returned notice body, without claiming the
complete target post. Each browser made three deliberate actions—All load,
returned personal-post category and returned mention category—with exactly
one notice request each. The personal-post default was explicitly empty.

Across **16 complete qualifying scopes**, both actual mention targets follow
real **301** redirects/document remounts to the intended focused, visible post.
Target/Back/Forward/second-Back/list-reload scopes contain **zero notice
requests**; full mention records remain equal, selected-notice focus returns
and survives reload, and useful scroll remains **369.5px in Edge** and **497px
in Chrome**. Stale-snapshot disclosure remains visible. Each browser's first
target scope was truncated and remains inconclusive; each target was repeated
once solely because traffic coverage was incomplete. Complete replacement
scopes do not relabel those attempts or justify repeating successful cases.

Edge's fresh native-root header before the first deliberate load showed
count **1**. The complete first All response itself contained count **1** and
a bold unread mention. After that single load, a fresh native-root header
showed a plain label, and the later same mention no longer had unread bold
styling. The completed independent audit accepts this current presentation
transition for AC3's read-effect branch, accounting for the deliberate notice
request and ordinary native-root verification read. It does not establish
exclusive endpoint causation or isolation from external account activity.
The complete after-load native-root scope has zero notice requests; initial
Edge/Chrome precheck ledgers were truncated, so their fresh header contents
are observations without complete traffic coverage. Plain remains **unknown**,
never numeric zero. Edge read the shared account before Chrome: Chrome's old
count of 1 was stale, its fresh precheck was plain, and it is not a second
independent unread transition.

The first hidden/native post-locator ambiguity was resolved semantically
without another click. An early response-body read was completed against the
original request without another load. A stale integration f36 build input
initially failed source comparison; the separately frozen ticket fdc bytes
then matched execution. This tooling-input failure remains recorded without
inferring source/runtime replacement. Raw member data, native targets and
screenshots remain private.

The completed BDFL audit verifies **AC1, AC4 and AC5** for the approved BETA
development scope. **AC2 and AC3 remain unchecked solely for actual returned
pagination**: neither the earlier fourteen-notice account nor this five-notice
account returned a pager. The human subsequently reported that notices have
only one page in their experience, consistent with those observations. This
does not establish universal absence or change the accepted pagination
requirement; no further account switch is requested for this continuation.
The earlier commit's approval with AC2/AC3/AC4
unchecked remains historical; the unchanged commit is not whole-ticket
acceptance. No #31/#15 closure, stable/other-OS release qualification or #19
acceptance is claimed. Recording this evidence adds no distinct trade-off.

### Earlier populated-mention acceptance audit

For the earlier **fdc** candidate, the completed populated-mention BDFL audit retains AC1/AC5, verifies AC4 and
leaves AC2/AC3 partial solely on actual returned pagination. Fixtures do not
replace that missing current positive observation.

| #31 criterion                                                     | Verified development evidence                                                                                                                                                                                                   | Remaining evidence                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [x] 1. Deliberate overview/load/refresh/category/page; no polling | Installed Edge/Chrome overview, single-request load/category/refresh and idle observations; deterministic returned-page/failure cases preserve disclosure and deliberate actions.                                               | Live pager absence remains AC2/AC3's named gap.                                                                    |
| [ ] 2. Complete standard bodies/time/target/pagination            | Full populated all/reply/rating/system/friend and now mention comparisons match both installed browsers; deterministic pager variants and refusal of partial content pass.                                                      | Actual returned pagination only.                                                                                   |
| [ ] 3. Current read behavior and truthful unread state            | Current populated mention and bounded Edge unread-to-read presentation transition are verified; plain remains unknown; synthetic absent/unknown/observed-zero/stale/failure cases remain distinct.                              | Actual returned pagination only; no numeric zero is claimed or required from a plain label.                        |
| [x] 4. Exact target and passive return/recovery                   | Both installed reply and mention targets follow real redirects/remounts; complete passive scopes retain full records/focus/scroll with zero notice reads; corrected warnings and deterministic safe/missing-history cases pass. | None for this approved development scope.                                                                          |
| [x] 5. Explicit native deferred destinations and honest gaps      | Installed PM/broadcast/friend-action links explicitly continue natively; standard social bodies remain in the list; unavailable cases stay named.                                                                               | AC2's independent completeness gate remains; no deferred action was executed or needed to verify an explicit link. |

The parent obtained current native Edge then Chrome category shapes with the
human's explicit authorization, acknowledging that the checks themselves can
mark notices read even when tooling fails. Populated all/reply/rating/friend/
system and explicit-empty returned categories were observed. These native
shape-only observations informed compatibility; they alone are **not installed
#31 evidence**. The separately audited corrected-candidate installed package
above and the later populated-mention package support their own stated
observations. The current acceptance disposition combines the two completed
audits without promoting historical failed or truncated observations.
No private account content, raw captures or tokens are copied into fixtures or
this public document. No live reads, writes, installation or publication were
performed by this implementer.

### Returned-pagination failure and correction

The human subsequently supplied an existing account with an actual returned
two-page list. In a dedicated Edge tab, the parent verified the exact earlier
**842336-byte fdc** runtime and one matching copy. Entering the overview made
zero notice requests. One deliberate Load returned a successful **200
page-JSON** response, but the application refused it with: “The returned notice
pagination could not be preserved completely. Continue in the native forum;
this request may still have marked notices read.” The complete scoped ledger
records one request with no retry. This is a demonstrated implementation
failure for fdc, superseding the earlier claim that actual pagination was only
unavailable. Raw response, traffic and failure screenshot remain private and
failed; no second live page was read by this implementer.

The active native All control has no explicit `view`, `type` or `isread`.
Its returned pager supplies `view=all&type=&isread=1&page=2`, with numeric and
Next anchors for the same destination and an entity-encoded page separator.
An authored full-application reproduction fails with the same error against
fdc at `2026-10-21T04-53-54.717Z`. Reducing unrelated body/actions/categories
to one valid row and its owning All control remains red at
`2026-10-21T04-55-05.467Z`. Removing the custom-page input and then duplicate
Next separately keeps the exact failure at `2026-10-21T04-55-34.946Z` and
`2026-10-21T04-55-41.163Z`.

Five falsifiable hypotheses preceded the query experiments: default view,
empty type, read-filter handling, their interaction and entity decoding.
The normalized control passes at `2026-10-21T04-58-09.798Z`; adding only
`view=all`, only `type=` or only `isread=1` independently reproduces the same
error at `2026-10-21T04-58-11.055Z`, `2026-10-21T04-58-17.140Z` and
`2026-10-21T04-58-23.202Z`. Removing only one field from the original query
or changing only entity encoding leaves the failure. The cause is three
interacting checks: notice routing rejects empty `type` and any `isread`,
then pager comparison treats omitted `view` and explicit `all` as different
categories. Duplicate anchors and entity decoding are not the cause.

The minimal correction changes only notice routing and response interpretation.
It accepts empty native `type` and explicit `isread=0`/`1`, while retaining
the exact returned destination. Category comparison recognizes omitted
`view`/`all` and omitted/empty `type` aliases. Explicit requested and returned
read filters must agree. When the source has no explicit filter, all pager
links must agree on the returned filter; the source URL is not rewritten to
invent one. Actual category/type changes, changed or missing explicit filters,
unknown filters and conflicting returned filters fail closed. Origin, actor,
offered-destination, completeness and one-request/no-fallback guards remain.
That parser correction does not change the browser host, workspace or UI.

The complete page/history expectation was written and observed red before
the correction at `2026-10-21T05-00-12.101Z`; the clean public consumer also
failed before source changes because the returned native pager produced an
invalid list. The focused **13-case** application run passes at
`2026-10-21T05-01-52.085Z`. It verifies complete bodies, times, exact target
links, preserved page URLs, exactly one notice request for each deliberate
page action, and equal local rows/pages/useful scroll through Back, Forward
and reload with zero additional notice requests. Six new negative contexts
exercise the retained category/type/filter guards. Restored content remains
explicitly stale. No after-code unit tests were added.

The first focused post-correction run at `2026-10-21T05-01-19.814Z` loaded
both pages correctly but failed a new test's scroll expectation: Playwright
had scrolled the offscreen Next link into view after the test recorded an
earlier position. The test now records the actual departure position after
bringing Next into view, before clicking. No production change followed that
observation correction, and the first run remains failed.

The final freshly packed clean consumer passes at
`consumer-2026-10-21T05-02-35.088Z`, preserving the exact native pager target,
single fresh request per action, unoffered-filter refusal, account changes and
failed-load effects without browser globals. The changed library therefore
has its own consumer evidence. The final complete application regression
passes **300/300**, including all **42 notice cases**, at
`2026-10-21T05-02-34.089Z`. Its **330** package files verify exact coverage,
safe paths, byte sizes and SHA-256; the final consumer verifies **3** files,
the full-page red package **12**, and the focused green package **38**.
Typecheck, lint, formatting, both builds and whitespace checks pass. The final
restored-page screenshot was inspected; complete row readbacks establish the
whole body even where scroll places content outside the screenshot. Successful
older baseline counts are not promoted to these changed bytes.

### Late-image target failure and correction

The parent officially backed up, installed and read back the **842870-byte
c519** pagination candidate in Edge then Chrome, observing one exact matching
runtime in each. Both native pages, **30 notices then six**, independently
match the installed identities, timestamps, complete bodies, ordered targets
and returned pager destinations. Qualified deliberate actions have one
completed notice request each. Complete passive scopes restore the full page2
list, selected-notice focus and useful scroll with zero notice requests.
Earlier empty/truncated scopes remain inconclusive rather than request-count
evidence. No unread transition was manufactured.

Chrome then exposed a required outcome failure: the correct exact article is
focused but lies outside its own reading pane on original navigation and
passive Forward. The parent inspected the screenshot and repeated the
pane/target geometry assertion. Edge's target was visible; the Chrome failure
blocks acceptance of c519 despite its successful pagination comparisons.
Authenticated content, targets and screenshots remain private.

An authored whole-application reproduction at the existing external HTTP
boundary focuses post202, then releases one ordinary raster image in an
earlier post. It fails with viewport intersection zero at
`2026-10-21T06-15-05.671Z` and `2026-10-21T06-16-49.336Z`. Removing only
page2 navigation (`06-18-27.682Z`), then the real 302/remount
(`06-18-52.943Z`), then notice navigation entirely (`06-19-17.047Z`) retains
the exact symptom. Removing the preceding image passes (`06-19-41.190Z`).
Early SVG fixture and missing-fixture-constant probes did not reach this
symptom; they remain separate harness failures.

Four ranked hypotheses preceded causal probes: late intrinsic image growth,
a queued restoration override, browser scroll anchoring, and wrong target or
scroll-container identity. Four settled frames before and after image release
at `06-21-48.792Z` show target top **597.77 → 3597.77px**, image height
**0 → 3000px**, and unchanged reader scroll **77px**. Direct post-load
alignment immediately reveals the unique correct article inside the reader.
Enabling native scroll anchoring alone still fails at `06-22-38.557Z`.
The cause is one-time layout restoration before intrinsic image dimensions
arrive; neither notice parsing nor target identity causes this displacement.

The correction stays in `WorkspaceLayout.vue`. During exact-target view
restoration it tracks only currently incomplete images preceding that
article. Their load/error events reapply the new target intent or the saved
reader position. Tracking ends after those images settle, on new reader
input or different scrolling, navigation/view change, writing view or unmount.
No fixed delay, permanent observer, hidden image, request, portable content
change or recovery-schema change is added.

Both positive and deliberate-reader-scroll expectations were written and
observed red before source changes at `06-25-21.771Z`. A first implementation
still failed (`06-26-33.670Z`): tagged lifecycle probes (`06-27-42.937Z`)
showed its cancellation watcher reacting to unrelated workspace ref updates.
Independent watch sources now compare the actual navigation/result/writing
values; temporary instrumentation and diagnostic specs were removed.
The first corrected run passes at `06-28-37.540Z`. Inspection then found that
two inline images in the negative fixture shared one line, so it was
strengthened with separate block images and an independent **3000px** second
reflow assertion (`06-29-47.914Z`), without another production change.

The final focused pair passes at `2026-10-21T06-32-15.259Z`. The original
returned-page2 path uses a real local 302/document remount, gates the image
until after focus, and gates its reconstructed image again on passive
Forward. Exact target bounds remain inside the reader; Back/reload preserves
the full page2 row, selected notice and departure scroll **814px**, with only
the two deliberate notice reads. The negative case deliberately wheels away,
then uses same-document Back/Forward to restore that chosen reader position.
A second earlier block image adds another 3000px to target placement while
reader scroll remains fixed and the original target stays offscreen. It
therefore verifies both cancellation and saved-position intent. A prior
strengthening run (`06-30-54.889Z`) incorrectly compared absolute scroll across
a remount with different stale-banner geometry; it remains failed. The final
assertions measure target containment and the actual saved-position path.

The rebuilt portable library packs to SHA-256
`83d4e4697b45c89c6cbcec54b40f7056a0e052d98b3e28fac2d8e0bd2421d78f`,
byte-identical to c519's already-passing clean consumer package. No library
contract code changed after c519, so its consumer evidence remains applicable.
The shared reader change justifies one complete application regression:
**302/302 pass**, including all **44 notice cases**, at
`2026-10-21T06-33-48.391Z`. Its **336** package files and the final focused
pair's **16** files verify exact coverage, safe paths, byte sizes and SHA-256.
Valid original reds, minimisation and causal controls also pass manifest
verification with their original candidate identities preserved. The final
positive-target and deliberate-reader-position screenshots were inspected.
Static checking, lint, formatting, both builds and whitespace checks pass.

### Exact reader-candidate installed observations

The parent completed the affected installed workflow against exact **edb8**
bytes in **Edge then Chrome**. Official backups and full source readbacks match
the candidate; separate complete runtime inventories observe one matching
executing copy each. Earlier stored-source receipts retain their pre-journey
runtime-pending fields, with later inventories establishing runtime identity.
Human-reported browser, BETA manager and OS versions are recorded in the new
authored [report](31-installed-pagination/report.md),
[receipt](31-installed-pagination/receipt.json) and
[comparison](31-installed-pagination/comparison.json). Its
[manifest](31-installed-pagination/manifest.json) identifies the repository
derivative separately from its original authored package. Verify it with:

```sh
npm run evidence:verify -- docs/implementation/31-installed-pagination
```

Both native first pages contain **30 notices** and actual returned second
pages contain **six**. Four independent full comparisons match record identity,
timestamp, whole notice body, ordered targets, current page and all unique
returned pager destinations. Numeric and Next native anchors share a single
destination. Each deliberate first-page All-category load and returned Next action has exactly one
HTTP 200 notice request with response and completion, adding only the JSON
representation parameter and making no automatic retry.

Page Back/Forward restores complete rows and pagers. Exact-post navigation
follows a real **301/document remount** in both browsers; one exact article is
focused and visible after all four preceding images complete. Edge retains a
raw strict-containment **false** at **−0.1171875px** from the pane top; the
explicit **1px** geometry tolerance passes. Chrome's **+0.234375px** passes
strict containment. Passive Forward also shows the focused target, with
**3/4** earlier images complete in Edge and **2/4** in Chrome. This observation
does not establish universal future layout settlement; the deterministic
delayed-image and deliberate-reader-input cases cover that controlled behavior.

Target return and reload restore all six second-page records, selected-notice
focus and useful list scroll **394.5px in Edge / 318px in Chrome**. These
positions are separate from page-one Back and page-two Forward positions.
Fourteen complete named overview/history/target/return/reload scopes establish
zero notice requests. Initial startup and Chrome's first target/first Back
scopes remain truncated and unqualified; complete replacements supply the
named current comparisons. No pending action was replayed. Current unread
state is **unknown**, with no new transition or numeric zero claimed. Earlier
fdc category, populated-mention, read-presentation, explicit-native and direct
arrival observations retain their original identities and acceptance limits.

The current private run's **106** frozen files independently verify. During
capture, retained helper closures kept an older directory after its session
variable changed. New edb8 Edge payloads overwrote **22** historical c519 Edge
filenames; **two** exact originals were recovered and **20** historical raw
originals remain unavailable. The original pre-overwrite manifest, authored
incomplete c519 report and historical Chrome failure remain retained. The old
c519 raw package cannot now be called intact or fully manifest-verifiable.
Current edb8 evidence is in a distinct verified package; no new bytes are
relabelled as c519, and current qualification does not rely on missing raw
historical files. The new report records this evidence-handling incident.

### Current reader-candidate acceptance audit

The subsequent human-approved #19 development-scope revision moves its unavailable
actual manager-software-update observation to open follow-up #47. #19 is closed;
its original evidence is unchanged, and #47 remains a release gate. This does
not supply a new runtime pass or complete #15.

Completed Standards, Spec and BDFL **code** reviews found no required
correction. Exact edb8 affected installed observations and the
independent installed BDFL acceptance audit are complete. All five development
criteria below are verified, including the expressly assessed applicability of
unchanged historical observations under ADR0002. The c519 failure and earlier fdc audits/approved
commits remain historical. GitHub #31 and parent #15 remain open; release
qualification and #19's actual manager-software-update gap remain separate.

| #31 criterion                                                     | Verified evidence and limits                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x] 1. Deliberate overview/load/refresh/category/page; no polling | Exact edb8 All-category load/returned Next has one completed request per action in both browsers; complete overview/passive scopes have zero. Unchanged disclosure/category/idle and failure paths retain earlier evidence plus current regression.                                              |
| [x] 2. Complete standard bodies/time/target/pagination            | Exact edb8 native pages30+6 fully match identities, times, whole notice bodies, ordered targets and returned pagers in both browsers. Original populated category/mention comparisons remain scoped to unchanged fdc branches.                                                                   |
| [x] 3. Current read behavior and truthful unread state            | Current populated read-filter pagination is verified; unread remains unknown. Historical bounded read-presentation observation and current absent/unknown/zero/stale/failure regression are independently accepted with original scopes retained. No new transition or numeric zero is asserted. |
| [x] 4. Exact target and passive return/recovery                   | Exact edb8 real301/remount target and Forward focus/visibility pass with declared subpixel tolerance; passive complete list/page/focus/scroll/reload has zero notice reads. Delayed-image/reader-intent E2Es and unchanged historical mention/direct-arrival/recovery observations apply.        |
| [x] 5. Explicit native deferred destinations and honest gaps      | Original explicit native PM/broadcast/friend continuation remains scoped to unchanged fdc paths. Current regression retains inert content/refusal disclosures; unknown unread, incomplete image settlement and historical capture loss remain explicit.                                          |

The completed independent installed BDFL audit rechecked exact source identity,
current106-file private and3-file authored/derivative packages, full native
comparisons, complete request scopes and representative screenshots. It found
no required source/documentation correction or additional distinct trade-off.
All five #31 development criteria are verified; no tracker closure or release
qualification is implied. The original authored package retains its pre-audit
pending disposition, separately from this repository derivative.

### Source provenance

This feature is independently authored against the accepted ownership and
existing production navigation/content/recovery modules. Source-only API
research is recorded in [#46 evidence](../research/46-notice-api-evidence.md);
its partial notify/read-acknowledgement findings do not establish a complete
inbox or authorize live operations. Current private shape notes established
control/row structure only. Fixture member IDs, content, dates, categories and
control tokens are authored examples; no private raw capture or copied
experiment implementation is included. Existing sanitizer, account identity,
history and exact-target machinery are reused in place and remain covered by
the full application regression.

## Trade-offs

1. Read complete returned HTML/page-JSON category/pages rather than the recent
   notify slice. This preserves the full inbox contract but retains unavoidable
   native read effects; it cannot provide an independent current unread count.
2. Make a single fresh request with no automatic representation fallback or
   retry. This avoids repeating read effects, while malformed/failed responses
   require the user's next deliberate action.
3. Reject incomplete/ambiguous rows, identity, category or pagination instead of
   displaying a successful partial list. Unknown future native variants need
   explicit native continuation until supported.
4. Preserve returned timestamp wording or absolute title without timezone
   reinterpretation. This retains forum meaning, while arbitrary sorting by a
   normalized instant remains unavailable.
5. Reuse the existing account-bound browser page-session snapshots, safe opaque
   history and exact-post remount machinery. This avoids a second cache owner,
   while passive results are stale and browser storage refusal still prevents
   acknowledged recovery.
6. Clear previous notice snapshots after a fresh unknown, guest or changed
   actor. This protects earlier member content, while transient identity
   ambiguity can require another deliberate load.
7. Present only returned unread response observations, distinguishing absent,
   unknown and explicit zero. This is less convenient than an authoritative
   badge but avoids inventing current state after an effectful request.
8. Reuse inert rich-content projection, replace token-bearing controls with
   useful inert text, and route unsupported same-origin destinations through
   explicit native continuation. Full standard notice bodies remain readable,
   while native social/PM/broadcast actions remain native workflows.
9. Keep native continuation presentation in the UI/host and the notice model in
   the portable client. This preserves independent library consumption at the
   cost of explicit presentation decisions in the maintained layout.
10. Use returned categories in the existing desktop secondary pane, medium
    picker and narrow inline list. This preserves the selected workspace and
    native category wording, while presentation repeats the same returned
    category model across responsive controls.
11. Reuse the integration's identical locked `node_modules` through a local
    symlink. This avoids redundant dependency installation, while the checkout
    depends on that local integration directory until a normal `npm ci`.
12. Put shared failure content in the existing full-width status region so
    warnings remain readable before the content panes. This uses vertical
    viewport space during a failure and can require scrolling the overview to
    reach later actions in a short window.
13. Bind an initially unspecified read filter to the coherent filter actually
    returned by the native pager, preserving every offered URL. This supports
    the forum's selected All context without inventing a fixed default, while
    contradictory pager filters or changes to an explicit filter require
    native continuation.

14. Retain exact-target or saved-position intent only while known preceding
    images settle, cancelling on new reader intent. This avoids waiting for
    network content or changing portable content/recovery contracts, at the
    cost of transient layout event bookkeeping; after deliberate interaction,
    later shifts preserve the chosen scroll instead of forcing the target.

Separate-worktree isolation and filesystem coordination are parent-level
trade-offs, recorded once in its continuation ledger.
