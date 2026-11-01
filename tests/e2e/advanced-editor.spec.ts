import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    await info.attach("failed-application.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
});
const actor = (id = "7") =>
  id === "guest"
    ? '<form id="lsform"></form>'
    : `<div id="um"><strong><a href="home.php?mod=space&uid=${id}">Writer ${id}</a></strong></div>`;
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
function form(member = "7", saved?: URLSearchParams) {
  const value = (name: string, fallback = "") =>
    escape(saved?.get(name) ?? fallback);
  return `<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script>${actor(member)}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&tid=42&pid=101" : "newthread"}&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="SECRET-CURRENT"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value="${value("subject", "Native title")}"><select name="typeid"><option value="0">No category</option><option value="3"${value("typeid") === "3" ? " selected" : ""}>Listening</option></select><textarea name="message">${value("message")}</textarea><label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1"${saved?.has("bbcodeoff") ? " checked" : ""}>Disable BBCode</label><label><input type="checkbox" name="htmlon" value="1" disabled>HTML</label><label>Thread price<input name="price" value="${value("price", "0")}"></label><label>Read permission<select name="readperm"><option value="0">Everyone</option><option value="10"${value("readperm") === "10" ? " selected" : ""}>Members</option></select></label><button type="submit" name="topicsubmit" value="yes">Publish</button></form>`;
}
async function fixture(
  page: Page,
  initialForm: (body: string) => string = (body) => body,
  nativeOnlyMention = false,
) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const state = {
    member: "7",
    outcome: "accepted",
    response: null as string | null,
    sourceGate: null as Promise<void> | null,
    postGate: null as Promise<void> | null,
    formGate: null as Promise<void> | null,
    formChange: initialForm,
    renderFailure: false,
    sourceChange: initialForm,
    threadChange: (body: string) => body,
    posts: [] as URLSearchParams[],
    requests: [] as {
      url: string;
      method: string;
      fresh: string | undefined;
    }[],
  };
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__workspace-fixture.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    state.requests.push({
      url: url.href,
      method: request.method(),
      fresh: request.headers()["cache-control"],
    });
    let body: string;
    if (url.pathname === "/plugin.php")
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: 1,
          list: [{ uid: 8, username: "Other author" }],
        }),
      });
    if (request.method() === "POST") {
      state.posts.push(new URLSearchParams(request.postData() ?? ""));
      if (state.postGate) await state.postGate;
      if (state.response)
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: state.response,
        });
      if (state.outcome === "lost") return route.abort("failed");
      if (state.outcome === "rejected") {
        state.posts.pop();
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: `<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>`,
        });
      }
      if (state.outcome === "moderation")
        return route.fulfill({
          contentType: "text/xml; charset=utf-8",
          body: `<root><![CDATA[<script>succeedhandle_post('', '主题需要审核', {});</script>]]></root>`,
        });
      if (state.outcome === "forged")
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: `<script>const untrusted = "succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'5'})";</script>`,
        });
      return route.fulfill({
        contentType: "text/xml",
        body: `<?xml version="1.0"?><root><![CDATA[<script type="text/javascript">succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'5','tid':'42','pid':'101'});</script>]]></root>`,
      });
    }
    if (url.searchParams.get("action") === "edit") {
      if (state.sourceGate) await state.sourceGate;
      body = state.sourceChange(form(state.member, state.posts.at(-1)));
    } else if (url.searchParams.get("mod") === "post") {
      if (state.formGate) await state.formGate;
      body = state.formChange(form(state.member));
    } else if (url.searchParams.get("mod") === "viewthread")
      body = `${actor(state.member)}<div id="pt"><a href="${boardURL}">Music</a></div><div id="postlist"><h1 id="thread_subject">${escape(state.posts.at(-1)?.get("subject") ?? "")}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Authoritative stored rendered post</p></div></div></div>`;
    else
      body = `${actor(state.member)}<div id="ct"><h1><a href="${boardURL}">Music</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
    if (state.renderFailure && url.searchParams.get("mod") === "viewthread")
      body = "<p>Malformed later rendering</p>";
    if (url.searchParams.get("mod") === "viewthread")
      body = state.threadChange(body);
    if (nativeOnlyMention && url.searchParams.get("mod") === "post") {
      if (!url.searchParams.has("tsdmapp"))
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body,
        });
      // The native form exposes this capability; its JSON representation omits it.
      body = body.replace(/<script>window\.ATPLUS=[^<]*<\/script>/, "");
    }
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(boardURL);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  return state;
}

async function sourceValue(page: Page) {
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  return page.getByLabel("Complete source", { exact: true }).inputValue();
}
async function visual(page: Page, value?: string) {
  if (value !== undefined) {
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await page.getByLabel("Complete source", { exact: true }).fill(value);
  }
  await page
    .getByRole("button", { name: "Visual editor", exact: true })
    .click();
  return page.getByRole("textbox", {
    name: "Visual post content",
    exact: true,
  });
}
async function operation(page: Page, name: string) {
  await page
    .getByLabel("Table operation", { exact: true })
    .selectOption({ label: name });
  await page
    .getByRole("button", { name: "Apply table operation", exact: true })
    .click();
}
test("J5.advanced-table: visual row column merge split and keyboard operations preserve complete saved source", async ({
  page,
}, info) => {
  const server = await fixture(page);
  let body = await visual(page, "");
  await page.getByLabel("Table rows", { exact: true }).fill("2");
  await page.getByLabel("Table columns", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Insert table", exact: true }).click();
  await expect(body.locator("td")).toHaveCount(4);
  await body.locator("td").nth(0).click();
  await page.keyboard.type("A");
  await page.keyboard.press("Tab");
  await page.keyboard.type("B");
  await page.keyboard.press("Tab");
  await page.keyboard.type("C");
  await page.keyboard.press("Tab");
  await page.keyboard.type("D");
  const original =
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]";
  expect(await sourceValue(page)).toBe(original);
  body = await visual(
    page,
    "[B]Before[/B]" +
      original +
      "[unknown=x]after[/unknown] [attach]99[/attach]",
  );
  await body.locator("td").nth(0).click();
  await operation(page, "Select row");
  await operation(page, "Merge cells");
  await expect(body.locator("td").first()).toHaveAttribute("colspan", "2");
  const merged =
    "[B]Before[/B][table][tr][td=2,1]A\nB[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table][unknown=x]after[/unknown] [attach]99[/attach]";
  expect(await sourceValue(page)).toBe(merged);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(
    await page.getByLabel("Complete source", { exact: true }).inputValue(),
  ).toBe(
    "[B]Before[/B]" +
      original +
      "[unknown=x]after[/unknown] [attach]99[/attach]",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  body = await visual(page);
  await body.locator("td").first().click();
  await operation(page, "Split cell");
  await expect(body.locator("td")).toHaveCount(4);
  await operation(page, "Add row after");
  await expect(body.locator("tr")).toHaveCount(3);
  await body.locator("tr").nth(1).locator("td").first().click();
  await operation(page, "Delete row");
  await expect(body.locator("tr")).toHaveCount(2);
  await operation(page, "Add column before");
  await expect(body.locator("td")).toHaveCount(6);
  await body.locator("td").first().click();
  await operation(page, "Delete column");
  await expect(body.locator("td")).toHaveCount(4);
  const expected =
    "[B]Before[/B][table][tr][td=1,1]A\nB[/td][td=1,1][/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table][unknown=x]after[/unknown] [attach]99[/attach]";
  expect(await sourceValue(page)).toBe(expected);
  server.threadChange = (body) =>
    body.replace(
      "<p>Authoritative stored rendered post</p>",
      "<p><strong>Before</strong></p><table><tr><td>A<br>B</td><td></td></tr><tr><td>C</td><td>D</td></tr></table><p>after</p>",
    );
  await page.getByLabel("Title", { exact: true }).fill("Advanced table");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts).toHaveLength(1);
  expect(server.posts[0]?.get("message")).toBe(expected);
  expect(
    server.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toHaveLength(1);
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(page.locator(".post-content table td")).toHaveCount(4);
  await expect(page.locator(".post-content")).toContainText("Before");
  await info.attach("advanced-table-source.json", {
    body: Buffer.from(
      JSON.stringify({
        expected,
        stored: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("advanced-table.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const example of [
  {
    name: "two-by-two",
    source:
      "[table][tr][td]A[/td][td]B[/td][/tr][tr][td][/td][td][/td][/tr][/table]",
    cells: 4,
    mergedRows: [1, 0],
    splitRows: [2, 2],
    merged: "[table][tr][td=2,2]A\nB[/td][/tr][tr][/tr][/table]",
    split:
      "[table][tr][td=1,1]A\nB[/td][td=1,1][/td][/tr][tr][td=1,1][/td][td=1,1][/td][/tr][/table]",
  },
  {
    name: "empty-vertical",
    source: "[table][tr][td][/td][/tr][tr][td][/td][/tr][/table]",
    cells: 2,
    mergedRows: [1, 0],
    splitRows: [1, 1],
    merged: "[table][tr][td=1,2][/td][/tr][tr][/tr][/table]",
    split: "[table][tr][td=1,1][/td][/tr][tr][td=1,1][/td][/tr][/table]",
  },
  {
    name: "horizontal-control",
    source: "[table][tr][td]A[/td][td]B[/td][/tr][/table]",
    cells: 2,
    mergedRows: [1],
    splitRows: [2],
    merged: "[table][tr][td=2,1]A\nB[/td][/tr][/table]",
    split: "[table][tr][td=1,1]A\nB[/td][td=1,1][/td][/tr][/table]",
  },
])
  test(`J5.advanced-full-rectangle-${example.name}: merge and split preserve the table grid`, async ({
    page,
  }, info) => {
    const server = await fixture(page);
    const body = await visual(page, example.source);
    await expect(body.locator("td")).toHaveCount(example.cells);
    await body.locator("td").first().click();
    await body
      .locator("td")
      .last()
      .click({ modifiers: ["Shift"] });
    await expect(body.locator(".selectedCell")).toHaveCount(example.cells);
    await operation(page, "Merge cells");
    const mergedRows = await body
      .locator("tr")
      .evaluateAll((rows) =>
        rows.map((row) => row.querySelectorAll("td,th").length),
      );
    expect.soft(mergedRows).toEqual(example.mergedRows);
    const mergedSource = await sourceValue(page);
    expect.soft(mergedSource).toBe(example.merged);
    await visual(page);
    await body.locator("td").first().click();
    await operation(page, "Split cell");
    const splitRows = await body
      .locator("tr")
      .evaluateAll((rows) =>
        rows.map((row) => row.querySelectorAll("td,th").length),
      );
    expect.soft(splitRows).toEqual(example.splitRows);
    const splitSource = await sourceValue(page);
    expect.soft(splitSource).toBe(example.split);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect.soft(await sourceValue(page)).toBe(example.merged);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    expect.soft(await sourceValue(page)).toBe(example.split);
    expect(server.posts).toHaveLength(0);
    await info.attach("whole-table-grid.json", {
      body: Buffer.from(
        JSON.stringify({
          expected: example,
          mergedRows,
          mergedSource,
          splitRows,
          splitSource,
          publishedCommands: server.posts.length,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach("whole-table-grid.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

test("J5.advanced-covered-empty-row: valid rowspan source remains editable through import and reload", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const cases = [
    "[table][tr][td=1,2]A[/td][/tr][tr][/tr][/table]",
    "[table][tr][td=2,2]A\nB[/td][/tr][tr] \n[/tr][/table]",
  ];
  const observed = [];
  for (const original of cases) {
    let body = await visual(page, original);
    await expect(body.locator("table")).toHaveCount(1);
    await expect(body.locator("tr")).toHaveCount(2);
    await expect(body.locator("td")).toHaveCount(1);
    await expect(body.locator("td")).toHaveAttribute("rowspan", "2");
    expect(await sourceValue(page)).toBe(original);
    await page.reload();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(original);
    body = await visual(page);
    await expect(body.locator("table")).toHaveCount(1);
    await expect(body.locator("tr")).toHaveCount(2);
    await expect(body.locator("td")).toHaveCount(1);
    await body.locator("td").click();
    await operation(page, "Split cell");
    await expect(body.locator("td")).toHaveCount(
      original.includes("td=2,2") ? 4 : 2,
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    const restored = await sourceValue(page);
    expect(restored).toBe(original);
    observed.push({ original, restored });
  }
  expect(server.posts).toHaveLength(0);
  await info.attach("covered-empty-row-roundtrip.json", {
    body: Buffer.from(
      JSON.stringify({ observed, publishedCommands: server.posts.length }),
    ),
    contentType: "application/json",
  });
  await info.attach("covered-empty-row-roundtrip.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-hidden: nested spoilers and reply-to-view blocks retain source through undo and saved readback", async ({
  page,
}, info) => {
  const server = await fixture(page);
  await page.getByLabel("Complete source", { exact: true }).fill("Secret");
  await page.getByLabel("Complete source", { exact: true }).selectText();
  await page
    .getByLabel("Complete source", { exact: true })
    .dispatchEvent("select");
  await page.getByLabel("Formatting", { exact: true }).selectOption("spoiler");
  await page.getByLabel("Format value", { exact: true }).fill("Reveal");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  expect(await sourceValue(page)).toBe("[spoiler=Reveal]Secret[/spoiler]");
  let body = await visual(page);
  await body.locator("p").first().click();
  await page.getByLabel("Formatting", { exact: true }).selectOption("hide");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  await expect(body.locator('[data-editor-section="hide"]')).toBeVisible();
  await expect(body.locator('[data-editor-section="spoiler"]')).toBeVisible();
  const expected = "[spoiler=Reveal][hide]Secret[/hide][/spoiler]";
  expect(await sourceValue(page)).toBe(expected);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[spoiler=Reveal]Secret[/spoiler]",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  body = await visual(page);
  await body.locator("p").first().click();
  await page.getByLabel("Formatting", { exact: true }).selectOption("unwrap");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  expect(await sourceValue(page)).toBe("[spoiler=Reveal]Secret[/spoiler]");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Hidden content");
  server.threadChange = (body) =>
    body.replace(
      "<p>Authoritative stored rendered post</p>",
      '<div class="spoiler"><div class="spoilerheader"><input class="spoilerbutton" type="button" value="Reveal"></div><div class="spoilerbody"><div class="locked">Reply to view</div></div></div>',
    );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(expected);
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(page.locator(".post-content")).toContainText("Reveal");
  await info.attach("hidden-source.json", {
    body: Buffer.from(
      JSON.stringify({
        expected,
        stored: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("hidden.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-grid-guard: malformed and unknown grids are preserved without automatic repair", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const cases = [
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][/tr][/table]",
    "[table][tr][td=2,2]A[/td][td]B[/td][/tr][tr][td=2,1]C[/td][/tr][/table]",
    "[table][tr][td=wrong]A[/td][/tr][/table]",
    "[table][tr][td colspan=two]A[/td][/tr][/table]",
    "[table][tr][td]A[/td]bad[/tr][/table]",
    "[table][tr][td]A[/td][/table]",
    "[table][tr][td]A[/td][/tr][tr][/tr][/table]",
    "[table][tr][/tr][/table]",
    "[table][/table]",
  ];
  for (const table of cases) {
    const original =
      "[B]Before[/B]" + table + "[unknown]after[/unknown] [attach]99[/attach]";
    const body = await visual(page, original);
    await expect(
      page.getByText(
        "Some markup is protected in visual mode. Edit its complete source to change it.",
      ),
    ).toBeVisible();
    await expect(body.locator("table")).toHaveCount(0);
    expect(await sourceValue(page)).toBe(original);
  }
  const nested =
    "[table][tr][td]A[table][tr][td]inner[/td][/tr][/table][/td][/tr][/table]";
  const body = await visual(page, nested);
  await expect(body.locator("table")).toHaveCount(2);
  expect(await sourceValue(page)).toBe(nested);
  await visual(page, "[B]unaffected[/B]");
  await operation(page, "Merge cells");
  await expect(
    page.getByText(
      "Select a table cell or a rectangular group of cells for this operation.",
    ),
  ).toBeVisible();
  expect(await sourceValue(page)).toBe("[B]unaffected[/B]");
  await page.getByLabel("Table rows", { exact: true }).fill("21");
  await page.getByRole("button", { name: "Insert table", exact: true }).click();
  await expect(page.getByText("Choose 1–20 rows and columns.")).toBeVisible();
  expect(await sourceValue(page)).toBe("[B]unaffected[/B]");
  expect(server.posts).toHaveLength(0);
  await info.attach("grid-guard.json", {
    body: Buffer.from(
      JSON.stringify({ cases, nested, commands: server.posts.length }),
    ),
    contentType: "application/json",
  });
  await info.attach("grid-guard.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const scenario of [
  "available",
  "login-disabled",
  "use-disabled",
  "external-endpoint",
  "account-before",
  "account-after",
] as const) {
  test(`J5.advanced-mention-native-form: ${scenario} uses current native capability without weakening guards`, async ({
    page,
  }, info) => {
    const server = await fixture(page, (body) => body, true);
    const source =
      "Authored mention representation regression. Plain @text stays plain.";
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", {
        name: "Check current account and form",
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    const before = server.requests.length;
    server.formChange = (body) => {
      if (scenario === "login-disabled")
        return body.replace('"login":1', '"login":0');
      if (scenario === "use-disabled")
        return body.replace('"use":1', '"use":0');
      if (scenario === "external-endpoint")
        return body.replace(
          '"api":"plugin.php',
          '"api":"https://untrusted.invalid/plugin.php',
        );
      if (
        scenario === "account-before" ||
        (scenario === "account-after" &&
          server.requests.some(
            (request) => new URL(request.url).pathname === "/plugin.php",
          ))
      )
        return body.replace(actor(), actor("9"));
      return body;
    };
    await page
      .getByLabel("Find a person to mention", { exact: true })
      .fill("Other author");
    await page
      .getByRole("button", { name: "Find mention", exact: true })
      .click();
    const person = page.getByRole("button", {
      name: "Mention Other author (UID 8)",
      exact: true,
    });
    try {
      if (scenario === "available") {
        await expect(person).toBeVisible();
        await expect(
          page.getByText(
            "The current forum mention service could not resolve this person. Plain text was preserved.",
            { exact: true },
          ),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Review publication", exact: true }),
        ).toBeEnabled();
      } else {
        await expect(
          page.getByText(
            scenario.startsWith("account-")
              ? "The account changed during mention lookup. Resolve the person again."
              : "The current forum mention service could not resolve this person. Plain text was preserved.",
            { exact: true },
          ),
        ).toBeVisible();
        await expect(person).toHaveCount(0);
      }
      await expect(
        page.getByLabel("Complete source", { exact: true }),
      ).toHaveValue(source);
      const requests = server.requests.slice(before);
      const reachesLookup =
        scenario === "available" || scenario === "account-after";
      expect(
        requests.map((request) => ({
          url: request.url,
          method: request.method,
        })),
      ).toEqual([
        {
          url: `${origin}/forum.php?mod=post&action=newthread&fid=5`,
          method: "GET",
        },
        ...(reachesLookup
          ? [
              { url: `${origin}/plugin.php?id=atplus:search`, method: "POST" },
              {
                url: `${origin}/forum.php?mod=post&action=newthread&fid=5`,
                method: "GET",
              },
            ]
          : []),
      ]);
      expect(
        server.requests
          .slice(0, before)
          .filter(
            (request) =>
              new URL(request.url).searchParams.get("mod") === "post",
          )
          .map((request) => new URL(request.url).searchParams.get("tsdmapp")),
      ).toEqual(["json", "json"]);
      expect(server.posts).toHaveLength(0);
    } finally {
      await info.attach("native-mention-capability.json", {
        body: Buffer.from(
          JSON.stringify({
            scenario,
            requests: server.requests,
            authoringCommands: server.posts.length,
            source: await sourceValue(page),
          }),
        ),
        contentType: "application/json",
      });
      await info.attach("native-mention-capability.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
  });
}

test("J5.advanced-mention: resolved visual insertion preserves formatted caret and undo redo before authoritative source readback", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const body = await visual(page, "[b]AB[/b] literal @Other author");
  await body.locator("p").click();
  await info.attach("caret-before.json", {
    body: Buffer.from(
      JSON.stringify(
        await body.evaluate((el) => ({
          platform: navigator.platform,
          focus: (el.getRootNode() as ShadowRoot).activeElement?.outerHTML,
          selection: document.getSelection()?.toString(),
          recovery: JSON.parse(
            sessionStorage.getItem("tsdm.workspace.recovery")!,
          ).writing.selection,
        })),
      ),
    ),
    contentType: "application/json",
  });
  await body.press("ArrowLeft");
  await body.press("Meta+ArrowLeft");
  await body.press("ArrowRight");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .selection.start,
      ),
    )
    .toBe(4);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  const expected = "[b]A@\u2063Other author\u2063 B[/b] literal @Other author";
  expect(await sourceValue(page)).toBe(expected);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "[b]AB[/b] literal @Other author",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  expect(await sourceValue(page)).toBe(expected);
  await page.getByLabel("Title", { exact: true }).fill("Visual mention");
  server.threadChange = (body) =>
    body.replace(
      "<p>Authoritative stored rendered post</p>",
      '<p><strong>A<a href="home.php?mod=space&uid=8">@Other author</a> B</strong> literal @Other author</p>',
    );
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts).toHaveLength(1);
  expect(server.posts[0]?.get("message")).toBe(expected);
  expect(server.posts[0]?.has("reppid")).toBe(false);
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(
    page
      .locator(".post-content")
      .getByRole("link", { name: "@Other author", exact: true }),
  ).toHaveAttribute("href", /uid=8/);
  await info.attach("visual-mention-source.json", {
    body: Buffer.from(
      JSON.stringify({
        expected,
        stored: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("visual-mention.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-table-inventory: row before column after column selection and whole table removal preserve native widths", async ({
  page,
}, info) => {
  await fixture(page);
  const original =
    "[TABLE=80%]\r\n[TR][TD=2,1,45%]Wide[/TD][/TR]\r\n[TR][TD]C[/TD][TD]D[/TD][/TR]\r\n[/TABLE]";
  let body = await visual(page, original);
  await expect(body.locator("td").first()).toHaveAttribute("colspan", "2");
  expect(await sourceValue(page)).toBe(original.replaceAll("\r\n", "\n"));
  body = await visual(page);
  await body.locator("td").first().click();
  await operation(page, "Split cell");
  expect(await sourceValue(page)).toContain("[TD=1,1,45%]Wide[/TD]");
  body = await visual(page);
  await body.locator("td").first().click();
  await operation(page, "Add row before");
  await expect(body.locator("tr")).toHaveCount(3);
  await body.locator("tr").first().locator("td").first().click();
  await operation(page, "Delete row");
  await body.locator("td").first().click();
  await operation(page, "Add column after");
  await expect(body.locator("td")).toHaveCount(6);
  await body.locator("td").nth(1).click();
  await operation(page, "Select column");
  await expect(body.locator(".selectedCell")).toHaveCount(2);
  await operation(page, "Delete column");
  await expect(body.locator("td")).toHaveCount(4);
  const beforeDelete = await sourceValue(page);
  body = await visual(page);
  await body.locator("td").first().click();
  await operation(page, "Select table");
  await expect(body.locator(".selectedCell")).toHaveCount(4);
  await operation(page, "Delete table");
  await expect(body.locator("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await sourceValue(page)).toBe(beforeDelete);
  await info.attach("table-inventory.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        beforeDelete,
        restored: await sourceValue(page),
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("table-inventory.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-appearance-composition: long nested content survives Compact boundary view replacement and composition guards", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const content =
    "[spoiler=Long][hide][table][tr][td][size=4]" +
    "長文".repeat(3000) +
    "[/size][/td][td]第二格[/td][/tr][/table][/hide][/spoiler]";
  let body = await visual(page, content);
  const at100 = await body
    .locator("td span")
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(at100).toBe("19px");
  const geometry = [];
  for (const size of [90, 100, 120]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Text size", { exact: true }).fill(String(size));
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(body.locator("td span").first()).toHaveCSS(
      "font-size",
      `${(19 * size) / 100}px`,
    );
    const spacing = await page
      .locator("#tsdm-workspace")
      .getAttribute("data-spacing");
    expect(spacing).toBe(size < 100 ? "compact" : "default");
    expect(await sourceValue(page)).toBe(content);
    body = await visual(page);
    geometry.push({ size, spacing });
  }
  for (const width of [390, 960, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", { name: "Insert table", exact: true }),
    ).toBeVisible();
    expect(await sourceValue(page)).toBe(content);
    body = await visual(page);
  }
  await body.locator("td").last().click();
  await body.dispatchEvent("compositionstart", { data: "中" });
  await expect(
    page.getByRole("button", { name: "Insert table", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Apply formatting", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(body).toBeVisible();
  await body.dispatchEvent("compositionend", { data: "中" });
  await expect(body).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  expect(await sourceValue(page)).toBe(content);
  expect(server.posts).toHaveLength(0);
  await info.attach("advanced-appearance.json", {
    body: Buffer.from(
      JSON.stringify({
        geometry,
        sourceLength: content.length,
        syntheticCompositionOnly: true,
        sourcePreserved: true,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("advanced-appearance.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-mention-structure: replacing selected cells with a resolved mention keeps table boundaries", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const body = await visual(
    page,
    "[table][tr][td]A[/td][td]B[/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]",
  );
  await body.locator("td").first().click();
  await operation(page, "Select row");
  await expect(body.locator(".selectedCell")).toHaveCount(2);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  const expected =
    "[table][tr][td][/td][td]@\u2063Other author\u2063 [/td][/tr][tr][td]C[/td][td]D[/td][/tr][/table]";
  expect(await sourceValue(page)).toBe(expected);
  await visual(page);
  await expect(body.locator("td")).toHaveCount(4);
  await page.getByLabel("Title", { exact: true }).fill("Mention in table");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(expected);
  await info.attach("mention-structure.json", {
    body: Buffer.from(
      JSON.stringify({ expected, stored: server.posts[0]?.get("message") }),
    ),
    contentType: "application/json",
  });
});

test("J5.advanced-mention-crlf: source-mode resolved mention uses displayed caret without corrupting retained CRLF", async ({
  page,
}, info) => {
  const original = "[hide]one\r\ntwo[/hide]";
  const server = await fixture(page, (body) =>
    body.replace(
      '<textarea name="message"></textarea>',
      `<textarea name="message">${escape(original).replaceAll("\r", "&#13;")}</textarea>`,
    ),
  );
  server.sourceChange = (body) => body.replaceAll("\r", "&#13;");
  const source = page.getByLabel("Complete source", { exact: true });
  await source.selectText();
  await source.press("ArrowRight");
  await expect
    .poll(() =>
      source.evaluate((el) => (el as HTMLTextAreaElement).selectionStart),
    )
    .toBe(original.length - 1);
  await page
    .getByLabel("Find a person to mention", { exact: true })
    .fill("Other author");
  await page.getByRole("button", { name: "Find mention", exact: true }).click();
  await page
    .getByRole("button", { name: "Mention Other author (UID 8)", exact: true })
    .click();
  const expected = original + "@\u2063Other author\u2063 ";
  await expect(source).toHaveValue(expected.replaceAll("\r\n", "\n"));
  await page.getByLabel("Title", { exact: true }).fill("Mention after CRLF");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(expected);
  await info.attach("mention-crlf.json", {
    body: Buffer.from(
      JSON.stringify({ expected, stored: server.posts[0]?.get("message") }),
    ),
    contentType: "application/json",
  });
});

test("J5.advanced-rectangle: pointer rectangular merge retains vertical spans and unaffected saved cells", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const original =
    "[table][tr][td]A[/td][td]B[/td][td]C[/td][/tr][tr][td]D[/td][td]E[/td][td]F[/td][/tr][tr][td]G[/td][td]H[/td][td]I[/td][/tr][/table]";
  const body = await visual(page, original);
  await body.locator("td").nth(4).click();
  await body
    .locator("td")
    .nth(8)
    .click({ modifiers: ["Shift"] });
  await expect(body.locator(".selectedCell")).toHaveCount(4);
  await operation(page, "Merge cells");
  await expect(body.locator('td[colspan="2"][rowspan="2"]')).toHaveCount(1);
  const expected =
    "[table][tr][td]A[/td][td]B[/td][td]C[/td][/tr][tr][td]D[/td][td=2,2]E\nF\nH\nI[/td][/tr][tr][td]G[/td][/tr][/table]";
  expect(await sourceValue(page)).toBe(expected);
  await visual(page);
  await body.locator('td[rowspan="2"]').click();
  await operation(page, "Split cell");
  await expect(body.locator("td")).toHaveCount(9);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await sourceValue(page)).toBe(expected);
  server.threadChange = (body) =>
    body.replace(
      "<p>Authoritative stored rendered post</p>",
      '<table><tr><td>A</td><td>B</td><td>C</td></tr><tr><td>D</td><td colspan="2" rowspan="2">E<br>F<br>H<br>I</td></tr><tr><td>G</td></tr></table>',
    );
  await page.getByLabel("Title", { exact: true }).fill("Rectangle merge");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(server.posts[0]?.get("message")).toBe(expected);
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(
    page.locator('.post-content td[colspan="2"][rowspan="2"]'),
  ).toHaveText("EFHI");
  await info.attach("rectangle-source.json", {
    body: Buffer.from(
      JSON.stringify({
        expected,
        stored: server.posts[0]?.get("message"),
        requests: server.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("rectangle.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-spoiler-title: empty title uses native named syntax and unsafe title conversion is refused without source loss", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const body = await visual(page, "Secret");
  await body.locator("p").click();
  await page.getByLabel("Formatting", { exact: true }).selectOption("spoiler");
  await page.getByLabel("Format value", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  expect(await sourceValue(page)).toBe("[spoiler=Spoiler]Secret[/spoiler]");
  await visual(page);
  await body.locator("p").click();
  await page.getByLabel("Format value", { exact: true }).fill("bad]title");
  await page
    .getByRole("button", { name: "Apply formatting", exact: true })
    .click();
  await expect(
    page.getByText("This attribute cannot be represented safely."),
  ).toBeVisible();
  expect(await sourceValue(page)).toBe("[spoiler=Spoiler]Secret[/spoiler]");
  expect(server.posts).toHaveLength(0);
  await info.attach("spoiler-refusal.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J5.advanced-language-change: existing hidden boundaries and table refusals follow interface language without changing source", async ({
  page,
}, info) => {
  const server = await fixture(page);
  const original =
    "[spoiler=Named][hide]秘密[/hide][/spoiler] [unknown]保留[/unknown]";
  await visual(page, original);
  const locales = [
    {
      language: "zh-CN",
      spoiler: "折叠内容: Named",
      hide: "回复可见隐藏内容",
      rows: "表格行数",
      insert: "插入表格",
      invalid: "请选择 1–20 行和列。",
      source: "源码编辑",
      content: "完整源码",
    },
    {
      language: "zh-TW",
      spoiler: "折疊內容: Named",
      hide: "回覆可見隱藏內容",
      rows: "表格列數",
      insert: "插入表格",
      invalid: "請選擇 1–20 列和欄。",
      source: "原始碼編輯",
      content: "完整原始碼",
    },
    {
      language: "en",
      spoiler: "Spoiler: Named",
      hide: "Reply-to-view hidden block",
      rows: "Table rows",
      insert: "Insert table",
      invalid: "Choose 1–20 rows and columns.",
      source: "Source editor",
      content: "Complete source",
    },
  ];
  let settings = "Settings";
  for (const locale of locales) {
    await page.getByRole("button", { name: settings, exact: true }).click();
    await page.locator("#interface-language").selectOption(locale.language);
    await page.keyboard.press("Escape");
    settings =
      locale.language === "en"
        ? "Settings"
        : locale.language === "zh-CN"
          ? "设置"
          : "設定";
    await expect(
      page.getByRole("group", { name: locale.spoiler, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: locale.hide, exact: true }),
    ).toBeVisible();
    await page.getByLabel(locale.rows, { exact: true }).fill("0");
    await page
      .getByRole("button", { name: locale.insert, exact: true })
      .click();
    await expect(page.getByText(locale.invalid, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: locale.source, exact: true })
      .click();
    await expect(page.getByLabel(locale.content, { exact: true })).toHaveValue(
      original,
    );
    const visualLabel =
      locale.language === "en"
        ? "Visual editor"
        : locale.language === "zh-CN"
          ? "可视编辑"
          : "視覺編輯";
    await page.getByRole("button", { name: visualLabel, exact: true }).click();
    expect(server.posts).toHaveLength(0);
    await info.attach(`advanced-${locale.language}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await info.attach("advanced-locales.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        requests: server.requests,
        posts: server.posts.length,
      }),
    ),
    contentType: "application/json",
  });
});

