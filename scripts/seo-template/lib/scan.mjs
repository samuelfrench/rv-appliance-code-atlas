// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/scan.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// One pass over the built output: every page is parsed once and shared by ledger update, latest verify and the guard.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzePage } from './content.mjs';
import { DEFAULT_IGNORE_FILES, listPages, normalizePath } from './paths.mjs';

const SKIP_SCHEME = /^(?:mailto|tel|sms|javascript|data|blob|ftp|file):/i;
const bareHost = (h) => h.toLowerCase().replace(/^www\./, '');

/** Normalized internal path for an <a href> on a page, or null for external, non-page and self-fragment links. */
export function resolveInternal(href, pageUrl, originHost) {
  const raw = (href || '').trim();
  if (!raw || raw.startsWith('#') || SKIP_SCHEME.test(raw)) return null;
  let url;
  try { url = new URL(raw, pageUrl); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;
  if (bareHost(url.host) !== originHost) return null;
  if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico|pdf|xml|txt|json|js|mjs|css|zip|csv|mp4|webm|mp3|woff2?)$/i.test(url.pathname)) return null;
  return normalizePath(url.pathname);
}

/**
 * scanDist(dist, {origin, contentSelectors, normalizeText, hrefs, ignoreFiles}) -> {pages: Map<path, page>, origin}
 * ignoreFiles: extra RegExps (or strings) matched against the dist-relative file path, added to DEFAULT_IGNORE_FILES.
 * page = {path, file, url, hash, title, words, noindex, canonicals, refresh, dates, links: string[] (internal paths)}
 * hrefs: optional Map<path, href> of the URL form the site publishes (from the sitemap) for resolving relative links.
 */
export function scanDist(dist, { origin = 'https://example.invalid', contentSelectors, normalizeText, hrefs = new Map(), ignoreFiles = [], onPage } = {}) {
  const base = new URL(origin);
  const originHost = bareHost(base.host);
  const pages = new Map();
  for (const { path, file } of listPages(dist, { ignoreFiles: [...DEFAULT_IGNORE_FILES, ...ignoreFiles.map((r) => (r instanceof RegExp ? r : new RegExp(r)))] })) {
    const html = readFileSync(join(dist, file), 'utf8');
    const nested = /(^|\/)index\.html?$/i.test(file) && path !== '/';
    const href = hrefs.get(path) || (nested ? `${path}/` : path);
    const url = new URL(href, base).toString();
    const analysis = analyzePage(html, { origin: base.origin, contentSelectors, normalizeText, path });
    const links = new Set();
    for (const link of analysis.links) {
      if (link.nofollow) continue; // rel=nofollow is not a dependable discovery path
      const target = resolveInternal(link.href, url, originHost);
      if (target && target !== path) links.add(target);
    }
    const page = { path, file, url, hash: analysis.hash, selector: analysis.selector, title: analysis.title, words: analysis.words,
      // Resolve canonicals into fresh strings: raw attribute values can be V8 slices that keep the whole page's HTML alive.
      noindex: analysis.noindex, canonicals: analysis.canonicals.map((c) => { try { return new URL(c, url).toString(); } catch { return `${c}`.split('').join(''); } }),
      refresh: analysis.refresh, dates: analysis.dates, links: [...links] };
    pages.set(path, page);
    if (onPage) onPage(page);
  }
  return { pages, origin: base.origin };
}

/** inbound: Map<path, string[] sources> (deduplicated, self excluded). */
export function inboundMap(pages) {
  const inbound = new Map();
  for (const page of pages.values()) {
    for (const target of page.links) {
      let list = inbound.get(target);
      if (!list) inbound.set(target, (list = []));
      list.push(page.path);
    }
  }
  return inbound;
}

/** Click depth from the homepage over built pages (BFS); unreachable pages are absent. */
export function depthFrom(pages, start = '/') {
  const depth = new Map();
  if (!pages.has(start)) return depth;
  depth.set(start, 0);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    const page = pages.get(current);
    if (!page) continue;
    for (const target of page.links) {
      if (depth.has(target)) continue;
      depth.set(target, depth.get(current) + 1);
      if (pages.has(target)) queue.push(target);
    }
  }
  return depth;
}
