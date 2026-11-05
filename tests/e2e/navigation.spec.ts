import { revealNavigation } from "./navigation-ui";
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
const navigationLedgers = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }, info) => {
  if (!/J2.workspace-panes|UX54.discovery/.test(info.title)) return;
  await info.attach("navigation-requests.json", {
    body: JSON.stringify(navigationLedgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("navigation-geometry.json", {
    body: JSON.stringify(
      await page.locator(".pane, .pane-drawer").evaluateAll((nodes) =>
        nodes.map((node) => ({
          class: node.className,
          rect: node.getBoundingClientRect().toJSON(),
          scrollTop: node.scrollTop,
          scrollHeight: node.scrollHeight,
        })),
      ),
    ),
    contentType: "application/json",
  });
  await info.attach("navigation-final.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
async function open(
  page: Page,
  destination = directoryURL,
  supplied?: (url: URL) => string,
  nativeScript = "",
  representation: "json" | "html" = "json",
) {
  const requests = Object.assign([] as string[], { effectful: [] as string[] });
  navigationLedgers.set(page, requests);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
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
    if (request.method() !== "GET")
      requests.effectful.push(`${request.method()} ${request.url()}`);
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
      contentType: representation === "json" ? "application/json" : "text/html",
      body:
        representation === "json" ? JSON.stringify({ document: body }) : body,
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
    const owner = element.closest(".boards-region") ?? element;
    const pane = owner.getBoundingClientRect();
    return {
      left: pane.left,
      right: pane.right,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: owner.clientHeight,
      scrollHeight: owner.scrollHeight,
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
    const pane = element.closest(".boards-region") ?? element.closest("nav")!;
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
  await revealNavigation(page);
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
    name: "unsupported-variables-profile",
    body: '{"Variables":{"forum":{"fid":"5","name":"Structured board"},"forum_threadlist":[]}}',
    heading: "Content unavailable",
    status: 200,
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
  }, info) => {
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
      content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
    });
    await expect(
      page.getByRole("heading", { name: scenario.heading, exact: true }),
    ).toBeVisible();
    const continuation = page.getByRole("link", {
      name: "Continue in native forum",
      exact: true,
    });
    await expect(continuation).toHaveAttribute(
      "href",
      `${boardURL}&tsdm-native=1`,
    );
    expect(reads).toHaveLength(1);
    expect(reads[0]).toContain("tsdmapp=json");
    if (
      [
        "unsupported-variables-profile",
        "picture-wall-with-subboards",
        "permission",
      ].includes(scenario.name)
    ) {
      await info.attach("bounded-response.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("bounded-response.json", {
        body: Buffer.from(
          JSON.stringify(
            {
              response: scenario.name,
              heading: scenario.heading,
              reads,
              nativeURL: await continuation.getAttribute("href"),
            },
            null,
            2,
          ),
        ),
        contentType: "application/json",
      });
    }
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
    await revealNavigation(page);
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
  const requests = await open(page, boardURL, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? thread
      : board().replace(
          '</table><div class="pg">',
          `${Array.from({ length: 25 }, (_, i) => threadRow(50 + i, `Retained result ${i}`)).join("")}</table><div class="pg">`,
        ),
  );
  const selected = page.getByRole("link", {
    name: "Retained result 10",
    exact: true,
  });
  await selected.scrollIntoViewIfNeeded();
  const originalOffset = await page
    .locator(".results-pane")
    .evaluate((node) => node.scrollTop);
  expect(originalOffset).toBeGreaterThan(0);
  await selected.click();
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
  await expect(selected).toHaveAttribute("aria-current", "true");
  expect(
    await page.locator(".results-pane").evaluate((node) => node.scrollTop),
  ).toBe(originalOffset);
  expect(requests).toHaveLength(2);
  expect(requests.effectful).toEqual([]);
  await page.keyboard.press("Escape");
  await revealNavigation(page);
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
    await page.getByRole("button", { name: /^(Settings|设置|設定)$/ }).click();
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

for (const representation of ["html", "json"] as const) {
  test(`UX54.grouped-${representation}: source menus retain meaning, returned order, destinations and passive Back`, async ({
    page,
  }, info) => {
    const categoryURL = `${boardURL}&filter=typeid&typeid=3&orderby=dateline`;
    const menus = `<div id="filter_dateline_menu"><a href="${boardURL}&dateline=604800">Any date 日期</a></div><div id="thread_types"><a href="${categoryURL}">Last 7 days 七日 — 音樂分類</a></div><div id="filter_special_menu"><a href="${boardURL}&filter=specialtype&specialtype=1">Polls 投票</a></div><div id="filter_orderby_menu"><a href="${boardURL}&orderby=dateline">Newest threads</a></div><div id="dhnav"><a href="${boardURL}&authorid=9">Newest threads 未知語義</a></div>`;
    const requests = await open(
      page,
      boardURL,
      (url) =>
        board(Number(url.searchParams.get("page") ?? 1)).replace(
          /<div id="thread_types">.*?<\/div><div id="filter_orderby_menu">.*?<\/div>/,
          menus,
        ),
      "",
      representation,
    );
    const filters = page.getByRole("navigation", {
      name: "Board filters",
      exact: true,
    });
    await expect(filters.getByRole("heading")).toHaveText([
      "Time",
      "Category",
      "Thread type",
      "Order",
      "Other filters",
    ]);
    const categories = filters.getByRole("group", {
      name: "Category",
      exact: true,
    });
    const choice = categories.getByRole("link", {
      name: "Last 7 days 七日 — 音樂分類",
      exact: true,
    });
    await expect(choice).toHaveAttribute("href", categoryURL);
    await expect(
      filters
        .getByRole("group", { name: "Other filters", exact: true })
        .getByRole("link"),
    ).toHaveAttribute("href", `${boardURL}&authorid=9`);
    await choice.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("list", { name: "Effective criteria" }),
    ).toContainText("Category: Last 7 days 七日 — 音樂分類");
    await page
      .getByRole("navigation", { name: "Board pages" })
      .getByRole("link", { name: "2", exact: true })
      .click();
    await expect(
      page.getByRole("link", {
        name: "Autumn listening — page 2",
        exact: true,
      }),
    ).toBeVisible();
    const clean = (value: string) => {
      const url = new URL(value);
      url.searchParams.delete("tsdmapp");
      return url.href;
    };
    expect(requests.map(clean)).toEqual([boardURL, categoryURL, secondURL]);
    const before = requests.length;
    await revealNavigation(page);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
    await expect(choice).toHaveAttribute("href", categoryURL);
    expect(requests).toHaveLength(before);
    expect(requests.effectful).toEqual([]);
    await info.attach("grouped-filters.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("returned-requests.json", {
      body: Buffer.from(JSON.stringify(requests, null, 2)),
      contentType: "application/json",
    });
  });
}

for (const appearance of [
  {
    width: 390,
    height: 844,
    language: "en",
    textSize: 100,
    theme: "light",
    category: "Category",
    subboards: "Subordinate boards",
  },
  {
    width: 768,
    height: 900,
    language: "zh-CN",
    textSize: 150,
    theme: "dark",
    category: "分类",
    subboards: "子版块",
  },
  {
    width: 1440,
    height: 900,
    language: "zh-TW",
    textSize: 70,
    theme: "mono",
    category: "分類",
    subboards: "子版塊",
  },
]) {
  test(`UX54.discovery-${appearance.width}: dense multilingual directory and subordinate metadata remain distinct and usable`, async ({
    page,
  }, info) => {
    await page.setViewportSize({
      width: appearance.width,
      height: appearance.height,
    });
    await page.addInitScript(
      (value) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, ...value }),
        ),
      appearance,
    );
    const longName =
      "音樂與創作交流 Music and composition — 長い多言語の版面名稱";
    const cards = Array.from({ length: 16 }, (_, i) =>
      boardLink(100 + i, `${longName} ${i + 1}`),
    ).join("");
    const populated = `<div class="bm"><div class="bm_h"><span>分区版主: Moderator Nine</span><h2>音樂 Listening</h2></div><div id="category_1"><table><tr>${boardLink(5, "Music discussion")}${cards}</tr></table></div></div><div class="bm"><div class="bm_h"><h2>精選 Featured</h2></div><div id="category_2"><table><tr>${boardLink(5, "Music discussion")}</tr></table></div></div><div class="pg"><strong>1</strong><a href="${directoryURL}?gid=2">2</a></div>`;
    const requests = await open(page, directoryURL, (url) =>
      url.searchParams.get("mod") === "forumdisplay"
        ? board()
            .replace("Live recordings", longName)
            .replaceAll(
              "Listening notes",
              `Listening notes ${longName.repeat(2)}`,
            )
        : populated,
    );
    await expect(page.locator(".board-group > h2")).toHaveText([
      "音樂 Listening",
      "精選 Featured",
    ]);
    await expect(page.locator(".overview .board-card")).toHaveCount(18);
    await expect(
      page
        .locator(".board-group")
        .first()
        .getByRole("link", { name: "Music discussion", exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .locator(".board-group")
        .nth(1)
        .getByRole("link", { name: "Music discussion", exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .locator(".overview")
        .getByText("Complete board description 5", { exact: true }),
    ).toHaveCount(2);
    await page
      .locator(".board-group")
      .first()
      .getByRole("link", { name: "Music discussion", exact: true })
      .click();
    const subordinate = page.locator(".results-pane section").filter({
      has: page.getByRole("heading", {
        name: appearance.subboards,
        exact: true,
      }),
    });
    await expect(
      subordinate.getByRole("link", { name: longName, exact: true }),
    ).toHaveAttribute("href", `${directoryURL}?mod=forumdisplay&fid=7`);
    await expect(
      subordinate.getByText("Complete board description 7", { exact: true }),
    ).toBeVisible();
    await expect(
      subordinate.getByText("25 threads", { exact: true }),
    ).toBeVisible();
    const choice = page
      .getByRole("group", { name: appearance.category, exact: true })
      .getByRole("link", {
        name: `Listening notes ${longName.repeat(2)}`,
        exact: true,
      });
    await choice.focus();
    await expect(choice).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("link", {
        name: "Autumn listening — page 1",
        exact: true,
      }),
    ).toBeVisible();
    const geometry = await page
      .locator(".results-pane")
      .evaluate((element) => ({
        width: element.clientWidth,
        scroll: element.scrollWidth,
      }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
    const originalResults = await page.locator(".results-pane").elementHandle();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.locator(".results-pane").evaluate((node) => {
      node.scrollTop = 40;
    });
    const retainedOffset = await page
      .locator(".results-pane")
      .evaluate((node) => node.scrollTop);
    expect(retainedOffset).toBeGreaterThan(0);
    const revealThreads = async () => {
      const collapsed = (page.viewportSize()?.width ?? 1280) < 768;
      await expect(page.locator(".workspace-body")).toHaveAttribute(
        "data-threads-collapsed",
        String(collapsed),
      );
      const toggle = page.getByRole("button", {
        name: /^(Threads pane|主题面板|主題面板)$/,
      });
      if (collapsed && (await toggle.getAttribute("aria-expanded")) === "false")
        await toggle.click();
      await expect(page.locator(".results-pane")).toBeVisible();
      expect(await originalResults!.evaluate((node) => node.isConnected)).toBe(
        true,
      );
      await expect
        .poll(() =>
          page.locator(".results-pane").evaluate((node) => node.scrollTop),
        )
        .toBe(retainedOffset);
    };
    await page.setViewportSize({
      width: appearance.width === 390 ? 1440 : 390,
      height: 900,
    });
    await revealThreads();
    await expect(choice).toBeVisible();
    await expect(
      subordinate.getByText("Complete board description 7", { exact: true }),
    ).toBeVisible();
    await page.setViewportSize({
      width: appearance.width,
      height: appearance.height,
    });
    await revealThreads();
    await expect(choice).toBeVisible();
    await expect(
      subordinate.getByText("Complete board description 7", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".workspace")).toHaveCount(1);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(requests).toHaveLength(3);
    expect(requests.effectful).toEqual([]);
    await info.attach("discovery-responsive.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("discovery-state.json", {
      body: Buffer.from(
        JSON.stringify({ appearance, geometry, requests }, null, 2),
      ),
      contentType: "application/json",
    });
  });
}

test("UX54.nested-empty: unknown menus retain choices around known nested menus without duplicate ownership", async ({
  page,
}, info) => {
  const timeURL = `${boardURL}&dateline=86400`;
  const otherURL = `${boardURL}&digest=1`;
  const empty = `<div id="ct"><h1>Empty board</h1></div><div id="dhnav"><a href="${otherURL}">Mystery 精華</a><div id="filter_dateline_menu"><a href="${timeURL}">All threads 全部</a></div><a href="${boardURL}&authorid=9">Recent 未知</a></div><table id="threadlisttableid"><tr><td class="emp">No threads available</td></tr></table>`;
  const requests = await open(page, boardURL, () => empty);
  const filters = page.getByRole("navigation", {
    name: "Board filters",
    exact: true,
  });
  await expect(filters.getByRole("heading")).toHaveText([
    "Other filters",
    "Time",
  ]);
  await expect(
    filters
      .getByRole("group", { name: "Other filters", exact: true })
      .getByRole("link"),
  ).toHaveText(["Mystery 精華", "Recent 未知"]);
  await expect(
    filters.getByRole("link", { name: "All threads 全部", exact: true }),
  ).toHaveCount(1);
  await filters
    .getByRole("group", { name: "Time", exact: true })
    .getByRole("link")
    .click();
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).toContainText("Time: All threads 全部");
  await expect(
    page.getByText("No threads available", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests.effectful).toEqual([]);
  expect(requests[1]).toContain("dateline=86400");
  await info.attach("nested-empty.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const legacy of [true, false]) {
  test(`UX54.recovery-${legacy ? "legacy" : "invalid"}: retained board filters are compatible or fail visibly without automatic requests`, async ({
    page,
  }, info) => {
    const nativeScript = `const raw = sessionStorage.getItem('tsdm.workspace.recovery'); if (raw) { const record = JSON.parse(raw); for (const entry of Object.values(record.entries)) { if (entry.result?.kind === 'board') { ${legacy ? "delete entry.result.board.filterGroups" : "entry.result.board.filterGroups = [{kind: 'constructor', sourceId: 'bad', links: []}]"}; } } sessionStorage.setItem('tsdm.workspace.recovery', JSON.stringify(record)); }`;
    const requests = await open(page, boardURL, undefined, nativeScript);
    await expect(
      page.getByRole("group", { name: "Category", exact: true }),
    ).toBeVisible();
    await page.reload();
    if (legacy) {
      await expect(
        page
          .getByRole("group", { name: "Other filters", exact: true })
          .getByRole("link"),
      ).toHaveText(["Listening notes", "Newest threads"]);
      await expect(
        page.getByRole("group", { name: "Category", exact: true }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(requests).toHaveLength(1);
    expect(requests.effectful).toEqual([]);
    await info.attach("recovered-board.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

test("UX54.unrecognized-source-menu: unfamiliar returned menu choices remain available without invented meaning", async ({
  page,
}) => {
  const unknownURL = `${boardURL}&filter=nativeextra&orderby=heats`;
  const requests = await open(page, boardURL, () =>
    board().replace(
      '<div id="thread_types">',
      `<div id="filter_nativeextra_menu"><a href="${unknownURL}">分類 Category Sort 排序</a></div><div id="thread_types">`,
    ),
  );
  const other = page.getByRole("group", { name: "Other filters", exact: true });
  await expect(
    other.getByRole("link", { name: "分類 Category Sort 排序", exact: true }),
  ).toHaveAttribute("href", unknownURL);
  await other.getByRole("link").click();
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).toContainText("Sort: heats");
  expect(requests).toHaveLength(2);
  expect(requests.effectful).toEqual([]);
});

test("UX54.recovery-array-kind: coercible nonstring grouping metadata is rejected without automatic reads", async ({
  page,
}) => {
  const nativeScript = `const raw = sessionStorage.getItem('tsdm.workspace.recovery'); if (raw) { const record = JSON.parse(raw); for (const entry of Object.values(record.entries)) { if (entry.result?.kind === 'board') entry.result.board.filterGroups[0].kind = ['category']; } sessionStorage.setItem('tsdm.workspace.recovery', JSON.stringify(record)); }`;
  const requests = await open(page, boardURL, undefined, nativeScript);
  await expect(
    page.getByRole("group", { name: "Category", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests.effectful).toEqual([]);
});

test("UX54.mixed-native-menu: More preserves actual order/time subgroup labels without guessed semantics", async ({
  page,
}, info) => {
  const orderURL = `${boardURL}&filter=author&orderby=dateline`;
  const repliesURL = `${boardURL}&filter=reply&orderby=replies`;
  const allTimeURL = `${boardURL}&orderby=lastpost&filter=dateline`;
  const weekURL = `${boardURL}&orderby=lastpost&filter=dateline&dateline=604800`;
  const menus = `<a id="filter_dateline">更多</a><div id="filter_dateline_menu" class="p_pop"><ul class="pop_moremenu"><li>排序: <a href="${orderURL}">发帖时间</a><span class="pipe">|</span><a href="${repliesURL}">回复数量</a></li><li>时间: <a href="${allTimeURL}" class="xw1">全部时间</a><span class="pipe">|</span><a href="${weekURL}">一周</a></li><li><a href="${boardURL}&digest=1">Unlabelled native choice</a></li></ul></div>`;
  const requests = await open(page, boardURL, () =>
    board().replace(
      /<div id="thread_types">.*?<\/div><div id="filter_orderby_menu">.*?<\/div>/,
      menus,
    ),
  );
  const filters = page.getByRole("navigation", {
    name: "Board filters",
    exact: true,
  });
  await expect(filters.getByRole("heading")).toHaveText([
    "排序:",
    "时间:",
    "Other filters",
  ]);
  await expect(
    filters
      .getByRole("group", { name: "排序:", exact: true })
      .getByRole("link"),
  ).toHaveText(["发帖时间", "回复数量"]);
  await expect(
    filters
      .getByRole("group", { name: "时间:", exact: true })
      .getByRole("link"),
  ).toHaveText(["全部时间", "一周"]);
  await expect(
    filters
      .getByRole("group", { name: "Other filters", exact: true })
      .getByRole("link"),
  ).toHaveText("Unlabelled native choice");
  await filters
    .getByRole("group", { name: "排序:", exact: true })
    .getByRole("link", { name: "回复数量", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).toContainText("Sort:");
  expect(requests[1]).toContain("filter=reply&orderby=replies");
  await filters
    .getByRole("group", { name: "时间:", exact: true })
    .getByRole("link", { name: "一周", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).toContainText("Time: 一周");
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).toContainText("Sort: lastpost");
  await expect(
    page.getByRole("list", { name: "Effective criteria" }),
  ).not.toContainText("Sort: 全部时间");
  expect(requests[2]).toContain(
    "orderby=lastpost&filter=dateline&dateline=604800",
  );
  expect(requests.effectful).toEqual([]);
  await info.attach("native-mixed-menu.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("native-mixed-requests.json", {
    body: Buffer.from(JSON.stringify(requests, null, 2)),
    contentType: "application/json",
  });
});

test("UX54.recovery-array-label: nonstring native group labels are rejected without automatic reads", async ({
  page,
}) => {
  const nativeScript = `const raw = sessionStorage.getItem('tsdm.workspace.recovery'); if (raw) { const record = JSON.parse(raw); for (const entry of Object.values(record.entries)) { if (entry.result?.kind === 'board') entry.result.board.filterGroups[0].sourceLabel = ['排序:']; } sessionStorage.setItem('tsdm.workspace.recovery', JSON.stringify(record)); }`;
  const requests = await open(page, boardURL, undefined, nativeScript);
  await expect(
    page.getByRole("group", { name: "Category", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests.effectful).toEqual([]);
});

test("UX54.criteria-provenance: carried context never names another current criterion", async ({
  page,
}, info) => {
  const destination = `${boardURL}&typeid=3&orderby=replies&dateline=604800&specialtype=1&digest=1&authorid=9&rewardtype=2`;
  const carried =
    "&typeid=3&dateline=604800&specialtype=1&digest=1&authorid=9&rewardtype=2";
  const menus = `<div id="filter_orderby_menu"><a href="${boardURL}&filter=reply&orderby=replies${carried}">回复数量</a></div><div id="thread_types"><a href="${boardURL}&filter=typeid${carried}">原生分類</a></div><div id="filter_special_menu"><a href="${boardURL}&filter=specialtype${carried}">投票</a></div><div id="filter_dateline_menu"><ul class="pop_moremenu"><li>时间: <a href="${boardURL}&filter=dateline${carried}">一周</a></li></ul></div><div id="dhnav"><a href="${boardURL}&filter=digest${carried}">精华</a><a href="${boardURL}${carried}">Unclassified carried context</a></div>`;
  const requests = await open(page, destination, () =>
    board().replace(
      /<div id="thread_types">.*?<\/div><div id="filter_orderby_menu">.*?<\/div>/,
      menus,
    ),
  );
  const criteria = page.getByRole("list", { name: "Effective criteria" });
  await expect(criteria.getByRole("listitem")).toHaveText([
    "Category: 原生分類",
    "Sort: replies",
    "Time: 一周",
    "Thread type: 投票",
    "Digest: 精华",
    "Author: 9",
    "Reward: 2",
  ]);
  expect(requests).toHaveLength(1);
  expect(requests.effectful).toEqual([]);
  await criteria.scrollIntoViewIfNeeded();
  await info.attach("criteria-provenance.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("criteria-provenance.json", {
    body: Buffer.from(
      JSON.stringify(
        { destination, requests, criteria: await criteria.innerText() },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
});
