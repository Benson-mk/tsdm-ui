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
function attribute(tag: string, name: string, value: unknown): boolean {
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
        /\.(?:png|jpe?g|gif|webp|avif|bmp)$/i.test(new URL(value).pathname)
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
function content(value: unknown): boolean {
  if (!object(value)) return false;
  if (value.kind === "text") return string(value.text);
  if (value.kind === "unsupported")
    return string(value.description) && list(value.children, content);
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
      attribute(tag, name, value),
    ) && list(value.children, content)
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
    list(value.content, content)
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
  if (value.kind === "thread") {
    const t = value.thread;
    return (
      object(t) &&
      id(t.id) &&
      string(t.title) &&
      destination(t.url) &&
      list(t.posts, post) &&
      pages(t.pages) &&
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
          object(group) && string(group.title) && list(group.boards, boardLink),
      )
    );
  }
  return (
    string(value.kind) &&
    [
      "limited",
      "login",
      "permission",
      "missing",
      "challenge",
      "invalid",
      "network",
      "stale",
    ].includes(value.kind) &&
    string(value.message)
  );
}

/** Recognize this application's inert navigation record, not arbitrary JSON. */
export function isNavigationRecord(value: unknown): value is NavigationRecord {
  if (!object(value) || value.schema !== 1 || !object(value.entries))
    return false;
  const entries = value.entries;
  for (const [entryKey, entry] of Object.entries(entries)) {
    if (
      !key(entryKey) ||
      !object(entry) ||
      (entry.section !== undefined &&
        (typeof entry.section !== "string" ||
          !["boards", "search", "saved", "notices", "drafts"].includes(
            entry.section,
          ))) ||
      entry.key !== entryKey ||
      !destination(entry.destination) ||
      !(
        entry.originKey === null ||
        (key(entry.originKey) && Object.hasOwn(entries, entry.originKey))
      ) ||
      !nullableString(entry.selection) ||
      !nullableString(entry.account) ||
      !(entry.documentNavigations === 0 || entry.documentNavigations === 1) ||
      !(entry.result === null || result(entry.result))
    )
      return false;
    const position = entry.position;
    if (!(
      position === null ||
      (object(position) &&
        nullableString(position.anchor) &&
        finite(position.offset) &&
        finite(position.scrollTop) &&
        position.scrollTop >= 0)
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