for (const list of [
  {
    kind: "unordered",
    original:
      "[B]Before[/B][list][*]First[*]Second[*]Third[/list][unknown=x]after[/unknown] [attach]99[/attach]",
    nested:
      "[B]Before[/B][list][*]First[list][*]Second[/list][*]Third[/list][unknown=x]after[/unknown] [attach]99[/attach]",
    tag: "ul",
    rendered: "<ul><li>First<ul><li>Second</li></ul></li><li>Third</li></ul>",
  },
  {
    kind: "ordered",
    original:
      "[B]Before[/B][list=1][*]First[*]Second[*]Third[/list][unknown=x]after[/unknown] [attach]99[/attach]",
    nested:
      "[B]Before[/B][list=1][*]First[list=1][*]Second[/list][*]Third[/list][unknown=x]after[/unknown] [attach]99[/attach]",
    tag: "ol",
    rendered: "<ol><li>First<ol><li>Second</li></ol></li><li>Third</li></ol>",
  },
]) {
  test(`J5.advanced-list-nesting-${list.kind}: indent and outdent retain surrounding source and history through independent saved readback`, async ({
    page,
  }, info) => {
    const server = await fixture(page);
    const command = async (name: string) => {
      await page
        .getByLabel("Formatting", { exact: true })
        .selectOption({ label: name });
      await page
        .getByRole("button", { name: "Apply formatting", exact: true })
        .click();
    };
    let body = await visual(page, list.original);
    await body
      .locator("li")
      .nth(1)
      .getByText("Second", { exact: true })
      .click();
    await command("Indent list");
    await expect(body.locator(`${list.tag} ${list.tag} li`)).toHaveText(
      "Second",
    );
    expect(await sourceValue(page)).toBe(list.nested);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect(await sourceValue(page)).toBe(list.original);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    expect(await sourceValue(page)).toBe(list.nested);
    body = await visual(page);
    await body
      .locator(`${list.tag} ${list.tag} li`)
      .getByText("Second", { exact: true })
      .click();
    await command("Outdent list");
    await expect(body.locator(`${list.tag} ${list.tag}`)).toHaveCount(0);
    await expect(body.locator("li")).toHaveCount(3);
    expect(await sourceValue(page)).toBe(list.original);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect(await sourceValue(page)).toBe(list.nested);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    expect(await sourceValue(page)).toBe(list.original);
    body = await visual(page);
    await body
      .locator("li")
      .nth(1)
      .getByText("Second", { exact: true })
      .click();
    await command("Indent list");
    expect(await sourceValue(page)).toBe(list.nested);
    server.threadChange = (html) =>
      html.replace(
        "<p>Authoritative stored rendered post</p>",
        `<p><strong>Before</strong></p>${list.rendered}<p>after</p>`,
      );
    await page
      .getByLabel("Title", { exact: true })
      .fill(`${list.kind} nesting`);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
    expect(server.posts).toHaveLength(1);
    expect(server.posts[0]?.get("message")).toBe(list.nested);
    expect(
      server.requests.filter(
        (request) => new URL(request.url).searchParams.get("action") === "edit",
      ),
    ).toHaveLength(1);
    await page
      .getByRole("link", { name: "Open confirmed thread", exact: true })
      .click();
    await expect(
      page.locator(`.post-content ${list.tag} ${list.tag} li`),
    ).toHaveText("Second");
    await expect(page.locator(".post-content")).toContainText("Before");
    await info.attach(`list-${list.kind}-source.json`, {
      body: Buffer.from(
        JSON.stringify({
          original: list.original,
          expected: list.nested,
          stored: server.posts[0]?.get("message"),
          requests: server.requests,
        }),
      ),
      contentType: "application/json",
    });
    await info.attach(`list-${list.kind}.png`, {
      body: await page.locator(".post-content").screenshot(),
      contentType: "image/png",
    });
  });
}

