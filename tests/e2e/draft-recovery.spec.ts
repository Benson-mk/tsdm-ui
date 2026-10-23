import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { WritingContext } from "../../src/workspace/writing";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const draftURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const ownedURL = `${origin}/forum.php?mod=viewthread&tid=84`;
const listURL = `${origin}/home.php?mod=space&do=thread&view=me&type=thread&filter=save`;
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const source = (page: Page) =>
  page.getByLabel("Complete source", { exact: true });
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const snapshots = new WeakMap<Page, () => unknown>();
test.afterEach(async ({ page }, info) => {
  await info.attach("recovery-application.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("recovery-server.json", {
    body: Buffer.from(JSON.stringify(snapshots.get(page)?.(), null, 2)),
    contentType: "application/json",
  });
  await info.attach("acknowledged-recovery.json", {
    body: Buffer.from(
      (await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      )) ?? "null",
    ),
    contentType: "application/json",
  });
});
async function writing(page: Page): Promise<WritingContext> {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
async function fixture(page: Page) {
  const state = {
    saved: null as URLSearchParams | null,
    ownedSource: "Original owned source",
    published: false,
    member: "7",
    outcome: "accepted",
    unavailable: false,
    nativeOwnedDraftControls: false,
    gate: null as Promise<void> | null,
    effects: [] as { url: string; fields: [string, string][] }[],
    reads: [] as string[],
  };
  snapshots.set(page, () => ({
    ...state,
    saved: state.saved ? [...state.saved] : null,
    gate: !!state.gate,
  }));
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/recovery.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/recovery.js"></script></body></html>`,
      });
    const actor = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer ${state.member}</a></strong></div>`;
    const board = `<div id="pt"><a href="${boardURL}">Music</a></div>`;
    if (request.method() === "POST") {
      const fields = new URLSearchParams(request.postData() ?? "");
      state.effects.push({ url: url.href, fields: [...fields] });
      if (url.searchParams.get("tid") === "84")
        state.ownedSource = fields.get("message") ?? state.ownedSource;
      else if (!["lost-empty", "rejected"].includes(state.outcome)) {
        state.saved = fields;
        state.published = fields.get("save") !== "1";
      }
      if (state.gate) await state.gate;
      if (state.outcome.startsWith("lost")) return route.abort("failed");
      if (state.outcome === "rejected")
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>",
        });
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('${url.searchParams.get("tid") === "84" ? ownedURL : draftURL}', '${state.outcome === "moderation" ? "需要审核" : "Stored"}', {});</script>]]></root>`,
      });
    }
    state.reads.push(url.href);
    if (
      state.unavailable &&
      url.searchParams.get("mod") === "viewthread" &&
      url.searchParams.get("tid") === "42"
    )
      return route.abort("failed");
    const owned = url.searchParams.get("tid") === "84";
    const tid = owned ? "84" : "42",
      pid = owned ? "201" : "101";
    const title = owned
      ? "Owned edit destination"
      : (state.saved?.get("subject") ?? "");
    const content = owned
      ? state.ownedSource
      : (state.saved?.get("message") ?? "");
    let body = actor + board;
    if (url.pathname === "/home.php")
      body += `<a class="a" href="${listURL}">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${state.saved && !state.published ? `<tr><th><a href="${draftURL}">${escape(title)}</a></th><td><a href="${boardURL}">Music</a></td></tr>` : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form></div>`;
    else if (url.searchParams.get("mod") === "post") {
      const edit = url.searchParams.get("action") === "edit";
      const submit = edit ? "editsubmit" : "topicsubmit";
      body += `<form id="postform" method="post" action="forum.php?mod=post&action=${edit ? `edit&tid=${tid}&pid=${pid}` : "newthread"}&fid=5&${submit}=yes"><input type="hidden" name="formhash" value="PRIVATE"><input type="hidden" name="posttime" value="1"><input type="hidden" name="wysiwyg" value="0">${owned && !state.nativeOwnedDraftControls ? "" : '<input type="hidden" name="save" id="postsave" value="">'}<input name="subject" value="${escape(edit ? title : "")}"><textarea name="message">${escape(edit ? content : "")}</textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button type="submit" name="${submit}" value="yes">Submit</button>${owned && !state.nativeOwnedDraftControls ? "" : `<button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button>`}</form>`;
    } else if (url.searchParams.get("mod") === "viewthread")
      body += `<div id="postlist"><h1><span id="thread_subject">${escape(title)}</span>${!owned && !state.published ? '<span class="xg1">(草稿)</span>' : ""}</h1><div id="post_${pid}"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum${pid}">1#</a><div class="pcb">Rendered authoritative content</div><div class="po"><div class="pob">${!owned && !state.published ? '<a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a>' : ""}</div></div></div></div>`;
    else
      body += `<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_84"><tr><th><a class="xst" href="${ownedURL}">Owned edit destination</a></th></tr></tbody></table>`;
    return route.fulfill({ contentType: "text/html", body });
  });
  await page.goto(boardURL);
  await button(page, "New thread").click();
  await page.getByLabel("Title", { exact: true }).fill("Recovery draft");
  await source(page).fill("Original draft source");
  return state;
}
async function saved(page: Page) {
  await button(page, "Save forum draft").click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
}
async function originalCheck(page: Page, id: string) {
  await button(page, `Check original draft attempt ${id}`).click();
  await expect
    .poll(
      async () =>
        (await writing(page)).draftAttempts?.find((a) => a.id === id)?.checked,
    )
    .toBe(true);
}
async function warnResend(page: Page, id: string) {
  await button(page, `Review draft resend ${id}`).click();
}
async function lostSave(
  page: Page,
  state: Awaited<ReturnType<typeof fixture>>,
) {
  state.outcome = "lost-empty";
  await button(page, "Save forum draft").click();
  await expect(
    page.getByText(/Draft saving may have succeeded/).last(),
  ).toBeVisible();
  return (await writing(page)).draftAttempts!.at(-1)!;
}
async function editDestination(page: Page) {
  await page.goto(ownedURL);
  await button(page, "Return to reading").click();
  await button(page, "Edit post 201").click();
}
for (const operation of ["save", "publish"] as const)
  test(`review.retain-${operation}: owned edit replacement retains original draft uncertainty through reload`, async ({
    page,
  }) => {
    const state = await fixture(page);
    if (operation === "publish") await saved(page);
    state.outcome = "lost-empty";
    await button(
      page,
      operation === "save" ? "Save forum draft" : "Publish saved draft",
    ).click();
    await expect(page.getByText(/may have succeeded/).last()).toBeVisible();
    const original = (await writing(page)).draftAttempts!.at(-1)!;
    await editDestination(page);
    await button(page, "Discard local writing and edit post").click();
    await expect(source(page)).toHaveValue("Original owned source");
    await page.reload();
    const context = await writing(page);
    expect(context.action).toBe("edit-post");
    expect(context.draftAttempts).toContainEqual(original);
    expect(context.draftAttempts!.at(-1)!.submission.writing.account.id).toBe(
      "7",
    );
    expect(state.effects).toHaveLength(operation === "save" ? 1 : 2);
    await expect(button(page, "Save forum draft")).toHaveCount(0);
  });
