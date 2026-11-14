import { clickThreadTool } from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  selectSourceEditor,
  revealWritingTools,
  revealWritingDetails,
  revealAdvanced,
} from "./editor-controls";

import {
  origin,
  boardURL,
  createSharedReplyFixture,
  renderSharedReplyResponse,
} from "./shared-reply-fixture";
const ledgers = new WeakMap<
  Page,
  { url: string; method: string; body: string | null }[]
>();
async function open(page: Page, scriptPath = "dist/tsdm-ui.user.js") {
  let built = readFileSync(scriptPath, "utf8");
  const state = createSharedReplyFixture();
  ledgers.set(page, state.requests);
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__retained.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__retained.js"></script></body></html>`,
      });
    return route.fulfill(
      await renderSharedReplyResponse(state, {
        url: request.url(),
        method: request.method(),
        body: request.postData(),
      }),
    );
  });
  await page.goto(boardURL);
  await expect(page.locator(".thread-row")).toHaveCount(3);
  return Object.assign(state, {
    useScript: (path: string) => {
      built = readFileSync(path, "utf8");
    },
  });
}
async function choose(page: Page, id: string) {
  if (!(await page.locator(`[data-thread-id="${id}"] .subject`).count())) {
    if (
      !(await page
        .getByRole("navigation", { name: "Boards navigation", exact: true })
        .getByRole("link", { name: "Music discussion", exact: true })
        .count())
    ) {
      await page
        .getByRole("button", { name: "Refresh thread", exact: true })
        .click();
    }
    await page
      .getByRole("navigation", { name: "Boards navigation", exact: true })
      .getByRole("link", { name: "Music discussion", exact: true })
      .click();
  }
  await page.locator(`[data-thread-id="${id}"] .subject`).click();
  await expect(
    page.getByRole("heading", { name: `Thread ${id}`, exact: true }),
  ).toBeVisible();
}
async function readReplyRows(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("threads", "readonly");
          const rows = tx.objectStore("threads").getAll();
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
async function seedRecovery(page: Page, session: string, rows: string) {
  await page.route("**/__seed", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Recovery fixture seed</title>",
    }),
  );
  await page.goto(`${origin}/__seed`);
  await page.evaluate(
    async ({ session, rows }) => {
      sessionStorage.setItem("tsdm.workspace.recovery", session);
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("threads", { keyPath: "threadId" });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("threads", "readwrite");
          for (const row of JSON.parse(rows))
            tx.objectStore("threads").put(row);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      });
    },
    { session, rows },
  );
}
test.afterEach(async ({ page, browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("retained-requests.json", {
    body: JSON.stringify(ledgers.get(page), null, 2),
    contentType: "application/json",
  });
  await info.attach("retained-writing.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UX108.account-roundtrip: retain one literal reply lineage across A to B to A", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source =
    "[b]Shared A draft[/b]\n[quote]literal quoted words[/quote]\n[unknown]保留[/unknown]";
  await (await selectSourceEditor(page)).fill(source);
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  const readDraft = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  await expect.poll(async () => (await readDraft())?.source).toBe(source);
  const originalId = (await readDraft()).id;
  for (const member of ["8", "7"]) {
    state.member = member;
    await revealWritingDetails(page);
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect(await selectSourceEditor(page)).toHaveValue(source);
    await expect(
      page.getByText(/current account differs from Writer/),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    expect((await readDraft()).account.id).toBe("7");
    await expect(
      page.getByLabel("Select attachments", { exact: true }),
    ).toBeEnabled();
    expect((await readDraft()).id).toBe(originalId);
    await expect(
      page.getByRole("button", {
        name: "Prepare text copy for current account",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
});

test("UX108.publication-actor: revoke A authority then send explicitly as B while retaining immutable B history", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source = "[b]Shared exact reply[/b]\n[quote]Literal quote[/quote]";
  await (await selectSourceEditor(page)).fill(source);
  await revealWritingDetails(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toContainText("Writer 7 (7)");
  state.member = "8";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toContainText("Writer 8 (8)");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.saved.get("42")?.get("message")).toBe(source);
  expect(state.saved.get("42")?.get("reppost")).toBe("4201");
  state.member = "7";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(source);
  const recovered = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(recovered.account.id).toBe("7");
  expect(recovered.attempts[0].publication.submission.writing.account.id).toBe(
    "8",
  );
  expect(
    recovered.attempts[0].publication.submission.writing.replyTarget.postId,
  ).toBe("4201");
  expect(recovered.attempts[0].status).toBe("confirmed");
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
});

test("UX108.upload-owner: explicit B upload keeps B provenance in A's shared composition through recovery", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared attachment content");
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("B selected content"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert intent.txt", exact: true })
    .click();
  const read = () =>
    page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
    );
  await expect
    .poll(async () => (await read()).writing.uploads[0].ownerId)
    .toBe("8");
  expect((await read()).writing.account.id).toBe("7");
  expect((await read()).schema).toBe(6);
  const before = (await read()).writing.source;
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(before);
  expect((await read()).writing.uploads[0].ownerId).toBe("8");
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(1);
});

test("UX108.attachment-availability: permissive lists cannot transfer ownership and returning owner rechecks current server intent", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Preserved text with attachment");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A selected content"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  const original = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Unavailable · intent.txt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toHaveCount(0);
  state.member = "7";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  state.uploaded = false;
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Unavailable · intent.txt", { exact: true }),
  ).toBeVisible();
  const recovered = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(recovered.writing.source).toBe("Preserved text with attachment");
  expect(recovered.writing.uploads).toEqual(
    JSON.parse(original!).writing.uploads,
  );
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toHaveLength(0);
});

test("UX108.reattach-spans: explicit B replacement changes only balanced literal spans and atomically binds the replacement owner", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A bytes"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  const source =
    "保留 [b]bold[/b] [AtTaCh] 88 [/aTtAcH]\n[quote][attach]88[/attach][/quote] [code][attachimg]\n88\n[/attachimg][/code]\n188 88 [attach]188[/attach] [attach=88]88[/attach] [attach]88[/attachimg] &lbrack;attach&rbrack;88";
  await (await selectSourceEditor(page)).fill(source);
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Reattach replaces.*including quoted and code examples/),
  ).toBeVisible();
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("B replacement bytes"),
  });
  const expected =
    "保留 [b]bold[/b] [AtTaCh] 89 [/aTtAcH]\n[quote][attach]89[/attach][/quote] [code][attach]\n89\n[/attach][/code]\n188 88 [attach]188[/attach] [attach=88]88[/attach] [attach]88[/attachimg] &lbrack;attach&rbrack;88";
  await expect(await selectSourceEditor(page)).toHaveValue(expected);
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  await expect
    .poll(async () =>
      (await read()).uploads.map((u: { serverId?: string }) => u.serverId),
    )
    .toEqual(["89"]);
  const writing = await read();
  expect(writing.uploads[0].name).toBe("replacement.txt");
  expect(writing.uploads[0].ownerId).toBe("8");
  expect(writing.account.id).toBe("7");
  expect(writing.uploadedReferences).toEqual(["89"]);
  expect(
    writing.attachmentFields.every((f: { name: string }) =>
      f.name.startsWith("attachnew[89]"),
    ),
  ).toBe(true);
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(2);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toHaveLength(0);
});

