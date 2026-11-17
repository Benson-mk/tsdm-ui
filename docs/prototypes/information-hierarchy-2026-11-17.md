# Information hierarchy prototype

Throwaway branch: `prototype/improve-ui-ux-2026-11-17`.
Base: current main `abb4987`; research: `research/improve-ui-ux-2026-11-17`
at `3c2bca1`. Parent context: #95, with later #112 corrections preserved.

## Question and plan

Which information hierarchy makes choosing a discussion easier without hiding
its destination, latest activity or important board context?

Three variants in the existing workspace's board pane, switchable with
`?variant=A|B|C`: title-first summaries, activity-first entries, and a compact
index with a deliberate inspection step. Keep the real surrounding workspace,
reader, editor, palette and row shadows. Add a visible destination during expanded
writing. Use the existing local `src/layouts/*.prototype.html` preview convention:
the shipped application is a userscript, not a localhost router.

The host uses authored synthetic responses and memory-only preferences/navigation.
No live forum requests, persistent drafts, uploads or publication are available.
This prototype checks presentation, not storage or operation authority.

## Failure cases recorded before implementation

- Variants become mere color changes rather than different scanning tasks.
- Missing latest author/time is replaced by original metadata or a fabricated zero.
- Full titles, original metadata, exact latest destination, pins or subordinate
  boards become unreachable after reducing routine information.
- Switching variants remounts the editor, loses writing or changes the reader.
- Expanded writing hides its destination, especially for long CJK titles.
- The floating controls hide Send, intercept editing arrows or leak into builds.
- A local preview follows a real forum link or performs a real mutation.
- Narrow/enlarged text causes horizontal overflow or unreachable controls.
- An outcome becomes more certain merely because a summary is shorter.

## Prototype acceptance

- [x] Three structurally distinct variants use the same parsed board data inside
      the production workspace shell; full metadata remains inspectable.
- [x] One command opens the preview; URL selection survives reload; bottom arrows
      cycle both ways and do not intercept editor input or overlay controls.
- [x] Selection, editor content and destination survive variant changes.
- [x] Desktop, narrow and enlarged-text observations are retained with screenshots
      and replay instructions; limitations remain explicit.
- [x] Transport and storage remain synthetic/in-memory; production excludes the
      preview entry and switcher.
- [x] Record the question, provisional verdict and distinct costs on the throwaway branch.

## Verdict

**2026-11-17 follow-up:** the owner selected A and requested refinement on this
prototype branch. See the [A refinement report](information-hierarchy-A-refinement-2026-11-17.md).
The comparison observations and JSON below remain historical evidence from
`95d79a5`; A's selection does not promote the prototype into production.

The bounded observations below support A as a starting hypothesis. No member preference or production decision is established.

## Run and compare

```sh
npm run prototype:information
```

Open `http://127.0.0.1:5174/src/layouts/information-hierarchy.prototype.html?variant=A`.
Use A, B or C in the URL, the floating arrows, or Left/Right outside an editor,
form control, toolbar or dialog. **Inspect** exposes the current destination,
selection, exact writing snapshot, preferences and synthetic request ledger.
It also opens the rating/report presentation examples. Those examples have their
own explicitly simulated submission and never call a forum operation.

The production userscript entry is unchanged. Two named presentation slots in
`WorkspaceLayout.vue` and one forwarded slot in `SourceWriting.vue` let the local
entry reuse the real workspace, reader and ProseMirror editor. The ordinary
userscript renders the existing fallback. The preview and switcher are guarded by
`import.meta.env.DEV` and absent from the production entry graph.

## Observations and provisional answer

**A is the strongest starting hypothesis for ordinary browsing.** At 1440×900,
100% text, four complete sample choices fit below the board controls, including
the long fourth title. The first starts at approximately y=241. This is a measured
fixture outcome, not a controlled comparison against the earlier live forum or
proof that members choose more quickly. The 100px prototype control reserve is
included in this measurement.

B makes the latest reply the primary destination and spends more space on the
person/time. C separates selecting for inspection from opening the reader; its
independently scrollable index keeps the detail panel nearby, but a short viewport
still requires scrolling to the Open action. Neither was silently selected for
production. Expanded writing can show the complete destination without remounting
the editor. Result-first receipts distinguish a confirmed rating from a report
whose receipt remains uncertain; this is a copy/layout demonstration only.

Browser observations verified:

- A → B → C retained thread 42 and the exact entered reply; expanding retained the
  editor content and exposed the destination. ArrowLeft inside the editor did not
  switch variants. Settings slider arrow keys changed text size to 140 without
  changing the variant. A → C keyboard wraparound and C → A button wraparound worked.
- Reload retained the URL variant and cleared the sample writing/preferences.
- C inspection selected thread 43 while the reader remained on 42; Open then
  navigated to 43. B's latest link opened thread 42 at exact post `#pid4202`.
- Unknown metadata stayed unavailable for thread 54. About exposed statistics,
  the subordinate board and its posting guidance; pinned content remained
  reachable. The production filter dialog opened and Cancel dismissed it.
- Expanded writing was inspected at 390×844 and 320×640. A long CJK destination
  wrapped at 320px with Compact/Send still reachable. All three list variants were
  inspected at 320px with 140% text. A's list measured 320px client/scroll width.
