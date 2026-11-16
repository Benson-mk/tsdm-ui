# UI/UX specification publication — 2026-11-13

Published [#95 — Refine forum IM browsing, reading and reply composition](https://github.com/Benson-mk/tsdm-ui/issues/95)
with `ready-for-agent` on branch `feat/improve-ui-ux`. The issue is open. The
[local specification](forum-im-ux-spec-2026-11-13.md) is the exact published body.
GitHub Issues remains the project tracker; the local copy records this publication.

The owner invoked `/Users/benson/.agents/skills/to-spec/SKILL.md`, authorizing
synthesis and issue publication. That skill requires the seven published sections,
extensive user stories, the highest practical existing testing seam and owner
confirmation of that seam. No new product interview was conducted.

## Scope and provenance

The synthesis covers the feedback collected throughout this conversation, including
the latest single-row/full-function-expanded composer request. It is not limited
to the most recent presentation correction.

| Owner feedback or decision                                                                                                      | Source record                                                       | Specification acceptance coverage     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| Original comments 1–3: natural list-only layout, actual latest replier, stable list position; “ok” approves first MVP direction | [Thread browsing feedback](ui-ux-feedback-2026-11-09.md)            | B1–B2                                 |
| Original comment 4: excessive passive history/check block                                                                       | [Reader feedback](reader-feedback-mvp-2026-11-09.md)                | B5                                    |
| Original comment 5: current / total pages                                                                                       | [Reader feedback](reader-feedback-mvp-2026-11-09.md)                | R1                                    |
| Original comment 6: post menu, same ⋯ fallback plus Reply, empty-space double-click with text selection preserved               | [Reader feedback](reader-feedback-mvp-2026-11-09.md)                | R2–R3                                 |
| Original comment 7: exact post-link copy and toast                                                                              | [Reader feedback](reader-feedback-mvp-2026-11-09.md)                | R4                                    |
| Later board comments 1–4: collapsed filters, empty check space, secondary statistics, collapsed pins                            | [Board density feedback](board-density-mvp-2026-11-13.md)           | B3–B5                                 |
| Composer Q1–Q4/Q7: ordinary replies, dock/grow, visual plus source, same-column expansion and compact tools                     | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C1–C2; scope boundary                 |
| Q5/Q8/Q15: per-thread restoration, durable account-shared drafts, explicit concurrent-conflict choice                           | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C3, C8, C10                           |
| Q6/Q12/Q13: optional Preview, explicit Send, pending snapshot, next draft, failure and uncertainty                              | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C5–C7                                 |
| Q9: preserve writing while retargeting; separate explicit quote                                                                 | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C3                                    |
| Q10/Q11: mode-specific shortcuts/IME, no sender label                                                                           | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C4, Q1; explicit Solution requirement |
| Q14: unavailable attachments retain intent with repair/removal                                                                  | [Composer design decisions](composer-feedback-design-2026-11-13.md) | C9                                    |
| Match the current forum IM design                                                                                               | [Style feedback](composer-style-feedback-2026-11-13.md)             | C1, Q1                                |
| One compact row; expanded mode keeps full function                                                                              | [Single-row feedback](composer-inline-feedback-2026-11-13.md)       | C1–C2, Q1                             |

The specification includes 60 numbered user stories and 21 acceptance rows. All
production acceptance remains unchecked. Individual confirmed behaviors are
distinguished from pending final board/reader/composer visual review. Incidental
prototype filter precedence, independent pin semantics, a reduced formatting
toolbar and prototype storage are not promoted into production contracts.

## Testing seam confirmation

The proposed seam drives the built complete application with the real layout,
workspace, editor, forum client and browser storage, replacing external forum HTTP
responses only. Actual tabs exercise conflicts. Browser/host failures are injected
at their boundary; internal state modules are not mocked. Affected installed Edge
and Chrome checks cover browser mechanisms that deterministic fixtures cannot
establish. Existing consumer checks apply if public portable contracts change.

The owner answered the focused seam question:

> Yes—use this existing E2E seam

This is recorded in the published Testing Decisions. Production implementation
must enumerate failure cases and E2E expectations before feature code, retain
repeatable artifacts, and follow the current installed qualification ADR.

## Architecture and full-function reconciliation

Read the project glossary, ownership/recovery/qualification ADRs, issue-tracker
and label instructions, existing feedback records, representative application
E2Es, the evidence workflow and the current production editor tool inventory.
Compared the proposal with the existing prepared-review and full-editor specs
(#59 and #87). The open issue inventory contained only deferred #39 and #47;
neither duplicates this request.

The published specification explicitly records the ordinary-reply changes to
mandatory review, expansion placement and per-account session recovery, preserving
fresh authority, immutable submissions and uncertain-operation controls. It names
the full production tool families, including lists, tables, mentions, advanced
formatting and attachment operations, rather than treating the smaller MVP toolbar
as the complete editor.

No storage backend, schema or other costly-to-reverse production mechanism was
selected. The required advisor evaluation is explicitly assigned to the future
storage/contract decision before implementation. No new advisor/subagent was
needed for this documentation synthesis. No ADR was silently rewritten.

## Trade-offs

The distinct synthesis trade-offs are recorded once in the specification's
**Further Notes → Specification trade-offs**: one comprehensive issue, retaining
source semantics where prototypes were unapproved, deliberate later storage
design, complete-application E2E with affected installed checks, and responsive
behavior instead of universal screenshot dimensions. Previously accepted product
trade-offs are summarized separately there as carried-forward context.

One additional publication trade-off: keep an exact local snapshot of the issue
body for traceability and commit review. This duplicates the body and can diverge
if the GitHub issue evolves; treat GitHub as the current tracker and this file as
the publication snapshot, not an independently maintained competing ticket.

## Publication and verification

Published with `gh issue create --body-file` and `ready-for-agent`, then fetched
the actual issue body, title, labels, URL and state. Readback matched the local
body byte-for-byte. Published body SHA-256:

`380f1d2fb17cec76f5d66e7cbce57ef06f810cff975e882c21a7e33373241a3e`

The structure check verified all seven required headings in order, 60 sequential
“As …, I want …, so that …” stories, 21 acceptance rows, recorded seam approval,
no specific file paths/code in Implementation Decisions, no checked production
criteria and no private artifact/workstation paths in the public body. The issue
body stays below GitHub's size limit. Source comments, quoted user corrections and
the scope matrix above were reconciled against the final requirements.

Acceptance for this specification task, separate from production acceptance:

- [x] Synthesize all collected feedback, approved corrections and pending visual decisions.
- [x] Preserve operation guarantees, reconcile ADR/spec conflicts and retain full production editor scope.
- [x] Confirm the existing complete-application E2E seam with the owner and specify repeatable evidence.
- [x] Publish one open GitHub issue with `ready-for-agent` and verify exact body readback.
- [x] Pass final document formatting, whitespace, link and scoped-diff checks before committing.

No application code changed. Runtime/E2E tests are not applicable to this
documentation-only publication; their production requirements remain outstanding
in #95. No feature is marked implemented, no issue closed and no branch pushed.
