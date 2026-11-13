import { selectSourceEditor } from "./editor-controls";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const retained = "[b]完整保留 source[/b]\n[attach]77[/attach]";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const states = new WeakMap<Page, ReturnType<typeof fixtureState>>();
function fixtureState() {
  return {
    requests: [] as { url: string; method: string }[],
    member: "7",
    refused: false,
    mismatch: false,
    openingOwned: false,
    postBody: "Original opening body",
    gate: null as {
      action: string;
      post: string | null;
      promise: Promise<void>;
    } | null,
  };
}
async function open(
  page: Page,
  openingOwned = false,
  postBody = "Original opening body",
) {
  const state = fixtureState();
  state.openingOwned = openingOwned;
  state.postBody = postBody;
  states.set(page, state);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__entry.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__entry.js"></script></body></html>`,
      });
    state.requests.push({ url: url.href, method: request.method() });
    if (request.method() !== "GET")
      return route.fulfill({
        status: 500,
        body: "Unexpected consequential request",
      });
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer Seven</a></strong></div>`;
    const board = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
    const action = url.searchParams.get("action"),
      post = url.searchParams.get("reppost");
    if (state.gate && action === state.gate.action && post === state.gate.post)
      await state.gate.promise;
    let body = account + board;
    if (url.searchParams.get("mod") === "post") {
      const edit = action === "edit",
        replyEdit = url.searchParams.get("pid") === "202";
      body += state.refused
        ? '<div id="messagetext">权限不足</div>'
        : `<form id="postform" method="post" action="forum.php?mod=post&action=${action}&fid=5&tid=42${edit ? `&pid=${replyEdit ? "202" : "101"}&editsubmit=yes` : action === "newthread" ? "&topicsubmit=yes" : "&replysubmit=yes"}"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${post ? `<input type="hidden" name="reppid" value="${state.mismatch ? "999" : post}"><input type="hidden" name="reppost" value="${post}"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_8"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">` : ""}${replyEdit ? "" : '<input name="subject" value="Native title">'}<textarea name="message">${edit ? escape(retained) : ""}</textarea>${action === "newthread" || (edit && !replyEdit) ? '<select name="typeid"><option value="0">Choose category</option><option value="3">Listening notes</option></select>' : ""}<label><input name="usesig" type="checkbox" value="1" checked>Signature</label>${edit ? '<input name="attachnew[77][description]" value="Existing attachment">' : ""}<button type="submit" name="${edit ? "editsubmit" : action === "newthread" ? "topicsubmit" : "replysubmit"}" value="yes">Continue</button></form>`;
    } else if (url.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread</a></th></tr></tbody></table>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${state.openingOwned ? "7" : "8"}">${state.openingOwned ? "Writer Seven" : "Other author"}</a><a href="forum.php?mod=viewthread&tid=42&page=2&authorid=8&ordertype=1">只看该作者</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>${escape(state.postBody)}</p><p><a href="https://www.tsdm39.com/forum.php?mod=viewthread&tid=43">Other thread link</a></p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer Seven</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div></div>`;
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(threadURL);
  await expect(
    page.getByRole("heading", { name: "Existing thread", exact: true }),
  ).toBeVisible();
  return state;
}

