import { Fragment, Slice } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { wrapIn, lift } from 'prosemirror-commands';
import { wrapInList, splitListItem, sinkListItem, liftListItem } from 'prosemirror-schema-list';
import { addRowAfter, addRowBefore, deleteRow, addColumnAfter, addColumnBefore, deleteColumn, deleteTable, mergeCells, splitCell, CellSelection, goToNextCell, selectionCell, TableMap } from 'prosemirror-tables';
import { inlineTags, setAttribute, sourceId } from './bbcode.js';
import { newSyntax, clipboardText } from './model.js';
import { resemblesBBCode } from './preservation.js';

function run(state, command) { let result = null; command(state, tr => { result = tr; }); return result; }
function wrapArgument(tag, value) {
  if (value == null || value === '') return `[${tag}]`;
  if (/[\[\]"\r\n]/.test(String(value))) throw new Error('This attribute cannot be represented safely.');
  return `[${tag}="${value}"]`;
}

function formatArgument(open, value) {
  const pattern = /^(\[[^\s=\]]+\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/;
  if (pattern.test(open)) return open.replace(pattern, (all, prefix, double, single) =>
    prefix + (double !== undefined ? `"${value}"` : single !== undefined && !value.includes("'") ? `'${value}'` :
      !/[\s"']/.test(value) && single === undefined ? value : `"${value}"`));
  return open.replace(/^(\[[^\s=\]]+)/, (_, prefix) => `${prefix}="${value}"`);
}

function format(state, { tag, value, remove = false }) {
  if (!inlineTags.has(tag)) throw new Error('Unsupported format.');
  const tr = state.tr, { from, to, empty } = state.selection, type = state.schema.marks.format;
  const argument = String(value ?? '');
  const opening = wrapArgument(tag, argument); // Validate even when reusing lexical syntax.
  const matches = item => item.tag === tag || (['s', 'strike'].includes(tag) && ['s', 'strike'].includes(item.tag));
  const change = marks => {
    const current = marks.find(mark => mark.type === type)?.attrs.frames || [];
    const index = current.findLastIndex(matches);
    const frames = remove ? current.filter(item => !matches(item)) : index < 0
      ? [...current, { ...newSyntax(tag, opening), value: argument }]
      : current.map((item, at) => at !== index || value === undefined || item.value === argument ? item :
        { ...item, open: formatArgument(item.open, argument), value: argument });
    return frames.length ? type.create({ frames }) : null;
  };
  if (empty) {
    const marks = state.storedMarks || state.selection.$from.marks(), next = change(marks);
    return tr.setStoredMarks([...marks.filter(mark => mark.type !== type), ...(next ? [next] : [])]);
  }
  state.doc.nodesBetween(from, to, (node, position) => {
    if (!node.isInline) return;
    const start = Math.max(from, position), end = Math.min(to, position + node.nodeSize), next = change(node.marks);
    if (end <= start) return;
    tr.removeMark(start, end, type); if (next) tr.addMark(start, end, next);
  });
  return tr;
}

function paste(state, text) {
  text = String(text);
  const parent = state.selection.$from.parent;
  if (parent.type.name === 'code_block') return state.tr.insertText(text);
  // Plain replacement does not retain the formatting of selected content.
  // A collapsed insertion may use the user's active typing format.
  const marks = (state.selection.empty ? state.storedMarks || state.selection.$from.marks() : []).filter(mark => mark.type.name !== 'literal');
  if (resemblesBBCode(text)) marks.push(state.schema.marks.literal.create({ id: sourceId(), status: 'literal' }));
  const content = text.split(/(\r\n|\r|\n)/).filter(Boolean).map(part => /^(\r\n|\r|\n)$/.test(part)
    ? state.schema.nodes.hard_break.create({ raw: part }, null, marks) : state.schema.text(part, marks));
  return state.tr.replaceSelection(new Slice(Fragment.fromArray(content), 0, 0));
}

function table(state, { rows = 2, columns = 2 } = {}) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1 || rows > 20 || columns > 20) throw new Error('Choose 1–20 rows and columns.');
  const n = state.schema.nodes;
  const body = Array.from({ length: rows }, () => n.table_row.create({ syntax: newSyntax('tr') }, Array.from({ length: columns }, () =>
    n.table_cell.create({ syntax: newSyntax('td') }, n.paragraph.create({ syntax: newSyntax() })))));
  return state.tr.replaceSelectionWith(n.table.create({ syntax: newSyntax('table') }, body));
}

function convertTextBlock(state, toCode) {
  const replacements = [], schema = state.schema;
  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, position, parent, index) => {
    if (!node.isTextblock || node.type.name === (toCode ? 'code_block' : 'paragraph')) return;
    const text = clipboardText(new Slice(node.content, 0, 0)), syntax = newSyntax(toCode ? 'code' : '');
    // The block's own leading delimiter/trivia may change with its format;
    // an established paragraph boundary remains outside the new code wrapper.
    syntax.prefix = node.attrs.boundary || node.attrs.syntax?.prefix || '';
    let next;
    if (toCode) next = schema.nodes.code_block.create({ syntax }, text ? schema.text(text) : null);
    else {
      const marks = resemblesBBCode(text) ? [schema.marks.literal.create({ id: sourceId(), status: 'literal' })] : [];
      const content = text.split(/(\r\n|\r|\n)/).filter(Boolean).map(part => /^(\r\n|\r|\n)$/.test(part)
        ? schema.nodes.hard_break.create({ raw: part }, null, marks) : schema.text(part, marks));
      next = schema.nodes.paragraph.create({ syntax }, content);
    }
    let replacement = Fragment.from(next);
    if (!parent.canReplace(index, index + 1, replacement) && toCode && parent.type.name === 'list_item' && index === 0)
      replacement = Fragment.fromArray([schema.nodes.paragraph.create({ syntax: newSyntax() }), next]);
    if (parent.canReplace(index, index + 1, replacement)) replacements.push({ position, size: node.nodeSize, replacement });
    return false;
  });
  if (!replacements.length) return null;
  const tr = state.tr;
  for (const item of replacements.reverse()) tr.replaceWith(item.position, item.position + item.size, item.replacement);
  return tr;
}

export function editorCommand(state, name, data = {}) {
  const n = state.schema.nodes;
  if (name === 'format') return format(state, data);
  if (name === 'paste') return paste(state, data.text);
  if (name === 'emoticon') {
    if (!/^\{:\d{1,3}_\d{1,5}:\}$/.test(String(data.code))) throw new Error('Choose a valid emoticon token.');
    return paste(state, data.code);
  }
  if (name === 'quote') return run(state, wrapIn(n.blockquote, { syntax: newSyntax('quote', wrapArgument('quote', data.author)) }));
  if (name === 'code') return convertTextBlock(state, true);
  if (name === 'paragraph') return convertTextBlock(state, false);
  if (name === 'section') {
    if (!['align', 'left', 'center', 'right', 'hide', 'spoiler', 'free'].includes(data.kind)) throw new Error('Unsupported section.');
    return run(state, wrapIn(n.section, { kind: data.kind, syntax: newSyntax(data.kind, wrapArgument(data.kind, data.value)) }));
  }
  if (name === 'list') return run(state, wrapInList(data.ordered ? n.ordered_list : n.bullet_list, { syntax: newSyntax(data.ordered ? 'ol' : 'ul') }));
  if (name === 'listSplit') return run(state, splitListItem(n.list_item));
  if (name === 'listIndent') return run(state, sinkListItem(n.list_item));
  if (name === 'listOutdent') return run(state, liftListItem(n.list_item));
  if (name === 'lift') return run(state, lift);
  if (name === 'table') return table(state, data);
  if (name === 'tableSelect') {
    let anchor = data.anchor == null ? selectionCell(state) : state.doc.resolve(data.anchor);
    let head = data.head == null ? anchor : state.doc.resolve(data.head);
    if (data.kind === 'table') {
      const table = anchor.node(-1), map = TableMap.get(table), start = anchor.start(-1);
      anchor = state.doc.resolve(start + map.map[0]); head = state.doc.resolve(start + map.map.at(-1));
    }
    const selection = data.kind === 'row' ? CellSelection.rowSelection(anchor, head)
      : data.kind === 'column' ? CellSelection.colSelection(anchor, head) : new CellSelection(anchor, head);
    return state.tr.setSelection(selection);
  }
  if (name === 'nextCell') return run(state, goToNextCell(data.direction === -1 ? -1 : 1));
  const tableCommands = { rowAfter: addRowAfter, rowBefore: addRowBefore, rowDelete: deleteRow, columnAfter: addColumnAfter,
    columnBefore: addColumnBefore, columnDelete: deleteColumn, tableDelete: deleteTable, mergeCells, splitCell };
  if (tableCommands[name]) return run(state, tableCommands[name]);
  if (name === 'attribute') {
    const node = state.doc.nodeAt(data.position);
    if (!node?.attrs.syntax) throw new Error('Select an editable structure.');
    const syntax = { ...node.attrs.syntax, open: setAttribute(node.attrs.syntax.open, data.name, data.value) };
    const attrs = { ...node.attrs, syntax };
    if (['colspan', 'rowspan'].includes(data.name.toLowerCase()) && ['table_cell', 'table_header'].includes(node.type.name)) {
      if (!/^[1-9]\d{0,2}$/.test(String(data.value)) || Number(data.value) > 100) throw new Error('Unsupported table span.');
      attrs[data.name.toLowerCase()] = Number(data.value);
    }
    return state.tr.setNodeMarkup(data.position, undefined, attrs);
  }
  if (name === 'reference') {
    const existing = data.position != null ? state.doc.nodeAt(data.position) : null;
    const editing = existing?.type === n.reference && data.replace !== true;
    const kind = editing ? existing.attrs.kind : data.kind;
    if (!['img', 'attach', 'attachimg', 'mention', '@', 'smilie'].includes(kind)) throw new Error('Unsupported reference.');
    let open = editing ? existing.attrs.syntax.open : `[${kind}]`;
    if (kind === 'img' && (data.width || data.height)) {
      if (![data.width, data.height].every(value => /^[1-9]\d{0,4}$/.test(String(value)))) throw new Error('Image dimensions must be positive integers.');
      if (editing && !/^\[[^\s=\]]+\s*=/.test(open)) {
        open = setAttribute(setAttribute(open, 'width', data.width), 'height', data.height);
      } else if (editing) {
        open = open.replace(/^(\[[^\s=\]]+\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/, (all, prefix, double, single) =>
          prefix + (double !== undefined ? `"${data.width},${data.height}"` : single !== undefined ? `'${data.width},${data.height}'` : `${data.width},${data.height}`));
      } else open = `[img=${data.width},${data.height}]`;
    }
    for (const [key, value] of Object.entries(data.attributes || {})) open = setAttribute(open, key, value);
    const node = n.reference.create({ kind, syntax: editing ? { ...existing.attrs.syntax, open } : newSyntax(kind, open),
      body: data.body === undefined && editing ? existing.attrs.body : String(data.body || '') }, null, editing ? existing.marks : null);
    if (data.position != null && state.doc.nodeAt(data.position)?.type === n.reference)
      return state.tr.replaceWith(data.position, data.position + 1, node);
    return state.tr.replaceSelectionWith(node);
  }
  if (name === 'deleteSelection') return state.tr.deleteSelection();
  if (name === 'selection') return state.tr.setSelection(TextSelection.create(state.doc, data.from, data.to ?? data.from));
  throw new Error('Unknown editor command.');
}
