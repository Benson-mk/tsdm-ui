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
    if (parsed.pathname === "/__ui92.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head>${head}</head><body>Native<script src="${origin}/__ui92.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          parsed.searchParams.get("do") === "pm"
            ? privateConversation()
            : parsed.searchParams.get("mod") === "post"
              ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`
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
test("UI92.external-edges: wide reading and writing protect only exposed lateral edges and resize strips stop above the bottom reserve", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, left: 42, right: 48, bottom: 12, bottomMax: 40 },
  });
  const requests = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Exact [quote]edge source[/quote]");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const measure = () =>
    page
      .locator(
        ".workspace > header, .navigation-footer, .conversation-heading, .reading-pane, .source-writing, .column-separator",
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            class: node.className,
            box: node.getBoundingClientRect().toJSON(),
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
            bottom: parseFloat(style.paddingBottom),
            background: style.backgroundColor,
          };
        }),
      );
  const before = await measure();
  await info.attach("wide-exposed-edges.json", {
    body: JSON.stringify(before),
    contentType: "application/json",
  });
  const header =
    before.find((node) => node.class.includes("workspace-header")) ??
    before[0]!;
  expect(header.box.x).toBe(0);
  expect(header.box.right).toBe(1706);
  expect(
    before.find((node) => node.class.includes("reading-pane"))!.right,
  ).toBe(24);
  expect(
    before.find((node) => node.class.includes("source-writing"))!.left,
  ).toBe(24);
  expect(
    before.find((node) => node.class.includes("source-writing"))!.right,
  ).toBe(48);
  for (const strip of before.filter((node) =>
    node.class.includes("column-separator"),
  ))
    expect(strip.box.bottom).toBeLessThanOrEqual(860);
  for (const name of ["Boards pane", "Threads pane"])
    await page.getByRole("button", { name, exact: true }).click();
  const collapsed = await measure();
  expect(
    collapsed.find((node) => node.class.includes("reading-pane"))!.left,
  ).toBe(42);
  expect(
    collapsed.find((node) => node.class.includes("source-writing"))!.left,
  ).toBe(24);
  expect(
    collapsed.find((node) => node.class.includes("source-writing"))!.box.right,
  ).toBe(1706);
  expect(
    collapsed.find((node) => node.class.includes("source-writing"))!.background,
  ).not.toBe("rgba(0, 0, 0, 0)");
  await expect(source).toHaveValue("Exact [quote]edge source[/quote]");
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
  await cdp.detach();
});

test("UI92.browsing-edges: unselected results own the outside right edge and bottom resume owns the bottom reserve once", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { left: 42, right: 48, bottomMax: 40 },
  });
  await open(page);
  const results = page.locator("#thread-list-pane");
  expect(
    await results.evaluate((node) =>
      parseFloat(getComputedStyle(node).paddingRight),
    ),
  ).toBe(48);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  expect(
    await results.evaluate((node) =>
      parseFloat(getComputedStyle(node).paddingLeft),
    ),
  ).toBe(42);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Resume preserved source");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const geometry = await page
    .locator(
      ".conversation-region, .bottom-resume, .composer-entry, .navigation-footer",
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        class: node.className,
        box: node.getBoundingClientRect().toJSON(),
        bottom: parseFloat(getComputedStyle(node).paddingBottom),
        background: getComputedStyle(node).backgroundColor,
      })),
    );
  await info.attach("resume-bottom-owner.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  expect(
    geometry.find((node) => node.class.includes("conversation-region"))!.bottom,
  ).toBe(0);
  const resume = geometry.find((node) => node.class.includes("bottom-resume"))!;
  expect(resume.bottom).toBe(44);
  expect(
    geometry.find((node) => node.class.includes("composer-entry"))!.bottom,
  ).toBe(12);
  expect(resume.box.bottom).toBe(900);
  expect(resume.background).not.toBe("rgba(0, 0, 0, 0)");
  await page.setViewportSize({ width: 375, height: 560 });
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(results).toBeVisible();
  expect(
    await page
      .locator(".browsing-writing-status")
      .evaluate((node) => parseFloat(getComputedStyle(node).paddingBottom)),
  ).toBe(0);
  await cdp.detach();
});

async function simulateViewport(page: Page) {
  await page.addInitScript(() => {
    const values = { height: innerHeight, offsetTop: 0, scale: 1 };
    for (const key of ["height", "offsetTop", "scale"] as const)
      Object.defineProperty(window.visualViewport!, key, {
        configurable: true,
        get: () => values[key],
      });
    Object.assign(window, { __ui92Viewport: values });
  });
}
async function panViewport(page: Page, height: number, offsetTop: number) {
  await page.evaluate(
    ({ height, offsetTop }) => {
      Object.assign(Reflect.get(window, "__ui92Viewport"), {
        height,
        offsetTop,
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
      window.visualViewport!.dispatchEvent(new Event("scroll"));
    },
    { height, offsetTop },
  );
}

test("UI92.safe-overlays: menu keyboard actions and Settings stay within the panned safe rectangle", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await simulateViewport(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 28, left: 38, right: 30, bottomMax: 36 },
  });
  const requests = await open(page, threadURL);
  await panViewport(page, 360, 100);
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const box = (await menu.boundingBox())!;
  await info.attach("panned-safe-menu.json", {
    body: JSON.stringify(box),
    contentType: "application/json",
  });
  expect(box.x).toBeGreaterThanOrEqual(38);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y).toBeGreaterThanOrEqual(128);
  expect(box.y + box.height).toBeLessThanOrEqual(424);
  await page.keyboard.press("End");
  const focused = await menu.evaluate((node) =>
    (node.getRootNode() as ShadowRoot)
      .activeElement!.getBoundingClientRect()
      .toJSON(),
  );
  expect(focused.top).toBeGreaterThanOrEqual(128);
  expect(focused.bottom).toBeLessThanOrEqual(424);
  await panViewport(page, 280, 100);
  await expect
    .poll(async () => {
      const current = (await menu.boundingBox())!;
      return current.y + current.height;
    })
    .toBeLessThanOrEqual(344);
  await panViewport(page, 360, 100);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "More thread options", exact: true }),
  ).toBeFocused();
  await openSettings(page);
  const settings = page.getByRole("dialog", { name: "Settings", exact: true });
  const settingsBox = (await settings.boundingBox())!;
  expect(settingsBox.y).toBeGreaterThanOrEqual(144);
  expect(settingsBox.y + settingsBox.height).toBeLessThanOrEqual(408);
  await closeSettingsToWorkspace(page);
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
  await cdp.detach();
});

test("UI92.short-review: keyboard-height writing preserves exact source selection and target while real Review and history remain reachable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await simulateViewport(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, left: 0, right: 0, bottomMax: 36 },
  });
  const requests = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Exact [quote]retained short source[/quote]");
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(13, 21, "backward"),
  );
  await source.dispatchEvent("select");
  const original = await source.elementHandle();
  await panViewport(page, 300, 40);
  await expect(source).toBeFocused();
  await expect(source).toHaveValue(
    "Exact [quote]retained short source[/quote]",
  );
  expect(
    await source.evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
      node.selectionDirection,
    ]),
  ).toEqual([13, 21, "backward"]);
  const focused = (await source.boundingBox())!;
  expect(focused.y).toBeGreaterThanOrEqual(64);
  expect(focused.y + focused.height).toBeLessThanOrEqual(304);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText("retained short source");
  await expect(review).toContainText("Composer Nine");
  const cancel = review.getByRole("button", {
    name: "Cancel review and return to writing",
    exact: true,
  });
  await cancel.scrollIntoViewIfNeeded();
  const cancelBox = (await cancel.boundingBox())!;
  expect(cancelBox.y).toBeGreaterThanOrEqual(64);
  expect(cancelBox.y + cancelBox.height).toBeLessThanOrEqual(304);
  await info.attach("short-review.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("short-review-state.json", {
    body: JSON.stringify({
      source: await source.inputValue(),
      review: await review.innerText(),
      cancelBox,
      focused,
    }),
    contentType: "application/json",
  });
  await cancel.click();
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue(
    "Exact [quote]retained short source[/quote]",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => (node.scrollTop = 700));
  await expect(page.locator(".conversation-heading")).toHaveAttribute(
    "data-compact",
    "true",
  );
  await reader.scrollIntoViewIfNeeded();
  const visible = await reader.evaluate((node) => {
    const r = node.getBoundingClientRect(),
      o = node.closest(".conversation-region")!.getBoundingClientRect();
    return Math.min(r.bottom, o.bottom, 304) - Math.max(r.top, o.top, 64);
  });
  await info.attach("short-history-owners.json", {
    body: JSON.stringify(
      await page
        .locator(
          ".workspace, .workspace > header, .workspace-body, .conversation-region, .conversation-heading, .bottom-resume, .reading-pane",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            class: node.className,
            rect: node.getBoundingClientRect().toJSON(),
            scroll: node.scrollTop,
            height: node.scrollHeight,
          })),
        ),
    ),
    contentType: "application/json",
  });
  expect(visible).toBeGreaterThanOrEqual(95);
  expect(
    await page
      .locator(".workspace")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
  await cdp.detach();
});

async function visibleCharacter(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.locator(".reading-pane").evaluateHandle((pane) => {
    const bounds = pane.getBoundingClientRect();
    const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (
        !node.parentElement?.closest(".post-content") ||
        !node.textContent?.trim()
      )
        continue;
      const range = document.createRange();
      for (let offset = 0; offset < node.textContent.length; offset++) {
        if (!node.textContent[offset]?.trim()) continue;
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const r = range.getBoundingClientRect();
        if (r.width > 0 && r.top >= bounds.top && r.bottom <= bounds.bottom)
          return {
            range,
            pane,
            post: node.parentElement.closest("article")!.id,
            text: node.textContent,
            offset,
            top: r.top - bounds.top,
          };
      }
    }
    throw Error("No genuinely visible reading character");
  });
}
async function expectCharacter(
  handle: Awaited<ReturnType<typeof visibleCharacter>>,
) {
  await handle.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const result = await handle.evaluate(
    ({ range, pane, post, text, offset, top }) => {
      const r = range.getBoundingClientRect(),
        b = pane.getBoundingClientRect();
      return {
        post,
        actualPost: range.startContainer.parentElement?.closest("article")?.id,
        text,
        actualText: range.startContainer.textContent,
        offset,
        actualOffset: range.startOffset,
        top,
        after: r.top - b.top,
        visible: r.top >= b.top - 1 && r.bottom <= b.bottom + 1,
        scroll: pane.scrollTop,
      };
    },
  );
  expect(result.visible, JSON.stringify(result)).toBe(true);
  expect(result.actualPost).toBe(result.post);
  expect(result.actualText).toBe(result.text);
  expect(result.actualOffset).toBe(result.offset);
  expect(Math.abs(result.after - result.top)).toBeLessThanOrEqual(1);
  expect(result.scroll).toBeGreaterThan(0);
  return result;
}

// Cover each parent-reported width and both sides of every docking/wide threshold.
// Short heights and safe-area variants are distributed, rather than multiplied.
for (const [width, height, inset] of [
  [375, 560, "portrait"],
  [504, 420, "lateral"],
  [589, 520, "current"],
  [714, 420, "lateral"],
  [717, 520, "portrait"],
  [734, 420, "current"],
  [767, 520, "lateral"],
  [768, 420, "portrait"],
  [779, 520, "current"],
  [959, 520, "lateral"],
  [960, 420, "portrait"],
  [1439, 520, "current"],
  [1440, 420, "lateral"],
  [1706, 900, "portrait"],
] as const)
  test(`UI92.matrix-${width}: ${inset} safe edges retain a visible reading character, writing selection and direct resizing at ${height}px height`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1706, height: 900 });
    const cdp = await page.context().newCDPSession(page);
    const safe =
      inset === "lateral"
        ? { top: 0, left: 42, right: 36, bottom: 12, bottomMax: 40 }
        : inset === "portrait"
          ? { top: 24, left: 0, right: 0, bottom: 12, bottomMax: 36 }
          : { top: 0, left: 0, right: 0, bottom: 28 };
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: safe });
    const requests = await open(page);
    await page
      .getByRole("link", {
        name: "Complete listening title 0 音樂",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Reply to this post", exact: true })
      .first()
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Retained original 中文 source");
    await source.evaluate((node: HTMLTextAreaElement) =>
      node.setSelectionRange(9, 17),
    );
    await source.dispatchEvent("select");
    const original = await source.elementHandle();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const reader = page.locator(".reading-pane");
    await reader.evaluate((node) => (node.scrollTop = 700));
    await expect(page.locator(".conversation-heading")).toHaveAttribute(
      "data-compact",
      "true",
    );
    const anchor = await visibleCharacter(page);
    const reads = requests.length;
    await page.setViewportSize({ width, height });
    await expect
      .poll(async () => (await page.locator(".workspace").boundingBox())!.width)
      .toBe(width);
    const observation = await expectCharacter(anchor);
    const bottom = safe.bottomMax ?? safe.bottom;
    const shape = await page
      .locator(".workspace > header, .source-writing, .column-separator")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          class: node.className,
          box: node.getBoundingClientRect().toJSON(),
          paddingBottom: parseFloat(getComputedStyle(node).paddingBottom),
        })),
      );
    expect(shape[0]!.box.x).toBe(0);
    expect(shape[0]!.box.right).toBe(width);
    expect(
      shape.find((node) => node.class.includes("source-writing"))!
        .paddingBottom,
    ).toBe((width < 560 ? 8 : 12) + bottom);
    expect(
      await page
        .locator(".workspace")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    for (const edge of await page.getByRole("separator").all()) {
      const box = (await edge.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(height - bottom);
      const before = await visibleCharacter(page);
      await edge.press("ArrowRight");
      await expectCharacter(before);
      const afterKey = await visibleCharacter(page);
      const moved = (await edge.boundingBox())!;
      await page.mouse.move(
        moved.x + moved.width / 2,
        moved.y + moved.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        moved.x + moved.width / 2 + 16,
        moved.y + moved.height / 2,
        { steps: 3 },
      );
      await page.mouse.up();
      await expectCharacter(afterKey);
    }
    expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(source).toHaveValue("Retained original 中文 source");
    expect(
      await source.evaluate((node: HTMLTextAreaElement) => [
        node.selectionStart,
        node.selectionEnd,
      ]),
    ).toEqual([9, 17]);
    await expect(
      page.locator(".source-writing").getByRole("link", {
        name: "Addressed to Composer Nine · Post 100",
        exact: true,
      }),
    ).toHaveAttribute(
      "href",
      `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=100`,
    );
    expect(requests).toHaveLength(reads);
    await info.attach("matrix-state.json", {
      body: JSON.stringify({
        width,
        height,
        safe,
        observation,
        shape,
        source: await source.inputValue(),
        requests,
      }),
      contentType: "application/json",
    });
    await cdp.detach();
  });

test("UI92.wide-bottom: the wide reader protects its final post action independently of the adjacent writer", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { bottom: 12, bottomMax: 40 },
  });
  await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => (node.scrollTop = node.scrollHeight));
  await expect(page.locator(".conversation-heading")).toHaveAttribute(
    "data-compact",
    "true",
  );
  await reader.evaluate((node) => (node.scrollTop = node.scrollHeight));
  const action = reader
    .getByRole("button", { name: "Reply to this post", exact: true })
    .last();
  const box = (await action.boundingBox())!;
  await info.attach("wide-reader-bottom.json", {
    body: JSON.stringify({ box, reader: await reader.boundingBox() }),
    contentType: "application/json",
  });
  expect(box.y + box.height).toBeLessThanOrEqual(860);
  await cdp.detach();
});

test("UI92.short-drawer: enlarged navigation and account actions remain reachable with one portrait bottom reserve", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 360 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        textSize: 150,
        theme: "dark",
        language: "en",
      }),
    ),
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, bottom: 12, bottomMax: 36 },
  });
  await open(page);
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  const last = drawer.locator(".navigation-body").locator("a, button").last();
  await last.scrollIntoViewIfNeeded();
  const footer = (await drawer.locator(".navigation-footer").boundingBox())!;
  const action = (await last.boundingBox())!;
  expect(action.y + action.height).toBeLessThanOrEqual(footer.y);
  expect(footer.y + footer.height).toBeLessThanOrEqual(324);
  const settings = drawer.getByRole("button", {
    name: "Settings",
    exact: true,
  });
  await settings.focus();
  await expect(settings).toBeFocused();
  const box = (await settings.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(324);
  await info.attach("short-drawer-owners.json", {
    body: JSON.stringify({ footer, action, box }),
    contentType: "application/json",
  });
  await cdp.detach();
});

test("UI92.restored-short-history: a truthful restored snapshot leaves useful actual history and reachable warning and resume in the keyboard viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 720 });
  await simulateViewport(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 24, left: 18, right: 18, bottom: 12, bottomMax: 40 },
  });
  const requests = await open(page);
  await page
    .getByRole("link", { name: "Complete listening title 0 音樂", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retained exact recovered source 中文");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.reload();
  const notice = page.locator(".workspace-status");
  await expect(notice).toContainText(
    "Restored snapshot — account and content have not been rechecked.",
  );
  await expect(source).toHaveValue("Retained exact recovered source 中文");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator(".bottom-resume")).toBeVisible();
  expect(
    await notice.evaluate((node) => node.scrollHeight - node.clientHeight),
  ).toBeLessThanOrEqual(1);
  await panViewport(page, 300, 64);
  const reader = page.locator(".reading-pane");
  await reader.evaluate((node) => (node.scrollTop = 700));
  await expect(page.locator(".conversation-heading")).toHaveAttribute(
    "data-compact",
    "true",
  );
  await reader.scrollIntoViewIfNeeded();
  const geometry = await reader.evaluate((node) => {
    const r = node.getBoundingClientRect(),
      outer = node.closest(".conversation-region")!.getBoundingClientRect();
    return {
      reader: r.toJSON(),
      outer: outer.toJSON(),
      visible:
        Math.min(r.bottom, outer.bottom, 324) - Math.max(r.top, outer.top, 88),
    };
  });
  await info.attach("restored-keyboard-history.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  expect(geometry.visible).toBeGreaterThanOrEqual(95);
  await page
    .getByRole("link", { name: "Continue in native forum", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(notice).toBeFocused();
  const focus = await notice.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      visible: node.matches(":focus-visible"),
      width: parseFloat(s.outlineWidth),
      extent: parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset),
    };
  });
  expect(focus.visible).toBe(true);
  expect(focus.width).toBeGreaterThanOrEqual(2);
  expect(focus.extent).toBeLessThanOrEqual(0);
  await notice.press("End");
  const warningGeometry = () =>
    notice.evaluate((node) => {
      const text = node.querySelector("p")!.firstChild!;
      const range = document.createRange();
      range.setStart(text, text.textContent!.length - 1);
      range.setEnd(text, text.textContent!.length);
      return {
        last: range.getBoundingClientRect().toJSON(),
        box: node.getBoundingClientRect().toJSON(),
      };
    });
  await expect
    .poll(async () => {
      const g = await warningGeometry();
      return g.last.bottom - g.box.bottom;
    })
    .toBeLessThanOrEqual(0);
  const warningEnd = await warningGeometry();
  expect(warningEnd.last.top).toBeGreaterThanOrEqual(warningEnd.box.top);
  expect(warningEnd.last.bottom).toBeLessThanOrEqual(warningEnd.box.bottom);
  const resume = page.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  await resume.scrollIntoViewIfNeeded();
  const resumeBox = (await resume.boundingBox())!;
  expect(resumeBox.y).toBeGreaterThanOrEqual(88);
  expect(resumeBox.y + resumeBox.height).toBeLessThanOrEqual(324);
  await info.attach("restored-warning-and-resume.json", {
    body: JSON.stringify({
      geometry,
      warningEnd,
      resumeBox,
      notice: await notice.innerText(),
    }),
    contentType: "application/json",
  });
  await info.attach("restored-warning-and-resume.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await resume.click();
  await expect(source).toHaveValue("Retained exact recovered source 中文");
  await expect(
    page.locator(".source-writing").getByRole("link", {
      name: "Addressed to Composer Nine · Post 100",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=100`,
  );
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
  await cdp.detach();
});

