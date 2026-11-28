import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import { selectSourceEditor } from "./editor-controls";

const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = `${directoryURL}?mod=forumdisplay&fid=5`;
const threadURL = `${directoryURL}?mod=viewthread&tid=42`;
const searchURL = `${origin}/search.php?mod=forum&adv=yes&tsdmapp=json`;
const replyURL = `${directoryURL}?mod=post&action=reply&fid=5&tid=42&tsdmapp=json`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const readingTitle = "深層閱讀 — A long Thread title with retained reading";
const boardName = "Music discussion";
const directory = `${account}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table><tr><td><h2><a href="${boardURL}">${boardName}</a></h2><p>Original Board description</p></td>${Array.from({ length: 55 }, (_, index) => `<td><h2><a href="forum.php?mod=forumdisplay&fid=${index + 10}">Hierarchy Board ${index + 1}</a></h2></td>`).join("")}</tr></table></div>`;
const board = `${account}<div id="ct"><h1><a href="${boardURL}">${boardName}</a></h1></div><table id="threadlisttableid">${Array.from({ length: 38 }, (_, index) => `<tbody id="normalthread_${index + 42}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${index + 42}">Listening topic ${index + 1}</a></th><td class="by"><cite>Reader Seven</cite></td></tr></tbody>`).join("")}</table>`;
const thread = `${account}<div id="pt"><a href="${boardURL}">${boardName}</a></div><div id="postlist"><h1 id="thread_subject">${readingTitle}</h1>${Array.from({ length: 15 }, (_, index) => `<div id="post_${index + 100}"><div class="authi"><a href="home.php?mod=space&uid=9">Listener Nine</a></div><a id="postnum${index + 100}">${index + 1}</a><div class="pcb"><p>${`Reading contribution ${index + 1} 保留閱讀位置。 `.repeat(45)}</p></div></div>`).join("")}</div>`;
const search = `${account}<form class="searchform" method="post" action="search.php?mod=forum"><input name="formhash" type="hidden" value="SYNTHETIC"><input name="searchsubmit" type="hidden" value="yes"><label for="keywords">Keywords</label><input id="keywords" name="srchtxt"><label for="author">Author</label><input id="author" name="srchuname"><button type="submit">Search</button></form>`;
const reply = `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" type="submit">Reply</button></form>`;

const fixtures = new WeakMap<
  Page,
  {
    ledger: { method: string; url: string; response: string }[];
    operations: string[];
    observations: unknown[];
  }
>();

async function open(page: Page, initial = directoryURL) {
  const fixture = {
    ledger: [] as { method: string; url: string; response: string }[],
    operations: [] as string[],
    observations: [] as unknown[],
  };
  fixtures.set(page, fixture);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const reads = new Map([
    [
      `${directoryURL}?tsdmapp=json`,
      { body: directory, contentType: "text/html" },
    ],
    ...[
      [boardURL, board],
      [threadURL, thread],
    ].map(
      ([url, document]) =>
        [
          `${url}&tsdmapp=json`,
          {
            body: JSON.stringify({ document, uid: 7 }),
            contentType: "application/json",
          },
        ] as const,
    ),
    [searchURL, { body: search, contentType: "text/html" }],
    [replyURL, { body: reply, contentType: "text/html" }],
  ]);
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const record = (response: string) =>
      fixture.ledger.push({ method, url, response });
    if (method === "GET" && request.isNavigationRequest() && url === initial) {
      record("document");
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native fixture</body></html>",
      });
    }
    const response = method === "GET" && reads.get(url);
    if (response && !request.isNavigationRequest()) {
      record("fixture");
      fixture.operations.push(`${method} ${url}`);
      return route.fulfill(response);
    }
    record("refused");
    return route.abort();
  });
  await page.goto(initial);
  await page.addScriptTag({ content: built });
  await expect(page.locator(".workspace")).toBeVisible();
  return fixture;
}

const destinationBar = (page: Page) =>
  page.getByRole("navigation", { name: "Main destinations", exact: true });
const destination = (page: Page, name: string) =>
  destinationBar(page).getByRole("button", { name, exact: true });
const heading = (page: Page, name: string) =>
  page.getByRole("heading", { name, exact: true });
