export const origin = "https://www.tsdm39.com";
export const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const nativeReasons =
  "var reasons = ['广告垃圾','违规内容','恶意灌水','重复发帖','其他'];\nvar reasonstring = '';\nfor (i=0; i<reasons.length; i++) {\nreasonstring += '<label><input type=\"radio\" name=\"report_select\" class=\"pr\" onclick=\"' + (i < reasons.length -1 ? '$(\\'report_message\\').innerHTML=this.value;' : '') + '$(\\'report_other\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\';$(\\'report_msg\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\'\" value=\"' + reasons[i] + '\"> ' + reasons[i] + '</label><br />';\n}\n$('report_reasons').innerHTML = reasonstring;\n";

export function createReportFixture() {
  return {
    member: "7",
    available: true,
    refused: false,
    wrongTarget: false,
    formActor: 7,
    hashMismatch: false,
    script: nativeReasons,
    extra: "",
    outcome: "success",
    action: "misc.php?mod=report",
    token: "SYNTHETIC_TOKEN",
    selectedField: "reportsubmit",
    reportValue: "true",
    limit: "200",
    keyup: "dstrLenCalc(this, 'checklen');",
    header: "",
    disabled: false,
    handler:
      "if(!$('report_message').value) return false;ajaxpost(this.id, 'form_miscreport101');",
  };
}
export function renderReportResponse(
  state: ReturnType<typeof createReportFixture>,
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
  if (u.pathname === "/misc.php") {
    if (request.method === "POST") {
      if (state.outcome === "lost") return route.abort();
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body:
          state.outcome === "rejected"
            ? '<div class="alert_error">举报被拒绝</div>'
            : '<div class="alert_right">举报成功</div>',
      });
    }
    const hidden = {
      referer: threadURL,
      [state.selectedField]: state.reportValue,
      rtype: "post",
      rid: state.wrongTarget ? "999" : "101",
      fid: "5",
      url: threadURL,
      inajax: "1",
      handlekey: "miscreport101",
      formhash: state.token,
    };
    let body = state.refused
      ? '<div class="alert_error">没有权限举报</div>'
      : `<form id="form_miscreport101" method="post" action="${state.action}" onsubmit="${state.handler}">${Object.entries(
          hidden,
        )
          .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
          .join(
            "",
          )}<div id="report_reasons"></div><div id="report_other"><textarea id="report_message" name="message" onfocus="this.innerHTML='';this.focus=null;this.className='reasonarea pt mtn'" onkeyup="${state.keyup}" ${state.disabled ? "disabled" : ""}>请填写举报内容</textarea></div><div id="report_msg"><span class="z">还可输入 <strong id="checklen">${state.limit}</strong> 个字符</span></div><button id="report_submit" type="submit" value="true">举报</button>${state.extra}</form><script>${state.script}</script>`;
    if (adjacent && u.searchParams.get("rid") === "201")
      body = body.replaceAll("101", "201");
    return route.fulfill({
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: 1,
        type: "result",
        schema: 13,
        kind: "page",
        uid: state.formActor,
        formhash: state.hashMismatch ? "OTHER" : state.token,
        document: state.header + body,
      }),
    });
  }
  let document = `<div id="um"><strong><a href="home.php?mod=space&uid=${state.member}">Member ${state.member}</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Board</a></div><div id="postlist"><h1 id="thread_subject">Report target</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=8">Other author</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Exact post body</p></div><div class="po"><div class="pob">${state.available ? `<a href="javascript:;" onclick="showWindow('miscreport101', 'misc.php?mod=report&rtype=post&rid=101&tid=42&fid=5', 'get', -1);return false;">举报</a>` : ""}</div></div></div></div>`;
  if (adjacent) {
    const second = u.searchParams.get("page") === "2";
    if (second) document = document.replaceAll("101", "201");
    document += `<div class="pg"><input name="custompage" value="${second ? 2 : 1}">${second ? `<a class="prev" href="${threadURL}&page=1">上一页</a><a href="${threadURL}&page=1">1</a><strong>2</strong>` : `<strong>1</strong><a href="${threadURL}&page=2">2</a><a class="nxt" href="${threadURL}&page=2">下一页</a>`}</div>`;
  }
  return route.fulfill({
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ document }),
  });
}
