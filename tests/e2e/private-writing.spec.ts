import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const conversationURL = `${origin}/home.php?mod=space&do=pm&subop=view&touid=9`;
const sourceText =
  "Controlled private writing 中文\nSecond line https://example.test/";
const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
interface Server {
  member: string;
  failReadback?: boolean;
  refusePost?: boolean;
  duplicateStored?: boolean;
  wrongStoredSender?: boolean;
  alteredStoredText?: boolean;
  rawExtra?: string;
  nativeWhitespace?: boolean;
  formAlter?:
    "recipient" | "token" | "disabled" | "unknown" | "limit" | "target-id";
  pendingRecords: string[];
  gate?: Promise<void>;
  reads: string[];
  posts: { url: string; fields: [string, string][] }[];
  messages: { id: string; sender: string; source: string }[];
}
const servers = new WeakMap<Page, Server>();
function history(state: Server) {
  const rows = state.messages
    .map(
      (m) =>
        `<dl id="pmlist_${m.id}"><dd class="avt"><a href="home.php?mod=space&uid=${m.sender}">Avatar</a></dd><dd class="ptm">${m.sender === "7" ? '<span class="xi2 xw1">You</span>' : '<a class="xw1" href="home.php?mod=space&uid=9">Listener Nine</a>'}<br>${state.nativeWhitespace ? "\n" : ""}${m.id === "203" ? (state.rawExtra ?? "") : ""}${escape(m.source).replaceAll("\n", state.nativeWhitespace ? "<br>\n" : "<br>")}<br>${state.nativeWhitespace ? "\n" : ""}<span class="xg1"><span title="2026-11-04 17:00">now</span></span></dd></dl>`,
    )
    .join("");
  return `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer Seven</a></strong></div><div id="ct"><div class="tbmu pml">There are <span id="membernum">${state.messages.length}</span> messages with <a href="home.php?mod=space&uid=9">Listener Nine</a></div><div id="pm_ul" class="pml">${rows}</div><form id="pmform" method="post" action="home.php?mod=spacecp&ac=pm&op=send&pmid=101&daterange=0&handlekey=pmsend&pmsubmit=yes"><textarea name="message" rows="12"></textarea><button type="submit" name="pmsubmit" value="true">Send native</button><input type="hidden" name="formhash" value="AUTHORED_PRIVATE_TOKEN"><input type="hidden" name="topmuid" value="9"></form></div>`;
}
async function open(
  page: Page,
  start = conversationURL,
  initialMessages?: Server["messages"],
) {
  const state: Server = {
    member: "7",
    pendingRecords: [],
    reads: [],
    posts: [],
    messages: initialMessages ?? [
      {
        id: "101",
        sender: "9",
        source: "An independently authored incoming message.",
      },
    ],
  };
  servers.set(page, state);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/__private-writing.js"))
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    if (request.method() === "POST") {
      const fields = new URLSearchParams(request.postData() ?? "");
      state.posts.push({ url: request.url(), fields: [...fields] });
      if (new URL(request.url()).pathname === "/forum.php")
        return route.abort("connectionfailed");
      state.pendingRecords.push(
        await page.evaluate(
          () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
        ),
      );
      if (!state.refusePost)
        state.messages.push({
          id: "203",
          sender: state.wrongStoredSender ? "9" : state.member,
          source: state.alteredStoredText
            ? "Server changed the text."
            : (fields.get("message") ?? "").replaceAll("\r\n", "\n"),
        });
      if (state.duplicateStored)
        state.messages.push({
          id: "204",
          sender: state.member,
          source: (fields.get("message") ?? "").replaceAll("\r\n", "\n"),
        });
      if (state.gate) await state.gate;
      return route.fulfill({
        contentType: "text/html",
        body: "<p>Command response is not independent evidence.</p>",
      });
    }
    state.reads.push(request.url());
    if (state.failReadback && state.posts.length)
      return route.abort("connectionfailed");
    const target = new URL(request.url());
    let document = history(state);
    if (target.searchParams.get("touid") === "10")
      document = document
        .replaceAll("uid=9", "uid=10")
        .replaceAll('value="9"', 'value="10"')
        .replaceAll("Listener Nine", "Reader Ten");
    if (
      target.searchParams.get("do") === "pm" &&
      target.searchParams.get("subop") !== "view"
    )
      document = `<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div><div id="ct"><ul class="tb"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li></ul><div class="pml">${["9", "10"].map((peer, i) => `<dl id="pmlist_${81 + i}"><dd class="avt"><a href="home.php?mod=space&uid=${peer}">Avatar</a></dd><dd class="pm_c"><a href="home.php?mod=space&uid=${peer}">${peer === "9" ? "Listener Nine" : "Reader Ten"}</a><br>Authored peer preview<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span><a id="pmlist_${81 + i}_a" href="home.php?mod=space&do=pm&subop=view&touid=${peer}#last">回复</a></dd></dl>`).join("")}</div></div>`;
    if (target.pathname === "/forum.php") {
      const header =
        '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
      document =
        target.searchParams.get("mod") === "post"
          ? header +
            '<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="AUTHORED_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1793793600"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><button type="submit" name="replysubmit" value="yes">Continue</button></form>'
          : header +
            '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Public original thread</h1><div id="post_901"><div class="authi"><a href="home.php?mod=space&uid=9">Listener Nine</a></div><a id="postnum901">1</a><div class="pcb"><p>Original public reading.</p></div></div></div>';
    }
    if (state.formAlter === "recipient")
      document = document.replace(
        'name="topmuid" value="9"',
        'name="topmuid" value="10"',
      );
    if (state.formAlter === "token")
      document = document.replace(
        "</form>",
        '<input name="formhash" value="OTHER_AUTHORED_TOKEN"></form>',
      );
    if (state.formAlter === "disabled")
      document = document.replace(
        '<textarea name="message"',
        '<textarea disabled name="message"',
      );
    if (state.formAlter === "unknown")
      document = document.replace(
        "</form>",
        '<input name="broadcast" value="yes"></form>',
      );
    if (state.formAlter === "target-id")
      document = document.replace("pmid=101", "pmid=999");
    if (state.formAlter === "limit")
      document = document.replace('rows="12"', 'rows="12" maxlength="5"');
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        uid: Number(state.member),
        document,
      }),
    });
  });
  await page.goto(start);
  await page.addScriptTag({ content: built });
  if (await page.getByRole("dialog").isVisible())
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
  if (start !== conversationURL) {
    await expect(page.locator(".workspace")).toBeVisible();
    return state;
  }
  await page
    .getByRole("button", { name: "Load private conversation", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  return state;
}
test.afterEach(async ({ page }, info) => {
  await info.attach("private-server.json", {
    body: JSON.stringify(servers.get(page)),
    contentType: "application/json",
  });
  await info.attach("private-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("acknowledged-recovery.json", {
    body: await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
    contentType: "application/json",
  });
});
test("DESIGN.private-entry: named private reply starts deliberately from the dock and retains source through expansion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page);
  const entry = page.locator(".composer-entry");
  await expect(entry).toBeVisible();
  await expect(entry).toContainText("Listener Nine");
  const reads = server.reads.length;
  await entry
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill(sourceText);
  await expect(
    page.getByRole("button", { name: "Review private message", exact: true }),
  ).toBeInViewport();
  await expect(editor).toBeInViewport();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  await expect(editor).toHaveValue(sourceText);
  expect(server.reads.length).toBe(reads + 1);
  expect(server.posts).toHaveLength(0);
});

