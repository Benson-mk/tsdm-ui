import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const conversation = (peer = "9", page?: string) =>
  `${origin}/home.php?mod=space&do=pm&subop=view&touid=${peer}${page ? `&page=${page}` : ""}`;
const header =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const publicThread = `${header}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Public retained thread</h1><div id="post_900"><div class="authi"><a href="home.php?mod=space&uid=9">Listener Nine</a></div><a id="postnum900">1</a><div class="pcb">${"<p>Complete public reading.</p>".repeat(120)}</div></div></div>`;
const replyForm = `${header}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input name="formhash" value="authored-only"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit">Continue</button></form>`;
const directory = `${header}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const peers = `${header}<div id="ct"><ul class="tb"><li class="a"><a href="home.php?mod=space&do=pm&filter=privatepm">私人消息</a></li></ul><div class="pml">${["9", "10"].map((peer, i) => `<dl id="pmlist_${81 + i}"><dd class="avt"><a href="home.php?mod=space&uid=${peer}">Avatar</a></dd><dd class="pm_c"><a href="home.php?mod=space&uid=${peer}">${peer === "9" ? "Listener Nine" : "Reader Ten"}</a><br>Preview ${peer}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span><a id="pmlist_${81 + i}_a" href="${conversation(peer)}#last">回复</a></dd></dl>`).join("")}</div></div>`;
function message(
  id: string,
  sender = "9",
  body = `Complete private body ${id}.`,
) {
  return `<dl id="pmlist_${id}"><dd class="pm_o"><a href="javascript:deletePrivate()">Delete</a></dd><dd class="avt"><a href="home.php?mod=space&uid=${sender}">Avatar</a></dd><dd class="ptm">${sender === "7" ? '<span class="xi2 xw1">您</span>' : `<a class="xw1" href="home.php?mod=space&uid=${sender}">${sender === "9" ? "Listener Nine" : "Reader Ten"}</a>`}<br>${body}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span></dd></dl>`;
}
function history(
  peer = "9",
  rows = `${message("101", peer, "First line<br>第二行 <a href='https://example.test/read'>A returned link</a><script>window.privateScriptRan=true</script>")}<a name="last"></a>${message("102", "7")}`,
  pager = "",
  count = "2",
) {
  return `${header}<div id="ct"><div class="bm bw0"><div class="tbmu pml"><div class="xw1">共有 <span id="membernum">${count}</span> 条与 <a href="home.php?mod=space&uid=${peer}">${peer === "9" ? "Listener Nine" : "Reader Ten"}</a> 的交谈记录</div></div><div id="pm_ul" class="pml">${rows}</div>${pager}<div id="pm_ul_post"><form id="pmform"><input name="topmuid" value="${peer}"><input name="formhash" value="authored-only"><textarea name="message"></textarea><button>Send native</button></form></div></div></div>`;
}
const ledgers = new WeakMap<Page, { url: string; method: string }[]>();
async function open(
  page: Page,
  response: (url: URL) => string | null | Promise<string | null> = () =>
    history(),
  start = `${origin}/forum.php`,
  peerList = peers,
) {
  const ledger: { url: string; method: string }[] = [];
  ledgers.set(page, ledger);
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: "<html><body>Native forum</body></html>",
      });
    const url = new URL(request.url());
    ledger.push({ url: url.href, method: request.method() });
    const document =
      url.searchParams.get("subop") === "view"
        ? await response(url)
        : url.searchParams.get("do") === "pm"
          ? peerList
          : url.searchParams.get("mod") === "post"
            ? replyForm
            : url.searchParams.get("mod") === "viewthread"
              ? publicThread
              : directory;
    if (document === null) return route.abort("connectionfailed");
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ uid: 7, document }),
    });
  });
  await page.goto(start);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(page.locator(".workspace")).toBeVisible();
  return ledger;
}
async function loadPeers(page: Page) {
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load messages", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Listener Nine", exact: true }),
  ).toBeVisible();
}
test.afterEach(async ({ page }, info) => {
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("reading-geometry.json", {
    body: JSON.stringify(
      await page.locator(".reading-pane").evaluateAll((nodes) =>
        nodes.map((n) => ({
          ids: [...n.querySelectorAll("article")].map((r) => r.id),
          scrollTop: n.scrollTop,
          scrollHeight: n.scrollHeight,
          clientHeight: n.clientHeight,
          textBytes: new TextEncoder().encode(n.textContent ?? "").length,
          anchors: [...n.querySelectorAll("article")].map((r) => ({
            id: r.id,
            top: r.getBoundingClientRect().top,
          })),
        })),
      ),
    ),
    contentType: "application/json",
  });
  await info.attach("recovery-size.json", {
    body: JSON.stringify(
      await page.evaluate(() => ({
        bytes: new TextEncoder().encode(
          sessionStorage.getItem("tsdm.workspace.recovery") ?? "",
        ).length,
      })),
    ),
    contentType: "application/json",
  });
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
function pager(current: string, earlier?: string, later?: string) {
  return `<div class="pg">${earlier ? `<span class="pgb"><a href="${conversation("9", earlier)}">Earlier</a></span>` : ""}<strong>${current}</strong>${later ? `<a class="nxt" href="${conversation("9", later)}">Later</a>` : ""}</div>`;
}

async function choose(page: Page, name = "Listener Nine") {
  await page
    .getByRole("link", {
      name: `Read private conversation with ${name}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: `Private conversation with ${name}`,
      exact: true,
    }),
  ).toBeVisible();
}
function rangeResponse(url: URL) {
  if (url.searchParams.get("touid") === "10")
    return history("10", message("101", "10", "Other peer body"), "", "1");
  return url.searchParams.get("page") === "1"
    ? history(
        "9",
        message(
          "101",
          "9",
          "<p>Earlier complete private message.</p>".repeat(60),
        ) + message("102"),
        pager("1", undefined, "2"),
        "4",
      )
    : history(
        "9",
        message(
          "103",
          "9",
          "<p>Remember this complete private body.</p>".repeat(100),
        ) + message("104", "7"),
        pager("2", "1"),
        "4",
      );
}
async function visiblePrivatePosition(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  return page.locator(".private-reading-pane").evaluate((reader) => {
    const rect = reader.getBoundingClientRect();
    const outer = reader
      .closest(".conversation-region")!
      .getBoundingClientRect();
    const top = Math.max(0, rect.top, outer.top);
    const bottom = Math.min(innerHeight, rect.bottom, outer.bottom);
    const paragraph = [
      ...reader.querySelectorAll<HTMLParagraphElement>("article p"),
    ].find((node) => {
      const bounds = node.getBoundingClientRect();
      return bottom > top && bounds.bottom > top && bounds.top < bottom;
    });
    const article = paragraph?.closest("article");
    return {
      visibleHeight: Math.max(0, bottom - top),
      paragraph:
        paragraph && article
          ? `${article.id}:${[...article.querySelectorAll("p")].indexOf(paragraph)}`
          : null,
      offset: paragraph ? paragraph.getBoundingClientRect().top - top : null,
      paneTop: rect.top,
      articleTop: article?.getBoundingClientRect().top,
      outerScroll: reader.closest(".conversation-region")!.scrollTop,
    };
  });
}
async function expectPrivatePosition(
  page: Page,
  before: Awaited<ReturnType<typeof visiblePrivatePosition>>,
) {
  const after = await visiblePrivatePosition(page);
  await test.info().attach("visible-private-position.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  expect(before.paragraph).not.toBeNull();
  expect(after.visibleHeight).toBeGreaterThan(0);
  expect(after.paragraph).toBe(before.paragraph);
  expect(Math.abs(after.offset! - before.offset!)).toBeLessThanOrEqual(1);
}

test("J78.private-range-return: ordinary peer return retains full range and nonzero reading offset without GET", async ({
  page,
}) => {
  const ledger = await open(page, rangeResponse);
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(4);
  await reader.evaluate((n) => {
    n.scrollTop = 650;
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const offset = await reader.evaluate((n) => n.scrollTop);
  expect(offset).toBeGreaterThan(0);
  const prior = ledger.filter(
    (x) => x.url.includes("subop=view") && x.url.includes("touid=9"),
  ).length;
  await choose(page, "Reader Ten");
  await expect(
    page.getByText("Other peer body", { exact: false }),
  ).toBeVisible();
  await choose(page);
  await expect(reader.locator("article")).toHaveCount(4);
  expect(await reader.evaluate((n) => n.scrollTop)).toBeCloseTo(offset, 0);
  expect(
    ledger.filter(
      (x) => x.url.includes("subop=view") && x.url.includes("touid=9"),
    ),
  ).toHaveLength(prior);
});

test("J78.private-marker-reload: safe containing-page marker stays passive until deliberate load", async ({
  page,
}) => {
  const ledger = await open(page, rangeResponse);
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(4);
  await reader.evaluate((n) => {
    const row = n.querySelector("#pmlist_101")!;
    n.scrollTop +=
      row.getBoundingClientRect().top - n.getBoundingClientRect().top + 12;
  });
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const saved: {
          entries: Record<
            string,
            { readingMarker?: { position: { anchor: string } } }
          >;
        } = JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!);
        return Object.values(saved.entries).some(
          (e) => e.readingMarker?.position.anchor === "pmlist_101",
        );
      }),
    )
    .toBe(true);
  const before = await visiblePrivatePosition(page);
  const record = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery")!,
  );
  expect(record).not.toContain("Remember this complete private body");
  expect(record).not.toContain("Listener Nine");
  expect(record).not.toContain("authored-only");
  const reads = ledger.length;
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(
    page.getByRole("button", {
      name: "Load private conversation",
      exact: true,
    }),
  ).toBeVisible();
  expect(ledger).toHaveLength(reads);
  await page
    .getByRole("button", { name: "Load private conversation", exact: true })
    .click();
  await expect(reader.locator("#pmlist_101")).toBeVisible();
  expect(ledger.at(-1)!.url).toContain("page=1");
  await expectPrivatePosition(page, before);
});

