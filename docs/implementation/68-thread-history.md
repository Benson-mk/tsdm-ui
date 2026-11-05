# Adjacent thread history — implementation record

Work is in progress against parent #64 and ticket #68, from integration commit
`6e6c038`, integrated with shell commit `7cca5ab`. The primary seam is the user-approved built userscript in Edge with
only external HTTP substituted; the existing packed-client consumer is the
compatibility seam. Integrated installed checks and final BDFL validation pass.

## Before implementation: failure inventory and plan

- Returned native pager controls may have empty labels, duplicate top/bottom
  controls, unrelated post-authored links, or cross-thread/filter URLs. Preserve
  actual URLs and native structural provenance; translated labels and post counts
  cannot establish adjacency or a last page.
- Prepending changes geometry; appending may clamp scroll at the prior end. Rich
  media may settle late. Retain post identity and a nonzero viewport offset, and
  stop restoring once the reader deliberately changes position.
- Overlapping pages repeat stable IDs. A directional page may contain no usable
  posts, repeat itself, change account/filter/thread, fail, or finish after a
  deliberate navigation/preparation. Retain readable content, expose a deliberate
  directional retry, and never overlap history requests or retry automatically.
- Exact links and latest targets must use returned destinations, preserve redirects
  and override old positions. Manual adjacent loading must not create Back entries.
- Added page ranges must stay transient: storing them into every navigation entry
  would grow page-session recovery and risk losing acknowledged writing. Existing
  compatible records remain valid; optional portable metadata is explicitly versioned.
- Public client account authority and the shared request sequence must remain one
  owner. History cannot start while deliberate operations are busy, and completion
  cannot overwrite a different context or writing preparation.

The first tracer E2E is `IM68.manual-range`: start on a middle native page, prepend
and append through visible controls, deduplicate overlaps, retain nonzero anchor
and offset and confirm history length and recovery payload do not grow with the
range. Subsequent failure-first scenarios cover retries, stale work, exact targets,
late media, account/filter mismatch and unknown pager provenance.

## Current evidence

Current native pagination evidence is being gathered before adapter implementation.
Historical `docs/research/45-structured-thread-reading-api.md` is context only.

## Trade-offs

Pending implementation decisions and observed results.

## Implemented behavior and evidence

The current installed Edge observations supplied by the integration agent on
2026-11-04 establish native `.pg` current/`custompage`, `.prev`/`.nxt`, `.last`
and exact redirect behavior. On a five-page thread the first, middle and final
pages respectively offered next-only, previous/next, and previous-only links.
A long thread offered numeric pages 2–10 and a distinct `.last` target for page 425. Exact-post and latest links returned server-selected page/PID fragments.
No page is computed from post counts or translated pager labels. These current
HTML observations establish adapter semantics; they do not qualify the changed
installed candidate or a structure-only JSON API. The existing JSON-with-document
path uses the same verified native markup.

The workspace now holds its merged post range outside serialized navigation
entries. Directional manual loading uses the existing client, prevents overlapping
history calls, and yields to deliberate work. Account changes clear the old range;
unrecognized/failed pages retain readable posts and require explicit Retry.
Native page controls stay available. A `.last` link supports Jump to latest;
absent qualified last-link metadata is not replaced with the largest visible page.

The first two fixture attempts failed before application mount because the authored
script response omitted UTF-8. The corrected genuine baseline
`2026-11-04T08-34-09.782Z` reaches the loaded middle page and fails on absent
Load earlier. Further preserved red runs demonstrate account leakage
(`08-38-47.503Z`), false end on an inconsistent pager (`08-39-58.651Z`), missing
recovery metadata validation (`08-40-58.325Z`), moving the reader after a delayed
load (`08-45-23.388Z`), and a stale target marker on an in-range permalink
(`08-47-37.595Z`). Every run is under `evidence/runs/2026-11-04T…` with separate
receipt/report/manifest and screenshots, geometry and requests.

The 181-case affected Edge run `2026-11-04T08-46-36.308Z` passed reader hierarchy,
navigation/real-302/recovery and reply/uncertainty regressions plus the first twelve
history cases. After the target-marker correction the thirteen history scenarios
passed in `2026-11-04T08-48-35.332Z`. The final candidate's clean packed-consumer
check passed in `consumer-2026-11-04T08-49-29.815Z`. Typecheck, lint and build passed
with Node 24.22.0/npm 11.21.1. Final required installed and BDFL results remain
pending; these results must not be described as complete ticket acceptance.

