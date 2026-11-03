# Writing recovery and consequences — #61

Base: clean integration `499d75a28522bcd1dd38e2b6ba0709a831e4a5dc`; isolated `implement/ui-ux-61`. Read #52/#61, glossary and ADR0001/0002/0003 before source exploration. The owner selects sequential tickets, installed Edge per ticket, Chrome only #62 and equivalent Tampermonkey beta/stable. Root owns installed checks, final BDFL and commit/merge.

## Before-code failure inventory and approach

Confirmed seam: built userscript → maintained layout → workspace → forum client → browser host; only external forum HTTP is substituted. No internal mocks, new stores or after-code unit tests.

Reachable failures: technical revision acknowledgement obscures whether text is local; an already submitted context falsely says nothing was submitted; a resumed forum draft looks like locally saved writing or later local changes look remotely saved; pending recovery is mistaken for acknowledged; refused writes or incompatible/read-refused storage claim recovery; disclosure hides send blockers/account state/conflict/ambiguity/pending or uncertain attempts/financial consequences; disclosure, reading return, resize or locale changes lose original source/options/target/account/revision/attachments/attempts or invoke requests; generic failures claim account expiry; new summaries imply atomic server locking, transactional refund or automatic retry; packet creation or funded save conceals immediate debit/activity before publication; passphrases leak in newly added summaries; result details no longer permit inspecting full source/reference comparisons; focus/disclosure remounts editor or loses history.

Plan: keep typed operation and recovery owners unchanged. Put concise local-writing/forum-draft and browser-recovery explanations near the destination; keep revision numbers and conditional recovery limits in a native closed disclosure. Keep all existing blockers and operation controls outside it. Keep financial consequences visible near the destination and retain detailed original result/component observations. Existing conflict/reconcile/overwrite/check/warned-resend methods and downstream guards remain. Extend existing complete-application journeys in vertical red/green slices, retain authentic failures and exact source/build artifacts, and rerun only affected mechanism families.

## Actual trade-offs

1. Show one plain browser-recovery summary beside the destination and place revision numbers plus conditional lifetime/origin-authority detail in a closed native disclosure. This reduces routine technical text while adding one deliberate step for exact acknowledgement evidence. Disclosure state is view-local, not recovered, and neither mutates a content revision nor remounts the editor.
2. Preserve all account, recovery refusal, ambiguity, conflict, pending/uncertain and financial warnings and their existing controls outside that routine disclosure. Conflict source/options/reference comparisons and component/credit observations remain fully available. This keeps consequential evidence dense when a decision needs it rather than collapsing it for visual consistency. A real duplicate recovery alert discovered in regression was removed; refusal details now retain current/last-acknowledged numbers instead of repeating the alert.
3. Describe edits as local changes even when prior attempts exist, instead of conditionally claiming that nothing was submitted. Known forum-draft identity explicitly distinguishes an explicit server save from browser recovery. This avoids a false historical claim but does not attempt to infer whether current content differs from the latest server version; original attempt/result messages retain that evidence.
4. Add an early red-packet consequence paragraph near the destination while retaining the full existing deliberate funded-save/publication reviews and independent thread/packet/credit/refund observations. The additional warning repeats some later review information, in exchange for keeping immediate debit and activity before publication visible before a command is offered. No new financial operation, retry or authority is added.
5. Mask passphrases in retained read-only Unapplied packet settings, matching existing review/result masking, while retaining their exact source values in recovery and the original attempt. This corrects inherited plaintext disclosure without normalizing or discarding later local settings. Masking is presentation only: conditional same-origin recovery still retains the secret and is not an encrypted backup.
6. Qualify four representative appearance profiles and actual width transitions, with targeted account/conflict/recovery/uncertainty/attachment/financial mechanisms rather than multiplying entire unaffected suites. Pending/load-refused explanatory branches use the unchanged typed host state; real quota exhaustion and malformed retained data exercise actual browser refusal/incompatibility without installing an internal storage mock. Chrome is deferred to #62 by owner instruction and unchanged input code does not supply a new physical IME claim.

## Acceptance mapping

