# Rate a post — #102

Preimplementation record, 2026-11-13. Base eed704d70dbf4e755c502d5148276805a07c2e71.

## Premises and plan

Use the existing forum-client/workspace/layout/host boundary and approved complete-app HTTP seam. Native observations establish rating availability only when the exact post has a native Rate control. Current Dart source independently identifies the four-column score form, bounded score fields, reason/notification and viewratings log. Verify current native form representation and independent log before settling parser details. Never accept absence of an error as confirmation.

Implement vertical E2E slices: (1) exact native availability, opening choices and cancellation from both menu entry points; (2) deliberate immutable submit with fresh actor/target/form/permission checks, duplicate prevention and independent log confirmation; (3) rejected/uncertain/stale variants and retained original action. Preserve writing and reader navigation. No live social writes are authorized. Root conducts installed Edge; Chrome deferred by owner to #112.

## Failure inventory and externally observable expectations (before feature code)

- Missing native control, guest, unsupported or incomplete form: Rate unavailable or explicit unavailable explanation; zero POST.
- Opening menu/form, editing choices, Cancel/Escape: zero POST; same reader/writing and restored focus.
- Malformed range/quota, unknown required field, ambiguous target/actor, cross-origin action, disabled controls: no guessed defaults or submission.
- Invalid/all-zero score or out-of-range/quota values: explanation and zero POST.
- Account change, target mismatch, changed choices/quota/notification semantics or permission loss during form refresh: exact submitted intent rejected before POST.
- Two rapid activations or delayed preparation/submit: at most one effectful request and no replacement by a late result.
- Successful submission: exact native payload once; only independent fresh log evidence for actor, exact score/reason and new record confirms success.
- Server rejection: display authoritative rejection, never success; no automatic retry.
- Lost response, missing/ambiguous readback, unfamiliar response: uncertain; no automatic retry or representation fallback POST, original intent stays visible.
- Close/reopen/navigation after unknown outcome: no replay, maintain unresolved restriction in current client lifetime; reload never auto-submits.
- Authored fake Rate links must not grant capability; duplicate/foreign source identity cannot select another post.

## Evidence

Each run uses built userscript, actual workspace/editor/storage/client; substitutes external HTTP only. Reporter retains request ledgers, screenshots, input/build/runtime hashes and failures under evidence/runs. Replay with pinned Node/npm, npm run build then npm run test:e2e -- tests/e2e/rating.spec.ts. Public contract changes require npm run test:consumer.

## Research correction retained

The initial root note inferred a full HTML rate form from a source string match.
A subsequent DOM-structure probe disproved that premise: base rate URL plus
`tsdmapp=json` returns an undefined-operation HTML page with no actual rateform.
The first synthetic full-HTML-form fixture therefore established only parser
behavior, not current native availability. Do not treat those green runs as live
qualification. The exact native popup route and actor-binding observations must
replace this premise before candidate freeze.

## Trade-off ledger

- Prefer JSON on read-only discovery, consume qualified native markup when returned, and never repeat a consequential POST for representation fallback. This retains the existing transport policy while requiring qualified HTML/XML parsing.
- Keep opaque form authority inside the client, expose serializable choices and exact target through the workspace, and version the two new client methods as 0.23.0. This preserves ownership at the cost of a coordinated portable interface update and consumer verification.
- Use source-bounded number inputs and an optional native-reason selector instead of reproducing the forum's scripted popup controls. This preserves values/ranges while making choosing a native suggestion a separate control.
- Confirm only a unique multiplicity-preserving before/after rating-log difference for the exact actor, scores and reason. The native log has minute timestamps and no stable attempt identifier; missing, paginated or ambiguous history remains uncertain instead of guessed success.
- Refuse unfamiliar forms/controls and changed permission, quota or choices. This favors truthful unavailability and fresh review over attempting unqualified variants.
- Keep rating approvals/results and duplicate guards in document memory; opening/reload never replays an action. This avoids introducing a new persistence schema while limiting unresolved-action memory to the current client lifetime. A user who reloads must independently inspect the forum before deliberately submitting again.
- Disable form edits and dismissal during an active submit, preserving the exact submitted revision and visible result at the cost of waiting for that request to settle.
- Installed read-only opening/cancellation and deterministic consequential HTTP cases have different evidence scopes. No live social action is manufactured; actual live rating success is not claimed. Chrome remains deferred by the owner's instruction to #112.

- Fresh target, form, baseline-log and actor reads add latency before submission
  to preserve authority and unambiguous confirmation.
- Invalid values are blocked in the presentation and independently refused by the
  client; a consumed preparation that fails a fresh server check requires reopening
  the form, adding an explicit step instead of silently rebinding the old choice.

