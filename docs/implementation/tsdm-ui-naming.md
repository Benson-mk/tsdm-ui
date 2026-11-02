# Align application naming with tsdm-ui

Record: [issue #50](https://github.com/Benson-mk/tsdm-ui/issues/50).

The owner approved TSDM UI as the displayed product name, tsdm-ui.user.js as the
download filename, and consistent README and Release titles.

## Failure inventory

- Changing only the output filename would break packaging, checksums and tests.
- Changing @name can create a second Tampermonkey identity; installation guidance
  must explicitly require disabling the old TSDM Workspace script.
- Historical release evidence and retained candidate bytes must keep their old
  identities. Replacement checks must recognize both names.
- Renaming internal storage or DOM keys would add an unrelated migration risk.

## Acceptance criteria

- New builds emit tsdm-ui.user.js with @name TSDM UI.
- UI branding in all languages, README, package metadata and future Release titles
  use the new name; release preparation selects the renamed asset.
- Current build consumers and freeze tooling work with the new filename.
- Historical candidates remain unchanged; Quick Start explains the name transition.
- Build, packaging, type/lint/format checks and affected browser E2Es pass.

## Decisions and trade-offs

1. Change the visible userscript name as requested; this can create a separate
   manager identity. Require disabling the old installation and do not claim
   automatic identity migration. Namespace and storage keys stay stable.
2. Rename current build consumers, but keep historical 0.4.0 payload verification
   and retained fixtures under their original names so their evidence remains valid.
3. Preserve the internal tsdm-workspace DOM ID and workspace domain vocabulary.
   They are not product branding and changing them adds unnecessary migration work.
4. Update future release presentation locally; the already-published v0.1.0 is
   historical and keeps its original files and title.

## Verification — 2026-11-02

All acceptance criteria above were verified locally using Node 24.22.0 and
npm 11.21.1. Build, typecheck, clean-source lint, formatting and actionlint passed.
All 10 tag-release CLI scenarios, 21 freeze CLI scenarios and 32 Edge
foundation/replacement E2Es passed. Evidence is retained at
`evidence/runs/tsdm-ui-naming/`.

The first concurrent lint invocation scanned generated CLI fixtures in the source
checkout. Those outputs were moved outside the checkout and clean-source lint
passed; no production lint rule was relaxed. Historical fixtures were not rewritten.
No installed Tampermonkey upgrade or hosted Actions run was performed, and no
GitHub Release, existing tag or remote branch was changed. Issue #50 records the
owner's requested TSDM UI naming change.
