<!-- canonical: explorer-pipeline seo 4f501cb5dd1e seo/README.md. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs. -->
# Explorer-site SEO template

Canonical, dependency-free package (Node >= 20 ESM, `node --test`) that every explorer site vendors. It works on a site's built output (prerendered HTML in `dist/`) and does three things:

1. **content-dates**: sitemap `<lastmod>` that moves only when a page's primary content changes.
2. **latest-links**: every new page is linked from the homepage, its section hub and its sibling pages in the same release, in the prerendered HTML.
3. **sitemap-guard**: a build check that every sitemap URL is a real, indexable, self-canonical, linked, non-thin page.

Why (measured 2026-11-07): of 349 URL Inspection calls across 30 sites, pages with at least one internal referrer were indexed 185/216 (86%), pages with none 29/133 (22%), and all 76 "URL is unknown to Google" pages had none. On 9 sites most sitemap URLs carried one deploy date (devtoolbox and rv 100%, arbor 94%, tea 91%, coffee 89%, beer 80%, cigar 74%, hot-sauce 72%); bbq, etsy-killer and seed-garden emit no lastmod at all. Google uses lastmod only when it is consistently accurate.

## Install into a site

```bash
cd /home/sam/claude-workspace/explorer-pipeline && git pull --rebase
node seo/vendor.mjs --repo /home/sam/claude-workspace/<site> --dest <dest>           # add --dry-run first if you like
node /home/sam/claude-workspace/<site>/<dest>/cli.mjs self-check                     # 0 problem(s)
python3 automation/sync-check.py /home/sam/claude-workspace/<site>                    # or: node seo/sync-check.mjs <site>
```

- `<dest>` is `frontend/scripts/seo-template` for sites with a `frontend/` package (the React component must resolve `react` from `frontend/node_modules`), else `scripts/seo-template`.
- The vendor copies this checkout's committed `HEAD` of `seo/` (not uncommitted edits), minus `tests/`, `vendor.mjs` and `sync-check.mjs`. Each file gets one header line `canonical: explorer-pipeline seo <sha12> seo/<file>`; `<dest>/SEO-TEMPLATE.json` records the commit and the sha256 of every file. Re-running upgrades in place; it refuses (exit 1) when a vendored file was edited in the site, unless `--force`.
- Never edit the vendored copy. Site-specific behaviour goes in the site's adapter (below) or upstream here. `cli.mjs self-check` fails on an edited copy: run it in the site's CI.
- Drift: `python3 automation/sync-check.py <repo>` now reports lanelib modules and any `SEO-TEMPLATE.json` copy (`canonical`, `stale-canonical` = re-vendor, `modified`, `missing`, `removed-upstream`, `extra`). Exit 0 none, 1 drift, 2 nothing vendored.
- Commit in the site: the vendored dir, the adapter, the seed (`seo/content-dates.seed.json`), and `.gitignore` lines for `.seo-cache/` and the generated `latest.json`. Add the vendored dir to the site's eslint/prettier ignore lists (it follows this repo's style, not the site's).

## Adapter (site-owned, optional keys)

One ESM module in the site, outside the vendored dir, passed with `--adapter`. Full example: [`adapter.example.mjs`](adapter.example.mjs); contract: [`lib/adapter.mjs`](lib/adapter.mjs).

