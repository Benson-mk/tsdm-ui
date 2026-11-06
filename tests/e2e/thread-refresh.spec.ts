import { openThreadPages, loadThreadRange } from "./navigation-ui";
import { clickThreadTool } from "./navigation-ui";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { readableLines, expectPreservedReadingLine } from "./readable-lines";

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
  if (destination.includes("mod=forumdisplay"))
    await expect(page.locator(".results-pane")).toBeVisible();
  else
    await expect(
      page.getByRole("heading", {
        name: "Continuous rich history",
        exact: true,
      }),
    ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return requests;
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

test("IM71.refresh-range: manual refresh retains earlier pages, counts only new IDs and preserves off-bottom reading", async ({
  page,
}) => {
  let changed = false;
  const requests = await open(
    page,
    (number) => ({
      body:
        number === 3 && changed
          ? fixture(3)
              .replace("Complete post 106.", "Edited same post 106.")
              .replace(
                '</div><div class="pg">',
                '<div id="post_108"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum108">8</a><div class="pcb"><p>Newly arrived complete reply108</p></div></div></div><div class="pg">',
              )
          : fixture(number),
    }),
    route(3),
  );
  await loadThreadRange(page, "earlier");
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  changed = true;
  const visibleBefore = await readableLines(page);
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator(".reading-pane article")).toHaveCount(6);
  await expect(page.locator("#pid106")).toContainText("Edited same post 106.");
  await test.info().attach("refresh-absolute-control-lines.json", {
    body: JSON.stringify({
      before: visibleBefore,
      after: await readableLines(page),
    }),
    contentType: "application/json",
  });
  expectPreservedReadingLine(
    visibleBefore,
    await readableLines(page),
    (text) =>
      text?.replace("Edited same post 106.", "Complete post 106.") ?? null,
  );
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["3", "2", "3", "3"]);
  await page
    .getByRole("button", { name: "New replies (1)", exact: true })
    .click();
  await expect(page.locator("#pid108")).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toHaveCount(0);
});

function arrival(number: number) {
  return fixture(number).replace(
    '</div><div class="pg">',
    `<div id="post_108"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum108">8</a><div class="pcb"><p>${"Newly arrived complete reply108. ".repeat(100)}</p></div></div></div><div class="pg">`,
  );
}
for (const distance of [64, 65]) {
  test(`IM71.follow-${distance}: refresh follows only inside the64px proven-latest threshold`, async ({
    page,
  }) => {
    let changed = false;
    await open(
      page,
      (number) => ({ body: changed ? arrival(number) : fixture(number) }),
      route(3),
    );
    await page.locator(".reading-pane").evaluate((pane, distance) => {
      pane.scrollTop = pane.scrollHeight - pane.clientHeight - distance;
    }, distance);
    changed = true;
    const visibleBefore = await readableLines(page);
    await clickThreadTool(page, "Refresh thread");
    await expect(page.locator("#pid108")).toHaveCount(1);
    const remaining = await page
      .locator(".reading-pane")
      .evaluate(
        (pane) => pane.scrollHeight - pane.clientHeight - pane.scrollTop,
      );
    await test.info().attach("threshold-absolute-control-lines.json", {
      body: JSON.stringify({
        before: visibleBefore,
        after: await readableLines(page),
      }),
      contentType: "application/json",
    });
    if (distance === 64) {
      expect(remaining).toBeLessThan(1);
      await expect(
        page.getByRole("button", { name: "New replies (1)", exact: true }),
      ).toHaveCount(0);
    } else {
      expect(remaining).toBeGreaterThan(100);
      const visibleAfter = await readableLines(page);
      expectPreservedReadingLine(visibleBefore, visibleAfter);
      await expect(
        page.getByRole("button", { name: "New replies (1)", exact: true }),
      ).toBeVisible();
    }
  });
}
test("IM71.intermediate-bottom: a refreshed intermediate page does not follow or invent arrivals from old history", async ({
  page,
}) => {
  let changed = false;
  const requests = await open(page, (number) => ({
    body: changed ? arrival(number) : fixture(number),
  }));
  await openSettings(page);
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 30;
  });
  await page.waitForTimeout(100);
  await closeSettingsToWorkspace(page, "button");
  const visibleBefore = await readableLines(page);
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid108")).toHaveCount(1);
  const visibleAfter = await readableLines(page);
  await test.info().attach("intermediate-lines.json", {
    body: JSON.stringify({ before: visibleBefore, after: visibleAfter }),
    contentType: "application/json",
  });
  expect(visibleAfter.first?.paragraph).toBe(visibleBefore.first?.paragraph);
  expect(visibleAfter.first?.line).toBe(visibleBefore.first?.line);
  expect(
    Math.abs(visibleAfter.first!.offset - visibleBefore.first!.offset),
  ).toBeLessThanOrEqual(1);
  await expect(page.getByRole("button", { name: /New replies/ })).toHaveCount(
    0,
  );
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "2"]);
});

