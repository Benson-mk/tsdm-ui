import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  clickThreadTool,
  loadThreadRange,
  openThreadMore,
  openThreadPages,
} from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const forum = `${origin}/forum.php`;
const board = (id: number) => `${forum}?mod=forumdisplay&fid=${id}`;
const thread = (id: number, scope = "") =>
  `${forum}?mod=viewthread&tid=${id}${scope}`;
const member =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const directory = `${member}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table>${Array.from({ length: 48 }, (_, index) => `<tr><td><h2><a href="${board(index + 5)}">Board ${index + 5}</a></h2></td></tr>`).join("")}</table></div>`;
const boardPage = (id: number) => {
  const threads = Array.from({ length: 44 }, (_, index) =>
    id === 5 ? 40 + index : 140 + index,
  );
  return `${member}<div id="ct"><h1><a href="${board(id)}">Board ${id}</a></h1></div><div id="thread_types"><a href="${board(id)}&filter=typeid&typeid=3">Listening notes</a></div><table id="threadlisttableid">${threads.map((tid) => `<tbody id="normalthread_${tid}"><tr><th><a class="xst" href="${thread(tid)}">Thread row ${tid}</a></th><td class="by"><cite>Original Author</cite></td><td class="num"><a>6</a><em>100</em></td><td class="by"><cite>Latest Author</cite><em><a href="${thread(tid)}&page=1#pid${tid * 100 + 2}">2026-11-20</a></em></td></tr></tbody>`).join("")}</table>`;
};
const postPage = (url: URL, label = "Original") => {
  const tid = Number(url.searchParams.get("tid"));
  const number = Number(url.searchParams.get("page") ?? "1");
  const boardId = tid >= 140 ? 6 : 5;
  const scope = url.searchParams.has("authorid") ? "&authorid=9" : "";
  const destination = (page: number) => `${thread(tid, scope)}&page=${page}`;
  const last = `${destination(2)}#pid${tid * 100 + 12}`;
  const posts = Array.from({ length: 6 }, (_, index) => {
    const ordinal = (number - 1) * 6 + index + 1;
    const pid = tid * 100 + ordinal;
    return `<div id="post_${pid}"><div class="authi"><a href="home.php?mod=space&uid=9">Author Nine</a></div><a id="postnum${pid}" href="${destination(number)}#pid${pid}">${ordinal}</a><div class="pcb">${Array.from({ length: 9 }, (_, paragraph) => `<p>${label} passage ${paragraph} in ${pid}: ${"音樂聆聽心得、保持原文。 An independently visible reading anchor. ".repeat(9)}</p>`).join("")}</div></div>`;
  });
  const pages = `<div class="pg">${number === 2 ? `<a class="prev" href="${destination(1)}">Previous</a><a href="${destination(1)}">1</a>` : ""}<strong>${number}</strong>${number === 1 ? `<a class="nxt" href="${destination(2)}">Next</a>` : ""}<label><input name="custompage" value="${number}"><span title="共 2 页"> / 2 页</span></label><a class="last" href="${tid === 44 ? last.split("#")[0] : last}">Last</a></div>`;
  return `${member}<div id="pt"><a href="${board(boardId)}">Board ${boardId}</a></div><div id="postlist"><h1 id="thread_subject">Reading ${tid}</h1>${posts.join("")}</div>${tid === 46 ? "" : pages}`;
};

type Response = { status?: number; label?: string };
const runs = new WeakMap<
  Page,
  { requests: string[]; documents: string[]; samples: Record<string, unknown> }
