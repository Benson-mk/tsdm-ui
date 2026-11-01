import {
  attr,
  descendants,
  hasClass,
  label,
  safeURL,
  type Node,
  type Element,
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
interface Candidate {
  id: string;
  anchor: Element;
  scope: Node;
  image?: Element;
  imageURL?: string;
  name?: string;
}
export function attachmentProfiles(
  post: Node,
  base: string,
): { attachments: Attachment[]; inlineImages: Map<Element, string> } {
  const candidates: Candidate[] = descendants(post, (node) =>
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
  const images = descendants(
    post,
    (node) =>
      node.tagName === "img" && /^aimg_[1-9]\d*$/.test(attr(node, "id")),
  );
  for (const image of images) {
    const id = attr(image, "id").slice(5);
    if (
      attr(image, "aid") !== id ||
      images.filter((node) => attr(node, "id") === `aimg_${id}`).length !== 1
    )
      continue;
    let permission = false;
    for (
      let node: Node | null = image;
      node;
      node = "parentNode" in node ? node.parentNode : null
    ) {
      if (hasClass(node, "attach_nopermission")) permission = true;
      if (node === post) break;
    }
    if (permission) continue;
    const menus = descendants(
      post,
      (node) => attr(node, "id") === `aimg_${id}_menu`,
    );
    if (menus.length !== 1 || menus[0]!.tagName !== "div") continue;
    const menu = menus[0]!;
    const links = descendants(
      menu,
      (node) =>
        node.tagName === "a" &&
        Boolean(attachmentURL(attr(node, "href"), base)),
    );
    if (links.length !== 1) continue;
    const anchor = links[0]!;
    const names = descendants(menu, (node) => node.tagName === "strong");
    const filename = names.length === 1 ? names[0] : undefined;
    if (
      attr(anchor, "onclick") ||
      attr(anchor, "ping") ||
      !filename ||
      filename.parentNode?.nodeName !== "p" ||
      !/\.(?:png|jpe?g|gif|webp|avif|bmp)$/i.test(label(filename))
    )
      continue;
    const imageURL = attachmentURL(attr(image, "file"), base);
    const offeredURL = attachmentURL(attr(anchor, "href"), base);
    const zoomURL = attachmentURL(attr(image, "zoomfile"), base);
    if (
      !imageURL ||
      !offeredURL ||
      !zoomURL ||
      ["data-src", "data-original"].some(
        (name) =>
          attr(image, name) && safeURL(attr(image, name), base) !== imageURL,
      )
    )
      continue;
    const source = new URL(imageURL),
      offered = new URL(offeredURL),
      zoom = new URL(zoomURL);
    if (
      source.searchParams.size !== 3 ||
      source.searchParams.get("noupdate") !== "yes" ||
      offered.searchParams.size !== 3 ||
      offered.searchParams.get("nothumb") !== "yes" ||
      source.searchParams.get("aid") !== offered.searchParams.get("aid") ||
      zoom.searchParams.size !== 4 ||
      zoom.searchParams.get("noupdate") !== "yes" ||
      zoom.searchParams.get("nothumb") !== "yes" ||
      zoom.searchParams.get("aid") !== source.searchParams.get("aid")
    )
      continue;
    candidates.push({
      id,
      anchor,
      scope: menu,
      image,
      imageURL,
      name: label(filename),
    });
  }
  const unique = candidates.filter(
    (candidate, index) =>
      candidates.findIndex(
        (item) => item.id === candidate.id && item.anchor === candidate.anchor,
      ) === index,
  );
  const inlineImages = new Map<Element, string>();
  const found = unique.flatMap(
    ({ id, anchor, scope, image, imageURL, name: offeredName }) => {
      if (
        unique.filter((item) => item.id === id).length !== 1 ||
        unique.some((item) => item.anchor === anchor && item.id !== id) ||
        (/^aid[1-9]\d*$/.test(attr(anchor, "id")) &&
          attr(anchor, "id").slice(3) !== id)
      )
        return [];
      const url = attachmentURL(attr(anchor, "href"), base);
      const name = offeredName ?? label(anchor);
      if (!url || !name || attr(anchor, "onclick") || attr(anchor, "ping"))
        return [];
      if (image && imageURL) inlineImages.set(image, imageURL);
      return [{ id, name, url, details: label(scope) }];
    },
  );
  return { attachments: found, inlineImages };
}
export function attachments(post: Node, base: string): Attachment[] {
  return attachmentProfiles(post, base).attachments;
}
