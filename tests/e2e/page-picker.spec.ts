import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "https://www.tsdm39.com";
const base = `${origin}/forum.php?mod=viewthread&tid=42`;
const target = (n: number, context = "") =>
  `${base}&page=${n}${context}&_dsign=returned-page-${n}`;
const ledgers = new WeakMap<Page, string[]>();
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
function fixture(n: number, context = "", total = 3) {
  const ids = [n * 100, n * 100 + 1, n * 100 + 2];
  if (context.includes("ordertype=1")) ids.reverse();
  return `${account}<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></div><div id="postlist"><h1 id="thread_subject">Confirmed page history</h1>${ids.map((id, i) => `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Reader Nine</a></div><a id="postnum${id}" href="${target(n, context)}#pid${id}">${i + 1}</a><em id="authorposton${id}">2026-11-07</em><div class="pcb"><p>${`Page ${n}, post ${id} actual text. `.repeat(35 + i * 20)}</p></div></div>`).join("")}</div><div class="pg">${n > 1 ? `<a class="prev" href="${target(n - 1, context)}">Previous source page</a>` : ""}${[
    ...new Set([1, 2, 3, n]),
  ]
    .filter((p) => p <= total)
    .sort((a, b) => a - b)
    .map((p) =>
      p === n
        ? `<strong>${p}</strong>`
        : `<a href="${target(p, context)}">${p}</a>`,
    )
    .join(
      "",
    )}<label><input name="custompage" value="${n}"><span title="共 ${total} 页"> / ${total} 页</span></label>${n < total ? `<a class="nxt" href="${target(n + 1, context)}">Next source page</a>` : ""}</div>`;
}
async function open(
  page: Page,
  initial = 2,
  context = "",
  transform: (html: string, url: URL) => string = (html) => html,
) {
  const requests: string[] = [];
  ledgers.set(page, requests);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/__page86.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__page86.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document: transform(
          fixture(Number(url.searchParams.get("page") ?? 1), context),
          url,
        ),
      }),
    });
  });
  await page.goto(target(initial, context));
  await expect(
    page.getByRole("heading", { name: "Confirmed page history", exact: true }),
  ).toBeVisible();
  return requests;
}
test.afterEach(async ({ page }, info) => {
  if (!ledgers.has(page)) return;
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  await info.attach("page-picker.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  if (await page.locator(".reading-pane").count())
    await info.attach("reading-geometry.json", {
      body: JSON.stringify(
        await page.locator(".reading-pane").evaluate((pane) => ({
          scroll: pane.scrollTop,
          rect: pane.getBoundingClientRect().toJSON(),
          posts: [...pane.querySelectorAll("article")].map((p) => ({
            id: p.id,
            rect: p.getBoundingClientRect().toJSON(),
          })),
        })),
      ),
      contentType: "application/json",
    });
});

function nativeJump(html: string, context: string, total = 7) {
  const page = Number(html.match(/name="custompage" value="(\d+)"/)![1]);
  const native = fixture(page, context, total);
  return (
    html.slice(0, html.indexOf('<div class="pg">')) +
    native.slice(native.indexOf('<div class="pg">'))
  )
    .replace(
      /name="custompage" value="(\d+)"/,
      `name="custompage" value="$1" onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=42&extra=page%3D1${context}&page='+this.value;; doane(event);}"`,
    )
    .replace(
      'title="共 3 页"> / 3 页',
      `title="共 ${total} 页"> / ${total} 页`,
    );
}

test("UI86.recovery-capability: valid native page metadata survives passive reload while malformed jump targets are visibly refused", async ({
  page,
}) => {
  const requests = await open(page, 2, "", (html) => nativeJump(html, ""));
  await page.reload();
  await page.getByRole("button", { name: /^Page 2/ }).click();
  await expect(
    page.getByRole("slider", { name: "Page", exact: true }),
  ).toHaveAttribute("max", "7");
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.context().addInitScript(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    for (const entry of Object.values(record.entries)) {
      const item = entry as {
        result?: { kind: string; thread?: { pageJump?: unknown } };
      };
      if (item.result?.kind === "thread" && item.result.thread)
        item.result.thread.pageJump = {
          total: 7,
          url: "https://foreign.invalid/forum.php?mod=viewthread&tid=99&page=1",
        };
    }
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  await page.reload();
  await expect(
    page.getByText("Stored recovery data is incompatible or malformed.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
});

test("UI86.native-bounds: qualified native jump supports unlisted exact pages and preserves returned order/filter context without premature navigation", async ({
  page,
}) => {
  const context = "&authorid=9&ordertype=1";
  const requests = await open(page, 2, context, (html) =>
    nativeJump(html, context),
  );
  await page.getByRole("button", { name: /^Page 2/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  const slider = dialog.getByRole("slider", { name: "Page", exact: true });
  const input = dialog.getByRole("spinbutton", {
    name: "Page number",
    exact: true,
  });
  const go = dialog.getByRole("button", { name: "Go", exact: true });
  await expect(slider).toHaveAttribute("min", "1");
  await expect(slider).toHaveAttribute("max", "7");
  await expect(dialog.getByText("7 pages", { exact: true })).toBeVisible();
  for (const invalid of ["0", "8", "2.5", ""]) {
    await input.fill(invalid);
    await expect(go).toBeDisabled();
  }
  await input.fill("6");
  await expect(slider).toHaveValue("6");
  expect(requests).toHaveLength(1);
  await go.click();
  await expect(page.getByRole("button", { name: /^Page 6/ })).toBeVisible();
  const url = new URL(requests[1]!.slice(4));
  expect(url.searchParams.get("page")).toBe("6");
  expect(url.searchParams.get("ordertype")).toBe("1");
  expect(url.searchParams.get("authorid")).toBe("9");
  expect(url.searchParams.get("extra")).toBe("page=1");
  expect(url.searchParams.has("_dsign")).toBe(false);
});

for (const variant of [
  "unknown-handler",
  "wrong-thread",
  "wrong-filter",
  "wrong-order",
  "foreign-origin",
  "inconsistent-total",
  "missing-total",
  "current-mismatch",
  "duplicate-conflict",
  "post-authored",
] as const) {
  test(`UI86.bounds-${variant}: unqualified native jump does not invent unsupported targets`, async ({
    page,
  }) => {
    const requests = await open(page, 2, "", (html) => {
      const source = nativeJump(html, "");
      if (variant === "unknown-handler")
        return source.replace("window.location=", "someOtherNavigation=");
      if (variant === "wrong-thread")
        return source.replace("tid=42&extra", "tid=99&extra");
      if (variant === "wrong-filter")
        return source.replace("tid=42&extra", "tid=42&authorid=99&extra");
      if (variant === "wrong-order")
        return source.replace("tid=42&extra", "tid=42&ordertype=1&extra");
      if (variant === "foreign-origin")
        return source.replace(
          "window.location='forum.php",
          "window.location='https://other.invalid/forum.php",
        );
      if (variant === "inconsistent-total")
        return source.replace('title="共 7 页"', 'title="共 1 页"');
      if (variant === "missing-total")
        return source.replace('title="共 7 页"> / 7 页', 'title="未知"> 未知');
      if (variant === "current-mismatch")
        return source.replace(
          'name="custompage" value="2"',
          'name="custompage" value="1"',
        );
      if (variant === "duplicate-conflict")
        return (
          source +
          source
            .slice(source.indexOf('<div class="pg">'))
            .replace('title="共 7 页"', 'title="共 9 页"')
        );
      return html.replace(
        '<div class="pcb">',
        `<div class="pcb">${source.slice(source.indexOf('<div class="pg">'))}`,
      );
    });
    await page.getByRole("button", { name: /^Page 2/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    await expect(
      dialog.getByText(
        "The total is unknown. Only pages returned by the forum are available.",
        { exact: true },
      ),
    ).toBeVisible();
    await dialog
      .getByRole("spinbutton", { name: "Page number", exact: true })
      .fill("6");
    await expect(
      dialog.getByRole("button", { name: "Go", exact: true }),
    ).toBeDisabled();
    expect(requests).toHaveLength(1);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.locator(".reading-pane article").first()).toHaveAttribute(
      "id",
      "pid200",
    );
  });
}

test("UI86.confirm: slider and exact entry stay pending, Cancel and Escape preserve reading, and Go uses the exact returned target", async ({
  page,
}) => {
  const requests = await open(page, 2, "&authorid=9");
  const trigger = page.getByRole("button", { name: /^Page 2/ });
  const before = await page
    .locator(".reading-pane")
    .evaluate((p) => p.scrollTop);
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  const input = dialog.getByRole("spinbutton", {
    name: "Page number",
    exact: true,
  });
  const slider = dialog.getByRole("slider", { name: "Page", exact: true });
  await expect(input).toHaveValue("2");
  await input.fill("3");
  await expect(slider).toHaveValue("3");
  expect(requests).toHaveLength(1);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator(".reading-pane").evaluate((p) => p.scrollTop)).toBe(
    before,
  );
  await trigger.click();
  await expect(input).toHaveValue("2");
  await slider.focus();
  await slider.press("Home");
  await expect(input).toHaveValue("1");
  await slider.press("Escape");
  await expect(dialog).toBeHidden();
  expect(requests).toHaveLength(1);
  expect(await page.locator(".reading-pane").evaluate((p) => p.scrollTop)).toBe(
    before,
  );
  await trigger.click();
  await input.fill("3");
  await dialog.getByRole("button", { name: "Go", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Page 3/ })).toBeVisible();
  await expect(page.locator(".reading-pane article").first()).toHaveAttribute(
    "id",
    "pid300",
  );
  expect(requests).toHaveLength(2);
  expect(new URL(requests[1]!.slice(4)).searchParams.get("_dsign")).toBe(
    "returned-page-3",
  );
  expect(new URL(requests[1]!.slice(4)).searchParams.get("authorid")).toBe("9");
});

for (const context of ["", "&ordertype=2", "&ordertype=1&authorid=9"]) {
  test(`UI86.position${context || "-default"}: Page follows actual visible loaded posts, preserves anchors and marks only the real terminal end`, async ({
    page,
  }) => {
    const firstPage = context.includes("ordertype=1") ? 3 : 1;
    const lastPage = firstPage === 1 ? 3 : 1;
    const requests = await open(page, 2, context);
    const pane = page.getByRole("region", {
      name: "Thread reading",
      exact: true,
    });
    await pane.evaluate((p) => {
      p.scrollTop = 180;
    });
    await expect.poll(() => pane.evaluate((p) => p.scrollTop)).toBe(180);
    await expect(page.locator(".conversation-heading")).toHaveAttribute(
      "data-compact",
      "true",
    );
    // Let the real scroll/title-restoration frames settle before a second user scroll.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await pane.evaluate((p) => {
      p.scrollTop = 1;
    });
    await expect(pane.locator("article")).toHaveCount(6);
    // Prepending preserves page 2's anchor, which can expose the tail of page 1 above it.
    await expect
      .poll(() =>
        pane.evaluate((p) => {
          const top = p.getBoundingClientRect().top;
          const post = [...p.querySelectorAll("article")].find(
            (post) => post.getBoundingClientRect().bottom > top + 1,
          )!;
          const trigger = (p.getRootNode() as ShadowRoot).querySelector(
            ".reader-page-trigger",
          )!;
          return (
            trigger.textContent!.trim() ===
            `Page ${Math.floor(Number(post.id.slice(3)) / 100)}`
          );
        }),
      )
      .toBe(true);
    await pane.evaluate((p) => {
      p.scrollTop = 0;
    });
    await expect(
      page.getByRole("button", { name: `Page ${firstPage}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: `Page ${firstPage}` }).click();
    const dialog = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    await expect(
      dialog.getByRole("spinbutton", { name: "Page number", exact: true }),
    ).toHaveValue(String(firstPage));
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await page
      .getByRole("button", { name: "More thread options", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Copy URL", exact: true }).click();
    await expect(page.getByText("URL copied", { exact: true })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const copiedURL = new URL(copied);
    expect(copiedURL.searchParams.get("page")).toBe(String(firstPage));
    expect(copiedURL.searchParams.get("ordertype")).toBe(
      new URL(target(2, context)).searchParams.get("ordertype"),
    );
    expect(copiedURL.searchParams.get("authorid")).toBe(
      new URL(target(2, context)).searchParams.get("authorid"),
    );
    await pane.locator("#pid201").evaluate((post) => {
      const pane = post.closest(".reading-pane")!;
      pane.scrollTop +=
        post.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        35;
    });
    await expect(page.getByRole("button", { name: /^Page 2/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /End of thread/ }),
    ).toHaveCount(0);
    await pane.evaluate((p) => {
      p.scrollTop = p.scrollHeight;
    });
    await expect(pane.locator("article")).toHaveCount(9);
    await pane.evaluate((p) => {
      p.scrollTop = p.scrollHeight;
    });
    await expect(
      page.getByRole("button", {
        name: new RegExp(`^Page ${lastPage}.*End of thread`),
      }),
    ).toBeVisible();
    expect(
      await pane
        .locator("article")
        .evaluateAll((posts) => posts.map((p) => p.id)),
    ).toEqual(
      [firstPage, 2, lastPage].flatMap((n) =>
        [0, 1, 2].map((i) => `pid${n * 100 + i}`),
      ),
    );
    await expect(
      pane.getByRole("navigation", { name: "Pages", exact: true }),
    ).toHaveCount(0);
    expect(requests).toHaveLength(3);
    await page.goto(copied);
    await expect(
      page.getByRole("button", { name: `Page ${firstPage}`, exact: true }),
    ).toBeVisible();
    await expect(pane.locator("article")).toHaveCount(3);
    await expect(pane.locator("article").first()).toHaveAttribute(
      "id",
      `pid${firstPage * 100}`,
    );
  });
}

test("UI86.manual-details: deliberate adjacent loading remains available in Page details without routine reader pagination", async ({
  page,
}) => {
  const requests = await open(page);
  await expect(
    page.getByRole("button", { name: "Load earlier", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Load later", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Page 2/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  await dialog.getByText("Supported navigation", { exact: true }).click();
  await dialog
    .getByRole("button", { name: "Load earlier", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".reading-pane article")).toHaveCount(6);
  expect(requests).toHaveLength(2);
});

for (const viewport of [
  { width: 390, height: 480 },
  { width: 1280, height: 400 },
]) {
  test(`UI86.dialog-${viewport.width}: keyboard, outside dismissal and explicit actions remain contained in a short viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const requests = await open(page, 2, "", (html) => nativeJump(html, ""));
    const trigger = page.getByRole("button", { name: /^Page 2/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    const input = dialog.getByRole("spinbutton", {
      name: "Page number",
      exact: true,
    });
    const controls = await dialog.evaluate((node) => {
      const range = node
        .querySelector('input[type="range"]')!
        .getBoundingClientRect();
      const number = node
        .querySelector('input[type="number"]')!
        .getBoundingClientRect();
      return { range: range.toJSON(), number: number.toJSON() };
    });
    expect(controls.range.height).toBeGreaterThanOrEqual(44);
    expect(controls.number.height).toBeGreaterThanOrEqual(44);
    expect(controls.number.top).toBeGreaterThanOrEqual(controls.range.bottom);
    await input.fill("7");
    const go = dialog.getByRole("button", { name: "Go", exact: true });
    await go.focus();
    await expect(go).toBeInViewport();
    const geometry = await dialog.evaluate((node) => ({
      rect: node.getBoundingClientRect().toJSON(),
      width: innerWidth,
      height: innerHeight,
    }));
    expect(geometry.rect.left).toBeGreaterThanOrEqual(0);
    expect(geometry.rect.right).toBeLessThanOrEqual(geometry.width);
    expect(geometry.rect.bottom).toBeLessThanOrEqual(geometry.height);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await input.fill("7");
    await page
      .locator('.dialog-overlay[data-state="open"]')
      .click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeHidden();
    expect(requests).toHaveLength(1);
    await trigger.click();
    await expect(input).toHaveValue("2");
    await test.info().attach("short-dialog-geometry.json", {
      body: JSON.stringify(geometry),
      contentType: "application/json",
    });
  });
}

test("UI86.terminal-geometry: reaching and leaving the terminal post does not resize the persistent reader heading", async ({
  page,
}) => {
  await open(page, 3);
  const pane = page.locator(".reading-pane");
  await pane.locator("#pid301").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 30;
  });
  await expect(page.locator(".conversation-heading")).toHaveAttribute(
    "data-compact",
    "true",
  );
  const before = await page
    .locator(".conversation-heading")
    .evaluate((node) => node.getBoundingClientRect().height);
  await pane.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(
    page.getByRole("button", { name: /End of thread/ }),
  ).toBeVisible();
  const after = await page
    .locator(".conversation-heading")
    .evaluate((node) => node.getBoundingClientRect().height);
  expect(after).toBeCloseTo(before, 1);
});

test("UI86.single-bound: a qualified one-page source disables dragging and rejects page two", async ({
  page,
}) => {
  const requests = await open(page, 1, "", (html) => nativeJump(html, "", 1));
  await page.getByRole("button", { name: /^Page 1/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thread pages",
    exact: true,
  });
  await expect(dialog.getByRole("slider")).toBeDisabled();
  await expect(dialog.getByRole("slider")).toHaveAttribute("max", "1");
  await dialog.getByRole("spinbutton").fill("2");
  await expect(
    dialog.getByRole("button", { name: "Go", exact: true }),
  ).toBeDisabled();
  expect(requests).toHaveLength(1);
});

test("UI86.refresh-bounds: fresh qualified responses upgrade, update and withdraw stale page-jump capability", async ({
  page,
}) => {
  let total: number | null = null;
  const requests = await open(page, 2, "", (html) =>
    total === null ? html : nativeJump(html, "", total),
  );
  for (const next of [7, 9, null]) {
    total = next;
    await page
      .getByRole("button", { name: "More thread options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Refresh thread", exact: true })
      .click();
    await page.getByRole("button", { name: /^Page 2/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Thread pages",
      exact: true,
    });
    if (next === null)
      await expect(
        dialog.getByText(
          "The total is unknown. Only pages returned by the forum are available.",
          { exact: true },
        ),
      ).toBeVisible();
    else
      await expect(dialog.getByRole("slider")).toHaveAttribute(
        "max",
        String(next),
      );
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  }
  expect(requests).toHaveLength(4);
});
