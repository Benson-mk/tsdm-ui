# Uploaded forum drafts — issue 27

The application supports upload/insert/save, fresh-client list/resume,
revision/resave and publication through the same forum draft TID/PID. Draft
uploads use the owned draft edit form without pretending the writing action is a
published-post edit. Draft serialization includes native attachment containers
and validates newly uploaded references independently before sending a Save.

The complete-application suite is `tests/e2e/draft-attachments.spec.ts`. Its
external HTTP fixture separately owns file bytes, pending uploads, target
associations, saved source/options and effect/read ledgers. It executes the actual
layout, workspace, client and browser host. It does not install a userscript in a
manager or mutate the live forum.

## Operation guarantees

- Upload success alone does not create a draft or confirm an association.
- Save retains the original saved-version conflict baseline. Only explicitly
  validated pending-upload fields can extend the current native form. A fresh
  account/form read after pending-list awaits prevents an observed account switch
  from reaching the Save command.
- Pending, refused, expired and unreselected uploads block Save and
  Save-and-continue. Publication still requires the current saved revision, so
  newly uploaded content must first be saved and confirmed.
- `DraftAttempt.observation` distinguishes independently observed draft/published
  state, submitted content, and attachment associations. A non-null `result`
  means a target was observed; only `confirmed`/`published` means the complete
  corresponding outcome was verified. Original attempt submissions stay
  immutable. A partial original-result check retains an existing draft’s original
  conflict baseline, including before a deliberate warned resend. Partial results retain the known target and prevent silent creation
  of another thread. Original-result checks send no second Save/Publish.
- A first Save that acquires a partial draft identity retains warned manual
  recovery after an inconclusive check. Cancellation sends nothing; confirmation
  creates a distinct same-target update attempt while retaining the original
  unknown submission. Known-target checks cannot select a different listed
  draft. Unconfirmed original content or fresh account/remote-version mismatch
  refuses the resend rather than authorizing an overwrite.
- Only submitted rows are adopted as associated after a successful original
  check. Later writing/uploads remain separate. Fresh association failure clears
  a prior current-association claim without deleting remote bytes.
- Removing a source token leaves the server file intact. Explicit warned
  server-file removal acts immediately on the draft TID/PID. Independent absence
  readback is required; failed readback/account changes retain uncertainty and a
  read-only check never repeats deletion. A confirmed removal changes only that
  file's entries in the original conflict token, preserving unrelated remote
  drift detection.
- Page-session recovery excludes raw selected bytes and tokens. Selected files
  require reselection; uploaded rows are revalidated, pending saves restore
  uncertain, and no upload/save/removal is replayed automatically.
- An enabled empty native `attachupdate[id]` is a no-replacement marker. It is
  preserved in serialization and the saved-version conflict baseline, while
  association equivalence ignores only that exact representation-only marker.

## Repeatable application cases

