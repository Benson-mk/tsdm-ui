import { test, expect, chromium, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const target = `${origin}/forum.php?mod=viewthread&tid=42`;
const preferencesKey = "tsdm.workspace.preferences";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const searchForm = `${account}<form method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="private-token"><input type="hidden" name="searchsubmit" value="yes"><label for="keywords">Keywords</label><input id="keywords" name="srchtxt" type="text"><label for="author">Author</label><input id="author" name="srchuname" type="text"></form>`;
const thread = `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Long Latin listening notes 與繁體中文閱讀記錄</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${101 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${101 + i}">${i + 1}</a><div class="pcb">${Array.from({ length: 4 }, (_, p) => `<p>Reading block ${i + 1}.${p + 1}: ${"Complete Latin and 中文內容，保留討論的意思。 ".repeat(12)}</p>`).join("")}<blockquote><p>Nested quotation preserves its type role.</p></blockquote><pre><code>const listening = "音樂";</code></pre><details><summary>Listening details</summary><p>Expanded content stays open.</p></details></div></div>`).join("")}</div>`;

const boardTarget = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const boardFixture = `${account}<div id="ct"><h1><a href="${boardTarget}">Long board 標題與 Latin discussion</a></h1></div><table id="threadlisttableid">${Array.from({ length: 20 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">${i === 0 ? "Long Latin listening notes 與繁體中文閱讀記錄" : `LongResult${i}WithoutSpaces測試完整標題`.repeat(3)}</a></th><td class="by"><cite>Composer Nine</cite><em>2026-10-19</em></td><td class="num"><a>28</a><em>100</em></td><td class="by"><cite>Listener Ten</cite></td></tr></tbody>`).join("")}</table>`;
async function open(page: Page, nativeScript = "", destination = target) {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__appearance.js`) {
      await route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    } else if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native forum<script>${nativeScript}</script><script src="${origin}/__appearance.js"></script></body></html>`,
      });
    } else {
      requests.push(request.url());
      await route.fulfill({
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          document:
            new URL(request.url()).pathname === "/search.php"
              ? searchForm
              : new URL(request.url()).searchParams.get("mod") ===
                  "forumdisplay"
                ? boardFixture
                : thread,
        }),
      });
    }
  });
  await page.goto(destination);
  if (destination === target)
    await expect(page.getByRole("article")).toHaveCount(12);
  else await expect(page.locator(".thread-row")).toHaveCount(20);
  return requests;
}
async function saved(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null") as unknown,
    preferencesKey,
  );
}

