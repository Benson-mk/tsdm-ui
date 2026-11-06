import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const otherURL = `${origin}/forum.php?mod=forumdisplay&fid=6`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const directory = `${account}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table><tr><td><h2><a href="${boardURL}">Music discussion</a></h2><p>Complete board description</p></td><td><h2><a href="${otherURL}">Animation discussion</a></h2></td></tr></table></div>`;
function board(other = false) {
  return `${account}<div id="ct"><h1><a href="${other ? otherURL : boardURL}">${other ? "Animation discussion" : "Music discussion"}</a></h1></div><div id="thread_types"><a href="${boardURL}&filter=typeid&typeid=3">Listening notes</a></div><table id="threadlisttableid">${other ? '<tr><td class="emp">No threads</td></tr>' : ""}${Array.from({ length: other ? 0 : 30 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Complete listening title ${i} 音樂</a></th><td class="by"><cite>Writer Seven</cite></td></tr></tbody>`).join("")}</table>`;
}
function thread(id: string) {
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb"><p>${`Complete rich reading ${i} 音樂。 `.repeat(70)}</p></div></div>`).join("")}</div>`;
}
const privateURL = `${origin}/home.php?mod=space&do=pm&subop=view&touid=9`;
function privateConversation() {
  return `${account}<div id="ct"><div class="tbmu"><span id="membernum">12</span><a href="home.php?mod=space&uid=9">Listener Nine</a></div><div id="pm_ul">${Array.from({ length: 12 }, (_, i) => `<dl id="pmlist_${101 + i}"><dd class="avt"><a href="home.php?mod=space&uid=9">Avatar</a></dd><dd class="ptm"><a href="home.php?mod=space&uid=9">Listener Nine</a><br>${"Complete private reading. ".repeat(80)}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span></dd></dl>`).join("")}</div><form><input name="topmuid" value="9"></form></div>`;
}
const ledgers = new WeakMap<Page, string[]>();
async function open(page: Page, url = boardURL, head = "") {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__im73.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head>${head}</head><body>Native<script src="${origin}/__im73.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("do") === "pm"
            ? privateConversation()
            : parsed.searchParams.get("mod") === "post"
              ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit">Reply</button></form>`
              : parsed.searchParams.get("mod") === "viewthread"
                ? thread(parsed.searchParams.get("tid")!)
                : parsed.searchParams.get("mod") === "forumdisplay"
                  ? board(parsed.searchParams.get("fid") === "6")
                  : directory,
      }),
    });
  });
  await page.goto(url);
  await expect(page.locator(".workspace")).toBeVisible();
  return ledger;
}
test.afterEach(async ({ page }, info) => {
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("geometry.json", {
    body: JSON.stringify(
      await page.locator(".pane").evaluateAll((nodes) =>
        nodes.map((node) => ({
          class: node.className,
          bounds: node.getBoundingClientRect().toJSON(),
          scrollTop: node.scrollTop,
          scrollWidth: node.scrollWidth,
        })),
      ),
    ),
    contentType: "application/json",
  });
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("IM73.edges: exposed surfaces protect top, lateral and stable bottom edges while collapsed panes transfer ownership", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const browser = await page.context().newCDPSession(page);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, left: 42, right: 36, bottom: 12, bottomMax: 40 },
  });
  const ledger = await open(page);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Exact retained [quote]safe edges[/quote]");
  const original = await source.elementHandle();
  const padding = (selector: string) =>
    page.locator(selector).evaluate((node) => {
      const s = getComputedStyle(node),
        b = node.getBoundingClientRect();
      return {
        top: parseFloat(s.paddingTop),
        left: parseFloat(s.paddingLeft),
        right: parseFloat(s.paddingRight),
        bottom: parseFloat(s.paddingBottom),
        x: b.x,
        width: b.width,
        height: b.height,
        background: s.backgroundColor,
      };
    });
  const top = await padding(".workspace > header");
  expect(top.x).toBe(0);
  expect(top.width).toBe(1280);
  expect(top.top).toBe(28);
  expect(top.left).toBe(42);
  expect(top.right).toBe(36);
  expect(top.background).not.toBe("rgba(0, 0, 0, 0)");
  expect((await padding(".navigation-body")).left).toBe(42);
  expect((await padding(".navigation-footer")).left).toBe(42);
  expect((await padding(".reading-pane")).left).toBe(24);
  expect((await padding(".reading-pane")).right).toBe(36);
  expect((await padding(".source-writing")).bottom).toBe(52);
  expect((await padding(".source-writing")).height).toBeLessThanOrEqual(414);
  const reads = ledger.length;
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  expect((await padding("#thread-list-pane")).left).toBe(42);
  expect((await padding(".conversation-heading")).left).toBe(24);
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  expect((await padding(".conversation-heading")).left).toBe(42);
  expect((await padding(".reading-pane")).left).toBe(42);
  expect((await padding(".source-writing")).left).toBe(42);
  await info.attach("exposed-edge-geometry.json", {
    body: JSON.stringify({
      top,
      heading: await padding(".conversation-heading"),
      reading: await padding(".reading-pane"),
      composer: await padding(".source-writing"),
    }),
    contentType: "application/json",
  });
  await info.attach("exposed-lateral-edges.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, left: 42, right: 36, bottom: 30, bottomMax: 40 },
  });
  expect((await padding(".source-writing")).bottom).toBe(52);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { bottom: 50, bottomMax: 40 },
  });
  expect((await padding(".source-writing")).bottom).toBe(62);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { bottom: 28 },
  });
  expect((await padding(".source-writing")).bottom).toBe(40);
  await browser.send("Emulation.setSafeAreaInsetsOverride", { insets: {} });
  expect((await padding(".workspace > header")).top).toBe(4);
  expect((await padding(".source-writing")).bottom).toBe(12);
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Exact retained [quote]safe edges[/quote]");
  expect(ledger).toHaveLength(reads);
  expect(
    await page
      .locator(".workspace")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await browser.detach();
});

