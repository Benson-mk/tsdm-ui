# Thread browsing feedback and approval MVP — 2026-11-09

Branch: `feat/improve-ui-ux`. Status: owner approved the first MVP direction for
comments 1–3 on 2026-11-09. Capture all seven browser comments for later GitHub
tickets. Production implementation and ticket publication remain later work.
The earlier compact Boards-filter suggestion remains pending, not approved by
these new comments.

## Captured feedback

| #   | Owner feedback                                                                   | Intended outcome and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | “Layout look un-natural when only the thread list is without thread opened”      | The supplied screenshot shows compact thread-row content stretched across the whole browsing region. Preview a stable thread-list column and a calm reader placeholder before selection. The owner approved this direction on 2026-11-09 for board thread lists, replacing the earlier full-width browse-only direction in this context.                                                                                                                                              |
| 2   | “it show who is the last reply, current display is meaningless”                  | Replace repeated “Last reply to [thread title]” with latest replier and time, retaining the latest-post destination. `ThreadRow` currently carries `lastPost: ForumLink`, but no explicit last-author field; `read-board.ts` reads the last-post link from the last `td.by > em`. Production needs source-backed latest-author metadata; do not substitute the thread author or invent a name.                                                                                        |
| 3   | “The thread list did not hold in same place when switching”                      | Preserve the list's visible row and offset when opening/switching threads or returning to the list. The screenshot records the symptom; the precise triggering sequence and production root cause are not yet reproduced. The preview demonstrates intended stability without claiming a production fix.                                                                                                                                                                              |
| 4   | “Any meaning for user?” about “Manual refresh / Beginning of thread”             | Manual refresh describes automatic checking being off; Beginning of thread describes a confirmed history boundary. They carry meaning, but the observed 86.8px block makes passive state too prominent. Proposed later reader MVP: put refresh mode in thread options; show useful loading, failure/retry and new-reply actions inline; show boundary context where the posts begin/end. Preserve truthful unknown and failure states.                                                |
| 5   | “it should show current page/ total page”                                        | Show `Page 1 / 6` when the total is known. `ThreadTools.vue` already has `thread.pageJump.total` for qualified totals; its trigger currently shows only current page. Preserve unknown-total fallback and use the visible post's source page, not the entry page or guessed reply-count math. The example total is illustrative.                                                                                                                                                      |
| 6   | “only view the author, rate, report in right click menu. double click for reply” | Interpret “only view the author” as the existing “Show only this author's posts.” Move those actions into a post context menu and double-click to prepare a reply to that post. Reply preparation must never submit. Rate/report are not exposed by the current post-action template or portable post model; production capability discovery and confirmation are separate work. The touch/keyboard fallback is confirmed below; text-selection behavior still needs a design choice. |
| 7   | “For copy the post url with a Toast”                                             | Activating the post-number control should copy the exact post permalink, then show a toast only after clipboard success; on failure offer a selectable link. The observed first post's `href` was a thread URL with `fromuid` and no post anchor. `read-thread.ts` prefers native `postnum` links. A production ticket must verify exact post identity and remove referrals, rather than merely copying the existing `href`.                                                          |

The observations use the user's annotated 1333×874 screenshots and read-only
inspection of the supplied live page. No live navigation, forum mutation, rating,
reporting or reply was performed. The source facts above are not a complete bug
diagnosis. The diagnosing-bugs workflow's reproduction/fix phases are deferred to
the production ticket; this turn captures requirements and previews design.

### Confirmed follow-up for comment 6

The owner approved “Show only this author's posts” as the meaning, and approved
a small ⋯ button that opens the same menu for touch/keyboard use, with Reply also
available there. The future menu therefore offers Reply, Show only this author's
posts, Rate and Report; right-click and ⋯ share it. Double-click remains a reply
shortcut. This adds a visible affordance and one menu item in exchange for access
without a mouse gesture. Text-selection behavior still needs to be designed and
verified before production implementation.