test("J78.private-boundary-approach: deliberate approach coalesces returned earlier boundary and preserves anchor", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const ledger = await open(page, async (url) => {
    if (url.searchParams.get("page") === "1") await gate;
    return rangeResponse(url);
  });
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  await reader.evaluate((n) => {
    n.scrollTop = 100;
    n.dispatchEvent(new Event("scroll"));
    n.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => ledger.filter((x) => x.url.includes("page=1")).length)
    .toBe(1);
  const before = await page
    .locator("#pmlist_103")
    .evaluate((n) => n.getBoundingClientRect().top);
  release();
  await expect(reader.locator("article")).toHaveCount(4);
  expect(
    Math.abs(
      (await page
        .locator("#pmlist_103")
        .evaluate((n) => n.getBoundingClientRect().top)) - before,
    ),
  ).toBeLessThanOrEqual(1);
  expect(ledger.filter((x) => x.url.includes("page=1"))).toHaveLength(1);
});

test("J78.private-refresh-membership: refresh physical newest page retains older content, updates edits and counts stable arrivals once", async ({
  page,
}) => {
  let newestReads = 0;
  const ledger = await open(page, (url) => {
    if (url.searchParams.get("page") === "1") return rangeResponse(url);
    newestReads++;
    return newestReads === 1
      ? rangeResponse(url)
      : history(
          "9",
          message(
            "103",
            "9",
            "<p>Edited complete private body.</p>".repeat(100),
          ) +
            message("104", "7") +
            message("105"),
          pager("2", "1"),
          "5",
        );
  });
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(4);
  await reader.evaluate((n) => {
    n.scrollTop = 650;
  });
  const before = await visiblePrivatePosition(page);
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(5);
  await expect(reader.locator("#pmlist_103")).toContainText(
    "Edited complete private body.",
  );
  await expect(
    page.getByRole("button", { name: "New messages (1)", exact: true }),
  ).toBeVisible();
  await expectPrivatePosition(page, before);
  expect(ledger.at(-1)!.url).toContain("page=2");
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect.poll(() => newestReads).toBe(3);
  await expect(
    page.getByRole("button", { name: "New messages (1)", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Last successful check/)).toBeVisible();
  expect(ledger.every((x) => x.method === "GET")).toBe(true);
});

const completeRows = () =>
  message("201", "9", "<p>Complete single-page reading.</p>".repeat(100)) +
  message("202", "7");
for (const distance of [64, 65])
  test(`J78.private-follow-${distance}: follow needs current pre-insertion threshold and latest evidence`, async ({
    page,
  }) => {
    let count = 0;
    await open(page, () =>
      history(
        "9",
        completeRows() +
          (++count > 1
            ? message("203", "9", "<p>New arrival.</p>".repeat(30))
            : ""),
        "",
        count > 1 ? "3" : "2",
      ),
    );
    await loadPeers(page);
    await choose(page);
    const reader = page.locator(".private-reading-pane");
    await reader.evaluate((n, d) => {
      n.scrollTop = n.scrollHeight - n.clientHeight - d;
    }, distance);
    const before = await visiblePrivatePosition(page);
    await page
      .getByRole("button", { name: "Refresh conversation", exact: true })
      .click({ force: true });
    await expect(reader.locator("article")).toHaveCount(3);
    if (distance === 64) {
      await expect
        .poll(() =>
          reader.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop),
        )
        .toBeLessThanOrEqual(1);
      await expect(
        page.getByRole("button", { name: "New messages (1)", exact: true }),
      ).toHaveCount(0);
    } else {
      await expectPrivatePosition(page, before);
      await page
        .getByRole("button", { name: "New messages (1)", exact: true })
        .click({ force: true });
      await expect
        .poll(() =>
          reader.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop),
        )
        .toBeLessThanOrEqual(1);
      await expect(
        page.getByRole("button", { name: "New messages (1)", exact: true }),
      ).toHaveCount(0);
    }
  });
