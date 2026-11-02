import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const origin = "https://www.tsdm39.com";
const target = `${origin}/forum.php?mod=viewthread&tid=42#pid101`;
const key = "tsdm.workspace.preferences";
const document =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><div id="postlist"><h1 id="thread_subject">Replacement fixture</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Reader Seven</a></div><div class="pcb"><p>Exact retained post</p></div></div></div>';
async function open(page: Page, raw: string, nativeAfterSeed = "") {
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/__replacement.js")) {
      await route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    } else if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><p>Native fixture</p><script>if(!sessionStorage.getItem('seeded')){localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(raw).replaceAll("<", "\\u003c")});sessionStorage.setItem('seeded','1')}${nativeAfterSeed}</script><script src="${origin}/__replacement.js"></script></body></html>`,
      });
    } else {
      requests.push({ url: request.url(), method: request.method() });
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ document }),
      });
    }
  });
  await page.goto(target);
  await expect(page.getByRole("article")).toHaveCount(1);
  return requests;
}
for (const raw of [
  '{"schema":99,"theme":"future-dark","source":"<script>inert</script>"}',
  "{broken retained record",
]) {
  test(`J1.replacement-preferences ${raw}: incompatible preferences remain copyable until explicit reset`, async ({
    page,
    browser,
  }, info) => {
    info.annotations.push({
      type: "browser-version",
      description: browser.version(),
    });
    const requests = await open(page, raw);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("slider", { name: "Text size", exact: true })
      .fill("90");
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      raw,
    );
    await expect(
      page.getByText(
        "Stored preferences are incompatible. Changes apply to this page only until you explicitly reset the retained record.",
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Retained preferences", { exact: true }),
    ).toHaveValue(raw);
    await expect(
      page
        .getByRole("dialog", { name: "Settings", exact: true })
        .getByRole("status"),
    ).toContainText("Compact");
    await page
      .getByRole("button", {
        name: "Reset incompatible preferences",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        "Copy any needed preferences before discarding this local record. This does not delete forum posts, drafts or uploads.",
      ),
    ).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      raw,
    );
    await page
      .getByRole("button", {
        name: "Discard retained preferences",
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel("Retained preferences", { exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
    ).toEqual({ schema: 1, theme: "light", textSize: 90, language: "en" });
    expect(requests.every((request) => request.method === "GET")).toBe(true);
    await info.attach("replacement-preferences.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("request-ledger.json", {
      body: Buffer.from(JSON.stringify(requests)),
      contentType: "application/json",
    });
  });
}

const earlier = gunzipSync(
  readFileSync("tests/fixtures/replacement-0.4.0.user.js.gz"),
).toString("utf8");
const identity = (bytes: string) => ({
  bytes: Buffer.byteLength(bytes),
  sha256: createHash("sha256").update(bytes).digest("hex"),
});
test("J1.replacement-identity: exact retained candidate and replacement share manual manager identity", async ({
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const current = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const retained = JSON.parse(
    readFileSync("tests/fixtures/replacement-0.4.0.json", "utf8"),
  );
  expect(identity(earlier)).toEqual({
    bytes: retained.bytes,
    sha256: retained.sha256,
  });
  const metadata = (source: string, field: string) =>
    source.match(new RegExp(`^// @${field}\\s+(.+)$`, "m"))?.[1];
  for (const script of [earlier, current]) {
    expect(metadata(script, "name")).toBe("TSDM Workspace");
    expect(metadata(script, "namespace")).toBe(
      "https://github.com/Benson-mk/tsdm-ui",
    );
    expect(metadata(script, "updateURL")).toBeUndefined();
    expect(metadata(script, "downloadURL")).toBeUndefined();
  }
  expect(identity(current).sha256).not.toBe(identity(earlier).sha256);
  await info.attach("candidate-to-candidate.json", {
    body: Buffer.from(
      JSON.stringify({
        earlier: identity(earlier),
        replacement: identity(current),
        installedSourceReadback: null,
        limit:
          "Synthetic executable replacement; manager identity and source export require installed verification.",
      }),
    ),
    contentType: "application/json",
  });
});
test("J1.replacement-compatible: earlier executable preferences, writing and pending attempt survive replacement without replay", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  let script = earlier;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: { url: string; method: string }[] = [];
  const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
  const account =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
  const form = `${account}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="SECRET-TOKEN"><input type="hidden" name="posttime" value="1792550000"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><label>Thread price<input name="price" value="0"></label><button name="topicsubmit" value="yes">Publish</button></form>`;
  const board = `${account}<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/__replacement.js"))
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: script,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head><meta charset="utf-8"></head><body>Native fixture<script src="${origin}/__replacement.js"></script></body></html>`,
      });
    requests.push({ url: request.url(), method: request.method() });
    if (request.method() === "POST") {
      await pending;
      return route.abort("failed");
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          new URL(request.url()).searchParams.get("mod") === "post"
            ? form
            : board,
      }),
    });
  });
  await page.goto(boardURL);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Retained candidate writing");
  const source = "[unknown]完整來源[/unknown] [attach]321[/attach]";
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("slider", { name: "Text size", exact: true }).fill("90");
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page
    .getByLabel("Interface language", { exact: true })
    .selectOption("zh-TW");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "檢查發佈", exact: true }).click();
  await page.getByRole("button", { name: "發佈主題", exact: true }).click();
  await expect
    .poll(() => requests.filter((r) => r.method === "POST").length)
    .toBe(1);
  const before = await page.evaluate(() => ({
    preferences: localStorage.getItem("tsdm.workspace.preferences"),
    writing: JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
      .writing,
  }));
  expect(before.writing.attempts[0].status).toBe("pending");
  script = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const boundary = requests.length;
  await page.reload();
  release();
  await expect(page.getByLabel("完整原始碼", { exact: true })).toHaveValue(
    source,
  );
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "data-spacing",
    "compact",
  );
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "lang",
    "zh-TW",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .attempts[0].status,
      ),
    )
    .toBe("uncertain");
  const after = await page.evaluate(() => ({
    preferences: localStorage.getItem("tsdm.workspace.preferences"),
    writing: JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
      .writing,
  }));
  expect(after.preferences).toBe(before.preferences);
  expect(after.writing.source).toBe(before.writing.source);
  expect(after.writing.attempts[0].publication).toEqual(
    before.writing.attempts[0].publication,
  );
  expect(after.writing.attempts[0].id).toBe(before.writing.attempts[0].id);
  expect(requests.slice(boundary)).toEqual([]);
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  await info.attach("replacement-compatible.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("replacement-readback.json", {
    body: Buffer.from(
      JSON.stringify({
        earlier: identity(earlier),
        replacement: identity(script),
        before,
        after,
        requests,
        requestsAfterReplacement: requests.slice(boundary),
      }),
    ),
    contentType: "application/json",
  });
});

