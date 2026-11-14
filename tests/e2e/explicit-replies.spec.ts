import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  selectSourceEditor,
  revealWritingTools,
  revealWritingDetails,
} from "./editor-controls";
import {
  openSettings,
  closeSettingsToWorkspace,
  revealNavigation,
} from "./navigation-ui";
import {
  origin,
  boardURL,
  createSharedReplyFixture,
  renderSharedReplyResponse,
} from "./shared-reply-fixture";

type Request = { url: string; method: string; body: string | null };
type Response = Awaited<ReturnType<typeof renderSharedReplyResponse>>;
type Fixture = ReturnType<typeof createSharedReplyFixture> & {
  respond?: (
    request: Request,
    response: Response,
  ) => Promise<Response> | Response;
};
const fixtures = new WeakMap<Page, Fixture>();
async function open(page: Page, startReply = true) {
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  const state: Fixture = createSharedReplyFixture();
  fixtures.set(page, state);
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/__explicit.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__explicit.js"></script></body></html>`,
      });
    const input = {
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    };
    const response = await renderSharedReplyResponse(state, input);
    return route.fulfill(
      state.respond ? await state.respond(input, response) : response,
    );
  });
  await page.goto(boardURL);
  await page.locator('[data-thread-id="42"] .subject').click();
  await expect(
    page.getByRole("heading", { name: "Thread 42", exact: true }),
  ).toBeVisible();
  if (startReply)
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
  return state;
}
const posts = (state: Fixture) =>
  state.requests.filter((r) => r.method === "POST");
