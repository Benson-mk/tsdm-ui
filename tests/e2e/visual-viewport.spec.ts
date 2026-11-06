import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const otherURL = `${origin}/forum.php?mod=forumdisplay&fid=6`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const directory = `${account}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table><tr><td><h2><a href="${boardURL}">Music discussion</a></h2><p>Complete board description</p></td><td><h2><a href="${otherURL}">Animation discussion</a></h2></td></tr></table></div>`;
function board(other = false) {
  return `${account}<div id="ct"><h1><a href="${other ? otherURL : boardURL}">${other ? "Animation discussion" : "Music discussion"}</a></h1></div><div id="thread_types"><a href="${boardURL}&filter=typeid&typeid=3">Listening notes</a></div><table id="threadlisttableid">${other ? '<tr><td class="emp">No threads</td></tr>' : ""}${Array.from({ length: other ? 0 : 30 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Complete listening title ${i} 音樂</a></th><td class="by"><cite>Writer Seven</cite></td></tr></tbody>`).join("")}</table>`;
}
function thread(id: string) {
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb"><p>${`Complete rich reading ${i} 音樂。 `.repeat(70)}</p></div></div>`).join("")}</div>`;
}
function privateConversation() {
  return `${account}<div id="ct"><div class="tbmu"><span id="membernum">12</span><a href="home.php?mod=space&uid=9">Listener Nine</a></div><div id="pm_ul">${Array.from({ length: 12 }, (_, i) => `<dl id="pmlist_${101 + i}"><dd class="avt"><a href="home.php?mod=space&uid=9">Avatar</a></dd><dd class="ptm"><a href="home.php?mod=space&uid=9">Listener Nine</a><br>${"Complete private reading. ".repeat(80)}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span></dd></dl>`).join("")}</div><form><input name="topmuid" value="9"></form></div>`;
}
const ledgers = new WeakMap<Page, string[]>();
async function open(page: Page, url = boardURL, head = "") {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__im74.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head>${head}</head><body>Native<script src="${origin}/__im74.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("do") === "pm"
            ? privateConversation()
            : parsed.searchParams.get("mod") === "post"
              ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN">${parsed.searchParams.has("reppost") ? '<input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value="">' : ""}<input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit">Reply</button></form>`
              : parsed.searchParams.get("mod") === "viewthread"
                ? thread(parsed.searchParams.get("tid")!)
                : parsed.searchParams.get("mod") === "forumdisplay"
                  ? board(parsed.searchParams.get("fid") === "6")
                  : directory,
      }),
    });
  });
  await page.goto(url);
  await expect(page.locator(".workspace")).toBeVisible();
  return ledger;
}
test.afterEach(async ({ page }, info) => {
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("geometry.json", {
    body: JSON.stringify(
      await page.locator(".pane").evaluateAll((nodes) =>
        nodes.map((node) => ({
          class: node.className,
          bounds: node.getBoundingClientRect().toJSON(),
          scrollTop: node.scrollTop,
          scrollWidth: node.scrollWidth,
        })),
      ),
    ),
    contentType: "application/json",
  });
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
type SimulatedViewport = { height: number; offsetTop: number; scale: number };
async function simulatedViewport(page: Page) {
  await page.addInitScript(() => {
    const values = { height: innerHeight, offsetTop: 0, scale: 1 };
    const viewport = window.visualViewport!;
    for (const key of ["height", "offsetTop", "scale"] as const)
      Object.defineProperty(viewport, key, {
        configurable: true,
        get: () => values[key],
      });
    Object.assign(window, { __im74Viewport: values });
  });
}
async function changeViewport(
  page: Page,
  values: SimulatedViewport,
  event = "resize",
) {
  await page.evaluate(
    ({ values, event }) => {
      Object.assign(Reflect.get(window, "__im74Viewport"), values);
      window.visualViewport!.dispatchEvent(new Event(event));
    },
    { values, event },
  );
}

test("IM74.viewport-pan: reduced and panned scale-one viewport sizes the real shell, composer and portals without replacing writing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await simulatedViewport(page);
  const ledger = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retained [quote]exact target[/quote]");
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(2, 9, "backward"),
  );
  const identity = await source.elementHandle();
  const reads = ledger.length;
  const geometry = () =>
    page.locator("#tsdm-workspace").evaluate((host) => {
      const shadow = host.shadowRoot!;
      return {
        host: host.getBoundingClientRect().toJSON(),
        shell: shadow
          .querySelector(".workspace")!
          .getBoundingClientRect()
          .toJSON(),
        composer: shadow
          .querySelector(".source-writing")!
          .getBoundingClientRect()
          .toJSON(),
      };
    });
  await changeViewport(page, { height: 480, offsetTop: 100, scale: 1 });
  await expect.poll(async () => (await geometry()).host.height).toBe(480);
  expect((await geometry()).host.y).toBe(100);
  expect((await geometry()).shell.height).toBe(480);
  expect((await geometry()).composer.height).toBeCloseTo(220.8, 1);
  await info.attach("simulated-keyboard-open.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("simulated-keyboard-geometry.json", {
    body: JSON.stringify(await geometry()),
    contentType: "application/json",
  });
  await expect(source).toBeFocused();
  const sourceBox = await source.boundingBox();
  expect(sourceBox!.y).toBeGreaterThanOrEqual(100);
  expect(sourceBox!.y + sourceBox!.height).toBeLessThanOrEqual(580);
  expect(
    await source.evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
      node.selectionDirection,
    ]),
  ).toEqual([2, 9, "backward"]);
  await changeViewport(
    page,
    { height: 480, offsetTop: 140, scale: 1 },
    "scroll",
  );
  await expect.poll(async () => (await geometry()).host.y).toBe(140);
  await openSettings(page);
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(156);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(604);
  await info.attach("simulated-pan-settings.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await changeViewport(page, { height: 440, offsetTop: 140, scale: 1 });
  expect(
    await dialog.evaluate((node) =>
      node.contains((node.getRootNode() as ShadowRoot).activeElement),
    ),
  ).toBe(true);
  await expect(source).not.toBeFocused();
  await changeViewport(page, { height: 480, offsetTop: 140, scale: 1 });
  await closeSettingsToWorkspace(page);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  expect(await drawer.boundingBox()).toMatchObject({ y: 140, height: 480 });
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await changeViewport(page, { height: 900, offsetTop: 0, scale: 1 });
  await expect.poll(async () => (await geometry()).host.height).toBe(900);
  expect(await identity!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Retained [quote]exact target[/quote]");
  expect(ledger).toHaveLength(reads);
  await info.attach("viewport-cycle.json", {
    body: JSON.stringify(await geometry()),
    contentType: "application/json",
  });
});

