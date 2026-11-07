import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyLatest, buildSite, latestRoutes } from "./lib/build-pages.mjs";
import { loadSiteData } from "./lib/site-data.mjs";
import { loadAdapter, seedContext } from "./seo-template/lib/adapter.mjs";
import { fetchPriorLedger } from "./seo-template/lib/fetch-ledger.mjs";
import { planLatest, withPlanned } from "./seo-template/lib/latest.mjs";
import { todayIn } from "./seo-template/lib/ledger.mjs";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const buildDir = path.join(root, "build");
const data = loadSiteData(root);
const appHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const indexNow = data.corpus.site.indexNow ?? null;
const site = buildSite({ ...data, appHtml });

// Latest links (shared SEO template, scripts/seo-template): plan this build's newest pages from the ledger the live
// site published (fallback: the committed seed) before writing pages; `npm run seo:finalize` then hashes dist/,
// writes dist/seo/content-dates.json and sets sitemap <lastmod>. SEO_OFFLINE=1 skips the network fetch.
const adapterFile = path.join(root, "scripts/seo-adapter.mjs");
const adapter = await loadAdapter(adapterFile);
const buildDate = process.env.SEO_BUILD_DATE || todayIn();
const { ledger: prior, source } = await fetchPriorLedger({
  origin: adapter.origin,
  fallbacks: [path.join(root, "seo/content-dates.seed.json")],
  offline: process.env.SEO_OFFLINE === "1",
});
const { latest, planned } = await planLatest({ ledger: prior, routes: latestRoutes(site), buildDate, adapter, seedCtx: seedContext({ buildDate, repoRoot: root }) });
const cacheDir = path.join(root, ".seo-cache");
fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(path.join(cacheDir, "prior.json"), JSON.stringify(withPlanned(prior, planned)));
fs.writeFileSync(path.join(cacheDir, "latest.json"), JSON.stringify(latest));
console.log(`latest links: prior ledger ${source} (${latest.mode}), ${Object.keys(planned).length} new routes, ${latest.site.length} site-wide, ${Object.keys(latest.sections).length} sections.`);
const pages = applyLatest(site, latest);

function writeFile(route, html) {
  if (route === "/") return fs.writeFileSync(path.join(dist, "index.html"), html);
  const routeDir = path.join(dist, route.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), html);
}

for (const page of pages) writeFile(page.route, page.html);
fs.writeFileSync(path.join(dist, "404.html"), site.notFound);
fs.writeFileSync(path.join(dist, "sitemap.xml"), site.sitemapXml);
fs.writeFileSync(path.join(dist, "feed.xml"), site.feedXml);
fs.writeFileSync(path.join(dist, "site-index.json"), JSON.stringify(site.siteIndex));
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${data.corpus.site.baseUrl}/sitemap.xml\n`);

// Redirects live outside dist/: nginx loads the map; the local test server reads the JSON.
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, "nginx-redirects.map"), site.nginxMap);
fs.writeFileSync(path.join(buildDir, "redirects.json"), `${JSON.stringify(site.redirects, null, 1)}\n`);

const urls = site.sitemap.map((url) => url.loc);
fs.writeFileSync(
  path.join(dist, "indexnow-report.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      status: indexNow?.keyLocation ? "ready-key-configured" : "ready-no-key-configured",
      keyLocation: indexNow?.keyLocation ?? null,
      submittedAt: indexNow?.submittedAt ?? null,
      submitCommand: indexNow?.keyLocation ? "npm run traffic:indexnow:submit" : null,
      urlCount: urls.length,
      urls,
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(path.join(dist, "corpus-stats.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), ...site.stats }, null, 2)}\n`);

const s = site.stats;
console.log(
  `Generated ${s.indexablePages} indexable pages (${s.modelPages} model, ${s.troubleshootingHubs} hubs, ${s.codePages} shared-code, ${s.standaloneGuides} guides), ${s.codesExplained} codes explained, ${s.redirects} redirects, ${s.noindexPrepGuides} noindex prep guides.`,
);
