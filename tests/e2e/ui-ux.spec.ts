import { openThreadPages } from "./navigation-ui";
import { clickThreadTool } from "./navigation-ui";
import {
  openSettings,
  closeSettingsToWorkspace,
  revealNavigation,
} from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = `${directoryURL}?mod=forumdisplay&fid=5`;
const threadURL = `${directoryURL}?mod=viewthread&tid=42`;
const nextURL = `${threadURL}&page=2&authorid=9`;
const board = (id: number, title: string, description: string) =>
  `<td><h2><a href="forum.php?mod=forumdisplay&fid=${id}">${title}</a></h2><p class="xg2">${description}</p><span class="xg1">25 threads</span></td>`;
const directory = `<div class="bm"><div class="bm_h"><h2>Listening 音樂</h2></div><div id="category_1"><table><tr>${board(5, "Music discussion", "Albums and composers")}${board(6, "New releases", "Upcoming records")}</tr></table></div></div><div class="bm"><div class="bm_h"><h2>Creating</h2></div><div id="category_2"><table><tr>${board(7, "繪畫交流", "Illustration and art")}</tr></table></div></div><div class="pg"><strong>1</strong><a href="forum.php?gid=2">2</a></div>`;
const boardPage = `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Listening notes</a></th></tr></tbody></table>`;
const thread = (page: string, paginated: boolean) =>
  `<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Listening notes</h1>${Array.from({ length: 8 }, (_, i) => `<div id="post_${100 + i}"><div class="authi">Composer Nine</div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb"><p>Page ${page} reading block ${i + 1}. ${"Complete music discussion 音樂閱讀內容。 ".repeat(30)}</p></div></div>`).join("")}</div>${paginated ? `<div class="pg"><strong>${page}</strong><a href="${page === "1" ? nextURL : threadURL}">${page === "1" ? "2" : "1"}</a></div>` : ""}`;

async function open(page: Page, destination = directoryURL, paginated = true) {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__ux.js`)
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native forum<script src="${origin}/__ux.js"></script></body></html>`,
      });
    requests.push(request.url());
    const url = new URL(request.url());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          url.searchParams.get("mod") === "viewthread"
            ? thread(url.searchParams.get("page") ?? "1", paginated)
            : url.searchParams.get("mod") === "forumdisplay"
              ? boardPage
              : directory,
      }),
    });
  });
  await page.goto(destination);
  await expect(page.locator(".workspace")).toBeVisible();
  return requests;
}