for (const kind of ["published", "moderation"] as const)
  test(`review.check-${kind}: original publication checks with no list row reconcile result and preserve later text`, async ({
    page,
  }) => {
    const state = await fixture(page);
    await saved(page);
    state.outcome = kind === "published" ? "lost-stored" : "moderation";
    await button(page, "Publish saved draft").click();
    await expect(
      page
        .getByText(
          kind === "published"
            ? /publication may have succeeded/
            : /forum reports moderation/,
        )
        .last(),
    ).toBeVisible();
    const original = (await writing(page)).draftAttempts!.at(-1)!;
    await source(page).fill("Later local revision");
    state.outcome = "accepted";
    await originalCheck(page, original.id);
    await expect(
      page.getByRole("article", { name: "Post 101", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Post 101", exact: true }),
    ).toHaveAttribute("href", draftURL + "#pid101");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /Confirmed publication of forum draft 42/ }),
    ).toBeVisible();
    await button(page, "Return to writing").click();
    await expect(source(page)).toHaveValue("Later local revision");
    expect(
      (await writing(page)).draftAttempts!.find((a) => a.id === original.id)
        ?.status,
    ).toBe("published");
    expect(state.effects).toHaveLength(2);
    await button(page, "Return to reading").click();
    await button(page, "Drafts").first().click();
    await expect(page.getByText("还没有相关的帖子")).toBeVisible();
  });
