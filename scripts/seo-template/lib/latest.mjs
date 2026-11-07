// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/latest.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// latest-links: newest pages site-wide and per section, from the ledger's firstSeen (true first-publish date).
// planLatest() runs BEFORE render on the prior ledger plus this build's route list, so the lists can be imported by
// the page templates and appear in the prerendered HTML. Routes the prior ledger does not know are planned with the
// same date rules ledger update applies after render (see resolveNewDates), and written back as hash-less entries so
// both passes agree.
import { DEFAULTS, lookup, priorSourceOf, resolveNewDates } from './ledger.mjs';
import { hrefOf, normalizePath } from './paths.mjs';

export const LATEST_VERSION = 1;

export function defaultSection(path) {
  const key = normalizePath(path);
  return key && key !== '/' ? key.split('/')[1] : null;
}

/** Default filter: not the homepage and not a section hub itself (/blog is the hub of section "blog"). */
export function defaultInclude(path, section) {
  const key = normalizePath(path);
  return key !== '/' && Boolean(section) && key !== `/${section}`;
}

export function humanize(path) {
  const last = normalizePath(path).split('/').filter(Boolean).pop() || '';
  const words = decodeURIComponent(last).replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : path;
}

/** Normalize a route list (sitemap entries, strings, or {path|href|loc, title}) into [{path, href, title}]. */
export function toRoutes(input) {
  const out = [];
  const seen = new Set();
  for (const value of input) {
    const item = typeof value === 'string' ? { href: value } : value;
    const source = item.href || item.loc || item.path;
    if (!source) continue;
    const path = normalizePath(source);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const href = /^https?:\/\//i.test(source) ? hrefOf(source) : source;
    out.push({ path, href, title: item.title || null });
  }
  return out;
}

function byNewest(a, b) {
  if (a.firstSeen !== b.firstSeen) return a.firstSeen < b.firstSeen ? 1 : -1;
  if ((a.lastmod || '') !== (b.lastmod || '')) return (a.lastmod || '') < (b.lastmod || '') ? 1 : -1;
  return a.href < b.href ? -1 : a.href > b.href ? 1 : 0;
}

/**
 * Build latest.json. Returns {latest, planned}: planned = {path: {hash: null, firstSeen, lastmod}} for routes the
 * ledger does not know (write them into the prior with withPlanned() so ledger update keeps the same dates).
 * adapter: {section(path), include(path, section), title(path), seedDate(path, ctx)} (all optional).
 * planNew: false skips routes the ledger does not know (used by verify against the final ledger).
 */
export async function planLatest({ ledger, routes, buildDate, adapter = {}, n = 8, perSection = 8, imports = [], seedCtx = {}, planNew = true, distrustDates = null }) {
  const sectionOf = adapter.section || defaultSection;
  const include = adapter.include || defaultInclude;
  const source = priorSourceOf(ledger);
  const list = toRoutes(routes);
  // Same safety rule as updateLedger: a prior that misses most routes is not trusted to say "new in this release".
  const unknown = list.filter((r) => !ledger?.urls?.[r.path]).length;
  const untrusted = list.length >= DEFAULTS.minPagesForSafety && unknown / list.length > DEFAULTS.maxNewShare;
  const mode = source === 'none' || untrusted ? 'bootstrap' : source;
  const planned = {};
  const items = [];
  for (const route of list) {
    // A removed entry that reappears keeps its dates; verify (planNew false) only counts pages the final ledger has built.
    let entry = lookup(ledger, route.path) || (planNew ? ledger?.urls?.[route.path] : null) || null;
    if (!entry && !planNew) continue; // verify: a route the final ledger lacks was never built
    if (!entry) {
      const dates = await resolveNewDates(route.path, { mode, buildDate, imports, seedDate: adapter.seedDate, seedCtx, distrustDates });
      entry = { hash: null, planned: true, firstSeen: dates.firstSeen, lastmod: dates.lastmod };
      planned[route.path] = entry;
    }
    const section = sectionOf(route.path) ?? null;
    if (!entry.firstSeen || !include(route.path, section)) continue;
    const title = route.title || (adapter.title ? await adapter.title(route.path) : null) || entry.title || humanize(route.path);
    items.push({ href: route.href, title, firstSeen: entry.firstSeen, lastmod: entry.lastmod || entry.firstSeen, section });
  }
  items.sort(byNewest);
  const strip = ({ lastmod, ...rest }) => rest;
  const sections = {};
  for (const item of items) {
    if (!item.section) continue;
    const list = (sections[item.section] ||= []);
    if (list.length < perSection) list.push(strip(item));
  }
  const latest = {
    version: LATEST_VERSION,
    generatedAt: new Date().toISOString(),
    buildDate,
    priorSource: source,
    mode,
    n,
    perSection,
    site: items.slice(0, n).map(strip),
    sections: Object.fromEntries(Object.keys(sections).sort().map((k) => [k, sections[k]])),
  };
  return { latest, planned };
}

export function withPlanned(ledger, planned) {
  return { ...ledger, urls: { ...(ledger?.urls || {}), ...planned } };
}

/** Newest `n` pages of the page's section, excluding the page itself. */
export function forPage(latest, path, { n = 5, section, sectionOf = defaultSection } = {}) {
  const key = normalizePath(path);
  const name = section ?? sectionOf(path);
  const list = (name && latest?.sections?.[name]) || [];
  return list.filter((item) => normalizePath(item.href) !== key).slice(0, n);
}

export function forSection(latest, section, { n } = {}) {
  const list = latest?.sections?.[section] || [];
  return n ? list.slice(0, n) : list;
}

export function forSite(latest, { n, exclude } = {}) {
  const key = exclude ? normalizePath(exclude) : null;
  const list = (latest?.site || []).filter((item) => !key || normalizePath(item.href) !== key);
  return n ? list.slice(0, n) : list;
}

/**
 * Compare the latest.json a build rendered (`rendered`) with one recomputed from the final ledger (`expected`).
 * missing: pages the final ledger ranks newest that the rendered lists lack; extra: rendered links to pages the final
 * ledger does not rank there (for example a route that was planned but never built).
 */
export function diffLatest(expected, rendered) {
  const hrefs = (list) => (list || []).map((i) => i.href);
  const minus = (a, b) => a.filter((h) => !b.includes(h));
  const out = { siteMissing: minus(hrefs(expected.site), hrefs(rendered.site)), siteExtra: minus(hrefs(rendered.site), hrefs(expected.site)),
    sectionsMissing: {}, sectionsExtra: {} };
  for (const name of new Set([...Object.keys(expected.sections || {}), ...Object.keys(rendered.sections || {})])) {
    const gap = minus(hrefs(expected.sections?.[name]), hrefs(rendered.sections?.[name]));
    const extra = minus(hrefs(rendered.sections?.[name]), hrefs(expected.sections?.[name]));
    if (gap.length) out.sectionsMissing[name] = gap;
    if (extra.length) out.sectionsExtra[name] = extra;
  }
  out.ok = !out.siteMissing.length && !out.siteExtra.length && !Object.keys(out.sectionsMissing).length && !Object.keys(out.sectionsExtra).length;
  return out;
}
