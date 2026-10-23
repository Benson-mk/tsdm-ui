import { test, expect, type Page } from "@playwright/test";
import { withRedirectFixture } from "../http-redirect-fixture";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const account = (id = "7") =>
  id === "guest"
    ? '<form id="lsform"></form>'
    : `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Writer ${id}</a></strong></div>`;
const directory = `${account()}<div class="bm"><h2>Boards</h2><table class="fl_tb"><tr><td><h2><a href="${boardURL}">Music discussion</a></h2></td></tr></table></div>`;
const board = (id = "5", member = "7") =>
  `${account(member)}<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=${id}">Music ${id}</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Autumn thread</a></th></tr></tbody></table>`;
const source =
  "[unknown=v2]完整來源 & <script>inert</script>[/unknown]\n[attach]321[/attach] [quote=Writer Nine,42]keep attribution[/quote]";
const form = (id = "5", member = "7") =>
  `${account(member)}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=${id}">Music ${id}</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=${id}&topicsubmit=yes"><input name="formhash" value="SECRET-TOKEN"><input name="subject" value="Native title"><select name="typeid"><option value="0">Choose category</option><option value="3">Listening notes</option></select><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1">Disable BBCode</label><label><input type="checkbox" name="htmlon" value="1" disabled>HTML</label><label>Thread price<input name="price" value="5"></label><label>Read permission<select name="readperm"><option value="0">Everyone</option><option value="10">Members</option></select></label><button name="topicsubmit">Publish</button></form>`;
