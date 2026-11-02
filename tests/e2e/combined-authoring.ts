import { expect, type Page } from "@playwright/test";

export const combinedSource =
  "[spoiler=Combined][hide][table][tr][td]第一格[/td][td][b]Second[/b][/td][/tr][/table][/hide][/spoiler]\n[quote=Extra author]Additional named quote[/quote]\n";

// Complete application interaction shared by the combined journeys. No client,
// workspace, editor or host implementation is substituted here.
export async function richRoundTrip(page: Page, source: string) {
  const editor = page.getByLabel("Complete source", { exact: true });
  await expect(editor).toHaveValue(source);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await expect(visual.locator("table")).toHaveCount(1);
  await expect(visual.locator("td")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  await editor.focus();
  await editor.press("ControlOrMeta+End");
  await editor.press("Shift+ArrowLeft");
  const selection = await editor.evaluate((node: HTMLTextAreaElement) => [
    node.selectionStart,
    node.selectionEnd,
    node.selectionDirection,
  ]);
  for (const size of [90, 100, 150]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const range = page.getByLabel("Text size", { exact: true });
    await range.focus();
    await range.press("Home");
    for (let value = 70; value < size; value += 10)
      await range.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(editor).toHaveValue(source);
    expect(
      await editor.evaluate((node: HTMLTextAreaElement) => [
        node.selectionStart,
        node.selectionEnd,
        node.selectionDirection,
      ]),
    ).toEqual(selection);
    await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
      "data-spacing",
      size < 100 ? "compact" : "default",
    );
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-TW");
  await page.keyboard.press("Escape");
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "lang",
    "zh-TW",
  );
  const geometry = await page.locator("#tsdm-workspace").evaluate((host) => ({
    width: host.clientWidth,
    scroll: host.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
  await page.getByRole("button", { name: "設定", exact: true }).click();
  await page.locator("#interface-language").selectOption("en");
  await page.getByLabel("Text size", { exact: true }).fill("100");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(editor).toHaveValue(source);
  await page.reload();
  await expect(editor).toHaveValue(source);
}
