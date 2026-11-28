import {
  chooseAttachments,
  revealWritingDetails,
  revealWritingOptions,
  selectSourceEditor,
} from "./editor-controls";
import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const entryURL = `${origin}/__entry.js`;
const imageURL = `${origin}/post-sample.png`;
const replyURL = (post?: string) =>
  `${origin}/forum.php?mod=post&action=reply&fid=5&tid=42&tsdmapp=json${post ? `&reppost=${post}` : ""}`;
const retained = "[b]完整保留 source[/b]\n[attach]77[/attach]";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const states = new WeakMap<Page, ReturnType<typeof fixtureState>>();
type Request = {
  url: string;
  method: string;
  body: string | null;
  navigation: boolean;
};
const get = (url: string, navigation = false): Request => ({
  url,
  method: "GET",
  body: null,
  navigation,
});
function fixtureState() {
  return {
    requests: [] as Request[],
    expected: null as Request[] | null,
    refusedRequests: [] as Request[],
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
  {
    openingOwned = false,
    postBody = "Original opening body",
    strict = false,
    interactiveContent = false,
  } = {},
) {
  const state = fixtureState();
  state.openingOwned = openingOwned;
  state.postBody = postBody;
  if (strict)
    state.expected = [
      get(threadURL, true),
      get(entryURL),
      get(`${threadURL}&tsdmapp=json`),
      ...(interactiveContent ? [get(imageURL)] : []),
    ];
  states.set(page, state);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const actual: Request = {
      url: url.href,
      method: request.method(),
      body: request.postData(),
      navigation: request.isNavigationRequest(),
    };
    if (state.expected) {
      state.requests.push(actual);
      const expected = state.expected[0];
      if (
        !expected ||
        actual.url !== expected.url ||
        actual.method !== expected.method ||
        actual.body !== expected.body ||
        actual.navigation !== expected.navigation
      ) {
        state.refusedRequests.push(actual);
        return route.abort();
      }
      state.expected.shift();
    }
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
    if (interactiveContent && url.href === imageURL)
      return route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/wfoAAAAASUVORK5CYII=",
          "base64",
        ),
      });
    if (!state.expected) state.requests.push(actual);
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
      body += `<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${state.openingOwned ? "7" : "8"}">${state.openingOwned ? "Writer Seven" : "Other author"}</a><a href="forum.php?mod=viewthread&tid=42&page=2&authorid=8&ordertype=1">只看该作者</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>${escape(state.postBody)}</p><p><a href="https://www.tsdm39.com/forum.php?mod=viewthread&tid=43">Other thread link</a></p>${interactiveContent ? `<p><img src="${imageURL}" alt="Post sample image"></p><details><summary>Post disclosure</summary>Revealed detail</details><pre>Copyable sample</pre>` : ""}</div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer Seven</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div></div>`;
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
  const state = states.get(page);
  await info.attach("requests.json", {
    body: JSON.stringify(state?.requests, null, 2),
    contentType: "application/json",
  });
  await info.attach("post-actions.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  if (state?.expected) {
    await info.attach("http-verdict.json", {
      body: JSON.stringify({
        unconsumed: state.expected,
        refused: state.refusedRequests,
      }),
      contentType: "application/json",
    });
    expect(state.expected).toEqual([]);
    expect(state.refusedRequests).toEqual([]);
  }
});

async function observe(target: Locator) {
  return {
    accessibility: await target.ariaSnapshot(),
    ...(await target.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const root = node.getRootNode() as ShadowRoot;
      const hit = root.elementFromPoint(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
      );
      return {
        rect: rect.toJSON(),
        viewport: { width: innerWidth, height: innerHeight },
        reachable: node === hit || node.contains(hit),
        focused: root.activeElement === node,
        focusOutline: getComputedStyle(node).outlineStyle,
        href: node.getAttribute("href"),
      };
    })),
  };
}

