import { readableLines } from "./readable-lines";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Failure-first application seam: the real built userscript with only HTTP
// substituted. Empty-list structure was observed in Edge on 2026-11-04;
// all identities, body text and server state here are independently authored.
const origin = "https://www.tsdm39.com";
const inbox = `${origin}/home.php?mod=space&do=pm`;
const header =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong><a id="pm_ntc" href="home.php?mod=space&do=pm"><em class="prompt_news_0"></em>消息</a></div>';
const directory = `${header}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const empty = `${header}<div id="ct" class="ct2_a wp cl"><div class="mn"><div class="bm bw0"><h1 class="mt">消息</h1><ul class="tb cl"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li><li><a href="home.php?mod=space&do=pm&filter=announcepm">公共消息</a></li><li class="o"><a href="home.php?mod=spacecp&ac=pm">发送消息</a></li></ul><div class="emp">当前没有相应的短消息</div></div></div></div>`;

test("J75.messages-passive-entry: open Messages without a request, deliberately load an honest empty list, and return without replay", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  const ledger: { method: string; url: string; clearedPrompt: boolean }[] = [];
  const server = { newMessagePrompt: true, listReads: 0 };
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    const url = new URL(request.url());
    const isMessages =
      url.pathname === "/home.php" &&
      url.searchParams.get("mod") === "space" &&
      url.searchParams.get("do") === "pm";
    if (isMessages) {
      server.listReads++;
      server.newMessagePrompt = false;
    }
    ledger.push({
      method: request.method(),
      url: request.url(),
      clearedPrompt: !server.newMessagePrompt,
    });
    if (request.method() !== "GET") return route.abort();
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        uid: 7,
        document: isMessages ? empty : directory,
      }),
    });
  });
  try {
    await page.goto(`${origin}/forum.php`);
    await page.addScriptTag({ content: built });
    await expect(page.getByText("Signed in as Reader Seven")).toBeVisible();
    const destinations = page.getByRole("navigation", {
      name: "Main destinations",
      exact: true,
    });
    const messagesEntry = destinations.getByRole("button", {
      name: "Messages",
      exact: true,
    });
    await expect(messagesEntry).toBeVisible();
    await messagesEntry.click();
    await expect(
      page.getByRole("heading", { name: "Messages", exact: true, level: 1 }),
    ).toBeVisible();
    expect(server.listReads).toBe(0);
    expect(server.newMessagePrompt).toBe(true);
    await expect(
      page.getByText(/clear.*new.private.message prompt/i),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Load messages", exact: true })
      .click();
    await expect(
      page.getByText("当前没有相应的短消息", { exact: true }),
    ).toBeVisible();
    expect(server.listReads).toBe(1);
    expect(server.newMessagePrompt).toBe(false);
    expect(ledger.filter((entry) => entry.url.startsWith(inbox))).toHaveLength(
      1,
    );
    await destinations
      .getByRole("button", { name: "Boards", exact: true })
      .click();
    await page.goBack();
    await expect(
      page.getByText("当前没有相应的短消息", { exact: true }),
    ).toBeVisible();
    expect(server.listReads).toBe(1);
    expect(ledger.every((entry) => entry.method === "GET")).toBe(true);
  } finally {
    await info.attach("messages-empty-state.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("messages-request-and-server-state.json", {
      body: JSON.stringify({ ledger, server }),
      contentType: "application/json",
    });
  }
});

const populated = `${header}<div id="ct"><div class="mn"><div class="bm"><ul class="tb"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li></ul><form id="deletepmform"><div class="xld xlda pml"><dl id="pmlist_81" class="bbda cur1 cl newpm"><dd class="m avt"><div class="newpm_avt"></div><a href="home.php?mod=space&uid=9"><img src="https://fixture.example/avatar.png"></a></dd><dd class="ptm pm_c"><div class="o"><input name="deletepm_deluid[]" value="9"></div><a class="xw1" href="home.php?mod=space&uid=9">Listener Nine</a> 对 <span class="xi2">您</span> 说 :<br>Controlled &amp; complete preview.<script>window.messageScriptRan=true</script><br><span class="xg1"><span title="2026-11-04 17:00">now</span></span><span class="pm_o y"><span class="xg1 z">共 2 条</span><a id="pmlist_81_a" href="home.php?mod=space&do=pm&subop=view&touid=9#last">回复</a></span></dd></dl><dl id="pmlist_82" class="bbda cur1 cl"><dd class="m avt"><div class="newpm_avt"></div><a href="home.php?mod=space&uid=10">Avatar</a></dd><dd class="ptm pm_c"><a class="xw1" href="home.php?mod=space&uid=10">Reader Ten</a> 对 您 说 :<br>Already read preview.<br><span class="xg1"><span title="2026-11-03 10:00">yesterday</span></span><span class="pm_o"><a id="pmlist_82_a" href="home.php?mod=space&do=pm&subop=view&touid=10#last">回复</a></span></dd></dl></div></form></div></div></div>`;

test("J67.messages-scroll-owner: shared list ownership retains an existing private-list offset without another read", async ({
  page,
}, info) => {
  const ledger = await openMessageFixture(page, () => ({
    body: populated.replace(
      "Controlled &amp; complete preview.",
      "Controlled complete preview. ".repeat(80),
    ),
  }));
  try {
    await expect(
      page.getByRole("heading", { name: "Listener Nine", exact: true }),
    ).toBeVisible();
    await page.locator(".messages-pane").evaluate((node) => {
      node.scrollTop = 320;
    });
    expect(
      await page.locator(".messages-pane").evaluate((node) => node.scrollTop),
    ).toBe(320);
    const geometry = () =>
      page.locator(".messages-pane").evaluate((node) => ({
        scrollTop: node.scrollTop,
        pane: node.getBoundingClientRect().toJSON(),
        row: node
          .querySelector('[data-peer-id="9"]')
          ?.getBoundingClientRect()
          .toJSON(),
      }));
    const before = await geometry();
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Boards", exact: true })
      .click();
    const count = ledger.length;
    await page.goBack();
    await expect(page.locator(".messages-pane")).toBeVisible();
    await info.attach("messages-list-owner-geometry.json", {
      body: JSON.stringify({ before, after: await geometry() }),
      contentType: "application/json",
    });
    await expect
      .poll(async () => (await geometry()).scrollTop)
      .toBeGreaterThan(0);
    await expect
      .poll(async () => Math.abs((await geometry()).row.top - before.row.top))
      .toBeLessThanOrEqual(0.5);
    expect(ledger).toHaveLength(count);
  } finally {
    await info.attach("messages-list-owner.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("messages-list-owner-ledger.json", {
      body: JSON.stringify(ledger),
      contentType: "application/json",
    });
  }
});

type MessageResponse = {
  body: string;
  status?: number;
  uid?: number;
  contentType?: string;
};
async function openMessageFixture(
  page: import("@playwright/test").Page,
  supply: () => MessageResponse | Promise<MessageResponse>,
) {
  const ledger: { url: string; method: string }[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    ledger.push({ url: request.url(), method: request.method() });
    const isMessages = new URL(request.url()).searchParams.get("do") === "pm";
    const response = isMessages ? await supply() : { body: directory };
    return route.fulfill({
      status: response.status ?? 200,
      contentType: response.contentType ?? "application/json",
      body: response.contentType
        ? response.body
        : JSON.stringify({ uid: response.uid ?? 7, document: response.body }),
    });
  });
  await page.goto(`${origin}/forum.php`);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(page.getByText("Signed in as Reader Seven")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load messages", exact: true })
    .click();
  return ledger;
}

test("J75.messages-native-peers: preserve one-to-one identities, exact native destinations, inert previews and genuine unread markers", async ({
  page,
}, info) => {
  const ledger = await openMessageFixture(page, () => ({ body: populated }));
  try {
    const first = page.locator('[data-peer-id="9"]'),
      second = page.locator('[data-peer-id="10"]');
    await expect(
      first.getByRole("heading", { name: "Listener Nine" }),
    ).toBeVisible();
    await expect(
      first.getByText("Controlled & complete preview.", { exact: true }),
    ).toBeVisible();
    await expect(first.locator("time")).toHaveText("2026-11-04 17:00");
    await expect(
      first.getByText("Forum marks this conversation unread", { exact: true }),
    ).toBeVisible();
    await expect(
      second.getByText("Forum marks this conversation unread", { exact: true }),
    ).toHaveCount(0);
    await expect(
      first.getByRole("link", { name: /continue in native forum/ }),
    ).toHaveAttribute(
      "href",
      `${origin}/home.php?mod=space&do=pm&subop=view&touid=9&tsdm-native=1#last`,
    );
    await expect(
      page.getByRole("navigation", { name: "Message list pages", exact: true }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => "messageScriptRan" in window)).toBe(false);
    expect(
      ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
    ).toHaveLength(1);
    expect(ledger.every((x) => x.method === "GET")).toBe(true);
  } finally {
    await info.attach("messages-peers.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("messages-peers-requests.json", {
      body: JSON.stringify(ledger),
      contentType: "application/json",
    });
  }
});

