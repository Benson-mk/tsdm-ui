# #105 — Compact and expanded ordinary reply editor

## Research and failure inventory before production code

Base: 8078000ca7d86ac29ecfeff5f91f056e63c9e9a9. Read live105, parent spec, composer
feedback/style/inline references, glossary and ADRs. The existing editor session
already owns source, selection and undo; presentation can retain it unchanged.
Ordinary replies alone adopt this layout. Review remains until110; new sessions
start visual. Non-reply behavior and portable contracts remain unchanged.

Approved E2E seam: built userscript with real workspace/editor/storage/client and
only external HTTP/browser-host substitution. No unit tests or internal mocks.
Edge development and parent installed acceptance; Chrome deferred112.

Failure cases and observable expectations:

1. Tall resting chrome or duplicate sender: assert one plus/input/expand/Review
   row, white8px input, pill action, same-column expansion and visible reading.
2. Remount/lossy conversion loses source, selection, undo, target or attachment:
   retain DOM handle, exact source, selection and authored attachment/target;
   exercise real formatting and undo through both presentation changes.
3. Compact tools omit commands: exercise production formatting, lists/code,
   links/media/emoticons, quote/hidden, full table operations, mentions, attachments,
   source and Preview; retain relevant advanced-editor coverage.
4. Review becomes Send or bypasses preparation: inspect frozen prepared source and
   HTTP request ledger; presentation/Preview must never issue consequential writes.
5. CJK targets/chips/notices overflow at narrow/enlarged widths: capture desktop,
   905px, 390px at100/125%, verify page width, action reachability and focus.
6. Expansion shifts a visible reading line: retain historical UI87 failure and
   exact screen-coordinate assertions. Use direct interactions, avoiding locator
   autoscroll after measuring the baseline. Diagnose heading/scroll ownership.
7. Quiet recovery hides failures or controls: keep warnings visible and all
   recovery/attachment/publication controls reachable under plus/expanded mode.

Plan: first red resting/default-mode E2E, then retained-editor layout slots plus
bounded full tools. Follow continuity/tool tests, anchor diagnosis and responsive
review captures; freeze candidate, run affected checks, wait installed acceptance.
No costly-to-reverse storage or portable contract choice is planned.

## Actual distinct trade-offs

1. Scope ordinary replies by both native `reply` and `quick-quote` actions. Reuse
   one retained production editor with internal presentation slots and scoped CSS;
   this adds component presentation plumbing while avoiding duplicate sessions,
   command implementations or public portable contracts. New threads, edits,
   private writing and their publication policies retain their existing layout.
2. Put the full controls in a bounded, scrollable disclosure under plus (visible
   when expanded). This keeps all production controls and existing argument/table
   interactions, but reaching lower tools requires scrolling and open tools consume
   reading space. It deliberately does not substitute the smaller prototype toolbar.
3. New ordinary editor sessions, including browser-restored sessions, start visual
   unless unresolved interpretation requires source. Presentation changes keep the
   user's explicit current mode. No durable editor-mode preference/schema was added;
   after a document navigation, source-specific work explicitly chooses Source again.
4. Hide healthy recovery prose at compact rest while keeping failure notices visible
   and normal recovery/details/options reachable under plus or expansion. This saves
   passive chrome but adds a disclosure action for healthy recovery information.
5. Selected attachments stay visible as compact status chips; their existing upload,
   insertion, removal and verification actions appear under plus or expansion.
   This saves resting height at the cost of an extra disclosure before those actions.
6. Limit long target authors and excerpts to two visible lines each, keeping full
   author text in the title/accessibility content. Use a named stroked quote icon
   rather than a wide text button. This protects the writing row on narrow screens
   while making full target detail and the operation less immediately visible.
7. Keep Review as the primary action, with its visible word on wider layouts and a
   named review icon at narrow widths. The icon preserves input width but relies on
   recognition/title/accessibility text; it never claims to send before the separate
   frozen review. The original sender/destination remains available to assistive
   technology without a visible sender label beside the action.
8. Optional Preview reuses the existing inert source renderer, including literal
   BBCode-off behavior and protected markup. It is fast and causes no HTTP requests,
   but does not promise native forum rendering or substitute for prepared authority.
9. Keep the new slice's external HTTP fixture local to its E2E file. This makes the
   review unit independently replayable without refactoring older fixtures, but
   duplicates some fixture maintenance. Existing source-specific tests now choose
   Source through actual controls; their source/selection/history assertions remain.

All are reversible presentation/test choices. No storage/backend/schema or public
portable contract was selected, so the conditional one-way-door advisor gate was
not triggered. The existing field/button/command ownership stays intact.

## Behavior and evidence