async function menu(page: Page, id = "101") {
  await page
    .getByRole("button", { name: `Post ${id} actions`, exact: true })
    .click();
  return page.getByRole("menu", { name: `Post ${id} actions`, exact: true });
}
test.afterEach(async ({ page }, info) => {
  await info.attach("requests.json", {
    body: JSON.stringify(states.get(page)?.requests, null, 2),
    contentType: "application/json",
  });
  await info.attach("post-actions.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UX101.menu: pointer and keyboard share truthful menu with native filter context", async ({
  page,
}, info) => {
  const state = await open(page);
  const trigger = page.getByRole("button", {
    name: "Post 101 actions",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const actions = page.getByRole("menu", {
    name: "Post 101 actions",
    exact: true,
  });
  await expect(actions).toBeVisible();
  await info.attach("open-post-menu.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const names = await actions.getByRole("menuitem").allTextContents();
  expect(names.join(" ")).toContain("Reply");
  expect(names.join(" ")).toContain("Show only this author's posts");
  await expect(actions.getByRole("menuitem", { name: /Rate/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(
    actions.getByRole("menuitem", { name: /Report/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.locator("#pid101 .post-author").click({ button: "right" });
  await expect(actions).toBeVisible();
  expect(await actions.getByRole("menuitem").allTextContents()).toEqual(names);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "post",
    ),
  ).toEqual([]);
  await actions.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const editor = await selectSourceEditor(page);
  await editor.fill("Preserve writing through the native author filter");
  await menu(page);
  await actions
    .getByRole("menuitem", {
      name: "Show only this author's posts",
      exact: true,
    })
    .click();
  await expect
    .poll(() =>
      state.requests.some((r) => {
        const u = new URL(r.url);
        return (
          u.searchParams.get("authorid") === "8" &&
          u.searchParams.get("page") === "2" &&
          u.searchParams.get("ordertype") === "1"
        );
      }),
    )
    .toBe(true);
  // The native filter performs a document navigation; the recovered session
  // starts visual, while the complete retained source remains available.
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toHaveText("Preserve writing through the native author filter");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Preserve writing through the native author filter",
  );
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Other author");
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.retarget: same-thread target and removal preserve authored quotes and local attachment selections", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await expect(editor).toBeVisible();
  await editor.fill(
    "My authored text\n[quote=Literal author]Keep this exact literal quote[/quote]",
  );
  const body = await editor.inputValue();
  await page.locator(".writing-details > summary").click();
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "retained.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("selected bytes"),
  });
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const strip = page.getByRole("group", { name: "Reply target", exact: true });
  await expect(strip).toContainText("Writer Seven");
  await expect(strip).toContainText("Owned reply");
  await expect(editor).toHaveValue(body);
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  await strip
    .getByRole("button", { name: "Remove reply target", exact: true })
    .click();
  await expect(strip).toHaveCount(0);
  await expect(editor).toHaveValue(body);
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Reply to thread");
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  expect(
    state.requests.some(
      (r) => new URL(r.url).searchParams.get("reppost") === "202",
    ),
  ).toBe(true);
});

test("UX101.quote: explicit quote appends visible post text without changing reply authority or existing literal quotes", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await editor.fill("Authored\n[quote=Literal]Keep exactly[/quote]");
  const original = await editor.inputValue();
  const strip = page.getByRole("group", { name: "Reply target", exact: true });
  await strip
    .getByRole("button", { name: "Insert quoted post text", exact: true })
    .click();
  const quoted = await editor.inputValue();
  expect(quoted.startsWith(original)).toBe(true);
  expect(quoted.slice(original.length)).toContain("[quote]");
  expect(quoted.slice(original.length)).toContain("Other author");
  expect(quoted.slice(original.length)).toContain("Original opening body");
  await expect(strip).toContainText("Other author");
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect(strip).toContainText("Writer Seven");
  await expect(editor).toHaveValue(quoted);
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.gestures: text double-click selects while empty post space addresses the exact post without publishing", async ({
  page,
}) => {
  const state = await open(page);
  await page
    .getByText("Original opening body", { exact: true })
    .dblclick({ position: { x: 40, y: 8 } });
  expect(await page.evaluate(() => getSelection()?.toString())).not.toBe("");
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "post",
    ),
  ).toEqual([]);
  const body = page.locator("#pid202 .post-content p").first();
  const box = await body.boundingBox();
  expect(box).not.toBeNull();
  await body.dblclick({ position: { x: box!.width - 8, y: box!.height / 2 } });
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Writer Seven");
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toHaveText("");
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("reppost") === "202",
    ),
  ).toHaveLength(1);
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.link: double-click on a source link preserves normal navigation without preparing reply", async ({
  page,
}) => {
  const state = await open(page);
  await page
    .getByRole("link", { name: "Other thread link", exact: true })
    .dblclick();
  await expect
    .poll(() =>
      state.requests.some(
        (r) => new URL(r.url).searchParams.get("tid") === "43",
      ),
    )
    .toBe(true);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "post",
    ),
  ).toEqual([]);
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

function hold(state: ReturnType<typeof fixtureState>, post: string | null) {
  let release!: () => void;
  state.gate = {
    action: "reply",
    post,
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  return release;
}
async function responseThenRelease(
  page: Page,
  post: string,
  release: () => void,
) {
  const response = page.waitForResponse(
    (r) => new URL(r.url()).searchParams.get("reppost") === post,
  );
  release();
  await response;
}
test("UX101.race: newer target and general reply win over held preparation while later typing and attachments survive", async ({
  page,
}) => {
  const state = await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await editor.fill("Before waiting");
  await page.locator(".writing-details > summary").click();
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "waiting.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("local"),
  });
  let release = hold(state, "101");
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect
    .poll(
      () =>
        state.requests.filter(
          (r) => new URL(r.url).searchParams.get("reppost") === "101",
        ).length,
    )
    .toBe(1);
  await editor.fill("Typed during the held preparation [quote]literal[/quote]");
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const strip = page.getByRole("group", { name: "Reply target", exact: true });
  await expect(strip).toContainText("Writer Seven");
  await responseThenRelease(page, "101", release);
  await expect(strip).toContainText("Writer Seven");
  await expect(editor).toHaveValue(
    "Typed during the held preparation [quote]literal[/quote]",
  );
  await expect(page.getByText(/waiting.txt/).first()).toBeVisible();
  release = hold(state, "101");
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect
    .poll(
      () =>
        state.requests.filter(
          (r) => new URL(r.url).searchParams.get("reppost") === "101",
        ).length,
    )
    .toBe(2);
  await strip
    .getByRole("button", { name: "Remove reply target", exact: true })
    .click();
  await expect(strip).toHaveCount(0);
  await responseThenRelease(page, "101", release);
  await expect(strip).toHaveCount(0);
  await expect(editor).toHaveValue(
    "Typed during the held preparation [quote]literal[/quote]",
  );
  await expect(page.getByText(/waiting.txt/).first()).toBeVisible();
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

for (const fault of ["permission", "account", "mismatched-target"] as const) {
  test(`UX101.${fault}: refused retarget retains authored content and prior destination without publication`, async ({
    page,
  }) => {
    const state = await open(page);
    await (
      await menu(page)
    )
      .getByRole("menuitem", { name: "Reply", exact: true })
      .click();
    const editor = await selectSourceEditor(page);
    await editor.fill("Keep my authored writing");
    if (fault === "permission") state.refused = true;
    if (fault === "account") state.member = "9";
    if (fault === "mismatched-target") state.mismatch = true;
    await (
      await menu(page, "202")
    )
      .getByRole("menuitem", { name: "Reply", exact: true })
      .click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /unavailable|changed|match|cannot prepare|权限/ })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Reply target", exact: true }),
    ).toContainText("Other author");
    await expect(editor).toHaveValue("Keep my authored writing");
    expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  });
}

