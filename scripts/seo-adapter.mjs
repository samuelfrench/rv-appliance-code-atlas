// Site adapter for the shared SEO template (scripts/seo-template, vendored from explorer-pipeline/seo; never edit
// that copy). Used by scripts/generate-static.mjs (latest links before render) and by the template CLI (finalize,
// verify-live), so both agree on sections.
//
// Sections: a model page, troubleshooting hub or shared-code page belongs to its brand (hub /brands/<brand>/); the
// cross-brand guides (/symptoms/) and pages of a brand without a brand hub (Thetford) belong to "guides" (hub
// /guides/). Home, brand hubs and /guides/ are in no section, so they never appear in a Latest list.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteData } from "./lib/site-data.mjs";
import { brandSlug, buildSiteModel } from "./lib/site-model.mjs";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
export const ORIGIN = "https://rvappliancefaultcodes.com";
export const GUIDES_SECTION = "guides";

const key = (route) => (route.length > 1 ? route.replace(/\/+$/, "") : route);

let cached = null;
function siteSections() {
  if (cached) return cached;
  const data = loadSiteData(root);
  const model = buildSiteModel(data.corpus, data.familiesData, { hubs: data.hubsData, notes: data.topicNotes });
  const brands = new Set(model.brands);
  const sectionOf = (brand) => (brands.has(brand) ? brandSlug(brand) : GUIDES_SECTION);
  const byPath = new Map();
  for (const family of model.families.filter((item) => item.hasPage)) byPath.set(key(family.path), sectionOf(family.brand));
  for (const hub of model.hubs) byPath.set(key(hub.path), sectionOf(hub.brand));
  for (const group of model.codeGroups.filter((item) => item.standalone)) byPath.set(key(group.path), sectionOf(group.brand));
  for (const symptom of model.symptoms) byPath.set(key(symptom.path), GUIDES_SECTION);
  cached = { byPath };
  return cached;
}

// ---------- seed evidence (only used when the prior ledger is a fallback or missing; needs full git history) ----------

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
}

let gitState = null;
function gitAvailable() {
  if (gitState !== null) return gitState;
  try {
    gitState = git(["rev-parse", "--is-shallow-repository"]).trim() === "false";
  } catch {
    gitState = false; // Docker build context has no .git
  }
  return gitState;
}

// First commit date that contains `needle` anywhere under scripts/ or src/ (when a route template was introduced).
const templateDates = new Map();
function templateDate(needle) {
  if (!templateDates.has(needle)) {
    const first = git(["log", "--reverse", "--format=%cs", `-S${needle}`, "--", "scripts", "src"]).split("\n").find(Boolean) ?? null;
    templateDates.set(needle, first);
  }
  return templateDates.get(needle);
}

// First commit date at which each slug appears in a data file (walks the file's history once, oldest first).
const slugDates = new Map();
function firstSlugDates(file, pick) {
  if (slugDates.has(file)) return slugDates.get(file);
  const first = new Map();
  for (const line of git(["log", "--reverse", "--format=%H %cs", "--", file]).split("\n").filter(Boolean)) {
    const [sha, date] = line.split(" ");
    let data;
    try {
      data = JSON.parse(git(["show", `${sha}:${file}`]));
    } catch {
      continue;
    }
    for (const slug of pick(data) ?? []) if (slug && !first.has(slug)) first.set(slug, date);
  }
  slugDates.set(file, first);
  return first;
}

const ROUTE_SOURCES = [
  { prefix: "/models/", template: "/models/${", file: "src/data/families.json", pick: (d) => d.families?.map((item) => item.slug) },
  { prefix: "/guides/", template: "/guides/${", file: "src/data/guide-hubs.json", pick: (d) => d.hubs?.map((item) => item.slug) },
  { prefix: "/symptoms/", template: "/symptoms/${", file: "src/data/corpus.json", pick: (d) => d.symptoms?.map((item) => item.slug) },
  { prefix: "/codes/", template: "/codes/${", file: "src/data/corpus.json", pick: (d) => d.entries?.map((item) => item.slug) },
];

const later = (a, b) => (a && b ? (a > b ? a : b) : null);

/** firstSeen evidence: the later of "route template introduced" and "slug first in the data file". */
function firstPublished(route) {
  if (route === "/") return git(["log", "--reverse", "--format=%cs"]).split("\n").find(Boolean) ?? null;
  if (route === "/guides") return templateDate('route: "/guides/"');
  if (route.startsWith("/brands/")) return templateDate("/brands/${");
  const source = ROUTE_SOURCES.find((item) => route.startsWith(item.prefix));
  if (!source) return null;
  const slug = route.slice(source.prefix.length).split("/")[0];
  return later(templateDate(source.template), firstSlugDates(source.file, source.pick).get(slug) ?? null);
}

export default {
  origin: ORIGIN,
  section(route) {
    return siteSections().byPath.get(key(route)) ?? null;
  },
  hubPath(section) {
    return section === GUIDES_SECTION ? "/guides/" : `/brands/${section}/`;
  },
  // Only firstSeen: lastmod evidence comes from the imported ledger or the content hash.
  seedDate(route) {
    if (!gitAvailable()) return null;
    try {
      const firstSeen = firstPublished(key(route));
      return firstSeen ? { firstSeen } : null;
    } catch {
      return null;
    }
  },
};
