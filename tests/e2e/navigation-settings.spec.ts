import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const otherURL = `${origin}/forum.php?mod=forumdisplay&fid=6`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文</a></strong></div>';
const directory = `${account}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table><tr>${Array.from({ length: 30 }, (_, i) => `<td><h2><a href="${origin}/forum.php?mod=forumdisplay&fid=${5 + i}">Board ${i} complete 音樂</a></h2></td>`).join("")}</tr></table></div>`;
function board(other = false) {
  return `${account}<div id="ct"><h1><a href="${other ? otherURL : boardURL}">${other ? "Animation discussion" : "Music discussion"}</a></h1></div><div id="thread_types"><a href="${boardURL}&filter=typeid&typeid=3">Listening notes</a></div><table id="threadlisttableid">${other ? '<tr><td class="emp">No threads</td></tr>' : ""}${Array.from({ length: other ? 0 : 30 }, (_, i) => `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Complete listening title ${i} 音樂</a></th><td class="by"><cite>LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文LongMemberName混合繁體中文</cite></td></tr></tbody>`).join("")}</table>`;
}
function thread(id: string, nativeBody = false) {
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1>${Array.from({ length: 12 }, (_, i) => `<div id="post_${100 + i}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${100 + i}">${i + 1}</a><div class="pcb">${nativeBody ? `<div>Reading contribution ${i} 保持活躍閱讀。<br>Another visible line ${i}。</div>` : `<p>${`Complete rich reading ${i} 音樂。 `.repeat(70)}</p>`}</div></div>`).join("")}</div>`;
}
const ledgers = new WeakMap<Page, string[]>();
async function open(
  page: Page,
  url = boardURL,
  nativeBody = false,
  identity: "member" | "guest" | "unknown" = "member",
) {
  const ledger: string[] = [];
  ledgers.set(page, ledger);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      parsed = new URL(request.url());
    if (parsed.pathname === "/__ui83.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__ui83.js"></script></body></html>`,
      });
    ledger.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document: (parsed.searchParams.get("mod") === "post" &&
        parsed.searchParams.get("action") === "newthread"
          ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input name="formhash" value="SYNTHETIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="topicsubmit">Publish</button></form>`
          : parsed.searchParams.get("mod") === "post"
            ? `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit">Reply</button></form>`
            : parsed.searchParams.get("mod") === "viewthread"
              ? thread(parsed.searchParams.get("tid")!, nativeBody)
              : parsed.searchParams.get("mod") === "forumdisplay"
                ? board(parsed.searchParams.get("fid") === "6")
                : directory
        ).replaceAll(
          account,
          identity === "member"
            ? account
            : identity === "guest"
              ? '<form id="lsform"></form>'
              : "",
        ),
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

