import type {
  Syntax,
  Frame,
  SourceNode,
  TagNode,
  PreservedNode,
  RawNode,
  Literal,
  ParseOptions,
  ImportedSource,
  Issue,
  Span,
  LiteralRange,
  PreservedRange,
  DocumentExport,
} from "./types.js";
import { TableMap } from "prosemirror-tables";
import { Schema, type Node as PMNode, type Slice } from "prosemirror-model";
import {
  parseBBCode,
  inlineTags,
  blockTags,
  referenceTags,
  sourceId,
  defaultArgument,
  attributeValue,
} from "./bbcode.js";

// DOM rendering belongs to the UI adapter. No toDOM/parseDOM or HTML here.
const syntax = { default: null };
const referenceText = (node: PMNode) =>
  `${node.attrs.syntax?.prefix || ""}${node.attrs.syntax?.open || ""}${node.attrs.body || ""}${node.attrs.syntax?.suffix || ""}${node.attrs.syntax?.close || ""}`;
export const editorSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      attrs: { syntax, boundary: { default: "" } },
    },
    text: { group: "inline" },
    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      attrs: { raw: { default: "\n" } },
    },
    empty_format: {
      inline: true,
      group: "inline",
      atom: true,
      attrs: { syntax },
    },
    raw_fragment: {
      inline: true,
      group: "inline",
      atom: true,
      attrs: { raw: {}, id: {}, reason: {}, label: {} },
    },
    reference: {
      inline: true,
      group: "inline",
      atom: true,
      attrs: { syntax, kind: {}, body: { default: "" } },
    },
    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      attrs: { syntax },
    },
    code_block: {
      content: "text*",
      group: "block",
      marks: "",
      code: true,
      defining: true,
      attrs: { syntax },
    },
    section: {
      content: "block+",
      group: "block",
      defining: true,
      attrs: { syntax, kind: {} },
    },
    format_block: {
      content: "block+",
      group: "block",
      defining: true,
      attrs: { syntax, frame: {} },
    },
    bullet_list: { content: "list_item+", group: "block", attrs: { syntax } },
    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: { syntax, order: { default: 1 } },
    },
    list_item: {
      content: "paragraph block*",
      defining: true,
      attrs: { syntax },
    },
    table: {
      content: "table_row+",
      group: "block",
      isolating: true,
      tableRole: "table",
      attrs: { syntax },
    },
    table_row: {
      content: "(table_cell | table_header)+",
      tableRole: "row",
      attrs: { syntax },
    },
    table_cell: {
      content: "block+",
      isolating: true,
      tableRole: "cell",
      attrs: {
        syntax,
        colspan: { default: 1 },
        rowspan: { default: 1 },
        colwidth: { default: null },
      },
    },
    table_header: {
      content: "block+",
      isolating: true,
      tableRole: "header_cell",
      attrs: {
        syntax,
        colspan: { default: 1 },
        rowspan: { default: 1 },
        colwidth: { default: null },
      },
    },
  },
  marks: {
    // An ordered lexical stack represents even repeated b/b or same-style
    // wrappers, which a set of ordinary semantic PM marks cannot preserve.
    format: { attrs: { frames: {} } },
    literal: { attrs: { id: {}, status: { default: "literal" } } },
  },
});

/** Selection-derived plaintext, without decorative renderer labels. Protected
 * and reference leaves retain their data when only text/plain is pasted. */
export function clipboardText(slice: Slice) {
  return slice.content.textBetween(0, slice.content.size, "\n", (node) =>
    ["reference", "empty_format"].includes(node.type.name)
      ? referenceText(node)
      : String(node.attrs.raw || ""),
  );
}

export function newSyntax(
  tag = "",
  open: string | null = null,
  close: string | null = null,
): Syntax {
  // New lists use the current forum dialect; imported lexical syntax is unchanged.
  if (tag === "ul" || tag === "ol") {
    open ??= tag === "ol" ? "[list=1]" : "[list]";
    tag = "list";
  }
  if (tag === "li") {
    tag = "*";
    close ??= "";
  }
  return {
    id: sourceId(),
    tag,
    open: open ?? (tag ? `[${tag}]` : ""),
    close: close ?? (tag ? `[/${tag}]` : ""),
    prefix: "",
    suffix: "",
  };
}
const syntaxOf = (node: TagNode): Syntax => ({
  id: node.id,
  tag: node.name,
  open: node.open,
  close: node.close,
  prefix: "",
  suffix: "",
});