Replay with the pinned Node/npm toolchain, `npm run build`, then
`npm run test:e2e -- tests/e2e/thread-history.spec.ts` and `npm run test:consumer`.
The broader regression command adds `reader-hierarchy.spec.ts`, `navigation.spec.ts`
and `replies.spec.ts`. The candidate source is retained in
`evidence/runs/68-candidate/source.tar.gz`; receipt manifests pin test/build inputs.

## Actual trade-offs

1. Add optional native-provenance `Thread.history` at portable version 0.16.0,
   preserving legacy models and recovery records. This gives callers explicit
   boundaries without a required method or schema break; unfamiliar pagers retain
   manual returned page links and unknown boundaries until separately qualified.
2. Keep full mounted posts and transient loaded pages in a workspace-owned range,
   while leaving serialized entries at their original page. This preserves content
   and writing-recovery capacity; range restoration across other threads/reload
   remains the explicitly dependent #70 work rather than an implied durability promise.
3. Reuse the single shared client request sequence and fence stale completions,
   prioritizing deliberate preparation/navigation. An in-flight transport cannot
   be physically cancelled through the existing host contract, so another history
   request waits for it to settle; no independent account authority is introduced.
4. Preserve native returned page links and only expose latest navigation from the
   observed classed `.last` link. This avoids guessing from visible page numbers,
   at the cost of no new latest shortcut for pagers without that qualified target.
5. Keep the directional controls in a sticky, wrapping reader strip so an anchored
   reader can operate them without first jumping to a boundary. This uses vertical
   reading space; responsive drawer/composer integration remains in its owning slices.
6. Capture the current post and offset immediately before insertion and restore
   after Vue layout and pending media settle. User input stops media restoration,
   favoring the member's new scroll intent over keeping an obsolete anchor.
7. A qualified reverse-ordered native page is presented chronologically in the
   merged reading window, while retaining the returned page and filter URLs. This
   preserves the chronological history contract but differs from the native visual
   order; no floor/post-count inference is used.

The additional filter-redirect scenario initially reached only offline network refusal;
the corrected real local TLS redirect run passes in
`2026-11-04T08-53-03.909Z`, proving a differently filtered response is refused. Final `format:check` and ESLint pass; reporter and packed-consumer
manifests verify exact file coverage, byte sizes and SHA-256. The final userscript
SHA-256 is `b7be5e88b6c34b22c531c4863133656580b2bc67e8d45f5101b04c4fec3079db`;
portable ESM SHA-256 is
`d29586549dc612478a62e668700417c7b4efb9070739c10299e90d54272d2b1d`.

## Postimplementation BDFL findings and corrections

The advisor's two P2 findings were independently confirmed against the complete
client/workspace paths and reproduced before repair:

- An attachment offered only on an adjacent loaded page was looked up in the
  range's original page during the existing fresh-access check. The prior-account
  and fresh offered-link checks correctly refused it; the wrong page was supplied
  by the workspace. `IM68.earlier-attachment` and `IM68.later-attachment` both fail
  on the old candidate in `2026-11-04T09-17-10.825Z`. The range now retains the
  verified returned page for each displayed post and supplies it to the unchanged
  download operation. Both repaired tests save and compare actual browser-delivered
  file bytes. No attachment URL, purchase capability or account authority is inferred.
- Compact writing leaves reading and manual history visible, but the existing
  `writing.visible` early return disabled reader-anchor restoration. The new
  `IM68.compact-writing-anchor` fails by 1714.3125px in
  `2026-11-04T09-19-31.178Z`. Removing that broad guard restores the reader through
  the same path while retaining the same editor node and complete source.

All **116** affected history/download/writing-presentation cases pass on corrected
candidate `2026-11-04T09-21-10.094Z`, including source/visual undo/selection, browser
composition, uncertain transfer, stale account and actual saved-file checks.
Typecheck and build pass. The corrected userscript SHA-256 is
`6e8ca20faab78642f25da131e694acdc90a47b3062ced79ac7b2f392fe23cc04`.
The portable ESM stays byte-identical to the qualified `d2958654…` artifact, so the
existing packed-consumer result remains applicable. The earlier `b7be5e88…`
candidate and its observed installed results remain historical; corrected installed
and final advisor acceptance are still pending.

Additional distinct trade-off:

8. Retain a transient post-to-returned-page map for attachment revalidation rather
   than deriving pages from floor counts or following potentially remounting post
   permalinks. This adds one URL reference per loaded post while keeping download
   permissions, fresh tokens, identity checks and the portable client unchanged.

## Integration with the three-region shell

Before adapting the range to #65's independent reading ownership, the new
`IM68.board-browse-range` complete-app test failed at the first directory visit:
5 loaded posts collapsed to the original 3 (`2026-11-04T09-43-37.387Z`). The
range now retains the same active reading entry during board/directory browsing,
and reader-specific capture/restore retains its post and viewport offset even
while a different list owns ordinary navigation. Explicit thread reads and
refresh still replace the range; cross-thread range caches remain #70's scope.

