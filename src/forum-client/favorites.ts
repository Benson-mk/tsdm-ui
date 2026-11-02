import {
  attr,
  byId,
  children,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import { cleanURL, routeFor } from "./routes.js";
import type {
  Account,
  FavoriteKind,
  FavoriteRecord,
  HostResponse,
  ReadResult,
} from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
export function decodeFavorites(
  response: HostResponse,
  requested: string,
): Decoded {
  let account: Account = { kind: "unknown" };
  const fail = (
    message: string,
    kind: "invalid" | "login" | "permission" | "challenge" = "invalid",
  ): Decoded => ({ kind, message, account, sourceURL: requested });
  const request = routeFor(requested),
    actual = routeFor(response.url);
  if (
    request?.kind !== "favorites" ||
    actual?.kind !== "favorites" ||
    request.url.origin !== actual.url.origin ||
    !/^(?:text\/html|application\/json)(?:;|$)/i.test(response.contentType)
  )
    return fail("The favorite list response is unsupported.");
  let source = response.body,
    uid: number | null = null;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
    try {
      const data: unknown = JSON.parse(source);
      if (
        !data ||
        typeof data !== "object" ||
        !("document" in data) ||
        typeof data.document !== "string"
      )
        throw Error();
      source =
        ("head" in data && typeof data.head === "string" ? data.head : "") +
        data.document;
      if (
        "uid" in data &&
        typeof data.uid === "number" &&
        Number.isSafeInteger(data.uid) &&
        data.uid >= 0
      )
        uid = data.uid;
    } catch {
      return fail("The favorite list could not be interpreted.");
    }
  }
  const doc = documentFrom(source),
    header = accountFrom(doc, response.url);
  account =
    header.kind === "unknown" && uid !== null
      ? uid
        ? { kind: "member", id: String(uid), name: `Member ${uid}` }
        : { kind: "guest" }
      : header;
  if (header.kind === "member" && uid !== null && header.id !== String(uid))
    account = { kind: "unknown" };
  const message = label(byId(doc, "messagetext"));
  if (byId(doc, "challenge-form") || byId(doc, "cf-challenge-running"))
    return fail("Native verification is required.", "challenge");
  if (
    account.kind === "guest" ||
    /登录|登入|登錄/.test(message) ||
    response.status === 401
  )
    return fail("Sign in through the native forum to read Saved.", "login");
  if (response.status === 403 || /权限|權限|無權/.test(message))
    return fail(
      "The current account cannot read these favorites.",
      "permission",
    );
  if (response.status !== 200 || message || account.kind !== "member")
    return fail("The favorite list or current account could not be confirmed.");
  const kind = request.url.searchParams.get("type") as FavoriteKind,
    current = actual.url.searchParams.get("page") ?? "1";
  if (
    actual.url.searchParams.get("type") !== kind ||
    current !== (request.url.searchParams.get("page") ?? "1")
  )
    return fail("The forum returned a different favorite kind or page.");
  const container = byId(doc, "ct"),
    list = byId(doc, "favorite_ul");
  if (!container)
    return fail(
      "The favorite list is incomplete; it has not been treated as empty.",
    );
  const rows = list
    ? children(list).filter((n) => "tagName" in n && n.tagName === "li")
    : [];
  const records: FavoriteRecord[] = [];
  for (const row of rows) {
    const id = /^fav_([1-9]\d*)$/.exec(attr(row, "id"))?.[1];
    const boxes = descendants(
      row,
      (n) => n.tagName === "input" && attr(n, "name") === "favorite[]",
    );
    const targetId = boxes.length === 1 ? attr(boxes[0]!, "vid") : "";
    if (!id || !/^[1-9]\d*$/.test(targetId) || attr(boxes[0]!, "value") !== id)
      return fail("A favorite has ambiguous record or target identity.");
    const links = descendants(row, (n) => n.tagName === "a");
    const targets = links.flatMap((n) => {
      const url = safeURL(attr(n, "href"), response.url),
        route = url && routeFor(url);
      return route &&
        route.url.origin === request.url.origin &&
        route.kind === (kind === "forum" ? "board" : "thread")
        ? [
            {
              node: n,
              url: cleanURL(route.url.href),
              id: route.url.searchParams.get(kind === "forum" ? "fid" : "tid"),
            },
          ]
        : [];
    });
    if (targets.length > 1 || targets.some((t) => t.id !== targetId))
      return fail("A favorite target does not match its record.");
    const removable = links.some((n) => {
      const href = safeURL(attr(n, "href"), response.url);
      if (!href) return false;
      const u = new URL(href);
      return (
        u.origin === request.url.origin &&
        u.pathname === "/home.php" &&
        u.searchParams.get("mod") === "spacecp" &&
        u.searchParams.get("ac") === "favorite" &&
        u.searchParams.get("op") === "delete" &&
        u.searchParams.get("favid") === id
      );
    });
    const stamp = descendants(row, (n) => hasClass(n, "xg1"))[0],
      titled = stamp && descendants(stamp, (n) => Boolean(attr(n, "title")))[0];
    records.push({
      id,
      kind,
      targetId,
      url: targets[0]?.url ?? null,
      title: targets[0]
        ? label(targets[0].node)
        : `Unavailable ${kind === "forum" ? "board" : "thread"} ${targetId}`,
      time: titled ? attr(titled, "title") : label(stamp),
      note: label(descendants(row, (n) => n.tagName === "blockquote")[0]),
      removable,
      ...(targets.length
        ? {}
        : {
            unavailableText: children(row)
              .filter(
                (n) =>
                  !("tagName" in n) ||
                  (!["a", "input"].includes(n.tagName) &&
                    !hasClass(n, "xg1") &&
                    !hasClass(n, "quote")),
              )
              .map(label)
              .filter(Boolean)
              .join(" "),
          }),
    });
  }
  if (
    new Set(records.map((r) => r.id)).size !== records.length ||
    new Set(records.map((r) => r.targetId)).size !== records.length
  )
    return fail("The favorite list contains duplicate identities.");
  if (
    !rows.length &&
    !descendants(container, (n) => hasClass(n, "emp")).some((n) =>
      /您还没有添加任何收藏|您還沒有添加任何收藏/.test(label(n)),
    )
  )
    return fail(
      "The favorite list is incomplete; it has not been treated as empty.",
    );
  const returnedPageNodes = descendants(
    container,
    (n) =>
      n.tagName === "a" &&
      (() => {
        const href = safeURL(attr(n, "href"), response.url),
          route = href && routeFor(href);
        return Boolean(
          route &&
          route.kind === "favorites" &&
          route.url.searchParams.has("page"),
        );
      })(),
  );
  if (
    returnedPageNodes.some((node) => {
      let parent = node.parentNode;
      while (parent && parent !== container) {
        if (hasClass(parent, "pg")) return false;
        parent = "parentNode" in parent ? parent.parentNode : null;
      }
      return true;
    })
  )
    return fail(
      "The returned favorite pages could not be preserved completely.",
    );
  const roots = descendants(container, (n) => hasClass(n, "pg")),
    links = [];
  for (const root of roots) {
    const displayed = label(
      descendants(root, (n) => n.tagName === "strong")[0],
    );
    if (displayed && displayed !== current)
      return fail("The favorite page identity is inconsistent.");
    for (const node of descendants(root, (n) => n.tagName === "a")) {
      const href = safeURL(attr(node, "href"), response.url),
        route = href && routeFor(href);
      if (
        !route ||
        route.kind !== "favorites" ||
        route.url.origin !== request.url.origin ||
        route.url.searchParams.get("type") !== kind ||
        !label(node)
      )
        return fail(
          "The returned favorite pages could not be preserved completely.",
        );
      links.push({ url: cleanURL(route.url.href), label: label(node) });
    }
  }
  return {
    kind: "favorites",
    account,
    sourceURL: cleanURL(response.url),
    favorites: {
      kind,
      url: cleanURL(response.url),
      records,
      pages: {
        current,
        links: [...new Map(links.map((l) => [l.url, l])).values()],
      },
    },
  };
}
