import { confirmThreadPage, openThreadPages } from "./navigation-ui";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const base = `${origin}/forum.php?mod=viewthread&tid=42`;
const route = (number: number) => `${base}&page=${number}&_dsign=returned`;
const ledgers = new WeakMap<Page, string[]>();
function fixture(number: number) {
  const ids =
    number === 1
      ? [101, 102, 103]
      : number === 2
        ? [103, 104, 105]
        : [105, 106, 107];
  const post = (id: number) =>
    `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum${id}" href="${route(number)}#pid${id}">${id - 100}</a><em id="authorposton${id}">2026-11-04</em><div class="pcb"><p>${`Complete post ${id}. `.repeat(100)}</p><blockquote>Quoted attribution ${id}</blockquote></div></div>`;
  return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">Continuous rich history</h1>${ids.map(post).join("")}</div><div class="pg">${number > 1 ? `<a class="prev" href="${route(number - 1)}">&nbsp;&nbsp;</a>` : ""}${[1, 2, 3].map((page) => (page === number ? `<strong>${page}</strong>` : `<a href="${route(page)}">${page}</a>`)).join("")}<label><input name="custompage" value="${number}"><span title="共 3 页"> / 3 页</span></label>${number < 3 ? `<a class="nxt" href="${route(number + 1)}">下一页</a>` : ""}</div>`;
}
async function open(
  page: Page,
  response?: (
    number: number,
    url: string,
  ) =>
    | Promise<{
        status?: number;
        body: string;
        contentType?: string;
        headers?: Record<string, string>;
      } | null>
    | {
        status?: number;
        body: string;
        contentType?: string;
        headers?: Record<string, string>;
      }
    | null,
  destination = route(2),
) {
  const requests: string[] = [];
  ledgers.set(page, requests);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (intercept) => {
    const request = intercept.request();
    if (request.url() === `${origin}/__history.js`)
      return intercept.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return intercept.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__history.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    if (new URL(request.url()).origin !== origin)
      return intercept.fulfill({ status: 404, body: "Blocked" });
    const number = Number(
      new URL(request.url()).searchParams.get("page") ?? "1",
    );
    const custom = await response?.(number, request.url());
    return intercept.fulfill(
      custom
        ? { contentType: "text/html; charset=utf-8", ...custom }
        : {
            contentType: "application/json",
            body: JSON.stringify({ document: fixture(number) }),
          },
    );
  });
  await page.goto(destination);
  await expect(
    page.getByRole("heading", { name: "Continuous rich history", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return requests;
}
async function anchor(page: Page) {
  return page.locator("#pid104").evaluate((post) => ({
    top: post.getBoundingClientRect().top,
    scroll: post.closest(".reading-pane")!.scrollTop,
  }));
}
test.afterEach(async ({ page }, info) => {
  if (!ledgers.has(page)) return;
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  if (await page.locator(".reading-pane").count()) {
    await info.attach("history-geometry.json", {
      body: JSON.stringify(
        await page.locator(".reading-pane").evaluate((pane) => ({
          scroll: pane.scrollTop,
          posts: [...pane.querySelectorAll("article")].map((node) => ({
            id: node.id,
            rect: node.getBoundingClientRect().toJSON(),
          })),
        })),
      ),
      contentType: "application/json",
    });
    await info.attach("history.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});
test("IM69.boundaries: entering the 160px edges loads each adjacent page once and keeps manual controls", async ({
  page,
}) => {
  const requests = await open(page, async (number) => {
    if (number !== 2) await new Promise((resolve) => setTimeout(resolve, 200));
    return { body: fixture(number) };
  });
  const pane = page.locator(".reading-pane");
  await pane.evaluate((node) => {
    node.scrollTop = 161;
  });
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(1);
  await pane.evaluate((node) => {
    node.scrollTop = 160;
  });
  await expect(
    page.getByText("Loading history…", { exact: true }),
  ).toBeVisible();
  await pane.evaluate((node) => {
    node.scrollTop = 159;
    node.dispatchEvent(new Event("scroll"));
    node.dispatchEvent(new Event("scroll"));
  });
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await expect(
    page.getByText("Beginning of thread", { exact: true }),
  ).toBeVisible();
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await pane.evaluate((node) => {
    node.scrollTop = node.scrollHeight - node.clientHeight - 160;
  });
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  await expect(
    page.getByText("Latest known content", { exact: true }),
  ).toBeVisible();
  await pane.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
    node.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(250);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "1", "3"]);
  expect(
    await page
      .locator(".reading-pane article")
      .evaluateAll((nodes) => nodes.map((node) => node.id)),
  ).toEqual([
    "pid101",
    "pid102",
    "pid103",
    "pid104",
    "pid105",
    "pid106",
    "pid107",
  ]);
});

test("IM69.modal-pause: a boundary event beneath Settings does not fetch or queue passive work", async ({
  page,
}) => {
  const requests = await open(page);
  await openSettings(page);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".reading-pane").evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(1);
  await closeSettingsToWorkspace(page, "button");
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(1);
});

test("IM69.exact-target: restoring a direct target at the loaded end does not turn into passive pagination", async ({
  page,
}) => {
  const requests = await open(
    page,
    (number) => ({
      body: fixture(number).replace(
        /<p>.*?<\/p>/g,
        "<p>Complete short body</p>",
      ),
    }),
    `${route(2)}#pid105`,
  );
  await expect(page.locator("#pid105")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(1);
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
});

test("IM69.retry: permission failure keeps readable posts and only a deliberate retry requests the boundary again", async ({
  page,
}) => {
  let attempts = 0;
  const requests = await open(page, (number) =>
    number === 3 && ++attempts === 1
      ? {
          status: 403,
          body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="messagetext">权限</div>',
        }
      : null,
  );
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 160;
  });
  await expect(
    page.getByRole("button", { name: "Retry later", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(
    page.getByText(
      "The current account does not have permission to read this thread.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
    pane.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(2);
  await page.getByRole("button", { name: "Retry later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "3", "3"]);
});

test("IM69.stale-navigation: a delayed adjacent page cannot replace an explicit page selection or overlap history loads", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(page, async (number) => {
    if (number === 3) {
      started?.();
      await held;
    }
    return null;
  });
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 160;
  });
  await incoming;
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load earlier",
      exact: true,
    }),
  ).toBeDisabled();
  await confirmThreadPage(page, 1);
  await expect(page.locator("#pid101")).toBeVisible();
  release?.();
  await expect(page.locator("#pid107")).toHaveCount(0);
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "3", "1"]);
});

test("IM69.preparation-priority: a delayed history result never interrupts deliberate reply preparation or changes retained writing", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const requests = await open(page, async (number, value) => {
    const url = new URL(value);
    if (url.searchParams.get("mod") === "post")
      return {
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="replysubmit" value="yes">Reply</button></form>',
      };
    if (number === 3) {
      started?.();
      await held;
    }
    return {
      body:
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
        fixture(number),
    };
  });
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 160;
  });
  await incoming;
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Retained complete reply [quote]authored[/quote]");
  release?.();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Retained complete reply [quote]authored[/quote]",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeEnabled();
  expect(requests).toHaveLength(3);
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

