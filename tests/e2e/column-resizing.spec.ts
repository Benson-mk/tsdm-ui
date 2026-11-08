import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const breadcrumb = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
const ledger = new WeakMap<Page, { url: string; method: string }[]>();
async function open(page: Page, destination = threadURL, paged = false) {
  const requests: { url: string; method: string }[] = [];
  ledger.set(page, requests);
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
    requests.push({ url: url.href, method: request.method() });
    if (request.method() !== "GET")
      return route.fulfill({
        status: 500,
        body: "Unexpected consequential request",
      });
    const mod = url.searchParams.get("mod");
    let body = account + breadcrumb;
    if (mod === "post")
      body +=
        '<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>';
    else if (mod === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread with a long wrapping title for column sizing</a></th></tr></tbody></table>`;
    else if (!mod)
      body += `<div class="bm"><div class="bm_h"><h2><a href="forum.php?gid=14">Music</a></h2></div><div id="category_14"><table><tr><td><h2><a href="${boardURL}">Music discussion</a></h2></td></tr></table></div></div>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">Existing thread with a long wrapping title for column sizing</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${101 + i}"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum${101 + i}"><em>${i + 1}</em>#</a><div class="pcb">${Array.from({ length: 8 }, (_, j) => `<p>Post ${i} paragraph ${j}. ${"A complete visible reading line should remain stable while columns resize. ".repeat(5)}</p>`).join("")}</div></div>`).join("")}</div>`;
    if (paged && mod === "viewthread")
      body += `<div class="pg"><a href="forum.php?mod=viewthread&tid=42&page=1">1</a><strong>2</strong><a class="nxt" href="forum.php?mod=viewthread&tid=42&page=3">3</a></div>`;
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(destination);
  if (new URL(destination).searchParams.get("mod") === "viewthread")
    await expect(page.locator(".reading-pane article").first()).toBeVisible();
  else await expect(page.locator(".board-group").first()).toBeVisible();
  return requests;
}
const separator = (page: Page, name: string) =>
  page.getByRole("separator", { name: `Resize ${name}`, exact: true });
async function geometry(page: Page) {
  return page.locator(".workspace-body").evaluate((main) => {
    const root = main.getRootNode() as ShadowRoot;
    const rect = (selector: string) => {
      const node = root.querySelector<HTMLElement>(selector);
      const r = node?.getBoundingClientRect();
      return r
        ? {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            right: r.right,
            bottom: r.bottom,
            scroll: node!.scrollWidth,
          }
        : null;
    };
    return {
      main: rect(".workspace-body"),
      boards: rect("#boards-pane"),
      threads: rect("#thread-list-pane"),
      reader: rect(".reading-pane"),
      writer: rect(".source-writing"),
      edges: [...root.querySelectorAll('[role="separator"]')].map((node) => ({
        name: node.getAttribute("aria-label"),
        now: node.getAttribute("aria-valuenow"),
        min: node.getAttribute("aria-valuemin"),
        max: node.getAttribute("aria-valuemax"),
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
      })),
    };
  });
}
async function capture(page: Page, info: TestInfo) {
  await info.attach("columns.json", {
    body: JSON.stringify(
      { geometry: await geometry(page), requests: ledger.get(page) },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await info.attach("columns.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test.afterEach(async ({ page }, info) => {
  if (await page.locator(".workspace-body").count()) await capture(page, info);
});

test("UI88.keyboard-defaults: visible quiet boundaries expose values and keyboard adjustment with individual and Settings resets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const requests = await open(page);
  const boards = separator(page, "Boards"),
    threads = separator(page, "Threads");
  await expect(boards).toBeVisible();
  await expect(threads).toBeVisible();
  await expect(boards).toHaveAttribute("aria-orientation", "vertical");
  await expect(boards).toHaveAttribute("aria-valuenow", "216");
  await expect(boards).toHaveAttribute("aria-valuemin", "160");
  await expect(boards).toHaveAttribute("aria-valuemax", "360");
  await expect(threads).toHaveAttribute("aria-valuenow", "300");
  await boards.focus();
  await boards.press("ArrowRight");
  await expect(boards).toHaveAttribute("aria-valuenow", "226");
  await expect(boards).toBeFocused();
  await boards.press("Home");
  await expect(boards).toHaveAttribute("aria-valuenow", "216");
  await threads.press("ArrowLeft");
  await expect(threads).toHaveAttribute("aria-valuenow", "290");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const writing = separator(page, "Writing");
  await expect(writing).toHaveAttribute("aria-valuenow", "420");
  await expect(writing).toHaveAttribute("aria-valuemin", "280");
  await writing.press("ArrowLeft");
  await expect(writing).toHaveAttribute("aria-valuenow", "430");
  await writing.press("Home");
  await expect(writing).toHaveAttribute("aria-valuenow", "420");
  const g = await geometry(page);
  expect(
    g.edges.every((e) => e.width === 12 && e.height === g.main!.height),
  ).toBe(true);
  expect(g.reader!.width).toBeGreaterThanOrEqual(320);
  await openSettings(page);
  await page
    .getByRole("button", { name: "Reset column widths", exact: true })
    .click();
  await closeSettingsToWorkspace(page);
  await expect(threads).toHaveAttribute("aria-valuenow", "300");
  expect(requests.every((r) => r.method === "GET")).toBe(true);
});

async function visibleCharacter(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.locator(".reading-pane").evaluateHandle((pane) => {
    const bounds = pane.getBoundingClientRect();
    const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (
        !node.parentElement?.closest(".post-content") ||
        !node.textContent?.trim()
      )
        continue;
      const range = document.createRange();
      for (let offset = 0; offset < node.textContent.length; offset++) {
        if (!node.textContent[offset]?.trim()) continue;
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const r = range.getBoundingClientRect();
        if (r.width > 0 && r.top >= bounds.top && r.bottom <= bounds.bottom)
          return {
            range,
            pane,
            post: node.parentElement.closest("article")!.id,
            text: node.textContent,
            offset,
            top: r.top - bounds.top,
          };
      }
    }
    throw Error("No genuinely visible reading character");
  });
}
async function expectCharacter(
  handle: Awaited<ReturnType<typeof visibleCharacter>>,
) {
  await handle.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const result = await handle.evaluate(
    ({ range, pane, post, text, offset, top }) => {
      const r = range.getBoundingClientRect(),
        b = pane.getBoundingClientRect();
      return {
        post,
        actualPost: range.startContainer.parentElement?.closest("article")?.id,
        text,
        actualText: range.startContainer.textContent,
        offset,
        actualOffset: range.startOffset,
        top,
        after: r.top - b.top,
        visible: r.top >= b.top - 1 && r.bottom <= b.bottom + 1,
        scroll: pane.scrollTop,
      };
    },
  );
  expect(result.visible, JSON.stringify(result)).toBe(true);
  expect(result.actualPost).toBe(result.post);
  expect(result.actualText).toBe(result.text);
  expect(result.actualOffset).toBe(result.offset);
  expect(Math.abs(result.after - result.top)).toBeLessThanOrEqual(1);
  expect(result.scroll).toBeGreaterThan(0);
  return result;
}
async function drag(page: Page, name: string, delta: number, finish = true) {
  const box = await separator(page, name).boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + delta,
    box!.y + box!.height / 2,
    { steps: 8 },
  );
  if (finish) await page.mouse.up();
}
test("UI88.pointer-continuity: every boundary drags with visible character, editor selection and undo retained; Escape and pointer cancellation roll back", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const requests = await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await source.fill("Selected original 中文 source");
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(9, 17),
  );
  await source.dispatchEvent("select");
  const editor = await source.elementHandle();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .locator(".reading-pane")
    .evaluate((node) => (node.scrollTop = 650));
  await expect
    .poll(() => page.locator(".reading-pane").evaluate((n) => n.scrollTop))
    .toBeGreaterThan(0);
  const requestCount = requests.length;
  const observations = [];
  for (const [name, delta, expected] of [
    ["Boards", 60, 276],
    ["Threads", 80, 380],
    ["Writing", -70, 490],
  ] as const) {
    const anchor = await visibleCharacter(page);
    await drag(page, name, delta);
    await expect(separator(page, name)).toHaveAttribute(
      "aria-valuenow",
      String(expected),
    );
    observations.push(await expectCharacter(anchor));
    expect(await editor!.evaluate((n) => n.isConnected)).toBe(true);
    await expect(source).toHaveValue("Selected original 中文 source");
    expect(
      await source.evaluate((n: HTMLTextAreaElement) => [
        n.selectionStart,
        n.selectionEnd,
      ]),
    ).toEqual([9, 17]);
    expect(await page.evaluate(() => getSelection()?.toString())).toBe(
      "original",
    );
  }
  await drag(page, "Threads", -60, false);
  await expect(separator(page, "Threads")).toHaveAttribute(
    "aria-valuenow",
    "320",
  );
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(separator(page, "Threads")).toHaveAttribute(
    "aria-valuenow",
    "380",
  );
  await drag(page, "Boards", -50, false);
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "226",
  );
  await separator(page, "Boards").dispatchEvent("pointercancel", {
    pointerId: 1,
    isPrimary: true,
    pointerType: "mouse",
  });
  await page.mouse.up();
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "276",
  );
  expect(requests.length).toBe(requestCount);
  await source.press("!");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue("Selected original 中文 source");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(source).toHaveValue("Selected ! 中文 source");
  await info.attach("retained-characters.json", {
    body: JSON.stringify(observations, null, 2),
    contentType: "application/json",
  });
});