test("J77.private-review-recovery: one explicit recipient-bound source session reviews without sending and reload restores text without tokens or received history", async ({
  page,
}) => {
  const server = await open(page);
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Listener Nine");
  await editor.fill(sourceText);
  await editor.press("End");
  await editor.press("Enter");
  await expect(editor).toHaveValue(sourceText + "\n");
  await editor.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared private message review",
    exact: true,
  });
  await expect(review).toContainText("Listener Nine");
  await expect(review).toContainText("Writer Seven");
  expect(await review.locator(".prepared-source").textContent()).toBe(
    sourceText + "\n",
  );
  expect(server.posts).toHaveLength(0);
  await editor.fill(sourceText + "\nLater local writing");
  await expect(review).toHaveCount(0);
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).toContain("Later local writing");
  expect(saved).not.toContain("AUTHORED_PRIVATE_TOKEN");
  expect(saved).not.toContain("formhash");
  expect(saved).not.toContain("An independently authored incoming message.");
  const before = server.reads.length;
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(editor).toHaveValue(sourceText + "\nLater local writing");
  await expect(review).toHaveCount(0);
  expect(server.reads).toHaveLength(before);
  expect(server.posts).toHaveLength(0);
});

test("J77.private-send: separate approval sends one exact recipient-bound revision and independently verifies the stored sender, recipient and text", async ({
  page,
}) => {
  const server = await open(page);
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill(sourceText);
  await editor.press("Meta+Enter");
  const review = page.getByRole("region", {
    name: "Prepared private message review",
    exact: true,
  });
  await expect(review.locator(".prepared-source")).toHaveText(sourceText);
  expect(server.posts).toHaveLength(0);
  const before = server.reads.length;
  await review
    .getByRole("button", { name: "Send this private message", exact: true })
    .dblclick();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Stored private message independently verified" }),
  ).toBeVisible();
  expect(server.posts).toHaveLength(1);
  expect(server.pendingRecords).toHaveLength(1);
  const acknowledged = JSON.parse(server.pendingRecords[0]!);
  expect(acknowledged.schema).toBe(3);
  expect(acknowledged.writing.privateAttempts[0]).toMatchObject({
    status: "pending",
    before: ["101"],
    submission: {
      writing: {
        source: sourceText,
        recipient: { id: "9" },
        account: { id: "7" },
      },
    },
  });
  expect(server.pendingRecords[0]).not.toContain('"review":');
  expect(server.pendingRecords[0]).not.toContain("AUTHORED_PRIVATE_TOKEN");
  expect(new URL(server.posts[0]!.url).searchParams.get("pmsubmit")).toBe(
    "yes",
  );
  expect(server.posts[0]!.fields).toEqual([
    [
      "message",
      "Controlled private writing 中文\r\nSecond line https://example.test/",
    ],
    ["formhash", "AUTHORED_PRIVATE_TOKEN"],
    ["topmuid", "9"],
  ]);
  expect(server.messages).toEqual([
    {
      id: "101",
      sender: "9",
      source: "An independently authored incoming message.",
    },
    { id: "203", sender: "7", source: sourceText },
  ]);
  expect(server.reads.length).toBeGreaterThanOrEqual(before + 2);
  await expect(editor).toHaveValue(sourceText);
  const recovery = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(recovery).toContain('"status":"confirmed"');
  expect(recovery).not.toContain("AUTHORED_PRIVATE_TOKEN");
  expect(recovery).not.toContain("An independently authored incoming message.");
  const reads = server.reads.length;
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(editor).toHaveValue(sourceText);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Stored private message independently verified" }),
  ).toBeVisible();
  expect(server.reads).toHaveLength(reads);
  expect(server.posts).toHaveLength(1);
  await expect(
    page.getByRole("button", {
      name: "Send this private message",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("J77.private-schema: private writing uses explicitly incompatible schema3 without replacing legacy public compatibility or persisting credentials", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Private message text", exact: true })
    .fill("Versioned private recovery");
  const record = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery") ?? "null"),
  );
  expect(record.schema).toBe(3);
  expect(record.writing.action).toBe("private-message");
  expect(record.writing.recipient.id).toBe("9");
  expect(Object.keys(record.writing)).not.toContain("board");
  expect(JSON.stringify(record)).not.toContain("AUTHORED_PRIVATE_TOKEN");
});

async function prepare(page: Page, text = sourceText) {
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill(text);
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toBeVisible();
  return editor;
}
const send = (page: Page) =>
  page
    .getByRole("button", { name: "Send this private message", exact: true })
    .click();
const attempt = (page: Page) =>
  page.getByRole("region", {
    name: "Private message attempt to Listener Nine",
    exact: true,
  });

test("J77.private-uncertain-recovery: a lost readback preserves original pending identity and later edits across reload, then deliberate checking verifies without resend", async ({
  page,
}) => {
  const server = await open(page);
  const editor = await prepare(page);
  server.failReadback = true;
  await send(page);
  await expect(attempt(page)).toContainText("could not confirm");
  const original = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing.privateAttempts[0];
  await editor.fill("Later unsent private text 中文");
  await page.reload();
  const reads = server.reads.length;
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(editor).toHaveValue("Later unsent private text 中文");
  expect(server.reads).toHaveLength(reads);
  expect(server.posts).toHaveLength(1);
  const recovered = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing.privateAttempts[0];
  expect(recovered).toEqual(original);
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "earlier private attempt is unresolved" }),
  ).toBeVisible();
  server.failReadback = false;
  await page
    .getByRole("button", { name: "Check private message result", exact: true })
    .click();
  await expect(attempt(page)).toContainText(
    "Stored private message independently verified",
  );
  await expect(editor).toHaveValue("Later unsent private text 中文");
  expect(server.posts).toHaveLength(1);
  const confirmed = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing.privateAttempts[0];
  expect(confirmed.id).toBe(original.id);
  expect(confirmed.submission).toEqual(original.submission);
});

