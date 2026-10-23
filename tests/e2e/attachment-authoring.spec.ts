import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { combinedSource, richRoundTrip } from "./combined-authoring";
const origin = "https://www.tsdm39.com";
const thread = `${origin}/forum.php?mod=viewthread&tid=42`;
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
async function fixture(
  page: Page,
  context: "edit" | "new-thread" | "reply" | "quote" = "edit",
  existing = false,
  initialSource = "Existing source",
  editPostId = "101",
  mergedReply = false,
) {
  const state = {
    source: initialSource,
    title: "Owned attachment thread",
    member: "7",
    uploads: [] as { name: string; bytes: string }[],
    saves: [] as string[],
    stored: [] as string[],
    ids: [] as string[],
    uploadGate: null as Promise<void> | null,
    listMissing: false,
    listGate: null as Promise<void> | null,
    listWaiting: false,
    outcome: "accepted",
    insertionMarkup: "<a onclick=\"insertAttachTag('88');\">note.txt</a>",
    normalizeImageTag: false,
    rewriteSource: false,
    daily: 3000000,
    count: 5,
    maxKB: "512",
    comments: false,
    metadataOption: '<option value="" selected>All</option>',
    storedReadperm: null as string | null,
    uploadLimit: 0,
    uploadInitializer: null as string | null,
    nativeJSON: null as Record<string, unknown> | null,
    nativeUploadInitializer: null as string | null,
    nativeActor: "7",
    nativeStatus: 200,
    nativeFormReads: [] as string[],
    association: true,
    normalized: false,
    updateSentinel: false,
    changeAccountAfterUpload: false,
    saved: false,
    saveGate: null as Promise<void> | null,
    requests: [] as { url: string; method: string }[],
    lookupGate: null as Promise<void> | null,
    removalGate: null as Promise<void> | null,
    removals: [] as string[],
  };
  if (existing) {
    state.ids = ["88"];
    state.stored = ["88"];
    state.source =
      initialSource === "Existing source"
        ? "Existing [attach]88[/attach]"
        : initialSource;
  }
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      u = new URL(request.url());
    if (u.pathname === "/__fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__fixture.js"></script></body></html>`,
      });
    state.requests.push({ url: u.href, method: request.method() });
    if (u.searchParams.get("id") === "atplus:search") {
      if (state.lookupGate) await state.lookupGate;
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          list: [{ uid: 8, username: "Other author" }],
        }),
      });
    }
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
    const board =
      '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
    const fields = (id: string) =>
      `<input name="attachnew[${id}][description]" value=""><select name="attachnew[${id}][readperm]">${state.storedReadperm === null ? state.metadataOption : `<option value="${esc(state.storedReadperm)}" selected>Stored permission</option>`}</select><input name="attachnew[${id}][price]" value="">`;
    if (u.pathname === "/misc.php") {
      const raw = request.postDataBuffer()!,
        boundary = request.headers()["content-type"]!.split("boundary=")[1]!;
      const parts = raw.toString("latin1").split("--" + boundary),
        file = parts.find((p) => p.includes('name="Filedata"'))!;
      state.uploads.push({
        name: /filename="([^"]+)"/.exec(file)![1]!,
        bytes: Buffer.from(
          file.split("\r\n\r\n")[1]!.slice(0, -2),
          "latin1",
        ).toString("hex"),
      });
      if (state.outcome === "rejected")
        return route.fulfill({ contentType: "text/plain", body: "-1" });
      state.ids.push("88");
      if (state.uploadGate) await state.uploadGate;
      if (state.changeAccountAfterUpload) state.member = "8";
      if (state.outcome === "lost") return route.abort();
      if (state.outcome === "login")
        return route.fulfill({
          contentType: "text/html",
          body: '<form id="loginform">Sign in</form>',
        });
      return route.fulfill({ contentType: "text/plain", body: "88" });
    }
    if (u.searchParams.get("action") === "deleteattach") {
      const id = u.searchParams.get("aids[]")!;
      state.removals.push(id);
      state.ids = state.ids.filter((v) => v !== id);
      state.stored = state.stored.filter((v) => v !== id);
      state.listMissing = true;
      if (state.removalGate) await state.removalGate;
      if (state.outcome === "delete-lost") return route.abort();
      return route.fulfill({
        contentType: "text/xml",
        body: "<root><![CDATA[]]></root>",
      });
    }
    if (u.searchParams.get("action") === "attachlist") {
      if (state.listGate) {
        state.listWaiting = true;
        await state.listGate;
      }
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[${state.listMissing ? "" : `<table><tbody><tr><td>${state.insertionMarkup}</td><td>${fields("88")}</td></tr></tbody></table>`}]]></root>`,
      });
    }
    if (request.method() === "POST") {
      const body = request.postData()!,
        p = new URLSearchParams(body);
      state.saves.push(body);
      state.storedReadperm = p.get("attachnew[88][readperm]");
      state.saved = true;
      if (context === "new-thread" || context === "edit")
        state.title = p.get("subject")!;
      state.source = mergedReply
        ? initialSource + "\nNative supplement boundary\n" + p.get("message")!
        : p.get("message")!;
      if (state.normalizeImageTag)
        state.source = state.source.replaceAll(
          "[attach]88[/attach]",
          "[attachimg]88[/attachimg]",
        );
      if (state.rewriteSource) state.source += " Remote rewrite";
      state.stored = (state.association ? state.ids : []).filter((id) =>
        p.has(`attachnew[${id}][description]`),
      );
      if (state.saveGate) await state.saveGate;
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('${context === "reply" || context === "quote" || editPostId === "303" ? thread + "&pid=303#pid303" : thread}', 'Saved', {});</script>]]></root>`,
      });
    }
    if (u.searchParams.get("mod") === "attachment") {
      const bytes = state.normalized
        ? Buffer.from("Normalized by server")
        : Buffer.from(state.uploads[0]!.bytes, "hex");
      return route.fulfill({
        contentType: "application/octet-stream",
        headers: {
          "content-length": String(bytes.length),
          "content-disposition": 'attachment; filename="note.txt"',
        },
        body: bytes,
      });
    }
    let body = account + board;
    if (u.searchParams.get("mod") === "post")
      body += `<form id="postform" method="post" action="forum.php?mod=post&action=${u.searchParams.get("action")}&fid=5${u.searchParams.get("action") === "edit" ? `&tid=42&pid=${context === "reply" || context === "quote" ? "303" : editPostId}&editsubmit=yes` : context === "new-thread" ? "&topicsubmit=yes" : "&tid=42&replysubmit=yes"}"><input type="hidden" name="formhash" value="PRIVATE">${context === "quote" ? '<input type="hidden" name="reppid" value="101"><input type="hidden" name="reppost" value="101"><input type="hidden" name="noticeauthor" value="AUTHOR-8"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">' : ""}<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><input name="price" value="0"><input type="hidden" name="save" id="postsave" value=""><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button><input name="subject" value="${context === "reply" || context === "quote" ? "" : esc(state.title)}"><textarea name="message">${esc(state.source).replaceAll("\r", "&#13;")}</textarea><button name="${u.searchParams.get("action") === "edit" ? "editsubmit" : context === "new-thread" ? "topicsubmit" : "replysubmit"}" type="submit" value="yes">Save</button></form><div id="e_attachlist">${u.searchParams.get("action") === "edit" ? state.stored.map((id) => (state.updateSentinel ? `<input type="hidden" name="attachupdate[${id}]" value="">` : "") + fields(id)).join("") : ""}</div><script>var upload = new SWFUpload({upload_url:'misc.php?mod=swfupload&action=swfupload&operation=upload&fid=5',post_params:{uid:'${state.member}',hash:'PRIVATE_UPLOAD'},file_upload_limit:${state.uploadLimit},file_queue_limit:0,file_size_limit:'${state.maxKB}',file_types:'*.jpg;*.jpeg;*.PNG;*.gif;*.txt',${state.comments ? "// ordinary native presentation comment\n" : ""}custom_settings:{uploadSource:'forum',uploadType:'attach',maxSizePerDay:${state.daily},maxAttachNum:${state.count},filterType:{txt:524288}}});</script>`;
    else if (u.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=5">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
    else {
      const reply =
        context === "reply" || context === "quote" || editPostId === "303";
      const attachment = state.stored.length
        ? `<span id="attach_88"><a href="forum.php?mod=attachment&aid=fictional-token">${state.uploads[0]?.name ?? "note.txt"}</a></span>`
        : "";
      const post = (id: string, author: string, floor: string) =>
        `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=${author}">Writer ${author}</a></div><a id="postnum${id}"><em>${floor}</em>#</a><div class="pcb">Rendered source ${author === "7" ? attachment : ""}</div></div>`;
      body += `<div id="postlist"><h1 id="thread_subject">${esc(state.title)}</h1>${post("101", reply ? "8" : "7", "1")}${reply && (state.saved || editPostId === "303" || mergedReply) ? post("303", "7", "2") : ""}</div>`;
    }
    if (
      u.searchParams.get("mod") === "post" &&
      !u.searchParams.has("tsdmapp") &&
      state.nativeUploadInitializer !== null
    ) {
      state.nativeFormReads.push(u.href);
      body = body
        .replace(
          /<script>var upload = new SWFUpload\([\s\S]*?<\/script>/,
          `<script>${state.nativeUploadInitializer}</script>`,
        )
        .replace(
          account,
          `<div id="um"><strong><a href="home.php?mod=space&uid=${state.nativeActor}">Writer ${state.nativeActor}</a></strong></div>`,
        );
      return route.fulfill({
        status: state.nativeStatus,
        contentType: "text/html; charset=utf-8",
        body,
      });
    }
    if (state.uploadInitializer !== null)
      body = body.replace(
        /<script>var upload = new SWFUpload\([\s\S]*?<\/script>/,
        `<script>${state.uploadInitializer}</script>`,
      );
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ...state.nativeJSON, document: body }),
    });
  });
  await page.goto(
    context === "new-thread"
      ? `${origin}/forum.php?mod=forumdisplay&fid=5`
      : thread,
  );
  await page
    .getByRole("button", {
      name:
        context === "edit"
          ? `Edit post ${editPostId}`
          : context === "new-thread"
            ? "New thread"
            : context === "reply"
              ? "Reply to thread"
              : "Quick Quote",
      exact: true,
    })
    .click();
  return state;
}
test("J8.edit-text: upload selected bytes, insert source, independently confirm saved association and preserve on resave", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Attachment fixture.\n"),
  });
  await expect(
    page.getByText("Selected · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Upload note.txt", exact: true })
    .click();
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[attach]88[/attach]Existing source",
  );
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toEqual([
    {
      name: "note.txt",
      bytes: Buffer.from("Attachment fixture.\n").toString("hex"),
    },
  ]);
  expect(state.stored).toEqual(["88"]);
  expect(state.saves).toHaveLength(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[attach]88[/attach]Existing source revised");
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
  await expect.poll(() => state.saves.length).toBe(2);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.stored).toEqual(["88"]);
  expect(state.uploads).toHaveLength(1);
  await info.attach("independent-server-state.json", {
    body: Buffer.from(JSON.stringify(state)),
    contentType: "application/json",
  });
  await info.attach("attachment.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

async function select(
  page: Page,
  name = "note.txt",
  buffer = Buffer.from("Attachment fixture.\n"),
  mimeType = "text/plain",
) {
  await page
    .getByLabel("Select attachments", { exact: true })
    .setInputFiles({ name, mimeType, buffer });
}
async function upload(page: Page, name = "note.txt") {
  await page
    .getByRole("button", { name: `Upload ${name}`, exact: true })
    .click();
}
async function save(page: Page) {
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
}
async function receipt(
  page: Page,
  state: unknown,
  info: import("@playwright/test").TestInfo,
) {
  await info.attach("independent-server-state.json", {
    body: Buffer.from(
      JSON.stringify(state, (_k, v) => (v instanceof Promise ? "held" : v)),
    ),
    contentType: "application/json",
  });
  await info.attach("attachment.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
for (const [name, mimeType, hex] of [
  [
    "pixel.PNG",
    "image/png",
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415408d763f8cfc0f01f00050001ff89993d1d0000000049454e44ae426082",
  ],
  [
    "photo.jpg",
    "image/jpeg",
    "ffd8ffe000104a46494600010100000100010000ffdb0084000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f1718161418121415140103040405040509050509140d0b0d1414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414ffc00011080008000803011100021101031101ffc401a20000010501010101010100000000000000000102030405060708090a0b100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9fa0100030101010101010101010000000000000102030405060708090a0b1100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f004ff8277f82bfe17eff00c2c0ff004cfec2fec9fecfff00965f68f37cdfb4fba6dc795ef9cf6c51e267819feae7d4ff00e14bda7b4f69ff002eb96dcbc9ff004f5def7178c399ff00c469fa87b9f54faa7b5ebed79fdafb3f2a7cbcbecfcef7e96d7fffd9",
  ],
  [
    "tiny.gif",
    "image/gif",
    "47494638396101000100800000000000ffffff2c00000000010001000002024401003b",
  ],
]) {
  test(`J8.permitted-${name}: preserve selected filename and bytes through ordinary generic uploader`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await select(page, name, Buffer.from(hex!, "hex"), mimeType);
    await upload(page, name);
    await expect(
      page.getByText(`Uploaded, unassociated · ${name}`, { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Insert ${name}`, exact: true })
      .click();
    await save(page);
    await expect(
      page.getByText(`Saved association verified · ${name}`, { exact: true }),
    ).toBeVisible();
    expect(state.uploads).toEqual([{ name, bytes: hex }]);
    expect(state.stored).toEqual(["88"]);
    await receipt(page, state, info);
  });
}
test("J8.native-comment-policy: current literal initializer comments do not disable a permitted ordinary upload", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.comments = true;
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toHaveLength(1);
  await receipt(page, state, info);
});
for (const scenario of [
  "type",
  "size",
  "daily",
  "count",
  "unknown-policy",
  "account",
]) {
  test(`J8.limit-${scenario}: fresh native policy refuses before transfer without losing source`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await select(page, scenario === "type" ? "unsafe.exe" : "note.txt");
    if (scenario === "size") state.maxKB = "0.001";
    if (scenario === "daily") state.daily = 20;
    if (scenario === "count") state.count = 0;
    if (scenario === "unknown-policy") state.maxKB = "dynamic";
    if (scenario === "account") state.member = "8";
    await upload(page, scenario === "type" ? "unsafe.exe" : "note.txt");
    await expect(page.getByText(/Upload refused ·/)).toBeVisible();
    expect(state.uploads).toHaveLength(0);
    expect(state.saves).toHaveLength(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Existing source");
    await receipt(page, state, info);
  });
}
for (const outcome of ["lost", "login", "rejected"]) {
  test(`J8.upload-${outcome}: no automatic retry or association after non-success response`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.outcome = outcome;
    await select(page);
    await upload(page);
    await expect(
      page.getByText(
        outcome === "rejected"
          ? "Upload refused · note.txt"
          : "Upload outcome uncertain · note.txt",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Review edit", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Save edited post", exact: true }),
    ).toHaveCount(0);
    expect(state.uploads).toHaveLength(1);
    expect(state.saves).toHaveLength(0);
    await receipt(page, state, info);
  });
}
test("J8.pending-progress: pending upload blocks save and duplicate activation; explicit local removal cancels without deleting remote bytes", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release = () => {};
  state.uploadGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await select(page);
  await upload(page);
  await expect(
    page.getByRole("progressbar", { name: "Attachment upload progress" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save edited post", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Remove local selection note.txt",
      exact: true,
    })
    .click();
  release();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  expect(state.uploads).toHaveLength(1);
  expect(state.ids).toEqual(["88"]);
  expect(state.removals).toHaveLength(0);
  expect(state.saves).toHaveLength(0);
  await receipt(page, state, info);
});
test("J8.reselection: refresh preserves selection metadata and source, requires file reselection, never sends retained phantom bytes", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await expect(
    page.getByText("Selected · note.txt", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Reselect file bytes · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toHaveLength(0);
  await receipt(page, state, info);
});
test("J8.expired-reference: recovered upload is revalidated and refused before save when the current list no longer contains it", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await page.reload();
  state.listMissing = true;
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save edited post", exact: true }),
  ).toHaveCount(0);
  expect(state.uploads).toHaveLength(1);
  expect(state.saves).toHaveLength(0);
  await receipt(page, state, info);
});
test("J8.association-failure: saved source containing an ID does not establish saved file association", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  state.association = false;
  await save(page);
  await expect(page.getByText(/No confirmation is claimed/)).toBeVisible();
  await expect(page.getByText(/Saved association verified/)).toHaveCount(0);
  expect(state.saves).toHaveLength(1);
  expect(state.stored).toEqual([]);
  await receipt(page, state, info);
});
test("J8.reference-only: removing a body tag preserves the associated file without a deletion request", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Tag removed, file retained");
  await save(page);
  await expect.poll(() => state.saves.length).toBe(2);
  expect(state.stored).toEqual(["88"]);
  expect(state.removals).toEqual([]);
  await receipt(page, state, info);
});
test("J8.remote-removal: explicit warned removal deletes immediately and independently verifies absence before any next post save", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove server file note.txt", exact: true })
    .click();
  await expect(page.getByText(/immediately.*cannot be undone/i)).toBeVisible();
  expect(state.removals).toEqual([]);
  await page
    .getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Attachment authoring" })
      .getByText(/Server file removal verified/),
  ).toBeVisible();
  expect(state.removals).toEqual(["88"]);
  expect(state.ids).toEqual([]);
  expect(state.saves).toEqual([]);
  await receipt(page, state, info);
});

for (const context of ["new-thread", "reply", "quote"] as const) {
  test(`J8.${context}: upload, insert and independently confirm attachment association in ordinary participation`, async ({
    page,
  }, info) => {
    const state = await fixture(page, context);
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: context === "new-thread" ? "Publish thread" : "Send reply",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Saved association verified · note.txt", { exact: true }),
    ).toBeVisible();
    expect(state.stored).toEqual(["88"]);
    expect(state.saves).toHaveLength(1);
    expect(state.uploads).toHaveLength(1);
    await receipt(page, state, info);
  });
}
test("J8.upload-account-race: account changes after accepted upload cannot adopt file into current writing", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.changeAccountAfterUpload = true;
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Upload outcome uncertain · note.txt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Insert note.txt", exact: true }),
  ).toHaveCount(0);
  expect(state.uploads).toHaveLength(1);
  expect(state.saves).toHaveLength(0);
  await receipt(page, state, info);
});
test("J8.normalization: independent stored-byte readback discloses server changes without rewriting local source or retrying upload", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await save(page);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  state.normalized = true;
  await page
    .getByRole("button", { name: "Check stored bytes note.txt", exact: true })
    .click();
  await expect(
    page.getByText(/Server file differs from selected bytes/),
  ).toBeVisible();
  expect(state.saves).toHaveLength(1);
  expect(state.uploads).toHaveLength(1);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[attach]88[/attach]Existing source",
  );
  await receipt(page, state, info);
});
test("J8.removal-uncertainty: lost removal response uses independent absence checks and sends no second deletion", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  state.outcome = "delete-lost";
  await page
    .getByRole("button", { name: "Remove server file note.txt", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Server file removed · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.removals).toEqual(["88"]);
  expect(state.saves).toEqual([]);
  await receipt(page, state, info);
});

test("J8.native-update-sentinel: stored native dormant replacement control preserves association and allows later resave", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.updateSentinel = true;
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await save(page);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[attach]88[/attach]Second version");
  await save(page);
  await expect.poll(() => state.saves.length).toBe(2);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.stored).toEqual(["88"]);
  expect(new URLSearchParams(state.saves[1]!).get("attachupdate[88]")).toBe("");
  await receipt(page, state, info);
});
test("J8.existing-file-removal: fresh owned edit exposes existing remote file removal independently of local upload history", async ({
  page,
}, info) => {
  const state = await fixture(page, "edit", true);
  await page
    .getByRole("button", {
      name: "Remove server file Attachment 88",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Server file removed · Attachment 88", { exact: true }),
  ).toBeVisible();
  expect(state.removals).toEqual(["88"]);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Existing [attach]88[/attach]",
  );
  await receipt(page, state, info);
});
test("J8.duplicate-upload-id: repeated server ID is uncertain rather than a second independent upload association", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await select(page, "second.txt");
  await upload(page, "second.txt");
  await expect(
    page.getByText("Upload outcome uncertain · second.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toHaveLength(2);
  expect(state.saves).toEqual([]);
  await receipt(page, state, info);
});

test("J8.locale: attachment selection and status follow the interface language", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(page.getByLabel("选择附件", { exact: true })).toBeVisible();
  await expect(
    page.getByText("已选择 · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toHaveLength(0);
  await receipt(page, state, info);
});

test("J8.draft-upload-boundary: draft save refuses new local attachment state before any forum write", async ({
  page,
}, info) => {
  const state = await fixture(page, "new-thread");
  await select(page);
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
  await expect(
    page.getByText(
      "New attachment authoring is not available for forum drafts yet. Keep this writing or remove local selections before saving a draft.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(state.saves).toHaveLength(0);
  expect(state.uploads).toHaveLength(0);
  await receipt(page, state, info);
});

test("J8.local-removal-boundary: acknowledged upload stays visible until explicit server removal or writing discard", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Remove local selection note.txt",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(state.removals).toHaveLength(0);
  await receipt(page, state, info);
});

test("J8.unqualified-native-queue-policy: nonzero native upload limit refuses before transfer", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.uploadLimit = 1;
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Upload refused · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.uploads).toHaveLength(0);
  await receipt(page, state, info);
});

test("J8.repair-selection-crlf: insert after displayed CRLF caret and save exact original bytes", async ({
  page,
}, info) => {
  const original = "[hide]one\r\ntwo[/hide]";
  const state = await fixture(page, "edit", false, original);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.selectText();
  await source.press("ArrowRight");
  await expect
    .poll(() =>
      source.evaluate((el) => (el as HTMLTextAreaElement).selectionStart),
    )
    .toBe(original.length - 1);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const expected = original + "[attach]88[/attach]";
  await expect(source).toHaveValue(expected.replaceAll("\r\n", "\n"));
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(new URLSearchParams(state.saves[0]).get("message")).toBe(expected);
  await receipt(page, state, info);
});
test("J8.repair-selection-cells: attachment insertion preserves selected row structure and unaffected cells", async ({
  page,
}, info) => {
  const original =
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]";
  const state = await fixture(page, "edit", false, original);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const body = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await body.locator("td").first().click();
  await page
    .getByLabel("Table operation", { exact: true })
    .selectOption({ label: "Select row" });
  await page
    .getByRole("button", { name: "Apply table operation", exact: true })
    .click();
  await expect(body.locator(".selectedCell")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await expect(body.locator("td")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  const expected =
    "[table][tr][td][/td][td][attach]88[/attach][/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]";
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    expected,
  );
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(new URLSearchParams(state.saves[0]).get("message")).toBe(expected);
  await receipt(page, state, info);
});
test("J8.repair-selection-composition: attachment insertion waits for composition to finish", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.dispatchEvent("compositionstart", { data: "中" });
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await expect(source).toHaveValue("Existing source");
  await source.dispatchEvent("compositionend", { data: "中" });
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
  await expect
    .poll(async () =>
      page
        .getByRole("button", { name: "Apply formatting", exact: true })
        .isEnabled(),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await expect(source).toHaveValue("[attach]88[/attach]Existing source");
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await receipt(page, state, info);
});

for (const changed of [false, true])
  test(`J8.repair-removal-conflict-${changed}: deletion preserves unrelated edit conflict boundary`, async ({
    page,
  }, info) => {
    const state = await fixture(
      page,
      "edit",
      true,
      combinedSource + "[attach]88[/attach]",
    );
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(combinedSource + "Local text after removing reference");
    if (changed) {
      state.source = "Remote source changed independently";
      state.title = "Remote title";
    }
    await page
      .getByRole("button", {
        name: "Remove server file Attachment 88",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Confirm immediate file removal",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Server file removed · Attachment 88", { exact: true }),
    ).toBeVisible();
    expect(state.removals).toEqual(["88"]);
    expect(state.stored).toEqual([]);
    await page
      .getByRole("button", { name: "Review edit", exact: true })
      .click();
    if (changed) {
      await expect(
        page.getByLabel("Latest server source", { exact: true }),
      ).toHaveValue("Remote source changed independently");
      expect(state.saves).toEqual([]);
      await page
        .getByRole("button", { name: "Save my version", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Accept overwrite and review",
          exact: true,
        })
        .click();
    }
    await page
      .getByRole("button", { name: "Save edited post", exact: true })
      .click();
    await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    expect(state.source).toBe(
      combinedSource + "Local text after removing reference",
    );
    expect(state.saves).toHaveLength(1);
    await receipt(page, state, info);
  });

// Failure inventory: a list read may outlive an observed account change at
// preparation, pre-send validation or removal. Already sent removal must remain
// uncertain. These cases use the normal reader refresh to observe the account;
// no client state is injected. Terminal UI is awaited before effect assertions.
for (const context of ["edit", "new-thread"] as const) {
  for (const phase of ["prepare", "send"] as const) {
    test(`J8.repair-account-${context}-${phase}: account observation during attachment validation prevents stale readiness and writes`, async ({
      page,
    }, info) => {
      const state = await fixture(page, context);
      await select(page);
      await upload(page);
      await expect(
        page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Insert note.txt", exact: true })
        .click();
      const review = page.getByRole("button", {
        name: context === "edit" ? "Review edit" : "Review publication",
        exact: true,
      });
      const send = page.getByRole("button", {
        name: context === "edit" ? "Save edited post" : "Publish thread",
        exact: true,
      });
      if (phase === "send") {
        await review.click();
        await expect(send).toBeVisible();
      }
      let release!: () => void;
      state.listGate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await (phase === "prepare" ? review : send).click();
      await expect.poll(() => state.listWaiting).toBe(true);
      state.member = "8";
      await page
        .getByRole("button", {
          name: context === "edit" ? "Refresh thread" : "Refresh",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Signed in as Writer 8", { exact: true }),
      ).toBeVisible();
      release();
      await expect(
        page.getByRole("button", {
          name: "Check current account and form",
          exact: true,
        }),
      ).toBeEnabled();
      // This button is disabled for the entire pending prepare/send operation.
      // After it re-enables, any forbidden request has already been recorded.
      await receipt(page, state, info);
      expect(state.saves).toEqual([]);
      await expect(send).toHaveCount(0);
      if (phase === "send")
        await expect(
          page.getByText(/Nothing was sent|before send|before save/).first(),
        ).toBeVisible();
    });
  }
}
for (const phase of ["before-delete", "after-delete"] as const) {
  test(`J8.repair-account-removal-${phase}: removal respects account observation across the attachment list`, async ({
    page,
  }, info) => {
    const state = await fixture(page, "edit", phase === "after-delete");
    if (phase === "before-delete") {
      await select(page);
      await upload(page);
      await expect(
        page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
      ).toBeVisible();
    }
    let release!: () => void;
    state.listGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const name = phase === "before-delete" ? "note.txt" : "Attachment 88";
    await page
      .getByRole("button", { name: `Remove server file ${name}`, exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Confirm immediate file removal",
        exact: true,
      })
      .click();
    await expect.poll(() => state.listWaiting).toBe(true);
    expect(state.removals).toEqual(phase === "before-delete" ? [] : ["88"]);
    state.member = "8";
    await page
      .getByRole("button", { name: "Refresh thread", exact: true })
      .click();
    await expect(
      page.getByText("Signed in as Writer 8", { exact: true }),
    ).toBeVisible();
    release();
    await expect(
      page.getByText(`Removing server file · ${name}`, { exact: true }),
    ).toHaveCount(0);
    await receipt(page, state, info);
    expect(state.removals).toEqual(phase === "before-delete" ? [] : ["88"]);
    expect(state.saves).toEqual([]);
    await expect(
      page.getByText(
        `${phase === "before-delete" ? "Uploaded, unassociated" : "Server removal uncertain"} · ${name}`,
        { exact: true },
      ),
    ).toBeVisible();
  });
}

for (const route of [
  "new-thread",
  "reply",
  "reply-merged",
  "quote",
  "edit-opening",
  "edit-reply",
] as const)
  test(`J4.integrated-rich-upload-${route}: rich source options addressed target and association survive appearance recovery and late completion`, async ({
    page,
  }, info) => {
    const edit = route.startsWith("edit-");
    const state = await fixture(
      page,
      edit
        ? "edit"
        : route === "reply-merged"
          ? "reply"
          : (route as "new-thread" | "reply" | "quote"),
      false,
      combinedSource,
      route === "edit-reply" ? "303" : "101",
      route === "reply-merged",
    );
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill(combinedSource);
    await source.press("ControlOrMeta+End");
    await page
      .getByLabel("Find a person to mention", { exact: true })
      .fill("Other author");
    await page
      .getByRole("button", { name: "Find mention", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Mention Other author (UID 8)",
        exact: true,
      })
      .click();
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
    ).toBeVisible();
    await source.focus();
    await source.press("ControlOrMeta+End");
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    const expected =
      combinedSource + "@\u2063Other author\u2063 [attach]88[/attach]";
    await expect(source).toHaveValue(expected);
    await richRoundTrip(page, expected);
    expect(state.saves).toHaveLength(0);
    expect(state.uploads).toHaveLength(1);
    expect(state.removals).toEqual([]);
    await page
      .getByRole("button", {
        name: edit ? "Review edit" : "Review publication",
        exact: true,
      })
      .click();
    let release!: () => void;
    state.saveGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page
      .getByRole("button", {
        name: edit
          ? "Save edited post"
          : route === "new-thread"
            ? "Publish thread"
            : "Send reply",
        exact: true,
      })
      .click();
    await expect.poll(() => state.saves.length).toBe(1);
    await source.fill(expected + "Later local text");
    release();
    if (route === "reply-merged") {
      await expect(
        page.getByLabel("Complete source before sending", { exact: true }),
      ).toHaveValue(combinedSource);
      await expect(
        page.getByLabel("Complete observed result source", { exact: true }),
      ).toHaveValue(
        combinedSource + "\nNative supplement boundary\n" + expected,
      );
      await expect(
        page.getByRole("button", { name: "Check result", exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText("Saved association verified · note.txt", {
          exact: true,
        }),
      ).toBeVisible();
    }
    await expect(source).toHaveValue(expected + "Later local text");
    const sent = new URLSearchParams(state.saves[0]);
    expect(sent.get("message")).toBe(expected);
    expect(sent.get("usesig")).toBe("1");
    if (route === "quote") expect(sent.get("reppid")).toBe("101");
    else expect(sent.has("reppid")).toBe(false);
    expect(state.source).toBe(
      route === "reply-merged"
        ? combinedSource + "\nNative supplement boundary\n" + expected
        : expected,
    );
    expect(state.stored).toEqual(["88"]);
    const command = new URL(
      state.requests.find(
        (r) =>
          r.method === "POST" &&
          new URL(r.url).searchParams.get("mod") === "post",
      )!.url,
    );
    if (edit)
      expect(command.searchParams.get("pid")).toBe(
        route === "edit-reply" ? "303" : "101",
      );
    expect(
      state.requests.some(
        (r) =>
          r.method === "GET" &&
          new URL(r.url).searchParams.get("action") === "edit",
      ),
    ).toBe(true);
    await receipt(page, state, info);
  });

test("J11.integrated-ordinary-upload-copy: current-account copy retains only text and leaves old uploaded file untouched", async ({
  page,
}, info) => {
  const state = await fixture(page, "new-thread", false, combinedSource);
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const source = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  state.member = "8";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await page
    .getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Replace with text copy", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  const writing = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(writing.account.id).toBe("8");
  expect(writing.uploadedReferences).toEqual([]);
  expect(writing.draft).toBeUndefined();
  expect(writing.uploads ?? []).toEqual([]);
  expect(state.saves).toEqual([]);
  expect(state.removals).toEqual([]);
  expect(state.ids).toEqual(["88"]);
  await receipt(page, state, info);
});

test("J5.integrated-upload-replaced-owner: delayed upload cannot install into deliberately replaced rich writing", async ({
  page,
}, info) => {
  const state = await fixture(page, "edit", false, combinedSource);
  let release!: () => void;
  state.uploadGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await select(page);
  await upload(page);
  await expect.poll(() => state.uploads.length).toBe(1);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(combinedSource + "New owner");
  release();
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    combinedSource + "New owner",
  );
  expect(state.saves).toEqual([]);
  expect(state.removals).toEqual([]);
  expect(state.ids).toEqual(["88"]);
  await receipt(page, state, info);
});

for (const explicitEmpty of [false, true])
  test(`J8.review-metadata-${explicitEmpty ? "empty" : "text"}: selected uploaded metadata uses native option value through independent saved readback`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.metadataOption = explicitEmpty
      ? '<option value="" selected>10</option>'
      : "<option selected>10</option>";
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    await save(page);
    await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    expect(
      new URLSearchParams(state.saves[0]).get("attachnew[88][readperm]"),
    ).toBe(explicitEmpty ? "" : "10");
    expect(state.storedReadperm).toBe(explicitEmpty ? "" : "10");
    expect(state.stored).toEqual(["88"]);
    await save(page);
    await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(2);
    expect(
      new URLSearchParams(state.saves[1]).get("attachnew[88][readperm]"),
    ).toBe(explicitEmpty ? "" : "10");
    await receipt(page, state, info);
  });

for (const { transition, language } of [
  ...(["replace", "account-copy", "typing", "read-failure"] as const).map(
    (transition) => ({ transition, language: "en" }),
  ),
  ...(["zh-CN", "zh-TW"] as const).flatMap((language) =>
    (["replace", "read-failure"] as const).map((transition) => ({
      transition,
      language,
    })),
  ),
])
  test(`J8.review-file-read-${transition}-${language}: asynchronous selected bytes stay bound to their originating composition and actor`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await page.evaluate(() => {
      const original = File.prototype.arrayBuffer;
      const external = window as typeof window & {
        releaseFileRead?: () => void;
        fileReadStarted?: boolean;
        failFileRead?: boolean;
      };
      const gate = new Promise<void>((resolve) => {
        external.releaseFileRead = resolve;
      });
      File.prototype.arrayBuffer = async function () {
        const bytes = await original.call(this);
        external.fileReadStarted = true;
        await gate;
        if (external.failFileRead)
          throw new Error("Authored file read failure");
        return bytes;
      };
    });
    await select(page);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { fileReadStarted?: boolean })
              .fileReadStarted,
        ),
      )
      .toBe(true);
    if (transition === "replace") {
      await page
        .getByRole("button", { name: "New thread", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Discard local changes and prepare",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", { name: "New thread in Music", exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Complete source", { exact: true })
        .fill("Replacement composition");
    } else if (transition === "account-copy") {
      state.member = "8";
      await page
        .getByRole("button", {
          name: "Check current account and form",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: "Prepare text copy for current account",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Replace with text copy", exact: true })
        .click();
    } else if (transition === "typing") {
      await page
        .getByLabel("Complete source", { exact: true })
        .fill("Typing while local bytes load");
    } else
      await page.evaluate(() => {
        (window as typeof window & { failFileRead?: boolean }).failFileRead =
          true;
      });
    const before = await page
      .getByLabel("Complete source", { exact: true })
      .inputValue();
    await page.evaluate(() => {
      (window as typeof window & { releaseFileRead?: () => void })
        .releaseFileRead!();
    });
    if (transition === "typing") {
      await expect(
        page.getByText("Selected · note.txt", { exact: true }),
      ).toBeVisible();
      await upload(page);
      await expect(
        page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
      ).toBeVisible();
      expect(state.uploads).toEqual([
        {
          name: "note.txt",
          bytes: Buffer.from("Attachment fixture.\n").toString("hex"),
        },
      ]);
    } else {
      await expect(
        page.getByText(
          transition === "read-failure"
            ? "The selected files could not be read. Select them again."
            : "The writing context or account changed while reading files. Select them again for the current writing.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByText("Selected · note.txt", { exact: true }),
      ).toHaveCount(0);
      expect(state.uploads).toEqual([]);
    }
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(before);
    expect(state.saves).toEqual([]);
    expect(state.removals).toEqual([]);
    if (language !== "en") {
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(language);
      await page.keyboard.press("Escape");
      await expect(
        page.getByText(
          transition === "read-failure"
            ? language === "zh-CN"
              ? "无法读取所选文件。请重新选择。"
              : "無法讀取所選檔案。請重新選擇。"
            : language === "zh-CN"
              ? "读取文件时编辑上下文或账号已改变。请为当前编辑重新选择文件。"
              : "讀取檔案時編輯內容或帳號已改變。請為目前編輯重新選擇檔案。",
          { exact: true },
        ),
      ).toBeVisible();
    }
    await receipt(page, state, info);
  });

for (const language of ["zh-CN", "zh-TW"] as const) {
  const simple = language === "zh-CN";
  for (const scenario of [
    "publication-blocker",
    "draft-blocker",
    "upload-recovery",
    "removal-recovery",
    "removal-confirmed",
  ] as const)
    test(`J8.review-locale-${language}-${scenario}: authored attachment instructions follow the actual presentation path without replay`, async ({
      page,
    }, info) => {
      const state = await fixture(
        page,
        scenario.includes("blocker") ? "new-thread" : "edit",
        scenario.startsWith("removal"),
      );
      let release = () => {};
      if (scenario === "upload-recovery")
        state.uploadGate = new Promise<void>((resolve) => {
          release = resolve;
        });
      if (scenario === "removal-recovery")
        state.removalGate = new Promise<void>((resolve) => {
          release = resolve;
        });
      if (!scenario.startsWith("removal")) await select(page);
      if (scenario === "upload-recovery") {
        await upload(page);
        await expect.poll(() => state.uploads.length).toBe(1);
        await page.reload();
        release();
      }
      if (scenario.startsWith("removal")) {
        await page
          .getByRole("button", {
            name: "Remove server file Attachment 88",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: "Confirm immediate file removal",
            exact: true,
          })
          .click();
        await expect.poll(() => state.removals.length).toBe(1);
        if (scenario === "removal-recovery") {
          await page.reload();
          release();
        } else
          await expect(
            page.getByText("Server file removed · Attachment 88", {
              exact: true,
            }),
          ).toBeVisible();
      }
      if (scenario.includes("blocker"))
        await page
          .getByRole("button", {
            name:
              scenario === "draft-blocker"
                ? "Save forum draft"
                : "Review publication",
            exact: true,
          })
          .click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(language);
      await page.keyboard.press("Escape");
      const expected = {
        "publication-blocker": simple
          ? "请完成上传或明确移除待处理的选择后再提交。"
          : "請完成上傳或明確移除待處理的選擇後再提交。",
        "draft-blocker": simple
          ? "论坛草稿暂不支持新附件编辑。请保留当前编辑，或移除本地选择后再保存草稿。"
          : "論壇草稿暫不支援新附件編輯。請保留目前編輯，或移除本機選擇後再儲存草稿。",
        "upload-recovery": simple
          ? "上传可能已存储在论坛。未重放任何上传。"
          : "上傳可能已儲存在論壇。未重播任何上傳。",
        "removal-recovery": simple
          ? "移除可能已发生。请检查结果；未重放任何操作。"
          : "移除可能已發生。請檢查結果；未重播任何操作。",
        "removal-confirmed": simple
          ? "已验证服务器文件移除。正文引用是独立内容；保存前请移除任何剩余标签。"
          : "已驗證伺服器檔案移除。正文引用是獨立內容；儲存前請移除任何剩餘標籤。",
      }[scenario];
      await expect(
        page.getByText(expected, { exact: true }).first(),
      ).toBeVisible();
      expect(state.saves).toEqual([]);
      expect(state.uploads).toHaveLength(
        scenario === "upload-recovery" ? 1 : 0,
      );
      expect(state.removals).toHaveLength(
        scenario.startsWith("removal") ? 1 : 0,
      );
      const retained = await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .source,
      );
      expect(retained).toBe(
        scenario.startsWith("removal")
          ? "Existing [attach]88[/attach]"
          : "Existing source",
      );
      await receipt(page, state, info);
    });
}

for (const language of ["zh-CN", "zh-TW"] as const)
  test(`J8.review-locale-${language}-stored-file-refusal: existing download explanations remain translated in the new attachment row`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    await save(page);
    await expect(
      page.getByText("Saved association verified · note.txt", { exact: true }),
    ).toBeVisible();
    state.stored = [];
    await page
      .getByRole("button", { name: "Check stored bytes note.txt", exact: true })
      .click();
    await expect(
      page.getByText(
        "The forum no longer offers this attachment for direct download. No purchase was attempted.",
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption(language);
    await page.keyboard.press("Escape");
    await expect(
      page.getByText(
        language === "zh-CN"
          ? "论坛已不再提供此附件的直接下载。未尝试购买。"
          : "論壇已不再提供此附件的直接下載。未嘗試購買。",
        { exact: true },
      ),
    ).toBeVisible();
    expect(state.uploads).toHaveLength(1);
    expect(state.saves).toHaveLength(1);
    expect(state.removals).toEqual([]);
    await receipt(page, state, info);
  });

for (const scenario of [
  "edit",
  "new-thread",
  "reply",
  "quote",
  "quota",
  "count",
  "size",
  "type",
  "actor",
  "status",
  "duplicate",
  "malformed",
] as const)
  test(`J8.native-policy-${scenario}: exact current native form policy governs upload when JSON omits the initializer`, async ({
    page,
  }, info) => {
    const succeeds =
      scenario === "edit" ||
      scenario === "new-thread" ||
      scenario === "reply" ||
      scenario === "quote";
    const context = succeeds ? scenario : "edit";
    const state = await fixture(page, context);
    const native: string[] = JSON.parse(
      readFileSync("tests/fixtures/native-attachment-inline.json", "utf8"),
    );
    state.uploadInitializer = "";
    state.nativeJSON = {
      attach: JSON.parse(
        readFileSync("tests/fixtures/native-attachment-policy.json", "utf8"),
      ),
    };
    state.nativeUploadInitializer = native
      .join("\n")
      .replaceAll("&fid=4", "&fid=5");
    if (scenario === "quota")
      state.nativeUploadInitializer = state.nativeUploadInitializer.replaceAll(
        "maxSizePerDay: 3072000",
        "maxSizePerDay: 70",
      );
    if (scenario === "count")
      state.nativeUploadInitializer = state.nativeUploadInitializer.replaceAll(
        "maxSizePerDay: 3072000",
        "maxAttachNum: 0, maxSizePerDay: 3072000",
      );
    if (scenario === "size")
      state.nativeUploadInitializer = state.nativeUploadInitializer.replaceAll(
        'file_size_limit : "512"',
        'file_size_limit : "0.01"',
      );
    if (scenario === "type")
      state.nativeUploadInitializer = state.nativeUploadInitializer.replace(
        "*.PNG;",
        "",
      );
    if (scenario === "actor") state.nativeActor = "8";
    if (scenario === "status") state.nativeStatus = 403;
    if (scenario === "duplicate")
      state.nativeUploadInitializer += state.nativeUploadInitializer;
    if (scenario === "malformed")
      state.nativeUploadInitializer = state.nativeUploadInitializer.replaceAll(
        'file_size_limit : "512"',
        'file_size_limit : "dynamic"',
      );
    const original = await page
      .getByLabel("Complete source", { exact: true })
      .inputValue();
    const bytes = readFileSync("tests/fixtures/native-attachment-pixel.PNG");
    await select(page, "pixel.PNG", bytes, "image/png");
    await upload(page, "pixel.PNG");
    if (succeeds) {
      const refusal = page.getByText(
        "Current upload limits or authorization are unavailable. Nothing was uploaded.",
        { exact: true },
      );
      await expect
        .poll(
          async () => state.uploads.length === 1 || (await refusal.count()) > 0,
        )
        .toBe(true);
      await receipt(page, state, info);
      await expect(refusal).toHaveCount(0);
      await expect(
        page.getByText("Uploaded, unassociated · pixel.PNG", { exact: true }),
      ).toBeVisible();
      expect(state.uploads).toEqual([
        { name: "pixel.PNG", bytes: bytes.toString("hex") },
      ]);
      expect(state.nativeFormReads).toHaveLength(2);
      const preflight = new URL(state.nativeFormReads[0]!);
      expect(preflight.searchParams.get("fid")).toBe("5");
      expect(preflight.searchParams.has("tsdmapp")).toBe(false);
      expect(preflight.searchParams.get("action")).toBe(
        context === "edit"
          ? "edit"
          : context === "new-thread"
            ? "newthread"
            : "reply",
      );
      if (context === "edit")
        expect(preflight.searchParams.get("pid")).toBe("101");
      if (context === "quote")
        expect(preflight.searchParams.get("reppost")).toBe("101");
    } else {
      await expect(
        page.getByText("Upload refused · pixel.PNG", { exact: true }),
      ).toBeVisible();
      expect(state.uploads).toEqual([]);
      await receipt(page, state, info);
      expect(state.nativeFormReads).toHaveLength(1);
      if (["quota", "count"].includes(scenario))
        await expect(
          page.getByText(
            "The current attachment count or daily quota is exhausted.",
            { exact: true },
          ),
        ).toBeVisible();
      if (scenario === "size")
        await expect(
          page.getByText("The file exceeds the current size limit.", {
            exact: true,
          }),
        ).toBeVisible();
      if (scenario === "type")
        await expect(
          page.getByText("The current form does not permit this file type.", {
            exact: true,
          }),
        ).toBeVisible();
    }
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original);
    expect(state.saves).toEqual([]);
    expect(state.removals).toEqual([]);
  });

// Observed native JPEG contract: insertion is attachimg, even from the generic
// upload surface. Server source readback canonicalizes a generic attach tag.
for (const mode of ["source", "visual", "recovered", "generic-mime"] as const)
  test(`J8.image-instruction-${mode}: native insertion kind survives actual Insert and exact saved readback`, async ({
    page,
  }, info) => {
    const state = await fixture(page, "edit", false, "Prefix [b]kept[/b] tail");
    state.insertionMarkup = `<a id="attachname88" onclick="insertAttachimgTag('88');hideMenu('attach_preview_88_menu');doane(event);">native image</a>`;
    state.normalizeImageTag = true;
    await select(
      page,
      "picture.bin",
      Buffer.from([1, 2, 3]),
      mode === "generic-mime" ? "application/octet-stream" : "image/jpeg",
    );
    // The independent native form permits this synthetic extension; the MIME
    // alone must not determine the source reference kind.
    state.uploadInitializer = `var upload = new SWFUpload({upload_url:'misc.php?mod=swfupload&action=swfupload&operation=upload&fid=5',post_params:{uid:'7',hash:'PRIVATE_UPLOAD'},file_size_limit:'512',file_types:'*.bin',custom_settings:{uploadSource:'forum',uploadType:'attach',maxSizePerDay:3000000}});`;
    await upload(page, "picture.bin");
    await expect(
      page.getByText("Uploaded, unassociated · picture.bin", { exact: true }),
    ).toBeVisible();
    if (mode === "recovered") await page.reload();
    if (mode === "visual") {
      await page
        .getByRole("button", { name: "Visual editor", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Visual post content", exact: true })
        .click();
      await page.keyboard.press("Meta+End");
    } else {
      const source = page.getByLabel("Complete source", { exact: true });
      await source.selectText();
      await source.press("ArrowRight");
    }
    await page
      .getByRole("button", { name: "Insert picture.bin", exact: true })
      .click();
    if (mode === "visual")
      await page
        .getByRole("button", { name: "Source editor", exact: true })
        .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Prefix [b]kept[/b] tail[attachimg]88[/attachimg]");
    await expect(
      page.getByText("Inline referenced · picture.bin", { exact: true }),
    ).toBeVisible();
    await save(page);
    await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    expect(new URLSearchParams(state.saves[0]).get("message")).toBe(
      "Prefix [b]kept[/b] tail[attachimg]88[/attachimg]",
    );
    expect(state.source).toBe(
      "Prefix [b]kept[/b] tail[attachimg]88[/attachimg]",
    );
    expect(state.saves).toHaveLength(1);
    expect(state.removals).toEqual([]);
    await receipt(page, state, info);
  });

for (const instruction of [
  "missing",
  "wrong-id",
  "dynamic",
  "conflicting",
  "duplicate",
] as const)
  test(`J8.image-instruction-invalid-${instruction}: unqualified native instruction never guesses an insertion kind`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.insertionMarkup =
      instruction === "missing"
        ? "No instruction"
        : instruction === "wrong-id"
          ? `<a onclick="insertAttachimgTag('99');">wrong</a>`
          : instruction === "dynamic"
            ? `<a onclick="insertAttachimgTag(currentId);">dynamic</a>`
            : instruction === "duplicate"
              ? `<a onclick="insertAttachimgTag('88');">one</a><a onclick="insertAttachimgTag('88');">two</a>`
              : `<a onclick="insertAttachTag('88');">file</a><a onclick="insertAttachimgTag('88');">image</a>`;
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Upload outcome uncertain · note.txt", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Insert note.txt", exact: true }),
    ).toHaveCount(0);
    expect(state.uploads).toHaveLength(1);
    expect(state.saves).toEqual([]);
    expect(state.removals).toEqual([]);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Existing source");
    await receipt(page, state, info);
  });

for (const phase of ["review", "send"] as const)
  test(`J8.image-instruction-drift-${phase}: fresh instruction changes block stale reference publication`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await select(page);
    await upload(page);
    await expect(
      page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    if (phase === "send") {
      await page
        .getByRole("button", { name: "Review edit", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Save edited post", exact: true }),
      ).toBeVisible();
    }
    state.insertionMarkup = `<a onclick="insertAttachimgTag('88');">image</a>`;
    await page
      .getByRole("button", {
        name: phase === "review" ? "Review edit" : "Save edited post",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Check current account and form",
        exact: true,
      }),
    ).toBeEnabled();
    expect(state.saves).toEqual([]);
    await expect(
      page.getByRole("button", { name: "Save edited post", exact: true }),
    ).toHaveCount(0);
    await receipt(page, state, info);
  });

test("J8.image-instruction-generic-control: native generic instruction overrides image MIME without conversion", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await select(page, "picture.jpg", Buffer.from([1, 2, 3]), "image/jpeg");
  await upload(page, "picture.jpg");
  await expect(
    page.getByText("Uploaded, unassociated · picture.jpg", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert picture.jpg", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[attach]88[/attach]Existing source",
  );
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await receipt(page, state, info);
});

test("J8.image-instruction-arbitrary-normalization: unrelated stored rewriting remains uncertain", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.rewriteSource = true;
  await select(page);
  await upload(page);
  await expect(
    page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await save(page);
  await expect(page.getByText(/No confirmation is claimed/)).toBeVisible();
  expect(state.saves).toHaveLength(1);
  await receipt(page, state, info);
});

test("J8.image-instruction-original-loop: actual image Insert and Save confirms exact authoritative source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.insertionMarkup = `<a id="attachname88" onclick="insertAttachimgTag('88');hideMenu('attach_preview_88_menu');doane(event);">picture.jpg</a>`;
  state.normalizeImageTag = true;
  await select(page, "picture.jpg", Buffer.from([1, 2, 3]), "image/jpeg");
  await upload(page, "picture.jpg");
  await expect(
    page.getByText("Uploaded, unassociated · picture.jpg", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert picture.jpg", exact: true })
    .click();
  await save(page);
  await expect.poll(() => state.saves.length).toBe(1);
  await receipt(page, state, info);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(new URLSearchParams(state.saves[0]).get("message")).toBe(state.source);
});

for (const language of ["en", "zh-CN", "zh-TW"] as const)
  test(`J8.image-instruction-unknown-${language}: rows without qualified insertion metadata preserve writing with explicit native continuation`, async ({
    page,
  }, info) => {
    const state = await fixture(page, "edit", true);
    const before = await page
      .getByLabel("Complete source", { exact: true })
      .inputValue();
    await page
      .getByRole("button", { name: "Insert Attachment 88", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(before);
    if (language !== "en") {
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(language);
      await page.keyboard.press("Escape");
    }
    await expect(
      page.getByText(
        language === "en"
          ? "This attachment has no verified insertion instruction. Continue in the native editor."
          : language === "zh-CN"
            ? "此附件没有已验证的插入指令。请在原生编辑器中继续。"
            : "此附件沒有已驗證的插入指令。請在原生編輯器中繼續。",
        { exact: true },
      ),
    ).toBeVisible();
    expect(state.uploads).toEqual([]);
    expect(state.saves).toEqual([]);
    expect(state.removals).toEqual([]);
    await receipt(page, state, info);
  });