- Larger accessible form controls may require vertical scrolling at narrow,
  enlarged sizes. Scoped minimum widths and scrolling preserve readable content
  and reachable actions without horizontal clipping.

## Implemented native contract and scope

The corrected read-only source observation qualifies the exact native popup
parameters (`infloat=yes`, `handlekey=rate`, `inajax=1`,
`ajaxtarget=fwin_content_rate`) with `tsdmapp=json`. Its schema-13 page envelope
supplies numeric UID and a nonempty formhash matching the actual `rateform` hidden
control. The popup document has no member header. The client validates envelope
identity, hidden target, exact action query and successful-control types; it never
executes returned script. Native text controls provide score range/quota, optional
reason suggestions and the default `on` notification value. Present empty callback
or return metadata is preserved; it is never fabricated as authority.

The corresponding JSON-preferring native `viewratings` request supplies a
schema-13 page envelope for populated records. The qualified
`thread_rate_log_nonexistence` handle response means no records in the native
recent-history window, not no lifetime ratings. Four-column records have a TD
header, separate score rows, source actor links, minute timestamps and reasons.
The client also consumes the observed XML representation on read-only log reads.
Missing, unfamiliar, paginated or mismatched evidence cannot confirm an action.

The native form's five hidden controls stay internal. Submit consumes one exact
preparation, clones its submitted values, rechecks account/target/form/permission,
reads the baseline, verifies the actor again, and sends exactly one native form
POST. A fresh log difference establishes confirmation; a qualified rejection is
reported separately. A lost or unconfirmed response stays uncertain and cannot be
reopened for another rating in the same client lifetime. No preparation, cancellation,
reload, representation fallback or result handling automatically sends a rating.

The dialog uses the existing portal/focus/appearance mechanisms and all three
interface languages. Forum-provided labels/reasons stay unchanged. Report remains
unavailable for #103; ordinary writing and reply actions retain their existing
ownership. No recovery schema, browser host API or ticket tracker was changed.

## Candidate and executable evidence

Final userscript SHA-256:
`489fd07b8e765b30c42a6a66715eaf3ee6d324a8dafb40ea7e1418e3208fb51a`
(2,279,248 bytes). Portable forum client: **0.23.0**. Pinned Node **24.22.0**,
npm **11.21.1**; lock hash remains
`ff92f13457df78791ff0d2cd9f931daf6c383124231a8d7ae594aa366a3430b5`.

- `2026-11-13T13-08-07.407Z`: **43/43 passed**, dedicated rating plus affected
  shared post-menu/reply-retarget regression cases. Includes pointer/keyboard,
  cancellation/focus, native choices, exact payload/count, duplicate activation,
  stale actor/target/form, refusal, lost response, missing/mismatched readback,
  source envelope/hash, malformed action/control, narrow presentation and Chinese
  appearance. Screenshots and synthetic HTTP request ledgers are retained.
- `consumer-2026-11-13T12-56-35.765Z`: clean external portable consumer passed.
  Every current portable artifact byte/hash was compared and remains identical
  after the final presentation-only guard change.
- Typecheck, lint and build passed on the same executable source.
- Earlier green results overlap these cases and are not additive. Preserve the
  failed runs: initial UTF-8 fixture error; feature-level menu and submit red;
  source TD-header discrepancy; stale-view/incorrect menu locator errors;
  missing keyboard focus restoration; reason/checkbox and structured native
  form/log red; localized-dialog red; contradictory action-query/control red.
  They remain failed and retain their actual candidate hashes and screenshots.
- The initial `902187…` candidate was installed by the coordinator before the
  last guard audit, then held without rating acceptance actions. It does not
  qualify the final candidate. No social action was created.

Replay:

```sh
export PATH=/private/tmp/tsdm-ui-95-toolchain/node_modules/.bin:$PATH
npm ci --cache /private/tmp/tsdm-ui-95-npm-cache
npm run build
npm run test:e2e -- tests/e2e/rating.spec.ts tests/e2e/post-actions.spec.ts
npm run test:consumer
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/2026-11-13T13-08-07.407Z
```

## Acceptance audit

- [x] Current native form/capability researched; unsupported accounts/posts/forms
      are honestly unavailable, with no reconstructed authority.
- [x] Both menu entries expose qualified choices, actor/target, daily allowance,
      native notice, optional reason and notification before deliberate submission;
      opening/cancellation has zero POST effects.
- [x] Fresh actor/target/permission/form checks, immutable submitted values and
      one-use/in-flight controls bind the exact action and prevent duplicate activation.
- [x] Confirmed, rejected and uncertain outcomes use distinct evidence; uncertain
      results never automatically retry.
