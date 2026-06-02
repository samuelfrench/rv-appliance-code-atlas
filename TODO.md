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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v12, image `deployment-01KT3Q6MZNZCJ6RK7WY1H67J9M`, code commit `944772c`; Deploy run `26807988936` succeeded.
- Corpus: `475` verified entries, `45` symptom guides, `94` official sources, `521` generated indexable pages.
- Local verification passed: RED/GREEN corpus regression for the Girard GSWH-2 owner-manual display-code table and token-aware low-flow search ranking, `npm run validate:corpus`, `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, `npm run verify:runtime`, `git diff --check`, staged `git diff --cached --check`, and fresh HTTP `200` checks for all 13 new official Girard/Lippert source URLs. Build splits corpus to `dist/assets/corpus-BdHKdX2d.json` at `739.37 kB` / `51.19 kB` gzip and main JS to `210.10 kB` / `65.81 kB` gzip with no Vite chunk warning.
- Reviews passed: source/safety/spec and code-quality reviewers approved. The search regression now asserts `girard gswh2 low flow` ranks Girard GSWH-2 E0, E3, E4, and E6 ahead of lockout-only entries.
- Live verification passed: `/`, `/sitemap.xml`, `/corpus-stats.json`, the three new Girard GSWH-2 code routes checked (`E0`, `E8`, `Fd`), and all five new Girard symptom routes. Desktop and mobile Playwright found expected hydrated search order, H1/source/safety content, and `0` console/page errors.
- Source triage note: the Lippert/Girard GSWH-2 owner manual supports code entries `E0-E9`, `En`, and `Fd`. Girard support videos, quick operating tips, and QR-181 freeze-damage guidance support symptom pages only. Rejected or deferred candidates include Girard service-manual diagnostics, gas-pressure/voltage test material, error-code videos without owner-manual table value, mirrors/forums, and Dometic/Suburban symptom candidates outside this GSWH-2 batch.
- Next automated batch goal: research official legacy Girard GSWH-1/GSWH-1M owner manuals and remaining manufacturer-hosted water-heater support sources; keep GSWH-1, GSWH-2, Furrion, Suburban, and Dometic model families separate and add code entries only from official fault/display tables.

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
- [ ] Research official legacy Girard GSWH-1/GSWH-1M owner manuals and remaining manufacturer-hosted water-heater support sources; keep GSWH-1, GSWH-2, Furrion, Suburban, and Dometic model families separate and add code entries only from official fault/display tables.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