>();
async function open(page: Page, destination: string) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const requests: string[] = [];
  const documents: string[] = [];
  const samples: Record<string, unknown> = {};
  let deferred: Promise<Response> | null = null;
  let release: ((response: Response) => void) | null = null;
  runs.set(page, { requests, documents, samples });
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET" || url.origin !== origin)
      return route.abort();
    if (url.pathname === "/__history-122.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (url.pathname !== "/forum.php") return route.abort();
    if (request.isNavigationRequest()) {
      documents.push(request.url());
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__history-122.js"></script></body></html>`,
      });
    }
    requests.push(request.url());
    const mod = url.searchParams.get("mod");
    if (mod && mod !== "forumdisplay" && mod !== "viewthread")
      return route.abort();
    const waiting = mod === "viewthread" ? deferred : null;
    if (waiting) deferred = null;
    const response = waiting ? await waiting : {};
    return route.fulfill({
      status: response.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify({
        document:
          mod === "viewthread"
            ? postPage(url, response.label)
            : mod === "forumdisplay"
              ? boardPage(Number(url.searchParams.get("fid")))
              : directory,
      }),
    });
  });
  await page.goto(destination);
  await expect(page.locator(".workspace")).toBeVisible();
  return {
    requests,
    samples,
    delay() {
      deferred = new Promise<Response>((resolve) => {
        release = resolve;
      });
      return (response: Response) => release?.(response);
    },
  };
}

const list = (page: Page) => page.locator("#thread-list-pane");
const navigation = (page: Page) => page.locator(".navigation-body");
const reader = (page: Page) => page.locator(".reading-pane");
const row = (page: Page, id: number) =>
  list(page).locator(`[data-thread-id="${id}"]`);
const post = (page: Page, id: number) => reader(page).locator(`#pid${id}`);
const boards = (page: Page) =>
  page.getByRole("button", { name: "Boards pane", exact: true });
const drawer = (page: Page) => page.locator(".pane-drawer");
const heading = (page: Page, id: number) =>
  page.getByRole("heading", { name: `Reading ${id}`, exact: true });
const boardHeading = (page: Page, id: number) =>
  list(page).getByRole("heading", { name: `Board ${id}`, exact: true });
