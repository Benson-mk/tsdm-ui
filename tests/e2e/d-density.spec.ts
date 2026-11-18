import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("D8-D10.reference-density: authored D titles use the production host without a preview reserve", async ({
  page,
}, info) => {
  const origin = "https://www.tsdm39.com";
  const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
  // Authored presentation-reference values from 35d8a26, consumed only as HTTP.
  // No prototype module, workspace or transport enters the application graph.
  const samples = [
    [
      "42",
      "最近循環播放的是哪一首？",
      "交流",
      "小森",
      "青空",
      "09:42",
      "24",
      "386",
    ],
    [
      "43",
      "那些讓你記住一整部動畫的配樂",
      "音樂",
      "月白",
      "星野",
      "09:18",
      "18",
      "241",
    ],
    [
      "50",
      "週末一起聽：雨天與鋼琴",
      "分享",
      "海月",
      "小森",
      "08:56",
      "8",
      "102",
    ],
    [
      "51",
      "從片頭到片尾，那些陪我們走過四季、每次重聽都有不同感受的旋律",
      "交流",
      "雨音",
      "青空",
      "08:30",
      "31",
      "608",
    ],
    [
      "52",
      "你會如何整理自己的原聲帶收藏？",
      "交流",
      "風鈴",
      "海月",
      "08:12",
      "12",
      "164",
    ],
    [
      "53",
      "十一月新番 OP / ED 聆聽筆記",
      "音樂",
      "星野",
      "月白",
      "07:48",
      "27",
      "432",
    ],
    ["54", "尋找一首只記得前奏的歌", "求助", "橘子", "", "", "", ""],
    [
      "55",
      "分享你的桌面音響配置",
      "交流",
      "白露",
      "風鈴",
      "昨天 22:10",
      "16",
      "290",
    ],
    [
      "56",
      "第一次聽現場演出的感受",
      "分享",
      "青空",
      "雨音",
      "昨天 21:06",
      "9",
      "188",
    ],
    [
      "57",
      "純音樂推薦：留一點安靜給夜晚",
      "音樂",
      "海月",
      "白露",
      "昨天 20:40",
      "6",
      "97",
    ],
  ];
  const row = (sample: string[], pinned = false) => {
    const [id, title, category, author, latest, time, replies, views] = sample;
    return `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><em>[${category}]</em><a class="xst" href="forum.php?mod=viewthread&tid=${id}">${title}</a></th><td class="by"><cite>${author}</cite><em>2026-11-16</em></td><td class="num"><a>${replies}</a><em>${views}</em></td>${latest ? `<td class="by"><cite>${latest}</cite><em><a href="forum.php?mod=viewthread&tid=${id}&page=1#pid${id}02">${time}</a></em></td>` : ""}</tr></tbody>`;
  };
  const html = `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="ct"><h1><a href="${boardURL}">音樂交流</a><span class="xs1 xw0 i">今日: <strong>12</strong> · 主题: <strong>7587</strong></span></h1></div><div id="subforum_5"><table><tr><td><h2><a href="${origin}/forum.php?mod=forumdisplay&fid=6">原聲帶與配樂</a></h2><p class="xg2">討論配樂；分享前請註明作品與出處。</p></td></tr></table></div><div id="thread_types"><a href="${boardURL}&filter=typeid&typeid=3">音樂</a></div><table id="threadlisttableid">${row(["44", "版規與資源分享須知", "置頂", "管理組", "管理組", "11 月 12 日", "3", "1820"], true)}${samples.map((sample) => row(sample)).join("")}</table>`;
  const requests: { url: string; method: string }[] = [];
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/__density.js")
      return route.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body><script src="${origin}/__density.js"></script></body></html>`,
      });
    requests.push({ url: request.url(), method: request.method() });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ document: html }),
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(boardURL);
  const pane = page.locator("#thread-list-pane");
  await expect(pane.locator(".thread-row:visible")).toHaveCount(10);
  const observed = await pane.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const rows = [...node.querySelectorAll<HTMLElement>(".thread-row")]
      .filter((row) => row.getBoundingClientRect().height > 0)
      .map((row) => ({
        id: row.dataset.threadId,
        bounds: row.getBoundingClientRect().toJSON(),
      }));
    return {
      pane: bounds.toJSON(),
      paddingBottom: getComputedStyle(node).paddingBottom,
      completeRows: rows.filter(
        ({ bounds: b }) => b.top >= bounds.top && b.bottom <= bounds.bottom,
      ).length,
      rows,
    };
  });
  expect(observed.pane.bottom).toBe(900);
  expect(parseFloat(observed.paddingBottom)).toBeLessThan(100);
  expect(observed.completeRows).toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Inspect", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("[data-variant]")).toHaveCount(0);
  expect(requests).toEqual([
    { url: `${boardURL}&tsdmapp=json`, method: "GET" },
  ]);
  await info.attach("reference-density.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await info.attach("reference-density.json", {
    body: JSON.stringify({
      runtime: page.context().browser()!.version(),
      reference:
        "35d8a26 D: 4 complete initial rows, first row116px; historical prototype includes development reserve",
      observed,
      requests,
    }),
    contentType: "application/json",
  });
});