The compact composer uses one plus/input/expansion/Review row. Empty or short
writing is 66px high at desktop/905px in the light 100% samples. Multiline content
can grow; target, attachment and recovery context add height. Expanded writing
stays below the reader at all tested widths and retains at least96px of actual
reading even in the retained short-window tests. Both views retain the same
ProseMirror/textarea DOM and workspace editor session.

The controls retain undo/redo, common and advanced appearance, lists/code,
links/media/emoticons, quotes/hidden blocks, table insertion and all table
operations, mentions, attachments, source, Preview and current reply options.
E2Es execute these controls and inspect exact source/results, including protected
markup, row/column operations and merge/split, qualified mentions and attachment
association. No test counts buttons as a substitute for command behavior.

The native reading-anchor failure inherited from #101 is now resolved for ordinary
replies. The old aside changed reader width and heading height; on compact return
its pane-relative restoration displaced a line whose screen coordinate again fit.
Ordinary replies no longer enter that aside. The exact UI87 unique-line and screen-
coordinate assertions pass without relaxing their expectation. The original
57.59375px failure and differential baseline remain retained under
`evidence/runs/ui-ux-101-anchor-differential`; #105 does not relabel those old runs.

Qualification uses Node24.22.0/npm11.21.1, Playwright1.64.1 and Edge157.0.4341.46 on
macOS. No forum-client export, package version, persistence schema or host authority
changed; the conditional consumer compatibility gate does not apply.

## Verification and replay

- `2026-11-13T14-30-55.204Z`: all53 new/legacy presentation cases pass on3c1ee01a,
  including full responsive captures, exact UI87 anchor, source/visual continuity,
  keyboard and real-browser composition during pointer expansion/collapse.
- `2026-11-13T14-32-15.861Z`: all284 shared editor/publication/attachment/retarget
  cases pass on3c1ee01a. Together with53 presentation cases, this is337 complete-app
  E2Es on the same exact behavioral candidate.
- `2026-11-13T14-37-04.350Z`: all19 affected final cases pass on d53e6627, including
  the new empty-chip regression, final owner captures, exact UI87 anchor and real
  browser composition. The only runtime delta from3c1 is hiding empty attachment
  message paragraphs. The coordinator explicitly accepted this bounded reuse.
- Final candidate SHA-256:
  `d53e662717fe6de061c64c21bdb9edff3975144c19cb5b09772a04100419889e`,
  2,319,705 bytes. Frozen userscript,100 production source files verified against
  original receipt hashes, build inputs, logs and replay package are retained in
  `evidence/runs/ui-ux-105-candidate-d53e6627`.
- Build, typecheck, lint, Prettier and whitespace checks pass. Final deterministic
  source rebuild and evidence manifest verification are recorded in the sealed
  candidate package. No public portable contract changed.
- Exact-source installed Edge acceptance passed on3c1 behavioral checks and d53
  final scoped checks, with distinct packages and limits below.

Replay with the pinned toolchain:

```sh
npm ci
npm run build
npx playwright test tests/e2e/reply-layout.spec.ts tests/e2e/writing-presentation.spec.ts
npx playwright test tests/e2e/advanced-editor.spec.ts tests/e2e/visual-editor.spec.ts tests/e2e/prepared-review.spec.ts tests/e2e/attachment-authoring.spec.ts tests/e2e/post-actions.spec.ts
npm run evidence:verify -- evidence/runs/<run-id>
```

Each generated receipt records exact userscript hash, dependency/runtime identity,
source/test manifest, screenshots, request/source observations and replay fixtures.
Named owner-review images and their index live in
`evidence/runs/ui-ux-105-owner-review`. Final owner visual approval remains #112.
Chrome is expressly deferred to #112 by the owner; it is not claimed passed here.
No live reply/upload/removal was authorized by synthetic fixture tests.

## Preserved failures and corrections

All runs, including failed and interrupted runs, remain under `evidence/runs/`.

- The first baseline build hit workspace sandbox EPERM; the initial no-build test
  failed to find its userscript. Authorized pinned build then established the real
  red: the baseline reply had no visible visual editor (`14-04-51.837Z`).
- Addressed replies initially retained the old presentation because their native
  action is `quick-quote`; the continuity red identified this and both ordinary
  reply actions now use the same presentation.
- An early continuity assertion inspected hidden source after formatting had
  intentionally switched the existing engine to visual. The test now explicitly
  returns to source before recording selection. No editor semantics were changed.
- Long CJK author/excerpt content consumed the entire narrow dock. Bounded short
  target text and the compact quote control fixed the actual starvation failure.
  The failed narrow evidence also exposed an afterEach assumption that refused
  storage still contained recovery; absent storage is now recorded truthfully.