test("UI88.responsive-bounds: extreme widths protect Reading and restore desired sizes across clamping, hidden panes and minimized writing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await drag(page, "Boards", 1200);
  await drag(page, "Threads", 1200);
  await drag(page, "Writing", -1200);
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "360",
  );
  await expect(separator(page, "Threads")).toHaveAttribute(
    "aria-valuenow",
    "520",
  );
  await expect(separator(page, "Writing")).toHaveAttribute(
    "aria-valuenow",
    "506",
  );
  const observations = [];
  for (const width of [1440, 1280, 960, 768, 767, 390, 1706]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const g = await geometry(page);
    observations.push({ width, ...g });
    expect(g.main!.scroll).toBeLessThanOrEqual(width);
    if (width >= 768) expect(g.reader!.width).toBeGreaterThanOrEqual(320);
    await expect(separator(page, "Boards")).toHaveCount(width >= 960 ? 1 : 0);
    await expect(separator(page, "Threads")).toHaveCount(width >= 768 ? 1 : 0);
    await expect(separator(page, "Writing")).toHaveCount(width >= 1440 ? 1 : 0);
    for (const edge of g.edges) {
      expect(Number(edge.now)).toBeGreaterThanOrEqual(Number(edge.min));
      expect(Number(edge.now)).toBeLessThanOrEqual(Number(edge.max));
    }
  }
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "360",
  );
  await expect(separator(page, "Threads")).toHaveAttribute(
    "aria-valuenow",
    "520",
  );
  await expect(separator(page, "Writing")).toHaveAttribute(
    "aria-valuenow",
    "506",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(separator(page, "Writing")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(separator(page, "Writing")).toHaveAttribute(
    "aria-valuenow",
    "506",
  );
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await expect(separator(page, "Boards")).toHaveCount(0);
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(separator(page, "Threads")).toHaveCount(0);
  const hidden = await geometry(page);
  expect(hidden.reader!.x).toBe(0);
  expect(hidden.writer!.right).toBe(1706);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await drag(page, "Boards", -1500);
  await drag(page, "Threads", -1500);
  await drag(page, "Writing", 1500);
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "160",
  );
  await expect(separator(page, "Threads")).toHaveAttribute(
    "aria-valuenow",
    "220",
  );
  await expect(separator(page, "Writing")).toHaveAttribute(
    "aria-valuenow",
    "280",
  );
  await info.attach("responsive-widths.json", {
    body: JSON.stringify(observations, null, 2),
    contentType: "application/json",
  });
});

