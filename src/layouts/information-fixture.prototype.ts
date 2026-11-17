// Authored sample content; transport never calls fetch or the live forum.
import {
  createSharedReplyFixture,
  renderSharedReplyResponse,
  origin,
  boardURL,
  threadURL,
} from "../../tests/e2e/shared-reply-fixture";
export { boardURL, threadURL, origin };
export const samples = [
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
  ["50", "週末一起聽：雨天與鋼琴", "分享", "海月", "小森", "08:56", "8", "102"],
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
const fixture = createSharedReplyFixture();
export const requests = fixture.requests;
const row = (sample: string[], pinned = false) => {
  const [id, title, category, author, latest, time, replies, views] = sample;
  return `<tbody id="${pinned ? "stick" : "normal"}thread_${id}"><tr><th><em>[${category}]</em><a class="xst" href="${threadURL(id!)}">${title}</a></th><td class="by"><cite>${author}</cite><em>2026-11-16</em></td><td class="num"><a>${replies}</a><em>${views}</em></td>${latest ? `<td class="by"><cite><a href="home.php?mod=space&uid=6">${latest}</a></cite><em><a href="${threadURL(id!)}&page=1#pid${id}02">${time}</a></em></td>` : ""}</tr></tbody>`;
};
export async function response(
  url: string,
  method: string,
  body: string | null,
) {
  if (method !== "GET") {
    requests.push({ url, method, body });
    return {
      status: 403,
      url,
      contentType: "text/html",
      body: '<div id="messagetext">Prototype: publication is unavailable.</div>',
    };
  }
  const parsed = new URL(url);
  const mod = parsed.searchParams.get("mod");
  const rendered = await renderSharedReplyResponse(fixture, {
    url,
    method,
    body,
  });
  if (rendered.contentType !== "application/json")
    return { ...rendered, status: 200, url };
  const payload = JSON.parse(rendered.body);
  if (typeof payload.document !== "string")
    return { ...rendered, status: 200, url };
  let html: string = payload.document;
  if (mod === "forumdisplay") {
    const category = `${boardURL}&filter=typeid&typeid=3`;
    const rows = parsed.searchParams.has("typeid")
      ? samples.filter((s) => s[2] === "音樂")
      : samples;
    html = html.replace(
      /<div id="ct">[\s\S]*$/,
      `<div id="ct"><h1><a href="${boardURL}">音樂交流</a><span class="xs1 xw0 i">今日: <strong>12</strong> · 主题: <strong>7587</strong></span></h1></div><div id="subforum_5"><table><tr><td><h2><a href="${origin}/forum.php?mod=forumdisplay&fid=6">原聲帶與配樂</a></h2><p class="xg2">討論配樂；分享前請註明作品與出處。</p></td></tr></table></div><div id="thread_types"><a href="${category}">音樂</a></div><table id="threadlisttableid">${row(["44", "版規與資源分享須知", "置頂", "管理組", "管理組", "11 月 12 日", "3", "1820"], true)}${rows.map((s) => row(s)).join("")}</table>`,
    );
  } else if (mod === "viewthread") {
    const id = parsed.searchParams.get("tid") ?? "42";
    const sample = samples.find((s) => s[0] === id);
    const title = sample?.[1] ?? "版規與資源分享須知";
    html = html
      .replace(`Thread ${id}`, title)
      .replace(`Other author`, sample?.[3] ?? "管理組")
      .replace(
        `Original opening for thread ${id}`,
        "最近又翻出了以前收藏的原聲帶。聽到熟悉的前奏，當時看動畫的畫面一下就回來了。<br><br>有些歌適合認真聽，有些則會陪著日常。我最近循環最多的是一首很安靜的鋼琴曲，通勤的路上聽剛剛好。<br><br>你最近在聽什麼？也想知道，哪一段旋律會讓你想起一個故事。",
      )
      .replace(
        `id="postnum${id}01"`,
        `id="postnum${id}01" href="${threadURL(id)}#pid${id}01"`,
      )
      .replace(
        /<\/div>$/,
        `<div id="post_${id}02"><div class="authi"><a href="home.php?mod=space&uid=8">${sample?.[4] || "管理組"}</a><em>${sample?.[5] || "11 月 12 日"}</em></div><a id="postnum${id}02" href="${threadURL(id)}#pid${id}02">2#</a><div class="pcb"><p>最近在重聽《夏目友人帳》的配樂。很喜歡那種留白，聽著就會慢慢安靜下來。</p><blockquote>有些歌會陪著日常。</blockquote><p>同感。音樂和記憶總是連在一起的。</p></div></div></div>`,
      );
  } else if (!mod) {
    html = `<div id="um"><strong><a href="home.php?mod=space&uid=7">Prototype member</a></strong></div><div class="bm bmw"><div class="bm_h"><h2>交流區</h2></div><table><tr><td><h2><a href="${boardURL}">音樂交流</a></h2><p>分享聆聽與發現</p></td></tr></table></div>`;
  }
  if (parsed.searchParams.get("fid") === "6")
    html = html
      .replace("音樂交流", "原聲帶與配樂")
      .replace(/<div id="subforum_5">[\s\S]*?<\/table><\/div>/, "");
  return {
    status: 200,
    url,
    contentType: "application/json",
    body: JSON.stringify({ ...payload, document: html }),
  };
}