test("IM73.drawer: Boards owns its top inset once and reveals the final navigation action above the fixed footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const browser = await page.context().newCDPSession(page);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 28, left: 38, right: 30, bottom: 14, bottomMax: 36 },
  });
  await open(page);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  const geometry = await drawer.evaluate((node) => {
    const heading = node.querySelector<HTMLElement>(".pane-drawer-heading")!,
      style = getComputedStyle(node),
      h = getComputedStyle(heading);
    return {
      bounds: node.getBoundingClientRect().toJSON(),
      top: parseFloat(style.paddingTop),
      bottom: parseFloat(style.paddingBottom),
      headingTop: parseFloat(h.paddingTop),
      headingLeft: parseFloat(h.paddingLeft),
    };
  });
  expect(geometry.bounds.x).toBe(0);
  expect(geometry.bounds.y).toBe(0);
  expect(geometry.bounds.width).toBe(328);
  expect(geometry.bounds.height).toBe(844);
  expect(geometry.top).toBe(0);
  expect(geometry.headingTop).toBe(40);
  expect(geometry.headingLeft).toBe(38);
  expect(geometry.bottom).toBe(36);
  const last = drawer.locator(".navigation-body").locator("a, button").last();
  await last.scrollIntoViewIfNeeded();
  const item = await last.boundingBox();
  expect(item!.x).toBeGreaterThanOrEqual(38);
  const footer = (await drawer.locator(".navigation-footer").boundingBox())!;
  expect(item!.y + item!.height).toBeLessThanOrEqual(footer.y);
  expect(footer.y + footer.height).toBeLessThanOrEqual(808);
  await expect(
    drawer.getByRole("button", { name: "Close", exact: true }),
  ).toBeInViewport();
  await browser.detach();
});

test("IM73.dialogs: settings stay inside the safe rectangle with equal geometry across themes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const browser = await page.context().newCDPSession(page);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 28, left: 38, right: 30, bottom: 14, bottomMax: 36 },
  });
  await open(page, threadURL);
  const observations: {
    bounds: { x: number; y: number; width: number; height: number };
    background: string;
    color: string;
    shadow: boolean;
  }[] = [];
  for (const theme of ["light", "alias", "mono", "dark"]) {
    await openSettings(page);
    const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
    await dialog
      .getByRole("radio", {
        name: theme.charAt(0).toUpperCase() + theme.slice(1),
        exact: true,
      })
      .check();
    const measured = await dialog.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        bounds: node.getBoundingClientRect().toJSON(),
        background: style.backgroundColor,
        color: style.color,
        shadow: node.getRootNode() instanceof ShadowRoot,
      };
    });
    observations.push(measured);
    expect(measured.shadow).toBe(true);
    expect(measured.bounds.x).toBeGreaterThanOrEqual(54);
    expect(measured.bounds.right).toBeLessThanOrEqual(344);
    expect(measured.bounds.y).toBeGreaterThanOrEqual(44);
    expect(measured.bounds.bottom).toBeLessThanOrEqual(792);
    await dialog
      .getByRole("button", { name: "Close", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByRole("button", { name: "Close", exact: true }),
    ).toBeInViewport();
    await closeSettingsToWorkspace(page);
  }
  for (const observation of observations)
    expect(observation.bounds).toEqual(observations[0]!.bounds);
  expect(observations[2]!.background).toBe("rgb(255, 255, 255)");
  expect(observations[2]!.color).toBe("rgb(0, 0, 0)");
  expect(observations[3]!.background).toBe("rgb(0, 0, 0)");
  await info.attach("theme-safe-dialogs.json", {
    body: JSON.stringify(observations),
    contentType: "application/json",
  });
  await browser.detach();
});

