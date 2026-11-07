import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  openSettings,
  closeSettingsToWorkspace,
  openThreadMore,
  confirmThreadPage,
} from "./navigation-ui";
import {
  visibleCharacter,
  expectCharacter,
  characterObservation,
  rebaseCharacter,
} from "./visible-character";

const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = `${directoryURL}?mod=forumdisplay&fid=5`;
const target = (n: number, reverse = false) =>
  `${directoryURL}?mod=viewthread&tid=42&ordertype=${reverse ? 1 : 2}&page=${n}`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const sourceText =
  "[quote=Composer Nine]保留原文 Cantonese source[/quote]\n[b]Exact integrated reply[/b]\n[table][tr][th]Track[/th][td]完整內容[/td][/tr][/table]";
const directory =
  account +
  [
    [1, "Music", 5, "Music discussion"],
    [2, "Creative", 6, "Creative discussion"],
  ]
    .map(
      ([group, name, id, board]) =>
        `<div class="bm"><div class="bm_h"><h2><a href="forum.php?gid=${group}">${name}</a></h2></div><div id="category_${group}"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=${id}">${board}</a></h2></td></tr></table></div></div>`,
    )
    .join("");
function board(ids: number[]) {
  return `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid">${ids.map((id) => `<tbody id="normalthread_${id}"><tr><th><a class="xst" href="${id === 42 ? target(1) : `${directoryURL}?mod=viewthread&tid=${id}`}">Integrated thread ${id}</a></th><td class="by"><cite>Composer Nine</cite></td></tr></tbody>`).join("")}</table>`;
}
function thread(n: number, reverse: boolean, added: number) {
  const chronological = reverse ? 4 - n : n;
  const ids = [
    chronological * 100,
    chronological * 100 + 1,
    chronological * 100 + 2,
  ];
  if (chronological === 3)
    ids.push(...Array.from({ length: added }, (_, i) => 303 + i));
  if (reverse) ids.reverse();
  if (reverse && n === 1) ids.unshift(10);
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Integrated thread 42</h1>${ids.map((id) => `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum${id}" href="${target(n, reverse)}#pid${id}">${id === 10 ? "-1#" : `${id}#`}</a><div class="pcb"><p>${`Exact post ${id} 完整閱讀。 `.repeat(id === 10 ? 2 : 90)}</p><blockquote><p>Source quotation ${id}</p></blockquote></div></div>`).join("")}</div><div id="postlist_filters"><a href="${target(1, !reverse)}">Reverse source order</a></div><div class="pg">${n > 1 ? `<a class="prev" href="${target(n - 1, reverse)}">Previous</a>` : ""}${[1, 2, 3].map((i) => (i === n ? `<strong>${i}</strong>` : `<a href="${target(i, reverse)}">${i}</a>`)).join("")}<label><input name="custompage" value="${n}" onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=42&ordertype=${reverse ? 1 : 2}&page='+this.value;; doane(event);}"><span title="共 3 页"> / 3 页</span></label>${n < 3 ? `<a class="nxt" href="${target(n + 1, reverse)}">Next</a>` : ""}</div>`;
}
const form = `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="posttime" value="1792550000"><input type="hidden" name="wysiwyg" value="0"><input name="subject" value="Native title"><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Continue</button></form>`;
type Fixture = {
  requests: { method: string; url: string; at: number }[];
  ids: number[];
  added: number;
  fail: boolean;
};
const fixtures = new WeakMap<Page, Fixture>();
async function open(page: Page) {
  const f: Fixture = { requests: [], ids: [42, 43, 44], added: 0, fail: false };
  fixtures.set(page, f);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      u = new URL(request.url());
    if (u.pathname === "/__integration.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native fixture<script src="${origin}/__integration.js"></script></body></html>`,
      });
    f.requests.push({ method: request.method(), url: u.href, at: Date.now() });
    if (request.method() !== "GET")
      return route.fulfill({
        status: 500,
        body: "No write allowed in qualification",
      });
    if (f.fail)
      return route.fulfill({
        status: 403,
        contentType: "text/html",
        body: account + '<div id="messagetext">阅读权限不足</div>',
      });
    const mod = u.searchParams.get("mod");
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        document:
          mod === "forumdisplay"
            ? board(f.ids)
            : mod === "viewthread"
              ? thread(
                  Number(u.searchParams.get("page") ?? 1),
                  u.searchParams.get("ordertype") === "1",
                  f.added,
                )
              : mod === "post"
                ? form
                : directory,
      }),
    });
  });
  await page.goto(directoryURL);
  await expect(page.locator(".overview .board-card")).toHaveCount(2);
  return f;
}
const identities = (page: Page) =>
  page
    .locator(".reading-pane article")
    .evaluateAll((nodes) => nodes.map((n) => n.id));
const selection = (page: Page) =>
  page
    .getByLabel("Complete source", { exact: true })
    .evaluate((n: HTMLTextAreaElement) => ({
      start: n.selectionStart,
      end: n.selectionEnd,
      direction: n.selectionDirection,
      value: n.value,
    }));
