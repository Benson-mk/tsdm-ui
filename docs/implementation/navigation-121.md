# Start or resume writing without losing the target (#121)

The Board results put **New thread** before the list, using its exact Board ID.
**Board actions** groups the existing red-packet preparation, favorite preparation
and refresh. A direct Thread with no loaded results retains the parent-Board entry
without initiating a Board read. Native form preparation still controls whether
New thread may open a composer, and a favorite still requires separate approval.

The active addressed-reply strip shows an exact Post link. In **More writing
actions**, **Return to reading** parks the local reply in the current document;
**Return to writing** replaces the normal reply entry on the
owning Thread. The retained reading position is not the addressed Post. A normal
Thread switch without explicit parking continues to restore its writing as before.
Forum drafts, account checks, Send, result checks and conflict choices stay on their
existing paths. The park marker is not stored; browser reload keeps the existing
recovery presentation and does not replay any forum operation.

## Failure-first replay and verification

- `NAV121.board-writing`: primary entry above rows; keyboard Board menu and focus;
  no action from opening the menu; native refusal before successful preparation;
  the same exact `fid` on both form GETs; no submission.
- `NAV121.direct-parent-actions`: keyboard focus, Escape and pointer choice in the
  narrow Boards drawer; one parent-Board red-packet form GET with no Board read.
- `NAV121.addressed-link`: exact target link in both presentations; compact at
  1146 × 876 and focusable at 375 × 420; unchanged source, options, attachment
  metadata and request ledger across the presentation round trip.
- `NAV121.parked-reply`: no competing fresh-reply entry for a parked draft; the
  unedited second Thread still offers Reply; Back through Thread and Board visits
  keeps writing parked; resume at Post 202 preserves the Post 101 target and
  acknowledged source/options/attachment intent without a new forum request.

The new cases first failed in Edge at the missing Board entry, missing visible
Post link and missing explicit parking action. Use locked dependencies and an
installed Microsoft Edge executable with the repository's offline, routed fixture
configuration. Build the userscript before replaying:

```sh
npm run build
npm run test:e2e -- tests/e2e/new-thread.spec.ts tests/e2e/writing-presentation.spec.ts tests/e2e/reply-layout.spec.ts tests/e2e/explicit-replies.spec.ts tests/e2e/conflicting-replies.spec.ts tests/e2e/favorites.spec.ts tests/e2e/hongbao.spec.ts tests/e2e/draft-recovery.spec.ts tests/e2e/board-groups.spec.ts -g 'NAV121|UI84\.|UI105.continuity|UI87.mismatch-review|UX110.(one-send|current-actor|unknown-actor|uncertain-resend)|UX109.choose|J9.favorite-attempt-forum|J7.packet-current-controls|review.retain-save'
npm run evidence:verify -- <run-directory-printed-by-playwright>
```

The reporter retains screenshots, request ledgers, writing observations, the
candidate digest, source hashes and a verified manifest. This is built-userscript
synthetic evidence in Edge, not installed manager or live-forum qualification.
Chrome belongs to #124. In a wider exploratory run, three existing cross-tab
conflict cases (`UX109.epoch`, `UX109.stale-discard`, `UX109.target-intent`) fail
at the same assertions on unchanged `94f68a5`; `UX109.downgrade` also requires
an absent historical #108 build. `UX109.unsettled` passed one integrated replay
and failed later replays at the source-editor assertion, also reproducible on
unchanged `94f68a5`; the failure occurs after asserting Send is disabled.
`UX109.choose` and `UX110.uncertain-resend` separately cover explicit conflict
choice and read-only original-attempt checking before any separately approved resend.

## Trade-offs

1. Put authoring before results rather than pinning it. This makes the current
   Board entry discoverable without adding a second action or reducing the
   scrolling viewport with a sticky reserve; deep scrolling can move it out of view.
2. Keep one labeled disclosure for secondary Board actions. The primary entry is
   easy to find and consequences are unchanged; Refresh, Save board and New red
   packet now take an additional activation.
3. Retain a parent-Board fallback for direct Threads instead of fetching a Board
   just to place authoring. The fallback remains in the Boards pane, so access in
   a narrow direct Thread still requires opening that pane.
4. Put the exact link on the visible target strip, not the assistive destination
   summary. The summary still describes the target, but no longer duplicates the
   active link. Qualification uses the existing target identity and permalink
   rules, not a read of an already unloaded Post.
5. Record deliberate parking for an exact writing context only in memory. This
   distinguishes Park from navigational hiding without schema, durability or
   authority changes, at the cost of not restoring the gesture across document
   replacement. The existing durable local reply still restores normally.
6. Reuse the Thread's composer entry for Return, and the addressed reply's existing
   writing menu for Return to reading. Recovery stays near its owning Thread and
   avoids giving a competing generic reply action; parking takes the menu step and
   is not a separate always-visible control.
7. Reuse existing routed fixtures and reporter rather than introduce an evidence
   format or mock storage/operation owners. The replay can prove exact browser UI
   and request boundaries in Edge but makes no claim about installed Chrome or live
   forum behavior.
8. Keep #120's directory refresh and rediscovery checks on their original surface.
   Change only the checks that now refresh from a current Board; directory
   refresh is not moved into the authoring menu.