test("UX.directory: filter locally, clear accessibly, retain on Back and reset on reload", async ({
  page,
}, info) => {
  const requests = await open(page);
  const input = page.getByRole("searchbox", {
    name: "Filter boards on this page",
  });
  const cards = page.locator(".overview .board-card");
  await expect(cards).toHaveCount(3);
  const before = await page.evaluate(() => ({
    url: location.href,
    history: history.length,
  }));
  for (const [query, count] of [
    ["  MUSIC  ", 1],
    ["composers", 1],
    ["音樂", 2],
    ["繪畫", 1],
    ["missing board", 0],
  ] as const) {
    await input.fill(query);
    await expect(cards).toHaveCount(count);
    await expect(page.locator(".board-filter-status")).toHaveText(
      `Boards shown: ${count} / 3`,
    );
  }
  await expect(
    page.getByText("No boards match. Try another name or clear the filter."),
  ).toBeVisible();
  await expect(page.locator(".board-group")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Directory pages" })
      .getByRole("link", { name: "2" }),
  ).toBeVisible();
  await input.press("Tab");
  await expect(
    page.getByRole("button", { name: "Clear filter" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(cards).toHaveCount(3);
  expect(
    await page.evaluate(() => ({
      url: location.href,
      history: history.length,
    })),
  ).toEqual(before);
  expect(requests).toHaveLength(1);
  await input.fill("composers");
  await cards.getByText("Music discussion", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Music discussion", exact: true }),
  ).toBeVisible();
  await revealNavigation(page);
  await clickThreadTool(page, "Back");
  await expect(input).toHaveValue("composers");
  await expect(cards).toHaveCount(1);
  expect(requests).toHaveLength(2);
  await info.attach("filtered-directory.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.reload();
  await expect(input).toHaveValue("");
  await expect(cards).toHaveCount(3);
});

for (const [language, label, clear] of [
  ["en", "Filter boards on this page", "Clear filter"],
  ["zh-CN", "筛选本页版块", "清除筛选"],
  ["zh-TW", "篩選本頁版塊", "清除篩選"],
] as const) {
  test(`UX.directory-${language}: narrow enlarged controls and distinct cards in all themes`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      (language) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({
            schema: 1,
            language,
            textSize: 150,
            theme: "light",
          }),
        ),
      language,
    );
    const requests = await open(page);
    const input = page.getByRole("searchbox", { name: label });
    await input.fill("音樂");
    await expect(page.locator(".overview .board-card")).toHaveCount(2);
    await expect(page.getByRole("button", { name: clear })).toBeVisible();
    const geometry = await page.locator(".board-filter").evaluate((node) => ({
      width: node.clientWidth,
      scroll: node.scrollWidth,
      input: node.querySelector("input")!.getBoundingClientRect().width,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);
    expect(geometry.input).toBeGreaterThan(100);
    // Preference changes use the actual Settings controls and preserve the query.
    for (const theme of ["light", "alias", "mono", "dark"]) {
      await openSettings(page);
      await page.locator(`input[type=radio][value="${theme}"]`).check();
      await closeSettingsToWorkspace(page);
      await expect(input).toHaveValue("音樂");
      const card = page.locator(".overview .board-card").first();
      await card.focus();
      const style = await card.evaluate((node) => ({
        decoration: getComputedStyle(node).textDecorationLine,
        outline: getComputedStyle(node).outlineStyle,
        title: getComputedStyle(node.querySelector("strong")!)
          .textDecorationLine,
      }));
      expect(style.decoration).toBe("none");
      expect(style.outline).not.toBe("none");
      expect(style.title).toBe("underline");
      await info.attach(`directory-${language}-${theme}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
    expect(requests).toHaveLength(1);
  });
}

test("UX.thread-pages: Page navigation preserves returned URLs and Back context at both reading edges", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page, threadURL);
  const top = await openThreadPages(page);
  await expect(top).toBeVisible();
  const second = top.getByRole("link", { name: "2", exact: true });
  await expect(second).toBeInViewport();
  await expect(second).toHaveAttribute("href", nextURL);
  await expect(
    page
      .locator(".reading-pane")
      .getByRole("navigation", { name: "Pages", exact: true }),
  ).toHaveCount(0);
  await second.click();
  await expect(
    page.getByRole("button", { name: "Page 2", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#pid100")).toContainText(
    "Page 2 reading block 1.",
  );
  expect(requests).toHaveLength(2);
  expect(requests[1]).toContain("authorid=9");
  expect(requests[1]).toContain("page=2");
  await clickThreadTool(page, "Back");
  await expect(
    page.getByRole("button", { name: "Page 1", exact: true }),
  ).toBeVisible();
  await openThreadPages(page);
  await expect(second).toBeInViewport();
  await page.keyboard.press("Escape");
  expect(requests).toHaveLength(2);
  await info.attach("top-thread-pages.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const reading = page.locator(".reading-pane");
  await reading.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const bottom = (await openThreadPages(page)).getByRole("link", {
    name: "2",
    exact: true,
  });
  const offset = await reading.evaluate((node) => node.scrollTop);
  expect(offset).toBeGreaterThan(500);
  await bottom.click();
  await expect(
    page.getByRole("button", { name: "Page 2", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(3);
  await clickThreadTool(page, "Back");
  await expect(
    page.getByRole("button", { name: "Page 1", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => reading.evaluate((node) => node.scrollTop))
    .toBeCloseTo(offset, 0);
  expect(requests).toHaveLength(3);
  await info.attach("restored-reading-position.json", {
    body: JSON.stringify({
      before: offset,
      after: await reading.evaluate((node) => node.scrollTop),
      requests,
    }),
    contentType: "application/json",
  });
});

test("UX.single-page: no redundant top thread pager", async ({ page }) => {
  const requests = await open(page, threadURL, false);
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect((await openThreadPages(page)).getByRole("link")).toHaveCount(0);
  expect(requests).toHaveLength(1);
});
