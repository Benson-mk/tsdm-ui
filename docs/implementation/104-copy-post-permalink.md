# #104 — Copy exact post permalinks with truthful feedback

## Before implementation: premises, failures and observable expectations

The parent's observed native link is `redirect&goto=findpost&ptid=1269763&pid=78256669&fromuid=2174757`. Post-number hrefs can be absent, malformed or thread-only. The forum client already qualifies same-origin thread response identity and unique numeric post wrappers. Derive the supported findpost route from those qualified identities, ignoring untrusted hrefs. Existing Post.url shape stays unchanged; advance the library patch version and run consumer compatibility.

Approved seam: built userscript with real workspace/editor/storage/forum client; only HTTP responses and browser Clipboard API boundary substitutions. No unit tests or internal mocks. Parent alone controls installed Edge and preserves user clipboard. Chrome is expressly deferred to #112, not passed.

Failure inventory / complete-app expectations, before feature code:

- Missing, thread-only, malformed, foreign, mismatched and referral-bearing links resolve from qualified thread/post identities for opening/later posts; no referral/filter/page/order baggage.
- Ambiguous post identity remains refused by the reader with no copy affordance.
- Held clipboard completion shows pending, never premature success. Duplicate activation does not compete. Completed copy announces success without moving focus or navigating.
- Refused/missing Clipboard API explains failure and exposes exact selectable URL. Dismissal restores invoking focus. Fallback fits narrow enlarged-text viewport; touch control at least 44px.
- Copy preserves ordinary reply text/destination with no forum mutations. Unmount during a pending write must not show stale feedback on another post.
- Opening copied first/later URLs through real HTTP redirects mounts exact target posts. Retain request ledgers, screenshots, failures and candidate hashes.

## Trade-offs

1. Normalize Post.url to the observed findpost route using qualified thread/post identities. Native page/order/filter/referral baggage is discarded and opening adds server redirect resolution, in exchange for exact targeting despite absent/misleading links.
2. Browser Clipboard API plus selectable dialog requires manual copy on permission failure while preserving truthful completion and avoiding legacy clipboard mechanisms with different guarantees.

3. Previously recovered thread-only/mismatched Post.url values require an explicit thread refresh before copying. This avoids changing stored recovery schemas or silently treating historical unqualified links as exact current permalinks. Exact same-origin legacy findpost URLs with matching thread/post IDs and only known referral metadata are normalized without refresh.
4. Success feedback stays beside the invoking post for four seconds and never receives focus or pointer events; manual fallback is an explicitly dismissible dialog to provide predictable selection and focus return.

5. The post-number control uses native button semantics for the requested copy action, so it no longer supplies a link context menu. The copied exact URL can be opened separately; native continuation remains available.

6. Browser clipboard writes already in progress cannot be cancelled by navigation. The control suppresses late success/failure UI after unmount; the browser may still finish the requested copy.

## Verification and replay

Candidate SHA-256 `71ddf22f2c7d7c0747ac55737b3a90131270979d400ee63145107a78c1905d68`, 2,309,151 bytes, frozen outside `dist` as `104-candidate-71ddf22f2c7d/tsdm-ui.user.js` in the coordinator's evidence directory. Its base is `d1e184752b09ec1534a103e54b2079593b9fc7ea`; portable library is `0.24.1`. No public type, required method or recovery schema changes.

- Final 14 complete-app cases pass: `evidence/runs/2026-11-13T13-49-56.761Z`. This includes exact first/later URLs, held write completion/duplicate suppression, keyboard focus/writing preservation, refusal/absence, malformed/missing/mismatched/foreign links, duplicate post refusal, real HTTP redirect destinations, 390px/125% touch fallback, actual prior-app recovery (both unqualified and exact referral-bearing URLs), and late success/refusal after navigating away.
- Earlier combined regression passes 52 cases (post actions, page picker and the then-current permalink suite): `evidence/runs/2026-11-13T13-46-07.595Z`. Later changes only qualify exact legacy links and enlarge the post fallback input; final slice reruns cover both.
- Final clean external consumer passes: `evidence/runs/consumer-2026-11-13T13-50-22.900Z`. Typecheck, lint, format check and `git diff --check` pass.
- Final synthetic receipt contains per-case screenshot, request and Clipboard API-boundary JSON evidence. Real redirect cases additionally retain the copied bytes, actual server reads/redirects and focused target screenshot. Narrow fallback screenshot was visually inspected.