export function importSource(
  source: string,
  options: ParseOptions = {},
): ImportedSource {
  const parsed = parseBBCode(source, options),
    issues: Issue[] = [],
    schema = editorSchema;
  const make = (
    name: keyof typeof schema.nodes,
    attrs: Record<string, unknown> | null,
    children: PMNode[] = [],
  ) => schema.nodes[name]!.createChecked(attrs, children);
  const paragraph = (children: PMNode[]) =>
    make("paragraph", { syntax: newSyntax() }, children);
  function raw(
    node: RawNode | TagNode | (PreservedNode & { raw: string; reason: string }),
    reason = ("reason" in node ? node.reason : undefined) || "unknown-tag",
  ) {
    const value = node.raw ?? parsed.source.slice(node.start, node.end);
    const label =
      reason === "unknown-tag"
        ? `未识别的 ${("name" in node ? node.name : "") || "语法"}`
        : "受保护的原始片段";
    issues.push({
      kind: "protected",
      reason,
      id: node.id,
      from: node.start,
      to: node.end,
      label,
    });
    return make("raw_fragment", {
      raw: value,
      id: node.id || sourceId(),
      reason,
      label,
    });
  }
  function textNodes(
    value: string,
    frames: Frame[] = [],
    literal: Literal | null = null,
  ): PMNode[] {
    const marks = [
      ...(frames.length ? [schema.marks.format.create({ frames })] : []),
      ...(literal ? [schema.marks.literal.create(literal)] : []),
    ];
    return value
      .split(/(\r\n|\r|\n)/)
      .filter(Boolean)
      .map((text) =>
        /^(\r\n|\r|\n)$/.test(text)
          ? schema.nodes.hard_break.create({ raw: text }, null, marks)
          : schema.text(text, marks),
      );
  }
  function inline(node: SourceNode, frames: Frame[] = []): PMNode[] {
    if (node.type === "text")
      return textNodes(node.text, frames, node.literal ?? null);
    const marks = frames.length ? [schema.marks.format.create({ frames })] : [];
    if (node.type === "preserved") return [restore(node).mark(marks)];
    if (node.type === "raw") return [raw(node).mark(marks)];
    if (referenceTags.has(node.name))
      return [
        make("reference", {
          syntax: syntaxOf(node),
          kind: node.name,
          body: parsed.source.slice(
            node.start + node.open.length,
            node.end - node.close.length,
          ),
        }).mark(marks),
      ];
    if (inlineTags.has(node.name)) {
      if (!node.children.length)
        return [make("empty_format", { syntax: syntaxOf(node) }).mark(marks)];
      const frame = { ...syntaxOf(node), value: defaultArgument(node.open) };
      return node.children.flatMap((child) =>
        inline(child, [...frames, frame]),
      );
    }
    return [raw(node).mark(marks)];
  }
  function group(children: SourceNode[]): PMNode[] {
    const result: PMNode[] = [];
    let pending: PMNode[] = [];
    const flush = () => {
      if (pending.length) {
        result.push(paragraph(pending));
        pending = [];
      }
    };
    for (const node of children) {
      if (
        node.type === "preserved" &&
        node.record.node?.type === "code_block"
      ) {
        flush();
        result.push(restore(node));
      } else if (
        node.type === "tag" &&
        inlineTags.has(node.name) &&
        containsBlock(node)
      ) {
        flush();
        result.push(
          make(
            "format_block",
            {
              syntax: syntaxOf(node),
              frame: { tag: node.name, value: defaultArgument(node.open) },
            },
            group(node.children),
          ),
        );
      } else if (node.type === "tag" && blockTags.has(node.name)) {
        flush();
        result.push(block(node));
      } else pending.push(...inline(node));
    }
    flush();
    return result.length ? result : [paragraph([])];
  }
  function containsBlock(node: TagNode): boolean {
    // Recurse only into known inline formatting. An unknown wrapper is an
    // opaque local fragment even if its body happens to contain known tags.
    return node.children?.some(
      (child) =>
        child.type === "tag" &&
        (blockTags.has(child.name) ||
          (inlineTags.has(child.name) && containsBlock(child))),
    );
  }
  function restore(node: PreservedNode): PMNode {
    const record = node.record;
    if (
      record.status !== "ambiguous" &&
      record.node &&
      record.raw === parsed.source.slice(node.start, node.end)
    )
      return schema.nodeFromJSON(record.node);
    return raw({
      ...node,
      raw: parsed.source.slice(node.start, node.end),
      reason: "representation-ambiguous",
    });
  }
  function structuralChildren(node: TagNode, allowed: string[]) {
    const result: { node: TagNode; prefix: string }[] = [];
    let prefix = "";
    for (const child of node.children) {
      if (child.type === "text" && !child.text.trim()) {
        prefix += child.text;
        continue;
      }
      if (child.type !== "tag" || !allowed.includes(child.name)) return null;
      result.push({ node: child, prefix });
      prefix = "";
    }
    return result.length ? { children: result, suffix: prefix } : null;
  }
  function block(node: TagNode): PMNode {
    const lexeme = syntaxOf(node);
    if (node.name === "code")
      return make(
        "code_block",
        { syntax: lexeme },
        node.children[0]?.type === "text" && node.children[0].text
          ? [schema.text(node.children[0].text)]
          : [],
      );
    if (node.name === "quote")
      return make("blockquote", { syntax: lexeme }, group(node.children));
    if (
      [
        "align",
        "left",
        "center",
        "right",
        "indent",
        "hide",
        "spoiler",
        "free",
      ].includes(node.name)
    )
      return make(
        "section",
        { syntax: lexeme, kind: node.name },
        group(node.children),
      );
    if (["ul", "ol", "list"].includes(node.name)) {
      const structure = structuralChildren(node, ["li", "*"]);
      if (!structure) return paragraph([raw(node, "malformed-list")]);
      lexeme.suffix = structure.suffix;
      const items = structure.children.map(({ node: item, prefix }) => {
        const content = group(item.children);
        if (content[0]!.type.name !== "paragraph")
          content.unshift(paragraph([]));
        return make(
          "list_item",
          { syntax: { ...syntaxOf(item), prefix } },
          content,
        );
      });
      return make(
        node.name === "ol" ||
          (node.name === "list" && defaultArgument(node.open))
          ? "ordered_list"
          : "bullet_list",
        { syntax: lexeme },
        items,
      );
    }
    if (node.name === "table") {
      const structure = structuralChildren(node, ["tr"]);
      const cells = structure?.children.map((row) =>
        structuralChildren(row.node, ["td", "th"]),
      );
      if (!structure || !cells || cells.some((row) => !row))
        return paragraph([raw(node, "malformed-table")]);
      const span = (cell: TagNode, name: string) => {
        const argument = defaultArgument(cell.open).split(",");
        const value =
          attributeValue(cell.open, name) ??
          (argument.length >= 2
            ? (argument[name === "colspan" ? 0 : 1] ?? "")
            : null);
        return value === null
          ? 1
          : /^[1-9]\d{0,2}$/.test(value) && Number(value) <= 99
            ? Number(value)
            : null;
      };
      if (
        structure.children.length > 1000 ||
        cells.some(
          (row) =>
            row!.children.some(
              ({ node: cell }) =>
                (defaultArgument(cell.open) !== "" &&
                  !/^(?:\d{1,4}%?|[1-9]\d?,[1-9]\d?(?:,\d{1,4}%?)?)$/.test(
                    defaultArgument(cell.open),
                  )) ||
                span(cell, "colspan") === null ||
                span(cell, "rowspan") === null,
            ) ||
            row!.children.reduce(
              (width, { node: cell }) => width + (span(cell, "colspan") || 0),
              0,
            ) > 256,
        )
      )
        return paragraph([raw(node, "unsupported-table-grid")]);
      lexeme.suffix = structure.suffix;
      const rows = structure.children.map(({ node: row, prefix }, index) =>
        make(
          "table_row",
          {
            syntax: { ...syntaxOf(row), prefix, suffix: cells[index]!.suffix },
          },
          cells[index]!.children.map(({ node: cell, prefix: cellPrefix }) =>
            make(
              cell.name === "th" ? "table_header" : "table_cell",
              {
                syntax: { ...syntaxOf(cell), prefix: cellPrefix },
                colspan: span(cell, "colspan"),
                rowspan: span(cell, "rowspan"),
              },
              group(cell.children),
            ),
          ),
        ),
      );
      const table = make("table", { syntax: lexeme }, rows);
      if (TableMap.get(table).problems?.length)
        return paragraph([raw(node, "unsupported-table-grid")]);
      return table;
    }
    return paragraph([raw(node, "structural-tag-outside-container")]);
  }
  const doc = make("doc", null, group(parsed.tree.children));
  return { doc, issues, source: parsed.source };
}

