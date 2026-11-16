import {
  createSharedReplyFixture,
  renderSharedReplyResponse,
  origin,
  boardURL,
  threadURL,
} from "./shared-reply-fixture";
export { origin, boardURL, threadURL };
export const integratedAuthor = "很長的中文回覆對象名稱 · Other author";
export function createIntegratedUXFixture() {
  return createSharedReplyFixture();
}
export async function renderIntegratedUXResponse(
  state: ReturnType<typeof createIntegratedUXFixture>,
  request: { url: string; method: string; body: string | null },
) {
  const response = await renderSharedReplyResponse(state, request);
  if (request.method !== "GET" || response.contentType !== "application/json")
    return response;
  const payload = JSON.parse(response.body);
  if (typeof payload.document !== "string") return response;
  const url = new URL(request.url);
  let html: string = payload.document;
  if (url.searchParams.get("mod") === "forumdisplay") {
    const row = (id: string, pin = false) =>
      `<tbody id="${pin ? "stick" : "normal"}thread_${id}"><tr><th><a class="xst" href="${threadURL(id)}">${pin ? "Pinned guide" : "Listening notes"} ${id} · 音樂交流</a></th><td class="by"><cite>Original author</cite><em>2026-11-13</em></td><td class="num"><a>12</a><em>80</em></td><td class="by"><cite><a href="home.php?mod=space&uid=6">${integratedAuthor}</a></cite><em><a href="${threadURL(id)}&pid=${id}02#pid${id}02">2026-11-15 08:30</a></em></td></tr></tbody>`;
    const category = `${boardURL}&filter=typeid&typeid=3`;
    const filters = `<div id="thread_types"><a href="${category}">Listening category</a></div><div id="filter_special_menu"><a href="${boardURL}&filter=specialtype&specialtype=poll">Poll</a></div><div id="filter_reward_menu"><a href="${boardURL}&filter=specialtype&specialtype=reward&rewardtype=1">Unsolved</a></div><div id="filter_dateline_menu"><ul class="pop_moremenu"><li>排序: <a href="${boardURL}&filter=reply&orderby=heats">热度</a></li><li>时间: <a href="${boardURL}&filter=dateline&orderby=lastpost&dateline=604800">一周</a></li></ul></div><div id="filter_orderby_menu"><a href="${boardURL}&filter=heat&orderby=heats">热门</a></div>`;
    html = html.replace(
      /<div id="ct">[\s\S]*$/,
      `<div id="ct"><h1><a href="${boardURL}">音樂討論 · Music discussion</a><span class="xs1 xw0 i">今日: <strong>12</strong> · 主题: <strong>7587</strong></span></h1></div>${filters}<table id="threadlisttableid">${row("44", true)}${row("42")}${row("43")}${url.searchParams.has("typeid") ? "" : Array.from({ length: 12 }, (_, i) => row(String(i + 50))).join("")}</table>`,
    );
  } else if (url.searchParams.get("mod") === "viewthread") {
    const id = url.searchParams.get("tid") ?? "42",
      n = Number(url.searchParams.get("page") ?? "1");
    const post = n === 1 ? `${id}02` : `${id}${n}2`;
    const paragraphs = Array.from(
      { length: 3 },
      (_, i) =>
        `<p>完整閱讀段落 ${i + 1} · ${"分享最近的音樂發現與交流心得。 ".repeat(8)}</p>`,
    ).join("");
    const extra = `<div id="post_${post}"><div class="authi"><a href="home.php?mod=space&uid=6">${integratedAuthor}</a></div><a id="postnum${post}" href="${threadURL(id)}&page=${n}#pid${post}">${n * 2}#</a><div class="pcb">${paragraphs}</div></div>`;
    html = html.replace(/<\/div>$/, `${extra}</div>`);
    html = html
      .replace("Other author", integratedAuthor)
      .replace(
        `Original opening for thread ${id}`,
        `音樂交流 ${id} · 分享正在聽的作品。`,
      );
    if (n > 1) html = html.replaceAll(`${id}01`, `${id}${n}1`);
    html += `<div class="pg">${[1, 2, 3].map((p) => (p === n ? `<strong>${p}</strong>` : `<a href="${threadURL(id)}&page=${p}">${p}</a>`)).join("")}<label><input name="custompage" value="${n}" onkeydown="if(event.keyCode==13) {window.location='forum.php?mod=viewthread&tid=${id}&page='+this.value;; doane(event);}"><span title="共 3 页"> / 3 页</span></label></div>`;
  }
  return { ...response, body: JSON.stringify({ ...payload, document: html }) };
}
