# Download integration with appearance and section navigation

The canonical download implementation is qualified on verified appearance commit `6584a3febc1ea22afb9b71d598ca015b420d7e79`. Original standalone download commit `6dc222d647555536661e8b007e2afea03172eac5` and its exact 6457 candidate remain preserved as provenance. Its own installed development checks and completed-work review have passed. The standalone installed receipt does not qualify these new bytes.

The workspace receives the existing preference host followed by the optional download host. Current section navigation invalidates a pending attachment attempt, preventing a delayed access response from starting a binary request after the user leaves. The prepared file remains available during language, theme and text-size changes; leaving the section and returning does not restore a save attempt. All application-authored attachment labels, statuses and failures use the existing interface-language boundary. Native filenames, access details and forum content remain unchanged. Forum-client download interpretation and binary browser-host code are unchanged from the verified standalone implementation.

## Failure-first evidence

The new complete-application cases use the existing layout → workspace → public forum client → browser host seam and replace only external HTTP. They do not mock internal state, download hosts or browser storage.

| Expectation                                 | Meaningful RED                                                                                         | GREEN                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `J8.download-section-cancel-1280/960/375`   | `2026-10-19T10-09-47.347Z`: all three widths dispatched a late binary request after leaving the reader | `2026-10-19T10-10-11.378Z`: the existing cancellation operation runs on section change, with zero late binary requests                |
| `J8.download-appearance-zh-CN/zh-TW`        | `2026-10-19T10-10-45.901Z`: download controls remained English after Settings language changes         | `2026-10-19T10-12-48.158Z`: localized controls/status, preserved prepared file, exact actual saved bytes and no restored save attempt |
| `J8.download-localized-refusal-zh-CN/zh-TW` | `2026-10-19T10-13-09.133Z`: an HTTP 403 file refusal remained English                                  | `2026-10-19T10-13-58.905Z`: localized refusal, unchanged native content and no Save action                                            |

Initial selector-diagnostic runs are also retained separately: `10-09-31.925Z` had two ambiguous locators, and `10-11-25.389Z` reached successful localized file saves before encountering two incorrect names for existing section controls. They are not presented as production failures or successful complete journeys.

## Combined candidate

Private version 0.2.0 userscript: **711,942 bytes**, SHA-256 `ff571bd9e5516db0142c6d07c6ed683418b8719c122d4599cffe88b1cba54fe9`. Search and its coordinated 0.3.0 contract change are not part of this candidate.

The full application baseline passed **138/138** at `2026-10-19T10-14-34.443Z`: 99 inherited appearance/reading cases and 39 download cases. Clean external consumption passed at `consumer-2026-10-19T10-14-39.833Z`. Strict typecheck, zero-warning lint, format, build and Git diff checks passed with pinned Node 24.22.0/npm 11.21.1. Exact manifests verified 95 application and 3 consumer files. All seven new screenshots were inspected together; both localized actual-file receipts independently match 55 authored bytes and SHA-256 `433506ebc4e78b00d49f567d12dc6d94da21cd819bf2faf3a36e43ffb18e6933`. The application still reports browser-save request uncertainty independently of the test's observed disk result.

This documentation was added after the completed executable/test snapshot and does not change the candidate bytes. Integrated Edge → Chrome exact source readback, four ordinary/accessible-paid disk outcomes and final BDFL reconciliation passed. The current runtime and direct disk evidence, including the unavailable native Downloads-page observation, are recorded in [28-installed-integrated](28-installed-integrated/report.md). Stable manager/browser and Windows release qualification remain later requirements.

No additional production trade-off was introduced. This uses the previously selected section owner, ephemeral download lifecycle and typed translation boundary. The five download trade-offs in [28-downloads.md](28-downloads.md) continue to apply. The orchestration choice to preserve a linear one-commit-per-ticket integration history at the cost of separate qualification checkpoints is recorded once in the orchestration ledger.
