import { isWritingContext } from "../workspace/writing";
import { describeDestination } from "../forum-client";
import type { NavigationRecord } from "../workspace/navigation";

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const nullableString = (value: unknown) => value === null || string(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const list = (value: unknown, item: (value: unknown) => boolean) =>
  Array.isArray(value) && value.every(item);
const id = (value: unknown): value is string =>
  string(value) && /^[1-9]\d*$/.test(value);
const key = (value: unknown): value is string =>
  string(value) && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
function url(value: unknown, sameOrigin = false): value is string {
  if (!string(value)) return false;
  try {
    const parsed = new URL(value);
    return (
      ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      (!sameOrigin || parsed.origin === location.origin)
    );
  } catch {
    return false;
  }
}
const destination = (value: unknown) =>
  url(value, true) && describeDestination(value) !== null;
const link = (value: unknown) =>
  object(value) && string(value.label) && url(value.url);
function pageJump(value: unknown, sourceValue: unknown, current: unknown) {
  if (value === undefined) return true;
  if (
    !object(value) ||
    !destination(value.url) ||
    !url(sourceValue, true) ||
    !finite(value.total) ||
    !Number.isSafeInteger(value.total) ||
    value.total < 1 ||
    !string(current) ||
    !/^[1-9]\d*$/.test(current) ||
    Number(current) > value.total
  )
    return false;
  const target = new URL(String(value.url)),
    source = new URL(sourceValue);
  return (
    describeDestination(String(value.url))?.kind === "thread" &&
    target.searchParams.get("page") === "1" &&
    target.searchParams.getAll("page").length === 1 &&
    ["tid", "authorid", "ordertype"].every(
      (key) =>
        (target.searchParams.get(key) ?? (key === "ordertype" ? "0" : "")) ===
        (source.searchParams.get(key) ?? (key === "ordertype" ? "0" : "")),
    ) &&
    ![...target.searchParams.keys()].some((key) =>
      /formhash|password|token|credential/i.test(key),
    )
  );
}
const pages = (value: unknown) =>
  object(value) && string(value.current) && list(value.links, link);
const boardLink = (value: unknown) =>
  object(value) &&
  link(value) &&
  id(value.id) &&
  string(value.description) &&
  string(value.stats);
const account = (value: unknown) =>
  object(value) &&
  (value.kind === "guest" ||
    value.kind === "unknown" ||
    (value.kind === "member" && id(value.id) && string(value.name)));

// Stored models are forum-origin input. Never pass arbitrary tags or Vue props
// through to ContentView, even if the outer recovery schema is recognized.
const tags = new Set(
  "p div span br hr strong b em i u s del ins sub sup small blockquote pre code ul ol li dl dt dd table thead tbody tfoot tr th td caption h1 h2 h3 h4 h5 h6 details summary a img".split(
    " ",
  ),
);
// This is structural association in untrusted stored data, not provenance.
function attachmentImageAid(value: unknown, flag: "noupdate" | "nothumb") {
  if (!url(value, true)) return null;
  const parsed = new URL(value);
  const keys = [...parsed.searchParams.keys()];
  return parsed.pathname === "/forum.php" &&
    !parsed.href.includes("#") &&
    !/^https?:\/\/[^/?#]*@/i.test(value) &&
    keys.length === 3 &&
    new Set(keys).size === 3 &&
    parsed.searchParams.get("mod") === "attachment" &&
    parsed.searchParams.get(flag) === "yes" &&
    keys.every((key) => ["mod", "aid", flag].includes(key)) &&
    parsed.searchParams.get("aid")
    ? parsed.searchParams.get("aid")
    : null;
}
function qualifiedImage(value: string, attachments: unknown[]): boolean {
  const aid = attachmentImageAid(value, "noupdate");
  if (!aid) return false;
  const matching = attachments.filter(
    (item) =>
      object(item) &&
      url(item.url, true) &&
      new URL(item.url).searchParams.getAll("aid").includes(aid),
  );
  if (matching.length !== 1) return false;
  const descriptor = matching[0];
  return (
    object(descriptor) &&
    id(descriptor.id) &&
    attachmentImageAid(descriptor.url, "nothumb") === aid &&
    string(descriptor.name) &&
    /\.(?:png|jpe?g|gif|webp|avif|bmp)$/i.test(descriptor.name) &&
    attachments.filter((item) => object(item) && item.id === descriptor.id)
      .length === 1
  );
}
function attribute(
  tag: string,
  name: string,
  value: unknown,
  attachments: unknown[] = [],
): boolean {
  if (!string(value)) return false;
  switch (name) {
    case "class":
      return ["permission-notice", "quote", "code-block"].includes(value);
    case "style":
      return /^text-align:(left|right|center|justify)$/.test(value);
    case "href":
      return tag === "a" && url(value);
    case "rel":
      return tag === "a" && value === "noopener noreferrer";
    case "src":
      return (
        tag === "img" &&
        url(value) &&
        (/\.(?:png|jpe?g|gif|webp|avif|bmp)$/i.test(new URL(value).pathname) ||
          qualifiedImage(value, attachments))
      );
    case "alt":
      return tag === "img";
    case "loading":
      return tag === "img" && value === "lazy";
    case "referrerpolicy":
      return tag === "img" && value === "no-referrer";
    case "colspan":
    case "rowspan":
      return /^[1-9]\d?$/.test(value);
    case "dir":
      return ["ltr", "rtl", "auto"].includes(value);
    case "title":
      return true;
    default:
      return false;
  }
}
function content(value: unknown, attachments: unknown[] = []): boolean {
  if (!object(value)) return false;
  if (value.kind === "text") return string(value.text);
  if (value.kind === "unsupported")
    return (
      string(value.description) &&
      list(value.children, (child) => content(child, attachments))
    );
  if (
    value.kind !== "element" ||
    !string(value.tag) ||
    !tags.has(value.tag) ||
    !object(value.attributes)
  )
    return false;
  const tag = value.tag;
  return (
    Object.entries(value.attributes).every(([name, value]) =>
      attribute(tag, name, value, attachments),
    ) && list(value.children, (child) => content(child, attachments))
  );
}
function post(value: unknown): boolean {
  return (
    object(value) &&
    id(value.id) &&
    string(value.author) &&
    (value.authorId === null || id(value.authorId)) &&
    string(value.floor) &&
    string(value.date) &&
    url(value.url, true) &&
    (value.attachments === undefined ||
      list(
        value.attachments,
        (attachment) =>
          object(attachment) &&
          id(attachment.id) &&
          string(attachment.name) &&
          url(attachment.url, true) &&
          string(attachment.details),
      )) &&
    list(value.content, (node) =>
      content(node, Array.isArray(value.attachments) ? value.attachments : []),
    )
  );
}
function result(value: unknown): boolean {
  if (
    !object(value) ||
    !account(value.account) ||
    !finite(value.generation) ||
    !Number.isInteger(value.generation) ||
    value.generation < 0 ||
    !url(value.sourceURL, true)
  )
    return false;
  if (value.kind === "favorites") {
    const favorites = value.favorites;
    return (
      object(favorites) &&
      ["thread", "forum"].includes(String(favorites.kind)) &&
      destination(favorites.url) &&
      pages(favorites.pages) &&
      list(
        favorites.records,
        (item) =>
          object(item) &&
          id(item.id) &&
          id(item.targetId) &&
          item.kind === favorites.kind &&
          (item.url === null || destination(item.url)) &&
          string(item.title) &&
          string(item.time) &&
          string(item.note) &&
          typeof item.removable === "boolean" &&
          (item.unavailableText === undefined || string(item.unavailableText)),
      )
    );
  }
  if (value.kind === "search") {
    const search = value.search;
    return (
      object(search) &&
      object(search.form) &&
      destination(search.form.url) &&
      list(search.form.restrictions, string) &&
      list(
        search.form.fields,
        (field) =>
          object(field) &&
          string(field.name) &&
          string(field.label) &&
          (field.labelFromForum === undefined ||
            typeof field.labelFromForum === "boolean") &&
          ["text", "select", "choices"].includes(String(field.kind)) &&
          typeof field.multiple === "boolean" &&
          typeof field.disabled === "boolean" &&
          typeof field.readOnly === "boolean" &&
          (field.maxLength === null || finite(field.maxLength)) &&
          list(field.values, string) &&
          list(
            field.options,
            (option) =>
              object(option) &&
              string(option.value) &&
              string(option.label) &&
              typeof option.disabled === "boolean",
          ),
      ) &&
      (search.submitted === null ||
        (object(search.submitted) &&
          Object.values(search.submitted).every((value) =>
            list(value, string),
          ))) &&
      (search.effective === null ||
        (object(search.effective) &&
          Object.values(search.effective).every((value) =>
            list(value, string),
          ))) &&
      (search.results === null ||
        (object(search.results) &&
          id(search.results.id) &&
          destination(search.results.url) &&
          string(search.results.summary) &&
          pages(search.results.pages) &&
          list(
            search.results.rows,
            (row) =>
              object(row) &&
              id(row.id) &&
              link(row) &&
              link(row.author) &&
              link(row.board) &&
              string(row.date) &&
              string(row.snippet) &&
              string(row.stats),
          ))) &&
      object(search.edited) &&
      Object.values(search.edited).every((value) => list(value, string))
    );
  }
  if (value.kind === "messages") {
    const messages = value.messages;
    return (
      object(messages) &&
      destination(messages.url) &&
      string(messages.empty) &&
      pages(messages.pages) &&
      list(
        messages.peers,
        (peer) =>
          object(peer) &&
          id(peer.id) &&
          id(peer.peerId) &&
          string(peer.name) &&
          url(peer.url, true) &&
          string(peer.preview) &&
          string(peer.time) &&
          typeof peer.unread === "boolean",
      )
    );
  }
  if (value.kind === "notices") {
    const notices = value.notices;
    return (
      object(notices) &&
      destination(notices.url) &&
      list(
        notices.categories,
        (category) =>
          link(category) &&
          object(category) &&
          typeof category.current === "boolean",
      ) &&
      pages(notices.pages) &&
      string(notices.empty) &&
      object(notices.unread) &&
      (["unknown", "absent"].includes(String(notices.unread.kind)) ||
        (notices.unread.kind === "observed" &&
          finite(notices.unread.count) &&
          Number.isSafeInteger(notices.unread.count) &&
          notices.unread.count >= 0)) &&
      list(
        notices.entries,
        (entry) =>
          object(entry) &&
          id(entry.id) &&
          string(entry.time) &&
          list(entry.body, (node) => content(node)),
      )
    );
  }
  if (value.kind === "thread") {
    const t = value.thread;
    return (
      object(t) &&
      id(t.id) &&
      string(t.title) &&
      destination(t.url) &&
      list(t.posts, post) &&
      pages(t.pages) &&
      pageJump(t.pageJump, t.url, object(t.pages) ? t.pages.current : null) &&
      (t.history === undefined ||
        (object(t.history) &&
          (t.history.earlier === null || link(t.history.earlier)) &&
          (t.history.later === null || link(t.history.later)) &&
          (t.history.latest === null || link(t.history.latest)) &&
          typeof t.history.beginning === "boolean" &&
          typeof t.history.end === "boolean" &&
          (t.history.order === "ascending" ||
            t.history.order === "descending"))) &&
      list(t.filters, link) &&
      (t.parent === null || link(t.parent)) &&
      (t.target === null || id(t.target)) &&
      list(t.notices, string)
    );
  }
  if (value.kind === "board") {
    const b = value.board;
    return (
      object(b) &&
      id(b.id) &&
      string(b.title) &&
      destination(b.url) &&
      list(b.boards, boardLink) &&
      list(
        b.threads,
        (row) =>
          object(row) &&
          link(row) &&
          id(row.id) &&
          string(row.rowId) &&
          typeof row.pinned === "boolean" &&
          typeof row.moved === "boolean" &&
          string(row.category) &&
          string(row.author) &&
          string(row.date) &&
          string(row.replies) &&
          string(row.views) &&
          (row.lastPost === null || link(row.lastPost)),
      ) &&
      list(b.filters, link) &&
      (b.filterGroups === undefined ||
        list(
          b.filterGroups,
          (group) =>
            object(group) &&
            string(group.kind) &&
            ["category", "order", "type", "time", "unclassified"].includes(
              group.kind,
            ) &&
            string(group.sourceId) &&
            (group.sourceLabel === undefined || string(group.sourceLabel)) &&
            list(group.links, link),
        )) &&
      list(b.criteria, link) &&
      pages(b.pages) &&
      string(b.empty)
    );
  }
  if (value.kind === "directory") {
    const d = value.directory;
    return (
      object(d) &&
      destination(d.url) &&
      pages(d.pages) &&
      list(
        d.groups,
        (group) =>
          object(group) &&
          string(group.title) &&
          (group.sourceId === undefined || string(group.sourceId)) &&
          (group.sourceURL === undefined || destination(group.sourceURL)) &&
          list(group.boards, boardLink),
      )
    );
  }
  return (
    string(value.kind) &&
    [
      "cost",
      "throttle",
      "expired",
      "limited",
      "login",
      "permission",
      "missing",
      "challenge",
      "invalid",
      "network",
      "stale",
    ].includes(value.kind) &&
    string(value.message) &&
    (value.nativeText === undefined || nullableString(value.nativeText))
  );
}

/** Recognize this application's inert navigation record, not arbitrary JSON. */
export function isNavigationRecord(value: unknown): value is NavigationRecord {
  if (
    !object(value) ||
    (value.schema !== 2 && value.schema !== 3) ||
    !object(value.entries)
  )
    return false;
  if (
    value.schema === 2 &&
    object(value.writing) &&
    (value.writing.action === "private-message" ||
      value.writing.privateAttempts !== undefined)
  )
    return false;
  if (!(value.writing === null || isWritingContext(value.writing)))
    return false;
  if (
    value.favoriteAttempts !== undefined &&
    !list(value.favoriteAttempts, (attempt) => {
      if (
        !object(attempt) ||
        !key(attempt.id) ||
        !object(attempt.command) ||
        !key(attempt.command.id) ||
        !finite(attempt.command.generation) ||
        !object(attempt.command.intent) ||
        !["pending", "confirmed", "uncertain", "not-sent"].includes(
          String(attempt.status),
        ) ||
        typeof attempt.checked !== "boolean" ||
        !string(attempt.message)
      )
        return false;
      const intent = attempt.command.intent,
        generation = attempt.command.generation;
      return (
        ["add", "remove"].includes(String(intent.action)) &&
        ["thread", "forum"].includes(String(intent.kind)) &&
        id(intent.targetId) &&
        id(intent.accountId) &&
        (intent.action === "add"
          ? intent.recordId === null
          : id(intent.recordId)) &&
        (attempt.pages === null ||
          list(attempt.pages, (favorites) =>
            result({
              kind: "favorites",
              favorites,
              account: { kind: "member", id: intent.accountId, name: "" },
              generation,
              sourceURL: object(favorites) ? favorites.url : null,
            }),
          ))
      );
    })
  )
    return false;
  const entries = value.entries;
  for (const [entryKey, entry] of Object.entries(entries)) {
    if (
      !key(entryKey) ||
      !object(entry) ||
      (entry.section !== undefined &&
        (typeof entry.section !== "string" ||
          ![
            "boards",
            "search",
            "saved",
            "notices",
            "messages",
            "drafts",
          ].includes(entry.section))) ||
      entry.key !== entryKey ||
      !destination(entry.destination) ||
      !(
        entry.originKey === null ||
        (key(entry.originKey) && Object.hasOwn(entries, entry.originKey))
      ) ||
      (entry.readingKey !== undefined &&
        entry.readingKey !== null &&
        !(key(entry.readingKey) && Object.hasOwn(entries, entry.readingKey))) ||
      !nullableString(entry.selection) ||
      !nullableString(entry.account) ||
      !(
        entry.drafts === undefined ||
        entry.drafts === null ||
        (object(entry.drafts) &&
          entry.drafts.kind === "drafts" &&
          account(entry.drafts.account) &&
          finite(entry.drafts.generation) &&
          url(entry.drafts.sourceURL, true) &&
          object(entry.drafts.drafts) &&
          url(entry.drafts.drafts.url, true) &&
          pages(entry.drafts.drafts.pages) &&
          string(entry.drafts.drafts.empty) &&
          list(
            entry.drafts.drafts.rows,
            (row) =>
              object(row) &&
              id(row.threadId) &&
              id(row.boardId) &&
              string(row.title) &&
              url(row.url, true),
          ))
      ) ||
      !(entry.documentNavigations === 0 || entry.documentNavigations === 1) ||
      !(entry.result === null || result(entry.result))
    )
      return false;
    if (entry.readingMarker !== undefined) {
      const marker = entry.readingMarker;
      if (
        !object(marker) ||
        !finite(marker.savedAt) ||
        marker.savedAt < 0 ||
        !string(marker.url) ||
        !destination(marker.url) ||
        !string(marker.account) ||
        marker.account !== entry.account ||
        !object(marker.position) ||
        !string(marker.position.anchor) ||
        !finite(marker.position.offset) ||
        !finite(marker.position.scrollTop) ||
        marker.position.scrollTop < 0 ||
        (marker.position.readingPaneTop !== undefined &&
          !finite(marker.position.readingPaneTop)) ||
        (marker.position.readingRegionScrollTop !== undefined &&
          (!finite(marker.position.readingRegionScrollTop) ||
            marker.position.readingRegionScrollTop < 0))
      )
        return false;
      const target = describeDestination(marker.url);
      const targetURL = new URL(marker.url);
      if (
        [...targetURL.searchParams.keys()].some((name) =>
          /^(?:formhash|token|auth|password|sid)$/i.test(name),
        )
      )
        return false;
      if (target?.kind === "private-conversation") {
        const source = describeDestination(String(entry.destination));
        const sourceURL = new URL(String(entry.destination));
        if (
          source?.kind !== "private-conversation" ||
          !/^member:[1-9]\d*$/.test(marker.account) ||
          !/^pmlist_[1-9]\d*$/.test(marker.position.anchor) ||
          targetURL.origin !== sourceURL.origin ||
          targetURL.searchParams.get("touid") !==
            sourceURL.searchParams.get("touid") ||
          (targetURL.searchParams.get("daterange") ?? "0") !==
            (sourceURL.searchParams.get("daterange") ?? "0") ||
          [...targetURL.searchParams.keys()].some(
            (name) =>
              !["mod", "do", "subop", "touid", "daterange", "page"].includes(
                name,
              ),
          )
        )
          return false;
      } else {
        if (
          !object(entry.result) ||
          entry.result.kind !== "thread" ||
          !object(entry.result.thread)
        )
          return false;
        const source = new URL(String(entry.result.thread.url));
        if (
          target?.kind !== "thread" ||
          targetURL.searchParams.get("tid") !== entry.result.thread.id ||
          targetURL.searchParams.get("authorid") !==
            source.searchParams.get("authorid") ||
          (targetURL.searchParams.get("ordertype") ?? "0") !==
            (source.searchParams.get("ordertype") ?? "0") ||
          !/^pid[1-9]\d*$/.test(marker.position.anchor)
        )
          return false;
      }
    }
    const position = entry.position;
    if (!(
      position === null ||
      (object(position) &&
        nullableString(position.anchor) &&
        finite(position.offset) &&
        finite(position.scrollTop) &&
        position.scrollTop >= 0 &&
        (position.readingPaneTop === undefined ||
          finite(position.readingPaneTop)) &&
        (position.readingRegionScrollTop === undefined ||
          (finite(position.readingRegionScrollTop) &&
            position.readingRegionScrollTop >= 0)) &&
        (position.readingScrollTop === undefined ||
          (finite(position.readingScrollTop) &&
            position.readingScrollTop >= 0)) &&
        (position.resultsScrollTop === undefined ||
          (finite(position.resultsScrollTop) &&
            position.resultsScrollTop >= 0)))
    ))
      return false;
  }
  if (value.pending === null) return true;
  const pending = value.pending;
  if (
    !object(pending) ||
    !key(pending.entryKey) ||
    !Object.hasOwn(entries, pending.entryKey) ||
    !destination(pending.destination)
  )
    return false;
  const entry = entries[pending.entryKey];
  return (
    object(entry) &&
    entry.documentNavigations === 1 &&
    entry.destination === pending.destination
  );
}
