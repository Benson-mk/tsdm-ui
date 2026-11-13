import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const firstURL = `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=101`;
const laterURL = `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=202`;
function document(first = "", later = "", duplicate = false) {
  return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board</a></div><div id="postlist"><h1 id="thread_subject">Permalink fixture</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101" ${first}><em>1</em>#</a><div class="pcb"><p>Opening post destination</p><p><a href="forum.php?mod=viewthread&tid=43">Next thread</a></p></div></div><div id="post_${duplicate ? "101" : "202"}"><div class="authi"><a href="home.php?mod=space&uid=7">Writer Seven</a></div><a id="postnum202" ${later}><em>21</em>#</a><div class="pcb"><p>Later post destination</p></div></div></div>`;
}
async function clipboard(
  page: Page,
  mode: "held" | "refused" | "absent" = "held",
) {
  await page.addInitScript((mode) => {
    const state = { writes: [] as string[], finish: () => {}, fail: () => {} };
    Object.assign(window, { clipboardBoundary: state });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value:
        mode === "absent"
          ? undefined
          : {
              writeText: async (value: string) => {
                state.writes.push(value);
                if (mode === "refused")
                  throw new DOMException("Refused", "NotAllowedError");
                await new Promise<void>((resolve, reject) => {
                  state.finish = resolve;
                  state.fail = () =>
                    reject(new DOMException("Refused", "NotAllowedError"));
                });
              },
            },
    });
  }, mode);
}
async function writes(page: Page) {
  return page.evaluate(
    () => Reflect.get(window, "clipboardBoundary").writes as string[],
  );
}
async function finish(page: Page) {
  await page.evaluate(() => Reflect.get(window, "clipboardBoundary").finish());
}
const requests = new WeakMap<Page, { url: string; method: string }[]>();
async function open(
  page: Page,
  first = "",
  later = "",
  duplicate = false,
  sourcePath = "dist/tsdm-ui.user.js",
) {
  const ledger: { url: string; method: string }[] = [];
  requests.set(page, ledger);
  const built = readFileSync(sourcePath, "utf8");
  await page.context().route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname === "/__entry.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (req.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__entry.js"></script></body></html>`,
      });
    ledger.push({ url: req.url(), method: req.method() });
    if (req.method() !== "GET")
      return route.fulfill({ status: 500, body: "Unexpected mutation" });
    let body = document(first, later, duplicate);
    if (url.searchParams.get("tid") === "43")
      body = body
        .replaceAll("post_101", "post_303")
        .replaceAll("postnum101", "postnum303")
        .replaceAll("post_202", "post_404")
        .replaceAll("postnum202", "postnum404");
    if (url.searchParams.get("mod") === "post")
      body = `<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(threadURL);
  if (!duplicate)
    await expect(
      page.getByRole("heading", { name: "Permalink fixture", exact: true }),
    ).toBeVisible();
  return ledger;
}
const control = (page: Page, id = "101") =>
  page.getByRole("button", {
    name: `Copy permalink for post ${id}`,
    exact: true,
  });
