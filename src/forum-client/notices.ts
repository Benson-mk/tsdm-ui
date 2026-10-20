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
  type Node,
  type Element,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import { cleanURL, routeFor } from "./routes.js";
import type {
  Account,
  ContentNode,
  HostResponse,
  ForumLink,
  Notices,
  ReadResult,
} from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
function within(node: Node, predicate: (element: Element) => boolean): boolean {
  let current: Node | null = node;
  while (current && "tagName" in current) {
    if (predicate(current)) return true;
    current = current.parentNode;
  }
  return false;
}
function readable(nodes: readonly ContentNode[]): boolean {
  return nodes.some((node) =>
    node.kind === "text"
      ? Boolean(node.text.trim())
      : node.kind === "unsupported" ||
        node.tag === "img" ||
        readable(node.children),
  );
}
function noticeContent(nodes: ContentNode[]): ContentNode[] {
  return nodes.map((node) => {
    if (node.kind === "text") return node;
    const children = noticeContent([...node.children]);
    if (
      node.kind === "element" &&
      [node.attributes.href, node.attributes.src].some(
        (value) =>
          value &&
          [...new URL(value).searchParams.keys()].some(
            (key) => key.toLowerCase() === "formhash",
          ),
      )
    )
      return {
        kind: "unsupported",
        description: "This action requires current native forum controls.",
        children,
      };
    return { ...node, children };
  });
}
export function decodeNotices(
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
    request?.kind !== "notices" ||
    actual?.kind !== "notices" ||
    request.url.origin !== actual.url.origin ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    )
  )
    return fail(
      "The forum returned an unsupported notice response. This request may still have marked notices read.",
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
        "The notice response could not be interpreted. This request may still have marked notices read.",
      );
    }
  }
  const doc = documentFrom(source);
  const header = accountFrom(doc, response.url);
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
      : envelope.kind !== "unknown" && actor(envelope) !== actor(header)
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
      "Native verification is required. This request may still have marked notices read.",
      "challenge",
    );
  if (
    response.status === 401 ||
    account.kind === "guest" ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(message)
  )
    return fail(
      "Sign in through the native forum before loading notices deliberately. This request may still have had read effects.",
      "login",
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return fail(
      "The current account cannot read these notices. This request may still have had read effects.",
      "permission",
    );
  if (response.status === 429)
    return fail(
      "The forum is limiting requests. Retry notices only deliberately; this request may still have had read effects.",
      "limited",
    );
  if (response.status < 200 || response.status >= 300 || message)
    return fail(
      "The notices could not be displayed reliably. This request may still have marked notices read.",
    );
  if (account.kind !== "member")
    return fail(
      "The current notice account could not be confirmed. This request may still have had read effects.",
    );
  if (
    !["view", "type", "page"].every(
      (key) =>
        (request.url.searchParams.get(key) ?? (key === "page" ? "1" : "")) ===
        (actual.url.searchParams.get(key) ?? (key === "page" ? "1" : "")),
    )
  )
    return fail(
      "The forum returned a different notice category or page. This request may still have had read effects.",
    );
  const container = byId(doc, "ct");
  if (!container)
    return fail(
      "The complete notice list could not be recognized. Continue in the native forum; this request may still have marked notices read.",
    );
  const roots = descendants(container, (node) => hasClass(node, "nts"));
  const list = roots.length === 1 ? roots[0] : undefined;
  const rows = list
    ? children(list).filter(
        (node): node is Element => "tagName" in node && node.tagName === "dl",
      )
    : [];
  const entries = rows.map((row) => {
    const id =
      attr(row, "notice") ||
      /^notice_([1-9]\d*)$/.exec(attr(row, "id"))?.[1] ||
      "";
    const body = descendants(
      row,
      (node) => node.tagName === "dd" && hasClass(node, "ntc_body"),
    );
    const dt = children(row).find(
      (node) => "tagName" in node && node.tagName === "dt",
    );
    const stamp =
      dt &&
      descendants(
        dt,
        (node) => node.tagName === "span" && Boolean(attr(node, "title")),
      )[0];
    const plain = dt && descendants(dt, (node) => node.tagName === "span")[0];
    const time = (stamp && attr(stamp, "title")) || label(plain);
    const bodyContent =
      body.length === 1 ? noticeContent(content(body[0]!, response.url)) : [];
    return /^[1-9]\d*$/.test(id) && time && readable(bodyContent)
      ? { id, time, body: bodyContent }
      : null;
  });
  if (
    entries.some((entry) => entry === null) ||
    new Set(entries.map((entry) => entry?.id)).size !== entries.length
  )
    return fail(
      "A notice has incomplete or ambiguous content. Continue in the native forum for the complete list; this request may still have marked notices read.",
    );
  const empty = descendants(container, (node) => hasClass(node, "emp"))
    .map(label)
    .filter(Boolean)
    .join(" ");
  if ((!list || !entries.length) && !empty)
    return fail(
      "The complete notice list could not be recognized. Continue in the native forum; this request may still have marked notices read.",
    );
  const categories = [
    ...descendants(
      container,
      (node) =>
        node.tagName === "a" &&
        within(
          node,
          (parent) =>
            hasClass(parent, "tbn") ||
            hasClass(parent, "tb") ||
            hasClass(parent, "subsub"),
        ) &&
        !within(node, (parent) => hasClass(parent, "nts")),
    )
      .flatMap((node) => {
        const value = safeURL(attr(node, "href"), response.url),
          route = value && routeFor(value);
        return route &&
          route.kind === "notices" &&
          route.url.origin === request.url.origin &&
          label(node)
          ? [
              {
                url: cleanURL(route.url.href),
                label: label(node),
                current: within(
                  node,
                  (parent) => parent.tagName === "li" && hasClass(parent, "a"),
                ),
              },
            ]
          : [];
      })
      .reduce((links, link) => {
        const previous = links.get(link.url);
        links.set(link.url, {
          ...link,
          current: link.current || previous?.current === true,
        });
        return links;
      }, new Map<string, Notices["categories"][number]>())
      .values(),
  ];
  if (!categories.length)
    return fail(
      "The returned notice categories could not be recognized. Continue in the native forum for the complete inbox; this request may still have marked notices read.",
    );
  const pages = {
    current: actual.url.searchParams.get("page") ?? "1",
    links: [] as ForumLink[],
  };
  const pagerRoots = descendants(
    container,
    (node) =>
      (hasClass(node, "pg") || hasClass(node, "page")) &&
      !within(node, (parent) => hasClass(parent, "nts")),
  );
  const offeredPages = pagerRoots.flatMap((root) =>
    descendants(root, (node) => node.tagName === "a"),
  );
  if (
    offeredPages.some((node) => {
      const href = safeURL(attr(node, "href"), response.url),
        route = href && routeFor(href);
      return (
        !route ||
        route.kind !== "notices" ||
        route.url.origin !== request.url.origin ||
        !["view", "type"].every(
          (key) =>
            route.url.searchParams.get(key) ===
            actual.url.searchParams.get(key),
        )
      );
    })
  )
    return fail(
      "The returned notice pagination could not be preserved completely. Continue in the native forum; this request may still have marked notices read.",
    );
  if (pagerRoots.length) {
    const currentPages = pagerRoots.map(
      (root) =>
        label(descendants(root, (node) => node.tagName === "strong")[0]) ||
        pages.current,
    );
    if (new Set(currentPages).size !== 1)
      return fail(
        "The returned notice pagination could not be preserved completely. Continue in the native forum; this request may still have marked notices read.",
      );
    pages.current = currentPages[0]!;
    pages.links = [
      ...new Map(
        offeredPages.map((node) => {
          const href = cleanURL(safeURL(attr(node, "href"), response.url)!);
          return [href, { url: href, label: label(node) }];
        }),
      ).values(),
    ];
  } else pages.links = [];
  const indicators = descendants(
    doc,
    (node) =>
      attr(node, "id") === "myprompt" &&
      !within(node, (parent) => hasClass(parent, "nts")),
  );
  const count =
    indicators.length === 1
      ? /[（(]\s*(\d+)\s*[）)]\s*$/.exec(label(indicators[0]))?.[1]
      : undefined;
  const unread: Notices["unread"] = !indicators.length
    ? { kind: "absent" }
    : count !== undefined && Number.isSafeInteger(Number(count))
      ? { kind: "observed", count: Number(count) }
      : { kind: "unknown" };
  return {
    kind: "notices",
    account,
    sourceURL: cleanURL(response.url),
    notices: {
      url: cleanURL(response.url),
      categories,
      entries: entries.filter((entry) => entry !== null),
      pages,
      empty: entries.length ? "" : empty,
      unread,
    },
  };
}
