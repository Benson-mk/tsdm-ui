# #99 quiet checks — preimplementation inventory

Scope: parent #95 B5. Base e89999c; no public portable contract changes intended.
The approved seam is the built userscript, real workspace/editor/storage/forum
client and external HTTP/browser-host substitution only. Apply tdd vertically;
no unit tests or internal mocks. Installed Edge is parent-owned; Chrome remains
owner-deferred to #112, not passed.

## Failure cases and observable expectations (before feature code)

- Quiet board retains an empty action band or passive help text: no visible
  status block between board heading and filters; no hidden Details reservation.
- Checking/failure/arrival appears or disappears above a mid-scroll row: same
  thread identity and screen offset remain; at top, scroll stays zero and the
  status is visible. External ledger proves one request per deliberate check.
- Success silently prepends: rows remain unchanged until explicit reveal;
  deliberate reveal adds each thread once and returns to quiet.
- Failure hides recovery: failure, Details and disabled cooldown/available Retry
  remain named and reachable; unsupported source stays visibly unavailable.
- Passive reader mode/check time consumes header height: mode/time discoverable
  in Thread options; meaningful checking/failure/arrival remains near header.
- Reader status reflow loses a visible line: preserve the same visible text at
  mid-scroll through delayed checks; top stays at top. Arrival remains deliberate.
- Boundaries claim false certainty or appear detached: true beginning/end sit
  beside their corresponding posts, including newest-first; unknown remains
  unknown at the relevant loaded edge. Loading/retry remains actionable there.
- Keyboard Details/options fail under native forum Escape interception: local
  Escape closes transient controls and returns focus without page scrolling.
- Presentation accidentally changes operation guarantees: retain manual/automatic
  opt-in, active/hidden pause, serial ownership, cooldown, source/account boundaries
  and writing preservation; run existing relevant complete-app regressions.

## Planned verification

First vertical slice: quiet board → delayed checking → arrival → deliberate reveal
→ quiet, recording visible row geometry and external request ledger. Then reader
mode/boundaries and delayed checking/failure/arrival geometry, reversed and unknown
history; narrow/enlarged text and keyboard cases. Existing affected E2Es and strict
checks follow. Reporter receipts retain screenshots, requests, candidate/runtime
identity and hashes; red and failed runs remain separate from green results.

## Delivered presentation and ownership

Quiet board status has no rendered band or hidden Details reservation. Only a
check, failure, unavailable source or staged arrival occupies space. Public reader
mode, baseline and successful-check time live in Thread options. Meaningful reader
status lives at the top of the scrolling reading flow, leaving header geometry
stable. Retry invokes the existing check and respects its existing cooldown.
Details uses native summary activation with local Escape/focus restoration.

Beginning/end and unverified edges sit beside the corresponding loaded posts.
Newest-first places the newest edge after a qualified native pinned opening post,
before the newest reply; the older edge follows the last rendered post. Loading
and retry are local to their edge. The layout component reads existing workspace
state and invokes existing commands; it does not infer a source boundary.

Mid-scroll status updates retain actual visible text/row screen coordinates.
Status restoration yields to workspace navigation/follow revisions and only runs
when geometry moved. Compact-title compensation keeps its cached original newest
distance; a status-only scroll must not change the established 64px follow rule.
Check captures at the true top retain scroll zero so status remains discoverable;
history prepends still retain their post anchor. Off-top checks anchor the post
containing the visible text, rather than a pinned opener's trailing box. A measured
subpixel resize correction prevents integer scroll rounding from clipping the last
fraction of a glyph at a shortened pane's bottom.

No forum-client, workspace operation controller, host, persistence schema or public
portable contract changed. Manual/automatic checking, serialization, pause,
cooldown, account/source boundaries and existing near-latest following remain
owned by the existing workspace. This slice does not change authoring or complete
parent #95. The external consumer check is not required for this layout-only slice.

## Actual trade-offs

- Removing passive board acknowledgements and moving reader provenance into
  options frees persistent space, while requiring opening options to inspect
  reader mode, baseline or last successful time. Board no-change success returns
  quietly to the enabled check control.
- Actionable status belongs to the scrolling flow, so a mid-scroll reader/list
  keeps the current content and scrolls back to the top to inspect the action.
  At the true top, content can move down as real status appears; scroll zero is
  retained deliberately so that status is discoverable.
