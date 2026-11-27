import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const origin = "https://www.tsdm39.com";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const directory = `${account}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const draftQuery = "mod=space&do=thread&view=me&type=thread&filter=save";

const scenarios = [
  {
    destination: "Saved",
    action: "Load saved threads",
    refresh: "Refresh saved page",
    query: "mod=space&do=favorite&type=thread",
    empty: '<div id="ct"><p class="emp">您还没有添加任何收藏</p></div>',
    emptyText: "No favorites on this page.",
  },
  {
    destination: "Drafts",
    action: "Load forum drafts",
    refresh: "Refresh forum drafts",
    query: draftQuery,
    empty: `<a class="a" href="home.php?${draftQuery}">草稿箱</a><div class="tl"><form id="delform"><p class="emp">还没有相关的帖子</p></form></div>`,
    emptyText: "还没有相关的帖子",
  },
  {
    destination: "Messages",
    action: "Load messages",
    refresh: "Refresh messages",
    query: "mod=space&do=pm",
    empty:
      '<div id="ct"><div class="mn"><div class="bm"><ul class="tb"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li></ul><div class="emp">当前没有相应的短消息</div></div></div></div>',
    emptyText: "当前没有相应的短消息",
  },
  {
    destination: "Notices",
    action: "Load notices",
    refresh: "Refresh notices",
    query: "mod=space&do=notice",
    empty:
      '<div id="ct"><div class="mn"><p class="emp">No notices in this returned category.</p></div><div class="appl"><div class="tbn"><ul><li class="a"><a href="home.php?mod=space&do=notice">All standard notices</a></li></ul></div></div></div>',
    emptyText: "No notices in this returned category.",
  },
];

for (const scenario of scenarios) {
  test(`#123 ${scenario.destination}: passive entry, deliberate pending read, confirmed empty list, and refused refresh`, async ({
    page,
    browser,
  }, info) => {
    const requests: string[] = [];
    const checkpoints: Record<string, number> = {};
    info.annotations.push({
      type: "browser-version",
      description: browser.version(),
    });
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const expectedRequest = `GET /home.php?${scenario.query}`;
    const destinationReads = () =>
      requests.filter((request) => request === expectedRequest).length;
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) return route.abort();
      if (request.isNavigationRequest())
        return route.fulfill({
          contentType: "text/html",
          body: "<html><body>Native forum</body></html>",
        });
      url.searchParams.delete("tsdmapp");
      const operation = `${request.method()} ${url.pathname}${url.search}`;
      requests.push(operation);
      if (operation === "GET /forum.php")
        return route.fulfill({ body: directory, contentType: "text/html" });
      if (operation !== expectedRequest) return route.abort();
      if (destinationReads() === 1) {
        await held;
        return route.fulfill({
          body: JSON.stringify({ uid: 7, document: account + scenario.empty }),
          contentType: "application/json",
        });
      }
      return route.fulfill({
        status: 403,
        body: `${account}<div id="messagetext">权限不足</div>`,
        contentType: "text/html",
      });
    });
    try {
      await page.goto(`${origin}/forum.php`);
      await page.addScriptTag({
        content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
      });
      await expect(page.getByText("Signed in as Reader Seven")).toBeVisible();
      const entry = page
        .getByRole("navigation", { name: "Main destinations", exact: true })
        .getByRole("button", { name: scenario.destination, exact: true });
      await entry.click();
      await expect(
        page.getByText("List not loaded.", { exact: true }),
      ).toBeVisible();
      expect((checkpoints.entry = destinationReads())).toBe(0);
      await expect(
        page.getByText(scenario.emptyText, { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Refresh", exact: true }),
      ).toHaveCount(0);
      const load = page.getByRole("button", {
        name: scenario.action,
        exact: true,
      });
      await load.click();
      await expect(
        page.getByText("Loading list…", { exact: true }),
      ).toBeVisible();
      await expect(load).toBeDisabled();
      await expect(
        page.getByText(scenario.emptyText, { exact: true }),
      ).toHaveCount(0);
      await expect.poll(destinationReads).toBe(1);
      checkpoints.pending = destinationReads();
      release();
      await expect(
        page.getByText(scenario.emptyText, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("List not loaded.", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText("Loading list…", { exact: true }),
      ).toHaveCount(0);
      const refresh = page.getByRole("button", {
        name: scenario.refresh,
        exact: true,
      });
      await expect(refresh).toBeEnabled();
      expect((checkpoints.empty = destinationReads())).toBe(1);
      await refresh.click();
      await expect(
        page.getByText("Could not load list.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("alert").filter({
          hasText: /the current account cannot read these/i,
        }),
      ).not.toHaveCount(0);
      await expect(
        page.getByText("List not loaded.", { exact: true }),
      ).toHaveCount(0);
      expect((checkpoints.refused = destinationReads())).toBe(2);
      await page.goBack();
      await expect(
        page.getByText(scenario.emptyText, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Could not load list.", { exact: true }),
      ).toHaveCount(0);
      expect((checkpoints.return = destinationReads())).toBe(2);
      await page.goForward();
      await expect(
        page.getByText("Could not load list.", { exact: true }),
      ).toBeVisible();
      expect((checkpoints.forward = destinationReads())).toBe(2);
      expect(requests).toEqual([
        "GET /forum.php",
        expectedRequest,
        expectedRequest,
      ]);
    } finally {
      release();
      await info.attach("destination-request-ledger.json", {
        body: JSON.stringify({ checkpoints, requests }),
        contentType: "application/json",
      });
      await info.attach("destination-state.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
  });
}
