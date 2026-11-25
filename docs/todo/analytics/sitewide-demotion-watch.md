---
title: "Sustained Google demotion: RV Appliance Fault Codes"
status: scheduled
area: analytics
due: 2026-11-26
updated: 2026-11-25
owner: agent
brief: "Sustained Google demotion (technical): auto-diagnosed 2026-11-25 by cron:index-brake; report /home/sam/.local/state/cron-manager/demotion/rv-appliance-fault-codes/2026-11-25.md"
refs:
  - "/home/sam/.local/state/cron-manager/demotion/rv-appliance-fault-codes/2026-11-25.md"
test: null
---

- **What:** RV Appliance Fault Codes stays far below its earlier Google impressions; cron:index-brake flagged it and diagnosed it automatically.
- **Why:** a site Google has demoted earns nothing from new pages; the fix is quality, indexing or a technical repair, per the verdict.
- **Next:** the steps in the Demotion watch section below.

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