test("review.check-known-save: original resumed save checks independently of list UI", async ({
  page,
}) => {
  const state = await fixture(page);
  await saved(page);
  await source(page).fill("Saved second revision");
  state.outcome = "lost-stored";
  await button(page, "Save forum draft").click();
  await expect(
    page.getByText(/Draft saving may have succeeded/).last(),
  ).toBeVisible();
  const original = (await writing(page)).draftAttempts!.at(-1)!;
  await source(page).fill("Later local revision");
  await originalCheck(page, original.id);
  await expect(page.getByText(/Confirmed forum draft 42/)).toHaveCount(2);
  await expect(source(page)).toHaveValue("Later local revision");
  expect(state.effects).toHaveLength(2);
});
test("review.resend-save: check absence stays unknown, cancellation emits nothing and explicit resend keeps both identities", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await expect(button(page, `Review draft resend ${original.id}`)).toHaveCount(
    0,
  );
  const reads = state.reads.length;
  await originalCheck(page, original.id);
  await expect.poll(() => state.reads.length).toBeGreaterThan(reads);
  expect((await writing(page)).draftAttempts!.at(-1)!.status).toBe("uncertain");
  await source(page).fill("Deliberate current revision");
  await warnResend(page, original.id);
  await expect(page.getByText(/may duplicate/).last()).toBeVisible();
  await expect(
    page.getByText(/Writer 7.*Board 5.*revision/).last(),
  ).toBeVisible();
  await button(page, "Cancel draft resend").click();
  expect(state.effects).toHaveLength(1);
  await warnResend(page, original.id);
  state.outcome = "accepted";
  await button(page, "Confirm draft resend").click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  const attempts = (await writing(page)).draftAttempts!;
  expect(attempts).toHaveLength(2);
  expect(attempts[0]!.status).toBe("uncertain");
  expect(attempts[1]!.id).not.toBe(original.id);
  expect(attempts[1]!.submission.writing.source).toBe(
    "Deliberate current revision",
  );
  expect(new URLSearchParams(state.effects[1]!.fields).get("message")).toBe(
    "Deliberate current revision",
  );
  await page.reload();
  expect((await writing(page)).draftAttempts).toHaveLength(2);
  expect(state.effects).toHaveLength(2);
});
test("review.resend-publish: checked ambiguity permits one explicit same-record publication without replacing unknown history", async ({
  page,
}) => {
  const state = await fixture(page);
  await saved(page);
  state.outcome = "lost-empty";
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByText(/publication may have succeeded/).last(),
  ).toBeVisible();
  const original = (await writing(page)).draftAttempts!.at(-1)!;
  state.unavailable = true;
  await originalCheck(page, original.id);
  state.unavailable = false;
  await warnResend(page, original.id);
  state.outcome = "accepted";
  await button(page, "Confirm draft resend").click();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  const attempts = (await writing(page)).draftAttempts!;
  expect(attempts.find((a) => a.id === original.id)?.status).toBe("uncertain");
  expect(attempts.at(-1)!.status).toBe("published");
  expect(state.effects).toHaveLength(3);
  expect(new URL(state.effects[2]!.url).searchParams.get("tid")).toBe("42");
  expect(new URLSearchParams(state.effects[2]!.fields).get("save")).toBe("");
});
for (const change of ["revision", "account", "replacement"] as const)
  test(`review.resend-${change}: changed warning context cannot send`, async ({
    page,
  }) => {
    const state = await fixture(page),
      original = await lostSave(page, state);
    await originalCheck(page, original.id);
    await warnResend(page, original.id);
    if (change === "revision")
      await source(page).fill("New revision after warning");
    if (change === "account") state.member = "8";
    if (change === "replacement") {
      await editDestination(page);
      await button(page, "Discard local writing and edit post").click();
    }
    if (await button(page, "Confirm draft resend").count())
      await button(page, "Confirm draft resend").click();
    await expect.poll(() => state.effects.length).toBe(1);
    await page.reload();
    expect(state.effects).toHaveLength(1);
    expect(
      (await writing(page)).draftAttempts!.find((a) => a.id === original.id)
        ?.status,
    ).toBe("uncertain");
  });
