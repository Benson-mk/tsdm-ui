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
artifact to inspect the userscript, library tarball, notices, installation guide,
build manifest and provenance. A preview has `preview: true` in `release.json`
and cannot be published by this workflow.

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

1. Ensure the intended source commit is on GitHub and has passed the applicable
   checks. Check out that exact commit locally.
2. Create and push your chosen, unused stable version tag:

   ```sh
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

3. Wait for the build job. Inspect the downloadable artifacts and run summary.
   The `publish` job waits at the **github-release** environment. No draft or
   published Release exists yet.
4. Complete the applicable ADR0002 qualification and public-content review
   against these exact files. Build/synthetic passes alone are not installed
   browser qualification. Do not apply historical 0.4.0 verdicts to new bytes.
5. In the run, select **Review deployments → github-release → Approve and
   deploy**. Only **Benson-mk** is configured as required reviewer. Approval of
   your own tag-triggered run is allowed; administrator bypass is disabled.
6. The approved job downloads the same immutable artifact, checks every checksum
   and the remote tag's commit, then creates the GitHub Release with its build
   assets and prepared notes. It does not rebuild. Verify downloaded assets and
   installed source after publication before claiming download/install success.

Do not approve a run merely to test the pipeline: approval publishes a Release.
Reject or cancel an unwanted run. No release has been authorized by installing
this automation. A repository administrator can still change workflow or
environment configuration; keep those protections in place.

## Notes, assets and retry behavior

The changelog lives in the GitHub Release description. It lists non-merge
commits since the nearest reachable stable `vMAJOR.MINOR.PATCH` tag; the first
release includes reachable history. The comparison boundary is a tag, even if
that earlier tag has not been published as a Release. No root CHANGELOG.md is
committed. Only stable numeric tags are supported; prerelease policy is future
work.

Assets are the installable `tsdm-workspace.user.js`, independently versioned
`tsdm-forum-client-*.tgz`, `THIRD_PARTY_NOTICES.md`, `INSTALL.md`,
`build-manifest.json`, `release.json`, `RELEASE_NOTES.md`, and `SHA256SUMS`.
The generated notes are also in the review artifact and covered by its checksums. GitHub supplies source
archives separately. No npm publication is performed.

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