test("UI88.reload: manual desired widths reset after a real browser reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await drag(page, "Boards", 70);
  await page.reload();
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "216",
  );
});

test("UI88.browse-only: one available Boards boundary leaves browsing the full remainder", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, `${origin}/forum.php`);
  await expect(separator(page, "Threads")).toHaveCount(0);
  await expect(separator(page, "Writing")).toHaveCount(0);
  await drag(page, "Boards", 100);
  const g = await geometry(page);
  expect(g.boards!.width).toBe(316);
  expect(g.threads!.width).toBe(964);
  expect(g.main!.scroll).toBe(1280);
});

test("UI88.history-edge: responsive and direct reflow retain a visible end-range character without triggering history loads", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const requests = await open(page, `${threadURL}&page=2`, true);
  await page
    .locator(".reading-pane")
    .evaluate(
      (node) => (node.scrollTop = node.scrollHeight - node.clientHeight - 200),
    );
  const anchor = await visibleCharacter(page);
  const count = requests.length;
  await page.setViewportSize({ width: 1706, height: 900 });
  const afterViewport = await expectCharacter(anchor);
  await drag(page, "Boards", -56);
  const afterDrag = await expectCharacter(anchor);
  expect(requests.length).toBe(count);
  await info.attach("history-edge-character.json", {
    body: JSON.stringify({ afterViewport, afterDrag, requests }, null, 2),
    contentType: "application/json",
  });
});