test("IM69.reader-moves-during-load: preserve the reader's current anchor when a delayed earlier page arrives", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  await open(page, async (number) => {
    if (number === 1) {
      started?.();
      await held;
    }
    return null;
  });
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = 160;
  });
  await incoming;
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  release?.();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(Math.abs((await anchor(page)).top - before.top)).toBeLessThanOrEqual(
    1,
  );
});

test("IM69.account-change: changed-account page clears the former account range without mixing posts", async ({
  page,
}) => {
  await open(page, (number) =>
    number === 3
      ? {
          body: fixture(3)
            .replace("uid=7", "uid=8")
            .replace("Reader Seven", "Reader Eight"),
        }
      : null,
  );
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 160;
  });
  await expect(page.locator(".reading-pane article")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
});

test("IM69.pane-reflow: presentation restoration beside an unloaded boundary does not fetch", async ({
  page,
}) => {
  const requests = await open(page);
  await openSettings(page);
  await page.locator(".reading-pane").evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.waitForTimeout(100);
  await closeSettingsToWorkspace(page, "button");
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(1);
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
});

test("IM69.late-media: passive prepend retains the reader's moved anchor through delayed intrinsic image sizing", async ({
  page,
}) => {
  let releasePage!: () => void;
  let releaseImage!: () => void;
  let pageStarted!: () => void;
  const pageHeld = new Promise<void>((resolve) => {
    releasePage = resolve;
  });
  const imageHeld = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  const started = new Promise<void>((resolve) => {
    pageStarted = resolve;
  });
  await open(page, async (number, url) => {
    if (url.endsWith("late.png")) {
      await imageHeld;
      return {
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="orange"/></svg>',
      };
    }
    if (number === 1) {
      pageStarted();
      await pageHeld;
    }
    return {
      body: fixture(number).replace(
        '<div class="pcb">',
        '<div class="pcb"><img src="' + origin + '/late.png" alt="Late cover">',
      ),
    };
  });
  await page.locator(".reading-pane").evaluate((node) => {
    node.scrollTop = 160;
  });
  await started;
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  releasePage();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(Math.abs((await anchor(page)).top - before.top)).toBeLessThanOrEqual(
    1,
  );
  releaseImage();
  await expect
    .poll(() =>
      page
        .locator("#pid103 img")
        .evaluate((node) => (node as HTMLImageElement).naturalHeight),
    )
    .toBe(600);
  expect(Math.abs((await anchor(page)).top - before.top)).toBeLessThanOrEqual(
    1,
  );
});

