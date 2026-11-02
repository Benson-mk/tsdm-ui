import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";

const origin = "https://www.tsdm39.com";
const inbox = `${origin}/home.php?mod=space&do=notice`;
const account = (
  id = "7",
  indicator = '<a id="myprompt" href="home.php?mod=space&do=notice">提醒(4)</a>',
) =>
  `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Reader ${id}</a></strong>${indicator}</div>`;
const directory = `${account()}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const categoryLinks = [
  { label: "Replies", query: "&view=mypost&type=post" },
  { label: "Mentions", query: "&view=mypost&type=at" },
  { label: "System notices", query: "&view=system" },
  { label: "Social activity", query: "&view=interactive" },
];
const completeTail =
  "This final paragraph remains part of the complete notice body.";
function notices(url: URL, header = account()) {
  const page = url.searchParams.get("page") ?? "1";
  const category = categoryLinks.find((item) => {
    const offered = new URL(inbox + item.query);
    return ["view", "type"].every(
      (key) => offered.searchParams.get(key) === url.searchParams.get(key),
    );
  });
  const label = category?.label ?? "All standard notices";
  const categoryURL = inbox + (category?.query ?? "");
  return `${header}<div id="ct"><div class="mn"><div class="nts"><dl notice="${page}1" id="notice_${page}1"><dt><span class="xg1"><span title="2026-10-20 21:35:42">just now</span></span><a href="home.php?mod=spacecp&ac=common&op=ignore&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">Ignore</a></dt><dd class="ntc_body" style="font-weight:bold"><p>${label} page ${page}: full notice introduction.</p><p>${"Preserved body detail. ".repeat(80)}</p><p>${completeTail}</p><a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=202">Open exact reply</a><script>window.noticeExecuted=true</script><img src="javascript:alert(1)" onerror="window.noticeExecuted=true"></dd></dl></div><div class="pg"><strong>${page}</strong><a href="${categoryURL}&page=${page === "1" ? "2" : "1"}">${page === "1" ? "2" : "1"}</a></div></div><div class="appl"><div class="tbn"><ul><li class="${category ? "" : "a"}"><a href="${inbox}">All standard notices</a></li>${categoryLinks.map((item) => `<li class="${category === item ? "a" : ""}"><a href="${inbox}${item.query}">${item.label}</a></li>`).join("")}<li><a href="home.php?mod=space&do=pm">Private messages</a></li></ul></div></div></div>`;
}
const nativeAllPage2 = `${inbox}&view=all&type=&isread=1&page=2`;
function nativePagerNotices(url: URL, query = "&view=all&type=&isread=1") {
  const page = url.searchParams.get("page") ?? "1";
  const other = page === "1" ? "2" : "1";
  return `${account()}<div id="ct"><div class="mn"><div class="nts"><dl notice="${page}1"><dt><span title="2026-10-21 12:30:0${page}">today</span></dt><dd class="ntc_body"><p>Native page ${page} notice.</p><p>${`Complete detail for page ${page}. `.repeat(80)}</p><p>Native page ${page} complete ending.</p><a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=20${page}">Open exact reply</a></dd></dl></div><div class="pgs cl"><div class="pg"><strong>${page}</strong><a href="home.php?mod=space&do=notice${query}&amp;page=${other}">${other}</a><label><input name="custompage" value="${page}"><span title="共 2 页"> / 2 页</span></label><a href="home.php?mod=space&do=notice${query}&amp;page=${other}" class="${page === "1" ? "nxt" : "prev"}">${page === "1" ? "下一页" : "上一页"}</a></div></div></div><div class="appl"><div class="tbn"><ul><li class="a"><a href="home.php?mod=space&do=notice">All standard notices</a></li></ul></div></div></div>`;
}
type Response =
  | string
  | { body: string; contentType?: string; status?: number; abort?: boolean };
