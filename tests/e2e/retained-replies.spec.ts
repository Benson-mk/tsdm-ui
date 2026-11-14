import { test, expect, chromium, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  selectSourceEditor,
  revealWritingTools,
  revealWritingDetails,
} from "./editor-controls";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = (id: string) =>
  `${origin}/forum.php?mod=viewthread&tid=${id}`;
const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const ledgers = new WeakMap<
  Page,
  { url: string; method: string; body: string | null }[]
>();
async function open(page: Page) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const state = {
    member: "7",
    refusedReply: false,
    saved: new Map<string, URLSearchParams>(),
    postGate: null as Promise<void> | null,
    uploadGate: null as Promise<void> | null,
    removalGate: null as Promise<void> | null,
    uploaded: false,
    gate: null as { thread: string; promise: Promise<void> } | null,
    requests: [] as { url: string; method: string; body: string | null }[],
  };
  ledgers.set(page, state.requests);
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__retained.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__retained.js"></script></body></html>`,
      });
    state.requests.push({
      url: url.href,
      method: request.method(),
      body: request.postData(),
    });
    if (url.pathname === "/misc.php") {
      if (state.uploadGate) await state.uploadGate;
      state.uploaded = true;
      return route.fulfill({ contentType: "text/plain", body: "88" });
    }
    if (url.searchParams.get("action") === "deleteattach") {
      if (state.removalGate) await state.removalGate;
      state.uploaded = false;
      return route.fulfill({
        contentType: "text/xml",
        body: "<root><![CDATA[]]></root>",
      });
    }
    if (url.searchParams.get("action") === "attachlist") {
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[${state.uploaded ? `<table><tr><td><a onclick="insertAttachTag('88');">intent.txt</a></td><td><input name="attachnew[88][description]" value=""><input name="attachnew[88][price]" value="0"><select name="attachnew[88][readperm]"><option value="">All</option></select></td></tr></table>` : ""}]]></root>`,
      });
    }
    if (request.method() === "POST") {
      if (state.postGate) await state.postGate;
      const thread = url.searchParams.get("tid") ?? "42";
      state.saved.set(thread, new URLSearchParams(request.postData() ?? ""));
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=${thread}&pid=${thread}99&page=1#pid${thread}99', 'Reply accepted', {});</script>]]></root>`,
      });
    }
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
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
      return route.fulfill({
        contentType: "text/html",
        body: account + '<div id="messagetext">权限不足</div>',
      });
    let body = account + board;
    if (url.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid">${["42", "43", "44"].map((tid) => `<tbody id="normalthread_${tid}"><tr><th><a class="xst" href="${threadURL(tid)}">Thread ${tid}</a></th></tr></tbody>`).join("")}</table>`;
    else if (url.searchParams.get("mod") === "post")
      body += `<form id="postform" method="post" action="forum.php?mod=post&action=${saved ? `edit&pid=${id}99` : newThread ? "newthread" : "reply"}&fid=5${newThread ? "" : `&tid=${id}`}&${saved ? "editsubmit" : newThread ? "topicsubmit" : "replysubmit"}=yes"><input type="hidden" name="formhash" value="SYNTHETIC_RETAINED_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${post ? `<input type="hidden" name="reppid" value="${post}"><input type="hidden" name="reppost" value="${post}"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_8"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">` : ""}<input name="subject" value=""><textarea name="message">${escape(saved?.get("message") ?? "")}</textarea><label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><button type="submit" name="${saved ? "editsubmit" : newThread ? "topicsubmit" : "replysubmit"}" value="yes">Reply</button></form><script>var upload = new SWFUpload({upload_url:'misc.php?mod=swfupload&action=swfupload&operation=upload&fid=5',post_params:{uid:'${state.member}',hash:'SYNTHETIC_UPLOAD_HASH'},file_upload_limit:0,file_queue_limit:0,file_size_limit:'512',file_types:'*.txt',custom_settings:{uploadSource:'forum',uploadType:'attach',maxSizePerDay:3000000,maxAttachNum:10,filterType:{txt:524288}}});</script>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">Thread ${id}</h1><div id="post_${id}01"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum${id}01"><em>1</em>#</a><div class="pcb"><p>${escape(`Original opening for thread ${id}`)}</p></div></div>${state.saved.has(id) ? `<div id="post_${id}99"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum${id}99"><em>2</em>#</a><div class="pcb"><p>Stored authored reply</p></div></div>` : ""}</div>`;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(boardURL);
  await expect(page.locator(".thread-row")).toHaveCount(3);
  return state;
}
async function choose(page: Page, id: string) {
  if (!(await page.locator(`[data-thread-id="${id}"] .subject`).count())) {
    if (
      !(await page
        .getByRole("navigation", { name: "Boards navigation", exact: true })
        .getByRole("link", { name: "Music discussion", exact: true })
        .count())
    ) {
      await page
        .getByRole("button", { name: "Refresh thread", exact: true })
        .click();
    }
    await page
      .getByRole("navigation", { name: "Boards navigation", exact: true })
      .getByRole("link", { name: "Music discussion", exact: true })
      .click();
  }
  await page.locator(`[data-thread-id="${id}"] .subject`).click();
  await expect(
    page.getByRole("heading", { name: `Thread ${id}`, exact: true }),
  ).toBeVisible();
}
test.afterEach(async ({ page, browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("retained-requests.json", {
    body: JSON.stringify(ledgers.get(page), null, 2),
    contentType: "application/json",
  });
  await info.attach("retained-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UX106.switch: retain each thread's literal source, addressed target and options with one active editor", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  await (
    await selectSourceEditor(page)
  ).fill("[b]Thread A literal writing[/b]\n[unknown]保留 A[/unknown]");
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await choose(page, "43");
  await expect(
    page.getByRole("dialog", { name: "Keep current writing?" }),
  ).toHaveCount(0);
  await expect(page.locator(".source-writing")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Different thread B draft");
  for (let repeat = 0; repeat < 2; repeat++) {
    await choose(page, "42");
    await expect(await selectSourceEditor(page)).toHaveValue(
      "[b]Thread A literal writing[/b]\n[unknown]保留 A[/unknown]",
    );
    await revealWritingTools(page);
    await expect(
      page.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    await expect(page.locator(".source-writing")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Remove reply target", exact: true }),
    ).toBeVisible();
    await choose(page, "43");
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Different thread B draft",
    );
    await revealWritingTools(page);
    await expect(page.getByLabel("Signature", { exact: true })).toBeChecked();
    await expect(page.locator(".source-writing")).toHaveCount(1);
  }
  await expect(page.locator('[data-thread-id="42"]')).toContainText(
    "Local draft",
  );
  await expect(page.locator('[data-thread-id="43"]')).toContainText(
    "Local draft",
  );
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
});

test("UX106.reload: recover every thread and selected attachment intent without retaining bytes or authority", async ({
  page,
}) => {
  await open(page);
  for (const id of ["42", "43"]) {
    await choose(page, id);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill(`Page-session writing ${id}`);
    await revealWritingTools(page);
    await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
      name: `intent-${id}.txt`,
      mimeType: "text/plain",
      buffer: Buffer.from(`PRIVATE_UNUPLOADED_BYTES_${id}`),
    });
  }
  await choose(page, "42");
  await revealWritingTools(page);
  await expect(
    page.getByRole("button", { name: "Upload intent-42.txt", exact: true }),
  ).toBeEnabled();
  await choose(page, "43");
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Page-session writing 43",
  );
  await revealWritingTools(page);
  await expect(
    page.getByText(/File bytes are not retained across refresh/),
  ).toBeVisible();
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Page-session writing 42",
  );
  await revealWritingTools(page);
  await expect(
    page.getByText(/File bytes are not retained across refresh/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload intent-42.txt", exact: true }),
  ).toHaveCount(0);
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).not.toContain("SYNTHETIC_RETAINED_TOKEN");
  expect(saved).not.toContain("PRIVATE_UNUPLOADED_BYTES");
});

