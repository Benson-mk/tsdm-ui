import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
});

const origin = "https://www.tsdm39.com";
const target = `${origin}/forum.php?mod=viewthread&tid=42`;
const populated = `<!doctype html><html><head><title>Autumn listening</title><link rel="canonical" href="${target}"></head><body>
<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>
<div id="postlist"><h1 id="thread_subject">Autumn listening 秋日聆聽</h1>
<div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum101">1</a><em id="authorposton101">2026-10-18 09:00</em>
<div class="pcb"><div id="postmessage_101"><p>A populated opening post.</p><blockquote>Keep the complete quotation.</blockquote><script>window.fetchedCodeRan=true</script><img src="javascript:alert(1)" onerror="window.fetchedCodeRan=true"><a href="javascript:alert(1)">Unsafe link</a><iframe src="https://evil.example/"></iframe><custom-unknown>Unfamiliar content remains readable.</custom-unknown></div></div></div>
<div id="post_102"><div class="authi"><a href="home.php?mod=space&uid=10">Listener Ten</a></div><a id="postnum102">2</a><div class="pcb"><p>A second post with <strong>meaningful emphasis</strong>.</p></div></div>
</div></body></html>`;

async function openThread(
  page: import("@playwright/test").Page,
  response: { body: string; contentType?: string; status?: number } = {
    body: populated,
  },
  destination = target,
) {
  const requests: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    requests.push(request.url());
    if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><html><head><title>Native forum</title></head><body><main>Native forum retained</main></body></html>",
      });
    } else if (request.url().startsWith(origin)) {
      await route.fulfill({
        contentType: response.contentType ?? "text/html",
        body: response.body,
        status: response.status ?? 200,
      });
    } else await route.abort();
  });
  await page.goto(destination);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  return requests;
}

