import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const account = (id = "7") =>
  `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Reader ${id}</a></strong></div>`;
const directory = `${account()}<div class="bm"><div class="bm_h">Listening</div><div id="category_1"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Music discussion</a></h2></td></tr></table></div></div>`;
const saved = (kind = "thread", page = "1") =>
  `${origin}/home.php?mod=space&do=favorite&type=${kind}&page=${page}`;
function list(url: URL) {
  const kind = url.searchParams.get("type") ?? "thread",
    page = url.searchParams.get("page") ?? "1";
  const id = kind === "forum" ? "5" : page === "1" ? "42" : "43";
  const record = kind === "forum" ? "805" : page === "1" ? "942" : "943";
  const target =
    kind === "forum"
      ? `forum.php?mod=forumdisplay&fid=${id}`
      : `forum.php?mod=viewthread&tid=${id}`;
  return `${account()}<div id="ct"><form id="delform"><ul id="favorite_ul"><li id="fav_${record}"><a href="home.php?mod=spacecp&ac=favorite&op=delete&favid=${record}">删除</a><input type="checkbox" name="favorite[]" value="${record}" vid="${id}"><a href="${target}">Saved ${kind} ${id}</a><span class="xg1">2026-10-22 12:00</span></li></ul></form><div class="pg"><strong>${page}</strong><a href="${saved(kind, page === "1" ? "2" : "1")}">${page === "1" ? "2" : "1"}</a></div></div>`;
}
async function open(page: Page) {
  const ledger: string[] = [],
    built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (request.url() === `${origin}/__workspace-fixture.js`)
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><body>Native<script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    const url = new URL(request.url());
    ledger.push(request.url());
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        uid: 7,
        document:
          url.searchParams.get("do") === "favorite"
            ? list(url)
            : url.searchParams.get("mod") === "viewthread"
              ? `${account()}<div id="messagetext">抱歉，指定的主题不存在或已被删除</div>`
              : directory,
      }),
    });
  });
  await page.goto(`${origin}/forum.php`);
  return ledger;
}
async function artifact(page: Page, info: TestInfo, ledger: unknown) {
  await info.attach("favorite-outcome.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("favorite-server-ledger.json", {
    body: JSON.stringify(ledger),
    contentType: "application/json",
  });
}
test("J9.saved-navigation: separate kinds preserve record identity, returned pages and missing-target return", async ({
  page,
}, info) => {
  const ledger = await open(page);
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Saved thread 42", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-favorite-id="942"]')).toBeVisible();
  await page
    .getByRole("navigation", { name: "Saved pages" })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Saved thread 43", exact: true })
    .click();
  await expect(
    page.getByText(/missing|deleted|不存在|已被删除/i).first(),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("link", { name: "Saved thread 43", exact: true }),
  ).toBeVisible();
  expect(ledger.filter((url) => url.includes("do=favorite"))).toHaveLength(2);
  await page
    .getByRole("button", { name: "Load saved boards", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Saved forum 5", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-favorite-id="805"]')).toBeVisible();
  await artifact(page, info, ledger);
});
async function mutationFixture(page: Page, kind: "thread" | "forum") {
  const state = {
    member: "7",
    present: false,
    writes: [] as string[],
    lost: false,
    pageFailure: false,
    paged: false,
    failSecond: false,
    missingTarget: false,
    unknownAccount: false,
    malformedPager: false,
    gate: null as Promise<void> | null,
    requests: [] as string[],
  };
  const targetId = kind === "thread" ? "42" : "5",
    recordId = kind === "thread" ? "942" : "805";
  const targetURL = `${origin}/forum.php?mod=${kind === "thread" ? "viewthread&tid=42" : "forumdisplay&fid=5"}`;
  const href = `home.php?mod=spacecp&ac=favorite&type=${kind}&id=${targetId}&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN`;
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname === "/__workspace-fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (req.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    state.requests.push(url.pathname + url.search);
    if (url.searchParams.get("ac") === "favorite") {
      if (url.searchParams.get("op") === "delete" && req.method() === "GET")
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: `<root><![CDATA[<form id="favoriteform_${recordId}" method="post" action="home.php?mod=spacecp&ac=favorite&op=delete&favid=${recordId}&type=all"><input type="hidden" name="referer" value="${origin}/"><input type="hidden" name="deletesubmit" value="true"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="handlekey" value="a_delete_${recordId}"><button type="submit" name="deletesubmitbtn" value="true">Confirm</button></form>]]></root>`,
        });
      state.writes.push(
        `${req.method()} ${url.searchParams.get("op") === "delete" ? `remove-record-${url.searchParams.get("favid")}` : `add-${url.searchParams.get("type")}-${url.searchParams.get("id")}`}`,
      );
      state.present = url.searchParams.get("op") !== "delete";
      if (state.gate) await state.gate;
      if (state.lost) return route.abort();
      return route.fulfill({
        contentType: "text/xml; charset=utf-8",
        body: "<root><![CDATA[<script>untrustedCallback()</script>]]></root>",
      });
    }
    let body = directory;
    if (url.searchParams.get("do") === "favorite") {
      if (
        state.pageFailure ||
        (state.failSecond && url.searchParams.get("page") === "2")
      )
        return route.abort();
      body = state.present
        ? list(new URL(saved(kind)))
            .replace(account(), account(state.member))
            .replace(/<div class="pg">[\s\S]*?<\/div>/, "")
        : `${account(state.member)}<div id="ct"><p class="emp">您还没有添加任何收藏</p></div>`;
      if (state.paged) {
        const second = url.searchParams.get("page") === "2";
        body = !second
          ? list(new URL(saved(kind)))
              .replaceAll("942", "941")
              .replaceAll("42", "41")
          : state.present
            ? list(new URL(saved(kind, "2")))
                .replaceAll("943", "942")
                .replaceAll("43", "42")
            : `${account(state.member)}<div id="ct"><p class="emp">您还没有添加任何收藏</p></div>`;
        if (!state.present)
          body = body.replace(/<div class="pg">[\s\S]*?<\/div>/, "");
      }
      if (state.malformedPager)
        body = body.replaceAll('class="pg"', 'class="unknown-pager"');
      if (state.unknownAccount) body = body.replace(account(state.member), "");
      if (state.missingTarget)
        body = body.replace(
          /<a href="forum.php\?mod=viewthread&tid=42">Saved thread 42<\/a>/,
          "<span>已删除的主题</span>",
        );
    } else if (url.searchParams.get("mod") === "viewthread")
      body = `${account(state.member)}<div id="postlist"><h1 id="thread_subject">Autumn listening</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Composer</a></div><a id="postnum101" href="${targetURL}#pid101">1</a><div class="pcb"><p>Opening remains unchanged.</p></div><div id="p_btn"><a id="k_favorite" href="${href}">收藏</a></div></div></div>`;
    else if (url.searchParams.get("mod") === "forumdisplay")
      body = `${account(state.member)}<div id="ct"><h1><a href="${targetURL}">Music discussion</a></h1><a id="a_favorite" href="${href}&handlekey=favoriteforum">收藏</a></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Autumn listening</a></th></tr></tbody></table>`;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...(state.unknownAccount ? {} : { uid: Number(state.member) }),
        document: body,
      }),
    });
  });
  await page.goto(targetURL);
  return state;
}
for (const kind of ["thread", "forum"] as const)
  test(`J9.favorite-attempt-${kind}: explicit add and remove independently verify distinct record and target`, async ({
    page,
  }, info) => {
    const server = await mutationFixture(page, kind);
    await page
      .getByRole("button", {
        name: kind === "thread" ? "Save thread" : "Save board",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Confirm favorite action",
        exact: true,
      }),
    ).toBeVisible();
    expect(server.writes).toEqual([]);
    await page
      .getByRole("button", { name: "Confirm favorite action", exact: true })
      .dblclick();
    await expect(
      page.getByText("Confirmed favorite present.", { exact: true }),
    ).toBeVisible();
    expect(server.writes).toEqual([
      `GET add-${kind}-${kind === "thread" ? "42" : "5"}`,
    ]);
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name: "Saved", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: kind === "thread" ? "Load saved threads" : "Load saved boards",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Remove favorite", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm favorite action", exact: true })
      .click();
    await expect(
      page.getByText("Confirmed favorite absent.", { exact: true }),
    ).toBeVisible();
    expect(server.present).toBe(false);
    expect(server.writes).toEqual([
      `GET add-${kind}-${kind === "thread" ? "42" : "5"}`,
      `POST remove-record-${kind === "thread" ? "942" : "805"}`,
    ]);
    await artifact(page, info, server);
  });
