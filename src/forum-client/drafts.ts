import {
  attr,
  byId,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import type {
  Account,
  DraftListResult,
  DraftRow,
  HostResponse,
} from "./types.js";
export const draftListPath =
  "/home.php?mod=space&do=thread&view=me&type=thread&filter=save";
export function draftListURL(value: string, origin: string): URL | null {
  try {
    const url = new URL(value, origin),
      required = {
        mod: "space",
        do: "thread",
        view: "me",
        type: "thread",
        filter: "save",
      };
    if (
      url.origin !== origin ||
      url.pathname !== "/home.php" ||
      url.hash ||
      url.username ||
      url.password ||
      Object.entries(required).some(
        ([k, v]) => url.searchParams.get(k) !== v,
      ) ||
      [...url.searchParams.keys()].some(
        (k) =>
          ![...Object.keys(required), "page", "from", "tsdmapp"].includes(k) ||
          url.searchParams.getAll(k).length !== 1,
      ) ||
      (url.searchParams.has("page") &&
        !/^[1-9]\d*$/.test(url.searchParams.get("page")!)) ||
      (url.searchParams.has("from") && url.searchParams.get("from") !== "")
    )
      return null;
    url.searchParams.delete("tsdmapp");
    return url;
  } catch {
    return null;
  }
}
type Decoded = DraftListResult extends infer R
  ? R extends DraftListResult
    ? Omit<R, "generation">
    : never
  : never;
export function decodeDraftList(
  response: HostResponse,
  requested: string,
): Decoded {
  let account: Account = { kind: "unknown" };
  const fail = (
    message: string,
    kind:
      "invalid" | "login" | "permission" | "limited" | "challenge" = "invalid",
  ) => ({ kind, account, message, sourceURL: requested });
  const origin = new URL(requested).origin,
    actual = draftListURL(response.url, origin),
    wanted = draftListURL(requested, origin);
  if (
    !actual ||
    !wanted ||
    (actual.searchParams.get("page") ?? "1") !==
      (wanted.searchParams.get("page") ?? "1") ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    )
  )
    return fail("The forum returned a different or unsupported draft list.");
  let source = response.body;
  try {
    if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
      const payload: unknown = JSON.parse(source);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("document" in payload) ||
        typeof payload.document !== "string"
      )
        throw Error();
      source =
        ("head" in payload && typeof payload.head === "string"
          ? payload.head
          : "") + payload.document;
    }
  } catch {
    return fail("The draft list could not be interpreted.");
  }
  const doc = documentFrom(source);
  account = accountFrom(doc, actual.href);
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser/.test(
      label(descendants(doc, (n) => n.tagName === "title")[0]),
    )
  )
    return fail(
      "Complete native verification before loading drafts.",
      "challenge",
    );
  if (account.kind === "guest" || response.status === 401)
    return fail("Sign in before loading forum drafts.", "login");
  if (response.status === 403)
    return fail("The current account cannot read these drafts.", "permission");
  if (response.status === 429)
    return fail("The forum is limiting draft requests.", "limited");
  if (response.status !== 200 || account.kind !== "member" || message)
    return fail("A complete current-account draft list is required.");
  const form = byId(doc, "delform"),
    selected = descendants(
      doc,
      (n) =>
        n.tagName === "a" &&
        hasClass(n, "a") &&
        !!draftListURL(attr(n, "href"), origin),
    );
  if (
    !form ||
    form.tagName !== "form" ||
    descendants(doc, (n) => attr(n, "id") === "delform").length !== 1 ||
    selected.length !== 1
  )
    return fail("The forum draft filter or list structure is unavailable.");
  const rows: DraftRow[] = [],
    nativeRows = descendants(form, (n) => n.tagName === "tr");
  for (const row of nativeRows) {
    const titles = descendants(
      row,
      (n) =>
        n.tagName === "a" &&
        !!n.parentNode &&
        "tagName" in n.parentNode &&
        n.parentNode.tagName === "th",
    );
    if (!titles.length) {
      if (
        hasClass(row, "th") ||
        descendants(row, (n) => hasClass(n, "emp")).length
      )
        continue;
      return fail(
        "A draft row could not be interpreted; the list is not complete.",
      );
    }
    const title = titles[0]!,
      url = safeURL(attr(title, "href"), origin);
    const boards = descendants(row, (n) => n.tagName === "a")
      .map((n) => safeURL(attr(n, "href"), origin))
      .filter(
        (v): v is string =>
          !!v && new URL(v).searchParams.get("mod") === "forumdisplay",
      );
    if (titles.length !== 1 || !url || boards.length !== 1)
      return fail("A draft row has ambiguous identity.");
    const thread = new URL(url),
      board = new URL(boards[0]!);
    const threadId = thread.searchParams.get("tid") ?? "",
      boardId = board.searchParams.get("fid") ?? "";
    if (
      thread.origin !== origin ||
      thread.pathname !== "/forum.php" ||
      thread.searchParams.get("mod") !== "viewthread" ||
      board.origin !== origin ||
      !/^[1-9]\d*$/.test(threadId) ||
      !/^[1-9]\d*$/.test(boardId) ||
      !label(title) ||
      rows.some((r) => r.threadId === threadId)
    )
      return fail("A draft row has unsupported or repeated identity.");
    rows.push({ threadId, boardId, title: label(title), url });
  }
  const empty = descendants(form, (n) => hasClass(n, "emp"));
  if (
    !rows.length &&
    (empty.length !== 1 ||
      !/还没有相关的帖子|還沒有相關的帖子/.test(label(empty[0])))
  )
    return fail("No authoritative empty draft list was returned.");
  const pagers = descendants(doc, (n) => hasClass(n, "pg")),
    links: { label: string; url: string }[] = [];
  for (const pager of pagers)
    for (const link of descendants(
      pager,
      (n) => n.tagName === "a" && !!attr(n, "href"),
    )) {
      const url = draftListURL(attr(link, "href"), origin);
      if (!url)
        return fail("The draft pager returned an unsupported destination.");
      if (!links.some((l) => l.url === url.href))
        links.push({ label: label(link), url: url.href });
    }
  return {
    kind: "drafts",
    account,
    sourceURL: requested,
    drafts: {
      url: wanted.href,
      rows,
      empty: rows.length ? "" : label(empty[0]),
      pages: { current: wanted.searchParams.get("page") ?? "1", links },
    },
  };
}
