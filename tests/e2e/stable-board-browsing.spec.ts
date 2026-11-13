import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { clickThreadTool } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const board = `${account}<div id="ct"><h1><a href="${boardURL}">音樂討論</a></h1></div><table id="threadlisttableid">${Array.from({ length: 40 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">音樂筆記 ${i}：完整而很長的繁體中文討論標題與閱讀心得</a></th><td class="by"><cite>很長的繁體中文會員名稱</cite></td></tr></tbody>`).join("")}</table>`;
const thread = (id: string) =>
  `${account}<div id="pt"><a href="${boardURL}">音樂討論</a></div><div id="postlist"><h1 id="thread_subject">閱讀 ${id}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">作者</a></div><a id="postnum101">1</a><div class="pcb"><p>完整內容</p></div></div></div>`;
async function open(page: Page) {
  page.on("pageerror", (error) => console.log("Browser error:", error.message));
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/__stable.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__stable.js"></script></body></html>`,
      });
    requests.push({ url: url.href, method: request.method() });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          url.searchParams.get("mod") === "forumdisplay"
            ? board
            : thread(url.searchParams.get("tid") ?? "42"),
      }),
    });
  });
  await page.goto(boardURL);
  await expect(page.locator(".thread-row")).toHaveCount(40);
  return requests;
}

