import { refreshReplyFromNative } from "./editor-controls";
import { chooseAttachments } from "./editor-controls";
import { revealWritingOptions } from "./editor-controls";
import { writingDetailAction } from "./editor-controls";
import { waitForReplySaved } from "./editor-controls";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { selectSourceEditor, revealWritingDetails } from "./editor-controls";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import {
  origin,
  boardURL,
  threadURL,
  createSharedReplyFixture,
  renderSharedReplyResponse,
} from "./shared-reply-fixture";

type Fixture = ReturnType<typeof createSharedReplyFixture>;
const fixtures = new WeakMap<Page, Fixture>();
async function open(page: Page, scriptPath = "dist/tsdm-ui.user.js") {
  let built = readFileSync(scriptPath, "utf8");
  const fixture = Object.assign(createSharedReplyFixture(), {
    respond: async (
      _request: { url: string; method: string; body: string | null },
      response: Awaited<ReturnType<typeof renderSharedReplyResponse>>,
    ) => response,
  });
  fixtures.set(page, fixture);
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/__pending.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__pending.js"></script></body></html>`,
      });
    const input = {
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    };
    return route.fulfill(
      await fixture.respond(
        input,
        await renderSharedReplyResponse(fixture, input),
      ),
    );
  });
  await page.goto(boardURL);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  return Object.assign(fixture, {
    useScript(path: string) {
      built = readFileSync(path, "utf8");
    },
  });
}
const posts = (fixture: Fixture) =>
  fixture.requests.filter((request) => request.method === "POST");
async function holdReservationCompletion(page: Page) {
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction,
      put = IDBObjectStore.prototype.put;
    const reservations = new WeakSet<IDBTransaction>();
    let armed = true;
    Object.defineProperty(window, "release111Reservation", {
      configurable: true,
      writable: true,
      value: null,
    });
    IDBObjectStore.prototype.put = function (value, key) {
      if (
        armed &&
        this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
        value.schema === 3 &&
        value.sends?.some(
          (send: { attempt: { status: string } }) =>
            send.attempt.status === "pending",
        )
      ) {
        armed = false;
        reservations.add(this.transaction);
      }
      return put.call(this, value, key);
    };
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      const tx = transaction.call(this, names, mode, options);
      if (this.name === "tsdm.workspace.reply-drafts" && mode === "readwrite")
        Object.defineProperty(tx, "oncomplete", {
          set(callback) {
            tx.addEventListener("complete", (event) => {
              if (reservations.has(tx))
                (
                  window as unknown as { release111Reservation: () => void }
                ).release111Reservation = () => {
                  IDBDatabase.prototype.transaction = transaction;
                  IDBObjectStore.prototype.put = put;
                  callback.call(tx, event);
                };
              else callback.call(tx, event);
            });
          },
        });
      return tx;
    };
  });
}
test.afterEach(async ({ page, browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("pending-reply-requests.json", {
    body: JSON.stringify(fixtures.get(page)?.requests ?? [], null, 2),
    contentType: "application/json",
  });
  await info.attach("pending-reply.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("UX111.sending: acknowledged submitted reply stays immutable while the next draft is edited", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  const submitted = "[b]Sending original[/b]\n你好 [unknown]literal[/unknown]";
  await source.fill(submitted);
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    await expect(source).toHaveValue("");
    await expect(
      page.getByText(
        "Another retained version has an unsettled operation. Choose that version and check its original result before sending or discarding it.",
        { exact: true },
      ),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        "Another Send waits while an existing reply is sending or unresolved. You can keep writing.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", {
        name: "Submitted reply source",
        exact: true,
      }),
    ).toHaveValue(submitted);
    await source.fill("[i]Newer draft remains[/i]\n下一篇");
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    expect(posts(fixture)).toHaveLength(1);
    expect(
      new URLSearchParams(posts(fixture)[0]!.body ?? "").get("message"),
    ).toBe(submitted);
    release();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(source).toHaveValue("[i]Newer draft remains[/i]\n下一篇");
    await expect(
      page.getByRole("textbox", {
        name: "Submitted reply source",
        exact: true,
      }),
    ).toHaveValue(submitted);
    expect(fixture.savedActors.get("42")).toBe("7");
    expect(posts(fixture)).toHaveLength(1);
  } finally {
    release();
  }
});

test("UX111.other-tab: recovered pending submission holds another tab without blocking newer typing", async ({
  page,
}, info) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original tab pending reply");
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    const second = await page.context().newPage();
    await second.goto(boardURL);
    await second.locator('[data-thread-id="42"] .subject').click();
    const nextSource = await selectSourceEditor(second);
    await expect(nextSource).toHaveValue("");
    await expect(
      second.getByRole("textbox", {
        name: "Submitted reply source",
        exact: true,
      }),
    ).toHaveValue("Original tab pending reply");
    await expect(
      second.getByText("Reply outcome unknown", { exact: true }),
    ).toBeVisible();
    await nextSource.fill("Newer writing from another tab");
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    release();
    await expect(
      second.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await info.attach("other-tab-after-completion.html", {
      body: await second.content(),
      contentType: "text/html",
    });
    await info.attach("other-tab-after-completion.json", {
      body: await second.evaluate(
        () => sessionStorage.getItem("tsdm.workspace.recovery") ?? "null",
      ),
      contentType: "application/json",
    });
    await expect(nextSource).toHaveValue("Newer writing from another tab");
    await second.reload();
    await expect(
      second.getByRole("textbox", {
        name: "Submitted reply source",
        exact: true,
      }),
    ).toHaveValue("Original tab pending reply");
    await expect(await selectSourceEditor(second)).toHaveValue(
      "Newer writing from another tab",
    );
    expect(posts(fixture)).toHaveLength(1);
    await second.close();
  } finally {
    release();
  }
});

test("UX111.retry: a rejected reply retries its exact original source while preserving newer writing", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Rejected original reply");
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await expect(source).toHaveValue("");
  await source.fill("Newer writing survives Retry");
  fixture.replyOutcome = "accepted";
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await expect(source).toHaveValue("Newer writing survives Retry");
  expect(posts(fixture)).toHaveLength(2);
  for (const post of posts(fixture))
    expect(new URLSearchParams(post.body ?? "").get("message")).toBe(
      "Rejected original reply",
    );
  await expect(
    page.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveCount(2);
});

