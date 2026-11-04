import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const account = (id = "7") =>
  `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Reader ${id}</a></strong></div>`;
const thread = (id: string, member: string) =>
  `${account(member)}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><div id="postlist"><h1><span id="thread_subject">Conversation ${id}</span></h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Reader 8</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">${Array.from({ length: 35 }, (_, i) => `<p>Reading paragraph ${i}: complete original conversation.</p>`).join("")}</div></div></div>`;
const form = (member: string) =>
  `${account(member)}<form class="searchform" method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="searchsubmit" value="yes"><label>Keywords<input name="srchtxt" type="text"></label><label>Author<input name="srchuname" type="text"></label><button type="submit">Search</button></form>`;
const resultURL = `${origin}/search.php?mod=forum&searchid=581&searchsubmit=yes&kw=autumn`;
const results = (member: string) =>
  `${account(member)}<div id="threadlist" class="slst"><ul>${Array.from({ length: 25 }, (_, i) => `<li class="pbw"><h3 class="xs3"><a href="forum.php?mod=viewthread&tid=${42 + i}&highlight=autumn">Search conversation ${42 + i}</a></h3><p>2026-11-04 - <a href="home.php?mod=space&uid=7">Reader 7</a> - <a href="forum.php?mod=forumdisplay&fid=5">Music</a></p><p>Complete search detail.</p></li>`).join("")}</ul></div><div class="pg"><strong>1</strong><a href="${resultURL}&page=2">2</a></div>`;
const favorites = (member: string) =>
  `${account(member)}<div id="ct"><form id="delform"><ul id="favorite_ul">${Array.from({ length: 25 }, (_, i) => `<li id="fav_${942 + i}"><a href="home.php?mod=spacecp&ac=favorite&op=delete&favid=${942 + i}">删除</a><input type="checkbox" name="favorite[]" value="${942 + i}" vid="${42 + i}"><a href="forum.php?mod=viewthread&tid=${42 + i}">Saved conversation ${42 + i}</a><span class="xg1">2026-11-04 12:00</span></li>`).join("")}</ul></form></div>`;
const notices = (member: string) =>
  `${account(member)}<div id="ct"><div class="mn"><div class="nts">${Array.from({ length: 25 }, (_, i) => `<dl notice="${942 + i}"><dt><span title="2026-11-04 12:00">today</span></dt><dd class="ntc_body"><p>Complete notification ${i}.</p><a href="forum.php?mod=viewthread&tid=${42 + i}">Notice conversation ${42 + i}</a></dd></dl>`).join("")}</div></div><div class="appl"><div class="tbn"><ul><li class="a"><a href="home.php?mod=space&do=notice">Replies</a></li></ul></div></div></div>`;
const draftURL = `${origin}/home.php?mod=space&do=thread&view=me&type=thread&filter=save`;
const draftList = (member: string, page: string) =>
  `${account(member)}<a class="a" href="${draftURL}">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${Array.from({ length: 25 }, (_, i) => `<tr><th><a href="forum.php?mod=viewthread&tid=${100 + Number(page) * 100 + i}">Draft ${page}-${i}</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>`).join("")}</tbody></table></form></div><div class="pg"><strong>${page}</strong><a href="${draftURL}&page=${page === "1" ? "2" : "1"}">${page === "1" ? "2" : "1"}</a></div>`;
