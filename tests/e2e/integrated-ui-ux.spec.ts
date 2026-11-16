import { chooseAttachments } from "./editor-controls";
import { waitForReplySaved } from "./editor-controls";
import { readableLines, expectPreservedReadingLine } from "./readable-lines";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { selectSourceEditor, revealWritingDetails } from "./editor-controls";
import { confirmThreadPage } from "./navigation-ui";
import {
  createIntegratedUXFixture,
  renderIntegratedUXResponse,
  origin,
  boardURL,
  threadURL,
} from "./integrated-ux-fixture";

import type { ReplyRow } from "../../src/workspace/reply-recovery";

type Fixture = ReturnType<typeof createIntegratedUXFixture>;
const records = new WeakMap<Page, { state: Fixture; responses: unknown[] }>();
const candidate = () =>
  createHash("sha256")
    .update(readFileSync("dist/tsdm-ui.user.js"))
    .digest("hex");
async function open(page: Page) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8"),
    state = createIntegratedUXFixture(),
    responses: unknown[] = [];
  records.set(page, { state, responses });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__integrated-ux.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><html><head><meta charset="utf-8"></head><body><script src="${origin}/__integrated-ux.js"></script></body></html>`,
      });
    const input = {
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    };
    const response = await renderIntegratedUXResponse(state, input);
    responses.push({ request: input, response });
    return route.fulfill(response);
  });
  await page.goto(boardURL);
  await expect(page.locator('[data-thread-id="42"]')).toBeVisible();
  return state;
}
const posts = (s: Fixture) => s.requests.filter((r) => r.method === "POST");
async function current(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery") ?? "null")
        .writing,
  );
}
async function capture(
  page: Page,
  info: TestInfo,
  label: string,
  owner = false,
) {
  const png = await page.screenshot();
  await info.attach(`${label}.png`, { body: png, contentType: "image/png" });
  await info.attach(`${label}-geometry.json`, {
    body: JSON.stringify(
      await page
        .locator(".workspace, .reading-pane, .source-writing, .reply-conflict")
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            class: n.className,
            bounds: n.getBoundingClientRect().toJSON(),
            scrollHeight: n.scrollHeight,
            scrollWidth: n.scrollWidth,
            clientWidth: n.clientWidth,
          })),
        ),
    ),
    contentType: "application/json",
  });
  if (owner) {
    const dir = `/private/tmp/tsdm-ui-112-owner-review/${candidate()}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${label}.png`, png);
  }
}
test.afterEach(async ({ page, browser }, info) => {
  const record = records.get(page);
  if (!record) return;
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("integrated-requests.json", {
    body: JSON.stringify(record.state.requests, null, 2),
    contentType: "application/json",
  });
  await info.attach("integrated-http-replay.json", {
    body: JSON.stringify(record.responses, null, 2),
    contentType: "application/json",
  });
  await info.attach("integrated-session.json", {
    body: JSON.stringify(
      await page.evaluate(() =>
        sessionStorage.getItem("tsdm.workspace.recovery"),
      ),
    ),
    contentType: "application/json",
  });
  await capture(page, info, "final");
});

for (const width of [1440, 390])
  test(`UX112.browse-to-recovery-${width}: filters and pins through post actions, page copy, full editing, retarget, thread return and failed Edit preserve independent meaning`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await open(page);
    await page
      .getByRole("button", { name: "Board filters · 0", exact: true })
      .click();
    const filters = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await expect(filters.getByRole("group")).toHaveCount(6);
    await filters
      .getByRole("button", { name: "Listening category", exact: true })
      .click();
    await filters.getByRole("button", { name: "Apply", exact: true }).click();
    expect(state.requests.some((r) => r.url.includes("typeid=3"))).toBe(true);
    await page
      .getByRole("button", { name: "Pinned threads · 1", exact: true })
      .click();
    await page.locator('[data-thread-id="44"] .subject').click();
    await expect(
      page.getByRole("heading", { name: "Thread 44", exact: true }),
    ).toBeVisible();
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await page.locator('[data-thread-id="42"] .subject').click();
    await expect(
      page.getByRole("button", { name: "Page 1 / 3", exact: true }),
    ).toBeVisible();
    await confirmThreadPage(page, 2);
    await expect(
      page.getByRole("article", { name: "Post 4222", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Copy permalink for post 4222",
        exact: true,
      })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`${origin}/forum.php?mod=redirect&goto=findpost&ptid=42&pid=4222`);
    await page
      .getByRole("button", { name: "Post 4222 actions", exact: true })
      .click();
    await expect(page.getByRole("menuitem")).toHaveCount(4);
    await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
    const source = await selectSourceEditor(page),
      exact =
        "[b]Integrated original[/b]\n[table][tr][td]完整 source[/td][/tr][/table]\n[alien]protected[/alien]";
    await source.fill(exact);
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await source.evaluate((n: HTMLTextAreaElement) =>
      n.setSelectionRange(3, 13, "backward"),
    );
    await source.dispatchEvent("select");
    const identity = await source.elementHandle();
    await page
      .getByRole("button", { name: "Compact writing", exact: true })
      .click();
    expect(await identity!.evaluate((n) => n.isConnected)).toBe(true);
    expect(
      await source.evaluate((n: HTMLTextAreaElement) => [
        n.selectionStart,
        n.selectionEnd,
      ]),
    ).toEqual([3, 13]);
    await page
      .getByRole("button", { name: "Post 4221 actions", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
    await expect(source).toHaveValue(exact);
    await expect
      .poll(async () => (await current(page)).replyTarget.postId)
      .toBe("4221");
    await page
      .getByRole("button", { name: "Remove reply target", exact: true })
      .click();
    await expect
      .poll(async () => (await current(page)).replyTarget.postId)
      .toBeNull();
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await page.locator('[data-thread-id="43"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill("Independent thread43 writing");
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await page.locator('[data-thread-id="42"] .subject').click();
    await expect(await selectSourceEditor(page)).toHaveValue(exact);
    let release = () => {};
    state.postGate = new Promise<void>((r) => {
      release = r;
    });
    state.replyOutcome = "rejected";
    try {
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect.poll(() => posts(state).length).toBe(1);
      await expect(source).toHaveValue("");
      await source.fill("Newer independent draft while sending");
      await expect(
        page.getByRole("button", { name: "Send reply", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("textbox", {
          name: "Submitted reply source",
          exact: true,
        }),
      ).toHaveValue(exact);
      release();
      await expect(
        page.getByText("Reply rejected", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Edit failed reply", exact: true })
        .click();
      const alternatives = page.getByRole("region", {
        name: "Recoverable reply versions",
        exact: true,
      });
      await expect(
        alternatives.getByRole("textbox", {
          name: "Retained reply version 1",
          exact: true,
        }),
      ).toHaveValue(exact);
      await expect(source).toHaveValue("Newer independent draft while sending");
      await alternatives
        .getByRole("button", { name: "Continue with version 1", exact: true })
        .click();
      await expect.poll(async () => (await current(page)).source).toBe(exact);
      await expect(await selectSourceEditor(page)).toHaveValue(exact);
      await expect(
        alternatives.getByRole("textbox", {
          name: "Retained reply version 1",
          exact: true,
        }),
      ).toHaveValue("Newer independent draft while sending");
      await alternatives
        .getByRole("button", { name: "Continue with version 1", exact: true })
        .click();
      await expect
        .poll(async () => (await current(page)).source)
        .toBe("Newer independent draft while sending");
      await expect(await selectSourceEditor(page)).toHaveValue(
        "Newer independent draft while sending",
      );
      await page.reload();
      await expect(await selectSourceEditor(page)).toHaveValue(
        "Newer independent draft while sending",
      );
      expect(posts(state)).toHaveLength(1);
      expect(new URLSearchParams(posts(state)[0]!.body!).get("message")).toBe(
        exact,
      );
      expect(new URLSearchParams(posts(state)[0]!.body!).has("reppost")).toBe(
        false,
      );
      await capture(page, info, "combined-recovered");
    } finally {
      release();
    }
  });

for (const width of [1440, 905, 390])
  for (const textSize of [100, 125])
    test(`UX112.owner-${width}-${textSize}: concrete board reader compact expanded and recovery units`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (textSize) =>
          localStorage.setItem(
            "tsdm.workspace.preferences",
            JSON.stringify({
              schema: 1,
              theme: "light",
              language: "en",
              textSize,
            }),
          ),
        textSize,
      );
      const state = await open(page),
        prefix = `${width}-${textSize}`;
      await capture(page, info, `${prefix}-board`, true);
      await page.locator('[data-thread-id="42"] .subject').click();
      await expect(
        page.getByRole("heading", { name: "Thread 42", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("article", { name: "Post 4202", exact: true }),
      ).toBeVisible();
      await capture(page, info, `${prefix}-reader`, true);
      await page
        .getByRole("button", { name: "Post 4202 actions", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
      const visual = page.getByRole("textbox", {
        name: "Visual post content",
        exact: true,
      });
      await visual.fill("多謝分享，這是我的聆聽心得。 A quick reply.");
      await capture(page, info, `${prefix}-compact`, true);
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
      await capture(page, info, `${prefix}-expanded`, true);
      for (const [name, unit] of [
        ["Text formatting", "toolbar-text"],
        ["Paragraph", "toolbar-paragraph"],
        ["Insert", "toolbar-insert"],
        ["Table", "toolbar-table"],
        ["Mentions", "toolbar-mentions"],
        ["Current form options", "toolbar-options"],
        ["More writing actions", "toolbar-more"],
      ] as const) {
        await page
          .getByRole("toolbar", { name: "Reply editing", exact: true })
          .getByRole("button", { name, exact: true })
          .click();
        await expect(
          page.getByRole(name === "More writing actions" ? "menu" : "dialog"),
        ).toBeVisible();
        await capture(page, info, `${prefix}-${unit}`, true);
        await page.keyboard.press("Escape");
      }

      expect(
        await page
          .locator(".workspace")
          .evaluate((n) => n.scrollWidth <= n.clientWidth),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Compact writing", exact: true })
        .click();
      state.replyOutcome = "rejected";
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect(
        page.getByText("Reply rejected", { exact: true }),
      ).toBeVisible();
      await visual.fill("較新的草稿保留在這裏。 Newer writing remains.");
      await page
        .getByRole("button", { name: "Edit failed reply", exact: true })
        .click();
      if (width < 768)
        await page
          .getByRole("button", { name: "Threads pane", exact: true })
          .click();
      await page.locator('[data-thread-id="43"] .subject').click();
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Visual post content", exact: true })
        .fill("另一主題的回覆。 Another thread's reply.");
      await capture(page, info, `${prefix}-retained-recovery`, true);
      await page
        .getByRole("button", { name: "Reply recovery · 1", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Reply recovery", exact: true }),
      ).toBeVisible();
      await capture(page, info, `${prefix}-recovery-popup`, true);
      await page
        .getByRole("dialog", { name: "Reply recovery", exact: true })
        .getByRole("button", { name: "Close", exact: true })
        .click();
      const visibleReading = await page
        .locator(".reading-pane")
        .evaluate((n) => {
          const b = n.getBoundingClientRect(),
            o = n.closest(".conversation-region")!.getBoundingClientRect();
          return (
            Math.min(b.bottom, o.bottom, innerHeight) -
            Math.max(b.top, o.top, 0)
          );
        });
      expect(visibleReading).toBeGreaterThanOrEqual(96);
      await expect(
        page.getByRole("button", { name: "Send reply", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      expect(posts(state)).toHaveLength(1);
    });

async function rows(page: Page) {
  return page.evaluate(
    () =>
      new Promise<ReplyRow[]>((resolve, reject) => {
        const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("threads", "readonly"),
            read = tx.objectStore("threads").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(read.result);
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}

test("UX112.account-during-send: an account change while a submitted reply is pending preserves its actor and newer shared writing through recovery", async ({
  page,
  context,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Post 4202 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source = await selectSourceEditor(page);
  await source.fill("Original account7 submitted content");
  let release = () => {};
  state.postGate = new Promise<void>((r) => {
    release = r;
  });
  state.replyOutcome = "rejected";
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(state).length).toBe(1);
    await expect(source).toHaveValue("");
    await source.fill("Newer writing before account change");
    const before = (await rows(page)).find((r) => r.threadId === "42")!
      .sends![0]!.attempt.publication;
    state.member = "8";
    const other = await context.newPage();
    await other.goto(threadURL("42"));
    const otherSource = await selectSourceEditor(other);
    await expect(otherSource).toHaveValue(
      "Newer writing before account change",
    );
    await revealWritingDetails(other);
    await capture(other, info, "account-other-before-check");
    await expect(
      other.getByText("Signed in as Writer 8", { exact: true }),
    ).toBeVisible();
    await expect(
      other.getByRole("menuitem", {
        name: "Check current account and form",
        exact: true,
      }),
    ).toHaveCount(0);
    await otherSource.fill("Shared newer writing by account8");
    await expect(
      other.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    await otherSource.press("Control+Enter");
    expect(posts(state)).toHaveLength(1);
    release();
    await expect(
      page.getByText("Reply rejected", { exact: true }),
    ).toBeVisible();
    await expect(
      other.getByText("Original sending account: Writer 7 (7)", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      other.getByRole("button", { name: "Retry reply", exact: true }),
    ).toBeDisabled();
    await expect(otherSource).toHaveValue("Shared newer writing by account8");
    await other.reload();
    await expect(await selectSourceEditor(other)).toHaveValue(
      "Shared newer writing by account8",
    );
    const after = (await rows(other)).find((r) => r.threadId === "42")!;
    expect(after.sends![0]!.attempt.publication).toEqual(before);
    expect(before.submission.writing.account.id).toBe("7");
    expect(before.submission.writing.replyTarget?.postId).toBe("4202");
    expect(posts(state)).toHaveLength(1);
    await info.attach("account-during-send-rows.json", {
      body: JSON.stringify(after),
      contentType: "application/json",
    });
    await other.close();
  } finally {
    release();
  }
});

test("UX112.conflict-during-risk: a stale risk confirmation preserves competing history and deliberate choice cannot release the pending successor", async ({
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
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await (
    await selectSourceEditor(page)
  ).fill("Original possibly in-flight reply");
  let releaseOriginal = () => {},
    releaseSuccessor = () => {};
  state.postGate = new Promise<void>((r) => {
    releaseOriginal = r;
  });
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect.poll(() => posts(state).length).toBe(1);
    const second = await context.newPage();
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
    ).fill("Newer draft before competing risk confirmations");
    await waitForReplySaved(second);
    const third = await context.newPage();
    await third.goto(threadURL("42"));
    for (const tab of [third, second])
      await tab
        .getByRole("button", { name: "Retry with duplicate risk", exact: true })
        .click();
    state.postGate = new Promise<void>((r) => {
      releaseSuccessor = r;
    });
    await second
      .getByRole("button", {
        name: "Accept duplicate risk and retry reply",
        exact: true,
      })
      .click();
    await expect.poll(() => posts(state).length).toBe(2);
    await third
      .getByRole("button", {
        name: "Accept duplicate risk and retry reply",
        exact: true,
      })
      .click();
    releaseOriginal();
    await expect(
      page.getByText("Confirmed reply", { exact: true }),
    ).toBeVisible();
    await second.evaluate(() => window.dispatchEvent(new Event("focus")));
    await info.attach("stale-risk-before-conflict.json", {
      body: JSON.stringify(await rows(second)),
      contentType: "application/json",
    });
    const conflict = second.getByRole("region", {
      name: "Conflicting local reply drafts",
      exact: true,
    });
    await expect(conflict).toBeVisible();
    const before = (await rows(second)).find((r) => r.threadId === "42")!;
    expect(before.variants.length).toBeGreaterThanOrEqual(2);
    await info.attach("risk-choice-observation.json", {
      body: JSON.stringify({
        before,
        displayedVersions: await conflict.getByRole("textbox").count(),
        displayedText: await conflict.innerText(),
      }),
      contentType: "application/json",
    });
    await expect(await selectSourceEditor(second)).not.toBeEditable();
    await expect(
      conflict.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveValue("Newer draft before competing risk confirmations");
    await conflict
      .getByRole("button", { name: "Continue with version 1", exact: true })
      .click();
    const staleChoice = second.getByText(
      "The drafts changed. Inspect the current versions and choose again.",
      { exact: true },
    );
    await expect
      .poll(
        async () =>
          (await conflict.isHidden()) || (await staleChoice.isVisible()),
      )
      .toBe(true);
    if (await conflict.isVisible()) {
      // A late original outcome or refused third attempt can change the exact
      // observed row. Its CAS refusal must preserve every version and send hold.
      await expect(staleChoice).toBeVisible();
      const refused = (await rows(second)).find((r) => r.threadId === "42")!;
      expect(refused.variants.length).toBeGreaterThanOrEqual(
        before.variants.length,
      );
      for (const version of before.variants)
        expect(
          refused.variants.some((item) => item.version === version.version),
        ).toBe(true);
      expect(refused.sends).toEqual(before.sends);
      expect(posts(state)).toHaveLength(2);
      await info.attach("risk-choice-stale-preserved.json", {
        body: JSON.stringify(refused),
        contentType: "application/json",
      });
      await conflict
        .getByRole("button", { name: "Continue with version 1", exact: true })
        .click();
    }
    await expect(conflict).toBeHidden();
    const source = await selectSourceEditor(second);
    await expect(source).toBeEditable();
    await source.fill("Newer draft after explicit conflict choice");
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    const chosen = (await rows(second)).find((r) => r.threadId === "42")!;
    expect(chosen.sends).toHaveLength(2);
    expect(chosen.sends![0]!.successor).toBe(chosen.sends![1]!.attempt.id);
    expect(chosen.sends![1]!.attempt.status).toBe("pending");
    expect(chosen.retained!.length).toBeGreaterThanOrEqual(
      before.variants.length - 1,
    );
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    state.replyOutcome = "lost";
    releaseSuccessor();
    await second.reload();
    await expect(await selectSourceEditor(second)).toHaveValue(
      "Newer draft after explicit conflict choice",
    );
    await expect(
      second.getByRole("button", { name: "Send reply", exact: true }),
    ).toBeDisabled();
    const after = (await rows(second)).find((r) => r.threadId === "42")!;
    expect(after.sends).toHaveLength(2);
    expect(after.sends![0]!.attempt.publication.submission.writing.source).toBe(
      "Original possibly in-flight reply",
    );
    expect(after.sends![1]!.attempt.publication.submission.writing.source).toBe(
      "Original possibly in-flight reply",
    );
    expect(posts(state)).toHaveLength(2);
    await info.attach("conflict-risk-before-choice.json", {
      body: JSON.stringify(before),
      contentType: "application/json",
    });
    await info.attach("conflict-risk-after-recovery.json", {
      body: JSON.stringify(after),
      contentType: "application/json",
    });
    await third.close();
    await second.close();
  } finally {
    releaseOriginal();
    releaseSuccessor();
  }
});

for (const mode of [
  "typing",
  "composition",
  "composition-no-broadcast",
] as const)
  test(`UX112.inactive-tab-${mode}: a clean other-thread tab cannot echo stale retained writing into an authored conflict`, async ({
    page,
    context,
  }, info) => {
    if (mode === "composition-no-broadcast")
      await context.addInitScript(() =>
        Object.defineProperty(window, "BroadcastChannel", {
          value: undefined,
          configurable: true,
        }),
      );
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await (await selectSourceEditor(page)).fill("Independent thread42 text");
    await waitForReplySaved(page);
    const other = await context.newPage();
    await other.goto(threadURL("42"));
    await expect(await selectSourceEditor(other)).toHaveValue(
      "Independent thread42 text",
    );
    await page.locator('[data-thread-id="43"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.focus();
    const cdp = await context.newCDPSession(page);
    try {
      for (let round = 0; round < 10; round++) {
        await source.fill("");
        for (const text of ["n", "ne", "nei", "nei h", "nei ho"]) {
          if (mode !== "typing")
            await cdp.send("Input.imeSetComposition", {
              text,
              selectionStart: text.length,
              selectionEnd: text.length,
            });
          else await source.fill(text);
          await expect
            .poll(async () => (await current(page)).source)
            .toBe(text);
          await expect(source).toBeEditable();
        }
        if (mode !== "typing")
          await cdp.send("Input.insertText", { text: "你好" });
        else await source.fill("你好");
        await expect(source).toHaveValue("你好");
        await waitForReplySaved(page);
        await expect(
          page.getByRole("region", {
            name: "Conflicting local reply drafts",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          other.getByRole("region", {
            name: "Conflicting local reply drafts",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect
          .poll(
            async () =>
              (await rows(page)).find((r) => r.threadId === "43")?.variants
                .length,
          )
          .toBe(1);
      }
      await page.reload();
      await expect(await selectSourceEditor(page)).toHaveValue("你好");
      expect(posts(state)).toHaveLength(0);
    } finally {
      await info.attach("inactive-tab-rows.json", {
        body: JSON.stringify(await rows(page)),
        contentType: "application/json",
      });
      await info.attach("inactive-tab-other-session.json", {
        body: JSON.stringify(
          await other.evaluate(() =>
            sessionStorage.getItem("tsdm.workspace.recovery"),
          ),
        ),
        contentType: "application/json",
      });
      await other.close();
      await cdp.detach();
    }
  });

test("UX112.failed-edit-selection: selection-only changes after a rejected submission cannot indefinitely refuse retaining its source beside newer writing", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Rejected immutable source");
  state.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await source.fill("Newer writing stays independent");
  await waitForReplySaved(page);
  await source.press("ArrowLeft");
  await expect.poll(async () => (await current(page)).selection.start).toBe(30);
  await page
    .getByRole("button", { name: "Edit failed reply", exact: true })
    .click();
  await info.attach("failed-edit-selection-row.json", {
    body: JSON.stringify(await rows(page)),
    contentType: "application/json",
  });
  await info.attach("failed-edit-selection-current.json", {
    body: JSON.stringify(await current(page)),
    contentType: "application/json",
  });
  await expect(
    page.getByRole("region", {
      name: "Recoverable reply versions",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", {
      name: "Retained reply version 1",
      exact: true,
    }),
  ).toHaveValue("Rejected immutable source");
  await expect(source).toHaveValue("Newer writing stays independent");
  const alternatives = page.getByRole("region", {
    name: "Recoverable reply versions",
    exact: true,
  });
  await alternatives
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect
    .poll(async () => (await current(page)).source)
    .toBe("Rejected immutable source");
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Rejected immutable source",
  );
  await alternatives
    .getByRole("button", { name: "Continue with version 1", exact: true })
    .click();
  await expect
    .poll(async () => (await current(page)).source)
    .toBe("Newer writing stays independent");
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Newer writing stays independent",
  );
  await expect(
    page.getByRole("textbox", { name: "Submitted reply source", exact: true }),
  ).toHaveValue("Rejected immutable source");
  expect(posts(state)).toHaveLength(1);
});

test("UX112.send-retry-selection: selection-only changes before Send or Retry preserve exact immutable submissions and newer text", async ({
  page,
}) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Original reply");
  await waitForReplySaved(page);
  await source.press("ArrowLeft");
  await expect.poll(async () => (await current(page)).selection.start).toBe(13);
  state.replyOutcome = "rejected";
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toBeVisible();
  await source.fill("Newer draft");
  await waitForReplySaved(page);
  await source.press("ArrowLeft");
  await expect.poll(async () => (await current(page)).selection.start).toBe(10);
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(page.getByText("Reply rejected", { exact: true })).toHaveCount(
    2,
  );
  await expect(source).toHaveValue("Newer draft");
  expect(posts(state)).toHaveLength(2);
  for (const request of posts(state))
    expect(new URLSearchParams(request.body!).get("message")).toBe(
      "Original reply",
    );
});

for (const difference of [
  "head",
  "heads",
  "send-revision",
  "send-status",
  "context-id",
  "account",
  "source",
  "options",
  "nested-revision",
] as const)
  test(`UX112.failed-edit-exact-${difference}: native stored disagreement cannot be bypassed by the editor-position exception`, async ({
    page,
  }, info) => {
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("Immutable original for retention guard");
    state.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply rejected", { exact: true }),
    ).toBeVisible();
    await source.fill("Newer source remains recoverable");
    await waitForReplySaved(page);
    await page.evaluate((difference) => {
      const get = IDBObjectStore.prototype.get;
      let armed = true;
      Reflect.set(window, "retentionFaultApplied", false);
      IDBObjectStore.prototype.get = function (key) {
        const request = get.call(this, key);
        if (
          armed &&
          this.transaction.db.name === "tsdm.workspace.reply-drafts" &&
          this.transaction.mode === "readwrite" &&
          key === "42"
        ) {
          armed = false;
          request.addEventListener("success", () => {
            const row: ReplyRow = request.result,
              current = row.variants[0]!.context!;
            if (difference === "head")
              row.variants[0]!.version = crypto.randomUUID();
            if (difference === "heads")
              row.variants.push({
                ...row.variants[0]!,
                version: crypto.randomUUID(),
              });
            if (difference === "send-revision")
              row.sends![0]!.revision = crypto.randomUUID();
            if (difference === "send-status")
              row.sends![0]!.attempt.status = "uncertain";
            if (difference === "context-id") current.id = crypto.randomUUID();
            if (difference === "account")
              current.account = { kind: "member", id: "8", name: "Writer 8" };
            if (difference === "source")
              current.source = "Different native retained source";
            if (difference === "options") current.options[0]!.checked = false;
            if (difference === "nested-revision")
              current.attempts![0]!.publication.submission.revision++;
            this.put(row);
            Reflect.set(window, "retentionFaultApplied", true);
          });
        }
        return request;
      };
    }, difference);
    await page
      .getByRole("button", { name: "Edit failed reply", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => Reflect.get(window, "retentionFaultApplied")),
      )
      .toBe(true);
    await expect(
      page.getByText(
        "The writing or saved reply changed, or recovery failed. Your newer draft is retained; try Edit again.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Recoverable reply versions",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(source).toHaveValue("Newer source remains recoverable");
    expect(posts(state)).toHaveLength(1);
    await info.attach("retention-disagreement.json", {
      body: JSON.stringify(await rows(page)),
      contentType: "application/json",
    });
  });

for (const width of [1440, 905, 390])
  for (const textSize of [100, 125])
    test(`UX112.owner-revision-expanded-${width}-${textSize}: full-column icon editing preserves source selection and undo on compact return`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (textSize) =>
          localStorage.setItem(
            "tsdm.workspace.preferences",
            JSON.stringify({
              schema: 1,
              theme: "light",
              language: "en",
              textSize,
            }),
          ),
        textSize,
      );
      const state = await open(page);
      await page.locator('[data-thread-id="42"] .subject').click();
      await page
        .getByRole("button", { name: "Post 4202 actions", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
      const source = await selectSourceEditor(page);
      await source.fill("[b]Exact expanded draft[/b]\n完整 source");
      await source.press("End");
      await source.pressSequentially("!");
      await source.evaluate((n: HTMLTextAreaElement) =>
        n.setSelectionRange(3, 8, "backward"),
      );
      await source.dispatchEvent("select");
      const original = await source.elementHandle();
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Reply tools", exact: true }),
      ).toHaveCount(0);
      const bounds = await page.locator(".source-writing").evaluate((n) => ({
        writing: n.getBoundingClientRect().toJSON(),
        column: n
          .closest(".conversation-region")!
          .getBoundingClientRect()
          .toJSON(),
      }));
      expect(
        bounds.writing.height / bounds.column.height,
      ).toBeGreaterThanOrEqual(0.9);
      for (const name of [
        "Switch to visual editor",
        "Undo",
        "Redo",
        "Text formatting",
        "Paragraph",
        "Insert",
        "Table",
        "Mentions",
        "Select attachments",
        "Current form options",
        "More writing actions",
      ]) {
        const button = page.getByRole("button", { name, exact: true });
        await expect(button).toHaveAttribute("title", name);
        await expect(button.locator("svg")).toHaveCount(1);
        expect((await button.innerText()).trim()).toBe("");
      }
      await expect(
        page.getByRole("button", {
          name: "Switch to source editor",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Redo", exact: true }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "Table", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Insert table", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      if (width === 390 && textSize === 125) {
        const toolbar = await page
          .locator(".reply-editing-toolbar")
          .boundingBox();
        expect(toolbar!.height).toBeLessThanOrEqual(210);
        expect((await source.boundingBox())!.height).toBeGreaterThanOrEqual(
          200,
        );
      }
      await capture(page, info, `revision-${width}-${textSize}-expanded`);
      await page
        .getByRole("button", { name: "Compact writing", exact: true })
        .click();
      expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
      expect(
        await source.evaluate((n: HTMLTextAreaElement) => ({
          start: n.selectionStart,
          end: n.selectionEnd,
          direction: n.selectionDirection,
        })),
      ).toEqual({ start: 3, end: 8, direction: "backward" });
      await expect(
        page.getByRole("article", { name: "Post 4202", exact: true }),
      ).toBeVisible();
      await source.press("ControlOrMeta+z");
      await expect(source).toHaveValue(
        "[b]Exact expanded draft[/b]\n完整 source",
      );
      expect(posts(state)).toHaveLength(0);
    });

for (const width of [1440, 390])
  test(`UX112.owner-revision-recovery-${width}: other-thread recovery is an explicit popup whose cancellation and choices preserve the current draft`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() =>
      localStorage.setItem(
        "tsdm.workspace.preferences",
        JSON.stringify({
          schema: 1,
          theme: "light",
          language: "en",
          textSize: 125,
        }),
      ),
    );
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const visual = page.getByRole("textbox", {
      name: "Visual post content",
      exact: true,
    });
    await visual.fill("Original other-thread reply");
    state.replyOutcome = "rejected";
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(
      page.getByText("Reply rejected", { exact: true }),
    ).toBeVisible();
    await visual.fill("Newer other-thread reply");
    await page
      .getByRole("button", { name: "Edit failed reply", exact: true })
      .click();
    await expect(
      page.getByRole("region", {
        name: "Recoverable reply versions",
        exact: true,
      }),
    ).toBeVisible();
    if (width < 768)
      await page
        .getByRole("button", { name: "Threads pane", exact: true })
        .click();
    await page.locator('[data-thread-id="43"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await visual.fill("Thread43 newer draft stays here");
    const original = await visual.elementHandle();
    await expect(
      page.getByRole("region", {
        name: "Recoverable reply versions",
        exact: true,
      }),
    ).toHaveCount(0);
    const trigger = page.getByRole("button", {
      name: "Reply recovery · 1",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "Reply recovery", exact: true }),
    ).toHaveCount(0);
    await capture(page, info, `revision-${width}-125-recovery-closed`);
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Reply recovery",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveValue("Original other-thread reply");
    await capture(page, info, `revision-${width}-125-recovery-open`);
    for (let step = 0; step < 10; step++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((n) =>
          n.contains((n.getRootNode() as ShadowRoot).activeElement),
        ),
      ).toBe(true);
    }
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
    await expect(visual).toHaveText("Thread43 newer draft stays here");
    await trigger.click();
    await dialog
      .getByRole("button", { name: "Discard version 1", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Keep this version", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Discard version 1", exact: true }),
    ).toBeFocused();
    const beforeRefusal = await rows(page);
    await page.evaluate(() => {
      const originalTransaction = IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction = function (names, access, options) {
        if (
          this.name === "tsdm.workspace.reply-drafts" &&
          access === "readwrite"
        )
          throw new DOMException(
            "Induced modal choice refusal",
            "SecurityError",
          );
        return originalTransaction.call(this, names, access, options);
      };
      Object.defineProperty(window, "restore112Host", {
        configurable: true,
        value: () => {
          IDBDatabase.prototype.transaction = originalTransaction;
        },
      });
    });
    try {
      await dialog
        .getByRole("button", { name: "Continue with version 1", exact: true })
        .click();
      await expect(dialog.getByRole("status")).toContainText(
        "The choice could not be saved",
      );
      await expect(dialog.getByRole("status")).toBeFocused();
      expect(await rows(page)).toEqual(beforeRefusal);
    } finally {
      await page.evaluate(() =>
        (window as unknown as { restore112Host: () => void }).restore112Host(),
      );
    }
    await dialog
      .getByRole("button", { name: "Continue with version 1", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText(
      "Selected version resumed",
    );
    await expect(
      dialog.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveValue("Newer other-thread reply");
    await dialog
      .getByRole("button", { name: "Discard version 1", exact: true })
      .click();
    await dialog
      .getByRole("button", {
        name: "Discard this retained version",
        exact: true,
      })
      .click();
    await expect(dialog.getByRole("status")).toContainText(
      "The selected retained version was discarded",
    );
    await expect(
      dialog.getByRole("textbox", {
        name: "Retained reply version 1",
        exact: true,
      }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Reply recovery · 0", exact: true }),
    ).toBeFocused();
    await expect(visual).toHaveText("Thread43 newer draft stays here");
    expect(posts(state)).toHaveLength(1);
  });

for (const width of [1440, 390])
  test(`UX112.owner-revision-send-feedback-${width}: expanded editing keeps the original pending and rejected submission controls available beside newer writing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("Exact expanded submitted reply");
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    let release = () => {};
    state.postGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    state.replyOutcome = "rejected";
    try {
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect.poll(() => posts(state).length).toBe(1);
      await expect(source).toHaveValue("");
      await source.fill("Newer writing while pending remains exact");
      // Send intentionally created the successor editor; presentation must retain it.
      const original = await source.elementHandle();
      const submissions = page.getByRole("region", {
        name: "Reply submissions",
        exact: true,
      });
      await expect(submissions).toBeVisible();
      await expect(
        submissions.getByText("Sending reply", { exact: true }),
      ).toBeVisible();
      await expect(
        submissions.getByRole("textbox", {
          name: "Submitted reply source",
          exact: true,
        }),
      ).toHaveValue("Exact expanded submitted reply");
      const originalSubmission = await submissions.elementHandle();
      await page
        .getByRole("button", { name: "Compact writing", exact: true })
        .click();
      await page.locator(".reading-pane").evaluate((node) => {
        node.scrollTop = 0;
      });
      const before = await readableLines(page);
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
      release();
      await expect(
        submissions.getByText("Reply rejected", { exact: true }),
      ).toBeVisible();
      const editFailed = submissions.getByRole("button", {
        name: "Edit failed reply",
        exact: true,
      });
      await editFailed.focus();
      await expect(editFailed).toBeFocused();
      // Browser scroll rounding may leave less than one physical pixel clipped.
      await expect(editFailed).toBeInViewport({ ratio: 0.99 });
      const usable = await submissions.evaluate((node) => {
        const action = node
          .querySelector("button:focus")!
          .getBoundingClientRect();
        const area = node.getBoundingClientRect();
        return action.top >= area.top - 1 && action.bottom <= area.bottom + 1;
      });
      expect(usable).toBe(true);
      await expect(
        page.getByRole("button", { name: "Compact writing", exact: true }),
      ).toBeVisible();
      const bounds = await submissions.boundingBox();
      expect(bounds!.height).toBeLessThanOrEqual(270);
      await capture(page, info, `revision-${width}-expanded-rejected`);
      await page
        .getByRole("button", { name: "Compact writing", exact: true })
        .click();
      expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
      expect(await originalSubmission!.evaluate((n) => n.isConnected)).toBe(
        true,
      );
      await expect(source).toHaveValue(
        "Newer writing while pending remains exact",
      );
      expectPreservedReadingLine(before, await readableLines(page));
      await expect(
        page.getByRole("article", { name: "Post 4202", exact: true }),
      ).toBeVisible();
      expect(posts(state)).toHaveLength(1);
    } finally {
      release();
    }
  });

