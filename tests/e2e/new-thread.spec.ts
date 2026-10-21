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
const source =
  "[unknown=v3]完整來源 & literal <tag>[/unknown]\n[table][tr][td]retained[/td][/tr][/table] [url=https://example.test]link[/url]";
function form(member = "7", saved?: URLSearchParams) {
  const value = (name: string, fallback = "") =>
    escape(saved?.get(name) ?? fallback);
  return `${actor(member)}<div id="pt"><a href="${boardURL}">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=${saved ? "edit&tid=42&pid=101" : "newthread"}&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="SECRET-CURRENT"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value="${value("subject", "Native title")}"><select name="typeid"><option value="0">No category</option><option value="3"${value("typeid") === "3" ? " selected" : ""}>Listening</option></select><textarea name="message">${value("message")}</textarea><label><input type="checkbox" name="usesig" value="1"${saved && !saved.has("usesig") ? "" : " checked"}>Signature</label><label><input type="checkbox" name="bbcodeoff" value="1"${saved?.has("bbcodeoff") ? " checked" : ""}>Disable BBCode</label><label><input type="checkbox" name="htmlon" value="1" disabled>HTML</label><label>Thread price<input name="price" value="${value("price", "0")}"></label><label>Read permission<select name="readperm"><option value="0">Everyone</option><option value="10"${value("readperm") === "10" ? " selected" : ""}>Members</option></select></label><button type="submit" name="topicsubmit" value="yes">Publish</button></form>`;
}
async function fixture(
  page: Page,
  initialForm: (body: string) => string = (body) => body,
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
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ document: body }),
    });
  });
  await page.goto(boardURL);
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  return state;
}
test("J4.publish-current: publish complete source/current options once and independently confirm actor/source/options", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Ordinary complete source");
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page.getByLabel("Category", { exact: true }).selectOption("3");
  await page.getByLabel("Signature", { exact: true }).uncheck();
  await page.getByLabel("Disable BBCode", { exact: true }).check();
  await page.getByLabel("Thread price", { exact: true }).fill("2");
  await page.getByLabel("Read permission", { exact: true }).selectOption("10");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(page.getByText(/Review revision/)).toBeVisible();
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    subject: "Ordinary complete source",
    message: source,
    typeid: "3",
    price: "2",
    readperm: "10",
    bbcodeoff: "1",
    formhash: "SECRET-CURRENT",
    posttime: "1792550000",
    wysiwyg: "0",
  });
  expect(state.posts[0]!.has("usesig")).toBe(false);
  expect(state.posts[0]!.has("htmlon")).toBe(false);
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toHaveLength(1);
  const stored = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(stored).not.toContain("SECRET-CURRENT");
  expect(stored).toContain('"status":"confirmed"');
  await info.attach("publication.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("server-state.json", {
    body: Buffer.from(
      JSON.stringify({
        posts: state.posts.map((p) => Object.fromEntries(p)),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
});

async function review(page: Page) {
  await page.getByLabel("Title", { exact: true }).fill("Attempt recovery");
  await page.getByLabel("Complete source", { exact: true }).fill(source);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Publish thread", exact: true }),
  ).toBeVisible();
}

// Native semantic failures captured before the 0.4 contract repair: creation
// directives are not persistent edit fields, and empty price may be stored0.
const creationDirectives =
  '<label><input type="checkbox" name="addfeed" value="1" checked>Publish activity</label><label><input type="checkbox" name="adddynamic" value="true" checked>Share with followers</label><label><input type="checkbox" name="adddynamic_doing" value="true">Ask followers to share</label>';
const nativeCreation = (body: string) =>
  body
    .replace('name="price" value="0"', 'name="price" value=""')
    .replace("</form>", `${creationDirectives}</form>`);
const nativeStored = (body: string) =>
  body.replace('name="price" value=""', 'name="price" value="0"');
const emptySuffixCallback =
  "<root><![CDATA[<script>if(typeof succeedhandle_=='function'){succeedhandle_('forum.php?mod=viewthread&tid=42', 'Stored', {'fid':'5','tid':'42','pid':'101','feedid':'77'});}</script>]]></root>";
// Review failure inventory: disabled blank price is omitted by the actual
// serializer, so stored0 cannot prove normalization of a submitted blank.
// Equal disabled values remain comparable; invented normalization must not
// become trusted merely by persisting it in an otherwise valid recovery record.
const disabledBlankPrice = (body: string) =>
  body.replace('name="price" value="0"', 'name="price" value="" disabled');

test("J4.disabled-blank-price: omitted price cannot qualify stored zero normalization", async ({
  page,
}, info) => {
  const state = await fixture(page, disabledBlankPrice);
  state.sourceChange = (body) =>
    body.replace('name="price" value="0"', 'name="price" value="0" disabled');
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .attempts[0].status,
      ),
    )
    .not.toBe("pending");
  const attempt = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await info.attach("disabled-blank-price.json", {
    body: Buffer.from(
      JSON.stringify({
        attempt,
        posts: state.posts.map((p) => [...p]),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
  await info.attach("disabled-blank-price.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.has("price")).toBe(false);
  expect(
    attempt.publication.submission.writing.options.find(
      (o: { name: string }) => o.name === "price",
    ),
  ).toMatchObject({ value: "", disabled: true });
  expect(attempt.status).toBe("uncertain");
  expect(attempt.result).toBeNull();
  await expect(
    page.getByText(/Complete stored source or offered options did not match/),
  ).toBeVisible();
  await expect(
    page.getByText(/normalized from an empty submitted value/),
  ).toHaveCount(0);
});

test("J5.disabled-blank-price-recovery: equal disabled value survives reload but invented normalization remains inspectable", async ({
  page,
}, info) => {
  const state = await fixture(page, disabledBlankPrice);
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  expect(original.result.verification.normalizations).toEqual([]);
  expect(state.posts[0]!.has("price")).toBe(false);
  await page.reload();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  const malformed = await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!);
    raw.writing.attempts[0].result.verification.normalizations = [
      { name: "price", submitted: "", stored: "0" },
    ];
    const value = JSON.stringify(raw);
    sessionStorage.setItem("tsdm.workspace.recovery", value);
    return value;
  });
  await info.attach("disabled-blank-price-recovery.json", {
    body: Buffer.from(
      JSON.stringify({
        original,
        malformed,
        posts: state.posts.map((p) => [...p]),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
  await page.reload();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Inspect retained recovery data",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Retained recovery data", { exact: true }),
  ).toHaveValue(malformed);
  expect(state.posts).toHaveLength(1);
  await info.attach("disabled-blank-price-recovery.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J4.native-stored-effects: normalized stored publication retains original command and unknown creation effects", async ({
  page,
}, info) => {
  const state = await fixture(page, nativeCreation);
  state.sourceChange = nativeStored;
  state.response = emptySuffixCallback;
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  await expect(
    page.getByText(
      "Stored price: 0 (normalized from an empty submitted value).",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Delivery unverified", { exact: true }),
  ).toHaveCount(2);
  await expect(page.getByText("Not requested", { exact: true })).toHaveCount(1);
  const attempt = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  expect(attempt.result.verification).toEqual({
    stored: "verified",
    normalizations: [{ name: "price", submitted: "", stored: "0" }],
    creationEffects: [
      { name: "addfeed", requested: true, included: true, outcome: "unknown" },
      {
        name: "adddynamic",
        requested: true,
        included: true,
        outcome: "unknown",
      },
      {
        name: "adddynamic_doing",
        requested: false,
        included: false,
        outcome: "not-requested",
      },
    ],
  });
  expect(
    attempt.publication.submission.writing.options.find(
      (o: { name: string }) => o.name === "price",
    ).value,
  ).toBe("");
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.get("price")).toBe("");
  expect(state.posts[0]!.get("addfeed")).toBe("1");
  expect(state.posts[0]!.get("adddynamic")).toBe("true");
  expect(state.posts[0]!.has("adddynamic_doing")).toBe(false);
  await expect(
    page.getByRole("button", { name: "Prepare another attempt", exact: true }),
  ).toHaveCount(0);
  await info.attach("normalized-stored-effects.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("normalized-stored-effects.json", {
    body: Buffer.from(
      JSON.stringify({
        attempt,
        posts: state.posts.map((p) => [...p]),
        requests: state.requests,
      }),
    ),
    contentType: "application/json",
  });
});

test("J5.native-original-check: legacy uncertain original upgrades by GET, retains later edits and survives reload without resend", async ({
  page,
}, info) => {
  const state = await fixture(page, nativeCreation);
  state.sourceChange = nativeStored;
  state.outcome = "lost";
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/response was lost/i)).toBeVisible();
  const original = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later source stays literal");
  await page.reload();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later source stays literal",
  );
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${origin}/forum.php?mod=viewthread&tid=42`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  const checked = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  expect(checked.id).toBe(original.id);
  expect(checked.publication).toEqual(original.publication);
  expect(checked.result.verification.creationEffects[0].outcome).toBe(
    "unknown",
  );
  await page.reload();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later source stays literal",
  );
  await expect(
    page.getByRole("button", { name: "Prepare another attempt", exact: true }),
  ).toHaveCount(0);
  expect(state.posts).toHaveLength(1);
  await info.attach("legacy-original-checked.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("legacy-original-checked.json", {
    body: Buffer.from(
      JSON.stringify({ original, checked, requests: state.requests }),
    ),
    contentType: "application/json",
  });
});

for (const [name, change] of [
  [
    "missing-price",
    (body: string) => body.replace(/<label>Thread price[\s\S]*?<\/label>/, ""),
  ],
  [
    "unexplained-price",
    (body: string) =>
      body.replace('name="price" value="0"', 'name="price" value="2"'),
  ],
  [
    "missing-signature",
    (body: string) =>
      body.replace(
        /<label><input type="checkbox" name="usesig"[\s\S]*?<\/label>/,
        "",
      ),
  ],
  [
    "changed-parsing",
    (body: string) =>
      body.replace(
        'name="bbcodeoff" value="1"',
        'name="bbcodeoff" value="1" checked',
      ),
  ],
  [
    "changed-category",
    (body: string) =>
      body.replace('option value="3"', 'option value="3" selected'),
  ],
  [
    "changed-source",
    (body: string) =>
      body.replace(
        /<textarea name="message">[\s\S]*?<\/textarea>/,
        '<textarea name="message">Different source</textarea>',
      ),
  ],
  [
    "missing-permission",
    (body: string) =>
      body.replace(/<label>Read permission[\s\S]*?<\/label>/, ""),
  ],
] as const) {
  test(`J4.native-persistent-${name}: creation-only distinction never hides persistent source/options failure`, async ({
    page,
  }) => {
    const state = await fixture(page, nativeCreation);
    state.response = emptySuffixCallback;
    state.sourceChange = (body) => change(nativeStored(body));
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(
      page.getByText(/Complete stored source or offered options did not match/),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored thread/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
  });
}

for (const [name, response] of [
  [
    "unguarded-empty",
    emptySuffixCallback
      .replace("if(typeof succeedhandle_=='function'){", "")
      .replace(";}", ";"),
  ],
  [
    "mismatched-guard",
    emptySuffixCallback.replace(
      "typeof succeedhandle_",
      "typeof succeedhandle_post",
    ),
  ],
  [
    "arbitrary-name",
    emptySuffixCallback.replaceAll("succeedhandle_", "succeedhandle_other"),
  ],
  [
    "extra-script",
    emptySuffixCallback.replace(
      "</script>",
      "</script><script>extra()</script>",
    ),
  ],
  [
    "dynamic-argument",
    emptySuffixCallback.replace(
      "'forum.php?mod=viewthread&tid=42'",
      "destination",
    ),
  ],
] as const) {
  test(`J4.native-callback-${name}: unqualified callback never proves stored publication`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.response = response;
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(
      page.getByText(/publication outcome is uncertain/),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored thread/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
    expect(
      state.requests.some(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ),
    ).toBe(false);
  });
}
test("J5.attempt-recovery: pending refresh never replays and explicit candidate check preserves original attempt", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect.poll(() => state.posts.length).toBe(1);
  const before = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  await page.reload();
  release();
  await expect(page.getByText(/restored as uncertain/i)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${origin}/forum.php?mod=viewthread&tid=42`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  const after = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  expect(after.id).toBe(before.id);
  expect(after.publication).toEqual(before.publication);
  expect(state.posts).toHaveLength(1);
  await info.attach("recovered-attempt.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J4.lost-response: only a checked inconclusive attempt allows warned fresh resend, retaining original unknown", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.outcome = "lost";
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/response was lost/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prepare another attempt", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Enter its thread URL/)).toBeVisible();
  await page
    .getByRole("button", { name: "Prepare another attempt", exact: true })
    .click();
  await expect(page.getByText(/may create a duplicate/i)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  await page
    .getByRole("button", {
      name: "Accept duplicate risk and review",
      exact: true,
    })
    .click();
  state.outcome = "accepted";
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  const attempts = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts,
  );
  expect(attempts).toHaveLength(2);
  expect(attempts[0].status).toBe("uncertain");
  expect(attempts[1].id).not.toBe(attempts[0].id);
  expect(attempts[1].publication.id).not.toBe(attempts[0].publication.id);
  expect(state.posts).toHaveLength(2);
  await info.attach("warned-resend.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("J11.publish-between: changed account after review refuses before POST and preserves original source", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await review(page);
  state.member = "8";
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/account changed.*before send/i)).toBeVisible();
  expect(state.posts).toHaveLength(0);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  await expect(page.getByText(/Sending paused/)).toBeVisible();
  await info.attach("changed-before-send.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J4.callback-inert: a success-shaped string in an unrelated script is not a publication candidate", async ({
  page,
}) => {
  const state = await fixture(page);
  state.outcome = "forged";
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/outcome is uncertain/)).toBeVisible();
  expect(
    state.requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "edit",
    ),
  ).toHaveLength(0);
});
test("J4.older-confirmation: delayed acceptance preserves later source/title/options and blocks duplicate pending activation", async ({
  page,
}, info) => {
  const state = await fixture(page);
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect.poll(() => state.posts.length).toBe(1);
  await page.getByLabel("Title", { exact: true }).fill("Later title stays");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later source stays [unknown]v4[/unknown]");
  await page.getByLabel("Thread price", { exact: true }).fill("4");
  await expect(
    page.getByRole("button", { name: "Review publication", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Later title stays",
  );
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later source stays [unknown]v4[/unknown]",
  );
  await expect(page.getByLabel("Thread price", { exact: true })).toHaveValue(
    "4",
  );
  expect(state.posts[0]!.get("message")).toBe(source);
  expect(state.posts[0]!.get("price")).toBe("0");
  expect(state.posts).toHaveLength(1);
  await info.attach("later-revision.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
for (const [name, change] of [
  [
    "missing token",
    (body: string) => body.replace('name="formhash"', 'name="missing"'),
  ],
  [
    "duplicate token",
    (body: string) =>
      body.replace("</form>", '<input name="formhash" value="DUP"></form>'),
  ],
  [
    "wrong board",
    (body: string) => body.replace("newthread&fid=5", "newthread&fid=6"),
  ],
  [
    "changed category",
    (body: string) => body.replace('value="3"', 'value="9"'),
  ],
  [
    "unavailable option",
    (body: string) => body.replace('name="price"', 'name="unknownprice"'),
  ],
  [
    "disabled option changed",
    (body: string) =>
      body.replace(
        'name="htmlon" value="1" disabled',
        'name="htmlon" value="1" checked disabled',
      ),
  ],
] as const)
  test(`J4.preparation-refusal: ${name} refuses before any POST without resetting source`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.formChange = change;
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /native|returned form/ })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish thread", exact: true }),
    ).toHaveCount(0);
    expect(state.posts).toHaveLength(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
  });
for (const [outcome, expected] of [
  ["rejected", /explicitly refused validation/],
  ["moderation", /reports pending moderation/],
] as const)
  test(`J4.outcome-${outcome}: distinguish native outcome without automatic resend`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.outcome = outcome;
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(expected)).toBeVisible();
    expect(
      state.requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
  });
for (const [name, change] of [
  ["source", (body: string) => body.replace("完整來源", "Different source")],
  [
    "price",
    (body: string) =>
      body.replace('name="price" value="0"', 'name="price" value="8"'),
  ],
] as const)
  test(`J4.readback-${name}: mismatch remains uncertain and preserves submitted writing`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.sourceChange = change;
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(
      page.getByText(/did not match, or were unavailable/),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored thread/)).toHaveCount(0);
    expect(state.posts).toHaveLength(1);
  });
