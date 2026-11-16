# Thread pane soft boundaries and icon controls

Owner follow-up after #112: use documented shadows and whitespace instead of
decorative thread-pane borders, retain explicit selection and input/keyboard
boundaries, and replace Board filters, Page and Pinned threads wording with icons.

## Plan and failure inventory

The affected surface is the Threads list containing those three controls.
Existing #91 documents 6% pane/floating shadows, flat content, and functional
Dark/forced-color boundaries. #96 preserves flat rows and explicit selection.
Reuse those rules: remove the row separator, retain the pane shadow, and group
the controls into an icon/count strip. Page remains informational, not a new
navigation action. Localized accessible names and native tooltips retain meaning.

Before implementation, cover these failure modes through complete-app Edge E2Es:

- Decorative row lines remain, or raised cards replace the approved flat list.
- Icons lose labels, current page/counts, disclosure state or keyboard operation.
- Narrow/enlarged text clips the strip or shrinks actionable targets below 44px.
- Border removal erases selected-row contrast or keyboard focus.
- Dark/forced-color region boundaries disappear.
- Opening/closing filters or pins changes the selected thread or performs a write.

Reuse the existing filter-dialog/source-preservation journeys for input/draft
continuity. No storage, permission, source editing or portable-client change is
needed. This is a reversible layout follow-up, not a new architecture decision.

## Acceptance

- [x] Flat thread rows use whitespace; pane uses the documented shadow.
- [x] Filter/page/pin icons retain counts, localized names and existing behavior.
- [x] Selection, field borders and keyboard focus remain explicit.
- [x] Desktop, narrow/enlarged, Dark and forced-color Edge checks pass with artifacts.

## Distinct trade-offs

1. Flat rows separated by whitespace have less sharply delineated edges; the
   existing inverse selected row and pane shadow retain hierarchy. The 8px gap
   adds vertical list length.
2. Icon/count controls save space but require icon recognition or tooltip discovery;
   full localized accessible names remain available, and page stays noninteractive.

## Verification and delivery

Final userscript SHA-256:
`19ab1a509fa3378d9d0694335a167699c05b5c0193133843212de5b4627ef7df`.

- Failure-first Edge reproduction: `2026-11-16T07-51-56.742Z` observes the old
  text-heavy control. The earlier launch failure was sandbox setup, not a UI failure.
- `2026-11-16T07-54-17.145Z`: all16 board-control cases pass, including the four
  new desktop,390px/130%-text,Dark and forced-color cases and existing125%-text
  draft/filter/focus preservation journeys.
- `2026-11-16T07-55-28.782Z`: six of seven additional selection/scroll regressions
  pass. The clipped-row setup assumed adjoining rows and placed the next row8px
  too low after spacing changed. It now positions that next row directly at20px,
  still requiring a partially visible preceding row and exact return offsets.
  The corrected case passes at `2026-11-16T07-57-43.353Z`.
- Initial new-test setup failures (unsupported125 slider step and checking keys
  before thread navigation completed) remain in `2026-11-16T07-53-01.264Z`.
  Supported130% input and awaiting the rendered thread correct the setup.
- Typecheck, scoped ESLint/Prettier, build and whitespace checks pass. The source
  diff leaves input borders and existing selected/focused-state rules unchanged.
- Installed Edge was updated through Tampermonkey MCP; all2,454,658 source
  characters matched readback after excluding the tool's appended timestamp.
  A dedicated real-board tab visibly showed filter/page/pin icons and counts,
  flat separated rows and the documented pane shadow. Enter opened filters;
  Escape returned focus to the icon. Enter expanded/collapsed pins with visible
  focus. The check tab was closed; original user tabs were not reloaded or edited.

The23 distinct affected cases all have passing evidence. This is a targeted Edge
qualification; Chrome was not rerun for this follow-up. No forum reply or other
publication was performed. Screenshots, request ledgers and hashed receipts are
retained under the listed evidence/run directories. Final documentation and an
algebraically equivalent fixture expression cleanup followed the last test;
production bytes remain the tested and installed candidate.
