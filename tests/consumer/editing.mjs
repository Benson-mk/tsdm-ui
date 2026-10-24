import editingAssert from "node:assert/strict";
import { URL as EditingURL, URLSearchParams as EditingParams } from "node:url";
import {
  createForumClient as createEditingClient,
  editBaseline as publicEditBaseline,
} from "@tsdm/forum-client";
const editingOrigin = "https://fixture.example";
const editingThreadURL = editingOrigin + "/forum.php?mod=viewthread&tid=42";
// Public clean-consumer acceptance seam, no private implementation imports.
// Failure inventory before contract update: a stale action union/missing edit
// methods could pass runtime packaging; source/metadata loss, wrong saved actor,
// missed conflicts or a repeated original attempt must not be accepted.
const editingCases = [];
{
  const state = {
    source: "[unknown]Complete editable source[/unknown] [attach]77[/attach]",
    description: "Existing reference",
    posts: [],
    reads: [],
  };
  const initial = state.source;
  const actor =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
  const board =
    '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
  const escaped = (s) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  const client = createEditingClient({
    origin: editingOrigin,
    transport: {
      async request(url, options) {
        const target = new EditingURL(url);
        if (options?.method === "POST") {
          const form = new EditingParams(options.body);
          state.posts.push(form);
          state.source = form.get("message");
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body: "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42&pid=101','Saved',{});</script>]]></root>",
          };
        }
        state.reads.push(url);
        const body =
          actor +
          board +
          (target.searchParams.get("action") === "edit"
            ? `<form id="postform" method="post" action="forum.php?mod=post&action=edit&fid=5&tid=42&pid=101&editsubmit=yes"><input type="hidden" name="formhash" value="AUTHORED-EDIT-SECRET"><input name="subject" value="Owned thread"><textarea name="message">${escaped(state.source)}</textarea><input name="price" value="3" disabled><select name="readperm" disabled><option value="10" selected>Members</option></select><input type="hidden" name="attachnew[77][description]" value="${escaped(state.description)}"><button type="submit" name="editsubmit" value="yes">Save</button></form>`
            : '<div id="postlist"><h1 id="thread_subject">Owned thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">Rendered body differs from complete source</div></div></div>');
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const prepared = await client.preparePostEdit(editingThreadURL, "101");
  editingAssert.equal(prepared.kind, "prepared");
  editingAssert.equal(prepared.prepared.source, initial);
  editingAssert.equal(prepared.prepared.action, "edit-post");
  const snapshot = publicEditBaseline(prepared.prepared);
  editingAssert.deepEqual(snapshot, prepared.prepared.editTarget.baseline);
  snapshot.source = "mutated consumer copy";
  editingAssert.equal(prepared.prepared.source, initial);
  editingAssert.equal(prepared.prepared.editTarget.postId, "101");
  editingAssert.deepEqual(prepared.prepared.uploadedReferences, ["77"]);
  const submission = {
    contextId: "portable-edit",
    revision: 2,
    writing: { ...prepared.prepared, source: initial + " local" },
  };
  state.source = initial + " server";
  const conflict = await client.prepareEditPublication(submission);
  editingAssert.equal(conflict.kind, "conflict");
  editingAssert.equal(conflict.latest.source, state.source);
  editingAssert.equal(state.posts.length, 0);
  submission.writing.editTarget = conflict.latest.editTarget;
  const ready = await client.prepareEditPublication(submission);
  editingAssert.equal(ready.kind, "ready");
  const attempt = {
    id: "portable-edit-attempt",
    publication: ready.publication,
    status: "pending",
    checked: false,
    message: "",
    candidateURL: null,
    result: null,
  };
  const saved = await client.savePostEdit(attempt);
  editingAssert.equal(saved.status, "confirmed");
  editingAssert.equal(saved.result.postId, "101");
  editingAssert.equal(saved.result.verification.stored, "verified");
  editingAssert.equal(state.posts.length, 1);
  editingAssert.equal(state.posts[0].get("message"), initial + " local");
  editingAssert.equal(state.posts[0].get("editsubmit"), "yes");
  editingAssert.equal(state.posts[0].has("topicsubmit"), false);
  editingAssert.equal(state.posts[0].has("price"), false);
  editingAssert.equal(
    state.posts[0].get("attachnew[77][description]"),
    "Existing reference",
  );
  const checked = await client.checkEditResult(
    JSON.parse(JSON.stringify(saved)),
  );
  editingAssert.equal(checked.status, "confirmed");
  editingAssert.equal(state.posts.length, 1);
  editingAssert.equal(
    JSON.stringify(checked).includes("AUTHORED-EDIT-SECRET"),
    false,
  );
  state.description = "Changed after save";
  const changed = await client.checkEditResult(saved);
  editingAssert.equal(changed.status, "confirmed");
  editingAssert.deepEqual(changed.result, saved.result);
  editingAssert.deepEqual(changed.publication, saved.publication);
  editingAssert.match(changed.message, /Previous stored confirmation retained/);
  editingAssert.match(changed.message, /unavailable or differ/);
  editingAssert.equal(state.posts.length, 1);
  editingCases.push({
    name: "owned-edit-complete-source-conflict-save-independent-readback-and-reference-change",
    status: "passed",
    posts: 1,
    postId: "101",
  });
}