test("J78.private-unloaded-later: fresh later link revokes prior completeness even when returned total equals loaded IDs", async ({
  page,
}) => {
  let count = 0;
  await open(page, () =>
    history(
      "9",
      completeRows() +
        (++count > 1
          ? message("203", "9", "<p>New arrival.</p>".repeat(30))
          : ""),
      count > 1 ? pager("1", undefined, "2") : "",
      count > 1 ? "3" : "2",
    ),
  );
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await reader.evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
  const before = await visiblePrivatePosition(page);
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(3);
  await expectPrivatePosition(page, before);
  await expect(
    page.getByText("All known messages loaded", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Load later messages", exact: true }),
  ).toBeVisible();
});

test("J78.private-check-policy: distinct private opt-in starts off, discloses read effects and resets on cached return", async ({
  page,
}) => {
  const ledger = await open(page, (url) =>
    url.searchParams.get("touid") === "10"
      ? history("10", message("201", "10"), "", "1")
      : history("9", completeRows(), "", "2"),
  );
  await loadPeers(page);
  await choose(page);
  const toggle = page.getByRole("checkbox", {
    name: "Check private conversation every 2 minutes while active",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByText(
      "Checks may mark private messages read. This is an optional 2-minute app policy, not an instant-delivery promise.",
      { exact: true },
    ),
  ).toBeVisible();
  const count = ledger.length;
  await toggle.check();
  expect(ledger).toHaveLength(count);
  await choose(page, "Reader Ten");
  await expect(toggle).not.toBeChecked();
  await choose(page);
  await expect(toggle).not.toBeChecked();
});
test("J78.private-check-failure: failures preserve history, stop automatic checks and retain cooldown through cached return", async ({
  page,
}) => {
  let fail = false;
  const ledger = await open(page, (url) =>
    url.searchParams.get("touid") === "10"
      ? history("10", message("201", "10"), "", "1")
      : fail
        ? null
        : history("9", completeRows(), "", "2"),
  );
  await loadPeers(page);
  await choose(page);
  await page
    .getByRole("checkbox", {
      name: "Check private conversation every 2 minutes while active",
      exact: true,
    })
    .check();
  fail = true;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  await expect(page.locator(".private-reading-pane article")).toHaveCount(2);
  const count = ledger.length;
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  expect(ledger).toHaveLength(count);
  await choose(page, "Reader Ten");
  await choose(page);
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
});
test("J78.private-real-timer: actual120second cadence pauses for a modal and resumes a full interval", async ({
  page,
}) => {
  test.setTimeout(290_000);
  const ledger = await open(page, () => history("9", completeRows(), "", "2"));
  await loadPeers(page);
  await choose(page);
  const toggle = page.getByRole("checkbox", {
    name: "Check private conversation every 2 minutes while active",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  const count = ledger.length;
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.waitForTimeout(121_000);
  expect(ledger).toHaveLength(count);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const resumed = Date.now();
  await expect(
    page.getByText("Checks enabled · every 2 minutes", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(118_000);
  expect(ledger).toHaveLength(count);
  await expect.poll(() => ledger.length, { timeout: 5_000 }).toBe(count + 1);
  expect(Date.now() - resumed).toBeGreaterThanOrEqual(120_000);
  await toggle.uncheck();
});

test("J78.private-current-position: scrolling during a delayed refresh uses the current off-bottom anchor", async ({
  page,
}) => {
  let reads = 0,
    release!: () => void;
  const held = new Promise<void>((r) => {
    release = r;
  });
  await open(page, async () => {
    if (++reads > 1) await held;
    return history(
      "9",
      completeRows() + (reads > 1 ? message("203") : ""),
      "",
      reads > 1 ? "3" : "2",
    );
  });
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await reader.evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect.poll(() => reads).toBe(2);
  await reader.evaluate((n) => {
    n.scrollTop = 900;
  });
  const before = await visiblePrivatePosition(page);
  release();
  await expect(reader.locator("article")).toHaveCount(3);
  await expectPrivatePosition(page, before);
  await expect(
    page.getByRole("button", { name: "New messages (1)", exact: true }),
  ).toBeVisible();
});
test("J78.private-overlap-reappearance: refreshed membership preserves overlapping older IDs and never recounts a removed arrival", async ({
  page,
}) => {
  let stage = 0;
  await open(page, (url) =>
    url.searchParams.get("page") === "1"
      ? history(
          "9",
          message("101", "9", "<p>Earlier overlap page.</p>".repeat(100)) +
            message("102"),
          pager("1", undefined, "2"),
          "3",
        )
      : history(
          "9",
          (stage < 2 ? message("102") : "") +
            message("103") +
            (stage === 1 || stage === 3 ? message("104") : ""),
          pager("2", "1"),
          stage === 1 || stage === 3 ? "4" : "3",
        ),
  );
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane"),
    refresh = page.getByRole("button", {
      name: "Refresh conversation",
      exact: true,
    });
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(3);
  await reader.evaluate((n) => {
    n.scrollTop = 700;
  });
  stage = 1;
  await refresh.click({ force: true });
  await expect(
    page.getByRole("button", { name: "New messages (1)", exact: true }),
  ).toBeVisible();
  stage = 2;
  await refresh.click({ force: true });
  await expect(reader.locator("#pmlist_104")).toHaveCount(0);
  await expect(reader.locator("#pmlist_102")).toHaveCount(1);
  stage = 3;
  await refresh.click({ force: true });
  await expect(reader.locator("#pmlist_104")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /New messages/ })).toHaveCount(
    0,
  );
});
for (const mode of ["peer", "account"] as const)
  test(`J78.private-stale-${mode}: delayed refresh cannot populate a replacement context`, async ({
    page,
  }) => {
    let reads = 0,
      release!: () => void;
    const held = new Promise<void>((r) => {
      release = r;
    });
    await open(page, async (url) => {
      if (url.searchParams.get("touid") === "10")
        return history(
          "10",
          message("201", "10", "Other peer complete message"),
          "",
          "1",
        );
      if (++reads > 1) await held;
      const body = history(
        "9",
        completeRows() + (reads > 1 ? message("203") : ""),
        "",
        reads > 1 ? "3" : "2",
      );
      return mode === "account" && reads > 1
        ? body.replace(header, header.replace("uid=7", "uid=8"))
        : body;
    });
    await loadPeers(page);
    await choose(page);
    await page
      .getByRole("button", { name: "Refresh conversation", exact: true })
      .click({ force: true });
    await expect.poll(() => reads).toBe(2);
    if (mode === "peer") await choose(page, "Reader Ten");
    release();
    if (mode === "account")
      await expect(page.locator(".private-reading-pane article")).toHaveCount(
        0,
      );
    else {
      await expect(page.locator(".private-reading-pane article")).toHaveCount(
        1,
      );
      await expect(page.locator("#pmlist_201")).toContainText(
        "Other peer complete message",
      );
    }
    await expect(page.locator("#pmlist_203")).toHaveCount(0);
  });
test("J78.private-marker-ordinary: persisted private marker is reused after reload and deliberate ordinary peer selection", async ({
  page,
}) => {
  const ledger = await open(page, rangeResponse);
  await loadPeers(page);
  await choose(page);
  const reader = page.locator(".private-reading-pane");
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(4);
  await reader.evaluate((n) => {
    const row = n.querySelector("#pmlist_101")!;
    n.scrollTop +=
      row.getBoundingClientRect().top - n.getBoundingClientRect().top + 12;
  });
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Boards", exact: true })
    .click();
  await page.reload();
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  const before = ledger.length;
  await loadPeers(page);
  await choose(page);
  await expect(reader.locator("#pmlist_101")).toBeVisible();
  expect(
    ledger
      .slice(before)
      .filter((x) => x.url.includes("subop=view"))
      .map((x) => new URL(x.url).searchParams.get("page")),
  ).toEqual(["1"]);
});

for (const move of [false, true])
  test(`J78.private-media-${move}: delayed arrival media follows only until later reader intent`, async ({
    page,
  }) => {
    let reads = 0,
      release!: () => void;
    let imageRequested = false;
    const held = new Promise<void>((r) => {
      release = r;
    });
    await open(page, () =>
      history(
        "9",
        completeRows() +
          (++reads > 1
            ? message(
                "203",
                "9",
                '<img src="https://www.tsdm39.com/late-private.png" alt="Delayed private image">',
              )
            : ""),
        "",
        reads > 1 ? "3" : "2",
      ),
    );
    await page.route("**/late-private.png", async (route) => {
      imageRequested = true;
      await held;
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="650"><rect width="400" height="650" fill="orange"/></svg>',
      });
    });
    await loadPeers(page);
    await choose(page);
    const reader = page.locator(".private-reading-pane");
    await reader.evaluate((n) => {
      n.scrollTop = n.scrollHeight;
    });
    await page
      .getByRole("button", { name: "Refresh conversation", exact: true })
      .click({ force: true });
    await expect(page.locator("#pmlist_203")).toHaveCount(1);
    await expect
      .poll(() =>
        reader.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop),
      )
      .toBeLessThanOrEqual(1);
    await expect.poll(() => imageRequested).toBe(true);
    if (move) {
      await reader.evaluate((n) => {
        n.dispatchEvent(new WheelEvent("wheel"));
        n.scrollTop = 700;
      });
    }
    const before = await page
      .locator("#pmlist_201")
      .evaluate((n) => n.getBoundingClientRect().top);
    release();
    await expect
      .poll(() =>
        page
          .getByAltText("Delayed private image")
          .evaluate((n) => (n as HTMLImageElement).naturalHeight),
      )
      .toBe(650);
    if (move)
      expect(
        Math.abs(
          (await page
            .locator("#pmlist_201")
            .evaluate((n) => n.getBoundingClientRect().top)) - before,
        ),
      ).toBeLessThanOrEqual(1);
    else
      await expect
        .poll(() =>
          reader.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop),
        )
        .toBeLessThanOrEqual(1);
  });
