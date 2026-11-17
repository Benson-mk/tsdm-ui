# Refine the selected title-first prototype

The owner selected **A** and explicitly requested **refinement on the prototype
branch**, on 2026-11-17. Scope: `prototype/improve-ui-ux-2026-11-17`; no production
promotion. The original three-way comparison remains captured at `95d79a5` and in
[its report](information-hierarchy-2026-11-17.md).

## Question and plan

Can A make latest activity and inspectable metadata easier to recognize without
losing its scanning density or confusing missing values with absent navigation?

Keep the complete title as the primary destination. Label latest activity and the
Details action explicitly. Give the disclosure a stable trigger and expand its
metadata below the footer, using the existing Reka Collapsible primitive. Keep
known author/time visible when the source has no qualified latest-post link.
Add a synthetic zero-reply/no-latest-link row. Mark A as the selected direction in
the prototype controls, retaining B/C as comparison references.

## Failure inventory, recorded before edits

- A reply count plus a chevron appears to open replies, but actually opens metadata.
- An unlabelled latest author is mistaken for the original author.
- Opening the current native details changes its flex basis and moves the trigger.
- Known latest metadata disappears merely because its exact destination is absent.
- Zero replies are displayed as unknown; unknown replies are displayed as zero.
- Metadata repeats the count or local-writing/moved flags already visible nearby.
- Density falls below four complete sample choices at 1440×900/default text.
- Keyboard disclosure loses focus or navigates; variant switching loses writing.
- Narrow/enlarged text overflows, or an open metadata panel clips full values.
- The dark-theme exercise exposed pale secondary labels and a white Details
  button on the selected row's light accent surface. Before correction, retain
  the existing accent and apply its light-surface text/hover tokens only to A's
  selected row; verify both idle and keyboard-focused states.

## Acceptance

- [x] Record the owner's A selection and retain the alternatives as reference.
- [x] Distinguish title, latest activity and Details actions in the actual preview.
- [x] Verify disclosure geometry/focus and complete metadata, including missing
      values and the zero-reply/no-link case.
- [x] Preserve four complete initial choices at 1440×900 and inspect narrow,
      enlarged-text and dark-theme states with repeatable screenshots.
- [x] Verify reader/writing continuity and keep changes within prototype code/docs.
- [x] Pass typecheck, scoped lint/format and diff checks; capture evidence and costs.

## Results

**A remains the owner's selected prototype direction.** Its explicit Latest
activity and Details labels retain four complete initial choices at 1440×900,
100% text, a 300px thread pane and the existing 100px prototype-control reserve.
The first row starts at y=240.945; the fourth ends at y=773.719, within the pane's
y=60–800 bounds. This is a fixture observation, not a member preference study or
proof of faster browsing.

The bounded browser exercise verified:

- The first Details trigger's x/y/width/height stayed
  420.477/302.945/59.523/44px after opening by pointer. Focus stayed on the trigger.
  Enter closed it and Space reopened it, retaining focus. Original author 小森,
  date 2026-11-16, 386 views and thread 42 remained inspectable. Disclosure did
  not change the reader from thread 42.
- The title for thread 43 opened that thread. A's latest activity for thread 42
  navigated to the exact `page=1#pid4202` destination and focused post 4202.
- Thread 54 retained unavailable latest activity/views and **Replies unknown**.
  Thread 58 showed **0 replies**, 海月 and 昨天 18:20 without inventing a latest-post
  destination; its only link was the thread title. Its original date, author,
  120 views and ID remained in Details.
- A → B → C → A retained thread 42 and exact source
  `A 的細節展開後，這段回覆仍然保留。`, including expansion in B. The inspector
  recorded `selectedDirection: A`, the original target and the synthetic request
  ledger. The local reply flag appeared on return to A. Reload cleared memory.
- At 320×640 and 150% text, all 11 sample rows had equal client/scroll widths of
  288px; the pane measured 320/320px. The first row's complete metadata fitted
  without horizontal clipping. The long fourth title wrapped, with all metadata
  visible after scrolling to its disclosure. The floating controls stayed in
  their reserved area. This is text scaling, not browser zoom qualification.