for (const mode of ["visual", "source"] as const)
  for (const modifier of ["Control", "Meta"])
    test(`UX112.owner-toolbar-shortcut-${mode}-${modifier}: plain Enter and Shift Enter remain text while modifier Enter sends once`, async ({
      page,
    }) => {
      const state = await open(page);
      await page.locator('[data-thread-id="42"] .subject').click();
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      const editor =
        mode === "source"
          ? await selectSourceEditor(page)
          : page.getByRole("textbox", {
              name: "Visual post content",
              exact: true,
            });
      await editor.fill("First line");
      await editor.press("End");
      await editor.press("Enter");
      await editor.pressSequentially("Second line");
      await editor.press("Shift+Enter");
      await editor.pressSequentially("Third line");
      expect(posts(state)).toHaveLength(0);
      for (const init of [
        { ctrlKey: true, repeat: true },
        { metaKey: true, isComposing: true },
        { ctrlKey: true, keyCode: 229 },
      ])
        await editor.dispatchEvent("keydown", {
          key: "Enter",
          bubbles: true,
          ...init,
        });
      expect(posts(state)).toHaveLength(0);
      await editor.press(`${modifier}+Enter`);
      await expect.poll(() => posts(state).length).toBe(1);
      expect(new URLSearchParams(posts(state)[0]!.body!).get("message")).toBe(
        "First line\nSecond line\nThird line",
      );
      await expect(
        page.getByRole("textbox", {
          name: "Submitted reply source",
          exact: true,
        }),
      ).toHaveValue("First line\nSecond line\nThird line");
    });

