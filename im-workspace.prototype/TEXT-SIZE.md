# Text size and automatic Compact spacing — issue #6

The human confirmed this follow-up to **Define the modern IM forum workspace** on 2026-10-18 (Asia/Hong_Kong). The selected A workspace now uses one Text size slider instead of the former post-only density selector. This is a synthetic interaction prototype; it does not implement production forum behavior.

## Delivered behavior

- Settings offers 70%–150% in 10-point steps, initially 100%, with a percentage, derived spacing description and Reset to 100%.
- Input previews and saves immediately, including while a pointer drag is still held. All interface and reading text scales from its existing role baseline. At 90%, post text is 16.2px at the standard browser baseline; its weight remains 320.
- 70%–90% automatically uses Compact throughout navigation, board choices, result lists, headers, panels, posts and the composer. 100%–150% uses Default spacing. There is no second preference.
- Compact rows use 12px vertical / 16px horizontal padding, or 12px on both axes below the prototype's 960px narrow breakpoint. They shed the old 118px minimum. Posts use 16px padding and 0.75em paragraph gaps. Other workspace whitespace follows the documented smaller spacing steps.
- Pane widths, destinations, icons and media remain stable. Text and rows grow as required; controls retain 44px target minima and inputs 48px height minima. Narrow navigation can scroll horizontally to keep labels intact at enlarged sizes.
- The current writing node, text, selection, target, disclosure state, history and visible reading block survive size changes. Settings restores focus to its invoking control on close.
- Only text size persists in this prototype, under the isolated `tsdm-im-workspace.prototype.text-size` browser key. Invalid saved values fall back to 100%; unavailable storage retains a usable session value with an explanation. Reload still discards writing, theme and language.

The root [DESIGN.md](../DESIGN.md) describes the corresponding production preference contract and automatic spacing rules. It retains the existing theme/language persistence requirement; the prototype's narrower persistence scope is explicit. The supplied design file was previously untracked. [design-input.json](evidence/design-input.json) records its input hash, and [design-change.patch](evidence/design-change.patch) isolates this task's changes from that source. The primary checkout's copy has the same final bytes as the version captured on this prototype branch.

## Acceptance and verification

The failure inventory and executable browser expectations were written before implementation. [The baseline receipt](evidence/text-size-before/report.json) fails because the range control does not exist. [The first complete run](evidence/text-size-first/report.json) found three probe mistakes: expecting focus on the editor instead of the Settings invoker, selecting a hidden duplicate browse control, and shadowing the `size` helper with a local variable. Those were corrected without weakening the intended product behavior. A visual inspection also prompted nonshrinking narrow navigation labels; spacing was then aligned with the specification. A final explicit-font audit found the Study notes code block still fixed at 12px. [Its focused failing browser receipt](evidence/text-size-notes-before.json) records that gap; the block now uses relative type and is included in the final role-scaling probe.

[The final browser receipt](evidence/text-size-final/report.json) contains the exact runtime-source hashes and these checks:

- [x] Exact slider range, step, baseline, label, percentage, automatic mode and reset; no density selector remains.
- [x] Pointer input previews and saves before release; keyboard input reaches every one of the nine steps without switching variants.
- [x] Navigation, board choices, list titles, thread headings, post text, metadata, code, composition and dialog text scale exactly once; pane tracks and icon sizes remain stable.
- [x] The automatic 90%/100% boundary, row/post padding and removal of the compact row minimum match the confirmed proposal.
- [x] Writing, caret range, editor/post/list identity, open spoiler, writing target, history and reading anchor survive changes among 70%, 90%, 100% and 150%.
- [x] Save/reload, reset/reload, history independence, malformed storage and blocked-storage fallback behave as specified.
- [x] All 208 combinations of 13 widths, four themes and 70%/90%/100%/150% preserve control minima, local scrolling and available reader space. The widths include both sides of the 768px, 960px and 1280px transitions, plus the design's additional width checks.
- [x] Traditional Chinese, Simplified Chinese and English labels, the medium picker and narrow result list retain the preference and spacing.
- [x] A 125% user stylesheet baseline composes with 150% application size to produce 33.75px post text. Relative font units and the absence of zoom suppression were also inspected.
- [x] Screenshots were captured; the browser observed no script errors or external requests. B/C receive bounded preference/overflow smoke checks at desktop and narrow widths because the rendering styles are shared.
- [x] JavaScript syntax, whitespace checks, the pinned design linter and both token exports pass. [design-validation.json](evidence/design-validation.json) records token completeness and line-height observations.

Evidence is from headless Chromium 151.0.7922.34 on macOS with Playwright 1.64.1. It is local synthetic evidence, not installed Tampermonkey, live forum, OS text accessibility, browser-chrome zoom, or comprehensive B/C qualification. The user stylesheet test checks scale composition rather than claiming a browser-settings UI test. Screenshot inspection covers desktop and narrow Default/Compact states. Earlier 2026-10-16 evidence remains tied to its original source; it is not relabeled as a test of this revision.

## Replay