- [x] Supported/unavailable/cancelled/stale/rejected/lost-response behavior runs
      through the complete application with exact target/payload/request assertions.
- [x] Supported submission executes the actual native action, not a demo stub.
      Live consequential validation has no authorized target and was not manufactured.
- [x] Failure inventory and vertical E2E red/green loops preceded feature changes;
      only external HTTP/browser-host boundaries were substituted, with no unit tests
      or internal mocks.
- [x] Final affected installed Edge acceptance passed on exact 489fd0 source,
      with native desktop/narrow entry, form editing, cancellation, Escape, focus,
      retained writing and zero consequential requests. Chrome remains explicitly
      deferred to #112.
- [x] Ownership/non-reply scope exclusions remain intact; public contract 0.23.0
      is packaged and passes the clean external consumer check.

### Notification default and interim evidence correction

The earlier interactive native popup had its notification property checked. A
later inert parse of both exact native JSON and XML source established no checked
attribute, `checked=false`, `defaultChecked=false`, and the default successful
checkbox value `on`. These are different observations; no causal explanation is
claimed. The application correctly honors the current unchecked source default.
Fixtures now exercise that current default, a checked-source variant, and explicit
opt-in with exact `sendreasonpm=on` payload. Cancelling never notifies.

The coordinator opened the real native-bound form on interim `7b21…`, then held
acceptance while the new invalid-value presentation guard was added. Historical
7b21 installed hash/readback observations and test receipts survive, but its
original built userscript was not separately archived before the next build; no
replayable-binary or final-acceptance claim is made for that interim candidate.
The interim c19a and final 489fd0 executables are copied into a separate immutable candidate folder.

The source supplies no stable rating-attempt ID, so confirmation establishes the
unique observed exact new rating rows, without claiming stronger server transaction
attribution than that evidence supports.

### Installed overflow and native Escape failures

The c19a installed run exposed two real failures that the earlier narrow synthetic
check missed: the outer dialog fit while its fieldset overflowed horizontally,
and the native body Escape veto prevented Reka's document-level dismissal.
The installed failed package is retained privately as
`tsdm-ui-102-installed-c19a`, with the exact immutable source and verified manifest.
It is not accepted or relabelled as passing.

Using the diagnosing-bugs loop, complete-app external-host fixtures reproduced
both failures at 390 × 844 and `--text-scale:1.25`, plus the observed native body
`onkeydown` veto. Run `2026-11-13T13-06-49.531Z` failed both. Ranked hypotheses
were fieldset minimum-content sizing, inherited control sizing, then dialog safe
width; measurements confirmed the first two while the outer bounds already fit.
The scoped fix removes the fieldset's intrinsic minimum, bounds controls, supplies
44px editable targets and keeps the checkbox 20px. On the corrected candidate,
clientWidth and scrollWidth both equal 358; controls fit at x48..342 within the
x16..374 dialog. A local composition-safe Escape handler runs before the native
veto, retaining focus restoration and refusing dismissal during active sending.
No global native handler is changed. Targeted red/green evidence is followed by
the final 43-case run, including composition-event safety. Genuine native IME
behavior remains an installed-host concern; synthetic composition events are not
claimed as operating-system IME proof.

## Final installed acceptance

The coordinator verified the exact manager-stored 489fd0 source before and after
qualification. The private `tsdm-ui-102-installed-489fd0` package retains the exact
script, authored observations/report and verified manifest. Desktop and narrow
right-click/keyboard entry opened the actual qualified native form. Invalid zero,
4 and 1.5 disabled Submit; valid 1 enabled it. Native reason/notification edits,
Cancel and genuine Escape preserved writing and restored the exact post-menu
trigger focus. No live rating was sent: desktop capture contained two forum GETs
and four image GETs; narrow capture contained two GETs, both with zero non-GETs.

At 390 × 844 and host text scale 1.25, inner and client width both measured 358px,
all controls fit x48..342, and scrolling reached 48.625px buttons at y747..795.
The separate c19a failed installed package remains failed. Label-selector and
hidden-unrelated-dialog/shadow-focus diagnostics are recorded rather than
misreported as product passes or failures. Only the coordinator's own writing
probe was cleared; original blank state, hidden writing, scale 1 and default
viewport were restored. Installed screenshots were visually inspected in CUA but
not saved in that package; saved repeatable screenshots and request evidence are
retained in the final 43-case complete-app run. No saved installed screenshot or
live successful-rating claim is made.

All #102 acceptance criteria are verified at the owner's current scope. Chrome
remains deferred to #112, and the inherited #101 reader-anchor baseline gap remains
assigned to #105/#112. No parent specification completion, release, push or tracker
mutation is part of this commit.