for (const width of [1440, 390])
  test(`UX112.owner-toolbar-groups-${width}: one keyboard toolbar exposes grouped tools without replacing the editor or losing selection`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() =>
      localStorage.setItem(
        "tsdm.workspace.preferences",
        JSON.stringify({
          schema: 1,
          theme: "light",
          language: "en",
          textSize: 125,
        }),
      ),
    );
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("Selected text");
    await source.evaluate((n: HTMLTextAreaElement) =>
      n.setSelectionRange(0, 8, "backward"),
    );
    await source.dispatchEvent("select");
    const original = await source.elementHandle();
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const toolbar = page.getByRole("toolbar", {
      name: "Reply editing",
      exact: true,
    });
    await expect(toolbar).toHaveCount(1);
    await expect(page.locator(".advanced-authoring")).toHaveCount(0);
    for (const name of [
      "Text formatting",
      "Paragraph",
      "Insert",
      "Table",
      "Mentions",
    ]) {
      const trigger = toolbar.getByRole("button", { name, exact: true });
      await trigger.click();
      const popover = page.getByRole("dialog", { name, exact: true });
      await expect(popover).toBeVisible();
      const bounds = await popover.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
      await expect(popover).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    await expect(source).toHaveValue("Selected text");
    expect(await original!.evaluate((n) => n.isConnected)).toBe(true);
    const mode = toolbar.getByRole("button", {
      name: "Switch to visual editor",
      exact: true,
    });
    await mode.focus();
    await page.keyboard.press("End");
    await expect(
      toolbar.getByRole("button", {
        name: "More writing actions",
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(
      toolbar.getByRole("button", {
        name: "Switch to visual editor",
        exact: true,
      }),
    ).toBeFocused();
    await toolbar
      .getByRole("button", { name: "Text formatting", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Text formatting", exact: true })
      .getByRole("button", { name: "Bold", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Text formatting", exact: true }),
    ).toHaveCount(0);
    await toolbar
      .getByRole("button", { name: "Switch to source editor", exact: true })
      .click();
    await expect(source).toHaveValue("[b]Selected[/b] text");
    await toolbar.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(source).toHaveValue("Selected text");
    await capture(page, info, `toolbar-${width}-125`);
    expect(posts(state)).toHaveLength(0);
  });

test("UX112.owner-toolbar-composer: attachment selection options and actionable checks share the toolbar while prose Details is removed", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Post 4202 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source = await selectSourceEditor(page);
  await source.fill("Exact toolbar draft");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const toolbar = page.getByRole("toolbar", {
    name: "Reply editing",
    exact: true,
  });
  await expect(page.locator(".writing-details")).toHaveCount(0);
  await expect(toolbar.locator("input[type=file]")).toBeHidden();
  const picker = page.waitForEvent("filechooser");
  await toolbar
    .getByRole("button", { name: "Select attachments", exact: true })
    .click();
  await (
    await picker
  ).setFiles({
    name: "toolbar.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("selected toolbar bytes"),
  });
  await expect(
    page.getByText("Selected · toolbar.txt", { exact: true }),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await page
    .getByRole("button", {
      name: "Remove local selection toolbar.txt",
      exact: true,
    })
    .click();
  await toolbar
    .getByRole("button", { name: "Current form options", exact: true })
    .click();
  const options = page.getByRole("dialog", {
    name: "Current form options",
    exact: true,
  });
  const signature = options.getByLabel("Signature", { exact: true });
  await signature.uncheck();
  await signature.press("Control+Enter");
  expect(posts(state)).toHaveLength(0);
  await page.keyboard.press("Escape");
  await toolbar
    .getByRole("button", { name: "More writing actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", {
      name: "Check current account and form",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("menuitem", { name: "Start an ordinary reply", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toHaveCount(0);
  await expect(source).toHaveValue("Exact toolbar draft");
  await capture(page, info, "toolbar-composer");
  await source.press("Meta+Enter");
  await expect.poll(() => posts(state).length).toBe(1);
  const submitted = new URLSearchParams(posts(state)[0]!.body!);
  expect(submitted.get("message")).toBe("Exact toolbar draft");
  expect(submitted.has("usesig")).toBe(false);
  expect(submitted.has("reppost")).toBe(false);
});

test("UX112.owner-toolbar-parameter: grouped parameter entry retains selection and composition confirmation never applies or sends", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = await selectSourceEditor(page);
  await source.fill("Selected text");
  await source.evaluate((n: HTMLTextAreaElement) => n.setSelectionRange(0, 8));
  await source.dispatchEvent("select");
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const toolbar = page.getByRole("toolbar", {
    name: "Reply editing",
    exact: true,
  });
  await toolbar.getByRole("button", { name: "Insert", exact: true }).click();
  const popover = page.getByRole("dialog", { name: "Insert", exact: true });
  await popover.getByRole("button", { name: "Link URL", exact: true }).click();
  const parameter = popover.getByLabel("Link URL", { exact: true });
  await expect(parameter).toBeFocused();
  await parameter.fill("https://example.com/listening");
  await parameter.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(popover).toBeVisible();
  await expect(source).toHaveValue("Selected text");
  await parameter.dispatchEvent("keydown", { key: "Escape", keyCode: 229 });
  await expect(popover).toBeVisible();
  await parameter.press("Enter");
  await expect(popover).toHaveCount(0);
  await toolbar
    .getByRole("button", { name: "Switch to source editor", exact: true })
    .click();
  await expect(source).toHaveValue(
    "[url=https://example.com/listening]Selected[/url] text",
  );
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(source).toHaveValue("Selected text");
  await capture(page, info, "toolbar-parameter-result");
  expect(posts(state)).toHaveLength(0);
});

for (const failedSave of [false, true])
  test(`UX112.owner-recovery-prose-${failedSave ? "failure" : "normal"}: ordinary recovery is quiet unless saving actually fails`, async ({
    page,
  }, info) => {
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("Saved ordinary text without diagnostic prose");
    await expect
      .poll(
        async () =>
          (await rows(page)).find((r) => r.threadId === "42")?.variants[0]
            ?.context?.source,
      )
      .toBe("Saved ordinary text without diagnostic prose");
    if (failedSave) {
      await page.evaluate(() => {
        const original = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function (names, mode, options) {
          if (
            this.name === "tsdm.workspace.reply-drafts" &&
            mode === "readwrite"
          )
            throw new DOMException(
              "Induced save refusal",
              "QuotaExceededError",
            );
          return original.call(this, names, mode, options);
        };
      });
      await source.fill("Only current text after refused save");
      await expect(
        page.getByText(/Local reply drafts could not be saved/).first(),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Send reply", exact: true })
        .click();
      await expect(source).toHaveValue("Only current text after refused save");
    } else {
      await page
        .getByRole("button", { name: "Expand writing", exact: true })
        .click();
      await expect(page.locator(".writing-recovery")).toHaveCount(0);
      await expect(
        page.getByText("Recovery details", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText(/Local reply draft saved in this browser profile/),
      ).toHaveCount(0);
      await page.reload();
      await expect(await selectSourceEditor(page)).toHaveValue(
        "Saved ordinary text without diagnostic prose",
      );
    }
    await expect(page.locator(".writing-recovery details")).toHaveCount(0);
    expect(posts(state)).toHaveLength(0);
    await capture(
      page,
      info,
      `quiet-recovery-${failedSave ? "failure" : "normal"}`,
    );
  });

for (const width of [1440, 390])
  test(`UX112.expanded-error-${width}: full-column editing keeps actionable preparation failure visible and preserves exact writing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("Preserve source through the visible attachment refusal");
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await chooseAttachments(page, {
      name: "pending.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("local-only"),
    });
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    const alert = page.getByText(
      /Finish uploads or explicitly remove pending selections/,
    );
    await expect(alert).toBeVisible();
    await expect(alert).toBeInViewport();
    await expect(source).toHaveValue(
      "Preserve source through the visible attachment refusal",
    );
    await expect(source).toBeInViewport();
    await expect(
      page.getByRole("button", {
        name: "Remove local selection pending.txt",
        exact: true,
      }),
    ).toBeVisible();
    expect(posts(state)).toHaveLength(0);
    await capture(page, info, `expanded-error-${width}`);
  });

for (const width of [1440, 390])
  test(`UX112.owner-toolbar-list-table-${width}: grouped paragraph and table commands preserve exact authored source and real keyboard cell editing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = await selectSourceEditor(page);
    await source.fill("words");
    await source.selectText();
    await source.dispatchEvent("select");
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    const toolbar = page.getByRole("toolbar", {
      name: "Reply editing",
      exact: true,
    });
    for (const [command, expected] of [
      ["Unordered list", "[list][*]words[/list]"],
      ["Ordered list", "[list=1][*]words[/list]"],
    ] as const) {
      await toolbar
        .getByRole("button", { name: "Paragraph", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "Paragraph", exact: true })
        .getByRole("button", { name: command, exact: true })
        .click();
      await toolbar
        .getByRole("button", { name: "Switch to source editor", exact: true })
        .click();
      await expect(source).toHaveValue(expected!);
      await toolbar.getByRole("button", { name: "Undo", exact: true }).click();
      await expect(source).toHaveValue("words");
      await source.selectText();
      await source.dispatchEvent("select");
    }
    await source.fill("");
    await toolbar
      .getByRole("button", { name: "Switch to visual editor", exact: true })
      .click();
    await toolbar.getByRole("button", { name: "Table", exact: true }).click();
    const table = page.getByRole("dialog", { name: "Table", exact: true });
    await table.getByLabel("Table rows", { exact: true }).fill("2");
    await table.getByLabel("Table columns", { exact: true }).fill("2");
    await table
      .getByRole("button", { name: "Insert table", exact: true })
      .click();
    const editor = page.getByRole("textbox", {
      name: "Visual post content",
      exact: true,
    });
    await expect(editor.locator("td")).toHaveCount(4);
    await editor.locator("td").first().click();
    for (const value of ["A", "B", "C", "D"]) {
      await page.keyboard.type(value);
      if (value !== "D") await page.keyboard.press("Tab");
    }
    await toolbar
      .getByRole("button", { name: "Switch to source editor", exact: true })
      .click();
    const expected =
      "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]";
    await expect(source).toHaveValue(expected);
    await waitForReplySaved(page);
    await capture(page, info, "grouped-list-table");
    await page.reload();
    await expect(await selectSourceEditor(page)).toHaveValue(expected);
    expect(posts(state)).toHaveLength(0);
  });

// Failure inventory and agreed full-app seam: /private/tmp/tsdm-ui-112-single-mode/plan.md.
for (const [language, toSource, toVisual] of [
  ["en", "Switch to source editor", "Switch to visual editor"],
  ["zh-CN", "切换到源码编辑", "切换到可视编辑"],
  ["zh-TW", "切換至原始碼編輯", "切換至視覺編輯"],
] as const)
  test(`UX112.single-mode-${language}: one keyboard button switches a visual-default reply while retaining exact source selection undo and session mode`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(
      (language) =>
        localStorage.setItem(
          "tsdm.workspace.preferences",
          JSON.stringify({
            schema: 1,
            language,
            theme: "light",
            textSize: 100,
          }),
        ),
      language,
    );
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", {
        name: /^(Reply to thread|回复主题|回覆主題)$/,
        exact: true,
      })
      .click();
    const visual = page.getByRole("textbox", {
      name: /^(Visual post content|可视帖子内容|視覺文章內容)$/,
      exact: true,
    });
    await expect(visual).toBeFocused();
    await visual.fill("First selected tail");
    await visual.press("End");
    await visual.pressSequentially("!");
    const visualNode = await visual.elementHandle();
    await page
      .getByRole("button", { name: /^(Reply tools|回覆工具)$/, exact: true })
      .click();
    const toggle = page.getByRole("button", { name: toSource, exact: true });
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveAttribute("title", toSource);
    await expect(
      page.getByRole("button", {
        name: /^(Visual editor|Source editor|可视编辑|源码编辑|視覺編輯|原始碼編輯)$/,
        exact: true,
      }),
    ).toHaveCount(0);
    await toggle.focus();
    await toggle.press("Enter");
    const source = page.getByRole("textbox", {
      name: /^(Complete source|完整源码|完整原始碼)$/,
      exact: true,
    });
    await expect(source).toBeFocused();
    await expect(source).toHaveValue("First selected tail!");
    await source.evaluate((node: HTMLTextAreaElement) =>
      node.setSelectionRange(0, 5, "backward"),
    );
    await source.dispatchEvent("select");
    const sourceNode = await source.elementHandle();
    const back = page.getByRole("button", { name: toVisual, exact: true });
    await expect(back).toHaveAttribute("title", toVisual);
    await back.focus();
    await back.press("End");
    await expect(
      page.getByRole("button", {
        name: /^(More writing actions|更多写作操作|更多寫作操作)$/,
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(back).toBeFocused();
    await back.press("Space");
    await expect(visual).toBeFocused();
    expect(
      await visual.evaluate(() => document.getSelection()?.toString()),
    ).toBe("First");
    await page.getByRole("button", { name: toSource, exact: true }).click();
    await expect(source).toBeFocused();
    expect(
      await source.evaluate((node: HTMLTextAreaElement) => [
        node.selectionStart,
        node.selectionEnd,
        node.selectionDirection,
      ]),
    ).toEqual([0, 5, "backward"]);
    await page
      .getByRole("button", {
        name: /^(Expand writing|展开写作|展開寫作)$/,
        exact: true,
      })
      .click();
    await expect(source).toBeVisible();
    await page
      .getByRole("button", {
        name: /^(Compact writing|紧凑写作|精簡寫作)$/,
        exact: true,
      })
      .click();
    await expect(source).toBeVisible();
    await page
      .getByRole("button", {
        name: /^(Threads pane|主题面板|主題面板)$/,
        exact: true,
      })
      .click();
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", {
        name: /^(Return to writing|返回写作|返回寫作)$/,
        exact: true,
      })
      .click();
    await expect(source).toBeVisible();
    expect(await sourceNode!.evaluate((node) => node.isConnected)).toBe(true);
    expect(await visualNode!.evaluate((node) => node.isConnected)).toBe(true);
    const tools = page.getByRole("button", {
      name: /^(Reply tools|回覆工具)$/,
      exact: true,
    });
    if ((await tools.getAttribute("aria-expanded")) === "false")
      await tools.click();
    await page
      .getByRole("button", { name: /^(Undo|撤销|復原)$/, exact: true })
      .click();
    await expect(source).toHaveValue("First selected tail");
    await page
      .getByRole("button", { name: /^(Redo|重做)$/, exact: true })
      .click();
    await expect(source).toHaveValue("First selected tail!");
    await waitForReplySaved(page);
    await page.reload();
    await expect(visual).toHaveText("First selected tail!");
    expect(posts(state)).toHaveLength(0);
    await capture(page, info, `single-mode-${language}`);
  });

for (const editorMode of ["visual", "source"] as const)
  test(`UX112.single-mode-ime-${editorMode}: native composition disables the mode switch until exact conversion commits without sending`, async ({
    page,
    context,
  }, info) => {
    const state = await open(page);
    await page.locator('[data-thread-id="42"] .subject').click();
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reply tools", exact: true })
      .click();
    if (editorMode === "source")
      await page
        .getByRole("button", { name: "Switch to source editor", exact: true })
        .click();
    const body = page.getByRole("textbox", {
      name: editorMode === "visual" ? "Visual post content" : "Complete source",
      exact: true,
    });
    await body.fill("Before ");
    await body.press("End");
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.imeSetComposition", {
      text: "nei ho",
      selectionStart: 6,
      selectionEnd: 6,
    });
    const toggle = page.getByRole("button", {
      name:
        editorMode === "visual"
          ? "Switch to source editor"
          : "Switch to visual editor",
      exact: true,
    });
    await expect(toggle).toBeDisabled();
    await expect(body).toBeFocused();
    await cdp.send("Input.insertText", { text: "你好" });
    await expect(toggle).toBeEnabled();
    await toggle.click();
    if (editorMode === "visual")
      await expect(
        page.getByRole("textbox", { name: "Complete source", exact: true }),
      ).toHaveValue("Before 你好");
    else
      await expect(
        page.getByRole("textbox", { name: "Visual post content", exact: true }),
      ).toHaveText("Before 你好");
    expect(posts(state)).toHaveLength(0);
    await capture(page, info, `single-mode-ime-${editorMode}`);
    await cdp.detach();
  });

test("UX112.simple-menu-preview: verified visual replies need no More menu while Source alone offers inert Preview", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  const more = page.getByRole("button", {
    name: "More writing actions",
    exact: true,
  });
  await expect(more).toHaveCount(0);
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText("Enter reply text before sending.", { exact: true }),
  ).toBeVisible();
  await expect(more).toHaveCount(0);
  const source = await selectSourceEditor(page);
  await source.fill("[b]Exact inert preview[/b]");
  await more.click();
  await expect(page.getByRole("menuitem")).toHaveText(["Preview"]);
  await page.getByRole("menuitem", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Preview", exact: true }),
  ).toContainText("Exact inert preview");
  await page
    .getByRole("button", { name: "Switch to visual editor", exact: true })
    .click();
  await expect(visual).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Preview", exact: true }),
  ).toHaveCount(0);
  await expect(more).toHaveCount(0);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  await expect(visual).toBeVisible();
  expect(
    await page
      .locator(".reading-pane")
      .evaluate((node) => node.getBoundingClientRect().height),
  ).toBeGreaterThan(0);
  expect(posts(state)).toHaveLength(0);
  await capture(page, info, "simple-menu-preview");
});

test("UX112.simple-menu-check: real form refusal and unverified recovery keep Check reachable until successful checking removes the last item with valid focus", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.fill("Keep text through permission failure and recovery");
  await waitForReplySaved(page);
  state.refusedReply = true;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "The current account cannot prepare this new thread.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  const more = page.getByRole("button", {
    name: "More writing actions",
    exact: true,
  });
  await more.click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Check current account and form",
  ]);
  await page
    .getByRole("menuitem", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(more).toBeVisible();
  await expect(visual).toBeFocused();
  state.refusedReply = false;
  await more.click();
  await page
    .getByRole("menuitem", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(more).toHaveCount(0);
  await expect(visual).toBeFocused();
  await waitForReplySaved(page);
  await page.reload();
  await expect(visual).toHaveText(
    "Keep text through permission failure and recovery",
  );
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await more.click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Check current account and form",
  ]);
  await page
    .getByRole("menuitem", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(more).toHaveCount(0);
  await expect(visual).toBeFocused();
  await expect(visual).toHaveText(
    "Keep text through permission failure and recovery",
  );
  expect(posts(state)).toHaveLength(0);
  await capture(page, info, "simple-menu-check");
});

