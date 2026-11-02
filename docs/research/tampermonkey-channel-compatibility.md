# Tampermonkey Beta and Stable compatibility

Source inspection: 2026-11-01. This note compares official documentation for BETA 5.6.6242 and Stable 5.5.1; it does not execute either extension or change release qualification policy.

## Published differences and common behavior

These are distinct extension distributions. Tampermonkey's [official-version table](https://www.tampermonkey.net/faq.php?q=Q406) lists separate Stable/Beta IDs and separate Chrome Web Store/Edge Add-ons packages; all four Chromium variants are Manifest V3. Browser, store, channel and exact version therefore identify the runtime more precisely than “Tampermonkey”.

The canonical [Chrome Beta changelog](https://www.tampermonkey.net/changelog.php?show=gcal) and [Edge Beta changelog](https://www.tampermonkey.net/changelog.php?show=fcmf) label **5.6.6242, 2026-09-29**. They describe a new inline installation method, default in automatic mode; reduced managed-storage retries during Chromium startup; a context-menu implementation rework; and additional request/provisioning changes. The [menu API documentation](https://www.tampermonkey.net/documentation.php?locale=en&q=GM_registerMenuCommand) explicitly introduces `clickedFrame` at **5.6.6242+**, allowing a merged menu command to invoke only the clicked frame's callback. This is a concrete API difference, not evidence that existing menu calls fail on Stable.

[Stable's changelog](https://www.tampermonkey.net/changelog.php?show=iikm) labels **5.5.1, 2026-10-01** and includes request background-unload/abort fixes, SRI enforcement correction and an offscreen-document crash fix also present in Beta's notes. Stable 5.5.0 already separated update checks from automatic installation. Consequently, neither a higher Beta version nor a Beta changelog entry establishes that Stable lacks every listed fix.

## Runtime settings matter independently of channel

- [Execution permission](https://www.tampermonkey.net/faq.php?q=Q209): Chromium Tampermonkey 5.3+ requires the applicable Allow User Scripts toggle or Developer Mode.
- [Content Script API](https://www.tampermonkey.net/documentation.php?locale=en&q=content_script_api): injection modes differ in background messaging and genuine `document-start` support. [Run timing](https://www.tampermonkey.net/documentation.php?locale=en&q=run_at) is the earliest requested opportunity; `document-end` runs when or after `DOMContentLoaded`.
- [Sandbox](https://www.tampermonkey.net/documentation.php?locale=en&q=sandbox): omitted `@sandbox` currently selects raw/page execution, with enabled-context fallback when page injection is unavailable, for example because of CSP. [Grants](https://www.tampermonkey.net/documentation.php?locale=en&q=grant) control exposed APIs; `@grant none` differs from an omitted grant.
- [Update metadata](https://www.tampermonkey.net/documentation.php?locale=en&q=update_url): update checks require `@version`; `@downloadURL none` disables checks. Record update settings and installed script bytes when comparing observations.

These are current general contracts, not version-frozen documentation or proof that these settings changed between the two releases.

## Application evidence and practical implication

The [#37 closure record](https://github.com/Benson-mk/tsdm-ui/issues/37#issuecomment-6528322104) records Chrome on macOS with Stable 5.5.1 at the explicitly accepted scope; the manager version is attributed to the user's attestation. Earlier [development observations](../implementation/19-installed-integrated/report.md) identify Beta 5.6.6242. These are not a controlled same-candidate, same-browser, same-configuration comparison: application candidates and observation scopes differ. The available #37 record does not establish a Beta-only cause for its application corrections or complete channel equivalence.

Source inspection of local qualified commit `46cb84000d47483d4c6ad3c3b83bf48cbac66772` (`vite.config.ts`, `src/main.ts`, `src/hosts/{browser,download,navigation,preferences}.ts`) shows only `GM_registerMenuCommand` in the userscript grants, at `document-end`, without the new `clickedFrame` option. Requests/uploads use browser fetch/XHR, downloads use Blob/anchor, recovery uses sessionStorage, and preferences use localStorage. No GM request/download/tab-storage API is used on those paths. This limits direct dependence on manager API differences, while leaving injection, execution context, startup, native-escape menu and replacement behavior relevant.

The earlier [#17 vendor-source audit](../implementation/17-acceptance.md#vendor-source-corroboration-of-the-historical-gm-failure) found the same relevant unpersisted service-worker map architecture in official Beta 5.6.6242 and Chrome Web Store Stable 5.5.1 tab APIs. It did not execute Stable or audit the Edge Add-ons Stable package. That observation supported replacing GM tab storage; it does not show that switching to Stable alone fixes recovery.

For an unchanged candidate/browser/OS, reuse manager-independent application/library evidence and retain focused Stable identity, startup/injection, native-escape menu, recovery/replacement and representative request/upload/download observations. Existing applicable #37 Stable observations need not be repeated merely to rename a report. Revised #38 still requires its installed Edge Stable evidence; #47's genuine manager-update observation is a separate lifecycle requirement. Nothing here transfers an unobserved outcome into a pass or changes those accepted scopes.

## Evidence boundary and trade-off

**Inference:** a Beta pass establishes the observed candidate/runtime/configuration result. It does not by itself establish a Stable pass. Published differences justify checking relevant installed boundaries, not inventing a regression or repeating every server workflow. Apply the existing [bounded qualification decision](../adr/0002-qualify-installed-releases-with-bounded-evidence.md); accepted historical scope remains intact.

Trade-offs: (1) this read-only investigation combines official release notes/API documentation with recorded project evidence and pinned application source instead of installing extensions or making a fresh package-binary comparison; the complete binary delta, historical installation defaults and controlled cross-channel behavior remain unmeasured. (2) Focused Stable observations plus relevant shared evidence reduce repeated validation while leaving unsampled manager/workflow combinations unobserved; a concrete difference expands the affected checks. No tests, installs, browser changes or forum operations were performed.
