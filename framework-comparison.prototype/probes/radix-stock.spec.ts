import { test, expect } from "@playwright/test";
import path from "node:path";

test("document the stock Radix ShadowRoot keyboard limitation", async ({
  page,
}) => {
  test.fail(
    true,
    "Radix focus-scope 1.3.1 reads document.activeElement at the Tab edge. The default comparison adds a local ShadowRoot-aware edge handler.",
  );
  const payload = process.env.PROTOTYPE_PAYLOAD === "1";
  await page.goto(
    `/?framework=react&stockDialog=1${payload ? "&payload=1" : ""}`,
  );
  if (payload)
    await page.addScriptTag({
      path: path.resolve("dist/react/comparison-react.user.js"),
    });
  await page.getByRole("button", { name: "Writing options" }).click();
  const dialog = page.getByRole("dialog", { name: "Writing options" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => {
        let active: Element | null = document.activeElement;
        while (active?.shadowRoot?.activeElement)
          active = active.shadowRoot.activeElement;
        return !!active && el.contains(active);
      }),
    ).toBe(true);
  }
});
