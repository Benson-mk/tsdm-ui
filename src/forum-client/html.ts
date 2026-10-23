import { parse, parseFragment, type DefaultTreeAdapterMap } from "parse5";
import type { ContentNode } from "./types.js";
export type Node = DefaultTreeAdapterMap["node"];
export type Element = DefaultTreeAdapterMap["element"];
export function element(node: Node): node is Element {
  return "tagName" in node;
}
export function children(node: Node): Node[] {
  return "childNodes" in node ? node.childNodes : [];
}
export function attr(node: Node, key: string): string {
  return element(node)
    ? (node.attrs.find((a) => a.name === key)?.value ?? "")
    : "";
}
export function descendants(
  node: Node,
  predicate: (node: Element) => boolean,
): Element[] {
  return children(node).flatMap((child) => [
    ...(element(child) && predicate(child) ? [child] : []),
    ...descendants(child, predicate),
  ]);
}
export function byId(node: Node, id: string): Element | undefined {
  return descendants(node, (child) => attr(child, "id") === id)[0];
}
/** Native disabled fieldset/first-legend and optgroup semantics, without DOM. */
export function controlDisabled(node: Element): boolean {
  const disabled = (value: Element) =>
    value.attrs.some((a) => a.name === "disabled");
  if (disabled(node)) return true;
  let child: Node = node;
  for (
    let parent: Node | null = node.parentNode;
    parent;
    parent = "parentNode" in parent ? parent.parentNode : null
  ) {
    if (element(parent) && disabled(parent)) {
      if (parent.tagName === "optgroup" && node.tagName === "option")
        return true;
      if (
        parent.tagName === "fieldset" &&
        children(parent).find((n) => element(n) && n.tagName === "legend") !==
          child
      )
        return true;
    }
    child = parent;
  }
  return false;
}
export function hasClass(node: Node, name: string): boolean {
  return attr(node, "class").split(/\s+/).includes(name);
}
export function text(node: Node | undefined): string {
  if (!node) return "";
  if ("value" in node) return node.value;
  if (element(node) && ["script", "style"].includes(node.tagName)) return "";
  return children(node).map(text).join("");
}
export function label(node: Node | undefined): string {
  return text(node).replace(/\s+/g, " ").trim();
}
export function safeURL(raw: string, base: string): string | null {
  if (!raw.trim()) return null;
  try {
    const url = new URL(raw, base);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
const allowed = new Set(
  "p div span br hr strong b em i u s del ins sub sup small blockquote pre code ul ol li dl dt dd table thead tbody tfoot tr th td caption h1 h2 h3 h4 h5 h6 details summary a img".split(
    " ",
  ),
);
const discarded = new Set(
  "script style link meta base noscript template svg math input button select textarea".split(
    " ",
  ),
);
const interactive = new Set("iframe object embed video audio form".split(" "));
export function content(node: Node, base: string): ContentNode[] {
  return children(node).flatMap((child): ContentNode[] => {
    if ("value" in child) return [{ kind: "text", text: child.value }];
    if (!element(child) || discarded.has(child.tagName)) return [];
    if (
      attr(child, "id") === "hb_mask" &&
      hasClass(child, "mask") &&
      descendants(
        child,
        (node) => attr(node, "id") === "hb_env" && hasClass(node, "env"),
      ).length > 0
    )
      return [
        {
          kind: "unsupported",
          description:
            "Native red-packet interaction requires the native forum.",
          children: [],
        },
      ];
    const spoilerBody =
      (hasClass(child, "spoiler") || hasClass(child, "spoiler_wrap")) &&
      descendants(
        child,
        (n) => hasClass(n, "spoilerbody") || hasClass(n, "spoiler_content"),
      )[0];
    if (spoilerBody) {
      const controls = descendants(
        child,
        (n) =>
          hasClass(n, "spoilerbutton") ||
          hasClass(n, "spoiler_btn") ||
          hasClass(n, "spoilerheader") ||
          hasClass(n, "spoiler_control"),
      );
      const control = controls.find((n) => attr(n, "value") || label(n));
      return [
        {
          kind: "element",
          tag: "details",
          attributes: {},
          children: [
            {
              kind: "element",
              tag: "summary",
              attributes: {},
              children: [
                {
                  kind: "text",
                  text: control
                    ? attr(control, "value") ||
                      label(control) ||
                      "Show hidden content"
                    : "Show hidden content",
                },
              ],
            },
            ...content(spoilerBody, base),
          ],
        },
      ];
    }
    const explicitlyHidden =
      child.attrs.some((attribute) => attribute.name === "hidden") ||
      /(?:^|;)\s*display\s*:\s*none(?:\s*!important)?\s*(?:;|$)/i.test(
        attr(child, "style"),
      ) ||
      /(?:^|;)\s*visibility\s*:\s*hidden(?:\s*!important)?\s*(?:;|$)/i.test(
        attr(child, "style"),
      );
    if (explicitlyHidden)
      return [
        {
          kind: "unsupported",
          description:
            "Additional native content is hidden; view it in the native forum.",
          children: [],
        },
      ];
    if (child.tagName === "ignore_js_op") return content(child, base);
    if (interactive.has(child.tagName))
      return [
        {
          kind: "unsupported",
          description: "Unsupported interactive content",
          children: content(child, base),
        },
      ];
    if (!allowed.has(child.tagName))
      return [
        {
          kind: "unsupported",
          description: `Unsupported formatting (${child.tagName})`,
          children: content(child, base),
        },
      ];
    const attributes: Record<string, string> = {};
    if (
      ["locked", "showhide", "attach_nopermission"].some((name) =>
        hasClass(child, name),
      )
    )
      attributes.class = "permission-notice";
    if (hasClass(child, "quote")) attributes.class = "quote";
    if (hasClass(child, "blockcode")) attributes.class = "code-block";
    const align =
      attr(child, "align") ||
      /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/.exec(
        attr(child, "style"),
      )?.[1];
    if (align && ["left", "right", "center", "justify"].includes(align))
      attributes.style = `text-align:${align}`;
    if (child.tagName === "a") {
      const url = safeURL(attr(child, "href"), base);
      if (url) {
        attributes.href = url;
        attributes.rel = "noopener noreferrer";
      }
    }
    if (child.tagName === "img") {
      const raw =
        ["data-src", "zoomfile", "file", "data-original", "src"]
          .map((key) => attr(child, key))
          .find(Boolean) ?? "";
      const url = safeURL(raw, base);
      if (
        !url ||
        !/\.(?:png|jpe?g|gif|webp|avif|bmp)$/i.test(new URL(url).pathname)
      ) {
        return [
          {
            kind: "unsupported",
            description: "Image or attachment requires native viewing",
            children: [],
          },
        ];
      }
      attributes.src = url;
      attributes.alt = attr(child, "alt");
      attributes.loading = "lazy";
      attributes.referrerpolicy = "no-referrer";
    }
    for (const key of ["colspan", "rowspan"])
      if (/^[1-9]\d?$/.test(attr(child, key)))
        attributes[key] = attr(child, key);
    if (["ltr", "rtl", "auto"].includes(attr(child, "dir")))
      attributes.dir = attr(child, "dir");
    if (attr(child, "title")) attributes.title = attr(child, "title");
    return [
      {
        kind: "element",
        tag: child.tagName,
        attributes,
        children: content(child, base),
      },
    ];
  });
}
export function documentFrom(source: string): Node {
  return parse(source);
}
export function fragmentFrom(source: string): Node {
  return parseFragment(source);
}