- [x] Plain localized local writing/forum draft and acknowledged/pending/unavailable/refused/incompatible browser recovery; conditional lifetime and inspectable details.
- [x] Routine diagnostic/revision disclosure with account/recovery/ambiguity/conflict/pending/uncertainty outside collapsed groups.
- [x] Deliberate conflict, original-check and warned-resend paths preserve comparisons and fresh guards.
- [x] Prominent immediate debit/activity and independent thread/packet/credit/refund uncertainty, masked passphrases; synthetic financial checks only.
- [x] Account/recovery/conversion/ownership/pending/lost/attachment journeys retain original writing and attempts without incidental effects.
- [x] Named full-application E2Es precede feature/correction code with independent request/state readback.
- [x] Three widths and representative text/Compact/theme/language/keyboard coverage.
- [x] Relevant static/build and Edge application checks, exact installed workflow and final BDFL; Chrome deferred to #62.

## Delivered behavior and boundary

Local-writing/forum-draft identity and the plain browser-recovery summary precede title/editor tools. Current acknowledgement, transient pending, refused load, unavailable save and incompatible data remain distinct. Refusal asks the author to copy writing before reload and explains the existing send/upload pause; it never labels generic failure as account expiry. Exact revision evidence, browser-controlled restoration and same-origin access limits are inspectable with ordinary keyboard disclosure. Existing retained-reading warnings remain in their prior owners.

No workspace, forum-client, transport, storage, editor or package contract changes. Source-first editing, one context, source/options/target/account/attachments/revisions/history and original attempts retain their current owners. No fallback store, stronger durability, isolated storage, atomic conflict lock, successful financial rollback or automatic resend is promised. Existing native continuation and explicit discard/reload/reconcile/overwrite/original-check/warned-resend paths remain.

## Frozen identity and verification

Final executable `a44a62c2115f067b5ba1cc46ab4f335fa293b5fedf1e7b41a17240bf9a2ff98c`, **1,774,081 UTF-8 bytes**. Pinned Node24.22.0/npm11.21.1, Playwright1.64.1 and real Edge channel. Typecheck, lint, formatting, complete build and diff checks pass. The portable `0.15.0` artifact remains unchanged; no new public contract requires a version bump or repeated consumer qualification.

- Final run `2026-11-03T14-25-47.391Z`: **89/89** targeted application cases, including all **15 UX61**. This covers account transitions, sole-context retention, acknowledgement/reload, real quota refusal, incompatible data, source ambiguity in all locales, full conflict/overwrite/manual reconciliation/ownership gates, original draft checks and explicit resend boundaries, lost/pending financial outcomes, refunds remaining unknown, attachment upload/removal uncertainty and delayed masked settings.
- Earlier final-candidate run `2026-11-03T14-24-46.492Z`: **21/21** direct affected cases, including all15UX61 plus existing persistence/action-binding/refusal/later-settings paths. It identifies the same runtime, not a different final candidate.
- Representative appearance:390×844/100%/Light/English,390×844/150%/Dark/Simplified,768×900/70%/Mono/Traditional and1440×900/150%/Alias/English, plus resize through all three widths. Named cases assert disclosure and writing widths, exact full recovery object and no additional requests; authenticated installed observations remain root-owned. Inspected narrow enlarged Dark/Simplified and tablet Compact/Traditional screenshots. Long details scroll in the existing writing region.

Every final runtime source input matches the final passing receipt. `evidence/runs/61-candidates-2026-11-03/index.json`, each named `source.tar.gz`, exact emitted userscript/metadata/build manifest and original reporter package preserve candidate identity. `verify.py` verifies manifests, original sources/artifacts and executable hashes. Final installed evidence, current native CJK claims and BDFL are not inferred from this synthetic package.

## Authentic failure history