test("UX106.late: delayed preparation cannot replace another selected thread or revive old authorization", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("A must survive delayed forms");
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(page.getByText(/Review reply revision/)).toBeVisible();
  await choose(page, "43");
  let release!: () => void;
  state.gate = {
    thread: "43",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) =>
          new URL(request.url).searchParams.get("mod") === "post" &&
          new URL(request.url).searchParams.get("tid") === "43",
      ),
    )
    .toBe(true);
  await choose(page, "44");
  release();
  state.gate = null;
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "A must survive delayed forms",
  );
  await expect(page.getByText(/Review reply revision/)).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Thread 44", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".source-writing")).toHaveCount(0);
  await page.goForward();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "A must survive delayed forms",
  );
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
});

test("UX106.account: automatic account changes share one thread slot and keep immutable original attempts", async ({
  page,
  context,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Original A content without silent B replacement");
  await revealWritingDetails(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await choose(page, "43");
  state.member = "8";
  await choose(page, "44");
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await expect(
    page.getByText(/current account differs from Writer 7/),
  ).toHaveCount(0);
  state.member = "7";
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await revealWritingTools(page);
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Select attachments", { exact: true }),
  ).toBeEnabled();
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await choose(page, "43");
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await revealWritingTools(page);
  await expect(
    page.getByLabel("Select attachments", { exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await revealWritingTools(page);
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Select attachments", { exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText(/current account differs from Writer 7/),
  ).toHaveCount(0);
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "Original A content without silent B replacement",
  );
  await revealWritingTools(fresh);
  await revealWritingDetails(fresh);
  await fresh
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    fresh.getByLabel("Select attachments", { exact: true }),
  ).toBeEnabled();
  const recovered = await fresh.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(recovered.account.id).toBe("7");
  expect(recovered.attempts).toHaveLength(1);
  expect(recovered.attempts[0].publication.submission.writing.account.id).toBe(
    "7",
  );
  expect(recovered.attempts[0].status).toBe("confirmed");
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
  await test.info().attach("shared-account-recovery.json", {
    body: JSON.stringify(recovered),
    contentType: "application/json",
  });
});

for (const failure of ["quota", "refused", "readback"] as const) {
  test(`UX106.storage-${failure}: keep parked source and visible unsaved recovery without an active editor`, async ({
    page,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill(`Unacknowledged ${failure} writing`);
    await page.evaluate((mode) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "tsdm.workspace.recovery") {
          if (mode === "readback") return;
          throw new DOMException(
            "Induced browser storage failure",
            mode === "quota" ? "QuotaExceededError" : "SecurityError",
          );
        }
        return set.call(this, key, value);
      };
    }, failure);
    await choose(page, "43");
    await expect(page.locator(".source-writing")).toHaveCount(0);
    await expect(
      page.getByText(
        "Refresh recovery unavailable. This tab keeps navigation while the page remains open.",
        { exact: true },
      ),
    ).toBeVisible();
    await choose(page, "42");
    await expect(await selectSourceEditor(page)).toHaveValue(
      `Unacknowledged ${failure} writing`,
    );
    await revealWritingTools(page);
    await expect(
      page.getByText(/Refresh recovery unavailable/).first(),
    ).toBeVisible();
  });
}

test("UX106.indicators: cleared and unchanged sent writing lose the badge while new options or attachment intent restore it", async ({
  page,
}) => {
  const state = await open(page);
  const row = page.locator('[data-thread-id="42"]');
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await expect(row).not.toContainText("Local draft");
  await (await selectSourceEditor(page)).fill("A confirmed reply with options");
  await expect(row).toContainText("Local draft");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(row).not.toContainText("Local draft");
  await choose(page, "43");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("B remains unfinished");
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "A confirmed reply with options",
  );
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).check();
  await expect(row).toContainText("Local draft");
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await expect(row).not.toContainText("Local draft");
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "new-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("New intent"),
  });
  await expect(row).toContainText("Local draft");
  await page
    .getByRole("button", {
      name: "Remove local selection new-intent.txt",
      exact: true,
    })
    .click();
  await expect(row).not.toContainText("Local draft");
  await (await selectSourceEditor(page)).fill("");
  await expect(row).not.toContainText("Local draft");
  await expect(page.locator('[data-thread-id="43"]')).toContainText(
    "Local draft",
  );
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
  expect(state.saved.get("42")?.get("message")).toBe(
    "A confirmed reply with options",
  );
});

for (const schema of [2, 3]) {
  test(`UX106.legacy-${schema}: recover existing single-context writing before retaining another reply`, async ({
    page,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill(`Legacy ${schema} source`);
    const raw = await page.evaluate((version) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      record.schema = version;
      delete record.retainedReplies;
      return JSON.stringify(record);
    }, schema);
    await page.addInitScript(
      (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
      raw,
    );
    await page.reload();
    await expect(await selectSourceEditor(page)).toHaveValue(
      `Legacy ${schema} source`,
    );
    await choose(page, "43");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill("New retained version");
    await choose(page, "42");
    await expect(await selectSourceEditor(page)).toHaveValue(
      `Legacy ${schema} source`,
    );
  });
}
for (const failure of [
  "duplicate-thread",
  "duplicate-identity",
  "non-reply",
  "missing-collection",
  "future",
  "corrupt",
] as const) {
  test(`UX106.invalid-${failure}: preserve the entire raw record until deliberate reset`, async ({
    page,
  }) => {
    await open(page);
    for (const id of ["42", "43"]) {
      await choose(page, id);
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      await (await selectSourceEditor(page)).fill(`Recoverable ${id} source`);
    }
    const raw = await page.evaluate((kind) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      if (kind === "duplicate-thread")
        record.retainedReplies.push(record.writing);
      if (kind === "duplicate-identity")
        record.retainedReplies[0].id = record.writing.id;
      if (kind === "non-reply") {
        record.retainedReplies[0].action = "new-thread";
        delete record.retainedReplies[0].replyTarget;
      }
      if (kind === "missing-collection") delete record.retainedReplies;
      if (kind === "future") record.schema = 999;
      const value =
        JSON.stringify(record) + (kind === "corrupt" ? "BROKEN" : "");
      sessionStorage.setItem("tsdm.workspace.recovery", value);
      return value;
    }, failure);
    await page.addInitScript(
      (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
      raw,
    );
    await page.reload();
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Inspect retained recovery data",
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel("Retained recovery data", { exact: true }),
    ).toHaveValue(raw);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBe(raw);
  });
}

test("UX106.effect: pending publication keeps its owner and fresh B never inherits A's history", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Immutable original A submission");
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  await page.locator('[data-thread-id="43"] .subject').click();
  await expect(
    page.getByText("Keep current writing?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await choose(page, "43");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Independent B content");
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
  await choose(page, "42");
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
  expect(state.saved.get("42")?.get("message")).toBe(
    "Immutable original A submission",
  );
});

