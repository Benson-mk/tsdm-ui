import { refreshReplyFromNative } from "./editor-controls";
import { openSettings, closeSettingsToWorkspace } from "./navigation-ui";
import { chooseAttachments, revealWritingOptions } from "./editor-controls";
import { waitForReplySaved } from "./editor-controls";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  selectSourceEditor,
  revealWritingDetails,
  revealWritingTools,
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

test.afterEach(async ({ page, context, browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("conflict-requests.json", {
    body: JSON.stringify(ledgers.get(page), null, 2),
    contentType: "application/json",
  });
  for (const [index, tab] of context.pages().entries()) {
    await info.attach(`tab-${index}.png`, {
      body: await tab.screenshot(),
      contentType: "image/png",
    });
    await tab.evaluate(() =>
      (window as unknown as { restore109Host?: () => void }).restore109Host?.(),
    );
    await info.attach(`tab-${index}-rows.json`, {
      body: await readReplyRows(tab),
      contentType: "application/json",
    });
  }
});

test("UX109.choose: keyboard choice resumes exact selected draft and retains the alternative across reload and a fresh tab", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    });
  });
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Common draft");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const otherEditor = await selectSourceEditor(other);
  await expect(otherEditor).toHaveValue("Common draft");
  const first = "[b]First competing 原文[/b]\n[unknown]keep exact[/unknown]";
  const second = "Second competing [quote]untouched[/quote]";
  await (await selectSourceEditor(page)).fill(first);
  await waitForReplySaved(page);
  await otherEditor.fill(second);
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  expect(
    await conflict
      .getByRole("textbox")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLTextAreaElement).value),
      ),
  ).toEqual(expect.arrayContaining([first, second]));
  await test.info().attach("before-choice.json", {
    body: await readReplyRows(other),
    contentType: "application/json",
  });
  const displayedVersions = await conflict
    .getByRole("textbox")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    );
  const resume = conflict.getByRole("button", {
    name: `Continue with version ${displayedVersions.indexOf(first) + 1}`,
    exact: true,
  });
  await expect(resume).toBeVisible();
  await resume.focus();
  await other.keyboard.press("Enter");
  await expect(conflict).toHaveCount(0);
  await expect(await selectSourceEditor(other)).toHaveValue(first);
  await expect(await selectSourceEditor(other)).not.toHaveAttribute(
    "readonly",
    "",
  );
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await expect(alternatives.getByRole("textbox")).toHaveValue(second);
  await (await selectSourceEditor(other)).fill(first + "\nResumed typing");
  await revealWritingDetails(other);
  await waitForReplySaved(other);
  await other.reload();
  await expect(await selectSourceEditor(other)).toHaveValue(
    first + "\nResumed typing",
  );
  await expect(
    other
      .getByRole("region", { name: "Recoverable reply versions" })
      .getByRole("textbox"),
  ).toHaveValue(second);
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    first + "\nResumed typing",
  );
  await expect(
    fresh
      .getByRole("region", { name: "Recoverable reply versions" })
      .getByRole("textbox"),
  ).toHaveValue(second);
  expect(
    state.requests.filter(
      (r) =>
        r.method !== "GET" ||
        new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toEqual([]);
});

async function conflictingPair(
  page: Page,
  context: import("@playwright/test").BrowserContext,
  withThird = false,
) {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Common observed draft");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const editor = await selectSourceEditor(other);
  await expect(editor).toHaveValue("Common observed draft");
  const third = withThird ? await context.newPage() : null;
  if (third) {
    await third.goto(boardURL);
    await choose(third, "42");
    await expect(await selectSourceEditor(third)).toHaveValue(
      "Common observed draft",
    );
  }
  await (await selectSourceEditor(page)).fill("First retained source");
  await waitForReplySaved(page);
  await editor.fill("Second retained source");
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  await test.info().attach("pair-before.json", {
    body: await readReplyRows(other),
    contentType: "application/json",
  });
  return { state, other, conflict, third };
}

test("UX109.disposition: selecting an alternative preserves current writing until a separate exact-version discard confirmation", async ({
  page,
  context,
}) => {
  const { state, other, conflict } = await conflictingPair(page, context);
  const displayed = await conflict
    .getByRole("textbox")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLTextAreaElement).value),
    );
  expect(displayed).toEqual(
    expect.arrayContaining(["First retained source", "Second retained source"]),
  );
  await conflict
    .getByRole("button", {
      name: `Continue with version ${displayed.indexOf("First retained source") + 1}`,
      exact: true,
    })
    .click();
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await expect(alternatives.getByRole("textbox")).toHaveValue(
    "Second retained source",
  );
  await alternatives
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Second retained source",
  );
  await expect(alternatives.getByRole("textbox")).toHaveValue(
    "First retained source",
  );
  await alternatives
    .getByRole("button", { name: "Discard version 1", exact: true })
    .click();
  await expect(
    alternatives.getByRole("button", {
      name: "Discard this retained version",
      exact: true,
    }),
  ).toBeVisible();
  await alternatives
    .getByRole("button", { name: "Keep this version", exact: true })
    .click();
  await expect(alternatives.getByRole("textbox")).toHaveValue(
    "First retained source",
  );
  await alternatives
    .getByRole("button", { name: "Discard version 1", exact: true })
    .click();
  await alternatives
    .getByRole("button", { name: "Discard this retained version", exact: true })
    .focus();
  await other.keyboard.press("Enter");
  await expect(alternatives).toHaveCount(0);
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Second retained source",
  );
  await other.reload();
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Second retained source",
  );
  await expect(alternatives).toHaveCount(0);
  expect(
    state.requests.filter(
      (r) =>
        r.method !== "GET" ||
        new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toEqual([]);
});

