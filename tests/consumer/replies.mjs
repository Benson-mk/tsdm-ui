import frontierAssert from "node:assert/strict";
import {
  URL as FrontierURL,
  URLSearchParams as FrontierParams,
} from "node:url";
import { createForumClient as createFrontierClient } from "@tsdm/forum-client";

// Pre-code failure inventory: docs/implementation/21-native-comparison.md.
// Public package only. Authored forum transport; no private parser/UI imports.
const replyCases = [];
const frontierOrigin = "https://fixture.example";
const frontierActor =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
const frontierBoard =
  '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
const frontierEscape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const frontierAttempt = (publication, id) => ({
  id,
  publication,
  status: "pending",
  checked: false,
  message: "",
  candidateURL: null,
  result: null,
});
const frontierRoundTrip = (value) =>
  frontierAssert.deepEqual(JSON.parse(JSON.stringify(value)), value);

{
  const source =
    "[unknown]完整回覆 & literal <tag>[/unknown]\n[quote]Complete source quote[/quote]";
  const state = { posts: [], requests: [] };
  const form = (saved) =>
    frontierActor +
    frontierBoard +
    `<form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&pid=303" : "reply"}&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="AUTHORED-REPLY-SECRET"><input name="subject" value=""><textarea name="message">${frontierEscape(saved?.get("message") ?? "")}</textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;
  const client = createFrontierClient({
    origin: frontierOrigin,
    transport: {
      async request(url, request) {
        const target = new FrontierURL(url);
        state.requests.push({ url, method: request?.method ?? "GET" });
        if (request?.method === "POST") {
          state.posts.push(new FrontierParams(request.body));
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body: "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42&pid=303&page=1#pid303','Reply accepted',{});</script>]]></root>",
          };
        }
        const body =
          target.searchParams.get("mod") === "post"
            ? form(
                target.searchParams.get("action") === "edit"
                  ? state.posts.at(-1)
                  : undefined,
              )
            : frontierActor +
              frontierBoard +
              '<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101">1#</a><div class="pcb"><p>Existing body</p></div></div>' +
              (state.posts.length
                ? '<div id="post_303"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum303">2#</a><div class="pcb"><p>Stored reply</p></div></div>'
                : "") +
              "</div>";
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const prepared = await client.prepareReply("5", {
    threadId: "42",
    postId: null,
    author: "",
    authorId: null,
  });
  frontierAssert.equal(prepared.kind, "prepared");
  frontierRoundTrip(prepared);
  const ready = await client.prepareThreadPublication({
    contextId: "portable-reply",
    revision: 1,
    writing: { ...prepared.prepared, source },
  });
  frontierAssert.equal(ready.kind, "ready");
  const saved = await client.publishThread(
    frontierAttempt(ready.publication, "portable-reply-attempt"),
  );
  frontierAssert.equal(saved.status, "confirmed");
  frontierAssert.equal(saved.result.postId, "303");
  frontierAssert.equal(state.posts.length, 1);
  frontierAssert.equal(state.posts[0].get("message"), source);
  frontierAssert.equal(state.posts[0].get("replysubmit"), "yes");
  frontierAssert.equal(state.posts[0].has("topicsubmit"), false);
  frontierAssert.equal(
    state.requests.some(
      ({ url }) =>
        new FrontierURL(url).searchParams.get("action") === "edit" &&
        new FrontierURL(url).searchParams.get("pid") === "303",
    ),
    true,
  );
  const checked = await client.checkThreadResult(
    JSON.parse(JSON.stringify(saved)),
  );
  frontierAssert.equal(checked.status, "confirmed");
  frontierAssert.equal(checked.id, saved.id);
  frontierAssert.equal(state.posts.length, 1);
  frontierRoundTrip(checked);
  frontierAssert.equal(
    JSON.stringify(checked).includes("AUTHORED-REPLY-SECRET"),
    false,
  );
  const readback = await client.readThread(saved.result.url);
  frontierAssert.equal(readback.kind, "thread");
  frontierAssert.equal(
    readback.thread.posts.find((post) => post.id === "303").authorId,
    "7",
  );
  frontierRoundTrip(readback);
  replyCases.push({
    name: "reply-public-prepare-send-source-readback-and-check",
    status: "passed",
    posts: state.posts.length,
    postId: checked.result.postId,
  });
}

{
  const source =
    "[unknown]完整回覆 & literal <tag>[/unknown]\n[quote]Complete source quote[/quote]";
  const state = { posts: [], requests: [], qualify: false };
  const prior = "Complete prior source";
  const merged =
    "Complete prior source\n\n[hr]\n[b]Writer 7 补充了以下内容 (2026-10-22 10:26)[/b]\n" +
    source;
  const form = (saved) =>
    frontierActor +
    frontierBoard +
    `<form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&pid=303" : "reply"}&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="AUTHORED-REPLY-SECRET"><input name="subject" value=""><textarea name="message">${frontierEscape(saved?.get("message") ?? "")}</textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;
  const client = createFrontierClient({
    origin: frontierOrigin,
    transport: {
      async request(url, request) {
        const target = new FrontierURL(url);
        state.requests.push({ url, method: request?.method ?? "GET" });
        if (request?.method === "POST") {
          state.posts.push(new FrontierParams(request.body));
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body: "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42&pid=303&page=1#pid303','Reply accepted',{});</script>]]></root>",
          };
        }
        const body =
          target.searchParams.get("mod") === "post"
            ? form(
                target.searchParams.get("action") === "edit"
                  ? new FrontierParams({
                      message: state.posts.length
                        ? state.qualify
                          ? merged
                          : "Unknown merge spelling"
                        : prior,
                    })
                  : undefined,
              )
            : frontierActor +
              frontierBoard +
              '<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101">1#</a><div class="pcb"><p>Existing body</p></div></div>' +
              (prior
                ? '<div id="post_303"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum303">2#</a><div class="pcb"><p>Stored reply</p></div></div>'
                : "") +
              "</div>";
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const prepared = await client.prepareReply("5", {
    threadId: "42",
    postId: null,
    author: "",
    authorId: null,
  });
  frontierAssert.equal(prepared.kind, "prepared");
  frontierRoundTrip(prepared);
  const ready = await client.prepareThreadPublication({
    contextId: "portable-reply",
    revision: 1,
    writing: { ...prepared.prepared, source },
  });
  frontierAssert.equal(ready.kind, "ready");
  const saved = await client.publishThread(
    frontierAttempt(ready.publication, "portable-reply-attempt"),
  );
  frontierAssert.equal(saved.status, "uncertain");
  const immutable = JSON.stringify(saved.publication);
  state.qualify = true;
  frontierAssert.equal(state.posts.length, 1);
  frontierAssert.equal(state.posts[0].get("message"), source);
  frontierAssert.equal(state.posts[0].get("replysubmit"), "yes");
  frontierAssert.equal(state.posts[0].has("topicsubmit"), false);
  frontierAssert.equal(
    state.requests.some(
      ({ url }) =>
        new FrontierURL(url).searchParams.get("action") === "edit" &&
        new FrontierURL(url).searchParams.get("pid") === "303",
    ),
    true,
  );
  const requestStart = state.requests.length;
  const checked = await client.checkThreadResult(
    JSON.parse(JSON.stringify(saved)),
  );
  frontierAssert.equal(checked.status, "confirmed");
  frontierAssert.equal(checked.id, saved.id);
  frontierAssert.equal(JSON.stringify(checked.publication), immutable);
  frontierAssert.equal(checked.replyComparison.before.source, prior);
  frontierAssert.equal(checked.replyComparison.observed.source, merged);
  frontierAssert.equal(
    state.requests.slice(requestStart).every((r) => r.method === "GET"),
    true,
  );
  frontierAssert.equal(state.posts.length, 1);
  frontierRoundTrip(checked);
  frontierAssert.equal(
    JSON.stringify(checked).includes("AUTHORED-REPLY-SECRET"),
    false,
  );
  const readback = await client.readThread(checked.result.url);
  frontierAssert.equal(readback.kind, "thread");
  frontierAssert.equal(
    readback.thread.posts.find((post) => post.id === "303").authorId,
    "7",
  );
  frontierRoundTrip(readback);
  replyCases.push({
    name: "reply-public-native-supplement-read-only-check",
    status: "passed",
    posts: state.posts.length,
    postId: checked.result.postId,
  });
}
