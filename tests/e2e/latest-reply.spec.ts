import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
import {
  clickThreadTool,
  openSettings,
  closeSettingsToWorkspace,
} from "./navigation-ui";
test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
});

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const latestURL = `${origin}/forum.php?mod=redirect&tid=42&goto=lastpost#lastpost`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const latestName = "最新回覆者名字很長的繁體中文音樂愛好者";
const row = (
  id = 42,
  latest = `<cite><a href="home.php?mod=space&username=latest">${latestName}</a></cite><em><a href="${latestURL}"><span title="2026-11-12 20:04">6 分鐘前</span></a></em>`,
) =>
  `<tbody id="normalthread_${id}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${id}">原始主題 ${id}</a></th><td class="by"><cite>Original Author</cite><em>2020-01-01</em></td><td class="num"><a>999</a><em>1000</em></td>${latest === "omit" ? "" : `<td class="by">${latest}</td>`}</tr></tbody>`;
const board = (rows = row()) =>
  `${account}<div id="ct"><h1>音樂討論</h1></div><table id="threadlisttableid">${rows}</table>`;

test("D2-D5.details: count disclosure keeps focus and row-relative bounds without navigation", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await open(
    page,
    board(row().replace("<a>999</a><em>1000</em>", "<a>0</a><em>0</em>")),
  );
  const current = page.locator(".thread-row").first();
  const trigger = current.getByRole("button", {
    name: "Thread details for 原始主題 42: 0 replies",
    exact: true,
  });
  const geometry = async () =>
    trigger.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const row = node.closest(".thread-row")!.getBoundingClientRect();
      return {
        x: bounds.x - row.x,
        y: bounds.y - row.y,
        width: bounds.width,
        height: bounds.height,
      };
    });
  const observations = [];
  const before = requests.length;
  await current.locator(".subject").focus();
  await page.keyboard.press("Tab");
  await expect(current.locator(".latest-reply")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const closed = await geometry();
  expect(closed.height).toBeGreaterThanOrEqual(44);
  for (const action of ["pointer", "Enter", "Space", "Space"]) {
    if (action === "pointer") await trigger.click();
    else await trigger.press(action);
    await expect(trigger).toBeFocused();
    const after = await geometry();
    expect(after).toEqual(closed);
    observations.push({ action, after });
    if ((await trigger.getAttribute("aria-expanded")) === "true") {
      await expect(current.locator("dl")).toContainText("Original Author");
      await expect(current.locator("dl")).toContainText("2020-01-01");
      await expect(current.locator("dd")).toHaveText([
        "0",
        "Original Author",
        "2020-01-01",
        "0",
        "42",
      ]);
    }
  }
  expect(requests).toHaveLength(before);
  await expect(page.locator(".reader-placeholder")).toBeVisible();
  await info.attach("stationary-details.json", {
    body: JSON.stringify({ closed, observations, requests }),
    contentType: "application/json",
  });
  await info.attach("stationary-details.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("D3.unknown: absent original metadata and counts remain unavailable independently of known latest activity", async ({
  page,
}, info) => {
  const source = row(
    42,
    "<cite>Known activity author</cite><em>2026-11-18</em>",
  )
    .replace("<cite>Original Author</cite><em>2020-01-01</em>", "")
    .replace("<a>999</a><em>1000</em>", "");
  const requests = await open(page, board(source));
  const current = page.locator(".thread-row");
  await expect(current.locator(".latest-reply")).toHaveText(
    "Known activity author · 2026-11-18",
  );
  await expect(current.getByRole("link")).toHaveCount(1);
  await current
    .getByRole("button", {
      name: "Thread details for 原始主題 42: Unavailable replies",
      exact: true,
    })
    .click();
  await expect(current.locator("dd")).toHaveText([
    "Unavailable",
    "Unavailable",
    "Unavailable",
    "Unavailable",
    "42",
  ]);
  await info.attach("unknown-details.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("unknown-request-ledger.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});

