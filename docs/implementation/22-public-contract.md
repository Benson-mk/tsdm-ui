# Public contract 0.6.0 — owned-post editing

The unpublished `@tsdm/forum-client` artifact advances from 0.5.0 to 0.6.0. The userscript remains independently versioned at 0.4.0. Pin the exact packed artifact or commit and reproducible inputs; no registry publication is implied.

Breaking compile-time changes:

- `PreparedWriting.action` adds `edit-post`. Exhaustive action consumers must handle it separately from creation and replies.
- `ForumClient` adds `preparePostEdit(threadURL, postId)`, `prepareEditPublication(submission)`, `savePostEdit(attempt)` and `checkEditResult(attempt)`. Structural implementations must supply these methods.
- `PublicationPreparationResult` adds `conflict`, with complete `latest` writing plus account/generation. Consumers must retain local source and present deliberate reload, manual reconciliation or warned overwrite. Updating a baseline must be an explicit user choice; it is not an atomic lock or automatic merge.

Optional `editTarget` carries selected thread/post identity and a serializable `WritingBaseline` of source/options/reference metadata. `titleAvailable: false` keeps a title-less reply distinct from an empty editable title. `attachmentFields` carry preservation-only metadata, not upload/replacement authority. Tokens and live controls stay private to fresh preparation. No forum-draft action applies to a published-post edit.

A confirmed result means independently observed saved actor, target, source, options and references. Moderation and uncertainty remain explicit. Checking a serialized attempt never repeats the edit. Recovered source needs current account/permission/source checks before saving; a snapshot does not authorize a write.

The clean external consumer installs only the packed public package, type-checks the expanded action/result/method contract without DOM libraries, and exercises complete source loading, conflict inspection, deliberate baseline adoption, one save, independent readback and changed-reference uncertainty. No private module imports or live forum writes are used.

`editBaseline(writing)` is now exported from the public entry and returns a deep copied `WritingBaseline` containing complete source and preservation metadata. Workspace consumes that same entry. The packed package includes `edit-post.d.ts` and its existing `types.d.ts` dependency; private subpath imports remain unsupported. Selected edit mentions resolve against the actual owned edit form and are revalidated before review/dispatch. Existing stored person URLs are preserved; transformation of a newly inserted edit marker into different server source remains explicitly uncertain until its edit-specific normalization is qualified.
