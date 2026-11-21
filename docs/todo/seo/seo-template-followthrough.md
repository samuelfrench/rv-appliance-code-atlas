---
title: "Follow through on the existing SEO template release"
status: next
area: seo
due: null
updated: 2026-11-21
owner: agent
brief: "D+14 probe 2026-11-21: 15/20 unknown to Google, 0 indexed, sitemap not re-read since 11-07; next: source the 137-word LO/HI page and ratchet the guard to 0"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-seo-template-followthrough"
test: null
---

- **What:** Preserve the three unfinished follow-ups from the November 7 SEO-template release.
- **Why:** The retained release reports 74 indexable URLs and one 137-word guard violation. These are dated source receipts, not fresh production verification.
- **Done 2026-11-20 (headroom-due run):**
  - Guard ratchet step 1: `seo:finalize` in `package.json` now runs `--guard fail --max-violations 1` (was `--guard warn`). Local `npm run build`: 74 sitemap URLs, 942 built pages, exactly 1 violation (`/symptoms/rv-thermostat-display-lo-hi/`, 137 words, unchanged since 2026-11-07); finalize exit 0 at `--max-violations 1`, exit 1 at `--max-violations 0`. A second sub-150-word sitemap page, or any other guard failure, now fails the build and the Deploy.
  - Fallback seed refreshed with the documented `ledger fetch` command: `seo/content-dates.seed.json` now matches the live ledger fetched 2026-11-20 23:51 UTC (74 URLs; `/` and 5 other pages carry lastmod 2026-11-20). `SEO_OFFLINE=1 npm run build` on it: 74 unchanged, 0 changed, top dates 2026-11-07 68 / 2026-11-20 6, the same as the live build. The old seed (2026-11-07 bootstrap) would have restamped those 6 pages on a fetch failure.
  - Gates: `validate:corpus` 0, `seo:self-check` 0 problems, `test:unit` 227/227, release tests 9/9, live and offline builds green.
  - Released in 196de3b, Deploy run 44839896540 green: the image build ran finalize with `--guard fail --max-violations 1` (1 violation, passed). Live 2026-11-20: `/` and the LO/HI page 200; live sitemap 74 URLs, lastmod 2026-11-07 x68 / 2026-11-20 x6 (top share 91.9%).
- **Done 2026-11-21 (headroom-due run, D+14 read):**
  - Probe (documented command, with `PATH=/snap/bin:$PATH`; see gotcha below), run 2026-11-21 07:52 UTC, output `~/.local/share/rv-appliance-code-atlas/probe-2026-11-21.json` (local only). 20 URLs inspected, 0 errors: **15 "URL is unknown to Google", 5 "Crawled - currently not indexed", 0 indexed**. The 5 crawled pages were last crawled 2026-06-21..2026-10-20, so none has been crawled since the 2026-11-07 release. GSC sitemap `/sitemap.xml`: lastSubmitted 2026-11-07T21:39Z, **lastDownloaded 2026-11-07T21:39Z** (Google has not re-read it in 14 days), 0 errors / 0 warnings. Raw HTML of the first sampled page: 531 words, 48 links.
  - Newest-batch criterion (<= 2/10 unknown) **not met, and not measurable as written**: the probe picks a newest batch only when the sitemap has > 3 distinct lastmod dates; it has 2 (2026-11-07 x68, 2026-11-20 x6), so all 20 were random. 1 of the 6 pages dated 2026-11-20 was sampled (`/models/dometic-rm10-refrigerators/`): unknown. Across the sample, unknown is 15/20 = 75%.
  - D+0 comparison (`~/.local/share/portfolio-indexing-monitor/speed-probe-20261107/probe-20261107.json`, 2026-11-07 15:23 UTC, the pre-consolidation 683-URL sitemap, a different 20 URLs): 14 crawled-not-indexed, 6 unknown, 0 indexed. The shift toward "unknown" fits the 1,057 URL changes: most of the 74 consolidated URLs are new to Google, and Google has not fetched the sitemap since the day they appeared.
  - `npm run seo:verify-live`: exit 1, and its only failure is the documented top-date line (`91.9% of dated URLs share 2026-11-07 (max 50%)`): **live top-lastmod share 68/74 = 91.9%**, 2 distinct dates. Ledger `/seo/content-dates.json` 200, 74 URLs, buildDate 2026-11-20. Homepage 8/8 latest pages linked; all 8 section hubs and siblings pass. The script's `&&` skips `sitemap check` after that failure, so it was run separately: 74 URLs, 74 dated, exit 0.
  - Not done, by the standing hold: no sitemap resubmission and no URL Inspection indexing request. The hold lives in [quality-consolidation-followthrough](../content/quality-consolidation-followthrough.md); lifting it, given the 14-day-old sitemap read, would be Sam's call. That task's D+21 GSC re-read on 2026-11-28 is the next dated measurement.
  - Gotcha: under cron, `gcloud` (`/snap/bin/gcloud`) is not on PATH. The probe then prints nothing, exits 0 and writes `skipped: no client/url` with credential error `local-gcloud-adc FileNotFoundError`. Prefix the command with `PATH=/snap/bin:$PATH`.