const overview = (page: Page) =>
  page.getByRole("region", { name: "Boards overview", exact: true });
const moreSurface = (page: Page) =>
  page.getByRole("dialog", { name: "More destinations", exact: true });
const results = (page: Page) =>
  page.getByRole("region", { name: "Thread results", exact: true });
const reader = (page: Page) => page.locator(".reading-pane");
const read = (url: string) => `GET ${url}`;
const directoryRead = read(`${directoryURL}?tsdmapp=json`);
const boardRead = read(`${boardURL}&tsdmapp=json`);
const threadRead = read(`${threadURL}&tsdmapp=json`);

async function enterThread(page: Page) {
  await page
    .getByRole("link", { name: boardName, exact: true })
    .first()
    .click();
  await results(page)
    .getByRole("link", { name: "Listening topic 1", exact: true })
    .click();
  await expect(heading(page, readingTitle)).toBeVisible();
}

async function scrollPane(pane: Locator, distance: number) {
  return pane.evaluate((node, distance) => {
    node.scrollTop = distance;
    return node.scrollTop;
  }, distance);
}

async function measure(page: Page, name: string) {
  const observation = await page.locator(".workspace").evaluate((node) => {
    const root = node.getRootNode() as ShadowRoot;
    const active = root.activeElement;
    const selectors = [
      ".workspace-body",
      ".navigation-body",
      ".board-thread-list",
      ".reading-pane",
      ".source-writing",
      '[aria-label="Main destinations"]',
      '[role="dialog"]',
    ];
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        visualHeight: visualViewport?.height,
        visualTop: visualViewport?.offsetTop,
        documentWidth: document.documentElement.scrollWidth,
      },
      active: active && {
        name: active.getAttribute("aria-label") ?? active.textContent?.trim(),
        bounds: active.getBoundingClientRect().toJSON(),
        outline: getComputedStyle(active).outline,
      },
      surfaces: selectors.flatMap((selector) =>
        [...root.querySelectorAll(selector)]
          .filter((surface) => surface.getClientRects().length)
          .map((surface) => ({
            selector,
            bounds: surface.getBoundingClientRect().toJSON(),
            scrollTop: surface.scrollTop,
            scrollWidth: surface.scrollWidth,
            clientWidth: surface.clientWidth,
          })),
      ),
    };
  });
  fixtures.get(page)!.observations.push({ name, ...observation });
  return observation;
}

async function captureSurface(
  page: Page,
  info: TestInfo,
  name: string,
  surface: Locator,
) {
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach(`${name}-a11y.txt`, {
    body: await surface.ariaSnapshot(),
    contentType: "text/plain",
  });
}

test.afterEach(async ({ page, browser }, info) => {
  const fixture = fixtures.get(page);
  if (!fixture) return;
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  if (await page.locator(".workspace").count()) await measure(page, "end");
  for (const [name, value] of [
    ["exact-requests.json", fixture.ledger],
    ["focus-and-geometry.json", fixture.observations],
  ] as const)
    await info.attach(name, {
      body: JSON.stringify(value, null, 2),
      contentType: "application/json",
    });
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(
    fixture.ledger.filter(({ response }) => response === "refused"),
  ).toEqual([]);
});

