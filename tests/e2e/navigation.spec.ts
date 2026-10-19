import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
});
const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const filteredURL = `${boardURL}&filter=typeid&typeid=3&orderby=dateline`;
const secondURL = `${filteredURL}&page=2`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const boardLink = (id: number, title: string) =>
  `<td><h2><a href="forum.php?mod=forumdisplay&fid=${id}">${title}</a></h2><p class="xg2">Complete board description ${id}</p><span class="xg1">25 threads</span></td>`;
const directory = `${account}<div class="bm"><div class="bm_h"><h2>Listening and creating</h2></div><div id="category_1"><table class="fl_tb"><tr>${boardLink(5, "Music discussion")}${boardLink(6, "New releases")}</tr></table></div></div>`;
const threadRow = (id: number, title: string, pinned = false) =>
  `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><em>[Discussion]</em><a class="xst" href="forum.php?mod=viewthread&tid=${id}">${title}</a></th><td class="by"><cite><a href="home.php?mod=space&uid=9">Composer Nine</a></cite><em>2026-10-18</em></td><td class="num"><a>28</a><em>100</em></td><td class="by"><cite>Listener Ten</cite><em><a href="forum.php?mod=redirect&goto=lastpost&tid=${id}">Last reply</a></em></td></tr></tbody>`;