async function stable(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
async function scroll(locator: Locator, pixels: number) {
  await locator.evaluate((node, value) => (node.scrollTop = value), pixels);
}
async function offset(target: Locator, owner: string) {
  return target.evaluate((node, pane) => {
    const box = node.getBoundingClientRect();
    const parent = node.closest(pane)!;
    const bounds = parent.getBoundingClientRect();
    return {
      id: node.id,
      top: box.top,
      bottom: box.bottom,
      paneTop: bounds.top,
      paneBottom: bounds.bottom,
      scrollTop: parent.scrollTop,
      focused: (node.getRootNode() as ShadowRoot).activeElement === node,
    };
  }, owner);
}
const postOffset = (target: Locator) => offset(target, ".reading-pane");
const paneScroll = (pane: Locator) => pane.evaluate((node) => node.scrollTop);
async function exactPost(target: Locator, within: number) {
  await expect(target).toBeAttached();
  await target.evaluate((node, pixels) => {
    const pane = node.closest(".reading-pane")!;
    pane.scrollTop +=
      node.getBoundingClientRect().top -
      pane.getBoundingClientRect().top +
      pixels;
  }, within);
}
async function visibleParagraphCharacter(
  target: Locator,
  saved?: { paragraph: number; index: number },
) {
  return target.evaluate((post, saved) => {
    const reader = post.closest(".reading-pane")!;
    const viewport = reader.getBoundingClientRect();
    const paragraphs = [...post.querySelectorAll(".post-content p")];
    const range = document.createRange();
    for (const [paragraph, node] of paragraphs.entries()) {
      const text = node.firstChild!;
      if (saved && paragraph !== saved.paragraph) continue;
      for (
        let index = saved?.index ?? 0;
        index < (text.textContent?.length ?? 0);
        index++
      ) {
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        const box = range.getBoundingClientRect();
        const visible =
          box.top >= viewport.top - 1 &&
          box.bottom <= viewport.bottom + 1 &&
          box.width > 0;
        if (saved || visible)
          return {
            paragraph,
            index,
            character: text.textContent?.charAt(index),
            top: box.top,
            visible,
          };
      }
    }
    return null;
  }, saved);
}

test.afterEach(async ({ page }, info) => {
  const run = runs.get(page);
  if (!run) return;
  await info.attach("observations.json", {
    body: JSON.stringify({
      ...run,
      url: page.url(),
      viewport: page.viewportSize(),
      browser: page.context().browser()?.version(),
      userAgent: await page.evaluate(() => navigator.userAgent),
    }),
    contentType: "application/json",
  });
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(run.documents).toHaveLength(1);
});

test("J122.history: filtered Board, current row and exact Post follow actual history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { requests, samples } = await open(page, forum);
  await list(page).getByRole("link", { name: "Board 5", exact: true }).click();
  await expect(boardHeading(page, 5)).toBeVisible();
  await list(page)
    .getByRole("button", { name: /^Board filters ·/ })
    .click();
  const filter = page.getByRole("dialog", {
    name: "Board filters",
    exact: true,
  });
  await filter
    .getByRole("button", { name: "Listening notes", exact: true })
    .click();
  await filter.getByRole("button", { name: "Apply", exact: true }).click();
  const activeFilter = list(page).locator(".board-active-criteria");
  await expect(activeFilter).toContainText("Listening notes");
  const first = post(page, 4802);
  const second = post(page, 4902);
  const six = navigation(page).getByRole("link", {
    name: "Board 6",
    exact: true,
  });
  await row(page, 48).locator(".latest-reply").click();
  await expect(heading(page, 48)).toBeVisible();
  await exactPost(first, 153);
  await scroll(navigation(page), 325);
  await row(page, 49).locator(".latest-reply").scrollIntoViewIfNeeded();
  await stable(page);
  const entryA = {
    post: await postOffset(first),
    boards: await paneScroll(navigation(page)),
    list: await paneScroll(list(page)),
  };
  samples.entryA = entryA;
  expect(entryA.boards).toBeGreaterThan(0);
  expect(entryA.list).toBeGreaterThan(0);
  expect(entryA.post.top).toBeLessThan(entryA.post.paneTop);
  expect(entryA.post.bottom).toBeGreaterThan(entryA.post.paneTop);
  await row(page, 49).locator(".latest-reply").click();
  await expect(heading(page, 49)).toBeVisible();
  await exactPost(second, 245);
  await scroll(navigation(page), 183);
  await scroll(list(page), entryA.list + 200);
  await stable(page);
  const entryB = {
    post: await postOffset(second),
    character: await visibleParagraphCharacter(second),
    boards: await paneScroll(navigation(page)),
    list: await paneScroll(list(page)),
  };
  samples.entryB = entryB;
  expect(entryB.boards).not.toBe(entryA.boards);
  expect(entryB.list).not.toBe(entryA.list);

  const count = requests.length;
  await clickThreadTool(page, "Back");
  await expect(heading(page, 48)).toBeVisible();
  await stable(page);
  const backA = await postOffset(first);
  samples.backA = {
    post: backA,
    boards: await paneScroll(navigation(page)),
    list: await paneScroll(list(page)),
  };
  await expect(activeFilter).toContainText("Listening notes");
  await expect
    .soft(row(page, 48).locator(".subject"))
    .toHaveAttribute("aria-current", "true", { timeout: 1500 });
  expect.soft(Math.abs(backA.top - entryA.post.top)).toBeLessThanOrEqual(1);
  expect.soft(await paneScroll(navigation(page))).toBe(entryA.boards);
  expect.soft(await paneScroll(list(page))).toBe(entryA.list);
  await page.goForward();
  await expect(heading(page, 49)).toBeVisible();
  await stable(page);
  const forwardB = await postOffset(second);
  samples.forwardB = forwardB;
  expect.soft(Math.abs(forwardB.top - entryB.post.top)).toBeLessThanOrEqual(1);
  await expect
    .soft(row(page, 49).locator(".subject"))
    .toHaveAttribute("aria-current", "true", { timeout: 1500 });
  expect.soft(await paneScroll(navigation(page))).toBe(entryB.boards);
  expect.soft(await paneScroll(list(page))).toBe(entryB.list);
  expect(requests).toHaveLength(count);

  await six.click();
  await expect(boardHeading(page, 6)).toBeVisible();
  await row(page, 148).locator(".latest-reply").click();
  await expect(heading(page, 148)).toBeVisible();
  const third = post(page, 14802);
  await exactPost(third, 171);
  await scroll(navigation(page), 502);
  await stable(page);
  const entryC = {
    post: await postOffset(third),
    boards: await paneScroll(navigation(page)),
    list: await paneScroll(list(page)),
  };
  samples.entryC = entryC;
  const crossCount = requests.length;
  await page.goBack();
  await expect(boardHeading(page, 6)).toBeVisible();
  await page.goBack();
  await expect(heading(page, 49)).toBeVisible();
  await expect(activeFilter).toContainText("Listening notes");
  await stable(page);
  samples.crossBackB = await postOffset(second);
  expect
    .soft(Math.abs((await postOffset(second)).top - entryB.post.top))
    .toBeLessThanOrEqual(1);
  await page.goForward();
  await expect(boardHeading(page, 6)).toBeVisible();
  await page.goForward();
  await expect(heading(page, 148)).toBeVisible();
  await stable(page);
  const forwardC = await postOffset(third);
  samples.crossForwardC = forwardC;
  expect.soft(Math.abs(forwardC.top - entryC.post.top)).toBeLessThanOrEqual(1);
  expect.soft(await paneScroll(navigation(page))).toBe(entryC.boards);
  expect.soft(await paneScroll(list(page))).toBe(entryC.list);
  await expect(row(page, 148).locator(".subject")).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(requests).toHaveLength(crossCount);

  await page.setViewportSize({ width: 900, height: 720 });
  await stable(page);
  await page.goBack();
  await expect(boardHeading(page, 6)).toBeVisible();
  await page.goBack();
  await expect(heading(page, 49)).toBeVisible();
  await stable(page);
  const reflow = await postOffset(second);
  const character = await visibleParagraphCharacter(second, entryB.character!);
  samples.reflowBackB = { post: reflow, character };
  expect(entryB.character).toBeTruthy();
  expect(character?.character).toBe(entryB.character?.character);
  expect(character?.visible).toBe(true);
  expect.soft(reflow.top).toBeLessThan(reflow.paneTop);
  expect.soft(reflow.bottom).toBeGreaterThan(reflow.paneTop);
  expect(requests).toHaveLength(crossCount);
});