test("J77.private-delayed: edits during an approved pending command survive its older independent result", async ({
  page,
}) => {
  const server = await open(page),
    editor = await prepare(page);
  let release = () => {};
  server.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await send(page);
  await expect.poll(() => server.posts.length).toBe(1);
  await expect(attempt(page)).toContainText("pending");
  await editor.fill("Later text while the original command is pending");
  release();
  await expect(attempt(page)).toContainText(
    "Stored private message independently verified",
  );
  await expect(editor).toHaveValue(
    "Later text while the original command is pending",
  );
  expect(server.messages[1]?.source).toBe(sourceText);
  expect(server.posts).toHaveLength(1);
});

for (const mode of [
  "refusePost",
  "duplicateStored",
  "wrongStoredSender",
  "alteredStoredText",
] as const)
  test(`J77.private-readback-${mode}: neither command response nor unmatched or ambiguous stored content establishes success`, async ({
    page,
  }) => {
    const server = await open(page),
      editor = await prepare(page);
    server[mode] = true;
    await send(page);
    await expect(attempt(page)).toContainText(
      "could not be uniquely confirmed",
    );
    await expect(editor).toHaveValue(sourceText);
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Stored private message independently verified" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Check private message result",
        exact: true,
      })
      .click();
    await expect(attempt(page)).toContainText(
      "could not be uniquely confirmed",
    );
    expect(server.posts).toHaveLength(1);
  });

