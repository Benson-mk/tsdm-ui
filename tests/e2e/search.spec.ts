import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
const origin = "https://www.tsdm39.com";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const directory = `${account}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const form = `${account}<form class="searchform" method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="private-token"><input type="hidden" name="searchsubmit" value="yes"><input type="hidden" name="seltableid" value="0"><table><tr><th><label for="keywords">Keywords</label></th><td><input id="keywords" name="srchtxt" type="text" maxlength="40"></td></tr><tr><th><label for="author">Author</label></th><td><input id="author" name="srchuname" type="text" maxlength="40"></td></tr><tr><th>Time range</th><td><select name="srchfrom"><option value="0" selected>Any time</option><option value="604800">One week</option><option value="31536000" disabled>One year unavailable</option></select></td></tr><tr><th>Order</th><td><select name="orderby"><option value="lastpost" selected>Last reply</option><option value="dateline">Publication time</option><option value="views">Views</option></select><select name="orderby2" disabled><option value="price">Goods only</option></select></td></tr><tr><th>Direction</th><td><label><input name="ascdesc" type="radio" value="asc">Ascending</label><label><input name="ascdesc" type="radio" value="desc" checked>Descending</label></td></tr><tr><th>Boards</th><td><select name="srchfid[]" multiple><option value="all" selected>All boards</option><option value="5">Music discussion</option><option value="8" disabled>Restricted board</option></select></td></tr></table><p class="search-restrictions">Search may use forum credits and is subject to frequency limits.</p><button type="submit">Search</button></form>`;
async function open(
  page: Page,
  destination = `${origin}/forum.php`,
  supplied?: (
    url: URL,
    method: string,
  ) =>
    | string
    | { body: string; contentType?: string; status?: number; abort?: boolean }
    | Promise<
        | string
        | {
            body: string;
            contentType?: string;
            status?: number;
            abort?: boolean;
          }
      >,
) {
  const requests: { url: string; method: string; body: string | null }[] = [];
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
    requests.push({
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    });
    const suppliedResponse = supplied
      ? await supplied(new URL(request.url()), request.method())
      : new URL(request.url()).pathname === "/search.php"
        ? form
        : directory;
    if (typeof suppliedResponse !== "string") {
      if (suppliedResponse.abort) return route.abort();
      return route.fulfill({
        status: suppliedResponse.status ?? 200,
        contentType: suppliedResponse.contentType ?? "text/html",
        body: suppliedResponse.body,
      });
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: suppliedResponse }),
    });
  });
  await page.goto(destination);
  return requests;
}
test("J3.search-overview: current controls are distinct from deliberate search and editing sends no query", async ({
  page,
}, info) => {
  const requests = await open(page);
  await openSearch(page);
  await expect(
    page.getByRole("heading", { name: "Search", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveAttribute(
    "maxlength",
    "40",
  );
  await expect(page.getByLabel("Boards", { exact: true })).toHaveAttribute(
    "multiple",
    "",
  );
  await expect(
    page
      .getByLabel("Time range", { exact: true })
      .locator('option[value="31536000"]'),
  ).toHaveJSProperty("disabled", true);
  await expect(
    page.getByText(
      "Search may use forum credits and is subject to frequency limits.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.getByLabel("Author", { exact: true }).fill("Composer Nine");
  await page.getByLabel("Order", { exact: true }).selectOption("views");
  expect(requests.filter((r) => r.url.includes("search.php"))).toEqual([
    {
      url: `${origin}/search.php?mod=forum&adv=yes&tsdmapp=json`,
      method: "GET",
      body: null,
    },
  ]);
  expect(page.url()).toMatch(
    /^https:\/\/www\.tsdm39\.com\/forum\.php#workspace=/,
  );
  await page.reload();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  expect(requests).toHaveLength(2);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).not.toContain("private-token");
  await info.attach("search-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

const resultURL = `${origin}/search.php?mod=forum&searchid=581&orderby=views&ascdesc=desc&searchsubmit=yes&kw=autumn`;
function results(page = 1) {
  return `${account}<div class="sttl"><h2><em>找到 “autumn” 相关内容 21 个</em></h2><a href="search.php?mod=forum&adv=yes&searchid=581">Advanced search</a></div><div id="threadlist" class="slst mtw"><ul><li class="pbw"><h3 class="xs3"><a href="forum.php?mod=viewthread&tid=42&highlight=autumn">Autumn ${page} listening</a></h3><p class="xg1">5 replies · 80 views</p><p>Complete result excerpt.</p><p><span>2026-10-18</span><span><a href="home.php?mod=space&uid=9">Composer Nine</a></span><span><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></span></p></li></ul></div><div class="pg"><strong>${page}</strong><a href="${resultURL}&page=${page === 1 ? 2 : 1}">${page === 1 ? 2 : 1}</a></div>`;
}
test("J3.search-submit: explicit POST binds effective criteria while later edits remain unsent", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.getByLabel("Author", { exact: true }).fill("Composer Nine");
  await page.getByLabel("Boards", { exact: true }).selectOption("5");
  await page.getByLabel("Order", { exact: true }).selectOption("views");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Search results", exact: true }),
  ).toBeInViewport();
  const posts = requests.filter((r) => r.method === "POST");
  expect(posts).toHaveLength(1);
  expect(posts[0]!.url).toBe(`${origin}/search.php?mod=forum&tsdmapp=json`);
  expect([...new URLSearchParams(posts[0]!.body!)]).toEqual([
    ["formhash", "private-token"],
    ["searchsubmit", "yes"],
    ["seltableid", "0"],
    ["srchtxt", "autumn"],
    ["srchuname", "Composer Nine"],
    ["srchfrom", "0"],
    ["orderby", "views"],
    ["ascdesc", "desc"],
    ["srchfid[]", "5"],
  ]);
  await page.getByLabel("Keywords", { exact: true }).fill("winter");
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Keywords: autumn");
  await expect(
    page.getByText("Edited criteria have not been searched.", { exact: true }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).not.toContain("private-token");
  await info.attach("search-edited-effective.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
const thread = `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Autumn listening</h1><div id="post_101"><a id="postnum101">1</a><div class="pcb"><p>Complete autumn opening.</p></div></div></div>`;
test("J3.search-pages-return: returned identity pages and edited criteria survive target Back Forward and reload without searches", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? url.searchParams.get("mod") === "viewthread"
        ? thread
        : directory
      : method === "POST" || url.searchParams.has("searchid")
        ? results(Number(url.searchParams.get("page") ?? 1))
        : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page.getByLabel("Keywords", { exact: true }).fill("winter");
  await page
    .getByRole("navigation", { name: "Search pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "winter",
  );
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Keywords: autumn");
  expect(requests.filter((r) => r.url.includes("searchid=581"))).toHaveLength(
    1,
  );
  expect(requests.at(-1)!.url).toBe(`${resultURL}&page=2&tsdmapp=json`);
  await page
    .getByRole("link", { name: "Autumn 2 listening", exact: true })
    .click();
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  const before = requests.length;
  await page.goBack();
  await expect(
    page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "winter",
  );
  await page.reload();
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Keywords: autumn");
  await page.goForward();
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  expect(requests).toHaveLength(before);
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  const post = requests.filter((r) => r.method === "POST").at(-1)!;
  expect(new URLSearchParams(post.body!).get("srchtxt")).toBe("winter");
  expect(new URLSearchParams(post.body!).has("page")).toBe(false);
  expect(new URLSearchParams(post.body!).has("searchid")).toBe(false);
  await info.attach("search-returned-page.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

const zero = `${account}<div class="sttl"><h2><em>找到 “autumn” 相关内容 0 个</em></h2><a href="search.php?mod=forum&adv=yes&searchid=581">Advanced search</a></div><div class="mw"><div class="tl"><p class="emp xs2 xg2">对不起，没有找到匹配结果。</p></div></div>`;
for (const scenario of [
  { name: "zero", body: zero, expected: "No matching threads." },
  {
    name: "cost",
    body: `${account}<div id="messagetext">您的天使币不足，搜索需要花费 2 天使币</div>`,
    expected: "Search cost restriction:",
  },
  {
    name: "throttle",
    body: `${account}<div id="messagetext">对不起，您在 60 秒内只能进行一次搜索</div>`,
    expected: "Search frequency restriction:",
  },
  {
    name: "permission",
    body: `${account}<div id="messagetext">您所在的用户组没有权限搜索</div>`,
    expected: "Search permission denied:",
  },
  {
    name: "login",
    body: `<form id="loginform"></form><div id="messagetext">请先登录后搜索</div>`,
    expected:
      "Sign in through the native forum before another deliberate search.",
  },
  {
    name: "challenge",
    body: `<title>Just a moment</title><form id="challenge-form"></form>`,
    expected:
      "Native verification is required before another deliberate search.",
  },
  {
    name: "malformed",
    body: `${account}<div id="threadlist"><li class="pbw">Incomplete row</li></div>`,
    expected: "The forum did not return a usable search identity.",
  },
  {
    name: "empty-envelope",
    body: '{"ok":true}',
    contentType: "application/json",
    expected: "The search result could not be displayed reliably.",
  },
  {
    name: "network",
    body: "",
    abort: true,
    expected: "Search could not be completed.",
  },
])
  test(`J3.search-outcomes-${scenario.name}: one deliberate search preserves criteria and never retries representation`, async ({
    page,
  }, info) => {
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? directory
        : method === "POST"
          ? scenario
          : form,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page
      .getByRole("region", { name: "Search overview", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect(
      page.getByText(scenario.expected, { exact: false }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
      "autumn",
    );
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    expect(requests.filter((r) => r.url.includes("search.php"))).toHaveLength(
      3,
    );
    await info.attach(`search-${scenario.name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
test("J3.search-expiry: expired returned page keeps effective criteria and explicit rerun starts a new search", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : url.searchParams.has("searchid")
          ? `${account}<div id="messagetext">搜索结果已过期，请重新搜索</div>`
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page.getByLabel("Keywords", { exact: true }).fill("winter");
  await page
    .getByRole("navigation", { name: "Search pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByText(
      "Search results expired. Your criteria are retained; rerun explicitly if you accept possible credits or quota use.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "winter",
  );
  await page
    .getByRole("button", {
      name: "Rerun effective search (may use credits)",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Previous results are stale.", { exact: true }),
  ).toHaveCount(0);
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(2);
  expect(
    new URLSearchParams(
      requests.filter((r) => r.method === "POST")[1]!.body!,
    ).get("srchtxt"),
  ).toBe("autumn");
  await info.attach("search-expiry-rerun.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.search-session: identity changes before submission stop the effect and changes during submission hide prior results", async ({
  page,
}, info) => {
  let changed = false,
    during = false;
  const other = (source: string) =>
    source.replaceAll('uid=7">Reader Seven', 'uid=8">Reader Eight');
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? during
          ? other(results())
          : results()
        : changed
          ? other(form)
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  changed = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText("The account changed while preparing search.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  changed = false;
  await page
    .getByRole("link", { name: "New search", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  during = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText(
      "The account changed during search. Its effects are not isolated; review the current account before another deliberate search.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toHaveCount(0);
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("search-session-change.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
for (const destination of [
  resultURL,
  `${origin}/search.php?mod=forum&srchtxt=autumn&searchsubmit=yes`,
])
  test(`J3.search-native-arrival-${destination.includes("searchid") ? "result" : "submission"}: explain pre-startup effects without another request`, async ({
    page,
  }, info) => {
    const requests = await open(page, destination);
    await expect(
      page.getByText(
        "This native search request may have used credits or quota before the workspace started. No search has been repeated. Open Search to prepare a deliberate new search.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(requests).toHaveLength(0);
    expect(page.url()).toMatch(
      /^https:\/\/www\.tsdm39\.com\/forum\.php#workspace=/,
    );
    await page.reload();
    await expect(
      page.getByText(
        "This native search request may have used credits or quota before the workspace started.",
        { exact: false },
      ),
    ).toBeVisible();
    expect(requests).toHaveLength(0);
    await openSearch(page);
    await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]!.method).toBe("GET");
    expect(requests[0]!.url).toContain("adv=yes");
    await info.attach("search-native-arrival.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
test("J3.search-current-form: changed restrictions and unknown identity prevent submission while criteria stay editable", async ({
  page,
}, info) => {
  let restricted = false,
    unknown = false;
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : unknown
          ? form.replace(account, "")
          : restricted
            ? form.replace('value="views"', 'value="views" disabled')
            : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.getByLabel("Order", { exact: true }).selectOption("views");
  restricted = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText("The current Order restriction does not allow this value.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  unknown = true;
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText(
      "The current account could not be established. Search has not been submitted.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await info.attach("search-current-form.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J3.search-redirect: real search POST redirect and exact-post document remount preserve passive search return", async ({
  browser,
}, info) => {
  const searchRequests: { url: string; method: string; body: string }[] = [];
  const exact = `${origin}/forum.php?mod=viewthread&tid=42&page=2#pid202`;
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: exact,
      search: { resultURL, requests: searchRequests },
      document: (url) =>
        url.pathname === "/search.php"
          ? url.searchParams.has("searchid")
            ? results(Number(url.searchParams.get("page") ?? 1))
            : form
          : url.searchParams.get("mod") === "viewthread"
            ? url.searchParams.get("page") === "2"
              ? thread
                  .replaceAll("post_101", "post_202")
                  .replaceAll("postnum101", "postnum202")
                  .replace("Complete autumn opening.", "Exact returned reply.")
              : thread.replace(
                  "Complete autumn opening.",
                  `Complete autumn opening. <a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=202">Read exact reply</a>`,
                )
            : directory,
    },
    async (page, reads, redirects) => {
      await page.goto(`${origin}/forum.php`);
      await openSearch(page);
      await page.getByLabel("Keywords", { exact: true }).fill("autumn");
      await page
        .getByRole("region", { name: "Search overview", exact: true })
        .getByRole("button", { name: "Search", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
      ).toBeVisible();
      expect(searchRequests.filter((r) => r.method === "POST")).toHaveLength(1);
      await page.getByLabel("Keywords", { exact: true }).fill("winter");
      await page
        .getByRole("link", { name: "Autumn 1 listening", exact: true })
        .click();
      await page
        .getByRole("link", { name: "Read exact reply", exact: true })
        .click();
      await expect(
        page.getByRole("article", { name: "Post 202", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      await expect(
        page
          .getByRole("navigation", { name: "Main destinations", exact: true })
          .getByRole("button", { name: "Search", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page.getByRole("region", { name: "Search results", exact: true }),
      ).toBeVisible();
      expect(redirects).toEqual(["fetch", "document"]);
      const beforePage = searchRequests.length;
      await page
        .getByRole("navigation", { name: "Search pages", exact: true })
        .getByRole("link", { name: "2", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
        "winter",
      );
      await expect(
        page.getByRole("list", {
          name: "Effective search criteria",
          exact: true,
        }),
      ).toContainText("Keywords: autumn");
      expect(
        searchRequests
          .slice(beforePage)
          .map(({ url, method }) => ({ url, method })),
      ).toEqual([{ url: `${resultURL}&page=2&tsdmapp=json`, method: "GET" }]);
      expect(searchRequests.filter((r) => r.method === "POST")).toHaveLength(1);
      const before = searchRequests.length;
      await page.goBack();
      await expect(
        page.getByRole("article", { name: "Post 202", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      await page.goBack();
      await expect(
        page.getByText("Complete autumn opening.", { exact: false }),
      ).toBeVisible();
      await page.goBack();
      await expect(
        page.getByRole("list", {
          name: "Effective search criteria",
          exact: true,
        }),
      ).toContainText("Keywords: autumn");
      await page.reload();
      await expect(
        page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
      ).toHaveAttribute("aria-current", "true");
      expect(searchRequests).toHaveLength(before);
      await page.goForward();
      await page.goForward();
      await expect(
        page.getByRole("article", { name: "Post 202", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      expect(searchRequests).toHaveLength(before);
      await info.attach("search-exact-remount-effects.json", {
        body: JSON.stringify(searchRequests),
        contentType: "application/json",
      });
      await info.attach("search-exact-remount.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    },
  );
});
test("J3.search-native-controls: unchecked defaults hidden index and disabled duplicate sort preserve native successful controls", async ({
  page,
}, info) => {
  const nativeForm = form
    .replace(
      '<input type="hidden" name="seltableid" value="0">',
      '<select name="seltableid" style="display:none"><option value="0" selected>post_0</option><option value="1">post_1</option></select>',
    )
    .replace('name="orderby2" disabled', 'name="orderby" disabled')
    .replace('value="desc" checked', 'value="desc"');
  const returned = results().replace(
    "adv=yes&searchid=581",
    "adv=yes&searchid=581&orderby=lastpost&ascdesc=desc",
  );
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? returned
        : nativeForm,
  );
  await openSearch(page);
  await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Search index", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Order", { exact: true })).toHaveCount(1);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Direction: Descending");
  await expect(
    page.getByText("Edited criteria have not been searched.", { exact: true }),
  ).toHaveCount(0);
  const posted = new URLSearchParams(
    requests.find((r) => r.method === "POST")!.body!,
  );
  expect(posted.getAll("orderby")).toEqual(["lastpost"]);
  expect(posted.get("seltableid")).toBe("0");
  expect(posted.has("ascdesc")).toBe(false);
  await info.attach("search-native-defaults.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J3.search-missing-snapshot: independent safe-history arrival explains deliberate recovery and never searches", async ({
  page,
  context,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  const before = requests.length;
  const independent = await context.newPage();
  await independent.goto(page.url());
  await expect(
    independent.getByText("This navigation snapshot is unavailable.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    independent.getByText(
      "Searches are never rerun automatically. Open Search to submit again deliberately; a new search may use credits or quota.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests).toHaveLength(before);
  await independent
    .getByRole("button", { name: "Reload", exact: true })
    .click();
  await expect(
    independent.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("search-missing-snapshot.png", {
    body: await independent.screenshot(),
    contentType: "image/png",
  });
});
test("J3.search-section-layout: Search has its own overview and remains reachable on narrow screens", async ({
  page,
}, info) => {
  const board = `${account}<div id="ct"><h1>Music discussion</h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Old board result</a></th><td class="by"><cite>Composer Nine</cite><em>2026-10-18</em></td></tr></tbody></table>`;
  await open(
    page,
    `${origin}/forum.php?mod=forumdisplay&fid=5`,
    (url, method) =>
      url.pathname === "/search.php"
        ? method === "POST"
          ? results()
          : form
        : url.searchParams.get("mod") === "forumdisplay"
          ? board
          : directory,
  );
  await expect(
    page.getByRole("link", { name: "Old board result", exact: true }),
  ).toBeVisible();
  await openSearch(page);
  await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Thread results", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("link", { name: "All boards", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await openSearch(page);
  await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
  expect(
    await page
      .locator("#tsdm-workspace")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await info.attach("search-narrow-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J3.search-form-integrity: missing token or ambiguous active controls block a POST without losing input", async ({
  page,
}, info) => {
  let mode = "normal";
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : mode === "token"
          ? form.replace(
              '<input type="hidden" name="formhash" value="private-token">',
              "",
            )
          : mode === "duplicate"
            ? form.replace(
                '<select name="orderby2" disabled>',
                '<select name="orderby"><option value="lastpost">Last reply</option>',
              )
            : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  mode = "token";
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText("The current advanced search form is unavailable.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  mode = "duplicate";
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText("The current advanced search form is unavailable.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await info.attach("search-unavailable-form.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.search-envelope-identity: numeric envelope UID supports headerless form and same UID with a different result display name", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? {
            body: results().replaceAll("Reader Seven", "Updated Reader Seven"),
            contentType: "text/html",
          }
        : {
            body: JSON.stringify({
              uid: 7,
              head: "<title>Search</title>",
              document: form.replace(account, ""),
            }),
            contentType: "application/json",
          },
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("search-envelope-identity.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.search-contradictory-identity: conflicting header and JSON UID blocks an effectful submission", async ({
  page,
}, info) => {
  let conflict = false;
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : conflict
          ? {
              body: JSON.stringify({ uid: 8, document: form }),
              contentType: "application/json",
            }
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  conflict = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText(
      "The current account could not be established. Search has not been submitted.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await info.attach("search-identity-conflict.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.search-page-account: a returned page under a different actor cannot replace the saved search results", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : url.searchParams.has("searchid")
          ? results(2).replaceAll('uid=7">Reader Seven', 'uid=8">Reader Eight')
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Search pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByText(
      "The account changed while reading search results. Review the current account before searching again deliberately.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await page.goBack();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toHaveCount(0);
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("search-page-account-change.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J11.search-page-unknown: a returned page without an established actor preserves uncertainty and never retries", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : url.searchParams.has("searchid")
          ? results(2).replace(account, "")
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Search pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByText(
      "The current account could not be established from this search page. Review the current account before searching again deliberately.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("The account changed while reading search results.", {
      exact: false,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await info.attach("search-page-unknown-account.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.reload();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  expect(
    requests.filter((r) => new URL(r.url).searchParams.has("searchid")),
  ).toHaveLength(1);
  await info.attach("search-page-unknown-passive-reload.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J11.search-pending: repeated submission is suppressed and late completed search cannot replace subsequent navigation", async ({
  page,
}, info) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(
    page,
    `${origin}/forum.php`,
    async (url, method) => {
      if (url.pathname !== "/search.php") return directory;
      if (method !== "POST") return form;
      await pending;
      return results();
    },
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .dblclick({ noWaitAfter: true });
  await expect
    .poll(() => requests.filter((r) => r.method === "POST").length)
    .toBe(1);
  await expect(
    page
      .getByRole("region", { name: "Search overview", exact: true })
      .getByRole("button", { name: "Search", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Boards", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  const completed = page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
  release();
  await completed;
  await expect(
    page.getByRole("heading", { name: "Boards", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toHaveCount(0);
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("search-late-response.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J3.search-readonly: current readonly text remains visible and is preserved as a native successful control", async ({
  page,
}, info) => {
  const readonlyForm = form.replace(
    'id="author" name="srchuname" type="text"',
    'id="author" name="srchuname" type="text" readonly value="Composer Nine"',
  );
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : readonlyForm,
  );
  await openSearch(page);
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue(
    "Composer Nine",
  );
  await expect(page.getByLabel("Author", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  expect(
    new URLSearchParams(requests.find((r) => r.method === "POST")!.body!).get(
      "srchuname",
    ),
  ).toBe("Composer Nine");
  await info.attach("search-readonly-control.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J3.search-new-control: a newly offered default requires form review before any effectful submission", async ({
  page,
}, info) => {
  let newlyOffered = false;
  const changedForm = form.replace(
    "</table>",
    '<tr><th>Time relation</th><td><label><input type="radio" name="before" value="" />Within</label><label><input type="radio" name="before" value="1" checked />Before</label></td></tr></table>',
  );
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : newlyOffered
          ? changedForm
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await expect(
    page.getByRole("group", { name: "Time relation", exact: true }),
  ).toHaveCount(0);
  newlyOffered = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText(
      "Search controls changed. Refresh the form and review your criteria.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests.filter((request) => request.method === "POST")).toHaveLength(
    0,
  );
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Before", exact: true }),
  ).toBeChecked();
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
  ).toBeVisible();
  const posts = requests.filter((request) => request.method === "POST");
  expect(posts).toHaveLength(1);
  expect(new URLSearchParams(posts[0]!.body!).get("before")).toBe("1");
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Time relation: Before");
  await info.attach("search-new-control-reviewed.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
function nativeSearchHTML(
  uid = "7",
  contents = results().replace(account, ""),
  extraHead = "",
) {
  return `<!DOCTYPE html><html><head><title>Search</title><script type="text/javascript">var STYLEID = '42', STATICURL = 'static/', IMGDIR = 'static/image/common', VERHASH = 'fixture', charset = 'utf-8', discuz_uid = '${uid}', cookiepre = 'fixture_', cookiedomain = '', cookiepath = '/', showusercard = '1', attackevasive = '0', disallowfloat = 'newthread|viewvote', creditnotice = '1|Merit|,2|Credits|', defaultstyle = '', REPORTURL = 'Zml4dHVyZQ==', SITEURL = '${origin}/', JSPATH = 'static/js/', CSSPATH = 'data/cache/style_', DYNAMICURL = '', DEFAULTAVATAR = './data/avatar/noavatar.svg';</script>${extraHead}</head><body><div id="toptb"><div class="y"><strong><a href="home.php?mod=space">Fixture Reader</a></strong></div></div>${contents}</body></html>`;
}
test("J11.search-native-bootstrap: JSON form UID and real POST redirect to native HTML identity remain the same actor", async ({
  browser,
}, info) => {
  const searchRequests: { url: string; method: string; body: string }[] = [];
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: `${origin}/forum.php?mod=viewthread&tid=42`,
      search: { resultURL, requests: searchRequests, formUID: 7 },
      document: (url) =>
        url.pathname !== "/search.php"
          ? directory
          : url.searchParams.has("searchid")
            ? nativeSearchHTML()
            : form.replace(account, ""),
    },
    async (page) => {
      await page.goto(`${origin}/forum.php`);
      await openSearch(page);
      await page.getByLabel("Keywords", { exact: true }).fill("autumn");
      await page
        .getByRole("region", { name: "Search overview", exact: true })
        .getByRole("button", { name: "Search", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
      ).toBeVisible();
      expect(
        searchRequests.filter((request) => request.method === "POST"),
      ).toHaveLength(1);
      expect(
        searchRequests.filter((request) =>
          new URL(request.url).searchParams.has("searchid"),
        ),
      ).toHaveLength(1);
      const before = searchRequests.length;
      await page.reload();
      await expect(
        page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
      ).toBeVisible();
      expect(searchRequests).toHaveLength(before);
      await info.attach("search-native-bootstrap.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    },
  );
});
const unknownSearchActor =
  "The current account could not be established from the search response. The request may still have used credits or quota.";
for (const scenario of [
  {
    name: "header-conflict",
    body: nativeSearchHTML(
      "7",
      results().replaceAll('uid=7">Reader Seven', 'uid=8">Reader Eight'),
    ),
    expected: unknownSearchActor,
  },
  {
    name: "ambiguous",
    body: nativeSearchHTML(
      "7",
      results().replace(account, ""),
      "<script>var STYLEID = '42', STATICURL = 'static/', IMGDIR = 'static/image/common', VERHASH = 'fixture', charset = 'utf-8', discuz_uid = '7', SITEURL = 'https://www.tsdm39.com/';</script>",
    ),
    expected: unknownSearchActor,
  },
  {
    name: "body-only",
    body: `<html><head><title>Search</title></head><body>${results().replace(account, "")}<script>var STYLEID = '42', STATICURL = 'static/', IMGDIR = 'static/image/common', VERHASH = 'fixture', charset = 'utf-8', discuz_uid = '7', SITEURL = 'https://www.tsdm39.com/';</script></body></html>`,
    expected: unknownSearchActor,
  },
  {
    name: "invalid",
    body: nativeSearchHTML("not-an-id"),
    expected: unknownSearchActor,
  },
  {
    name: "guest",
    body: nativeSearchHTML("0"),
    expected:
      "Sign in through the native forum before another deliberate search.",
  },
])
  test(`J11.search-native-identity-${scenario.name}: preserve uncertainty or guest outcome without repeating the search`, async ({
    page,
  }, info) => {
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? directory
        : method === "POST"
          ? { body: scenario.body, contentType: "text/html" }
          : form,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page
      .getByRole("region", { name: "Search overview", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect(
      page.getByText(scenario.expected, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
    ).toHaveCount(0);
    expect(
      requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
    expect(
      requests.filter((request) => request.url.includes("search.php")),
    ).toHaveLength(3);
    await info.attach(`search-native-identity-${scenario.name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
test("J11.search-native-envelope-conflict: JSON UID and native head UID disagreement blocks preparation", async ({
  page,
}, info) => {
  let conflict = false;
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname !== "/search.php"
      ? directory
      : method === "POST"
        ? results()
        : conflict
          ? {
              body: JSON.stringify({
                uid: 7,
                document: nativeSearchHTML("8", form.replace(account, "")),
              }),
              contentType: "application/json",
            }
          : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  conflict = true;
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByText(
      "The current account could not be established. Search has not been submitted.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests.filter((request) => request.method === "POST")).toHaveLength(
    0,
  );
  await info.attach("search-native-envelope-conflict.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const width of [1280, 960, 375]) {
  test(`J3.search-integrated-section-${width}: the existing section navigation opens current controls without submitting`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await open(page);
    if (width < 640)
      await page
        .getByRole("combobox", { name: "Main destinations", exact: true })
        .selectOption("search");
    else
      await page
        .getByRole("navigation", { name: "Main destinations", exact: true })
        .getByRole("button", { name: "Search", exact: true })
        .click();
    await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    if (width < 640)
      await expect(
        page.getByRole("combobox", { name: "Main destinations", exact: true }),
      ).toHaveValue("search");
    else
      await expect(
        page
          .getByRole("navigation", { name: "Main destinations", exact: true })
          .getByRole("button", { name: "Search", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    const before = requests.length;
    await page.reload();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
      "autumn",
    );
    expect(requests).toHaveLength(before);
    expect(requests.filter((r) => r.method === "POST")).toEqual([]);
    expect(requests.filter((r) => r.url.includes("search.php"))).toHaveLength(
      1,
    );
    await info.attach("integrated-search-section.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("integrated-section-requests.json", {
      body: Buffer.from(JSON.stringify(requests)),
      contentType: "application/json",
    });
  });
}
async function openSearch(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 640)
    await page
      .getByRole("combobox", { name: "Main destinations", exact: true })
      .selectOption("search");
  else
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
}

test("J3.search-integrated-origin: a result reader and passive history retain the Search section and native target", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname === "/search.php"
      ? method === "POST"
        ? results()
        : form
      : url.searchParams.get("mod") === "viewthread"
        ? thread
        : directory,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Autumn 1 listening", exact: true })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue in native forum", exact: true }),
  ).toHaveAttribute("href", /mod=viewthread.*tid=42/);
  const before = requests.length;
  await page.reload();
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await page.goForward();
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(before);
  await info.attach("integrated-search-reader.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("integrated-reader-requests.json", {
    body: Buffer.from(JSON.stringify(requests)),
    contentType: "application/json",
  });
});

test("J3.search-integrated-legacy-section: a prior token-free Search snapshot restores its section without a request", async ({
  page,
}, info) => {
  const requests = await open(page);
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    for (const entry of Object.values(record.entries) as Record<
      string,
      unknown
    >[])
      delete entry.section;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  const before = requests.length;
  await page.reload();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(requests).toHaveLength(before);
  await info.attach("legacy-search-section.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const [
  language,
  size,
  theme,
  overview,
  submit,
  output,
  effective,
  edited,
  order,
  settings,
  about,
] of [
  [
    "zh-CN",
    70,
    "Mono",
    "搜索总览",
    "搜索",
    "搜索结果",
    "当前有效搜索条件",
    "尚未使用编辑后的条件搜索。",
    "排序依据",
    "设置",
    "关于此工作区",
  ],
  [
    "zh-TW",
    150,
    "Dark",
    "搜尋總覽",
    "搜尋",
    "搜尋結果",
    "目前有效搜尋條件",
    "尚未使用編輯後的條件搜尋。",
    "排序依據",
    "設定",
    "關於此工作區",
  ],
] as const) {
  test(`J3.search-integrated-appearance-${language}: authored controls follow appearance while native text, effective criteria and request count stay exact`, async ({
    page,
  }, info) => {
    const unlabeledAuthor = form.replace(
      '<label for="author">Author</label>',
      "Author",
    );
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? url.searchParams.get("mod") === "viewthread"
          ? thread
          : directory
        : method === "POST"
          ? results()
          : unlabeledAuthor,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page.getByLabel("Author", { exact: true }).fill("Composer Nine");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#text-size").fill(String(size));
    await page.getByRole("radio", { name: theme, exact: true }).check();
    await page.locator("#interface-language").selectOption(language);
    await page.keyboard.press("Escape");
    const search = page.getByRole("region", { name: overview, exact: true });
    await expect(search).toBeVisible();
    await expect(search.getByLabel("Keywords", { exact: true })).toHaveValue(
      "autumn",
    );
    await expect(search.getByLabel("作者", { exact: true })).toHaveValue(
      "Composer Nine",
    );
    await expect(search.getByLabel(order, { exact: true })).toHaveValue(
      "lastpost",
    );
    await expect(
      search.getByText(
        "Search may use forum credits and is subject to frequency limits.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(search.getByText("Ascending", { exact: true })).toBeVisible();
    expect(requests).toHaveLength(2);
    await search.getByRole("button", { name: submit, exact: true }).click();
    await expect(
      search.getByRole("heading", { name: output, exact: true }),
    ).toBeInViewport();
    await expect(
      search.getByText("找到 “autumn” 相关内容 21 个", { exact: true }),
    ).toBeVisible();
    await search.getByLabel("Keywords", { exact: true }).fill("winter");
    await expect(
      search.getByRole("list", { name: effective, exact: true }),
    ).toContainText("Keywords: autumn");
    await expect(
      search.getByRole("list", { name: effective, exact: true }),
    ).toContainText("作者: Composer Nine");
    await expect(
      search.getByRole("list", { name: effective, exact: true }),
    ).toContainText(`${order}: Last reply`);
    await expect(search.getByText(edited, { exact: true })).toBeVisible();
    const before = requests.length;
    await page.setViewportSize({ width: 375, height: 900 });
    const geometry = await search.evaluate((section) => {
      const field = section.querySelector<HTMLInputElement>(
        ".search-field input",
      )!;
      const style = getComputedStyle(field);
      return {
        width: section.getBoundingClientRect().width,
        scrollWidth: section.scrollWidth,
        clientWidth: section.clientWidth,
        fieldHeight: field.getBoundingClientRect().height,
        choiceHeight: section
          .querySelector("fieldset label")!
          .getBoundingClientRect().height,
        fieldBackground: style.backgroundColor,
        fieldColor: style.color,
        surface: getComputedStyle(section).getPropertyValue("--surface").trim(),
        ink: getComputedStyle(section).getPropertyValue("--ink").trim(),
      };
    });
    expect(geometry.fieldHeight).toBeGreaterThanOrEqual(48);
    expect(geometry.choiceHeight).toBeGreaterThanOrEqual(44);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.fieldBackground).toBe(
      theme === "Mono" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
    );
    expect(geometry.fieldColor).toBe(
      theme === "Mono" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
    );
    await page.getByRole("button", { name: settings, exact: true }).click();
    await page.locator("#text-size").fill("100");
    await page.keyboard.press("Escape");
    await expect(search.getByLabel("Keywords", { exact: true })).toHaveValue(
      "winter",
    );
    await page.getByRole("button", { name: about, exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("0.4.0");
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(search.getByLabel("Keywords", { exact: true })).toHaveValue(
      "winter",
    );
    await expect(search.getByText(edited, { exact: true })).toBeVisible();
    expect(requests).toHaveLength(before);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    await info.attach("localized-search.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("localized-search-effects.json", {
      body: JSON.stringify({ requests, geometry }, null, 2),
      contentType: "application/json",
    });
  });
}

for (const scenario of [
  {
    name: "native-permission",
    status: 403,
    body: `${account}<div id="messagetext">The current account cannot search.</div>`,
    message: "搜索权限不足：The current account cannot search.",
  },
  {
    name: "authored-permission",
    status: 403,
    body: account,
    message: "搜索权限不足：当前账号无法搜索。",
  },
  {
    name: "authored-throttle",
    status: 429,
    body: account,
    message: "搜索频率限制：论坛正在限制请求。请稍后主动重试。",
  },
  {
    name: "native-cost",
    status: 200,
    body: `${account}<div id="messagetext">Native search costs 9 credits.</div>`,
    message: "搜索积分限制：Native search costs 9 credits.",
  },
  {
    name: "authored-invalid",
    status: 500,
    body: account,
    message: "无法解析搜索响应：收到非预期的 HTTP 响应。",
  },
  {
    name: "network",
    status: 200,
    body: "",
    abort: true,
    message:
      "无法完成搜索。此次搜索可能已经消耗积分或额度。仅在主动选择后再次提交。",
  },
  {
    name: "unknown-account",
    status: 200,
    body: results().replace(account, ""),
    message: "无法从搜索响应确认当前账号。该请求仍可能已经消耗积分或额度。",
  },
  {
    name: "expired",
    status: 200,
    body: `${account}<div id="messagetext">Search results expired.</div>`,
    message:
      "搜索结果已过期。条件已保留；若接受可能消耗积分或额度，请主动重新搜索。",
  },
]) {
  test(`J11.search-integrated-localized-${scenario.name}: localized authored failure preserves native text and never repeats the attempt`, async ({
    page,
  }, info) => {
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? directory
        : method === "POST"
          ? scenario
          : form,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption("zh-CN");
    await page.keyboard.press("Escape");
    await page
      .getByRole("region", { name: "搜索总览", exact: true })
      .getByRole("button", { name: "搜索", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(scenario.message);
    await info.attach("localized-search-failure.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const before = requests.length;
    await page.reload();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
      "autumn",
    );
    expect(requests).toHaveLength(before);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    await info.attach("localized-search-recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("localized-failure-effects.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
}

for (const width of [375, 960, 1279]) {
  test(`J3.search-integrated-narrow-new-${width}: a reduced result overview offers a deliberate fresh form without rerunning`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? directory
        : method === "POST"
          ? results()
          : form,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page
      .getByRole("region", { name: "Search overview", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "New search", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue("");
    await expect(
      page.getByRole("heading", { name: "Search results", exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    expect(requests.filter((r) => r.url.includes("search.php"))).toHaveLength(
      4,
    );
    await info.attach("narrow-new-search.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("new-search-effects.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
}

for (const heldPhase of ["form", "submission"] as const) {
  test(`J3.search-integrated-depart-${heldPhase}: a delayed search response cannot replace a later section or submit again`, async ({
    page,
  }, info) => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests = await open(
      page,
      `${origin}/forum.php`,
      async (url, method) => {
        if (url.pathname !== "/search.php") return directory;
        if (
          (heldPhase === "form" && method === "GET") ||
          (heldPhase === "submission" && method === "POST")
        )
          await held;
        return method === "POST" ? results() : form;
      },
    );
    await openSearch(page);
    if (heldPhase === "submission") {
      await page.getByLabel("Keywords", { exact: true }).fill("autumn");
      await page
        .getByRole("region", { name: "Search overview", exact: true })
        .getByRole("button", { name: "Search", exact: true })
        .click();
      await expect
        .poll(() => requests.filter((r) => r.method === "POST").length)
        .toBe(1);
    } else
      await expect
        .poll(() => requests.filter((r) => r.url.includes("search.php")).length)
        .toBe(1);
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Saved", exact: true })
      .click();
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/search.php" &&
        r.request().method() === (heldPhase === "form" ? "GET" : "POST"),
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
    await expect(
      page.getByRole("region", { name: "Search overview", exact: true }),
    ).toHaveCount(0);
    const before = requests.length;
    await page.goBack();
    await expect(
      page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
    ).toHaveCount(0);
    await page.reload();
    expect(requests).toHaveLength(before);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(
      heldPhase === "form" ? 0 : 1,
    );
    await info.attach("late-search-return.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("late-search-effects.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
}

test("J3.search-integrated-legacy-label: missing provenance preserves stored field wording rather than guessing a translation", async ({
  page,
}, info) => {
  const requests = await open(page);
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-TW");
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    for (const entry of Object.values(record.entries) as {
      result?: { search?: { form: { fields: Record<string, unknown>[] } } };
    }[])
      for (const field of entry.result?.search?.form.fields ?? [])
        delete field.labelFromForum;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  const before = requests.length;
  await page.reload();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "autumn",
  );
  await expect(page.getByLabel("Order", { exact: true })).toHaveValue(
    "lastpost",
  );
  await expect(
    page.getByRole("region", { name: "搜尋總覽", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(before);
  await info.attach("legacy-label-provenance.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J3.search-integrated-restriction: a newly disallowed option names the generated field in the current language without submitting", async ({
  page,
}, info) => {
  let changed = false;
  const requests = await open(page, `${origin}/forum.php`, (url) =>
    url.pathname !== "/search.php"
      ? directory
      : changed
        ? form.replace(
            '<option value="views">Views</option>',
            '<option value="views" disabled>Views</option>',
          )
        : form,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page.getByLabel("Order", { exact: true }).selectOption("views");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-TW");
  await page.keyboard.press("Escape");
  changed = true;
  await page
    .getByRole("region", { name: "搜尋總覽", exact: true })
    .getByRole("button", { name: "搜尋", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText(
    "目前的「排序依據」限制不允許此值。請檢查條件。",
  );
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await info.attach("localized-current-restriction.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("restriction-effects.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});

test("J3.search-integrated-reader-refresh: Refresh thread rereads the selected result without replacing it with a new form or query", async ({
  page,
}, info) => {
  const requests = await open(page, `${origin}/forum.php`, (url, method) =>
    url.pathname === "/search.php"
      ? method === "POST"
        ? results()
        : form
      : url.searchParams.get("mod") === "viewthread"
        ? thread
        : directory,
  );
  await openSearch(page);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Autumn 1 listening", exact: true })
    .click();
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  const before = requests.length;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(before + 1);
  await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Complete autumn opening.", { exact: true }),
  ).toBeVisible();
  expect(requests.at(-1)!.url).toContain("mod=viewthread&tid=42");
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await expect(
    page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await info.attach("search-reader-refreshed.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("reader-refresh-effects.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});

for (const changedAccount of [false, true]) {
  test(`J3.search-secondary-pager-${changedAccount ? "account-change" : "return"}: offered adjacent pages use the retained search identity and account without resubmission`, async ({
    page,
  }, info) => {
    const requests = await open(page, `${origin}/forum.php`, (url, method) =>
      url.pathname !== "/search.php"
        ? url.searchParams.get("mod") === "viewthread"
          ? thread
          : directory
        : method === "POST"
          ? results()
          : url.searchParams.has("searchid")
            ? changedAccount
              ? results(2).replaceAll(
                  'uid=7">Reader Seven',
                  'uid=8">Reader Eight',
                )
              : results(2)
            : form,
    );
    await openSearch(page);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    await page
      .getByRole("region", { name: "Search overview", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Keywords", { exact: true }).fill("winter");
    await page
      .getByRole("link", { name: "Autumn 1 listening", exact: true })
      .click();
    await expect(
      page.getByText("Complete autumn opening.", { exact: true }),
    ).toBeVisible();
    const beforePage = requests.length;
    await page
      .getByRole("navigation", { name: "Search pages", exact: true })
      .getByRole("link", { name: "2", exact: true })
      .click();
    if (changedAccount) {
      await expect(page.getByRole("alert")).toContainText(
        "The account changed while reading search results. Review the current account before searching again deliberately.",
      );
      await expect(
        page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
        "winter",
      );
      await expect(
        page.getByRole("list", {
          name: "Effective search criteria",
          exact: true,
        }),
      ).toContainText("Keywords: autumn");
    }
    expect(requests.slice(beforePage)).toEqual([
      { url: `${resultURL}&page=2&tsdmapp=json`, method: "GET", body: null },
    ]);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    await info.attach("secondary-pager-outcome.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const beforeRecovery = requests.length;
    if (!changedAccount) {
      await page.goBack();
      await expect(
        page.getByText("Complete autumn opening.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Autumn 1 listening", exact: true }),
      ).toHaveAttribute("aria-current", "true");
      await page.goForward();
      await expect(
        page.getByRole("link", { name: "Autumn 2 listening", exact: true }),
      ).toBeVisible();
    }
    await page.reload();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
      "winter",
    );
    expect(requests).toHaveLength(beforeRecovery);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    await info.attach("secondary-pager-recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("secondary-pager-effects.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
}
