import {
  attr,
  children,
  safeURL,
  text,
  byId,
  descendants,
  documentFrom,
  hasClass,
  label,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import { cleanURL, routeFor } from "./routes.js";
import type { Account, HostResponse, ReadResult } from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
export function decodeMessages(
  response: HostResponse,
  requested: string,
): Decoded {
  let account: Account = { kind: "unknown" };
  const fail = (
    message: string,
    kind:
      "invalid" | "login" | "permission" | "challenge" | "limited" = "invalid",
  ): Decoded => ({ kind, message, account, sourceURL: requested });
  const request = routeFor(requested),
    actual = routeFor(response.url);
  if (
    request?.kind !== "messages" ||
    actual?.kind !== "messages" ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    ) ||
    request.url.origin !== actual.url.origin ||
    (request.url.searchParams.get("page") ?? "1") !==
      (actual.url.searchParams.get("page") ?? "1")
  )
    return fail(
      "The forum returned an unsupported private-message list. The new-message prompt may still have been cleared.",
    );
  let source = response.body;
  let uid: number | null = null;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
    try {
      const payload: unknown = JSON.parse(source);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("document" in payload) ||
        typeof payload.document !== "string"
      )
        throw Error();
      if (
        "uid" in payload &&
        typeof payload.uid === "number" &&
        Number.isSafeInteger(payload.uid) &&
        payload.uid >= 0
      )
        uid = payload.uid;
      source = `${"head" in payload && typeof payload.head === "string" ? payload.head : ""}${payload.document}`;
    } catch {
      return fail(
        "The private-message response could not be interpreted. The new-message prompt may still have been cleared.",
      );
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
  const actor = (value: Account) =>
    value.kind === "member" ? `member:${value.id}` : value.kind;
  account =
    header.kind === "unknown"
      ? envelope
      : envelope.kind !== "unknown" && actor(header) !== actor(envelope)
        ? { kind: "unknown" }
        : header;
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  const title = label(descendants(doc, (node) => node.tagName === "title")[0]);
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser|安全验证|驗證您的瀏覽器/i.test(title)
  )
    return fail(
      "Native verification is required before loading messages.",
      "challenge",
    );
  if (
    response.status === 401 ||
    account.kind === "guest" ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(message)
  )
    return fail(
      "Sign in through the native forum before loading messages deliberately.",
      "login",
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return fail(
      "The current account cannot read these messages.",
      "permission",
    );
  if (response.status === 429)
    return fail(
      "The forum is limiting message requests. Retry only deliberately.",
      "limited",
    );
  if (
    response.status < 200 ||
    response.status >= 300 ||
    message ||
    account.kind !== "member"
  )
    return fail(
      "The private-message list or its current account could not be confirmed.",
    );
  const container = byId(doc, "ct");
  const privateTab =
    container &&
    descendants(
      container,
      (node) => node.tagName === "a" && Boolean(attr(node, "href")),
    ).some((node) => {
      const href = safeURL(attr(node, "href"), response.url);
      const route = href && routeFor(href);
      return (
        route &&
        route.kind === "messages" &&
        route.url.origin === request.url.origin &&
        route.url.searchParams.get("filter") === "privatepm"
      );
    });
  if (!container || !privateTab)
    return fail(
      "The private-message list could not be recognized. Continue in the native forum.",
    );
  const roots = descendants(container, (node) => hasClass(node, "pml"));
  const rows = roots.flatMap((root) =>
    children(root).filter((node) => "tagName" in node && node.tagName === "dl"),
  );
  const peers = rows.map((row) => {
    const id = /^pmlist_([1-9]\d*)$/.exec(attr(row, "id"))?.[1];
    const body = descendants(
      row,
      (node) => node.tagName === "dd" && hasClass(node, "pm_c"),
    )[0];
    const avatar = descendants(
      row,
      (node) => node.tagName === "dd" && hasClass(node, "avt"),
    )[0];
    const profile =
      avatar && descendants(avatar, (node) => node.tagName === "a")[0];
    const profileURL = profile && safeURL(attr(profile, "href"), response.url);
    const peerId = profileURL && new URL(profileURL).searchParams.get("uid");
    // Native incoming rows style the sender; sent-last rows style the self
    // span instead. Bind the peer name by its profile UID, never that style.
    const nameLink =
      body &&
      children(body).find((node) => {
        if (!("tagName" in node) || node.tagName !== "a") return false;
        const href = safeURL(attr(node, "href"), response.url);
        if (!href) return false;
        const profile = new URL(href);
        return (
          profile.origin === request.url.origin &&
          profile.pathname === "/home.php" &&
          profile.searchParams.get("mod") === "space" &&
          profile.searchParams.get("uid") === peerId
        );
      });
    const nameURL = nameLink && safeURL(attr(nameLink, "href"), response.url);
    const name = label(nameLink);
    const target = id && byId(row, `pmlist_${id}_a`);
    const href = target && safeURL(attr(target, "href"), response.url);
    const url = href ? new URL(href) : null;
    const timeNode =
      body &&
      descendants(
        body,
        (node) => node.tagName === "span" && hasClass(node, "xg1"),
      )[0];
    const stamp =
      timeNode &&
      descendants(timeNode, (node) => Boolean(attr(node, "title")))[0];
    const time = stamp ? attr(stamp, "title") : label(timeNode);
    let started = false;
    let preview = "";
    for (const node of body ? children(body) : []) {
      if ("tagName" in node && node.tagName === "br") {
        if (started) break;
        started = true;
      } else if (started) {
        if (hasClass(node, "xg1") || hasClass(node, "pm_o")) break;
        preview += text(node);
      }
    }
    const profileMatches = (value: string | null | undefined) =>
      value &&
      new URL(value).origin === request.url.origin &&
      new URL(value).pathname === "/home.php" &&
      new URL(value).searchParams.get("mod") === "space" &&
      new URL(value).searchParams.get("uid") === peerId;
    if (
      !id ||
      !peerId ||
      !/^[1-9]\d*$/.test(peerId) ||
      !profileMatches(profileURL) ||
      !profileMatches(nameURL) ||
      !name ||
      !started ||
      !time ||
      !url ||
      url.origin !== request.url.origin ||
      url.pathname !== "/home.php" ||
      url.searchParams.get("mod") !== "space" ||
      url.searchParams.get("do") !== "pm" ||
      url.searchParams.get("subop") !== "view" ||
      url.searchParams.get("touid") !== peerId ||
      [...url.searchParams.keys()].some(
        (key) =>
          !["mod", "do", "subop", "touid"].includes(key) ||
          url.searchParams.getAll(key).length !== 1,
      )
    )
      return null;
    return {
      id,
      peerId,
      name,
      url: url.href,
      preview: preview.replaceAll("\u00a0", " ").trim(),
      time,
      unread: hasClass(row, "newpm"),
    };
  });
  const empty = descendants(container, (node) => hasClass(node, "emp"))
    .map(label)
    .filter(Boolean)
    .join(" ");
  if (
    peers.some((peer) => peer === null) ||
    new Set(peers.map((peer) => peer?.peerId)).size !== peers.length ||
    new Set(peers.map((peer) => peer?.id)).size !== peers.length ||
    (peers.length && roots.length !== 1) ||
    (!peers.length && !empty)
  )
    return fail(
      "The private-message peers could not be identified completely. Continue in the native forum.",
    );
  const pagerRoots = descendants(container, (node) => hasClass(node, "pg"));
  const offered = pagerRoots.flatMap((root) =>
    descendants(root, (node) => node.tagName === "a"),
  );
  const pageLinks = offered.map((node) => {
    const href = safeURL(attr(node, "href"), response.url);
    const route = href && routeFor(href);
    return route &&
      route.kind === "messages" &&
      route.url.origin === request.url.origin &&
      label(node)
      ? { url: cleanURL(route.url.href), label: label(node) }
      : null;
  });
  const currentPage = actual.url.searchParams.get("page") ?? "1";
  if (
    pageLinks.some((link) => !link) ||
    pagerRoots.some((root) => {
      const current = label(
        descendants(root, (node) => node.tagName === "strong")[0],
      );
      return current && current !== currentPage;
    })
  )
    return fail(
      "The returned private-message pagination could not be preserved completely. Continue in the native forum.",
    );
  return {
    kind: "messages",
    account,
    sourceURL: cleanURL(response.url),
    messages: {
      url: cleanURL(response.url),
      peers: peers.filter((peer) => peer !== null),
      pages: {
        current: currentPage,
        links: [
          ...new Map(
            pageLinks
              .filter((link) => link !== null)
              .map((link) => [link.url, link]),
          ).values(),
        ],
      },
      empty,
    },
  };
}
