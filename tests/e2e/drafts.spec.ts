import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const listURL = `${origin}/home.php?mod=space&do=thread&view=me&type=thread&filter=save`;
const actor =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
test("J6.draft-list: own overview shows all returned draft rows and follows only returned pagination", async ({
  page,
}, info) => {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    requests.push(url.href);
    const page2 = url.searchParams.get("page") === "2";
    const rows = page2
      ? [["44", "Other board draft", "9"]]
      : [
          ["42", "First draft", "5"],
          ["43", "Second draft", "5"],
        ];
    const body =
      url.pathname === "/home.php"
        ? `${actor}<a class="a" href="${listURL}">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${rows.map(([tid, title, fid]) => `<tr><th><a href="forum.php?mod=viewthread&tid=${tid}">${title}</a></th><td><a href="forum.php?mod=forumdisplay&fid=${fid}">Board ${fid}</a></td></tr>`).join("")}</tbody></table></form></div><div class="pg"><strong>${page2 ? "2" : "1"}</strong><a href="${listURL}${page2 ? "" : "&page=2"}">${page2 ? "1" : "2"}</a></div>`
        : `${actor}<div id="ct"><h1>Music</h1></div><table id="threadlisttableid"></table><p class="emp">No threads</p>`;
    return route.fulfill({ contentType: "text/html", body });
  });
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume First draft", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume Second draft", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Draft page 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume Other board draft", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume First draft", exact: true }),
  ).toHaveCount(0);
  expect(
    requests.filter((value) => new URL(value).pathname === "/home.php"),
  ).toHaveLength(2);
  await info.attach("draft-list.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("draft-list-requests.json", {
    body: Buffer.from(JSON.stringify(requests)),
    contentType: "application/json",
  });
});