/** Walk the actual edited PM tree. Only syntax lexemes are reused, never bodies. */
export function exportDocument(doc: PMNode): DocumentExport {
  let source = "";
  const spans: Span[] = [],
    literalRanges: LiteralRange[] = [],
    representationIssues: Issue[] = [],
    preservedRanges: PreservedRange[] = [];
  const emit = (
    value: string,
    pmFrom: number,
    pmTo: number,
    kind: string,
    id: string | null = null,
    literal: Literal | null = null,
  ) => {
    const from = source.length;
    source += value;
    if (value) spans.push({ from, to: source.length, pmFrom, pmTo, kind, id });
    if (literal && value) {
      const previous = literalRanges.at(-1);
      if (previous?.id === literal.id && previous.to === from)
        previous.to = source.length;
      else literalRanges.push({ ...literal, from, to: source.length });
    }
  };
  function content(parent: PMNode, position: number) {
    let active: Frame[] = [];
    const close = (common: number, boundary: number) => {
      for (let i = active.length - 1; i >= common; i--)
        emit(active[i]!.close, boundary, boundary, "close", active[i]!.id);
      active = active.slice(0, common);
    };
    parent.forEach((child, offset) => {
      const at = position + offset,
        frames: Frame[] =
          child.marks.find((mark) => mark.type.name === "format")?.attrs
            .frames || [];
      let common = 0;
      while (
        common < active.length &&
        common < frames.length &&
        active[common]!.id === frames[common]!.id &&
        active[common]!.open === frames[common]!.open
      )
        common++;
      close(common, at);
      for (const frame of frames.slice(common)) {
        emit(frame.open, at, at, "open", frame.id);
        active.push(frame);
      }
      write(child, at);
    });
    close(0, position + parent.content.size);
  }
  function write(node: PMNode, position: number) {
    const kind = node.type.name,
      lexeme: Syntax | null = node.attrs.syntax;
    const literal = node.marks.find((mark) => mark.type.name === "literal")
      ?.attrs as Literal | undefined;
    const from = source.length;
    const reason =
      kind === "code_block" && /\[\/code\]/i.test(node.textContent)
        ? "literal-code-closer"
        : kind === "reference" &&
            new RegExp(`\\[\\/${node.attrs.kind}\\]`, "i").test(node.attrs.body)
          ? "reference-closer"
          : kind === "raw_fragment" &&
              node.attrs.reason === "representation-ambiguous"
            ? "representation-ambiguous"
            : null;
    const retain = () => {
      if (!reason) return;
      const id = lexeme?.id || node.attrs.id,
        status =
          reason === "representation-ambiguous" ? "ambiguous" : "unresolved";
      representationIssues.push({
        kind: "representation-error",
        reason,
        id,
        from,
        to: source.length,
        pmFrom: position,
        pmTo: position + node.nodeSize,
        message:
          "完整输入已保留，但此片段尚无可靠的独立 BBCode 表示；请修改正文或明确按源码解释。",
      });
      // The actual edited node, not its ambiguous standalone export, crosses a
      // source-mode round trip. These records never leave memory or submit.
      preservedRanges.push({
        id,
        from,
        to: source.length,
        raw: source.slice(from),
        status,
        reason,
        node: status === "ambiguous" ? null : node.toJSON(),
      });
    };
    if (kind === "text")
      return emit(
        node.text!,
        position,
        position + node.nodeSize,
        "text",
        null,
        literal ?? null,
      );
    if (kind === "hard_break")
      return emit(
        node.attrs.raw,
        position,
        position + 1,
        "break",
        null,
        literal ?? null,
      );
    if (kind === "raw_fragment") {
      emit(node.attrs.raw, position, position + 1, "raw", node.attrs.id);
      retain();
      return;
    }
    if (kind === "paragraph")
      emit(node.attrs.boundary, position, position, "boundary", lexeme?.id);
    if (lexeme) {
      emit(lexeme.prefix || "", position, position, "trivia", lexeme.id);
      emit(lexeme.open, position, position, "open", lexeme.id);
    }
    if (kind === "reference")
      emit(node.attrs.body, position, position + 1, "reference", lexeme?.id);
    else if (kind !== "empty_format")
      content(node, kind === "doc" ? 0 : position + 1);
    if (lexeme) {
      emit(
        lexeme.suffix || "",
        position + node.nodeSize,
        position + node.nodeSize,
        "trivia",
        lexeme.id,
      );
      emit(
        lexeme.close,
        position + node.nodeSize,
        position + node.nodeSize,
        "close",
        lexeme.id,
      );
    }
    retain();
  }
  write(doc, 0);
  return {
    source,
    spans,
    literalRanges,
    representationIssues,
    preservedRanges,
  };
}