Use pinned Node24.22.0/npm11.21.1 by prepending `/private/tmp/tsdm-ui-95-toolchain/node_modules/.bin` to PATH. Run `npm run build`, then `UX104_BASELINE=/path/to/retained-103.user.js npm run test:e2e -- tests/e2e/post-permalink.spec.ts`. The baseline is the actual #103 built userscript, SHA-256 `26a65742ad53485c9fea47f0729cf8e590d8ebabcd5b2c690903468dee1b0ceb`, 2,302,936 bytes, retained as `104-baseline.user.js` alongside the frozen candidate. Without this explicit baseline, the two replacement cases are skipped, never passed. `npm run test:consumer` verifies the portable package; its receipt also provides clean replay instructions. No test uses the user's live clipboard or forum account.

## Preserved failures and limits

All intermediate runs remain separate:

- `13-40-15.585Z`: incorrect fixture charset prevented application startup; corrected HTTP encoding.
- `13-40-51.449Z` and `13-41-49.903Z`: incomplete synthetic reply form lacked required provenance/options; corrected external fixture before feature code.
- `13-42-51.463Z`: feature red, copy control absent; `13-43-31.578Z` passes the first vertical slice.
- `13-44-00.521Z`: feature red, refused clipboard has no fallback; `13-44-35.073Z` passes success/refusal/absence.
- `13-45-16.104Z`: test incorrectly expected native address-bar URLs after the application installs opaque workspace history URLs. Assertions now compare unchanged opaque URL for copying, actual HTTP final response for redirects and targeted/focused post UI. No product correction was needed.
- `13-47-27.597Z`: fallback input measured 21px, despite the copy/Close buttons satisfying 44px. Scoped input size correction passes final touch E2E.
- `13-48-39.524Z`: exact legacy native findpost+fromuid URL unnecessarily required refresh. Client-owned strict matching/normalization now allows it without any fetch.

All abbreviated timestamps above are under `evidence/runs/2026-11-13T<timestamp>`. Early request/clipboard attachments used a MIME label the reporter did not retain; those runs still retain outcomes/screenshots. The final 14-case run uses the supported JSON MIME and retains both ledgers. Historical failures are not relabelled.

## Installed Edge acceptance

The coordinator accepted exact candidate `71ddf22f` in the verified private package `tsdm-ui-104-installed-71dd`. Manager source matched the full frozen hash before final acceptance; the final MCP readback matched again.

Actual #103 recovery retained an exact native findpost URL carrying `fromuid`; activating it copied the exact referral-free URL without a refresh. Real Edge Clipboard API readback verified the exact text, native Tab/Return activation, focus and post-local completion feedback. Opening copied destinations verified actual native redirects and focused targets for restored post 78256669 (floor 2 in the unfiltered thread), true opening post 78255379 and later post 78256675.

At 390px with text scale 1.25, the copy control measured 44px, application client/scroll width 390/390 and article 358/358; feedback fitted. An installed-script test substituted a rejecting **browser-host Clipboard API boundary**, not a real operating-system permission refusal. It produced the truthful selectable fallback: exact 85 characters fully selected, input 44px, Close 48.625px, dialog client/scroll 358/358. Native Escape restored exact shadow focus. The coordinator removed the own Clipboard API override and restored the native API afterwards. Genuine operating-system refusal remains unobserved; the installed error path and synthetic refusal/absence cases are verified without claiming that OS observation.

Copy captures contained zero forum requests (desktop additionally loaded one image GET); narrow/refusal captures contained zero requests, all untruncated. The coordinator's own writing probe survived and only that probe was then cleared. Original clipboard content was empty (zero items); `write([])` was rejected, so `writeText("")` restored empty textual content. Exact original clipboard format/item representation is not claimed. The temporary destination tab was closed and viewport/text scale restored. No live forum mutation occurred.

## Acceptance criteria at the owner's current scope

- [x] Exact post identity uses qualified source/routing data; referral information is removed without losing the destination.
- [x] Success follows completed clipboard write; refused/unavailable access explains the failure and exposes a selectable exact URL.
- [x] Keyboard/touch control has a clear name, predictable focus and non-obstructive success feedback.
- [x] Missing/malformed links, first/later posts, clipboard outcomes and resulting destinations pass complete-app verification.
- [x] Affected installed Edge clipboard/navigation/focus behavior passes; Chrome is expressly deferred to #112 by the owner and is not claimed passed.
- [x] Failure inventory and E2E expectations preceded feature code; only complete-app external HTTP/browser-host substitutions were used, with no internal mocks or unit tests.
- [x] Relevant E2Es, current-scope installed checks, exact-source identities, replay artifacts and failures are retained with limits above.
- [x] Forum-client/layout/workspace/host ownership and non-reply exclusions remain intact; portable patch 0.24.1 passes the clean consumer check with no public shape or recovery schema change.

Every #104 acceptance criterion is verified at the owner's current scope. Chrome remains deferred to #112; no Chrome qualification, release or whole-parent completion is claimed.
