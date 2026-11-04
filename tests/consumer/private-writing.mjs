import privateAssert from "node:assert/strict";
import { URLSearchParams as PrivateParams } from "node:url";
import { createForumClient as createPrivateClient } from "@tsdm/forum-client";
const privateClone = (value) => JSON.parse(JSON.stringify(value));

const privateWritingCases = [];
{
  const pmOrigin = "https://fixture.example";
  const pmURL = pmOrigin + "/home.php?mod=space&do=pm&subop=view&touid=9";
  const composed = "Portable private 中文\nSecond line https://example.test/";
  const stored = [{ id: "101", sender: "7", source: composed }];
  const commands = [],
    acknowledgements = [];
  let readbackUnavailable = false;
  let beforeRead = null;
  const quote = (value) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const response = () =>
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Portable sender</a></strong></div><div id="ct"><div class="tbmu">With <a href="home.php?mod=space&uid=9">Portable recipient</a> <span id="membernum">' +
    stored.length +
    '</span></div><div id="pm_ul">' +
    stored
      .map(
        (m) =>
          '<dl id="pmlist_' +
          m.id +
          '"><dd class="avt"><a href="home.php?mod=space&uid=' +
          m.sender +
          '">Avatar</a></dd><dd class="ptm">Sender<br>\n' +
          quote(m.source).replaceAll("\n", "<br>\n") +
          '<br>\n<span class="xg1"><span title="2026-11-04 20:00">now</span></span></dd></dl>',
      )
      .join("") +
    '</div><form id="pmform" method="post" action="home.php?mod=spacecp&ac=pm&op=send&pmid=101&daterange=0&handlekey=pmsend&pmsubmit=yes"><textarea name="message"></textarea><input type="hidden" name="formhash" value="PORTABLE_PRIVATE_TOKEN"><input type="hidden" name="topmuid" value="9"><button name="pmsubmit" type="submit" value="true">Send</button></form></div>';
  const transport = {
    async request(url, options) {
      if (options?.method === "POST") {
        const fields = new PrivateParams(options.body);
        commands.push([...fields]);
        stored.push({
          id: String(203 + commands.length - 1),
          sender: "7",
          source: fields.get("message").replaceAll("\r\n", "\n"),
        });
        return {
          url,
          status: 200,
          contentType: "text/html",
          body: "Callback cannot confirm storage",
        };
      }
      if (beforeRead) await beforeRead();
      if (readbackUnavailable && commands.length)
        throw new Error("Authored independent read failure");
      return {
        url,
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ uid: 7, document: response() }),
      };
    },
  };
  const pmClient = createPrivateClient({ origin: pmOrigin, transport });
  const prepared = await pmClient.preparePrivateWriting(pmURL, {
    kind: "member",
    id: "7",
    name: "Portable sender",
  });
  privateAssert.equal(prepared.kind, "prepared");
  const submission = {
    contextId: "portable-context",
    revision: 1,
    writing: { ...prepared.prepared, source: composed },
  };
  const ready = await pmClient.preparePrivateReview(submission);
  privateAssert.equal(ready.kind, "ready");
  privateAssert.equal(
    JSON.stringify(ready).includes("PORTABLE_PRIVATE_TOKEN"),
    false,
  );
  const pending = {
    id: "portable-attempt",
    submission: ready.review.submission,
    before: [],
    status: "pending",
    checked: false,
    message: "Pending",
    result: null,
  };
  const retain = async (value) => {
    acknowledgements.push(privateClone(value));
    return true;
  };
  const outcomes = await Promise.all([
    pmClient.sendPrivateMessage(ready.review, pending, retain),
    pmClient.sendPrivateMessage(ready.review, pending, retain),
  ]);
  privateAssert.deepEqual(
    outcomes.map((x) => x.status),
    ["confirmed", "not-sent"],
  );
  privateAssert.equal(commands.length, 1);
  privateAssert.deepEqual(commands[0], [
    ["message", "Portable private 中文\r\nSecond line https://example.test/"],
    ["formhash", "PORTABLE_PRIVATE_TOKEN"],
    ["topmuid", "9"],
  ]);
  privateAssert.deepEqual(acknowledgements[0].before, ["101"]);
  privateAssert.equal(
    JSON.stringify(acknowledgements).includes("PORTABLE_PRIVATE_TOKEN"),
    false,
  );
  privateAssert.equal(
    JSON.stringify(acknowledgements).includes('"review"'),
    false,
  );
  privateAssert.equal(outcomes[0].result.messageId, "203");
  privateAssert.equal(outcomes[0].result.source, composed);
  privateAssert.equal(outcomes[0].result.recipientId, "9");
  privateWritingCases.push(
    "one-use approval, acknowledged original attempt, prior identical message excluded and exact independent readback",
  );

  const next = {
    ...submission,
    revision: 2,
    writing: { ...submission.writing, source: "Later private text" },
  };
  const nextReview = await pmClient.preparePrivateReview(next);
  privateAssert.equal(nextReview.kind, "ready");
  const nextAttempt = { ...pending, id: "refused-storage", submission: next };
  const refused = await pmClient.sendPrivateMessage(
    nextReview.review,
    nextAttempt,
    async () => false,
  );
  privateAssert.equal(refused.status, "not-sent");
  privateAssert.deepEqual(await pmClient.checkPrivateMessage(refused), refused);
  privateAssert.equal(commands.length, 1);
  const reused = await pmClient.sendPrivateMessage(
    nextReview.review,
    nextAttempt,
    retain,
  );
  privateAssert.equal(reused.status, "not-sent");
  privateWritingCases.push(
    "storage refusal consumes approval and cannot replay",
  );

  const finalReview = await pmClient.preparePrivateReview(next);
  privateAssert.equal(finalReview.kind, "ready");
  const finalAttempt = {
    ...pending,
    id: "uncertain-portable",
    submission: next,
  };
  const uncertain = await pmClient.sendPrivateMessage(
    finalReview.review,
    finalAttempt,
    async (value) => {
      acknowledgements.push(privateClone(value));
      readbackUnavailable = true;
      return true;
    },
  );
  privateAssert.equal(uncertain.status, "uncertain");
  const recovered = JSON.parse(JSON.stringify(uncertain));
  readbackUnavailable = false;
  const restarted = createPrivateClient({ origin: pmOrigin, transport });
  const checked = await restarted.checkPrivateMessage(recovered);
  privateAssert.equal(checked.status, "confirmed");
  privateAssert.deepEqual(checked.submission, next);
  privateAssert.equal(checked.id, "uncertain-portable");
  privateAssert.equal(commands.length, 2);
  const stale = await restarted.sendPrivateMessage(
    finalReview.review,
    { ...recovered, status: "pending" },
    retain,
  );
  privateAssert.equal(stale.status, "not-sent");
  privateAssert.equal(commands.length, 2);
  privateWritingCases.push(
    "serialized uncertain attempt independently checked after restart, with no command replay",
  );
  const priorReview = await pmClient.preparePrivateReview({
    ...next,
    revision: 3,
  });
  privateAssert.equal(priorReview.kind, "ready");
  const invalidReview = await pmClient.preparePrivateReview({
    ...next,
    revision: 4,
    writing: { ...next.writing, source: "" },
  });
  privateAssert.equal(invalidReview.kind, "refused");
  const staleAfterRefusal = await pmClient.sendPrivateMessage(
    priorReview.review,
    {
      ...pending,
      id: "invalidated-review",
      submission: priorReview.review.submission,
    },
    retain,
  );
  privateAssert.equal(staleAfterRefusal.status, "not-sent");
  privateAssert.equal(commands.length, 2);
  privateWritingCases.push(
    "new refused preparation invalidates the older private approval",
  );
  let releaseRead;
  let observeRead;
  const enteredRead = new Promise((resolve) => {
    observeRead = resolve;
  });
  const blockedRead = new Promise((resolve) => {
    releaseRead = resolve;
  });
  beforeRead = async () => {
    beforeRead = null;
    observeRead();
    await blockedRead;
  };
  const delayedReview = pmClient.preparePrivateReview({ ...next, revision: 5 });
  await enteredRead;
  const newerRefusal = await pmClient.preparePrivateReview({
    ...next,
    revision: 6,
    writing: { ...next.writing, source: "" },
  });
  privateAssert.equal(newerRefusal.kind, "refused");
  releaseRead();
  privateAssert.equal((await delayedReview).kind, "refused");
  privateWritingCases.push(
    "a delayed older preparation cannot revive approval after a newer refusal",
  );

  const sendingReview = await pmClient.preparePrivateReview(next);
  privateAssert.equal(sendingReview.kind, "ready");
  const replacedDuringRetention = await pmClient.sendPrivateMessage(
    sendingReview.review,
    {
      ...pending,
      id: "replaced-during-retention",
      submission: sendingReview.review.submission,
    },
    async () => {
      const replacement = await pmClient.preparePrivateWriting(
        pmURL,
        next.writing.account,
      );
      privateAssert.equal(replacement.kind, "prepared");
      return true;
    },
  );
  privateAssert.equal(replacedDuringRetention.status, "not-sent");
  privateAssert.equal(commands.length, 2);
  privateWritingCases.push(
    "a new private context preparation invalidates a send still awaiting recovery",
  );
  let releaseMutation, observeMutation;
  const mutationEntered = new Promise((resolve) => {
    observeMutation = resolve;
  });
  const mutationBlocked = new Promise((resolve) => {
    releaseMutation = resolve;
  });
  beforeRead = async () => {
    beforeRead = null;
    observeMutation();
    await mutationBlocked;
  };
  const mutable = {
    ...next,
    revision: 7,
    writing: { ...next.writing, source: "Initial plain source" },
  };
  const mutatingReview = pmClient.preparePrivateReview(mutable);
  await mutationEntered;
  mutable.writing.source = "[b]Unqualified private formatting[/b]";
  releaseMutation();
  const mutationResult = await mutatingReview;
  privateAssert.equal(mutationResult.kind, "ready");
  privateAssert.equal(
    mutationResult.review.submission.writing.source,
    "Initial plain source",
  );
  privateWritingCases.push(
    "mutable caller input cannot change the private snapshot after validation begins",
  );
}
