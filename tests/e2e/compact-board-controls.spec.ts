import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
});
const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const row = (id: number, pinned = false) =>
  `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${id}">${pinned ? "Pinned guide" : "Ordinary discussion"} ${id}</a></th><td class="by"><cite>Author Nine</cite></td></tr></tbody>`;
function board(stats = true) {
  return `${account}<div id="ct"><h1><a href="${boardURL}">音樂討論</a>${stats ? '<span class="xs1 xw0 i">今日: <strong class="xi1">0</strong><span class="pipe">|</span>主题: <strong class="xi1">7587</strong><span class="pipe">|</span>排名: <strong class="xi1" title="上次排名:438">15</strong></span>' : ""}</h1></div><table id="threadlisttableid">${row(41, true)}${row(42)}${row(43, true)}</table>`;
}
const replyForm = `${account}<div id="pt"><a href="${boardURL}">音樂討論</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_FORM_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>`;
const thread = (id: string) =>
  `${account}<div id="pt"><a href="${boardURL}">音樂討論</a></div><div id="postlist"><h1 id="thread_subject">Reading ${id}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=9">Author Nine</a></div><a id="postnum101">1</a><div class="pcb"><p>Complete opening.</p></div></div></div>`;
async function open(
  page: Page,
  source: (url: URL) => string = () => board(),
  nativeScript = "",
) {
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__compact.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script>${nativeScript}</script><script src="${origin}/__compact.js"></script></body></html>`,
      });
    requests.push({ url: url.href, method: request.method() });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        document:
          url.searchParams.get("mod") === "forumdisplay"
            ? source(url)
            : url.searchParams.get("mod") === "post"
              ? replyForm
              : thread(url.searchParams.get("tid") ?? "42"),
      }),
    });
  });
  await page.goto(boardURL);
  return requests;
}
for (const stats of [true, false])
  test(`B4.heading-pins-${stats}: native title and statistics separate, disclosure counts only represented pins without retargeting`, async ({
    page,
  }, info) => {
    const requests = await open(page, () => board(stats));
    try {
      await expect(
        page.getByRole("heading", { name: "音樂討論", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".board-statistics")).toHaveCount(
        stats ? 1 : 0,
      );
      if (stats)
        await expect(page.locator(".board-statistics")).toHaveText(
          "今日: 0|主题: 7587|排名: 15",
        );
      const pins = page.getByRole("button", {
        name: "Pinned threads · 2",
        exact: true,
      });
      await expect(pins).toHaveAttribute("aria-expanded", "false");
      await expect(
        page.getByRole("link", { name: "Pinned guide 41", exact: true }),
      ).toBeHidden();
      await page
        .getByRole("link", { name: "Ordinary discussion 42", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Reading 42", exact: true }),
      ).toBeVisible();
      await pins.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("link", { name: "Pinned guide 41", exact: true }),
      ).toBeVisible();
      expect(requests).toHaveLength(2);
      await info.attach("pins-revealed.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page
        .getByRole("link", { name: "Pinned guide 41", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Reading 41", exact: true }),
      ).toBeVisible();
      await pins.click();
      await expect(
        page.getByRole("heading", { name: "Reading 41", exact: true }),
      ).toBeVisible();
      await expect(pins).toBeFocused();
      expect(requests).toHaveLength(3);
      expect(requests.every((r) => r.method === "GET")).toBe(true);
    } finally {
      await info.attach("final.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("requests.json", {
        body: JSON.stringify(requests),
        contentType: "application/json",
      });
    }
  });

const categoryURL = `${boardURL}&filter=typeid&typeid=3`;
const heatURL = `${boardURL}&filter=heat&orderby=heats`;
const combinedURL = `${boardURL}&filter=typeid&typeid=3&specialtype=poll`;
function filteredBoard(url: URL) {
  const menus = `<div id="thread_types"><a href="${categoryURL}">Listening notes</a><a href="${combinedURL}">Listening polls</a></div><div id="filter_special_menu"><a href="${boardURL}&filter=specialtype&specialtype=poll">Poll</a></div><div id="filter_reward_menu"><a href="${boardURL}&filter=specialtype&specialtype=reward&rewardtype=1">Unsolved</a></div><div id="filter_dateline_menu"><ul class="pop_moremenu"><li>排序: <a href="${boardURL}&filter=reply&orderby=heats">热度</a></li><li>时间: <a href="${boardURL}&filter=dateline&orderby=lastpost&dateline=604800">一周</a></li></ul></div><div id="filter_orderby_menu"><a href="${heatURL}">热门</a></div>`;
  return board()
    .replace(
      '<table id="threadlisttableid">',
      menus + '<table id="threadlisttableid">',
    )
    .replace(
      url.searchParams.has("typeid")
        ? `${row(41, true)}${row(42)}${row(43, true)}`
        : "__never__",
      url.searchParams.has("specialtype")
        ? '<tbody><tr><td class="emp">No threads</td></tr></tbody>'
        : row(44),
    );
}
test("B3.staged-native: collapsed groups, Cancel, exact Apply and explicit replacement preserve source combinations and pin semantics", async ({
  page,
}, info) => {
  const requests = await open(page, filteredBoard);
  try {
    const trigger = page.getByRole("button", {
      name: "Board filters · 0",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Category", exact: true }),
    ).toBeHidden();
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await expect(dialog.getByRole("group")).toHaveCount(6);
    await expect(dialog.getByRole("heading")).toHaveText([
      "Board filters",
      "Category",
      "Thread type",
      "Reward",
      "排序:",
      "时间:",
      "Order",
    ]);
    await dialog
      .getByRole("button", { name: "Listening notes", exact: true })
      .click();
    expect(requests).toHaveLength(1);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(trigger).toBeFocused();
    expect(requests).toHaveLength(1);
    await trigger.click();
    await dialog
      .getByRole("button", { name: "Listening notes", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Board filters · 1", exact: true }),
    ).toBeVisible();
    expect(requests[1]!.url).toContain("filter=typeid&typeid=3");
    await expect(
      page.getByRole("button", { name: /Pinned threads/ }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Board filters · 1", exact: true })
      .click();
    await dialog.getByRole("button", { name: "热门", exact: true }).click();
    await expect(
      dialog.getByText("Replaces these active criteria:", { exact: true }),
    ).toBeVisible();
    await expect(dialog.locator(".filter-removed")).toContainText(
      "Category: Listening notes",
    );
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Filter: heat",
    );
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Sort: heats",
    );
    expect(requests).toHaveLength(2);
    await info.attach("pending-replacement.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    expect(requests[2]!.url).toContain("filter=heat&orderby=heats");
    expect(requests[2]!.url).not.toContain("typeid");
    await page.getByRole("button", { name: /^Board filters ·/ }).click();
    await dialog
      .getByRole("button", { name: "Listening polls", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText("No threads", { exact: true })).toBeVisible();
    expect(requests[3]!.url).toContain(
      "filter=typeid&typeid=3&specialtype=poll",
    );
    await page.getByRole("button", { name: /^Board filters ·/ }).click();
    await dialog.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "All threads",
    );
    expect(requests).toHaveLength(4);
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Board filters · 0", exact: true }),
    ).toBeFocused();
    expect(new URL(requests[4]!.url).searchParams.get("typeid")).toBeNull();
    await expect(
      page.getByRole("button", { name: "Pinned threads · 2", exact: true }),
    ).toBeVisible();
    expect(requests.every((r) => r.method === "GET")).toBe(true);
  } finally {
    await info.attach("final.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

for (const width of [905, 390])
  test(`B3.writing-focus-${width}: filter-out, no-match and Clear retain writing and reader at 125% text`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const requests = await open(page, filteredBoard);
    try {
      await expect(
        page.getByRole("heading", { name: "音樂討論", exact: true }),
      ).toBeVisible();
      await page
        .locator("#thread-list-pane")
        .evaluate((node) =>
          (
            (node.getRootNode() as ShadowRoot).host as HTMLElement
          ).style.setProperty("--text-scale", "1.25"),
        );
      await page
        .getByRole("link", { name: "Ordinary discussion 42", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reply to thread", exact: true })
        .click();
      const source = page.getByRole("textbox", {
        name: "Complete source",
        exact: true,
        includeHidden: true,
      });
      await source.fill("保留未發送的完整 [b]文字[/b]。");
      await source.evaluate((node: HTMLTextAreaElement) =>
        node.setSelectionRange(2, 8),
      );
      const handle = await source.elementHandle();
      const target = await page.locator(".writing-destination").textContent();
      if (width === 390)
        await page
          .getByRole("button", { name: "Threads pane", exact: true })
          .click();
      const trigger = page.getByRole("button", { name: /^Board filters ·/ });
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Board filters",
        exact: true,
      });
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
      expect(
        await dialog.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      const choices = dialog.getByRole("navigation", {
        name: "Board filters",
        exact: true,
      });
      expect(
        await choices.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      const choiceBounds = await choices.boundingBox();
      for (const group of await choices.getByRole("group").all()) {
        const groupBounds = await group.boundingBox();
        expect(groupBounds!.x).toBeGreaterThanOrEqual(choiceBounds!.x);
        expect(groupBounds!.x + groupBounds!.width).toBeLessThanOrEqual(
          choiceBounds!.x + choiceBounds!.width + 1,
        );
      }

      await dialog
        .getByRole("button", { name: "Listening polls", exact: true })
        .click();
      expect(
        await choices.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      const previewBounds = await dialog
        .locator(".filter-preview")
        .boundingBox();
      const actionBounds = await dialog
        .locator(".filter-dialog-actions")
        .boundingBox();
      expect(previewBounds!.y).toBeGreaterThanOrEqual(bounds!.y);
      expect(previewBounds!.y + previewBounds!.height).toBeLessThanOrEqual(
        actionBounds!.y + 1,
      );
      await info.attach("dialog-125.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(
        dialog.getByRole("button", { name: "Apply", exact: true }),
      ).toBeDisabled();
      await dialog
        .getByRole("button", { name: "Listening polls", exact: true })
        .click();
      await dialog.getByRole("button", { name: "Apply", exact: true }).click();
      await expect(page.getByText("No threads", { exact: true })).toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(
        page.getByRole("link", { name: "Ordinary discussion 42", exact: true }),
      ).toHaveCount(0);
      await expect(source).toHaveValue("保留未發送的完整 [b]文字[/b]。");
      expect(
        await source.evaluate((node, prior) => node === prior, handle),
      ).toBe(true);
      expect(
        await source.evaluate((node: HTMLTextAreaElement) => [
          node.selectionStart,
          node.selectionEnd,
        ]),
      ).toEqual([2, 8]);
      expect(await page.locator(".writing-destination").textContent()).toBe(
        target,
      );
      await expect(
        page.getByRole("heading", {
          name: "Reading 42",
          exact: true,
          includeHidden: true,
        }),
      ).toBeAttached();
      await trigger.click();
      await dialog.getByRole("button", { name: "Clear", exact: true }).click();
      await dialog.getByRole("button", { name: "Apply", exact: true }).click();
      await expect(trigger).toBeFocused();
      await expect(source).toHaveValue("保留未發送的完整 [b]文字[/b]。");
      await expect(
        page.getByRole("button", { name: "Pinned threads · 2", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(requests.every((r) => r.method === "GET")).toBe(true);
      await page.reload();
      await expect(source).toHaveValue("保留未發送的完整 [b]文字[/b]。");
      if (width === 390)
        await page
          .getByRole("button", { name: "Threads pane", exact: true })
          .click();
      await expect(trigger).toBeVisible();
    } finally {
      await info.attach("final.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await info.attach("requests.json", {
        body: JSON.stringify(requests),
        contentType: "application/json",
      });
    }
  });

test("B3.native-meaning: reward context cannot rename thread type and sort/order selectors stay distinct", async ({
  page,
}, info) => {
  const requests = await open(page, filteredBoard);
  try {
    await page.getByRole("button", { name: /^Board filters ·/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await dialog.getByRole("button", { name: "Unsolved", exact: true }).click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Thread type: reward",
    );
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Reward: Unsolved",
    );
    await expect(dialog.locator(".filter-proposed")).not.toContainText(
      "Thread type: Unsolved",
    );
    await dialog.getByRole("button", { name: "热度", exact: true }).click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Filter: reply",
    );
    await expect(dialog.locator(".filter-preview")).toContainText(
      "排序: · 热度",
    );
    await dialog.getByRole("button", { name: "热门", exact: true }).click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Filter: heat",
    );
    await expect(dialog.locator(".filter-proposed")).not.toContainText(
      "Filter: reply",
    );
    await expect(dialog.locator(".filter-preview")).toContainText(
      "Order · 热门",
    );
    await dialog.getByRole("button", { name: "一周", exact: true }).click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Time: 一周",
    );
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "Sort: lastpost",
    );
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    expect(requests[1]!.url).toContain(
      "filter=dateline&orderby=lastpost&dateline=604800",
    );
    expect(requests).toHaveLength(2);
  } finally {
    await info.attach("final.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

for (const variant of ["legacy", "statistics", "choices", "clear"] as const)
  test(`B3.metadata-${variant}: optional recovery metadata remains compatible or fails visibly without reads`, async ({
    page,
  }, info) => {
    const alteration =
      variant === "legacy"
        ? "delete board.statistics; delete board.clearFilter; delete board.filterChoices;"
        : variant === "statistics"
          ? 'board.statistics = ["fake"];'
          : variant === "choices"
            ? 'board.filterChoices = [{url: board.url, criteria: "fake", removed: []}];'
            : 'board.clearFilter = {label: "fake", url: "javascript:alert(1)"};';
    const script = `const raw=sessionStorage.getItem('tsdm.workspace.recovery');if(raw){const record=JSON.parse(raw);for(const entry of Object.values(record.entries)){if(entry.result?.kind==='board'){const board=entry.result.board;${alteration}}}sessionStorage.setItem('tsdm.workspace.recovery',JSON.stringify(record));}`;
    const requests = await open(page, filteredBoard, script);
    await expect(
      page.getByRole("heading", { name: "音樂討論", exact: true }),
    ).toBeVisible();
    await page.reload();
    if (variant === "legacy") {
      await page.getByRole("button", { name: /^Board filters ·/ }).click();
      const dialog = page.getByRole("dialog", {
        name: "Board filters",
        exact: true,
      });
      await expect(
        dialog.getByText("Reload this board to review filter changes.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Listening notes", exact: true }),
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Clear", exact: true }),
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Apply", exact: true }),
      ).toBeDisabled();
    } else
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
    expect(requests).toHaveLength(1);
    await info.attach("recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });

test("B3.selected-native-category: native selected node names the active category even when its link clears it", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page, (url) =>
    filteredBoard(url).replace(
      `<div id="thread_types"><a href="${categoryURL}">Listening notes</a>`,
      url.searchParams.has("typeid")
        ? `<div id="thread_types"><ul><li class="xw1 a"><a href="${boardURL}">【已解决】<span>1125</span></a></li></ul>`
        : `<div id="thread_types"><a href="${categoryURL}">【已解决】1125</a>`,
    ),
  );
  try {
    await expect(
      page.getByRole("heading", { name: "音樂討論", exact: true }),
    ).toBeVisible();
    await page
      .locator("#thread-list-pane")
      .evaluate((node) =>
        (
          (node.getRootNode() as ShadowRoot).host as HTMLElement
        ).style.setProperty("--text-scale", "1.25"),
      );
    await page.getByRole("button", { name: /^Board filters ·/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await dialog
      .getByRole("button", { name: "【已解决】1125", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(
      page.getByRole("list", { name: "Effective criteria", exact: true }),
    ).toContainText("Category: 【已解决】1125");
    await page.getByRole("button", { name: /^Board filters ·/ }).click();
    await dialog.getByRole("button", { name: "热门", exact: true }).click();
    await expect(dialog.locator(".filter-removed")).toContainText(
      "Category: 【已解决】1125",
    );
    const removal = await dialog.locator(".filter-removed").boundingBox();
    const summary = await dialog.locator(".filter-preview").boundingBox();
    expect(removal!.y + removal!.height).toBeLessThanOrEqual(
      summary!.y + summary!.height,
    );
    await dialog
      .getByRole("button", { name: "【已解决】1125", exact: true })
      .click();
    await expect(dialog.locator(".filter-proposed")).toContainText(
      "All threads",
    );
    expect(requests).toHaveLength(2);
  } finally {
    await info.attach("selected-category.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

test("B3.native-escape: Escape closes a filter opened before narrow docking and after recovery despite the native body handler", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 905, height: 900 });
  // Same observed Discuz body boundary retained in native-keyboard.spec.ts.
  const requests = await open(
    page,
    filteredBoard,
    "document.body.onkeydown = function(event) { if (event.keyCode === 27) return false; };",
  );
  try {
    await page
      .getByRole("link", { name: "Ordinary discussion 42", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Reading 42", exact: true }),
    ).toBeVisible();
    const trigger = page.getByRole("button", { name: /^Board filters ·/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Board filters",
      exact: true,
    });
    await dialog
      .getByRole("button", { name: "Listening notes", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#thread-list-pane")).toBeHidden();
    await expect(dialog).toBeVisible();
    await dialog.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Threads pane", exact: true }),
    ).toBeFocused();
    expect(requests).toHaveLength(2);
    await page.reload();
    await page.setViewportSize({ width: 905, height: 900 });
    await trigger.click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#thread-list-pane")).toBeHidden();
    await dialog
      .getByRole("button", { name: "Listening notes", exact: true })
      .focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Threads pane", exact: true }),
    ).toBeFocused();
    expect(requests).toHaveLength(2);
  } finally {
    await info.attach("native-escape.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});