test("UX109.unsettled: choosing clean text preserves the original uncertain attempt and cannot lift its publication guard", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Original submitted immutable 原文");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const otherEditor = await selectSourceEditor(other);
  await expect(otherEditor).toHaveValue("Original submitted immutable 原文");
  await page.route(
    (url) => url.searchParams.has("replysubmit"),
    async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      state.requests.push({
        url: route.request().url(),
        method: "POST",
        body: route.request().postData(),
      });
      await route.fulfill({
        status: 503,
        contentType: "text/html",
        body: "<p>Transport result unavailable</p>",
      });
    },
  );
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(page))[0].sends?.[0]?.attempt.status,
    )
    .toBe("uncertain");
  const original = JSON.parse(await readReplyRows(page))[0].variants[0].context
    .attempts[0];
  await otherEditor.fill("Clean competing draft without submitted history");
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  const texts = await conflict
    .getByRole("textbox")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLTextAreaElement).value));
  await conflict
    .getByRole("button", {
      name: `Continue with version ${texts.indexOf("Clean competing draft without submitted history") + 1}`,
      exact: true,
    })
    .click();
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Clean competing draft without submitted history",
  );
  await expect(
    other.getByText(
      "Another Send waits while an existing reply is sending or unresolved. You can keep writing.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeDisabled();
  await expect(await selectSourceEditor(other)).not.toHaveAttribute(
    "readonly",
    "",
  );
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await expect(
    alternatives.getByRole("button", {
      name: "Discard version 1",
      exact: true,
    }),
  ).toBeDisabled();
  expect(
    JSON.parse(await readReplyRows(other))[0].retained[0].context.attempts[0],
  ).toEqual(original);
  await other.reload();
  await expect(
    other.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeDisabled();
  await alternatives
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect(await selectSourceEditor(other)).toHaveValue("");
  await expect(
    other.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveValue("Original submitted immutable 原文");
  await revealWritingDetails(other);
  await expect(
    other.getByRole("button", { name: "Check reply status", exact: true }),
  ).toBeEnabled();
  expect(
    JSON.parse(await readReplyRows(other))[0].variants[0].context.attempts[0]
      .publication,
  ).toEqual(original.publication);
  await other.getByRole("button", { name: "New thread", exact: true }).click();
  await other
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  await expect(
    other.getByText(
      "This reply has an unsettled operation. Check its original result before discarding or replacing it. Your writing is retained.",
      { exact: true },
    ),
  ).toBeVisible();
  await other.getByRole("button", { name: "Return", exact: true }).click();
  await expect(await selectSourceEditor(other)).toHaveValue("");
  await expect(
    other.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveValue("Original submitted immutable 原文");
  const sent = state.requests.find((request) => request.method === "POST")!;
  state.saved.set("42", new URLSearchParams(sent.body!));
  state.savedActors.set("42", "7");
  await other
    .getByRole("textbox", {
      name: "Published reply URL (optional)",
      exact: true,
    })
    .fill(`${origin}/forum.php?mod=viewthread&tid=42&pid=4299&page=1#pid4299`);
  await other
    .getByRole("button", { name: "Check reply status", exact: true })
    .click();
  await expect(other.getByText(/Confirmed stored reply/)).toBeVisible();
  await continueSource(
    alternatives,
    "Clean competing draft without submitted history",
  );
  await expect(
    alternatives.getByRole("button", {
      name: "Discard version 1",
      exact: true,
    }),
  ).toBeEnabled();
  await alternatives
    .getByRole("button", { name: "Discard version 1", exact: true })
    .click();
  await alternatives
    .getByRole("button", { name: "Discard this retained version", exact: true })
    .click();
  await expect(alternatives).toHaveCount(0);
  await expect(
    other.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeEnabled();
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
});

async function continueSource(
  panel: import("@playwright/test").Locator,
  source: string,
) {
  const sources = await panel
    .getByRole("textbox", { name: /^Retained reply version/ })
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLTextAreaElement).value));
  expect(sources).toContain(source);
  await panel
    .getByRole("button", {
      name: `Continue with version ${sources.indexOf(source) + 1}`,
      exact: true,
    })
    .click();
}
async function holdNextWriteCompletion(page: Page) {
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    let armed = true;
    Object.defineProperty(window, "held109Completion", {
      configurable: true,
      writable: true,
      value: null,
    });
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      const tx = original.call(this, names, mode, options);
      if (
        armed &&
        this.name === "tsdm.workspace.reply-drafts" &&
        mode === "readwrite"
      ) {
        armed = false;
        Object.defineProperty(tx, "oncomplete", {
          set(callback) {
            tx.addEventListener("complete", (event) => {
              (
                window as unknown as { held109Completion: (() => void) | null }
              ).held109Completion = () => callback.call(tx, event);
            });
          },
        });
      }
      return tx;
    };
  });
}
async function releaseWriteCompletion(page: Page) {
  await page.evaluate(() =>
    (window as unknown as { held109Completion(): void }).held109Completion(),
  );
}

