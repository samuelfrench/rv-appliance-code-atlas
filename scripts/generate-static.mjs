import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const appHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function writeRoute(route, title, description) {
  const routeDir = path.join(dist, route.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(routeDir, { recursive: true });
  const html = appHtml
    .replace(/<title>.*?<\/title>/, `<title>${xmlEscape(title)}</title>`)
    .replace(/content="Free source-backed RV appliance fault code lookup[^"]*"/, `content="${xmlEscape(description)}"`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${corpus.site.baseUrl}${route}" />`);
  fs.writeFileSync(path.join(routeDir, "index.html"), html);
}

const urls = [{ loc: `${corpus.site.baseUrl}/`, title: corpus.site.name }];

for (const entry of corpus.entries) {
  const route = `/codes/${entry.slug}/`;
  writeRoute(route, `${entry.brand} ${entry.code} fault code`, entry.plainMeaning);
  urls.push({ loc: `${corpus.site.baseUrl}${route}`, title: `${entry.brand} ${entry.code}` });
}

for (const symptom of corpus.symptoms) {
  const route = `/symptoms/${symptom.slug}/`;
  writeRoute(route, symptom.title, symptom.summary);
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
      status: "ready-no-key-configured",
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