for (const entry of ["double-click", "right-click", "keyboard", "touch"]) {
  test.describe(entry, () => {
    test.use({
      hasTouch: entry === "touch",
      viewport:
        entry === "touch"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
    });
    test(`POST130.${entry}: prepare the same exact Post without a permanent Reply control`, async ({
      page,
      browser,
    }, info) => {
      info.annotations.push({
        type: "browser-version",
        description: browser.version(),
      });
      if (entry === "touch")
        await page.addInitScript(() =>
          localStorage.setItem(
            "tsdm.workspace.preferences",
            JSON.stringify({ schema: 1, textSize: 150 }),
          ),
        );
      const state = await open(page, { strict: true });
      const opener = page.getByRole("article", {
        name: "Post 101",
        exact: true,
      });
      const trigger = opener.getByRole("button", {
        name: "Post 101 actions",
        exact: true,
      });
      const actions = page.getByRole("menu", {
        name: "Post 101 actions",
        exact: true,
      });
      const reply = actions.getByRole("menuitem", {
        name: "Reply",
        exact: true,
      });
      const samples: Record<string, unknown> = {};
      await expect
        .soft(
          page.getByRole("article").getByRole("button", { name: /^Reply\b/i }),
          "no permanent Post Reply control, including in the footer",
        )
        .toHaveCount(0, { timeout: 500 });
      await expect(
        page.getByRole("button", { name: "Reply to thread", exact: true }),
      ).toBeVisible();
      const start = state.requests.length;
      const location = page.url();

      if (entry === "double-click") {
        const body = opener.getByText("Original opening body", { exact: true });
        await body.dblclick({ position: { x: 24, y: 8 } });
        const selection = await page.evaluate(() => getSelection()?.toString());
        expect(selection).toBe("Original");
        samples.wordSelection = selection;
        expect(state.requests).toHaveLength(start);
        const rect = (await body.boundingBox())!;
        state.expected!.push(get(replyURL("101")));
        await body.dblclick({
          position: { x: rect.width - 8, y: rect.height / 2 },
        });
      } else {
        if (entry === "right-click") {
          await opener
            .getByText("Other author", { exact: true })
            .click({ button: "right" });
        } else if (entry === "keyboard") {
          await trigger.focus();
          await page.keyboard.press("Enter");
          await expect(actions).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(trigger).toBeFocused();
          samples.escapeReturn = await observe(trigger);
          await page.keyboard.press("ArrowDown");
          await expect(reply).toBeFocused();
        } else {
          await trigger.scrollIntoViewIfNeeded();
          const observed = await observe(trigger);
          expect(observed.reachable).toBe(true);
          expect(observed.rect.width).toBeGreaterThanOrEqual(44);
          expect(observed.rect.height).toBeGreaterThanOrEqual(44);
          samples.touchTrigger = observed;
          await trigger.tap();
        }
        await expect(actions).toBeVisible();
        const menuSample = await observe(actions);
        const replySample = await observe(reply);
        samples.menu = menuSample;
        samples.replyItem = replySample;
        if (entry === "touch") {
          expect(replySample.reachable).toBe(true);
          expect(menuSample.rect.left).toBeGreaterThanOrEqual(0);
          expect(menuSample.rect.right).toBeLessThanOrEqual(390);
          expect(menuSample.rect.top).toBeGreaterThanOrEqual(0);
          expect(menuSample.rect.bottom).toBeLessThanOrEqual(844);
        }
        await info.attach("labelled-post-menu.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
        expect(state.requests).toHaveLength(start);
        state.expected!.push(get(replyURL("101")));
        if (entry === "keyboard") await page.keyboard.press("Enter");
        else if (entry === "touch") await reply.tap();
        else await reply.click();
      }
      const strip = page.getByRole("group", {
        name: "Reply target",
        exact: true,
      });
      const target = strip.getByRole("link", {
        name: "Addressed to Other author · Post 101",
        exact: true,
      });
      await expect(target).toBeVisible();
      await expect(target).toHaveAttribute(
        "href",
        `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=101`,
      );
      await expect(
        strip.getByText("Original opening body", { exact: false }),
      ).toBeVisible();
      await expect(
        strip.getByRole("button", { name: "Insert quoted post text" }),
      ).toBeEnabled();
      await expect(
        strip.getByRole("button", { name: "Remove reply target" }),
      ).toBeVisible();
      const editor = page.getByRole("textbox", {
        name: "Visual post content",
        exact: true,
      });
      await expect(editor).toHaveText("");
      await expect(editor).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Send reply", exact: true }),
      ).toHaveCount(1);
      expect(page.url()).toBe(location);
      expect(state.requests.slice(start)).toEqual([get(replyURL("101"))]);
      samples.target = await observe(target);
      samples.dock = await strip.ariaSnapshot();
      samples.editor = await observe(editor);
      await info.attach("target-and-focus.json", {
        body: JSON.stringify(samples, null, 2),
        contentType: "application/json",
      });
    });
  });
}