test("J5.appearance-rail-labels: enlarged destination words remain complete without changing pane tracks", async ({
  page,
}, info) => {
  const requests = await open(page);
  let columns: string | undefined;
  for (const size of [100, 150]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#text-size").fill(String(size));
    await page.keyboard.press("Escape");
    const geometry = await page
      .locator(".main-destinations")
      .evaluate((rail) => {
        const words = Array.from(rail.querySelectorAll("button"), (button) => {
          const range = document.createRange();
          range.selectNodeContents(button);
          const text = range.getBoundingClientRect();
          const target = button.getBoundingClientRect();
          return {
            label: button.textContent?.trim(),
            lines: range.getClientRects().length,
            contained: text.left >= target.left && text.right <= target.right,
          };
        });
        return {
          words,
          columns: getComputedStyle(rail.parentElement!).gridTemplateColumns,
          overflow: rail.scrollWidth > rail.clientWidth,
        };
      });
    for (const word of geometry.words) {
      expect(word.lines, `${size}% ${word.label}`).toBe(1);
      expect(word.contained, `${size}% ${word.label}`).toBe(true);
    }
    expect(geometry.overflow).toBe(false);
    columns ??= geometry.columns;
    expect(geometry.columns).toBe(columns);
  }
  expect(requests).toHaveLength(1);
  await info.attach("complete-enlarged-rail.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J2.section-overviews: each destination replaces the reader, supports medium/narrow navigation and restores passively", async ({
  page,
}, info) => {
  const requests = await open(page);
  for (const [label, description] of [
    ["Search", "Search threads or authors"],
    ["Saved", "Saved boards and threads"],
    ["Notices", "Load notices deliberately"],
    ["Drafts", "Forum drafts"],
  ] as const) {
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: label, exact: true, level: 1 }),
    ).toBeVisible();
    if (label === "Search")
      await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
    else
      await expect(
        page.getByRole("heading", { name: description, exact: true }),
      ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    expect(requests).toHaveLength(2);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Drafts", exact: true, level: 1 }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Notices", exact: true, level: 1 }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 850 });
  await expect(
    page.getByRole("combobox", { name: "Section navigation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Section navigation", exact: true })
    .selectOption("saved");
  await expect(
    page.getByRole("heading", { name: "Saved", exact: true, level: 1 }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("combobox", { name: "Main destinations", exact: true })
    .selectOption("search");
  await expect(
    page.getByRole("heading", { name: "Search", exact: true, level: 1 }),
  ).toBeVisible();
  expect(requests).toHaveLength(3);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const geometry = await page.locator("#tsdm-workspace").evaluate((host) => {
    const root = host.shadowRoot!;
    const workspace = root.querySelector<HTMLElement>(".workspace")!;
    return {
      roots: document.querySelectorAll("#tsdm-workspace").length,
      headers: root.querySelectorAll(".workspace > header").length,
      height: workspace.getBoundingClientRect().height,
      viewport: innerHeight,
      pageOverflow: document.documentElement.scrollHeight > innerHeight,
    };
  });
  expect(geometry.roots).toBe(1);
  expect(geometry.headers).toBe(1);
  expect(geometry.height).toBe(geometry.viewport);
  expect(geometry.pageOverflow).toBe(false);
  info.annotations.push({
    type: "settled-geometry",
    description: JSON.stringify(geometry),
  });
  await info.attach("narrow-search-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const theme of ["light", "alias", "mono", "dark"] as const) {
  test(`J5.appearance-covering-${theme}: production width transitions, all locales, endpoints, spacing, contrast and reduced motion`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const requests = await open(page, "", boardTarget);
    await page
      .getByRole("link", {
        name: "Long Latin listening notes 與繁體中文閱讀記錄",
        exact: true,
      })
      .click();
    await expect(page.getByRole("article")).toHaveCount(12);
    const metrics: unknown[] = [];
    const widths = [
      375, 559, 560, 767, 768, 959, 960, 1279, 1280, 1400, 1440, 1920,
    ];
    let index = 0;
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      let paneWidths: number[] | null = null;
      for (const size of [100, 90, 70, 150]) {
        const locale = ["en", "zh-CN", "zh-TW"][index++ % 3]!;
        await page.locator(".workspace > header button").first().click();
        await page.locator(`input[name="theme"][value="${theme}"]`).check();
        await page.locator("#text-size").fill(String(size));
        await page.locator("#interface-language").selectOption(locale);
        const dialogMetrics = await page
          .locator(".settings-dialog")
          .evaluate((node) => ({
            width: node.clientWidth,
            scrollWidth: node.scrollWidth,
            height: node.clientHeight,
            scrollHeight: node.scrollHeight,
            padding: getComputedStyle(node).padding,
          }));
        expect
          .soft(dialogMetrics.scrollWidth, `${width}/${size}/${locale} dialog`)
          .toBeLessThanOrEqual(dialogMetrics.width + 1);
        expect.soft(dialogMetrics.padding).toBe("32px");
        await page.keyboard.press("Escape");
        const sample = await page
          .locator("#tsdm-workspace")
          .evaluate((host) => {
            const root = host.shadowRoot!;
            const reading = root.querySelector<HTMLElement>(".reading-pane")!;
            const results = root.querySelector<HTMLElement>(".results-pane")!;
            const row = root.querySelector<HTMLElement>(".thread-row")!;
            const visible = (node: Element) => !!node.getClientRects().length;
            const palette = [
              ".workspace",
              ".thread-heading",
              ".post-content pre",
              ".post-content blockquote",
            ].map((selector) => {
              const style = getComputedStyle(root.querySelector(selector)!);
              return {
                selector,
                color: style.color,
                background: style.backgroundColor,
              };
            });
            return {
              hostWidth: host.clientWidth,
              hostScroll: host.scrollWidth,
              readingWidth: reading.clientWidth,
              readingHeight: reading.clientHeight,
              rowPadding: getComputedStyle(row).padding,
              columns: getComputedStyle(root.querySelector(".workspace-body")!)
                .gridTemplateColumns.split(" ")
                .map(Number.parseFloat),
              secondary: visible(root.querySelector(".boards-navigation")!),
              picker: visible(root.querySelector(".board-picker")!),
              results: visible(results),
              rangeSpacing: (host as HTMLElement).dataset.spacing,
              motion: getComputedStyle(reading).scrollBehavior,
              palette,
            };
          });
        metrics.push({ width, size, locale, ...sample });
        expect
          .soft(sample.hostScroll, `${width}/${size}/${locale} host`)
          .toBeLessThanOrEqual(sample.hostWidth + 1);
        expect
          .soft(sample.readingWidth)
          .toBeGreaterThanOrEqual(Math.min(width, 320));
        expect.soft(sample.readingHeight).toBeGreaterThan(160);
        expect.soft(sample.secondary).toBe(width >= 1280);
        expect.soft(sample.picker).toBe(width >= 960 && width < 1280);
        expect.soft(sample.results).toBe(width >= 960);
        expect
          .soft(sample.rowPadding)
          .toBe(
            size < 100
              ? width < 960
                ? "12px"
                : "12px 16px"
              : width < 960
                ? "16px"
                : "16px 24px",
          );
        expect
          .soft(sample.rangeSpacing)
          .toBe(size < 100 ? "compact" : "default");
        expect.soft(sample.motion).toBe("auto");
        if (!paneWidths) paneWidths = sample.columns;
        expect.soft(sample.columns).toEqual(paneWidths);
        for (const pair of sample.palette) {
          const luminance = (value: string) => {
            const rgb = value
              .match(/\d+/g)!
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                const n = v / 255;
                return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
              });
            return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
          };
          const a = luminance(pair.color),
            b = luminance(pair.background);
          expect
            .soft(
              (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              `${theme} ${pair.selector}`,
            )
            .toBeGreaterThanOrEqual(4.5);
        }
        if ([375, 960, 1280].includes(width) && [70, 150].includes(size))
          await info.attach(`${theme}-${width}-${size}-${locale}.png`, {
            body: await page.screenshot(),
            contentType: "image/png",
          });
      }
    }
    info.annotations.push({
      type: "appearance-covering-measurements",
      description: JSON.stringify(metrics),
    });
    expect(requests).toHaveLength(2);
  });
}