test("IM74.pinch-orientation: real page scale preserves the layout and genuine orientation resize updates panes and writing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Orientation preserves addressed writing");
  const identity = await source.elementHandle();
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  const measure = () =>
    page.locator(".workspace").evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      scale: visualViewport!.scale,
      visualHeight: visualViewport!.height,
    }));
  await expect.poll(async () => (await measure()).scale).toBe(2);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect((await measure()).height).toBe(900);
  await page.setViewportSize({ width: 812, height: 375 });
  await expect.poll(async () => (await measure()).height).toBe(375);
  expect((await measure()).scale).toBe(2);
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "true",
  );
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-threads-collapsed",
    "false",
  );
  await source.scrollIntoViewIfNeeded();
  await cdp.send("Input.synthesizeScrollGesture", {
    x: 100,
    y: 100,
    yDistance: -1000,
    xDistance: 0,
    gestureSourceType: "touch",
    speed: 1000,
  });
  const action = page.getByRole("button", {
    name: "Return to reading",
    exact: true,
  });
  await action.scrollIntoViewIfNeeded();
  const reachable = await action.evaluate((node) => {
    const box = node.getBoundingClientRect(),
      viewport = visualViewport!;
    return {
      action: box.toJSON(),
      viewport: {
        top: viewport.offsetTop,
        bottom: viewport.offsetTop + viewport.height,
        left: viewport.offsetLeft,
        right: viewport.offsetLeft + viewport.width,
      },
      scale: viewport.scale,
    };
  });
  expect(reachable.scale).toBe(2);
  expect(reachable.action.top).toBeGreaterThanOrEqual(
    reachable.viewport.top - 1,
  );
  expect(reachable.action.bottom).toBeLessThanOrEqual(
    reachable.viewport.bottom + 1,
  );
  expect(reachable.action.left).toBeGreaterThanOrEqual(
    reachable.viewport.left - 1,
  );
  expect(reachable.action.right).toBeLessThanOrEqual(
    reachable.viewport.right + 1,
  );
  await info.attach("real-page-scale.json", {
    body: JSON.stringify({ shell: await measure(), reachable }),
    contentType: "application/json",
  });
  await info.attach("real-magnified-landscape.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  await page.setViewportSize({ width: 1000, height: 900 });
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "true",
  );
  expect(await identity!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Orientation preserves addressed writing");
  await cdp.detach();
});