test("POST130.native-content: image, selection and interactive content keep their gestures", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const state = await open(page, { strict: true, interactiveContent: true });
  const image = page.getByRole("img", {
    name: "Post sample image",
    exact: true,
  });
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBeGreaterThan(0);
  const start = state.requests.length;
  const menu = page.getByRole("menu", {
    name: "Post 101 actions",
    exact: true,
  });
  await image.dblclick();
  await image.click({ button: "right" });
  await expect.soft(menu).toBeHidden({ timeout: 500 });
  await page.keyboard.press("Escape");
  const text = page.getByText("Original opening body", { exact: true });
  await text.dblclick({ position: { x: 24, y: 8 } });
  await text.click({ button: "right", position: { x: 24, y: 8 } });
  await expect.soft(menu).toBeHidden({ timeout: 500 });
  const selection = await page.evaluate(() => getSelection()?.toString());
  expect(selection).toBe("Original");
  await page.keyboard.press("Escape");
  const disclosure = page.getByText("Post disclosure", { exact: true });
  await disclosure.click();
  await expect(disclosure.locator("..")).toHaveAttribute("open", "");
  await disclosure.click({ button: "right" });
  await expect.soft(menu).toBeHidden({ timeout: 500 });
  await page.keyboard.press("Escape");
  const code = page.getByRole("region", {
    name: "Scrollable code",
    exact: true,
  });
  const box = (await code.boundingBox())!;
  await code.dblclick({ position: { x: box.width - 8, y: box.height / 2 } });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(state.requests.slice(start)).toEqual([]);
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toHaveCount(0);
  await info.attach("native-content.json", {
    body: JSON.stringify({
      selection,
      image: await observe(image),
      disclosure: await observe(disclosure),
      code: await observe(code),
    }),
    contentType: "application/json",
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
  const state = await open(page, { strict: true });
  state.expected!.push(get(replyURL("101")));
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
  await revealWritingDetails(page);
  await chooseAttachments(page, {
    name: "retained.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("selected bytes"),
  });
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  const signature = page.getByRole("checkbox", {
    name: "Signature",
    exact: true,
  });
  await revealWritingOptions(page);
  await signature.uncheck();
  await page.keyboard.press("Escape");
  state.expected!.push(get(replyURL("202")));
  await (
    await menu(page, "202")
  )
    .getByRole("menuitem", { name: "Reply", exact: true })
    .click();
  const strip = page.getByRole("group", { name: "Reply target", exact: true });
  await expect(strip).toContainText("Writer Seven");
  await expect(strip).toContainText("Owned reply");
  await expect(strip.getByRole("link")).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=202`,
  );
  await expect(editor).toHaveValue(body);
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  await revealWritingOptions(page);
  await expect(signature).not.toBeChecked();
  await page.keyboard.press("Escape");
  state.expected!.push(get(replyURL()));
  await strip
    .getByRole("button", { name: "Remove reply target", exact: true })
    .click();
  await expect(strip).toHaveCount(0);
  await expect(editor).toHaveValue(body);
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Reply to thread");
  await expect(page.getByText(/retained.txt/).first()).toBeVisible();
  await revealWritingOptions(page);
  await expect(signature).not.toBeChecked();
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
  await revealWritingDetails(page);
  await chooseAttachments(page, {
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

test("UX101.review-race: retarget cancels Send and late preparation cannot dispatch for a still-pending target", async ({
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
    name: "Send reply",
    exact: true,
  });
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
  ).toBeDisabled();
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
  ).toBeEnabled();
  expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
});

test("UX101.literal-quote: BBCode-looking visible text stays literal and cannot silently become attachment or formatting authority", async ({
  page,
}) => {
  const state = await open(page, {
    postBody: "Literal [attach]999[/attach] and [b]printed syntax[/b]",
  });
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
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /resolve.*interpretation|representation|literal/ })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
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
    .getByRole("button", { name: "Switch to visual editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
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
