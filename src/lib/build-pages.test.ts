import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildSite } from "../../scripts/lib/build-pages.mjs";
import { loadSiteData } from "../../scripts/lib/site-data.mjs";
import { checkTopicNotes } from "../../scripts/seo/check-topic-notes.mjs";

type Page = { route: string; html: string; indexable: boolean; robots: string; title: string };
type Redirect = { from: string; to: string };

const data = loadSiteData(process.cwd());
const appHtml = readFileSync("index.html", "utf8");
const BUILD_DATE = "2099-01-01";
const site = buildSite({ ...data, appHtml, buildDate: BUILD_DATE });
const base: string = data.corpus.site.baseUrl;
const pages: Page[] = site.pages;
const live = new Map(pages.map((page) => [page.route, page]));
const redirects: Redirect[] = site.redirects;
const redirectFrom = new Map(redirects.map((item) => [item.from, item.to]));
// The 683 URLs the sitemap listed on 2026-11-07, before consolidation.
const previousSitemap = readFileSync("src/lib/fixtures/sitemap-2026-11-07.txt", "utf8").trim().split("\n");

function article(html: string) {
  return html.match(/<article class="detail-article">([\s\S]*?)<\/article>/)?.[1] ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? "";
}

function visibleWords(html: string) {
  const text = article(html)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ");
  return text.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word)).length;
}

