import type { Page } from "@playwright/test";
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
  if ((await details.getAttribute("open")) === null)
    await details.locator(":scope > summary").click();
}
export async function writingTool(page: Page, name: string) {
  await revealWritingTools(page);
  return page.getByRole("button", { name, exact: true });
}
export async function writingDetailAction(page: Page, name: string) {
  await revealWritingDetails(page);
  return page.getByRole("button", { name, exact: true });
}
export async function revealAdvanced(page: Page) {
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
  if (!common.includes(command)) await revealAdvanced(page);
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
