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
  await page.goto(route(2));
  await expect(
    page.getByRole("heading", { name: "Continuous rich history", exact: true }),
  ).toBeVisible();
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
test("IM70.local-ranges: ordinary return and Back retain loaded ranges while explicit page wins", async ({
  page,
}) => {
  const requests = await open(page, (number, url) => ({
    body: fixture(number)
      .replaceAll(
        "tid=42",
        new URL(url).searchParams.get("tid") === "84" ? "tid=84" : "tid=42",
      )
      .replaceAll(
        '<div class="pcb">',
        '<div class="pcb"><a href="' +
          (new URL(url).searchParams.get("tid") === "84"
            ? base
            : base.replace("42", "84")) +
          '">Other thread</a>',
      )
      .replace(
        "Continuous rich history",
        new URL(url).searchParams.get("tid") === "84"
          ? "Second rich thread"
          : "Continuous rich history",
      ),
  }));
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top - 37;
  });
  const before = await anchor(page);
  await page
    .locator("#pid104")
    .getByRole("link", { name: "Other thread", exact: true })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page
    .locator("#pid101")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  expect(requests).toHaveLength(4);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect(requests).toHaveLength(4);
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
    .getByRole("link", { name: "1", exact: true })
    .click({ force: true });
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(5);
});

test("IM70.reload-marker: reload reconstructs only the returned containing page and keeps exact anchor", async ({
  page,
}) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((p) => p.getBoundingClientRect().top);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
    )
    .toContain('"anchor":"pid106"');
  const stored = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(stored).not.toContain("Complete post 106");
  expect(stored).not.toContain("Complete post 107");
  await page.reload();
  await expect(page.locator("#pid106")).toBeAttached();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  expect(
    await page
      .locator("#pid106")
      .evaluate((p) => p.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  expect(
    requests.map((r) => new URL(r.slice(4)).searchParams.get("page")),
  ).toEqual(["2", "3", "3"]);
});

test("IM70.direct-priority: ordinary direct arrival restores a compatible marker but explicit page wins", async ({
  page,
}) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator("#pid106")).toBeAttached();
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((p) => p.getBoundingClientRect().top);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
    )
    .toContain('"anchor":"pid106"');
  await page.goto(base);
  await expect(page.locator("#pid106")).toBeAttached();
  expect(
    await page
      .locator("#pid106")
      .evaluate((p) => p.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  await page.goto(route(1));
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(page.locator("#pid106")).toHaveCount(0);
  expect(
    requests.map((r) => new URL(r.slice(4)).searchParams.get("page")),
  ).toEqual(["2", "3", null, "3", "1"]);
});

for (const mode of ["missing", "account", "unavailable"] as const) {
  test(`IM70.reconstruction-${mode}: incomplete recovery stays honest and never loops`, async ({
    page,
  }) => {
    let changed = false;
    const requests = await open(page, (number) => {
      if (!changed) return null;
      if (mode === "unavailable")
        return { status: 503, body: "Temporarily unavailable" };
      return {
        body:
          mode === "account"
            ? fixture(number)
                .replace("uid=7", "uid=8")
                .replace("Reader Seven", "Reader Eight")
            : fixture(number).replace(
                /<div id="post_106">[\s\S]*?(?=<div id="post_107">)/,
                "",
              ),
      };
    });
    await page.getByRole("button", { name: "Load later", exact: true }).click();
    await expect(page.locator("#pid106")).toBeAttached();
    await page.locator("#pid106").evaluate((post) => {
      const pane = post.closest(".reading-pane")!;
      pane.scrollTop +=
        post.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        37;
    });
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
      )
      .toContain('"anchor":"pid106"');
    changed = true;
    await page.reload();
    if (mode === "missing") {
      await expect(
        page.getByRole("alert").filter({ hasText: "106" }),
      ).toBeVisible();
      await expect(page.locator("#pid106")).toHaveCount(0);
    } else if (mode === "account") {
      await expect(page.locator(".reading-pane article")).toHaveCount(0);
      await expect(
        page.getByText(/remembered reading position no longer matches/),
      ).toBeVisible();
    } else
      await expect(page.locator(".workspace-status")).toContainText(
        /could not be displayed reliably/i,
      );
    await page.waitForTimeout(300);
    expect(requests).toHaveLength(3);
  });
}

