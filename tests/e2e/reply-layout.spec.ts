import { selectSourceEditor } from "./editor-controls";
import { writingDetailAction } from "./editor-controls";
import { revealReplyGroup } from "./editor-controls";
import { chooseAttachments } from "./editor-controls";
import { readableLines, expectPreservedReadingLine } from "./readable-lines";

import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { openNewThread } from "./navigation-ui";

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
  longTarget = false,
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
      body: JSON.stringify({
        document: longTarget
          ? body.replaceAll(
              "Other author",
              "很長的中文回覆對象名稱用來確認窄螢幕排版不會遮擋寫作操作",
            )
          : body,
      }),
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
    await openNewThread(page);
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
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery") ?? "null")
        ?.writing,
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

test("UI105.resting: compact reply returns to the exact reading line after full-column editing", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const server = await open(page, false, true, true);
  await enter(page, "reply");
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await expect(visual).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reply tools", exact: true }),
  ).toBeVisible();
  const geometry = await page.locator(".source-writing").evaluate((writer) => {
    const box = (node: Element) => {
      const r = node.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        height: r.height,
      };
    };
    return {
      writer: box(writer),
      input: box(writer.querySelector("[contenteditable=true]")!),
      plus: box(writer.querySelector('[aria-label="Reply tools"]')!),
      review: box(writer.querySelector(".primary-action")!),
    };
  });
  expect(geometry.writer.height).toBeLessThan(105);
  expect(Math.abs(geometry.plus.top - geometry.review.top)).toBeLessThanOrEqual(
    1,
  );
  expect(geometry.input.top).toBeLessThan(geometry.plus.bottom);
  await visual.fill("Retained visual reply");
  const handle = await visual.elementHandle();
  const pane = page.locator(".reading-pane");
  await pane.evaluate((node) => (node.scrollTop = 650));
  const before = await readableLines(page);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  // The owner's #112 revision gives expanded editing the full column.
  // Reading stays mounted and must return to this exact line when compacted.
  await expect(pane).toBeHidden();
  const expanded = await readableLines(page);
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  const after = await readableLines(page);
  expectPreservedReadingLine(before, after);
  expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(visual).toHaveText("Retained visual reply");
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("resting-and-anchor.json", {
    body: JSON.stringify({ geometry, before, expanded, after }),
    contentType: "application/json",
  });
});

test("UI105.continuity: protected source, selected range, undo, addressed target and attachment survive both presentations", async ({
  page,
}, info) => {
  const server = await open(page, false, true, true);
  await enter(page, "addressed");
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await page
    .getByRole("button", { name: "Switch to source editor", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  const original =
    "Selected 中文\n[unknown=raw]untouched[/unknown]\n[b]bold[/b]";
  await source.fill(original);
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(0, 8),
  );
  await source.dispatchEvent("select");
  await revealReplyGroup(page, "Text formatting");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  const formatted =
    "[b]Selected[/b] 中文\n[unknown=raw]untouched[/unknown]\n[b]bold[/b]";
  await expect(source).toHaveValue(formatted);
  await chooseAttachments(page, {
    name: "保留附件.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("retained bytes"),
  });
  await expect(
    page.getByText("Selected · 保留附件.txt", { exact: true }),
  ).toBeVisible();
  await selectSourceEditor(page);
  await source.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(3, 11),
  );
  await source.dispatchEvent("select");
  const handle = await source.elementHandle();
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await expect(source).toBeFocused();
  expect(
    await source.evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]),
  ).toEqual([3, 11]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue(original);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(source).toHaveValue(formatted);
  await page
    .getByRole("button", { name: "Switch to visual editor", exact: true })
    .click();
  await expect(
    page.getByText(
      "Some markup is protected in visual mode. Edit its complete source to change it.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Switch to source editor", exact: true })
    .click();
  await expect(source).toHaveValue(formatted);
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(source).toHaveValue(formatted);
  await expect(page.locator(".reply-target-strip")).toContainText(
    "Other author",
  );
  await expect(
    page.getByText("Selected · 保留附件.txt", { exact: true }),
  ).toBeVisible();
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("retained-source-target-attachment.json", {
    body: JSON.stringify({
      original,
      formatted,
      writing: await stored(page),
      requests: server.requests,
    }),
    contentType: "application/json",
  });
});

