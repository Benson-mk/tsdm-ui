import type { Node as PMNode, Mark } from "prosemirror-model";
import type { NodeView, MarkView } from "prosemirror-view";

// Every source-derived value is inert text or a bounded CSS value. References
// deliberately do not create URL-loading elements in a composition surface.
export function editorNode(
  node: PMNode,
  labels: { hide: string; spoiler: string } = {
    hide: "Reply-to-view hidden block",
    spoiler: "Spoiler",
  },
): NodeView {
  const names: Record<string, string> = {
    paragraph: "p",
    hard_break: "br",
    blockquote: "blockquote",
    code_block: "pre",
    bullet_list: "ul",
    ordered_list: "ol",
    list_item: "li",
    table: "table",
    table_row: "tr",
    table_cell: "td",
    table_header: "th",
    section: "div",
    format_block: "div",
  };
  const dom = document.createElement(names[node.type.name] ?? "span");
  if (
    node.type.name === "raw_fragment" ||
    node.type.name === "reference" ||
    node.type.name === "empty_format"
  ) {
    dom.contentEditable = "false";
    dom.className = "editor-protected";
    dom.textContent =
      node.type.name === "raw_fragment"
        ? String(node.attrs.raw)
        : node.type.name === "reference"
          ? `${node.attrs.syntax.open}${node.attrs.body}${node.attrs.syntax.close}`
          : `${node.attrs.syntax.open}${node.attrs.syntax.close}`;
    return { dom };
  }
  if (["table_cell", "table_header"].includes(node.type.name)) {
    dom.setAttribute("colspan", String(node.attrs.colspan));
    dom.setAttribute("rowspan", String(node.attrs.rowspan));
  }
  if (node.type.name === "hard_break") return { dom };
  if (node.type.name === "format_block") applyFrames(dom, [node.attrs.frame]);
  if (node.type.name === "section") {
    if (node.attrs.kind === "hide" || node.attrs.kind === "spoiler") {
      const kind: "hide" | "spoiler" = node.attrs.kind;
      dom.dataset.editorSection = kind;
      const title =
        /^\[spoiler\s*=\s*(.*?)\]$/i.exec(node.attrs.syntax?.open ?? "")?.[1] ??
        "";
      dom.dataset.editorTitle = title;
      dom.dataset.editorLabel = labels[kind] + (title ? `: ${title}` : "");
      dom.setAttribute("role", "group");
      dom.setAttribute("aria-label", dom.dataset.editorLabel);
    }
    const match = /\[align\s*=\s*["']?(left|center|right|justify)/i.exec(
      node.attrs.syntax?.open ?? "",
    );
    const alignment = match?.[1] ?? node.attrs.kind;
    if (alignment === "indent") dom.style.marginInlineStart = "2em";
    if (["left", "center", "right", "justify"].includes(alignment))
      dom.style.textAlign = alignment;
  }
  if (node.type.name === "blockquote") {
    const author = /^\[quote\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]]+))/i.exec(
      node.attrs.syntax?.open ?? "",
    );
    if (author)
      dom.setAttribute("aria-label", author[1] ?? author[2] ?? author[3] ?? "");
  }
  return {
    dom,
    contentDOM: dom,
    ignoreMutation(mutation) {
      // Localized labels are presentation only. Re-parsing them replaces the
      // editable subtree and moves the browser caret; content stays observed.
      return (
        node.type.name === "section" &&
        (node.attrs.kind === "hide" || node.attrs.kind === "spoiler") &&
        mutation.type === "attributes" &&
        mutation.target === dom &&
        (mutation.attributeName === "data-editor-label" ||
          mutation.attributeName === "aria-label")
      );
    },
  };
}
interface Frame {
  tag: string;
  value?: string;
}
function applyFrames(dom: HTMLElement, frames: Frame[]) {
  for (const { tag, value = "" } of frames) {
    if (tag === "b") dom.style.fontWeight = "bold";
    if (tag === "i") dom.style.fontStyle = "italic";
    if (tag === "u") dom.style.textDecorationLine += " underline";
    if (tag === "s" || tag === "strike")
      dom.style.textDecorationLine += " line-through";
    if (tag === "sub" || tag === "sup")
      dom.style.verticalAlign = tag === "sup" ? "super" : "sub";
    if (tag === "color" && /^(?:#[0-9a-f]{3,8}|[a-z]{1,20})$/i.test(value))
      dom.style.color = value;
    if (tag === "font" && /^[\w\s,'"\-一-鿿]{1,80}$/u.test(value))
      dom.style.fontFamily = value;
    if (tag === "size") {
      const size =
        (
          { 1: 11, 2: 14, 3: 17, 4: 19, 5: 25, 6: 33, 7: 49 } as Record<
            string,
            number
          >
        )[value] ?? (/^\d{1,2}px$/.test(value) ? Number.parseInt(value) : 0);
      if (size >= 8 && size <= 72)
        dom.style.fontSize = `calc(${size}px * var(--text-scale, 1))`;
    }
    if (tag === "url" || tag === "email") {
      dom.style.textDecorationLine = "underline";
      dom.title = value;
    }
  }
}
export function editorMark(mark: Mark): MarkView {
  const dom = document.createElement("span");
  if (mark.type.name === "format") applyFrames(dom, mark.attrs.frames);
  else dom.className = "editor-literal";
  return { dom, contentDOM: dom };
}