| Required group                        | Cases and independent outcome                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft-upload-lifecycle`              | Upload-only has no association; one creation then same-target resave/publication, fresh-page list/resume, complete source/category/signature/native control preservation.    |
| `pending-upload-draft-guards`         | Held transfer blocks Save/Publish; removed selection cannot adopt late completion.                                                                                           |
| `draft-upload-refusal`                | Resumed refusal keeps writing and prior association, sends no Save.                                                                                                          |
| `expired-reference-before-draft-save` | Missing pending file refuses Save; recovery expiration also covered.                                                                                                         |
| `draft-attachment-change-conflict`    | Remote source/metadata cannot be disguised as the deliberate new-upload delta.                                                                                               |
| `draft-association-unconfirmed`       | Known identity/content survive missing association; check confirms only original rows and preserves later writing.                                                           |
| `draft-reference-removal`             | Source-only change keeps server file and association.                                                                                                                        |
| `draft-server-file-removal`           | Cancellation, immediate targeted effect, conflict preservation, lost readback/check-only and post-delete account change.                                                     |
| `draft-save-loss-and-later-edits`     | Lost resave confirms by original readback without resending or overwriting later source.                                                                                     |
| `draft-upload-recovery`               | Selected/uploaded/pending-save and valid same-account cases, no automatic effects or serialized file bytes/credentials.                                                      |
| `draft-publish-component-outcomes`    | Remaining draft, moderation, published/missing association and response loss stay distinct.                                                                                  |
| Additional boundaries                 | Pending/unknown Save-and-continue, no-cleanup local discard, native update-sentinel recovery/resave, final published attachment download with original filename/length/hash. |

Replay with the pinned Node 24.22.0/npm 11.21.1 toolchain and locked dependencies:

```sh
npm run build
npm run test:e2e -- tests/e2e/draft-attachments.spec.ts
```

The existing evidence reporter emits a machine-readable receipt, human report,
exact input/artifact identities, and authored synthetic screenshots and
independent file/effect state under `evidence/runs/`. Preserve failure receipts
separately from later successful runs. The coordination handoff lists exact
current run paths and verification results; this document does not substitute
case declarations for executed evidence.

## Acceptance limits and trade-offs

The exact V4 candidate passes 559 affected complete-application E2Es, including
16 native-price cases, and the clean external consumer. Build, typecheck, lint,
formatting and completed Standards, Spec and BDFL reviews pass. The separate
broader integration preview preserves later uncommitted functionality and passes
635 complete-application cases plus its clean consumer; it is a different
executable and is not substituted for installed evidence.

Affected installed workflows pass in both Edge and Chrome on macOS: actual
fixture-file upload, confirmed first save, fresh-client list/resume, second-file
revision/resave, publication and delivered original bytes. Both browsers also
pass pending-upload guards, lost-save reconciliation without replay, later-text
retention, canonical same-context resave, reference-only removal, cancellation,
and explicit file removal with read-only absence confirmation. These are
controlled external-network fixtures, not native forum removal evidence.

The authorized native path used one JPEG upload and first Save on V3, followed
by V4 read-only reconciliation of that same immutable attempt, fresh-client
resume, one resave and one publication. The identity remains unchanged, the
complete approved source/options and attachment association are independently
read back, and the delivered original JPEG matches the selected 707 bytes.
The original first-save failure is retained with V3 attribution. Its cause was
proved before the V4 correction; neither that upload nor Save was repeated.

The independent native continuation audit passes 548 assertions. It verifies
the immutable original attempt, fresh-client provenance, exact final edit-form
source/options, same-identity publication, draft-list removal and delivered JPEG.
Native displayed JSON is a projection with generic attachment tags and an edit
note; exact editable source is verified separately from the native edit form.
Reload also triggered one automatic Cloudflare POST and one native mail-trigger
GET. These were not forum save/upload/delete commands; no claim is made about
mail delivery or other platform background effects. All four approved native
effects are used; no further write, upload or deletion is authorized.

Final criterion disposition:

- [x] AC1: same-identity upload/save, fresh resume, revision/resave and publication
      with complete source/options and confirmed attachment association.
- [ ] AC2: preservation, pending/expired guards, source-only removal and immediate
      explicit deletion pass deterministic and installed fixtures. Native draft-file
      deletion and authoritative absence remain unverified; committed with explicit
      user approval on 2026-10-24: “Accept limitation; commit and close #27”.
- [x] AC3: uncertainty preserves context and independent attempts without false
      association, replay or silent cleanup.
- [x] AC4: independent complete draft/published readback plus repeatable
      moderation and remaining-draft fixtures.

Repeatable evidence is retained locally under
`evidence/runs/issue-27-completion-retained/`: isolated handoff, broader integration
proof, installed audits and native audit summaries. Authenticated originals stay
private and are not part of the commit. The candidate userscript SHA-256 is
`4a75163df1ba206480990da67c5867f38a09db47ea60fbc5f5d860f02b6ddf90`.

Native server-file removal and authoritative absence through the draft path
remain unverified for issue 27. No native file deletion was performed by this
ticket. On 2026-10-24, after disclosure of this issue-specific gap, the user
explicitly authorized: “Accept limitation; commit and close #27”. AC2 remains
unchecked in the commit and acceptance record. This is a fresh issue 27
disposition; issue 26's earlier exception is not reused.
Stable cross-platform release qualification and publication remain later gates.

Six distinct implementation trade-offs were selected:

1. Add a small serializable observation to the existing attempt instead of a new
   outcome framework. This preserves independent facts with limited API change;
   consumers must distinguish observed identity from complete confirmation.
2. Adjust only verified deleted-file entries in the original serialized conflict
   token instead of adopting the latest whole form. This avoids schema expansion
   and preserves conflicts; malformed legacy tokens remain unchanged and later
   Save safely refuses rather than guessing a baseline.
3. Treat only the enabled empty native update sentinel as representation-only
   for association equality. This accepts the native post-save form shape while
   preserving real metadata comparison and the original conflict token.

4. Derive the first-save recovery lineage from its retained observed draft result
   rather than mutate the immutable submission or add another identity record.
   This keeps the recovery model small, but requires explicit same-target checks
   and refuses a direct resend when original content remains unconfirmed;
   unrelated remote source must first be reconciled.

5. Publish the additive draft lifecycle as forum-client 0.9.0 while retaining
   application 0.4.0 and optional legacy observation fields. This gives consumers
   an explicit behavior boundary without adding required methods; exact pins
   must move deliberately, and result identity remains insufficient confirmation.

6. Accept only the independently observed one-way native attachment price default
   (enabled `attachnew[ID][price]` submitted empty and stored literal `0`) during
   draft verification. This enables the native uploaded-draft lifecycle at the
   cost of one narrowly qualified equivalence and optional recovery/consumer
   metadata. All other values, names, ordering and enablement remain exact;
   raw conflict versions stay unchanged. Immutable submissions retain empty,
   while a fully confirmed result updates only still-matching current fields
   to canonical `0` for subsequent saves.

## Current accepted-baseline port

The historical final corrected #27 delta is selectively reapplied to accepted
#26 commit `9a1cdb0277da4372df9ec7ad50fb7a9b3ca0cf80`. Its existing E2E suite
was copied before production changes and reproduced the current draft refusal.
The port retains accepted #25 conflict/recovery corrections and #26 native HTML
upload policy, explicit attach/attachimg kind validation and file-read guards.
The fixture omits the native upload initializer from the JSON projection. Its
replacement cases use another ordinary board rather than later hongbao actions.
Historical tests are attributed as reused evidence, not newly authored tests.

The package adds optional `DraftAttempt.observation`; old serialized attempts
remain valid. No new required client/transport method is introduced. Consumers
must require `confirmed` or `published` for complete outcomes; a retained result
identifies an observed target while independent content or associations may
remain unknown. Current test receipts and hashes are in the coordinator handoff.

## Native price default correction

The native first save stored the pending empty attachment price as literal `0`.
A complete-app reproducer first returned the same content-confirmed,
association-unconfirmed result. Four one-variable probes ruled out image kind,
implicit read-permission selection and the empty replacement sentinel: only
restoring the stored price to empty removed the failure. The sanitized fixture
contains authored identities, never captured account or form credentials.

`DraftAttempt.observation.attachmentNormalizations` optionally records each
qualified `{ name, submitted: "", stored: "0" }` default. Absence remains valid
for old attempts. Consumers retain the immutable submission and use independently
confirmed results; they may adopt the canonical stored metadata into unchanged
current writing, or resume the fresh saved draft. This evidence is not permission
to normalize arbitrary prices or rewrite `DraftIdentity.version`.

The full-app cases cover initial save, original-attempt read-only checking after
reload, later local edits, canonical resave/publication and unchanged immutable
submissions. Nonzero, padded, whitespace and reverse price changes, description,
read permission, field order, missing/disabled controls and later remote price
conflicts remain refusals. No native upload or first save is repeated to verify
this correction; the coordinator checks the retained original attempt.

## Evidence choices

1. The installed fixture uses one authored draft identity and the unchanged
   adjacent attachment controller. This bounds the scenario and preserves the
   transport safeguards; replay requires both modules and does not establish
   behavior for arbitrary identities by itself.
2. Raw authenticated captures stay private. Portable evidence uses authored
   projections and records extraction proofs for private runtime wrappers;
   readers can replay synthetic behavior but cannot reconstruct omitted private
   originals. The action ledger describes the authored procedure rather than
   claiming to be raw UI telemetry.
3. The fixture retains the observed permission-option values and implicit
   selection while substituting synthetic labels. This preserves parser behavior
   without claiming exact native presentation captions.
