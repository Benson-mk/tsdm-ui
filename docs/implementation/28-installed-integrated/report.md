# Integrated download installed development evidence

All four file outcomes passed in **Edge then Chrome** on 2026-10-19 for the combined appearance/download candidate. This deliberately authored report uses file aliases and contains no raw member capture or private paid-file content.

Candidate: version 0.2.0, **711,942 bytes**, SHA-256 `ff571bd9e5516db0142c6d07c6ed683418b8719c122d4599cffe88b1cba54fe9`. Official local Tampermonkey MCP retained the preceding source and replaced/read back exactly these bytes in each browser. Each browser listed one TSDM Workspace source and each fresh document exposed one executing workspace ShadowRoot.

Current runtime high-entropy user-agent observations identify Microsoft Edge **155.0.4283.62** and Google Chrome **155.0.8059.84**, macOS **15.6.0**, arm architecture. Selected Tampermonkey BETA **5.6.6242** and Editors **1.0.7** remain user-reported. Stable-manager/browser and Windows release qualification are later gates.

| Browser | File alias     | Expected / actual bytes | Filename normalization  | Independent result                 |
| ------- | -------------- | ----------------------- | ----------------------- | ---------------------------------- |
| Edge    | ordinary-A.txt | 47 / 47                 | Collision suffix `(9)`  | Original bytes and SHA-256 matched |
| Edge    | paid-A.txt     | 169 / 169               | Collision suffix `(2)`  | Original bytes and SHA-256 matched |
| Chrome  | ordinary-A.txt | 47 / 47                 | Collision suffix `(10)` | Original bytes and SHA-256 matched |
| Chrome  | paid-A.txt     | 169 / 169               | Collision suffix `(3)`  | Original bytes and SHA-256 matched |

Each file was identified by its newly created fixture-specific filename and timestamp after a single Save click, then independently read from disk and compared with the supplied original. Repeated stat/byte/hash checks by the operator, advisor and merger agreed. All four changes were filename collision suffixes; no byte normalization occurred. Exact private filenames, paths and paid-file hashes remain in private receipts.

The native Downloads shortcut did not identify the filename, and direct internal Downloads-page navigation was blocked by browser URL policy. No workaround or duplicate save was attempted. **A native Downloads-page completion observation is not claimed.** Actual filesystem reads establish delivery. The application correctly retains its separate, localized statement that browser handling was requested and it cannot confirm whether saving completed or was cancelled.

Each scoped request ledger contains one fresh containing-thread GET followed by one exact offered binary attachment GET, HTTP 200 `application/octet-stream`, with the correct content length. Binary requests omit `tsdmapp`; there are no POSTs, purchases or retries. The paid attachment was already accessible following a separately authorized earlier fixture-setup purchase. No search or new purchase was performed in these checks.

On the prepared paid file, Edge switched to Traditional Chinese and Chrome to Simplified Chinese. The filename and prepared file remained available, controls/status translated, and one localized Save produced the exact file. English was restored afterward. Synthetic complete-application checks separately cover theme/text changes, section cancellation, real browser refusal and binary error responses.

The full combined baseline passes **138/138**, including 39 download cases and seven failure-first integration cases. The clean external consumer and strict checks pass. Source review and final installed BDFL reconciliation accept all four download criteria within the declared development scope; no additional production trade-off arose. The conservative markup-leading/HTML/JSON/XML/empty-file limitation remains explicit.

The original standalone `6457a604c049` installed package remains separately preserved in [28-installed](../28-installed/report.md). It is historical evidence for that artifact. Replay the current [installed procedure](../28-acceptance.md#installed-procedure) with your own authorized fixtures; this report does not authorize spending, publication or full-spec release.
