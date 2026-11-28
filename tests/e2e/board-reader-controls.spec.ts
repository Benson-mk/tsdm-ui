import { readFileSync } from "node:fs";
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const origin = "https://www.tsdm39.com";
const forum = `${origin}/forum.php`;
const board = `${forum}?mod=forumdisplay&fid=5`;
const filtered = `${board}&filter=typeid&typeid=3`;
const thread = `${forum}?mod=viewthread&tid=42`;
const first = `${thread}&page=1`;
const second = `${thread}&page=2`;
const latest = `${second}#pid202`;
const boardTitle = "Music — 音樂作品與完整的版塊標題";
const readerTitle =
  "A long Reader title — 完整而很長的繁體中文討論標題與閱讀心得";
const member =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const subject = (id: number) => `Discussion ${id} — 最新作品與完整的標題`;
function boardPage(isFiltered = false, refreshed = false) {
  const row = (id: number, pinned = false) =>
    `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><a class="xst" href="${forum}?mod=viewthread&tid=${id}${id === 42 ? "&page=1" : ""}">${pinned ? "Pinned guide" : subject(id)}</a></th><td class="by"><cite>Original Author</cite><em>2020-01-01</em></td><td class="num"><a>6</a><em>100</em></td><td class="by"><cite>Latest Author</cite><em>${id === 42 ? `<a href="${latest}">2026-11-20</a>` : "2026-11-20"}</em></td></tr></tbody>`;
  const ids = Array.from({ length: 30 }, (_, index) => 42 + index);
  return `<div id="ct"><h1><a href="${board}">${boardTitle}</a></h1></div><ul id="thread_types"><li${isFiltered ? ' class="a"' : ""}><a href="${filtered}">Creative notes</a></li></ul><table id="threadlisttableid">${row(41, true)}${refreshed ? row(99) : ""}${ids.map((id) => row(id)).join("")}</table>`;
}
function threadPage(page: number, known = true) {
  const scope = known ? "" : "&authorid=9";
  const target = (number: number) => `${thread}${scope}&page=${number}`;
  return `<div id="pt"><a href="${board}">${boardTitle}</a></div><div id="postlist"><h1 id="thread_subject">${readerTitle}</h1>${[page * 100 + 1, page * 100 + 2].map((id, index) => `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Reader Nine</a></div><a id="postnum${id}" href="${target(page)}#pid${id}">${(page - 1) * 2 + index + 1}</a><div class="pcb">${`<p>Post ${id}, long reading text. 閱讀原來的文字與音樂作品。</p>`.repeat(45)}</div></div>`).join("")}</div><div class="pg">${page === 2 ? `<a class="prev" href="${target(1)}">Previous</a>` : ""}<strong>${page}</strong><label><input name="custompage" value="${page}"${known ? ` onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=42&page='+this.value;; doane(event);}"` : ""}>${known ? '<span title="共 2 页"> / 2 页</span>' : ""}</label>${page === 1 ? `<a class="nxt" href="${target(2)}">Next</a>` : ""}<a class="last" href="${target(2)}${known ? "#pid202" : ""}">Last</a></div>`;
}

type Request = {
  method: string;
  url: string;
  body: string | null;
  navigation: boolean;
};
type Expected = Request & { html: string };
type Sample = { name: string; observation: unknown };
const fixtures = new WeakMap<
  Page,
  {
    expected: Expected[];
    ledger: (Request & { disposition: string })[];
    samples: Sample[];
  }
>();
function allow(page: Page, url: string, html: string, navigation = false) {
  const target = new URL(url);
  target.hash = "";
  if (!navigation) target.searchParams.set("tsdmapp", "json");
  fixtures.get(page)!.expected.push({
    method: "GET",
    url: target.href,
    body: null,
    navigation,
    html,
  });
}
async function mount(page: Page, width: number, url: string, html: string) {
  await page.setViewportSize({ width, height: width < 960 ? 720 : 900 });
  const fixture = { expected: [], ledger: [], samples: [] };
  fixtures.set(page, fixture);
  allow(page, url, "<html><body>Native forum</body></html>", true);
  allow(page, url, html);
  await page.context().route("**/*", async (route) => {
    const state = fixtures.get(page)!;
    const request = route.request();
    const actual = {
      method: request.method(),
      url: request.url(),
      body: request.postData(),
      navigation: request.isNavigationRequest(),
    };
    const expected = state.expected[0];
    if (
      !expected ||
      actual.method !== expected.method ||
      actual.url !== expected.url ||
      actual.body !== expected.body ||
      actual.navigation !== expected.navigation
    ) {
      state.ledger.push({ ...actual, disposition: "refused" });
      return route.abort();
    }
    state.expected.shift();
    state.ledger.push({
      ...actual,
      disposition: actual.navigation ? "document" : "synthetic forum",
    });
    return route.fulfill(
      actual.navigation
        ? { contentType: "text/html", body: expected.html }
        : { json: { uid: 7, document: member + expected.html } },
    );
  });
  await page.goto(url);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
}
async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  );
}
const samples = (page: Page) => fixtures.get(page)!.samples;
const ledger = (page: Page) => fixtures.get(page)!.ledger;
const position = async (page: Page) => {
  await settle(page);
  return {
    url: page.url(),
    length: await page.evaluate(() => history.length),
    requests: ledger(page).length,
  };
};
const boardPane = (page: Page) =>
  page.getByRole("region", { name: "Thread results", exact: true });