test("J78.private-real-cooldown: failure waits120actualseconds with no retry then deliberate second failure backs off4minutes", async ({
  page,
}) => {
  test.setTimeout(150_000);
  let fail = false;
  const ledger = await open(page, () =>
    fail ? null : history("9", completeRows(), "", "2"),
  );
  await loadPeers(page);
  await choose(page);
  const toggle = page.getByRole("checkbox", {
    name: "Check private conversation every 2 minutes while active",
    exact: true,
  });
  await toggle.check();
  fail = true;
  const refresh = page.getByRole("button", {
    name: "Refresh conversation",
    exact: true,
  });
  await refresh.click({ force: true });
  await expect(
    page.getByText(/Check failed. Retry available in 2 minutes/),
  ).toBeVisible();
  const count = ledger.length;
  await page.waitForTimeout(121_000);
  expect(ledger).toHaveLength(count);
  await refresh.click({ force: true });
  await expect(
    page.getByText(/Check failed. Retry available in 4 minutes/),
  ).toBeVisible();
  expect(ledger).toHaveLength(count + 1);
});
test("J78.private-public-isolation: equal numeric IDs remain separate across public/private Back and Forward", async ({
  page,
}) => {
  const ledger = await open(
    page,
    () =>
      history(
        "9",
        message("900", "9", "<p>Private900only.</p>".repeat(100)),
        "",
        "1",
      ),
    `${origin}/forum.php?mod=viewthread&tid=42`,
  );
  await expect(page.locator("#pid900")).toContainText(
    "Complete public reading.",
  );
  await page.locator(".reading-pane").evaluate((n) => {
    n.scrollTop = 650;
  });
  await loadPeers(page);
  await choose(page);
  await expect(page.locator("#pmlist_900")).toContainText("Private900only.");
  await page.locator(".reading-pane").evaluate((n) => {
    n.scrollTop = 800;
  });
  const count = ledger.length;
  await page.goBack();
  await page.goBack();
  await expect(page.locator("#pid900")).toContainText(
    "Complete public reading.",
  );
  await expect(page.locator("#pmlist_900")).toHaveCount(0);
  await page.goForward();
  await page.goForward();
  await expect(page.locator("#pmlist_900")).toContainText("Private900only.");
  await expect(page.locator("#pid900")).toHaveCount(0);
  expect(ledger).toHaveLength(count);
});

