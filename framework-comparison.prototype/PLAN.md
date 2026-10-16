# Framework integration comparison — throwaway

Question: with the same source-preserving editor and the same small workspace, does Vue or React expose a consequential integration or maintenance difference?

The human requested a small hands-on comparison on 2026-10-16 and has deliberately kept the framework choice open. Build two real framework wrappers with the same fixture, shared frozen editor core and visual treatment. The accepted workspace geometry is not being reconsidered. This is a technical integration prototype, so the prototype skill's radically different visual variants / framework-free logic demo would defeat the requested comparison.

## Scope decided before implementation

- Vue 3 Composition API/SFC and React function components/Strict Mode.
- One shared snapshot of the experiment's five editor-core modules, identified by SHA-256; a small shared DOM surface for this fixture. Do not migrate the old application.
- An editable synthetic BBCode example, visual/source switch, undo, opaque markup and table merge/split controls.
- Preserve the one in-memory writing context while switching to an overview, changing appearance and detaching/reattaching the editor view.
- One real Reka dialog and one real Radix dialog, each targeting a container in the same open ShadowRoot as the application.
- Visible source and lifecycle state, a short guided walkthrough, and independent Vue/React links.
- Vite development host plus two self-contained localhost-only userscript payloads. No live forum, account, upload, persistence or server write.

## Failure modes, enumerated before code

1. Source/visual no-op switches change lexical BBCode or lose unknown markup/attachment identifiers.
2. A framework render replaces the editable DOM, losing selection/history or duplicating subscriptions.
3. Navigating to the overview, changing appearance, or detaching the view discards the writing context.
4. An old view remains active after teardown, or React's development setup/cleanup cycle disposes the shared session.
5. Vue deep proxies third-party ProseMirror state or a wrapper dispatches against stale state.
6. Table operations change unrelated opaque source or leave a corrupted grid.
7. The dialog escapes its style host, keyboard focus escapes the modal, Escape fails, or focus fails to return to the trigger.
8. Global host CSS leaks into the comparison; narrow widths hide the controls.
9. A generated payload fetches an application runtime from a CDN, or dev output is mistaken for installed Tampermonkey evidence.
10. Automated text insertion is incorrectly claimed as native Chinese IME acceptance.

Write the browser journey probes before the wrapper implementation. This follows the user's E2E-first instructions, which take precedence over the prototype skill's default to omit tests. Keep the probes small and about outcomes. No unit tests.

## Acceptance for this prototype, not the framework decision

- Both real framework implementations can be opened and exercised locally with the same fixture and interactions.
- Repeatable browser journeys verify source retention, navigation/appearance/lifecycle, table operations and dialog keyboard behavior for each wrapper, with failures preserved and a final receipt.
- Both localhost-only userscript payloads build; their source identity, package versions and output hashes are recorded. Build success is not manager installation acceptance.
- A completed independent BDFL review examines the final comparison and evidence before asking the human to judge it.
- The comparison, limitations, all implementation trade-offs and replay instructions are captured on a throwaway branch. The framework issue stays open until the human selects and confirms a complete resolution.

No whole-project productivity, bundle-size ranking, full BBCode support, complete accessibility, native IME, installed stable Tampermonkey or Tauri acceptance is claimed.