- The dark exercise exposed pale labels on the selected light accent surface.
  A now applies the existing light-surface text and hover colors within that
  selected row. The corrected dark capture shows black Details text, `#666`
  secondary labels on `#ebf5e8`, and visible keyboard focus. Other rows retain
  the dark palette.
- Typecheck, scoped ESLint/Prettier and `git diff --check` passed. This refinement
  changes four prototype files plus documentation only; production modules,
  dependencies and operation contracts are unchanged.

No tests were added or run, following the invoked prototype skill. The previous
production build result belongs to `95d79a5`; it was not rerun or reattributed to
this prototype-only refinement. These are manual development browser observations
in the Codex in-app browser, not the production E2E suite, installed Edge/Chrome,
IME, accessibility conformance, all-theme or release qualification. No real
sends, uploads, storage/restart or conflict behavior is established. Node
26.0.0/npm 11.12.1 differ from the pinned 24.22.0/11.21.1 release toolchain.

## Repeatable artifact

Run `npm run prototype:information` and open
`http://127.0.0.1:5174/src/layouts/information-hierarchy.prototype.html?variant=A`.

The ignored local directory
`evidence/runs/information-prototype-A-refinement-2026-11-17/` contains the
screenshots, `observations.json`, source manifest and `SHA256SUMS`. The public
[companion JSON](information-hierarchy-A-refinement-2026-11-17.json) records the
final capture hashes and bounded result. The original run remains intact.
Only `*-final.jpg` is attributed to the final source manifest. The earlier
writing/geometry observations precede the final selected-row color correction;
the correction changed only CSS color tokens. Earlier dark captures retain the
discovered contrast defect. A stylesheet reload reset memory during development;
the final dark/narrow captures were taken after setting preferences again.

Replay:

1. Reload A at 1440×900, 100% text, with pins/Details closed. Count complete rows
   inside the thread pane; capture the initial screen.
2. Open the first Details by pointer, compare trigger bounds, close with Enter,
   reopen with Space, and check focus, metadata and unchanged reader. Close it.
3. Open thread 58's Details and verify zero/known metadata/no latest link. Open
   thread 54's Details and verify unknown replies/latest activity/views.
4. Reload A. Reply to thread 42 with the source above; switch to B, expand,
   switch C then A, and use Inspect to compare source, target and selection.
5. In Settings choose Dark at 100%; inspect selected-row Details with keyboard
   focus. Choose Light and move Text size to its 150% maximum. Resize to 320×640,
   open Threads, then inspect first/long-fourth-row Details. Check overflow and
   scrollability. Reset the viewport and reload when finished.
6. Follow A's first latest-activity link and inspect the exact destination; then
   open the second title and verify the reader heading. Capture observations.
7. Run `npm run typecheck`, scoped ESLint/Prettier for the four modified prototype
   files, and `git diff --check`. From the evidence directory run
   `shasum -a 256 -c SHA256SUMS`; compare source hashes before attributing captures.

## Distinct refinement trade-offs

| ID  | Choice and benefit                                                                          | Cost / limit                                                                                                           |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A1  | Explicit Latest activity and Details labels separate navigation from inspection.            | More repeated text and a two-line footer; four initial desktop rows still fit in the measured fixture.                 |
| A2  | Use the existing Reka Collapsible with a stable trigger and linked expanded state.          | More component markup than native details; no new dependency, but the prototype now relies on the existing primitive.  |
| A3  | Preserve known latest metadata even without a qualified link.                               | The row cannot offer a latest-post jump in that state; only its title navigates.                                       |
| A4  | Keep the selected accent surface readable in dark mode using existing light-surface tokens. | A has a local token override tied to the current pale accent palette, which must be revisited if that palette changes. |

Inherited costs remain recorded once in the original ledger: T7 covers hidden
original metadata and the space consumed by expansion; P2 covers synthetic data
and memory-only behavior; P4/P5 cover B/C's reference layouts; P6 covers the
switcher reserve; P7 covers bounded manual verification; P8 covers local artifacts
and an unpushed branch. The user selected A, so that previous lack of owner
selection is superseded, while production approval is still outside this task.
No costly-to-reverse decision was made and no advisor gate was needed.