- **Next:** The D+14 item in the verbatim block below is complete (results above). (1) Source the LO/HI page (item 1 below) and change `--max-violations 1` to `--max-violations 0`. (2) Refresh the seed again whenever several pages change. Further indexing reads belong to the 2026-11-28 D+21 re-read in quality-consolidation-followthrough, not to this task. Superseded plan from 2026-11-20 (kept for history): (1) On or after 2026-11-21 run the D+14 probe and `npm run seo:verify-live` (item 2 below); record the newest-batch "unknown to Google" count and the live top-lastmod share (68/74 = 91.9% on 2026-11-20 by local build). (2) Then source the LO/HI page (item 1 below) and change `--max-violations 1` to `--max-violations 0`. (3) Refresh the seed again whenever several pages change. Follow the individual items below within existing authority. Keep the recorded November 21 observation as a historical follow-up, not a freeze or prerequisite for useful corrections. Never edit the vendored SEO engine; change the owning template and re-vendor.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 3-23, on 2026-11-08. -->
> Older history (TODO.md lines 3-18) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-seo-template-followthrough) on 2026-11-08.
**Open items (rv-seo):**
- [ ] Guard ratchet: add sourced content to `/symptoms/rv-thermostat-display-lo-hi/` (>= 150 primary words, every claim from a manufacturer source) or fold it into its model pages under the URL-change rule; then change `seo:finalize` in `package.json` to `--guard fail --max-violations 0`. Until then the next step is `--guard fail --max-violations 1`.
- [ ] D+14 check on or after **2026-11-21** (read-only, ~1 min for this site): `sed "s/        sites.append({'id': p\['id'\]/        if p['id'] != 'rv-appliance-fault-codes': continue\n&/" ~/.local/share/portfolio-indexing-monitor/speed-probe-20261107/index_speed_probe.py > ~/.local/share/rv-appliance-code-atlas/rv-probe.py && /home/sam/miniconda3/bin/python3 ~/.local/share/rv-appliance-code-atlas/rv-probe.py ~/.local/share/rv-appliance-code-atlas/probe-2026-11-21.json 20` (keep the output out of git: traffic data). Done when the newest-batch "URL is unknown to Google" count is <= 2/10. Also run `npm run seo:verify-live`: every homepage/hub/sibling check must pass; its top-date check passes only once < 50% of sitemap URLs share one lastmod (100% on 2026-11-07 is the documented exception), so record the live share instead of treating that line as a regression.
- [ ] Refresh the fallback seed now and then (it is only used when the live fetch fails): `node scripts/seo-template/cli.mjs ledger fetch --origin https://rvappliancefaultcodes.com --out seo/content-dates.seed.json`.


<!-- End of verbatim migrated material. -->
