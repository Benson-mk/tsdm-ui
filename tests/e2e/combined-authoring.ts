import { revealWritingTools } from "./editor-controls";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { expect, type Page, type TestInfo } from "@playwright/test";

export const combinedSource =
  "[spoiler=Combined][hide][table][tr][td]第一格[/td][td][b]Second[/b][/td][/tr][/table][/hide][/spoiler]\n[quote=Extra author]Additional named quote[/quote]\n";

// UX57 extends existing pending/uncertain/attachment journeys through the same
// application controls. The caller's independent HTTP fixture still owns effects.
export async function writingPresentationRoundTrip(
  page: Page,
  info?: TestInfo,
) {
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  const before = await read();
  const size = page.getByRole("button", {
    name: /^(Expand writing|Compact writing)$/,
  });
  await size.click();
  await size.click();
  const viewport = page.viewportSize();
  for (const width of [390, 768, 1440])
    await page.setViewportSize({ width, height: 900 });
  if (viewport) await page.setViewportSize(viewport);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const retained = page.locator(".retained-writing");
  await expect(page.locator(".bottom-resume")).toBeVisible();
  if (
    before.attempts?.some((a: { status: string }) =>
      ["pending", "uncertain", "moderation"].includes(a.status),
    ) ||
    before.draftAttempts?.some((a: { status: string }) =>
      ["pending", "uncertain", "moderation"].includes(a.status),
    )
  )
    await expect(
      retained.getByText(
        /retained operation is pending or its outcome needs checking/,
      ),
    ).toBeVisible();
  if (before.redPacket)
    await expect(
      retained.getByText(/Red-packet writing is retained/),
    ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  expect(await read()).toEqual(before);
  if (info)
    await info.attach("presentation-retained-writing.json", {
      body: JSON.stringify({ before, after: await read() }, null, 2),
      contentType: "application/json",
    });
}

// Complete application interaction shared by the combined journeys. No client,
// workspace, editor or host implementation is substituted here.
export async function richRoundTrip(page: Page, source: string) {
  await writingPresentationRoundTrip(page);
  const editor = page.getByLabel("Complete source", { exact: true });
  await expect(editor).toHaveValue(source);
  await revealWritingTools(page);
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
    await openSettings(page);
    const range = page.getByLabel("Text size", { exact: true });
    await range.focus();
    await range.press("Home");
    for (let value = 70; value < size; value += 10)
      await range.press("ArrowRight");
    await closeSettingsToWorkspace(page);
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
  await openSettings(page);
  await page.locator("#interface-language").selectOption("zh-TW");
  await closeSettingsToWorkspace(page);
  await expect(page.locator("#tsdm-workspace")).toHaveAttribute(
    "lang",
    "zh-TW",
  );
  const geometry = await page.locator("#tsdm-workspace").evaluate((host) => ({
    width: host.clientWidth,
    scroll: host.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
  await openSettings(page);
  await page.locator("#interface-language").selectOption("en");
  await page.getByLabel("Text size", { exact: true }).fill("100");
  await closeSettingsToWorkspace(page);
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