test("J4.render-failure: independent confirmation remains trusted after later reader failure", async ({
  page,
}) => {
  const state = await fixture(page);
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  state.renderFailure = true;
  await page
    .getByRole("link", { name: "Open confirmed thread", exact: true })
    .click();
  await expect(
    page
      .getByText(
        /could not be interpreted|unsupported|not understood|unavailable|complete content/i,
      )
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to writing", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J4.native-auxiliary: current tags and inactive rush controls preserve ordinary successful defaults", async ({
  page,
}) => {
  const auxiliary = (body: string) =>
    body.replace(
      "</form>",
      '<label>Tags<input name="tags" value="listening"></label><input type="checkbox" name="checkbox" value="0" checked><input type="checkbox" name="rushreply" value="1"><input name="rushreplyfrom" value=""><input name="rushreplyto" value=""><input name="rewardfloor" value=""><input name="replylimit" value=""><input name="stopfloor" value=""><input name="creditlimit" value=""><input type="hidden" name="save" value=""></form>',
    );
  const state = await fixture(page, auxiliary);
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    tags: "listening",
    checkbox: "0",
    rushreplyfrom: "",
    rushreplyto: "",
    rewardfloor: "",
    replylimit: "",
    stopfloor: "",
    creditlimit: "",
    save: "",
  });
  expect(state.posts[0]!.has("rushreply")).toBe(false);
});
test("J4.native-empty-values: native blank category/price/read-permission stay blank rather than labels or zero", async ({
  page,
}) => {
  const blank = (body: string) =>
    body
      .replaceAll('<option value="0">', '<option value="">')
      .replace('name="price" value="0"', 'name="price" value=""');
  const state = await fixture(page, blank);
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(state.posts[0]!.get("typeid")).toBe("");
  expect(state.posts[0]!.get("readperm")).toBe("");
  expect(state.posts[0]!.get("price")).toBe("");
});
test("J5.pending-persistence: native quota refusal preserves the acknowledged revision and prevents send", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await review(page);
  await expect(
    page.getByText(/Recovery acknowledged for revision/),
  ).toBeVisible();
  const acknowledged = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(acknowledged).not.toBeNull();
  expect(JSON.parse(acknowledged!).writing).toMatchObject({
    title: "Attempt recovery",
    source,
  });
  expect(JSON.parse(acknowledged!).writing.attempts ?? []).toHaveLength(0);
  const capacity = await page.evaluate(() => {
    let filled = "",
      refusal = "";
    for (let size = 65536; size >= 1; size = Math.floor(size / 2)) {
      const block = "x".repeat(size);
      try {
        while (true) {
          sessionStorage.setItem("native-fixture-capacity", filled + block);
          filled += block;
        }
      } catch (error) {
        refusal = error instanceof DOMException ? error.name : String(error);
      }
    }
    let probeRefusal = "";
    try {
      sessionStorage.setItem("native-fixture-capacity", filled + "x");
    } catch (error) {
      probeRefusal = error instanceof DOMException ? error.name : String(error);
    }
    return {
      fillerCharacters: filled.length,
      refusal,
      probeRefusal,
      recovery: sessionStorage.getItem("tsdm.workspace.recovery"),
      nativeSetItem: Function.prototype.toString.call(
        Storage.prototype.setItem,
      ),
      nativeGetItem: Function.prototype.toString.call(
        Storage.prototype.getItem,
      ),
    };
  });
  expect(capacity.fillerCharacters).toBeGreaterThan(0);
  expect(capacity.refusal).toBe("QuotaExceededError");
  expect(capacity.probeRefusal).toBe("QuotaExceededError");
  expect(capacity.recovery).toBe(acknowledged);
  const requestsBeforePublish = state.requests.length;
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/not sent because recovery/)).toBeVisible();
  await expect(page.getByText(/Live writing remains here/)).toBeVisible();
  expect(state.posts).toHaveLength(0);
  expect(state.requests).toHaveLength(requestsBeforePublish);
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    source,
  );
  const retained = await page.evaluate(() => ({
    recovery: sessionStorage.getItem("tsdm.workspace.recovery"),
    sessionKeys: Object.keys(sessionStorage).sort(),
    localKeys: Object.keys(localStorage),
    nativeSetItem: Function.prototype.toString.call(Storage.prototype.setItem),
    nativeGetItem: Function.prototype.toString.call(Storage.prototype.getItem),
  }));
  expect(retained.recovery).toBe(acknowledged);
  expect(retained.sessionKeys).toEqual([
    "native-fixture-capacity",
    "tsdm.workspace.recovery",
  ]);
  expect(retained.localKeys).toEqual([]);
  expect(retained.nativeSetItem).toBe(capacity.nativeSetItem);
  expect(retained.nativeGetItem).toBe(capacity.nativeGetItem);
  await info.attach("native-quota-pending-refusal.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("native-quota-storage-and-requests.json", {
    body: Buffer.from(
      JSON.stringify({
        acknowledged,
        capacity,
        retained,
        requestsBeforePublish,
        requests: state.requests,
        posts: state.posts.map((post) => Object.fromEntries(post)),
      }),
    ),
    contentType: "application/json",
  });
});
test("J11.pending-copy: account text-copy cannot replace the sole context during a pending attempt", async ({
  page,
}) => {
  const state = await fixture(page);
  let release!: () => void;
  state.postGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect.poll(() => state.posts.length).toBe(1);
  await expect(
    page.getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    }),
  ).toBeDisabled();
  release();
});
test("J11.uncertain-copy: deliberate text copy retains the old account-bound unknown attempt", async ({
  page,
}) => {
  const state = await fixture(page);
  state.outcome = "lost";
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/response was lost/i)).toBeVisible();
  const old = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
        .attempts[0],
  );
  state.member = "8";
  await page
    .getByRole("button", {
      name: "Prepare text copy for current account",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Replace with text copy", exact: true })
    .click();
  const writing = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing,
  );
  expect(writing.account.id).toBe("8");
  expect(writing.attempts).toEqual([old]);
});

