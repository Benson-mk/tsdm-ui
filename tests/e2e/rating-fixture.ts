export const origin = "https://www.tsdm39.com";
export const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;

export function createRatingFixture() {
  return {
    member: "7",
    authorFilter: true,
    available: true,
    refused: false,
    mismatch: false,
    scoreMax: 3,
    outcome: "confirmed",
    sent: false,
    changedCheckbox: false,
    formActor: "",
    malformed: false,
    hashMismatch: false,
    foreignQuery: false,
    hiddenScore: false,
    notifyChecked: false,
  };
}
export function renderRatingResponse(
  state: ReturnType<typeof createRatingFixture>,
  request: { url: string; method: string; body: string | null },
  adjacent = false,
) {
  const u = new URL(request.url);
  const route = {
    fulfill: (response: { contentType: string; body: string }) => ({
      ...response,
      abort: false as const,
    }),
    abort: () => ({ abort: true as const }),
  };
  if (
    u.searchParams.get("action") === "rate" &&
    request.method === "GET" &&
    u.searchParams.get("infloat") !== "yes"
  )
    return route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: '<div class="alert_error">未定义操作</div>',
    });
  const account = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Member ${state.member}</a></strong></div>`;
  let body =
    u.searchParams.get("action") === "rate" && state.formActor
      ? account.replace(`uid=${state.member}`, `uid=${state.formActor}`)
      : account;
  if (u.searchParams.get("action") === "rate") {
    if (request.method === "POST") {
      state.sent = true;
      if (state.outcome === "lost") return route.abort();
      body +=
        state.outcome === "rejected"
          ? '<div class="alert_error">今日评分已用完</div>'
          : '<div class="alert_right">评分成功</div>';
    } else
      body += state.refused
        ? '<div class="alert_error">没有权限评分</div>'
        : `<form id="rateform" method="post" action="forum.php?mod=misc&action=rate&ratesubmit=yes&infloat=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="tid" value="42"><input type="hidden" name="pid" value="${state.mismatch ? "999" : "101"}"><input type="hidden" name="referer" value="${threadURL}"><input type="hidden" name="handlekey" value="rate"><table><tr><th>积分</th><th></th><th>评分区间</th><th>今日剩余</th></tr>${[4, 5].map((id) => `<tr><td>${id === 4 ? "天然" : "腹黑"}</td><td><input id="score${id}" name="score${id}" value="0"><ul><li>-3</li><li>0</li><li>${state.scoreMax}</li></ul></td><td>-3 ~ ${state.scoreMax}</td><td>10</td></tr>`).join("")}</table><input name="reason" value=""><ul id="reasonselect"><li>很给力!</li><li>赞一个!</li></ul><label><input type="checkbox" name="sendreasonpm" ${state.changedCheckbox ? 'value="different"' : ""} ${state.notifyChecked ? "checked" : ""}>通知作者</label><button type="submit" name="ratesubmit" value="true">评分</button></form>`;
  } else if (u.searchParams.get("action") === "viewratings")
    body += `<table class="list"><tr><th>积分</th><th>用户</th><th>时间</th><th>理由</th></tr>${state.sent && state.outcome === "confirmed" ? '<tr><td>天然 +2</td><td><a href="home.php?mod=space&uid=7">Member 7</a></td><td>2026-11-13 12:00</td><td>Thanks</td></tr>' : ""}</table>`;
  else
    body += `<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board</a></div><div id="postlist"><h1 id="thread_subject">Rating target</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Exact post body</p></div><div class="po"><div class="pob">${state.available ? `<a href="javascript:;" onclick="showWindow('rate', 'forum.php?mod=misc&action=rate&tid=42&pid=101', 'get', -1);return false;">评分</a>` : ""}</div></div></div></div>`;
  if (adjacent && u.searchParams.get("mod") === "viewthread") {
    const number = Number(u.searchParams.get("page") ?? "1");
    body = body
      .replaceAll("101", `${number}01`)
      .replaceAll("uid=8", `uid=${number + 7}`);
    if (state.authorFilter)
      body = body.replace(
        '<div class="authi">',
        `<div class="authi"><a href="${threadURL}&authorid=${number + 7}">只看该作者</a>`,
      );
    body += `<div class="pg"><input name="custompage" value="${number}">${number > 1 ? `<a class="prev" href="${threadURL}&page=${number - 1}">上一页</a>` : ""}${[1, 2, 3].map((p) => (p === number ? `<strong>${p}</strong>` : `<a href="${threadURL}&page=${p}">${p}</a>`)).join("")}${number < 3 ? `<a class="nxt" href="${threadURL}&page=${number + 1}">下一页</a>` : ""}</div>`;
  }
  if (adjacent && u.searchParams.get("pid") === "201")
    body = body.replaceAll("101", "201");
  if (state.malformed) body = body.replace("-3 ~ 3", "unknown");
  if (state.foreignQuery)
    body = body.replace(
      "ratesubmit=yes&infloat=yes",
      "ratesubmit=yes&infloat=yes&tid=999",
    );
  if (state.hiddenScore)
    body = body.replace(
      'id="score4" name="score4"',
      'type="hidden" id="score4" name="score4"',
    );
  if (
    ["structured-log", "log-account"].includes(state.outcome) &&
    u.searchParams.get("action") === "viewratings"
  )
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(
        state.sent
          ? {
              ok: 1,
              type: "result",
              schema: 13,
              kind: "page",
              uid: state.outcome === "log-account" ? 9 : 7,
              document:
                '<table class="list"><tr><td>积分</td><td>用户</td><td>时间</td><td>理由</td></tr><tr><td>天然 +2</td><td><a href="home.php?mod=space&uid=7">Member 7</a></td><td>2026-11-13 12:00</td><td>Thanks</td></tr></table>',
            }
          : {
              ok: 0,
              type: "result",
              schema: 13,
              kind: "handle",
              uid: 7,
              message_key: "thread_rate_log_nonexistence",
              message: "抱歉，指定帖子在近一年内没有评分记录",
            },
      ),
    });
  if (u.searchParams.get("action") === "rate" && request.method === "GET")
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: 1,
        type: "result",
        schema: 13,
        kind: "page",
        message: "",
        message_key: "",
        uid: Number(state.formActor || state.member),
        formhash: state.hashMismatch ? "DIFFERENT_TOKEN" : "SYNTHETIC_TOKEN",
        document: body.replace(/<div id="um">.*?<\/div>/, ""),
      }),
    });
  if (
    state.outcome === "native" &&
    u.searchParams.get("action") === "viewratings"
  )
    return route.fulfill({
      contentType: "text/xml; charset=utf-8",
      body: `<?xml version="1.0" encoding="utf-8"?><root><![CDATA[${state.sent ? '<h3>查看全部评分</h3><table class="list"><tr><td>积分</td><td>用户</td><td>时间</td><td>理由</td></tr><tr><td>天然 +2</td><td><a href="home.php?mod=space&uid=7">Member 7</a></td><td>2026-11-13 12:00</td><td>Thanks</td></tr></table>' : "<script>errorhandle_viewratings('抱歉，指定帖子在近一年内没有评分记录', {});</script>"}]]></root>`,
    });
  if (state.outcome === "native" && u.searchParams.get("action") === "rate")
    return route.fulfill({ contentType: "text/html; charset=utf-8", body });
  return route.fulfill({
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ document: body }),
  });
}
