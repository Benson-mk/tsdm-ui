# Report a post through a qualified forum action — #103

## Before implementation

Base 8710356 (#102), live issue/native contract pointers in the coordinator's
103-live-preflight.json and 103-native-contract.md. Read AGENTS, glossary,
ADRs 0001–0003, implement-spec and tdd before changing production code.
Approved seam: complete built userscript with real workspace, editor, storage
and forum client. Substitute external HTTP/browser host only, using offline Edge.
No internal mocks, unit tests or live reports. Installed Edge belongs to coordinator;
Chrome is explicitly deferred to #112.

Failure inventory and observable expectations, recorded before feature code:

- Missing/spoofed capability, ambiguous script, unsupported/disabled/extra controls,
  wrong action/target, missing/mismatched actor or token: no actionable submission.
- Both menu entries open current source choices; opening, typing, cancelling,
  Escape and IME composition send zero POSTs and return focus correctly.
- Blank/over-200-codepoint text cannot submit; supported selected reason maps to
  exact source report_select/message. Other permits explicit free text.
- Changed actor, target permission or form semantics during approval: no POST;
  fresh token values may change without changing the approved meaning.
- Duplicate activation: exactly one POST, exact current target and successful
  hidden controls; no fabricated named submit button or endpoint.
- Explicit qualified rejection is distinct from transport loss/unknown response.
  A success response alone remains uncertain without independent status; no replay
  on close/reopen/reload. Submitted text remains visible for inspection.
- Narrow 390px/125% controls fit inside dialog; cancellation remains reachable;
  native body's Escape veto does not prevent local dismissal.
- Public portable changes get version/consumer verification; no schema change.

Plan: source-qualified availability/form/cancel tracer; then deliberate submission,
authority and outcome slices; then layout/keyboard/compatibility evidence. No
costly-to-reverse architecture or storage decision is planned.

## Trade-offs

(To be appended as decisions are actually made.)

1. Recognize the observed structured schema13 actor/token-bound form and bounded
   inert reason-array/generator grammar. This fails closed on HTML/XML alternatives,
   escaped/HTML-significant reason literals, ambiguous controls, changed handlers
   or changed length helpers instead of guessing how arbitrary native JavaScript works.
   No fetched scripts run; source labels remain unmodified.
2. Reject over-200-codepoint input while keeping it editable, instead of native
   truncation with ellipsis. Whitespace-only input is also blocked. This avoids
   changing the reporter's text silently while imposing a slightly stricter UI.
3. Selecting Other clears the local content instead of preserving the native
   previous built-in value until focus. This makes free-text intent explicit and
   avoids accidentally submitting a prior reason or the native placeholder.
4. The portable result deliberately has no confirmed variant: no independent
   report-status endpoint is known. Only an unambiguous same-action native error
   is rejected; success-looking, lost, structured/unrecognized or ambiguous replies
   remain uncertain. This sacrifices positive confirmation instead of inventing
   outcome evidence. Reopening the same uncertain target is blocked in this document.
5. Forms and submitted results are document-memory only, following the existing
   rating boundary. They survive dialog close only as the client's uncertainty
   guard; reload loses that guard and visible text but performs no replay. There is
   no new permanent schema, retry mechanism or durability claim.
6. Native choices and diagnostics retain forum language; authored labels, progress
   and primary outcomes use the three existing interface languages. This preserves
   source meaning while allowing mixed-language native refusals.
7. Additive portable contract version 0.24.0 requires structural client consumers
   to implement two methods. An existing clean external consumer check verifies
   DOM-free declarations and unchanged established workflows.
8. Browser acceptance uses installed Edge/Tampermonkey and defers Chrome to #112
   under the owner's explicit scope. No consequential live report is authorized;
   exact-payload submission/outcome evidence is synthetic, and native installed
   acceptance is limited to opening, editing, validation and cancellation.

9. Keep reporting in its own forum-client module despite parallel fresh-authority
   guards in rating. This preserves the different native forms and outcome rules
   without introducing a generalized mutation framework for two workflows.

## Verification and replay

Pinned Node 24.22.0 / npm 11.21.1; Playwright selects installed Edge and routes
external HTTP in an offline context. From the implementation checkout:

```sh
export PATH=/private/tmp/tsdm-ui-95-toolchain/node_modules/.bin:$PATH
npm ci --cache /private/tmp/tsdm-ui-95-npm-cache
npm run build
npm run test:e2e -- tests/e2e/report.spec.ts tests/e2e/rating.spec.ts tests/e2e/post-actions.spec.ts
npm run test:consumer
npm run typecheck
npm run lint
npm run format:check
npm run evidence:verify -- evidence/runs/2026-11-13T13-29-55.507Z
```

The final complete-app run passes **72/72**, zero retries, at
`2026-11-13T13-29-55.507Z`: 29 report cases and 43 affected rating/menu cases.
Source manifests, exact request/payload evidence, synthetic screenshots and replay
fixtures are retained in each run package. Narrow 125% and localized screenshots
were visually inspected. Current source generator, native counter/helper and
onsubmit semantics came from the coordinator's read-only native research; the
fixture does not authorize any real report or claim a real confirmed report.

Final userscript SHA-256:
`26a65742ad53485c9fea47f0729cf8e590d8ebabcd5b2c690903468dee1b0ceb`
(2,302,936 bytes). Exact immutable candidate is retained outside dist in
`tsdm-ui-103-candidates/26a65742`; the earlier `7e5dadb3` candidate remains separate.
Clean external consumer 0.24.0 passes at `consumer-2026-11-13T13-26-40.567Z`;
the final report-label-only correction leaves its portable library unchanged.
Typecheck, lint, formatting, build and whitespace checks pass.

Retained red/green history (all 2026-11-13 UTC):

- 13:18:58.420: baseline Report placement disabled; 13:20:45.816 form/cancel tracer passes.
- 13:21:28.414: deliberate Submit missing; 13:22:37.060 passes 15 behavior cases.
- 13:23:21.466: counter/helper, malformed literal and conflicting actor checks fail;
  13:24:03.070 passes 24 cases. Consumer 13:24:02.778 correctly rejects old 0.23.0.
- 13:25:02.072: altered onsubmit, quoted and entity-containing reason strings fail;
  13:26:09.636 passes 71 affected cases on provisional 7e5dadb3.
- Installed 7e5dadb3 finds the inherited missing-capability label incorrectly says
  “Not available in this version” for a supported build restoring an older snapshot.
  13:28:45.205 is a fixture diagnostic: ordinary pagehide persistence overwrote a
  post-startup fixture mutation. Seeding browser storage before startup corrects
  the host fixture; 13:29:19.256 then reproduces the actual wording defect.
- Final 13:29:55.507 passes 72 cases, including legacy snapshot → truthful unverified
  availability → explicit thread refresh → source-qualified report form.

Early builds exposed two compile-only integration errors (an unused account option
and a transport headers property outside its contract). These were corrected;
those intermediate behavioral tracer passes are not claimed as successful complete
builds. Earlier intermediate executable bytes were not separately archived;
retained receipts preserve their hashes, fixture snapshots and outcomes. Final and
provisional installed candidates are retained exactly, without relabelling failures.

## Acceptance criteria

- [x] Current source-backed report capability/form and truthful availability;
      legacy snapshots remain unverified until explicit fresh discovery.
- [x] Both menu entries collect supported content and expose deliberate submit;
      opening, editing and cancellation send no report.
- [x] Fresh actor/post/permission/form authority and one-use/in-flight guards.
- [x] Rejected versus uncertain outcomes retain exact submitted intent; unavailable
      independent status never becomes confirmation and no automatic replay exists.
- [x] Supported/unavailable forms, Unicode validation, cancellation, stale authority,
      rejection and loss are exercised with exact payload/request evidence.
- [x] Real native form interpretation and POST transport replace the placement stub;
      fixtures authorize no live report and no live report was submitted.
- [x] Failure inventory preceded implementation; complete-app external-boundary
      E2Es only, with no internal mocks or after-the-fact unit tests.
- [x] Final installed Edge acceptance passes on exact 26a65742 source;
      Chrome remains explicitly deferred to #112.
- [x] Ownership and non-reply exclusions preserved; no recovery schema changes;
      versioned portable contract and existing clean consumer verification pass.

## Final installed acceptance

Coordinator acceptance is retained in the verified private package
`tsdm-ui-103-installed-26a65742`; exact manager source was checked before and after.
The legacy case used actual prior #102 `489fd0` installation/reload/thread refresh,
then replacement with 26a65742. Its old snapshot displayed truthful disabled
“Availability not verified”; explicit Refresh thread discovered enabled Report.
Both named-menu and native context-menu keyboard entry opened the current source
form. No report was sent.

Zero/empty Other remained disabled, selecting a preset enabled Submit, 200 emoji
were accepted and 201 disabled Submit without truncation. Desktop cancellation
returned shadow focus to the exact post-menu trigger. At 390 × 844 and text scale
1.25, dialog client and scroll width both measured 358px; controls fit x48..342,
labels measured 44px, textarea 100px and scrolling exposed buttons y747..795 with
48.625px height. Genuine native Escape dismissed the form and returned exact
shadow focus. Desktop capture had two forum GETs plus two images; narrow capture
had two GETs, both untruncated with zero non-GETs.

The coordinator's own writing probe survived replacements and both checks; only
that probe was cleared afterwards, returning to original blank writing, scale 1
and default viewport. The earlier 7e5dadb3 installed package retains its failed
legacy wording and provisional successful form checks, without relabelling it as
final acceptance. Synthetic screenshots are retained in the complete-app runs;
installed layout/focus facts above are attributed to the coordinator's private
observations rather than claiming saved installed screenshots.

Every #103 acceptance criterion is verified at the owner's current scope. Chrome
remains deferred to #112. No live successful report, parent-spec completion,
release, push or tracker mutation is claimed.
