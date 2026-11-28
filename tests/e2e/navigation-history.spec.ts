import {
  chromium,
  expect,
  test,
  type Locator,
  type Page,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
import {
  clickThreadTool,
  loadThreadRange,
  openThreadMore,
  preparePostReply,
} from "./navigation-ui";
import {
  revealWritingOptions,
  selectSourceEditor,
  waitForReplySaved,
  writingDetailAction,
} from "./editor-controls";

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
const addressedForm = `<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="reppid" value="4201"><input type="hidden" name="reppost" value="4201"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Author Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;
const savedPath = "/home.php?mod=space&do=favorite&type=thread";
const noticesPath = "/home.php?mod=space&do=notice";
const combinedReads = [
  `${forum}?tsdmapp=json`,
  `${board(5)}&tsdmapp=json`,
  `${thread(42)}&page=1&tsdmapp=json`,
  `${forum}?mod=post&action=reply&fid=5&tid=42&tsdmapp=json&reppost=4201`,
  `${thread(43)}&page=1&tsdmapp=json`,
  `${thread(42)}&page=1&tsdmapp=json`,
  `${origin}${savedPath}&tsdmapp=json`,
  `${origin}${noticesPath}&tsdmapp=json`,
];
const destinationFixtures = new Map([
  [savedPath, '<div id="ct"><p class="emp">您还没有添加任何收藏</p></div>'],
  [
    noticesPath,
    '<div id="ct"><div class="mn"><p class="emp">No notices in this returned category.</p></div><div class="appl"><div class="tbn"><ul><li class="a"><a href="home.php?mod=space&do=notice">All standard notices</a></li></ul></div></div></div>',
  ],
]);
const runs = new WeakMap<
  Page,
  {
    requests: string[];
    documents: string[];
    rejected: string[];
    samples: Record<string, unknown>;
  }
>();
async function open(page: Page, destination: string, combined = false) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const requests: string[] = [];
  const documents: string[] = [];
  const samples: Record<string, unknown> = {};
  const rejected: string[] = [];
  const reject = (method: string, url: URL) =>
    rejected.push(`${method} ${url.href}`);
  let deferred: Promise<Response> | null = null;
  let release: ((response: Response) => void) | null = null;
  runs.set(page, { requests, documents, rejected, samples });
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET" || url.origin !== origin) {
      reject(request.method(), url);
      return route.abort();
    }
    if (
      url.href === `${origin}/__history-122.js` &&
      !request.isNavigationRequest()
    )
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (
      combined &&
      !(request.isNavigationRequest()
        ? url.href === destination
        : combinedReads.includes(url.href))
    ) {
      reject(request.method(), url);
      return route.abort();
    }
    if (combined && !request.isNavigationRequest()) {
      const target = new URL(url);
      target.searchParams.delete("tsdmapp");
      const document = destinationFixtures.get(
        `${target.pathname}${target.search}`,
      );
      if (document !== undefined) {
        requests.push(request.url());
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ uid: 7, document: member + document }),
        });
      }
    }
    if (url.pathname !== "/forum.php") {
      reject(request.method(), url);
      return route.abort();
    }
    if (request.isNavigationRequest()) {
      documents.push(request.url());
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__history-122.js"></script></body></html>`,
      });
    }
    requests.push(request.url());
    const mod = url.searchParams.get("mod");
    if (
      combined &&
      mod === "post" &&
      url.searchParams.get("action") === "reply" &&
      url.searchParams.get("fid") === "5" &&
      url.searchParams.get("tid") === "42" &&
      url.searchParams.get("reppost") === "4201"
    )
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ document: member + addressedForm }),
      });
    if (mod && mod !== "forumdisplay" && mod !== "viewthread") {
      reject(request.method(), url);
      return route.abort();
    }
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
    rejected,
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