test("UI83.footer: account and Settings remain reachable beside independently scrolling navigation", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        language: "en",
        textSize: 150,
        theme: "light",
      }),
    ),
  );
  await open(page, `${origin}/forum.php`);
  const frames = [];
  for (const size of [
    { width: 1280, height: 600 },
    { width: 960, height: 420 },
    { width: 375, height: 420 },
    { width: 320, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.locator(".workspace")).toHaveCSS(
      "height",
      `${size.height}px`,
    );
    if (size.width < 960)
      await page
        .getByRole("button", { name: "Boards pane", exact: true })
        .click();
    const footer = page.locator(".navigation-footer");
    const body = page.locator(".navigation-body");
    const trigger = footer.getByRole("button", {
      name: "Settings",
      exact: true,
    });
    await expect(footer).toBeVisible();
    await expect(trigger).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Settings", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "About this workspace", exact: true }),
    ).toHaveCount(0);
    const before = await footer.boundingBox();
    await body.evaluate((node) => (node.scrollTop = node.scrollHeight));
    const last = body.getByRole("link", {
      name: "Board 29 complete 音樂",
      exact: true,
    });
    await expect(last).toBeInViewport();
    const after = await footer.boundingBox();
    expect(after).toEqual(before);
    const target = (await trigger.boundingBox())!;
    const accountRect = (await footer
      .locator(".navigation-account")
      .boundingBox())!;
    const bodyRect = (await body.boundingBox())!;
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.x).toBeGreaterThanOrEqual(accountRect.x + accountRect.width);
    expect(target.y + target.height).toBeLessThanOrEqual(size.height);
    expect(bodyRect.height).toBeGreaterThan(44);
    expect(bodyRect.y + bodyRect.height).toBeLessThanOrEqual(after!.y);
    expect(
      await page
        .locator(".workspace")
        .evaluate((n) => n.scrollWidth <= n.clientWidth),
    ).toBe(true);
    frames.push({ size, before, after, target, accountRect, bodyRect });
    await info.attach(`footer-${size.width}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    if (size.width < 960) await page.keyboard.press("Escape");
  }
  await info.attach("footer-scroll.json", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
});

test("UI83.dialog: collapsed Boards opens one Settings dialog with About and returns keyboard focus to navigation", async ({
  page,
}, info) => {
  await open(page, `${origin}/forum.php`);
  const boards = page.getByRole("button", { name: "Boards pane", exact: true });
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await boards.click();
  await expect(settings).toBeHidden();
  await boards.click();
  await expect(settings).toBeVisible();
  await page.setViewportSize({ width: 375, height: 600 });
  await boards.click();
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  const body = page.locator(".navigation-body");
  await body.evaluate((n) => (n.scrollTop = n.scrollHeight));
  const scroll = await body.evaluate((n) => n.scrollTop);
  await settings.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(
    dialog.getByRole("heading", { name: "About this workspace", exact: true }),
  ).toBeVisible();
  for (const key of ["Tab", "Shift+Tab"])
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press(key);
      expect(
        await dialog.evaluate((n) =>
          n.contains((n.getRootNode() as ShadowRoot).activeElement),
        ),
      ).toBe(true);
    }
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(drawer).toBeVisible();
  await expect(settings).toBeFocused();
  expect(await body.evaluate((n) => n.scrollTop)).toBe(scroll);
  await settings.click();
  await expect(
    page.getByRole("radio", { name: "Dark", exact: true }),
  ).toBeChecked();
  await page.setViewportSize({ width: 1280, height: 600 });
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "false",
  );
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(settings).toBeFocused();
  await expect(page.locator("#boards-pane")).toBeVisible();
  await settings.click();
  await page.setViewportSize({ width: 375, height: 600 });
  await expect(page.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await expect(settings).toBeFocused();
  await info.attach("restored-navigation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const kind of ["member", "guest", "unknown"] as const) {
  test(`UI83.account-${kind}: footer distinguishes fresh and restored account observations`, async ({
    page,
  }, info) => {
    const ledger = await open(page, threadURL, false, kind);
    const label = page.locator(".navigation-account");
    await expect(label).toHaveText(
      kind === "member"
        ? `Signed in as ${"LongMemberName混合繁體中文".repeat(6)}`
        : kind === "guest"
          ? "Browsing as a guest"
          : "Account not yet confirmed",
    );
    const fresh = await label.textContent();
    const requests = ledger.length;
    await page.reload();
    await expect(label).toHaveText(
      kind === "member"
        ? `Snapshot from ${"LongMemberName混合繁體中文".repeat(6)}`
        : kind === "guest"
          ? "Snapshot from guest browsing"
          : "Account not yet confirmed",
    );
    expect(ledger).toHaveLength(requests);
    await info.attach("account-observations.json", {
      body: JSON.stringify({
        kind,
        fresh,
        restored: await label.textContent(),
        requests: ledger,
      }),
      contentType: "application/json",
    });
  });
}

test("UI83.retention: Settings preserves reader, addressed source selection and undo through composition and dismissal", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 844 });
  const ledger = await open(page, threadURL);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Original addressed source 中文");
  await source.press("End");
  await page.keyboard.insertText(" preserved undo");
  const original = await source.elementHandle();
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(3, 10, "backward"),
  );
  const reader = page.locator(".reading-pane");
  await reader.evaluate((n) => (n.scrollTop = 500));
  const before = await reader.evaluate((n) => n.scrollTop);
  const requestCount = ledger.length;
  await source.dispatchEvent("compositionstart", { data: "輸入" });
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await source.dispatchEvent("compositionend", { data: "輸入" });
  const drawer = page.getByRole("dialog", {
    name: "Boards navigation",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("slider", { name: "Text size", exact: true }),
  ).toBeFocused();
  // A primary press outside the sole Settings modal dismisses it.
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
  expect(
    await source.evaluate((n: HTMLTextAreaElement) => ({
      start: n.selectionStart,
      end: n.selectionEnd,
      direction: n.selectionDirection,
    })),
  ).toEqual({ start: 3, end: 10, direction: "backward" });
  await expect(source).toHaveValue(
    "Original addressed source 中文 preserved undo",
  );
  expect(await reader.evaluate((n) => n.scrollTop)).toBe(before);
  await source.focus();
  await source.press("ControlOrMeta+z");
  await expect(source).toHaveValue("Original addressed source 中文");
  expect(ledger).toHaveLength(requestCount);
  await info.attach("retained-writing.json", {
    body: JSON.stringify({
      source: await source.inputValue(),
      readerScroll: before,
      requests: ledger,
    }),
    contentType: "application/json",
  });
});

test("UI83.dismissal: only a completed primary overlay press dismisses Settings", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(
    dialog.getByRole("slider", { name: "Text size", exact: true }),
  ).toBeFocused();
  await page.mouse.click(2, 2, { button: "right" });
  await expect(dialog).toBeVisible();
  await page.mouse.move(2, 2);
  await page.mouse.down();
  await page
    .locator('.dialog-overlay[data-state="open"]')
    .dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
});
