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
const ledgers = new WeakMap<Page, string[]>();
async function open(page: Page, url = boardURL) {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__im66.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__im66.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("mod") === "post"
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
test("IM66.progressive: exact independent thresholds preserve all manual choices and reader geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ledger = await open(page);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  const widths = () =>
    page
      .locator(".workspace-body")
      .evaluate((node) =>
        getComputedStyle(node).gridTemplateColumns.split(" ").map(parseFloat),
      );
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  const threads = page.getByRole("button", {
    name: "Threads pane",
    exact: true,
  });
  const before = ledger.length;
  for (const [hideBoards, hideThreads] of [
    [false, false],
    [true, false],
    [true, true],
    [false, true],
  ]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (
      ((await boards.getAttribute("aria-expanded")) === "false") !==
      hideBoards
    )
      await boards.click();
    if (
      ((await threads.getAttribute("aria-expanded")) === "false") !==
      hideThreads
    )
      await threads.click();
    for (const width of [
      1920, 1440, 1280, 1200, 1199, 961, 960, 959, 769, 768, 767, 561, 560, 559,
      390, 375, 559, 560, 561, 767, 768, 769, 959, 960, 961, 1440,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const expected = [
        ...(width >= 960 && !hideBoards ? [216] : []),
        ...(width >= 768 && !hideThreads ? [300] : []),
      ];
      expected.push(width - expected.reduce((sum, value) => sum + value, 0));
      await expect.poll(widths).toEqual(expected);
      await expect(boards).toBeVisible();
      await expect(threads).toBeVisible();
      await expect(page.locator(".reading-pane")).toBeVisible();
      expect(
        await page
          .locator(".workspace")
          .evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
    }
  }
  expect(ledger).toHaveLength(before);
});

test("IM66.drawer: Boards stays modal while narrow Threads preserves list scroll through toggles and docking", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const ledger = await open(page);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  const results = page.locator(".results-pane");
  await results.evaluate((node) => (node.scrollTop = 350));
  const offset = await results.evaluate((node) => node.scrollTop);
  const original = await results.elementHandle();
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  const threads = page.getByRole("button", {
    name: "Threads pane",
    exact: true,
  });
  const before = ledger.length;
  await boards.click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: "Boards navigation", exact: true }),
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  const surface = await drawer.evaluate((node) => ({
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
    background: getComputedStyle(node).backgroundColor,
  }));
  expect(surface.width).toBe(340);
  expect(surface.height).toBe(900);
  expect(surface.background).toBe("rgb(255, 255, 255)");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await drawer.evaluate((node) =>
        node.contains(
          node.getRootNode() instanceof ShadowRoot
            ? (node.getRootNode() as ShadowRoot).activeElement
            : document.activeElement,
        ),
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 767, height: 900 });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(boards).toBeFocused();
  await threads.click();
  await expect(drawer).toBeHidden();
  await expect(results).toBeVisible();
  expect(await results.evaluate((node) => node.scrollTop)).toBe(offset);
  await results.evaluate((node) => (node.scrollTop = 430));
  const saved = await results.evaluate((node) => node.scrollTop);
  await threads.click();
  await expect(results).toBeHidden();
  await expect(threads).toBeFocused();
  await threads.click();
  expect(await results.evaluate((node) => node.scrollTop)).toBe(saved);
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(drawer).toBeHidden();
  await expect(results).toBeVisible();
  expect(await results.evaluate((node) => node.scrollTop)).toBe(saved);
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await boards.click();
  await page.setViewportSize({ width: 959, height: 900 });
  await expect(drawer).toBeVisible();
  await page.setViewportSize({ width: 960, height: 900 });
  await expect(drawer).toBeHidden();
  expect(ledger).toHaveLength(before);
});

