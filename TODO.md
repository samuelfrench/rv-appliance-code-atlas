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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v14, image `deployment-01KT3TA9QCK8WRCSDASK482C4S`, code commit `66763b7`; Deploy run `26810708905` succeeded.
- Corpus: `487` verified entries, `52` symptom guides, `110` official sources, `540` generated indexable pages.
- Local verification passed: focused RED/GREEN corpus regression for Dometic WH/OD-5001 symptom-only sources plus Furrion E5/FWH09A separation, `npm run validate:corpus`, `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, `npm run verify:runtime`, `git diff --check`, staged `git diff --cached --check`, and fresh HTTP `200` checks for all 13 new official Dometic/Lippert/Furrion source URLs. Build splits corpus to `dist/assets/corpus-YTv0jI8J.json` at `772.05 kB` / `54.30 kB` gzip and main JS to `210.10 kB` / `65.81 kB` gzip with no Vite chunk warning.
- Reviews passed: read-only source triage accepted the official Dometic WH/support and Lippert/Furrion sources, rejected duplicates/internal-service/old-spec candidates, spec/safety review passed with no findings, and code-quality review approved with no findings.
- Live verification passed: `/`, `/sitemap.xml`, `/corpus-stats.json`, new Dometic winterizing, P/T air-gap, and OD-5001 no-flow symptom routes, plus enriched Furrion E5 and Dometic lockout code routes. Desktop and mobile Playwright verified H1/source/safety content, homepage search for `furrion tankless e5 blower`, and `0` console/page errors.
- Source triage note: accepted official Dometic WH 2022 manual and Dometic support pages for winterize/flush, air gap, anode warning, odor, gas smell, and OD-5001 no-flow; accepted Lippert TI-514 only for current FWH09A-series E5 clarification and Furrion FWH09A/FWH09AFA-AB spec sheets only for model-disambiguation/low-flow/freeze symptoms. Rejected or deferred duplicate Dometic `Gas-smell-8c9`, OD-5001 Component Locations, Furrion `ccd-0006132`, Furrion `ccd-0005723`, and any internal repair guidance beyond owner-safe shutoff/record/call-service boundaries.
- Next automated batch goal: research the next official manufacturer-hosted appliance support slice beyond the current water-heater batches, prioritizing verified fault/display tables or owner-safe symptom gaps from official sources.

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
- [ ] Research the next official manufacturer-hosted appliance support slice beyond the current water-heater batches, prioritizing verified fault/display tables or owner-safe symptom gaps from official sources.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