test("UX109.third-before: a third tab edit invalidates a stale displayed choice without overwriting any source", async ({
  page,
  context,
}) => {
  const { other, conflict, third } = await conflictingPair(page, context, true);
  await (
    await selectSourceEditor(third!)
  ).fill("Third previously unobserved writing");
  await expect
    .poll(
      async () => JSON.parse(await readReplyRows(third!))[0].variants.length,
    )
    .toBe(3);
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  await continueSource(conflict, "First retained source");
  await expect(
    other.getByText(
      "The drafts changed. Inspect the current versions and choose again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(conflict.getByRole("textbox")).toHaveCount(3);
  const row = JSON.parse(await readReplyRows(other))[0];
  expect(row.schema).toBe(1);
  expect(
    row.variants.map((v: { context: { source: string } }) => v.context.source),
  ).toEqual(
    expect.arrayContaining([
      "First retained source",
      "Second retained source",
      "Third previously unobserved writing",
    ]),
  );
});

test("UX109.third-after: a third edit after choice commit invalidates readback without resurrecting a clean archived version", async ({
  page,
  context,
}) => {
  const { other, conflict, third } = await conflictingPair(page, context, true);
  await holdNextWriteCompletion(other);
  await continueSource(conflict, "First retained source");
  await expect
    .poll(() =>
      other.evaluate(
        () =>
          typeof (window as unknown as { held109Completion: unknown })
            .held109Completion,
      ),
    )
    .toBe("function");
  await (
    await selectSourceEditor(third!)
  ).fill("Third edit after native choice commit");
  await expect
    .poll(
      async () => JSON.parse(await readReplyRows(third!))[0].variants.length,
    )
    .toBe(2);
  await releaseWriteCompletion(other);
  await expect
    .poll(async () =>
      conflict
        .getByRole("textbox")
        .evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLTextAreaElement).value),
        ),
    )
    .toContain("Third edit after native choice commit");
  await expect(conflict.getByRole("textbox")).toHaveCount(2);
  const row = JSON.parse(await readReplyRows(other))[0];
  expect(
    row.variants.map((v: { context: { source: string } }) => v.context.source),
  ).toEqual(
    expect.arrayContaining([
      "First retained source",
      "Third edit after native choice commit",
    ]),
  );
  expect(
    row.retained.map((v: { context: { source: string } }) => v.context.source),
  ).toEqual(["Second retained source"]);
  await expect(await selectSourceEditor(other)).toHaveAttribute("readonly", "");
  await expect(
    other.getByText(
      "Selected version resumed. Other versions remain recoverable.",
      { exact: true },
    ),
  ).toHaveCount(0);
});

test("UX109.distinct-conflict: an acknowledged page session with a draft conflict does not claim navigation recovery loss", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await expect(conflict).toBeVisible();
  const session = await other.evaluate(() =>
    JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!),
  );
  expect(session.writing.source).toBe("Second retained source");
  await expect(
    other.getByText(
      "Refresh recovery unavailable. This tab keeps navigation while the page remains open.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await expect(
    other.getByText("Local reply drafts could not be saved.", { exact: false }),
  ).toHaveCount(0);
});

test("UX109.epoch: typing during retained-version handoff is immediately preserved under its old parent without another event", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await continueSource(conflict, "First retained source");
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await expect(await selectSourceEditor(other)).toHaveValue(
    "First retained source",
  );
  await revealWritingDetails(other);
  await waitForReplySaved(other);
  await holdNextWriteCompletion(other);
  await continueSource(alternatives, "Second retained source");
  await expect
    .poll(() =>
      other.evaluate(
        () =>
          typeof (window as unknown as { held109Completion: unknown })
            .held109Completion,
      ),
    )
    .toBe("function");
  await (
    await selectSourceEditor(other)
  ).fill("Latest typing during handoff 原文");
  await releaseWriteCompletion(other);
  await expect
    .poll(async () =>
      JSON.parse(await readReplyRows(other))[0].variants.map(
        (v: { context: { source: string } }) => v.context.source,
      ),
    )
    .toEqual(
      expect.arrayContaining([
        "Second retained source",
        "Latest typing during handoff 原文",
      ]),
    );
  await expect(conflict).toBeVisible();
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Latest typing during handoff 原文",
  );
  await expect(await selectSourceEditor(other)).toHaveAttribute("readonly", "");
  const row = JSON.parse(await readReplyRows(other))[0];
  expect(row.variants).toHaveLength(2);
  expect(
    row.retained.map((v: { context: { source: string } }) => v.context.source),
  ).toEqual(["First retained source"]);
});

test("UX109.stale-discard: confirmation bound to an old alternative cannot remove it after another tab makes it current", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await continueSource(conflict, "First retained source");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const otherAlternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  const pageAlternatives = page.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await expect(pageAlternatives).toBeVisible();
  await otherAlternatives
    .getByRole("button", { name: "Discard version 1", exact: true })
    .click();
  const before = JSON.parse(await readReplyRows(other))[0];
  await continueSource(pageAlternatives, "Second retained source");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Second retained source",
  );
  await otherAlternatives
    .getByRole("button", { name: "Discard this retained version", exact: true })
    .click();
  await expect(
    other.getByText(
      "The drafts changed. Inspect the current versions before discarding.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Second retained source",
  );
  const after = JSON.parse(await readReplyRows(other))[0];
  expect(
    [...after.variants, ...after.retained]
      .map((v: { version: string }) => v.version)
      .sort(),
  ).toEqual(
    [...before.variants, ...before.retained]
      .map((v: { version: string }) => v.version)
      .sort(),
  );
  expect(after.variants[0].context.source).toBe("Second retained source");
});

test("UX109.simultaneous-choice: two actual tabs selecting different versions preserve one current and one alternative", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const aConflict = page.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(aConflict).toBeVisible();
  await Promise.all([
    continueSource(aConflict, "First retained source"),
    continueSource(conflict, "Second retained source"),
  ]);
  await expect
    .poll(async () => JSON.parse(await readReplyRows(other))[0].schema)
    .toBe(2);
  await other.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(conflict).toHaveCount(0);
  await expect(aConflict).toHaveCount(0);
  const row = JSON.parse(await readReplyRows(other))[0];
  expect(row.variants).toHaveLength(1);
  expect(row.retained).toHaveLength(1);
  expect(
    [...row.variants, ...row.retained]
      .map((v: { context: { source: string } }) => v.context.source)
      .sort(),
  ).toEqual(["First retained source", "Second retained source"]);
  await expect(await selectSourceEditor(page)).toHaveValue(
    row.variants[0].context.source,
  );
  await expect(await selectSourceEditor(other)).toHaveValue(
    row.variants[0].context.source,
  );
});

