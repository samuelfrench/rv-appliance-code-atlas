// Pure site build: every page, redirect, sitemap entry and search index from the data files.
// scripts/generate-static.mjs writes the result to dist/; tests check it without touching disk.
import adapter, { GUIDES_SECTION } from "../seo-adapter.mjs";
import { forPage, forSection, forSite } from "../seo-template/lib/latest.mjs";
import { renderLatestHtml } from "../seo-template/render/latest-html.mjs";
import { brandSlug, buildSiteModel, familySearchIndex } from "./site-model.mjs";
import { brandPage, codePage, esc, guidesIndexPage, homeBody, LATEST_MARKER, symptomPage, topicPage } from "./render.mjs";

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

// Sitemap <lastmod> is not set here: the SEO template's `finalize` step (npm run build) writes it from the
// content-hash ledger published at /seo/content-dates.json. Pages carry LATEST_MARKER until applyLatest() fills it.
export function buildSite({ corpus, familiesData, hubsData, topicNotes, appHtml }) {
  const baseUrl = corpus.site.baseUrl;
  const model = buildSiteModel(corpus, familiesData, { hubs: hubsData, notes: topicNotes });
  const staticShell = appHtml.replace(/<script type="module"[^>]*><\/script>\s*/g, "");
  const pages = [];

  const add = (pageData, shell = staticShell) => {
    const html = renderDocument(shell, baseUrl, pageData);
    const label = pageData.crumbs?.at(-1)?.label ?? pageData.title;
    pages.push({ route: pageData.route, title: pageData.title, label, robots: pageData.robots, indexable: pageData.robots.startsWith("index"), html });
  };

  // Home keeps the app bundle; React mounts the search box into #search-app.
  pages.push({
    route: "/",
    title: corpus.site.name,
    label: corpus.site.name,
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

  const sitemap = pages.filter((entry) => entry.indexable).map((item) => ({ loc: `${baseUrl}${item.route}`, route: item.route, title: item.title, label: item.label }));

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((url) => `  <url><loc>${esc(url.loc)}</loc></url>`)
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

  return { model, pages, notFound, redirects, sitemap, sitemapXml, feedXml, nginxMap, siteIndex, stats };
}

/** Route list for the SEO template's latest-links planning: every sitemap page with its short link text. */
export function latestRoutes(site) {
  return site.sitemap.map((url) => ({ href: url.route, title: url.label }));
}

/**
 * Fill each page's LATEST_MARKER with its latest-links block (wrapped in data-seo-ignore by the template renderer):
 * home = site-wide newest 8; a brand hub or /guides/ = its section's newest 8; any other indexable page = the 5
 * newest pages of its section. Noindex pages get no block. Returns the pages with the html replaced.
 */
export function applyLatest(site, latest) {
  const labels = new Map(site.model.brands.map((brand) => [brandSlug(brand), site.model.families.find((family) => family.brand === brand)?.brandLabel ?? brand]));
  const hubSection = new Map([...labels.keys(), GUIDES_SECTION].map((section) => [adapter.hubPath(section), section]));
  const heading = (section) => (section === GUIDES_SECTION ? "Latest troubleshooting guides" : `Latest ${labels.get(section) ?? section} pages`);
  const blockFor = (page) => {
    if (!page.indexable) return "";
    if (page.route === "/") return renderLatestHtml(forSite(latest), { heading: "New on RV Atlas", className: "seo-latest latest-band" });
    const hub = hubSection.get(page.route);
    if (hub) return renderLatestHtml(forSection(latest, hub), { heading: heading(hub) });
    const section = adapter.section(page.route);
    return section ? renderLatestHtml(forPage(latest, page.route, { section }), { heading: heading(section) }) : "";
  };
  return site.pages.map((page) => ({ ...page, html: page.html.replace(LATEST_MARKER, blockFor(page)) }));
}
