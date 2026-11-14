# Share forum workflows across layouts and hosts

Keep forum meaning and operation guarantees in a headless TypeScript forum client, with a Vue workspace, project-maintained layouts and host adapters around it. The first release remains the current-account Tampermonkey application; the planned CLI/MCP clients live in a separate repository and consume the same versioned forum-client library. This preserves one implementation of consequential forum behavior while allowing different interfaces and independently released clients.

The canonical decision, evidence, qualification limits and complete trade-off ledger are recorded in [Set the forum, platform and layout boundaries — issue #8](https://github.com/Benson-mk/tsdm-ui/issues/8). The accepted scope, workspace, workflow, framework and funded-hongbao decisions in [#5](https://github.com/Benson-mk/tsdm-ui/issues/5), [#6](https://github.com/Benson-mk/tsdm-ui/issues/6), [#10](https://github.com/Benson-mk/tsdm-ui/issues/10), [#7](https://github.com/Benson-mk/tsdm-ui/issues/7) and [#12](https://github.com/Benson-mk/tsdm-ui/issues/12) remain controlling.

## Ownership

- **Forum client:** models, capabilities, API/page/form interpretation, content/source preservation, account generations, prepared commands, submitted revisions, confirmation and uncertain outcomes. Its exported models are serializable and contain no browser DOM nodes; its interface does not depend on Vue, browser globals, GM, Tauri or the visual editor.
- **Workspace:** UI navigation and result-return context, one active writing context/editor plus retained ordinary replies per thread, presentation of shared operation state and UI preferences. Custom layouts use this typed internal interface to read state and invoke actions without bypassing composition guards.
- **Layouts:** Vue screen composition, navigation arrangement, focus and transient presentation. Shared reader/editor semantics support substantially different maintained experiences; layouts arrive through application updates and are distinct from independently downloaded third-party plugins.
- **Hosts:** request execution, session mechanisms, storage, history, downloads and native continuation. Later CLI/MCP and Tauri hosts must establish their own authentication and capability contracts rather than assuming browser-cookie access.

Initially maintain the forum-client implementation here and expose a separately consumable built library with declarations and explicit exports. The separate CLI/MCP repository pins an exact artifact/version or commit with a reproducible build; it does not copy implementation files or import private UI paths. Breaking contract changes require versioning and coordinated consumer updates. Package naming, registry publication, a hosted service and a multi-package workspace are not selected by this decision.

Direct library consumption assumes a JavaScript-compatible process. The separate project's language remains its own choice; another language needs an explicit bridge or an agreed integration strategy, rather than an implied promise of language-independent reuse.

## Consequences

Evaluate structured API actions and page JSON first per operation, preferring them when required meaning is preserved and a benefit is demonstrated. The bounded guest comparison found useful structured metadata and lower gzip transfer for sampled board/thread pages, but not every response was smaller. Retain HTML/current forms for unsupported or unsuitable cases, consume useful HTML returned by a JSON-preferring request, and never repeat effectful operations merely to change representation. Fetched content remains inert input; a ShadowRoot is not a security boundary.

The original decision used the manager's tab-lifetime storage for acknowledged recovery. The [accepted browser page-session decision](0003-use-browser-page-session-recovery.md) supersedes that mechanism and its conflicting lifetime/isolation guarantees, retaining acknowledged snapshots, visible failure and no silent durable-draft substitute. Preserve account binding and uncertain writes without promising atomic isolation or rollback. Return navigation must avoid repeating notice/search effects, including through reloadable history URLs. Funded drafts disclose immediate debit and packet activity before publication; thread, packet and credit outcomes remain independent, and unknown refunds are not reported as confirmed.

Selectively adapt the experiment's parser and source-preservation work because rediscovering those rules is costly. Replace the coupled shell/navigation policies that conflict with accepted result restoration and layout ownership. Ported bytes still require qualification; historical test volume is not acceptance evidence.

The costs are a serializable core contract, library packaging/compatibility work, multiple qualified response paths and per-layout/host journey verification. CLI/MCP delivery remains later work in the separate project. [Release qualification — issue #9](https://github.com/Benson-mk/tsdm-ui/issues/9) owns executable evidence, including real redirects, tab recovery, member workflows and clean external-consumer imports; this ADR records a decision, not delivered runtime behavior.

## Retained ordinary replies — #106

The workspace owns one actively edited composition and inactive local reply drafts keyed by thread within the forum origin. The existing inert writing representation retains source, target, options, attachment intent and historical attempt identity. Account metadata remains provenance and eligibility under the current account safeguards, never an account-indexed draft lineage. New-thread, edit-post, private-message and server-owned Forum draft writing retain their existing guards. Ordinary navigation restores writing automatically without submitting or retaining current publication authority. Deliberate existing text-copy replacement still replaces the sole thread slot under its existing disclosures; automatic account sharing belongs to #108.

In-document selection preserves available file handles and invalidates transient preparation/review; reload normalization separately marks lost bytes and pending operations unavailable or uncertain. Owned effectful operations finish before deactivation. Immutable histories remain where already owned without copying a parked thread’s history into a fresh reply. A genuine non-reply replacement may transfer history, but unequal observations for the same attempt identity refuse replacement before either composition changes; equivalent observations deduplicate without choosing a chronological winner. The required gpt-6.1-sol/xhigh BDFL evaluation accepted this bounded contract with these refinements before implementation; the decision and complete trade-off ledger are retained with [#106 implementation evidence](../implementation/ui-ux-106.md). Durable storage, conflict preservation and pending-next-draft ownership remain #107–111 work.

## Durable ordinary replies — #107

Ordinary local reply retention now uses the browser host's acknowledged durable
store under [ADR0003](0003-use-browser-page-session-recovery.md). The workspace owns
reply checkpoints, conflict pause, exact captured writing/history and effect-owner
continuity; the host owns IndexedDB transactions and advisory notifications. Shared
recovery types and inert snapshot comparison stay in the workspace, without a
runtime dependency on the browser implementation. Layouts only render current
status and copyable retained versions. Non-reply composition and navigation remain
page-session scoped, including when durable reply storage is unavailable.

Forum-client 0.25.0 adds optional transient `EffectGuard` arguments to publication,
upload and immediate attachment removal. After fresh native preflight, the client
awaits the caller's check, then rechecks current validity and account generation
immediately before dispatch. The guard is never serialized, supplies no native
permission and cannot recall an already dispatched operation. It closes the
observed asynchronous preflight gap without introducing browser storage into the
portable client or using account generation as a draft-conflict signal. Immutable
original actor/target and actual callback outcomes remain retained. #111 owns the
stronger cross-tab unsettled-send registry; #107 does not implement it.


## Account-shared ordinary replies — #108

Ordinary reply composition account metadata is now stable original provenance,
not current sender eligibility. The workspace captures the independently verified
current actor and generation at one transient operation seam; new publication,
upload, repair, retarget, mention, removal and stored-file checks use that actor.
Historical submissions and actual dispatched outcomes retain their original actor
and target. New-thread, edit-post, private-message and Forum draft account rules
remain unchanged. Account-only observations do not rewrite draft lineage or editor
source. Current-writing presentation uses the current actor or unverified wording.

Forum-client 0.26.0 adds optional read-only `checkReplyAttachments` and optional
`WritingUpload.ownerId` (known member, null unknown, absent legacy). Fresh native
form/profile and exact attachment controls prove only same-owner current usability;
permissive lists cannot transfer upload ownership. These proofs remain transient.
Unavailable intent stays named, blocks review and offers explicit Reattach/Remove.
A server-reference replacement explicitly uploads new bytes, then replaces exact
balanced literal attach/attachimg spans, row, fields and reference identity together.
The disclosure includes quoted/code examples. Local-only selection requires a
separate Upload. Remove changes local intent/source without deleting a server file;
available-file removal keeps its existing confirmation. An exact failed-adoption
rollback may restore the captured intent during conflict, but cannot authorize a
new mutation/effect or select a competing head. Existing editor undo changes source,
not server ownership. The accepted advisor gate and distinct costs are recorded in
[the #108 ledger](../implementation/ui-ux-108.md).
