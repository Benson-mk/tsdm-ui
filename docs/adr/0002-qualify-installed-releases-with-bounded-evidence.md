# Qualify installed releases with bounded evidence

Qualify the first release on Windows 11 and macOS using stable Chrome, Edge and Tampermonkey. Run complete core journeys in both installed browsers on a declared primary OS, then repeat host-sensitive checks on both browsers on the other OS. This preserves coverage of native input, file handling and lifecycle differences while bounding repeated live forum effects.

The canonical journey matrix, failure cases, readback requirements, evidence format, acceptance checklist and complete trade-off ledger are in [Define release qualification and public evidence — issue #9](https://github.com/Benson-mk/tsdm-ui/issues/9#issuecomment-6239001718). This decision applies the accepted [shared forum/workspace/host boundaries](0001-share-forum-workflows-across-layouts-and-hosts.md); it does not qualify an application that has not yet been built.

## Qualification boundary

Measure complete user outcomes rather than test counts. The eleven journey families cover installation/recovery, reading/navigation, search, ordinary authoring, writing/editor recovery, forum drafts, direct hongbao publication and funded drafts, attachments/downloads, favorites, notices and session changes. The shared forum-client library also needs a clean external Node consumer check. Enumerate failure modes and write the relevant E2E expectations before feature code; no unit-test runner is added by default.

Use deterministic populated fixtures for content variants and induced failures, current live observations for forum semantics, and the actual installed manager/browser for host guarantees. None substitutes for another. Run the full installed baseline on the frozen final candidate; preserve failures and targeted reruns separately. A failed, inconclusive or missing required case blocks qualification rather than silently reducing the supported scope.

Tie every result to actual build inputs, locked dependencies, exact tools, emitted artifacts and manager-stored script source. Compare installed source bytes with the distributed userscript hash, confirm one enabled copy and reload it before qualification. A display version or Git revision alone is insufficient. Changed code needs a new candidate and its own qualification.

Confirm consequential writes through fresh authoritative server observations independent of optimistic UI and submission responses. Check saved content, actor, target and version; for hongbao, distinguish thread, packet and credit effects. Keep accepted moderation/refund uncertainty explicit. Downloads require evidence of the delivered file, including already accessible paid files; buying access remains deferred.

## Distribution and evidence

Distribute versioned GitHub Release assets with checksums, instructions and notices. Installation, updates and rollback are manual. Rehearse the first update from an earlier retained candidate; later releases qualify replacement of the previous supported public version. Preserve recoverable source or explain incompatibility, retain uncertain attempts without replay, and provide emergency native access even when application startup fails.

Each run produces a machine-readable receipt and a human-readable report. Public evidence includes replay instructions, requirement-to-case coverage, synthetic artifacts and a file manifest. Keep raw authenticated captures, credentials, member screenshots and workstation paths private. Publish deliberately authored summaries with run-local aliases and inspect the public package before publication; a redacted raw capture dump is not the evidence contract.

## Consequences

Bounded replication reduces repeated live writes but requires traceable subcases and expanded checks when a platform difference appears. Exact installed identity adds export and requalification work. Manual updates require user action. Private live evidence protects forum data but public readers must repeat live procedures with their own accounts; they can directly replay synthetic cases. The issue records every decision and investigation trade-off.

The specification is ready for implementation planning, with no known unresolved product or architecture prerequisite. Plan early capability checks for tab recovery, real redirects/remounts, current forms, populated notices, attachment delivery and external library imports. A demonstrated conflict blocks dependent delivery and requires investigation or a human product decision. Application release qualification and publication remain subsequent work.
