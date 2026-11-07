// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/paths.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// URL path normalization and built-output (dist) file mapping. Works for flat output (dist/foo.html, vite-react-ssg's
// default) and nested output (dist/foo/index.html, static generators); flat wins when both exist, like nginx
// `try_files $uri $uri.html $uri/index.html`.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Ledger key for a URL or path: pathname only, no query/hash, no trailing slash (except "/"), no index.html. */
export function normalizePath(input, origin) {
  if (input === undefined || input === null) return null;
  let value = String(input).trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try { value = new URL(value).pathname; } catch { return null; }
  } else if (origin && value.startsWith(origin)) {
    value = value.slice(origin.length) || '/';
  }
  value = value.split('#')[0].split('?')[0];
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/{2,}/g, '/');
  value = value.replace(/\/index\.html?$/i, '/');
  if (value.length > 1) value = value.replace(/\/+$/, '');
  return value || '/';
}

/** The pathname of an absolute URL exactly as written (keeps a trailing slash): what a link to the page should use. */
export function hrefOf(loc) {
  try { return new URL(loc).pathname; } catch { return String(loc).split('#')[0].split('?')[0]; }
}

// Build artifacts that are not pages: error pages, SPA shells, verification files. Adapters add more with ignoreFiles.
export const DEFAULT_IGNORE_FILES = [/^404\.html$/, /^50x\.html$/, /^200\.html$/, /^spa-fallback\.html$/, /^offline\.html$/,
  /(^|\/)_[^/]*$/, /^google[0-9a-f]+\.html$/, /^BingSiteAuth/i, /^yandex_/];

/** Every built HTML page in dist as [{path, file}] (file relative to dist). Flat foo.html beats foo/index.html. */
export function listPages(dist, { ignoreFiles = DEFAULT_IGNORE_FILES, skipDirs = ['assets', 'node_modules', '.vite'] } = {}) {
  const found = new Map();
  const visit = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (dir === dist && skipDirs.includes(entry.name)) continue;
        visit(full);
        continue;
      }
      if (!/\.html?$/i.test(entry.name)) continue;
      const rel = relative(dist, full).split(sep).join('/');
      if (ignoreFiles.some((re) => re.test(rel))) continue;
      const nested = /(^|\/)index\.html?$/i.test(rel);
      const path = normalizePath('/' + rel.replace(/\.html?$/i, '').replace(/(^|\/)index$/i, '$1'));
      const previous = found.get(path);
      if (!previous || (previous.nested && !nested)) found.set(path, { path, file: rel, nested });
    }
  };
  visit(dist);
  return [...found.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)).map(({ path, file }) => ({ path, file }));
}

/** The dist file that serves a URL path, or null. */
export function fileForPath(dist, path) {
  const key = normalizePath(path);
  if (key === '/') return existsSync(join(dist, 'index.html')) ? 'index.html' : null;
  const base = key.slice(1);
  const candidates = /\.html?$/i.test(base) ? [base] : [`${base}.html`, `${base}/index.html`, base];
  for (const candidate of candidates) {
    const full = join(dist, candidate);
    try { if (statSync(full).isFile()) return candidate; } catch { /* next */ }
  }
  return null;
}
