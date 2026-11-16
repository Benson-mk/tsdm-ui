import { waitForReplySaved } from "./editor-controls";
import { chromium, test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  selectSourceEditor,
  revealWritingTools,
  revealWritingDetails,
} from "./editor-controls";
import {
  origin,
  boardURL,
  createSharedReplyFixture,
  renderSharedReplyResponse,
} from "./shared-reply-fixture";
async function rawRows(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("threads", "readonly"),
            rows = tx.objectStore("threads").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(JSON.stringify(rows.result));
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}
const restartChannel = process.env.TSDM_UI_RESTART_CHANNEL ?? "msedge";
test(`UX111.process-restart: durable pending survives actual isolated ${restartChannel} exit before cold app recovery without replay`, async ({
  browserName,
}, info) => {
  expect(browserName).toBe("chromium");
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  expect(["msedge", "chrome"]).toContain(restartChannel);
  expect(process.env.TSDM_UI_CANDIDATE_SHA256).toMatch(/^[a-f0-9]{64}$/);
  expect(createHash("sha256").update(built).digest("hex")).toBe(
    process.env.TSDM_UI_CANDIDATE_SHA256,
  );
  const profile = info.outputPath("pending-restart-profile");
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      channel: restartChannel,
      headless: true,
      offline: true,
      viewport: { width: 1280, height: 900 },
    });
  let running = await launch();
  const before = createSharedReplyFixture(),
    after = createSharedReplyFixture();
  const submitted = "[b]Pending across process exit[/b]\n原始提交",
    newer = "[i]Newer after pending acknowledgement[/i]\n保留新草稿";
  const attachJSON = (name: string, value: unknown) =>
    info.attach(name, {
      body: JSON.stringify(value, null, 2),
      contentType: "application/json",
    });
  const install = async (state: typeof before) => {
    await running.route("**/*", async (route) => {
      const request = route.request();
      if (new URL(request.url()).pathname === "/__pending-restart.js")
        return route.fulfill({ contentType: "text/javascript", body: built });
      if (request.isNavigationRequest())
        return route.fulfill({
          contentType: "text/html",
          body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__pending-restart.js"></script></body></html>`,
        });
      return route.fulfill(
        await renderSharedReplyResponse(state, {
          url: request.url(),
          method: request.method(),
          body: request.postData(),
        }),
      );
    });
  };
  try {
    await install(before);
    const first = await running.newPage();
    await first.goto(boardURL);
    await first.locator('[data-thread-id="42"] .subject').click();
    await first
      .getByRole("button", { name: "Post 4201 actions", exact: true })
      .click();
    await first.getByRole("menuitem", { name: "Reply", exact: true }).click();
    const source = await selectSourceEditor(first);
    await source.fill(submitted);
    before.postGate = new Promise<void>(() => {});
    await first
      .getByRole("button", { name: "Send reply", exact: true })
      .click();
    await expect
      .poll(() => before.requests.filter((r) => r.method === "POST").length)
      .toBe(1);
    await expect(source).toHaveValue("");
    await source.fill(newer);
    await first
      .getByRole("button", { name: "Remove reply target", exact: true })
      .click();
    await revealWritingTools(first);
    await first.getByLabel("Signature", { exact: true }).uncheck();
    await revealWritingDetails(first);
    await waitForReplySaved(first);
    const rawBefore = JSON.parse(await rawRows(first));
    expect(rawBefore).toHaveLength(1);
    expect(rawBefore[0].sends).toHaveLength(1);
    expect(rawBefore[0].sends[0].attempt.status).toBe("pending");
    const publication = rawBefore[0].sends[0].attempt.publication;
    expect(publication.submission.writing.source).toBe(submitted);
    expect(publication.submission.writing.replyTarget.postId).toBe("4201");
    expect(publication.submission.writing.account.id).toBe("7");
    expect(
      publication.submission.writing.options.find(
        (o: { name: string }) => o.name === "usesig",
      ).checked,
    ).toBe(true);
    expect(rawBefore[0].variants[0].context.source).toBe(newer);
    expect(rawBefore[0].variants[0].context.replyTarget.postId).toBeNull();
    expect(
      rawBefore[0].variants[0].context.options.find(
        (o: { name: string }) => o.name === "usesig",
      ).checked,
    ).toBe(false);
    await attachJSON("before-process-exit.json", rawBefore);
    await info.attach("before-process-exit.png", {
      body: await first.screenshot(),
      contentType: "image/png",
    });
    await running.close();
    running = await launch();
    const inert = await running.newPage();
    await inert.route("**/*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Inert durable storage inspection</title>",
      }),
    );
    await inert.goto(boardURL);
    expect(
      await inert.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBeNull();
    expect(await inert.locator("script").count()).toBe(0);
    const rawCold = JSON.parse(await rawRows(inert));
    await attachJSON("after-process-exit-before-app.json", rawCold);
    expect(rawCold).toEqual(rawBefore);
    expect(rawCold[0].sends[0].attempt.status).toBe("pending");
    await inert.close();
    await install(after);
    const recovered = await running.newPage();
    await recovered.goto(boardURL);
    await recovered.locator('[data-thread-id="42"] .subject').click();
    const recoveredSource = await selectSourceEditor(recovered);
    await expect(recoveredSource).toHaveValue(newer);
    await expect(
      recovered.getByRole("textbox", {
        name: "Submitted reply source",
        exact: true,
      }),
    ).toHaveValue(submitted);
    await expect(
      recovered.getByText("Reply outcome unknown", { exact: true }),
    ).toBeVisible();
    await expect(
      recovered.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await expect(
      recovered.getByRole("button", {
        name: "Remove reply target",
        exact: true,
      }),
    ).toHaveCount(0);
    await revealWritingTools(recovered);
    await expect(
      recovered.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    await recoveredSource.press("Control+Enter");
    await expect(recoveredSource).toHaveValue(newer);
    const rawRecovered = JSON.parse(await rawRows(recovered));
    expect(rawRecovered[0].sends).toEqual(rawBefore[0].sends);
    expect(after.requests.filter((r) => r.method !== "GET")).toEqual([]);
    expect(before.requests.filter((r) => r.method === "POST")).toHaveLength(1);
    await attachJSON("after-cold-app-recovery.json", rawRecovered);
    await info.attach("after-cold-app-recovery.png", {
      body: await recovered.screenshot(),
      contentType: "image/png",
    });
    await attachJSON("process-restart-observation.json", {
      channel: restartChannel,
      closedFirstProcess: true,
      sameIsolatedProfile: true,
      initialSessionRecord: null,
      inspectedBeforeAppStartup: true,
      durablePendingAfterProcessExit: true,
      userAgent: await recovered.evaluate(() => navigator.userAgent),
      originalPublication: publication,
      newerSource: await recoveredSource.inputValue(),
    });
  } finally {
    await attachJSON("process-restart-requests.json", {
      before: before.requests,
      after: after.requests,
    });
    await running.close();
  }
});
