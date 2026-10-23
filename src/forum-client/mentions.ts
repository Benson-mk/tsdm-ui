import { children, descendants, documentFrom, text } from "./html.js";
import { decodeWriting } from "./prepare-writing.js";
import type {
  Account,
  ForumTransport,
  MentionResult,
  PreparedWriting,
} from "./types.js";
export interface MentionConfig {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}
/** Explicit person lookup through the current atplus form capability. Never infer a person from plain @ text. */
export async function findMention(
  config: MentionConfig,
  writing: PreparedWriting,
  query: string,
): Promise<MentionResult> {
  const fail = (
    message: string,
    kind: "invalid" | "stale" | "network" = "invalid",
  ): MentionResult => ({
    kind,
    message,
    account: config.account(),
    generation: config.generation(),
  });
  if (!query.trim() || query.length > 100)
    return fail("Enter a person name or UID to resolve.");
  if (writing.action === "edit-post" && !writing.editTarget)
    return fail("The original edit target is unavailable.");
  const editTarget =
    writing.action === "edit-post"
      ? writing.editTarget
      : writing.action === "new-thread"
        ? writing.draft
        : undefined;
  if (
    editTarget &&
    ![editTarget.threadId, editTarget.postId].every((id) =>
      /^[1-9]\d*$/.test(id),
    )
  )
    return fail("The original edit target is unavailable.");
  const generation = config.generation(),
    formURL = new URL("/forum.php", config.origin);
  Object.entries({
    mod: "post",
    action: editTarget ? "edit" : writing.replyTarget ? "reply" : "newthread",
    fid: writing.board.id,
    ...(editTarget
      ? { tid: editTarget.threadId, pid: editTarget.postId }
      : writing.replyTarget
        ? {
            tid: writing.replyTarget.threadId,
            ...(writing.replyTarget.postId
              ? { reppost: writing.replyTarget.postId }
              : {}),
          }
        : {}),
    tsdmapp: "json",
  }).forEach(([k, v]) => formURL.searchParams.set(k, v));
  async function current() {
    const response = await config.transport.request(formURL.href, {
      fresh: true,
    });
    if (config.generation() !== generation) throw Error("stale");
    const decoded = decodeWriting(
      response,
      formURL.href,
      writing.board.id,
      editTarget,
      writing.replyTarget,
    );
    config.observe(decoded.account);
    if (
      config.generation() !== generation ||
      decoded.account.kind !== "member" ||
      decoded.account.id !== writing.account.id
    )
      throw Error("stale");
    if (decoded.kind !== "prepared") throw Error("invalid");
    let body = response.body;
    if (/json/i.test(response.contentType)) {
      const data: unknown = JSON.parse(body);
      if (
        !data ||
        typeof data !== "object" ||
        !("document" in data) ||
        typeof data.document !== "string"
      )
        throw Error("invalid");
      body =
        ("head" in data && typeof data.head === "string" ? data.head : "") +
        data.document;
    }
    const scripts = descendants(
      documentFrom(body),
      (n) => n.tagName === "script",
    ).map((node) => children(node).map(text).join(""));
    const configs = scripts.flatMap((source) => {
      const m = /^\s*window\.ATPLUS\s*=\s*(\{[^;]*\})\s*;?\s*$/.exec(source);
      return m ? [m[1]!] : [];
    });
    if (configs.length !== 1) throw Error("invalid");
    const value: unknown = JSON.parse(configs[0]!);
    if (
      !value ||
      typeof value !== "object" ||
      !("api" in value) ||
      typeof value.api !== "string" ||
      !("login" in value) ||
      value.login !== 1 ||
      !("use" in value) ||
      value.use !== 1
    )
      throw Error("invalid");
    const api = new URL(value.api, config.origin);
    if (
      api.origin !== config.origin ||
      api.pathname !== "/plugin.php" ||
      api.search !== "?id=atplus:search" ||
      api.hash
    )
      throw Error("invalid");
    return api.href;
  }
  try {
    const api = await current();
    const response = await config.transport.request(api, {
      method: "POST",
      body: new URLSearchParams({ op: "search", q: query.trim() }).toString(),
      fresh: true,
    });
    if (config.generation() !== generation) throw Error("stale");
    if (
      response.status !== 200 ||
      new URL(response.url).origin !== config.origin ||
      !/^application\/json(?:;|$)/i.test(response.contentType)
    )
      throw Error("invalid");
    const data: unknown = JSON.parse(response.body);
    if (
      !data ||
      typeof data !== "object" ||
      !("ok" in data) ||
      ![true, 1].includes(data.ok as boolean | number) ||
      !("list" in data) ||
      !Array.isArray(data.list) ||
      data.list.length > 100
    )
      throw Error("invalid");
    const people = data.list.map((entry: unknown) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        !("uid" in entry) ||
        !("username" in entry) ||
        typeof entry.username !== "string" ||
        !entry.username.trim() ||
        /[\r\n\u2063\u2064]/.test(entry.username) ||
        !(typeof entry.uid === "string" || typeof entry.uid === "number") ||
        !/^[1-9]\d*$/.test(String(entry.uid))
      )
        throw Error("invalid");
      return { id: String(entry.uid), name: entry.username };
    });
    if (new Set(people.map((p) => p.id)).size !== people.length)
      throw Error("invalid");
    if ((await current()) !== api) throw Error("invalid");
    return { kind: "people", people, generation, account: config.account() };
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "stale"
        ? "The account changed during mention lookup. Resolve the person again."
        : "The current forum mention service could not resolve this person. Plain text was preserved.",
      error instanceof Error && error.message === "stale" ? "stale" : "network",
    );
  }
}

export async function mentionsCurrent(
  config: MentionConfig,
  writing: PreparedWriting,
): Promise<boolean> {
  for (const selected of writing.mentions ?? []) {
    if (!writing.source.includes(`@\u2063${selected.name}\u2063`)) continue;
    const found = await findMention(config, writing, selected.name);
    if (
      found.kind !== "people" ||
      !found.people.some(
        (person) => person.id === selected.id && person.name === selected.name,
      )
    )
      return false;
  }
  return true;
}