test("J9.favorite-uncertain: lost response permits check without replay and retains earlier attempt", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.lost = true;
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByText(/response was lost.*may have changed/i),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await page
    .getByRole("button", { name: "Check favorite result", exact: true })
    .click();
  await expect(
    page.getByText("Confirmed favorite present.", { exact: true }),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await artifact(page, info, server);
});
test("J9.favorite-recovery: reload retains unknown attempt without tokens or automatic effects", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.lost = true;
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check favorite result", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check favorite result", exact: true }),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  const recovery = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(recovery).not.toContain("SYNTHETIC_PUBLIC_FORM_TOKEN");
  await page
    .getByRole("button", { name: "Check favorite result", exact: true })
    .click();
  await expect(
    page.getByText("Confirmed favorite present.", { exact: true }),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await artifact(page, info, server);
});
test("J9.favorite-resend: inconclusive check requires a warned new attempt and preserves original uncertainty", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.lost = true;
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check favorite result", exact: true }),
  ).toBeVisible();
  server.present = false;
  server.pageFailure = true;
  await page
    .getByRole("button", { name: "Check favorite result", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Review new favorite attempt",
      exact: true,
    }),
  ).toBeVisible();
  server.pageFailure = false;
  server.lost = false;
  await page
    .getByRole("button", { name: "Review new favorite attempt", exact: true })
    .click();
  await expect(page.getByText(/may repeat favorite effects/i)).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByText("Confirmed favorite present.", { exact: true }),
  ).toBeVisible();
  expect(server.writes).toHaveLength(2);
  await expect(page.locator("[data-favorite-attempt]")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Check favorite result", exact: true }),
  ).toBeVisible();
  await artifact(page, info, server);
});
test("J9.favorite-account-race: changed account before send refuses action and retains original binding", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm favorite action", exact: true }),
  ).toBeVisible();
  server.member = "8";
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(page.getByText(/preflight failed before send/i)).toBeVisible();
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
test("J9.favorite-already: observed existing membership is named without a new write", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await expect(page.getByText("Already saved.", { exact: true })).toBeVisible();
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
test("J9.saved-board-target: a saved board opens its populated workspace and returns to the selected favorite", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "forum");
  server.present = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved boards", exact: true })
    .click();
  await page.getByRole("link", { name: "Saved forum 5", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Autumn listening", exact: true }),
  ).toBeInViewport();
  await artifact(page, info, server);
  await page.goBack();
  await expect(page.locator('[data-favorite-id="805"]')).toBeFocused();
  await artifact(page, info, server);
});
test("J9.favorite-last-page: removing the last record uses observed remaining pages and keeps unrelated favorite", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  server.paged = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Saved pages" })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove favorite", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByText("Confirmed favorite absent.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Saved thread 41", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  expect(server.writes).toEqual(["POST remove-record-942"]);
  await artifact(page, info, server);
});
test("J9.favorite-page-failure: readback missing a returned page stays uncertain without erasing current list", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  server.paged = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  server.failSecond = true;
  await page
    .getByRole("navigation", { name: "Saved pages" })
    .getByRole("link", { name: "2", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Saved thread 41", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove favorite", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm favorite action", exact: true }),
  ).toHaveCount(0);
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
test("J9.favorite-unavailable-record: missing target remains visibly distinct and removable", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  server.missingTarget = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await expect(
    page.getByText("Unavailable thread 42", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("已删除的主题", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove favorite", exact: true })
    .click();
  server.present = false;
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByText("Already absent.", { exact: true }),
  ).toBeVisible();
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
test("J9.favorite-inflight-account: account change during a held write preserves uncertainty and never rolls back", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  let release!: () => void;
  server.gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect.poll(() => server.writes.length).toBe(1);
  server.member = "8";
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByText("Signed in as Reader 8", { exact: true }),
  ).toBeVisible();
  release();
  await expect(page.getByText(/account changed.*in flight/i)).toBeVisible();
  await expect(page.locator("[data-favorite-attempt]")).toContainText(
    "Account 7",
  );
  expect(server.present).toBe(true);
  expect(server.writes).toHaveLength(1);
  await page
    .getByRole("button", { name: "Check favorite result", exact: true })
    .click();
  await expect(page.getByText(/Favorite result is uncertain/i)).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await artifact(page, info, server);
});
test("J9.favorite-pending-reload: persisted pending action becomes uncertain without replay", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  let release!: () => void;
  server.gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect.poll(() => server.writes.length).toBe(1);
  await page.reload();
  release();
  await expect(
    page.getByText(/recovered a pending favorite action/i),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await page
    .getByRole("button", { name: "Check favorite result", exact: true })
    .click();
  await expect(
    page.getByText("Confirmed favorite present.", { exact: true }),
  ).toBeVisible();
  expect(server.writes).toHaveLength(1);
  await artifact(page, info, server);
});
test("J9.favorite-language: Simplified Chinese review and confirmation follow the current language", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "收藏主题", exact: true }).click();
  await expect(page.getByText(/确认.*主题 42.*账号 7/)).toBeVisible();
  await page.getByRole("button", { name: "确认收藏操作", exact: true }).click();
  await expect(
    page.getByText("已确认收藏存在。", { exact: true }),
  ).toBeVisible();
  await artifact(page, info, server);
});
test("J9.favorite-unknown-account: inconclusive identity clears restored private saved records", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Saved thread 42", exact: true }),
  ).toBeVisible();
  server.unknownAccount = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Saved thread 42", exact: true }),
  ).toHaveCount(0);
  await artifact(page, info, server);
});
test("J9.favorite-unrecognized-pager: an unsupported returned pager is not treated as a complete category", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  server.paged = true;
  server.malformedPager = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await expect(
    page.getByText(
      /returned favorite pages could not be preserved completely/i,
    ),
  ).toBeVisible();
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
for (const width of [1100, 390])
  test(`J9.favorite-responsive-${width}: saved kinds remain operable without the sidebar`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 850 });
    const server = await mutationFixture(page, "thread");
    server.present = true;
    if (width === 390)
      await page
        .getByRole("combobox", { name: "Main destinations", exact: true })
        .selectOption("saved");
    else
      await page
        .getByRole("navigation", { name: "Main destinations", exact: true })
        .getByRole("button", { name: "Saved", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Load saved threads", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Saved thread 42", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Remove favorite", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm favorite action", exact: true })
      .click();
    await expect(
      page.getByText("Confirmed favorite absent.", { exact: true }),
    ).toBeVisible();
    await artifact(page, info, server);
  });
test("J9.saved-thread-target: selected saved thread keeps its reading pane in the viewport", async ({
  page,
}, info) => {
  const server = await mutationFixture(page, "thread");
  server.present = true;
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name: "Saved", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load saved threads", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Saved thread 42", exact: true })
    .click();
  await expect(
    page.getByText("Opening remains unchanged.", { exact: true }),
  ).toBeInViewport();
  await artifact(page, info, server);
});
test("J9.favorite-recovery-quota: unacknowledged pending recovery blocks a new favorite effect", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "tsdm.workspace.recovery")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const server = await mutationFixture(page, "thread");
  await page.getByRole("button", { name: "Save thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm favorite action", exact: true })
    .click();
  await expect(
    page.getByText(
      /pending favorite attempt could not be saved.*nothing was sent/i,
    ),
  ).toBeVisible();
  expect(server.writes).toEqual([]);
  await artifact(page, info, server);
});