test("UX108.remove-intent: unavailable Remove deletes only its literal spans without remote deletion and preserves available-file confirmation", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A bytes"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove server file intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Keep server file", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill(
    "[b]Keep[/b] [attach]88[/attach] [quote][attachimg] 88 [/attachimg][/quote] 188 [attach]188[/attach]",
  );
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Remove intent.txt", exact: true })
    .click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b]  [quote][/quote] 188 [attach]188[/attach]",
  );
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  await expect.poll(async () => (await read()).uploads.length).toBe(0);
  expect((await read()).uploadedReferences).toEqual([]);
  expect((await read()).attachmentFields).toEqual([]);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toHaveLength(0);
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
});

test("UX108.actor-tools: B retargets mentions and explicitly removes its server file in the original A composition", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Retained words ");
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Refresh thread", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  await expect.poll(async () => (await read()).replyTarget.postId).toBe("4201");
  await revealAdvanced(page);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 6)", exact: true })
    .click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Retained words @\u2063Other author\u2063 ",
  );
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "owned.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("B file"),
  });
  await page
    .getByRole("button", { name: "Upload owned.txt", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove server file owned.txt", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Confirm immediate file removal",
      exact: true,
    })
    .click();
  await expect
    .poll(
      () =>
        state.requests.filter(
          (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
        ).length,
    )
    .toBe(1);
  await expect
    .poll(async () => (await read()).uploads[0].status)
    .toBe("removed");
  expect((await read()).account.id).toBe("7");
  expect((await read()).uploads[0].ownerId).toBe("8");
});

