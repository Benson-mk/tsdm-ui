import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const origin = "https://www.tsdm39.com";
const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
for (const missing of [false, true]) {
  test(`38 recovery: ${missing ? "unavailable opaque entry" : "fresh entry"} to Drafts survives reload`, async ({
    page,
  }, info) => {
    const requests: { url: string; method: string }[] = [];
    await page.context().route("**/*", async (route) => {
      const request = route.request();
      requests.push({ url: request.url(), method: request.method() });
      if (new URL(request.url()).pathname === "/fixture.js")
        return route.fulfill({ contentType: "text/javascript", body: built });
      if (request.isNavigationRequest())
        return route.fulfill({
          contentType: "text/html",
          body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/fixture.js"></script></body></html>`,
        });
      return route.fulfill({
        contentType: "text/html",
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div><div id="ct"><h1>Music</h1></div><table id="threadlisttableid"></table><p class="emp">No threads</p>',
      });
    });
    await page.goto(
      `${origin}/forum.php?mod=forumdisplay&fid=5${missing ? "#workspace=11111111-1111-4111-8111-111111111111" : ""}`,
    );
    if (missing)
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
    await page.getByRole("button", { name: "Drafts", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Load forum drafts", exact: true }),
    ).toBeVisible();
    const before = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
    );
    await page.reload();
    await expect(page.locator("#tsdm-workspace")).toHaveCount(1);
    await info.attach("before.json", {
      body: Buffer.from(JSON.stringify(before, null, 2)),
      contentType: "application/json",
    });
    await info.attach("after.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("receipt.json", {
      body: Buffer.from(
        JSON.stringify(
          {
            candidateSha256: createHash("sha256").update(built).digest("hex"),
            missing,
            requests,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
    await expect(
      page.getByText("Stored recovery data is incompatible or malformed.", {
        exact: false,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Load forum drafts", exact: true }),
    ).toBeVisible();
  });
}
