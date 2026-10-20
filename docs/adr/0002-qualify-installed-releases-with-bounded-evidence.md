# Qualify installed releases with bounded evidence

Qualify the first release on Windows 11 and macOS using stable Chrome, Edge and Tampermonkey. Run complete core journeys in both installed browsers on a declared primary OS, then repeat host-sensitive checks on both browsers on the other OS. This preserves coverage of native input, file handling and lifecycle differences while bounding repeated live forum effects.

The canonical release journey matrix, failure cases, readback requirements, evidence format, acceptance checklist and release trade-offs are in [Define release qualification and public evidence — issue #9](https://github.com/Benson-mk/tsdm-ui/issues/9#issuecomment-6239001718). The development cadence below records the follow-up approved on 2026-10-20 (Asia/Hong_Kong). This decision applies the accepted [shared forum/workspace/host boundaries](0001-share-forum-workflows-across-layouts-and-hosts.md); it does not qualify an application that has not yet been built.

## Qualification boundary

Measure complete user outcomes rather than test counts. The eleven journey families cover installation/recovery, reading/navigation, search, ordinary authoring, writing/editor recovery, forum drafts, direct hongbao publication and funded drafts, attachments/downloads, favorites, notices and session changes. The shared forum-client library also needs a clean external Node consumer check. Enumerate failure modes and write the relevant E2E expectations before feature code; no unit-test runner is added by default.

Use deterministic populated fixtures for content variants and induced failures, current live observations for forum semantics, and the actual installed manager/browser for host guarantees. None substitutes for another. Run the full installed baseline on the frozen final candidate; preserve failures and targeted reruns separately. A failed, inconclusive or missing required case blocks qualification rather than silently reducing the supported scope.

Tie every result to actual build inputs, locked dependencies, exact tools, emitted artifacts and manager-stored script source. Compare installed source bytes with the distributed userscript hash, confirm one enabled copy and reload it before qualification. A display version or Git revision alone is insufficient. Changed code needs a new candidate and its own qualification.

Confirm consequential writes through fresh authoritative server observations independent of optimistic UI and submission responses. Check saved content, actor, target and version; for hongbao, distinguish thread, packet and credit effects. Keep accepted moderation/refund uncertainty explicit. Downloads require evidence of the delivered file, including already accessible paid files; buying access remains deferred.

## Development verification cadence

Use one declared primary browser for routine development iterations. The observed agreement between Edge and Chrome supports reducing duplicate checks; it does not establish browser equivalence or remove either browser from acceptance and release qualification.

| Stage | Required verification |
| --- | --- |
| Routine implementation and debugging | Run the relevant complete-application E2Es in the primary browser. |
| Browser-sensitive work | Exercise the affected installed behavior in both browsers early, once it can be meaningfully tested. This includes storage/recovery, redirects/remounts, native IME, keyboard/focus, downloads and Tampermonkey integration. |
| Feature ready for acceptance | Run the affected installed workflow in Edge and Chrome against the same candidate, preserving exact source identity and repeatable evidence. Unrelated manual journeys need not be repeated. |
| Frozen release candidate | Run the full required baseline: complete core journeys in both stable installed browsers on the declared primary OS, plus the required host-sensitive checks in both browsers on the other supported OS, with stable Tampermonkey. |

After a correction, repeat the affected checks and justified regression coverage. Broaden the checks when a browser difference, failure or changed shared behavior creates a concrete concern. A small appearance correction does not by itself require another complete logout, browser restart, IME and download exercise. Do not repeat an unchanged successful case or a live write merely to produce another receipt.

Keep earlier observations tied to their original candidate and runtime. Changed executable bytes require their own affected development verification and, when proposed for release, the complete final baseline. Targeted passes do not relabel an earlier failed baseline or establish full qualification of a later build. This cadence does not waive explicitly required acceptance observations or mark existing verification gaps as passed.

## Distribution and evidence

Distribute versioned GitHub Release assets with checksums, instructions and notices. Installation, updates and rollback are manual. Rehearse the first update from an earlier retained candidate; later releases qualify replacement of the previous supported public version. Preserve recoverable source or explain incompatibility, retain uncertain attempts without replay, and provide emergency native access even when application startup fails.

Each run produces a machine-readable receipt and a human-readable report. Public evidence includes replay instructions, requirement-to-case coverage, synthetic artifacts and a file manifest. Keep raw authenticated captures, credentials, member screenshots and workstation paths private. Publish deliberately authored summaries with run-local aliases and inspect the public package before publication; a redacted raw capture dump is not the evidence contract.

## Consequences

Bounded replication reduces repeated live writes but requires traceable subcases and expanded checks when a platform difference appears. Exact installed identity adds export and requalification work. Manual updates require user action. Private live evidence protects forum data but public readers must repeat live procedures with their own accounts; they can directly replay synthetic cases. The issue records the original release decision and investigation trade-offs.

Using one browser during routine development reduces duplicate runs, manual interruptions and repeated live forum actions, at the cost of potentially discovering a browser-specific problem later. Early checks in both browsers for browser-sensitive work, affected-workflow acceptance checks and the complete frozen release baseline limit that risk.

The specification is ready for implementation planning, with no known unresolved product or architecture prerequisite. Plan early capability checks for tab recovery, real redirects/remounts, current forms, populated notices, attachment delivery and external library imports. A demonstrated conflict blocks dependent delivery and requires investigation or a human product decision. Application release qualification and publication remain subsequent work.
