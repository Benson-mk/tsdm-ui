import { EditorState, TextSelection, Plugin } from 'prosemirror-state';
import { tableEditing } from 'prosemirror-tables';
import { editorSchema, importSource, exportDocument } from './model.js';
import { sourceDisplay, sourceEdit, sourceId, safeSelection } from './bbcode.js';
import { preserveTransaction, exportReadiness, mapLiteralRanges, mapPreservedRanges, sourcePatch, sourcePosition, visualPosition } from './preservation.js';
import { editorCommand } from './commands.js';

// Keep the library's real cell-selection state and view integration. Automatic
// fixTables append transactions and table/HTML paste would change source outside
// the selected operation, so neither is part of this preservation dialect.
const tableSelection = tableEditing();
const { handlePaste: _tablePaste, ...selectionProps } = tableSelection.spec.props;
export const editorTableProps = selectionProps;
// The UI owner installs editorTableProps as a view-only plugin. This core plugin
// owns only the matching vendor state/key, never hand-authored DOM callbacks.
const selectionPlugin = new Plugin({ key: tableSelection.spec.key, state: tableSelection.spec.state });
const createState = doc => EditorState.create({ schema: editorSchema, ...(doc ? { doc } : {}), plugins: [selectionPlugin] });

/** One memory-only source/document/history owner for one composition lifetime. */
export function createEditorSession({ source = '', compositionId = sourceId(), onChange = () => {}, convert = importSource } = {}) {
  source = String(source);
  let pm = createState(), exported = { source, spans: [], literalRanges: [] }, issues = [], mode = 'visual';
  let sourceSelection = { from: 0, to: 0 };
  let sourceVisit = null, visualVisit = null;
  try {
    const imported = convert(source), result = exportDocument(imported.doc);
    if (result.source !== source) throw new Error('Conversion would change source.');
    pm = createState(imported.doc); exported = result; issues = imported.issues;
  } catch { mode = 'source'; issues = [{ kind: 'conversion-error', message: '无法可靠转换；完整源码已保留，可继续编辑。' }]; }
  let revision = 0, disposed = false, composing = false, compositionGroup = null, message = '';
  let locks = { busy: false, session: false }, undo = [], redo = [];
  const interpretation = () => JSON.stringify({ literal: exported.literalRanges.map(({ from, to, status }) => ({ from, to, status })),
    representation: (exported.preservedRanges || []).map(({ from, to, status }) => ({ from, to, status })), failed: issues.some(issue => issue.kind === 'conversion-error') });
  let accepted = { source, interpretation: interpretation() };
  const baselines = new WeakSet();
  function captureBaseline() {
    if (disposed || !readiness().ready) return null;
    const value = Object.freeze({ compositionId, source: exported.source, interpretation: interpretation() });
    baselines.add(value); return value;
  }
  function acceptBaseline(value) {
    if (disposed || !value || !baselines.has(value) || value.compositionId !== compositionId) return false;
    accepted = { source: value.source, interpretation: value.interpretation }; emit(); return true;
  }
  const listeners = new Set();
  const current = () => ({ pm, exported, issues, sourceSelection: { ...sourceSelection } });
  const readiness = () => exportReadiness({ ...exported, issues });
  const snapshot = () => ({ compositionId, revision, source: exported.source, display: sourceDisplay(exported.source).value,
    mode, selection: { ...sourceSelection }, literalRanges: exported.literalRanges.map(range => ({ ...range })),
    representationRanges: (exported.preservedRanges || []).map(({ node, ...range }) => ({ ...range })),
    issues: issues.map(issue => ({ ...issue })), readiness: readiness(), locks: { ...locks },
    dirty: exported.source !== accepted.source || interpretation() !== accepted.interpretation,
    canEdit: !disposed && !locks.busy && !locks.session, canUndo: undo.length > 0, canRedo: redo.length > 0,
    composing, disposed, message });
  const emit = () => { if (!disposed) { onChange(snapshot()); for (const listener of listeners) listener(snapshot()); } };
  const changed = (a, b) => a.exported.source !== b.exported.source || !a.pm.doc.eq(b.pm.doc) ||
    JSON.stringify(a.exported.literalRanges) !== JSON.stringify(b.exported.literalRanges) ||
    JSON.stringify(a.exported.preservedRanges) !== JSON.stringify(b.exported.preservedRanges) || JSON.stringify(a.issues) !== JSON.stringify(b.issues);
  function record(before) {
    const after = current();
    if (!changed(before, after)) return false;
    const patch = sourcePatch(before.exported.source, after.exported.source);
    if (compositionGroup && undo.at(-1)?.group === compositionGroup) { undo.at(-1).after = after; undo.at(-1).patch = sourcePatch(undo.at(-1).before.exported.source, after.exported.source); }
    else undo.push({ before, after, patch, group: compositionGroup });
    redo = []; revision++; return true;
  }
  function applyRaw(nextSource, ranges, selection = sourceSelection, preserved = exported.preservedRanges || []) {
    const before = current();
    visualVisit = null;
    try {
      const next = convert(nextSource, { literalRanges: ranges, preservedRanges: preserved });
      const result = exportDocument(next.doc);
      if (result.source !== nextSource) throw new Error('Conversion would change source.');
      // A new unknown/unclosed enclosing wrapper can protect the whole subtree
      // and hide its literal marks. That is not consent to reinterpret them.
      // Keep the exact retained range visible until an explicit source choice.
      for (const range of ranges) if (!result.literalRanges.some(item => item.id === range.id && item.from <= range.from && item.to >= range.to)) {
        result.literalRanges.push({ ...range, status: 'ambiguous' });
      }
      result.literalRanges.sort((a, b) => a.from - b.from);
      // An enclosing malformed/unknown wrapper can hide a retained range from
      // projection. Keep its unresolved provenance instead of silently clearing
      // readiness merely because that wrapper is now protected as a whole.
      for (const range of preserved) if (!result.preservedRanges.some(item => item.id === range.id)) {
        result.preservedRanges.push({ ...range, node: null, status: 'ambiguous' });
        result.representationIssues.push({ kind: 'representation-error', reason: 'representation-ambiguous', id: range.id,
          from: range.from, to: range.to, message: '此源码编辑影响了尚未解决的内容表示，请明确按源码解释。' });
      }
      pm = createState(next.doc); exported = result; issues = next.issues; message = '';
    } catch {
      // Retain the COMPLETE draft independently of the last usable PM view.
      // A failed conversion cannot be labelled successful or submitted.
      exported = { source: nextSource, literalRanges: ranges, spans: [], preservedRanges: preserved };
      issues = [{ kind: 'conversion-error', message: '无法可靠转换；完整源码已保留，可继续编辑。' }]; mode = 'source';
    }
    sourceSelection = safeSelection(sourceDisplay(nextSource).value, selection.from || 0, selection.to ?? selection.from ?? 0);
    record(before); emit(); return !issues.some(issue => issue.kind === 'conversion-error');
  }
  function dispatch(transaction) {
    if (disposed || ((locks.busy || locks.session) && transaction.docChanged && !composing) || issues.some(issue => issue.kind === 'conversion-error') ||
      (exported.preservedRanges || []).some(range => range.status === 'ambiguous')) return false;
    const before = current();
    try {
      const result = preserveTransaction({ ...pm, schema: pm.schema, doc: pm.doc, source: exported.source }, transaction);
      const next = pm.apply(result.transaction);
      if (result.transaction.docChanged || !next.selection.eq(pm.selection)) visualVisit = null;
      pm = next; exported = { source: result.source, spans: result.spans, literalRanges: result.literalRanges,
        representationIssues: result.representationIssues, preservedRanges: result.preservedRanges };
      const ids = new Set(); pm.doc.descendants(node => { if (node.type.name === 'raw_fragment') ids.add(node.attrs.id); });
      issues = issues.filter(issue => issue.kind !== 'protected' || ids.has(issue.id));
      record(before); message = ''; emit(); return true;
    } catch (error) { message = String(error.message || '无法应用此编辑。'); emit(); return false; }
  }
  function command(name, data = {}) {
    if (disposed || locks.busy || locks.session) return false;
    try { const transaction = editorCommand(pm, name, data); return transaction ? dispatch(transaction) : false; }
    catch (error) { message = String(error.message || '无法应用此编辑。'); emit(); return false; }
  }
  function updateSource(edit) {
    if (disposed || ((locks.busy || locks.session) && !composing)) return false;
    const patch = sourceEdit(exported.source, edit);
    if (patch.unchanged) { if (edit.selection) sourceSelection = safeSelection(sourceDisplay(exported.source).value, edit.selection.from, edit.selection.to); return false; }
    return applyRaw(patch.source, mapLiteralRanges(exported.literalRanges, patch), edit.selection || sourceSelection,
      mapPreservedRanges(exported.preservedRanges || [], patch, patch.source));
  }
  function replaceSource(value) {
    if (disposed || locks.busy || locks.session || value === exported.source) return false;
    const patch = sourcePatch(exported.source, String(value));
    const edit = { from: patch.from, to: patch.to, text: patch.inserted };
    return applyRaw(String(value), mapLiteralRanges(exported.literalRanges, edit), sourceSelection,
      mapPreservedRanges(exported.preservedRanges || [], edit, String(value)));
  }
  function resolveLiteral(id, choice) {
    if (disposed || composing || locks.busy || locks.session) return false;
    const selected = exported.literalRanges.filter(range => range.id === id);
    if (!selected.length || !['literal', 'bbcode', 'code'].includes(choice)) return false;
    const ranges = exported.literalRanges.filter(range => range.id !== id);
    if (choice === 'literal') return applyRaw(exported.source, [...ranges, ...selected.map(range => ({ ...range, status: 'literal' }))]);
    if (choice === 'bbcode') return applyRaw(exported.source, ranges);
    const from = Math.min(...selected.map(range => range.from)), to = Math.max(...selected.map(range => range.to));
    const body = exported.source.slice(from, to);
    if (/\[\/code\]/i.test(body)) { message = '此片段包含代码结束标记；未自动改写，请在源码中明确处理。'; emit(); return false; }
    const text = `[code]${body}[/code]`;
    const next = exported.source.slice(0, from) + text + exported.source.slice(to), edit = { from, to, text };
    return applyRaw(next, mapLiteralRanges(ranges, edit), sourceSelection, mapPreservedRanges(exported.preservedRanges || [], edit, next));
  }
  function resolveRepresentation(id) {
    if (disposed || composing || locks.busy || locks.session || !(exported.preservedRanges || []).some(range => range.id === id)) return false;
    return applyRaw(exported.source, exported.literalRanges, sourceSelection, exported.preservedRanges.filter(range => range.id !== id));
  }
  function travel(direction) {
    if (disposed || composing || locks.busy || locks.session) return false;
    const from = direction === 'undo' ? undo : redo, to = direction === 'undo' ? redo : undo, entry = from.pop();
    if (!entry) return false;
    visualVisit = null;
    const target = direction === 'undo' ? entry.before : entry.after;
    pm = target.pm; exported = target.exported; issues = target.issues; sourceSelection = { ...target.sourceSelection };
    if (issues.some(issue => issue.kind === 'conversion-error') || exported.literalRanges.some(range => range.status === 'ambiguous') ||
      (exported.preservedRanges || []).some(range => range.status === 'ambiguous')) mode = 'source';
    to.push(entry); revision++; message = ''; emit(); return true;
  }
  return {
    get state() { return snapshot(); }, get pmState() { return pm; }, get export() { return { source: exported.source, ...readiness() }; },
    get provenance() { return exported.spans.map(span => ({ ...span })); },
    dispatch, command, updateSource, replaceSource, resolveLiteral, resolveRepresentation,
    captureBaseline, acceptBaseline,
    accept() { return acceptBaseline(captureBaseline()); },
    undo: () => travel('undo'), redo: () => travel('redo'),
    setMode(next) {
      if (disposed || !['source', 'visual'].includes(next) || next === mode) return false;
      if (composing) { message = '请先完成当前输入法组合。'; emit(); return false; }
      if (next === 'visual' && (issues.some(issue => issue.kind === 'conversion-error') || exported.literalRanges.some(range => range.status === 'ambiguous') ||
        (exported.preservedRanges || []).some(range => range.status === 'ambiguous'))) {
        message = '源码已保留；请先明确受影响字面片段的解释。'; emit(); return false;
      }
      const display = sourceDisplay(exported.source);
      if (next === 'visual') {
        if (sourceVisit?.doc === pm.doc && sourceVisit.source === exported.source &&
          sourceVisit.selection.from === sourceSelection.from && sourceVisit.selection.to === sourceSelection.to) {
          // An unchanged source visit must not turn a node/cell selection into a
          // text selection merely because textarea ranges have no such type.
          const restored = sourceVisit.bookmark.resolve(pm.doc);
          if (!pm.selection.eq(restored)) pm = pm.apply(pm.tr.setSelection(restored));
        } else {
          const from = sourcePosition(exported.spans, display.offsets[sourceSelection.from] ?? exported.source.length, -1);
          const to = sourcePosition(exported.spans, display.offsets[sourceSelection.to] ?? exported.source.length, 1);
          const start = TextSelection.near(pm.doc.resolve(Math.max(0, Math.min(pm.doc.content.size, from))));
          const end = TextSelection.near(pm.doc.resolve(Math.max(0, Math.min(pm.doc.content.size, to))));
          pm = pm.apply(pm.tr.setSelection(TextSelection.create(pm.doc, start.from, end.to)));
        }
        // Projection is many-to-one at paragraph boundaries and inside BBCode.
        // Retain exact textarea offsets only for this unchanged rich visit.
        visualVisit = { doc: pm.doc, source: exported.source, selection: pm.selection, sourceSelection: { ...sourceSelection } };
        sourceVisit = null;
      } else {
        if (visualVisit?.doc === pm.doc && visualVisit.source === exported.source && visualVisit.selection.eq(pm.selection)) {
          sourceSelection = { ...visualVisit.sourceSelection };
        } else {
          const rawFrom = visualPosition(exported.spans, pm.selection.from, -1), rawTo = visualPosition(exported.spans, pm.selection.to, 1);
          const offset = raw => { const index = display.offsets.findIndex(value => value >= raw); return index < 0 ? display.value.length : index; };
          sourceSelection = { from: offset(rawFrom), to: offset(rawTo) };
        }
        visualVisit = null;
        sourceVisit = { doc: pm.doc, source: exported.source, bookmark: pm.selection.getBookmark(), selection: { ...sourceSelection } };
      }
      mode = next; message = ''; emit(); return true;
    },
    setSourceSelection(from, to = from) {
      const text = sourceDisplay(exported.source).value;
      sourceSelection = safeSelection(text, from, to);
    },
    setVisualSelection(from, to = from) {
      if (disposed) return false;
      return dispatch(pm.tr.setSelection(TextSelection.create(pm.doc, from, to)));
    },
    setComposing(value) {
      if (disposed || composing === Boolean(value)) return;
      if (value && (locks.busy || locks.session)) return;
      composing = Boolean(value); compositionGroup = composing ? sourceId() : null; emit();
    },
    setLocks(next) {
      const value = { ...locks, ...next };
      if (disposed || JSON.stringify(value) === JSON.stringify(locks)) return;
      locks = value; emit();
    },
    subscribe(listener) { if (disposed) return () => {}; listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { if (disposed) return; disposed = true; undo = []; redo = []; listeners.clear(); sourceVisit = null; visualVisit = null; sourceSelection = { from: 0, to: 0 };
      exported = { source: '', spans: [], literalRanges: [] }; issues = []; pm = createState(); },
  };
}
