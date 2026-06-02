# TODO

## Current Batch
- [x] Scaffold free static RV Appliance Code Atlas repo.
- [x] Add first official-source corpus batch for Dometic, Norcold, Suburban/Atwood, Coleman-Mach, Furrion, Lippert, and Onan.
- [x] Add no-hallucination corpus validation gate.
- [x] Add mobile lookup UI, symptom guides, checklist, model finder, part capture, and monetization-readiness placeholders.
- [x] Generate local SDXL/Juggernaut hero image on RTX 4090: 1344x768, 30 steps, JPEG quality 90.
- [x] Deploy to Fly and verify live URL: `https://rv-appliance-code-atlas.fly.dev/`.
- [x] Add full Dometic RUC/RUA and Norcold Polar N7/N8 owner-manual tables from official sources.
- [x] Add Dometic RM1350/CCC2 and Norcold 1200/N15/N20 official-source tables.
- [x] Add Cummins Onan QG A031/A035, Lippert Ground Control LCD/OneControl/In-Wall, Furrion thermostat/rooftop AC/water heater/Arctic refrigerator, and Coleman-Mach display-condition official tables.
- [x] Add Cummins Onan Quiet Diesel 3200/5000/6000/7500/8000/10000/12500 official display-message and fault-code tables.
- [x] Add Furrion Chill Cube thermostat, 10.7 cu ft French Door, 10.6 cu ft 12V, and 15 cu ft refrigerator official display-code tables.
- [x] Add Cummins Onan QG 4000/QG inverter/QG 7000i DF official fault-code tables.
- [x] Add Furrion furnace and rooftop HVAC symptom pages from official manuals.
- [x] Add Coleman-Mach/Airxcel thermostat/AC symptom pages from official manuals.
- [x] Add Cummins Onan legacy QG/KYD/KV/HGJAA fault-code and blink-code tables where official Cummins manuals expose tables.
- [x] Add Dometic DF and Hydro Flame AFM furnace LED diagnostic tables from official Dometic manuals.
- [x] Add official Dometic/Atwood water-heater and OD-5001 symptom pages from verified Dometic support pages without adding water-heater code entries.
- [x] Add official Dometic XT, Suburban tankless/ST42-ST60, Furrion user manual/freezing, and Furrion F2GWH water-heater batch; split corpus into an async JSON asset.
- [x] Add official OD-5001 low-flow/temperature-control/gas/winterizing pages plus Furrion/Lippert tankless support-video source links without adding new code entries.
- [x] Add official Lippert/Girard GSWH-2 owner-manual display codes and Girard-specific tankless symptom guides.
- [x] Add official legacy Lippert/Girard GSWH-1 and GSWH-1M owner-manual LED diagnostics plus WUD/gas/winterization symptom guides.
- [x] Triage official symptom-only Dometic WH/OD-5001 and Furrion tankless support candidates; add owner-safe Dometic tank/OD-5001 symptom guidance plus Furrion E5/model-disambiguation sources without new code entries.
- [x] Add official Suburban induction cooktop E0-E7 display codes plus Coleman-Mach 9630/6535/6536 heat-pump lockout displays and 9420-330 status LED diagnostics from manufacturer-hosted sources.
- [x] Add official Norcold N3000/N2000/N8DCX-N10DCX/N10LX/2118 refrigerator display/LED diagnostics from manufacturer-hosted Thetford/Norcold sources.
- [x] Add official legacy Norcold N41/N51, N510, N61/N81, N62/N64/N82/N84, and N1095 refrigerator owner-manual fault/display tables from manufacturer-hosted Thetford/Norcold sources.
- [x] Add official legacy Dometic RM3762/RM3962, RMD10T/RMD10XT, RM10/RMS10, RMD10.5, RML10.4, RM8/RMD8, and Americana refrigerator display/status diagnostics from manufacturer-hosted Dometic manuals.
- [x] Add official Dometic Americana II DM/DMA, RMD8 numbered-button, RM8 ground-contact/tank-stop, and RM10 petrol-pump support diagnostics; narrow RMD8 internal-battery entries to RMD8xx1 variants.
- [x] Add official Dometic RM10 display-fault support aliases for faults 01/02/03/05/06/07/08/09/10/11/12/13/14/50/51/52/53 with owner-safe boundaries.
- [x] Add official Dometic RM8 support aliases for recurring beep, internal-battery undervoltage, gas-operation power switching, flame-not-ignited, AC/DC supply, heating-element, and acoustic-signal conditions with owner-safe boundaries.
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: GitHub Actions run `26823000160` succeeded at `2026-06-02T13:30:55Z`; Fly release v21, image `deployment-01KT48E1XFBBD550R75D6G7NQK`, code commit `6298ba9`.
- Corpus: `765` verified entries, `62` symptom guides, `172` official sources, `828` generated indexable pages.
- Local verification passed for the Dometic RM8 support-alias batch: RED/GREEN focused corpus regressions for RM8 exact owner-search wording, 14 official support URLs, fuse/mode-switch safety boundaries, and support-only source mapping; `npm run validate:corpus`, focused `npm run test:unit -- src/lib/corpus.test.ts`, full `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, `npm run verify:runtime`, `git diff --check`, bounded JSON diff-shape audit, and built-app desktop/mobile route/search smoke for 8 RM8 routes plus 5 searches. Build splits corpus to `dist/assets/corpus-DcSCUz3r.json` at `1238.45 kB` / `85.02 kB` gzip and main JS to `210.16 kB` / `65.83 kB` gzip with no Vite chunk warning.
- Reviews passed after fixes: source/safety review found and fixed fuse checks in owner actions plus unsupported heating-element mode-switch wording; all 14 new RM8 sources remain official `support.dometic.com` pages only. Data-quality review approved IDs/slugs/refs/counts/routes/searches and confirmed no existing entries or sources changed.
- Live verification passed: `/corpus-stats.json` reports `765`/`62`/`172`/`828`; `/sitemap.xml` and 8 representative new Dometic RM8 code/symptom routes returned HTTP `200`; production desktop/mobile Playwright smoke checked 11 RM8 routes plus 5 searches with `0` console/page/request failures and confirmed the safety-review fuse/mode-switch wording is absent.
- Source triage note: accepted official Thetford/Norcold N3000 troubleshooting PDF, N3000 North America owner/install manual, N2000 owner manual, N8DCX/N10DCX service manual, N10LX/NA10LX owner manual, and 2118 owner manual. Rejected/deferred forums/mirrors, N2000 service-manual board-level procedures for owner guidance, and N3000/N2000 flowchart repair steps beyond service-only boundaries.
- Source triage note: accepted official Thetford/Norcold owner manuals for N41/N51, N400/N510, N61/N81, N62/N64/N82/N84, and N1095; the N400/N510 manual fault table is scoped to N510 models only. Rejected/deferred forums/mirrors, recall/HTS pages as code-table sources, and any invented `no co`/`n` entries for families whose owner manuals do not list them.
- Source triage note: accepted official Dometic RM3762/RM3962, RM8/RMS8/RML8/RMSL8, RMD8xx1/RMD8xx5, RM10/RMS10, RMD10.5, RML10.4, RMD10T/RMD10XT, Americana RM/DM/NDM, Americana II DM/DMA, RMD8 numbered-button, RM8 ground-contact/tank-stop, RM8 recurring-beep/internal-battery/gas-operation/flame-not-ignited/AC-230V-12V-DC supply/heating-element/flashing-acoustic/interior-lighting support pages, RM10 petrol-pump, and RM10 display fault 01/02/03/05/06/07/08/09/10/11/12/13/14/50/51/52/53 sources. Rejected/deferred forums/mirrors, guessed/stale Dometic support URL suffixes returning `404`, generic symptom-only Americana/classic RM manuals without display-code tables, duplicate Americana DM2652/DM2852/RUC/RUA/RM10 manual rows without support-search value, Dometic recall pages without fault tables, and any board-level, fuse, heating-element, LP, electrical, or control repair steps for owner guidance.
- Next automated batch goal: Continue official Dometic refrigerator support-page gap research for remaining RM8/RM10/RUA/RUC/RMD support aliases not already covered by manuals, with duplicate filtering and owner-safe boundaries.

## Corpus Expansion Backlog
- [x] Add full Dometic RUC/RUA tables.
- [x] Add full Norcold Polar N7/N8 owner-manual tables.
- [x] Add full Dometic RM1350/CCC2 tables.
- [x] Add full Norcold 1200 and N15DCX/N20DCX tables.
- [x] Add full Cummins Onan QG A031/A035 fault-code tables by model family.
- [x] Add Cummins Onan QD diesel generator display-message and fault-code tables by model family.
- [x] Add Cummins Onan QG 4000/QG inverter/QG 7000i DF fault-code tables by model family.
- [x] Add remaining Cummins Onan QG 2500/2800/KY/KYD legacy manuals if official current manuals can be verified.
- [x] Add full Lippert Ground Control LCD, Ground Control OneControl 5th-wheel/TT, and In-Wall Slide-out controller tables.
- [x] Add full Furrion water heater, thermostat, rooftop AC, and Arctic refrigerator official diagnostic tables.
- [x] Add Furrion Chill Cube thermostat and additional Furrion 10.7/10.6/15 cu ft refrigerator official display-code tables.
- [x] Add Furrion furnace and rooftop HVAC symptom pages from official manuals.
- [x] Add additional official Coleman-Mach/Airxcel thermostat/AC service terms and symptom pages.
- [x] Add official Atwood/Dometic legacy furnace fault tables only if manufacturer-hosted manuals are found.
- [x] Add official Dometic/Atwood water-heater and OD-5001 symptom pages; do not add water-heater code entries unless a manufacturer-hosted fault/display table is found.
- [x] Add official water-heater symptom guides from Dometic XT, Suburban, and Furrion sources; split the corpus asset so the main bundle stays below the Vite warning threshold.
- [x] Add remaining official OD-5001 low-flow and temperature-control symptom pages plus Furrion/Lippert tankless support-video source links; continue manufacturer-hosted table discovery without adding code entries unless an official fault/display table is verified.
- [x] Research official owner-safe Girard/Lippert tankless and remaining manufacturer-hosted water-heater maintenance or winterization sources, keep model families separate, and add no code entries unless an official fault/display table is verified.
- [x] Research official legacy Girard GSWH-1/GSWH-1M owner manuals and remaining manufacturer-hosted water-heater support sources; keep GSWH-1, GSWH-2, Furrion, Suburban, and Dometic model families separate and add code entries only from official fault/display tables.
- [x] Triage official symptom-only Dometic WH/OD-5001 and Furrion tankless support candidates from the latest source pass; add only owner-safe symptom guidance and model-disambiguation sources unless a new official fault/display table is verified.
- [x] Research and add official Suburban induction cooktop plus Coleman-Mach heat-pump thermostat/status LED tables with owner-safe boundaries.
- [x] Research and add official Norcold N3000/N2000/N8DCX-N10DCX/N10LX/2118 refrigerator display/LED diagnostics with owner-safe boundaries.
- [x] Research and add official legacy Norcold N-series refrigerator owner-manual fault/display tables for N41/N51, N510, N61/N81, N62/N64/N82/N84, N1095, and older `n` stopped-cooling lockout families.
- [x] Research and add official legacy Dometic refrigerator display/status tables for RM3762/RM3962, RMD10T/RMD10XT, RM10/RMS10, RMD10.5, RML10.4, RM8/RMD8, and Americana limited display states with owner-safe boundaries.
- [x] Research and add official Dometic Americana II DM/DMA, RMD8 numbered-button, RM8 ground-contact/tank-stop, and RM10 petrol-pump support diagnostics with owner-safe boundaries.
- [x] Research and add official Dometic RM10 display-fault support aliases for exact owner searches while preserving manual-backed W/E table rows.
- [x] Research and add official Dometic RM8 support aliases for recurring beep, internal-battery undervoltage, gas-operation power switching, flame-not-ignited, AC/DC supply, heating-element, and acoustic-signal conditions while preserving manual-backed RM8/RMD8 table rows.
- [ ] Continue official Dometic refrigerator support-page gap research for remaining RM8/RM10/RUA/RUC/RMD support aliases not already covered by manuals, with duplicate filtering and owner-safe boundaries.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
