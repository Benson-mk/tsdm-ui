import publicationAssert from "node:assert/strict";
import { URL, URLSearchParams } from "node:url";
import { setTimeout } from "node:timers";
import { createForumClient as createPublicationClient } from "@tsdm/forum-client";
const publicationOrigin = "https://fixture.example";
const publicationThreadURL =
  publicationOrigin + "/forum.php?mod=viewthread&tid=42";
// Failure inventory: stale/superseded preparation, cross-client identity reuse,
// mutated revision, duplicate pending activation, failed preflight, changed actor
// before/during preparation, send and independent readback, explicit restored
// attempt checking, incomplete source/options and unsupported response grammar.
// Current ordinary submitter literals must survive the successful-control body.
// The installed public package is the whole system; only external HTTP is replaced.
const publicationCases = [];
const publicationFailures = [];
const publicationSource =
  "[unknown]完整來源 & <tag>[/unknown]\n[table][tr][td]portable[/td][/tr][/table]";
const escapePublication = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
function publicationFixture() {
  const state = {
    actor: "7",
    posts: [],
    requests: [],
    gate: null,
    postGate: null,
    failure: false,
    response: null,
    sourceChange: (body) => body,
    submitterValue: null,
    formChange: (body) => body,
  };
  const memberHTML = (id) =>
    '<div id="um"><strong><a href="home.php?mod=space&uid=' +
    id +
    '">Writer ' +
    id +
    "</a></strong></div>";
  const writingForm = (id, saved) => {
    const get = (name, fallback = "") =>
      escapePublication(saved?.get(name) ?? fallback);
    return state.formChange(
      memberHTML(id) +
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=' +
        (saved ? "edit&tid=42&pid=101" : "newthread") +
        '&fid=5&topicsubmit=yes"><input type="hidden" name="formhash" value="PRIVATE-PUBLICATION-TOKEN"><input name="subject" value="' +
        get("subject", "Portable publication") +
        '"><textarea name="message">' +
        get("message", publicationSource) +
        '</textarea><input name="price" value="' +
        get("price", "2") +
        '"><label><input type="checkbox" name="usesig" value="1"' +
        (!saved || saved.has("usesig") ? " checked" : "") +
        ">Signature</label>" +
        (state.submitterValue === null
          ? ""
          : '<button name="topicsubmit" value="' +
            state.submitterValue +
            '">Publish</button>') +
        "</form>",
      saved,
    );
  };
  const publicationClient = createPublicationClient({
    origin: publicationOrigin,
    transport: {
      async request(url, options) {
        state.requests.push({ url, options });
        const selected = new URL(url),
          id = state.actor;
        if (options?.method === "POST") {
          state.posts.push(new URLSearchParams(options.body));
          if (state.postGate) await state.postGate;
          if (state.response === "lost") throw Error("Authored lost response");
          return {
            status: 200,
            url,
            contentType: "text/xml",
            body:
              state.response ??
              "<root><![CDATA[<script>succeedhandle_post('forum.php?mod=viewthread&tid=42', 'Published', {'fid':'5','tid':'42','pid':'101'});</script>]]></root>",
          };
        }
        let body;
        if (selected.searchParams.get("action") === "newthread")
          body = writingForm(id);
        else if (selected.searchParams.get("action") === "edit")
          body = state.sourceChange(writingForm(id, state.posts.at(-1)));
        else
          body =
            memberHTML(id) +
            '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><div id="postlist"><h1 id="thread_subject">' +
            escapePublication(
              state.posts.at(-1)?.get("subject") ?? "Portable publication",
            ) +
            '</h1><div id="post_101"><div class="authi"><a href="home.php?mod=space&uid=7">Writer 7</a></div><a id="postnum101"><em>1</em>#</a><div class="pcb"><p>Independent rendered post</p></div></div></div>';
        if (state.gate?.matches(url)) await state.gate.promise;
        if (state.failure) throw Error("Authored preflight failure");
        return { status: 200, url, contentType: "text/html", body };
      },
    },
  });
  const submission = async () => {
    const prepared = await publicationClient.prepareNewThread("5");
    publicationAssert.equal(prepared.kind, "prepared");
    return {
      contextId: "external-context",
      revision: 3,
      writing: prepared.prepared,
    };
  };
  const attempt = (publication) => ({
    id: "external-attempt-" + publication.id,
    publication,
    status: "pending",
    message: "",
    checked: false,
    candidateURL: null,
    result: null,
  });
  const gate = (matches) => {
    let release;
    const promise = new Promise((resolve) => {
      release = resolve;
    });
    state.gate = { matches, promise };
    return () => {
      state.gate = null;
      release();
    };
  };
  return { state, client: publicationClient, submission, attempt, gate };
}
async function publicationCase(name, run) {
  try {
    await run();
    publicationCases.push({ name, status: "passed" });
  } catch (error) {
    publicationCases.push({ name, status: "failed", message: error.message });
    publicationFailures.push(name + ": " + error.message);
  }
}
await publicationCase(
  "literal native true submitter preserves ordinary action and exact body",
  async () => {
    const f = publicationFixture();
    f.state.submitterValue = "true";
    const submission = await f.submission();
    const ready = await f.client.prepareThreadPublication(submission);
    publicationAssert.equal(ready.kind, "ready");
    const result = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(result.status, "confirmed");
    publicationAssert.equal(f.state.posts.length, 1);
    publicationAssert.deepEqual(f.state.posts[0].getAll("topicsubmit"), [
      "true",
    ]);
    publicationAssert.equal(f.state.posts[0].get("message"), publicationSource);
    const post = f.state.requests.filter((r) => r.options?.method === "POST");
    publicationAssert.equal(post.length, 1);
    publicationAssert.deepEqual(
      new URL(post[0].url).searchParams.getAll("topicsubmit"),
      ["yes"],
    );
  },
);
await publicationCase(
  "complete immutable source/options and independent confirmation",
  async () => {
    const f = publicationFixture(),
      submission = await f.submission();
    const ready = await f.client.prepareThreadPublication(submission);
    publicationAssert.equal(ready.kind, "ready");
    submission.writing.source = "Later caller edit";
    const result = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(result.status, "confirmed");
    publicationAssert.equal(result.publication.submission.revision, 3);
    publicationAssert.equal(
      result.publication.submission.writing.source,
      publicationSource,
    );
    publicationAssert.equal(f.state.posts[0].get("message"), publicationSource);
    publicationAssert.equal(f.state.posts[0].get("price"), "2");
    publicationAssert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    publicationAssert.equal(
      JSON.stringify(result).includes("PRIVATE-PUBLICATION-TOKEN"),
      false,
    );
    publicationAssert.equal(
      f.state.requests.filter(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ).length,
      1,
    );
    const restored = {
      ...result,
      status: "uncertain",
      checked: false,
      result: null,
    };
    const fresh = publicationFixture();
    fresh.state.posts = f.state.posts;
    const checked = await fresh.client.checkThreadResult(
      JSON.parse(JSON.stringify(restored)),
      publicationThreadURL,
    );
    publicationAssert.equal(checked.status, "confirmed");
    publicationAssert.equal(checked.id, result.id);
    publicationAssert.deepEqual(checked.publication, result.publication);
    publicationAssert.equal(
      fresh.state.requests.some((r) => r.options?.method === "POST"),
      false,
    );
  },
);
await publicationCase(
  "superseded same-context preparation cannot send",
  async () => {
    const f = publicationFixture(),
      submission = await f.submission();
    const older = await f.client.prepareThreadPublication(submission);
    const newer = await f.client.prepareThreadPublication({
      ...submission,
      revision: 4,
    });
    publicationAssert.equal(newer.kind, "ready");
    const result = await f.client.publishThread(f.attempt(older.publication));
    publicationAssert.equal(result.status, "not-sent");
    publicationAssert.equal(f.state.posts.length, 0);
  },
);
await publicationCase(
  "fresh clients never reuse serializable preparation identity",
  async () => {
    const a = publicationFixture(),
      b = publicationFixture();
    const first = await a.client.prepareThreadPublication(await a.submission());
    const second = await b.client.prepareThreadPublication(
      await b.submission(),
    );
    publicationAssert.notEqual(first.publication.id, second.publication.id);
  },
);
await publicationCase(
  "caller edits while preparation waits cannot change submitted snapshot",
  async () => {
    const f = publicationFixture(),
      submission = await f.submission();
    const release = f.gate(
      (url) => new URL(url).searchParams.get("action") === "newthread",
    );
    const pending = f.client.prepareThreadPublication(submission);
    submission.writing.source = "Unreviewed later edit";
    submission.revision = 4;
    release();
    const ready = await pending;
    publicationAssert.equal(ready.kind, "ready");
    publicationAssert.equal(ready.publication.submission.revision, 3);
    publicationAssert.equal(
      ready.publication.submission.writing.source,
      publicationSource,
    );
  },
);
await publicationCase(
  "caller edits while publication waits cannot change original attempt",
  async () => {
    const f = publicationFixture(),
      ready = await f.client.prepareThreadPublication(await f.submission());
    const attempt = f.attempt(ready.publication),
      original = JSON.parse(JSON.stringify(attempt));
    const release = f.gate(
      (url) => new URL(url).searchParams.get("action") === "newthread",
    );
    const pending = f.client.publishThread(attempt);
    attempt.id = "later-mutated-id";
    attempt.publication.submission.writing.source = "Later caller content";
    release();
    const result = await pending;
    publicationAssert.equal(result.status, "confirmed");
    publicationAssert.equal(result.id, original.id);
    publicationAssert.deepEqual(result.publication, original.publication);
    publicationAssert.equal(f.state.posts[0].get("message"), publicationSource);
  },
);
await publicationCase(
  "fresh preparation after recovery establishes same actor immediately",
  async () => {
    const old = publicationFixture(),
      submission = await old.submission(),
      recovered = publicationFixture();
    publicationAssert.equal(
      (await recovered.client.prepareThreadPublication(submission)).kind,
      "ready",
    );
  },
);
await publicationCase(
  "mutated public submission refuses without POST",
  async () => {
    const f = publicationFixture(),
      ready = await f.client.prepareThreadPublication(await f.submission());
    const changed = JSON.parse(JSON.stringify(ready.publication));
    changed.submission.revision++;
    publicationAssert.equal(
      (await f.client.publishThread(f.attempt(changed))).status,
      "not-sent",
    );
    publicationAssert.equal(f.state.posts.length, 0);
  },
);
await publicationCase(
  "duplicate pending activation has one effectful request",
  async () => {
    const f = publicationFixture(),
      ready = await f.client.prepareThreadPublication(await f.submission());
    let release;
    f.state.postGate = new Promise((resolve) => {
      release = resolve;
    });
    const attempt = f.attempt(ready.publication),
      first = f.client.publishThread(attempt);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const second = await f.client.publishThread(attempt);
    publicationAssert.equal(second.status, "not-sent");
    publicationAssert.equal(f.state.posts.length, 1);
    release();
    publicationAssert.equal((await first).status, "confirmed");
  },
);
await publicationCase(
  "preflight transport failure is known not sent",
  async () => {
    const f = publicationFixture(),
      ready = await f.client.prepareThreadPublication(await f.submission());
    f.state.failure = true;
    publicationAssert.equal(
      (await f.client.publishThread(f.attempt(ready.publication))).status,
      "not-sent",
    );
    publicationAssert.equal(f.state.posts.length, 0);
  },
);
for (const phase of ["prepare", "preflight", "result", "source"])
  await publicationCase(
    "delayed " + phase + " cannot overwrite a newer actor observation",
    async () => {
      const f = publicationFixture(),
        submission = await f.submission();
      const ready =
        phase === "prepare"
          ? null
          : await f.client.prepareThreadPublication(submission);
      if (["result", "source"].includes(phase))
        f.state.posts.push(
          new URLSearchParams({
            subject: submission.writing.title,
            message: submission.writing.source,
            price: "2",
            usesig: "1",
          }),
        );
      const release = f.gate(
        (url) =>
          new URL(url).searchParams.get("action") ===
            (phase === "source" ? "edit" : "newthread") ||
          (phase === "result" &&
            new URL(url).searchParams.get("mod") === "viewthread"),
      );
      const pending =
        phase === "prepare"
          ? f.client.prepareThreadPublication(submission)
          : phase === "preflight"
            ? f.client.publishThread(f.attempt(ready.publication))
            : f.client.checkThreadResult(
                { ...f.attempt(ready.publication), status: "uncertain" },
                publicationThreadURL,
              );
      await new Promise((resolve) => setTimeout(resolve, 0));
      f.state.actor = "8";
      // Observe the new account through a distinct current read that is not gated.
      const savedGate = f.state.gate;
      f.state.gate = null;
      await f.client.readThread(publicationThreadURL);
      f.state.gate = savedGate;
      publicationAssert.equal(f.client.account.id, "8");
      const observedGeneration = f.client.generation;
      release();
      const result = await pending;
      publicationAssert.equal(f.client.account.id, "8");
      publicationAssert.equal(f.client.generation, observedGeneration);
      if (phase === "result")
        publicationAssert.equal(
          f.state.requests.some(
            (r) => new URL(r.url).searchParams.get("action") === "edit",
          ),
          false,
        );
      publicationAssert.equal(
        phase === "prepare" ? result.kind : result.status,
        phase === "prepare"
          ? "stale"
          : phase === "preflight"
            ? "not-sent"
            : "uncertain",
      );
      if (phase === "preflight")
        publicationAssert.equal(f.state.posts.length, 0);
    },
  );
