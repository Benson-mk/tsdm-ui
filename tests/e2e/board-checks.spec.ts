import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const account = (id = "7") =>
  `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Reader ${id}</a></strong></div>`;
const board = (ids = [42, 43, 44], member = "7", page = 1, suffix = "") =>
  `${account(member)}<div id="ct"><h1>Music board</h1><table id="threadlisttableid">${ids.map((id) => `<tbody id="normalthread_${id}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${id}">Thread ${id}</a></th><td class="by"><cite>Reader Eight</cite><em>today</em></td><td class="num"><a>1</a><em>20</em></td></tr></tbody>`).join("")}</table></div><ul id="thread_types"><li><a href="${boardURL}&filter=typeid&typeid=3">Music category</a></li></ul><div class="pg"><strong>${page}</strong><a href="${boardURL}${suffix}&page=${page === 1 ? 2 : 1}">${page === 1 ? 2 : 1}</a></div>`;
const thread = `${account()}<div id="pt"><a href="${boardURL}">Music board</a></div><div id="postlist"><h1 id="thread_subject">Thread 42</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Reader Eight</a></div><a id="postnum101" href="forum.php?mod=viewthread&tid=42#pid101">1#</a><div class="pcb">${"<p>Retained reading paragraph with unchanged source.</p>".repeat(40)}</div></div></div><div class="pg"><strong>1</strong><label><input name="custompage" value="1" onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=42&page='+this.value;; doane(event);}"><span title="共 1 页"> / 1 页</span></label></div>`;
const ledgers = new WeakMap<Page, { url: string; at: number }[]>();
async function open(
  page: Page,
  response: (url: URL) => string | Promise<string>,
  target = boardURL,
) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const requests: { url: string; at: number }[] = [];
  ledgers.set(page, requests);
  await page.context().route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (req.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    requests.push({ url: url.href, at: Date.now() });
    return route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: await response(url),
    });
  });
  await page.goto(target);
  await expect(
    page.getByRole("heading", { name: "Music board", exact: true }),
  ).toBeVisible();
  return requests;
}
const rows = (page: Page) =>
  page.locator(".thread-row").evaluateAll((nodes) =>
    nodes.map((n) => ({
      id: n.getAttribute("data-thread-id"),
      top: n.getBoundingClientRect().top,
    })),
  );
const refresh = (page: Page) =>
  page
    .getByRole("button", { name: "Check for new threads", exact: true })
    .click();
test.afterEach(async ({ page }, info) => {
  if (!ledgers.has(page)) return;
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("board-state.json", {
    body: JSON.stringify({ rows: await rows(page), url: page.url() }),
    contentType: "application/json",
  });
  await info.attach("board.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UI90.stage-reveal: checks stage stable new identities without moving rows or retained reading; explicit reveal merges once", async ({
  page,
}, info) => {
  let ids = [42, 43, 44];
  const requests = await open(page, (url) =>
    url.searchParams.get("mod") === "viewthread" ? thread : board(ids),
  );
  await page.locator('[data-thread-id="42"] .subject').click();
  await expect(page.locator("#pid101")).toBeVisible();
  const original = await rows(page),
    url = page.url();
  const reader = await page.locator("#pid101").boundingBox();
  ids = [45, 44, 42, 43, 45];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  expect(await rows(page)).toEqual(original);
  expect(await page.locator("#pid101").boundingBox()).toEqual(reader);
  expect(page.url()).toBe(url);
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  expect(await rows(page)).toEqual(original);
  await page
    .getByRole("button", { name: "Show 1 new thread", exact: true })
    .click();
  await expect(page.locator(".thread-row")).toHaveCount(4);
  expect((await rows(page)).map((row) => row.id)).toEqual([
    "45",
    "44",
    "42",
    "43",
  ]);
  await expect(page.locator('[data-thread-id="42"] .subject')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.locator("#pid101")).toBeVisible();
  await refresh(page);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?$/ }),
  ).toHaveCount(0);
  expect(
    requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "forumdisplay",
    ),
  ).toHaveLength(4);
  await info.attach("before.json", {
    body: JSON.stringify({ original, reader, url }),
    contentType: "application/json",
  });
});

