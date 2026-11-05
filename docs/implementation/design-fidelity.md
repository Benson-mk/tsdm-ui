# Visual fidelity correction following #64 / #79

The owner's 2026-11-05 report is the task: reconcile the delivered workspace with
`tsdm-ui-experiment/DESIGN.md` and `docs/design/sample.html`. The completed feature
acceptance does not by itself establish visual fidelity.

Before implementation, compare the built application with the reference at the
same viewport. The full userscript runs with only external HTTP substituted.
Reachable failures to lock down first:

- Legacy button fills, oversized supporting typography and wide navigation gaps
  overpower the reference's quiet, compact frame.
- Square list selection and a stacked post header lose the specified list and
  author hierarchy even when the three pane widths are correct.
- The composer always reserves 46% of the viewport and buries its review action
  under recovery and advanced authoring content instead of exposing a small reply.
- Fixing density accidentally changes Text size, theme geometry, post completeness,
  narrow navigation, editor identity, source/selection or deliberate review.

Plan: use existing presentation boundaries and shared tokens; retain actual forum
content, qualified capabilities, page-session recovery and prepared review. Compare
screenshots and measured roles, then run affected complete-application journeys.
No framework, client contract or reference-file changes are required. The required
BDFL advisor evaluates the finished correction after verification.

Acceptance for this correction:

- [x] Workspace chrome, list selection and post identity follow the reference roles.
- [x] Compact reply shows source and review together; expanded tools retain one editor.
- [x] Themes, responsive layout, Text size and affected consequential workflows pass the scoped checks below.
- [x] Repeatable before/after screenshots, measured geometry and receipts are retained.
- [x] Completed correction and actual trade-offs receive the designated advisor review.

The baseline loop is `node node_modules/@playwright/test/cli.js test
 tests/e2e/design-fidelity.spec.ts --grep 'DESIGN.chrome|DESIGN.composer'`.
The corrected fixture run `2026-11-05T04-40-48.281Z` fails both cases:
32px rather than 24px brand, gray utility pills, 18px rather than 12px navigation
taxonomy, square selection, missing context/identity elements, and a 414px compact
composer whose Review publication action is outside its visible viewport.
The prior run retains the reference and application screenshots side by side.

Ranked explanations and checks before repair:

1. Legacy component recipes remain underneath the new three-column geometry.
   Computed styles should expose old size/fill/spacing values in both live roles
   and the source cascade. This is confirmed by the measured roles and CSS.
2. The compact writer still shares expanded height and action placement.
   Its measured height should remain 46% and review should scroll offscreen. Both
   are confirmed by the complete-application baseline.
3. The apparent difference comes only from fixture content or fonts. Equivalent
   roles would then match despite different text; the measured role mismatches
   reject that as the primary explanation. Real content will still differ.

Selected repair keeps existing workflow owners. Utility actions become quiet;
identity and context use the reference hierarchy; the composer keeps its review
control outside the scrolling tool area. Inactive reply entry stays an explicit
button, because preparing the actual current form must remain deliberate.

## Delivered correction

The shared three-pane geometry was already present, but legacy component styling
and the expanded-sized compact writer overpowered the intended hierarchy. The
correction uses the reference's 24px brand, quiet utility controls, 12px navigation
taxonomy, rounded selected rows, context badges, initial avatars and aligned author
metadata. Public and private reading both have a deliberate reply dock. Compact
writing uses 280px plus the bottom safe-area reserve, subject to the existing
viewport cap, and keeps its review action outside the scrolling tools. Expanded
writing retains the same editor and the existing form, review and recovery owners.

The reference fixture is an exact copy of the owner's `docs/design/sample.html`.
The design source files were not edited. Real forum content, available filters,
capability controls, recovery notices and final publication review remain visible
according to their existing contracts; the fictional sample's data and simulated
send behavior are not application requirements.

## Verification and retained evidence

The final candidate SHA-256 is
`ac856d99fee6ab08f679ee991ba0489447b68e58c624e91330a9dc014403aeff`.
Its source files match the final automated run's recorded input manifest.

- Failure-first comparison: `evidence/runs/2026-11-05T04-40-48.281Z/` retains the
  two failing original appearance/composer cases, measurements and screenshots.
- Final affected application run: `evidence/runs/2026-11-05T06-01-43.425Z/`
  passes **243/243** cases covering the reference comparison, four themes, Text
  size, navigation/drawers, reader hierarchy, compact/expanded writing, prepared
  review, private writing/history, public automatic history, safe areas and visual
  viewport changes. Its receipt maps each case to screenshots and measurements.
- The focused private regression run `2026-11-05T06-00-48.296Z` passes all four
  dock, anchor and scroll-owner cases before the consolidated run.
- `evidence/runs/design-installed-final-2026-11-05/` retains final installed
  Edge/Chrome captures, exact manager-source identity, geometry, verification
  logs and a file manifest. Each manager listed one TSDM script and its complete
  source readback exactly matched the emitted candidate. Chrome's candidate was
  stored at 06:01:30 UTC; Edge's was replaced at 06:10:25 UTC and reloaded before
  the final observations. Earlier Edge captures belong to the earlier candidate.
