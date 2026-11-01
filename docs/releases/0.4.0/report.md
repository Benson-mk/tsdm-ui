# Release qualification reconciliation — issue #40

**Qualified at the expressly accepted first-release macOS evidence scope.**
All six issue #40 acceptance criteria are verified. Exact release files,
replayable public evidence and the publication handoff are prepared. No
publication or post-publication download/install verification has occurred.

## Controlling scope and exact files

The current first-release gate is the accepted
[2026-11-01 scope](https://github.com/Benson-mk/tsdm-ui/issues/9#issuecomment-6546788571),
the later [manager-update deferral](https://github.com/Benson-mk/tsdm-ui/issues/9#issuecomment-6559471405),
ADR0002 and ADR0003. It reconciles shared candidate evidence,
[#37's accepted Chrome conclusion](https://github.com/Benson-mk/tsdm-ui/issues/37#issuecomment-6528322104)
and revised [#38 installed Edge compatibility](https://github.com/Benson-mk/tsdm-ui/issues/38).
Superseded template requirements do not reintroduce Windows or a manager update
as current blockers, independent density controls or unconditional tab durability.

| Artifact                    | Exact identity                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Application 0.4.0           | 1,710,524 bytes; SHA-256 `9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea` |
| Qualified source            | `33c32655f583aa3c0738d22fbd081fce39df69c5`                                                  |
| Forum-client 0.13.0 tarball | 107,902 bytes; SHA-256 `551e305d61997a05e326079ec9ab1e45b47d8cda9d6b29279d0331ce232e5cdd`   |
| Library module              | 359,872 bytes; SHA-256 `6b8835115f41109441e5e8d8cc3ed6ffb0ef18da867cb0233b4ab7bf845ce45a`   |
| Build tools                 | Node 24.22.0; npm 11.21.1; exact binary identities in the immutable freeze                  |

All 30 clean-freeze outputs are retained without rebuilding. Its 31-file
manifest is verified, and every tested tarball member equals the frozen library.
The clean freeze has 252 committed inputs. Its outputs equal the tested
development snapshot after source/documentation convergence. The separate
preparation commit does not replace the executable's source identity.

## Evidence authority

| Source        | What it establishes                                                                                                                 | Boundary                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `shared-38`   | 1,118 passing application cases, zero retries, exact final userscript; full source/fixture references and selected synthetic images | External network substituted; no installed or native claim                           |
| `library-38`  | 20 clean-consumer checks, 50 named family outcomes, independent replay and all eight unchanged tarball members                      | Shared library only; no later client product                                         |
| `edge-38`     | Final exact source in stable Edge 156.0.4314.58 / Tampermonkey 5.5.1 / macOS 15.6.0 ARM; revised #38 completed                      | Authored installed attestations; private original observations remain local          |
| `chrome-37`   | Accepted historical Chrome 156.0.8078.48 / Tampermonkey 5.5.1 / macOS 15.6 ARM64 qualification on a3de bytes                        | Original final temporary bundle unavailable; no fresh final-candidate Chrome verdict |
| `freeze-38`   | Clean committed provenance, locked tools/dependencies, exact output and library identities                                          | Packaging alone does not establish qualification                                     |
| `assembly-40` | Public package integrity, replay setup, sanitation and completed-work reviews                                                       | No GitHub upload, download or installed requalification                              |

The historical Chrome candidate is
`a3de680f5120fea3db559a404a0c35a68a22aee1d6a36dbf488d63edd449367c`, 1,710,368
bytes, commit `46cb84000d47483d4c6ad3c3b83bf48cbac66772`. The owner accepted
older native ordinary/merged-write, ordinary-draft, direct-packet, favorite and
listed file-delivery results paired with current controlled/affected checks.
Those native observations are not relabelled as a3de or final 9a0e executions.
The accepted historical conclusion and its later explicit reuse govern the
Chrome part of this reconciliation. Shared Chromium ancestry is not evidence
of browser equivalence.

## Journey reconciliation

Every expanded synthetic case is separately addressable by its exact declaration
and source hash. `coverage.json` resolves the 97 existing story/journey/failure/
control rows plus eight #38 and six #40 criteria: **111 rows**. The full visual
tool inventory, theme/language/Text size/geometry variants, financial failure
variants and source-preservation assertions remain in their actual test cases.

| Journey             | Current evidence and accepted historical complement                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1 install/recovery | Exact Edge export, owner-confirmed clean-before import, replacement, native escape, independent/duplicate tabs, divergence, away return, close/restore and truthful restart absence; shared induced recovery failures; accepted Chrome scope    |
| J2 navigation       | Current reading/route inspection and real native HTTP 302/remount; full synthetic identities, parent/history/position and rich-content variants; accepted Chrome reading/history scope                                                          |
| J3 search           | Fresh successful Edge search with effective criteria/target and zero passive repeats; synthetic expiry/cost/failure variants; historical Chrome exception remains distinct                                                                      |
| J4 ordinary writing | All distinct Edge routes/preparation/controls and one independently confirmed own edit; full synthetic ordinary/reply/quote/merge/edit/late-revision coverage; accepted historical native write families                                        |
| J5 writing/editor   | Exact source round trips, foreground caret, owner-performed CJK input, ShadowRoot portal/focus, representative appearance/narrow geometry and page-session lifecycle; complete synthetic tool/appearance matrix; accepted Chrome scope          |
| J6 forum drafts     | Current installed ordinary and funded draft preparation, unavailable-origin/resume/reload regression, same-record synthetic save/resume/publish/refusal/uncertainty; accepted historical native lifecycle                                       |
| J7 red packets      | Distinct direct/funded Edge preparation/disclosure/control paths; synthetic consent, amount/conditions, independent thread/packet/credit outcomes and no repeated funding; accepted historical native packet scope                              |
| J8 files            | Final Edge authenticated upload and saved association, ordinary and already-accessible paid disk delivery; synthetic context/type/failure/normalization/removal variants; accepted historical file scope and explicit removal-absence exception |
| J9 favorites        | Both kinds' installed preparation and controls, with current list/remove control inspection; full synthetic add/list/page/open/remove/uncertainty cases; accepted historical native lifecycles                                                  |
| J10 notices         | Current populated Edge load and passive stale-snapshot restoration without repeat requests; full controlled categories/pagination; accepted historical Chrome All/Mentions/pager substitution, without invented current populated categories    |
| J11 identity        | Real Edge member→guest→same-member cycle, exact source retention, paused/resumed sending and invalidated prior results; full timing/stale-response/text-copy/attempt guards; accepted Chrome scope                                              |
| Node                | Exact unchanged public package, clean isolated compiler and public imports, serialized flows, account/attempt guarantees and independently repeated observations                                                                                |

## Retained failures and limits

- The final Edge browser restart recovered no writing. Three opaque destinations
  showed unavailable snapshots; one restored the plain index. ADR0003 permits
  browser-controlled absence. There is no unconditional recovery promise and no
  complete startup request ledger across the browser disconnection.
- A background key probe inserted at the old end; foreground native caret input
  passed. Its cause remains unproven. The failed probe remains a failed probe.
- Replacement's request ledger is truncated; its zero-POST subset is not complete
  installed no-resend evidence. Controlled no-replay cases retain their separate
  authority. Close/restore likewise lacks a complete startup trace.
- The narrow check used a CSS viewport override, not native window resizing.
  The workspace measured 390px while the underlying native document retained
  1200px scroll width. IME candidate-panel lifecycle was not recorded.
- Chrome retains no fresh successful native a3de search. Its explicit accepted
  substitution is not a pass for an unobserved native operation. Edge's separate
  successful search does not rewrite that history.
- Current populated native notice-category breadth and native unread count are
  not established. Historical populated Mentions/pagination and controlled
  category cases retain their actual authority; empty/unoffered contexts do not
  establish global unavailability.
- Final absence of two original server-file removal objects remains unverified.
  Neither is described as confirmed deleted. No new cleanup was performed.
- Initial source mismatch, earlier recovery/caret failures and an incomplete
  offline-cache freeze attempt remain historical failures. Their later targeted
  repairs or unchanged retry do not turn the original observations into passes.
- Financial credit attribution, unobserved refunds and ordinary-member
  prepublication claimability retain the accepted unknowns. This release adds
  no purchase, packet claim, withdrawal or automatic remote-cleanup promise.
- Windows (#39) and actual manager software-update recovery (#47) are deferred,
  unverified and outside the current gate. Neither is counted as passed.

## Public evidence and retention

The clean packaged replay installed 218 locked packages offline, typechecked,
discovered all 1,118 application cases and passed five focused E2Es: populated
reading, ShadowRoot dialog focus, real HTTP 302/remount, and both fresh/unavailable
navigation-to-draft recovery paths. The consumer archive independently replayed
successfully from its new location. These are packaging/replay observations;
the unchanged complete 1,118-case baseline retains its original date and authority.

The initial clean replay exposed a missing `vite.editor-focus.ts` packaging
input. Its failed typecheck and initial archive are retained locally. A prewritten
CLI regression then demonstrated that omitting a root configuration and its
manifest entry could escape verification. The corrected 108-file snapshot and
complete application/test/root-TypeScript input checks pass. An earlier local
npm launcher invocation also failed before installation; invoking the pinned
npm CLI directly completed the locked installation. Neither failure changed the
application or is labelled a successful replay.

The public package contains authored attestations, exact synthetic source and
fixtures, eleven inspected synthetic images, replay material and relative-file
hashes. It excludes authenticated bodies, credentials, profiles, browser traces,
member screenshots and workstation paths. Synthetic consumer form values are
deliberately authored noncredentials, never exported native values.

Issue #40 created no authenticated session, credential or browser profile. The
task's local work contains only copies of specifications, source, synthetic data,
review results and diagnostic verification. Existing #37/#38 private captures
are neither republished nor deleted; their existing owner-controlled retention
conditions remain in force. Publication must include the owner's review of the
prepared public text/images and its separately authorized asset handoff.

## Distinct task trade-offs

1. Copy the immutable final freeze and original tested library tarball. This
   preserves qualification identity and avoids another build; the release target
   remains the qualified source commit while preparation has a separate commit.
2. Reuse the complete unchanged application/consumer observations and validate
   the new clean replay setup. This avoids repeated native effects and redundant
   full-suite execution; the evidence must explicitly connect identical inputs
   and outputs and retain its original execution dates.
3. Use a release-assembly receipt that distinguishes current, unchanged-library,
   accepted-historical and nonpassing historical evidence. The earlier
   single-candidate receipt format is left intact; the final assembler needs a
   small separate verifier and explicit scope checks.
4. Include all 1,118 named results and exact replay sources, with eleven selected
   synthetic images. This keeps public evidence inspectable and bounded; the
   complete original image set remains local and is not claimed to be shipped.
5. Ship a selected 108-file exact source snapshot for clean replay. This excludes
   historical/private-oriented documentation and avoids dependence on vanished
   temporary workspaces; it is not a complete Git checkout and must be used with
   the included executable and pinned dependencies.
6. Rewrap the original synthetic consumer evidence in a deterministic archive,
   preserving each member and the tested library tarball. This adds a packaging
   layer whose inventory must be checked; it does not create a new library build.
7. Test the verifier with complete CLI processes and mutated copies of the real
   payload. This checks consequential packaging failures without a unit-test
   layer; it costs temporary disk space and does not establish native behavior.
8. Preserve existing private evidence under its prior owner-controlled retention
   rather than deleting it during packaging. This supports later audit without
   assuming cleanup authority; those materials continue to need private storage.
9. Pin this verifier to this release's candidate, library and accepted historical
   authority, and require the full committed application/test/root-TypeScript
   replay graph. This prevents an incomplete or relabelled payload from passing;
   another release needs an intentionally updated contract and its own evidence.
10. Scan source literals separately from prose assignments so legitimate
    TypeScript annotations are not mistaken for credentials. Paths and known
    token shapes remain checked throughout, including archive members. This
    reduces false positives but remains a heuristic; explicit source provenance,
    the reviewed allowlist and text/image inspection remain necessary.

The earlier #37/#38 decision ledgers are historical references, not new choices
made during this task. Additional distinct review-driven trade-offs will be
recorded here if they arise.

## Final review and acceptance

Completed-work Standards and Spec reviews each found zero actionable findings.
The designated gpt-6.1-sol advisor at xhigh effort applied
`validate-gpt-code-review`, agreed with both reports and found zero additional
actionable findings or distinct trade-offs. The actual reports are retained in
`reviews/`. The advisor independently verified the original 2,104-file application
manifest, all 1,118 projected outcomes, the 108 replay inputs against the qualified
Git commit, the immutable assets, all 45 preserved preexisting working files and
the review ZIP. Its independent pinned-runtime CLI run passed all 19 scenarios.

The final sign-offs are incorporated in `receipt.json`. Qualified-mode
verification passes every case/reference, all 111 coverage rows, sanitation and
the review gate. The final asset checksum receipt remains separate from the ZIP
it identifies, avoiding a self-referential hash. Earlier review snapshots and
their identities remain historical records; they are not silently rewritten.

- [x] Reconcile every required case at the accepted macOS scope, retain actual
      historical and current authority, and keep #39/#47 unverified outside the gate.
- [x] Assemble the exact userscript, applicable library, notices, build/input/output
      identities and manual installation/update/recovery instructions without rebuilding.
- [x] Supply setup/replay instructions, receipt, coverage, actual sign-offs, authored
      synthetic evidence and a checked relative-file manifest; verify the clean replay.
- [x] Run secret/path checks and inspect public text and all eleven included images;
      exclude authenticated captures, profiles, credentials and member screenshots.
- [x] Complete BDFL review, retain the ten distinct task trade-offs and exact candidate
      limits, and preserve existing private evidence under its owner-controlled policy.
- [x] Prepare the exact GitHub Release payload and unexecuted post-publication
      download/hash/install procedure. No application publication or parent change.