test("J122.drawer: Back and Forward restore and focus each exact Post at 900 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const { requests, samples } = await open(page, board(5));
  await row(page, 42).locator(".latest-reply").click();
  await expect(heading(page, 42)).toBeVisible();
  const first = post(page, 4202);
  const second = post(page, 4302);
  await exactPost(first, 112);
  await stable(page);
  const firstSaved = await postOffset(first);
  samples.firstSaved = firstSaved;
  await row(page, 43).locator(".latest-reply").click();
  await expect(heading(page, 43)).toBeVisible();
  await exactPost(second, 207);
  await stable(page);
  const secondSaved = await postOffset(second);
  samples.secondSaved = secondSaved;
  const count = requests.length;
  for (const action of ["goBack", "goForward"] as const) {
    if (await drawer(page).isVisible()) await page.keyboard.press("Escape");
    await boards(page).click();
    await expect(drawer(page)).toBeVisible();
    await expect(
      drawer(page).getByRole("button", { name: "Close", exact: true }),
    ).toBeFocused();
    await page[action]();
    const destination = action === "goBack" ? first : second;
    const previous = action === "goBack" ? firstSaved : secondSaved;
    await expect(destination).toBeAttached();
    await stable(page);
    const restored = await postOffset(destination);
    samples[action] = restored;
    await expect.soft(drawer(page)).toBeHidden({ timeout: 1200 });
    await expect.soft(destination).toBeFocused({ timeout: 1200 });
    expect.soft(Math.abs(restored.top - previous.top)).toBeLessThanOrEqual(1);
    expect(requests).toHaveLength(count);
  }
});

