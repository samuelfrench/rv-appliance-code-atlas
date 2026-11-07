#!/usr/bin/env node
// canonical: explorer-pipeline seo 4f501cb5dd1e seo/cli.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// explorer-pipeline seo template CLI. Run `node cli.mjs help` for the command list; seo/README.md has the recipes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAdapter, seedContext } from './lib/adapter.mjs';
import { canonicalContent, DEFAULT_CONTENT_SELECTORS, hashConfigId, contentHash } from './lib/content.mjs';
import { DEFAULT_LEDGER_PATH, fetchPriorLedger, warn } from './lib/fetch-ledger.mjs';
import { CHECKS, formatGuardReport, guardSitemap } from './lib/guard.mjs';
import { parseHtml } from './lib/html.mjs';
import { PROVENANCE_FILE, sha256, stripHeader } from './lib/provenance.mjs';
import { checkLedger, dateStats, importLegacy, readLedgerFile, todayIn, updateLedger, validateLedger } from './lib/ledger.mjs';
import { diffLatest, planLatest, withPlanned } from './lib/latest.mjs';
import { fileForPath, hrefOf, normalizePath } from './lib/paths.mjs';
import { scanDist } from './lib/scan.mjs';
import { injectLastmod, parseSitemap, readSitemapUrls, updateIndexLastmod } from './lib/sitemap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const HELP = `explorer-pipeline seo template

