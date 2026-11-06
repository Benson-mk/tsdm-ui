import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  revealNavigation,
  openSettings,
  closeSettingsToWorkspace,
} from "./navigation-ui";
const origin = "https://www.tsdm39.com";
const directoryURL = `${origin}/forum.php`;
const boardURL = (id: number) => `${directoryURL}?mod=forumdisplay&fid=${id}`;
const threadURL = (id: number) => `${directoryURL}?mod=viewthread&tid=${id}`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
type Group = {
  id: number;
  title: string;
  boards: number[];
  aggregate?: boolean;
};
const groups: Group[] = [
  { id: 11, title: "Community", boards: [101, 102] },
  { id: 12, title: "Anime", boards: [201] },
  { id: 13, title: "Creative", boards: [301] },
  { id: 14, title: "Music", boards: [401] },
  { id: 15, title: "Unclassified 音樂 / 動漫", boards: [501] },
  { id: 16, title: "Same source name", boards: [601] },
  { id: 17, title: "Same source name", boards: [701] },
];
function directory(items: Group[], identity = account) {
  return (
    identity +
    items
      .map(
        (g) =>
          `<div class="bm"><div class="bm_h"><h2><a href="${g.aggregate ? "home.php?mod=space&do=favorite&type=forum" : `forum.php?gid=${g.id}`}">${g.title}</a></h2></div><div id="category_${g.id}"><table><tr>${g.boards.map((id) => `<td><h2><a href="${boardURL(id)}">Board ${id} 中文</a></h2><p>Source description ${id}</p></td>`).join("")}</tr></table></div></div>`,
      )
      .join("")
  );
}
function board(id: number, identity = account) {
  return `${identity}<div id="ct"><h1><a href="${boardURL(id)}">Board ${id} 中文</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_${id}"><tr><th><a class="xst" href="${threadURL(id)}">Thread ${id}</a></th></tr></tbody></table>`;
}
function thread(id: number) {
  return `${account}<div id="pt"><a href="${boardURL(id)}">Board ${id} 中文</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1>${Array.from({ length: 8 }, (_, i) => `<div id="post_${id * 10 + i}"><div class="authi">Author</div><a id="postnum${id * 10 + i}">${i + 1}</a><div class="pcb"><p>${`Actual reading ${i} 中文 `.repeat(35)}</p></div></div>`).join("")}</div>`;
}
async function open(page: Page, destination = directoryURL) {
  const fixture = {
    groups: structuredClone(groups),
    account,
    nativeScript: "",
    response: null as string | null,
    delay: null as Promise<void> | null,
  };
  const requests: string[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/__ui84.js")
      return route.fulfill({ contentType: "text/javascript", body: built });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script>${fixture.nativeScript}</script><script src="${origin}/__ui84.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    const document =
      fixture.response ??
      (url.searchParams.get("mod") === "viewthread"
        ? thread(Number(url.searchParams.get("tid")))
        : url.searchParams.get("mod") === "forumdisplay"
          ? board(Number(url.searchParams.get("fid")), fixture.account)
          : directory(fixture.groups, fixture.account));
    const delay = fixture.delay;
    fixture.delay = null;
    if (delay) await delay;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document }),
    });
  });
  await page.goto(destination);
  await expect(page.locator(".workspace")).toBeVisible();
  return { fixture, requests };
}
test("UI84.disclosures: source groups keep independent identity through filtering, reordered discovery and pane browsing", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  const navigation = page.locator("#boards-pane .boards-navigation");
  const disclosures = navigation.locator(".board-disclosure");
  await expect(disclosures).toHaveCount(7);
  await expect(disclosures.locator(".group-count")).toHaveText([
    "2",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
  ]);
  await expect(
    navigation.getByRole("link", { name: "Board 101 中文", exact: true }),
  ).toBeVisible();
  const firstSame = disclosures.filter({
    has: page.locator(`a[href="${boardURL(601)}"]`),
  });
  const secondSame = disclosures.filter({
    has: page.locator(`a[href="${boardURL(701)}"]`),
  });
  await firstSame
    .getByRole("button", { name: "Same source name", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(secondSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(firstSame.getByRole("link")).toBeHidden();
  await expect(secondSame.getByRole("link")).toBeVisible();
  const before = requests.length;
  await page
    .getByRole("searchbox", { name: "Filter boards on this page" })
    .fill("Board 101");
  await expect(page.locator(".overview .board-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  expect(requests.length).toBe(before);
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  fixture.groups.reverse();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(disclosures.first().getByRole("button")).toHaveText(
    /Same source name/,
  );
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(secondSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.setViewportSize({ width: 375, height: 844 });
  await revealNavigation(page);
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await navigation
    .getByRole("link", { name: "Board 201 中文", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Thread results" }),
  ).toBeVisible();
  await revealNavigation(page);
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await navigation
    .getByRole("link", { name: "All boards", exact: true })
    .click();
  await revealNavigation(page);
  await firstSame.getByRole("button").press("Space");
  await expect(firstSame.getByRole("link")).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(9);
  await firstSame.getByRole("button").click();
  await page.reload();
  await revealNavigation(page);
  await expect(firstSame.getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await info.attach("groups.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});

const fills = {
  light: [
    "rgb(235, 245, 232)",
    "rgb(221, 164, 159)",
    "rgb(162, 155, 186)",
    "rgb(166, 198, 225)",
    "rgb(238, 238, 238)",
  ],
  alias: [
    "rgb(235, 245, 232)",
    "rgb(194, 184, 218)",
    "rgb(194, 184, 218)",
    "rgb(166, 198, 225)",
    "rgb(238, 238, 238)",
  ],
  mono: [
    "rgb(233, 233, 233)",
    "rgb(227, 227, 227)",
    "rgb(228, 228, 228)",
    "rgb(184, 184, 184)",
    "rgb(238, 238, 238)",
  ],
  dark: [
    "rgb(235, 245, 232)",
    "rgb(221, 164, 159)",
    "rgb(162, 155, 186)",
    "rgb(166, 198, 225)",
    "rgb(102, 102, 102)",
  ],
} as const;
test("UI84.palette: exact source roles retain readable theme fills, aggregate identity and category-preserving hover", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  fixture.groups.unshift({
    id: 0,
    title: "My favorites",
    boards: [201],
    aggregate: true,
  });
  fixture.groups.push({ id: 18, title: "Music", boards: [102] });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".overview .board-card")).toHaveCount(10);
  const roles = ["community", "anime", "creative", "music", "neutral"];
  const ids = [101, 201, 301, 401, 501];
  for (const [theme, colors] of Object.entries(fills)) {
    await openSettings(page);
    await page.locator(`input[type=radio][value="${theme}"]`).check();
    await closeSettingsToWorkspace(page);
    for (const [i, id] of ids.entries()) {
      const cards = page.locator(
        `.overview .board-card[href="${boardURL(id)}"]`,
      );
      for (const card of await cards.all()) {
        await expect(card).toHaveAttribute("data-category", roles[i]!);
        await expect(card).toHaveCSS("background-color", colors[i]!);
        await expect(card).toHaveCSS(
          "color",
          theme === "dark" && i === 4 ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
        );
        await card.hover();
        await expect(card).toHaveCSS("background-color", colors[i]!);
        await expect(card.locator("strong")).toHaveCSS(
          "text-decoration-line",
          "underline",
        );
      }
      const dots = page.locator(
        `.boards-navigation a[href="${boardURL(id)}"] .category-dot`,
      );
      for (const dot of await dots.all()) {
        await expect(dot).toHaveAttribute("aria-hidden", "true");
        await expect(dot).toHaveCSS("background-color", colors[i]!);
      }
      expect(await dots.count()).toBeGreaterThan(0);
    }
    const generatedDots = await page
      .locator(".boards-navigation a")
      .evaluateAll((links) =>
        links.map((link) => getComputedStyle(link, "::before").content),
      );
    expect(
      generatedDots.every(
        (content) => content === "none" || content === "normal",
      ),
    ).toBe(true);
    const conflict = page.locator(
      `.overview .board-card[href="${boardURL(102)}"]`,
    );
    await expect(conflict).toHaveCount(2);
    for (const card of await conflict.all())
      await expect(card).toHaveCSS("background-color", colors[4]!);
    await info.attach(`palette-${theme}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});
test("UI84.continuity: category follows its own board and retained reader, while account changes clear private navigation", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  fixture.groups.unshift({
    id: 0,
    title: "Private favorites",
    boards: [201],
    aggregate: true,
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page
    .locator(`.overview .board-card[href="${boardURL(201)}"]`)
    .first()
    .click();
  const list = page.locator("#thread-list-pane");
  await expect(list.locator(".category-label")).toHaveText("Anime");
  await expect(list.locator(".category-label")).toHaveCSS(
    "background-color",
    fills.light[1],
  );
  await list.getByRole("link", { name: "Thread 201", exact: true }).click();
  const breadcrumb = page.locator(".conversation-tool-row .category-label");
  await expect(breadcrumb).toHaveText("Anime");
  await page.locator(`.boards-navigation a[href="${boardURL(301)}"]`).click();
  await expect(list.locator(".category-label")).toHaveText("Creative");
  await expect(breadcrumb).toHaveText("Anime");
  await expect(breadcrumb).toHaveCSS("background-color", fills.light[1]);
  for (const [theme, colors] of Object.entries(fills)) {
    await openSettings(page);
    await page.locator(`input[type=radio][value="${theme}"]`).check();
    await closeSettingsToWorkspace(page);
    await expect(list.locator(".category-label")).toHaveCSS(
      "background-color",
      colors[2]!,
    );
    await expect(breadcrumb).toHaveCSS("background-color", colors[1]!);
    await expect(list.locator(".category-label")).toHaveCSS(
      "color",
      "rgb(0, 0, 0)",
    );
    await expect(breadcrumb).toHaveCSS("color", "rgb(0, 0, 0)");
    await info.attach(`independent-context-${theme}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  fixture.account =
    '<div id="um"><strong><a href="home.php?mod=space&uid=8">Writer Eight</a></strong></div>';
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".board-disclosure")).toHaveCount(0);
  await expect(list.locator(".category-label")).toHaveCount(0);
  await expect(page.locator(".boards-navigation")).not.toContainText(
    "Private favorites",
  );
  await info.attach("continuity.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});
test("UI84.direct: direct board and reader entry stay neutral without discovered source identity", async ({
  page,
}) => {
  await open(page, boardURL(201));
  await expect(page.locator("#thread-list-pane .category-label")).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: "Thread 201", exact: true }).click();
  await expect(
    page.locator(".conversation-tool-row .category-label"),
  ).toHaveCount(0);
  await expect(
    page.locator(".conversation-tool-row .board-context-link"),
  ).toHaveAttribute("data-category", "neutral");
});

for (const scenario of [
  {
    name: "legacy",
    change: "delete group.sourceId; delete group.sourceURL;",
    valid: true,
  },
  {
    name: "source-id-type",
    change: "group.sourceId = ['category_11'];",
    valid: false,
  },
  {
    name: "source-url-type",
    change: "group.sourceURL = ['https://www.tsdm39.com/forum.php'];",
    valid: false,
  },
  {
    name: "source-url-origin",
    change: "group.sourceURL = 'https://effects.example/forum.php';",
    valid: false,
  },
]) {
  test(`UI84.recovery-${scenario.name}: optional source identity restores compatibly or fails without automatic reads`, async ({
    page,
  }, info) => {
    const { fixture, requests } = await open(page);
    await expect(page.locator(".board-disclosure")).toHaveCount(7);
    fixture.nativeScript = `const raw = sessionStorage.getItem('tsdm.workspace.recovery'); if(raw){const record = JSON.parse(raw); for(const entry of Object.values(record.entries)){if(entry.result?.kind === 'directory'){for(const group of entry.result.directory.groups){${scenario.change}}}}sessionStorage.setItem('tsdm.workspace.recovery',JSON.stringify(record));}`;
    const before = requests.length;
    await page.reload();
    if (scenario.valid) {
      await expect(page.locator(".board-disclosure")).toHaveCount(7);
      const navigation = page.locator(".boards-navigation");
      const first = navigation
        .locator(".board-disclosure")
        .filter({ has: page.locator(`a[href="${boardURL(601)}"]`) });
      const second = navigation
        .locator(".board-disclosure")
        .filter({ has: page.locator(`a[href="${boardURL(701)}"]`) });
      await first.getByRole("button").click();
      await expect(first.getByRole("link")).toBeHidden();
      await expect(second.getByRole("link")).toBeVisible();
      await expect(
        page.locator(`.board-card[href="${boardURL(201)}"]`),
      ).toHaveCSS("background-color", fills.light[1]);
    } else {
      await expect(
        page.getByText("This navigation snapshot is unavailable.", {
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(requests.length).toBe(before);
    await info.attach("recovery.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });
}
test("UI84.native-aliases: observed native group labels retain exact roles and mixed groups remain neutral after reordering", async ({
  page,
}, info) => {
  const { fixture } = await open(page);
  fixture.groups = [
    { id: 1, title: "天使·后花园", boards: [101] },
    { id: 21, title: "天使·动漫讨论区", boards: [201] },
    { id: 393, title: "天使·美工部", boards: [301] },
    { id: 701, title: "天使·分享区", boards: [401] },
    { id: 3, title: "天使·综合区", boards: [501] },
  ];
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".overview .board-group > h2")).toHaveText(
    fixture.groups.map((g) => g.title),
  );
  const roles = ["community", "anime", "creative", "neutral", "neutral"];
  for (const [i, g] of fixture.groups.entries())
    await expect(
      page.locator(`.overview .board-card[href="${boardURL(g.boards[0]!)}"]`),
    ).toHaveAttribute("data-category", roles[i]!);
  fixture.groups.reverse();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".overview .board-group > h2")).toHaveText(
    fixture.groups.map((g) => g.title),
  );
  await expect(
    page.locator(`.overview .board-card[href="${boardURL(201)}"]`),
  ).toHaveCSS("background-color", fills.light[1]);
  await info.attach("native-source-roles.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

const challenge =
  '<title>Just a moment</title><div id="challenge-form">Checking your browser</div>';
test("UI84.account-observation: an unknown challenge clears private navigation despite retained public results and fresh rediscovery restores it", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  fixture.groups.unshift({
    id: 0,
    title: "Private favorites",
    boards: [201, 899],
    aggregate: true,
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  const navigation = page.locator(".boards-navigation");
  await expect(navigation).toContainText("Private favorites");
  await expect(
    navigation.getByRole("link", { name: "Board 899 中文", exact: true }),
  ).toHaveCount(1);
  fixture.response = challenge;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByText(
      "Native verification is required. Your destination is preserved.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator(".board-disclosure")).toHaveCount(0);
  await expect(navigation).not.toContainText("Private favorites");
  await expect(
    navigation.getByRole("link", { name: "Board 899 中文", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(`.overview .board-card[href="${boardURL(201)}"]`).first(),
  ).toHaveAttribute("data-category", "neutral");
  await info.attach("unknown-observation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  fixture.response = null;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".board-disclosure")).toHaveCount(8);
  await expect(navigation).toContainText("Private favorites");
  await expect(
    navigation.getByRole("link", { name: "Board 899 中文", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(`.overview .board-card[href="${boardURL(201)}"]`).first(),
  ).toHaveAttribute("data-category", "anime");
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});
test("UI84.same-account-error: a confirmed same-member permission failure retains discovered category navigation", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  fixture.response =
    account + '<div id="messagetext"><p>您没有权限访问该版块</p></div>';
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".board-disclosure")).toHaveCount(7);
  await expect(
    page.locator(`.overview .board-card[href="${boardURL(201)}"]`),
  ).toHaveAttribute("data-category", "anime");
  await expect(
    page.getByText(
      "The current account does not have permission to read this board.",
      { exact: true },
    ),
  ).toBeVisible();
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});
test("UI84.stale-account-error: a superseded delayed unknown challenge cannot clear newer accepted directory context", async ({
  page,
}, info) => {
  const { fixture, requests } = await open(page);
  let release!: () => void;
  fixture.delay = new Promise<void>((resolve) => {
    release = resolve;
  });
  fixture.response = challenge;
  const before = requests.length;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect.poll(() => requests.length).toBe(before + 1);
  fixture.response = null;
  await page.locator(`.boards-navigation a[href="${boardURL(201)}"]`).click();
  await expect(page.locator("#thread-list-pane .category-label")).toHaveText(
    "Anime",
  );
  const oldResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/forum.php" &&
      !new URL(response.url()).searchParams.has("mod"),
  );
  release();
  await (await oldResponse).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  // The old HTTP response completes after the accepted board navigation.
  await expect(page.locator(".board-disclosure")).toHaveCount(7);
  await expect(page.locator("#thread-list-pane .category-label")).toHaveText(
    "Anime",
  );
  await expect(
    page.getByText(
      "Native verification is required. Your destination is preserved.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});
