# Integrated responsive forum journey — #62

Base: integration `053bd341ab6416947a470ec20fa2bff758797e88`, clean isolated
`implement/ui-ux-62`. Read #52/#62, glossary, ADR0001/0002/0003 and the
implement-spec/tdd instructions before implementation. Edge is the development
browser; installed Chrome is checked only in this final ticket by owner request.

## Before-code failure inventory

Confirmed seam: built userscript → real layout → workspace → forum client →
browser host, replacing only external forum HTTP. Extend the existing prepared
review HTTP fixture; preserve its independent stored fields and request ledger.
No client/workspace/host substitutes, after-code unit tests or live effects.

Reachable failures: directory filtering changes remote navigation; category and
page URLs lose criteria; Back loses populated results or nonzero offsets; direct
arrival reserves an empty result pane; rich regions overflow the reader or lose
keyboard access; replying picks the wrong author/post; formatting normalizes
protected markup or loses Undo/selection; compact/expanded/reading/resize
transitions lose writing identity, account, target, options, attachments or
revision; review changes source or sends early; field correction targets a hidden
field; frozen approval silently accepts later changes; delayed/uncertain original
attempts overwrite later writing or replay on return/reload; synthetic success
does not independently read stored content; presentation creates effectful HTTP;
geometry and source identities describe an earlier executable.

## Plan and expectations

First extend the external HTTP fixture with opt-in populated directory, grouped
board criteria, long rich thread and native addressed-reply form. Write a named
mixed-journey expectation before any runtime correction, exercise it on the
existing #61 candidate, then add direct-entry/new-thread/owned-edit transitions.
Reuse unchanged delayed/uncertain/account/attachment guard cases with explicit
candidate bounds. Measure final narrow chrome against the original412.28125px
baseline and the preselected240px budget, record three widths and representative
text/Compact/theme/language/keyboard profiles. Archive authentic failures,
emitted artifacts and exact input sources. Map all38 stories and10 outcomes.

The parent owns installed same-candidate Edge/Chrome/native CJK checks, final
code-review/BDFL, consolidated trade-off ledger and acceptance/commit/merge.
Windows and genuine manager-update observations retain their deferred scopes.

## Distinct #62 trade-offs

The one new layout decision is recorded once as62.1 in the
[consolidated ledger](62-tradeoff-ledger.md). Shared qualification decisions
V1/V2/V3 retain their recorded bounds.

## Acceptance status

- [x] Mixed directory → grouped category/page board → rich thread → addressed
      writing → retained reading → expanded writing → field correction → frozen
      review and one independently verified synthetic reply; direct arrival and owned
      opening/reply edits plus ordinary new-thread paths.
- [x] Complete writing identity, source/title/category/effective options/target/
      account/attachments/revision and selection retained; request ledgers show no
      effectful forum requests from presentation. Frozen originals, invalidation and delayed uncertainty
      are exercised on the final candidate.
- [x] All38 stories and10 parent outcomes mapped in
      `62-requirement-map.json`; exact slice evidence bounds remain explicit.
- [x] Final installed same-candidate Edge/Chrome, native focus/portals/CJK and
      retained-writing/review observations verified at the bounded scope below.
- [x] Reproducible synthetic report, receipt, original manifests, exact build/
      source packages, replay and authentic failures retained.
- [x] Final Standards, Spec and BDFL source/synthetic/installed-evidence audits
      have no actionable findings. The consolidated distinct ledger is complete,
      including the one new layout trade-off.
- [x] Named E2E expectations and actual failures precede runtime correction at
      the confirmed seam; no new unit tests or internal substitutes.
- [x] 390×844,768×900,1440×900 and representative default/enlarged/Compact,
      Light/Dark/Mono/Alias, English/Simplified/Traditional and keyboard checks.
- [x] Static/build, affected Edge application and final installed Edge/Chrome
      checks pass; final BDFL acceptance verifies all nine criteria.

## Delivered correction and exact candidate

The integrated journey found a real interaction defect. At390×844 with150%
Text size and Navigation disclosed, the shell left146.109375px for writing. The
142.28125px presentation strip plus48px padding squeezed `.writing-content` to
zero height. Review could be invoked by keyboard but its heading and body error
were entirely clipped; ordinary pointer scrolling/clicking was intercepted.
Three named expectations preserve that genuine baseline before the CSS change.

The10-line narrow/open-navigation rule adds outer vertical scrolling and a48dvh
minimum writing height. The corrected state has405.109375px writing and
214.828125px usable content. Pointer and keyboard review, visible review heading,
visible body correction, pointer source focus, reading/writing return, resize
and closing Navigation back to shell scrollTop0 all pass without a request or
writing-state change. Existing appearance-anchor and composition mechanisms
pass unchanged.