test("J122.refresh: delayed reads leave the Boards drawer, position and newer selection alone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const { requests, samples, delay } = await open(page, board(5));
  await row(page, 42).locator(".latest-reply").click();
  await expect(heading(page, 42)).toBeVisible();
  const target = post(page, 4202);
  const pending = reader(page).getByText("Checking for new replies…", {
    exact: true,
  });
  const failed = reader(page).getByText("Check failed · wait 2 min", {
    exact: true,
  });
  await exactPost(target, 162);
  await stable(page);
  const saved = await postOffset(target);
  samples.saved = saved;
  const count = requests.length;
  const reject = delay();
  await clickThreadTool(page, "Refresh thread");
  await expect(pending).toBeAttached();
  await boards(page).click();
  await expect(drawer(page)).toBeVisible();
  const close = drawer(page).getByRole("button", {
    name: "Close",
    exact: true,
  });
  await expect(close).toBeFocused();
  samples.pending = await pending.textContent();
  reject({ status: 503 });
  await expect(failed).toBeAttached();
  await expect(drawer(page)).toBeVisible();
  await expect(close).toBeFocused();
  samples.failure = await failed.textContent();
  const afterFailure = await postOffset(target);
  samples.afterFailure = afterFailure;
  expect.soft(Math.abs(afterFailure.top - saved.top)).toBeLessThanOrEqual(1);
  await expect(target.getByText(/^Original passage 0/)).toBeAttached();
  expect(requests).toHaveLength(count + 1);
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  await page.clock.install();
  await page.clock.fastForward(121_000);
  expect(requests).toHaveLength(count + 1);

  const recover = delay();
  await clickThreadTool(page, "Refresh thread");
  await expect(pending).toBeAttached();
  await boards(page).click();
  await expect(close).toBeFocused();
  recover({ label: "Recovered" });
  await expect(target.getByText(/^Recovered passage 0/)).toBeAttached();
  await expect(pending).toHaveCount(0);
  await expect(failed).toHaveCount(0);
  await expect(drawer(page)).toBeVisible();
  await expect(close).toBeFocused();
  const afterRecovery = await postOffset(target);
  samples.afterRecovery = afterRecovery;
  expect.soft(Math.abs(afterRecovery.top - saved.top)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  const more = await openThreadMore(page);
  const successful = more.getByText(/^Last successful check:/);
  await expect(successful).toBeVisible();
  samples.success = await successful.textContent();
  await page.keyboard.press("Escape");
  expect(requests).toHaveLength(count + 2);

  const late = delay();
  await clickThreadTool(page, "Refresh thread");
  await expect(pending).toBeAttached();
  await row(page, 43).locator(".latest-reply").click();
  await expect(heading(page, 43)).toBeVisible();
  const returned = page.waitForResponse((response) =>
    response.url().includes("mod=viewthread&tid=42"),
  );
  late({ label: "Late" });
  await returned;
  await stable(page);
  await expect(pending).toHaveCount(0);
  await expect(reader(page).getByText(/^Late passage/)).toHaveCount(0);
  await expect(post(page, 4302)).toBeFocused();
  expect(requests).toHaveLength(count + 4);
});

test("J122.latest: loaded qualified exact Post uses the current reading scope without a read or history push", async ({
  page,
}) => {
  const scope = "&authorid=9";
  const { requests, samples } = await open(
    page,
    `${thread(42, scope)}&page=1#pid4202`,
  );
  await expect(heading(page, 42)).toBeVisible();
  expect(requests).toEqual([`${thread(42, scope)}&page=1&tsdmapp=json`]);
  await loadThreadRange(page, "later");
  const target = post(page, 4212);
  await expect(target).toBeAttached();
  expect(requests).toHaveLength(2);
  await exactPost(post(page, 4202), 170);
  const pre = await page.evaluate(() => history.length);
  const pages = await openThreadPages(page);
  const latest = pages.getByRole("link", {
    name: "Jump to latest",
    exact: true,
  });
  await expect
    .soft(latest)
    .toHaveAttribute("href", `${thread(42, scope)}&page=2#pid4212`, {
      timeout: 1500,
    });
  await latest.click();
  await expect(pages).toBeHidden();
  await stable(page);
  const native = await page
    .getByRole("link", { name: "Continue in native forum", exact: true })
    .getAttribute("href");
  samples.latest = {
    url: page.url(),
    native,
    target: (await target.count()) ? await postOffset(target) : null,
    historyLength: await page.evaluate(() => history.length),
  };
  await expect.soft(target).toBeFocused({ timeout: 1500 });
  expect.soft(requests).toHaveLength(2);
  expect.soft(await page.evaluate(() => history.length)).toBe(pre);
  expect.soft(native).toBe(`${thread(42, scope)}&page=2&tsdm-native=1#pid4212`);
});

