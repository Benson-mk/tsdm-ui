import {
  attr,
  children,
  element,
  byId,
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
  BoardLink,
  BoardFilterGroup,
  ForumLink,
  HostResponse,
  Pagination,
  ReadResult,
  ThreadRow,
} from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
function closest(
  node: Node,
  predicate: (node: Element) => boolean,
): Element | null {
  let current: Node | null = node;
  while (current) {
    if ("tagName" in current && predicate(current)) return current;
    current = "parentNode" in current ? current.parentNode : null;
  }
  return null;
}
export function link(
  node: Element | undefined,
  base: string,
): ForumLink | null {
  if (!node) return null;
  const url = safeURL(attr(node, "href"), base);
  return url && label(node) ? { url: cleanURL(url), label: label(node) } : null;
}
function groupProvenance(
  node: Element,
  heading: Element | undefined,
  base: string,
) {
  const headingLink =
    heading && link(descendants(heading, (n) => n.tagName === "a")[0], base);
  const route = headingLink && routeFor(headingLink.url);
  return {
    ...(attr(node, "id") ? { sourceId: attr(node, "id") } : {}),
    ...(route &&
    ["directory", "favorites"].includes(route.kind) &&
    route.url.origin === new URL(base).origin
      ? { sourceURL: route.url.href }
      : {}),
  };
}
function links(
  doc: Node,
  base: string,
  predicate: (node: Element) => boolean,
): ForumLink[] {
  const items = descendants(doc, (n) => n.tagName === "a" && predicate(n))
    .map((n) => link(n, base))
    .filter((n) => n !== null);
  return [...new Map(items.map((n) => [n.url, n])).values()];
}
export function pagination(doc: Node, base: string): Pagination {
  const root = descendants(
    doc,
    (n) => hasClass(n, "pg") || hasClass(n, "page"),
  )[0];
  return {
    current:
      label(root && descendants(root, (n) => n.tagName === "strong")[0]) ||
      new URL(base).searchParams.get("page") ||
      "1",
    links: root
      ? links(root, base, (n) =>
          Boolean(routeFor(safeURL(attr(n, "href"), base) ?? "")),
        )
      : [],
  };
}
function boards(doc: Node, base: string): BoardLink[] {
  const items = descendants(
    doc,
    (n) =>
      n.tagName === "a" &&
      Boolean(
        closest(
          n,
          (p) =>
            p.tagName === "h2" || p.tagName === "dt" || hasClass(p, "murl"),
        ),
      ),
  )
    .map((n) => {
      const item = link(n, base),
        route = item && routeFor(item.url);
      if (
        !item ||
        route?.kind !== "board" ||
        route.url.origin !== new URL(base).origin
      )
        return null;
      const cell = hasClass(n, "murl")
        ? n
        : (closest(n, (p) => ["td", "li"].includes(p.tagName)) ?? n);
      return {
        ...item,
        label:
          label(descendants(n, (p) => hasClass(p, "mtit"))[0]) || item.label,
        id: route.url.searchParams.get("fid")!,
        description: label(
          descendants(
            cell,
            (p) => hasClass(p, "xg2") || hasClass(p, "mtxt"),
          )[0],
        ),
        stats: label(
          descendants(
            cell,
            (p) => hasClass(p, "xg1") || hasClass(p, "mnum"),
          )[0],
        ),
      };
    })
    .filter((n) => n !== null);
  return [...new Map(items.map((n) => [n.url, n])).values()];
}
export function decodeBoard(
  response: HostResponse,
  requested: string,
): Decoded {
  const request = routeFor(requested),
    actual = routeFor(response.url);
  const fail = (
    kind:
      "invalid" | "login" | "permission" | "missing" | "challenge" | "limited",
    message: string,
  ): Decoded => ({
    kind,
    message,
    account: { kind: "unknown" },
    sourceURL: requested,
  });
  if (
    !request ||
    !actual ||
    actual.url.origin !== request.url.origin ||
    actual.kind !== request.kind ||
    (request.kind === "board" &&
      actual.url.searchParams.get("fid") !==
        request.url.searchParams.get("fid")) ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    )
  )
    return fail(
      "invalid",
      "The forum returned an unsupported response envelope.",
    );
  let source = response.body;
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
      source = `${"head" in payload && typeof payload.head === "string" ? payload.head : ""}${payload.document}`;
    } catch {
      return fail("invalid", "The forum returned an invalid response.");
    }
  }
  const doc = documentFrom(source),
    account = accountFrom(doc, response.url);
  const title = label(descendants(doc, (n) => n.tagName === "title")[0]);
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser|安全验证|驗證您的瀏覽器/i.test(title)
  )
    return {
      ...fail(
        "challenge",
        "Native verification is required. Your destination is preserved.",
      ),
      account,
    };
  if (
    response.status === 404 ||
    response.status === 410 ||
    /不存在|已[被經经]*删除|已[被經经]*刪除|not found/i.test(message)
  )
    return {
      ...fail("missing", "This board is missing or has been deleted."),
      account,
    };
  if (
    response.status === 401 ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(message)
  )
    return {
      ...fail("login", "Sign in through the native forum, then retry."),
      account,
    };
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return {
      ...fail(
        "permission",
        "The current account does not have permission to read this board.",
      ),
      account,
    };
  if (response.status === 429)
    return {
      ...fail(
        "limited",
        "The forum is limiting requests. Retry explicitly later.",
      ),
      account,
    };
  if (response.status < 200 || response.status >= 300 || message)
    return {
      ...fail(
        "invalid",
        response.status === 429
          ? "The forum is limiting requests. Retry explicitly later."
          : "The forum response could not be displayed reliably.",
      ),
      account,
    };
  const url = cleanURL(response.url),
    common = { account, sourceURL: url };
  if (actual.kind === "directory") {
    const groups = descendants(doc, (n) =>
      /^category_\d+$/.test(attr(n, "id")),
    ).map((n) => {
      const parent = closest(n, (p) => hasClass(p, "bm"));
      const heading = parent
        ? descendants(parent, (p) => hasClass(p, "bm_h"))[0]
        : undefined;
      const title =
        heading &&
        (descendants(heading, (p) => p.tagName === "h2")[0] ?? heading);
      return {
        ...groupProvenance(n, title, url),
        title: label(title) || "Boards",
        boards: boards(n, url),
      };
    });
    if (!groups.length)
      groups.push(
        ...descendants(doc, (n) => hasClass(n, "sub-forum")).map((n) => ({
          title:
            label(
              (closest(n, (p) => hasClass(p, "forumlist")) &&
                descendants(
                  closest(n, (p) => hasClass(p, "forumlist"))!,
                  (p) => p.tagName === "h2",
                )[0]) ||
                undefined,
            ) || "Forum boards",
          boards: boards(n, url),
        })),
      );
    if (!groups.length)
      groups.push({ title: "Forum boards", boards: boards(doc, url) });
    if (!groups.some((g) => g.boards.length))
      return {
        ...fail("invalid", "The board directory could not be interpreted."),
        account,
      };
    return {
      ...common,
      kind: "directory",
      directory: {
        groups: groups.filter((g) => g.boards.length),
        url,
        pages: pagination(doc, url),
      },
    };
  }
  const touchContainer = descendants(doc, (n) =>
    hasClass(n, "threadlist_box"),
  )[0];
  const touch = Boolean(touchContainer);
  const container = touchContainer ?? byId(doc, "threadlisttableid");
  if (byId(doc, "waterfall") && !container)
    return {
      ...fail(
        "invalid",
        "This picture-board representation cannot yet be interpreted completely. Continue in the native forum.",
      ),
      account,
    };
  const subboards = descendants(doc, (n) =>
    /^subforum_\d+$/.test(attr(n, "id")),
  ).flatMap((n) => boards(n, url));
  const rows = container
    ? descendants(container, (n) =>
        touch
          ? n.tagName === "li" &&
            (hasClass(n, "list") || hasClass(n, "list_top"))
          : /^(normal|stick)thread_[1-9]\d*$/.test(attr(n, "id")),
      )
    : [];
  const threads = rows.map((row): ThreadRow | null => {
    const item = link(
        descendants(
          row,
          (n) =>
            n.tagName === "a" &&
            (touch
              ? attr(n, "href").includes("mod=viewthread")
              : hasClass(n, "xst")),
        )[0],
        url,
      ),
      route = item && routeFor(item.url);
    if (
      !item ||
      route?.kind !== "thread" ||
      route.url.origin !== actual.url.origin
    )
      return null;
    const id = route.url.searchParams.get("tid")!,
      rowId = touch ? id : attr(row, "id").split("_").at(-1)!;
    const moved = /(?:移动|移動)\s*[:：]/.test(label(row));
    if (rowId !== id && !moved) return null;
    const by = descendants(row, (n) => n.tagName === "td" && hasClass(n, "by")),
      num = descendants(row, (n) => hasClass(n, "num"))[0];
    return {
      ...item,
      id,
      rowId,
      moved,
      pinned: touch
        ? hasClass(row, "list_top")
        : attr(row, "id").startsWith("stick"),
      category: label(
        descendants(row, (n) => n.tagName === "th").flatMap((n) =>
          descendants(n, (p) => p.tagName === "em"),
        )[0],
      ),
      author: label(
        touch
          ? descendants(row, (n) => hasClass(n, "muser"))[0]
          : by[0] && descendants(by[0], (n) => n.tagName === "cite")[0],
      ),
      date: label(
        touch
          ? descendants(row, (n) => hasClass(n, "mtime"))[0]
          : by[0] && descendants(by[0], (n) => n.tagName === "em")[0],
      ),
      replies: label(
        touch
          ? descendants(row, (n) => hasClass(n, "mreply"))[0]
          : num && descendants(num, (n) => n.tagName === "a")[0],
      ),
      views: label(num && descendants(num, (n) => n.tagName === "em")[0]),
      lastPost: link(
        by.at(-1) &&
          descendants(by.at(-1)!, (n) => n.tagName === "em").flatMap((n) =>
            descendants(n, (p) => p.tagName === "a"),
          )[0],
        url,
      ),
    };
  });
  const empty = container
    ? label(descendants(container, (n) => hasClass(n, "emp"))[0])
    : "";
  if (
    threads.some((n) => n === null) ||
    (!threads.length &&
      !subboards.length &&
      !/暂无|沒有|没有|無主題|no (?:threads|posts)/i.test(empty))
  )
    return {
      ...fail(
        "invalid",
        "The board contains unrecognized or incomplete thread rows. Continue in the native forum for complete content.",
      ),
      account,
    };
  const menuKinds: Record<string, BoardFilterGroup["kind"]> = {
    thread_types: "category",
    filter_special_menu: "type",
    filter_orderby_menu: "order",
    filter_dateline_menu: "time",
    dhnav: "unclassified",
    dhnavs: "unclassified",
  };
  const isMenu = (node: Element) =>
    Object.hasOwn(menuKinds, attr(node, "id")) ||
    /^filter_[a-z0-9_]+_menu$/i.test(attr(node, "id"));
  // Native More menus contain labelled LI subgroups with mixed semantics.
  // Preserve those labels verbatim instead of guessing from translated text.
  const filterGroups = descendants(doc, isMenu)
    .flatMap((root): BoardFilterGroup[] => {
      const sourceId = attr(root, "id");
      const returned = (node: Node) =>
        links(node, url, (anchor) => closest(anchor, isMenu) === root).filter(
          (item) => routeFor(item.url)?.kind === "board",
        );
      const allLinks = returned(root);
      const rows = descendants(
        root,
        (node) =>
          node.tagName === "li" &&
          !!node.parentNode &&
          hasClass(node.parentNode, "pop_moremenu") &&
          closest(node, isMenu) === root,
      );
      const nativeGroups = rows
        .map((row): BoardFilterGroup => {
          const prefix: Node[] = [];
          for (const child of children(row)) {
            if (
              element(child) &&
              (child.tagName === "a" ||
                descendants(child, (node) => node.tagName === "a").length)
            )
              break;
            prefix.push(child);
          }
          const sourceLabel = prefix
            .map((node) => label(node))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          return {
            kind: "unclassified",
            sourceId,
            ...(sourceLabel ? { sourceLabel } : {}),
            links: returned(row),
          };
        })
        .filter((group) => group.links.length);
      const covered = new Set(
        nativeGroups.flatMap((group) => group.links.map((item) => item.url)),
      );
      if (
        nativeGroups.length &&
        allLinks.every((item) => covered.has(item.url))
      )
        return nativeGroups;
      return [
        {
          kind: rows.length
            ? "unclassified"
            : Object.hasOwn(menuKinds, sourceId)
              ? menuKinds[sourceId]!
              : "unclassified",
          sourceId,
          links: allLinks,
        },
      ];
    })
    .filter((group) => group.links.length);
  const filters = filterGroups.flatMap((group) => group.links);
  const criterionNames: Record<string, string> = {
    typeid: "Category",
    orderby: "Sort",
    authorid: "Author",
    dateline: "Time",
    digest: "Digest",
    specialtype: "Thread type",
    rewardtype: "Reward",
    filter: "Filter",
  };
  const criterionKinds: Record<string, BoardFilterGroup["kind"]> = {
    typeid: "category",
    orderby: "order",
    dateline: "time",
    specialtype: "type",
  };
  const criteria = [...actual.url.searchParams]
    .filter(
      ([key]) =>
        Object.hasOwn(criterionNames, key) &&
        !(
          key === "filter" &&
          ["typeid", "orderby", "digest", "specialtype"].some((name) =>
            actual.url.searchParams.has(name),
          )
        ),
    )
    .map(([key, value]) => {
      // A matching parameter can be carried context for another choice.
      // Require its explicit selector or non-conflicting known menu provenance.
      const returned = filterGroups.flatMap((group) =>
        group.links.filter((item) => {
          const parameters = new URL(item.url).searchParams;
          if (parameters.get(key) !== value) return false;
          const selector = parameters.get("filter");
          return selector
            ? selector === key
            : group.kind === criterionKinds[key];
        }),
      )[0];
      return {
        label: `${criterionNames[key]}: ${returned?.label ?? value}`,
        url,
      };
    });
  const heading = touch
      ? descendants(doc, (n) => hasClass(n, "header"))[0]
      : byId(doc, "ct"),
    titleNode =
      heading &&
      descendants(heading, (n) => n.tagName === (touch ? "h2" : "h1"))[0];
  return {
    ...common,
    kind: "board",
    board: {
      id: actual.url.searchParams.get("fid")!,
      title: label(titleNode) || "Board threads",
      url,
      boards: subboards,
      threads: threads.filter((n) => n !== null),
      filters: [...new Map(filters.map((n) => [n.url, n])).values()],
      filterGroups,
      criteria,
      pages: pagination(doc, url),
      empty,
    },
  };
}