for (const refused of [false, true]) {
  test(`UX106.nonreply-return-${refused ? "refused" : "retargeted"}: retain non-reply guard and resume existing reply before fresh requested-target preparation`, async ({
    page,
  }) => {
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Post 4201 actions", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
    await (
      await selectSourceEditor(page)
    ).fill("Existing thread A writing must not be replaced");
    await revealWritingTools(page);
    await page.getByLabel("Signature", { exact: true }).uncheck();
    await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
      name: "retained-intent.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Retained intent"),
    });
    await choose(page, "43");
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Complete source", exact: true })
      .fill("Deliberately replaceable non-reply writing");
    await page.locator('[data-thread-id="42"] .subject').click();
    await expect(
      page.getByText("Keep current writing?", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Keep writing and read thread",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await expect(
      page.getByText(/Another writing context is already retained/),
    ).toBeVisible();
    state.refusedReply = refused;
    await page
      .getByRole("button", {
        name: "Discard local changes and prepare",
        exact: true,
      })
      .click();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Existing thread A writing must not be replaced",
    );
    await expect(
      page.getByRole("button", { name: "Remove reply target", exact: true }),
    ).toHaveCount(refused ? 1 : 0);
    await revealWritingTools(page);
    await expect(
      page.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    await expect(
      page.getByRole("button", {
        name: "Upload retained-intent.txt",
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Existing thread A writing must not be replaced",
    );
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toHaveCount(0);
  });
}

test("UX106.attachments: selected bytes survive switching, upload/removal keep ownership, and uploaded intent returns intact", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Attachment writing A ");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("EXACT_SELECTED_A_BYTES"),
  });
  await choose(page, "43");
  await choose(page, "42");
  await revealWritingTools(page);
  let releaseUpload!: () => void;
  state.uploadGate = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) => new URL(request.url).pathname === "/misc.php",
      ),
    )
    .toBe(true);
  await page.locator('[data-thread-id="43"] .subject').click();
  await expect(
    page.getByText("Keep current writing?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  releaseUpload();
  await page
    .getByRole("button", { name: "Insert intent.txt", exact: true })
    .click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    /\[attach\]88\[\/attach\]/,
  );
  await choose(page, "43");
  await choose(page, "42");
  await revealWritingTools(page);
  await expect(
    page.getByRole("button", {
      name: "Remove server file intent.txt",
      exact: true,
    }),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    /\[attach\]88\[\/attach\]/,
  );
  let releaseRemoval!: () => void;
  state.removalGate = new Promise<void>((resolve) => {
    releaseRemoval = resolve;
  });
  await page
    .getByRole("button", { name: "Remove server file intent.txt", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    })
    .click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) =>
          new URL(request.url).searchParams.get("action") === "deleteattach",
      ),
    )
    .toBe(true);
  await page.locator('[data-thread-id="43"] .subject').click();
  await expect(
    page.getByText("Keep current writing?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  releaseRemoval();
  await expect(
    page.getByRole("button", {
      name: "Remove intent.txt",
      exact: true,
    }),
  ).toBeVisible();
  await choose(page, "43");
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    /\[attach\]88\[\/attach\]/,
  );
  const uploads = state.requests.filter(
    (request) => new URL(request.url).pathname === "/misc.php",
  );
  expect(uploads).toHaveLength(1);
  expect(uploads[0]!.body).toContain("EXACT_SELECTED_A_BYTES");
  expect(
    state.requests.filter((request) =>
      new URL(request.url).searchParams.has("replysubmit"),
    ),
  ).toHaveLength(0);
});

test("UX106.pending-recovery: inactive pending snapshots recover as uncertain with original actor and no replay", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Original actor pending source");
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  const raw = await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.retainedReplies.push(record.writing);
    record.writing = null;
    return JSON.stringify(record);
  });
  expect(raw).toContain('"status":"pending"');
  await page.addInitScript(
    (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
    raw,
  );
  await page.reload();
  release();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original actor pending source",
  );
  await revealWritingTools(page);
  await expect(
    page.getByText(/Pending publication restored as uncertain/),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Check current account and form");
  const recovered = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(recovered.account.id).toBe("7");
  expect(recovered.attempts[0].status).toBe("uncertain");
  expect(recovered.attempts[0].publication.submission.writing.account.id).toBe(
    "7",
  );
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
});

test("UX106.pending-ack: failed collection acknowledgement retains both replies and dispatches nothing", async ({
  page,
}) => {
  const state = await open(page);
  for (const id of ["42", "43"]) {
    await choose(page, id);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill(`Unsent retained ${id}`);
  }
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "tsdm.workspace.recovery")
        throw new DOMException("Induced quota", "QuotaExceededError");
      return set.call(this, key, value);
    };
  });
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/Publication was not sent because recovery/),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Unsent retained 43",
  );
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Unsent retained 42",
  );
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(0);
});

test("UX106.return-during-prepare: leaving and returning to the same context revokes delayed review authority", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("A survives its own delayed review");
  await revealWritingTools(page);
  let release!: () => void;
  state.gate = {
    thread: "42",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  const forms = () =>
    state.requests.filter(
      (request) => new URL(request.url).searchParams.get("mod") === "post",
    ).length;
  const before = forms();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect.poll(forms).toBeGreaterThan(before);
  await choose(page, "43");
  await choose(page, "42");
  const response = page.waitForResponse(
    (value) => new URL(value.url()).searchParams.get("mod") === "post",
  );
  release();
  state.gate = null;
  await response;
  await expect(await selectSourceEditor(page)).toHaveValue(
    "A survives its own delayed review",
  );
  await expect(page.getByText(/Review reply revision/)).toHaveCount(0);
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(0);
});

test("UX106.parked-history: reading A while B sends never copies parked B's immutable history into A", async ({
  page,
}) => {
  const state = await open(page);
  for (const id of ["42", "43"]) {
    await choose(page, id);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill(`Owned writing ${id}`);
  }
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  release();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(await selectSourceEditor(page)).toHaveValue("Owned writing 42");
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
  await choose(page, "43");
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue("Owned writing 43");
  await choose(page, "42");
  await revealWritingTools(page);
  await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
});

test("UX106.startup-owners: pending retained writing cannot erase another recovered operation owner", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Pending reply beside independent favorite history");
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  const raw = await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.retainedReplies.push(record.writing);
    record.writing = null;
    record.favoriteAttempts = [
      {
        id: "9cdce87d-c882-4b05-960c-899c21f1873b",
        command: {
          id: "a33ae9bb-0450-439d-ab68-bc530ea19bd2",
          generation: 1,
          intent: {
            action: "add",
            kind: "thread",
            targetId: "44",
            accountId: "7",
            recordId: null,
          },
        },
        status: "uncertain",
        checked: false,
        pages: null,
        message: "Independently retained favorite uncertainty",
      },
    ];
    return JSON.stringify(record);
  });
  await page.addInitScript(
    (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
    raw,
  );
  await page.reload();
  release();
  await expect(
    page.getByText("Independently retained favorite uncertainty", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-favorite-attempt="9cdce87d-c882-4b05-960c-899c21f1873b"]',
    ),
  ).toContainText("Account 7");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Pending reply beside independent favorite history",
  );
  await revealWritingTools(page);
  await expect(
    page.getByText(/Pending publication restored as uncertain/),
  ).toBeVisible();
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
});