function board(page = 1) {
  return `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><div id="subforum_5"><table class="fl_tb"><tr>${boardLink(7, "Live recordings")}</tr></table></div><div id="thread_types"><a href="${filteredURL}">Listening notes</a></div><div id="filter_orderby_menu"><a href="${boardURL}&orderby=dateline">Newest threads</a></div><table id="threadlisttableid">${page === 1 ? threadRow(41, "Board guide", true) : ""}${threadRow(42, `Autumn listening — page ${page}`)}</table><div class="pg"><strong>${page}</strong><a href="${page === 1 ? secondURL : filteredURL}">${page === 1 ? "2" : "1"}</a></div>`;
}
const searchForm = `${account}<form method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="private-token"><input type="hidden" name="searchsubmit" value="yes"><input name="srchtxt" type="text"><input name="srchuname" type="text"></form>`;
const thread = `${account}<div id="pt"><a href="${directoryURL}">Boards</a><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Autumn listening</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum101" href="${threadURL}#pid101">1</a><div class="pcb"><p>Complete autumn opening.</p></div></div></div>`;
async function open(
  page: Page,
  destination = directoryURL,
  supplied?: (url: URL) => string,
  nativeScript = "",
) {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__workspace-fixture.js`) {
      await route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
      return;
    }
    if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native forum<script>${nativeScript}</script><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
      return;
    }
    requests.push(request.url());
    const url = new URL(request.url());
    const body = supplied
      ? supplied(url)
      : url.pathname === "/search.php"
        ? searchForm
        : url.searchParams.get("mod") === "forumdisplay"
          ? board(Number(url.searchParams.get("page") ?? 1))
          : url.searchParams.get("mod") === "viewthread"
            ? thread
            : directory;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.context().setOffline(true);
  await page.goto(destination);
  return requests;
}
test("J2.boards-returned-context: navigate populated groups, subboards, categories, pins and returned pages", async ({
  page,
}, info) => {
  const requests = await open(page);
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Boards navigation" }),
  ).toBeVisible();
  await expect(
    page.getByText("Listening and creating", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Music discussion", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Music discussion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Live recordings", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Pinned", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Composer Nine", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Listening notes", exact: true })
    .click();
  await expect(
    page.getByText("Category: Listening notes", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Board pages" })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn listening — page 2", exact: true }),
  ).toBeVisible();
  expect(
    requests.map((url) => new URL(url).searchParams.get("tsdmapp")),
  ).toEqual(["json", "json", "json", "json"]);
  expect(requests.at(-1)).toContain("typeid=3");
  expect(requests.at(-1)).toContain("page=2");
  await info.attach("boards-populated.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J2.sidebar-short-window: populated board navigation stays vertical and its last choice is keyboard reachable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1297, height: 565 });
  const populatedDirectory = `${account}<div class="bm"><div class="bm_h"><h2>Listening communities</h2></div><div id="category_1"><table class="fl_tb"><tr>${Array.from(
    { length: 36 },
    (_, index) =>
      boardLink(
        100 + index,
        index === 35
          ? "Extended listening and recording discussion"
          : `Listening board ${String(index + 1).padStart(2, "0")}`,
      ),
  ).join("")}</tr></table></div></div>`;
  const requests = await open(page, directoryURL, () => populatedDirectory);
  const navigation = page.getByRole("navigation", {
    name: "Boards navigation",
    exact: true,
  });
  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(37);
  const initial = await navigation.evaluate((element) => {
    const pane = element.getBoundingClientRect();
    return {
      left: pane.left,
      right: pane.right,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      links: [...element.querySelectorAll("a")].map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    };
  });
  info.annotations.push({
    type: "sidebar-initial-geometry",
    description: JSON.stringify(initial),
  });
  await info.attach("short-window-sidebar-initial.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect.soft(initial.scrollWidth).toBeLessThanOrEqual(initial.clientWidth + 1);
  expect.soft(initial.scrollHeight).toBeGreaterThan(initial.clientHeight);
  const leftPositions = initial.links.map((link) => link.left);
  expect
    .soft(Math.max(...leftPositions) - Math.min(...leftPositions))
    .toBeLessThanOrEqual(1);
  expect
    .soft(
      initial.links.every(
        (link, index) =>
          link.left >= initial.left &&
          link.right <= initial.right &&
          (index === 0 || link.top >= initial.links[index - 1]!.bottom),
      ),
    )
    .toBe(true);
  await links.first().focus();
  for (let index = 0; index < 36; index++) await page.keyboard.press("Tab");
  const lastChoice = navigation.getByRole("link", {
    name: "Extended listening and recording discussion",
    exact: true,
  });
  await expect(lastChoice).toBeFocused();
  const focused = await lastChoice.evaluate((element) => {
    const pane = element.closest("nav")!;
    const bounds = pane.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      scrollTop: pane.scrollTop,
      scrollLeft: pane.scrollLeft,
      pane: {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
      },
      link: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      },
      inside:
        rect.left >= bounds.left - 1 &&
        rect.right <= bounds.right + 1 &&
        rect.top >= bounds.top - 1 &&
        rect.bottom <= bounds.bottom + 1,
    };
  });
  info.annotations.push({
    type: "sidebar-keyboard-geometry",
    description: JSON.stringify(focused),
  });
  await info.attach("short-window-sidebar-last-choice.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect.soft(focused.scrollTop).toBeGreaterThan(0);
  expect.soft(focused.scrollLeft).toBe(0);
  expect.soft(focused.inside).toBe(true);
  expect(requests).toHaveLength(1);
});
test("J2.board-picker-current-context: selecting a board shows that board and All boards returns to the overview", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  const requests = await open(page);
  const picker = page.getByRole("combobox", {
    name: "Board navigation",
    exact: true,
  });
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(directoryURL);
  await picker.selectOption({ label: "Music discussion" });
  await expect(
    page.getByRole("heading", { name: "Music discussion", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(boardURL);
  await picker.selectOption({ label: "All boards" });
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(directoryURL);
  await expect(
    page.getByRole("region", { name: "Thread results", exact: true }),
  ).toHaveCount(0);
  expect(requests.map((url) => new URL(url).searchParams.get("fid"))).toEqual([
    null,
    "5",
    null,
  ]);
  await info.attach("picker-returned-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J2.board-picker-history-context: subordinate board and thread choices follow restored context without reads", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  const subboardURL = `${origin}/forum.php?mod=forumdisplay&fid=7`;
  const requests = await open(page, directoryURL, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? thread
          .replaceAll(boardURL, subboardURL)
          .replaceAll("Music discussion", "Live recordings")
      : url.searchParams.get("fid") === "7"
        ? board()
            .replaceAll(boardURL, subboardURL)
            .replaceAll("Music discussion", "Live recordings")
            .replace(/<div id="subforum_5">.*?<\/div>/, "")
        : url.searchParams.get("fid") === "5"
          ? board()
          : directory,
  );
  const picker = page.getByRole("combobox", {
    name: "Board navigation",
    exact: true,
  });
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await picker.selectOption({ label: "Music discussion" });
  await expect(picker).toHaveValue(boardURL);
  await picker.selectOption({ label: "Live recordings" });
  await expect(
    page.getByRole("heading", { name: "Live recordings", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(subboardURL);
  await page
    .getByRole("link", { name: "Autumn listening — page 1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(subboardURL);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(subboardURL);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Live recordings", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(subboardURL);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Music discussion", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(boardURL);
  await page.goForward();
  await expect(picker).toHaveValue(subboardURL);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(subboardURL);
  expect(requests).toHaveLength(4);
  await info.attach("picker-restored-thread.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J2.board-picker-direct-parent: a direct thread shows its observed parent and missing context stays neutral", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  const requests = await open(page, threadURL);
  const picker = page.getByRole("combobox", {
    name: "Board navigation",
    exact: true,
  });
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(boardURL);
  await expect(picker.locator("option:checked")).toHaveText("Music discussion");
  await page.goto(`${directoryURL}#workspace=unavailable-picker-context`);
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue("");
  await expect(picker.locator("option:checked")).toHaveText("Choose a board");
  expect(requests).toHaveLength(1);
  await picker.selectOption({ label: "All boards" });
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await expect(picker).toHaveValue(directoryURL);
  expect(requests).toHaveLength(2);
  await info.attach("picker-explicit-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
const richThread =
  thread
    .replace(
      "<p>Complete autumn opening.</p>",
      `<p>Complete autumn opening. 秋夜完整閱讀 ${"長文與完整內容。".repeat(25)}</p><div class="quote"><blockquote>Quoted listener <a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=202&fromuid=7">Post 202</a><blockquote>Second quote<blockquote>Third quote remains readable.</blockquote></blockquote></blockquote></div><pre><code>${"0123456789".repeat(50)}\nline two</code></pre><table><caption>Detailed track credits</caption><tr>${Array.from({ length: 12 }, (_, i) => `<th>Long column ${i}</th>`).join("")}</tr><tr>${Array.from({ length: 12 }, (_, i) => `<td>Complete credit ${i}</td>`).join("")}</tr></table><div class="spoiler"><input class="spoilerbutton" value="Hidden listening note"><div class="spoilerbody" style="display:none"><p>Keyboard disclosure retains this note.</p></div></div><img src="https://static.example/cover.png" alt="Album cover"><div class="locked">Read permission 20 required for the withheld section.</div><p>Before the player.</p><iframe src="https://evil.example/">Player fallback title</iframe><p>After the player.</p><script>window.richExecuted=true</script>`,
    )
    .replace(
      "</div></div></div>",
      '</div><div class="attach_nopermission">Attachment unavailable to this account.</div></div></div>',
    ) +
  `<div class="pg"><strong>3</strong><a href="${threadURL}&page=4&authorid=9">4</a></div><div id="postlist_filters"><a href="${threadURL}&authorid=9">Only Composer Nine</a></div>`;
test("J2.rich-page-target: full posts, observed parent, returned page and useful inert overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(
    page,
    `${threadURL}&page=3#pid101`,
    () => richThread,
  );
  await expect(page.getByText("Page 3", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Music discussion", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Only Composer Nine", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toHaveAttribute("data-targeted", "true");
  await expect(
    page.getByText("Attachment unavailable to this account.", { exact: true }),
  ).toBeVisible();
  await page.getByText("Hidden listening note", { exact: true }).click();
  await expect(
    page.getByText("Keyboard disclosure retains this note.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Before the player.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("After the player.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Album cover" })).toHaveAttribute(
    "src",
    "https://static.example/cover.png",
  );
  for (const name of ["Scrollable code", "Scrollable table"]) {
    const region = page.getByRole("region", { name, exact: true });
    await expect(region).toHaveAttribute("tabindex", "0");
    expect(
      await region.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
  }
  expect(
    await page
      .locator("#tsdm-workspace")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  expect(await page.evaluate(() => "richExecuted" in window)).toBe(false);
  expect(requests.filter((url) => url.includes("evil.example"))).toHaveLength(
    0,
  );
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toHaveAttribute("data-targeted", "true");
  await expect(
    page.getByText("Before the player.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Scrollable table", exact: true }),
  ).toBeVisible();
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    1,
  );
  await info.attach("rich-narrow.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J2.session-reload: document reload and Back/Forward restore criteria, selection and position without fetching", async ({
  page,
}, info) => {
  const requests = await open(page, secondURL, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? thread
      : board(2).replace(
          threadRow(42, "Autumn listening — page 2"),
          Array.from({ length: 18 }, (_, i) =>
            threadRow(100 + i, `Earlier discussion ${i}`),
          ).join("") + threadRow(42, "Autumn listening — page 2"),
        ),
  );
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  const selected = page.getByRole("link", {
    name: "Autumn listening — page 2",
    exact: true,
  });
  await selected.scrollIntoViewIfNeeded();
  const before = await selected.boundingBox();
  await selected.click();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  const history = await page.evaluate(() => ({
    state: window.history.state,
    url: location.href,
  }));
  expect(Object.keys(history.state)).toEqual(["tsdmEntry"]);
  expect(history.url).toMatch(
    /^https:\/\/www\.tsdm39\.com\/forum\.php#workspace=[a-zA-Z0-9-]+$/,
  );
  expect(JSON.stringify(history)).not.toMatch(
    /Reader|typeid|authorid|fromuid|Autumn/,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  await page.goBack();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Category: Listening notes", { exact: true }),
  ).toBeVisible();
  await expect(selected).toHaveAttribute("aria-current", "true");
  await expect(
    page.getByText("Snapshot from Reader Seven", { exact: true }),
  ).toBeVisible();
  expect(Math.abs((await selected.boundingBox())!.y - before!.y)).toBeLessThan(
    80,
  );
  expect(requests).toHaveLength(2);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Autumn listening", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Restored snapshot — account and content have not been rechecked.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  await info.attach("history-restored.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J2.history-unavailable: reload of a safe entry waits for explicit reload when its snapshot is absent", async ({
  page,
}) => {
  const requests = await open(page, `${directoryURL}#workspace=absent-entry`);
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Reload", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
});
test("J2.exact-target-missing: a requested PID never becomes an arbitrary visible post", async ({
  page,
}) => {
  const requests = await open(
    page,
    `${threadURL}&page=3#pid999`,
    () => richThread,
  );
  await expect(
    page.getByText("Requested post 999 is missing from this page.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('article[data-targeted="true"]')).toHaveCount(0);
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    1,
  );
});
test("J2.session-refusal: actual browser quota refusal requires explicit loss warning before a redirect", async ({
  page,
}) => {
  const quotaScript = `
    let filled = '';
    for (let size = 65536; size >= 1; size = Math.floor(size / 2)) {
      const block = 'x'.repeat(size);
      try {
        while (true) {
          sessionStorage.setItem('native-fixture-capacity', filled + block);
          filled += block;
        }
      } catch (error) { document.body.dataset.quotaRefusal = error.name; }
    }
  `;
  const requests = await open(page, boardURL, undefined, quotaScript);
  await expect(page.locator("body")).toHaveAttribute(
    "data-quota-refusal",
    "QuotaExceededError",
  );
  await expect(page.getByText(/Refresh recovery unavailable/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Music discussion", exact: true }),
  ).toBeVisible();
  await page.route("**/*mod=redirect*", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 302,
      headers: { location: `${threadURL}&page=6#lastpost` },
      body: "",
    });
  });
  await page
    .getByRole("link", {
      name: "Last reply to Autumn listening — page 1",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      "Return recovery could not be saved. Continue only if you accept losing this return snapshot.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Continue without return recovery",
      exact: true,
    }),
  ).toBeVisible();
  expect(page.url()).toMatch(/#workspace=/);
  expect(requests.filter((url) => url.includes("mod=redirect"))).toHaveLength(
    1,
  );
});
test("J2.refresh-stale: failed refresh retains visibly stale content and does not retry automatically", async ({
  page,
}) => {
  const requests = await open(page, secondURL);
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await page.route("**/*tsdmapp=json*", async (route) => {
    requests.push(route.request().url());
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByText("Previous results are stale.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn listening — page 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The forum could not be reached. Retry or continue in the native forum.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
});
for (const scenario of [
  {
    name: "html-plugin-off",
    body: board(),
    heading: "Music discussion",
    status: 200,
  },
  {
    name: "explicit-empty",
    body: `${account}<div id="ct"><h1>Empty board</h1></div><table id="threadlisttableid"><tr><td class="emp">No threads</td></tr></table>`,
    heading: "Empty board",
    status: 200,
  },
  {
    name: "malformed-populated-row",
    body: board().replace(
      'class="xst" href="forum.php?mod=viewthread&tid=42"',
      'class="xst" href="forum.php?mod=viewthread&tid=999"',
    ),
    heading: "Content unavailable",
    status: 200,
  },
  {
    name: "picture-wall-with-subboards",
    body: board().replace(
      /<table id="threadlisttableid">[\s\S]*?<\/table>/,
      '<ul id="waterfall"><li>Unparsed populated picture thread</li></ul>',
    ),
    heading: "Content unavailable",
    status: 200,
  },
  {
    name: "permission",
    body: '<div id="messagetext">阅读权限不足</div>',
    heading: "Permission",
    status: 403,
  },
  {
    name: "login",
    body: '<div id="messagetext">请先登录</div>',
    heading: "Login",
    status: 401,
  },
  {
    name: "missing",
    body: '<div id="messagetext">不存在</div>',
    heading: "Missing",
    status: 404,
  },
  {
    name: "challenge",
    body: '<title>Just a moment</title><form id="challenge-form"></form>',
    heading: "Challenge",
    status: 403,
  },
  {
    name: "limited",
    body: '<div id="messagetext">Slow down</div>',
    heading: "Limited",
    status: 429,
  },
  {
    name: "missing-document",
    body: '{"ok":1}',
    heading: "Content unavailable",
    status: 200,
  },
  {
    name: "unknown-without-data",
    body: '{"ok":0,"error":"unknown","document":"<p>token only</p>"}',
    heading: "Content unavailable",
    status: 200,
  },
]) {
  test(`J2.board-response-${scenario.name}: complete data or named failure without another representation request`, async ({
    page,
  }) => {
    const reads: string[] = [];
    await page.route("**/*", async (route) => {
      if (route.request().isNavigationRequest())
        await route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: "<html><body>Native</body></html>",
        });
      else {
        reads.push(route.request().url());
        await route.fulfill({
          status: scenario.status,
          contentType: scenario.body.startsWith("{")
            ? "application/json"
            : "text/html",
          body: scenario.body,
        });
      }
    });
    await page.goto(boardURL);
    await page.addScriptTag({
      content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
    });
    await expect(
      page.getByRole("heading", { name: scenario.heading, exact: true }),
    ).toBeVisible();
    expect(reads).toHaveLength(1);
    expect(reads[0]).toContain("tsdmapp=json");
  });
}
for (const scenario of [
  {
    name: "guest-login",
    body: '<form id="loginform"><input name="username"></form>',
    message: "Sign in through the native forum, then retry this thread.",
    accountLabel: "Browsing as a guest",
    changed: true,
  },
  {
    name: "different-member-permission",
    body: `${account.replace('uid=7">Reader Seven', 'uid=8">Reader Eight')}<div id="messagetext">当前用户组没有权限</div>`,
    message:
      "The current account does not have permission to read this thread.",
    accountLabel: "Signed in as Reader Eight",
    changed: true,
  },
  {
    name: "same-member-permission",
    body: `${account}<div id="messagetext">当前用户组没有权限</div>`,
    message:
      "The current account does not have permission to read this thread.",
    accountLabel: "Snapshot from Reader Seven",
    changed: false,
  },
]) {
  test(`J11.refresh-account-${scenario.name}: failed refresh retains only compatible visible snapshots`, async ({
    page,
  }, info) => {
    let refreshing = false;
    const requests = await open(page, secondURL, (url) =>
      url.searchParams.get("mod") === "viewthread"
        ? refreshing
          ? scenario.body
          : thread
        : board(2),
    );
    await page
      .getByRole("link", { name: "Autumn listening — page 2", exact: true })
      .click();
    await expect(
      page.getByText("Complete autumn opening.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Snapshot from Reader Seven", { exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(2);
    refreshing = true;
    await page
      .getByRole("button", { name: "Refresh thread", exact: true })
      .click();
    await expect(
      page.getByText(scenario.message, { exact: true }),
    ).toBeVisible();
    await info.attach(`refresh-${scenario.name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await expect
      .soft(page.getByText(scenario.accountLabel, { exact: true }))
      .toBeVisible();
    if (scenario.changed) {
      expect
        .soft(
          await page
            .getByText("Snapshot from Reader Seven", { exact: true })
            .count(),
        )
        .toBe(0);
      expect
        .soft(
          await page
            .getByText("Complete autumn opening.", { exact: true })
            .count(),
        )
        .toBe(0);
      expect
        .soft(
          await page
            .getByRole("link", {
              name: "Autumn listening — page 2",
              exact: true,
            })
            .count(),
        )
        .toBe(0);
      expect
        .soft(
          await page
            .getByText(
              "Restored snapshot — account and content have not been rechecked.",
              { exact: true },
            )
            .count(),
        )
        .toBe(0);
    } else {
      await expect(
        page.getByText("Complete autumn opening.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Restored snapshot — account and content have not been rechecked.",
          { exact: true },
        ),
      ).toBeVisible();
    }
    expect(requests).toHaveLength(3);
    await page.goBack();
    if (scenario.changed) {
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "Autumn listening — page 2",
          exact: true,
        }),
      ).toHaveCount(0);
    } else {
      await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
    }
    await page.reload();
    if (scenario.changed) {
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
    }
    await page.goForward();
    if (scenario.changed) {
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Complete autumn opening.", { exact: true }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByText("Complete autumn opening.", { exact: true }),
      ).toBeVisible();
    }
    expect(requests).toHaveLength(3);
  });
}
test("J11.session-account-change: a fresh account observation invalidates the restored prior account snapshot", async ({
  page,
}) => {
  const requests = await open(page, secondURL, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? thread.replace('uid=7">Reader Seven', 'uid=8">Reader Eight')
      : board(2),
  );
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Snapshot from Reader Seven", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Autumn listening — page 2", exact: true })
    .click();
  await expect(
    page.getByText("Signed in as Reader Eight", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn listening — page 2", exact: true }),
  ).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn listening — page 2", exact: true }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(2);
});
test("J2.workspace-panes: desktop keeps board results beside reading and narrow Back drills to results", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await open(page, boardURL);
  await page
    .getByRole("link", { name: "Autumn listening — page 1", exact: true })
    .click();
  const results = page.getByRole("region", {
    name: "Thread results",
    exact: true,
  });
  const reading = page.getByRole("region", {
    name: "Thread reading",
    exact: true,
  });
  await expect(results).toBeVisible();
  await expect(reading).toBeVisible();
  expect((await results.boundingBox())!.x).toBeLessThan(
    (await reading.boundingBox())!.x,
  );
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(
    page.getByRole("combobox", { name: "Board navigation", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(reading).toBeVisible();
  await expect(results).not.toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(results).toBeVisible();
  await expect(reading).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn listening — page 1", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    page.getByRole("link", { name: "All boards", exact: true }).first(),
  ).toBeVisible();
  await info.attach("narrow-board-results.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
const lastPage = `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Canonical last page</h1><div id="post_7002"><a id="postnum7002">51</a><div class="pcb"><p>Earlier post on the final page.</p></div></div><div id="post_105"><a id="postnum105">56</a><div class="pcb"><p>The canonical latest reply has PID 105, not floor 56.</p></div></div></div><div class="pg"><strong>6</strong><a href="${threadURL}&page=5">5</a></div>`;
test("J2.canonical-lastpost: final returned page and ascending floors identify exact PID independently", async ({
  page,
}) => {
  await open(page, `${threadURL}&page=6#lastpost`, () => lastPage);
  await expect(page.getByText("Page 6", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Post 105", exact: true }),
  ).toHaveAttribute("data-targeted", "true");
  await expect(
    page.getByRole("article", { name: "Post 7002", exact: true }),
  ).toHaveAttribute("data-targeted", "false");
  await expect(
    page.getByRole("link", { name: "Continue in native forum", exact: true }),
  ).toHaveAttribute("href", `${threadURL}&page=6&tsdm-native=1#pid105`);
});
test("J2.canonical-lastpost-reversed: returned descending first page does not choose its last displayed post", async ({
  page,
}) => {
  const descending = lastPage
    .replace(
      /<div id="post_7002">([\s\S]*?)<\/div><\/div><div id="post_105">([\s\S]*?)<\/div><\/div>/,
      '<div id="post_105">$2</div></div><div id="post_7002">$1</div></div>',
    )
    .replace("<strong>6</strong>", "<strong>1</strong>")
    .replace("page=5", "page=2&ordertype=1");
  await open(
    page,
    `${threadURL}&page=1&ordertype=1#lastpost`,
    () => descending,
  );
  await expect(
    page.getByRole("article", { name: "Post 105", exact: true }),
  ).toHaveAttribute("data-targeted", "true");
  await expect(
    page.getByRole("article", { name: "Post 7002", exact: true }),
  ).toHaveAttribute("data-targeted", "false");
});
test("J2.nonfinal-lastpost: a nonfinal page follows one canonical redirect instead of choosing a visible post", async ({
  browser,
}) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${threadURL}&page=6#lastpost`,
      document: (url) =>
        url.searchParams.get("page") === "3"
          ? lastPage.replace("<strong>6</strong>", "<strong>3</strong>")
          : lastPage,
    },
    async (page, requests, redirects) => {
      await page.goto(`${threadURL}&page=3#lastpost`);
      await expect(
        page.getByRole("article", { name: "Post 105", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      await expect(page.getByText("Page 6", { exact: true })).toBeVisible();
      expect(redirects).toEqual(["document"]);
      expect(requests).toHaveLength(2);
    },
  );
});
test("J2.returned-touch-template: content selects directory, board and thread adapters independently of viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  const bodies = {
    directory: `${account}<div class="forumlist"><h2>Touch group</h2><div class="sub-forum"><a class="murl" href="${boardURL}&mobile=2"><span class="mtit">Music discussion</span><span class="mtxt">Touch board description</span></a></div></div>`,
    board: `${account}<div class="header"><h2>Music discussion</h2></div><ul class="threadlist_box"><li class="list_top"><div class="threadlist_tit"><a href="${threadURL}&mobile=2">Touch thread</a></div><span class="muser">Composer Nine</span><span class="mtime">2026-10-18</span><div class="threadlist_foot"><span class="mreply">4</span></div></li></ul>`,
    thread: `${account}<div id="pt"><a href="${boardURL}&mobile=2">Music discussion</a></div><div class="viewthread"><h1 class="view_tit">Touch thread</h1><div class="plc" id="pid321"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a><span class="mtit"><span class="y">7</span></span><span class="mtime">2026-10-18</span></div><div class="message"><p>Complete touch-template post.</p></div></div></div><div class="page"><a href="${threadURL}&mobile=2&page=2">2</a></div>`,
  };
  await open(page, `${directoryURL}?mobile=2`, (url) =>
    url.searchParams.get("mod") === "forumdisplay"
      ? bodies.board
      : url.searchParams.get("mod") === "viewthread"
        ? bodies.thread
        : bodies.directory,
  );
  await page
    .getByRole("link", { name: "Music discussion", exact: true })
    .first()
    .click();
  await expect(page.getByText("Pinned", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Touch thread", exact: true }).click();
  await expect(
    page.getByRole("article", { name: "Post 321", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Complete touch-template post.", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Pages", exact: true })
      .getByRole("link", { name: "2", exact: true }),
  ).toHaveAttribute("href", `${threadURL}&mobile=2&page=2`);
});
test("J2.directory-pages: returned group pages remain navigable and are not replaced by invented counts", async ({
  page,
}) => {
  const requests = await open(page, directoryURL, (url) =>
    url.searchParams.get("gid") === "2"
      ? directory.replace("Listening and creating", "Second returned group")
      : directory +
        `<div class="pg"><strong>1</strong><a href="${directoryURL}?gid=2">2</a></div>`,
  );
  await page
    .getByRole("navigation", { name: "Directory pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByText("Second returned group", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toContain("gid=2");
});

for (const scenario of [
  { name: "malformed-json", change: "stored = '{'" },
  { name: "incompatible-schema", change: "record.schema = 999" },
  { name: "incomplete-posts", change: "entry.result.thread.posts = null" },
  {
    name: "unsafe-destination",
    change:
      "entry.destination = 'https://www.tsdm39.com/forum.php?mod=post&action=newthread'",
  },
  {
    name: "hostile-pending",
    change:
      "record.pending = {entryKey: entry.key, destination: 'https://effects.example/automatic'}",
  },
  {
    name: "active-content",
    change:
      "entry.result.thread.posts[0].content = [{kind:'element',tag:'iframe',attributes:{src:'https://effects.example/automatic'},children:[]}]",
  },
  {
    name: "active-attribute",
    change:
      "entry.result.thread.posts[0].content = [{kind:'element',tag:'p',attributes:{innerHTML:'<img src=https://effects.example/automatic>'},children:[]}]",
  },
]) {
  test(`J2.session-invalid-${scenario.name}: origin-modified recovery is unavailable without automatic reads or effects`, async ({
    page,
  }) => {
    // The substituted native HTTP document is another script on the same origin.
    // It changes real browser storage; neither Storage nor the host is replaced.
    const nativeScript = `
      const raw = sessionStorage.getItem('tsdm.workspace.recovery');
      if (raw) {
        const record = JSON.parse(raw);
        const entry = Object.values(record.entries)[0];
        let stored;
        ${scenario.change};
        sessionStorage.setItem('tsdm.workspace.recovery', stored ?? JSON.stringify(record));
      }
    `;
    const requests = await open(page, threadURL, undefined, nativeScript);
    await expect(
      page.getByRole("article", { name: "Post 101", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("This navigation snapshot is unavailable.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
    await page.getByRole("button", { name: "Reload", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Boards", exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(2);
  });
}

test("J2.session-unknown-key: an absent opaque key cannot resolve inherited object properties", async ({
  page,
}) => {
  const requests = await open(page, `${directoryURL}#workspace=constructor`);
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("J2.section-unavailable-back: returning from Search to a missing snapshot keeps explicit Reload usable", async ({
  page,
}, info) => {
  const requests = await open(page, `${directoryURL}#workspace=missing-key`);
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search", exact: true, level: 1 }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Reload", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  await info.attach("missing-entry-reloaded.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.appearance-pinned-locales: generated row labels translate while returned board content stays original", async ({
  page,
}, info) => {
  const requests = await open(page, boardURL);
  await expect(page.getByText("Pinned", { exact: true })).toBeVisible();
  for (const [locale, label] of [
    ["zh-CN", "置顶"],
    ["zh-TW", "置頂"],
    ["en", "Pinned"],
  ]) {
    await page.locator(".workspace > header button").first().click();
    await page.locator("#interface-language").selectOption(locale!);
    await page.keyboard.press("Escape");
    await expect(page.getByText(label!, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Board guide", exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
  }
  await info.attach("localized-pinned-row.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J2.session-redirect: real 302 remount retains canonical PID and populated origin through Back and reload", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${threadURL}&page=6#lastpost`,
      document: (url) =>
        url.searchParams.get("mod") === "viewthread" ? lastPage : board(2),
    },
    async (page, requests, redirects) => {
      await page.goto(secondURL);
      await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
      await page
        .getByRole("link", {
          name: "Last reply to Autumn listening — page 2",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("article", { name: "Post 105", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      expect(redirects).toEqual(["fetch", "document"]);
      expect(requests).toHaveLength(2);
      await page.goBack();
      await expect(
        page.getByText("Category: Listening notes", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
      expect(requests).toHaveLength(2);
      await page.goForward();
      await expect(
        page.getByRole("article", { name: "Post 105", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      await page.reload();
      await expect(
        page.getByRole("article", { name: "Post 105", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      expect(requests).toHaveLength(2);
      expect(redirects).toEqual(["fetch", "document"]);
      await info.attach("session-redirect-restored.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    },
  );
});
test("J2.session-contexts: independent tabs need explicit reload while opener copies inherit then diverge", async ({
  page,
  context,
}, info) => {
  const requests = await open(page, secondURL);
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  const savedURL = page.url();
  const independent = await context.newPage();
  await independent.goto(savedURL);
  await expect(
    independent.getByText("This navigation snapshot is unavailable.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  const opened = page.waitForEvent("popup");
  await page.evaluate((url) => {
    window.open(url, "inherited-session");
  }, savedURL);
  const copy = await opened;
  await expect(copy.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(
    copy.getByText("Snapshot from Reader Seven", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await copy
    .getByRole("navigation", { name: "Board pages" })
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(copy.getByText("Page 1", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  await page.reload();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await copy.reload();
  await expect(copy.getByText("Page 1", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  await independent
    .getByRole("button", { name: "Reload", exact: true })
    .click();
  await expect(
    independent.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(3);
  await info.attach("inherited-session-diverged.png", {
    body: await copy.screenshot(),
    contentType: "image/png",
  });
});
