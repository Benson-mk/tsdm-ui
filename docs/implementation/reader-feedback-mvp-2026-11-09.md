# Reader controls approval MVP — comments 4–7

Branch: `feat/improve-ui-ux`. Continue the approved comments 1–3 browsing preview
with one reader-focused MVP. Production implementation and ticket publication
remain later work. Use the prototype skill; keep the requested branch and one
focused proposal rather than three unrelated redesigns. The gpt-6.1-sol/xhigh
advisor using `validate-gpt-code-review` reviews the completed preview.

## Context and plan before implementation

The existing reader reserves a large block for Manual refresh, last-check time
and history boundaries. The page picker already owns qualified totals, but its
trigger shows only the current page. The post template exposes reply, author
filter and native post links. Rate/report capabilities are not represented by
the portable post model. Native post-number links can omit an exact post target;
production copying must qualify the permalink instead of copying that href blindly.

Extend `thread-browsing.prototype.html` in place, preserving its approved stable
list. Use the installed Vue/Reka primitives for post context/dropdown menus inside
the same ShadowRoot. A prototype Vue component owns the synthetic reader; it is
not imported by production. Native dialogs keep this approval demo small.

- **4:** Remove routine passive status from the reading surface. Thread options
  contains refresh mode. Only checking, new replies and failure/retry produce a
  compact inline strip. Page information carries boundary context. Scenarios are
  explicitly synthetic and do not poll the forum.
- **5:** Show `Page 1 / 3` using the sample's known total, and `Page 1 / ?` for the
  unknown-total scenario. Page changes require confirmation. Include a real
  current-page change, rather than a static label.
- **6:** Right-click and the approved ⋯ fallback share Reply, Show only this
  author's posts, Rate and Report. Author filtering affects the sample posts.
  Reply opens a local composer with its exact author/post target; it cannot send.
  Rate/report demonstrate the targeted menu entry and disclose their stub status.
  An optional question asks whether double-click should preserve word selection.
  Unless the owner chooses otherwise, double-click empty post space prepares a
  reply; text and interactive content retain their normal selection/actions.
- **7:** Post-number activation awaits a real clipboard write before showing a
  success toast. A selectable-link dialog handles refusal. Copy a reopenable local
  preview URL with thread, page and exact post ID; do not invent live forum links.
  The prototype footer identifies these as sample links. A labelled failure toggle
  exercises the fallback without misrepresenting it as a real permission refusal.

## Failure inventory

1. Quiet mode still reserves a blank status band, or hides failures/new-reply actions.
2. A status change displaces an already-visible reading anchor unnecessarily.
3. The displayed page or total is stale after paging/filtering/new sample replies;
   unknown totals are guessed from the largest offered page link.
4. Context and ⋯ menus disagree, escape/focus return fail, portals leave the shadow
   tree, or a narrow menu clips at the viewport edge.
5. Double-clicking text or a link starts an unwanted reply; right-clicking selected
   text prevents the normal copy/link context menu.
6. A reply targets another post or silently replaces existing writing on navigation.
7. Rate/report looks like a real submitted action or causes any forum request.
8. Copy reports success before completion, copies only a thread URL, or its sample
   link fails to reopen the exact post. A failure must offer copyable text.
9. Enlarged/narrow controls overflow, status hides the composer, or approved list
   continuity is lost while the reader changes.

## Trade-offs to evaluate

Record actual choices and verification after the preview is complete. Owner
approval of comments 4–7 remains pending; the already-approved post-menu fallback
does not approve every detail of this new reader presentation.

## Acceptance for preview delivery

- [x] Present quiet/actionable status and known/unknown current-total paging.
- [x] Exercise shared post menus, author filtering and targeted local reply access.
- [x] Verify real copy success/readback/reopen and the labelled failure fallback.
- [x] Inspect desktop/narrow/enlarged layouts and preserve approved list continuity.
- [x] Retain replayable evidence, pass relevant static checks and complete advisor review.

## Delivered proposal

The reader now extends the approved browsing preview. Open
`http://127.0.0.1:5173/src/layouts/thread-browsing.prototype.html?unit=reader`
after `npm run dev -- --port 5173`. The original URL still starts with the empty
reader. All reader files are explicitly named prototypes and remain outside the
production import graph.