test("IM66.gestures: only a primary outside press and outside click dismiss, with composition-safe Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ledger = await open(page, threadURL);
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  await boards.click();
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  expect(
    await drawer.evaluate((node) => node.getBoundingClientRect().width),
  ).toBe(340);
  const overlay = page.locator(".pane-drawer-overlay");
  const inside = { x: 330, y: 700 },
    outside = { x: 375, y: 700 };
  await page.mouse.click(inside.x, inside.y);
  await expect(drawer).toBeVisible();
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.move(outside.x, outside.y);
  await page.mouse.up();
  await expect(drawer).toBeVisible();
  await page.mouse.move(outside.x, outside.y);
  await page.mouse.down();
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.up();
  await expect(drawer).toBeVisible();
  await page.mouse.click(outside.x, outside.y, { button: "right" });
  await expect(drawer).toBeVisible();
  await overlay.dispatchEvent("pointerdown", {
    isPrimary: true,
    button: 0,
    clientX: 375,
    clientY: 700,
  });
  await overlay.dispatchEvent("pointercancel");
  await overlay.dispatchEvent("click", {
    button: 0,
    clientX: 375,
    clientY: 700,
  });
  await expect(drawer).toBeVisible();
  await drawer.dispatchEvent("keydown", {
    key: "Escape",
    keyCode: 229,
    isComposing: true,
    bubbles: true,
    cancelable: true,
  });
  await expect(drawer).toBeVisible();
  await page.mouse.click(outside.x, outside.y);
  await expect(drawer).toBeHidden();
  await expect(boards).toBeFocused();
  await boards.click();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(boards).toBeFocused();
  expect(ledger).toHaveLength(1);
});

for (const width of [900, 390])
  test(`IM66.browse-${width}: board navigation reveals results and thread choice guards the exact retained writing`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const ledger = await open(page, threadURL);
    const reader = page.locator(".reading-pane");
    await page
      .getByRole("button", { name: "Reply to this post", exact: true })
      .first()
      .click();
    const editor = page.getByLabel("Complete source", { exact: true });
    await editor.fill("[unknown=x]Keep exact addressed writing 中文[/unknown]");
    const original = await editor.elementHandle();
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    await editor.evaluate((node: HTMLTextAreaElement) => {
      node.focus();
      node.setSelectionRange(3, 11);
    });
    await reader.evaluate((node) => (node.scrollTop = 600));
    const anchor = page.locator("#pid100 .post-content p").first();
    const anchorOffset = await anchor.evaluate(
      (node) => node.getBoundingClientRect().top,
    );
    const boards = page.getByRole("button", {
      name: "Boards pane",
      exact: true,
    });
    const frames = [
      await reader.evaluate((node) => ({
        scroll: node.scrollTop,
        bounds: node.getBoundingClientRect().toJSON(),
      })),
    ];
    await boards.click();
    frames.push(
      await reader.evaluate((node) => ({
        scroll: node.scrollTop,
        bounds: node.getBoundingClientRect().toJSON(),
      })),
    );
    await page
      .getByRole("dialog", { name: "Boards navigation", exact: true })
      .getByRole("link", { name: "Music discussion", exact: true })
      .click();
    await expect(page.locator(".results-pane .thread-row")).toHaveCount(30);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator(".results-pane")).toBeVisible();
    if (width < 768) {
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
      await expect(reader).toBeVisible();
    }
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    expect(await editor.inputValue()).toBe(retained.source);
    frames.push(
      await reader.evaluate((node) => ({
        scroll: node.scrollTop,
        bounds: node.getBoundingClientRect().toJSON(),
      })),
    );
    await test.info().attach("reader-transition.json", {
      body: JSON.stringify({
        frames,
        anchorOffset,
        after: await anchor.evaluate(
          (node) => node.getBoundingClientRect().top,
        ),
      }),
      contentType: "application/json",
    });

    expect(
      Math.abs(
        (await anchor.evaluate((node) => node.getBoundingClientRect().top)) -
          anchorOffset,
      ),
    ).toBeLessThanOrEqual(1);
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    const before = ledger.length;
    const other = page.getByRole("link", {
      name: "Complete listening title 1 音樂",
      exact: true,
    });
    await other.click();
    const guard = page.getByRole("dialog", {
      name: "Keep current writing?",
      exact: true,
    });
    await expect(guard).toBeVisible();
    expect(ledger).toHaveLength(before);
    await guard
      .getByRole("button", { name: "Continue editing", exact: true })
      .click();
    await expect(guard).toBeHidden();
    await expect(editor).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Thread 42", exact: true }),
    ).toBeVisible();
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await other.click();
    await guard
      .getByRole("button", {
        name: "Keep writing and read thread",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Thread 43", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
    const after = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(after.source).toBe(retained.source);
    expect(after.replyTarget).toEqual(retained.replyTarget);
    expect(ledger).toHaveLength(before + 1);
    expect(ledger.every((item) => item.startsWith("GET "))).toBe(true);
  });

