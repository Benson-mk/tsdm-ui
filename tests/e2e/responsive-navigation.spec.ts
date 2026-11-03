import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5&filter=typeid&typeid=3&page=2`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const board = `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion 音樂</a></h1></div><div id="thread_types"><a class="a" href="${boardURL}">Listening notes</a></div><table id="threadlisttableid">${Array.from({ length: 30 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Listening ${i} 音樂筆記</a></th><td class="by"><cite>Writer Seven</cite></td></tr></tbody>`).join("")}</table><div class="pg"><strong>2</strong><a href="forum.php?mod=forumdisplay&fid=5&filter=typeid&typeid=3&page=3">3</a></div>`;
const thread = `${account}<div id="pt"><a href="${boardURL}">Music discussion 音樂</a></div><div id="postlist"><h1 id="thread_subject">Listening notes 音樂閱讀</h1>${Array.from({ length: 15 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb"><p>${`Complete reading block ${i}. 音樂與閱讀。 `.repeat(60)}</p></div></div>`).join("")}</div>`;
const form = `${account}<div id="pt"><a href="${boardURL}">Music discussion 音樂</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input name="formhash" value="PRIVATE-TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="topicsubmit">Publish</button></form>`;
async function open(page: Page, destination = threadURL) {
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__responsive.js`)
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native fixture<script src="${origin}/__responsive.js"></script></body></html>`,
      });
    requests.push({ url: request.url(), method: request.method() });
    const url = new URL(request.url());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          url.searchParams.get("mod") === "post"
            ? form
            : url.searchParams.get("mod") === "forumdisplay"
              ? board
              : thread,
      }),
    });
  });
  await page.goto(destination);
  await expect(page.locator(".workspace")).toBeVisible();
  return requests;
}
async function geometry(page: Page) {
  return page.locator(".reading-pane").evaluate((pane) => ({
    readerTop: pane.getBoundingClientRect().top,
    readerHeight: pane.getBoundingClientRect().height,
    viewport: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
  }));
}

test("UX53.compact-reader: disclosed navigation preserves retained writing, focus and reader space", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page);
  const initialMenu = page.getByRole("button", {
    name: "Navigation · Boards",
    exact: true,
  });
  if (await initialMenu.isVisible()) await initialMenu.click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  if (await initialMenu.isVisible()) await initialMenu.press("Escape");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[unknown=v2]Retained writing 音樂[/unknown] [attach]321[/attach]");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator(".source-writing")).toHaveCount(0);
  const measured = await geometry(page);
  await info.attach("reader-geometry.json", {
    body: Buffer.from(JSON.stringify(measured, null, 2)),
    contentType: "application/json",
  });
  await info.attach("ordinary-retained-reader.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(measured.readerTop).toBeLessThanOrEqual(240);
  expect(measured.readerHeight).toBeGreaterThanOrEqual(422);
  const menu = page.getByRole("button", {
    name: "Navigation · Boards",
    exact: true,
  });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  expect(
    await menu.evaluate((node) => node.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => {
    node.scrollTop = 650;
  });
  const offset = await reader.evaluate((node) => node.scrollTop);
  const before = requests.length;
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeFocused();
  await expect(
    page
      .getByRole("link", { name: "Continue in native forum", exact: true })
      .first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  expect(await reader.evaluate((node) => node.scrollTop)).toBe(offset);
  expect(requests).toHaveLength(before);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown=v2]Retained writing 音樂[/unknown] [attach]321[/attach]",
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("request-ledger.json", {
    body: Buffer.from(JSON.stringify(requests, null, 2)),
    contentType: "application/json",
  });
});

