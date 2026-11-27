import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";
import { selectSourceEditor, revealWritingOptions } from "./editor-controls";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const title =
  "創作筆記：完整而很長的繁體中文討論標題與閱讀心得，不截斷重要的主題內容";
const sourceText =
  "保留 [b]原始文字[/b]\n[url=https://example.invalid/]創作參考[/url] 與原生目的地。";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const row = (id: number, pinned = false) =>
  `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><em>[創作]</em><a class="xst" href="forum.php?mod=viewthread&tid=${id}">${id === 42 ? title : `創作討論 ${id}`}</a></th><td class="by"><cite>Original Author</cite><em>2020-01-01</em></td><td class="num"><a>0</a><em>100</em></td><td class="by"><cite>最新回覆者名字很長的繁體中文創作愛好者</cite><em><a href="forum.php?mod=viewthread&tid=${id}&page=2#pid202">2026-11-18</a></em></td></tr></tbody>`;
function board(url: URL, newThread: boolean) {
  const child = url.searchParams.get("fid") === "7";
  const pageNumber = url.searchParams.get("page") ?? "1";
  const ids =
    pageNumber === "2"
      ? [70, 71]
      : [41, 42, 43, ...Array.from({ length: 17 }, (_, index) => index + 44)];
  return `${account}<div id="ct"><h1><a href="${child ? `${origin}/forum.php?mod=forumdisplay&fid=7` : boardURL}">${child ? "Subordinate destination" : "創作討論"}</a><span class="xs1 xw0 i">今日: <strong class="xi1">0</strong></span></h1></div><div id="subforum_5"><table class="fl_tb"><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=7&page=2">完整的子版塊名稱</a></h2><p class="xg2">保留完整的介紹與原生目的地。</p><span class="xg1">0 threads</span></td></tr></table></div><ul id="thread_types"><li><a href="${boardURL}&filter=typeid&typeid=3">Creative notes</a></li></ul><table id="threadlisttableid">${newThread && pageNumber === "1" ? row(99) : ""}${ids.map((id) => row(id, id === 41)).join("")}</table><div class="pg"><strong>${pageNumber}</strong><a href="${boardURL}&page=${pageNumber === "1" ? 2 : 1}">${pageNumber === "1" ? 2 : 1}</a></div>`;
}
const replyForm = `${account}<div id="pt"><a href="${boardURL}">創作討論</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="replysubmit" value="yes">Reply</button></form>`;
function thread(url: URL) {
  const id = url.searchParams.get("tid") ?? "42";
  const latest = url.searchParams.get("page") === "2";
  const pid = latest ? "202" : "101";
  return `${account}<div id="pt"><a href="${boardURL}">創作討論</a></div><div id="postlist"><h1 id="thread_subject">Reading ${id}</h1><div id="post_${pid}"><div class="authi"><a href="home.php?mod=space&uid=9">Author Nine</a></div><a id="postnum${pid}" href="forum.php?mod=viewthread&tid=${id}&page=${latest ? 2 : 1}#pid${pid}">${latest ? 21 : 1}#</a><div class="pcb"><p>${latest ? "Exact latest reply." : "Complete opening."}</p></div></div></div><div class="pg"><strong>${latest ? 2 : 1}</strong><a href="forum.php?mod=viewthread&tid=${id}&page=${latest ? 1 : 2}">${latest ? 1 : 2}</a></div>`;
}
async function open(page: Page) {
  const requests: { url: string; method: string }[] = [];
  let newThread = false;
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/__d-journey.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__d-journey.js"></script></body></html>`,
      });
    requests.push({ url: url.href, method: request.method() });
    const document =
      url.searchParams.get("mod") === "forumdisplay"
        ? board(url, newThread)
        : url.searchParams.get("mod") === "post"
          ? replyForm
          : thread(url);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document }),
    });
  });
  await page.goto(boardURL);
  await expect(page.locator('[data-thread-id="42"]')).toBeVisible();
  return {
    requests,
    revealArrival: () => {
      newThread = true;
    },
  };
}
async function geometry(trigger: Locator) {
  return trigger.evaluate((node) => {
    const b = node.getBoundingClientRect();
    const row =
      node.closest(".thread-row, .board-about") ?? node.parentElement!;
    const parent = row.getBoundingClientRect();
    return {
      x: b.x - parent.x,
      y: b.y - parent.y,
      width: b.width,
      height: b.height,
    };
  });
}
async function draft(page: Page) {
  await page.locator('[data-thread-id="42"] .subject').click();
  await expect(page.locator("#pid101")).toBeVisible();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill(sourceText);
  await revealWritingOptions(page);
  await page
    .getByRole("checkbox", { name: "Signature", exact: true })
    .uncheck();
  await page.keyboard.press("Escape");
  return {
    source,
    destination: await page.locator(".writing-destination").textContent(),
  };
}
test("D7.combined-journey: context controls exact destinations and return retain one local reply", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixture = await open(page);
  const observations: unknown[] = [];
  try {
    const { source, destination } = await draft(page);
    const originalEditor = await source.elementHandle();
    const pane = page.locator("#thread-list-pane");
    const about = pane.locator(".board-about-trigger");
    const details = pane.locator(
      '[data-thread-id="42"] .thread-details-trigger',
    );
    const requestCount = fixture.requests.length;
    for (const trigger of [about, details]) {
      await trigger.scrollIntoViewIfNeeded();
      const closed = await geometry(trigger);
      for (const action of ["pointer", "Enter", "Space"]) {
        if (action === "pointer") await trigger.click();
        else await trigger.press(action);
        await expect(trigger).toBeFocused();
        expect(await geometry(trigger)).toEqual(closed);
      }
      observations.push({
        closed,
        expanded: await trigger.getAttribute("aria-expanded"),
      });
    }
    await pane
      .getByRole("button", { name: "Pinned threads · 1", exact: true })
      .click();
    await expect(pane.locator('[data-thread-id="41"]')).toBeVisible();
    expect(fixture.requests).toHaveLength(requestCount);
    expect(
      await source.evaluate(
        (node, original) => node === original,
        originalEditor,
      ),
    ).toBe(true);
    await expect(source).toHaveValue(sourceText);
    await expect(pane.locator('[data-thread-id="42"] dl')).toContainText(
      "Original Author",
    );
    await info.attach("combined-context.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await pane
      .locator(".board-about-content")
      .getByRole("link", { name: "完整的子版塊名稱", exact: true })
      .click();
    await expect(
      pane.getByRole("heading", {
        name: "Subordinate destination",
        exact: true,
      }),
    ).toBeVisible();
    expect(fixture.requests.at(-1)!.url).toBe(
      `${origin}/forum.php?mod=forumdisplay&fid=7&page=2&tsdmapp=json`,
    );
    await expect(source).toHaveValue(sourceText);
    await page.goBack();
    await expect(
      pane.getByRole("heading", { name: "創作討論", exact: true }),
    ).toBeVisible();
    await pane.getByRole("button", { name: /^Board filters ·/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await dialog
      .getByRole("button", { name: "Creative notes", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(pane.locator(".board-active-criteria")).toContainText(
      "Creative notes",
    );
    expect(fixture.requests.at(-1)!.url).toBe(
      `${boardURL}&filter=typeid&typeid=3&tsdmapp=json`,
    );
    await pane
      .locator(".board-active-criteria")
      .getByRole("link", { name: "Clear", exact: true })
      .click();
    await expect(pane.locator(".board-active-criteria")).toHaveCount(0);
    await pane.getByRole("link", { name: "2", exact: true }).click();
    await expect(
      pane.getByRole("img", { name: "Page 2", exact: true }),
    ).toBeVisible();
    await expect(pane.locator('[data-thread-id="70"]')).toBeVisible();
    await pane.getByRole("link", { name: "1", exact: true }).click();
    await expect(pane.locator('[data-thread-id="42"]')).toBeVisible();
    await expect(source).toHaveValue(sourceText);
    expect(await page.locator(".writing-destination").textContent()).toBe(
      destination,
    );

    fixture.revealArrival();
    await pane
      .getByRole("button", { name: "Check for new threads", exact: true })
      .click();
    await expect(
      pane.getByRole("button", { name: "Show 1 new thread", exact: true }),
    ).toBeVisible();
    await expect(pane.locator('[data-thread-id="99"]')).toHaveCount(0);
    await pane
      .getByRole("button", { name: "Show 1 new thread", exact: true })
      .click();
    await expect(pane.locator('[data-thread-id="99"]')).toBeVisible();
    await pane.locator('[data-thread-id="42"] .subject').click();
    await expect(page.locator("#pid101")).toBeVisible();
    const titleURL = page.url();
    await pane.locator('[data-thread-id="42"] .latest-reply').click();
    await expect(page.locator("#pid202")).toBeVisible();
    await expect(page.locator("#pid202")).toBeFocused();
    await expect(
      page.getByRole("link", { name: "Continue in native forum", exact: true }),
    ).toHaveAttribute(
      "href",
      `${origin}/forum.php?mod=viewthread&tid=42&page=2&tsdm-native=1#pid202`,
    );
    expect(fixture.requests.at(-1)!.url).toBe(
      `${origin}/forum.php?mod=viewthread&tid=42&page=2&tsdmapp=json`,
    );
    expect(page.url()).not.toBe(titleURL);
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(source).toHaveValue(sourceText);
    await pane.locator('[data-thread-id="43"] .subject').click();
    await expect(
      page.getByRole("heading", { name: "Reading 43", exact: true }),
    ).toBeVisible();
    await expect(
      pane.locator('[data-thread-id="42"] .local-reply-indicator'),
    ).toBeVisible();
    await page.goBack();
    await expect(page.locator("#pid202")).toBeVisible();
    if (
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
    await selectSourceEditor(page);
    await expect(source).toHaveValue(sourceText);
    expect(await page.locator(".writing-destination").textContent()).toBe(
      destination,
    );
    await expect(
      pane.locator('[data-thread-id="42"] .subject'),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      pane.locator('[data-thread-id="43"] .subject'),
    ).not.toHaveAttribute("aria-current", "true");
    await revealWritingOptions(page);
    await expect(
      page.getByRole("checkbox", { name: "Signature", exact: true }),
    ).not.toBeChecked();
    await page.keyboard.press("Escape");
    expect(fixture.requests.every((request) => request.method === "GET")).toBe(
      true,
    );
    observations.push({
      source: await source.inputValue(),
      destination,
      url: page.url(),
      titleURL,
    });
  } finally {
    await info.attach("combined-final.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("combined-observations.json", {
      body: JSON.stringify({
        runtime: page.context().browser()!.version(),
        observations,
        requests: fixture.requests,
      }),
      contentType: "application/json",
    });
  }
});

test("D8-D9.combined-geometry: expanded context pins details and arrivals retain anchors through localized reflow", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixture = await open(page);
  const pane = page.locator("#thread-list-pane");
  const observations: unknown[] = [];
  try {
    const density = await pane.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        completeRows: [...node.querySelectorAll(".thread-row")].filter(
          (row) => {
            const b = row.getBoundingClientRect();
            return (
              b.height > 0 && b.top >= bounds.top && b.bottom <= bounds.bottom
            );
          },
        ).length,
      };
    });
    observations.push({ desktopDensity: density });
    expect(density.completeRows).toBeGreaterThan(0);
    await info.attach("desktop-density.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const { source, destination } = await draft(page);
    await pane.locator(".board-about-trigger").click();
    await pane
      .getByRole("button", { name: "Pinned threads · 1", exact: true })
      .click();
    await pane.locator('[data-thread-id="42"] .thread-details-trigger').click();
    const anchor = () =>
      pane.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const row = [...node.querySelectorAll<HTMLElement>(".thread-row")].find(
          (row) => {
            const b = row.getBoundingClientRect();
            return b.height > 0 && b.bottom > bounds.top + 1;
          },
        )!;
        return {
          id: row.dataset.threadId,
          offset: row.getBoundingClientRect().top - bounds.top,
          width: bounds.width,
        };
      });
    await pane.evaluate((node) => {
      node.scrollTop = 1200;
    });
    const beforeCheck = await anchor();
    fixture.revealArrival();
    // Keyboard focus with preventScroll keeps the deliberate mid-list position.
    await pane
      .getByRole("button", { name: "Check for new threads", exact: true })
      .evaluate((node) => (node as HTMLElement).focus({ preventScroll: true }));
    await page.keyboard.press("Enter");
    await expect(
      pane.getByRole("button", { name: "Show 1 new thread", exact: true }),
    ).toBeVisible();
    await expect.poll(async () => (await anchor()).id).toBe(beforeCheck.id);
    await expect
      .poll(async () => Math.abs((await anchor()).offset - beforeCheck.offset))
      .toBeLessThanOrEqual(1);
    expect((await anchor()).width).toBe(beforeCheck.width);
    await expect(source).toHaveValue(sourceText);
    observations.push({ beforeCheck, afterCheck: await anchor() });

    for (const theme of ["light", "dark"]) {
      for (const language of ["en", "zh-CN", "zh-TW"]) {
        await openSettings(page);
        await page.locator(`input[name="theme"][value="${theme}"]`).check();
        await page.locator("#interface-language").selectOption(language);
        await page.locator("#text-size").fill("150");
        await closeSettingsToWorkspace(page);
        for (const width of [390, 320]) {
          await page.setViewportSize({
            width,
            height: width === 320 ? 640 : 844,
          });
          // The browser resize event precedes Vue's responsive docking render.
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              ),
          );
          if (!(await pane.isVisible()))
            await page
              .getByRole("button", {
                name: /^(Threads pane|主题面板|主題面板)$/,
              })
              .click();
          await expect(pane.locator(".board-about-trigger")).toHaveAttribute(
            "aria-expanded",
            "true",
          );
          await expect(pane.locator('[data-thread-id="41"]')).toBeVisible();
          await expect(pane.locator(".board-check-status")).toBeVisible();
          const row = pane.locator('[data-thread-id="42"]');
          const details = row.locator(".thread-details-trigger");
          await details.scrollIntoViewIfNeeded();
          await details.focus();
          const expanded = await geometry(details);
          await details.press("Enter");
          await expect(details).toBeFocused();
          expect(await geometry(details)).toEqual(expanded);
          await details.press("Space");
          await expect(details).toHaveAttribute("aria-expanded", "true");
          expect(await geometry(details)).toEqual(expanded);
          await expect(row.locator("dl")).toContainText("Original Author");
          await expect(row.locator(".subject")).toHaveText(title);
          const layout = await pane.evaluate((node) => ({
            width: node.clientWidth,
            scrollWidth: node.scrollWidth,
            overflowingRows: [
              ...node.querySelectorAll<HTMLElement>(".thread-row"),
            ]
              .filter((row) => row.scrollWidth > row.clientWidth + 1)
              .map((row) => row.dataset.threadId),
          }));
          expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
          expect(layout.overflowingRows).toEqual([]);
          expect(expanded.height).toBeGreaterThanOrEqual(44);
          expect(
            await details.evaluate(
              (node) => getComputedStyle(node).outlineStyle,
            ),
          ).not.toBe("none");
          observations.push({
            theme,
            language,
            width,
            layout,
            expanded,
            focus: await details.getAttribute("aria-label"),
          });
          await info.attach(`${theme}-${language}-${width}.png`, {
            body: await page.screenshot(),
            contentType: "image/png",
          });
        }
      }
    }
    await page.emulateMedia({ forcedColors: "active" });
    const details = pane.locator(
      '[data-thread-id="42"] .thread-details-trigger',
    );
    await details.focus();
    await expect(details).toBeFocused();
    expect(
      await details.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    await info.attach("combined-forced-colors.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(source).toHaveValue(sourceText);
    expect(await page.locator(".writing-destination").textContent()).toContain(
      "42",
    );
    observations.push({
      source: await source.inputValue(),
      originalDestination: destination,
    });
    expect(fixture.requests.every((request) => request.method === "GET")).toBe(
      true,
    );
  } finally {
    await info.attach("combined-geometry.json", {
      body: JSON.stringify({
        runtime: page.context().browser()!.version(),
        observations,
        requests: fixture.requests,
      }),
      contentType: "application/json",
    });
    await info.attach("combined-state.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});
