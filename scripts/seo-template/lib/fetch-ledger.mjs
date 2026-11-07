// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/fetch-ledger.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Load the prior ledger for a build: the copy published with the live site first, then committed fallbacks.
// Never fabricates dates: when nothing loads, the result is an empty ledger with source "none", and ledger update
// switches to bootstrap rules (evidence dates or no date at all).
import { existsSync, readFileSync } from 'node:fs';
import { validateLedger } from './ledger.mjs';

export const DEFAULT_LEDGER_PATH = '/seo/content-dates.json';

export function warn(message) {
  console.error(`[seo] WARNING: ${message}`);
  if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning title=seo-template::${message.replace(/\r?\n/g, ' ')}`);
}

async function fetchLive(url, { timeoutMs, fetchImpl }) {
  // A referenced timer (AbortSignal.timeout's is unref'd on Node 20) so the timeout always fires and the process waits for it.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(Object.assign(new Error(`timeout after ${timeoutMs} ms`), { name: 'TimeoutError' })), timeoutMs);
  let response;
  let text;
  try {
    response = await fetchImpl(url, {
      headers: { 'user-agent': 'explorer-seo-template/1 (prior ledger fetch)', accept: 'application/json', 'cache-control': 'no-cache' },
      signal: controller.signal,
      redirect: 'follow',
    });
    text = response.status === 200 ? await response.text() : '';
  } catch (error) {
    return { error: `fetch failed: ${error.name === 'TimeoutError' ? `timeout after ${timeoutMs} ms` : error.message}` };
  } finally {
    clearTimeout(timer);
  }
  if (response.status !== 200) return { error: `HTTP ${response.status}` };
  let data;
  try { data = JSON.parse(text); } catch { return { error: `not JSON (content-type ${response.headers.get('content-type') || 'none'}; an SPA fallback page?)` }; }
  const problem = validateLedger(data);
  if (problem) return { error: `invalid ledger: ${problem}` };
  if (Object.keys(data.urls).length === 0) return { error: 'ledger has no urls' };
  return { data };
}

function loadFile(file) {
  if (!existsSync(file)) return { error: 'file not found' };
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (error) { return { error: `not JSON: ${error.message}` }; }
  const problem = validateLedger(data);
  return problem ? { error: problem } : { data };
}

const active = (ledger) => Object.entries(ledger.urls).filter(([, e]) => !e.removed);

/**
 * {ledger, source: 'live'|'fallback'|'none', attempts}. The returned ledger carries meta.fetch = {source, url, fetchedAt, ...}
 * so later steps know whether a missing path means "new in this release" (live) or "unknown" (fallback/none).
 */
export async function fetchPriorLedger({ origin, path = DEFAULT_LEDGER_PATH, url: ledgerUrl = null, fallbacks = [], timeoutMs = 20000, offline = false, fetchImpl = globalThis.fetch } = {}) {
  const attempts = [];
  const fetchedAt = new Date().toISOString();
  let live = null;
  const url = ledgerUrl || (origin ? new URL(path, origin.endsWith('/') ? origin : `${origin}/`).toString() : null);
  if (url && !offline) {
    const result = await fetchLive(url, { timeoutMs, fetchImpl });
    attempts.push({ source: url, ok: !result.error, error: result.error || null });
    if (result.data) live = result.data;
  } else attempts.push({ source: url || '(no origin)', ok: false, error: offline ? 'offline mode' : 'no origin given' });
  let fallback = null;
  let fallbackFile = null;
  for (const file of fallbacks) {
    const result = loadFile(file);
    attempts.push({ source: file, ok: !result.error, error: result.error || null });
    if (result.data && !fallback) { fallback = result.data; fallbackFile = file; }
  }
  if (live) {
    const liveActive = active(live).length;
    const fallbackActive = fallback ? active(fallback).length : 0;
    if (fallback && liveActive < fallbackActive * 0.5) {
      warn(`live ledger ${url} has ${liveActive} active URLs, fewer than half of ${fallbackFile} (${fallbackActive}): merging, live entries win`);
      const urls = { ...fallback.urls, ...live.urls };
      return { ledger: { ...live, urls, meta: { ...(live.meta || {}), fetch: { source: 'live', url, fetchedAt, mergedFallback: fallbackFile } } }, source: 'live', attempts };
    }
    return { ledger: { ...live, meta: { ...(live.meta || {}), fetch: { source: 'live', url, fetchedAt } } }, source: 'live', attempts };
  }
  const liveError = attempts[0]?.error;
  if (fallback) {
    warn(`live ledger unavailable (${attempts[0].source}: ${liveError}); using fallback ${fallbackFile} (${active(fallback).length} URLs). Pages missing from it get evidence dates, then the build date.`);
    return { ledger: { ...fallback, meta: { ...(fallback.meta || {}), fetch: { source: 'fallback', url, fetchedAt, file: fallbackFile, liveError } } }, source: 'fallback', attempts };
  }
  warn(`no prior ledger (live: ${liveError}; fallbacks: ${fallbacks.length ? attempts.slice(1).map((a) => `${a.source}: ${a.error}`).join('; ') : 'none given'}). Bootstrap: new pages get evidence dates or none.`);
  return { ledger: { version: 1, generatedAt: null, buildDate: null, meta: { fetch: { source: 'none', url, fetchedAt, liveError } }, urls: {} }, source: 'none', attempts };
}
