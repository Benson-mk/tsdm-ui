import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const fixtureStates = new WeakMap<Page, () => unknown>();
test.afterEach(async ({ page }, info) => {
  const snapshot = fixtureStates.get(page);
  if (snapshot)
    await info.attach("independent-server-state.json", {
      body: Buffer.from(JSON.stringify(snapshot(), null, 2)),
      contentType: "application/json",
    });
  if (info.status !== info.expectedStatus)
    await info.attach("failure.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});
const origin = "https://www.tsdm39.com";
const url = `${origin}/forum.php?mod=viewthread&tid=42`;
const original =
  "[unfamiliar=x]Original & <literal>[/unfamiliar] [attach]77[/attach]";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
async function fixture(page: Page) {
  const state = {
    source: original,
    reply: false,
    extraHidden: "",
    externalAttachments: false,
    attachmentReadperm: "10",
    implicitAttachmentValue: false,
    explicitEmptyAttachmentValue: false,
    mentionAvailable: true,
    mentionId: "88",
    mentionLookups: 0,
    mentionSourceChangeAt: 0,
    mentionAccountChangeAt: 0,
    convertMention: false,
    title: "Owned thread",
    member: "7",
    actor: "7",
    price: "3",
    attachmentDescription: "Unchanged attachment",
    unavailable: false,
    outcome: "accepted",
    response: null as string | null,
    afterPost: () => {},
    posts: [] as URLSearchParams[],
    postURLs: [] as string[],
    reads: [] as string[],
    gate: null as Promise<void> | null,
  };
  fixtureStates.set(page, () => ({
    ...state,
    posts: state.posts.map((post) => [...post]),
    gate: state.gate ? "controlled" : null,
  }));
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      u = new URL(request.url());
    if (u.pathname === "/__fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__fixture.js"></script></body></html>`,
      });
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
    const board = `<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>`;
    if (
      u.pathname === "/plugin.php" &&
      u.searchParams.get("id") === "atplus:search"
    ) {
      state.mentionLookups++;
      if (state.mentionSourceChangeAt === state.mentionLookups)
        state.source = original + " server during lookup";
      if (state.mentionAccountChangeAt === state.mentionLookups)
        state.member = "9";
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: 1,
          list: [{ uid: state.mentionId, username: "SelectedPerson" }],
        }),
      });
    }
    if (request.method() === "POST") {
      const sent = new URLSearchParams(request.postData() ?? "");
      state.posts.push(sent);
      state.postURLs.push(u.href);
      state.source = sent.get("message")!;
      if (state.convertMention)
        state.source = state.source.replaceAll(
          "@\u2063SelectedPerson\u2063",
          "[url=home.php?mod=space&uid=88]@SelectedPerson[/url]",
        );
      if (sent.has("attachnew[77][readperm]"))
        state.attachmentReadperm = sent.get("attachnew[77][readperm]")!;
      state.title = sent.get("subject") ?? state.title;
      if (state.gate) await state.gate;
      if (state.outcome === "lost") return route.abort();
      state.afterPost();
      return route.fulfill({
        contentType: "text/xml; charset=utf-8",
        body:
          state.response ??
          `<root><![CDATA[<script>succeedhandle_post('${state.outcome === "moderation" ? "" : url}', '${state.outcome === "moderation" ? "需要审核" : "Saved"}', {});</script>]]></root>`,
      });
    }
    state.reads.push(u.href);
    let body = account + board;
    if (u.searchParams.get("action") === "edit")
      body += `<form id="postform" method="post" action="forum.php?mod=post&action=edit&fid=5&tid=42&pid=101&editsubmit=yes"><input type="hidden" name="formhash" value="PRIVATE"><input type="hidden" name="posttime" value="1">${state.extraHidden}${state.reply ? "" : `<input name="subject" value="${escape(state.title)}">`}${state.unavailable ? "<p>Rendered only</p>" : `<textarea name="message">${escape(state.source)}</textarea>`}<input name="price" value="${state.price}" disabled><select name="readperm" disabled><option value="10" selected>Members</option></select><input name="attachnew[77][description]" type="hidden" value="${escape(state.attachmentDescription)}"><input name="usesig" type="checkbox" value="1" checked><button type="submit" name="editsubmit" value="yes">Save</button></form>`;
    else if (u.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="forum.php?mod=forumdisplay&fid=5">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Owned thread</a></th></tr></tbody></table>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">${escape(state.title)}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${state.actor}">Writer ${state.actor}</a></div><a id="postnum101"><em>${state.reply ? "2" : "1"}</em>#</a><div class="pcb">Rendered representation is not source</div></div></div>`;
    if (state.externalAttachments && u.searchParams.get("action") === "edit") {
      body = body.replace(
        /<input name="attachnew\[77\]\[description\]"[^>]+>/,
        "",
      );
      body += `<div id="e_attachlist"><input type="hidden" name="attachupdate[77]" value=""><input name="attachnew[77][description]" value="${escape(state.attachmentDescription)}"><select name="attachnew[77][readperm]"><option ${state.implicitAttachmentValue ? "" : `value="${escape(state.attachmentReadperm)}"`} selected>${state.implicitAttachmentValue || state.explicitEmptyAttachmentValue ? escape(state.attachmentReadperm || "Everyone") : "Members"}</option></select><input name="attachnew[77][price]" value="2"></div><div id="e_imgattachlist"></div>`;
    }
    if (state.mentionAvailable && u.searchParams.get("action") === "edit")
      body +=
        '<script>window.ATPLUS={"api":"/plugin.php?id=atplus:search","login":1,"use":1};</script>';
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(url);
  return state;
}
async function open(page: Page) {
  await page
    .getByRole("button", { name: "Edit post 101", exact: true })
    .click();
  await expect(
    page.getByLabel("Complete source", { exact: true }),
  ).toBeVisible();
}
async function review(page: Page) {
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
}
async function save(page: Page) {
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
}
test("J4.edit-preservation: save actual complete owned source with disabled settings and references intact", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original,
  );
  await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
    "3",
  );
  await expect(page.getByLabel("Thread price", { exact: true })).toBeDisabled();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " edited");
  await review(page);
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.source).toBe(original + " edited");
  expect(state.posts[0]!.get("attachnew[77][description]")).toBe(
    "Unchanged attachment",
  );
  expect(state.posts[0]!.has("price")).toBe(false);
  expect(state.price).toBe("3");
  expect(
    state.reads.filter((v) => v.includes("action=edit")).length,
  ).toBeGreaterThanOrEqual(4);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).not.toContain("PRIVATE");
  await info.attach("edit.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("edit-state.json", {
    body: Buffer.from(
      JSON.stringify({ ...state, posts: state.posts.map((v) => [...v]) }),
    ),
    contentType: "application/json",
  });
});
test("J5.edit-conflict: retain local revision and show latest source/options/references before deliberate overwrite", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  state.source = original + " server";
  await review(page);
  await expect(
    page.getByLabel("Latest server source", { exact: true }),
  ).toHaveValue(original + " server");
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  expect(state.posts).toHaveLength(0);
  await page
    .getByRole("button", { name: "Save my version", exact: true })
    .click();
  await expect(
    page.getByText(/may overwrite the latest server changes/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Accept overwrite and review", exact: true })
    .click();
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.source).toBe(original + " local");
  expect(state.posts).toHaveLength(1);
  await info.attach("conflict.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("conflict-state.json", {
    body: Buffer.from(
      JSON.stringify({
        source: state.source,
        posts: state.posts.map((v) => [...v]),
      }),
    ),
    contentType: "application/json",
  });
});
test("J5.edit-reload: protect local source on reload and restore edit identity without replay", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  state.source = original + " server";
  await review(page);
  await page
    .getByRole("button", { name: "Reload latest", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep local writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  await page
    .getByRole("button", { name: "Reload latest", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard local changes and reload latest",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " server",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Edit post 101", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " server",
  );
  expect(state.posts).toHaveLength(0);
  await info.attach("reload.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.edit-capability: unavailable complete source blocks preparation while preserving local writing", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  state.unavailable = true;
  await review(page);
  await expect(
    page.getByText(
      /Actual current source, options or original account are unavailable/,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  expect(state.posts).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Save edited post", exact: true }),
  ).toHaveCount(0);
  await info.attach("capability.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.edit-newer-revision: confirmation applies to submitted revision without clearing later local text", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " submitted");
  let release = () => {};
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await review(page);
  await save(page);
  await expect.poll(() => state.posts.length).toBe(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " newer");
  release();
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " newer",
  );
  expect(state.source).toBe(original + " submitted");
  await review(page);
  await expect(
    page.getByRole("button", { name: "Save edited post", exact: true }),
  ).toBeVisible();
  await info.attach("newer-revision.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J4.edit-result-single-navigation: one confirmed-result click returns from its board without losing newer source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " submitted");
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await review(page);
  await save(page);
  await expect.poll(() => state.posts.length).toBe(1);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " newer");
  release();
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const beforeBoard = state.reads.length;
  const boardHistoryBefore = await page.evaluate(() => history.length);
  await page
    .getByRole("region", { name: "Thread reading", exact: true })
    .getByRole("link", { name: "Music", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Thread results", exact: true }),
  ).toBeVisible();
  const boardReads = state.reads.slice(beforeBoard);
  expect.soft(boardReads).toHaveLength(1);
  expect.soft(boardReads[0]).toContain("mod=forumdisplay&fid=5");
  expect
    .soft((await page.evaluate(() => history.length)) - boardHistoryBefore)
    .toBe(1);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  const before = state.reads.length;
  const historyBefore = await page.evaluate(() => history.length);
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  const readerRequests = state.reads.slice(before);
  const historyAfter = await page.evaluate(() => history.length);
  expect.soft(readerRequests).toHaveLength(1);
  expect.soft(readerRequests[0]).toContain("mod=viewthread&tid=42");
  expect.soft(historyAfter - historyBefore).toBe(1);
  const beforeReturn = state.reads.length;
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " newer",
  );
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.reads).toHaveLength(beforeReturn);
  expect(state.posts).toHaveLength(1);
  expect(state.source).toBe(original + " submitted");
  await info.attach("edit-result-navigation.json", {
    body: Buffer.from(
      JSON.stringify({
        boardReads,
        readerRequests,
        historyBefore,
        historyAfter,
        returnRequests: state.reads.slice(beforeReturn),
        submittedSource: state.posts[0]!.get("message"),
        retainedSource: await page
          .getByLabel("Complete source", { exact: true })
          .inputValue(),
        commands: state.posts.length,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("edit-result-navigation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
for (const outcome of ["lost", "moderation"]) {
  test(`J4.edit-uncertainty-${outcome}: no replay and original saved post remains independently checkable`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await open(page);
    state.outcome = outcome;
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " saved");
    await review(page);
    await save(page);
    await expect(
      page.getByText(
        outcome === "lost" ? /edit response was lost/ : /pending moderation/i,
      ),
    ).toBeVisible();
    expect(state.posts).toHaveLength(1);
    await page.reload();
    expect(state.posts).toHaveLength(1);
    await page
      .getByRole("button", { name: "Check result", exact: true })
      .click();
    if (outcome === "moderation") {
      await expect(page.getByText(/Moderation remains pending/)).toBeVisible();
      await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(0);
    } else {
      await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
      await review(page);
      await expect(
        page.getByRole("button", { name: "Save edited post", exact: true }),
      ).toBeVisible();
    }
    expect(state.posts).toHaveLength(1);
    await info.attach(`uncertainty-${outcome}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
test("J11.edit-ownership: a changed post author blocks save before any mutation", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  state.actor = "9";
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  await review(page);
  await expect(
    page.getByText(
      /Actual current source, options or original account are unavailable/,
    ),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await info.attach("ownership.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.edit-attachment-metadata: changed server attachment metadata is shown as conflict", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  state.attachmentDescription = "Server changed description";
  await review(page);
  await expect(
    page.getByRole("heading", { name: "Latest server version", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Server changed description/)).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await info.attach("attachment-conflict.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J4.edit-reply-source: edit an owned reply without inventing an opening-post title", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.reply = true;
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " reply edit");
  await review(page);
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.title).toBe("Owned thread");
  expect(state.posts[0]!.has("subject")).toBe(false);
  await info.attach("reply-edit.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.edit-preflight-change: reject server changes after review without sending or losing local source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  await review(page);
  await expect(
    page.getByRole("button", { name: "Save edited post", exact: true }),
  ).toBeVisible();
  state.source = original + " after review";
  await save(page);
  await expect(page.getByText(/server post changed before save/)).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  await review(page);
  await expect(
    page.getByLabel("Latest server source", { exact: true }),
  ).toHaveValue(original + " after review");
  await info.attach("preflight-change.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J11.edit-session-change: pause original-account edits and preserve text", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  state.member = "9";
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " original-account");
  await review(page);
  await expect(
    page.getByText(
      /Actual current source, options or original account are unavailable/,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " original-account",
  );
  expect(state.posts).toHaveLength(0);
  await info.attach("session-change.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J5.edit-manual-reconcile: retain local source while deliberately adopting current effective options", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  state.price = "4";
  await review(page);
  await page
    .getByRole("button", { name: "Reconcile manually", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
    "4",
  );
  await review(page);
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.price).toBe("4");
  expect(state.source).toBe(original + " local");
  expect(state.posts[0]!.has("price")).toBe(false);
  await info.attach("manual-reconcile.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J4.edit-native-attachment-layout: preserve dormant metadata outside the native form", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.externalAttachments = true;
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " preserved");
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " preserved",
  );
  await review(page);
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    "attachupdate[77]": "",
    "attachnew[77][description]": "Unchanged attachment",
    "attachnew[77][readperm]": "10",
    "attachnew[77][price]": "2",
  });
  await info.attach("native-attachment-layout.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("native-attachment-state.json", {
    body: Buffer.from(JSON.stringify([...state.posts[0]!])),
    contentType: "application/json",
  });
});

test("J5.edit-to-new-thread-guard: starting a new thread in the same board requires deliberate edit replacement", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original + " local");
  await page.goto(`${origin}/forum.php?mod=forumdisplay&fid=5`);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await expect(
    page.getByText(/Another writing context is already retained/),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original + " local",
  );
  expect(state.posts).toHaveLength(0);
  await info.attach("edit-new-thread-replacement.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const [name, controls] of [
  ["hidden-target-post", '<input type="hidden" name="pid" value="202">'],
  ["hidden-target-thread", '<input type="hidden" name="tid" value="43">'],
  ["hidden-target-board", '<input type="hidden" name="fid" value="6">'],
  [
    "hidden-target-duplicate",
    '<input type="hidden" name="pid" value="101"><input type="hidden" name="pid" value="202">',
  ],
  ["deletion-control", '<input type="hidden" name="delattachop" value="1">'],
]) {
  test(`J11.edit-${name}: reject effectful or mismatched hidden edit controls without sending`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.extraHidden = controls!;
    if (name!.startsWith("hidden-target")) {
      await page
        .getByRole("button", { name: "Edit post 101", exact: true })
        .click();
      await expect(
        page.getByText(
          /Actual editable source and current options are unavailable/,
        ),
      ).toBeVisible();
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveCount(0);
      expect(state.posts).toHaveLength(0);
      await info.attach(`edit-${name}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      return;
    }
    await open(page);
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " local");
    await review(page);
    await expect(
      page.getByText(
        /Required current form content or attachment references cannot be preserved/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save edited post", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original + " local");
    expect(state.posts).toHaveLength(0);
    await info.attach(`edit-${name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

for (const mode of ["implicit", "explicit-empty"]) {
  test(`J4.edit-attachment-select-${mode}: preserve accepted selected attachment value through an unrelated source edit`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.externalAttachments = true;
    state.implicitAttachmentValue = mode === "implicit";
    state.explicitEmptyAttachmentValue = mode === "explicit-empty";
    state.attachmentReadperm = mode === "implicit" ? "10" : "";
    await open(page);
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " body only");
    await review(page);
    await save(page);
    await expect.poll(() => state.posts.length).toBe(1);
    expect(state.posts[0]!.get("attachnew[77][readperm]")).toBe(
      mode === "implicit" ? "10" : "",
    );
    expect(state.attachmentReadperm).toBe(mode === "implicit" ? "10" : "");
    await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    await info.attach(`attachment-select-${mode}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

async function selectEditMention(page: Page) {
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("SelectedPerson");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Mention SelectedPerson (UID 88)",
      exact: true,
    })
    .click();
}
const existingMentionSource =
  original + " literal @Existing [url=home.php?mod=space&uid=77]@Stored[/url]";
for (const conversion of [false, true]) {
  test(`J4.edit-mention-${conversion ? "unqualified-conversion" : "preserved-source"}: use the selected post capability and preserve whole submitted source`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.source = existingMentionSource;
    state.convertMention = conversion;
    await open(page);
    await page.getByLabel("Complete source", { exact: true }).press("End");
    await selectEditMention(page);
    const submitted = await page
      .getByLabel("Complete source", { exact: true })
      .inputValue();
    expect(submitted).toContain(existingMentionSource);
    expect(submitted).toContain("@\u2063SelectedPerson\u2063");
    await review(page);
    await save(page);
    await expect.poll(() => state.posts.length).toBe(1);
    expect(state.posts[0]!.get("message")).toBe(submitted);
    expect(
      state.reads.some(
        (v) => new URL(v).searchParams.get("action") === "newthread",
      ),
    ).toBe(false);
    expect(state.mentionLookups).toBe(3);
    if (conversion) {
      await expect(
        page.getByText(
          /Complete saved source, options or attachment references are unavailable or differ/,
        ),
      ).toBeVisible();
      await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(0);
      expect(state.source).toBe(
        submitted.replaceAll(
          "@\u2063SelectedPerson\u2063",
          "[url=home.php?mod=space&uid=88]@SelectedPerson[/url]",
        ),
      );
    } else
      await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(submitted);
    await info.attach(`edit-mention-${conversion}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
for (const stage of ["review", "save"]) {
  for (const change of ["identity", "capability", "source", "account"]) {
    test(`J11.edit-mention-${stage}-${change}: revalidate selected identity and current source across asynchronous lookup`, async ({
      page,
    }, info) => {
      const state = await fixture(page);
      await open(page);
      await selectEditMention(page);
      const submitted = await page
        .getByLabel("Complete source", { exact: true })
        .inputValue();
      if (stage === "save") {
        await review(page);
        await expect(
          page.getByRole("button", { name: "Save edited post", exact: true }),
        ).toBeVisible();
      }
      if (change === "identity") state.mentionId = "89";
      if (change === "capability") state.mentionAvailable = false;
      if (change === "source")
        state.mentionSourceChangeAt = stage === "review" ? 2 : 3;
      if (change === "account")
        state.mentionAccountChangeAt = stage === "review" ? 2 : 3;
      if (stage === "review") await review(page);
      else await save(page);
      await expect(
        page.getByText(
          change === "source"
            ? /server post changed/i
            : /selected mention identity changed/i,
        ),
      ).toBeVisible();
      expect(state.posts).toHaveLength(0);
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(submitted);
      await expect(
        page.getByRole("button", { name: "Save edited post", exact: true }),
      ).toHaveCount(0);
      await info.attach(`edit-mention-${stage}-${change}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });
  }
}
test("J11.edit-mention-lookup-account: a changed session during initial lookup retains source without inserting a person", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.mentionAccountChangeAt = 1;
  await open(page);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("SelectedPerson");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await expect(
    page.getByText(/account changed during mention lookup/),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original,
  );
  expect(state.posts).toHaveLength(0);
  await info.attach("edit-mention-lookup-account.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-shared-edit: ordinary visual formatting preserves owned unknown source, references and disabled settings through independent save", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await open(page);
  const complete = page.getByLabel("Complete source", { exact: true });
  await complete.fill(original + " formatted");
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
  const expected = original + " [b]formatted[/b]";
  await expect(complete).toHaveValue(expected);
  await review(page);
  await save(page);
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.source).toBe(expected);
  expect(state.posts[0]!.get("attachnew[77][description]")).toBe(
    "Unchanged attachment",
  );
  expect(state.posts[0]!.has("price")).toBe(false);
  expect(state.price).toBe("3");
  expect(
    state.reads.filter((value) => value.includes("action=edit")).length,
  ).toBeGreaterThanOrEqual(4);
  await info.attach("shared-editor-edit.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

// Proposed append to tests/e2e/edit-post.spec.ts. Existing full-app fixture only.
// No product module calls or application/recovery injection. Not browser-executed.
for (const scenario of [
  { name: "same-destination-single", attempts: 1, viaBoard: false },
  { name: "same-destination-earlier", attempts: 2, viaBoard: false },
  { name: "different-destination-control", attempts: 1, viaBoard: true },
]) {
  test(`J4.result-link-transition-${scenario.name}: confirmed link reveals reading while preserving writing`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await open(page);
    for (let index = 0; index < scenario.attempts; index++) {
      await page
        .getByLabel("Complete source", { exact: true })
        .fill(original + ` saved ${index + 1}`);
      await review(page);
      await save(page);
      await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(
        index + 1,
      );
    }
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " retained newer writing");
    if (scenario.viaBoard) {
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await page
        .getByRole("region", { name: "Thread reading", exact: true })
        .getByRole("link", { name: "Music", exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Thread results", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
    }
    const links = page.getByRole("link", {
      name: "Open confirmed thread",
      exact: true,
    });
    await expect(links).toHaveCount(scenario.attempts);
    const link = links.first();
    const chosenHref = await link.getAttribute("href");
    const readBefore = state.reads.length;
    const commandBefore = state.posts.length;
    const historyBefore = await page.evaluate(() => history.length);
    const snapshot = () =>
      page.evaluate(() => {
        const record = JSON.parse(
          sessionStorage.getItem("tsdm.workspace.recovery")!,
        );
        const key = new URLSearchParams(location.hash.slice(1)).get(
          "workspace",
        );
        const entry = key ? record.entries[key] : null;
        return {
          destination: entry?.destination ?? null,
          target:
            entry?.result?.kind === "thread"
              ? entry.result.thread.target
              : null,
          writingSource: record.writing?.source ?? null,
          attempts: record.writing?.attempts ?? [],
        };
      });
    const before = await snapshot();
    await link.click();
    const reader = page.getByRole("article", { name: "Post 101", exact: true });
    // The exact reported symptom: clicking result link must reveal reader UI.
    await expect.soft(reader).toBeVisible({ timeout: 3000 });
    const writingStillVisible = await page
      .getByLabel("Complete source", { exact: true })
      .isVisible();
    const after = await snapshot();
    const reads = state.reads.slice(readBefore);
    const historyAfter = await page.evaluate(() => history.length);
    await info.attach("confirmed-result-transition.json", {
      body: Buffer.from(
        JSON.stringify({
          scenario,
          chosenHref,
          before,
          after,
          writingStillVisible,
          reads,
          historyBefore,
          historyAfter,
          commandsBefore: commandBefore,
          commandsAfter: state.posts.length,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach("confirmed-result-transition.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    expect.soft(after.attempts).toEqual(before.attempts);
    expect.soft(after.writingSource).toBe(before.writingSource);
    expect.soft(state.posts).toHaveLength(commandBefore);
    if (scenario.viaBoard) {
      expect.soft(reads).toHaveLength(1);
      expect.soft(historyAfter - historyBefore).toBe(1);
    } else {
      expect.soft(reads).toEqual([]);
      expect.soft(historyAfter).toBe(historyBefore);
      expect.soft(after.target).toBe("101");
    }
    // Discriminating fallback control, after the failing observation/artifacts.
    if (writingStillVisible) {
      await page
        .getByRole("button", { name: "Return to reading", exact: true })
        .click();
      await expect(reader).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Return to writing", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original + " retained newer writing");
    expect(state.posts).toHaveLength(commandBefore);
  });
}

const nativeEditCallback = (target: string) =>
  `<?xml version="1.0" encoding="utf-8"?>\r\n<root><![CDATA[<script type="text/javascript" reload="1">if(typeof succeedhandle_=='function') {succeedhandle_('${target}', '帖子编辑成功，现在将转入主题页，请稍候……', {'fid':'5','tid':'42','pid':'101'});}</script>]]></root>`;
for (const [name, destination, confirmed] of [
  ["empty-page", "forum.php?mod=viewthread&tid=42&page=&extra=#pid101", true],
  ["absent-page", "forum.php?mod=viewthread&tid=42&extra=#pid101", true],
  [
    "positive-page",
    "forum.php?mod=viewthread&tid=42&page=2&extra=#pid101",
    true,
  ],
  ["zero-page", "forum.php?mod=viewthread&tid=42&page=0&extra=#pid101", false],
  [
    "negative-page",
    "forum.php?mod=viewthread&tid=42&page=-1&extra=#pid101",
    false,
  ],
  [
    "text-page",
    "forum.php?mod=viewthread&tid=42&page=wat&extra=#pid101",
    false,
  ],
  [
    "space-page",
    "forum.php?mod=viewthread&tid=42&page=%20&extra=#pid101",
    false,
  ],
  [
    "duplicate-page",
    "forum.php?mod=viewthread&tid=42&page=&page=1&extra=#pid101",
    false,
  ],
  [
    "duplicate-target",
    "forum.php?mod=viewthread&tid=42&tid=43&page=&extra=#pid101",
    false,
  ],
  [
    "unknown-key",
    "forum.php?mod=viewthread&tid=42&page=&delete=1#pid101",
    false,
  ],
  [
    "external",
    "https://example.test/forum.php?mod=viewthread&tid=42&page=#pid101",
    false,
  ],
  [
    "guard-mismatch",
    "forum.php?mod=viewthread&tid=42&page=&extra=#pid101",
    false,
  ],
  ["extra-code", "forum.php?mod=viewthread&tid=42&page=&extra=#pid101", false],
] as const) {
  test(`J4.edit-native-callback-${name}: use a bounded candidate only to trigger independent saved-post verification`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await open(page);
    state.response = nativeEditCallback(destination);
    if (name === "guard-mismatch")
      state.response = state.response.replace(
        "typeof succeedhandle_",
        "typeof otherhandler",
      );
    if (name === "extra-code")
      state.response = state.response.replace(
        "</script>",
        "window.untrusted=1;</script>",
      );
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " native callback check");
    await review(page);
    let readsAtPost = 0;
    state.afterPost = () => {
      readsAtPost = state.reads.length;
    };
    await save(page);
    await expect.poll(() => state.posts.length).toBe(1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(
              sessionStorage.getItem("tsdm.workspace.recovery")!,
            ).writing.attempts.at(-1).status,
        ),
      )
      .not.toBe("pending");
    await info.attach("native-edit-callback.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("native-edit-callback.json", {
      body: Buffer.from(
        JSON.stringify({
          name,
          response: state.response,
          readsAfterSend: state.reads.slice(readsAtPost),
          posts: state.posts.map((p) => Object.fromEntries(p)),
        }),
      ),
      contentType: "application/json",
    });
    if (confirmed) {
      await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
      expect(state.reads.length).toBeGreaterThan(readsAtPost);
    } else {
      await expect(
        page.getByRole("button", { name: "Check result", exact: true }),
      ).toBeVisible();
      await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(0);
      expect(state.reads).toHaveLength(readsAtPost);
    }
    expect(state.posts).toHaveLength(1);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original + " native callback check");
  });
}
for (const drift of [
  "source",
  "options",
  "attachments",
  "actor",
  "unavailable",
] as const) {
  test(`J4.edit-native-callback-readback-${drift}: native success never substitutes for independent readback`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await open(page);
    state.response = nativeEditCallback(
      "forum.php?mod=viewthread&tid=42&page=&extra=#pid101",
    );
    await page
      .getByLabel("Complete source", { exact: true })
      .fill(original + " submitted edit");
    await review(page);
    let readsAtPost = 0;
    state.afterPost = () => {
      readsAtPost = state.reads.length;
      if (drift === "source") state.source += " changed";
      if (drift === "options") state.price = "9";
      if (drift === "attachments")
        state.attachmentDescription = "Changed metadata";
      if (drift === "actor") state.actor = "8";
      if (drift === "unavailable") state.unavailable = true;
    };
    await save(page);
    await expect.poll(() => state.posts.length).toBe(1);
    await expect(
      page.getByRole("button", { name: "Check result", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed saved post 101/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    await expect.poll(() => state.reads.length).toBeGreaterThan(readsAtPost);
    await info.attach("independent-edit-refusal.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("independent-edit-refusal.json", {
      body: Buffer.from(
        JSON.stringify({
          drift,
          readsAfterSend: state.reads.slice(readsAtPost),
          posts: state.posts.map((p) => Object.fromEntries(p)),
        }),
      ),
      contentType: "application/json",
    });
  });
}
