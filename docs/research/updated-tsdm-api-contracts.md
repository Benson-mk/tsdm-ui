# Current client API evidence for the future TSDM UI

Date: 2026-10-16 (Asia/Hong_Kong). Evidence level: source inspection. This record informs product and architecture decisions; it does not qualify a deployed API, browser runtime, or finished user workflow.

The newer client provides a useful integration improvement: a small structured plugin API and a JSON envelope for existing forum pages. It does not establish a complete structured forum API, a new authentication system, or a replacement for the existing authoring forms. The first-release boundary should therefore be chosen by complete user journeys, not by the number of endpoints listed below.

## Source identity

The inspected release is `tsdm_client` **1.37.0+138**, commit `5e905448d83b420850fca39b69351ecbd2b4f021`. The package identifies `Carinoasd/tsdm_client` as upstream; source links here use the configured public fork, `Benson-mk/tsdm_client`. [Package metadata][package]

The available later reference, `48c2f1383d654d6ec5acbe8c38ddce286040a871`, declares **1.37.1+139**. A file-list comparison from the pinned release to that reference changes release documentation and newcomer-card rendering, but not the central API or the callers discussed here. This is a comparison of locally available Git objects, not verification of the latest published release or the deployed forum plugin. [Later package][later-package] [Comparison][comparison]

The experiment's dated knowledge synthesis was used as an index, then material claims were checked against executable client source and its first-party design/release notes. The experiment remains historical evidence, with its scope and acceptance status separate from the future build.

## Three interfaces, with different guarantees

| Interface | Inspected contract | What it means for the future UI |
| --- | --- | --- |
| Structured plugin actions | `GET plugin.php?id=tsdmapp:api&action=…`, returning UTF-8 JSON through the existing account's client | Some account state and plugin catalogs can be read without whole-page parsing. Optional deployment, per-action availability, session cookies, and rate limits still matter. |
| Page JSON | Add `tsdmapp=json` to a supported existing GET URL; return `document`, `head`, and selected structured fields | The payload is smaller in scope, but it still contains forum HTML. The client rebuilds a small document and uses existing parsers. Page permissions and side effects remain. |
| Legacy mobile JSON | Old `mobile=yes&tsdmapp=1` routes | The old notification API is documented as gone after Discuz X5. Its failure does not establish that the newer plugin API is absent. |

Sources: [central API][api], [page-mode design][page-design], [notification repository][notifications].

## Capability inventory

This table records what the pinned client consumes. It is not an exhaustive specification of the server plugin.

| Capability | Source-backed opportunity | Boundary that still needs deciding or proving |
| --- | --- | --- |
| Session status | `status` returns account identity and, since plugin 1.3.1, `formhash` | Guests may receive a hash. A token is not proof of login, and native cookie handling is not browser account-isolation evidence. |
| Notification polling | `notify` supplies notice/PM timing, unread announcements, and server time, letting the client skip three content-page requests when nothing is new | It is a polling gate, not full inbox content or a realtime messaging contract. Reading the notice page still marks notices read. |
| Check-in | `checkin` supplies installed/checked/open state; plugin 1.6.0 may also supply the form hash | The action itself still posts the existing check-in form. Older or incomplete API answers fall back to reading the page. |
| Boards and threads | Page JSON covers forum/thread reading; parsers preserve canonical thread metadata and post content | HTML parsing remains. Thread challenges and guest caches require different recovery even when both use `error: unknown`. |
| Private-message history | Full history requests use page JSON | The AJAX chat window remains XML/HTML, and PM sending remains a form POST. No realtime push guarantee was identified in this contract. |
| Favorites, search, profile, homepage | These callers request page JSON and decode it into existing parsers | Search still uses the forum's GET search submission, server-issued `searchid`, pagination, and rate limits. Favorites list support is not a new add/remove API. |
| Expanded pages in 1.37.0 | PM/public-message lists, public-message detail, notification target posts, poll cards, forum groups, and latest-thread search request page JSON | Release notes say these were supported by the described existing plugin; this research did not inspect current deployment. |
| Pages awaiting plugin 1.6.0 in the 1.37.0 notes | Notice lists, guides, own threads/replies, draft lists, friends and mention candidates request page JSON | A supporting client release does not prove server rollout. Older plugins return ordinary HTML to the same request. Draft-list JSON does not supply save/publish semantics. |
| Medals and titles | Actions consumed include `medals`, `titleshop`, `titles`, `titleexchange`, `mymedals`, `medalgrant`, and `titleissue` | Catalogs and returned forms do not make spending, exchanging, wearing, granting, or revoking read operations. Permission-restricted actions do not become available to ordinary members. |
| Replies and authoring | Existing repositories supply forum form contracts and response parsing | Reply/quote forms, BBCode, form hashes, target identity, moderation and stored-state verification remain relevant. The plugin does not establish a universal write endpoint. |