test("UX111.unknown: status checking is read-only and explicit duplicate-risk succession preserves both snapshots", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original unknown reply");
  fixture.replyOutcome = "lost";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Reply outcome unknown", { exact: true }),
  ).toBeVisible();
  await source.fill("Newer writing during unknown outcome");
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer writing during unknown outcome",
  );
  await page
    .getByRole("button", { name: "Check reply status", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry with duplicate risk",
      exact: true,
    }),
  ).toBeEnabled();
  expect(posts(fixture)).toHaveLength(1);
  await page
    .getByRole("button", { name: "Retry with duplicate risk", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Reply duplicate risk", exact: true }),
  ).toBeVisible();
  expect(posts(fixture)).toHaveLength(1);
  fixture.replyOutcome = "accepted";
  await page
    .getByRole("button", {
      name: "Accept duplicate risk and retry reply",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await expect(
    page.getByText("Reply outcome unknown", { exact: true }),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer writing during unknown outcome",
  );
  expect(posts(fixture)).toHaveLength(2);
  for (const post of posts(fixture))
    expect(new URLSearchParams(post.body ?? "").get("message")).toBe(
      "Original unknown reply",
    );
  await expect(
    page.getByRole("button", {
      name: "Retry with duplicate risk",
      exact: true,
    }),
  ).toBeDisabled();
});

test("UX111.edit: failed Edit keeps newer text and offers explicit round-trip continuation after reload", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill(
    "[b]Failed source to edit[/b]\n[unknown]preserved[/unknown]",
  );
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await source.fill("Newer draft kept for later");
  await page
    .getByRole("button", { name: "Edit failed reply", exact: true })
    .click();
  await expect(source).toHaveValue("Newer draft kept for later");
  const versions = page.getByRole("region", {
    name: "Recoverable reply versions",
    exact: true,
  });
  await expect(
    versions.getByRole("textbox", {
      name: "Retained reply version 1",
      exact: true,
    }),
  ).toHaveValue("[b]Failed source to edit[/b]\n[unknown]preserved[/unknown]");
  expect(posts(fixture)).toHaveLength(1);
  await versions
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(
    page.getByText(
      "Selected version resumed. Other versions remain recoverable.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Failed source to edit[/b]\n[unknown]preserved[/unknown]",
  );
  await expect(
    versions.getByRole("textbox", {
      name: "Retained reply version 1",
      exact: true,
    }),
  ).toHaveValue("Newer draft kept for later");
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Failed source to edit[/b]\n[unknown]preserved[/unknown]",
  );
  await versions
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(
    page.getByText(
      "Selected version resumed. Other versions remain recoverable.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer draft kept for later",
  );
  await expect(
    versions.getByRole("button", { name: "Discard version 1", exact: true }),
  ).toBeEnabled();
  expect(posts(fixture)).toHaveLength(1);
});

test("UX111.ack-change: typing before reservation acknowledgement cancels without clearing or POST", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original before delayed acknowledgement");
  await waitForReplySaved(page);
  await holdReservationCompletion(page);
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { release111Reservation: unknown })
            .release111Reservation,
      ),
    )
    .toBe("function");
  expect(posts(fixture)).toHaveLength(0);
  await expect(source).toHaveValue("Original before delayed acknowledgement");
  await source.fill("Newer exact source before acknowledgement");
  await page.evaluate(() =>
    (
      window as unknown as { release111Reservation(): void }
    ).release111Reservation(),
  );
  await expect(page.getByText("Reply not sent", { exact: true })).toBeVisible();
  await expect(source).toHaveValue("Newer exact source before acknowledgement");
  await expect(
    page.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveValue("Original before delayed acknowledgement");
  expect(posts(fixture)).toHaveLength(0);
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer exact source before acknowledgement",
  );
  expect(posts(fixture)).toHaveLength(0);
});

test("UX111.ack-selection: changing only the source selection before acknowledgement cancels without clearing or POST", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Selection remains authored intent");
  await waitForReplySaved(page);
  await holdReservationCompletion(page);
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { release111Reservation: unknown })
            .release111Reservation,
      ),
    )
    .toBe("function");
  await source.focus();
  await source.press("ArrowLeft");
  await page.evaluate(() =>
    (
      window as unknown as { release111Reservation(): void }
    ).release111Reservation(),
  );
  await expect(page.getByText("Reply not sent", { exact: true })).toBeVisible();
  await expect(source).toHaveValue("Selection remains authored intent");
  expect(posts(fixture)).toHaveLength(0);
});

test("UX111.pending-refused: a refused registry write retains the only input and dispatches nothing", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Only recoverable input before quota refusal");
  await waitForReplySaved(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (
        this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
        value.schema === 3
      )
        throw new DOMException(
          "Induced pending registry quota refusal",
          "QuotaExceededError",
        );
      return put.call(this, value, key);
    };
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply not sent", { exact: true })).toBeVisible();
  await expect(source).toHaveValue(
    "Only recoverable input before quota refusal",
  );
  expect(posts(fixture)).toHaveLength(0);
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Only recoverable input before quota refusal",
  );
  expect(posts(fixture)).toHaveLength(0);
});

test("UX111.completion-refused: actual callback remains visibly unsaved beside newer source and reload never replays", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Outgoing whose observation cannot save");
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    await source.fill("Newer source survives result save refusal");
    await waitForReplySaved(page);
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (
          this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
          value.sends?.some(
            (send: { attempt: { status: string } }) =>
              send.attempt.status === "confirmed",
          )
        )
          throw new DOMException(
            "Induced completion observation refusal",
            "QuotaExceededError",
          );
        return put.call(this, value, key);
      };
    });
    release();
    await expect(
      page.getByText(
        /reply outcome is retained in this tab but could not be durably acknowledged/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(source).toHaveValue(
      "Newer source survives result save refusal",
    );
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await expect(
      page.getByText("Reply outcome unknown", { exact: true }),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer source survives result save refusal",
    );
    expect(posts(fixture)).toHaveLength(1);
  } finally {
    release();
  }
});