test("review.resend-double-refresh: pending acknowledged resend has new identity, double activation and refresh never replay", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await originalCheck(page, original.id);
  await warnResend(page, original.id);
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  state.outcome = "accepted";
  await button(page, "Confirm draft resend").evaluate(
    (node: HTMLButtonElement) => {
      node.click();
      node.click();
    },
  );
  await expect.poll(() => state.effects.length).toBe(2);
  const pending = (await writing(page)).draftAttempts!.at(-1)!;
  expect(pending.id).not.toBe(original.id);
  expect(pending.status).toBe("pending");
  expect(pending.priorDraftIds).toEqual([]);
  await page.reload();
  release();
  await expect(
    page.getByText(/Pending draft save restored as uncertain/).last(),
  ).toBeVisible();
  expect(state.effects).toHaveLength(2);
  expect((await writing(page)).draftAttempts).toHaveLength(2);
});
for (const resumed of [false, true])
  test(`review.continue-${resumed ? "resumed" : "new"}: save outgoing revision before preparing owned edit`, async ({
    page,
  }) => {
    const state = await fixture(page);
    if (resumed) await saved(page);
    await source(page).fill("Outgoing saved revision");
    await editDestination(page);
    await button(page, "Save forum draft and continue").click();
    await expect(source(page)).toHaveValue("Original owned source");
    expect(state.saved?.get("message")).toBe("Outgoing saved revision");
    expect(state.effects).toHaveLength(resumed ? 2 : 1);
    expect((await writing(page)).draftAttempts!.at(-1)!.status).toBe(
      "confirmed",
    );
    await expect(button(page, "Save forum draft")).toHaveCount(0);
  });
for (const outcome of ["rejected", "uncertain", "race"] as const)
  test(`review.continue-${outcome}: failed or stale outgoing save cannot replace writing`, async ({
    page,
  }) => {
    const state = await fixture(page);
    await editDestination(page);
    let release: (() => void) | undefined;
    if (outcome === "race")
      state.gate = new Promise<void>((resolve) => {
        release = resolve;
      });
    else state.outcome = outcome === "uncertain" ? "lost-empty" : "rejected";
    await button(page, "Save forum draft and continue").click();
    await expect.poll(() => state.effects.length).toBe(1);
    if (outcome === "race") {
      await button(page, "Return to writing").click();
      await source(page).fill("Newer revision during save");
      release!();
    } else await button(page, "Return to writing").click();
    await expect(
      page
        .getByText(
          outcome === "race"
            ? /Confirmed forum draft 42/
            : outcome === "uncertain"
              ? /Draft saving may have succeeded/
              : /forum rejected draft saving/,
        )
        .last(),
    ).toBeVisible();
    await button(page, "Return to writing").click();
    await expect(source(page)).toHaveValue(
      outcome === "race"
        ? "Newer revision during save"
        : "Original draft source",
    );
    expect((await writing(page)).action).toBe("new-thread");
    expect(
      state.reads.filter(
        (url) => url.includes("action=edit") && url.includes("tid=84"),
      ),
    ).toHaveLength(0);
  });