The test now verifies directory and another board, prepend while browsing that
board, and browser Back/Forward with all 7 posts, the original nonzero post offset,
and exactly three thread reads (pages 2, 3, 1). An intermediate run
`2026-11-04T09-49-15.686Z` passed the original range assertion but exposed a
fixture locator mistake: `.board-card` is itself an anchor, not a parent of one.
The corrected region-scoped link locator passes in `2026-11-04T09-50-49.715Z`.
This harness correction is not counted as a second product failure.

All **195** affected history, three-region, navigation, download, reader and
writing-presentation Edge tests pass in `2026-11-04T09-51-31.918Z`. Typecheck,
build, lint, formatting and diff whitespace checks pass. Integrated userscript
SHA-256 is `6d51208b2f18486920491109777c4f1f132f983ed548211133a860127157e8dd`;
the portable ESM remains byte-identical to the qualified `d2958654…` artifact.
Installed integrated-candidate and final advisor acceptance remain pending.

Additional distinct trade-off:

9. Preserve the current reader anchor across navigation among lists sharing its
   reading entry, using internal reader-specific view methods. This prevents old
   per-entry numeric positions from moving a range expanded since that entry was
   saved, at the cost of two extra internal adapter methods. Recovery serialization
   remains unchanged, and this does not promise a per-list historical reader position.

## Installed integrated candidate and anchor diagnosis

The integration agent qualified the exact `6d51208b…` userscript through installed
Edge/Tampermonkey. The manager-returned source matched the local build after only
removing its Last modified suffix. The sealed package is retained in the integration
checkout at `evidence/runs/68-installed-integrated-2026-11-04`.

Native user input loaded earlier from 10 to 20 unique posts while retaining the
visible post offset within 0.15625px rounding, then later from 20 to 30 with exactly
70.0625px offset before, during and after the request at 1265×629. Compact writing
retained its exact unsent source. Board browsing and Back retained all 30 posts;
a fresh Back network ledger shows no GET. Back changed surrounding chrome height,
but preserved the post's absolute viewport top within 0.148px. Anchor assertions
use absolute viewport coordinates, not distance from a pane whose top can move.
Exact post `H68-post-A` selected its returned page 3 and native escape retained that
PID. Qualified Jump to latest followed the returned page 425 route and arrived at
actual post `H68-post-B`. No publication or send was performed.

Initial locator-click observations showed apparent 54px drift. A controlled probe
then measured 133px reader movement while the request was still pending, with
unchanged control geometry; native AX activation preserved the anchor during the
same phases. The original observations remain inconclusive for application anchor
restoration and are retained separately, not converted into a pass. No runtime
change was justified by this diagnosis.

`IM68.short-writing-anchor` adds bounded full-app validation at the original short
viewport, with 250ms external response delay and a one-second post-layout observation
interval. It passes on the unchanged candidate in `2026-11-04T10-08-45.648Z`.
This is explicitly green-only diagnostic coverage, not failure-first evidence of
a product repair. The broader 195-case run and packed-consumer qualification remain
applicable to unchanged runtime bytes. Chrome is deferred to final integration
under the owner's cadence; final advisor acceptance is still pending.

## Final acceptance

The integration agent confirmed final BDFL acceptance of `6d51208b…` after scoped
installed verification. All #68 acceptance criteria are verified under the owner's
Edge-only child-ticket cadence; Chrome remains the explicit final integration
obligation, not a passed child-ticket check. No additional distinct trade-off was
reported by the final advisor. The nine actual implementation trade-offs are
recorded above once each.

- [x] Current native adjacency, last-page/latest and exact-post evidence established.
- [x] Manual earlier/later plus actual page/post/latest targets work in the reader.
- [x] Account/thread/filter-bound transient range deduplicates stable IDs, retains
      complete content/actions and preserves the visible post/viewport offset.
- [x] Actual boundaries, unknown boundaries and failures remain distinct with
      deliberate Retry and retained loaded content.
- [x] One history request, shared request priority and stale-response fencing are
      verified; adjacent loading adds no browser-history entries.
- [x] Recovery remains bounded to original snapshots and writing acknowledgement
      is retained; public metadata is versioned 0.16.0 and packed-consumer verified.
- [x] Pinned design and inherited writing/account/source guarantees are retained.
- [x] Failure inventory and named full-app expectations precede feature repairs;
      replayable red/green evidence and the later green-only diagnostic are distinct.
- [x] Static/build checks, affected Edge E2Es, installed Edge and final BDFL pass;
      no live social, write, financial or release authority was added.