test("UX111.target-navigation: post target and options remain immutable while newer writing changes target and visits another thread", async ({
  page,
}) => {
  const fixture = await open(page);
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Original post-target submission");
  await revealWritingOptions(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    await source.fill("Newer thread-wide source");
    await page
      .getByRole("button", { name: "Remove reply target", exact: true })
      .click();
    await revealWritingOptions(page);
    await page.getByLabel("Signature", { exact: true }).check();
    await page.locator('[data-thread-id="43"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Independent thread 43 writing");
    release();
    await expect.poll(() => fixture.saved.has("42")).toBe(true);
    await expect(
      page.getByRole("textbox", { name: "Complete source", exact: true }),
    ).toHaveValue("Independent thread 43 writing");
    await page.locator('[data-thread-id="42"] .subject').click();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer thread-wide source",
    );
    await expect(
      page.getByRole("button", { name: "Remove reply target", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Signature", { exact: true })).toBeChecked();
    const submitted = new URLSearchParams(posts(fixture)[0]!.body ?? "");
    expect(submitted.get("message")).toBe("Original post-target submission");
    expect(submitted.get("reppost")).toBe("4201");
    expect(submitted.has("usesig")).toBe(false);
    expect(posts(fixture)).toHaveLength(1);
  } finally {
    release();
  }
});

test("UX111.original-actor: another account can continue newer writing but cannot Retry the original rejection", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original account 7 failed submission");
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  fixture.member = "8";
  await revealWritingDetails(page);
  // A fixture-only account change becomes observable through native reading.
  await refreshReplyFromNative(page);
  await source.fill("Newer shared writing by account 8");
  await expect(
    page.getByText("Original sending account: Writer 7 (7)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry reply", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer shared writing by account 8",
  );
  await page.goto(threadURL("42"));
  await expect(
    page.getByRole("button", { name: "Retry reply", exact: true }),
  ).toBeDisabled();
  expect(posts(fixture)).toHaveLength(1);
});

async function rawReplyRows(page: Page) {
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

test("UX111.old110: actual previous executable refuses schema3 intact and cannot replay its recovered session", async ({
  page,
}, info) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original registry-only authority test");
  fixture.replyOutcome = "lost";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Reply outcome unknown", { exact: true }),
  ).toBeVisible();
  await source.fill("Newer writing seen by actual old110");
  await waitForReplySaved(page);
  const before = await rawReplyRows(page);
  await info.attach("schema3-before-old110.json", {
    body: before,
    contentType: "application/json",
  });
  fixture.useScript("/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js");
  await page.reload();
  await expect(
    page
      .getByText(
        "Stored local reply drafts are incompatible. Their raw data is retained; sending is paused.",
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer writing seen by actual old110",
  );
  expect(await rawReplyRows(page)).toBe(before);
  expect(posts(fixture)).toHaveLength(1);
});

test("UX111.registry-only: replacing a settled draft keeps its original thread result and does not block unrelated authoring", async ({
  page,
}) => {
  const fixture = await open(page);
  await (
    await selectSourceEditor(page)
  ).fill("Confirmed original ordinary reply");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "New thread in Music discussion",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Unrelated new thread");
  await page
    .getByRole("textbox", { name: "Complete source", exact: true })
    .fill("Unrelated new thread source");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveValue("Confirmed original ordinary reply");
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/).first(),
  ).toBeVisible();
  expect(posts(fixture)).toHaveLength(1);
});

for (const refusal of ["read", "open"] as const) {
  test(`UX111.old110-${refusal}-refused: old session recovery cannot replay when the new durable registry is inaccessible`, async ({
    page,
  }, info) => {
    const fixture = await open(page);
    await (
      await selectSourceEditor(page)
    ).fill("Original pending shape for old session guard");
    fixture.replyOutcome = "lost";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply outcome unknown", { exact: true }),
    ).toBeVisible();
    await (
      await selectSourceEditor(page)
    ).fill("Newer source survives unavailable old host");
    await waitForReplySaved(page);
    const raw = await rawReplyRows(page);
    await page.addInitScript((mode) => {
      const open = IDBFactory.prototype.open,
        transaction = IDBDatabase.prototype.transaction;
      if (mode === "open")
        IDBFactory.prototype.open = function (name, version) {
          if (name === "tsdm.workspace.reply-drafts")
            throw new DOMException("Induced old host refusal", "SecurityError");
          return open.call(this, name, version);
        };
      else
        IDBDatabase.prototype.transaction = function (names, access, options) {
          if (
            this.name === "tsdm.workspace.reply-drafts" &&
            access === "readonly"
          )
            throw new DOMException(
              "Induced old durable read refusal",
              "SecurityError",
            );
          return transaction.call(this, names, access, options);
        };
      Object.defineProperty(window, "restore111Storage", {
        value: () => {
          IDBFactory.prototype.open = open;
          IDBDatabase.prototype.transaction = transaction;
        },
      });
    }, refusal);
    fixture.useScript("/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js");
    await page.reload();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer source survives unavailable old host",
    );
    // Old110 exposes the activation but its recovery/uncertainty guard refuses it.
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page
        .getByText(
          /earlier attempt may already exist|recovery.*available|Local reply draft.*could not|draft.*unavailable/i,
        )
        .first(),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer source survives unavailable old host",
    );
    expect(posts(fixture)).toHaveLength(1);
    await page.evaluate(() =>
      (window as unknown as { restore111Storage(): void }).restore111Storage(),
    );
    expect(await rawReplyRows(page)).toBe(raw);
    await info.attach("old-inaccessible-registry.json", {
      body: raw,
      contentType: "application/json",
    });
  });
}

test("UX111.final-preflight: after acknowledgement newer typing no longer cancels immutable native preflight", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original before final native preflight");
  let release = () => {},
    seen = 0;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  fixture.respond = async (request, response) => {
    if (
      request.method === "GET" &&
      new URL(request.url).searchParams.get("action") === "reply" &&
      ++seen === 2
    )
      await gate;
    return response;
  };
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => seen).toBe(2);
    await expect(source).toHaveValue("");
    await source.fill("Newer source during final preflight");
    expect(posts(fixture)).toHaveLength(0);
    release();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(source).toHaveValue("Newer source during final preflight");
    expect(posts(fixture)).toHaveLength(1);
    expect(
      new URLSearchParams(posts(fixture)[0]!.body ?? "").get("message"),
    ).toBe("Original before final native preflight");
  } finally {
    release();
  }
});

