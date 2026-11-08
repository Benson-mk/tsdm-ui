import {
  revealWritingDetails,
  revealWritingTools,
  writingDetailAction,
  writingTool,
} from "./editor-controls";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { revealNavigation } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const retained = "[b]完整保留 source[/b]\n[attach]77[/attach]";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
type Entry =
  "new-thread" | "reply" | "addressed" | "edit-opening" | "edit-reply";
const states = new WeakMap<Page, ReturnType<typeof fixtureState>>();
function fixtureState() {
  return {
    requests: [] as { url: string; method: string }[],
    member: "7",
    refused: false,
    openingOwned: false,
    gate: null as {
      action: string;
      post: string | null;
      promise: Promise<void>;
    } | null,
  };
}
async function open(page: Page, openingOwned = false) {
  const state = fixtureState();
  state.openingOwned = openingOwned;
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
        : `<form id="postform" method="post" action="forum.php?mod=post&action=${action}&fid=5&tid=42${edit ? `&pid=${replyEdit ? "202" : "101"}&editsubmit=yes` : action === "newthread" ? "&topicsubmit=yes" : "&replysubmit=yes"}"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN">${post ? '<input type="hidden" name="reppid" value="101"><input type="hidden" name="reppost" value="101"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_8"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">' : ""}${replyEdit ? "" : '<input name="subject" value="Native title">'}<textarea name="message">${edit ? escape(retained) : ""}</textarea>${action === "newthread" || (edit && !replyEdit) ? '<select name="typeid"><option value="0">Choose category</option><option value="3">Listening notes</option></select>' : ""}<label><input name="usesig" type="checkbox" value="1" checked>Signature</label><input name="attachnew[77][description]" value="Existing attachment"><button type="submit" name="${edit ? "editsubmit" : action === "newthread" ? "topicsubmit" : "replysubmit"}">Continue</button></form>`;
    } else if (url.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread</a></th></tr></tbody></table>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${state.openingOwned ? "7" : "8"}">${state.openingOwned ? "Writer Seven" : "Other author"}</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Original opening body</p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer Seven</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div></div>`;
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
async function enter(page: Page, entry: Entry) {
  if (entry === "new-thread") {
    await revealNavigation(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
  } else
    await page
      .getByRole("button", {
        name:
          entry === "reply"
            ? "Reply to thread"
            : entry === "addressed"
              ? "Reply to this post"
              : `Edit post ${entry === "edit-opening" ? "101" : "202"}`,
        exact: true,
      })
      .first()
      .click();
}
async function stored(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
async function capture(page: Page, info: TestInfo) {
  await info.attach("entry-state-requests.json", {
    body: JSON.stringify(
      {
        requests: states.get(page)?.requests,
        writing: await stored(page),
        focus: await page.locator(".source-writing").evaluateAll((nodes) =>
          nodes.map((node) => ({
            text: node.textContent,
            active: (node.getRootNode() as ShadowRoot).activeElement?.outerHTML,
            geometry: [node.clientWidth, node.scrollWidth],
          })),
        ),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await info.attach("entry.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test.afterEach(async ({ page }, info) => {
  if (await page.locator(".source-writing").count()) await capture(page, info);
  else
    await info.attach("requests.json", {
      body: JSON.stringify(states.get(page)),
      contentType: "application/json",
    });
  if (info.status !== info.expectedStatus)
    await info.attach("failure.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});

for (const [
  width,
  height,
  textSize,
  theme,
  language,
  label,
  bodyLabel,
  destination,
  reviewDestination,
] of [
  [
    390,
    844,
    100,
    "light",
    "en",
    "Reply to this post",
    "Complete source",
    "Writing destination",
    "Review destination",
  ],
  [
    390,
    844,
    150,
    "dark",
    "zh-CN",
    "回复这篇帖子",
    "完整源码",
    "写作目标",
    "审阅目标",
  ],
  [
    768,
    900,
    70,
    "mono",
    "zh-TW",
    "回覆這篇帖子",
    "完整原始碼",
    "寫作目標",
    "檢閱目標",
  ],
  [
    1440,
    900,
    150,
    "alias",
    "en",
    "Reply to this post",
    "Complete source",
    "Writing destination",
    "Review destination",
  ],
] as const) {
  test(`UX56.target-${width}-${textSize}-${language}: addressed action explains one target without quote insertion or delivery promise near body and review`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (preferences) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, ...preferences }),
        ),
      { textSize, theme, language },
    );
    const state = await open(page);
    const action = page
      .locator("#pid101")
      .getByRole("button", { name: label, exact: true });
    await action.focus();
    await page.keyboard.press("Enter");
    const editor = page.getByLabel(bodyLabel, { exact: true });
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue("");
    const identity = page.getByRole("group", {
      name: destination,
      exact: true,
    });
    await expect(identity).toContainText("Writer Seven");
    await expect(identity).toContainText("Music discussion");
    await expect(identity).toContainText("42");
    await expect(identity).toContainText("Other author");
    await expect(identity).toContainText("101");
    await revealWritingDetails(page);
    await expect(page.locator(".writing-details")).toContainText(
      language === "en"
        ? "No quoted text is inserted"
        : language === "zh-CN"
          ? "不会自动插入引用文字"
          : "不會自動插入引用文字",
    );
    await expect(page.locator(".writing-details")).toContainText(
      language === "en"
        ? "notification delivery is unverified"
        : language === "zh-CN"
          ? "无法保证通知送达"
          : "無法保證通知送達",
    );
    await revealWritingTools(page);
    const review = page.getByRole("group", {
      name: reviewDestination,
      exact: true,
    });
    await expect(review).toContainText("101");
    await editor.fill(retained);
    const before = await stored(page),
      reads = state.requests.length;
    for (const next of [768, 390, width])
      await page.setViewportSize({ width: next, height });
    await expect(editor).toHaveValue(retained);
    expect(await stored(page)).toEqual(before);
    expect(state.requests).toHaveLength(reads);
    const geometry = await identity.evaluate((node) => ({
      width: node.clientWidth,
      scroll: node.scrollWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
    const writing = await stored(page);
    expect(writing.replyTarget).toEqual({
      threadId: "42",
      postId: "101",
      author: "Other author",
      authorId: "8",
    });
    expect(writing.source).toBe(retained);
    expect(state.requests.every((r) => r.method === "GET")).toBe(true);
    await identity.scrollIntoViewIfNeeded();
    await capture(page, info);
  });
}

for (const entry of [
  "new-thread",
  "reply",
  "addressed",
  "edit-opening",
  "edit-reply",
] as const) {
  test(`UX56.retained-${entry}: nonempty source/options/attachment metadata and source or visual selection survive reading and re-entry`, async ({
    page,
  }) => {
    const state = await open(page, entry === "edit-opening");
    await enter(page, entry);
    const editor = page.getByLabel("Complete source", { exact: true });
    await expect(editor).toBeFocused();
    await editor.fill(retained);
    await revealWritingDetails(page);
    await page.getByLabel("Signature", { exact: true }).uncheck();
    if (entry === "new-thread" || entry === "edit-opening") {
      await page
        .getByLabel("Title", { exact: true })
        .fill("Retained title 音樂");
      await page.getByLabel("Category", { exact: true }).selectOption("3");
    }
    if (entry === "edit-reply")
      await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
    if (entry === "reply" || entry === "edit-reply") {
      await (await writingTool(page, "Visual editor")).click();
      const visual = page.getByRole("textbox", {
        name: "Visual post content",
        exact: true,
      });
      await visual.focus();
      await visual.press("Meta+ArrowUp");
      await visual.press("Meta+ArrowLeft");
      await visual.press("Shift+ArrowRight");
    } else {
      await editor.focus();
      await editor.press("Meta+ArrowUp");
      await editor.press("Meta+ArrowLeft");
      await editor.press("Shift+ArrowRight");
    }
    await expect.poll(async () => (await stored(page)).source).toBe(retained);
    if (entry === "reply" || entry === "edit-reply")
      await expect
        .poll(async () => (await stored(page)).selection)
        .toMatchObject({ start: 3, end: 4 });
    const before = await stored(page),
      reads = state.requests.length;
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await expect(editor).toBeHidden();
    await enter(page, entry);
    const visible =
      entry === "reply" || entry === "edit-reply"
        ? page.getByRole("textbox", {
            name: "Visual post content",
            exact: true,
          })
        : editor;
    await expect(visible).toBeFocused();
    await expect(visible).toBeInViewport();
    expect(await stored(page)).toEqual(before);
    expect(state.requests).toHaveLength(reads);
    expect(before.attachmentFields).toEqual(
      expect.arrayContaining([
        {
          name: "attachnew[77][description]",
          value: "Existing attachment",
          disabled: false,
        },
      ]),
    );
    if (entry === "reply" || entry === "edit-reply")
      expect(
        await visible.evaluate(
          (node) =>
            node.getRootNode() instanceof ShadowRoot &&
            node.ownerDocument.getSelection()?.toString(),
        ),
      ).toBe("完");
    else
      expect(
        await editor.evaluate((node) => [
          (node as HTMLTextAreaElement).selectionStart,
          (node as HTMLTextAreaElement).selectionEnd,
        ]),
      ).toEqual([0, 1]);
    expect(state.requests.every((r) => r.method === "GET")).toBe(true);
  });
}

test("UX56.latest-intent: delayed addressed preparation cannot replace a newer owned edit or steal its focused body", async ({
  page,
}) => {
  const state = await open(page);
  let release!: () => void;
  state.gate = {
    action: "reply",
    post: "101",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  await enter(page, "addressed");
  await expect(
    page.getByText("Preparing current form…", { exact: true }),
  ).toBeVisible();
  await enter(page, "edit-reply");
  const editor = page.getByLabel("Complete source", { exact: true });
  await expect(editor).toBeFocused();
  await editor.fill(retained + " newer edit");
  release();
  await expect.poll(async () => (await stored(page)).action).toBe("edit-post");
  await expect(editor).toHaveValue(retained + " newer edit");
  await expect(editor).toBeFocused();
  expect((await stored(page)).editTarget.postId).toBe("202");
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});

test("UX56.cancel-pending: return to retained writing invalidates delayed replacement without losing context or focus", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(retained);
  await editor.press("Meta+ArrowUp");
  await editor.press("Meta+ArrowLeft");
  await editor.press("Shift+ArrowRight");
  const before = await stored(page);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await enter(page, "addressed");
  let release!: () => void;
  state.gate = {
    action: "reply",
    post: "101",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await expect(editor).toBeFocused();
  release();
  await expect(
    page.getByText("Preparing current form…", { exact: true }),
  ).toHaveCount(0);
  expect(await stored(page)).toEqual(before);
  await expect(editor).toHaveValue(retained);
  await expect(editor).toBeFocused();
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});

test("UX56.revision-refusal: refused replacement preserves retained writing and later revisions", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(retained);
  await revealNavigation(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  state.refused = true;
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Preparing current form…", { exact: true }),
  ).toHaveCount(0);
  await expect(editor).toHaveValue(retained);
  state.refused = false;
  let release!: () => void;
  state.gate = {
    action: "newthread",
    post: null,
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await editor.fill(retained + " later revision");
  release();
  await expect(
    page.getByText(/Writing changed while the new form was loading/),
  ).toBeVisible();
  await expect(editor).toHaveValue(retained + " later revision");
  await expect(editor).toBeFocused();
  expect((await stored(page)).replyTarget.postId).toBeNull();
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});

test("UX56.composition: entry and replacement wait for composition and the latest deferred intent wins", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(retained);
  await editor.dispatchEvent("compositionstart", { data: "音" });
  const reads = state.requests.length;
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await revealNavigation(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByText("Finish the current input composition to change views.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.requests).toHaveLength(reads);
  await expect(editor).toHaveValue(retained);
  await editor.dispatchEvent("compositionend", { data: "音" });
  await expect(
    page.getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(editor).toHaveValue(retained);
  expect(state.requests).toHaveLength(reads);
});

test("UX56.latest-guard: newer entry replaces the old replacement guard before any preparation request", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  await page.getByLabel("Complete source", { exact: true }).fill(retained);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await enter(page, "addressed");
  const reads = state.requests.length;
  await enter(page, "edit-reply");
  await expect(
    page.getByRole("button", {
      name: "Discard local writing and edit post",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(state.requests).toHaveLength(reads);
  await page
    .getByRole("button", { name: "Keep current writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    retained,
  );
  expect((await stored(page)).replyTarget.postId).toBeNull();
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});

test("UX56.explicit-mode-during-check: deliberate visible editor mode focus remains available while a retained form recheck is pending", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  await page.getByLabel("Complete source", { exact: true }).fill(retained);
  let release!: () => void;
  state.gate = {
    action: "reply",
    post: null,
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  await (
    await writingDetailAction(page, "Check current account and form")
  ).click();
  await expect(
    page.getByText("Preparing current form…", { exact: true }),
  ).toBeVisible();
  await (await writingTool(page, "Visual editor")).click();
  await expect(
    page.getByRole("textbox", { name: "Visual post content", exact: true }),
  ).toBeFocused();
  release();
  await expect(
    page.getByText("Preparing current form…", { exact: true }),
  ).toHaveCount(0);
  expect((await stored(page)).source).toBe(retained);
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});
