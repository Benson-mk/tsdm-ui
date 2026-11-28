import { expectThreadCheckMode } from "./navigation-ui";
import { setAutomaticChecks } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  openSettings,
  closeSettingsToWorkspace,
  openThreadMore,
  confirmThreadPage,
  loadThreadRange,
  clickThreadTool,
  openThreadPages,
} from "./navigation-ui";
import { selectSourceEditor } from "./editor-controls";
import { readableLines, expectPreservedReadingLine } from "./readable-lines";
const origin = "https://www.tsdm39.com";
const target = (n: number, reverse = false) =>
  `${origin}/forum.php?mod=viewthread&tid=42&ordertype=${reverse ? 1 : 2}&page=${n}`;
const ledgers = new WeakMap<Page, { url: string; at: number }[]>();
function fixture(n: number, reverse = false, added = 0, total = 3) {
  const chronological = reverse ? total + 1 - n : n;
  const ids = [
    chronological * 100,
    chronological * 100 + 1,
    chronological * 100 + 2,
  ];
  if (chronological === total)
    ids.push(...Array.from({ length: added }, (_, i) => 303 + i));
  if (reverse) ids.reverse();
  if (reverse && n === 1) ids.unshift(10); // Native pinned opening post remains source-ordered.
  const body = ids
    .map(
      (id) =>
        `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Reader Nine</a></div><a id="postnum${id}" href="${target(n, reverse)}#pid${id}">${id === 10 ? "-1#" : `${id}#`}</a><div class="pcb"><p>${`Actual post ${id}. `.repeat(id === 10 ? 2 : 100)}</p></div></div>`,
    )
    .join("");
  return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">Visible thread checks</h1>${body}</div><div class="pg">${n > 1 ? `<a class="prev" href="${target(n - 1, reverse)}">Previous</a>` : ""}${Array.from(
    { length: total },
    (_, i) => i + 1,
  )
    .map((p) =>
      p === n
        ? `<strong>${p}</strong>`
        : `<a href="${target(p, reverse)}">${p}</a>`,
    )
    .join(
      "",
    )}<label><input name="custompage" value="${n}" onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=42&ordertype=${reverse ? 1 : 2}&page='+this.value;; doane(event);}"><span title="共 ${total} 页"> / ${total} 页</span></label>${n < total ? `<a class="nxt" href="${target(n + 1, reverse)}">Next</a>` : ""}</div>`;
}
async function open(
  page: Page,
  n = 3,
  reverse = false,
  response: (n: number, url: URL) => string | Promise<string> = (n) =>
    fixture(n, reverse),
) {
  const requests: { url: string; at: number }[] = [];
  ledgers.set(page, requests);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const r = route.request(),
      u = new URL(r.url());
    if (u.pathname === "/__checks.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (r.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__checks.js"></script></body></html>`,
      });
    requests.push({ url: r.url(), at: Date.now() });
    return route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: await response(Number(u.searchParams.get("page") ?? 1), u),
    });
  });
  await page.goto(target(n, reverse));
  await expect(
    page.getByRole("heading", { name: "Visible thread checks", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  return requests;
}
async function check(page: Page) {
  const menu = await openThreadMore(page);
  await menu
    .getByRole("menuitem", { name: "Check for new posts", exact: true })
    .click();
}
test.afterEach(async ({ page }, info) => {
  if (!ledgers.has(page)) return;
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("checks.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  if (await page.locator(".reading-pane").count())
    await info.attach("reading.json", {
      body: JSON.stringify(await readableLines(page)),
      contentType: "application/json",
    });
});

test("UI89.ascending-boundary: newest icon checks actual source while Settings opt-in starts off", async ({
  page,
}) => {
  let added = 0;
  const requests = await open(page, 3, false, (n) => fixture(n, false, added));
  const icon = page.getByRole("button", {
    name: "Check for new posts",
    exact: true,
  });
  await expect(icon).toHaveCount(1);
  expect(await icon.locator("svg").count()).toBe(1);
  const positions = await icon.evaluate((button) => ({
    top: button.getBoundingClientRect().top,
    last: button
      .parentElement!.querySelector("article:last-of-type")!
      .getBoundingClientRect().bottom,
  }));
  expect(positions.top).toBeGreaterThanOrEqual(positions.last);
  await openSettings(page);
  await expect(
    page.getByRole("dialog").getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    }),
  ).not.toBeChecked();
  await closeSettingsToWorkspace(page);
  await page.locator("#pid301").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 20;
  });
  const before = await readableLines(page);
  added = 1;
  await check(page);
  await expect(page.locator("#pid303")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  expectPreservedReadingLine(before, await readableLines(page));
  await check(page);
  await expect.poll(() => requests.length).toBe(3);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
});

for (const reverse of [false, true]) {
  test(`UI89.distant-${reverse}: intermediate checks establish a truthful baseline, stage only new identities and reveal deliberately`, async ({
    page,
  }) => {
    let added = 0;
    const requests = await open(page, 2, reverse, (n) =>
      fixture(n, reverse, added),
    );
    await expect(
      page
        .locator(".reading-pane")
        .getByRole("button", { name: "Check for new posts", exact: true }),
    ).toHaveCount(0);
    await openSettings(page);
    const toggle = page.getByRole("dialog").getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    });
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();
    await closeSettingsToWorkspace(page);
    await page.locator("#pid201").evaluate((post) => {
      const p = post.closest(".reading-pane")!;
      p.scrollTop +=
        post.getBoundingClientRect().top - p.getBoundingClientRect().top + 20;
    });
    const before = await readableLines(page);
    await check(page);
    await expectThreadCheckMode(page, "Newest baseline established");
    await expect(
      page.getByRole("button", { name: /^New replies/ }),
    ).toHaveCount(0);
    await expect(page.locator(".reading-pane article")).toHaveCount(3);
    expectPreservedReadingLine(before, await readableLines(page));
    added = 1;
    await check(page);
    await expect(
      page.getByRole("button", { name: "New replies (1)", exact: true }),
    ).toBeVisible();
    await expect(page.locator("#pid303")).toHaveCount(0);
    expectPreservedReadingLine(before, await readableLines(page));
    await check(page);
    await expect.poll(() => requests.length).toBe(4);
    await expect(
      page.getByRole("button", { name: "New replies (1)", exact: true }),
    ).toBeVisible();
    expect(
      requests.map((r) => new URL(r.url).searchParams.get("page")),
    ).toEqual([
      "2",
      reverse ? "1" : "3",
      reverse ? "1" : "3",
      reverse ? "1" : "3",
    ]);
    await page
      .getByRole("button", { name: "New replies (1)", exact: true })
      .click();
    await expect(page.locator("#pid303")).toBeInViewport();
    await expect(page.locator("#pid201")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^New replies/ }),
    ).toHaveCount(0);
  });
}

for (const distance of [64, 65]) {
  test(`UI89.reverse-${distance}: source-ordered pinned posts remain unique and newest follow uses the top64px boundary`, async ({
    page,
  }) => {
    let added = 0;
    await open(page, 1, true, (n) => fixture(n, true, added));
    const pane = page.locator(".reading-pane");
    expect(
      await pane.locator("article").evaluateAll((p) => p.map((n) => n.id)),
    ).toEqual(["pid10", "pid302", "pid301", "pid300"]);
    const icon = pane.getByRole("button", {
      name: "Check for new posts",
      exact: true,
    });
    const geometry = await icon.evaluate((b) => ({
      bottom: b.getBoundingClientRect().bottom,
      first: b.parentElement!.querySelector("#pid302")!.getBoundingClientRect()
        .top,
    }));
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.first);
    await pane.evaluate((p, d) => {
      const boundary = p.querySelector(".newest-check")!;
      p.scrollTop +=
        boundary.getBoundingClientRect().top -
        p.getBoundingClientRect().top +
        d;
    }, distance);
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    const before = await readableLines(page);
    added = 1;
    await check(page);
    await expect(pane.locator("#pid303")).toHaveCount(1);
    expect(
      await pane.locator("article").evaluateAll((p) => p.map((n) => n.id)),
    ).toEqual(["pid10", "pid303", "pid302", "pid301", "pid300"]);
    if (distance === 64) {
      await expect
        .poll(() =>
          pane.evaluate((p) =>
            Math.abs(
              p.querySelector(".newest-check")!.getBoundingClientRect().top -
                p.getBoundingClientRect().top,
            ),
          ),
        )
        .toBeLessThanOrEqual(1);
      await expect(
        page.getByRole("button", { name: /^New replies/ }),
      ).toHaveCount(0);
    } else {
      await test.info().attach("reverse-threshold-lines.json", {
        body: JSON.stringify({ before, after: await readableLines(page) }),
        contentType: "application/json",
      });
      expectPreservedReadingLine(before, await readableLines(page));
      await expect(
        page.getByRole("button", { name: "New replies (1)", exact: true }),
      ).toBeVisible();
    }
  });
}

for (const [size, language] of [
  [100, "en"],
  [150, "en"],
  [150, "zh-CN"],
] as const)
  test(`UI89.status-geometry-${size}-${language}: baseline/time in options and actionable status preserve the reading line`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    let added = 0,
      failed = false;
    await open(page, 2, false, (n) =>
      failed
        ? "<html><body>Unrecognized response</body></html>"
        : fixture(n, false, added),
    );
    if (size === 150) {
      await openSettings(page);
      await page
        .getByRole("slider", { name: "Text size", exact: true })
        .press("End");
      if (language !== "en")
        await page
          .getByRole("combobox", { name: "Interface language", exact: true })
          .selectOption(language);
      await closeSettingsToWorkspace(page);
    }
    const runCheck = async () => {
      if (language === "en") return check(page);
      await page
        .getByRole("button", { name: "更多主题选项", exact: true })
        .click();
      await page
        .getByRole("menuitem", { name: "检查新回复", exact: true })
        .click();
    };
    await page.locator("#pid201").evaluate((post) => {
      const p = post.closest(".reading-pane")!;
      p.scrollTop +=
        post.getBoundingClientRect().top - p.getBoundingClientRect().top + 35;
    });
    const before = await readableLines(page);
    const top = await page
      .locator(".reading-pane")
      .evaluate((p) => p.getBoundingClientRect().top);
    await runCheck();
    await page
      .getByRole("button", {
        name: language === "en" ? "More thread options" : "更多主题选项",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        language === "en" ? "Newest baseline established" : "已建立最新基准",
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      await page
        .locator(".reading-pane")
        .evaluate((p) => p.getBoundingClientRect().top),
    ).toBe(top);
    expectPreservedReadingLine(before, await readableLines(page));
    const checked = page.locator(".public-check-time time");
    const timestamp = await checked.getAttribute("datetime");
    const instant = new Date(timestamp!);
    expect(instant.toISOString()).toBe(timestamp);
    await expect(checked).toHaveAttribute(
      "aria-label",
      new RegExp(String(instant.getFullYear())),
    );
    await expect(checked).toContainText(
      instant.toLocaleDateString(language, {
        month: "numeric",
        day: "numeric",
      }),
    );
    await checked.focus();
    await expect(checked).toBeFocused();
    await page.keyboard.press("Escape");
    added = 1;
    await runCheck();
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "New replies (1)" : "新回复（1）",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page
        .locator(".reading-pane")
        .evaluate((p) => p.getBoundingClientRect().top),
    ).toBe(top);
    expectPreservedReadingLine(before, await readableLines(page));
    failed = true;
    await runCheck();
    await expect(
      page
        .locator(".public-check-state")
        .filter({ hasText: language === "en" ? "Check failed" : "检查失败" }),
    ).toBeVisible();
    expect(
      await page
        .locator(".reading-pane")
        .evaluate((p) => p.getBoundingClientRect().top),
    ).toBe(top);
    expectPreservedReadingLine(before, await readableLines(page));
  });

test("UI89.reverse-range: pinned source prefix stays unique after older-page merge and fresh newest check", async ({
  page,
}) => {
  let added = 0;
  await open(page, 1, true, (n) =>
    fixture(n, true, added).replace(
      n === 2 ? '<div id="post_202">' : "__absent__",
      n === 2
        ? '<div id="post_10"><div class="authi"><a href="home.php?mod=space&uid=9">Reader Nine</a></div><a id="postnum10">-1#</a><div class="pcb"><p>Repeated pinned content</p></div></div><div id="post_202">'
        : "",
    ),
  );
  const pane = page.locator(".reading-pane");
  await pane.evaluate((p) => (p.scrollTop = p.scrollHeight));
  await expect(pane.locator("#pid200")).toHaveCount(1);
  await expect(pane.locator("#pid10")).toHaveCount(1);
  expect(
    await pane.locator("article").evaluateAll((p) => p.map((n) => n.id)),
  ).toEqual([
    "pid10",
    "pid302",
    "pid301",
    "pid300",
    "pid202",
    "pid201",
    "pid200",
  ]);
  const before = await readableLines(page);
  added = 1;
  await check(page);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  expectPreservedReadingLine(before, await readableLines(page));
  expect(
    await pane.locator("article").evaluateAll((p) => p.map((n) => n.id)),
  ).toEqual([
    "pid10",
    "pid303",
    "pid302",
    "pid301",
    "pid300",
    "pid202",
    "pid201",
    "pid200",
  ]);
  await page
    .getByRole("button", { name: "New replies (1)", exact: true })
    .click();
  await expect(pane.locator("#pid303")).toBeInViewport();
});

test("UI89.stage-ordinary-refresh: unrelated loaded-page refresh does not discard a staged newest arrival", async ({
  page,
}) => {
  let added = 0,
    edited = false;
  await open(page, 2, false, (n) =>
    fixture(n, false, added).replace(
      "Actual post 201.",
      edited ? "Edited visible post 201." : "Actual post 201.",
    ),
  );
  await check(page);
  await expectThreadCheckMode(page, "Newest baseline established");
  added = 1;
  await check(page);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  edited = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(page.locator("#pid201")).toContainText(
    "Edited visible post 201.",
  );
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#pid303")).toHaveCount(0);
});

test("UI89.stale-check: a delayed newest check cannot replace a deliberate page jump", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  let hold = false;
  const requests = await open(page, 2, false, async (n) => {
    if (n === 3 && hold) await held;
    return fixture(n, false, 1);
  });
  hold = true;
  await check(page);
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toBeVisible();
  await confirmThreadPage(page, 1);
  await expect(page.locator("#pid100")).toHaveCount(1);
  release();
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#pid303")).toHaveCount(0);
  expect(requests.map((r) => new URL(r.url).searchParams.get("page"))).toEqual([
    "2",
    "3",
    "1",
  ]);
});

test("UI89.account-check: a changed-account newest response invalidates prior account content", async ({
  page,
}) => {
  let changed = false;
  await open(page, 2, false, (n) =>
    changed
      ? fixture(n)
          .replace("uid=7", "uid=8")
          .replace("Reader Seven", "Reader Eight")
      : fixture(n),
  );
  changed = true;
  await check(page);
  await expect(page.locator("#pid201")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^New replies/ })).toHaveCount(
    0,
  );
});

test("UI89.boundary-collision: pending adjacent history excludes manual newest checks and then restores access", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  let hold = false;
  const requests = await open(page, 2, false, async (n) => {
    if (n === 1 && hold) await held;
    return fixture(n);
  });
  hold = true;
  await loadThreadRange(page, "earlier");
  await check(page);
  expect(requests).toHaveLength(2);
  release();
  await expect(page.locator("#pid100")).toHaveCount(1);
  await check(page);
  await expectThreadCheckMode(page, "Newest baseline established");
  expect(requests).toHaveLength(3);
});

test("UI89.unqualified: unknown native boundaries and absent numeric capability do not invent a newest read target", async ({
  page,
}) => {
  const requests = await open(page, 2, false, (n) =>
    fixture(n).replace(/<div class="pg">[\s\S]*/, ""),
  );
  await openSettings(page);
  await expect(
    page.getByRole("dialog").getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByText("Open a supported thread or board to enable checks.", {
      exact: true,
    }),
  ).toBeVisible();
  await closeSettingsToWorkspace(page);
  await expect(
    (await openThreadMore(page)).getByRole("menuitem", {
      name: "Check for new posts",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test("UI89.real-timer: reverse intermediate opt-in waits120seconds, modal pause resumes fresh and opt-out stops a complete interval", async ({
  page,
}) => {
  test.setTimeout(390_000);
  let added = 0;
  const requests = await open(page, 2, true, (n) => fixture(n, true, added));
  await check(page);
  await expectThreadCheckMode(page, "Newest baseline established");
  await openSettings(page);
  const toggle = page.getByRole("dialog").getByRole("checkbox", {
    name: "Check every 2 minutes while active",
    exact: true,
  });
  await toggle.check();
  added = 1;
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(2);
  await closeSettingsToWorkspace(page);
  const resumed = Date.now();
  await expectThreadCheckMode(page, "Checks enabled · every 2 minutes");
  await page.waitForTimeout(118_000);
  expect(requests).toHaveLength(2);
  await expect.poll(() => requests.length, { timeout: 6000 }).toBe(3);
  expect(requests[2]!.at - resumed).toBeGreaterThanOrEqual(119_000);
  await expect(
    page.getByRole("button", { name: "New replies (1)", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#pid303")).toHaveCount(0);
  await openSettings(page);
  await toggle.uncheck();
  await closeSettingsToWorkspace(page);
  await page.waitForTimeout(121_000);
  expect(requests).toHaveLength(3);
});

test("UI89.growing-target: a newly offered native newest page is followed once and only observed new identities are staged", async ({
  page,
}, info) => {
  let total = 3;
  const requests = await open(page, 2, false, (n) =>
    fixture(n, false, 0, total),
  );
  const committed = page.url();
  const initialHistory = await page.evaluate(() => history.length);
  const latest = page.getByRole("link", {
    name: "Jump to latest",
    exact: true,
  });
  await check(page);
  await expectThreadCheckMode(page, "Newest baseline established");
  await expect.soft(latest).toHaveAttribute("href", `${target(3)}#pid302`, {
    timeout: 1500,
  });
  total = 4;
  await check(page);
  await expect(
    page.getByRole("button", { name: "New replies (3)", exact: true }),
  ).toBeVisible();
  expect(requests.map((r) => new URL(r.url).searchParams.get("page"))).toEqual([
    "2",
    "3",
    "3",
    "4",
  ]);
  await expect(page.locator("#pid400")).toHaveCount(0);
  await expect(page.locator("#pid201")).toHaveCount(1);
  expect(page.url()).toBe(committed);
  expect(await page.evaluate(() => history.length)).toBe(initialHistory);
  const stagedHref = (await latest.count())
    ? await latest.getAttribute("href")
    : null;
  await info.attach("latest-targets.json", {
    body: JSON.stringify({ committed, initialHistory, stagedHref }),
    contentType: "application/json",
  });
  await expect(latest).toHaveAttribute("href", `${target(4)}#pid402`, {
    timeout: 1500,
  });
});