test.describe("coarse-pointer boundaries", () => {
  test.use({ hasTouch: true });
  test("UI88.touch: each 18px boundary accepts native touch drag and cancellation without scrolling the workspace", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1706, height: 700 });
    const requests = await open(page);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(true);
    const client = await page.context().newCDPSession(page);
    const observations = [];
    for (const [name, delta, expected] of [
      ["Boards", 30, 246],
      ["Threads", 30, 330],
      ["Writing", -30, 450],
    ] as const) {
      const box = (await separator(page, name).boundingBox())!;
      expect(box.width).toBe(18);
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x + delta, y: point.y }],
      });
      await expect(separator(page, name)).toHaveAttribute(
        "aria-valuenow",
        String(expected),
      );
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      observations.push(await geometry(page));
      const current = (await separator(page, name).boundingBox())!;
      const next = {
        x: current.x + current.width / 2,
        y: current.y + current.height / 2,
      };
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [next],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: next.x + delta, y: next.y }],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      await expect(separator(page, name)).toHaveAttribute(
        "aria-valuenow",
        String(expected),
      );
    }
    expect(
      await page
        .locator(".workspace-body")
        .evaluate((n) => [n.scrollTop, n.scrollLeft]),
    ).toEqual([0, 0]);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
    await client.detach();
    await info.attach("touch-boundaries.json", {
      body: JSON.stringify(observations, null, 2),
      contentType: "application/json",
    });
  });
});

test("UI88.interrupted: lost capture, responsive unmount and secondary inputs leave predictable widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  await open(page);
  await separator(page, "Boards").dispatchEvent("pointerdown", {
    pointerId: 9,
    isPrimary: false,
    button: 0,
    clientX: 216,
  });
  await separator(page, "Boards").dispatchEvent("pointermove", {
    pointerId: 9,
    isPrimary: false,
    clientX: 300,
  });
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "216",
  );
  const box = (await separator(page, "Boards").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(box.x + 70, box.y + 100);
  await page.mouse.up({ button: "right" });
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "216",
  );
  await drag(page, "Boards", 60, false);
  await separator(page, "Boards").evaluate((n) => n.releasePointerCapture(1));
  await page.mouse.move(400, 450);
  await page.mouse.up();
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "216",
  );
  await drag(page, "Boards", 60, false);
  await page.setViewportSize({ width: 900, height: 900 });
  await expect(separator(page, "Boards")).toHaveCount(0);
  await page.mouse.up();
  await page.setViewportSize({ width: 1706, height: 900 });
  await expect(separator(page, "Boards")).toHaveAttribute(
    "aria-valuenow",
    "216",
  );
  await expect(page.locator(".workspace-body")).not.toHaveAttribute(
    "data-column-resizing",
  );
});