Sources: [check-in state and write][checkin], [notification gate/content fetching][notifications], [chat history][chat], [search][search], [release notes][changelog], [medal/title forms][medal-tools], [reply and PM writes][reply], [medal catalog][medals], [title shop][titleshop], [owned titles][titles].

## Contract details that can change an architecture decision

1. **Capability failure has more than one meaning.** The client distinguishes a missing/non-JSON or disabled plugin from an unavailable individual action, expired login, network failure, and HTTP 429. Its one-hour negative cache and bounded busy waits are client policies, not requirements for a browser implementation. Copying them indiscriminately could hide recovered capability or multiply requests. [API request policy][api]

2. **A JSON response can still be incomplete.** Empty bodies and objects without `document` must not become valid empty notification or draft lists. Otherwise a polling boundary may advance past unread content, or a missing page may be misclassified as logout. [Missing-page handling][missing-page]

3. **GET and JSON do not imply absence of effects.** The client explicitly records that loading the notice page marks notices read; the page is still processed normally before its output is repackaged. This matters for IM-style background previews and unread badges. The product needs to say when it intends to read content, not merely which HTTP method it uses. [Notification effects][notifications] [Page design][page-design]

4. **The content boundary remains important.** Returned `head` contains canonical links and may contain the `discuz_uid` script declaration. The future browser UI can extract required metadata as inert data; JSON packaging does not justify executing fetched scripts. This is an architecture implication of the inspected response shape, not a tested browser implementation. [Page design][page-design] [Decoder][decoder]

5. **Fallback should be based on content and route.** A challenged thread and a useful guest-cache thread may both report `error: unknown`. The client checks for post content before fetching ordinary HTML; permission-message responses are retained. Its native anti-theft implementation is evidence of a recovery requirement, not proof that the same implementation works in Tampermonkey or Tauri. [Content classification][missing-page]

6. **URLs retain forum meaning.** The JSON parameter belongs before the fragment, AJAX XML calls are left alone, redirects can determine the actual page, and search pagination uses a server-issued search ID. A new layout should not manufacture page positions from list counts or treat post identity as a chat sequence. [URL helper][decoder] [Search][search] [Notification target redirects][notifications]

7. **Account changes have operation consequences.** The 1.37.0 release notes prevent switching while replies or PMs are being sent, discard stale page results after switching, reload permissions and parameters for the new account, and preserve unsent content during reload. These are useful failure cases for any future model of account scope; they do not prove the browser's cookie mechanism. [Release notes][changelog]

8. **Successful HTTP responses are weaker than verified writes.** The medal/title repository explicitly says a success page is not proof that state changed and submits its write once. The future build still needs an explicit operation outcome and an appropriate readback before resending an uncertain write. [Form result and transport][medal-tools]

## What this research does not establish

- The plugin version currently deployed at the forum, which actions are enabled for each member, or whether page JSON is available on all required routes.
- Browser CORS behavior, current browser-cookie sharing, Tampermonkey redirect behavior, isolated saved accounts, Tauri cookie stores, mobile background delivery, or an API authentication token separate from forum sessions.
- Measured request/byte/parser savings for this future UI. Upstream architecture explains an opportunity; it is not a benchmark of a proposed browser adapter.
- Complete populated-account coverage. The first-party design notes say their test-site board rows differ from production and some production comparisons used empty favorites/titles/achievements. Equality of two empty parsed results does not prove useful workflow parity. [Upstream verification limits][page-design]
- A framework winner, a first-release feature list, or a commitment to inherit the experiment's older “Must” list.

