# TSDM Workspace

The current implementation browses boards, returned thread pages and full rich posts through a Vue workspace, public portable forum client and same-origin browser host. It adds safe return history and exact-destination recovery. This is the local navigation candidate for [#17](https://github.com/Benson-mk/tsdm-ui/issues/17), following the qualified #16 foundation; it is not a qualified application release. Remaining journey work follows the native blocking graph under [#15](https://github.com/Benson-mk/tsdm-ui/issues/15).

## Reproduce the candidate

Use Node **24.22.0** and npm **11.21.1** (`.nvmrc`, `packageManager` and strict engines record the pair). Stable Google Chrome must be installed for the synthetic Playwright channel, and `openssl` must be available for the disposable local TLS redirect fixture. There is no unit-test runner.

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e
npm run test:consumer
```

`npm run dev` starts Vite's local userscript development server. The development loader is not the release artifact and is never used as installed qualification evidence. `npm run build` emits `dist/tsdm-workspace.user.js`, a build manifest with its SHA-256, and `dist/forum-client/` with the self-contained ESM library and declarations. CSS, Vue, Reka and the portable parser are bundled; no runtime CDN, update URL or download URL is emitted.

The selected dependency set is locked. Reka 2.11.0 was checked against current published peer ranges; matching the historical comparison is not its qualification. TypeScript 6.0.3 satisfies the checked lint/checker ranges. Strict checking includes declaration files; the explicit Vue component helper and Web Bluetooth type packages satisfy Reka/VueUse declaration dependencies. The core forum library imports none of those UI packages.

## Synthetic replay and artifacts

`npm run test:e2e` drives the emitted userscript through the real layout → workspace → public forum client → browser Fetch path. Only external requests are intercepted. Authored populated HTML/JSON, adverse responses and independently asserted request ledgers exercise identities, content trust, stale reads, native bypass and the initial Reka dialog. The emitted script runs in an isolated ordinary Chrome test page; this is **not Tampermonkey installation evidence**. Route-based cases run offline. Real 302 cases use a local HTTPS fixture and CONNECT proxy that sends every tunnel to that fixture, including browser-followed redirects; no remote host is contacted. Its disposable certificate is accepted only in that test context. Native fixture documents exercise actual browser session storage, including quota refusal and origin-modified records, without replacing Storage methods or application collaborators.

The machine-readable receipt contract is `evidence/receipt.schema.json`. Each run writes `evidence/runs/<run>/receipt.json`, `report.md`, `manifest.json`, an authored fixture/scenario source snapshot and synthetic PNGs. Every package file except the manifest itself is listed by relative name, byte size and SHA-256. Run `npm run evidence:verify -- evidence/runs/<run>` to check exact file coverage, safe paths, sizes and hashes; the format is documented in `evidence/manifest.schema.json`. Receipts record source/lock/case hashes, candidate bytes, runtime/browser identity, pass/fail and retry outcomes. A failure remains a failure; a later targeted pass does not turn it into a full baseline pass. The independent clean consumer packs and installs the public library in a fresh temporary directory outside this checkout, imports it on Node LTS, compiles public declarations without DOM types and round-trips a populated result through JSON. Its separate receipt/report/manifest lives under `evidence/runs/consumer-<run>/`.

The #16 foundation candidate passed its bounded installed Chrome/Tampermonkey checks; the [acceptance audit](docs/implementation/16-acceptance.md) identifies the exact bytes, observed outcomes and recovery limits. Retained source patches and fixture snapshots identify the local evidence inputs. Complete-spec code review and BDFL validation follow the completed #15 implementation; this foundation audit does not claim that later review or release qualification. Generated evidence is ignored pending inspection. It contains authored fixtures rather than authenticated captures. Do not publish browser profiles, credentials, real member screenshots, raw live HTML or private traces. Review every public text/image and the file manifest before deliberate publication. These commands do not publish anything.

## Manual candidate installation and recovery

1. Build once, retain those exact bytes and record `dist/build-manifest.json`. Do not rebuild during an installed run.
2. For release qualification use stable Tampermonkey; current development checks use the user-selected BETA manager, macOS Edge then Chrome. Install the locally authored `dist/tsdm-workspace.user.js` only with the applicable action-time authorization. Its only manager grant is `GM_registerMenuCommand` for emergency recovery; its sole origin is `https://www.tsdm39.com/*`. Confirm one enabled TSDM Workspace identity.
3. Export the manager-stored source and compare its SHA-256 to the manifest. A displayed version alone does not establish identity. Reload a matching board or thread after installation.
4. On a known populated read-only thread, confirm current member/guest state, title, post identities/content and ShadowRoot styling. Open **About this workspace** with the keyboard, Tab through it, Escape, and confirm focus returns to the invoker. Confirm the portal stays in the application's shadow tree.
5. On a nonmatching normal HTTPS page, confirm no workspace or style change. Check the manager's **Open this destination in native forum** entry.
6. On a safe opaque history entry, first use the manager recovery command: it resolves the privately saved native destination independently of Vue startup. When the saved metadata is unavailable, it can only recover the native Boards overview. For a known native destination, append `tsdm-native=1` to the existing forum URL query, preserving its fragment. The metadata excludes that URL, and runtime startup also respects it. Disable the script in the manager if needed. Remove only this bypass parameter and deliberately reload to re-enter.
7. Preserve the initial candidate outside temporary build output for the later manual replacement rehearsal. Record manager/browser/OS versions, exact stored-source hash, observations and limitations in a private installed receipt with an authored public summary.

The installed gate is **not run** by this repository's synthetic commands. The current #17 candidate is version **0.2.0**, **656335 bytes**, SHA-256 `a96675a9e03ff3034cc0d72f495d4a8ab7bf6de0bb0bc9f9d1d0fc9e21111ef0`. Its complete **67-case** application baseline, clean Node consumer and required static/build checks passed. Exact manager-stored source and affected installed checks subsequently passed on macOS Edge then Chrome under the user-selected Tampermonkey BETA. These cover populated vertical navigation at short and normal desktop sizes, keyboard reachability and activation, medium/narrow navigation, current-account refresh, actual canonical redirect/remount, Back/Forward/reload and native continuation.

The [#17 acceptance audit](docs/implementation/17-acceptance.md) marks all six criteria verified for the declared development scope after the final focused BDFL review confirmed both corrections and reconciled the exact evidence. It separates current-byte results from the unchanged historical da310 idle/copy/restart/skipped-mount/rich-content observations and the earlier failed GM-backed candidates. The changed-account failed-refresh cases are induced through the accepted full-application HTTP seam. No historical run is relabelled as testing the replacement. Full stable-manager/browser and Windows release qualification, later writing/session/manager-update requirements and complete-spec review remain required. No live forum writes, credit spending, notices, uploads, downloads or publication are authorized by a test command. Later tickets own preferences, writing/recovery and commands; unsupported content is visibly explained.

## Recovery contract

The [accepted page-session decision](docs/adr/0003-use-browser-page-session-recovery.md) uses one versioned `sessionStorage` record, `tsdm.workspace.recovery`, for navigation. Later writing recovery must extend this same owner. Every change is serialized through one queue and acknowledged by exact readback. Refused storage remains visible; there is no second GM/localStorage fallback or silent eviction. History holds safe URLs and opaque keys only. Missing, incompatible or malformed records require an explicit Reload.

Recovery follows the browser page session: an opener-created or browser-restored tab may inherit a copy, then diverges independently. Closing and restoring a tab may recover when the browser supplies that session; restoration is conditional, not a permanent draft collection. Same-origin scripts can read or modify the record. Loaded models are checked before inert rendering, and account/current-source/uncertain-operation rules still apply. No recovered content automatically submits a forum action. This navigation ticket adds no writing behavior.

Old development candidates used a GM-only navigation record. That record is not migrated or read alongside the new store. An old opaque URL without a browser session record shows unavailable recovery and offers explicit Reload or safe native Boards continuation.

## Public library contract

```ts
import { createForumClient } from "@tsdm/forum-client";
const forum = createForumClient({ origin, transport });
const result = await forum.readThread(threadURL);
```

The local packed artifact has an explicit `0.2.0` ESM entry and declarations. It exposes read-only directory, board and thread results through `readPage`, the direct-thread entry `readThread`, a serializable `describeDestination` helper, account generation, inert content and typed failure outcomes. The expanded result contract advances the local library from 0.1.0 to 0.2.0; no registry publication is implied. A transport supplies HTTP status, final observable URL, content type and body; it does not interpret forum meaning. Consumers must pin an exact artifact/version. Breaking contract changes require a version update and coordinated consumer updates. Registry publication and later CLI/MCP implementation remain unselected work.

See [failure inventory, early gates and trade-offs](docs/implementation/16-foundation.md) and [selective source provenance](docs/implementation/16-provenance.md).

See [navigation failures, operation choices and trade-offs](docs/implementation/17-navigation.md) and [navigation acceptance status](docs/implementation/17-acceptance.md).