for (const width of [1440, 905, 390])
  for (const textSize of [100, 125])
    test(`UI105.owner-review-${width}-${textSize}: full application compact and expanded review unit remains reachable`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ textSize, crowded }) => {
          localStorage.setItem(
            "tsdm.workspace.preferences",
            JSON.stringify({
              schema: 1,
              theme: "light",
              language: "en",
              textSize,
            }),
          );
          if (crowded) {
            const original = Storage.prototype.setItem;
            Storage.prototype.setItem = function (key, value) {
              if (key === "tsdm.workspace.recovery")
                throw new DOMException(
                  "Synthetic host storage refused",
                  "QuotaExceededError",
                );
              return original.call(this, key, value);
            };
          }
        },
        { textSize, crowded: width === 390 },
      );
      const server = await open(page, false, true, true, width === 390);
      await enter(page, width === 390 ? "addressed" : "reply");
      const visual = page.getByRole("textbox", {
        name: "Visual post content",
        exact: true,
      });
      await visual.fill("短回覆，保留閱讀空間。");
      if (width === 390) {
        await page
          .getByRole("button", { name: "Reply tools", exact: true })
          .click();
        await chooseAttachments(page, {
          name: "需要保留的附件.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("owner review fixture"),
        });
        await page
          .getByRole("button", { name: "Reply tools", exact: true })
          .click();
      }
      const directory = `evidence/runs/ui-ux-105-owner-review-${createHash("sha256").update(readFileSync("dist/tsdm-ui.user.js")).digest("hex")}`;
      mkdirSync(directory, { recursive: true });
      const capture = async (mode: string) => {
        await page.locator(".source-writing .primary-action").focus();
        const geometry = await page
          .locator(".source-writing")
          .evaluate((writer) => {
            const root = writer.getRootNode() as ShadowRoot;
            const rect = (node: Element) => {
              const r = node.getBoundingClientRect();
              return {
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                right: r.right,
                height: r.height,
              };
            };
            return {
              writer: rect(writer),
              review: rect(writer.querySelector(".primary-action")!),
              reader: rect(root.querySelector(".reading-pane")!),
              viewport: { width: innerWidth, height: innerHeight },
              pageWidth: document.documentElement.scrollWidth,
              scrollOwners: [
                ...root.querySelectorAll(
                  ".workspace,.conversation-region,.writing-content",
                ),
              ].map((node) => ({
                width: node.clientWidth,
                scrollWidth: node.scrollWidth,
              })),
            };
          });
        expect(geometry.review.bottom).toBeLessThanOrEqual(900);
        expect(geometry.review.top).toBeGreaterThanOrEqual(geometry.writer.top);
        if (mode === "compact")
          expect(geometry.reader.height).toBeGreaterThanOrEqual(96);
        else expect(geometry.reader.height).toBe(0);
        expect(geometry.pageWidth).toBeLessThanOrEqual(width);
        expect(
          geometry.scrollOwners.every(
            (owner) => owner.scrollWidth <= owner.width + 1,
          ),
        ).toBe(true);
        const name = `${width}px-${textSize}percent-${mode}`;
        writeFileSync(
          `${directory}/${name}.json`,
          JSON.stringify(geometry, null, 2),
        );
        const image = await page.screenshot();
        writeFileSync(`${directory}/${name}.png`, image);
        await info.attach(`${name}.png`, {
          body: image,
          contentType: "image/png",
        });
        return geometry;
      };
      const compact = await capture("compact");
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
      const expanded = await capture("expanded");
      const candidate = readFileSync("dist/tsdm-ui.user.js");
      await info.attach("owner-review-geometry.json", {
        body: JSON.stringify({
          compact,
          expanded,
          requests: server.requests,
          sha256: createHash("sha256").update(candidate).digest("hex"),
        }),
        contentType: "application/json",
      });
    });