test("IM70.pending-return: leaving pending history does not retain an unusable loading boundary", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const requests = await open(page, async (number, url) => {
    const second = new URL(url).searchParams.get("tid") === "84";
    if (!second && number === 3)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return {
      body: fixture(number)
        .replaceAll("tid=42", second ? "tid=84" : "tid=42")
        .replace(
          "Continuous rich history",
          second ? "Second rich thread" : "Continuous rich history",
        )
        .replaceAll(
          '<div class="pcb">',
          `<div class="pcb"><a href="${second ? base : base.replace("42", "84")}">Other thread</a>`,
        ),
    };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Loading history…", exact: true }),
  ).toBeVisible();
  await page
    .locator("#pid103")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  release!();
  await page
    .locator("#pid101")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Load later", exact: true }),
  ).toBeEnabled();
  expect(requests).toHaveLength(3);
});

test("IM70.account-cache: a confirmed new account never revives the former range", async ({
  page,
}) => {
  let changed = false;
  const requests = await open(page, (number, url) => {
    const second = new URL(url).searchParams.get("tid") === "84";
    let body = fixture(number)
      .replaceAll("tid=42", second ? "tid=84" : "tid=42")
      .replace(
        "Continuous rich history",
        second ? "Second rich thread" : "Continuous rich history",
      )
      .replaceAll(
        '<div class="pcb">',
        `<div class="pcb"><a href="${second ? base : base.replace("42", "84")}">Other thread</a>`,
      );
    if (changed)
      body = body
        .replace("uid=7", "uid=8")
        .replace("Reader Seven", "Reader Eight");
    return { body };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  changed = true;
  await page
    .locator("#pid103")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page
    .locator("#pid101")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(
    page.getByText("Signed in as Reader Eight", { exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(4);
});

test("IM70.writing-recovery: compatible source and destination survive marker reconstruction and old snapshots", async ({
  page,
}) => {
  const requests = await open(page, (number, url) =>
    new URL(url).searchParams.get("mod") === "post"
      ? {
          body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>',
        }
      : {
          body:
            '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
            fixture(number),
        },
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = "Retain exact unsent source 中文 [quote]attribution[/quote]";
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator("#pid106")).toBeAttached();
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
    )
    .toContain('"anchor":"pid106"');
  const before = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  await page.reload();
  await expect(page.locator("#pid106")).toBeAttached();
  const after = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(after.source).toEqual(before.source);
  expect(before.replyTarget.threadId).toBe("42");
  expect(after.replyTarget).toEqual(before.replyTarget);
  expect(after.board).toEqual(before.board);
  expect(after.account).toEqual(before.account);
  expect(JSON.stringify(after)).toContain(source);
  expect(JSON.stringify(after)).not.toContain("SYNTHETIC_PUBLIC_TOKEN");
  await page.context().addInitScript(() => {
    const r = JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!);
    for (const e of Object.values(r.entries) as { readingMarker?: unknown }[])
      delete e.readingMarker;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(r));
  });
  await page.reload();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.stringify(
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
      ),
    ),
  ).toContain(source);
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
});

