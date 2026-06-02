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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v16, image `deployment-01KT3YVD0BT2TMKC68EW47VR62`, code commit `e8faa46`; GitHub Actions API was rate-limited during run lookup, but Fly/live endpoints showed the rollout at `2026-06-02T10:42:58Z`.
- Corpus: `562` verified entries, `60` symptom guides, `123` official sources, `623` generated indexable pages.
- Local verification passed for the current Norcold batch: focused RED/GREEN corpus regressions for N3000/N2000/N8DCX-N10DCX/N10LX/2118, N2000 search-ranking regression, traffic-report docs alignment regression, `npm run validate:corpus`, `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, `npm run verify:runtime`, `git diff --check`, built-app route/search smoke, and fresh HTTP `200` checks for all 6 new official Norcold/Thetford source URLs. Build splits corpus to `dist/assets/corpus-4dM9IhsL.json` at `896.59 kB` / `63.58 kB` gzip and main JS to `210.16 kB` / `65.83 kB` gzip with no Vite chunk warning.
- Reviews passed: N3000/N2000 and N8DCX-N10DCX/N10LX/2118 read-only source triage completed; spec/safety review approved after tightening N8DCX/N10DCX model scope, N10LX `oP LI` wording, and N3000 code 6 wording; code-quality review found/fixed N2000 LED search ranking and README/TODO next-goal alignment.
- Live verification passed: `/corpus-stats.json` reports `562`/`60`/`123`/`623`; `/sitemap.xml` and representative Norcold code/symptom routes returned HTTP `200`; production desktop/mobile Playwright smoke checked 8 Norcold routes plus 5 searches including `norcold n2000 red led blinking input voltage` with `0` console/page/request failures.
- Source triage note: accepted official Thetford/Norcold N3000 troubleshooting PDF, N3000 North America owner/install manual, N2000 owner manual, N8DCX/N10DCX service manual, N10LX/NA10LX owner manual, and 2118 owner manual. Rejected/deferred forums/mirrors, N2000 service-manual board-level procedures for owner guidance, and N3000/N2000 flowchart repair steps beyond service-only boundaries.
- Next automated batch goal: Research the next official legacy Norcold N-series refrigerator slice, prioritizing manufacturer-hosted owner-manual fault tables for N41/N51, N61/N81, N62/N64/N82/N84, N1095, and older no-co/n lockout families.

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
- [ ] Research the next official legacy Norcold N-series refrigerator slice, prioritizing manufacturer-hosted owner-manual fault tables for N41/N51, N61/N81, N62/N64/N82/N84, N1095, and older no-co/n lockout families.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
