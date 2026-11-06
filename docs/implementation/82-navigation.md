# Stable header and browse-first navigation — #82

The canonical requirements remain [ticket #82](https://github.com/Benson-mk/tsdm-ui/issues/82) and [spec #81](https://github.com/Benson-mk/tsdm-ui/issues/81). This record describes the implemented slice and how to replay its application evidence. Affected installed Edge acceptance and the required advisor validation are complete for this slice; Chrome remains deferred to #93.

## Implementation

A shared SVG vocabulary replaces navigation/header text symbols. The supplied mark retains every path/polygon and its four existing theme roles. Boards, Threads and native continuation share one header group. Narrow controls keep names, tooltips and 44px targets.

Before a reader is selected, the directory/list fills available browsing space. Below 768px, Threads switches that same mounted results pane and the retained reader/writer. Boards retains the existing progressive modal, dismissal, composition and focus behavior. Existing navigation, recovery, writing and forum-client owners are unchanged. There was no redundant navigation Return to reading or Back to boards in production to remove: the existing writer's Return to reading is a meaningful minimize action and is preserved for #87.

The narrow transition captures the visible reader anchor before hiding it and retains list scroll independently. Native div/text-only post bodies use the same layout anchor owner through a visible post-body fallback when paragraph/preformatted anchors are absent. Accepted navigation keys/results reveal cached readers even when the reading object is reused; a pending writing guard cannot trigger this transition. Existing writing status, preparation failures and Resume stay reachable in a bounded footer when their conversation region is hidden; they remain in the conversation otherwise. This preserves one status surface and one editor, including new writing started without a selected reader.

## Failure-first checks and replay

Failure analysis preceded feature code and is retained with the session working notes. The new complete-application cases exercise built userscript bytes with only external HTTP replaced:

- `UI82.header`: SVG actions/brand, named 44px controls, one-row geometry at 320/375/504/589/714/717/734/767/768/779/959/960px with 150% text, keyboard focus/activation, and real native escape navigation.
- `UI82.browse-first`: fresh directory/filter and board browsing, 767/768/959/960 transitions, retained list scroll/selection and reader identity/offset, cross-board return, and no extra requests for pane toggles.
- `UI82.same-retained-thread` and `UI82.same-current-thread`: both cross-board return and already-current cached row activation reveal the retained reader without new requests or text-line drift.
- `UI82.native-body-anchor`: native-shaped div/text bodies retain the actual visible DOM Range line across other-board browsing, with scroll-clamp preconditions checked.
- `UI82.fresh-writing`: a new writer before reader selection, browse/return without remounting, minimize, visible Resume and exact source retention.
- Existing progressive drawer, responsive navigation, three-region and real redirect-guard journeys cover three languages, four themes, 70–150% text, touch dismissal, composition, history/reload, retained selection/undo, and guard-before-request behavior. Superseded Threads-modal and blank-directory-collapse assertions now describe the approved primary browsing surface.

Use the pinned Node 24.22.0 / npm 11.21.1 toolchain, then:

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test:e2e -- tests/e2e/refined-navigation.spec.ts tests/e2e/progressive-drawers.spec.ts tests/e2e/responsive-navigation.spec.ts tests/e2e/drawer-redirect-guard.spec.ts tests/e2e/three-region.spec.ts
```

The existing reporter retains a report, receipt, source/build identities, file manifest, fixture snapshots and screenshot/geometry/request attachments beneath `evidence/runs/`. Earlier failing runs remain separate. Synthetic native navigation proves the escape route and exclusion behavior, not installed manager semantics. No portable contract changed, so no external-consumer rerun is required for this slice.

## Distinct implementation trade-offs

The accepted design and cadence trade-offs remain in #81 and `81-ticket-plan.md`; these are the additional choices made during this slice:

1. The narrow wordmark uses a fixed 20px size so branding cannot crowd out five 44px header actions. Its lettering therefore does not grow with the workspace Text size setting at narrow widths; content and action accessible names retain their normal behavior.
2. Settings and About use named icon actions at desktop widths too, keeping the whole header within 960px at 150% English text. Their visible labels are temporarily less discoverable before #83 moves these controls into the navigation footer/Settings.
3. A separate transient pre-hide reader anchor protects its position while the navigation owner changes to a different result list. This adds a small layout-owned DOM-reference snapshot, cleared on return, without changing recovery persistence or the forum-client interface. For native div/text-only source, the fallback retains the visible post-body block through the same owner rather than adding per-character persistent positions; independent Range observations verify its visible line in the affected browsing flow.
4. When browsing hides the conversation, its existing writing status moves to a bounded footer so preparation errors, retained warnings and Resume remain reachable. This reserves some browsing height and adds one conditional presentation target while preserving the same status/editor owners; #87 owns the later writing presentation refinement.

Local iterations reused the checkout's installed locked dependencies through a worktree symlink; this is development verification rather than a clean dependency-install qualification. Final run receipts identify actual tooling and source bytes. No live social write, release publication or Chrome pass is implied.

## Final acceptance and evidence — 2026-11-07

The final userscript SHA-256 is `ca4e4617905200e16588b1f0315411c3a8d356e5676b599aa97ea83176eec466`. The complete Tampermonkey source readback matches that candidate. Installed verification used Microsoft Edge 156.0.4314.58 and Tampermonkey BETA 5.6.6242, under the owner's explicit beta/stable equivalence instruction. Exactly one enabled copy was qualified.

| Ticket criterion                                                                    | Verified evidence                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessible SVG actions and supplied brand                                           | `UI82.header`, exact source geometry/fill comparison and installed visual inspection.                                                                                                                                                                         |
| Reachable one-row header, 44px targets, focus and native continuation               | `UI82.header`; installed header geometry, keyboard, browser zoom and native-return checks.                                                                                                                                                                    |
| Useful fresh browsing and narrow retained-reader toggling                           | `UI82.browse-first`, `UI82.directory-retained`, both cached same-row cases, and corrected installed same-row observations.                                                                                                                                    |
| Preserved list/filter/selection, drawer focus and writing guards                    | Progressive drawer/editor-continuity, responsive-navigation and five redirect-guard cases; no redundant navigation buttons shipped.                                                                                                                           |
| Width boundaries, CJK/Latin labels, enlarged text, no overflow and reading position | Header/responsive/three-region matrices and installed checks; `UI82.native-body-anchor` plus corrected installed DOM Range observations.                                                                                                                      |
| Existing architecture, recovery/source fidelity and immutable operation boundaries  | No client/API/storage changes; history/reload, source/target retention and guarded authoring regression cases passed.                                                                                                                                         |
| Failure-first complete-application expectations and repeatable artifacts            | Preserved red runs, final 34-case report/receipt, source identities, request/geometry/screenshots and verified manifest. No unit tests added.                                                                                                                 |
| Static/build checks, installed Edge and final advisor                               | Pinned-tooling build/typecheck/lint/format and Git whitespace checks passed; installed source identity verified; final gpt-6.1-sol/xhigh advisor using validate-gpt-code-review accepted all eight criteria with no concrete blocker or additional trade-off. |

The final application run is `evidence/runs/2026-11-06T19-56-19.388Z`: **34/34 passed**, with its 161-file manifest verified. Its bounded command additionally includes `tests/e2e/writing-presentation.spec.ts` and selects `UI82|IM66|UX53|IM65|UX57.retained-warning|IM72.contextual-chrome`. Failure-first reproductions of the installed findings remain at `2026-11-06T19-52-21.103Z` and `2026-11-06T19-53-42.916Z`; earlier failed and intermediate runs retain their own candidate identities.

Installed artifacts are retained in the integration checkout under `evidence/runs/82-installed-edge-corrected-2026-11-07`, with an eight-file verified manifest. Both retained and already-current thread-row activation now reveal the reader. The settled native-body probe retains all six measured text lines exactly; the first complete line stays at y478.0546875 while scroll changes 844 → 796 to compensate for the 48px toolbar contraction. The package deliberately keeps its earlier pre-wheel-settle captures as inconclusive, not passed observations.

Unchanged header, keyboard, enlarged-text, full-browser-zoom and native-return recovery checks remain scoped to the earlier `4eb40a9` candidate in `evidence/runs/82-installed-edge-2026-11-07`; they were not relabelled as new observations. The corrected candidate reran the affected installed paths and complete bounded application suite. The final advisor accepted this evidence accounting. Chrome remains an explicit obligation of #93, and no release or live social write is claimed. This final documentation-only acceptance record does not change the qualified userscript bytes.
