import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const title = "Listening together · 一起聽音樂";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Listener Seven</a></strong></div>';
const parent = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
const board = `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid">${[title, "This week’s discoveries", "A favorite opening theme"].map((label, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">${label}</a></th><td class="by"><cite>Composer Nine</cite><em>2026-11-05</em></td><td class="num"><a>12</a><em>84</em></td></tr></tbody>`).join("")}</table>`;
const thread = `${account}${parent}<div id="postlist"><h1 id="thread_subject">${title}</h1>${["Composer Nine", "Listener Seven", "Reader Eight"].map((name, i) => `<div id="post_${101 + i}"><div class="authi"><a href="home.php?mod=space&uid=${i === 1 ? 7 : 9}">${name}</a></div><a id="postnum${101 + i}">${i + 1}</a><em id="authorposton${101 + i}">2026-11-05 12:34</em><div class="pcb"><p>Some melodies stay with us long after the story ends. 最近聽到的音樂，總會讓人想起不同的故事。</p><p>What have you been listening to this week?</p>${i === 0 ? "<blockquote><p>A quiet moment, a familiar melody.</p></blockquote>" : ""}</div></div>`).join("")}</div>`;
const form = `${account}${parent}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="posttime" value="1793850000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;

async function open(page: Page) {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__fidelity.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__fidelity.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${url.href}`);
    if (request.method() !== "GET")
      return route.fulfill({ status: 500, body: "Unexpected write" });
    return route.fulfill({
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
  await page.goto(boardURL);
  await page.locator(".results-pane .subject").first().click();
  await expect(page.locator(".conversation-heading h1")).toHaveText(title);
  return requests;
}
async function capture(page: Page, info: TestInfo, name: string) {
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach(`${name}.json`, {
    body: JSON.stringify(
      await page
        .locator(
          ".workspace > header, .brand, .main-destinations, .boards-navigation, .results-pane, .thread-row, .conversation-heading, .history-controls, .post-header, .post-actions, .source-writing, .writing-content, .writing-presentation-actions, .post-editor textarea",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const s = getComputedStyle(node);
            return {
              selector: node.className,
              bounds: node.getBoundingClientRect().toJSON(),
              fontSize: s.fontSize,
              lineHeight: s.lineHeight,
              background: s.backgroundColor,
              radius: s.borderRadius,
              gap: s.gap,
              clientWidth: node.clientWidth,
              scrollWidth: node.scrollWidth,
            };
          }),
        ),
    ),
    contentType: "application/json",
  });
}
async function style(page: Page, selector: string) {
  if ((await page.locator(selector).count()) === 0)
    return {
      size: 0,
      weight: "missing",
      background: "missing",
      radius: "missing",
      height: 0,
    };
  return page
    .locator(selector)
    .first()
    .evaluate((node) => {
      const s = getComputedStyle(node);
      return {
        size: parseFloat(s.fontSize),
        weight: s.fontWeight,
        background: s.backgroundColor,
        radius: s.borderRadius,
        height: node.getBoundingClientRect().height,
      };
    });
}

test("DESIGN.reference: capture the pinned interactive reference for visual comparison", async ({
  page,
}, info) => {
  const path =
    process.env.TSDM_DESIGN_REFERENCE ??
    "tests/fixtures/forum-im-reference.html";
  const sample = readFileSync(path, "utf8");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/*", (route) =>
    route.fulfill({ contentType: "text/html", body: sample }),
  );
  await page.goto("https://reference.invalid/");
  await expect(page.locator("#thread-heading")).toBeVisible();
  await info.attach("reference-identity.json", {
    body: JSON.stringify({
      sha256: createHash("sha256").update(sample).digest("hex"),
      source: "tsdm-ui-experiment/docs/design/sample.html",
    }),
    contentType: "application/json",
  });
  await info.attach("reference.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("DESIGN.chrome: quiet controls, compact taxonomy, rounded list selection and recognizable post identity", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  await capture(page, info, "reading");
  expect.soft((await style(page, ".brand")).size).toBe(24);
  expect
    .soft((await style(page, ".workspace > header button")).background)
    .toBe("rgba(0, 0, 0, 0)");
  expect.soft((await style(page, ".boards-navigation h2")).size).toBe(12);
  expect.soft((await style(page, ".thread-row")).radius).toBe("8px");
  expect
    .soft((await style(page, ".conversation-heading .context-kind")).size)
    .toBe(12);
  expect.soft((await style(page, ".history-controls")).size).toBe(12);
  expect.soft((await style(page, ".post-actions button")).size).toBe(14);
  expect
    .soft((await style(page, ".post-actions button")).background)
    .toBe("rgba(0, 0, 0, 0)");
  await expect.soft(page.locator("#pid101 .avatar")).toBeVisible();
  expect
    .soft((await style(page, "#pid101 .post-header")).height)
    .toBeLessThanOrEqual(48);
  await expect(page.locator(".composer-entry")).toBeVisible();
  for (const link of await page
    .locator(".context-kind a, .conversation-tool-row a")
    .all()) {
    const bounds = await link.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }
  expect(requests).toHaveLength(2);
});

test("DESIGN.composer: compact reply exposes editor and review together, expansion retains the same editor", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const input = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await input.fill("A retained reply 中文");
  const node = await input.elementHandle();
  await capture(page, info, "compact-reply");
  expect
    .soft((await style(page, ".source-writing")).height)
    .toBeLessThanOrEqual(300);
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await expect(review).toBeInViewport();
  await expect(input).toBeInViewport();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await expect(input).toHaveValue("A retained reply 中文");
  expect(
    await input.evaluate((current, previous) => current === previous, node),
  ).toBe(true);
  // Parent #81 decision13 intentionally replaces the old bottom-only cap.
  const aside = (await page.locator(".source-writing").boundingBox())!;
  const reader = (await page.locator(".reading-pane").boundingBox())!;
  expect(aside.x).toBeGreaterThanOrEqual(reader.x + reader.width);
  expect(reader.width).toBeGreaterThanOrEqual(320);
  expect(aside.width).toBeGreaterThanOrEqual(280);
  await expect(input).toBeInViewport();
  await expect(review).toBeInViewport();
  await page.setViewportSize({ width: 1439, height: 900 });
  await expect
    .poll(async () => {
      const writing = (await page.locator(".source-writing").boundingBox())!;
      const reading = (await page.locator(".reading-pane").boundingBox())!;
      return writing.y >= reading.y + reading.height - 1;
    })
    .toBe(true);
  expect(
    await input.evaluate((current, previous) => current === previous, node),
  ).toBe(true);
  await expect(input).toHaveValue("A retained reply 中文");
  await expect(review).toBeInViewport();
  await capture(page, info, "expanded-reply");
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  await expect(input).toHaveValue("A retained reply 中文");
  await expect(review).toBeInViewport();
  expect(requests.every((request) => request.startsWith("GET "))).toBe(true);
});

for (const [width, theme, textSize, language] of [
  [390, "light", 100, "en"],
  [768, "alias", 100, "zh-TW"],
  [960, "mono", 150, "zh-CN"],
  [1440, "dark", 100, "en"],
] as const) {
  test(`DESIGN.cover-${width}-${theme}: readable geometry and controls across appearances`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      (preferences) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({ schema: 1, ...preferences }),
        ),
      { theme, textSize, language },
    );
    // Open a thread directly so narrow drawers do not obscure the geometry.
    const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
    await page.route("**/*", (route) =>
      route.fulfill(
        route.request().isNavigationRequest()
          ? {
              contentType: "text/html; charset=utf-8",
              body: `<html><body><script>${built}</script></body></html>`,
            }
          : {
              contentType: "application/json",
              body: JSON.stringify({ document: thread }),
            },
      ),
    );
    await page.goto(threadURL);
    await expect(page.locator("#pid101")).toBeVisible();
    const widths = await page
      .locator(".workspace, .conversation-heading, .post-header, .post-content")
      .evaluateAll((nodes) =>
        nodes.map((node) => [node.clientWidth, node.scrollWidth]),
      );
    for (const [client, scroll] of widths)
      expect(scroll).toBeLessThanOrEqual(client! + 1);
    expect(
      (await style(page, ".post-actions button")).height,
    ).toBeGreaterThanOrEqual(44);
    await capture(page, info, "appearance");
  });
}
