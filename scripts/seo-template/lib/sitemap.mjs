// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/sitemap.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Sitemap reading and writing: <urlset> and <sitemapindex>, lastmod injection from the content-dates ledger.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lookup } from './ledger.mjs';
import { normalizePath } from './paths.mjs';

const decodeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
export const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function tagValue(block, tag) {
  // Unprefixed first: <image:loc> inside <url> must never be read as the page <loc>.
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
    || new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, 'i').exec(block);
  if (!m) return null;
  return decodeXml(m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim());
}

/** {kind: 'urlset'|'sitemapindex', entries: [{loc, lastmod}]} */
export function parseSitemap(xml) {
  const isIndex = /<(?:[\w-]+:)?sitemapindex\b/i.test(xml);
  const tag = isIndex ? 'sitemap' : 'url';
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, 'gi');
  const entries = [];
  let m;
  while ((m = re.exec(xml))) {
    const loc = tagValue(m[1], 'loc');
    if (loc) entries.push({ loc, lastmod: tagValue(m[1], 'lastmod') });
  }
  return { kind: isIndex ? 'sitemapindex' : 'urlset', entries };
}

/** Local file for a child sitemap URL: dist/<pathname>. */
function localChild(loc, dist) {
  if (!dist) return null;
  try {
    const file = join(dist, new URL(loc).pathname.replace(/^\//, ''));
    return existsSync(file) ? file : null;
  } catch { return null; }
}

/**
 * All page URLs from sitemap files. Sitemap indexes are followed into child sitemaps found under `dist`
 * (or next to the index file). Returns [{loc, lastmod, file}].
 */
export function readSitemapUrls(files, { dist } = {}) {
  const out = [];
  const seen = new Set();
  const queue = [...(Array.isArray(files) ? files : [files])].filter(Boolean);
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const parsed = parseSitemap(readFileSync(file, 'utf8'));
    if (parsed.kind === 'sitemapindex') {
      for (const entry of parsed.entries) {
        const child = localChild(entry.loc, dist) || localChild(entry.loc, join(file, '..'));
        if (child) queue.push(child);
        else console.warn(`[seo] sitemap index child not found locally: ${entry.loc}`);
      }
    } else {
      for (const entry of parsed.entries) out.push({ ...entry, file });
    }
  }
  return out;
}

/**
 * Set <lastmod> on every <url> from the ledger. URLs the ledger has no date for lose any generator-written lastmod
 * (`unknown: 'remove'`, default: a guessed date is worse than none) or keep it (`unknown: 'keep'`).
 * Returns {xml, stats: {urls, set, removed, kept}}. For a <sitemapindex>, use updateIndexLastmod().
 */
export function injectLastmod(xml, ledger, { unknown = 'remove' } = {}) {
  const stats = { urls: 0, set: 0, removed: 0, kept: 0 };
  const out = xml.replace(/(<(?:[\w-]+:)?url\b[^>]*>)([\s\S]*?)(<\/(?:[\w-]+:)?url>)/gi, (whole, open, body, close) => {
    const loc = tagValue(body, 'loc');
    if (!loc) return whole;
    stats.urls++;
    const entry = lookup(ledger, loc);
    const date = entry?.lastmod || null;
    const hasLastmod = /<(?:[\w-]+:)?lastmod\b/i.test(body);
    if (!date) {
      if (unknown === 'keep' || !hasLastmod) { if (hasLastmod) stats.kept++; return whole; }
      stats.removed++;
      return open + body.replace(/\s*<(?:[\w-]+:)?lastmod\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?lastmod>/i, '') + close;
    }
    stats.set++;
    if (hasLastmod) return open + body.replace(/<((?:[\w-]+:)?)lastmod\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?lastmod>/i, `<$1lastmod>${date}</$1lastmod>`) + close;
    return open + body.replace(/(<loc\b[^>]*>[\s\S]*?<\/loc>)/i, `$1<lastmod>${date}</lastmod>`) + close;
  });
  return { xml: out, stats };
}

/** Index <sitemap> lastmod = newest <lastmod> in that child file (children must already be processed). */
export function updateIndexLastmod(xml, childLastmods) {
  return xml.replace(/(<(?:[\w-]+:)?sitemap\b[^>]*>)([\s\S]*?)(<\/(?:[\w-]+:)?sitemap>)/gi, (whole, open, body, close) => {
    const loc = tagValue(body, 'loc');
    const date = loc ? childLastmods.get(loc) : null;
    if (!date) return whole;
    if (/<(?:[\w-]+:)?lastmod\b/i.test(body)) return open + body.replace(/<((?:[\w-]+:)?)lastmod\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?lastmod>/i, `<$1lastmod>${date}</$1lastmod>`) + close;
    return open + body.replace(/(<(?:[\w-]+:)?loc\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?loc>)/i, `$1<lastmod>${date}</lastmod>`) + close;
  });
}

/**
 * Write a <urlset> for sites without a sitemap writer. urls: [{loc, changefreq?, priority?}] or strings.
 * lastmod comes from the ledger; a URL without a ledger date gets no <lastmod>.
 */
export function buildSitemapXml(urls, { ledger } = {}) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const raw of urls) {
    const u = typeof raw === 'string' ? { loc: raw } : raw;
    const date = ledger ? lookup(ledger, u.loc)?.lastmod : u.lastmod;
    lines.push(`  <url><loc>${escapeXml(u.loc)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `<priority>${u.priority}</priority>` : ''}</url>`);
  }
  lines.push('</urlset>', '');
  return lines.join('\n');
}

/** Sitemap URL set as normalized paths. */
export function sitemapPathSet(entries) {
  return new Set(entries.map((e) => normalizePath(e.loc)).filter(Boolean));
}
