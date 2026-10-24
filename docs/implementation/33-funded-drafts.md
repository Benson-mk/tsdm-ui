# Funded forum drafts — issue #33

This is deterministic application implementation against reviewed B1 (#27 plus
#24/#26/#32). It does not establish installed acceptance or new forum policy.
The separately authorized funded lifecycle in criterion 33.5 remains open.

## Behavior and public boundary

A first packet Save, including Save-and-continue, displays the requested immediate
debit, all current packet conditions and the warning that the packet is active
before publication. Cancellation sends no write. The transient review is bound
to context, revision and current account generation. External forum-client
callers must explicitly supply `fundingReviewed: true` on a charge-bearing
`DraftAttempt` before `prepareDraftSave`; its exact prepared attempt is one-use.
This is caller consent, not evidence of a financial effect.

The client uses the current packet form for initial Save. It validates current
limits and designated recipients, then reobserves the form/account after async
lookups/upload validation and checks both capabilities and source version before
sending. Recovery acknowledgement still precedes the command. Changed content,
settings, account, current limits or failed storage acknowledgement prevents it.

Known same-target Save retires creation controls. If later local packet values
have diverged from the immutable submitted values, target adoption preserves those
values in workspace-only `unappliedPacketOptions`. A read-only “Unapplied packet
settings” section distinguishes them from the saved packet's conditions. They
survive acknowledged page-session recovery, remain outside submitted options and
are explicitly stripped from client submission snapshots. Later content saves or
publication do not apply them or fund another packet. Pending/lost attempts still
allow later writing; a warned resend with no known target can deliberately submit
its freshly reviewed current settings. Malformed retained option data takes the
existing incompatible-recovery path. Save-and-continue is blocked while retained
unapplied values remain: a visible explanation asks the author to return, copy
needed values and explicitly discard the old writing before replacing it.
Ordinary Save preserves those values. The shared gate runs before any command and
again after awaiting the result, before new-thread/reply, owned-edit or other-draft
replacement. Explicit Discard remains available; old values are not transferred as
though they belonged to a new composition. When no unapplied values block
continuation, the existing preparation call preserves the selected new-thread
packet flag as well as board/reply target. Requesting New red packet therefore
opens a fresh packet form after saving the old draft, with no automatic funding;
a later charge still requires its own explicit current funding review.

The immutable original attempt
retains requested packet values; later draft/content saves never synthesize absent
`hb_*` controls, reset expiry or attempt a top-up. An independently observed native
thread packet marker is retained as `observation.packetMarker` and used to retain
the existing packet context even if the status endpoint is temporarily unreadable.
A marker is not proof of packet activity, conditions or debit. Fresh list/resume
uses the actual TID/PID and native edit controls, preserving ordinary options,
attachments and opaque native metadata. A bare draft without a marker can still
be revised without inventing a packet.

`DraftAttempt.status` describes draft/thread source and association confirmation.
Its optional `redPacket` reports the separately observed packet status, visible
condition flags and current returned credit rows. `credit` remains `unknown`:
no backend funding identifier, amount/time/balance join or transaction rollback is
invented. HBS funding, HBG claim and HBR refund rows remain distinct; publication
and other ordinary rewards do not become packet credits. Presence flags cannot
confirm exact passphrase/recipients, total/shares or an expiry deadline. Submitted
secret/recipient values remain requested data, not independent readback proof.

Lost responses and validation refusals for initial funding remain uncertain.
Check result is read-only; a deliberate resend requires the existing warning plus
possible additional debit/duplicate packet disclosure, then a new current funding
review. It creates a distinct attempt with `resendOf`, retaining the original
unknown submission. There is no automatic second Save, cleanup, claim or withdrawal.
Save-and-continue carries original component observations into replacement rather
than treating thread confirmation as complete financial confirmation.

Fresh recovered-session checks validate the current account generation while
retaining the original attempt's historical generation. Pending attempts restore
uncertain without replay; old snapshots missing packet observations explicitly
show unknown outcomes. Malformed states/markers use existing incompatible-record
recovery. Actual page-session inheritance in deterministic Edge preserves an
uncertain attempt and permits independent writing; this does not promise that
all browsers always copy/restore a session.

Expired, moderation and remaining-draft results remain independent of refund
observations. Missing expected refunds have moderator-assistance guidance with no
timing promise and no automatic message or financial operation.

## Failure-first application coverage

The 38 expanded cases in `tests/e2e/funded-drafts.spec.ts` drive the built layout →
workspace → client → browser host. Only external HTTP is authored. Server draft
source/options, file inventory/association, packet conditions/clock and credit rows
are independently owned fixture state. Tests inspect visible results, immutable
acknowledged attempts and actual effect requests, not application success alone.

- Review/cancel and actual initial funded Save; stale source/settings/account,
  limits and recipient resolution, including account/limits changed during await.
- Uploaded Save → revise/resave → fresh-page list/resume → publish → owned edit,
  same TID/PID, preserved original secret/recipient conditions/native metadata and
  one HBS event with separate publication reward.
- Bare draft, unreadable packet, unavailable credit page and ambiguous concurrent
  funding/claim/refund rows. Later status recovery preserves the independent marker;
  bare-thread revision has no creation fields or funding.
- Lost initial Save, explicit warned resend, conservative validation refusal,
  Save-and-continue retaining unknown component history, later local source and
  duplicate confirmation.
- Server-owned expiry before later Save/Publish, moderation, remaining draft and
  absent refund, without expiry restart/re-funding/refund attribution.
- Legacy/malformed metadata, fresh historical-generation original-result check,
  real page-session quota refusal, pending funding reload, account change during
  ledger observation and opener-inherited independent page sessions.

Receipts retain meaningful RED failures separately from browser-launch, locator
and pre-ack persistence expectation mistakes. Per-run reports/manifests identify
source hashes and userscript bytes; final handoff supplies frozen source/artifact
copies and exact baseline-relative deltas. No unchanged historical receipt is
reclassified as current installed acceptance. The final scoped verification must
include typecheck, format, build, scoped lint and affected draft/upload/direct
packet/owned-edit/recovery application regressions. The integrated final package
consumer/replay remains a #34/#36 gate after B2.

F33-1's held initial-response case first reproduced missing retained later packet
settings before correction. The corrected case verifies amount, text and checkbox
values, reload, preserved ordinary options/source and a later content save with
one funding only. A lost-response case verifies recovered read-only adoption,
select/text values and later upload/source preservation with no additional write.
Malformed retained settings are rejected; warned resend still uses freshly reviewed
current settings. These added controls passed on the corrected candidate; they are
not represented as separately failing before correction. Original 149/29 evidence
remains archived under its original source/candidate identity.

The continuation follow-up first reproduced missing explicit handling when
Save-and-continue replaced a context with unapplied settings. A late-response case
also required the explanatory gate after await; the existing revision guard
already preserved writing in that late-edit variant. Four application paths cover
new-thread (a different packet composition), reply, owned-edit and another draft.
They assert zero continuation writes, recovered identity/settings, unchanged
original/server conditions and ordinary Save without extra funding. The new-thread
path also verifies explicit Discard, and the original no-unapplied continuation
case remains a positive control. Two navigation-only setup defects (same-action
resume instead of replacement, and missing Return to reading) are retained
separately from genuine failures.

F33-2's application case first reproduced the missing packet controls after a
successful Save-and-continue targeting New red packet. Passing the existing
selected packet flag through the preparation call preserves routing intent. The
case checks the fresh packet form request, blank new amount/title, original saved
target/attempt, one funding only and a separate later review/cancel with no write.
This is a correction to existing selected-action behavior, not a new product
policy or trade-off.

## Acceptance limits

Criteria 33.1–33.4 have deterministic scenarios for the implemented branches;
this is implementation readiness, not fully satisfied issue acceptance. Criterion
33.5 requires a separately bounded installed funded lifecycle on identified bytes,
separate from direct packet publication. Current allowed minimums, actor/board,
maximum funding exposure, effect counts and stop/readback checkpoints must be
reviewable before requesting that authority. No live funding, upload, publication,
cleanup, installation, commit, issue mutation or release occurred here.

The implemented preservation rule refuses conflicting/unsupported current forms.
It does not offer in-place draft overwrite reconciliation, prove hidden native
condition enforcement, expose top-up/claim/withdrawal UI or infer exact refund SLA.
The accepted Edge/Chrome affected acceptance and stable macOS/Windows release
matrix remain unchanged. Completed BDFL review and scoped integration follow this
implementation's frozen handoff.

## Distinct implementation trade-offs

- D33-1: retain a transient workspace funding review and add explicit caller consent
  to the existing one-use draft preparation, rather than introduce a general
  transaction/review service. This keeps draft ownership local but requires external
  clients to provide their own explicit disclosure/consent before passing the flag.
- D33-2: retire creation controls on known target adoption while retaining requested
  values in the original immutable attempt. This prevents implicit re-funding and
  means later edits target content, not missing or unobserved packet creation values.
- D33-3: reuse recipient resolution in the packet module for both direct publication
  and draft Save, adding a final fresh form/account read for charge-bearing saves.
  This avoids divergent validation at the cost of an extra read before sending.
- D33-4: use current-session generation for deliberate read-only recovered checks,
  while immediate operation results still require the sending generation. This
  allows old acknowledged attempts to be checked without treating historical
  process-local counters as current authority; original attempt fields stay intact.
- D33-5: reuse the existing packet presentation inside each draft attempt without
  refactoring the direct-publication layout during feature correction. This keeps
  the existing direct UI stable but duplicates presentation markup that must remain
  consistent until a separately justified component extraction.

- D33-6: retain differing later packet values as read-only unapplied workspace
  options when a known draft target retires creation controls. This preserves
  already-entered and restored intent and leaves deliberate warned resend usable;
  freezing all unresolved controls would need separate treatment of old snapshots
  and resend editing. The cost is another validated recovery field and explicit
  presentation of unapplied values, which must stay outside client submissions. The
  continuation policy adds an explicit copy/discard step before replacement when
  these references remain; it keeps ordinary Save safe without creating a
  multi-context settings history or associating old values with new writing.

The additive component/marker observations apply plan P-T3 and D27-1's existing
bounded observation choice; they are not a second trade-off entry. Edge routine
cadence, E2E-only seams, original uncertainty policy and isolated worktrees are
previously accepted choices, not newly selected product trade-offs.
