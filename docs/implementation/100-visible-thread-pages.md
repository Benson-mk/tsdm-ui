# #100 visible thread pages — preimplementation inventory

Base: 954d24bf80769921a8f617e9131f4a4eb2fbe4fb, equal to integration.
Scope: #95 R1 only. TDD uses the owner-approved built userscript plus actual
workspace/editor/storage/forum client, substituting only external HTTP/browser
host boundaries. No unit tests or internal mocks. Installed Edge is parent-owned;
Chrome is owner-deferred until #112 and is not passed here.

## Research and feasibility

ThreadTools already obtains current page from the first visible post's source URL
through WorkspaceLayout and threadHistory.sourceFor. Its existing explicit picker
validates positive integer choices and routes Go through workspace.openThread.
The forum client qualifies pageJump from a native numeric handler and matching
visible/title total outside authored posts, checking origin, thread, author and
order. Missing or conflicting metadata remains absent. Neither reply counts nor
largest links are a total. This existing optional portable contract suffices.

Adjacent history validates account/thread/filter/order/page before merging but
retains entry pageJump; refresh already replaces or withdraws its observation.
Use the same conservative observation policy on successful adjacent loads. Totals
are qualified observations for that reading context, not per-post immutable facts.
No new storage/public contract or costly-to-reverse architecture is needed.

## Failure modes and externally observable expectations

- Trigger remains at entry page through prepend/append: scrolling actual source
  posts changes the displayed numerator, including reversed/author-filtered history.
- Missing, malformed, conflicting, authored or unrelated native bounds imply a
  guessed total: show `unknown`, even with numeric links or large reply counts.
- A fresh adjacent page increases or withdraws bounds but entry total remains:
  show the latest qualified total, or unknown; never display numerator > total.
- Opening/examining/cancelling causes a fetch or movement: ledger unchanged,
  reading position retained, focus returns to trigger; Escape behaves likewise.
- Invalid/fractional/empty/out-of-range choice navigates: Go remains disabled.
  Explicit valid Go requests the exact returned/native qualified context.
- Narrow/enlarged labels overflow or controls become stranded: at 390px/125% text,
  trigger/dialog/actions remain reachable, focus restores and page does not overflow.
- Navigation bypasses writing guards: existing writing/reading interleaving E2Es
  retain exact content and existing workspace guards; no publication requests.
- New total loses authority after refresh: existing refresh upgrade/update/withdraw
  cases remain, now including the persistent total label.

## Planned vertical verification

First tracer: qualified total and explicit unknown on the persistent trigger,
with deliberate choice/Cancel/focus at 390px/125%. Then adjacent-load bounds change
and multi-page source positions, filtered/reversed contexts and refresh withdrawal.
Reuse existing picker qualification/invalid-choice and real-editor guard journeys.
Every run retains reporter receipt, screenshots/request ledger and manifest;
red/failures stay separate. Static checks and independent source rebuild follow.

## Delivered behavior and ownership

The persistent trigger and picker position now show current source page / qualified
total, or the localized explicit unknown state. Current source-page detection,
terminal accessible wording, explicit Go/Cancel, validation, source URLs and
workspace writing guards are retained. The layout only presents existing data.

Successful same-context adjacent history now replaces or withdraws pageJump using
the newly returned forum-client observation. Both adjacent loads and refresh reject
a total below any retained source page, avoiding contradictions such as Page 3/2.
Account/filter/order/epoch validation still runs before the merged observation.
No forum-client parser, public portable contract, storage schema, host adapter,
authoring operation, non-reply workflow or parent #95 tracker changed.

## Actual trade-offs

- Reusing strict native pageJump qualification avoids another authority rule or
  portable contract, while leaving totals unknown on sources that show only links,
  unsupported handlers or ambiguous totals. Reply counts and link maxima do not
  become evidence of a total.
- A fresh same-context page replaces the range's prior total observation. Missing
  metadata or a total smaller than retained source pages withdraws numeric bounds,
  favoring explicit uncertainty over a stale but previously qualified total. This
  can temporarily reduce arbitrary numeric navigation until a fresh consistent
  source is observed; existing returned destinations remain available.
- A persistent total and literal unknown state use more header width in exchange
  for making uncertainty visible without opening the picker. Existing wrapping and
  44px controls remain; the full and compact titles share the same page label.
- Complete-app red/green fixtures and retained source/rebuild artifacts add runtime
  and storage cost. Browser-controlled focus receives installed Edge evidence;
  the owner's deferred Chrome checks remain a limitation until #112.

## Failure record

All receipts remain distinct under evidence/runs:

- 2026-11-13T11-42-04.957Z: first two red cases on 7025d719; qualified and unknown
  trigger labels were missing. 11-42-44.860Z passed the display tracer.
- 2026-11-13T11-43-15.576Z: three adjacent-observation reds on 72e17cbf proved the
  entry total stayed stale for upgrade, update and withdrawal. 11-43-55.456Z passed
  all 27 then-current picker cases on the next candidate.
- 2026-11-13T11-44-23.144Z: shrink red on cbd2a96e displayed Page 3/2. The final
  workspace check rejects totals inconsistent with any retained source page.
- 2026-11-13T11-44-54.240Z: interrupted provisional run on dee5d307 retained 58
  passes, 4 obsolete exact-Page-label failures, 1 interrupted case and 108 not run.
  Static typecheck also rejected assigning undefined to an optional pageJump.
  Assignment/deletion now follows existing refresh semantics; only affected
  thread-label assertions were updated, retaining board/private pagination labels.

