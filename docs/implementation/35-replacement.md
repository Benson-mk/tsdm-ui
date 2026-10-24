# Candidate replacement — issue #35

This note retains the original implementation, failure evidence and six decisions. The [current continuation](35-continuation.md) records the new accepted baseline and current verification; historical hashes below are not current qualification.

## Before implementation: failure inventory and named E2E expectations

The confirmed seam is the emitted application through layout → workspace → public forum client → browser host, replacing only external HTTP. Existing writing recovery checks remain authoritative for retained incompatible writing, account-bound pending attempts and no automatic replay. Synthetic replacement is not manager installation evidence.

- A future preference schema is silently overwritten by a settings change: J1.replacement-preferences retains exact raw bytes, explains incompatibility, allows inert copying, previews page-only changes and requires explicit reset before persistence.
- A malformed preference record loses recoverable data: the same expectation runs malformed input as well as a future schema. Valid schema-1 invalid fields retain the established defaults.
- A reset write is refused by actual full origin storage: J1.replacement-reset-refused retains the exact incompatible record and explicitly explains that reset did not succeed.
- Reset is confused with server cleanup: assertions require zero POSTs and instructions explicitly distinguish local state from posts, drafts and uploads.
- Candidate replacement changes script identity or adds automatic updates: J1.replacement-identity compares exact retained and new metadata and attaches byte identities; installed source export remains a separate mandatory gate.
- Compatible preferences/writing/pending attempts disappear or are replayed on reload: J1.replacement-compatible runs retained earlier executable bytes, seeds state through its UI, switches to new bytes, and independently reads retained values and request ledger.
- Incompatible recovery, downgrade and storage refusal must not invent durability or silently discard source. Existing J5.incompatible and J5.unacknowledged tests are included in replay; downgrade instructions require copying/exporting first and never assume old code understands new state.
- Startup/preference failure hides the exact native anchor or makes return impossible: existing J1 current-anchor recovery plus replacement bypass/re-entry checks observe exact URLs without relying on app preferences.

## Actual trade-offs

1. Unknown or malformed preference schemas retain exact raw bytes and preview baseline/page-only settings until a deliberate reset. This protects downgrade/upgrade data but requires an extra copy/reset step; supported schema-1 malformed fields keep the established normalization behavior.
2. Preference recovery uses a read-only textarea and a two-step local reset within existing Settings, translated into all three supported languages. It avoids a new storage/export mechanism but copying remains a user operation and finite browser storage can still refuse reset.
3. The exact earlier d2ce candidate is retained as a deterministic gzip fixture (about 201 KB rather than 894 KB). This gives repeatable executable-to-executable verification without rebuilding historical dependencies, at the cost of repository binary history and requiring inspection against the recorded original SHA-256.
4. Synthetic replacement drives both executables in one browser page session, including the earlier UI creating a pending attempt, and records candidate byte identities plus independent request/state readback. This isolates state compatibility and no-replay behavior, but does not establish manager installation, disable/uninstall or source-export guarantees.
5. Downgrade safety is an explicit copy-before-replacement procedure, because code shipped earlier cannot be retroactively taught new schemas. Compatible same-schema retained writing is exercised; no blanket older-code compatibility promise is made.
6. Browser startup failure is exercised with CSP blocking the entire executable and manual native bypass/re-entry. This is stronger evidence for the independent documented URL escape than a mocked internal exception, but does not qualify the existing in-app catch or manager command under every startup error.

## Acceptance status

Installed same-identity replacement, manager-stored source readback, disabled/uninstalled behavior and stable-manager browser matrix remain unverified until root coordinates the installed run. No release publication or live forum action is authorized by this ticket's synthetic replay.

## Implemented behavior and evidence

Future/malformed preferences previously silently fell back and could be overwritten on the next settings change. The new host reports incompatible raw data; workspace persistence stays blocked until explicit reset succeeds, while page-only appearance remains usable. The same existing preferences storage key is used, without migration to a parallel store. Incompatible writing recovery and pending-attempt semantics reuse the established sole recovery owner unchanged.

