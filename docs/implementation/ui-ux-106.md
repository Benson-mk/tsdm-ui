# Restore each thread's unfinished reply — #106

Implemented against integration `ec171fdeb81ada4ec7ed6e4957f8cbdbd671b2de`.
The accepted executable is SHA-256
`5052b1545d63075aea1def8726b2476e07416fa92b04653cb2e072a73de9c877`.
This is the bounded C3 slice of parent #95. Durable restart, automatic account
sharing, cross-tab conflict resolution and next-draft pending sends remain
#107–111 work.

## Ownership and behavior

The workspace owns one active editor and one inactive ordinary-reply slot per
thread, within the forum origin. Source, target, options, selection, attachment
intent and existing immutable histories survive ordinary thread switches.
The layout renders a small Local draft label; it does not own a separate draft
store. New-thread, edit-post, private-message and server-owned Forum draft
navigation/replacement rules remain deliberate.

In-document selection disposes the old active editor, retains available local
file bytes and revokes transient preparation/review. Reload separately normalizes
lost bytes and pending operations in every recovered context. A delayed result
cannot revive authority after leaving and returning to the same context. Owned
publication, upload and file-removal effects keep their composition owner until
they settle, including their acknowledgement windows.

Schema4 stores active and inactive writing in the existing acknowledged
page-session record. Schemas2/3 remain readable, as does the existing schema1
navigation-only migration. Duplicate thread/context identities, non-reply retained
entries and malformed/incompatible records refuse automatic recovery while
preserving raw content. Storage refusal, quota and readback failure keep both
live and parked content in memory with visible unsaved recovery. Startup persists
normalization only after all recovered owners, including favorite history, have
been initialized.

Ordinary return restores the original target automatically. An explicit Reply to
post or Reply to thread after deliberately replacing a non-reply context first
restores the retained slot and then uses the existing fresh retarget path. Failed
preparation retains the original target, source, options and attachment intent.
Parked ordinary replies keep their own attempt histories; only actually discarded
non-reply contexts transfer histories. Unequal observations with the same attempt
identity refuse replacement before either context changes. Equal observations
can be deduplicated without selecting a status winner.

Account metadata remains eligibility and provenance, never an account component
of the thread key. Automatic account observation or Reply does not replace another
actor's writing. The existing explicit text-copy replacement remains available
with its attachment-loss disclosure and original immutable attempt identities.

## Research and failure-first record

Before feature code, read the parent/child specs, domain glossary, ownership,
recovery and qualification ADRs, and the writing, navigation, host validation,
editor, attachment and publication boundaries. The researched proposal and
failure inventory preceded the first E2E. Root accepted the required
`gpt-6.1-sol`/`xhigh` BDFL evaluation using `validate-gpt-code-review` before
ownership/schema changes. Its later narrow addendum approved history-transfer
ownership and refusal of divergent same-ID observations. The complete evaluation
is retained at `evidence/runs/advisor-106/design-evaluation.md`.

The preimplementation inventory covered repeated two/three-thread source/target/
option/attachment return; one editor and no switch POST; delayed preparation and
stale review; cleared/sent indicators; legacy/reload recovery; quota/refusal/
readback failure; account changes and deliberate copy; pending operation identity;
non-reply guards; and effectful attachment/publication completion ownership.
Tests use the emitted userscript, actual workspace/editor/sessionStorage and
forum client. Only external HTTP and browser-host conditions are substituted.
No internal-module mocks or after-code unit tests were introduced.

Retained red/green milestones:

| Observation                                                              | Retained run               |
| ------------------------------------------------------------------------ | -------------------------- |
| Initial ordinary switch blocked by the old writing dialog                | `2026-11-13T14-52-58.881Z` |
| First repeated source/target/options switch green                        | `2026-11-13T15-00-18.312Z` |
| Inactive reply lost on reload before collection serialization            | `2026-11-13T15-01-07.035Z` |
| Both replies and selected attachment recovery green                      | `2026-11-13T15-02-34.469Z` |
| Unchanged confirmed reply incorrectly retained a draft label             | `2026-11-13T15-05-46.307Z` |
| Non-reply replacement incorrectly prepared blank instead of saved source | `2026-11-13T15-11-34.817Z` |
| Restore-only replacement ignored the explicitly requested target         | `2026-11-13T15-17-06.898Z` |
| Parked B history copied into A; pending recovery erased another owner    | `2026-11-13T15-27-16.226Z` |
| Divergent same-ID observations were silently selected                    | `2026-11-13T15-28-32.413Z` |
| All 26 targeted cases, including causal history/startup fixes, green     | `2026-11-13T15-30-03.157Z` |