for (const different of [true, false]) {
  test(`UX106.history-${different ? "conflict" : "equivalent"}: preserve incompatible observations and accept equivalent snapshots without ordering them`, async ({
    page,
  }) => {
    const state = await open(page);
    for (const id of ["42", "43"]) {
      await choose(page, id);
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      await (await selectSourceEditor(page)).fill(`Owned writing ${id}`);
    }
    await revealWritingTools(page);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Discard local changes and prepare",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "New thread in Music discussion",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Complete source", exact: true })
      .fill("Nonreply source with newer confirmed observation");
    const raw = await page.evaluate((divergent) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      record.retainedReplies[0].attempts = record.writing.attempts.map(
        (attempt: Record<string, unknown>) =>
          divergent
            ? {
                ...attempt,
                status: "uncertain",
                result: null,
                checked: false,
                message: "Older retained observation",
              }
            : Object.fromEntries(Object.entries(attempt).reverse()),
      );
      return JSON.stringify(record);
    }, different);
    await page.addInitScript(
      (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
      raw,
    );
    await page.reload();
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", {
        name: "Keep writing and read thread",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Discard local changes and prepare",
        exact: true,
      })
      .click();
    if (different) {
      await expect(
        page.getByText(/Different observations of the same earlier operation/),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Complete source", exact: true }),
      ).toHaveValue("Nonreply source with newer confirmed observation");
      const retained = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
      );
      expect(retained.retainedReplies[0].source).toBe("Owned writing 42");
      expect(retained.retainedReplies[0].attempts[0].status).toBe("uncertain");
      expect(retained.writing.attempts[0].status).toBe("confirmed");
    } else {
      await expect(await selectSourceEditor(page)).toHaveValue(
        "Owned writing 42",
      );
      await revealWritingTools(page);
      await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(1);
      await expect(
        page.getByText(/Different observations of the same earlier operation/),
      ).toHaveCount(0);
    }
    expect(
      state.requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
  });
}

test("UX107.fresh-tab: recover acknowledged per-thread reply source, target and options without a page-session copy", async ({
  page,
  context,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  await (
    await selectSourceEditor(page)
  ).fill("[b]Restart retained A[/b]\nLiteral [unknown]原文[/unknown]");
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await choose(page, "43");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Independent thread B survives");
  await revealWritingDetails(page);
  await expect(
    page.getByText(/recovery is up to date|draft.*saved.*browser/i),
  ).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await expect(fresh.locator(".thread-row")).toHaveCount(3);
  await choose(fresh, "42");
  await expect(fresh.locator(".source-writing")).toHaveCount(1);
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "[b]Restart retained A[/b]\nLiteral [unknown]原文[/unknown]",
  );
  await revealWritingTools(fresh);
  await expect(
    fresh.getByLabel("Signature", { exact: true }),
  ).not.toBeChecked();
  await expect(
    fresh.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toBeVisible();
  await choose(fresh, "43");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "Independent thread B survives",
  );
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
  await test.info().attach("fresh-independent-tab.png", {
    body: await fresh.screenshot(),
    contentType: "image/png",
  });
});

test("UX107.conflict: retain both tabs' competing source and pause editing and review through reload", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Common observed draft");
  await revealWritingDetails(page);
  await expect(
    page.getByText(/recovery is up to date|draft.*saved.*browser/i),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const otherEditor = await selectSourceEditor(other);
  await expect(otherEditor).toHaveValue("Common observed draft");
  // Delay advisory delivery at the external browser-host boundary. The real
  // durable compare-and-preserve still decides whether these writes compete.
  await other.evaluate(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  await (await selectSourceEditor(page)).fill("First tab competing writing");
  await revealWritingDetails(page);
  await expect(
    page.getByText(/recovery is up to date|draft.*saved.*browser/i),
  ).toBeVisible();
  await otherEditor.fill("Second tab competing writing");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await expect(
    other
      .getByRole("region", { name: "Conflicting local reply drafts" })
      .getByRole("textbox"),
  ).toHaveCount(2);
  const retained = await other
    .getByRole("region", { name: "Conflicting local reply drafts" })
    .getByRole("textbox")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    );
  expect(retained).toEqual(
    expect.arrayContaining([
      "First tab competing writing",
      "Second tab competing writing",
    ]),
  );
  await expect(otherEditor).toHaveAttribute("readonly", "");
  await revealWritingTools(other);
  await expect(other.getByLabel("Signature", { exact: true })).toBeDisabled();
  await expect(
    other.getByRole("button", { name: "Review publication", exact: true }),
  ).toBeDisabled();
  await other.reload();
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toContainText("Both versions are retained");
  await expect(
    other
      .getByRole("region", { name: "Conflicting local reply drafts" })
      .getByRole("textbox"),
  ).toHaveCount(2);
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
  await test.info().attach("conflicting-versions.png", {
    body: await other.screenshot(),
    contentType: "image/png",
  });
});

test("UX107.clean-remote: a clean second tab adopts the current draft while unrelated thread writing stays independent", async ({
  page,
  context,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Observed common source");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Observed common source",
  );
  await (
    await selectSourceEditor(page)
  ).fill("First tab latest acknowledged source");
  await expect(await selectSourceEditor(other)).toHaveValue(
    "First tab latest acknowledged source",
  );
  await choose(other, "43");
  await other
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(other)
  ).fill("Independent thread remains writable");
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toHaveCount(0);
  await expect(await selectSourceEditor(page)).toHaveValue(
    "First tab latest acknowledged source",
  );
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
});

test("UX107.preflight-conflict: a competing draft detected during final native preflight prevents publication", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Original submitted source");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Original submitted source",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  let release!: () => void;
  state.gate = {
    thread: "42",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  const before = state.requests.length;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests
          .slice(before)
          .filter(
            (request) =>
              new URL(request.url).searchParams.get("mod") === "post",
          ).length,
    )
    .toBeGreaterThan(0);
  await (
    await selectSourceEditor(other)
  ).fill("Competing second-tab source during preflight");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  state.gate = null;
  release();
  await expect(
    page
      .getByText(/Confirmed stored reply|Nothing was sent|nothing was sent/)
      .first(),
  ).toBeVisible();
  expect(state.requests.filter((request) => request.method === "POST")).toEqual(
    [],
  );
  await expect(
    page
      .getByRole("region", { name: "Conflicting local reply drafts" })
      .getByRole("textbox"),
  ).toHaveCount(2);
});

