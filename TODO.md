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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy before current batch: Fly release v4, image `deployment-01KT3CX5WH3TGRK6DKPWWANA72`, code commit `2937076`; GitHub run ID unavailable locally because `gh` API was rate-limited.
- Corpus after current local batch: `345` verified entries, `12` symptom guides, `34` official sources, `358` generated indexable pages.
- Local verification passed: `npm run validate:corpus`, `npm run test:unit`, `npm run build`, `npm run test:browser`, `npm run traffic:report`, `npm run source:audit`.
- Live verification passed: `/`, `/sitemap.xml`, `/feed.xml`, `/corpus-stats.json`, `/codes/dometic-rm1350-e4/`, `/codes/dometic-ccc2-e7/`, `/codes/norcold-1200-no-fl/`, and `/codes/norcold-n15-n20-e9/` HTTP `200`; Playwright live smoke at `390x844` and `1366x768` found `0` console errors.
- Next automated batch goal: add Cummins Onan QG 4000/QG inverter/7000i DF manuals plus Furrion furnace/rooftop HVAC and Coleman-Mach/Airxcel symptom pages from official manuals; then rerun source audit and static generation.

## Corpus Expansion Backlog
- [x] Add full Dometic RUC/RUA tables.
- [x] Add full Norcold Polar N7/N8 owner-manual tables.
- [x] Add full Dometic RM1350/CCC2 tables.
- [x] Add full Norcold 1200 and N15DCX/N20DCX tables.
- [x] Add full Cummins Onan QG A031/A035 fault-code tables by model family.
- [x] Add Cummins Onan QD diesel generator display-message and fault-code tables by model family.
- [ ] Add Cummins Onan QG 4000/QG inverter/QG 7000i DF fault-code tables by model family.
- [x] Add full Lippert Ground Control LCD, Ground Control OneControl 5th-wheel/TT, and In-Wall Slide-out controller tables.
- [x] Add full Furrion water heater, thermostat, rooftop AC, and Arctic refrigerator official diagnostic tables.
- [x] Add Furrion Chill Cube thermostat and additional Furrion 10.7/10.6/15 cu ft refrigerator official display-code tables.
- [ ] Add Furrion furnace and rooftop HVAC symptom pages from official manuals.
- [ ] Add additional official Coleman-Mach/Airxcel thermostat/AC service terms and symptom pages.
- [ ] Add official Atwood/Dometic legacy furnace fault tables only if manufacturer-hosted manuals are found.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