test("J5.appearance-locales: translated controls retain forum text, content identity and persisted choices", async ({
  page,
}) => {
  const requests = await open(page);
  const article = await page.locator("#pid101").elementHandle();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const [locale, settings, language, textSize, close] of [
    ["zh-CN", "设置", "界面语言", "文字大小", "关闭"],
    ["zh-TW", "設定", "介面語言", "文字大小", "關閉"],
    ["en", "Settings", "Interface language", "Text size", "Close"],
  ]) {
    await page.locator("#interface-language").selectOption(locale!);
    const dialog = page.getByRole("dialog", { name: settings!, exact: true });
    await expect(
      dialog.getByRole("combobox", { name: language!, exact: true }),
    ).toHaveValue(locale!);
    await expect(
      dialog.getByRole("slider", { name: textSize!, exact: true }),
    ).toHaveValue("100");
    await expect(
      dialog.getByRole("button", { name: close!, exact: true }),
    ).toBeVisible();
    await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
      "lang",
      locale!,
    );
    await expect.poll(() => saved(page)).toMatchObject({ language: locale });
    expect(await article?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(page.locator(".post-content").first()).toContainText(
      "Complete Latin and 中文內容，保留討論的意思。",
    );
  }
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "关于此工作区", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "刷新主题", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
});

test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
});

