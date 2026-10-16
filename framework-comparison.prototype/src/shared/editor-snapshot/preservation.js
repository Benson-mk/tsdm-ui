import { sourceId, safeBoundary, attributeValue, setAttribute } from './bbcode.js';
import { exportDocument, newSyntax } from './model.js';

const tags = { paragraph: '', blockquote: 'quote', code_block: 'code', bullet_list: 'ul', ordered_list: 'ol', list_item: 'li',
  table: 'table', table_row: 'tr', table_cell: 'td', table_header: 'th' };
export const resemblesBBCode = text => /\[\/?[a-z@*][\w:-]*(?:[=\s\]])/i.test(text);

/** Complete source patches are independently inspectable and invertible. */
export function sourcePatch(before, after) {
  if (before === after) return null;
  let from = 0, tail = 0;
  while (from < before.length && from < after.length && before[from] === after[from]) from++;
  from = Math.min(safeBoundary(before, from), safeBoundary(after, from));
  while (tail < before.length - from && tail < after.length - from && before.at(-1 - tail) === after.at(-1 - tail)) tail++;
  const to = safeBoundary(before, before.length - tail, 1);
  tail = before.length - to;
  return { from, to, removed: before.slice(from, to), inserted: after.slice(from, after.length - tail) };
}

/**
 * Syntax follows actual PM steps and positions, not matching text. Native split
 * and table commands may copy attrs; retain the original ID only at its mapped
 * original position, assigning new provenance to newly created structure.
 */
export function preserveTransaction(previous, transaction, { literalInput = true } = {}) {
  if (!transaction.before.eq(previous.doc)) throw new Error('Stale editor transaction.');
  const original = new Map();
  previous.doc.descendants((node, position, parent) => {
    if (node.attrs.syntax?.id) {
      const index = previous.doc.resolve(position).index();
      original.set(node.attrs.syntax.id, { node, position: transaction.mapping.map(position, 1), parent: parent.attrs.syntax?.id || 'document',
        previous: index ? parent.child(index - 1).attrs.syntax?.id : null });
    }
  });
  const seen = new Set(), updates = [];
  const occurrences = new Map();
  transaction.doc.descendants(node => { const id = node.attrs.syntax?.id; if (id) occurrences.set(id, (occurrences.get(id) || 0) + 1); });
  transaction.doc.descendants((node, position, parent) => {
    if (node.isText || node.type.name === 'hard_break') {
      if (literalInput && node.isText && parent.type.name !== 'code_block' && resemblesBBCode(node.text) && !node.marks.some(mark => mark.type.name === 'literal'))
        updates.push({ literal: true, from: position, to: position + node.nodeSize });
      return;
    }
    if (!Object.hasOwn(node.attrs, 'syntax')) return;
    const old = node.attrs.syntax, mapped = old && original.get(old.id);
    let lexical = old;
    if (!old) lexical = newSyntax(tags[node.type.name] ?? node.attrs.kind ?? '');
    else if (seen.has(old.id) || (mapped && mapped.position !== position)) lexical = { ...old, id: sourceId() };
    seen.add(lexical.id);
    const attrs = { ...node.attrs, syntax: lexical };
    if (node.type.name === 'paragraph' && old && mapped && mapped.position !== position && occurrences.get(old.id) > 1 &&
      (!parent.attrs.syntax?.id || occurrences.get(parent.attrs.syntax.id) === 1)) attrs.boundary = '\n';
    // Native merge/move commands can put two previously separate paragraphs
    // next to each other. That new visible block boundary needs a source line
    // break; provenance movement alone is not a reason to add one.
    if (transaction.docChanged && node.type.name === 'paragraph' && !attrs.boundary) {
      const resolved = transaction.doc.resolve(position), index = resolved.index();
      const preceding = index > 0 ? resolved.parent.child(index - 1) : null;
      if (preceding?.type.name === 'paragraph' && (!mapped || mapped.previous !== preceding.attrs.syntax?.id ||
        mapped.parent !== (parent.attrs.syntax?.id || 'document'))) attrs.boundary = '\n';
    }
    if (['table_cell', 'table_header'].includes(node.type.name)) {
      for (const field of ['colspan', 'rowspan']) {
        const value = node.attrs[field];
        if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error('Unsupported table span.');
        const raw = attributeValue(lexical.open, field);
        if (value !== (raw === null ? 1 : Number(raw))) lexical = { ...lexical, open: setAttribute(lexical.open, field, value) };
      }
      attrs.syntax = lexical;
    }
    if (JSON.stringify(attrs) !== JSON.stringify(node.attrs)) updates.push({ position, attrs });
  });
  for (const update of updates) {
    if (update.literal) transaction.addMark(update.from, update.to, previous.schema.marks.literal.create({ id: sourceId(), status: 'literal' }));
    else transaction.setNodeMarkup(update.position, undefined, update.attrs);
  }
  transaction.doc.check();
  const exported = exportDocument(transaction.doc);
  return { transaction, ...exported, patch: sourcePatch(previous.source, exported.source) };
}

