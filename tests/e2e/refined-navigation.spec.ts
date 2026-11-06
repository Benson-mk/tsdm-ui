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
function thread(id: string, nativeBody = false) {
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb">${nativeBody ? `<div>Reading contribution ${i} 保持活躍閱讀。<br>Another visible line ${i}。</div>` : `<p>${`Complete rich reading ${i} 音樂。 `.repeat(70)}</p>`}</div></div>`).join("")}</div>`;
}
const ledgers = new WeakMap<Page, string[]>();
async function open(page: Page, url = boardURL, nativeBody = false) {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__ui82.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__ui82.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("mod") === "post" &&
          parsed.searchParams.get("action") === "newthread"
            ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input name="formhash" value="SYNTHETIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="topicsubmit">Publish</button></form>`
            : parsed.searchParams.get("mod") === "post"
              ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit">Reply</button></form>`
              : parsed.searchParams.get("mod") === "viewthread"
                ? thread(parsed.searchParams.get("tid")!, nativeBody)
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
test("UI82.header: named SVG controls, supplied brand and native escape share one reachable row at narrow boundaries", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        language: "zh-TW",
        textSize: 150,
        theme: "light",
      }),
    ),
  );
  await open(page, threadURL);
  const header = page.locator(".workspace > header");
  const boards = header.getByRole("button", { name: "版塊面板", exact: true });
  const threads = header.getByRole("button", { name: "主題面板", exact: true });
  const native = header.getByRole("link", {
    name: "在原版論壇中繼續",
    exact: true,
  });
  const frames = [];
  for (const width of [
    320, 375, 504, 589, 714, 717, 734, 767, 768, 779, 959, 960,
  ]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(boards).toBeVisible();
    await expect(threads).toBeVisible();
    await expect(native).toBeVisible();
    await expect(native).toHaveAttribute("href", `${threadURL}&tsdm-native=1`);
    for (const control of [boards, threads, native]) {
      await expect(control.locator("svg[aria-hidden=true]")).toHaveCount(1);
      const bounds = (await control.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    const b = (await boards.boundingBox())!,
      t = (await threads.boundingBox())!,
      n = (await native.boundingBox())!;
    expect(Math.abs(b.y - t.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.y - n.y)).toBeLessThanOrEqual(1);
    expect(t.x - b.x - b.width).toBeLessThanOrEqual(8);
    expect(
      await page
        .locator(".workspace")
        .evaluate((n) => n.scrollWidth <= n.clientWidth),
    ).toBe(true);
    const actions = await header
      .locator(".header-action")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect().toJSON()),
      );
    expect(
      Math.max(...actions.map((n) => n.y)) -
        Math.min(...actions.map((n) => n.y)),
    ).toBeLessThanOrEqual(1);
    for (const action of actions)
      expect(action.right).toBeLessThanOrEqual(width);
    frames.push({ width, boards: b, threads: t, native: n });
  }
  await expect(header.locator(".brand svg")).toHaveAttribute(
    "viewBox",
    "0 0 108 108",
  );
  await expect(header.locator(".brand")).toHaveText("TSDM");
  await page.setViewportSize({ width: 375, height: 844 });
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "true",
  );
  await boards.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(boards).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(threads).toBeFocused();
  expect(
    await threads.evaluate((n) => getComputedStyle(n).outlineStyle),
  ).not.toBe("none");
  await info.attach("narrow-header.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await native.click();
  await expect(page).toHaveURL(`${threadURL}&tsdm-native=1`);
  await expect(page.locator(".workspace")).toHaveCount(0);
  await info.attach("header-widths.json", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
});