for (const change of [
  "account",
  "recipient",
  "token",
  "disabled",
  "unknown",
  "limit",
  "target-id",
] as const)
  test(`J77.private-current-${change}: fresh final validation refuses a changed sender or form without losing text`, async ({
    page,
  }) => {
    const server = await open(page),
      editor = await prepare(page);
    if (change === "account") server.member = "8";
    else server.formAlter = change;
    await send(page);
    await expect(attempt(page)).toContainText("not sent");
    expect(server.posts).toHaveLength(0);
    await expect(editor).toHaveValue(sourceText);
    expect(
      JSON.parse(
        await page.evaluate(
          () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
        ),
      ).writing.account.id,
    ).toBe("7");
  });

test("J77.private-storage-refusal: actual full page-session storage prevents the command and preserves local text with a truthful recovery failure", async ({
  page,
}) => {
  const server = await open(page),
    editor = await prepare(page);
  await page.evaluate(() => {
    let value = "";
    for (let step = 1024 * 128; step >= 1; step = Math.floor(step / 2)) {
      while (true) {
        try {
          sessionStorage.setItem(
            "authored-quota-fill",
            value + "x".repeat(step),
          );
          value += "x".repeat(step);
        } catch {
          break;
        }
      }
    }
  });
  await send(page);
  await expect(attempt(page)).toContainText("not sent because recovery");
  expect(server.posts).toHaveLength(0);
  await expect(editor).toHaveValue(sourceText);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Recovery is not yet acknowledged" }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem("authored-quota-fill"));
  await editor.fill(sourceText + "\nRecovered storage capacity");
  await expect(
    page.getByRole("status").filter({ hasText: "Current writing is retained" }),
  ).toBeVisible();
});

test("J77.private-field-errors: empty and over-limit content identify the source field and keep the current restriction visible", async ({
  page,
}) => {
  const server = await open(page);
  server.formAlter = "limit";
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toBeFocused();
  await expect(
    page.getByText("Current maximum: 5 characters.", { exact: true }),
  ).toBeVisible();
  await editor.fill("Too long private writing");
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  expect(server.posts).toHaveLength(0);
  await editor.fill("Short");
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toBeVisible();
  await expect(editor).not.toHaveAttribute("aria-invalid", "true");
});

