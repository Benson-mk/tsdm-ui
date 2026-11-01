# TSDM Workspace 0.4.0 release evidence

This package prepares the exact qualified application and public library for a
separately authorized GitHub Release. Read `report.md` for the qualification
verdict and limitations, `receipt.json` for individual observations and authority,
and `coverage.json` for all 111 requirement rows. `INSTALL.md` covers manual
installation, replacement and recovery. `POST_PUBLICATION.md` is an unexecuted
download/hash/install procedure.

The application is 0.4.0; the library is independently versioned at 0.13.0. The
userscript SHA-256 is
`9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea`, from
commit `33c32655f583aa3c0738d22fbd081fce39df69c5`. Every executable is copied
from retained qualified files. The original freeze's `releaseEligible: false`
records the packaging-only boundary of that historical operation; this package
does not rewrite it to manufacture a release verdict.

## Verify the package

Use Node **24.22.0** and npm **11.21.1**. Run from the package's parent directory:

```sh
node tsdm-workspace-0.4.0/verify-release-payload.mjs tsdm-workspace-0.4.0 --require-qualified
```

The verifier checks the exact relative-file inventory, sizes/hashes, reviewed
allowlist, text sanitation, frozen output identities, original library tarball
members, replay archive members, references, required coverage, current versus
historical identities, deferred checks and final sign-offs. Without
`--require-qualified`, a truthfully pending-review package can pass structural
verification; that is not qualification. A hash is an integrity check, not a
signature or proof that a behavioral assertion happened.

`manifest.json` includes every file except itself. The separately staged GitHub
asset checksums cover the final ZIP containing that manifest. `public-files.json`
records the reviewed content categories; it is not permission to copy additional
files. Runtime data produced by a replay must go into a new directory, so it
does not invalidate or overwrite this immutable inventory.

To repeat the complete packaging CLI regression suite against disposable copies
of this payload, choose a new output directory outside the package:

```sh
node tsdm-workspace-0.4.0/check-release-payload.mjs tsdm-workspace-0.4.0 packaging-replay
```

It checks 19 positive/negative scenarios and retains its own receipt, report and
manifest. It removes only the temporary payload copies it creates. It does not
change the input package, use a browser account or publish anything.

## Replay the complete application suite

Install stable Microsoft Edge and have `openssl` available for the disposable
local TLS redirect fixture. Use the pinned Node/npm pair. Extract the selected
exact source snapshot into a **new** directory outside this evidence package:

```sh
mkdir replay-work
cd replay-work
tar -xzf ../tsdm-workspace-0.4.0/replay/workspace.tar.gz
mkdir -p workspace/dist
cp ../tsdm-workspace-0.4.0/frozen/tsdm-workspace.user.js workspace/dist/tsdm-workspace.user.js
cd workspace
npm ci
npm run typecheck
npm run test:e2e -- --list
npm run test:e2e
```

Do not run a build to supply the replay executable: use the included exact
userscript. The snapshot contains 108 exact committed source/test/configuration
files, including the compressed historical replacement fixture. Its member
identities are in `replay/workspace-inputs.json` and match the clean freeze's
input manifest. Historical documentation, personal data and Git metadata are
excluded; this is a replay snapshot of selected inputs, not a claim to contain
every file in the source commit.

The original successful suite has **1,118 cases, zero retries**. The real
layout → workspace → forum client → host is exercised; only external network
responses are substituted. The contexts are offline by default, with a local-only
proxy for the real redirect fixture. No live account is needed and no forum
effect is authorized. Screenshots come from authored synthetic pages. The run
creates `evidence/runs/<run-id>/receipt.json`, `report.md`, a manifest and
inspectable artifacts in the new workspace. Keep failures and retries as separate
results; do not overwrite the included historical success.

The full retained suite is reused because its executable and test inputs are
unchanged. Issue #40 separately verifies the newly packaged clean setup and
representative replay. Running all cases yourself supplies a new observation;
it cannot reproduce private historical native sessions or qualify another host.

## Replay the clean Node consumer

From a new replay directory, extract the independent consumer bundle:

```sh
tar -xzf ../tsdm-workspace-0.4.0/replay/consumer.tar.gz
cd consumer
npm exec -- node replay-consumer.mjs .
```

The retained replay command installs the exact 0.13.0 tarball and a locked
TypeScript 6.0.3 compiler into another temporary directory, typechecks without DOM
or ambient browser declarations, runs the public API fixtures and compares the
complete deterministic observations and installed artifact files. It produces a
separate sibling receipt/report/manifest. Registry access or a populated npm cache
is required for locked dependencies; no credentials or live forum access are
needed. The original consumer bundle contains deliberately authored dummy form
values. Those fixtures are not native captures or credentials.

The original consumer and independent replay passed **20 aggregate checks and
50 named family outcomes**. All eight members of its unchanged tarball equal
the final frozen library. This establishes the library boundary, not a CLI/MCP
application or authentication mechanism.

## Repeat installed checks

Use `procedures/installed.md`, `INSTALL.md` and the controlling #9/#38 acceptance
matrix. Record exact source bytes and actual OS/browser/manager versions. Choose
your own capable account, permitted records and files, and obtain applicable
authorization before forum writes, searches, notice loads, spending, deletion or
session changes. Use fresh independent authority for effect readback. Keep raw
authenticated evidence private; emit authored summaries with local aliases.

Chrome's accepted historical conclusion is preserved in
`evidence/chrome-history.json` and `procedures/historical-chrome.md`. Its old
temporary final bundle is unavailable. Current synthetic replay and new native
observations cannot recreate it. Windows and actual manager-update recovery are
deferred, explicitly unverified and outside the current gate.
