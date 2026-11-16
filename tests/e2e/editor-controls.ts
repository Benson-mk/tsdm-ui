import { clickThreadTool } from "./navigation-ui";
import { expect, type Page, type Locator } from "@playwright/test";
import { editorText } from "../../src/components/editor-strings";
import type { Preferences } from "../../src/workspace/preferences";

const labels: Record<string, string> = {
  b: "Bold",
  i: "Italic",
  u: "Underline",
  s: "Strike",
  font: "Font",
  size: "Size",
  color: "Color",
  sub: "Subscript",
  sup: "Superscript",
  align: "Alignment",
  ul: "Unordered list",
  ol: "Ordered list",
  indent: "Indent",
  listIndent: "Indent list",
  outdent: "Outdent list",
  url: "Link URL",
  email: "Email",
  img: "Image URL",
  emoticon: "Emoticon code",
  quote: "Named quote",
  code: "Code",
  spoiler: "Spoiler",
  hide: "Reply-to-view hidden block",
  unwrap: "Unwrap block",
};
const common = ["b", "i", "u", "s", "ul", "ol", "code"];
const parameters = [
  "font",
  "size",
  "color",
  "align",
  "url",
  "email",
  "img",
  "emoticon",
  "quote",
  "spoiler",
];
export async function revealWritingTools(page: Page) {
  await page
    .getByRole("button", {
      name: /^(Expand writing|Compact writing|展开写作|紧凑写作|展開寫作|精簡寫作)$/,
      exact: true,
    })
    .waitFor({ state: "visible" });
  const expand = page.getByRole("button", {
    name: /^(Expand writing|展开写作|展開寫作)$/,
    exact: true,
  });
  if (await expand.isVisible()) await expand.click();
}
export async function revealWritingDetails(page: Page) {
  const details = page.locator(".writing-details");
  if (!(await details.count())) return;
  if ((await details.getAttribute("open")) === null)
    await details.locator(":scope > summary").click();
}
export async function writingTool(page: Page, name: string) {
  await revealWritingTools(page);
  const command = Object.entries(labels).find(
    ([, label]) => label === name,
  )?.[0];
  if (command && (await page.locator(".reply-editing-toolbar").count()))
    await revealReplyGroup(page, formattingGroup(command));
  return page.getByRole("button", { name, exact: true });
}
export async function writingDetailAction(page: Page, name: string) {
  if (
    (await page.locator(".reply-editing-toolbar").count()) &&
    [
      "Preview",
      "预览",
      "預覽",
      "Check current account and form",
      "Start an ordinary reply",
      "Return to reading",
      "返回阅读",
      "返回閱讀",
    ].includes(name)
  ) {
    await revealReplyToolbar(page);
    await page
      .getByRole("button", {
        name: /^(More writing actions|更多写作操作|更多寫作操作)$/,
        exact: true,
      })
      .click();
    return page.getByRole("menuitem", { name, exact: true });
  }
  await revealWritingDetails(page);
  return page.getByRole("button", { name, exact: true });
}
async function revealReplyToolbar(page: Page) {
  if (!(await page.locator(".reply-editing-toolbar").isVisible())) {
    const trigger = page.getByRole("button", {
      name: /^(Reply tools|回覆工具)$/,
      exact: true,
    });
    if (await trigger.isVisible()) await trigger.click();
    else await revealWritingTools(page);
  }
}
export async function revealReplyGroup(page: Page, name: string) {
  await revealReplyToolbar(page);
  const trigger = page.getByRole("button", { name, exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.click();
}
export async function revealWritingOptions(page: Page) {
  if (await page.locator(".reply-editing-toolbar").count())
    await revealReplyGroup(page, "Current form options");
  else await revealWritingTools(page);
}
export async function chooseAttachments(
  page: Page,
  files: Parameters<Locator["setInputFiles"]>[0],
) {
  if (await page.locator(".reply-editing-toolbar").count()) {
    await revealReplyToolbar(page);
    const chooser = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Select attachments", exact: true })
      .click();
    await (await chooser).setFiles(files);
  } else
    await page
      .getByLabel("Select attachments", { exact: true })
      .setInputFiles(files);
}
function formattingGroup(command: string) {
  return ["b", "i", "u", "s", "font", "size", "color", "sub", "sup"].includes(
    command,
  )
    ? "Text formatting"
    : ["align", "ul", "ol", "indent", "listIndent", "outdent"].includes(command)
      ? "Paragraph"
      : "Insert";
}
export async function revealAdvanced(page: Page, group?: "Mentions" | "Table") {
  await page.locator(".source-writing").waitFor({ state: "visible" });
  if (await page.locator(".reply-editing-toolbar").count()) {
    if (!group)
      throw new Error(
        "Ordinary reply journey must name the advanced toolbar group",
      );
    return revealReplyGroup(page, group);
  }
  await revealWritingTools(page);
  const details = page.locator(".advanced-authoring");
  if ((await details.getAttribute("open")) === null)
    await details.locator(":scope > summary").click();
}
// Exercise named public controls. Expected BBCode remains authored in each case.
export async function applyFormatting(
  page: Page,
  command: string,
  value = "",
  language: Preferences["language"] = "en",
) {
  await revealWritingTools(page);
  const label = editorText(labels[command] ?? command, language);
  if (await page.locator(".reply-editing-toolbar").count())
    await revealReplyGroup(
      page,
      editorText(formattingGroup(command), language),
    );
  else if (!common.includes(command)) await revealAdvanced(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  if (parameters.includes(command)) {
    await page.getByLabel(label, { exact: true }).fill(value);
    await page
      .getByRole("button", {
        name: `${editorText("Apply", language)} ${label}`,
        exact: true,
      })
      .click();
  }
}

// Legacy source-specific journeys explicitly choose their mode now that ordinary
// replies start visual. This drives public controls and leaves tools available.
export async function selectSourceEditor(page: Page) {
  await page.locator(".source-writing").waitFor({ state: "visible" });
  const plus = page.getByRole("button", {
    name: /^(Reply tools|回覆工具)$/,
    exact: true,
  });
  if (await plus.count()) {
    if ((await plus.getAttribute("aria-expanded")) === "false")
      await plus.click();
  }
  const sourceMode = page.getByRole("button", {
    name: /^(Switch to source editor|切换到源码编辑|切換至原始碼編輯|Source editor|源码编辑|原始碼編輯)$/,
    exact: true,
  });
  // Expanded ordinary replies expose the toolbar directly, without a plus.
  if (await sourceMode.isVisible()) await sourceMode.click();
  return page.getByRole("textbox", {
    name: /^(Complete source|完整源码|完整原始碼)$/,
    exact: true,
  });
}

// Quiet successful recovery has no diagnostic UI. Observe the real committed
// browser row and its page-session acknowledgement, without invoking app code.
export async function waitForReplySaved(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const session = JSON.parse(
          sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
        );
        const writing = session?.writing;
        const thread = writing?.replyTarget?.threadId;
        const checkpoint = session?.replyCheckpoints?.[thread];
        if (!thread || !checkpoint) return false;
        const row = await new Promise<
          | {
              variants: {
                version: string;
                context: Record<string, unknown> | null;
              }[];
            }
          | undefined
        >((resolve, reject) => {
          const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("threads", "readonly"),
              read = tx.objectStore("threads").get(thread);
            tx.oncomplete = () => {
              db.close();
              resolve(read.result);
            };
            tx.onabort = () => {
              db.close();
              reject(tx.error);
            };
          };
        });
        const head = row?.variants.find(
          (v) => v.version === checkpoint.version,
        );
        if (!head) return false;
        if (head.context === null)
          return writing.source === "" && !writing.uploads?.length;
        const ordered = (value: unknown): unknown =>
          Array.isArray(value)
            ? value.map(ordered)
            : value && typeof value === "object"
              ? Object.fromEntries(
                  Object.entries(value)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, item]) => [key, ordered(item)]),
                )
              : value;
        return [
          "id",
          "source",
          "title",
          "replyTarget",
          "options",
          "uploadedReferences",
        ].every(
          (key) =>
            JSON.stringify(ordered(head.context?.[key])) ===
            JSON.stringify(ordered(writing[key])),
        );
      }),
    )
    .toBe(true);
}

// Owner removed ordinary Hide. These journeys explicitly retain the mounted
// composer beside the reader and never claim the old hidden/bottom-resume state.
export async function compactReplyBesideReader(page: Page) {
  await page.keyboard.press("Escape");
  const compact = page.getByRole("button", {
    name: "Compact writing",
    exact: true,
  });
  if (await compact.isVisible()) await compact.click();
  const tools = page.getByRole("button", { name: "Reply tools", exact: true });
  if (
    (await tools.isVisible()) &&
    (await tools.getAttribute("aria-expanded")) === "true"
  )
    await tools.click();
  await expect(page.locator(".reply-composer")).toBeVisible();
  await expect(page.locator(".reply-composer")).not.toHaveClass(
    /writing-expanded/,
  );
  await expect(page.locator(".bottom-resume")).toHaveCount(0);
}

// Explicit replacement setup for fixture-only account/file changes: real reading
// observes native account evidence. This never invokes Check, Send or internal state.
export async function refreshReplyFromNative(page: Page) {
  await compactReplyBesideReader(page);
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      new URL(r.url()).searchParams.get("mod") === "viewthread",
  );
  await clickThreadTool(page, "Refresh thread");
  await (await response).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await revealReplyToolbar(page);
}