test("J124.combined: choose a Board, keep independent positions, switch destinations, and resume the addressed reply", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1146, height: 876 });
  const { requests, rejected, samples, delay } = await open(page, forum, true);
  const runtime = await page.evaluate(async () => {
    const userAgentData = (
      navigator as Navigator & {
        userAgentData?: {
          getHighEntropyValues(keys: string[]): Promise<{
            fullVersionList?: { brand: string; version: string }[];
          }>;
        };
      }
    ).userAgentData;
    return {
      userAgent: navigator.userAgent,
      versions: (await userAgentData?.getHighEntropyValues(["fullVersionList"]))
        ?.fullVersionList,
    };
  });
  const expectedBrand =
    info.project.use.channel === "msedge" ? "Microsoft Edge" : "Google Chrome";
  const version =
    page.context().browser()?.version() ??
    runtime.versions?.find(({ brand }) => brand === expectedBrand)?.version;
  expect(version, "expected the exact browser version").toBeTruthy();
  info.annotations.push({
    type: "browser-version",
    ...(version ? { description: version } : {}),
  });
  if (info.project.use.channel === "msedge")
    expect(runtime.userAgent).toMatch(/\bEdg\//);
  else {
    expect(info.project.use.channel).toBe("chrome");
    expect(runtime.userAgent).toMatch(/\b(?:Headless)?Chrome\//);
    expect(runtime.userAgent).not.toMatch(/\bEdg\//);
  }
  const chooser = page.getByRole("region", {
    name: "Boards overview",
    exact: true,
  });
  await expect(chooser).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Board 5", exact: true }),
  ).toHaveCount(1);
  await chooser.getByRole("link", { name: "Board 5", exact: true }).click();
  await expect(boardHeading(page, 5)).toBeVisible();
  await row(page, 42).locator(".latest-reply").click();
  const first = post(page, 4202);
  const second = post(page, 4302);
  await expect(first).toBeFocused();
  await preparePostReply(page, "4201");
  const source = await selectSourceEditor(page);
  const retained = "[b]完整保留 this addressed reply[/b]";
  await source.fill(retained);
  await revealWritingOptions(page);
  const signature = page.getByRole("checkbox", {
    name: "Signature",
    exact: true,
  });
  await signature.uncheck();
  await page.keyboard.press("Escape");
  await waitForReplySaved(page);
  await (await writingDetailAction(page, "Return to reading")).click();
  const resume = page.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  await expect(resume).toBeFocused();
  await expect(source).toBeHidden();
  await exactPost(first, 150);
  await scroll(navigation(page), 325);
  await row(page, 43).locator(".latest-reply").scrollIntoViewIfNeeded();
  await scroll(list(page), 180);
  await stable(page);
  const original = {
    reader: await postOffset(first),
    boards: await paneScroll(navigation(page)),
    results: await paneScroll(list(page)),
  };
  samples.original = original;
  expect(original.boards).toBeGreaterThan(0);
  expect(original.results).toBeGreaterThan(0);
  await row(page, 43).locator(".latest-reply").click();
  await expect(second).toBeFocused();
  await exactPost(second, 215);
  await scroll(navigation(page), 40);
  await scroll(list(page), 240);
  await stable(page);
  const count = requests.length;
  await page.goBack();
  await expect(first).toBeFocused();
  await stable(page);
  const restored = {
    reader: await postOffset(first),
    boards: await paneScroll(navigation(page)),
    results: await paneScroll(list(page)),
  };
  samples.restored = restored;
  expect(restored.boards).toBe(original.boards);
  expect(restored.results).toBe(original.results);
  expect(
    Math.abs(restored.reader.top - original.reader.top),
  ).toBeLessThanOrEqual(1);
  expect(requests).toHaveLength(count);

  await page.setViewportSize({ width: 900, height: 876 });
  await expect(boards(page)).toHaveAttribute("aria-expanded", "false");
  await boards(page).click();
  const close = drawer(page).getByRole("button", {
    name: "Close",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.goForward();
  await expect(drawer(page)).toBeHidden();
  await expect(second).toBeFocused();
  samples.drawerForward = await postOffset(second);
  await boards(page).click();
  await expect(close).toBeFocused();
  await page.goBack();
  await expect(drawer(page)).toBeHidden();
  await expect(first).toBeFocused();
  samples.drawerBack = await postOffset(first);
  expect(requests).toHaveLength(count);

  await exactPost(first, 141);
  await stable(page);
  const beforeRefresh = await postOffset(first);
  const release = delay();
  try {
    await clickThreadTool(page, "Refresh thread");
    await expect.poll(() => requests.length).toBe(count + 1);
    await boards(page).click();
    await expect(close).toBeFocused();
  } finally {
    release({ label: "Refreshed" });
  }
  await expect(first.getByText(/^Refreshed passage 0/)).toBeAttached();
  await expect(close).toBeFocused();
  const afterRefresh = await postOffset(first);
  samples.delayedRefresh = { beforeRefresh, afterRefresh, closeFocused: true };
  expect(Math.abs(afterRefresh.top - beforeRefresh.top)).toBeLessThanOrEqual(1);
  await info.attach("drawer-focus.aria.txt", {
    body: await drawer(page).ariaSnapshot(),
    contentType: "text/plain",
  });
  await info.attach("drawer-focus.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  for (const [index, action] of [
    {
      name: "Saved",
      load: "Load saved threads",
      empty: "No favorites on this page.",
    },
    {
      name: "Notices",
      load: "Load notices",
      empty: "No notices in this returned category.",
    },
  ].entries()) {
    if (index > 0) await boards(page).click();
    const nav = page.getByRole("navigation", {
      name: "Main destinations",
      exact: true,
    });
    const baseline = requests.length;
    await nav.getByRole("button", { name: action.name, exact: true }).click();
    await expect(
      page.getByText("List not loaded.", { exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(baseline);
    await page.getByRole("button", { name: action.load, exact: true }).click();
    await expect(page.getByText(action.empty, { exact: true })).toBeVisible();
    expect(requests).toHaveLength(baseline + 1);
    await page.goBack();
    await expect(
      page.getByText("List not loaded.", { exact: true }),
    ).toBeVisible();
    await page.goForward();
    await expect(page.getByText(action.empty, { exact: true })).toBeVisible();
    expect(requests).toHaveLength(baseline + 1);
    samples[action.name] = { passive: 0, load: 1, history: 0 };
  }
  await page.goBack();
  await expect(
    page.getByText("List not loaded.", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByText("No favorites on this page.", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByText("List not loaded.", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(first).toBeFocused();
  await expect(source).toBeHidden();
  const exactReturn = await postOffset(first);
  const native = page.getByRole("link", {
    name: "Continue in native forum",
    exact: true,
  });
  await expect(native).toHaveAttribute(
    "href",
    `${thread(42)}&page=1&tsdm-native=1#pid4202`,
  );
  samples.destinationReturn = {
    ...exactReturn,
    native: await native.getAttribute("href"),
  };
  expect(Math.abs(exactReturn.top - afterRefresh.top)).toBeLessThanOrEqual(1);
  await resume.click();
  await selectSourceEditor(page);
  await expect(source).toBeFocused();
  await expect(source).toHaveValue(retained);
  const target = page
    .getByRole("group", { name: "Reply target" })
    .getByRole("link");
  await expect(target).toHaveAttribute(
    "href",
    `${forum}?mod=redirect&goto=findpost&ptid=42&pid=4201`,
  );
  await revealWritingOptions(page);
  await expect(signature).not.toBeChecked();
  await page.keyboard.press("Escape");
  samples.reply = {
    target: await target.getAttribute("href"),
    source: retained,
    signature: false,
  };
  expect(requests).toEqual(combinedReads);
  expect(rejected).toEqual([]);
  await info.attach("addressed-writing.aria.txt", {
    body: await page
      .getByRole("region", { name: "Writing context", exact: true })
      .ariaSnapshot(),
    contentType: "text/plain",
  });
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

test.describe("Cached document history", () => {
  test("J124.document-history: browser Forward across a native exact Post redirect focuses the restored Post", async ({
    browserName,
  }, info) => {
    expect(browserName).toBe("chromium");
    const browser = await chromium.launch({
      channel: info.project.use.channel ?? "msedge",
      ignoreDefaultArgs: ["--disable-back-forward-cache"],
    });
    const permalink = `${forum}?mod=redirect&goto=findpost&pid=4302`;
    const resolved = `${thread(43)}&page=1#pid4302`;
    const close = (page: Page) =>
      drawer(page).getByRole("button", { name: "Close", exact: true });
    const documentIdentity = (page: Page) =>
      page.evaluate(() => ({
        timeOrigin: performance.timeOrigin,
        navigationType: (
          performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming
        )?.type,
      }));
    info.annotations.push({
      type: "browser-version",
      description: browser.version(),
    });
    try {
      await withRedirectFixture(
        browser,
        {
          origin,
          redirect: resolved,
          document: (url) =>
            url.searchParams.get("mod") === "forumdisplay"
              ? boardPage(5)
              : postPage(url),
        },
        async (page, reads, redirects) => {
          await page.setViewportSize({ width: 900, height: 876 });
          const documents: string[] = [];
          page.on("request", (request) => {
            if (request.isNavigationRequest()) documents.push(request.url());
          });
          const samples: Record<string, unknown> = {};
          const first = post(page, 4202);
          const second = post(page, 4302);
          const native = page.getByRole("link", {
            name: "Continue in native forum",
            exact: true,
          });
          try {
            await page.goto(board(5));
            const originalDocument = await documentIdentity(page);
            await row(page, 42).locator(".latest-reply").click();
            await expect(first).toBeFocused();
            expect(await documentIdentity(page)).toEqual(originalDocument);
            const firstEntry = await postOffset(first);
            samples.firstEntry = { ...originalDocument, ...firstEntry };

            await page.goto(permalink);
            await expect(second).toHaveAttribute("data-targeted", "true");
            await expect(native).toHaveAttribute(
              "href",
              `${thread(43)}&page=1&tsdm-native=1#pid4302`,
            );
            const secondDocument = await documentIdentity(page);
            const secondEntry = await postOffset(second);
            expect(secondDocument.timeOrigin).not.toBe(
              originalDocument.timeOrigin,
            );
            samples.secondEntry = { ...secondDocument, ...secondEntry };
            expect(redirects).toEqual(["document"]);

            await boards(page).click();
            await expect(close(page)).toBeFocused();
            await page.evaluate(() => setTimeout(() => history.back(), 0));
            await expect(first).toBeAttached();
            await stable(page);
            const backDocument = await documentIdentity(page);
            const back = await postOffset(first);
            await expect(drawer(page)).toBeHidden({ timeout: 1500 });
            await expect(first).toBeFocused({ timeout: 1500 });
            expect(backDocument.timeOrigin).toBe(originalDocument.timeOrigin);
            samples.back = { ...backDocument, ...back };
            expect(Math.abs(back.top - firstEntry.top)).toBeLessThanOrEqual(1);

            await boards(page).click();
            await expect(close(page)).toBeFocused();
            await page.evaluate(() => setTimeout(() => history.forward(), 0));
            await expect(second).toHaveAttribute("data-targeted", "true");
            await expect(native).toHaveAttribute(
              "href",
              `${thread(43)}&page=1&tsdm-native=1#pid4302`,
            );
            await expect.soft(drawer(page)).toBeHidden({ timeout: 1500 });
            await expect.soft(second).toBeFocused({ timeout: 1500 });
            await stable(page);
            const forwardDocument = await documentIdentity(page);
            const forward = await postOffset(second);
            expect(forwardDocument.timeOrigin).toBe(secondDocument.timeOrigin);
            samples.forward = { ...forwardDocument, ...forward };
            expect
              .soft(Math.abs(forward.top - secondEntry.top))
              .toBeLessThanOrEqual(1);
            expect(reads).toEqual([
              `${board(5)}&tsdmapp=json`,
              `${thread(42)}&page=1&tsdmapp=json`,
              `${thread(43)}&page=1&tsdmapp=json`,
            ]);
            expect(documents).toEqual([
              board(5),
              permalink,
              `${thread(43)}&page=1`,
            ]);
          } finally {
            await info.attach("document-history-observations.json", {
              body: JSON.stringify({
                samples,
                reads,
                redirects,
                documents,
                browser: browser.version(),
                viewport: page.viewportSize(),
              }),
              contentType: "application/json",
            });
            await info.attach("document-history.png", {
              body: await page.screenshot(),
              contentType: "image/png",
            });
          }
        },
      );
    } finally {
      await browser.close();
    }
  });
});

for (const moveBeforeMedia of [false, true]) {
  test(`J124.cold-latest-history-${moveBeforeMedia ? "reader-intent" : "exact"}: browser Forward with late media ${moveBeforeMedia ? "preserves deliberate scrolling" : "restores the exact Post position"}`, async ({
    browser,
  }, info) => {
    const latest = (id: number) =>
      `${forum}?mod=redirect&goto=lastpost&tid=${id}`;
    const links = boardPage(5)
      .replace(`${thread(42)}&page=1#pid4202`, latest(42))
      .replace(`${thread(43)}&page=1#pid4302`, latest(43));
    const images = [
      { name: "tall", height: 552 },
      { name: "small", height: 100 },
    ];
    const previousPost = `<div id="post_4311"><div class="authi"><a href="home.php?mod=space&uid=9">Author Nine</a></div><a id="postnum4311">11</a><div class="pcb"><p>Reading before the latest reply.</p>${images.map(({ name }) => `<p><img src="${origin}/cold-${name}.png" alt="${name} fixture image"></p>`).join("")}</div></div>`;
    const fixtureThread = (url: URL) => {
      const result = postPage(url, "Original");
      if (url.searchParams.get("tid") !== "43") return result;
      return result
        .replace(
          /<div id="post_4311">.*?(?=<div id="post_4312">)/,
          previousPost,
        )
        .replace(
          /(<a id="postnum4312"[^>]*>12<\/a><div class="pcb">).*?(?=<\/div>)/,
          "$1<p>Short final reply.</p>",
        );
    };
    const close = (page: Page) =>
      drawer(page).getByRole("button", { name: "Close", exact: true });
    info.annotations.push({
      type: "browser-version",
      description: browser.version(),
    });
    await withRedirectFixture(
      browser,
      {
        origin,
        redirect: (url) =>
          `${thread(Number(url.searchParams.get("tid")))}&page=2#lastpost`,
        document: (url) =>
          url.searchParams.get("mod") === "forumdisplay"
            ? links
            : fixtureThread(url),
      },
      async (page, reads, redirects) => {
        await page.setViewportSize({ width: 900, height: 876 });
        const samples: Record<string, unknown> = {};
        const first = post(page, 4212);
        const second = post(page, 4312);
        const imageRequests: string[] = [];
        let releaseImages!: () => void;
        const imageGate = new Promise<void>((resolve) => {
          releaseImages = resolve;
        });
        let delayImages = false;
        await page.route(`${origin}/cold-*.png`, async (route) => {
          const image = images.find(({ name }) =>
            route.request().url().endsWith(`cold-${name}.png`),
          );
          if (!image) return route.abort();
          imageRequests.push(image.name);
          if (delayImages) await imageGate;
          await route.fulfill({
            contentType: "image/svg+xml",
            body: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="${image.height}"><rect width="16" height="${image.height}" fill="green"/></svg>`,
          });
        });
        const awaitImages = async () => {
          for (const image of images) {
            await expect
              .poll(() =>
                page
                  .getByAltText(`${image.name} fixture image`)
                  .evaluate((node) =>
                    node instanceof HTMLImageElement && node.complete
                      ? node.naturalHeight
                      : 0,
                  ),
              )
              .toBe(image.height);
          }
        };
        const documents: string[] = [];
        page.on("request", (request) => {
          if (request.isNavigationRequest()) documents.push(request.url());
        });
        const timeOrigin = () => page.evaluate(() => performance.timeOrigin);
        const sample = async (target: Locator) => {
          await stable(page);
          return {
            ...(await postOffset(target)),
            origin: await timeOrigin(),
            navigationType: await page.evaluate(
              () =>
                (
                  performance.getEntriesByType(
                    "navigation",
                  )[0] as PerformanceNavigationTiming
                )?.type,
            ),
            active: await target.evaluate((node) => {
              const active = (node.getRootNode() as ShadowRoot).activeElement;
              return active && { tagName: active.tagName, id: active.id };
            }),
          };
        };
        try {
          await page.goto(board(5));
          const originalDocument = await timeOrigin();
          await row(page, 42).locator(".latest-reply").click();
          await expect(first).toHaveAttribute("data-targeted", "true");
          await expect(first).toBeFocused();
          const firstEntry = await sample(first);
          samples.firstEntry = firstEntry;
          expect(firstEntry.origin).not.toBe(originalDocument);
          await row(page, 43).locator(".latest-reply").click();
          await expect(second).toHaveAttribute("data-targeted", "true");
          await expect(second).toBeFocused();
          await awaitImages();
          const secondDocumentAnchor = await postOffset(post(page, 4311));
          expect(secondDocumentAnchor.bottom).toBeGreaterThan(
            secondDocumentAnchor.paneTop,
          );
          expect(secondDocumentAnchor.top).toBeLessThan(
            secondDocumentAnchor.paneTop,
          );
          samples.savedVisibleArticle = secondDocumentAnchor;
          const secondEntry = await sample(second);
          samples.secondEntry = secondEntry;
          expect(secondEntry.origin).not.toBe(firstEntry.origin);
          expect(redirects).toEqual(["fetch", "document", "fetch", "document"]);

          await boards(page).click();
          await expect(close(page)).toBeFocused();
          await page.goBack();
          await expect(first).toHaveAttribute("data-targeted", "true");
          const back = await sample(first);
          samples.back = back;
          expect(back.navigationType).toBe("back_forward");
          expect(back.origin).not.toBe(firstEntry.origin);
          await expect(drawer(page)).toBeHidden();
          await expect(first).toBeFocused();
          expect(Math.abs(back.top - firstEntry.top)).toBeLessThanOrEqual(1);

          await boards(page).click();
          await expect(close(page)).toBeFocused();
          delayImages = true;
          await page.goForward({ waitUntil: "domcontentloaded" });
          await expect(second).toHaveAttribute("data-targeted", "true");
          await expect(
            page.getByRole("link", {
              name: "Continue in native forum",
              exact: true,
            }),
          ).toHaveAttribute(
            "href",
            `${thread(43)}&page=2&tsdm-native=1#pid4312`,
          );
          await expect(second).toBeFocused();
          await expect.poll(() => imageRequests.length).toBe(4);
          const beforeImages = await sample(second);
          samples.forwardBeforeImages = beforeImages;
          let moved = beforeImages;
          if (moveBeforeMedia) {
            const bounds = (await reader(page).boundingBox())!;
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 36);
            await page.mouse.wheel(0, -230);
            await expect
              .poll(() => paneScroll(reader(page)))
              .toBe(beforeImages.scrollTop - 230);
            moved = await sample(second);
            samples.deliberateScroll = moved;
          }
          releaseImages();
          await awaitImages();
          const forward = await sample(second);
          samples.forward = forward;
          expect(forward.navigationType).toBe("back_forward");
          expect(forward.origin).not.toBe(secondEntry.origin);
          await expect(drawer(page)).toBeHidden();
          if (moveBeforeMedia) {
            expect(forward.scrollTop).toBe(moved.scrollTop);
          } else {
            expect(Math.abs(forward.top - secondEntry.top)).toBeLessThanOrEqual(
              1,
            );
          }
          await expect(second).toBeFocused({ timeout: 1500 });
          expect(reads).toEqual([
            `${board(5)}&tsdmapp=json`,
            `${thread(42)}&page=2&tsdmapp=json`,
            `${thread(43)}&page=2&tsdmapp=json`,
          ]);
          expect(documents).toEqual([
            board(5),
            latest(42),
            `${thread(42)}&page=2`,
            latest(43),
            `${thread(43)}&page=2`,
            forum,
            forum,
          ]);
        } finally {
          releaseImages();
          await info.attach("cold-document-history-observations.json", {
            body: JSON.stringify({
              samples,
              reads,
              redirects,
              documents,
              imageRequests,
              browser: browser.version(),
              viewport: page.viewportSize(),
            }),
            contentType: "application/json",
          });
          await info.attach("cold-document-history.png", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
        }
      },
    );
  });
}

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
  const latest = page.getByRole("link", {
    name: "Jump to latest",
    exact: true,
  });
  await expect
    .soft(latest)
    .toHaveAttribute("href", `${thread(42, scope)}&page=2#pid4212`, {
      timeout: 1500,
    });
  await latest.click();
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
  await expect(
    page.getByRole("link", { name: "Jump to latest", exact: true }),
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
  await page.getByRole("link", { name: "Jump to latest", exact: true }).click();
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
  const boardRead = page.waitForResponse(`${board(5)}&tsdmapp=json`);
  await page
    .getByRole("navigation", { name: "Boards navigation", exact: true })
    .getByRole("link", { name: "Board 5", exact: true })
    .click();
  expect((await boardRead).ok()).toBe(true);
  await expect(
    page.getByRole("status").filter({ hasText: /^Loading…$/ }),
  ).toHaveCount(0);
  const native = page.getByRole("link", {
    name: "Continue in native forum",
    exact: true,
  });
  await expect(native).toHaveAttribute("href", `${board(5)}&tsdm-native=1`);
  await expect(boardHeading(page, 5)).toBeVisible();
  await exactPost(post(page, 4202), 204);
  await scroll(list(page), 621);
  samples.boardScrollBeforeLatest = await paneScroll(list(page));
  expect(samples.boardScrollBeforeLatest).toBe(621);
  const count = requests.length;
  const before = await page.evaluate(() => history.length);
  const currentBoard = page.url();
  await page.getByRole("link", { name: "Jump to latest", exact: true }).click();
  await expect(latest).toBeFocused();
  await expect(boardHeading(page, 5)).toBeVisible();
  samples.retainedLatest = await postOffset(latest);
  expect.soft(requests).toHaveLength(count);
  expect.soft(await page.evaluate(() => history.length)).toBe(before);
  expect.soft(page.url()).toBe(currentBoard);
  await expect
    .soft(native)
    .toHaveAttribute("href", `${board(5)}&tsdm-native=1`, { timeout: 1500 });
  samples.boardScrollAfterLatest = await paneScroll(list(page));
  expect.soft(samples.boardScrollAfterLatest).toBe(621);
  await row(page, 42).locator(".latest-reply").click();
  await expect(post(page, 4202)).toBeFocused();
  await expect(native).toHaveAttribute(
    "href",
    `${thread(42)}&page=1&tsdm-native=1#pid4202`,
  );
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});