These are bounded #100 failures, not assertions about older #97 failures or
whole-parent completion. A later pass does not relabel a failed receipt.

## Candidate and replay

Stable userscript SHA-256:
`8fe2456ace2dc955020976d68314ec753fba0efcff117220ed0ee6c719fc3f58`.
Node 24.22.0, npm 11.21.1, Playwright 1.64.1, macOS Edge 157.0.4341.46.
Lockfile SHA-256:
`ff92f13457df78791ff0d2cd9f931daf6c383124231a8d7ae594aa366a3430b5`.

Use the pinned toolchain and npm ci with the locked dependencies, then npm run build.
The source archive in evidence/runs/candidate-100-8fe2456a captures all build inputs
and test scenarios; its extracted independent build produced identical userscript
bytes using the already installed locked dependencies. This is not a fresh install
or a release claim. Run the following sequentially to preserve separate receipts:

```sh
npm run typecheck
npm run lint
npm run format:check
npx playwright test tests/e2e/page-picker.spec.ts tests/e2e/thread-tools.spec.ts tests/e2e/thread-history.spec.ts tests/e2e/thread-refresh.spec.ts tests/e2e/automatic-history.spec.ts tests/e2e/reading-memory.spec.ts tests/e2e/ui-ux.spec.ts tests/e2e/thread-checks.spec.ts --grep-invert 'real-timer|auto-policy|backoff' --timeout=15000
npx playwright test tests/e2e/navigation.spec.ts -g 'J2.rich-page-target|J2.canonical-lastpost|J2.nonfinal-lastpost'
npx playwright test tests/e2e/native-keyboard.spec.ts tests/e2e/integrated-journey.spec.ts tests/e2e/column-resizing.spec.ts
```

The 171-case run 2026-11-13T11-46-24.978Z passed on the stable candidate, including
all 28 picker cases, 121s cooldown recovery, ownership/late-completion controls,
continuous source positions, reversed/filtered reading, real editor writing,
compact-title/anchor handling and 375px control geometry. Typecheck, lint and
formatting pass. The portable consumer check is not applicable because the public
forum-client contract did not change.

Final additional evidence:

- 2026-11-13T11-50-30.245Z: 4 rich-source/canonical-lastpost/redirect cases passed.
- 2026-11-13T11-50-32.676Z: 19 native keyboard, integrated writing/reading and
  constrained-column cases passed. Total 194 affected cases pass on 8fe2456a.
- installed-100-8fe2456a: parent accepted installed Edge 157.0.4341.46 with
  Tampermonkey BETA 5.6.6242 (owner accepted stable/Beta equivalence). Exact manager
  source matched before and after. Native Page 1/12 trigger/picker agree; 13 is
  invalid; pending 2/Cancel retains focus and produces no forum request. Nine
  unrelated site/asset/extension requests occurred, so zero overall traffic is
  expressly not claimed. At 390×844/125% text, dialog width 358/358 fits. Go 2 performs
  one GET and displays 2/12. Load later appends 10 posts with one page 3 GET while
  current remains 2/12 until the first visible post actually comes from page 3.
  Native author filtering preserves parameters and returns one post/unknown total;
  its two plain/JSON GETs are retained as observed. Unsupported 3 disables Go;
  native Escape restores Page 2/unknown focus with no forum request. Unknown trigger
  width 194/194 fits. Temporary text and viewport overrides were reset.

The installed run did not manufacture dynamic bounds or publish live content.
Those cases retain complete-app fixture authority. Chrome remains owner-deferred
until #112, not passed. All retained package manifests, including red and interrupted
runs, verify exact coverage, size and SHA-256. The source archive predates this
final audit prose; final audit.md is retained beside it. Build inputs and test
scenarios are unchanged from the independently reproduced archive.

## Acceptance audit

All seven criteria verified at the owner's current scope:

- [x] Trigger tracks actual visible source page through continuous history; existing
      sourceFor ownership is retained and installed appended-page observation agrees.
- [x] Totals use only qualified pageJump observations; absent/conflicting/withdrawn
      and contradictory totals remain explicitly unknown, without reply-count or
      link-maximum inference.
- [x] Open/examine/Cancel do not navigate; deliberate valid Go preserves returned
      filter/order context and real editor writing, rejects invalid choices and
      retains existing workspace operation guards.
- [x] Multi-page scrolling, author filtering/reversal, unknown totals, invalid
      choices, Cancel/Escape and focus are verified at narrow/enlarged sizes.
- [x] Failure inventory and observable expectations preceded feature changes;
      vertical E2Es use the approved complete application and only external
      HTTP/browser-host substitutions. No internal mocks or unit tests were added.
- [x] 194 relevant E2Es, affected exact-candidate installed Edge, static checks,
      extracted-source byte-identical rebuild and verifiable replay/manifests pass.
      Chrome's owner-directed deferral to #112 remains explicit.
- [x] Layout/workspace/forum-client/host ownership and non-reply exclusions remain
      intact; no public portable contract changed, so consumer rerun is inapplicable.

Integration feat/improve-ui-ux remains 954d24bf80769921a8f617e9131f4a4eb2fbe4fb;
merging it into the implementation branch reports already up to date. No issue,
PR, release or parent #95 completion was edited by this slice.
