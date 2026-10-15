# React and Vue evidence for the future TSDM UI

Date: 2026-10-16 (Asia/Hong_Kong).

This is a sanitized research note for wayfinding. It answers what the available evidence says about React and Vue 3 for the confirmed platform sequence: stable Chrome/Edge with Tampermonkey first, Tauri 2 on Android later, then iOS. It does not settle the human framework decision, establish a release scope, or implement either candidate.

## Finding

Both React and Vue 3 are technically plausible. Neither the userscript target, Tauri 2, nor the requested IM and ChatGPT-inspired layouts establishes a decisive framework advantage. With no existing team preference, my provisional recommendation is **Vue 3 with TypeScript, Single-File Components, Composition API and Vite**. The reason is a coherent set of client application conventions that can reduce choices during UI work, not evidence that Vue will make this project faster.

React with TypeScript and Vite remains a sound alternative. Prefer it if the eventual interaction prototype identifies a concrete React-only dependency or the people maintaining the project demonstrate a meaningful advantage with React. Do not choose from framework popularity, assumed AI familiarity, or a generic benchmark.

## Local evidence and its limits

The experiment is not a React or Vue codebase. Its package manifest uses esbuild and direct ProseMirror packages; the inspected view creates DOM nodes and a Shadow DOM host directly. Its build script emits an IIFE userscript with bundled dependencies. Either framework would replace or wrap portions of the imperative view code; neither has an incumbent component investment to preserve. Sources inspected: `tsdm-ui-experiment/package.json`, `scripts/build.mjs`, and `src/ui/view.js`.

The knowledge-base synthesis describes repeated integration discovery, session/account behavior, qualification attempts, changing artifact identity and a broad unfinished release boundary. It explicitly says these are engineering conclusions rather than a measured allocation of development time. Consequently, a framework change cannot be credited in advance with solving the slow development cycle. Source: `tsdm-ui-experiment/knowledge-base/findings.md`, section “Lessons from the slow development cycle,” with the captured baseline described in `knowledge-base/README.md`.

The requested `tsdm-ui/DESIGN.md` was absent during this inspection. The experiment's `DESIGN.md` exists and defines an editorial visual system, typography and appearance variants. I treated it as the experimental visual reference only. It does not select a framework or settle a forum-specific IM interaction design. Source: `tsdm-ui-experiment/DESIGN.md`.

These are local source observations, not installed-browser or mobile-runtime acceptance. No account, forum payload, authentication material or private conversation content was used.

## Comparison against this project's needs

