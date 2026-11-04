import { expect, type Page } from "@playwright/test";

// Publication now has a review step. Refusal journeys deliberately stop when
// no confirmation is offered; their own outcome/request assertions remain intact.
export async function publishSavedDraft(page: Page) {
  const primary = page.getByRole("button", {
    name: "Review saved draft publication",
    exact: true,
  });
  await primary.click();
  await expect(primary).toBeEnabled();
  const approval = page.getByRole("button", {
    name: "Confirm saved draft publication",
    exact: true,
  });
  if (await approval.isVisible()) await approval.click();
}