test("IM66.editor-continuity: pane movement retains the editor selection, undo and addressed target", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const ledger = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill("Original addressed source 中文");
  await editor.press("End");
  await page.keyboard.insertText(" preserved undo");
  const original = await editor.elementHandle();
  const selected = await editor.evaluate((node: HTMLTextAreaElement) => {
    node.setSelectionRange(3, 10, "backward");
    return {
      start: node.selectionStart,
      end: node.selectionEnd,
      direction: node.selectionDirection,
    };
  });
  const before = ledger.length;
  for (const width of [390, 767, 768, 959, 960, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const boards = page.getByRole("button", {
      name: "Boards pane",
      exact: true,
    });
    if (width < 960) {
      await boards.click();
      await page.keyboard.press("Escape");
    } else {
      await boards.click();
      await boards.click();
    }
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    expect(
      await editor.evaluate((node: HTMLTextAreaElement) => ({
        start: node.selectionStart,
        end: node.selectionEnd,
        direction: node.selectionDirection,
      })),
    ).toEqual(selected);
  }
  await editor.focus();
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue("Original addressed source 中文");
  const retained = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(retained.replyTarget.postId).toBe("100");
  expect(retained.replyTarget.threadId).toBe("42");
  expect(ledger).toHaveLength(before);
});

test.describe("touch drawer", () => {
  test.use({ hasTouch: true });
  test("IM66.touch-dismiss: an outside touch restores the connected opener and the original reader", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const ledger = await open(page, threadURL);
    const reader = page.locator(".reading-pane");
    await reader.evaluate((node) => (node.scrollTop = 500));
    const boards = page.getByRole("button", {
      name: "Boards pane",
      exact: true,
    });
    await boards.tap();
    const drawer = page.getByRole("dialog", {
      name: "Boards navigation",
      exact: true,
    });
    expect(
      await drawer.evaluate((node) => node.getBoundingClientRect().width),
    ).toBe(288);
    await page.touchscreen.tap(310, 700);
    await expect(drawer).toBeHidden();
    await expect(boards).toBeFocused();
    expect(await reader.evaluate((node) => node.scrollTop)).toBe(500);
    expect(ledger).toHaveLength(1);
  });
});

test("F79.removed-opener: closing a drawer whose opener was removed focuses the connected workspace brand without scrolling the reader", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ledger = await open(page, threadURL);
  const reader = page.locator(".reading-pane");
  await reader.evaluate((n) => {
    n.scrollTop = 500;
  });
  const opener = page.getByRole("button", { name: "Boards pane", exact: true });
  await opener.click();
  await expect(page.locator(".pane-drawer")).toBeVisible();
  // Browser/host removal is the specified environmental failure; no internal owner is replaced.
  await opener.evaluate((node) => node.remove());
  await page.keyboard.press("Escape");
  await expect(page.locator(".pane-drawer")).toBeHidden();
  await expect(page.locator(".brand")).toBeFocused();
  expect(await reader.evaluate((n) => n.scrollTop)).toBe(500);
  expect(ledger).toHaveLength(1);
});
