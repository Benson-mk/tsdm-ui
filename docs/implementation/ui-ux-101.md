# Accessible post actions and addressed replies — #101

## Before implementation

Base: fc2680dcc6bb1fb8dcb184fd84c778b692aa752e. Apply TDD at the owner-approved
complete-application seam: built userscript, real layout/workspace/editor/client
and browser storage; substitute external HTTP and browser-host boundaries only.
Installed Edge belongs to the parent; Chrome is explicitly deferred to #112.

Research: existing quick-quote requests `reppost`, requires matching native
`reppid`/`reppost`, opaque notice author/message and empty trim field. It already
starts blank. Thread author filters are native links qualified outside post bodies;
use their complete URLs, including page/order/filter context. Existing editor
sessions belong to context IDs and uploads/attempts belong to the writing context.
Changing that ID would discard editor history and risk attachment continuity.
No portable contract/storage schema is planned; no costly one-way decision.

Failure inventory and observable expectations (recorded before feature code):

- Right-click and visible named menu diverge; assert identical actions and truthful
  unavailable Rate/Report state with zero action requests simply from opening.
- Keyboard/touch cannot enter, dismiss or regain focus; drive Enter/arrows/Escape,
  outside press and touch-sized controls, assert focus and viewport bounds.
- Missing native author filter gets invented or context reset; use exact supplied
  native URL, retain selected identity and writing; show unavailable without link.
- Double-click text hijacks word selection; links/controls trigger reply; assert
  browser selection and ordinary navigation while only genuine whitespace prepares.
- Reply addresses wrong post or uses caller-invented authority; assert requested
  exact PID and refusal on mismatched native form controls, with no publication.
- Retarget loses nonempty body, literal quotes, editor session or attachments;
  preserve actual writing and file selections while target author/excerpt changes.
- Removing target drops writing or leaves hidden addressed authority; prepare fresh
  general form, keep body/attachments and remove addressed strip.
- Preparation resolves out of order or after another account/context takes over;
  ignore stale completion, preserve writing and never install foreign authority.
- Typing during preparation is overwritten; retain latest revision or visibly fail
  closed. A stale prepared publication must disappear immediately on retarget.
- Quote happens implicitly or overwrites authored quotes; expose separate deliberate
  insertion and preserve old literal quote blocks verbatim on every retarget.
- Preparation encounters refusal/permission change; retain prior writing/target,
  disclose failure and never imply successful retarget or send.
- Cross-thread/new-thread/edit/private writing is accidentally retargeted; retain
  existing replacement guards and non-reply scope exclusions.

Plan: menu/entry tracer first, retarget/strip second, explicit quotation third,
then gesture and race variants. Each slice adds failing full-app expectations
before production code. Keep red artifacts, targeted reruns and exact build hashes.

Native read-only observations (parent, 2026-11-13): installed Reply uses reppost,
blank message and opaque notice authority; native repquote shows a separate quote
preview while its message textarea is still blank. Generic native Quote opens an
empty insertion prompt. Therefore explicit insertion here is an authored quotation
of visible plain text, not a claim to reproduce native repquote notification flow.
Potential BBCode in displayed text must remain literal under the editor's existing
preservation rules, never become newly executable formatting or attachment syntax.

Additional pre-fix failure expectation: preserving a context ID through retarget
must not let an earlier target-specific mention lookup repopulate transient
results or overwrite the newer preparation status. Hold the external lookup,
retarget through the actual menu, release it, and require a fresh deliberate search.

## Delivered behavior and ownership

The named ⋯ control and right-click share one Reka menu with keyboard navigation,
Escape/focus return, outside dismissal and viewport collision handling. Reply uses
the forum client's existing native preparation. Author filtering follows the full
qualified source link. Rate and Report explicitly say they are unavailable in this
version; #102/#103 own working flows. Opening/dismissing menus performs no action.

Empty-space double-click checks rendered text rectangles and excludes interactive
controls and media. A text glyph double-click retains native selection; source
links retain navigation. Preparation only makes ordinary native GET requests.

Same-thread retargeting retains the writing context and actual editor session,
latest authored revision/options/mentions, file selections, uploaded references,
attachment fields and prior immutable attempts. Fresh native preparation must
validate the target and original actor. A newer target intent owns completion;
old ready/error results cannot change status. Retargeting immediately revokes the
old review revision and clears target-specific transient mention lookups. Removing
the target prepares a general reply through the same client. New-thread, edit,
private-writing and unrelated-thread guards retain their existing meaning.