for (const declaration of ["missing", "single", "duplicates"] as const)
  test(`IM73.metadata-${declaration}: active hints have one owner and native continuation restores exact declarations`, async ({
    page,
  }, info) => {
    const head =
      declaration === "missing"
        ? '<meta name="description" content="Native description">'
        : '<meta name="viewport" content="width=980, initial-scale=0.8, user-scalable=no, maximum-scale=1, interactive-widget=resizes-content" data-native="first"><meta name="description" content="Native description"><meta name="theme-color" media="(prefers-color-scheme: light)" content="#aabbcc">' +
          (declaration === "duplicates"
            ? '<meta NAME="VIEWPORT" content="width=760"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#123456">'
            : "");
    await open(page, threadURL, head);
    const viewport = page.locator('head meta[name="viewport" i]');
    const theme = page.locator('head meta[name="theme-color" i]');
    await expect(viewport).toHaveCount(1);
    await expect(theme).toHaveCount(1);
    const active = await viewport.getAttribute("content");
    expect(active).toContain("viewport-fit=cover");
    expect(active).toContain("width=device-width");
    expect(active).not.toContain("user-scalable=no");
    expect(active).not.toContain("maximum-scale=1");
    if (declaration !== "missing")
      expect(active).toContain("interactive-widget=resizes-content");
    await expect(theme).toHaveAttribute("content", "rgb(255, 255, 255)");
    await openSettings(page);
    await page.getByRole("radio", { name: "Dark", exact: true }).check();
    await expect(theme).toHaveAttribute("content", "rgb(0, 0, 0)");
    await closeSettingsToWorkspace(page);
    await page.evaluate(() => {
      window.addEventListener(
        "pagehide",
        () =>
          sessionStorage.setItem(
            "im73-native-metadata",
            JSON.stringify(
              [...document.head.querySelectorAll("meta")].map(
                (node) => node.outerHTML,
              ),
            ),
          ),
        { once: true },
      );
    });
    await page
      .getByRole("link", { name: "Continue in native forum", exact: true })
      .click();
    await expect(page).toHaveURL(/tsdm-native=1/);
    await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
    const restored = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("im73-native-metadata")!),
    );
    const expected = await page
      .locator("head meta")
      .evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
    expect(restored).toEqual(expected);
    expect(restored.join("")).toContain("Native description");
    await info.attach("native-metadata.json", {
      body: JSON.stringify({ declaration, active, restored, expected }),
      contentType: "application/json",
    });
  });

test("IM73.notices: global recovery notices and retained-writing review remain protected at lateral edges", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    sessionStorage.setItem("tsdm.workspace.recovery", "{broken"),
  );
  const browser = await page.context().newCDPSession(page);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 28, left: 38, right: 30, bottomMax: 36 },
  });
  await open(page, threadURL);
  const notice = page.locator(".workspace-status > [role=alert]").first();
  await expect(notice).toBeVisible();
  const noticePadding = await notice.evaluate((node) => ({
    left: parseFloat(getComputedStyle(node).paddingLeft),
    right: parseFloat(getComputedStyle(node).paddingRight),
  }));
  expect(noticePadding.left).toBe(38);
  expect(noticePadding.right).toBe(30);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retain exact [quote]source[/quote]");
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Boards navigation", exact: true })
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Complete listening title 1 音樂", exact: true })
    .click();
  const review = page.getByRole("dialog", {
    name: "Keep current writing?",
    exact: true,
  });
  await expect(review).toBeVisible();
  const bounds = await review.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(54);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(344);
  expect(bounds!.y).toBeGreaterThanOrEqual(44);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(792);
  await review
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  await expect(source).toHaveValue("Retain exact [quote]source[/quote]");
  await browser.detach();
});

test("IM73.portrait-fallback: portrait edges and unavailable VisualViewport retain source and reachable composer controls", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      configurable: true,
    }),
  );
  const browser = await page.context().newCDPSession(page);
  await browser.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 44, bottom: 34 },
  });
  const ledger = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Portrait complete source");
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await review.scrollIntoViewIfNeeded();
  await expect(review).toBeInViewport();
  const state = await page.locator(".source-writing").evaluate((node) => ({
    bounds: node.getBoundingClientRect().toJSON(),
    padding: getComputedStyle(node).paddingBottom,
    contentBottom: node
      .querySelector(".writing-content")!
      .getBoundingClientRect().bottom,
  }));
  expect(state.padding).toBe("42px");
  const action = await review.boundingBox();
  await info.attach("portrait-reachable-action.json", {
    body: JSON.stringify({ state, action }),
    contentType: "application/json",
  });
  expect(action!.y + action!.height).toBeLessThanOrEqual(810);
  const topPadding = await page
    .locator(".workspace > header")
    .evaluate((node) => getComputedStyle(node).paddingTop);
  expect(topPadding).toBe("48px");
  await expect(source).toHaveValue("Portrait complete source");
  expect(ledger.every((request) => request.startsWith("GET "))).toBe(true);
  await info.attach("portrait-no-visualviewport.json", {
    body: JSON.stringify(state),
    contentType: "application/json",
  });
  await browser.detach();
});