for (const change of ["actor", "observation"] as const) {
  test(`UX111.final-preflight-${change}: changed authority after acknowledgement still prevents dispatch`, async ({
    page,
  }) => {
    const fixture = await open(page);
    const source = await selectSourceEditor(page);
    await source.fill("Immutable original before authority changed");
    let release = () => {},
      seen = 0;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    fixture.respond = async (request, response) => {
      if (
        request.method === "GET" &&
        new URL(request.url).searchParams.get("action") === "reply" &&
        ++seen === 2
      ) {
        await gate;
        if (change === "actor")
          return {
            ...response,
            body: response.body
              .replaceAll("uid=7", "uid=8")
              .replaceAll("Writer 7", "Writer 8"),
          };
      }
      return response;
    };
    try {
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect.poll(() => seen).toBe(2);
      await expect(source).toHaveValue("");
      await source.fill("Newer input during changed final authority");
      if (change === "observation") {
        const second = await page.context().newPage();
        await second.goto(threadURL("42"));
        await second
          .getByRole("button", { name: "Check reply status", exact: true })
          .click();
        await expect(
          second.getByRole("button", {
            name: "Retry with duplicate risk",
            exact: true,
          }),
        ).toBeEnabled();
        await second.close();
      }
      release();
      await expect(
        page.getByText("Reply not sent", { exact: true }),
      ).toBeVisible();
      await expect(await selectSourceEditor(page)).toHaveValue(
        "Newer input during changed final authority",
      );
      expect(posts(fixture)).toHaveLength(0);
      await expect(
        page.getByRole("textbox", {
          name: "Submitted reply source",
          exact: true,
        }),
      ).toHaveValue("Immutable original before authority changed");
    } finally {
      release();
    }
  });
}

test("UX111.simultaneous: actual tabs with suppressed notifications preserve inputs and cannot dispatch two claims", async ({
  page,
  context,
}, info) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const fixture = await open(page);
  await (
    await selectSourceEditor(page)
  ).fill("Same deliberate reply in competing tabs");
  await waitForReplySaved(page);
  const second = await context.newPage();
  await second.goto(threadURL("42"));
  await expect(await selectSourceEditor(second)).toHaveValue(
    "Same deliberate reply in competing tabs",
  );
  await Promise.all([
    page.getByRole("button", { name: "Send reply", exact: true }).click(),
    second.getByRole("button", { name: "Send reply", exact: true }).click(),
  ]);
  for (const tab of [page, second]) {
    await expect(
      tab
        .getByRole("textbox", { name: "Submitted reply source", exact: true })
        .first(),
    ).toHaveValue("Same deliberate reply in competing tabs");
    await expect(
      tab
        .getByText(
          /Reply not sent|Confirmed reply|Reply outcome unknown|Sending reply/,
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    await tab.evaluate(() => window.dispatchEvent(new Event("focus")));
  }
  await expect
    .poll(async () => {
      const rows = JSON.parse(await rawReplyRows(page));
      return rows
        .flatMap(
          (row: { sends?: { attempt: { status: string } }[] }) =>
            row.sends ?? [],
        )
        .filter(
          (send: { attempt: { status: string } }) =>
            send.attempt.status === "pending",
        ).length;
    })
    .toBe(0);
  expect(posts(fixture).length).toBeLessThanOrEqual(1);
  for (const tab of [page, second])
    await expect(
      tab
        .getByRole("textbox", { name: "Submitted reply source", exact: true })
        .first(),
    ).toHaveValue("Same deliberate reply in competing tabs");
  await info.attach("simultaneous-raw.json", {
    body: await rawReplyRows(page),
    contentType: "application/json",
  });
  await info.attach("simultaneous-second.png", {
    body: await second.screenshot(),
    contentType: "image/png",
  });
});

for (const malformed of [
  "unequal-history-publication",
  "cross-actor-successor",
  "changed-source-successor",
  "cycle",
  "duplicate-id",
  "two-leaves",
  "future-schema",
  "unknown-key",
] as const) {
  test(`UX111.invalid-${malformed}: malformed operation lineage is refused without repairing or erasing raw data`, async ({
    page,
  }, info) => {
    const fixture = await open(page);
    await (
      await selectSourceEditor(page)
    ).fill("Original immutable malformed-lineage probe");
    fixture.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply rejected", { exact: true }),
    ).toBeVisible();
    await waitForReplySaved(page);
    const raw = await page.evaluate(async (mode) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return await new Promise<string>((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite", {
          durability: "strict",
        });
        const store = tx.objectStore("threads"),
          get = store.get("42");
        let raw = "";
        get.onsuccess = () => {
          const row = get.result,
            first = row.sends[0],
            next = structuredClone(first);
          next.revision = crypto.randomUUID();
          next.attempt.id = crypto.randomUUID();
          next.attempt.publication.id = crypto.randomUUID();
          next.attempt.status = "pending";
          next.attempt.checked = false;
          if (mode === "unequal-history-publication")
            row.variants[0].context.attempts[0].publication.submission.writing.source =
              "Unequal immutable history cannot borrow registry identity";
          else if (mode === "future-schema") row.schema = 99;
          else if (mode === "unknown-key")
            first.leaseAuthority = "must not load";
          else if (mode === "duplicate-id")
            row.sends.push(structuredClone(first));
          else {
            row.sends.push(next);
            if (mode === "two-leaves") first.attempt.status = "uncertain";
            else first.successor = next.attempt.id;
            if (mode === "cycle") next.successor = first.attempt.id;
            if (mode === "cross-actor-successor")
              next.attempt.publication.submission.writing.account.id = "8";
            if (mode === "changed-source-successor")
              next.attempt.publication.submission.writing.source =
                "Unrelated successor content";
          }
          raw = JSON.stringify([row]);
          store.put(row);
        };
        tx.oncomplete = () => {
          db.close();
          resolve(raw);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      });
    }, malformed);
    await page.reload();
    await expect(
      page
        .getByText(
          "Stored local reply drafts are incompatible. Their raw data is retained; sending is paused.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    expect(await rawReplyRows(page)).toBe(raw);
    expect(posts(fixture)).toHaveLength(1);
    await info.attach("refused-raw-lineage.json", {
      body: raw,
      contentType: "application/json",
    });
  });
}

