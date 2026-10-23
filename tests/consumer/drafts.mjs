import draftAssert from "node:assert/strict";
import { URL as DraftURL, URLSearchParams as DraftParams } from "node:url";
import { createForumClient as createDraftClient } from "@tsdm/forum-client";
const escapeDraft = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
// Clean packaged-client E2E. Failures: browser-only import, crossed operation,
// wrong actor, duplicate save, source mismatch and false publication while listed.
// Only the external forum transport is substituted; calls use public exports.
const draftCases = [];
{
  const draftOrigin = "https://fixture.example";
  const draftList =
    draftOrigin +
    "/home.php?mod=space&do=thread&view=me&type=thread&filter=save";
  const draftState = {
    saved: null,
    published: false,
    posts: [],
    requests: [],
    uploads: [],
  };
  const draftActor =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
  const draftForm = (edit) =>
    `${draftActor}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit&tid=42&pid=101&editsubmit=yes" : "newthread&topicsubmit=yes"}&fid=5"><input type="hidden" name="formhash" value="AUTHORED-TOKEN"><input type="hidden" name="save" id="postsave" value=""><input name="subject" value="${escapeDraft(edit ? (draftState.saved?.get("subject") ?? "") : "Portable draft")}"><textarea name="message">${escapeDraft(edit ? (draftState.saved?.get("message") ?? "") : "Complete portable source")}</textarea><input name="price" value="0"><button name="${edit ? "editsubmit" : "topicsubmit"}" value="true">Publish</button><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save</button></form>`;
  const draftClient = createDraftClient({
    origin: draftOrigin,
    transport: {
      async upload(url, fields, file) {
        draftState.uploads.push({ url, fields, name: file.name });
        throw new Error(
          "Draft uploads are outside ordinary attachment authoring",
        );
      },
      async request(url, request) {
        draftState.requests.push({ url, method: request?.method ?? "GET" });
        const target = new DraftURL(url);
        let body;
        if (request?.method === "POST") {
          const saved = new DraftParams(request.body);
          draftState.posts.push(saved);
          draftState.saved = saved;
          draftState.published = saved.get("save") !== "1";
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body: "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42','Stored',{});</script>]]></root>",
          };
        }
        if (target.pathname === "/home.php")
          body = `${draftActor}<a class="a" href="${draftList}">草稿箱</a><form id="delform"><table><tbody>${draftState.saved && !draftState.published ? '<tr><th><a href="forum.php?mod=viewthread&tid=42">Portable draft</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>' : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form>`;
        else if (target.searchParams.get("mod") === "post")
          body = draftForm(target.searchParams.get("action") === "edit");
        else
          body = `${draftActor}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><div id="postlist"><h1><span id="thread_subject">Portable draft</span>${draftState.published ? "" : '<span class="xg1">(草稿)</span>'}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101">1#</a><div class="pcb"><p>Stored portable body</p></div><div class="po"><div class="pob">${draftState.published ? "" : '<a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a>'}</div></div></div></div>`;
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const preparedDraft = await draftClient.prepareNewThread("5");
  draftAssert.equal(preparedDraft.kind, "prepared");
  const draftAttempt = {
    id: "portable-save",
    generation: draftClient.generation,
    submission: {
      contextId: "portable-draft-context",
      revision: 1,
      writing: preparedDraft.prepared,
    },
    status: "pending",
    message: "",
    result: null,
  };
  const supersededSave = await draftClient.prepareDraftSave({
    ...draftAttempt,
    id: "superseded-draft-save",
  });
  const preparedSave = await draftClient.prepareDraftSave(draftAttempt);
  draftAssert.equal(
    (await draftClient.saveDraft(supersededSave)).status,
    "not-sent",
    "A newer preparation invalidates the older same-context command",
  );
  draftAssert.equal(draftState.posts.length, 0);
  const savedDraft = await draftClient.saveDraft(preparedSave);
  draftAssert.equal(savedDraft.status, "confirmed");
  draftAssert.equal(savedDraft.result.threadId, "42");
  draftAssert.equal(draftState.published, false);
  draftAssert.equal(
    (await draftClient.saveDraft(draftAttempt)).status,
    "not-sent",
  );
  draftAssert.equal(draftState.posts.length, 1);
  const draftListing = await draftClient.readDrafts();
  draftAssert.equal(draftListing.kind, "drafts");
  const resumedDraft = await draftClient.resumeDraft(
    draftListing.drafts.rows[0],
    draftListing.account,
  );
  draftAssert.equal(resumedDraft.kind, "prepared");
  draftAssert.equal(resumedDraft.prepared.source, "Complete portable source");
  const beforeDraftAttachmentCalls = draftState.requests.length;
  const draftUpload = await draftClient.uploadAttachment(
    resumedDraft.prepared,
    { name: "note.txt", type: "text/plain", bytes: new Uint8Array([65]) },
    () => {},
    { aborted: false, addEventListener() {}, removeEventListener() {} },
  );
  draftAssert.equal(draftUpload.kind, "not-sent");
  draftAssert.equal(
    draftState.requests.length,
    beforeDraftAttachmentCalls,
    "Draft upload must refuse before preparing the wrong ordinary form",
  );
  const draftRemoval = await draftClient.removeUploadedAttachment(
    {
      ...resumedDraft.prepared,
      uploads: [
        {
          key: "existing:88",
          name: "Attachment 88",
          type: "",
          size: 0,
          loaded: 0,
          status: "associated",
          serverId: "88",
          message: "",
        },
      ],
    },
    "88",
  );
  draftAssert.equal(draftRemoval.kind, "not-sent");
  draftAssert.equal(
    draftState.requests.length,
    beforeDraftAttachmentCalls,
    "Draft removal must not call an ordinary form or effect endpoint",
  );
  draftAssert.deepEqual(draftState.uploads, []);

  const invalidCreation = await draftClient.prepareThreadPublication({
    contextId: "portable-draft-context",
    revision: 2,
    writing: resumedDraft.prepared,
  });
  draftAssert.equal(
    invalidCreation.kind,
    "validation",
    "Known draft must not be submitted as a new thread",
  );
  const publicationDraft = {
    ...draftAttempt,
    id: "portable-publish",
    operation: "publish",
    generation: draftClient.generation,
    submission: {
      ...draftAttempt.submission,
      revision: 2,
      writing: resumedDraft.prepared,
    },
  };
  draftAssert.equal(
    (await draftClient.saveDraft(publicationDraft)).status,
    "not-sent",
    "Publication command cannot be repurposed into save",
  );
  const publishedDraft = await draftClient.publishDraft(publicationDraft);
  draftAssert.equal(publishedDraft.status, "published");
  draftAssert.equal(
    publishedDraft.publishedURL,
    draftOrigin + "/forum.php?mod=viewthread&tid=42#pid101",
  );
  draftAssert.equal(draftState.posts.length, 2);
  draftAssert.equal(draftState.posts[1].get("save"), "");
  draftAssert.equal((await draftClient.readDrafts()).drafts.rows.length, 0);
  draftAssert.equal(
    JSON.parse(JSON.stringify(publishedDraft)).submission.writing.source,
    "Complete portable source",
  );
  // A retained or external caller-supplied URL must not redirect readback
  // away from the configured forum or contaminate the confirmed result URL.
  const requestsBeforeCheck = draftState.requests.length;
  const alteredURLAttempt = JSON.parse(JSON.stringify(publicationDraft));
  alteredURLAttempt.submission.writing.draft.url =
    "https://untrusted.example/forum.php?mod=viewthread&tid=42";
  const checkedURL = await draftClient.checkDraft(alteredURLAttempt);
  draftAssert.equal(checkedURL.status, "published");
  draftAssert.equal(
    checkedURL.publishedURL,
    draftOrigin + "/forum.php?mod=viewthread&tid=42#pid101",
    "Publication checks derive their result from the configured forum and numeric identity",
  );
  draftAssert.ok(
    draftState.requests
      .slice(requestsBeforeCheck)
      .every(({ url }) => new DraftURL(url).origin === draftOrigin),
    "Publication checks never request an external retained URL",
  );
  draftCases.push({
    name: "packaged-client same-record save/resume/publication and operation isolation",
    status: "passed",
    requests: draftState.requests,
    posts: draftState.posts.length,
  });
}
