# Whole-branch review failure inventory

Reviewed base:6499374eb53bf1b209d38c73a7f29bcdb6875a25; executablea145869f7d5b8a5f87cb45b32e597d610de396a5d27d5ceae5ed089c2246ce84. Parent#81story7/decision4requires truthful member/guest/unknown/restored footer wording. The Spec review raises oneP2; Standards raises none. This ledger is separate from accepted historical#93qualification.

Before production edits, enumerate reachable failures:

1. An unknown-account board check deliberately retains public rows but can leave the footer claiming the prior member.
2. An unknown newest-thread check similarly retains public posts while fresh identity is unconfirmed.
3. After passive reload, snapshot wording is correct only until a fresh accepted account observation; unknown must not keep the old snapshot/member label.
4. A confirmed guest or different member check can clear mismatched public results; the footer must still reflect that fresh observation rather than become stale/unknown solely because content was cleared.
5. A later explicit confirmed read must restore current member wording. No check may synthesize a name from an ID or infer identity from retained public content.

Named full-application expectations cover board unknown/guest/other-member responses with fresh/restored starting states and subsequent confirmedRefresh/Reload; newest-thread unknown responses also cover fresh/restored states and deliberate confirmedRefresh. Browser routes replace only externalHTTP, exact public retention and request counts remain asserted. No unit test, internal state injection, persistence change or social write is introduced. Production remains unchanged until these expectations reproduce the finding.

## Adjacent restored-warning finding (before warning edits)

Advisor examination of installedcddshows a fresh signed-in footer beside a global restored warning claiming account and content have not been rechecked. The account key is non-null after a scoped check, while retained snapshot content intentionally remains stale. Failure-first additions distinguish passive null (keep original account+content warning), accepted unknown (footer unconfirmed; content-only snapshot warning), accepted same-member scoped check (fresh member; content-only snapshot warning), and full explicit re-read (remove obsolete restored warning). Existing guest/other-member invalidation semantics remain. Three interface locales must render the new content-only wording from normal Settings changes. No state/HTTP/persistence behavior changes are planned.
