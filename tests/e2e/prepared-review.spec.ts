import { clickThreadTool } from "./navigation-ui";
import {
  openSettings,
  closeSettingsToWorkspace,
  revealNavigation,
} from "./navigation-ui";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { writingPresentationRoundTrip } from "./combined-authoring";
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
    formChange: (html: string) => html,
  };
}
async function fixture(
  page: Page,
  entry: Entry = "new-thread",
  detailedAttachments = false,
  integrated = false,
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
    } else if (integrated && !u.searchParams.has("mod"))
      html += `<div class="bm"><div class="bm_h"><h2>Listening 音樂</h2></div><div id="category_1"><table><tr><td><h2><a href="${boardURL}">Music discussion</a></h2><p class="xg2">Albums and composers</p><span class="xg1">30 threads</span></td><td><h2><a href="forum.php?mod=forumdisplay&fid=6">Other board</a></h2><p class="xg2">Other complete description</p></td></tr></table></div></div>`;
    else if (integrated && u.searchParams.get("mod") === "forumdisplay")
      html += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><div id="thread_types"><a${u.searchParams.get("typeid") === "3" ? ' class="a"' : ""} href="${boardURL}&filter=typeid&typeid=3">Listening</a></div><div id="filter_orderby_menu"><a href="${boardURL}&filter=typeid&typeid=3&orderby=dateline">Newest threads</a></div><table id="threadlisttableid">${Array.from({ length: 30 }, (_, i) => `<tbody id="normalthread_${i === 8 ? 42 : 500 + i}"><tr><th><a class="xst" href="${origin}/forum.php?mod=viewthread&tid=${i === 8 ? 42 : 500 + i}">Listening ${i} 音樂筆記</a></th><td class="by"><cite>Other author</cite></td></tr></tbody>`).join("")}</table><div class="pg"><strong>${u.searchParams.get("page") ?? "1"}</strong><a href="${boardURL}&filter=typeid&typeid=3&page=2">2</a></div>`;
    else if (u.searchParams.get("mod") === "forumdisplay")
      html += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread</a></th></tr></tbody></table>`;
    else
      html += `<div id="postlist"><h1 id="thread_subject">${entry === "new-thread" && f.posts.length ? escape(f.stored.get("subject") ?? "") : "Existing thread"}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${entry === "edit-opening" || entry === "new-thread" ? "7" : "8"}">${entry === "edit-opening" || entry === "new-thread" ? "Writer 7" : "Other author"}</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Rendered opening body</p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div>${f.posts.length && !entry.startsWith("edit") && entry !== "new-thread" ? '<div id="post_303"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum303"><em>3</em>#</a><div class="pcb">Stored reply</div></div>' : ""}</div>`;
    if (integrated && u.searchParams.get("mod") === "viewthread")
      html = html.replace(
        '<div id="post_202">',
        `<div id="post_404"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum404"><em>4</em>#</a><div class="pcb"><p>${"Complete reading 音樂內容. ".repeat(180)}</p><blockquote>Distinct complete quote</blockquote><pre><code>${"0123456789".repeat(100)}</code></pre><table><tr>${Array.from({ length: 12 }, (_, i) => `<td>Complete track credit ${i}</td>`).join("")}</tr></table><div class="locked">Read permission remains withheld.</div></div></div><div id="post_202">`,
      );
    if (detailedAttachments && u.searchParams.get("action") === "edit")
      html +=
        '<div id="e_attachlist"><input type="hidden" name="attachupdate[77]" value=""><input name="attachnew[77][description]" value="Fixture attachment"><select name="attachnew[77][readperm]" disabled><option value="10" selected>Members</option></select><input name="attachnew[77][price]" value="2" disabled></div><div id="e_imgattachlist"></div>';
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: f.formChange(html) }),
    });
  });
  await page.goto(
    integrated
      ? `${origin}/forum.php`
      : entry === "new-thread"
        ? boardURL
        : threadURL,
  );
  if (integrated) {
    await expect(page.locator(".overview .board-card")).toHaveCount(2);
    return f;
  }
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
async function waitForDocking(page: Page, width: number) {
  const body = page.locator(".workspace-body");
  await expect(body).toHaveAttribute(
    "data-boards-collapsed",
    String(width < 960),
  );
  await expect(body).toHaveAttribute(
    "data-threads-collapsed",
    String(width < 768),
  );
}
test.afterEach(async ({ page }, info) => {
  if (fixtures.has(page)) await capture(page, info);
});