for (const operation of ["upload", "remove"] as const) {
  test(`UX107.attachment-preflight-${operation}: detected conflict prevents the effect after delayed native form checks`, async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, "BroadcastChannel", {
        value: undefined,
        configurable: true,
      });
    });
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Attachment effect owner source");
    await revealWritingTools(page);
    if (operation === "remove") {
      await page
        .getByLabel("Select attachments", { exact: true })
        .setInputFiles({
          name: "intent.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("UNUPLOADED_GUARDED_BYTES"),
        });
      await page
        .getByRole("button", { name: "Upload intent.txt", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Remove server file intent.txt",
          exact: true,
        }),
      ).toBeVisible();
    }
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    const other = await context.newPage();
    await other.goto(boardURL);
    await choose(other, "42");
    await expect(await selectSourceEditor(other)).toHaveValue(
      "Attachment effect owner source",
    );
    if (operation === "upload")
      await page
        .getByLabel("Select attachments", { exact: true })
        .setInputFiles({
          name: "intent.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("UNUPLOADED_GUARDED_BYTES"),
        });
    let release!: () => void;
    state.gate = {
      thread: "42",
      promise: new Promise<void>((resolve) => {
        release = resolve;
      }),
    };
    const before = state.requests.length;
    if (operation === "upload")
      await page
        .getByRole("button", { name: "Upload intent.txt", exact: true })
        .click();
    else {
      await page
        .getByRole("button", {
          name: "Remove server file intent.txt",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: "Confirm immediate file removal",
          exact: true,
        })
        .click();
    }
    await expect
      .poll(
        () =>
          state.requests
            .slice(before)
            .filter(
              (request) =>
                new URL(request.url).searchParams.get("mod") === "post",
            ).length,
      )
      .toBeGreaterThan(0);
    await (
      await selectSourceEditor(other)
    ).fill(`Competing ${operation} source`);
    await expect(
      other.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      page.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    state.gate = null;
    release();
    await expect(
      page
        .getByText(
          /Nothing was uploaded|Nothing was removed|not sent|Original selected bytes sent|removed/i,
        )
        .first(),
    ).toBeVisible();
    await expect
      .poll(
        () =>
          state.requests
            .slice(before)
            .filter(
              (request) =>
                new URL(request.url).pathname === "/misc.php" ||
                new URL(request.url).searchParams.get("action") ===
                  "deleteattach",
            ).length,
      )
      .toBe(0);
  });
}

test("UX107.disposal: acknowledged deliberate non-reply replacement does not resurrect the discarded ordinary draft", async ({
  page,
  context,
}) => {
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Deliberately discarded ordinary source");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "New thread in Music discussion",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Browser recovery is up to date for this page session.", {
      exact: true,
    }),
  ).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  await expect(fresh.locator(".source-writing")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Complete source", exact: true }),
  ).toHaveValue("");
});

test("UX107.incompatible: incompatible durable data stays inspectable without an active editor and reload cannot erase it", async ({
  page,
  context,
}) => {
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Recoverable writing in incompatible durable row");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("threads", "readwrite"),
        store = tx.objectStore("threads"),
        read = store.get("42");
      read.onsuccess = () => store.put({ ...read.result, schema: 99 });
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await expect(
    fresh.getByRole("region", { name: "Local reply recovery needs attention" }),
  ).toBeVisible();
  await fresh
    .getByText("Inspect retained local reply data", { exact: true })
    .click();
  await expect(
    fresh.getByRole("textbox", {
      name: "Retained local reply data",
      exact: true,
    }),
  ).toHaveValue(/Recoverable writing in incompatible durable row/);
  await fresh.reload();
  await expect(
    fresh.getByRole("region", { name: "Local reply recovery needs attention" }),
  ).toBeVisible();
  await fresh
    .getByText("Inspect retained local reply data", { exact: true })
    .click();
  await expect(
    fresh.getByRole("textbox", {
      name: "Retained local reply data",
      exact: true,
    }),
  ).toHaveValue(/"schema":99/);
});

for (const failure of [
  "refusal",
  "quota",
  "abort",
  "weak-durability",
] as const) {
  test(`UX107.storage-${failure}: unacknowledged source stays live and the prior acknowledged draft survives independently`, async ({
    page,
    context,
  }) => {
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Previously acknowledged durable writing");
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate((mode) => {
      const original = IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction = function (names, access, options) {
        if (
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readwrite"
        ) {
          if (mode === "quota" || mode === "refusal")
            throw new DOMException(
              "Induced durable host failure",
              mode === "quota" ? "QuotaExceededError" : "SecurityError",
            );
          const tx = original.call(this, names, access, options);
          if (mode === "weak-durability")
            Object.defineProperty(tx, "durability", { value: "relaxed" });
          else {
            const put = IDBObjectStore.prototype.put;
            const store = tx.objectStore("threads");
            store.put = function (value, key) {
              const request = put.call(this, value, key);
              request.addEventListener("success", () => tx.abort());
              return request;
            };
            const objectStore = tx.objectStore.bind(tx);
            tx.objectStore = (name) =>
              name === "threads" ? store : objectStore(name);
          }
          return tx;
        }
        return original.call(this, names, access, options);
      };
    }, failure);
    await (
      await selectSourceEditor(page)
    ).fill(`Live unacknowledged ${failure} writing`);
    await expect(
      page.getByText(/Local reply drafts could not be saved/).first(),
    ).toBeVisible();
    const fresh = await context.newPage();
    await fresh.goto(boardURL);
    await choose(fresh, "42");
    await expect(await selectSourceEditor(fresh)).toHaveValue(
      "Previously acknowledged durable writing",
    );
    await expect(await selectSourceEditor(page)).toHaveValue(
      `Live unacknowledged ${failure} writing`,
    );
    expect(
      state.requests.filter((request) => request.method !== "GET"),
    ).toEqual([]);
  });
}
for (const failure of ["readback", "checkpoint"] as const) {
  test(`UX107.after-commit-${failure}: failed acknowledgement remains unsaved and retry cannot fork its own committed source`, async ({
    page,
    context,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Before late acknowledgement failure");
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate((mode) => {
      const originalTransaction = IDBDatabase.prototype.transaction,
        originalSet = Storage.prototype.setItem;
      const originalVersion = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      ).replyCheckpoints["42"].version;
      let committed = false;
      IDBDatabase.prototype.transaction = function (names, access, options) {
        if (
          mode === "readback" &&
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readonly" &&
          committed
        )
          throw new DOMException(
            "Induced post-commit readback refusal",
            "SecurityError",
          );
        const tx = originalTransaction.call(this, names, access, options);
        if (
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readwrite"
        )
          tx.addEventListener("complete", () => {
            committed = true;
          });
        return tx;
      };
      Storage.prototype.setItem = function (key, value) {
        if (
          mode === "checkpoint" &&
          key === "tsdm.workspace.recovery" &&
          JSON.parse(value).replyCheckpoints?.["42"]?.version !==
            originalVersion
        )
          throw new DOMException(
            "Induced checkpoint refusal",
            "QuotaExceededError",
          );
        return originalSet.call(this, key, value);
      };
      Object.defineProperty(window, "restore107Host", {
        configurable: true,
        value: () => {
          IDBDatabase.prototype.transaction = originalTransaction;
          Storage.prototype.setItem = originalSet;
        },
      });
    }, failure);
    await (
      await selectSourceEditor(page)
    ).fill(`Committed source with failed ${failure}`);
    await expect(
      page.getByText(/Local reply drafts could not be saved/).first(),
    ).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { restore107Host(): void }).restore107Host();
      window.dispatchEvent(new Event("focus"));
    });
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toHaveCount(0);
    const fresh = await context.newPage();
    await fresh.goto(boardURL);
    await choose(fresh, "42");
    await expect(await selectSourceEditor(fresh)).toHaveValue(
      `Committed source with failed ${failure}`,
    );
    await expect(
      fresh.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toHaveCount(0);
  });
}

