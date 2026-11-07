import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./lib/build-pages.mjs";
import { loadSiteData } from "./lib/site-data.mjs";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const buildDir = path.join(root, "build");
const data = loadSiteData(root);
const appHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const indexNow = data.corpus.site.indexNow ?? null;
const buildDate = new Date().toISOString().slice(0, 10);

const site = buildSite({ ...data, appHtml, buildDate });

function writeFile(route, html) {
  if (route === "/") return fs.writeFileSync(path.join(dist, "index.html"), html);
  const routeDir = path.join(dist, route.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), html);
}

for (const page of site.pages) writeFile(page.route, page.html);
fs.writeFileSync(path.join(dist, "404.html"), site.notFound);
fs.writeFileSync(path.join(dist, "sitemap.xml"), site.sitemapXml);
fs.writeFileSync(path.join(dist, "feed.xml"), site.feedXml);
fs.writeFileSync(path.join(dist, "site-index.json"), JSON.stringify(site.siteIndex));
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${data.corpus.site.baseUrl}/sitemap.xml\n`);

// Redirects live outside dist/: nginx loads the map; the local test server reads the JSON.
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, "nginx-redirects.map"), site.nginxMap);
fs.writeFileSync(path.join(buildDir, "redirects.json"), `${JSON.stringify(site.redirects, null, 1)}\n`);

const stale = Object.entries(site.contentDates).filter(([route, value]) => data.contentDates[route]?.hash !== value.hash).length;
if (stale) console.warn(`${stale} pages changed content without a content-dates entry; run npm run content-dates and commit src/data/content-dates.json.`);

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