Composite (what a site's build calls):
  prepare   before render: fetch the live ledger (fallback: committed seed), plan latest.json for this build's routes
            --origin URL --routes FILE... --latest-out FILE --prior-out FILE [--fallback FILE]... [--import FILE]...
            [--adapter FILE] [--n 8] [--per-section 8] [--ledger-path ${DEFAULT_LEDGER_PATH} | --ledger-url URL] [--offline] [--build-date D]
  finalize  after render: ledger update -> <dist>/seo/content-dates.json, sitemap lastmod, latest verify, guard, top-date check
            --dist DIR --prior FILE [--sitemap FILE]... [--out FILE] [--lastmod] [--unknown remove|keep] [--latest FILE]
            [--guard warn|fail|off] [--max-violations N] [--min-words 150] [--checks LIST] [--max-depth N]
            [--max-top-share X] [--mass-change rebaseline|accept] [--ledger-scope all|sitemap] [--report FILE]
            [--adapter FILE] [--origin URL] [--strict]

Ledger:
  ledger fetch    --origin URL [--ledger-url URL] [--fallback FILE]... --out FILE [--require-live] [--offline]
  ledger update   --dist DIR --out FILE --origin URL [--prior FILE] [--sitemap FILE]... [--ledger-scope all|sitemap]
                  [--import FILE]... [--adapter FILE] [--report FILE]
  ledger check    --ledger FILE|URL [--sitemap FILE|URL]... [--max-top-share X] [--json]
  ledger explain  --dist DIR --path /x --origin URL [--adapter FILE]   print the exact text that is hashed for one page
  ledger import   --from FILE... --out FILE                 convert cigar/beer/hot-sauce/plain ledgers into a seed
Sitemap:
  sitemap lastmod --sitemap FILE... --ledger FILE [--dist DIR] [--unknown remove|keep]   rewrite <lastmod> in place
  sitemap check   --sitemap FILE|URL [--max-top-share X] [--json]                       lastmod distribution
Latest:
  latest build    --ledger FILE --routes FILE... --out FILE [--prior-out FILE] [--adapter FILE] [--n 8] [--per-section 8]
  latest verify   --latest FILE --ledger FILE --routes FILE... [--adapter FILE] [--strict]
Guard:
  guard           --dist DIR --sitemap FILE... --origin URL [--min-words 150] [--checks ${CHECKS.join(',')}[,reachable]]
                  [--max-violations N | --warn] [--max-depth N] [--report FILE] [--adapter FILE]
Vendored copy:
  self-check      exit 1 when a vendored file was edited (run it in the site's CI)
After deploy:
  verify-live     --origin URL [--adapter FILE] [--sitemap-path /sitemap.xml] [--max-top-share 0.5] [--siblings 1] [--home-n N]

Seeding (prepare, finalize, ledger update, latest build): --import FILE (existing site ledger), --adapter seedDate(),
the page's JSON-LD dates (dropped when one dateModified sits on most new pages), --distrust-date D (repeatable: a known
placeholder such as a launch-date floor is never used as evidence).
Exit codes: 0 ok, 1 a check failed, 2 usage or input error, 3 required source unavailable.
Dates use --build-date, else $SEO_BUILD_DATE, else today in --tz (default America/New_York).`;

// ------------------------------------------------------------------ args

const REPEATABLE = new Set(['fallback', 'import', 'routes', 'sitemap', 'from', 'checks', 'distrust-date']);
const BOOLEAN = new Set(['offline', 'require-live', 'json', 'lastmod', 'warn', 'strict', 'help', 'quiet']);

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) { args._.push(token); continue; }
    let [name, value] = token.slice(2).split(/=(.*)/s, 2);
    if (BOOLEAN.has(name)) { args[name] = value === undefined ? true : value !== 'false'; continue; }
    if (value === undefined) {
      value = argv[++i];
      if (value === undefined) throw new UsageError(`--${name} needs a value`);
    }
    if (REPEATABLE.has(name)) (args[name] ||= []).push(...(name === 'checks' ? value.split(',') : [value]));
    else args[name] = value;
  }
  return args;
}

class UsageError extends Error {}

function need(args, ...names) {
  for (const n of names) if (args[n] === undefined || (Array.isArray(args[n]) && !args[n].length)) throw new UsageError(`missing --${n}`);
}

function num(value, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new UsageError(`not a number: ${value}`);
  return n;
}

function buildDateOf(args) {
  const date = args['build-date'] || process.env.SEO_BUILD_DATE || todayIn(args.tz || 'America/New_York');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UsageError(`bad build date ${date}`);
  return date;
}

function writeJson(file, data) {
  mkdirSync(dirname(resolve(file)), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function templateSha() {
  const provenance = join(HERE, 'SEO-TEMPLATE.json');
  if (existsSync(provenance)) { try { return readJson(provenance).sha?.slice(0, 12) || 'unknown'; } catch { return 'unknown'; } }
  return 'canonical';
}

async function context(args) {
  const adapter = await loadAdapter(args.adapter);
  const origin = (args.origin || adapter.origin || '').replace(/\/+$/, '') || null;
  const contentSelectors = adapter.contentSelectors || DEFAULT_CONTENT_SELECTORS;
  const buildDate = buildDateOf(args);
  const imports = (args.import || []).map((file) => {
    const { shape, entries } = importLegacy(readJson(file), { label: basename(file) });
    console.error(`[seo] import ${file}: ${shape} shape, ${entries.size} dated URLs`);
    return entries;
  });
  const seedCtx = seedContext({ buildDate, repoRoot: args['repo-root'] || process.cwd() });
  const normalizeId = adapter.normalizeText ? String(adapter.normalizeId || 'adapter') : '';
  const distrustDates = [...(args['distrust-date'] || []), ...(adapter.distrustDates || [])];
  for (const d of distrustDates) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new UsageError(`bad --distrust-date ${d}`);
  return { adapter, origin, contentSelectors, buildDate, imports, seedCtx, distrustDates, hashConfig: hashConfigId({ contentSelectors, normalizeId, origin }) };
}

/** Route list: sitemap XML, JSON (array of strings or {path|href|loc,title}, or a latest/ledger-like object), or text. */
async function readRoutes(files, adapter, dist) {
  if (!files?.length) {
    if (typeof adapter.routes === 'function') return await adapter.routes();
    throw new UsageError('missing --routes (or an adapter routes() function)');
  }
  const out = [];
  for (const file of files) {
    if (file === 'adapter') { out.push(...(await adapter.routes())); continue; }
    const text = readFileSync(file, 'utf8');
    if (/^\s*</.test(text)) out.push(...readSitemapUrls(file, { dist }));
    else if (/^\s*[[{]/.test(text)) {
      const data = JSON.parse(text);
      out.push(...(Array.isArray(data) ? data : Array.isArray(data.routes) ? data.routes : Object.keys(data.urls || data.routes || {})));
    } else out.push(...text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
  }
  return out;
}

function hrefMap(entries) {
  const map = new Map();
  for (const e of entries) { const p = normalizePath(e.loc); if (p && !map.has(p)) map.set(p, hrefOf(e.loc)); }
  return map;
}

async function readText(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { headers: { 'user-agent': 'explorer-seo-template/1 (check)' }, signal: AbortSignal.timeout(30000) });
    if (res.status !== 200) throw new Error(`${source}: HTTP ${res.status}`);
    return res.text();
  }
  return readFileSync(source, 'utf8');
}

/** Sitemap entries from files or URLs, following sitemap indexes (over the network for URLs). */
async function sitemapEntries(sources, { dist } = {}) {
  const out = [];
  const queue = [...sources];
  const seen = new Set();
  while (queue.length) {
    const source = queue.shift();
    if (seen.has(source)) continue;
    seen.add(source);
    if (!/^https?:\/\//.test(source)) { out.push(...readSitemapUrls(source, { dist })); continue; }
    const parsed = parseSitemap(await readText(source));
    if (parsed.kind === 'sitemapindex') queue.push(...parsed.entries.map((e) => e.loc));
    else out.push(...parsed.entries);
  }
  return out;
}

// ------------------------------------------------------------------ commands

async function cmdLedgerFetch(args) {
  need(args, 'out');
  const ctx = await context(args);
  const { ledger, source } = await fetchPriorLedger({ origin: ctx.origin, path: args['ledger-path'] || DEFAULT_LEDGER_PATH, url: args['ledger-url'] || null,
    fallbacks: args.fallback || [], timeoutMs: num(args.timeout, 20000), offline: args.offline });
  writeJson(args.out, ledger);
  console.error(`[seo] prior ledger: ${source}, ${Object.keys(ledger.urls).length} URLs -> ${args.out}`);
  if (args['require-live'] && source !== 'live') return 3;
  return 0;
}

/**
 * Ledger universe: every built page except meta-refresh redirect stubs (--ledger-scope all, the default), or only
 * sitemap URLs (--ledger-scope sitemap). With a sitemap, the safety shares are measured on sitemap URLs either way.
 */
async function doUpdate(args, ctx, scan, sitemapList) {
  const prior = args.prior && existsSync(args.prior) ? readLedgerFile(args.prior) : null;
  if (args.prior && !prior) warn(`--prior ${args.prior} not found: bootstrap run`);
  const scope = args['ledger-scope'] || 'all';
  if (!['all', 'sitemap'].includes(scope)) throw new UsageError(`--ledger-scope must be all or sitemap`);
  if (scope === 'sitemap' && !sitemapList) throw new UsageError('--ledger-scope sitemap needs --sitemap');
  const sitemapPaths = sitemapList ? new Set(sitemapList.map((e) => normalizePath(e.loc))) : null;
  const pages = [];
  for (const page of scan.pages.values()) {
    if (page.refresh) continue;
    if (scope === 'sitemap' && !sitemapPaths.has(page.path)) continue;
    pages.push({ path: page.path, hash: page.hash, title: page.title, dates: page.dates });
  }
  const { ledger, report } = await updateLedger({
    prior, pages, buildDate: ctx.buildDate, hashConfig: ctx.hashConfig, imports: ctx.imports, seedDate: ctx.adapter.seedDate,
    seedCtx: ctx.seedCtx, origin: ctx.origin, generator: `explorer-pipeline/seo ${templateSha()}`,
    options: { ...(args['mass-change'] ? { massChange: args['mass-change'] } : {}), distrustDates: ctx.distrustDates, safetyPaths: sitemapPaths },
  });
  for (const w of report.warnings) warn(w);
  console.error(`[seo] ledger update (${report.mode}, prior ${report.priorSource}): ${report.pages} pages; unchanged ${report.unchanged}, changed ${report.changed}, `
    + `new ${report.new} ${JSON.stringify(report.newVia)}, planned ${report.planned}, rebaselined ${report.rebaselined}, removed ${report.removed}, pruned ${report.pruned}`);
  return { ledger, report };
}

async function cmdLedgerUpdate(args) {
  need(args, 'dist', 'out');
  const ctx = await context(args);
  if (!ctx.origin) throw new UsageError('missing --origin (or adapter origin): same-site links are hashed as paths, so hashes depend on it');
  const entries = args.sitemap ? await sitemapEntries(args.sitemap, { dist: args.dist }) : null;
  const scan = scanDist(args.dist, { origin: ctx.origin, contentSelectors: ctx.contentSelectors, normalizeText: ctx.adapter.normalizeText, ignoreFiles: ctx.adapter.ignoreFiles, hrefs: entries ? hrefMap(entries) : undefined });
  const { ledger, report } = await doUpdate(args, ctx, scan, entries);
  writeJson(args.out, ledger);
  if (args.report) writeJson(args.report, report);
  return 0;
}

function printDateStats(label, stats, maxShare, json) {
  if (json) { console.log(JSON.stringify({ label, ...stats }, null, 1)); }
  else {
    console.log(`${label}: ${stats.urls} URLs, ${stats.dated} dated, ${stats.undated} without lastmod, ${stats.distinctDates} distinct dates`);
    console.log(`  most common lastmod ${stats.topDate || '-'}: ${stats.topCount} URLs = ${(stats.topShareOfDated * 100).toFixed(1)}% of dated, ${(stats.topShareOfAll * 100).toFixed(1)}% of all`);
    console.log(`  top dates: ${stats.top.map((t) => `${t.date} ${t.count}`).join(', ')}`);
  }
  if (maxShare !== undefined && stats.topShareOfDated > maxShare) {
    console.error(`[seo] FAIL: ${(stats.topShareOfDated * 100).toFixed(1)}% of dated URLs share ${stats.topDate} (max ${maxShare * 100}%)`);
    return 1;
  }
  return 0;
}

async function cmdLedgerCheck(args) {
  need(args, 'ledger');
  const text = await readText(args.ledger);
  const ledger = JSON.parse(text);
  const problem = validateLedger(ledger);
  if (problem) { console.error(`[seo] ${args.ledger}: ${problem}`); return 2; }
  const paths = args.sitemap ? new Set((await sitemapEntries(args.sitemap)).map((e) => normalizePath(e.loc))) : null;
  const stats = checkLedger(ledger, { paths });
  const code = printDateStats(`ledger ${args.ledger}${paths ? ' (sitemap URLs)' : ''}`, stats, args['max-top-share'] !== undefined ? num(args['max-top-share']) : undefined, args.json);
  if (!args.json) console.log(`  missing from ledger: ${stats.missingFromLedger}; newest firstSeen ${stats.newestFirstSeen}; lastmod on build date ${ledger.buildDate}: ${stats.changedOnBuildDate}`);
  return code;
}

async function cmdLedgerExplain(args) {
  need(args, 'dist', 'path');
  const ctx = await context(args);
  if (!ctx.origin) throw new UsageError('missing --origin (or adapter origin)');
  const file = fileForPath(args.dist, args.path);
  if (!file) { console.error(`[seo] no built file for ${args.path}`); return 2; }
  const doc = parseHtml(readFileSync(join(args.dist, file), 'utf8'));
  const { text, selector } = canonicalContent(doc, { origin: ctx.origin, contentSelectors: ctx.contentSelectors, normalizeText: ctx.adapter.normalizeText, path: normalizePath(args.path) });
  console.log(`file ${file}\nselector ${selector}\nhash ${contentHash(text)}\nconfig ${ctx.hashConfig}\n---\n${text}`);
  return 0;
}

async function cmdLedgerImport(args) {
  need(args, 'from', 'out');
  const urls = {};
  for (const file of args.from) {
    const { shape, entries } = importLegacy(readJson(file), { label: file });
    let added = 0;
    for (const [path, e] of entries) if (!urls[path]) { urls[path] = { hash: null, firstSeen: e.firstSeen, lastmod: e.lastmod }; added++; }
    console.error(`[seo] ${file}: ${shape}, ${entries.size} dated URLs, ${added} added`);
  }
  const sorted = Object.fromEntries(Object.keys(urls).sort().map((k) => [k, urls[k]]));
  writeJson(args.out, { version: 1, generatedAt: new Date().toISOString(), buildDate: null, meta: { generator: `explorer-pipeline/seo ${templateSha()}`, importedFrom: args.from }, urls: sorted });
  const stats = dateStats(Object.values(sorted).map((e) => e.lastmod));
  printDateStats(`seed ${args.out}`, stats);
  return 0;
}

/** Rewrite <lastmod> in sitemap files from the ledger; index files get the newest child date. */
function applyLastmod(files, ledger, { dist, unknown }) {
  const childDates = new Map();
  const indexes = [];
  const totals = { urls: 0, set: 0, removed: 0, kept: 0 };
  const queue = [...files];
  const seen = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const xml = readFileSync(file, 'utf8');
    const parsed = parseSitemap(xml);
    if (parsed.kind === 'sitemapindex') {
      indexes.push({ file, xml });
      for (const entry of parsed.entries) {
        let child = null;
        try { child = join(dist || dirname(file), new URL(entry.loc).pathname); } catch { /* skip */ }
        if (child && existsSync(child)) { queue.push(child); childDates.set(child, entry.loc); }
      }
      continue;
    }
    const { xml: next, stats } = injectLastmod(xml, ledger, { unknown });
    writeFileSync(file, next);
    for (const k of Object.keys(totals)) totals[k] += stats[k];
    const newest = parseSitemap(next).entries.map((e) => e.lastmod).filter(Boolean).sort().at(-1);
    if (childDates.has(file) && newest) childDates.set(childDates.get(file), newest);
  }
  for (const { file, xml } of indexes) writeFileSync(file, updateIndexLastmod(xml, childDates));
  console.error(`[seo] sitemap lastmod: ${totals.urls} URLs, ${totals.set} set from ledger, ${totals.removed} unknown dates removed, ${totals.kept} kept`);
  return totals;
}

async function cmdSitemapLastmod(args) {
  need(args, 'sitemap', 'ledger');
  applyLastmod(args.sitemap, readLedgerFile(args.ledger), { dist: args.dist, unknown: args.unknown || 'remove' });
  return 0;
}

async function cmdSitemapCheck(args) {
  need(args, 'sitemap');
  const entries = await sitemapEntries(args.sitemap);
  return printDateStats(`sitemap ${args.sitemap.join(' ')}`, dateStats(entries.map((e) => (e.lastmod || '').slice(0, 10) || null)),
    args['max-top-share'] !== undefined ? num(args['max-top-share']) : undefined, args.json);
}

async function cmdLatestBuild(args) {
  need(args, 'ledger', 'out');
  const ctx = await context(args);
  const ledger = readLedgerFile(args.ledger);
  const routes = await readRoutes(args.routes, ctx.adapter, args.dist);
  return writeLatest(args, ctx, ledger, routes);
}

async function writeLatest(args, ctx, ledger, routes) {
  const { latest, planned } = await planLatest({ ledger, routes, buildDate: ctx.buildDate, adapter: ctx.adapter,
    n: num(args.n, 8), perSection: num(args['per-section'], 8), imports: ctx.imports, seedCtx: ctx.seedCtx, distrustDates: new Set(ctx.distrustDates) });
  writeJson(args.out || args['latest-out'], latest);
  if (args['prior-out']) writeJson(args['prior-out'], withPlanned(ledger, planned));
  console.error(`[seo] latest: ${latest.site.length} site-wide, ${Object.keys(latest.sections).length} sections; ${Object.keys(planned).length} routes new to the ledger (${latest.priorSource} prior) -> ${args.out || args['latest-out']}`);
  return 0;
}

async function cmdPrepare(args) {
  need(args, 'latest-out', 'prior-out');
  const ctx = await context(args);
  const { ledger } = await fetchPriorLedger({ origin: ctx.origin, path: args['ledger-path'] || DEFAULT_LEDGER_PATH, url: args['ledger-url'] || null, fallbacks: args.fallback || [],
    timeoutMs: num(args.timeout, 20000), offline: args.offline });
  let routes;
  try { routes = await readRoutes(args.routes, ctx.adapter, args.dist); }
  catch (error) {
    if (error instanceof UsageError) throw error;
    warn(`route list unreadable (${error.message}): latest.json uses only pages the prior ledger knows`);
    routes = Object.keys(ledger.urls).filter((k) => !ledger.urls[k].removed);
  }
  return writeLatest(args, ctx, ledger, routes);
}

async function verifyLatest(latestFile, ledger, routes, ctx, strict) {
  const expected = readJson(latestFile);
  const { latest: actual } = await planLatest({ ledger, routes, buildDate: ctx.buildDate, adapter: ctx.adapter, n: expected.n || 8, perSection: expected.perSection || 8, planNew: false });
  const diff = diffLatest(actual, expected);
  if (diff.ok) console.error(`[seo] latest verify: ${latestFile} matches the final ledger (${actual.site.length} site-wide items)`);
  else {
    const list = (o) => Object.entries(o).map(([s, l]) => `${s}: ${l.join(' ')}`).join('; ') || '-';
    if (diff.siteMissing.length || Object.keys(diff.sectionsMissing).length) {
      warn(`latest verify: pages the final ledger ranks newest but ${latestFile} lacks: site ${diff.siteMissing.join(' ') || '-'}; sections ${list(diff.sectionsMissing)}`);
    }
    if (diff.siteExtra.length || Object.keys(diff.sectionsExtra).length) {
      warn(`latest verify: ${latestFile} links pages the final ledger does not rank there (not built, or re-dated after render): site ${diff.siteExtra.join(' ') || '-'}; sections ${list(diff.sectionsExtra)}`);
    }
  }
  return diff.ok || !strict ? 0 : 1;
}

async function cmdLatestVerify(args) {
  need(args, 'latest', 'ledger');
  const ctx = await context(args);
  const ledger = readLedgerFile(args.ledger);
  const routes = await readRoutes(args.routes, ctx.adapter, args.dist);
  return verifyLatest(args.latest, ledger, routes, ctx, args.strict);
}

function guardOptions(args, ctx) {
  const checks = args.checks?.length ? args.checks : CHECKS;
  for (const c of checks) if (![...CHECKS, 'reachable'].includes(c)) throw new UsageError(`unknown check ${c}`);
  return {
    minWords: num(args['min-words'], ctx.adapter.minWords ?? 150),
    checks,
    exempt: ctx.adapter.guardExempt || (() => false),
    maxDepth: args['max-depth'] !== undefined ? num(args['max-depth']) : null,
  };
}

function guardExit(report, args, mode) {
  if (args.report) writeJson(args.report, report);
  const limit = num(args['max-violations'], 0);
  if (mode === 'warn' || args.warn) {
    if (report.violatingUrls > 0) warn(`sitemap-guard: ${report.violatingUrls} sitemap URL(s) violate (warn mode)`);
    return 0;
  }
  if (report.violatingUrls > limit) {
    console.error(`[seo] FAIL: sitemap-guard ${report.violatingUrls} violating URL(s) > --max-violations ${limit}`);
    return 1;
  }
  return 0;
}

async function cmdGuard(args) {
  need(args, 'dist', 'sitemap');
  const ctx = await context(args);
  if (!ctx.origin) throw new UsageError('missing --origin (or adapter origin)');
  const entries = await sitemapEntries(args.sitemap, { dist: args.dist });
  const scan = scanDist(args.dist, { origin: ctx.origin, contentSelectors: ctx.contentSelectors, normalizeText: ctx.adapter.normalizeText, ignoreFiles: ctx.adapter.ignoreFiles, hrefs: hrefMap(entries) });
  const report = guardSitemap({ sitemapEntries: entries, scan, ...guardOptions(args, ctx) });
  console.log(formatGuardReport(report));
  return guardExit(report, args);
}

async function cmdFinalize(args) {
  need(args, 'dist', 'prior');
  const ctx = await context(args);
  if (!ctx.origin) throw new UsageError('missing --origin (or adapter origin)');
  const out = args.out || join(args.dist, DEFAULT_LEDGER_PATH);
  const entries = args.sitemap ? await sitemapEntries(args.sitemap, { dist: args.dist }) : null;
  const started = Date.now();
  const scan = scanDist(args.dist, { origin: ctx.origin, contentSelectors: ctx.contentSelectors, normalizeText: ctx.adapter.normalizeText, ignoreFiles: ctx.adapter.ignoreFiles, hrefs: entries ? hrefMap(entries) : undefined });
  console.error(`[seo] scanned ${scan.pages.size} built pages in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  const { ledger, report } = await doUpdate(args, ctx, scan, args['ledger-scope'] === 'sitemap' ? entries : null);
  writeJson(out, ledger);
  let code = 0;
  if (args.lastmod && args.sitemap) applyLastmod(args.sitemap, ledger, { dist: args.dist, unknown: args.unknown || 'remove' });
  const paths = entries ? new Set(entries.map((e) => normalizePath(e.loc))) : null;
  const stats = checkLedger(ledger, { paths });
  code = Math.max(code, printDateStats('lastmod', stats, args['max-top-share'] !== undefined ? num(args['max-top-share']) : undefined, false));
  if (args.latest) {
    const latestOut = join(args.dist, 'seo', 'latest.json');
    if (existsSync(args.latest)) {
      mkdirSync(dirname(latestOut), { recursive: true });
      writeFileSync(latestOut, readFileSync(args.latest));
      if (entries) code = Math.max(code, await verifyLatest(args.latest, ledger, entries, ctx, args.strict));
    } else warn(`--latest ${args.latest} not found`);
  }
  let guard = null;
  const mode = args.guard || 'warn';
  if (mode !== 'off') {
    if (!entries) warn('guard skipped: no --sitemap');
    else {
      guard = guardSitemap({ sitemapEntries: entries, scan, ...guardOptions(args, ctx) });
      console.log(formatGuardReport(guard));
      code = Math.max(code, guardExit(guard, { ...args, report: undefined }, mode));
    }
  }
  if (args.report) writeJson(args.report, { ledger: report, lastmod: stats, guard });
  return code;
}

