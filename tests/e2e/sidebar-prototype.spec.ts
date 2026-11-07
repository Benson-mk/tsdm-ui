import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = `${directoryURL}?mod=forumdisplay&fid=5`;
const title = "最近有什么值得分享的新发现？";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">demo-member</a></strong></div>';
const parent = `<div id="pt"><a href="${boardURL}">事务所</a></div>`;
const directory = `${account}<div class="bm"><div class="bm_h"><h2><a href="forum.php?gid=1">Community</a></h2></div><div id="category_1"><table><tr><td><h2><a href="${boardURL}">事务所</a></h2><p>论坛公告发布 / 论坛系统问题上报处理。新人疑问帮助 / 意见反馈 / 版务投诉。</p></td></tr></table></div></div>`;
const board = `${account}<div id="ct"><h1><a href="${boardURL}">事务所</a></h1></div><table id="threadlisttableid">${[title, "本周交流与提问", "一起整理实用资料"].map((label, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">${label}</a></th><td class="by"><cite>demo-member</cite><em>2026-11-08</em></td><td class="num"><a>12</a><em>84</em></td></tr></tbody>`).join("")}</table>`;
const thread = `${account}${parent}<div id="postlist"><h1 id="thread_subject">${title}</h1>${[101, 102, 103].map((id, i) => `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=7">demo-member</a></div><a id="postnum${id}">${i + 1}</a><em id="authorposton${id}">2026-11-08 12:34</em><div class="pcb"><p>这是用于预览连续阅读布局的示例内容。</p><p>一起交流想法，分享最近的发现。</p>${i > 0 ? "<p>每篇内容长短不同，滚动时页码会跟随当前阅读位置。</p>" : ""}</div></div>`).join("")}</div>`;
const form = `${account}${parent}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1794090000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;

async function open(page: Page, memberName = "demo-member") {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__prototype-fidelity.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><html><body><script src="${origin}/__prototype-fidelity.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${url.href}`);
    if (request.method() !== "GET")
      return route.fulfill({ status: 500, body: "Unexpected write" });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document: (url.searchParams.get("mod") === "post"
          ? form
          : url.searchParams.get("mod") === "viewthread"
            ? thread
            : url.searchParams.get("mod") === "forumdisplay"
              ? board
              : directory
        ).replaceAll("demo-member", memberName),
      }),
    });
  });
  await page.goto(directoryURL);
  await expect(page.locator(".overview .board-card")).toHaveCount(1);
  return requests;
}

