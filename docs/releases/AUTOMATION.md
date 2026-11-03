# Manual tags, reviewed releases

The application starts its public version sequence at **0.1.0**. The repository's
package version is the local-development default. A release build takes its
version from your tag, so `v0.1.1` can contain 100 fixes or any other changes you
choose. Nothing calculates or increments versions from commit counts or types.
The forum-client library keeps its independent version (currently 0.13.0).

## Preview without creating a Release

Open **Actions → Build and approve release → Run workflow** on `main`. Optionally
enter a version such as `v0.1.1`; leaving it blank uses the package version.
This builds a preview, checks the application and library, and uploads a
`release-RUN-ATTEMPT` artifact plus synthetic verification evidence. Manual
dispatch always skips publication, even when dispatched against a tag.

The run summary contains release-page changelog text and checksums. Download the
artifact to inspect the userscript, update metadata, library tarball, notices, installation guide,
build manifest and provenance. A preview has `preview: true` in `release.json`
and cannot be published by this workflow.

Before previewing, write `docs/releases/notes/vVERSION.md` for the selected
version as described below; a missing or empty summary stops preparation.

For a local preview using the pinned Node/npm pair:

```sh
npm ci
RELEASE_TAG=v0.1.1 npm run build
node scripts/package-notices.mjs
npm run release:prepare -- v0.1.1 --preview /tmp/tsdm-v0.1.1-preview
```

Use a new output directory for each candidate. The preparation command never
creates a GitHub Release or pushes anything.

## Choose a version and approve publication

1. Write and commit `docs/releases/notes/vVERSION.md` for the version you choose
   (for example `v0.1.1.md`). Start with `## 0.1.1: a short release title`, then
   describe the user-visible changes in a few bullets. This is the introduction
   above What's Changed, like the reference release. Preparation refuses missing
   or empty summaries, including previews. The bot combines your committed
   summary with PR notes; it does not invent feature descriptions.
2. Ensure the intended source commit is on GitHub and has passed the applicable
   checks. Check out that exact commit locally.
3. Create and push your chosen, unused stable version tag:

   ```sh
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

4. Wait for the build job. Inspect the downloadable artifacts and run summary.
   The `publish` job waits at the **github-release** environment. No draft or
   published Release exists yet.
5. Complete the applicable ADR0002 qualification and public-content review
   against these exact files. Build/synthetic passes alone are not installed
   browser qualification. Do not apply historical 0.4.0 verdicts to new bytes.
6. In the run, select **Review deployments → github-release → Approve and
   deploy**. Only **Benson-mk** is configured as required reviewer. Approval of
   your own tag-triggered run is allowed; administrator bypass is disabled.
7. The approved job downloads the same immutable artifact, checks every checksum
   and the remote tag's commit, then creates the GitHub Release with its build
   assets and prepared notes. It does not rebuild. Verify downloaded assets and
   installed source after publication before claiming download/install success.

Do not approve a run merely to test the pipeline: approval publishes a Release.
Reject or cancel an unwanted run. No release has been authorized by installing
this automation. A repository administrator can still change workflow or
environment configuration; keep those protections in place.

## Notes, assets and retry behavior

The changelog lives in the GitHub Release description. It starts with the
version-specific authored summary, then What's Changed, nonempty PR categories,
New Contributors (when there are first merged PRs), and Full Changelog.
`.github/release.yml` uses the reference label policy: `enhancement` → New features,
`bug` → Fixes, `documentation` → Documentation, and unmatched PRs → Other changes.
The first matching category wins; `ignore-for-release` excludes the PR and its
covered commits. Direct commits remain in Other changes. Labels are read at
preparation time; the resulting notes are frozen in the approval artifact.

The configuration is JSON (valid YAML) to avoid a new parser dependency. Keep
that syntax when editing it. The hosted formatter uses read-only GitHub PR data
rather than GitHub's native generate-notes endpoint, which requires contents-write
permission. This preserves the rule that only the approved publish job can create
a Release. It implements the label/category subset above, not every GitHub
configuration option. Hosted preparation reads closed GitHub PRs, includes merged
PRs in the selected Git history with their authors/links, and retains direct commits.
Offline local previews retain the authored summary and use a clearly marked
commit-only list; label categories require hosted PR data. The range starts
at the nearest reachable stable `vMAJOR.MINOR.PATCH` tag; the first release
includes reachable history. PRs merged through a merge commit have their contained
commits deduplicated; squash merges use their single merge SHA. Rebased PRs can
also show individual rebased commits because their original commit identities
are not guaranteed to survive rebase. The comparison boundary is a tag, even if
that earlier tag has not been published as a Release. No root CHANGELOG.md is
committed. Only stable numeric tags are supported; prerelease policy is future
work.

The uploaded Release attachments are **`tsdm-ui.user.js`** (the installable script)
and **`tsdm-ui.meta.js`** (its metadata header for smaller update checks). The
existing Vite userscript plugin generates both from the same version and metadata;
packaging rejects a missing or inconsistent companion file. Both are checksummed.
The script uses these stable URLs:

- `@updateURL`: `https://github.com/Benson-mk/tsdm-ui/releases/latest/download/tsdm-ui.meta.js`
- `@downloadURL`: `https://github.com/Benson-mk/tsdm-ui/releases/latest/download/tsdm-ui.user.js`