for (const provenance of [
  "schema6-missing",
  "schema6-null",
  "legacy5",
] as const) {
  test(`UX108.owner-${provenance}: distinguish legacy uploader evidence from explicit unknown or incomplete new input`, async ({
    page,
    browser,
  }) => {
    await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("[b]Provenance source stays intact[/b]");
    await revealWritingTools(page);
    await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
      name: "intent.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Captured fixture bytes"),
    });
    await page
      .getByRole("button", { name: "Upload intent.txt", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Insert intent.txt", exact: true }),
    ).toBeVisible();
    const record = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
    );
    if (provenance === "schema6-null") record.writing.uploads[0].ownerId = null;
    else delete record.writing.uploads[0].ownerId;
    if (provenance === "legacy5") record.schema = 5;
    record.replyCheckpoints = {};
    const raw = JSON.stringify(record);
    const isolated = await browser.newContext({ offline: true });
    const restored = await isolated.newPage();
    await restored.addInitScript(
      (value) => sessionStorage.setItem("tsdm.workspace.recovery", value),
      raw,
    );
    const state = await open(restored);
    state.uploaded = true;
    state.uploads.set("88", "attach");
    if (provenance === "schema6-missing") {
      await expect(
        restored.getByRole("alert").filter({ hasText: /incompatible/i }),
      ).toBeVisible();
      expect(
        await restored.evaluate(() =>
          sessionStorage.getItem("tsdm.workspace.recovery"),
        ),
      ).toBe(raw);
      await expect(restored.locator(".source-writing")).toHaveCount(0);
    } else {
      await choose(restored, "42");
      await restored
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      await expect(await selectSourceEditor(restored)).toHaveValue(
        "[b]Provenance source stays intact[/b]",
      );
      await revealWritingDetails(restored);
      await restored
        .getByRole("button", {
          name: "Check current account and form",
          exact: true,
        })
        .click();
      if (provenance === "schema6-null") {
        await expect(
          restored.getByText("Unavailable · intent.txt", { exact: true }),
        ).toBeVisible();
        await expect(
          restored.getByRole("button", {
            name: "Insert intent.txt",
            exact: true,
          }),
        ).toHaveCount(0);
      } else {
        await expect(
          restored.getByRole("button", {
            name: "Insert intent.txt",
            exact: true,
          }),
        ).toBeVisible();
      }
      const recovered = await restored.evaluate(() =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
      );
      expect(recovered.schema).toBe(6);
      expect(recovered.writing.uploads[0].ownerId).toBe(
        provenance === "legacy5" ? "7" : null,
      );
    }
    await test.info().attach("provenance.png", {
      body: await restored.screenshot(),
      contentType: "image/png",
    });
    await test.info().attach("provenance-requests.json", {
      body: JSON.stringify(state.requests),
      contentType: "application/json",
    });
    await isolated.close();
  });
}

test("UX108.actual107-upgrade: old checkpoints and heads survive owner materialization and clean remote adoption while dirty stale writing conflicts", async ({
  page,
  browser,
}) => {
  const baseline = process.env.TSDM_UI_107_BASELINE;
  test.skip(
    !baseline,
    "Set TSDM_UI_107_BASELINE to the preserved exact #107 executable for upgrade qualification.",
  );
  test.info().annotations.push({
    type: "baseline-userscript-sha256",
    description: createHash("sha256")
      .update(readFileSync(baseline!))
      .digest("hex"),
  });
  const state = await open(page, baseline!);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Actual107 legacy content");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "legacy.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Legacy107 bytes"),
  });
  await page
    .getByRole("button", { name: "Upload legacy.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert legacy.txt", exact: true }),
  ).toBeVisible();
  const oldSession = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery")!,
  );
  const oldRecord = JSON.parse(oldSession);
  expect(oldRecord.schema).toBe(5);
  expect(oldRecord.writing.uploads[0].ownerId).toBeUndefined();
  const oldRows = await readReplyRows(page);
  const oldVersion = JSON.parse(oldRows)[0].variants[0].version;
  state.useScript("dist/tsdm-ui.user.js");
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Actual107 legacy content",
  );
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert legacy.txt", exact: true }),
  ).toBeVisible();
  const upgraded = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(upgraded.schema).toBe(6);
  expect(upgraded.writing.uploads[0].ownerId).toBe("7");
  expect(upgraded.replyCheckpoints["42"]).toEqual(
    oldRecord.replyCheckpoints["42"],
  );
  expect(await readReplyRows(page)).toBe(oldRows);
  const clean = await page.context().newPage();
  ledgers.set(clean, state.requests);
  await clean.goto(boardURL);
  await choose(clean, "42");
  if (!(await clean.locator(".source-writing").isVisible()))
    await clean
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
  await expect(await selectSourceEditor(clean)).toHaveValue(
    "Actual107 legacy content",
  );
  for (const member of ["8", "7"]) {
    state.member = member;
    for (const tab of [page, clean]) {
      await revealWritingDetails(tab);
      await tab
        .getByRole("button", {
          name: "Check current account and form",
          exact: true,
        })
        .click();
    }
  }
  expect(await readReplyRows(page)).toBe(oldRows);
  await (
    await selectSourceEditor(page)
  ).fill("Genuine current authored successor");
  await expect(await selectSourceEditor(clean)).toHaveValue(
    "Genuine current authored successor",
  );
  const newRows = await readReplyRows(page),
    row = JSON.parse(newRows)[0];
  expect(row.variants).toHaveLength(1);
  expect(row.variants[0].parent).toBe(oldVersion);
  expect(row.variants[0].context.uploads[0].ownerId).toBe("7");
  const staleRecord = JSON.parse(oldSession);
  staleRecord.writing.source = "Dirty stale legacy contender";
  staleRecord.writing.revision++;
  const isolated = await browser.newContext({ offline: true });
  const stale = await isolated.newPage();
  await seedRecovery(stale, JSON.stringify(staleRecord), newRows);
  const staleState = await open(stale);
  await choose(stale, "42");
  if (!(await stale.locator(".source-writing").isVisible()))
    await stale
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
  await expect
    .poll(async () => JSON.parse(await readReplyRows(stale))[0].variants.length)
    .toBe(2);
  const competitors = JSON.parse(await readReplyRows(stale))[0].variants;
  expect(
    competitors
      .map((v: { context: { source: string } }) => v.context.source)
      .sort(),
  ).toEqual([
    "Dirty stale legacy contender",
    "Genuine current authored successor",
  ]);
  expect(
    competitors.find(
      (v: { context: { source: string } }) =>
        v.context.source === "Dirty stale legacy contender",
    ).parent,
  ).toBe(oldVersion);
  await test.info().attach("legacy-checkpoints-and-rows.json", {
    body: JSON.stringify({
      oldSession: oldRecord,
      oldRows: JSON.parse(oldRows),
      upgraded,
      newRows: JSON.parse(newRows),
      competitors,
      staleRequests: staleState.requests,
    }),
    contentType: "application/json",
  });
  await test.info().attach("legacy-conflict.png", {
    body: await stale.screenshot(),
    contentType: "image/png",
  });
  await isolated.close();
  await clean.close();
});

