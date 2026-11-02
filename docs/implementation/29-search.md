# Explicit search and passive return

## Failure-first plan

The accepted seam is the complete layout → workspace → public forum client → real browser host. Only external HTTP is substituted. No unit layer is introduced. Each authored scenario names its expected user-visible result and asserts the independent external request ledger. The standard reporter saves a receipt, report, scenario sources, image artifacts and file manifest.

Reachable failures to cover before the related code is written:

- Search overview or editing accidentally submits; current-form board/time/order choices, disabled options, multiple values or maxlength are lost; unknown controls are silently omitted; native script-only semantics are mistaken for supported inputs.
- Edited criteria overwrite effective results; a new search inherits an old page/search identity; repeated clicks cause duplicate searches; a fresh form changes account or allowed controls before submission.
- A returned result identity or pager is dropped/invented; malformed or partial rows become zero results; an empty body becomes zero results; external/foreign identity pagers are followed.
- HTML returned to a JSON preference causes a second effectful request; a missing JSON document or failed POST is retried; expiry, cost, throttle, login, permission, challenge, invalid and network outcomes collapse into empty results.
- Back/Forward/reload or a full-document exact-target remount reruns the search; selection/scroll/effective criteria are lost; current edits are overwritten by page navigation; a missing snapshot silently fetches a search; form tokens enter recovery or history.
- Changed identity or late responses replace current results; old account snapshots remain actionable; direct native search arrival conceals an initial request made before startup.

Named slices: `J3.search-overview`, `J3.search-submit`, `J3.search-pages-return`, `J3.search-outcomes`, `J3.search-expiry`, `J3.search-native-arrival`, `J11.search-session`, `J3.search-redirect`, `J3.search-missing-snapshot`.

## Boundaries and qualification

The current native advanced form is POST `search.php?mod=forum`. Current control semantics and returned result links control capability. A prepared form's tokens remain memory-only; recovery stores inert, token-free controls and criteria. The same navigation record/serialization owner holds search context. Exact final installed Edge then Chrome evidence, populated/explicit-zero semantics and complete passive-history observations are recorded in `29-installed-integrated/report.md`. The final source reviews accept the repaired candidate; installed BDFL reconciliation and root commit GO are recorded separately in `29-acceptance.md`.

## Actual trade-offs

- Reacquire the current form on explicit submission to validate account and current constraints without persisting tokens. This adds a safe form read to each deliberate search and can require the user to review changed restrictions before submitting again.
- Expose the ordinary controls present in the fetched native advanced form without running plugin scripts. Runtime-only plugin UI is unavailable in the workspace; users can continue through the native forum for those controls. Unknown active native controls or ambiguous form structure stop submission instead of silently changing its meaning.
- Freeze criteria inputs while a search is pending so the visible revision remains the one submitted. Users can navigate elsewhere immediately, but must wait for completion or leave the pending view before editing that submission's criteria.
- Direct native result/submission arrivals disclose that the initial request may have occurred before startup and do not fetch it again. Such an arrival cannot reconstruct its effective criteria; a new workspace search requires an explicit action.
- Bring newly returned search results into view automatically so a long advanced form does not conceal success. Editing controls remain above the results; passive restoration respects the saved position instead of scrolling back to the results heading.

- Recognize the observed native search HTML identity through a single direct-head literal bootstrap declaration. This supports the current header without a UID link while avoiding script execution; a future declaration using expressions, escapes or a different structure stays unknown until qualified.

## Implementation and verification

`forum-client/search.ts` interprets fetched markup inertly, validates the observed POST form and native successful controls, and classifies result/failure responses without a representation retry. Current numeric page-JSON UID and a real HTML header UID identify the same actor regardless of their display labels; contradictory identities block submission. A fresh form token is used once in memory. Returned pagination is tied to the same server search identity and expected actor.

The workspace retains editable, submitted and effective criteria independently. Search state shares the existing navigation record, and safe opaque history URLs never include search queries, tokens or effectful native endpoints. Nested thread/exact-target navigation obtains its adjacent overview from the existing origin chain, with cycle protection. Missing, invalidated or independent snapshots require deliberate recovery. Account changes discard old result contents; inert criteria remain available for review. Duplicate pending submission and late responses cannot replace subsequent navigation.

