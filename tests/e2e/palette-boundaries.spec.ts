import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = (id: number) => `${directoryURL}?mod=forumdisplay&fid=${id}`;
const threadURL = (id: number) => `${directoryURL}?mod=viewthread&tid=${id}`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const original =
  "[quote=Original author]Retained quote 中文[/quote]\n[table][tr][th]Heading[/th][td]Cell[/td][/tr][/table]\n[b]Original source[/b]";
const palettes = {
  light: {
    base: "rgb(235, 245, 232)",
    anime: "rgb(221, 164, 159)",
    creative: "rgb(162, 155, 186)",
    inverse: "rgb(109, 81, 117)",
    cool: "rgb(166, 198, 225)",
    ink: "rgb(0, 0, 0)",
    surface: "rgb(255, 255, 255)",
    soft: "rgb(238, 238, 238)",
  },
  alias: {
    base: "rgb(235, 245, 232)",
    anime: "rgb(194, 184, 218)",
    creative: "rgb(194, 184, 218)",
    inverse: "rgb(97, 99, 121)",
    cool: "rgb(166, 198, 225)",
    ink: "rgb(0, 0, 0)",
    surface: "rgb(255, 255, 255)",
    soft: "rgb(238, 238, 238)",
  },
  mono: {
    base: "rgb(233, 233, 233)",
    anime: "rgb(227, 227, 227)",
    creative: "rgb(228, 228, 228)",
    inverse: "rgb(102, 102, 102)",
    cool: "rgb(184, 184, 184)",
    ink: "rgb(0, 0, 0)",
    surface: "rgb(255, 255, 255)",
    soft: "rgb(238, 238, 238)",
  },
  dark: {
    base: "rgb(235, 245, 232)",
    anime: "rgb(221, 164, 159)",
    creative: "rgb(162, 155, 186)",
    inverse: "rgb(109, 81, 117)",
    cool: "rgb(166, 198, 225)",
    ink: "rgb(255, 255, 255)",
    surface: "rgb(0, 0, 0)",
    soft: "rgb(102, 102, 102)",
  },
};
async function open(page: Page) {
  page.on("pageerror", (error) => console.log("Page error:", error.message));
  const requests: { method: string; url: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/media.png")
      return route.fulfill({
        contentType: "image/png",
        body: readFileSync("tests/fixtures/native-attachment-pixel.PNG"),
      });
    if (url.pathname === "/__palette.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__palette.js"></script></body></html>`,
      });
    requests.push({ method: request.method(), url: url.href });
    if (request.method() !== "GET")
      return route.fulfill({ status: 500, body: "No social writes permitted" });
    let body = account;
    const mod = url.searchParams.get("mod");
    const id = Number(
      url.searchParams.get("fid") ?? url.searchParams.get("tid") ?? 201,
    );
    if (!mod)
      body += [
        [201, "Anime"],
        [301, "Creative"],
        [401, "Music"],
      ]
        .map(
          ([id, name]) =>
            `<div class="bm"><div class="bm_h"><h2><a href="forum.php?gid=${id}">${name}</a></h2></div><div id="category_${id}"><table><tr><td><h2><a href="${boardURL(Number(id))}">Board ${id}</a></h2></td></tr></table></div></div>`,
        )
        .join("");
    else if (mod === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL(id)}">Board ${id}</a></h1></div><ul id="thread_types"><li><a href="${boardURL(id)}&filter=typeid&typeid=1">Source filter</a></li></ul><table id="threadlisttableid"><tbody id="normalthread_${id}"><tr><th><a class="xst" href="${threadURL(id)}">Thread ${id}</a></th></tr></tbody></table>`;
    else if (mod === "post")
      body += `<div id="pt"><a href="${boardURL(id)}">Board ${id}</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=${id}&tid=${id}&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value="Native title"><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;
    else
      body += `<div id="pt"><a href="${boardURL(id)}">Board ${id}</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1><div id="post_${id}1"><div class="authi"><a href="home.php?mod=space&uid=8">Original author</a></div><a id="postnum${id}1">1</a><div class="pcb"><p>Original post body</p><img src="${origin}/media.png" alt="Original media"><blockquote><p>Reading quote 中文</p></blockquote><table><tr><th>Heading</th><td>Cell</td></tr></table><p><a href="${threadURL(301)}">Creative thread</a></p></div></div></div>`;
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(directoryURL);
  await expect(page.locator(".overview .board-card")).toHaveCount(3);
  await page.locator(`.overview .board-card[href="${boardURL(201)}"]`).click();
  await page
    .locator("#thread-list-pane")
    .getByRole("link", { name: "Thread 201", exact: true })
    .click();
  return requests;
}
async function theme(page: Page, value: string) {
  await openSettings(page);
  await page.locator(`input[type=radio][value="${value}"]`).check();
  await closeSettingsToWorkspace(page);
}
async function colors(locator: Locator) {
  return locator.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      background: s.backgroundColor,
      color: s.color,
      border: s.borderInlineStartColor,
      borderWidth: s.borderInlineStartWidth,
    };
  });
}
function contrast(a: string, b: string) {
  const luminance = (rgb: string) =>
    rgb
      .match(/\d+/g)!
      .slice(0, 3)
      .map(Number)
      .map((n) => {
        const x = n / 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      })
      .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i]!, 0);
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test.afterEach(async ({ page }, info) => {
  await info.attach("visible-dom.txt", {
    body: await page.locator(".workspace").innerText(),
    contentType: "text/plain",
  });
  await info.attach("palette.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UI91.quote-review: exact base quotes and cool table headings survive all themes through rich editing and frozen real Review", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 1000 });
  const requests = await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(original);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await expect(editor).toBeVisible();
  const handle = await editor.elementHandle();
  const observations = [];
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    const media = page.locator(".reading-pane img");
    await expect(media).toHaveCSS("filter", "none");
    await expect(media).toHaveCSS("opacity", "1");
    expect(
      await media.evaluate((node: HTMLImageElement) => node.naturalWidth),
    ).toBeGreaterThan(0);
    for (const surface of [
      page.locator(".reading-pane .post-content"),
      editor,
    ]) {
      const quote = surface.locator("blockquote");
      await expect(quote).toHaveCSS("background-color", p.base);
      await expect(quote).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(quote).toHaveCSS(
        "border-inline-start-color",
        "rgb(0, 0, 0)",
      );
      await expect(quote).toHaveCSS("border-inline-start-width", "3px");
      await expect(surface.locator("th")).toHaveCSS("background-color", p.cool);
      await expect(surface.locator("th")).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(surface.locator("td")).toHaveCSS("color", p.ink);
      const c = await colors(quote);
      expect(contrast(c.background, c.color)).toBeGreaterThanOrEqual(4.5);
      observations.push({ name, quote: c });
    }
    expect(await handle!.evaluate((n) => n.isConnected)).toBe(true);
    await info.attach(`editing-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(source).toHaveValue(original);
  await source.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  const frozen = await review.locator(".prepared-source").textContent();
  expect(frozen).toBe(original);
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    await expect(review.locator("blockquote")).toHaveCSS(
      "background-color",
      p.base,
    );
    await expect(review.locator("blockquote")).toHaveCSS(
      "color",
      "rgb(0, 0, 0)",
    );
    await expect(review.locator("th")).toHaveCSS("background-color", p.cool);
    await expect(review.locator("td")).toHaveCSS("color", p.ink);
    await expect(review.locator(".prepared-source")).toHaveText(frozen!);
    await expect(review).toContainText("Thread 201");
    await review.locator("blockquote").scrollIntoViewIfNeeded();
    await info.attach(`review-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("quote-review-observations.json", {
    body: JSON.stringify({ observations, frozen, requests }),
    contentType: "application/json",
  });
});

test("UI91.category-retention: filters and existing avatars use source identity while writing and real Review keep Anime after Creative browsing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 1000 });
  const requests = await open(page);
  const filter = page.getByRole("link", { name: "Source filter", exact: true });
  await expect(filter).toHaveCSS("background-color", palettes.light.anime);
  await filter.hover();
  await expect(filter).toHaveCSS("background-color", palettes.light.anime);
  await expect(filter).toHaveCSS("text-decoration-line", "underline");
  await expect(page.locator(".reading-pane .avatar")).toHaveCSS(
    "background-color",
    palettes.light.anime,
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(original);
  const handle = await source.elementHandle();
  await page.locator(`.boards-navigation a[href="${boardURL(301)}"]`).click();
  await page
    .locator("#thread-list-pane")
    .getByRole("link", { name: "Thread 301", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  const observations = [];
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    await expect(page.locator("#thread-list-pane > .category-label")).toHaveCSS(
      "background-color",
      p.creative,
    );
    await expect(page.locator(".reader-breadcrumb .category-label")).toHaveCSS(
      "background-color",
      p.creative,
    );
    await expect(page.locator(".reading-pane .avatar")).toHaveCSS(
      "background-color",
      p.creative,
    );
    const destination = page.locator(".bottom-resume .category-label");
    await expect(destination).toHaveCSS("background-color", p.anime);
    await expect(destination).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(page.locator(".bottom-resume")).toContainText("Thread 201");
    await expect(page.locator(".bottom-resume")).toContainText(
      "Writing still targets the original destination shown here",
    );
    observations.push({ name, destination: await colors(destination) });
    await info.attach(`retained-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  expect(await handle!.evaluate((n) => n.isConnected)).toBe(true);
  await expect(source).toHaveValue(original);
  await source.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    const destination = review.locator(".category-label");
    await expect(destination).toHaveCSS("background-color", p.anime);
    await expect(destination).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(review).toContainText("Thread 201");
    await expect(review.locator(".prepared-source")).toHaveText(original);
  }
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("category-retention.json", {
    body: JSON.stringify({ observations, source: original, requests }),
    contentType: "application/json",
  });
});

test("UI91.controls: palette hover disabled selected native fields and surface focus retain font and source across themes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 1000 });
  const requests = await open(page);
  const font = await page
    .locator(".workspace")
    .evaluate((n) => getComputedStyle(n).fontFamily);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + "\n[unknown]Protected original[/unknown]");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const observations = [];
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    const ordinary = page.getByRole("button", {
      name: "Settings",
      exact: true,
    });
    await ordinary.hover();
    await expect(ordinary).toHaveCSS("background-color", p.soft);
    await expect(ordinary).toHaveCSS("text-decoration-line", "underline");
    const selected = page.getByRole("button", {
      name: "Visual editor",
      exact: true,
    });
    await selected.hover();
    await expect(selected).toHaveCSS("background-color", p.ink);
    await expect(selected).toHaveCSS("color", p.surface);
    await expect(selected).toHaveCSS("text-decoration-line", "underline");
    const disabled = page.getByRole("button", { name: "Redo", exact: true });
    await expect(disabled).toBeDisabled();
    await disabled.hover();
    await expect(disabled).toHaveCSS("background-color", p.soft);
    await expect(disabled).toHaveCSS("color", p.ink);
    await expect(disabled).toHaveCSS("text-decoration-line", "none");
    await expect(disabled).toHaveCSS("opacity", "1");
    await expect(disabled).toHaveCSS("cursor", "not-allowed");
    const editor = page.getByRole("textbox", {
      name: "Visual post content",
      exact: true,
    });
    await expect(editor.locator(".editor-protected")).toHaveCSS(
      "background-color",
      p.soft,
    );
    await expect(editor.locator(".editor-protected")).toHaveCSS("color", p.ink);
    await editor.locator("td").click();
    const advanced = page.locator(".advanced-authoring");
    if ((await advanced.getAttribute("open")) === null)
      await advanced.locator(":scope > summary").click();
    await page
      .getByLabel("Table operation", { exact: true })
      .selectOption({ label: "Select table" });
    await page
      .getByRole("button", { name: "Apply table operation", exact: true })
      .click();
    await expect(editor.locator(".selectedCell")).toHaveCount(2);
    for (const cell of await editor.locator(".selectedCell").all()) {
      await expect(cell).toHaveCSS("background-color", p.inverse);
      await expect(cell).toHaveCSS("color", "rgb(255, 255, 255)");
      expect(contrast(p.inverse, "rgb(255, 255, 255)")).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    const category = page.locator(".reader-breadcrumb .board-context-link");
    await category.focus();
    await expect(category).toHaveCSS("outline-color", "rgb(0, 0, 0)");
    await expect(category).toHaveCSS("outline-width", "3px");
    expect(contrast("rgb(0, 0, 0)", p.anime)).toBeGreaterThanOrEqual(3);
    const navigationLink = page.locator(
      `.boards-navigation a[href="${boardURL(201)}"]`,
    );
    await navigationLink.focus();
    await expect(navigationLink).toHaveCSS("outline-color", p.ink);
    expect(
      contrast(
        await navigationLink.evaluate(
          (node) => getComputedStyle(node).outlineColor,
        ),
        p.surface,
      ),
    ).toBeGreaterThanOrEqual(3);
    await ordinary.focus();
    await expect(ordinary).toHaveCSS("outline-color", p.ink);
    await openSettings(page);
    const radio = page.locator(`input[type=radio][value="${name}"]`);
    await expect(radio).toHaveCSS("accent-color", p.ink);
    const range = page.getByRole("slider", { name: "Text size", exact: true });
    await expect(range).toHaveCSS("accent-color", p.ink);
    await info.attach(`controls-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await closeSettingsToWorkspace(page);
    expect(
      await page
        .locator(".workspace")
        .evaluate((n) => getComputedStyle(n).fontFamily),
    ).toBe(font);
    observations.push({
      name,
      selected: await colors(selected),
      disabled: await colors(disabled),
      font,
    });
  }
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + "\n[unknown]Protected original[/unknown]",
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("controls.json", {
    body: JSON.stringify({ observations, requests }),
    contentType: "application/json",
  });
});

async function boundary(locator: Locator) {
  return locator.evaluate((node) => {
    const s = getComputedStyle(node),
      r = node.getBoundingClientRect();
    return {
      border: s.borderWidth,
      shadow: s.boxShadow,
      z: s.zIndex,
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
    };
  });
}
test("UI91.boundaries: floating panes cards and docks replace decoration while flat post density fields menus and modal layers remain usable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 1000 });
  const requests = await open(page);
  const floating = "rgba(0, 0, 0, 0.06) 0px 4px 16px 0px";
  const directional = "rgba(0, 0, 0, 0.06) 4px 0px 16px 0px";
  await expect(page.locator(".workspace > header")).toHaveCSS(
    "border-bottom-width",
    "0px",
  );
  await expect(page.locator(".workspace > header")).toHaveCSS(
    "box-shadow",
    floating,
  );
  for (const selector of ["#boards-pane", "#thread-list-pane"]) {
    await expect(page.locator(selector)).toHaveCSS("border-right-width", "0px");
    await expect(page.locator(selector)).toHaveCSS("box-shadow", directional);
  }
  await expect(page.locator(".reading-pane > article")).toHaveCSS(
    "border-bottom-width",
    "0px",
  );
  await expect(page.locator(".reading-pane > article")).toHaveCSS(
    "box-shadow",
    "none",
  );
  await expect(page.locator(".reading-pane > article")).toHaveCSS(
    "padding-top",
    "24px",
  );
  await page
    .locator(".boards-navigation")
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  const card = page.locator(".overview .board-card").first();
  await expect(card).toHaveCSS("border-width", "0px");
  await expect(card).toHaveCSS("box-shadow", floating);
  await card.hover();
  await expect(card).toHaveCSS("background-color", palettes.light.anime);
  await expect(card.locator("strong")).toHaveCSS(
    "text-decoration-line",
    "underline",
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page.getByLabel("Complete source", { exact: true }).fill(original);
  await expect(page.locator(".source-writing")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  await expect(page.locator(".source-writing")).toHaveCSS(
    "box-shadow",
    "rgba(0, 0, 0, 0.06) 0px -4px 16px 0px",
  );
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveCSS(
    "border-width",
    "1px",
  );
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await expect(page.locator(".source-writing")).toHaveCSS(
    "box-shadow",
    "rgba(0, 0, 0, 0.06) -4px 0px 16px 0px",
  );
  const more = page.getByRole("button", {
    name: "More thread options",
    exact: true,
  });
  await more.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("box-shadow", floating);
  const hit = await menu.evaluate((node) => {
    const r = node.getBoundingClientRect(),
      root = node.getRootNode() as ShadowRoot;
    return {
      rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      hits: [
        root.elementFromPoint(r.left + 3, r.top + 3),
        root.elementFromPoint(r.right - 3, r.bottom - 3),
      ].map((hit) => !!hit && node.contains(hit)),
    };
  });
  expect(hit.hits).toEqual([true, true]);
  expect(hit.rect.left).toBeGreaterThanOrEqual(0);
  expect(hit.rect.right).toBeLessThanOrEqual(1706);
  await info.attach("menu-layer.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openSettings(page);
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog).toHaveCSS(
    "box-shadow",
    "rgba(0, 0, 0, 0.24) 0px 16px 48px 0px",
  );
  await expect(page.locator('.dialog-overlay[data-state="open"]')).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0.6)",
  );
  const layer = await dialog.evaluate((node) => {
    const root = node.getRootNode() as ShadowRoot,
      d = node.getBoundingClientRect();
    return [...root.querySelectorAll(".column-separator")].map((separator) => {
      const s = separator.getBoundingClientRect(),
        x = s.left + s.width / 2,
        y = Math.max(d.top, s.top) + 24;
      const target = root.elementFromPoint(x, y);
      return {
        x,
        y,
        overlap: x > d.left && x < d.right,
        dialogOwns: !!target && node.contains(target),
      };
    });
  });
  expect(layer.filter((hit) => hit.overlap).length).toBeGreaterThan(0);
  for (const hit of layer.filter((hit) => hit.overlap))
    expect(hit.dialogOwns).toBe(true);
  await page.getByRole("slider", { name: "Text size", exact: true }).fill("90");
  await closeSettingsToWorkspace(page);
  await expect(page.locator(".reading-pane > article")).toHaveCSS(
    "padding-top",
    "16px",
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("boundaries.json", {
    body: JSON.stringify({
      header: await boundary(page.locator(".workspace > header")),
      writer: await boundary(page.locator(".source-writing")),
      hit,
      layer,
      requests,
    }),
    contentType: "application/json",
  });
});

test("UI91.dark-forced: minimal boundaries and visible focus survive shadow loss in Dark and forced colors with contained narrow menus", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1706, height: 900 });
  const requests = await open(page);
  await theme(page, "dark");
  await expect(page.locator("#thread-list-pane")).toHaveCSS(
    "border-right-width",
    "1px",
  );
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  const menu = page.getByRole("menu");
  await expect(menu).toHaveCSS("border-width", "1px");
  await expect(menu).toHaveCSS("border-color", "rgb(233, 233, 233)");
  await page.keyboard.press("ArrowDown");
  await expect(menu.locator("[data-highlighted]")).toHaveCSS(
    "outline-color",
    "rgb(255, 255, 255)",
  );
  await info.attach("dark-menu.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.keyboard.press("Escape");
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 375, height: 600 });
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("border-width", "1px");
  const observations = await boundary(menu);
  expect(observations.left).toBeGreaterThanOrEqual(0);
  expect(observations.right).toBeLessThanOrEqual(375);
  expect(observations.bottom).toBeLessThanOrEqual(600);
  await info.attach("forced-menu.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.keyboard.press("Escape");
  await openSettings(page);
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog).toHaveCSS("border-width", "1px");
  await expect(page.locator(".pane-drawer")).toHaveCSS("border-width", "1px");
  const radio = dialog.getByRole("radio", { name: "Light", exact: true });
  await radio.focus();
  await expect(radio).toHaveCSS("outline-width", "3px");
  await info.attach("forced-dialog.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("forced-boundaries.json", {
    body: JSON.stringify({
      observations,
      dialog: await boundary(dialog),
      requests,
    }),
    contentType: "application/json",
  });
  expect(requests.every((r) => r.method === "GET")).toBe(true);
});

test("UI91.selected-thread: the selected thread action remains monochrome on hover with readable metadata and keyboard focus in every theme", async ({
  page,
}, info) => {
  const requests = await open(page);
  const observations = [];
  for (const [name, p] of Object.entries(palettes)) {
    await theme(page, name);
    const row = page
      .locator(".thread-row")
      .filter({ has: page.locator('[aria-current="true"]') });
    const subject = row.locator(".subject");
    await subject.hover();
    await expect(row).toHaveCSS("background-color", p.ink);
    await expect(row).toHaveCSS("color", p.surface);
    await expect(subject).toHaveCSS("text-decoration-line", "underline");
    await expect(row.locator("span").last()).toHaveCSS("color", p.surface);
    await subject.focus();
    await expect(subject).toHaveCSS("outline-color", p.surface);
    expect(contrast(p.ink, p.surface)).toBe(21);
    observations.push({ name, row: await colors(row) });
    await info.attach(`selected-thread-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await info.attach("selected-thread.json", {
    body: JSON.stringify({ observations, requests }),
    contentType: "application/json",
  });
});
