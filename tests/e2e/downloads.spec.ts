import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
import { createHash } from "node:crypto";
const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const attachmentURL = `${origin}/forum.php?mod=attachment&aid=current-token&nothumb=yes`;
const file = Buffer.from(
  "TSDM authored download fixture\nExact bytes: 0123456789\n",
  "utf8",
);
const filename = "listening-notes.txt";
const member =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
function thread(url = attachmentURL, name = filename) {
  return `${member}<div id="postlist"><h1 id="thread_subject">Attachment listening notes</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum101" href="${threadURL}#pid101">1</a><div class="pcb"><p>Authored ordinary attachment.</p><ignore_js_op><span id="attach_51"><a href="${url}">${name}</a></span><div id="attach_51_menu">55 Bytes, Downloads: 3</div></ignore_js_op></div></div></div>`;
}
function listedAttachmentThread(url = attachmentURL) {
  return `${member}<div id="postlist"><h1 id="thread_subject">Attachment listening notes</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum101" href="${threadURL}#pid101">1</a><div class="pcb"><div id="postmessage_101">Authored attachment in native file list.</div><div class="pattl"><ignore_js_op><dl class="tattl"><dt></dt><dd><p class="attnm"><a href="${url}" onmouseover="showMenu({'ctrlid':this.id,'pos':'12'})" id="aid51" target="_blank">${filename}</a></p><div class="tip tip_4" id="aid51_menu" style="display:none">Uploaded earlier. Click filename to download.</div><p>55 Bytes, 下载次数: 3</p><p>售价: <strong>9 天使币</strong> [<a href="forum.php?mod=misc&amp;action=viewattachpayments&amp;aid=51" onclick="showWindow('attachpay', this.href)" target="_blank">记录</a>]</p></dd></dl></ignore_js_op></div></div></div></div>`;
}
interface FixtureOptions {
  file?: {
    status?: number;
    contentType?: string;
    body?: Buffer;
    headers?: Record<string, string>;
    abort?: boolean;
  };
  currentThread?: () => string;
  initialThread?: string;
  nativeScript?: string;
  beforeFile?: () => Promise<void>;
  beforeThread?: (reads: number) => Promise<void>;
}
async function open(page: Page, options: FixtureOptions = {}) {
  const requests: string[] = [];
  const source = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__workspace-fixture.js`)
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: source,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<meta charset="utf-8"><body>Native forum<script>${options.nativeScript ?? ""}</script><script src="${origin}/__workspace-fixture.js"></script></body>`,
      });
    requests.push(request.url());
    const url = new URL(request.url());
    if (url.pathname === "/search.php")
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          document: `${member}<form method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="private-token"><input type="hidden" name="searchsubmit" value="yes"><label for="keywords">Keywords</label><input id="keywords" name="srchtxt" type="text"><label for="author">Author</label><input id="author" name="srchuname" type="text"></form>`,
        }),
      });
    if (url.searchParams.get("mod") === "attachment") {
      await options.beforeFile?.();
      if (options.file?.abort) return route.abort("failed");
      return route.fulfill({
        status: options.file?.status ?? 200,
        contentType: options.file?.contentType ?? "application/octet-stream",
        headers: options.file?.headers ?? {
          "content-disposition": `attachment; filename="${filename}"`,
          "content-length": String((options.file?.body ?? file).length),
        },
        body: options.file?.body ?? file,
      });
    }
    await options.beforeThread?.(
      requests.filter(
        (value) => new URL(value).searchParams.get("mod") === "viewthread",
      ).length,
    );
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          requests.length > 1 && options.currentThread
            ? options.currentThread()
            : (options.initialThread ?? thread()),
      }),
    });
  });
  await page.goto(threadURL);
  await expect(
    page.getByRole("heading", {
      name: "Attachment listening notes",
      exact: true,
    }),
  ).toBeVisible();
  return requests;
}
test("J8.download-ordinary-file: fresh offered link delivers exact authored file through real browser save", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const requests = await open(page);
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save file", exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe(filename);
  const path = info.outputPath(filename);
  await download.saveAs(path);
  expect(await download.failure()).toBeNull();
  const saved = readFileSync(path);
  expect(saved.equals(file)).toBe(true);
  expect(saved.length).toBe(55);
  const sha256 = createHash("sha256").update(saved).digest("hex");
  expect(sha256).toBe(
    "433506ebc4e78b00d49f567d12dc6d94da21cd819bf2faf3a36e43ffb18e6933",
  );
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
    attachmentURL,
  ]);
  await expect(page.getByText(/Browser save requested/)).toBeVisible();
  await expect(page.getByText(/Download complete|File saved/)).toHaveCount(0);
  await info.attach("saved-file.txt", {
    body: saved,
    contentType: "text/plain",
  });
  await info.attach("file-receipt.json", {
    body: Buffer.from(
      JSON.stringify({
        name: download.suggestedFilename(),
        bytes: saved.length,
        sha256,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("download-outcome.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const [name, body, contentType, message] of [
  [
    "login-html",
    '<html><body><form id="loginform"><input name="password"></form></body></html>',
    "text/html",
    "login",
  ],
  [
    "challenge-html",
    "<html><title>Security verification</title><body>CAPTCHA</body></html>",
    "application/octet-stream",
    "challenge",
  ],
  [
    "permission-html",
    '<html><body><div id="messagetext"><p>抱歉，您没有权限下载该附件</p></div></body></html>',
    "application/octet-stream",
    "permission",
  ],
  [
    "paid-thread-html",
    '<html><body><div id="messagetext"><p>附件所在主题需要付费，请您付费后下载</p></div></body></html>',
    "text/html",
    "payment",
  ],
  [
    "unrecognized-html",
    "<html><body>Maintenance screen</body></html>",
    "text/html",
    "HTML",
  ],
  ["json-error", '{"error":"attachment missing"}', "application/json", "file"],
] as const) {
  test(`J8.download-refusals-${name}: response cannot become a saved file`, async ({
    page,
  }, info) => {
    const downloads: string[] = [];
    page.on("download", (value) => downloads.push(value.suggestedFilename()));
    const requests = await open(page, {
      file: { body: Buffer.from(body), contentType },
    });
    await page
      .getByRole("button", { name: `Download ${filename}`, exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "File download" }).getByRole("alert"),
    ).toContainText(new RegExp(message, "i"));
    await expect(
      page.getByRole("button", { name: "Save file", exact: true }),
    ).toHaveCount(0);
    expect(downloads).toEqual([]);
    expect(
      requests.filter(
        (url) => new URL(url).searchParams.get("mod") === "attachment",
      ),
    ).toHaveLength(1);
    await info.attach(`${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
test("J8.download-interrupted: failed transfer is explicit and never retried automatically", async ({
  page,
}) => {
  const requests = await open(page, { file: { abort: true } });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("interrupted");
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
  expect(
    requests.filter(
      (url) => new URL(url).searchParams.get("mod") === "attachment",
    ),
  ).toHaveLength(1);
});
test("J8.download-missing-file: HTTP missing file is explicit without Save", async ({
  page,
}) => {
  await open(page, {
    file: {
      status: 404,
      body: Buffer.from("File missing"),
      contentType: "text/plain",
    },
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(/missing/i);
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
});
test("J8.download-incomplete-length: incomplete returned bytes cannot become ready", async ({
  page,
}) => {
  await open(page, { file: { headers: { "content-length": "120" } } });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    /incomplete|interrupted/i,
  );
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
});

test("J8.download-reader-link: activating the offered filename uses checked delivery", async ({
  page,
}) => {
  const requests = await open(page);
  await page.getByRole("link", { name: filename, exact: true }).click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).hash).toMatch(/^#workspace=/);
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
    attachmentURL,
  ]);
});
test("J8.download-current-access: fresh offered token replaces an old ordinary attachment URL", async ({
  page,
}, info) => {
  const fresh = attachmentURL.replace("current-token", "fresh-access-token");
  const requests = await open(page, {
    currentThread: () => thread(fresh),
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save file", exact: true }).click();
  const download = await event;
  const path = info.outputPath("fresh-access.txt");
  await download.saveAs(path);
  expect(await download.failure()).toBeNull();
  expect(readFileSync(path).equals(file)).toBe(true);
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
    fresh,
  ]);
  await info.attach("fresh-access-file.txt", {
    body: readFileSync(path),
    contentType: "text/plain",
  });
});
test("J8.download-current-refusal: purchase-only current link blocks download without purchasing", async ({
  page,
}) => {
  const requests = await open(page, {
    initialThread: listedAttachmentThread(),
    currentThread: () =>
      listedAttachmentThread(
        `${origin}/forum.php?mod=misc&action=attachpay&aid=51`,
      ).replace('id="aid51"', "onclick=\"showWindow('attachpay',this.href)\""),
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "No purchase was attempted",
  );
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
  ]);
});
test("J8.download-account-change: current access belongs to a different account", async ({
  page,
}) => {
  const requests = await open(page, {
    currentThread: () =>
      thread()
        .replace("uid=7", "uid=8")
        .replace("Reader Seven", "Reader Eight"),
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("account changed");
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
  ]);
});
for (const [label, url] of [
  ["foreign-origin", "https://example.com/forum.php?mod=attachment&aid=token"],
  ["purchase-action", `${attachmentURL}&action=pay`],
  ["repeated-mode", `${attachmentURL}&mod=misc`],
]) {
  test(`J8.download-unsupported-${label}: unsupported offered link is never a download capability`, async ({
    page,
  }) => {
    const requests = await open(page, { initialThread: thread(url) });
    await expect(
      page.getByRole("button", { name: `Download ${filename}`, exact: true }),
    ).toHaveCount(0);
    expect(requests).toHaveLength(1);
  });
}
test("J8.download-ambiguous-identity: duplicate native identity cannot grant download capability", async ({
  page,
}) => {
  await open(page, {
    initialThread: thread().replace(
      "</ignore_js_op>",
      `</ignore_js_op><ignore_js_op><span id="attach_51"><a href="${attachmentURL}">${filename}</a></span></ignore_js_op>`,
    ),
  });
  await expect(
    page.getByRole("button", { name: `Download ${filename}`, exact: true }),
  ).toHaveCount(0);
});

test("J8.download-restored-current-access: reload restores descriptors but never bytes or a save attempt", async ({
  page,
}) => {
  const requests = await open(page);
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  const count = requests.length;
  await page.reload();
  await expect(page.getByText(/Restored snapshot/)).toBeVisible();
  expect(requests).toHaveLength(count);
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  expect(requests.slice(count)).toEqual([
    `${threadURL}&tsdmapp=json`,
    attachmentURL,
  ]);
});
test("J8.download-stale-inflight: refresh to changed account invalidates a pending file response", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let changed = false;
  const requests = await open(page, {
    beforeFile: () => held,
    currentThread: () =>
      changed
        ? thread()
            .replace("uid=7", "uid=8")
            .replace("Reader Seven", "Reader Eight")
        : thread(),
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect.poll(() => requests.includes(attachmentURL)).toBe(true);
  changed = true;
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByText("Signed in as Reader Eight", { exact: true }),
  ).toBeVisible();
  release();
  await expect(page.getByRole("region", { name: "File download" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
});
test("J8.download-browser-cancelled: refused browser save never claims completed delivery", async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    acceptDownloads: false,
    offline: true,
  });
  const page = await context.newPage();
  try {
    await open(page);
    await page
      .getByRole("button", { name: `Download ${filename}`, exact: true })
      .click();
    await expect(
      page.getByText("File ready to save", { exact: true }),
    ).toBeVisible();
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save file", exact: true }).click();
    const download = await event;
    expect(await download.failure()).not.toBeNull();
    await expect(page.getByText(/Browser save requested/)).toBeVisible();
    await expect(
      page.getByText(/cannot confirm whether the file was saved or cancelled/),
    ).toBeVisible();
    await expect(page.getByText(/Download complete|File saved/)).toHaveCount(0);
    await info.attach("refused-browser-save.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("refused-browser-save.json", {
      body: Buffer.from(
        JSON.stringify({
          name: download.suggestedFilename(),
          failure: await download.failure(),
          delivery: "unconfirmed",
        }),
      ),
      contentType: "application/json",
    });
  } finally {
    await context.close();
  }
});
test("J8.download-untrusted-restoration: malformed attachment descriptor cannot crash or grant download", async ({
  page,
}) => {
  const requests = await open(page, {
    nativeScript: `const raw=sessionStorage.getItem('tsdm.workspace.recovery');if(raw){const record=JSON.parse(raw);for(const entry of Object.values(record.entries)){if(entry.result?.kind==='thread')entry.result.thread.posts[0].attachments={length:1};}sessionStorage.setItem('tsdm.workspace.recovery',JSON.stringify(record));}`,
  });
  await page.reload();
  await expect(
    page.getByText("This navigation snapshot is unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Download ${filename}`, exact: true }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

for (const [label, bytes] of [
  [
    "comment-prefixed-html",
    Buffer.from(
      '<!-- forum response --><html><body><form id="loginform">Sign in</form></body></html>',
    ),
  ],
  [
    "utf16-html",
    Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(
        '<html><body><form id="loginform">Sign in</form></body></html>',
        "utf16le",
      ),
    ]),
  ],
] as const) {
  test(`J8.download-refusals-${label}: mislabeled HTML is not file content`, async ({
    page,
  }) => {
    await open(page, {
      file: { body: bytes, contentType: "application/octet-stream" },
    });
    await page
      .getByRole("button", { name: `Download ${filename}`, exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(/login|HTML/);
    await expect(
      page.getByRole("button", { name: "Save file", exact: true }),
    ).toHaveCount(0);
  });
}
test("J8.download-reentrant-link: repeated activation cannot duplicate an in-flight file request", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(page, { beforeFile: () => held });
  await page.getByRole("link", { name: filename, exact: true }).click();
  await expect
    .poll(() => requests.filter((url) => url === attachmentURL).length)
    .toBe(1);
  await page.getByRole("link", { name: filename, exact: true }).click();
  release();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  expect(requests.filter((url) => url === attachmentURL)).toHaveLength(1);
});

test("J8.download-current-cache: access verification bypasses a cached old-account reader response", async ({
  browser,
}) => {
  let count = 0;
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: threadURL,
      readHeaders: { "cache-control": "max-age=3600" },
      document: () => {
        count++;
        return count === 1
          ? thread()
          : thread()
              .replace("uid=7", "uid=8")
              .replace("Reader Seven", "Reader Eight");
      },
    },
    async (page, reads) => {
      await page.goto(threadURL);
      await expect(
        page.getByText("Signed in as Reader Seven", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: `Download ${filename}`, exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText("account changed");
      expect(reads).toHaveLength(2);
      await expect(
        page.getByRole("button", { name: "Save file", exact: true }),
      ).toHaveCount(0);
    },
  );
});

test("J8.download-passive-return-cancels: Back while access is being checked cannot start a later file request", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const withNext = thread().replace(
    "Authored ordinary attachment.",
    `<a href="${threadURL}&page=2">Next thread page</a>`,
  );
  const requests = await open(page, {
    initialThread: withNext,
    currentThread: () => withNext,
    beforeThread: (reads) => (reads === 3 ? held : Promise.resolve()),
  });
  await page
    .getByRole("link", { name: "Next thread page", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(2);
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(3);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText(/Restored snapshot/)).toBeVisible();
  release();
  await expect(page.getByRole("region", { name: "File download" })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect
    .poll(
      () =>
        requests.filter(
          (url) => new URL(url).searchParams.get("mod") === "viewthread",
        ).length,
    )
    .toBe(4);
  expect(
    requests.filter(
      (url) => new URL(url).searchParams.get("mod") === "attachment",
    ),
  ).toEqual([]);
});

test("J8.download-native-wrapper: supported attachment wrapper renders without implementation-detail notice", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByText("Unsupported formatting (ignore_js_op)", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: filename, exact: true }),
  ).toBeVisible();
});
test("J8.download-deep-post: receiving a file leaves its Save action at the selected attachment", async ({
  page,
}, info) => {
  const long = thread().replace(
    "Authored ordinary attachment.",
    Array.from(
      { length: 80 },
      (_, index) =>
        `<p>Listening detail ${index + 1}: discussion of instrumentation and arrangement.</p>`,
    ).join(""),
  );
  await open(page, { initialThread: long, currentThread: () => long });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toBeInViewport();
  await info.attach("deep-attachment.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J8.download-long-html-preamble: an opaque MIME with long markup preamble cannot be admitted as file bytes", async ({
  page,
}) => {
  await open(page, {
    file: {
      body: Buffer.from(
        "<!--" +
          " ".repeat(20000) +
          "--><html><body>Login required</body></html>",
      ),
      contentType: "application/octet-stream",
    },
  });
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(/HTML/);
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
});

test("J8.download-native-paid-list: accessible listed file outside the Post body saves exact bytes without touching payment records", async ({
  page,
}, info) => {
  const fresh = attachmentURL.replace("current-token", "fresh-listed-token");
  const requests = await open(page, {
    initialThread: listedAttachmentThread(),
    currentThread: () => listedAttachmentThread(fresh),
  });
  await expect(page.getByText("售价:", { exact: false })).toContainText(
    "9 天使币",
  );
  await page
    .getByRole("button", { name: `Download ${filename}`, exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save file", exact: true }).click();
  const download = await event;
  const path = info.outputPath(filename);
  await download.saveAs(path);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(filename);
  const saved = readFileSync(path);
  expect(saved.equals(file)).toBe(true);
  expect(createHash("sha256").update(saved).digest("hex")).toBe(
    "433506ebc4e78b00d49f567d12dc6d94da21cd819bf2faf3a36e43ffb18e6933",
  );
  expect(requests).toEqual([
    `${threadURL}&tsdmapp=json`,
    `${threadURL}&tsdmapp=json`,
    fresh,
  ]);
  await info.attach("listed-paid-file.txt", {
    body: saved,
    contentType: "text/plain",
  });
  await info.attach("listed-paid-receipt.json", {
    body: Buffer.from(
      JSON.stringify({
        name: download.suggestedFilename(),
        bytes: saved.length,
        sha256: createHash("sha256").update(saved).digest("hex"),
        paymentRequests: 0,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("listed-paid-save.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J8.download-conflicting-native-identities: a listed filename cannot inherit a different containing attachment identity", async ({
  page,
}) => {
  const requests = await open(page, {
    initialThread: listedAttachmentThread()
      .replace('<p class="attnm">', '<p class="attnm"><span id="attach_52">')
      .replace('</a></p><div class="tip', '</a></span></p><div class="tip'),
  });
  await expect(
    page.getByRole("button", { name: `Download ${filename}`, exact: true }),
  ).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

for (const [width, section] of [
  [1280, "Search"],
  [960, "Saved"],
  [375, "Notices"],
] as const) {
  test(`J8.download-section-cancel-${width}: leaving during the fresh access read prevents late binary dispatch`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests = await open(page, {
      beforeThread: (reads) => (reads === 2 ? held : Promise.resolve()),
    });
    const downloads: string[] = [];
    page.on("download", (download) =>
      downloads.push(download.suggestedFilename()),
    );
    await page
      .getByRole("button", { name: `Download ${filename}`, exact: true })
      .click();
    await expect.poll(() => requests.length).toBe(2);
    if (width === 375) {
      await page
        .getByRole("combobox", { name: "Main destinations", exact: true })
        .selectOption(section.toLowerCase());
    } else {
      await page.getByRole("button", { name: section, exact: true }).click();
    }
    await expect(
      page.getByRole("heading", { name: section, exact: true, level: 1 }),
    ).toBeVisible();
    const late = page.waitForResponse(
      (response) => response.url() === `${threadURL}&tsdmapp=json`,
    );
    release();
    await (await late).finished();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      requests.filter(
        (url) => new URL(url).searchParams.get("mod") === "attachment",
      ),
    ).toEqual([]);
    expect(downloads).toEqual([]);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Attachment listening notes",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save file", exact: true }),
    ).toHaveCount(0);
    expect(requests).toHaveLength(section === "Search" ? 3 : 2);
    await info.attach("section-cancel-requests.json", {
      body: Buffer.from(
        JSON.stringify({ width, section, requests, downloads }),
      ),
      contentType: "application/json",
    });
    await info.attach("section-cancel.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

for (const [
  language,
  downloadLabel,
  saveLabel,
  ready,
  requested,
  sectionLabel,
] of [
  [
    "zh-CN",
    "下载",
    "保存文件",
    "文件已准备好，可以保存",
    "已请求浏览器保存。请在浏览器的下载记录中检查是否完成；本工作区无法确认文件是否已保存或已取消。",
    "收藏",
  ],
  [
    "zh-TW",
    "下載",
    "儲存檔案",
    "檔案已準備好，可以儲存",
    "已要求瀏覽器儲存。請在瀏覽器的下載紀錄中檢查是否完成；本工作區無法確認檔案是否已儲存或已取消。",
    "收藏",
  ],
] as const) {
  test(`J8.download-appearance-${language}: appearance changes localize controls and preserve a prepared exact file`, async ({
    page,
  }, info) => {
    const paid = language === "zh-TW";
    const requests = await open(page, {
      initialThread: paid ? listedAttachmentThread() : thread(),
    });
    await page
      .getByRole("button", { name: `Download ${filename}`, exact: true })
      .click();
    await expect(
      page.getByText("File ready to save", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#text-size").fill(paid ? "150" : "70");
    await page
      .getByRole("radio", { name: paid ? "Dark" : "Mono", exact: true })
      .check();
    await page.locator("#interface-language").selectOption(language);
    await page.keyboard.press("Escape");
    if (paid) await page.setViewportSize({ width: 375, height: 900 });
    await expect(
      page.getByRole("button", {
        name: `${downloadLabel} ${filename}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(ready, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Attachment listening notes",
        exact: true,
      }),
    ).toBeVisible();
    if (paid)
      await expect(page.getByText(/售价: 9 天使币/).last()).toBeVisible();
    expect(requests).toHaveLength(3);
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: saveLabel, exact: true }).click();
    const download = await event;
    const path = info.outputPath(filename);
    await download.saveAs(path);
    const saved = readFileSync(path);
    expect(saved.equals(file)).toBe(true);
    expect(saved.length).toBe(55);
    expect(download.suggestedFilename()).toBe(filename);
    const sha256 = createHash("sha256").update(saved).digest("hex");
    expect(sha256).toBe(
      "433506ebc4e78b00d49f567d12dc6d94da21cd819bf2faf3a36e43ffb18e6933",
    );
    await expect(page.getByText(requested, { exact: true })).toBeVisible();
    await info.attach("localized-saved-file.txt", {
      body: saved,
      contentType: "text/plain",
    });
    await info.attach("localized-file-receipt.json", {
      body: Buffer.from(
        JSON.stringify({
          language,
          paid,
          filename,
          bytes: saved.length,
          sha256,
          requests,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach("localized-save.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    if (paid)
      await page
        .getByRole("combobox", { name: "主要導覽", exact: true })
        .selectOption("saved");
    else
      await page
        .getByRole("button", { name: sectionLabel, exact: true })
        .click();
    await page.goBack();
    await expect(
      page.getByRole("heading", {
        name: "Attachment listening notes",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: saveLabel, exact: true }),
    ).toHaveCount(0);
    expect(requests).toHaveLength(3);
  });
}

for (const [language, downloadLabel, forbidden, message] of [
  ["zh-CN", "下载", "保存文件", "论坛拒绝了下载权限。没有可保存的文件。"],
  ["zh-TW", "下載", "儲存檔案", "論壇拒絕了下載權限。沒有可儲存的檔案。"],
] as const) {
  test(`J8.download-localized-refusal-${language}: a refused file explains failure in the interface language`, async ({
    page,
  }, info) => {
    const requests = await open(page, {
      file: {
        status: 403,
        contentType: "text/html",
        body: Buffer.from("<p>permission refused</p>"),
      },
    });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption(language);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", {
        name: `${downloadLabel} ${filename}`,
        exact: true,
      })
      .click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: forbidden, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Authored ordinary attachment.", { exact: true }),
    ).toBeVisible();
    expect(requests).toEqual([
      `${threadURL}&tsdmapp=json`,
      `${threadURL}&tsdmapp=json`,
      attachmentURL,
    ]);
    await info.attach("localized-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

const inlineImageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
  "base64",
);
const inlineImageURL = `${origin}/forum.php?mod=attachment&aid=image-token&noupdate=yes`;
const inlineDownloadURL = `${origin}/forum.php?mod=attachment&aid=image-token&nothumb=yes`;
function nativeInlineImageThread(
  change: (profile: string) => string = (body) => body,
) {
  const profile = `<ignore_js_op><img id="aimg_88" aid="88" src="static/image/common/none.gif" file="${inlineImageURL}" zoomfile="${inlineImageURL}&nothumb=yes" class="zoom" alt="Uploaded fixture image" onclick="fetch('https://effects.example/image-click')" onmouseover="fetch('https://effects.example/image-hover')"><div id="aimg_88_menu" style="display:none"><p><strong>fixture-image.png</strong> <em>(70 Bytes)</em></p><p><a href="${inlineDownloadURL}" target="_blank">Download attachment</a></p><a id="savephoto_88" href="javascript:;" onclick="fetch('https://effects.example/save-photo')">Save photo</a><a href="forum.php?mod=ajax&amp;action=deleteattach&amp;aid=88&amp;fid=5" onclick="fetch('https://effects.example/delete')">Delete</a></div></ignore_js_op>`;
  return `${member}<div id="postlist"><h1 id="thread_subject">Attachment listening notes</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum101" href="${threadURL}#pid101">1</a><div class="pcb"><p>Native inline image fixture.</p>${change(profile)}</div></div></div>`;
}
test("J8.native-inline-image: same-ID direct filename renders the offered image and delivers exact bytes without native handlers", async ({
  page,
}, info) => {
  const requests = await open(page, {
    initialThread: nativeInlineImageThread(),
    currentThread: () => nativeInlineImageThread(),
    file: {
      body: inlineImageBytes,
      contentType: "image/png",
      headers: {
        "content-disposition": 'attachment; filename="fixture-image.png"',
        "content-length": String(inlineImageBytes.length),
      },
    },
  });
  const img = page.getByRole("img", {
    name: "Uploaded fixture image",
    exact: true,
  });
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((node) => (node as HTMLImageElement).naturalWidth))
    .toBe(1);
  await expect(img).toHaveAttribute("src", inlineImageURL);
  await expect(img).not.toHaveAttribute("onclick");
  await expect(img).not.toHaveAttribute("onmouseover");
  const beforeClick = requests.length;
  await img.click();
  expect(requests).toHaveLength(beforeClick);
  await page
    .getByRole("button", { name: "Download fixture-image.png", exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save file", exact: true }).click();
  const download = await event,
    path = info.outputPath("fixture-image.png");
  await download.saveAs(path);
  expect(await download.failure()).toBeNull();
  const saved = readFileSync(path);
  expect(saved.equals(inlineImageBytes)).toBe(true);
  expect(download.suggestedFilename()).toBe("fixture-image.png");
  expect(requests.filter((url) => url === inlineDownloadURL)).toHaveLength(1);
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true);
  expect(requests.some((url) => url.includes("deleteattach"))).toBe(false);
  await info.attach("inline-image.png", {
    body: saved,
    contentType: "image/png",
  });
  await info.attach("inline-image-receipt.json", {
    body: Buffer.from(
      JSON.stringify({
        requests,
        filename: download.suggestedFilename(),
        bytes: saved.length,
        sha256: createHash("sha256").update(saved).digest("hex"),
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("inline-image-ui.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
for (const scenario of [
  {
    name: "missing-filename",
    change: (s: string) => s.replace("<strong>fixture-image.png</strong>", ""),
  },
  {
    name: "duplicate-filename",
    change: (s: string) =>
      s.replace(
        "<strong>fixture-image.png</strong>",
        "<strong>fixture-image.png</strong><strong>other.png</strong>",
      ),
  },
  {
    name: "numeric-id",
    change: (s: string) => s.replace('aid="88"', 'aid="89"'),
  },
  {
    name: "menu-id",
    change: (s: string) => s.replace('id="aimg_88_menu"', 'id="aimg_89_menu"'),
  },
  {
    name: "duplicate-image",
    change: (s: string) =>
      s.replace(
        '<div id="aimg_88_menu"',
        `<img id="aimg_88" aid="88" file="${inlineImageURL}" zoomfile="${inlineImageURL}&nothumb=yes"><div id="aimg_88_menu"`,
      ),
  },
  {
    name: "duplicate-menu",
    change: (s: string) =>
      s.replace(
        "</ignore_js_op>",
        `<div id="aimg_88_menu"><a href="${inlineDownloadURL}">fixture-image.png</a></div></ignore_js_op>`,
      ),
  },
  {
    name: "conflicting-direct-links",
    change: (s: string) =>
      s.replace(
        "</p>",
        `<a href="${inlineDownloadURL.replace("image-token", "different-token")}">other.png</a></p>`,
      ),
  },
  {
    name: "opaque-id",
    change: (s: string) =>
      s.replace(
        `href="${inlineDownloadURL}"`,
        `href="${inlineDownloadURL.replace("image-token", "different-token")}"`,
      ),
  },
  {
    name: "script-filename",
    change: (s: string) =>
      s.replace(
        `href="${inlineDownloadURL}"`,
        `onclick="nativeSavePhoto()" href="${inlineDownloadURL}"`,
      ),
  },
  {
    name: "foreign",
    change: (s: string) =>
      s.replace(
        `href="${inlineDownloadURL}"`,
        `href="https://foreign.example/forum.php?mod=attachment&aid=image-token&nothumb=yes"`,
      ),
  },
  {
    name: "zoom-token",
    change: (s: string) =>
      s.replace(
        `zoomfile="${inlineImageURL}&nothumb=yes"`,
        `zoomfile="${inlineImageURL.replace("image-token", "other-token")}&nothumb=yes"`,
      ),
  },
  {
    name: "zoom-flag",
    change: (s: string) =>
      s.replace(
        `zoomfile="${inlineImageURL}&nothumb=yes"`,
        `zoomfile="${inlineImageURL}&nothumb=no"`,
      ),
  },
  {
    name: "missing-no-update",
    change: (s: string) => s.replaceAll("&noupdate=yes", ""),
  },
  {
    name: "conflicting-file-profile",
    change: (s: string) =>
      s.replace(
        "</ignore_js_op>",
        `<span id="attach_88"><a href="${inlineDownloadURL.replace("image-token", "other-token")}">other.png</a></span></ignore_js_op>`,
      ),
  },
  {
    name: "permission",
    change: (s: string) =>
      s.replace("<ignore_js_op>", '<ignore_js_op class="attach_nopermission">'),
  },
]) {
  test(`J8.native-inline-image-${scenario.name}: ambiguous or unqualified profile cannot render an attachment endpoint or offer download`, async ({
    page,
  }, info) => {
    const requests = await open(page, {
      initialThread: nativeInlineImageThread(scenario.change),
    });
    await expect(page.getByRole("button", { name: /^Download / })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("img", { name: "Uploaded fixture image", exact: true }),
    ).toHaveCount(0);
    expect(
      requests.some(
        (url) => new URL(url).searchParams.get("mod") === "attachment",
      ),
    ).toBe(false);
    expect(
      requests.some(
        (url) =>
          url.includes("deleteattach") || url.includes("effects.example"),
      ),
    ).toBe(false);
    await info.attach("inline-profile-refusal.json", {
      body: Buffer.from(JSON.stringify({ scenario: scenario.name, requests })),
      contentType: "application/json",
    });
    await info.attach("inline-profile-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

// Failure-first recovery cases: positive state is produced only by normal decoding.
test("J8.inline-image-recovery: reader persists qualified descriptors through reload and revalidates deliberate download", async ({
  page,
}, info) => {
  const traffic: { url: string; method: string; type: string }[] = [];
  page.on("request", (r) =>
    traffic.push({ url: r.url(), method: r.method(), type: r.resourceType() }),
  );
  await open(page, {
    initialThread: nativeInlineImageThread(),
    currentThread: () => nativeInlineImageThread(),
    file: {
      body: inlineImageBytes,
      contentType: "image/png",
      headers: { "content-length": String(inlineImageBytes.length) },
    },
  });
  const img = page.getByRole("img", {
    name: "Uploaded fixture image",
    exact: true,
  });
  await expect
    .poll(() => img.evaluate((n) => (n as HTMLImageElement).naturalWidth))
    .toBe(1);
  const before = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  const start = traffic.length;
  await page.reload();
  await expect(page.getByText(/Restored snapshot/)).toBeVisible();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toHaveCount(0);
  await expect
    .poll(() => img.evaluate((n) => (n as HTMLImageElement).naturalWidth))
    .toBe(1);
  const recovered = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(recovered.entries).toEqual(before.entries);
  expect(
    traffic
      .slice(start)
      .filter((r) => ["fetch", "xhr"].includes(r.type) || r.method !== "GET"),
  ).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Save file", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Download fixture-image.png", exact: true })
    .click();
  await expect(
    page.getByText("File ready to save", { exact: true }),
  ).toBeVisible();
  expect(
    traffic
      .slice(start)
      .filter((r) => ["fetch", "xhr"].includes(r.type))
      .map((r) => r.url),
  ).toEqual([`${threadURL}&tsdmapp=json`, inlineDownloadURL]);
  await info.attach("image-recovery.json", {
    body: Buffer.from(JSON.stringify({ before, recovered, traffic })),
    contentType: "application/json",
  });
  await info.attach("image-recovery.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

// Negative-only hostile storage seam. Never used to manufacture a positive journey.
for (const mutation of [
  "missing-descriptor",
  "foreign-source",
  "wrong-endpoint",
  "wrong-aid",
  "missing-flag",
  "wrong-flag",
  "extra-query",
  "duplicate-query",
  "fragment",
  "empty-fragment",
  "empty-userinfo",
  "userinfo",
  "non-image-name",
  "duplicate-id",
  "duplicate-link",
  "conflicting-link",
  "offer-extra-query",
  "offer-duplicate-query",
  "offer-fragment",
  "offer-userinfo",
  "offer-wrong-flag",
  "event-attribute",
  "unknown-attribute",
]) {
  test(`J8.inline-image-recovery-hostile-${mutation}: reject and retain malformed record without authoring`, async ({
    page,
  }, info) => {
    const requests = await open(page, {
      initialThread: nativeInlineImageThread(),
      file: { body: inlineImageBytes, contentType: "image/png" },
    });
    const rejected = await page.evaluate((mutation) => {
      const key = "tsdm.workspace.recovery",
        record = JSON.parse(sessionStorage.getItem(key)!);
      interface StoredNode {
        tag?: string;
        attributes: Record<string, string>;
        children?: StoredNode[];
      }
      interface StoredPost {
        content: StoredNode[];
        attachments: { id: string; name: string; url: string }[];
      }
      const entries: {
        result?: { kind: string; thread: { posts: StoredPost[] } };
      }[] = Object.values(record.entries);
      const post = entries.find((entry) => entry.result?.kind === "thread")!
        .result!.thread.posts[0]!;
      const findImage = (nodes: StoredNode[]): StoredNode | undefined => {
        for (const n of nodes) {
          if (n.tag === "img") return n;
          const found = n.children && findImage(n.children);
          if (found) return found;
        }
      };
      const img = findImage(post.content)!,
        descriptor = post.attachments[0]!;
      const source = new URL(img.attributes.src!),
        offer = new URL(descriptor.url);
      if (mutation === "missing-descriptor") post.attachments = [];
      if (mutation === "foreign-source") source.hostname = "example.com";
      if (mutation === "wrong-endpoint") source.pathname = "/other.php";
      if (mutation === "wrong-aid") source.searchParams.set("aid", "different");
      if (mutation === "missing-flag") source.searchParams.delete("noupdate");
      if (mutation === "wrong-flag") source.searchParams.set("noupdate", "no");
      if (mutation === "extra-query")
        source.searchParams.set("action", "delete");
      if (mutation === "duplicate-query")
        source.searchParams.append("aid", "image-token");
      if (mutation === "fragment") source.hash = "fragment";
      if (mutation === "empty-fragment") source.hash = "#";
      if (mutation === "userinfo") source.username = "user";
      if (mutation === "non-image-name") descriptor.name = "file.txt";
      if (mutation === "duplicate-id")
        post.attachments.push({
          ...descriptor,
          url: descriptor.url.replace("image-token", "another-token"),
        });
      if (mutation === "duplicate-link")
        post.attachments.push({ ...descriptor, id: "89" });
      if (mutation === "conflicting-link")
        post.attachments.push({
          ...descriptor,
          id: "89",
          url: descriptor.url + "&action=pay",
        });
      if (mutation === "offer-extra-query")
        offer.searchParams.set("action", "pay");
      if (mutation === "offer-duplicate-query")
        offer.searchParams.append("aid", "image-token");
      if (mutation === "offer-fragment") offer.hash = "fragment";
      if (mutation === "offer-userinfo") offer.username = "user";
      if (mutation === "offer-wrong-flag")
        offer.searchParams.set("nothumb", "no");
      if (mutation === "event-attribute") img.attributes.onclick = "alert(1)";
      if (mutation === "unknown-attribute")
        img.attributes.file = img.attributes.src!;
      img.attributes.src =
        mutation === "empty-userinfo"
          ? source.href.replace("https://", "https://@")
          : source.href;
      descriptor.url = offer.href;
      const raw = JSON.stringify(record);
      sessionStorage.setItem(key, raw);
      return raw;
    }, mutation);
    const count = requests.length;
    await page.reload();
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBe(rejected);
    expect(requests).toHaveLength(count);
    await info.attach("retained-hostile-record.json", {
      body: Buffer.from(rejected),
      contentType: "application/json",
    });
    await info.attach("refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
