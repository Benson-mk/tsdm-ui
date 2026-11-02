# Selective source provenance

The production implementation was newly written in TypeScript/Vue. It adapts the following narrow extraction/trust rules from the experiment rather than copying its shell, navigation policies or test suite. The actual inspected working-file hashes pin the source, including the modified response helper; experiment HEAD alone does not reproduce that helper.

Experiment HEAD: `c8348e6c4c4aaf0011f174394733be3d580f59e5`.

| Source                        | SHA-256 of inspected bytes                                         | Adapted rules                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/integration/parsers.js`  | `5716cafaacc12b7161a5529140ab0d0e1c4de67a975b7adb23da9c41928d72b5` | Authoritative `post_N` wrapper identity, body alternatives, explicit rejection of partially malformed populated posts, author/floor/date extraction             |
| `src/integration/response.js` | `cb7b078333c811d955d046d83952257ba3de4ed9662daf7bf58aa52fa82ee641` | Native account-header authority and distinct missing/login/permission/challenge/invalid response outcomes; fetched scripts are never evaluated                  |
| `src/integration/content.js`  | `83a53bcc6eefa505167811f7f3320377c7e87ab383b524f851fb5ad79cc2b8a7` | Reconstruct semantic tags/approved attributes; reject executable/unsafe URLs; do not auto-fetch ambiguous image/attachment handlers; explain unsupported embeds |

The public portable implementation replaces the experiment's DOM-bearing models with parse5 interpretation and serializable content nodes. Unknown wrapping semantics are explained, rather than inheriting a silent unwrap. Account headers inside post content do not establish the acting account.

The preferred `tsdmapp=json` representation follows the accepted [#8 resolution](https://github.com/Benson-mk/tsdm-ui/issues/8#issuecomment-6238156156), its bounded guest comparison, and the pinned client source `5e905448d83b420850fca39b69351ecbd2b4f021:lib/features/tsdmapp/tsdmapp_api.dart` (SHA-256 `90dce02dd0d1a6eb084b3ac3a9a490c83848d9bd3e863812d5d39fe475b30319`). JSON `document`/`head` stay inert; the top-level numeric uid supplies account identity, and thread.tid/canonical metadata must agree with the requested thread. A useful ordinary HTML answer is consumed without a second request. Historical observations are provenance, not acceptance of the new candidate.

The accepted visual reference is repository object `1b82574:DESIGN.md`; the separate root working copy remains user-owned. The initial layout uses the approved typography, surfaces, spacing, pills and content treatment; #17/#18 extend the complete workspace geometry and appearance controls. Reka 2.11.0 was selected after current peer/version checks and is qualified by the production dialog journey rather than by the old HTML prototype.
