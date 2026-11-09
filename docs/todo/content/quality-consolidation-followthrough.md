---
title: "Follow through on the November 7 quality consolidation"
status: next
area: content
due: null
updated: 2026-11-08
owner: agent
brief: "Manual contradictions, the remaining near-duplicate pair and sourced-depth gaps remain; no breadth or indexing resubmissions"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-quality-consolidation-followthrough"
test: null
---

- **What:** Retain the unfinished source-quality and model-page follow-ups, plus the recorded observation procedure, from the November 7 consolidation.
- **Why:** The release reduced 683 indexable URLs to 74; the pre-release 75-URL sample had one indexed URL, and the August 8–November 5 window had two clicks / 651 impressions. Those historical measurements do not prove post-release traffic or indexing gains.
- **Next:** Prioritize manufacturer-source contradictions when this lane resumes. Preserve the no-new-code-pages, no-sitemap-resubmission and no-index-request instructions. The dated observation is not a waiting gate for factual fixes. Rejected ideas and the complete release evidence remain in the linked archive.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 24-54, on 2026-11-08. -->
> Older history (TODO.md lines 24-44) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-quality-consolidation-followthrough) on 2026-11-08.

**D+21 re-read (on or after 2026-11-28; read-only, ~30 min for 75 URLs):**
`cd /home/sam/claude-workspace/rv-appliance-code-atlas && git pull --ff-only && /home/sam/miniconda3/bin/python3 scripts/seo/gsc-quality-sample.py inspect docs/seo/inspection-sample-manifest-2026-11-07.json ~/.local/share/rv-appliance-code-atlas/seo-2026-11-07/inspection-after-2026-11-28.json`
Then compare with `jq '.results | group_by(.coverage) | map({state:.[0].coverage,n:length})'` on both files, and pull `scripts/seo/gsc-quality-sample.py pages ~/.local/share/rv-appliance-code-atlas/seo-2026-11-07/gsc-pages-90d-<date>.json 90`. Keep GSC outputs out of git (public repo). Sampled `/codes/` and folded `/symptoms/` URLs should read as redirects/"Page with redirect"; judge success on the 40 model pages + 13 hubs (sample 10 model, 3 brand, home, `/guides/`). Before: 1/75 indexed.

**Open items from this lane (prioritized):**
- [ ] Manual contradictions found by the research pass (corpus text cites support pages; the manuals say otherwise). Review each against the cited page and correct `src/data/corpus.json` with the source: RM10 W11/11 (support page "reduce DC voltage" vs manual p. 26 "contact authorized service"); RM10 "Beep" meaning (manual p. 26: tank stop is the petrol-pump symbol/gas LED; lone beep = door-open alarm); RM10 code 50 altitude "above 1800" vs manual p. 14 "above 1000 m"; RM10 "<190 V"/">16 V" vs manual "<=190 V"/">=16 V"; RM8 "Flashing + 20 s signal" also covers owner-checkable supply faults (manual p. 26); RUA/RUC user-modes guide lists Eco/Performance/Turbo/Quiet but the RUA manual p. 13 lists Performance/Battery save/Silent; RUC E35 = thermal cut-out of the controller unit (manual p. 54); Coleman 9420-381/382 flashing "Elec" = gas heat assisting, lockout is 1 h 45 min not 2 h (1980R189 p. 7); Furrion FACW12PA-BL thermostat missing from the models list (ccd-0005592 p. 34); Furrion FCR10DCGFA E2-E5 differ from FCR11DCGTA (CCD-0007852 p. 8); Furrion F2GWH tankless code list differs (CCD-0005833 pp. 9-10; E8/E9/En/Fd only there); Furrion furnace reset is off 60 s then on/off/on within 10 s (QR-224; CCD-0007984 p. 7); Ground Control "Slowly Blinking Faded Red" text truncated ("A Rev") — Rev. B special jack error (CCD-0001519 p. 18); BAD CALIBRATION differs LCD (CCD-0001745 p. 12) vs OneControl (CCD-0001519 p. 19); Onan HGJ codes 19/22/51-58/81/82 only in HGJAA/HGJAB manuals (HGJBB pp. 49-54), unassigned 33/44 vs 33/34; QD3200 overload 32 A (Spec A-E) vs 26.7 A (Spec F); N3000 code 6 voltage 10-15 V (troubleshooting PDF p. 10) vs 11.4-15.5 V (support page); Polar N7/N8 amber and green "flashes off" share one meaning in the manual itself (p. 22; p. 7 says solid amber = propane), so the old TODO question is answered: the corpus matches the manual.
- [ ] Merge `/models/norcold-n109x-refrigerators/` into `/models/norcold-n62-n64-n82-n84-refrigerators/` (J=0.563, the last near-duplicate pair): needs a family-merge + model-page 301 mechanism in `site-model.mjs`; both pages had 0 GSC rows in 16 months.
- [ ] Sourced notes for the next 15 model pages (no notes yet): norcold-n15-n20, norcold-n8dcx-n10dcx, norcold-1200, norcold-2118, norcold-n10lx, norcold-n109x, norcold-n62-n84, norcold-n41-n51-n510, norcold-n61-n81, norcold-n2000, dometic-rmd10-rml10, dometic-rmd8, onan-qg-2800i, onan-qg-4000, onan-qg-7000i (then the rest). Brief (local only): `~/.local/share/rv-appliance-code-atlas/seo-2026-11-07/topic-notes-research-brief.md`, topic packs in `~/.local/share/rv-appliance-code-atlas/seo-2026-11-07/topic-packs/` (schema check: `npm run validate:notes`), one JSON per topic (sitemap lastmod updates itself at the next build).
- [ ] Brand hubs are the thinnest pages (124-207 words before the topic summaries were added); consider a sourced "which model do I have" section per brand.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 57-62, on 2026-11-08. -->
> Older history (TODO.md lines 57-62) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-quality-consolidation-followthrough) on 2026-11-08.


<!-- End of verbatim migrated material. -->