for (const [name, response] of [
  [
    "duplicate callback fields",
    "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'tid':'42','tid':'43'});</script>]]></root>",
  ],
  [
    "trailing executable grammar",
    "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {}); alert('bad');</script>]]></root>",
  ],
  [
    "incomplete literal",
    "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {};</script>]]></root>",
  ],
  [
    "external candidate",
    "<root><![CDATA[<script>succeedhandle_post('https://elsewhere.example/forum.php?mod=viewthread&tid=42', 'Published', {});</script>]]></root>",
  ],
  [
    "duplicate thread identity",
    "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42&tid=43', 'Published', {});</script>]]></root>",
  ],
  [
    "entity envelope",
    "<!DOCTYPE root [<!ENTITY x 'spoof'>]><root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {});</script>]]></root>",
  ],
] as const)
  test(`J4.callback-uncertain: ${name} never confirms or resends`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.response = response;
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(/outcome is uncertain/)).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(
      state.requests.some(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ),
    ).toBe(false);
  });
for (const [name, change] of [
  [
    "author",
    (body: string) =>
      body.replace(
        'uid=7">Writer 7</a></div><a id="postnum',
        'uid=9">Writer 9</a></div><a id="postnum',
      ),
  ],
  ["board", (body: string) => body.replace('fid=5">Music', 'fid=6">Music')],
  ["opening floor", (body: string) => body.replace("<em>1</em>", "<em>2</em>")],
] as const)
  test(`J4.result-identity: wrong ${name} remains uncertain without source confirmation`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.threadChange = change;
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(/identity did not match/)).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(
      state.requests.some(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ),
    ).toBe(false);
  });
