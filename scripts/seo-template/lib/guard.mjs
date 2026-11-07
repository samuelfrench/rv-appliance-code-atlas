// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/guard.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// sitemap-guard: every sitemap URL must be a real, indexable, self-canonical, linked, non-thin page in the build.
import { depthFrom, inboundMap } from './scan.mjs';
import { normalizePath } from './paths.mjs';

export const CHECKS = ['exists', 'noindex', 'canonical', 'inbound', 'words'];
export const OPTIONAL_CHECKS = ['reachable'];

function sameUrl(a, b) {
  const x = new URL(a);
  const y = new URL(b);
  const path = (u) => (u.pathname === '' ? '/' : u.pathname);
  return x.protocol === y.protocol && x.host.toLowerCase() === y.host.toLowerCase() && path(x) === path(y) && x.search === y.search;
}

/**
 * guardSitemap({sitemapEntries, scan, minWords, checks, exempt, maxDepth}) -> report
 * sitemapEntries: [{loc}] (from readSitemapUrls); scan: scanDist() result.
 * exempt(path, check) -> true skips that check for that URL (calculators, tools, legal pages with few words).
 */
export function guardSitemap({ sitemapEntries, scan, minWords = 150, checks = CHECKS, exempt = () => false, maxDepth = null, examples = 10 }) {
  const enabled = new Set(checks);
  if (maxDepth !== null) enabled.add('depth');
  const { pages } = scan;
  const inbound = inboundMap(pages);
  const depth = depthFrom(pages, '/');
  const buckets = Object.fromEntries([...CHECKS, ...OPTIONAL_CHECKS, 'depth'].map((c) => [c, []]));
  const seen = new Set();
  const flagged = new Set();
  const depthHistogram = {};
  for (const { loc } of sitemapEntries) {
    const path = normalizePath(loc);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const add = (check, detail) => {
      if (!enabled.has(check) || exempt(path, check)) return;
      buckets[check].push({ loc, path, ...detail });
      flagged.add(path);
    };
    const page = pages.get(path);
    if (!page) { add('exists', { reason: 'no built page for this URL' }); continue; }
    if (page.refresh) add('exists', { reason: 'meta refresh redirect stub', file: page.file });
    if (page.noindex) add('noindex', { file: page.file });
    const canonicals = [...new Set(page.canonicals.map((c) => { try { return new URL(c, loc).toString(); } catch { return c; } }))];
    if (canonicals.length === 0) add('canonical', { reason: 'no rel=canonical' });
    else if (canonicals.length > 1) add('canonical', { reason: 'several different canonicals', canonicals });
    else {
      let same = false;
      try { same = sameUrl(canonicals[0], loc); } catch { same = false; }
      if (!same) add('canonical', { reason: 'canonical points elsewhere', canonical: canonicals[0] });
    }
    const sources = inbound.get(path) || [];
    if (sources.length === 0) add('inbound', { reason: 'no <a href> from any other built page' });
    if (page.words < minWords) add('words', { words: page.words, selector: page.selector });
    const d = depth.get(path);
    depthHistogram[d === undefined ? 'unreachable' : d] = (depthHistogram[d === undefined ? 'unreachable' : d] || 0) + 1;
    if (d === undefined) add('reachable', { reason: 'not reachable from / over built pages' });
    else if (maxDepth !== null && d > maxDepth) add('depth', { depth: d });
  }
  const results = {};
  for (const [check, list] of Object.entries(buckets)) {
    if (!enabled.has(check)) continue;
    results[check] = { count: list.length, examples: list.slice(0, examples) };
  }
  const sections = {};
  for (const path of flagged) {
    const s = path.split('/')[1] || '/';
    sections[s] = (sections[s] || 0) + 1;
  }
  return {
    sitemapUrls: seen.size,
    builtPages: pages.size,
    minWords,
    checks: [...enabled],
    violatingUrls: flagged.size,
    violationsBySection: Object.fromEntries(Object.entries(sections).sort((a, b) => b[1] - a[1])),
    results,
    depthHistogram,
  };
}

export function formatGuardReport(report) {
  const lines = [`sitemap-guard: ${report.sitemapUrls} sitemap URLs, ${report.builtPages} built pages, ${report.violatingUrls} URL(s) with violations`];
  const label = { exists: 'missing or redirect stub', noindex: 'noindex', canonical: 'not self-canonical', inbound: 'no inbound internal link',
    words: `fewer than ${report.minWords} primary-content words`, reachable: 'unreachable from /', depth: 'deeper than max depth' };
  for (const [check, result] of Object.entries(report.results)) {
    lines.push(`  ${result.count ? 'FAIL' : 'ok  '} ${check.padEnd(9)} ${String(result.count).padStart(5)}  ${label[check] || check}`);
    for (const ex of result.examples.slice(0, 5)) {
      const extra = ex.words !== undefined ? ` (${ex.words} words)` : ex.canonical ? ` -> ${ex.canonical}` : ex.reason ? ` (${ex.reason})` : '';
      lines.push(`         ${ex.loc}${extra}`);
    }
  }
  if (Object.keys(report.violationsBySection).length) {
    lines.push(`  by section: ${Object.entries(report.violationsBySection).slice(0, 8).map(([s, c]) => `${s} ${c}`).join(', ')}`);
  }
  lines.push(`  click depth from /: ${Object.entries(report.depthHistogram).map(([d, c]) => `${d}:${c}`).join(' ')}`);
  return lines.join('\n');
}
