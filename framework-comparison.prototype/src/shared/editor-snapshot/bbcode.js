// A local editing dialect, not a statement of server acceptance. Source tokens
// are data: this module never parses HTML, fetches a URL, or normalizes input.
export const inlineTags = new Set(['b', 'i', 'u', 's', 'strike', 'color', 'size', 'font', 'url', 'email', 'sub', 'sup']);
export const blockTags = new Set(['quote', 'code', 'ul', 'ol', 'list', 'li', '*', 'table', 'tr', 'td', 'th', 'align', 'left', 'center', 'right', 'hide', 'spoiler', 'free']);
export const referenceTags = new Set(['img', 'attach', 'attachimg', 'mention', '@', 'smilie']);
let sequence = 0;
export const sourceId = () => `s${++sequence}`;

function tokenAt(source, start) {
  if (source[start] !== '[') return null;
  let i = start + 1, closing = false, quote = '';
  if (source[i] === '/') { closing = true; i++; }
  const name = /^[a-z@*][\w:-]*/i.exec(source.slice(i));
  if (!name) return null;
  i += name[0].length;
  if (!/[\s=\]]/.test(source[i] || '')) return null;
  const attributes = i;
  for (; i < source.length; i++) {
    const char = source[i];
    if (quote) { if (char === quote) quote = ''; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === ']') return { start, end: i + 1, name: name[0].toLowerCase(), closing,
      raw: source.slice(start, i + 1), argument: source.slice(attributes, i) };
  }
  return { start, end: source.length, invalid: true, name: name[0].toLowerCase(), raw: source.slice(start) };
}

/** Lossless, iterative parsing. Limits shield complete fragments, never trim. */
export function parseBBCode(input, { literalRanges = [], preservedRanges = [] } = {}) {
  const source = String(input), root = { type: 'root', children: [], start: 0, end: source.length }, stack = [root], issues = [];
  const ranges = [...literalRanges].sort((a, b) => a.from - b.from);
  const preserved = [...preservedRanges].sort((a, b) => a.from - b.from);
  let rangeIndex = 0, preservedIndex = 0, at = 0, textStart = 0;
  const append = node => stack.at(-1).children.push(node);
  const text = (from, to, literal = null) => { if (to > from) append({ type: 'text', text: source.slice(from, to), start: from, end: to, literal }); };
  while (at < source.length) {
    while (preserved[preservedIndex]?.to <= at) preservedIndex++;
    const retained = preserved[preservedIndex];
    if (retained && at === retained.from) {
      text(textStart, at); append({ type: 'preserved', record: retained, start: at, end: retained.to, id: retained.id });
      at = retained.to; textStart = at; continue;
    }
    while (ranges[rangeIndex]?.to <= at) rangeIndex++;
    const literal = ranges[rangeIndex];
    if (literal && at === literal.from) {
      text(textStart, at); text(at, literal.to, { id: literal.id, status: literal.status || 'literal' });
      at = literal.to; textStart = at; continue;
    }
    if (source[at] !== '[') { at++; continue; }
    const token = tokenAt(source, at);
    if (!token || [literal, retained].some(range => range && token.end > range.from && token.start < range.from)) { at++; continue; }
    text(textStart, at); at = token.end; textStart = at;
    if (token.invalid) { append({ type: 'raw', raw: token.raw, start: token.start, end: token.end, reason: 'unterminated-delimiter', id: sourceId() }); break; }
    // Discuz-style [*] list items have implicit closing delimiters.
    if ((token.name === '*' && !token.closing) || (token.closing && ['list', 'ul', 'ol'].includes(token.name))) {
      if (stack.at(-1).name === '*') { const item = stack.pop(); item.end = token.start; }
    }
    if (token.closing) {
      if (stack.length > 1 && stack.at(-1).name === token.name) {
        const node = stack.pop(); node.close = token.raw; node.end = token.end;
        if (node.depth >= 96) { node.type = 'raw'; node.reason = 'nesting-limit'; delete node.children; }
      } else append({ type: 'raw', raw: token.raw, start: token.start, end: token.end, reason: 'unmatched-close', id: sourceId() });
      continue;
    }
    if (token.name === 'code') {
      const closePattern = /\[\/code\]/gi; closePattern.lastIndex = at;
      const close = closePattern.exec(source);
      if (close) {
        append({ type: 'tag', id: sourceId(), name: 'code', open: token.raw, close: close[0], start: token.start, end: closePattern.lastIndex,
          raw: source.slice(token.start, closePattern.lastIndex), children: [{ type: 'text', text: source.slice(at, close.index), start: at, end: close.index }] });
        at = closePattern.lastIndex; textStart = at; continue;
      }
      append({ type: 'raw', start: token.start, end: source.length, reason: 'unclosed-code', id: sourceId() });
      at = source.length; textStart = at; break;
    }
    const node = { type: 'tag', id: sourceId(), name: token.name, argument: token.argument,
      open: token.raw, close: '', start: token.start, end: null, depth: stack.length, children: [] };
    append(node); stack.push(node);
  }
  text(textStart, source.length);
  for (const node of stack.slice(1, 2)) {
    node.type = 'raw'; node.raw = source.slice(node.start); node.end = source.length; node.reason = 'unclosed-tag';
    delete node.children;
  }
  // Only the outermost unclosed node is visited by the projection. Its raw
  // content includes all nested input, including any unmatched delimiters.
  return { source, tree: root, issues };
}

