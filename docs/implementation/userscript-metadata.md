# Userscript update metadata

Task: generate a metadata-only update asset and connect future approved releases to Tampermonkey update checks. Requested on 2026-11-03; no existing matching GitHub issue was found.

## Failure inventory and verification plan (before implementation)

- The metadata file is missing, stale, or includes executable code: compare its complete contents with the built userscript header and refuse inconsistent release packages.
- The header points to a branch, a version-pinned URL, or the wrong asset: assert exact stable GitHub Release URLs in the built-artifact browser journey.
- The tag version differs between application, metadata and manifest: retain version checks and verify identical headers.
- A modified metadata file bypasses its manifest: exercise the complete packaging CLI with missing, mismatched and hash-inconsistent metadata.
- The approval artifact contains metadata but publication omits it: assert the exact two-file release asset list and inspect the workflow allowlist.
- Adding update metadata breaks freeze packaging or historical replacement evidence: update current freeze expectations, preserve earlier script bytes, and run the freeze CLI and replacement browser journeys.
- Documentation promises immediate updates, automatic migration from old names, or successful hosted checks: explain manager settings, one-time manual replacement, increasing versions, and verification limits.

Acceptance is build/distribution plumbing: matching generated metadata; stable update/download URLs; checked two-asset release packaging; consistent current documentation; passing affected CLI/browser/static checks; final advisor review. Publishing and actual installed auto-update qualification require a future approved release and are not claimed by this task.

## Trade-offs

1. Use the existing vite-plugin-monkey metadata generator rather than a custom extraction build step. This avoids duplicate generation logic while tying output formatting to the pinned plugin; packaging compares the generated file with the actual script header.
2. Use GitHub Releases latest/download URLs rather than main-branch files or tag-pinned URLs. Updates follow approved stable releases, with GitHub availability, latest-release selection and manager polling determining availability. Maintainers must keep Latest on the intended stable release.
3. Publish a second small asset and verify its bytes alongside the script. Update checks transfer less data, at the cost of maintaining the two-file release contract.
4. Retain the owner-selected version policy and existing script identity. Old installations need one manual replacement to adopt the new metadata; development candidates and intentional rollbacks should disable update checks to stay pinned. No automatic version bump or separate preview identity is introduced.
5. Verify the real build/packaging CLIs and affected synthetic browser journeys locally using the existing dependency installation and pinned Node/npm pair. This keeps checks focused and repeatable without publishing or modifying installed scripts; a fresh dependency install, hosted download and actual manager auto-update behavior are not established by these runs.

## Verification and acceptance — 2026-11-03

- [x] Production build emits matching userscript and metadata-only header with the intended stable update/download URLs. Verified using `RELEASE_TAG=v0.1.1`; the repository default version remains unchanged.
- [x] Release preparation copies and checksums both assets; refuses missing, stale, executable or manifest-inconsistent metadata. All 18 complete tag-release CLI scenarios passed.
- [x] Current freeze tooling accepts both approved URLs and preserves its restrictive grant/external-runtime checks. All 22 corrected freeze CLI scenarios passed.
- [x] Built application startup and historical candidate replacement remain functional. All 32 Edge foundation/replacement E2Es passed; the metadata header is retained as a browser-run attachment.
- [x] Current installation, release and architecture documentation explain the new channel, initial adoption, pinning and qualification limits.
- [x] Typecheck, lint, formatting, actionlint and Git diff checks passed. Evidence verification confirmed exact file coverage, safe relative paths, sizes and hashes for all 41 browser evidence files.
- [x] Final BDFL advisor review used gpt-6.1-sol at xhigh with `validate-gpt-code-review`. Both evidence-backed findings were corrected and the advisor confirmed no outstanding findings or additional distinct trade-offs.

The failure inventory and new release/browser expectations preceded feature code.
The baseline packaging attempt failed because `tsdm-ui.meta.js` did not exist;
its fixture mutation also stopped with ENOENT, so that red attempt has no completed
suite receipt. Successful runs use Node 24.22.0 and npm 11.21.1.

Retained local artifacts (ignored by Git):

- `evidence/runs/userscript-metadata-release/{receipt.json,report.md}`: 18 passed packaging cases and their prepared outputs/checksums.
- `evidence/runs/userscript-metadata-freeze/`: original 21-case run. Advisor found that its bad-grant and external-CDN cases stopped prematurely at the new companion comparison; this run does not substantiate those two original refusal paths.
- `evidence/runs/userscript-metadata-freeze-corrected/{receipt.json,report.md}`: 22 passed cases, including exact grant/require refusals with matching headers and a separate inconsistent companion.
- `evidence/runs/2026-11-03T02-58-40.875Z/`: browser receipt, report, hashed manifest, source snapshots, synthetic screenshots and the generated metadata attachment.

The advisor's other finding was a stale README build paragraph claiming no update
URLs were emitted; it now documents both outputs and their identities. These
corrections changed documentation and CLI fixtures, not the executable candidate.

The verified preview has a 1,710,653-byte script (SHA-256
`5b58df03d032553271a0c194b748db59c27418549d1b6ae50b41b7eb1ac38e64`)
and a 546-byte metadata companion (SHA-256
`2e3ded33a689209b94097b8473ace06e48f71da1c501dfb2e8026b4ce259e92e`).

Replay with the pinned Node/npm pair and fresh output directories:

```sh
npm ci
RELEASE_TAG=v0.1.1 npm run build
node scripts/package-notices.mjs
npm run test:release -- dist /tmp/tsdm-metadata-release-replay
npm_execpath="$(command -v npm)" node scripts/check-release-tooling.mjs /tmp/tsdm-metadata-freeze-replay freeze
RELEASE_TAG=v0.1.1 npm run test:e2e -- tests/e2e/foundation.spec.ts tests/e2e/replacement.spec.ts
npm run evidence:verify -- evidence/runs/REPLACE_WITH_BROWSER_RUN
```

No release was published and no installed script was changed. The stable metadata
URL becomes usable only when an approved Latest release contains the companion.
Actual hosted download and Tampermonkey auto-update qualification remain separate
from the completed local build/distribution acceptance above.