- Actual and unverified edges remain small labels beside loaded posts instead of
  disappearing entirely. They consume a line at their relevant edge in exchange
  for preserving source uncertainty and making real endpoints discoverable.
  A small layout component shares the two edge presentations without moving
  boundary interpretation out of the workspace/forum client.
- Anchor compensation adds local revision/context and compact-title coordination
  in exchange for removing the old blank reservations. It favors visible text and
  row identity over raw scrollTop; a less-than-one-pixel residual at a clipped
  bottom is rounded upward to keep a complete glyph visible.
- Explicit Retry duplicates the existing check command as a visible recovery
  affordance. Its cooldown and source/account restrictions remain shared, rather
  than creating an independent retry operation. Local Escape handling closes
  native Details despite the observed forum Escape veto; Enter/Space keep native
  behavior.
- Complete-app red/green, exact-byte baseline comparison, full-duration checks and
  retained replay packages cost runtime/storage. One focused appearance case
  substitutes browser time to isolate the actual layout transition; separate
  full-duration cases retain authority over cadence/pause/cooldown. Installed Edge
  is independently checked; the owner's Chrome deferral to #112 remains a
  limitation, not a passing result.

## Failure record and corrections

Pre-feature board red: `2026-11-13T11-05-27.367Z`; reader red after the board
vertical slice passed: `2026-11-13T11-06-39.521Z`. Recovery-control reds:
`2026-11-13T11-08-44.496Z` and `2026-11-13T11-09-32.047Z`.

The first broad run `2026-11-13T11-10-35.379Z` retained 19 failures. The targeted
runs and diagnostics remain separate, including `11-15-44.110Z`,
`11-17-26.399Z`, `11-18-16.181Z`, `11-19-24.091Z`, `11-20-53.204Z`,
`11-22-14.169Z` and the follow-decision probe. Root causes were stale status
restoration overriding authoritative follow, compact-title distance invalidation,
integer-scroll glyph clipping, inherited sticky CSS and superseded top/passive
assertions. Exact #98 executable `85a4977b…` passed both old compact-resize cases
in `2026-11-13T11-18-17.981Z`, proving those failures were introduced by this
slice; both are corrected and pass on the final candidate. Temporary tagged
instrumentation was removed before freezing the candidate.

An over-broad synthetic body handler that vetoed every key caused native Enter
activation to fail in early Details tests. This did not prove a real forum Enter
bug. Final fixtures use the observed Escape-only veto and require native Enter,
Escape closure and focus return. No Enter/Space workaround was added. The new
clock-boundary fixture first omitted UTF-8 response charsets, preventing startup
(`11-26-08.177Z`); the corrected external fixture passes (`11-27-00.712Z`).

Historical #97 failures remain at their recorded scope; no unrelated inherited
failure was relabeled passed. Earlier red/failed receipts remain failed even when
a later candidate passes the same journey.

## Final candidate and replay

Frozen userscript SHA-256:
`7025d719d67404806655444257845340474ab64ac9662c24e54dfa74273c9d89`.
Node24.22.0, npm11.21.1, Playwright1.64.1, macOS Edge157.0.4341.46.
Lockfile SHA-256:
`ff92f13457df78791ff0d2cd9f931daf6c383124231a8d7ae594aa366a3430b5`.

With the pinned toolchain and locked dependencies, run `npm run build`, then:

```sh
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/quiet-status-appearance.spec.ts
npx playwright test tests/e2e/board-checks.spec.ts tests/e2e/thread-checks.spec.ts tests/e2e/thread-refresh.spec.ts tests/e2e/thread-history.spec.ts tests/e2e/automatic-history.spec.ts tests/e2e/thread-tools.spec.ts tests/e2e/stable-board-browsing.spec.ts tests/e2e/compact-board-controls.spec.ts tests/e2e/column-resizing.spec.ts tests/e2e/board-groups.spec.ts tests/e2e/native-keyboard.spec.ts --grep-invert 'real-timer|auto-policy|backoff|failure-recovery'
npx playwright test tests/e2e/navigation.spec.ts -g 'UX54|J2.boards-returned-context'
npx playwright test tests/e2e/board-checks.spec.ts tests/e2e/thread-checks.spec.ts -g 'UI90.real-timer:|UI89.real-timer:|UX99.real-timer-recovery' --workers=2
```

