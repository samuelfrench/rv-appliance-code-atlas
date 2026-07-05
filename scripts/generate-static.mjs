import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const appHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const indexNow = corpus.site.indexNow ?? null;

const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
const symptomsById = new Map(corpus.symptoms.map((symptom) => [symptom.id, symptom]));

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

export function brandSlug(brand) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function listHtml(items) {
  return `<ul>${items.map((item) => `<li>${xmlEscape(item)}</li>`).join("")}</ul>`;
}

function linkListHtml(links) {
  return `<ul>${links.map((link) => `<li><a href="${xmlEscape(link.href)}">${xmlEscape(link.label)}</a></li>`).join("")}</ul>`;
}

function sourceLinksHtml(sourceIds, cap = 12) {
  const sources = sourceIds.map((id) => sourcesById.get(id)).filter(Boolean).slice(0, cap);
  if (!sources.length) return "";
  return `<h2>Official sources</h2>${linkListHtml(sources.map((source) => ({ href: source.url, label: source.title })))}`;
}

function pageShellHtml(inner) {
  return `<header class="static-header"><a href="/">RV Appliance Code Atlas</a></header><main class="static-content"><article>${inner}</article></main>`;
}

export function entryBodyHtml(entry) {
  const related = corpus.entries
    .filter((other) => other.brand === entry.brand && other.equipmentType === entry.equipmentType && other.slug !== entry.slug)
    .slice(0, 8);
  const symptoms = (entry.symptomIds ?? []).map((id) => symptomsById.get(id)).filter(Boolean);
  const parts = [
    `<h1>${xmlEscape(`${entry.brand} ${entry.code} fault code — ${entry.equipmentType}`)}</h1>`,
    entry.modelFamilies?.length ? `<p class="model-families">Applies to: ${xmlEscape(entry.modelFamilies.join(", "))}</p>` : "",
    `<h2>What ${xmlEscape(entry.code)} means</h2><p>${xmlEscape(entry.plainMeaning)}</p>`,
    entry.ownerSafeActions?.length ? `<h2>Owner-safe checks</h2>${listHtml(entry.ownerSafeActions)}` : "",
    entry.serviceOnlyActions?.length ? `<h2>Service-only work</h2>${listHtml(entry.serviceOnlyActions)}` : "",
    entry.safetyBoundary ? `<h2>Safety boundary</h2><p>${xmlEscape(entry.safetyBoundary)}</p>` : "",
    sourceLinksHtml(entry.sourceIds ?? []),
    symptoms.length
      ? `<h2>Related symptom guides</h2>${linkListHtml(symptoms.map((symptom) => ({ href: `/symptoms/${symptom.slug}/`, label: symptom.title })))}`
      : "",
    related.length
      ? `<h2>Other ${xmlEscape(`${entry.brand} ${entry.equipmentType}`)} codes</h2>${linkListHtml(
          related.map((other) => ({ href: `/codes/${other.slug}/`, label: `${other.brand} ${other.code}` })),
        )}`
      : "",
    `<p><a href="/brands/${brandSlug(entry.brand)}/">All ${xmlEscape(entry.brand)} codes and guides</a></p>`,
  ];
  return pageShellHtml(parts.filter(Boolean).join(""));
}

export function symptomBodyHtml(symptom) {
  const relatedEntries = corpus.entries.filter((entry) => (entry.symptomIds ?? []).includes(symptom.id)).slice(0, 10);
  const parts = [
    `<h1>${xmlEscape(symptom.title)}</h1>`,
    `<p>${xmlEscape(symptom.summary)}</p>`,
    symptom.safeChecklist?.length ? `<h2>Owner-safe checklist</h2>${listHtml(symptom.safeChecklist)}` : "",
    sourceLinksHtml(symptom.sourceIds ?? []),
    relatedEntries.length
      ? `<h2>Related fault codes</h2>${linkListHtml(
          relatedEntries.map((entry) => ({ href: `/codes/${entry.slug}/`, label: `${entry.brand} ${entry.code} — ${entry.equipmentType}` })),
        )}`
      : "",
  ];
  return pageShellHtml(parts.filter(Boolean).join(""));
}