for (const outcome of ["rejected", "lost"] as const) {
  test(`UX111.legacy-${outcome}: actual110 history supports deliberate original recovery after upgrade`, async ({
    page,
  }) => {
    const fixture = await open(page);
    await (
      await selectSourceEditor(page)
    ).fill("Acknowledged setup before actual110 reload");
    await waitForReplySaved(page);
    fixture.useScript("/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js");
    await page.reload();
    await (await selectSourceEditor(page)).fill(`Original110 ${outcome} reply`);
    await revealWritingDetails(page);
    await (
      await writingDetailAction(page, "Check current account and form")
    ).click();
    fixture.replyOutcome = outcome;
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    await expect(
      page
        .getByText(
          outcome === "rejected"
            ? /forum explicitly refused validation/
            : /outcome is uncertain/i,
        )
        .first(),
    ).toBeVisible();
    await waitForReplySaved(page);
    fixture.useScript("dist/tsdm-ui.user.js");
    await page.reload();
    await (
      await selectSourceEditor(page)
    ).fill("Newer111 writing after actual110 migration");
    await revealWritingDetails(page);
    await (
      await writingDetailAction(page, "Check current account and form")
    ).click();
    fixture.replyOutcome = "accepted";
    if (outcome === "rejected") {
      await expect(
        page.getByRole("button", { name: "Retry reply", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Retry reply", exact: true })
        .click();
    } else {
      await page
        .getByRole("button", { name: "Check reply status", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Retry with duplicate risk",
          exact: true,
        }),
      ).toBeEnabled();
      expect(posts(fixture)).toHaveLength(1);
      await page
        .getByRole("button", { name: "Retry with duplicate risk", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Accept duplicate risk and retry reply",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer111 writing after actual110 migration",
    );
    expect(posts(fixture)).toHaveLength(2);
    expect(
      new URLSearchParams(posts(fixture)[1]!.body ?? "").get("message"),
    ).toBe(`Original110 ${outcome} reply`);
  });
}

for (const failure of ["readback", "checkpoint"] as const) {
  test(`UX111.reservation-${failure}: a committed but unacknowledged pending claim never clears input or dispatches`, async ({
    page,
  }) => {
    const fixture = await open(page);
    const source = await selectSourceEditor(page);
    await source.fill(`Original input before registry ${failure} refusal`);
    await waitForReplySaved(page);
    await page.evaluate((mode) => {
      const put = IDBObjectStore.prototype.put,
        transaction = IDBDatabase.prototype.transaction,
        set = Storage.prototype.setItem;
      let committed = false;
      IDBObjectStore.prototype.put = function (value, key) {
        if (
          this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
          value.schema === 3 &&
          value.sends?.some(
            (send: { attempt: { status: string } }) =>
              send.attempt.status === "pending",
          )
        )
          committed = true;
        return put.call(this, value, key);
      };
      IDBDatabase.prototype.transaction = function (names, access, options) {
        if (
          mode === "readback" &&
          committed &&
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readonly"
        )
          throw new DOMException(
            "Induced registry readback refusal",
            "SecurityError",
          );
        return transaction.call(this, names, access, options);
      };
      Storage.prototype.setItem = function (key, value) {
        if (
          mode === "checkpoint" &&
          committed &&
          key === "tsdm.workspace.recovery"
        )
          throw new DOMException(
            "Induced registry session-checkpoint refusal",
            "QuotaExceededError",
          );
        return set.call(this, key, value);
      };
    }, failure);
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply not sent", { exact: true }),
    ).toBeVisible();
    await expect(source).toHaveValue(
      `Original input before registry ${failure} refusal`,
    );
    await expect(
      page
        .getByText(
          /could not be durably acknowledged|could not be saved|recovery.*unavailable/i,
        )
        .first(),
    ).toBeVisible();
    expect(posts(fixture)).toHaveLength(0);
    await page.reload();
    await expect(await selectSourceEditor(page)).toHaveValue(
      `Original input before registry ${failure} refusal`,
    );
    expect(posts(fixture)).toHaveLength(0);
  });
}

test("UX111.legacy-addressed: actual110 failed addressed reply retains original target through deliberate Retry", async ({
  page,
}) => {
  const fixture = await open(
    page,
    "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
  );
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Actual110 failed addressed source");
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/forum explicitly refused validation/).first(),
  ).toBeVisible();
  await waitForReplySaved(page);
  fixture.useScript("dist/tsdm-ui.user.js");
  await page.goto(threadURL("42"));
  await (await selectSourceEditor(page)).fill("Newer addressed draft");
  fixture.replyOutcome = "accepted";
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer addressed draft",
  );
  expect(posts(fixture)).toHaveLength(2);
  for (const request of posts(fixture)) {
    const fields = new URLSearchParams(request.body ?? "");
    expect(fields.get("message")).toBe("Actual110 failed addressed source");
    expect(fields.get("reppost")).toBe("4201");
  }
});

test("UX111.moderated-rapid: repeated button and source-shortcut activation dispatch once and retain Moderation through reload", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Moderated original submission");
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  fixture.replyOutcome = "moderation";
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    for (let i = 0; i < 4; i++) await source.press("Control+Enter");
    await expect.poll(() => posts(fixture).length).toBe(1);
    await source.fill("Newer draft while moderation arrives");
    release();
    await expect(
      page.getByText("Reply awaiting moderation", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Confirmed reply", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await expect(
      page.getByText("Reply awaiting moderation", { exact: true }),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer draft while moderation arrives",
    );
    expect(posts(fixture)).toHaveLength(1);
  } finally {
    release();
  }
});

