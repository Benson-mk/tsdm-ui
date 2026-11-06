import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { readableLines, expectPreservedReadingLine } from "./readable-lines";
import { clickThreadTool } from "./navigation-ui";
const origin = "https://www.tsdm39.com";
const base = `${origin}/forum.php?mod=viewthread&tid=42`;
const title =
  "Long 中文主題 title with complete accessible context and a deliberately extended Latin ending";
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
function documentFor(url: URL) {
  if (url.searchParams.get("mod") === "post")
    return `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;
  if (url.searchParams.get("do") === "favorite")
    return `${account}<div id="ct"><p class="emp">您还没有添加任何收藏</p></div>`;
  if (url.searchParams.get("mod") === "forumdisplay")
    return `${account}<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${base}&page=1">${title}</a></th></tr></tbody></table>`;
  const n = url.searchParams.get("page") ?? "1";
  const context = `${url.searchParams.get("ordertype") === "1" ? "&ordertype=1" : ""}${url.searchParams.has("authorid") ? "&authorid=9" : ""}`;
  return `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></div><div id="p_btn"><a id="k_favorite" href="home.php?mod=spacecp&ac=favorite&type=thread&id=42&formhash=SYNTHETIC_PUBLIC_TOKEN">收藏</a></div><div id="postlist"><h1 id="thread_subject">${title}</h1>${Array.from({ length: 8 }, (_, i) => `<div id="post_${Number(n) * 100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Reader Nine</a></div><a id="postnum${Number(n) * 100 + i}" href="${base}&page=${n}${context}#pid${Number(n) * 100 + i}">${i + 1}</a><div class="pcb"><p>${`Visible post line ${i} 中文. `.repeat(70)}</p></div></div>`).join("")}</div><div id="postlist_filters"><a href="${base}&page=1&ordertype=${context.includes("ordertype=1") ? "0" : "1"}">Reverse source order</a><a href="${base}&page=1&authorid=9">Only Reader Nine</a></div><div class="pg"><strong>${n}</strong><a href="${base}&page=${n === "1" ? "2" : "1"}${context}&_dsign=source-token">${n === "1" ? "2" : "1"}</a></div>`;
}
async function open(
  page: Page,
  destination = base + "&page=1",
  denyClipboard = false,
  nativeEscape = false,
  rich = false,
  transform: (html: string, url: URL) => string = (html) => html,
) {
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__ui85.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        headers: denyClipboard
          ? { "Permissions-Policy": "clipboard-write=()" }
          : {},
        body: `<html><body>Native${nativeEscape ? '<script>document.addEventListener("keydown",e=>{if(e.key==="Escape")e.preventDefault()},true)</script>' : ""}<script src="${origin}/__ui85.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document: transform(
          rich
            ? documentFor(url).replace(
                /<div class="pcb"><p>[\s\S]*?<\/p>/,
                '<div class="pcb"><div>' +
                  Array.from(
                    { length: 120 },
                    (_, i) =>
                      `<span> \nUnique native line ${i} 中文 </span><br>`,
                  ).join("") +
                  "<p>Late paragraph</p>",
              )
            : documentFor(url),
          url,
        ),
      }),
    });
  });
  await page.goto(destination);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return requests;
}
async function artifact(page: Page, info: TestInfo, requests: string[]) {
  await info.attach("thread-tools.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
  await info.attach("geometry.json", {
    body: JSON.stringify(
      await page.locator(".conversation-region").evaluate((root) =>
        [...root.querySelectorAll("h1,button,.reading-pane")].map((e) => ({
          text: e.textContent,
          rect: e.getBoundingClientRect().toJSON(),
        })),
      ),
    ),
    contentType: "application/json",
  });
}
async function frames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
}
test("UI85.heading: persistent full and compact title preserve accessible context and actual post anchor without oscillation", async ({
  page,
}, info) => {
  const requests = await open(page);
  const heading = page.getByRole("heading", { name: title, exact: true });
  await expect(heading).toHaveAttribute("title", title);
  await expect(page.getByRole("button", { name: /^Page 1/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "More thread options" }),
  ).toBeVisible();
  expect(
    await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBe(26);
  const pane = page.getByRole("region", {
    name: "Thread reading",
    exact: true,
  });
  for (const [scroll, expected] of [
    [32, 26],
    [33, 16],
    [8, 16],
    [7, 26],
  ] as const) {
    await pane.evaluate((e, top) => {
      e.scrollTop = top;
    }, scroll);
    await frames(page);
    expect(
      await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBe(expected);
    expect(await pane.evaluate((e) => e.scrollTop)).toBe(scroll);
  }
  const before = await pane.evaluate((e) => {
    e.scrollTop = 240;
    const bounds = e.getBoundingClientRect();
    const text = e.querySelector(".post-content p")!.firstChild!;
    const range = document.createRange();
    for (let i = 0; i < text.textContent!.length; i++) {
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const r = range.getBoundingClientRect();
      if (r.top >= bounds.top + 1 && r.bottom <= bounds.bottom)
        return {
          offset: i,
          top: r.top,
          bottom: r.bottom,
          paneTop: bounds.top,
          paneBottom: bounds.bottom,
        };
    }
    throw new Error("No genuinely visible text anchor");
  });
  await frames(page);
  expect(
    await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBe(16);
  const after = await pane.evaluate((e, offset) => {
    const text = e.querySelector(".post-content p")!.firstChild!;
    const r = document.createRange();
    r.setStart(text, offset);
    r.setEnd(text, offset + 1);
    return r.getBoundingClientRect().top;
  }, before.offset);
  expect(Math.abs(after - before.top)).toBeLessThan(1);
  await info.attach("visible-anchor.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  await page.waitForTimeout(150);
  expect(
    await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBe(16);
  await pane.evaluate((e) => (e.scrollTop = 15));
  await frames(page);
  expect(
    await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBe(16);
  await pane.evaluate((e) => (e.scrollTop = 0));
  await frames(page);
  expect(
    await heading.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBe(26);
  await expect(heading).toHaveAttribute("title", title);
  expect(requests).toHaveLength(1);
  await artifact(page, info, requests);
});
test("UI85.reader-width: entire active order and Page More row wraps in a manually constrained reader with full targets", async ({
  page,
}, info) => {
  const requests = await open(page, base + "&page=1&ordertype=1");
  const region = page.locator(".conversation-region");
  // A container-width experiment anticipates #88 without replacing application logic.
  await region.evaluate((e) => {
    e.style.width = "320px";
    e.style.flex = "0 0 320px";
  });
  await frames(page);
  const controls = page.getByRole("group", { name: "Page and thread options" });
  await expect(
    controls.getByText("Newest first", { exact: true }),
  ).toBeVisible();
  const geometry = await controls.evaluate((e) => ({
    group: e.getBoundingClientRect().toJSON(),
    children: [...e.children].map((c) => c.getBoundingClientRect().toJSON()),
  }));
  expect(
    geometry.children.every(
      (r) =>
        Math.abs(
          r.top +
            r.height / 2 -
            (geometry.group.top + geometry.group.height / 2),
        ) < 1,
    ),
  ).toBe(true);
  for (const button of await controls.getByRole("button").all()) {
    const b = await button.boundingBox();
    expect(b!.height).toBeGreaterThanOrEqual(44);
    expect(b!.width).toBeGreaterThanOrEqual(44);
  }
  const h = await region.locator("h1").boundingBox();
  expect(geometry.group.top).toBeGreaterThanOrEqual(h!.y + h!.height);
  await artifact(page, info, requests);
});
for (const width of [375, 820])
  test(`UI85.natural-width-${width}: natural pane geometry keeps the complete controls usable`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    const requests = await open(page, base + "&page=1&ordertype=1");
    const controls = page.getByRole("group", {
      name: "Page and thread options",
    });
    const region = await page.locator(".conversation-region").boundingBox();
    const row = await controls.boundingBox();
    expect(row!.x).toBeGreaterThanOrEqual(region!.x);
    expect(row!.x + row!.width).toBeLessThanOrEqual(region!.x + region!.width);
    await expect(
      controls.getByText("Newest first", { exact: true }),
    ).toBeVisible();
    for (const button of await controls.getByRole("button").all()) {
      const b = await button.boundingBox();
      expect(b!.height).toBeGreaterThanOrEqual(44);
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.y + b!.height / 2).toBeCloseTo(row!.y + row!.height / 2, 0);
    }
    await artifact(page, info, requests);
  });
test("UI85.page: Page exposes only supported returned targets and keeps page and filter context", async ({
  page,
}, info) => {
  const requests = await open(page, base + "&page=1&authorid=9&ordertype=1");
  await page.getByRole("button", { name: /^Page 1/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByText("Supported navigation", { exact: true }).click();
  await expect(
    dialog.getByRole("link", { name: "2", exact: true }),
  ).toHaveAttribute(
    "href",
    base + "&page=2&ordertype=1&authorid=9&_dsign=source-token",
  );
  await dialog.getByRole("link", { name: "2", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /^Page 2/ })).toBeVisible();
  expect(requests.at(-1)).toContain("authorid=9");
  expect(requests.at(-1)).toContain("ordertype=1");
  await artifact(page, info, requests);
});
test("UI85.more: keyboard dismissal returns focus and short menu actions target retained reader beside another board", async ({
  page,
}, info) => {
  const requests = await open(page);
  const more = page.getByRole("button", { name: "More thread options" });
  await more.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "Thread options" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  await more.click();
  await page.getByRole("heading", { name: title, exact: true }).click();
  await expect(menu).toBeHidden();
  await page
    .locator(".conversation-heading")
    .getByRole("link", { name: "Board Five", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Thread results" }),
  ).toContainText("Board Five");
  await more.click();
  await menu
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  await expect.poll(() => requests.length).toBeGreaterThan(2);
  expect(requests.at(-1)).toContain("tid=42");
  await page.setViewportSize({ width: 375, height: 420 });
  await frames(page);
  if (!(await more.isVisible()))
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
  await more.click();
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(420);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await artifact(page, info, requests);
});
for (const denied of [false, true])
  test(`UI85.copy-${denied ? "denied" : "success"}: canonical current context excludes workspace keys credentials and referrals with truthful browser clipboard outcome`, async ({
    page,
  }, info) => {
    if (!denied)
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
    const requests = await open(
      page,
      base + "&page=2&ordertype=1&authorid=9&_dsign=secret",
      denied,
    );
    await page.getByRole("button", { name: "More thread options" }).click();
    await page.getByRole("menuitem", { name: "Copy URL", exact: true }).click();
    const expected = base + "&page=2&ordertype=1&authorid=9";
    if (denied) {
      await expect(
        page.getByRole("textbox", { name: "Thread URL", exact: true }),
      ).toHaveValue(expected);
      await expect(page.getByText("URL copied", { exact: true })).toHaveCount(
        0,
      );
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "More thread options" }),
      ).toBeFocused();
    } else {
      await expect(
        page.getByRole("status").filter({ hasText: "URL copied" }),
      ).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        expected,
      );
    }
    await artifact(page, info, requests);
  });

test("UI85.save: More prepares the retained thread favorite beside another board without sending it", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page
    .locator(".conversation-heading")
    .getByRole("link", { name: "Board Five", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Thread results" }),
  ).toContainText("Board Five");
  await page.getByRole("button", { name: "More thread options" }).click();
  await page
    .getByRole("menuitem", { name: "Save thread", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm favorite action", exact: true }),
  ).toBeVisible();
  expect(requests.at(-1)).toContain("tid=42");
  expect(requests.some((r) => r.includes("ac=favorite"))).toBe(false);
  await artifact(page, info, requests);
});

test("UI85.native-escape: native document handling cannot strand Page or More and focus returns to each trigger", async ({
  page,
}, info) => {
  const requests = await open(page, base + "&page=1", false, true);
  const more = page.getByRole("button", {
    name: "More thread options",
    exact: true,
  });
  await more.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Thread options" })).toBeHidden();
  await expect(more).toBeFocused();
  const pager = page.getByRole("button", { name: "Page 1", exact: true });
  await pager.click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Thread pages", exact: true }),
  ).toBeHidden();
  await expect(pager).toBeFocused();
  await artifact(page, info, requests);
});
test("UI85.back: retained reader owns the reachable history action without a duplicate in board tools", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page
    .locator(".conversation-heading")
    .getByRole("link", { name: "Board Five", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Thread results" }),
  ).toContainText("Board Five");
  await expect(
    page
      .locator("#boards-pane")
      .getByRole("button", { name: "Back", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Back in history", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "More thread options", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  await artifact(page, info, requests);
});

test("UI85.guards: More same-thread order and history navigation preserve retained source without sending", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retained 中文 source [b]exact[/b]");
  const before = await source.inputValue();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.getByRole("button", { name: "More thread options" }).click();
  await page
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(3);
  await page.getByRole("button", { name: "More thread options" }).click();
  await page
    .getByRole("menuitem", { name: "Reverse source order", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(4);
  await expect(
    page.getByRole("button", {
      name: "Keep writing and read thread",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByText("Newest first", { exact: true })).toBeVisible();
  await expect(source).toHaveValue(before);
  await page.getByRole("button", { name: "More thread options" }).click();
  await page
    .getByRole("menuitem", { name: "Back in history", exact: true })
    .click();
  await expect(source).toHaveValue(before);
  expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
  await artifact(page, info, requests);
});

for (const rich of [false, true])
  test(`UI85.resize-compact-${rich ? "inline" : "paragraph"}: a retained writer and narrower shorter viewport keep actual post text visible after compaction`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1119, height: 629 });
    const requests = await open(page, base + "&page=1", false, false, rich);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    const pane = page.locator(".reading-pane");
    await pane.evaluate((e) => {
      e.scrollTop = 33;
    });
    await frames(page);
    const measure = () =>
      pane.evaluate((e) => {
        const bounds = e.getBoundingClientRect();
        const visible = [];
        const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        let text;
        while ((text = walker.nextNode())) {
          if (!text.parentElement?.closest(".post-content")) continue;
          const range = document.createRange();
          range.selectNodeContents(text);
          for (const rect of range.getClientRects())
            if (
              rect.width > 0 &&
              rect.top >= bounds.top &&
              rect.bottom <= bounds.bottom
            )
              visible.push({ ...rect.toJSON(), text: text.textContent });
        }
        return { pane: bounds.toJSON(), scroll: e.scrollTop, visible };
      });
    await pane.evaluate((e) => {
      e.scrollTop = 34;
    });
    await frames(page);
    await pane.evaluate((e) => {
      e.scrollTop = 33;
    });
    await frames(page);
    const before = await measure();
    expect(before.visible.length).toBeGreaterThan(0);
    await page.setViewportSize({ width: 375, height: 420 });
    await frames(page);
    const after = await measure();
    await info.attach("resize-lines.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    await artifact(page, info, requests);
    expect(after.visible.length).toBeGreaterThan(0);
    expect(after.visible[0]!.text).toBe(before.visible[0]!.text);
  });

for (const retainedBoard of [false, true])
  test(`UI85.cached-native-inline-${retainedBoard ? "board" : "direct"}: guarded cross-thread return at a narrower viewport preserves the same real first line and offset`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1119, height: 629 });
    const requests = await open(
      page,
      base + "&page=1",
      false,
      false,
      true,
      (html, url) => {
        if (url.searchParams.get("mod") === "forumdisplay")
          return html
            .replace(base + "&page=1", base.replace("42", "84") + "&page=1")
            .replace("normalthread_42", "normalthread_84")
            .replace(title, "Another source thread");
        if (url.searchParams.get("mod") !== "viewthread") return html;
        const changed = html
          .replaceAll("post_100", "post_77994675")
          .replaceAll("postnum100", "postnum77994675")
          .replaceAll("#pid100", "#pid77994675")
          .replace(
            '</a></div><a id="postnum77994675"',
            '</a></div><em id="authorposton77994675">发表于 2026-10-26 15:23:00</em><a id="postnum77994675"',
          )
          .replace(
            "Unique native line 0 中文",
            "本帖最后由 大和啦 于 2026-10-26 15:23 编辑",
          )
          .replace(
            "Unique native line 1 中文",
            '<a href="' + base.replace("42", "84") + '">Other thread</a>',
          );
        return url.searchParams.get("tid") === "84"
          ? changed
              .replace(title, "Another source thread")
              .replaceAll("post_77994675", "post_8400")
              .replaceAll("postnum77994675", "postnum8400")
          : changed;
      },
    );
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Unsent preserved source");
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    if (retainedBoard) {
      await page.locator(".reader-breadcrumb .board-context-link").click();
      await expect(page.locator(".results-pane .subject")).toBeVisible();
    }
    const pane = page.locator(".reading-pane");
    await pane.evaluate((e) => {
      e.scrollTop = 33;
    });
    await frames(page);
    await pane.evaluate((e) => {
      const span = e.querySelector(".post-content span")!;
      e.scrollTop +=
        span.getBoundingClientRect().top - e.getBoundingClientRect().top - 32;
    });
    await frames(page);
    const before = await readableLines(page, ".reading-pane", true);
    if (retainedBoard)
      await page
        .locator(".results-pane")
        .getByRole("link", { name: "Another source thread", exact: true })
        .click();
    else
      await pane
        .getByRole("link", { name: "Other thread", exact: true })
        .click();
    await page
      .getByRole("button", {
        name: "Keep writing and read thread",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Another source thread", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 500 });
    await clickThreadTool(page, "Back");
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    const after = await readableLines(page, ".reading-pane", true);
    await info.attach("native-cached-lines.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    await artifact(page, info, requests);
    expectPreservedReadingLine(before, after);
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Unsent preserved source");
    expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
  });

for (const revision of ["changed-text", "missing-post"]) {
  test(`UI85.character-fallback-${revision}: accepted revised content never selects matching text from another post`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1119, height: 629 });
    let changed = false;
    const requests = await open(
      page,
      base + "&page=1",
      false,
      false,
      true,
      (html) => {
        if (!changed) return html;
        const end = html.indexOf('<div id="post_107">');
        const duplicate =
          html.slice(0, end) +
          html
            .slice(end)
            .replace(
              '<div class="pcb">',
              '<div class="pcb"><span> \nUnique native line 0 中文 </span>',
            );
        return revision === "changed-text"
          ? duplicate.replace(
              "Unique native line 0 中文",
              "Changed accepted source revision",
            )
          : duplicate
              .replaceAll("post_100", "post_999")
              .replaceAll("postnum100", "postnum999")
              .replaceAll("#pid100", "#pid999");
      },
    );
    const pane = page.locator(".reading-pane");
    await pane.evaluate((e) => {
      e.scrollTop = 33;
    });
    await frames(page);
    await pane.evaluate((e) => {
      const span = e.querySelector(".post-content span")!;
      e.scrollTop +=
        span.getBoundingClientRect().top - e.getBoundingClientRect().top - 32;
    });
    await frames(page);
    const before = await readableLines(page, ".reading-pane", true);
    changed = true;
    await clickThreadTool(page, "Refresh thread");
    const expectedPost = revision === "missing-post" ? "pid999" : "pid100";
    await expect(page.locator("#" + expectedPost)).toBeVisible();
    if (revision === "changed-text")
      await expect(page.locator("#pid100")).toContainText(
        "Changed accepted source revision",
      );
    else await expect(page.locator("#pid100")).toHaveCount(0);
    const refreshed = await readableLines(page, ".reading-pane", true);
    expect(refreshed.first?.post).toBe(expectedPost);
    await page.setViewportSize({ width: 390, height: 500 });
    await frames(page);
    await page.reload();
    await expect(page.locator("#" + expectedPost)).toBeAttached();
    const reloaded = await readableLines(page, ".reading-pane", true);
    expect(reloaded.first?.post).toBe(expectedPost);
    await expect(page.locator("#pid107")).toContainText(
      "Unique native line 0 中文",
    );
    await info.attach("character-fallback.json", {
      body: JSON.stringify({ before, refreshed, reloaded }),
      contentType: "application/json",
    });
    await artifact(page, info, requests);
    expect(requests).toHaveLength(2);
    expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
  });
}