test("IM70.reloaded-back: returning to a remembered adjacent page after reloading another thread reconstructs once", async ({
  page,
}) => {
  const requests = await open(page, (number, url) => {
    const second = new URL(url).searchParams.get("tid") === "84";
    return {
      body: fixture(number)
        .replaceAll("tid=42", second ? "tid=84" : "tid=42")
        .replace(
          "Continuous rich history",
          second ? "Second rich thread" : "Continuous rich history",
        )
        .replaceAll(
          '<div class="pcb">',
          `<div class="pcb"><a href="${second ? base : base.replace("42", "84")}">Other thread</a>`,
        ),
    };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator("#pid106")).toBeAttached();
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((p) => p.getBoundingClientRect().top);
  await page
    .locator("#pid106")
    .getByRole("link", { name: "Other thread", exact: true })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.locator("#pid106")).toBeAttached();
  expect(
    await page
      .locator("#pid106")
      .evaluate((p) => p.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  expect(requests).toHaveLength(4);
});

for (const mode of ["refused", "malformed"] as const) {
  test(`IM70.storage-${mode}: recovery limits are visible without silently changing the current reader`, async ({
    page,
  }) => {
    await open(page);
    if (mode === "refused")
      await page.evaluate(() => {
        Storage.prototype.setItem = function () {
          throw new DOMException("Full", "QuotaExceededError");
        };
      });
    await page.locator("#pid104").evaluate((post) => {
      const pane = post.closest(".reading-pane")!;
      pane.scrollTop +=
        post.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        37;
    });
    if (mode === "refused") {
      await expect(page.locator(".workspace-status")).toContainText(
        /recovery.*unavailable|could not.*recover|recovery.*not/i,
      );
      await expect(page.locator(".reading-pane article")).toHaveCount(3);
    } else {
      await expect
        .poll(() =>
          page.evaluate(() =>
            sessionStorage.getItem("tsdm.workspace.recovery"),
          ),
        )
        .toContain('"readingMarker"');
      await page.context().addInitScript(() => {
        const r = JSON.parse(
          sessionStorage.getItem("tsdm.workspace.recovery")!,
        );
        const key = location.hash.slice(11);
        r.entries[key].readingMarker.url =
          "https://attacker.invalid/forum.php?mod=viewthread&tid=42";
        sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(r));
      });
      await page.reload();
      await expect(
        page.getByText(/Stored recovery data is incompatible/),
      ).toBeVisible();
    }
  });
}

test("IM70.retention-measurement: complete rich ranges remain local without serializing every page", async ({
  page,
}, info) => {
  const requests = await open(page, (number, url) => {
    const tid = new URL(url).searchParams.get("tid") ?? "42";
    const ids = Array.from({ length: 40 }, (_, i) => number * 1000 + i + 1);
    const body = `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">Continuous rich history</h1>${ids.map((id) => `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><div class="pcb"><p>${"Rich text 中文. ".repeat(180)}</p><blockquote>Attribution</blockquote><table><tr><td>Complete cell</td></tr></table><pre>const retained = true;</pre></div></div>`).join("")}</div><div class="pg">${number > 1 ? `<a class="prev" href="${base}&page=${number - 1}">Previous</a>` : ""}<strong>${number}</strong>${number < 6 ? `<a class="nxt" href="${base}&page=${number + 1}">Next</a>` : ""}<label><input name="custompage" value="${number}"><span>/ 6 页</span></label></div>`;
    return { body: body.replaceAll("tid=42", `tid=${tid}`) };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const heapBefore = await cdp.send("Performance.getMetrics");
  for (let n = 3; n <= 6; n++) {
    await page
      .getByRole("button", { name: "Load later", exact: true })
      .click({ force: true });
    await expect(page.locator(".reading-pane article")).toHaveCount(
      (n - 1) * 40,
    );
  }
  const metrics = await page.locator(".reading-pane").evaluate((p) => ({
    posts: p.querySelectorAll("article").length,
    nodes: p.querySelectorAll("*").length,
    htmlBytes: new TextEncoder().encode(p.innerHTML).length,
    recoveryBytes: new TextEncoder().encode(
      sessionStorage.getItem("tsdm.workspace.recovery") ?? "",
    ).length,
  }));
  await info.attach("retention-measurement.json", {
    body: JSON.stringify({
      metrics,
      requests,
      heapBefore,
      heapAfter: await cdp.send("Performance.getMetrics"),
    }),
    contentType: "application/json",
  });
  expect(metrics.posts).toBe(200);
  expect(metrics.htmlBytes).toBeGreaterThan(400000);
  expect(metrics.recoveryBytes).toBeLessThan(metrics.htmlBytes / 2);
  expect(requests).toHaveLength(5);
});

for (const width of [390, 900]) {
  test(`IM70.drawer-recovery-${width}: moving a real drawer preserves a loaded reader marker through reload`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await open(page);
    await page.getByRole("button", { name: "Load later", exact: true }).click();
    await expect(page.locator("#pid106")).toBeAttached();
    await page.locator("#pid106").evaluate((post) => {
      const pane = post.closest(".reading-pane")!;
      pane.scrollTop +=
        post.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        37;
    });
    const before = await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top);
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
      )
      .toContain('"anchor":"pid106"');
    for (const pane of width === 390 ? ["Boards", "Threads"] : ["Boards"]) {
      await page
        .getByRole("button", { name: `${pane} pane`, exact: true })
        .click();
      const drawer = page.getByRole("dialog", {
        name: pane === "Boards" ? "Boards navigation" : "Thread results",
        exact: true,
      });
      await expect(drawer).toBeVisible();
      await drawer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(drawer).toBeHidden();
      expect(
        await page
          .locator("#pid106")
          .evaluate((post) => post.getBoundingClientRect().top),
      ).toBeCloseTo(before, 0);
      expect(requests).toHaveLength(2);
    }
    await page.reload();
    await expect(page.locator("#pid106")).toBeAttached();
    const restored = await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top);
    await info.attach("drawer-reload-anchor.json", {
      body: JSON.stringify({ width, before, restored, requests }),
      contentType: "application/json",
    });
    expect(restored).toBeCloseTo(before, 0);
    expect(requests).toHaveLength(3);
  });
}

