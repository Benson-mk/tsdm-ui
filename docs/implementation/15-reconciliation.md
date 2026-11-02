# First-release parent reconciliation — issue #15

The implementation and local release preparation are complete at the expressly
accepted first-release macOS scope. The current task reconciles the delivered
children, restores the coherent committed source, corrects the entry-point
status and verifies it again. It adds no application behavior or test seam.
Publication and downloaded-asset installation remain separate, unexecuted work.

## Controlling contract

[Issue #15](https://github.com/Benson-mk/tsdm-ui/issues/15) is **Implement the first
TSDM UI release from the accepted roadmap**. Its 2026-11-02 tracking update leaves
24 retained current-release children closed, with no native blocking dependencies.
It explicitly excludes deferred [#39](https://github.com/Benson-mk/tsdm-ui/issues/39)
and [#47](https://github.com/Benson-mk/tsdm-ui/issues/47) from this completion gate.
Both remain open and unverified; resumption requires an owner decision.

Apply the accepted Text size/derived Compact and Reka follow-ups, the browser
page-session recovery contract in [ADR0003](../adr/0003-use-browser-page-session-recovery.md),
and the macOS qualification and evidence substitutions in
[ADR0002](../adr/0002-qualify-installed-releases-with-bounded-evidence.md).
The original parent language about independent densities, strict tab-close
lifetime, Windows and actual manager updates does not override those decisions.
The original specification-deliverable checklist is not an application test result.

## Delivery and requirement coverage

| Parent slice                             | Completed children | Evidence entry points                                                                            |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| S0 foundation                            | #16                | `16-acceptance.md`; release Node and J1/J11 rows                                                 |
| S1 workspace/reading                     | #17, #18           | `17-acceptance.md`, `18-acceptance.md`; J2/J5                                                    |
| S2 writing/participation                 | #19–#24            | Corresponding acceptance records; J4/J5/J11                                                      |
| S3 attachments/drafts/downloads          | #25–#28            | `25-acceptance.md`, `26-acceptance.md`, `27-uploaded-drafts.md`, `28-acceptance.md`; J6/J8       |
| S4 red packets                           | #32, #33           | `32-completion.md`, `33-completion.md`; J7                                                       |
| S5 Search                                | #29                | `29-acceptance.md`; J3                                                                           |
| S6 Saved/Notices                         | #30, #31           | `30-completion.md`, `31-notices.md`; J9/J10                                                      |
| S7 integration/qualification/preparation | #34–#38, #40       | `34-consumer-current.md`, `35-replacement.md`, `36-release-tooling.md`, final #40 release report |

The [final release report](../releases/0.4.0/report.md) reconciles every J1–J11
family and the clean Node consumer. Its qualified-mode verifier checks all
**111 coverage rows**, including all **63 parent stories**, response/write/
recovery/history/inert-input/file/identity failure groups, architecture and
presentation requirements, and #36/#38/#40 criteria. A child's closed status is
navigation to its evidence, not proof that every historical case passed.
The [#40 evidence index](40-evidence-index.json) locates the immutable payload,
coverage, manifests, original full-suite results, installed attestations,
clean-build identities, reviews and exact staged release assets.

The committed #38 report/index preserve an intermediate source-freeze-pending
snapshot. Their final disposition is recorded in #40's reconciliation and in
`evidence/runs/38-edge-20261101/continuation-20261101/final-disposition.json`.
Their recorded intermediate state remains intact; only formatter output changed in this task.

## Exact candidate and limits

The retained qualified source is `33c32655f583aa3c0738d22fbd081fce39df69c5`.
Issue #40's preparation commit is `673a17951c5a1e425abdaa8a20c1419dd15ae643`.
This parent documentation commit does not replace either identity.

| Artifact                                       | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| Application 0.4.0, 1,710,524 bytes             | `9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea` |
| Library module 0.13.0, 359,872 bytes           | `6b8835115f41109441e5e8d8cc3ed6ffb0ef18da867cb0233b4ab7bf845ce45a` |
| Original tested library tarball, 107,902 bytes | `551e305d61997a05e326079ec9ab1e45b47d8cda9d6b29279d0331ce232e5cdd` |

The new local build reproduces the userscript and library module identities.
Distribution continues to use #40's exact retained assets and original tarball.
The new build and synthetic run do not create installed browser observations.

The accepted verdict combines exact final-source Edge checks with historical
Chrome qualification and explicitly accepted evidence substitutions. The original
Chrome final temporary bundle is unavailable. There is no fresh final-candidate
Chrome verdict, Windows qualification or actual manager-software-update result.
The release report retains restart recovery absence, incomplete startup/replacement
request ledgers, the failed background caret probe, viewport/IME observation
limits, historical Chrome Search and current notice-category gaps, unverified
final absence of two old removal objects, and financial/refund uncertainties.
Nothing in this reconciliation broadens those exceptions or turns them into passes.

## Working-tree reconciliation

Before restoration, all 38 modified tracked files and seven untracked files
matched the pre-#40 baseline byte lengths and SHA-256 values exactly; staging
was empty and HEAD was #40's preparation commit. The mixed older snapshot
contained reversions of newer behavior as well as unqualified additions.

An archive outside this checkout contains all 45 original files, their modes,
the binary tracked diff, status, base commit and manifest. Every archived tar
member was read back and compared with the original and copied bytes before
restoration. Only those 38 tracked paths were restored to HEAD, and only those
seven verified untracked copies were removed. The resulting tree was clean;
ignored evidence and unrelated files were retained. The archive's absolute
location is supplied in the task response and the private execution receipt.
Selective recovery of additions requires hunk-level assessment and verification.

## Verification and repeatable evidence

Use the pinned Node 24.22.0/npm 11.21.1 pair and the commands in the root README.
The approved application E2E and separate clean public-consumer boundaries are
unchanged. No unit tests were added after implementation; this task changes
only documentation and reconciles existing files.

The fresh task receipt, command logs, source/evidence identities and review
reports are retained under `evidence/runs/15-reconciliation-20261102/`.
The fresh full application run passed **1,118 cases with zero retries**. The
clean public consumer passed **20 aggregate checks and 50 named family outcomes**;
the complete packaging CLI suite passed **19 scenarios**. Typecheck, build,
scoped lint, full formatting and qualified payload verification pass.
The application reporter produces its own timestamped receipt, report, source
snapshot, synthetic artifacts and checked manifest. These are new observations
of the restored candidate, distinct from #38/#40's immutable results.
The [release replay instructions](../releases/0.4.0/README.md) reproduce the
original packaged evidence independently.

The first root lint invocation also traversed preexisting ignored `.local/`
archives and failed on their nested configurations. Repeating the same command
with `--ignore-pattern ".local/**"` passed for the current repository. Those
archives remain untouched. The first formatting check found two preexisting
#38 documentation files; applying the existing formatter preserved all JSON
values and Markdown words and made the complete formatting check pass. Both
initial failures remain in the private logs.

Final command results and review dispositions are recorded in
[15-verification.json](15-verification.json). Standards and Spec reviews each
found zero actionable issues. The designated gpt-6.1-sol advisor at xhigh effort
applied `validate-gpt-code-review`, independently validated both reports and
found no additional actionable issue or distinct trade-off. Its checks included
all archive members, restored paths, release assets, runtime/test equality and
the fresh complete E2E receipt. The E2E run captured its documentation snapshot
before the final report/review metadata; executable and test inputs are unchanged.
All seven completion criteria below are verified at the accepted scope.

## Parent completion checklist

- [x] Reconcile all 24 current-release children and all 63 stories/J1–J11/Node against the accepted scope and retained evidence.
- [x] Preserve and verify the 45-file archive, restore only its captured paths, and retain ignored evidence.
- [x] Verify the restored source with pinned typecheck, lint, formatting, build, full application E2Es and clean public-consumer checks.
- [x] Verify exact candidate/library equality and the unchanged qualified payload/staged asset hashes.
- [x] Correct the README's stale product, library and qualification entry points without relabelling historical evidence.
- [x] Complete Standards, Spec and designated BDFL review and record every distinct task trade-off.
- [x] Retain deferred #39/#47 and the separate publication/download/install boundary without claiming unperformed work.

## Task trade-offs

1. Restore the coherent committed baseline after verifying an external archive.
   This removes unqualified additions from active use, while preserving all
   original bytes for selective recovery; the archive needs discoverable storage
   outside active Git history. Hunk-level salvage is deferred rather than mixing
   older reversions into this parent completion.
2. Add a parent reconciliation and update the README, while retaining historical
   acceptance records and immutable release evidence. This gives readers a current
   entry point and preserves audit history, but requires explicit precedence links
   where older records still show intermediate statuses.
3. Run the complete synthetic suite and public consumer once after the broad
   working-tree restoration. This costs local execution and artifact storage;
   it verifies the restored checkout without repeating authorized native effects
   or pretending to refresh installed-browser qualification.
4. Keep the prepared release assets immutable and compare the new local build
   with their executable hashes. This preserves exact qualification provenance;
   the documentation commit and new synthetic observation have separate identities
   and do not replace the release's retained source, tarball or attestations.
5. Exclude the existing private `.local/` archives from this invocation of the
   repository lint command, rather than deleting them or changing application
   inputs. This keeps the check focused on maintained files; the plain command
   still needs that exclusion in this archive-bearing checkout.
6. Normalize the two preexisting #38 formatting violations with the repository formatter,
   preserving their content and historical verdicts while accepting a small
   documentation-only diff to make the full format check pass.