for (const expanded of [false, true])
  test(`UI93.short-review-clip-${expanded}: restored real Review and writing retain at least95px of actually unclipped history after geometry settles`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 420 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 24, left: 0, right: 0, bottom: 34, bottomMax: 34 },
    });
    const requests = await open(page, threadURL);
    await page
      .getByRole("button", { name: "Reply to this post", exact: true })
      .first()
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Exact retained short source 保留內容");
    await page.reload();
    await expect(source).toHaveValue("Exact retained short source 保留內容");
    if (expanded)
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toBeVisible();
    const observations = [];
    for (const state of ["review", "source"] as const) {
      if (state === "source") {
        await review
          .getByRole("button", {
            name: "Cancel review and return to writing",
            exact: true,
          })
          .click();
        await expect(source).toHaveValue(
          "Exact retained short source 保留內容",
        );
        await source.focus();
      }
      for (let n = 0; n < 4; n++) {
        await page.waitForTimeout(100);
        observations.push({
          state,
          ...(await page.locator(".reading-pane").evaluate((reader) => {
            const r = reader.getBoundingClientRect(),
              outer = reader.closest(".conversation-region")!,
              o = outer.getBoundingClientRect();
            const top = Math.max(r.top, o.top, 0),
              bottom = Math.min(r.bottom, o.bottom, innerHeight);
            return {
              reader: r.toJSON(),
              outer: o.toJSON(),
              outerScroll: outer.scrollTop,
              top,
              bottom,
              visible: bottom - top,
            };
          })),
        });
      }
      await info.attach(`settled-${state}-clip.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
    await info.attach("settled-clip.json", {
      body: JSON.stringify(observations),
      contentType: "application/json",
    });
    for (const observation of observations)
      expect(
        observation.visible,
        JSON.stringify(observation),
      ).toBeGreaterThanOrEqual(95);
    expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
    await cdp.detach();
  });