## First MVP unit: comments 1–3

Question: is browsing clearer when the list has the same 300px width before and
after opening a thread, with compact latest-replier metadata and a stable scroll
position?

Use one explicitly named synthetic prototype beside the existing layout previews,
with the production stylesheet, 216px navigation and 300px thread track. The
reader begins with “Choose a thread”; clicking a sample row reveals sample posts.
Keep the list DOM mounted and its rows unchanged during selection. Close the
reader to return to the placeholder. On narrow screens, use list/reader views and
restore the list scroll on return. Expose the selected row, mode and scroll offset
in the prototype footer. The sample latest-replier names/times are fictional.

This bounded unit follows the owner's small-MVP approval workflow instead of
bundling four additional reader interactions into the same design decision.
Comments 4–7 remain recorded above for subsequent preview units and tickets.
No irreversible architecture decision is made; designated advisor validation
follows completed preview inspection.

## Failure inventory before implementation

1. The list still stretches to full width on desktop before selection, or moves
   horizontally when a thread opens.
2. Opening, switching or closing a reader re-renders/resizes rows and loses the
   visible anchor or scroll offset.
3. Latest-replier metadata silently repeats the original author, loses the latest
   post target, or hides missing-data uncertainty.
4. Long CJK titles/usernames or 125% text overflow the 300px track.
5. Narrow list/reader switching loses list position or makes Back unreachable.
6. A current thread's latest-reply action opens an indistinguishable first-post
   state; show the actual target sample post in the preview.
7. Synthetic reply metadata and reading content are mistaken for live forum data.
8. A large empty reader feels wasteful; let the owner judge this explicit trade-off.

## Actual trade-offs

1. A fixed desktop list preserves position and avoids stretched cards but reserves
   reader space before selection. The placeholder and 300px title wrapping are
   intentional alternatives to the earlier full-width browse-only design.
2. Latest author/time gives useful activity context instead of repeating the title,
   but adds a production data requirement and must show a truthful fallback when
   the native source does not expose it.
3. A synthetic, isolated preview demonstrates layout and continuity with no forum
   effects, but does not establish production navigation/restoration, real latest
   authors, installed-host compatibility or complete accessibility qualification.
4. Reusing the production CSS preserves palette/type consistency, but later shared
   CSS edits can alter the preview. Retain source snapshots and hashes for replay.
5. Flat rows, separators and smaller secondary metadata reduce the oversized-card
   effect and emphasize titles, but provide less visual separation and make the
   secondary details quieter than the current elevated cards.

## Approval and verification

- [x] Capture all seven comments with source facts and unresolved behavior separated.
- [x] Provide the runnable first MVP for comments 1–3 on the requested branch.
- [x] Inspect desktop list/reader continuity, latest-reply target, long content and
      narrow/enlarged return behavior; retain repeatable artifacts.
- [x] Complete the designated advisor review and record distinct trade-offs.

These criteria concern feedback capture and preview delivery. The first MVP
layout direction is now owner-approved; production acceptance remains pending.

## Run and inspect

Run `npm run dev -- --port 5173`, then open
`http://127.0.0.1:5173/src/layouts/thread-browsing.prototype.html`.
The prototype is not imported by production entry points. All content is synthetic;
navigation outside the list/reader demonstration is explicitly a stub.

1. With no thread selected, inspect the 300px list beside the reader placeholder.
2. Click **Try a scrolled list**, then directly click the first two visible titles
   in succession. Use **Back to threads**. The list stays in place throughout.
3. Click the latest-replier metadata: the reader targets and outlines sample post
   3, rather than the opening post. A row with missing metadata says “Author and
   time unavailable”; its latest-post action remains usable.
4. Toggle 125% text. Long sample titles/names wrap within the list.
5. At 390×844, click **Try a scrolled list**, open a visible title, enable 125%
   text while reading, and return. The same visible row/offset is restored after
   reflow. Enter also activates a focused title; Back is reachable in the reader.