async function cmdVerifyLive(args) {
  const ctx = await context(args);
  if (!ctx.origin) throw new UsageError('missing --origin (or adapter origin)');
  const ua = { 'user-agent': 'explorer-seo-template/1 (verify-live)' };
  const get = async (path) => {
    const res = await fetch(new URL(path, `${ctx.origin}/`), { headers: ua, signal: AbortSignal.timeout(30000) });
    return { status: res.status, text: res.status === 200 ? await res.text() : '' };
  };
  let failures = 0;
  const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };
  const ledgerRes = await get(DEFAULT_LEDGER_PATH);
  console.log(`ledger ${DEFAULT_LEDGER_PATH}: HTTP ${ledgerRes.status}`);
  let ledger = null;
  try { ledger = ledgerRes.status === 200 ? JSON.parse(ledgerRes.text) : null; } catch { ledger = null; }
  if (!ledger || validateLedger(ledger)) fail('live ledger missing or invalid');
  else console.log(`  ${Object.keys(ledger.urls).length} URLs, buildDate ${ledger.buildDate}, mode ${ledger.meta?.mode}, prior ${ledger.meta?.priorSource}`);
  const sitemapUrl = new URL(args['sitemap-path'] || '/sitemap.xml', `${ctx.origin}/`).toString();
  const entries = await sitemapEntries([sitemapUrl]);
  const stats = dateStats(entries.map((e) => (e.lastmod || '').slice(0, 10) || null));
  if (printDateStats(`live sitemap ${sitemapUrl}`, stats, num(args['max-top-share'], 0.5), false)) failures++;
  const latestRes = await get('/seo/latest.json');
  if (latestRes.status !== 200) { fail(`/seo/latest.json HTTP ${latestRes.status}`); return failures ? 1 : 0; }
  const latest = JSON.parse(latestRes.text);
  const linksIn = (html) => new Set([...html.matchAll(/<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)]
    .map((m) => { try { return normalizePath(new URL(m[1] ?? m[2] ?? m[3], `${ctx.origin}/`).pathname); } catch { return null; } }).filter(Boolean));
  const home = await get('/');
  const homeLinks = linksIn(home.text);
  const homeItems = latest.site.slice(0, num(args['home-n'], latest.site.length));
  const missingHome = homeItems.filter((i) => !homeLinks.has(normalizePath(i.href)));
  console.log(`homepage: ${homeItems.length - missingHome.length}/${homeItems.length} site-wide latest pages linked in raw HTML`);
  missingHome.forEach((i) => fail(`homepage does not link ${i.href}`));
  const hubPath = ctx.adapter.hubPath || ((s) => `/${s}`);
  for (const [section, items] of Object.entries(latest.sections)) {
    const hub = await get(hubPath(section));
    if (hub.status !== 200) { console.log(`section ${section}: hub ${hubPath(section)} HTTP ${hub.status} (set adapter hubPath)`); continue; }
    const hubLinks = linksIn(hub.text);
    const missing = items.filter((i) => !hubLinks.has(normalizePath(i.href)));
    console.log(`section ${section}: hub ${hubPath(section)} links ${items.length - missing.length}/${items.length}`);
    missing.forEach((i) => fail(`hub ${hubPath(section)} does not link ${i.href}`));
    for (const sibling of items.slice(1, 1 + num(args.siblings, 1))) {
      const page = await get(sibling.href);
      const want = items.filter((i) => i.href !== sibling.href).slice(0, 5);
      const links = linksIn(page.text);
      const gap = want.filter((i) => !links.has(normalizePath(i.href)));
      console.log(`  sibling ${sibling.href}: links ${want.length - gap.length}/${want.length} of the section's newest pages`);
      gap.forEach((i) => fail(`sibling ${sibling.href} does not link ${i.href}`));
    }
  }
  console.log(failures ? `verify-live: ${failures} failure(s)` : 'verify-live: ok');
  return failures ? 1 : 0;
}