test("B1.desktop: unopened board retains compact width when a visible thread opens", async ({
  page,
}, info) => {
  const requests = await open(page);
  const list = page.locator("#thread-list-pane");
  try {
    await info.attach("browser-runtime.json", {
      body: JSON.stringify({
        browser: page.context().browser()!.version(),
        userAgent: await page.evaluate(() => navigator.userAgent),
      }),
      contentType: "application/json",
    });
    const before = await list.boundingBox();
    await expect(page.locator(".reader-placeholder")).toBeVisible();
    await info.attach("before.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const link = list.getByRole("link", {
      name: "音樂筆記 0：完整而很長的繁體中文討論標題與閱讀心得",
      exact: true,
    });
    const bounds = await link.boundingBox();
    await expect(link).toHaveAttribute(
      "href",
      `${origin}/forum.php?mod=viewthread&tid=42`,
    );
    await page.mouse.click(bounds!.x + 10, bounds!.y + 10);
    await expect(
      page.getByRole("heading", { name: "閱讀 42", exact: true }),
    ).toBeVisible();
    const after = await list.boundingBox();
    await info.attach("geometry.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    expect(after!.width).toBe(before!.width);
    expect(after!.x).toBe(before!.x);
    expect(before!.width).toBeLessThanOrEqual(400);
    expect(
      await list
        .locator(".thread-row")
        .first()
        .evaluate((node) => getComputedStyle(node).boxShadow),
    ).toBe("none");
  } finally {
    await info.attach("after.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("request-ledger.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

async function anchor(page: Page) {
  return page.locator("#thread-list-pane").evaluate((pane) => {
    const box = pane.getBoundingClientRect();
    const row = [
      ...pane.querySelectorAll<HTMLElement>("[data-thread-id]"),
    ].find((row) => row.getBoundingClientRect().bottom > box.top + 1)!;
    return {
      id: row.dataset.threadId!,
      offset: row.getBoundingClientRect().top - box.top,
      scrollTop: pane.scrollTop,
      width: box.width,
      x: box.x,
    };
  });
}
async function expectAnchor(
  page: Page,
  before: Awaited<ReturnType<typeof anchor>>,
) {
  await expect.poll(async () => (await anchor(page)).id).toBe(before.id);
  await expect
    .poll(async () => Math.abs((await anchor(page)).offset - before.offset))
    .toBeLessThanOrEqual(1);
}
async function chooseVisible(page: Page, keyboard = false) {
  const list = page.locator("#thread-list-pane");
  const target = await list.evaluate((pane) => {
    const box = pane.getBoundingClientRect();
    const link = [...pane.querySelectorAll<HTMLAnchorElement>(".subject")].find(
      (link) => {
        const b = link.getBoundingClientRect();
        return b.top > box.top + 20 && b.bottom < box.bottom - 20;
      },
    )!;
    const b = link.getBoundingClientRect();
    return {
      id: link.closest<HTMLElement>("[data-thread-id]")!.dataset.threadId!,
      x: b.x + 10,
      y: b.y + 10,
    };
  });
  if (keyboard) {
    await page
      .locator(`[data-thread-id="${target.id}"] .subject`)
      .evaluate((node) => (node as HTMLElement).focus({ preventScroll: true }));
    await page.keyboard.press("Enter");
  } else await page.mouse.click(target.x, target.y);
  await expect(
    page.getByRole("heading", { name: `閱讀 ${target.id}`, exact: true }),
  ).toBeVisible();
  return target.id;
}

for (const keyboard of [false, true])
  test(`B1.desktop-${keyboard ? "keyboard" : "pointer"}: visible row survives opening, switching and Back without refetch`, async ({
    page,
  }, info) => {
    const requests = await open(page);
    const list = page.locator("#thread-list-pane");
    const observations = [];
    try {
      await list.evaluate((node) => {
        node.scrollTop = 850;
      });
      const before = await anchor(page);
      observations.push(before);
      const first = await chooseVisible(page, keyboard);
      await expectAnchor(page, before);
      await expect(
        page.locator(`[data-thread-id="${first}"] .subject`),
      ).toHaveAttribute("aria-current", "true");
      await list.evaluate((node) => {
        node.scrollTop += 300;
      });
      const switched = await anchor(page);
      await chooseVisible(page, keyboard);
      await expectAnchor(page, switched);
      await clickThreadTool(page, "Back");
      await expectAnchor(page, switched);
      await clickThreadTool(page, "Back");
      await expect(page.locator(".reader-placeholder")).toBeVisible();
      await expectAnchor(page, before);
      if (keyboard) await expect(list.locator(".subject:focus")).toHaveCount(1);
      observations.push(await anchor(page));
      expect(
        requests.filter(
          (r) => new URL(r.url).searchParams.get("mod") === "forumdisplay",
        ),
      ).toHaveLength(1);
      expect(requests.every((r) => r.method === "GET")).toBe(true);
    } finally {
      await info.attach("geometry.json", {
        body: JSON.stringify(observations),
        contentType: "application/json",
      });
      await info.attach("journey.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("request-ledger.json", {
        body: JSON.stringify(requests),
        contentType: "application/json",
      });
    }
  });

for (const back of [false, true])
  test(`B1.narrow-${back ? "Back" : "Threads"}: hidden list restores the same row after 125% text reflow`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await open(page);
    const list = page.locator("#thread-list-pane");
    const observations = [];
    try {
      await list.evaluate((node) => {
        node.scrollTop = 850;
      });
      const before = await anchor(page);
      observations.push(before);
      await chooseVisible(page);
      await expect(list).toBeHidden();
      // Browser presentation boundary: the production slider has 10% steps.
      // Apply the exact required 125% text reflow while the real list is hidden.
      await list.evaluate((node) => {
        const host = (node.getRootNode() as ShadowRoot).host as HTMLElement;
        host.style.setProperty("--text-scale", "1.25");
      });
      if (back) await clickThreadTool(page, "Back");
      else
        await page
          .getByRole("button", { name: "Threads pane", exact: true })
          .click();
      await expect(list).toBeVisible();
      observations.push(await anchor(page));
      await expectAnchor(page, before);
      expect(
        await list.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      expect((await anchor(page)).scrollTop).not.toBe(before.scrollTop);
      await chooseVisible(page, true);
      await expect(list).toBeHidden();
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
      await expectAnchor(page, before);
      expect(
        requests.filter(
          (r) => new URL(r.url).searchParams.get("mod") === "forumdisplay",
        ),
      ).toHaveLength(1);
    } finally {
      await info.attach("geometry.json", {
        body: JSON.stringify(observations),
        contentType: "application/json",
      });
      await info.attach("narrow.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("request-ledger.json", {
        body: JSON.stringify(requests),
        contentType: "application/json",
      });
    }
  });