test("UX111.blank-intent-edit: empty newer source still preserves changed target, options and named attachment intent", async ({
  page,
}) => {
  const fixture = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original failed reply without newer intent");
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await expect(source).toHaveValue("");
  await page
    .getByRole("button", { name: "Reply to this post", exact: true })
    .click();
  await revealWritingOptions(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await chooseAttachments(page, {
    name: "newer-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Only newer draft file"),
  });
  await page
    .getByRole("button", { name: "Edit failed reply", exact: true })
    .click();
  await expect(source).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toBeVisible();
  const versions = page.getByRole("region", {
    name: "Recoverable reply versions",
    exact: true,
  });
  await versions
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(
    page.getByText(
      "Selected version resumed. Other versions remain recoverable.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Original failed reply without newer intent",
  );
  await page.reload();
  await versions
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(
    page.getByText(
      "Selected version resumed. Other versions remain recoverable.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Signature", { exact: true })).not.toBeChecked();
  await expect(
    page.getByLabel("Reattach newer-intent.txt", { exact: true }),
  ).toBeVisible();
  expect(posts(fixture)).toHaveLength(1);
});

for (const peer of [
  "equal",
  "uncertain",
  "pending",
  "moderation",
  "different-message",
  "other-id",
] as const) {
  test(`UX111.legacy-copy-${peer}: legacy enrollment compares every stored observation and never erases unrelated holds`, async ({
    page,
  }, info) => {
    const fixture = await open(
      page,
      "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
    );
    await (
      await selectSourceEditor(page)
    ).fill("Exact legacy rejection with preserved peer");
    fixture.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText(/forum explicitly refused validation/).first(),
    ).toBeVisible();
    await waitForReplySaved(page);
    await page.evaluate(async (peer) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite", {
            durability: "strict",
          }),
          store = tx.objectStore("threads"),
          request = store.get("42");
        request.onsuccess = () => {
          const row = request.result,
            copy = structuredClone(row.variants[0]);
          copy.version = crypto.randomUUID();
          copy.context.source = "Retained peer source stays raw";
          copy.context.selection = { start: 0, end: 0, direction: "none" };
          const attempt = copy.context.attempts[0];
          if (["uncertain", "pending", "moderation"].includes(peer))
            attempt.status = peer;
          if (peer === "different-message")
            attempt.message = "Unequal raw rejection observation";
          if (peer === "other-id") {
            attempt.id = crypto.randomUUID();
            attempt.status = "uncertain";
            attempt.checked = true;
          }
          row.schema = 2;
          row.retained = [copy];
          store.put(row);
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      });
    }, peer);
    fixture.useScript("dist/tsdm-ui.user.js");
    await page.goto(threadURL("42"));
    await expect(
      page.getByText(
        "Stored local reply drafts are incompatible. Their raw data is retained; sending is paused.",
        { exact: true },
      ),
    ).toHaveCount(0);
    await (await selectSourceEditor(page)).fill("Newer111 source stays active");
    fixture.replyOutcome = "accepted";
    await expect(
      page.getByRole("button", { name: "Retry reply", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Retry reply", exact: true })
      .click();
    if (peer === "equal") {
      await expect(
        page.getByText(/Confirmed stored reply in thread 42/),
      ).toBeVisible();
      expect(posts(fixture)).toHaveLength(2);
    } else if (peer === "other-id") {
      await expect(
        page.getByText("Reply not sent", { exact: true }),
      ).toBeVisible();
      expect(posts(fixture)).toHaveLength(1);
    } else {
      await expect(
        page.getByText(
          /historical failure could not be acknowledged unchanged/,
        ),
      ).toBeVisible();
      expect(posts(fixture)).toHaveLength(1);
      await expect(
        page.getByRole("button", { name: "Check reply status", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Check reply status", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Retry with duplicate risk",
          exact: true,
        }),
      ).toBeEnabled();
      expect(posts(fixture)).toHaveLength(1);
    }
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer111 source stays active",
    );
    const row = JSON.parse(await rawReplyRows(page))[0];
    expect(row.retained[0].context.source).toBe(
      "Retained peer source stays raw",
    );
    expect(row.retained[0].context.attempts[0].status).toBe(
      ["uncertain", "pending", "moderation"].includes(peer)
        ? peer
        : peer === "other-id"
          ? "uncertain"
          : "rejected",
    );
    await info.attach("legacy-peer-after.json", {
      body: await rawReplyRows(page),
      contentType: "application/json",
    });
  });
}

test("UX111.legacy-not-sent: actual110 preflight cancellation remains recoverable under its original submission after upgrade", async ({
  page,
}, info) => {
  const fixture = await open(
    page,
    "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
  );
  const source = await selectSourceEditor(page);
  await source.fill("Actual110 immutable not-sent source");
  let release = () => {},
    seen = 0;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  fixture.respond = async (request, response) => {
    if (
      request.method === "GET" &&
      new URL(request.url).searchParams.get("action") === "reply" &&
      ++seen === 2
    )
      await gate;
    return response;
  };
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => seen).toBe(2);
    await source.fill("Newer actual110 input cancels original preflight");
    release();
    await expect(
      page
        .getByText(/Local writing or recovery changed during preflight/)
        .first(),
    ).toBeVisible();
    await waitForReplySaved(page);
    expect(posts(fixture)).toHaveLength(0);
    await info.attach("actual110-not-sent-row.json", {
      body: await rawReplyRows(page),
      contentType: "application/json",
    });
    fixture.useScript("dist/tsdm-ui.user.js");
    await page.goto(threadURL("42"));
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer actual110 input cancels original preflight",
    );
    await expect(
      page.getByText("Reply not sent", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Retry reply", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Retry reply", exact: true })
      .click();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer actual110 input cancels original preflight",
    );
    expect(posts(fixture)).toHaveLength(1);
    expect(
      new URLSearchParams(posts(fixture)[0]!.body ?? "").get("message"),
    ).toBe("Actual110 immutable not-sent source");
  } finally {
    release();
  }
});