test("J122.latest-refresh-growth: only a qualified exact Post is offered after explicit refresh disproves the old end", async ({
  page,
}, info) => {
  let total = 3;
  const requests = await open(page, 3, false, (n) =>
    fixture(n, false, 0, total),
  );
  const latest = page.getByRole("link", {
    name: "Jump to latest",
    exact: true,
  });
  const historyLength = await page.evaluate(() => history.length);
  await expect(latest).toHaveAttribute("href", `${target(3)}#pid302`);
  total = 4;
  await clickThreadTool(page, "Refresh thread");
  const pages = await openThreadPages(page);
  await expect(
    pages.getByRole("button", { name: "Load later", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  const staleHref = (await latest.count())
    ? await latest.getAttribute("href")
    : null;
  await expect.soft(latest).toHaveCount(0, { timeout: 1500 });
  await check(page);
  await expect(
    page.getByRole("button", { name: "New replies (3)", exact: true }),
  ).toBeVisible();
  expect(
    requests.map((request) => new URL(request.url).searchParams.get("page")),
  ).toEqual(["3", "3", "4"]);
  await expect(page.locator("#pid302")).toBeAttached();
  await expect(page.locator("#pid402")).toHaveCount(0);
  await loadThreadRange(page, "later");
  const post = page.locator("#pid402");
  await expect(post).toBeAttached();
  const loadedHref = await latest.getAttribute("href");
  await expect(latest).toHaveAttribute("href", `${target(4)}#pid402`);
  const beforeJump = requests.length;
  await latest.click();
  await expect(post).toBeFocused();
  expect(requests).toHaveLength(beforeJump);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await info.attach("latest-refresh.json", {
    body: JSON.stringify({
      staleHref,
      loadedHref,
      beforeJump,
      historyLength,
      url: page.url(),
    }),
    contentType: "application/json",
  });
});

test("J122.latest-loaded-growth: loading a terminal range makes its exact Latest revocable by a later refresh", async ({
  page,
}, info) => {
  let total = 4;
  const requests = await open(page, 3, false, (n) =>
    fixture(n, false, 0, total),
  );
  const latest = page.getByRole("link", {
    name: "Jump to latest",
    exact: true,
  });
  await clickThreadTool(page, "Refresh thread");
  await expect.poll(() => requests.length).toBe(2);
  await loadThreadRange(page, "later");
  await expect(page.locator("#pid402")).toBeAttached();
  await expect(latest).toHaveAttribute("href", `${target(4)}#pid402`);
  total = 5;
  await clickThreadTool(page, "Refresh thread");
  const pages = await openThreadPages(page);
  await expect(
    pages.getByRole("button", { name: "Load later", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("#pid402")).toBeAttached();
  await expect(page.locator("#pid502")).toHaveCount(0);
  await info.attach("later-range-latest.txt", {
    body: await pages.ariaSnapshot(),
    contentType: "text/plain",
  });
  await page.keyboard.press("Escape");
  await expect(latest).toHaveCount(0, { timeout: 1500 });
  expect(
    requests.map((request) => new URL(request.url).searchParams.get("page")),
  ).toEqual(["3", "3", "4", "4"]);
});

test("UI89.moving-target: a second changed newest boundary stops bounded checking and exposes deliberate recovery", async ({
  page,
}) => {
  let moving = false;
  const requests = await open(page, 2, false, (n) =>
    fixture(n, false, 0, moving ? (n === 4 ? 5 : 4) : 3),
  );
  await check(page);
  await expectThreadCheckMode(page, "Newest baseline established");
  moving = true;
  await check(page);
  await expect(page.getByText(/Check failed · wait 2 min/)).toBeVisible();
  expect(requests).toHaveLength(4);
  await expect(page.locator("#pid201")).toHaveCount(1);
});

test("UI89.unknown-floor: ambiguous prefix metadata preserves source order and does not invent pinned classification", async ({
  page,
}) => {
  await open(page, 1, true, (n) =>
    fixture(n, true).replace("-1#", "Unverified floor"),
  );
  const g = await page.locator(".newest-check").evaluate((b) => ({
    bottom: b.getBoundingClientRect().bottom,
    first: b.parentElement!.querySelector("article")!.getBoundingClientRect()
      .top,
  }));
  expect(g.bottom).toBeLessThanOrEqual(g.first);
  await expect(page.locator("#pid10")).toBeVisible();
});

test("UI89.composition-pause: composing in the retained reply pauses checks without changing source", async ({
  page,
}) => {
  const account =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
  await open(page, 3, false, (n, u) =>
    u.searchParams.get("mod") === "post"
      ? account +
        '<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="TEST_ONLY"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>'
      : '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></div>' +
        fixture(n),
  );
  await setAutomaticChecks(page, true);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Unsent unchanged source");
  await source.dispatchEvent("compositionstart", { data: "測" });
  await expectThreadCheckMode(page, "Checks paused");
  await expect(source).toHaveValue("Unsent unchanged source");
  await source.dispatchEvent("compositionend", { data: "測" });
  await openThreadMore(page);
  await source.click();
  await expect(source).toBeFocused();
  await expectThreadCheckMode(page, "Checks enabled · every 2 minutes");
});

for (const timed of [false, true])
  test(`UI89.retained-${timed ? "real-timer" : "visible"}: a retained public reader stays active beside a board while hidden reading pauses`, async ({
    page,
  }) => {
    if (timed) test.setTimeout(280_000);
    const member =
      '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
    const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
    let added = 0;
    const requests = await open(page, 2, false, (n, u) =>
      u.searchParams.get("mod") === "forumdisplay"
        ? `${member}<div id="ct"><h1><a href="${boardURL}">Board Five</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_80"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=80">Other board thread</a></th><td class="by"><cite>Writer</cite></td></tr></tbody></table>`
        : `<div id="pt"><a href="${boardURL}">Board Five</a></div>` +
          fixture(n, false, added),
    );
    await check(page);
    await setAutomaticChecks(page, true);
    await page.locator(".reader-breadcrumb .board-context-link").click();
    await expect(page.locator(".results-pane .subject")).toHaveText(
      "Other board thread",
    );
    const boardLocation = page.url();
    await page.waitForTimeout(1200);
    await expectThreadCheckMode(page, "Checks enabled · every 2 minutes");
    await page.locator("#pid201").evaluate((post) => {
      const p = post.closest(".reading-pane")!;
      p.scrollTop +=
        post.getBoundingClientRect().top - p.getBoundingClientRect().top + 35;
    });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    await expect(page.locator(".conversation-heading")).toHaveAttribute(
      "data-compact",
      "true",
    );
    let before = await readableLines(page);
    added = 1;
    if (timed) {
      await page.setViewportSize({ width: 390, height: 700 });
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
      await expect(page.locator(".reading-pane")).toBeHidden();
      await expect(page.locator(".public-check-state")).toBeHidden();
      await page.waitForTimeout(121_000);
      expect(
        requests.filter(
          (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
        ),
      ).toHaveLength(2);
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect(page.locator(".reading-pane")).toBeVisible();
      await expectThreadCheckMode(page, "Checks enabled · every 2 minutes");
      before = await readableLines(page);
      const resumed = Date.now();
      await page.waitForTimeout(118_000);
      expect(
        requests.filter(
          (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
        ),
      ).toHaveLength(2);
      await expect
        .poll(
          () =>
            requests.filter(
              (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
            ).length,
          { timeout: 6000 },
        )
        .toBe(3);
      expect(requests.at(-1)!.at - resumed).toBeGreaterThanOrEqual(118_000);
    } else await check(page);
    await expect(
      page.getByRole("button", { name: "New replies (1)", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".results-pane .subject")).toHaveText(
      "Other board thread",
    );
    expect(page.url()).toBe(boardLocation);
    await expect(
      page.getByRole("link", { name: "Continue in native forum", exact: true }),
    ).toHaveAttribute("href", `${boardURL}&tsdm-native=1`);
    await expect(page.locator("#pid303")).toHaveCount(0);
    expectPreservedReadingLine(before, await readableLines(page));
    if (!timed) {
      await page.setViewportSize({ width: 390, height: 700 });
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
      await expect(page.locator(".reading-pane")).toBeHidden();
      await page.waitForTimeout(1200);
      // The hidden reader's status is still DOM-observable; only visibility is hidden.
      await expect(page.locator(".public-check-state")).toHaveText("");
    }
    expect(
      requests.filter(
        (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
      ),
    ).toHaveLength(3);
  });

test("UI89.compact-breadcrumb-focus: keyboard entry retains compact breadcrumb geometry through a subsequent pointer gesture", async ({
  page,
}) => {
  await open(
    page,
    2,
    false,
    (n) =>
      '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></div>' +
      fixture(n),
  );
  await page.locator("#pid201").evaluate((post) => {
    const p = post.closest(".reading-pane")!;
    p.scrollTop +=
      post.getBoundingClientRect().top - p.getBoundingClientRect().top + 35;
  });
  await expect(page.locator(".conversation-heading")).toHaveAttribute(
    "data-compact",
    "true",
  );
  const more = page.getByRole("button", {
    name: "More thread options",
    exact: true,
  });
  await more.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  const breadcrumb = page.locator(".reader-breadcrumb .board-context-link");
  await expect(breadcrumb).toBeFocused();
  await expect
    .poll(async () => (await breadcrumb.boundingBox())!.width)
    .toBeGreaterThan(1);
  const height = await page
    .locator(".conversation-heading")
    .evaluate((e) => e.getBoundingClientRect().height);
  await more.click();
  await expect(
    page.getByRole("menu", {
      name: /^(More thread options|Thread options)$/,
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page
      .locator(".conversation-heading")
      .evaluate((e) => e.getBoundingClientRect().height),
  ).toBe(height);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  expect(
    await page
      .locator(".conversation-heading")
      .evaluate((e) => e.getBoundingClientRect().height),
  ).toBe(height);
});

for (const restored of [false, true])
  test(`REVIEW.account-footer-thread-${restored}: an unknown newest response retains public posts but cannot retain confirmed member wording`, async ({
    page,
  }, info) => {
    let unknown = false;
    const requests = await open(page, 2, false, (n) =>
      unknown ? fixture(n).replace(/<div id="um">.*?<\/div>/, "") : fixture(n),
    );
    const label = page.locator(".navigation-account");
    await expect(label).toHaveText("Signed in as Reader Seven");
    if (restored) {
      await page.reload();
      await expect(label).toHaveText("Snapshot from Reader Seven");
      expect(requests).toHaveLength(1);
      await expect(
        page.getByText(
          "Restored snapshot — account and content have not been rechecked.",
          { exact: true },
        ),
      ).toBeVisible();
    }
    const original = await page
      .getByRole("article")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    unknown = true;
    await check(page);
    await expect(
      page.locator(".public-check-state").filter({ hasText: "Check failed" }),
    ).toBeVisible();
    const observed = await label.textContent();
    await expect.soft(label).toHaveText("Account not yet confirmed");
    if (restored) {
      await expect
        .soft(
          page.getByText(
            "Restored snapshot — retained content has not been rechecked.",
            { exact: true },
          ),
        )
        .toBeVisible();
      await expect
        .soft(
          page.getByText(
            "Restored snapshot — account and content have not been rechecked.",
            { exact: true },
          ),
        )
        .toHaveCount(0);
    }
    expect(
      await page
        .getByRole("article")
        .evaluateAll((nodes) => nodes.map((node) => node.id)),
    ).toEqual(original);
    unknown = false;
    await confirmThreadPage(page, 1);
    await expect(label).toHaveText("Signed in as Reader Seven");
    expect(requests).toHaveLength(3);
    await info.attach("footer-observation.json", {
      body: JSON.stringify({
        restored,
        observed,
        confirmed: await label.textContent(),
        requests,
      }),
      contentType: "application/json",
    });
  });

test("UX99.reader-quiet-cycle: mode lives in options, boundaries beside posts and transient status preserves text", async ({
  page,
}, info) => {
  let delayed = false;
  let release: (() => void) | undefined;
  const requests = await open(page, 1, false, async (n) => {
    if (delayed)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return fixture(n, false, 0, 1);
  });
  const pane = page.locator(".reading-pane");
  await expect(page.locator(".public-history-controls")).toHaveCount(0);
  await expect(page.getByText("Manual refresh", { exact: true })).toHaveCount(
    0,
  );
  const menu = await openThreadMore(page);
  await expect(menu.getByText("Manual refresh", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "More thread options", exact: true }),
  ).toBeFocused();
  const edge = pane.getByText("Latest known content", { exact: true });
  await expect(edge).toBeAttached();
  const geometry = await edge.evaluate((node) => ({
    top: node.getBoundingClientRect().top,
    last: node
      .closest(".reading-pane")!
      .querySelector("article:last-of-type")!
      .getBoundingClientRect().bottom,
  }));
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.last);
  await pane.evaluate((node) => {
    node.scrollTop = 500;
  });
  const before = await readableLines(page);
  delayed = true;
  await check(page);
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toBeAttached();
  expectPreservedReadingLine(before, await readableLines(page));
  release!();
  await expect(page.locator(".public-history-controls")).toHaveCount(0);
  expectPreservedReadingLine(before, await readableLines(page));
  expect(requests).toHaveLength(2);
  await pane.evaluate((node) => {
    node.scrollTop = 0;
  });
  await check(page);
  await expect(
    page.getByText("Checking for new replies…", { exact: true }),
  ).toBeVisible();
  expect(await pane.evaluate((node) => node.scrollTop)).toBe(0);
  release!();
  await expect(page.locator(".public-history-controls")).toHaveCount(0);
  expect(await pane.evaluate((node) => node.scrollTop)).toBe(0);
  await info.attach("quiet-reader.json", {
    body: JSON.stringify({ geometry, before, requests }),
    contentType: "application/json",
  });
});

test("UX99.reader-failure: named Retry, native Details and removal of failure preserve the actual text", async ({
  page,
}, info) => {
  let broken = false;
  let release: (() => void) | undefined;
  const requests = await open(page, 1, false, async (n) => {
    if (broken) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return "<html><body>Unrecognized response</body></html>";
    }
    return fixture(n, false, 0, 1);
  });
  const pane = page.locator(".reading-pane");
  await pane.evaluate((node) => {
    node.scrollTop = 500;
  });
  const before = await readableLines(page);
  broken = true;
  await check(page);
  expectPreservedReadingLine(before, await readableLines(page));
  release!();
  await expect(page.getByText(/Check failed · wait 2 min/)).toBeAttached();
  expectPreservedReadingLine(before, await readableLines(page));
  await expect(
    page.getByRole("button", { name: "Retry check", exact: true }),
  ).toBeDisabled();
  await pane.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.evaluate(() => {
    document.body.onkeydown = (event) =>
      event.keyCode === 27 ? false : undefined;
  });
  const details = page.locator(".public-check-actions summary");
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Use Check for new posts to retry after the wait.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(details.locator("..")).not.toHaveAttribute("open", "");
  await expect(details).toBeFocused();
  expect(requests).toHaveLength(2);
  await info.attach("failure-reader.json", {
    body: JSON.stringify({ before, requests }),
    contentType: "application/json",
  });
});

for (const reverse of [false, true])
  test(`UX99.boundary-${reverse}: actual endpoints follow posts including native pinned opener`, async ({
    page,
  }, info) => {
    await open(page, 1, reverse, (n) => fixture(n, reverse, 0, 1));
    const positions = await page.locator(".reading-pane").evaluate((node) => ({
      posts: [...node.querySelectorAll("article")].map((p) => ({
        id: p.id,
        top: p.getBoundingClientRect().top,
        bottom: p.getBoundingClientRect().bottom,
      })),
      edges: [...node.querySelectorAll(".public-history-boundary")].map(
        (e) => ({
          direction: e.getAttribute("data-direction"),
          text: e.textContent,
          top: e.getBoundingClientRect().top,
          bottom: e.getBoundingClientRect().bottom,
        }),
      ),
    }));
    const earlier = positions.edges.find((e) => e.direction === "earlier")!;
    const later = positions.edges.find((e) => e.direction === "later")!;
    expect(earlier.text).toContain("Beginning of thread");
    expect(later.text).toContain("Latest known content");
    if (reverse) {
      expect(later.top).toBeGreaterThanOrEqual(positions.posts[0]!.bottom);
      expect(later.bottom).toBeLessThanOrEqual(positions.posts[1]!.top);
      expect(earlier.top).toBeGreaterThanOrEqual(
        positions.posts.at(-1)!.bottom,
      );
    } else {
      expect(earlier.bottom).toBeLessThanOrEqual(positions.posts[0]!.top);
      expect(later.top).toBeGreaterThanOrEqual(positions.posts.at(-1)!.bottom);
    }
    await info.attach("edges.json", {
      body: JSON.stringify(positions),
      contentType: "application/json",
    });
  });

test("UX99.unknown-boundaries: unverified edges remain beside loaded posts and checks unavailable in options", async ({
  page,
}) => {
  const requests = await open(page, 2, false, (n) =>
    fixture(n).replace(/<div class="pg">[\s\S]*/, ""),
  );
  const pane = page.locator(".reading-pane");
  await expect(
    pane.getByText("Earlier boundary unverified", { exact: true }),
  ).toBeAttached();
  await expect(
    pane.getByText("Later boundary unverified", { exact: true }),
  ).toBeAttached();
  await expect(
    page.getByText("Beginning of thread", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Latest known content", { exact: true }),
  ).toHaveCount(0);
  await expect(
    (await openThreadMore(page)).getByText(
      "Checks unavailable: no supported newest-page target.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
});