for (const mode of [
  "public",
  "private",
  "placeholder",
  "hidden-writing",
] as const)
  test(`IM73.bottom-owner-${mode}: reading and retained status stay above the safe bottom when no composer is visible`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const browser = await page.context().newCDPSession(page);
    await browser.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { bottom: 12, bottomMax: 40 },
    });
    const ledger = await open(
      page,
      mode === "private"
        ? privateURL
        : mode === "placeholder"
          ? boardURL
          : threadURL,
    );
    if (mode === "placeholder") {
      await expect(page.locator(".reader-placeholder")).toBeHidden();
      const results = page.locator(".results-pane");
      const last = results.getByRole("link", {
        name: "Complete listening title 29 音樂",
        exact: true,
      });
      await last.scrollIntoViewIfNeeded();
      await results.evaluate((node) => (node.scrollTop = node.scrollHeight));
      const action = (await last.boundingBox())!;
      expect(action.y + action.height).toBeLessThanOrEqual(860);
      await info.attach("browse-only-bottom.json", {
        body: JSON.stringify({ action, bounds: await results.boundingBox() }),
        contentType: "application/json",
      });
      await browser.detach();
      return;
    }
    if (mode === "private")
      await page
        .getByRole("button", { name: "Load private conversation", exact: true })
        .click();
    let writing:
      | import("@playwright/test").ElementHandle<SVGElement | HTMLElement>
      | null = null;
    if (mode === "hidden-writing") {
      await page
        .getByRole("button", { name: "Reply to this post", exact: true })
        .first()
        .click();
      const source = page.getByLabel("Complete source", { exact: true });
      await source.fill("Hidden retained [quote]exact[/quote]");
      writing = await source.elementHandle();
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await expect(source).toBeHidden();
    }
    const reader = page.locator(
      mode === "private" ? ".private-reading-pane" : ".reading-pane",
    );
    await expect(reader).toBeVisible();
    const last =
      mode === "private"
        ? reader.locator("article .post-content").last()
        : mode === "public"
          ? reader
              .getByRole("button", { name: "Reply to this post", exact: true })
              .last()
          : mode === "hidden-writing"
            ? page
                .getByRole("region", { name: "Retained writing", exact: true })
                .locator("summary")
            : reader.locator("p");
    await last.scrollIntoViewIfNeeded();
    await page.locator(".conversation-region").evaluate((node) => {
      for (const pane of [
        ...node.querySelectorAll<HTMLElement>(
          ".reading-pane, .conversation-status",
        ),
        node as HTMLElement,
      ])
        pane.scrollTop = pane.scrollHeight;
    });
    const geometry = await page
      .locator(".conversation-region")
      .evaluate((node) => ({
        bounds: node.getBoundingClientRect().toJSON(),
        padding: getComputedStyle(node).paddingBottom,
        reader: node
          .querySelector(".reading-pane, .reader-placeholder")!
          .getBoundingClientRect()
          .toJSON(),
        status: node
          .querySelector(".conversation-status")!
          .getBoundingClientRect()
          .toJSON(),
        composer: node.querySelector(".source-writing")
          ? getComputedStyle(node.querySelector(".source-writing")!).display
          : null,
      }));
    const action = await last.boundingBox();
    await info.attach("bottom-owner.json", {
      body: JSON.stringify({ mode, geometry, action }),
      contentType: "application/json",
    });
    expect(action!.y + action!.height).toBeLessThanOrEqual(861);
    expect(
      mode === "hidden-writing"
        ? geometry.status.bottom
        : geometry.reader.bottom,
    ).toBeLessThanOrEqual(860);
    const before = ledger.length;
    if (mode === "hidden-writing") {
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue("Hidden retained [quote]exact[/quote]");
      expect(await writing!.evaluate((node) => node.isConnected)).toBe(true);
      const ownership = await page
        .locator(".conversation-region")
        .evaluate((node) => ({
          outer: getComputedStyle(node).paddingBottom,
          composer: getComputedStyle(node.querySelector(".source-writing")!)
            .paddingBottom,
        }));
      expect(ownership).toEqual({ outer: "0px", composer: "52px" });
    }
    expect(ledger).toHaveLength(before);
    await browser.detach();
  });