for (const fault of [
  "quota",
  "security",
  "abort",
  "strict",
  "readback",
  "checkpoint",
] as const) {
  test(`UX109.choice-${fault}: storage failure preserves original alternatives and never claims durable success`, async ({
    page,
    context,
  }) => {
    const { other, conflict } = await conflictingPair(page, context);
    const before = JSON.parse(await readReplyRows(other))[0];
    await other.evaluate((mode) => {
      const original = IDBDatabase.prototype.transaction,
        originalSet = Storage.prototype.setItem;
      const oldVersion = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      ).replyCheckpoints["42"].version;
      let committed = false;
      IDBDatabase.prototype.transaction = function (names, access, options) {
        if (this.name === "tsdm.workspace.reply-drafts") {
          if (access === "readwrite" && ["quota", "security"].includes(mode))
            throw new DOMException(
              "Induced choice refusal",
              mode === "quota" ? "QuotaExceededError" : "SecurityError",
            );
          if (access === "readonly" && mode === "readback" && committed)
            throw new DOMException(
              "Induced committed readback refusal",
              "SecurityError",
            );
        }
        const tx = original.call(this, names, access, options);
        if (
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readwrite"
        ) {
          if (mode === "abort") tx.abort();
          if (mode === "strict")
            Object.defineProperty(tx, "durability", { value: "relaxed" });
          tx.addEventListener("complete", () => {
            committed = true;
          });
        }
        return tx;
      };
      Storage.prototype.setItem = function (key, value) {
        if (
          mode === "checkpoint" &&
          key === "tsdm.workspace.recovery" &&
          JSON.parse(value).replyCheckpoints?.["42"]?.version !== oldVersion
        )
          throw new DOMException(
            "Induced checkpoint refusal",
            "QuotaExceededError",
          );
        return originalSet.call(this, key, value);
      };
      Object.defineProperty(window, "restore109Host", {
        configurable: true,
        value: () => {
          IDBDatabase.prototype.transaction = original;
          Storage.prototype.setItem = originalSet;
        },
      });
    }, fault);
    await continueSource(conflict, "First retained source");
    if (["readback", "checkpoint"].includes(fault)) {
      await expect(
        other.getByText(/Local reply drafts could not be saved\./).first(),
      ).toBeVisible();
    } else {
      await expect(
        other.getByText(
          "The choice could not be saved. Your writing remains available.",
          { exact: true },
        ),
      ).toBeVisible();
    }
    await expect(
      other.getByText("Local reply draft saved in this browser profile.", {
        exact: true,
      }),
    ).toHaveCount(0);
    await test.info().attach(`choice-${fault}-visible.png`, {
      body: await other.screenshot(),
      contentType: "image/png",
    });
    const stored = JSON.parse(await readReplyRows(page))[0];
    if (["readback", "checkpoint"].includes(fault)) {
      expect(stored.variants).toHaveLength(1);
      expect(stored.retained).toHaveLength(1);
      expect(stored.variants[0].context.source).toBe("First retained source");
    } else expect(stored).toEqual(before);
    await other.evaluate(() =>
      (window as unknown as { restore109Host(): void }).restore109Host(),
    );
    await other.reload();
    if (["readback", "checkpoint"].includes(fault)) {
      await expect(await selectSourceEditor(other)).toHaveValue(
        "First retained source",
      );
      const restored = JSON.parse(await readReplyRows(other))[0];
      expect(restored.variants).toHaveLength(1);
      expect(restored.retained).toHaveLength(1);
    } else await expect(conflict.getByRole("textbox")).toHaveCount(2);
  });
}

test("UX109.focus: keyboard resolution returns focus to the announced outcome and cancellation returns to its version control", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await continueSource(conflict, "First retained source");
  const outcome = other.getByRole("status").filter({
    hasText: "Selected version resumed. Other versions remain recoverable.",
  });
  await expect(outcome).toBeFocused();
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
  });
  const discard = alternatives.getByRole("button", {
    name: "Discard version 1",
    exact: true,
  });
  await discard.focus();
  await other.keyboard.press("Enter");
  await alternatives
    .getByRole("button", { name: "Keep this version", exact: true })
    .focus();
  await other.keyboard.press("Enter");
  await expect(discard).toBeFocused();
});

