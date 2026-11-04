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
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((post) => post.getBoundingClientRect().top);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(6);
  await expect(page.locator("#pid106")).toContainText("Edited same post 106.");
  expect(
    await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
    const before = await page
      .locator("#pid107")
      .evaluate((post) => post.getBoundingClientRect().top);
    changed = true;
    await page
      .getByRole("button", { name: "Refresh thread", exact: true })
      .click();
    await expect(page.locator("#pid108")).toHaveCount(1);
    const remaining = await page
      .locator(".reading-pane")
      .evaluate(
        (pane) => pane.scrollHeight - pane.clientHeight - pane.scrollTop,
      );
    if (distance === 64) {
      expect(remaining).toBeLessThan(1);
      await expect(
        page.getByRole("button", { name: "New replies (1)", exact: true }),
      ).toHaveCount(0);
    } else {
      expect(remaining).toBeGreaterThan(100);
      expect(
        await page
          .locator("#pid107")
          .evaluate((post) => post.getBoundingClientRect().top),
      ).toBeCloseTo(before, 0);
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
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight - pane.clientHeight - 30;
  });
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const before = await page
    .locator("#pid105")
    .evaluate((post) => post.getBoundingClientRect().top);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(page.locator("#pid108")).toHaveCount(1);
  expect(
    await page
      .locator("#pid105")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load earlier", exact: true })
    .click({ force: true });
  expect(requests).toHaveLength(2);
  release?.();
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await page.waitForTimeout(100);
  expect(requests).toHaveLength(2);
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(2);
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
    await page
      .getByRole("button", { name: "Refresh thread", exact: true })
      .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(page.locator("#pid107")).toHaveCount(0);
  removed = false;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Load later", exact: true }),
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
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .check();
  phase = 1;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toHaveCount(1);
  await page.getByRole("button", { name: "Back", exact: true }).click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toHaveCount(1);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator("#pid107")).toHaveCount(1);
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
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
  const before = await page
    .locator("#pid107")
    .evaluate((post) => post.getBoundingClientRect().top);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(page.locator("#pid108")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Load later", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("#pid107")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
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
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  const checked = page.getByText(/^Last successful check:/);
  await expect(checked).toBeVisible();
  const last = await checked.textContent();
  expect(last).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  fail = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await expect(checked).toHaveText(last!);
  expect(requests).toHaveLength(3);
});
