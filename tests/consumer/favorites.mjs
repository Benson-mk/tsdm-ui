import favoriteAssert from "node:assert/strict";
import { URL as FavoriteURL } from "node:url";
import { randomUUID as favoriteAttemptId } from "node:crypto";
import { createForumClient as createFavoriteClient } from "@tsdm/forum-client";
const favoriteCases = [];
{
  const favoriteOrigin = "https://fixture.example";
  const favoriteTarget = favoriteOrigin + "/forum.php?mod=viewthread&tid=42";
  const favoriteAccount =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader</a></strong></div>';
  const favoriteThread =
    favoriteAccount +
    '<div id="postlist"><h1 id="thread_subject">Portable favorite target</h1><div id="post_101"><div class="authi">Writer</div><a id="postnum101" href="' +
    favoriteTarget +
    '#pid101">1</a><div class="pcb"><p>Retained target.</p></div><div id="p_btn"><a id="k_favorite" href="home.php?mod=spacecp&ac=favorite&type=thread&id=42&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">收藏</a></div></div></div>';
  let present = false,
    writes = 0,
    lost = false;
  const transport = {
    async request(url) {
      const parsed = new FavoriteURL(url);
      if (parsed.searchParams.get("ac") === "favorite") {
        writes++;
        present = true;
        if (lost) throw new TypeError("Synthetic lost response");
        return {
          url,
          status: 200,
          contentType: "text/xml",
          body: "<root><![CDATA[untrusted acknowledgement]]></root>",
        };
      }
      const document =
        parsed.searchParams.get("do") === "favorite"
          ? favoriteAccount +
            '<div id="ct">' +
            (present
              ? '<ul id="favorite_ul"><li id="fav_942"><a href="home.php?mod=spacecp&ac=favorite&op=delete&favid=942">删除</a><input name="favorite[]" type="checkbox" value="942" vid="42"><a href="forum.php?mod=viewthread&tid=42">Portable favorite target</a><span class="xg1">2026-10-22</span></li></ul>'
              : '<p class="emp">您还没有添加任何收藏</p>') +
            "</div>"
          : favoriteThread;
      return {
        url,
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ uid: 7, document }),
      };
    },
  };
  const favoriteClient = createFavoriteClient({
    origin: favoriteOrigin,
    transport,
  });
  await favoriteClient.readPage(favoriteTarget);
  const intent = {
    action: "add",
    kind: "thread",
    targetId: "42",
    recordId: null,
    accountId: "7",
  };
  const prepared = await favoriteClient.prepareFavorite(intent);
  favoriteAssert.equal(prepared.kind, "ready");
  favoriteAssert.equal(writes, 0);
  favoriteAssert.equal(
    JSON.stringify(prepared).includes("SYNTHETIC_PUBLIC_FORM_TOKEN"),
    false,
  );
  const attempt = {
    id: favoriteAttemptId(),
    command: prepared.command,
    status: "pending",
    checked: false,
    message: "",
    pages: null,
  };
  const altered = JSON.parse(JSON.stringify(attempt));
  altered.command.intent.targetId = "43";
  favoriteAssert.equal(
    (await favoriteClient.changeFavorite(altered)).status,
    "not-sent",
  );
  favoriteAssert.equal(writes, 0);
  favoriteCases.push("altered-preparation-refused");
  const confirmed = await favoriteClient.changeFavorite(attempt);
  favoriteAssert.equal(confirmed.status, "confirmed");
  favoriteAssert.equal(confirmed.pages[0].records[0].id, "942");
  favoriteAssert.equal(confirmed.pages[0].records[0].targetId, "42");
  favoriteAssert.equal(writes, 1);
  favoriteAssert.deepEqual(JSON.parse(JSON.stringify(confirmed)), confirmed);
  favoriteAssert.equal(
    JSON.stringify(confirmed).includes("SYNTHETIC_PUBLIC_FORM_TOKEN"),
    false,
  );
  favoriteCases.push("native-add-independent-presence");
  favoriteAssert.equal(
    (await favoriteClient.changeFavorite(attempt)).status,
    "not-sent",
  );
  favoriteAssert.equal(writes, 1);
  favoriteCases.push("used-attempt-refused");
  present = false;
  lost = true;
  const next = await favoriteClient.prepareFavorite(intent);
  favoriteAssert.equal(next.kind, "ready");
  const unknown = await favoriteClient.changeFavorite({
    ...attempt,
    id: favoriteAttemptId(),
    command: next.command,
  });
  favoriteAssert.equal(unknown.status, "uncertain");
  favoriteAssert.equal(writes, 2);
  favoriteAssert.equal(
    (await favoriteClient.prepareFavorite(intent)).kind,
    "unavailable",
  );
  favoriteCases.push("uncertain-attempt-blocks-unwarned-resend");
  const freshClient = createFavoriteClient({
    origin: favoriteOrigin,
    transport,
  });
  const checked = await freshClient.checkFavoriteResult(
    JSON.parse(JSON.stringify(unknown)),
  );
  favoriteAssert.equal(checked.status, "confirmed");
  favoriteAssert.equal(checked.id, unknown.id);
  favoriteAssert.equal(writes, 2);
  favoriteAssert.equal(typeof globalThis.document, "undefined");
  favoriteAssert.equal(typeof globalThis.GM, "undefined");
  favoriteCases.push("fresh-client-check-no-replay");
}

