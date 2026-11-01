import { combinedSource, richRoundTrip } from "./combined-authoring";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { WritingContext } from "../../src/workspace/writing";
const observations = new WeakMap<Page, () => unknown>();
test.afterEach(async ({ page }, info) => {
  await info.attach("funded-draft-server.json", {
    body: JSON.stringify(
      observations.get(page)?.() ?? { setup: "not reached" },
    ),
    contentType: "application/json",
  });
  await info.attach("funded-draft-page.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("funded-draft-recovery.json", {
    body:
      (await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      )) ?? "null",
    contentType: "application/json",
  });
});
async function recovered(page: Page): Promise<WritingContext> {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
const origin = "https://www.tsdm39.com";
const thread = `${origin}/forum.php?mod=viewthread&tid=42`;
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const bytes = Buffer.from("Draft attachment authored fixture.\n");
const packetFields = `<div class="hb-postbox">
<div class="hb-row"><label>總金額</label><input type="number" name="hb_total" min="1" step="1"></div>
<div class="hb-row"><label>份數</label><input type="number" name="hb_shares" min="1" max="100" step="1" value="1"><span class="hb-hint">最多 100 份;每份至少 10</span></div>
<label><input type="radio" name="hb_split" value="1" checked>拼手氣</label><label><input type="radio" name="hb_split" value="2">均分</label>
<label><input type="checkbox" name="hb_cond" value="1">必須回帖後才能搶</label>
<input name="hb_password" type="text" maxlength="64"><input name="hb_appoint" type="text" placeholder="會員名,可多個(逗號分隔)">
<select name="hb_expire"><option value="1">1 小時</option><option value="6">6 小時</option><option value="24" selected>1 天</option><option value="0">不自動到期</option></select>
<input type="text" name="hb_blessing" maxlength="50" value="恭喜發財,大吉大利">
<div class="hb-hint">紅包金額在扣款成功後才鎖定;發表後不可補塞、不可加碼。</div></div>`;

async function fixture(
  page: Page,
  setup: { ordinary?: boolean; hints?: string[] } = {},
) {
  const state = {
    hints: setup.hints ?? [],
    saved: null as URLSearchParams | null,
    packet: null as URLSearchParams | null,
    packetState: "open",
    specialEdit: false,
    clock: 0,
    expiresAt: 6,
    packetOutcome: "accepted",
    ledgerFailed: false,
    recipientsValid: true,
    afterRecipientMember: "",
    afterRecipientLimits: false,
    ledgerMember: "",
    credits: [] as {
      operation: string;
      change: string;
      details: string;
      time: string;
    }[],
    files: new Map<string, { name: string; bytes: Buffer }>(),
    associated: [] as string[],
    commands: [] as { url: string; body: string }[],
    reads: [] as string[],
    uploads: [] as string[],
    removals: [] as string[],
    member: "7",
    published: false,
    association: true,
    reverseStoredAttachments: false,
    uploadOutcome: "accepted",
    saveOutcome: "accepted",
    rejectionMessage: "subject_invalid",
    publicationOutcome: "published",
    publicationMissingAssociation: false,
    updateSentinel: false,
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
  observations.set(page, () => ({
    ...state,
    saved: state.saved && Object.fromEntries(state.saved),
    packet: state.packet && Object.fromEntries(state.packet),
    files: [...state.files].map(([id, f]) => ({
      id,
      name: f.name,
      sha256: createHash("sha256").update(f.bytes).digest("hex"),
    })),
  }));
  const actor = () =>
    `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
  const board =
    '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
  const fields = (id: string) =>
    `<input name="attachnew[${id}][description]" value=""><select name="attachnew[${id}][readperm]"><option value="" selected>All</option></select><input name="attachnew[${id}][price]" value="">`;
  const form = (edit: boolean) =>
    state.formChange(
      `${actor()}${board}<form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit&tid=42&pid=101&editsubmit=yes" : "newthread&topicsubmit=yes"}&fid=5"><input type="hidden" name="formhash" value="PRIVATE">${edit && state.specialEdit ? '<input type="hidden" name="special" value=""><input type="hidden" name="specialextra" value="NATIVE_KEPT">' : ""}<input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="save" id="postsave" value=""><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button><input name="subject" value="${esc(edit ? (state.saved?.get("subject") ?? "") : "")}"><textarea name="message">${esc(edit ? (state.saved?.get("message") ?? "") : "")}</textarea>${!edit ? state.hints.map((hint) => `<span class="hb-hint">${esc(hint)}</span>`).join("") + (setup.ordinary ? "" : packetFields) + '<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script>' : ""}<select name="typeid"><option value="3" selected>Listening</option></select><label><input type="checkbox" name="usesig" value="1"${!edit || state.saved?.has("usesig") ? " checked" : ""}>Signature</label><input name="price" value="0"><button name="${edit ? "editsubmit" : "topicsubmit"}" type="submit" value="yes">Save</button></form><div id="e_attachlist">${
        edit
          ? (state.reverseStoredAttachments
              ? [...state.associated].reverse()
              : state.associated
            )
              .filter((id) => state.files.has(id))
              .map(
                (id) =>
                  (state.updateSentinel
                    ? `<input type="hidden" name="attachupdate[${id}]" value="">`
                    : "") + fields(id),
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
    if (url.searchParams.get("id") === "atplus:search") {
      state.reads.push(url.href);
      if (state.afterRecipientMember) state.member = state.afterRecipientMember;
      if (state.afterRecipientLimits)
        state.formChange = (s) => s.replace('max="100"', 'max="1"');
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          list: state.recipientsValid
            ? [{ uid: 8, username: "Recipient Eight" }]
            : [],
        }),
      });
    }
    if (url.pathname === "/plugin.php") {
      state.reads.push(url.href);
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          state.packet
            ? {
                ok: true,
                tid: 42,
                state:
                  state.clock >= state.expiresAt
                    ? "expired"
                    : state.packetState,
                cond: state.packet.has("hb_cond") ? 1 : 0,
                haspw: state.packet.get("hb_password") ? 1 : 0,
                appoint: state.packet.get("hb_appoint") ? 1 : 0,
                splitmode: Number(state.packet.get("hb_split")),
                bless: state.packet.get("hb_blessing"),
              }
            : { ok: false, error: "這裡沒有紅包" },
        ),
      });
    }
    if (url.searchParams.get("ac") === "credit") {
      state.reads.push(url.href);
      if (state.ledgerMember) state.member = state.ledgerMember;
      return route.fulfill({
        contentType: "text/html",
        body: state.ledgerFailed
          ? "unavailable"
          : `${actor()}<table class="dt"><tr><th>操作</th><th>积分变更</th><th>变更后</th><th>详情</th><th>变更时间</th></tr>${state.credits.map((c) => `<tr><td><a href="home.php?mod=spacecp&ac=credit&op=log&optype=${c.operation}">${c.operation}</a></td><td>${c.change}</td><td>not used for attribution</td><td>${c.details}</td><td>${c.time}</td></tr>`).join("")}</table>`,
      });
    }
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
        body: `<root><![CDATA[${!state.listMissing && state.files.has(id) ? `<table><tbody><tr><td><a onclick="insertAttachTag('${id}');">${esc(state.files.get(id)!.name)}</a></td><td>${fields(id)}</td></tr></tbody></table>` : ""}]]></root>`,
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
      if (state.saveOutcome === "lost-empty") return route.abort();
      if (state.saveOutcome === "rejected")
        return route.fulfill({
          contentType: "text/xml",
          body: `<root><![CDATA[<script>errorhandle_post('${state.rejectionMessage}', {});</script>]]></root>`,
        });
      if (data.has("hb_total") && state.packetOutcome === "accepted") {
        state.packet = new URLSearchParams(data);
        state.credits.push({
          operation: "HBS",
          change: "天使币 -20",
          details: "Synthetic initial funding",
          time: "2026-10-23 01:00",
        });
      }
      state.saved = new URLSearchParams(data);
      if (state.afterSaveSource)
        state.saved.set("message", state.afterSaveSource);
      if (state.association)
        state.associated = [...state.files.keys()].filter((id) =>
          data.has(`attachnew[${id}][description]`),
        );
      if (data.get("save") !== "1") {
        if (!state.published && state.publicationOutcome === "published")
          state.credits.push({
            operation: "PR",
            change: "天使币 +2",
            details: "Publication reward",
            time: "2026-10-23 02:00",
          });
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
      body += `<div id="postlist"><h1><span id="thread_subject">${esc(state.saved?.get("subject") ?? "")}</span>${state.published ? "" : '<span class="xg1">(草稿)</span>'}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">Stored source ${state.packet ? '<div class="hb-entry" data-tid="42">Packet</div>' : ""}${state.associated
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
    return route.fulfill({ contentType: "text/html", body });
  });
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page
    .getByRole("button", {
      name: setup.ordinary ? "New thread" : "New red packet",
      exact: true,
    })
    .click();
  await page.getByLabel("Title", { exact: true }).fill("Uploaded draft");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[unknown]Draft source[/unknown]");
  if (!setup.ordinary) {
    await page.getByLabel("Total credits", { exact: true }).fill("20");
    await page.getByLabel("Share count", { exact: true }).fill("2");
    await page.getByLabel("Expiry", { exact: true }).selectOption("6");
  }
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
        packet: state.packet && Object.fromEntries(state.packet),
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
test("J6.J7.funded-draft-review: disclose immediate debit and activity before Save; cancel has no effects", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await save(page);
  await expect(
    page.getByRole("heading", {
      name: "Fund draft — deduct 20 credits now",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The packet is active before thread publication. Its conditions and expiry apply immediately; an unpublished draft does not make the packet private or inactive.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Funded draft review" }),
  ).toContainText("6 小時");
  expect(state.commands).toEqual([]);
  await page
    .getByRole("button", { name: "Cancel funded draft save", exact: true })
    .click();
  expect(state.commands).toEqual([]);
  await evidence(page, info, state);
});

async function fund(page: Page) {
  await save(page);
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .click();
}
test("J6.J7.funded-draft-initial-save: use current packet form and independently observe stored source packet and credits", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page.getByLabel("Require a reply", { exact: true }).check();
  await page.getByLabel("Passphrase", { exact: true }).fill("synthetic secret");
  await fund(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  expect(state.commands).toHaveLength(1);
  expect(new URLSearchParams(state.commands[0]!.body).get("hb_total")).toBe(
    "20",
  );
  expect(state.saved?.get("save")).toBe("1");
  expect(state.saved?.get("message")).toBe("[unknown]Draft source[/unknown]");
  expect(state.packet?.get("hb_password")).toBe("synthetic secret");
  expect(state.credits.map((c) => c.operation)).toEqual(["HBS"]);
  await expect(
    page.getByText("Packet state: open", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Credit attribution remains unknown/),
  ).toBeVisible();
  await expect(page.getByText(/HBS · 天使币 -20/)).toBeVisible();
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-lifecycle: save revise fresh resume publish and owned edit preserve one funding and attachment", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(combinedSource);
  state.specialEdit = true;
  await page.getByLabel("Passphrase", { exact: true }).fill("original secret");
  await page
    .getByLabel("Designated recipients", { exact: true })
    .fill("Recipient Eight");
  await page.getByLabel("Require a reply", { exact: true }).check();
  await upload(page);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const combined = await page
    .getByLabel("Complete source", { exact: true })
    .inputValue();
  await richRoundTrip(page, combined);
  expect(state.commands).toHaveLength(0);
  await fund(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect(page.getByLabel("Total credits", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Title", { exact: true }).fill("Revised funded draft");
  await save(page);
  await expect.poll(() => state.commands.length).toBe(2);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  expect(state.associated).toEqual(["88"]);
  expect(state.saved?.get("typeid")).toBe("3");
  expect(state.saved?.get("usesig")).toBe("1");
  expect(state.saved?.get("price")).toBe("0");
  const source = state.saved!.get("message");
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
    .getByRole("button", { name: "Resume Revised funded draft", exact: true })
    .click();
  await expect(
    page.getByText(/Existing red packet: content edits/),
  ).toBeVisible();
  await expect(page.getByLabel("Total credits", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source!,
  );
  await page
    .getByLabel("Title", { exact: true })
    .fill("Funded published title");
  await save(page);
  await expect.poll(() => state.commands.length).toBe(3);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).last(),
  ).toBeVisible();
  expect(state.commands).toHaveLength(4);
  page = await page.context().newPage();
  await page.goto(thread);
  await page
    .getByRole("button", { name: "Edit post 101", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[b]Edited published source[/b] [attach]88[/attach]");
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.commands).toHaveLength(5);
  expect(state.saved?.get("specialextra")).toBe("NATIVE_KEPT");
  expect(state.saved?.get("message")).toBe(
    "[b]Edited published source[/b] [attach]88[/attach]",
  );
  expect(state.credits.map((c) => c.operation)).toEqual(["HBS", "PR"]);
  expect(state.packet?.get("hb_password")).toBe("original secret");
  expect(state.packet?.get("hb_appoint")).toBe("Recipient Eight");
  expect(state.packet?.get("hb_expire")).toBe("6");
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  expect(
    state.commands
      .slice(1)
      .every(
        (c) =>
          !new URLSearchParams(c.body).has("hb_total") &&
          new URL(c.url).searchParams.get("tid") === "42",
      ),
  ).toBe(true);
  await evidence(page, info, state);
});

for (const change of [
  "source",
  "settings",
  "account",
  "limits",
  "invalid-recipients",
  "recipient-account",
  "recipient-limits",
] as const)
  test(`J6.J7.funded-draft-review-barrier-${change}: stale or invalid reviewed financial intent sends nothing`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (change.includes("recipient"))
      await page
        .getByLabel("Designated recipients", { exact: true })
        .fill("Recipient Eight");
    await save(page);
    if (change === "source")
      await page
        .getByLabel("Complete source", { exact: true })
        .fill("Changed after review");
    if (change === "settings")
      await page.getByLabel("Total credits", { exact: true }).fill("30");
    if (change === "account") state.member = "8";
    if (change === "limits")
      state.formChange = (s) => s.replace('max="100"', 'max="1"');
    if (change === "invalid-recipients") state.recipientsValid = false;
    if (change === "recipient-account") state.afterRecipientMember = "8";
    if (change === "recipient-limits") state.afterRecipientLimits = true;
    await page
      .getByRole("button", { name: "Confirm funded draft save", exact: true })
      .click();
    await expect(
      page.getByText(/Nothing was sent|nothing was sent|not sent/).last(),
    ).toBeVisible();
    expect(state.commands).toEqual([]);
    expect(state.credits).toEqual([]);
    await evidence(page, info, state);
  });

for (const outcome of [
  "absent",
  "packet-unknown",
  "ledger-unavailable",
  "ambiguous-credits",
] as const)
  test(`J6.J7.funded-draft-component-${outcome}: retained thread identity never proves packet or financial effects`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (outcome === "absent") state.packetOutcome = "absent";
    if (outcome === "packet-unknown") state.packetState = "malformed";
    if (outcome === "ledger-unavailable") state.ledgerFailed = true;
    if (outcome === "ambiguous-credits")
      state.credits.push(
        {
          operation: "HBS",
          change: "天使币 -20",
          details: "Concurrent unrelated funding",
          time: "2026-10-23 01:00",
        },
        {
          operation: "HBG",
          change: "天使币 +10",
          details: "Sender claim",
          time: "2026-10-23 01:00",
        },
        {
          operation: "HBR",
          change: "天使币 +10",
          details: "Historical refund",
          time: "2026-10-23 01:00",
        },
        {
          operation: "PR",
          change: "天使币 +20",
          details: "Ordinary reward",
          time: "2026-10-23 01:00",
        },
      );
    await fund(page);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    await expect(
      page.getByText(
        `Packet state: ${outcome === "absent" ? "absent" : outcome === "packet-unknown" ? "unknown" : "open"}`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/Credit attribution remains unknown/),
    ).toBeVisible();
    await expect(page.getByLabel("Total credits", { exact: true })).toHaveCount(
      0,
    );
    if (outcome === "ledger-unavailable")
      await expect(page.getByText(/Credit ledger unavailable/)).toBeVisible();
    if (outcome === "ambiguous-credits") {
      await expect(page.getByText(/HBG · 天使币 \+10/)).toBeVisible();
      await expect(page.getByText(/HBR · 天使币 \+10/)).toBeVisible();
      await expect(page.getByText(/PR ·/)).toHaveCount(0);
    }
    expect(state.commands).toHaveLength(1);
    if (outcome === "packet-unknown" || outcome === "absent") {
      state.packetState = "open";
      await page
        .getByLabel("Title", { exact: true })
        .fill("Same target content revision");
      await save(page);
      await expect.poll(() => state.commands.length).toBe(2);
      await expect(
        page.getByText(/Confirmed forum draft 42/).last(),
      ).toBeVisible();
      if (outcome === "packet-unknown")
        await expect(
          page
            .getByRole("region", { name: "Red-packet result", exact: true })
            .last()
            .getByText("Packet state: open", { exact: true }),
        ).toBeVisible();
      expect(new URLSearchParams(state.commands[1]!.body).has("hb_total")).toBe(
        false,
      );
      expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(
        outcome === "absent" ? 0 : 1,
      );
    }
    await evidence(page, info, state);
  });

test("J6.J7.funded-draft-loss: lost initial Save retains unknown packet/credits across reload without a second effect", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "lost";
  await fund(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  await expect(
    page.getByText("Packet state: unknown", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later unsaved source");
  await page.reload();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later unsaved source",
  );
  await page
    .getByRole("button", { name: /Check original draft attempt/ })
    .click();
  expect(state.commands).toHaveLength(1);
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  await evidence(page, info, state);
});

for (const outcome of ["expired", "moderation", "remaining-draft"] as const)
  test(`J6.J7.funded-draft-${outcome}: publish does not restart expiry re-fund or promise a refund`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await fund(page);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    state.clock = 7;
    await page.getByLabel("Title", { exact: true }).fill("Delayed revision");
    await save(page);
    await expect.poll(() => state.commands.length).toBe(2);
    await expect(
      page.getByText("Packet state: expired", { exact: true }).last(),
    ).toBeVisible();
    if (outcome !== "expired") state.publicationOutcome = outcome;
    await page
      .getByRole("button", { name: "Publish saved draft", exact: true })
      .click();
    await expect.poll(() => state.commands.length).toBe(3);
    if (outcome === "moderation")
      await expect(
        page.getByText(/forum reports moderation/).last(),
      ).toBeVisible();
    if (outcome === "remaining-draft")
      await expect(
        page.getByText(/still an unpublished forum draft/).last(),
      ).toBeVisible();
    if (outcome === "expired") {
      await expect(
        page.getByText(/Confirmed publication of forum draft 42/).last(),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
    }
    const latest = page
      .getByRole("region", { name: "Red-packet result", exact: true })
      .last();
    await expect(
      latest.getByText("Packet state: expired", { exact: true }),
    ).toBeVisible();
    await expect(
      latest.getByText(/contact a moderator for assistance/),
    ).toBeVisible();
    expect(state.expiresAt).toBe(6);
    expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
    expect(state.credits.filter((c) => c.operation === "HBR")).toHaveLength(0);
    await evidence(page, info, state);
  });

test("J6.J7.funded-draft-warned-resend: inconclusive check requires explicit extra-debit warning and distinct attempt", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "lost-empty";
  await fund(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  const original = (await recovered(page)).draftAttempts![0]!;
  await page.getByLabel("Total credits", { exact: true }).fill("40");
  await page
    .getByRole("button", {
      name: `Check original draft attempt ${original.id}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: `Review draft resend ${original.id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      /A further red-packet attempt can deduct additional credits/,
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel draft resend", exact: true })
    .click();
  expect(state.commands).toHaveLength(1);
  await page
    .getByRole("button", {
      name: `Review draft resend ${original.id}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirm draft resend", exact: true })
    .click();
  expect(state.commands).toHaveLength(1);
  await expect(
    page.getByRole("heading", {
      name: "Fund draft — deduct 40 credits now",
      exact: true,
    }),
  ).toBeVisible();
  state.saveOutcome = "accepted";
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const attempts = (await recovered(page)).draftAttempts!;
  expect(attempts).toHaveLength(2);
  expect(attempts[0]!.status).toBe("uncertain");
  expect(attempts[0]!.submission).toEqual(original.submission);
  expect(attempts[1]!.resendOf).toBe(original.id);
  expect(attempts[1]!.id).not.toBe(original.id);
  expect(state.commands).toHaveLength(2);
  expect(state.packet?.get("hb_total")).toBe("40");
  await expect(
    page.getByRole("region", {
      name: "Unapplied packet settings",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  expect(state.commands).toHaveLength(2);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-rejection: validation reply cannot establish financial rollback or permit ordinary retry", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "rejected";
  await fund(page);
  await expect(
    page.getByText(/funding outcomes remain unconfirmed/),
  ).toBeVisible();
  expect((await recovered(page)).draftAttempts![0]!.status).toBe("uncertain");
  await save(page);
  await expect(
    page.getByText(/earlier draft save may have succeeded/),
  ).toBeVisible();
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-save-and-continue: disclose charge and preserve original component observations in replacement", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.ledgerFailed = true;
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Save forum draft and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Fund draft — deduct 20 credits now",
      exact: true,
    }),
  ).toBeVisible();
  expect(state.commands).toEqual([]);
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .click();
  await expect
    .poll(async () => (await recovered(page)).draftAttempts?.length)
    .toBe(1);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("");
  const writing = await recovered(page);
  expect(writing.draft).toBeUndefined();
  expect(writing.draftAttempts![0]!.redPacket?.credit).toBe("unknown");
  expect(writing.draftAttempts![0]!.redPacket?.ledger?.state).toBe(
    "unavailable",
  );
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

for (const variant of ["missing-observation", "malformed-observation"] as const)
  test(`J6.J7.funded-draft-recovery-${variant}: restored component metadata is honest and never replayed`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await fund(page);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    await page.evaluate((variant) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      if (variant === "missing-observation")
        delete record.writing.draftAttempts[0].redPacket;
      else
        record.writing.draftAttempts[0].redPacket.state =
          "invented-financial-success";
      sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
    }, variant);
    await page.reload();
    if (variant === "malformed-observation")
      await expect(
        page.getByText(/Stored recovery data is incompatible/),
      ).toBeVisible();
    else {
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await expect(
        page.getByText(
          "Packet and credit observations were not retained. Their outcomes remain unknown.",
          { exact: true },
        ),
      ).toBeVisible();
    }
    expect(state.commands).toHaveLength(1);
    await evidence(page, info, state);
  });