test.afterEach(async ({ page }, info) => {
  await info.attach("requests.json", {
    body: JSON.stringify(requests.get(page) ?? [], null, 2),
    contentType: "application/json",
  });
  await info.attach("clipboard-boundary.json", {
    body: JSON.stringify(await writes(page).catch(() => []), null, 2),
    contentType: "application/json",
  });
  if (!page.isClosed())
    await info.attach("permalink.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});
test("UX104.completion: exact referral-free post copy waits for completion and preserves keyboard focus and writing", async ({
  page,
}) => {
  await clipboard(page);
  const ledger = await open(
    page,
    'href="forum.php?mod=viewthread&tid=42&fromuid=9"',
    'href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=202&fromuid=9"',
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await editor.fill("Keep authored text [quote]literal[/quote]");
  await expect(control(page)).toBeVisible();
  await control(page).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => writes(page)).toEqual([firstURL]);
  await expect(
    page.getByRole("status").filter({ hasText: "Copying URL…" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "URL copied" }),
  ).toHaveCount(0);
  await page.keyboard.press("Enter");
  expect(await writes(page)).toEqual([firstURL]);
  await finish(page);
  await expect(
    page.getByRole("status").filter({ hasText: "URL copied" }),
  ).toBeVisible();
  await expect(control(page)).toBeFocused();
  await expect(editor).toHaveValue("Keep authored text [quote]literal[/quote]");
  await control(page, "202").click();
  await expect.poll(() => writes(page)).toEqual([firstURL, laterURL]);
  await finish(page);
  expect(ledger.filter((r) => r.method !== "GET")).toEqual([]);
});

for (const mode of ["refused", "absent"] as const) {
  test(`UX104.${mode}: clipboard failure explains and selects exact fallback without claiming success`, async ({
    page,
  }) => {
    await clipboard(page, mode);
    await open(page);
    await control(page, "202").click();
    const dialog = page.getByRole("dialog", {
      name: "Copy permalink for post 202",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "Clipboard access failed. Select and copy this URL.",
    );
    const field = dialog.getByRole("textbox", {
      name: "Post URL",
      exact: true,
    });
    await expect(field).toHaveValue(laterURL);
    await expect(field).toBeFocused();
    expect(
      await field.evaluate((el: HTMLInputElement) => [
        el.selectionStart,
        el.selectionEnd,
      ]),
    ).toEqual([0, laterURL.length]);
    await expect(
      page.getByRole("status").filter({ hasText: "URL copied" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(control(page, "202")).toBeFocused();
  });
}

for (const [name, first, later] of [
  ["missing", "", ""],
  ["malformed", 'href="javascript:alert(1)"', 'href="https://["'],
  [
    "mismatched",
    'href="forum.php?mod=redirect&goto=findpost&ptid=99&pid=999&fromuid=7"',
    'href="https://foreign.invalid/forum.php?mod=redirect&goto=findpost&ptid=42&pid=202"',
  ],
] as const) {
  test(`UX104.${name}: source-qualified first and later post identities override unreliable native links`, async ({
    page,
  }) => {
    await clipboard(page);
    const ledger = await open(page, first, later);
    const priorURL = page.url();
    await control(page).click();
    await expect.poll(() => writes(page)).toEqual([firstURL]);
    await finish(page);
    await control(page, "202").click();
    await expect.poll(() => writes(page)).toEqual([firstURL, laterURL]);
    await finish(page);
    expect(ledger.filter((r) => r.method !== "GET")).toEqual([]);
    expect(page.url()).toBe(priorURL);
  });
}
test("UX104.ambiguous: duplicate native post identity refuses the reader rather than offering a guessed permalink", async ({
  page,
}) => {
  await clipboard(page);
  await open(page, "", "", true);
  await expect(
    page.getByText("The returned post identities are ambiguous.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(control(page)).toHaveCount(0);
  expect(await writes(page)).toEqual([]);
});
for (const [id, expected, target] of [
  ["101", firstURL, `${threadURL}&page=1#pid101`],
  ["202", laterURL, `${threadURL}&page=2#pid202`],
] as const) {
  test(`UX104.destination-${id}: copied permalink follows real native HTTP redirect and mounts exact target`, async ({
    browser,
  }, info) => {
    await withRedirectFixture(
      browser,
      { origin, redirect: target, document: () => document() },
      async (page, reads, redirects) => {
        await clipboard(page);
        await page.goto(threadURL);
        await control(page, id).click();
        await expect.poll(() => writes(page)).toEqual([expected]);
        await finish(page);
        const copied = (await writes(page))[0]!;
        const response = await page.goto(copied);
        await expect(page.locator(`#pid${id}`)).toHaveAttribute(
          "data-targeted",
          "true",
        );
        await expect(page.locator(`#pid${id}`)).toBeFocused();
        expect(response?.url()).toBe(target.split("#")[0]);
        expect(redirects).toContain("document");
        await info.attach("real-redirect-requests.json", {
          body: JSON.stringify({ copied, reads, redirects }, null, 2),
          contentType: "application/json",
        });
        await info.attach("target-post.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      },
    );
  });
}
test.describe("narrow touch", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("UX104.touch: enlarged post copy and selectable fallback fit viewport and return focus", async ({
    page,
  }, info) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "tsdm.workspace.preferences",
        JSON.stringify({ schema: 1, textSize: 125 }),
      ),
    );
    await clipboard(page, "refused");
    await open(page);
    const button = control(page, "202");
    const rect = await button.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(44);
    expect(rect!.height).toBeGreaterThanOrEqual(44);
    await button.tap();
    const dialog = page.getByRole("dialog", {
      name: "Copy permalink for post 202",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(
      dialog.getByRole("textbox", { name: "Post URL", exact: true }),
    ).toHaveValue(laterURL);
    await info.attach("touch-fallback.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      (await dialog.getByRole("textbox").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(44);
    await close.tap();
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test("UX104.legacy: actual earlier app recovery requires refresh before copying old unqualified links", async ({
  page,
}) => {
  const baseline = process.env.UX104_BASELINE;
  test.skip(
    !baseline,
    "Supply the retained pre-104 userscript via UX104_BASELINE to replay real replacement recovery.",
  );
  await clipboard(page);
  await open(
    page,
    'href="forum.php?mod=viewthread&tid=42&fromuid=9"',
    "",
    false,
    baseline,
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await editor.fill("Preserve replacement writing");
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/__entry.js", (route) =>
    route.fulfill({
      contentType: "text/javascript; charset=utf-8",
      body: built,
    }),
  );
  await page.reload();
  await expect(control(page)).toHaveAttribute("aria-disabled", "true");
  await expect(control(page)).toHaveAttribute(
    "title",
    "Refresh thread to verify this post permalink",
  );
  await control(page).focus();
  await page.keyboard.press("Enter");
  expect(await writes(page)).toEqual([]);
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  await expect(control(page)).toHaveAttribute("aria-disabled", "false");
  await control(page).click();
  await expect.poll(() => writes(page)).toEqual([firstURL]);
  await finish(page);
  await expect(editor).toHaveValue("Preserve replacement writing");
});

test("UX104.legacy-exact: qualified earlier native findpost URL removes referral without requiring refresh", async ({
  page,
}) => {
  const baseline = process.env.UX104_BASELINE;
  test.skip(
    !baseline,
    "Supply retained pre-104 userscript via UX104_BASELINE.",
  );
  await clipboard(page);
  const ledger = await open(
    page,
    'href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=101&fromuid=9"',
    "",
    false,
    baseline,
  );
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/__entry.js", (route) =>
    route.fulfill({
      contentType: "text/javascript; charset=utf-8",
      body: built,
    }),
  );
  await page.reload();
  const before = ledger.length;
  await expect(control(page)).toHaveAttribute("aria-disabled", "false");
  await control(page).click();
  await expect.poll(() => writes(page)).toEqual([firstURL]);
  await finish(page);
  expect(ledger.length).toBe(before);
});

for (const outcome of ["finish", "fail"] as const) {
  test(`UX104.departed-${outcome}: a pending copy cannot announce or open fallback on another thread`, async ({
    page,
  }) => {
    await clipboard(page);
    await open(page);
    await control(page).click();
    await expect.poll(() => writes(page)).toEqual([firstURL]);
    await page.getByRole("link", { name: "Next thread", exact: true }).click();
    await expect(control(page, "303")).toBeVisible();
    await page.evaluate(
      (outcome) => Reflect.get(window, "clipboardBoundary")[outcome](),
      outcome,
    );
    await expect(
      page.getByRole("status").filter({ hasText: "URL copied" }),
    ).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(control(page)).toHaveCount(0);
  });
}
