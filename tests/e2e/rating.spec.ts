import {
  loadThreadRange,
  clickThreadTool,
  confirmThreadPage,
} from "./navigation-ui";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  origin,
  threadURL,
  createRatingFixture,
  renderRatingResponse,
} from "./rating-fixture";
const ledger = new WeakMap<
  Page,
  { url: string; method: string; body: string | null }[]
>();
async function open(page: Page, nativeKeys = false, adjacent = false) {
  const requests: { url: string; method: string; body: string | null }[] = [];
  ledger.set(page, requests);
  const state = createRatingFixture();
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
        body: `<html><body ${nativeKeys ? 'onkeydown="if(event.keyCode==27) return false;"' : ""}><script src="${origin}/__entry.js"></script></body></html>`,
      });
    requests.push({ url: u.href, method: r.method(), body: r.postData() });
    const response = renderRatingResponse(
      state,
      { url: r.url(), method: r.method(), body: r.postData() },
      adjacent,
    );
    if (response.abort) return route.abort();
    return route.fulfill(response);
  });
  await page.goto(threadURL);
  await expect(
    page.getByRole("heading", { name: "Rating target", exact: true }),
  ).toBeVisible();
  return { state, requests };
}
async function rate(page: Page, right = false) {
  if (right)
    await page.locator("#pid101 .post-author").click({ button: "right" });
  else
    await page
      .getByRole("button", { name: "Post 101 actions", exact: true })
      .click();
  await page.getByRole("menuitem", { name: "Rate", exact: true }).click();
  return page.getByRole("dialog", { name: "Rate post 101", exact: true });
}
test.afterEach(async ({ page }, info) => {
  await info.attach("rating-requests.json", {
    body: JSON.stringify(ledger.get(page), null, 2),
    contentType: "application/json",
  });
  await info.attach("rating.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
test("UX102.cancel: both menu entries show source choices and consequences; opening and cancelling never submits", async ({
  page,
}) => {
  const { requests } = await open(page);
  for (const right of [false, true]) {
    const dialog = await rate(page, right);
    await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toHaveValue(
      "0",
    );
    await expect(dialog).toContainText("10");
    await expect(dialog).toContainText("Other author");
    await expect(dialog.getByRole("checkbox")).not.toBeChecked();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.confirm: one deliberate submission uses the exact current post and choices; independent fresh rating log confirms it", async ({
  page,
}) => {
  const { requests } = await open(page);
  const dialog = await rate(page);
  await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
  await dialog
    .getByRole("textbox", { name: "Reason (optional)" })
    .fill("Thanks");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Submit rating", exact: true })
    .dblclick();
  await expect(dialog).toContainText("Rating confirmed");
  const writes = requests.filter((r) => r.method === "POST");
  expect(writes).toHaveLength(1);
  expect(new URL(writes[0]!.url).searchParams.get("ratesubmit")).toBe("yes");
  expect(Object.fromEntries(new URLSearchParams(writes[0]!.body!))).toEqual({
    formhash: "SYNTHETIC_TOKEN",
    tid: "42",
    pid: "101",
    referer: threadURL,
    handlekey: "rate",
    score4: "2",
    score5: "0",
    reason: "Thanks",
    sendreasonpm: "on",
    ratesubmit: "true",
  });
  expect(
    requests.filter(
      (r) => new URL(r.url).searchParams.get("action") === "viewratings",
    ),
  ).toHaveLength(2);
});
for (const scenario of [
  "stale-account",
  "stale-target",
  "stale-form",
  "permission",
  "rejected",
  "lost",
  "unconfirmed",
]) {
  test(`UX102.${scenario}: retain exact intent and report truthful outcome without automatic retry`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    const dialog = await rate(page);
    await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
    await dialog
      .getByRole("textbox", { name: "Reason (optional)" })
      .fill("Thanks");
    if (scenario === "stale-account") state.member = "9";
    if (scenario === "stale-target") state.mismatch = true;
    if (scenario === "stale-form") state.scoreMax = 2;
    if (scenario === "permission") state.refused = true;
    if (["rejected", "lost", "unconfirmed"].includes(scenario))
      state.outcome = scenario;
    await dialog
      .getByRole("button", { name: "Submit rating", exact: true })
      .click();
    await expect(dialog).toContainText(
      scenario === "rejected"
        ? "Rating rejected"
        : scenario === "lost" || scenario === "unconfirmed"
          ? "Rating result uncertain"
          : scenario === "permission"
            ? "没有权限"
            : scenario === "stale-target"
              ? "different post"
              : scenario === "stale-form"
                ? "choices or allowance changed"
                : "account, post or rating permission changed",
    );
    await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toHaveValue(
      "2",
    );
    await expect(
      dialog.getByRole("textbox", { name: "Reason (optional)" }),
    ).toHaveValue("Thanks");
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(
      ["rejected", "lost", "unconfirmed"].includes(scenario) ? 1 : 0,
    );
    if (scenario === "lost" || scenario === "unconfirmed") {
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await rate(page);
      await expect(dialog).toContainText("previous rating result is uncertain");
      expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Rating target", exact: true }),
      ).toBeVisible();
      expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
    }
  });
}
test("UX102.unavailable: missing capability remains disabled and permission refusal never offers submit", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  state.refused = true;
  const dialog = await rate(page);
  await expect(dialog).toContainText("没有权限");
  await expect(
    dialog.getByRole("button", { name: "Submit rating" }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  state.available = false;
  await clickThreadTool(page, "Refresh thread");
  await page
    .getByRole("button", { name: "Post 101 actions", exact: true })
    .click();
  await expect(page.getByRole("menuitem", { name: /Rate/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.native-log-shape: current TD header and native empty XML log support independent readback", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  state.outcome = "native";
  const dialog = await rate(page);
  await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
  await dialog
    .getByRole("textbox", { name: "Reason (optional)" })
    .fill("Thanks");
  await dialog
    .getByRole("button", { name: "Submit rating", exact: true })
    .click();
  await expect(dialog).toContainText("Rating confirmed");
  expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
});
test("UX102.keyboard: Escape cancels rating and restores focus to the post menu trigger", async ({
  page,
}) => {
  const { requests } = await open(page);
  await rate(page);
  await expect(page.getByRole("spinbutton", { name: /天然/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Rate post 101" }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Post 101 actions", exact: true }),
  ).toBeFocused();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.form-choices: native suggested reason is optional and cancellation has no effect", async ({
  page,
}) => {
  const { requests } = await open(page);
  const dialog = await rate(page);
  await dialog
    .getByRole("combobox", { name: "Suggested reason" })
    .selectOption("很给力!");
  await expect(
    dialog.getByRole("textbox", { name: "Reason (optional)" }),
  ).toHaveValue("很给力!");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
for (const scenario of ["checkbox", "form-account", "limits"]) {
  test(`UX102.form-${scenario}: unfamiliar or changed form semantics cannot submit`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    const dialog = await rate(page);
    await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
    if (scenario === "checkbox") state.changedCheckbox = true;
    if (scenario === "form-account") state.formActor = "9";
    if (scenario === "limits") state.malformed = true;
    await dialog
      .getByRole("button", { name: "Submit rating", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Submit rating", exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((r) => r.method === "POST")).toEqual([]);
  });
}
test("UX102.native-envelope: exact native popup parameters and actor/token-bound structured form are required", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  state.outcome = "envelope";
  const dialog = await rate(page);
  await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toBeVisible();
  const forms = requests.filter(
    (r) => new URL(r.url).searchParams.get("action") === "rate",
  );
  expect(forms).toHaveLength(1);
  expect(new URL(forms[0]!.url).searchParams.get("inajax")).toBe("1");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
for (const mode of ["structured-log", "log-account"]) {
  test(`UX102.${mode}: qualified no-record key and current actor determine log confirmation`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    state.outcome = mode;
    const dialog = await rate(page);
    await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
    await dialog
      .getByRole("textbox", { name: "Reason (optional)" })
      .fill("Thanks");
    await dialog
      .getByRole("button", { name: "Submit rating", exact: true })
      .click();
    await expect(dialog).toContainText(
      mode === "structured-log"
        ? "Rating confirmed"
        : "Rating result uncertain",
    );
    expect(requests.filter((r) => r.method === "POST")).toHaveLength(1);
  });
}
test("UX102.envelope-hash: mismatched native actor/form authority cannot submit", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  const dialog = await rate(page);
  await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
  state.hashMismatch = true;
  await dialog
    .getByRole("button", { name: "Submit rating", exact: true })
    .click();
  await expect(dialog).toContainText("authority does not match");
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.narrow: qualified form remains reachable on a narrow viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { requests } = await open(page);
  const dialog = await rate(page);
  await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await dialog
    .getByRole("button", { name: "Cancel", exact: true })
    .scrollIntoViewIfNeeded();
  await info.attach("narrow-rate.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.localized: authored rating controls follow Chinese appearance while native choices remain unchanged", async ({
  page,
}, info) => {
  const { requests } = await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.keyboard.press("Escape");
  await page.locator("#pid101 .post-menu-trigger").click();
  await page.getByRole("menuitem", { name: "评分", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "为帖子 101 评分",
    exact: true,
  });
  await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "提交评分", exact: true }),
  ).toBeVisible();
  await info.attach("rating-chinese.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
for (const mode of ["foreign-query", "hidden-score"]) {
  test(`UX102.${mode}: contradictory native form action or control type never becomes submission authority`, async ({
    page,
  }) => {
    const { state, requests } = await open(page);
    const dialog = await rate(page);
    await dialog.getByRole("spinbutton", { name: /天然/ }).fill("2");
    if (mode === "foreign-query") state.foreignQuery = true;
    else state.hiddenScore = true;
    await dialog
      .getByRole("button", { name: "Submit rating", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Submit rating", exact: true }),
    ).toHaveCount(0);
    expect(requests.filter((r) => r.method === "POST")).toEqual([]);
  });
}
test("UX102.local-values: zero, fractional and out-of-range choices cannot activate submit", async ({
  page,
}) => {
  const { requests } = await open(page);
  const dialog = await rate(page);
  const submit = dialog.getByRole("button", {
      name: "Submit rating",
      exact: true,
    }),
    score = dialog.getByRole("spinbutton", { name: /天然/ });
  await expect(submit).toBeDisabled();
  for (const value of ["4", "1.5", "-4"]) {
    await score.fill(value);
    await expect(submit).toBeDisabled();
  }
  await score.fill("2");
  await expect(submit).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.native-notification: checkbox defaults follow the returned form and cancellation never notifies", async ({
  page,
}) => {
  const { state, requests } = await open(page);
  state.notifyChecked = true;
  const dialog = await rate(page);
  await expect(dialog.getByRole("checkbox")).toBeChecked();
  await dialog.getByRole("checkbox").uncheck();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.enlarged-native: controls fit inside the narrow enlarged native-host dialog and actions remain reachable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { requests } = await open(page, true);
  await page
    .locator("#tsdm-workspace")
    .evaluate((host) =>
      (host as HTMLElement).style.setProperty("--text-scale", "1.25"),
    );
  const dialog = await rate(page);
  await expect(dialog.getByRole("spinbutton", { name: /天然/ })).toBeVisible();
  const bounds = await dialog.evaluate((el) => ({
    client: el.clientWidth,
    scroll: el.scrollWidth,
    rect: {
      x: el.getBoundingClientRect().x,
      right: el.getBoundingClientRect().right,
    },
    controls: [...el.querySelectorAll("input,select,fieldset")].map((c) => ({
      tag: c.tagName,
      type: c.getAttribute("type"),
      x: c.getBoundingClientRect().x,
      right: c.getBoundingClientRect().right,
      min: getComputedStyle(c).minWidth,
    })),
  }));
  await info.attach("enlarged-layout.json", {
    body: JSON.stringify(bounds, null, 2),
    contentType: "application/json",
  });
  await info.attach("enlarged-rate.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.client);
  for (const control of bounds.controls) {
    expect(control.x).toBeGreaterThanOrEqual(bounds.rect.x);
    expect(control.right).toBeLessThanOrEqual(bounds.rect.right);
  }
  const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
  await cancel.scrollIntoViewIfNeeded();
  await expect(cancel).toBeInViewport();
  await cancel.click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.native-escape: Escape inside rating cancels before the native body veto without submitting", async ({
  page,
}) => {
  const { requests } = await open(page, true);
  const dialog = await rate(page);
  await dialog.getByRole("textbox", { name: "Reason (optional)" }).focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Post 101 actions", exact: true }),
  ).toBeFocused();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
test("UX102.native-composition: an IME Escape event cannot dismiss or submit the rating form", async ({
  page,
}) => {
  const { requests } = await open(page, true);
  const dialog = await rate(page);
  const reason = dialog.getByRole("textbox", { name: "Reason (optional)" });
  await reason.focus();
  await reason.dispatchEvent("compositionstart", { data: "中" });
  await reason.dispatchEvent("keydown", {
    key: "Escape",
    keyCode: 229,
    isComposing: true,
    bubbles: true,
  });
  await expect(dialog).toBeVisible();
  await reason.dispatchEvent("compositionend", { data: "中" });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});

test("UX112.adjacent-rating: an appended post discovers its own fresh source form without sending", async ({
  page,
}) => {
  const { requests } = await open(page, false, true);
  await loadThreadRange(page, "later");
  await expect(
    page.getByRole("article", { name: "Post 101", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Post 201 actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Rate", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Rate post 201",
    exact: true,
  });
  await expect(dialog.getByRole("spinbutton")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
  expect(
    requests
      .filter((r) => new URL(r.url).searchParams.get("mod") === "viewthread")
      .at(-1)?.url,
  ).toContain("page=2");
});

test("UX112.adjacent-author: a newly encountered author retains the native filter from the appended page", async ({
  page,
}) => {
  const { requests } = await open(page, false, true);
  await loadThreadRange(page, "later");
  await page
    .getByRole("button", { name: "Post 201 actions", exact: true })
    .click();
  const filter = page.getByRole("menuitem", {
    name: "Show only this author's posts",
    exact: true,
  });
  await expect(filter).toHaveAttribute("href", `${threadURL}&authorid=9`);
  await filter.click();
  await expect
    .poll(() =>
      requests.some((r) => new URL(r.url).searchParams.get("authorid") === "9"),
    )
    .toBe(true);
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});

test("UX112.adjacent-author-cache: retained source filters survive history return and fresh removal changes only their own source", async ({
  page,
}) => {
  const { state, requests } = await open(page, false, true);
  await loadThreadRange(page, "later");
  await confirmThreadPage(page, 3);
  await expect(
    page.getByRole("button", { name: "Post 201 actions", exact: true }),
  ).toHaveCount(0);
  await clickThreadTool(page, "Back");
  await page
    .getByRole("button", { name: "Post 201 actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", {
      name: "Show only this author's posts",
      exact: true,
    }),
  ).toHaveAttribute("href", `${threadURL}&authorid=9`);
  await page.keyboard.press("Escape");
  state.authorFilter = false;
  await clickThreadTool(page, "Refresh thread");
  await page
    .getByRole("button", { name: "Post 201 actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /Show only this author's posts/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Post 101 actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", {
      name: "Show only this author's posts",
      exact: true,
    }),
  ).toHaveAttribute("href", `${threadURL}&authorid=8`);
  expect(requests.filter((r) => r.method === "POST")).toEqual([]);
});
