// Pure site build: every page, redirect, sitemap entry and search index from the data files.
// scripts/generate-static.mjs writes the result to dist/; tests check it without touching disk.
import crypto from "node:crypto";
import { buildSiteModel, familySearchIndex } from "./site-model.mjs";
import { brandPage, codePage, esc, guidesIndexPage, homeBody, symptomPage, topicPage } from "./render.mjs";

export const NOT_FOUND_ROUTE = "/404.html";

function breadcrumbJsonLd(baseUrl, crumbs) {
  if (!crumbs?.length) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.label, item: `${baseUrl}${crumb.href}` })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

export function renderDocument(shell, baseUrl, { route, title, description, robots, body, crumbs }) {
  return shell
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${baseUrl}${route}" />${breadcrumbJsonLd(baseUrl, crumbs)}`)
    .replace(/<div id="root"><\/div>/, `<div id="root" data-static="true">${body}</div>`);
}

// Hash of the page's primary content (the article), so nav or footer edits do not move lastmod.
export function contentHash(html) {
  const article = html.match(/<article class="detail-article">([\s\S]*?)<\/article>/)?.[1] ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? html;
  return crypto.createHash("sha256").update(article).digest("hex").slice(0, 16);
}

export function buildSite({ corpus, familiesData, hubsData, topicNotes, appHtml, contentDates = {}, buildDate }) {
  const baseUrl = corpus.site.baseUrl;
  const model = buildSiteModel(corpus, familiesData, { hubs: hubsData, notes: topicNotes });
  const staticShell = appHtml.replace(/<script type="module"[^>]*><\/script>\s*/g, "");
  const pages = [];

  const add = (pageData, shell = staticShell) => {
    const html = renderDocument(shell, baseUrl, pageData);
    pages.push({ route: pageData.route, title: pageData.title, robots: pageData.robots, indexable: pageData.robots.startsWith("index"), html });
  };

  // Home keeps the app bundle; React mounts the search box into #search-app.
  pages.push({
    route: "/",
    title: corpus.site.name,
    robots: "index,follow",
    indexable: true,
    html: renderDocument(appHtml, baseUrl, {
      route: "/",
      title: "RV Appliance Fault Codes by Model – RV Appliance Code Atlas",
      description:
        "What RV appliance fault codes mean on your exact model, with owner-safe checks and official manufacturer sources for Dometic, Norcold, Onan, Furrion, Lippert, Suburban, and Coleman-Mach.",
      robots: "index,follow",
      body: homeBody(model),
      crumbs: null,
    }).replace('<div id="root" data-static="true">', '<div id="root">'),
  });

  for (const brand of model.brands) add(brandPage(model, brand));
  add(guidesIndexPage(model));
  for (const hub of model.hubs) add(topicPage(model, hub));
  for (const family of model.families.filter((item) => item.hasPage)) add(topicPage(model, family));
  for (const group of model.codeGroups.filter((item) => item.standalone)) add(codePage(model, group));
  for (const symptom of model.symptoms.filter((item) => item.target === item.path)) add(symptomPage(model, symptom));

  // Not-found document: the app shell renders "Code not verified yet"; served with HTTP 404.
  const notFound = appHtml
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex,follow" />')
    .replace(/<link rel="canonical" href="[^"]*" \/>\s*/, "")
    .replace(/<title>.*?<\/title>/s, "<title>Code not verified yet – RV Appliance Code Atlas</title>");

  const live = new Set(pages.map((item) => item.route));
  const redirects = model.redirects.filter((redirect) => !live.has(redirect.from));

  const nextDates = {};
  const sitemap = [];
  for (const item of pages.filter((entry) => entry.indexable)) {
    const hash = contentHash(item.html);
    const known = contentDates[item.route];
    const lastmod = known?.hash === hash ? known.lastmod : buildDate;
    nextDates[item.route] = { hash, lastmod };
    sitemap.push({ loc: `${baseUrl}${item.route}`, title: item.title, lastmod });
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((url) => `  <url><loc>${esc(url.loc)}</loc><lastmod>${url.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(corpus.site.name)}</title><link>${baseUrl}/</link><description>Verified RV appliance code updates</description>${sitemap
    .slice(1)
    .map((url) => `<item><title>${esc(url.title)}</title><link>${esc(url.loc)}</link><guid>${esc(url.loc)}</guid></item>`)
    .join("")}</channel></rss>\n`;

  // nginx map: old URL (with and without trailing slash) -> live destination. Values are quoted so
  // the #fragment is not read as a comment.
  const mapLines = [];
  for (const redirect of redirects) {
    for (const from of new Set([redirect.from, redirect.from.replace(/\/$/, "")])) mapLines.push(`"${from}" "${redirect.to}";`);
  }
  const nginxMap = `${mapLines.join("\n")}\n`;

  const siteIndex = { families: familySearchIndex(model), entryPaths: model.entryPaths, symptomPaths: model.symptomPaths };
  const stats = {
    verifiedEntries: corpus.entries.length,
    codePages: model.codeGroups.filter((group) => group.standalone).length,
    codesExplained: model.codeGroups.length,
    modelPages: model.families.filter((family) => family.hasPage).length,
    troubleshootingHubs: model.hubs.length,
    standaloneGuides: pages.filter((item) => item.route.startsWith("/symptoms/") && item.indexable).length,
    noindexPrepGuides: pages.filter((item) => item.route.startsWith("/symptoms/") && !item.indexable).length,
    problemsCovered: model.symptoms.filter((symptom) => symptom.indexable).length,
    redirects: redirects.length,
    officialSources: corpus.sources.length,
    indexablePages: sitemap.length,
  };

  return { model, pages, notFound, redirects, sitemap, sitemapXml, feedXml, nginxMap, siteIndex, stats, contentDates: nextDates };
}