- Quiet reading has no history/status band. Thread options owns manual/automatic
  mode and a check action. A 52px inline strip carries checking/cancel, failure/retry
  or new-reply/show actions. At the beginning of a page it inserts above the first
  post; while scrolled, the preview compensates the scroll to preserve the visible
  post position. The page footer identifies a known end; unknown totals do not.
- The page button displays current/total, with a confirmed Go/Cancel picker.
  Unknown total displays `?` while allowing the offered sample pages. Author
  filtering changes both the actual sample posts and the known page total.
- Right-click and ⋯ share Reply, Show only this author's posts, Rate and Report.
  Reply opens a local writing context with the exact thread/author/post destination.
  Existing nonempty writing survives thread switching and cannot be silently
  retargeted. Rate/report open explicitly labelled placement previews only.
- In the absence of an answer to the optional gesture question, double-click
  **empty post space** prepares a reply; text and links retain selection/activation.
  Selected-text and link right-clicks do not open the custom menu. The approved ⋯
  access remains available without a pointer gesture.
- Post numbers copy a sample permalink and show a five-second toast only after
  clipboard success. The link reopens the exact sample post, including a newly
  revealed post. Simulated failure offers a focused, fully selected readonly URL.
  The scenario panel has an explicit clipboard readback check; it only displays
  text when the clipboard still matches a link copied by this preview.

## Actual trade-offs

1. Passive refresh/history text moves into options and the page footer, reducing
   reading clutter but requiring an extra action to inspect refresh mode. An
   actionable strip takes 52px when needed and shifts the first post at page top;
   keeping it visible is preferable to compensating it out of view. Mid-read
   position is preserved within the scroller's normal bounds.
2. Current/total uses `?` for unknown totals instead of suggesting a false number.
   Confirmed Go/Cancel adds an action but prevents an exploratory page choice from
   immediately navigating. The sample uses three posts per page solely to make
   this behavior quick to inspect.
3. Moving post actions into a shared menu keeps posts cleaner but makes commands
   less immediately visible. The already-approved ⋯ and Reply menu entry add a
   small visible control in exchange for keyboard/touch access. Double-click is
   limited to empty space to preserve text selection; it is less discoverable
   than double-clicking anywhere, and remains an owner-review assumption.
4. One in-memory writing context survives navigation and refuses retargeting while
   nonempty. That protects sample writing but requires discarding it before a
   different reply and offers no reload recovery or actual sending.
5. The isolated synthetic unit can demonstrate interaction without forum effects,
   but polling, rate/report capability discovery, real forms, source totals and
   production permalink qualification remain unimplemented. Copied links are
   local sample links, not forum links. Scenario changes affect the reader only;
   the browsing list remains its frozen sample snapshot. Normal interactions do
   not maintain a production URL/history model; copied links encode their target.
6. Reusing installed Vue/Reka for focus-aware menus and portals adds a small
   component/CSS integration to the prior HTML prototype, while avoiding a custom
   menu implementation. Native dialogs keep this preview bounded, but do not
   qualify production overlay behavior or every assistive technology. Shared CSS
   provides visual consistency while making source snapshots necessary for replay.
7. Manual end-to-end browser checks with screenshots, observations and hashes suit
   this throwaway approval unit and the prototype skill's no-test default. They
   are repeatable through the steps below but are not an automated regression
   suite, physical-touch qualification or release acceptance. No unit tests were
   added after implementation. The available Node 26.0.0/npm 11.12.1 runtime is
   distinct from the pinned production toolchain.

8. Show replies clears an active author filter so every sample arrival appears;
   copied post links also reopen the unfiltered sample page. That gives a clear
   destination but does not preserve the prior author-filter context. This is a
   preview choice awaiting owner judgment, not a production navigation decision.
9. A five-second toast communicates copy success or a reply-target guard without
   inserting another layout row. It briefly overlays the lower reading/composition
   area (including the textarea in the writing-preservation screenshot); it does
   not intercept pointer input. The message disappears automatically, so it is
   less persistent than inline feedback. Toast placement remains reviewable.