/** Vendored copies only: fail when a file differs from what SEO-TEMPLATE.json recorded (someone edited the copy). */
async function cmdSelfCheck() {
  const provenanceFile = join(HERE, PROVENANCE_FILE);
  if (!existsSync(provenanceFile)) { console.log('self-check: not a vendored copy (no SEO-TEMPLATE.json); nothing to check'); return 0; }
  const provenance = readJson(provenanceFile);
  const bad = [];
  for (const [rel, recorded] of Object.entries(provenance.files || {})) {
    const file = join(HERE, rel);
    if (!existsSync(file)) bad.push(`${rel} (missing)`);
    else if (sha256(stripHeader(readFileSync(file, 'utf8')).text) !== recorded) bad.push(`${rel} (edited)`);
  }
  console.log(`self-check: explorer-pipeline seo ${String(provenance.sha).slice(0, 12)}, ${Object.keys(provenance.files || {}).length} files, ${bad.length} problem(s)${bad.length ? `: ${bad.join(', ')}` : ''}`);
  if (bad.length) console.log('  fix the change in explorer-pipeline/seo and re-vendor: node seo/vendor.mjs --repo <site> --dest <this dir>');
  return bad.length ? 1 : 0;
}

const COMMANDS = {
  'self-check': cmdSelfCheck,
  prepare: cmdPrepare, finalize: cmdFinalize, guard: cmdGuard, 'verify-live': cmdVerifyLive,
  'ledger fetch': cmdLedgerFetch, 'ledger update': cmdLedgerUpdate, 'ledger check': cmdLedgerCheck, 'ledger explain': cmdLedgerExplain, 'ledger import': cmdLedgerImport,
  'sitemap lastmod': cmdSitemapLastmod, 'sitemap check': cmdSitemapCheck, 'latest build': cmdLatestBuild, 'latest verify': cmdLatestVerify,
};

export async function main(argv) {
  let args;
  try { args = parseArgs(argv); } catch (error) { console.error(error.message); return 2; }
  const [a, b] = args._;
  const name = COMMANDS[`${a} ${b}`] ? `${a} ${b}` : a;
  if (!name || args.help || name === 'help' || !COMMANDS[name]) { console.log(HELP); return name && !COMMANDS[name] && name !== 'help' ? 2 : 0; }
  try { return await COMMANDS[name](args); }
  catch (error) {
    if (error instanceof UsageError) { console.error(`[seo] ${name}: ${error.message}\n\n${HELP}`); return 2; }
    console.error(`[seo] ${name} failed: ${error.stack || error.message}`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
