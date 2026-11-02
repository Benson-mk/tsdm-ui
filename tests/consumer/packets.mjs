import packetAssert from "node:assert/strict";
import { URL as PacketURL, URLSearchParams as PacketParams } from "node:url";
import { createForumClient as createPacketClient } from "@tsdm/forum-client";
// Failure inventory: docs/implementation/34-consumer.md. Only authored external
// transport is substituted. Package consent and outcome contracts, not UI state.
const packetCases = [];
const packetRoundTrip = (value) =>
  packetAssert.deepEqual(JSON.parse(JSON.stringify(value)), value);
for (const mode of ["direct", "funded-draft"]) {
  const packetOrigin = "https://fixture.example";
  const packetThread = packetOrigin + "/forum.php?mod=viewthread&tid=42";
  const packetList =
    packetOrigin +
    "/home.php?mod=space&do=thread&view=me&type=thread&filter=save";
  const state = {
    saved: null,
    funded: false,
    published: false,
    posts: [],
    reads: [],
  };
  const actor =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer 7</a></strong></div>';
  const board =
    '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>';
  const escape = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  const controls = `<div class="hb-postbox">
<div class="hb-row"><label>總金額</label><input type="number" name="hb_total" min="1" step="1"></div>
<div class="hb-row"><label>份數</label><input type="number" name="hb_shares" min="1" max="100" step="1" value="1"><span class="hb-hint">最多 100 份;每份至少 10</span></div>
<label><input type="radio" name="hb_split" value="1" checked>拼手氣</label><label><input type="radio" name="hb_split" value="2">均分</label>
<label><input type="checkbox" name="hb_cond" value="1">必須回帖後才能搶</label>
<input name="hb_password" type="text" maxlength="64"><input name="hb_appoint" type="text" placeholder="會員名,可多個(逗號分隔)">
<select name="hb_expire"><option value="1">1 小時</option><option value="6">6 小時</option><option value="24" selected>1 天</option><option value="0">不自動到期</option></select>
<input type="text" name="hb_blessing" maxlength="50" value="恭喜發財,大吉大利">
<div class="hb-hint">紅包金額在扣款成功後才鎖定;發表後不可補塞、不可加碼。</div></div>`;
  const form = (edit) =>
    `${actor}${board}<form id="postform" method="post" action="forum.php?mod=post&action=${edit ? "edit&tid=42&pid=101&editsubmit=yes" : "newthread&topicsubmit=yes"}&fid=5"><input type="hidden" name="formhash" value="AUTHORED-PACKET-SECRET"><input type="hidden" name="save" id="postsave" value=""><input name="subject" value="Portable packet"><textarea name="message">${escape(edit ? state.saved.get("message") : "")}</textarea><input name="price" value="0">${edit ? "" : controls}<button name="${edit ? "editsubmit" : "topicsubmit"}" type="submit" value="yes">Publish</button><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save</button></form>`;
  const client = createPacketClient({
    origin: packetOrigin,
    transport: {
      async request(url, options) {
        const target = new PacketURL(url);
        if (options?.method === "POST") {
          const submitted = new PacketParams(options.body);
          state.posts.push(submitted);
          if (submitted.has("hb_total")) state.funded = true;
          state.saved = submitted;
          state.published = submitted.get("save") !== "1";
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body: `<root><![CDATA[<script>succeedhandle_post('${packetThread}','Stored',{});</script>]]></root>`,
          };
        }
        state.reads.push(url);
        if (target.pathname === "/plugin.php")
          return {
            status: 200,
            url,
            contentType: "application/json",
            body: JSON.stringify(
              state.funded
                ? {
                    ok: true,
                    tid: 42,
                    state: "open",
                    cond: 0,
                    haspw: 0,
                    appoint: 0,
                    splitmode: 1,
                    bless: "Portable wishes",
                  }
                : { ok: false, error: "這裡沒有紅包" },
            ),
          };
        if (target.searchParams.get("ac") === "credit")
          return {
            status: 200,
            url,
            contentType: "text/html",
            body: `${actor}<table class="dt"><tr><th>操作</th><th>积分变更</th><th>变更后</th><th>详情</th><th>变更时间</th></tr>${state.funded ? '<tr><td><a href="home.php?mod=spacecp&ac=credit&op=log&optype=HBS">HBS</a></td><td>天使币 -20</td><td>Unattributed</td><td>Synthetic funding</td><td>2026-10-24 12:00</td></tr>' : ""}</table>`,
          };
        let body;
        if (target.pathname === "/home.php")
          body = `${actor}<a class="a" href="${packetList}">草稿箱</a><form id="delform"><table><tbody>${state.saved && !state.published ? '<tr><th><a href="forum.php?mod=viewthread&tid=42">Portable packet</a></th><td><a href="forum.php?mod=forumdisplay&fid=5">Music</a></td></tr>' : '<tr><td><p class="emp">还没有相关的帖子</p></td></tr>'}</tbody></table></form>`;
        else if (target.searchParams.get("mod") === "post")
          body = form(target.searchParams.get("action") === "edit");
        else
          body = `${actor}${board}<div id="postlist"><h1><span id="thread_subject">Portable packet</span>${state.published ? "" : '<span class="xg1">(草稿)</span>'}</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101">1#</a><div class="pcb">Stored body<div class="hb-entry" data-tid="42">Packet</div></div><div class="po"><div class="pob">${state.published ? "" : '<a class="psave" href="forum.php?mod=misc&action=pubsave&tid=42">Publish</a>'}</div></div></div></div>`;
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const prepared = await client.prepareNewThread("5", true);
  packetAssert.equal(prepared.kind, "prepared");
  packetAssert.ok(prepared.prepared.redPacket);
  const rawSource = "[unknown]完整 raw packet source & <literal>[/unknown]";
  const values = {
    hb_total: "20",
    hb_shares: "1",
    hb_blessing: "Portable wishes",
  };
  const writing = {
    ...prepared.prepared,
    title: "Portable packet",
    source: rawSource,
    options: prepared.prepared.options.map((option) => ({
      ...option,
      value: values[option.name] ?? option.value,
    })),
  };
  packetRoundTrip(writing);
  let final;
  if (mode === "direct") {
    const reviewed = await client.prepareThreadPublication({
      contextId: "portable-packet-direct",
      revision: 1,
      writing,
    });
    packetAssert.equal(reviewed.kind, "ready");
    final = await client.publishThread({
      id: "portable-packet-direct-attempt",
      publication: reviewed.publication,
      status: "pending",
      checked: false,
      message: "",
      candidateURL: null,
      result: null,
    });
    packetAssert.equal(final.status, "confirmed");
    const before = state.posts.length;
    const checked = await client.checkThreadResult(
      JSON.parse(JSON.stringify(final)),
    );
    packetAssert.equal(checked.status, "confirmed");
    packetAssert.equal(state.posts.length, before);
    packetRoundTrip(checked);
  } else {
    const initial = {
      id: "portable-funded-save",
      generation: client.generation,
      submission: {
        contextId: "portable-funded-context",
        revision: 1,
        writing,
      },
      status: "pending",
      message: "",
      result: null,
    };
    const refused = await client.prepareDraftSave(initial);
    packetAssert.equal(
      refused.status,
      "not-sent",
      "Headless funded Save requires explicit immediate-funding consent",
    );
    packetAssert.equal(state.posts.length, 0);
    const ready = await client.prepareDraftSave({
      ...initial,
      fundingReviewed: true,
    });
    const saved = await client.saveDraft(ready);
    packetAssert.equal(saved.status, "confirmed");
    packetAssert.equal(saved.result.threadId, "42");
    packetAssert.equal(saved.observation.packetMarker, true);
    packetAssert.equal(saved.redPacket.state, "open");
    packetAssert.equal(saved.redPacket.credit, "unknown");
    packetAssert.equal(state.published, false);
    packetRoundTrip(saved);
    const listing = await client.readDrafts();
    packetAssert.equal(listing.kind, "drafts");
    const resumed = await client.resumeDraft(
      listing.drafts.rows[0],
      listing.account,
    );
    packetAssert.equal(resumed.kind, "prepared");
    packetAssert.equal(resumed.prepared.source, rawSource);
    packetAssert.equal(resumed.prepared.existingRedPacket, true);
    packetAssert.equal(resumed.prepared.redPacket, undefined);
    packetAssert.equal(
      resumed.prepared.options.some((option) => option.name.startsWith("hb_")),
      false,
    );
    const publication = {
      ...initial,
      id: "portable-funded-publish",
      operation: "publish",
      generation: client.generation,
      submission: {
        ...initial.submission,
        revision: 2,
        writing: resumed.prepared,
      },
    };
    final = await client.publishDraft(publication);
    packetAssert.equal(final.status, "published");
    packetAssert.equal(final.observation.state, "published");
    const publishedRead = await client.readThread(packetThread);
    packetAssert.equal(publishedRead.kind, "thread");
    packetAssert.equal(publishedRead.thread.posts[0].redPacketThreadId, "42");
    packetRoundTrip(publishedRead);
    const checked = await client.checkDraft(JSON.parse(JSON.stringify(final)));
    packetAssert.equal(checked.status, "published");
    packetAssert.equal(state.posts.length, 2);
    packetAssert.equal(state.posts[1].has("hb_total"), false);
    packetRoundTrip(checked);
  }
  packetAssert.equal(final.redPacket.state, "open");
  packetAssert.equal(
    final.redPacket.credit,
    "unknown",
    "Ledger observation must not claim specific debit attribution",
  );
  packetAssert.equal(final.redPacket.ledger.state, "observed");
  packetAssert.equal(final.redPacket.ledger.rows[0].operation, "HBS");
  packetAssert.equal(
    state.posts.filter((post) => post.has("hb_total")).length,
    1,
  );
  packetAssert.ok(
    state.posts.every((post) => post.get("message") === rawSource),
  );
  packetAssert.equal(
    JSON.stringify(final).includes("AUTHORED-PACKET-SECRET"),
    false,
  );
  packetRoundTrip(final);
  packetCases.push({
    name: `packet-${mode}-public-consent-and-independent-observations`,
    status: "passed",
    posts: state.posts.length,
    fundingCommands: 1,
    credit: final.redPacket.credit,
  });
}
