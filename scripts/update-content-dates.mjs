// Refreshes src/data/content-dates.json: the sitemap lastmod ledger. A page whose primary content
// hash changed (or is new) gets today's date; unchanged pages keep their recorded date; pages that
// no longer exist are dropped. Run after any content change and commit the ledger with it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./lib/build-pages.mjs";
import { loadSiteData } from "./lib/site-data.mjs";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const today = process.env.CONTENT_DATE ?? new Date().toISOString().slice(0, 10);
const data = loadSiteData(root);
const appHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const site = buildSite({ ...data, appHtml, buildDate: today });

const pages = Object.fromEntries(Object.entries(site.contentDates).sort(([a], [b]) => a.localeCompare(b)));
const changed = Object.keys(pages).filter((route) => data.contentDates[route]?.hash !== pages[route].hash);
const removed = Object.keys(data.contentDates).filter((route) => !pages[route]);
fs.writeFileSync(
  path.join(root, "src/data/content-dates.json"),
  `${JSON.stringify({ _comment: "Sitemap lastmod ledger. Regenerate with npm run content-dates; never hand-edit dates.", pages }, null, 1)}\n`,
);
console.log(`content-dates: ${Object.keys(pages).length} pages, ${changed.length} dated ${today}, ${removed.length} removed.`);