| Key | Default | Use |
|---|---|---|
| `origin` | `--origin` | `https://host`, no trailing slash |
| `contentSelectors` | `['main', '[data-seo-content]']`, then `<body>` | Primary content. Supports `tag`, `#id`, `.class`, `[attr]`, `[attr=value]` and compounds; no combinators |
| `normalizeText(text, path)` | none | Remove site-specific volatile text before hashing (set `normalizeId` to a new string when you change it) |
| `section(path)` | first path segment | latest-links section; `null` = no section |
| `include(path, section)` | not `/`, not the hub `/<section>` | latest-links filter |
| `title(path)` | ledger `title` (the page's h1 last build), then the slug | Link text for pages new in this build |
| `routes()` | none | Route list before render, when no sitemap exists yet |
| `seedDate(path, ctx)` | none | Evidence for pages the prior ledger does not know: return `'YYYY-MM-DD'`, `{firstSeen, lastmod}` or `null`. `ctx.gitDates(files)`, `ctx.gitLastDate(files)` (`git log -1 --format=%cs -- <files>`), `ctx.gitFirstDate(files)`; all return `null` in a shallow clone |
| `distrustDates` | `[]` | Placeholder dates never used as seed evidence (launch-date floors, old deploy dates) |
| `guardExempt(path, check)` | none | Skip one guard check for one URL |
| `hubPath(section)` | `/<section>` | Where `verify-live` finds a section hub |
| `ignoreFiles` | 404/50x/200/spa-fallback/offline/`_*`/verification files | Extra dist files that are not pages (RegExps on the dist-relative path) |
| `minWords` | 150 | Guard word floor |

## The `data-seo-ignore` rule

The content hash covers the primary content: `<main>` (or the configured selector), else `<body>`. Removed before hashing: `script`, `style`, `noscript`, `svg`, `template`, `iframe`, `nav`, landmark `header`/`footer` (not inside `article`, `aside`, `main`, `nav` or `section`; an article's own header with its h1 stays), `[hidden]`, `aria-hidden="true"` (except images), and **any element with `data-seo-ignore`**. Hashed asset names (`index-BxQ3k2Lm.js`, `hero.3f9a2b1c.jpg`), `?v=` asset queries, hex build/commit ids, `Build 2026.11.07-3`-style stamps, ISO timestamps and whitespace are normalized. Link targets (`<a href>`) and image identities (`src` + `alt`) are part of the hash.

**Put `data-seo-ignore` on every block whose content changes when OTHER pages change**: Latest/Recent/New lists, "related" and "popular" lists, random or rotating picks, counters ("312 shops"), "updated today" stamps, ads and newsletter boxes. A hub's own listing of its pages is its content: leave it hashed (a new entry is a real change to the hub).

Check what is hashed for one page: `node <dest>/cli.mjs ledger explain --dist dist --path /guides/austin --adapter <adapter>`.

## Ledger and persistence

Format (`<dist>/seo/content-dates.json`, served at `https://<host>/seo/content-dates.json`; Java reads the same file):

```json
{"version": 1, "generatedAt": "2026-11-07T15:00:00.000Z", "buildDate": "2026-11-07",
 "meta": {"generator": "explorer-pipeline/seo 1a2b3c4d5e6f", "origin": "https://example.com", "hashConfig": "d51bc8f695a6", "priorSource": "live", "mode": "live"},
 "urls": {"/guides/austin": {"hash": "365d1251cbaeec2e", "firstSeen": "2026-09-01", "lastmod": "2026-11-02", "title": "Coffee in Austin"},
          "/old-page": {"hash": "…", "firstSeen": "2026-01-01", "lastmod": "2026-02-01", "removed": "2026-11-01"}}}
```

Keys are normalized paths (no query, no trailing slash except `/`, no `index.html`). `null` dates mean no real evidence: the sitemap omits `<lastmod>` and latest-links skip the page. `removed` entries are tombstones (pruned after 90 days) so a page that drops out of one build keeps its dates when it returns. `{hash: null, planned: true}` entries are written by `prepare` for routes not built yet; a planned route that is never built is tombstoned with its planned dates, so it is not re-planned at the top of latest.json on every build. `hash: null` without `planned` is an imported seed entry (`ledger import`). The ledger tracks every built page except meta-refresh redirect stubs (`--ledger-scope sitemap` limits it to sitemap URLs); with a sitemap, the safety shares below are measured on sitemap URLs only.

**Chosen design: publish the ledger with the site and carry it forward from production.** Each build fetches `https://<host>/seo/content-dates.json` (the copy the last deploy shipped), carries unchanged dates forward, and publishes the next copy in `dist/`. It survives ephemeral CI runners and Docker/remote builders, needs no commit per content change, and the deployed file is exactly what Java and `verify-live` read. Fallbacks, in order: the live copy, then committed fallback files (`--fallback seo/content-dates.seed.json`), then nothing (bootstrap rules). A fetch failure (timeout, HTTP error, an SPA `index.html` served for the path, an invalid ledger) is logged as a `WARNING` and a GitHub Actions `::warning::`; it never stamps every URL with today.

Rejected:
- **Committed ledger + CI `--check`.** Every content commit would have to regenerate and commit a large JSON; agents forget, CI fails late, and parallel agent lanes (14 sites, several lanes each) conflict on one generated file. Violates "no hand-updated file per content commit".
- **git-history dates per source file as the mechanism.** Needs a route-to-source map per site (cigar's `frontend/scripts/sitemap-dates.mjs` is 409 lines with a TypeScript AST reader, plus 25 test files), is wrong in shallow CI clones (every date = HEAD), moves every page when a shared template or data file changes, and cannot see rendered changes from data joins. Kept only as a seeding helper (`ctx.gitDates`).
- **CI cache (actions/cache) as the store.** Per-branch, evictable, invisible to the Java runtime; a miss silently becomes a bootstrap.
- **External store (S3, DB).** New credentials or accounts (owner-only) for no gain over the deployed file.

## Date rules

| Case | firstSeen | lastmod |
|---|---|---|
| Path in prior, hash unchanged | kept | kept |
| Path in prior, hash changed | kept | build date |
| Path in prior with `hash: null` (imported seed) | kept | kept (a missing field is filled from evidence) |
| Planned by `prepare`, live prior | planned (build date) | planned (build date) |
| Planned by `prepare`, fallback or no prior | re-resolved like a new path, with page dates | re-resolved |
| New path, prior is the live ledger | build date | build date |
| New path, prior is a fallback file | evidence, else build date | evidence, else build date |
| New path, no prior (bootstrap) | evidence, else `null` | evidence, else `null` |

Evidence order (per field): `--import` ledgers, adapter `seedDate`, the page's JSON-LD `datePublished`/`dateModified` (or `article:*_time` meta). Future dates and dates before 1995 are ignored; `firstSeen` is clamped to `lastmod`.

Safety rules (all logged loudly; planned entries count as new for every one of them):
- More than 50% of pages (>= 20 pages) missing from a prior: treated as a bootstrap, no build date for unknown pages. `prepare` applies the same rule to its route list.
- More than 50% of known pages (>= 20) changing hash in one build: a template change, hashes rebaselined, no lastmod moved. `--mass-change accept` overrides when the content really changed everywhere. A changed `contentSelectors`/`normalizeId` (meta `hashConfig`) always rebaselines.
- One page `dateModified` on more than 50% of new pages (>= 20): a template default (beer's local dist has `2026-10-01` on 1,139/1,467 pages), not used as lastmod. `datePublished` still counts for firstSeen.
- The origin is part of the hash config: same-site absolute links are hashed as paths, so `--origin` is required wherever hashes are computed.
- `--distrust-date D` (repeatable) or adapter `distrustDates`: a known placeholder never counts as evidence.

## Build order (the bootstrap problem) and why it is consistent

latest.json needs first-publish dates, the ledger needs the built HTML, and the HTML must contain the latest links. Solved by planning before render:

1. **`prepare` (before render)** loads the prior ledger (live, else fallback), reads this build's route list, gives every route the prior does not know its first-publish date by the same rules `finalize` will use (live prior: the build date), writes `latest.json`, and writes the prior plus those planned `hash: null` entries to `--prior-out`.
2. **Render.** Templates import `latest.json`. The latest blocks carry `data-seo-ignore`, so they never change any page's hash.
3. **`finalize` (after render)** reads `--prior-out`, hashes every built page, keeps the planned dates for the new pages, writes `dist/seo/content-dates.json` and `dist/seo/latest.json`, rewrites sitemap lastmod (`--lastmod`), recomputes latest from the final ledger and warns on any difference (`--strict` fails), prints the top-date share, and runs the guard.

Edge: on a bootstrap or fallback run, planned pages are re-dated after render from the full evidence chain (their JSON-LD is only visible then), so that build can rank a few pages differently from what it rendered. `finalize` reports both directions: pages the final ledger ranks newest that the rendered lists lack, and rendered links to pages it does not rank there (including routes that were planned but never built). `--strict` makes either a failure.

## Recipes

Commands below assume `<dest>` = `scripts/seo-template` relative to the package that builds (`frontend/` for shape A and B). `SEO=node scripts/seo-template/cli.mjs`.

### Shape A: Vite + vite-react-ssg with a JS sitemap generator (cigar, tea, beer, hot-sauce, bbq, coffee build side)

1. Vendor: `node seo/vendor.mjs --repo ~/claude-workspace/<site> --dest frontend/scripts/seo-template`.
2. Adapter `frontend/scripts/seo-adapter.mjs` (start from `adapter.example.mjs`): `origin`, `contentSelectors` if the layout has no `<main>` (tea and beer: add `<main>` to `Layout.tsx` or wrap page content in `data-seo-content`), `seedDate`, `title`.
3. Component `frontend/src/components/LatestPages.tsx`:
   ```tsx
   import latest from '../data/latest.json';
   import { LatestPages as Base, type LatestPagesProps } from '../../scripts/seo-template/render/LatestPages';
   export function LatestPages(props: Omit<LatestPagesProps, 'latest'>) { return <Base latest={latest} {...props} />; }
   ```
   Homepage `<LatestPages scope="site" />`; each hub `<LatestPages scope="section" section="blog" />`; each detail page `<LatestPages scope="page" path={pathname} section="blog" />`. Plain `<a href>`, server-rendered, no client fetch.
4. `.gitignore` (in `frontend/`): `.seo-cache/` and `src/data/latest.json`.
5. `frontend/package.json` (insert, keep existing steps):
   ```json
   "seo:prepare": "node scripts/seo-template/cli.mjs prepare --adapter scripts/seo-adapter.mjs --fallback seo/content-dates.seed.json --routes public/sitemap.xml --latest-out src/data/latest.json --prior-out .seo-cache/prior.json",
   "seo:finalize": "node scripts/seo-template/cli.mjs finalize --adapter scripts/seo-adapter.mjs --dist dist --prior .seo-cache/prior.json --sitemap dist/sitemap.xml --lastmod --latest src/data/latest.json --guard warn --report .seo-cache/report.json",
   "predev": "npm run seo:prepare -- --offline",
   "pretest": "npm run seo:prepare -- --offline"
   ```
   In `build`: run `seo:prepare` after the step that writes the route list (sitemap) and before `tsc`/`vite-react-ssg build`; run `seo:finalize` after the last step that writes `dist/sitemap.xml`.
   - cigar: `generate-sitemap.mjs` writes `public/sitemap.xml` and `public/sitemap-city-guides.xml` before SSG: prepare right after it; finalize after `vite-react-ssg build`, with `--sitemap dist/sitemap.xml --sitemap dist/sitemap-city-guides.xml` so both files get ledger dates (the 549 city-guide URLs are a subset of `sitemap.xml`). Import the existing ledger in the seeding run: `--import seo/sitemap-dates.json`.
   - hot-sauce, bbq: the sitemap is written to `dist/` after SSG, so prepare has no file: export the route list from `scripts/generate-sitemap.mjs` and return it from adapter `routes()` (omit `--routes`). The build runs inside Docker (`frontend/Dockerfile`), so the seed must sit inside the build context (`frontend/seo/`). hot-sauce: `--import ../content/content-dates.json`.
   - coffee: the incremental deploy path (`build:incremental` + `merge-incremental-dist.js`) must run `seo:finalize` on the merged `dist/` too, or the next build falls back to the seed.
6. Seed once (locally, full git history): run the full build, then
   ```bash
   cd frontend && node scripts/seo-template/cli.mjs ledger update --adapter scripts/seo-adapter.mjs --dist dist --sitemap dist/sitemap.xml --out seo/content-dates.seed.json [--import <legacy ledger>] [--distrust-date <placeholder>] --report .seo-cache/seed-report.json
   node scripts/seo-template/cli.mjs ledger check --ledger seo/content-dates.seed.json --sitemap dist/sitemap.xml
   ```
   It uses the same page scope as `finalize` (every built page except redirect stubs). Read the warnings and the top-date share. Commit the seed. Refresh it now and then with `ledger fetch --origin https://<host> --out seo/content-dates.seed.json` (it is only the fallback).
7. CI: no workflow change beyond the build script; the runner needs outbound HTTPS to its own site. Add `node scripts/seo-template/cli.mjs self-check`. Make sure the deploy publishes `dist/seo/`.

### Shape B: Java Spring `SitemapController` serves `/sitemap.xml` (coffee, tea, beer, honey; mushroom and marketing-ai see Limits)

1. Frontend: everything in shape A. `finalize` writes `frontend/dist/seo/content-dates.json`; the image copies dist to `/usr/share/nginx/html` (coffee `Dockerfile:108`, same container as `/app/app.jar`), so the JVM reads `/usr/share/nginx/html/seo/content-dates.json` at run time. Confirm the dist splitter keeps `seo/` in the non-image layer.
2. Java: copy [`java/SeoContentDates.java`](java/SeoContentDates.java) to `backend/src/main/java/<site package>/seo/SeoContentDates.java`, change only the `package` line. In `SitemapController`:
   ```java
   private final SeoContentDates contentDates = new SeoContentDates();   // or a @Bean
   // per URL:
   Optional<SeoContentDates.Entry> e = contentDates.lookup(path);
   String lastmod = e.isPresent() ? (e.get().lastmod() == null ? null : e.get().lastmod().toString()) : existingLastmod(path);
   if (lastmod != null) xml.append("<lastmod>").append(lastmod).append("</lastmod>");
   ```
   A URL the ledger knows with a `null` lastmod gets no `<lastmod>`: never fall back to `LocalDate.now()`, `lastUpdated.json`, a launch date or a hardcoded constant for it. `existingLastmod` stays only for Java-only URLs the ledger does not know. The reader re-reads the file when it changes (checked at most once a minute) and keeps the last good copy if the file breaks.
3. Tests: put a small ledger at `backend/src/test/resources/seo/content-dates.json` (classpath fallback) or construct `new SeoContentDates(Path.of("src/test/resources/seo/content-dates.json"))`.
4. Guard: before deploy, guard the JS sitemap in `dist/`; after deploy, guard the real Java URL list against the same build: `node scripts/seo-template/cli.mjs guard --adapter scripts/seo-adapter.mjs --dist dist --sitemap https://<host>/sitemap.xml --warn`. Java URLs with no prerendered page fail `exists`: that is the finding (a sitemap URL served as an empty SPA shell).
5. beer: the controller already reads classpath `sitemap/sitemap-content-dates.json`; import it (`--import ../backend/src/main/resources/sitemap/sitemap-content-dates.json`) and decide whether its `launch_date` floor (`2026-10-01`) is true for those pages; if unsure, `--distrust-date 2026-10-01`. honey: replace the ~1,000 hardcoded `LocalDate.of(...)` constants with the ledger lookup.

### Shape C: plain static generator (rv `scripts/generate-static.mjs`, dev-tools `scripts/prerender.ts` + `src/seo/sitemap.ts`, home-upgrade `scripts/generate-seo-assets.mjs`, seed-garden, arbor, etsy-killer)

1. Vendor with `--dest scripts/seo-template` (repo root).
2. In the generator, before writing pages (it already has every route and title in memory):
   ```js
   import { mkdirSync, writeFileSync } from 'node:fs';
   import { fetchPriorLedger } from './seo-template/lib/fetch-ledger.mjs';
   import { todayIn } from './seo-template/lib/ledger.mjs';
   import { forPage, forSection, forSite, planLatest, withPlanned } from './seo-template/lib/latest.mjs';
   import { renderLatestHtml } from './seo-template/render/latest-html.mjs';

   const buildDate = process.env.SEO_BUILD_DATE || todayIn();
   const { ledger: prior } = await fetchPriorLedger({ origin: 'https://rvappliancefaultcodes.com', fallbacks: ['seo/content-dates.seed.json'] });
   const { latest, planned } = await planLatest({ ledger: prior, buildDate, routes: pages.map((p) => ({ href: p.url, title: p.title })) });
   mkdirSync('.seo-cache', { recursive: true });
   writeFileSync('.seo-cache/prior.json', JSON.stringify(withPlanned(prior, planned)));
   writeFileSync('.seo-cache/latest.json', JSON.stringify(latest));
   // templates: home  renderLatestHtml(forSite(latest), { heading: 'New codes' })
   //            hub   renderLatestHtml(forSection(latest, 'codes'))
   //            page  renderLatestHtml(forPage(latest, page.url))
   ```
3. After the generator: `node scripts/seo-template/cli.mjs finalize --origin https://<host> --dist dist --prior .seo-cache/prior.json --sitemap dist/sitemap.xml --lastmod --latest .seo-cache/latest.json --guard warn`. The generator keeps writing `sitemap.xml` (without dates or with its constant); `--lastmod` replaces them. Remove constants such as rv `CONTENT_UPDATED` and home-upgrade `lastmod='2026-06-04'`.
   - rv: nested `dist/<route>/index.html`, trailing-slash URLs: handled (keys are normalized, hrefs keep the slash).
   - dev-tools: content is `<article id="seo-content">` after an empty `#root`: adapter `contentSelectors: ['article#seo-content']`.
   - home-upgrade: pages are copies of `index.html` with only title and description swapped; every page hashes the same empty body and the guard flags every URL as thin. Fix the prerender first; the ledger cannot date content that is not in the HTML.
   - seed-garden: S3 sync deploys `dist/seo/` with everything else.

### CI step order (every shape)

1. Existing generators that produce the route list.
2. `prepare` (network: one GET of `https://<host>/seo/content-dates.json`).
3. Render (SSG or generator).
4. Every step that writes `dist/sitemap.xml`.
5. `finalize`: `dist/seo/content-dates.json`, `dist/seo/latest.json`, sitemap lastmod, top-date share, guard.
6. Deploy as today. Docs-only paths stay in `paths-ignore`; the vendored dir, adapter and seed ship (do not ignore them).
7. After deploy: `verify-live` (below).

Guard rollout: start with `--guard warn` and record the counts in the site's TODO. Fix or exempt (`guardExempt`, one line per reason), then `--guard fail --max-violations <current count>`, and ratchet to 0.

## Verify after deploy

```bash
node scripts/seo-template/cli.mjs verify-live --adapter scripts/seo-adapter.mjs --origin https://<host>
node scripts/seo-template/cli.mjs sitemap check --sitemap https://<host>/sitemap.xml --max-top-share 0.5
curl -4 -s https://<host>/seo/content-dates.json | head -c 300
```

`verify-live` checks: the live ledger loads; the live sitemap's most common lastmod is on at most 50% of dated URLs; the raw homepage HTML links every site-wide latest page; each section hub (`hubPath`) links its section's latest pages; one sibling per section links the section's newest pages. Done = top-date share < 50%, every new URL in `latest.json` linked from home, hub and siblings, guard 0 violations (or the recorded ratchet count).

## CLI

`node cli.mjs help` prints everything. Exit codes: 0 ok, 1 a check failed, 2 usage or input error, 3 a required source was unavailable (`--require-live`).

| Command | Key flags |
|---|---|
| `prepare` | `--origin` `--routes FILE...` (sitemap XML, JSON array or text; or adapter `routes()`) `--latest-out` `--prior-out` `--fallback FILE...` `--import FILE...` `--adapter` `--n 8` `--per-section 8` `--ledger-url` `--offline` `--build-date` `--distrust-date` |
| `finalize` | `--dist` `--prior` `--sitemap FILE...` `--out` (default `<dist>/seo/content-dates.json`) `--lastmod` `--unknown remove\|keep` `--latest FILE` `--guard warn\|fail\|off` `--max-violations N` `--min-words N` `--checks LIST` `--max-depth N` `--max-top-share X` `--mass-change rebaseline\|accept` `--ledger-scope all\|sitemap` `--report FILE` `--strict` |
| `ledger fetch` | `--origin` `--ledger-url` `--fallback FILE...` `--out` `--require-live` `--offline` `--timeout ms` |
| `ledger update` | `--dist` `--out` `--origin` (required: same-site links hash as paths) `--prior` `--sitemap FILE...` `--ledger-scope all\|sitemap` `--import FILE...` `--adapter` `--report` |
| `ledger check` | `--ledger FILE\|URL` `--sitemap FILE\|URL...` `--max-top-share X` `--json` |
| `ledger explain` | `--dist` `--path` `--origin` `--adapter` |
| `ledger import` | `--from FILE...` `--out` (cigar, hot-sauce, beer, plain or this format; becomes a seed with `hash: null`) |
| `sitemap lastmod` | `--sitemap FILE...` `--ledger` `--dist` `--unknown remove\|keep` (rewrites in place; index files get the newest child date) |
| `sitemap check` | `--sitemap FILE\|URL` `--max-top-share X` `--json` |
| `latest build` / `latest verify` | `--ledger` `--routes` `--out` `--prior-out` / `--latest` `--strict` |
| `guard` | `--dist` `--sitemap FILE\|URL...` `--origin` `--min-words 150` `--checks exists,noindex,canonical,inbound,words[,reachable]` `--max-violations N` or `--warn` `--max-depth N` `--report FILE` |
| `verify-live` | `--origin` `--adapter` `--sitemap-path` `--max-top-share 0.5` `--siblings 1` `--home-n N` |
| `self-check` | none |

Guard checks per sitemap URL: `exists` (a built page; a meta-refresh stub fails), `noindex` (every robots/googlebot meta, whole directives `noindex` or `none`; `X-Robots-Tag` headers are not visible in files), `canonical` (exactly one `rel=canonical`, equal to the sitemap `<loc>` including the trailing slash), `inbound` (at least one `<a href>` from another built page; the sitemap does not count, `rel=nofollow` does not count, nav/footer links do), `words` (visible primary-content words, `data-seo-ignore` blocks excluded), optional `reachable` (BFS from `/`) and `--max-depth`. Always reported: click-depth histogram and violations by section.

## API (import from the vendored `lib/`)

- `lib/ledger.mjs`: `updateLedger({prior, pages, buildDate, hashConfig, imports, seedDate, seedCtx, origin, options})`, `resolveNewDates`, `importLegacy(json)`, `readLedgerFile`, `validateLedger`, `lookup(ledger, url)`, `lastmodFor(ledger, url)`, `checkLedger(ledger, {paths})`, `dateStats(dates)`, `priorSourceOf`, `todayIn(tz)`, `DEFAULTS`.
- `lib/fetch-ledger.mjs`: `fetchPriorLedger({origin, url, fallbacks, timeoutMs, offline})` -> `{ledger, source: 'live'|'fallback'|'none'}`.
- `lib/latest.mjs`: `planLatest({ledger, routes, buildDate, adapter, n, perSection})` -> `{latest, planned}`, `withPlanned(ledger, planned)`, `forSite(latest, {n, exclude})`, `forSection(latest, section, {n})`, `forPage(latest, path, {n: 5, section})`, `diffLatest`, `defaultSection`, `defaultInclude`.
- `lib/sitemap.mjs`: `parseSitemap`, `readSitemapUrls(files, {dist})`, `injectLastmod(xml, ledger, {unknown})`, `updateIndexLastmod`, `buildSitemapXml(urls, {ledger})`.
- `lib/guard.mjs`: `guardSitemap({sitemapEntries, scan, minWords, checks, exempt, maxDepth})`, `formatGuardReport`, `CHECKS`.
- `lib/scan.mjs`: `scanDist(dist, {origin, contentSelectors, normalizeText, hrefs, ignoreFiles})`, `inboundMap`, `depthFrom`.
- `lib/content.mjs`: `analyzePage(html, opts)`, `canonicalContent`, `contentHash`, `pageDates`, `countWords`, `normalizeVolatile`, `HASH_VERSION`.
- `lib/seed.mjs`: `gitDates(files, {cwd})`, `gitLastDate`, `gitFirstDate`, `isShallow`.
- `render/latest-html.mjs`: `renderLatestHtml(items, {heading, headingTag, className, showDates})`. `render/LatestPages.tsx`: `LatestPages`, `selectLatest` (logic in `render/select-latest.ts`, tested for parity with `forSite`/`forSection`/`forPage`).
- `java/SeoContentDates.java`: `lookup(path)`, `lastmod(path)`, `firstSeen(path)`, `normalizePath(url)`, `size()`, `source()`.

## Measured on local dists (2026-11-07, read-only; dist dates in brackets, so numbers are stale for fast-moving sites)

| Site | Built pages | Sitemap URLs | Guard violations (inbound / words / other) | Bootstrap dates from page JSON-LD alone | Scan time |
|---|---|---|---|---|---|
| coffee [10-07] | 10,016 | 8,975 | 95 / 582 / `/` missing in that dist | 2,259 of 10,018 (before spa-fallback/offline were ignored) | 19.4 s, 308 MB RSS |
| cigar [11-02] | 4,651 | 4,632 | 13 / 46 / 0; 32 unreachable from `/` | 171 (+4,461 from its own ledger) | 6.1 s, 241 MB |
| beer [11-04] | 1,864 | 1,854 | 0 / 26 / 0 | 335 after dropping the `2026-10-01` default on 1,139 | |
| tea [10-26] | 686 | 676 | 6 / 28 / 2 noindex | 218 | |
| rv [11-05] | 1,986 | 683 | 0 / 0 / 0 | 0 | |
| seed-garden [11-04] | 508 | 508 | 0 / 16 / 0 | 123 | |
| hot-sauce [11-05] | 314 | 314 | 0 / 6 / 0 | 82 (+232 from `content/content-dates.json`) | 0.4 s |
| bbq [10-01] | 209 | 209 | 0 / 1 / 0 | 0 | |

## Limits

- mushroom and marketing-ai are SPAs with no prerendered HTML (mushroom serves bots a separate server-rendered path). There is nothing in `dist/` to hash or guard; the Java reader can serve a ledger, but producing one needs a snapshot of the bot-rendered pages. Not covered yet (explorer-pipeline TODO).
- The guard reads files, so `X-Robots-Tag` headers and redirects configured in nginx are invisible to it; `verify-live` and the URL-change rule cover those.
- `contentSelectors` takes simple selectors only (no descendant combinators).
- The HTML parser is built for generated pages (React SSR and string templates), not arbitrary hand-written HTML.
