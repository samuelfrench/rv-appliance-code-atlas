// canonical: explorer-pipeline seo 4f501cb5dd1e seo/adapter.example.mjs. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Example site adapter. Copy to the site (NOT into the vendored seo-template dir), e.g. frontend/scripts/seo-adapter.mjs,
// and pass it with --adapter. Every key is optional; delete what you do not need. See lib/adapter.mjs for the contract.
import { readFileSync } from 'node:fs';

const articles = (() => {
  try { return JSON.parse(readFileSync(new URL('../src/data/articles/index.json', import.meta.url), 'utf8')); } catch { return []; }
})();
const bySlug = new Map(articles.map((a) => [a.slug, a]));

export default {
  origin: 'https://example.com',

  // Primary content. Default ['main', '[data-seo-content]'], then <body> minus nav and landmark header/footer.
  contentSelectors: ['main'],

  // latest-links sections. Default: the first path segment ("/blog/x" -> "blog"); null keeps a page out of every section.
  section(path) {
    if (/^\/guides\/[^/]+\/events$/.test(path)) return null; // auto-generated listings never go in "Latest"
    return path.split('/')[1] || null;
  },

  // Link text for pages that are new in this build (not in the live ledger yet, so no h1 is known).
  title(path) {
    const m = /^\/blog\/([^/]+)$/.exec(path);
    return m ? bySlug.get(m[1])?.title || null : null;
  },

  // Evidence for pages the prior ledger does not know (first adoption, or a run on the committed fallback).
  // Never return the build date here. Return null when there is no evidence: the page then gets no lastmod.
  // Git dates need full history (fetch-depth: 0); in a shallow clone ctx.gitDates returns null and warns.
  seedDate(path, ctx) {
    const m = /^\/blog\/([^/]+)$/.exec(path);
    if (m && bySlug.get(m[1])?.publishedAt) {
      return { firstSeen: bySlug.get(m[1]).publishedAt.slice(0, 10), lastmod: (bySlug.get(m[1]).updatedAt || bySlug.get(m[1]).publishedAt).slice(0, 10) };
    }
    if (m) return ctx.gitDates([`src/data/articles/${m[1]}.json`]);
    return null;
  },

  // Guard exemptions: one check for one URL. Keep this list short and explain each line.
  guardExempt(path, check) {
    if (check === 'words' && ['/', '/search', '/contact'].includes(path)) return true; // app shells and forms
    return false;
  },

  // Where verify-live finds a section's hub.
  hubPath(section) { return section === 'blog' ? '/blog' : `/${section}`; },

  // Dist files that are not pages (added to the defaults: 404, 50x, 200, spa-fallback, offline, _*, verification files).
  ignoreFiles: [/^embed\.html$/],

  minWords: 150,
};