test("IM69.long-rich-range: measure retained complete rich posts through 25 automatic pages without speculative eviction", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  function rich(number: number) {
    const posts = Array.from({ length: 20 }, (_, index) => {
      const id = 1000 + (number - 1) * 19 + index;
      return `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum${id}">${id - 999}</a><div class="pcb"><p>${"完整內容 mixed Latin. ".repeat(90)}</p><blockquote><p>Nested original attribution</p><blockquote>Retained quotation</blockquote></blockquote><pre>${"code_complete(); ".repeat(60)}</pre><table><tr><td>Wide authored table value</td><td>${"Complete cell ".repeat(30)}</td></tr></table><p>${"More complete text. ".repeat(90)}</p><img src="${origin}/rich.png" alt="Authored cover" width="400" height="100"></div></div>`;
    }).join("");
    return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">Continuous rich history</h1>${posts}</div><div class="pg">${number > 1 ? `<a class="prev" href="${route(number - 1)}">Previous</a>` : ""}<strong>${number}</strong><input name="custompage" value="${number}">${number < 25 ? `<a class="nxt" href="${route(number + 1)}">Next</a>` : ""}</div>`;
  }
  const requests = await open(
    page,
    (number, url) =>
      url.endsWith("rich.png")
        ? {
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="navy"/></svg>',
          }
        : { body: rich(number) },
    route(1),
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const samples: unknown[] = [];
  async function sample(pages: number, elapsedMs: number) {
    await cdp.send("HeapProfiler.collectGarbage");
    const metrics = await cdp.send("Performance.getMetrics");
    const dom = await page.locator(".reading-pane").evaluate((pane) => ({
      posts: pane.querySelectorAll("article").length,
      elements: pane.querySelectorAll("*").length,
      textCharacters: pane.textContent?.length,
      scrollHeight: pane.scrollHeight,
      tables: pane.querySelectorAll("table").length,
      codeBlocks: pane.querySelectorAll("pre").length,
      images: pane.querySelectorAll("img").length,
    }));
    samples.push({
      pages,
      elapsedMs,
      ...dom,
      metrics: metrics.metrics.filter((metric) =>
        [
          "JSHeapUsedSize",
          "JSHeapTotalSize",
          "Nodes",
          "LayoutDuration",
          "RecalcStyleDuration",
        ].includes(metric.name),
      ),
    });
  }
  await sample(1, 0);
  const elapsed: number[] = [];
  for (let number = 2; number <= 25; number++) {
    const start = Date.now();
    await page.locator(".reading-pane").evaluate((pane) => {
      pane.scrollTop = pane.scrollHeight - pane.clientHeight - 120;
    });
    await expect(page.locator(".reading-pane article")).toHaveCount(
      20 + (number - 1) * 19,
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    elapsed.push(Date.now() - start);
    if ([5, 10, 25].includes(number)) await sample(number, elapsed.at(-1)!);
  }
  await expect(page.locator("#pid1000")).toHaveCount(1);
  await expect(page.locator("#pid1475")).toHaveCount(1);
  await expect(page.locator(".reading-pane img")).toHaveCount(476);
  expect(
    requests.filter(
      (request) =>
        new URL(request.slice(4)).searchParams.get("mod") === "viewthread",
    ),
  ).toHaveLength(25);
  await info.attach("rich-range-resources.json", {
    body: JSON.stringify(
      {
        scope:
          "Authored Edge fixture, 25 pages, 476 complete posts; CDP heap samples after GC, not a production capacity limit",
        samples,
        pageCompletionMs: elapsed,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

test("IM69.search-priority: delayed passive completion cannot replace a deliberate search form", async ({
  page,
}) => {
  const account =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
  const form = `${account}<form class="searchform" method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="searchsubmit" value="yes"><input type="hidden" name="seltableid" value="0"><table><tr><th><label for="keywords">Keywords</label></th><td><input id="keywords" name="srchtxt" type="text" maxlength="40"></td></tr><tr><th><label for="author">Author</label></th><td><input id="author" name="srchuname" type="text" maxlength="40"></td></tr><tr><th>Time range</th><td><select name="srchfrom"><option value="0" selected>Any time</option><option value="604800">One week</option><option value="31536000" disabled>One year unavailable</option></select></td></tr><tr><th>Order</th><td><select name="orderby"><option value="lastpost" selected>Last reply</option><option value="dateline">Publication time</option><option value="views">Views</option></select><select name="orderby2" disabled><option value="price">Goods only</option></select></td></tr><tr><th>Direction</th><td><label><input name="ascdesc" type="radio" value="asc">Ascending</label><label><input name="ascdesc" type="radio" value="desc" checked>Descending</label></td></tr><tr><th>Boards</th><td><select name="srchfid[]" multiple><option value="all" selected>All boards</option><option value="5">Music discussion</option><option value="8" disabled>Restricted board</option></select></td></tr></table><p class="search-restrictions">Search may use forum credits and is subject to frequency limits.</p><button type="submit">Search</button></form>`;
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const requests = await open(page, async (number, url) => {
    if (new URL(url).pathname === "/search.php") return { body: form };
    if (number === 3) {
      started();
      await held;
    }
    return { body: fixture(number) };
  });
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
  });
  await incoming;
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByLabel("Keywords", { exact: true })
    .fill("Deliberate criteria");
  release();
  await page.waitForTimeout(100);
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "Deliberate criteria",
  );
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(page.locator("#pid107")).toHaveCount(0);
  expect(requests).toHaveLength(3);
  expect(new URL(requests[2]!.slice(4)).pathname).toBe("/search.php");
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

test("IM69.preparing-blocks-passive: a pending current form keeps priority when reading reaches an unloaded edge", async ({
  page,
}) => {
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const requests = await open(page, async (number, url) => {
    if (new URL(url).searchParams.get("mod") === "post") {
      started();
      await held;
      return {
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>',
      };
    }
    return {
      body:
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
        fixture(number),
    };
  });
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await incoming;
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
  });
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(2);
  release();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Retained reply after form check");
  await page.waitForTimeout(100);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Retained reply after form check",
  );
  expect(requests).toHaveLength(2);
});

test("IM69.near-both-edges: a known beginning does not mask the unloaded later edge in a short range", async ({
  page,
}) => {
  const requests = await open(
    page,
    (number) => ({
      body: fixture(number).replace(
        /<p>.*?<\/p>/g,
        "<p>Short complete post</p>",
      ),
    }),
    route(1),
  );
  const pane = page.locator(".reading-pane");
  const extraHeight = await pane.evaluate(
    (node) => node.scrollHeight - node.clientHeight - 200,
  );
  await page.setViewportSize({ width: 1280, height: 900 + extraHeight });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await pane.evaluate((node) => {
    node.scrollTop = 100;
  });
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["1", "2"]);
});

for (const paneName of ["Boards pane", "Threads pane"] as const) {
  test(`IM69.drawer-pause-${paneName}: covered or hidden reader scroll and return do not trigger background history`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await open(page);
    await page.getByRole("button", { name: paneName, exact: true }).click();
    if (paneName === "Boards pane")
      await expect(page.getByRole("dialog")).toBeVisible();
    else await expect(page.locator(".reading-pane")).toBeHidden();
    await page.locator(".reading-pane").evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await page.waitForTimeout(250);
    expect(requests).toHaveLength(1);
    await page
      .getByRole("button", {
        name: paneName === "Boards pane" ? "Close" : "Threads pane",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".reading-pane")).toBeVisible();
    await page.waitForTimeout(250);
    expect(requests).toHaveLength(1);
    await page.locator(".reading-pane").evaluate((node, paneName) => {
      node.scrollTop =
        paneName === "Boards pane"
          ? node.scrollTop - 1
          : node.scrollHeight - node.clientHeight - 1;
    }, paneName);
    await expect(page.locator(".reading-pane article")).toHaveCount(5);
    expect(
      requests.map((request) =>
        new URL(request.slice(4)).searchParams.get("page"),
      ),
    ).toEqual(["2", "3"]);
  });
}