Named complete-app scenarios are in `tests/e2e/search.spec.ts`. The first complete baseline passed 94/94 at `2026-10-19T09-06-16.549Z`; visual inspection then found a below-fold fresh result and lost adjacent Search context after nested exact-post navigation. Both expectations failed at `2026-10-19T09-07-55.787Z` before correction, then passed at `2026-10-19T09-08-40.934Z`. Earlier bytes remain superseded evidence. Final run and installed evidence are recorded in `29-acceptance.md`.

## Completed-work review correction

The spec review and BDFL validation confirmed one P2 defect: fresh preparation could introduce a supported active control absent from the user's criteria, submit its new default, and omit it from the effective summary. The existing removed/invalid-control guard did not exclude that reverse change. `J3.search-new-control` failed against the frozen initial candidate at `2026-10-19T09-26-39.181Z` before the repair. Preparation now requires the active control-name set to match the reviewed criteria in both directions. A changed set retains input and stops before POST; refreshing exposes the new default, and the next deliberate search submits and displays it correctly. This applies the existing fresh-form/review trade-off and adds no new one.

The standards review also identified the public-contract version requirement. The search result/failure union is intentionally expanded, so the coordinated integrated artifact must version that contract and pass its external-consumer check. Ticket-local 0.2.0 candidates remain private, unaccepted intermediate artifacts; this document does not claim backward-compatible public delivery. The parent coordinated #29 to own the unreleased 0.3.0 metadata update; concurrent #19 will retain that same version during integration. Package/lock metadata, client constant, userscript/About labels, local library packaging and external-consumer expectation agree. No dependency version or publication changed.

## Installed identity correction

The first installed Edge search on the reviewed local candidate submitted once and returned an HTML result, but the workspace rejected it as an account change. The fresh form had a numeric JSON UID; the native result had no UID-bearing header link and exposed its stable identity only in the native head bootstrap. Fresh independent account observation confirmed no change, and no search retry occurred. This installed failure is preserved and is not counted as passing live search qualification.

Seven authored complete-app expectations failed at `2026-10-19T09-36-41.203Z` before correction. The reproduction uses a real POST → 302 → HTML result from a headerless JSON form. Search now interprets only one direct-head `var STYLEID ...` bootstrap made entirely of literal string assignments, with the observed field prefix, numeric UID and same-origin SITEURL. It never evaluates script code or reads identity from result-body script/text. Duplicate/malformed metadata or conflicts with header/JSON identity produce unknown identity; UID zero produces the guest/session outcome. Unknown result identity is now reported separately from a known different actor, retaining possible-effect disclosure. Ten focused identity/session cases passed at `2026-10-19T09-38-12.304Z`; replacement full baseline and installed requalification are recorded separately.

The BDFL delta accepted that identity correction and identified one remaining P3 status claim in returned pagination: unknown identity was still called an account change. `J11.search-page-unknown` failed at `2026-10-19T09-48-46.773Z` before correction. Pagination now distinguishes unknown from a known different actor; both cases pass at `2026-10-19T09-49-07.951Z`. The new case also verifies retained criteria, no accepted unknown-account rows, and no POST or page retry during reload. This truthful-status correction adds no trade-off.

## Final integrated development result

Integration with #18 appearance/navigation and canonical #28 accessible downloads retains one section/recovery owner and version 0.3.0. The final review found one adjacent-pager P2; failure-first return/changed-actor and nested actual-remount expectations preceded the workspace correction to use the existing Search origin and guarded returned-page operation. The generic read guard remains intact. Both final Spec and BDFL rechecks accept the repair without a new trade-off.

Candidate **764321 bytes / SHA-256 `097021995d5ba06a5ded15fac76859e9aba3c7da857079bc73f2be2e04e7b159`** passes **199/199** complete-application cases. Exact installed source checks, live author/title/explicit-zero outcomes, adjacent-reader pagination, real exact-target remounts and complete per-action passive ledgers are documented in the authored installed package. The public library is byte-identical to its expanded clean-consumer-qualified artifact. This is development qualification on the selected macOS/BETA profiles; stable/Windows/full-parent release qualification remains later.
