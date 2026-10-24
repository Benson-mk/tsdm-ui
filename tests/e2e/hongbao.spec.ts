import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const receipts = new WeakMap<Page, () => unknown>();
test.afterEach(async ({ page }, info) => {
  await info.attach("hongbao-state.json", {
    body: JSON.stringify(
      receipts.get(page)?.() ?? { kind: "synthetic", setup: "not reached" },
    ),
    contentType: "application/json",
  });
  await info.attach("hongbao-result.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=4`;
const actor =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
const packetFields = `<div class="hb-postbox">
<div class="hb-row"><label>總金額</label><input type="number" name="hb_total" min="1" step="1"></div>
<div class="hb-row"><label>份數</label><input type="number" name="hb_shares" min="1" max="100" step="1" value="1"><span class="hb-hint">最多 100 份;每份至少 10</span></div>
<label><input type="radio" name="hb_split" value="1" checked>拼手氣</label><label><input type="radio" name="hb_split" value="2">均分</label>
<label><input type="checkbox" name="hb_cond" value="1">必須回帖後才能搶</label>
<input name="hb_password" type="text" maxlength="64"><input name="hb_appoint" type="text" placeholder="會員名,可多個(逗號分隔)">
<select name="hb_expire"><option value="1">1 小時</option><option value="6">6 小時</option><option value="24" selected>1 天</option><option value="0">不自動到期</option></select>
<input type="text" name="hb_blessing" maxlength="50" value="恭喜發財,大吉大利">
<div class="hb-hint">紅包金額在扣款成功後才鎖定;發表後不可補塞、不可加碼。</div></div>`;

async function fixture(page: Page) {
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const effects: string[] = [];
  const state = {
    effects,
    posts: [] as URLSearchParams[],
    packet: true,
    lost: false,
    member: "7",
    packetState: "open",
    moderation: false,
    rejection: false,
    packetInvalid: false,
    ledgerFailed: false,
    threadReadFailed: false,
    currentStoredSource: null as string | null,
    packetSettings: null as URLSearchParams | null,
    recipientsValid: true,
    specialEdit: false,
    hold: null as Promise<void> | null,
    formChange: (value: string) => value,
    reads: [] as string[],
  };
  const escape = (v: string) =>
    v
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  receipts.set(page, () => ({
    kind: "synthetic",
    effects: state.effects,
    submitted: state.posts.map((p) => Object.fromEntries(p)),
    readbacks: state.reads,
    packet: state.packet,
    packetState: state.packetState,
    creditAttribution: "unknown",
    threadReadFailed: state.threadReadFailed,
    currentStoredSource: state.currentStoredSource,
    ledgerFailed: state.ledgerFailed,
  }));
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/__workspace-fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"></head><body><script src="${origin}/__workspace-fixture.js"></script></body></html>`,
      });
    if (request.method() !== "GET") effects.push(request.url());
    state.reads.push(url.href);
    const stored = state.posts.at(-1);
    const packet = state.packetSettings ?? stored;
    if (state.threadReadFailed && url.searchParams.get("mod") === "viewthread")
      return route.abort("failed");
    if (url.searchParams.get("id") === "atplus:search")
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          list: state.recipientsValid
            ? [{ uid: 8, username: "Recipient Eight" }]
            : [],
        }),
      });
    if (url.searchParams.get("ac") === "credit")
      return route.fulfill({
        contentType: "text/html",
        body: state.ledgerFailed
          ? "unavailable"
          : `${actor}<table class="dt" summary="主题付费"><tr><th>操作</th><th>积分变更</th><th>变更后</th><th>详情</th><th>变更时间</th></tr><tr><td><a href="home.php?mod=spacecp&ac=credit&op=log&optype=HBS">logs_credit_update_HBS</a></td><td>天使币 <span class="xg1">-20</span></td><td>80</td><td>Historical independent packet</td><td>2026-01-01 01:00</td></tr><tr><td><a href="home.php?mod=spacecp&ac=credit&op=log&optype=HBR">logs_credit_update_HBR</a></td><td>天使币 <span class="xi1">+10</span></td><td>90</td><td>Historical refund</td><td>2026-01-01 02:00</td></tr></table>`,
      });
    if (request.method() === "POST") {
      state.posts.push(new URLSearchParams(request.postData() ?? ""));
      if (state.hold) await state.hold;
      if (state.lost) return route.abort("failed");
      if (state.rejection)
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>errorhandle_post('subject_invalid', {});</script>]]></root>",
        });
      if (state.moderation)
        return route.fulfill({
          contentType: "text/xml",
          body: "<root><![CDATA[<script>succeedhandle_post('', '主题需要审核', {});</script>]]></root>",
        });
      return route.fulfill({
        contentType: "text/xml",
        body: `<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'4','tid':'42','pid':'101'});</script>]]></root>`,
      });
    }
    if (url.pathname === "/plugin.php")
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          state.packet
            ? {
                ok: true,
                tid: state.packetInvalid ? 99 : 42,
                from: "Writer 7",
                bless: packet?.get("hb_blessing"),
                haspw: packet?.get("hb_password") ? 1 : 0,
                cond: packet?.has("hb_cond") ? 1 : 0,
                appoint: 0,
                splitmode: Number(packet?.get("hb_split")),
                unit: "天使币",
                state: state.packetState,
                is_sender: 1,
                selfclaim: 1,
                canwd: 1,
                mine: { claimed: 0 },
              }
            : { ok: false, error: "這裡沒有紅包" },
        ),
      });
    if (url.searchParams.get("action") === "edit")
      return route.fulfill({
        contentType: "text/html",
        body: `${actor}<div id="pt"><a href="${boardURL}">Discussion</a></div><form id="postform" method="post" action="forum.php?mod=post&action=edit&fid=4&tid=42&pid=101&editsubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC">${state.specialEdit ? '<input type="hidden" name="special" value=""><input type="hidden" name="specialextra" value="SYNTHETIC_PRESERVED">' : ""}<input name="subject" value="${escape(stored?.get("subject") ?? "")}"><textarea name="message">${escape(state.currentStoredSource ?? stored?.get("message") ?? "")}</textarea><button type="submit" name="editsubmit" value="yes">Save</button></form>`,
      });
    if (url.searchParams.get("mod") === "viewthread")
      return route.fulfill({
        contentType: "text/html",
        body: `${actor}<div id="pt"><a href="${boardURL}">Discussion</a></div><div id="postlist"><h1 id="thread_subject">${escape(stored?.get("subject") ?? "")}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb">Stored source shown separately ${state.packet ? '<div class="hb-entry" data-tid="42">Packet</div>' : ""}</div></div></div>`,
      });
    const body =
      url.searchParams.get("mod") === "post"
        ? `${actor}<div id="pt"><a href="${boardURL}">Discussion</a></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=4&topicsubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC"><input name="subject"><textarea name="message"></textarea>${packetFields}<script>window.ATPLUS={"api":"plugin.php?id=atplus:search","login":1,"use":1};</script><button type="submit" name="topicsubmit" value="yes">Publish</button></form>`
        : `${actor}<div id="ct"><h1><a href="${boardURL}">Discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_42"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=42">Existing thread</a></th></tr></tbody></table>`;
    return route.fulfill({
      contentType: "text/html",
      body: state.formChange(body).replaceAll('uid=7"', `uid=${state.member}"`),
    });
  });
  await page.goto(boardURL);
  return state;
}

