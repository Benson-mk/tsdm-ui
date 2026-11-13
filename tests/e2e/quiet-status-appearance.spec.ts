import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { setAutomaticChecks } from "./navigation-ui";

test("UX99.mid-scroll-arrival: automatic status enters and leaves without moving a visible board row", async ({
  page,
}, info) => {
  const origin = "https://www.tsdm39.com";
  const target = `${origin}/forum.php?mod=forumdisplay&fid=5`;
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const body =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="ct"><h1>Quiet board</h1><table id="threadlisttableid">' +
    Array.from(
      { length: 30 },
      (_, i) =>
        `<tbody id="normalthread_${42 + i}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${42 + i}">Thread ${42 + i}</a></th><td class="by"><cite>Reader Eight</cite><em>today</em></td></tr></tbody>`,
    ).join("") +
    "</table></div>";
  const requests: string[] = [];
  let release: (() => void) | undefined;
  let hold = false;
  // Time is an external browser boundary; real-duration cadence has a separate
  // current-candidate run. This case isolates status geometry at that boundary.
  await page.clock.install();
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/fixture.js"></script></body></html>`,
      });
    requests.push(request.url());
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return route.fulfill({ contentType: "text/html; charset=utf-8", body });
  });
  await page.goto(target);
  await expect(
    page.getByRole("heading", { name: "Quiet board", exact: true }),
  ).toBeVisible();
  await setAutomaticChecks(page, true);
  await page.clock.runFor(2000);
  const pane = page.locator(".results-pane");
  await pane.evaluate((node) => {
    node.scrollTop = 700;
  });
  const anchor = pane.locator('[data-thread-id="46"]');
  const before = await anchor.boundingBox();
  expect(before).toBeTruthy();
  await expect(anchor).toBeInViewport();
  await expect(page.locator(".board-check-status")).toHaveCount(0);
  hold = true;
  await page.clock.runFor(121000);
  await expect(
    page.getByText("Checking board…", { exact: true }),
  ).toBeAttached();
  const checking = await anchor.boundingBox();
  expect(Math.abs(checking!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(requests).toHaveLength(2);
  release!();
  await expect(page.locator(".board-check-status")).toHaveCount(0);
  const after = await anchor.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(requests).toHaveLength(2);
  await info.attach("mid-scroll-status.json", {
    body: JSON.stringify({
      before,
      checking,
      after,
      requests,
      clock: "browser-controlled; full-duration cadence separately verified",
    }),
    contentType: "application/json",
  });
  await info.attach("mid-scroll-status.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