6. Restore the normal viewport, 100% text and the empty reader for owner review.

Final manual browser observations are in the Git-ignored
`evidence/runs/thread-browsing-preview-2026-11-09/`, alongside screenshots, console
capture, source snapshots and a hash manifest. Verify it with
`npm run evidence:verify -- evidence/runs/thread-browsing-preview-2026-11-09`.

At 1280×720 the list is x=216, width=300 both before and after selection.
Across direct-pointer open, switch, close and latest-reply actions, scrollTop
remains 1558 and the first visible row remains `row-910008` at y=-113.453125
(its visible tail crosses the list's top edge). At 390×844, increasing text while
the list is hidden preserves that row at y=-96.2421875 before and y=-96.25 after
return; scrollTop adjusts from 1513 to 1712 for the larger rows. This is anchor
preservation, not a claim that raw scroll offsets stay identical after reflow.
The 300px list has no horizontal overflow at 125% text; the inspected narrow
reader fits, keyboard entry works, and captured console errors/warnings are empty.

Two preliminary observations remain separate from final evidence. Locator-driven
clicks scrolled the target before clicking; direct pointer clicks at already
visible controls confirmed the actual stable-layout behavior. A genuine preview
bug reset the hidden narrow list when text size changed. The repeated scenario
exposed it before repair; the preview now retains the visible row and offset
in memory and applies it when returning. This does not diagnose or repair the
production issue in comment 3.

No unit tests or production tests were added for this throwaway preview. Final
checks cover browser behavior, Prettier, extracted module syntax, whitespace and
evidence hashes. Available runtime is Node 26.0.0 / npm 11.12.1 / Vite 8.3.4, not
the pinned production qualification toolchain. No release/build/installed-host
acceptance is claimed.

## Advisor validation

The designated gpt-6.1-sol/xhigh advisor applied `validate-gpt-code-review` after
completion. It checked all seven comments and confirmed menu selection, production
source facts, preview isolation, seven screenshots, both observation sets and the
16-file evidence manifest. Verdict: pass for feedback capture and the bounded
comments 1–3 approval MVP, with no evidence-backed blocker, egregious technical
decision or additional distinct trade-off. It verified source/evidence rather
than independently repeating the live-page inspection or browser interactions.
All four preview-delivery criteria are verified. This review preceded the owner
approval recorded below; production implementation remains pending.

## Owner approval — 2026-11-09

The owner replied “ok” to “Does this fixed-column direction feel right for
comments 1–3?” after reviewing the MVP captured in commit `09d30ec`. Record this
as approval of that preview direction:

- A stable 300px desktop thread-list column with a reader placeholder before
  selection, using the displayed flat-row presentation.
- Latest-replier name and time, with an explicit unavailable fallback. Production
  values must come from the forum source.
- Preserve the visible list position while opening, switching and closing threads,
  including return to the narrow list after reflow.

The shared right-click/⋯ post menu including Reply remains approved separately.
Reader previews for comments 4–7 and the older compact Boards-filter suggestion
remain pending. This approval records the visual/interaction direction; it does
not establish a production fix, installed qualification or immediate ticket
publication. No new technical decision or trade-off is introduced.

The existing evidence package remains the historical capture of the reviewed
`09d30ec` preview; its pre-approval documentation is intentionally unchanged.

## Reader MVP continuation — comments 4–7

The owner requested the next approval unit. Its proposal, failure inventory,
actual trade-offs and verification are recorded in
[Reader controls approval MVP — comments 4–7](reader-feedback-mvp-2026-11-09.md).
It extends the same prototype via `?unit=reader`; comments 1–3 remain approved.
Comments 4–7 await visual/interaction approval. The shared ⋯ menu fallback remains
approved; limiting double-click Reply to empty post space is a pending assumption.
