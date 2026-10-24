import { combinedSource, richRoundTrip } from "./combined-authoring";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const origin = "https://www.tsdm39.com";
const thread = `${origin}/forum.php?mod=viewthread&tid=42`;
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const bytes = Buffer.from("Draft attachment authored fixture.\n");
async function fixture(page: Page) {
  const state = {
    saved: null as URLSearchParams | null,
    files: new Map<string, { name: string; bytes: Buffer }>(),
    associated: [] as string[],
    commands: [] as { url: string; body: string }[],
    reads: [] as string[],
    uploads: [] as string[],
    removals: [] as string[],
    member: "7",
    published: false,
    association: true,
    uploadOutcome: "accepted",
    saveOutcome: "accepted",
    publicationOutcome: "published",
    publicationMissingAssociation: false,
    updateSentinel: false,
    bareUpdateSentinel: false,
    savedPrice: null as string | null,
    pendingPrice: "",
    nativeReadperm: false,
    referenceKind: "attach" as "attach" | "attachimg",
    listMissing: false,
    uploadGate: null as Promise<void> | null,
    saveGate: null as Promise<void> | null,
    listGate: null as Promise<void> | null,
    listWaiting: false,
    readFailure: false,
    afterRemovalMember: "",
    formChange: (s: string) => s,
    afterSaveSource: "",
    otherDraft: false,
  };
  const actor = () =>
    `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
  const board =
    '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
  const fields = (id: string, stored = false) =>
    `<input name="attachnew[${id}][description]" value=""><select name="attachnew[${id}][readperm]"><option value=""${stored && state.nativeReadperm ? "" : " selected"}>All</option>${stored && state.nativeReadperm ? '<option value="1">One</option><option value="1">Another group</option><option value="10">Ten</option>' : ""}</select><input name="attachnew[${id}][price]" value="${stored ? (state.savedPrice ?? state.pendingPrice) : state.pendingPrice}">`;
  const form = (edit: boolean) =>
    state.formChange(
      `${actor()}${board}<form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit&tid=42&pid=101&editsubmit=yes" : "newthread&topicsubmit=yes"}&fid=5"><input type="hidden" name="formhash" value="PRIVATE"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="save" id="postsave" value=""><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button><input name="subject" value="${esc(edit ? (state.saved?.get("subject") ?? "") : "")}"><textarea name="message">${esc(edit ? (state.saved?.get("message") ?? "") : "")}</textarea><select name="typeid"><option value="3" selected>Listening</option></select><label><input type="checkbox" name="usesig" value="1"${!edit || state.saved?.has("usesig") ? " checked" : ""}>Signature</label><input name="price" value="0"><button name="${edit ? "editsubmit" : "topicsubmit"}" type="submit" value="yes">Save</button></form><div id="e_attachlist">${
        edit
          ? state.associated
              .filter((id) => state.files.has(id))
              .map(
                (id) =>
                  (state.updateSentinel
                    ? `<input type="hidden" name="attachupdate[${id}]"${state.bareUpdateSentinel ? "" : ' value=""'}>`
                    : "") + fields(id, true),
              )
              .join("")
          : ""
      }</div><script>var upload = new SWFUpload({upload_url:'misc.php?mod=swfupload&action=swfupload&operation=upload&fid=5',post_params:{uid:'${state.member}',hash:'PRIVATE_UPLOAD'},file_upload_limit:0,file_queue_limit:0,file_size_limit:'512',file_types:'*.jpg;*.jpeg;*.PNG;*.gif;*.txt',custom_settings:{uploadSource:'forum',uploadType:'attach',maxSizePerDay:3000000,maxAttachNum:5,filterType:{txt:524288}}});</script>`,
    );
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    if (url.pathname === "/misc.php") {
      const raw = request.postDataBuffer()!,
        boundary = request.headers()["content-type"]!.split("boundary=")[1]!;
      const part = raw
        .toString("latin1")
        .split("--" + boundary)
        .find((p) => p.includes('name="Filedata"'))!;
      const name = /filename="([^"]+)"/.exec(part)![1]!,
        data = Buffer.from(part.split("\r\n\r\n")[1]!.slice(0, -2), "latin1");
      state.uploads.push(name);
      if (state.uploadOutcome === "rejected")
        return route.fulfill({ contentType: "text/plain", body: "-1" });
      const id = String(88 + state.files.size);
      state.files.set(id, { name, bytes: data });
      if (state.uploadGate) await state.uploadGate;
      if (state.uploadOutcome === "lost") return route.abort();
      return route.fulfill({ contentType: "text/plain", body: id });
    }
    if (url.searchParams.get("action") === "attachlist") {
      state.reads.push(url.href);
      if (state.listGate) {
        state.listWaiting = true;
        await state.listGate;
      }
      const id = url.searchParams.get("aids")!;
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[${!state.listMissing && state.files.has(id) ? `<table><tbody><tr><td><a onclick="${state.referenceKind === "attachimg" ? "insertAttachimgTag" : "insertAttachTag"}('${id}');">${esc(state.files.get(id)!.name)}</a></td><td>${fields(id)}</td></tr></tbody></table>` : ""}]]></root>`,
      });
    }
    if (url.searchParams.get("action") === "deleteattach") {
      const id = url.searchParams.get("aids[]")!;
      state.removals.push(url.href);
      state.files.delete(id);
      state.associated = state.associated.filter((v) => v !== id);
      if (state.afterRemovalMember) state.member = state.afterRemovalMember;
      if (state.saveOutcome === "delete-lost") {
        state.readFailure = true;
        return route.abort();
      }
      return route.fulfill({
        contentType: "text/xml",
        body: "<root><![CDATA[]]></root>",
      });
    }
    if (request.method() === "POST") {
      const data = new URLSearchParams(request.postData() ?? "");
      state.commands.push({ url: url.href, body: data.toString() });
      if (state.saveOutcome === "rejected")
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>",
        });
      state.saved = new URLSearchParams(data);
      if (state.afterSaveSource)
        state.saved.set("message", state.afterSaveSource);
      if (state.association)
        state.associated = [...state.files.keys()].filter((id) =>
          data.has(`attachnew[${id}][description]`),
        );
      if (data.get("save") !== "1") {
        state.published = state.publicationOutcome === "published";
        if (state.publicationMissingAssociation) state.associated = [];
      }
      if (state.saveGate) await state.saveGate;
      if (state.saveOutcome === "lost") return route.abort();
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('${thread}', '${data.get("save") !== "1" && state.publicationOutcome === "moderation" ? "主题需要审核" : "Stored"}', {});</script>]]></root>`,
      });
    }
    state.reads.push(url.href);
    if (state.readFailure) return route.abort();
    if (url.searchParams.get("mod") === "attachment") {
      const file = state.files.get(url.searchParams.get("aid")!);
      return route.fulfill({
        status: file ? 200 : 404,
        contentType: "application/octet-stream",
        headers: {
          "content-disposition": `attachment; filename="${file?.name ?? "missing"}"`,
          "content-length": String(file?.bytes.length ?? 7),
        },
        body: file?.bytes ?? Buffer.from("missing"),
      });
    }
    let body = actor() + board;
    if (url.pathname === "/home.php")
      body += `<a class="a" href="home.php?mod=space&do=thread&view=me&type=thread&filter=save">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${state.saved && !state.published ? `<tr><th><a href="forum.php?mod=viewthread&tid=42">${esc(state.saved.get("subject")!)}</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>` : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form></div>`;
    else if (url.searchParams.get("mod") === "post")
      body = form(url.searchParams.get("action") === "edit");
    else if (url.searchParams.get("mod") === "viewthread")
      body += `<div id="postlist"><h1><span id="thread_subject">${esc(state.saved?.get("subject") ?? "")}</span>${state.published ? "" : '<span class="xg1">(草稿)</span>'}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">Stored source ${state.associated
        .filter((id) => state.files.has(id))
        .map(
          (id) =>
            `<span id="attach_${id}"><a href="forum.php?mod=attachment&aid=${id}">${esc(state.files.get(id)!.name)}</a></span>`,
        )
        .join(
          "",
        )}</div><div class="po"><div class="pob">${state.published ? "" : '<a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a>'}</div></div></div></div>`;
    else
      body +=
        '<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=5">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_9"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=9">Existing thread</a></th></tr></tbody></table>';
    if (state.otherDraft && url.pathname === "/home.php")
      body = body.replace(
        "</tbody>",
        '<tr><th><a href="forum.php?mod=viewthread&tid=43">Other candidate</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr></tbody>',
      );
    if (url.searchParams.get("tid") === "43")
      body = body
        .replaceAll("tid=42", "tid=43")
        .replaceAll("pid=101", "pid=102")
        .replaceAll("post_101", "post_102")
        .replaceAll("postnum101", "postnum102");
    // The accepted native form owns upload policy; JSON omits its initializer.
    if (url.searchParams.get("tsdmapp") === "json")
      body = body.replace(
        /<script>var upload = new SWFUpload[\s\S]*?<\/script>/,
        "",
      );
    return route.fulfill({ contentType: "text/html", body });
  });
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Uploaded draft");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[unknown]Draft source[/unknown]");
  return state;
}
async function select(page: Page, name = "note.txt") {
  await page
    .getByLabel("Select attachments", { exact: true })
    .setInputFiles({ name, mimeType: "text/plain", buffer: bytes });
}
async function upload(page: Page, name = "note.txt") {
  await select(page, name);
  await page
    .getByRole("button", { name: `Upload ${name}`, exact: true })
    .click();
  await expect(
    page.getByText(`Uploaded, unassociated · ${name}`, { exact: true }),
  ).toBeVisible();
}
async function save(page: Page) {
  await page
    .getByRole("button", { name: "Save forum draft", exact: true })
    .click();
}
async function evidence(
  page: Page,
  info: TestInfo,
  state: Awaited<ReturnType<typeof fixture>>,
) {
  await info.attach("independent-draft-files-effects.json", {
    body: Buffer.from(
      JSON.stringify({
        ...state,
        saved: state.saved && Object.fromEntries(state.saved),
        files: [...state.files].map(([id, f]) => ({
          id,
          name: f.name,
          sha256: createHash("sha256").update(f.bytes).digest("hex"),
          hex: f.bytes.toString("hex"),
        })),
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("draft-attachments.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test("J6.J8.draft-upload-lifecycle: upload save resume revise resave publish preserves identity source options and independently associated bytes", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(combinedSource);
  await upload(page);
  expect(state.associated).toEqual([]);
  expect(state.saved).toBeNull();
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const combined = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  await richRoundTrip(page, combined);
  expect(state.commands).toHaveLength(0);
  const source = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  expect(state.associated).toEqual(["88"]);
  expect(state.saved?.get("message")).toBe(source);
  expect(state.saved?.get("posttime")).toBe("1792550000");
  expect(state.saved?.get("typeid")).toBe("3");
  expect(state.saved?.get("usesig")).toBe("1");
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  page = await page.context().newPage();
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume Uploaded draft", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await upload(page, "second.txt");
  await page
    .getByRole("button", { name: "Insert second.txt", exact: true })
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Revised uploaded draft");
  const revised = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect.poll(() => state.associated).toEqual(["88", "89"]);
  expect(state.saved?.get("message")).toBe(revised);
  await expect(
    page.getByText("Saved association verified · second.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).last(),
  ).toBeVisible();
  expect(state.commands).toHaveLength(3);
  expect(
    state.commands.map((c) => new URL(c.url).searchParams.get("action")),
  ).toEqual(["newthread", "edit", "edit"]);
  expect(
    state.commands
      .slice(1)
      .every(
        (c) =>
          new URL(c.url).searchParams.get("tid") === "42" &&
          new URL(c.url).searchParams.get("pid") === "101",
      ),
  ).toBe(true);
  expect(state.published).toBe(true);
  expect(state.associated).toEqual(["88", "89"]);
  expect(state.files.get("88")!.bytes.equals(bytes)).toBe(true);
  await evidence(page, info, state);
});

test("J6.J8.pending-upload-draft-guards: held and cancelled uploads cannot save publish or attach late", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  let release!: () => void;
  state.uploadGate = new Promise<void>((r) => {
    release = r;
  });
  await select(page);
  await page
    .getByRole("button", { name: "Upload note.txt", exact: true })
    .click();
  await expect.poll(() => state.uploads.length).toBe(1);
  await save(page);
  await expect(
    page.getByText(
      "Finish uploads or explicitly remove pending selections before saving or publishing a draft.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  expect(state.commands).toHaveLength(1);
  await page
    .getByRole("button", {
      name: "Remove local selection note.txt",
      exact: true,
    })
    .click();
  release();
  await expect(
    page.getByRole("button", { name: "Insert note.txt", exact: true }),
  ).toHaveCount(0);
  expect(state.files.size).toBe(1);
  expect(state.associated).toEqual([]);
  expect(state.removals).toEqual([]);
  await evidence(page, info, state);
});
test("J6.J8.draft-upload-refusal: resumed draft upload refusal retains source and existing association", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.uploadOutcome = "rejected";
  await select(page, "second.txt");
  await page
    .getByRole("button", { name: "Upload second.txt", exact: true })
    .click();
  await expect(
    page.getByText("The forum refused this upload.", { exact: true }),
  ).toBeVisible();
  await save(page);
  expect(state.commands).toHaveLength(1);
  expect(state.associated).toEqual(["88"]);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await evidence(page, info, state);
});
test("J6.J8.expired-reference-before-draft-save: missing pending file prevents a save without discarding text", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  state.files.delete("88");
  await save(page);
  await expect(
    page.getByText(/current attachment references changed/),
  ).toBeVisible();
  expect(state.commands).toEqual([]);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await evidence(page, info, state);
});
test("J6.J8.draft-attachment-change-conflict: remote source and metadata drift cannot be accepted as a new upload delta", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await upload(page, "second.txt");
  state.saved!.set("message", "Changed by another session");
  state.formChange = (s) =>
    s.replace(
      'name="attachnew[88][description]" value=""',
      'name="attachnew[88][description]" value="Remote metadata"',
    );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Local retained revision");
  await save(page);
  await expect(page.getByText(/remote draft changed/)).toBeVisible();
  expect(state.commands).toHaveLength(1);
  expect(state.saved!.get("message")).toBe("Changed by another session");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Local retained revision",
  );
  await evidence(page, info, state);
});
test("J6.J8.draft-validation-account-barrier: account change while pending attachment list waits prevents any save", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  let release!: () => void;
  state.listGate = new Promise<void>((r) => {
    release = r;
  });
  await save(page);
  await expect.poll(() => state.listWaiting).toBe(true);
  state.member = "8";
  release();
  await expect(
    page.getByText(/account changed during attachment validation/i),
  ).toBeVisible();
  expect(state.commands).toEqual([]);
  expect(state.associated).toEqual([]);
  await evidence(page, info, state);
});

test("J6.J8.draft-association-unconfirmed: known draft content survives missing association and check confirms only original files", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const original = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  state.association = false;
  await save(page);
  await expect(
    page.getByText(
      /Draft 42 observed; submitted content confirmed; attachment associations unconfirmed/,
    ),
  ).toBeVisible();
  expect(state.saved!.get("message")).toBe(original);
  expect(state.associated).toEqual([]);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " later writing");
  await upload(page, "second.txt");
  state.associated = ["88"];
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.commands).toHaveLength(1);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " later writing",
  );
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Uploaded, unassociated · second.txt", { exact: true }),
  ).toBeVisible();
  await evidence(page, info, state);
});

test("J6.J8.draft-reference-removal: removing source token leaves server bytes and association intact", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Source without inline attachment");
  await save(page);
  await expect.poll(() => state.commands.length).toBe(2);
  await expect
    .poll(() => state.saved!.get("message"))
    .toBe("Source without inline attachment");
  expect(state.files.size).toBe(1);
  expect(state.associated).toEqual(["88"]);
  expect(state.removals).toEqual([]);
  await evidence(page, info, state);
});
test("J6.J8.draft-server-file-removal: immediate removal targets draft and only adjusts its original attachment baseline", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByRole("button", { name: "Remove server file note.txt", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep server file", exact: true })
    .click();
  expect(state.removals).toEqual([]);
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
  expect(state.commands).toHaveLength(1);
  expect(state.files.size).toBe(0);
  expect(state.removals).toHaveLength(1);
  expect(new URL(state.removals[0]!).searchParams.get("tid")).toBe("42");
  expect(new URL(state.removals[0]!).searchParams.get("pid")).toBe("101");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("After deliberate file removal");
  await save(page);
  await expect.poll(() => state.commands.length).toBe(2);
  expect(state.saved!.get("message")).toBe("After deliberate file removal");
  await evidence(page, info, state);
});

for (const variation of [
  "remote-conflict",
  "lost-readback",
  "account-change",
] as const)
  test(`J6.J8.draft-server-file-removal-${variation}: original baseline and uncertainty survive immediate effect`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await upload(page);
    await save(page);
    await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    if (variation === "remote-conflict")
      state.saved!.set("message", "Remote concurrent change");
    if (variation === "lost-readback") state.saveOutcome = "delete-lost";
    if (variation === "account-change") state.afterRemovalMember = "8";
    await page
      .getByRole("button", { name: "Remove server file note.txt", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Confirm immediate file removal",
        exact: true,
      })
      .click();
    if (variation === "remote-conflict") {
      await expect(
        page.getByText("Server file removed · note.txt", { exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Complete source", { exact: true })
        .fill("Local conflict kept");
      await save(page);
      await expect(page.getByText(/remote draft changed/)).toBeVisible();
      expect(state.saved!.get("message")).toBe("Remote concurrent change");
    } else {
      await expect(
        page.getByText("Server removal uncertain · note.txt", { exact: true }),
      ).toBeVisible();
      if (variation === "lost-readback") {
        state.readFailure = false;
        await page
          .getByRole("button", {
            name: "Check file removal result",
            exact: true,
          })
          .click();
        await expect(
          page.getByText("Server file removed · note.txt", { exact: true }),
        ).toBeVisible();
      }
    }
    expect(state.commands).toHaveLength(1);
    expect(state.removals).toHaveLength(1);
    expect(state.files.size).toBe(0);
    await evidence(page, info, state);
  });
test("J6.J8.draft-save-loss-and-later-edits: original uploaded revision check never resaves or replaces newer source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await upload(page);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const sent = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  state.saveOutcome = "lost";
  await save(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(sent + " later");
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.commands).toHaveLength(2);
  expect(state.saved!.get("message")).toBe(sent);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    sent + " later",
  );
  await evidence(page, info, state);
});
for (const stage of ["selected", "uploaded", "pending-save"] as const)
  test(`J6.J8.draft-upload-recovery-${stage}: reload retains context without bytes credentials or automatic effects`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await save(page);
    await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    let release = () => {};
    if (stage === "selected") await select(page);
    else await upload(page);
    if (stage === "pending-save") {
      state.saveGate = new Promise<void>((r) => {
        release = r;
      });
      await save(page);
      await expect.poll(() => state.commands.length).toBe(2);
    }
    const record = await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    expect(record).not.toContain(bytes.toString());
    expect(record).not.toContain("PRIVATE_UPLOAD");
    expect(record).not.toContain('"PRIVATE"');
    await page.reload();
    release();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]Draft source[/unknown]");
    if (stage === "selected")
      await expect(
        page.getByText("Reselect file bytes · note.txt", { exact: true }),
      ).toBeVisible();
    if (stage === "uploaded") {
      await expect(
        page.getByText("Uploaded, unassociated · note.txt", { exact: true }),
      ).toBeVisible();
      state.files.delete("88");
      await page
        .getByRole("button", {
          name: "Check current account and form",
          exact: true,
        })
        .click();
      await save(page);
      await expect(
        page.getByText(/current attachment references changed/),
      ).toBeVisible();
    }
    if (stage === "pending-save") {
      await expect(
        page.getByText(/Pending draft save restored as uncertain/),
      ).toBeVisible();
      await page
        .getByRole("button", { name: /Check original draft attempt/ })
        .click();
      await expect(
        page.getByText("Saved association verified · note.txt", {
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(state.commands).toHaveLength(stage === "pending-save" ? 2 : 1);
    expect(state.uploads).toHaveLength(stage === "selected" ? 0 : 1);
    expect(state.removals).toEqual([]);
    await info.attach("acknowledged-recovery.json", {
      body: Buffer.from(record),
      contentType: "application/json",
    });
    await evidence(page, info, state);
  });

for (const outcome of [
  "remaining-draft",
  "moderation",
  "missing-association",
  "lost",
] as const)
  test(`J6.J8.draft-publish-component-outcomes-${outcome}: same target and independent attachment observation never imply another publication`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await upload(page);
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    await save(page);
    await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    if (outcome === "remaining-draft" || outcome === "moderation")
      state.publicationOutcome = outcome;
    if (outcome === "missing-association")
      state.publicationMissingAssociation = true;
    if (outcome === "lost") state.saveOutcome = "lost";
    await page
      .getByRole("button", { name: "Publish saved draft", exact: true })
      .click();
    if (outcome === "remaining-draft")
      await expect(
        page.getByText(/record is still an unpublished forum draft/).last(),
      ).toBeVisible();
    if (outcome === "moderation")
      await expect(
        page.getByText(/forum reports moderation/).last(),
      ).toBeVisible();
    if (outcome === "missing-association") {
      await expect(
        page
          .getByText(
            /Published thread 42 observed; submitted content confirmed; attachment associations unconfirmed/,
          )
          .last(),
      ).toBeVisible();
      await expect(
        page.getByText("Saved association verified · note.txt", {
          exact: true,
        }),
      ).toHaveCount(0);
    }
    if (outcome === "lost") {
      await expect(
        page.getByText(/Draft publication may have succeeded/).last(),
      ).toBeVisible();
      await page
        .getByRole("button", { name: /Check original draft attempt/ })
        .click();
      await expect(
        page.getByText(/Confirmed publication of forum draft 42/).last(),
      ).toBeVisible();
    }
    expect(state.commands).toHaveLength(2);
    expect(state.removals).toEqual([]);
    expect(state.files.get("88")!.bytes.equals(bytes)).toBe(true);
    await evidence(page, info, state);
  });
test("J6.J8.draft-delivered-bytes: independently delivered saved attachment matches authored bytes", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await save(page);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).last(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Check stored bytes note.txt", exact: true })
    .click();
  await expect(
    page.getByText(/Stored filename and bytes match the selected file/),
  ).toBeVisible();
  expect(
    state.reads.some(
      (u) => new URL(u).searchParams.get("mod") === "attachment",
    ),
  ).toBe(true);
  await evidence(page, info, state);
});

test("J6.J8.draft-native-update-sentinel: save resume reload and resave preserves native empty replacement marker", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.updateSentinel = true;
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  page = await page.context().newPage();
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page
    .getByRole("button", { name: "Drafts", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Load forum drafts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume Uploaded draft", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Resumed sentinel source");
  await save(page);
  await expect.poll(() => state.commands.length).toBe(2);
  expect(state.saved!.get("attachupdate[88]")).toBe("");
  expect(state.associated).toEqual(["88"]);
  await evidence(page, info, state);
});

for (const outcome of ["pending", "association-unknown"] as const)
  test(`J6.J8.draft-save-and-continue-${outcome}: replacement waits for confirmed submitted associations`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (outcome === "pending") await select(page);
    else {
      await upload(page);
      state.association = false;
    }
    await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Save forum draft and continue",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]Draft source[/unknown]");
    if (outcome === "pending") {
      await expect(
        page.getByText(
          /Finish uploads or explicitly remove pending selections/,
        ),
      ).toBeVisible();
      expect(state.commands).toHaveLength(0);
    } else {
      await expect(
        page.getByText(/attachment associations unconfirmed/),
      ).toBeVisible();
      expect(state.commands).toHaveLength(1);
    }
    expect(state.removals).toEqual([]);
    await evidence(page, info, state);
  });
test("J6.J8.draft-upload-recovery-valid: fresh same-account client validates retained upload and saves once", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await upload(page);
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await save(page);
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  expect(state.commands).toHaveLength(2);
  expect(state.uploads).toHaveLength(1);
  expect(state.associated).toEqual(["88"]);
  await evidence(page, info, state);
});
test("J6.J8.draft-local-discard: replacing writing never deletes uploaded unassociated server file", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  expect(state.files.size).toBe(1);
  expect(state.associated).toEqual([]);
  expect(state.removals).toEqual([]);
  expect(state.commands).toEqual([]);
  await evidence(page, info, state);
});

test("J6.J8.draft-partial-check-conflict: observed remote revision does not authorize overwriting it on warned resend", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Submitted revision");
  state.saveOutcome = "lost";
  await save(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  state.saved!.set("message", "Concurrent remote revision");
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await expect(page.getByText(/submitted content unconfirmed/)).toBeVisible();
  state.saveOutcome = "accepted";
  await page.getByRole("button", { name: /Review draft resend/ }).click();
  await page
    .getByRole("button", { name: "Confirm draft resend", exact: true })
    .click();
  await expect(page.getByText(/remote draft changed/)).toBeVisible();
  expect(state.commands).toHaveLength(2);
  expect(state.saved!.get("message")).toBe("Concurrent remote revision");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Submitted revision",
  );
  await evidence(page, info, state);
});

async function recoveredWriting(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
test("J6.J8.first-partial-warned-resend: inconclusive association offers cancellable same-target recovery with immutable original", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  state.association = false;
  await save(page);
  await expect(
    page.getByText(
      /Draft 42 observed; submitted content confirmed; attachment associations unconfirmed/,
    ),
  ).toBeVisible();
  const original = (await recoveredWriting(page)).draftAttempts[0];
  expect(original.submission.writing.draft).toBeUndefined();
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await expect(
    page.getByRole("button", { name: /Review draft resend/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Review draft resend/ }).click();
  await page
    .getByRole("button", { name: "Cancel draft resend", exact: true })
    .click();
  expect(state.commands).toHaveLength(1);
  state.association = true;
  await page.getByRole("button", { name: /Review draft resend/ }).click();
  await page
    .getByRole("button", { name: "Confirm draft resend", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  expect(state.commands).toHaveLength(2);
  expect(new URL(state.commands[1]!.url).searchParams.get("action")).toBe(
    "edit",
  );
  expect(new URL(state.commands[1]!.url).searchParams.get("tid")).toBe("42");
  expect(new URL(state.commands[1]!.url).searchParams.get("pid")).toBe("101");
  expect(state.associated).toEqual(["88"]);
  expect(state.uploads).toHaveLength(1);
  const attempts = (await recoveredWriting(page)).draftAttempts;
  expect(attempts[0].status).toBe("uncertain");
  expect(attempts[0].submission).toEqual(original.submission);
  expect(attempts[1].id).not.toBe(original.id);
  expect(attempts[1].resendOf).toBe(original.id);
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  expect(state.commands).toHaveLength(2);
  await evidence(page, info, state);
});
for (const timing of ["initial-observation", "after-observation"] as const)
  test(`J6.J8.first-partial-resend-conflict-${timing}: observed identity never authorizes concurrent source overwrite`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await upload(page);
    state.association = false;
    if (timing === "initial-observation")
      state.afterSaveSource = "Concurrent remote source";
    await save(page);
    await expect(page.getByText(/Draft 42 observed/)).toBeVisible();
    if (timing === "after-observation")
      state.saved!.set("message", "Concurrent remote source");
    await page
      .getByRole("button", { name: /Check original draft attempt/ })
      .click();
    await expect(
      page.getByRole("button", { name: /Review draft resend/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Review draft resend/ }).click();
    await page
      .getByRole("button", { name: "Confirm draft resend", exact: true })
      .click();
    await expect(
      page.getByText(
        /observed draft content differs from the original submission/,
      ),
    ).toBeVisible();
    expect(state.commands).toHaveLength(1);
    expect(state.saved!.get("message")).toBe("Concurrent remote source");
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]Draft source[/unknown]");
    await evidence(page, info, state);
  });
test("J6.J8.first-partial-resend-account: fresh account mismatch cannot issue the deliberate update", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  state.association = false;
  await save(page);
  await expect(page.getByText(/Draft 42 observed/)).toBeVisible();
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await page.getByRole("button", { name: /Review draft resend/ }).click();
  state.member = "8";
  await page
    .getByRole("button", { name: "Confirm draft resend", exact: true })
    .click();
  await expect(
    page.getByText(/remote draft changed|account changed/i).last(),
  ).toBeVisible();
  expect(state.commands).toHaveLength(1);
  expect(state.associated).toEqual([]);
  await evidence(page, info, state);
});
test("J6.J8.first-partial-known-target: checking another listed candidate cannot retarget the original partial identity", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await upload(page);
  state.association = false;
  await save(page);
  await expect(page.getByText(/Draft 42 observed/)).toBeVisible();
  state.otherDraft = true;
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
      name: "Check saved revision in Other candidate",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await recoveredWriting(page)).draftAttempts[0].checked)
    .toBe(true);
  const current = await recoveredWriting(page);
  expect(current.draft.threadId).toBe("42");
  expect(current.draftAttempts[0].result?.threadId).toBe("42");
  expect(
    state.reads.some((u) => new URL(u).searchParams.get("tid") === "43"),
  ).toBe(false);
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

for (const language of ["zh-CN", "zh-TW"] as const)
  for (const outcome of ["draft", "published"] as const)
    test(`J6.J8.draft-partial-locale-${language}-${outcome}: independent unknown association is translated without a replay`, async ({
      page,
    }, info) => {
      const state = await fixture(page);
      await upload(page);
      if (outcome === "draft") state.association = false;
      await save(page);
      if (outcome === "published") {
        await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
        state.publicationMissingAssociation = true;
        await page
          .getByRole("button", { name: "Publish saved draft", exact: true })
          .click();
      }
      await expect(
        page.getByText(/attachment associations unconfirmed/).first(),
      ).toBeVisible();
      const effects = state.commands.length;
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(language);
      await page.keyboard.press("Escape");
      const expected =
        outcome === "draft"
          ? language === "zh-CN"
            ? "已观察到草稿 42；提交内容已确认；附件关联未确认。未重复保存。"
            : "已觀察到草稿 42；提交內容已確認；附件關聯未確認。未重複儲存。"
          : language === "zh-CN"
            ? "已观察到已发布主题 42；提交内容已确认；附件关联未确认。未重复发布。"
            : "已觀察到已發佈主題 42；提交內容已確認；附件關聯未確認。未重複發佈。";
      await expect(
        page.getByText(expected, { exact: true }).first(),
      ).toBeVisible();
      if (outcome === "published")
        await expect(
          page.getByText(
            language === "zh-CN"
              ? "当前附件关联未确认。再次保存前请检查原草稿尝试。"
              : "目前附件關聯未確認。再次儲存前請檢查原草稿嘗試。",
            { exact: true },
          ),
        ).toBeVisible();
      expect(state.commands).toHaveLength(effects);
      expect(state.saved!.get("message")).toBe(
        "[unknown]Draft source[/unknown]",
      );
      await evidence(page, info, state);
    });

for (const probe of [
  "native",
  "price-empty",
  "explicit-readperm",
  "no-sentinel",
  "generic-reference",
] as const)
  test(`J6.J8.native-draft-association-shape-${probe}: native saved empty defaults confirm the upload without resending`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.referenceKind = "attachimg";
    state.updateSentinel = true;
    state.bareUpdateSentinel = true;
    state.nativeReadperm = true;
    state.savedPrice = probe === "price-empty" ? "" : "0";
    if (probe === "explicit-readperm") state.nativeReadperm = false;
    if (probe === "no-sentinel") state.updateSentinel = false;
    if (probe === "generic-reference") state.referenceKind = "attach";
    await upload(page, "sample.jpg");
    await page
      .getByRole("button", { name: "Insert sample.jpg", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(
      `[unknown]Draft source[/unknown][${state.referenceKind}]88[/${state.referenceKind}]`,
    );
    await save(page);
    await expect.poll(() => state.commands.length).toBe(1);
    expect(state.saved!.get("attachnew[88][description]")).toBe("");
    expect(state.saved!.get("attachnew[88][readperm]")).toBe("");
    expect(state.saved!.get("attachnew[88][price]")).toBe("");
    expect(state.associated).toEqual(["88"]);
    await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
    expect(state.uploads).toHaveLength(1);
    expect(state.commands).toHaveLength(1);
    const original = (await recoveredWriting(page)).draftAttempts[0];
    expect(
      original.submission.writing.attachmentFields.find(
        (f: { name: string }) => f.name === "attachnew[88][price]",
      ).value,
    ).toBe("");
    expect(original.observation.attachmentNormalizations ?? []).toEqual(
      probe === "price-empty"
        ? []
        : [{ name: "attachnew[88][price]", submitted: "", stored: "0" }],
    );
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toBeVisible();
    const current = await recoveredWriting(page);
    const expectedPrice = probe === "price-empty" ? "" : "0";
    expect(
      current.attachmentFields.find(
        (f: { name: string }) => f.name === "attachnew[88][price]",
      ).value,
    ).toBe(expectedPrice);
    expect(
      current.uploads[0].fields.find(
        (f: { name: string }) => f.name === "attachnew[88][price]",
      ).value,
    ).toBe(expectedPrice);
    expect(current.draftAttempts[0]).toEqual(original);
    await page
      .getByLabel("Title", { exact: true })
      .fill("Revised native draft");
    await save(page);
    await expect.poll(() => state.commands.length).toBe(2);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    expect(state.saved!.get("attachnew[88][price]")).toBe(expectedPrice);
    await page
      .getByRole("button", { name: "Publish saved draft", exact: true })
      .click();
    await expect(
      page.getByText(/Confirmed publication of forum draft 42/).last(),
    ).toBeVisible();
    expect(state.commands).toHaveLength(3);
    expect(state.uploads).toHaveLength(1);
    expect(
      state.commands
        .slice(1)
        .every((c) => new URL(c.url).searchParams.get("tid") === "42"),
    ).toBe(true);
    await evidence(page, info, state);
  });

test("J6.J8.native-price-original-check: recovered partial attempt adopts verified default without replay or loss of later edits", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.savedPrice = "0";
  state.association = false;
  await upload(page);
  await save(page);
  await expect(
    page.getByText(/attachment associations unconfirmed/).first(),
  ).toBeVisible();
  const original = (await recoveredWriting(page)).draftAttempts[0].submission;
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later local source");
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later local source",
  );
  state.associated = ["88"];
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const current = await recoveredWriting(page);
  expect(current.draftAttempts[0].submission).toEqual(original);
  expect(
    current.attachmentFields.find(
      (f: { name: string }) => f.name === "attachnew[88][price]",
    ).value,
  ).toBe("0");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later local source",
  );
  expect(state.commands).toHaveLength(1);
  expect(state.uploads).toHaveLength(1);
  await evidence(page, info, state);
});

for (const drift of [
  "nonzero",
  "padded",
  "whitespace",
  "reverse",
  "description",
  "readperm",
  "order",
  "disabled",
  "missing",
] as const)
  test(`J6.J8.native-price-strict-${drift}: unqualified attachment metadata remains unconfirmed`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (drift === "reverse") state.pendingPrice = "0";
    state.savedPrice =
      drift === "nonzero"
        ? "1"
        : drift === "padded"
          ? "00"
          : drift === "whitespace"
            ? " 0"
            : drift === "reverse"
              ? ""
              : "0";
    await upload(page);
    state.formChange = (html) =>
      !html.includes("action=edit")
        ? html
        : drift === "description"
          ? html.replace(
              'name="attachnew[88][description]" value=""',
              'name="attachnew[88][description]" value="changed"',
            )
          : drift === "readperm"
            ? html.replace(
                '<option value="" selected>All</option>',
                '<option value="10" selected>Restricted</option>',
              )
            : drift === "disabled"
              ? html.replace(
                  'name="attachnew[88][price]"',
                  'disabled name="attachnew[88][price]"',
                )
              : drift === "missing"
                ? html.replace(
                    '<input name="attachnew[88][price]" value="0">',
                    "",
                  )
                : drift === "order"
                  ? html
                      .replace(
                        '<input name="attachnew[88][description]" value="">',
                        "",
                      )
                      .replace(
                        '<input name="attachnew[88][price]" value="0">',
                        '<input name="attachnew[88][price]" value="0"><input name="attachnew[88][description]" value="">',
                      )
                  : html;
    await save(page);
    await expect(
      page.getByText(/attachment associations unconfirmed/).first(),
    ).toBeVisible();
    expect((await recoveredWriting(page)).draftAttempts[0].status).toBe(
      "uncertain",
    );
    expect(state.commands).toHaveLength(1);
    await evidence(page, info, state);
  });

test("J6.J8.native-price-conflict: independently confirmed default does not mask a later remote price change", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.savedPrice = "0";
  await upload(page);
  await save(page);
  await expect(page.getByText(/Confirmed forum draft 42/)).toBeVisible();
  state.savedPrice = "1";
  await page.getByLabel("Title", { exact: true }).fill("Local revision");
  await save(page);
  await expect(
    page.getByText(/remote draft changed|current draft form changed/i).last(),
  ).toBeVisible();
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});
