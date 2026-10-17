# Share forum workflows across layouts and hosts

Keep forum meaning and operation guarantees in a headless TypeScript forum client, with a Vue workspace, project-maintained layouts and host adapters around it. The first release remains the current-account Tampermonkey application; the planned CLI/MCP clients live in a separate repository and consume the same versioned forum-client library. This preserves one implementation of consequential forum behavior while allowing different interfaces and independently released clients.

The canonical decision, evidence, qualification limits and complete trade-off ledger are recorded in [Set the forum, platform and layout boundaries — issue #8](https://github.com/Benson-mk/tsdm-ui/issues/8). The accepted scope, workspace, workflow, framework and funded-hongbao decisions in [#5](https://github.com/Benson-mk/tsdm-ui/issues/5), [#6](https://github.com/Benson-mk/tsdm-ui/issues/6), [#10](https://github.com/Benson-mk/tsdm-ui/issues/10), [#7](https://github.com/Benson-mk/tsdm-ui/issues/7) and [#12](https://github.com/Benson-mk/tsdm-ui/issues/12) remain controlling.

## Ownership

- **Forum client:** models, capabilities, API/page/form interpretation, content/source preservation, account generations, prepared commands, submitted revisions, confirmation and uncertain outcomes. Its exported models are serializable and contain no browser DOM nodes; its interface does not depend on Vue, browser globals, GM, Tauri or the visual editor.
- **Workspace:** UI navigation and result-return context, one tab-local writing context, presentation of shared operation state and UI preferences. Custom layouts use this typed internal interface to read state and invoke actions without bypassing composition guards.
- **Layouts:** Vue screen composition, navigation arrangement, focus and transient presentation. Shared reader/editor semantics support substantially different maintained experiences; layouts arrive through application updates and are distinct from independently downloaded third-party plugins.
- **Hosts:** request execution, session mechanisms, storage, history, downloads and native continuation. Later CLI/MCP and Tauri hosts must establish their own authentication and capability contracts rather than assuming browser-cookie access.

Initially maintain the forum-client implementation here and expose a separately consumable built library with declarations and explicit exports. The separate CLI/MCP repository pins an exact artifact/version or commit with a reproducible build; it does not copy implementation files or import private UI paths. Breaking contract changes require versioning and coordinated consumer updates. Package naming, registry publication, a hosted service and a multi-package workspace are not selected by this decision.

Direct library consumption assumes a JavaScript-compatible process. The separate project's language remains its own choice; another language needs an explicit bridge or an agreed integration strategy, rather than an implied promise of language-independent reuse.

## Consequences

Evaluate structured API actions and page JSON first per operation, preferring them when required meaning is preserved and a benefit is demonstrated. The bounded guest comparison found useful structured metadata and lower gzip transfer for sampled board/thread pages, but not every response was smaller. Retain HTML/current forms for unsupported or unsuitable cases, consume useful HTML returned by a JSON-preferring request, and never repeat effectful operations merely to change representation. Fetched content remains inert input; a ShadowRoot is not a security boundary.

Use the manager's tab-lifetime storage for acknowledged writing-recovery snapshots, with visible failure and no silent durable-draft substitute. Preserve account binding and uncertain writes without promising atomic isolation or rollback. Return navigation must avoid repeating notice/search effects, including through reloadable history URLs. Funded drafts disclose immediate debit and packet activity before publication; thread, packet and credit outcomes remain independent, and unknown refunds are not reported as confirmed.

Selectively adapt the experiment's parser and source-preservation work because rediscovering those rules is costly. Replace the coupled shell/navigation policies that conflict with accepted result restoration and layout ownership. Ported bytes still require qualification; historical test volume is not acceptance evidence.

The costs are a serializable core contract, library packaging/compatibility work, multiple qualified response paths and per-layout/host journey verification. CLI/MCP delivery remains later work in the separate project. [Release qualification — issue #9](https://github.com/Benson-mk/tsdm-ui/issues/9) owns executable evidence, including real redirects, tab recovery, member workflows and clean external-consumer imports; this ADR records a decision, not delivered runtime behavior.