function internalLinks(html: string) {
  return [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
}

describe("consolidated site: redirects", () => {
  it("covers every URL that existed before consolidation", () => {
    const old = [
      ...previousSitemap.map((url) => url.replace(base, "")),
      ...data.corpus.entries.map((entry: { slug: string }) => `/codes/${entry.slug}/`),
      ...data.corpus.symptoms.map((symptom: { slug: string }) => `/symptoms/${symptom.slug}/`),
    ];
    const missing = old.filter((route) => !live.has(route) && !redirectFrom.has(route));
    expect(missing).toEqual([]);
  });

  it("sends every old URL in one hop to a live, indexable page", () => {
    for (const redirect of redirects) {
      const target = redirect.to.split("#")[0];
      expect(live.has(redirect.from), redirect.from).toBe(false);
      expect(redirectFrom.has(target), `${redirect.from} -> ${redirect.to} is a chain`).toBe(false);
      expect(live.get(target)?.indexable, `${redirect.from} -> ${redirect.to}`).toBe(true);
    }
  });

  it("lands merged codes and guides on the section that now holds their content", () => {
    for (const redirect of redirects) {
      const [target, anchor] = redirect.to.split("#");
      if (anchor) expect(live.get(target)?.html, redirect.to).toContain(`id="${anchor}"`);
    }
    expect(redirectFrom.get("/codes/dometic-rm10-display-fault-08-level-refrigerator-reset/")).toBe("/models/dometic-rm10-refrigerators/#code-08");
    expect(redirectFrom.get("/symptoms/dometic-rm10-gas-smell/")).toBe("/models/dometic-rm10-refrigerators/#guide-dometic-rm10-gas-smell");
  });

  it("writes an nginx map with quoted values and slashless variants", () => {
    expect(site.nginxMap).toContain('"/codes/norcold-polar-no-fl/" "');
    expect(site.nginxMap).toContain('"/codes/norcold-polar-no-fl" "');
    for (const line of site.nginxMap.trim().split("\n")) expect(line).toMatch(/^"\/[^"\s]+" "\/[^"\s]+";$/);
  });

  it("serves unknown URLs a noindex not-found document without a canonical", () => {
    expect(site.notFound).toContain('<meta name="robots" content="noindex,follow" />');
    expect(site.notFound).not.toContain('rel="canonical"');
  });
});

describe("consolidated site: sitemap and pages", () => {
  it("lists only live, indexable, self-canonical pages that are not redirected", () => {
    for (const entry of site.sitemap) {
      const route = entry.loc.replace(base, "");
      const page = live.get(route);
      expect(page?.indexable, route).toBe(true);
      expect(page?.html).toContain(`<link rel="canonical" href="${base}${route}" />`);
      expect(redirectFrom.has(route)).toBe(false);
    }
    expect(site.sitemap.length).toBe(pages.filter((page) => page.indexable).length);
  });

  it("dates each sitemap URL from the content ledger, not the build date", () => {
    for (const entry of site.sitemap) expect(entry.lastmod, `${entry.loc}: run npm run content-dates`).not.toBe(BUILD_DATE);
  });

  it("keeps the content-dates ledger in sync with page content", () => {
    const stale = Object.entries(site.contentDates as Record<string, { hash: string }>)
      .filter(([route, value]) => data.contentDates[route]?.hash !== value.hash)
      .map(([route]) => route);
    expect(stale, "run npm run content-dates and commit src/data/content-dates.json").toEqual([]);
  });

  it("leaves no orphan: every indexable page except home has an internal link from another page", () => {
    const inbound = new Map<string, number>();
    for (const page of pages) {
      for (const href of new Set(internalLinks(page.html).map((href) => href.split("#")[0].split("?")[0]))) {
        if (href !== page.route) inbound.set(href, (inbound.get(href) ?? 0) + 1);
      }
    }
    const orphans = pages.filter((page) => page.indexable && page.route !== "/" && !inbound.get(page.route)).map((page) => page.route);
    expect(orphans).toEqual([]);
  });

  it("links only to live pages", () => {
    const broken = new Set<string>();
    for (const page of pages) {
      for (const href of internalLinks(page.html)) {
        const route = href.split("#")[0].split("?")[0];
        if (!route || route.startsWith("/images/") || route.startsWith("/assets/") || /\.(xml|json|txt|css|js|ico|png|jpg)$/.test(route)) continue;
        if (!live.has(route)) broken.add(`${page.route} -> ${href}`);
      }
    }
    expect([...broken]).toEqual([]);
  });

  it("gives every indexable page a real body (at least 150 visible words)", () => {
    const thin = pages.filter((page) => page.indexable && visibleWords(page.html) < 150).map((page) => `${page.route} (${visibleWords(page.html)})`);
    expect(thin).toEqual([]);
  });

  it("links brand hubs to every model page, hub and code page of the brand", () => {
    for (const brand of site.model.brands) {
      const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const hub = live.get(`/brands/${slug}/`)!;
      const links = new Set(internalLinks(hub.html));
      for (const family of site.model.families.filter((item: { brand: string; hasPage: boolean }) => item.brand === brand && item.hasPage)) expect(links.has(family.path), family.path).toBe(true);
      for (const topic of site.model.hubs.filter((item: { brand: string }) => item.brand === brand)) expect(links.has(topic.path), topic.path).toBe(true);
      for (const group of site.model.codeGroups.filter((item: { brand: string; standalone: boolean }) => item.brand === brand && item.standalone)) expect(links.has(group.path), group.path).toBe(true);
    }
  });

  it("links each surviving code page to its model page and two or three related codes", () => {
    for (const group of site.model.codeGroups.filter((item: { standalone: boolean }) => item.standalone)) {
      const html = live.get(group.path)!.html;
      for (const topic of group.topics) expect(html).toContain(`href="${topic.path}"`);
      const related = html.match(/<h2>Related codes<\/h2>([\s\S]*?)<\/section>/)?.[1] ?? "";
      expect((related.match(/<a /g) ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives every code a section on exactly one page and links it from every model table", () => {
    for (const group of site.model.codeGroups.filter((item: { standalone: boolean }) => !item.standalone)) {
      const href = site.model.entryPaths[group.slug];
      const [route, anchor] = href.split("#");
      expect(live.get(route)?.html).toContain(`id="${anchor}"`);
      for (const family of group.families.filter((item: { hasPage: boolean }) => item.hasPage)) {
        const html = live.get(family.path)!.html;
        expect(html.includes(`href="#${site.model.anchorFor(family, group)}"`) || html.includes(`href="${href}"`), `${family.path} -> ${href}`).toBe(true);
      }
    }
  });
});

describe("sourced topic notes", () => {
  it("validate against the schema and cite known sources", () => {
    for (const notes of Object.values(data.topicNotes)) {
      const { errors } = checkTopicNotes(notes, data.corpus.sources);
      expect(errors, (notes as { topic: string }).topic).toEqual([]);
    }
  });

  it("render on their page with numbered sources and a visible sources line", () => {
    const notes = data.topicNotes["dometic-rm10-refrigerators"];
    const html = live.get("/models/dometic-rm10-refrigerators/")!.html;
    expect(html).toContain('class="sources-line"');
    expect(html).toContain('id="source-1"');
    expect(html).toContain(notes.sections.reset[0].text.replaceAll("&", "&amp;").slice(0, 40));
    expect(html).toContain("Manual details reviewed 2026-11-07");
  });
});