async function open(page: Page, html = board(), representation = "json") {
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/__latest.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__latest.js"></script></body></html>`,
      });
    requests.push({ url: request.url(), method: request.method() });
    const document =
      new URL(request.url()).searchParams.get("mod") === "viewthread"
        ? posts(false)
        : html;
    return route.fulfill({
      contentType: representation === "json" ? "application/json" : "text/html",
      body: representation === "json" ? JSON.stringify({ document }) : document,
    });
  });
  await page.goto(boardURL);
  await expect(page.locator(".thread-row").first()).toBeVisible();
  return requests;
}

for (const theme of ["light", "dark"]) {
  test(`D9.unselected-${theme}: secondary text remains readable through row and control hover`, async ({
    page,
  }, info) => {
    const requests = await open(
      page,
      board(row().replace("<th>", "<th><em>[分類]</em>")),
    );
    await openSettings(page);
    await page.locator(`input[name="theme"][value="${theme}"]`).check();
    await closeSettingsToWorkspace(page);
    const current = page.locator(".thread-row");
    await current.getByRole("button").click();
    const observations = [];
    for (const target of [".subject", ".latest-reply", "button"]) {
      await current.locator(target).hover();
      const contrast = await current.evaluate((row) => {
        const lum = (value: string) => {
          const rgb = value
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              const n = v / 255;
              return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
        };
        return [
          ...row.querySelectorAll(
            ".subject, .thread-category, .latest-reply, button, dt, dd",
          ),
        ].map((node) => {
          let background = "rgba(0, 0, 0, 0)";
          let parent: Element | null = node;
          while (parent && background === "rgba(0, 0, 0, 0)") {
            background = getComputedStyle(parent).backgroundColor;
            parent = parent.parentElement;
          }
          const fg = lum(getComputedStyle(node).color),
            bg = lum(background);
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        });
      });
      expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
      observations.push({ target, contrast });
    }
    await info.attach("unselected-hover.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("unselected-hover.json", {
      body: JSON.stringify({ observations, requests }),
      contentType: "application/json",
    });
  });
}