## Replay and observations

Evidence is retained in the Git-ignored directory
`evidence/runs/reader-feedback-preview-2026-11-09/`: screenshots, observations,
clipboard readback, console capture, source snapshots, report and SHA-256 manifest.
Run `npm run evidence:verify -- evidence/runs/reader-feedback-preview-2026-11-09`.

1. Open the reader URL. Inspect quiet reading, `Page 1 / 3` and the absence of a
   status band. Open the page picker, select 2 and Cancel: still page 1. Repeat
   with Go: page 2 contains posts 4–6. Under Preview scenarios, enable Unknown page
   total: the label and picker show `?`; the offered pages still navigate.
2. Open ⋯ with Enter, Escape to return focus, or right-click empty post space.
   Both menus have the same four actions. Filter the first author: posts 1, 4, 7
   appear with `Page 1 / 1`; Show all authors restores the unfiltered pages.
   Rate/Report name the selected post and cannot submit.
3. Reply through the menu, type sample writing, switch to another thread and try
   Reply again. The original text and destination survive; a toast explains the
   guard. Discard, then double-click empty post space: a correctly targeted composer
   opens and receives focus. Double-click post text selects text without replying;
   link double-click retains its sample link action. Right-clicking selected text
   or a link does not open the custom menu.
4. Activate a post number. The toast follows a real successful clipboard promise.
   Open Preview scenarios and Check copied sample link for actual clipboard
   readback, then open that returned URL. The target post is outlined on its page.
   Simulate copy failure and copy again: no success toast, a fully selected local
   link is available. The failure is explicitly injected, not an actual denied
   permission. The tool's virtual clipboard did not mirror the browser clipboard;
   the explicit in-page readback check verified the actual browser clipboard.
5. Exercise Checking → Cancel and Check failed → Retry. New replies → Show replies
   reveals posts 10–11 on `Page 4 / 4`. Post 10's copied link includes the sample
   expanded-data flag and reopens that exact post. Thread options changes the
   simulated manual/automatic mode; no polling occurs.
6. Scroll within the reader, then change quiet → failed → quiet. In retained
   observations, post 3 stays at y=327.3984375 while scrollTop changes
   319.5 → 371.5 → 319.5 for the 52px strip. At page top the strip remains visible.
7. Try a scrolled list, directly click visible titles 910009 then 910010, and close
   the reader. At desktop size the list remains 300px wide, x=216, scrollTop=1558,
   with first visible row 910008 across all three actions. Direct pointer clicks
   avoid locator auto-scroll changing the list before the action being checked.
8. At 390×844, repeat scrolled-list/open, enable 125% text, open the post menu and
   return. The reader fits without page overflow; the menu spans x=111 to 374.30,
   within the viewport. Row 910008 is still the visible anchor on return and the
   offset adjusts 1513 → 1712 for enlarged rows. The viewport is restored afterward.

Two prototype defects found during exploration were repaired: the menu's delayed
focus restoration initially stole focus back from the new composer, and native
word selection in empty space initially suppressed double-click Reply. Menu action
execution now uses its close-focus event; the explicit empty-space target is
nonselectable and text/header controls are excluded from the shortcut. Final
observations demonstrate both repairs. Preliminary entries remain in the same
observation log under their original names, and are not used as final pass evidence.

`npm run typecheck`, changed-component ESLint, changed-file Prettier, extracted
HTML module syntax and whitespace checks passed. The captured application warning
and error log is empty. Browser checks use the local IAB preview, not the installed
userscript or live forum. Owner approval remains pending; no ticket was published.

## Final advisor validation

The designated gpt-6.1-sol/xhigh BDFL advisor applied `validate-gpt-code-review`
after implementation and verification. Verdict: pass for the comments 4–7
approval MVP, with no evidence-backed blocker or egregious technical decision.
It inspected all 12 screenshots and 45 observation entries, verified source
snapshots and reran the 25-file manifest verifier. It checked the source/evidence
rather than independently repeating active browser interactions. Its two
additional distinct trade-offs—author-filter context and toast overlay—are
recorded above. All five preview-delivery acceptance criteria are verified.
Owner design approval and production acceptance remain pending.