- Installed checks exercised public reading, deliberate reply preparation, local
  source entry, Compact/Expand text retention, visible review controls and return
  to reading. Chrome additionally exercised a 390px viewport, then reset it.
  Live test text was cleared. No forum send was performed. Private presentation
  and consequential workflow variants use the populated application E2Es; this
  correction does not claim a fresh complete release qualification.
- Type checking, formatting, tracked-source lint and the userscript/library build
  pass. Lint excludes the pre-existing `.local/` dependency/runtime directory.
  The build retains Vite's existing future native-config-loader warning.

Replay the final affected selection after `npm run build`:

```sh
npx playwright test tests/e2e/design-fidelity.spec.ts tests/e2e/appearance.spec.ts tests/e2e/reader-hierarchy.spec.ts tests/e2e/three-region.spec.ts tests/e2e/progressive-drawers.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/prepared-review.spec.ts tests/e2e/private-writing.spec.ts tests/e2e/safe-area-edges.spec.ts tests/e2e/visual-viewport.spec.ts tests/e2e/automatic-history.spec.ts tests/e2e/private-history.spec.ts
node scripts/verify-evidence.mjs evidence/runs/2026-11-05T06-01-43.425Z
node scripts/verify-evidence.mjs evidence/runs/design-installed-final-2026-11-05
```

### Earlier broad-run failures remain failures

The earlier broad run was interrupted after 307 passes and 35 failures, with one
case interrupted and 1,214 not run. It is **not** a passing full-suite result.
The affected appearance/history regressions were corrected and are covered by the
final 243-case selection. Six advanced-editor cases and pending draft-save recovery
failed at the same assertions on both this correction and pristine `ed4cc34`.
Pristine also reproduces the localized download-navigation and inline-image
recovery failures. The hostile inline-image recovery family failed in the broad
run; it was not individually requalified here. The fixture's exact recovery-record
expectations are outside this presentation correction. Logs and available baseline
bundles are preserved without relabeling those cases as passed.

### Advisor disposition

The designated gpt-6.1-sol/xhigh BDFL advisor used `validate-gpt-code-review`.
The review confirmed and resolved a board link reduced below its 44px target,
a missing private reply dock, a private-history header-height change, and the
private writer's expanded default. Reserving the existing checkbox/timestamp slots
fixed the demonstrated anchor movement. A speculative shared restoration change
was reverted. A controlled same-runtime experiment established the remaining
private scroll-owner failure as initial-restoration test timing. The advisor
reported no remaining code blocker and accepted the final affected run; installed
source/evidence reconciliation subsequently completed as described above.

## Actual trade-offs

Each distinct choice is recorded once here, including the advisor's additional
costs. These belong to this correction, not the previous implementation ledger.

1. **Real workflow authority:** retain actual forum data, explicit form preparation
   and deliberate final review. This preserves operation guarantees but differs
   from the sample's fixed content and immediate simulated send.
2. **Compact height:** use 280px plus the bottom safe-area reserve within the
   existing viewport cap. This gives more room to reading; advanced tools still
   require scrolling or expansion, especially with large text or short windows.
3. **Shared presentation styles:** reuse public/private role selectors for a
   consistent interface and fewer recipes. Their visual behavior is coupled, so
   changes need both public and private regression coverage.
4. **Preserved editor node:** retain editor identity and reveal the source with
   `scrollIntoView` when focus is requested. This preserves source/selection state
   but can move the containing scroll region during explicit focus entry.
5. **Decorative glyphs and initials:** use Unicode navigation symbols and
   initial-based avatars without a new dependency or avatar requests. Shapes vary
   with available fonts and do not represent members' actual avatar photographs.
6. **Pinned reference fixture:** copy the reference exactly for independent replay.
   This duplicates the sample and requires an intentional refresh when it changes.
7. **Role measurements with screenshots:** assert geometry, control reachability
   and retained content while preserving visual artifacts. This tolerates platform
   font rasterization but cannot automatically detect every pixel-level difference.
8. **One-pixel anchor tolerance:** verify the visible content anchor within 1px
   instead of a half-pixel/raw-scroll offset assertion. This allows fractional
   layout rounding while accepting up to one pixel of displacement.
9. **Account status in navigation:** the quieter header matches the reference;
   inspecting the signed-in actor requires opening navigation when collapsed and
   may require scrolling.
10. **Visual editor ordering:** CSS places the editor above mode/formatting controls
    while retaining its node. Visual order consequently differs from DOM keyboard
    order.
11. **Repeated board label:** a small context badge and a separate accessible
    navigation target preserve both roles, at the cost of repeated text and a
    potentially wrapped toolbar item.
12. **Reserved private-history slots:** stable checkbox/timestamp space prevents
    availability changes from moving the reading anchor, leaving unused space
    while those details are unavailable.
13. **Settled deliberate-scroll test:** waiting two animation frames tests scrolling
    after initial restoration rather than immediate programmatic scrolling during
    restoration. Outcome assertions and production restoration behavior are unchanged.
