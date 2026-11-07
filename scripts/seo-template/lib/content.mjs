// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/content.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Primary-content extraction, normalization and hashing for one built page, plus the page facts the guard and the
// ledger need (title, h1, robots, canonical, outgoing links, JSON-LD dates).
import { createHash } from 'node:crypto';
import { BLOCK, byTag, findFirst, matches, parseHtml, parseSelector, rawText } from './html.mjs';

/** Bump when the normalization changes: a new version rebaselines every hash without moving any date. */
export const HASH_VERSION = 1;
export const DEFAULT_CONTENT_SELECTORS = ['main', '[data-seo-content]'];
const STRIP_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'template', 'nav', 'iframe', 'object', 'canvas', 'head', 'dialog']);
// <header>/<footer> are stripped when they are page landmarks (ARIA banner/contentinfo): not inside article, aside,
// main, nav or section. An article's own <header> with its h1 and byline is content and stays.
const SECTIONING = new Set(['article', 'aside', 'main', 'nav', 'section']);
const IGNORE_ATTR = 'data-seo-ignore';
const ASSET_EXT = '(?:m?js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|json|map|mp4|webm|mp3|pdf|txt|xml)';
const ASSET_HASH_RE = new RegExp(`([.\\-_])([A-Za-z0-9_-]{8,})(?=\\.${ASSET_EXT}(?:$|[?#\\s"']))`, 'g');

function looksLikeHash(token) {
  // Vite (base64url, 8 chars) and webpack/hex hashes contain a digit or mixed case; plain words such as "roastery" do not.
  return /\d/.test(token) || (/[a-z]/.test(token) && /[A-Z]/.test(token));
}

/** Replace hashed asset names, cache-busting queries and build/commit ids so a rebuild of the same content hashes the same. */
export function normalizeVolatile(text) {
  return text
    .replace(ASSET_HASH_RE, (whole, sep, token) => (looksLikeHash(token) ? `${sep}[hash]` : whole))
    .replace(new RegExp(`(\\.${ASSET_EXT})\\?[^\\s"'#]*`, 'g'), '$1')
    .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/g, '[id]')
    .replace(/\b(?:build|buildid|build-id|revision|rev|commit|version)[\s:=#-]+(?=[A-Za-z0-9._-]*\d)[A-Za-z0-9._-]{4,}/gi, '[build]')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?\b/g, '[timestamp]');
}

function normalizeUrl(value, origin) {
  if (!value) return '';
  let v = value.trim();
  if (origin && v.startsWith(origin)) v = v.slice(origin.length) || '/';
  return normalizeVolatile(v);
}

function isLandmark(node) {
  for (let p = node.parent; p; p = p.parent) if (p.type === 'element' && SECTIONING.has(p.tag)) return false;
  return true;
}

function isIgnored(node) {
  if (node.type !== 'element') return false;
  if (STRIP_TAGS.has(node.tag) || IGNORE_ATTR in node.attrs || 'hidden' in node.attrs) return true;
  if (node.attrs['aria-hidden'] === 'true' && node.tag !== 'img') return true;
  return (node.tag === 'header' || node.tag === 'footer') && isLandmark(node);
}

/** The element whose content is hashed: the first match of contentSelectors, else <body>, else the document. */
export function primaryNode(doc, contentSelectors = DEFAULT_CONTENT_SELECTORS) {
  for (const selector of contentSelectors) {
    const sel = parseSelector(selector);
    const node = findFirstNotIgnored(doc, sel);
    if (node) return { node, selector };
  }
  const body = findFirst(doc, 'body');
  return body ? { node: body, selector: 'body' } : { node: doc, selector: 'document' };
}

function findFirstNotIgnored(doc, sel) {
  const stack = [doc];
  while (stack.length) {
    const n = stack.pop();
    if (n !== doc && matches(n, sel)) return n;
    if (n.children && !(n.type === 'element' && (n.tag === 'script' || n.tag === 'template' || IGNORE_ATTR in n.attrs))) {
      for (let k = n.children.length - 1; k >= 0; k--) stack.push(n.children[k]);
    }
  }
  return null;
}

/** Tokens of the primary content: visible text plus link targets and image identities, ignored subtrees removed. */
export function contentTokens(node, { origin } = {}) {
  const out = [];
  const visit = (n) => {
    if (n.type === 'text') { out.push(n.value); return; }
    if (n.type === 'element' && n !== node && isIgnored(n)) return;
    const block = n.type === 'element' && BLOCK.has(n.tag);
    if (block) out.push(' ');
    if (n.type === 'element') {
      if (n.tag === 'a' && n.attrs.href) out.push(` [a:${normalizeUrl(n.attrs.href, origin)}] `);
      if (n.tag === 'img') out.push(` [img:${normalizeUrl(n.attrs.src || '', origin)}|${n.attrs.alt || ''}] `);
    }
    if (n.children) for (const c of n.children) visit(c);
    if (block) out.push(' ');
  };
  visit(node);
  return out;
}

export function visibleText(node) {
  const out = [];
  const visit = (n) => {
    if (n.type === 'text') { out.push(n.value); return; }
    if (n.type === 'element' && n !== node && isIgnored(n)) return;
    const block = n.type === 'element' && BLOCK.has(n.tag);
    if (block) out.push(' ');
    if (n.children) for (const c of n.children) visit(c);
    if (block) out.push(' ');
  };
  visit(node);
  return out.join('').replace(/\s+/g, ' ').trim();
}

export function countWords(text) {
  const m = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu);
  return m ? m.length : 0;
}