const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
async function lifecycle(
  page: import("@playwright/test").Page,
  initialFormChange = (body: string) => body,
) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const state = {
    saved: null as URLSearchParams | null,
    published: false,
    posts: [] as URLSearchParams[],
    outcome: "accepted",
    member: "7",
    gate: null as Promise<void> | null,
    reads: [] as string[],
    publications: 0,
    publicationOutcome: "published",
    preexisting: false,
    threadChange: (body: string) => body,
    sourceChange: initialFormChange,
    mentionNew: false,
    mentionEdit: false,
    mentionPeople: [{ uid: 8, username: "Draft person" }],
    mentionGate: null as Promise<void> | null,
    mentionQueries: [] as string[],
  };
  const form = (edit: boolean, boardId = "5") =>
    `${(edit ? state.mentionEdit : state.mentionNew) ? '<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script>' : ""}${actor.replace("uid=7", `uid=${state.member}`)}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=${boardId}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit&editsubmit=yes&tid=42&pid=101" : "newthread&topicsubmit=yes"}&fid=${boardId}"><input type="hidden" name="formhash" value="PRIVATE-TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input type="hidden" name="save" id="postsave" value=""><input name="subject" value="${escape(edit ? (state.saved?.get("subject") ?? "") : "")}"><textarea name="message">${escape(edit ? (state.saved?.get("message") ?? "") : "")}</textarea><select name="typeid"><option value="3" selected>Listening</option></select><label><input type="checkbox" name="usesig" value="1"${!edit || state.saved?.has("usesig") ? " checked" : ""}>Signature</label><input name="price" value="0"><input type="hidden" name="attachnew[88][description]" value="existing metadata"><button type="submit" name="${edit ? "editsubmit" : "topicsubmit"}" value="yes">Publish</button><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button></form>`;
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    let body: string;
    if (url.pathname === "/plugin.php") {
      state.mentionQueries.push(
        new URLSearchParams(request.postData() ?? "").get("q") ?? "",
      );
      if (state.mentionGate) await state.mentionGate;
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: 1, list: state.mentionPeople }),
      });
    }
    if (request.method() === "POST") {
      const data = new URLSearchParams(request.postData() ?? "");
      state.posts.push(data);
      if (data.get("save") !== "1" && state.saved) {
        state.publications++;
        if (state.gate) await state.gate;
        if (state.publicationOutcome === "published") state.published = true;
        return route.fulfill({
          contentType: "text/xml",
          body:
            state.publicationOutcome === "moderation"
              ? "<root><![CDATA[<script>succeedhandle_post('', '主题需要审核', {});</script>]]></root>"
              : "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {});</script>]]></root>",
        });
      }
      if (state.outcome === "rejected")
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>",
        });
      state.saved = data;
      state.published = data.get("save") !== "1";
      if (state.gate) await state.gate;
      if (state.outcome === "lost") return route.abort("failed");
      return route.fulfill({
        contentType: "text/xml",
        body: "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Stored', {});</script>]]></root>",
      });
    }
    if (url.searchParams.get("action") === "pubsave") {
      state.publications++;
      if (state.gate) await state.gate;
      if (state.publicationOutcome === "published") state.published = true;
      return route.fulfill({
        contentType: "text/xml",
        body:
          state.publicationOutcome === "moderation"
            ? "<root><![CDATA[<script>succeedhandle_post('', '主题需要审核', {});</script>]]></root>"
            : "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {});</script>]]></root>",
      });
    }
    state.reads.push(url.href);
    if (url.pathname === "/home.php")
      body = `${actor}<a class="a" href="${listURL}">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${state.preexisting ? '<tr><th><a href="forum.php?mod=viewthread&tid=41">Draft lifecycle</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>' : ""}${state.saved && !state.published ? '<tr><th><a href="forum.php?mod=viewthread&tid=42">' + escape(state.saved.get("subject") ?? "") + '</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>' : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form></div>`;
    else if (url.searchParams.get("mod") === "post")
      body = state.sourceChange(
        form(
          url.searchParams.get("action") === "edit",
          url.searchParams.get("fid") ?? "5",
        ),
      );
    else if (url.searchParams.get("mod") === "viewthread")
      body = `${actor}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><div id="postlist"><h1><span id="thread_subject">${escape(state.saved?.get("subject") ?? "")}</span>${state.published ? "" : '<span class="xg1">(草稿)</span>'}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Authoritative stored body</p></div><div class="po"><div class="pob">${state.published ? "" : '<a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a>'}</div></div></div></div>`;
    else
      body = `${actor}<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=5">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_9"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=9">Existing thread</a></th></tr></tbody></table>`;
    if (url.searchParams.get("mod") === "viewthread")
      body = state.threadChange(body);
    return route.fulfill({ contentType: "text/html", body });
  });
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Draft lifecycle");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[unknown]full source[/unknown] [attach]88[/attach]");
  return state;
}
test("J6.save-draft: explicit save confirms independent full source and same-record revision without publishing", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.get("save")).toBe("1");
  expect(state.published).toBe(false);
  expect(state.posts[0]!.get("attachnew[88][description]")).toBe(
    "existing metadata",
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Revised same draft [attach]88[/attach]");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect.poll(() => state.posts.length).toBe(2);
  expect(state.saved?.get("message")).toBe(
    "Revised same draft [attach]88[/attach]",
  );
  expect(state.published).toBe(false);
  expect(
    state.reads.filter((v) => new URL(v).searchParams.get("action") === "edit")
      .length,
  ).toBeGreaterThanOrEqual(3);
  await info.attach("saved-draft.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("stored-draft.json", {
    body: Buffer.from(
      JSON.stringify({
        saved: Object.fromEntries(state.saved!),
        published: state.published,
        reads: state.reads,
      }),
    ),
    contentType: "application/json",
  });
});