| Need | React evidence | Vue 3 evidence | Consequence |
| --- | --- | --- | --- |
| Tampermonkey build | The userscript build tool `vite-plugin-monkey` supplies React and React TypeScript templates. | The same tool supplies Vue and Vue TypeScript templates. | There is a documented packaging path for each. An installed script still needs verification; template existence is not runtime acceptance. [Userscript tool source](https://github.com/lisonge/vite-plugin-monkey) |
| Later Tauri 2 host | Tauri's frontend guidance lists React among Vite-based SPA options. | The same guidance lists Vue. | Tauri is frontend agnostic and serves static frontend assets. Native mobile delivery does not create a React advantage through React Native, which is a different target. [Tauri frontend configuration](https://v2.tauri.app/start/frontend/) |
| Existing-page mount and recovery | `createRoot` mounts a React tree into an owned DOM container; `unmount` releases the tree. | `createApp().mount()` mounts into an owned container; `app.unmount()` triggers cleanup. | Both can own a replacement UI subtree. The host must still own insertion, cleanup, recovery and unrelated native DOM. [React root API](https://react.dev/reference/react-dom/client/createRoot), [Vue application API](https://vuejs.org/api/application.html) |
| Client application conventions | The React documentation permits a from-scratch Vite app for constraints not served by a framework, while explicitly identifying routing, data fetching and other application choices the project then owns. | Vue recommends Vite, officially supported Vue Router for most SPAs, and Pinia for larger shared-state needs. | Vue offers a straightforward default path. This is a reduction in design choices, not proof of lower implementation effort. The forum's native URLs and account transitions must shape the eventual router/state use. [React from-scratch guidance](https://react.dev/learn/build-a-react-app-from-scratch), [Vue tooling](https://vuejs.org/guide/scaling-up/tooling.html), [Vue routing](https://vuejs.org/guide/scaling-up/routing.html), [Vue state management](https://vuejs.org/guide/scaling-up/state-management.html) |
| Reusable UI logic | Hooks provide a composition mechanism, with documented hook ordering and call-site rules. | Composition API provides composables, reactive state, lifecycle hooks and dependency injection. | Either can organize shared UI behavior. Use one idiom consistently rather than treating either mechanism as the domain model. [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks), [Vue Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) |
| Editor integration | Tiptap documents a React adapter. | Tiptap documents a Vue 3 adapter and Composition API usage. | Rich editor support does not force React. These docs do not establish BBCode fidelity, IME behavior or reuse of the experiment's preservation logic; those remain product evidence requirements. This is not a recommendation to replace the existing ProseMirror work with Tiptap. [Tiptap React](https://tiptap.dev/docs/editor/getting-started/install/react), [Tiptap Vue 3](https://tiptap.dev/docs/editor/getting-started/install/vue3) |
| Typed UI boundaries | TypeScript/JSX works with the documented Vite setup. | Vue has first-class TypeScript support; SFC checking uses `vue-tsc` in addition to the transpiling build. | Both can provide typed interfaces. A successful bundle alone is not a type check. Vue adds SFC-aware tooling to maintain. [React setup](https://react.dev/learn/build-a-react-app-from-scratch), [Vue TypeScript](https://vuejs.org/guide/typescript/overview.html) |
| Runtime performance | Current React documentation describes React Compiler's automatic memoization, so a blanket claim that React requires manual memoization is outdated. | Vue recommends measurement, precompiled templates and care with dependencies; large lists and deep reactivity still have costs. | No representative bundle or interaction benchmark was performed. Do not claim either candidate is smaller or faster for this app. [React Compiler](https://react.dev/learn/react-compiler), [Vue performance](https://vuejs.org/guide/best-practices/performance.html) |

## Concrete UI dependencies and the supplied IM reference

[Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) provides unstyled React controls with keyboard/focus behavior and WAI-ARIA patterns; [Reka UI](https://reka-ui.com/docs/overview/introduction) provides a comparable low-level, unstyled Vue option. Either lets the project implement its own visual language. Library accessibility claims do not qualify this application's final focus behavior, especially with portals and a userscript's style host. A representative dialog/popover and keyboard journey should inform the later library choice; no component library is selected here.

[TanStack Virtual](https://tanstack.com/virtual/latest/docs/introduction) documents both React and Vue adapters. That establishes an available option if a chosen list requires virtualization, not a reason to virtualize paginated forum posts immediately. Dynamic rich-post heights, post anchors, text selection and assistive navigation still require product-specific evidence.

The user's [Linux.do IM reference](https://github.com/czm15053/linuxdo-idea-ui/blob/736aa1e6ec89517c3d1f5f937dc2dbe93c92c23c/linuxdo-im.user.js) was inspected at commit `736aa1e6ec89517c3d1f5f937dc2dbe93c92c23c`, whose userscript header declares version 1.2.0. Its built-in DingTalk, Feishu and WeCom choices share a script and operations while varying pane dimensions, controls and presentation. This is useful evidence that maintained layouts can be meaningful experiences; it is not a requirement to reproduce that script's architecture.

Its host contract is specifically Linux.do/Discourse: the metadata targets `linux.do`, reads page/Ember services and CSRF metadata, and uses routes such as `/latest.json`, `/t/...json` and `/posts.json`. Those are not TSDM's Discuz contracts. Reuse its interaction ideas selectively; do not port its transport, notification or session assumptions into the TSDM build. This source reading did not execute the reference script or inspect a logged-in page.

The pinned repository [LICENSE](https://github.com/czm15053/linuxdo-idea-ui/blob/736aa1e6ec89517c3d1f5f937dc2dbe93c92c23c/LICENSE) is MIT and requires preservation of its copyright and permission notice in copies or substantial portions. No reference source or embedded image has been copied into the future project by this research. Any later code reuse needs its normal attribution review.

## Boundaries that matter more than the framework name

The following are recommendations to evaluate in the architecture decision, rather than facts already accepted:

1. Keep forum entities and operations recognizable: boards, threads, posts, private messages, pagination, permissions, unread state and write outcomes must not acquire different meanings when the visual layout changes.
2. Share those domain meanings and operation contracts across maintained layouts. Let each layout choose its composition, navigation, pane arrangement and interaction presentation. A maintained alternative layout can be meaningfully different without a public plugin API.
3. Keep host-specific authentication, requests, storage and native recovery behind explicit boundaries. Do not put `GM_*` or Tauri calls directly in every view. Do not promise that identical transport implementations or browser cookies carry into Tauri.
4. Do not build a framework-neutral component layer to preserve the option of switching React/Vue later. Both candidates need frontend-specific view code; the useful reusable boundary is the forum behavior and data, not an abstraction over component runtimes.
5. Prefer a client build compatible with the host. The current targets do not require an SSR or server-components deployment. Adding a React/Vue meta-framework requires a concrete need; it is not a prerequisite for a well-structured client app. Tauri's documented static-host model supports this inference. [Tauri frontend configuration](https://v2.tauri.app/start/frontend/)

For either candidate, a framework change does not remove the need to sanitize rich forum content, preserve unsent text, reject stale responses after account/route changes, respect native read side effects, and verify ambiguous write results. Those invariants are documented experimental knowledge; they should be reviewed against the new release scope instead of discarded with its renderer.

## What would change the recommendation

The eventual framework decision should consider the chosen first-release journeys and a bounded interaction prototype. It should not require building two full applications merely to choose a framework.

A useful comparison would show an IM-shaped board/thread reader and composer using synthetic content, a deep link, pagination, a dialog/popover and narrow-width navigation. Before implementation, write the failure cases: losing draft/selection during pane changes, stealing focus, stale loading results, broken native deep links, overlays escaping the intended style host, IME interruption, inaccessible keyboard navigation, and unmount/re-entry leaks. If a framework-specific library is decisive, try that exact dependency at its real host boundary.

The repeatable artifact should identify the source/build and record the end-to-end scenario, browser/extension versions, assertions and a short trace or capture. A synthetic fixture demonstrates local behavior only. It cannot prove installed userscript grants, authenticated server behavior or Android/iOS integration.

No such prototype or benchmark was run for this research. The comparison is sufficient to reject platform incompatibility as an unsupported reason to choose one candidate; the final selection remains a human decision in the map.

## Trade-offs made in this research

1. **A provisional Vue recommendation with React retained:** supplies a useful default while preserving the human decision. The recommendation rests on conventions and fit, not a measured productivity result.
2. **Official documentation and inspected source over popularity claims:** makes compatibility and maintenance claims traceable; it does not estimate hiring availability, AI code quality or community support volume.
3. **No dual implementation or benchmark during charting:** avoids turning planning into a build; real bundle size and interaction cost remain unknown.
4. **Selective experiment reuse:** preserves integration and editor lessons without forcing reuse of imperative view code; adaptation cost remains to be scoped.
5. **Vite client-build direction:** serves both current hosts and reduces deployment assumptions; this research does not qualify a specific userscript plugin/version or its update path.
6. **Vue conventions rather than a mandatory dependency list:** gives a coherent direction while avoiding premature router/store/editor choices; later decisions must still examine native forum URLs and session rules.
7. **One UI framework with domain boundaries rather than a neutral component runtime:** keeps ordinary development simpler; a later framework migration would still require view changes.
8. **Meaningful maintained layouts rather than assuming third-party plugins:** supports the user's update-based layout ambition without taking on a public extension contract; independent downloadable plugins remain a separate decision.
9. **Source-only public-safe evidence:** avoids account and privacy effects; no deployed-plugin, installed-browser, or mobile-runtime claim is established here.


10. **Concrete component and reference inspection without adopting them:** verifies available alternatives and the reference protocol/license; component behavior in our host and actual reuse cost remain untested.