const writingForm = (member: string) =>
  `${account(member)}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=9&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value=""><textarea name="message"></textarea><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;

async function fixture(
  page: Page,
  destination = `${origin}/forum.php?mod=viewthread&tid=9`,
) {
  page.on("pageerror", (error) => console.log("Browser error:", error.message));
  const state = {
    member: "7",
    requests: [] as { url: string; method: string; body: string | null }[],
    searches: 0,
    noticeEffects: 0,
  };
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    state.requests.push({
      url: url.href,
      method: request.method(),
      body: request.postData(),
    });
    let body = thread(url.searchParams.get("tid") ?? "9", state.member);
    if (url.pathname === "/search.php") {
      if (request.method() === "POST") {
        state.searches++;
        body = results(state.member);
      } else
        body = url.searchParams.has("searchid")
          ? results(state.member)
          : form(state.member);
    }
    if (url.searchParams.get("do") === "favorite")
      body = favorites(state.member);
    if (url.searchParams.get("do") === "notice") {
      state.noticeEffects++;
      body = notices(state.member);
    }
    if (url.searchParams.get("filter") === "save")
      body = draftList(state.member, url.searchParams.get("page") ?? "1");
    if (url.searchParams.get("mod") === "post")
      body = writingForm(state.member);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(destination);
  if (destination.includes("mod=viewthread"))
    await expect(
      page.getByRole("heading", { name: "Conversation 9", exact: true }),
    ).toBeVisible();
  return state;
}

test("J67.drafts: explicit forum draft pages retain reading and recover their own nonzero offsets without list reload", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    const before = state.requests.length;
    await select(page, "Drafts");
    await expect(
      page.getByRole("heading", { name: "Conversation 9", exact: true }),
    ).toBeVisible();
    expect(state.requests).toHaveLength(before);
    await page
      .getByRole("button", { name: "Load forum drafts", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Draft page 2", exact: true })
      .scrollIntoViewIfNeeded();
    const offset = await page
      .locator("#thread-list-pane")
      .evaluate((node) => node.scrollTop);
    expect(offset).toBeGreaterThan(100);
    const anchorTop = await page
      .locator('[data-draft-id="224"]')
      .evaluate((node) => node.getBoundingClientRect().top);
    await page
      .getByRole("button", { name: "Draft page 2", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Resume Draft 2-0", exact: true }),
    ).toBeVisible();
    const count = state.requests.length;
    await page.goBack();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toBeAttached();
    await expect
      .poll(() =>
        page.locator("#thread-list-pane").evaluate((node) => node.scrollTop),
      )
      .toBeGreaterThan(100);
    await expect
      .poll(() =>
        page
          .locator('[data-draft-id="224"]')
          .evaluate((node) => node.getBoundingClientRect().top),
      )
      .toBeCloseTo(anchorTop, 0);
    await page.goForward();
    await expect(
      page.getByRole("button", { name: "Resume Draft 2-0", exact: true }),
    ).toBeVisible();
    expect(state.requests).toHaveLength(count);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Resume Draft 2-0", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Restored snapshot — account and content have not been rechecked.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Snapshot from Reader 7", { exact: true }),
    ).toBeVisible();
    expect(state.requests).toHaveLength(count);
  } finally {
    await artifact(page, info, state);
  }
});

test("J67.direct-entry: saved list offers an honest reading placeholder without inventing a conversation", async ({
  page,
}, info) => {
  const state = await fixture(
    page,
    `${origin}/home.php?mod=space&do=favorite&type=thread`,
  );
  try {
    await expect(
      page.getByRole("link", { name: "Saved conversation 42", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".reader-placeholder")).toBeVisible();
    await expect(page.locator(".reading-pane")).toHaveCount(0);
    expect(
      state.requests.filter(
        (r) => new URL(r.url).searchParams.get("mod") === "viewthread",
      ),
    ).toHaveLength(0);
  } finally {
    await artifact(page, info, state);
  }
});

test("J67.review-entry: retained public writing opens immutable review from a different list without sending or changing destination", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Review retained source 中文");
    await select(page, "Saved");
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toBeVisible();
    await expect(review).toContainText("9");
    expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await artifact(page, info, state);
  }
});

test("J67.draft-selection: browsing retains the sole source editor and draft resume keeps its replacement guard and selection", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Retained 中文 source");
    for (const section of ["Search", "Saved", "Notices", "Drafts"]) {
      await select(page, section);
      await expect(source).toBeVisible();
      await expect(source).toHaveValue("Retained 中文 source");
      await expect(
        page.getByRole("heading", { name: "Conversation 9", exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Load forum drafts", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Resume Draft 1-20", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Discard local changes and resume draft",
        exact: true,
      }),
    ).toBeVisible();
    await expect(source).toHaveValue("Retained 中文 source");
    await expect(page.locator('[data-draft-id="220"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  } finally {
    await artifact(page, info, state);
  }
});

test("J67.draft-account: a fresh changed account invalidates private draft history and retained reading without a passive reload", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    await select(page, "Drafts");
    await page
      .getByRole("button", { name: "Load forum drafts", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toBeVisible();
    state.member = "8";
    await select(page, "Saved");
    await page
      .getByRole("button", { name: "Load saved threads", exact: true })
      .click();
    await expect(
      page.getByText("Signed in as Reader 8", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Conversation 9", exact: true }),
    ).toHaveCount(0);
    const count = state.requests.length;
    await page.goBack();
    await page.goBack();
    await expect(
      page.getByRole("button", { name: "Load forum drafts", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toHaveCount(0);
    expect(state.requests).toHaveLength(count);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Load forum drafts", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toHaveCount(0);
    expect(state.requests).toHaveLength(count);
  } finally {
    await artifact(page, info, state);
  }
});

test("J67.draft-drawer: per-page history and retained source survive the 768px list docking boundary without reads", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Retained drawer source 中文");
    await select(page, "Drafts");
    await page
      .getByRole("button", { name: "Load forum drafts", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Draft page 2", exact: true })
      .scrollIntoViewIfNeeded();
    const offset = await page
      .locator("#thread-list-pane")
      .evaluate((node) => node.scrollTop);
    expect(offset).toBeGreaterThan(100);
    const before = state.requests.length;
    await page.setViewportSize({ width: 767, height: 900 });
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
    await expect(page.locator(".pane-drawer")).toBeVisible();
    await expect
      .poll(() =>
        page.locator("#thread-list-pane").evaluate((node) => node.scrollTop),
      )
      .toBeGreaterThan(100);
    expect(state.requests).toHaveLength(before);
    await page
      .getByRole("button", { name: "Draft page 2", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Resume Draft 2-0", exact: true }),
    ).toBeVisible();
    const after = state.requests.length;
    await page.goBack();
    await expect(
      page.getByRole("button", { name: "Resume Draft 1-0", exact: true }),
    ).toBeAttached();
    await expect
      .poll(() =>
        page.locator("#thread-list-pane").evaluate((node) => node.scrollTop),
      )
      .toBeGreaterThan(100);
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator(".pane-drawer")).not.toBeVisible();
    await expect(page.locator("#thread-list-pane")).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Retained drawer source 中文");
    await expect(
      page.getByRole("heading", { name: "Conversation 9", exact: true }),
    ).toBeVisible();
    expect(state.requests).toHaveLength(after);
  } finally {
    await artifact(page, info, state);
  }
});
async function select(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Main destinations", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
}
async function artifact(page: Page, info: TestInfo, state: unknown) {
  await info.attach("list-context.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("list-context-state.json", {
    body: JSON.stringify({
      state,
      geometry: await page
        .locator(".reading-pane, #thread-list-pane")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            class: node.className,
            scrollTop: node.scrollTop,
            rect: node.getBoundingClientRect().toJSON(),
          })),
        ),
    }),
    contentType: "application/json",
  });
}
test("J67.search: explicit search beside retained reading preserves criteria, result identity and nonzero return position without replay", async ({
  page,
}, info) => {
  const state = await fixture(page);
  try {
    await page.locator(".reading-pane").evaluate((node) => {
      node.scrollTop = 320;
    });
    await select(page, "Search");
    await expect(page.getByLabel("Keywords", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Conversation 9", exact: true }),
    ).toBeVisible();
    expect(
      await page.locator(".reading-pane").evaluate((node) => node.scrollTop),
    ).toBeGreaterThan(200);
    await page.getByLabel("Keywords", { exact: true }).fill("autumn");
    expect(state.searches).toBe(0);
    await page
      .locator(".search-pane")
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Search conversation 42", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Keywords", { exact: true }).fill("unsent edit");
    await page
      .getByRole("link", { name: "Search conversation 62", exact: true })
      .scrollIntoViewIfNeeded();
    const offset = await page
      .locator("#thread-list-pane")
      .evaluate((node) => node.scrollTop);
    expect(offset).toBeGreaterThan(100);
    const anchorTop = await page
      .getByRole("link", { name: "Search conversation 62", exact: true })
      .evaluate((node) => node.getBoundingClientRect().top);
    await page
      .getByRole("link", { name: "Search conversation 62", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Conversation 62", exact: true }),
    ).toBeVisible();
    const requests = state.requests.length;
    await page.goBack();
    await expect(page.getByLabel("Keywords", { exact: true })).toHaveValue(
      "unsent edit",
    );
    await expect
      .poll(() =>
        page.locator("#thread-list-pane").evaluate((node) => node.scrollTop),
      )
      .toBeGreaterThan(100);
    await expect
      .poll(() =>
        page
          .getByRole("link", { name: "Search conversation 62", exact: true })
          .evaluate((node) => node.getBoundingClientRect().top),
      )
      .toBeCloseTo(anchorTop, 0);
    await expect(
      page.getByRole("link", { name: "Search conversation 62", exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await page.goForward();
    await expect(
      page.getByRole("heading", { name: "Conversation 62", exact: true }),
    ).toBeVisible();
    expect(state.searches).toBe(1);
    expect(state.requests).toHaveLength(requests);
  } finally {
    await artifact(page, info, state);
  }
});

for (const destination of ["Saved", "Notices"]) {
  test(`J67.${destination.toLowerCase()}: explicit list effects, selected row and nonzero position survive retained-reading history`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    try {
      const before = state.requests.length;
      await select(page, destination);
      await expect(
        page.getByRole("heading", { name: "Conversation 9", exact: true }),
      ).toBeVisible();
      expect(state.requests).toHaveLength(before);
      await page
        .getByRole("button", {
          name: destination === "Saved" ? "Load saved threads" : "Load notices",
          exact: true,
        })
        .click();
      const target = page.getByRole("link", {
        name: `${destination === "Saved" ? "Saved" : "Notice"} conversation 62`,
        exact: true,
      });
      await target.scrollIntoViewIfNeeded();
      const offset = await page
        .locator("#thread-list-pane")
        .evaluate((node) => node.scrollTop);
      expect(offset).toBeGreaterThan(100);
      const anchorTop = await target.evaluate(
        (node) => node.getBoundingClientRect().top,
      );
      await expect(
        page.getByRole("heading", { name: "Conversation 9", exact: true }),
      ).toBeVisible();
      await target.click();
      await expect(
        page.getByRole("heading", { name: "Conversation 62", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator(`#${destination === "Saved" ? "favorite" : "notice"}-962`),
      ).toHaveAttribute("aria-current", "true");
      const count = state.requests.length;
      await page.goBack();
      await expect
        .poll(() =>
          page.locator("#thread-list-pane").evaluate((node) => node.scrollTop),
        )
        .toBeGreaterThan(100);
      await expect
        .poll(() => target.evaluate((node) => node.getBoundingClientRect().top))
        .toBeCloseTo(anchorTop, 0);
      await expect(
        page.locator(`#${destination === "Saved" ? "favorite" : "notice"}-962`),
      ).toHaveAttribute("aria-current", "true");
      await page.goForward();
      await expect(
        page.getByRole("heading", { name: "Conversation 62", exact: true }),
      ).toBeVisible();
      expect(state.requests).toHaveLength(count);
      expect(state.noticeEffects).toBe(destination === "Notices" ? 1 : 0);
    } finally {
      await artifact(page, info, state);
    }
  });
}
