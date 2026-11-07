// canonical: explorer-pipeline seo 4f501cb5dd1e seo/lib/adapter.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Site adapter: one small ESM module the site owns (e.g. scripts/seo-adapter.mjs). Every key is optional.
//
// export default {
//   origin: 'https://example.com',                 // production origin, no trailing slash
//   contentSelectors: ['main'],                     // primary content; falls back to <body> minus nav/landmark header/footer
//   normalizeText(text, path) { return text },      // strip site-specific volatile text before hashing
//   section(path) { return path.split('/')[1] || null },   // latest-links section; null = in no section
//   include(path, section) { return true },         // latest-links filter (default: not "/" and not the hub "/<section>")
//   title(path) { return null },                    // link text for pages not built yet (default: ledger h1, then the slug)
//   hubPath(section) { return `/${section}` },      // where a section's hub lives (verify-live)
//   routes() { return [...] },                      // route list before render when no sitemap exists yet
//   seedDate(path, ctx) { return ctx.gitDates([`content/${path}.md`]) },  // evidence for pages the prior does not know
//   guardExempt(path, check) { return false },      // skip one guard check for one URL
//   ignoreFiles: [/^embed\.html$/],                 // dist files that are not pages (added to the defaults)
//   distrustDates: ['2026-10-01'],                  // placeholder dates never used as seed evidence
//   minWords: 150,
// };
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitDates, gitFirstDate, gitLastDate, isShallow } from './seed.mjs';

export async function loadAdapter(file) {
  if (!file) return {};
  const mod = await import(pathToFileURL(resolve(file)).href);
  const adapter = mod.default && typeof mod.default === 'object' ? { ...mod, ...mod.default } : { ...mod };
  delete adapter.default;
  return adapter;
}

export function seedContext({ buildDate, repoRoot = process.cwd() } = {}) {
  return {
    buildDate,
    repoRoot,
    isShallow: () => isShallow(repoRoot),
    gitLastDate: (files, opts = {}) => gitLastDate(files, { cwd: repoRoot, ...opts }),
    gitFirstDate: (files, opts = {}) => gitFirstDate(files, { cwd: repoRoot, ...opts }),
    gitDates: (files, opts = {}) => gitDates(files, { cwd: repoRoot, ...opts }),
  };
}