for (const rawExtra of [
  "<script>ignoredByReader()</script>",
  "<span hidden>unqualified hidden content</span>",
])
  test(`J77.private-raw-readback-${rawExtra.startsWith("<script") ? "script" : "hidden"}: sanitized reading content cannot falsely prove exact stored private plaintext`, async ({
    page,
  }) => {
    const server = await open(page);
    server.rawExtra = rawExtra;
    await prepare(page);
    await send(page);
    await expect(attempt(page)).toContainText(
      "could not be uniquely confirmed",
    );
    expect(server.posts).toHaveLength(1);
  });

test("J77.private-native-newlines: qualified native br-newline rendering preserves leading, internal and trailing authored lines exactly", async ({
  page,
}) => {
  const server = await open(page);
  server.nativeWhitespace = true;
  const exact = "\n第一行\n\nLast line\n";
  await prepare(page, exact);
  await send(page);
  await expect(attempt(page)).toContainText(
    "Stored private message independently verified",
  );
  expect(server.messages[1]?.source).toBe(exact);
});

test("J77.private-pending-reload: acknowledged pending becomes uncertain on reload and later explicit verification never repeats the POST", async ({
  page,
}) => {
  const server = await open(page),
    editor = await prepare(page);
  let release = () => {};
  server.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await send(page);
  await expect.poll(() => server.posts.length).toBe(1);
  const pending = JSON.parse(server.pendingRecords[0]!).writing
    .privateAttempts[0];
  await page.reload();
  release();
  const before = server.reads.length;
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(editor).toHaveValue(sourceText);
  await expect(attempt(page)).toContainText("restored as uncertain");
  expect(server.reads).toHaveLength(before);
  const restored = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing.privateAttempts[0];
  expect(restored.submission).toEqual(pending.submission);
  expect(restored.id).toBe(pending.id);
  expect(restored.status).toBe("uncertain");
  await page
    .getByRole("button", { name: "Check private message result", exact: true })
    .click();
  await expect(attempt(page)).toContainText(
    "Stored private message independently verified",
  );
  expect(server.posts).toHaveLength(1);
});

for (const bad of [
  "token",
  "public-domain",
  "attempt-token",
  "schema-string",
  "private-draft",
])
  test(`J77.private-incompatible-${bad}: malformed private recovery remains raw and never authorizes a command`, async ({
    page,
  }) => {
    const server = await open(page);
    await prepare(page);
    if (bad === "attempt-token") {
      server.failReadback = true;
      await send(page);
      await expect(attempt(page)).toContainText("could not confirm");
    }
    const malformed = await page.evaluate((kind) => {
      const record = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
      );
      if (kind === "private-draft") {
        const {
          id,
          revision,
          selection: _selection,
          ...writing
        } = record.writing;
        void _selection;
        record.writing.draftAttempts = [
          {
            id: "malformed-private-draft",
            generation: 0,
            status: "uncertain",
            message: "Uncertain",
            submission: { contextId: id, revision, writing },
            result: null,
          },
        ];
      } else if (kind === "schema-string") record.schema = "3";
      else if (kind === "token")
        record.writing.formhash = "FORBIDDEN_RECOVERY_TOKEN";
      else if (kind === "public-domain")
        record.writing.board = {
          id: "5",
          label: "Fake public target",
          url: "https://www.tsdm39.com/forum.php?mod=forumdisplay&fid=5",
        };
      else
        record.writing.privateAttempts[0].submission.writing.formhash =
          "FORBIDDEN_RECOVERY_TOKEN";
      const raw = JSON.stringify(record);
      sessionStorage.setItem("tsdm.workspace.recovery", raw);
      return raw;
    }, bad);
    const commands = server.posts.length,
      reads = server.reads.length;
    // Install untrusted recovery at the next document boundary, after the outgoing
    // page has saved its current acknowledged position on pagehide.
    await page.addInitScript(
      (raw) => sessionStorage.setItem("tsdm.workspace.recovery", raw),
      malformed,
    );
    await page.reload();
    await page.addScriptTag({
      content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
    });
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Private message text", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Send this private message",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBe(malformed);
    expect(server.posts).toHaveLength(commands);
    expect(server.reads).toHaveLength(reads);
  });