test("UX108.lost-local-bytes: reload retains named intent, local reattachment selects new bytes without upload and Remove preserves text", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = "[b]Preserved local writing[/b]\n[quote]Quoted words[/quote]";
  await (await selectSourceEditor(page)).fill(source);
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "lost.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("PRIVATE_LOST_BYTES_108"),
  });
  await expect(
    page.getByRole("button", { name: "Upload lost.txt", exact: true }),
  ).toBeVisible();
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(source);
  await revealWritingTools(page);
  await expect(
    page.getByText("Unavailable · lost.txt", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Reattach lost.txt", { exact: true }).setInputFiles([]);
  await expect(
    page.getByText("Unavailable · lost.txt", { exact: true }),
  ).toBeVisible();
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Check current account and form",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await page.getByLabel("Reattach lost.txt", { exact: true }).setInputFiles({
    name: "chosen.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("PRIVATE_NEW_BYTES_108"),
  });
  await expect(
    page.getByRole("button", { name: "Upload chosen.txt", exact: true }),
  ).toBeVisible();
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  const raw = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery")!,
  );
  expect(raw).not.toContain("PRIVATE_NEW_BYTES_108");
  expect(raw).not.toContain("PRIVATE_LOST_BYTES_108");
  await revealWritingDetails(page);
  await expect(
    page.getByText("Local reply draft saved in this browser profile.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await revealWritingTools(page);
  await page
    .getByRole("button", { name: "Remove chosen.txt", exact: true })
    .click();
  await expect(await selectSourceEditor(page)).toHaveValue(source);
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  expect(state.saved.get("42")?.get("message")).toBe(source);
  expect(
    [...state.saved.get("42")!.keys()].some((k) => k.startsWith("attach")),
  ).toBe(false);
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(0);
});

test("UX108.repaired-payload: a visual-mode replacement adopts the qualified reference kind and sends only the new attachment fields", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A content"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  await (
    await selectSourceEditor(page)
  ).fill("[b]Before[/b] [attach] 88 [/attach] after");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  state.member = "8";
  state.nextReferenceKind = "attachimg";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("B replacement content"),
  });
  const source = "[b]Before[/b] [attachimg] 89 [/attachimg] after";
  await expect(await selectSourceEditor(page)).toHaveValue(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toContainText("Writer 8 (8)");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await page
    .getByRole("button", {
      name: "Check stored bytes replacement.txt",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      "The forum no longer offers this attachment for direct download. No purchase was attempted.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Insert replacement.txt", exact: true }),
  ).toBeVisible();
  const payload = state.saved.get("42")!;
  expect(payload.get("message")).toBe(source);
  expect([...payload.keys()].filter((k) => k.startsWith("attachnew"))).toEqual([
    "attachnew[89][description]",
    "attachnew[89][price]",
    "attachnew[89][readperm]",
  ]);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toHaveLength(0);
});