export function defaultArgument(open) {
  const match = /^\[[^\s=\]]+\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/.exec(open || '');
  return match ? match[1] ?? match[2] ?? match[3] : '';
}

export function attributeValue(open, name) {
  const match = new RegExp(`(?:\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s\\]]+))`, 'i').exec(open || '');
  return match ? match[1] ?? match[2] ?? match[3] : null;
}

/** Change one selected attribute while preserving all other lexical spelling. */
export function setAttribute(open, name, value) {
  if (!/^[a-z][\w-]*$/i.test(name) || /[\[\]"'\r\n]/.test(String(value))) throw new Error('Attribute cannot be represented safely.');
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(?:"([^"]*)"|'([^']*)'|([^\\s\\]]+))`, 'i');
  if (pattern.test(open)) return open.replace(pattern, (all, prefix, double, single) =>
    prefix + (double !== undefined ? `"${value}"` : single !== undefined ? `'${value}'` : /\s/.test(String(value)) ? `"${value}"` : value));
  return open.slice(0, -1) + ` ${name}="${value}"]`;
}

export function safeBoundary(text, position, bias = -1) {
  let at = Math.max(0, Math.min(text.length, position));
  if (at > 0 && at < text.length && /[\uD800-\uDBFF]/.test(text[at - 1]) && /[\uDC00-\uDFFF]/.test(text[at])) at += bias < 0 ? -1 : 1;
  return at;
}

export function safeSelection(text, from, to = from) {
  const start = safeBoundary(text, Number(from) || 0);
  return { from: start, to: Number(from) === Number(to) ? start : safeBoundary(text, Number(to) || 0, 1) };
}

/** Browser textarea values use LF. Keep a reversible map to untouched raw EOLs. */
export function sourceDisplay(source) {
  let value = ''; const offsets = [0];
  for (let at = 0; at < source.length;) {
    if (source[at] === '\r') { at += source[at + 1] === '\n' ? 2 : 1; value += '\n'; }
    else value += source[at++];
    offsets.push(at);
  }
  return { value, offsets };
}

export function sourceEdit(source, { value, from, to, text } = {}) {
  const display = sourceDisplay(source);
  if (typeof text !== 'string') {
    value = String(value ?? display.value);
    if (value === display.value) return { source, from: 0, to: 0, text: '', unchanged: true };
    from = 0; while (from < value.length && from < display.value.length && value[from] === display.value[from]) from++;
    let tail = 0;
    while (tail < value.length - from && tail < display.value.length - from && value.at(-1 - tail) === display.value.at(-1 - tail)) tail++;
    to = display.value.length - tail; from = safeBoundary(display.value, from); to = safeBoundary(display.value, to, 1);
    text = value.slice(from, value.length - (display.value.length - to));
  }
  ({ from, to } = safeSelection(display.value, from, to));
  if (to < from) throw new Error('Reversed source selection.');
  const rawFrom = display.offsets[from], rawTo = display.offsets[to];
  return { source: source.slice(0, rawFrom) + text + source.slice(rawTo), from: rawFrom, to: rawTo, text,
    unchanged: source.slice(rawFrom, rawTo) === text };
}