test("J77.private-language-layout: the sole private editor and review follow language, enlarged text and themes without changing recipient or source", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  const server = await open(page);
  await prepare(page);
  for (const [language, editorLabel, reviewLabel, sendLabel, settingsLabel] of [
    ["zh-CN", "私信正文", "已准备的私信审核", "发送此私信", "设置"],
    ["zh-TW", "私訊正文", "已準備的私訊審核", "傳送此私訊", "設定"],
    [
      "en",
      "Private message text",
      "Prepared private message review",
      "Send this private message",
      "Settings",
    ],
  ]) {
    await page
      .getByRole("button", { name: /^(Settings|设置|設定)$/, exact: true })
      .click();
    await page.locator("#interface-language").selectOption(language!);
    await page.locator('input[type=radio][value="dark"]').check();
    await page.keyboard.press("Escape");
    const editor = page.getByRole("textbox", {
      name: editorLabel!,
      exact: true,
    });
    await expect(editor).toHaveValue(sourceText);
    await expect(
      page.getByRole("region", { name: reviewLabel!, exact: true }),
    ).toContainText("Listener Nine");
    await expect(
      page.getByRole("button", { name: sendLabel!, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: settingsLabel!, exact: true }),
    ).toBeVisible();
    const geometry = await page.locator(".source-writing").evaluate((node) => ({
      width: node.clientWidth,
      scroll: node.scrollWidth,
      editorCount: node.querySelectorAll("textarea").length,
      viewport: innerWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
    expect(geometry.editorCount).toBe(1);
    await info.attach(`private-${language}-geometry.json`, {
      body: JSON.stringify(geometry),
      contentType: "application/json",
    });
    await info.attach(`private-${language}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  expect(server.posts).toHaveLength(0);
});

test("J77.private-peer-guard: reading another peer keeps the original writing and uncertain attempt, replacement is explicit and preserves original attempt identity", async ({
  page,
}) => {
  const server = await open(page),
    editor = await prepare(page);
  server.failReadback = true;
  await send(page);
  await expect(attempt(page)).toContainText("could not confirm");
  const original = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing;
  server.failReadback = false;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load messages", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Read private conversation with Reader Ten",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Keep current writing?", exact: true }),
  ).toBeVisible();
  expect(server.reads.filter((url) => url.includes("touid=10"))).toHaveLength(
    0,
  );
  await page
    .getByRole("button", { name: "Continue editing", exact: true })
    .click();
  await expect(editor).toHaveValue(sourceText);
  await page
    .getByRole("link", {
      name: "Read private conversation with Reader Ten",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Keep writing and read private conversation",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Reader Ten",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Discard and write private message",
      exact: true,
    }),
  ).toBeVisible();
  const retained = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing;
  expect(retained.id).toBe(original.id);
  expect(retained.source).toBe(sourceText);
  await page
    .getByRole("button", { name: "Keep current writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard and write private message",
      exact: true,
    })
    .click();
  await expect(editor).toHaveValue("");
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Reader Ten");
  const replacement = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  );
  expect(replacement.schema).toBe(3);
  expect(replacement.writing.id).not.toBe(original.id);
  expect(replacement.writing.privateAttempts).toEqual(original.privateAttempts);
  await expect(attempt(page)).toContainText("Listener Nine");
  await expect(attempt(page).getByRole("link")).toHaveAttribute(
    "href",
    /touid=9/,
  );
  expect(server.posts).toHaveLength(1);
});

test("J77.private-composition: composition, plain Enter and repeated modifiers cannot authorize a private send", async ({
  page,
}) => {
  const server = await open(page);
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill("中文 pending composition");
  await editor.dispatchEvent("compositionstart");
  await editor.press("Control+Enter");
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toHaveCount(0);
  await editor.dispatchEvent("compositionend");
  await expect(
    page.getByRole("button", { name: "Review private message", exact: true }),
  ).toBeEnabled();
  await editor.press("End");
  await editor.press("Enter");
  await expect(editor).toHaveValue("中文 pending composition\n");
  await editor.dispatchEvent("keydown", {
    key: "Enter",
    ctrlKey: true,
    repeat: true,
    bubbles: true,
  });
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toHaveCount(0);
  await editor.press("Control+Enter");
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toBeVisible();
  expect(server.posts).toHaveLength(0);
});

test("J77.private-unqualified-markup: potential private formatting remains editable but cannot prepare or send as qualified plaintext", async ({
  page,
}) => {
  const server = await open(page);
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill("[b]Unqualified private formatting[/b]");
  await page
    .getByRole("button", { name: "Review private message", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Private formatting syntax has not been qualified" }),
  ).toBeVisible();
  await expect(editor).toHaveValue("[b]Unqualified private formatting[/b]");
  expect(server.posts).toHaveLength(0);
});

test("J77.public-private-history: explicit private replacement keeps the original public uncertain attempt inspectable and recoverable without retargeting or resend", async ({
  page,
}) => {
  const server = await open(page, `${origin}/forum.php?mod=viewthread&tid=42`);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Complete source", exact: true })
    .fill("Original public reply remains identifiable");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(
          await page.evaluate(
            () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
          ),
        ).writing.attempts?.[0]?.status,
    )
    .toBe("uncertain");
  const original = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  ).writing.attempts[0];
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load messages", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Keep writing and read private conversation",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard and write private message",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Private message text", exact: true }),
  ).toHaveValue("");
  const history = page.getByRole("region", {
    name: "Original public publication attempt",
    exact: true,
  });
  await expect(history).toContainText(
    "Original public reply remains identifiable",
  );
  await expect(
    history.getByRole("button", {
      name: "Check original public result",
      exact: true,
    }),
  ).toBeVisible();
  await history
    .getByText("Inspect original public writing", { exact: true })
    .click();
  await history.getByText("Complete prepared source", { exact: true }).click();
  await expect(history.locator(".prepared-source")).toBeVisible();
  const after = JSON.parse(
    await page.evaluate(
      () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
    ),
  );
  expect(after.schema).toBe(3);
  expect(after.writing.attempts[0]).toEqual(original);
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(history).toContainText(
    "Original public reply remains identifiable",
  );
  expect(server.posts).toHaveLength(1);
});

test("J78.private-review-priority: checking yields to immutable private review without changing approved source or sending", async ({
  page,
}) => {
  const server = await open(page);
  await page
    .getByRole("checkbox", {
      name: "Check private conversation every 2 minutes while active",
      exact: true,
    })
    .check();
  const editor = await prepare(page);
  const reads = server.reads.length;
  await expect(page.getByText("Checks paused", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  expect(server.reads).toHaveLength(reads);
  await expect(
    page.getByRole("region", {
      name: "Prepared private message review",
      exact: true,
    }),
  ).toContainText(sourceText);
  await expect(editor).toHaveValue(sourceText);
  expect(server.posts).toHaveLength(0);
});
test("J78.private-uncertain-original: independent reading arrivals cannot confirm or rewrite the original immutable attempt", async ({
  page,
}) => {
  const server = await open(page);
  await prepare(page);
  server.failReadback = true;
  await send(page);
  await expect(attempt(page)).toContainText("could not confirm");
  const original = JSON.parse(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    ),
  ).writing.privateAttempts[0];
  server.failReadback = false;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect(page.locator("#pmlist_203")).toHaveCount(1);
  const after = JSON.parse(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    ),
  ).writing.privateAttempts[0];
  expect(after).toEqual(original);
  await expect(attempt(page)).toContainText("could not confirm");
  expect(server.posts).toHaveLength(1);
  await page
    .getByRole("checkbox", {
      name: "Check private conversation every 2 minutes while active",
      exact: true,
    })
    .check();
  await expect(page.getByText("Checks paused", { exact: true })).toBeVisible();
});
test("J78.private-send-priority: pending publication preserves its original baseline and refuses concurrent reading refresh", async ({
  page,
}) => {
  const server = await open(page);
  await prepare(page);
  let release!: () => void;
  server.gate = new Promise<void>((r) => {
    release = r;
  });
  await send(page);
  await expect.poll(() => server.posts.length).toBe(1);
  const original = JSON.parse(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    ),
  ).writing.privateAttempts[0];
  const count = server.reads.length;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  expect(server.reads).toHaveLength(count);
  release();
  await expect(attempt(page)).toContainText(
    "Stored private message independently verified",
  );
  const final = JSON.parse(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    ),
  ).writing.privateAttempts[0];
  expect(final.submission).toEqual(original.submission);
  expect(server.posts).toHaveLength(1);
});

test("J78.private-first-refresh-writing: first successful check preserves the visible private line beside retained writing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1119, height: 626 });
  const server = await open(
    page,
    conversationURL,
    [101, 102, 103, 104].map((id) => ({
      id: String(id),
      sender: id === 104 ? "7" : "9",
      source: ("Authored complete private line " + id + "\n").repeat(8),
    })),
  );
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await editor.fill("Retained unsent private source 中文");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page.locator("#pmlist_104").focus();
  await page.locator(".private-reading-pane").evaluate((n) => {
    const anchor = n.querySelector("#pmlist_104")!;
    n.scrollTop +=
      anchor.getBoundingClientRect().top - n.getBoundingClientRect().top;
  });
  const geometry = () =>
    page.locator(".private-reading-pane").evaluate((n) => ({
      paneTop: n.getBoundingClientRect().top,
      anchorTop: n.querySelector("#pmlist_104")!.getBoundingClientRect().top,
      offset:
        n.querySelector("#pmlist_104")!.getBoundingClientRect().top -
        n.getBoundingClientRect().top,
      height: n.clientHeight,
      scrollTop: n.scrollTop,
      scrollHeight: n.scrollHeight,
      outerScroll: n.closest(".conversation-region")!.scrollTop,
    }));
  const before = await geometry();
  expect(
    before.scrollHeight - before.height - before.scrollTop,
  ).toBeGreaterThan(64);
  const reads = server.reads.length;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click();
  await expect(page.getByText(/Last successful check:/)).toBeVisible();
  const after = await geometry();
  await test.info().attach("first-refresh-geometry.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  await expect(
    page.getByRole("textbox", {
      name: "Private message text",
      exact: true,
      includeHidden: true,
    }),
  ).toHaveValue("Retained unsent private source 中文");
  expect(server.reads).toHaveLength(reads + 1);
  expect(server.posts).toHaveLength(0);
  expect(Math.abs(after.offset - before.offset)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.anchorTop - before.anchorTop)).toBeLessThanOrEqual(1);
});

test("F79.private-domain-recovery: guarded public/private writing, reading arrivals, viewport review and native return retain the sole private source without sending", async ({
  page,
}) => {
  const server = await open(page, `${origin}/forum.php?mod=viewthread&tid=42`);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Complete source", exact: true })
    .fill("Original public source stays public");
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load messages", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Keep writing and read private conversation",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Complete source", exact: true }),
  ).toHaveValue("Original public source stays public");
  await page
    .getByRole("button", { name: "Write private message", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard and write private message",
      exact: true,
    })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Private message text",
    exact: true,
  });
  await expect(editor).toHaveValue("");
  const source =
    "Mixed controlled private source 中文\nRetain this exact recipient and text.";
  await editor.fill(source);
  const handle = await editor.elementHandle();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('input[name="theme"][value="dark"]').check();
  await page.getByRole("slider").fill("150");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 700 });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const automatic = page.getByRole("checkbox", {
    name: "Check private conversation every 2 minutes while active",
    exact: true,
  });
  await expect(automatic).not.toBeChecked();
  await automatic.check();
  server.messages.push({
    id: "202",
    sender: "9",
    source: "Independently arrived private text.",
  });
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click();
  await expect(page.locator("#pmlist_202")).toContainText(
    "Independently arrived private text.",
  );
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  expect(await handle!.evaluate((n) => n.isConnected)).toBe(true);
  await expect(page.getByText("Checks paused", { exact: true })).toBeVisible();
  await editor.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared private message review",
    exact: true,
  });
  await expect(review.locator(".prepared-source")).toHaveText(source);
  const reads = server.reads.length;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .dispatchEvent("click");
  expect(server.reads).toHaveLength(reads);
  await page
    .getByRole("button", { name: "Return to private writing", exact: true })
    .click();
  await automatic.uncheck();
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(editor).toHaveValue(source);
  await page
    .locator(".source-writing")
    .getByRole("link", { name: "Continue in native forum", exact: true })
    .click();
  await expect(page).toHaveURL(/tsdm-native=1/);
  await expect(page.locator("#tsdm-workspace")).toHaveCount(0);
  await page.goBack();
  if ((await page.locator("#tsdm-workspace").count()) === 0)
    await page.addScriptTag({
      content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
    });
  await expect(editor).toHaveValue(source);
  await expect(review).toHaveCount(0);
  expect(server.posts).toHaveLength(0);
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery")!,
  );
  expect(saved).not.toContain("Independently arrived private text.");
  expect(saved).not.toContain("AUTHORED_PRIVATE_TOKEN");
  expect(JSON.parse(saved).schema).toBe(3);
});