test("UX109.downgrade: actual prior108 refuses schema2 without rewriting any current or retained raw data", async ({
  page,
  context,
}) => {
  const { state, other, conflict } = await conflictingPair(page, context);
  await continueSource(conflict, "First retained source");
  await expect(conflict).toHaveCount(0);
  const before = await readReplyRows(other);
  state.useScript(
    process.env.TSDM_UI_108_BASELINE ??
      "/private/tmp/tsdm-ui-108-delivery/dist/tsdm-ui.user.js",
  );
  const old = await context.newPage();
  await old.goto(boardURL);
  await expect(
    old.getByText(
      "Stored local reply drafts are incompatible. Their raw data is retained; sending is paused.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(await readReplyRows(old)).toBe(before);
  await old.reload();
  expect(await readReplyRows(old)).toBe(before);
});

test("UX109.tombstone: explicit no-draft choice keeps the other version discoverable with no active reply and after fresh preparation", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Common before disposal");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await selectSourceEditor(other);
  await (
    await selectSourceEditor(page)
  ).fill("Source preserved against stale disposal");
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(page))[0].variants[0].context.source,
    )
    .toBe("Source preserved against stale disposal");
  await other.getByRole("button", { name: "New thread", exact: true }).click();
  await other
    .getByRole("button", {
      name: "Discard local changes and prepare",
      exact: true,
    })
    .click();
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await other
    .getByRole("button", { name: "Reply recovery · 2", exact: true })
    .click();
  await expect(conflict).toBeVisible();
  await conflict
    .getByRole("button", { name: "Continue without this draft", exact: true })
    .click();
  await expect(conflict).toHaveCount(0);
  const fresh = await context.newPage();
  await fresh.goto(boardURL);
  await choose(fresh, "42");
  await expect(fresh.locator(".source-writing")).toHaveCount(0);
  const alternatives = fresh.getByRole("region", {
    name: "Recoverable reply versions",
  });
  await fresh
    .getByRole("button", { name: "Reply recovery · 1", exact: true })
    .click();
  await expect(alternatives.getByRole("textbox")).toHaveValue(
    "Source preserved against stale disposal",
  );
  await fresh
    .getByRole("dialog", { name: "Reply recovery", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await fresh
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(fresh)
  ).fill("Fresh draft after explicit no-draft choice");
  await expect(alternatives.getByRole("textbox")).toHaveValue(
    "Source preserved against stale disposal",
  );
  await choose(fresh, "43");
  await fresh
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(fresh)).fill("Independent thread source");
  await choose(fresh, "42");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "Fresh draft after explicit no-draft choice",
  );
  await choose(fresh, "43");
  await expect(await selectSourceEditor(fresh)).toHaveValue(
    "Independent thread source",
  );
});

test("UX109.foreign-pending: selection normalizes only its operational descendant while original callback and unequal history remain owned", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (await selectSourceEditor(page)).fill("Immutable original sent source");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const editor = await selectSourceEditor(other);
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(() => state.requests.filter((r) => r.method === "POST").length)
    .toBe(1);
  await editor.fill("Competing independent unsent source");
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  const original = JSON.parse(await readReplyRows(other))[0].variants.find(
    (v: { context: { attempts?: unknown[] } }) => v.context.attempts?.length,
  ).context.attempts[0];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const ownerConflict = page.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(ownerConflict).toBeVisible();
  await continueSource(ownerConflict, "Competing independent unsent source");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Competing independent unsent source",
  );
  // Acknowledged sending now permits explicit independent draft choice.
  await other.reload();
  const alternatives = other.getByRole("region", {
    name: "Recoverable reply versions",
    exact: true,
  });
  await continueSource(alternatives, "");
  await expect(await selectSourceEditor(other)).toHaveValue("");
  const selected = JSON.parse(await readReplyRows(other))[0];
  expect(selected.variants[0].context.attempts[0].publication).toEqual(
    original.publication,
  );
  expect(selected.retained[0].context.source).toBe(
    "Competing independent unsent source",
  );
  expect(selected.sends[0].attempt.status).toBe("pending");
  const authored = JSON.stringify({
    variants: selected.variants,
    retained: selected.retained,
  });
  release();
  await expect(page.getByText(/Confirmed stored reply/)).toBeVisible();
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(page))[0].sends?.[0]?.attempt.status,
    )
    .toBe("confirmed");
  const final = JSON.parse(await readReplyRows(page))[0];
  expect(
    JSON.stringify({ variants: final.variants, retained: final.retained }),
  ).toBe(authored);
  expect(final.sends[0].attempt.publication).toEqual(original.publication);
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
});

test("UX109.dirty-archived-equality: a stale dirty tab cannot treat content equal to an alternative as a current checkpoint", async ({
  page,
  context,
}) => {
  const { conflict, third } = await conflictingPair(page, context, true);
  await continueSource(conflict, "First retained source");
  await expect(conflict).toHaveCount(0);
  await (await selectSourceEditor(third!)).fill("Second retained source");
  await expect(
    third!.getByRole("region", { name: "Conflicting local reply drafts" }),
  ).toBeVisible();
  const row = JSON.parse(await readReplyRows(third!))[0];
  expect(row.variants).toHaveLength(2);
  expect(row.retained).toHaveLength(1);
  expect(
    row.variants.map((v: { context: { source: string } }) => v.context.source),
  ).toEqual(
    expect.arrayContaining(["First retained source", "Second retained source"]),
  );
  expect(row.retained[0].context.source).toBe("Second retained source");
  expect(
    row.variants.find(
      (v: { context: { source: string } }) =>
        v.context.source === "Second retained source",
    ).version,
  ).not.toBe(row.retained[0].version);
  await expect(
    third!.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeDisabled();
});

test("UX109.target-intent: selected target/options/literal source remain exact and unavailable file intent never acquires bytes", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const common =
    "[quote][b]原文[/b][/quote]\n[unknown]protected text[/unknown]";
  await (await selectSourceEditor(page)).fill(common);
  await revealWritingTools(page);
  await revealWritingOptions(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await chooseAttachments(page, {
    name: "choice-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Only first tab owns these bytes"),
  });
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(page))[0].variants[0].context
          .uploads?.[0]?.status,
    )
    .toBe("reselect");
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  await selectSourceEditor(other);
  await revealWritingTools(other);
  await other
    .getByRole("button", { name: "Remove reply target", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(other))[0].variants[0].context
          .replyTarget.postId ?? null,
    )
    .toBe(null);
  await (await selectSourceEditor(page)).fill(common + "\nAddressed variant");
  await expect
    .poll(async () => JSON.parse(await readReplyRows(page))[0].variants.length)
    .toBe(2);
  await other.evaluate(() => window.dispatchEvent(new Event("focus")));
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  const before = JSON.parse(await readReplyRows(other))[0];
  expect(
    before.variants.map(
      (v: { context: { replyTarget: { postId?: string } } }) =>
        v.context.replyTarget.postId ?? null,
    ),
  ).toEqual(expect.arrayContaining(["4201", null]));
  await continueSource(conflict, common + "\nAddressed variant");
  await expect(await selectSourceEditor(other)).toHaveValue(
    common + "\nAddressed variant",
  );
  await revealWritingTools(other);
  await expect(
    other.getByLabel("Signature", { exact: true }),
  ).not.toBeChecked();
  await expect(
    other.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toBeVisible();
  await expect(
    other.getByLabel("Reattach choice-intent.txt", { exact: true }),
  ).toBeVisible();
  await expect(
    other.getByRole("button", {
      name: "Upload choice-intent.txt",
      exact: true,
    }),
  ).toHaveCount(0);
  await other.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    other.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toHaveCount(0);
  const after = JSON.parse(await readReplyRows(other))[0];
  expect(after.retained[0]).toEqual(
    before.variants.find(
      (v: { context: { source: string } }) => v.context.source === common,
    ),
  );
  expect(
    state.requests.filter(
      (r) =>
        r.method !== "GET" ||
        new URL(r.url).searchParams.get("action") === "deleteattach",
    ),
  ).toEqual([]);
});