for (const durable of ["present", "empty"] as const) {
  test(`UX108.old107-refusal-${durable}: old executable preserves newer session and owner-bearing row without stripping provenance`, async ({
    page,
    browser,
  }) => {
    const baseline = process.env.TSDM_UI_107_BASELINE;
    test.skip(
      !baseline,
      "Set TSDM_UI_107_BASELINE to the exact preserved #107 executable.",
    );
    test.info().annotations.push({
      type: "baseline-userscript-sha256",
      description: createHash("sha256")
        .update(readFileSync(baseline!))
        .digest("hex"),
    });
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("New B owner in stable A composition");
    state.member = "8";
    await revealWritingDetails(page);
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
      name: "new.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("New B bytes"),
    });
    await page
      .getByRole("button", { name: "Upload new.txt", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Insert new.txt", exact: true }),
    ).toBeVisible();
    const raw = await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    expect(JSON.parse(raw).writing.account.id).toBe("7");
    expect(JSON.parse(raw).writing.uploads[0].ownerId).toBe("8");
    const rows = durable === "present" ? await readReplyRows(page) : "[]";
    const isolated = await browser.newContext({ offline: true });
    const old = await isolated.newPage();
    await seedRecovery(old, raw, rows);
    const oldState = await open(old, baseline!);
    await expect(
      old
        .getByRole("alert")
        .filter({ hasText: /incompatible/i })
        .first(),
    ).toBeVisible();
    expect(
      await old.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ).toBe(raw);
    expect(await readReplyRows(old)).toBe(rows);
    await expect(old.locator(".source-writing")).toHaveCount(0);
    expect(oldState.requests.filter((r) => r.method !== "GET")).toHaveLength(0);
    await test.info().attach("old-refusal.png", {
      body: await old.screenshot(),
      contentType: "image/png",
    });
    await test.info().attach("old-refusal-storage.json", {
      body: JSON.stringify({
        raw,
        rows: JSON.parse(rows),
        requests: oldState.requests,
      }),
      contentType: "application/json",
    });
    await isolated.close();
  });
}

test("UX108.shared-confirmed-indicator: confirmed B reply in A lineage is no longer marked unfinished", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Shared confirmed writing");
  await expect(page.locator('[data-thread-id="42"]')).toContainText(
    "Local draft",
  );
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await choose(page, "42");
  await expect(page.locator('[data-thread-id="42"]')).not.toContainText(
    "Local draft",
  );
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Shared confirmed writing plus new words");
  await expect(page.locator('[data-thread-id="42"]')).toContainText(
    "Local draft",
  );
});

async function unavailableServerIntent(page: Page) {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("original bytes"),
  });
  await page
    .getByRole("button", { name: "Upload intent.txt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Insert intent.txt", exact: true }),
  ).toBeVisible();
  await (
    await selectSourceEditor(page)
  ).fill("[b]Keep[/b] [attach]88[/attach] tail");
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await expect(
    page.getByText("Unavailable · intent.txt", { exact: true }),
  ).toBeVisible();
  return state;
}

for (const change of ["source", "account"] as const) {
  test(`UX108.repair-stale-${change}: dispatched replacement retains original intent and separate captured-owner outcome`, async ({
    page,
  }) => {
    const state = await unavailableServerIntent(page);
    let release!: () => void;
    state.uploadGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page
      .getByLabel("Reattach intent.txt", { exact: true })
      .setInputFiles({
        name: "replacement.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("replacement bytes"),
      });
    await expect
      .poll(
        () =>
          state.requests.filter((r) => new URL(r.url).pathname === "/misc.php")
            .length,
      )
      .toBe(2);
    const source =
      change === "source"
        ? "Edited during upload [attach]88[/attach]"
        : "[b]Keep[/b] [attach]88[/attach] tail";
    if (change === "source")
      await (await selectSourceEditor(page)).fill(source);
    else {
      state.member = "7";
      await page
        .getByRole("button", {
          name: "Check current account and form",
          exact: true,
        })
        .click();
      await expect(page.locator(".writing-destination")).toContainText(
        "Writer 7 (7)",
      );
    }
    release();
    await expect(
      page
        .getByText(
          change === "source"
            ? /Original intent and the separate upload result are retained/
            : /Upload may have reached the forum/,
        )
        .first(),
    ).toBeVisible();
    await expect(await selectSourceEditor(page)).toHaveValue(source);
    const read = () =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
            .writing,
      );
    await expect.poll(async () => (await read()).uploads.length).toBe(2);
    const writing = await read();
    expect(
      writing.uploads.map((u: { serverId?: string; ownerId: string }) => [
        u.serverId,
        u.ownerId,
      ]),
    ).toEqual([
      ["88", "7"],
      [change === "source" ? "89" : undefined, "8"],
    ]);
    if (change === "source") expect(writing.uploadedReferences).toContain("89");
    else {
      expect(writing.uploads[1].status).toBe("uncertain");
      expect(writing.uploadedReferences).not.toContain("89");
    }
    expect(
      state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
    ).toHaveLength(2);
    expect(
      state.requests.filter(
        (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
      ),
    ).toHaveLength(0);
    await test.info().attach("stale-repair-writing.json", {
      body: JSON.stringify(writing),
      contentType: "application/json",
    });
  });
}

