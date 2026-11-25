---
title: "Sustained Google demotion: RV Appliance Fault Codes"
status: done
area: analytics
due: null
updated: 2026-11-25
owner: agent
brief: "2026-11-25: the 7 'canonical points elsewhere' URLs are deliberate 2026-11-07 301s to self-canonical /models/ pages (watch false positive, fixed in cron-manager f586680); no canonical change; recovery read in docs/todo/analytics/demotion-recheck-2026-12-09.md"
refs:
  - "/home/sam/.local/state/cron-manager/demotion/rv-appliance-fault-codes/2026-11-25.md"
  - "21284f9cfb674d55dc1de509509669b1abf0295c"
  - "docs/todo/analytics/demotion-recheck-2026-12-09.md"
test: null
---

- **What:** cron:index-brake flagged a sustained demotion (last 28 days 5 impressions vs 1,384 in 2026-06-27..07-24; drop 2026-07-25) and a technical verdict: 7 of 15 sampled `/codes/*` and `/symptoms/*` URLs "canonical points elsewhere" (a `/models/` hub).
- **Result (2026-11-25):** not a template bug and not the cause of the drop. Those URLs are single-hop nginx 301s from the deliberate 2026-11-07 consolidation (`21284f9`: 683 thin pages folded into 74 model pages and hubs, 1,057 redirects). The watch followed each 301 and compared the destination's canonical with the requested URL. Fixed in cron-manager `f586680` (`backend/index_brake.py` `onsite_checks` now judges the canonical against the served URL and flags a redirect only when the sitemap lists it); re-run on the same 15 URLs: 0 problems, 7 redirects. The drop (2026-07-25) predates the consolidation by 3.5 months; URL Inspection shows Google canonical = user canonical on all 5 re-inspected URLs, matching the 2026-09-06 diagnosis (quality: "Crawled - currently not indexed", owned by `docs/todo/content/quality-consolidation-followthrough.md`).
- **Next:** the 14-day recovery read in `docs/todo/analytics/demotion-recheck-2026-12-09.md`.

## Measured and shipped 2026-11-25 (Claude Opus 5.5, headroom agent)

- **GSC 90 days before any change** (2026-08-26..2026-11-23, page dimension, `scripts/seo/gsc-quality-sample.py pages`, output `~/.local/share/rv-appliance-code-atlas/seo-2026-11-25/gsc-pages-90d-2026-11-25.json`, kept out of git): property 513 impressions / 1 click. `/` 494 impr / 1 click; `/symptoms/*` 20 impr / 0 clicks over 14 URLs (max 4: `furrion-range-cooktop-burners-do-not-light-ffd`, `suburban-tank-water-heater-pt-relief-drip-air-pocket`); `/codes/*` 11 impr / 0 clicks over 10 URLs (max 2: `lippert-ground-control-rf-jack`). The 7 flagged URLs: 0 rows in 90 days.
- **Live 2026-11-25:** sitemap 74 URLs (40 models, 14 guides, 12 symptoms, 7 brands, home), all 200, `index,follow`, self-canonical, 0 bad. 20-URL sample (7 flagged + 12 sitemap symptoms + 1 GSC symptom): 8 are 301 -> 200 `index,follow` self-canonical destination with the `#anchor` present; 12 are 200 `index,follow` self-canonical. Prep pages (e.g. `/symptoms/maxxair-fans-family-model-prep/`) are 200 `noindex,follow`, self-canonical, not in the sitemap. `/brands/suburban-atwood/` (report: 5xx on 2026-07-22 crawl) is now 200 self-canonical.
- **Guard added:** `src/lib/build-pages.test.ts` "makes every live /codes and /symptoms page self-canonical" (exactly one canonical, equal to the page URL). Existing tests already require sitemap pages self-canonical and every redirect single-hop to an indexable anchor.
- **Script fix:** `scripts/seo/gsc-quality-sample.py inspect` failed with "service-account client path not implemented" (traffic-report now hands back `ServiceAccountGscClient`); it now calls `urlInspection().index().inspect` on the read-only service client. Read-only; no indexing requests or sitemap submits.
- **URL Inspection before state** (`~/.local/share/rv-appliance-code-atlas/seo-2026-11-25/inspection-before-2026-11-25.json` and `inspection-destinations-before-2026-11-25.json`): the 5 flagged URLs are all "Crawled - currently not indexed", last crawl 2026-07-12..2026-09-24 (none since the 11-07 redirects), Google canonical = the URL itself. The 3 destinations `/models/dometic-thermostats/`, `/models/furrion-refrigerators/`, `/models/dometic-rm10-refrigerators/` are "URL is unknown to Google" 18 days after launch.
- **Open (not done here, owner decision):** the new model pages are undiscovered. The consolidation lane's standing rule is no sitemap resubmission and no indexing requests; that rule now delays discovery of the 40 model pages. If the 2026-11-28 D+21 re-read still shows most model pages "unknown", a single read-only-safe sitemap resubmit in Search Console is the lever; it is a write to Google, so it was not done here.

<!-- demotion-watch: rv-appliance-fault-codes -->
## Demotion watch (cron:index-brake, diagnosed 2026-11-25)

- **Report:** `/home/sam/.local/state/cron-manager/demotion/rv-appliance-fault-codes/2026-11-25.md` (JSON beside it). Regenerated at most every 14 days while the site stays flagged.
- **Flagged by:** last 28 days 5 impressions = 0% of the best earlier 28 days (1,384, 2026-06-27..2026-07-24); 0 of 20 URLs indexed in the weekly indexing probe (2026-11-21).
- **Verdict (technical):** 7 on-site problem(s) in 15 sampled pages: https://rvappliancefaultcodes.com/symptoms/dometic-ccc2-hourglass-compressor-delay/: canonical points elsewhere; https://rvappliancefaultcodes.com/codes/furrion-arctic-refrigerator-diagnostic-led-flash-4/: canonical points elsewhere; https://rvappliancefaultcodes.com/codes/dometic-rm10-display-fault-52-ground-contact-gas-valve-reset/: canonical points elsewhere. No code commit or deploy within 3 days of 2026-07-25. No Google ranking update overlaps the drop. 1 of 8 other sites fell by half on the same dates.
- **Drop date:** 2026-07-25 (52.0/day to 5.9/day).
- **By page type (per day, before to after):** `/symptoms` 25.29 to 1.11, `/ (home)` 15.32 to 6.07, `/codes` 9.39 to 0.43, `/brands` 0.04 to 0.0.
- **URL Inspection:** 1 of 15 sampled URLs indexed (Submitted and indexed 1, Crawled - currently not indexed 9, Server error (5xx) 1, URL is unknown to Google 4).
- **Do next (agent):**
  1. Fix the on-site problems listed in the report (robots, noindex, canonical, HTTP status) and verify each URL live.
  2. Re-run URL Inspection on the same URLs after the fix ships (read-only; never request indexing).
  3. Before any noindex, redirect or removal, pull each URL's 90-day GSC impressions first (URL rule in ~/.claude/CLAUDE.md).
  4. Record what you measured and shipped in this task, then set it to `scheduled` with `due` 14 days out for the recovery read (the daily GSC series in the report's terms), or `done` when the watch reports the site recovered.
<!-- /demotion-watch -->