test("J7.packet-current-controls: expose all current native controls and actual form limits without a mutation", async ({
  page,
}, info) => {
  const { effects } = await fixture(page);
  await page
    .getByRole("button", { name: "New red packet", exact: true })
    .click();
  await expect(
    page.getByLabel("Total credits", { exact: true }),
  ).toHaveAttribute("min", "1");
  await expect(page.getByLabel("Share count", { exact: true })).toHaveAttribute(
    "max",
    "100",
  );
  await expect(page.getByLabel("Split", { exact: true })).toHaveValue("1");
  await expect(
    page.getByLabel("Require a reply", { exact: true }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Passphrase", { exact: true })).toHaveAttribute(
    "maxlength",
    "64",
  );
  await expect(
    page.getByLabel("Designated recipients", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Expiry", { exact: true })).toHaveValue("24");
  await expect(page.getByLabel("Greeting", { exact: true })).toHaveAttribute(
    "maxlength",
    "50",
  );
  await expect(
    page.getByText("最多 100 份;每份至少 10", { exact: true }),
  ).toBeVisible();
  expect(effects).toEqual([]);
  await info.attach("packet-controls.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("packet-controls-receipt.json", {
    body: JSON.stringify({
      kind: "synthetic",
      effects,
      fields: 8,
      actualShareLimit: 100,
    }),
    contentType: "application/json",
  });
});

async function composePacket(page: Page) {
  await page
    .getByRole("button", { name: "New red packet", exact: true })
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Packet source version one");
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[b]Full packet source[/b]");
  await page.getByLabel("Total credits", { exact: true }).fill("20");
  await page.getByLabel("Share count", { exact: true }).fill("2");
  await page.getByLabel("Split", { exact: true }).selectOption("2");
  await page.getByLabel("Require a reply", { exact: true }).check();
  await page.getByLabel("Passphrase", { exact: true }).fill("synthetic phrase");
  await page.getByLabel("Expiry", { exact: true }).selectOption("6");
  await page.getByLabel("Greeting", { exact: true }).fill("Synthetic greeting");
}

test("J7.packet-publication: review full conditions and confirm thread separately from packet and unknown credits", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText("Publish red packet — deduct 20 credits", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(
    page.getByText("Packet state: open", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Credit attribution remains unknown/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(Object.fromEntries(state.posts[0]!)).toMatchObject({
    hb_total: "20",
    hb_shares: "2",
    hb_split: "2",
    hb_cond: "1",
    hb_password: "synthetic phrase",
    hb_expire: "6",
    hb_blessing: "Synthetic greeting",
  });
  expect(
    state.reads.some(
      (url) =>
        url.includes("id=hongbao%3Aopen") || url.includes("id=hongbao:open"),
    ),
  ).toBe(true);
  await info.attach("packet-publication.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("packet-publication-receipt.json", {
    body: JSON.stringify({
      kind: "synthetic",
      effects: state.effects,
      stored: Object.fromEntries(state.posts[0]!),
      packet: state.packet,
      creditAttribution: "unknown",
    }),
    contentType: "application/json",
  });
});

test("J7.packet-thread-only: absent packet does not erase confirmed source or invent a debit", async ({
  page,
}) => {
  const state = await fixture(page);
  state.packet = false;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(
    page.getByText("Packet state: absent", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Credit attribution remains unknown/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-minimum: current per-share requirement blocks a below-minimum command", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page.getByLabel("Total credits", { exact: true }).fill("1");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText(
      /Red-packet values do not satisfy the current native limits/,
    ),
  ).toBeVisible();
  expect(state.posts).toEqual([]);
});

test("J7.packet-ledger: observe unrelated ledger rows without assigning their debit or refund to this attempt", async ({
  page,
}, info) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(
    page.getByText("Observed credit rows (current returned page only)", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Historical independent packet/)).toBeVisible();
  await expect(
    page.getByText(/Credit attribution remains unknown/),
  ).toBeVisible();
  expect(state.reads.filter((url) => url.includes("ac=credit"))).toHaveLength(
    1,
  );
  await info.attach("packet-ledger-receipt.json", {
    body: JSON.stringify({
      kind: "synthetic",
      effects: state.effects,
      reads: state.reads,
      expectedAttribution: "unknown",
      historicalRows: 2,
    }),
    contentType: "application/json",
  });
});

test("J7.packet-lost-check: reload retains original unknown and one read-only check confirms independently without resend", async ({
  page,
}) => {
  const state = await fixture(page);
  state.lost = true;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/The response was lost/)).toBeVisible();
  await page.reload();
  await page
    .getByLabel("Candidate thread URL", { exact: true })
    .fill(`${origin}/forum.php?mod=viewthread&tid=42`);
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(
    page.getByText("Packet state: open", { exact: true }),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-resend: warn of additional deduction and preserve original unknown after deliberate second command", async ({
  page,
}) => {
  const state = await fixture(page);
  state.lost = true;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await page.getByRole("button", { name: "Check result", exact: true }).click();
  await page
    .getByRole("button", { name: "Prepare another attempt", exact: true })
    .click();
  await expect(
    page.getByText(
      /A further red-packet attempt can deduct additional credits/,
    ),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Accept duplicate risk and review",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/The response was lost/)).toHaveCount(1);
  await expect(
    page.getByText(/No supported candidate thread URL is available/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(2);
});

test("J7.packet-expiry: observed expiry and missing credit readback explain unknown refund and moderator assistance", async ({
  page,
}) => {
  const state = await fixture(page);
  state.packetState = "expired";
  state.ledgerFailed = true;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(
    page.getByText("Packet state: expired", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Credit ledger unavailable/)).toBeVisible();
  await expect(
    page.getByText(/contact a moderator for assistance/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-recipient: unresolvable designated recipient refuses publication without financial command", async ({
  page,
}) => {
  const state = await fixture(page);
  state.recipientsValid = false;
  await composePacket(page);
  await page
    .getByLabel("Designated recipients", { exact: true })
    .fill("Unknown Member");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText(/A designated recipient could not be resolved/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
});

test("J7.packet-owned-edit: preserve native hidden metadata while changing content without re-funding", async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.specialEdit = true;
  state.posts.push(
    new URLSearchParams({
      subject: "Existing packet",
      message: "[b]Original body[/b]",
      hb_total: "20",
      hb_shares: "2",
      hb_split: "2",
      hb_blessing: "Original greeting",
    }),
  );
  await page
    .getByRole("link", { name: "Existing thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit post 101", exact: true })
    .click();
  await expect(
    page.getByText(
      /Existing red packet: content edits do not change its conditions/,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Total credits", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("[b]Revised body[/b]");
  await page.getByRole("button", { name: "Review edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Save edited post", exact: true })
    .click();
  await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
  const saved = state.posts.at(-1)!;
  expect(saved.get("message")).toBe("[b]Revised body[/b]");
  expect(saved.get("specialextra")).toBe("SYNTHETIC_PRESERVED");
  expect([...saved.keys()].filter((k) => k.startsWith("hb_"))).toEqual([]);
  expect(state.effects).toHaveLength(1);
  await info.attach("packet-edit-receipt.json", {
    body: JSON.stringify({
      kind: "synthetic",
      post: Object.fromEntries(saved),
      effects: state.effects,
      packetFundingCommands: 0,
    }),
    contentType: "application/json",
  });
});

for (const failure of [
  "thread-read-failed",
  "stored-source-changed",
] as const) {
  test(`J7.packet-edit-recheck-${failure}: retain historical saved revision while refreshing packet and credit observations without another write`, async ({
    page,
  }, info) => {
    const state = await fixture(page);
    state.specialEdit = true;
    state.ledgerFailed = true;
    const initial = new URLSearchParams({
      subject: "Existing packet",
      message: "[b]Original body[/b]",
      hb_total: "20",
      hb_shares: "2",
      hb_split: "2",
      hb_blessing: "Original greeting",
    });
    state.packetSettings = new URLSearchParams(initial);
    state.posts.push(initial);
    await page
      .getByRole("link", { name: "Existing thread", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit post 101", exact: true })
      .click();
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("[b]Verified edit[/b]");
    await page
      .getByRole("button", { name: "Review edit", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save edited post", exact: true })
      .click();
    await expect(page.getByText(/Confirmed saved post 101/)).toBeVisible();
    await expect(
      page.getByText("Packet state: open", { exact: true }),
    ).toBeVisible();
    const acknowledgedAttempt = () =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!).writing
            .attempts[0],
      );
    await expect
      .poll(async () => (await acknowledgedAttempt()).status)
      .toBe("confirmed");
    const original = await acknowledgedAttempt();
    expect(original.result.verification.stored).toBe("verified");
    expect(original.publication.submission.writing.source).toBe(
      "[b]Verified edit[/b]",
    );
    const link = page.getByRole("link", {
      name: "Open confirmed thread",
      exact: true,
    });
    await expect(link).toHaveAttribute("href", original.result.url);
    await page
      .getByRole("button", { name: "Source editor", exact: true })
      .click();
    await page
      .getByLabel("Complete source", { exact: true })
      .fill("Later local writing");
    if (failure === "thread-read-failed") state.threadReadFailed = true;
    else state.currentStoredSource = "Later authoritative server revision";
    state.packetState = "expired";
    state.ledgerFailed = false;
    const readsBefore = state.reads.length;
    await page
      .getByRole("button", { name: "Check result", exact: true })
      .click();
    await expect(
      page.getByText(/Previous stored confirmation retained/),
    ).toBeVisible();
    await expect(
      page.getByText(
        failure === "thread-read-failed"
          ? /Saved post readback failed/
          : /unavailable or differ/,
      ),
    ).toBeVisible();
    await expect(link).toHaveAttribute("href", original.result.url);
    await expect(
      page.getByRole("button", {
        name: "Prepare another attempt",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Packet state: expired", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Historical refund/)).toBeVisible();
    await expect(
      page.getByText(/Credit attribution remains unknown/),
    ).toBeVisible();
    await expect(
      page.getByLabel("Complete source", { exact: true }),
    ).toHaveValue("Later local writing");
    await expect
      .poll(async () => (await acknowledgedAttempt()).redPacket.state)
      .toBe("expired");
    const rechecked = await acknowledgedAttempt();
    expect(rechecked.status).toBe("confirmed");
    expect(rechecked.id).toBe(original.id);
    expect(rechecked.publication).toEqual(original.publication);
    expect(rechecked.result).toEqual(original.result);
    expect(rechecked.checked).toBe(true);
    expect(
      state.reads
        .slice(readsBefore)
        .some((u) => new URL(u).searchParams.get("id") === "hongbao:open"),
    ).toBe(true);
    expect(
      state.reads
        .slice(readsBefore)
        .some((u) => new URL(u).searchParams.get("ac") === "credit"),
    ).toBe(true);
    expect(state.effects).toHaveLength(1);
    expect(state.posts).toHaveLength(2); // One pre-existing seed plus one explicit save.
    expect(state.posts[1]!.get("message")).toBe("[b]Verified edit[/b]");
    state.packetInvalid = true;
    state.ledgerFailed = true;
    await page
      .getByRole("button", { name: "Check result", exact: true })
      .click();
    await expect(
      page.getByText("Packet state: unknown", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Credit ledger unavailable/)).toBeVisible();
    await expect(link).toHaveAttribute("href", original.result.url);
    await expect(
      page.getByRole("button", {
        name: "Prepare another attempt",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect
      .poll(async () => (await acknowledgedAttempt()).redPacket.state)
      .toBe("unknown");
    const unavailable = await acknowledgedAttempt();
    expect(unavailable.status).toBe("confirmed");
    expect(unavailable.result).toEqual(original.result);
    expect(unavailable.publication).toEqual(original.publication);
    expect(state.effects).toHaveLength(1);
    await info.attach("historical-edit-confirmation.json", {
      body: JSON.stringify({
        original,
        rechecked,
        unavailable,
        effects: state.effects,
        currentStoredSource: state.currentStoredSource,
      }),
      contentType: "application/json",
    });
  });
}

test("J7.packet-account: changed account before final send refuses without a debit command", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  state.member = "8";
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(
    page.getByText(/The account changed or expired before send/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
});

test("J7.packet-pending: double activation sends once and later writing survives arrival", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  let release = () => {};
  state.hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .dblclick();
  await expect.poll(() => state.posts.length).toBe(1);
  await page
    .getByRole("button", { name: "Source editor", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Later writing");
  release();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Later writing",
  );
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-schema: malformed recovered packet controls are retained incompatibly without replay", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page.evaluate(() => {
    const raw = sessionStorage.getItem("tsdm.workspace.recovery")!;
    const saved = JSON.parse(raw);
    saved.writing.redPacket = { hints: [{ not: "text" }] };
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(saved));
  });
  await page.reload();
  await expect(
    page.getByText(/Stored recovery data is incompatible/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
});

test("J7.packet-changed-limits: changing the native share maximum after review blocks the financial command", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  state.formChange = (body) => body.replace('max="100"', 'max="1"');
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(
    page.getByText(/The current form changed before send/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
});

test("J7.packet-extra-control: unfamiliar packet controls refuse incomplete interpretation", async ({
  page,
}) => {
  const state = await fixture(page);
  state.formChange = (body) =>
    body.replace("</form>", '<input name="hb_future" value="unknown"></form>');
  await page
    .getByRole("button", { name: "New red packet", exact: true })
    .click();
  await expect(
    page.getByText(/The complete native red-packet controls are unavailable/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(0);
});

test("J7.packet-full-recipient: resolve the exact designated member and send the reviewed native name once", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByLabel("Designated recipients", { exact: true })
    .fill("Recipient Eight");
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0]!.get("hb_appoint")).toBe("Recipient Eight");
});

test("J7.packet-wrong-status: a wrong-target packet readback stays unknown while source confirmation survives", async ({
  page,
}) => {
  const state = await fixture(page);
  state.packetInvalid = true;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await expect(
    page.getByText("Packet state: unknown", { exact: true }),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-confirmed-guard: confirmed direct publication cannot be silently funded again", async ({
  page,
}) => {
  const state = await fixture(page);
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText(/An existing red-packet thread is already confirmed/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-language: new packet controls follow the selected interface language", async ({
  page,
}) => {
  await fixture(page);
  await composePacket(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(page.getByLabel("红包总额", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "新红包", exact: true }),
  ).toBeVisible();
});

for (const outcome of ["lost", "moderation"] as const) {
  test(`J7.packet-${outcome}-components: an unconfirmed thread immediately retains unknown packet and credit outcomes`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state[outcome] = true;
    await composePacket(page);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Publish red packet", exact: true })
      .click();
    await expect(
      page.getByText(
        outcome === "lost"
          ? /The response was lost/
          : /The forum reports pending moderation/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Packet state: unknown", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Credit attribution remains unknown/),
    ).toBeVisible();
    if (outcome === "moderation")
      await expect(
        page.getByText(/contact a moderator for assistance/),
      ).toBeVisible();
    expect(state.posts).toHaveLength(1);
  });
}

test("J7.packet-refusal-components: a validation callback does not establish a transaction rollback or permit unreviewed resend", async ({
  page,
}) => {
  const state = await fixture(page);
  state.rejection = true;
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(
    page.getByText(
      /The forum refused validation; thread, packet and credit outcomes remain unconfirmed/,
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await expect(
    page.getByText(/An earlier attempt may already exist/),
  ).toBeVisible();
  expect(state.posts).toHaveLength(1);
});

test("J7.packet-native-routing: preserve fresh hidden routing fields without inventing their values", async ({
  page,
}) => {
  const state = await fixture(page);
  state.formChange = (body) =>
    body.replace(
      '<input name="subject">',
      '<input type="hidden" name="special" value="SYNTHETIC_KIND"><input type="hidden" name="specialextra" value="SYNTHETIC_ROUTE"><input name="subject">',
    );
  await composePacket(page);
  await page
    .getByRole("button", { name: "Review publication", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish red packet", exact: true })
    .click();
  await expect(page.getByText(/Confirmed stored thread 42/)).toBeVisible();
  expect(state.posts[0]!.get("special")).toBe("SYNTHETIC_KIND");
  expect(state.posts[0]!.get("specialextra")).toBe("SYNTHETIC_ROUTE");
});