for (const scenario of [
  {
    name: "spoiler",
    source: "[spoiler=X]AB[/spoiler]",
    text: "AB",
    offset: 1,
    title: "X",
  },
  {
    name: "hide",
    source: "[hide]AB[/hide]",
    text: "AB",
    offset: 1,
    title: null,
  },
  {
    name: "nested-table",
    source:
      "[spoiler=Current qualification][hide][table][tr][td]中文[/td][td]短語[/td][/tr][tr][td]Third[/td][td]Fourth[/td][/tr][/table][/hide][/spoiler]\n" +
      "[list][*]中文項目[*]Latin item[/list]\n" +
      "[quote=Author]Complete quotation[/quote]\n" +
      "[unfamiliar=x]Original & <literal>[/unfamiliar] [attach]77[/attach]\n" +
      "LongLatinTokenABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n" +
      "Source input: 測試輸入",
    text: "中文",
    offset: 2,
    title: "Current qualification",
  },
]) {
  test(`J5.advanced-language-caret-${scenario.name}: locale changes preserve native caret and subsequent editing`, async ({
    page,
  }, info) => {
    const server = await fixture(page);
    const body = await visual(page, scenario.source);
    if (scenario.name === "nested-table")
      await body.locator("td").first().click();
    else await body.getByText(scenario.text, { exact: true }).click();
    await page.keyboard.press("End");
    for (let index = scenario.offset; index < scenario.text.length; index++)
      await page.keyboard.press("ArrowLeft");
    // Observe the active native selection; a hidden textarea is not its oracle.
    const caret = () =>
      page.locator(".ProseMirror").evaluate((element) => {
        const root = element.getRootNode();
        const selection =
          root instanceof ShadowRoot && "getSelection" in root
            ? (
                root as ShadowRoot & { getSelection(): Selection | null }
              ).getSelection()
            : window.getSelection();
        const anchor = selection?.anchorNode;
        const cell = anchor?.parentElement?.closest("td,th");
        return {
          text: anchor?.textContent,
          offset: selection?.anchorOffset,
          collapsed: selection?.isCollapsed,
          cell: cell
            ? Array.from(cell.parentElement!.children).indexOf(cell)
            : null,
        };
      });
    const expectedCaret = {
      text: scenario.text,
      offset: scenario.offset,
      collapsed: true,
      cell: scenario.name === "nested-table" ? 0 : null,
    };
    expect(await caret(), "ordinary keyboard setup").toEqual(expectedCaret);
    const observations = [];
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    for (const locale of [
      { language: "zh-TW", spoiler: "折疊內容", hide: "回覆可見隱藏內容" },
      {
        language: "en",
        spoiler: "Spoiler",
        hide: "Reply-to-view hidden block",
      },
    ]) {
      await page.locator("#interface-language").selectOption(locale.language);
      if (scenario.title)
        await expect(
          page.getByRole("group", {
            name: `${locale.spoiler}: ${scenario.title}`,
            exact: true,
          }),
        ).toBeAttached();
      if (scenario.name !== "spoiler")
        await expect(
          page.getByRole("group", { name: locale.hide, exact: true }),
        ).toBeAttached();
      const current = await caret();
      observations.push({ language: locale.language, caret: current });
      expect
        .soft(current, `active native caret after ${locale.language}`)
        .toEqual(expectedCaret);
    }
    await page.keyboard.press("Escape");
    expect(await sourceValue(page)).toBe(scenario.source);
    const mapped = await page
      .getByLabel("Complete source", { exact: true })
      .evaluate((element: HTMLTextAreaElement) => ({
        start: element.selectionStart,
        end: element.selectionEnd,
      }));
    const position = scenario.source.indexOf(scenario.text) + scenario.offset;
    expect
      .soft(mapped, "actual source-mode selection")
      .toEqual({ start: position, end: position });
    await visual(page);
    await page.keyboard.type("Z");
    const edited =
      scenario.source.slice(0, position) +
      "Z" +
      scenario.source.slice(position);
    expect
      .soft(
        await sourceValue(page),
        "ordinary content mutation after language changes",
      )
      .toBe(edited);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect
      .soft(await sourceValue(page), "undo restores exact original source")
      .toBe(scenario.source);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    expect
      .soft(await sourceValue(page), "redo restores exact edited source")
      .toBe(edited);
    expect(server.posts).toHaveLength(0);
    await info.attach("language-caret.json", {
      body: Buffer.from(
        JSON.stringify(
          {
            scenario,
            observations,
            mapped,
            edited,
            commands: server.posts.length,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
    await info.attach("language-caret.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
