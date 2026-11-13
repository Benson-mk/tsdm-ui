# Approved UI/UX ticket publication — 2026-11-13

Published the approved 17-ticket breakdown under [#95 — Refine forum IM browsing, reading and reply composition](https://github.com/Benson-mk/tsdm-ui/issues/95).
All children are open, unassigned and labelled `ready-for-agent`; 18 native blocking
edges express the approved ordering. The owner's “approve” confirmed the numbered
proposal and its dependencies before publication. Work remains on `feat/improve-ui-ux`.

The invoked `/Users/benson/.agents/skills/to-tickets/SKILL.md` authorized publication
after approval. The parent body, title, labels and open state are preserved;
only the required child relationships were attached. No implementation, issue
closure or release publication is part of this task.

## Published tickets

| Proposal | Published ticket                                                                                                                       | Native blockers                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| T01      | [#96 — Keep thread browsing stable before and after selection](https://github.com/Benson-mk/tsdm-ui/issues/96)                         | None                                                   |
| T02      | [#97 — Show source-backed latest-reply details and destinations](https://github.com/Benson-mk/tsdm-ui/issues/97)                       | None                                                   |
| T03      | [#98 — Collapse board filters and pinned threads with clear heading hierarchy](https://github.com/Benson-mk/tsdm-ui/issues/98)         | None                                                   |
| T04      | [#99 — Keep board and reader checks quiet while preserving reading position](https://github.com/Benson-mk/tsdm-ui/issues/99)           | None                                                   |
| T05      | [#100 — Show the visible thread page and qualified total](https://github.com/Benson-mk/tsdm-ui/issues/100)                             | None                                                   |
| T06      | [#101 — Add accessible post menus and safe addressed-reply gestures](https://github.com/Benson-mk/tsdm-ui/issues/101)                  | None                                                   |
| T07      | [#102 — Rate a post through a qualified forum action](https://github.com/Benson-mk/tsdm-ui/issues/102)                                 | #101                                                   |
| T08      | [#103 — Report a post through a qualified forum action](https://github.com/Benson-mk/tsdm-ui/issues/103)                               | #101                                                   |
| T09      | [#104 — Copy exact post permalinks with truthful feedback](https://github.com/Benson-mk/tsdm-ui/issues/104)                            | None                                                   |
| T10      | [#105 — Fit the full reply editor into compact and expanded IM layouts](https://github.com/Benson-mk/tsdm-ui/issues/105)               | None                                                   |
| T11      | [#106 — Restore each thread's unfinished reply when switching](https://github.com/Benson-mk/tsdm-ui/issues/106)                        | None                                                   |
| T12      | [#107 — Recover local reply drafts after browser restart](https://github.com/Benson-mk/tsdm-ui/issues/107)                             | #106                                                   |
| T13      | [#108 — Share reply drafts across accounts and repair unavailable attachments](https://github.com/Benson-mk/tsdm-ui/issues/108)        | #107                                                   |
| T14      | [#109 — Let users choose between conflicting reply drafts](https://github.com/Benson-mk/tsdm-ui/issues/109)                            | #107                                                   |
| T15      | [#110 — Send ordinary replies explicitly with mode-aware keyboard shortcuts](https://github.com/Benson-mk/tsdm-ui/issues/110)          | #105                                                   |
| T16      | [#111 — Keep sending replies separate from newer writing and recover failures safely](https://github.com/Benson-mk/tsdm-ui/issues/111) | #109, #110                                             |
| T17      | [#112 — Qualify the integrated browsing-to-reply experience](https://github.com/Benson-mk/tsdm-ui/issues/112)                          | #96, #97, #98, #99, #100, #102, #103, #104, #108, #111 |

The initial unblocked frontier is [#96](https://github.com/Benson-mk/tsdm-ui/issues/96), [#97](https://github.com/Benson-mk/tsdm-ui/issues/97), [#98](https://github.com/Benson-mk/tsdm-ui/issues/98), [#99](https://github.com/Benson-mk/tsdm-ui/issues/99), [#100](https://github.com/Benson-mk/tsdm-ui/issues/100), [#101](https://github.com/Benson-mk/tsdm-ui/issues/101), [#104](https://github.com/Benson-mk/tsdm-ui/issues/104), [#105](https://github.com/Benson-mk/tsdm-ui/issues/105), [#106](https://github.com/Benson-mk/tsdm-ui/issues/106). The first ticket in approved order
is #96. Dependency-free status does not imply permission for concurrent agents or
that edits to shared components cannot conflict. Implement only tickets whose
native blockers are satisfied, and keep each ticket's own verification with it.

## Scope and dependency reconciliation

| Parent acceptance area | Feature ownership                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1                     | [#96](https://github.com/Benson-mk/tsdm-ui/issues/96)                                                                                                                     |
| B2                     | [#97](https://github.com/Benson-mk/tsdm-ui/issues/97)                                                                                                                     |
| B3                     | [#98](https://github.com/Benson-mk/tsdm-ui/issues/98)                                                                                                                     |
| B4                     | [#98](https://github.com/Benson-mk/tsdm-ui/issues/98)                                                                                                                     |
| B5                     | [#99](https://github.com/Benson-mk/tsdm-ui/issues/99)                                                                                                                     |
| R1                     | [#100](https://github.com/Benson-mk/tsdm-ui/issues/100)                                                                                                                   |
| R2                     | [#101](https://github.com/Benson-mk/tsdm-ui/issues/101), [#102](https://github.com/Benson-mk/tsdm-ui/issues/102), [#103](https://github.com/Benson-mk/tsdm-ui/issues/103) |
| R3                     | [#101](https://github.com/Benson-mk/tsdm-ui/issues/101)                                                                                                                   |
| R4                     | [#104](https://github.com/Benson-mk/tsdm-ui/issues/104)                                                                                                                   |
| C1                     | [#105](https://github.com/Benson-mk/tsdm-ui/issues/105)                                                                                                                   |
| C2                     | [#105](https://github.com/Benson-mk/tsdm-ui/issues/105)                                                                                                                   |
| C3                     | [#101](https://github.com/Benson-mk/tsdm-ui/issues/101), [#106](https://github.com/Benson-mk/tsdm-ui/issues/106)                                                          |
| C4                     | [#110](https://github.com/Benson-mk/tsdm-ui/issues/110)                                                                                                                   |
| C5                     | [#110](https://github.com/Benson-mk/tsdm-ui/issues/110)                                                                                                                   |
| C6                     | [#111](https://github.com/Benson-mk/tsdm-ui/issues/111)                                                                                                                   |
| C7                     | [#111](https://github.com/Benson-mk/tsdm-ui/issues/111)                                                                                                                   |
| C8                     | [#107](https://github.com/Benson-mk/tsdm-ui/issues/107), [#108](https://github.com/Benson-mk/tsdm-ui/issues/108)                                                          |
| C9                     | [#108](https://github.com/Benson-mk/tsdm-ui/issues/108)                                                                                                                   |
| C10                    | [#107](https://github.com/Benson-mk/tsdm-ui/issues/107), [#109](https://github.com/Benson-mk/tsdm-ui/issues/109)                                                          |
| Q1                     | [#105](https://github.com/Benson-mk/tsdm-ui/issues/105)                                                                                                                   |
| Q2                     | Every feature slice retains its own evidence                                                                                                                              |

#112 reconciles every parent criterion on the combined candidate, including final
visual review and installed-host qualification. It does not postpone each feature
ticket's E2Es. The [publication manifest](ui-ux-ticket-publication-2026-11-13.json) also maps all 60 user
stories and records all 21 acceptance areas.

Rating/reporting depend on the shared post-menu entry. Durable recovery extends
per-thread retained writing; account/attachment sharing and conflict choice extend
that contract independently. Explicit Send uses the new visual/source composer;
pending-reply recovery depends on explicit Send and recoverable concurrent draft
ownership. The final integration ticket blocks on the ten terminal feature slices,
with their earlier prerequisites included transitively. There are no redundant
transitive edges and no cycle.

The existing native filter/pin models, guarded publication, editor session and
page-session recovery provide starting points. No codebase-wide prefactoring
prerequisite was demonstrated. Necessary local prefactoring comes before its
functional change; a discovered wide incompatible change requires an explicit
expand–contract plan for the affected work. No production storage mechanism or
costly-to-reverse technical contract was selected during ticket publication.
The relevant tickets require the advisor evaluation and ADR reconciliation before
those implementation decisions.

T10 retains honest existing publication controls until T15 delivers explicit Send.
T12 introduces safe same-account restart recovery and preserves competing versions;
T13 enables account-shared content with authority and attachment checks, and T14
completes explicit conflict choice/resume. These independently verifiable stages
do not mark the parent feature complete early.

## Actual trade-offs

1. Seventeen bounded tickets add coordination and tracker volume, but keep each delivery reviewable within a fresh context; none is merely a parser/UI/test layer handoff.
2. Compact filters, board hierarchy and pin disclosure share one board-control ticket. This is larger than three separate tickets, but lets the complete dense board experience be reviewed together while preserving source semantics.
3. Board and reader status presentation share one quiet-check ticket. It touches two surfaces, but verifies the same compact-status/anchor rule together without coupling it to unrelated navigation work.
4. Rate and Report are separate full flows. This repeats some form/authority verification but avoids assuming they share capability, permissions or confirmation semantics.
5. Composer presentation, explicit Send, and pending-snapshot recovery land as separate usable stages. Existing publication behavior remains temporarily available, making changes easier to isolate while delaying the complete new reply flow until the final dependent slice.
6. Draft switching, durable recovery, account/attachment sharing and conflict choice are sequenced separately. Safe retained/paused intermediate states add staging work but keep durability and authority changes independently testable without silent overwrite or attachment loss.
7. Blocking edges represent required delivered behavior rather than shared files. This keeps independent work available but requires integration discipline when tickets touch the same component or state owner.
8. Every feature ticket owns its tests; a final integrated acceptance ticket then reconciles interactions and host/visual evidence. This adds a final coordination gate without postponing basic correctness to the end, and permits justified reuse of unchanged evidence.
9. No speculative standalone prefactor ticket is added. This avoids architecture work without an observed need but leaves the implementer responsible for a small prefactor first, or an explicit graph revision if a true wide refactor is discovered.
10. GitHub will be authoritative; these local per-ticket drafts make approval concrete and are not a second tracker. Their proposal identifiers are now mapped to real issues above. The durable manifest retains identities, dependencies, coverage and body hashes rather than duplicating every issue body; GitHub access is needed to read evolving ticket content.
11. Native GitHub blocking edges replace duplicate blocker paragraphs in blocked tickets. This avoids two independently maintained dependency lists in each issue, but tools consuming tickets must inspect native relationships. Unblocked tickets explicitly state that they can start immediately.
12. Each ticket receives ready-for-agent only after its parent and blockers are established and checked. This adds a brief unlabeled creation stage while avoiding a falsely ready ticket during setup.

## Publication verification

Read the current parent body and comments, issue inventory and existing child
relationships before publishing. The parent still matched its approved source
snapshot, had no comments and had no children. Each approved issue was created in
dependency order from an exact Markdown body file. The installed GitHub CLI lacks
the newer parent flag, so the supported native REST relationships were used through
`gh api`. No fallback parent-body checklist or parent-content edit was needed.

Publication saved issue identifiers before further mutations and reconciled exact
titles/bodies before any resumed creation. Each step verified native parent and
blocker relationships before applying `ready-for-agent`. The final independent
readback fetched every issue and dependency list, and compared all bodies exactly
against their approved publication files.

Verified outcomes:

- 17 exact title/body matches, 17 native children and 18 correct native blocking edges.
- All 17 children open, unassigned and labelled only `ready-for-agent`.
- Nine initial unblocked tickets; no extra, missing, cyclic or redundant dependencies.
- All 60 user stories and 21 parent acceptance areas covered; feature acceptance remains unchecked.
- Parent body, title, labels and open state unchanged from the pre-publication snapshot.
- No draft ticket placeholders or source paths/code snippets in published ticket bodies.

The manifest records the publication body hashes and graph. To recheck the current
tracker, read each issue with `gh issue view <number> --json title,body,state,labels`,
read the parent's native sub-issues and each child's `dependencies/blocked_by`
through `gh api`, then compare identifiers and SHA-256 hashes of the returned body
text. Later deliberate issue edits can change those hashes; the manifest is a
historical publication receipt, not a competing live tracker.

## Acceptance for this ticket-publication task

- [x] Obtain approval for the complete 17-ticket breakdown and blocking edges.
- [x] Publish one ready-for-agent sub-issue per approved slice with exact scope and unchecked feature criteria.
- [x] Establish and independently verify all 18 native blocking relationships and the initial frontier.
- [x] Preserve parent content/state and verify complete requirement coverage.
- [x] Pass final manifest/document formatting, link, graph, whitespace and scoped-diff checks before committing.

No application code changed, so runtime E2Es are not applicable to this publication
task. The child tickets require those tests during implementation. This record
does not claim that any production feature or final visual acceptance is complete.