test("UI82.browse-first: fresh results fill the browsing surface and narrow Threads retains reader and cross-board context", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 844 });
  const ledger = await open(page, `${origin}/forum.php`);
  const threads = page.getByRole("button", {
    name: "Threads pane",
    exact: true,
  });
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  const overview = page.getByRole("region", {
    name: "Boards overview",
    exact: true,
  });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(overview).toBeVisible();
  expect((await overview.boundingBox())!.width).toBe(375);
  await threads.click();
  await expect(overview).toBeVisible();
  await page
    .getByLabel("Filter boards on this page", { exact: true })
    .fill("Music");
  await boards.click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Filter boards on this page", { exact: true }),
  ).toHaveValue("Music");
  await overview
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  const results = page.locator(".results-pane");
  await expect(results).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
  const frames = [];
  for (const width of [375, 767, 768, 959, 960]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(results).toBeVisible();
    await expect
      .poll(async () => (await results.boundingBox())?.width)
      .toBe(width < 960 ? width : width - 216);
    const bounds = (await results.boundingBox())!;
    frames.push({ width, results: bounds });
  }
  await page.setViewportSize({ width: 375, height: 844 });
  const row = results.getByRole("link", {
    name: "Complete listening title 8 音樂",
    exact: true,
  });
  await row.scrollIntoViewIfNeeded();
  const scroll = await results.evaluate((n) => n.scrollTop);
  await row.click();
  const reader = page.locator(".reading-pane");
  await expect(reader).toBeVisible();
  await expect(results).toBeHidden();
  await reader.evaluate((n) => (n.scrollTop = 500));
  const firstPost = page.getByRole("article").first();
  const identity = await firstPost.elementHandle();
  const before = ledger.length;
  await threads.click();
  await expect(results).toBeVisible();
  await expect(reader).toBeHidden();
  await expect(row).toHaveAttribute("aria-current", "true");
  expect(await results.evaluate((n) => n.scrollTop)).toBe(scroll);
  await threads.click();
  await expect(reader).toBeVisible();
  expect(await reader.evaluate((n) => n.scrollTop)).toBe(500);
  expect(await identity!.evaluate((n) => n.isConnected)).toBe(true);
  expect(ledger).toHaveLength(before);
  await boards.click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  await expect(overview).toBeVisible();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await overview
    .getByRole("link", { name: "Animation discussion", exact: true })
    .click();
  await expect(
    results.getByRole("heading", { name: "Animation discussion", exact: true }),
  ).toBeVisible();
  await threads.click();
  await expect(
    page.getByRole("heading", { name: "Thread 50", exact: true }),
  ).toBeVisible();
  await threads.click();
  await expect(
    results.getByRole("heading", { name: "Animation discussion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to boards", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Return to reading", exact: true }),
  ).toHaveCount(0);
  expect(ledger.every((r) => r.startsWith("GET "))).toBe(true);
  await info.attach("fresh-browse-widths.json", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
});

test("UI82.fresh-writing: a new writing context stays reachable from browse-first navigation without a selected thread", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  const ledger = await open(page);
  await expect(page.locator(".results-pane")).toBeVisible();
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await expect(editor).toBeVisible();
  await editor.fill("Retained fresh writing 中文");
  const original = await editor.elementHandle();
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(page.locator(".results-pane")).toBeVisible();
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue("Retained fresh writing 中文");
  expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator(".results-pane")).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue("Retained fresh writing 中文");
  expect(ledger.every((r) => r.startsWith("GET "))).toBe(true);
});

test("UI82.same-retained-thread: choosing the retained thread from its board reveals it even when history reuses the reading result", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const ledger = await open(page, threadURL);
  const reader = page.locator(".reading-pane");
  await expect(reader).toBeVisible();
  await reader.evaluate((node) => (node.scrollTop = 422));
  const visibleBefore = await nativeBodyLines(page);
  const post = await page.getByRole("article").first().elementHandle();
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Boards overview", exact: true })
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  const row = page.locator(".results-pane").getByRole("link", {
    name: "Complete listening title 0 音樂",
    exact: true,
  });
  await expect(row).toHaveAttribute("aria-current", "true");
  const before = ledger.length;
  await row.click();
  await expect(reader).toBeVisible();
  await expect(page.locator(".results-pane")).toBeHidden();
  expect(await post!.evaluate((node) => node.isConnected)).toBe(true);
  const visibleAfter = await nativeBodyLines(page);
  const restored = visibleAfter.lines.find(
    (line) =>
      line.post === visibleBefore.first!.post &&
      line.index === visibleBefore.first!.index &&
      line.line === visibleBefore.first!.line,
  )!;
  expect(Math.abs(restored.top - visibleBefore.first!.top)).toBeLessThanOrEqual(
    1,
  );
  expect(ledger).toHaveLength(before);
  await info.attach("same-row-state.json", {
    body: JSON.stringify({
      requests: ledger,
      selected: await page
        .locator('.results-pane .subject[aria-current="true"]')
        .getAttribute("aria-current"),
      reader: await reader.boundingBox(),
    }),
    contentType: "application/json",
  });
});

