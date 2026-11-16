# Board filter approval MVP — 2026-11-08

Branch: `feat/improve-ui-ux`. Status: suggestion awaiting owner feedback.
Capture feedback here; publish GitHub tickets later when requested.

## Request and observation

The owner asked to collect UI/UX feedback on this branch, preview changes in small
MVP units, and explicitly selected “Suggest one small improvement from the current
page.” No design selection has been made yet.

The observed Boards overview has a filter label, full-width input, matching hint
and result count on four successive rows. The first group starts substantially
below the page heading. `WorkspaceLayout.vue` already filters loaded board names,
descriptions and group titles locally, trims/case-folds the query, hides empty
groups, and returns focus to the field when Clear is pressed.

Question: does a compact filter block make the boards easier to reach while
keeping the filter's scope and match count clear?

## Plan and failure inventory, before implementation

Use a separate, explicitly named HTML prototype beside the existing layout
prototype. Show the current arrangement and one compact proposal with the same
synthetic boards, real workspace stylesheet and surrounding header/sidebar.
The user's one-unit request takes precedence over the prototype skill's default
three redesigns, and the requested feature branch takes precedence over its
throwaway-branch default. No irreversible architecture decision is required.

The proposal keeps a visible “Filter boards on this page” label, puts the count
alongside it where space allows, and shortens the hint to “Name, description or
group.” Preserve the field's 48px height and a labelled Clear action. Do not make
the whole block sticky or change cards, search semantics or navigation.

Check these failures before claiming the preview is ready:

1. A shortened label implies global forum search or hides the page-only scope.
2. Count, input or Clear clips at narrow width or enlarged text.
3. Filtering leaves empty groups or a no-match state with no clear way back.
4. Switching variants erases the query or changes what matches.
5. Clear loses keyboard focus or has less than a 44px target.
6. Synthetic content or stub navigation is mistaken for live forum integration.
7. Scope/count/helper compression saves no useful vertical space or obscures focus.

Only the preview and this feedback record change. Validate the completed preview
in the browser and then request the designated gpt-6.1-sol/xhigh advisor's critical
evaluation using `validate-gpt-code-review`. Owner approval remains separate.

## Feedback log

- Owner: work on `feat/improve-ui-ux`, collect feedback for later tickets, show
  small MVP units for approval.
- Owner: suggest one small improvement from the current page.
- Agent suggestion: compact the existing Boards filter block. Pending approval.

## Actual trade-offs

1. Moving the count beside the label and shortening the helper reduces vertical
   space at the cost of denser controls and a less explanatory sentence. The
   page-only label stays visible; narrow layouts may wrap and save less space.
2. A separate synthetic preview using shared CSS is quick to compare and cannot
   mutate forum state, but it does not qualify production Vue integration,
   translations, installed userscripts or real account/navigation behavior.
3. Reusing the production stylesheet keeps the preview visually relevant, but
   future CSS changes can move the baseline. Preserve source hashes and screenshots
   for this comparison; no frozen duplicate stylesheet is added to production.

## Acceptance for preview delivery

- [x] Provide a runnable current/proposed comparison with matching sample content.
- [x] Verify filtering, no matches, Clear/focus and query retention across variants.
- [x] Inspect desktop and narrow/enlarged layouts and retain repeatable evidence.
- [x] Complete advisor validation and record distinct trade-offs.

These are preview-delivery criteria, not owner design approval or production
acceptance.

## Run and compare

Run `npm run dev -- --port 5173`, then open
`http://127.0.0.1:5173/src/layouts/board-filter.prototype.html?variant=compact`.
Use Current / Proposed in the preview footer to compare the same sample content.
The direct current link ends in `?variant=current`. Filtering and text size remain
in memory; only the selected comparison is reflected in the URL. The preview is
not imported by the production entry point or included in its Vite build input.

Repeat these browser checks:

1. Compare the unfiltered first group in Current and Proposed at 1280×720.
2. Enter `  音乐  `: 1/10 entries in one group. Switch variants: the query and
   results remain. Enter `后花园`: 4/10 entries; enter `旋律`: 1/10 entries.
3. Enter `no-such-board`: 0/10, no empty group headings, an explicit no-match
   explanation and Clear filter. Clear restores 10/10 and focuses the field.
4. At 390×844, compare both variants; enable 125% text and enter `音乐`. Check
   that the label/count wrap, input and Clear remain in bounds, and focus is
   visible. Tab from the input to Clear; Enter restores all entries and input focus.
5. Restore 100% text, Proposed, an empty query and the normal viewport.

At 1280×720, the first group moves from y=377.28125 to y=332.8984375:
**44.38px reclaimed**. At 390×844 and 100% text it moves from y=369.28125 to
y=349.1953125: **20.09px reclaimed**. The input remains 48px at 100%; at narrow
125% it grows to 50.625px and Clear is 48.625px. No document or overview horizontal
overflow was observed. Name/group/description matches, whitespace trimming,
no-match recovery, variant retention and keyboard Clear/focus all behaved as
expected. Captured browser warnings/errors were empty.

Evidence: `evidence/runs/board-filter-preview-2026-11-08/` (Git-ignored) contains
the screenshots, observations, console capture, source snapshots, report and
SHA-256 manifest. Run `npm run evidence:verify --` followed by that directory to
verify exact package coverage and hashes. These are manual browser observations
of a synthetic preview; no unit tests or production E2E tests were added.

Prettier, extracted JavaScript module syntax and whitespace checks pass. The
preview ran with available Node 26.0.0, npm 11.12.1 and Vite 8.3.4, not the pinned
production toolchain. No production build or installed-browser qualification is
claimed. The development server required ordinary local-listener sandbox
escalation, which was granted. Owner design approval and ticket publication are
pending.

## Advisor validation

The designated gpt-6.1-sol advisor at xhigh reasoning applied
`validate-gpt-code-review` after the preview and browser inspection were complete.
It independently checked production matching semantics, preview isolation,
all five screenshots, all 13 observation records and the evidence manifest.
Verdict: pass for a throwaway approval preview, with no evidence-backed blocker,
egregious technical decision or additional distinct trade-off. It confirmed the
reported space savings and bounded usability claims. This is a source/evidence
review, not an independent browser replay or owner visual approval.