test("UX109.narrow: conflict source and keyboard actions fit a narrow enlarged-text layout", async ({
  page,
  context,
}) => {
  const { other, conflict } = await conflictingPair(page, context);
  await other.setViewportSize({ width: 390, height: 844 });
  // Browser resize resolves before the workspace applies narrow docking.
  await expect(other.locator(".workspace-body")).toHaveAttribute(
    "data-boards-collapsed",
    "true",
  );
  await conflict.evaluate((node) => {
    (node as HTMLElement).style.fontSize = "200%";
  });
  const bounds = await conflict.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  for (const field of await conflict.getByRole("textbox").all()) {
    const box = await field.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  }
  const button = conflict.getByRole("button", {
    name: "Continue with version 1",
    exact: true,
  });
  await button.focus();
  await expect(button).toBeFocused();
  await other.keyboard.press("Enter");
  await expect(conflict).toHaveCount(0);
  await expect(
    other.getByRole("region", { name: "Recoverable reply versions" }),
  ).toBeVisible();
});

for (const corruption of [
  "duplicate-version",
  "unknown-retained-field",
] as const) {
  test(`UX109.raw-${corruption}: incompatible retained data remains exact and distinct from an authored conflict`, async ({
    page,
    context,
  }) => {
    const { other, conflict } = await conflictingPair(page, context);
    await continueSource(conflict, "First retained source");
    await expect(conflict).toHaveCount(0);
    const raw = await other.evaluate(async (mode) => {
      const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const row = await new Promise<Record<string, unknown>>((resolve) => {
        const r = db
          .transaction("threads", "readonly")
          .objectStore("threads")
          .get("42");
        r.onsuccess = () => resolve(r.result);
      });
      const retained = row.retained as {
        version: string;
        context: Record<string, unknown>;
      }[];
      if (mode === "duplicate-version")
        retained[0]!.version = (
          row.variants as { version: string }[]
        )[0]!.version;
      else
        retained[0]!.context.unrecognizedAuthority =
          "synthetic forbidden metadata";
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite");
        tx.objectStore("threads").put(row);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
      db.close();
      return JSON.stringify([row]);
    }, corruption);
    await other.reload();
    const attention = other.getByRole("region", {
      name: "Local reply recovery needs attention",
    });
    await expect(attention).toContainText(
      "Stored local reply drafts are incompatible.",
    );
    await expect(conflict).toHaveCount(0);
    await attention
      .getByText("Inspect retained local reply data", { exact: true })
      .click();
    await expect(
      attention.getByRole("textbox", {
        name: "Retained local reply data",
        exact: true,
      }),
    ).toHaveValue(raw);
    expect(await readReplyRows(other)).toBe(raw);
  });
}