async function nativeBodyLines(page: Page) {
  return page.locator(".reading-pane").evaluate((reader) => {
    const bounds = reader.getBoundingClientRect();
    const lines = [...reader.querySelectorAll(".post-content")].flatMap(
      (body) => {
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        let text: Node | null;
        let index = 0;
        const found = [];
        while ((text = walker.nextNode())) {
          if (!text.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(text);
          const textIndex = index++;
          found.push(
            ...[...range.getClientRects()]
              .filter((rect) => rect.width > 0 && rect.height > 0)
              .map((rect, line) => ({
                post: body.closest("article")!.id,
                index: textIndex,
                line,
                text: text!.textContent,
                top: rect.top,
                bottom: rect.bottom,
                offset: rect.top - bounds.top,
                visible:
                  rect.bottom > bounds.top + 1 && rect.top < bounds.bottom - 1,
              })),
          );
        }
        return found;
      },
    );
    return {
      pane: bounds.toJSON(),
      scroll: reader.scrollTop,
      maxScroll: reader.scrollHeight - reader.clientHeight,
      first: lines.find((line) => line.visible),
      lines,
    };
  });
}

test("UI82.native-body-anchor: browsing another board retains the visible native div/text line without scroll clamping", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const ledger = await open(page, threadURL, true);
  const reader = page.locator(".reading-pane");
  await expect(page.getByRole("article")).toHaveCount(12);
  await reader.evaluate((node) => (node.scrollTop = 422));
  const before = await nativeBodyLines(page);
  expect(before.scroll).toBeGreaterThan(100);
  expect(before.maxScroll - before.scroll).toBeGreaterThan(100);
  expect(before.first).toBeTruthy();
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Boards overview", exact: true })
    .getByRole("link", { name: "Animation discussion", exact: true })
    .click();
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(reader).toBeVisible();
  const after = await nativeBodyLines(page);
  const restored = after.lines.find(
    (line) =>
      line.post === before.first!.post &&
      line.index === before.first!.index &&
      line.line === before.first!.line,
  )!;
  await info.attach("native-body-anchor.json", {
    body: JSON.stringify({ before, after, restored, requests: ledger }),
    contentType: "application/json",
  });
  expect(restored.visible).toBe(true);
  expect(Math.abs(restored.top - before.first!.top)).toBeLessThanOrEqual(1);
  expect(after.scroll).toBeGreaterThan(100);
  expect(after.maxScroll - after.scroll).toBeGreaterThan(100);
});

test("UI82.same-current-thread: selecting the current row from a toggled list reveals the cached reader without a result-object change", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const ledger = await open(page);
  const row = page.locator(".results-pane").getByRole("link", {
    name: "Complete listening title 0 音樂",
    exact: true,
  });
  await row.click();
  const reader = page.locator(".reading-pane");
  await expect(reader).toBeVisible();
  await reader.evaluate((node) => (node.scrollTop = 422));
  const visibleBefore = await nativeBodyLines(page);
  const original = await page.getByRole("article").first().elementHandle();
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(row).toBeVisible();
  const before = ledger.length;
  await row.click();
  await expect(reader).toBeVisible();
  await expect(page.locator(".results-pane")).toBeHidden();
  expect(ledger).toHaveLength(before);
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  const visibleAfter = await nativeBodyLines(page);
  const restored = visibleAfter.lines.find(
    (line) =>
      line.post === visibleBefore.first!.post &&
      line.index === visibleBefore.first!.index &&
      line.line === visibleBefore.first!.line,
  )!;
  expect(Math.abs(restored.top - visibleBefore.first!.top)).toBeLessThanOrEqual(
    1,
  );
  await info.attach("same-current-row-requests.json", {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
});
