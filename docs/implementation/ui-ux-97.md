# Source-backed latest replies — #97

## Before implementation

Confirmed seam: built complete application in Edge with external HTTP fixtures;
real layout, workspace, editor, forum client, storage and redirects. Installed
Edge is checked separately by the parent; Chrome is deferred to #112 by the owner.
The optional portable metadata addition is reversible and preserves old consumers.
No storage contract or costly-to-reverse design choice is introduced.

Failure inventory and externally observable expectations recorded before code:

- The author cell can be mistaken for the latest-reply cell when only one exists.
  Require a distinct native latest cell; never display original author/date as latest.
- Repeating a thread title conceals actual activity. Show source latest author and
  timestamp, preferring explicit source timestamp title over relative text.
- Missing author or timestamp must remain individually unavailable. An absent
  destination must not invent a link from reply counts or original title URL.
- Touch muser/mtime describes the original author/date, not latest activity.
  Supported touch rows without qualified latest metadata show unavailable state.
- Wrong-thread, cross-origin, author-profile or bare-title destinations must not
  acquire a latest-post meaning. Preserve qualified same-thread native latest URLs.
- Latest activation on an already selected thread must reach the actual late page
  and exact PID via a real redirect; title navigation keeps retained reading meaning.
- Long CJK author/time values and 125% text must wrap inside the compact list.
- Reloaded retained board metadata must survive validation without losing old
  records, and portable consumers must still accept legacy ThreadRow construction.

Plan: vertical complete-app red/green metadata slice, then same-thread real-302
navigation slice and partial/touch/reload/width cases; run affected navigation,
board and writing guard regressions, public consumer, strict checks and evidence
verification. Keep failures and candidate-specific reports with replay commands.

## Delivered behavior

`ThreadRow.latestReply` is an optional serializable object with nullable author
and time. Native desktop rows use the distinct final `td.by` cell; a lone author
cell and touch `muser`/`mtime` never supply latest metadata. The source timestamp
`title`, when present, is displayed verbatim; otherwise the native time cell text
is retained. Localized unavailable labels preserve each missing part separately.
The existing `lastPost` destination remains independent from metadata, including
an empty source link label when the destination is qualified.

Latest destinations must be same-origin supported post/page routes. Explicit
conflicting thread IDs, bare title links and unsupported/cross-origin links are
not exposed as latest links. A native exact-PID `findpost` link without a thread
ID remains usable: the PID is source authority, and the workspace's existing
unknown-destination writing guard remains in charge. No thread ID, page or PID
is synthesized from reply counts. Real native redirects already handled selected
threads correctly; no workspace navigation change was needed.

The browser record validator accepts both absent legacy metadata and the new
nullable strings. Complete-app reload checks prove metadata survives and legacy
records remain restorable without a refetch; old records truthfully show the
unavailable labels. The existing clean external consumer passed unchanged.

## Verification and replay

Use Node 24.22.0/npm 11.21.1 and locked dependencies:

```sh
npm ci
npm run build
npm run test:e2e -- tests/e2e/latest-reply.spec.ts
npm run test:e2e -- tests/e2e/navigation.spec.ts tests/e2e/drawer-redirect-guard.spec.ts tests/e2e/stable-board-browsing.spec.ts tests/e2e/board-checks.spec.ts tests/e2e/writing.spec.ts --grep-invert UI90.real-timer
npm run test:consumer
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/<run-directory>
```

Evidence retained separately:

- `2026-11-13T09-30-11.398Z`: first red, latest name/time not rendered.
- `2026-11-13T09-30-48.631Z`: first metadata slice green.
- `2026-11-13T09-31-41.138Z`: partial red, missing time discarded a valid URL.
- `2026-11-13T09-32-19.920Z`: metadata and partial slices green.
- `2026-11-13T09-32-54.994Z`: latest redirects passed, but later assertions
  incorrectly required ordinary-title navigation to retain latest with no reads.
  These expectations conflicted with existing ordinary title/history semantics;
  the corrected case verifies prior selected reading and preserves normal URLs.