test("IM74.short-history: short enlarged ordinary writing keeps actual post history usable and all presentation actions reachable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 360 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        theme: "dark",
        textSize: 150,
        language: "zh-TW",
      }),
    ),
  );
  const ledger = await open(page, threadURL);
  await page.getByRole("button", { name: "回覆主題", exact: true }).click();
  const source = page.getByLabel("完整原始碼", { exact: true });
  await source.fill("縮短視窗保留原始碼");
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => {
    const post = node.querySelector(".post-content")!;
    node.scrollTop +=
      post.getBoundingClientRect().top - node.getBoundingClientRect().top;
  });
  await reader.scrollIntoViewIfNeeded();
  const geometry = await reader.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const outer = node.closest(".conversation-region")!.getBoundingClientRect();
    const post = node.querySelector(".post-content")!.getBoundingClientRect();
    const controls = node
      .querySelector(".history-controls")
      ?.getBoundingClientRect();
    return {
      reader: bounds.toJSON(),
      post: post.toJSON(),
      controls: controls?.toJSON(),
      visiblePost: Math.max(
        0,
        Math.min(bounds.bottom, post.bottom, outer.bottom, innerHeight) -
          Math.max(bounds.top, post.top, outer.top, controls?.bottom ?? 0),
      ),
    };
  });
  await info.attach("short-actual-post.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  // Browser scroll positions round fractional CSS pixels at the clipping edge.
  expect(geometry.visiblePost).toBeGreaterThanOrEqual(95);
  for (const name of ["展開寫作", "返回閱讀"]) {
    const action = page.getByRole("button", { name, exact: true });
    await action.scrollIntoViewIfNeeded();
    const box = await action.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(360);
  }
  await source.scrollIntoViewIfNeeded();
  await expect(source).toHaveValue("縮短視窗保留原始碼");
  expect(ledger.every((request) => request.startsWith("GET "))).toBe(true);
});

for (const mode of ["missing", "invalid-scale"] as const) {
  test(`IM74.fallback-${mode}: unusable viewport APIs retain layout sizing and reachable settings`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 600 });
    if (mode === "missing")
      await page.addInitScript(() =>
        Object.defineProperty(window, "visualViewport", {
          value: undefined,
          configurable: true,
        }),
      );
    else {
      await simulatedViewport(page);
      await page.addInitScript(() =>
        Object.assign(Reflect.get(window, "__im74Viewport"), {
          height: 20,
          offsetTop: 10,
          scale: 0,
        }),
      );
    }
    await open(page, threadURL);
    const shell = page.locator(".workspace");
    await expect
      .poll(async () => (await shell.boundingBox())!.height)
      .toBe(600);
    await page.setViewportSize({ width: 812, height: 375 });
    await expect
      .poll(async () => (await shell.boundingBox())!.height)
      .toBe(375);
    await openSettings(page);
    const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await close.scrollIntoViewIfNeeded();
    const box = await close.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(16);
    expect(box!.y + box!.height).toBeLessThanOrEqual(359);
    await close.click();
    await expect(dialog).toBeHidden();
  });
}