test("J6.resume-draft: resume full saved source and references without publication or replacing later writing", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.saved = new URLSearchParams({
    subject: "Remote saved draft",
    message: "Remote [attach]88[/attach]",
    typeid: "3",
    usesig: "1",
    price: "0",
    save: "1",
  });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume Remote saved draft", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Discard local changes and resume draft",
      exact: true,
    }),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await page
    .getByRole("button", {
      name: "Discard local changes and resume draft",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Remote [attach]88[/attach]",
  );
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Remote saved draft",
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Updated [attach]88[/attach]");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.published).toBe(false);
  await info.attach("resumed-draft.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.uncertain-draft: lost response retains original attempt across reload and confirms selected same record without another save", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.outcome = "lost";
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]full source[/unknown] [attach]88[/attach]",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Check saved revision in Draft lifecycle",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await info.attach("uncertain-reconciled.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.save-race: duplicate activation sends once and later local edits survive older confirmation and reload", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .dblclick();
  await expect.poll(() => state.posts.length).toBe(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later local source");
  release();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later local source",
  );
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later local source",
  );
  expect(state.posts).toHaveLength(1);
  expect(state.saved?.get("message")).toContain("[unknown]");
  await info.attach("newer-edit-retained.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.rejected-save: failed save-and-continue retains original source and remote draft remains untouched", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.outcome = "rejected";
  state.saved = new URLSearchParams({
    subject: "Remote existing",
    message: "Remote original",
    typeid: "3",
    usesig: "1",
    price: "0",
    save: "1",
  });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume Remote existing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save forum draft and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/The forum rejected draft saving/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]full source[/unknown] [attach]88[/attach]",
  );
  expect(state.saved?.get("message")).toBe("Remote original");
  await info.attach("failed-replacement.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.remote-conflict: changed remote saved revision prevents overwrite and preserves local changes", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.saved!.set("message", "Other tab revision");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Local competing revision");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/remote draft changed/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.saved!.get("message")).toBe("Other tab revision");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Local competing revision",
  );
  await info.attach("remote-conflict.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.session-change: account change before save sends nothing and retains original author source", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.member = "8";
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(/account changed before draft saving/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]full source[/unknown] [attach]88[/attach]",
  );
  await info.attach("account-change.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.publish-draft: explicit publication opens actual post and reconciles absent draft list with full source readback", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Draft lifecycle", exact: true }),
  ).toBeVisible();
  expect(state.publications).toBe(1);
  expect(state.posts).toHaveLength(2);
  expect(state.published).toBe(true);
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume Draft lifecycle", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("还没有相关的帖子")).toBeVisible();
  await info.attach("published-draft.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("publication-readback.json", {
    body: Buffer.from(
      JSON.stringify({
        publications: state.publications,
        published: state.published,
        reads: state.reads,
      }),
    ),
    contentType: "application/json",
  });
});