async function open(
  page: Page,
  supplied: (url: URL) => Response | Promise<Response> = notices,
  destination = `${origin}/forum.php`,
) {
  const ledger: { url: string; method: string; effect: number }[] = [];
  let effects = 0;
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__workspace-fixture.js`)
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><body>Native forum<script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    const url = new URL(request.url());
    if (url.pathname === "/home.php" && url.searchParams.get("do") === "notice")
      effects++;
    ledger.push({
      url: request.url(),
      method: request.method(),
      effect: effects,
    });
    const response =
      url.pathname === "/home.php" ? await supplied(url) : directory;
    if (typeof response !== "string") {
      if (response.abort) return route.abort();
      return route.fulfill({
        status: response.status ?? 200,
        contentType: response.contentType ?? "text/html",
        body: response.body,
      });
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ uid: 7, document: response }),
    });
  });
  await page.goto(destination);
  return { ledger, effects: () => effects };
}
async function overview(page: Page) {
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Notices", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Notices", exact: true, level: 1 }),
  ).toBeVisible();
}
async function artifact(
  page: Page,
  info: TestInfo,
  ledger: unknown,
  name: string,
) {
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach(`${name}-effects.json`, {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
}

test("J10.notices-native-default-pager: native default All aliases and read filter preserve full returned pages and passive history without another read", async ({
  page,
}, info) => {
  const server = await open(page, (url) => nativePagerNotices(url));
  await overview(page);
  expect(server.effects()).toBe(0);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await artifact(page, info, server.ledger, "native-default-pager-load");
  const pane = page.locator(".notices-pane");
  async function checkPage(number: "1" | "2") {
    await expect(
      pane.getByText(`Page ${number}`, { exact: true }),
    ).toBeVisible();
    const row = page.locator(`[data-notice-id="${number}1"]`);
    await expect(row.locator("time")).toHaveText(`2026-10-21 12:30:0${number}`);
    await expect(row.locator("p")).toHaveText([
      `Native page ${number} notice.`,
      `Complete detail for page ${number}. `.repeat(80).trim(),
      `Native page ${number} complete ending.`,
    ]);
    await expect(
      row.getByRole("link", { name: "Open exact reply" }),
    ).toHaveAttribute(
      "href",
      `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=20${number}`,
    );
    return row.evaluate((element) => ({
      id: element.getAttribute("data-notice-id"),
      text: element.textContent,
      targets: Array.from(element.querySelectorAll("a")).map((a) => a.href),
    }));
  }
  const first = await checkPage("1");
  await expect(
    page
      .getByRole("navigation", { name: "Notice pages", exact: true })
      .getByRole("link", { name: "下一页", exact: true }),
  ).toHaveAttribute("href", nativeAllPage2);
  expect(server.effects()).toBe(1);
  const next = page
    .getByRole("navigation", { name: "Notice pages", exact: true })
    .getByRole("link", { name: "下一页", exact: true });
  await next.scrollIntoViewIfNeeded();
  const firstScroll = await pane.evaluate((element) => element.scrollTop);
  expect(firstScroll).toBeGreaterThan(0);
  await next.click();
  const second = await checkPage("2");
  expect(server.effects()).toBe(2);
  expect(
    server.ledger.filter((item) => item.url.includes("do=notice")),
  ).toEqual([
    { url: `${inbox}&tsdmapp=json`, method: "GET", effect: 1 },
    { url: `${nativeAllPage2}&tsdmapp=json`, method: "GET", effect: 2 },
  ]);
  await expect(
    page
      .getByRole("navigation", { name: "Notice pages", exact: true })
      .getByRole("link", { name: "上一页", exact: true }),
  ).toHaveAttribute("href", `${inbox}&view=all&type=&isread=1&page=1`);
  await pane.evaluate((element) => {
    element.scrollTop = 300;
  });
  const secondScroll = await pane.evaluate((element) => element.scrollTop);
  expect(secondScroll).toBeGreaterThan(0);
  await page.goBack();
  expect(await checkPage("1")).toEqual(first);
  await expect
    .poll(() => pane.evaluate((element) => element.scrollTop))
    .toBe(firstScroll);
  await page.goForward();
  expect(await checkPage("2")).toEqual(second);
  await expect
    .poll(() => pane.evaluate((element) => element.scrollTop))
    .toBe(secondScroll);
  await page.reload();
  expect(await checkPage("2")).toEqual(second);
  await expect
    .poll(() => pane.evaluate((element) => element.scrollTop))
    .toBe(secondScroll);
  await expect(
    page.getByText(
      "Restored snapshot — account and content have not been rechecked.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(server.effects()).toBe(2);
  await artifact(
    page,
    info,
    { requests: server.ledger, first, second, firstScroll, secondScroll },
    "native-default-pages-passive-return",
  );
});

for (const invalid of [
  {
    id: "different-category",
    query: "&view=system&type=&isread=1",
    destination: inbox,
  },
  {
    id: "different-type",
    query: "&view=all&type=post&isread=1",
    destination: inbox,
  },
  {
    id: "changed-read-filter",
    query: "&view=all&type=&isread=0",
    destination: `${inbox}&isread=1`,
  },
  {
    id: "missing-read-filter",
    query: "&view=all&type=",
    destination: `${inbox}&isread=1`,
  },
  {
    id: "unknown-read-filter",
    query: "&view=all&type=&isread=fiction",
    destination: inbox,
  },
]) {
  test(`J10.notices-native-pager-rejects-${invalid.id}: a different returned category, type or read filter cannot become a complete list`, async ({
    page,
  }, info) => {
    const server = await open(
      page,
      (url) => nativePagerNotices(url, invalid.query),
      invalid.destination,
    );
    await page
      .getByRole("button", { name: "Load notices", exact: true })
      .click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "pagination could not be preserved completely" }),
    ).toBeVisible();
    await expect(page.locator("[data-notice-id]")).toHaveCount(0);
    expect(server.effects()).toBe(1);
    await artifact(
      page,
      info,
      server.ledger,
      `native-pager-rejects-${invalid.id}`,
    );
  });
}

test("J10.notices-native-pager-rejects-conflicting-filters: an unfiltered response cannot offer contradictory read filters", async ({
  page,
}, info) => {
  const server = await open(page, (url) =>
    nativePagerNotices(url).replace(
      'isread=1&amp;page=2" class="nxt"',
      'isread=0&amp;page=2" class="nxt"',
    ),
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "pagination could not be preserved completely" }),
  ).toBeVisible();
  await expect(page.locator("[data-notice-id]")).toHaveCount(0);
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "native-pager-conflicting-filters");
});

test("J10.notices-deliberate-complete: overview does not preload or poll; deliberate loads preserve full inert bodies and every returned category/page", async ({
  page,
}, info) => {
  await page.clock.install();
  const server = await open(page);
  await overview(page);
  await expect(
    page.getByRole("button", { name: "Load notices", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Every load, refresh, category and page request can mark notices read on the server. Failed loading can still have effects.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.clock.fastForward(61_000);
  expect(server.effects()).toBe(0);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByText("All standard notices page 1: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  await expect(
    page.getByText("2026-10-20 21:35:42", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open exact reply", exact: true }),
  ).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=202`,
  );
  expect(server.effects()).toBe(1);
  expect(await page.evaluate(() => "noticeExecuted" in window)).toBe(false);
  for (const category of categoryLinks) {
    await page
      .getByRole("navigation", { name: "Notice categories", exact: true })
      .getByRole("link", { name: category.label, exact: true })
      .click();
    await expect(
      page.getByText(`${category.label} page 1: full notice introduction.`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  }
  expect(server.effects()).toBe(5);
  await page
    .getByRole("navigation", { name: "Notice pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByText("Social activity page 2: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(6);
  expect(
    server.ledger
      .filter((item) => item.url.includes("do=notice"))
      .every(
        (item) =>
          item.method === "GET" &&
          new URL(item.url).searchParams.get("tsdmapp") === "json",
      ),
  ).toBe(true);
  const snapshot = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(snapshot).not.toContain("SYNTHETIC_PUBLIC_FORM_TOKEN");
  await page.clock.fastForward(61_000);
  expect(server.effects()).toBe(6);
  await artifact(page, info, server.ledger, "complete-notice-category-page");
});

for (const indicator of [
  {
    id: "count",
    markup: '<a id="myprompt">提醒(4)</a>',
    expected:
      "Returned unread indicator: 4. Current unread state may already have changed.",
  },
  {
    id: "zero",
    markup: '<a id="myprompt">提醒(0)</a>',
    expected:
      "Returned unread indicator: 0. Current unread state may already have changed.",
  },
  {
    id: "absent",
    markup: "",
    expected:
      "No unread indicator was returned. The current unread count is unknown.",
  },
  {
    id: "unknown",
    markup: '<a id="myprompt">提醒(?)</a>',
    expected:
      "The returned unread indicator could not be interpreted. The current unread count is unknown.",
  },
]) {
  test(`J10.notices-effects-${indicator.id}: returned indicators distinguish observed counts from unknown current state and passive snapshots are stale`, async ({
    page,
  }, info) => {
    const server = await open(page, (url) =>
      notices(url, account("7", indicator.markup)),
    );
    await overview(page);
    await page
      .getByRole("button", { name: "Load notices", exact: true })
      .click();
    await expect(
      page.getByText(indicator.expected, { exact: true }),
    ).toBeVisible();
    expect(server.effects()).toBe(1);
    await page.reload();
    await expect(
      page.getByText(indicator.expected, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Restored snapshot — account and content have not been rechecked.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(server.effects()).toBe(1);
    await artifact(
      page,
      info,
      server.ledger,
      `returned-indicator-${indicator.id}`,
    );
  });
}

const failures: { id: string; response: (url: URL) => Response }[] = [
  { id: "network", response: () => ({ body: "", abort: true }) },
  {
    id: "invalid-json",
    response: () => ({ body: "{", contentType: "application/json" }),
  },
  {
    id: "partial-body",
    response: (url) =>
      notices(url).replace('class="ntc_body"', 'class="unrecognized"'),
  },
  {
    id: "missing-time",
    response: (url) =>
      notices(url).replace(
        '<span class="xg1"><span title="2026-10-20 21:35:42">just now</span></span>',
        "",
      ),
  },
  {
    id: "missing-list",
    response: () => `${account()}<div id="ct"><p>Unexpected content</p></div>`,
  },
  {
    id: "duplicate-id",
    response: (url) =>
      notices(url).replace(
        "</dl>",
        '</dl><dl notice="11"><dt><span>2026-10-20</span></dt><dd class="ntc_body">Another notice</dd></dl>',
      ),
  },
  {
    id: "unsupported-pager",
    response: (url) =>
      notices(url).replace('&page=2">2', '&page=2&unrecognized=1">2'),
  },
  {
    id: "permission",
    response: () => ({
      body: `${account()}<div id="messagetext">权限不足</div>`,
      status: 403,
    }),
  },
  {
    id: "challenge",
    response: () =>
      '<title>Just a moment</title><form id="challenge-form"></form>',
  },
  { id: "limited", response: () => ({ body: account(), status: 429 }) },
];
for (const failure of failures) {
  test(`J10.notices-effects-failure-${failure.id}: failed loads retain uncertain effects and do not retry or claim an empty inbox`, async ({
    page,
  }, info) => {
    await page.clock.install();
    const server = await open(page, failure.response);
    await overview(page);
    await page
      .getByRole("button", { name: "Load notices", exact: true })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: /may still/ }),
    ).toBeVisible();
    expect(server.effects()).toBe(1);
    await page.clock.fastForward(61_000);
    expect(server.effects()).toBe(1);
    await expect(page.locator("[data-notice-id]")).toHaveCount(0);
    await artifact(page, info, server.ledger, `failed-load-${failure.id}`);
  });
}

for (const actor of ["changed", "unknown", "guest"] as const) {
  test(`J10.notices-session-${actor}: a fresh unverified or changed account clears previous member notices including passive history`, async ({
    page,
  }, info) => {
    let changed = false;
    const server = await open(page, (url) => {
      if (!changed) return notices(url);
      if (actor === "changed") return { body: notices(url, account("8")) };
      if (actor === "guest")
        return {
          body: '<form id="loginform"><p>Please sign in</p></form>',
          status: 401,
        };
      return { body: notices(url).replace(/<div id="um">[\s\S]*?<\/div>/, "") };
    });
    await overview(page);
    await page
      .getByRole("button", { name: "Load notices", exact: true })
      .click();
    await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
    changed = true;
    await page
      .getByRole("button", { name: "Refresh notices", exact: true })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: /may still/ }),
    ).toBeVisible();
    await expect(page.getByText(completeTail, { exact: true })).toHaveCount(0);
    await page.goBack();
    await expect(page.getByText(completeTail, { exact: true })).toHaveCount(0);
    expect(server.effects()).toBe(2);
    await artifact(page, info, server.ledger, `account-${actor}`);
  });
}