test("UX107.file-capability: another tab recovers only attachment intent without erasing the original tab's live selected bytes", async ({
  page,
  context,
}) => {
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Selected attachment intent");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "local-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("PRIVATE_LOCAL_BYTES_MUST_NOT_BECOME_DURABLE"),
  });
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await revealWritingTools(other);
  await expect(
    other.getByText(/File bytes are not retained across refresh/),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: "Upload local-intent.txt", exact: true }),
  ).toHaveCount(0);
  await expect(
    other.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("button", { name: "Upload local-intent.txt", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toHaveCount(0);
});

test("UX107.delayed-latest-session: reload during native storage contention retains the latest navigation and both newer drafts", async ({
  page,
}) => {
  await open(page);
  for (const id of ["42", "43"]) {
    await choose(page, id);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill(`Acknowledged ${id}`);
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.evaluate(async () => {
    const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // A real native transaction holds the store. No application module or
    // acknowledgement promise is replaced, and navigation ends this owner.
    const tx = db.transaction("threads", "readwrite"),
      store = tx.objectStore("threads");
    const keepAlive = () => {
      const read = store.get("42");
      read.onsuccess = keepAlive;
    };
    keepAlive();
  });
  await choose(page, "42");
  await (
    await selectSourceEditor(page)
  ).fill("Latest A while durable commit waits");
  await choose(page, "43");
  await (
    await selectSourceEditor(page)
  ).fill("Latest B and latest navigation while commit waits");
  await revealWritingDetails(page);
  await expect(
    page.getByText(/has not yet acknowledged these changes/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toHaveCount(0);
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Latest B and latest navigation while commit waits",
  );
  await choose(page, "42");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Latest A while durable commit waits",
  );
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toHaveCount(0);
});

test("UX107.process-restart: source target options and unavailable file intent survive a real isolated Edge process restart without session recovery", async ({
  browserName,
}, info) => {
  expect(browserName).toBe("chromium");
  const profile = info.outputPath("restart-profile");
  let running = await chromium.launchPersistentContext(profile, {
    channel: "msedge",
    headless: true,
    offline: true,
    viewport: { width: 1280, height: 900 },
  });
  try {
    const first = await running.newPage();
    await open(first);
    await choose(first, "42");
    await first
      .getByRole("button", { name: "Post 4201 actions", exact: true })
      .click();
    await first.getByRole("menuitem", { name: "Reply", exact: true }).click();
    await (
      await selectSourceEditor(first)
    ).fill("[b]Actual process restart writing[/b]\n原文");
    await revealWritingTools(first);
    await first.getByLabel("Signature", { exact: true }).uncheck();
    await first
      .getByLabel("Select attachments", { exact: true })
      .setInputFiles({
        name: "restart-intent.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("NEVER_DURABLE_FILE_BYTES_107"),
      });
    await expect(
      first.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    await info.attach("before-process-close.png", {
      body: await first.screenshot(),
      contentType: "image/png",
    });
    await running.close();
    running = await chromium.launchPersistentContext(profile, {
      channel: "msedge",
      headless: true,
      offline: true,
      viewport: { width: 1280, height: 900 },
    });
    await running.addInitScript(() => {
      Object.defineProperty(window, "initialRestartSession", {
        value: sessionStorage.getItem("tsdm.workspace.recovery"),
      });
    });
    const second = await running.newPage(),
      state = await open(second);
    await choose(second, "42");
    expect(
      await second.evaluate(
        () =>
          (window as unknown as { initialRestartSession: unknown })
            .initialRestartSession,
      ),
    ).toBeNull();
    await expect(await selectSourceEditor(second)).toHaveValue(
      "[b]Actual process restart writing[/b]\n原文",
    );
    await revealWritingTools(second);
    await expect(
      second.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    await expect(
      second.getByRole("button", { name: "Remove reply target", exact: true }),
    ).toBeVisible();
    await expect(
      second.getByText("restart-intent.txt", { exact: false }).first(),
    ).toBeVisible();
    await expect(
      second.getByText(/File bytes are not retained across refresh/),
    ).toBeVisible();
    await expect(
      second.getByRole("button", {
        name: "Upload restart-intent.txt",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(
      state.requests.filter((request) => request.method !== "GET"),
    ).toEqual([]);
    await info.attach("after-process-restart.png", {
      body: await second.screenshot(),
      contentType: "image/png",
    });
    await info.attach("restart-observation.json", {
      body: JSON.stringify(
        {
          closedFirstProcess: true,
          sameIsolatedProfile: true,
          initialSessionRecord: null,
          source: await (await selectSourceEditor(second)).inputValue(),
          requests: state.requests,
          userAgent: await second.evaluate(() => navigator.userAgent),
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  } finally {
    await running.close();
  }
});

for (const schema of [2, 3, 4] as const) {
  test(`UX107.legacy-projection-${schema}: recover literal writing while excluding nested native authority and byte fields from durable content`, async ({
    page,
    browser,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill(`Legacy ${schema} literal [b]source[/b]`);
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    const raw = await page.evaluate((version) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      record.schema = version;
      delete record.replyCheckpoints;
      delete record.replyDisposals;
      if (version !== 4) delete record.retainedReplies;
      record.writing.formhash = "INJECTED_AUTHORITY_107";
      record.writing.account.cookie = "INJECTED_COOKIE_107";
      record.writing.options[0].token = "INJECTED_NESTED_TOKEN_107";
      record.writing.bytes = [17, 31, 77];
      return JSON.stringify(record);
    }, schema);
    const isolated = await browser.newContext({ offline: true });
    try {
      await isolated.addInitScript(
        (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
        raw,
      );
      const recovered = await isolated.newPage();
      await open(recovered);
      await choose(recovered, "42");
      await test.info().attach("legacy-arrival.png", {
        body: await recovered.screenshot(),
        contentType: "image/png",
      });
      await test.info().attach("legacy-arrival-dom.json", {
        body: JSON.stringify(
          await recovered.locator(".source-writing").evaluate((node) => ({
            display: getComputedStyle(node).display,
            visibility: getComputedStyle(node).visibility,
            viewport: [innerWidth, innerHeight],
            style: node.getAttribute("style"),
          })),
        ),
        contentType: "application/json",
      });
      await recovered
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await expect(recovered.locator(".source-writing")).toBeVisible();
      await expect(await selectSourceEditor(recovered)).toHaveValue(
        `Legacy ${schema} literal [b]source[/b]`,
      );
      await revealWritingDetails(recovered);
      await expect(
        recovered.getByText(
          "Local reply draft saved in this browser profile.",
          { exact: true },
        ),
      ).toBeVisible();
      const durable = await recovered.evaluate(async () => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const rows = await new Promise<unknown>((resolve, reject) => {
          const read = db
            .transaction("threads")
            .objectStore("threads")
            .getAll();
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(read.error);
        });
        db.close();
        return JSON.stringify(rows);
      });
      expect(durable).not.toMatch(/INJECTED_|formhash|"cookie"|"bytes"/);
      expect(durable).toContain(`Legacy ${schema} literal`);
      await test.info().attach(`legacy-${schema}-durable.json`, {
        body: durable,
        contentType: "application/json",
      });
    } finally {
      await isolated.close();
    }
  });
}

test("UX107.queued-branches: native storage contention retains the latest already-entered source from each tab without self-conflict", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared before queued edits");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Shared before queued edits",
  );
  const holder = await context.newPage();
  await holder.goto(`${origin}/__storage-holder`);
  await holder.evaluate(async () => {
    const request = indexedDB.open("tsdm.workspace.reply-drafts", 1),
      db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const tx = db.transaction("threads", "readwrite"),
      store = tx.objectStore("threads");
    let held = true;
    Object.defineProperty(window, "release107Storage", {
      value: () => {
        held = false;
      },
    });
    const keep = () => {
      if (!held) return;
      const read = store.get("42");
      read.onsuccess = keep;
    };
    keep();
    tx.oncomplete = () => db.close();
  });
  const a = await selectSourceEditor(page),
    b = await selectSourceEditor(other);
  await a.fill("A first queued");
  await b.fill("B first queued");
  await a.fill("A latest already-entered source");
  await b.fill("B latest already-entered source");
  await holder.evaluate(() =>
    (window as unknown as { release107Storage(): void }).release107Storage(),
  );
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  const versions = fresh
    .getByRole("region", { name: "Conflicting local reply drafts" })
    .getByRole("textbox");
  await expect(versions).toHaveCount(2);
  expect(
    await versions.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    ),
  ).toEqual(
    expect.arrayContaining([
      "A latest already-entered source",
      "B latest already-entered source",
    ]),
  );
  await holder.close();
});

test("UX107.after-dispatch: a conflict retains the active immutable publication owner and its actual confirmed outcome", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Original immutable sent source");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  await (
    await selectSourceEditor(other)
  ).fill("Competing writing after dispatch");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await page.locator('[data-thread-id="43"] .subject').click();
  await expect(
    page.getByText("Keep current writing?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
  await page.reload();
  const conflict = page.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  for (const summary of await conflict
    .getByText("Complete retained reply details", { exact: true })
    .all())
    await summary.click();
  const versions = await conflict
    .getByRole("textbox", {
      name: "Complete retained reply details",
      exact: true,
    })
    .evaluateAll((fields) =>
      fields.map((field) => (field as HTMLTextAreaElement).value),
    );
  const details =
    versions.find((version) => version.includes('"status": "confirmed"')) ?? "";
  expect(details).toContain('"status": "confirmed"');
  expect(details).toContain("Original immutable sent source");
  expect(details).toContain('"id": "7"');
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
});

test("UX107.independent-conflict: a retained conflict in another thread cannot block this thread's acknowledged deliberate reply", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared before conflict");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await (await selectSourceEditor(page)).fill("First thread version A");
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await (await selectSourceEditor(other)).fill("First thread version B");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await choose(other, "43");
  await other
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(other)
  ).fill("Independent thread deliberate reply");
  await revealWritingDetails(other);
  await expect(
    other.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await other
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await other.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(other.getByText(/Confirmed stored reply/)).toBeVisible();
  const posts = state.requests.filter((request) => request.method === "POST");
  expect(posts).toHaveLength(1);
  expect(new URL(posts[0]!.url).searchParams.get("tid")).toBe("43");
});

// Failure inventory: a clean, already-open observer must not reinterpret a live
// pending owner as a recovered uncertain attempt and manufacture a competing head.
test("UX107.live-owner: live notification preserves the pending owner's exact observation until its confirmed result", async ({
  page,
  context,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Live observed immutable reply");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await selectSourceEditor(other);
  await revealWritingDetails(other);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  await expect(
    other.getByText(
      "Publication is pending. Refresh will retain it as uncertain without replay.",
      { exact: true },
    ),
  ).toBeVisible();
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(other.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toHaveCount(0);
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
});

// Durable authority boundary: legacy validators accept extra URL query fields
// and arbitrary attachnew names. Refuse durable acknowledgement while retaining
// the exact page-session source, rather than storing authority or rewriting it.
for (const unsafe of ["url", "attachment-field", "option-name"] as const) {
  test(`UX107.authority-${unsafe}: unsafe legacy qualified fields stay recoverable without entering durable reply content`, async ({
    page,
    browser,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Literal source: formhash=AUTHOR_TEXT_MUST_SURVIVE");
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    const raw = await page.evaluate((kind) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      record.schema = 4;
      delete record.replyCheckpoints;
      delete record.replyDisposals;
      if (kind === "url")
        record.writing.board.url += "&formhash=INJECTED_AUTHORITY_107";
      else if (kind === "attachment-field")
        record.writing.attachmentFields = [
          {
            name: "attachnew[88][formhash]",
            value: "INJECTED_AUTHORITY_107",
            disabled: false,
          },
        ];
      else {
        record.writing.options[0].name = "formhash";
        record.writing.options[0].value = "INJECTED_AUTHORITY_107";
      }
      return JSON.stringify(record);
    }, unsafe);
    const isolated = await browser.newContext({ offline: true });
    try {
      await isolated.addInitScript(
        (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
        raw,
      );
      const recovered = await isolated.newPage();
      await open(recovered);
      await choose(recovered, "42");
      await recovered
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await expect(await selectSourceEditor(recovered)).toHaveValue(
        "Literal source: formhash=AUTHOR_TEXT_MUST_SURVIVE",
      );
      await revealWritingDetails(recovered);
      await expect(
        recovered.getByText(
          "Local reply draft saved in this browser profile.",
          { exact: true },
        ),
      ).toHaveCount(0);
      const evidence = await recovered.evaluate(async () => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const rows = await new Promise<unknown>((resolve) => {
          const read = db
            .transaction("threads")
            .objectStore("threads")
            .getAll();
          read.onsuccess = () => resolve(read.result);
        });
        db.close();
        return {
          rows,
          session: JSON.parse(
            sessionStorage.getItem("tsdm.workspace.recovery")!,
          ).writing.source,
        };
      });
      expect(evidence.rows).toEqual([]);
      expect(evidence.session).toBe(
        "Literal source: formhash=AUTHOR_TEXT_MUST_SURVIVE",
      );
      await test.info().attach("authority-boundary.json", {
        body: JSON.stringify(evidence),
        contentType: "application/json",
      });
    } finally {
      await isolated.close();
    }
  });
}

// Dual-store failure inventory: incompatible session navigation must remain raw,
// while compatible durable reply writing remains independently recoverable.
test("UX107.independent-recovery: incompatible page-session state cannot hide or reset compatible durable replies", async ({
  page,
  context,
}) => {
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Durable writing independent of corrupt navigation");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const raw = '{"schema":999,"recoverable":"future session data must survive"}';
  await page.addInitScript(
    (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
    raw,
  );
  await page.goto(boardURL);
  await choose(page, "42");
  const returnToWriting = page.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  if (await returnToWriting.isVisible()) await returnToWriting.click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Durable writing independent of corrupt navigation",
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).toBe(raw);
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset incompatible recovery", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard incompatible recovery record",
      exact: true,
    })
    .click();
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "Durable writing independent of corrupt navigation",
  );
  await test.info().attach("independent-stores.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

// History identity cannot be ordered by status: a restart observation and the
// original still-running callback must remain separately inspectable, no replay.
test("UX107.unequal-history: recovered uncertain and actual confirmed observations of one immutable attempt both survive", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Same source distinct attempt observations");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      () =>
        state.requests.filter((request) => request.method === "POST").length,
    )
    .toBe(1);
  const restored = await context.newPage();
  await restored.goto(boardURL);
  await choose(restored, "42");
  await selectSourceEditor(restored);
  await revealWritingDetails(restored);
  await expect(
    restored.getByText(/Pending publication restored as uncertain/),
  ).toBeVisible();
  await expect(
    restored.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await page.reload();
  const conflict = page.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  for (const summary of await conflict
    .getByText("Complete retained reply details", { exact: true })
    .all())
    await summary.click();
  const variants = await conflict
    .getByRole("textbox", {
      name: "Complete retained reply details",
      exact: true,
    })
    .evaluateAll((fields) =>
      fields.map((field) => JSON.parse((field as HTMLTextAreaElement).value)),
    );
  expect(variants.map((variant) => variant.attempts[0].status).sort()).toEqual([
    "confirmed",
    "uncertain",
  ]);
  expect(new Set(variants.map((variant) => variant.attempts[0].id)).size).toBe(
    1,
  );
  expect(
    variants.every(
      (variant) =>
        variant.source === "Same source distinct attempt observations",
    ),
  ).toBe(true);
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(1);
  await test.info().attach("unequal-history.json", {
    body: JSON.stringify(variants),
    contentType: "application/json",
  });
});

test("UX107.stale-disposal: explicit stale replacement preserves unseen competing writing beside a tombstone", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared before stale discard");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await (
    await selectSourceEditor(page)
  ).fill("Unseen competing draft survives stale disposal");
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await other.getByRole("button", { name: "New thread", exact: true }).click();
  await other
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  expect(
    await conflict
      .getByRole("textbox")
      .evaluateAll((fields) =>
        fields.map((field) => (field as HTMLTextAreaElement).value),
      ),
  ).toContain("Unseen competing draft survives stale disposal");
  await other.reload();
  await expect(
    other
      .getByRole("region", { name: "Conflicting local reply drafts" })
      .getByRole("textbox"),
  ).toHaveCount(2);
});

// Workspace enforcement, not merely a disabled DOM control: simulate a stale
// enabled attachment button left on screen while conflict delivery races it.
test("UX107.stale-control: a stale enabled attachment control cannot mutate paused writing", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared attachment writing");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "paused-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("local file intent"),
  });
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const editor = await selectSourceEditor(other);
  await (
    await selectSourceEditor(page)
  ).fill("Competing owner attachment writing");
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await editor.fill("Paused attachment branch");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await revealWritingTools(other);
  const remove = other.getByRole("button", {
    name: "Remove paused-intent.txt",
    exact: true,
  });
  await expect(remove).toBeDisabled();
  await remove.evaluate((button) => {
    (button as HTMLButtonElement).disabled = false;
  });
  await remove.click();
  await expect(remove).toHaveCount(1);
  await expect(editor).toHaveValue("Paused attachment branch");
  await expect(
    other.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  await expect(
    other.getByText(
      "Unavailable attachment intent and its exact references removed locally. No server file was deleted.",
      { exact: true },
    ),
  ).toHaveCount(0);
});

test("UX107.future-database: a future database version is refused without replacing legacy session writing or resetting durable content", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Future database still owns this writing");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open("tsdm.workspace.reply-drafts", 2);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
  });
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Future database still owns this writing",
  );
  await revealWritingDetails(page);
  await expect(
    page.getByText(/Local reply drafts could not be saved/).first(),
  ).toBeVisible();
  const databases = await page.evaluate(() => indexedDB.databases());
  expect(
    databases.find((db) => db.name === "tsdm.workspace.reply-drafts")?.version,
  ).toBe(2);
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
  await test.info().attach("future-database.json", {
    body: JSON.stringify(databases),
    contentType: "application/json",
  });
});

