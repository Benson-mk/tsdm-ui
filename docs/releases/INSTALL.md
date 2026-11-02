# Install a tagged TSDM Workspace build

1. Download `tsdm-workspace.user.js`, `SHA256SUMS`, and the other attached assets
   from the specific approved GitHub Release. Compare each downloaded file with
   its SHA-256 entry (`shasum -a 256 FILE` on macOS; `sha256sum FILE` on Linux).
2. Install Tampermonkey and import `tsdm-workspace.user.js`. Keep one enabled
   TSDM Workspace script. The script runs on `https://www.tsdm39.com/` and uses
   the current browser account. It bundles its runtime; updates are manual.
3. Check the installed script's version against the release tag and compare an
   exported script with the published checksum. Reload a forum page to use it.

Before replacing or downgrading a script, finish writing, save a supported forum
draft, or copy the text somewhere you control. Browser page-session recovery is
conditional; a refresh, close or restart can lose local writing. An unresolved
publication attempt is not permission to submit again. Check its result first.

For emergency access to the native forum, disable the userscript or add
`tsdm-native=1` to the forum URL query while preserving the existing destination.

The `tsdm-forum-client-*.tgz` asset is the separately versioned JavaScript library,
not another userscript. Pin its exact artifact when consuming the public
`@tsdm/forum-client` export. No npm registry publication is performed.

`release.json` records the source commit and selected versions; `build-manifest.json`
records the executable hash and dependency lock identity. Checksums establish
file identity, not a security certification. New builds need their own affected
qualification before publication. Historical macOS evidence does not establish
Windows support or actual Tampermonkey software-update recovery, which remain
deferred. Consult the repository's ADR0002 and release evidence for exact scope.
