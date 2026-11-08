# Account footer and Settings — #83

The canonical requirements remain [ticket #83](https://github.com/Benson-mk/tsdm-ui/issues/83) and [spec #81](https://github.com/Benson-mk/tsdm-ui/issues/81). This slice moves account information and the sole Settings action beside independently scrolling navigation. About is a section in the same Settings dialog. Chrome qualification remains deferred to #93.

## Implementation and scope

The existing Boards region now contains a scrolling navigation body and a sibling footer. Its scroll position still belongs to the layout's pane preservation mechanism. The existing account label retains fresh member, guest, unknown and restored snapshot wording. No account authority, recovery, persistence, preferences or forum-client API changed.

Settings uses its existing Reka dialog, composition deferral and preferences owner. The header's redundant Settings/About entry points are removed. Opening Settings from Boards temporarily hides that drawer; closing Settings exposes the navigation presentation appropriate to the current width and returns focus to the same Settings trigger. This preserves one active modal and the retained navigation scroll, including resizing across the docking boundary while Settings is open. About uses ordinary section/heading/content semantics inside Settings.

A focused application experiment also reproduced unsuccessful outside dismissal through the existing Reka ShadowRoot path, independently of the drawer handoff. Settings now uses the same completed primary overlay press convention as Boards: secondary presses and pointer cancellation do not dismiss. Reka still owns dialog semantics and focus trapping. No new shared modal framework was introduced.

## Failure-first verification and replay

Before feature code, reachable failures and the agreed built-application/HTTP seam were recorded in the session's `83-failure-analysis.md`. Named full-application Edge expectations exercise the emitted userscript, replacing only external HTTP:

- `UI83.footer`: account and Settings bounds before/after navigation scroll, final board reachability, 150% text, long mixed CJK/Latin identity and 1280×600, 960×420, 375×420 and 320×360 windows.
- `UI83.dialog`: collapsed/reopened Boards, one active modal, About section, complete keyboard focus cycles, Escape, retained preferences/navigation scroll and both directions across the 960px docking boundary.
- `UI83.account-member`, `UI83.account-guest`, `UI83.account-unknown`: fresh and actually reloaded snapshot labels, with no extra HTTP during recovery.
- `UI83.retention`: deferred navigation during composition, retained reader position, exact addressed source, editor identity/selection/undo and outside dismissal.
- `UI83.dismissal`: secondary and cancelled overlay presses remain open; a completed primary press dismisses.

Existing journeys use UI-only Settings entry/exit helpers to reopen Boards when necessary and dismiss the restored navigation when continuing in reading/writing. Their original behavior assertions remain in force. Earlier About modal assertions now exercise Settings and its About section. A viewport event can precede Vue's docking frame; test entry waits for those browser frames before choosing the visible action. This is test synchronization, not a production delay.

Use the pinned Node 24.22.0 / npm 11.21.1 tools, then:

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:e2e -- tests/e2e/navigation-settings.spec.ts tests/e2e/appearance.spec.ts tests/e2e/foundation.spec.ts tests/e2e/progressive-drawers.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/visual-viewport.spec.ts tests/e2e/safe-area-edges.spec.ts tests/e2e/refined-navigation.spec.ts
```

The evidence reporter retains report/receipt, source/build hashes, fixture sources, screenshots, geometry/request observations and an exact file manifest under `evidence/runs/`. Failed observations and interrupted runs remain separate. Installed Edge evidence and final advisor disposition are recorded below. No portable contract changed, so no external-consumer rerun is required for this slice.

## Distinct implementation trade-offs

1. The identity is visually limited to three lines so a long name cannot consume a short navigation pane. Its complete existing wording remains in accessible text and a native title tooltip; seeing the entire long name visually may require hovering.
2. Settings temporarily replaces the Boards modal and restores navigation on exit, adding a small layout-owned focus handoff. This avoids competing modal traps; returning to the reader from this path requires dismissing the restored Boards drawer.
3. Explicit overlay press bookkeeping compensates for the observed ShadowRoot dismissal limitation. It adds bounded local gesture state, while retaining the established primary-press/cancellation convention and Reka's modal/focus ownership.

The existing #82 development dependency-symlink trade-off applies unchanged. No additional dependency, new persistence, live social write or release action was introduced.

## Existing-journey adaptation audit

- Settings entry/exit: the approved footer placement makes the trigger hidden when Boards is closed. UI-only helpers reopen Boards, choose the localized Settings action and dismiss restored Boards when a journey continues in reading/writing. Existing source, requests, preferences and editor assertions remain. Localized Settings availability is checked through opening its named dialog, rather than requiring a hidden-navigation action to remain visible above the reader.
- About: approved relocation replaces the former standalone button/dialog with the heading inside Settings. Version-content and locale assertions remain.
- Navigation: `downloads` now selects the localized Saved button after opening Boards, replacing the removed narrow combobox; `ui-ux` uses the #82 reader-heading Back control after paging without opening an unrelated drawer. Board-directory navigation still opens Boards.
- Native typography: the footer now lives inside the Boards drawer. Its test reopens Boards before measuring the trigger and exposed a real host `word-break: break-all` leak. Adding `.pane-drawer` to the existing normal-word-break reset fixed it; the independent native-CSS regression and corrected installed Edge evidence verify the change.
- Safe insets: navigation body/footer own their respective inset spacing after the approved split. Tests inspect those actual owners and the #82 Boards drawer/browse-only results rather than a superseded outer-rail/Threads-modal structure; final controls and overflow remain checked.
- Private history return: failed receipt `2026-11-06T20-27-32.451Z` records a 1440×700 reader changing from 189.453125px to 153.15625px because the truthful restored-snapshot banner occupies 36.296875px. Both inner scroll values remain 650 and the same first paragraph stays at the same relative offset; only the last clipped paragraph disappears. The adapted assertion requires the nonempty visible list to be the exact prefix of the previous list and preserves full-list equality whenever the visible height has not shrunk. The existing independent first-paragraph identity/one-pixel-offset assertion remains.
- Private latest-follow setup: the same failed receipt shows a viewport change immediately followed by direct test scrolling before the application's docking/restoration frame. The follow scenario now uses the existing two-frame position observer before setting up the bottom position. The unchanged final assertions still require the real reader to be at its bottom, the new arrival to have visible pixels, and at least one complete text line to fit. This is setup synchronization, not a relaxed follow result.

Failed receipts remain preserved. No unit seam, production timing delay or substitute workspace logic was added.

Additional old expectations exposed by the expanded caller batch:

- Private-writing narrow setup now uses the existing Threads control if its deliberate Load private conversation action is hidden behind the #82 list presentation. The real load, recipient, source and request assertions remain.
- `UX58.direct` measures editor overflow after two viewport frames. The failed result observed width 0 / scrollWidth 94 immediately after rapid docking transitions; after settling, the original width and 44px control assertions pass for all source/visual profiles. No tolerance changed.
- `J5.appearance-writing` uses the established 14px code role from the design reference and existing production cascade (the old 18px expectation predated the visual-fidelity correction). It verifies Compact's smaller spacing on an ordinary form-input label. The source-editor label has its own later 4px composer role at default size and an 8px Compact override, so it was not an ordinary 12px→8px form-label sample. Exact source/selection/node identity, four themes/languages/text scales and minimum 44px targets remain checked. This slice changes neither typography nor spacing behavior.

## Evidence and acceptance disposition

The frozen final userscript SHA-256 is `ab93bdea4508955af11c254a2e46b00f423f68d9adfd8dc80525a802a2726ce3`. The preceding `f2b3891b...` candidate differs only by the drawer normal-word-break reset. Build, TypeScript, ESLint, Prettier and `git diff --check` pass. The library/client contract is unchanged, so the conditional external-consumer rerun does not apply.

Complete-application Edge records on the final candidate:

| Run under `evidence/runs/` | Result and purpose                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-06T20-26-49.622Z` | 8/8: new ticket scenarios plus native word-break regression.                                                                                                     |
| `2026-11-06T20-27-32.451Z` | 111/120: expanded Settings callers, including actual public refresh modal pause/resume; nine failures retained and explained in the adaptation audit.            |
| `2026-11-06T20-36-48.825Z` | 29/30: corrected callers, full rich attachment workflows and direct source/visual editor profiles; remaining obsolete form-spacing sample retained as a failure. |
| `2026-11-06T20-38-17.782Z` | 3/3: ordinary form Compact-spacing sample and both remaining rich draft lifecycle callers.                                                                       |
| `2026-11-06T20-38-38.434Z` | 113/113: complete affected layout, appearance, navigation, viewport, native keyboard and new ticket suite.                                                       |
| `2026-11-06T20-40-32.573Z` | 1/1: actual private-conversation refresh pause for 121 seconds in Settings, then a fresh full 120-second interval after closing.                                 |

The five broader runs cover 244 distinct named scenarios, each with its latest outcome passed. Earlier failed runs remain distinct evidence; no failed receipt is presented as a passing run. Each listed package's exact manifest, byte sizes and SHA-256 values were independently verified with `node scripts/verify-evidence.mjs <run-directory>`.

Installed Edge qualification is recorded in the integration checkout's `evidence/runs/83-installed-edge-2026-11-07` and `83-installed-edge-corrected-2026-11-07`. The first preserves exact source identity for `f2b3891b...`, single matching script, footer geometry/scroll,150% text, Settings/About focus and dismissal, both resize directions, exact unsent source/target/selection and actual visible native reading text. The corrected package reads back and reloads the exact final `ab93bdea...` source, then repeats the affected enlarged drawer word wrapping, final-item reachability,44px Settings, one-modal About and Escape/focus/scroll path. Earlier unaffected results retain their original identity. Edge 156.0.4314.58 and Tampermonkey BETA 5.6.6242 were used; Beta and stable are equivalent under the owner's instruction. Chrome remains deferred to #93, not recorded as passed. No live social write occurred.

Acceptance against ticket #83:

- [x] Independently scrolling navigation with a fixed account/Settings footer and reachable final item: `UI83.footer`, safe-area tests and installed geometry.
- [x] Fresh member, guest, unknown and restored labels, long identity and enlarged text: all three `UI83.account-*`, `UI83.footer`, installed restored→fresh read.
- [x] Sole Settings trigger and inline About with one active modal: `UI83.dialog`, localized Settings/About journeys and installed checks.
- [x] Collapsed/drawer access, focus trapping, Escape/outside dismissal, focus return and preferences: `UI83.dialog`, `UI83.dismissal`, appearance/native-keyboard suites and installed reciprocal resize.
- [x] Geometry/short-window/uncertain-state coverage and retained reading/writing: new ticket E2Es, private/public reading cases, exact source/selection/history journeys and installed unsent source/reader observations.
- [x] Existing architecture and production guarantees retained: source diff confines executable change to layout, Settings dialog and CSS; application regressions exercise recovery, immutable reviews, exact sources, guarded navigation and effects through the real workspace.
- [x] Failure enumeration and named full-application expectations preceded feature code; reports/receipts/source/build identity/manifests and relevant artifacts are retained. No unit tests were added.
- [x] Static/build and affected installed Edge pass; final designated gpt-6.1-sol/xhigh advisor validation using `validate-gpt-code-review` approved all eight criteria on the exact `ab93bdea...` candidate, with no blockers or distinct additional trade-offs. Chrome is deliberately deferred; no portable contract changed.

Replay the exact 244-scenario union from those retained receipts after building the candidate. This includes both real-clock refresh intervals and takes several minutes:

```sh
python3 - <<'PYREPLAY'
import json, pathlib, re, subprocess
runs = [
    "2026-11-06T20-27-32.451Z",
    "2026-11-06T20-36-48.825Z",
    "2026-11-06T20-38-17.782Z",
    "2026-11-06T20-38-38.434Z",
    "2026-11-06T20-40-32.573Z",
]
names = set()
for run in runs:
    receipt = json.loads((pathlib.Path("evidence/runs") / run / "receipt.json").read_text())
    names.update(case["name"] for case in receipt["cases"])
pattern = "|".join(re.escape(name) for name in sorted(names))
subprocess.run(["npm", "run", "test:e2e", "--", "--grep", pattern], check=True)
PYREPLAY
```

The final advisor approved all eight criteria on 2026-11-07 after checking the implementation, installed qualification and application evidence. No additional implementation change or distinct trade-off was requested. The integration branch remained at `1e5728674282be55bfa37dd9307b74e5314faec2` and was already merged into this ticket branch. All 18 retained run packages and build artifacts were copied to the integration checkout before worktree cleanup.