test("IM74.continuity: repeated viewport cycles preserve browser composition, undo, quote destination and reader/list anchors", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await simulatedViewport(page);
  const ledger = await open(page);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retained ");
  const identity = await source.elementHandle();
  const reader = page.locator(".reading-pane");
  const results = page.locator(".results-pane");
  await reader.evaluate((node) => {
    node.scrollTop = 300;
  });
  await results.evaluate((node) => {
    node.scrollTop = 120;
  });
  const anchor = await reader
    .locator(".post-content p")
    .first()
    .elementHandle();
  const anchorOffset = () =>
    anchor!.evaluate(
      (node) =>
        node.getBoundingClientRect().top -
        node.closest(".reading-pane")!.getBoundingClientRect().top,
    );
  const before = {
    offset: await anchorOffset(),
    list: await results.evaluate((node) => node.scrollTop),
    requests: ledger.length,
  };
  await source.focus();
  await source.press("Meta+ArrowDown");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", {
    text: "nei ho",
    selectionStart: 6,
    selectionEnd: 6,
  });
  for (const viewport of [
    { height: 480, offsetTop: 100, scale: 1 },
    { height: 480, offsetTop: 140, scale: 1 },
    { height: 900, offsetTop: 0, scale: 1 },
    { height: 420, offsetTop: 60, scale: 1 },
    { height: 900, offsetTop: 0, scale: 1 },
  ]) {
    await changeViewport(page, viewport);
    await expect
      .poll(
        async () => (await page.locator(".workspace").boundingBox())!.height,
      )
      .toBe(viewport.height);
    await expect(source).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeDisabled();
    expect(await anchorOffset()).toBeCloseTo(before.offset, 0);
    expect(await results.evaluate((node) => node.scrollTop)).toBe(before.list);
  }
  await cdp.send("Input.insertText", { text: "你好" });
  await expect(source).toHaveValue("Retained 你好");
  expect(await identity!.evaluate((node) => node.isConnected)).toBe(true);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue("Retained ");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(source).toHaveValue("Retained 你好");
  await expect(
    page.locator(".source-writing").getByRole("link", {
      name: "Addressed to Composer Nine · Post 100",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=100`,
  );
  expect(ledger).toHaveLength(before.requests);
  await info.attach("composition-and-anchors.json", {
    body: JSON.stringify({
      before,
      after: {
        offset: await anchorOffset(),
        list: await results.evaluate((node) => node.scrollTop),
        source: await source.inputValue(),
      },
    }),
    contentType: "application/json",
  });
  await cdp.detach();
});

test("IM74.extremely-short: bounded writer scrolling exposes protected source, validation and presentation controls", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 812, height: 600 });
  await simulatedViewport(page);
  const ledger = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("[alien]Protected exact text[/alien]");
  await changeViewport(page, { height: 240, offsetTop: 30, scale: 1 });
  const writer = page.locator(".source-writing");
  const content = page.locator(".writing-content");
  expect((await content.boundingBox())!.height).toBeGreaterThanOrEqual(64);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  const identity = await visual.elementHandle();
  await page
    .getByText(
      "Some markup is protected in visual mode. Edit its complete source to change it.",
      { exact: true },
    )
    .scrollIntoViewIfNeeded();
  await changeViewport(
    page,
    { height: 260, offsetTop: 45, scale: 1 },
    "scroll",
  );
  expect(await identity!.evaluate((node) => node.isConnected)).toBe(true);
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(source).toHaveValue("[alien]Protected exact text[/alien]");
  await source.fill("");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const blocker = page.getByText("Enter the post body.", { exact: true });
  await expect(blocker).toBeVisible();
  for (const control of [
    blocker,
    writer.getByRole("button", { name: "Return to reading", exact: true }),
  ]) {
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(45);
    expect(box!.y + box!.height).toBeLessThanOrEqual(305);
  }
  expect(ledger.every((request) => request.startsWith("GET "))).toBe(true);
  await info.attach("short-writer.json", {
    body: JSON.stringify({
      writer: await writer.boundingBox(),
      content: await content.boundingBox(),
    }),
    contentType: "application/json",
  });
});