Final userscript SHA-256:
`51726ffd9bcbb5f1c15b7e92fb2ff52b54ac0abc6ef405ba8a4e43787faeb2e4`,
**1,774,279 bytes**. The portable forum-client ESM remains
`d70c630edb013650af79f466536a2acb8f9b8447da1cdf8928a86bf931bffe61`;
its0.15.0 contract has no change. No workspace, client, editor or host logic is
changed. Node24.22.0/npm11.21.1 and Playwright1.64.1 drive the real Edge channel.
Typecheck, lint, formatting, build and diff checks pass. The existing Vite
future-native-config warning remains.

Final affected run `2026-11-03T14-54-47.707Z`: **51/51** application cases pass.
This includes all7UX62, all8UX53 responsive/navigation/appearance-anchor cases,
source/visual writing continuity, native browser-composition controls,
five frozen new-thread/reply/addressed/owned-edit submissions with independent
stored-content readback, review invalidation/account/target/delayed uncertainty,
attachment labels and source/visual body-error viewports. It is a bounded
mechanism regression, not a replacement claim for every older passing suite.

Exact-source replay after final formatting/report/map work,
`2026-11-03T14-59-35.381Z`, passes all7UX62 on identical51726. Guarded financial
review/cancel, funded consequences/later masked secret, original uncertain
attachment/edit, full conflict comparison and actual quota/incompatible recovery
also pass **8/8** in `2026-11-03T15-00-46.278Z`. The51-case run and8-case run
contain59 distinct named application cases; the later7 replay repeats only the
new integrated cases. No test count is used as a substitute for acceptance.

Final ordinary signed-in retained-hidden-writing geometry is **229.1875px
chrome and614.8125px reader**, with390/390 client/scroll width. This improves the
original same-state412.28125px baseline by183.09375px, within the preselected
240px budget and above422px reader floor. The full addressed mixed journey
independently measures the same geometry and restores650px reading offset plus
a nonzero populated-board offset. The extra44px compared with #53's earlier
185.1875px chrome belongs to the later retained-writing entry; its earlier bytes
are not presented as the final geometry. The ordinary measurement excludes an
active orphan-reference warning; warnings remain visible and may consume space.

All three widths are captured with150%/Dark/Simplified new-thread,
70%/Mono/Traditional owned-opening edit and100%/Alias/English owned-reply edit.
The default100%/Light/English mixed reply covers keyboard directory/category,
code/table scrolling, selection formatting, Undo/Redo, protected source and
correction. Existing localized review/continuity/navigation cases broaden the
representative matrix. Screenshots are synthetic; inspected the corrected
open-menu150% state and the ordinary retained reader. Installed evidence is
separate and authenticated raw material remains private.

## Final installed Edge and Chrome observations

Both actual manager-stored exports independently hash to the final51726
executable above, each1,774,279bytes. Fresh isolated installed tabs exercise the
same candidate in Edge and Chrome on macOS; previous owner-writing tabs remain
intact. Beta and stable Tampermonkey are treated equivalently by owner direction.
This qualifies the affected #62 workflow and does not claim a new full release
or a deferred platform/update lifecycle.

Both browsers verify direct desktop arrival without an empty results track,
populated-board/thread return, accessible Navigation Escape/focus behavior,
direct formatting and Undo/Redo, retained reading/writing, frozen review and
cancellation. Settings opens through the actual portal with keyboard focus
contained and returns focus to Settings; the complete writing object is exact
across that inspection. Pointer review works with Navigation disclosed and150%
text on the corrected390×844 layout.390×844,768×900 and1440×900 are exercised;
Edge includes150%/Dark/Simplified observations and Chrome includes the enlarged
Dark check plus default width transitions. Both restore100%/Alias/English.
The installed ordinary390px reader independently measures229.1875px chrome and
614.8125px reader, matching the synthetic final-candidate measurement.

Physical macOS Cantonese/Jyutping input in each browser commits `測試`, then a
deliberate presentation switch ends unfinished composition while retaining raw
`syu jap`, under the owner-selected #57 policy. Independent complete-source
readback preserves both the committed phrase and raw input. The source editor
is focused; Undo/Redo, reading return, resumed writing and prepared-content
review/cancellation retain the expected source and writing identity. This does
not revive the earlier rejected active-candidate-preservation experiment.

The bounded installed Edge ledger contains **16GET /0POST**. Chrome contains
**15GET /12POST**; all12POST requests target **`/cdn-cgi/rum` telemetry**. Chrome
therefore has zero effectful forum mutation requests, not zeroPOST requests.
Neither installed journey publishes, saves a forum draft, uploads/removes files
or spends credits. Raw authenticated captures stay private. The parent retains
and seals the installed report, receipt and exact manifest under
`evidence/runs/62-installed-2026-11-03`. All91manifest entries verify; the final
BDFL independently confirms the seal exactly covers the retained bundle and its
byte identity, runtime/state/native/geometry/network claims. No criterion4/6/9
gap remains.