await publicationCase(
  "changed actor while POST pending retains uncertainty",
  async () => {
    const f = publicationFixture(),
      ready = await f.client.prepareThreadPublication(await f.submission());
    let release;
    f.state.postGate = new Promise((resolve) => {
      release = resolve;
    });
    const pending = f.client.publishThread(f.attempt(ready.publication));
    await new Promise((resolve) => setTimeout(resolve, 0));
    f.state.actor = "8";
    await f.client.readThread(publicationThreadURL);
    release();
    publicationAssert.equal((await pending).status, "uncertain");
    publicationAssert.equal(f.state.posts.length, 1);
    publicationAssert.equal(f.client.account.id, "8");
  },
);
// Authored before the stored-publication/effect distinction: the independently
// installed package is exercised without DOM, Vue, GM or browser globals.
const nativePublicationCallback =
  "<root><![CDATA[<script>if(typeof succeedhandle_=='function'){succeedhandle_('forum.php?mod=viewthread&tid=42', 'Stored', {'fid':'5','tid':'42','pid':'101','feedid':'77'});}</script>]]></root>";
const nativePublicationEffects = [
  { name: "addfeed", requested: true, included: true, outcome: "unknown" },
  { name: "adddynamic", requested: true, included: true, outcome: "unknown" },
  {
    name: "adddynamic_doing",
    requested: false,
    included: false,
    outcome: "not-requested",
  },
];
// Before repair: omission cannot qualify submitted-blank normalization, while
// an unchanged disabled blank still permits independently matching persistence.
for (const [storedPrice, status] of [
  ["0", "uncertain"],
  ["", "confirmed"],
])
  await publicationCase(
    "disabled blank price omitted from command with stored " +
      JSON.stringify(storedPrice),
    async () => {
      const f = publicationFixture();
      f.state.formChange = (body, saved) =>
        body.replace(
          /name="price" value="[^"]*"/,
          'name="price" value="' + (saved ? storedPrice : "") + '" disabled',
        );
      const ready = await f.client.prepareThreadPublication(
        await f.submission(),
      );
      publicationAssert.equal(ready.kind, "ready");
      const before = JSON.stringify(ready.publication);
      const result = await f.client.publishThread(f.attempt(ready.publication));
      publicationAssert.equal(f.state.posts.length, 1);
      publicationAssert.equal(f.state.posts[0].has("price"), false);
      publicationAssert.equal(JSON.stringify(result.publication), before);
      publicationAssert.deepEqual(
        result.publication.submission.writing.options.find(
          (o) => o.name === "price",
        ),
        ready.publication.submission.writing.options.find(
          (o) => o.name === "price",
        ),
      );
      publicationAssert.equal(result.status, status);
      if (status === "uncertain") publicationAssert.equal(result.result, null);
      else
        publicationAssert.deepEqual(
          result.result.verification.normalizations,
          [],
        );
    },
  );