/** Normalized string that is hashed (exposed for `ledger explain`). */
export function canonicalContent(doc, { origin, contentSelectors, normalizeText, path } = {}) {
  const { node, selector } = primaryNode(doc, contentSelectors);
  let text = contentTokens(node, { origin }).join('').replace(/\s+/g, ' ').trim();
  text = normalizeVolatile(text);
  if (typeof normalizeText === 'function') text = String(normalizeText(text, path) ?? '');
  return { text, selector };
}

export function contentHash(text) {
  return createHash('sha256').update(`v${HASH_VERSION}\n${text}`).digest('hex').slice(0, 16);
}

/** Config fingerprint stored in the ledger: a change rebaselines hashes instead of stamping every page as changed. */
export function hashConfigId({ contentSelectors = DEFAULT_CONTENT_SELECTORS, normalizeId = '', origin = '' } = {}) {
  // origin is part of it: same-site absolute links are hashed as paths, so a different origin changes every hash.
  return createHash('sha256').update(JSON.stringify([HASH_VERSION, contentSelectors, normalizeId, origin || ''])).digest('hex').slice(0, 12);
}

function metaContent(doc, name) {
  for (const meta of byTag(doc, 'meta')) {
    const key = (meta.attrs.name || meta.attrs.property || meta.attrs.itemprop || '').toLowerCase();
    if (key === name) return meta.attrs.content ?? '';
  }
  return null;
}

function collectJsonLd(doc) {
  const out = [];
  for (const script of byTag(doc, 'script')) {
    if ((script.attrs.type || '').toLowerCase() !== 'application/ld+json') continue;
    try { out.push(JSON.parse(rawText(script))); } catch { /* malformed block: skip */ }
  }
  const flat = [];
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      flat.push(value);
      if (value['@graph']) visit(value['@graph']);
      if (value.mainEntity) visit(value.mainEntity);
    }
  };
  out.forEach(visit);
  return flat;
}

export function isoDate(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toISOString().slice(0, 10) === `${m[1]}-${m[2]}-${m[3]}` ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Trusted per-page dates: JSON-LD datePublished/dateModified, then article:*_time meta. */
export function pageDates(doc) {
  let published = null;
  let modified = null;
  for (const item of collectJsonLd(doc)) {
    published = published || isoDate(item.datePublished) || isoDate(item.dateCreated);
    modified = modified || isoDate(item.dateModified);
  }
  published = published || isoDate(metaContent(doc, 'article:published_time') || '');
  modified = modified || isoDate(metaContent(doc, 'article:modified_time') || '') || isoDate(metaContent(doc, 'og:updated_time') || '');
  return { published, modified };
}

function cleanTitle(value) {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  return text.length > 140 ? `${text.slice(0, 137).trimEnd()}…` : text;
}

/** Everything the package reads from one page. */
export function analyzePage(html, { origin, contentSelectors, normalizeText, path } = {}) {
  const doc = parseHtml(html);
  const { text, selector } = canonicalContent(doc, { origin, contentSelectors, normalizeText, path });
  const { node } = primaryNode(doc, contentSelectors);
  const words = countWords(visibleText(node));
  // Every robots/googlebot meta counts (a page may carry several); match whole directives, so max-image-preview:none
  // is not "none".
  const directives = byTag(doc, 'meta')
    .filter((m) => ['robots', 'googlebot'].includes((m.attrs.name || '').toLowerCase()))
    .flatMap((m) => (m.attrs.content || '').toLowerCase().split(',').map((d) => d.trim()));
  const canonicals = byTag(doc, 'link').filter((l) => (l.attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical')).map((l) => l.attrs.href || '');
  const refresh = byTag(doc, 'meta').some((m) => (m.attrs['http-equiv'] || '').toLowerCase() === 'refresh' && /url=/i.test(m.attrs.content || ''));
  const links = [];
  for (const a of byTag(doc, 'a')) {
    if (!a.attrs.href) continue;
    let inert = false;
    for (let p = a.parent; p; p = p.parent) if (p.tag === 'template') { inert = true; break; }
    if (inert) continue;
    const rel = (a.attrs.rel || '').toLowerCase().split(/\s+/);
    links.push({ href: a.attrs.href, nofollow: rel.includes('nofollow') });
  }
  const h1 = findFirst(doc, 'h1');
  const titleNode = findFirst(doc, 'title');
  const title = cleanTitle(h1 ? visibleText(h1) : '') || cleanTitle((titleNode ? rawText(titleNode) : '').split(/\s+[|–—]\s+|\s+-\s+/)[0]);
  return {
    hash: contentHash(text),
    selector,
    words,
    title,
    noindex: directives.includes('noindex') || directives.includes('none'),
    canonicals,
    refresh,
    links,
    dates: pageDates(doc),
  };
}