test("J2.thread-populated: read identities and inert content through the built application", async ({
  page,
}, info) => {
  const requests = await openThread(page);
  await expect(
    page.getByRole("heading", {
      name: "Autumn listening 秋日聆聽",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as Reader Seven")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByText("A populated opening post.")).toBeVisible();
  await expect(
    page.getByText("Unfamiliar content remains readable."),
  ).toBeVisible();
  await expect(page.getByText("Unsupported interactive content")).toBeVisible();
  await expect(
    page
      .locator("#tsdm-workspace")
      .locator('iframe, script, [onclick], [onerror], a[href^="javascript:"]'),
  ).toHaveCount(0);
  expect(await page.evaluate(() => "fetchedCodeRan" in window)).toBe(false);
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    1,
  );
  expect(requests.filter((url) => !url.startsWith(origin))).toEqual([]);
  await info.attach("thread-synthetic.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J1.reka-shadow-dialog: keyboard focus remains in the application and returns", async ({
  page,
}, info) => {
  await openThread(page);
  const trigger = page.getByRole("button", { name: "About this workspace" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "About this workspace" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-describedby", /.+/);
  expect(
    await dialog.evaluate((node) => node.getRootNode() instanceof ShadowRoot),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((node) =>
      node.contains((node.getRootNode() as ShadowRoot).activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await info.attach("dialog-synthetic.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J11.authoritative-json-account: member and guest metadata are inert and not post authors", async ({
  page,
}) => {
  const body = populated.replace(/<div id="um">.*?<\/div>/, "");
  const requests = await openThread(page, {
    contentType: "application/json",
    body: JSON.stringify({
      ok: 1,
      uid: 0,
      type: "thread",
      thread: { tid: 42 },
      head: '<script>var discuz_uid = "0";</script>',
      document: body,
    }),
  });
  await expect(page.getByText("Browsing as a guest")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    1,
  );
});

for (const scenario of [
  {
    name: "login",
    status: 401,
    body: '<div id="messagetext">请先登录</div>',
    heading: "Login",
  },
  {
    name: "permission",
    status: 403,
    body: '<div id="messagetext">阅读权限不足</div>',
    heading: "Permission",
  },
  {
    name: "missing",
    status: 404,
    body: '<div id="messagetext">不存在</div>',
    heading: "Missing",
  },
  {
    name: "challenge",
    status: 403,
    body: '<title>Just a moment</title><form id="challenge-form"></form>',
    heading: "Challenge",
  },
  {
    name: "invalid",
    status: 200,
    body: "<html><p>An unfamiliar response</p></html>",
    heading: "Content unavailable",
  },
  {
    name: "malformed-json",
    status: 200,
    body: '{"document":',
    heading: "Content unavailable",
  },
  {
    name: "incomplete-post",
    status: 200,
    body: populated.replace(
      "<p>A second post with <strong>meaningful emphasis</strong>.</p>",
      "<script>window.no=true</script>",
    ),
    heading: "Content unavailable",
  },
]) {
  test(`J2.response-${scenario.name}: explicit outcome and native destination`, async ({
    page,
  }) => {
    const requests = await openThread(page, scenario);
    await expect(
      page.getByRole("heading", { name: scenario.heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Continue in native forum" }),
    ).toHaveAttribute("href", `${target}&tsdm-native=1`);
    expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
      1,
    );
  });
}

test("J11.post-header-spoof: post markup cannot establish the current account", async ({
  page,
}) => {
  const body = populated
    .replace(/<div id="um">.*?<\/div>/, "")
    .replace(
      "<p>A populated opening post.</p>",
      '<div id="um"><strong><a href="home.php?mod=space&uid=99">Impersonation</a></strong></div><p>A populated opening post.</p>',
    );
  await openThread(page, { body });
  await expect(page.getByText("Account not yet confirmed")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("J2.ambiguous-destination: duplicate thread identities do not cause a forum request", async ({
  page,
}) => {
  const requests = await openThread(
    page,
    { body: populated },
    `${target}&tid=43`,
  );
  await expect(
    page.getByRole("heading", { name: "Content unavailable" }),
  ).toBeVisible();
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    0,
  );
});

test("J11.stale-account: late old response cannot replace a current account result", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const deferred = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reads = 0;
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
      return;
    }
    reads++;
    if (reads === 1) {
      await deferred;
      await route.fulfill({ contentType: "text/html", body: populated });
    } else
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          uid: 0,
          thread: { tid: 42 },
          document: populated
            .replace(/<div id="um">.*?<\/div>/, "")
            .replace("Autumn listening 秋日聆聽", "Current guest result"),
        }),
      });
  });
  await page.goto(target);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  await expect.poll(() => reads).toBe(1);
  await page.getByRole("button", { name: "Refresh thread" }).click();
  await expect(
    page.getByRole("heading", { name: "Current guest result" }),
  ).toBeVisible();
  release?.();
  await expect.poll(() => reads).toBe(2);
  await expect(page.getByText("Browsing as a guest")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Current guest result" }),
  ).toBeVisible();
});

test("J2.network: failed host read is recoverable and never becomes empty content", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    else await route.abort("failed");
  });
  await page.goto(target);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  await expect(page.getByRole("heading", { name: "Network" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh thread" }),
  ).toBeEnabled();
});

for (const destination of [
  "https://example.com/forum.php?mod=viewthread&tid=42",
  `${target}&tsdm-native=1`,
]) {
  test(`J1.native-bypass: ${destination}`, async ({ page }) => {
    const requests = await openThread(page, { body: populated }, destination);
    await expect(page.getByText("Native forum retained")).toBeVisible();
    await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
    expect(requests).toHaveLength(1);
  });
}

test("J2.non-html-response: incompatible content type is explicit invalid content", async ({
  page,
}) => {
  await openThread(page, {
    body: populated,
    contentType: "application/octet-stream",
  });
  await expect(
    page.getByRole("heading", { name: "Content unavailable" }),
  ).toBeVisible();
});

test("J1.reka-isolated-world: Escape closes the dialog in a userscript execution realm", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({
        contentType: "text/html",
        body: '<html><body><main><a href="/forum.php">Native board link</a></main></body></html>',
      });
    else await route.fulfill({ contentType: "text/html", body: populated });
  });
  await page.goto(target);
  const session = await page.context().newCDPSession(page);
  const tree = await session.send("Page.getFrameTree");
  const world = await session.send("Page.createIsolatedWorld", {
    frameId: tree.frameTree.frame.id,
    worldName: "authored-userscript-realm",
  });
  await session.send("Runtime.evaluate", {
    expression: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
    contextId: world.executionContextId,
  });
  const trigger = page.getByRole("button", { name: "About this workspace" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "About this workspace" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await session.detach();
});

test("J1.native-background: mounted workspace hides native background controls from accessibility", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({
        contentType: "text/html",
        body: '<html><body><main><a href="/forum.php">Native board link</a><button>Native reply</button></main></body></html>',
      });
    else await route.fulfill({ contentType: "text/html", body: populated });
  });
  await page.goto(target);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  await expect(
    page.getByRole("heading", { name: "Autumn listening 秋日聆聽" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Native board link" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Native reply" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "Continue in native forum" }),
  ).toBeVisible();
});

test("J2.hidden-native-state: inactive success text is not presented as a confirmed effect", async ({
  page,
}) => {
  const body = populated.replace(
    "<p>A populated opening post.</p>",
    '<div class="native-packet"><p>The packet is exhausted.</p><div style="display: none">Credited 20 points successfully.</div><p hidden>Hidden successful claim.</p><p>A populated opening post.</p></div>',
  );
  await openThread(page, { body });
  await expect(page.getByText("The packet is exhausted.")).toBeVisible();
  await expect(page.getByText("A populated opening post.")).toBeVisible();
  await expect(page.getByText("Credited 20 points successfully.")).toHaveCount(
    0,
  );
  await expect(page.getByText("Hidden successful claim.")).toHaveCount(0);
  await expect(
    page
      .getByText(
        "Additional native content is hidden; view it in the native forum.",
      )
      .first(),
  ).toBeVisible();
});

test("J1.current-anchor-recovery: same-document post selection survives native continuation", async ({
  page,
}) => {
  const requests = await openThread(page);
  await page.getByRole("link", { name: "Post 102", exact: true }).click();
  await expect(page).toHaveURL(`${target}#pid102`);
  await expect(
    page.getByRole("link", { name: "Continue in native forum" }),
  ).toHaveAttribute("href", `${target}&tsdm-native=1#pid102`);
  expect(requests.filter((url) => url.includes("tsdmapp=json"))).toHaveLength(
    1,
  );
});

test("J2.native-packet-overlay: native interaction templates cannot report a claim outcome", async ({
  page,
}) => {
  const body = populated.replace(
    "<p>A populated opening post.</p>",
    '<div class="pcbs"><p>The packet is exhausted.</p><div id="hb_mask" class="mask"><div class="env-wrap"><div id="hb_env" class="env"><div class="inner"><div class="stored">Credited 20 points successfully.</div></div></div></div></div><p>A populated opening post.</p></div>',
  );
  await openThread(page, { body });
  await expect(page.getByText("The packet is exhausted.")).toBeVisible();
  await expect(page.getByText("A populated opening post.")).toBeVisible();
  await expect(page.getByText("Credited 20 points successfully.")).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Native red-packet interaction requires the native forum."),
  ).toBeVisible();
});