test("IM71.failure-recovery: failed refresh retains content and requires deliberate cooldown recovery without overlap", async ({
  page,
}) => {
  test.setTimeout(150_000);
  let fail = false;
  let release: (() => void) | undefined;
  const requests = await open(
    page,
    async (number) => {
      if (fail) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return { status: 429, body: "Too many requests" };
      }
      return { body: fixture(number) };
    },
    route(3),
  );
  await page
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .check();
  fail = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toBeVisible();
  await clickThreadTool(page, "Refresh thread");
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load earlier",
      exact: true,
    }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  expect(requests).toHaveLength(2);
  release?.();
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await clickThreadTool(page, "Refresh thread");
  await page.waitForTimeout(100);
  expect(requests).toHaveLength(2);
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(2);
  await clickThreadTool(page, "Refresh thread");
  await expect.poll(() => requests.length).toBe(3);
  release?.();
  await expect(
    page.getByText(/Check failed. Retry available in 4 minutes/),
  ).toBeVisible();
});

test("IM71.auto-policy: opt-in checks wait120seconds, pause for visible modal and resume without backlog", async ({
  page,
}) => {
  test.setTimeout(290_000);
  const requests = await open(page, undefined, route(3));
  await expect(page.getByText("Manual refresh", { exact: true })).toBeVisible();
  const toggle = page.getByRole("checkbox", {
    name: "Check every 2 minutes while active",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  expect(requests).toHaveLength(1);
  await openSettings(page);
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(1);
  await closeSettingsToWorkspace(page, "button");
  await expect(
    page.getByText("Checks enabled · every 2 minutes", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(118_000);
  expect(requests).toHaveLength(1);
  await expect.poll(() => requests.length, { timeout: 5000 }).toBe(2);
  await toggle.uncheck();
  await expect(page.getByText("Manual refresh", { exact: true })).toBeVisible();
});

test("IM71.current-position: a reader moving away during a delayed refresh keeps the current anchor", async ({
  page,
}) => {
  let changed = false;
  let release: (() => void) | undefined;
  await open(
    page,
    async (number) => {
      if (changed)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      return { body: changed ? arrival(number) : fixture(number) };
    },
    route(3),
  );
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
  });
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect.poll(() => !!release).toBe(true);
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 20;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((post) => post.getBoundingClientRect().top);
  release?.();
  await expect(page.locator("#pid108")).toHaveCount(1);
  expect(
    await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
});

test("IM71.removed-post: refreshed page replaces its membership while earlier loaded posts remain", async ({
  page,
}) => {
  let changed = false;
  await open(
    page,
    (number) => ({
      body:
        changed && number === 3
          ? fixture(number).replace(/<div id="post_107">.*?<\/div><\/div>/s, "")
          : fixture(number),
    }),
    route(3),
  );
  await loadThreadRange(page, "earlier");
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid107")).toHaveCount(0);
  await expect(page.locator("#pid103")).toHaveCount(1);
  await expect(page.locator("#pid104")).toHaveCount(1);
  await expect(page.locator("#pid105")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /New replies/ })).toHaveCount(
    0,
  );
});

for (const move of [false, true]) {
  test(`IM71.late-arrival-media-${move}: following respects delayed image growth and current user scroll intent`, async ({
    page,
  }) => {
    let changed = false;
    let releaseImage!: () => void;
    const held = new Promise<void>((resolve) => {
      releaseImage = resolve;
    });
    await open(
      page,
      async (number, url) => {
        if (url.endsWith("late.png")) {
          await held;
          return {
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="orange"/></svg>',
          };
        }
        return {
          body: changed
            ? arrival(number).replace(
                "Newly arrived complete reply108.",
                '<img src="https://www.tsdm39.com/late.png" alt="Delayed arrival">',
              )
            : fixture(number),
        };
      },
      route(3),
    );
    await page.locator(".reading-pane").evaluate((pane) => {
      pane.scrollTop = pane.scrollHeight;
    });
    changed = true;
    await clickThreadTool(page, "Refresh thread");
    await expect(page.locator("#pid108")).toHaveCount(1);
    if (move)
      await page.locator(".reading-pane").evaluate((pane) => {
        pane.dispatchEvent(new WheelEvent("wheel"));
        pane.scrollTop -= 300;
      });
    releaseImage();
    await expect
      .poll(() =>
        page
          .getByAltText("Delayed arrival")
          .evaluate((image) => (image as HTMLImageElement).naturalHeight),
      )
      .toBe(600);
    const remaining = () =>
      page
        .locator(".reading-pane")
        .evaluate(
          (pane) => pane.scrollHeight - pane.clientHeight - pane.scrollTop,
        );
    if (move) expect(await remaining()).toBeGreaterThan(250);
    else await expect.poll(remaining).toBeLessThan(1);
  });
}

test("IM71.stale-navigation: delayed refresh cannot replace explicit page selection", async ({
  page,
}) => {
  let changed = false;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(
    page,
    async (number) => {
      if (changed && number === 3) {
        await held;
        return { body: arrival(3) };
      }
      return { body: fixture(number) };
    },
    route(3),
  );
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await (
    await openThreadPages(page)
  )
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toBeVisible();
  release();
  await page.waitForTimeout(100);
  await expect(page.locator("#pid108")).toHaveCount(0);
  expect(requests).toHaveLength(3);
});

test("IM71.account-change: changed-account refresh clears the previous account range", async ({
  page,
}) => {
  let changed = false;
  await open(
    page,
    (number) => ({
      body: changed
        ? fixture(number)
            .replace("uid=7", "uid=8")
            .replace("Reader Seven", "Reader Eight")
        : fixture(number),
    }),
    route(3),
  );
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator(".reading-pane article")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
});

test("IM71.preparation-priority: deliberate reply preparation discards delayed refresh without altering writing", async ({
  page,
}) => {
  let changed = false;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(
    page,
    async (number, value) => {
      if (new URL(value).searchParams.get("mod") === "post")
        return {
          body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>',
        };
      if (changed) await held;
      return {
        body:
          '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
          (changed ? arrival(number) : fixture(number)),
      };
    },
    route(3),
  );
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Retained source [quote]authored[/quote]");
  release();
  await page.waitForTimeout(100);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Retained source [quote]authored[/quote]",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator("#pid108")).toHaveCount(0);
  expect(requests).toHaveLength(3);
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

test("IM71.search-priority: delayed refresh completion cannot replace a deliberate search form", async ({
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
  let changed = false;
  const requests = await open(
    page,
    async (number, url) => {
      if (new URL(url).pathname === "/search.php") return { body: form };
      if (changed) {
        started();
        await held;
      }
      return { body: fixture(number) };
    },
    route(3),
  );
  changed = true;
  await clickThreadTool(page, "Refresh thread");
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
  await expect(page.locator("#pid108")).toHaveCount(0);
  expect(requests).toHaveLength(3);
  expect(new URL(requests[2]!.slice(4)).pathname).toBe("/search.php");
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

test("IM71.seen-once: temporarily absent stable IDs do not become new arrivals when observed again", async ({
  page,
}) => {
  let removed = false;
  await open(
    page,
    (number) => ({
      body: removed
        ? fixture(number).replace(/<div id="post_107">.*?<\/div><\/div>/s, "")
        : fixture(number),
    }),
    route(3),
  );
  removed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid107")).toHaveCount(0);
  removed = false;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid107")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /New replies/ })).toHaveCount(
    0,
  );
});

test("IM71.returned-later: refreshed latest page can reveal a real next boundary without inventing arrivals", async ({
  page,
}) => {
  let changed = false;
  const requests = await open(
    page,
    (number) => ({
      body: changed
        ? fixture(number).replace(
            "<label>",
            `<a class="nxt" href="${route(4)}">Next</a><a class="last" href="${route(4)}">Last</a><label>`,
          )
        : fixture(number),
    }),
    route(3),
  );
  await page
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .check();
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jump to latest", exact: true }),
  ).toHaveAttribute("href", `${route(4)}#lastpost`);
  await expect(page.getByRole("button", { name: /New replies/ })).toHaveCount(
    0,
  );
  await expect(page.getByText("Checks paused", { exact: true })).toBeVisible();
  const toggle = page.getByRole("checkbox", {
    name: "Check every 2 minutes while active",
    exact: true,
  });
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Escape");
  await toggle.click();
  await expect(toggle).toHaveCount(0);
  await expect(page.getByText("Manual refresh", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
});

test("IM71.toggle-target: the complete automatic check label remains a44px target at narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, undefined, route(3));
  const box = await page
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .locator("..")
    .boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("IM71.cached-range: explicit page navigation and Back preserve arrival membership and seen IDs while checks return off", async ({
  page,
}) => {
  let phase = 0;
  const requests = await open(
    page,
    (number) => ({
      body:
        number === 3 && phase
          ? phase === 1
            ? arrival(3).replace(/<div id="post_107">.*?<\/div><\/div>/s, "")
            : arrival(3)
          : fixture(number),
    }),
    route(3),
  );
  await loadThreadRange(page, "earlier");
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .check();
  phase = 1;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await (
    await openThreadPages(page)
  )
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toHaveCount(1);
  await clickThreadTool(page, "Back");
  await expect(page.locator("#pid108")).toHaveCount(1);
  await expect(page.locator("#pid107")).toHaveCount(0);
  await expect(page.locator("#pid103")).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    }),
  ).not.toBeChecked();
  phase = 2;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid107")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#pid103")).toHaveCount(1);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["3", "2", "3", "1", "3"]);
});

test("IM71.cached-cooldown: Back restores a failed range without bypassing the deliberate retry cooldown", async ({
  page,
}) => {
  let fail = false;
  const requests = await open(
    page,
    (number) =>
      number === 3 && fail
        ? { status: 429, body: "Too many requests" }
        : { body: fixture(number) },
    route(3),
  );
  fail = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await (
    await openThreadPages(page)
  )
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toHaveCount(1);
  await clickThreadTool(page, "Back");
  await expect(page.locator("#pid107")).toHaveCount(1);
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await clickThreadTool(page, "Refresh thread");
  await page.waitForTimeout(100);
  expect(requests).toHaveLength(3);
});

test("IM71.overlap-source: a post retained only by an earlier page keeps that actual attachment source after refresh", async ({
  page,
}) => {
  let changed = false;
  const bytes = "Retained earlier-page attachment.\n";
  const attachmentURL = `${origin}/forum.php?mod=attachment&aid=range-file&nothumb=yes`;
  const requests = await open(
    page,
    (number, value) => {
      if (new URL(value).searchParams.get("mod") === "attachment")
        return {
          body: bytes,
          contentType: "application/octet-stream",
          headers: {
            "content-disposition": 'attachment; filename="range-notes.txt"',
            "content-length": String(Buffer.byteLength(bytes)),
          },
        };
      let body = fixture(number).replace(
        "Quoted attribution 105</blockquote>",
        `Quoted attribution 105</blockquote><ignore_js_op><span id="attach_51"><a href="${attachmentURL}">range-notes.txt</a></span><div id="attach_51_menu">${Buffer.byteLength(bytes)} Bytes</div></ignore_js_op>`,
      );
      if (changed && number === 3)
        body = body.replace(/<div id="post_105">.*?<\/div><\/div>/s, "");
      return { body };
    },
    route(3),
  );
  await loadThreadRange(page, "earlier");
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid105")).toHaveCount(1);
  await page
    .locator("#pid105")
    .getByRole("button", { name: "Download range-notes.txt", exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  expect(
    requests
      .filter(
        (value) =>
          new URL(value.slice(4)).searchParams.get("mod") === "viewthread",
      )
      .map((value) => new URL(value.slice(4)).searchParams.get("page")),
  ).toEqual(["3", "2", "3", "2"]);
});

test("IM71.top-anchor: a top reader stays at the existing first post and receives the local arrival action", async ({
  page,
}) => {
  let changed = false;
  await open(
    page,
    (number) => ({ body: changed ? arrival(number) : fixture(number) }),
    route(3),
  );
  const before = await page
    .locator("#pid105")
    .evaluate((post) => post.getBoundingClientRect().top);
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("#pid105")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
});

test("IM71.new-later-page: a refresh exposing unloaded later content does not follow an intermediate loaded end", async ({
  page,
}) => {
  let changed = false;
  await open(
    page,
    (number) => ({
      body: changed
        ? arrival(number).replace(
            "<label>",
            `<a class="nxt" href="${route(4)}">Next</a><a class="last" href="${route(4)}">Last</a><label>`,
          )
        : fixture(number),
    }),
    route(3),
  );
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 30;
  });
  const visibleBefore = await readableLines(page);
  changed = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid108")).toHaveCount(1);
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const visibleAfter = await readableLines(page);
  await test.info().attach("intermediate-lines.json", {
    body: JSON.stringify({ before: visibleBefore, after: visibleAfter }),
    contentType: "application/json",
  });
  expect(visibleAfter.first?.paragraph).toBe(visibleBefore.first?.paragraph);
  expect(visibleAfter.first?.line).toBe(visibleBefore.first?.line);
  expect(
    Math.abs(visibleAfter.first!.offset - visibleBefore.first!.offset),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
});

test("IM71.last-success: a local successful-check time stays visible through a later failed check", async ({
  page,
}) => {
  let fail = false;
  const requests = await open(
    page,
    (number) =>
      fail
        ? { status: 429, body: "Too many requests" }
        : { body: fixture(number) },
    route(3),
  );
  await expect(page.getByText(/^Last successful check:/)).toHaveCount(0);
  await clickThreadTool(page, "Refresh thread");
  const checked = page.getByText(/^Last successful check:/);
  await expect(checked).toBeVisible();
  const last = await checked.textContent();
  expect(last).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  fail = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await expect(checked).toHaveText(last!);
  expect(requests).toHaveLength(3);
});

function auditHistory(tid = "42", arrived = false) {
  const other = tid === "42" ? "84" : "42";
  return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">${tid === "42" ? "Continuous rich history" : "Second rich thread"}</h1><div id="post_201"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum201">1</a><div class="pcb">${Array.from({ length: 100 }, (_, i) => `<p>Public paragraph ${i}: complete authored body. <a href="${origin}/forum.php?mod=viewthread&tid=${other}">Other ${i}</a></p>`).join("")}</div></div><div id="post_202"><a id="postnum202">2</a><div class="pcb"><p>Original final public body.</p></div></div>${arrived ? '<div id="post_203"><a id="postnum203">3</a><div class="pcb"><p>New visible public arrival.</p></div></div>' : ""}</div><div class="pg"><strong>1</strong><label><input name="custompage" value="1"><span title="共 1 页"> / 1 页</span></label></div>`;
}
async function auditAppearance(
  page: Page,
  width: number,
  size: number,
  height = 700,
) {
  await openSettings(page);
  await page.getByRole("dialog").getByRole("slider").fill(String(size));
  await closeSettingsToWorkspace(page, "button");
  await page.setViewportSize({ width, height });
  await readableLines(page);
  await page.locator(".conversation-region").evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
}
for (const [width, size, returnHeight] of [
  [390, 150, 700],
  [1440, 100, 700],
  [390, 150, 500],
]) {
  test(`F79.public-visible-return-${width}-${returnHeight}: cached return retains the real clipped text line and valid absolute control`, async ({
    page,
  }, info) => {
    const requests = await open(
      page,
      (_n, url) => ({
        body: auditHistory(new URL(url).searchParams.get("tid") ?? "42"),
      }),
      base,
    );
    await auditAppearance(page, width!, size!);
    await page.locator(".reading-pane").evaluate((n) => {
      n.scrollTop = 650;
    });
    let before = await readableLines(page);
    expect(before.visibleHeight).toBeGreaterThan(50);
    expect(before.first).not.toBeNull();
    const p = before.first!.paragraph;
    const link = page
      .locator(".reading-pane .post-content p")
      .nth(p)
      .getByRole("link");
    await link.scrollIntoViewIfNeeded();
    before = await readableLines(page);
    await link.click();
    await expect(
      page.getByRole("heading", { name: "Second rich thread", exact: true }),
    ).toBeVisible();
    const reads = requests.length;
    await page.setViewportSize({ width: width!, height: returnHeight! });
    await page.goBack();
    await expect(
      page.getByRole("heading", {
        name: "Continuous rich history",
        exact: true,
      }),
    ).toBeVisible();
    const after = await readableLines(page);
    await info.attach("public-return-lines.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    expect(requests).toHaveLength(reads);
    expect(after.visibleHeight).toBeGreaterThan(50);
    expect(after.first?.paragraph).toBe(before.first!.paragraph);
    expect(after.first?.line).toBe(before.first!.line);
    expect(
      Math.abs(after.first!.offset - before.first!.offset),
    ).toBeLessThanOrEqual(1);
    if (Math.abs(after.paneTop - before.paneTop) <= 1)
      expect(
        Math.abs(after.articleTop! - before.articleTop!),
      ).toBeLessThanOrEqual(1);
    if (returnHeight === 500) {
      // A later deliberate resize must still restore its own current line;
      // only resize work superseded by history restoration is cancelled.
      await page.setViewportSize({ width: width!, height: 600 });
      const resized = await readableLines(page);
      await info.attach("public-return-later-resize.json", {
        body: JSON.stringify({ before: after, after: resized }),
        contentType: "application/json",
      });
      expectPreservedReadingLine(after, resized);
      expect(requests).toHaveLength(reads);
    }
  });
}
for (const height of [700, 500]) {
  test(`F79.public-visible-follow-${height}: strict latest end exposes a complete new public text line`, async ({
    page,
  }, info) => {
    let arrived = false;
    await open(page, () => ({ body: auditHistory("42", arrived) }), base);
    await auditAppearance(page, 390, 150, height);
    await page.locator(".reading-pane").evaluate((n) => {
      n.scrollTop = n.scrollHeight;
    });
    const before = await readableLines(page);
    expect(before.visibleHeight).toBeGreaterThan(50);
    arrived = true;
    await clickThreadTool(page, "Refresh thread");
    await expect(page.locator("#pid203")).toHaveCount(1);
    const after = await readableLines(page);
    await info.attach("public-follow-lines.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    expect(after.remaining).toBeLessThanOrEqual(1);
    expect(after.visibleHeight).toBeGreaterThan(50);
    expect(
      after.lines
        .filter((line) => line.text === "New visible public arrival.")
        .some((line) => line.complete),
    ).toBe(true);
  });
}
function actionHistory(arrivals: number, intermediate = false) {
  let body = auditHistory("42", arrivals > 0)
    .replace(
      "<p>Original final public body.</p>",
      Array.from(
        { length: 8 },
        (_, i) =>
          `<p>Original final public line ${i}: complete readable body.</p>`,
      ).join(""),
    )
    .replace(
      '<div id="postlist">',
      '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist">',
    );
  if (arrivals > 1)
    body = body.replace(
      '</div><div class="pg">',
      '<div id="post_204"><a id="postnum204">4</a><div class="pcb"><p>Second complete public arrival.</p></div></div></div><div class="pg">',
    );
  if (intermediate)
    body = body
      .replace(
        "<strong>1</strong>",
        '<strong>1</strong><a class="nxt" href="' + route(2) + '">2</a>',
      )
      .replace("共 1 页", "共 2 页")
      .replace("/ 1 页", "/ 2 页");
  return body;
}
async function atContentEnd(page: Page, distance: number) {
  await page.locator(".reading-pane").evaluate((reader, gap) => {
    const body = reader.querySelector("article:last-of-type .post-content")!;
    reader.scrollTop =
      Math.ceil(
        reader.scrollTop +
          body.getBoundingClientRect().bottom -
          reader.getBoundingClientRect().bottom,
      ) - gap;
  }, distance);
}
for (const height of [700, 500])
  for (const distance of [64, 65]) {
    test(`F79.public-actions-follow-${height}-${distance}: content endpoint preserves exact follow boundary, repeated arrivals and trailing actions`, async ({
      page,
    }, info) => {
      let arrivals = 0;
      await open(page, () => ({ body: actionHistory(arrivals) }), base);
      await auditAppearance(page, 390, 150, height);
      await atContentEnd(page, distance);
      const before = await readableLines(page);
      arrivals = 1;
      await clickThreadTool(page, "Refresh thread");
      await expect(page.locator("#pid203")).toHaveCount(1);
      const after = await readableLines(page);
      await info.attach("public-actions-lines.json", {
        body: JSON.stringify({ before, after }),
        contentType: "application/json",
      });
      if (distance === 64) {
        expect(
          after.lines
            .filter((line) => line.text === "New visible public arrival.")
            .some((line) => line.complete),
        ).toBe(true);
        await expect(
          page.getByRole("button", { name: "New replies (1)", exact: true }),
        ).toHaveCount(0);
        arrivals = 2;
        await clickThreadTool(page, "Refresh thread");
        await expect(page.locator("#pid204")).toHaveCount(1);
        const repeated = await readableLines(page);
        await info.attach("public-actions-repeated.json", {
          body: JSON.stringify(repeated),
          contentType: "application/json",
        });
        expect(
          repeated.lines
            .filter((line) => line.text === "Second complete public arrival.")
            .some((line) => line.complete),
        ).toBe(true);
        await expect(
          page.getByRole("button", { name: /^New replies/ }),
        ).toHaveCount(0);
        const action = page.locator("#pid204 .post-actions button").first();
        await action.scrollIntoViewIfNeeded();
        const reachable = await action.evaluate((node) => {
          const r = node.getBoundingClientRect(),
            reader = node.closest(".reading-pane")!.getBoundingClientRect(),
            outer = node
              .closest(".conversation-region")!
              .getBoundingClientRect();
          return {
            height: r.height,
            visible:
              Math.min(innerHeight, reader.bottom, outer.bottom, r.bottom) -
              Math.max(0, reader.top, outer.top, r.top),
          };
        });
        expect(reachable.height).toBeGreaterThanOrEqual(44);
        expect(reachable.visible).toBeGreaterThanOrEqual(43);
      } else {
        expect(after.first?.paragraph).toBe(before.first?.paragraph);
        expect(after.first?.line).toBe(before.first?.line);
        expect(
          Math.abs(after.first!.offset - before.first!.offset),
        ).toBeLessThanOrEqual(1);
        await expect(
          page.getByRole("button", { name: "New replies (1)", exact: true }),
        ).toBeVisible();
      }
    });
  }

for (const move of [false, true]) {
  test(`F79.public-actions-media-${move}: delayed media follows the body endpoint unless the reader moves`, async ({
    page,
  }, info) => {
    let arrivals = 0;
    let releaseImage!: () => void;
    let requestedImage!: () => void;
    const held = new Promise<void>((resolve) => {
      releaseImage = resolve;
    });
    const requested = new Promise<void>((resolve) => {
      requestedImage = resolve;
    });
    await open(
      page,
      async (_number, url) => {
        if (url.endsWith("late.png")) {
          requestedImage();
          await held;
          return {
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="orange"/></svg>',
          };
        }
        return {
          body: actionHistory(arrivals).replace(
            "<p>New visible public arrival.</p>",
            '<img src="https://www.tsdm39.com/late.png" alt="Delayed footer arrival"><p>New visible public arrival.</p>',
          ),
        };
      },
      base,
    );
    await auditAppearance(page, 390, 150, 500);
    await atContentEnd(page, 0);
    arrivals = 1;
    await clickThreadTool(page, "Refresh thread");
    await expect(page.locator("#pid203")).toHaveCount(1);
    await requested;
    if (move)
      await page.locator(".reading-pane").evaluate((pane) => {
        pane.dispatchEvent(new WheelEvent("wheel"));
        pane.scrollTop -= 300;
      });
    const before = await readableLines(page);
    releaseImage();
    await expect
      .poll(() =>
        page
          .getByAltText("Delayed footer arrival")
          .evaluate((image) => (image as HTMLImageElement).naturalHeight),
      )
      .toBe(600);
    const after = await readableLines(page);
    await info.attach("public-actions-media-lines.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    if (move) {
      expect(after.first?.paragraph).toBe(before.first?.paragraph);
      expect(after.first?.line).toBe(before.first?.line);
      expect(
        Math.abs(after.first!.offset - before.first!.offset),
      ).toBeLessThanOrEqual(1);
    } else {
      expect(
        after.lines
          .filter((line) => line.text === "New visible public arrival.")
          .some((line) => line.complete),
      ).toBe(true);
      expect(after.remaining).toBeGreaterThan(0);
    }
  });
}
test("F79.public-actions-intermediate: content-bottom positioning never qualifies an unloaded later page", async ({
  page,
}, info) => {
  let arrivals = 0;
  const requests = await open(
    page,
    () => ({ body: actionHistory(arrivals, true) }),
    base,
  );
  await auditAppearance(page, 390, 150);
  await atContentEnd(page, 0);
  const before = await readableLines(page);
  arrivals = 1;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid203")).toHaveCount(1);
  const after = await readableLines(page);
  await info.attach("intermediate-content-lines.json", {
    body: JSON.stringify({ before, after, requests }),
    contentType: "application/json",
  });
  expectPreservedReadingLine(before, after);
  await expect(page.getByRole("button", { name: /^New replies/ })).toHaveCount(
    0,
  );
  await expect(
    (await openThreadPages(page)).getByRole("button", {
      name: "Load later",
      exact: true,
    }),
  ).toBeVisible();
});
test("F79.public-first-timestamp: first successful refresh preserves the real visible public line", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1119, height: 626 });
  await open(page, () => ({ body: auditHistory() }), base);
  await page.locator(".reading-pane").evaluate((n) => {
    n.scrollTop = 650;
  });
  const before = await readableLines(page);
  await clickThreadTool(page, "Refresh thread");
  await expect(page.getByText(/Last successful check/)).toBeVisible();
  const after = await readableLines(page);
  await info.attach("public-timestamp-lines.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  expect(after.first?.paragraph).toBe(before.first!.paragraph);
  expect(after.first?.line).toBe(before.first!.line);
  expect(
    Math.abs(after.first!.offset - before.first!.offset),
  ).toBeLessThanOrEqual(1);
});

test("F79.public-context-review: populated board through loaded range and addressed source keeps one editor and separate immutable approval", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
  const member =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
  const board =
    member +
    `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid">${Array.from({ length: 25 }, (_, i) => `<tbody id="normalthread_${i === 15 ? 42 : 200 + i}"><tr><th><a class="xst" href="${i === 15 ? route(2) : base.replace("42", String(200 + i))}">Mixed result ${i}</a></th><td class="by"><cite>Listener</cite></td></tr></tbody>`).join("")}</table>`;
  const requests = await open(
    page,
    (n, url) => {
      const u = new URL(url);
      if (u.searchParams.get("mod") === "forumdisplay") return { body: board };
      if (u.searchParams.get("mod") === "post")
        return {
          body:
            member +
            '<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="AUTHORED_ONLY"><input type="hidden" name="posttime" value="1793793600"><input type="hidden" name="wysiwyg" value="0"><input type="hidden" name="reppid" value="106"><input type="hidden" name="reppost" value="106"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Listener"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><button type="submit" name="replysubmit" value="yes">Reply</button></form>',
        };
      return {
        body: fixture(n).replace(
          '<div id="postlist">',
          `<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist">`,
        ),
      };
    },
    boardURL,
  );
  const row = page.getByRole("link", { name: "Mixed result 15", exact: true });
  await row.scrollIntoViewIfNeeded();
  const offset = await page
    .locator(".results-pane")
    .evaluate((n) => n.scrollTop);
  expect(offset).toBeGreaterThan(0);
  await row.click();
  await loadThreadRange(page, "earlier");
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await loadThreadRange(page, "later");
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  const ids = await page
    .locator(".reading-pane article")
    .evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids).toEqual([
    "pid101",
    "pid102",
    "pid103",
    "pid104",
    "pid105",
    "pid106",
    "pid107",
  ]);
  await page
    .locator("#pid106")
    .getByRole("button", { name: "Reply to this post", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  const source =
    "[quote=Independent author]Separately authored quote[/quote]\nMixed exact source 中文";
  await editor.fill(source);
  const handle = await editor.elementHandle();
  await editor.press("End");
  await editor.press("!");
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue(source);
  const presentationRequests = requests.length;
  for (const width of [959, 960, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(editor).toHaveValue(source);
    expect(await handle!.evaluate((n) => n.isConnected)).toBe(true);
    await expect(page.locator(".reading-pane article")).toHaveCount(7);
  }
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  expect(requests).toHaveLength(presentationRequests);
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Post 106");
  await editor.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review.locator(".prepared-source")).toHaveText(source);
  await editor.fill(source + "\nLater revision");
  await expect(review).toHaveCount(0);
  await editor.press("Control+Enter");
  await expect(review.locator(".prepared-source")).toHaveText(
    source + "\nLater revision",
  );
  await page
    .getByRole("button", {
      name: "Cancel review and return to writing",
      exact: true,
    })
    .click();
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
  expect(
    await page
      .locator(".reading-pane article")
      .evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual(ids);
  const stored = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(stored.replyTarget.postId).toBe("106");
  expect(stored.replyTarget.threadId).toBe("42");
  await info.attach("mixed-public-state.json", {
    body: JSON.stringify({ ids, offset, requests, writing: stored }),
    contentType: "application/json",
  });
});
