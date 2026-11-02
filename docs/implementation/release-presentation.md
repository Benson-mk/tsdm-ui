# Simplify public release presentation

User request: show release notes in the OpenMausBot v0.1.138 style, put installation
instructions in README Quick Start and third-party notices in README
Acknowledgments, and attach only the userscript to future releases.

## Failure inventory before implementation

- Removing public attachments must not remove build provenance or checksum checks
  from the artifact approved by the owner.
- A standalone userscript must retain the dependency license text that previously
  shipped separately. Packaging twice must not duplicate that text or stale hashes.
- README acknowledgments must not silently become stale after dependency updates.
- Notes must use only merged PRs belonging to the selected Git range, deduplicate
  their commits, and retain direct commits that did not come through a PR.
- A GitHub lookup failure must stop hosted preparation, not silently produce an
  incomplete changelog. Local offline previews must remain possible.
- First releases, 100-fix patch releases, missing tags, changed executables and
  preview-only publication refusal must retain their existing behavior.
- Preparing notes must not grant the build job release-write permission or create
  any remote tag, draft or Release.

## Acceptance criteria

- Release upload list contains exactly `tsdm-workspace.user.js`; review artifacts
  retain checksums, provenance and notes.
- Hosted notes contain What's Changed, PR authors/links, direct changes and a Full
  Changelog link; offline previews clearly identify their commit-only source.
- README contains Quick Start and complete, collapsible Acknowledgments.
- License text is included in the userscript and its recorded identity matches.
- Packaging verification and the affected synthetic application checks pass.

## Decisions and trade-offs

1. Keep the complete review package but publish only the userscript. This reduces
   public attachment clutter; review artifacts expire after the existing 30 days.
2. Use read-only GitHub PR data to produce the requested layout. GitHub's native
   generate-notes endpoint requires contents-write permission, so reproducing the
   layout keeps release creation permission behind the approval gate at the cost
   of a small formatter and fetching closed PR pages.
3. Retain direct commits under Other changes so work outside PRs is not lost.
   Offline previews use commit-only notes and cannot supply GitHub attribution.
   Rebased PRs can retain duplicate individual commit entries because original
   commit identities may not survive the rebase. New Contributors explicitly
   describes first merged PRs, not the first-ever direct commit.
4. Keep full dependency notices in a collapsed README section and a userscript
   comment. This enlarges both files but preserves attribution with the download.
   The conservative locked production inventory can include packages not bundled.
5. Check README notice synchronization during packaging; dependency upgrades need
   an explicit `node scripts/package-notices.mjs --update-readme` refresh.
6. Apply this policy to future releases. Existing published v0.1.0 remains a
   historical artifact; changing it requires a separate explicit selection.

## Verification — 2026-11-02

All five acceptance criteria above were verified locally. No tag, GitHub Release,
existing release attachment or remote branch was changed.

- Pinned Node 24.22.0 / npm 11.21.1 build, typecheck, clean-source lint and
  formatting passed. Actionlint passed.
- All 10 complete packaging CLI scenarios passed, including the 100-fix patch,
  one public asset, embedded notices, all checksums and refusal paths.
- A real read-only GitHub preview included PR #13 and #48 with their author,
  deduplicated their merged commits, retained direct commits, and produced the
  contributor and full-changelog sections. Every review-package checksum passed.
- Notice packaging is byte-for-byte idempotent; manifest hashes match the
  userscript; stale README acknowledgments are refused before changing the script.
- All 26 foundation Edge synthetic cases passed against the notice-bearing build.
  This is not installed Tampermonkey qualification or a hosted Actions run.

The first notice synchronization check caught Prettier trimming license trailing
whitespace. README generation now normalizes trailing whitespace only; full raw
license content remains in the userscript and review artifact. The first CLI run
was blocked from writing the default npm cache by the sandbox; a writable
temporary cache passed. The first Edge run could not launch under the sandbox;
the permitted rerun passed. Original failed receipts and successful reruns are
retained separately in `evidence/runs/release-presentation/`.

Replay after building a v0.1.1 preview:

```sh
node scripts/package-notices.mjs
npm run test:release -- dist /tmp/tsdm-presentation-new-run
RELEASE_TAG=v0.1.1 npm run test:e2e -- tests/e2e/foundation.spec.ts
```

To exercise read-only GitHub attribution locally, set `RELEASE_GITHUB_NOTES=true`
when running `npm run release:prepare -- TAG --preview NEW_OUTPUT`. The built
version must match TAG. This never creates a GitHub Release.
