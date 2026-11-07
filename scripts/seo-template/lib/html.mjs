// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/html.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Small, dependency-free HTML parser for prerendered pages (React SSR output and hand-written static generators).
// It builds a tolerant element tree: enough to find <main>, strip elements, read text, links, meta and JSON-LD.
// It is not a full HTML5 tree builder; it handles raw-text elements, void elements, comments, implied </p> and </li>,
// and stray or mismatched end tags, which is what generated pages contain.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'plaintext']);
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']);
export const BLOCK = new Set([...CLOSES_P, 'body', 'br', 'dd', 'dt', 'li', 'option', 'td', 'th', 'tr', 'tbody', 'thead', 'tfoot',
  'caption', 'summary', 'html', 'head', 'img', 'picture', 'video', 'audio', 'canvas', 'button', 'label', 'select']);

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', mdash: '—', ndash: '–',
  hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
  middot: '·', bull: '•', deg: '°', times: '×', divide: '÷', frac12: '½', frac14: '¼', frac34: '¾', plusmn: '±', cent: '¢',
  pound: '£', euro: '€', yen: '¥', sect: '§', para: '¶', minus: '−', larr: '←', rarr: '→', uarr: '↑', darr: '↓', hearts: '♥',
  star: '☆', check: '✓', eacute: 'é', egrave: 'è', aacute: 'á', agrave: 'à', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ',
  ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß', zwj: '', zwnj: '', shy: '',
};

export function decodeEntities(text) {
  if (!text || text.indexOf('&') === -1) return text;
  return text.replace(/&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (whole, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return whole;
      return code === 0xa0 ? ' ' : String.fromCodePoint(code);
    }
    const value = NAMED[body] ?? NAMED[body.toLowerCase()];
    return value === undefined ? whole : value;
  });
}

function element(tag, attrs, parent) {
  return { type: 'element', tag, attrs, children: [], parent };
}

const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(source) {
  const attrs = {};
  if (!source) return attrs;
  ATTR_RE.lastIndex = 0;
  let match;
  while ((match = ATTR_RE.exec(source))) {
    const name = match[1].toLowerCase();
    if (name in attrs) continue;
    const raw = match[2] ?? match[3] ?? match[4];
    attrs[name] = raw === undefined ? '' : decodeEntities(raw);
  }
  return attrs;
}

/** Parse HTML into {type:'root', children} with element nodes {tag, attrs, children, parent} and text nodes {type:'text', value}. */
export function parseHtml(html) {
  const root = { type: 'root', tag: '#root', attrs: {}, children: [], parent: null };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const len = html.length;
  let i = 0;
  const pushText = (raw, decode = true) => {
    if (!raw) return;
    top().children.push({ type: 'text', value: decode ? decodeEntities(raw) : raw, parent: top() });
  };
  const closeTo = (index) => { stack.length = Math.max(1, index); };
  const findOpen = (tag, stopAt) => {
    for (let k = stack.length - 1; k > 0; k--) {
      if (stack[k].tag === tag) return k;
      if (stopAt && stopAt.has(stack[k].tag)) return -1;
    }
    return -1;
  };
  while (i < len) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { pushText(html.slice(i)); break; }
    if (lt > i) pushText(html.slice(i, lt));
    const next = html[lt + 1];
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    if (next === '!' || next === '?') {
      if (html.startsWith('<![CDATA[', lt)) {
        const end = html.indexOf(']]>', lt + 9);
        pushText(html.slice(lt + 9, end === -1 ? len : end), false);
        i = end === -1 ? len : end + 3;
        continue;
      }
      const end = html.indexOf('>', lt + 2);
      i = end === -1 ? len : end + 1;
      continue;
    }
    if (next === '/') {
      const m = /^<\/([a-zA-Z][^\s/>]*)[^>]*>/.exec(html.slice(lt, lt + 256));
      if (!m) { pushText('<'); i = lt + 1; continue; }
      const tag = m[1].toLowerCase();
      const index = findOpen(tag, tag === 'li' ? new Set(['ul', 'ol']) : null);
      if (index > 0) closeTo(index);
      else if (tag === 'p') { /* stray </p>: browsers insert an empty <p>; ignore */ }
      i = lt + m[0].length;
      continue;
    }
    if (!/[a-zA-Z]/.test(next || '')) { pushText('<'); i = lt + 1; continue; }
    // Start tag: find the closing '>' outside quotes.
    let j = lt + 1;
    let quote = null;
    while (j < len) {
      const c = html[j];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      j++;
    }
    const inner = html.slice(lt + 1, j);
    const nameMatch = /^[a-zA-Z][^\s/>]*/.exec(inner);
    const tag = nameMatch[0].toLowerCase();
    const selfClosing = inner.endsWith('/');
    const attrs = parseAttrs(inner.slice(nameMatch[0].length, selfClosing ? -1 : undefined));
    i = j + 1;
    if (tag === 'p' || CLOSES_P.has(tag)) {
      const p = findOpen('p', new Set(['button', 'table', 'td', 'th', 'li', 'div', 'section', 'article', 'main', 'aside', 'nav', 'header', 'footer', 'blockquote', 'form', 'body']));
      if (p > 0) closeTo(p);
    }
    if (tag === 'li') { const k = findOpen('li', new Set(['ul', 'ol', 'menu'])); if (k > 0) closeTo(k); }
    if (tag === 'dt' || tag === 'dd') { const k = Math.max(findOpen('dt', new Set(['dl'])), findOpen('dd', new Set(['dl']))); if (k > 0) closeTo(k); }
    if (tag === 'tr') { const k = findOpen('tr', new Set(['table', 'tbody', 'thead', 'tfoot'])); if (k > 0) closeTo(k); }
    if (tag === 'td' || tag === 'th') { const k = Math.max(findOpen('td', new Set(['tr', 'table'])), findOpen('th', new Set(['tr', 'table']))); if (k > 0) closeTo(k); }
    if (tag === 'option') { const k = findOpen('option', new Set(['select', 'datalist'])); if (k > 0) closeTo(k); }
    const node = element(tag, attrs, top());
    top().children.push(node);
    if (VOID.has(tag) || selfClosing) continue;
    if (RAW_TEXT.has(tag)) {
      const closeRe = new RegExp(`</${tag}\\s*>`, 'ig');
      closeRe.lastIndex = i;
      const m = closeRe.exec(html);
      const end = m ? m.index : len;
      const text = html.slice(i, end);
      if (text) node.children.push({ type: 'text', value: tag === 'title' || tag === 'textarea' ? decodeEntities(text) : text, parent: node, raw: true });
      i = m ? m.index + m[0].length : len;
      continue;
    }
    stack.push(node);
  }
  return root;
}

