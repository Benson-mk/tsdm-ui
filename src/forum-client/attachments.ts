import {
  attr,
  descendants,
  hasClass,
  label,
  safeURL,
  type Node,
} from "./html.js";
import type { Attachment } from "./types.js";
export function attachmentURL(raw: string, base: string): string | null {
  const safe = safeURL(raw, base);
  if (!safe) return null;
  const url = new URL(safe);
  return url.origin === new URL(base).origin &&
    url.pathname === "/forum.php" &&
    url.searchParams.get("mod") === "attachment" &&
    [...url.searchParams.keys()].every(
      (key) =>
        ["mod", "aid", "nothumb", "noupdate"].includes(key) &&
        url.searchParams.getAll(key).length === 1,
    ) &&
    url.searchParams.getAll("aid").length === 1 &&
    url.searchParams.get("aid") &&
    !url.hash
    ? url.href
    : null;
}
export function attachments(post: Node, base: string): Attachment[] {
  const candidates = descendants(post, (node) =>
    /^attach_[1-9]\d*$/.test(attr(node, "id")),
  ).flatMap((area) => {
    const links = descendants(
      area,
      (node) => node.tagName === "a" && Boolean(attr(node, "href")),
    );
    return links.length === 1
      ? [
          {
            id: attr(area, "id").slice(7),
            anchor: links[0]!,
            scope:
              "parentNode" in area && area.parentNode ? area.parentNode : area,
          },
        ]
      : [];
  });
  for (const list of descendants(
    post,
    (node) => node.tagName === "dl" && hasClass(node, "tattl"),
  )) {
    const names = descendants(
      list,
      (node) => node.tagName === "p" && hasClass(node, "attnm"),
    );
    if (names.length !== 1) continue;
    const links = descendants(
      names[0]!,
      (node) => node.tagName === "a" && Boolean(attr(node, "href")),
    );
    const anchor = links.length === 1 ? links[0] : undefined;
    if (!anchor || !/^aid[1-9]\d*$/.test(attr(anchor, "id"))) continue;
    candidates.push({ id: attr(anchor, "id").slice(3), anchor, scope: list });
  }
  const unique = candidates.filter(
    (candidate, index) =>
      candidates.findIndex(
        (item) => item.id === candidate.id && item.anchor === candidate.anchor,
      ) === index,
  );
  return unique.flatMap(({ id, anchor, scope }) => {
    if (
      unique.filter((item) => item.id === id).length !== 1 ||
      unique.some((item) => item.anchor === anchor && item.id !== id) ||
      (/^aid[1-9]\d*$/.test(attr(anchor, "id")) &&
        attr(anchor, "id").slice(3) !== id)
    )
      return [];
    const url = attachmentURL(attr(anchor, "href"), base);
    const name = label(anchor);
    if (!url || !name || attr(anchor, "onclick") || attr(anchor, "ping"))
      return [];
    return [{ id, name, url, details: label(scope) }];
  });
}
