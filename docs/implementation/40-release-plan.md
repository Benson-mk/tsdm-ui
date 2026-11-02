# Assemble reviewed release assets and the final qualification verdict

Issue [#40](https://github.com/Benson-mk/tsdm-ui/issues/40) prepares a release;
publication remains a separate owner action. The controlling scope is ADR0002
and the accepted 2026-11-01 follow-ups in #9, including the later #47 deferral.

## Inputs and boundary

- Application 0.4.0, commit `33c32655f583aa3c0738d22fbd081fce39df69c5`,
  userscript SHA-256
  `9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea`.
- The retained clean freeze has 30 output files. Copy and compare them; do not
  rebuild or edit qualified application bytes.
- The final #38 application run has 1,118 passing cases with zero retries.
  Its 2,104 manifest entries are present and match their recorded identities.
- The unchanged forum-client 0.13.0 package has retained clean-consumer and
  independent replay evidence. Compare every tarball member to the final freeze.
- #37 is an accepted historical Chrome conclusion on its own a3de candidate.
  Its final temporary bundle is unavailable. Preserve the actual candidate,
  native substitutions, search/notices/removal exceptions, and source links.
- #38's persistent final disposition completes the earlier committed checkpoint.
  It records installed Edge 156.0.4314.58, stable Tampermonkey 5.5.1 and macOS
  15.6.0 on ARM. It does not supply a fresh Chrome verdict.
- Windows #39 and actual manager software-update recovery #47 remain deferred
  and unverified. Neither may be counted as a pass.

The current branch contains unrelated integration edits. New release files
will be committed separately from those edits. The application source and
qualified freeze remain immutable inputs.

## Failure inventory before packaging implementation

The existing release-tooling CLI is the proposed testing boundary. Its checks
exercise complete processes and inspect retained output; no unit-test layer or
application feature changes are planned.

| Reachable failure                                                      | Named expectation                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staged bytes differ from the qualified freeze                          | `exact-qualified-assets` compares every distributed executable and library member with the retained freeze.                                                                           |
| A wrapper archive silently changes library members                     | `exact-library-members` checks its complete file inventory, sizes and hashes.                                                                                                         |
| Required cases disappear or acquire a fabricated pass                  | `complete-required-coverage` requires every story, journey, failure family and release obligation with addressable evidence.                                                          |
| Historical Chrome observations are presented as current                | `historical-candidate-boundary` retains their a3de identity, accepted scope and unavailable original bundle.                                                                          |
| Windows or manager-update deferral is marked passed                    | `deferred-is-unverified` keeps both outside the gate with explicit unverified state.                                                                                                  |
| Missing, failed or inconclusive current observations are hidden        | `nonpassing-required-case-blocks` refuses an unaccepted required gap.                                                                                                                 |
| A case points at nonexistent source, observation or artifact           | `addressable-evidence` resolves every named reference and its revision.                                                                                                               |
| Private bodies, credentials, workstation paths or member images leak   | `authored-public-only` checks the explicit inventory, scans text and requires image inspection.                                                                                       |
| A manifest omits files, permits traversal or follows links             | `exact-relative-manifest` verifies the complete regular-file inventory with safe relative names and SHA-256.                                                                          |
| Replay depends on an unavailable temporary directory or dirty checkout | `clean-replay-setup` reconstructs the exact source/test inputs and dependencies in a new directory, discovers all cases and exercises representative application and consumer replay. |
| Unpublished assets are described as downloaded or installed            | `publication-remains-separate` records only local staging verification and supplies an unexecuted post-publication procedure.                                                         |

## Execution plan

1. Verify retained manifests, candidate/consumer equality, requirement mappings
   and the precedence of accepted scope decisions.
2. Author a public reconciliation with separate current synthetic, current
   installed, unchanged-library and accepted historical evidence. Retain
   failures and limitations without copying private captures.
3. Stage exact files, public evidence, clean replay inputs, manual installation,
   recovery and post-publication verification instructions.
4. Exercise packaging verification, inspect public text/images and validate
   replay setup. Reuse the unchanged successful full application suite; rerun
   only checks justified by packaging changes.
5. Run completed-work Standards and Spec reviews, then the designated
   gpt-6.1-sol advisor at xhigh effort with `validate-gpt-code-review`. Record
   distinct actual trade-offs and acceptance results, then commit this task.

No early advisor consultation is required: staging and evidence format choices
are reversible. No new live forum action, manager change, publication or
private-evidence deletion is part of this preparation.

## Execution result

The plan completed at the accepted scope. The confirmed CLI seam has 19 passing
scenarios with retained REDs before implementation. A fresh selected-source
replay installed locked dependencies, typechecked, discovered all 1,118 cases and
passed five focused application E2Es; the independently extracted Node consumer
replayed successfully. The unchanged full application baseline was reused.
Standards, Spec and the designated BDFL review have zero actionable findings.
The completed report, six verified acceptance criteria and ten distinct actual
trade-offs are in [the release report](../releases/0.4.0/report.md); the persistent
artifact locations and identities are in [the evidence index](40-evidence-index.json).
