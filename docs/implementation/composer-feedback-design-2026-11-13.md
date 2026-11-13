# Modern IM reply composer design interview — 2026-11-13

Branch: `feat/improve-ui-ux`. Capture the owner's writing-interface feedback for
later GitHub tickets and a single approval MVP. The individual choices below are
accepted; the owner confirmed the consolidated design with “yes” after Q15. This note
does not deliver or approve a composer MVP, change production, publish a ticket,
or approve the earlier board and reader previews.

## Request and interview scope

The owner selected the production Writing context at
`https://www.tsdm39.com/forum.php#workspace=67a19d89-6884-49b1-a925-5b92ec4d44d2`
and requested `grill-me` for the editing experience to feel like a modern IM.
The selected panel is an ordinary thread reply composer, with account/destination,
recovery, source-editor and publication controls. The browser annotation is page
evidence; the owner's comment and interview answers define the requested changes.

The invoked `grill-me` skill redirects to `grilling`. Its interview requires a
consolidated shared-understanding confirmation before acting on the design. This
file records the answers already given; it is not implementation of those answers.

## Accepted decisions

| Question                        | Owner's decision                                                                                                                                                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 — Scope                      | Start with ordinary thread replies. Existing-post editing and new-thread authoring are later work.                                                                                                                                                                                                       |
| Q2 — Compact layout             | Anchor a compact composer at the bottom of the thread reader, grow it as the owner types, and provide expansion for longer writing.                                                                                                                                                                      |
| Q3 — Editing                    | Use visual editing by default: bold, links and quotes appear formatted. Keep complete BBCode source available as an advanced option.                                                                                                                                                                     |
| Q4 — Expansion                  | Expand within the same reader column and leave some of the thread visible above.                                                                                                                                                                                                                         |
| Q5 — Thread switching           | Keep unfinished writing attached to its thread and restore it when returning.                                                                                                                                                                                                                            |
| Q6 — Publication                | One explicit Send action publishes an ordinary reply; Preview is optional. Retain account checks, duplicate-send protection and recovery.                                                                                                                                                                |
| Q7 — Tools                      | Put images/attachments, emoji, formatting and BBCode under a + control, without a permanent formatting toolbar.                                                                                                                                                                                          |
| Q8 — Draft lifetime and sharing | Retain per-thread local drafts across browser restarts and share them across signed-in accounts. The owner explicitly rejected the proposed per-account separation: “we do not need to kept separate for each signed-in account, just share the Draft.” Show a small draft indicator in the thread list. |
| Q9 — Addressed replies          | Replying to another post in the same thread changes the target strip while preserving written text. Show target author and a short excerpt; removing the strip returns to a general thread reply. Inserting quoted text is a separate explicit action.                                                   |
| Q10 — Keyboard                  | In visual mode, Enter sends and Shift+Enter inserts a new line. Enter during IME composition only confirms input. In advanced BBCode mode, Enter inserts a new line and Ctrl/Cmd+Enter sends; show that mode's shortcut beside the action.                                                               |
| Q11 — Sender label              | Do not show the proposed sender avatar/name beside Send. The owner explicitly rejected that proposal: “we do not need it.”                                                                                                                                                                               |
| Q12 — Pending submission        | On Send, show the submitted reply in the thread as Sending…, clear the input and allow the next draft to be written. Retain the submitted text; only mark success after confirmation. Another send in that thread waits until the previous outcome is settled.                                           |
| Q13 — Failure and uncertainty   | Failed replies remain visible with Retry and Edit. Editing a failed reply preserves any newer unfinished writing. Unconfirmed replies offer Check status before retrying; retries remain deliberate.                                                                                                     |
| Q14 — Unavailable attachments   | Keep unavailable restored/shared attachments visible as chips with Reattach and Remove. Preserve message text and show the problem beside the attachment. Wait to send until that attachment is replaced or removed.                                                                                     |
| Q15 — Concurrent drafts         | If two tabs edit the same thread's draft incompatibly, retain both versions and let the owner choose which to continue. Ordinary switching restores automatically.                                                                                                                                       |

The design tree is now settled at the behavior level: reply scope → compact/expanded
visual authoring and tools; thread-local unfinished writing → durable shared content,
target retention and conflict handling; explicit Send → keyboard, pending feedback,
failure/uncertainty and attachment recovery. Pixel dimensions, implementation
structure and storage mechanism have not been selected by this interview.

“Local draft” in this note means retained unfinished writing, not the glossary's
server-owned **Forum draft**. Naming any new production model belongs to the later
domain/implementation work.

## Research and feasibility boundaries

Read-only research located `SourceWriting.vue` wrapping `PostEditor.vue`. Current
ordinary replies start compact, but the outer area is 324px with a 64px editor.
The workspace deliberately starts the editor in source mode even though the editor
supports visual mode. Expanded writing can currently become a side column; this
proposal instead keeps it within the reader column.

`writing.ts` currently owns one active writing context and separates preparation
from publication. Preparation fetches a fresh native form, validates the current
account/target/options and resolves selected mentions. Sending binds the exact
revision and account, acknowledges a pending attempt in recovery and uses a one-use
command. Later local writing remains independent of an already-dispatched attempt.
The current editor is editable during sending but does not automatically clear an
ordinary reply after success or uncertainty.

Complete source and literal quote content can be retained across account changes.
Upload ownership, prepared authority, permissions and historical attempts cannot
be reattributed. Existing copy-to-current-account handling already preserves source
and selection while preparing fresh current-account state and clearing known upload
references. Attachment tags can remain in text without establishing that the current
account can use them. Unuploaded file bytes currently exist only in memory.