- `2026-11-13T09-35-11.504Z`: source exact-PID/no-thread-ID red.
- `2026-11-13T09-35-43.269Z`: all eight B2 cases green.
- `2026-11-13T09-37-13.291Z`: all eight green with additional new/legacy browser
  record reload assertions and no refetch. Long CJK screenshot visually checked.
- `consumer-2026-11-13T09-36-33.552Z`: clean external package consumer passed.

Frozen executable SHA-256:
`8315bf70dba5444d5f523d0a71a64df9b6b1b84c6e8e3af40387b6640010ccc6`.

The writing-remount regression fixture previously called a row for thread 43 a
latest destination in thread 42. Its destination now consistently uses thread 43;
its retained writing, redirect and return assertions keep their original intent.
Existing UI selectors now identify latest activity by source name/time, scoped
to the relevant thread where multiple rows have identical latest metadata.

## Actual trade-offs

- Prefer the explicit native timestamp title over relative visible text. This
  gives stable, precise source information while losing the native relative-time
  phrasing; no timezone conversion or new timestamp is invented.
- Keep metadata additive and optional, without migrating retained snapshots.
  This preserves portable and browser-record compatibility while old snapshots
  show unavailable details until the source is refreshed.
- Require a distinct source latest cell and a qualified destination. This can
  omit ambiguous or contradictory links instead of guessing their meaning;
  source exact-PID redirects with omitted thread identity remain usable and keep
  the existing unknown-destination guard.
- Explicit unavailable labels, including touch sources that expose only original
  author/date, take some row space but make missing activity information clear.
  The exact 125% host-boundary reflow check reuses the testing-method trade-off
  already recorded for #96; it is not a new decision for this ticket.

Chrome remains deferred to #112 under the owner's current scope; it is not a
passed check for this ticket.

## Installed Edge result

`installed-97-2026-11-13` retains the exact executable and hash-verified report,
observations and manifest. Edge 157.0.4341.46 with Tampermonkey BETA 5.6.6242 was
used under the owner's beta/stable equivalence. Manager source matched before
and after. Native distinct-cell metadata matched rendered latest author/time/URL.
A legacy snapshot exposed unavailable fields, fresh source metadata survived reload,
and latest activation on an already selected thread reached and focused the exact
source post (reader scrollTop 0 → 1003). Native keyboard activation at 390×844
survived the redirect/remount and focused the same exact post. At 125% host text
scale the row and pane had no horizontal overflow.

The live network buffer truncated around native navigation, so it provides no
aggregate request claim. Synthetic ledgers remain the repeatable request evidence.
An early query matched underlying native content and was excluded; a scoped wait
timed out during remount, followed by a settled exact workspace focus observation
without repeating activation. These diagnostics remain in the installed package.
No live reply/rating/report was submitted. This is affected ticket acceptance,
not whole-parent or release qualification.

## Acceptance audit

- [x] Distinct native latest author/time reaches portable optional metadata and rows;
      source destination meaning is preserved.
- [x] Partial/absent metadata is explicit, with no original-author substitution or
      inference from reply counts.
- [x] Selected and unopened latest activation reaches exact source-backed post;
      ordinary title and retained reading behavior remain intact.
- [x] Desktop HTML/JSON, supported touch absence, long CJK, narrow 125% and late
      destinations pass complete-app checks and affected installed Edge checks.
- [x] Public metadata remains optional; existing external consumer passes. New and
      legacy browser records restore without refetch or migration.
- [x] Failure inventory preceded production code; vertical complete-app red/green
      cases and their failures are retained. No unit tests were added.
- [x] Candidate/runtime identities, screenshots, requests and replay instructions
      are retained; Chrome is explicitly deferred to #112 by the owner.
- [x] Forum-client interpretation, layout rendering, host record validation and
      existing workspace navigation retain their ownership and scope boundaries.

