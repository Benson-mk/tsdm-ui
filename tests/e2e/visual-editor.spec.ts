import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    await info.attach("failed-application.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});
const actor = (id = "7") =>
  id === "guest"
    ? '<form id="lsform"></form>'
    : `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Writer ${id}</a></strong></div>`;
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
function form(member = "7", saved?: URLSearchParams) {
  const value = (name: string, fallback = "") =>
    escape(saved?.get(name) ?? fallback);
  return `${actor(member)}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&tid=42&pid=101" : "newthread"}&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="SECRET-CURRENT"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value="${value("subject", "Native title")}"><select name="typeid"><option value="0">No category</option><option value="3"${value("typeid") === "3" ? " selected" : ""}>Listening</option></select><textarea name="message">${value("message")}</textarea><label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1"${saved?.has("bbcodeoff") ? " checked" : ""}>Disable BBCode</label><label><input type="checkbox" name="htmlon" value="1" disabled>HTML</label><label>Thread price<input name="price" value="${value("price", "0")}"></label><label>Read permission<select name="readperm"><option value="0">Everyone</option><option value="10"${value("readperm") === "10" ? " selected" : ""}>Members</option></select></label><button type="submit" name="topicsubmit" value="yes">Publish</button></form>`;
}
async function fixture(
  page: Page,
  initialForm: (body: string) => string = (body) => body,
) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const state = {
    member: "7",
    outcome: "accepted",
    response: null as string | null,
    sourceGate: null as Promise<void> | null,
    postGate: null as Promise<void> | null,
    formGate: null as Promise<void> | null,
    formChange: initialForm,
    renderFailure: false,
    sourceChange: initialForm,
    threadChange: (body: string) => body,
    posts: [] as URLSearchParams[],
    requests: [] as {
      url: string;
      method: string;
      fresh: string | undefined;
    }[],
  };
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__workspace-fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    state.requests.push({
      url: url.href,
      method: request.method(),
      fresh: request.headers()["cache-control"],
    });
    let body: string;
    if (request.method() === "POST") {
      state.posts.push(new URLSearchParams(request.postData() ?? ""));
      if (state.postGate) await state.postGate;
      if (state.response)
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: state.response,
        });
      if (state.outcome === "lost") return route.abort("failed");
      if (state.outcome === "rejected") {
        state.posts.pop();
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: `<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>`,
        });
      }
      if (state.outcome === "moderation")
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: `<root><![CDATA[<script>succeedhandle_post('', '主题需要审核', {});</script>]]></root>`,
        });
      if (state.outcome === "forged")
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: `<script>const untrusted = "succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'5'})";</script>`,
        });
      return route.fulfill({
        contentType: "text/xml",
        body: `<?xml version="1.0"?><root><![CDATA[<script type="text/javascript">succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'5','tid':'42','pid':'101'});</script>]]></root>`,
      });
    }
    if (url.searchParams.get("action") === "edit") {
      if (state.sourceGate) await state.sourceGate;
      body = state.sourceChange(form(state.member, state.posts.at(-1)));
    } else if (url.searchParams.get("mod") === "post") {
      if (state.formGate) await state.formGate;
      body = state.formChange(form(state.member));
    } else if (url.searchParams.get("mod") === "viewthread")
      body = `${actor(state.member)}<div id="pt"><a href="${boardURL}">Music</a></div><div id="postlist"><h1 id="thread_subject">${escape(state.posts.at(-1)?.get("subject") ?? "")}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Authoritative stored rendered post</p></div></div></div>`;
    else
      body = `${actor(state.member)}<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
    if (state.renderFailure && url.searchParams.get("mod") === "viewthread")
      body = "<p>Malformed later rendering</p>";
    if (url.searchParams.get("mod") === "viewthread")
      body = state.threadChange(body);
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(boardURL);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  return state;
}
test("J5.editor-preservation: visual/source inspection and editing retain exact source through publication readback", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const original =
    "[B]known[/B] [unknown=v3]完整來源[/unknown] [attach]99[/attach]";
  await page.getByLabel("Complete source", { exact: true }).fill(original);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await expect(visual).toBeVisible();
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original,
  );
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await visual.press("Meta+ArrowLeft");
  await visual.press("ArrowRight");
  await visual.press("X");
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[B]kXnown[/B] [unknown=v3]完整來源[/unknown] [attach]99[/attach]",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    original,
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Visual preservation");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(
    "[B]kXnown[/B] [unknown=v3]完整來源[/unknown] [attach]99[/attach]",
  );
  expect(
    server.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toHaveLength(1);
  await info.attach("editor-publication.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("saved-source.json", {
    body: Buffer.from(
      JSON.stringify({
        source: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
});

test("J5.editor-tools: ordinary controls preserve selected text and generate forum source", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const cases = [
    ["b", "", "[b]words[/b]"],
    ["i", "", "[i]words[/i]"],
    ["u", "", "[u]words[/u]"],
    ["s", "", "[s]words[/s]"],
    ["font", "Arial", "[font=Arial]words[/font]"],
    ["size", "4", "[size=4]words[/size]"],
    ["color", "#ff0000", "[color=#ff0000]words[/color]"],
    ["sub", "", "[sub]words[/sub]"],
    ["sup", "", "[sup]words[/sup]"],
    ["url", "https://example.test", "[url=https://example.test]words[/url]"],
    ["email", "a@example.test", "[email=a@example.test]words[/email]"],
    ["align", "center", "[align=center]words[/align]"],
    ["quote", "Writer", "[quote]Writer\nwords[/quote]"],
    ["code", "", "[code]words[/code]"],
    ["indent", "", "[indent]words[/indent]"],
    ["ul", "", "[list][*]words[/list]"],
    ["ol", "", "[list=1][*]words[/list]"],
    [
      "img",
      "https://example.test/a.png",
      "[img]https://example.test/a.png[/img]",
    ],
    ["emoticon", "{:4_118:}", "{:4_118:}"],
  ];
  for (const [tool, argument, expected] of cases) {
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill("words");
    await source.selectText();
    await source.dispatchEvent("select");
    await page.getByLabel("Formatting", { exact: true }).selectOption(tool!);
    await page.getByLabel("Format value", { exact: true }).fill(argument!);
    await page
      .getByRole("button", { name: "Apply formatting", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await expect(source, tool).toHaveValue(expected!);
  }
  const combined = cases.map((item) => item[2]).join("\n");
  await page.getByLabel("Complete source", { exact: true }).fill(combined);
  await page.getByLabel("Title", { exact: true }).fill("Ordinary visual tools");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(combined);
  expect(
    server.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toHaveLength(1);
  await info.attach("ordinary-tools-stored-source.json", {
    body: Buffer.from(
      JSON.stringify({
        source: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("ordinary-tools.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-fallback: unfamiliar and malformed syntax stay inert; pasted BBCode requires interpretation through refresh", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const original =
    "[unknown]one[/unknown]\r\n[img]https://example.test/a.png[/img]\r\n[b]unclosed";
  // A current form is the external source of CRLF, which textarea.fill normalizes.
  server.formChange = (body) =>
    body.replace(
      '<textarea name="message"></textarea>',
      `<textarea name="message">${escape(original)}</textarea>`,
    );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[B]retained[/B]");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", { name: "Visual post content" });
  await visual.press("Meta+ArrowRight");
  await visual.pressSequentially(" [b]literal[/b]");
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[B]retained [b]literal[/b][/B]",
  );
  await page
    .getByRole("button", {
      name: "Interpret complete source as BBCode",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toHaveCount(0);
  expect(
    server.requests.filter((r) => new URL(r.url).hostname === "example.test"),
  ).toHaveLength(0);
  await info.attach("interpretation-recovery.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-lifecycle: source, selection and history survive view replacement and single-scale text changes", async ({
  page,
}, info) => {
  await fixture(page);
  const content =
    "[size=4][size=4]Nested[/size][/size] [unknown]kept[/unknown]";
  await page.getByLabel("Complete source", { exact: true }).fill(content);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", { name: "Visual post content" });
  const at100 = await visual
    .locator("span")
    .filter({ hasText: "Nested" })
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(at100).toBe("19px");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text size", { exact: true }).fill("90");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    visual.locator("span").filter({ hasText: "Nested" }).first(),
  ).toHaveCSS("font-size", "17.1px");
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    content,
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    content,
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    content,
  );
  await info.attach("editor-lifecycle.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-recovery-selection: visual caret maps to source recovery without changing surrounding source", async ({
  page,
}, info) => {
  await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[b]words[/b]");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", { name: "Visual post content" });
  await visual.press("Meta+ArrowLeft");
  await visual.press("ArrowRight");
  await visual.press("ArrowRight");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .selection.start,
      ),
    )
    .toBe(5);
  await page.reload();
  const source = page.getByLabel("Complete source", { exact: true });
  await expect(source).toHaveValue("[b]words[/b]");
  expect(
    await source.evaluate((el) => ({
      start: (el as HTMLTextAreaElement).selectionStart,
      end: (el as HTMLTextAreaElement).selectionEnd,
    })),
  ).toEqual({ start: 5, end: 5 });
  await info.attach("visual-caret-recovery.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-opaque: malformed, deep, referenced and executable-looking fragments remain complete and inert", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const sources = [
    '[unknown x="v"]<img src=x onerror="alert(1)">[b]inside[/b][/unknown] tail',
    "[url=javascript:alert(1)]inert[/url] [img]https://example.test/no-load.png[/img] [attach]123[/attach]",
    "[b]unclosed [table][tr][td]retained",
    "[b]".repeat(120) + "深層文字" + "[/b]".repeat(120),
    "[quote=Writer,42]original attribution[/quote]\n[size=4][size=4]Nested[/size][/size]",
  ];
  for (const content of sources) {
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await page.getByLabel("Complete source", { exact: true }).fill(content);
    await page
      .getByRole("button", { name: "Visual editor", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(content);
  }
  expect(server.requests.every((r) => new URL(r.url).origin === origin)).toBe(
    true,
  );
  await info.attach("opaque-source.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-clipboard: non-text paste cannot erase selection and copying returns inert source-bearing text", async ({
  page,
}, info) => {
  await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("keep [img]https://example.test/a.png[/img]");
  await page.getByLabel("Complete source", { exact: true }).selectText();
  await page
    .getByLabel("Complete source", { exact: true })
    .dispatchEvent("select");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", { name: "Visual post content" });
  const copied = await visual.evaluate((el) => {
    const data = new DataTransfer();
    el.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
    return {
      text: data.getData("text/plain"),
      html: data.getData("text/html"),
    };
  });
  expect(copied.text).toBe("keep [img]https://example.test/a.png[/img]");
  expect(copied.html).not.toContain("<img");
  await visual.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/html", '<img src="https://example.test/image.png">');
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  });
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "keep [img]https://example.test/a.png[/img]",
  );
  await info.attach("clipboard.json", {
    body: Buffer.from(JSON.stringify(copied)),
    contentType: "application/json",
  });
});

test("J5.editor-font: multiword font names render without altering their source", async ({
  page,
}, info) => {
  await fixture(page);
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill("[font=Times New Roman]words[/font]");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await expect(
    page
      .getByRole("textbox", { name: "Visual post content" })
      .locator("span")
      .first(),
  ).toHaveCSS("font-family", '"Times New Roman"');
  await info.attach("multiword-font.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-account-copy: uncertain visual interpretation follows deliberate account text copy", async ({
  page,
}, info) => {
  const server = await fixture(page);
  await page.getByLabel("Complete source", { exact: true }).fill("words");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Visual post content" })
    .pressSequentially(" [b]literal[/b]");
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  server.member = "8";
  await page
    .getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Replace with text copy", exact: true })
    .click();
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toHaveCount(0);
  expect(server.posts).toHaveLength(0);
  await info.attach("copied-source-interpretation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.editor-line-endings: untouched CRLF survives visual inspection and a source edit through saved-source readback", async ({
  page,
}, info) => {
  const original = "[B]one[/B]\r\n[unknown]two[/unknown]";
  const server = await fixture(page, (body) =>
    body.replace(
      '<textarea name="message"></textarea>',
      `<textarea name="message">${escape(original).replaceAll("\r", "&#13;")}</textarea>`,
    ),
  );
  server.sourceChange = (body) => body.replaceAll("\r", "&#13;");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
          .source,
    ),
  ).toBe(original);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill(original.replaceAll("\r\n", "\n") + "!");
  await page
    .getByLabel("Title", { exact: true })
    .fill("Preserved line endings");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(original + "!");
  await info.attach("stored-line-endings.json", {
    body: Buffer.from(
      JSON.stringify({
        source: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
});

const editorLocales = [
  {
    language: "en",
    source: "Complete source",
    visual: "Visual editor",
    sourceMode: "Source editor",
    content: "Visual post content",
    formatting: "Formatting",
    argument: "Format value",
    apply: "Apply formatting",
    review: "Review publication",
    reviewBlocked:
      "Review the complete source and resolve its interpretation before publication.",
    publish: "Publish thread",
    emoticon: "Choose a valid emoticon token.",
    quote: "Use a plain author name.",
    font: "This attribute cannot be represented safely.",
    interpretation:
      "Source is retained. Resolve the interpretation of the affected literal fragments first.",
  },
  {
    language: "zh-CN",
    source: "完整源码",
    visual: "可视编辑",
    sourceMode: "源码编辑",
    content: "可视帖子内容",
    formatting: "格式",
    argument: "格式值",
    apply: "应用格式",
    review: "检查发布",
    reviewBlocked: "请检查完整源码，并在发布前明确其解释方式。",
    publish: "发布主题",
    emoticon: "请选择有效的表情代码。",
    quote: "请使用不含标记的作者名称。",
    font: "无法安全表示此属性。",
    interpretation: "源码已保留；请先明确受影响字面片段的解释。",
  },
  {
    language: "zh-TW",
    source: "完整原始碼",
    visual: "視覺編輯",
    sourceMode: "原始碼編輯",
    content: "視覺文章內容",
    formatting: "格式",
    argument: "格式值",
    apply: "套用格式",
    review: "檢查發佈",
    reviewBlocked: "請檢查完整原始碼，並在發佈前明確指定其解讀方式。",
    publish: "發佈主題",
    emoticon: "請選擇有效的表情代碼。",
    quote: "請使用不含標記的作者名稱。",
    font: "無法安全表示此屬性。",
    interpretation: "原始碼已保留；請先明確指定受影響字面片段的解讀方式。",
  },
] as const;
for (const locale of editorLocales) {
  for (const [tool, invalid] of [
    ["emoticon", "invalid"],
    ["quote", "[b]author[/b]"],
    ["font", "unsafe]"],
  ] as const)
    test(`J5.editor-validation-locale-${locale.language}-${tool}: failed ordinary command explains refusal without changing source or selection`, async ({
      page,
    }, info) => {
      const server = await fixture(page);
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.locator("#interface-language").selectOption(locale.language);
      await page.keyboard.press("Escape");
      const source = page.getByLabel(locale.source, { exact: true });
      const retained = "[unknown]原文[/unknown] words";
      await source.fill(retained);
      await source.evaluate((element) => {
        const field = element as HTMLTextAreaElement;
        field.setSelectionRange(field.value.length - 5, field.value.length);
        field.dispatchEvent(new Event("select", { bubbles: true }));
      });
      await page
        .getByLabel(locale.formatting, { exact: true })
        .selectOption(tool);
      await page.getByLabel(locale.argument, { exact: true }).fill(invalid);
      await page
        .getByRole("button", { name: locale.apply, exact: true })
        .click();
      await expect(page.getByText(locale[tool], { exact: true })).toBeVisible();
      await info.attach("localized-diagnostic.png", {
        body: await page.getByText(locale[tool], { exact: true }).screenshot(),
        contentType: "image/png",
      });
      await page
        .getByRole("button", { name: locale.sourceMode, exact: true })
        .click();
      await expect(source).toHaveValue(retained);
      expect(
        await source.evaluate((element) => {
          const field = element as HTMLTextAreaElement;
          return field.value.slice(field.selectionStart, field.selectionEnd);
        }),
      ).toBe("words");
      expect(server.posts).toHaveLength(0);
      await info.attach("localized-refusal.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });
  test(`J5.editor-interpretation-locale-${locale.language}: source ambiguity stays editable and blocked with a localized explanation`, async ({
    page,
  }, info) => {
    const server = await fixture(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption(locale.language);
    await page.keyboard.press("Escape");
    const source = page.getByLabel(locale.source, { exact: true });
    await source.fill("retained");
    await page
      .getByRole("button", { name: locale.visual, exact: true })
      .click();
    const visual = page.getByRole("textbox", {
      name: locale.content,
      exact: true,
    });
    await visual.press("Meta+ArrowRight");
    await visual.pressSequentially(" [b]literal[/b]");
    await page
      .getByRole("button", { name: locale.sourceMode, exact: true })
      .click();
    await source.fill("retained [b]changed[/b]");
    await page
      .getByRole("button", { name: locale.visual, exact: true })
      .click();
    await expect(
      page.getByText(locale.interpretation, { exact: true }),
    ).toBeVisible();
    await expect(source).toBeVisible();
    await expect(source).toHaveValue("retained [b]changed[/b]");
    await page
      .getByRole("button", { name: locale.review, exact: true })
      .click();
    await expect(
      page.getByText(locale.reviewBlocked, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: locale.publish, exact: true }),
    ).toHaveCount(0);
    expect(server.posts).toHaveLength(0);
    await info.attach("localized-interpretation.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

test("J5.editor-diagnostic-language-change: an existing refusal follows language changes without another command or source mutation", async ({
  page,
}, info) => {
  const server = await fixture(page);
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[unknown]原文[/unknown] unchanged");
  await page.getByLabel("Formatting", { exact: true }).selectOption("emoticon");
  await page.getByLabel("Format value", { exact: true }).fill("invalid");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  for (const locale of [editorLocales[1], editorLocales[2], editorLocales[0]]) {
    await page.locator(".workspace > header button").first().click();
    await page.locator("#interface-language").selectOption(locale.language);
    await page.keyboard.press("Escape");
    await expect(
      page.getByText(locale.emoticon, { exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[unknown]原文[/unknown] unchanged",
  );
  expect(server.posts).toHaveLength(0);
  await info.attach("diagnostic-language-change.json", {
    body: Buffer.from(
      JSON.stringify({ posts: server.posts, requests: server.requests }),
    ),
    contentType: "application/json",
  });
});
