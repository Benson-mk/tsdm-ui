import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
import { revealNavigation } from "./navigation-ui";

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
  await info.attach("workspace.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J76.private-open: deliberately read named recipient with complete chronological content and exact returned target", async ({
  page,
}) => {
  const ledger = await open(page);
  await loadPeers(page);
  await expect(
    page.getByText(/Opening.*conversation.*mark.*read/i),
  ).toBeVisible();
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const reader = page.getByRole("region", {
    name: "Private conversation with Listener Nine",
    exact: true,
  });
  await expect(reader).toBeVisible();
  await expect(reader.locator("article")).toHaveCount(2);
  expect(
    await reader
      .locator("article")
      .evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual(["pmlist_101", "pmlist_102"]);
  await expect(reader.getByText("第二行", { exact: false })).toBeVisible();
  await expect(
    reader.getByRole("link", { name: "A returned link", exact: true }),
  ).toHaveAttribute("href", "https://example.test/read");
  await expect(reader.locator("#pmlist_102")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  await expect(reader.locator("#pmlist_102")).toBeFocused();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  expect(await page.evaluate(() => "privateScriptRan" in window)).toBe(false);
  expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(1);
  expect(ledger.every((x) => x.method === "GET")).toBe(true);
  await expect(
    page.locator(".messages-pane [data-peer-id='9'] a[aria-current='true']"),
  ).toBeVisible();
});

test("J76.private-direct-reload: direct arrival and recovery require a deliberate private read and never serialize bodies", async ({
  page,
}) => {
  const ledger = await open(page, () => history(), `${conversation()}#last`);
  await expect(
    page.getByRole("button", {
      name: "Load private conversation",
      exact: true,
    }),
  ).toBeVisible();
  expect(ledger).toHaveLength(0);
  await page
    .getByRole("button", { name: "Load private conversation", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).not.toContain("First line");
  expect(saved).not.toContain("Listener Nine");
  const before = ledger.length;
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
  await expect(page.locator(".private-reading-pane article")).toHaveCount(0);
  expect(ledger).toHaveLength(before);
});

function pager(current: string, earlier?: string, later?: string) {
  return `<div class="pg">${earlier ? `<span class="pgb"><a href="${conversation("9", earlier)}">Earlier</a></span>` : ""}<strong>${current}</strong>${later ? `<a class="nxt" href="${conversation("9", later)}">Later</a>` : ""}</div>`;
}
test("J76.private-pages: merge only returned adjacent pages chronologically, deduplicate, retain anchor and expose actual boundaries", async ({
  page,
}) => {
  const ledger = await open(page, (url) => {
    const p = url.searchParams.get("page") ?? "2";
    return p === "1"
      ? history(
          "9",
          message("101") + message("102") + message("103"),
          pager("1", undefined, "2"),
          "6",
        )
      : p === "3"
        ? history("9", message("105") + message("106"), pager("3", "2"), "6")
        : history(
            "9",
            message(
              "103",
              "9",
              "<p>Retained middle private content.</p>".repeat(100),
            ) + message("104", "7"),
            pager("2", "1", "3"),
            "6",
          );
  });
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const reader = page.locator(".private-reading-pane");
  await expect(reader.locator("article")).toHaveCount(2);
  await reader.evaluate((n) => {
    n.scrollTop = 420;
  });
  const anchor = page.locator("#pmlist_103");
  const geometry = () =>
    anchor.evaluate((n) => ({
      top: n.getBoundingClientRect().top,
      readingTop: n.closest(".reading-pane")!.getBoundingClientRect().top,
      scroll: n.closest(".reading-pane")!.scrollTop,
      outerTop: n.closest(".conversation-region")?.scrollTop,
      height: n.closest(".reading-pane")!.clientHeight,
    }));
  const initialGeometry = await geometry();
  const before = initialGeometry.top;
  const historyLength = await page.evaluate(() => window.history.length);
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(4);
  await test.info().attach("manual-anchor-geometry.json", {
    body: JSON.stringify({
      before: initialGeometry,
      after: await geometry(),
    }),
    contentType: "application/json",
  });
  expect(
    Math.abs(
      (await anchor.evaluate((n) => n.getBoundingClientRect().top)) - before,
    ),
  ).toBeLessThanOrEqual(1);
  await page
    .getByRole("button", { name: "Load later messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(6);
  expect(
    await reader
      .locator("article")
      .evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual([
    "pmlist_101",
    "pmlist_102",
    "pmlist_103",
    "pmlist_104",
    "pmlist_105",
    "pmlist_106",
  ]);
  expect(
    Math.abs(
      (await anchor.evaluate((n) => n.getBoundingClientRect().top)) - before,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.getByText("All known messages loaded", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
  expect(
    ledger
      .filter((x) => x.url.includes("subop=view"))
      .map((x) => new URL(x.url).searchParams.get("page")),
  ).toEqual([null, "1", "3"]);
});

test("J76.private-local-target: an exact returned message in the loaded range changes focus without a private reread", async ({
  page,
}) => {
  const ledger = await open(page);
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await expect(page.locator("#pmlist_102")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  const before = ledger.length;
  const length = await page.evaluate(() => window.history.length);
  await page
    .locator(".private-reading-pane")
    .getByRole("link", { name: "#101", exact: true })
    .click();
  await expect(page.locator("#pmlist_101")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  expect(ledger).toHaveLength(before);
  expect(await page.evaluate(() => window.history.length)).toBe(length);
});

for (const [name, body] of [
  [
    "empty",
    () =>
      history("9", "", "", "0").replace(
        '<div id="pm_ul" class="pml"></div>',
        '<div id="pm_ul" class="pml"></div><div class="emp">No private messages</div>',
      ),
  ],
  ["wrong-recipient", () => history("10")],
  ["foreign-author", () => history("9", message("101", "11"), "", "1")],
  [
    "public-response",
    () =>
      `${header}<div id="postlist"><h1 id="thread_subject">Public thread only</h1></div>`,
  ],
  [
    "foreign-pager",
    () =>
      history(
        "9",
        message("101"),
        `<div class="pg"><strong>1</strong><a class="nxt" href="${conversation("10", "2")}">Later</a></div>`,
        "4",
      ),
  ],
] as const)
  test(`J76.private-shape-${name}: distinguish genuine empty history from mismatched native content`, async ({
    page,
  }) => {
    const ledger = await open(page, body);
    await loadPeers(page);
    await page
      .getByRole("link", {
        name: "Read private conversation with Listener Nine",
        exact: true,
      })
      .click();
    if (name === "empty") {
      await expect(
        page.getByText("No private messages", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", {
          name: "Private conversation with Listener Nine",
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText(
          "The private conversation could not be confirmed. Continue in the native forum.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(page.locator(".private-reading-pane article")).toHaveCount(
        0,
      );
    }
    expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(1);
  });

test("J76.private-page-retry: failure retains loaded content, discloses possible read effects and retries only deliberately", async ({
  page,
}) => {
  let failed = true;
  const ledger = await open(page, (url) =>
    url.searchParams.get("page") === "1"
      ? failed
        ? null
        : history("9", message("101"), pager("1", undefined, "2"), "2")
      : history("9", message("102"), pager("2", "1"), "2"),
  );
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const reader = page.locator(".private-reading-pane");
  await expect(reader.locator("#pmlist_102")).toBeVisible();
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect(page.getByText(/request failed.*marked.*read/i)).toBeVisible();
  await expect(reader.locator("#pmlist_102")).toBeVisible();
  expect(ledger.filter((x) => x.url.includes("page=1"))).toHaveLength(1);
  failed = false;
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect(reader.locator("article")).toHaveCount(2);
  expect(ledger.filter((x) => x.url.includes("page=1"))).toHaveLength(2);
});

test("J76.private-account-change: changed-account history removes the old private range and peer list", async ({
  page,
}) => {
  await open(page, (url) =>
    url.searchParams.has("page")
      ? history("9", message("101"), pager("1", undefined, "2"), "2").replace(
          header,
          header.replace("uid=7", "uid=8"),
        )
      : history("9", message("102"), pager("2", "1"), "2"),
  );
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await expect(page.locator("#pmlist_102")).toBeVisible();
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect(page.locator(".private-reading-pane article")).toHaveCount(0);
  await expect(page.locator(".messages-pane [data-peer-id]")).toHaveCount(0);
});

test("J76.private-stale-peer: a delayed earlier page cannot expose a prior recipient after another peer is chosen", async ({
  page,
}) => {
  let deliver: (value: string) => void = () => {};
  const pending = new Promise<string>((resolve) => {
    deliver = resolve;
  });
  const ledger = await open(page, (url) =>
    url.searchParams.get("touid") === "10"
      ? history("10", message("201", "10"), "", "1")
      : url.searchParams.has("page")
        ? pending
        : history("9", message("102"), pager("2", "1"), "2"),
  );
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await expect(page.locator("#pmlist_102")).toBeVisible();
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click();
  await expect
    .poll(() => ledger.filter((x) => x.url.includes("page=1")).length)
    .toBe(1);
  await page
    .getByRole("link", {
      name: "Read private conversation with Reader Ten",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Reader Ten",
      exact: true,
    }),
  ).toBeVisible();
  deliver(history("9", message("101"), pager("1", undefined, "2"), "2"));
  await expect(page.locator("#pmlist_201")).toBeVisible();
  await expect(page.locator("#pmlist_101")).toHaveCount(0);
  await expect(page.locator("#pmlist_102")).toHaveCount(0);
});

test("J76.private-context-return: public to private to another peer and Back retain named reading, peer selection and nonzero list position without replay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const tallPeers = peers.replace(
    "Preview 9",
    "Complete authored peer preview. ".repeat(180),
  );
  const ledger = await open(
    page,
    (url) =>
      history(
        url.searchParams.get("touid")!,
        message(
          url.searchParams.get("touid") === "9" ? "101" : "201",
          url.searchParams.get("touid")!,
          "<p>Private retained content.</p>".repeat(100),
        ),
        "",
        "1",
      ),
    `${origin}/forum.php?mod=viewthread&tid=42`,
    tallPeers,
  );
  await expect(
    page.getByRole("heading", { name: "Public retained thread", exact: true }),
  ).toBeVisible();
  await loadPeers(page);
  await expect(
    page.getByRole("heading", { name: "Public retained thread", exact: true }),
  ).toBeVisible();
  const list = page.locator(".messages-pane");
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const offset = await list.evaluate((n) => n.scrollTop);
  expect(offset).toBeGreaterThan(0);
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  await page.locator(".private-reading-pane").evaluate((n) => {
    n.scrollTop = 370;
  });
  const readingPosition = async () => {
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    return page.locator(".private-reading-pane").evaluate((reader) => {
      const rect = reader.getBoundingClientRect(),
        outer = reader.closest(".conversation-region")!.getBoundingClientRect();
      const top = Math.max(0, rect.top, outer.top),
        bottom = Math.min(innerHeight, rect.bottom, outer.bottom);
      const paragraphs = [...reader.querySelectorAll("article p")];
      const first = paragraphs.find((p) => {
        const r = p.getBoundingClientRect();
        return bottom > top && r.bottom > top && r.top < bottom;
      });
      return {
        paragraph: first ? paragraphs.indexOf(first) : null,
        offset: first ? first.getBoundingClientRect().top - top : null,
        visibleHeight: Math.max(0, bottom - top),
        paneTop: rect.top,
        articleTop: reader.querySelector("article")!.getBoundingClientRect()
          .top,
      };
    });
  };
  const readingBefore = await readingPosition();
  await page
    .getByRole("link", {
      name: "Read private conversation with Reader Ten",
      exact: true,
    })
    .click();
  await expect(page.locator("#pmlist_201")).toBeVisible();
  const before = ledger.length;
  await page.goBack();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    list.locator('[data-peer-id="9"] a[aria-current="true"]'),
  ).toBeVisible();
  expect(await list.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  const readingAfter = await readingPosition();
  await test.info().attach("context-visible-position.json", {
    body: JSON.stringify({ before: readingBefore, after: readingAfter }),
    contentType: "application/json",
  });
  expect(readingBefore.paragraph).not.toBeNull();
  expect(readingAfter.visibleHeight).toBeGreaterThan(0);
  expect(readingAfter.paragraph).toBe(readingBefore.paragraph);
  expect(
    Math.abs(readingAfter.offset! - readingBefore.offset!),
  ).toBeLessThanOrEqual(1);
  if (Math.abs(readingAfter.paneTop - readingBefore.paneTop) <= 1)
    expect(
      Math.abs(readingAfter.articleTop - readingBefore.articleTop),
    ).toBeLessThanOrEqual(1);
  expect(ledger).toHaveLength(before);
  await page.goBack();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Public retained thread", exact: true }),
  ).toBeVisible();
  expect(ledger).toHaveLength(before);
});

test("J76.private-missing-target: a missing explicit native message target stays visibly unresolved", async ({
  page,
}) => {
  await open(page, () => history(), `${conversation()}#pmlist_999`);
  await page
    .getByRole("button", { name: "Load private conversation", exact: true })
    .click();
  await expect(
    page.getByText(
      "The requested private message is not in this returned page. Use the returned pages or continue in the native forum.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator(".private-reading-pane article")).toHaveCount(2);
  await expect(
    page.locator('.private-reading-pane [data-targeted="true"]'),
  ).toHaveCount(0);
});

test("J76.private-late-media: prepended rich content and delayed image keep the same private message anchor", async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await open(page, (url) =>
    url.searchParams.has("page")
      ? history(
          "9",
          message(
            "101",
            "9",
            `<blockquote>Returned quotation</blockquote><pre>line one\nline two</pre><img src="${origin}/private-late.png" alt="Late private cover">`,
          ),
          pager("1", undefined, "2"),
          "2",
        )
      : history(
          "9",
          message("102", "9", "<p>Retained private body.</p>".repeat(120)),
          pager("2", "1"),
          "2",
        ),
  );
  await page.route(`${origin}/private-late.png`, async (route) => {
    await held;
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="orange"/></svg>',
    });
  });
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const reader = page.locator(".private-reading-pane");
  await expect(page.locator("#pmlist_102")).toBeVisible();
  await reader.evaluate((n) => {
    n.scrollTop = 410;
  });
  const top = await page
    .locator("#pmlist_102")
    .evaluate((n) => n.getBoundingClientRect().top);
  await page
    .getByRole("button", { name: "Load earlier messages", exact: true })
    .click({ force: true });
  await expect(reader.locator("article")).toHaveCount(2);
  release();
  await expect
    .poll(() =>
      reader
        .locator("img")
        .evaluate((n) =>
          n instanceof HTMLImageElement ? n.naturalHeight : null,
        ),
    )
    .toBe(600);
  expect(
    Math.abs(
      (await page
        .locator("#pmlist_102")
        .evaluate((n) => n.getBoundingClientRect().top)) - top,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(reader.locator("blockquote")).toHaveText("Returned quotation");
  await expect(reader.locator("pre")).toHaveText("line one\nline two");
});

test("J76.private-locales: private recipient, read effects and manual controls remain localized", async ({
  page,
}) => {
  await open(page);
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  for (const [language, title, complete] of [
    ["zh-CN", "与 Listener Nine 的私人交谈", "已加载所有已知私信"],
    ["zh-TW", "與 Listener Nine 的私人交談", "已載入所有已知私訊"],
    [
      "en",
      "Private conversation with Listener Nine",
      "All known messages loaded",
    ],
  ]) {
    await page.getByRole("button", { name: /^(Settings|设置|設定)$/ }).click();
    await page.locator("#interface-language").selectOption(language!);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("region", { name: title!, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(complete!, { exact: true })).toBeVisible();
  }
});

test("J76.private-browse-list: board browsing retains the active private conversation without a second reading placeholder", async ({
  page,
}) => {
  await open(page);
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await expect(page.locator(".private-reading-pane")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Boards", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".reader-placeholder")).toHaveCount(0);
  await page.goBack();
  await expect(
    page.locator('.messages-pane [data-peer-id="9"] a[aria-current="true"]'),
  ).toBeVisible();
});

for (const width of [1280, 375])
  test(`J76.private-writing-guard-${width}: deliberate private selection keeps the original public source and destination behind an explicit retention decision`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const ledger = await open(
      page,
      () => history(),
      `${origin}/forum.php?mod=viewthread&tid=42`,
    );
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .first()
      .click();
    const source = page.getByRole("textbox", {
      name: "Complete source",
      exact: true,
    });
    await expect(source).toBeVisible();
    await source.fill("[b]Retained public source[/b]");
    const before = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    await revealNavigation(page);
    await loadPeers(page);
    await page
      .getByRole("link", {
        name: "Read private conversation with Listener Nine",
        exact: true,
      })
      .click();
    const guard = page.getByRole("dialog", {
      name: "Keep current writing?",
      exact: true,
    });
    await expect(guard).toBeVisible();
    expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(0);
    await guard
      .getByRole("button", {
        name: "Keep writing and read private conversation",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("region", {
        name: "Private conversation with Listener Nine",
        exact: true,
      }),
    ).toBeVisible();
    const after = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(after.id).toBe(before.id);
    expect(after.source).toBe(before.source);
    expect(after.target).toEqual(before.target);
    expect(after.action).toBe(before.action);
    expect(ledger.every((x) => x.method === "GET")).toBe(true);
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await page
      .getByRole("link", {
        name: "Read private conversation with Reader Ten",
        exact: true,
      })
      .click();
    await expect(guard).toBeVisible();
    await guard
      .getByRole("button", { name: "Continue editing", exact: true })
      .click();
    await expect(source).toHaveValue("[b]Retained public source[/b]");
    expect(ledger.filter((x) => x.url.includes("touid=10"))).toHaveLength(0);
    const readsBeforeReload = ledger.filter((x) =>
      x.url.includes("subop=view"),
    ).length;
    await page.reload();
    await page.addScriptTag({
      content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
    });
    await page
      .getByRole("button", { name: "Load private conversation", exact: true })
      .click();
    await expect(guard).toBeVisible();
    expect(ledger.filter((x) => x.url.includes("subop=view"))).toHaveLength(
      readsBeforeReload,
    );
    await guard
      .getByRole("button", { name: "Continue editing", exact: true })
      .click();
    await expect(source).toHaveValue("[b]Retained public source[/b]");
  });

test("J76.private-redirect-page: contradictory response URL and native current-page marker are refused", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: conversation("9", "3"),
      readRedirect: (url) =>
        url.searchParams.get("page") === "1"
          ? `${conversation("9", "3")}&tsdmapp=json`
          : null,
      document: () =>
        history("9", message("101"), pager("1", undefined, "2"), "3"),
    },
    async (page, reads) => {
      await page.goto(conversation("9", "1"));
      await page
        .getByRole("button", { name: "Load private conversation", exact: true })
        .click();
      try {
        await expect(
          page.getByText(
            "The private conversation could not be confirmed. Continue in the native forum.",
            { exact: true },
          ),
        ).toBeVisible();
        await expect(page.locator(".private-reading-pane article")).toHaveCount(
          0,
        );
        expect(reads.filter((url) => url.includes("page=3"))).toHaveLength(1);
      } finally {
        await info.attach("redirect-requests.json", {
          body: JSON.stringify(reads),
          contentType: "application/json",
        });
        await info.attach("redirect-workspace.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      }
    },
  );
});

test("J76.private-local-target-list: local exact targets preserve the currently browsed board destination and return context", async ({
  page,
}) => {
  const ledger = await open(page);
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  await expect(page.locator("#pmlist_102")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Boards", exact: true })
    .click();
  await expect(
    page.locator(".board-card").filter({ hasText: "Music discussion" }),
  ).toBeVisible();
  const native = page
    .getByRole("navigation", { name: "Thread actions", exact: true })
    .getByRole("link", { name: "Continue in native forum", exact: true });
  const destination = await native.getAttribute("href");
  const before = ledger.length;
  await page
    .locator(".private-reading-pane")
    .getByRole("link", { name: "#101", exact: true })
    .click();
  await expect(page.locator("#pmlist_101")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  await expect(native).toHaveAttribute("href", destination!);
  await expect(
    page.locator(".board-card").filter({ hasText: "Music discussion" }),
  ).toBeVisible();
  expect(ledger).toHaveLength(before);
  await page.goBack();
  await expect(
    page.locator('.messages-pane [data-peer-id="9"] a[aria-current="true"]'),
  ).toBeVisible();
  await expect(page.locator("#pmlist_101")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  expect(ledger).toHaveLength(before);
});

test("J76.private-drawer: selecting a peer closes the narrow list drawer and reopening preserves list context without another read", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const ledger = await open(
    page,
    (url) => history(url.searchParams.get("touid")!),
    `${origin}/forum.php`,
    peers.replace("Preview 9", "Authored long preview. ".repeat(100)),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "Boards pane", exact: true }).click();
  await loadPeers(page);
  const list = page.locator(".messages-pane");
  const selected = page.getByRole("link", {
    name: "Read private conversation with Listener Nine",
    exact: true,
  });
  await selected.scrollIntoViewIfNeeded();
  const offset = await list.evaluate((n) => n.scrollTop);
  expect(offset).toBeGreaterThan(0);
  await selected.click();
  await expect(page.locator(".pane-drawer")).not.toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Private conversation with Listener Nine",
      exact: true,
    }),
  ).toBeVisible();
  const before = ledger.length;
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(
    list.locator('[data-peer-id="9"] a[aria-current="true"]'),
  ).toBeVisible();
  expect(await list.evaluate((n) => n.scrollTop)).toBe(offset);
  expect(ledger).toHaveLength(before);
  await page
    .getByRole("link", {
      name: "Read private conversation with Reader Ten",
      exact: true,
    })
    .click();
  await expect(page.locator(".pane-drawer")).not.toBeVisible();
});

for (const composing of [false, true])
  test(`J76.private-delayed-writing-${composing ? "composition" : "source"}: delayed private targets preserve resumed writing focus and active input`, async ({
    page,
  }, info) => {
    let release: (value: string) => void = () => {};
    const held = new Promise<string>((resolve) => {
      release = resolve;
    });
    const ledger = await open(
      page,
      () => held,
      `${origin}/forum.php?mod=viewthread&tid=42`,
    );
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = page.getByRole("textbox", {
      name: "Complete source",
      exact: true,
    });
    await source.fill("Retained public source ");
    await loadPeers(page);
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
    await expect
      .poll(() => ledger.filter((x) => x.url.includes("subop=view")).length)
      .toBe(1);
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await source.focus();
    await source.evaluate((node) => {
      const events: unknown[] = [];
      Reflect.set(window, "privateDelayedWritingEvents", events);
      for (const type of [
        "compositionstart",
        "compositionupdate",
        "compositionend",
        "input",
        "blur",
        "pointerdown",
        "keydown",
      ])
        node.addEventListener(type, (event) =>
          events.push({
            type,
            trusted: event.isTrusted,
            composing: event instanceof InputEvent ? event.isComposing : null,
          }),
        );
    });
    const browser = await page.context().newCDPSession(page);
    if (composing) {
      await browser.send("Input.imeSetComposition", {
        text: "nei ho",
        selectionStart: 6,
        selectionEnd: 6,
      });
      await expect(source).toHaveValue("Retained public source nei ho");
    }
    await expect(source).toBeFocused();
    release(history());
    try {
      await expect(page.locator("#pmlist_102")).toHaveAttribute(
        "data-targeted",
        "true",
      );
      await expect(source).toBeFocused();
      if (composing) {
        const events: { type: string; trusted: boolean }[] =
          await page.evaluate(() =>
            Reflect.get(window, "privateDelayedWritingEvents"),
          );
        expect(
          events.some(
            (event) => event.type === "compositionstart" && event.trusted,
          ),
        ).toBe(true);
        expect(
          events.some(
            (event) => event.type === "compositionend" || event.type === "blur",
          ),
        ).toBe(false);
        await browser.send("Input.insertText", { text: "你好" });
        await expect(source).toHaveValue("Retained public source 你好");
      } else await expect(source).toHaveValue("Retained public source ");
      expect(ledger.every((request) => request.method === "GET")).toBe(true);
    } finally {
      await info.attach("private-delayed-writing-events.json", {
        body: JSON.stringify(
          await page.evaluate(() =>
            Reflect.get(window, "privateDelayedWritingEvents"),
          ),
        ),
        contentType: "application/json",
      });
    }
  });

test("J78.private-scroll-owner: qualified private approach uses the private reader without public loads", async ({
  page,
}) => {
  const ledger = await open(page, (url) =>
    url.searchParams.has("page")
      ? history("9", message("101"), pager("1", undefined, "2"), "2")
      : history(
          "9",
          message("102", "9", "<p>Complete private reading.</p>".repeat(120)),
          pager("2", "1"),
          "2",
        ),
  );
  await loadPeers(page);
  await page
    .getByRole("link", {
      name: "Read private conversation with Listener Nine",
      exact: true,
    })
    .click();
  const reader = page.locator(".private-reading-pane");
  await expect(reader.locator("#pmlist_102")).toBeVisible();
  await reader.evaluate(async (node) => {
    // Start deliberate scrolling after the initial position restoration settles.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    node.scrollTop = 400;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    node.scrollTop = 0;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect
    .poll(
      () =>
        ledger.filter((request) => request.url.includes("subop=view")).length,
    )
    .toBe(2);
  await expect(reader.locator("article")).toHaveCount(2);
  expect(
    ledger.filter((request) => request.url.includes("subop=view")),
  ).toHaveLength(2);
});
