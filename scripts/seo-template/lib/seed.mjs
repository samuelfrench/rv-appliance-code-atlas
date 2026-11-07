// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/seed.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Seed-date helpers for adapters: real evidence for pages the prior ledger does not know (bootstrap and fallback runs).
import { execFileSync } from 'node:child_process';
import { isoDate } from './content.mjs';

const shallowCache = new Map();

/** True when the checkout is a shallow clone (CI fetch-depth 1): every file's git date would be the HEAD date. */
export function isShallow(cwd = process.cwd()) {
  if (!shallowCache.has(cwd)) {
    let shallow = true;
    try { shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd, encoding: 'utf8' }).trim() !== 'false'; } catch { shallow = true; }
    shallowCache.set(cwd, shallow);
  }
  return shallowCache.get(cwd);
}

function git(args, cwd) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 }).trim(); } catch { return ''; }
}

let shallowWarned = false;
function guardShallow(cwd, allowShallow) {
  if (allowShallow || !isShallow(cwd)) return true;
  if (!shallowWarned) {
    console.error(`[seo] WARNING: ${cwd} is a shallow git clone; git seed dates are disabled (they would all be the HEAD date). Use fetch-depth: 0 for a seeding run.`);
    shallowWarned = true;
  }
  return false;
}

/** `git log -1 --format=%cs -- <files>`: the last commit date touching any of the files, or null. */
export function gitLastDate(files, { cwd = process.cwd(), allowShallow = false } = {}) {
  const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
  if (!list.length || !guardShallow(cwd, allowShallow)) return null;
  return isoDate(git(['log', '-1', '--format=%cs', '--', ...list], cwd)) || null;
}

/** First commit date that added any of the files (`--diff-filter=A`), or null. */
export function gitFirstDate(files, { cwd = process.cwd(), allowShallow = false } = {}) {
  const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
  if (!list.length || !guardShallow(cwd, allowShallow)) return null;
  const out = git(['log', '--diff-filter=A', '--format=%cs', '--', ...list], cwd).split('\n').map(isoDate).filter(Boolean).sort();
  return out[0] || null;
}

/** {firstSeen, lastmod} from git for an adapter's seedDate(): first-added and last-changed dates of the page's source files. */
export function gitDates(files, opts = {}) {
  const lastmod = gitLastDate(files, opts);
  if (!lastmod) return null;
  return { firstSeen: gitFirstDate(files, opts) || null, lastmod };
}