test("J1.replacement-startup: blocked executable startup permits manual native bypass and exact-anchor re-entry", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  let failStartup = true;
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/__replacement.js"))
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        headers: failStartup
          ? {
              "Content-Security-Policy": "script-src 'none'",
            }
          : {},
        body: `<html><body><p>Native forum remains readable</p><script src="${origin}/__replacement.js"></script></body></html>`,
      });
    requests.push(request.method());
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document }),
    });
  });
  await page.goto(target);
  await expect(
    page.getByText("Native forum remains readable", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
  await page.goto(
    `${origin}/forum.php?mod=viewthread&tid=42&tsdm-native=1#pid101`,
  );
  await expect(page).toHaveURL(
    `${origin}/forum.php?mod=viewthread&tid=42&tsdm-native=1#pid101`,
  );
  await expect(
    page.getByText("Native forum remains readable", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
  failStartup = false;
  await page.goto(target);
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.locator("article#pid101")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  expect(requests.every((method) => method === "GET")).toBe(true);
  await info.attach("startup-reentry.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("startup-bypass.json", {
    body: Buffer.from(
      JSON.stringify({
        failure: "Browser CSP prevents executable startup with script-src none",
        native: `${origin}/forum.php?mod=viewthread&tid=42&tsdm-native=1#pid101`,
        reentry: target,
        requests,
        limit:
          "Browser policy failure, not a manager installation or disable/uninstall observation.",
      }),
    ),
    contentType: "application/json",
  });
});

test("J1.replacement-reset-refused: actual full origin storage preserves retained preferences and explains failed reset", async ({
  page,
}, info) => {
  const quota =
    "let filled='';for(let size=65536;size>=1;size=Math.floor(size/2)){const block='x'.repeat(size);try{while(true){localStorage.setItem('native-capacity',filled+block);filled+=block;}}catch{}}";
  const requests = await open(page, "{}", quota);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Reset incompatible preferences",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Discard retained preferences", exact: true })
    .click();
  await expect(
    page.getByText(
      "Preferences could not be reset. The retained record is still available.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel("Retained preferences", { exact: true }),
  ).toHaveValue("{}");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    "{}",
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("reset-refused.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