test("IM70.automatic-cached-range: an automatically loaded page survives ordinary return and reconstructs once on reload", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const requests = await open(page, (number, url) => {
    const second = new URL(url).searchParams.get("tid") === "84";
    return {
      body: fixture(number)
        .replaceAll("tid=42", second ? "tid=84" : "tid=42")
        .replace(
          "Continuous rich history",
          second ? "Second rich thread" : "Continuous rich history",
        )
        .replaceAll(
          '<div class="pcb">',
          `<div class="pcb"><a href="${second ? base : base.replace("42", "84")}">Other thread</a>`,
        ),
    };
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
  });
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(requests).toHaveLength(2);
  await page.locator("#pid106").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await page
    .locator("#pid106")
    .evaluate((post) => post.getBoundingClientRect().top);
  await page
    .locator("#pid106")
    .getByRole("link", { name: "Other thread", exact: true })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page
    .locator("#pid101")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(
    await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top),
  ).toBeCloseTo(before, 0);
  expect(requests).toHaveLength(3);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Boards navigation", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  expect(requests).toHaveLength(3);
  await page.reload();
  await expect(page.locator("#pid106")).toBeAttached();
  const restored = await page
    .locator("#pid106")
    .evaluate((post) => post.getBoundingClientRect().top);
  await info.attach("automatic-range-recovery.json", {
    body: JSON.stringify({ before, restored, requests }),
    contentType: "application/json",
  });
  expect(restored).toBeCloseTo(before, 0);
  expect(requests).toHaveLength(4);
});

test("IM70.explicit-page-back: browser history restores its explicit page instead of the newest context alias", async ({
  page,
}) => {
  const requests = await open(page);
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
    .getByRole("link", { name: "1", exact: true })
    .click({ force: true });
  await expect(page.locator("#pid101")).toBeAttached();
  await page.goBack();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  expect(
    await page
      .locator(".reading-pane article")
      .evaluateAll((posts) => posts.map((post) => post.id)),
  ).toEqual(["pid103", "pid104", "pid105"]);
  await page.goForward();
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  expect(
    await page
      .locator(".reading-pane article")
      .evaluateAll((posts) => posts.map((post) => post.id)),
  ).toEqual(["pid101", "pid102", "pid103"]);
  expect(requests).toHaveLength(2);
});

for (const target of ["page", "permalink"]) {
  test(`IM70.explicit-range-history-${target}: explicit history retains its own loaded range and anchor across Back and Forward`, async ({
    page,
  }, info) => {
    const requests = await open(page, (number) => ({
      body: fixture(number).replaceAll(
        '<div class="pcb">',
        `<div class="pcb"><a href="${route(1)}#pid102">Exact older post</a>`,
      ),
    }));
    await page.getByRole("button", { name: "Load later", exact: true }).click();
    await expect(page.locator(".reading-pane article")).toHaveCount(5);
    await page.locator("#pid106").evaluate((post) => {
      const pane = post.closest(".reading-pane")!;
      pane.scrollTop +=
        post.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        37;
    });
    const before = await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top);
    if (target === "page")
      await page
        .getByRole("navigation", { name: "Thread pages (top)", exact: true })
        .getByRole("link", { name: "1", exact: true })
        .click({ force: true });
    else
      await page
        .locator("#pid106")
        .getByRole("link", { name: "Exact older post", exact: true })
        .click({ force: true });
    await expect(page.locator(".reading-pane article")).toHaveCount(3);
    await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
    if (target === "permalink")
      await expect(
        page.locator('#pid102[data-targeted="true"]'),
      ).toBeAttached();
    await page.goBack();
    await expect(page.locator(".reading-pane article")).toHaveCount(5);
    await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
    const restored = await page
      .locator("#pid106")
      .evaluate((post) => post.getBoundingClientRect().top);
    await info.attach("explicit-range-history.json", {
      body: JSON.stringify({ target, before, restored, requests }),
      contentType: "application/json",
    });
    expect(restored).toBeCloseTo(before, 0);
    await page.goForward();
    await expect(page.locator(".reading-pane article")).toHaveCount(3);
    await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
    if (target === "permalink")
      await expect(
        page.locator('#pid102[data-targeted="true"]'),
      ).toBeAttached();
    expect(requests).toHaveLength(3);
  });
}

test("IM70.ordinary-alias-growth: loading through an ordinary return updates the same range retained by its earlier entry", async ({
  page,
}) => {
  const requests = await open(page, (number, url) => {
    const second = new URL(url).searchParams.get("tid") === "84";
    return {
      body: fixture(number)
        .replaceAll("tid=42", second ? "tid=84" : "tid=42")
        .replace(
          "Continuous rich history",
          second ? "Second rich thread" : "Continuous rich history",
        )
        .replaceAll(
          '<div class="pcb">',
          `<div class="pcb"><a href="${second ? base : base.replace("42", "84")}">Other thread</a>`,
        ),
    };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page
    .locator("#pid104")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page
    .locator("#pid101")
    .getByRole("link", { name: "Other thread", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Load earlier", exact: true })
    .click({ force: true });
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Second rich thread", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect(requests).toHaveLength(4);
});