export function brandHubBodyHtml(brand) {
  const entries = corpus.entries.filter((entry) => entry.brand === brand);
  const byType = new Map();
  for (const entry of entries) {
    if (!byType.has(entry.equipmentType)) byType.set(entry.equipmentType, []);
    byType.get(entry.equipmentType).push(entry);
  }
  const sections = [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([type, typeEntries]) =>
        `<h2>${xmlEscape(`${brand} ${type} codes`)}</h2>${linkListHtml(
          typeEntries.map((entry) => ({ href: `/codes/${entry.slug}/`, label: `${entry.brand} ${entry.code}` })),
        )}`,
    );
  return pageShellHtml(
    `<h1>${xmlEscape(`${brand} RV appliance fault codes`)}</h1><p>${xmlEscape(
      `Verified ${brand} fault codes and owner-safe guidance from official manufacturer sources.`,
    )}</p>${sections.join("")}`,
  );
}

export function homeBodyHtml(brands) {
  return pageShellHtml(
    `<h1>RV Appliance Code Atlas</h1><p>Free source-backed RV appliance fault code lookup.</p><h2>Browse by brand</h2>${linkListHtml(
      brands.map((brand) => ({ href: `/brands/${brandSlug(brand)}/`, label: `${brand} fault codes` })),
    )}`,
  );
}

function writeRoute(route, title, description, bodyHtml) {
  const routeDir = path.join(dist, route.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(routeDir, { recursive: true });
  const html = appHtml
    .replace(/<title>.*?<\/title>/, `<title>${xmlEscape(title)}</title>`)
    .replace(/content="Free source-backed RV appliance fault code lookup[^"]*"/, `content="${xmlEscape(description)}"`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${corpus.site.baseUrl}${route}" />`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${bodyHtml}</div>`);
  fs.writeFileSync(path.join(routeDir, "index.html"), html);
}

const brands = [...new Set(corpus.entries.map((entry) => entry.brand))].sort();
const urls = [{ loc: `${corpus.site.baseUrl}/`, title: corpus.site.name }];

fs.writeFileSync(
  path.join(dist, "index.html"),
  appHtml.replace(/<div id="root"><\/div>/, `<div id="root">${homeBodyHtml(brands)}</div>`),
);

for (const brand of brands) {
  const route = `/brands/${brandSlug(brand)}/`;
  writeRoute(
    route,
    `${brand} RV appliance fault codes`,
    `Verified ${brand} fault codes and owner-safe guidance from official manufacturer sources.`,
    brandHubBodyHtml(brand),
  );
  urls.push({ loc: `${corpus.site.baseUrl}${route}`, title: `${brand} RV appliance fault codes` });
}

for (const entry of corpus.entries) {
  const route = `/codes/${entry.slug}/`;
  writeRoute(route, `${entry.brand} ${entry.code} fault code — ${entry.equipmentType}`, entry.plainMeaning, entryBodyHtml(entry));
  urls.push({ loc: `${corpus.site.baseUrl}${route}`, title: `${entry.brand} ${entry.code}` });
}

for (const symptom of corpus.symptoms) {
  const route = `/symptoms/${symptom.slug}/`;
  writeRoute(route, symptom.title, symptom.summary, symptomBodyHtml(symptom));
  urls.push({ loc: `${corpus.site.baseUrl}${route}`, title: symptom.title });
}

fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${xmlEscape(url.loc)}</loc><lastmod>${corpus.site.generatedAt.slice(0, 10)}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);

fs.writeFileSync(
  path.join(dist, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xmlEscape(corpus.site.name)}</title><link>${corpus.site.baseUrl}/</link><description>Verified RV appliance code updates</description>${urls
    .slice(1)
    .map((url) => `<item><title>${xmlEscape(url.title)}</title><link>${xmlEscape(url.loc)}</link><guid>${xmlEscape(url.loc)}</guid></item>`)
    .join("")}</channel></rss>\n`,
);

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
      urls: urls.map((url) => url.loc),
    },
    null,
    2,
  )}\n`,
);

fs.writeFileSync(
  path.join(dist, "corpus-stats.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      verifiedEntries: corpus.entries.length,
      symptomGuides: corpus.symptoms.length,
      officialSources: corpus.sources.length,
      indexablePages: urls.length,
    },
    null,
    2,
  )}\n`,
);

fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${corpus.site.baseUrl}/sitemap.xml\n`,
);

console.log(`Generated ${urls.length} indexable pages plus sitemap/feed/IndexNow report.`);
