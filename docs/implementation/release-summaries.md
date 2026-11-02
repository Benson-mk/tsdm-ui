# Add version summaries and categorized release notes

The owner requested the OpenMausBot v0.1.137 presentation: an authored version
summary followed by label-based PR categories. Keep manually selected tags and
approval before Release creation. Correct the existing v0.1.0 description without
moving its tag or changing its download.

## Failure inventory before implementation

- A large integration PR must not replace the reader-facing feature summary.
- A missing or empty version summary must stop preparation before output exists.
- Labels must select the first matching category; unmatched PRs use Other changes.
- Excluded PRs must not reappear as direct commits or new-contributor entries.
- Empty categories must not appear, and direct commits must remain visible.
- First releases and later tag ranges must retain correct source links.
- Offline previews must remain explicit about unavailable PR attribution.
- Publication must still use the exact approved notes and checksummed assets.
- Updating the current description must preserve the tag, asset IDs and bytes.

## Acceptance criteria

- Version-specific authored summaries precede What's Changed.
- PR labels select New features, Fixes, Documentation or Other changes;
  ignore-for-release excludes a PR.
- Complete CLI scenarios verify summaries, categories, exclusions, first-release
  and tag-range behavior, and preserve existing packaging refusal checks.
- v0.1.0 describes the implemented capabilities and its actual installation limits.
- The corrected published description matches the reviewed text; its existing tag
  and download remain unchanged.

## Decisions and trade-offs

1. Author a short Markdown summary per version. This adds a release-preparation
   step, but keeps feature explanations accurate even for a single large PR;
   missing summaries fail rather than silently publishing an empty introduction.
2. Retain the read-only PR API formatter and apply the reference label policy.
   GitHub's native generate-notes endpoint needs contents-write permission;
   retaining the formatter preserves the existing approval boundary at the cost
   of maintaining the small formatter. This is not a claim of identical native
   GitHub generation. Store the shared configuration as JSON, valid YAML, in
   .github/release.yml so GitHub and the local formatter can read it without a
   new YAML dependency.
3. Keep direct commits in Other changes and collapse merged PR commits to one
   entry. This preserves work outside PRs without duplicating a large integration;
   the authored summary supplies its feature detail. PR labels remain explicit,
   not inferred from titles; existing unlabelled PRs stay in Other changes.
4. Correct only the published description of v0.1.0. Preserve the original
   approved artifact as historical evidence and retain a separate metadata-edit
   receipt; its original notes checksum will intentionally differ from the edit.

## Verification — 2026-11-02

All acceptance criteria above were verified. The corrected pre-implementation
CLI run reproduced missing summary handling and absent categories. After the
change, all 14 complete packaging CLI scenarios passed with Node 24.22.0 and
npm 11.21.1. An initial fixture-only module-format error was corrected before
the RED run used for comparison; both original and corrected receipts remain.
Focused ESLint, Prettier and diff whitespace checks passed.

The read-only live GitHub preparation used the released e3db38c commit and the
new authored v0.1.0 summary. BDFL validation found no significant actionable
issue. The owner-authorized description edit was read back and matched the
reviewed text. Remote tag identity, release identity, asset metadata and a fresh
download were unchanged. Userscript SHA-256 remains
`3a45a3e438939f584ac7cd670b9e8502df96b6ba601bb4e11af4a9fcaf376262`.
No new Release or tag was created. No application source changed, so browser
qualification was not repeated or claimed.

Retained evidence:

- `evidence/runs/release-summaries-red-corrected/receipt.json`
- `evidence/runs/release-summaries-green/receipt.json` and `report.md`
- `evidence/runs/release-summaries-published/receipt.json`, reviewed notes,
  before/after API snapshots, tag identities and downloaded files

Replay the CLI scenarios after building a v0.1.1 userscript and generating notices:

```sh
npm run test:release -- dist /tmp/tsdm-release-summary-replay
```

The scenario harness creates its own disposable version summary, PR API fixture
and Git history; it never creates a GitHub Release. Keep the original approved
v0.1.0 package unchanged: its notes were deliberately superseded by this
separately recorded metadata correction.