test("J4.source-identity: editable source for a different post cannot confirm", async ({
  page,
}) => {
  const state = await fixture(page);
  state.sourceChange = (body) =>
    body.replace("edit&tid=42&pid=101", "edit&tid=42&pid=102");
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(
    page.getByText(/did not match, or were unavailable/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});
for (const phase of ["prepare", "send", "source"] as const)
  test(`J11.session-${phase}: changed account retains original revision and never claims confirmation`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    let release!: () => void;
    if (phase !== "prepare") await review(page);
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    if (phase === "prepare") state.formGate = gate;
    else if (phase === "send") state.postGate = gate;
    else state.sourceGate = gate;
    if (phase === "prepare") {
      await page.getByLabel("Complete source", { exact: true }).fill(source);
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .click();
      await expect
        .poll(
          () =>
            state.requests.filter(
              (r) => new URL(r.url).searchParams.get("action") === "newthread",
            ).length,
        )
        .toBeGreaterThan(1);
    } else {
      await page
        .getByRole("button", { name: "Publish thread", exact: true })
        .click();
      await expect
        .poll(() =>
          phase === "send"
            ? state.posts.length
            : state.requests.filter(
                (r) => new URL(r.url).searchParams.get("action") === "edit",
              ).length,
        )
        .toBe(1);
    }
    state.member = "8";
    release();
    await expect(
      page.getByText(/account changed|account changed or expired/).first(),
    ).toBeVisible();
    await expect(page.getByText(/Confirmed stored thread/)).toHaveCount(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    expect(state.posts).toHaveLength(phase === "prepare" ? 0 : 1);
    await info.attach(`session-${phase}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
for (const [name, change] of [
  [
    "unknown successful field",
    (body: string) =>
      body.replace(
        "</form>",
        '<input name="unknown-native-control" value="effect"></form>',
      ),
  ],
  [
    "active specialized rush",
    (body: string) =>
      body.replace(
        "</form>",
        '<input type="checkbox" name="rushreply" value="1" checked></form>',
      ),
  ],
  [
    "required empty control",
    (body: string) =>
      body.replace('name="price" value="0"', 'name="price" value="" required'),
  ],
  [
    "source maximum",
    (body: string) =>
      body.replace('name="message"', 'name="message" maxlength="3"'),
  ],
  [
    "duplicate source",
    (body: string) =>
      body.replace(
        "</form>",
        '<textarea name="message">ambiguous</textarea></form>',
      ),
  ],
  [
    "different action",
    (body: string) => body.replace("action=newthread", "action=reply"),
  ],
  [
    "cross-origin action",
    (body: string) =>
      body.replace(
        'action="forum.php',
        'action="https://elsewhere.example/forum.php',
      ),
  ],
] as const)
  test(`J4.preparation-native-refusal: ${name} retains source and refuses before POST`, async ({
    page,
  }) => {
    const state = await fixture(
      page,
      name === "required empty control" ? change : undefined,
    );
    state.formChange = change;
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /unsupported|form targets|unambiguous/ })
        .first(),
    ).toBeVisible();
    expect(state.posts).toHaveLength(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
  });
test("J4.readback-unavailable-option: missing current price remains unknown rather than zero", async ({
  page,
}) => {
  const state = await fixture(page);
  state.sourceChange = (body) =>
    body.replace('name="price"', 'name="unavailable-price"');
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(
    page.getByText(/did not match, or were unavailable/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});
for (const member of ["guest", ""] as const)
  test(`J11.session-before-prepare: ${member || "unknown"} actor cannot review the original member writing`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.member = member;
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByText(/account changed or expired during preparation/),
    ).toBeVisible();
    expect(state.posts).toHaveLength(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
  });
test("J4.callback-supported-guard: literal native callback guard confirms only after complete readback", async ({
  page,
}) => {
  const state = await fixture(page);
  state.response = `<root><![CDATA[<script>if(typeof succeedhandle_post == 'function'){succeedhandle_post('forum.php?mod=viewthread&tid=42', '\\u53d1\\u5e03', {'tid':'42'});}</script>]]></root>`;
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
});
for (const [name, corruption] of [
  [
    "unqualified-normalization",
    { normalizations: [{ name: "price", submitted: "", stored: "2" }] },
  ],
  [
    "normalization-without-blank-submission",
    { normalizations: [{ name: "price", submitted: "", stored: "0" }] },
  ],
  [
    "unknown-effect",
    {
      creationEffects: [
        {
          name: "arbitrary",
          requested: true,
          included: true,
          outcome: "unknown",
        },
      ],
    },
  ],
  [
    "invented-delivery",
    {
      creationEffects: [
        {
          name: "addfeed",
          requested: true,
          included: true,
          outcome: "confirmed",
        },
      ],
    },
  ],
  [
    "unoffered-effect",
    {
      creationEffects: [
        {
          name: "addfeed",
          requested: true,
          included: true,
          outcome: "unknown",
        },
      ],
    },
  ],
  ["unverified-storage", { stored: "unknown" }],
] as const) {
  test(`J5.incompatible-verification-${name}: malformed new evidence remains inspectable and never silently trusted`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
    const malformed = await page.evaluate((change) => {
      const raw = JSON.parse(
        sessionStorage.getItem("tsdm.workspace.recovery")!,
      );
      raw.writing.attempts[0].result.verification = {
        stored: "verified",
        normalizations: [],
        creationEffects: [],
        ...change,
      };
      const value = JSON.stringify(raw);
      sessionStorage.setItem("tsdm.workspace.recovery", value);
      return value;
    }, corruption);
    await page.reload();
    await expect(
      page.getByText(/Stored recovery data is incompatible/),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Inspect retained recovery data",
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel("Retained recovery data", { exact: true }),
    ).toHaveValue(malformed);
    expect(state.posts).toHaveLength(1);
    await info.attach("incompatible-verification.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

test("J5.incompatible-attempt: malformed submitted identity stays inspectable without automatic overwrite or send", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.outcome = "lost";
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/response was lost/i)).toBeVisible();
  const malformed = await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!);
    raw.writing.attempts[0].publication.submission.writing.board.id =
      "different";
    const value = JSON.stringify(raw);
    sessionStorage.setItem("tsdm.workspace.recovery", value);
    return value;
  });
  await page.reload();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Inspect retained recovery data",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Retained recovery data", { exact: true }),
  ).toHaveValue(malformed);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsdm.workspace.recovery"),
    ),
  ).toBe(malformed);
  expect(state.posts).toHaveLength(1);
  await info.attach("incompatible-attempt.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("J4.disabled-native: disabled fieldset and optgroup retain effective disabled semantics", async ({
  page,
}) => {
  await fixture(page, (body) =>
    body
      .replace(
        '<label>Thread price<input name="price" value="0"></label>',
        '<fieldset disabled><label>Thread price<input name="price" value="0"></label></fieldset>',
      )
      .replace(
        '<option value="3">Listening</option>',
        '<optgroup label="Unavailable" disabled><option value="3">Listening</option></optgroup>',
      ),
  );
  await expect(page.getByLabel("Thread price", { exact: true })).toBeDisabled();
  await expect(
    page.getByLabel("Category", { exact: true }).locator('option[value="3"]'),
  ).toHaveAttribute("disabled", "");
});
test("J4.native-submitter: ordinary publication preserves its current submitter and disabled fieldset successful controls", async ({
  page,
}) => {
  const state = await fixture(page, (body) =>
    body
      .replace("&topicsubmit=yes", "")
      .replace(
        '<label>Thread price<input name="price" value="0"></label>',
        '<fieldset disabled><legend><label><input type="checkbox" name="allownoticeauthor" value="1" checked>Receive reply notifications</label></legend><label>Thread price<input name="price" value="0"></label></fieldset>',
      ),
  );
  await review(page);
  await page
    .getByRole("button", { name: "Publish thread", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
  expect(state.posts[0]!.get("topicsubmit")).toBe("yes");
  expect(state.posts[0]!.get("allownoticeauthor")).toBe("1");
  expect(state.posts[0]!.has("price")).toBe(false);
});
test("J4.native-submitter-true: preserve returned true body literal with ordinary yes action and independent confirmation", async ({
  page,
}, info) => {
  const state = await fixture(page, (body) =>
    body.replace(
      'name="topicsubmit" value="yes"',
      'name="topicsubmit" value="true"',
    ),
  );
  try {
    await review(page);
    await page
      .getByRole("button", { name: "Publish thread", exact: true })
      .click();
    await expect(page.getByText(/Confirmed stored thread/)).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]!.getAll("topicsubmit")).toEqual(["true"]);
    expect(state.posts[0]!.get("message")).toBe(source);
    const sent = state.requests.filter((request) => request.method === "POST");
    expect(sent).toHaveLength(1);
    expect(new URL(sent[0]!.url).searchParams.getAll("topicsubmit")).toEqual([
      "yes",
    ]);
    expect(
      state.requests.filter(
        (request) => new URL(request.url).searchParams.get("action") === "edit",
      ),
    ).toHaveLength(1);
  } finally {
    await info.attach("literal-native-submitter.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("literal-native-submitter-state.json", {
      body: Buffer.from(
        JSON.stringify({
          posts: state.posts.map((post) => Object.fromEntries(post)),
          requests: state.requests,
        }),
      ),
      contentType: "application/json",
    });
  }
});
for (const [name, submitter] of [
  [
    "unqualified literal",
    '<button name="topicsubmit" value="draft">Publish</button>',
  ],
  [
    "duplicate ordinary submitters",
    '<button name="topicsubmit" value="yes">Publish</button><button name="topicsubmit" value="true">Publish</button>',
  ],
] as const)
  test(`J4.native-submitter-refusal: ${name} preserves source without POST`, async ({
    page,
  }) => {
    const state = await fixture(page, (body) =>
      body.replace(
        '<button type="submit" name="topicsubmit" value="yes">Publish</button>',
        submitter,
      ),
    );
    await page.getByLabel("Title", { exact: true }).fill("Refused submitter");
    await page.getByLabel("Complete source", { exact: true }).fill(source);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await expect(
      page.getByText(/successful controls.*unsupported/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish thread", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue(source);
    expect(state.posts).toHaveLength(0);
  });
for (const [
  language,
  reviewLabel,
  publishLabel,
  uncertain,
  sourceLabel,
  settingsLabel,
  closeLabel,
] of [
  [
    "zh-CN",
    "检查发布",
    "发布主题",
    "发布结果不确定",
    "完整源码",
    "设置",
    "关闭",
  ],
  [
    "zh-TW",
    "檢查發佈",
    "發佈主題",
    "發佈結果不確定",
    "完整原始碼",
    "設定",
    "關閉",
  ],
] as const)
  test(`J4.localized-${language}: publication controls and authored uncertainty follow language without translating source`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.outcome = "forged";
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#interface-language").selectOption(language);
    await page.getByRole("button", { name: closeLabel, exact: true }).click();
    await page.getByLabel(sourceLabel, { exact: true }).fill(source);
    await page.getByRole("button", { name: reviewLabel, exact: true }).click();
    await page.getByRole("button", { name: publishLabel, exact: true }).click();
    await expect(page.getByText(new RegExp(uncertain))).toBeVisible();
    await expect(page.getByLabel(sourceLabel, { exact: true })).toHaveValue(
      source,
    );
    await expect(
      page.getByRole("button", { name: settingsLabel, exact: true }),
    ).toBeVisible();
    await info.attach(`publication-${language}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