test.describe("touch navigation", () => {
  test.use({ viewport: { width: 390, height: 780 }, hasTouch: true });

  test("NAV127.phone: one tap from deep reading to Messages and all six More entries", async ({
    page,
  }, info) => {
    const fixture = await open(page);
    await enterThread(page);
    expect(await scrollPane(reader(page), 1250)).toBeGreaterThan(900);
    await measure(page, "deep Reader");
    for (const name of ["Boards", "Threads", "Messages", "More"])
      await expect(destination(page, name)).toBeInViewport({ ratio: 1 });
    await expect(destination(page, "Threads")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await captureSurface(
      page,
      info,
      "phone-deep-reading",
      destinationBar(page),
    );
    await destination(page, "Messages").tap();
    await expect(
      page.getByRole("button", { name: "Load messages", exact: true }),
    ).toBeVisible();
    await expect(destination(page, "Messages")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await destination(page, "More").tap();
    await captureSurface(page, info, "phone-more", moreSurface(page));
    await page.keyboard.press("Escape");
    await expect(destination(page, "More")).toBeFocused();
    for (const [name, entry] of [
      ["Saved", "Load saved threads"],
      ["Notices", "Load notices"],
      ["Drafts", "Load forum drafts"],
    ] as const) {
      await destination(page, "More").tap();
      await moreSurface(page).getByRole("button", { name, exact: true }).tap();
      await expect(
        page.getByRole("button", { name: entry, exact: true }),
      ).toBeVisible();
      await expect(destination(page, "More")).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    await destination(page, "More").tap();
    await moreSurface(page)
      .getByRole("button", { name: "Account", exact: true })
      .tap();
    await expect(heading(page, "Account")).toBeFocused();
    await expect(
      page
        .getByRole("dialog", { name: "Account", exact: true })
        .getByText(/Reader Seven|Account not yet confirmed/i),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(destination(page, "More")).toBeFocused();
    await destination(page, "More").tap();
    await moreSurface(page)
      .getByRole("button", { name: "Settings", exact: true })
      .tap();
    await expect(
      page.getByRole("dialog", { name: "Settings", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(destination(page, "More")).toBeFocused();
    await destination(page, "More").tap();
    await moreSurface(page)
      .getByRole("button", { name: "Search", exact: true })
      .tap();
    await expect(
      page.getByRole("textbox", { name: "Keywords", exact: true }),
    ).toBeVisible();
    expect(fixture.operations).toEqual([
      directoryRead,
      boardRead,
      threadRead,
      read(searchURL),
    ]);
    await destination(page, "Threads").tap();
    await expect(
      results(page).getByRole("heading", { name: boardName }),
    ).toBeVisible();
    expect(fixture.operations).toEqual([
      directoryRead,
      boardRead,
      threadRead,
      read(searchURL),
    ]);
  });
});

test("NAV127.directory: established hierarchy takes the tablet canvas, and Threads reopens its retained Board", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 820 });
  const fixture = await open(page);
  await enterThread(page);
  await destination(page, "Boards").click();
  await expect(overview(page)).toBeVisible();
  await expect(heading(page, readingTitle)).toBeHidden();
  expect((await overview(page).boundingBox())!.width).toBe(768);
  await expect(destination(page, "Boards")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await overview(page)
    .getByRole("searchbox", { name: "Filter boards" })
    .fill("Hierarchy Board 55");
  await expect(
    overview(page).getByRole("link", { name: "Hierarchy Board 55" }),
  ).toBeVisible();
  await expect(
    overview(page).getByRole("link", { name: boardName }),
  ).toBeHidden();
  await measure(page, "directory");
  expect(fixture.operations).toEqual([
    directoryRead,
    boardRead,
    threadRead,
    directoryRead,
  ]);
  await destination(page, "Threads").click();
  await expect(
    results(page).getByRole("heading", { name: boardName }),
  ).toBeVisible();
  await expect(overview(page)).toBeHidden();
  await expect(destination(page, "Threads")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goBack();
  await expect(overview(page)).toBeVisible();
  await expect(heading(page, readingTitle)).toBeHidden();
  await page.goForward();
  await expect(
    results(page).getByRole("heading", { name: boardName }),
  ).toBeVisible();
  expect(fixture.operations).toEqual([
    directoryRead,
    boardRead,
    threadRead,
    directoryRead,
  ]);
});

test("NAV127.directory-canvas: the established desktop All boards action hides unrelated retained reading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 850 });
  const fixture = await open(page);
  await enterThread(page);
  await destination(page, "All boards").click();
  await expect(overview(page)).toBeVisible();
  await measure(page, "desktop directory");
  await expect(heading(page, readingTitle)).toBeHidden();
  expect((await overview(page).boundingBox())!.width).toBeGreaterThan(1100);
  expect(fixture.operations).toEqual([
    directoryRead,
    boardRead,
    threadRead,
    directoryRead,
  ]);
});

test("NAV127.direct: Threads without Board results exposes the existing chooser without a speculative load", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  const fixture = await open(page, threadURL);
  await expect(heading(page, readingTitle)).toBeVisible();
  await destination(page, "Threads").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Choose a thread to read.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: boardName, exact: true }),
  ).toBeVisible();
  expect(fixture.operations).toEqual([threadRead]);
});

test("NAV127.desktop: Main destinations stays keyboard reachable after deep hierarchy scrolling", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 850 });
  const fixture = await open(page);
  await enterThread(page);
  const sidebar = page.locator(".navigation-body");
  const panes = [sidebar, results(page), reader(page)];
  for (const pane of panes) await expect(pane).toBeInViewport();
  const before = await Promise.all(panes.map((pane) => scrollPane(pane, 950)));
  expect(before.every((value) => value > 800)).toBe(true);
  const main = page.getByRole("button", {
    name: "Main destinations",
    exact: true,
  });
  await expect(main).toBeInViewport({ ratio: 1 });
  await main.focus();
  await page.keyboard.press("Enter");
  const choices = page.getByRole("dialog", {
    name: "Main destinations",
    exact: true,
  });
  await expect(choices).toBeVisible();
  await captureSurface(page, info, "desktop-main-destinations", choices);
  await page.keyboard.press("Escape");
  await expect(main).toBeFocused();
  const after = await Promise.all(
    panes.map((pane) => pane.evaluate((node) => node.scrollTop)),
  );
  expect(after).toEqual(before);
  await measure(page, "desktop return");
  expect(fixture.operations).toEqual([directoryRead, boardRead, threadRead]);
});