test("J78.private-locales-targets: private update controls translate and remain44px targets at narrow text sizes", async ({
  page,
}) => {
  const ledger = await open(page, () => history("9", completeRows(), "", "2"));
  await loadPeers(page);
  await choose(page);
  await page.setViewportSize({ width: 390, height: 700 });
  for (const [locale, settings, close, refresh] of [
    ["zh-CN", "设置", "关闭", "刷新私信交谈"],
    ["zh-TW", "設定", "關閉", "重新整理私訊交談"],
    ["en", "Settings", "Close", "Refresh conversation"],
  ]) {
    await page
      .getByRole("button", { name: /^(Settings|设置|設定)$/, exact: true })
      .click();
    await page.locator("#interface-language").selectOption(locale!);
    const dialog = page.getByRole("dialog", { name: settings!, exact: true });
    await dialog.getByRole("slider").fill("70");
    await dialog.getByRole("button", { name: close!, exact: true }).click();
    await expect(
      page.getByRole("button", { name: refresh!, exact: true }),
    ).toBeVisible();
    const target = page.locator(
      ".conversation-heading .history-controls label",
    );
    expect(
      await target.evaluate((n) => n.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
    await expect(page.locator(".private-reading-pane article")).toHaveCount(2);
  }
  expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(1);
});

for (const direction of ["earlier", "later", "complete"] as const)
  test(`J78.private-initial-coverage-${direction}: initial count-only completeness cannot override a returned unloaded boundary`, async ({
    page,
  }) => {
    const ledger = await open(page, () =>
      history(
        "9",
        message("201") + message("202"),
        direction === "earlier"
          ? pager("2", "1")
          : direction === "later"
            ? pager("1", undefined, "2")
            : "",
        "2",
      ),
    );
    await loadPeers(page);
    await choose(page);
    const automatic = page.getByRole("checkbox", {
      name: "Check private conversation every 2 minutes while active",
      exact: true,
    });
    if (direction === "complete") {
      await expect(automatic).not.toBeChecked();
      await expect(
        page.getByText("All known messages loaded", { exact: true }),
      ).toBeVisible();
    } else {
      await expect(automatic).toHaveCount(0);
      await expect(
        page.getByText("All known messages loaded", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", {
          name:
            direction === "earlier"
              ? "Load earlier messages"
              : "Load later messages",
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(1);
  });

test("J78.private-unresolved-last: unchanged refresh does not silently clear an unresolved native last target", async ({
  page,
}) => {
  await open(page, () => history("9", completeRows(), "", "2"));
  await loadPeers(page);
  await choose(page);
  const missing = page.getByText(
    "The requested private message is not in this returned page. Use the returned pages or continue in the native forum.",
    { exact: true },
  );
  await expect(missing).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh conversation", exact: true })
    .click({ force: true });
  await expect(page.getByText(/Last successful check/)).toBeVisible();
  await expect(missing).toBeVisible();
});

for (const [width, size, returnHeight] of [
  [390, 150, 700],
  [1440, 100, 700],
  [390, 150, 500],
])
  test(`J78.private-outer-return-${width}-${returnHeight}: retained private reading restores both scroll owners and the actual visible paragraphs`, async ({
    page,
  }) => {
    const ledger = await open(
      page,
      () =>
        history(
          "9",
          message(
            "201",
            "9",
            Array.from(
              { length: 100 },
              (_, i) =>
                `<p>Private paragraph ${i}: complete authored private body.</p>`,
            ).join(""),
          ) + message("202"),
          "",
          "2",
        ),
      `${origin}/forum.php?mod=viewthread&tid=42`,
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("dialog").getByRole("slider").fill(String(size));
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await loadPeers(page);
    await choose(page);
    await page.setViewportSize({ width: width!, height: 700 });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    await page.locator(".conversation-region").evaluate((n) => {
      n.scrollTop = n.scrollHeight;
    });
    await page.locator(".private-reading-pane").evaluate((n) => {
      n.scrollTop = 650;
    });
    const geometry = () =>
      page.locator(".private-reading-pane").evaluate((n) => {
        const region = n.closest(".conversation-region")!;
        const rect = n.getBoundingClientRect(),
          outer = region.getBoundingClientRect();
        const top = Math.max(0, rect.top, outer.top),
          bottom = Math.min(innerHeight, rect.bottom, outer.bottom);
        return {
          outerScroll: region.scrollTop,
          innerScroll: n.scrollTop,
          paneTop: rect.top,
          visibleHeight: Math.max(0, bottom - top),
          anchorTop: n.querySelector("article")!.getBoundingClientRect().top,
          visibleParagraphs: [...n.querySelectorAll("article p")]
            .filter((p) => {
              const r = p.getBoundingClientRect();
              return bottom > top && r.bottom > top && r.top < bottom;
            })
            .map((p) => p.textContent),
        };
      });
    const before = await geometry();
    const visibleBefore = await visiblePrivatePosition(page);
    expect(before.visibleHeight).toBeGreaterThan(50);
    const reads = ledger.filter((r) => r.url.includes("subop=view")).length;
    await page.goBack();
    await page.goBack();
    await expect(page.locator("#pid900")).toBeVisible();
    await page.setViewportSize({ width: width!, height: returnHeight! });
    await page.goForward();
    await page.goForward();
    await expect(page.locator("#pmlist_201")).toHaveCount(1);
    await visiblePrivatePosition(page);
    const after = await geometry();
    await test.info().attach("outer-return-geometry.json", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    expect(ledger.filter((r) => r.url.includes("subop=view"))).toHaveLength(
      reads,
    );
    expect(after.visibleHeight).toBeGreaterThan(50);
    expect(after.visibleParagraphs).toEqual(before.visibleParagraphs);
    await expectPrivatePosition(page, visibleBefore);
    if (Math.abs(after.paneTop - before.paneTop) <= 1)
      expect(Math.abs(after.anchorTop - before.anchorTop)).toBeLessThanOrEqual(
        1,
      );
  });

for (const height of [700, 500])
  test(`J78.private-follow-visible-${height}: latest following keeps a complete new private text line inside the clipped narrow reader`, async ({
    page,
  }) => {
    let reads = 0;
    await open(page, () => {
      reads++;
      return history(
        "9",
        completeRows() +
          (reads > 1
            ? message("203", "9", "<p>New visible private arrival.</p>")
            : ""),
        "",
        reads > 1 ? "3" : "2",
      );
    });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("dialog").getByRole("slider").fill("150");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await loadPeers(page);
    await choose(page);
    await page.setViewportSize({ width: 390, height });
    await page.locator(".conversation-region").evaluate((n) => {
      n.scrollTop = n.scrollHeight;
    });
    const reader = page.locator(".private-reading-pane");
    await reader.evaluate((n) => {
      n.scrollTop = n.scrollHeight;
    });
    const before = await visiblePrivatePosition(page);
    expect(before.visibleHeight).toBeGreaterThan(50);
    await page
      .getByRole("button", { name: "Refresh conversation", exact: true })
      .click({ force: true });
    await expect(page.locator("#pmlist_203")).toHaveCount(1);
    const after = await visiblePrivatePosition(page);
    const arrival = await page.locator("#pmlist_203 p").evaluate((n) => {
      const r = n.getBoundingClientRect(),
        reader = n.closest(".reading-pane")!.getBoundingClientRect(),
        outer = n.closest(".conversation-region")!.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(innerHeight, r.bottom, reader.bottom, outer.bottom) -
          Math.max(0, r.top, reader.top, outer.top),
      );
    });
    const readable = await page.locator("#pmlist_203 p").evaluate((n) => {
      const reader = n.closest(".reading-pane")!.getBoundingClientRect(),
        outer = n.closest(".conversation-region")!.getBoundingClientRect();
      const top = Math.max(0, reader.top, outer.top),
        bottom = Math.min(innerHeight, reader.bottom, outer.bottom);
      const range = document.createRange();
      range.selectNodeContents(n);
      const lines = [...range.getClientRects()]
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          fullyVisible: r.top >= top - 1 && r.bottom <= bottom + 1,
        }));
      return { top, bottom, lines };
    });
    await test.info().attach("follow-visible-geometry.json", {
      body: JSON.stringify({ before, after, arrival, readable }),
      contentType: "application/json",
    });
    expect(
      await reader.evaluate(
        (n) => n.scrollHeight - n.clientHeight - n.scrollTop,
      ),
    ).toBeLessThanOrEqual(1);
    expect(after.visibleHeight).toBeGreaterThan(50);
    expect(arrival).toBeGreaterThan(0);
    expect(readable.lines.some((line) => line.fullyVisible)).toBe(true);
  });