test("UI88.reachability: short views, minimum widths and forced colors preserve nearby controls and visible focus", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await drag(page, "Boards", -1000);
  await drag(page, "Threads", -1000);
  await drag(page, "Writing", 1000);
  const source = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await source.fill("[b]Preserved[/b] source");
  const observations = [];
  for (const mode of ["light", "dark", "forced"] as const) {
    await page.emulateMedia({
      colorScheme: mode === "dark" ? "dark" : "light",
      forcedColors: mode === "forced" ? "active" : "none",
    });
    const boards = separator(page, "Boards");
    await boards.focus();
    await boards.press("ArrowRight");
    expect(
      await boards.evaluate((n) => getComputedStyle(n).outlineStyle),
    ).not.toBe("none");
    await page
      .getByRole("button", { name: "More thread options", exact: true })
      .click();
    await expect(
      page.getByRole("menu", { name: "More thread options", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await openSettings(page);
    await expect(
      page.getByRole("button", { name: "Reset column widths", exact: true }),
    ).toBeVisible();
    await closeSettingsToWorkspace(page);
    await page
      .getByRole("button", { name: "Compact writing", exact: true })
      .click();
    await expect(separator(page, "Writing")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await expect(source).toHaveValue("[b]Preserved[/b] source");
    const g = await geometry(page);
    expect(g.main!.scroll).toBe(1440);
    expect(g.reader!.width).toBeGreaterThanOrEqual(320);
    const hits = await page.locator(".workspace-body").evaluate((main) => {
      const root = main.getRootNode() as ShadowRoot;
      return [
        ...root.querySelectorAll<HTMLElement>(
          'button, input, textarea, [contenteditable="true"]',
        ),
      ]
        .filter((n) => {
          const r = n.getBoundingClientRect();
          return r.width && r.height && r.top >= 0 && r.bottom <= innerHeight;
        })
        .map((n) => {
          const r = n.getBoundingClientRect();
          const target = root.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2,
          );
          return {
            label: n.getAttribute("aria-label") || n.textContent,
            stolen: Boolean(target?.closest(".column-separator")),
          };
        });
    });
    expect(hits.filter((h) => h.stolen)).toEqual([]);
    observations.push({ mode, geometry: g, hits });
  }
  await info.attach("control-reachability.json", {
    body: JSON.stringify(observations, null, 2),
    contentType: "application/json",
  });
});

for (const mode of ["source", "visual"] as const)
  test(`UI88.composition-${mode}: resizing every boundary retains browser composition in the mounted editor and exact converted source`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1706, height: 900 });
    const requests = await open(page);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const source = page.getByRole("textbox", {
      name: "Complete source",
      exact: true,
    });
    await source.fill("Base ");
    if (mode === "visual")
      await page
        .getByRole("button", { name: "Visual editor", exact: true })
        .click();
    const editor =
      mode === "source"
        ? source
        : page.getByRole("textbox", {
            name: "Visual post content",
            exact: true,
          });
    await editor.focus();
    await editor.press("Meta+ArrowDown");
    const node = await editor.elementHandle();
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "nei",
      selectionStart: 3,
      selectionEnd: 3,
    });
    const before = requests.length;
    const observations = [];
    for (const [name, delta] of [
      ["Boards", 30],
      ["Threads", 30],
      ["Writing", -30],
    ] as const) {
      await drag(page, name, delta);
      await expect(editor).toBeFocused();
      expect(await node!.evaluate((n) => n.isConnected)).toBe(true);
      const value =
        mode === "source"
          ? await source.inputValue()
          : await editor.textContent();
      expect(value).toBe("Base nei");
      observations.push({ name, value, geometry: await geometry(page) });
    }
    await client.send("Input.insertText", { text: "你" });
    if (mode === "visual")
      await page
        .getByRole("button", { name: "Source editor", exact: true })
        .click();
    await expect(source).toHaveValue("Base 你");
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("region", {
        name: "Prepared publication review",
        exact: true,
      }),
    ).toHaveCount(0);
    await source.press("Meta+ArrowDown");
    await source.press("!");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(source).toHaveValue("Base 你");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect(source).toHaveValue("Base 你!");
    expect(requests.length).toBe(before);
    await client.detach();
    await info.attach("browser-composition-resize.json", {
      body: JSON.stringify({ mode, observations, requests }, null, 2),
      contentType: "application/json",
    });
  });