## Final reviews

The code-review skill reviewed the integration from fixed base
`3f4d91deb98310bb289349187ec0f17f24c05a54` through the completed slices and #62
working changes. Separate Standards and Spec reviews report **zero actionable
findings**; documented-standard findings and actionable heuristic findings are
also zero. Both are read-only and add no distinct trade-off.

The designated gpt-6.1-sol/xhigh BDFL independently agrees with the source and
synthetic conclusions and reports no additional trade-off. Its audit verifies
all14candidate packages,3,796original inputs and930reporter files;59distinct
final affected application cases plus the7-case exact-source replay; all38
stories and10outcomes including their mapped retained #54/#55 evidence; and32
earlier reporter manifests. Original zero-height failures remain red on a44.
The final sealed installed/native evidence audit passes independently: all91
manifest entries verify and exactly cover the bundle; all60runtime inputs match
the final executable receipt. The advisor confirms all nine #62 criteria with no
remaining gap and no distinct additional trade-off. Earlier failed observations
keep their original outcomes and deferred qualification scopes remain unchanged.

## Authentic observations

All timestamps are UTC on2026-11-03. Each reporter receipt and source package
retains its actual outcome and executable. No failed run is promoted to passed.

| Run      | Result and interpretation                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14:41:34 | Setup failure: board pager is named Board pages, not generic Pages.                                                                                                                                                                |
| 14:42:55 | Setup failure: direct formatting enters visual mode; source readback requires switching through the Source editor control.                                                                                                         |
| 14:44:15 | Ordinary geometry was sampled with an active orphan-reference warning. Warning consumed space as designed; new reply fixture then excludes unowned attachment77. Owned edit cases retain valid77 metadata.                         |
| 14:44:52 | Incomplete compact review timeout with Navigation left disclosed after Back. Closing the menu and expanding permits the initial mixed journey to finish; later dedicated expectations expose the actual enlarged open-menu defect. |
| 14:46:05 | Mixed journey passes on unchanged a44.                                                                                                                                                                                             |
| 14:47:18 | Two setup selectors still used English Complete source after deliberate language changes; owned reply passes.                                                                                                                      |
| 14:48:46 | Three integrated cases pass; enlarged new-thread pointer review fails with Navigation open. This is the real integration defect, not dismissed as fixture setup.                                                                   |
| 14:49:50 | All4 mixed/entry cases pass with menu deliberately closed. This run does not qualify the disclosed-menu path.                                                                                                                      |
| 14:51:01 | Dedicated pointer case fails; keyboard command invokes review. Geometry proves writing-content0px.                                                                                                                                 |
| 14:52:43 | All3 dedicated expectations fail before runtime correction: pointer reachability, visibly readable review and visible body error.                                                                                                  |
| 14:53:42 | All7 integrated/disclosed cases pass on corrected51726.                                                                                                                                                                            |
| 14:54:47 | Final51/51 bounded affected regression passes on51726.                                                                                                                                                                             |
| 14:59:35 | All7UX62 pass with final formatted scenario sources and authored mapping on identical51726.                                                                                                                                        |
| 15:00:46 | Eight guarded financial/active conflict/uncertainty/attachment/recovery cases pass on51726.                                                                                                                                        |

## Replay and retention

`evidence/runs/62-candidates-2026-11-03/index.json` indexes each authentic run.
Each named package retains `source.tar.gz`, exact userscript/metadata/build
manifest and its own SHA-256 manifest; the original reporter directory retains
receipts, screenshots, state/request artifacts and scenario sources.
`verify.py` verifies package files, every original reporter manifest and the
archived input hashes against each receipt. No authenticated live dump is
included in these synthetic packages.

Unpack the selected exact source archive into a clean directory, install locked
dependencies using Node24.22.0/npm11.21.1, build and compare the emitted userscript
hash with that receipt before replay. The existing source does not create live
effects: its isolated offline Edge fixtures substitute only external HTTP.

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright test tests/e2e/prepared-review.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/writing-presentation.spec.ts --grep 'UX62|UX53|UX57.composition|UX57.browser-composition|UX57.continuity|UX59.frozen-|UX59.invalidate-|UX59.cancel-preservation|UX59.delayed-uncertain|UX59.layout-|UX59.attachment-labels|UX60.error-viewport'
python3 evidence/runs/62-candidates-2026-11-03/verify.py
```

Prior53–61 reports remain the authoritative slice source/build/run/installed
records; the requirement map links them instead of relabelling their executables.
No live write, draft save, upload, removal or debit is exercised. Windows and
genuine manager-update deferrals remain unchanged. No parent issue modification,
application publication, push, PR or commit is performed by this implementer.
