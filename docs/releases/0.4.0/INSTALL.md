# Install, update and recover TSDM Workspace 0.4.0

This is a manually installed Tampermonkey userscript for
`https://www.tsdm39.com/`. The application uses the account already signed in to
the forum in that browser. It does not provide another authentication service.

The first-release scope is macOS on ARM, using stable Chrome, Edge and
Tampermonkey. The evidence declares the versions actually observed: Chrome
156.0.8078.48 in the accepted historical qualification, Edge 156.0.4314.58 in the
final candidate qualification, macOS 15.6/15.6.0 and Tampermonkey 5.5.1. Consult
the release report for the exact evidence boundaries. Windows is not yet
qualified. Recovery through an actual Tampermonkey software update is unverified.

## Install

1. Obtain the files from the specific authorized GitHub Release. Verify the
   downloaded files using that release's `SHA256SUMS` before installation.
   Local preparation of this package does not establish a GitHub download.
2. Install stable Tampermonkey in the selected browser. Review its requested
   permissions and the browser's userscript enablement instructions. Do not
   weaken browser security settings to make a failed check pass.
3. Import `tsdm-workspace.user.js` into Tampermonkey. Its stable identity is
   **TSDM Workspace**, namespace `https://github.com/Benson-mk/tsdm-ui`, version
   **0.4.0**. Keep exactly one enabled copy. All code and styles are bundled;
   there is no runtime CDN or automatic update URL.
4. Review the metadata: match `https://www.tsdm39.com/*`, exclude
   `https://www.tsdm39.com/*tsdm-native=1*`, grant `GM_registerMenuCommand`, run
   at `document-end`. This does not qualify other forum mirrors or origins.
5. Export the manager's stored script. If it exports a ZIP, extract only the
   script source entry as bytes without line-ending or encoding conversion.
   The source must be **1,710,524 bytes**, SHA-256
   `9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea`.
   A matching version label alone is insufficient.
6. Reload an ordinary matching forum page. Confirm one workspace, the intended
   current account and usable Boards navigation. A nonmatching page must remain
   untouched. The application's About dialog is supporting version information;
   retain the manager export for exact identity.

The forum-client library is a separate ESM package, version **0.13.0**. Its
tarball is for JavaScript consumers and is not another userscript. Pin the exact
tarball and consume only the public `@tsdm/forum-client` export. The application
and library have independent versions; no registry publication is implied.

## Replace a userscript manually

Before replacement, finish writing, confirm a supported **forum draft**, or copy
the complete source and relevant options to a location you control. Replies and
own-post edits do not acquire an invented forum-draft operation. Preserve the
identity and uncertainty of any pending or unresolved attempt.

Disable the old entry while replacing the same stable script identity. Import
the exact new asset, check one enabled copy, export and hash its stored source,
then reload. Review recovered writing, destination, account and options. A
recovered writing context pauses sending until a fresh check. Never interpret a
reload as permission to resend an uncertain attempt; use the deliberate result
check and read its limitations before deciding on a new attempt.

The first-release replacement evidence uses retained development candidates.
There is no previous public release, and those fixtures are not recommended
rollback versions. Different development bytes sometimes shared the display
version 0.4.0; the exact hash identifies this first public payload. Future
distributed code must use a new version and receive its own qualification.

## Recovery and downgrade

Recovery uses one browser page-session record. The browser may copy it into an
inherited tab or restore it after a close, but continued availability is not a
durability guarantee. Copied tabs subsequently diverge. Same-origin scripts can
access this record. Refresh, closing or restarting the browser can lose local
writing when the browser does not supply a compatible record.

The final installed Edge restart recovered no writing: three restored opaque
destinations reported unavailable snapshots and one restored the plain index.
This is an accepted observation of browser-controlled absence, not a claim that
writing survives restart. Save a supported forum draft or copy source before
relying on a lifecycle transition. Actual manager software-update recovery is
separately deferred and unverified.

If recovery reports incompatible or malformed data, inspect/copy the recoverable
source before deliberately resetting it. An older application may not understand
newer state. Do not downgrade with an unresolved writing context or assume an
older script can migrate it. Unknown attempts remain unknown; checking or
resetting local storage must never be treated as server rollback.

## Emergency native access

Use the Tampermonkey menu's native-forum action when available. Independently of
successful application startup, add `tsdm-native=1` to the current URL's query,
preserving its existing query fields and any exact-post fragment. For example:

```text
https://www.tsdm39.com/forum.php?mod=viewthread&tid=EXAMPLE&tsdm-native=1#pidEXAMPLE
```

The examples are placeholders, not forum records. The exclusion works before
the workspace starts. Alternatively disable the script in Tampermonkey and
reload. Keep the destination and recoverable writing source before changing
anything. To re-enter, enable the single intended script, remove only the native
escape parameter and reload a safe destination.

Disabling or uninstalling the userscript does not remove forum posts, forum
drafts, attachments or red packets. Remote cleanup is a separate, explicit
forum action. The first release can recover through disable/uninstall and native
access even though no earlier supported public package exists.