Primary source locations:

- `src/components/SourceWriting.vue`: editor wrapper, keyboard, review and results.
- `src/components/PostEditor.vue`: visual/source editing and composition behavior.
- `src/layouts/WorkspaceLayout.vue`: compact/expanded placement and reply targeting.
- `src/workspace/writing.ts`: revision, replacement, account, attempt and recovery ownership.
- `src/forum-client/publish-thread.ts`: preparation and guarded publication.
- `src/forum-client/prepare-writing.ts` and `upload-authoring.ts`: attachment validity.
- `src/hosts/navigation.ts`: acknowledged page-session recovery storage.

The proposed UI is feasible to explore as an isolated simulation. Production
feasibility is based on source inspection, not completed integration or runtime
qualification. Retained writing, submitted snapshots and confirmed posts need
distinct states; the prototype must not imply that a pending reply is already a
confirmed forum post.

## Existing decisions affected

- [Issue #59](https://github.com/Benson-mk/tsdm-ui/issues/59) requires an opportunity
  to inspect frozen prepared content before confirming. [Issue #52](https://github.com/Benson-mk/tsdm-ui/issues/52)
  also requires renewed review after content changes. Q6 explicitly changes that
  ordinary-reply product policy. It does not authorize bypassing preparation,
  identity checks, revision binding or duplicate/uncertain-attempt handling.
- [ADR0001](../adr/0001-share-forum-workflows-across-layouts-and-hosts.md) assigns
  one tab-local writing context to the workspace. Q5 requires a design for retained
  per-thread writing alongside the active context. The forum client still owns
  consequential operation semantics.
- [ADR0003](../adr/0003-use-browser-page-session-recovery.md) deliberately uses
  account-bound page-session recovery, with no permanent draft collection or
  cross-tab synchronization guarantee. Q8 and Q15 request different retention,
  sharing and conflict behavior for unfinished writing. These are explicit product
  changes for the future design, not an undocumented localStorage fallback. Pending
  and historical operations remain bound to their original submitting account and
  are never automatically replayed.

No ADR, GitHub issue or production contract was rewritten during this interview.
No costly-to-reverse technical mechanism was selected, so the conditional advisor
requirement has not been triggered. A later storage/contract decision must be
evaluated under that requirement before implementation.

## Actual design trade-offs

Each distinct trade-off is recorded once here; these are accepted design choices,
not claims that the corresponding behavior is implemented.

1. Ordinary replies are the first unit, making one interaction reviewable while
   leaving new threads and edits outside this iteration.
2. A compact, growing composer preserves reading space at rest; longer text takes
   more vertical space. Expansion stays in the same column, reducing visible posts
   while preserving the writing position.
3. Visual editing makes formatted content easier to compose, but the implementation
   must preserve unsupported forum source and support an advanced BBCode path.
4. Secondary tools under + reduce persistent controls but take an extra action to
   reach, with lower discoverability than a permanent toolbar.
5. One-step Send removes the mandatory inspection step and speeds ordinary replies;
   optional Preview leaves that inspection to the author.
6. Per-thread drafts improve switching continuity but add retained-state ownership
   beyond today's single active writing context. Durable browser-local retention
   adds storage failure, restoration and lifecycle work beyond session recovery.
7. Account-shared content avoids separate drafts but can contain attachments or
   metadata that the current account cannot use; those require fresh validation
   and sometimes reattachment. Submitted attempts retain their original identity.
8. Omitting the sender label reduces composer detail but removes a nearby indication
   of which signed-in account will submit the shared text.
9. Retargeting preserves authored text but does not rewrite literal quotes already
   in it. Quoting is separate, adding an explicit action when a quoted body is wanted.
10. Enter-to-send speeds short replies and reserves Shift+Enter for new lines.
    BBCode mode deliberately keeps multiline-editing keys, so the send shortcut
    differs by mode and needs a visible hint. IME confirmation is never a send.
11. Immediate pending feedback allows the next draft to start sooner but introduces
    an unconfirmed item in the reader and a separate submitted snapshot. One
    unsettled send per thread can delay the next send even while typing continues.
12. Retained failure controls preserve recoverability but add visible result states
    and deliberate retry steps. Editing a failed submission must coexist with a
    newer draft; it cannot silently replace that draft.
13. Unavailable attachment chips preserve the author's intent but block publication
    until reattachment or removal, instead of silently dropping content.
14. Preserving both conflicting versions avoids silent loss but interrupts the
    author to choose which draft to continue.

## Verification of this capture task

Capture-task acceptance is separate from future MVP acceptance:

- [x] Map every Q1–Q15 answer, including the Q8/Q11 corrections, to this record.
- [x] Identify the existing review/recovery contracts affected without claiming production delivery.
- [x] Record the distinct trade-offs and pending consolidated confirmation.
- [x] Verify formatting, whitespace and a documentation-only scoped diff.

Verified by matching the table against the interview answers, checking the source
research and affected ADR/spec references, running Prettier on this note, and
inspecting its complete content and Git scope. No runtime tests apply to this
documentation-only capture; the proposed interactions have not yet been exercised.

The owner confirmed the consolidated design after this capture commit. The next
step is one isolated interactive composer MVP for visual approval, tracked in
[the delivery record](composer-mvp-2026-11-13.md).
Real posting, production integration and ticket publication are not delivered by
this capture task.
