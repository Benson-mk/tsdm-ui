import { readableLines, expectPreservedReadingLine } from "./readable-lines";
import { revealWritingTools, revealWritingDetails } from "./editor-controls";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { revealNavigation } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const retained = "[b]完整保留 source[/b]\n[attach]77[/attach]";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
type Entry =
  "new-thread" | "reply" | "addressed" | "edit-opening" | "edit-reply";
const states = new WeakMap<Page, ReturnType<typeof fixtureState>>();
function fixtureState() {
  return {
    requests: [] as { url: string; method: string }[],
    member: "7",
    refused: false,
    openingOwned: false,
    gate: null as {
      action: string;
      post: string | null;
      promise: Promise<void>;
    } | null,
  };
}
async function open(
  page: Page,
  openingOwned = false,
  reviewForm = false,
  longBody = false,
) {
  const state = fixtureState();
  state.openingOwned = openingOwned;
  states.set(page, state);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__entry.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__entry.js"></script></body></html>`,
      });
    state.requests.push({ url: url.href, method: request.method() });
    if (request.method() !== "GET")
      return route.fulfill({
        status: 500,
        body: "Unexpected consequential request",
      });
    const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Writer Seven</a></strong></div>`;
    const board = `<div id="pt"><a href="${boardURL}">Music discussion</a></div>`;
    const action = url.searchParams.get("action"),
      post = url.searchParams.get("reppost");
    if (state.gate && action === state.gate.action && post === state.gate.post)
      await state.gate.promise;
    let body = account + board;
    if (!url.searchParams.get("mod"))
      body += `<div class="bm"><div class="bm_h"><h2><a href="forum.php?gid=14">Music</a></h2></div><div id="category_14"><table><tr><td><h2><a href="${boardURL}">Music discussion</a></h2></td></tr></table></div></div>`;
    else if (url.searchParams.get("mod") === "post") {
      const edit = action === "edit",
        replyEdit = url.searchParams.get("pid") === "202";
      body += state.refused
        ? '<div id="messagetext">权限不足</div>'
        : `<form id="postform" method="post" action="forum.php?mod=post&action=${action}&fid=5&tid=42${edit ? `&pid=${replyEdit ? "202" : "101"}&editsubmit=yes` : action === "newthread" ? "&topicsubmit=yes" : "&replysubmit=yes"}"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0">${post ? '<input type="hidden" name="reppid" value="101"><input type="hidden" name="reppost" value="101"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_8"><input type="hidden" name="noticeauthormsg" value="Other author"><input type="hidden" name="noticetrimstr" value="">' : ""}${replyEdit ? "" : '<input name="subject" value="Native title">'}<textarea name="message">${edit ? escape(retained) : ""}</textarea>${action === "newthread" || (edit && !replyEdit) ? '<select name="typeid"><option value="0">Choose category</option><option value="3">Listening notes</option></select>' : ""}<label><input name="usesig" type="checkbox" value="1" checked>Signature</label>${!reviewForm || edit ? '<input type="hidden" name="attachnew[77][description]" value="Existing attachment">' : ""}<button type="submit" name="${edit ? "editsubmit" : action === "newthread" ? "topicsubmit" : "replysubmit"}" value="yes">Continue</button></form>`;
    } else if (url.searchParams.get("mod") === "forumdisplay")
      body += `<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="${threadURL}">Existing thread</a></th></tr></tbody></table>`;
    else
      body += `<div id="postlist"><h1 id="thread_subject">Existing thread</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=${state.openingOwned ? "7" : "8"}">${state.openingOwned ? "Writer Seven" : "Other author"}</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">${longBody ? Array.from({ length: 80 }, (_, i) => `<p>Reading paragraph ${i} with a stable complete line.</p>`).join("") : ""}<p>Original opening body <a href="forum.php?mod=viewthread&tid=43">Another thread</a></p></div></div><div id="post_202"><div class="authi"><a href="home.php?mod=space&uid=7">Writer Seven</a></div><a id="postnum202"><em>2</em>#</a><div class="pcb"><p>Owned reply</p></div></div></div>`;
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(threadURL);
  await expect(
    page.getByRole("heading", { name: "Existing thread", exact: true }),
  ).toBeVisible();
  return state;
}
async function enter(page: Page, entry: Entry) {
  if (entry === "new-thread") {
    await revealNavigation(page);
    await page.getByRole("button", { name: "New thread", exact: true }).click();
  } else
    await page
      .getByRole("button", {
        name:
          entry === "reply"
            ? "Reply to thread"
            : entry === "addressed"
              ? "Reply to this post"
              : `Edit post ${entry === "edit-opening" ? "101" : "202"}`,
        exact: true,
      })
      .first()
      .click();
}
async function stored(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
}
async function capture(page: Page, info: TestInfo) {
  await info.attach("presentation-state-requests.json", {
    body: JSON.stringify(
      {
        requests: states.get(page)?.requests,
        writing: await stored(page),
        focus: await page.locator(".source-writing").evaluateAll((nodes) =>
          nodes.map((node) => ({
            text: node.textContent,
            active: (node.getRootNode() as ShadowRoot).activeElement?.outerHTML,
            geometry: [node.clientWidth, node.scrollWidth],
          })),
        ),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await info.attach("presentation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
test.afterEach(async ({ page }, info) => {
  if (await page.locator(".source-writing").count()) await capture(page, info);
  else
    await info.attach("requests.json", {
      body: JSON.stringify(states.get(page)),
      contentType: "application/json",
    });
  if (info.status !== info.expectedStatus)
    await info.attach("failure.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});

// These whole-application expectations precede presentation feature code.
test("UI87.compact: concise destination and input lead to Review while expansion reveals every existing editor tool", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  const server = await open(page, false, true);
  await enter(page, "addressed");
  const writer = page.getByRole("region", {
    name: "Writing context",
    exact: true,
  });
  await expect(writer.getByRole("heading")).toHaveCount(0);

  await expect(
    writer.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Writer Seven");
  await expect(
    writer.getByRole("link", {
      name: "Addressed to Other author · Post 101",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    writer.getByRole("button", { name: "Bold", exact: true }),
  ).toBeHidden();
  await expect(
    writer.getByRole("button", { name: "Undo", exact: true }),
  ).toBeHidden();
  await expect(
    writer.getByText("Advanced authoring tools", { exact: true }),
  ).toBeHidden();
  await expect(writer.getByText("Details", { exact: true })).toBeVisible();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Concise reply 中文");
  await expect(
    writer.getByRole("group", { name: "Review destination", exact: true }),
  ).toHaveCount(0);
  const handle = await source.elementHandle();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  for (const name of ["Bold", "Undo", "Redo", "Visual editor", "Source editor"])
    await expect(
      writer.getByRole("button", { name, exact: true }),
    ).toBeVisible();
  await writer.getByText("Advanced authoring tools", { exact: true }).click();
  await expect(
    writer.getByRole("button", { name: "Insert table", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Concise reply 中文");
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("concise-writer.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

const profiles = [
  {
    width: 390,
    height: 844,
    textSize: 100,
    theme: "light",
    language: "en",
    expand: "Expand writing",
    compact: "Compact writing",
    body: "Complete source",
    visual: "Visual post content",
    visualMode: "Visual editor",
    sourceMode: "Source editor",
    reading: "Return to reading",
    resume: "Return to writing",
    undo: "Undo",
    redo: "Redo",
  },
  {
    width: 390,
    height: 844,
    textSize: 150,
    theme: "dark",
    language: "zh-CN",
    expand: "展开写作",
    compact: "紧凑写作",
    body: "完整源码",
    visual: "可视帖子内容",
    visualMode: "可视编辑",
    sourceMode: "源码编辑",
    reading: "返回阅读",
    resume: "返回写作",
    undo: "撤销",
    redo: "重做",
  },
  {
    width: 768,
    height: 900,
    textSize: 70,
    theme: "mono",
    language: "zh-TW",
    expand: "展開寫作",
    compact: "精簡寫作",
    body: "完整原始碼",
    visual: "視覺文章內容",
    visualMode: "視覺編輯",
    sourceMode: "原始碼編輯",
    reading: "返回閱讀",
    resume: "返回寫作",
    undo: "復原",
    redo: "重做",
  },
  {
    width: 1440,
    height: 900,
    textSize: 150,
    theme: "alias",
    language: "en",
    expand: "Expand writing",
    compact: "Compact writing",
    body: "Complete source",
    visual: "Visual post content",
    visualMode: "Visual editor",
    sourceMode: "Source editor",
    reading: "Return to reading",
    resume: "Return to writing",
    undo: "Undo",
    redo: "Redo",
  },
] as const;
for (const profile of profiles)
  for (const mode of ["source", "visual"] as const) {
    test(`UX57.continuity-${profile.width}-${profile.textSize}-${profile.language}-${mode}: expand compact reading resume and resize preserve one writing context, selection and continued typing undo redo`, async ({
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
              textSize: p.textSize,
              theme: p.theme,
              language: p.language,
            }),
          ),
        profile,
      );
      const state = await open(page);
      await page.locator("#pid101").getByRole("button").first().click();
      const source = page.getByLabel(profile.body, { exact: true });
      await expect(source).toBeFocused();
      await source.fill(retained);
      const selection = { start: 3, end: 4 };
      if (mode === "visual") {
        await revealWritingTools(page);
        await page
          .getByRole("button", { name: profile.visualMode, exact: true })
          .click();
        await page
          .getByRole("button", { name: profile.compact, exact: true })
          .click();
      }
      const editor =
        mode === "source"
          ? source
          : page.getByRole("textbox", { name: profile.visual, exact: true });
      await editor.focus();
      await editor.press("Meta+ArrowUp");
      await editor.press("Meta+ArrowLeft");
      await editor.press("Shift+ArrowRight");
      await expect
        .poll(async () => (await stored(page)).selection)
        .toMatchObject(mode === "source" ? { start: 0, end: 1 } : selection);
      const before = await stored(page),
        reads = state.requests.length;
      const expectFocusedSourceClear = async (phase: string) => {
        if (mode !== "source") return;
        const geometry = await source.evaluate((node: HTMLTextAreaElement) => {
          const style = getComputedStyle(node);
          const pane = node.closest(".source-writing")!;
          const strip = pane.querySelector(".writing-presentation-actions")!;
          const lineTop =
            node.getBoundingClientRect().top +
            parseFloat(style.borderTopWidth) +
            parseFloat(style.paddingTop) -
            node.scrollTop;
          return {
            sourceTop: node.getBoundingClientRect().top,
            lineTop,
            lineBottom: lineTop + parseFloat(style.lineHeight),
            stripBottom: strip.getBoundingClientRect().bottom,
            paneBottom: pane.getBoundingClientRect().bottom,
            selectionStart: node.selectionStart,
            selectionEnd: node.selectionEnd,
          };
        });
        await info.attach(`focused-source-${phase}.json`, {
          body: JSON.stringify(geometry, null, 2),
          contentType: "application/json",
        });
        expect(geometry.selectionStart).toBe(0);
        expect(geometry.selectionEnd).toBe(1);
        expect(geometry.lineTop).toBeGreaterThanOrEqual(
          geometry.stripBottom + 1,
        );
        expect(geometry.lineBottom).toBeLessThanOrEqual(geometry.paneBottom);
      };
      const expand = page.getByRole("button", {
        name: profile.expand,
        exact: true,
      });
      await expand.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: profile.compact, exact: true }),
      ).toBeVisible();
      await expect(editor).toBeFocused();
      await expectFocusedSourceClear("expanded");
      await info.attach("expanded-writing.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      expect(await stored(page)).toEqual(before);
      await page
        .getByRole("button", { name: profile.compact, exact: true })
        .click();
      await expect(editor).toBeFocused();
      await expectFocusedSourceClear("compact");
      await expect(page.locator(".workspace-body")).toBeVisible();
      const geometry = await page
        .locator(".source-writing")
        .evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          width: node.clientWidth,
          scroll: node.scrollWidth,
        }));
      expect(geometry.height).toBeLessThan(profile.height * 0.65);
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
      for (const width of [768, 390, profile.width])
        await page.setViewportSize({ width, height: profile.height });
      expect(await stored(page)).toEqual(before);
      await page
        .getByRole("button", { name: profile.reading, exact: true })
        .click();
      await expect(editor).toBeHidden();
      await expect(
        page.locator(".bottom-resume").getByRole("group", {
          name: /Writing destination|写作目标|寫作目標/,
          exact: true,
        }),
      ).toContainText("Writer Seven");
      await page
        .getByRole("button", { name: profile.resume, exact: true })
        .click();
      await expect(editor).toBeFocused();
      await expectFocusedSourceClear("resumed");
      expect(await stored(page)).toEqual(before);
      await page.keyboard.type("Z");
      await expect
        .poll(async () => (await stored(page)).source)
        .toBe(
          mode === "source"
            ? "Zb]完整保留 source[/b]\n[attach]77[/attach]"
            : "[b]Z整保留 source[/b]\n[attach]77[/attach]",
        );
      await expect
        .poll(async () => (await stored(page)).source)
        .not.toBe(retained);
      await revealWritingTools(page);
      await page
        .getByRole("button", { name: profile.undo, exact: true })
        .click();
      await expect.poll(async () => (await stored(page)).source).toBe(retained);
      await page
        .getByRole("button", { name: profile.redo, exact: true })
        .click();
      await expect
        .poll(async () => (await stored(page)).source)
        .not.toBe(retained);
      await revealWritingTools(page);
      await page
        .getByRole("button", { name: profile.undo, exact: true })
        .click();
      await expect.poll(async () => (await stored(page)).source).toBe(retained);
      await expectFocusedSourceClear("after-typing-undo-redo");
      expect(state.requests).toHaveLength(reads);
      expect(state.requests.every((r) => r.method === "GET")).toBe(true);
    });
  }
for (const entry of ["new-thread", "edit-opening", "edit-reply"] as const)
  test(`UX57.fields-${entry}: title category effective options saved attachments and complete long content remain reachable in either presentation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const state = await open(page, entry === "edit-opening");
    await enter(page, entry);
    const source = page.getByLabel("Complete source", { exact: true });
    const long =
      retained +
      "\n" +
      "Long mixed-language prose 測試 https://example.test/".repeat(70) +
      "\n[table][tr][td]A[/td][td]B[/td][/tr][/table]";
    await source.fill(long);
    await page.getByLabel("Signature", { exact: true }).uncheck();
    if (entry !== "edit-reply") {
      await page
        .getByLabel("Title", { exact: true })
        .fill("Long retained title 測試");
      await page.getByLabel("Category", { exact: true }).selectOption("3");
    }
    const before = await stored(page),
      reads = state.requests.length;
    await page
      .getByRole("button", { name: "Compact writing", exact: true })
      .click();
    await expect(source).toBeFocused();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await expect(source).toBeFocused();
    await expect(source).toHaveValue(long);
    expect(await stored(page)).toEqual(before);
    expect(before.attachmentFields[0].name).toBe("attachnew[77][description]");
    if (entry === "edit-reply")
      await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
    await revealWritingDetails(page);
    await expect(
      page.getByRole("button", {
        name: "Check current account and form",
        exact: true,
      }),
    ).toBeEnabled();
    expect(state.requests).toHaveLength(reads);
  });
test("UX57.composition: programmatic presentation requests defer while composition remains active without replacing source or stealing focus", async ({
  page,
}) => {
  const state = await open(page);
  await enter(page, "reply");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(retained);
  await source.focus();
  const before = await stored(page),
    reads = state.requests.length;
  await source.dispatchEvent("compositionstart", { data: "測" });
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .dispatchEvent("click");
  await expect(
    page.getByRole("button", { name: "Expand writing", exact: true }),
  ).toBeVisible();
  await expect(source).toBeFocused();
  await source.dispatchEvent("compositionend", { data: "測" });
  await expect(
    page.getByRole("button", { name: "Compact writing", exact: true }),
  ).toBeVisible();
  await expect(source).toBeFocused();
  await source.dispatchEvent("compositionstart", { data: "試" });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .dispatchEvent("click");
  await expect(source).toBeVisible();
  await source.dispatchEvent("compositionend", { data: "試" });
  await expect(source).toBeHidden();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(source).toBeFocused();
  expect(await stored(page)).toEqual(before);
  expect(state.requests).toHaveLength(reads);
});

test("UX57.retained-warning: compact reading entry discloses destination while active attachment warnings remain visible", async ({
  page,
}) => {
  await open(page);
  await enter(page, "reply");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Retained [attach]321[/attach]");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const retained = page.getByRole("region", {
    name: "Retained writing",
    exact: true,
  });
  await expect(retained.getByRole("alert")).toContainText("321");
  await expect(
    page
      .locator(".bottom-resume")
      .getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Writer Seven");
  await expect(retained.getByRole("alert")).toBeVisible();
});

for (const mode of ["source", "visual"] as const)
  for (const action of ["compact", "expand", "reading"] as const)
    test(`UX57.browser-composition-${action}-${mode}: deliberate pointer presentation ends the candidate and retains raw input, committed text and continued editing`, async ({
      page,
    }, info) => {
      const server = await open(page);
      await enter(page, "reply");
      if (action !== "expand")
        await page
          .getByRole("button", { name: "Expand writing", exact: true })
          .click();
      const source = page.getByLabel("Complete source", { exact: true });
      await source.fill("Base ");
      if (mode === "visual") {
        await revealWritingTools(page);
        await page
          .getByRole("button", { name: "Visual editor", exact: true })
          .click();
        if (action === "expand")
          await page
            .getByRole("button", { name: "Compact writing", exact: true })
            .click();
      }
      const editor =
        mode === "source"
          ? source
          : page.getByRole("textbox", {
              name: "Visual post content",
              exact: true,
            });
      await editor.focus();
      await editor.press("Meta+ArrowDown");
      const requestsBefore = server.requests.length;
      await page.locator(".source-writing").evaluate((writing) => {
        const events: unknown[] = [];
        Object.assign(window, { __ux57CompositionEvents: events });
        for (const type of [
          "pointerdown",
          "mousedown",
          "focusout",
          "focusin",
          "compositionstart",
          "compositionupdate",
          "compositionend",
          "beforeinput",
          "input",
          "click",
        ])
          writing.addEventListener(
            type,
            (event) => {
              const root = writing.getRootNode();
              const active =
                root instanceof ShadowRoot
                  ? root.activeElement
                  : document.activeElement;
              events.push({
                type,
                trusted: event.isTrusted,
                data:
                  event instanceof CompositionEvent ||
                  event instanceof InputEvent
                    ? event.data
                    : null,
                composing:
                  event instanceof InputEvent ? event.isComposing : null,
                target:
                  event.target instanceof Element
                    ? (event.target.getAttribute("aria-label") ??
                      event.target.tagName)
                    : null,
                active: active?.getAttribute("aria-label") ?? active?.tagName,
              });
            },
            true,
          );
      });
      const browser = await page.context().newCDPSession(page);
      await browser.send("Input.imeSetComposition", {
        text: "nei ho",
        selectionStart: 6,
        selectionEnd: 6,
      });
      const started = await page.evaluate(() =>
        Reflect.get(window, "__ux57CompositionEvents"),
      );
      expect(
        started.some(
          (event: { type: string; trusted: boolean }) =>
            event.type === "compositionstart" && event.trusted,
        ),
      ).toBe(true);
      await page
        .getByRole("button", {
          name:
            action === "compact"
              ? "Compact writing"
              : action === "expand"
                ? "Expand writing"
                : "Return to reading",
          exact: true,
        })
        .click();
      const afterPointer = await page
        .locator(".source-writing")
        .evaluate((writing) => {
          const root = writing.getRootNode();
          const active =
            root instanceof ShadowRoot
              ? root.activeElement
              : document.activeElement;
          return {
            events: Reflect.get(window, "__ux57CompositionEvents"),
            expanded: writing.classList.contains("writing-expanded"),
            active: active?.getAttribute("aria-label") ?? active?.tagName,
          };
        });
      if (action === "reading") {
        await expect(editor).toBeHidden();
        await page
          .getByRole("button", { name: "Return to writing", exact: true })
          .click();
      } else
        await expect(
          page.getByRole("button", {
            name: action === "compact" ? "Expand writing" : "Compact writing",
            exact: true,
          }),
        ).toBeVisible();
      if (mode === "visual") {
        await revealWritingTools(page);
        await page
          .getByRole("button", { name: "Source editor", exact: true })
          .click();
      }
      const finalSource = await source.inputValue();
      await info.attach("browser-composition-pointer-order.json", {
        body: JSON.stringify(
          {
            mode,
            afterPointer,
            finalSource,
            finalEvents: await page.evaluate(() =>
              Reflect.get(window, "__ux57CompositionEvents"),
            ),
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await info.attach("browser-composition-pointer.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      expect(
        afterPointer.events.filter(
          (event: { type: string }) => event.type === "compositionend",
        ),
      ).toHaveLength(1);
      await expect
        .poll(() =>
          page
            .locator(".source-writing")
            .evaluate((writing) =>
              writing.classList.contains("writing-expanded"),
            ),
        )
        .toBe(mode === "visual" || action !== "compact");
      expect(finalSource).toBe("Base nei ho");
      expect((await stored(page)).source).toBe("Base nei ho");
      await source.press("Meta+ArrowDown");
      await source.press("!");
      await expect(source).toHaveValue("Base nei ho!");
      await revealWritingTools(page);
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect(source).toHaveValue("Base nei ho");
      await revealWritingTools(page);
      await page.getByRole("button", { name: "Redo", exact: true }).click();
      await expect(source).toHaveValue("Base nei ho!");
      await revealWritingTools(page);
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect(source).toHaveValue("Base nei ho");
      await expect(source).toBeFocused();
      expect(server.requests).toHaveLength(requestsBefore);
      expect(server.requests.every((request) => request.method === "GET")).toBe(
        true,
      );
      await browser.detach();
    });

test("UX57.browser-composition-control: a browser composition without a size interaction replaces unfinished syllables on commit", async ({
  page,
}, info) => {
  const state = await open(page);
  await enter(page, "reply");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Base ");
  await source.focus();
  const requests = state.requests.length;
  const browser = await page.context().newCDPSession(page);
  await browser.send("Input.imeSetComposition", {
    text: "nei ho",
    selectionStart: 6,
    selectionEnd: 6,
  });
  const composingSource = await source.inputValue();
  await browser.send("Input.insertText", { text: "你好" });
  await expect(source).toHaveValue("Base 你好");
  await expect(source).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Compact writing", exact: true }),
  ).toBeVisible();
  expect(state.requests).toHaveLength(requests);
  await info.attach("browser-composition-control.json", {
    body: JSON.stringify(
      { composingSource, finalSource: await source.inputValue() },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await browser.detach();
});

test("IM65.writing-board-browse: browsing a board retains the same visible editor, complete source and original reply target", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await open(page);
  await enter(page, "addressed");
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill(retained);
  const identity = await editor.elementHandle();
  const before = state.requests.length;
  await page
    .locator(".boards-navigation")
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  await expect(page.locator(".results-pane")).toBeVisible();
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue(retained);
  expect(await identity!.evaluate((node) => node.isConnected)).toBe(true);
  const saved = await stored(page);
  expect(saved.replyTarget.threadId).toBe("42");
  expect(saved.replyTarget.postId).toBe("101");
  expect(state.requests.slice(before)).toHaveLength(1);
  expect(
    state.requests
      .slice(before)
      .every(
        (request) =>
          request.method === "GET" && request.url.includes("mod=forumdisplay"),
      ),
  ).toBe(true);
  const presentationCount = state.requests.length;
  for (const name of [
    "Boards pane",
    "Threads pane",
    "Boards pane",
    "Threads pane",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(editor).toHaveValue(retained);
  expect(state.requests).toHaveLength(presentationCount);
});

// IM72: failure-first expectations for the docked retained session.
for (const size of [
  { width: 1440, height: 900 },
  { width: 390, height: 600 },
])
  test(`IM72.docked-${size.width}: compact and expanded writing stay below usable reading with one retained editor`, async ({
    page,
  }, info) => {
    await page.setViewportSize(size);
    const server = await open(page);
    await enter(page, "reply");
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Retained docked source 中文");
    const handle = await source.elementHandle();
    const before = await stored(page);
    const requests = server.requests.length;
    const geometry = async () =>
      page.locator(".source-writing").evaluate((writer) => {
        const root = writer.getRootNode() as ShadowRoot;
        const reader = root.querySelector(".reading-pane")!;
        const field = writer.querySelector("textarea")!;
        const w = writer.getBoundingClientRect(),
          r = reader.getBoundingClientRect();
        return {
          writer: { top: w.top, bottom: w.bottom, height: w.height },
          reader: { top: r.top, bottom: r.bottom, height: r.height },
          fieldMinimum: parseFloat(getComputedStyle(field).minHeight),
          viewport: innerHeight,
        };
      });
    const compact = await geometry();
    await info.attach("compact-dock.json", {
      body: JSON.stringify(compact),
      contentType: "application/json",
    });
    expect(compact.writer.top).toBeGreaterThanOrEqual(
      compact.reader.bottom - 1,
    );
    expect(compact.writer.height).toBeLessThanOrEqual(size.height * 0.46 + 1);
    expect(compact.reader.height).toBeGreaterThanOrEqual(96);
    expect(compact.fieldMinimum).toBe(64);
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const expanded = await geometry();
    await info.attach("expanded-dock.json", {
      body: JSON.stringify(expanded),
      contentType: "application/json",
    });
    await info.attach("expanded-dock.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    if (size.width < 1440)
      expect(expanded.writer.top).toBeGreaterThanOrEqual(
        expanded.reader.bottom - 1,
      );
    else expect(expanded.writer.top).toBeLessThan(expanded.reader.bottom);
    expect(expanded.reader.height).toBeGreaterThanOrEqual(96);
    if (size.width < 1440)
      expect(expanded.writer.height).toBeLessThanOrEqual(
        size.height * 0.46 + 1,
      );
    else expect(expanded.writer.height).toBeGreaterThan(size.height * 0.46);
    expect(expanded.fieldMinimum).toBe(size.width < 560 ? 100 : 140);
    expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
    expect(await stored(page)).toEqual(before);
    expect(server.requests).toHaveLength(requests);
  });

for (const entry of ["reply", "addressed", "new-thread", "edit-reply"] as const)
  test(`IM72.review-shortcut-${entry}: newline and IME remain input while modifier Enter only prepares one immutable review`, async ({
    page,
  }, info) => {
    const server = await open(page, false, true);
    await enter(page, entry);
    const source = page.getByLabel("Complete source", { exact: true });
    if (entry === "new-thread")
      await page.getByLabel("Category", { exact: true }).selectOption("3");
    await source.fill("Keyboard review 中文");
    await source.press("End");
    await source.press("Enter");
    await source.press("x");
    await expect(source).toHaveValue("Keyboard review 中文\nx");
    const before = server.requests.length;
    for (const init of [
      { ctrlKey: true, repeat: true },
      { metaKey: true, isComposing: true },
      { ctrlKey: true, keyCode: 229 },
    ])
      await source.dispatchEvent("keydown", {
        key: "Enter",
        bubbles: true,
        ...init,
      });
    await source.dispatchEvent("compositionstart", { data: "測" });
    await source.dispatchEvent("keydown", { key: "Enter", ctrlKey: true });
    expect(server.requests).toHaveLength(before);
    await source.dispatchEvent("compositionend", { data: "測" });
    await revealWritingTools(page);
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled();
    await source.press(entry === "reply" ? "Control+Enter" : "Meta+Enter");
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toBeVisible();
    await expect(review).toContainText("Keyboard review 中文");
    const reviewed = (await review.textContent()) ?? "";
    const after = server.requests.length;
    await source.press("Control+Enter");
    await source.press("Meta+Enter");
    await expect(review).toHaveText(reviewed);
    expect(server.requests).toHaveLength(after);
    expect(server.requests.every((request) => request.method === "GET")).toBe(
      true,
    );
    await info.attach("shortcut-review.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("IM72.addressed-return: blank addressed source names the exact post and guarded ordinary reply never silently transfers quotes", async ({
  page,
}, info) => {
  const server = await open(page);
  await enter(page, "addressed");
  const source = page.getByLabel("Complete source", { exact: true });
  await expect(source).toHaveValue("");
  const writing = page.getByRole("region", {
    name: "Writing context",
    exact: true,
  });
  await expect(
    writing
      .getByRole("group", { name: "Writing destination", exact: true })
      .getByRole("link", {
        name: "Addressed to Other author · Post 101",
        exact: true,
      }),
  ).toHaveAttribute(
    "href",
    `${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=101`,
  );
  await source.fill(
    "[quote=Independent author]Separately authored quote[/quote]\nMy answer",
  );
  const before = await stored(page),
    requests = server.requests.length;
  await revealWritingDetails(page);
  await writing
    .getByRole("button", { name: "Start an ordinary reply", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Return",
      exact: true,
    }),
  ).toBeVisible();
  expect(await stored(page)).toEqual(before);
  expect(server.requests).toHaveLength(requests);
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(source).toHaveValue(before.source);
  await info.attach("addressed-retained.json", {
    body: JSON.stringify({
      before,
      after: await stored(page),
      requests: server.requests,
    }),
    contentType: "application/json",
  });
});

test("IM72.visual-ime-shortcut: browser composition stays input and settled visual modifier Enter requests review without publication", async ({
  page,
}, info) => {
  const server = await open(page, false, true);
  await enter(page, "reply");
  await page.getByLabel("Complete source", { exact: true }).fill("Base ");
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.focus();
  await visual.press("Meta+ArrowDown");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", {
    text: "nei ho",
    selectionStart: 6,
    selectionEnd: 6,
  });
  const before = server.requests.length;
  await visual.dispatchEvent("keydown", {
    key: "Enter",
    ctrlKey: true,
    isComposing: true,
  });
  expect(server.requests).toHaveLength(before);
  await cdp.send("Input.insertText", { text: "你好" });
  await revealWritingTools(page);
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled();
  await visual.press("Meta+Enter");
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toBeVisible();
  expect((await stored(page)).source).toBe("Base 你好");
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("visual-ime-review.json", {
    body: JSON.stringify({
      writing: await stored(page),
      requests: server.requests,
    }),
    contentType: "application/json",
  });
  await cdp.detach();
});

test("IM72.approval-keyboard-boundary: modifier Enter on the focused final approval cannot approve or send", async ({
  page,
}, info) => {
  const server = await open(page, false, true);
  await enter(page, "reply");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Separate approval only");
  await source.press("Control+Enter");
  const approval = page.getByRole("button", {
    name: "Send reply",
    exact: true,
  });
  await expect(approval).toBeVisible();
  const before = server.requests.length;
  await approval.press("Control+Enter");
  await approval.press("Meta+Enter");
  expect(server.requests).toHaveLength(before);
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("approval-shortcut-boundary.json", {
    body: JSON.stringify(server.requests),
    contentType: "application/json",
  });
});

test("IM72.short-enlarged: a short enlarged conversation retains history and a reachable editor with localized action floors", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 360 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        theme: "dark",
        textSize: 150,
        language: "zh-TW",
      }),
    ),
  );
  const server = await open(page);
  await page.getByRole("button", { name: "回覆主題", exact: true }).click();
  const source = page.getByLabel("完整原始碼", { exact: true });
  await source.fill("短視窗保留內容");
  const geometry = await page.locator(".source-writing").evaluate((writer) => {
    const root = writer.getRootNode() as ShadowRoot;
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    };
    return {
      writer: rect(writer),
      content: rect(writer.querySelector(".writing-content")!),
      reader: rect(root.querySelector(".reading-pane")!),
      actions: [
        ...writer.querySelectorAll(".writing-presentation-actions button"),
      ].map(rect),
    };
  });
  await info.attach("short-enlarged-geometry.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  expect(geometry.writer.height).toBeLessThanOrEqual(360 * 0.46 + 1);
  expect(geometry.reader.height).toBeGreaterThanOrEqual(96);
  expect(geometry.content.height).toBeGreaterThanOrEqual(64);
  expect(geometry.actions.every((rect) => rect.height >= 44)).toBe(true);
  await page.getByRole("button", { name: "展開寫作", exact: true }).click();
  await expect(source).toBeFocused();
  await expect(source).toHaveValue("短視窗保留內容");
  await info.attach("short-enlarged.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
});

test("IM72.contextual-chrome: the global bar is followed by panes and writing status and resume stay in the conversation", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page, false, true);
  const initial = await page.locator(".workspace").evaluate((workspace) => ({
    headerBottom: workspace.querySelector("header")!.getBoundingClientRect()
      .bottom,
    panesTop: workspace
      .querySelector(".workspace-body")!
      .getBoundingClientRect().top,
  }));
  await info.attach("contextual-chrome.json", {
    body: JSON.stringify(initial),
    contentType: "application/json",
  });
  expect(initial.panesTop).toBe(initial.headerBottom);
  await expect(
    page
      .locator(".boards-region")
      .getByRole("button", { name: "New thread", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".conversation-region")
      .getByRole("button", { name: "More thread options", exact: true }),
  ).toBeVisible();
  await enter(page, "reply");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Contextual retained writing");
  const before = server.requests.length;
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(
    page
      .locator(".bottom-resume")
      .getByRole("button", { name: "Return to writing", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Contextual retained writing",
  );
  expect(server.requests).toHaveLength(before);
});

test("IM72.visible-history: opening and expanding a docked reply leaves actual post content visible beside the retained editor", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, false, true);
  await enter(page, "reply");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const geometry = await page.locator(".reading-pane").evaluate((pane) => {
    const p = pane.getBoundingClientRect(),
      post = pane.querySelector("article")!.getBoundingClientRect();
    return {
      historyHeight: p.height,
      visiblePostHeight: Math.max(
        0,
        Math.min(p.bottom, post.bottom) - Math.max(p.top, post.top),
      ),
    };
  });
  await info.attach("usable-post-history.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  expect(geometry.visiblePostHeight).toBeGreaterThanOrEqual(96);
});

test("UI87.bottom-resume: minimizing releases the writer and fixes original destination at the bottom with footer-only Reply", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page);
  await enter(page, "addressed");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Original addressed writing");
  const handle = await source.elementHandle();
  await expect(
    page
      .locator(".conversation-heading")
      .getByRole("button", { name: "Reply to thread", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const before = await page.locator(".reading-pane").boundingBox();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const resume = page.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  const destination = page.getByRole("group", {
    name: "Writing destination",
    exact: true,
  });
  await expect(destination).toContainText("Thread 42");
  await expect(
    destination.getByRole("link", {
      name: "Addressed to Other author · Post 101",
      exact: true,
    }),
  ).toBeVisible();
  const geometry = await resume.evaluate((button) => {
    const bar = button.parentElement!;
    const r = bar.getBoundingClientRect();
    return {
      top: r.top,
      bottom: r.bottom,
      icon: !!button.querySelector("svg"),
      viewport: innerHeight,
    };
  });
  expect(geometry.bottom).toBe(geometry.viewport);
  expect(geometry.icon).toBe(true);
  const after = await page.locator(".reading-pane").boundingBox();
  expect(after!.height * after!.width).toBeGreaterThan(
    before!.height * before!.width,
  );
  await resume.click();
  expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Original addressed writing");
  expect((await stored(page)).replyTarget.postId).toBe("101");
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("bottom-resume.json", {
    body: JSON.stringify({ geometry, before, after }),
    contentType: "application/json",
  });
});

for (const width of [1439, 1440, 1706])
  test(`UI87.wide-${width}: expanded writing uses a protected reader and preferred 420px aside only when qualified`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const server = await open(page);
    await enter(page, "reply");
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("Selected original source");
    await source.evaluate((node: HTMLTextAreaElement) =>
      node.setSelectionRange(9, 17),
    );
    await source.dispatchEvent("select");
    const handle = await source.elementHandle();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const geometry = async () =>
      page.locator(".source-writing").evaluate((writer) => {
        const root = writer.getRootNode() as ShadowRoot;
        const rect = (node: Element) => {
          const r = node.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        return {
          writer: rect(writer),
          reader: rect(root.querySelector(".reading-pane")!),
        };
      });
    const wide = await geometry();
    if (width >= 1440) {
      expect(wide.writer.left).toBeGreaterThanOrEqual(wide.reader.right - 1);
      expect(wide.writer.width).toBe(420);
      expect(wide.reader.width).toBeGreaterThanOrEqual(320);
      expect(wide.writer.height).toBeGreaterThan(500);
    } else
      expect(wide.writer.top).toBeGreaterThanOrEqual(wide.reader.bottom - 1);
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect
      .poll(async () => {
        const g = await geometry();
        return g.writer.top >= g.reader.bottom - 1;
      })
      .toBe(true);
    const narrow = await geometry();
    expect(narrow.writer.top).toBeGreaterThanOrEqual(narrow.reader.bottom - 1);
    expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
    expect(
      await source.evaluate((node: HTMLTextAreaElement) => [
        node.selectionStart,
        node.selectionEnd,
      ]),
    ).toEqual([9, 17]);
    await source.press("!");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(source).toHaveValue("Selected original source");
    expect(server.requests.every((request) => request.method === "GET")).toBe(
      true,
    );
    await info.attach("wide-layout.json", {
      body: JSON.stringify({ wide, narrow }),
      contentType: "application/json",
    });
  });

test("UI87.mismatch-review: bottom resume and review retain the original addressed target after permitted browsing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page, false, true);
  await enter(page, "addressed");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Original target answer");
  const handle = await source.elementHandle();
  await page.getByRole("link", { name: "Another thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  await expect(page.locator(".bottom-resume")).toContainText("Thread 42");
  await expect(
    page
      .locator(".bottom-resume")
      .getByText(
        "Writing still targets the original destination shown here, not the current reader.",
        { exact: true },
      ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue("Original target answer");
  await source.press("Control+Enter");
  const review = page.getByRole("region", {
    name: "Prepared publication review",
    exact: true,
  });
  await expect(review).toBeVisible();
  await expect(review).toContainText("Thread 42");
  await expect(review).toContainText("Other author · Post 101");
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("original-target-review.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("UI87.reading-anchor: expansion into and out of the aside preserves a genuinely visible reader line", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page, false, true, true);
  await enter(page, "reply");
  const pane = page.locator(".reading-pane");
  await pane.evaluate((node) => (node.scrollTop = 650));
  const before = await readableLines(page);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const wide = await readableLines(page);
  await info.attach("aside-reader-anchor.json", {
    body: JSON.stringify({ before, wide }),
    contentType: "application/json",
  });
  expectPreservedReadingLine(before, wide);
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  const after = await readableLines(page);
  expectPreservedReadingLine(wide, after);
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
});

test("UI87.target-color: writing destination keeps the source-qualified board role across compact wide and bottom resume", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.locator(".brand").click();
  await page
    .locator(".board-card")
    .filter({ hasText: "Music discussion" })
    .click();
  await page
    .locator(".results-pane")
    .getByRole("link", { name: "Existing thread", exact: true })
    .click();
  await enter(page, "reply");
  const boardLabel = page
    .locator(".source-writing")
    .getByRole("group", { name: "Writing destination", exact: true })
    .locator(".category-label");
  await expect(boardLabel).toContainText("Music discussion");
  expect(
    await boardLabel.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(166, 198, 225)");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  expect(
    await boardLabel.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(166, 198, 225)");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const retained = page.locator(".bottom-resume .category-label");
  expect(
    await retained.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(166, 198, 225)");
  await info.attach("retained-target-role.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("UI87.short-restored: focused writing retains at least96px of actually visible history after a restored mismatch", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 420 });
  await open(page, false, true, true);
  await enter(page, "reply");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("Retained short reply");
  await page.getByRole("link", { name: "Another thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await page.reload();
  await expect(source).toHaveValue("Retained short reply");
  await source.focus();
  const lines = await readableLines(page);
  await info.attach("restored-short-reader.json", {
    body: JSON.stringify(lines),
    contentType: "application/json",
  });
  await info.attach("restored-short-reader.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(lines.visibleHeight).toBeGreaterThanOrEqual(96);
  const review = page.getByRole("button", {
    name: "Review publication",
    exact: true,
  });
  await review.focus();
  const after = await readableLines(page);
  expect(after.visibleHeight).toBeGreaterThanOrEqual(96);
});

test("UI87.short-resume: overflowed original author destination and mismatch can all be scrolled into the bottom bar", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 420 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "tsdm.workspace.preferences",
      JSON.stringify({
        schema: 1,
        textSize: 150,
        language: "en",
        theme: "light",
      }),
    ),
  );
  await open(page, false, true, true);
  await enter(page, "addressed");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Original addressed source");
  await page.getByRole("link", { name: "Another thread", exact: true }).click();
  await page
    .getByRole("button", { name: "Keep writing and read thread", exact: true })
    .click();
  const bar = page.locator(".bottom-resume");
  const geometry = async () =>
    bar.evaluate((node) => {
      const rect = (e: Element) => {
        const r = e.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      };
      return {
        bar: rect(node),
        author: rect(node.querySelector(".writing-destination p")!),
        mismatch: rect(node.querySelector(".resume-destination > p")!),
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    });
  await bar.evaluate((node) => (node.scrollTop = 0));
  const top = await geometry();
  expect(top.author.top).toBeGreaterThanOrEqual(top.bar.top);
  await bar.evaluate((node) => (node.scrollTop = node.scrollHeight));
  const bottom = await geometry();
  expect(bottom.mismatch.bottom).toBeLessThanOrEqual(bottom.bar.bottom);
  await info.attach("short-resume-reachability.json", {
    body: JSON.stringify({ top, bottom }),
    contentType: "application/json",
  });
});