test("J1.anchor-during-read: a late read cannot reset a newly selected recovery fragment", async ({
  page,
}) => {
  await openThread(page);
  await expect(
    page.getByRole("heading", { name: "Autumn listening 秋日聆聽" }),
  ).toBeVisible();
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let refreshStarted = false;
  await page.route("**/*tsdmapp=json*", async (route) => {
    refreshStarted = true;
    await pending;
    await route.fulfill({ contentType: "text/html", body: populated });
  });
  await page.getByRole("button", { name: "Refresh thread" }).click();
  await expect.poll(() => refreshStarted).toBe(true);
  await page.goto(`${target}#pid102`);
  await expect(
    page.getByRole("link", { name: "Continue in native forum" }),
  ).toHaveAttribute("href", `${target}&tsdm-native=1#pid102`);
  release?.();
  await expect(
    page.getByRole("heading", { name: "Autumn listening 秋日聆聽" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue in native forum" }),
  ).toHaveAttribute("href", `${target}&tsdm-native=1#pid102`);
});

test("J1.native-escape-handler: a forum body cancellation does not trap the application dialog", async ({
  page,
}) => {
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({
        contentType: "text/html",
        body: '<html><body id="nv_forum" onkeydown="if(event.keyCode==27) return false;"><main>Native forum retained</main></body></html>',
      });
    else await route.fulfill({ contentType: "text/html", body: populated });
  });
  await page.goto(target);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  const trigger = page.getByRole("button", { name: "About this workspace" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "About this workspace" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).toHaveAttribute(
    "onkeydown",
    "if(event.keyCode==27) return false;",
  );
});

test("J1.native-word-break: native universal styles do not split application controls or dialog words", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.route("**/*", async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({
        contentType: "text/html",
        body: "<html><head><style>* { word-break: break-all; }</style></head><body><main>Native forum retained</main></body></html>",
      });
    else await route.fulfill({ contentType: "text/html", body: populated });
  });
  await page.goto(target);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-workspace.user.js", "utf8"),
  });
  const trigger = page.getByRole("button", { name: "About this workspace" });
  await expect(trigger).toHaveCSS("word-break", "normal");
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText(
      "For unsupported content or verification, continue at the same destination in the native forum.",
    ),
  ).toHaveCSS("word-break", "normal");
  await expect(page.locator("body")).toHaveCSS("word-break", "break-all");
  await info.attach("native-word-break-dialog-synthetic.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