test("UI90.filtered-distant: source first-page baseline ignores old rows and explicit reveal preserves filter/order", async ({
  page,
}) => {
  let ids = [42, 43, 44];
  const suffix = "&filter=typeid&typeid=3&orderby=dateline";
  const requests = await open(
    page,
    (url) =>
      board(
        url.searchParams.get("page") === "2" ? [60, 61] : ids,
        "7",
        Number(url.searchParams.get("page") ?? 1),
        suffix,
      ),
    boardURL + suffix + "&page=2",
  );
  await refresh(page);
  await expect(
    page.getByText("First-page baseline established.", { exact: true }),
  ).toBeVisible();
  expect((await rows(page)).map((r) => r.id)).toEqual(["60", "61"]);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  ids = [46, 42, 43];
  await refresh(page);
  await page
    .getByRole("button", {
      name: "Show 1 new threads at first page",
      exact: true,
    })
    .click();
  expect((await rows(page)).map((r) => r.id)).toEqual(["46", "42", "43"]);
  for (const r of requests.slice(1)) {
    const u = new URL(r.url);
    expect(u.searchParams.get("page")).toBe("1");
    expect(u.searchParams.get("typeid")).toBe("3");
    expect(u.searchParams.get("orderby")).toBe("dateline");
  }
});

