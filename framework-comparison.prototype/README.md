# Vue / React hands-on comparison

**Throwaway integration prototype. Framework choice remains open.** Prepared for [Select the framework and development toolchain](https://github.com/Benson-mk/tsdm-ui/issues/7) after the human asked for a small hands-on comparison. This is a primary source for that decision, not production application code or a second workflow specification.

Both versions host the same frozen source-preserving ProseMirror core and synthetic writing context. Their appearance and interactions are deliberately alike so the comparison exposes integration work. The accepted workspace geometry is not reopened.

## Try it

From `framework-comparison.prototype`:

```sh
npm ci --ignore-scripts
npm run dev
```

- [Vue](http://127.0.0.1:4177/?framework=vue)
- [React](http://127.0.0.1:4177/?framework=react)
- [React with unmodified stock dialog keyboard behavior](http://127.0.0.1:4177/?framework=react&stockDialog=1)

Open the candidates in separate tabs. Each starts with the same sample; writing is memory-only and a reload resets it. No account or forum is contacted. The first load defaults to Vue for navigation convenience, not as a selected framework.

1. Switch visual/source modes several times and inspect Complete source readback.
2. Type in the visual editor, change appearance, visit Boards overview, then Return to writing and Undo.
3. Edit source, detach the editor view, attach it again and Undo. The lifecycle counters distinguish the view from the writing context.
4. Merge the first table row, then split its first cell. Check that opaque markup and the synthetic attachment reference remain.
5. Open Writing options. Tab and Shift+Tab through its controls, press Escape and check focus returns to the trigger.
6. In React, enable Use stock Radix focus behavior and repeat the dialog check to reproduce the observed limitation.
7. If native IME behavior matters to your choice, try your actual Chinese input method in each editor. Automated insertion of Chinese characters does not establish this.

## What the experiment established

| Observation                                                                                                                                                                                                             | Consequence                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both wrappers preserve the complete fixture source through no-op mode switches, retain writing and undo across view teardown/re-entry, and keep the same editor DOM across appearance and overview changes.             | Neither framework blocked this narrow editor integration. This is not complete BBCode, selection/caret or retained-writing lifecycle qualification.                                                                                                             |
| Vue uses `markRaw` at the external instance boundary, `shallowRef` for UI snapshots and mount/unmount hooks. React uses `useSyncExternalStore` and one Effect to mount/clean up the view.                               | Both have a small understandable integration seam. The shared session is owned outside transient views; neither view cleanup discards it.                                                                                                                       |
| React Strict Mode exercises a development setup → cleanup → setup cycle. Active views still settle at one.                                                                                                              | Its extra development mount count is expected evidence of cleanup, not duplicate active editors or a production performance result.                                                                                                                             |
| Reka 2.11.0 passes the tested ShadowRoot dialog keyboard path. Radix dialog/focus-scope 1.3.1 lets Tab escape with its stock behavior. Its key handler reads `document.activeElement`, which points at the shadow host. | The React comparison adds a small local ShadowRoot-aware Tab-edge handler. This is a component/host integration difference, not a fundamental React restriction. Stock behavior remains reproducible through the checkbox and dedicated expected-failure probe. |
| Reka emits development warnings because its title/description diagnostic uses `document.getElementById`; those IDs are inside the ShadowRoot.                                                                           | The browser probes separately verify the dialog's accessible name/description. Warnings remain visible; that check is not a full accessibility or screen-reader audit.                                                                                          |
| `vue-tsc` 3.3.13 fails with TypeScript 7.0.2 (`ERR_PACKAGE_PATH_NOT_EXPORTED`, `typescript/lib/tsc`), despite its broad declared peer range. Both wrappers type-check with TypeScript 6.0.3.                            | Pin and test the tool set. This prototype uses TypeScript 6.0.3 for both candidates; latest-package declarations alone are insufficient.                                                                                                                        |
| Vite 8.3.4 and vite-plugin-monkey 8.1.1 build both localhost-only payloads with no application runtime `@require`/`@resource` metadata. Both payloads pass the same synthetic-page journeys.                            | A concrete bundled build path works for this fixture. Direct page injection does not exercise Tampermonkey installation, metadata interpretation, grants, CSP or update behavior.                                                                               |

The source-only follow-up also identified Tiptap's prebuilt React UI catalog as a potential React-specific reuse option. It was **not** trialled here. Its fit with the custom lexical editor schema, current React versions, licensing and the accepted visual/source contract remains unproven. This experiment cannot choose direct ProseMirror over Tiptap by implication.

No decision should be made from implementation line counts, framework popularity, the old project's test volume, build timing or these partial payload sizes. A library integration problem can also be addressed by another component or host choice. The framework and production dependency choices still need the human's judgment.

## Evidence and replay

[PLAN.md](PLAN.md) records the question, failure modes and scoped acceptance before implementation. The main journey probes were written before the wrappers. Initial checks failed against the empty page; the first full implementation run passed 11 journeys and exposed the Radix focus failure. The local correction keeps that failure available as a separate expected-failure case.

Each final run has **six common journeys per framework: 12 passing checks and one deliberately reproduced stock-library failure**. Playwright's headline counts expected failures as successful expectations; it must not be reported as 13 successful journeys.

```sh
npx playwright install chromium --only-shell
npm run typecheck
npm run build
npm run test:e2e
npm run receipt -- dev
PROTOTYPE_PAYLOAD=1 npm run test:e2e
npm run receipt -- bundled
```

The recorded run uses Node 26.0.0, npm 11.12.1, Playwright 1.64.1 and its matching Chromium headless shell. Node 26 was the available local runtime; this does not replace the proposed production Node 24 LTS baseline or establish a Node 24 run.

- [Development receipt](evidence/dev-receipt.json) and [built-payload receipt](evidence/bundled-receipt.json): source/package identities, test outcomes, source readback hashes, browser identity and both artifact hashes.
- [Frozen editor provenance](evidence/editor-provenance.json): five copied working files, including explicitly identified uncommitted source, with byte hashes. Neither framework receives a different core.
- [Initial empty-page failure](evidence/red-before-implementation.json) and [first browser run](evidence/first-browser-run.json).
- [Screenshots](evidence/screenshots/): synthetic desktop and narrow views for each candidate and execution mode.
- Local Playwright traces are generated under ignored `test-results/`; this session's development traces are also retained in ignored `.local-evidence/dev/`. They may contain workstation paths and are not public artifacts. Replaying the probes regenerates them.

The original browser setup attempt failed because the matching binary was absent. Installing the matching shell resolved setup; it was not an application failure. The empty-page run also timed out in its attachment hook; the collector now bounds that read separately. No earlier failure is presented as a passing run.

## Independent review disposition

The completed BDFL review found no material implementation correction needed for this throwaway comparison. It independently checked all 25 source/config/package hashes and both payload hashes in each receipt, reran typechecking, and replayed the React dialog in development and built-payload modes. The local correction had no focus escapes across eight Tab and eight Shift+Tab presses in each mode; the stock dialog reproduced focus escape. The requested typecheck-scope disclosure is included in trade-off 12.

The review did not rerun the full browser suite or reinstall the incompatible TypeScript version: coherent retained results and source identities supported the former, while installed checker code and cached package exports supported the latter. The current stock probe failed at the intended containment assertion. Future replays must inspect its failure cause because the expected-failure marker also accepts unrelated failures. The receipts identify the listed source/configuration and payloads; they do not hash the host HTML, receipt generator or screenshots and must not be described as a complete manifest of every execution input.

## Maintenance comparison entry points

- [Vue application](src/vue/App.vue) and [Vue editor lifetime](src/vue/EditorSurface.vue).
- [React application](src/react/App.tsx) and [React editor lifetime](src/react/EditorSurface.tsx).
- [Shared session owner](src/shared/harness.ts), [small fixture renderer](src/shared/editor-surface.ts), and [build configuration](vite.config.ts).
- [Journey probes](probes/workspace.spec.ts) and [stock Radix reproduction](probes/radix-stock.spec.ts).

## Every trade-off made here

1. Two actual framework wrappers with identical layout/content isolate integration differences, but do not compare alternative visual designs or whole applications. This intentionally adapts the prototype skill's usual visual-variation workflow to the user's technical question.
2. Copying five inspected editor-core files preserves a concrete lexical/source model without migrating the experiment. It carries shared historical behavior and possible defects; success or failure in that shared core cannot establish a framework advantage. Hashes freeze this comparison, not production adoption.
3. A small fixture renderer avoids copying the old UI and localization system, but renders only the sample's needed structures. It does not deliver the full toolbar, font/color rendering, source/visual caret mapping, pasted-content semantics or complete accepted editor.
4. An application-owned, memory-only session makes view teardown comparable and avoids disposing writing during React's development cleanup. Refresh recovery, tab-close semantics, storage failure and account changes remain the architecture/implementation work already tracked elsewhere.
5. Using a plain/raw external instance with shallow Vue snapshots and React's external-store subscription keeps editor identity stable, but requires explicit lifecycle discipline in both candidates. This is one viable integration, not the only idiomatic design.
6. React Strict Mode stays enabled to expose cleanup mistakes. Its additional development mount is visible; it is not a timing benchmark or a production penalty.
7. Reka and Radix are real representative primitive libraries, so the comparison exposes useful host behavior. They differ independently of Vue/React and are not interchangeable controlled variables.
8. An open ShadowRoot tests a plausible style boundary and resists deliberately different host CSS. Selecting that boundary for the prototype does not choose production architecture, and introduces cross-root focus/ARIA concerns absent from a plain container.
9. The local React Tab-edge handler makes this small dialog usable while preserving the stock failure switch. It covers this dialog's simple controls, not nested dialogs, arbitrary focusables, programmatic focus, screen readers or a production focus-trap replacement.
10. Keeping the stock Radix case as an explicit expected failure makes the finding replayable, but requires reporting actual passes separately from the runner's successful-expectation count.
11. Reka's development diagnostic warnings remain visible. Browser name/description assertions check this fixture without suppressing the warning, but do not establish full accessibility.
12. TypeScript 6.0.3 is pinned for both after observing the Vue checker failure with 7.0.2. This supplies a tested common set while postponing TypeScript 7 adoption; no general Vue type-safety disadvantage follows. The frozen editor remains JavaScript with `checkJs: false`, and `skipLibCheck: true` skips dependency declaration-body checking. The TS/SFC integration is checked; this does not type-validate the complete historical editor or dependency declarations.
13. The available Node 26 runtime keeps the experiment local and bounded, but the proposed Node 24 LTS production baseline still needs its own implementation checks.
14. Vite, official framework plugins and the maintained userscript plugin avoid a custom packager. They add version coupling; bundling app dependencies avoids CDN runtime coupling while increasing payloads. Both build outputs are fixture artifacts, not framework performance measurements.
15. Two separate localhost-only payloads make artifact identity clear and prevent forum execution. They do not exercise the manager or the real site's authentication/CSP/update behavior.
16. Prewritten browser journeys and repeatable receipts follow the user's E2E preference over the prototype skill's default to omit tests. They add setup and browser-binary cost; no unit suite or production harness was built.
17. Two viewport checks, simple light/dark restyling and a synthetic source corpus keep the comparison small. They do not qualify all four product themes, responsive breakpoints, languages, native IME or mobile WebViews.
18. npm, an exact lockfile and a local formatter make the artifact repeatable/readable. Pins retain known versions until deliberately upgraded; the snapshot files are excluded from formatting to preserve byte identity. Package install scripts were disabled; the actual recorded builds establish only that this installed set worked here.
19. No router, store, query cache, SSR framework or production persistence layer was added. The small UI uses local presentation state, leaving the actual native-navigation and recovery architecture to its named decision.
20. Public-safe receipts and synthetic images are committed; raw traces stay local because they can contain workstation paths. Replayers can regenerate traces, while the receipts retain assertions and artifact hashes.
21. The comparison stays on a throwaway branch and leaves the framework decision open. The user can inspect real behavior before selecting, at the cost of another decision round; this work does not unblock architecture by silently choosing Vue or React.
22. Scoped fact agents and a completed BDFL review challenge unsupported inference but add coordination overhead. The review checked the concrete integrations, current receipts and targeted browser replay; it did not reimplement or qualify the historical editor. It accepted the disclosed fixture correction, used cached package/source evidence for the TypeScript mismatch rather than disturbing the tested dependency tree, and kept optional evidence improvements outside this bounded comparison. Shared request/report files were necessary because delegated messages arrived unreadable.

## Related primary evidence

- [Existing React/Vue comparison](https://github.com/Benson-mk/tsdm-ui/blob/61be04f1d7c97e3b2a17e8883a3d91efad65e187/docs/research/vue-react-comparison.md) and [runtime constraints](https://github.com/Benson-mk/tsdm-ui/blob/6ff866f912de0184399120755e1ea8c6b2d973af/docs/research/tampermonkey-tauri-constraints.md).
- [Accepted detailed workflows](https://github.com/Benson-mk/tsdm-ui/issues/10#issuecomment-6207556320).
- [React Effect lifecycle](https://react.dev/reference/react/useEffect), [Vue external/shallow reactivity](https://vuejs.org/api/reactivity-advanced.html).
- [Tiptap UI catalog](https://tiptap.dev/docs/ui-components/getting-started/overview), [Reka dialog](https://reka-ui.com/docs/components/dialog), [Radix dialog](https://www.radix-ui.com/primitives/docs/components/dialog).
- [Userscript plugin at the inspected release](https://github.com/lisonge/vite-plugin-monkey/tree/a1d7009812ae6cd69bb7f16ec5ff8cebb4525115), [Playwright extension-testing boundary](https://playwright.dev/docs/chrome-extensions).

Human verdict: **pending**. Production framework, editor wrapper, component library, toolchain policy and architecture are not selected by this artifact.
