---
title: "Follow through on the existing SEO template release"
status: next
area: seo
due: null
updated: 2026-11-08
owner: agent
brief: "Retain the one content guard violation, optional dated read and fallback-seed upkeep; no new launch or waiting gate"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-seo-template-followthrough"
test: null
---

- **What:** Preserve the three unfinished follow-ups from the November 7 SEO-template release.
- **Why:** The retained release reports 74 indexable URLs and one 137-word guard violation. These are dated source receipts, not fresh production verification.
- **Next:** Follow the individual items below within existing authority. Keep the recorded November 21 observation as a historical follow-up, not a freeze or prerequisite for useful corrections. Never edit the vendored SEO engine; change the owning template and re-vendor.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 3-23, on 2026-11-08. -->
> Older history (TODO.md lines 3-18) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-seo-template-followthrough) on 2026-11-08.
**Open items (rv-seo):**
- [ ] Guard ratchet: add sourced content to `/symptoms/rv-thermostat-display-lo-hi/` (>= 150 primary words, every claim from a manufacturer source) or fold it into its model pages under the URL-change rule; then change `seo:finalize` in `package.json` to `--guard fail --max-violations 0`. Until then the next step is `--guard fail --max-violations 1`.
- [ ] D+14 check on or after **2026-11-21** (read-only, ~1 min for this site): `sed "s/        sites.append({'id': p\['id'\]/        if p['id'] != 'rv-appliance-fault-codes': continue\n&/" ~/.local/share/portfolio-indexing-monitor/speed-probe-20261107/index_speed_probe.py > ~/.local/share/rv-appliance-code-atlas/rv-probe.py && /home/sam/miniconda3/bin/python3 ~/.local/share/rv-appliance-code-atlas/rv-probe.py ~/.local/share/rv-appliance-code-atlas/probe-2026-11-21.json 20` (keep the output out of git: traffic data). Done when the newest-batch "URL is unknown to Google" count is <= 2/10. Also run `npm run seo:verify-live`: every homepage/hub/sibling check must pass; its top-date check passes only once < 50% of sitemap URLs share one lastmod (100% on 2026-11-07 is the documented exception), so record the live share instead of treating that line as a regression.
- [ ] Refresh the fallback seed now and then (it is only used when the live fetch fails): `node scripts/seo-template/cli.mjs ledger fetch --origin https://rvappliancefaultcodes.com --out seo/content-dates.seed.json`.


<!-- End of verbatim migrated material. -->
