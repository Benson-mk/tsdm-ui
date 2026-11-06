import { openThreadMore, openThreadPages } from "./navigation-ui";
import { clickThreadTool } from "./navigation-ui";
import {
  openSettings,
  closeSettingsToWorkspace,
  revealNavigation,
} from "./navigation-ui";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const filterURL = `${threadURL}&page=3&authorid=9&ordertype=1`;
const unknownURL = `${threadURL}&authorid=88`;
const longURL = `https://example.com/${"complete-mixed-language音樂".repeat(24)}`;
const longAuthor = `ComposerNine${"完整Author".repeat(12)}`;
const title =
  `完整音樂討論 — ${"A complete long title 音樂 ".repeat(9)}`.trim();
const prose = `Complete prose 完整閱讀 ${"Mixed-language音樂長文".repeat(35)} end of prose.`;
const code = `${"0123456789".repeat(70)}\nsecond complete line`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const nativeProse = "最近下载了很多电影，话说大家有什么电影推荐的？";
const nativeBody = `${nativeProse}<br>国产的外国的都可以<br><br>谢谢，<br>以上`;
const body = `${nativeBody}<p>${prose}</p><p><a href="${longURL}">${longURL}</a></p><blockquote>Quoted listener<blockquote>Nested complete quote<blockquote>Third quote complete.</blockquote></blockquote></blockquote><pre><code>${code}</code></pre><table><caption>Complete track credits</caption><tr>${Array.from({ length: 12 }, (_, i) => `<th>Column ${i}</th>`).join("")}</tr><tr>${Array.from({ length: 12 }, (_, i) => `<td>Full credit ${i}</td>`).join("")}</tr></table><p><a href="${threadURL}&authorid=9&ordertype=1">An authored filtered-thread reference</a></p><p>Before unsupported formatting.</p><font>First retained format.</font><font>Second retained format.</font><div><font>Third retained format.</font></div><marquee>Distinct unsupported content retained.</marquee><iframe src="https://evil.example/">Interactive fallback retained.</iframe><div hidden>Withheld native content must stay withheld.</div><div class="locked">Read permission 20 required.</div><p>After unsupported formatting.</p>`;
function fixture(
  ambiguous = false,
  minimal = false,
  foreignProfile = false,
  typography = false,
) {
  const post = (
    id: number,
    name: string,
    uid: string | null,
    content: string,
  ) =>
    `<div id="post_${id}"><div class="authi">${uid ? `<a href="${foreignProfile ? "https://elsewhere.example/" : ""}home.php?mod=space&uid=${uid}">${name}</a>` : name}</div><a id="postnum${id}" href="${threadURL}#pid${id}">${id - 100}</a><em id="authorposton${id}">2026-11-03 12:34</em><div class="pcb"><p>Native content before the message.</p><div class="t_fsz"><table><tbody><tr><td class="t_f" id="postmessage_${id}">${content}</td></tr></tbody></table></div><p>Native amendment after the message.</p><div class="attach_nopermission">Native attachment permission remains visible.</div></div></div>`;
  return `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">${title}</h1>${post(101, longAuthor, "9", minimal ? nativeBody : (typography ? "<h2>Semantic heading two</h2><h3>Semantic heading three</h3><h4>Semantic heading four</h4><h5>Semantic heading five</h5><h6>Semantic heading six</h6><p>Inline <code>code</code></p>" : "") + body)}${post(102, ambiguous ? "Conflicting identity" : "Reader Seven", ambiguous ? "9" : "7", "<font>Separate post retained.</font><font>Separate post second.</font>")}${post(103, "Unknown native author", null, "<p>Unknown complete post.</p><table><tr><td>Authored one-cell table retained.</td></tr></table>")}</div><div class="pg"><strong>3</strong><a href="${threadURL}&page=4&authorid=9">4</a></div><div class="pi"><div class="pti"><div class="authi"><a href="${filterURL}">Only this author</a><a href="${unknownURL}">Only this author</a><a href="${threadURL}&ordertype=1">Reverse order</a></div></div></div>`;
}
const ledgers = new WeakMap<Page, string[]>();
async function open(
  page: Page,
  ambiguous = false,
  minimal = false,
  foreignProfile = false,
  typography = false,
) {
  const requests: string[] = [];
  ledgers.set(page, requests);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__reader.js`)
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__reader.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    if (new URL(request.url()).origin !== origin)
      return route.fulfill({ status: 404, body: "Blocked external content" });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document: fixture(ambiguous, minimal, foreignProfile, typography),
      }),
    });
  });
  await page.goto(`${threadURL}&page=3`);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return requests;
}
async function paint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
async function capture(page: Page, info: TestInfo) {
  await paint(page);
  await info.attach("reader-state.json", {
    body: JSON.stringify(
      await page.locator(".reading-pane").evaluate((pane) => ({
        text: pane.textContent,
        elements: [
          ...pane.querySelectorAll(
            "article, article header, article header strong, .post-content, .post-content p, .post-content a, blockquote, pre, table, .table-overflow",
          ),
        ].map((node) => ({
          tag: node.tagName,
          class: node.className,
          width: node.clientWidth,
          scroll: node.scrollWidth,
          bounds: node.getBoundingClientRect().toJSON(),
          display: getComputedStyle(node).display,
          minWidth: getComputedStyle(node).minWidth,
          overflow: getComputedStyle(node).overflow,
          wrap: getComputedStyle(node).overflowWrap,
        })),
      })),
    ),
    contentType: "application/json",
  });
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("reader.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test.afterEach(async ({ page }, info) => {
  if (await page.locator(".reading-pane").count()) await capture(page, info);
});
for (const [width, height, textSize, theme, language] of [
  [390, 844, 100, "light", "en"],
  [390, 844, 150, "dark", "zh-CN"],
  [768, 900, 70, "mono", "zh-TW"],
  [1440, 900, 150, "alias", "en"],
] as const) {
  test(`UX55.reader-${width}-${textSize}-${language}: complete prose and distinct hierarchy with bounded keyboard rich regions`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (preferences) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, ...preferences }),
        ),
      { textSize, theme, language },
    );
    const requests = await open(page);
    const article = page.locator("#pid101");
    await paint(page);
    await info.attach("thread-title.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await article.locator("header").scrollIntoViewIfNeeded();
    await paint(page);
    await info.attach("author-metadata.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await expect(article.getByText(prose, { exact: true })).toBeVisible();
    await expect(
      article.getByRole("link", { name: longURL, exact: true }),
    ).toHaveAttribute("href", new URL(longURL).href);
    await expect(article.locator("table")).toHaveCount(1);
    const geometry = await article.evaluate((node) => {
      const pane = node.closest(".reading-pane")!;
      return {
        pane: [pane.clientWidth, pane.scrollWidth],
        header: [
          node.querySelector("header")!.clientWidth,
          node.querySelector("header")!.scrollWidth,
        ],
        prose: [...node.querySelectorAll(".post-content p")].map((p) => [
          p.clientWidth,
          p.scrollWidth,
        ]),
      };
    });
    expect(geometry.pane[1], JSON.stringify(geometry)).toBeLessThanOrEqual(
      geometry.pane[0]! + 1,
    );
    expect(geometry.header[1]).toBeLessThanOrEqual(geometry.header[0]! + 1);
    for (const [client, scroll] of geometry.prose)
      expect(scroll).toBeLessThanOrEqual(client! + 1);
    await expect(article.locator("header strong")).toHaveText(longAuthor);
    await expect(article.locator("header time")).toHaveText("2026-11-03 12:34");
    await expect(article.locator(".post-actions")).toBeVisible();
    expect(
      await article
        .locator("header strong")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontWeight)),
    ).toBeGreaterThan(
      await article
        .locator("header time")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontWeight)),
    );
    expect(
      await article
        .locator("blockquote")
        .first()
        .evaluate((node) => parseFloat(getComputedStyle(node).borderLeftWidth)),
    ).toBeGreaterThan(0);
    const names =
      language === "en"
        ? ["Scrollable code", "Scrollable table"]
        : language === "zh-CN"
          ? ["可滚动的代码", "可滚动的表格"]
          : ["可捲動的程式碼", "可捲動的表格"];
    for (const name of names) {
      const region = article.getByRole("region", { name, exact: true });
      await region.focus();
      await expect(region).toBeFocused();
      await region.press("ArrowRight");
      await expect
        .poll(() => region.evaluate((node) => node.scrollLeft))
        .toBeGreaterThan(0);
      expect(
        await region.evaluate(
          (node) =>
            node.getBoundingClientRect().right <=
            node.closest("article")!.getBoundingClientRect().right,
        ),
      ).toBe(true);
    }
    await expect(article.locator("pre code")).toHaveText(code);
    await expect(article.locator("th")).toHaveCount(12);
    await expect(article.locator("td")).toHaveCount(12);
    await expect(
      article.getByText("Read permission 20 required.", { exact: true }),
    ).toBeVisible();
    await article.locator(".post-actions").scrollIntoViewIfNeeded();
    await paint(page);
    await info.attach("post-actions.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    for (const resized of [768, 390, width])
      await page.setViewportSize({ width: resized, height });
    await expect(page.locator(".workspace")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
  });
}

test("UX55.notices: same formatting consolidated per post with details while all content and permissions remain", async ({
  page,
}) => {
  await open(page);
  const first = page.locator("#pid101");
  const details = first.locator("details.format-notices");
  await expect(details).toHaveCount(1);
  await expect(details.locator("summary")).toHaveText(
    "Unsupported formatting: 4 occurrences. Details",
  );
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(
    details.getByText("Unsupported formatting (font) × 3", { exact: true }),
  ).toBeVisible();
  await expect(
    details.getByText("Unsupported formatting (marquee) × 1", { exact: true }),
  ).toBeVisible();
  for (const text of [
    "First retained format.",
    "Second retained format.",
    "Third retained format.",
    "Distinct unsupported content retained.",
    "Before unsupported formatting.",
    "After unsupported formatting.",
    "Unsupported interactive content",
    "Additional native content is hidden; view it in the native forum.",
    "Read permission 20 required.",
  ])
    await expect(first.getByText(text, { exact: true })).toBeVisible();
  await expect(first.locator(".post-content")).toContainText(
    "Interactive fallback retained.",
  );
  await expect(
    first.getByText("Withheld native content must stay withheld.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    first
      .locator(".content-notice")
      .filter({ hasText: "Unsupported formatting (font)" }),
  ).toHaveCount(0);
  await expect(
    page.locator("#pid102 details.format-notices summary"),
  ).toHaveText("Unsupported formatting: 2 occurrences. Details");
});

test("UX55.author-filter: known URL identity names the correct author and restores exact action without unrelated reads", async ({
  page,
}) => {
  const requests = await open(page);
  const action = page.locator("#pid101").getByRole("link", {
    name: `Only this author: ${longAuthor}`,
    exact: true,
  });
  await expect(action).toHaveAttribute("href", filterURL);
  await expect(
    page.locator("#pid102").getByRole("link", {
      name: `Only this author: ${longAuthor}`,
      exact: true,
    }),
  ).toHaveCount(0);
  await action.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  const returned = new URL(requests[1]!.slice(4));
  returned.searchParams.delete("tsdmapp");
  expect(returned.href).toBe(filterURL);
  await revealNavigation(page);
  await clickThreadTool(page, "Back");
  await expect(action).toHaveAttribute("href", filterURL);
  expect(requests).toHaveLength(2);
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
});

test("UX55.unknown-filter: absent or conflicting identity stays generic instead of guessing from a label", async ({
  page,
}) => {
  const requests = await open(page, true);
  const filters = await openThreadMore(page);
  await expect(
    filters.getByRole("menuitem", {
      name: "Author filter: Only this author",
      exact: true,
    }),
  ).toHaveCount(2);
  await expect(filters.locator(`a[href="${unknownURL}"]`)).toBeVisible();
  await expect(page.locator("article .author-filter")).toHaveCount(0);
  await expect(
    filters.getByRole("menuitem", { name: "Reverse order", exact: true }),
  ).toHaveAttribute("href", `${threadURL}&ordertype=1`);
  expect(requests).toHaveLength(1);
});

test("UX55.native-wrapper-prose: observed message-container table never turns ordinary prose into a scrollable data table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, false, true);
  const article = page.locator("#pid101");
  await expect(article.getByText(nativeProse, { exact: false })).toBeVisible();
  await expect(article.locator("table")).toHaveCount(0);
  await expect(
    article.getByRole("region", { name: "Scrollable table", exact: true }),
  ).toHaveCount(0);
  expect(
    await article.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
});

test("UX55.native-siblings: native message layout unwrap keeps meaningful siblings and authored data tables", async ({
  page,
}) => {
  await open(page);
  const article = page.locator("#pid101");
  await expect(
    article.getByText("Native content before the message.", { exact: true }),
  ).toBeVisible();
  await expect(
    article.getByText("Native amendment after the message.", { exact: true }),
  ).toBeVisible();
  await expect(
    article.getByText("Native attachment permission remains visible.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(article.locator("table")).toHaveCount(1);
  await expect(article.locator("table caption")).toHaveText(
    "Complete track credits",
  );
  await expect(article.locator("td")).toHaveCount(12);
  await expect(page.locator("#pid103 table td")).toHaveText(
    "Authored one-cell table retained.",
  );
});

test("UX55.foreign-profile: a foreign uid parameter never establishes a forum-author filter relationship", async ({
  page,
}) => {
  await open(page, false, false, true);
  const filters = await openThreadMore(page);
  await expect(
    filters.getByRole("menuitem", {
      name: "Author filter: Only this author",
      exact: true,
    }),
  ).toHaveCount(2);
  await expect(page.locator("article .author-filter")).toHaveCount(0);
});

test("UX55.filter-provenance: pagination carrying author context stays pagination and authored references stay content", async ({
  page,
}) => {
  await open(page);
  const article = page.locator("#pid101");
  await expect(article.locator(".post-actions .author-filter")).toHaveCount(1);
  await expect(article.locator(".post-actions .author-filter")).toHaveAttribute(
    "href",
    filterURL,
  );
  await expect(
    article.locator(".post-content").getByRole("link", {
      name: "An authored filtered-thread reference",
      exact: true,
    }),
  ).toHaveAttribute("href", `${threadURL}&authorid=9&ordertype=1`);
  await expect(
    (await openThreadPages(page)).getByRole("link", { name: "4", exact: true }),
  ).toHaveAttribute("href", `${threadURL}&page=4&authorid=9`);
  await page.keyboard.press("Escape");
  await expect(
    page
      .locator(".reading-pane")
      .getByRole("navigation", { name: "Pages", exact: true }),
  ).toHaveCount(0);
});

test("IM65.rich-type: semantic headings code and author roles follow DESIGN and scale once with Text size", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page, false, false, false, true);
  await openSettings(page);
  const roles: [string, number, string, number][] = [
    ["#pid101 .post-author", 14, "540", 1.45],
    ["#pid101 .post-content h2", 26, "540", 1.35],
    ["#pid101 .post-content h3", 24, "700", 1.45],
    ["#pid101 .post-content h4", 18, "540", 1.45],
    ["#pid101 .post-content h5", 18, "540", 1.45],
    ["#pid101 .post-content h6", 18, "540", 1.45],
    ["#pid101 .post-content pre", 14, "400", 1.7],
    ["#pid101 .post-content pre code", 14, "400", 1.7],
    ["#pid101 .post-content p > code", 14, "400", 1.7],
  ];
  const measurements: unknown[] = [];
  for (const size of [70, 100, 150]) {
    await page
      .getByRole("slider", { name: "Text size", exact: true })
      .fill(String(size));
    for (const [selector, baseline, weight, line] of roles) {
      const metrics = await page
        .locator(selector)
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            size: parseFloat(style.fontSize),
            weight: style.fontWeight,
            line: parseFloat(style.lineHeight),
            tracking: style.letterSpacing,
          };
        });
      measurements.push({ textSize: size, selector, ...metrics });
      expect
        .soft(metrics.size, `${selector} at ${size}%`)
        .toBeCloseTo((baseline * size) / 100, 2);
      expect.soft(metrics.weight, selector).toBe(weight);
      expect
        .soft(metrics.line, selector)
        .toBeCloseTo(((baseline * size) / 100) * line, 2);
      expect.soft(metrics.tracking, selector).toBe("normal");
    }
  }
  await closeSettingsToWorkspace(page);
  expect(requests).toHaveLength(1);
  await info.attach("semantic-type.json", {
    body: JSON.stringify(measurements),
    contentType: "application/json",
  });
});
