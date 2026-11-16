import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";
import { clickThreadTool } from "./navigation-ui";
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
    return route.fulfill({
      contentType: representation === "json" ? "application/json" : "text/html",
      body:
        representation === "json" ? JSON.stringify({ document: html }) : html,
    });
  });
  await page.goto(boardURL);
  await expect(page.locator(".thread-row").first()).toBeVisible();
  return requests;
}
test("B2.metadata: native latest author and timestamp replace repeated title", async ({
  page,
}, info) => {
  const requests = await open(page);
  try {
    const latest = page.locator(".thread-row").getByRole("link", {
      name: `Latest reply: ${latestName} · 2026-11-12 20:04`,
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
        name: "Latest reply: Replier unavailable · Time unavailable",
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
        name: "Latest reply: Replier unavailable · 2026-11-12",
        exact: true,
      }),
    ).toHaveAttribute("href", target(43));
    await expect(
      rows.nth(1).getByRole("link", {
        name: "Latest reply: Reply Forty Four · Time unavailable",
        exact: true,
      }),
    ).toHaveAttribute("href", target(44));
    await expect(rows.nth(2)).toContainText(
      "Latest reply: Replier unavailable · Time unavailable",
    );
    for (let i = 2; i < 7; i++)
      await expect(rows.nth(i).getByRole("link")).toHaveCount(1);
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
      "Latest reply: Replier unavailable · Time unavailable",
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
    name: `Latest reply: ${latestName} · 2026-11-12 20:04`,
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
              name: `Latest reply: ${latestName} · 2026-11-12 20:04`,
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
              name: `Latest reply: ${latestName} · 2026-11-12 20:04`,
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
        name: "Latest reply: Exact Replier · 2026-11-12",
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
