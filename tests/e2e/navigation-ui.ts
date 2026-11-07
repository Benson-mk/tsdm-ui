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

// #85 places public-thread secondary actions behind More; board actions retain
// their own current-result surface. This helper performs only real UI steps.
export async function openThreadMore(page: Page) {
  const menu = page.getByRole("menu", {
    name: /^(More thread options|Thread options)$/,
    exact: true,
  });
  if (!(await menu.isVisible())) {
    if (await page.locator(".pane-drawer").isVisible()) {
      await page.keyboard.press("Escape");
      await expect(page.locator(".pane-drawer")).toBeHidden();
    }
    const trigger = page.getByRole("button", {
      name: "More thread options",
      exact: true,
    });
    if (!(await trigger.isVisible()))
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await trigger.click();
  }
  await expect(menu).toBeVisible();
  return menu;
}
export async function clickThreadTool(
  page: Page,
  name: "Back" | "Refresh thread" | "Save thread",
) {
  const old = page.getByRole("button", { name, exact: true });
  // A restored thread may replace the former sidebar Back on the next render.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  if (
    !(await page.locator(".reader-tool-group").count()) &&
    (await old.isVisible())
  )
    return old.click();
  const menu = await openThreadMore(page);
  await menu
    .getByRole("menuitem", {
      name: name === "Back" ? "Back in history" : name,
      exact: true,
    })
    .click();
}

export async function openThreadPages(page: Page) {
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  if (!(await dialog.isVisible()))
    await page.getByRole("button", { name: /^Page \S+/ }).click();
  await expect(dialog).toBeVisible();
  const details = dialog.locator("details");
  if ((await details.count()) && !((await details.getAttribute("open")) === ""))
    await details.getByText("Supported navigation", { exact: true }).click();
  return dialog;
}

export async function loadThreadRange(
  page: Page,
  direction: "earlier" | "later",
) {
  const dialog = await openThreadPages(page);
  await dialog
    .getByRole("button", {
      name: direction === "earlier" ? "Load earlier" : "Load later",
      exact: true,
    })
    .click();
  await expect(dialog).toBeHidden();
}

export async function confirmThreadPage(page: Page, number: number) {
  const dialog = await openThreadPages(page);
  await dialog
    .getByRole("spinbutton", { name: "Page number", exact: true })
    .fill(String(number));
  await dialog.getByRole("button", { name: "Go", exact: true }).click();
  await expect(dialog).toBeHidden();
}

// Settings is the single opt-in surface for visible-thread checks.
export async function setAutomaticChecks(page: Page, enabled: boolean) {
  await openSettings(page);
  await page
    .getByRole("dialog", { name: "Settings", exact: true })
    .getByRole("checkbox", {
      name: "Check every 2 minutes while active",
      exact: true,
    })
    .setChecked(enabled);
  await closeSettingsToWorkspace(page);
}
