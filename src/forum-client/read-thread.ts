import { attachments } from "./attachments.js";
import { pagination, link } from "./read-board.js";
import { routeFor, cleanURL } from "./routes.js";
import { threadURL } from "./routes.js";
export { threadURL } from "./routes.js";
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
} from "./html.js";
import type {
  Account,
  ContentNode,
  HostResponse,
  ReadResult,
} from "./types.js";
const positive = (value: string | null): value is string =>
  value !== null && /^[1-9]\d*$/.test(value);
function outsidePosts(node: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (
      /^(?:postlist|post_[0-9]+|postmessage_[0-9]+)$/.test(
        attr(current, "id"),
      ) ||
      hasClass(current, "pcb") ||
      hasClass(current, "pcbs") ||
      hasClass(current, "viewthread") ||
      hasClass(current, "nts") ||
      hasClass(current, "ntc_body")
    )
      return false;
    current = "parentNode" in current ? current.parentNode : null;
  }
  return true;
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
export function accountFrom(doc: Node, base: string): Account {
  const headers = descendants(
    doc,
    (n) => ["um", "inner_stat"].includes(attr(n, "id")) && outsidePosts(n),
  );
  const header = headers.length === 1 ? headers[0] : undefined;
  const members = header
    ? descendants(header, (n) => n.tagName === "strong")
        .flatMap((n) => descendants(n, (a) => a.tagName === "a"))
        .map((n) => {
          const url = safeURL(attr(n, "href"), base);
          const id = url ? new URL(url).searchParams.get("uid") : null;
          return positive(id)
            ? { kind: "member" as const, id, name: label(n) }
            : null;
        })
        .filter((n) => n !== null)
    : [];
  if (members.length === 1 && members[0]) return members[0];
  if (
    members.length === 0 &&
    descendants(
      doc,
      (n) =>
        n.tagName === "form" &&
        (attr(n, "id") === "lsform" || attr(n, "id").startsWith("loginform")) &&
        outsidePosts(n),
    ).length
  )
    return { kind: "guest" };
  return { kind: "unknown" };
}
type DecodedResult = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
export function decodeThread(
  response: HostResponse,
  requestedURL: string,
): DecodedResult {
  const requestedOrigin = threadURL(requestedURL)?.origin;
  let responseOrigin: string | null = null;
  try {
    responseOrigin = new URL(response.url).origin;
  } catch {
    /* Invalid host envelope is rejected below. */
  }
  if (
    !requestedOrigin ||
    responseOrigin !== requestedOrigin ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType.trim(),
    )
  ) {
    return {
      kind: "invalid",
      message: "The forum returned an unsupported response envelope.",
      account: { kind: "unknown" },
      sourceURL: requestedURL,
    };
  }
  let source = response.body;
  let envelopeAccount: Account | null = null;
  let envelopeThreadId: string | null = null;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
    try {
      const payload: unknown = JSON.parse(source);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("document" in payload) ||
        typeof payload.document !== "string"
      )
        throw new Error("No document");
      if (
        "uid" in payload &&
        typeof payload.uid === "number" &&
        Number.isSafeInteger(payload.uid) &&
        payload.uid >= 0
      )
        envelopeAccount =
          payload.uid === 0
            ? { kind: "guest" }
            : {
                kind: "member",
                id: String(payload.uid),
                name: `Member ${payload.uid}`,
              };
      if (
        "thread" in payload &&
        payload.thread &&
        typeof payload.thread === "object" &&
        "tid" in payload.thread &&
        (typeof payload.thread.tid === "number" ||
          typeof payload.thread.tid === "string")
      )
        envelopeThreadId = String(payload.thread.tid);
      source = `${"head" in payload && typeof payload.head === "string" ? payload.head : ""}${payload.document}`;
    } catch {
      return {
        kind: "invalid",
        message: "The forum returned an invalid response.",
        account: { kind: "unknown" },
        sourceURL: requestedURL,
      };
    }
  }
  const doc = documentFrom(source);
  const headerAccount = accountFrom(doc, response.url);
  const conflict =
    envelopeAccount &&
    headerAccount.kind !== "unknown" &&
    (envelopeAccount.kind !== headerAccount.kind ||
      (envelopeAccount.kind === "member" &&
        headerAccount.kind === "member" &&
        envelopeAccount.id !== headerAccount.id));
  const account: Account = conflict
    ? { kind: "unknown" }
    : headerAccount.kind !== "unknown"
      ? headerAccount
      : (envelopeAccount ?? headerAccount);
  const result = { account, sourceURL: response.url };
  const fail = (
    kind:
      "limited" | "login" | "permission" | "missing" | "challenge" | "invalid",
    message: string,
  ) => ({ ...result, kind, message });
  const title = label(descendants(doc, (n) => n.tagName === "title")[0]);
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser|安全验证|驗證您的瀏覽器/i.test(title)
  )
    return fail(
      "challenge",
      "Native verification is required. Your intended thread is preserved.",
    );
  if (
    response.status === 404 ||
    response.status === 410 ||
    /不存在|已[被經经]*删除|已[被經经]*刪除|not found/i.test(message)
  )
    return fail("missing", "This thread is missing or has been deleted.");
  if (
    response.status === 401 ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(message) ||
    descendants(
      doc,
      (n) => n.tagName === "form" && attr(n, "id").startsWith("loginform"),
    ).length
  )
    return fail(
      "login",
      "Sign in through the native forum, then retry this thread.",
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return fail(
      "permission",
      "The current account does not have permission to read this thread.",
    );
  if (response.status === 429)
    return fail(
      "limited",
      "The forum is limiting requests. Retry explicitly later.",
    );
  if (response.status < 200 || response.status >= 300 || message)
    return fail(
      "invalid",
      "The forum response could not be displayed reliably.",
    );
  const requested = threadURL(requestedURL),
    actual = threadURL(response.url);
  if (
    !requested ||
    !actual ||
    actual.origin !== requested.origin ||
    actual.searchParams.get("tid") !== requested.searchParams.get("tid")
  )
    return fail(
      "invalid",
      "The forum returned a different destination. Continue in the native forum.",
    );
  if (
    envelopeThreadId !== null &&
    envelopeThreadId !== requested.searchParams.get("tid")
  )
    return fail("invalid", "The returned thread identity did not match.");
  const touch = descendants(doc, (n) => hasClass(n, "viewthread")).length > 0;
  const containers = descendants(doc, (n) =>
    touch ? hasClass(n, "viewthread") : attr(n, "id") === "postlist",
  );
  const container = containers[0];
  if (!container || containers.length !== 1)
    return fail(
      "invalid",
      "Unrecognized thread content. Continue in the native forum.",
    );
  const canonical = descendants(
    doc,
    (n) => n.tagName === "link" && attr(n, "rel") === "canonical",
  )[0];
  if (canonical) {
    const url = safeURL(attr(canonical, "href"), response.url);
    if (
      !url ||
      new URL(url).origin !== requested.origin ||
      threadURL(url)?.searchParams.get("tid") !==
        requested.searchParams.get("tid")
    )
      return fail("invalid", "The returned thread identity did not match.");
  }
  const heading = touch
    ? descendants(container, (n) => hasClass(n, "view_tit"))[0]
    : byId(container, "thread_subject");
  const wrappers = descendants(container, (n) =>
    touch
      ? /^pid[1-9]\d*$/.test(attr(n, "id")) && hasClass(n, "plc")
      : /^post_[1-9]\d*$/.test(attr(n, "id")),
  );
  if (!label(heading) || !wrappers.length)
    return fail(
      "invalid",
      "This thread has unrecognized or incomplete content.",
    );
  const ids = wrappers.map((n) => attr(n, "id").slice(touch ? 3 : 5));
  if (new Set(ids).size !== ids.length)
    return fail("invalid", "The returned post identities are ambiguous.");
  const posts = wrappers.map((wrapper) => {
    const id = attr(wrapper, "id").slice(touch ? 3 : 5);
    const body =
      descendants(wrapper, (n) =>
        touch
          ? hasClass(n, "message")
          : hasClass(n, "pcb") || hasClass(n, "pcbs"),
      )[0] ??
      descendants(wrapper, (n) => /^postmessage_/.test(attr(n, "id")))[0];
    if (!body || !children(body).length) return null;
    const bodyContent = content(body, response.url);
    if (!readable(bodyContent)) return null;
    const authorArea = descendants(wrapper, (n) => hasClass(n, "authi"))[0];
    const author = authorArea
      ? descendants(
          authorArea,
          (n) => n.tagName === "a" && attr(n, "href").includes("uid="),
        )[0]
      : undefined;
    const authorURL = author
      ? safeURL(attr(author, "href"), response.url)
      : null;
    return {
      id,
      attachments: attachments(wrapper, response.url),
      author: label(author) || "Anonymous",
      authorId: authorURL ? new URL(authorURL).searchParams.get("uid") : null,
      floor: label(
        touch
          ? descendants(wrapper, (n) => hasClass(n, "y"))[0]
          : byId(wrapper, `postnum${id}`),
      ),
      date: label(
        touch
          ? descendants(wrapper, (n) => hasClass(n, "mtime"))[0]
          : byId(wrapper, `authorposton${id}`),
      ),
      url:
        link(byId(wrapper, `postnum${id}`), response.url)?.url ??
        `${cleanURL(response.url).split("#")[0]}#pid${id}`,
      content: [
        ...bodyContent,
        ...descendants(
          wrapper,
          (n) =>
            hasClass(n, "locked") ||
            hasClass(n, "attach_nopermission") ||
            hasClass(n, "modact"),
        )
          .filter((n) => {
            let p: Node | null = n;
            while (p) {
              if (p === body) return false;
              p = "parentNode" in p ? p.parentNode : null;
            }
            return true;
          })
          .flatMap((n) => [
            {
              kind: "element" as const,
              tag: "p",
              attributes: { class: "permission-notice" },
              children: [{ kind: "text" as const, text: label(n) }],
            },
          ]),
      ],
    };
  });
  if (posts.some((post) => post === null))
    return fail(
      "invalid",
      "A post could not be interpreted. Continue in the native forum for complete content.",
    );
  const pages = pagination(doc, response.url);
  let target =
    /^#pid([1-9]\d*)$/.exec(requested.hash)?.[1] ??
    requested.searchParams.get("viewpid");
  if (requested.hash === "#lastpost") {
    const ordered = posts.filter((post) => post !== null);
    const floors = ordered
      .map((post) => /^\s*([1-9]\d*)/.exec(post.floor)?.[1])
      .map((value) => (value ? Number(value) : NaN));
    const descending = actual.searchParams.get("ordertype") === "1";
    const page = Number(pages.current);
    const links = pages.links.map((item) =>
      Number(new URL(item.url).searchParams.get("page") ?? "1"),
    );
    const boundary =
      Number.isSafeInteger(page) &&
      page > 0 &&
      (descending
        ? page === 1 && !links.some((value) => value < page)
        : !links.some((value) => value > page));
    const orderedFloors = floors.every(
      (value, index) =>
        Number.isSafeInteger(value) &&
        (index === 0 ||
          (descending
            ? value < floors[index - 1]!
            : value > floors[index - 1]!)),
    );
    if (boundary && orderedFloors && !actual.searchParams.has("authorid"))
      target = (descending ? ordered[0] : ordered.at(-1))!.id;
    else
      return {
        ...result,
        kind: "document-navigation",
        message: "The last reply requires canonical forum resolution.",
        destination: `${requested.origin}/forum.php?mod=redirect&goto=lastpost&tid=${requested.searchParams.get("tid")}#lastpost`,
      };
  }
  return {
    ...result,
    kind: "thread",
    thread: {
      id: requested.searchParams.get("tid")!,
      title: label(heading),
      url: cleanURL(response.url),
      posts: posts.filter((post) => post !== null),
      pages,
      filters: [
        ...new Map(
          descendants(
            doc,
            (n) =>
              n.tagName === "a" &&
              /[?&](authorid|ordertype)=/.test(attr(n, "href")),
          )
            .map((n) => link(n, response.url))
            .filter((n) => n !== null && routeFor(n.url)?.kind === "thread")
            .map((n) => [n!.url, n!]),
        ).values(),
      ],
      parent:
        (byId(doc, "pt")
          ? descendants(byId(doc, "pt")!, (n) => n.tagName === "a")
              .map((n) => link(n, response.url))
              .filter(
                (n) =>
                  n !== null &&
                  ["board", "directory"].includes(routeFor(n.url)?.kind ?? ""),
              )
          : []
        ).at(-1) ?? null,
      target,
      notices: descendants(
        doc,
        (n) => hasClass(n, "locked") && outsidePosts(n),
      ).map(label),
    },
  };
}