/** Conservative representation readiness, independent of transport permission. */
export function exportReadiness({ source, literalRanges = [], representationIssues = [], issues = [] }) {
  const blockers = literalRanges.filter(range => range.status === 'ambiguous' || resemblesBBCode(source.slice(range.from, range.to)))
    .map(range => ({ kind: range.status === 'ambiguous' ? 'ambiguous-literal' : 'literal-representation', id: range.id, from: range.from, to: range.to,
      message: '字面方括号已保留；尚未确定可独立提交的 BBCode 表示。请选择按源码解释或明确转换为代码。' }));
  for (const issue of issues) if (issue.kind === 'conversion-error') blockers.push(issue);
  blockers.push(...representationIssues);
  return { ready: blockers.length === 0, blockers };
}

export function sourcePosition(spans, sourceOffset, bias = 1) {
  const span = spans.find(item => sourceOffset >= item.from && sourceOffset < item.to) || spans.at(-1);
  if (!span) return 1;
  if (span.kind === 'text') return span.pmFrom + Math.min(span.pmTo - span.pmFrom, sourceOffset - span.from);
  return bias < 0 ? span.pmFrom : span.pmTo;
}

export function visualPosition(spans, pmOffset, bias = 1) {
  const candidates = spans.filter(span => span.pmFrom <= pmOffset && span.pmTo >= pmOffset && ['text', 'break', 'raw', 'reference'].includes(span.kind));
  const span = bias < 0 ? candidates[0] : candidates.at(-1);
  if (!span) return spans.at(-1)?.to || 0;
  if (span.kind === 'text') return span.from + Math.min(span.to - span.from, pmOffset - span.pmFrom);
  return bias < 0 ? span.from : span.to;
}

export function mapLiteralRanges(ranges, edit) {
  const delta = edit.text.length - (edit.to - edit.from);
  return ranges.flatMap(range => {
    if (range.to <= edit.from) return [{ ...range }];
    // A zero-width insertion at the opening boundary is before the retained
    // literal; only edits strictly inside or replacing it change interpretation.
    if (range.from >= edit.to) return [{ ...range, from: range.from + delta, to: range.to + delta }];
    const from = Math.min(range.from, edit.from), to = Math.max(edit.from + edit.text.length, range.to + delta);
    return to > from ? [{ ...range, from, to, status: 'ambiguous' }] : [];
  });
}

/** Unrelated edits carry the actual unrepresentable node; overlapping edits
 * retain a visible unresolved range until a deliberate interpretation choice. */
export function mapPreservedRanges(ranges, edit, source) {
  const delta = edit.text.length - (edit.to - edit.from);
  return ranges.flatMap(range => {
    if (range.to <= edit.from) return [{ ...range }];
    if (range.from >= edit.to) return [{ ...range, from: range.from + delta, to: range.to + delta }];
    const from = Math.min(range.from, edit.from), to = Math.max(edit.from + edit.text.length, range.to + delta);
    return to > from ? [{ ...range, from, to, raw: source.slice(from, to), node: null, status: 'ambiguous' }] : [];
  });
}
