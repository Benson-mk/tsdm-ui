import { test, expect } from "@playwright/test";
import path from "node:path";

for (const framework of ["vue", "react"]) {
  test.describe(framework, () => {
    test.beforeEach(async ({ page }) => {
      const payload = process.env.PROTOTYPE_PAYLOAD === "1";
      await page.goto(`/?framework=${framework}${payload ? "&payload=1" : ""}`);
      if (payload)
        await page.addScriptTag({
          path: path.resolve(
            `dist/${framework}/comparison-${framework}.user.js`,
          ),
        });
    });
    test.afterEach(async ({ page }, info) => {
      const source = await page
        .getByTestId("source-readback")
        .textContent({ timeout: 1000 })
        .catch(() => null);
      await info.attach("source-and-runtime", {
        body: JSON.stringify(
          {
            framework,
            source,
            url: page.url(),
            userAgent: await page.evaluate(() => navigator.userAgent),
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
    });

    test("no-op mode switches preserve the complete source", async ({
      page,
    }) => {
      const before = await page.getByTestId("source-readback").textContent();
      expect(before).toContain('[unknown demo="keep"]');
      expect(before).toContain("[attach]42[/attach]");
      for (let i = 0; i < 3; i++) {
        await page
          .getByRole("button", { name: "BBCode source", exact: true })
          .click();
        await expect(
          page.getByRole("textbox", { name: "BBCode source" }),
        ).toHaveValue(before!);
        await page
          .getByRole("button", { name: "Visual editor", exact: true })
          .click();
      }
      await expect
        .poll(() => page.getByTestId("source-readback").textContent())
        .toBe(before);
      await expect(page.getByTestId("active-views")).toHaveText("1");
    });

    test("typing, appearance and overview retain source and the same editor node", async ({
      page,
    }) => {
      const editor = page.getByRole("textbox", { name: "Visual writing" });
      await editor.click();
      await page.keyboard.press("ControlOrMeta+Home");
      await page.keyboard.type("Typed in the comparison. ");
      await editor.evaluate((el) => ((window as any).__comparisonEditor = el));
      const source = await page.getByTestId("source-readback").textContent();
      expect(source).toContain("Typed in the comparison.");
      await page.getByRole("button", { name: "Toggle appearance" }).click();
      await page.getByRole("button", { name: "Boards overview" }).click();
      await expect(editor).toBeHidden();
      await page.getByRole("button", { name: "Return to writing" }).click();
      await expect(editor).toBeVisible();
      expect(
        await editor.evaluate(
          (el) => el === (window as any).__comparisonEditor,
        ),
      ).toBe(true);
      await expect
        .poll(() => page.getByTestId("source-readback").textContent())
        .toBe(source);
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect(page.getByTestId("source-readback")).not.toHaveText(source!);
    });

    test("detaching the view retains the session and undo history", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "BBCode source", exact: true })
        .click();
      const source = page.getByRole("textbox", { name: "BBCode source" });
      const before = await source.inputValue();
      await source.fill(
        before + "\n新增文字 — retained across a view lifecycle.",
      );
      await page.getByRole("button", { name: "Detach editor view" }).click();
      await expect(page.getByTestId("active-views")).toHaveText("0");
      await page.getByRole("button", { name: "Attach editor view" }).click();
      await expect(page.getByTestId("active-views")).toHaveText("1");
      await expect(source).toHaveValue(
        before + "\n新增文字 — retained across a view lifecycle.",
      );
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect
        .poll(() => page.getByTestId("source-readback").textContent())
        .toBe(before);
    });

    test("table merge and split preserve unrelated opaque source", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Merge first row" }).click();
      await expect(page.locator('.ProseMirror td[colspan="2"]')).toHaveCount(1);
      await expect(page.getByTestId("source-readback")).toContainText(
        '[unknown demo="keep"][b]opaque[/b][/unknown]',
      );
      await page.getByRole("button", { name: "Split first cell" }).click();
      await expect(page.locator('.ProseMirror td[colspan="2"]')).toHaveCount(0);
      await expect(page.locator(".ProseMirror td")).toHaveCount(4);
      await expect(page.getByTestId("source-readback")).toContainText(
        "[attach]42[/attach]",
      );
    });

    test("dialog stays in the shadow host, contains focus and returns it", async ({
      page,
    }) => {
      const trigger = page.getByRole("button", { name: "Writing options" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Writing options" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(
        /A real (Reka|Radix) dialog/,
      );
      expect(
        await dialog.evaluate((el) => el.getRootNode() instanceof ShadowRoot),
      ).toBe(true);
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
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Shift+Tab");
        expect(
          await dialog.evaluate((el) => {
            let active: Element | null = document.activeElement;
            while (active?.shadowRoot?.activeElement)
              active = active.shadowRoot.activeElement;
            return !!active && el.contains(active);
          }),
        ).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("narrow view remains usable and yields a review image", async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole("button", { name: "BBCode source", exact: true }),
      ).toBeVisible();
      const overflowing = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflowing).toBe(false);
      await page.screenshot({
        path: info.outputPath(`${framework}-narrow.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1050 });
      await page.screenshot({
        path: info.outputPath(`${framework}-desktop.png`),
        fullPage: true,
      });
    });
  });
}