const readerPane = (page: Page) =>
  page.getByRole("region", { name: "Thread reading", exact: true });
const readerHeader = (page: Page) => page.locator(".conversation-heading");
const button = (scope: Page | Locator, name: string | RegExp) =>
  scope.getByRole("button", { name, exact: true });
const link = (scope: Page | Locator, name: string | RegExp) =>
  scope.getByRole("link", { name, exact: true });
const heading = (page: Page, name: string) =>
  page.getByRole("heading", { name, exact: true });

async function geometry(
  page: Page,
  name: string,
  targets: Record<string, Locator>,
  touch = false,
) {
  await settle(page);
  const observation = await Promise.all(
    Object.entries(targets).map(async ([label, target]) => ({
      label,
      ...(await target.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const root = node.getRootNode() as ShadowRoot;
        const hit = root.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        );
        const pane = node.closest(".pane, .conversation-region");
        const bounds = pane?.getBoundingClientRect();
        return {
          rect: rect.toJSON(),
          bounds: bounds?.toJSON(),
          viewport: { width: innerWidth, height: innerHeight },
          href: node.getAttribute("href"),
          focused: root.activeElement === node,
          focusOutline: getComputedStyle(node).outlineStyle,
          hit: node === hit || node.contains(hit),
          fits:
            rect.top >= Math.max(0, bounds?.top ?? 0) &&
            rect.bottom <=
              Math.min(innerHeight, bounds?.bottom ?? innerHeight) &&
            rect.left >= Math.max(0, bounds?.left ?? 0) &&
            rect.right <= Math.min(innerWidth, bounds?.right ?? innerWidth),
        };
      })),
    })),
  );
  samples(page).push({ name, observation });
  for (const item of observation) {
    expect
      .soft(item.hit, `${name}: ${item.label} must not be covered`)
      .toBe(true);
    expect.soft(item.fits, `${name}: ${item.label} must fit`).toBe(true);
    if (touch)
      expect
        .soft(item.rect.height, `${name}: ${item.label} height`)
        .toBeGreaterThanOrEqual(44);
  }
}
async function scrollDeep(page: Page, pane: Locator, name: string) {
  const before = await pane.evaluate((node) => node.scrollTop);
  await pane.evaluate((node) => node.scrollBy(0, 1150));
  await settle(page);
  const observation = await pane.evaluate((node) => ({
    rect: node.getBoundingClientRect().toJSON(),
    scrollTop: node.scrollTop,
    scrollWidth: node.scrollWidth,
    width: node.clientWidth,
  }));
  samples(page).push({ name, observation: { before, ...observation } });
  expect(observation.scrollTop - before).toBeGreaterThan(600);
  expect(observation.scrollWidth).toBeLessThanOrEqual(observation.width + 1);
}

async function recordLatest(page: Page, name: string, target: Locator) {
  const post = await target.evaluate((node) => ({
    id: node.id,
    focus: (node.getRootNode() as ShadowRoot).activeElement?.id,
    rect: node.getBoundingClientRect().toJSON(),
    readingScroll: node.closest(".reading-pane")?.scrollTop,
  }));
  const native = await link(page, "Continue in native forum").getAttribute(
    "href",
  );
  samples(page).push({
    name,
    observation: { ...(await position(page)), post, native },
  });
}