async function open(
  page: Page,
  response?: (url: URL) => string,
  nativeScript = "",
) {
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/__workspace-fixture.js")) {
      await route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
      return;
    }
    if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native fixture<script>${nativeScript}</script><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
      return;
    }
    requests.push({ url: request.url(), method: request.method() });
    const url = new URL(request.url());
    const body =
      response?.(url) ??
      (url.searchParams.get("mod") === "post"
        ? form(url.searchParams.get("fid") ?? "5")
        : url.searchParams.get("mod") === "forumdisplay"
          ? board(url.searchParams.get("fid") ?? "5")
          : directory);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(boardURL);
  return requests;
}
test("J5.prepare-source: prepare current native options and preserve complete source without a forum write", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const requests = await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "New thread in Music 5" }),
  ).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Native title",
  );
  await page.getByLabel("Category", { exact: true }).selectOption("3");
  await expect(page.getByLabel("Signature", { exact: true })).toBeChecked();
  await expect(page.getByLabel("HTML", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
    "5",
  );
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save forum draft", exact: true }),
  ).toHaveCount(0);
  expect(
    requests.filter((r) => new URL(r.url).searchParams.get("mod") === "post"),
  ).toHaveLength(1);
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("source-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.revision-recovery: fast edits and options survive unmount and refresh in the sole shared record", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await page.getByLabel("Title", { exact: true }).fill("Recover exact title");
  await page.getByLabel("Category", { exact: true }).selectOption("3");
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await page.getByLabel("Read permission", { exact: true }).selectOption("10");
  await editor.focus();
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  await editor.press("Shift+ArrowLeft");
  const selected = await editor.evaluate((e) => ({
    start: (e as HTMLTextAreaElement).selectionStart,
    end: (e as HTMLTextAreaElement).selectionEnd,
  }));
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(editor).toHaveValue(source);
  expect(
    requests.filter((r) => new URL(r.url).searchParams.get("mod") === "post"),
  ).toHaveLength(1);
  await expect(
    page.getByText(/Recovery acknowledged for revision/),
  ).toBeVisible();
  const stored = await page.evaluate(() => ({
    keys: Object.keys(sessionStorage),
    raw: sessionStorage.getItem("tsdm.workspace.recovery"),
    history: history.state,
    url: location.href,
  }));
  expect(stored.keys).toEqual(["tsdm.workspace.recovery"]);
  expect(stored.raw).not.toContain("SECRET-TOKEN");
  expect(stored.raw).not.toContain("formhash");
  expect(JSON.stringify(stored.history)).not.toContain("Recover exact title");
  expect(stored.url).not.toContain("newthread");
  const record = JSON.parse(stored.raw!);
  expect(record.writing.source).toBe(source);
  expect(record.writing.title).toBe("Recover exact title");
  expect(Object.keys(record.entries)).toHaveLength(1);
  await page.reload();
  await expect(editor).toHaveValue(source);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Recover exact title",
  );
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue("3");
  await expect(page.getByLabel("Signature", { exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Read permission", { exact: true })).toHaveValue(
    "10",
  );
  expect(
    await editor.evaluate((e) => ({
      start: (e as HTMLTextAreaElement).selectionStart,
      end: (e as HTMLTextAreaElement).selectionEnd,
    })),
  ).toEqual(selected);
  expect(requests).toHaveLength(2);
  await info.attach("recovered-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.single-context: another board requires deliberate replacement and failed preparation keeps original writing", async ({
  page,
}, info) => {
  let denied = false;
  const requests = await open(page, (url) =>
    url.searchParams.get("mod") === "post"
      ? denied
        ? `${account()}<div id="messagetext">权限不足</div>`
        : form(url.searchParams.get("fid")!)
      : url.searchParams.get("mod") === "forumdisplay"
        ? board(url.searchParams.get("fid")!)
        : directory,
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByText(/Another writing context is already retained/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "New thread in Music 5" }),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  denied = true;
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("The current account cannot prepare this new thread.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  denied = false;
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "New thread in Music 6" }),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "",
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  info.annotations.push({
    type: "independent-readback",
    description: JSON.stringify(requests),
  });
});

for (const member of ["guest", "8"])
  test(`J11.account-copy-${member}: preserve original account writing and copy only text after fresh preparation and confirmation`, async ({
    page,
  }, info) => {
    let current = "7";
    const requests = await open(page, (url) =>
      url.searchParams.get("mod") === "post"
        ? form(url.searchParams.get("fid")!, current)
        : url.searchParams.get("mod") === "forumdisplay"
          ? board(url.searchParams.get("fid")!, current)
          : directory,
    );
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByLabel("Title", { exact: true })
      .fill("Only text crosses accounts");
    await page.getByLabel("Category", { exact: true }).selectOption("3");
    await page.getByLabel("Thread price", { exact: true }).fill("99");
    await page.getByLabel("Signature", { exact: true }).uncheck();
    current = member;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page.getByText(/Sending paused/)).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    await expect(page.getByText(/Writing as Writer 7/)).toBeVisible();
    current = "8";
    await page
      .getByRole("button", {
        name: "Prepare text copy for current account",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        /Replace writing from Writer 7 with a text copy for Writer 8/,
      ),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Keep original writing", exact: true })
      .click();
    await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
      "99",
    );
    await page
      .getByRole("button", {
        name: "Prepare text copy for current account",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Replace with text copy", exact: true })
      .click();
    await expect(page.getByText(/Writing as Writer 8/)).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
      "Only text crosses accounts",
    );
    await expect(page.getByLabel("Category", { exact: true })).toHaveValue("0");
    await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
      "5",
    );
    await expect(page.getByLabel("Signature", { exact: true })).toBeChecked();
    await expect(
      page.getByText(
        /Attachment references need reattachment or explicit removal/,
      ),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
    );
    expect(stored.writing.account.id).toBe("8");
    expect(stored.writing.uploadedReferences).toEqual([]);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
    await info.attach(`account-copy-${member}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J5.ime-selection: composition defers navigation and preserves source selection through remount and viewport changes", async ({
  page,
}, info) => {
  await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const range = await editor.evaluate((e) => ({
    start: (e as HTMLTextAreaElement).selectionStart,
    end: (e as HTMLTextAreaElement).selectionEnd,
  }));
  await editor.dispatchEvent("compositionstart", { data: "中" });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(editor).toBeVisible();
  await expect(
    page.getByText(/Finish the current input composition/),
  ).toBeVisible();
  await editor.dispatchEvent("compositionend", { data: "中" });
  await expect(editor).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  expect(
    await editor.evaluate((e) => ({
      start: (e as HTMLTextAreaElement).selectionStart,
      end: (e as HTMLTextAreaElement).selectionEnd,
    })),
  ).toEqual(range);
  const geometry = [];
  for (const width of [390, 960, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(editor).toHaveValue(source);
    await expect(page.locator(".workspace > header")).toHaveCount(1);
    expect(
      await editor.evaluate((e) => ({
        start: (e as HTMLTextAreaElement).selectionStart,
        end: (e as HTMLTextAreaElement).selectionEnd,
      })),
    ).toEqual(range);
    geometry.push(
      await page.locator(".workspace").evaluate((e) => ({
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
        scrollHeight: e.scrollHeight,
      })),
    );
    expect(geometry.at(-1)).toEqual({ width, height: 900, scrollHeight: 900 });
  }
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  info.annotations.push({
    type: "independent-readback",
    description: JSON.stringify({ range, geometry }),
  });
  await info.attach("composition-return.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.refusal: real quota exhaustion retains live edits without claiming acknowledgement or a fallback", async ({
  page,
}, info) => {
  const quota = `let filled=''; for(let size=65536;size>=1;size=Math.floor(size/2)){const block='x'.repeat(size);try{while(true){sessionStorage.setItem('native-fixture-capacity',filled+block);filled+=block;}}catch(error){document.body.dataset.quotaRefusal=error.name;}}`;
  await open(page, undefined, quota);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await expect(editor).toHaveValue(source);
  await expect(page.getByText(/Live writing remains here/)).toBeVisible();
  await expect(
    page.getByText(/Recovery acknowledged for revision/),
  ).toHaveCount(0);
  const storage = await page.evaluate(() => ({
    session: Object.keys(sessionStorage),
    local: Object.keys(localStorage),
  }));
  expect(storage.session).toEqual(["native-fixture-capacity"]);
  expect(storage.local).toEqual([]);
  await info.attach("quota-refusal-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.incompatible: preserve unknown recovery data until deliberate local reset and allow inert inspection", async ({
  page,
}, info) => {
  const raw = JSON.stringify({
    schema: 999,
    writing: { source: "Future source must stay available" },
  });
  await open(
    page,
    undefined,
    `if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('tsdm.workspace.recovery',${JSON.stringify(raw)});sessionStorage.setItem('seeded','yes');}`,
  );
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).toBe(raw);
  await page
    .getByRole("button", {
      name: "Inspect retained recovery data",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Retained recovery data", { exact: true }),
  ).toHaveValue(raw);
  await page
    .getByRole("button", { name: "Reset incompatible recovery", exact: true })
    .click();
  await expect(
    page.getByText(/Copy any needed source before discarding/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).toBe(raw);
  await page
    .getByRole("button", {
      name: "Discard incompatible recovery record",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toHaveCount(0);
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(stored.schema).toBe(2);
  expect(stored.writing).toBeNull();
  await info.attach("incompatible-recovery-reset.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const scenario of [
  {
    name: "token-without-identity",
    body: () => form().replace(account(), ""),
    message: "A current member account and complete native form are required.",
  },
  {
    name: "guest-token",
    body: () => form("5", "guest"),
    message: "Sign in through the native forum",
  },
  {
    name: "wrong-board",
    body: () => form("6"),
    message: "The returned form targets a different action or board.",
  },
  {
    name: "missing-source",
    body: () => form().replace('<textarea name="message"></textarea>', ""),
    message:
      "The native form does not provide unambiguous complete source and options.",
  },
  {
    name: "duplicate-source",
    body: () =>
      form().replace(
        "</form>",
        '<textarea name="message">ambiguous</textarea></form>',
      ),
    message:
      "The native form does not provide unambiguous complete source and options.",
  },
  {
    name: "challenge",
    body: () => `${account()}<form id="challenge-form"></form>`,
    message: "Complete native verification",
  },
])
  test(`J5.prepare-reject-${scenario.name}: do not fabricate a writable current form`, async ({
    page,
  }) => {
    const requests = await open(page, (url) =>
      url.searchParams.get("mod") === "post" ? scenario.body() : board(),
    );
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await expect(
      page.getByText(scenario.message, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveCount(0);
    expect(requests).toHaveLength(2);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
  });
test("J5.native-html: JSON-preferring preparation consumes useful native HTML with no second request", async ({
  page,
}) => {
  const requests = await open(page);
  let preparations = 0;
  await page.route("**/*mod=post*", async (route) => {
    preparations++;
    expect(route.request().url()).toContain("tsdmapp=json");
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: form(),
    });
  });
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Native title",
  );
  expect(preparations).toBe(1);
  expect(requests).toHaveLength(1);
});
test("J5.tabs: independent page sessions and opener-inherited copies diverge without synchronization", async ({
  page,
  context,
}, info) => {
  await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  const url = page.url();
  const independent = await context.newPage();
  await independent.goto(url);
  await expect(
    independent.getByRole("button", { name: "Return to writing", exact: true }),
  ).toHaveCount(0);
  const popupPromise = page.waitForEvent("popup");
  // This ordinary origin action exercises browser-provided opener inheritance.
  await page.evaluate((url) => window.open(url, "_blank"), url);
  const copied = await popupPromise;
  await expect(
    copied.getByLabel("Complete source", { exact: true }),
  ).toHaveValue(source);
  await copied
    .getByLabel("Complete source", { exact: true })
    .fill("Independent copied revision");
  await page.reload();
  await copied.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await expect(
    copied.getByLabel("Complete source", { exact: true }),
  ).toHaveValue("Independent copied revision");
  info.annotations.push({
    type: "browser-page-session",
    description:
      "Independent tab has no writing; opener copy inherits then both revisions diverge through reload.",
  });
  await independent.close();
  await copied.close();
});

test("J11.preparation-account: a newly observed account invalidates retained old-account reading without losing writing", async ({
  page,
}) => {
  let member = "7";
  await open(page, (url) =>
    url.searchParams.get("mod") === "post" ? form("5", member) : board(),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  member = "8";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn thread", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
});

test("J5.redirect-writing: actual document redirect and app remount retain source and exact return navigation", async ({
  browser,
}, info) => {
  const threadURL = `${origin}/forum.php?mod=viewthread&tid=42&page=3#pid105`;
  const boardWithRedirect = board().replace(
    "</table>",
    '<tbody id="normalthread_43"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=43">Redirect guide</a></th><td class="by"></td><td class="num"></td><td class="by"><em><a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=105">Exact post</a></em></td></tr></tbody></table>',
  );
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: threadURL,
      document: (url) =>
        url.searchParams.get("mod") === "post"
          ? form()
          : url.searchParams.get("mod") === "viewthread"
            ? `${account()}<div id="postlist"><h1 id="thread_subject">Redirect destination</h1><div id="post_105"><div class="authi">Writer</div><div class="pcb"><p>Exact target content.</p></div></div></div>`
            : boardWithRedirect,
    },
    async (page, requests, redirects) => {
      await page.goto(boardURL);
      await page
        .getByRole("button", { name: "New thread", exact: true })
        .click();
      await page.getByLabel("Complete source", { exact: true }).fill(source);
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await page
        .getByRole("link", {
          name: "Last reply to Redirect guide",
          exact: true,
        })
        .click();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await expect(
        page.getByRole("article", { name: "Post 105", exact: true }),
      ).toHaveAttribute("data-targeted", "true");
      expect(redirects).toEqual(["fetch", "document"]);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Return to writing", exact: true }),
      ).toBeVisible();
      if (
        await page
          .getByRole("button", { name: "Return to reading", exact: true })
          .isVisible()
      )
        await page
          .getByRole("button", { name: "Return to reading", exact: true })
          .click();
      await expect(
        page.getByRole("link", { name: "Autumn thread", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      info.annotations.push({
        type: "independent-readback",
        description: JSON.stringify({ requests, redirects }),
      });
      await info.attach("remounted-writing.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    },
  );
});

test("J11.stale-preparation: an older form cannot replace a newer observed account or retained writing", async ({
  page,
}) => {
  let release: () => void = () => {};
  let waiting = false;
  await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.route("**/*mod=post*", async (route) => {
    waiting = true;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: form("5", "7"),
    });
  });
  await page
    .getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    })
    .click();
  await expect.poll(() => waiting).toBe(true);
  await page.route("**/*mod=forumdisplay*", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: board("5", "8"),
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText(/Signed in as Writer 8/)).toBeVisible();
  release();
  await expect(
    page.getByText(/A newer account request replaced this preparation/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replace with text copy", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await expect(page.getByText(/Writing as Writer 7/)).toBeVisible();
});

