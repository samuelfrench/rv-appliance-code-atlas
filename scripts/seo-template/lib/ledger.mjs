// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/ledger.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// The content-dates ledger: {version, generatedAt, buildDate, meta, urls: {"/path": {hash, firstSeen, lastmod, title?, removed?}}}.
// Keys are normalized paths (see paths.mjs). Dates are YYYY-MM-DD. A null date means "no real evidence": the sitemap
// omits <lastmod> and latest-links skip the page, which is better than a guessed date.
import { readFileSync } from 'node:fs';
import { isoDate } from './content.mjs';
import { normalizePath } from './paths.mjs';

export const LEDGER_VERSION = 1;
export const DEFAULTS = {
  maxChangedShare: 0.5, // more than this share of known pages changing in one build = template change: rebaseline, keep dates
  maxNewShare: 0.5, // more than this share of pages missing from the prior = prior is not trustworthy: bootstrap rules
  minPagesForSafety: 20,
  massChange: 'rebaseline', // or 'accept' (stamp the build date on every changed page)
  maxPageDateShare: 0.5, // one page JSON-LD dateModified on more than this share of new pages = template default, ignored
  distrustDates: [], // seed dates never used as evidence (known placeholders: launch-date floors, old deploy dates)
  pruneRemovedDays: 90,
  earliestDate: '1995-01-01',
};