test("UI105.tools-preview: compact tools execute full commands and optional inert Preview preserves exact writing before explicit Send", async ({
  page,
}, info) => {
  const server = await open(page, false, true, true);
  await enter(page, "reply");
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  const source = page.getByLabel("Complete source", { exact: true });
  // Source is selected once; repeating a mode selection is no longer an action.
  await selectSourceEditor(page);
  const cases = [
    { label: "Italic", expected: "[i]Text[/i]" },
    { label: "Unordered list", expected: "[list][*]Text[/list]" },
    { label: "Code", expected: "[code]Text[/code]" },
    {
      label: "Color",
      value: "#ff0000",
      expected: "[color=#ff0000]Text[/color]",
    },
    {
      label: "Link URL",
      value: "https://example.org/path",
      expected: "[url=https://example.org/path]Text[/url]",
    },
    {
      label: "Named quote",
      value: "Author",
      expected: "[quote]Author\nText[/quote]",
    },
    { label: "Reply-to-view hidden block", expected: "[hide]Text[/hide]" },
  ];
  const observed = [];
  for (const item of cases) {
    await selectSourceEditor(page);
    await source.fill("Text");
    await source.selectText();
    await revealReplyGroup(
      page,
      ["Italic", "Color"].includes(item.label)
        ? "Text formatting"
        : item.label === "Unordered list"
          ? "Paragraph"
          : "Insert",
    );
    await page.getByRole("button", { name: item.label, exact: true }).click();
    if (item.value) {
      await page.getByLabel(item.label, { exact: true }).fill(item.value);
      await page
        .getByRole("button", { name: `Apply ${item.label}`, exact: true })
        .click();
    }
    await page.keyboard.press("Escape");
    await selectSourceEditor(page);
    await expect(source).toHaveValue(item.expected);
    observed.push({ command: item.label, source: await source.inputValue() });
  }
  await source.fill(
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]",
  );
  await page
    .getByRole("button", { name: "Switch to visual editor", exact: true })
    .click();
  const body = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await body.locator("td").first().click();
  await revealReplyGroup(page, "Table");
  await page
    .getByLabel("Table operation", { exact: true })
    .selectOption({ label: "Add row after" });
  await page
    .getByRole("button", { name: "Apply table operation", exact: true })
    .click();
  await expect(body.locator("tr")).toHaveCount(3);
  await selectSourceEditor(page);
  await expect(source).toHaveValue(
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td][/td][td][/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]",
  );
  await source.fill("[b]Preview exact[/b] [unknown]raw[/unknown]");
  await (await writingDetailAction(page, "Preview")).click();
  const preview = page.getByRole("region", { name: "Preview", exact: true });
  await expect(preview).toContainText("Preview exact");
  await expect(preview).toContainText("[unknown]raw[/unknown]");
  await expect(source).toHaveValue(
    "[b]Preview exact[/b] [unknown]raw[/unknown]",
  );
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("actual-commands-and-review.json", {
    body: JSON.stringify({ observed, requests: server.requests }),
    contentType: "application/json",
  });
});

test("UI105.keyboard-growth: compact input grows, plus enters tools, Escape restores writing and composing cannot resize", async ({
  page,
}, info) => {
  const server = await open(page, false, true, true);
  await enter(page, "reply");
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  const plus = page.getByRole("button", { name: "Reply tools", exact: true });
  await plus.focus();
  await page.keyboard.press("Tab");
  await expect(visual).toBeFocused();
  const short = (await visual.boundingBox())!.height;
  await visual.fill("First line\n第二行\n第三行\n第四行");
  const grown = (await visual.boundingBox())!.height;
  expect(grown).toBeGreaterThan(short);
  expect(grown).toBeLessThanOrEqual(140);
  await plus.click();
  await expect(
    page.getByRole("button", { name: "Switch to source editor", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(visual).toBeFocused();
  await expect(plus).toHaveAttribute("aria-expanded", "false");
  await visual.dispatchEvent("compositionstart", { data: "測" });
  const expansion = page.getByRole("button", {
    name: "Expand writing",
    exact: true,
  });
  await expect(expansion).toBeEnabled();
  await expansion.dispatchEvent("click");
  await expect(page.locator(".source-writing")).not.toHaveClass(
    /writing-expanded/,
  );
  await visual.dispatchEvent("keydown", {
    key: "Enter",
    ctrlKey: true,
    isComposing: true,
  });
  await visual.dispatchEvent("compositionend", { data: "測" });
  await expect(page.locator(".source-writing")).toHaveClass(/writing-expanded/);
  expect(server.requests.every((request) => request.method === "GET")).toBe(
    true,
  );
  await info.attach("growth-keyboard.json", {
    body: JSON.stringify({ short, grown, requests: server.requests }),
    contentType: "application/json",
  });
});

test("UI105.attachment-chip: a selected attachment has one visible status chip and no empty message surface", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, false, true);
  await enter(page, "reply");
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await chooseAttachments(page, {
    name: "chip.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("selected file"),
  });
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await expect(
    page.getByText("Selected · chip.txt", { exact: true }),
  ).toBeVisible();
  const messages = await page
    .getByRole("region", { name: "Attachment authoring", exact: true })
    .locator("p")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        text: node.textContent?.trim(),
        height: node.getBoundingClientRect().height,
      })),
    );
  await info.attach("attachment-chip.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("attachment-chip-geometry.json", {
    body: JSON.stringify(messages),
    contentType: "application/json",
  });
  expect(
    messages.filter((message) => !message.text && message.height > 0),
  ).toEqual([]);
});