test("J5.appearance-blocked-storage: browser-disabled local storage retains live controls with an honest explanation", async ({
  browserName,
}, info) => {
  expect(browserName).toBe("chromium");
  const browser = await chromium.launch({
    channel: "msedge",
    args: ["--disable-local-storage"],
  });
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  try {
    const requests = await open(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("slider", { name: "Text size", exact: true })
      .fill("150");
    await expect(
      page.getByText(
        "Preferences are available for this page only. Storage is unavailable; changes may not survive reload.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Text size", exact: true }),
    ).toHaveValue("150");
    expect(
      await page
        .locator(".post-content > p")
        .first()
        .evaluate((node) => getComputedStyle(node).fontSize),
    ).toBe("27px");
    expect(requests).toHaveLength(1);
    await info.attach("browser-storage-disabled.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  } finally {
    await browser.close();
  }
});

test("J5.appearance-modal-cycle: Tab and Shift-Tab remain contained through complete focus cycles", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "Settings", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  for (const key of ["Tab", "Shift+Tab"])
    for (let n = 0; n < 20; n++) {
      await page.keyboard.press(key);
      expect(
        await dialog.evaluate((node) =>
          node.contains((node.getRootNode() as ShadowRoot).activeElement),
        ),
      ).toBe(true);
    }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("J5.appearance-reading-measure: Compact retains the 48em content bound inside stable panes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2560, height: 1100 });
  const requests = await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const size of [70, 90, 100, 150]) {
    await page.locator("#text-size").fill(String(size));
    const measure = await page
      .locator(".post-content")
      .first()
      .evaluate((node) => ({
        width: node.getBoundingClientRect().width,
        font: Number.parseFloat(getComputedStyle(node).fontSize),
      }));
    expect(measure.width).toBeLessThanOrEqual(measure.font * 48 + 1);
  }
  expect(requests).toHaveLength(1);
});

test("J5.appearance-quote-surface: quote panels use the accepted neutral or pastel surface with appropriate text", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const theme of ["Light", "Alias", "Mono", "Dark"]) {
    await page.getByRole("radio", { name: theme, exact: true }).check();
    const style = await page
      .locator(".post-content blockquote")
      .first()
      .evaluate((node) => ({
        background: getComputedStyle(node).backgroundColor,
        color: getComputedStyle(node).color,
        border: getComputedStyle(node).borderLeftColor,
      }));
    expect(style.background).toBe(
      theme === "Mono" ? "rgb(233, 233, 233)" : "rgb(235, 245, 232)",
    );
    expect(style.color).toBe("rgb(0, 0, 0)");
    expect(style.border).toBe("rgb(0, 0, 0)");
  }
});

test("J5.appearance-browser-font: a real larger Chromium default composes with the application endpoint", async ({
  browserName,
}, info) => {
  expect(browserName).toBe("chromium");
  const browser = await chromium.launch({
    channel: "msedge",
    args: ["--blink-settings=defaultFontSize=20"],
  });
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  try {
    await open(page);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).fontSize,
      ),
    ).toBe("20px");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#text-size").fill("150");
    expect(
      await page
        .locator(".post-content > p")
        .first()
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    ).toBeCloseTo(33.75, 2);
    await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
      "data-spacing",
      "default",
    );
    await info.attach("actual-browser-font20.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  } finally {
    await browser.close();
  }
});

test("J5.appearance-localized-reader-and-failure: application descriptions translate while forum content remains original", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-TW");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "可捲動的程式碼", exact: true }).first(),
  ).toBeVisible();
  await page.route("**/*tsdmapp=json*", (route) =>
    route.fulfill({
      status: 403,
      contentType: "text/html; charset=utf-8",
      body: `${account}<div id="messagetext">阅读权限不足</div>`,
    }),
  );
  await page.getByRole("button", { name: "重新整理主題", exact: true }).click();
  await expect(
    page.getByText("目前帳號沒有閱讀此主題的權限。", { exact: true }),
  ).toBeVisible();
});

