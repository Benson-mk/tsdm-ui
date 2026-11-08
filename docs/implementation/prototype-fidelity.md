# Sidebar prototype fidelity correction

Task: the owner's 2026-11-08 report that completed #81 still does not look like
`src/layouts/sidebar-feedback.prototype.html`.

Before production edits, compare the exact accepted userscript with the prototype
at the same viewport. The existing DESIGN.chrome and DESIGN.composer cases pass
on accepted executable `211e851f`, despite visible differences. They reference the
older forum sample and do not establish fidelity to this sidebar prototype.

## Failure inventory and approach

- Header controls stay beside the wordmark rather than at the trailing edge; the
  mark and header are smaller than the prototype.
- Directory/list gutters, heading typography, card radius and padding retain older
  recipes; category labels and reader context acquire oversized pill geometry.
- The account footer renders identity as one muted sentence rather than a small
  status line above the member name. Any correction must preserve fresh, unknown,
  guest and restored account truthfulness and localization.
- Compact writing has text-heavy presentation controls and extra vertical chrome;
  its author/destination, input and Review must remain visible without hiding
  exceptional recovery, account, conflict or uncertain-write information.
- Appearance changes can break narrow/short layouts, theme contrast, focus,
  retained selection or the existing wide-writer fit rules.
- The prototype imports production CSS. Comparing against an evolving reference
  could make both sides regress together. Preserve its initial CSS, source,
  rendered measurements and screenshots before editing production styles.

Use the existing complete-application browser seam with external HTTP fixtures.
Record failing reference expectations first, then repair the presentation owners.
Preserve actual forum content, capabilities and workflow guarantees; the prototype
does not authorize synthetic page totals, accounts or simulated publication.

## Implementation and evidence

The correction uses the existing workspace, writing and palette owners. Header
height/mark are 60/44px, controls align at the trailing 16px inset, list gutters
are 24px, the board heading is 30px and board cards use 24px corners with 20px
padding. Directory Refresh now belongs to its heading. Category context uses one
compact surface, and the account status sits above the existing authoritative
member name. Composer presentation actions use named SVG buttons, the public
writing destination stays outside the scrolling editor content, and Review sits
at the trailing edge. Compact writing reserves the prototype's measured 324px.

The prototype source is unchanged. Its original CSS was frozen because the HTML
imports production CSS; the repeatable capture intercepts that import with the
frozen bytes. The baseline package is
`evidence/runs/prototype-comparison-baseline-2026-11-08/`. The initial corrected
executable is preserved as candidate 8e5b in
`evidence/runs/prototype-fidelity-candidate-2026-11-08/`. The final correction after
advisor review is candidate 7919:
`7919a72afef66b52424f7806b6b04065b818a87779fcdc74d06b9622875e2c0a`,
preserved in `evidence/runs/prototype-fidelity-final-2026-11-08/`.

The named PROTOTYPE expectations were authored before production edits. Preserve
these separate run identities; overlapping runs are not additional outcomes:

| Run under `evidence/runs/` | Result and scope                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-07T16-18-28.601Z` | The two older DESIGN cases pass on accepted211 despite the mismatch.                                                                                                               |
| `2026-11-07T16-21-18.872Z` | Three initial failures; the directory case also contained a wrong results-pane locator.                                                                                            |
| `2026-11-07T16-22-28.675Z` | Corrected directory locator exposes the intended geometry failures.                                                                                                                |
| `2026-11-07T16-25-41.642Z` | One failure/four passes on accepted211: compact target visibility and action alignment fail.                                                                                       |
| `2026-11-07T16-27-10.948Z` | Seven focused passes on intermediate5a45; visual inspection then catches missing assistive-only styling.                                                                           |
| `2026-11-07T16-27-54.543Z` | An overly broad run was interrupted during an unchanged timer case. Three passes/one interrupted; source changed during interruption, so this run supplies no acceptance evidence. |
| `2026-11-07T16-29-12.873Z` | 168 passes/six failures on intermediate35a8: three category-fill checks, two old header inset expectations, one old compact-height limit.                                          |
| `2026-11-07T16-33-33.450Z` | Candidate8e5b: 72/72 affected cases pass, including all seven PROTOTYPE cases and the repaired six failures.                                                                       |

The candidate 8e5b run covers the reference geometry, narrow/light, enlarged/dark,
mid-width/Alias and wide/Mono presentation, palette retention, safe edges,
reader heading/anchor/menu behavior, and wide/short writing. The 174-case
intermediate run separately verifies public/private writing, footer account
truthfulness, resizing and related outcomes. Its production source differs from
candidate 8e5b only in `src/styles.css`; its results retain intermediate scope and
are not claimed as a final full-suite pass. The later footer correction and its
fresh verification are recorded below.

Visual inspection covers candidate 8e5b's directory, reading, compact and expanded
screenshots, plus candidate 7919's locale, geometry and installed captures.
Actual forum metadata, post actions, recovery details and the source
editor differ from the synthetic sample intentionally. Browse-only keeps the
existing useful full-width directory required by #81. The synthetic directory
fixture contains one parsed board and does not claim content/pixel identity.
Reference and production screenshots carry their actual viewport sizes; compact
reference is 1440px and the wide-writer test is 1706px.

All 29 other portable outputs are byte-identical to accepted211. The portable
`index.js` differs only in 12 dependency region-path comments caused by the
checkout's relationship to node_modules; replacing that exact comment prefix
reconstructs the new bytes. No portable source/contract changed.

## Advisor correction and final verification

The required gpt-6.1-sol/xhigh advisor using `validate-gpt-code-review` confirmed
one P2 in candidate 8e5b. Splitting the Chinese snapshot sentence around a block
member name let the existing footer clamp hide the trailing snapshot qualifier
for an ordinary 11-character CJK name. The advisor reproduced it against
accepted 211 and candidate 8e5b; the independent screenshots, geometry and initial
changes-required verdict are sealed in
`evidence/runs/prototype-fidelity-advisor-2026-11-08/`.

Six complete-application visible-qualifier expectations were added before repair.
The first continuation (`2026-11-07T16-46-10.453Z`) had a reload-before-response
fixture race; it is not defect evidence. The corrected continuation
(`2026-11-07T16-47-09.221Z`) reproduces the two Chinese clipping failures, with
four passes. The repair gives snapshot/signed-in status their own localized
labels and clamps only the member name. The full existing sentence and name
remain in the title; account observation authority is unchanged.

Final 7919 passes **33/33** at `2026-11-07T16-49-01.966Z`: all thirteen PROTOTYPE
cases (including the six new locale/viewport cases), navigation/footer/drawer
coverage and account-observation/warning checks. These overlap earlier runs and
are not a full-suite claim. Only the footer presentation, its six translated
status entries, CSS name clamp and focused expectations differ from candidate 8e5b.
Typecheck, changed-source lint/format, build and whitespace checks pass on 7919.
The prior 72-case geometry/palette/safe-edge/writing evidence retains its 8e5b scope;
the final thirteen PROTOTYPE cases freshly confirm core fidelity and writing geometry.

The owner explicitly authorized both Tampermonkey connections and replacement of
TSDM UI after automatic approval review requested specific consent. Both installed
complete source readbacks match final 7919 exactly (2,147,408 UTF-16 units), including
the final newline. Each manager lists one matching script and each reloaded page
has one workspace. The private package is
`evidence/runs/prototype-fidelity-installed-2026-11-08/`.

Edge and Chrome show the 60px header, 44px mark, trailing controls, status/name
footer and named 44px writer controls. Settings opens and Escape closes it.
Reload preserves the original empty source and selection, author/destination and
native continuation. Expand/compact/minimize/resume preserve that context; a
settled board check changes passive Snapshot wording to a confirmed member while
retaining the content-only restoration warning. No forum write was submitted.
English Light 100 preferences were retained; Chinese long-name states are covered
by complete-application fixtures, not asserted as installed account transitions.

Chrome's actual 1179×584 window needs 25.5px of conversation scrolling to fully
show Review with its retained long-title/content state. Keyboard focus reveals
the complete 44px control within the viewport; this is documented short-window
scrolling, not an always-visible control claim. Edge uses 1520×740. No viewport or
DOM overrides were applied. The initial Edge 00 capture used the wrong shadow-root
lookup and has no measurement authority; Edge 01 is the corrected baseline.

The designated advisor accepted final 7919 for this affected visual correction.
Independent replay of the original zh-CN and zh-TW scenario confirms the complete
snapshot status remains visible before the bounded name; the original P2 is
resolved. The advisor also inspected the final narrow/desktop locale and installed
screenshots, verified the candidate/run/installed manifests, and confirmed all
four acceptance criteria with no new finding or additional distinct trade-off.
The sealed supplement is
`evidence/runs/prototype-fidelity-advisor-final7919-2026-11-08/`; its verifier passes
all 12 files and the recorded localized-status geometry. The final candidate
archive deliberately retains its pre-review ledger; this acceptance-only ledger
update changes no executable or test input. Earlier packages retain their original
failed/intermediate scope; no historical pass is relabeled as 7919.

## Distinct trade-offs

1. Matching the prototype's 324px compact writer and pinning its destination uses
   44px more than the old writer. The existing short-height caps/history reserve
   remain; editor details can require scrolling.
2. Expand/compact/minimize now use icons to match the reference and reclaim space.
   Their visible text is replaced by accessible names and tooltips, so discovery
   depends more on recognizing the icons or focusing/hovering them.
3. Compact context removes repeated visible action/account-ID/thread-ID detail
   where the caption or parent already supplies it. Assistive text and full Review
   retain the information, at the cost of different visible and accessible density.
4. Production keeps truthful account/recovery states, real metadata/post actions,
   the chosen editor and useful browse-only behavior. This preserves the existing
   contract but deliberately differs from the prototype's simplified sample.
5. Reference measurements plus inspected screenshots avoid brittle pixel failures
   from fonts, variable content and browser rendering. They detect the identified
   presentation regressions, but do not establish universal pixel equivalence or
   replace owner visual approval.
6. Category child labels retain their exact theme fill within matching parent
   context surfaces. This keeps established role/contrast guarantees while leaving
   visually redundant nested color application in the markup/style rules.
7. The footer now has explicit translated status labels instead of splitting a
   translated sentence. This adds six translation entries and limits the visible
   name to two lines so its status remains visible; the complete name/sentence is
   retained in the title.

## Acceptance

- [x] Match the reference's header alignment/mark, sidebar rhythm, directory/list
      hierarchy and supporting surface geometry in comparable states.
- [x] Present truthful footer identity and a concise composer while preserving
      warning visibility, editor identity, target, content and review behavior.
- [x] Verify affected narrow/wide, theme and functional journeys, including the
      required affected installed checks, with repeatable comparison artifacts.
- [x] Complete the designated advisor review and report each actual trade-off.
