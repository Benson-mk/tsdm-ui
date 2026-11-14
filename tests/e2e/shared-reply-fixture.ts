export const origin = "https://www.tsdm39.com";
export const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
export const threadURL = (id: string) =>
  `${origin}/forum.php?mod=viewthread&tid=${id}`;
const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export function createSharedReplyFixture() {
  return {
    member: "7",
    refusedReply: false,
    attachmentFieldsMissing: false,
    mentionGate: null as Promise<void> | null,
    saved: new Map<string, URLSearchParams>(),
    savedActors: new Map<string, string>(),
    postGate: null as Promise<void> | null,
    uploadGate: null as Promise<void> | null,
    removalGate: null as Promise<void> | null,
    uploaded: false,
    nextUploadId: 88,
    nextReferenceKind: "attach" as "attach" | "attachimg",
    uploads: new Map<string, "attach" | "attachimg">(),
    gate: null as { thread: string; promise: Promise<void> } | null,
    requests: [] as { url: string; method: string; body: string | null }[],
  };
}
export async function renderSharedReplyResponse(
  state: ReturnType<typeof createSharedReplyFixture>,
  request: { url: string; method: string; body: string | null },
) {
  const url = new URL(request.url);
  state.requests.push({
    url: url.href,
    method: request.method,
    body: request.body,
  });
  if (url.pathname === "/plugin.php") {
    if (state.mentionGate) await state.mentionGate;
    return {
      contentType: "application/json",
      body: JSON.stringify({
        ok: 1,
        list: [{ uid: 6, username: "Other author" }],
      }),
    };
  }
  if (url.pathname === "/misc.php") {
    if (state.uploadGate) await state.uploadGate;
    state.uploaded = true;
    const id = String(state.nextUploadId++);
    state.uploads.set(id, state.nextReferenceKind);
    return { contentType: "text/plain", body: id };
  }
  if (url.searchParams.get("action") === "deleteattach") {
    if (state.removalGate) await state.removalGate;
    state.uploaded = false;
    return {
      contentType: "text/xml",
      body: "<root><![CDATA[]]></root>",
    };
  }
  if (url.searchParams.get("action") === "attachlist") {
    const id = url.searchParams.get("aids") ?? "";
    const kind = state.uploads.get(id);
    return {
      contentType: "text/xml",
      body: `<root><![CDATA[${state.uploaded && kind && !state.attachmentFieldsMissing ? `<table><tr><td><a onclick="insertAttach${kind === "attachimg" ? "img" : ""}Tag('${id}');">intent.txt</a></td><td><input name="attachnew[${id}][description]" value=""><input name="attachnew[${id}][price]" value="0"><select name="attachnew[${id}][readperm]"><option value="">All</option></select></td></tr></table>` : ""}]]></root>`,
    };
  }
  if (request.method === "POST") {
    if (state.postGate) await state.postGate;
    const thread = url.searchParams.get("tid") ?? "42";
    state.saved.set(thread, new URLSearchParams(request.body ?? ""));
    state.savedActors.set(thread, state.member);
    return {
      contentType: "text/xml",
      body: `<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=${thread}&pid=${thread}99&page=1#pid${thread}99', 'Reply accepted', {});</script>]]></root>`,
    };
  }
  const account =
    state.member === "guest"
      ? '<form id="lsform"></form>'
      : state.member === "unknown"
        ? ""
        : `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
  const board = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
  const id = url.searchParams.get("tid") ?? "42",
    saved =
      url.searchParams.get("action") === "edit"
        ? state.saved.get(id)
        : undefined,
    newThread = url.searchParams.get("action") === "newthread",
    post = saved?.get("reppost") ?? url.searchParams.get("reppost");
  if (state.gate?.thread === id && url.searchParams.get("mod") === "post")
    await state.gate.promise;
  if (state.refusedReply && url.searchParams.get("action") === "reply")
    return {
      contentType: "text/html",
      body: account + '<div id="messagetext">权限不足</div>',
    };
  let body = account + board;
  if (url.searchParams.get("mod") === "forumdisplay")
    body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid">${["42", "43", "44"].map((tid) => `<tbody id="normalthread_${tid}"><tr><th><a class="xst" href="${threadURL(tid)}">Thread ${tid}</a></th></tr></tbody>`).join("")}</table>`;
  else if (url.searchParams.get("mod") === "post")
    body += `<form id="postform" method="post" action="forum.php?mod=post&action=${saved ? `edit&pid=${id}99` : newThread ? "newthread" : "reply"}&fid=5${newThread ? "" : `&tid=${id}`}&${saved ? "editsubmit" : newThread ? "topicsubmit" : "replysubmit"}=yes"><input type="hidden" name="formhash" value="SYNTHETIC_RETAINED_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${post ? `<input type="hidden" name="reppid" value="${post}"><input type="hidden" name="reppost" value="${post}"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_6"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">` : ""}<input name="subject" value=""><textarea name="message">${escape(saved?.get("message") ?? "")}</textarea>${
      saved
        ? [...saved.entries()]
            .filter(([name]) =>
              /^attachnew\[[1-9]\d*\]\[(description|price|readperm)\]$/.test(
                name,
              ),
            )
            .map(
              ([name, value]) =>
                `<input name="${escape(name)}" value="${escape(value)}">`,
            )
            .join("")
        : ""
    }<label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><button type="submit" name="${saved ? "editsubmit" : newThread ? "topicsubmit" : "replysubmit"}" value="yes">Reply</button></form><script>window.ATPLUS = {"api":"/plugin.php?id=atplus:search","login":1,"use":1};</script><script>var upload = new SWFUpload({upload_url:'misc.php?mod=swfupload&action=swfupload&operation=upload&fid=5',post_params:{uid:'${state.member}',hash:'SYNTHETIC_UPLOAD_HASH'},file_upload_limit:0,file_queue_limit:0,file_size_limit:'512',file_types:'*.txt',custom_settings:{uploadSource:'forum',uploadType:'attach',maxSizePerDay:3000000,maxAttachNum:10,filterType:{txt:524288}}});</script>`;
  else
    body += `<div id="postlist"><h1 id="thread_subject">Thread ${id}</h1><div id="post_${id}01"><div class="authi"><a href="home.php?mod=space&uid=6">Other author</a></div><a id="postnum${id}01"><em>1</em>#</a><div class="pcb"><p>${escape(`Original opening for thread ${id}`)}</p></div></div>${state.saved.has(id) ? `<div id="post_${id}99"><div class="authi"><a href="home.php?mod=space&uid=${state.savedActors.get(id)}">Writer ${state.savedActors.get(id)}</a></div><a id="postnum${id}99"><em>2</em>#</a><div class="pcb"><p>Stored authored reply</p></div></div>` : ""}</div>`;
  return {
    contentType: "application/json",
    body: JSON.stringify({ document: body }),
  };
}