test("UX111.independent-threads: two owned pending replies finish on their own threads without replacing either newer draft", async ({
  page,
}) => {
  const fixture = await open(page);
  let release = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await (await selectSourceEditor(page)).fill("Outgoing thread 42");
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    await (await selectSourceEditor(page)).fill("Newer thread 42");
    await page.locator('[data-thread-id="43"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill("Outgoing thread 43");
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(2);
    await (await selectSourceEditor(page)).fill("Newer thread 43");
    release();
    await expect(
      page.getByText(/Confirmed stored reply in thread 43/),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue("Newer thread 43");
    await page.locator('[data-thread-id="42"] .subject').click();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue("Newer thread 42");
    expect(posts(fixture)).toHaveLength(2);
    expect(fixture.saved.get("42")?.get("message")).toBe("Outgoing thread 42");
    expect(fixture.saved.get("43")?.get("message")).toBe("Outgoing thread 43");
  } finally {
    release();
  }
});

test("UX111.late-ancestor: competing risk confirmations create one successor and late original completion cannot release it", async ({
  page,
}, info) => {
  const fixture = await open(page);
  await (await selectSourceEditor(page)).fill("Original may still reach forum");
  let releaseOriginal = () => {},
    releaseSuccessor = () => {};
  fixture.postGate = new Promise<void>((resolve) => {
    releaseOriginal = resolve;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(fixture).length).toBe(1);
    const second = await page.context().newPage();
    await second.goto(threadURL("42"));
    await second
      .getByRole("button", { name: "Check reply status", exact: true })
      .click();
    await expect(
      second.getByRole("button", {
        name: "Retry with duplicate risk",
        exact: true,
      }),
    ).toBeEnabled();
    await (
      await selectSourceEditor(second)
    ).fill("Newer writing while both requests exist");
    await waitForReplySaved(second);
    const third = await page.context().newPage();
    await third.goto(threadURL("42"));
    await third
      .getByRole("button", { name: "Retry with duplicate risk", exact: true })
      .click();
    await second
      .getByRole("button", { name: "Retry with duplicate risk", exact: true })
      .click();
    fixture.postGate = new Promise<void>((resolve) => {
      releaseSuccessor = resolve;
    });
    await second
      .getByRole("button", {
        name: "Accept duplicate risk and retry reply",
        exact: true,
      })
      .click();
    await expect.poll(() => posts(fixture).length).toBe(2);
    await third
      .getByRole("button", {
        name: "Accept duplicate risk and retry reply",
        exact: true,
      })
      .click();
    releaseOriginal();
    await expect(
      page
        .getByText(
          /result could not be saved|changed.*result|could not.*acknowledged|unsaved/i,
        )
        .first(),
    ).toBeVisible();
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await expect(await selectSourceEditor(second)).toHaveValue(
      "Newer writing while both requests exist",
    );
    expect(posts(fixture)).toHaveLength(2);
    const during = JSON.parse(await rawReplyRows(second))[0];
    expect(during.sends).toHaveLength(2);
    expect(during.sends[0].successor).toBe(during.sends[1].attempt.id);
    expect(during.sends[1].attempt.status).toBe("pending");
    fixture.replyOutcome = "lost";
    releaseSuccessor();
    await expect(
      second.getByText("Reply outcome unknown", { exact: true }),
    ).toHaveCount(2);
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await second.reload();
    await expect(await selectSourceEditor(second)).toHaveValue(
      "Newer writing while both requests exist",
    );
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    expect(posts(fixture)).toHaveLength(2);
    await info.attach("late-ancestor-row.json", {
      body: await rawReplyRows(second),
      contentType: "application/json",
    });
    await third.close();
    await second.close();
  } finally {
    releaseOriginal();
    releaseSuccessor();
  }
});

test("UX111.submission-layout: the immutable source and distinct bordered submission fit narrow reading", async ({
  page,
}, info) => {
  const fixture = await open(page);
  await (
    await selectSourceEditor(page)
  ).fill("Long immutable source " + "literal".repeat(80));
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const submission = page.getByRole("article", {
    name: "Reply submission",
    exact: true,
  });
  await submission.scrollIntoViewIfNeeded();
  await expect(submission).toHaveCSS("border-top-width", "1px");
  const bounds = await submission.boundingBox();
  const source = await submission
    .getByRole("textbox", { name: "Submitted reply source", exact: true })
    .boundingBox();
  expect(bounds).not.toBeNull();
  expect(source).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(source!.x).toBeGreaterThan(bounds!.x);
  expect(source!.x + source!.width).toBeLessThan(bounds!.x + bounds!.width);
  await info.attach("narrow-submission.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("UX111.risk-keyboard: duplicate-risk dialog focuses safe cancellation, traps focus and restores the trigger", async ({
  page,
}) => {
  const fixture = await open(page);
  await (await selectSourceEditor(page)).fill("Keyboard Unknown original");
  fixture.replyOutcome = "lost";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Reply outcome unknown", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check reply status", exact: true })
    .click();
  const trigger = page.getByRole("button", {
    name: "Retry with duplicate risk",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Reply duplicate risk",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", {
      name: "Accept duplicate risk and retry reply",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(posts(fixture)).toHaveLength(1);
});

for (const language of ["zh-CN", "zh-TW"] as const) {
  test(`UX111.localized-${language}: sending outcome and recovery controls use the selected language`, async ({
    page,
  }) => {
    const fixture = await open(page);
    await (await selectSourceEditor(page)).fill("原始回覆 literal");
    fixture.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply rejected", { exact: true }),
    ).toBeVisible();
    await openSettings(page);
    await page.locator("#interface-language").selectOption(language);
    await closeSettingsToWorkspace(page);
    const simplified = language === "zh-CN";
    await expect(
      page.getByRole("textbox", {
        name: simplified ? "已提交的回复源码" : "已提交的回覆原始碼",
        exact: true,
      }),
    ).toHaveValue("原始回覆 literal");
    await expect(
      page.getByText(simplified ? "回复被拒绝" : "回覆遭拒絕", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: simplified ? "重试回复" : "重試回覆",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: simplified ? "编辑失败的回复" : "編輯失敗的回覆",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: simplified ? "检查回复状态" : "檢查回覆狀態",
        exact: true,
      }),
    ).toBeVisible();
    expect(posts(fixture)).toHaveLength(1);
  });
}

