import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const origin = "https://www.tsdm39.com";
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const nativeReasons =
  "var reasons = ['广告垃圾','违规内容','恶意灌水','重复发帖','其他'];\nvar reasonstring = '';\nfor (i=0; i<reasons.length; i++) {\nreasonstring += '<label><input type=\"radio\" name=\"report_select\" class=\"pr\" onclick=\"' + (i < reasons.length -1 ? '$(\\'report_message\\').innerHTML=this.value;' : '') + '$(\\'report_other\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\';$(\\'report_msg\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\'\" value=\"' + reasons[i] + '\"> ' + reasons[i] + '</label><br />';\n}\n$('report_reasons').innerHTML = reasonstring;\n";
const ledger = new WeakMap<
  Page,
  { url: string; method: string; body: string | null }[]
>();
async function open(page: Page) {
  const requests: { url: string; method: string; body: string | null }[] = [];
  ledger.set(page, requests);
  const state = {
    member: "7",
    available: true,
    refused: false,
    wrongTarget: false,
    formActor: 7,
    hashMismatch: false,
    script: nativeReasons,
    extra: "",
    outcome: "success",
    action: "misc.php?mod=report",
    token: "SYNTHETIC_TOKEN",
    selectedField: "reportsubmit",
    reportValue: "true",
    limit: "200",
    keyup: "dstrLenCalc(this, 'checklen');",
    header: "",
    disabled: false,
    handler:
      "if(!$('report_message').value) return false;ajaxpost(this.id, 'form_miscreport101');",
  };
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const r = route.request(),
      u = new URL(r.url());
    if (u.pathname === "/__entry.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (r.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body onkeydown="if(event.keyCode==27) return false;"><script src="${origin}/__entry.js"></script></body></html>`,
      });
    requests.push({ url: u.href, method: r.method(), body: r.postData() });
    if (u.pathname === "/misc.php") {
      if (r.method() === "POST") {
        if (state.outcome === "lost") return route.abort();
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body:
            state.outcome === "rejected"
              ? '<div class="alert_error">举报被拒绝</div>'
              : '<div class="alert_right">举报成功</div>',
        });
      }
      const hidden = {
        referer: threadURL,
        [state.selectedField]: state.reportValue,
        rtype: "post",
        rid: state.wrongTarget ? "999" : "101",
        fid: "5",
        url: threadURL,
        inajax: "1",
        handlekey: "miscreport101",
        formhash: state.token,
      };
      const body = state.refused
        ? '<div class="alert_error">没有权限举报</div>'
        : `<form id="form_miscreport101" method="post" action="${state.action}" onsubmit="${state.handler}">${Object.entries(
            hidden,
          )
            .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
            .join(
              "",
            )}<div id="report_reasons"></div><div id="report_other"><textarea id="report_message" name="message" onfocus="this.innerHTML='';this.focus=null;this.className='reasonarea pt mtn'" onkeyup="${state.keyup}" ${state.disabled ? "disabled" : ""}>请填写举报内容</textarea></div><div id="report_msg"><span class="z">还可输入 <strong id="checklen">${state.limit}</strong> 个字符</span></div><button id="report_submit" type="submit" value="true">举报</button>${state.extra}</form><script>${state.script}</script>`;
      return route.fulfill({
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          ok: 1,
          type: "result",
          schema: 13,
          kind: "page",
          uid: state.formActor,
          formhash: state.hashMismatch ? "OTHER" : state.token,
          document: state.header + body,
        }),
      });
    }
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        document: `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Member ${state.member}</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board</a></div><div id="postlist"><h1 id="thread_subject">Report target</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Exact post body</p></div><div class="po"><div class="pob">${state.available ? `<a href="javascript:;" onclick="showWindow('miscreport101', 'misc.php?mod=report&rtype=post&rid=101&tid=42&fid=5', 'get', -1);return false;">举报</a>` : ""}</div></div></div></div>`,
      }),
    });
  });
  await page.goto(threadURL);
  await expect(
    page.getByRole("heading", { name: "Report target", exact: true }),
  ).toBeVisible();
  return { requests, state };
}
async function report(page: Page, right = false) {
  if (right)
    await page.locator("#pid101 .post-author").click({ button: "right" });
  else
    await page
      .getByRole("button", { name: "Post 101 actions", exact: true })
      .click();
  await page.getByRole("menuitem", { name: "Report", exact: true }).click();
  return page.getByRole("dialog", { name: "Report post 101", exact: true });
}
test.afterEach(async ({ page }, info) => {
  await info.attach("report-requests.json", {
    body: JSON.stringify(ledger.get(page), null, 2),
    contentType: "application/json",
  });
  await info.attach("report.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UX103.cancel: both entries discover source choices; editing and cancelling never reports", async ({
  page,
}) => {
  const { requests } = await open(page);
  for (const right of [false, true]) {
    const dialog = await report(page, right);
    await expect(dialog.getByRole("radio")).toHaveCount(5);
    await expect(
      dialog.getByRole("radio", { name: "广告垃圾", exact: true }),
    ).not.toBeChecked();
    await dialog.getByRole("radio", { name: "其他", exact: true }).check();
    await dialog
      .getByRole("textbox", { name: "Report content", exact: true })
      .fill("Explicit content");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX103.submit: deliberate Other report sends current exact successful controls once and retains unconfirmed outcome", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  const dialog = await report(page);
  await dialog.getByRole("radio", { name: "其他", exact: true }).check();
  await dialog
    .getByRole("textbox", { name: "Report content", exact: true })
    .fill("Please inspect this post 😀");
  state.token = "FRESH_TOKEN";
  await dialog
    .getByRole("button", { name: "Submit report", exact: true })
    .dblclick();
  await expect(dialog).toContainText("Report result uncertain");
  const writes = requests.filter((r) => r.method === "POST");
  expect(writes).toHaveLength(1);
  expect(writes[0]!.url).toBe(`${origin}/misc.php?mod=report`);
  expect(Object.fromEntries(new URLSearchParams(writes[0]!.body!))).toEqual({
    referer: threadURL,
    reportsubmit: "true",
    rtype: "post",
    rid: "101",
    fid: "5",
    url: threadURL,
    inajax: "1",
    handlekey: "miscreport101",
    formhash: "FRESH_TOKEN",
    message: "Please inspect this post 😀",
    report_select: "其他",
  });
  await expect(
    dialog.getByRole("textbox", { name: "Report content", exact: true }),
  ).toHaveValue("Please inspect this post 😀");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await report(page);
  await expect(dialog).toContainText("previous report result is uncertain");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Report target", exact: true }),
  ).toBeVisible();
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
});
test("UX103.builtin: source reason becomes exact report content and has deliberate submit", async ({
  page,
}) => {
  const { requests } = await open(page);
  const dialog = await report(page);
  await expect(
    dialog.getByRole("button", { name: "Submit report", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("radio", { name: "广告垃圾", exact: true }).check();
  await dialog
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await expect(dialog).toContainText("Report result uncertain");
  const fields = new URLSearchParams(
    requests.find((r) => r.method === "POST")!.body!,
  );
  expect(fields.get("message")).toBe("广告垃圾");
  expect(fields.get("report_select")).toBe("广告垃圾");
});
test("UX103.validation: blank and overlength text are blocked; Unicode codepoints match native 200 limit", async ({
  page,
}) => {
  const { requests } = await open(page);
  const dialog = await report(page);
  await dialog.getByRole("radio", { name: "其他", exact: true }).check();
  const body = dialog.getByRole("textbox", {
      name: "Report content",
      exact: true,
    }),
    submit = dialog.getByRole("button", { name: "Submit report", exact: true });
  await expect(submit).toBeDisabled();
  await body.fill("   ");
  await expect(submit).toBeDisabled();
  await body.fill("😀".repeat(200));
  await expect(submit).toBeEnabled();
  await body.fill("😀".repeat(201));
  await expect(submit).toBeDisabled();
  await expect(body).toHaveValue("😀".repeat(201));
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
for (const mode of [
  "actor",
  "form-actor",
  "permission",
  "target",
  "reasons",
  "hash",
  "hidden",
  "action",
  "generator",
  "rejected",
  "lost",
]) {
  test(`UX103.${mode}: changed authority or outcome cannot replay submitted intent`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    const dialog = await report(page);
    await dialog.getByRole("radio", { name: "广告垃圾", exact: true }).check();
    if (mode === "actor") state.member = "9";
    if (mode === "form-actor") state.formActor = 9;
    if (mode === "permission") state.available = false;
    if (mode === "target") state.wrongTarget = true;
    if (mode === "reasons")
      state.script = state.script.replace(
        "广告垃圾",
        "Different source reason",
      );
    if (mode === "hash") state.hashMismatch = true;
    if (mode === "hidden")
      state.extra = '<input type="hidden" name="unknown" value="effect">';
    if (mode === "action") state.action += "&rid=999";
    if (mode === "generator") state.script += "window.untrustedExecuted=true;";
    if (mode === "rejected" || mode === "lost") state.outcome = mode;
    await dialog
      .getByRole("button", { name: "Submit report", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Submit report", exact: true }),
    ).toHaveCount(0);
    if (mode === "rejected")
      await expect(dialog).toContainText("Report rejected");
    if (mode === "lost")
      await expect(dialog).toContainText("Report result uncertain");
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(
      ["rejected", "lost"].includes(mode) ? 1 : 0,
    );
    expect(
      await page.evaluate(() => Object.hasOwn(window, "untrustedExecuted")),
    ).toBe(false);
  });
}

for (const mode of [
  "counter",
  "keyup",
  "literal",
  "header",
  "disabled",
  "duplicate",
  "named-submit",
]) {
  test(`UX103.form-${mode}: unqualified native authority never offers Submit`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    if (mode === "counter") state.limit = "300";
    if (mode === "keyup") state.keyup = "dstrLenCalc(this, 'checklen', 300);";
    if (mode === "literal") state.script = state.script.replace("','", "''");
    if (mode === "header")
      state.header =
        '<div id="um"><strong><a href="home.php?mod=space&uid=9">Other actor</a></strong></div>';
    if (mode === "disabled") state.disabled = true;
    if (mode === "duplicate")
      state.extra = '<input type="hidden" name="rid" value="101">';
    if (mode === "named-submit")
      state.extra =
        '<button name="report_submit" type="submit" value="true">Send</button>';
    const dialog = await report(page);
    await expect(dialog.getByRole("status")).toContainText(
      /unsupported|conflicts|disabled|ambiguous/,
    );
    await expect(
      dialog.getByRole("button", { name: "Submit report", exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((r) => r.method === "POST")).toEqual([]);
  });
}
test("UX103.unavailable: missing capability stays disabled and native refusal cannot submit", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  state.refused = true;
  const dialog = await report(page);
  await expect(dialog).toContainText("没有权限举报");
  await expect(
    dialog.getByRole("button", { name: "Submit report", exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  state.available = false;
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Post 101 actions", exact: true })
    .click();
  await expect(page.getByRole("menuitem", { name: /Report/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX103.keyboard-narrow: 125% controls fit; native Escape returns exact trigger focus and IME Escape stays open", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { requests } = await open(page);
  await page
    .locator("#tsdm-workspace")
    .evaluate((host) =>
      (host as HTMLElement).style.setProperty("--text-scale", "1.25"),
    );
  const dialog = await report(page, true);
  await dialog.getByRole("radio", { name: "其他", exact: true }).check();
  const body = dialog.getByRole("textbox", {
    name: "Report content",
    exact: true,
  });
  await body.fill("取消此举报");
  const bounds = await dialog.evaluate((el) => ({
    client: el.clientWidth,
    scroll: el.scrollWidth,
    left: el.getBoundingClientRect().left,
    right: el.getBoundingClientRect().right,
    controls: [...el.querySelectorAll("input,textarea,fieldset")].map((n) => ({
      left: n.getBoundingClientRect().left,
      right: n.getBoundingClientRect().right,
    })),
  }));
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.client);
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(390);
  for (const c of bounds.controls) {
    expect(c.left).toBeGreaterThanOrEqual(bounds.left);
    expect(c.right).toBeLessThanOrEqual(bounds.right);
  }
  await dialog
    .getByRole("button", { name: "Cancel", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeInViewport();
  await info.attach("narrow-report.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("bounds.json", {
    body: JSON.stringify(bounds),
    contentType: "application/json",
  });
  await body.focus();
  await body.dispatchEvent("compositionstart", { data: "中" });
  await body.dispatchEvent("keydown", {
    key: "Escape",
    keyCode: 229,
    isComposing: true,
    bubbles: true,
  });
  await expect(dialog).toBeVisible();
  await body.dispatchEvent("compositionend", { data: "中" });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Post 101 actions", exact: true }),
  ).toBeFocused();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});

for (const mode of ["handler", "quote", "entity"]) {
  test(`UX103.source-${mode}: altered source semantics cannot authorize submission`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    if (mode === "handler")
      state.handler = "ajaxpost(this.id, 'different_form');";
    if (mode === "quote")
      state.script = state.script.replace("广告垃圾", 'Reason" altered="value');
    if (mode === "entity")
      state.script = state.script.replace("广告垃圾", "Reason&amp;value");
    const dialog = await report(page);
    await expect(dialog.getByRole("status")).toContainText(/unsupported/);
    await expect(
      dialog.getByRole("button", { name: "Submit report", exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((r) => r.method === "POST")).toEqual([]);
  });
}
test("UX103.localized: authored reporting controls follow Chinese appearance with source reason labels preserved", async ({
  page,
}, info) => {
  const { requests } = await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.keyboard.press("Escape");
  await page.locator("#pid101 .post-menu-trigger").click();
  await page.getByRole("menuitem", { name: "举报", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "举报帖子 101",
    exact: true,
  });
  await dialog.getByRole("radio", { name: "其他", exact: true }).check();
  await dialog
    .getByRole("textbox", { name: "举报内容", exact: true })
    .fill("取消举报");
  await expect(
    dialog.getByRole("button", { name: "提交举报", exact: true }),
  ).toBeEnabled();
  await info.attach("localized-report.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});

test("UX103.legacy-snapshot: absent optional report capability is honest until an explicit fresh thread read", async ({
  page,
}, info) => {
  const { requests } = await open(page);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("tsdm.workspace.recovery")),
    )
    .toContain("reportURL");
  const legacy = await page.evaluate(() => {
    const key = "tsdm.workspace.recovery",
      source = sessionStorage.getItem(key)!;
    const older = JSON.stringify(JSON.parse(source), (name, value) =>
      name === "reportURL" ? undefined : value,
    );
    sessionStorage.setItem(key, older);
    return older;
  });
  await info.attach("legacy-snapshot.json", {
    body: legacy,
    contentType: "application/json",
  });
  await page.addInitScript(
    (snapshot) => sessionStorage.setItem("tsdm.workspace.recovery", snapshot),
    legacy,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Report target", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Post 101 actions", exact: true })
    .click();
  const reportItem = page.getByRole("menuitem", { name: /Report/ });
  await expect(reportItem).toHaveAttribute("aria-disabled", "true");
  await expect(reportItem).toContainText("Availability not verified");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "More thread options", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  const dialog = await report(page);
  await expect(dialog.getByRole("radio")).toHaveCount(5);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
