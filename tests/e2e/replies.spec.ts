import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const actor = (id = "7") =>
  `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Writer ${id}</a></strong></div>`;
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const source =
  "[unknown=v3]完整回覆 & literal <tag>[/unknown]\n[quote]Additional source quote[/quote]";
function form(saved?: URLSearchParams, member = "7", quote = false) {
  return `<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script>${actor(member)}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&pid=303" : "reply"}&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${quote ? '<input type="hidden" name="reppid" value="101"><input type="hidden" name="reppost" value="101"><input type="hidden" name="noticeauthor" value="OPAQUE-AUTHOR-8"><input type="hidden" name="noticeauthormsg" value="Preserved addressed author"><input type="hidden" name="noticetrimstr" value="">' : ""}<input name="subject" value=""><textarea name="message">${escape(saved?.get("message") ?? "")}</textarea><label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1"${saved?.has("bbcodeoff") ? " checked" : ""}>Disable BBCode</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;
}
async function fixture(page: Page) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const state = {
    priorSource: null as string | null,
    member: "7",
    mode: "accepted",
    response: null as string | null,
    postGate: null as Promise<void> | null,
    sourceGate: null as Promise<void> | null,
    mentionGate: null as Promise<void> | null,
    formChange: (body: string) => body,
    sourceChange: (body: string) => body,
    threadChange: (body: string) => body,
    people: [{ uid: 8, username: "Other author" }],
    posts: [] as URLSearchParams[],
    requests: [] as { url: string; method: string }[],
  };
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__workspace-fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    state.requests.push({ url: url.href, method: request.method() });
    if (url.pathname === "/plugin.php") {
      if (state.mentionGate) await state.mentionGate;
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: 1, list: state.people }),
      });
    }
    if (request.method() === "POST") {
      state.posts.push(new URLSearchParams(request.postData() ?? ""));
      if (state.postGate) await state.postGate;
      if (state.mode === "account-flight") state.member = "8";
      if (state.mode === "lost") return route.abort("failed");
      if (state.mode === "rejected")
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>errorhandle_post('message_toolong', {});</script>]]></root>",
        });
      if (state.mode === "moderation")
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>succeedhandle_post('', '回复需要审核', {});</script>]]></root>",
        });
      if (state.response)
        return route.fulfill({ contentType: "text/xml", body: state.response });
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42&pid=303&page=1#pid303', 'Reply accepted', {});</script>]]></root>`,
      });
    }
    if (url.searchParams.get("action") === "edit" && state.sourceGate)
      await state.sourceGate;
    let body =
      url.searchParams.get("mod") === "post"
        ? url.searchParams.get("action") === "edit"
          ? state.sourceChange(
              form(
                state.posts.at(-1) ??
                  (state.priorSource !== null
                    ? new URLSearchParams({
                        message: state.priorSource,
                        usesig: "1",
                      })
                    : undefined),
                state.member,
              ),
            )
          : state.formChange(
              form(
                undefined,
                state.member,
                url.searchParams.get("reppost") === "101",
              ),
            )
        : `${actor(state.member)}<div id="pt"><a href="${boardURL}">Music</a></div><div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Existing opening source</p></div></div>${state.posts.length || state.priorSource !== null ? '<div id="post_303"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum303"><em>2</em>#</a><div class="pcb"><p>Stored reply</p></div></div>' : ""}</div>`;
    if (url.searchParams.get("mod") === "viewthread")
      body = state.threadChange(body);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(threadURL);
  return state;
}
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    await info.attach("failed-application.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});
test("J4.reply-current: preserve complete source/current options and open independently confirmed returned post", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(page.getByText(/Review reply revision/)).toBeVisible();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    message: source,
    subject: "",
    replysubmit: "yes",
    formhash: "SYNTHETIC_PUBLIC_FORM_TOKEN",
  });
  expect(state.posts[0]!.has("usesig")).toBe(false);
  expect(
    state.requests.some(
      (r) =>
        new URL(r.url).searchParams.get("action") === "edit" &&
        new URL(r.url).searchParams.get("pid") === "303",
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Open confirmed post", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Post 303", exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).not.toContain("SYNTHETIC_PUBLIC_FORM_TOKEN");
  await info.attach("reply.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("server-state.json", {
    body: Buffer.from(
      JSON.stringify({
        posts: state.posts.map((p) => Object.fromEntries(p)),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
});

test("J4.quote-target: one addressed target survives extra source quote blocks and replacement guard", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByRole("article", { name: "Post 101", exact: true })
    .getByRole("button", { name: "Quick Quote", exact: true })
    .click();
  await expect(
    page.getByText("Addressed to Other author · Post 101", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    message: source,
    reppid: "101",
    reppost: "101",
    noticeauthor: "OPAQUE-AUTHOR-8",
    noticeauthormsg: "Preserved addressed author",
  });
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).toContain('"postId":"101"');
  expect(saved).not.toContain("OPAQUE-AUTHOR-8");
  await info.attach("quote.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("server-state.json", {
    body: Buffer.from(
      JSON.stringify({
        posts: state.posts.map((p) => Object.fromEntries(p)),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
});

test("J4.reply-mentions: select a resolved person using current marked syntax while literal @ text stays literal", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Literal @Other author stays literal. ");
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Literal @Other author stays literal. @\u2063Other author\u2063 ",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.get("message")).toBe(
    "Literal @Other author stays literal. @\u2063Other author\u2063 ",
  );
  await expect(
    page.getByText(/notification delivery is unverified/),
  ).toBeVisible();
  await info.attach("mentions.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("server-state.json", {
    body: Buffer.from(
      JSON.stringify({
        posts: state.posts.map((p) => Object.fromEntries(p)),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
});

async function readyReply(page: Page) {
  const state = await fixture(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  return state;
}
for (const mode of ["rejected", "moderation", "lost"])
  test(`J4.reply-outcomes: ${mode} retains original writing and never repeats send`, async ({
    page,
  }, info) => {
    const state = await readyReply(page);
    state.mode = mode;
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText(
        mode === "rejected"
          ? /explicitly refused/
          : mode === "moderation"
            ? /reports pending moderation/
            : /response was lost/,
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    expect(state.posts).toHaveLength(1);
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    expect(state.posts).toHaveLength(1);
    await info.attach("outcome.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
test("J4.reply-later-edit: older confirmation preserves later source while returned reader failure preserves confirmation", async ({
  page,
}, info) => {
  const state = await readyReply(page);
  let release!: () => void;
  state.sourceGate = new Promise<void>((r) => {
    release = r;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(() =>
      state.requests.some(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ),
    )
    .toBe(true);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later unsent revision");
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later unsent revision",
  );
  state.threadChange = () => "<p>Unavailable reader</p>";
  await page
    .getByRole("link", { name: "Open confirmed post", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await info.attach("later-edit.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J4.reply-result-single-navigation: one confirmed-result click reads once and preserves newer unsent source", async ({
  page,
}, info) => {
  const state = await readyReply(page);
  let release!: () => void;
  state.sourceGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(() =>
      state.requests.some(
        (request) => new URL(request.url).searchParams.get("action") === "edit",
      ),
    )
    .toBe(true);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later unsent revision");
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  const before = state.requests.length;
  const historyBefore = await page.evaluate(() => history.length);
  await page
    .getByRole("link", { name: "Open confirmed post", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Post 303", exact: true }),
  ).toBeVisible();
  const readerRequests = state.requests.slice(before);
  const historyAfter = await page.evaluate(() => history.length);
  expect.soft(readerRequests).toHaveLength(1);
  expect
    .soft(
      readerRequests.map((request) => {
        const destination = new URL(request.url);
        return {
          method: request.method,
          origin: destination.origin,
          pathname: destination.pathname,
          query: Object.fromEntries(destination.searchParams),
        };
      }),
    )
    .toEqual([
      {
        method: "GET",
        origin,
        pathname: "/forum.php",
        query: { mod: "viewthread", tid: "42", page: "1", tsdmapp: "json" },
      },
    ]);
  expect.soft(historyAfter - historyBefore).toBe(1);
  const beforeReturn = state.requests.length;
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later unsent revision",
  );
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.requests).toHaveLength(beforeReturn);
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.get("message")).toBe(source);
  await info.attach("reply-result-navigation.json", {
    body: Buffer.from(
      JSON.stringify({
        readerRequests,
        historyBefore,
        historyAfter,
        returnRequests: state.requests.slice(beforeReturn),
        submittedSource: state.posts[0]!.get("message"),
        retainedSource: await page
          .getByLabel("Complete source", { exact: true })
          .inputValue(),
        commands: state.posts.length,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("reply-result-navigation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.reply-pending: reload retains uncertainty then explicit exact-post check confirms without sending", async ({
  page,
}, info) => {
  const state = await readyReply(page);
  let release!: () => void;
  state.postGate = new Promise<void>((r) => {
    release = r;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect.poll(() => state.posts.length).toBe(1);
  await page.reload();
  release();
  await expect(
    page.getByText(/Pending publication restored as uncertain/),
  ).toBeVisible();
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${threadURL}&page=1#pid303`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await info.attach("recovered-reply.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
for (const phase of ["before-send", "in-flight", "readback"])
  test(`J11.reply-session: changed account ${phase} cannot confirm or replay original reply`, async ({
    page,
  }, info) => {
    const state = await readyReply(page);
    if (phase === "before-send") state.member = "8";
    else if (phase === "in-flight") {
      state.mode = "account-flight";
    } else
      state.sourceChange = (body) =>
        body.replace('uid=7">Writer 7', 'uid=8">Writer 8');
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText(
        /account changed.*(?:before send|result checking|stored-source readback)/,
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    expect(state.posts).toHaveLength(phase === "before-send" ? 0 : 1);
    await info.attach("session.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
for (const mismatch of [
  "source",
  "author",
  "board",
  "missing-post",
  "merged-prefix",
])
  test(`J4.reply-readback: ${mismatch} cannot become a complete-source confirmation`, async ({
    page,
  }, info) => {
    const state = await readyReply(page);
    if (mismatch === "source")
      state.sourceChange = (b) => b.replace(escape(source), "Different source");
    if (mismatch === "merged-prefix")
      state.sourceChange = (b) =>
        b.replace(
          escape(source),
          `Prior text + unsupported supplement ${escape(source)}`,
        );
    if (mismatch === "author")
      state.threadChange = (b) =>
        b.replace(
          'uid=7">Writer 7</a></div><a id="postnum303"',
          'uid=8">Other writer</a></div><a id="postnum303"',
        );
    if (mismatch === "board")
      state.threadChange = (b) =>
        state.posts.length
          ? b.replace("mod=forumdisplay&fid=5", "mod=forumdisplay&fid=6")
          : b;
    if (mismatch === "missing-post")
      state.threadChange = (b) => b.replaceAll("303", "304");
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await info.attach("readback-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
for (const mismatch of ["wrong-post", "populated-trim", "ordinary-addressed"])
  test(`J4.reply-preparation: ${mismatch} refuses rather than changing target or source`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (mismatch === "wrong-post")
      state.formChange = (b) =>
        b.replace('name="reppid" value="101"', 'name="reppid" value="999"');
    if (mismatch === "populated-trim")
      state.formChange = (b) =>
        b.replace(
          'name="noticetrimstr" value=""',
          'name="noticetrimstr" value="Quoted source with unknown insertion semantics"',
        );
    if (mismatch === "ordinary-addressed")
      state.formChange = (b) =>
        b.replace(
          '<input name="subject"',
          '<input type="hidden" name="reppid" value="101"><input name="subject"',
        );
    if (mismatch === "ordinary-addressed")
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
    else
      await page
        .getByRole("article", { name: "Post 101", exact: true })
        .getByRole("button", { name: "Quick Quote", exact: true })
        .click();
    await expect(
      page.getByText(
        mismatch === "ordinary-addressed"
          ? /ordinary reply unexpectedly/
          : /native addressed target did not match/,
      ),
    ).toBeVisible();
    expect(state.posts).toHaveLength(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveCount(0);
    await info.attach("preparation-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
test("J4.reply-mention-drift: selected UID changing before send refuses without publication", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  state.people = [{ uid: 9, username: "Other author" }];
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/selected mention identity changed before send/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await info.attach("identity-refusal.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const destination of [
  "forum.php?mod=viewthread&tid=42&pid=303&page=1#pid999",
  "forum.php?mod=viewthread&tid=42&pid=303&page=1#unrelated",
])
  test(`J4.reply-callback-conflict: unsupported destination ${destination} does not confirm`, async ({
    page,
  }, info) => {
    const state = await readyReply(page);
    state.response = `<root><![CDATA[<script>succeedhandle_post('${destination}', 'Reply accepted', {});</script>]]></root>`;
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await info.attach("conflicting-result.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
for (const mutation of [
  "new-thread-with-reply",
  "reply-with-post",
  "quote-without-post",
])
  test(`J5.reply-action-binding: ${mutation} recovery cannot silently retarget publication`, async ({
    page,
  }, info) => {
    await fixture(page);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await expect(
      page.getByText(/Recovery acknowledged for revision/),
    ).toBeVisible();
    await page.evaluate((mutation) => {
      const key = "tsdm.workspace.recovery",
        record = JSON.parse(sessionStorage.getItem(key)!);
      const writing = record.writing;
      if (mutation === "new-thread-with-reply") writing.action = "new-thread";
      if (mutation === "reply-with-post") writing.replyTarget.postId = "101";
      if (mutation === "quote-without-post") writing.action = "quick-quote";
      sessionStorage.setItem(key, JSON.stringify(record));
    }, mutation);
    await page.reload();
    await expect(
      page
        .getByText(/cannot be safely restored|incompatible|unrecognized/i)
        .first(),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveCount(0);
    await info.attach("action-binding.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J4.reply-merged-comparison: preserve known complete before and full observed merged source through recovery without fabricated confirmation", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.priorSource = "Original [quote]prior content[/quote] complete.";
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  state.sourceChange = (body) =>
    state.posts.length
      ? body.replace(
          escape(source),
          escape(
            state.priorSource! + "\nNative supplement boundary\n" + source,
          ),
        )
      : body;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Check result", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Complete source before sending", { exact: true }),
  ).toHaveValue(state.priorSource);
  await expect(
    page.getByLabel("Complete observed result source", { exact: true }),
  ).toHaveValue(state.priorSource + "\nNative supplement boundary\n" + source);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await page.reload();
  await expect(
    page.getByLabel("Complete source before sending", { exact: true }),
  ).toHaveValue(state.priorSource);
  expect(state.posts).toHaveLength(1);
  await info.attach("merge-comparison.png", {
    body: await page
      .getByRole("status")
      .filter({ hasText: "Reply source comparison" })
      .screenshot(),
    contentType: "image/png",
  });
});
test("J4.reply-prior-drift: known existing source changed after review prevents sending", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.priorSource = "Original prior source";
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  state.priorSource = "Changed prior source";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/previously observed post changed before send/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await info.attach("prior-drift.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const mutation of [
  "observed-actor",
  "baseline-actor",
  "invented-before",
  "baseline-thread",
])
  test(`J5.reply-comparison-binding: ${mutation} recovery is rejected`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.priorSource = "Original prior source";
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByLabel("Complete source before sending", { exact: true }),
    ).toHaveValue(state.priorSource);
    await page.evaluate((mutation) => {
      const key = "tsdm.workspace.recovery",
        record = JSON.parse(sessionStorage.getItem(key)!);
      const attempt = record.writing.attempts[0];
      if (mutation === "observed-actor")
        attempt.replyComparison.observed.account.id = "8";
      if (mutation === "baseline-actor")
        attempt.publication.replyBefore.owned[0].writing.account.id = "8";
      if (mutation === "invented-before")
        attempt.replyComparison.before.source = "Invented prior source";
      if (mutation === "baseline-thread")
        attempt.publication.replyBefore.pageURL =
          attempt.publication.replyBefore.pageURL.replace("tid=42", "tid=43");
      sessionStorage.setItem(key, JSON.stringify(record));
    }, mutation);
    await page.reload();
    await expect(page.getByText(/incompatible/i).first()).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await info.attach("comparison-binding.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

for (const [
  language,
  closeLabel,
  sourceLabel,
  reviewLabel,
  sendLabel,
  confirmation,
] of [
  ["zh-CN", "关闭", "完整源码", "检查发布", "发送回复", "已确认储存回复"],
  ["zh-TW", "關閉", "完整原始碼", "檢查發佈", "傳送回覆", "已確認儲存回覆"],
] as const)
  test(`J4.reply-localization-${language}: reply confirmation follows interface language and preserves source`, async ({
    page,
  }, info) => {
    await fixture(page);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption(language);
    await page.getByRole("button", { name: closeLabel, exact: true }).click();
    await page.getByLabel(sourceLabel, { exact: true }).fill(source);
    await page.getByRole("button", { name: reviewLabel, exact: true }).click();
    await page.getByRole("button", { name: sendLabel, exact: true }).click();
    await expect(page.getByText(new RegExp(confirmation))).toBeVisible();
    await expect(page.getByLabel(sourceLabel, { exact: true })).toHaveValue(
      source,
    );
    await info.attach("localized-reply.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J4.reply-mention-context: replacing writing while lookup is pending clears transient lookup and ignores old people", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.mentionGate = new Promise<void>((resolve) => (release = resolve));
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await expect
    .poll(() =>
      state.requests.some((r) => new URL(r.url).pathname === "/plugin.php"),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("article", { name: "Post 101", exact: true })
    .getByRole("button", { name: "Quick Quote", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Addressed to Other author · Post 101", { exact: true }),
  ).toBeVisible();
  release();
  state.mentionGate = null;
  await expect(
    page.getByRole("button", { name: "Find mention", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "Mention Other author (UID 8)",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "@\u2063Other author\u2063 ",
  );
  expect(state.posts).toHaveLength(0);
  await info.attach("mention-context.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

// Independently authored examples of the bounded native observation; no live data.
const supplementBefore = "Original [unknown]complete prior[/unknown].";
const supplementSubmitted =
  "[quote]Additional own source[/quote]\nLiteral @Writer 7 stays. @\u2063Writer 7\u2063 ";
const supplementStored =
  "Original [unknown]complete prior[/unknown].\n\n[hr]\n[b]Writer 7 补充了以下内容 (2026-10-22 10:26)[/b]\n[quote]Additional own source[/quote]\nLiteral @Writer 7 stays. [url=home.php?mod=space&uid=7]@Writer 7[/url] ";
async function readySupplement(page: Page) {
  const state = await fixture(page);
  state.priorSource = supplementBefore;
  state.people = [{ uid: 7, username: "Writer 7" }];
  await page
    .getByRole("article", { name: "Post 101", exact: true })
    .getByRole("button", { name: "Quick Quote", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[quote]Additional own source[/quote]\nLiteral @Writer 7 stays. ");
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Writer 7");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Writer 7 (UID 7)", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    supplementSubmitted,
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  return state;
}
test("J4.reply-native-supplement: reload original uncertainty then GET-only compare full prior and transformed submission without losing newer writing", async ({
  page,
}, info) => {
  const state = await readySupplement(page);
  state.mode = "lost";
  state.sourceChange = (body) =>
    state.posts.length
      ? body.replace(escape(supplementSubmitted), escape(supplementStored))
      : body;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/response was lost/)).toBeVisible();
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Newer unsent writing");
  await page.reload();
  const requestsBefore = state.requests.length;
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${threadURL}&page=1#pid303`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Newer unsent writing",
  );
  const checked = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  expect(checked.id).toBe(original.id);
  expect(checked.publication).toEqual(original.publication);
  expect(checked.replyComparison.before.source).toBe(supplementBefore);
  expect(checked.replyComparison.observed.source).toBe(supplementStored);
  expect(
    state.requests.slice(requestsBefore).every((r) => r.method === "GET"),
  ).toBe(true);
  expect(state.posts).toHaveLength(1);
  await page.reload();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await info.attach("qualified-supplement.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        checked,
        requests: state.requests.slice(requestsBefore),
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("qualified-supplement.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const [name, stored] of [
  [
    "prior-altered",
    supplementStored.replace("complete prior", "changed prior"),
  ],
  ["prior-missing", supplementStored.slice(supplementBefore.length + 2)],
  ["prior-repeated", supplementBefore + supplementStored],
  ["submitted-missing", supplementStored.replace("Additional own source", "")],
  [
    "submitted-repeated",
    supplementStored + "[quote]Additional own source[/quote]",
  ],
  ["extra-suffix", supplementStored + "Unexpected extra"],
  [
    "wrong-name",
    supplementStored.replace("@Writer 7[/url]", "@Writer 8[/url]"),
  ],
  ["wrong-uid", supplementStored.replace("uid=7", "uid=8")],
  ["wrong-actor", supplementStored.replace("[b]Writer 7", "[b]Writer 8")],
  ["wrong-date", supplementStored.replace("2026-10-22", "2026-02-30")],
  ["wrong-time", supplementStored.replace("10:26", "24:26")],
  ["unknown-delimiter", supplementStored.replace("[hr]", "[hr /]")],
  [
    "ordinary-at-converted",
    supplementStored.replace(
      "Literal @Writer 7",
      "Literal [url=home.php?mod=space&uid=7]@Writer 7[/url]",
    ),
  ],
  [
    "marker-retained-in-merge",
    supplementStored.replace(
      "[url=home.php?mod=space&uid=7]@Writer 7[/url]",
      "@\u2063Writer 7\u2063",
    ),
  ],
] as const)
  test(`J4.reply-native-boundary: ${name} stays uncertain`, async ({
    page,
  }, info) => {
    const state = await readySupplement(page);
    state.sourceChange = (body) =>
      state.posts.length
        ? body.replace(escape(supplementSubmitted), escape(stored))
        : body;
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
    await expect(
      page.getByLabel("Complete observed result source", { exact: true }),
    ).toHaveValue(stored);
    expect(state.posts).toHaveLength(1);
    await info.attach("bounded-source.json", {
      body: Buffer.from(
        JSON.stringify({
          name,
          before: supplementBefore,
          submitted: supplementSubmitted,
          stored,
        }),
      ),
      contentType: "application/json",
    });
  });
for (const mismatch of ["options", "actor", "post", "thread", "account"])
  test(`J4.reply-native-identity: ${mismatch} stays uncertain`, async ({
    page,
  }, info) => {
    const state = await readySupplement(page);
    state.sourceChange = (body) => {
      if (!state.posts.length) return body;
      let result = body.replace(
        escape(supplementSubmitted),
        escape(supplementStored),
      );
      if (mismatch === "options")
        result = result.replace('value="1" checked', 'value="1"');
      if (mismatch === "account")
        result = result.replace('uid=7">Writer 7', 'uid=8">Writer 8');
      return result;
    };
    state.threadChange = (body) =>
      !state.posts.length
        ? body
        : mismatch === "actor"
          ? body.replace(
              'uid=7">Writer 7</a></div><a id="postnum303"',
              'uid=8">Writer 8</a></div><a id="postnum303"',
            )
          : mismatch === "post"
            ? body.replaceAll("303", "304")
            : body;
    if (mismatch === "thread")
      state.response =
        "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=43&pid=303#pid303','Accepted',{});</script>]]></root>";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await info.attach("identity-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

for (const suffix of [
  " @\u2063Unselected person\u2063",
  " @\u2063Writer 7",
  " @\u2064Writer 7\u2064",
])
  test(`J4.reply-native-markers: unqualified marker ${JSON.stringify(suffix)} stays uncertain`, async ({
    page,
  }, info) => {
    const state = await readySupplement(page);
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(supplementSubmitted + suffix);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeVisible();
    state.sourceChange = (body) =>
      state.posts.length
        ? body.replace(
            escape(supplementSubmitted + suffix),
            escape(supplementStored + suffix),
          )
        : body;
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await info.attach("unqualified-marker.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J4.reply-native-person-link: a new reply preserves complete source with selected marker converted and raw at-text unchanged", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.people = [{ uid: 7, username: "Writer 7" }];
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Literal @Writer 7. ");
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Writer 7");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Writer 7 (UID 7)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  state.sourceChange = (body) =>
    state.posts.length
      ? body.replace(
          escape("Literal @Writer 7. @\u2063Writer 7\u2063 "),
          escape(
            "Literal @Writer 7. [url=home.php?mod=space&uid=7]@Writer 7[/url] ",
          ),
        )
      : body;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await page.reload();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await info.attach("selected-person-link.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const locale of [
  {
    language: "en",
    close: "Close",
    source: "Complete source",
    review: "Review publication",
    send: "Send reply",
    summary:
      /^Review reply revision \d+ for Writer 7 in thread 42 \(Music\)\. Sending may add a reply or merge it into an existing post\.$/,
    addressed: "Addressed to Other author · Post 101",
  },
  {
    language: "zh-CN",
    close: "关闭",
    source: "完整源码",
    review: "检查发布",
    send: "发送回复",
    summary:
      /^检查 Writer 7 在 Music 版块主题 42 中的回复修订 \d+。发送可能新增回复，也可能合并到已有帖子。$/,
    addressed: "回复对象：Other author · 帖子 101",
  },
  {
    language: "zh-TW",
    close: "關閉",
    source: "完整原始碼",
    review: "檢查發佈",
    send: "傳送回覆",
    summary:
      /^檢查 Writer 7 在 Music 版塊主題 42 中的回覆修訂 \d+。傳送可能新增回覆，也可能合併到已有帖子。$/,
    addressed: "回覆對象：Other author · 帖子 101",
  },
] as const)
  for (const addressed of [false, true])
    test(`J4.reply-review-${locale.language}-${addressed ? "addressed" : "ordinary"}: review describes the reply target and possible merge before sending`, async ({
      page,
    }, info) => {
      const state = await fixture(page);
      if (addressed)
        await page
          .getByRole("article", { name: "Post 101", exact: true })
          .getByRole("button", { name: "Quick Quote", exact: true })
          .click();
      else
        await page
          .getByRole("button", { name: "Reply to thread", exact: true })
          .click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(locale.language);
      await page
        .getByRole("button", { name: locale.close, exact: true })
        .click();
      await page.getByLabel(locale.source, { exact: true }).fill(source);
      await page
        .getByRole("button", { name: locale.review, exact: true })
        .click();
      const review = page.getByRole("alert").filter({
        has: page.getByRole("button", { name: locale.send, exact: true }),
      });
      await expect(review.locator("p")).toHaveText(locale.summary);
      if (addressed)
        await expect(
          page.getByText(locale.addressed, { exact: true }),
        ).toBeVisible();
      expect(state.posts).toHaveLength(0);
      await review.scrollIntoViewIfNeeded();
      await info.attach("reply-action-review.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });

for (const addressed of [false, true])
  test(`J5.editor-shared-${addressed ? "quote" : "reply"}: ordinary visual formatting preserves source and selected reply target through saved readback`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    if (addressed)
      await page
        .getByRole("article", { name: "Post 101", exact: true })
        .getByRole("button", { name: "Quick Quote", exact: true })
        .click();
    else
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
    const complete = page.getByLabel("Complete source", { exact: true });
    await complete.fill(source + " formatted");
    await complete.evaluate((element) => {
      const field = element as HTMLTextAreaElement;
      field.setSelectionRange(field.value.length - 9, field.value.length);
      field.dispatchEvent(new Event("select", { bubbles: true }));
    });
    await page
      .getByRole("button", { name: "Apply formatting", exact: true })
      .click();
    await expect(
      page
        .getByRole("textbox", { name: "Visual post content", exact: true })
        .getByText("formatted", { exact: true }),
    ).toHaveCSS("font-weight", "700");
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    const expected = source + " [b]formatted[/b]";
    await expect(complete).toHaveValue(expected);
    await page
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(complete).toHaveValue(expected);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]!.get("message")).toBe(expected);
    expect(state.posts[0]!.get("reppost")).toBe(addressed ? "101" : null);
    expect(state.posts[0]!.get("noticeauthor")).toBe(
      addressed ? "OPAQUE-AUTHOR-8" : null,
    );
    expect(
      state.requests.some(
        (request) =>
          new URL(request.url).searchParams.get("action") === "edit" &&
          new URL(request.url).searchParams.get("pid") === "303",
      ),
    ).toBe(true);
    await info.attach("shared-editor-reply.json", {
      body: Buffer.from(
        JSON.stringify({
          addressed,
          posts: state.posts.map((post) => [...post]),
          requests: state.requests,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach("shared-editor-reply.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

for (const attempted of [false, true]) {
  test(`J4.image-writing-recovery-${attempted ? "uncertain" : "local"}: qualified reader image preserves writing and immutable attempt without replay`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.mode = "lost";
    state.threadChange = (body) =>
      body.replace(
        "<p>Existing opening source</p>",
        '<p>Existing opening source</p><ignore_js_op><img id="aimg_88" aid="88" file="forum.php?mod=attachment&amp;aid=image-token&amp;noupdate=yes" zoomfile="forum.php?mod=attachment&amp;aid=image-token&amp;noupdate=yes&amp;nothumb=yes" alt="Recovery image"><div id="aimg_88_menu"><p><strong>fixture.png</strong></p><a href="forum.php?mod=attachment&amp;aid=image-token&amp;nothumb=yes">Download attachment</a></div></ignore_js_op>',
      );
    await page
      .getByRole("button", { name: "Refresh thread", exact: true })
      .click();
    await expect(
      page.getByRole("img", { name: "Recovery image", exact: true }),
    ).toHaveAttribute("src", /noupdate=yes/);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    if (attempted) {
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Check result", exact: true }),
      ).toBeVisible();
    }
    const before = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    const count = state.requests.length;
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    const after = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(after.source).toBe(before.source);
    expect(after.selection).toEqual(before.selection);
    expect(after.attempts).toEqual(before.attempts);
    expect(state.posts).toHaveLength(attempted ? 1 : 0);
    expect(
      state.requests.slice(count).filter((r) => r.method !== "GET"),
    ).toEqual([]);
    await info.attach("image-writing-recovery.json", {
      body: Buffer.from(
        JSON.stringify({ before, after, requests: state.requests }),
      ),
      contentType: "application/json",
    });
    await info.attach("image-writing-recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

// Read-only native edit forms retain empty replacement sentinels; no replacement command.
async function dormantSnapshotJourney(page: Page, merged: boolean) {
  const state = await fixture(page);
  state.priorSource = merged ? "Prior complete [attach]77[/attach]" : null;
  state.sourceChange = (body) => {
    if (merged && state.posts.length)
      body = body.replace(
        escape(source),
        escape(state.priorSource + "\nNative supplement boundary\n" + source),
      );
    return (
      body +
      '<div id="e_attachlist"><input type="hidden" name="attachupdate[77]" value=""><input name="attachnew[77][description]" value="Retained image"><select name="attachnew[77][readperm]"><option value="0" selected>Everyone</option></select><input name="attachnew[77][price]" value="0"></div>'
    );
  };
  if (merged)
    await page
      .getByRole("article", { name: "Post 101", exact: true })
      .getByRole("button", { name: "Quick Quote", exact: true })
      .click();
  else
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  if (merged)
    await expect(
      page.getByLabel("Complete source before sending", { exact: true }),
    ).toHaveValue(state.priorSource!);
  else await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  return state;
}
for (const merged of [false, true]) {
  test(`J4.reply-snapshot-recovery-${merged ? "merged-quote" : "confirmed"}: retain decoder-produced dormant controls and immutable evidence without replay`, async ({
    page,
  }, info) => {
    const state = await dormantSnapshotJourney(page, merged);
    const before = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(
      before.attempts[0].replyComparison.observed.attachmentFields,
    ).toContainEqual({ name: "attachupdate[77]", value: "", disabled: false });
    expect(before.attempts[0].status).toBe(merged ? "uncertain" : "confirmed");
    const count = state.requests.length;
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    const after = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
    expect(after.attempts).toEqual(before.attempts);
    expect(after.selection).toEqual(before.selection);
    expect(state.posts).toHaveLength(1);
    expect(state.requests).toHaveLength(count);
    if (merged)
      await expect(
        page.getByLabel("Complete observed result source", { exact: true }),
      ).toHaveValue(
        state.priorSource + "\nNative supplement boundary\n" + source,
      );
    await info.attach("snapshot-recovery.json", {
      body: Buffer.from(
        JSON.stringify({ before, after, requests: state.requests }),
      ),
      contentType: "application/json",
    });
    await info.attach("snapshot-recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
for (const mutation of [
  "nonempty",
  "invalid-id",
  "unassociated",
  "missing-metadata",
  "duplicate",
  "arbitrary-name",
  "wrong-action",
  "actor",
  "board",
  "target",
  "before-identity",
  "active-sentinel",
  "submitted-sentinel",
]) {
  test(`J4.reply-snapshot-hostile-${mutation}: read-only allowance cannot create command authority or unbound evidence`, async ({
    page,
  }, info) => {
    const state = await dormantSnapshotJourney(page, true);
    const rejected = await page.evaluate((mutation) => {
      const key = "tsdm.workspace.recovery",
        record = JSON.parse(sessionStorage.getItem(key)!);
      const attempt = record.writing.attempts[0],
        observed = attempt.replyComparison.observed;
      const sentinel = observed.attachmentFields.find(
        (f: { name: string }) => f.name === "attachupdate[77]",
      );
      if (mutation === "nonempty") sentinel.value = "replace";
      if (mutation === "invalid-id") sentinel.name = "attachupdate[0]";
      if (mutation === "unassociated") sentinel.name = "attachupdate[78]";
      if (mutation === "missing-metadata")
        observed.attachmentFields = [sentinel];
      if (mutation === "duplicate")
        observed.attachmentFields.push({ ...sentinel });
      if (mutation === "arbitrary-name") sentinel.name = "deleteattach[77]";
      if (mutation === "wrong-action") observed.action = "edit-post";
      if (mutation === "actor") observed.account.id = "9";
      if (mutation === "board") observed.board.id = "6";
      if (mutation === "target") observed.replyTarget.threadId = "43";
      if (mutation === "before-identity")
        attempt.replyComparison.before.source += " hostile drift";
      if (mutation === "active-sentinel")
        record.writing.attachmentFields = [{ ...sentinel }];
      if (mutation === "submitted-sentinel")
        attempt.publication.submission.writing.attachmentFields = [
          { ...sentinel },
        ];
      const raw = JSON.stringify(record);
      sessionStorage.setItem(key, raw);
      return raw;
    }, mutation);
    const count = state.requests.length;
    await page.reload();
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBe(rejected);
    expect(state.posts).toHaveLength(1);
    expect(state.requests).toHaveLength(count);
    await info.attach("snapshot-hostile-record.json", {
      body: Buffer.from(rejected),
      contentType: "application/json",
    });
    await info.attach("snapshot-hostile.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

const quoteSupplementStored =
  "Original [unknown]complete prior[/unknown].\n\n[quote][b]Writer 7 补充了以下内容 (2026-10-28 13:56)[/b]\n[quote]Additional own source[/quote]\nLiteral @Writer 7 stays. [url=home.php?mod=space&uid=7]@Writer 7[/url] [/quote]";
for (const [name, stored, confirmed] of [
  ["complete", quoteSupplementStored, true],
  [
    "wrong-actor",
    quoteSupplementStored.replace("[b]Writer 7", "[b]Writer 8"),
    false,
  ],
  [
    "wrong-date",
    quoteSupplementStored.replace("2026-10-28", "2026-02-30"),
    false,
  ],
  ["wrong-time", quoteSupplementStored.replace("13:56", "24:56"), false],
  [
    "changed-prior",
    quoteSupplementStored.replace("complete prior", "changed prior"),
    false,
  ],
  [
    "missing-prior",
    quoteSupplementStored.slice(supplementBefore.length),
    false,
  ],
  [
    "changed-submission",
    quoteSupplementStored.replace("Additional own source", "Altered source"),
    false,
  ],
  ["extra-text", quoteSupplementStored + "Unexpected suffix", false],
  ["missing-close", quoteSupplementStored.slice(0, -8), false],
  ["extra-close", quoteSupplementStored + "[/quote]", false],
  [
    "wrong-open",
    quoteSupplementStored.replace("\n\n[quote][b]", "\n\n[quote=Writer 7][b]"),
    false,
  ],
  [
    "prior-wrapped",
    "[quote]" + quoteSupplementStored.replace("\n\n[quote]", "\n\n"),
    false,
  ],
  ["options", quoteSupplementStored, false],
  ["missing-prior-attachment", quoteSupplementStored, false],
  ["changed-prior-attachment", quoteSupplementStored, false],
] as const) {
  test(`J4.reply-quote-supplement-${name}: preserve complete prior and submitted source at the native wrapper boundary`, async ({
    page,
  }, info) => {
    const state = await readySupplement(page);
    const attachment =
      '<div id="e_attachlist"><input type="hidden" name="attachupdate[77]" value=""><input name="attachnew[77][description]" value="Retained image"><input name="attachnew[77][price]" value="0"></div>';
    state.sourceChange = (body) => {
      const isAttachmentCase =
        name === "missing-prior-attachment" ||
        name === "changed-prior-attachment";
      if (!state.posts.length)
        return body + (isAttachmentCase ? attachment : "");
      let result = body.replace(escape(supplementSubmitted), escape(stored));
      if (name === "options")
        result = result.replace('value="1" checked', 'value="1"');
      if (name === "changed-prior-attachment")
        result += attachment.replace(
          'value="Retained image"',
          'value="Changed image"',
        );
      return result;
    };
    // Capture the configured prior association before sending, not after review.
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => state.posts.length).toBe(1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
              .writing.attempts[0].status,
        ),
      )
      .not.toBe("pending");
    await info.attach("quote-supplement.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("quote-supplement.json", {
      body: Buffer.from(
        JSON.stringify({
          name,
          stored,
          requests: state.requests,
          posts: state.posts.map((p) => Object.fromEntries(p)),
          recovery: await page.evaluate(() =>
            JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
          ),
        }),
      ),
      contentType: "application/json",
    });
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(supplementSubmitted);
    if (confirmed)
      await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
    else {
      await expect(
        page.getByRole("button", { name: "Check result", exact: true }),
      ).toBeVisible();
      await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
      const before = state.requests.length;
      await page
        .getByRole("button", { name: "Check result", exact: true })
        .click();
      await expect(page.getByText(/Confirmed stored reply/)).toHaveCount(0);
      expect(state.posts).toHaveLength(1);
      expect(
        state.requests.slice(before).every((r) => r.method === "GET"),
      ).toBe(true);
    }
  });
}

test("J5.reply-quote-supplement-recovery: recheck the same uncertain attempt after reload without changing newer writing or resending", async ({
  page,
}, info) => {
  const state = await readySupplement(page);
  state.mode = "lost";
  state.sourceChange = (body) =>
    state.posts.length
      ? body.replace(escape(supplementSubmitted), escape(quoteSupplementStored))
      : body;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/response was lost/)).toBeVisible();
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later local writing remains untouched.");
  await page.reload();
  const requestsBefore = state.requests.length;
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${threadURL}&page=1#pid303`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect.soft(page.getByText(/Confirmed stored reply/)).toBeVisible();
  const checked = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await info.attach("quote-recovered-result.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        checked,
        requests: state.requests.slice(requestsBefore),
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("quote-recovered-result.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(checked.id).toBe(original.id);
  expect(checked.publication).toEqual(original.publication);
  expect(checked.status).toBe("confirmed");
  expect(state.posts).toHaveLength(1);
  expect(
    state.requests.slice(requestsBefore).every((r) => r.method === "GET"),
  ).toBe(true);
  await page.reload();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later local writing remains untouched.",
  );
  expect(state.posts).toHaveLength(1);
});