export function todayIn(timeZone = 'America/New_York', now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function emptyLedger() {
  return { version: LEDGER_VERSION, generatedAt: null, buildDate: null, meta: {}, urls: {} };
}

/** null when valid, else a reason string. */
export function validateLedger(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'not a JSON object';
  if (data.version !== LEDGER_VERSION) return `unsupported version ${JSON.stringify(data.version)}`;
  if (!data.urls || typeof data.urls !== 'object' || Array.isArray(data.urls)) return 'missing "urls" object';
  for (const [path, entry] of Object.entries(data.urls)) {
    if (!path.startsWith('/')) return `bad key ${JSON.stringify(path)}`;
    if (!entry || typeof entry !== 'object') return `bad entry for ${path}`;
    for (const field of ['firstSeen', 'lastmod']) {
      if (entry[field] !== null && entry[field] !== undefined && !isoDate(entry[field])) return `bad ${field} for ${path}: ${entry[field]}`;
    }
  }
  return null;
}

export function readLedgerFile(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const problem = validateLedger(data);
  if (problem) throw new Error(`${file}: ${problem}`);
  return data;
}

/** Entry for a URL or path, or null (removed entries count as absent). */
export function lookup(ledger, urlOrPath) {
  const key = normalizePath(urlOrPath);
  const entry = key && ledger?.urls ? ledger.urls[key] : null;
  return entry && !entry.removed ? entry : null;
}

export function lastmodFor(ledger, urlOrPath) {
  return lookup(ledger, urlOrPath)?.lastmod || null;
}

// ---------------------------------------------------------------- legacy ledgers

const LASTMOD_FIELDS = ['lastmod', 'lastModified', 'dateModified', 'modified', 'updated', 'date'];
const FIRST_FIELDS = ['firstSeen', 'firstPublished', 'datePublished', 'published', 'created'];

function pick(obj, fields) {
  for (const f of fields) { const d = isoDate(obj?.[f]); if (d) return d; }
  return null;
}

/**
 * Read an existing site ledger into Map<path, {firstSeen, lastmod, via}>. Recognized shapes:
 * this package's ledger ({urls}); cigar frontend/seo/sitemap-dates.json ({version, routes: {path: {hash, lastmod, evidence}}});
 * hot-sauce content/content-dates.json ({schema_version, routes: {path: {lastmod, fingerprint, provenance}}});
 * beer sitemap-content-dates.json ({entries: {path: "YYYY-MM-DD"}}); and a plain {path: date | {lastmod, firstSeen}} map.
 */
export function importLegacy(data, { label = 'import' } = {}) {
  let map = null;
  let shape = 'plain';
  if (data?.urls && typeof data.urls === 'object') { map = data.urls; shape = 'explorer-seo'; }
  else if (data?.routes && typeof data.routes === 'object') { map = data.routes; shape = data.schema_version ? 'hot-sauce' : 'cigar'; }
  else if (data?.entries && typeof data.entries === 'object') { map = data.entries; shape = 'beer'; }
  else if (data && typeof data === 'object') map = data;
  const out = new Map();
  if (!map) return { shape, entries: out };
  for (const [rawKey, value] of Object.entries(map)) {
    if (!/^(\/|https?:\/\/)/.test(rawKey)) continue;
    const path = normalizePath(rawKey);
    if (!path) continue;
    const lastmod = typeof value === 'string' ? isoDate(value) : pick(value, LASTMOD_FIELDS);
    const firstSeen = typeof value === 'string' ? null : pick(value, FIRST_FIELDS);
    if (!lastmod && !firstSeen) continue;
    out.set(path, { firstSeen, lastmod, via: `${label}:${shape}` });
  }
  return { shape, entries: out };
}

// ---------------------------------------------------------------- update

function validEvidence(date, buildDate, earliest) {
  const d = isoDate(date);
  return d && d >= earliest && d <= buildDate ? d : null;
}

/**
 * Dates for a path the prior ledger does not know. `mode` is 'live' (prior is the published ledger: the page is new in
 * this release, so it gets the build date), 'fallback' (prior is a committed or stale copy: use evidence, then the build
 * date) or 'bootstrap' (no trustworthy prior: use evidence, else null; never the build date en masse).
 * Evidence order: imported site ledgers, adapter seedDate(path, ctx), the page's own JSON-LD/meta dates.
 */
export async function resolveNewDates(path, { mode, buildDate, imports = [], seedDate, seedCtx = {}, pageDates = null, distrustDates = null, earliestDate = DEFAULTS.earliestDate }) {
  if (mode === 'live') return { firstSeen: buildDate, lastmod: buildDate, via: 'build' };
  let firstSeen = null;
  let lastmod = null;
  let lastmodDistrusted = false;
  const vias = [];
  const usable = (date) => {
    const d = validEvidence(date, buildDate, earliestDate);
    return d && !(distrustDates && distrustDates.has(d)) ? d : null;
  };
  const take = (first, last, via) => {
    const f = usable(first);
    const l = usable(last);
    if ((f && !firstSeen) || (l && !lastmod)) vias.push(via);
    if (f && !firstSeen) firstSeen = f;
    if (l && !lastmod) lastmod = l;
  };
  for (const map of imports) {
    const hit = map.get(path);
    if (hit) take(hit.firstSeen, hit.lastmod, hit.via || 'import');
  }
  if (typeof seedDate === 'function' && (!firstSeen || !lastmod)) {
    const seeded = await seedDate(path, seedCtx);
    if (typeof seeded === 'string') take(null, seeded, 'seedDate');
    else if (seeded && typeof seeded === 'object') take(seeded.firstSeen, seeded.lastmod, 'seedDate');
  }
  if (pageDates && (!firstSeen || !lastmod)) {
    // A page's dateModified (or datePublished standing in for it) is dropped when the same date sits on most pages:
    // that is a template default (launch or build date), not evidence. datePublished still counts for firstSeen.
    lastmodDistrusted = Boolean(pageDates.distrustLastmod) && !lastmod;
    take(pageDates.published, pageDates.distrustLastmod ? null : pageDates.modified || pageDates.published, 'page');
  }
  if (firstSeen && !lastmod && !lastmodDistrusted) lastmod = firstSeen;
  if (firstSeen && lastmod && firstSeen > lastmod) firstSeen = lastmod;
  if (!firstSeen && !lastmod) {
    if (mode === 'fallback') return { firstSeen: buildDate, lastmod: buildDate, via: 'build' };
    return { firstSeen: null, lastmod: null, via: 'unknown' };
  }
  return { firstSeen, lastmod, via: vias.join('+') || 'evidence' };
}

/** 'live' | 'fallback' | 'none' for a prior ledger (the `ledger fetch` command records where it came from). */
export function priorSourceOf(prior) {
  if (!prior || !prior.urls || Object.keys(prior.urls).length === 0) return 'none';
  const source = prior.meta?.fetch?.source;
  if (source === 'none') return 'none'; // only entries planned by `latest` on a bootstrap: still a bootstrap
  return source === 'live' ? 'live' : 'fallback';
}

function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/**
 * Compute the next ledger from the prior ledger and this build's pages.
 * pages: [{path, hash, title?, dates?}] (dates = {published, modified} from the page, used only without a live prior).
 * options.safetyPaths (Set): the URLs the new-page and changed-page shares are measured on (the sitemap), so built
 * pages that are not in the sitemap (redirect stubs, noindex pages) cannot trip or mask the safety rules.
 * Entries planned by planLatest() ({hash: null, planned: true}) count as new for every safety rule; with a live prior
 * they keep their planned date (the build date), otherwise they are re-resolved with the full evidence chain.
 * Returns {ledger, report}.
 */
export async function updateLedger({ prior, pages, buildDate, hashConfig, imports = [], seedDate, seedCtx = {}, origin = null, options = {}, generator = 'explorer-pipeline/seo' }) {
  const opts = { ...DEFAULTS, ...options };
  const prev = prior?.urls || {};
  const priorSource = priorSourceOf(prior);
  const isPlanned = (entry) => Boolean(entry && !entry.hash && entry.planned);
  const known = (page) => Boolean(prev[page.path]) && !isPlanned(prev[page.path]);
  const safety = opts.safetyPaths ? pages.filter((p) => opts.safetyPaths.has(p.path)) : pages;
  const newCount = safety.filter((p) => !known(p)).length;
  let mode = priorSource === 'none' ? 'bootstrap' : priorSource;
  const report = { buildDate, priorSource, mode: null, pages: pages.length, unchanged: 0, changed: 0, rebaselined: 0, planned: 0, reappeared: 0,
    new: 0, newVia: {}, removed: 0, pruned: 0, warnings: [] };
  if (mode !== 'bootstrap' && safety.length >= opts.minPagesForSafety && newCount / safety.length > opts.maxNewShare) {
    report.warnings.push(`${newCount}/${safety.length} pages are missing from the ${priorSource} prior ledger (> ${opts.maxNewShare}): treating it as a bootstrap, new pages get evidence dates or none, never the build date`);
    mode = 'bootstrap';
  }
  report.mode = mode;
  const configChanged = Boolean(prior?.meta?.hashConfig && hashConfig && prior.meta.hashConfig !== hashConfig);
  const comparable = safety.filter((p) => prev[p.path]?.hash);
  const changedCount = comparable.filter((p) => prev[p.path].hash !== p.hash).length;
  let rebaseline = configChanged;
  if (configChanged) report.warnings.push(`hash config changed (${prior.meta.hashConfig} -> ${hashConfig}): rebaselined every hash, no date moved`);
  else if (opts.massChange !== 'accept' && comparable.length >= opts.minPagesForSafety && changedCount / comparable.length > opts.maxChangedShare) {
    rebaseline = true;
    report.warnings.push(`${changedCount}/${comparable.length} known pages changed hash in one build (> ${opts.maxChangedShare}): treated as a template change, hashes rebaselined, lastmod NOT moved. If the content really changed everywhere, rerun with --mass-change accept. If this repeats every build the hash is unstable: compare \`ledger explain\` output from two builds.`);
  }
  report.massChangeRebaseline = rebaseline && !configChanged;
  const distrustDates = opts.distrustDates?.length ? new Set(opts.distrustDates) : null;
  // Page-date concentration: one dateModified on most new pages is a template default, not evidence.
  const pageLastmod = (p) => isoDate(p.dates?.modified) || isoDate(p.dates?.published);
  const fresh = pages.filter((p) => !known(p) && pageLastmod(p));
  const pageCounts = new Map();
  for (const p of fresh) pageCounts.set(pageLastmod(p), (pageCounts.get(pageLastmod(p)) || 0) + 1);
  const suspicious = new Set([...pageCounts].filter(([, c]) => fresh.length >= opts.minPagesForSafety && c / fresh.length > opts.maxPageDateShare).map(([d]) => d));
  for (const d of suspicious) report.warnings.push(`page JSON-LD/meta date ${d} is on ${pageCounts.get(d)}/${fresh.length} new pages (> ${opts.maxPageDateShare}): treated as a template default, not used as lastmod evidence`);
  const pageDatesOf = (p) => (p.dates ? { ...p.dates, distrustLastmod: suspicious.has(pageLastmod(p)) } : null);
  const resolve = (page) => resolveNewDates(page.path, { mode, buildDate, imports, seedDate, seedCtx, pageDates: pageDatesOf(page), distrustDates, earliestDate: opts.earliestDate });
  const urls = {};
  for (const page of pages) {
    const old = prev[page.path];
    let entry;
    if (old && old.removed) report.reappeared++;
    if (old && isPlanned(old)) {
      report.planned++;
      if (mode === 'live') entry = { hash: page.hash, firstSeen: old.firstSeen ?? buildDate, lastmod: old.lastmod ?? old.firstSeen ?? buildDate };
      else {
        const dates = await resolve(page);
        entry = { hash: page.hash, firstSeen: dates.firstSeen, lastmod: dates.lastmod };
        report.newVia[dates.via] = (report.newVia[dates.via] || 0) + 1;
      }
      report.new++;
    } else if (old) {
      entry = { hash: page.hash, firstSeen: old.firstSeen ?? null, lastmod: old.lastmod ?? null };
      if (!old.hash) {
        // Imported seed entry (`ledger import`): its dates are trusted; fill a missing field from evidence off a live prior.
        if ((!entry.firstSeen || !entry.lastmod) && mode !== 'live') {
          const filled = await resolveNewDates(page.path, { mode: 'bootstrap', buildDate, imports, seedDate, seedCtx, pageDates: pageDatesOf(page), distrustDates, earliestDate: opts.earliestDate });
          entry.firstSeen = entry.firstSeen || filled.firstSeen;
          entry.lastmod = entry.lastmod || filled.lastmod || entry.firstSeen;
        }
        report.unchanged++;
      } else if (old.hash !== page.hash) {
        if (rebaseline) report.rebaselined++;
        else { entry.lastmod = buildDate; report.changed++; }
      } else report.unchanged++;
    } else {
      const dates = await resolve(page);
      entry = { hash: page.hash, firstSeen: dates.firstSeen, lastmod: dates.lastmod };
      report.new++;
      report.newVia[dates.via] = (report.newVia[dates.via] || 0) + 1;
    }
    if (page.title) entry.title = page.title;
    urls[page.path] = entry;
  }
  for (const [path, old] of Object.entries(prev)) {
    if (urls[path]) continue;
    if (!old.hash && !old.planned) continue; // imported seed entry for a page this site no longer builds
    // A planned route that was not built is tombstoned with its planned dates, so the next `prepare` reuses them
    // instead of planning it as brand new (and putting it at the top of latest.json) on every build.
    const removed = old.removed || buildDate;
    if (daysBetween(removed, buildDate) > opts.pruneRemovedDays) { report.pruned++; continue; }
    if (!old.removed) report.removed++;
    urls[path] = { ...old, removed };
  }
  const sorted = Object.fromEntries(Object.keys(urls).sort().map((k) => [k, urls[k]]));
  const ledger = {
    version: LEDGER_VERSION,
    generatedAt: new Date().toISOString(),
    buildDate,
    meta: { generator, origin, hashConfig: hashConfig || null, priorSource, mode, ...(prior?.meta?.fetch ? { priorFetch: prior.meta.fetch } : {}) },
    urls: sorted,
  };
  return { ledger, report };
}

// ---------------------------------------------------------------- check

/** Share of URLs on the single most common lastmod date. `paths` restricts the check (e.g. to sitemap URLs). */
export function dateStats(dates) {
  const counts = new Map();
  let dated = 0;
  for (const d of dates) if (d) { dated++; counts.set(d, (counts.get(d) || 0) + 1); }
  let topDate = null;
  let topCount = 0;
  for (const [d, c] of counts) if (c > topCount || (c === topCount && d > topDate)) { topDate = d; topCount = c; }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1)).slice(0, 5).map(([date, count]) => ({ date, count }));
  return {
    urls: dates.length, dated, undated: dates.length - dated, distinctDates: counts.size, topDate, topCount,
    topShareOfDated: dated ? +(topCount / dated).toFixed(4) : 0, topShareOfAll: dates.length ? +(topCount / dates.length).toFixed(4) : 0, top,
  };
}

export function checkLedger(ledger, { paths } = {}) {
  const keys = paths ? [...paths] : Object.keys(ledger.urls).filter((k) => !ledger.urls[k].removed);
  const missing = keys.filter((k) => !lookup(ledger, k));
  const stats = dateStats(keys.map((k) => lookup(ledger, k)?.lastmod || null));
  const firstSeen = keys.map((k) => lookup(ledger, k)?.firstSeen).filter(Boolean).sort();
  return { ...stats, missingFromLedger: missing.length, missingExamples: missing.slice(0, 10), newestFirstSeen: firstSeen.at(-1) || null,
    changedOnBuildDate: ledger.buildDate ? keys.filter((k) => lookup(ledger, k)?.lastmod === ledger.buildDate).length : null };
}