for (const change of ["return", "edit"])
  test(`J5.delayed-replacement-${change}: pending replacement cannot erase newer intent or newer source`, async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
    let release: () => void = () => {};
    let waiting = false;
    await page.route("**/*mod=post*", async (route) => {
      waiting = true;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: form("6"),
      });
    });
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Discard local changes and prepare",
        exact: true,
      })
      .click();
    await expect.poll(() => waiting).toBe(true);
    if (change === "return")
      await page.getByRole("button", { name: "Return", exact: true }).click();
    else
      await page
        .getByLabel("Complete source", { exact: true })
        .fill(source + " newer edit");
    release();
    await expect(
      page.getByText("Preparing current form…", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "New thread in Music 5" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source + (change === "edit" ? " newer edit" : ""));
  });

test("J5.unacknowledged: quota refusal after an acknowledged revision recovers only the earlier source", async ({
  page,
}, info) => {
  const quota = `if(sessionStorage.getItem('tsdm.workspace.recovery')){let filled='';for(let size=65536;size>=1;size=Math.floor(size/2)){const block='x'.repeat(size);try{while(true){sessionStorage.setItem('native-fixture-capacity',filled+block);filled+=block;}}catch{}}}`;
  await open(page, undefined, quota);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await expect(
    page.getByText(/Recovery acknowledged for revision/),
  ).toBeVisible();
  await page.reload();
  await expect(editor).toHaveValue(source);
  const newer = source + " unacknowledged ".repeat(1000);
  await editor.fill(newer);
  await expect(
    page.getByText(/unacknowledged changes may be lost/),
  ).toBeVisible();
  await expect(editor).toHaveValue(newer);
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(stored.writing.source).toBe(source);
  await page.reload();
  await expect(editor).toHaveValue(source);
  info.annotations.push({
    type: "independent-readback",
    description:
      "Real origin quota refused the enlarged revision; stored and reloaded source equals the earlier acknowledged literal.",
  });
});
test("J5.uploaded-references: current-form uploaded identities survive recovery without file bytes or form secrets", async ({
  page,
}) => {
  await open(page, (url) =>
    url.searchParams.get("mod") === "post"
      ? form().replace(
          "</form>",
          '<input name="attachnew[321][description]" value="Already uploaded"></form>',
        )
      : board(),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await expect(
    page.getByText(/Attachment references need reattachment/),
  ).toHaveCount(0);
  const raw = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery")!,
  );
  expect(JSON.parse(raw).writing.uploadedReferences).toEqual(["321"]);
  expect(raw).not.toContain("SECRET-TOKEN");
  // Issue 25 preserves existing reference metadata; it is source data, not a form secret.
  expect(JSON.parse(raw).writing.attachmentFields).toEqual([
    {
      name: "attachnew[321][description]",
      value: "Already uploaded",
      disabled: false,
    },
  ]);
});
test("J5.legacy-navigation: navigation-only recovery migrates without losing cached results", async ({
  page,
}) => {
  const script = `const raw=sessionStorage.getItem('tsdm.workspace.recovery');if(raw){const r=JSON.parse(raw);r.schema=1;delete r.writing;sessionStorage.setItem('tsdm.workspace.recovery',JSON.stringify(r));}`;
  const requests = await open(page, undefined, script);
  await expect(
    page.getByRole("link", { name: "Autumn thread", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Autumn thread", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByLabel("Complete source", { exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(stored.schema).toBe(2);
  expect(stored.writing.account.id).toBe("7");
  expect(Object.keys(stored.entries)).toHaveLength(1);
});

test("J11.failed-replacement-account: an account-changing denied preparation pauses original writing", async ({
  page,
}) => {
  let denied = false;
  await open(page, (url) =>
    url.searchParams.get("mod") === "post"
      ? denied
        ? `${account("8")}<div id="messagetext">权限不足</div>`
        : form()
      : board(url.searchParams.get("fid") ?? "5"),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=6`);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Sending paused/)).toHaveCount(0);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  denied = true;
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("The current account cannot prepare this new thread.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
});

test("J5.short-window-focus: opening writing with keyboard places its focused source visibly inside the viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1297, height: 565 });
  await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).focus();
  await page.keyboard.press("Enter");
  const editor = page.getByLabel("Complete source", { exact: true });
  await expect(editor).toBeFocused();
  await expect(editor).toBeInViewport();
  await editor.press("Tab");
  await expect(page.getByLabel("Signature", { exact: true })).toBeFocused();
  await info.attach("short-window-writing-keyboard.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const failure of [
  "invalid-json",
  "invalid-envelope",
  "network",
  "limited",
] as const)
  test(`J5.prepare-failure-${failure}: failed fresh preparation preserves original account-bound writing without retry or copy confirmation`, async ({
    page,
  }, info) => {
    const requests = await open(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    const original = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    let attempts = 0;
    await page.route("**/*mod=post*", async (route) => {
      attempts++;
      expect(route.request().method()).toBe("GET");
      if (failure === "network") return route.abort("connectionfailed");
      await route.fulfill({
        status: failure === "limited" ? 429 : 200,
        contentType: "application/json",
        body:
          failure === "invalid-json"
            ? '{"document":'
            : failure === "invalid-envelope"
              ? JSON.stringify({ document: { html: form() } })
              : JSON.stringify({ document: account() }),
      });
    });
    await page
      .getByRole("button", {
        name: "Prepare text copy for current account",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        failure === "network"
          ? "The form could not be reached. Your writing is retained."
          : failure === "limited"
            ? "The forum is limiting requests. Try again explicitly later."
            : "The forum returned invalid preparation data.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    await expect(page.getByText(/Writing as Writer 7/)).toBeVisible();
    await expect(page.getByText(/Sending paused/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Replace with text copy", exact: true }),
    ).toHaveCount(0);
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(retained).toEqual(original);
    expect(attempts).toBe(1);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
    info.annotations.push({
      type: "independent-readback",
      description: JSON.stringify({
        failure,
        attempts,
        retainedId: retained.id,
        retainedRevision: retained.revision,
      }),
    });
    if (failure === "network")
      await info.attach("failed-preparation-retained-writing.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
  });
test("J5.section-writing: every section overview retains the sole writing context and returns to its source range", async ({
  page,
}, info) => {
  const requests = await open(page, (url) =>
    url.pathname === "/search.php"
      ? searchForm()
      : url.searchParams.get("mod") === "post"
        ? form()
        : url.searchParams.get("mod") === "forumdisplay"
          ? board()
          : directory,
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  for (const section of ["Search", "Saved", "Notices", "Drafts", "Boards"]) {
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: section, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: section, exact: true, level: 1 }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(editor).toHaveValue(source);
    expect(
      await editor.evaluate((e) => ({
        start: (e as HTMLTextAreaElement).selectionStart,
        end: (e as HTMLTextAreaElement).selectionEnd,
        direction: (e as HTMLTextAreaElement).selectionDirection,
      })),
    ).toEqual(original.selection);
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(retained).toEqual(original);
  }
  expect(
    requests.filter((r) => new URL(r.url).searchParams.get("mod") === "post"),
  ).toHaveLength(1);
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  expect(
    requests.filter((r) => /search\.php|home\.php/.test(r.url)),
  ).toHaveLength(1);
  await info.attach("writing-from-section-overview.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.composing-section: section navigation waits for final composition input before replacing writing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  await editor.dispatchEvent("compositionstart", { data: "中" });
  await page
    .getByRole("combobox", { name: "Main destinations", exact: true })
    .selectOption("notices");
  await expect(editor).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Notices", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Finish the current input composition/),
  ).toBeVisible();
  // Explicit synthetic input models browser end-event/final-input ordering; this is not actual native IME evidence.
  await editor.evaluate((e, value) => {
    const element = e as HTMLTextAreaElement;
    element.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中文" }),
    );
    element.value = value;
    element.setSelectionRange(value.length, value.length);
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "中文",
        inputType: "insertCompositionText",
        isComposing: false,
      }),
    );
  }, source + "中文");
  await expect(editor).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Notices", exact: true, level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source + "中文");
  const retained = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(retained.id).toBe(original.id);
  expect(retained.account).toEqual(original.account);
  expect(retained.board).toEqual(original.board);
  expect(retained.selection.start).toBe((source + "中文").length);
  expect(requests).toHaveLength(2);
  await info.attach("composition-section-final-source.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const dialogName of ["Settings", "About this workspace"])
  test(`J5.composing-dialog-${dialogName}: the overlay waits for composition to settle without replacing the source control`, async ({
    page,
  }, info) => {
    const requests = await open(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const editor = page.getByLabel("Complete source", { exact: true });
    await editor.fill(source);
    const original = await editor.elementHandle();
    await editor.dispatchEvent("compositionstart", { data: "中" });
    // dispatchEvent keeps the synthetic composition active; actual pointer/IME behavior is separately installed.
    await page
      .getByRole("button", { name: dialogName, exact: true })
      .dispatchEvent("click");
    await expect(
      page.getByRole("dialog", { name: dialogName, exact: true }),
    ).not.toBeVisible();
    await expect(editor).toBeVisible();
    await expect(
      page.getByText(/Finish the current input composition/),
    ).toBeVisible();
    await editor.evaluate((e, value) => {
      const input = e as HTMLTextAreaElement;
      input.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true, data: "中" }),
      );
      input.value = value;
      input.setSelectionRange(value.length, value.length);
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: "中",
          inputType: "insertCompositionText",
        }),
      );
    }, source + "中");
    await expect(
      page.getByRole("dialog", { name: dialogName, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
    await expect(editor).toHaveValue(source + "中");
    expect(requests).toHaveLength(2);
    info.annotations.push({
      type: "independent-readback",
      description:
        "Source node survives deferred overlay; final input committed before overlay opens; no extra HTTP.",
    });
  });
test("J5.appearance-writing: themes, interface languages and the Compact threshold preserve literal source and selection", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.locator(".source-writing textarea");
  await editor.fill(source);
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const node = await editor.elementHandle();
  const before = await page.evaluate(() => ({
    writing: JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
      .writing,
    history: history.state,
    url: location.href,
  }));
  const sizes = [70, 90, 100, 150];
  const themes = ["light", "alias", "mono", "dark"];
  const languages = ["en", "zh-CN", "zh-TW", "en"];
  const measurements = [];
  for (let i = 0; i < sizes.length; i++) {
    await page
      .getByRole("button", { name: /^(Settings|设置|設定)$/, exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: /^(Settings|设置|設定)$/,
      exact: true,
    });
    const range = dialog.locator('input[type="range"]');
    await range.focus();
    await range.press("Home");
    for (let step = 70; step < sizes[i]!; step += 10)
      await range.press("ArrowRight");
    await dialog
      .getByRole("radio", {
        name: themes[i]![0]!.toUpperCase() + themes[i]!.slice(1),
        exact: true,
      })
      .check();
    await dialog.locator("#interface-language").selectOption(languages[i]!);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    const host = page.locator("#tsdm-workspace");
    await expect(host).toHaveAttribute(
      "data-spacing",
      sizes[i]! < 100 ? "compact" : "default",
    );
    await expect(host).toHaveAttribute("data-theme", themes[i]!);
    await expect(host).toHaveAttribute("lang", languages[i]!);
    expect(await node!.evaluate((n) => n.isConnected)).toBe(true);
    await expect(editor).toHaveValue(source);
    expect(
      await editor.evaluate((e) => ({
        start: (e as HTMLTextAreaElement).selectionStart,
        end: (e as HTMLTextAreaElement).selectionEnd,
        direction: (e as HTMLTextAreaElement).selectionDirection,
      })),
    ).toEqual(before.writing.selection);
    const metrics = await editor.evaluate((e) => {
      const s = getComputedStyle(e),
        host = (e.getRootNode() as ShadowRoot).host;
      const h = getComputedStyle(host);
      return {
        ink: s.color,
        surface: s.backgroundColor,
        font: parseFloat(s.fontSize),
        hostInk: h.color,
        hostSurface: h.backgroundColor,
        controls: [
          ...e
            .closest(".source-writing")!
            .querySelectorAll("input:not([type=checkbox]),select,textarea"),
        ].map((control) => control.getBoundingClientRect().height),
        checkboxTargets: [
          ...e
            .closest(".source-writing")!
            .querySelectorAll("label:has(input[type=checkbox])"),
        ].map((label) => label.getBoundingClientRect().height),
        padding: parseFloat(
          getComputedStyle(e.closest(".source-writing")!).paddingTop,
        ),
      };
    });
    expect(Math.min(...metrics.controls)).toBeGreaterThanOrEqual(44);
    expect(Math.min(...metrics.checkboxTargets)).toBeGreaterThanOrEqual(44);
    expect(metrics.ink).toBe(metrics.hostInk);
    expect(metrics.surface).toBe(metrics.hostSurface);
    expect(metrics.font).toBeCloseTo((18 * sizes[i]!) / 100, 1);
    measurements.push(metrics);
  }
  expect(measurements[1]!.padding).toBeLessThan(measurements[2]!.padding);
  expect(
    await page.evaluate(() => ({
      writing: JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
        .writing,
      history: history.state,
      url: location.href,
    })),
  ).toEqual(before);
  expect(requests).toHaveLength(2);
  await editor.focus();
  await editor.press("ArrowLeft");
  await expect(editor).toBeFocused();
  await expect(editor).toBeInViewport();
  info.annotations.push({
    type: "independent-readback",
    description: JSON.stringify({ measurements, requests }),
  });
  await info.attach("writing-appearance-preserved.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.writing-locale: own writing and recovery labels follow all three interface languages while current-form labels stay literal", async ({
  page,
}, info) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.locator(".source-writing textarea");
  await editor.fill(source);
  for (const [language, sourceLabel, titleLabel, returnLabel] of [
    ["zh-CN", "完整源码", "标题", "返回阅读"],
    ["zh-TW", "完整原始碼", "標題", "返回閱讀"],
    ["en", "Complete source", "Title", "Return to reading"],
  ]) {
    await page
      .getByRole("button", { name: /^(Settings|设置|設定)$/, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .locator("#interface-language")
      .selectOption(language!);
    await page.keyboard.press("Escape");
    await expect(page.getByLabel(sourceLabel!, { exact: true })).toHaveValue(
      source,
    );
    await expect(page.getByLabel(titleLabel!, { exact: true })).toHaveValue(
      "Native title",
    );
    await expect(
      page.getByRole("button", { name: returnLabel!, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Signature", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
      "5",
    );
  }
  expect(requests).toHaveLength(2);
  await info.attach("writing-localized-labels.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.legacy-section-recovery: upgrading a navigation-only record preserves passive section history and the sole writing owner", async ({
  page,
}, info) => {
  const legacy = `const raw=sessionStorage.getItem('tsdm.workspace.recovery');if(raw){const r=JSON.parse(raw);if(!r.writing){r.schema=1;delete r.writing;sessionStorage.setItem('tsdm.workspace.recovery',JSON.stringify(r));}}`;
  const requests = await open(page, undefined, legacy);
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved", exact: true, level: 1 }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved", exact: true, level: 1 }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Autumn thread", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  const record = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(record.schema).toBe(2);
  expect(record.writing.source).toBe(source);
  expect(
    Object.values(record.entries).some(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "section" in entry &&
        entry.section === "saved",
    ),
  ).toBe(true);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([
    "tsdm.workspace.recovery",
  ]);
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  expect(requests).toHaveLength(2);
  info.annotations.push({
    type: "independent-readback",
    description:
      "Actual native fixture changes navigation-only schema before the emitted app mounts; saved section restores without HTTP and upgrades with writing in the same session key.",
  });
});

for (const [language, checkLabel, sourceLabel, message] of [
  ["zh-CN", "检查当前账号和表单", "完整源码", "当前账号无法准备此新主题。"],
  ["zh-TW", "檢查目前帳號和表單", "完整原始碼", "目前帳號無法準備此新主題。"],
  [
    "en",
    "Check current account and form",
    "Complete source",
    "The current account cannot prepare this new thread.",
  ],
])
  test(`J5.writing-failure-locale-${language}: fresh-form denial is localized without changing retained source`, async ({
    page,
  }, info) => {
    await open(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("dialog")
      .locator("#interface-language")
      .selectOption(language!);
    await page.keyboard.press("Escape");
    await page.route("**/*mod=post*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `${account()}<div id="messagetext">权限不足</div>`,
      }),
    );
    await page.getByRole("button", { name: checkLabel!, exact: true }).click();
    await expect(page.getByText(message!, { exact: true })).toBeVisible();
    await expect(page.getByLabel(sourceLabel!, { exact: true })).toHaveValue(
      source,
    );
    if (language === "zh-TW")
      await info.attach("writing-traditional-failure.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
  });

const attachmentReader = (member = "7") =>
  `${account(member)}<div id="pt"><a href="${boardURL}">Music 5</a></div><div id="postlist"><h1 id="thread_subject">Autumn thread</h1><div id="post_101"><a id="postnum101">1</a><div class="pcb"><p>Authored reader with attachment.</p><ignore_js_op><span id="attach_51"><a href="forum.php?mod=attachment&aid=current-token&nothumb=yes">writing-context.txt</a></span><div id="attach_51_menu">55 Bytes, Downloads: 3</div></ignore_js_op></div></div></div>`;

for (const entry of ["return", "new"] as const)
  test(`J8.writing-download-${entry}: entering writing cancels a pending reader access check before binary dispatch`, async ({
    page,
  }, info) => {
    const reader = attachmentReader();
    const requests = await open(page, (url) =>
      url.searchParams.get("mod") === "post"
        ? form()
        : url.searchParams.get("mod") === "viewthread"
          ? reader
          : board(),
    );
    const editor = page.getByLabel("Complete source", { exact: true });
    if (entry === "return") {
      await page
        .getByRole("button", { name: "New thread", exact: true })
        .click();
      await editor.fill(source);
    }
    const original = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    if (entry === "return") {
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
    }
    await page
      .getByRole("link", { name: "Autumn thread", exact: true })
      .click();
    let release = () => {};
    let received = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const checking = new Promise<void>((resolve) => {
      received = resolve;
    });
    await page.route(
      (url) =>
        url.pathname === "/forum.php" &&
        url.searchParams.get("mod") === "viewthread",
      async (route) => {
        requests.push({
          url: route.request().url(),
          method: route.request().method(),
        });
        received();
        await held;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ document: reader }),
        });
      },
    );
    await page
      .getByRole("button", {
        name: "Download writing-context.txt",
        exact: true,
      })
      .click();
    await checking;
    await page
      .getByRole("button", {
        name: entry === "return" ? "Return to writing" : "New thread",
        exact: true,
      })
      .click();
    await expect(editor).toHaveValue(entry === "return" ? source : "");
    const completion = page.waitForResponse(
      (response) =>
        new URL(response.url()).searchParams.get("mod") === "viewthread",
    );
    release();
    await (await completion).finished();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      requests.filter(
        (request) =>
          new URL(request.url).searchParams.get("mod") === "attachment",
      ),
    ).toHaveLength(0);
    expect(
      await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
            .writing,
      ),
    ).toEqual(
      original ??
        expect.objectContaining({
          action: "new-thread",
          source: "",
          board: expect.objectContaining({ id: "5" }),
        }),
    );
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "File download", exact: true }),
    ).toHaveCount(0);
    expect(requests.every((request) => request.method === "GET")).toBe(true);
    await info.attach("writing-cancels-pending-download.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

// Failure inventory: a download preflight observes a changed/expired actor while
// original writing is hidden; that observation must pause the original context.
for (const member of ["8", "guest"])
  test(`J11.download-account-writing-${member}: fresh attachment access pauses retained original-account writing`, async ({
    page,
  }, info) => {
    let current = "7";
    const requests = await open(page, (url) =>
      url.searchParams.get("mod") === "post"
        ? form()
        : url.searchParams.get("mod") === "viewthread"
          ? attachmentReader(current)
          : board(),
    );
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const editor = page.getByLabel("Complete source", { exact: true });
    await editor.fill(source);
    const original = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Autumn thread", exact: true })
      .click();
    current = member;
    await page
      .getByRole("button", {
        name: "Download writing-context.txt",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("This navigation snapshot is unavailable.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(page.getByText(/Sending paused/)).toBeVisible();
    await expect(editor).toHaveValue(source);
    expect(
      await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
            .writing,
      ),
    ).toEqual(original);
    expect(
      requests.filter(
        (request) =>
          new URL(request.url).searchParams.get("mod") === "attachment",
      ),
    ).toHaveLength(0);
    expect(requests.every((request) => request.method === "GET")).toBe(true);
    await info.attach("download-account-retained-writing.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
// This runs at the existing complete-app external HTTP seam.
const searchForm = (member = "7") =>
  `${account(member)}<form method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="SEARCH-SECRET"><input type="hidden" name="searchsubmit" value="yes"><label for="keywords">Keywords</label><input id="keywords" name="srchtxt" type="text"><label for="author">Author</label><input id="author" name="srchuname" type="text"><select name="srchfrom"><option value="0">Any time</option></select><select name="orderby"><option value="lastpost">Last reply</option></select><label><input type="radio" name="ascdesc" value="desc" checked>Descending</label><select name="srchfid[]" multiple><option value="all" selected>All boards</option></select><button type="submit">Search</button></form>`;

test("J5.search-writing: edited search criteria and the sole writing context share recovery without replaying a search", async ({
  page,
}, info) => {
  const requests = await open(page, (url) =>
    url.pathname === "/search.php"
      ? searchForm()
      : url.searchParams.get("mod") === "post"
        ? form()
        : board(),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .getByLabel("Keywords", { exact: true })
    .fill("unsent autumn query");
  await page.getByLabel("Author", { exact: true }).fill("Composer Nine");
  const searchBefore = await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    return Object.values(record.entries).find(
      (entry) =>
        (entry as { result?: { kind?: string } }).result?.kind === "search",
    );
  });
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  await page.reload();
  await expect(editor).toHaveValue(source);
  expect(
    await editor.evaluate((node) => ({
      start: (node as HTMLTextAreaElement).selectionStart,
      end: (node as HTMLTextAreaElement).selectionEnd,
      direction: (node as HTMLTextAreaElement).selectionDirection,
    })),
  ).toEqual(original.selection);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "unsent autumn query",
  );
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue(
    "Composer Nine",
  );
  const recovered = await page.evaluate(() => {
    const raw = sessionStorage.getItem("tsdm.workspace.recovery")!;
    const record = JSON.parse(raw);
    return {
      raw,
      writing: record.writing,
      schema: record.schema,
      keys: Object.keys(sessionStorage).filter((key) =>
        key.includes("recovery"),
      ),
      search: Object.values(record.entries).find(
        (entry) =>
          (entry as { result?: { kind?: string } }).result?.kind === "search",
      ),
    };
  });
  expect(recovered.writing).toEqual(original);
  expect(recovered.search).toEqual(searchBefore);
  expect(recovered.schema).toBe(2);
  expect(recovered.keys).toEqual(["tsdm.workspace.recovery"]);
  expect(recovered.raw).not.toContain("SEARCH-SECRET");
  expect(recovered.raw).not.toContain("SECRET-TOKEN");
  expect(
    requests.filter((request) => request.url.includes("search.php")),
  ).toHaveLength(1);
  expect(requests.every((request) => request.method === "GET")).toBe(true);
  await info.attach("search-and-writing-recovery.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.composing-search: Search preparation waits for final composition input before replacing writing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page, (url) =>
    url.pathname === "/search.php"
      ? searchForm()
      : url.searchParams.get("mod") === "post"
        ? form()
        : board(),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(source);
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  await editor.dispatchEvent("compositionstart", { data: "中" });
  await page
    .getByRole("combobox", { name: "Main destinations", exact: true })
    .selectOption("search");
  await expect(editor).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Search", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Finish the current input composition/),
  ).toBeVisible();
  expect(requests.filter((r) => r.url.includes("search.php"))).toHaveLength(0);
  // Explicit synthetic input models browser end-event/final-input ordering; this is not actual native IME evidence.
  await editor.evaluate((e, value) => {
    const element = e as HTMLTextAreaElement;
    element.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中文" }),
    );
    element.value = value;
    element.setSelectionRange(value.length, value.length);
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "中文",
        inputType: "insertCompositionText",
        isComposing: false,
      }),
    );
  }, source + "中文");
  await expect(editor).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Search", exact: true, level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source + "中文");
  const retained = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(retained.id).toBe(original.id);
  expect(retained.account).toEqual(original.account);
  expect(retained.board).toEqual(original.board);
  expect(retained.selection.start).toBe((source + "中文").length);
  expect(requests).toHaveLength(3);
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("composition-search-final-source.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const member of ["8", "guest"])
  test(`J11.search-account-writing-${member}: Search account observations pause and preserve original writing`, async ({
    page,
  }, info) => {
    const requests = await open(page, (url) =>
      url.pathname === "/search.php"
        ? searchForm(member)
        : url.searchParams.get("mod") === "post"
          ? form()
          : board(),
    );
    await page.getByRole("button", { name: "New thread", exact: true }).click();
    const editor = page.getByLabel("Complete source", { exact: true });
    await editor.fill(source);
    const original = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect
      .poll(() => requests.filter((r) => r.url.includes("search.php")).length)
      .toBe(1);
    await expect(page.getByText(/Reading current forum content/)).toHaveCount(
      0,
    );
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(page.getByText(/Sending paused/)).toBeVisible();
    await expect(editor).toHaveValue(source);
    const retained = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(retained).toEqual(original);
    expect(requests.every((r) => r.method === "GET")).toBe(true);
    await info.attach(`search-account-${member}-retained.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J5.schema1-search-writing: prewriting Search results and edited criteria migrate without replay before sharing writing recovery", async ({
  page,
}, info) => {
  const requests = await open(page, (url) =>
    url.pathname === "/search.php"
      ? searchForm()
      : url.searchParams.get("mod") === "post"
        ? form()
        : board(),
  );
  let posts = 0;
  await page.route("**/search.php*", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    posts++;
    await route.fulfill({
      contentType: "text/html",
      body: `${account()}<div class="sttl"><h2>One authored result</h2><a href="search.php?mod=forum&adv=yes&searchid=581">Advanced search</a></div><div id="threadlist" class="slst"><ul><li class="pbw"><h3><a href="forum.php?mod=viewthread&tid=42">Autumn result</a></h3><p class="xg1">1 reply · 4 views</p><p>Literal result excerpt</p><p><span>2026-10-19</span><span><a href="home.php?mod=space&uid=9">Composer Nine</a></span><span><a href="forum.php?mod=forumdisplay&fid=5">Music</a></span></p></li></ul></div><div class="pg"><strong>1</strong></div>`,
    });
  });
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  await page
    .getByRole("region", { name: "Search overview", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Autumn result", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Keywords", { exact: true }).fill("winter unsent");
  const before = await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    record.schema = 1;
    delete record.writing;
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
    return record;
  });
  const reads = requests.length;
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Autumn result", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
    "winter unsent",
  );
  await expect(
    page.getByRole("list", { name: "Effective search criteria", exact: true }),
  ).toContainText("Keywords: autumn");
  expect(posts).toBe(1);
  expect(requests).toHaveLength(reads);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  const migrated = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(migrated.schema).toBe(2);
  expect(migrated.writing.source).toBe(source);
  for (const [key, entry] of Object.entries(before.entries))
    expect(migrated.entries[key].result).toEqual(
      (entry as { result: unknown }).result,
    );
  expect(posts).toBe(1);
  expect(JSON.stringify(migrated)).not.toContain("SEARCH-SECRET");
  await info.attach("schema1-search-and-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J11.search-refresh-writing: a fresh changed-account Search form stays usable while original writing pauses", async ({
  page,
}, info) => {
  let member = "7";
  const requests = await open(page, (url) =>
    url.pathname === "/search.php"
      ? searchForm(member)
      : url.searchParams.get("mod") === "post"
        ? form()
        : board(),
  );
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
  member = "8";
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByText("Signed in as Writer 8", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("search-refresh-original-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const member of ["guest", "8"])
  for (const action of ["check", "copy"])
    for (const cancel of [false, true])
      test(`J11.account-observation-${action}-${member}-${cancel ? "return" : "settled"}: accepted account changes survive view cancellation and reload without replacing original writing`, async ({
        page,
      }, info) => {
        const requests = await open(page);
        await page
          .getByRole("button", { name: "New thread", exact: true })
          .click();
        await page.getByLabel("Complete source", { exact: true }).fill(source);
        const original = await page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
              .writing,
        );
        let release: () => void = () => {};
        let waiting = false;
        await page.route("**/*mod=post*", async (route) => {
          requests.push({
            url: route.request().url(),
            method: route.request().method(),
          });
          waiting = true;
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          await route.fulfill({
            contentType: "text/html; charset=utf-8",
            body: form("5", member),
          });
        });
        await page
          .getByRole("button", {
            name:
              action === "copy"
                ? "Prepare text copy for current account"
                : "Check current account and form",
            exact: true,
          })
          .click();
        await expect.poll(() => waiting).toBe(true);
        if (cancel)
          await page
            .getByRole("button", { name: "Return to writing", exact: true })
            .click();
        const response = page.waitForResponse(
          (result) => new URL(result.url()).searchParams.get("mod") === "post",
        );
        release();
        await response;
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        await info.attach("accepted-account-observation.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
        await expect(page.getByText(/Sending paused/)).toBeVisible();
        if (cancel)
          await expect(
            page.getByRole("button", {
              name: "Replace with text copy",
              exact: true,
            }),
          ).toHaveCount(0);
        await expect(
          page.getByLabel("Complete source", { exact: true }),
        ).toHaveValue(source);
        await expect
          .poll(() =>
            page.evaluate(() => {
              const saved = JSON.parse(
                sessionStorage.getItem("tsdm.workspace.recovery")!,
              );
              return Object.values(saved.entries).every(
                (entry) => !(entry as { result: unknown }).result,
              );
            }),
          )
          .toBe(true);
        const invalidated = await page.evaluate(() =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
        );
        expect(invalidated.writing).toEqual(original);
        expect(requests).toHaveLength(3);
        expect(requests.every((request) => request.method === "GET")).toBe(
          true,
        );
        await page.reload();
        await expect(
          page.getByLabel("Complete source", { exact: true }),
        ).toHaveValue(source);
        await page
          .getByRole("button", { name: "Return to reading", exact: true })
          .click();
        await expect(
          page.getByRole("link", { name: "Autumn thread", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText("This navigation snapshot is unavailable.", {
            exact: true,
          }),
        ).toBeVisible();
        expect(requests).toHaveLength(3);
        await info.attach("invalidated-account-after-reload.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
        await info.attach("account-observation-receipt.json", {
          body: Buffer.from(
            JSON.stringify(
              { member, action, cancel, original, invalidated, requests },
              null,
              2,
            ),
          ),
          contentType: "application/json",
        });
      });