for (const [language, qualifier, boards] of [
  ["en", "Snapshot", "Boards pane"],
  ["zh-CN", "快照", "版块面板"],
  ["zh-TW", "快照", "版塊面板"],
] as const) {
  for (const [width, textSize] of [
    [1440, 100],
    [375, 150],
  ] as const) {
    test(`PROTOTYPE.account-status-${language}-${width}: long member names cannot hide restored status`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (preferences) =>
          localStorage.setItem(
            "tsdm.workspace.preferences",
            JSON.stringify({ schema: 1, theme: "light", ...preferences }),
          ),
        { language, textSize },
      );
      const name = "繁體中文會員名稱有點長";
      const requests = await open(page, name);
      await page.locator(".overview .board-card").click();
      await expect(page.locator(".results-pane .subject")).toHaveCount(3);
      await page.reload();
      if (width < 960)
        await page.getByRole("button", { name: boards, exact: true }).click();
      const label = page.locator(".navigation-account");
      await expect(label).toContainText(qualifier);
      await expect(label).toHaveAttribute("title", new RegExp(name));
      const geometry = await label.evaluate((node, word) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const rects = [];
        while (walker.nextNode()) {
          const text = walker.currentNode;
          const start = text.textContent?.indexOf(word) ?? -1;
          if (start < 0) continue;
          const range = document.createRange();
          range.setStart(text, start);
          range.setEnd(text, start + word.length);
          rects.push(
            ...Array.from(range.getClientRects(), (rect) => rect.toJSON()),
          );
        }
        return {
          bounds: node.getBoundingClientRect().toJSON(),
          qualifier: rects,
        };
      }, qualifier);
      await info.attach("account-status.json", {
        body: JSON.stringify({ geometry, requests }, null, 2),
        contentType: "application/json",
      });
      await info.attach("account-status.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      expect(geometry.qualifier.length).toBeGreaterThan(0);
      for (const rect of geometry.qualifier) {
        expect(rect.top).toBeGreaterThanOrEqual(geometry.bounds.top);
        expect(rect.bottom).toBeLessThanOrEqual(geometry.bounds.bottom);
        expect(rect.left).toBeGreaterThanOrEqual(geometry.bounds.left);
        expect(rect.right).toBeLessThanOrEqual(geometry.bounds.right);
      }
      expect(requests.every((request) => request.startsWith("GET "))).toBe(
        true,
      );
    });
  }
}
async function read(page: Page) {
  await page.locator(".overview .board-card").click();
  await page.locator(".results-pane .subject").first().click();
  await expect(page.locator(".conversation-heading h1")).toHaveText(title);
}
async function measure(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((node) => {
      const s = getComputedStyle(node),
        b = node.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        right: b.right,
        bottom: b.bottom,
        fontSize: parseFloat(s.fontSize),
        padding: s.padding,
        paddingLeft: parseFloat(s.paddingLeft),
        paddingTop: parseFloat(s.paddingTop),
        radius: s.borderRadius,
        background: s.backgroundColor,
        shadow: s.boxShadow,
        gap: s.gap,
      };
    });
}
async function capture(
  page: Page,
  info: TestInfo,
  name: string,
  requests: string[],
) {
  await page.mouse.move(0, 0);
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const selectors = [
    ".workspace > header",
    ".brand-mark",
    ".header-navigation",
    ".navigation-body",
    ".navigation-footer",
    "#thread-list-pane",
    "#thread-list-pane h1",
    ".board-card",
    ".board-card strong",
    ".thread-row",
    ".conversation-heading",
    ".context-kind",
    ".source-writing",
    ".writing-presentation-actions",
    ".writing-destination",
    ".writing-primary-action",
  ];
  const measurements: Record<string, unknown> = {};
  for (const selector of selectors)
    if (await page.locator(selector).count())
      measurements[selector] = await measure(page, selector);
  await info.attach(`${name}.json`, {
    body: JSON.stringify({ measurements, requests }, null, 2),
    contentType: "application/json",
  });
}
test("PROTOTYPE.directory: reference header, footer and category card hierarchy", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  await capture(page, info, "directory", requests);
  const header = await measure(page, ".workspace > header");
  const mark = await measure(page, ".brand-mark");
  const controls = await measure(page, ".header-navigation");
  const card = await measure(page, ".board-card");
  expect.soft(header.height).toBe(60);
  expect.soft(mark.width).toBe(44);
  expect.soft(controls.right).toBe(1424);
  expect.soft((await measure(page, "#thread-list-pane")).paddingLeft).toBe(24);
  expect.soft((await measure(page, "#thread-list-pane h1")).fontSize).toBe(30);
  expect.soft(card.radius).toBe("24px");
  expect.soft(card.paddingTop).toBe(20);
  expect.soft((await measure(page, ".board-card strong")).fontSize).toBe(18);
  await expect
    .soft(page.locator(".navigation-account strong"))
    .toHaveText("demo-member");
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
});
test("PROTOTYPE.reading: reference list spacing and single compact context badge", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  await read(page);
  await capture(page, info, "reading", requests);
  expect.soft((await measure(page, ".results-pane")).paddingLeft).toBe(24);
  expect.soft((await measure(page, ".results-pane h1")).fontSize).toBe(30);
  const row = await measure(page, ".thread-row");
  expect.soft(row.paddingLeft).toBe(16);
  const badge = await measure(page, ".context-kind");
  expect.soft(badge.radius).toBe("8px");
  expect.soft(badge.height).toBeLessThanOrEqual(44);
  expect
    .soft((await measure(page, ".conversation-heading h1")).fontSize)
    .toBe(26);
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
});
test("PROTOTYPE.writing: compact reference actions retain source, destination and review", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const requests = await open(page);
  await read(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.locator(".post-editor textarea");
  await source.fill("A retained reply 中文");
  await capture(page, info, "compact", requests);
  const expand = page.getByRole("button", {
    name: "Expand writing",
    exact: true,
  });
  expect.soft((await expand.boundingBox())!.width).toBe(44);
  await expect.soft(page.locator(".writing-destination")).toBeInViewport();
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await expect(review).toBeInViewport();
  const bounds = await review.boundingBox();
  expect.soft(bounds!.x + bounds!.width).toBe(1682);
  await expand.click();
  await expect(source).toHaveValue("A retained reply 中文");
  await expect(review).toBeInViewport();
  await capture(page, info, "expanded", requests);
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  await expect(source).toHaveValue("A retained reply 中文");
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
});

for (const [width, theme, textSize] of [
  [375, "light", 100],
  [768, "dark", 150],
  [960, "alias", 100],
  [1440, "mono", 100],
] as const) {
  test(`PROTOTYPE.cover-${width}-${theme}: header, drawer and focused composer stay usable`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      (preferences) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, ...preferences }),
        ),
      { theme, textSize, language: "en" },
    );
    const requests = await open(page);
    await read(page);
    const header = await measure(page, ".workspace > header");
    for (const button of await page.locator(".header-action").all()) {
      const b = (await button.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.y + b.height).toBeLessThanOrEqual(header.bottom);
    }
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Retained across presentation 中文");
    await expect(
      page.getByRole("button", { name: "Review publication", exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await expect(source).toHaveValue("Retained across presentation 中文");
    await page
      .getByRole("button", { name: "Compact writing", exact: true })
      .click();
    await expect(source).toHaveValue("Retained across presentation 中文");
    await capture(page, info, "responsive", requests);
    expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
  });
}