test("J6.J7.funded-draft-original-check: fresh recovered session reobserves original saved version without replacing later edits", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "lost";
  await fund(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  const original = (await recovered(page)).draftAttempts![0]!.submission;
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later retained source");
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.writing.draftAttempts[0].generation = 37;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  await page.reload();
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
      name: "Check saved revision in Uploaded draft",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect(
    page.getByText("Packet state: open", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later retained source",
  );
  expect((await recovered(page)).draftAttempts![0]!.submission).toEqual(
    original,
  );
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-ack-refusal: native page-session quota refusal prevents charge-bearing command", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await save(page);
  const refused = await page.evaluate(() => {
    let value = "",
      refused = false;
    for (let size = 65536; size >= 1; size = Math.floor(size / 2)) {
      const chunk = "x".repeat(size);
      try {
        while (true) {
          sessionStorage.setItem("funded-quota", value + chunk);
          value += chunk;
        }
      } catch {
        refused = true;
      }
    }
    return refused;
  });
  expect(refused).toBe(true);
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .click();
  await expect(page.getByText(/Draft saving was not sent/)).toBeVisible();
  expect(state.commands).toEqual([]);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-pending-recovery: acknowledged pending funding restores uncertain with one command", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.saveGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await fund(page);
  await expect.poll(() => state.commands.length).toBe(1);
  expect((await recovered(page)).draftAttempts![0]!.status).toBe("pending");
  await page.reload();
  release();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(
    page.getByText(/Pending draft save restored as uncertain/),
  ).toBeVisible();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Acknowledged after recovery");
  expect((await recovered(page)).draftAttempts![0]!.status).toBe("uncertain");
  expect(state.commands).toHaveLength(1);
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-later-version: duplicate confirmation sends once and late saved version preserves current source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.saveGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await save(page);
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect.poll(() => state.commands.length).toBe(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later source remains local");
  release();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later source remains local",
  );
  expect(state.saved?.get("message")).toBe("[unknown]Draft source[/unknown]");
  expect(state.commands).toHaveLength(1);
  expect(
    (await recovered(page)).draftAttempts![0]!.submission.writing.source,
  ).toBe("[unknown]Draft source[/unknown]");
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-ledger-account: actor change during component readback keeps original-account attempt and unknown financial outcome", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.ledgerMember = "8";
  await fund(page);
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await expect(
    page.getByText("Packet state: unknown", { exact: true }),
  ).toBeVisible();
  const attempt = (await recovered(page)).draftAttempts![0]!;
  expect(attempt.submission.writing.account.id).toBe("7");
  expect(attempt.redPacket?.credit).toBe("unknown");
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-inherited-page: browser-copied uncertain funding remains independent and never replays", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "lost-empty";
  await fund(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  const original = await recovered(page);
  const popupPromise = page.waitForEvent("popup");
  await page.evaluate(() => window.open(location.href, "funded-copy"));
  const copy = await popupPromise;
  await expect(copy.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  await expect(copy.getByText(/Draft saving may have succeeded/)).toBeVisible();
  await copy
    .getByLabel("Complete source", { exact: true })
    .fill("Divergent copied writing");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]Draft source[/unknown]",
  );
  expect((await recovered(copy)).draftAttempts![0]!.submission).toEqual(
    original.draftAttempts![0]!.submission,
  );
  expect(state.commands).toHaveLength(1);
  await info.attach("copied-page-session.json", {
    body: JSON.stringify(await recovered(copy)),
    contentType: "application/json",
  });
  await copy.close();
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-later-settings: delayed target adoption retains unapplied packet settings across reload without re-funding", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.saveGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await fund(page);
  await expect.poll(() => state.commands.length).toBe(1);
  const original = (await recovered(page)).draftAttempts![0]!.submission;
  await page.getByLabel("Total credits", { exact: true }).fill("40");
  await page
    .getByLabel("Passphrase", { exact: true })
    .fill("Later unsent secret");
  await page.getByLabel("Require a reply", { exact: true }).check();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later ordinary source");
  await page.getByLabel("Signature", { exact: true }).uncheck();
  release();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const retained = page.getByRole("region", {
    name: "Unapplied packet settings",
    exact: true,
  });
  await expect(retained).toBeVisible();
  await expect(retained).toContainText("40");
  await expect(retained).toContainText("Later unsent secret");
  await expect(retained).toContainText("Selected");
  await expect(page.getByLabel("Total credits", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Signature", { exact: true })).not.toBeChecked();
  expect((await recovered(page)).draftAttempts![0]!.submission).toEqual(
    original,
  );
  expect(state.packet?.get("hb_total")).toBe("20");
  expect(state.packet?.get("hb_password")).toBe("");
  expect(state.packet?.has("hb_cond")).toBe(false);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text size", { exact: true }).fill("150");
  await page.locator("#interface-language").selectOption("zh-TW");
  await page.keyboard.press("Escape");
  const geometry = await page.locator("#tsdm-workspace").evaluate((host) => ({
    width: host.clientWidth,
    scroll: host.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
  await page.getByRole("button", { name: "設定", exact: true }).click();
  await page.locator("#interface-language").selectOption("en");
  await page.getByLabel("Text size", { exact: true }).fill("100");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await expect(retained).toContainText("Later unsent secret");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later ordinary source",
  );
  await save(page);
  await expect.poll(() => state.commands.length).toBe(2);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  expect(new URLSearchParams(state.commands[1]!.body).has("hb_total")).toBe(
    false,
  );
  expect(state.packet?.get("hb_total")).toBe("20");
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  await expect(retained).toContainText("Later unsent secret");
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-lost-later-settings: recovered read-only adoption preserves later settings and attachment intent", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.saveOutcome = "lost";
  await fund(page);
  await expect(page.getByText(/Draft saving may have succeeded/)).toBeVisible();
  const original = (await recovered(page)).draftAttempts![0]!.submission;
  await page
    .getByLabel("Greeting", { exact: true })
    .fill("Later unsent greeting");
  await page.getByLabel("Expiry", { exact: true }).selectOption("24");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later source with attachment");
  await upload(page);
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const later = await recovered(page);
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.writing.draftAttempts[0].generation = 37;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  await page.reload();
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
      name: "Check saved revision in Uploaded draft",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const retained = page.getByRole("region", {
    name: "Unapplied packet settings",
    exact: true,
  });
  await expect(retained).toContainText("Later unsent greeting");
  await expect(retained).toContainText("1 天");
  await expect(retained).toContainText(
    "saving or publishing this draft will not apply them or fund another packet",
  );
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    later.source,
  );
  const current = await recovered(page);
  expect(current.draftAttempts![0]!.submission).toEqual(original);
  expect(current.uploadedReferences).toEqual(later.uploadedReferences);
  expect(current.uploads).toEqual(later.uploads);
  expect(state.associated).toEqual([]);
  expect(state.packet?.get("hb_expire")).toBe("6");
  expect(state.packet?.get("hb_blessing")).toBe("恭喜發財,大吉大利");
  expect(state.commands).toHaveLength(1);
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  await page.reload();
  await expect(retained).toContainText("Later unsent greeting");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    later.source,
  );
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-malformed-unapplied-settings: incompatible retained option data stays inert without replay", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await fund(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Unapplied packet settings",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.writing.unappliedPacketOptions = [
      { name: "hb_total", value: "999" },
    ];
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  await page.reload();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

for (const replacement of [
  "new-thread",
  "reply",
  "owned-edit",
  "another-draft",
] as const)
  test(`J6.J7.funded-draft-continuation-${replacement}: unapplied settings block Save-and-continue until explicit handling`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    let release!: () => void;
    state.saveGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await fund(page);
    await expect.poll(() => state.commands.length).toBe(1);
    await page
      .getByLabel("Greeting", { exact: true })
      .fill("Retain before replacement");
    release();
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    const before = await recovered(page);
    const original = before.draftAttempts![0]!.submission;
    if (replacement === "new-thread") {
      await page
        .getByRole("button", { name: "New red packet", exact: true })
        .click();
    } else if (replacement === "another-draft") {
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
        .getByRole("button", { name: "Resume Other candidate", exact: true })
        .click();
    } else {
      await page.goto(thread);
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: replacement === "reply" ? "Reply to thread" : "Edit post 101",
          exact: true,
        })
        .click();
    }
    await page
      .getByRole("button", {
        name: "Save forum draft and continue",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        /Save-and-continue is blocked because unapplied packet settings remain/,
      ),
    ).toBeVisible();
    expect(state.commands).toHaveLength(1);
    expect((await recovered(page)).id).toBe(before.id);
    expect((await recovered(page)).draftAttempts![0]!.submission).toEqual(
      original,
    );
    expect(state.packet?.get("hb_blessing")).toBe("恭喜發財,大吉大利");
    await page.reload();
    const retained = page.getByRole("region", {
      name: "Unapplied packet settings",
      exact: true,
    });
    if (!(await retained.isVisible()))
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
    await expect(retained).toContainText("Retain before replacement");
    expect((await recovered(page)).draft?.threadId).toBe("42");
    await save(page);
    await expect.poll(() => state.commands.length).toBe(2);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    await expect(retained).toContainText("Retain before replacement");
    expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
    if (replacement === "new-thread") {
      await page
        .getByRole("button", { name: "New red packet", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Discard local changes and prepare",
          exact: true,
        })
        .click();
      await expect(page.getByLabel("Title", { exact: true })).toHaveValue("");
      await expect(retained).toHaveCount(0);
      expect(state.commands).toHaveLength(2);
    }
    await evidence(page, info, state);
  });

test("J6.J7.funded-draft-continuation-late-settings: Save-and-continue rechecks unapplied settings after awaiting the initial result", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.saveGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Save forum draft and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm funded draft save", exact: true })
    .click();
  await expect.poll(() => state.commands.length).toBe(1);
  const original = (await recovered(page)).draftAttempts![0]!.submission;
  await page
    .getByLabel("Greeting", { exact: true })
    .fill("Changed while continuation awaited");
  release();
  await expect(
    page.getByText(
      /Save-and-continue is blocked because unapplied packet settings remain/,
    ),
  ).toBeVisible();
  const retained = page.getByRole("region", {
    name: "Unapplied packet settings",
    exact: true,
  });
  await expect(retained).toContainText("Changed while continuation awaited");
  expect((await recovered(page)).draft?.threadId).toBe("42");
  expect((await recovered(page)).draftAttempts![0]!.submission).toEqual(
    original,
  );
  expect(state.commands).toHaveLength(1);
  expect(state.packet?.get("hb_blessing")).toBe("恭喜發財,大吉大利");
  await page.reload();
  await expect(retained).toContainText("Changed while continuation awaited");
  expect(state.commands).toHaveLength(1);
  await evidence(page, info, state);
});

test("J6.J7.funded-draft-continuation-packet-target: successful Save-and-continue preserves the selected fresh packet composition without funding it", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await fund(page);
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const before = await recovered(page);
  const original = before.draftAttempts![0]!.submission;
  await page
    .getByRole("button", { name: "New red packet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save forum draft and continue", exact: true })
    .click();
  await expect(page.getByLabel("Total credits", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Total credits", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("");
  const replacement = await recovered(page);
  expect(replacement.id).not.toBe(before.id);
  expect(replacement.draft).toBeUndefined();
  expect(replacement.redPacket).toBeDefined();
  expect(replacement.draftAttempts).toHaveLength(2);
  expect(replacement.draftAttempts![0]!.submission).toEqual(original);
  expect(replacement.draftAttempts![1]!.result?.threadId).toBe("42");
  const lastForm = state.reads
    .map((url) => new URL(url))
    .filter((url) => url.searchParams.get("action") === "newthread")
    .at(-1)!;
  expect(lastForm.searchParams.get("specialextra")).toBe("hongbao");
  expect(state.commands).toHaveLength(2);
  expect(new URLSearchParams(state.commands[1]!.body).has("hb_total")).toBe(
    false,
  );
  expect(state.packet?.get("hb_total")).toBe("20");
  expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(1);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Second composition only");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Separate unsent source");
  await page.getByLabel("Total credits", { exact: true }).fill("30");
  await save(page);
  await expect(
    page.getByRole("heading", {
      name: "Fund draft — deduct 30 credits now",
      exact: true,
    }),
  ).toBeVisible();
  expect(state.commands).toHaveLength(2);
  await page
    .getByRole("button", { name: "Cancel funded draft save", exact: true })
    .click();
  expect(state.commands).toHaveLength(2);
  await evidence(page, info, state);
});

test("J7.integrated-direct-rich-upload: one reviewed direct publication confirms rich source and association separately from packet and credit observations", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(combinedSource);
  await page.getByLabel("Require a reply", { exact: true }).check();
  await page
    .getByLabel("Passphrase", { exact: true })
    .fill("Authored passphrase");
  await upload(page);
  const source = page.getByLabel("Complete source", { exact: true });
  await source.focus();
  await source.press("ControlOrMeta+End");
  await page
    .getByRole("button", { name: "Insert note.txt", exact: true })
    .click();
  const expected = combinedSource + "[attach]88[/attach]";
  await richRoundTrip(page, expected);
  expect(state.commands).toEqual([]);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText("Publish red packet — deduct 20 credits", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(
    page.getByText("Saved association verified · note.txt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Packet state: open", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Credit attribution remains unknown/),
  ).toBeVisible();
  expect(state.commands).toHaveLength(1);
  expect(state.saved?.get("save")).not.toBe("1");
  expect(state.saved?.get("message")).toBe(expected);
  expect(state.saved?.get("typeid")).toBe("3");
  expect(state.saved?.get("usesig")).toBe("1");
  expect(state.associated).toEqual(["88"]);
  expect(state.packet?.get("hb_password")).toBe("Authored passphrase");
  expect(state.packet?.get("hb_cond")).toBe("1");
  expect(state.credits.map((c) => c.operation)).toEqual(["HBS", "PR"]);
  expect(state.reads.some((u) => u.includes("id=hongbao"))).toBe(true);
  expect(state.reads.some((u) => u.includes("ac=credit"))).toBe(true);
  expect(state.files.get("88")!.bytes.equals(bytes)).toBe(true);
  await evidence(page, info, state);
});

for (const kind of ["direct", "funded"] as const)
  test(`J11.integrated-packet-upload-copy-${kind}: fresh-account text copy excludes uploaded ownership and funding intent while retaining original uncertainty`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await upload(page);
    await page
      .getByRole("button", { name: "Insert note.txt", exact: true })
      .click();
    const text = await page
      .getByLabel("Complete source", { exact: true })
      .inputValue();
    state.saveOutcome = "lost-empty";
    if (kind === "funded") await fund(page);
    else {
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Publish red packet", exact: true })
        .click();
    }
    await expect.poll(() => state.commands.length).toBe(1);
    await expect(
      page.getByRole("button", {
        name: "Check current account and form",
        exact: true,
      }),
    ).toBeVisible();
    const before = await recovered(page);
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
    const copied = await recovered(page);
    expect(copied.account).toMatchObject({ id: "8" });
    expect(copied.source).toBe(text);
    expect(copied.uploadedReferences).toEqual([]);
    expect(copied.draft).toBeUndefined();
    expect(
      copied.options.find((option) => option.name === "hb_total")?.value,
    ).not.toBe("20");
    expect(copied.draftAttempts).toEqual(before.draftAttempts);
    expect(copied.attempts).toEqual(before.attempts);
    await expect(
      page.getByText(
        /Attachment references need reattachment or explicit removal/,
      ),
    ).toBeVisible();
    expect(state.commands).toHaveLength(1);
    expect(state.uploads).toHaveLength(1);
    expect(state.removals).toEqual([]);
    await evidence(page, info, state);
  });