test.afterEach(async ({ page }, info) => {
  if (!fixtures.has(page)) return;
  await info.attach("integrated-requests.json", {
    body: JSON.stringify(fixtures.get(page)!.requests),
    contentType: "application/json",
  });
  await info.attach("integrated.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("integrated-state.json", {
    body: JSON.stringify({
      url: page.url(),
      posts: await identities(page),
      text: await page.locator(".workspace").innerText(),
    }),
    contentType: "application/json",
  });
});
for (const width of [375, 779, 1706])
  test(`UI93.integrated-${width}: grouped browse through continuous history, confirmed tools, updates and immutable retained Review`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const f = await open(page);
    await expect(page.locator(".reading-pane")).toHaveCount(0);
    await page
      .getByRole("region", { name: "Boards overview", exact: true })
      .getByRole("link", { name: "Music discussion", exact: true })
      .click();
    await page.locator('.thread-row[data-thread-id="42"] .subject').click();
    const reader = page.locator(".reading-pane");
    await expect(page.getByRole("article")).toHaveCount(3);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await reader.evaluate((n) => (n.scrollTop = n.scrollHeight));
    await expect(page.locator("#pid202")).toBeVisible();
    expect(await identities(page)).toEqual([
      "pid100",
      "pid101",
      "pid102",
      "pid200",
      "pid201",
      "pid202",
    ]);
    await page
      .locator("#pid201 .post-content p")
      .first()
      .evaluate((n) => n.scrollIntoView({ block: "start" }));
    const before = await visibleCharacter(page);
    const requestsBefore = f.requests.length;
    await page.getByRole("button", { name: /^Page 2/ }).click();
    const pages = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    await pages.getByRole("slider", { name: "Page", exact: true }).fill("3");
    await expect(
      pages.getByRole("spinbutton", { name: "Page number", exact: true }),
    ).toHaveValue("3");
    await pages.getByRole("button", { name: "Cancel", exact: true }).click();
    await expectCharacter(before);
    expect(f.requests).toHaveLength(requestsBefore);
    await page
      .getByRole("button", { name: "Reply to thread", exact: true })
      .click();
    const source = page.getByLabel("Complete source", { exact: true });
    await source.fill(sourceText);
    await source.evaluate((n: HTMLTextAreaElement) =>
      n.setSelectionRange(9, 29, "backward"),
    );
    const sourceNode = await source.elementHandle(),
      selected = await selection(page);
    await page
      .getByRole("button", { name: "Expand writing", exact: true })
      .click();
    await page.setViewportSize({ width: 1706, height: 900 });
    const resize = page.getByRole("separator", {
      name: "Resize Writing",
      exact: true,
    });
    await expect(resize).toBeVisible();
    await resize.focus();
    await resize.press("ArrowLeft");
    await expect(source).toHaveValue(sourceText);
    expect(await selection(page)).toEqual(selected);
    await confirmThreadPage(page, 3);
    await expect(page.locator("#pid300")).toBeVisible();
    await (
      await openThreadMore(page)
    )
      .getByRole("menuitem", { name: "Reverse source order", exact: true })
      .click();
    await expect(page.getByText("Newest first", { exact: true })).toBeVisible();
    await confirmThreadPage(page, 1);
    await expect
      .poll(() => identities(page))
      .toEqual(["pid10", "pid302", "pid301", "pid300"]);
    await page
      .locator("#pid301 .post-content p")
      .first()
      .evaluate((n) => n.scrollIntoView({ block: "start" }));
    const newestAnchor = await visibleCharacter(page);
    f.added = 1;
    await (
      await openThreadMore(page)
    )
      .getByRole("menuitem", { name: "Check for new posts", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "New replies (1)", exact: true }),
    ).toBeVisible();
    await expectCharacter(newestAnchor, "screen");
    const ids = await identities(page);
    expect(new Set(ids).size).toBe(ids.length);
    f.ids = [45, 44, 42, 43, 45];
    const rows = await page
      .locator(".thread-row")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("data-thread-id")),
      );
    await page
      .getByRole("button", { name: "Check for new threads", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Show 1 new thread", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator(".thread-row")
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getAttribute("data-thread-id")),
        ),
    ).toEqual(rows);
    await expectCharacter(newestAnchor, "screen");
    await page
      .getByRole("button", { name: "Show 1 new thread", exact: true })
      .click();
    expect(
      await page
        .locator(".thread-row")
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getAttribute("data-thread-id")),
        ),
    ).toEqual(["45", "44", "42", "43"]);
    await expect(source).toHaveValue(sourceText);
    expect(await selection(page)).toEqual(selected);
    await (
      await openThreadMore(page)
    )
      .getByRole("menuitem", { name: "Copy URL", exact: true })
      .click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const canonical = new URL(copied);
    expect(canonical.searchParams.get("tid")).toBe("42");
    expect(canonical.searchParams.get("ordertype")).toBe("1");
    expect(canonical.searchParams.get("page")).toBe("1");
    expect(copied).not.toContain("SYNTHETIC");
    await expect(
      page.getByRole("link", { name: "Continue in native forum", exact: true }),
    ).toHaveAttribute("href", /tid=42.*tsdm-native=1/);
    const resume = page.getByRole("button", {
      name: "Return to writing",
      exact: true,
    });
    if (await resume.isVisible()) await resume.click();
    await expect(source).toBeVisible();
    const observations = [];
    const anchor = await visibleCharacter(page);
    for (const [theme, size, w] of [
      ["Light", 90, 1439],
      ["Alias", 150, 779],
      ["Mono", 100, 375],
      ["Dark", 100, 1706],
    ] as const) {
      await rebaseCharacter(anchor);
      await openSettings(page);
      await page.getByRole("radio", { name: theme, exact: true }).check();
      await page
        .getByRole("slider", { name: "Text size", exact: true })
        .fill(String(size));
      await closeSettingsToWorkspace(page);
      observations.push(await expectCharacter(anchor, "screen"));
      await rebaseCharacter(anchor);
      const reflow = anchor;
      await page.setViewportSize({ width: w, height: 900 });
      await info.attach(`reflow-${theme}-${w}.json`, {
        body: JSON.stringify(await characterObservation(reflow)),
        contentType: "application/json",
      });
      observations.push(await expectCharacter(reflow));
      expect(await selection(page)).toEqual(selected);
      expect(await sourceNode!.evaluate((n) => n.isConnected)).toBe(true);
    }
    if (await resume.isVisible()) await resume.click();
    await expect(source).toBeVisible();
    await source.press("Control+Enter");
    const review = page.getByRole("region", {
      name: "Prepared publication review",
      exact: true,
    });
    await expect(review).toBeVisible();
    expect(await review.locator(".prepared-source").textContent()).toBe(
      sourceText,
    );
    await expect(review).toContainText(
      "Music discussion · Board 5 · Thread 42",
    );
    await expect(review).toContainText("Writing as Writer Seven (7)");
    await openSettings(page);
    await page.getByRole("radio", { name: "Alias", exact: true }).check();
    await closeSettingsToWorkspace(page);
    await page.setViewportSize({ width: 734, height: 560 });
    await review
      .getByRole("button", {
        name: "Cancel review and return to writing",
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    expect(await review.locator(".prepared-source").textContent()).toBe(
      sourceText,
    );
    await info.attach("integrated-review.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await review
      .getByRole("button", {
        name: "Cancel review and return to writing",
        exact: true,
      })
      .click();
    await expect(source).toHaveValue(sourceText);
    expect(f.requests.every((r) => r.method === "GET")).toBe(true);
    await info.attach("integrated-observations.json", {
      body: JSON.stringify({
        initialWidth: width,
        selected,
        observations,
        copied,
        ids,
        rows,
      }),
      contentType: "application/json",
    });
  });

test("UI93.recovery-error: an integrated unsent reply reloads passively with truthful account warning, and fresh permission failure retains source and native escape", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const f = await open(page);
  await page
    .getByRole("region", { name: "Boards overview", exact: true })
    .getByRole("link", { name: "Music discussion", exact: true })
    .click();
  await page.locator('.thread-row[data-thread-id="42"] .subject').click();
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const source = page.getByLabel("Complete source", { exact: true });
  await source.fill(sourceText);
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  const prior = f.requests.length;
  await page.reload();
  await expect(page.locator(".navigation-account")).toHaveText(
    "Snapshot from Writer Seven",
  );
  await expect(
    page.getByText(
      "Restored snapshot — account and content have not been rechecked.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(f.requests).toHaveLength(prior);
  const resume = page.getByRole("button", {
    name: "Return to writing",
    exact: true,
  });
  if (await resume.isVisible()) await resume.click();
  await expect(source).toHaveValue(sourceText);
  await expect(
    page.getByRole("group", { name: "Writing destination", exact: true }),
  ).toContainText("Thread 42");
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  f.fail = true;
  await (
    await openThreadMore(page)
  )
    .getByRole("menuitem", { name: "Refresh thread", exact: true })
    .click();
  await expect(page.getByText(/Check failed/)).toBeVisible();
  await page
    .getByLabel("Thread history", { exact: true })
    .getByLabel("Check details", { exact: true })
    .click();
  await expect(
    page.getByText(
      "The current account does not have permission to read this thread.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(f.requests).toHaveLength(prior + 1);
  await expect(source).toHaveValue(sourceText);
  await expect(
    page.getByRole("link", { name: "Continue in native forum", exact: true }),
  ).toHaveAttribute("href", /tid=42.*tsdm-native=1/);
  expect(f.requests.every((r) => r.method === "GET")).toBe(true);
  await info.attach("recovered-unsent-source.txt", {
    body: await source.inputValue(),
    contentType: "text/plain",
  });
});
