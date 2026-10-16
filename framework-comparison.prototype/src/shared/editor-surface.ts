import {
  EditorView,
  type NodeViewConstructor,
  type MarkViewConstructor,
} from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { editorTableProps } from "./editor-snapshot/session.js";
import type { Harness } from "./harness";

// Deliberately small fixture renderer, not the experiment's production editor UI.
function renderers(doc: Document) {
  const nodeViews: Record<string, NodeViewConstructor> = {};
  const tags: Record<string, string> = {
    paragraph: "p",
    blockquote: "blockquote",
    code_block: "pre",
    section: "section",
    format_block: "div",
    bullet_list: "ul",
    ordered_list: "ol",
    list_item: "li",
    table: "table",
    table_row: "tr",
    table_cell: "td",
    table_header: "th",
  };
  for (const [kind, tag] of Object.entries(tags))
    nodeViews[kind] = (node) => {
      const dom = doc.createElement(tag);
      if (kind === "table_cell" || kind === "table_header") {
        dom.setAttribute("colspan", String(node.attrs.colspan));
        dom.setAttribute("rowspan", String(node.attrs.rowspan));
      }
      if (kind === "table") {
        const tbody = doc.createElement("tbody");
        dom.append(tbody);
        return { dom, contentDOM: tbody };
      }
      return { dom, contentDOM: dom };
    };
  nodeViews.hard_break = () => ({ dom: doc.createElement("br") });
  for (const kind of ["raw_fragment", "reference", "empty_format"])
    nodeViews[kind] = (node) => {
      const dom = doc.createElement("span");
      dom.className = "opaque";
      dom.contentEditable = "false";
      dom.textContent =
        kind === "raw_fragment"
          ? node.attrs.raw
          : kind === "reference"
            ? `[${node.attrs.kind}: ${node.attrs.body}]`
            : "∅";
      return { dom };
    };
  const format: MarkViewConstructor = (mark) => {
    const root = doc.createElement("span");
    let content = root;
    const tags: Record<string, string> = {
      b: "strong",
      i: "em",
      u: "u",
      s: "s",
      strike: "s",
      sub: "sub",
      sup: "sup",
    };
    for (const frame of mark.attrs.frames) {
      const child = doc.createElement(tags[frame.tag] || "span");
      content.append(child);
      content = child;
    }
    return { dom: root, contentDOM: content };
  };
  return {
    nodeViews,
    markViews: {
      format,
      literal: () => {
        const dom = doc.createElement("span");
        return { dom, contentDOM: dom };
      },
    },
  };
}

export function mountEditor(container: HTMLElement, harness: Harness) {
  const session = harness.session;
  let compositionTimer: ReturnType<typeof setTimeout> | undefined;
  const view = new EditorView(container, {
    state: session.pmState,
    ...renderers(container.ownerDocument),
    attributes: {
      role: "textbox",
      "aria-label": "Visual writing",
      "aria-multiline": "true",
    },
    plugins: [
      keymap({
        "Mod-z": () => {
          session.undo();
          return true;
        },
        "Shift-Mod-z": () => {
          session.redo();
          return true;
        },
      }),
      keymap(baseKeymap),
    ],
    ...editorTableProps,
    dispatchTransaction: (transaction) => {
      session.dispatch(transaction);
    },
    handleDOMEvents: {
      compositionstart: () => {
        clearTimeout(compositionTimer);
        session.setComposing(true);
        return false;
      },
      compositionend: () => {
        compositionTimer = setTimeout(() => session.setComposing(false), 30);
        return false;
      },
    },
    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData("text/plain");
      if (text == null) return false;
      event.preventDefault();
      session.command("paste", { text });
      return true;
    },
  });
  const unsubscribe = session.subscribe(() => {
    if (view.state !== session.pmState) view.updateState(session.pmState);
  });
  harness.mounted();
  return () => {
    clearTimeout(compositionTimer);
    unsubscribe();
    view.destroy();
    harness.unmounted();
  };
}
