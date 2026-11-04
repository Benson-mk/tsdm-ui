import {
  attr,
  byId,
  children,
  content,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import { cleanURL, routeFor } from "./routes.js";
import type { Account, HostResponse, ReadResult } from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
export function decodePrivateConversation(
  response: HostResponse,
  requested: string,
): Decoded {
  let account: Account = { kind: "unknown" };
  const fail = (
    message = "The private conversation could not be confirmed. Continue in the native forum.",
    kind:
      "invalid" | "login" | "permission" | "challenge" | "limited" = "invalid",
  ): Decoded => ({ kind, message, account, sourceURL: requested });
  const route = routeFor(requested),
    actual = routeFor(response.url);
  if (
    route?.kind !== "private-conversation" ||
    actual?.kind !== "private-conversation" ||
    route.url.origin !== actual.url.origin ||
    route.url.searchParams.get("touid") !==
      actual.url.searchParams.get("touid") ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    )
  )
    return fail();
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
        return fail();
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
      return fail();
    }
  }
  const doc = documentFrom(source),
    header = accountFrom(doc, response.url);
  const envelope: Account =
    uid === null
      ? { kind: "unknown" }
      : uid === 0
        ? { kind: "guest" }
        : { kind: "member", id: String(uid), name: `Member ${uid}` };
  const actor = (a: Account) => (a.kind === "member" ? a.id : a.kind);
  account =
    header.kind === "unknown"
      ? envelope
      : envelope.kind !== "unknown" && actor(envelope) !== actor(header)
        ? { kind: "unknown" }
        : header;
  const warning = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser/.test(
      label(descendants(doc, (n) => n.tagName === "title")[0]),
    )
  )
    return fail(
      "Native verification is required before reading this private conversation.",
      "challenge",
    );
  if (
    response.status === 401 ||
    account.kind === "guest" ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(warning)
  )
    return fail(
      "Sign in through the native forum before reading this private conversation.",
      "login",
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(warning))
    return fail(
      "The current account cannot read this private conversation.",
      "permission",
    );
  if (response.status === 429)
    return fail(
      "The forum is limiting private-conversation requests. Retry only deliberately.",
      "limited",
    );
  if (
    account.kind !== "member" ||
    response.status < 200 ||
    response.status >= 300 ||
    warning
  )
    return fail();
  const actorId = account.id,
    peerId = route.url.searchParams.get("touid")!;
  const root = byId(doc, "ct"),
    list = byId(doc, "pm_ul");
  if (!root) return fail();
  const empty = descendants(root, (n) => hasClass(n, "emp"))
    .map(label)
    .filter(Boolean)
    .join(" ");
  if (!list && !empty) return fail();
  const peerHeader = descendants(root, (n) => hasClass(n, "tbmu"))[0];
  const peerLinks = peerHeader
    ? descendants(peerHeader, (n) => n.tagName === "a").filter((n) => {
        const href = safeURL(attr(n, "href"), response.url);
        if (!href) return false;
        const u = new URL(href);
        return (
          u.origin === route.url.origin &&
          u.pathname === "/home.php" &&
          u.searchParams.get("mod") === "space" &&
          u.searchParams.get("uid") === peerId
        );
      })
    : [];
  if (peerLinks.length !== 1 || !label(peerLinks[0])) return fail();
  const recipient = descendants(
    doc,
    (n) => n.tagName === "input" && attr(n, "name") === "topmuid",
  );
  if (recipient.some((n) => attr(n, "value") !== peerId)) return fail();
  const rows = children(list ?? root).filter(
    (n) => "tagName" in n && n.tagName === "dl",
  );
  const messages = rows.map((row) => {
    const id = /^pmlist_([1-9]\d*)$/.exec(attr(row, "id"))?.[1],
      avatar = descendants(row, (n) => hasClass(n, "avt"))[0],
      profile = avatar && descendants(avatar, (n) => n.tagName === "a")[0],
      href = profile && safeURL(attr(profile, "href"), response.url),
      sender = href ? new URL(href) : null;
    const senderId = sender?.searchParams.get("uid");
    const body = descendants(
      row,
      (n) => n.tagName === "dd" && hasClass(n, "ptm"),
    )[0];
    if (
      !id ||
      !sender ||
      sender.origin !== route.url.origin ||
      sender.pathname !== "/home.php" ||
      sender.searchParams.get("mod") !== "space" ||
      ![peerId, actorId].includes(senderId ?? "") ||
      !body
    )
      return null;
    const nodes = body.childNodes,
      begin = nodes.findIndex((n) => "tagName" in n && n.tagName === "br"),
      end = nodes.findIndex((n, i) => i > begin && hasClass(n, "xg1")),
      stamp =
        end >= 0
          ? descendants(nodes[end]!, (n) => Boolean(attr(n, "title")))[0]
          : null;
    if (begin < 0 || end < 0 || !stamp) return null;
    const fragment = { ...body, childNodes: nodes.slice(begin + 1, end) };
    const url = new URL(cleanURL(response.url));
    url.hash = `pmlist_${id}`;
    return {
      id,
      senderId: senderId!,
      sender:
        senderId === actorId
          ? account.kind === "member"
            ? account.name
            : ""
          : label(peerLinks[0]),
      time: attr(stamp, "title"),
      body: content(fragment, response.url),
      url: url.href,
    };
  });
  if (
    (!messages.length && !empty) ||
    messages.some((m) => m === null) ||
    new Set(messages.map((m) => m?.id)).size !== messages.length
  )
    return fail();
  const confirmed = messages.filter((m) => m !== null);
  const lastMarker = children(list ?? root).findIndex(
      (n) => attr(n, "name") === "last",
    ),
    lastRow =
      lastMarker >= 0
        ? children(list ?? root)
            .slice(lastMarker + 1)
            .find((n) => /^pmlist_/.test(attr(n, "id")))
        : null;
  const countText = label(byId(doc, "membernum")) || (empty ? "0" : "");
  if (!/^\d+$/.test(countText)) return fail();
  const totalCount = Number(countText);
  if (
    !Number.isSafeInteger(totalCount) ||
    totalCount < confirmed.length ||
    (!confirmed.length && totalCount !== 0)
  )
    return fail();
  const pagerRoots = descendants(root, (n) => hasClass(n, "pg"));
  const markers = pagerRoots
    .flatMap((p) => descendants(p, (n) => n.tagName === "strong"))
    .map(label);
  if (new Set(markers).size > 1 || markers.some((v) => !/^[1-9]\d*$/.test(v)))
    return fail();
  const current = markers[0] ?? actual.url.searchParams.get("page") ?? "1";
  if (
    (route.url.searchParams.has("page") &&
      current !== route.url.searchParams.get("page")) ||
    (actual.url.searchParams.has("page") &&
      current !== actual.url.searchParams.get("page"))
  )
    return fail();
  const links = pagerRoots
    .flatMap((p) => descendants(p, (n) => n.tagName === "a"))
    .map((n) => {
      const href = safeURL(attr(n, "href"), response.url),
        r = href ? routeFor(href) : null;
      if (
        r?.kind !== "private-conversation" ||
        r.url.origin !== route.url.origin ||
        r.url.searchParams.get("touid") !== peerId ||
        r.url.hash ||
        !r.url.searchParams.has("page")
      )
        return null;
      return {
        label: label(n),
        url: cleanURL(r.url.href),
        earlier: hasClass(n, "prev") || hasClass(n.parentNode ?? n, "pgb"),
        later: hasClass(n, "nxt"),
      };
    });
  if (links.some((l) => l === null)) return fail();
  const offered = links.filter((l) => l !== null),
    previous = offered.filter((l) => l.earlier),
    next = offered.filter((l) => l.later);
  if (
    previous.length > 1 ||
    next.length > 1 ||
    previous.some(
      (l) =>
        Number(new URL(l.url).searchParams.get("page")) !== Number(current) - 1,
    ) ||
    next.some(
      (l) =>
        Number(new URL(l.url).searchParams.get("page")) !== Number(current) + 1,
    )
  )
    return fail();
  const earlier = previous[0]
      ? { label: previous[0].label, url: previous[0].url }
      : null,
    later = next[0] ? { label: next[0].label, url: next[0].url } : null;
  const requestedTarget =
    route.url.hash === "#last"
      ? lastRow
        ? attr(lastRow, "id").slice(7)
        : null
      : (/^#pmlist_([1-9]\d*)$/.exec(route.url.hash)?.[1] ?? null);
  return {
    kind: "private-conversation",
    account,
    sourceURL: requested,
    conversation: {
      url: cleanURL(response.url),
      peerId,
      peerName: label(peerLinks[0]),
      totalCount,
      messages: confirmed,
      pages: {
        current,
        links: offered.map((l) => ({ label: l.label, url: l.url })),
      },
      earlier,
      later,
      beginning: totalCount === confirmed.length,
      end: totalCount === confirmed.length,
      target: requestedTarget,
      targetMissing:
        Boolean(route.url.hash) &&
        (!requestedTarget ||
          !confirmed.some((message) => message.id === requestedTarget)),
      empty: confirmed.length ? "" : empty,
    },
  };
}
