import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const actor =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const board = `${actor}<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
const form = `${actor}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC-KEYBOARD-TOKEN"><input name="subject" value="Native title"><select name="typeid"><option value="0">No category</option><option value="3">Listening</option></select><textarea name="message"></textarea><label>Thread price<input name="price" value="0"></label><label>Read permission<select name="readperm"><option value="0">Everyone</option><option value="10">Members</option></select></label><button type="submit" name="topicsubmit" value="true">Publish</button></form>`;

async function open(page: Page, native = false) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const requests: { method: string; url: string; document: boolean }[] = [];
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({
      method: request.method(),
      url: url.href,
      document: request.isNavigationRequest(),
    });
    if (url.pathname === "/__keyboard.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest()) {
      const current = Number(url.searchParams.get("page") ?? 1);
      const destination = `${boardURL}${url.searchParams.has("tsdm-native") ? "&tsdm-native=1" : ""}`;
      // Authored from the observed native handler: target.tagName guard,
      // legacy keyCode, document.onkeyup and a real window.location write.
      // No app, keyboard, navigation or storage implementation is replaced.
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body onkeydown="if(event.keyCode==27) return false;"><main><button id="native-focus">Native focus target</button><label>Native source<textarea id="native-source">Native text</textarea></label><label>Native language<select id="native-language"><option value="en">English</option><option value="zh-CN">简体中文</option><option value="zh-TW">繁體中文</option></select></label></main><script>
function keyPageScroll(e, prev, next, url, page) {
  e = e ? e : window.event;
  var tagname = e.target.tagName;
  if(tagname == 'INPUT' || tagname == 'TEXTAREA') return;
  var actualCode = e.keyCode ? e.keyCode : e.charCode;
  if(next && actualCode == 39) window.location = url + '&page=' + (page + 1);
  if(prev && actualCode == 37) window.location = url + '&page=' + (page - 1);
}
document.onkeyup = function(e) { keyPageScroll(e, ${current > 1 ? 1 : 0}, 1, '${destination}', ${current}); };
</script>${url.searchParams.has("tsdm-native") ? "" : `<script src="${origin}/__keyboard.js"></script>`}</body></html>`,
      });
    }
    if (request.method() !== "GET") return route.abort("blockedbyclient");
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        document: url.searchParams.get("mod") === "post" ? form : board,
      }),
    });
  });
  await page.goto(`${boardURL}${native ? "&tsdm-native=1" : ""}`);
  if (!native) await expect(page.locator(".thread-row")).toHaveCount(1);
  return requests;
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
}

async function evidence(
  page: Page,
  info: TestInfo,
  requests: Awaited<ReturnType<typeof open>>,
) {
  await info.attach("native-keyboard-requests.json", {
    body: Buffer.from(JSON.stringify(requests, null, 2)),
    contentType: "application/json",
  });
  await info.attach("native-keyboard.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}

test("J1.native-page-key-range: native range keys keep modal focus and do not navigate the board", async ({
  page,
}, info) => {
  const requests = await open(page);
  try {
    const trigger = page.getByRole("button", { name: "Settings", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
    const slider = dialog.getByRole("slider", {
      name: "Text size",
      exact: true,
    });
    const before = page.url();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    await expect(slider).toHaveValue("110");
    await expect(slider).toBeFocused();
    await expect(dialog).toBeVisible();
    expect(page.url()).toBe(before);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("tsdm.workspace.preferences")!),
      ),
    ).toMatchObject({ textSize: 110 });
    await page.keyboard.press("ArrowLeft");
    await settle(page);
    await expect(slider).toHaveValue("100");
    await expect(slider).toBeFocused();
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await evidence(page, info, requests);
  }
});

test("J1.native-page-key-source: caret keys preserve writing, focus and acknowledged recovery without paging", async ({
  page,
}, info) => {
  const requests = await open(page);
  try {
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const title = page.getByLabel("Title", { exact: true });
    const source = page.getByLabel("Complete source", { exact: true });
    await title.fill("Keyboard writing");
    await source.fill("[b]literal source[/b]");
    await page.getByLabel("Category", { exact: true }).selectOption("3");
    await page.getByLabel("Thread price", { exact: true }).fill("2");
    await page
      .getByLabel("Read permission", { exact: true })
      .selectOption("10");
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
      )
      .toContain("[b]literal source[/b]");
    const { revision: beforeRevision, ...recovery } = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    const before = page.url();
    await source.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await settle(page);
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    await expect(source).toBeFocused();
    expect(
      await source.evaluate((node: HTMLTextAreaElement) => node.selectionStart),
    ).toBe(21);
    await expect(source).toHaveValue("[b]literal source[/b]");
    await expect(title).toHaveValue("Keyboard writing");
    expect(page.url()).toBe(before);
    const { revision: afterRevision, ...after } = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(after).toEqual(recovery);
    expect(afterRevision).toBeGreaterThan(beforeRevision);
    await page.reload();
    await expect(source).toHaveValue("[b]literal source[/b]");
    await expect(title).toHaveValue("Keyboard writing");
    await expect(page.getByLabel("Category", { exact: true })).toHaveValue("3");
    await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
      "2",
    );
    await expect(
      page.getByLabel("Read permission", { exact: true }),
    ).toHaveValue("10");
    expect(requests.filter((r) => r.document)).toHaveLength(2);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await evidence(page, info, requests);
  }
});

test("J1.native-page-key-controls: theme arrows, language focus and Escape retain native controls without paging", async ({
  page,
}, info) => {
  const requests = await open(page);
  try {
    const trigger = page.getByRole("button", { name: "Settings", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
    await dialog.getByRole("radio", { name: "Light", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    await expect(
      dialog.getByRole("radio", { name: "Alias", exact: true }),
    ).toBeChecked();
    await expect(
      dialog.getByRole("radio", { name: "Alias", exact: true }),
    ).toBeFocused();
    const language = page.locator("#interface-language");
    // Native popup keyboard selection is a separate installed check: the
    // same ArrowDown/Enter script fails even on a page with no userscript.
    await language.selectOption("zh-CN");
    await language.focus();
    await expect(language).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    await expect(language).toHaveValue("zh-CN");
    await expect(language).toBeFocused();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "设置", exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("tsdm.workspace.preferences")!),
      ),
    ).toMatchObject({ theme: "alias", language: "zh-CN" });
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await evidence(page, info, requests);
  }
});

test("J1.native-page-key-continuation: native continuation keeps input guard and real page-key navigation", async ({
  page,
}, info) => {
  const requests = await open(page, true);
  try {
    await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
    await page
      .getByRole("textbox", { name: "Native source", exact: true })
      .focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    expect(requests.filter((r) => r.document)).toHaveLength(1);
    await page
      .getByRole("button", { name: "Native focus target", exact: true })
      .focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForURL(/page=2/, { timeout: 3000 });
    await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
    expect(requests.filter((r) => r.document)).toHaveLength(2);
    await page
      .getByRole("button", { name: "Native focus target", exact: true })
      .focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForURL(/page=1/);
    expect(requests.filter((r) => r.document)).toHaveLength(3);
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await evidence(page, info, requests);
  }
});