// Non-reply scope: refusal of the ordinary-reply store cannot turn a successful
// page-session acknowledgement for a new-thread composition into a false failure.
test("UX107.nonreply-scope: durable reply-store refusal leaves new-thread page-session recovery truthful", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      if (this.name === "tsdm.workspace.reply-drafts")
        throw new DOMException("Induced reply-only refusal", "SecurityError");
      return original.call(this, names, mode, options);
    };
  });
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "New thread in Music discussion",
      exact: true,
    }),
  ).toBeVisible();
  await (
    await selectSourceEditor(page)
  ).fill("Nonreply writing remains page-session scoped");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Browser recovery is up to date for this page session.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Local reply drafts could not be saved/).first(),
  ).toBeVisible();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Nonreply writing remains page-session scoped",
  );
});

// Async authorization failure inventory: delayed workspace preparation and
// delayed durable readback must not re-enable a review/send after conflict.
for (const phase of ["preparation", "acknowledgement"] as const) {
  test(`UX107.conflict-during-${phase}: delayed continuation cannot authorize a conflicted owner`, async ({
    page,
    context,
  }) => {
    await context.addInitScript(() =>
      Object.defineProperty(window, "BroadcastChannel", {
        value: undefined,
        configurable: true,
      }),
    );
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Shared before delayed continuation");
    await revealWritingDetails(page);
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    const other = await context.newPage();
    await other.goto(boardURL);
    await choose(other, "42");
    await (
      await selectSourceEditor(page)
    ).fill("Captured owner before delayed continuation");
    await expect(
      page.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toBeVisible();
    let release!: () => void;
    if (phase === "preparation") {
      const before = state.requests.length;
      state.gate = {
        thread: "42",
        promise: new Promise<void>((resolve) => {
          release = resolve;
        }),
      };
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await expect
        .poll(
          () =>
            state.requests
              .slice(before)
              .filter(
                (request) =>
                  new URL(request.url).searchParams.get("mod") === "post",
              ).length,
        )
        .toBeGreaterThan(0);
    } else {
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await page.evaluate(() => {
        const original = IDBDatabase.prototype.transaction;
        let held = false;
        IDBDatabase.prototype.transaction = function (names, mode, options) {
          const tx = original.call(this, names, mode, options);
          if (
            !held &&
            this.name === "tsdm.workspace.reply-drafts" &&
            mode === "readonly"
          ) {
            held = true;
            Object.defineProperty(tx, "oncomplete", {
              configurable: true,
              set(
                listener: ((this: IDBTransaction, event: Event) => void) | null,
              ) {
                if (listener)
                  tx.addEventListener("complete", (event) =>
                    Object.defineProperty(window, "release107Ack", {
                      configurable: true,
                      value: () => {
                        IDBDatabase.prototype.transaction = original;
                        listener.call(tx, event);
                      },
                    }),
                  );
              },
            });
          }
          return tx;
        };
      });
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => "release107Ack" in window))
        .toBe(true);
    }
    await (
      await selectSourceEditor(other)
    ).fill("Competing branch during delayed continuation");
    await expect(
      other.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    if (phase === "preparation") {
      state.gate = null;
      release();
    } else
      await page.evaluate(() =>
        (window as unknown as { release107Ack(): void }).release107Ack(),
      );
    await expect(
      page.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review publication", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toHaveCount(0);
    expect(
      state.requests.filter((request) => request.method === "POST"),
    ).toEqual([]);
  });
}

// Ambiguous migration must preserve legacy writing without inventing a baseline
// or treating the durable store's mere existence as a winning chronology.
test("UX107.legacy-divergence: schema4 writing without a known baseline preserves both differing versions", async ({
  page,
  context,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Already acknowledged durable source");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  const legacy = await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.schema = 4;
    delete record.replyCheckpoints;
    delete record.replyDisposals;
    record.writing.source = "Different readable legacy source";
    record.writing.selection = { start: 0, end: 0, direction: "none" };
    return JSON.stringify(record);
  });
  const other = await context.newPage();
  await other.addInitScript(
    (raw) => sessionStorage.setItem("tsdm.workspace.recovery", raw),
    legacy,
  );
  await other.goto(boardURL);
  await choose(other, "42");
  const returnToWriting = other.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  if (await returnToWriting.isVisible()) await returnToWriting.click();
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  expect(
    await conflict
      .getByRole("textbox")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLTextAreaElement).value),
      ),
  ).toEqual(
    expect.arrayContaining([
      "Already acknowledged durable source",
      "Different readable legacy source",
    ]),
  );
  expect(state.requests.filter((request) => request.method !== "GET")).toEqual(
    [],
  );
  await test.info().attach("legacy-divergence.png", {
    body: await other.screenshot(),
    contentType: "image/png",
  });
});