async function capture(
  page: Page,
  info: TestInfo,
  name: string,
  target: Locator,
) {
  await info.attach(`${name}.aria.txt`, {
    body: await target.ariaSnapshot(),
    contentType: "text/plain",
  });
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test.afterEach(async ({ page, browser }, info) => {
  const state = fixtures.get(page);
  if (!state) return;
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("http-ledger.json", {
    body: JSON.stringify(state.ledger, null, 2),
    contentType: "application/json",
  });
  await info.attach("positions-and-focus.json", {
    body: JSON.stringify(state.samples, null, 2),
    contentType: "application/json",
  });
  await capture(page, info, "final", page.locator(".workspace"));
  expect(
    state.ledger.filter(({ disposition }) => disposition === "refused"),
  ).toEqual([]);
  expect(state.expected).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`CONTROLS129.board-${width}: Board actions stay above deeply scrolled results`, async ({
    page,
  }, info) => {
    await mount(page, width, board, boardPage());
    const pane = boardPane(page);
    await expect(heading(page, boardTitle)).toBeVisible();
    const newThread = button(pane, "New thread");
    const more = button(pane, "Board actions");
    const filter = button(pane, "Board filters · 0");
    const pins = button(pane, "Pinned threads · 1");
    await scrollDeep(page, pane, "deep Board");
    await geometry(
      page,
      "deep Board controls",
      { newThread, more, filter, pins },
      true,
    );
    const group = pane.getByRole("group", {
      name: "Board list controls",
      exact: true,
    });
    const refresh = button(group, "Refresh");
    await expect(refresh).toBeVisible({ timeout: 1500 });
    await geometry(page, "deep Board refresh", { refresh }, true);
    await expect(
      group.getByRole("button", { name: "Board filters · 0" }),
    ).toBeVisible();
    await expect(
      group.getByRole("button", { name: "Pinned threads · 1" }),
    ).toBeVisible();
    const fills = await Promise.all(
      [newThread, filter, pins, refresh, more].map((control) =>
        control.evaluate((node) => getComputedStyle(node).backgroundColor),
      ),
    );
    expect(fills.slice(1)).not.toContain(fills[0]);
    await capture(page, info, "deep-board", pane);

    const before = await position(page);
    await more.press("Enter");
    const menu = page.getByRole("menu", { name: "Board actions", exact: true });
    await expect(
      menu.getByRole("menuitem", { name: "New red packet" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Save board" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Refresh", exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await geometry(page, "Board overflow focus return", { more });
    await filter.click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await button(dialog, "Creative notes").click();
    await button(dialog, "Cancel").click();
    await expect(filter).toBeFocused();
    await geometry(page, "Filter focus return", { filter });
    const pinned = link(pane, "Pinned guide");
    await expect(pinned).toBeHidden();
    await pins.press("Space");
    await expect(pins).toHaveAttribute("aria-expanded", "true");
    await expect(pinned).toBeVisible();
    await pins.press("Space");
    await expect(pinned).toBeHidden();
    expect(await position(page)).toEqual(before);

    await filter.click();
    await button(dialog, "Creative notes").click();
    allow(page, filtered, boardPage(true));
    await button(dialog, "Apply").click();
    await expect(pane.locator(".board-active-criteria")).toContainText(
      "Creative notes",
    );
    await expect(button(pane, "Board filters · 1")).toBeFocused();
    allow(page, filtered, boardPage(true, true));
    await refresh.click();
    await expect(link(pane, subject(99))).toBeVisible();
    expect(
      ledger(page)
        .slice(2)
        .map(({ url }) => url),
    ).toEqual([`${filtered}&tsdmapp=json`, `${filtered}&tsdmapp=json`]);
  });

  test(`CONTROLS129.row-${width}: title, exact Latest and metadata are distinct keyboard actions`, async ({
    page,
  }, info) => {
    await mount(page, width, board, boardPage());
    const pane = boardPane(page);
    await expect(heading(page, boardTitle)).toBeVisible();
    const row = pane.locator('[data-thread-id="42"]');
    const title = link(row, subject(42));
    const rowLatest = link(
      row,
      /Open latest post in.+Latest Author.+2026-11-20/i,
    );
    const metadata = button(row, /Details for.+6 replies/i);
    await geometry(page, "distinct Thread-row targets", {
      title,
      rowLatest,
      metadata,
    });
    await expect(title).toHaveAttribute("href", first);
    await expect(rowLatest).toHaveAttribute("href", latest);
    const before = await position(page);
    await title.focus();
    await geometry(page, "row title focus", { title });
    await page.keyboard.press("Tab");
    await expect(rowLatest).toBeFocused();
    await expect(rowLatest).toHaveCSS("outline-style", "solid");
    await geometry(page, "row Latest focus", { rowLatest });
    await page.keyboard.press("Tab");
    await expect(metadata).toBeFocused();
    await expect(metadata).toHaveCSS("outline-style", "solid");
    await geometry(page, "row metadata focus", { metadata });
    await metadata.press("Enter");
    await expect(row.locator("dl")).toContainText("Original Author");
    await expect(metadata).toBeFocused();
    expect(await position(page)).toEqual(before);
    await capture(page, info, "row-metadata", row);
    allow(page, first, threadPage(1));
    await title.press("Enter");
    await expect(heading(page, readerTitle)).toBeVisible();
    await expect(page.locator("#pid101")).toBeInViewport();
    await page.goBack();
    await expect(title).toBeFocused();
    allow(page, second, threadPage(2));
    await rowLatest.press("Enter");
    await expect(page.locator("#pid202")).toBeFocused();
    await expect(page.locator("#pid202")).toBeInViewport();
    await expect(link(page, "Continue in native forum")).toHaveAttribute(
      "href",
      `${second}&tsdm-native=1#pid202`,
    );
    await recordLatest(
      page,
      "exact row Latest target",
      page.locator("#pid202"),
    );
  });

  test(`CONTROLS129.reader-${width}: Page, Refresh and exact Latest remain reachable while reading`, async ({
    page,
  }, info) => {
    await mount(page, width, first, threadPage(1));
    const header = readerHeader(page);
    const pageButton = button(header, /^Page 1 \/ 2$/);
    const refresh = button(header, "Refresh thread");
    const jump = link(header, "Jump to latest");
    const more = button(header, "More thread options");
    await expect(heading(page, readerTitle)).toBeVisible();
    await scrollDeep(page, readerPane(page), "deep Reader");
    await geometry(
      page,
      "existing Reader controls",
      { pageButton, more },
      true,
    );
    await expect(refresh).toBeVisible({ timeout: 1500 });
    await expect(jump).toHaveAttribute("href", latest);
    await geometry(
      page,
      "deep Reader controls",
      { pageButton, refresh, jump, more },
      true,
    );
    await expect(link(page, "Continue in native forum")).toHaveAttribute(
      "href",
      `${first}&tsdm-native=1`,
    );
    await capture(page, info, "deep-reader", header);

    const before = await position(page);
    await more.press("Enter");
    const menu = page.getByRole("menu", {
      name: "More thread options",
      exact: true,
    });
    await expect(
      menu.getByRole("menuitem", { name: "Copy URL" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Save thread" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Refresh thread" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await pageButton.click();
    const dialog = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    const input = dialog.getByRole("spinbutton", { name: "Page number" });
    await expect(dialog.getByText("2 pages", { exact: true })).toBeVisible();
    await input.fill("2");
    await button(dialog, "Cancel").click();
    await expect(pageButton).toBeFocused();
    await geometry(page, "Page focus return", { pageButton });
    expect(await position(page)).toEqual(before);

    allow(page, first, threadPage(1));
    const refreshResponse = page.waitForResponse(`${first}&tsdmapp=json`);
    await refresh.click();
    await refreshResponse;
    await pageButton.click();
    await expect(input).toHaveValue("1");
    await input.fill("2");
    allow(page, second, threadPage(2));
    await button(dialog, "Go").click();
    await expect(button(header, /^Page 2 \/ 2/)).toBeVisible();
    await expect(jump).toHaveAttribute("href", latest);
    const beforeLatest = await position(page);
    await jump.press("Enter");
    await expect(page.locator("#pid202")).toBeFocused();
    await expect(page.locator("#pid202")).toBeInViewport();
    const afterLatest = await position(page);
    expect(afterLatest.length).toBe(beforeLatest.length);
    expect(afterLatest.requests).toBe(beforeLatest.requests);
    await expect(link(page, "Continue in native forum")).toHaveAttribute(
      "href",
      `${second}&tsdm-native=1#pid202`,
    );
    await recordLatest(
      page,
      "loaded Reader Latest target",
      page.locator("#pid202"),
    );
  });
}

test("CONTROLS129.direct: unknown total and unqualified Latest stay honest without loading the parent Board", async ({
  page,
}, info) => {
  const direct = `${thread}&authorid=9&page=1`;
  await mount(page, 390, direct, threadPage(1, false));
  await expect(heading(page, readerTitle)).toBeVisible();
  const header = readerHeader(page);
  const pageButton = button(header, /^Page 1(?:\s*[·/].*)?$/);
  await expect(pageButton).toHaveText("Page 1", { timeout: 1500 });
  await expect(pageButton).toHaveAccessibleDescription(/total is unknown/i);
  await expect(link(header, "Jump to latest")).toHaveCount(0);
  await expect(link(header, boardTitle)).toHaveAttribute("href", board);
  const before = await position(page);
  await pageButton.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  await expect(dialog.getByText(/total is unknown/i)).toBeVisible();
  await dialog.getByRole("spinbutton", { name: "Page number" }).fill("3");
  await expect(button(dialog, "Go")).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(pageButton).toBeFocused();
  await geometry(page, "direct Reader Page focus", { pageButton });
  await button(page, "Boards pane").click();
  const more = button(page, "Board actions");
  await expect(button(page, "New thread")).toBeInViewport();
  await more.press("Enter");
  const menu = page.getByRole("menu", { name: "Board actions", exact: true });
  await expect(
    menu.getByRole("menuitem", { name: "New red packet" }),
  ).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Save board" })).toHaveCount(
    0,
  );
  await capture(page, info, "qualified-parent-fallback", menu);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  expect(await position(page)).toEqual(before);
});
