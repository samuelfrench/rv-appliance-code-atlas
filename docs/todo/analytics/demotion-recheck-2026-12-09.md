---
title: "RV demotion watch: 14-day recovery and URL Inspection re-check"
status: scheduled
area: analytics
due: 2026-12-09
updated: 2026-11-25
owner: agent
brief: "Re-inspect the 5 flagged 301 URLs + 3 destinations against the 2026-11-25 before state; re-read 90-day GSC by route group; read-only, no indexing requests"
refs:
  - "docs/todo/done/analytics/sitewide-demotion-watch.md"
  - "/home/sam/.local/share/rv-appliance-code-atlas/seo-2026-11-25/inspection-before-2026-11-25.json"
test: null
---

- **What:** The 1-2 week re-check the URL rule requires after the 2026-11-25 demotion-watch review (no canonical change was needed; the flagged URLs are deliberate 2026-11-07 301s).
- **Why:** Confirm Google has recrawled the old `/codes` and `/symptoms` URLs as redirects ("Page with redirect") and has discovered and indexed the destination model pages.
- **Next (read-only):**
  1. `/home/sam/miniconda3/bin/python3 scripts/seo/gsc-quality-sample.py inspect ~/.local/share/rv-appliance-code-atlas/seo-2026-11-25/inspect-manifest-2026-11-25.json ~/.local/share/rv-appliance-code-atlas/seo-2026-11-25/inspection-after-2026-12-09.json` and the same for `inspect-manifest-destinations-2026-11-25.json`. Before: 5/5 "Crawled - currently not indexed" (last crawl <= 2026-09-24); 3/3 destinations "URL is unknown to Google".
  2. `scripts/seo/gsc-quality-sample.py pages ~/.local/share/rv-appliance-code-atlas/seo-2026-11-25/gsc-pages-90d-2026-12-09.json 90`. Before (2026-08-26..11-23): property 513 impr / 1 click; `/` 494/1; `/symptoms` 20/0 (14 URLs); `/codes` 11/0 (10 URLs).
  3. Record both in this file. Done when the old URLs read as redirects and at least the 3 destinations are crawled; if destinations are still unknown, raise the sitemap-resubmit decision noted in the done demotion task.