test("UX62.mixed-journey: filtered directory and populated board return through rich reading addressed writing correction and exact frozen send", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = await fixture(page, "addressed", false, true);
  const directoryFilter = page.getByRole("searchbox", {
    name: "Filter boards on this page",
    exact: true,
  });
  await directoryFilter.fill("composers");
  expect(f.requests).toHaveLength(1);
  await page.locator(".overview .board-card").press("Enter");
  const results = page.locator(".results-pane");
  await expect(results.locator(".thread-row")).toHaveCount(30);
  const category = page
    .getByRole("navigation", { name: "Board filters", exact: true })
    .getByRole("link", { name: "Listening", exact: true });
  await category.focus();
  await category.press("Enter");
  await results
    .getByRole("navigation", { name: "Board pages", exact: true })
    .getByRole("link", { name: "2", exact: true })
    .click();
  const row = results.getByRole("link", {
    name: "Listening 8 音樂筆記",
    exact: true,
  });
  await row.scrollIntoViewIfNeeded();
  const boardOffset = await results.evaluate((node) => node.scrollTop);
  expect(boardOffset).toBeGreaterThan(0);
  await row.press("Enter");
  await expect(page.getByRole("article")).toHaveCount(3);
  const reader = page.locator(".reading-pane");
  for (const name of ["Scrollable code", "Scrollable table"]) {
    const region = reader.getByRole("region", { name, exact: true });
    await region.focus();
    await region.press("ArrowRight");
    await expect
      .poll(() => region.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
  }
  await expect(reader).toContainText("Read permission remains withheld.");
  await page
    .locator("#pid101")
    .getByRole("button", { name: "Reply to this post", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  const replyBody = body.replace(" [attach]77[/attach]", "");
  const unformatted = `Integrated text\n${replyBody}`;
  await source.fill(unformatted);
  await source.evaluate((node: HTMLTextAreaElement) => {
    node.setSelectionRange(0, 10);
    node.dispatchEvent(new Event("select", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Italic", exact: true }).click();
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  const formatted = `[i]Integrated[/i] text\n${replyBody}`;
  await expect(source).toHaveValue(formatted);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue(unformatted);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(source).toHaveValue(formatted);
  const before = await retained(page);
  const selection = await source.evaluate((node: HTMLTextAreaElement) => [
    node.selectionStart,
    node.selectionEnd,
    node.selectionDirection,
  ]);
  const presentationRequests = f.requests.length;
  await writingPresentationRoundTrip(page, info);
  expect(await retained(page)).toEqual(before);
  expect(
    await source.evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
      node.selectionDirection,
    ]),
  ).toEqual(selection);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await reader.evaluate((node) => {
    node.scrollTop = 650;
  });
  const readingOffset = await reader.evaluate((node) => node.scrollTop);
  expect(readingOffset).toBeGreaterThan(0);
  const geometry = await reader.evaluate((node) => ({
    top: node.getBoundingClientRect().top,
    height: node.getBoundingClientRect().height,
    width: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  const conversationTop = await page
    .locator(".conversation-region")
    .evaluate((node) => node.getBoundingClientRect().top);
  expect(conversationTop).toBeLessThanOrEqual(240);
  expect(geometry.top).toBeGreaterThanOrEqual(conversationTop);
  const headingHeight = await page
    .locator(".conversation-heading")
    .evaluate((node) => node.getBoundingClientRect().height);
  // The former reader box included this heading; retain that area budget and
  // separately require actual scrollable post space in the docked layout.
  expect(headingHeight + geometry.height).toBeGreaterThanOrEqual(422);
  expect(geometry.height).toBeGreaterThanOrEqual(96);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  await info.attach("integrated-retained-reader.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  expect(await reader.evaluate((node) => node.scrollTop)).toBe(readingOffset);
  expect(await retained(page)).toEqual(before);
  expect(f.requests).toHaveLength(presentationRequests);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await source.fill(" \n ");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(source).toHaveAttribute("aria-invalid", "true");
  await expect(source).toBeFocused();
  expect(f.posts).toHaveLength(0);
  await source.fill(formatted);
  const corrected = await retained(page);
  for (const key of [
    "id",
    "title",
    "category",
    "options",
    "account",
    "board",
    "replyTarget",
    "editTarget",
    "uploads",
    "uploadedReferences",
    "attachmentFields",
  ])
    expect(corrected[key]).toEqual(before[key]);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toContainText("Other author · Post 101");
  await review.locator("summary").focus();
  await review.locator("summary").press("Enter");
  expect(await review.locator(".prepared-source").textContent()).toBe(
    formatted,
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const beforeBack = f.requests.length;
  await clickThreadTool(page, "Back");
  await expect(results.locator(".thread-row")).toHaveCount(30);
  await expect(results.getByText("Page 2", { exact: true })).toBeVisible();
  expect(await results.evaluate((node) => node.scrollTop)).toBe(boardOffset);
  expect(f.requests).toHaveLength(beforeBack);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  // A board-only history snapshot has no conversation until writing is shown.
  // Threads is an in-place primary pane since #82, not an Escape modal.
  await page.getByRole("button", { name: "Threads pane", exact: true }).click();
  await expect(review).toBeVisible();
  expect(await retained(page)).toEqual(corrected);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await capture(page, info);
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(f.posts).toHaveLength(1);
  expect(f.stored.get("message")).toBe(formatted);
  expect(f.stored.get("reppid")).toBe("101");
  expect(f.stored.get("noticeauthor")).toBe("OPAQUE_AUTHOR_TOKEN");
  expect(
    f.requests.some(
      (r) =>
        r.method === "GET" &&
        new URL(r.url).searchParams.get("action") === "edit" &&
        new URL(r.url).searchParams.get("pid") === "303",
    ),
  ).toBe(true);
  await info.attach("integrated-geometry-offset.json", {
    body: JSON.stringify(
      {
        geometry,
        readingOffset,
        originalNarrowChrome: 412.28125,
        budget: 240,
        requests: f.requests,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

for (const input of ["pointer", "keyboard"] as const)
  test(`UX62.disclosed-writing-${input}: narrow enlarged new-thread review remains reachable after drawer navigation`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const f = await fixture(page);
    await expect(
      page.getByRole("button", { name: "Boards pane", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Complete ordinary writing 音樂");
    await openSettings(page);
    await page.getByLabel("Text size", { exact: true }).fill("150");
    await closeSettingsToWorkspace(page);
    const review = page.getByRole("button", {
      name: "Review publication",
      exact: true,
    });
    await review.scrollIntoViewIfNeeded();
    await info.attach("disclosed-writing-before.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("disclosed-writing-geometry.json", {
      body: JSON.stringify(
        await page.locator(".source-writing").evaluate((node) => ({
          writing: node.getBoundingClientRect().toJSON(),
          content: node
            .querySelector(".writing-content")
            ?.getBoundingClientRect()
            .toJSON(),
          actions: node
            .querySelector(".writing-presentation-actions")
            ?.getBoundingClientRect()
            .toJSON(),
          buttons: [...node.querySelectorAll("button")]
            .filter((b) => b.textContent === "Review publication")
            .map((b) => b.getBoundingClientRect().toJSON()),
        })),
        null,
        2,
      ),
      contentType: "application/json",
    });
    if (input === "pointer") await review.click({ timeout: 3000 });
    else {
      await review.focus();
      await review.press("Enter");
    }
    await expect(
      page.getByRole("region", {
        name: "Prepared publication review",
        exact: true,
      }),
    ).toBeVisible();
    const heading = page.locator(".prepared-review h2");
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
    expect(
      await page
        .locator(".writing-content")
        .evaluate((node) => node.clientHeight),
    ).toBeGreaterThan(0);
    await page
      .getByRole("button", {
        name: "Cancel review and return to writing",
        exact: true,
      })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await expect(source).toBeFocused();
    await source.click();
    await expect(source).toBeFocused();
    const beforeReturn = await retained(page),
      requests = f.requests.length;
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Threads pane", exact: true })
      .click();
    await expect(page.locator(".results-pane")).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    expect(await retained(page)).toEqual(beforeReturn);
    await page
      .getByRole("button", { name: "Boards pane", exact: true })
      .press("Escape");
    await expect(
      page.getByRole("button", { name: "Boards pane", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      await page.locator(".workspace").evaluate((node) => node.scrollTop),
    ).toBe(0);
    expect(f.requests).toHaveLength(requests);
    expect(f.posts).toHaveLength(0);
  });

test("UX62.disclosed-validation: enlarged drawer navigation retains a usable writing viewport for body correction and state through resizing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(" \n ");
  await openSettings(page);
  await page.getByLabel("Text size", { exact: true }).fill("150");
  await closeSettingsToWorkspace(page);
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await review.focus();
  await review.press("Enter");
  await expect(source).toBeFocused();
  await expect(source).toHaveAttribute("aria-invalid", "true");
  const error = page.getByText("Enter the post body.", { exact: true });
  await expect(error).toBeInViewport();
  const before = await retained(page),
    requestCount = f.requests.length;
  const geometries = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await waitForDocking(page, viewport.width);
    expect(await retained(page)).toEqual(before);
    const geometry = await page
      .locator(".writing-content")
      .evaluate((node) => ({
        height: node.clientHeight,
        width: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
    expect(geometry.height).toBeGreaterThan(100);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
    geometries.push({ viewport, geometry });
  }
  expect(f.requests).toHaveLength(requestCount);
  expect(f.posts).toHaveLength(0);
  await info.attach("disclosed-validation-state.json", {
    body: JSON.stringify({ before, geometries, requests: f.requests }, null, 2),
    contentType: "application/json",
  });
});

for (const [entry, width, height, textSize, theme, language] of [
  ["new-thread", 390, 844, 150, "dark", "zh-CN"],
  ["edit-opening", 768, 900, 70, "mono", "zh-TW"],
  ["edit-reply", 1440, 900, 100, "alias", "en"],
] as const) {
  test(`UX62.integrated-${entry}: direct arrival and complete writing identity survive presentation appearance and frozen independently verified save`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    const f = await fixture(page, entry, true);
    const navigation = page.getByRole("button", {
      name: "Boards pane",
      exact: true,
    });
    if (await navigation.isVisible()) await navigation.press("Escape");
    const source = page.getByLabel(/^(Complete source|完整源码|完整原始碼)$/, {
      exact: true,
    });
    if (entry === "edit-reply") {
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      expect(
        await page
          .locator(".reading-pane")
          .evaluate((node) => node.getBoundingClientRect().left),
      ).toBe(516);
      await expect(page.locator(".results-placeholder")).toBeVisible();
      await expect(page.locator(".results-pane")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
    }
    if (entry !== "edit-reply") {
      await page.getByLabel("Title", { exact: true }).fill(title);
      await page.getByLabel("Category", { exact: true }).selectOption("3");
    }
    await page.getByLabel("Signature", { exact: true }).uncheck();
    const original =
      entry === "new-thread" ? body.replace(" [attach]77[/attach]", "") : body;
    await source.fill(original);
    await source.press("ControlOrMeta+End");
    await source.press("!");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(source).toHaveValue(original);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    const finalSource = original + "!";
    await expect(source).toHaveValue(finalSource);
    await page
      .getByRole("button", { name: "Visual editor", exact: true })
      .click();
    await expect(
      page
        .getByRole("textbox", { name: "Visual post content", exact: true })
        .locator("table"),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await expect(source).toHaveValue(finalSource);
    await source.evaluate((node: HTMLTextAreaElement) => {
      node.setSelectionRange(3, 11);
      node.dispatchEvent(new Event("select", { bubbles: true }));
    });
    const before = await retained(page),
      requestCount = f.requests.length;
    await writingPresentationRoundTrip(page, info);
    await openSettings(page);
    await page.getByLabel("Text size", { exact: true }).fill(String(textSize));
    await page.locator(`input[name="theme"][value="${theme}"]`).check();
    await page.locator("#interface-language").selectOption(language);
    await closeSettingsToWorkspace(page);
    const geometries = [];
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await page.locator(".workspace").evaluate((node) => ({
        width: node.clientWidth,
        scroll: node.scrollWidth,
      }));
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
      expect(await retained(page)).toEqual(before);
      geometries.push({ viewport, geometry });
      await info.attach(
        `integrated-${entry}-${viewport.width}-${textSize}-${theme}-${language}.png`,
        { body: await page.screenshot(), contentType: "image/png" },
      );
    }
    await page.setViewportSize({ width, height });
    expect(
      await source.evaluate((node: HTMLTextAreaElement) => [
        node.selectionStart,
        node.selectionEnd,
      ]),
    ).toEqual([3, 11]);
    await openSettings(page);
    await page.locator("#interface-language").selectOption("en");
    await closeSettingsToWorkspace(page);
    expect(f.requests).toHaveLength(requestCount);
    await page
      .getByText("Advanced authoring tools", { exact: true })
      .press("Enter");
    await page
      .getByText("Advanced authoring tools", { exact: true })
      .press("Enter");
    expect(await retained(page)).toEqual(before);
    await page
      .getByRole("button", {
        name: entry === "new-thread" ? "Review publication" : "Review edit",
        exact: true,
      })
      .click();
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toContainText("Writer 7 (7)");
    if (entry !== "new-thread")
      await expect(review).toContainText(
        `Edit post ${entry === "edit-opening" ? "101" : "202"}`,
      );
    if (entry !== "edit-reply") {
      await expect(review).toContainText(title);
      await expect(review).toContainText("Listening");
    }
    if (entry !== "new-thread")
      await expect(review).toContainText("Fixture attachment");
    await review.locator("summary").press("Enter");
    expect(await review.locator(".prepared-source").textContent()).toBe(
      finalSource,
    );
    expect(f.posts).toHaveLength(0);
    await capture(page, info);
    await page
      .getByRole("button", {
        name: entry === "new-thread" ? "Publish thread" : "Save edited post",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        entry === "new-thread"
          ? /Confirmed stored thread/
          : /Confirmed saved post/,
      ),
    ).toBeVisible();
    expect(f.posts).toHaveLength(1);
    expect(f.stored.get("message")).toBe(finalSource);
    expect(f.stored.has("usesig")).toBe(false);
    if (entry !== "edit-reply") {
      expect(f.stored.get("subject")).toBe(title);
      expect(f.stored.get("typeid")).toBe("3");
    }
    const submitted = (await retained(page)).attempts[0].publication.submission
      .writing;
    expect(submitted.source).toBe(finalSource);
    expect(submitted.account.id).toBe("7");
    if (entry !== "new-thread") {
      expect(submitted.editTarget.postId).toBe(
        entry === "edit-opening" ? "101" : "202",
      );
      expect(f.stored.get("attachnew[77][description]")).toBe(
        "Fixture attachment",
      );
    }
    expect(
      f.requests.some(
        (r) =>
          r.method === "GET" &&
          new URL(r.url).searchParams.get("action") === "edit",
      ),
    ).toBe(true);
    await info.attach("integrated-appearance-state.json", {
      body: JSON.stringify(
        {
          entry,
          textSize,
          theme,
          language,
          geometries,
          before,
          submitted,
          requests: f.requests,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  });
}

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
  await expect(source).toBeVisible();
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
      await waitForDocking(page, width);
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

for (const entry of [
  "new-thread",
  "reply",
  "addressed",
  "edit-opening",
  "edit-reply",
] as const)
  for (const mode of ["source", "visual"] as const)
    test(`UX60.body-${entry}-${mode}: empty body identifies its active editor without inventing a title or changing the writing target`, async ({
      page,
    }) => {
      const f = await fixture(page, entry);
      if (await page.getByLabel("Title", { exact: true }).count())
        await page.getByLabel("Title", { exact: true }).fill("Retained title");
      await page.getByLabel("Complete source", { exact: true }).fill("  \n ");
      if (mode === "visual")
        await page
          .getByRole("button", { name: "Visual editor", exact: true })
          .click();
      const before = await retained(page),
        requests = f.requests.length;
      await page
        .getByRole("button", {
          name: entry.startsWith("edit") ? "Review edit" : "Review publication",
          exact: true,
        })
        .click();
      const editor = page.getByRole("textbox", {
        name: mode === "source" ? "Complete source" : "Visual post content",
        exact: true,
      });
      await expect(editor).toHaveAttribute("aria-invalid", "true");
      await expect(editor).toHaveAccessibleDescription("Enter the post body.");
      await expect(editor).toBeFocused();
      await expect(
        page.getByText("Enter a title.", { exact: true }),
      ).toHaveCount(0);
      await expect(page.getByText(/Sending paused/)).toHaveCount(0);
      const after = await retained(page);
      expect(after.source).toBe("  \n ");
      for (const key of [
        "id",
        "title",
        "category",
        "options",
        "account",
        "board",
        "replyTarget",
        "editTarget",
        "uploads",
        "uploadedReferences",
        "attachmentFields",
      ])
        expect(after[key]).toEqual(before[key]);
      expect(f.requests).toHaveLength(requests);
      expect(f.posts).toHaveLength(0);
    });

test("UX60.edit-form: same-actor unsupported native edit form is a form refusal rather than asserted account expiry", async ({
  page,
}) => {
  const f = await fixture(page, "edit-opening");
  await page.getByLabel("Complete source", { exact: true }).fill(body);
  f.formChange = (html) =>
    html.replace('name="formhash"', 'name="missing-token"');
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /current form|current source/ })
      .first(),
  ).toBeVisible();
  await expect(page.getByText(/Sending paused/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save edit", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    body,
  );
  expect(f.posts).toHaveLength(0);
});

for (const profile of [
  {
    width: 390,
    height: 844,
    textSize: 100,
    theme: "light",
    language: "en",
    mode: "source",
    title: "Title",
    prepare: "Review publication",
    source: "Complete source",
    titleError: "Enter a title.",
    bodyError: "Enter the post body.",
  },
  {
    width: 390,
    height: 844,
    textSize: 150,
    theme: "dark",
    language: "zh-CN",
    mode: "visual",
    title: "标题",
    prepare: "检查发布",
    source: "完整源码",
    titleError: "请输入标题。",
    bodyError: "请输入正文。",
  },
  {
    width: 768,
    height: 900,
    textSize: 70,
    theme: "mono",
    language: "zh-TW",
    mode: "source",
    title: "標題",
    prepare: "檢查發佈",
    source: "完整原始碼",
    titleError: "請輸入標題。",
    bodyError: "請輸入正文。",
  },
  {
    width: 1440,
    height: 900,
    textSize: 150,
    theme: "alias",
    language: "en",
    mode: "visual",
    title: "Title",
    prepare: "Review publication",
    source: "Complete source",
    titleError: "Enter a title.",
    bodyError: "Enter the post body.",
  },
])
  test(`UX60.layout-${profile.width}-${profile.textSize}-${profile.theme}-${profile.language}-${profile.mode}: localized errors remain associated bounded keyboard reachable and source preserving across resize`, async ({
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
    const titleInput = page.getByLabel(profile.title, { exact: true });
    await titleInput.fill("  ");
    await page.getByLabel(profile.source, { exact: true }).fill("  \n ");
    if (profile.mode === "visual")
      await page
        .getByRole("button", {
          name: /^(Visual editor|可视编辑|視覺編輯)$/,
          exact: true,
        })
        .click();
    const before = await retained(page),
      requests = f.requests.length;
    const review = page.getByRole("button", {
      name: profile.prepare,
      exact: true,
    });
    await review.focus();
    await review.press("Enter");
    await expect(titleInput).toHaveAccessibleDescription(profile.titleError);
    await expect(titleInput).toBeFocused();
    const activeEditor = page.getByRole("textbox", {
      name:
        profile.mode === "source"
          ? profile.source
          : /^(Visual post content|可视帖子内容|視覺文章內容)$/,
      exact: true,
    });
    await expect(activeEditor).toHaveAccessibleDescription(profile.bodyError);
    for (const width of [profile.width, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await waitForDocking(page, width);
      const metrics = await page
        .locator("#writing-title-error")
        .evaluate((node) => ({
          client: node.clientWidth,
          scroll: node.scrollWidth,
          left: node.getBoundingClientRect().left,
          right: node.getBoundingClientRect().right,
          width: innerWidth,
        }));
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.width + 1);
      await expect(titleInput).toBeFocused();
    }
    const after = await retained(page);
    expect(after).toEqual(before);
    expect(f.requests).toHaveLength(requests);
    expect(f.posts).toHaveLength(0);
    await page.setViewportSize({
      width: profile.width,
      height: profile.height,
    });
    await titleInput.scrollIntoViewIfNeeded();
    await capture(page, info);
  });

test("UX60.language-composition: language updates field errors without source/history changes and composition blocks deliberate review focus", async ({
  page,
}) => {
  const f = await fixture(page);
  const titleInput = page.getByLabel("Title", { exact: true }),
    editor = page.getByLabel("Complete source", { exact: true });
  await titleInput.fill("");
  await editor.fill(body);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(titleInput).toBeFocused();
  const before = await retained(page),
    requests = f.requests.length;
  await openSettings(page);
  await page.locator("#interface-language").focus();
  await page.locator("#interface-language").selectOption("zh-CN");
  await expect(
    page.getByLabel("标题", { exact: true }),
  ).toHaveAccessibleDescription("请输入标题。");
  await expect(page.locator("#interface-language")).toBeFocused();
  await page.locator("#interface-language").selectOption("zh-TW");
  await expect(
    page.getByLabel("標題", { exact: true }),
  ).toHaveAccessibleDescription("請輸入標題。");
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  expect(await retained(page)).toEqual(before);
  const sourceInput = page.getByLabel("完整原始碼", { exact: true });
  await sourceInput.focus();
  await sourceInput.dispatchEvent("compositionstart", { data: "jat" });
  await page
    .getByRole("button", { name: "檢查發佈", exact: true })
    .dispatchEvent("click");
  await expect(sourceInput).toBeFocused();
  expect(f.requests).toHaveLength(requests);
  expect(await retained(page)).toEqual(before);
  await sourceInput.dispatchEvent("compositionend", { data: "一" });
  expect(f.posts).toHaveLength(0);
});

test("UX60.new-context: deliberate owned-edit replacement does not inherit previous new-thread field refusals", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByLabel("Title", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Existing thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit post 101", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard local writing and edit post",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Original title",
  );
  await expect(page.getByLabel("Title", { exact: true })).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    page.getByLabel("Complete source", { exact: true }),
  ).not.toHaveAttribute("aria-invalid", "true");
  expect(f.posts).toHaveLength(0);
});

for (const scenario of ["body-limit", "unsupported-form"] as const)
  test(`UX60.edit-native-${scenario}: current native edit refusal preserves actor distinction and associates supported limits`, async ({
    page,
  }) => {
    const f = await fixture(page, "edit-opening");
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Retained complete source");
    f.formChange = (html) =>
      html.replace(
        scenario === "body-limit" ? 'name="message"' : 'id="postform"',
        scenario === "body-limit"
          ? 'name="message" maxlength="3"'
          : 'id="unsupported-form"',
      );
    await page
      .getByRole("button", { name: "Review edit", exact: true })
      .click();
    if (scenario === "unsupported-form")
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: /current source|current form/ })
          .first(),
      ).toBeVisible();
    await expect(page.getByText(/Sending paused/)).toHaveCount(0);
    await expect(
      page.getByRole("region", {
        name: "Prepared publication review",
        exact: true,
      }),
    ).toHaveCount(0);
    const editor = page.getByLabel("Complete source", { exact: true });
    await expect(editor).toHaveValue("Retained complete source");
    if (scenario === "body-limit") {
      await expect(editor).toHaveAccessibleDescription(
        "Use at most 3 characters.",
      );
      await expect(editor).toBeFocused();
    } else
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: /current source|current form/ })
          .first(),
      ).toBeVisible();
    expect(f.posts).toHaveLength(0);
  });

for (const mode of ["source", "visual"] as const)
  test(`UX60.error-viewport-${mode}: enlarged desktop body error is fully visible with the invalid active editor focused and original history retained`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() =>
      localStorage.setItem(
        "tsdm.workspace.preferences",
        JSON.stringify({
          schema: 1,
          theme: "dark",
          textSize: 150,
          language: "en",
        }),
      ),
    );
    const f = await fixture(page);
    await page.getByLabel("Title", { exact: true }).fill("Retained title 完整");
    await page.getByLabel("Complete source", { exact: true }).fill(" \n ");
    if (mode === "visual")
      await page
        .getByRole("button", { name: "Visual editor", exact: true })
        .click();
    const before = await retained(page),
      requests = f.requests.length;
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    const active = page.getByRole("textbox", {
      name: mode === "source" ? "Complete source" : "Visual post content",
      exact: true,
    });
    await expect(active).toBeFocused();
    await expect(active).toHaveAccessibleDescription("Enter the post body.");
    const error = page.locator("#writing-source-error");
    await info.attach("focused-body-error.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const metrics = await page.locator(".writing-content").evaluate((node) => {
      const host = node.getRootNode() as ShadowRoot,
        error = host.querySelector("#writing-source-error")!,
        active = host.activeElement!;
      const bounds = (element: Element) => {
        const b = element.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
      };
      return {
        scroller: bounds(node),
        error: bounds(error),
        active: bounds(active),
        viewport: { width: innerWidth, height: innerHeight },
      };
    });
    await info.attach("focused-body-error-metrics.json", {
      body: JSON.stringify(metrics),
      contentType: "application/json",
    });
    await expect(error).toBeInViewport({ ratio: 1 });
    expect(metrics.error.top).toBeGreaterThanOrEqual(metrics.scroller.top);
    expect(metrics.error.bottom).toBeLessThanOrEqual(metrics.scroller.bottom);
    expect(await retained(page)).toEqual(before);
    expect(f.requests).toHaveLength(requests);
    expect(f.posts).toHaveLength(0);
  });