test("J75.messages-transient-reload: keep local Back results but do not expose private peer previews after a new document or silently reload them", async ({
  page,
}, info) => {
  const ledger = await openMessageFixture(page, () => ({ body: populated }));
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Boards", exact: true }).click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  expect(
    ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
  ).toHaveLength(1);
  const stored = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(stored).not.toContain("Controlled & complete preview.");
  expect(stored).not.toContain("Listener Nine");
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(
    page.getByRole("heading", { name: "Messages", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Load messages", exact: true }),
  ).toBeVisible();
  expect(
    ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
  ).toHaveLength(1);
  await info.attach("messages-transient-reload.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("messages-transient-reload-requests.json", {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
});

for (const variant of [
  {
    name: "login",
    response: {
      body: '<form id="lsform"></form><div id="messagetext">请先登录</div>',
      uid: 0,
    },
    message:
      "Sign in through the native forum before loading messages deliberately.",
  },
  {
    name: "permission",
    response: {
      body: `${header}<div id="messagetext">权限不足</div>`,
      status: 403,
    },
    message: "The current account cannot read these messages.",
  },
  {
    name: "challenge",
    response: {
      body: '<title>Just a moment</title><div id="challenge-form"></div>',
    },
    message: "Native verification is required before loading messages.",
  },
  {
    name: "limited",
    response: { body: header, status: 429 },
    message: "The forum is limiting message requests. Retry only deliberately.",
  },
  {
    name: "conflicting-actor",
    response: { body: populated, uid: 8 },
    message:
      "The private-message list or its current account could not be confirmed.",
  },
  {
    name: "different-actor",
    response: { body: populated.replace("uid=7", "uid=8"), uid: 8 },
    message: "The account changed while loading messages.",
  },
  {
    name: "recipient-mismatch",
    response: { body: populated.replace("touid=9#last", "touid=999#last") },
    message: "The private-message peers could not be identified completely.",
  },
  {
    name: "foreign-pager",
    response: {
      body: populated.replace(
        "</form>",
        '</form><div class="pg"><strong>1</strong><a href="home.php?mod=space&do=pm&filter=announcepm&page=2">2</a></div>',
      ),
    },
    message:
      "The returned private-message pagination could not be preserved completely.",
  },
  {
    name: "unrelated-empty",
    response: {
      body: `${header}<div id="ct"><div class="emp">Unrelated empty content</div></div>`,
    },
    message: "The private-message list could not be recognized.",
  },
  {
    name: "unsupported-content-type",
    response: { body: populated, contentType: "text/plain" },
    message: "The forum returned an unsupported private-message list.",
  },
]) {
  test(`J75.messages-refusal-${variant.name}: distinguish refusal from empty peers without replaying a read`, async ({
    page,
  }, info) => {
    const ledger = await openMessageFixture(page, () => variant.response);
    try {
      await expect(
        page.getByText(variant.message, { exact: false }),
      ).toBeVisible();
      await expect(page.locator("[data-peer-id]")).toHaveCount(0);
      await expect(
        page.getByText("当前没有相应的短消息", { exact: true }),
      ).toHaveCount(0);
      expect(
        ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
      ).toHaveLength(1);
    } finally {
      await info.attach(`messages-refusal-${variant.name}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("messages-refusal-requests.json", {
        body: JSON.stringify(ledger),
        contentType: "application/json",
      });
    }
  });
}

test("J75.messages-late-account-response: leaving a pending list cannot publish another account's private peers", async ({
  page,
}, info) => {
  let finish: (response: MessageResponse) => void = () => {};
  const response = new Promise<MessageResponse>((resolve) => {
    finish = resolve;
  });
  const ledger = await openMessageFixture(page, () => response);
  await expect(
    page.getByRole("button", { name: "Load messages", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Boards", exact: true }).click();
  await expect(page.getByText("Signed in as Reader Seven")).toBeVisible();
  finish({ body: populated.replace("uid=7", "uid=8"), uid: 8 });
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load messages", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[data-peer-id]")).toHaveCount(0);
  expect(
    ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
  ).toHaveLength(1);
  await info.attach("messages-late-requests.json", {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
});

test("J75.messages-network-retry: retain loaded peers on response loss, disclose unknown prompt effects and retry only deliberately", async ({
  page,
}, info) => {
  let reads = 0;
  const ledger = await openMessageFixture(page, () => ({ body: populated }));
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  await page.route("**/home.php?**", async (route) => {
    reads++;
    await route.abort();
  });
  await page
    .getByRole("button", { name: "Refresh messages", exact: true })
    .click();
  await expect(
    page.getByText(
      "The message request failed. It may still have cleared the new-private-message prompt. Retry only deliberately.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  expect(reads).toBe(1);
  await page.getByRole("button", { name: "Boards", exact: true }).click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  expect(reads).toBe(1);
  await page
    .getByRole("button", { name: "Refresh messages", exact: true })
    .click();
  await expect.poll(() => reads).toBe(2);
  await info.attach("messages-network-retry.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("messages-network-retry-requests.json", {
    body: JSON.stringify({ ledger, failedReads: reads }),
    contentType: "application/json",
  });
});

test("J75.messages-returned-paging: follow only native offered private-list pages and restore without replay", async ({
  page,
}, info) => {
  let reads = 0;
  const returned = `${inbox}&filter=privatepm&page=2`;
  const ledger = await openMessageFixture(page, () => {
    reads++;
    return {
      body:
        reads === 1
          ? populated.replace(
              "</form>",
              `</form><div class="pg"><strong>1</strong><a href="${returned}">2</a></div>`,
            )
          : populated
              .replace(
                "Controlled &amp; complete preview.",
                "Second returned page preview.",
              )
              .replace(
                "</form>",
                `</form><div class="pg"><strong>2</strong><a href="${inbox}&filter=privatepm&page=1">1</a></div>`,
              ),
    };
  });
  try {
    const pager = page.getByRole("navigation", {
      name: "Message list pages",
      exact: true,
    });
    await expect(
      pager.getByRole("link", { name: "2", exact: true }),
    ).toHaveAttribute("href", returned);
    await pager.getByRole("link", { name: "2", exact: true }).click();
    await expect(
      page.getByText("Second returned page preview.", { exact: true }),
    ).toBeVisible();
    expect(new URL(ledger.at(-1)!.url).searchParams.get("page")).toBe("2");
    await page.goBack();
    await expect(
      page.getByText("Controlled & complete preview.", { exact: true }),
    ).toBeVisible();
    expect(reads).toBe(2);
    expect(
      ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
    ).toHaveLength(2);
  } finally {
    await info.attach("messages-paging.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("messages-paging-requests.json", {
      body: JSON.stringify(ledger),
      contentType: "application/json",
    });
  }
});

test("J75.messages-locales: translate private-list controls while retaining native peer text without additional reads", async ({
  page,
}, info) => {
  const ledger = await openMessageFixture(page, () => ({ body: populated }));
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
  for (const [locale, title, refresh] of [
    ["zh-CN", "私信", "刷新私信"],
    ["zh-TW", "私訊", "重新整理私訊"],
    ["en", "Messages", "Refresh messages"],
  ]) {
    await page.getByRole("button", { name: /^(Settings|设置|設定)$/ }).click();
    await page.locator("#interface-language").selectOption(locale!);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: title!, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: refresh!, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Listener Nine", exact: true }),
    ).toBeVisible();
    expect(
      ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
    ).toHaveLength(1);
  }
  await info.attach("messages-locales.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("messages-locales-requests.json", {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
});

// The current native sent-last row styles the self label, not its peer link.
// Authored aliases preserve that observed structure without private capture data.
const sentLastPeer = `${header}<div id="ct"><ul class="tb"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li></ul><form id="deletepmform"><div class="pml"><dl id="pmlist_83" class="bbda cur1 cl"><dd class="m avt"><div class="newpm_avt"></div><a href="home.php?mod=space&uid=9">Avatar</a></dd><dd class="ptm pm_c"><span class="xi2 xw1">您</span> 对 <a href="home.php?mod=space&uid=9">Listener Nine</a> 说 :<br>Authored outgoing preview.<br><span class="xg1"><span title="2026-11-04 17:15">now</span></span><span class="pm_o"><a id="pmlist_83_a" href="home.php?mod=space&do=pm&subop=view&touid=9#last">回复</a></span></dd></dl></div></form></div>`;

test("J75.messages-sent-last-peer: retain the recipient when the current native row styles the self sender instead of the peer", async ({
  page,
}, info) => {
  const ledger = await openMessageFixture(page, () => ({ body: sentLastPeer }));
  try {
    const peer = page.locator('[data-peer-id="9"]');
    await expect(
      peer.getByRole("heading", { name: "Listener Nine", exact: true }),
    ).toBeVisible();
    await expect(
      peer.getByText("Authored outgoing preview.", { exact: true }),
    ).toBeVisible();
    await expect(
      peer.getByText("Forum marks this conversation unread", { exact: true }),
    ).toHaveCount(0);
    await expect(
      peer.getByRole("link", { name: /continue in native forum/ }),
    ).toHaveAttribute(
      "href",
      `${origin}/home.php?mod=space&do=pm&subop=view&touid=9&tsdm-native=1#last`,
    );
    expect(
      ledger.filter((x) => new URL(x.url).searchParams.get("do") === "pm"),
    ).toHaveLength(1);
  } finally {
    await info.attach("messages-sent-last.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("messages-sent-last-requests.json", {
      body: JSON.stringify(ledger),
      contentType: "application/json",
    });
  }
});

// Integration failure inventory: a hidden list can hide Messages on entry;
// Messages can occupy the wrong grid track; explicit load/refresh can discard
// the retained thread and its reading position. Exercise only the full UI seam.
test("J75.messages-three-regions: reveal the peer-list pane and retain thread reading through deliberate loads", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ledger: string[] = [];
  const steps: unknown[] = [];
  const observe = async (name: string) =>
    steps.push({ name, ...(await readableLines(page)) });
  const thread = `${header}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Retained forum thread</h1><div id="post_100"><div class="authi"><a href="home.php?mod=space&uid=9">Listener Nine</a></div><a id="postnum100">1</a><div class="pcb">${"<p>Complete retained reading text.</p>".repeat(150)}</div></div></div>`;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    ledger.push(request.url());
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        uid: 7,
        document:
          new URL(request.url()).searchParams.get("do") === "pm"
            ? populated
            : thread,
      }),
    });
  });
  try {
    await page.goto(`${origin}/forum.php?mod=viewthread&tid=42`);
    await page.addScriptTag({
      content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
    });
    const reader = page.locator(".reading-pane");
    await expect(
      page.locator(".conversation-region").getByRole("heading", {
        name: "Retained forum thread",
        exact: true,
      }),
    ).toBeVisible();
    await reader.evaluate((node) => {
      node.scrollTop = 450;
    });
    const anchor = page.locator("#pid100");
    const visibleBefore = await readableLines(page);
    const postTop = await anchor.evaluate(
      (node) => node.getBoundingClientRect().top,
    );
    expect(await reader.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Messages", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Threads pane", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    const peers = page.locator("#thread-list-pane.messages-pane");
    // A retained reader must not add a second list placeholder in Messages.
    await expect(page.locator("#thread-list-pane")).toHaveCount(1);
    await expect(peers).toBeVisible();
    await observe("first messages");
    const beforeReselect = ledger.length;
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
    await expect(peers).toBeHidden();
    await observe("hidden peers");
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Messages", exact: true })
      .click();
    await expect(peers).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Threads pane", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await observe("reselected messages");
    expect(ledger).toHaveLength(beforeReselect);
    expect(Math.round((await peers.boundingBox())!.width)).toBe(300);
    await expect(
      page.locator(".conversation-region").getByRole("heading", {
        name: "Retained forum thread",
        exact: true,
      }),
    ).toBeVisible();
    expect(ledger.filter((url) => url.includes("do=pm"))).toHaveLength(0);
    await page
      .getByRole("button", { name: "Load messages", exact: true })
      .click();
    await expect(
      peers.getByText("Controlled & complete preview."),
    ).toBeVisible();
    await expect(
      page.locator(".conversation-region").getByRole("heading", {
        name: "Retained forum thread",
        exact: true,
      }),
    ).toBeVisible();
    await info.attach("messages-retained-lines.json", {
      body: JSON.stringify({
        before: visibleBefore,
        after: await readableLines(page),
        steps,
      }),
      contentType: "application/json",
    });
    // Native integer scroll positions can round across successive restores.
    expect(
      Math.abs(
        (await anchor.evaluate((node) => node.getBoundingClientRect().top)) -
          postTop,
      ),
    ).toBeLessThanOrEqual(1);
    expect(await reader.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Refresh messages", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Refresh messages", exact: true }),
    ).toBeEnabled();
    await info.attach("messages-refreshed-lines.json", {
      body: JSON.stringify({
        before: visibleBefore,
        after: await readableLines(page),
      }),
      contentType: "application/json",
    });
    await expect(
      page.locator(".conversation-region").getByRole("heading", {
        name: "Retained forum thread",
        exact: true,
      }),
    ).toBeVisible();
    // Native integer scroll positions can round across successive restores.
    expect(
      Math.abs(
        (await anchor.evaluate((node) => node.getBoundingClientRect().top)) -
          postTop,
      ),
    ).toBeLessThanOrEqual(1);
    expect(await reader.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    expect(ledger.filter((url) => url.includes("do=pm"))).toHaveLength(2);
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
    await expect(peers).toBeHidden();
    await expect(reader).toBeVisible();
  } finally {
    await info.attach("messages-three-region-requests.json", {
      body: JSON.stringify(ledger),
      contentType: "application/json",
    });
    await info.attach("messages-three-regions.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});