| Run UTC on2026-11-03 | Observation                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14:15:58             | Genuine baseline absence of plain local-writing guidance; final#60 executable104450 retained.                                                                                                                                                                                                                             |
| 14:16:52             | First local/current-recovery/closed-details slice green on c8dfb0379.                                                                                                                                                                                                                                                     |
| 14:17:47             | Three genuine missing draft identity/financial guidance/refusal-copy results; local and incompatible cases already green.                                                                                                                                                                                                 |
| 14:18:40             | All five state cases green on be2782524.                                                                                                                                                                                                                                                                                  |
| 14:19:34             | Seven cases pass; conflict request assertion sampled before async preparation finished, and narrow entry failed to open Navigation. Run deliberately interrupted after identifying the repeated setup problem; two remaining cases did not run. These are retained as setup/incomplete evidence, not runtime sensitivity. |
| 14:20:38             | Corrected completed-preparation boundary and narrow entry make all five targeted setup corrections green on unchanged be2782524.                                                                                                                                                                                          |
| 14:21:25             | Genuine read-only later-passphrase exposure and two missing localized refusal-copy/paused-send explanations, all three red.                                                                                                                                                                                               |
| 14:22:03             | Masking/explanation correction d2224ce0d passes16/16 affected.                                                                                                                                                                                                                                                            |
| 14:22:38             | 74/75 affected mechanisms pass; existing refusal selector finds both the new plain alert and repeated alert inside details.                                                                                                                                                                                               |
| 14:23:43             | 7/8 extra persistence/reply/ambiguity cases pass; same duplicate warning is exposed after deliberately opening details.                                                                                                                                                                                                   |
| 14:24:22             | New precise single-warning expectation genuinely fails on d2224ce0d before correction.                                                                                                                                                                                                                                    |
| 14:24:46             | Final a44a62c21 replaces repeated refusal detail with current/last-acknowledged revision evidence;21/21 affected pass.                                                                                                                                                                                                    |
| 14:25:47             | Final targeted89/89 pass. Earlier failures remain under their original candidate identities.                                                                                                                                                                                                                              |

## Replay

From the exact named run's `source.tar.gz`, unpack in a new directory and run `npm ci` with Node24.22.0/npm11.21.1. Build and compare the emitted userscript SHA-256 before replay. Keep original reporter directories alongside candidate packages for screenshots, recovery/state/request ledgers and scenario sources. No live effects occur in these deterministic fixtures.

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright test tests/e2e/writing.spec.ts tests/e2e/new-thread.spec.ts tests/e2e/replies.spec.ts tests/e2e/drafts.spec.ts tests/e2e/edit-post.spec.ts tests/e2e/funded-drafts.spec.ts tests/e2e/attachment-authoring.spec.ts --grep 'UX61|J5.pending-persistence|J5.reply-action-binding|J5.refusal|J6.J7.funded-draft-later-settings'
python3 evidence/runs/61-candidates-2026-11-03/verify.py
```

The full bounded regression command is retained as `regression-command.txt` in the candidate index directory; it drives89 named cases rather than unrelated entire suites.

## Installed acceptance and final BDFL

Final installed Edge source exactly matches `a44a62c2115f067b5ba1cc46ab4f335fa293b5fedf1e7b41a17240bf9a2ff98c`. Root's private `evidence/runs/61-installed-edge-2026-11-03` report/receipt and all28 manifest entries verify the exact executable, complete writing state and observations. Recovery details are closed on initial live entry; the archived final state deliberately leaves the disclosure open after the keyboard inspection. Those are distinct observations rather than a claim that the archived state is initially closed.

Plain local-writing/current browser-recovery guidance, keyboard disclosure and return to reading/writing preserve the complete writing object. Owner-approved150%/Dark/Simplified appearance and actual390×844,768×900,1440×900 viewports preserve writing; application client/scroll widths are390/390,768/768,1440/1440. Disclosure and appearance ledgers each contain zero requests. Original100%/Alias/English appearance and native1265×629 viewport are restored.

Deliberate reload retains acknowledged writing and shows the unchecked-account pause outside the collapsed routine details, including while reading. A deliberate current-account/form check uses a freshGET. Undo/Redo preserves original source and the deliberate exclamation edit; final source75characters/revision5 and original context identity/options/references remain exact, with the source editor focused. The complete52→679 ledger contains126GET and zeroPOST, including two application fetches, without truncation or remaining pages. No live post, forum-draft save, upload/removal or debit occurs.

Final BDFL validates all eight acceptance criteria and the28-entry installed manifest without an actionable finding or distinct additional trade-off. Chrome remains deferred to final#62. No new physicalIME pass is claimed for unchanged input handling; Windows and actual manager-update observations retain their accepted deferred scopes. No push or PR is created.
