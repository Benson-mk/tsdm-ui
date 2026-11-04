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
