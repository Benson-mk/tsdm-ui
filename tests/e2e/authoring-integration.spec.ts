import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const listURL = `${origin}/home.php?mod=space&do=thread&view=me&type=thread&filter=save`;
const actor =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
const board = `<div id="pt"><a href="${boardURL}">Music</a></div>`;
const original = "[B]retained[/B] [unknown=v3]完整來源 & <literal>[/unknown]";
const ambiguous = "[B]retained [b]literal[/b][/B]";
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
type Action = "reply" | "edit" | "draft";
type Effect = { url: string; method: string; fields: [string, string][] };
const snapshots = new WeakMap<Page, () => unknown>();
test.afterEach(async ({ page }, info) => {
  const snapshot = snapshots.get(page);
  if (snapshot)
    await info.attach("authoring-server-state.json", {
      body: Buffer.from(JSON.stringify(snapshot(), null, 2)),
      contentType: "application/json",
    });
  await info.attach("authoring-application.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

async function fixture(page: Page, action: Action) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const state = {
    stored:
      action === "edit"
        ? new URLSearchParams({
            message: original,
            subject: "Owned thread",
            usesig: "1",
          })
        : (null as URLSearchParams | null),
    published: action !== "draft",
    effects: [] as Effect[],
    reads: [] as { url: string; afterEffects: number; source: string | null }[],
  };
  snapshots.set(page, () => ({
    action,
    ...state,
    stored: state.stored ? [...state.stored] : null,
  }));
  const form = (edit: boolean) => {
    const reply = action === "reply";
    const submit = reply ? "replysubmit" : edit ? "editsubmit" : "topicsubmit";
    const operation = edit
      ? `edit&tid=42&pid=${reply ? "303" : "101"}`
      : reply
        ? "reply&tid=42"
        : "newthread";
    return `${reply ? '<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script>' : ""}${actor}${board}<form id="postform" method="post" action="forum.php?mod=post&action=${operation}&fid=5&${submit}=yes"><input type="hidden" name="formhash" value="SYNTHETIC-CURRENT"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${action === "draft" ? '<input type="hidden" name="save" id="postsave" value="">' : ""}<input name="subject" value="${escape(reply ? "" : edit ? (state.stored?.get("subject") ?? "") : "")}"><textarea name="message">${escape(edit ? (state.stored?.get("message") ?? "") : "")}</textarea><label><input type="checkbox" name="usesig" value="1"${!edit || state.stored?.has("usesig") ? " checked" : ""}>Signature</label><button type="submit" name="${submit}" value="yes">Submit</button>${action === "draft" ? `<button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button>` : ""}</form>`;
  };
  const post = (id: string, owner: string, floor: number) =>
    `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=${owner}">Writer ${owner}</a></div><a id="postnum${id}"><em>${floor}</em>#</a><div class="pcb"><p>Authoritative rendered body, separately from saved source</p></div>${action === "draft" && !state.published ? '<div class="po"><div class="pob"><a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a></div></div>' : ""}</div>`;
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/authoring-fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/authoring-fixture.js"></script></body></html>`,
      });
    const publication = url.searchParams.get("action") === "pubsave";
    if (request.method() === "POST" || publication) {
      const fields = new URLSearchParams(request.postData() ?? "");
      state.effects.push({
        url: url.href,
        method: request.method(),
        fields: [...fields],
      });
      if (publication) state.published = true;
      else {
        state.stored = new URLSearchParams(fields);
        state.published = action !== "draft" || fields.get("save") !== "1";
      }
      const resultURL =
        action === "reply"
          ? "forum.php?mod=viewthread&tid=42&pid=303&page=1#pid303"
          : "forum.php?mod=viewthread&tid=42";
      return route.fulfill({
        contentType: "text/xml; charset=utf-8",
        body: `<root><![CDATA[<script>succeedhandle_post('${resultURL}', 'Stored', {});</script>]]></root>`,
      });
    }
    const isSource = url.searchParams.get("action") === "edit";
    state.reads.push({
      url: url.href,
      afterEffects: state.effects.length,
      source: isSource ? (state.stored?.get("message") ?? null) : null,
    });
    let body: string;
    if (url.pathname === "/home.php")
      body = `${actor}<a class="a" href="${listURL}">草稿箱</a><div class="tl"><form id="delform"><table><tbody>${state.stored && !state.published ? `<tr><th><a href="forum.php?mod=viewthread&tid=42">${escape(state.stored.get("subject") ?? "")}</a></th><td><a href="${boardURL}">Music</a></td></tr>` : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form></div>`;
    else if (url.searchParams.get("mod") === "post") body = form(isSource);
    else if (url.searchParams.get("mod") === "viewthread")
      body = `${actor}${board}<div id="postlist"><h1><span id="thread_subject">${escape(state.stored?.get("subject") || "Owned thread")}</span>${action === "draft" && !state.published ? '<span class="xg1">(草稿)</span>' : ""}</h1>${post("101", action === "reply" ? "8" : "7", 1)}${action === "reply" && state.stored ? post("303", "7", 2) : ""}</div>`;
    else
      body = `${actor}<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Owned thread</a></th></tr></tbody></table>`;
    return route.fulfill({ contentType: "text/html; charset=utf-8", body });
  });
  await page.goto(action === "draft" ? boardURL : threadURL);
  await button(
    page,
    action === "reply"
      ? "Reply to thread"
      : action === "edit"
        ? "Edit post 101"
        : "New thread",
  ).click();
  await expect(source(page)).toBeVisible();
  if (action === "draft")
    await page
      .getByLabel("Title", { exact: true })
      .fill("Authoring integration draft");
  return state;
}
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const source = (page: Page) =>
  page.getByLabel("Complete source", { exact: true });