The strip identifies the target author and a short source-text excerpt. Explicit
quote insertion appends an authored plain-text quotation using the editor's normal
preservation transaction. It never rewrites existing source quotations or copies
native opaque notification fields. BBCode-looking displayed text retains literal
protection and requires explicit interpretation before publication.

No forum-client export, host contract or recovery schema changed. The external
consumer check is conditional on portable changes and is not required here.

## Actual trade-offs

1. Both entry paths anchor their menu to the same named trigger. This gives a
   predictable focus return and viewport collision behavior; right-click does not
   place a separate menu at the pointer coordinates.
2. Existing direct Reply/edit/filter controls and writing-destination disclosures
   remain alongside the new menu/target strip. Existing entry paths stay usable,
   while the interim reader/composer occupies more space until later presentation
   slices consolidate it. Named 44px controls also reserve some header width.
3. Rate/Report remain visibly unavailable until their dedicated qualified flows
   land. The menu is truthful about current application capability even when the
   native forum supports those operations.
4. The whitespace shortcut conservatively gives rendered text, links, controls
   and media priority. Some dense posts offer little shortcut area; the visible
   named menu remains reachable for those posts.
5. Each new target and target removal needs a fresh native form. This adds network
   latency and can fail while retaining the prior displayed target and writing;
   the old review is revoked immediately, before completion.
6. Excerpts/quote text derive from currently loaded post content instead of adding
   stored metadata or authority. Missing source explicitly reports an unavailable
   excerpt and disables quotation; ordinary target identity remains retained.
7. Explicit quotation appends plain text at the end to preserve existing authored
   selections and source. It does not reproduce source formatting/media or native
   repquote notification behavior. BBCode-looking text can require a deliberate
   interpretation step rather than becoming new formatting/attachment authority.
8. Target-specific mention search results are discarded on retarget. A fresh
   lookup may be needed; already-authored mention text and other content remain.

## Verification and retained failures

The owner-approved full-application seam substitutes external HTTP/browser-host
boundaries only. No internal module mocks or unit tests were added. All artifacts
remain under `evidence/runs/`; each completed run has request/screenshot evidence,
its source/test manifest, candidate hash, runtime identity, report and manifest.

Feature-red runs: `11-59-53` missing menu, `12-02-20` missing retarget strip,
`12-04-07` missing explicit quotation, and `12-05-34` missing whitespace reply
(all 2026-11-13 UTC). Their subsequent vertical green runs are retained.
`12-10-05` proved an actual stale review completion re-enabled controls while a
new target was pending. `12-16-21` proved an old mention lookup repopulated results
after retarget. Both have current-candidate passing causal reruns.

Other retained failed runs are diagnostics, not feature proof: the initial Details
label, global alert role/wording, incomplete synthetic publication-form controls,
Inline referenced versus Uploaded status after insertion, and two inherited UX56
expectations of the superseded same-thread discard guard. The cancellation case
still retains its acknowledged browser snapshot; the unrelated replacement-guard
case now uses the unchanged new-thread boundary. Existing J4/UX59 same-thread
journeys now assert preservation and immediate review invalidation. No earlier
failure has been relabelled as a pass.

The broad run's UX62 mixed journey initially sought the pre-#98 permanent Board
filters link and stopped before writing. Its follow-up uses the current disclosure,
choice and Apply controls while keeping native URL, retained reading/writing and
exact independently verified send assertions. This is test-entry drift, not a
new runtime filter policy.

## Installed Edge

The parent supplied accepted final `installed-101-4124` evidence for Edge
157.0.4341.46 and Tampermonkey BETA 5.6.6242 under the owner's beta/stable
equivalence. The exact manager source matched before/after testing and reload,
with one script copy. Keyboard/pointer/right-click/Escape, glyph selection versus
whitespace, target A→B→general, explicit quotation, native author-filter remount,
nonempty literal source preservation, 390px/125% bounds and outside dismissal
passed. No live publication/upload/rating/report occurred. Only disposable agent
text was cleared back to its original empty body; scale/viewport were restored.

`installed-101-f176` remains a separate earlier diagnostic package. Final affected
checks were repeated on 4124. Actual hardware touch is not claimed on the installed
Mac; browser touch entry is complete-app fixture evidence. Exact 125% is the
accepted host-CSS scaling method. Chrome remains deferred to #112 by the owner;
Windows and genuine manager-software-update gaps retain their existing scope.
This is #101 acceptance, not final parent visual approval or release qualification.

## Final candidate and replay