// ---- selectors: tag, #id, .class, [attr], [attr=value], and compounds of those (no combinators) ----

export function parseSelector(selector) {
  const out = { tag: null, id: null, classes: [], attrs: [] };
  const re = /([a-zA-Z][a-zA-Z0-9-]*)|#([\w-]+)|\.([\w-]+)|\[\s*([\w:-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]*)))?\s*\]|(\S)/g;
  let m;
  while ((m = re.exec(selector.trim()))) {
    if (m[1]) out.tag = m[1].toLowerCase();
    else if (m[2]) out.id = m[2];
    else if (m[3]) out.classes.push(m[3]);
    else if (m[4]) out.attrs.push({ name: m[4].toLowerCase(), value: m[5] ?? m[6] ?? m[7] });
    else if (m[8]) throw new Error(`unsupported selector "${selector}" (use tag, #id, .class, [attr], [attr=value])`);
  }
  return out;
}

export function matches(node, sel) {
  if (node.type !== 'element') return false;
  if (sel.tag && node.tag !== sel.tag) return false;
  if (sel.id && node.attrs.id !== sel.id) return false;
  if (sel.classes.length) {
    const classes = new Set((node.attrs.class || '').split(/\s+/));
    if (!sel.classes.every((c) => classes.has(c))) return false;
  }
  for (const a of sel.attrs) {
    if (!(a.name in node.attrs)) return false;
    if (a.value !== undefined && node.attrs[a.name] !== a.value) return false;
  }
  return true;
}

export function* walk(node) {
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    yield current;
    if (current.children) for (let k = current.children.length - 1; k >= 0; k--) stack.push(current.children[k]);
  }
}

export function findFirst(node, selector) {
  const sel = typeof selector === 'string' ? parseSelector(selector) : selector;
  for (const n of walk(node)) if (n !== node && matches(n, sel)) return n;
  return null;
}

export function findAll(node, selector) {
  const sel = typeof selector === 'string' ? parseSelector(selector) : selector;
  const out = [];
  for (const n of walk(node)) if (n !== node && matches(n, sel)) out.push(n);
  return out;
}

export function byTag(node, tag) {
  const out = [];
  for (const n of walk(node)) if (n.type === 'element' && n.tag === tag) out.push(n);
  return out;
}

export function rawText(node) {
  let out = '';
  for (const n of walk(node)) if (n.type === 'text') out += n.value;
  return out;
}

export function hasAncestor(node, predicate) {
  for (let p = node.parent; p; p = p.parent) if (predicate(p)) return true;
  return false;
}