Do not run simultaneous replays against the same Playwright output directory.
HTTP interception fails closed offline. No internal modules are substituted and
no live write is authorized or exercised by these fixtures. Receipts retain source
manifests, candidate hashes, request ledgers, geometry and screenshots.

Final fast evidence under `evidence/runs/`:

- `2026-11-13T11-26-14.679Z`: 187 affected cases passed, including checking,
  boundaries, arrivals, source/account changes, history, compact-title following,
  delayed media, B1/B3/B4, column resizing and native keyboard.
- `2026-11-13T11-27-48.473Z`: 14 UX54/returned-board cases passed.
- `2026-11-13T11-27-00.712Z`: focused automatic quiet→checking→quiet at a real
  mid-scroll visible row passed with unchanged identity/offset and exactly two GETs.
- `installed-99-7025`: parent-qualified installed Edge source equality before and
  after checks. Quiet board/reader band counts 0/0; top board check stays at zero,
  requests one source page and returns quiet. Live paginated reader text stays at
  176.4765625→176.65625→176.4765625px, with pane top fixed at 121.3984375px and
  scroll700→730→700; one complete newest-page request. At390px/125% text, options
  stay within359px width and mode/baseline/time remain available. Reader checking
  at top keeps zero, status remains static and within the390px pane, and the
  beginning marker precedes the opening post. Restored unsupported sources retain
  truthful options/unverified edges; native Escape/focus passes.
- `2026-11-13T11-25-01.666Z`: full-duration board cadence/modal pause and
  reader reverse cadence/modal pause/opt-out passed. This receipt also retains a
  failed new recovery assertion: its fixture repeated identical paragraphs and
  the generic line helper matched offscreen paragraph0 instead of visible
  paragraph7. It is not relabeled passed.
- `2026-11-13T11-32-37.932Z`: unique-paragraph clock diagnosis passed without an
  executable change. Paragraph7 remained at147.921875px through readiness,
  board recovery, reader focus, activation and completion; scroll500→456
  compensated status removal. There was no action-induced scroll contamination.
- `2026-11-13T11-33-03.756Z`: corrected full-duration121s board/reader recovery
  passed on the same executable. Four reads remain four through cooldown; two
  deliberate native Enter activations add exactly two reads, restore quiet and
  preserve the visible row/text.
- `candidate-99-7025d719`: exact userscript, complete build-input source archive,
  diff, runtime identities and independent extracted-source rebuild report.

## Acceptance audit

All criteria are verified at the current owner-approved scope:

- [x] Quiet board has no empty action band; passive reader mode/time is in options
      and actual/unknown boundaries sit beside corresponding posts in both orders.
- [x] Checking, unavailable, failure, Retry, Details and deliberate arrival actions
      remain truthful, named and reachable; native Escape/focus is verified.
- [x] Asynchronous appearance/removal preserves actual mid-scroll row/text; top
      remains zero and status is discoverable. Installed observation agrees.
- [x] Explicit reveals and existing manual/automatic, pause, cooldown, serialization,
      source/account boundaries remain intact, including the strict64/65px follow rule.
- [x] Quiet→checking/failure/arrival→quiet, request counts, top/mid-scroll and
      unknown history are covered by current-candidate complete-app evidence.
- [x] New presentation supersedes #90's blank reservation while preserving its
      operation guarantees; old top/passive assertions reflect the approved contract.
- [x] Failure inventory and observable expectations preceded feature code;
      vertical red/green tests use only the approved complete-app external boundary.
      No unit tests or internal mocks were introduced.
- [x] Relevant E2Es, exact-candidate installed Edge and retained replay/hash
      evidence pass. Chrome is explicitly owner-deferred to #112, not claimed passed.
- [x] Layout/workspace/forum-client/host ownership and non-reply exclusions remain
      intact. No portable contract changed; consumer rerun is not applicable.

Typecheck, lint, formatting and diff whitespace checks pass. Manifest coverage,
size and SHA-256 verification covers every retained run, including failures.
The independent source rebuild uses the locked, already-qualified dependencies;
it does not claim a fresh dependency installation or a release publication.
