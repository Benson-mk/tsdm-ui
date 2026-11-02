# Editor provenance

Selectively adapted from tsdm-ui-experiment commit `c8348e6c4c4aaf0011f174394733be3d580f59e5`, committed bytes (not its dirty working tree). Historical experiment tests are not acceptance evidence.

| Input                      | SHA-256                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| src/editor/bbcode.js       | 48fbd102dc711d05b4c7dee084a905e8c6247059d68d5e91695688e9c9e5c9c8 |
| src/editor/model.js        | ea6bacfaf38a610988e10bd19697fab45cc82adca53debaec1b395d920db8a25 |
| src/editor/preservation.js | 1f8586935321e8349749d8c354bd697f51a620da85ed6ee5f14ca61619f12be6 |
| src/editor/commands.js     | 30eaa189f3cdedf8c117f14201595a78e7e06f82e3b80d979f5406a92def12ef |
| src/editor/session.js      | 3f1e840156a9995d68636dfbbf2476ce5789b695c55f65f622753b29b06268d5 |

Retain DOM-free source parsing, lexical provenance, document and session ownership. Replace the coupled editor shell with a Vue adapter. The five core modules are migrated to TypeScript and checked by the existing strict application compiler, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. `types.ts` describes the internal source AST, lexical frames, provenance/ranges and import/export records. Commands, session snapshots, history and baselines are checked implementation code; `EditorSession` derives from `createEditorSession`, and no adjacent declaration facade remains. ProseMirror owns its schema/attribute runtime boundary; fixed schema entries and bounded indexes use local non-null assertions where established invariants guarantee them. No broad `any`, `nocheck`, compiler relaxation or lint exclusion is introduced. Tables and hidden block semantics remain preserved by the shared core; their controls are owned by following tickets.

## Adaptations and native source boundary

The parser recognizes indentation and complete unquoted multiword font names. New lists use `[list]`/`[list=1]` with implicit `[*]` items; imported list spelling stays untouched. New argument-bearing formats use unquoted native attributes. A named quote uses an ordinary `[quote]` block with a visible author line instead of inventing a quote-author attribute. The session additionally exposes a source-coordinate recovery selection without changing its active mode. Formatting-only changes and harmless unused-binding/regex adjustments keep the port under the repository's normal lint and formatting checks.

The experiment's retained `test/fixtures/attachment-native/editor.js` (list insertion around lines 771–789) and `bbcode.js` (rendering around lines 80–119) establish those captured native spellings. They are reference evidence, not newly executed server qualification. Their current file identities are:

| Reference input             | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| attachment-native/editor.js | `6dc9da1eedd00ad96a2e3637b03e5ceeb44c7079b32f596d392069844b54e58b` |
| attachment-native/bbcode.js | `fbe809f199f85a90bd58138a3df4669c8f3407593239c8be934ed3e97697bff7` |

The library's raw-source API remains usable without importing ProseMirror or any browser view. All ProseMirror objects remain outside Vue's deep reactivity. The Vue adapter owns only inert DOM, focus, keyboard and composition event handling.

## Added locked dependencies

- `prosemirror-commands@1.7.1` (MIT).
- `prosemirror-keymap@1.2.3` (MIT).
- `prosemirror-model@1.25.11` (MIT).
- `prosemirror-schema-list@1.5.1` (MIT).
- `prosemirror-state@1.4.4` (MIT).
- `prosemirror-tables@1.8.5` (MIT).
- `prosemirror-transform@1.10.5` (MIT).
- `prosemirror-view@1.42.3` (MIT).

All package sources remain bundled locally. No CDN runtime or remote editor script is introduced. Release packaging must retain applicable third-party notices when publishing the complete application.

The typing migration also replaces in-place tag-to-raw mutation with a typed raw-node replacement at the same parent position, initializes open-tag end offsets to the complete source limit, uses complete empty export records during conversion failure/disposal, and validates missing command position/name fields before using them. These preserve ordinary valid behavior while keeping invalid inputs at explicit boundaries. Static checks and complete-application preservation cases are rerun against the rebuilt executable; earlier evidence identities remain historical.

## Reconstruction on accepted issue #22

The preserved issue #23 patch SHA-256 is `4e86ecd1b42a850768e935221bfb36b3db2bbbdd024fd404ec100b1209609170`, originally based on `4cadc771e8c246bf5d487cb8cc09bc33c762ec99`. It is selectively applied on `4f359b65c60ec83aaf69e782be22190f8c359c87`. The initial extracted source manifest is retained separately from the final handoff so integration can preserve unrelated later-ticket work.

The broad `81de77c7` candidate retained the original strict-TypeScript issue #23 bytes for `PostEditor.vue`, `editor-dom.ts`, `editor-strings.ts` and all six `src/editor/*.ts` files. Shared `SourceWriting.vue` and `workspace/writing.ts` combine the ordinary editor with accepted #21/#22 behavior. Tests add actual visual saving in reply, addressed Quick Quote and owned edit; the viewport check compares displacement against its measured initial offset with unchanged one-pixel tolerance. The historical dependency lock is still the current exact application lock. The library entry remains byte-identical to accepted #22 at SHA-256 `2de2a0405871eae1d932115f804cec7c014788f2ab8cf79f96c41dae3bcf416f` and version `0.6.0`.

## Final localization correction

Final userscript `d5f25133e1b5045c7ec005c7aa9844d62176d7dc7e3ccbcd3bab96051d8595f8` changes three presentation files relative to the broad `81de77c7` candidate: `PostEditor.vue` renders the session explanation through `t(state.message)`; `editor-strings.ts` maps known authored diagnostics and four Chinese aliases; `layouts/strings.ts` supplies the adjacent publication-readiness translations. All six core modules, `editor-dom.ts`, and the complete PostEditor script/input/composition/selection/event handling remain byte-identical to the historical qualified input path. Workspace logic and dependencies are unchanged. Unknown diagnostics pass through unchanged. Final source and artifact manifests retain this bounded delta separately from the initial extraction and earlier installed evidence.