for (const outcome of ["packet-unknown", "credit-unknown"] as const)
  test(`J6.J7.funded-draft-order-${outcome}: reordered associations cannot imply funding or credit confirmation`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.reverseStoredAttachments = true;
    if (outcome === "packet-unknown") state.packetState = "malformed";
    await upload(page, "first.txt");
    await upload(page, "second.txt");
    await save(page);
    await page
      .getByRole("button", { name: "Cancel funded draft save", exact: true })
      .click();
    expect(state.commands).toEqual([]);
    expect(state.credits).toEqual([]);
    await fund(page);
    await expect(
      page.getByText(/Confirmed forum draft 42/).last(),
    ).toBeVisible();
    const attempt = (await recovered(page)).draftAttempts![0]!;
    expect(attempt.observation?.attachments).toBe("confirmed");
    expect(attempt.redPacket?.credit).toBe("unknown");
    if (outcome === "packet-unknown")
      await expect(
        page.getByText("Packet state: unknown", { exact: true }),
      ).toBeVisible();
    expect(state.commands).toHaveLength(1);
    expect(state.uploads).toHaveLength(2);
    expect(state.associated).toEqual(["88", "89"]);
    expect(
      state.credits.filter((c) => c.operation === "HBS").length,
    ).toBeLessThanOrEqual(1);
    await evidence(page, info, state);
  });