const warning = (page: Page) =>
  page.getByText(/Some visual input has no unambiguous/);
const reviewName = (action: Action) =>
  action === "edit" ? "Review edit" : "Review publication";
const submitName = (action: Action) =>
  action === "edit" ? "Save edited post" : "Send reply";
async function complete(page: Page, action: Action) {
  if (action === "draft") await button(page, "Save forum draft").click();
  else {
    await button(page, reviewName(action)).click();
    await button(page, submitName(action)).click();
  }
  await expect(
    page
      .getByText(
        action === "draft"
          ? /Confirmed forum draft 42/
          : action === "reply"
            ? /Confirmed stored reply/
            : /Confirmed saved post 101/,
      )
      .last(),
  ).toBeVisible();
}
async function verifyStored(
  state: Awaited<ReturnType<typeof fixture>>,
  action: Action,
  expected: string,
  effectCount: number,
) {
  await expect.poll(() => state.effects.length).toBe(effectCount);
  expect(state.stored?.get("message")).toBe(expected);
  const effect = state.effects.at(-1)!;
  const url = new URL(effect.url);
  expect(url.searchParams.get("fid")).toBe("5");
  if (action !== "draft" || effectCount > 1)
    expect(url.searchParams.get("tid")).toBe("42");
  if (action === "edit") expect(url.searchParams.get("pid")).toBe("101");
  expect(url.searchParams.get("action")).toBe(
    action === "reply"
      ? "reply"
      : action === "edit" || effectCount > 1
        ? "edit"
        : "newthread",
  );
  expect(
    new URLSearchParams(effect.fields).get(
      action === "reply"
        ? "replysubmit"
        : action === "edit" || effectCount > 1
          ? "editsubmit"
          : "topicsubmit",
    ),
  ).toBe("yes");
  if (action === "draft") {
    expect(new URLSearchParams(effect.fields).get("save")).toBe("1");
    expect(state.published).toBe(false);
  }
  await expect
    .poll(() =>
      state.reads.some(
        (read) =>
          read.afterEffects === effectCount &&
          read.source === expected &&
          new URL(read.url).searchParams.get("pid") ===
            (action === "reply" ? "303" : "101"),
      ),
    )
    .toBe(true);
}
async function createAmbiguity(page: Page) {
  await source(page).fill("[B]retained[/B]");
  await button(page, "Visual editor").click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.press("Meta+ArrowRight");
  await visual.pressSequentially(" [b]literal[/b]");
  await expect(warning(page)).toBeVisible();
}
async function attemptBlocked(control: Locator) {
  await expect(control).toBeVisible();
  if (await control.isEnabled()) await control.click();
  else await expect(control).toBeDisabled();
}
async function recoverAmbiguity(page: Page) {
  await page.reload();
  await expect(warning(page)).toBeVisible();
  await expect(source(page)).toHaveValue(ambiguous);
}
async function interpret(page: Page) {
  await button(page, "Interpret complete source as BBCode").click();
  await expect(warning(page)).toHaveCount(0);
  await expect(source(page)).toHaveValue(ambiguous);
}