## Bounded regression coverage

The initial broad run `2026-11-13T09-36-24.148Z` passed nine cases, including the
four-minute real board timer. It was deliberately interrupted in the separate
six-minute scheduler ownership case; 153 cases had not run. The complete artifact
retains that interrupted result. Scheduler code is unchanged by this ticket.
The follow-up excludes the three `UI90.real-timer` cases and exercises the other
160 navigation, board-state, writing-guard and list cases. Excluded cases are not
claimed as passes in that follow-up.

Additional actual trade-off: bounded regression selection avoids repeating the
unchanged scheduler's multi-minute timing/ownership/backoff scenarios, at the cost
of leaving those two incomplete timing checks outside this ticket's verification.
The completed four-minute timer pass and interrupted attempt remain traceable.

## Regression diagnosis

The bounded 160-case run `2026-11-13T09-42-27.449Z` passed 149 cases and failed
11; it is retained as a failed run, not a passing aggregate. Two narrow 150% board
presentation failures were test auto-scroll: the diagnostic run
`2026-11-13T09-44-25.201Z` measured English pane scrollTop 100 → 0 with row tops
moving +100px, and Simplified Chinese 92 → 0 with row tops moving +92px. Both
status bands stayed exactly 119.25px tall. Settings focus restoration had left
the refresh header above the pane, so locator activation moved the list before
checking. The test now reveals the control before measuring, verifies its full
bounds, then activates by direct pointer. All three presentation variants pass in
`2026-11-13T09-46-06.072Z`, with setup/baseline/after geometry attached. Temporary
diagnostic logs were removed. This changes only test setup, not the executable.

### Inherited failure comparison

Current 97: `8315bf70dba5444d5f523d0a71a64df9b6b1b84c6e8e3af40387b6640010ccc6`; run `2026-11-13T09-42-27.449Z`.
Baseline 96: `a3377a2e38f0c258c941f398c4bace180397e3c25a84072f79f51ed5326371b1`; run `2026-11-13T09-47-31.826Z`.

Baseline deliberately ran current unchanged affected test paths against retained 96 executable bytes, not a new build of current source. None of the nine paths uses a 97-specific latest-link selector. Original 96 source identity remains in its retained build/source package. The immutable 97 copy was restored and its hash reverified after comparison.

| Test                                         | Same observed failure on 96 and 97                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `J11.refresh-account-same-member-permission` | Same-member snapshot attribution and restored-snapshot labels absent (two visibility assertions).  |
| `J2.workspace-panes`                         | Raw scrollTop expected 2855, observed 2532; row-relative restoration is covered by newer B1 tests. |
| `J2.returned-touch-template`                 | Old Pages navigation link 2 absent; content itself loads.                                          |
| `UX54.discovery-390`                         | Raw scrollTop expected 40, observed 279 after reflow.                                              |
| `UX54.discovery-768`                         | Raw scrollTop expected 40, observed 0 after reflow.                                                |
| `UX54.discovery-1440`                        | Raw scrollTop expected 40, observed 33 after reflow.                                               |
| `J5.composing-section`                       | Complete source is hidden after Notices navigation; visibility assertion fails.                    |
| `J5.composing-dialog-About this workspace`   | Timeout locating old About this workspace button for dispatchEvent.                                |
| `J5.composing-search`                        | Complete source is hidden after Search navigation; visibility assertion fails.                     |

All nine complete failure-string arrays match exactly, including locations and observed values: eight failed cases and one timed-out case on each executable. These are inherited failures, not passes and not fixed by 97. Root carries applicable broader-spec work to later tickets/final review. B2 latest-source metadata/destination behavior is independently green through eight cases and installed Edge. No unrelated production behavior was amended to satisfy these old assertions.

The separate two UI90 narrow failures were diagnosed as test auto-scroll and corrected with visible-control baseline plus direct pointer; all three presentation cases pass in `2026-11-13T09-46-06.072Z`.