From `im-workspace.prototype`, start `python3 serve.py`, then open `http://127.0.0.1:4176/im-workspace.prototype.html?variant=A`. Use Appearance → Text size. Reset returns to 100% and clears the effect of prior size experiments.

The browser probe is `evidence/text-size.e2e.mjs`. Install its standalone test tool outside the repository, then run:

```sh
npm install --prefix /tmp/tsdm-prototype-browser playwright@1.64.1
node /tmp/tsdm-prototype-browser/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_MODULE=/tmp/tsdm-prototype-browser/node_modules/playwright/index.mjs node evidence/text-size.e2e.mjs text-size-replay
```

`BASE_URL` overrides the local page URL; `CHROMIUM_PATH` can select an existing browser executable, including the recorded Chromium revision for an exact-browser replay. Each run writes its browser version, results, source hashes and screenshots to the named evidence directory. A fresh isolated browser context supplies the initial 100% baseline. No live forum credentials or data are needed. The suite exits nonzero on a failed expectation.

Run `node --check prototype.js`, `node --check evidence/text-size.e2e.mjs` and `git diff --check` for static checks. The specification uses `@google/design.md@0.4.0`: run `designmd lint ../DESIGN.md` and export `json-tailwind` and `dtcg`; the verification receipt records the expected counts and role line heights.

## Complete trade-off record for this follow-up

1. **Global proportional type** makes the preference consistent across reading and controls, but small settings also reduce navigation/metadata readability and large settings require more wrapping. Each role retains its baseline weight and hierarchy instead of reusing the old Compact font/weight override.
2. **Nine positions from 70% to 150%** match the client and are easy to revisit, but offer coarser adjustment than a continuous slider. Browser font preferences and zoom remain independent ways to enlarge further.
3. **Compact is derived below 100%** removes a second setting and recovers space automatically, but prevents choosing large text with Compact spacing or small text with Default spacing; crossing 90%/100% visibly changes spacing.
4. **Reduced workspace whitespace with target floors** shows more content while retaining complete labels and usable controls, but lowers visual separation and limits the density gain once 44px/48px minima apply. The editing area's useful minimum height is retained.
5. **Stable pane geometry and a 48em reading cap** preserve the chosen workspace and bounded line length, but changing text can change the width of the reading content inside its pane. Icons and illustrated text stay at their original visual size rather than following the text slider.
6. **Immediate preview and autosave** let the human judge real content without Apply, but cause live reflow and persist exploratory movements. Reset supplies a baseline recovery action; there is no Cancel/undo transaction for a preference drag.
7. **One isolated durable prototype key** makes reload behavior reviewable without adding an application preference service, but other demo state still disappears on reload and storage policy may force session-only behavior. Invalid values use a clear baseline instead of speculative migration from the old in-memory selector.
8. **In-place styling and visible-block anchoring** preserve nodes, writing and browsing context with little prototype machinery, but paragraph rewrapping and scroll bounds can change the exact line/pixel at the viewport edge. This is not a general production reader cache or editor-state guarantee.
9. **Relative typography with fixed layout/icon dimensions** composes with a browser font baseline, but requires converting explicit text sizes throughout the existing styles and keeping decorative glyph exceptions explicit. Geometry is governed by the existing responsive structure rather than scaled wholesale.
10. **A stable Settings outer inset and slider width** make pointer adjustment predictable at the threshold, but the preference dialog uses less Compact spacing than the browsing surfaces.
11. **Nonshrinking narrow navigation labels** avoid breaking short words into fragments at enlarged sizes, but can require horizontal scrolling to reach later destinations. Settings also remains directly reachable in the top bar.
12. **Shared preference styles across A/B/C** avoid contradictory controls and duplicated scaling logic, but change the archived comparison variants too. A receives the full matrix; B/C receive bounded smoke checks and keep their original historical evidence.
13. **An isolated continuation branch and imported design source** preserve the original prototype commit and unrelated primary-checkout files, but add the supplied, previously untracked DESIGN.md in full to this task's commit. The input hash and zero-context design patch make that import auditable without whitespace-only patch context; the full document supplies surrounding context; the primary copy is synchronized without staging the unrelated `.gitignore`.
14. **Static design tokens plus explicit runtime rules** keep the official exporter compatible and preserve all baseline tokens, but consumers must apply the documented scale/spacing layer rather than treating exported recipes as a complete preference implementation. The existing issue #6 workspace geometry is explicitly distinguished from older editorial page-layout guidance.
15. **Prewritten browser failures, source hashes and a bounded synthetic matrix** provide repeatable evidence without unit tests or forum side effects, but do not establish installed-host behavior, every browser/font configuration or production accessibility qualification. The existing browser executable was reused; its exact version is recorded rather than silently equated with the test package's bundled revision.

## Advisor review

The designated BDFL advisor reviewed the completed source, specification, acceptance evidence and this trade-off record using `validate-gpt-code-review`: **no material correction required; no additional distinct trade-offs**. They matched the final runtime hashes, verified the refreshed manifest and matching DESIGN copies, and checked the 11 scenario groups / 208 matrix observations. They inspected the recorded browser evidence rather than independently rerunning the complete suite. [The review record](evidence/text-size-advisor.md) preserves that disposition and boundary.