test("J10.notices-content-identity: inert body header-shaped content cannot impersonate the response account", async ({
  page,
}, info) => {
  const server = await open(page, (url) => ({
    body: notices(url).replace(
      "<p>All standard notices",
      `${account("8")}<p>All standard notices`,
    ),
  }));
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  await expect(
    page.getByText("Signed in as Reader 7", { exact: true }),
  ).toBeVisible();
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "body-cannot-set-account");
});

const thread = `${account()}<div id="postlist"><h1 id="thread_subject">Exact notice destination</h1><div id="post_201"><div class="authi"><a href="home.php?mod=space&uid=9">Poster</a></div><a id="postnum201">21</a><span id="authorposton201">2026-10-20</span><div class="pcb"><p>Earlier complete post.</p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=9">Poster</a></div><a id="postnum202">22</a><span id="authorposton202">2026-10-20</span><div class="pcb"><p>Exact complete notice target.</p></div></div></div><div class="pg"><strong>3</strong><a href="forum.php?mod=viewthread&tid=42&page=2">2</a></div>`;
const tallImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAu4CAIAAABn2a9PAAABy0lEQVR4nO3LIREAAAgEsO+fEY+iAxlwiN3NLtVzEkEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBOFjWDoOBYnqK+uGAAAAAElFTkSuQmCC",
  "base64",
);
async function holdImage(page: Page, name: string) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${origin}/${name}.png`, async (route) => {
    await gate;
    await route.fulfill({ contentType: "image/png", body: tallImage });
  });
  return release;
}
async function imageLoaded(page: Page, name: string) {
  await expect
    .poll(() =>
      page
        .getByAltText(name, { exact: true })
        .evaluate(
          (node) =>
            node instanceof HTMLImageElement &&
            node.complete &&
            node.naturalHeight,
        ),
    )
    .toBe(3000);
}
async function targetGeometry(page: Page) {
  return page.locator("#pid202").evaluate((node) => {
    const pane = node.closest('[data-scroll-pane="reading"]')!;
    const bounds = pane.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
      pane: { top: bounds.top, bottom: bounds.bottom },
      target: { top: rect.top, bottom: rect.bottom },
      scrollTop: pane.scrollTop,
    };
  });
}
test("J10.notices-target-delayed-image: an exact returned page2 target stays visible after a tall earlier image loads and passive list/target restoration adds no notice read", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${origin}/forum.php?mod=viewthread&tid=42&page=3`,
      document: (url) =>
        url.pathname === "/home.php"
          ? nativePagerNotices(url)
          : url.searchParams.get("mod") === "viewthread"
            ? thread.replace(
                "<p>Earlier complete post.</p>",
                `<p>Earlier complete post.</p><img src="${origin}/authored-tall.png" alt="authored-tall">`,
              )
            : directory,
    },
    async (page, reads, redirects) => {
      const releaseImage = await holdImage(page, "authored-tall");
      await page.goto(`${origin}/forum.php`);
      await overview(page);
      await page
        .getByRole("button", { name: "Load notices", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Notice pages", exact: true })
        .getByRole("link", { name: "下一页", exact: true })
        .click();
      await expect(
        page.getByText("Native page 2 complete ending.", { exact: true }),
      ).toBeVisible();
      const link = page.getByRole("link", {
        name: "Open exact reply",
        exact: true,
      });
      await link.scrollIntoViewIfNeeded();
      const listScroll = await page
        .locator(".notices-pane")
        .evaluate((node) => node.scrollTop);
      const listBefore = await page
        .locator('[data-notice-id="21"]')
        .textContent();
      await link.click();
      const target = page.locator("#pid202");
      await expect(target).toBeFocused();
      releaseImage();
      await imageLoaded(page, "authored-tall");
      await artifact(
        page,
        info,
        { reads, redirects, geometry: await targetGeometry(page), listScroll },
        "delayed-image-target",
      );
      await expect(target).toBeInViewport();
      const geometry = await targetGeometry(page);
      expect(geometry.target.top).toBeGreaterThanOrEqual(geometry.pane.top);
      expect(geometry.target.bottom).toBeLessThanOrEqual(geometry.pane.bottom);
      const before = reads.length;
      await page.goBack();
      await expect(page.locator("#notice-21")).toBeFocused();
      await expect(page.locator("#notice-21")).toHaveAttribute(
        "aria-current",
        "true",
      );
      expect(await page.locator('[data-notice-id="21"]').textContent()).toBe(
        listBefore,
      );
      await expect
        .poll(() =>
          page.locator(".notices-pane").evaluate((node) => node.scrollTop),
        )
        .toBe(listScroll);
      const releaseReturnedImage = await holdImage(page, "authored-tall");
      await page.goForward();
      await expect(target).toBeFocused();
      releaseReturnedImage();
      await imageLoaded(page, "authored-tall");
      await expect(target).toBeInViewport();
      const returnedGeometry = await targetGeometry(page);
      expect(returnedGeometry.target.top).toBeGreaterThanOrEqual(
        returnedGeometry.pane.top,
      );
      expect(returnedGeometry.target.bottom).toBeLessThanOrEqual(
        returnedGeometry.pane.bottom,
      );
      await page.goBack();
      await page.reload();
      await expect(page.locator("#notice-21")).toBeFocused();
      expect(await page.locator('[data-notice-id="21"]').textContent()).toBe(
        listBefore,
      );
      expect(reads).toHaveLength(before);
      expect(
        reads.filter((url) => new URL(url).searchParams.get("do") === "notice"),
      ).toHaveLength(2);
      await artifact(
        page,
        info,
        {
          reads,
          redirects,
          listScroll,
          listBefore,
          geometry,
          returnedGeometry,
        },
        "delayed-image-restored-page2",
      );
    },
  );
});
test("J10.notices-target-reader-intent: after deliberately scrolling away from the exact target, another tall earlier image cannot pull the reader back", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${origin}/forum.php?mod=viewthread&tid=42&page=3`,
      document: (url) =>
        url.pathname === "/home.php"
          ? nativePagerNotices(url).replace(
              "forum.php?mod=redirect&goto=findpost&ptid=42&pid=201",
              "forum.php?mod=viewthread&tid=42&page=3#pid202",
            )
          : url.searchParams.get("mod") === "viewthread"
            ? thread.replace(
                "<p>Earlier complete post.</p>",
                `<p>Earlier complete post.</p><p><img src="${origin}/first-tall.png" alt="first-tall"></p><p><img src="${origin}/second-tall.png" alt="second-tall"></p>`,
              )
            : directory,
    },
    async (page, reads, redirects) => {
      const releaseFirst = await holdImage(page, "first-tall");
      const releaseSecond = await holdImage(page, "second-tall");
      await page.goto(`${origin}/forum.php`);
      await overview(page);
      await page
        .getByRole("button", { name: "Load notices", exact: true })
        .click();
      await page
        .getByRole("link", { name: "Open exact reply", exact: true })
        .click();
      const target = page.locator("#pid202");
      await expect(target).toBeFocused();
      releaseFirst();
      await imageLoaded(page, "first-tall");
      await expect(target).toBeInViewport();
      const pane = page.locator('[data-scroll-pane="reading"]');
      const before = await pane.evaluate((node) => node.scrollTop);
      const bounds = (await pane.boundingBox())!;
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      await page.mouse.wheel(0, -600);
      await expect
        .poll(() => pane.evaluate((node) => node.scrollTop))
        .toBe(before - 600);
      await expect(target).not.toBeInViewport();
      const deliberate = await targetGeometry(page);
      await page.goBack();
      await expect(page.locator("#notice-11")).toBeFocused();
      await page.goForward();
      await expect(target).toBeFocused();
      await imageLoaded(page, "first-tall");
      await expect
        .poll(() => pane.evaluate((node) => node.scrollTop))
        .toBe(deliberate.scrollTop);
      const returned = await targetGeometry(page);
      releaseSecond();
      await imageLoaded(page, "second-tall");
      await expect
        .poll(() => pane.evaluate((node) => node.scrollTop))
        .toBe(deliberate.scrollTop);
      await expect(target).not.toBeInViewport();
      const after = await targetGeometry(page);
      expect(after.target.top - returned.target.top).toBe(3000);
      expect(reads).toHaveLength(3);
      expect(
        reads.filter((url) => new URL(url).searchParams.get("do") === "notice"),
      ).toHaveLength(1);
      await artifact(
        page,
        info,
        { reads, redirects, deliberate, returned, after },
        "delayed-image-reader-intent",
      );
    },
  );
});
test("J10.notices-return-remount: exact post follows a real 302/document remount and local Back/Forward/reload preserves category/page/body/selection/position without notice requests", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${origin}/forum.php?mod=viewthread&tid=42&page=3`,
      document: (url) =>
        url.pathname === "/home.php"
          ? notices(url)
          : url.searchParams.get("mod") === "viewthread"
            ? thread
            : directory,
    },
    async (page, reads, redirects) => {
      await page.goto(`${origin}/forum.php`);
      await overview(page);
      await page
        .getByRole("button", { name: "Load notices", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Notice categories", exact: true })
        .getByRole("link", { name: "Mentions", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Notice pages", exact: true })
        .getByRole("link", { name: "2", exact: true })
        .click();
      await expect(
        page.getByText("Mentions page 2: full notice introduction.", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Open exact reply", exact: true })
        .scrollIntoViewIfNeeded();
      const beforePosition = await page
        .locator(".notices-pane")
        .evaluate((node) => node.scrollTop);
      await page
        .getByRole("link", { name: "Open exact reply", exact: true })
        .click();
      await expect(
        page.getByText("Exact complete notice target.", { exact: true }),
      ).toBeVisible();
      await expect(page.locator("#pid202")).toBeFocused();
      expect(redirects).toEqual(["fetch", "document"]);
      const before = reads.length;
      await page.goBack();
      await expect(
        page.getByText("Mentions page 2: full notice introduction.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator("#notice-21")).toHaveAttribute(
        "aria-current",
        "true",
      );
      await expect(page.locator("#notice-21")).toBeFocused();
      expect(
        Math.abs(
          (await page
            .locator(".notices-pane")
            .evaluate((node) => node.scrollTop)) - beforePosition,
        ),
      ).toBeLessThan(3);
      expect(page.url()).toMatch(
        /^https:\/\/www\.tsdm39\.com\/forum\.php#workspace=/,
      );
      await page.goForward();
      await expect(
        page.getByText("Exact complete notice target.", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByText("Exact complete notice target.", { exact: true }),
      ).toBeVisible();
      await page.goBack();
      await page.reload();
      await expect(
        page.getByText("Mentions page 2: full notice introduction.", {
          exact: true,
        }),
      ).toBeVisible();
      expect(reads).toHaveLength(before);
      expect(
        reads.filter((url) => new URL(url).searchParams.get("do") === "notice"),
      ).toHaveLength(3);
      expect(
        await page.evaluate(() => JSON.stringify(history.state)),
      ).not.toContain("Mentions");
      await artifact(
        page,
        info,
        { reads, redirects },
        "exact-notice-remount-return",
      );
    },
  );
});

test("J10.notices-return-missing: missing recovery never reloads notices; explicit overview Load discloses and makes one new request", async ({
  page,
}, info) => {
  const server = await open(page);
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  await page.evaluate(() =>
    sessionStorage.removeItem("tsdm.workspace.recovery"),
  );
  await page.reload();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  expect(server.effects()).toBe(1);
  await overview(page);
  await expect(
    page.getByText(
      "Every load, refresh, category and page request can mark notices read on the server. Failed loading can still have effects.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  expect(server.effects()).toBe(2);
  await artifact(page, info, server.ledger, "missing-notice-recovery");
});

test("J10.notices-native-arrival: a native effectful URL reports pre-startup effects and does not repeat the request", async ({
  page,
}, info) => {
  const server = await open(
    page,
    notices,
    `${inbox}&view=mypost&type=at&page=2`,
  );
  await expect(
    page.getByText(
      "This native notice request may have marked notices read before the workspace started. No notice request has been repeated. Load notices only deliberately.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(server.effects()).toBe(0);
  await expect(
    page.getByRole("button", { name: "Load notices", exact: true }),
  ).toBeVisible();
  await page.reload();
  expect(server.effects()).toBe(0);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByText("Mentions page 2: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "direct-native-notice-arrival");
});

for (const width of [1280, 1265, 1000, 390]) {
  test(`J10.notices-native-arrival-readable-${width}: the pre-startup read-effects warning uses readable width and is fully in the short-window viewport without another notice request`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 540 });
    const server = await open(page, notices, inbox);
    const warning = page.getByText(
      "This native notice request may have marked notices read before the workspace started. No notice request has been repeated. Load notices only deliberately.",
      { exact: true },
    );
    const alert = page.getByRole("alert").filter({ has: warning });
    await expect(warning).toBeVisible();
    const readback = await alert.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const paragraph = node.querySelector("p")!.getBoundingClientRect();
      return {
        width: bounds.width,
        left: bounds.left,
        paragraphTop: paragraph.top,
        paragraphBottom: paragraph.bottom,
        viewportHeight: innerHeight,
        overflow: node.scrollWidth > node.clientWidth + 1,
      };
    });
    await artifact(
      page,
      info,
      { requests: server.ledger, geometry: readback },
      `direct-native-readable-${width}`,
    );
    expect(readback.width).toBeGreaterThanOrEqual(Math.min(600, width - 32));
    expect(readback.left).toBeGreaterThanOrEqual(0);
    expect(readback.overflow).toBe(false);
    expect(readback.paragraphTop).toBeGreaterThanOrEqual(0);
    expect(readback.paragraphBottom).toBeLessThanOrEqual(
      readback.viewportHeight,
    );
    await expect(warning).toBeInViewport({ ratio: 1 });
    expect(server.effects()).toBe(0);
    await page.reload();
    await expect(warning).toBeInViewport({ ratio: 1 });
    expect(server.effects()).toBe(0);
  });
}

test("J10.notices-native-body-targets: deferred PM/activity targets explicitly continue natively and current native control tokens never enter recovery", async ({
  page,
}, info) => {
  const server = await open(page, (url) =>
    notices(url).replace(
      "</dd></dl>",
      '<p><a href="home.php?mod=space&do=pm&subop=view&touid=9">Private message target</a><a href="home.php?mod=space&do=doing&id=99">Activity target</a><a href="home.php?mod=spacecp&ac=friend&op=add&uid=9&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">Native control</a></p></dd></dl>',
    ),
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByRole("link", {
      name: "Private message target — Continue in native forum",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `${origin}/home.php?mod=space&do=pm&subop=view&touid=9&tsdm-native=1`,
  );
  await expect(
    page.getByRole("link", {
      name: "Activity target — Continue in native forum",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `${origin}/home.php?mod=space&do=doing&id=99&tsdm-native=1`,
  );
  await expect(
    page.getByRole("link", { name: "Native control", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("This action requires current native forum controls.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).not.toContain("SYNTHETIC_PUBLIC_FORM_TOKEN");
  expect(server.effects()).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("link", {
      name: "Activity target — Continue in native forum",
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "native-body-targets");
});

test("J10.notices-content-navigation: category-shaped or pager-shaped body content cannot replace the returned inbox controls", async ({
  page,
}, info) => {
  const server = await open(page, (url) =>
    notices(url).replace(
      "<p>All standard notices",
      '<div class="tb"><li class="a"><a href="home.php?mod=space&do=notice&view=fiction">Invented body category</a></li></div><div class="pg"><strong>99</strong><a href="home.php?mod=space&do=notice&page=99">99</a></div><p>All standard notices',
    ),
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Notice categories", exact: true })
      .getByRole("link", { name: "Invented body category", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Notice pages", exact: true })
      .getByRole("link", { name: "2", exact: true }),
  ).toBeVisible();
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "body-cannot-set-navigation");
});

for (const width of [390, 1000]) {
  test(`J10.notices-layout-${width}: global language and text controls preserve a complete usable notices view and translated failure effects`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    let fail = false;
    const server = await open(page, (url) =>
      fail ? { body: "", abort: true } : notices(url),
    );
    if (width < 960)
      await page
        .getByRole("combobox", { name: "Main destinations", exact: true })
        .selectOption("notices");
    else await overview(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption("zh-TW");
    await page.getByLabel("文字大小", { exact: true }).fill("90");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "載入通知", exact: true }).click();
    await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
    await expect(
      page.getByRole(width < 960 ? "navigation" : "combobox", {
        name: "通知分類",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("傳回的未讀提示：4。目前未讀狀態可能已改變。", {
        exact: true,
      }),
    ).toBeVisible();
    fail = true;
    await page
      .getByRole("button", { name: "重新載入通知", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "通知請求失敗，仍可能已將通知標為已讀。請僅在主動操作時重試。",
    );
    expect(server.effects()).toBe(2);
    const overflow = await page
      .locator(".notices-pane")
      .evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
    await artifact(page, info, server.ledger, `localized-notices-${width}`);
  });
}

test("J10.notices-session-departure: a delayed notice response cannot replace a later section or be replayed on passive return", async ({
  page,
}, info) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const server = await open(page, async (url) => {
    await held;
    return notices(url);
  });
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect.poll(() => server.effects()).toBe(1);
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  const response = page.waitForResponse(
    (response) => new URL(response.url()).searchParams.get("do") === "notice",
  );
  release();
  await (await response).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole("heading", { name: "Saved", exact: true, level: 1 }),
  ).toBeVisible();
  await page.goBack();
  await page.reload();
  await expect(page.getByText(completeTail, { exact: true })).toHaveCount(0);
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "late-notice-return");
});

test("J10.notices-empty: only an explicit returned empty notice list is presented as empty with offered category navigation", async ({
  page,
}, info) => {
  const server = await open(page, (url) =>
    notices(url).replace(
      /<dl notice=[\s\S]*?<\/dl>/,
      '<p class="emp">No notices in this returned category.</p>',
    ),
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByText("No notices in this returned category.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Notice categories", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-notice-id]")).toHaveCount(0);
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "explicit-empty-category");
});

test("J10.notices-returned-native-controls: repeated categories preserve their active state and social rows retain their actual notice identity without invented pages", async ({
  page,
}, info) => {
  const server = await open(
    page,
    () =>
      `${account("7", '<a id="myprompt">提醒</a>')}<div id="ct"><div class="tb"><ul><li class="a"><a href="${inbox}">All standard notices</a></li><li><a href="${inbox}&view=interactive">Social activity</a></li></ul></div><div class="subsub"><a href="${inbox}">All standard notices</a></div><div class="nts"><dl class="cl" notice="73" id="pendingFriend_19"><dt><a class="d b" href="home.php?mod=spacecp&ac=common&op=ignore&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">Ignore</a><span class="xg1 xw0"><span title="2026-10-20 21:40:00">just now</span></span></dt><dd class="ntc_body"><p>A complete authored friend request.</p><a href="home.php?mod=spacecp&ac=friend&op=add&uid=19&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">Accept friend request</a></dd></dl></div></div>`,
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByText("A complete authored friend request.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#notice-73")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Notice categories", exact: true })
      .getByRole("link", { name: "All standard notices", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page
      .getByRole("navigation", { name: "Notice pages", exact: true })
      .getByRole("link"),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "The returned unread indicator could not be interpreted. The current unread count is unknown.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).not.toContain("SYNTHETIC_PUBLIC_FORM_TOKEN");
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "returned-native-control-shapes");
});

test("J10.notices-full-definition-body: a rich definition list remains complete notice content rather than becoming another inbox row", async ({
  page,
}, info) => {
  const server = await open(page, (url) =>
    notices(url).replace(
      `<p>${completeTail}</p>`,
      `<dl><dt>Authored definition</dt><dd>Complete definition body.</dd></dl><p>${completeTail}</p>`,
    ),
  );
  await overview(page);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  await expect(
    page.getByText("Authored definition", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Complete definition body.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(completeTail, { exact: true })).toBeVisible();
  await expect(page.locator("[data-notice-id]")).toHaveCount(1);
  expect(server.effects()).toBe(1);
  await artifact(page, info, server.ledger, "full-definition-body");
});

test("J10.notices-responsive-categories: returned categories occupy the desktop secondary pane, medium picker and narrow list without hidden reads", async ({
  page,
}, info) => {
  const server = await open(page);
  await overview(page);
  expect(server.effects()).toBe(0);
  await page.getByRole("button", { name: "Load notices", exact: true }).click();
  const categoryNavigation = page.getByRole("navigation", {
    name: "Notice categories",
    exact: true,
  });
  await expect(categoryNavigation).toHaveClass(/boards-navigation/);
  const mentions = categoryNavigation.getByRole("link", {
    name: "Mentions",
    exact: true,
  });
  await mentions.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Mentions page 1: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(2);
  await page.setViewportSize({ width: 1000, height: 900 });
  await page
    .getByRole("combobox", { name: "Notice categories", exact: true })
    .selectOption(`${inbox}&view=system`);
  await expect(
    page.getByText("System notices page 1: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(3);
  await page.setViewportSize({ width: 390, height: 900 });
  await categoryNavigation
    .getByRole("link", { name: "Social activity", exact: true })
    .click();
  await expect(
    page.getByText("Social activity page 1: full notice introduction.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(server.effects()).toBe(4);
  await artifact(page, info, server.ledger, "responsive-notice-categories");
});