If a proposed architecture depends on one of these unknowns, it needs a bounded follow-up investigation before the architecture is accepted. For the page-JSON opportunity, the smallest useful observable journey is a populated board → thread → next page/post anchor, including permission/error handling, with ordinary HTML and JSON compared for meaningful content, identity, links, request count, and transferred bytes. That would be a future experiment, not work performed by this research.

## Verification and repeatability

The research read pinned Git objects with `git show`, enumerated all references to `TsdmAppApi`, `withTsdmAppJson`, and the page decoder, inspected the central implementation and representative read/write callers, and compared the release with the available later reference. No checkout was changed, no Flutter suite was run, no browser was installed, and no live forum read or write was performed.

Upstream regression suites 191, 193, 194, 197, 199 and 205 provide inspectable scenarios for API absence, paired HTML/JSON, expanded pages, duplicate loads, missing content, fragments, challenge/cache distinction and check-in behavior. Their existence and assertions are source evidence; this record does not claim that they were executed here. [Regression tree][tests]

To reproduce the source comparison in a clone containing these commits:

```sh
git show 5e905448d83b420850fca39b69351ecbd2b4f021:lib/features/tsdmapp/tsdmapp_api.dart
git grep -n -e TsdmAppApi -e withTsdmAppJson -e tsdmAppPageDocument 5e905448d83b420850fca39b69351ecbd2b4f021 -- lib
git diff --name-only 5e905448d83b420850fca39b69351ecbd2b4f021..48c2f1383d654d6ec5acbe8c38ddce286040a871
```

## Research trade-offs

- Pinning an available release makes claims reproducible and avoids disturbing another checkout; the latest remote state and production deployment remain unverified.
- Checking executable callers and first-party notes gives stronger evidence than repeating the knowledge synthesis; it still describes the client side rather than an independently inspected server implementation.
- Inspecting sources without live requests avoids account/read-state effects and public-data handling; deployed behavior, browser compatibility, and performance remain unanswered.
- A capability matrix makes release discussion tractable; it is deliberately not a complete endpoint specification or a feature-priority decision.
- Retaining both JSON and HTML as evidence reflects the optional plugin and current client design; whether the future release must maintain both paths is still a product/architecture decision.
- The public record contains source links, route shapes, and field names rather than raw responses, credentials, user content, or session values; readers cannot use it as a live fixture set.

[package]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/pubspec.yaml#L1-L9
[later-package]: https://github.com/Benson-mk/tsdm_client/blob/48c2f1383d654d6ec5acbe8c38ddce286040a871/pubspec.yaml#L1-L9
[comparison]: https://github.com/Benson-mk/tsdm_client/compare/5e905448d83b420850fca39b69351ecbd2b4f021...48c2f1383d654d6ec5acbe8c38ddce286040a871
[api]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/tsdmapp/tsdmapp_api.dart#L11-L124
[decoder]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/tsdmapp/tsdmapp_api.dart#L195-L243
[missing-page]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/tsdmapp/tsdmapp_api.dart#L245-L280
[page-design]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/doc/spec-x5-features.md#L1461-L1502
[notifications]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/notification/repository/notification_repository.dart#L22-L205
[checkin]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/checkin/utils/do_checkin.dart#L24-L136
[chat]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/chat/repository/chat_repository.dart#L18-L54
[search]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/search/repository/search_repository.dart#L31-L118
[changelog]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/CHANGELOG.md#L9-L31
[medal-tools]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/medal_title_tools/repository/medal_title_tools_repository.dart#L10-L94
[reply]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/widgets/reply_bar/repository/reply_repository.dart#L81-L291
[medals]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/medal_center/models/medal_catalog.dart
[titleshop]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/title_shop/repository/title_shop_repository.dart
[titles]: https://github.com/Benson-mk/tsdm_client/blob/5e905448d83b420850fca39b69351ecbd2b4f021/lib/features/profile/repository/my_titles_repository.dart
[tests]: https://github.com/Benson-mk/tsdm_client/tree/5e905448d83b420850fca39b69351ecbd2b4f021/test/regression