function nativePublicationFixture(disabled = false) {
  const f = publicationFixture();
  f.state.formChange = (body, saved) =>
    body
      .replace(
        "</form>",
        '<select name="typeid"><option value="0" selected>No category</option><option value="3">Listening</option></select><select name="readperm"><option value="0">Everyone</option></select><label><input type="checkbox" name="bbcodeoff" value="1">Disable BBCode</label></form>',
      )
      .replace(
        /name="price" value="[^"]*"/,
        'name="price" value="' + (saved ? "0" : "") + '"',
      )
      .replace(
        "</form>",
        (saved
          ? ""
          : '<label><input type="checkbox" name="addfeed" value="1" checked' +
            (disabled ? " disabled" : "") +
            '>Publish activity</label><label><input type="checkbox" name="adddynamic" value="true" checked>Share with followers</label><label><input type="checkbox" name="adddynamic_doing" value="true">Ask followers to share</label>') +
          "</form>",
      );
  f.state.response = nativePublicationCallback;
  return f;
}
await publicationCase(
  "qualified stored proof preserves normalization and independent unknown effects",
  async () => {
    const f = nativePublicationFixture();
    const submitted = await f.submission();
    const ready = await f.client.prepareThreadPublication(submitted);
    publicationAssert.equal(ready.kind, "ready");
    const before = JSON.stringify(ready.publication);
    const result = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(result.status, "confirmed");
    publicationAssert.deepEqual(result.result.verification, {
      stored: "verified",
      normalizations: [{ name: "price", submitted: "", stored: "0" }],
      creationEffects: nativePublicationEffects,
    });
    publicationAssert.equal(JSON.stringify(result.publication), before);
    publicationAssert.equal(f.state.posts[0].get("price"), "");
    publicationAssert.equal(f.state.posts[0].get("addfeed"), "1");
    publicationAssert.equal(f.state.posts[0].has("adddynamic_doing"), false);
    publicationAssert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    publicationAssert.equal(JSON.stringify(result).includes('"feedid"'), false);
  },
);
await publicationCase(
  "checked disabled creation instruction is requested but not included or verified",
  async () => {
    const f = nativePublicationFixture(true);
    const ready = await f.client.prepareThreadPublication(await f.submission());
    publicationAssert.equal(ready.kind, "ready");
    const result = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(result.status, "confirmed");
    publicationAssert.deepEqual(result.result.verification.creationEffects[0], {
      name: "addfeed",
      requested: true,
      included: false,
      outcome: "unknown",
    });
    publicationAssert.equal(f.state.posts[0].has("addfeed"), false);
  },
);
await publicationCase(
  "legacy uncertain original upgrades by GET-only check and failed recheck retains prior proof",
  async () => {
    const f = nativePublicationFixture();
    f.state.response = "lost";
    const ready = await f.client.prepareThreadPublication(await f.submission());
    const original = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(original.status, "uncertain");
    publicationAssert.equal(original.result, null);
    const checked = await f.client.checkThreadResult(
      JSON.parse(JSON.stringify(original)),
      publicationThreadURL,
    );
    publicationAssert.equal(checked.status, "confirmed");
    publicationAssert.equal(checked.id, original.id);
    publicationAssert.deepEqual(checked.publication, original.publication);
    f.state.failure = true;
    const rechecked = await f.client.checkThreadResult(
      JSON.parse(JSON.stringify(checked)),
    );
    publicationAssert.equal(rechecked.status, "confirmed");
    publicationAssert.deepEqual(rechecked.result, checked.result);
    publicationAssert.match(
      rechecked.message,
      /Previous stored confirmation retained/,
    );
    publicationAssert.equal(f.state.posts.length, 1);
    publicationAssert.equal(
      f.state.requests.filter((r) => r.options?.method === "POST").length,
      1,
    );
  },
);
for (const [name, change] of [
  ["missing price", (body) => body.replace(/<input name="price"[^>]*>/, "")],
  [
    "unexplained price",
    (body) => body.replace('name="price" value="0"', 'name="price" value="2"'),
  ],
  [
    "missing signature",
    (body) =>
      body.replace(
        /<label><input type="checkbox" name="usesig"[\s\S]*?<\/label>/,
        "",
      ),
  ],
  [
    "changed source",
    (body) =>
      body.replace(
        /<textarea name="message">[\s\S]*?<\/textarea>/,
        '<textarea name="message">Different</textarea>',
      ),
  ],
  [
    "missing permission",
    (body) => body.replace(/<select name="readperm">[\s\S]*?<\/select>/, ""),
  ],
  [
    "changed category",
    (body) =>
      body
        .replace('value="0" selected', 'value="0"')
        .replace('value="3"', 'value="3" selected'),
  ],
  [
    "changed parsing",
    (body) =>
      body.replace(
        'name="bbcodeoff" value="1"',
        'name="bbcodeoff" value="1" checked',
      ),
  ],
])
  await publicationCase(
    "stored normalization cannot hide " + name,
    async () => {
      const f = nativePublicationFixture();
      f.state.sourceChange = change;
      const ready = await f.client.prepareThreadPublication(
        await f.submission(),
      );
      const result = await f.client.publishThread(f.attempt(ready.publication));
      publicationAssert.equal(result.status, "uncertain");
      publicationAssert.equal(result.result, null);
      publicationAssert.match(
        result.message,
        /Complete stored source or offered options did not match/,
      );
    },
  );
