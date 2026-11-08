# Confirmed page picker — #86

Canonical scope: [ticket #86](https://github.com/Benson-mk/tsdm-ui/issues/86), parent #81 decision 10. Base `6d7603f`; Edge during delivery, Chrome deferred to #93. No acceptance is claimed until installed verification and designated advisor validation finish.

## Research and failure inventory

The agreed seam is the complete emitted application in Edge, replacing only external HTTP. Existing forum-client pagination supplies returned links; optional native `Thread.history` qualifies adjacency/order/boundaries. Workspace history owns the transient loaded range, per-post source URLs, request fencing and restored reading positions. Layout owns actual visible-post geometry. The Page dialog belongs to the existing ThreadTools presentation boundary. The current public pagination contract does not expose a total or an arbitrary-page jump capability; current native source evidence is required before adding either.

Reachable failures, to be exercised through named browser expectations before feature code:

- `UI86.confirm`: typing or dragging navigates early; slider and number field disagree; Cancel/Escape/outside dismissal changes the reader; Go repeats a request or loses full source target context.
- `UI86.bounds`: absent or unqualified total is presented as a last page; largest visible numeric link is mistaken for a total; unsupported/invalid input fabricates a URL; unrelated or post-authored controls authorize page navigation.
- `UI86.position`: Page reflects the entry page rather than the first visible loaded post; variable heights or overlapping stable IDs mislabel the page; terminal indication appears at an intermediate boundary or is false in reverse order.
- `UI86.continuity`: confirmed jumps race delayed adjacent loads, reverse/filter changes or account transitions; stale completion replaces selected context, repeats/reorders posts, or erases editor content/selection.
- `UI86.retry`: removing routine pagination removes retry, unknown-boundary explanation or exact-post access; failure strands the reader.
- `UI86.native`: native keyboard dismissal/focus return fails in ShadowRoot, short viewport clips Go/Cancel, canonical copy/reopen loses the visible page/order/filter context.

Implementation proceeds in vertical failure-first slices using the existing test reporter. No unit or component seam is added. Earlier #85 title, character-anchor and guarded-writing guarantees must survive.

## Implemented behavior and native qualification

Parent research is sealed in the integration checkout at `evidence/runs/86-native-pagination-research/` (`first`, `middle`, `last`, `reverse`, `filter`, report and manifest). Thread1265238 supplied an actual `custompage` input outside a form with `if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=1265238&extra=page%3D1&ordertype=2&page='+this.value;; doane(event);}`. The sibling total has matching title/text `共 7 页` and `/ 7 页`; duplicate top/bottom controls agree. Native input3 and7 reached those pages with correct adjacency; reverse preserves `ordertype=1`, author context preserves `authorid=2042122` with total2. A7-page source has no `.last`, so the largest returned link cannot establish a total.

The portable client now returns optional serializable `Thread.pageJump = {url,total}` only for that narrow inert handler shape, matching same-origin thread/order/author context, current page/input and explicit agreeing totals. It never executes returned JavaScript. Missing/unknown/conflicting controls and controls inside authored posts do not grant the capability. Version0.21.0 is additive and has no required host/client methods; old recovered models lack the optional field and remain readable. Recovery validates new metadata rather than trusting a stored foreign or incompatible target. Native `ordertype=2` is qualified as ascending in the existing history parser.

ThreadTools holds only pending selection. A range input and exact number entry synchronize, while Go alone navigates through the existing guarded workspace action. Exact returned URLs win over the qualified native template, retaining complete source context. Unknown totals are labelled explicitly; only offered targets are confirmable. Cancel, Escape and deliberate outside dismissal leave reading alone and restore trigger focus. Browser-native input controls have44px targets and stacked labels; Go is visually distinct, and the existing bounded dialog remains keyboard reachable at390×480 and1280×400.

Layout reads the first actually visible post, including a visible tail above a retained anchor, then asks the existing history source map for its page URL. It does not infer pages from post counts or heights. Tracking runs once per animation frame after actual scroll/content/restoration/viewport updates, and hidden readers retain their last source position. Canonical copying uses that visible source page and retains supported order/author context. Terminal requires both the existing proven later boundary and the actual reader content endpoint, including reverse contexts. A reserved small feedback line prevents terminal/copy status from changing heading height.

Routine footer pagination and persistent manual range buttons are removed. Actual source links, manual Load earlier/later and Jump to latest remain in Page → Supported navigation. Loading status, failed-boundary Retry and truthful end/unknown explanations remain in the reading surface. Existing history owns stable IDs, bounded requests, source maps, stale completion fencing, exact-post navigation, restoration and writing continuity. Fresh successful refreshes adopt newly qualified bounds, update growing totals or withdraw an unqualified capability; they preserve the old range and fail closed if a shrinking total no longer contains its entry page.

## Verification and assertion migration

The emitted userscript is exercised in Microsoft Edge with only external HTTP substituted. Cases retain request ledgers, screenshots and actual post/heading geometry; real clipboard permissions permit independent copy readback and canonical reopen. Source fixtures have variable post heights, explicit adjacency and native-qualified totals, including single-page and unlisted exact-page cases. Negative profiles cover handler, thread, filter, order, origin, totals, current-page, duplicate-control and authored-content mismatches. Recovered new metadata survives passive reload without an HTTP request; malformed metadata is visibly refused.

Existing journeys reach moved controls through actual Page/Supported navigation clicks. Delayed manual and automatic history cases now confirm their explicit target with the real number input and Go. Their request/identity/account/source/anchor assertions remain. The retained-editor case also verifies unchanged mounted source and backward selection after Go. Earlier footer assertions now verify absence from the reader while preserving exact source links in details. Explicit Back/Forward expects the restored visible page3 rather than the entry page2, retaining the same original post-coordinate assertion. A real dialog is dismissed before clicking the underlying refresh toggle or measuring reading content. No hidden/offscreen control dispatch was introduced.

Initial position probes wrongly assumed the old entry page always remained first visible after prepend. The saved geometry showed a preceding page's tail legitimately visible above the restored anchor; the probe now compares the trigger against actual clipped post geometry. Another probe issued its second scroll before title/restoration frames settled, so the application correctly suppressed it as restoration; it now waits for the compact heading and two rendering frames before issuing a distinct scroll. These assertion corrections do not relax page provenance, request counts or anchor tolerances.

A real terminal-status defect was found by established refresh cases: the inherited empty copy-status CSS collapsed the line, so entering/leaving the terminal position changed heading height by2.796875px and disrupted follow geometry. Named `UI86.terminal-geometry` reproduced it before the line-reservation repair. A separate installed observation exposed stale unknown bounds after Refresh, and the short-view screenshot exposed16px browser-default range targets. `UI86.refresh-bounds` and control geometry expectations failed before those repairs. Failed receipts remain unchanged.

## Distinct actual trade-offs

1. A narrow qualified native profile and optional public metadata preserve portable parsing and source fidelity, but arbitrary jumps remain unavailable on unknown layouts or legacy snapshots until a qualifying fresh read. This requires an additive0.21.0 consumer qualification; no handler is executed or total guessed.
2. Explicit Go and the Supported navigation disclosure reduce routine reader controls and accidental jumps, at the cost of an extra step for distant or deliberate manual range navigation. Failure/retry and boundary information remain directly visible.
3. The visible-page indicator reuses per-post source provenance and actual geometry rather than maintaining another pagination model. It scans the loaded DOM once per scheduled frame, trading work proportional to retained posts for correct varied-height, overlapping-source and restored-range behavior; it adds no timer or unbounded synthetic stream.
4. The terminal/copy feedback row reserves a small amount of header height even when empty. This keeps reader/follow geometry stable as status changes, at the cost of that vertical space in short views.
5. Native range/number inputs retain browser keyboard/accessibility behavior and avoid custom drag state. Their internal appearance varies by browser; explicit labels,44px boxes and bounded dialog scrolling supply consistent interaction space.
6. Fresh refresh bounds replace old capability only after the existing account/thread/filter/order gates. An unqualified or incompatible new source withdraws arbitrary jumping rather than retaining stale reachability; exact returned links and loaded reading remain usable.

## Evidence receipts (current scopes)

- `2026-11-06T23-16-40.982Z`: initial confirmation red; `23-18-23.966Z`: first confirmation green.
- `2026-11-06T23-19-43.854Z`: native-bound red before metadata; `23-22-00.753Z`:12 parser/confirmation cases pass.
- `2026-11-06T23-22-58.985Z`: recovery metadata red; `23-24-51.405Z`: recovery green.
- `2026-11-06T23-25-34.540Z`: position/manual-navigation red before implementation.
- `2026-11-06T23-31-03.511Z`:18 feature cases pass; `23-32-51.094Z`:88/91 broad affected cases pass, three obsolete footer/entry-page assertions preserved as failures.
- `2026-11-06T23-34-30.990Z`:23/23 confirmation, position, source, actual-Go stale navigation and corrected Back/Forward/provenance cases on2c488c.
- `2026-11-06T23-35-36.030Z`:29/35 refresh cases pass; five real terminal geometry failures and one dialog migration failure remain recorded.
- `2026-11-06T23-37-04.392Z`: named terminal geometry red; `23-37-39.800Z`:19/19 affected terminal/follow/refresh cases pass after repair.
- `2026-11-06T23-38-34.868Z`:22/22 feature/context/reopen and editor-selection cases on e06ff4.
- `2026-11-06T23-40-22.748Z`: undersized control and stale-refresh capability red; `23-41-22.930Z`:both repairs pass,21/22 total; the remaining probe's distinct-scroll timing is documented above.
- `consumer-2026-11-06T23-33-19.276Z`: clean external consumer0.21.0 passes with emitted public artifacts and independent type/runtime/transport checks. Subsequent edits are application presentation/history only, with unchanged portable source/package bytes.

## Final candidate qualification

Frozen application SHA-256: `08d027cab7d4db941b4b8355ad566e8cf267116a3bbec707404bd2ad4a515318`, at `evidence/runs/candidates/<sha>/`. Exact manifest covers user/meta files and `source.json`; full application/test source identity is also retained in each receipt.

- `2026-11-06T23-42-09.789Z`:147/148 affected Page, thread tools, automatic/manual history, reader, reading memory and non-clock refresh cases pass on final aa631. The remaining old UI85 Page probe omitted the new disclosure click; its exact URL/context assertions were retained and migrated.
- `2026-11-06T23-44-19.184Z`:the migrated UI85 Page case passes on unchanged aa631. Together these receipts verify148 distinct application scenarios on aa631, including all22 UI86 cases and the immutable source-review journey.
- `2026-11-06T23-46-37.788Z`:58/58 final08d027 picker, refresh/follow, source-capability and retained-editor selection cases pass. The only production change after aa631 omits an unavailable refreshed optional property instead of assigning `undefined`, satisfying exact optional-property typing without broadening the public contract. No unrelated paths changed;148 distinct scenarios remain verified across these explicitly scoped receipts.
- Final typecheck, lint, build and format checks pass. Exact artifact manifests verified538 files in the broad receipt,60 in the Page replay,10 in the consumer receipt and3 in the final frozen candidate. Source/test/fixture snapshots and request/state/geometry/screenshots remain replayable.
- The two unchanged refresh real-clock policy/cooldown scenarios retain their existing #85 evidence (`2026-11-06T22-30-40.691Z`), with no claim that they were rerun on aa631. Current-candidate cases verify affected refresh geometry, boundaries, source-capability updates, failures and cached cooldown. This follows the parent-approved cadence and avoids repeating six minutes solely to unify receipts.
- The final390×480 picker screenshot was visually inspected after correcting input sizing; labels and fields now form separate rows with full-width44px controls, bounded scrolling and reachable Go/Cancel.

Installed preliminary native scope is preserved separately by the parent in `evidence/runs/86-installed-initial-2026-11-07`:2c488 proves legacy unknown-total fallback, native source Go3/total7, slider/number synchronization, cancellation and native Escape/focus. `evidence/runs/86-installed-e06-2026-11-07` proves exact native last-page IDs, terminal only at the real endpoint without heading-height movement, unique continuous page6→7 IDs and visible-page tracking, canonical ordertype2 Copy/reopen, and restored clipboard. These preliminary scopes do not certify final08d027 refresh/style changes. Final08d027 installed exact-source readback and requalification pass in the sealed8-file `evidence/runs/86-installed-edge-2026-11-07` package: the original #85 unknown-total snapshot receives fresh7-page capability after More → Refresh; range and number fields are44px and synchronize to7, while Cancel keepsPage1 and returns focus. The original writer remains retained. `evidence/runs/86-installed-aa631-2026-11-07` independently covers375×420 Go/Cancel containment, native Escape/outside/focus, reverse7 and author-filter2 bounds and canonical copies; e06 retains terminal/continuous/copy-reopen scope. Each candidate's report remains separate. Native checks made no social write, restored the clipboard and returned the viewport to1119×629. Final designated gpt-6.1-sol/xhigh advisor acceptance passes all nine criteria with no blockers or additional distinct trade-offs. Its independent26/26 exact final-candidate replay is `evidence/runs/2026-11-06T23-54-56.826Z`, with a verified136-file manifest. The advisor also verified consumer/current artifact identities and accepted the existing candidate scopes. Its confirmed root README version mismatch was corrected to0.21.0 with a concise optional-capability note; the historical0.20.0 paragraph remains, and executable/source behavior did not change. Chrome remains explicitly deferred to #93; no installed or advisor pass is inferred from authored HTTP fixtures.

## Acceptance

- [x] Confirmed synchronized slider/exact entry and cancellation.
- [x] Truthful actual-source bounds, targets and limitations; exact-post access.
- [x] First-visible-post page and truthful terminal indication; routine pager removal.
- [x] Existing continuous range, identities, anchors and source order preserved.
- [x] Stale work, reverse/filter changes and editor continuity guarded.
- [x] Required cases and repeatable artifacts.
- [x] Parent production guarantees and scope.
- [x] Failure-first full-application expectations, no after-code unit tests.
- [x] Static/build, affected installed Edge, consumer0.21.0 and final designated advisor; Chrome explicitly deferred to #93.