test("UX112.simple-menu-retarget: addressed visual reply keeps its one necessary action then returns focus to unchanged writing without an empty menu", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Post 4202 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.fill("Keep authored reply while removing destination");
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  const more = page.getByRole("button", {
    name: "More writing actions",
    exact: true,
  });
  await more.click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Start an ordinary reply",
  ]);
  await page
    .getByRole("menuitem", { name: "Start an ordinary reply", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Reply target", exact: true }),
  ).toHaveCount(0);
  await expect(more).toHaveCount(0);
  await expect(visual).toBeFocused();
  await expect(visual).toHaveText(
    "Keep authored reply while removing destination",
  );
  expect(posts(state)).toHaveLength(0);
  await capture(page, info, "simple-menu-retarget");
});

// A late preparation result must not attach form-recheck UI to another reply.
test("UX112.simple-menu-context: failed preflight UI is context-bound and a held old failure cannot mark a new reply", async ({
  page,
}, info) => {
  const state = await open(page);
  await page.locator('[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Visual post content", exact: true })
    .fill("Thread42 retained through failure");
  await waitForReplySaved(page);
  state.refusedReply = true;
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "The current account cannot prepare this new thread.",
    }),
  ).toBeVisible();
  let release = () => {};
  state.gate = {
    thread: "42",
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
  };
  try {
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await page.locator('[data-thread-id="43"] .subject').click();
    state.refusedReply = false;
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Visual post content", exact: true })
      .fill("Thread43 current writing");
    await waitForReplySaved(page);
    state.refusedReply = true;
    const lateResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.searchParams.get("mod") === "post" &&
        url.searchParams.get("tid") === "42"
      );
    });
    release();
    await lateResponse;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page
      .getByRole("button", { name: "Reply tools", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "More writing actions", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Visual post content", exact: true }),
    ).toHaveText("Thread43 current writing");
    expect(posts(state)).toHaveLength(0);
    await capture(page, info, "simple-menu-context");
  } finally {
    release();
  }
});