for (const actor of ["7", "8"] as const) {
  test(`UX111.legacy-edit-${actor}: failed actual110 source can be deliberately continued without replacing newer intent`, async ({
    page,
  }) => {
    const fixture = await open(
      page,
      "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
    );
    await (
      await selectSourceEditor(page)
    ).fill("Legacy failed source for Edit");
    fixture.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText(/forum explicitly refused validation/).first(),
    ).toBeVisible();
    await waitForReplySaved(page);
    fixture.member = actor;
    fixture.useScript("dist/tsdm-ui.user.js");
    await page.goto(threadURL("42"));
    await (
      await selectSourceEditor(page)
    ).fill("Newer intent before legacy Edit");
    if (actor === "8")
      await expect(
        page.getByRole("button", { name: "Retry reply", exact: true }),
      ).toBeDisabled();
    await page
      .getByRole("button", { name: "Edit failed reply", exact: true })
      .click();
    const versions = page.getByRole("region", {
      name: "Recoverable reply versions",
      exact: true,
    });
    await expect(
      versions.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveValue("Legacy failed source for Edit");
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer intent before legacy Edit",
    );
    await versions
      .getByRole("button", { name: "Continue with version 1", exact: true })
      .click();
    await expect(
      page.getByText(
        "Selected version resumed. Other versions remain recoverable.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Legacy failed source for Edit",
    );
    await expect(
      versions.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveValue("Newer intent before legacy Edit");
    expect(posts(fixture)).toHaveLength(1);
  });
}

for (const failure of ["checkpoint", "changed-check"] as const) {
  test(`UX111.legacy-${failure}: legacy coordination failure preserves evidence and cannot authorize Retry`, async ({
    page,
  }, info) => {
    const fixture = await open(
      page,
      "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
    );
    await (
      await selectSourceEditor(page)
    ).fill("Legacy rejected evidence before race");
    fixture.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText(/forum explicitly refused validation/).first(),
    ).toBeVisible();
    await waitForReplySaved(page);
    fixture.useScript("dist/tsdm-ui.user.js");
    await page.goto(threadURL("42"));
    await (
      await selectSourceEditor(page)
    ).fill("Newer source during legacy race");
    await waitForReplySaved(page);
    fixture.replyOutcome = "accepted";
    if (failure === "checkpoint") {
      await page.evaluate(() => {
        const put = IDBObjectStore.prototype.put,
          set = Storage.prototype.setItem;
        let enrolled = false;
        IDBObjectStore.prototype.put = function (value, key) {
          if (
            this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
            value.sends?.length
          )
            enrolled = true;
          return put.call(this, value, key);
        };
        Storage.prototype.setItem = function (key, value) {
          if (enrolled && key === "tsdm.workspace.recovery")
            throw new DOMException(
              "Induced legacy acknowledgement refusal",
              "QuotaExceededError",
            );
          return set.call(this, key, value);
        };
      });
      await page
        .getByRole("button", { name: "Retry reply", exact: true })
        .click();
      await expect(
        page.getByText(
          /historical failure could not be acknowledged unchanged/,
        ),
      ).toBeVisible();
    } else {
      let release = () => {},
        seen = false;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      fixture.respond = async (request, response) => {
        if (
          request.method === "GET" &&
          new URL(request.url).searchParams.get("mod") === "viewthread"
        ) {
          seen = true;
          await gate;
        }
        return response;
      };
      try {
        await page
          .getByRole("button", { name: "Check reply status", exact: true })
          .click();
        await expect.poll(() => seen).toBe(true);
        await page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const r = indexedDB.open("tsdm.workspace.reply-drafts", 1);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          });
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("threads", "readwrite", {
                durability: "strict",
              }),
              store = tx.objectStore("threads"),
              request = store.get("42");
            request.onsuccess = () => {
              const row = request.result,
                peer = structuredClone(row.variants[0]);
              peer.version = crypto.randomUUID();
              peer.context.attempts[0].message =
                "Concurrent unequal observation must remain";
              row.retained = [...(row.retained ?? []), peer];
              row.schema = 2;
              store.put(row);
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onabort = () => {
              db.close();
              reject(tx.error);
            };
          });
        });
        release();
        await expect(
          page.getByText(
            /status observation is retained in this tab but could not be durably acknowledged/,
          ),
        ).toBeVisible();
        const row = JSON.parse(await rawReplyRows(page))[0];
        expect(row.sends ?? []).toHaveLength(0);
        expect(row.retained[0].context.attempts[0].message).toBe(
          "Concurrent unequal observation must remain",
        );
      } finally {
        release();
      }
    }
    expect(posts(fixture)).toHaveLength(1);
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Newer source during legacy race",
    );
    await info.attach("legacy-race-row.json", {
      body: await rawReplyRows(page),
      contentType: "application/json",
    });
  });
}

test("UX111.legacy-contention: genuine tabs racing legacy enrollment can admit at most one retry successor", async ({
  page,
  context,
}, info) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const fixture = await open(
    page,
    "/private/tmp/tsdm-ui-111-baseline/dist/tsdm-ui.user.js",
  );
  await (
    await selectSourceEditor(page)
  ).fill("Exact original legacy contention reply");
  fixture.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/forum explicitly refused validation/).first(),
  ).toBeVisible();
  await waitForReplySaved(page);
  fixture.useScript("dist/tsdm-ui.user.js");
  await page.goto(threadURL("42"));
  await (
    await selectSourceEditor(page)
  ).fill("Newer writing remains after legacy contention");
  await waitForReplySaved(page);
  const second = await context.newPage();
  await second.goto(threadURL("42"));
  await expect(await selectSourceEditor(second)).toHaveValue(
    "Newer writing remains after legacy contention",
  );
  fixture.replyOutcome = "accepted";
  await Promise.all(
    [page, second].map((tab) =>
      tab.getByRole("button", { name: "Retry reply", exact: true }).click(),
    ),
  );
  await expect
    .poll(
      async () =>
        JSON.parse(await rawReplyRows(page))[0].sends?.filter(
          (send: { successor: string | null }) => send.successor,
        ).length,
    )
    .toBe(1);
  await expect.poll(() => posts(fixture).length).toBe(2);
  const row = JSON.parse(await rawReplyRows(page))[0];
  expect(row.sends).toHaveLength(2);
  expect(
    new URLSearchParams(posts(fixture)[1]!.body ?? "").get("message"),
  ).toBe("Exact original legacy contention reply");
  for (const tab of [page, second])
    await expect(await selectSourceEditor(tab)).toHaveValue(
      "Newer writing remains after legacy contention",
    );
  await info.attach("legacy-contention-row.json", {
    body: await rawReplyRows(page),
    contentType: "application/json",
  });
  await second.close();
});