test("UX109.history-epoch: an original result arriving during handoff is retained immediately without changing its submitted identity or revision", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", {
      value: undefined,
      configurable: true,
    }),
  );
  const state = await open(page);
  await choose(page, "42");
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Original history-only update source");
  await revealWritingDetails(page);
  await waitForReplySaved(page);
  const other = await context.newPage();
  await other.goto(boardURL);
  await choose(other, "42");
  const editor = await selectSourceEditor(other);
  await page.route(
    (url) => url.searchParams.has("replysubmit"),
    async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      state.requests.push({
        url: route.request().url(),
        method: "POST",
        body: route.request().postData(),
      });
      await route.fulfill({
        status: 503,
        contentType: "text/html",
        body: "<p>Uncertain fixture response</p>",
      });
    },
  );
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(await readReplyRows(page))[0].sends?.[0]?.attempt.status,
    )
    .toBe("uncertain");
  await editor.fill("Alternative without history");
  const conflict = other.getByRole("region", {
    name: "Conflicting local reply drafts",
  });
  await expect(conflict).toBeVisible();
  await continueSource(conflict, "");
  await revealWritingDetails(other);
  await waitForReplySaved(other);
  const before = JSON.parse(await readReplyRows(other))[0].variants[0].context;
  const request = state.requests.find((r) => r.method === "POST")!;
  state.saved.set("42", new URLSearchParams(request.body!));
  state.savedActors.set("42", "7");
  await other
    .getByRole("textbox", {
      name: "Published reply URL (optional)",
      exact: true,
    })
    .fill(`${origin}/forum.php?mod=viewthread&tid=42&pid=4299&page=1#pid4299`);
  await holdNextWriteCompletion(other);
  await continueSource(
    other.getByRole("region", { name: "Recoverable reply versions" }),
    "Alternative without history",
  );
  await expect
    .poll(() =>
      other.evaluate(
        () =>
          typeof (window as unknown as { held109Completion: unknown })
            .held109Completion,
      ),
    )
    .toBe("function");
  await other
    .getByRole("button", { name: "Check reply status", exact: true })
    .click();
  // The external observation races an already committed choice whose completion
  // is delayed. Releasing acknowledgement lets registry CAS settle independently.
  const committed = JSON.parse(await readReplyRows(other))[0];
  const authored = JSON.stringify({
    variants: committed.variants,
    retained: committed.retained,
  });
  await releaseWriteCompletion(other);
  await expect(other.getByText(/Confirmed stored reply/)).toBeVisible();
  const row = JSON.parse(await readReplyRows(other))[0];
  expect(row.sends[0].attempt.status).toBe("confirmed");
  expect(row.sends[0].attempt.publication).toEqual(
    before.attempts[0].publication,
  );
  expect(
    JSON.stringify({ variants: row.variants, retained: row.retained }),
  ).toBe(authored);
  await expect(await selectSourceEditor(other)).toHaveValue(
    "Alternative without history",
  );
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(1);
});