test("J6.publication-race: newer edits survive older publication and remaining draft is not mislabeled published", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.publicationOutcome = "remaining";
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect.poll(() => state.publications).toBe(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later unpublished local text");
  release();
  await expect(
    page.getByText(/still an unpublished forum draft/).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later unpublished local text",
  );
  expect(state.published).toBe(false);
  await info.attach("remaining-draft.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.native-marker: current desktop header marker is recognized and authored-body publication link is rejected", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.threadChange = (body) =>
    body
      .replace('<span class="xg1">(草稿)</span>', "")
      .replace(
        "<h1>",
        '<table><tr><td class="plc ptm pbn vwthd"><span class="xg1">(草稿)<a href="forum.php?mod=misc&action=pubsave&tid=42">发表</a></span></td></tr></table><h1>',
      );
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.threadChange = (body) =>
    body.replace('<div class="po"><div class="pob">', '<div class="pcb"><div>');
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Changed source");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/remote draft changed/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await info.attach("native-marker-and-inert-content.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.pending-refresh: pending save restores as uncertain and does not resend after refresh", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect.poll(() => state.posts.length).toBe(1);
  const retained = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(retained).toContain('"priorDraftIds":[]');
  expect(retained).not.toContain("PRIVATE-TOKEN");
  await info.attach("pending-identity-baseline.json", {
    body: Buffer.from(retained!),
    contentType: "application/json",
  });
  await page.reload();
  release();
  await expect(
    page.getByText(/Pending draft save restored as uncertain/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(/earlier draft save may have succeeded/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Check saved revision in Draft lifecycle",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await info.attach("pending-refresh.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.moderation: publication moderation remains explicit and no blind retry occurs", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.publicationOutcome = "moderation";
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/forum reports moderation/).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/earlier draft operation remains unresolved/),
  ).toBeVisible();
  expect(state.publications).toBe(1);
  await info.attach("moderation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.reference-drift: changed current attachment metadata prevents sending an unintended revision", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.sourceChange = (body) =>
    body.replace("existing metadata", "changed elsewhere");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(/attachment references changed before saving/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]full source[/unknown] [attach]88[/attach]",
  );
  await info.attach("reference-drift.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.preexisting-record: matching old draft cannot resolve a new lost-response save", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.preexisting = true;
  state.outcome = "lost";
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Check saved revision in Draft lifecycle",
      exact: true,
    })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/predates this save/)).toBeVisible();
  await expect(page.getByText(/Confirmed forum draft/)).toHaveCount(0);
  expect(state.posts).toHaveLength(1);
  await info.attach("preexisting-record-refused.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.stored-normalization: confirmed blank-price normalization and creation directives do not block publishing the same saved source", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page.getByLabel("Thread price", { exact: true }).fill("");
  state.sourceChange = (body) =>
    body.includes("action=newthread")
      ? body.replace('name="price" value="0"', 'name="price" value=""')
      : body;
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).first(),
  ).toBeVisible();
  expect(state.publications).toBe(1);
  await info.attach("normalized-draft-publication.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.save-continue: replacement proceeds only after exact version is independently saved", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Save forum draft and continue", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByText("Writing as Writer 7 · Board 6")).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.saved?.get("message")).toContain("[unknown]");
  await info.attach("saved-and-continued.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.creation-instructions: new-thread creation directives do not prevent same-record draft updates or get repeated", async ({
  page,
}, info) => {
  const state = await lifecycle(page, (body) =>
    body.includes("action=newthread")
      ? body.replace(
          "</form>",
          '<label><input type="checkbox" name="addfeed" value="1" checked>Publish activity</label></form>',
        )
      : body,
  );
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Revised saved draft");
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect.poll(() => state.posts.length).toBe(2);
  expect(state.posts[0]!.get("addfeed")).toBe("1");
  expect(state.posts[1]!.has("addfeed")).toBe(false);
  await expect(page.getByText(/Confirmed forum draft 42/)).toHaveCount(2);
  await info.attach("creation-instructions.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.native-moderation: independently returned moderation metadata cannot be confirmed as publication", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.threadChange = (body) =>
    state.published
      ? body.replace(
          '<div id="postlist">',
          '<div id="postlist"><div class="modact">本主题正在等待审核</div>',
        )
      : body;
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/forum reports moderation/).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/Confirmed publication of forum draft/),
  ).toHaveCount(0);
  expect(state.publications).toBe(1);
  await info.attach("native-moderation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.authored-state: quoted moderation and draft-action markup cannot override authoritative published state", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.threadChange = (body) =>
    state.published
      ? body.replace(
          "Authoritative stored body",
          '<span class="modact">本主题正在等待审核</span><a class="psave" href="forum.php?mod=misc&amp;action=pubsave&amp;tid=42">Quoted draft action</a>',
        )
      : body;
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).first(),
  ).toBeVisible();
  expect(state.publications).toBe(1);
  await info.attach("authored-state.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.next-composition: a completed publication remains in history without blocking a deliberate new composition's Save", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).first(),
  ).toBeVisible();
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(page.getByText("Writing as Writer 7 · Board 6")).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Second composition");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Second source");
  state.outcome = "rejected";
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(/forum rejected draft saving/).first(),
  ).toBeVisible();
  expect(state.posts).toHaveLength(3);
  expect(state.posts[2]!.get("message")).toBe("Second source");
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).first(),
  ).toBeVisible();
  await info.attach("next-composition.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J6.visual-full-readback: visual revision preserves opaque source and reference metadata through same-record save and rendered publication", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  const original =
    "[B]known[/B] [unknown=v3]完整來源[/unknown] [attach]88[/attach]";
  const expected =
    "[B]kXnown[/B] [unknown=v3]完整來源[/unknown] [attach]88[/attach]";
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(original);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.press("Meta+ArrowLeft");
  await visual.press("ArrowRight");
  await visual.press("X");
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(source).toHaveValue(expected);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.saved?.get("message")).toBe(expected);
  expect(state.saved?.get("subject")).toBe("Draft lifecycle");
  expect(state.saved?.get("typeid")).toBe("3");
  expect(state.saved?.has("usesig")).toBe(false);
  expect(state.saved?.get("attachnew[88][description]")).toBe(
    "existing metadata",
  );
  await page.reload();
  await expect(source).toHaveValue(expected);
  // Independent fixture renderer uses stored forum text, not application editor helpers.
  state.threadChange = (body) =>
    body.replace(
      "Authoritative stored body",
      escape(state.saved?.get("message") ?? "").replace(
        /\[B\]([\s\S]*?)\[\/B\]/g,
        "<strong>$1</strong>",
      ),
    );
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  const post = page.getByRole("article", { name: "Post 101", exact: true });
  await expect(
    post.locator("strong").filter({ hasText: "kXnown" }),
  ).toBeVisible();
  await expect(post).toContainText(
    "[unknown=v3]完整來源[/unknown] [attach]88[/attach]",
  );
  expect(state.posts).toHaveLength(2);
  expect(state.saved?.get("message")).toBe(expected);
  await info.attach("visual-draft-readback.json", {
    body: Buffer.from(
      JSON.stringify({
        expected,
        stored: Object.fromEntries(state.saved!),
        reads: state.reads,
        published: state.published,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("visual-draft-render.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const disabled of [false, true])
  test(`J6.reference-panel-${disabled ? "disabled" : "enabled"}: resumed draft preserves existing metadata and empty update sentinel through recovery save and publication`, async ({
    page,
  }, info) => {
    const panel = `<div id="e_attachlist"><input type="hidden" name="attachupdate[88]" value=""${disabled ? " disabled" : ""}><input type="text" name="attachnew[88][description]" value="existing metadata"><input type="text" name="attachnew[88][price]" value="0"></div>`;
    const state = await lifecycle(page, (body) =>
      body.includes("edit&editsubmit")
        ? body.replace(
            '<input type="hidden" name="attachnew[88][description]" value="existing metadata">',
            "",
          ) + panel
        : body,
    );
    state.saved = new URLSearchParams({
      subject: "Reference draft",
      message: "Remote [attach]88[/attach]",
      typeid: "3",
      usesig: "1",
      price: "0",
      save: "1",
    });
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Drafts", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Load forum drafts", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Resume Reference draft", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Discard local changes and resume draft",
        exact: true,
      })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await expect(source).toHaveValue("Remote [attach]88[/attach]");
    await source.fill("Revised reference draft [attach]88[/attach]");
    await page.reload();
    await expect(source).toHaveValue(
      "Revised reference draft [attach]88[/attach]",
    );
    await page
      .getByRole("button", { name: "Save forum draft", exact: true })
      .click();
    await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]!.get("attachnew[88][description]")).toBe(
      "existing metadata",
    );
    expect(state.posts[0]!.get("attachnew[88][price]")).toBe("0");
    expect(state.posts[0]!.get("attachupdate[88]")).toBe(disabled ? null : "");
    await page
      .getByRole("button", { name: "Publish saved draft", exact: true })
      .click();
    await expect(
      page.getByRole("article", { name: "Post 101", exact: true }),
    ).toBeVisible();
    expect(state.posts).toHaveLength(2);
    expect(state.posts[1]!.get("attachnew[88][description]")).toBe(
      "existing metadata",
    );
    expect(state.posts[1]!.get("attachupdate[88]")).toBe(disabled ? null : "");
    expect(state.saved?.get("message")).toBe(
      "Revised reference draft [attach]88[/attach]",
    );
    await info.attach("reference-panel-readback.json", {
      body: Buffer.from(
        JSON.stringify({
          disabled,
          saved: Object.fromEntries(state.saved!),
          posts: state.posts.map((p) => Object.fromEntries(p)),
          reads: state.reads,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach("reference-panel-render.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

const saveControl = `<button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button>`;
for (const variant of ["disabled", "fieldset", "ambiguous"] as const)
  test(`J6.current-save-${variant}: fresh unsupported Save refuses continuation and retains exact outgoing writing`, async ({
    page,
  }, info) => {
    const state = await lifecycle(page);
    state.sourceChange = (body) =>
      body.replace(
        saveControl,
        variant === "disabled"
          ? saveControl.replace("<button ", "<button disabled ")
          : variant === "fieldset"
            ? `<fieldset disabled>${saveControl}</fieldset>`
            : saveControl + saveControl,
      );
    await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Save forum draft and continue",
        exact: true,
      })
      .click();
    await expect(
      page
        .getByText(
          /current draft form changed|native draft-save controls are unsupported/,
        )
        .last(),
    ).toBeVisible();
    expect(state.posts).toHaveLength(0);
    expect(
      state.reads.filter(
        (url) =>
          new URL(url).searchParams.get("action") === "newthread" &&
          new URL(url).searchParams.get("fid") === "6",
      ),
    ).toHaveLength(0);
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]full source[/unknown] [attach]88[/attach]");
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(retained.draftAttempts.at(-1).status).toBe("not-sent");
    expect(retained.id).toBe(
      retained.draftAttempts.at(-1).submission.contextId,
    );
    await info.attach("current-save-refusal.json", {
      body: Buffer.from(
        JSON.stringify({
          variant,
          reads: state.reads,
          posts: state.posts,
          retained,
        }),
      ),
      contentType: "application/json",
    });
  });
test("J6.current-save-disabled-duplicate: one enabled current Save remains supported beside a disabled copy", async ({
  page,
}) => {
  const state = await lifecycle(page);
  state.sourceChange = (body) =>
    body.replace(
      saveControl,
      saveControl + saveControl.replace("<button ", "<button disabled "),
    );
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
});
test("J6.publish-independent-control: disabled current Save does not disable an independently valid draft Publish", async ({
  page,
}) => {
  const state = await lifecycle(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.sourceChange = (body) =>
    body.replace(
      saveControl,
      saveControl.replace("<button ", "<button disabled "),
    );
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  expect(state.posts).toHaveLength(2);
});
async function selectDraftMention(
  page: Page,
  state: Awaited<ReturnType<typeof lifecycle>>,
  newCapability = true,
) {
  state.mentionNew = newCapability;
  state.mentionEdit = true;
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Mention source ");
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Draft person");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Draft person (UID 8)", exact: true })
    .click();
  return await page.getByLabel("Complete source", { exact: true }).inputValue();
}
for (const operation of ["save", "publish"] as const)
  test(`J6.mention-${operation}-drift: selected identity is revalidated before the consequential draft operation`, async ({
    page,
  }, info) => {
    const state = await lifecycle(page),
      original = await selectDraftMention(page, state);
    if (operation === "publish") {
      await page
        .getByRole("button", { name: "Save forum draft", exact: true })
        .click();
      await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    }
    const prior = state.posts.length,
      lookups = state.mentionQueries.length;
    state.mentionPeople = [{ uid: 9, username: "Draft person" }];
    await page
      .getByRole("button", {
        name: operation === "save" ? "Save forum draft" : "Publish saved draft",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(/selected mention identity changed/).last(),
    ).toBeVisible();
    expect(state.mentionQueries.length).toBeGreaterThan(lookups);
    expect(state.posts).toHaveLength(prior);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original);
    await info.attach("mention-refusal.json", {
      body: Buffer.from(
        JSON.stringify({
          operation,
          original,
          queries: state.mentionQueries,
          reads: state.reads,
          posts: state.posts.map((p) => Object.fromEntries(p)),
        }),
      ),
      contentType: "application/json",
    });
  });
test("J6.mention-draft-current-capability: selected saved draft uses its actual edit form for lookup and refuses absent capability", async ({
  page,
}) => {
  const state = await lifecycle(page);
  await selectDraftMention(page, state);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.mentionEdit = false;
  const before = state.reads.length,
    queries = state.mentionQueries.length;
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await expect(
    page.getByText(/current forum mention service could not resolve/).last(),
  ).toBeVisible();
  expect(state.mentionQueries).toHaveLength(queries);
  expect(
    state.reads
      .slice(before)
      .every(
        (url) =>
          new URL(url).searchParams.get("action") === "edit" &&
          new URL(url).searchParams.get("tid") === "42" &&
          new URL(url).searchParams.get("pid") === "101",
      ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/selected mention identity changed/).last(),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});
test("J6.mention-stable-readback: stable selected identity survives exact saved source and same-record publication through current edit capability", async ({
  page,
}, info) => {
  const state = await lifecycle(page),
    original = await selectDraftMention(page, state);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.saved?.get("message")).toBe(original);
  const before = state.reads.length,
    queries = state.mentionQueries.length;
  state.mentionNew = false;
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  expect(state.mentionQueries.length).toBeGreaterThan(queries);
  expect(
    state.reads
      .slice(before)
      .filter((url) => new URL(url).searchParams.get("mod") === "post")
      .every(
        (url) =>
          new URL(url).searchParams.get("action") === "edit" &&
          new URL(url).searchParams.get("tid") === "42",
      ),
  ).toBe(true);
  expect(state.posts).toHaveLength(2);
  expect(state.saved?.get("message")).toBe(original);
  await info.attach("mention-stable-readback.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        stored: Object.fromEntries(state.saved!),
        queries: state.mentionQueries,
        reads: state.reads,
      }),
    ),
    contentType: "application/json",
  });
});
for (const change of ["account", "version", "controls"] as const)
  test(`J6.mention-await-${change}: current account version and save controls are checked after awaited identity resolution`, async ({
    page,
  }) => {
    const state = await lifecycle(page),
      original = await selectDraftMention(page, state);
    if (change === "version") {
      await page
        .getByRole("button", { name: "Save forum draft", exact: true })
        .click();
      await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    }
    const prior = state.posts.length,
      queries = state.mentionQueries.length;
    let release!: () => void;
    state.mentionGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page
      .getByRole("button", {
        name: change === "version" ? "Publish saved draft" : "Save forum draft",
        exact: true,
      })
      .click();
    await expect
      .poll(() => state.mentionQueries.length)
      .toBeGreaterThan(queries);
    if (change === "account") state.member = "8";
    if (change === "version")
      state.saved!.set("message", "Changed remote draft revision");
    if (change === "controls")
      state.sourceChange = (body) =>
        body.replace(
          saveControl,
          saveControl.replace("<button ", "<button disabled "),
        );
    release();
    await expect(
      page
        .getByText(
          /selected mention identity changed|saved draft or account changed|current draft form changed|native draft-save controls are unsupported/,
        )
        .last(),
    ).toBeVisible();
    expect(state.posts).toHaveLength(prior);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original);
  });

test("J6.mention-resumed-current-form: resumed draft resolves and saves selected identity using its edit capability while new-thread lookup is unavailable", async ({
  page,
}, info) => {
  const state = await lifecycle(page);
  state.saved = new URLSearchParams({
    subject: "Resumed mention draft",
    message: "Remote source",
    typeid: "3",
    usesig: "1",
    price: "0",
    save: "1",
  });
  state.mentionEdit = true;
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume Resumed mention draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard local changes and resume draft",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Remote source",
  );
  const before = state.reads.length,
    original = await selectDraftMention(page, state, false);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.saved?.get("message")).toBe(original);
  expect(state.mentionQueries.length).toBeGreaterThanOrEqual(2);
  expect(
    state.reads
      .slice(before)
      .filter((url) => new URL(url).searchParams.get("mod") === "post")
      .every(
        (url) =>
          new URL(url).searchParams.get("action") === "edit" &&
          new URL(url).searchParams.get("tid") === "42" &&
          new URL(url).searchParams.get("pid") === "101",
      ),
  ).toBe(true);
  expect(state.posts).toHaveLength(1);
  await info.attach("resumed-mention-readback.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        stored: Object.fromEntries(state.saved!),
        queries: state.mentionQueries,
        reads: state.reads,
      }),
    ),
    contentType: "application/json",
  });
});

test("J6.mention-stored-normalization: unqualified forum rewriting of a selected marker remains uncertain", async ({
  page,
}, info) => {
  const state = await lifecycle(page),
    original = await selectDraftMention(page, state);
  state.sourceChange = (body) =>
    body.includes("edit&editsubmit")
      ? body.replace("@\u2063Draft person\u2063", "@Draft person")
      : body;
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(/complete saved revision could not be confirmed/),
  ).toBeVisible();
  await expect(page.getByText(/Confirmed forum draft 42/)).toHaveCount(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original,
  );
  expect(state.posts).toHaveLength(1);
  await info.attach("mention-normalization-uncertain.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        submitted: state.saved?.get("message"),
        reads: state.reads,
      }),
    ),
    contentType: "application/json",
  });
});
