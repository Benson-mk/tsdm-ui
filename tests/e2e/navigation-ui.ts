import { expect, type Page } from "@playwright/test";

// A real UI step for journeys whose next control is in narrow navigation.
export async function revealNavigation(page: Page) {
  const trigger = page.getByRole("button", {
    name: /^(Boards pane|版块面板|版塊面板)$/,
  });
  if ((page.viewportSize()?.width ?? 1280) <= 959) {
    // A viewport resize can resolve before Vue applies the docking transition.
    await expect(page.locator(".workspace-body")).toHaveAttribute(
      "data-boards-collapsed",
      "true",
    );
    if (await page.locator(".pane-drawer").isVisible())
      await page.keyboard.press("Escape");
    await expect(trigger).toBeVisible();
    if ((await trigger.getAttribute("aria-expanded")) === "false")
      await trigger.click();
  }
}

export async function openSettings(page: Page) {
  // Viewport events update docking on the next animation frame.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const trigger = page.getByRole("button", {
    name: /^(Settings|设置|設定)$/,
    exact: true,
  });
  if (!(await trigger.isVisible())) {
    await page
      .getByRole("button", {
        name: /^(Boards pane|版块面板|版塊面板)$/,
      })
      .click();
  }
  await trigger.click();
}

// Journeys continuing in reading/writing dismiss the restored Boards drawer too.
export async function closeSettingsToWorkspace(
  page: Page,
  via: "escape" | "button" = "escape",
) {
  if (via === "button")
    await page
      .getByRole("dialog", { name: /^(Settings|设置|設定)$/, exact: true })
      .getByRole("button", { name: /^(Close|关闭|關閉)$/, exact: true })
      .click();
  else await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^(Settings|设置|設定)$/, exact: true }),
  ).toBeFocused();
  if (await page.locator(".pane-drawer").isVisible()) {
    await page.keyboard.press("Escape");
    await expect(page.locator(".pane-drawer")).toBeHidden();
  }
}
