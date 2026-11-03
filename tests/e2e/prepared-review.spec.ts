import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { revealNavigation } from "./navigation-ui";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const body =
  "[b]Prepared 完整正文[/b]\n[quote]Quoted words[/quote]\n[unknown=v3]Keep <script>literal</script>[/unknown]\n[img]https://remote.example/picture.png[/img] [attach]77[/attach]\n[table][tr][td]Cell one[/td][td]Cell two[/td][/tr][/table]";
const title = "Prepared listening notes 完整标题";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
type Entry =
  "new-thread" | "reply" | "addressed" | "edit-opening" | "edit-reply";
const fixtures = new WeakMap<Page, ReturnType<typeof state>>();
function state() {
  return {
    member: "7",
    entry: "new-thread" as Entry,
    stored: new URLSearchParams({
      subject: "Original title",
      message: "Original source",
      typeid: "3",
      usesig: "1",
      price: "2",
      readperm: "10",
      "attachnew[77][description]": "Fixture attachment",
    }),
    posts: [] as { url: string; fields: [string, string][] }[],
    requests: [] as {
      url: string;
      method: string;
      fresh: string | undefined;
    }[],
    postGate: null as Promise<void> | null,
    outcome: "accepted",
  };
}
async function fixture(
  page: Page,
  entry: Entry = "new-thread",
  detailedAttachments = false,
) {
  const f = state();
  f.entry = entry;
  fixtures.set(page, f);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      u = new URL(request.url());
    if (u.pathname === "/__review.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__review.js"></script></body></html>`,
      });
    f.requests.push({
      url: u.href,
      method: request.method(),
      fresh: request.headers()["cache-control"],
    });
    if (request.method() === "POST") {
      const fields = new URLSearchParams(request.postData() ?? "");
      f.posts.push({ url: u.href, fields: [...fields] });
      f.stored = fields;
      if (f.postGate) await f.postGate;
      if (f.outcome === "lost") return route.abort("failed");
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('${threadURL}&pid=${entry.startsWith("edit") ? (entry === "edit-reply" ? "202" : "101") : entry === "new-thread" ? "101" : "303"}', 'Saved', {'fid':'5','tid':'42','pid':'${entry === "new-thread" ? "101" : "303"}'});</script>]]></root>`,
      });
    }
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${f.member}">Writer ${f.member}</a></strong></div>`;
    const board = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
    let html = account + board;
    if (u.searchParams.get("mod") === "post") {
      const edit = u.searchParams.get("action") === "edit",
        replyEdit =
          edit &&
          (entry === "edit-reply" || u.searchParams.get("pid") === "303"),
        newThread = u.searchParams.get("action") === "newthread",
        target = u.searchParams.get("reppost"),
        saved = edit ? f.stored : null;
      const value = (name: string, fallback = "") =>
        escape(saved?.get(name) ?? fallback);
      const submit = edit
        ? "editsubmit"
        : newThread
          ? "topicsubmit"
          : "replysubmit";
      html += `<form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit" : newThread ? "newthread" : "reply"}&fid=5&tid=42${edit ? `&pid=${u.searchParams.get("pid")}` : ""}&${submit}=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TRANSPORT_SECRET"><input type="hidden" name="posttime" value="1792550000">${target ? '<input type="hidden" name="reppid" value="101"><input type="hidden" name="reppost" value="101"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_TOKEN"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">' : ""}${replyEdit ? "" : `<input name="subject" value="${value("subject")}">`}<textarea name="message">${value("message")}</textarea>${newThread || (edit && !replyEdit) ? `<select name="typeid"><option value="0">No category</option><option value="3"${value("typeid") === "3" ? " selected" : ""}>Listening</option></select>` : ""}<label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1"${saved?.has("bbcodeoff") ? " checked" : ""}>Disable BBCode</label><label>Thread price<input name="price" value="${value("price", "2")}"${edit ? " disabled" : ""}></label><label>Read permission<select name="readperm"${edit ? " disabled" : ""}><option value="10">Members</option></select></label>${edit && !detailedAttachments ? '<input name="attachnew[77][description]" type="hidden" value="Fixture attachment">' : ""}<button type="submit" name="${submit}" value="yes">Continue</button></form>`;
    } else if (u.searchParams.get("mod") === "forumdisplay")
      html += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread</a></th></tr></tbody></table>`;
    else
      html += `<div id="postlist"><h1 id="thread_subject">${entry === "new-thread" && f.posts.length ? escape(f.stored.get("subject") ?? "") : "Existing thread"}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${entry === "edit-opening" || entry === "new-thread" ? "7" : "8"}">${entry === "edit-opening" || entry === "new-thread" ? "Writer 7" : "Other author"}</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Rendered opening body</p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div>${f.posts.length && !entry.startsWith("edit") && entry !== "new-thread" ? '<div id="post_303"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum303"><em>3</em>#</a><div class="pcb">Stored reply</div></div>' : ""}</div>`;
    if (detailedAttachments && u.searchParams.get("action") === "edit")
      html +=
        '<div id="e_attachlist"><input type="hidden" name="attachupdate[77]" value=""><input name="attachnew[77][description]" value="Fixture attachment"><select name="attachnew[77][readperm]" disabled><option value="10" selected>Members</option></select><input name="attachnew[77][price]" value="2" disabled></div><div id="e_imgattachlist"></div>';
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: html }),
    });
  });
  await page.goto(entry === "new-thread" ? boardURL : threadURL);
  if (entry === "new-thread") {
    await revealNavigation(page);
    await page
      .getByRole("button", {
        name: /^(New thread|新主题|新主題)$/,
        exact: true,
      })
      .click();
  } else
    await page
      .getByRole("button", {
        name:
          entry === "reply"
            ? "Reply to thread"
            : entry === "addressed"
              ? "Reply to this post"
              : `Edit post ${entry === "edit-reply" ? "202" : "101"}`,
        exact: true,
      })
      .first()
      .click();
  await expect(
    page.getByLabel(/^(Complete source|完整源码|完整原始碼)$/, { exact: true }),
  ).toBeVisible();
  return f;
}
async function retained(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
async function capture(page: Page, info: TestInfo) {
  const f = fixtures.get(page);
  await info.attach("prepared-review-state-requests.json", {
    body: JSON.stringify(
      {
        requests: f?.requests,
        posts: f?.posts,
        independentlyStored: f ? [...f.stored] : null,
        recovery: await retained(page),
        review: await page.locator(".prepared-review").allTextContents(),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await info.attach("prepared-review.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const heading = page.locator(".prepared-review h2");
  if (await heading.count()) {
    const scroller = page.locator(".writing-content");
    const previous = await scroller.evaluate((node) => node.scrollTop);
    await heading.scrollIntoViewIfNeeded();
    await info.attach("prepared-review-destination.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await scroller.evaluate((node, offset) => {
      node.scrollTop = offset;
    }, previous);
  }
}
test.afterEach(async ({ page }, info) => {
  if (fixtures.has(page)) await capture(page, info);
});

test("UX59.frozen-new-thread: review exact content settings references and inert preview before one independently verified send", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  await page.getByLabel("Category", { exact: true }).selectOption("3");
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText(title);
  await expect(review).toContainText("Listening");
  await expect(review).toContainText("Writer 7 (7)");
  await expect(review).toContainText("Music discussion");
  await expect(review).toContainText("Board 5");
  await expect(review).toContainText("Signature: No");
  await expect(review).toContainText("Thread price: 2");
  await expect(review).toContainText("Read permission: Members (10)");
  await expect(review).toContainText("[attach]77[/attach]");
  await expect(
    review
      .locator(".prepared-body span")
      .filter({ hasText: "Prepared 完整正文" })
      .first(),
  ).toHaveCSS("font-weight", "700");
  await expect(review.locator(".prepared-body")).toContainText(
    "[unknown=v3]Keep <script>literal</script>[/unknown]",
  );
  await expect(
    review.locator("a,img,iframe,script,input,textarea,[contenteditable=true]"),
  ).toHaveCount(0);
  await expect(review).not.toContainText("SYNTHETIC_TRANSPORT_SECRET");
  await expect(review).toContainText(
    "does not guarantee native rendering, notification delivery or publication",
  );
  await review.getByText("Complete prepared source", { exact: true }).click();
  await expect(review.locator(".prepared-source")).toHaveText(body, {
    useInnerText: false,
  });
  expect(f.posts).toHaveLength(0);
  await capture(page, info);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(f.posts).toHaveLength(1);
  expect(Object.fromEntries(f.stored)).toMatchObject({
    subject: title,
    message: body,
    typeid: "3",
    price: "2",
    readperm: "10",
  });
  expect(f.stored.has("usesig")).toBe(false);
  const saved = await retained(page);
  expect(saved.attempts[0].publication.submission.writing).toMatchObject({
    source: body,
    title,
    account: { id: "7" },
    board: { id: "5" },
    category: { value: "3" },
  });
  expect(
    f.requests.some(
      (r) =>
        r.method === "GET" &&
        new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toBe(true);
});

for (const entry of [
  "reply",
  "addressed",
  "edit-opening",
  "edit-reply",
] as const) {
  test(`UX59.frozen-${entry}: inspect the frozen action target applicable title settings and exact body then independently verify the single saved revision`, async ({
    page,
  }, info) => {
    const f = await fixture(page, entry);
    await page.getByLabel("Complete source", { exact: true }).fill(body);
    if (entry === "edit-opening")
      await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Signature", { exact: true }).uncheck();
    await page
      .getByRole("button", {
        name: entry.startsWith("edit") ? "Review edit" : "Review publication",
        exact: true,
      })
      .click();
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toBeVisible();
    await expect(review).toContainText("Writer 7 (7)");
    await expect(review).toContainText("Thread 42");
    await expect(review).toContainText(
      entry === "addressed"
        ? "Other author · Post 101"
        : entry.startsWith("edit")
          ? `Edit post ${entry === "edit-opening" ? "101" : "202"}`
          : "Reply to thread",
    );
    await expect(review.locator("dt").filter({ hasText: "Title" })).toHaveCount(
      entry === "edit-opening" ? 1 : 0,
    );
    if (entry === "edit-opening") await expect(review).toContainText(title);
    if (entry.startsWith("edit")) {
      await expect(review).toContainText("Fixture attachment");
      await expect(review).toContainText("disabled; not submitted");
    }
    await review.getByText("Complete prepared source", { exact: true }).click();
    expect(await review.locator(".prepared-source").textContent()).toBe(body);
    expect(f.posts).toHaveLength(0);
    await capture(page, info);
    await page
      .getByRole("button", {
        name: entry.startsWith("edit") ? "Save edited post" : "Send reply",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        entry.startsWith("edit")
          ? /Confirmed saved post/
          : /Confirmed stored reply/,
      ),
    ).toBeVisible();
    expect(f.posts).toHaveLength(1);
    expect(f.stored.get("message")).toBe(body);
    expect(f.stored.has("usesig")).toBe(false);
    expect(f.stored.get("subject")).toBe(
      entry === "edit-opening" ? title : entry === "edit-reply" ? null : "",
    );
    const prepared = (await retained(page)).attempts[0].publication.submission
      .writing;
    expect(prepared.source).toBe(body);
    expect(prepared.account.id).toBe("7");
    if (entry.startsWith("edit"))
      expect(prepared.editTarget.postId).toBe(
        entry === "edit-opening" ? "101" : "202",
      );
    else
      expect(prepared.replyTarget).toMatchObject({
        threadId: "42",
        postId: entry === "addressed" ? "101" : null,
      });
  });
}

test("UX59.cancel-preservation: inspect source keyboard disclosure cancel and reading return preserve editor content selection undo and approval invalidation without POST", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(body);
  await source.press("End");
  await source.press("!");
  const before = await retained(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText("Source attachment references: 77");
  const disclosure = review.locator("summary");
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(review.locator(".prepared-source")).toBeVisible();
  expect(await review.locator(".prepared-source").textContent()).toBe(
    body + "!",
  );
  await capture(page, info);
  await review
    .getByRole("button", {
      name: "Cancel review and return to writing",
      exact: true,
    })
    .click();
  await expect(review).toHaveCount(0);
  await expect(source).toBeFocused();
  expect((await retained(page)).source).toBe(body + "!");
  expect((await retained(page)).revision).toBe(before.revision);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue(body);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(source).toHaveValue(body + "!");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(review).toBeVisible();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(review).toBeVisible();
  await expect(source).toHaveValue(body + "!");
  expect(f.posts).toHaveLength(0);
});

for (const change of ["source", "title", "category", "option"] as const) {
  test(`UX59.invalidate-${change}: later local changes remove the old approval and require fresh preparation without sending`, async ({
    page,
  }) => {
    const f = await fixture(page);
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Complete source", { exact: true }).fill(body);
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(review).toBeVisible();
    const revision = (await retained(page)).revision;
    if (change === "source")
      await page
        .getByLabel("Complete source", { exact: true })
        .fill(body + " later");
    if (change === "title")
      await page.getByLabel("Title", { exact: true }).fill(title + " later");
    if (change === "category")
      await page.getByLabel("Category", { exact: true }).selectOption("3");
    if (change === "option")
      await page.getByLabel("Signature", { exact: true }).uncheck();
    await expect(review).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Publish thread", exact: true }),
    ).toHaveCount(0);
    expect((await retained(page)).revision).toBeGreaterThan(revision);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(review).toBeVisible();
    await expect(review).toContainText(
      change === "source"
        ? "later"
        : change === "title"
          ? title + " later"
          : change === "category"
            ? "Listening"
            : "Signature: No",
    );
    expect(f.posts).toHaveLength(0);
  });
}
test("UX59.invalidate-account: observing another actor removes approval and retains the original bound writing without POST", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  f.member = "9";
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(review).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toHaveCount(0);
  expect((await retained(page)).account.id).toBe("7");
  expect((await retained(page)).source).toBe(body);
  expect(f.posts).toHaveLength(0);
});
test("UX59.invalidate-target: guarded replacement clears approval before preparing an addressed target", async ({
  page,
}) => {
  const f = await fixture(page, "reply");
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(review).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(body + " addressed");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(review).toContainText("Other author · Post 101");
  expect(f.posts).toHaveLength(0);
});
test("UX59.delayed-uncertain: delayed unknown result owns the frozen revision while later local writing survives reload without replay", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(body);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  let release = () => {};
  f.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.outcome = "lost";
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect.poll(() => f.posts.length).toBe(1);
  await source.fill(body + " LATER LOCAL WRITING");
  release();
  await expect
    .poll(async () => (await retained(page)).attempts[0].status)
    .toBe("uncertain");
  expect(
    (await retained(page)).attempts[0].publication.submission.writing.source,
  ).toBe(body);
  await expect(source).toHaveValue(body + " LATER LOCAL WRITING");
  await page.reload();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(source).toHaveValue(body + " LATER LOCAL WRITING");
  expect(
    (await retained(page)).attempts[0].publication.submission.writing.source,
  ).toBe(body);
  expect(f.posts).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toHaveCount(0);
});
test("UX59.literal-preview: disabled BBCode displays the exact frozen source without pretending formatting or external content is rendered", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  await page.getByLabel("Disable BBCode", { exact: true }).check();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText(
    "BBCode is disabled in this prepared revision",
  );
  expect(await review.locator(".prepared-body").textContent()).toBe(body);
  await expect(
    review.locator(
      ".prepared-body span, .prepared-body table, .prepared-body a, .prepared-body img",
    ),
  ).toHaveCount(0);
  expect(f.posts).toHaveLength(0);
});

for (const profile of [
  {
    width: 390,
    height: 844,
    textSize: 100,
    theme: "light",
    language: "en",
    review: "Prepared publication review",
    prepare: "Review publication",
    source: "Complete source",
    title: "Title",
    summary: "Complete prepared source",
    cancel: "Cancel review and return to writing",
  },
  {
    width: 390,
    height: 844,
    textSize: 150,
    theme: "dark",
    language: "zh-CN",
    review: "发布前审阅",
    prepare: "检查发布",
    source: "完整源码",
    title: "标题",
    summary: "完整已准备源码",
    cancel: "取消审阅并返回写作",
  },
  {
    width: 768,
    height: 900,
    textSize: 70,
    theme: "mono",
    language: "zh-TW",
    review: "發佈前審閱",
    prepare: "檢查發佈",
    source: "完整原始碼",
    title: "標題",
    summary: "完整已準備原始碼",
    cancel: "取消審閱並返回寫作",
  },
  {
    width: 1440,
    height: 900,
    textSize: 100,
    theme: "alias",
    language: "en",
    review: "Prepared publication review",
    prepare: "Review publication",
    source: "Complete source",
    title: "Title",
    summary: "Complete prepared source",
    cancel: "Cancel review and return to writing",
  },
]) {
  test(`UX59.layout-${profile.width}-${profile.textSize}-${profile.theme}-${profile.language}: exact review source and actions wrap through representative appearance and resize without effects`, async ({
    page,
  }, info) => {
    await page.setViewportSize({
      width: profile.width,
      height: profile.height,
    });
    await page.addInitScript(
      (p) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({
            schema: 1,
            theme: p.theme,
            textSize: p.textSize,
            language: p.language,
          }),
        ),
      profile,
    );
    const f = await fixture(page);
    const source = page.getByLabel(profile.source, { exact: true });
    const longBody =
      body + "\nhttps://example.test/" + "long-token-".repeat(45);
    await page.getByLabel(profile.title, { exact: true }).fill(title);
    await source.fill(longBody);
    await page
      .getByRole("button", { name: profile.prepare, exact: true })
      .click();
    const review = page.getByRole("region", {
      name: profile.review,
      exact: true,
    });
    await expect(review).toBeVisible();
    const summary = review.getByText(profile.summary, { exact: true });
    await summary.focus();
    await summary.press("Enter");
    expect(await review.locator("details .prepared-source").textContent()).toBe(
      longBody,
    );
    for (const width of [profile.width, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const metrics = await review.evaluate((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
        width: innerWidth,
      }));
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.width + 1);
      await expect(
        review.getByRole("button", { name: profile.cancel, exact: true }),
      ).toBeVisible();
    }
    await page.setViewportSize({
      width: profile.width,
      height: profile.height,
    });
    await summary.scrollIntoViewIfNeeded();
    await capture(page, info);
    await review
      .getByRole("button", { name: profile.cancel, exact: true })
      .click();
    await expect(source).toBeFocused();
    await expect(source).toHaveValue(longBody);
    expect(f.posts).toHaveLength(0);
  });
}

test("UX59.attachment-labels: review describes frozen attachment identity metadata disabled values and existing association in member language without transport syntax", async ({
  page,
}) => {
  const f = await fixture(page, "edit-opening", true);
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText(
    "Attachments 77 · Description: Fixture attachment",
  );
  await expect(review).toContainText(
    "Attachments 77 · Read permission: 10 · disabled; not submitted",
  );
  await expect(review).toContainText(
    "Attachments 77 · Price: 2 · disabled; not submitted",
  );
  await expect(review).toContainText("Attachments 77 · Existing association");
  await expect(review).not.toContainText(/attachnew\[|attachupdate\[/);
  expect((await retained(page)).attachmentFields).toEqual([
    { name: "attachupdate[77]", value: "", disabled: false },
    {
      name: "attachnew[77][description]",
      value: "Fixture attachment",
      disabled: false,
    },
    { name: "attachnew[77][readperm]", value: "10", disabled: true },
    { name: "attachnew[77][price]", value: "2", disabled: true },
  ]);
  expect(f.posts).toHaveLength(0);
});
