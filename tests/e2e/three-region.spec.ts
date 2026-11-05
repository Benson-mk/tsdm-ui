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
const ledgers = new WeakMap<Page, string[]>();
async function open(page: Page, url = boardURL) {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__im65.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__im65.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("mod") === "viewthread"
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
test("IM65.desktop: three fixed regions collapse independently and preserve the retained reader", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ledger = await open(page);
  await page
    .locator(".results-pane")
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  const widths = async () =>
    page
      .locator(".workspace-body")
      .evaluate((node) =>
        getComputedStyle(node).gridTemplateColumns.split(" ").map(parseFloat),
      );
  expect(await widths()).toEqual([216, 300, 924]);
  const before = ledger.length;
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  const threads = page.getByRole("button", {
    name: "Threads pane",
    exact: true,
  });
  await boards.click();
  expect(await widths()).toEqual([300, 1140]);
  await threads.click();
  expect(await widths()).toEqual([1440]);
  await boards.click();
  expect(await widths()).toEqual([216, 1224]);
  await threads.click();
  expect(await widths()).toEqual([216, 300, 924]);
  expect(ledger).toHaveLength(before);
  await page.setViewportSize({ width: 960, height: 900 });
  expect(await widths()).toEqual([216, 300, 444]);
  await page.setViewportSize({ width: 1920, height: 900 });
  expect(await widths()).toEqual([216, 300, 1404]);
});
test("IM65.browse: another board and filter retain reading while history restores both contexts", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ledger = await open(page);
  const results = page.locator(".results-pane");
  await results
    .getByRole("link", { name: "Complete listening title 8 音樂", exact: true })
    .scrollIntoViewIfNeeded();
  const offset = await results.evaluate((node) => node.scrollTop);
  expect(offset).toBeGreaterThan(0);
  await results
    .getByRole("link", { name: "Complete listening title 8 音樂", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 50", exact: true }),
  ).toBeVisible();
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => {
    node.scrollTop = 700;
  });
  const readerOffset = await reader.evaluate((node) => node.scrollTop);
  const anchor = await reader.evaluate((node) => {
    const top = node.getBoundingClientRect().top;
    const post = [...node.querySelectorAll("article[id]")].find(
      (item) => item.getBoundingClientRect().bottom > top,
    )!;
    return { id: post.id, top: post.getBoundingClientRect().top };
  });
  await page
    .locator(".boards-navigation")
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 50", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Animation discussion", exact: true })
    .last()
    .click();
  await expect(
    results.getByRole("heading", { name: "Animation discussion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Thread 50", exact: true }),
  ).toBeVisible();
  expect(
    Math.abs(
      (await page.locator(`#${anchor.id}`).boundingBox())!.y - anchor.top,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(results.locator(".thread-row")).toHaveCount(0);
  const before = ledger.length;
  await page.goBack();
  await page.goBack();
  await expect(results.locator(".thread-row")).toHaveCount(30);
  expect(await results.evaluate((node) => node.scrollTop)).toBe(offset);
  await expect(
    results.getByRole("link", {
      name: "Complete listening title 8 音樂",
      exact: true,
    }),
  ).toHaveAttribute("aria-current", "true");
  await page.goForward();
  await page.goForward();
  await expect(
    results.getByRole("heading", { name: "Animation discussion", exact: true }),
  ).toBeVisible();
  expect(ledger).toHaveLength(before);
  await page.reload();
  await expect(
    results.getByRole("heading", { name: "Animation discussion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Thread 50", exact: true }),
  ).toBeVisible();
  const restored = await page.locator(`#${anchor.id}`).evaluate((node) => ({
    top: node.getBoundingClientRect().top,
    scrollTop: node.closest(".reading-pane")!.scrollTop,
  }));
  await info.attach("reload-reading-anchor.json", {
    body: JSON.stringify({ anchor, readerOffset, restored }),
    contentType: "application/json",
  });
  expect(Math.abs(restored.top - anchor.top)).toBeLessThanOrEqual(1);
  expect(ledger).toHaveLength(before);
});
for (const theme of ["light", "alias", "mono", "dark"]) {
  test(`IM65.appearance-${theme}: shared geometry and bounded full prose at enlarged text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(
      (theme) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, theme, language: "en", textSize: 150 }),
        ),
      theme,
    );
    await open(page, threadURL);
    await expect(
      page.getByRole("heading", { name: "Thread 42", exact: true }),
    ).toBeVisible();
    const post = page.locator("#pid100 .post-content");
    const measure = await post.evaluate((node) => ({
      width: node.clientWidth,
      font: parseFloat(getComputedStyle(node).fontSize),
      text: node.textContent,
    }));
    expect(measure.width).toBeLessThanOrEqual(measure.font * 48 + 1);
    expect(measure.text).toContain("Complete rich reading 0 音樂。");
    expect(
      await page
        .locator(".workspace-body")
        .evaluate((node) =>
          getComputedStyle(node).gridTemplateColumns.split(" ").map(parseFloat),
        ),
    ).toEqual([216, 300, 924]);
    if (theme === "mono")
      expect(
        await page
          .locator(".reading-pane")
          .evaluate((node) => getComputedStyle(node).backgroundColor),
      ).toBe("rgb(255, 255, 255)");
  });
}

test("IM65.directory-collapse: hidden list leaves no track and board browsing reveals it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ledger = await open(page, `${origin}/forum.php`);
  const overview = page.getByRole("region", {
    name: "Boards overview",
    exact: true,
  });
  await expect(overview).toBeVisible();
  const before = ledger.length;
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(overview).toBeHidden();
  expect(ledger).toHaveLength(before);
  await page
    .locator(".boards-navigation")
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  await expect(page.locator(".results-pane")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Threads pane", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
});