test.afterEach(async ({ page, browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("explicit-reply-requests.json", {
    body: JSON.stringify(fixtures.get(page)?.requests ?? [], null, 2),
    contentType: "application/json",
  });
  await info.attach("explicit-reply.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("UX110.one-send: explicit addressed Send binds exact source options target and actor without Preview", async ({
  page,
}) => {
  const state = await open(page);
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source =
    "[b]One explicit reply[/b]\n[quote]保留原文[/quote]\n[unknown]literal[/unknown]";
  await (await selectSourceEditor(page)).fill(source);
  await revealWritingTools(page);
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await expect(page.locator(".reply-preview")).toHaveCount(0);
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
  const sent = posts(state)[0]!;
  expect(new URL(sent.url).searchParams.get("tid")).toBe("42");
  expect(
    Object.fromEntries(new URLSearchParams(sent.body ?? "")),
  ).toMatchObject({
    message: source,
    reppost: "4201",
    reppid: "4201",
    replysubmit: "yes",
    formhash: "SYNTHETIC_RETAINED_TOKEN",
  });
  expect(new URLSearchParams(sent.body ?? "").has("usesig")).toBe(false);
  expect(state.savedActors.get("42")).toBe("7");
  await expect(
    page.getByRole("button", {
      name: "Cancel review and return to writing",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(await selectSourceEditor(page)).toHaveValue(source);
});

test("UX110.visual-keys: Shift Enter inserts an exact newline and Enter sends the visual reply", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("First line");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.press("Shift+Enter");
  await visual.pressSequentially("Second line");
  expect(posts(state)).toHaveLength(0);
  await visual.press("Enter");
  await expect.poll(() => posts(state).length).toBe(1);
  expect(new URLSearchParams(posts(state)[0]!.body ?? "").get("message")).toBe(
    "First line\nSecond line",
  );
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
});

for (const modifier of ["Control", "Meta"]) {
  test(`UX110.source-${modifier}: BBCode Enter inserts newline and ${modifier} Enter sends`, async ({
    page,
  }) => {
    const state = await open(page);
    const source = await selectSourceEditor(page);
    await source.fill("[b]Source first[/b]");
    await source.press("Enter");
    await source.pressSequentially("Source second");
    expect(posts(state)).toHaveLength(0);
    await source.press(`${modifier}+Enter`);
    await expect.poll(() => posts(state).length).toBe(1);
    expect(
      new URLSearchParams(posts(state)[0]!.body ?? "").get("message"),
    ).toBe("[b]Source first[/b]\nSource second");
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
  });
}

test("UX110.mode-hints: compact accessible descriptions and visible tools follow mode alongside validation", async ({
  page,
}) => {
  const state = await open(page);
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  const visualHint = "Enter: send · Shift+Enter: new line";
  const sourceHint = "Enter: new line · Ctrl/⌘+Enter: send";
  await expect(visual).toHaveAccessibleDescription(visualHint);
  await expect(page.getByText(visualHint, { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Reply tools", exact: true }).click();
  await expect(page.getByText(visualHint, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  const source = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await expect(source).toHaveAccessibleDescription(sourceHint);
  await expect(page.getByText(sourceHint, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(source).toHaveAttribute("aria-invalid", "true");
  await expect(source).toHaveAccessibleDescription(
    /Enter: new line · Ctrl\/⌘\+Enter: send.*Enter reply text before sending\./,
  );
  expect(posts(state)).toHaveLength(0);
  await source.fill("Corrected reply");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await revealWritingTools(page);
  await expect(page.getByText(sourceHint, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  await expect(visual).toHaveAccessibleDescription(visualHint);
  await expect(page.getByText(visualHint, { exact: true })).toBeVisible();
});

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
const replyGets = (state: Fixture) =>
  state.requests.filter(
    (r) =>
      r.method === "GET" &&
      new URL(r.url).searchParams.get("action") === "reply",
  ).length;
const sendButton = (page: Page) =>
  page.getByRole("button", { name: "Send reply", exact: true });

for (const change of ["source", "options", "selection"] as const) {
  test(`UX110.prepare-${change}: delayed preparation cannot publish a changed activation`, async ({
    page,
  }) => {
    const state = await open(page);
    const source = await selectSourceEditor(page);
    await source.fill("Captured before delay");
    await revealWritingTools(page);
    const gate = deferred(),
      before = replyGets(state);
    state.gate = { thread: "42", promise: gate.promise };
    await sendButton(page).click();
    await expect.poll(() => replyGets(state)).toBeGreaterThan(before);
    if (change === "source") await source.fill("Later independent writing");
    else if (change === "options")
      await page.getByLabel("Signature", { exact: true }).uncheck();
    else {
      await source.focus();
      await source.press("ArrowLeft");
    }
    state.gate = null;
    gate.release();
    await expect(sendButton(page)).toBeEnabled();
    expect(posts(state)).toHaveLength(0);
    await expect(source).toHaveValue(
      change === "source"
        ? "Later independent writing"
        : "Captured before delay",
    );
    await sendButton(page).click();
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    expect(posts(state)).toHaveLength(1);
    expect(
      new URLSearchParams(posts(state)[0]!.body ?? "").get("message"),
    ).toBe(
      change === "source"
        ? "Later independent writing"
        : "Captured before delay",
    );
    if (change === "options")
      expect(
        new URLSearchParams(posts(state)[0]!.body ?? "").has("usesig"),
      ).toBe(false);
  });
}

for (const phase of ["prepare", "preflight"] as const) {
  for (const fault of ["account", "permission", "form"] as const) {
    test(`UX110.${phase}-${fault}: fresh native changes refuse dispatch and retain exact source`, async ({
      page,
    }) => {
      const state = await open(page);
      const source = await selectSourceEditor(page);
      await source.fill("Exact refused reply");
      let seen = 0;
      state.respond = (request, response) => {
        if (
          request.method === "GET" &&
          new URL(request.url).searchParams.get("action") === "reply" &&
          ++seen === (phase === "prepare" ? 1 : 2)
        ) {
          if (fault === "account")
            return {
              ...response,
              body: response.body
                .replaceAll("uid=7", "uid=8")
                .replaceAll("Writer 7", "Writer 8"),
            };
          if (fault === "permission")
            return {
              contentType: "text/html",
              body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div><div id="messagetext">权限不足</div>',
            };
          return {
            ...response,
            body: response.body.replaceAll("usesig", "unsupported_option"),
          };
        }
        return response;
      };
      await sendButton(page).click();
      await expect
        .poll(() => seen)
        .toBeGreaterThanOrEqual(phase === "prepare" ? 1 : 2);
      await expect(sendButton(page)).toBeEnabled();
      expect(posts(state)).toHaveLength(0);
      await expect(source).toHaveValue("Exact refused reply");
      await expect(page.locator(".source-writing")).toContainText(
        /changed|权限不足|account/i,
      );
      delete state.respond;
    });
  }
}

test("UX110.pending-ack: failed native storage acknowledgement prevents dispatch and retains source", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Unsent because recovery refused");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "tsdm.workspace.recovery")
        throw new DOMException("Fixture quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await sendButton(page).click();
  await expect(
    page.getByText(/Publication was not sent because recovery/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue("Unsent because recovery refused");
});

test("UX110.rapid: double click plus editor shortcut during delayed preparation produces one POST", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("One activation only");
  const gate = deferred(),
    before = replyGets(state);
  state.gate = { thread: "42", promise: gate.promise };
  await sendButton(page).dblclick();
  await expect.poll(() => replyGets(state)).toBeGreaterThan(before);
  await source.press("Control+Enter");
  await source.dispatchEvent("keydown", {
    key: "Enter",
    ctrlKey: true,
    repeat: true,
  });
  state.gate = null;
  gate.release();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
});

test("UX110.fast-double-click: second click of one gesture cannot resend after fast completion", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("One mouse gesture");
  await sendButton(page).evaluate((node) => {
    node.addEventListener(
      "click",
      (event) => {
        if ((event as MouseEvent).detail === 2)
          node.setAttribute(
            "data-confirmed-before-second-click",
            String(
              (node.getRootNode() as ShadowRoot).textContent?.includes(
                "Confirmed stored reply in thread 42",
              ),
            ),
          );
      },
      true,
    );
  });
  await sendButton(page).dblclick({ delay: 400 });
  await expect(sendButton(page)).toHaveAttribute(
    "data-confirmed-before-second-click",
    "true",
  );
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
});

for (const mode of ["visual", "source"] as const) {
  test(`UX110.composition-${mode}: browser composition and confirmation keys never send`, async ({
    page,
  }, info) => {
    const state = await open(page);
    await (await selectSourceEditor(page)).fill("Base ");
    if (mode === "visual")
      await page
        .getByRole("button", { name: "Visual editor", exact: true })
        .click();
    const input = page.getByRole("textbox", {
      name: mode === "visual" ? "Visual post content" : "Complete source",
      exact: true,
    });
    await input.focus();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.imeSetComposition", {
      text: "nei ho",
      selectionStart: 6,
      selectionEnd: 6,
    });
    await input.dispatchEvent("keydown", {
      key: "Enter",
      ctrlKey: mode === "source",
      isComposing: true,
    });
    await input.dispatchEvent("keydown", {
      key: "Enter",
      ctrlKey: mode === "source",
      keyCode: 229,
    });
    expect(posts(state)).toHaveLength(0);
    await cdp.send("Input.insertText", { text: "你好" });
    await expect(sendButton(page)).toBeEnabled();
    const observedSource = () =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .source,
      );
    const afterCommit = await observedSource();
    await input.dispatchEvent("compositionstart", { data: "" });
    await input.evaluate((node, source) => {
      node.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true }),
      );
      node.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          ctrlKey: source,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, mode === "source");
    expect(posts(state)).toHaveLength(0);
    await expect(sendButton(page)).toBeEnabled();
    const afterConfirmation = await observedSource();
    await info.attach("composition-source-phases.json", {
      body: JSON.stringify({ mode, afterCommit, afterConfirmation }),
      contentType: "application/json",
    });
    await input.press(mode === "visual" ? "Enter" : "Control+Enter");
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    expect(posts(state)).toHaveLength(1);
    expect(
      new URLSearchParams(posts(state)[0]!.body ?? "").get("message"),
    ).toBe("Base 你好");
    await cdp.detach();
  });
}

test("UX110.tool-keys: tool inputs and repeated or unsupported editor keys cannot send", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Tool focus is not Send");
  await revealWritingTools(page);
  await page.locator(".advanced-authoring > summary").click();
  await page.getByRole("button", { name: "Link URL", exact: true }).click();
  const url = page.getByRole("textbox", { name: "Link URL", exact: true });
  await url.fill("https://example.com/");
  await url.press("Enter");
  await url.press("Control+Enter");
  await url.press("Meta+Enter");
  expect(posts(state)).toHaveLength(0);
  await source.dispatchEvent("keydown", {
    key: "Enter",
    ctrlKey: true,
    repeat: true,
  });
  await source.press("Alt+Control+Enter");
  expect(posts(state)).toHaveLength(0);
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.dispatchEvent("keydown", { key: "Enter", repeat: true });
  await visual.press("Alt+Enter");
  expect(posts(state)).toHaveLength(0);
});

test("UX110.confirmation-order: Enter immediately after compositionend does not mutate visual source", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("Confirmed 你好");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.dispatchEvent("compositionstart", { data: "" });
  await visual.evaluate((node) => {
    node.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    node.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(sendButton(page)).toBeEnabled();
  expect(posts(state)).toHaveLength(0);
  await expect(await selectSourceEditor(page)).toHaveValue("Confirmed 你好");
});

test("UX110.uncertain-resend: checked uncertainty requires explicit duplicate-risk Send and preserves both exact attempts", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Original uncertain reply");
  state.respond = (request, response) => {
    if (request.method === "POST") {
      state.saved.clear();
      return { contentType: "text/html", body: "Unknown publication outcome" };
    }
    return response;
  };
  await sendButton(page).click();
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await source.fill("Later deliberate reply");
  await sendButton(page).click();
  await expect(
    page.getByText(/An earlier attempt may already exist/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
  await page
    .getByRole("button", { name: "Prepare another attempt", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Accept duplicate risk and send",
      exact: true,
    })
    .click();
  await expect.poll(() => posts(state).length).toBe(2);
  expect(
    posts(state).map((request) =>
      new URLSearchParams(request.body ?? "").get("message"),
    ),
  ).toEqual(["Original uncertain reply", "Later deliberate reply"]);
  await expect(source).toHaveValue("Later deliberate reply");
  await expect(
    page.getByRole("button", { name: "Check result", exact: true }),
  ).toHaveCount(2);
  await page.reload();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Later deliberate reply",
  );
  expect(posts(state)).toHaveLength(2);
});

test("UX110.retarget: changing an addressed target during preparation revokes that Send", async ({
  page,
}) => {
  const state = await open(page);
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).click();
  const source = await selectSourceEditor(page);
  await source.fill("Retained while removing addressee");
  const gate = deferred(),
    before = replyGets(state);
  state.gate = { thread: "42", promise: gate.promise };
  await sendButton(page).click();
  await expect.poll(() => replyGets(state)).toBeGreaterThan(before);
  await page
    .getByRole("button", { name: "Remove reply target", exact: true })
    .click();
  state.gate = null;
  gate.release();
  await expect(sendButton(page)).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toHaveCount(0);
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue("Retained while removing addressee");
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
  expect(new URLSearchParams(posts(state)[0]!.body ?? "").has("reppost")).toBe(
    false,
  );
});

test("UX110.switch-thread: late preparation cannot send into a newly selected thread", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("Thread 42 captured reply");
  const gate = deferred(),
    before = replyGets(state);
  state.gate = { thread: "42", promise: gate.promise };
  await sendButton(page).click();
  await expect.poll(() => replyGets(state)).toBeGreaterThan(before);
  await page.locator('[data-thread-id="43"] .subject').click();
  await expect(
    page.getByRole("heading", { name: "Thread 43", exact: true }),
  ).toBeVisible();
  state.gate = null;
  gate.release();
  await page.locator('[data-thread-id="42"] .subject').click();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Thread 42 captured reply",
  );
  await expect(sendButton(page)).toBeEnabled();
  expect(posts(state)).toHaveLength(0);
});

test("UX110.preflight-writing: later typing after pending acknowledgement cannot alter or dispatch the captured attempt", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Exact pending revision");
  const gate = deferred();
  let seen = 0;
  state.respond = async (request, response) => {
    if (
      request.method === "GET" &&
      new URL(request.url).searchParams.get("action") === "reply" &&
      ++seen === 2
    )
      await gate.promise;
    return response;
  };
  await sendButton(page).click();
  await expect.poll(() => seen).toBe(2);
  await source.fill("Newer writing during preflight");
  gate.release();
  await expect(
    page.getByText(/Local writing or recovery changed during preflight/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue("Newer writing during preflight");
  const saved = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(saved.attempts[0].publication.submission.writing.source).toBe(
    "Exact pending revision",
  );
  expect(saved.attempts[0].status).toBe("not-sent");
});

test("UX110.current-actor: shared historical provenance stays A while explicit Send publishes exact B operation", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("Shared writing by current B");
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
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(state.savedActors.get("42")).toBe("8");
  const saved = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(saved.account.id).toBe("7");
  expect(saved.attempts[0].publication.submission.writing.account.id).toBe("8");
  expect(posts(state)).toHaveLength(1);
});

test("UX110.unknown-actor: a newly discovered identity cannot inherit an unverified Send activation", async ({
  page,
}) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("Keep exact source while actor is unknown");
  state.member = "unknown";
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await expect(sendButton(page)).toBeEnabled();
  state.member = "7";
  await sendButton(page).click();
  await expect(
    page.getByText(
      /The sending account was not verified when Send was activated/,
    ),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue("Keep exact source while actor is unknown");
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(1);
});

test("UX110.optional-preview: inert source-faithful Preview neither sends nor changes protected writing", async ({
  page,
}) => {
  const state = await open(page);
  const literal =
    "[b]Optional inspection[/b]\n[url=https://example.test/]Inert link[/url]\n[img]https://example.test/a.png[/img]\n[unknown]保留[/unknown]";
  const source = await selectSourceEditor(page);
  await source.fill(literal);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = page.locator(".reply-preview");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Optional inspection");
  await expect(preview).toContainText("[unknown]保留[/unknown]");
  await expect(preview.locator("a, img, iframe")).toHaveCount(0);
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue(literal);
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(new URLSearchParams(posts(state)[0]!.body ?? "").get("message")).toBe(
    literal,
  );
});

test("UX110.unresolved: visual literal interpretation blocks Send until explicitly resolved", async ({
  page,
}) => {
  const state = await open(page);
  await (await selectSourceEditor(page)).fill("[B]retained[/B]");
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  const visual = page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
  await visual.press("Meta+ArrowRight");
  await visual.pressSequentially(" [b]literal[/b]");
  await expect(
    page.getByText(/Some visual input has no unambiguous/),
  ).toBeVisible();
  await sendButton(page).click();
  await expect(
    page.getByText(/Review the complete source and resolve its interpretation/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  const source = await selectSourceEditor(page),
    exact = await source.inputValue();
  await page
    .getByRole("button", {
      name: "Interpret complete source as BBCode",
      exact: true,
    })
    .click();
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(new URLSearchParams(posts(state)[0]!.body ?? "").get("message")).toBe(
    exact,
  );
});

test("UX110.local-attachment: pending and reload-unavailable file intent block publication until explicit removal", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await selectSourceEditor(page)
  ).fill("Keep reply around lost attachment");
  await revealWritingTools(page);
  await page.getByLabel("Select attachments", { exact: true }).setInputFiles({
    name: "pending.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Fixture attachment bytes"),
  });
  await sendButton(page).click();
  await expect(
    page.getByText(/Finish uploads or explicitly remove pending selections/),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await page.reload();
  await selectSourceEditor(page);
  await revealWritingTools(page);
  await expect(
    page.getByText("Unavailable · pending.txt", { exact: true }),
  ).toBeVisible();
  await revealWritingDetails(page);
  await page
    .getByRole("button", {
      name: "Check current account and form",
      exact: true,
    })
    .click();
  await sendButton(page).click();
  await expect(sendButton(page)).toBeEnabled();
  expect(posts(state)).toHaveLength(0);
  await page
    .getByRole("button", { name: "Remove pending.txt", exact: true })
    .click();
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  expect(new URLSearchParams(posts(state)[0]!.body ?? "").get("message")).toBe(
    "Keep reply around lost attachment",
  );
});

for (const [language, visualHint, sourceHint, sourceLabel, visualButton] of [
  [
    "zh-CN",
    "Enter：发送 · Shift+Enter：换行",
    "Enter：换行 · Ctrl/⌘+Enter：发送",
    "完整源码",
    "可视编辑",
  ],
  [
    "zh-TW",
    "Enter：傳送 · Shift+Enter：換行",
    "Enter：換行 · Ctrl/⌘+Enter：傳送",
    "完整原始碼",
    "視覺編輯",
  ],
]) {
  test(`UX110.hints-${language}: current-mode guidance remains localized across compact and expanded presentation`, async ({
    page,
  }) => {
    await open(page);
    await (await selectSourceEditor(page)).fill("Localized retained source");
    await openSettings(page);
    await page.locator("#interface-language").selectOption(language!);
    await closeSettingsToWorkspace(page);
    const source = page.getByRole("textbox", {
      name: sourceLabel!,
      exact: true,
    });
    await expect(source).toHaveAccessibleDescription(sourceHint!);
    await revealWritingTools(page);
    await expect(page.getByText(sourceHint!, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: visualButton!, exact: true })
      .click();
    await expect(page.getByText(visualHint!, { exact: true })).toBeVisible();
  });
}

test("UX110.new-thread-policy: nonreply Enter and modifier Enter retain distinct review and publication", async ({
  page,
}) => {
  const state = await open(page, false);
  await revealNavigation(page);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Excluded new thread");
  const source = page.getByRole("textbox", {
    name: "Complete source",
    exact: true,
  });
  await source.fill("Nonreply first");
  await source.press("Enter");
  await source.pressSequentially("Nonreply second");
  await source.press("Control+Enter");
  await expect(
    page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toBeVisible();
  expect(posts(state)).toHaveLength(0);
  await expect(source).toHaveValue("Nonreply first\nNonreply second");
});

for (const [structure, initial, expected, selector] of [
  ["code", "[code]First[/code]", "[code]First\nSecond[/code]", "pre"],
  [
    "table",
    "[table][tr][td]First[/td][/tr][/table]",
    "[table][tr][td]First\nSecond[/td][/tr][/table]",
    "td",
  ],
]) {
  test(`UX110.shift-enter-${structure}: visual newline stays within its existing source structure`, async ({
    page,
  }) => {
    const state = await open(page);
    await (await selectSourceEditor(page)).fill(initial!);
    await page
      .getByRole("button", { name: "Visual editor", exact: true })
      .click();
    const visual = page.getByRole("textbox", {
      name: "Visual post content",
      exact: true,
    });
    await visual.locator(selector!).first().click();
    await visual.press("Meta+ArrowRight");
    await visual.press("Shift+Enter");
    await visual.pressSequentially("Second");
    expect(posts(state)).toHaveLength(0);
    await visual.press("Enter");
    await expect(
      page.getByText(/Confirmed stored reply in thread 42/),
    ).toBeVisible();
    expect(
      new URLSearchParams(posts(state)[0]!.body ?? "").get("message"),
    ).toBe(expected);
  });
}

test("UX110.menu-dialog: native keys in settings and post menus cannot activate the retained reply", async ({
  page,
}) => {
  const state = await open(page);
  await (
    await selectSourceEditor(page)
  ).fill("Retained through menu and dialog keys");
  await openSettings(page);
  const language = page.locator("#interface-language");
  await language.focus();
  await language.press("Control+Enter");
  await language.press("Meta+Enter");
  expect(posts(state)).toHaveLength(0);
  await closeSettingsToWorkspace(page);
  await page
    .getByRole("button", { name: "Post 4201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Reply", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove reply target", exact: true }),
  ).toBeVisible();
  await expect(await selectSourceEditor(page)).toHaveValue(
    "Retained through menu and dialog keys",
  );
  expect(posts(state)).toHaveLength(0);
});

test("UX110.narrow-guidance: expanded mode guidance remains visibly reachable through existing scroll containers with retained history", async ({
  page,
}, info) => {
  const state = await open(page);
  const source = await selectSourceEditor(page);
  await source.fill("First exact history");
  await sendButton(page).click();
  await expect(
    page.getByText(/Confirmed stored reply in thread 42/),
  ).toBeVisible();
  await source.fill("Second exact history");
  await sendButton(page).click();
  await expect.poll(() => posts(state).length).toBe(2);
  // The fixture reuses its result post ID, so the second observation can be
  // uncertain rather than a second independently confirmed new post.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const attempts = JSON.parse(
          sessionStorage.getItem("tsdm.workspace.recovery")!,
        ).writing.attempts;
        return (
          attempts.length === 2 &&
          attempts.every(
            (attempt: { status: string }) => attempt.status !== "pending",
          )
        );
      }),
    )
    .toBe(true);

  const retained = "[b]Retained source[/b]\n你好";
  await source.fill(retained);
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Compact writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand writing", exact: true })
    .click();
  const hintText = "Enter: new line · Ctrl/⌘+Enter: send";
  const hint = page.getByText(hintText, { exact: true });
  const geometry = () =>
    hint.evaluate((node) => {
      const r = node.getBoundingClientRect();
      let left = Math.max(0, r.left),
        right = Math.min(innerWidth, r.right),
        top = Math.max(0, r.top),
        bottom = Math.min(innerHeight, r.bottom);
      const ancestors = [];
      for (
        let parent = node.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const box = parent.getBoundingClientRect(),
          style = getComputedStyle(parent);
        if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
        if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (style.overflowY !== "visible" || style.overflowX !== "visible")
          ancestors.push({
            class: parent.className,
            box: box.toJSON(),
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            scrollTop: parent.scrollTop,
          });
      }
      return {
        hint: r.toJSON(),
        visibleHeight: Math.max(0, bottom - top),
        visibleWidth: Math.max(0, right - left),
        ancestors,
      };
    });
  const before = await geometry();
  await hint.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      const g = await geometry();
      return g.hint.height - g.visibleHeight;
    })
    .toBeLessThanOrEqual(1);
  const after = await geometry();
  expect(after.visibleWidth).toBeGreaterThanOrEqual(after.hint.width - 1);
  await expect(source).toHaveAccessibleDescription(hintText);
  await expect(source).toHaveValue(retained);
  expect(posts(state)).toHaveLength(2);
  await info.attach("narrow-guidance-clipping.json", {
    body: JSON.stringify({ before, after, requests: state.requests }),
    contentType: "application/json",
  });
  await info.attach("narrow-guidance.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