test("UX112.owner-revision-conflict: another thread's real competing versions are chosen in the popup without replacing the active draft", async ({
  page,
  context,
}) => {
  const { state, other, conflict } = await conflictingPair(page, context);
  await choose(other, "43");
  await other
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(other);
  await source.fill("Keep thread43 draft exact");
  await expect(conflict).toHaveCount(0);
  await other
    .getByRole("button", { name: "Reply recovery · 2", exact: true })
    .click();
  const dialog = other.getByRole("dialog", {
    name: "Reply recovery",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await continueSource(
    dialog.getByRole("region", {
      name: "Conflicting local reply drafts",
      exact: true,
    }),
    "First retained source",
  );
  await expect(dialog.getByRole("status")).toContainText(
    "Selected version resumed",
  );
  await expect(dialog.getByRole("status")).toBeFocused();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(source).toHaveValue("Keep thread43 draft exact");
  const saved = JSON.parse(await readReplyRows(other));
  expect(
    saved.find((row: { threadId: string }) => row.threadId === "42").variants[0]
      .context.source,
  ).toBe("First retained source");
  expect(
    state.requests.filter((request) => request.method === "POST"),
  ).toHaveLength(0);
});

for (const width of [1440, 390])
  test(`UX112.choice-context-${width}: same-text versions reveal human target options and named attachment differences without diagnostic JSON`, async ({
    page,
    context,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addInitScript(() =>
      Object.defineProperty(window, "BroadcastChannel", {
        value: undefined,
        configurable: true,
      }),
    );
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Post 4201 actions", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
    await (await selectSourceEditor(page)).fill("Same retained source 完整");
    await chooseAttachments(page, {
      name: "addressed.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("first local file"),
    });
    await waitForReplySaved(page);
    const other = await context.newPage();
    await other.setViewportSize({ width, height: 900 });
    await other.goto(boardURL);
    await choose(other, "42");
    await selectSourceEditor(other);
    await other
      .getByRole("button", { name: "Remove reply target", exact: true })
      .click();
    await other
      .getByRole("button", { name: "Remove addressed.txt", exact: true })
      .click();
    await chooseAttachments(other, {
      name: "ordinary.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("second local file"),
    });
    await waitForReplySaved(other);
    await revealWritingOptions(page);
    await page.getByLabel("Signature", { exact: true }).uncheck();
    await page.keyboard.press("Escape");
    await expect
      .poll(
        async () => JSON.parse(await readReplyRows(page))[0].variants.length,
      )
      .toBe(2);
    await other.evaluate(() => window.dispatchEvent(new Event("focus")));
    const conflict = other.getByRole("region", {
      name: "Conflicting local reply drafts",
      exact: true,
    });
    await expect(conflict).toBeVisible();
    const cards = conflict.locator(".reply-version");
    await expect(cards).toHaveCount(2);
    const addressed = cards.filter({ hasText: "addressed.txt" }),
      ordinary = cards.filter({ hasText: "ordinary.txt" });
    await expect(addressed).toContainText("Other author");
    await expect(addressed).toContainText("Post 4201");
    await expect(addressed).toContainText("Signature: Off");
    await expect(ordinary).toContainText("Signature: On");
    await expect(addressed).toContainText("Unavailable");
    await expect(cards.getByRole("textbox")).toHaveCount(2);
    await expect(
      conflict.getByText("Complete retained reply details", { exact: true }),
    ).toHaveCount(0);
    expect(await conflict.innerText()).not.toMatch(
      /formhash|fingerprint|acknowledged|contextId/,
    );
    const before = JSON.parse(await readReplyRows(other))[0];
    await info.attach("human-choice.png", {
      body: await other.screenshot(),
      contentType: "image/png",
    });
    await addressed
      .getByRole("button", { name: /^Continue with version/ })
      .click();
    await expect(await selectSourceEditor(other)).toHaveValue(
      "Same retained source 完整",
    );
    await revealWritingOptions(other);
    await expect(
      other.getByLabel("Signature", { exact: true }),
    ).not.toBeChecked();
    await other.keyboard.press("Escape");
    await expect(
      other.getByLabel("Reattach addressed.txt", { exact: true }),
    ).toBeVisible();
    const after = JSON.parse(await readReplyRows(other))[0];
    expect(after.retained).toHaveLength(1);
    expect(after.retained[0].context.uploads[0].name).toBe("ordinary.txt");
    expect(after.variants[0].context.replyTarget.postId).toBe("4201");
    expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
    await info.attach("human-choice-state.json", {
      body: JSON.stringify({ before, after, requests: state.requests }),
      contentType: "application/json",
    });
  });

// Failure inventory: actual uploaded files can share visible name/size/status
// while their uninserted server references and uploader ownership differ. Choice
// must expose that distinction and preserve the unchosen exact file intent.
for (const language of ["en", "zh-CN", "zh-TW"] as const)
  test(`UX112.choice-attachment-identity-${language}: same-name uploaded references remain distinguishable without raw draft diagnostics`, async ({
    page,
    context,
  }, info) => {
    await context.addInitScript(() =>
      Object.defineProperty(window, "BroadcastChannel", {
        value: undefined,
        configurable: true,
      }),
    );
    const state = await open(page);
    await choose(page, "42");
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (
      await selectSourceEditor(page)
    ).fill("Same source without inserted references");
    for (const member of ["7", "8"]) {
      state.member = member;
      await refreshReplyFromNative(page);
      await chooseAttachments(page, {
        name: "intent.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("same-size-bytes"),
      });
      await page
        .getByRole("button", { name: "Upload intent.txt", exact: true })
        .click();
      await expect
        .poll(
          async () =>
            JSON.parse(await readReplyRows(page))[0].variants[0].context
              .uploadedReferences.length,
        )
        .toBe(member === "7" ? 1 : 2);
      await waitForReplySaved(page);
    }
    await expect(await selectSourceEditor(page)).toHaveValue(
      "Same source without inserted references",
    );
    state.member = "9";
    await page.reload();
    await selectSourceEditor(page);
    const other = await context.newPage();
    await other.goto(boardURL);
    await choose(other, "42");
    await selectSourceEditor(other);
    await expect(
      other.getByRole("button", { name: "Remove intent.txt", exact: true }),
    ).toHaveCount(2);
    await page
      .getByRole("button", { name: "Remove intent.txt", exact: true })
      .nth(0)
      .click();
    await waitForReplySaved(page);
    await other
      .getByRole("button", { name: "Remove intent.txt", exact: true })
      .nth(1)
      .click();
    await expect(other.locator(".reply-conflict .reply-version")).toHaveCount(
      2,
    );
    if (language !== "en") {
      await openSettings(other);
      await other.locator("#interface-language").selectOption(language);
      await closeSettingsToWorkspace(other);
      await other.setViewportSize({ width: 390, height: 900 });
    }
    const labels = {
      en: { reference: "Attachment reference #", owner: "Uploaded by user " },
      "zh-CN": { reference: "附件引用 #", owner: "上传者用户 " },
      "zh-TW": { reference: "附件引用 #", owner: "上傳者使用者 " },
    }[language];
    const cards = other.locator(".reply-conflict .reply-version"),
      first = cards.filter({ hasText: `${labels.reference}88` }),
      second = cards.filter({ hasText: `${labels.reference}89` });
    await expect(first).toHaveCount(1);
    await expect(second).toHaveCount(1);
    await expect(first).toContainText(`${labels.owner}7`);
    await expect(second).toContainText(`${labels.owner}8`);
    expect(
      await cards
        .getByRole("textbox")
        .evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLTextAreaElement).value),
        ),
    ).toEqual([
      "Same source without inserted references",
      "Same source without inserted references",
    ]);
    expect((await cards.allInnerTexts()).join("\n")).not.toMatch(
      /formhash|fingerprint|contextId/,
    );
    const before = JSON.parse(await readReplyRows(other))[0];
    await first.scrollIntoViewIfNeeded();
    await info.attach("attachment-identity-choice.png", {
      body: await other.screenshot(),
      contentType: "image/png",
    });
    await first
      .getByRole("button", {
        name: /^(Continue with version|继续使用版本|繼續使用版本)/,
      })
      .click();
    await expect(
      other.getByRole("region", {
        name: /^(Conflicting local reply drafts|冲突的本地回复草稿|衝突的本機回覆草稿)$/,
      }),
    ).toHaveCount(0);
    await waitForReplySaved(other);
    expect(
      JSON.parse(await readReplyRows(other))[0].variants[0].context
        .uploadedReferences,
    ).toEqual(["88"]);
    await other.reload();
    await expect(await selectSourceEditor(other)).toHaveValue(
      "Same source without inserted references",
    );
    const after = JSON.parse(await readReplyRows(other))[0];
    expect(after.variants[0].context.uploadedReferences).toEqual(["88"]);
    expect(after.variants[0].context.uploads[0].ownerId).toBe("7");
    expect(after.retained).toHaveLength(1);
    expect(after.retained[0].context.uploadedReferences).toEqual(["89"]);
    expect(after.retained[0].context.uploads[0].ownerId).toBe("8");
    expect(
      state.requests.filter(
        (r) => r.method === "POST" && new URL(r.url).pathname !== "/misc.php",
      ),
    ).toEqual([]);
    expect(
      state.requests.filter(
        (r) => new URL(r.url).searchParams.get("action") === "deleteattach",
      ),
    ).toEqual([]);
    await info.attach("attachment-identity-choice.json", {
      body: JSON.stringify({ before, after, requests: state.requests }),
      contentType: "application/json",
    });
  });