test("UX108.repair-storage-refusal: refused checkpoint prevents replacement upload and retains old intent", async ({
  page,
}) => {
  const state = await unavailableServerIntent(page);
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, access, options) {
      if (this.name === "tsdm.workspace.reply-drafts" && access === "readwrite")
        throw new DOMException("Induced durable host refusal", "SecurityError");
      return original.call(this, names, access, options);
    };
  });
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "blocked.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("blocked replacement"),
  });
  await expect(
    page.getByText(/Local reply drafts could not be saved/).first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Recovery or writing changed. No replacement was uploaded.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b] [attach]88[/attach] tail",
  );
  await expect(
    page.getByText("Unavailable · intent.txt", { exact: true }),
  ).toBeVisible();
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(1);
});

test("UX108.repair-adoption-refusal: final native write refusal retains old source and acknowledged original-actor upload result", async ({
  page,
}) => {
  const state = await unavailableServerIntent(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    const writes: unknown[] = [];
    Object.assign(window, { repairWrites: writes });
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.transaction.db.name === "tsdm.workspace.reply-drafts") {
        writes.push(JSON.parse(JSON.stringify(value)));
        if (
          value.variants?.some((v: { context: { source: string } }) =>
            v.context.source.includes("[attach]89[/attach]"),
          )
        )
          throw new DOMException(
            "Induced final repair write refusal",
            "QuotaExceededError",
          );
      }
      return original.call(this, value, key);
    };
  });
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("replacement bytes"),
  });
  await expect(
    page.getByText(
      /Original intent and the separate upload result are retained/,
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b] [attach]88[/attach] tail",
  );
  const read = () =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
    );
  await expect.poll(async () => (await read()).uploads.length).toBe(2);
  const writing = await read();
  expect(
    writing.uploads.map((u: { serverId: string; ownerId: string }) => [
      u.serverId,
      u.ownerId,
    ]),
  ).toEqual([
    ["88", "7"],
    ["89", "8"],
  ]);
  const writes = await page.evaluate(
    () =>
      (
        window as unknown as {
          repairWrites: {
            variants: {
              context: { source: string; uploadedReferences: string[] };
            }[];
          }[];
        }
      ).repairWrites,
  );
  expect(
    writes.some((row) =>
      row.variants.some((v) =>
        v.context.source.includes("[attach]89[/attach]"),
      ),
    ),
  ).toBe(true);
  for (const row of writes)
    for (const v of row.variants)
      if (v.context.source.includes("[attach]89[/attach]")) {
        expect(v.context.uploadedReferences).toContain("89");
        expect(v.context.uploadedReferences).not.toContain("88");
      }
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(2);
  await test.info().attach("native-repair-write-snapshots.json", {
    body: JSON.stringify({ writes, writing }),
    contentType: "application/json",
  });
});