test("review.explicit-association: a selected row resolves only the explicitly named unknown save", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await originalCheck(page, original.id);
  await warnResend(page, original.id);
  state.outcome = "lost-stored";
  await button(page, "Confirm draft resend").click();
  await expect
    .poll(async () => (await writing(page)).draftAttempts?.length)
    .toBe(2);
  await expect(
    page.getByText(/Draft saving may have succeeded/).last(),
  ).toBeVisible();
  const second = (await writing(page)).draftAttempts!.at(-1)!;
  await button(page, "Return to reading").click();
  await button(page, "Drafts").first().click();
  await button(page, "Load forum drafts").click();
  await page
    .getByRole("group", { name: `Draft attempt ${second.id}`, exact: true })
    .getByRole("button", {
      name: "Check saved revision in Recovery draft",
      exact: true,
    })
    .click();
  await expect
    .poll(
      async () =>
        (await writing(page)).draftAttempts?.find((a) => a.id === second.id)
          ?.status,
    )
    .toBe("confirmed");
  const attempts = (await writing(page)).draftAttempts!;
  expect(attempts.find((a) => a.id === second.id)?.status).toBe("confirmed");
  expect(attempts.find((a) => a.id === original.id)?.status).toBe("uncertain");
  expect(state.effects).toHaveLength(2);
});
test("review.resend-acknowledgement: native storage refusal prevents resend effect", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await originalCheck(page, original.id);
  await warnResend(page, original.id);
  const quota = await page.evaluate(() => {
    let value = "",
      refused = false;
    for (let size = 65536; size >= 1; size = Math.floor(size / 2)) {
      const chunk = "x".repeat(size);
      try {
        while (true) {
          sessionStorage.setItem("review-capacity", value + chunk);
          value += chunk;
        }
      } catch {
        refused = true;
      }
    }
    return { refused, size: value.length };
  });
  expect(quota.refused).toBe(true);
  expect(quota.size).toBeGreaterThan(0);
  await button(page, "Confirm draft resend").click();
  await expect(
    page.getByText(/Draft saving was not sent/).last(),
  ).toBeVisible();
  expect(state.effects).toHaveLength(1);
  await expect(source(page)).toHaveValue("Original draft source");
});
test("review.resend-editor: unresolved visual input cannot offer a manual resend", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await originalCheck(page, original.id);
  await source(page).fill("[B]retained[/B]");
  await button(page, "Visual editor").click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.press("Meta+ArrowRight");
  await visual.pressSequentially(" [b]literal[/b]");
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  await expect(button(page, `Review draft resend ${original.id}`)).toHaveCount(
    0,
  );
  await page.reload();
  expect(state.effects).toHaveLength(1);
  expect((await writing(page)).editorUnresolved).toBe(true);
});
test("review.resend-fresh-source: a changed remote saved revision prevents publication resend", async ({
  page,
}) => {
  const state = await fixture(page);
  await saved(page);
  state.outcome = "lost-empty";
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByText(/publication may have succeeded/).last(),
  ).toBeVisible();
  const original = (await writing(page)).draftAttempts!.at(-1)!;
  state.unavailable = true;
  await originalCheck(page, original.id);
  state.unavailable = false;
  await warnResend(page, original.id);
  state.saved!.set("message", "A different server revision");
  await button(page, "Confirm draft resend").click();
  await expect(
    page.getByText(/saved draft or account changed before publication/).last(),
  ).toBeVisible();
  expect(state.effects).toHaveLength(2);
  expect(
    (await writing(page)).draftAttempts!.find((a) => a.id === original.id)
      ?.status,
  ).toBe("uncertain");
});

test("review.resend-result: confirmed resend allows updating and publishing its identity while the original remains unknown", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await originalCheck(page, original.id);
  await warnResend(page, original.id);
  state.outcome = "accepted";
  await button(page, "Confirm draft resend").click();
  await expect(page.getByText(/Confirmed forum draft 42/).last()).toBeVisible();
  await source(page).fill("Updated confirmed resend identity");
  await saved(page);
  await expect.poll(() => state.effects.length).toBe(3);
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  expect(state.effects).toHaveLength(4);
  expect(
    (await writing(page)).draftAttempts!.find((a) => a.id === original.id)
      ?.status,
  ).toBe("uncertain");
});