for (const theme of ["light", "dark", "mono", "alias"]) {
  test(`D8-D9.${theme}: selected long rows remain readable, localized and stationary at enlarged narrow sizes`, async ({
    page,
  }, info) => {
    const title = "完整而很長的繁體中文討論標題與閱讀心得".repeat(4);
    const requests = await open(
      page,
      board(
        row()
          .replace("原始主題 42", title)
          .replace("<th>", "<th><em>[長篇分類]</em>"),
      ),
    );
    await page.locator(".thread-row .subject").click();
    await expect(
      page.getByRole("article", { name: "Post 101", exact: true }),
    ).toBeVisible();
    await clickThreadTool(page, "Back");
    const current = page.locator(".thread-row").first();
    const observations = [];
    for (const [locale, detailName, latestAction] of [
      ["en", "Thread details for", "Open latest post in"],
      ["zh-CN", "主题详情", "打开最新回复"],
      ["zh-TW", "主題詳情", "開啟最新回覆"],
    ]) {
      await openSettings(page);
      await page.locator(`input[name="theme"][value="${theme}"]`).check();
      await page.locator("#interface-language").selectOption(locale!);
      await page.locator("#text-size").fill("150");
      await closeSettingsToWorkspace(page);
      await expect(
        current.getByRole("button", { name: new RegExp(detailName!) }),
      ).toHaveCount(1);
      await expect(
        current.getByRole("link", { name: new RegExp(latestAction!) }),
      ).toHaveAttribute("href", latestURL);
      for (const width of [390, 320]) {
        await page.setViewportSize({
          width,
          height: width === 320 ? 640 : 844,
        });
        const trigger = current.getByRole("button");
        await trigger.scrollIntoViewIfNeeded();
        const observe = () =>
          current.evaluate((row) => {
            const rect = row.getBoundingClientRect();
            const button = row.querySelector("button")!;
            const box = button.getBoundingClientRect();
            const style = getComputedStyle(row);
            const lum = (color: string) => {
              const rgb = color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number)
                .map((v) => {
                  const x = v / 255;
                  return x <= 0.04045
                    ? x / 12.92
                    : ((x + 0.055) / 1.055) ** 2.4;
                });
              return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
            };
            const bg = lum(style.backgroundColor);
            const contrast = [
              ...row.querySelectorAll(
                ".latest-reply, button, dt, dd, .subject, .thread-category, .local-reply-indicator",
              ),
            ].map((n) => {
              const fg = lum(getComputedStyle(n).color);
              return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
            });
            return {
              x: box.x - rect.x,
              y: box.y - rect.y,
              width: box.width,
              height: box.height,
              client: row.clientWidth,
              scroll: row.scrollWidth,
              contrast,
              selected: row
                .querySelector(".subject")
                ?.getAttribute("aria-current"),
              radius: style.borderRadius,
              shadow: style.boxShadow,
            };
          });
        if ((await trigger.getAttribute("aria-expanded")) === "true")
          await trigger.click();
        const before = await observe();
        await trigger.press("Space");
        await expect(trigger).toBeFocused();
        const after = await observe();
        expect(after.x).toBe(before.x);
        expect(after.y).toBe(before.y);
        expect(after.width).toBe(before.width);
        expect(after.client).toBe(after.scroll);
        expect(after.height).toBeGreaterThanOrEqual(44);
        expect(after.selected).toBe("true");
        expect(parseFloat(after.radius)).toBeGreaterThan(0);
        expect(after.shadow).not.toBe("none");
        expect(Math.min(...after.contrast)).toBeGreaterThanOrEqual(4.5);
        await trigger.hover();
        expect(Math.min(...(await observe()).contrast)).toBeGreaterThanOrEqual(
          4.5,
        );
        observations.push({ locale, width, before, after });
        await expect(current.locator(".thread-category")).toHaveText(
          "[長篇分類]",
        );
        await current.locator("dd").last().scrollIntoViewIfNeeded();
        await expect(current.locator("dd").last()).toBeInViewport();
        const detailWidth = (await current.locator("dl").boundingBox())!.width;
        expect(detailWidth).toBeGreaterThan(after.client - 40);
        await info.attach(`${locale}-${width}.png`, {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      }
    }
    await page.emulateMedia({ forcedColors: "active" });
    await current.getByRole("button").focus();
    const forced = await current.evaluate((row) => ({
      border: getComputedStyle(row).borderStyle,
      outline: getComputedStyle(row.querySelector("button")!).outlineStyle,
    }));
    expect(forced.border).toBe("solid");
    expect(forced.outline).not.toBe("none");
    await info.attach("forced-colors.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("appearance-observations.json", {
      body: JSON.stringify({ observations, forced, requests }),
      contentType: "application/json",
    });
  });
}
test("B2.metadata: native latest author and timestamp replace repeated title", async ({
  page,
}, info) => {
  const requests = await open(page);
  try {
    const latest = page.locator(".thread-row").getByRole("link", {
      name: `Open latest post in 原始主題 42: ${latestName} · 2026-11-12 20:04`,
      exact: true,
    });
    await expect(latest).toBeVisible();
    await expect(latest).toHaveAttribute("href", latestURL);
    await expect(latest).not.toContainText("原始主題");
    await expect(latest).not.toContainText("Original Author");
    const beforeReload = requests.length;
    await page.reload();
    await expect(latest).toBeVisible();
    expect(requests).toHaveLength(beforeReload);
    await info.attach("qualified-metadata.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    // Browser-host fixture: an older retained record lacks the additive field.
    await page.evaluate(() => {
      const key = "tsdm.workspace.recovery";
      const source = sessionStorage.getItem(key)!;
      sessionStorage.setItem(
        key,
        JSON.stringify(JSON.parse(source), (key, value) =>
          key === "latestReply" ? undefined : value,
        ),
      );
    });
    await page.reload();
    await expect(
      page.getByRole("link", {
        name: "Open latest post in 原始主題 42: Replier unavailable · Time unavailable",
        exact: true,
      }),
    ).toHaveAttribute("href", latestURL);
    expect(requests).toHaveLength(beforeReload);
  } finally {
    await info.attach("metadata.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("request-ledger.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

test("B2.partial: absent source details and unsafe destinations stay explicitly unavailable", async ({
  page,
}, info) => {
  const target = (id: number) => latestURL.replace("tid=42", `tid=${id}`);
  const requests = await open(
    page,
    board(
      row(43, `<em><a href="${target(43)}">2026-11-12</a></em>`) +
        row(
          44,
          `<cite>Reply Forty Four</cite><em><a href="${target(44)}"></a></em>`,
        ) +
        row(45, "omit").replace(
          "<em>2020-01-01</em>",
          `<em><a href="${target(45)}">2020-01-01</a></em>`,
        ) +
        row(
          46,
          `<cite>Reply Forty Six</cite><em><a href="${threadURL}">2026-11-12</a></em>`,
        ) +
        row(
          47,
          `<cite>Reply Forty Seven</cite><em><a href="https://other.example/forum.php?mod=redirect&tid=47&goto=lastpost">2026-11-12</a></em>`,
        ) +
        row(
          48,
          `<cite>Reply Forty Eight</cite><em><a href="${target(49)}">2026-11-12</a></em>`,
        ) +
        row(
          49,
          `<cite>Reply Forty Nine</cite><em><a href="${threadURL.replace("42", "49")}">2026-11-12</a></em>`,
        ),
    ),
  );
  try {
    const rows = page.locator(".thread-row");
    await expect(
      rows.nth(0).getByRole("link", {
        name: "Open latest post in 原始主題 43: Replier unavailable · 2026-11-12",
        exact: true,
      }),
    ).toHaveAttribute("href", target(43));
    await expect(
      rows.nth(1).getByRole("link", {
        name: "Open latest post in 原始主題 44: Reply Forty Four · Time unavailable",
        exact: true,
      }),
    ).toHaveAttribute("href", target(44));
    await expect(rows.nth(2)).toContainText(
      "Replier unavailable · Time unavailable",
    );
    for (let i = 2; i < 7; i++)
      await expect(rows.nth(i).getByRole("link")).toHaveCount(1);
    await expect(rows.nth(3).locator(".latest-reply")).toHaveText(
      "Reply Forty Six · 2026-11-12",
    );
    await expect(rows.nth(4).locator(".latest-reply")).toHaveText(
      "Reply Forty Seven · 2026-11-12",
    );
    expect(requests.every((request) => request.method === "GET")).toBe(true);
  } finally {
    await info.attach("partial-metadata.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});

for (const representation of ["html", "json"])
  test(`B2.touch-${representation}: original touch author and date never become latest activity`, async ({
    page,
  }, info) => {
    const html = `${account}<div class="header"><h2>音樂討論</h2></div><ul class="threadlist_box"><li class="list"><div class="threadlist_tit"><a href="${threadURL}&mobile=2">Touch thread</a></div><span class="muser">Touch Original Author</span><span class="mtime">2020-01-01</span><div class="threadlist_foot"><span class="mreply">999</span></div></li></ul>`;
    const requests = await open(page, html, representation);
    await expect(page.locator(".thread-row")).toContainText(
      "Replier unavailable · Time unavailable",
    );
    await expect(page.locator(".thread-row").getByRole("link")).toHaveCount(1);
    await expect(page.locator(".thread-row").getByRole("link")).toHaveAttribute(
      "href",
      `${threadURL}&mobile=2`,
    );
    await info.attach("touch-source.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  });

test("B2.cjk: long source values stay complete and wrap at narrow width and 125% text", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await open(page, board(), "html");
  await page
    .locator("#tsdm-workspace")
    .evaluate((node) =>
      (node as HTMLElement).style.setProperty("--text-scale", "1.25"),
    );
  const latest = page.getByRole("link", {
    name: `Open latest post in 原始主題 42: ${latestName} · 2026-11-12 20:04`,
    exact: true,
  });
  await expect(latest).toBeVisible();
  const geometry = await page.locator("#thread-list-pane").evaluate((pane) => {
    const link = pane.querySelector(".latest-reply")!;
    return {
      pane: pane.getBoundingClientRect().toJSON(),
      link: link.getBoundingClientRect().toJSON(),
      clientWidth: pane.clientWidth,
      scrollWidth: pane.scrollWidth,
    };
  });
  expect(geometry.link.right).toBeLessThanOrEqual(geometry.pane.right);
  expect(geometry.scrollWidth).toBe(geometry.clientWidth);
  await info.attach("geometry.json", {
    body: JSON.stringify(geometry),
    contentType: "application/json",
  });
  await info.attach("narrow-cjk.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("requests.json", {
    body: JSON.stringify(requests),
    contentType: "application/json",
  });
});

const posts = (late: boolean) =>
  `${account}<div id="pt"><a href="${boardURL}">音樂討論</a></div><div id="postlist"><h1 id="thread_subject">原始主題 42</h1>${late ? '<div id="post_7002"><a id="postnum7002">51</a><div class="pcb"><p>Earlier final page post.</p></div></div><div id="post_105"><a id="postnum105">56</a><div class="pcb"><p>Actual latest source post; PID differs from floor and reply count.</p></div></div>' : '<div id="post_101"><a id="postnum101">1</a><div class="pcb"><p>Opening source post.</p></div></div>'}</div><div class="pg"><strong>${late ? 6 : 1}</strong><a href="${threadURL}&page=${late ? 5 : 6}">${late ? 5 : 6}</a></div>`;
for (const alreadySelected of [false, true])
  test(`B2.latest-${alreadySelected ? "selected" : "unopened"}: actual redirect reaches exact late PID and survives return`, async ({
    browser,
  }, info) => {
    await withRedirectFixture(
      browser,
      {
        origin,
        redirect: `${threadURL}&page=6#lastpost`,
        document: (url) =>
          url.searchParams.get("mod") === "forumdisplay"
            ? board()
            : posts(url.searchParams.get("page") === "6"),
      },
      async (page, requests, redirects) => {
        try {
          await page.goto(boardURL);
          const title = page.locator(".thread-row .subject");
          await expect(title).toHaveAttribute("href", threadURL);
          if (alreadySelected) {
            await title.click();
            await expect(
              page.getByRole("article", { name: "Post 101", exact: true }),
            ).toBeVisible();
          }
          await page
            .getByRole("link", {
              name: `Open latest post in 原始主題 42: ${latestName} · 2026-11-12 20:04`,
              exact: true,
            })
            .click();
          await expect(
            page.getByRole("article", { name: "Post 105", exact: true }),
          ).toHaveAttribute("data-targeted", "true");
          expect(redirects).toEqual(["fetch", "document"]);
          await expect(
            page.getByRole("link", {
              name: "Continue in native forum",
              exact: true,
            }),
          ).toHaveAttribute("href", `${threadURL}&page=6&tsdm-native=1#pid105`);
          await clickThreadTool(page, "Back");
          await expect(title).toHaveAttribute("href", threadURL);
          if (alreadySelected) {
            await title.click();
            await expect(
              page.getByRole("article", { name: "Post 101", exact: true }),
            ).toBeVisible();
            expect(redirects).toEqual(["fetch", "document"]);
          }
          await page.reload();
          await expect(
            page.getByRole("link", {
              name: `Open latest post in 原始主題 42: ${latestName} · 2026-11-12 20:04`,
              exact: true,
            }),
          ).toBeVisible();
        } finally {
          await info.attach("latest-destination.png", {
            body: await page.screenshot(),
            contentType: "image/png",
          });
          await info.attach("requests-and-redirects.json", {
            body: JSON.stringify({ requests, redirects }),
            contentType: "application/json",
          });
        }
      },
    );
  });

test("B2.exact-pid: native findpost without thread identity preserves its destination", async ({
  page,
}, info) => {
  const destination = `${origin}/forum.php?mod=redirect&goto=findpost&pid=105`;
  const requests = await open(
    page,
    board(
      row(
        42,
        `<cite>Exact Replier</cite><em><a href="${destination}">2026-11-12</a></em>`,
      ),
    ),
  );
  try {
    await expect(
      page.getByRole("link", {
        name: "Open latest post in 原始主題 42: Exact Replier · 2026-11-12",
        exact: true,
      }),
    ).toHaveAttribute("href", destination);
  } finally {
    await info.attach("exact-pid.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await info.attach("requests.json", {
      body: JSON.stringify(requests),
      contentType: "application/json",
    });
  }
});