test("UI90.stale-context: a delayed original board check cannot stage into another filter", async ({
  page,
}) => {
  let delayed = false,
    release: () => void = () => {};
  const requests = await open(page, async (url) => {
    if (delayed && !url.searchParams.has("typeid")) {
      delayed = false;
      await new Promise<void>((resolve) => (release = resolve));
      return board([99, 42]);
    }
    return board(url.searchParams.has("typeid") ? [70, 71] : [42, 43]);
  });
  delayed = true;
  await refresh(page);
  await expect(
    page.getByText("Checking board…", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Music category", exact: true }).click();
  await expect(page.locator('[data-thread-id="70"]')).toBeVisible();
  release();
  await page.waitForTimeout(100);
  expect((await rows(page)).map((r) => r.id)).toEqual(["70", "71"]);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(3);
});

test("UI90.real-timer: shared opt-in checks a visible board with no reader and pauses a modal for a full interval", async ({
  page,
}) => {
  test.setTimeout(300000);
  const { openSettings, closeSettingsToWorkspace } =
    await import("./navigation-ui");
  let ids = [42, 43];
  const requests = await open(page, () => board(ids));
  await openSettings(page);
  const checkbox = page.getByRole("checkbox", {
    name: "Check every 2 minutes while active",
  });
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toBeEnabled();
  await checkbox.check();
  await closeSettingsToWorkspace(page);
  ids = [45, 42, 43];
  const started = Date.now();
  await expect
    .poll(() => requests.length, { timeout: 125000, intervals: [1000] })
    .toBe(2);
  expect(requests[1]!.at - started).toBeGreaterThanOrEqual(119000);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  await openSettings(page);
  await page.waitForTimeout(121000);
  expect(requests).toHaveLength(2);
  await checkbox.uncheck();
  await closeSettingsToWorkspace(page);
});

test("UI90.account: an account-changing check removes old staged identities and retained reader", async ({
  page,
}) => {
  let member = "7",
    ids = [42, 43];
  await open(page, (url) =>
    url.searchParams.get("mod") === "viewthread" ? thread : board(ids, member),
  );
  await page.locator('[data-thread-id="42"] .subject').click();
  ids = [45, 42];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  member = "8";
  await refresh(page);
  await expect(page.locator("#pid101")).toHaveCount(0);
  await expect(page.locator('[data-thread-id="45"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
});

test("UI90.edit-removal: edits, known row reorder and removed staged identities do not invent or retain arrivals", async ({
  page,
}) => {
  let ids = [42, 43, 44];
  await open(page, () => board(ids));
  ids = [44, 43, 42];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  ids = [45, 42, 43];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  ids = [44, 42, 43];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  expect((await rows(page)).map((r) => r.id)).toEqual(["42", "43", "44"]);
});

test("UI90.incomplete: incomplete rows fail visibly without moving retained list or offering success", async ({
  page,
}) => {
  let broken = false;
  await open(page, () =>
    broken
      ? account() +
        `<div id="ct"><h1>Music board</h1></div><table id="threadlisttableid"><tbody id="normalthread_99"><tr><th>Uninterpretable row</th></tr></tbody></table>`
      : board(),
  );
  const before = await rows(page);
  broken = true;
  await refresh(page);
  await expect(
    page.getByText("Board check failed.", { exact: true }),
  ).toBeVisible();
  expect(await rows(page)).toEqual(before);
  await page.locator(".board-check-details summary").click();
  await expect(
    page.getByText(/unrecognized or incomplete thread rows/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check for new threads", exact: true }),
  ).toBeDisabled();
});

test("UI90.unsupported: no same-context source first-page target leaves checks unavailable without guessed HTTP", async ({
  page,
}) => {
  const { openSettings } = await import("./navigation-ui");
  const requests = await open(
    page,
    () => board([60, 61], "7", 2, "&filter=typeid&typeid=99"),
    boardURL + "&filter=typeid&typeid=3&page=2",
  );
  await expect(
    page.getByRole("button", { name: "Check for new threads", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Board checks unavailable: no supported first-page target.",
      { exact: true },
    ),
  ).toBeVisible();
  await openSettings(page);
  await expect(
    page.getByRole("checkbox", { name: "Check every 2 minutes while active" }),
  ).toBeDisabled();
  expect(requests).toHaveLength(1);
});

test("UI90.ownership: a pending board check excludes reader checks and preparation cancels its stale completion", async ({
  page,
}) => {
  const { openThreadMore } = await import("./navigation-ui");
  let delayed = false,
    release: () => void = () => {};
  const requests = await open(page, async (url) => {
    if (url.searchParams.get("mod") === "viewthread") return thread;
    if (url.searchParams.get("mod") === "post")
      return `${account()}<div id="pt"><a href="${boardURL}">Music board</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;
    if (delayed) {
      delayed = false;
      await new Promise<void>((resolve) => (release = resolve));
      return board([99, 42, 43]);
    }
    return board();
  });
  await page.locator('[data-thread-id="42"] .subject').click();
  delayed = true;
  await refresh(page);
  const menu = await openThreadMore(page);
  await menu
    .getByRole("menuitem", { name: "Check for new posts", exact: true })
    .click();
  expect(
    requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
    ),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Complete source", exact: true }),
  ).toBeAttached();
  release();
  await page.waitForTimeout(100);
  await expect(page.getByText("Checking board…", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
});

test("UI90.real-timer-ownership: retained reader and board each check once serially; hidden board resumes after a fresh interval", async ({
  page,
}, info) => {
  test.setTimeout(420000);
  const { setAutomaticChecks } = await import("./navigation-ui");
  let active = 0,
    maximum = 0,
    ids = [42, 43];
  const requests = await open(page, async (url) => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((r) => setTimeout(r, 250));
    active--;
    return url.searchParams.get("mod") === "viewthread" ? thread : board(ids);
  });
  await page.locator('[data-thread-id="42"] .subject').click();
  await expect(page.locator("#pid101")).toBeVisible();
  const initial = await rows(page);
  await setAutomaticChecks(page, true);
  ids = [45, 42, 43];
  const started = Date.now();
  await expect
    .poll(() => requests.length, { timeout: 126000, intervals: [1000] })
    .toBe(4);
  expect(maximum).toBe(1);
  expect(requests[2]!.at - started).toBeGreaterThanOrEqual(119000);
  expect(requests[3]!.at - requests[2]!.at).toBeGreaterThanOrEqual(250);
  expect(await rows(page)).toEqual(initial);
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(page.locator(".results-pane")).toBeHidden();
  await page.waitForTimeout(121000);
  const boardReads = () =>
    requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "forumdisplay",
    );
  expect(boardReads()).toHaveLength(2);
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  const resumed = Date.now();
  await expect(page.locator(".results-pane")).toBeVisible();
  await page.waitForTimeout(118000);
  expect(boardReads()).toHaveLength(2);
  await expect
    .poll(() => boardReads().length, { timeout: 7000, intervals: [500] })
    .toBe(3);
  expect(boardReads()[2]!.at - resumed).toBeGreaterThanOrEqual(119000);
  expect(maximum).toBe(1);
  await setAutomaticChecks(page, false);
  await info.attach("ownership.json", {
    body: JSON.stringify({ maximum, started, resumed }),
    contentType: "application/json",
  });
});

test("UI90.real-timer-backoff: failed board checks preserve rows and require deliberate retry after 2 then 4 minutes", async ({
  page,
}) => {
  test.setTimeout(140000);
  let broken = false;
  const requests = await open(page, () =>
    broken
      ? account() +
        `<div id="ct"><h1>Music board</h1></div><table id="threadlisttableid"><tbody id="normalthread_99"><tr><th>Unsupported row</th></tr></tbody></table>`
      : board(),
  );
  const before = await rows(page);
  broken = true;
  await refresh(page);
  await page.locator(".board-check-details summary").click();
  await expect(
    page.getByText("Retry available in 2 minutes.", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(121000);
  expect(requests).toHaveLength(2);
  await refresh(page);
  await expect(
    page.getByText("Retry available in 4 minutes.", { exact: true }),
  ).toBeVisible();
  await page.locator(".board-check-details summary").click();
  expect(await rows(page)).toEqual(before);
});

for (const [width, language, size] of [
  [390, "en", 150],
  [390, "zh-CN", 150],
  [1280, "en", 100],
] as const)
  test(`UI90.presentation-${width}-${language}-${size}: status and count preserve row geometry and named actions`, async ({
    page,
  }) => {
    const { openSettings, closeSettingsToWorkspace } =
      await import("./navigation-ui");
    await page.setViewportSize({ width, height: 800 });
    let ids = [42, 43];
    await open(page, () => board(ids));
    await openSettings(page);
    await page.getByLabel("Text size").fill(String(size));
    await page
      .getByLabel("Interface language", { exact: true })
      .selectOption(language);
    await closeSettingsToWorkspace(page);
    const statusHeight = await page
      .locator(".board-filters")
      .evaluate(
        (node) =>
          node.getBoundingClientRect().top -
          node
            .parentElement!.querySelector(".board-heading")!
            .getBoundingClientRect().bottom,
      );
    expect(statusHeight).toBeLessThanOrEqual(140);
    const before = await rows(page);
    ids = [45, 42, 43];
    await page
      .getByRole("button", {
        name: language === "en" ? "Check for new threads" : "检查新主题",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "Show 1 new thread" : "显示 1 个新主题",
        exact: true,
      }),
    ).toBeVisible();
    expect(await rows(page)).toEqual(before);
  });

test("UI90.writing-recovery: reveal retains source node, selection and reading; acknowledged reload retains revealed rows and writing", async ({
  page,
}) => {
  let ids = [42, 43];
  const requests = await open(page, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? thread
      : url.searchParams.get("mod") === "post"
        ? `${account()}<div id="pt"><a href="${boardURL}">Music board</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>`
        : board(ids),
  );
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await source.fill("Unsent exact source with [b]meaning[/b].");
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(7, 19),
  );
  const handle = await source.elementHandle();
  const target = await page.locator(".writing-destination").textContent();
  ids = [45, 42, 43];
  await refresh(page);
  await page
    .getByRole("button", { name: "Show 1 new thread", exact: true })
    .click();
  expect(await source.evaluate((node, prior) => node === prior, handle)).toBe(
    true,
  );
  expect(
    await source.evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([7, 19]);
  await expect(source).toHaveValue("Unsent exact source with [b]meaning[/b].");
  expect(await page.locator(".writing-destination").textContent()).toBe(target);
  await expect(page.locator("#pid101")).toBeAttached();
  await source.dispatchEvent("compositionstart", { data: "測" });
  const before = requests.length;
  await refresh(page);
  expect(requests).toHaveLength(before);
  await source.dispatchEvent("compositionend", { data: "測" });
  await page.reload();
  await expect(page.locator('[data-thread-id="45"]')).toBeVisible();
  await expect(source).toHaveValue("Unsent exact source with [b]meaning[/b].");
  expect(requests).toHaveLength(before);
});

test("UI90.unknown-account: an unconfirmed account cannot retain a staged reveal from the prior member", async ({
  page,
}) => {
  let mode = 0;
  await open(page, () =>
    mode === 2
      ? board([99, 42]).replace(account(), "")
      : board(mode === 1 ? [45, 42] : [42, 43]),
  );
  mode = 1;
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  mode = 2;
  await refresh(page);
  await expect(
    page.getByText("Board check failed.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  expect((await rows(page)).map((row) => row.id)).toEqual(["42", "43"]);
});

test("UI90.other-account-observation: an unconfirmed reader response invalidates the board's staged member snapshot", async ({
  page,
}) => {
  const { clickThreadTool } = await import("./navigation-ui");
  let unknown = false,
    ids = [42, 43];
  await open(page, (url) =>
    url.searchParams.get("mod") === "viewthread"
      ? unknown
        ? thread.replace(account(), "")
        : thread
      : board(ids),
  );
  await page.locator('[data-thread-id="42"] .subject').click();
  ids = [45, 42, 43];
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Show 1 new thread", exact: true }),
  ).toBeVisible();
  unknown = true;
  await clickThreadTool(page, "Refresh thread");
  await expect(
    page.getByText("Board check failed.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Show \d+ new threads?/ }),
  ).toHaveCount(0);
  expect((await rows(page)).map((row) => row.id)).toEqual(["42", "43"]);
});

for (const restored of [false, true])
  for (const observation of [
    "unknown",
    "guest",
    "member",
    "same-member",
  ] as const)
    test(`REVIEW.account-footer-board-${restored}-${observation}: fresh identity outranks retained public content and a later confirmed read restores the member`, async ({
      page,
    }, info) => {
      let next: "initial" | typeof observation = "initial";
      const requests = await open(page, () =>
        next === "initial" || next === "same-member"
          ? board([42, 43])
          : next === "member"
            ? board([42, 43], "8")
            : board([42, 43]).replace(
                account(),
                next === "guest" ? '<form id="lsform"></form>' : "",
              ),
      );
      const label = page.locator(".navigation-account");
      await expect(label).toHaveText("Signed in as Reader 7");
      if (restored) {
        await page.reload();
        await expect(label).toHaveText("Snapshot from Reader 7");
        expect(requests).toHaveLength(1);
        await expect(
          page.getByText(
            "Restored snapshot — account and content have not been rechecked.",
            { exact: true },
          ),
        ).toBeVisible();
      }
      next = observation;
      await refresh(page);
      await expect.poll(() => requests.length).toBe(2);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const observed = await label.textContent();
      await expect
        .soft(label)
        .toHaveText(
          observation === "unknown"
            ? "Account not yet confirmed"
            : observation === "guest"
              ? "Browsing as a guest"
              : observation === "same-member"
                ? "Signed in as Reader 7"
                : "Signed in as Reader 8",
        );
      if (
        restored &&
        (observation === "unknown" || observation === "same-member")
      ) {
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
      if (observation === "unknown" || observation === "same-member")
        expect((await rows(page)).map((row) => row.id)).toEqual(["42", "43"]);
      next = "initial";
      const reload = page.getByRole("button", { name: "Reload", exact: true });
      if (await reload.isVisible()) await reload.click();
      else
        await page
          .getByRole("button", { name: "Refresh", exact: true })
          .click();
      await expect(label).toHaveText("Signed in as Reader 7");
      expect(requests).toHaveLength(3);
      await info.attach("footer-observation.json", {
        body: JSON.stringify({
          restored,
          observation,
          observed,
          confirmed: await label.textContent(),
          requests,
        }),
        contentType: "application/json",
      });
    });

for (const [locale, warning, member] of [
  [
    "en",
    "Restored snapshot — retained content has not been rechecked.",
    "Signed in as Reader 7",
  ],
  ["zh-CN", "已恢复快照 — 尚未重新检查保留的内容。", "当前登录：Reader 7"],
  ["zh-TW", "已復原快照 — 尚未重新檢查保留的內容。", "目前登入：Reader 7"],
] as const)
  test(`REVIEW.account-warning-${locale}: a confirmed scoped check keeps truthful localized retained-content provenance`, async ({
    page,
  }, info) => {
    const { openSettings, closeSettingsToWorkspace } =
      await import("./navigation-ui");
    const requests = await open(page, () => board([42, 43]));
    await page.reload();
    await expect(page.locator(".navigation-account")).toHaveText(
      "Snapshot from Reader 7",
    );
    await expect(
      page.getByText(
        "Restored snapshot — account and content have not been rechecked.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
    await refresh(page);
    await expect(page.locator(".navigation-account")).toHaveText(
      "Signed in as Reader 7",
    );
    await openSettings(page);
    await page.locator("#interface-language").selectOption(locale);
    await closeSettingsToWorkspace(page);
    await expect(page.locator(".navigation-account")).toHaveText(member);
    await info.attach("account-and-content.json", {
      body: JSON.stringify({
        locale,
        footer: await page.locator(".navigation-account").textContent(),
        status: await page.locator(".workspace-status").textContent(),
        requests,
      }),
      contentType: "application/json",
    });
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    expect(requests).toHaveLength(2);
  });