test("review.publish-resend-refresh: pending explicit publication resend restores the original target and never replays", async ({
  page,
}) => {
  const state = await fixture(page);
  await saved(page);
  state.outcome = "lost-empty";
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByText(/publication may have succeeded/).last(),
  ).toBeVisible();
  const original = (await writing(page)).draftAttempts!.at(-1)!;
  state.unavailable = true;
  await originalCheck(page, original.id);
  state.unavailable = false;
  await warnResend(page, original.id);
  let release!: () => void;
  state.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  state.outcome = "accepted";
  await button(page, "Confirm draft resend").evaluate(
    (node: HTMLButtonElement) => {
      node.click();
      node.click();
    },
  );
  await expect.poll(() => state.effects.length).toBe(3);
  const pending = (await writing(page)).draftAttempts!.at(-1)!;
  expect(pending.id).not.toBe(original.id);
  expect(pending.resendOf).toBe(original.id);
  expect(pending.operation).toBe("publish");
  expect(pending.submission.writing.draft?.threadId).toBe("42");
  await page.reload();
  release();
  await expect(
    page
      .getByText(
        "Pending draft publication restored as uncertain. Nothing was replayed.",
      )
      .last(),
  ).toBeVisible();
  expect(state.effects).toHaveLength(3);
  expect((await writing(page)).draftAttempts!.at(-1)!.checked).toBe(false);
});
test("review.historical-check: checking a retained publication preserves an unrelated owned edit and its target", async ({
  page,
}) => {
  const state = await fixture(page);
  await saved(page);
  state.outcome = "lost-stored";
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByText(/publication may have succeeded/).last(),
  ).toBeVisible();
  const original = (await writing(page)).draftAttempts!.at(-1)!;
  await editDestination(page);
  await button(page, "Discard local writing and edit post").click();
  await source(page).fill("Later unrelated edit source");
  await originalCheck(page, original.id);
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toBeVisible();
  await button(page, "Return to writing").click();
  await expect(source(page)).toHaveValue("Later unrelated edit source");
  const context = await writing(page);
  expect(context.action).toBe("edit-post");
  expect(context.editTarget?.postId).toBe("201");
  expect(context.draft).toBeUndefined();
  expect(context.draftAttempts!.find((a) => a.id === original.id)?.status).toBe(
    "published",
  );
  expect(state.effects).toHaveLength(2);
});

test("review.unrelated-edit: retained unknown draft history cannot retarget or prohibit a separately reviewed owned edit", async ({
  page,
}) => {
  const state = await fixture(page),
    original = await lostSave(page, state);
  await editDestination(page);
  await button(page, "Discard local writing and edit post").click();
  await source(page).fill("Deliberate separate owned edit");
  state.outcome = "accepted";
  await expect(button(page, `Review draft resend ${original.id}`)).toHaveCount(
    0,
  );
  await button(page, "Review edit").click();
  await button(page, "Save edited post").click();
  await expect(page.getByText(/Confirmed saved post 201/).last()).toBeVisible();
  expect(state.effects).toHaveLength(2);
  expect(new URL(state.effects[1]!.url).searchParams.get("tid")).toBe("84");
  expect(new URLSearchParams(state.effects[1]!.fields).has("save")).toBe(false);
  expect(
    (await writing(page)).draftAttempts!.find((a) => a.id === original.id)
      ?.status,
  ).toBe("uncertain");
});

test("J6.owned-edit-no-draft: published-post edit never offers draft saving even when the native form contains a draft button", async ({
  page,
}) => {
  const state = await fixture(page);
  state.nativeOwnedDraftControls = true;
  await editDestination(page);
  await button(page, "Discard local writing and edit post").click();
  await expect(source(page)).toHaveValue("Original owned source");
  await expect(button(page, "Save forum draft")).toHaveCount(0);
  expect(state.effects).toHaveLength(0);
});