Failed fixture experiments remain separate: account changes intentionally
invalidate reader/list caches and reload does not itself authenticate writing;
corrupt/legacy records must be seeded at document startup because real pagehide
saves replace live mutations; qualified upload fixtures need zero legacy queue
limits and all three native attachment controls; typing before new-thread
preparation settles correctly cancels replacement. These were corrected through
public controls or external fixtures, without weakening behavior expectations.
The earlier executable candidates `fdb398…` and `a621ae…` and their installed
partial evidence remain retained rather than relabeled as final.

## Verification and installed scope

The targeted suite covers source/targets/options/selected and uploaded attachment
intent, actual multipart selected bytes, repeated return/history/reload, current
account safeguards and deliberate copy, sent/cleared/modified indicators,
legacy2/3 and invalid collection recovery, visible storage failure without an
active editor, pending acknowledgement/recovery, owned effects and original
attempt identity. Non-reply regression coverage includes the schema4 envelope
with unchanged private-message behavior and existing edit/draft recovery guards.
The portable forum-client contract did not change; the clean external consumer
check also passed.

Final affected synthetic/static results and the classified inherited failures are
recorded in the final verification supplement below. The partial broad run
`2026-11-13T15-19-37.560Z` selected 313 cases: 126 passed, 13 failed, one was
interrupted and 173 did not run. It is not a passing 313-case qualification.
Obsolete schema3 expectations were reconciled to the intentional schema4
contract. Other failures are classified against exact #105 bytes, with bounded
comparators treated as diagnostics rather than qualifying passes.

Final installed Edge 157.0.4341.46 / Tampermonkey BETA 5.6.6242 acceptance is in
`evidence/runs/installed-106-final-5052`. Exact manager source was checked before,
after and at final readback. The actual A/B journey verified protected source,
targets, options, one editor, automatic ordinary switching and real reload; a
non-reply probe was deliberately replaced and the restored A reply freshly
retargeted to a different selected post. The 905px/125% view retained the draft
label, editor controls and reader without horizontal writer overflow. The actual
schema3→4 migration is separately retained in the earlier installed fdb package;
final 5052 starts with schema4.

The final untruncated network capture contains 139 requests: 138 GET and one
native Cloudflare challenge POST under `/cdn-cgi/challenge-platform/`. There were
zero forum-operation POSTs. No live publication, upload, account switch or storage
fault was manufactured. Only authored probes were cleared; original blank A's
addressed target and signature were restored. Chrome remains explicitly deferred
to #112 by the owner, along with final integrated visual acceptance; it is not
reported as passed. Existing Windows and manager-update deferrals are unchanged.

## Final verification supplement

The final focused run `2026-11-13T15-39-32.228Z` passed 71 of 74 selected
cases, including all 27 UX106 cases. The equivalent same-ID history case also
passed with object keys reordered. The remaining three cases exposed two old
public-to-private reading prompt expectations and the old schema2 migration
assertion. Their source-preservation, deliberate private replacement, original
attempt identity, private review and migration expectations were retained.
The final replay `2026-11-13T15-42-11.160Z` passed all 14 cases: those three plus
all 11 UI105 compact/expanded, editor continuity, review, tools, keyboard and
attachment presentation cases. Together these runs verify 85 distinct cases at
the accepted executable. Earlier failed runs remain failed receipts.

The partial broad run's eight timeouts were compared against independently
rebuilt #105 (`d53e6627…`) and final #106 (`5052b154…`). The 8-second comparison
is diagnostic only. The actual stale controls were a board link now outside the
reader and a source editor hidden by #105's visual default. Public-entry helpers
were corrected, then all eight scenarios passed at the normal 30-second timeout.
Safe ordinary-reply reading navigation now skips the old prompt, including reading
a private conversation; it preserves the original public writing. Starting
private writing still requires explicit replacement, and active private writing
retains its recipient and replacement guards.

Two inherited draft-recovery assertions remain for #112: `review.check-published`
and `review.check-moderation` expect a saved-result Post101 link that is absent.
Both failed identically at the exact independently rebuilt #105 and #106 bytes
with normal assertion timeouts. They are not reported as fixed or passing.
The baseline identities, comparison records and original logs are preserved in
`evidence/runs/ui-ux-106-classification`.

