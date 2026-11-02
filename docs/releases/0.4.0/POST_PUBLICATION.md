# Publication handoff and asset verification

This procedure is prepared but unexecuted. Publication requires a separate
explicit owner authorization. Do not create a Release, tag, push source or change
the specification parent merely because this file exists.

## Before an authorized publication

Use the reviewed `release-request.json` and `SHA256SUMS` beside the staged GitHub
assets. The proposed tag is `v0.4.0` and the target is the qualified source commit
`33c32655f583aa3c0738d22fbd081fce39df69c5`. Check whether the tag or Release already
exists. If it does, stop and reconcile its identity; do not overwrite it.

Confirm the target commit is available on GitHub. It was a local commit during
qualification. Any needed source push belongs to the later authorized operation.
Do not select a dirty checkout or rebuild the userscript while preparing a
Release. Re-run the local payload verifier with `--require-qualified` and check
all staged asset hashes before upload. Use the exact prepared notes and assets.

An authorized publisher can create a draft Release for inspection first; making
it public must remain within that explicit authorization. Preserve the exact
tag, commit, asset IDs, upload times, sizes and server-provided download URLs in
a separate publication receipt. Never label local copies as downloaded assets.

## Download the published assets into an empty directory

After the Release exists, use a new directory and download from that exact tag:

```sh
mkdir release-download-check
cd release-download-check
gh release download v0.4.0 --repo Benson-mk/tsdm-ui
shasum -a 256 -c SHA256SUMS
unzip tsdm-workspace-0.4.0-release.zip
node tsdm-workspace-0.4.0/verify-release-payload.mjs tsdm-workspace-0.4.0 --require-qualified
cmp tsdm-workspace.user.js tsdm-workspace-0.4.0/frozen/tsdm-workspace.user.js
cmp tsdm-forum-client-0.13.0.tgz tsdm-workspace-0.4.0/tsdm-forum-client-0.13.0.tgz
cmp THIRD_PARTY_NOTICES.md tsdm-workspace-0.4.0/frozen/THIRD_PARTY_NOTICES.md
```

Use pinned Node 24.22.0 for the verifier. Also compare the downloaded
`SHA256SUMS` itself with the reviewed staged copy's separately retained hash;
downloading an asset and its checksum from the same source only checks their
internal consistency. Record the actual release URL, each downloaded filename,
size and SHA-256, tool versions and the verification exit codes.

## Install the downloaded userscript and read back its identity

Follow `INSTALL.md` in a suitable clean profile, with stable Tampermonkey and
the selected browser. Obtain the owner's authorization before changing an
existing profile or interrupting active writing. Confirm the actual OS, browser
and manager versions, matching and nonmatching pages, the declared metadata,
exactly one enabled entry and a fresh single workspace mount.

Export the manager-stored source after import. Extract a ZIP source entry
without rewriting it. Compare its size and SHA-256 with the _downloaded_
`tsdm-workspace.user.js` and the reviewed hash:

```text
1710524 bytes
9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea
```

Keep the actual download receipt and an authored install attestation separate
from this preparation evidence. Preserve any mismatch or failure. A later
browser/manager version needs the affected host checks; downloading the same
script does not qualify a new runtime. New forum writes, search charges, notice
loads, purchases or cleanup need their own applicable authorization.