test("UX53.result-context: direct arrival reclaims space while populated board results restore exact context", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  const direct = await page
    .locator(".reading-pane")
    .evaluate((node) => node.getBoundingClientRect().left);
  expect(direct).toBeLessThan(400);
  await page
    .locator(".boards-navigation")
    .getByRole("link", { name: "Music discussion 音樂", exact: true })
    .click();
  const results = page.locator(".results-pane");
  await expect(results.locator(".thread-row")).toHaveCount(30);
  await results.evaluate((node) => {
    node.scrollTop = 400;
  });

  const row = results.getByRole("link", {
    name: "Listening 8 音樂筆記",
    exact: true,
  });
  await row.scrollIntoViewIfNeeded();
  const offset = await results.evaluate((node) => node.scrollTop);
  expect(offset).toBeGreaterThan(0);
  await row.click();
  await expect(page.getByRole("article")).toHaveCount(15);
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(results.locator(".thread-row")).toHaveCount(30);
  await expect(
    results.getByRole("link", { name: "3", exact: true }),
  ).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=forumdisplay&fid=5&filter=typeid&typeid=3&page=3`,
  );
  const count = requests.length;
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(results.locator(".thread-row")).toHaveCount(30);
  expect(await results.evaluate((node) => node.scrollTop)).toBe(offset);
  await expect(
    page.getByRole("link", { name: "Continue in native forum", exact: true }),
  ).toHaveAttribute("href", `${boardURL}&tsdm-native=1`);
  expect(requests).toHaveLength(count);
  await info.attach("populated-results.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("request-ledger.json", {
    body: Buffer.from(JSON.stringify(requests, null, 2)),
    contentType: "application/json",
  });
});

for (const [language, menuLabel, settings, boards] of [
  ["en", "Navigation · Boards", "Settings", "Boards"],
  ["zh-CN", "导航 · 版块", "设置", "版块"],
  ["zh-TW", "導覽 · 版塊", "設定", "版塊"],
] as const) {
  test(`UX53.responsive-${language}: navigation remains reachable through text, theme and viewport changes without requests`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      (language) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({
            schema: 1,
            language,
            textSize: 100,
            theme: "light",
          }),
        ),
      language,
    );
    const requests = await open(page);
    const reader = page.locator(".reading-pane");
    await reader.evaluate((node) => {
      node.scrollTop = 600;
    });
    const menu = page.getByRole("button", { name: menuLabel, exact: true });
    await menu.click();
    await page.getByRole("button", { name: settings, exact: true }).click();
    for (const [size, theme] of [
      [150, "dark"],
      [70, "mono"],
      [100, "alias"],
      [100, "light"],
    ] as const) {
      await page.locator("#text-size").fill(String(size));
      await page.locator(`input[type=radio][value="${theme}"]`).check();
      await page.keyboard.press("Escape");
      for (const viewport of [
        { width: 768, height: 900 },
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await expect(page.getByRole("article")).toHaveCount(15);
        const overflow = await page.locator(".workspace").evaluate((node) => ({
          width: node.clientWidth,
          scroll: node.scrollWidth,
        }));
        expect(overflow.scroll).toBeLessThanOrEqual(overflow.width);
        expect(await reader.evaluate((node) => node.scrollTop)).toBeGreaterThan(
          0,
        );
      }
      // Closing a nonmodal disclosure keeps focus at its opener; no modal trap is promised.
      await menu.focus();
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await menu.click();
      const picker = page.getByRole("combobox", {
        name:
          language === "en"
            ? "Main destinations"
            : language === "zh-CN"
              ? "主要导航"
              : "主要導覽",
        exact: true,
      });
      await expect(picker).toBeVisible();
      await expect(picker.locator("option:checked")).toHaveText(boards);
      await info.attach(`${language}-${size}-${theme}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page.getByRole("button", { name: settings, exact: true }).click();
    }
    await page.keyboard.press("Escape");
    expect(requests).toHaveLength(1);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
  });
}

for (const deferredSettings of [false, true]) {
  test(`UX53.composing-escape-${deferredSettings ? "deferred-settings" : "editor"}: cancelling composition keeps navigation focus and the original deferred intent`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await open(page);
    const menu = page.getByRole("button", {
      name: "Navigation · Boards",
      exact: true,
    });
    await menu.click();
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const editor = page.getByLabel("Complete source", { exact: true });
    const source =
      "[unknown=v2]Retained writing 中文[/unknown] [attach]321[/attach]";
    await editor.fill(source);
    await editor.focus();
    const original = await editor.elementHandle();
    await editor.dispatchEvent("compositionstart", { data: "中" });
    if (deferredSettings)
      await page
        .getByRole("button", { name: "Settings", exact: true })
        .dispatchEvent("click");
    // Native engines may clear isComposing before emitting the final keyCode229 Escape.
    await editor.dispatchEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 229,
      isComposing: !deferredSettings,
      bubbles: true,
      cancelable: true,
    });
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(editor).toBeFocused();
    await editor.dispatchEvent("compositionend", { data: "" });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    await expect(
      page.getByText(/Finish the current input composition/),
    ).toHaveCount(0);
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    if (deferredSettings) {
      await expect(
        page.getByRole("dialog", { name: "Settings", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    } else await expect(editor).toBeFocused();
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(editor).toHaveValue(source);
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(retained.source).toBe(source);
    expect(requests).toHaveLength(2);
    expect(requests.every((request) => request.method === "GET")).toBe(true);
    await info.attach("composition-escape.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("composition-request-state.json", {
      body: Buffer.from(JSON.stringify({ requests, retained }, null, 2)),
      contentType: "application/json",
    });
  });
}

test("UX53.menu-appearance-frame: closing navigation rebases the retained reading anchor before later text changes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page);
  const paragraph = page.locator("#pid104 .post-content p").first();
  await paragraph.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const menu = page.getByRole("button", {
    name: "Navigation · Boards",
    exact: true,
  });
  await menu.click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#text-size").fill("90");
  await page.keyboard.press("Escape");
  await menu.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  const before = await paragraph.evaluate(
    (node) => node.getBoundingClientRect().top,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#text-size").fill("100");
  await page.keyboard.press("Escape");
  await expect
    .poll(async () =>
      Math.abs(
        (await paragraph.evaluate((node) => node.getBoundingClientRect().top)) -
          before,
      ),
    )
    .toBeLessThanOrEqual(1);
  expect(requests).toHaveLength(1);
  await info.attach("reflow-after-navigation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("reading-frame.json", {
    body: Buffer.from(
      JSON.stringify(
        {
          before,
          after: await paragraph.evaluate(
            (node) => node.getBoundingClientRect().top,
          ),
          requests,
        },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
});