test("J5.appearance-keyboard: all nine steps preview/save immediately, reset and keep modal range focus", async ({
  page,
}, info) => {
  const requests = await open(page);
  const trigger = page.getByRole("button", { name: "Settings", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  const slider = dialog.getByRole("slider", { name: "Text size", exact: true });
  await expect(dialog).toHaveAttribute("aria-describedby", /.+/);
  expect(
    await dialog.evaluate((node) => node.getRootNode() instanceof ShadowRoot),
  ).toBe(true);
  await expect(slider).toHaveAttribute("min", "70");
  await expect(slider).toHaveAttribute("max", "150");
  await expect(slider).toHaveAttribute("step", "10");
  await expect(slider).toHaveValue("100");
  await slider.focus();
  await page.keyboard.press("Home");
  for (const size of [70, 80, 90, 100, 110, 120, 130, 140, 150]) {
    await expect(slider).toHaveValue(String(size));
    await expect(slider).toBeFocused();
    await expect(dialog.getByRole("status")).toContainText(`${size}%`);
    await expect(dialog.getByRole("status")).toContainText(
      size < 100 ? "Compact" : "Default",
    );
    await expect
      .poll(() => saved(page))
      .toEqual({ schema: 1, theme: "light", textSize: size, language: "en" });
    const font = await page
      .locator(".post-content > p")
      .first()
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(font).toBeCloseTo((18 * size) / 100, 2);
    if (size !== 150) await page.keyboard.press("ArrowRight");
  }
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("70");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("150");
  await dialog
    .getByRole("button", { name: "Reset to 100%", exact: true })
    .click();
  await expect(slider).toHaveValue("100");
  await expect
    .poll(() => saved(page))
    .toEqual({ schema: 1, theme: "light", textSize: 100, language: "en" });
  await slider.focus();
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((node) =>
      node.contains((node.getRootNode() as ShadowRoot).activeElement),
    ),
  ).toBe(true);
  await info.attach("appearance-keyboard.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(requests).toHaveLength(1);
});

test("J5.appearance-persistence-valid: saved theme/language/step restore before content and reset survives reload", async ({
  page,
}, info) => {
  const requests = await open(
    page,
    `if(!localStorage.getItem(${JSON.stringify(preferencesKey)})) localStorage.setItem(${JSON.stringify(preferencesKey)}, JSON.stringify({schema:1,theme:'dark',textSize:90,language:'zh-TW'}));`,
  );
  const host = page.locator("#tsdm-workspace");
  await expect(host).toHaveAttribute("data-theme", "dark");
  await expect(host).toHaveAttribute("lang", "zh-TW");
  const trigger = page.getByRole("button", { name: "設定", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "設定", exact: true });
  await expect(
    dialog.getByRole("slider", { name: "文字大小", exact: true }),
  ).toHaveValue("90");
  await expect(dialog.getByRole("status")).toContainText("緊湊");
  await dialog
    .getByRole("button", { name: "重設為 100%", exact: true })
    .click();
  await page.reload();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(
    page.getByRole("slider", { name: "文字大小", exact: true }),
  ).toHaveValue("100");
  await expect
    .poll(() => saved(page))
    .toEqual({ schema: 1, theme: "dark", textSize: 100, language: "zh-TW" });
  expect(requests).toHaveLength(1);
  await info.attach("saved-dark-traditional.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const raw of [
  "{",
  "null",
  "[]",
  '{"schema":2,"theme":"dark","textSize":90}',
  ...["90", 60, 160, 95, null].map((textSize) =>
    JSON.stringify({ schema: 1, theme: "light", language: "en", textSize }),
  ),
]) {
  test(`J5.appearance-persistence-invalid ${raw}: malformed or invalid step falls back to 100%`, async ({
    page,
  }) => {
    await open(
      page,
      `localStorage.setItem(${JSON.stringify(preferencesKey)}, ${JSON.stringify(raw)});`,
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "Text size", exact: true }),
    ).toHaveValue("100");
    await expect(
      page
        .getByRole("dialog", { name: "Settings", exact: true })
        .getByRole("status"),
    ).toContainText("Default");
  });
}

test("J5.appearance-persistence-quota: real storage refusal retains session preference and explains reload limits", async ({
  page,
}) => {
  const requests = await open(
    page,
    `let n=0; for (const size of [1048576,1024,1]) { try { while(n<20000) localStorage.setItem('quota-'+n++,'x'.repeat(size)); } catch {} }`,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("70");
  await expect(
    page.getByText(
      "Preferences are available for this page only. Storage is unavailable; changes may not survive reload.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(await saved(page)).toBeNull();
  expect(
    await page
      .locator(".post-content > p")
      .first()
      .evaluate((node) => getComputedStyle(node).fontSize),
  ).toBe("12.6px");
  expect(requests).toHaveLength(1);
});

test("J5.appearance-pointer: held pointer previews and persists across 90/100 without moving the track", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Native range has no bounds");
  await page.mouse.move(box.x + box.width * 0.26, box.y + box.height / 2);
  await page.mouse.down();
  await expect(slider).toHaveValue("90");
  await expect.poll(() => saved(page)).toMatchObject({ textSize: 90 });
  const compact = await slider.boundingBox();
  await page.mouse.move(box.x + box.width * 0.38, box.y + box.height / 2);
  await expect(slider).toHaveValue("100");
  await expect.poll(() => saved(page)).toMatchObject({ textSize: 100 });
  const normal = await slider.boundingBox();
  expect(compact?.x).toBeCloseTo(box.x, 1);
  expect(compact?.width).toBeCloseTo(box.width, 1);
  expect(normal?.x).toBeCloseTo(box.x, 1);
  expect(normal?.width).toBeCloseTo(box.width, 1);
  await info.attach("held-pointer.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.mouse.up();
  expect(requests).toHaveLength(1);
});

test("J5.appearance-roles: nested roles scale exactly once and compose with a larger browser baseline", async ({
  page,
}, info) => {
  await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  const roles: [string, number][] = [
    [".brand", 32],
    [".post-content > p", 18],
    [".post-content blockquote p", 18],
    [".post-content pre code", 16],
    ["article header", 14],
    [".thread-heading h1", 32],
    [".dialog-content p", 18],
    [".dialog-content h2", 24],
    [".boards-navigation a", 16],
  ];
  for (const size of [70, 90, 100, 150]) {
    await slider.fill(String(size));
    for (const [selector, baseline] of roles) {
      const metrics = await page
        .locator(selector)
        .first()
        .evaluate((node) => ({
          size: Number.parseFloat(getComputedStyle(node).fontSize),
          weight: getComputedStyle(node).fontWeight,
        }));
      expect
        .soft(metrics.size, `${selector} at ${size}%`)
        .toBeCloseTo((baseline * size) / 100, 2);
    }
  }
  // A native document/user stylesheet establishes the larger relative baseline;
  // this models font composition, independently of the application preference.
  await page.addStyleTag({ content: "html { font-size:20px !important }" });
  expect(
    await page
      .locator(".post-content > p")
      .first()
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
  ).toBeCloseTo(33.75, 2);
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "data-spacing",
    "default",
  );
  await info.attach("roles-large-baseline.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.appearance-resize-context: viewport transitions preserve the visible paragraph without navigation or reads", async ({
  page,
}, info) => {
  const requests = await open(page, "", boardTarget);
  await page
    .getByRole("link", {
      name: "Long Latin listening notes 與繁體中文閱讀記錄",
      exact: true,
    })
    .click();
  await expect(page.getByRole("article")).toHaveCount(12);
  const row = page.locator(".thread-row").nth(10);
  await row.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const article = page.locator("#pid106");
  const anchor = article.locator(".post-content > p").nth(2);
  const identity = await article.elementHandle();
  await anchor.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const before = await page.evaluate(() => ({
    length: history.length,
    url: location.href,
  }));
  await info.attach("paragraph-before-viewport-reflow.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  for (const width of [375, 960, 1280, 1920, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        anchor.evaluate((node) => {
          const pane = node.closest(".reading-pane")!;
          return Math.abs(
            node.getBoundingClientRect().top - pane.getBoundingClientRect().top,
          );
        }),
      )
      .toBeLessThanOrEqual(1);
    expect(await identity?.evaluate((node) => node.isConnected)).toBe(true);
    if (width >= 960)
      await expect
        .poll(() =>
          row.evaluate((node) =>
            Math.abs(
              node.getBoundingClientRect().top -
                node.closest(".results-pane")!.getBoundingClientRect().top,
            ),
          ),
        )
        .toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => ({
        length: history.length,
        url: location.href,
      })),
    ).toEqual(before);
    expect(requests).toHaveLength(2);
  }
  await info.attach("viewport-retains-paragraph.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.appearance-context: reflow retains mounted content, disclosures, visible blocks and history without a forum read", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.locator("article").first().locator("summary").click();
  const article = page.locator("#pid106");
  const anchor = article.locator(".post-content > p").nth(2);
  const identity = await article.elementHandle();
  await anchor.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const offset = await anchor.evaluate(
    (node) => node.getBoundingClientRect().top,
  );
  const before = await page.evaluate(() => ({
    length: history.length,
    state: history.state as unknown,
    url: location.href,
  }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  for (const size of [70, 90, 100, 150]) {
    await slider.fill(String(size));
    await expect(slider).toBeFocused();
    await expect
      .poll(async () =>
        Math.abs(
          (await anchor.evaluate((node) => node.getBoundingClientRect().top)) -
            offset,
        ),
      )
      .toBeLessThanOrEqual(1);
    expect(await identity?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(
      page.locator("article").first().locator("details"),
    ).toHaveAttribute("open", "");
    expect(
      await page.evaluate(() => ({
        length: history.length,
        state: history.state as unknown,
        url: location.href,
      })),
    ).toEqual(before);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeFocused();
  expect(requests).toHaveLength(1);
  await info.attach("preserved-reading-block.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.appearance-new-anchor: scrolling after an appearance change establishes a new reading block", async ({
  page,
}, info) => {
  const requests = await open(page);
  const first = page.locator("#pid106 .post-content > p").nth(2);
  await first.evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("slider", { name: "Text size", exact: true }).fill("70");
  await page.keyboard.press("Escape");
  const next = page.locator("#pid108 .post-content > p").nth(1);
  await next.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const offset = await next.evaluate(
    (node) => node.getBoundingClientRect().top,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  for (const size of [90, 100, 150, 70]) {
    await slider.fill(String(size));
    await expect
      .poll(async () =>
        Math.abs(
          (await next.evaluate((node) => node.getBoundingClientRect().top)) -
            offset,
        ),
      )
      .toBeLessThanOrEqual(1);
  }
  await page.keyboard.press("Escape");
  expect(requests).toHaveLength(1);
  await info.attach("new-reading-block-after-scroll.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.appearance-palettes-spacing: four palettes share exact Compact metrics and preserve targets and settings inset", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  const slider = page.getByRole("slider", { name: "Text size", exact: true });
  for (const theme of ["Light", "Alias", "Mono", "Dark"]) {
    await dialog.getByRole("radio", { name: theme, exact: true }).check();
    for (const size of [70, 90, 100, 150]) {
      await slider.fill(String(size));
      const metrics = await page.locator("#tsdm-workspace").evaluate((host) => {
        const root = host.shadowRoot!;
        const post = root.querySelector("article")!;
        const paragraph = root.querySelector(".post-content > p")!;
        const controls = [
          ...root.querySelectorAll<HTMLElement>(
            "button,select,input[type=range]",
          ),
        ].filter((node) => node.getClientRects().length);
        return {
          background: getComputedStyle(root.querySelector(".workspace")!)
            .backgroundColor,
          color: getComputedStyle(root.querySelector(".workspace")!).color,
          rangeAccent: getComputedStyle(root.querySelector("#text-size")!)
            .accentColor,
          postPadding: getComputedStyle(post).padding,
          paragraphGap: Number.parseFloat(
            getComputedStyle(paragraph).marginTop,
          ),
          font: Number.parseFloat(getComputedStyle(paragraph).fontSize),
          weight: getComputedStyle(paragraph).fontWeight,
          dialogPadding: getComputedStyle(
            root.querySelector(".settings-dialog")!,
          ).padding,
          controls: controls.map((node) => ({
            tag: node.tagName,
            width: node.getBoundingClientRect().width,
            height: node.getBoundingClientRect().height,
          })),
        };
      });
      expect(metrics.background).toBe(
        theme === "Dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
      );
      expect(metrics.color).toBe(
        theme === "Dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
      );
      expect(metrics.rangeAccent).toBe(
        theme === "Dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
      );
      expect(metrics.postPadding).toBe(size < 100 ? "16px" : "32px");
      expect(metrics.paragraphGap).toBeCloseTo(
        metrics.font * (size < 100 ? 0.75 : 1),
        1,
      );
      expect(metrics.weight).toBe("320");
      expect(metrics.dialogPadding).toBe("32px");
      for (const control of metrics.controls) {
        expect(control.height).toBeGreaterThanOrEqual(
          control.tag === "BUTTON" ? 44 : 48,
        );
        expect(control.width).toBeGreaterThanOrEqual(44);
      }
    }
    await info.attach(`${theme.toLowerCase()}-large.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  expect(requests).toHaveLength(1);
});