Retained prior candidate: version 0.4.0, 893643 bytes, SHA-256 `d2ce4efc9517d022426714d8d84784ae908a1a65d97fc5665317166392d899bd`, from the completed #20 candidate recorded in `20-acceptance.md`. `tests/fixtures/replacement-0.4.0.json` records provenance and both compression/raw identities. This is a development candidate rehearsal, never a previous-public-release claim.

- Red preference preservation: `2026-10-21T17-19-11.673Z`, 2 expected failures before code.
- First green preference slice: `2026-10-21T17-20-03.117Z`, 2/2.
- Exact candidate replacement: `2026-10-21T17-21-56.383Z`, 4/4.
- Startup experiment `2026-10-21T17-22-39.113Z` failed because Trusted Types restrictions did not prevent this Vue tree from mounting; it is preserved as a failed premise, not claimed as an application defect. The corrected CSP test blocks script execution itself.
- Replacement suite `2026-10-21T17-23-40.949Z`, 5/5, including blocked executable → manual native bypass with exact pid anchor → re-entry.
- Affected prior recovery/persistence regression suite `2026-10-21T17-24-03.726Z`, 22/22. Includes real origin storage quota, retained incompatible attempts, legacy navigation and pending → uncertain without replay.

The reset-refusal red run `2026-10-21T17-26-28.576Z` failed on missing explicit feedback before the correction. Final executable candidate: 897878 bytes, SHA-256 `3da313f95652d7c4bfd9d0fd3f462f9fb81feb4a667e50e055ee83e4c8a40ee8`. Final affected replay `2026-10-21T17-27-03.612Z` passes 31/31 with zero retries; its manifest verifies exact coverage and hashes of 33 package files. Build, typecheck, lint, format and whitespace checks pass. A final fixture-only UTF-8 correction avoids browser default-encoding artifacts in the authored screenshots without changing executable bytes; its replay `2026-10-21T17-28-10.585Z` passes 6/6 with zero retries. Every run has machine-readable receipt, authored PNG/JSON where relevant, human report and hash manifest under `evidence/runs/`. The source manifest includes the retained compressed executable. Replay the new suite with `npm run test:e2e -- tests/e2e/replacement.spec.ts`; use the matching locked source checkout and build identified in its receipt.

## Installed rehearsal

1. Use the retained d2ce bytes above in the existing manager script identity. Record actual browser, OS and manager versions. Export the manager source, hash its exact bytes, and confirm one enabled copy. Keep both candidates outside mutable `dist/`.
2. In each required browser, set Dark, traditional Chinese and Text size 90% through Settings. Prepare synthetic writing with title/source/options and a pending attempt using a controlled HTTP fixture, with no live forum POST. Record independent origin storage state and request ledger. For real user writing, finish/confirm supported save/copy before replacement instead of starting an experimental send.
3. Replace that manager entry with the exact new frozen candidate, preserving name/namespace. Export manager-stored source again; require byte-for-byte hash match with the distributed candidate. Confirm one enabled copy and no update/download metadata. Reload that same page session. Verify theme/language/90% Compact spacing, source/target/account, immutable original attempt and pending → uncertain without POST or automatic result check.
4. Exercise future-schema and malformed recovery and preferences as authored synthetic state. Verify inert copy/readout, no overwrite until deliberate reset, and failure visibility if actual storage quota refuses persistence. Never seed real credentials or real user writing into the public fixtures.
5. Record the original exact native `#pid` target. Test manager native continuation, then script disable and manual bypass even when startup is unavailable. Confirm unchanged source/remote-state ledgers and exact destination. Remove the bypass, enable exactly one copy and re-enter. Rehearse uninstall only in a dedicated synthetic manager profile; confirm remote records remain untouched and reinstall one exact identity.
6. For downgrade, first copy source/title/options/account/target/unknown attempt details. Reinstall retained exact bytes and inspect compatibility. If incompatible, stop normal use until copied data is safe and explicit reset is understood. Return to current bytes; never assume older code understands newer state.
7. Produce candidate-to-candidate receipt with both distributed/stored hashes, script inventory, named outcomes, independent state/request readback and authored summary. Keep real member captures, workstation paths and authenticated source private. Failed/missing cases remain blockers. Repeat against the final frozen release candidate and the required stable browser/manager matrix; targeted development checks do not establish a released upgrade contract.