const balanceHint = "目前餘額 980 天使币";
async function sendPacket(page: Page, kind: "direct" | "funded") {
  if (kind === "funded") await fund(page);
  else {
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Publish red packet", exact: true })
      .click();
  }
}
async function terminalPacket(page: Page, kind: "direct" | "funded") {
  const writing = await recovered(page);
  return (kind === "funded" ? writing.draftAttempts : writing.attempts)?.at(-1)
    ?.status;
}
for (const kind of ["direct", "funded"] as const) {
  for (const balance of ["990", "970"]) {
    test(`J6.J7.balance-drift-${kind}-${balance}: single command preserves source attachment and funding choices`, async ({
      page,
    }, info) => {
      const state = await fixture(page, { hints: [balanceHint] });
      await upload(page);
      await page
        .getByRole("button", { name: "Insert note.txt", exact: true })
        .click();
      const source = await page
        .getByLabel("Complete source", { exact: true })
        .inputValue();
      state.hints = [`目前餘額 ${balance} 天使币`];
      await sendPacket(page, kind);
      await expect
        .poll(() => terminalPacket(page, kind))
        .toMatch(/confirmed|not-sent|uncertain|rejected/);
      expect(state.commands).toHaveLength(1);
      expect(state.saved?.get("message")).toBe(source);
      expect(state.packet?.get("hb_total")).toBe("20");
      expect(state.packet?.get("hb_expire")).toBe("6");
      expect(state.associated).toEqual(["88"]);
      expect(state.uploads).toHaveLength(1);
      expect(state.credits.filter((c) => c.operation === "HBS")).toHaveLength(
        1,
      );
      await expect(
        page
          .getByText(
            kind === "funded"
              ? /Confirmed forum draft 42/
              : /Confirmed stored thread 42/,
          )
          .last(),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      expect(state.commands).toHaveLength(1);
      await evidence(page, info, state);
    });
  }
  for (const change of [
    "limits",
    "wording",
    "currency",
    "suffix",
    "missing",
    "duplicate",
    "duplicate-both",
    "reordered",
    "decimal",
    "negative",
    "max",
    "min",
    "step",
    "choices",
    "disabled",
    "account",
    "target",
  ] as const) {
    test(`J6.J7.balance-guard-${kind}-${change}: meaningful or ambiguous native drift still refuses before a command`, async ({
      page,
    }, info) => {
      const state = await fixture(page, {
        hints:
          change === "duplicate-both"
            ? [balanceHint, balanceHint]
            : [balanceHint],
      });
      if (kind === "direct")
        await page
          .getByRole("button", { name: "Review publication", exact: true })
          .click();
      state.hints = ["目前餘額 990 天使币"];
      if (change === "wording") state.hints = ["可用餘額 990 天使币"];
      if (change === "currency") state.hints = ["目前餘額 990 威望"];
      if (change === "suffix")
        state.hints = ["目前餘額 990 天使币 每份至少 30"];
      if (change === "missing") state.hints = [];
      if (change === "duplicate" || change === "duplicate-both")
        state.hints = ["目前餘額 990 天使币", "目前餘額 990 天使币"];
      if (change === "decimal") state.hints = ["目前餘額 990.5 天使币"];
      if (change === "negative") state.hints = ["目前餘額 -10 天使币"];
      if (change === "account") state.member = "8";
      state.formChange = (html) => {
        if (change === "limits")
          return html.replace(
            "最多 100 份;每份至少 10",
            "最多 100 份;每份至少 30",
          );
        if (change === "max") return html.replace('max="100"', 'max="1"');
        if (change === "min")
          return html.replace(
            'name="hb_total" min="1"',
            'name="hb_total" min="30"',
          );
        if (change === "step") return html.replace('step="1"', 'step="10"');
        if (change === "choices")
          return html.replace(
            '<option value="6">6 小時</option>',
            '<option value="6" disabled>6 小時</option>',
          );
        if (change === "disabled")
          return html.replace('name="hb_total"', 'name="hb_total" disabled');
        if (change === "target")
          return html.replace(
            "newthread&topicsubmit=yes&fid=5",
            "newthread&topicsubmit=yes&fid=6",
          );
        if (change === "reordered")
          return html
            .replace('<span class="hb-hint">目前餘額 990 天使币</span>', "")
            .replace(
              "</form>",
              '<span class="hb-hint">目前餘額 990 天使币</span></form>',
            );
        return html;
      };
      const source = await page
        .getByLabel("Complete source", { exact: true })
        .inputValue();
      if (kind === "direct")
        await page
          .getByRole("button", { name: "Publish red packet", exact: true })
          .click();
      else await fund(page);
      await expect.poll(() => terminalPacket(page, kind)).toBe("not-sent");
      expect(state.commands).toEqual([]);
      expect(state.credits).toEqual([]);
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      await page.reload();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      expect(state.commands).toEqual([]);
      await evidence(page, info, state);
    });
  }
  test(`J6.J7.balance-server-authority-${kind}: depleted balance rejection preserves uncertainty without automatic replay`, async ({
    page,
  }, info) => {
    const state = await fixture(page, { hints: [balanceHint] });
    state.hints = ["目前餘額 0 天使币"];
    state.saveOutcome = "rejected";
    state.rejectionMessage = "餘額不足";
    await sendPacket(page, kind);
    await expect
      .poll(() => terminalPacket(page, kind))
      .toMatch(/not-sent|uncertain|rejected/);
    expect(state.commands).toHaveLength(1);
    expect(await terminalPacket(page, kind)).toBe("uncertain");
    expect(state.saved).toBeNull();
    expect(state.credits).toEqual([]);
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]Draft source[/unknown]");
    const readCount = state.reads.length;
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect.poll(() => state.reads.length).toBeGreaterThan(readCount);
    expect(state.commands).toHaveLength(1);
    await evidence(page, info, state);
  });
}
for (const kind of ["direct", "draft"] as const)
  test(`J6.J7.balance-ordinary-${kind}: ordinary writing does not gain packet funding from balance metadata`, async ({
    page,
  }, info) => {
    const state = await fixture(page, { ordinary: true, hints: [balanceHint] });
    state.hints = ["目前餘額 990 天使币"];
    if (kind === "draft") await save(page);
    else {
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Publish thread", exact: true })
        .click();
    }
    await expect.poll(() => state.commands.length).toBe(1);
    await expect(
      page
        .getByText(
          kind === "draft"
            ? /Confirmed forum draft 42/
            : /Confirmed stored thread 42/,
        )
        .last(),
    ).toBeVisible();
    expect(state.packet).toBeNull();
    expect(state.saved?.get("message")).toBe("[unknown]Draft source[/unknown]");
    expect(state.credits.filter((c) => c.operation === "HBS")).toEqual([]);
    await evidence(page, info, state);
  });