// Public preparation authority must survive concurrent reads and later uncertainty.
// Failure inventory: repair30-failure-inventory.md in the retained task evidence.
async function favoriteRaceFixture() {
  const origin = "https://fixture.example";
  const member =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader</a></strong></div>';
  const state = { writes: [], present: new Set(), lost: true, hold: null };
  const transport = {
    async request(url) {
      const parsed = new FavoriteURL(url);
      const targetId = parsed.searchParams.get("tid") ?? "42";
      if (parsed.searchParams.get("ac") === "favorite") {
        const target = parsed.searchParams.get("id");
        state.writes.push(target);
        if (state.lost) throw new TypeError("Synthetic unestablished effect");
        state.present.add(target);
        return {
          url,
          status: 200,
          contentType: "text/xml",
          body: "<root><![CDATA[acknowledgement]]></root>",
        };
      }
      const list = parsed.searchParams.get("do") === "favorite";
      if (state.hold?.kind === (list ? "list" : "target")) {
        const hold = state.hold;
        state.hold = null;
        hold.enter();
        await hold.promise;
      }
      const rows = [...state.present]
        .map(
          (id) =>
            `<li id="fav_9${id}"><a href="home.php?mod=spacecp&ac=favorite&op=delete&favid=9${id}">删除</a><input name="favorite[]" type="checkbox" value="9${id}" vid="${id}"><a href="forum.php?mod=viewthread&tid=${id}">Target ${id}</a><span class="xg1">2026-10-24</span></li>`,
        )
        .join("");
      const document =
        member +
        (list
          ? `<div id="ct">${rows ? `<ul id="favorite_ul">${rows}</ul>` : '<p class="emp">您还没有添加任何收藏</p>'}</div>`
          : `<div id="postlist"><h1 id="thread_subject">Target ${targetId}</h1><div id="post_101"><div class="authi">Writer</div><a id="postnum101" href="forum.php?mod=viewthread&tid=${targetId}#pid101">1</a><div class="pcb"><p>Retained target.</p></div><div id="p_btn"><a id="k_favorite" href="home.php?mod=spacecp&ac=favorite&type=thread&id=${targetId}&formhash=SYNTHETIC_PUBLIC_FORM_TOKEN">收藏</a></div></div></div>`);
      return {
        url,
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ uid: 7, document }),
      };
    },
  };
  const client = createFavoriteClient({ origin, transport });
  await client.readPage(`${origin}/forum.php?mod=viewthread&tid=42`);
  const intent = {
    action: "add",
    kind: "thread",
    targetId: "42",
    recordId: null,
    accountId: "7",
  };
  const attempt = (prepared) => ({
    id: favoriteAttemptId(),
    command: prepared.command,
    status: "pending",
    checked: false,
    message: "",
    pages: null,
  });
  function hold(kind) {
    let release, enter;
    const promise = new Promise((resolve) => {
      release = resolve;
    });
    const entered = new Promise((resolve) => {
      enter = resolve;
    });
    state.hold = { kind, promise, enter };
    return { entered, release };
  }
  return { client, origin, transport, state, intent, attempt, hold };
}
const favoriteRaceFailures = [];
async function favoriteRaceCase(name, run) {
  try {
    await run();
    favoriteCases.push(name);
  } catch (error) {
    favoriteRaceFailures.push({ name, message: error.message });
  }
}
await favoriteRaceCase(
  "stale-preparation-cannot-bypass-uncertainty",
  async () => {
    const f = await favoriteRaceFixture();
    const first = await f.client.prepareFavorite(f.intent);
    const second = await f.client.prepareFavorite(f.intent);
    favoriteAssert.equal(first.kind, "ready");
    favoriteAssert.equal(second.kind, "ready");
    const unknown = await f.client.changeFavorite(f.attempt(first));
    favoriteAssert.equal(unknown.status, "uncertain");
    favoriteAssert.equal(unknown.checked, false);
    const stale = await f.client.changeFavorite(f.attempt(second));
    favoriteAssert.equal(stale.status, "not-sent");
    favoriteAssert.deepEqual(f.state.writes, ["42"]);
  },
);
await favoriteRaceCase(
  "retry-authority-excludes-newer-uncertainty",
  async () => {
    const f = await favoriteRaceFixture();
    const first = await f.client.changeFavorite(
      f.attempt(await f.client.prepareFavorite(f.intent)),
    );
    const original = JSON.stringify(first);
    const checked = await f.client.checkFavoriteResult(first);
    favoriteAssert.equal(checked.status, "uncertain");
    favoriteAssert.equal(checked.checked, true);
    const next = await f.client.prepareFavorite(f.intent, first.id);
    const stale = await f.client.prepareFavorite(f.intent, first.id);
    favoriteAssert.equal(next.kind, "ready");
    favoriteAssert.equal(stale.kind, "ready");
    const newer = await f.client.changeFavorite(f.attempt(next));
    favoriteAssert.equal(newer.status, "uncertain");
    favoriteAssert.equal(newer.checked, false);
    favoriteAssert.equal(
      (await f.client.prepareFavorite(f.intent, first.id)).kind,
      "unavailable",
    );
    await f.client.checkFavoriteResult(newer);
    favoriteAssert.equal(
      (await f.client.changeFavorite(f.attempt(stale))).status,
      "not-sent",
    );
    favoriteAssert.deepEqual(f.state.writes, ["42", "42"]);
    const fresh = await f.client.prepareFavorite(f.intent, newer.id);
    favoriteAssert.equal(fresh.kind, "ready");
    favoriteAssert.deepEqual(Object.keys(fresh.command).sort(), [
      "generation",
      "id",
      "intent",
    ]);
    f.state.lost = false;
    favoriteAssert.equal(
      (await f.client.changeFavorite(f.attempt(fresh))).status,
      "confirmed",
    );
    favoriteAssert.deepEqual(f.state.writes, ["42", "42", "42"]);
    favoriteAssert.equal(JSON.stringify(first), original);
    favoriteAssert.equal(first.status, "uncertain");
    favoriteAssert.equal(newer.status, "uncertain");
  },
);
await favoriteRaceCase(
  "preparation-await-does-not-import-resend-authority",
  async () => {
    const f = await favoriteRaceFixture();
    const first = await f.client.prepareFavorite(f.intent);
    const hold = f.hold("list");
    const preparing = f.client.prepareFavorite(f.intent);
    await hold.entered;
    const unknown = await f.client.changeFavorite(f.attempt(first));
    favoriteAssert.equal(unknown.status, "uncertain");
    hold.release();
    const late = await preparing;
    favoriteAssert.equal(late.kind, "unavailable");
    favoriteAssert.deepEqual(f.state.writes, ["42"]);
  },
);
await favoriteRaceCase(
  "execution-await-rechecks-imported-uncertainty",
  async () => {
    const f = await favoriteRaceFixture();
    const ready = await f.client.prepareFavorite(f.intent);
    const other = createFavoriteClient({
      origin: f.origin,
      transport: f.transport,
    });
    await other.readPage(`${f.origin}/forum.php?mod=viewthread&tid=42`);
    const unknown = await other.changeFavorite(
      f.attempt(await other.prepareFavorite(f.intent)),
    );
    const hold = f.hold("target");
    const sending = f.client.changeFavorite(f.attempt(ready));
    await hold.entered;
    const recovered = await f.client.checkFavoriteResult(unknown);
    favoriteAssert.equal(recovered.status, "uncertain");
    favoriteAssert.equal(recovered.checked, true);
    hold.release();
    favoriteAssert.equal((await sending).status, "not-sent");
    favoriteAssert.deepEqual(f.state.writes, ["42"]);
  },
);
await favoriteRaceCase(
  "unrelated-target-retains-preparation-authority",
  async () => {
    const f = await favoriteRaceFixture();
    const unknown = await f.client.changeFavorite(
      f.attempt(await f.client.prepareFavorite(f.intent)),
    );
    favoriteAssert.equal(unknown.status, "uncertain");
    const unrelated = await f.client.prepareFavorite({
      ...f.intent,
      targetId: "43",
    });
    favoriteAssert.equal(unrelated.kind, "ready");
    f.state.lost = false;
    const result = await f.client.changeFavorite(f.attempt(unrelated));
    favoriteAssert.equal(result.status, "confirmed");
    favoriteAssert.deepEqual(f.state.writes, ["42", "43"]);
  },
);
favoriteAssert.deepEqual(
  favoriteRaceFailures,
  [],
  JSON.stringify(favoriteRaceFailures),
);
