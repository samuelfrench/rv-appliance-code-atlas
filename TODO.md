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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v8, image `deployment-01KT3GQ35PRB7PT2149VPBWASV`, code commit `d73998f`; Deploy run `26802912017` succeeded.
- Corpus: `451` verified entries, `17` symptom guides, `49` official sources, `469` generated indexable pages.
- Local verification passed: `npm run validate:corpus`, `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, and `npm run verify:runtime`. Build passes with a visible Vite warning because the main corpus bundle is `727.92 kB` minified / `102.44 kB` gzip.
- Live verification passed: `/`, `/sitemap.xml`, `/corpus-stats.json`, `/codes/onan-qg-4000-kyd-code-32-low-cranking-speed/`, `/codes/onan-hgjaa-hgjab-code-23-low-oil-pressure-cutoff-switch/`, `/codes/dometic-df-furnace-5-flashes-low-voltage/`, and `/codes/dometic-hydro-flame-afm-2-flashes-flame-sense-fault/`; Playwright live smoke at mobile and desktop sizes found `0` console/page errors.
- Source triage note: official Cummins `981-0129`, `981-0136`, `981-0158`, `981-0164`, `981-0132`, `981-0139`, and `981-0154` were checked and did not expose publishable fault-code tables; official Dometic water-heater/OD-5001 sources checked so far support symptoms/lockout guidance only, not code entries.
- Next automated batch goal: add official Dometic/Atwood water-heater and OD-5001 symptom pages, and continue manufacturer-hosted table discovery without adding water-heater code entries unless an official fault/display table is verified.

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
- [ ] Add official Dometic/Atwood water-heater and OD-5001 symptom pages; do not add water-heater code entries unless a manufacturer-hosted fault/display table is found.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
