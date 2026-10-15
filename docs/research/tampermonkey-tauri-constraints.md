# Runtime constraints for the future TSDM UI

Research date: 2026-10-16 (Asia/Hong_Kong). Purpose: provide evidence for a product/architecture decision map. This is not a runtime selection, implementation, or release qualification. No forum session, browser profile, credential, private response, or account operation was accessed.

## Working destination and scope

The user's selected order is stable desktop Chrome/Edge with stable Tampermonkey first, Tauri 2 on Android next, and iOS later. The first UI is a modern IM experience; additional maintained layouts arrive through project updates. The experiment is evidence, not an automatically inherited release checklist.

## Findings

### A shared frontend is feasible; one identical runtime artifact is not established

Tauri is frontend agnostic. It serves built frontend assets to a WebView and recommends Vite for SPA frameworks including React and Vue. It does not natively run a server-rendered application. Therefore Tauri compatibility does not decide between React and Vue, and the supported common denominator is a client-side frontend with separate host entry points. This is an architectural inference from the official [frontend configuration documentation](https://v2.tauri.app/start/frontend/), not a tested TSDM build.

The userscript runs inside a forum page managed by Tampermonkey; a Tauri package supplies its own application and capabilities. Sharing components, domain models and operation semantics is plausible. Sharing the same session, transport implementation, packaging or installation behavior cannot be assumed.

### Stable Tampermonkey constrains saved-account promises

The current official [`GM_cookie` documentation](https://www.tampermonkey.net/documentation.php?q=GM_cookie) still explicitly restricts HttpOnly cookie support to BETA versions. Stable release planning must not assume that a listed cookie API is sufficient for reading, saving or replacing all forum login cookies.

The [`GM_xmlhttpRequest` documentation](https://www.tampermonkey.net/documentation.php?q=GM_xmlhttpRequest) describes credential omission, redirect modes, explicit cookie merging and version-dependent behavior. A cookie supplied on a request is merged into a cookie set; that is not evidence of a separate persistent account jar or native-session isolation. The exact installed stable version and request mode must be recorded for any later experiment.

The experiment's knowledge synthesis reports controlled cookie lifecycle acceptance on stable Chrome/Edge and a later credential-free redirect prerequisite. It explicitly limits those results to validation extensions and synthetic accounts. It does not claim integrated production multi-account support, full authenticated redirects or a selected public runtime. See `tsdm-ui-experiment/knowledge-base/findings.md`, lines 44 and 136, and its linked historical records. These are historical observations; current scope may reassess whether saved accounts are needed at all in the first release.

### Browser Fetch is not a native cookie-jar API

The [Fetch standard](https://fetch.spec.whatwg.org/#forbidden-request-header) treats `Cookie` as a forbidden request header and filters `Set-Cookie` from script-visible ordinary responses. A manual redirect normally produces an opaque redirect response with status zero and no exposed response headers/body. Consequently an ordinary browser-fetch adapter must not promise native-style cookie control or intermediate redirect inspection.

An ambient-session browser build may use the browser-managed forum session. Whether that is the desired product account model remains a human decision. Choosing it would reduce account-management work but would make the UI follow the account active in that browser profile.

### Tauri needs its own authentication and privilege contract

Tauri's [HTTP plugin](https://v2.tauri.app/plugin/http-client/) is available on Android and iOS, uses a Rust-side client, and requires an explicit URL scope before frontend requests are allowed. Its Fetch-like interface does not establish shared cookies with a login WebView, storage persistence, per-account isolation or challenge recovery. Those details require a targeted architecture decision and later device evidence.

Tauri's [capabilities documentation](https://v2.tauri.app/security/capabilities/) restricts the default API origin boundary to bundled code; capabilities and permissions still govern plugin commands. Remote access must be configured separately. Android cannot distinguish requests from an embedded iframe from requests from its containing window for this boundary. Forum content should therefore be treated as untrusted data; exposing privileged native commands to remote forum content is a separate decision, not an automatic compatibility technique.

### Android and iOS add distinct compatibility evidence

Tauri uses the device's Android WebView provider rather than bundling a fixed Chromium engine. Its WebKit family covers Apple platforms. Browser engine and update differences mean a successful desktop Chrome/Edge userscript is not qualification for Android or iOS. See [Tauri WebView versions](https://v2.tauri.app/reference/webview-versions/).

The official [Tauri WebDriver guide](https://v2.tauri.app/develop/tests/webdriver/) describes desktop testing and renderer-only browser testing; it does not by itself establish an Android/iOS end-to-end verification path. Mobile acceptance must specify the actual device/runtime and a repeatable artifact when that release becomes in scope.

### Packaging and updates are separate from layout extensibility

Tampermonkey's [update metadata](https://www.tampermonkey.net/documentation.php?q=update_url) supports versioned userscript updates through update/download URLs. This is sufficient evidence that maintained layout code can arrive with a whole-product userscript update. It does not establish a downloaded third-party plugin model, independent plugin permissions or compatibility/version negotiation.

Tampermonkey's [`@sandbox` contract](https://www.tampermonkey.net/documentation.php?q=sandbox) differentiates page, isolated and userscript execution worlds. UI components that only need DOM access should not acquire a dependency on `unsafeWindow` without a concrete requirement. The exact injection choice still needs the forum/CSP and installed-runtime check.

### Preferences, files, navigation and notifications are distinct capabilities

| Concern | Documented boundary and consequence |
| --- | --- |
| Preferences | Tampermonkey lists script-value storage APIs in its [API reference](https://www.tampermonkey.net/documentation.php). Tauri's [Store plugin](https://v2.tauri.app/plugin/store/) persists key-value state asynchronously to a file. Preference portability is feasible; neither establishes a shared session store or credential-protection policy. |
| Downloads | [GM_download](https://www.tampermonkey.net/documentation.php?q=GM_download) depends on manager settings, permissions and filename-extension allowances. Tauri's [filesystem plugin](https://v2.tauri.app/plugin/file-system/) defaults to application-folder access on Android/iOS. Download completion, chosen destination and later opening require separate host acceptance. |
| External navigation | A browser link and Tauri's [Opener](https://v2.tauri.app/plugin/opener/) have different host effects; opener commands and URL scopes need permissions. The product must distinguish in-app forum navigation from external/native recovery and preserve the intended destination. |
| Notifications | A notification display API does not prove ongoing polling. Tauri's [notification guide](https://v2.tauri.app/plugin/notification/) requires checking/requesting OS permission before sending. Forum unread semantics, permission denial, foreground checks and any future background scheduling remain separate product/runtime questions. |

## Questions ready for decision tickets

1. Which account behavior belongs to the first release: the active browser session, saved accounts, or another bounded requirement? If saved accounts are required, what stable-runtime evidence is sufficient before promising them?
2. Which operation/session semantics must be shared between the Tampermonkey and later Tauri hosts, and which belong to host adapters? Include cancellation, stale responses, recovery, identity changes and uncertain writes, without predesigning every native feature.
3. What first-release installation, update and return-to-native behavior must be qualified on both stable Chrome and Edge?
4. Which later Tauri authentication/challenge and storage facts must be proven before Android implementation planning? Do not describe WebView and native HTTP cookie sharing as solved without evidence.

The existing user decision already establishes the platform order; there is no need to reopen that question merely because these boundaries remain unresolved.

## Suggested minimum compatibility boundary (proposal, not decision)

Keep shared forum models, operation results, permission states, post-content handling and UI state free of `GM_*` or Tauri imports. Give each host a narrow, explicit integration boundary for session-aware requests, navigation/recovery and only those storage/files/notification capabilities the selected release actually needs. Avoid a generic plugin platform or a large speculative host abstraction.

Acceptance should distinguish source/documentation evidence, fixture E2E, installed stable-userscript E2E and device E2E. For a repeatable artifact, record sanitized fixture inputs or scenario identifier, package hash, exact browser/manager/device versions, expected user-visible result, result receipt and replay instructions. Synthetic test results must remain labeled synthetic.

## Trade-offs in this research

- **Primary documentation plus dated local evidence:** establishes current public contracts and preserves prior learning; does not prove today's forum deployment or current installed stable runtime behavior.
- **No live account experiment:** avoids altering shared browser/forum state while charting; leaves login-cookie scope, challenges, redirected authenticated actions and mobile storage as explicit unknowns.
- **No framework verdict from runtime facts:** both React and Vue satisfy Tauri's frontend model; choosing one still needs maintainability and product-interface evidence.
- **Minimal proposed host boundary:** keeps later portability visible without building a speculative framework; some native-specific work will deliberately remain until Android planning.
- **Desensitized synthesis only:** records contracts and bounded conclusions; does not copy cookies, account identifiers, message bodies, signed URLs, raw response captures or historical private artifacts.

## Provenance limits

This note reports read-only source/documentation inspection. Publishing it as a research artifact adds no product-test or live-runtime evidence. No browser state, credentials or forum operation was accessed. The repository's new future-build scope takes precedence over old experiment ADRs and historical task instructions.
