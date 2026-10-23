# Public draft contract — 0.7.0

The separately packed forum client advances from 0.6.0 to 0.7.0. The application/userscript remains 0.4.0. The `ForumClient` interface adds `readDrafts`, `resumeDraft`, `prepareDraftSave`, `saveDraft`, `publishDraft` and `checkDraft`; structural implementations must provide them. `PreparedWriting` adds optional `draftSaveAvailable` and `draft` identity/version. New serializable `DraftRow`, `DraftList`, `DraftListResult`, `DraftIdentity` and `DraftAttempt` types expose the lifecycle without browser or Vue dependencies. The existing action union remains unchanged.

Pin the exact artifact. Prepare a save read-only, acknowledge its immutable original submission and complete prior-list baseline, then consume that exact one-use attempt. A callback is only a candidate: list membership, native draft state, actor/board/post identity and complete saved source/options/reference metadata establish confirmation. Publication checks the original saved target and distinguishes published, remaining-draft, moderation and uncertainty.

A manual result check returns `checked: true`; it never resends. `resendOf` links a separately confirmed manual attempt to its retained original unknown attempt. Client applications must present the action, account, destination, current revision and duplicate/native-effect warning, then prepare afresh. Neither an empty list nor an HTTP callback proves an unknown save never happened. No automatic replay or atomic account isolation is promised.

Older retained attempts can omit `checked` and `resendOf`; absence never authorizes resending. Pending recovery becomes uncertain and resets checked status. Existing reference metadata is preserved; upload, association mutation and funded drafts remain separate contracts.

The clean external consumer first failed against version 0.6.0 after expecting 0.7.0, then passed using the new runtime constant, package metadata, declarations and ordinary draft public flows. It imports only the public entry and typechecks without DOM libraries.