- A preset report had no duplicate editable message/count; Other showed its
  input/count and disabled submission while empty. The simulated outcome stayed
  uncertain and offered Close. The simulated rating showed +2 and Close, with
  original actor/target and notification uncertainty in Submitted details.
- `npm run typecheck`, scoped ESLint/Prettier, `npm run build` and `git diff --check`
  passed. Built userscript inspection found no switcher, experiment title or
  throwaway banner. No tests were added, following the invoked prototype skill.

The browser exercise is a manual development smoke check, not the production E2E
suite, installed Edge/Chrome qualification, native IME qualification, a formal
accessibility audit or a participant study. No storage/restart/send/upload or
conflict guarantees are established. Node 26.0.0/npm 11.12.1 were available;
the pinned release versions remain 24.22.0/11.21.1. The previously documented
obsolete no-shadow E2E oracle was outside this prototype and remains unchanged.

## Repeatable artifact

The local ignored directory `evidence/runs/information-prototype-2026-11-17/`
retains screenshots, density measurements, a synthetic writing-state snapshot,
source hashes and a file manifest. The public companion
[information-hierarchy-2026-11-17.json](information-hierarchy-2026-11-17.json)
records final capture hashes and the bounded result. Earlier captures are
retained as development observations; only `*-final.jpg` is attributed to the
final source manifest. The final fixture correction aligned reader authors with
list metadata and corrected the subordinate-board singular label.

Replay on this branch:

1. Start the command above; use 1440×900 at default text. Capture A, B and C with
   pins/context closed. Count complete rows within the board pane, not the page.
2. In A, Reply to thread, enter `切換版面仍保留這段回覆。`, switch to B, expand,
   press ArrowLeft in the editor, then switch to C. Inspect the snapshot.
3. Reload C, select the second title, verify that only the inspector changes,
   then Open. Switch B and follow the first latest-reply link to `#pid4202`.
4. In A, open the long fourth title and expand a reply. Inspect at 390×844 and
   320×640. Use Boards → Settings → Text size 140, then close Settings/drawer
   before opening Threads. Compare all variants; scroll to C's Open action.
5. Open About, pinned content and Filters/Cancel. Open Inspect → report; compare
   Advertising with Other, enter a reason and simulate its uncertain receipt.
   Repeat the rating example. Reset the viewport when finished.
6. Run the checks above. Hash the retained outputs with SHA-256 and compare the
   final source manifest before attributing screenshots to this candidate.

Initial local server launch was sandbox-denied; the authorized loopback launch
succeeded. Development syntax/lint mistakes were repaired before final checks.
One browser locator treated native summary as a button; the native summary
locator succeeded. None is represented as a production test failure or a clean
full-suite run.

## Complete trade-off ledger

These are actual choices in this prototype. Inherited research costs are cited
by their existing IDs and recorded once here, without claiming new decisions.

| ID             | Choice and benefit                                                                                                               | Cost / limit                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1             | Start from clean current main, reference research at `3c2bca1`, and leave archived demos archived.                               | Reading the full research requires that branch; this commit does not copy the research or restore old previews.                                                                  |
| P2             | Use the real workspace/parser/editor with a synthetic transport and memory-only host.                                            | Real account, durable recovery, sends, uploads and non-browsing destinations are not qualified; the fixed examples cannot reproduce live data diversity.                         |
| P3             | Add small branch-local presentation slots and an isolated Vite entry instead of duplicating the whole workspace.                 | Two production source files carry throwaway seams on this branch; these must be removed or deliberately redesigned during any later implementation.                              |
| T7             | A puts titles/latest activity first and reveals original metadata on demand.                                                     | Historical author/date/views take a disclosure action; the expanded row uses extra space.                                                                                        |
| P4             | B promotes latest activity and its exact destination to the main action.                                                         | Fewer complete discussions fit; chronological ordering is not inferred from display times, and original context takes secondary attention.                                       |
| P5             | C separates a compact title index from detailed inspection.                                                                      | Opening takes an extra action and introduces an independent scroll region; short screens need additional scrolling to the Open action.                                           |
| T8             | About defers board statistics and subordinate-board descriptions while pins remain explicitly reachable.                         | Board discovery/guidance takes a reveal; production must retain genuine urgent restrictions at their decision point.                                                             |
| T6             | Show the complete expanded-writing destination and disclose exact IDs.                                                           | It consumes editor height, especially when a CJK title wraps.                                                                                                                    |
| W5 / IS1 / IS2 | Simulated result-first receipts defer exact submission details, omit identical preset text and use lifecycle-specific dismissal. | Inspecting historical detail takes a reveal; production needs state-specific predicates/focus checks and cannot infer stronger outcomes.                                         |
| P6             | Reserve 100px for a persistent development switcher; print state and use a dedicated inspector.                                  | Less app height is available for comparison, and inspection adds development-only UI; measurements include that reserve.                                                         |
| P7             | Use bounded browser observations, static checks and a production build; add no tests or new dependencies.                        | There is no automated regression harness, full-suite/release pass, all-theme audit or member preference result; the available runtime differs from the pinned release toolchain. |
| P8             | Keep screenshots local and commit a hash manifest plus replay steps; leave a local-branch pointer on #95.                        | Another machine needs the branch and must replay the preview; the issue pointer is not a published remote branch or hosted demo.                                                 |

All choices are reversible. No storage schema, portable-client contract or other
costly-to-reverse technical decision was selected, so no BDFL advisor gate was
needed. No prototype variant is promoted into main.