test.describe("touch entry", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("UX101.touch: visible menu fits enlarged narrow view and dismisses without side effects", async ({
    page,
  }, info) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "tsdm.workspace.preferences",
        JSON.stringify({ schema: 1, textSize: 125 }),
      ),
    );
    const state = await open(page);
    const trigger = page.getByRole("button", {
      name: "Post 101 actions",
      exact: true,
    });
    const box = await trigger.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await trigger.tap();
    const actions = page.getByRole("menu", {
      name: "Post 101 actions",
      exact: true,
    });
    await expect(actions).toBeVisible();
    await info.attach("touch-post-menu.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const rect = await actions.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await actions.getByRole("menuitem", { name: "Reply", exact: true }).tap();
    await expect(
      page.getByRole("group", { name: "Reply target", exact: true }),
    ).toContainText("Other author");
    expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  });
});

test("UX101.review-race: retarget immediately revokes review and late review preparation cannot enable controls for a still-pending target", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await editor.fill("Authored source for review");
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await review.click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  let releaseTarget = hold(state, "202");
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
  await responseThenRelease(page, "202", releaseTarget);
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Writer Seven");
  const releaseReview = hold(state, "202");
  const before = state.requests.length;
  await review.click();
  await expect
    .poll(() =>
      state.requests
        .slice(before)
        .some((r) => new URL(r.url).searchParams.get("reppost") === "202"),
    )
    .toBe(true);
  releaseTarget = hold(state, "101");
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect
    .poll(() =>
      state.requests
        .slice(before)
        .some((r) => new URL(r.url).searchParams.get("reppost") === "101"),
    )
    .toBe(true);
  await responseThenRelease(page, "202", releaseReview);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(review).toBeDisabled();
  await responseThenRelease(page, "101", releaseTarget);
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Other author");
  await expect(editor).toHaveValue("Authored source for review");
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.literal-quote: BBCode-looking visible text stays literal and cannot silently become attachment or formatting authority", async ({
  page,
}) => {
  const state = await open(
    page,
    false,
    "Literal [attach]999[/attach] and [b]printed syntax[/b]",
  );
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await editor.fill("Keep the existing body");
  await page
    .getByRole("button", { name: "Insert quoted post text", exact: true })
    .click();
  const quoted = await editor.inputValue();
  expect(quoted.startsWith("Keep the existing body")).toBe(true);
  expect(quoted).toContain(
    "Literal [attach]999[/attach] and [b]printed syntax[/b]",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /resolve.*interpretation|representation|literal/ })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.keyboard: arrow activation prepares reply, outside dismissal and control double-click do not prepare", async ({
  page,
}) => {
  const state = await open(page);
  const trigger = page.getByRole("button", {
    name: "Post 101 actions",
    exact: true,
  });
  await trigger.dblclick();
  await page.keyboard.press("Escape");
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "post",
    ),
  ).toEqual([]);
  await trigger.click();
  await page
    .getByRole("heading", { name: "Existing thread", exact: true })
    .click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Reply", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Other author");
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.editor: retarget preserves source selection, undo and active visual editor mode", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const editor = await selectSourceEditor(page);
  await editor.fill("First authored revision");
  await editor.fill("Second authored revision");
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const selection = await editor.evaluate((el: HTMLTextAreaElement) => [
    el.selectionStart,
    el.selectionEnd,
  ]);
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toContainText("Writer Seven");
  expect(
    await editor.evaluate((el: HTMLTextAreaElement) => [
      el.selectionStart,
      el.selectionEnd,
    ]),
  ).toEqual(selection);
  await editor.focus();
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue("First authored revision");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await (
    await menu(page)
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toContainText("First authored revision");
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});