test("J122.refresh-unpaged: refreshing an exact Post without paging metadata preserves drawer focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const { requests, samples, delay } = await open(
    page,
    `${thread(46)}&page=1#pid4602`,
  );
  const target = post(page, 4602);
  await expect(target).toBeFocused();
  await exactPost(target, 152);
  await stable(page);
  const before = await postOffset(target);
  const release = delay();
  await clickThreadTool(page, "Refresh thread");
  await expect.poll(() => requests.length).toBe(2);
  const pending = reader(page).getByText("Checking for new replies…", {
    exact: true,
  });
  await expect.soft(pending).toBeAttached({ timeout: 1000 });
  await boards(page).click();
  const close = drawer(page).getByRole("button", {
    name: "Close",
    exact: true,
  });
  await expect(close).toBeFocused();
  release({ label: "Refreshed" });
  await expect(target.getByText(/^Refreshed passage 0/)).toBeAttached();
  await expect(close).toBeFocused();
  await stable(page);
  const after = await postOffset(target);
  samples.refresh = { before, after };
  expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
  expect(requests).toHaveLength(2);
});

test("J122.latest-unknown: an unanchored Last page link does not escape its author filter", async ({
  page,
}) => {
  const scoped = thread(44, "&authorid=9");
  const { requests } = await open(page, `${scoped}&page=1#pid4402`);
  await expect(post(page, 4402)).toBeFocused();
  const pages = await openThreadPages(page);
  await expect(
    pages.getByRole("link", { name: "Jump to latest", exact: true }),
  ).toHaveCount(0, { timeout: 1500 });
  expect(requests).toEqual([`${scoped}&page=1&tsdmapp=json`]);
});

test("J122.latest-loaded-end: a qualified terminal range does not reread the unfiltered Last page", async ({
  page,
}) => {
  const { requests, samples } = await open(
    page,
    `${thread(44)}&page=1#pid4402`,
  );
  await expect(post(page, 4402)).toBeFocused();
  await loadThreadRange(page, "later");
  const target = post(page, 4412);
  await expect(target).toBeAttached();
  await exactPost(post(page, 4402), 180);
  const before = await page.evaluate(() => history.length);
  expect(requests).toHaveLength(2);
  const pages = await openThreadPages(page);
  await pages
    .getByRole("link", { name: "Jump to latest", exact: true })
    .click();
  await expect(target).toBeFocused();
  samples.latest = await postOffset(target);
  expect(requests).toHaveLength(2);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("J122.latest-retained: an already loaded Latest updates the Reader without leaving its current Board", async ({
  page,
}) => {
  const { requests, samples } = await open(page, board(5));
  await row(page, 42).locator(".latest-reply").click();
  await expect(post(page, 4202)).toBeFocused();
  await loadThreadRange(page, "later");
  const latest = post(page, 4212);
  await expect(latest).toBeAttached();
  await page
    .getByRole("navigation", { name: "Boards navigation", exact: true })
    .getByRole("link", { name: "Board 5", exact: true })
    .click();
  const native = page.getByRole("link", {
    name: "Continue in native forum",
    exact: true,
  });
  await expect(native).toHaveAttribute("href", `${board(5)}&tsdm-native=1`);
  await expect(boardHeading(page, 5)).toBeVisible();
  await exactPost(post(page, 4202), 204);
  await scroll(list(page), 621);
  const count = requests.length;
  const before = await page.evaluate(() => history.length);
  const currentBoard = page.url();
  const pages = await openThreadPages(page);
  await pages
    .getByRole("link", { name: "Jump to latest", exact: true })
    .click();
  await expect(latest).toBeFocused();
  await expect(boardHeading(page, 5)).toBeVisible();
  samples.retainedLatest = await postOffset(latest);
  expect.soft(requests).toHaveLength(count);
  expect.soft(await page.evaluate(() => history.length)).toBe(before);
  expect.soft(page.url()).toBe(currentBoard);
  await expect
    .soft(native)
    .toHaveAttribute("href", `${board(5)}&tsdm-native=1`, { timeout: 1500 });
  expect.soft(await paneScroll(list(page))).toBe(621);
  await row(page, 42).locator(".latest-reply").click();
  await expect(post(page, 4202)).toBeFocused();
  await expect(native).toHaveAttribute(
    "href",
    `${thread(42)}&page=1&tsdm-native=1#pid4202`,
  );
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});