- Test expectations for named-quote BBCode and the frozen source control initially
  assumed a different representation. They now inspect the established quote
  source and real prepared-source disclosure; production command behavior stayed.
- Early broad policy runs found old source-default assumptions. One overlapping
  rebuild also caused a missing-dist bootstrap failure. These are retained, not
  relabelled; subsequent frozen runs are sequential with respect to rebuilding.
- Source-specific fixture setup initially checked for plus before asynchronous
  preparation mounted it. It now waits for the real visible composer. Native
  document navigation and keyboard reply entry correctly start a new visual
  session, while their retained exact source remains available.
- Plus initially revealed controls without entering them on keyboard activation;
  the focused-first-control red (`14-20-17.320Z`) is fixed, with Escape returning
  to the editor and the selected range preserved.
- Older presentation geometry referenced the removed standalone header. Its
  observations now measure the actual input row's visible boundary and named44px
  actions, preserving complete-line, selection, undo and readable-space assertions.
- Candidatea55c disabled expansion during IME, breaking the existing deliberate
  pointer commit/deferred-resize behavior. The real-browser composition cases
  failed (`14-27-58.482Z`). Removing that new disabled attribute restores the
  existing policy; all8 targeted cases pass on3c1 (`14-30-23.053Z`). The a55c
  installed package remains explicitly provisional, never final acceptance.
- Candidate3c1 gave an empty attachment message paragraph a12px gray pill. The
  visual red (`14-33-59.433Z`) records that artifact; the scoped `:empty` rule
  passes the final19-case run and removes only the empty surface.

The request/source/screenshot snapshots and original logs retain exact errors. Final green
runs do not convert these prior failures into passed observations.

## Installed Edge acceptance

The coordinator accepted final d53e6627 using Edge157.0.4341.46 and Tampermonkey
BETA5.6.6242. Exact manager source comparisons, replacement, reload and final
readback match the immutable candidate. Installed packages remain separate:
`ui-ux-105-installed-a55` (provisional failed-policy candidate),
`ui-ux-105-installed-3c1` (behavioral qualification), and
`ui-ux-105-installed-d53` (final cosmetic delta).

On3c1, native editing generated exact bold source; selection survived presentation,
Undo/Redo restored exact plain/bold content, and unknown protected source survived
compact/expanded and optional Preview. Plus keyboard entry and native Escape
returned focus correctly. At desktop, reader width1004px and visible lineY295.0703125
remained invariant through compact/expanded/compact. At390px/125%, reader and
writer client/scroll widths matched390px and195.640625px of reading stayed visible.
Multiline source grew to its140px bound;905px/125% kept the row and reading visible.

The final d53 scoped installed check retained zero horizontal overflow at390px/125%,
255.375px of compact reading and reachable expanded tools/input/Review. The empty
no-upload attachment region measured0px. Selected-attachment empty-message behavior
is verified by E2E, not by an invented live upload. Only the coordinator's safe test
text was cleared; original blank visual writing, target, hidden presentation and
default viewport/text scale were restored. No live publication or upload occurred.

Actual OS IME was not exercised in this installed session; real browser-composition
boundary E2Es remain distinctly scoped. Chrome and final owner visual approval stay
with #112. No whole-parent completion or release qualification is claimed.

## Acceptance at the owner's current scope

- [x] One compact plus/input/expansion/Review row grows for multiline content and permits contextual height.
- [x] Established input, pill action, stroked controls, quiet/pastel surfaces and overlay shapes; no visible sender beside the action.
- [x] Visual default and complete/protected source retain the same editor, formatting, selection, undo, target and attachments across presentation changes.
- [x] Compact tools under plus and same-column expansion retain the full production command families, source, Preview and applicable reply options.
- [x] Prepared publication, explicit final approval, recovery and account controls remain intact; Review is not mislabeled Send.
- [x] Actual command/source behavior, narrow/enlarged CJK context, chips/notices, keyboard focus and no horizontal overflow are verified.
- [x] Concrete compact/expanded owner-review unit includes desktop,905px and390px at100%/125%; final owner approval remains #112.
- [x] Failure inventory and complete-app E2E expectations preceded production; no unit tests or internal mocks were added.
- [x] Relevant E2Es and affected exact-source installed Edge checks pass with retained failures, replay/source hashes and bounded reuse; Chrome is expressly deferred to #112.
- [x] Layout/workspace/forum-client/host ownership and non-reply policies remain intact; no portable contract changed and its conditional compatibility gate is inapplicable.

Every #105 criterion is verified at the owner's current scope. Final owner visual
approval, Chrome qualification and later #106–#112 policies are not included.
