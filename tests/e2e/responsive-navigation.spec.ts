import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5&filter=typeid&typeid=3&page=2`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const board = `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion 音樂</a></h1></div><div id="thread_types"><a class="a" href="${boardURL}">Listening notes</a></div><table id="threadlisttableid">${Array.from({ length: 30 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Listening ${i} 音樂筆記</a></th><td class="by"><cite>Writer Seven</cite></td></tr></tbody>`).join("")}</table><div class="pg"><strong>2</strong><a href="forum.php?mod=forumdisplay&fid=5&filter=typeid&typeid=3&page=3">3</a></div>`;
const thread = `${account}<div id="pt"><a href="${boardURL}">Music discussion 音樂</a></div><div id="postlist"><h1 id="thread_subject">Listening notes 音樂閱讀</h1>${Array.from({ length: 15 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb"><p>${`Complete reading block ${i}. 音樂與閱讀。 `.repeat(60)}</p></div></div>`).join("")}</div>`;
const form = `${account}<div id="pt"><a href="${boardURL}">Music discussion 音樂</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input name="formhash" value="PRIVATE-TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><input name="attachnew[321][description]" value="Previously uploaded"><button name="topicsubmit">Publish</button></form>`;
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
test("UX53.result-context: direct arrival has useful list navigation while populated board results restore exact context", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  const direct = await page
    .locator(".reading-pane")
    .evaluate((node) => node.getBoundingClientRect().left);
  expect(direct).toBe(516);
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

for (const deferredSettings of [false, true]) {
  test(`IM66.composition-${deferredSettings ? "settings" : "drawer"}: IME Escape preserves the original deferred presentation intent`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await open(page);
    const boards = page.getByRole("button", {
      name: "Boards pane",
      exact: true,
    });
    await boards.click();
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const editor = page.getByLabel("Complete source", { exact: true });
    await editor.fill(
      "[unknown=v2]Retained writing 中文[/unknown] [attach]321[/attach]",
    );
    const original = await editor.elementHandle();
    await editor.focus();
    await editor.dispatchEvent("compositionstart", { data: "中" });
    if (deferredSettings)
      await page
        .getByRole("button", { name: "Settings", exact: true })
        .dispatchEvent("click");
    else await boards.dispatchEvent("click");
    await editor.dispatchEvent("keydown", {
      key: "Escape",
      keyCode: 229,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    await expect(editor).toBeFocused();
    await expect(page.getByRole("dialog")).toBeHidden();
    await editor.dispatchEvent("compositionend", { data: "" });
    const dialog = page.getByRole("dialog", {
      name: deferredSettings ? "Settings" : "Boards navigation",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(editor).toHaveValue(
      "[unknown=v2]Retained writing 中文[/unknown] [attach]321[/attach]",
    );
    expect(requests).toHaveLength(2);
    await info.attach("composition-request-state.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
    await info.attach("composition-escape.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

for (const [language, boardsLabel, threadsLabel, settings] of [
  ["en", "Boards pane", "Threads pane", "Settings"],
  ["zh-CN", "版块面板", "主题面板", "设置"],
  ["zh-TW", "版塊面板", "主題面板", "設定"],
] as const)
  test(`IM66.appearance-${language}: modal and docked panes retain reading through themes, text scale and every threshold`, async ({
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
    await reader.evaluate((node) => (node.scrollTop = 600));
    for (const [size, theme] of [
      [150, "dark"],
      [70, "mono"],
      [100, "alias"],
      [100, "light"],
    ] as const) {
      await page.getByRole("button", { name: settings, exact: true }).click();
      await page.locator("#text-size").fill(String(size));
      await page.locator(`input[type=radio][value="${theme}"]`).check();
      await page.keyboard.press("Escape");
      for (const width of [
        375, 559, 560, 767, 768, 959, 960, 1199, 1200, 1280, 1440, 1920,
      ]) {
        await page.setViewportSize({ width, height: 900 });
        const boards = page.getByRole("button", {
          name: boardsLabel,
          exact: true,
        });
        const threads = page.getByRole("button", {
          name: threadsLabel,
          exact: true,
        });
        await expect(boards).toBeVisible();
        await expect(threads).toBeVisible();
        await expect(reader).toBeVisible();
        expect(await reader.evaluate((node) => node.scrollTop)).toBeGreaterThan(
          0,
        );
        if (width < 960) {
          await boards.click();
          const drawer = page.locator(".pane-drawer");
          await expect(drawer).toBeVisible();
          expect(
            await drawer.evaluate((node) => node.getBoundingClientRect().width),
          ).toBe(Math.min(340, width - 32));
          expect(
            await drawer.evaluate(
              (node) => node.scrollWidth <= node.clientWidth,
            ),
          ).toBe(true);
          await page.keyboard.press("Escape");
          await expect(boards).toBeFocused();
        }
        expect(
          await page
            .locator(".workspace")
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
        ).toBe(true);
      }
      await info.attach(`${theme}-${size}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
    expect(requests).toHaveLength(1);
    await info.attach("request-ledger.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
