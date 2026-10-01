import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSiteModel, familySearchIndex } from "./lib/site-model.mjs";
import {
  brandPage,
  codeHeading,
  codePage,
  esc,
  familyPage,
  guidesIndexPage,
  homeBody,
  redirectHtml,
  symptomPage,
} from "./lib/render.mjs";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const familiesData = JSON.parse(fs.readFileSync(path.join(root, "src/data/families.json"), "utf8"));
const appHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const indexNow = corpus.site.indexNow ?? null;
const baseUrl = corpus.site.baseUrl;

const model = buildSiteModel(corpus, familiesData);

// Static pages ship as plain HTML + CSS: drop the app bundle so they do not download the corpus.
const staticShell = appHtml.replace(/<script type="module"[^>]*><\/script>\s*/g, "");

function breadcrumbJsonLd(crumbs) {
  if (!crumbs?.length) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${baseUrl}${crumb.href}`,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

function renderDocument(shell, { route, title, description, robots, body, crumbs }) {
  return shell
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${baseUrl}${route}" />${breadcrumbJsonLd(crumbs)}`)
    .replace(/<div id="root"><\/div>/, `<div id="root" data-static="true">${body}</div>`);
}

function writeFile(route, html) {
  const routeDir = path.join(dist, route.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), html);
}

const sitemap = [];
function writePage(pageData) {
  writeFile(pageData.route, renderDocument(staticShell, pageData));
  if (pageData.robots.startsWith("index")) sitemap.push({ loc: `${baseUrl}${pageData.route}`, title: pageData.title });
}

// Home keeps the app bundle; React mounts the search box into #search-app.
fs.writeFileSync(
  path.join(dist, "index.html"),
  renderDocument(appHtml, {
    route: "/",
    title: "RV Appliance Fault Codes by Model – RV Appliance Code Atlas",
    description:
      "What RV appliance fault codes mean on your exact model, with owner-safe checks and official manufacturer sources for Dometic, Norcold, Onan, Furrion, Lippert, Suburban, and Coleman-Mach.",
    robots: "index,follow",
    body: homeBody(model),
    crumbs: null,
  }).replace('<div id="root" data-static="true">', '<div id="root">'),
);
sitemap.push({ loc: `${baseUrl}/`, title: corpus.site.name });

for (const brand of model.brands) writePage(brandPage(model, brand));
writePage(guidesIndexPage(model));
for (const family of model.families.filter((item) => item.hasPage)) writePage(familyPage(model, family));
for (const group of model.codeGroups) writePage(codePage(model, group));
for (const symptom of model.symptoms) writePage(symptomPage(model, symptom));

const groupsByPath = new Map(model.codeGroups.map((group) => [group.path, group]));
for (const redirect of model.redirects) {
  const group = groupsByPath.get(redirect.to.split("#")[0]);
  writeFile(redirect.from, redirectHtml(redirect.to, codeHeading(group), baseUrl));
}

// Bump when page content or structure changes so sitemap lastmod stays meaningful across deploys.
const CONTENT_UPDATED = "2026-10-01";
const lastmod = CONTENT_UPDATED;
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((url) => `  <url><loc>${esc(url.loc)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);

fs.writeFileSync(
  path.join(dist, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(corpus.site.name)}</title><link>${baseUrl}/</link><description>Verified RV appliance code updates</description>${sitemap
    .slice(1)
    .map((url) => `<item><title>${esc(url.title)}</title><link>${esc(url.loc)}</link><guid>${esc(url.loc)}</guid></item>`)
    .join("")}</channel></rss>\n`,
);

// Search helpers for the homepage app: model tables and canonical code URLs.
fs.writeFileSync(
  path.join(dist, "site-index.json"),
  JSON.stringify({ families: familySearchIndex(model), entryPaths: model.entryPaths }),
);

const urls = sitemap.map((url) => url.loc);
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

const stats = {
  generatedAt: new Date().toISOString(),
  verifiedEntries: corpus.entries.length,
  codePages: model.codeGroups.length,
  modelPages: model.families.filter((family) => family.hasPage).length,
  mergedCodeRedirects: model.redirects.length,
  symptomGuides: corpus.symptoms.length,
  indexableGuides: model.symptoms.filter((symptom) => symptom.indexable).length,
  officialSources: corpus.sources.length,
  indexablePages: urls.length,
};
fs.writeFileSync(path.join(dist, "corpus-stats.json"), `${JSON.stringify(stats, null, 2)}\n`);

fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);

console.log(
  `Generated ${urls.length} indexable pages (${stats.codePages} code, ${stats.modelPages} model, ${stats.indexableGuides} guides, ${model.brands.length} brands), ${stats.mergedCodeRedirects} merged-code redirects, ${
    stats.symptomGuides - stats.indexableGuides
  } noindex prep guides.`,
);