for (const action of ["reply", "edit"] as const) {
  test(`J5.authoring-${action}-preservation: retain exact source and target across editor, navigation and refresh`, async ({
    page,
  }) => {
    const state = await fixture(page, action);
    if (action === "reply") await source(page).fill(original);
    else await expect(source(page)).toHaveValue(original);
    await button(page, "Visual editor").click();
    await expect(
      page.getByRole("textbox", { name: "Visual post content", exact: true }),
    ).toBeVisible();
    await button(page, "Source editor").click();
    await expect(source(page)).toHaveValue(original);
    const revised = original + "\nUser revision";
    await source(page).fill(revised);
    await button(page, "Return to reading").click();
    await button(page, "Return to writing").click();
    await expect(source(page)).toHaveValue(revised);
    await page.reload();
    await expect(source(page)).toHaveValue(revised);
    expect(state.effects).toHaveLength(0);
    await complete(page, action);
    await verifyStored(state, action, revised, 1);
  });
}
for (const action of ["reply", "edit", "draft"] as const) {
  test(`J5.authoring-${action}-ambiguity: block effects through recovery until explicit interpretation`, async ({
    page,
  }) => {
    const state = await fixture(page, action);
    await createAmbiguity(page);
    await attemptBlocked(
      button(
        page,
        action === "draft" ? "Save forum draft" : reviewName(action),
      ),
    );
    if (action !== "draft")
      await expect(button(page, submitName(action))).toHaveCount(0);
    await recoverAmbiguity(page);
    expect(state.effects).toHaveLength(0);
    await attemptBlocked(
      button(
        page,
        action === "draft" ? "Save forum draft" : reviewName(action),
      ),
    );
    await expect(warning(page)).toBeVisible();
    if (action !== "draft")
      await expect(button(page, submitName(action))).toHaveCount(0);
    await interpret(page);
    expect(state.effects).toHaveLength(0);
    await complete(page, action);
    await verifyStored(state, action, ambiguous, 1);
  });
}
test("J6.authoring-draft-publication-ambiguity: preserve unresolved input and publish only the explicitly saved interpreted revision", async ({
  page,
}) => {
  const state = await fixture(page, "draft");
  await source(page).fill("[B]retained[/B]");
  await complete(page, "draft");
  await verifyStored(state, "draft", "[B]retained[/B]", 1);
  await createAmbiguity(page);
  await attemptBlocked(button(page, "Publish saved draft"));
  await recoverAmbiguity(page);
  expect(state.effects).toHaveLength(1);
  expect(state.published).toBe(false);
  await attemptBlocked(button(page, "Publish saved draft"));
  await expect(warning(page)).toBeVisible();
  await interpret(page);
  expect(state.effects).toHaveLength(1);
  await complete(page, "draft");
  await verifyStored(state, "draft", ambiguous, 2);
  await button(page, "Publish saved draft").click();
  await expect(
    page.getByText(/Confirmed publication of forum draft 42/).last(),
  ).toBeVisible();
  expect(state.effects).toHaveLength(3);
  expect(state.published).toBe(true);
  expect(state.stored?.get("message")).toBe(ambiguous);
  const publication = new URL(state.effects[2]!.url);
  expect(publication.searchParams.get("tid")).toBe("42");
  expect(["pubsave", "edit"]).toContain(publication.searchParams.get("action"));
  expect(
    state.reads.some(
      (read) =>
        read.afterEffects === 3 &&
        new URL(read.url).searchParams.get("mod") === "viewthread",
    ),
  ).toBe(true);
});
