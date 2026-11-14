# Use browser page-session recovery

Installed idle checks exposed loss of the manager's tab record on both selected development browsers. The user [accepted option B](https://github.com/Benson-mk/tsdm-ui/issues/15#issuecomment-6248702394): keep one userscript and use one namespaced, versioned browser `sessionStorage` record, accepting forum-origin authority and browser-controlled inheritance/restoration. This supersedes the manager-tab mechanism in [ADR0001](0001-share-forum-workflows-across-layouts-and-hosts.md) and conflicting strict tab-close/no-inherited-copy/no-revival wording in the inherited issue resolutions; it is a contract decision, not proof of completed qualification.

Navigation and later writing recovery share one acknowledged serialization owner. History keeps only safe destinations and opaque keys. Refusal, absence or incompatibility stays visible; there is no dual GM/localStorage fallback or permanent local draft collection. Existing GM-only development navigation snapshots are not migrated: their opaque entries use the explicit unavailable/Reload path when the new store has no record.

A new or restored tab may initially contain the same writing context and draft/edit target, then diverges independently without ongoing synchronization. Closing/restoring, browser restart and application replacement may recover only where the browser supplies a compatible page session; none is an unconditional durability promise. Same-origin scripts may read or modify the record. Recovered content stays inert, account-bound and subject to fresh permissions/source-conflict checks; copied or restored uncertain operations stay uncertain and never auto-submit. Cookies, form tokens and unuploaded file bytes remain excluded.

The trade-off preserves one userscript installation while accepting shared-origin storage authority, finite synchronous storage and browser-controlled copying/lifetime. A companion extension was not selected. The new actual storage path still requires installed reload, redirects/remounts, idle, independent/inherited contexts and divergence, close/restore/restart/update, refusal/capacity and incompatible-record evidence. The selected BETA development observations do not replace the stable installed-host checks in [ADR0002](0002-qualify-installed-releases-with-bounded-evidence.md). Its accepted 2026-11-01 scope defers Windows qualification in #39; that deferral does not establish Windows recovery behavior.

## Multiple ordinary replies — #106

The page-session owner now writes schema4 with active writing and an inactive ordinary-reply collection in one coherent acknowledged snapshot. Schemas2/3 remain readable with no inactive collection, and the existing schema1 navigation-only migration remains. Each thread has one active-or-retained slot. Invalid or duplicate entries refuse the complete record while preserving its raw content until deliberate reset. Older application versions refuse schema4 instead of silently dropping retained replies. A save failure preserves in-memory writing and remains visible even with no active editor; no eviction or fallback store is introduced. Tokens, prepared authority and unuploaded bytes remain excluded. This is still browser-controlled page-session recovery, not durable restart or multi-tab conflict qualification; #107 must separately reconcile schema4 coexistence and durable recovery under its advisor gate.

## Durable ordinary replies — #107

The owner accepted the required gpt-6.1-sol/xhigh advisor's R1–R6 refinements before
implementation. For ordinary local replies only, use origin-scoped IndexedDB
`tsdm.workspace.reply-drafts`, version 1, store `threads`, keyed by thread ID.
Current support is `https://www.tsdm39.com`; account identity is provenance and
eligibility, never a second draft lineage. This supersedes the earlier
page-session-only/no-durable-collection and independent-divergence statements for
ordinary replies. Navigation and active non-reply composition retain their existing
page-session lifetime. Historical private/draft/non-reply attempts already carried
by an ordinary context remain exact historical evidence, not new durable authoring.

Read, validate, compare the observed parent and preserve competing heads in one
strict readwrite transaction; acknowledge only after transaction completion,
readback and a coherent schema5 session checkpoint. A linear descendant replaces
its own known head. Already-captured queued writing and actual owned effect
completions may advance that branch during conflict while preserving every other
head. New mutation/effect authorization pauses for the conflicted thread. An
unrelated clean thread may still acknowledge its own exact head. No timestamp,
array order or outcome-status rank chooses a winner. Read-only inspection comes
with #107; explicit choice/resume remains #109.

Schema5 retains the existing `tsdm.workspace.recovery` key, adding version/fingerprint
checkpoints and pending explicit dispositions. Schemas1–4 remain readable. The
latest complete session is captured synchronously before queued durable work; a
late checkpoint cannot roll back newer navigation or writing. The two stores are
not atomic. A failure after commit is unestablished acknowledgement, not rollback;
retain the committed baseline to avoid self-forking on retry. Incompatible session
raw data remains unchanged until deliberate reset, independently of compatible
durable replies. Invalid/future durable data is inspectable or visibly refused;
there is no delete/recreate fallback. Session reset does not reset durable replies.

Recursive inert projection preserves authored source verbatim, explicit target,
options, attachment intent and exact immutable historical observations. It excludes
unknown keys, current prepared authority and file bytes, and validates metadata URLs
and native attachment fields. A current selected upload projects to unavailable
`reselect` intent, while its live owner keeps usable bytes; historical statuses are
unchanged. Startup normalizes lost pending operations to uncertain without replay.
Live remote observations retain the exact pending/history state of their owner.

Shared authored meaning excludes incidental current context/account identity,
selection and local counters; historical identities remain exact. An equivalent
legacy import can bind to the existing head, while deliberate current-account copy
advances its observed branch and keeps the new eligibility metadata. A different
legacy snapshot or stale explicit disposal preserves both versions. Absence or
navigation is never disposal. Existing account safeguards remain until #108.

Acknowledged local storage supports the qualified browser-profile restart journey;
it is not backup or protection from origin eviction, site-data/profile deletion,
private-session closure or arbitrary OS/power loss. No origin-wide persistent-storage
permission or weaker fallback is requested. The alternatives, advisor refinements,
crash boundaries and all actual trade-offs are recorded once in the
[#107 implementation ledger](../implementation/ui-ux-107.md). Qualification evidence
is separate from this decision and retains Chrome's owner-approved #112 deferral.
