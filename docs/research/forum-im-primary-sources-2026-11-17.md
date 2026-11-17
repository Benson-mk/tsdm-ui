# Forum IM: primary-source design research

Research date: 2026-11-17 (Asia/Hong_Kong). This is supporting research for the
CPO audit, not a new product specification or implementation acceptance. The
recommendations below are explicitly inferences; competitor documentation proves
what those products describe, not what TSDM members need.

## Product premise

Make participation feel immediate while preserving a forum's durable topics,
source-backed destinations and reading context. Use the repository's vocabulary:
**Board → Thread → Post**; **Private conversation → Private message** remains a
separate destination. Discord's vocabulary is not a domain rename proposal.
The shared forum-client/workspace/layout/host boundaries remain controlling
([GLOSSARY](../../GLOSSARY.md), [ADR0001](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md)).

## What the primary sources support

| Source-backed finding                                                                                                                                                                                                                                                                                                                                                                                                                            | Inference for the TSDM audit                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android edge-to-edge draws backgrounds and scrolling content under system bars while protecting important text and controls with appropriate insets. Gesture regions and display cutouts need separate consideration. Pane protection should match that pane, and protections should not stack. [Android guidance](https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge)                                        | Fill the available browser canvas with the workspace. Inset critical controls, preserve comfortable text gutters, and verify the last post and Send remain reachable. This does not mean zero padding, an arbitrarily wide reading measure, or a universal scrim.                     |
| Discord describes forums as organized, persistent topic discussions. Its FAQ recommends list view for text discussions and gallery view for media; it offers title search and tags. Notifications can follow a specific forum post rather than every newly created topic. [Forum Channels FAQ](https://support.discord.com/hc/en-us/articles/6208479917079-Forum-Channels-FAQ)                                                                   | Keep the thread list as a useful index, with recognizable titles and activity information. IM immediacy should improve movement between topic and reply, not flatten all board activity into a single stream. Do not invent tags or follow capabilities absent from the forum source. |
| Discord lets people mute at server scope and override individual channel notification levels, including all activity, mentions and none. [Notifications Settings 101](https://support.discord.com/hc/en-us/articles/215253258-Notifications-Settings-101)                                                                                                                                                                                        | Distinguish passive freshness from activity that needs a member's attention. Do not turn each polling cycle into an alert. This supports examining status placement; it does not establish TSDM push-notification or unread authority.                                                |
| Reddit exposes joined communities through navigation, and search suggestions can navigate directly to communities or profiles before full search results. [Joined communities](https://support.reddithelp.com/hc/en-us/articles/28620705945620-Where-can-I-find-the-list-of-communities-I-ve-joined), [Search navigation](https://support.reddithelp.com/hc/en-us/articles/19695763291156-How-can-I-quickly-navigate-to-communities-with-search) | Distinguish returning to a known board from discovering a new topic. Evaluate whether existing board navigation, favorites and search answer those jobs clearly before proposing another navigation surface.                                                                          |
| Reddit's commenting guidance starts at the post or comment being answered, then opens a composer and requires an explicit submission. It documents recovering unfinished comment text, with stated media/lifetime limits. [Posting and commenting](https://support.reddithelp.com/hc/en-us/articles/360060422572-How-do-I-post-and-comment-on-Reddit)                                                                                            | Keep the reply destination understandable while composing; make resumption dependable and storage limitations truthful. Copying Reddit's draft cap or retention period would be an unsupported policy change.                                                                         |

Android describes a native application's control over system bars. A browser
userscript cannot infer the same authority over browser chrome, OS gestures or
keyboard behavior. Browser viewport/inset observations and physical-device
qualification remain distinct. The existing [browser-edge ledger](../implementation/92-browser-edges.md)
already covers this translation; this research does not establish new device
support.

## Accessibility sets the boundary of visual simplification

These are source-backed evaluation criteria, not a claim that the current build
passes or fails them. W3C Understanding documents explain the associated normative
success criteria; a complete WCAG conformance assessment requires broader work.

| Criterion                                                                                                                                                                                                                                                                                         | What to verify in this workspace                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Reflow, 1.4.10 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): ordinary vertically scrolling content fits a width equivalent to **320 CSS px** without losing information/function or needing two-dimensional reading. Necessary two-dimensional content has bounded exceptions. | Exercise the whole browse → read → reply → return journey at 320 CSS px, including menus and recovery. Keep native wide tables/media exceptions local where practical. A 390px screenshot alone is not this check.         |
| [Target size, 2.5.8 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): **24 × 24 CSS px**, with defined spacing, inline, equivalent-control and other exceptions. The enhanced criterion uses **44 × 44**.                                                              | Retain the project's stronger touch-target choices for primary controls. Measure hit areas and neighboring targets rather than icon artwork. Do not describe 44px as the universal AA floor.                               |
| [Focus not obscured, 2.4.11 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): keyboard-focused components cannot be entirely hidden by author-created content. Fully visible focus is a stronger design goal.                                                   | Traverse controls beneath sticky headers, the docked composer, drawers and dialogs. Test closing overlays and return focus. Small-viewport screenshots do not prove keyboard reachability.                                 |
| [Non-text contrast, 1.4.11 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): meaningful controls/states need **3:1** against adjacent colors, with specified exceptions. A control need not have a border when visible text/icon already identifies it.                  | Shadows can define depth without becoming the sole indication of selection or focus. Preserve functional field/selection/focus cues and forced-color behavior. Removing every line is not required by the design language. |
| [Text contrast, 1.4.3 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): ordinary text needs **4.5:1**, qualifying large text **3:1**, with stated exceptions.                                                                                                             | Reuse the supplied color scheme through its defined foreground/background roles. Check actual text pairings, including quiet metadata and pastel contexts; palette reuse alone does not establish contrast.                |

## Existing capability versus a new opportunity

The November 13 spec already asks for retained browsing anchors, compact list and
reply composition, progressive controls, explicit new-arrival reveal, local reply
drafts, and meaningful failures. These are not fresh recommendations
([original spec](../implementation/forum-im-ux-spec-2026-11-13.md)).

Later owner decisions supersede parts of that original text: expanded editing
temporarily occupies the full thread column; **Ctrl/Cmd+Enter sends in both editor
modes**, while Enter inserts a newline. The latest correction explicitly requires
documented shadows on individual thread rows
([#112 ledger](../implementation/ui-ux-112.md),
[thread-pane correction](../implementation/thread-pane-soft-controls.md)).
Do not propose reverting these as if a generic competitor convention outranked
the accepted direction.

The useful research question is therefore whether members can understand and use
the assembled experience, not whether a feature exists in source. Candidate
experiments for the parent audit are:

1. Ask a returning member to find a known board, open an active thread, inspect its
   latest reply and return to the same list position. Record wrong destinations
   and lost context, not only clicks.
2. Ask a member to reply to a specific post, expand editing, switch threads and
   return. Check whether they can explain the destination and recover their
   writing without coaching. Use inert/synthetic submission for research.
3. Present a new-arrival indication, a failed request and an uncertain send as
   separate cases. Check whether participants distinguish new content from a
   required action and know the next safe step.
4. Repeat the same tasks with keyboard input, enlarged text, narrow layout and
   forced colors. Preserve screenshots, observed focus/geometry and exact build
   identity. Participant comprehension and deterministic E2E correctness answer
   different questions; neither substitutes for the other.

These are research proposals. No participant sessions or application E2Es were
run by this source-research subtask, and no implementation has been changed.

## Distinct research trade-offs

1. **Documented patterns over a competitor UI survey.** Official product and
   accessibility sources provide attributable behavior and constraints. They do
   not reveal TSDM member preferences, actual competitor usability or every
   current experiment. Treat the resulting product recommendations as hypotheses.
2. **Transfer principles, retain forum semantics.** This avoids imposing
   unsupported ranking, subscriptions, realtime delivery or nested replies on the
   forum. It leaves potentially valuable new capabilities for separate evidence
   and product decisions.
3. **Bounded accessibility focus.** Reflow, targets, focus and contrast directly
   constrain this visual direction and yield actionable checks. This scoped
   research is not a complete accessibility audit or conformance certificate.

No storage, server contract, architecture or other costly-to-reverse decision is
made here. Presentation and usability experiments remain reversible. The parent
audit owns additional, distinct product trade-offs rather than duplicating these.

## Source retrieval and limits

Android and W3C pages were retrieved directly on the research date. Discord and
Reddit help-page HTML returned a browser challenge; their public Zendesk article
JSON supplied the article body, title and canonical URL. For example,
`https://support.discord.com/api/v2/help_center/en-us/articles/6208479917079.json`
and
`https://support.reddithelp.com/api/v2/help_center/en-us/articles/360060422572.json`.
Canonical article links above were checked against those responses. An initially
guessed Reddit article ID resolved to an unrelated account-deletion article and
was excluded; a guessed product-blog URL returned a not-found page and was also
excluded. No claims rely on search snippets or those unsuccessful retrievals.

Historical implementation ledgers describe their own exact candidates and
qualification limits. Reading them is context, not a fresh replay or confirmation
of the parent audit's current runtime. No private forum content is included in
this document.