Accepted userscript SHA-256:
`4124b54dc1609f57575a1bcc58ac2e4c74171404574cfa525f1b19396c67bf9e`.
Node 24.22.0/npm 11.21.1, locked dependencies, Playwright 1.64.1 and configured
`msedge` channel were used. The format-only cleanup is verified to emit the same
accepted bytes. `ui-ux-101-candidate` contains the source archive, exact built
artifacts, independent clean-build proof, verification report and manifest.

Replay from that source with the pinned toolchain:

```sh
npm ci
npm run build
npx playwright test tests/e2e/post-actions.spec.ts tests/e2e/writing-entry.spec.ts
npx playwright test tests/e2e/attachment-authoring.spec.ts --grep UX101.uploaded
npx playwright test tests/e2e/replies.spec.ts --grep 'quote-target|reply-mention-context'
npx playwright test tests/e2e/prepared-review.spec.ts tests/e2e/writing-presentation.spec.ts --grep 'UX62.mixed-journey|UX57.continuity|IM72.addressed-return'
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/installed-101-4124
```

The 491-case broad run `2026-11-13T12-17-59.907Z` passed **480** and failed **11**.
It remains failed. Besides the obsolete UX62 board-filter entry, eight UX57
continuity variants clicked the first post button, which is now the new menu;
they now identify the existing localized Reply action by name. IM72's general
reply case now asserts same-thread content-preserving retarget instead of the
superseded discard guard. Those **10** corrected cases, plus all **14** dedicated
post-action cases, passed together in `2026-11-13T12-26-57.603Z` (24/24).
The prior `2026-11-13T12-17-03.441Z` run passed all 17 dedicated post-action,
uploaded-retarget, literal-source and mention-race cases. The broad run also
passed the actual-upload retarget case. These totals overlap and are not additive.

### Unchanged reader-anchor gap

The remaining `UI87.reading-anchor` assertion is retained and still fails. A clean
archive of baseline commit `fc2680dcc6bb1fb8dcb184fd84c778b692aa752e` rebuilt to
exact baseline userscript `8fe2456ace2dc955020976d68314ec753fba0efcff117220ed0ee6c719fc3f58`.
The same isolated application test fails on that baseline and the accepted 4124
candidate with exactly **57.59375px** displacement on compact return. This is not
reported as a pass or fixed by #101.

The diagnostic loop used the `diagnosing-bugs` skill. Ranked hypotheses were
existing anchor policy, new post-header geometry, then control auto-scroll or
ambiguous line matching. Differential execution confirmed the first: the unique
paragraph 11 retains the same 8.90625px pane offset while pane top changes
121.390625 → 178.984375 → 121.390625. Compact return therefore changes its screen
coordinate despite enough space to preserve it. Both scroll owners and exact
post/paragraph identity are recorded; no production instrumentation was added.

Original isolated runs: current `2026-11-13T12-25-45.290Z`, baseline
`2026-11-13T12-26-25.869Z`. Full three-stage measurements: current
`2026-11-13T12-27-51.147Z`, baseline `2026-11-13T12-27-58.411Z` (retained as
`baseline-101-anchor-8fe` locally). `ui-ux-101-anchor-differential` retains the
comparison, exact scripts and clean baseline source. The parent acknowledged the
unchanged gap for #105 composer work and #112 reconciliation; it does not leave a
#101 acceptance criterion unmet. No new runtime exception or green aggregate is
claimed.

## Acceptance audit

- [x] Equivalent accessible right-click/named menus; real Reply and exact native
      author-filter links work with retained writing.
- [x] Rate/Report present truthful unavailable state; their working flows remain
      explicitly assigned to #102/#103.
- [x] Exact whitespace reply preparation preserves native text/link/control
      gestures and performs zero publication requests.
- [x] Same-thread retarget preserves authored source, literal quotes, options,
      editor selection/undo/mode, selected files and uploaded reference intent;
      target author/excerpt updates and removal returns to a general reply.
- [x] Quote insertion is separate and explicit; literal-looking source retains
      editor safety and cannot silently become new attachment authority.
- [x] Authentic source post identity and full author-filter context survive
      navigation and installed native remount.
- [x] Pointer, keyboard, browser touch, dismissal/focus, held preparation, account
      mismatch, wrong native target, refusal, stale reviews and mention lookups
      have observable full-app evidence; preparation never publishes.
- [x] Failure inventory and vertical red/green loops preceded feature changes at
      the approved complete-application seam; no unit tests or internal mocks.
- [x] Relevant full-app coverage and affected installed Edge checks passed at
      current scope with exact candidate/runtime identities and replay artifacts;
      Chrome is explicitly deferred to #112. Failed and inherited results remain.
- [x] Layout/workspace/editor/client/host ownership and non-reply exclusions are
      preserved; no public portable contract or storage schema changed.