Final typecheck, ESLint, Prettier and whitespace checks passed. A clean final
build reproduced the installed SHA-256 exactly. The external consumer passed in
`consumer-2026-11-13T15-20-33.817Z`; subsequent edits did not change its public
portable contract. All retained package manifests were verified, including final
and provisional installed evidence, synthetic successes/failures, consumer,
advisor and classification packages. The evidence archive preserves these ignored
artifacts before worktree cleanup.

## Replay

Use Node 24.22.0, npm 11.21.1 and the locked dependency set. Development fixtures
use installed Edge with routed networking failing closed.

```sh
npm ci
npm run build
npx playwright test tests/e2e/retained-replies.spec.ts
npx playwright test tests/e2e/reply-layout.spec.ts tests/e2e/post-actions.spec.ts
npm run typecheck
npm run lint
npm run format:check
npm run test:consumer
npm run evidence:verify -- evidence/runs/<run-id>
```

Receipts retain exact emitted userscript hashes, test/source identities, request
ledgers, screenshots, outcomes and runtime details. Final and provisional
installed packages include source, observations, screenshots and manifests.
Live replay requires the author's own authorized targets; fixture writes do not
authorize live forum effects.

## Actual trade-off ledger

Each distinct actual choice is recorded once here.

1. Reuse inert writing contexts and colocated immutable histories rather than
   introducing a second content model or #111 operation registry. This bounds
   #106 but retains historical/account metadata alongside content until later
   tickets. Explicit replacement restores a slot before fresh native retargeting,
   adding a GET and retaining the previous target if fresh preparation fails.
2. Bump the page-session envelope to schema4 so older clients refuse rather than
   silently erase retained replies. Older application versions cannot resume the
   new envelope; raw incompatible content remains available and schemas2/3 read
   compatibility remains.
3. Recreate a single editor on a different-thread return, keeping one editor owner
   and exact source/selection. Undo history and transient visual mode across
   different threads are not newly promised. Same-composition compact/expanded
   and source/visual guarantees remain unchanged.
4. Keep an effect's active owner until publication/upload/removal settles, including
   acknowledgement. Another thread can still be read through the existing guard,
   but its editor cannot replace the effect owner during that interval.
5. Retain all page-session slots without eviction or fallback storage. The
   collection can reach quota; failures remain visible and acknowledged effects
   may be blocked instead of silently deleting another reply.
6. Preserve existing deliberate current-account text-copy replacement in the same
   slot. It can discard old attachment intent/composition provenance under its
   existing disclosure; returning to the previous account does not resurrect a
   deliberately replaced composition. Immutable attempts keep original actors.
7. Base badges on authored source, addressed target or attachment intent and
   confirmed authored meaning. An otherwise blank general reply with only changed
   options retains those values without a badge, avoiding extra baseline state.
8. Apply existing strict whole-record validation to the larger collection. One
   malformed retained entry prevents automatic recovery of the whole record,
   while all raw content remains inspectable until deliberate reset.
9. Refuse a genuine replacement when the same immutable attempt identity has
   incompatible retained observations. Both contexts survive; checking/status or
   native/manual continuation may be needed. The code does not invent chronology
   or choose a status winner from array order.
10. Use a readable Local draft label in the existing list metadata instead of an
    unexplained icon. This consumes a little row space while making the local,
    unfinished status explicit and distinct from Forum drafts.

11. Allow safe ordinary-reply reading navigation to private conversations without
    the old Keep writing prompt, while retaining the public composition until
    explicit replacement. This reduces reading interruptions; starting private
    writing still requires the deliberate discard action and preserves histories.

## Acceptance checklist

- [x] Per-thread source, target, applicable options and attachment intent restore without accidental replacement.
- [x] One active editor; inactive local ordinary replies remain distinct from Forum drafts and non-reply semantics.
- [x] Actual unfinished-writing labels, cleared/sent transitions and no stale authority or switch submission.
- [x] Existing page-session/current-account safeguards; no durable restart or automatic shared-account claim.
- [x] Ownership/recovery ADR reconciliation and required advisor evaluation before contract changes.
- [x] Multiple threads, repeated return, nonempty intent, delayed work, recovery failures and non-reply guards exercised.
- [x] Failure inventory and complete-app red before feature code; no internal mocks or after-code unit tests.
- [x] Final relevant E2E/static/artifact audit completed; installed Edge accepted, Chrome owner-deferred to #112.
- [x] Existing ownership boundaries and scope exclusions preserved; external consumer check passed.
