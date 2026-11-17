# Approve prototype A at 95d79a5

On 2026-11-17, the owner instructed: “fallback to `95d79a5`, approve that
`95d79a5` prototype A”. This supersedes the refinement at `b4829d8`.

The approved visual reference is **variant A at
`95d79a5efafe6d7324ba742d71e09b8062ec2e99`**, on
`prototype/improve-ui-ux-2026-11-17`. Approval applies to that prototype revision.
The existing instruction to keep this work on the prototype branch remains in
effect; production implementation and qualification are separate work.

## Plan and failure cases, recorded before rollback

Revert the single refinement commit without rewriting history, then verify the
restored application files against the approved revision. Keep this approval in
a separate document so the original report and evidence retain their historical
meaning.

- Do not accidentally keep refined labels, disclosure markup, color overrides
  or the added sample row when restoring the original candidate.
- Do not erase the rejected refinement's provenance or rewrite unrelated work.
- Do not confuse visual approval with production delivery or installed-host
  qualification.
- Do not reattribute the refinement's observations to the approved candidate.

## Acceptance

- [x] Restore all tracked content from before the refinement, with only this
      approval record differing from `95d79a5`.
- [x] Verify the running A preview and static typecheck.
- [x] Record the exact approved revision and supersede the refinement pointer.

## Verification

`git diff 95d79a5 --exit-code` returned no tracked differences before adding this
record. `npm run typecheck` and the staged diff check passed. The running preview
was reloaded with `?variant=A`; the original author/time footer and reply-count
disclosure were observed at 1440×900. No automated tests were added or run.

The restored screenshot is retained locally at
`evidence/runs/information-prototype-A-approval-2026-11-17/A-restored.jpg` with
SHA-256 `3236364fc3ca64d2cabf8142c5234b42d09c6257b9df89bd8ba67f18fc463618`.
For replay, run `npm run prototype:information`, open variant A and compare it
with the original candidate. The original evidence stays attributed to
`95d79a5`; the reverted refinement remains accessible at `b4829d8` in history.

## Trade-off

A revert commit preserves the refinement and its report in Git history, at the
cost of an additional history entry. The checked-out application remains the
approved revision's exact content. Its original design and evidence trade-offs
remain in [the original report](information-hierarchy-2026-11-17.md); this rollback
introduces no new UI choice or production contract.