test("J6.J7.balance-drift-direct-after-review: revalidate volatile balance at the final send boundary", async ({
  page,
}, info) => {
  const state = await fixture(page, { hints: [balanceHint] });
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  state.hints = ["目前餘額 970 天使币"];
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect
    .poll(() => terminalPacket(page, "direct"))
    .toMatch(/confirmed|not-sent|uncertain|rejected/);
  expect(state.commands).toHaveLength(1);
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  expect(state.packet?.get("hb_total")).toBe("20");
  await evidence(page, info, state);
});

for (const kind of ["direct", "funded"] as const)
  test(`J6.J7.balance-empty-position-${kind}: empty hints cannot hide a moved native balance label`, async ({
    page,
  }, info) => {
    const state = await fixture(page, { hints: [balanceHint, ""] });
    if (kind === "direct")
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
    state.hints = ["", "目前餘額 990 天使币"];
    if (kind === "direct")
      await page
        .getByRole("button", { name: "Publish red packet", exact: true })
        .click();
    else await fund(page);
    await expect
      .poll(() => terminalPacket(page, kind))
      .toMatch(/confirmed|not-sent|uncertain|rejected/);
    expect(await terminalPacket(page, kind)).toBe("not-sent");
    expect(state.commands).toEqual([]);
    expect(state.credits).toEqual([]);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("[unknown]Draft source[/unknown]");
    await evidence(page, info, state);
  });
