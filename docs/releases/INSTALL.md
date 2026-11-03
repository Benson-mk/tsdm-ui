# Install a tagged TSDM UI build

Follow [README Quick Start](../../README.md#quick-start) for installation, automatic or manual
updates and emergency native-forum access. Install `tsdm-ui.user.js`; its runtime is included.
The companion `tsdm-ui.meta.js` contains only metadata for update checks and is
not the script to install.
See [Acknowledgments](../../README.md#acknowledgments) for readable license text.

This file is retained inside the Actions review package. Reviewers can compare
the userscript and an exported installed copy with `SHA256SUMS` using
`shasum -a 256 FILE` on macOS or `sha256sum FILE` on Linux. `release.json` records
the selected tag and commit; `build-manifest.json` records the script hash and
dependency-lock identity. Checksums establish identity, not qualification.

The independently versioned `tsdm-forum-client-*.tgz` in the review package is a
developer library, not a userscript or required installation step. It is not
uploaded as a public Release attachment or published to the npm registry.
