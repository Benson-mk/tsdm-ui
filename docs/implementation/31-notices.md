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

The corrected candidate is version **0.3.0**, **842336 bytes**, SHA-256
`fdcdb05289d30032cae26aad01bd67b37be7af6d6e66edaba845792fc4bc3e81`.
The ticket branch includes integration tip `76d6ca9`. On 2026-10-21
(Asia/Hong_Kong), the human explicitly approved a single local #31 commit with
AC2, AC3 and AC4 unchecked for the evidence gaps below. This is a development
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

### Corrected installed development evidence

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

Current populated mentions and their exact target, an actual returned pager
and a causal unread-to-read transition remain unavailable. The human supplied
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

### Acceptance audit

The completed installed BDFL audit verifies AC1 and AC5 for the approved BETA
development scope. AC2, AC3 and AC4 remain partial/unchecked; fixtures do not
replace their missing current positive observations.

| #31 criterion                                                     | Verified development evidence                                                                                                                                                                               | Remaining evidence                                                                                                        |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [x] 1. Deliberate overview/load/refresh/category/page; no polling | Installed Edge/Chrome overview, single-request load/category/refresh and idle observations; deterministic returned-page/failure cases preserve disclosure and deliberate actions.                           | Live pager absence remains AC2/AC3's named gap.                                                                           |
| [ ] 2. Complete standard bodies/time/target/pagination            | Full populated all/reply/rating/system/friend comparisons match both installed browsers; complete mention/pager variants and refusal of partial content pass synthetically.                                 | Current populated mention and actual returned pagination.                                                                 |
| [ ] 3. Current read behavior and truthful unread state            | Possible effects are disclosed; installed plain indicator stays unknown; synthetic absent/unknown/observed-zero/stale/failure states differ; no invented unread control.                                    | Current positive mention/pager observations and a causal unread-to-read transition; no current numeric zero was observed. |
| [ ] 4. Exact target and passive return/recovery                   | Both installed reply journeys follow real301/remount and retain full rows/focus/scroll with zero passive notice reads; corrected warnings are readable; synthetic safe-history/missing-snapshot cases pass. | Current populated exact mention remains unavailable.                                                                      |
| [x] 5. Explicit native deferred destinations and honest gaps      | Installed PM/broadcast/friend-action links explicitly continue natively; standard social bodies remain in the list; unavailable cases stay named.                                                           | AC2's independent completeness gate remains; no deferred action was executed or needed to verify an explicit link.        |

The parent obtained current native Edge then Chrome category shapes with the
human's explicit authorization, acknowledging that the checks themselves can
mark notices read even when tooling fails. Populated all/reply/rating/friend/
system and explicit-empty returned categories were observed. These native
shape-only observations informed compatibility; they alone are **not installed
#31 evidence**. The separately audited corrected-candidate installed package
above supports only its stated observations and acceptance disposition.
No private account content, raw captures or tokens are copied into fixtures or
this public document. No live reads, writes, installation or publication were
performed by this implementer.

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

Separate-worktree isolation and filesystem coordination are parent-level
trade-offs, recorded once in its continuation ledger.