Choose a higher version for each update and ensure GitHub's Latest release is the
intended stable version with both assets. Do not mark an older maintenance release
as Latest. Existing installations need one manual replacement to adopt the new
metadata. Tampermonkey controls update checks and their interval. Development
previews use these same URLs; disable their update checks to keep them pinned.
The release approval gate still controls when new bytes become available. Installation
instructions live in [README Quick Start](../../README.md#quick-start); full
third-party notices live in [Acknowledgments](../../README.md#acknowledgments) and
the Actions review package. They are not appended to the userscript. Release notes link to that commit's README.
GitHub supplies source archives separately.

The Actions review artifact still contains the library tarball, notices,
installation reference, build manifest, `release.json`, `RELEASE_NOTES.md` and
`SHA256SUMS`. All files are verified before publication; `release.json.assets`
explicitly selects the userscript and metadata companion for public upload. Notes are prepared and
checksummed before approval and are not regenerated during publication. The build
job has read-only contents/PR access; only the approved publish job can write
Releases. No npm publication is performed.

After dependency changes, refresh README Acknowledgments with
`node scripts/package-notices.mjs --update-readme` after building. Normal packaging
refuses stale acknowledgments and records notice input identities without changing
the built userscript or its hash. Dependency license comments already emitted by
the bundler are retained. Historical installed qualification does not transfer
to a new build.
The owner withdrew the earlier v0.1.0 Release and tag and requested a replacement
using the current TSDM UI name and `tsdm-ui.user.js` filename. The replacement
reuses that version with different bytes; earlier downloaded files and their
recorded hashes remain historical evidence. Follow README Quick Start when
replacing the old TSDM Workspace script identity. This explicit replacement does
not change the normal policy against moving a published tag.

Artifacts are retained for 30 days. Download evidence you need to retain longer.
If they expire, prepare a fresh run and review its actual bytes. Never move a
published tag. A changed tag, missing file or bad checksum blocks publication;
an existing Release is not overwritten. A failed publication may leave a partial
draft after approval: inspect its actual state before deciding how to recover,
rather than blindly rerunning or replacing assets.

## Replay automation checks

After building a `v0.1.1` preview and generating notices as above:

```sh
npm run test:release -- dist /tmp/tsdm-release-cli-check
RELEASE_TAG=v0.1.1 npm run test:e2e -- tests/e2e/foundation.spec.ts
npm run test:consumer
```

The CLI suite creates a disposable local Git repository with 100 fixes. Its
receipt and report prove version selection, changelog boundaries, artifact
hashes and refusal paths; it never contacts GitHub or creates a remote tag.
Playwright produces its normal repeatable synthetic receipt and screenshots.

The existing `docs/releases/0.4.0/` files describe historical development
candidates and remain unchanged. Development installs labelled 0.4.0 need
manual replacement when adopting the numerically lower public 0.1.x sequence.