test("NAV127.edges: 959/960 focus return and an unsent composer share the safe visual viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 959, height: 800 });
  await page.emulateMedia({ forcedColors: "active" });
  await page.addInitScript(() => {
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        theme: "dark",
        textSize: 150,
        language: "en",
      }),
    );
    const viewport = window.visualViewport!;
    window.addEventListener("nav127-reduce-viewport", () => {
      Object.defineProperties(viewport, {
        height: { value: 440 },
        offsetTop: { value: 32 },
      });
      viewport.dispatchEvent(new Event("resize"));
    });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 20, left: 24, right: 25, bottom: 12, bottomMax: 34 },
  });
  const fixture = await open(page, threadURL);
  await expect(heading(page, readingTitle)).toBeVisible();
  await destination(page, "More").focus();
  await page.keyboard.press("Enter");
  await expect(moreSurface(page)).toBeVisible();
  await page.setViewportSize({ width: 960, height: 800 });
  const main = page.getByRole("button", {
    name: "Main destinations",
    exact: true,
  });
  await expect(
    page.getByRole("dialog", { name: "Main destinations", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(main).toBeFocused();
  expect(
    await main.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).not.toBe("none");
  await measure(page, "960 desktop focus");
  await page.setViewportSize({ width: 959, height: 800 });
  await expect(destination(page, "More")).toBeFocused();
  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ forcedColors: "none" });
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Unsent and still visible");
  await page.evaluate(() =>
    window.dispatchEvent(new Event("nav127-reduce-viewport")),
  );
  const bar = destination(page, "More");
  await expect
    .poll(async () => {
      const bounds = await bar.boundingBox();
      return bounds && bounds.y + bounds.height;
    })
    .toBeLessThanOrEqual(438);
  const send = page.getByRole("button", { name: "Send reply", exact: true });
  const sendBox = (await send.boundingBox())!;
  const barBox = (await bar.boundingBox())!;
  const sourceBox = (await source.boundingBox())!;
  expect(sendBox.y + sendBox.height).toBeLessThanOrEqual(barBox.y);
  expect(sourceBox.y).toBeGreaterThanOrEqual(32);
  expect(sourceBox.y + sourceBox.height).toBeLessThanOrEqual(barBox.y);
  for (const name of ["Boards", "Threads", "Messages", "More"]) {
    const bounds = (await destination(page, name).boundingBox())!;
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(24);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390 - 25);
  }
  const state = await measure(page, "reduced scale-one viewport with composer");
  expect(state.viewport.documentWidth).toBe(390);
  expect(
    state.surfaces.every(
      ({ scrollWidth, clientWidth }) => scrollWidth <= clientWidth,
    ),
  ).toBe(true);
  await expect(source).toHaveValue("Unsent and still visible");
  await info.attach("reduced-viewport.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(fixture.operations).toEqual([threadRead, read(replyURL)]);
  await cdp.detach();
});