for (const observation of ["guest", "unknown", "refused-B"] as const) {
  test(`UX108.authority-${observation}: a ready review is revoked without losing source or dispatching an effect`, async ({
    page,
  }) => {
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source =
      "[b]Literal source[/b]\n[quote]Preserved quoted writing[/quote]";
    await (await selectSourceEditor(page)).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeVisible();
    state.member = observation === "refused-B" ? "8" : observation;
    state.refusedReply = observation === "refused-B";
    await revealWritingDetails(page);
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toHaveCount(0);
    await expect(await selectSourceEditor(page)).toHaveValue(source);
    await expect(
      page.getByLabel("Select attachments", { exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toHaveCount(0);
    expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  });
}

for (const kind of ["kind", "controls"] as const) {
  test(`UX108.attachment-proof-${kind}: mismatched fresh native evidence cannot restore usable intent`, async ({
    page,
  }) => {
    const state = await unavailableServerIntent(page);
    state.member = "7";
    if (kind === "kind") state.uploads.set("88", "attachimg");
    else state.attachmentFieldsMissing = true;
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect(page.locator(".writing-destination")).toContainText(
      "Writer 7 (7)",
    );
    await expect
      .poll(
        () =>
          state.requests.filter(
            (r) => new URL(r.url).searchParams.get("action") === "attachlist",
          ).length,
      )
      .toBeGreaterThan(1);
    await expect(
      page.getByText("Unavailable · intent.txt", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toHaveCount(0);
    await expect(await selectSourceEditor(page)).toHaveValue(
      "[b]Keep[/b] [attach]88[/attach] tail",
    );
    expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
  });
}

test("UX108.file-read-actor-race: replacement bytes delivered after an actor change cannot change retained intent", async ({
  page,
}) => {
  const state = await unavailableServerIntent(page);
  await page.evaluate(() => {
    const original = File.prototype.arrayBuffer;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    Object.assign(window, { releaseFile: release, fileReadWaiting: false });
    File.prototype.arrayBuffer = async function () {
      Object.assign(window, { fileReadWaiting: true });
      await gate;
      return original.call(this);
    };
  });
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "late.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("late bytes"),
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { fileReadWaiting: boolean }).fileReadWaiting,
      ),
    )
    .toBe(true);
  state.member = "7";
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 7 (7)",
  );
  await page.evaluate(() =>
    (window as unknown as { releaseFile: () => void }).releaseFile(),
  );
  await expect(
    page.getByText(
      "The writing or account changed while reading the replacement. Choose it again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b] [attach]88[/attach] tail",
  );
  expect(
    state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
  ).toHaveLength(1);
});

for (const timing of ["before", "after"] as const) {
  test(`UX108.repair-conflict-${timing}: competing heads block new effects or retain already-dispatched original outcome`, async ({
    page,
    context,
  }) => {
    await context.addInitScript(() =>
      Object.defineProperty(window, "BroadcastChannel", {
        value: undefined,
        configurable: true,
      }),
    );
    const state = await unavailableServerIntent(page);
    const other = await context.newPage();
    await other.goto(boardURL);
    await choose(other, "42");
    if (!(await other.locator(".source-writing").isVisible()))
      await other
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
    const otherEditor = await selectSourceEditor(other);
    await expect(otherEditor).toHaveValue(
      "[b]Keep[/b] [attach]88[/attach] tail",
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousForms = state.requests.filter(
      (r) => new URL(r.url).searchParams.get("mod") === "post",
    ).length;
    if (timing === "before") state.gate = { thread: "42", promise: gate };
    else state.uploadGate = gate;
    await page
      .getByLabel("Reattach intent.txt", { exact: true })
      .setInputFiles({
        name: "replacement.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("replacement bytes"),
      });
    if (timing === "before")
      await expect
        .poll(
          () =>
            state.requests.filter(
              (r) => new URL(r.url).searchParams.get("mod") === "post",
            ).length,
        )
        .toBeGreaterThan(previousForms);
    else
      await expect
        .poll(
          () =>
            state.requests.filter(
              (r) => new URL(r.url).pathname === "/misc.php",
            ).length,
        )
        .toBe(2);
    await otherEditor.fill("Competing tab content [attach]88[/attach]");
    await expect(
      other.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    release();
    state.gate = null;
    await expect(
      page.getByRole("region", { name: "Conflicting local reply drafts" }),
    ).toBeVisible();
    if (timing === "after")
      await expect(
        page.getByText(
          /Original intent and the separate upload result are retained/,
        ),
      ).toBeVisible();
    else
      await expect(
        page.getByText(/Nothing was uploaded/).first(),
      ).toBeVisible();
    const rows = JSON.parse(await readReplyRows(page));
    expect(rows[0].variants).toHaveLength(2);
    await expect
      .poll(async () =>
        JSON.parse(await readReplyRows(page))[0]
          .variants.map(
            (v: { context: { source: string } }) => v.context.source,
          )
          .sort(),
      )
      .toEqual(
        [
          "Competing tab content [attach]88[/attach]",
          "[b]Keep[/b] [attach]88[/attach] tail",
        ].sort(),
      );
    if (timing === "after") {
      await expect
        .poll(async () =>
          JSON.parse(await readReplyRows(page))[0].variants.some(
            (v: {
              context: { uploads: { serverId?: string; ownerId?: string }[] };
            }) =>
              v.context.uploads.some(
                (u) => u.serverId === "89" && u.ownerId === "8",
              ),
          ),
        )
        .toBe(true);
    }
    expect(
      state.requests.filter((r) => new URL(r.url).pathname === "/misc.php"),
    ).toHaveLength(timing === "before" ? 1 : 2);
    await test.info().attach("conflicting-repair-heads.json", {
      body: await readReplyRows(page),
      contentType: "application/json",
    });
    await other.close();
  });
}

test("UX108.repair-undo: editor undo restores literal old reference without manufacturing usable upload authority", async ({
  page,
}) => {
  const state = await unavailableServerIntent(page);
  await page.getByLabel("Reattach intent.txt", { exact: true }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("replacement bytes"),
  });
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b] [attach]89[/attach] tail",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "[b]Keep[/b] [attach]88[/attach] tail",
  );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(2);
});

for (const pending of ["review", "mention"] as const) {
  test(`UX108.late-${pending}: old actor's delayed result cannot authorize or insert after current actor changes`, async ({
    page,
  }) => {
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill("Exact preserved words");
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    if (pending === "review") {
      state.gate = { thread: "42", promise: gate };
      const count = state.requests.length;
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await expect.poll(() => state.requests.length).toBeGreaterThan(count);
    } else {
      state.mentionGate = gate;
      await revealAdvanced(page);
      await page
        .getByLabel("Find a person to mention", { exact: true })
        .fill("Other author");
      await page
        .getByRole("button", { name: "Find mention", exact: true })
        .click();
      await expect
        .poll(() =>
          state.requests.some((r) => new URL(r.url).pathname === "/plugin.php"),
        )
        .toBe(true);
    }
    state.member = "8";
    await clickThreadTool(page, "Refresh thread");
    await expect(page.locator(".writing-destination")).toContainText(
      "Writer 8 (8)",
    );
    release();
    state.gate = null;
    state.mentionGate = null;
    // A fresh deliberate form check also provides a completion boundary for the
    // old response; neither old result may become a usable control afterward.
    await revealWritingDetails(page);
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect(page.locator(".writing-destination")).toContainText(
      "Writer 8 (8)",
    );
    await expect(
      page.getByRole("button", { name: "Send reply", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Mention Other author (UID 6)",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Exact preserved words",
    );
    expect(
      state.requests.filter(
        (r) => r.method === "POST" && new URL(r.url).pathname !== "/plugin.php",
      ),
    ).toHaveLength(0);
  });
}

test("UX108.raw-crlf-repair: repair preserves exact recovered CRLF bytes and Unicode outside selected literal spans", async ({
  page,
  browser,
}) => {
  await unavailableServerIntent(page);
  const record = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  const source =
    "[b]保留[/b]\r\n[quote]literal [attach] 88 [/attach][/quote]\r\n[code]unchanged example 880[/code]\r\n";
  record.writing.source = source;
  record.writing.revision += 1;
  record.replyCheckpoints = {};
  const isolated = await browser.newContext({ offline: true });
  const recovered = await isolated.newPage();
  const state = await open(recovered);
  state.member = "8";
  state.uploaded = true;
  state.uploads.set("88", "attach");
  state.nextUploadId = 89;
  await seedRecovery(recovered, JSON.stringify(record), "[]");
  await recovered.goto(boardURL);
  await choose(recovered, "42");
  if (!(await recovered.locator(".source-writing").isVisible()))
    await recovered
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
  await selectSourceEditor(recovered);
  await revealWritingTools(recovered);
  await revealWritingDetails(recovered);
  await recovered
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(recovered.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await recovered
    .getByLabel("Reattach intent.txt", { exact: true })
    .setInputFiles({
      name: "crlf.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("replacement bytes"),
    });
  const expected =
    "[b]保留[/b]\r\n[quote]literal [attach] 89 [/attach][/quote]\r\n[code]unchanged example 880[/code]\r\n";
  await expect
    .poll(() =>
      recovered.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .source,
      ),
    )
    .toBe(expected);
  const rows = JSON.parse(await readReplyRows(recovered));
  expect(rows[0].variants[0].context.source).toBe(expected);
  await test.info().attach("raw-crlf-repair.json", {
    body: JSON.stringify({
      source,
      expected,
      rows,
      requests: state.requests,
    }),
    contentType: "application/json",
  });
  await test.info().attach("raw-crlf-repair.png", {
    body: await recovered.screenshot(),
    contentType: "image/png",
  });
  await isolated.close();
});

test("UX108.composing-actor: observed actor change preserves in-progress editor text and does not submit", async ({
  page,
}) => {
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = "[b]正在編輯[/b] [quote]literal quotation[/quote]";
  const editor = await selectSourceEditor(page);
  await editor.fill(source);
  await editor.dispatchEvent("compositionstart", { data: "編" });
  state.member = "8";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(page.locator(".writing-destination")).toContainText(
    "Writer 8 (8)",
  );
  await expect(editor).toHaveValue(source);
  await expect(
    page.getByRole("button", { name: "Review publication", exact: true }),
  ).toBeDisabled();
  await editor.dispatchEvent("compositionend", { data: "編" });
  await expect(editor).toHaveValue(source);
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  test.info().annotations.push({
    type: "composition-boundary",
    description:
      "Browser-dispatched composition events; not an actual OS IME session.",
  });
});