for (const [name, response] of [
  [
    "unguarded empty suffix",
    nativePublicationCallback
      .replace("if(typeof succeedhandle_=='function'){", "")
      .replace(";}", ";"),
  ],
  [
    "mismatched guard",
    nativePublicationCallback.replace(
      "typeof succeedhandle_",
      "typeof succeedhandle_post",
    ),
  ],
  [
    "arbitrary suffix",
    nativePublicationCallback.replaceAll(
      "succeedhandle_",
      "succeedhandle_other",
    ),
  ],
  [
    "extra script",
    nativePublicationCallback.replace(
      "</script>",
      "</script><script>extra()</script>",
    ),
  ],
  [
    "dynamic argument",
    nativePublicationCallback.replace(
      "'forum.php?mod=viewthread&tid=42'",
      "destination",
    ),
  ],
])
  await publicationCase("callback refuses " + name, async () => {
    const f = nativePublicationFixture();
    f.state.response = response;
    const ready = await f.client.prepareThreadPublication(await f.submission());
    const result = await f.client.publishThread(f.attempt(ready.publication));
    publicationAssert.equal(result.status, "uncertain");
    publicationAssert.equal(
      f.state.requests.some(
        (r) => new URL(r.url).searchParams.get("action") === "edit",
      ),
      false,
    );
  });
if (publicationFailures.length)
  throw Error(JSON.stringify({ publicationCases }, null, 2));
