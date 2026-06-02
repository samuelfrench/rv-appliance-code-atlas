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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v9, image `deployment-01KT3HXEZ2X8KG3W7AA8FDXG65`, code commit `f62cc4d`; Deploy run `26803767342` succeeded.
- Corpus: `451` verified entries, `23` symptom guides, `57` official sources, `475` generated indexable pages.
- Local verification passed: `npm run validate:corpus`, `npm run test:unit`, `npm run source:audit`, `npm run traffic:report`, and `npm run verify:runtime`. Build passes with a visible Vite warning because the main corpus bundle is `734.90 kB` minified / `104.00 kB` gzip.
- Live verification passed: `/`, `/sitemap.xml`, `/corpus-stats.json`, `/symptoms/dometic-atwood-water-heater-lockout-light/`, `/symptoms/dometic-water-heater-overheat-lockout-reset/`, `/symptoms/dometic-od5001-startup-lockout/`, `/symptoms/dometic-od5001-power-vent-not-running/`, `/symptoms/dometic-od5001-rapid-cycling/`, and `/symptoms/dometic-od5001-temperature-fluctuation/`; Playwright live smoke at mobile and desktop sizes found expected H1/source/safety content and `0` console/page errors.
- Source triage note: official Dometic water-heater/OD-5001 support pages checked so far support operation, lockout, overheat reset, ignition, rapid-cycle, fan, and temperature-fluctuation symptom guidance only, not code entries. Correct verified support slugs include `GasElectric-combination-function-information-eaf5`, `Gas-Function-8df9`, `How-to-clear-a-water-heater-over-heating-failure-2deb`, `How-to-operate-your-water-heater-679c`, `Heater-Does-Not-Come-On-When-The-Water-is-turned-on-Power-vent-fan-not-running-e6d3`, `There-Is-No-Ignition-When-Water-Is-On-Power-vent-fan-is-running-b63e`, `Heater-Comes-On-But-Rapidly-Cycles-On-And-Off-6d10`, and `Burner-Turns-On-But-Temperature-Fluctuates-Erratically-19c8`; rejected 404 slugs include `Gas-Only-Operation-Information-c383` and `How-to-clear-the-overheating-failure-4f2e`.
- Next automated batch goal: add remaining official water-heater symptom guides from Dometic XT, Suburban, and Furrion sources, continue manufacturer-hosted table discovery without adding code entries unless an official fault/display table is verified, and start corpus code-splitting if the main bundle stays above 700 kB.

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
- [ ] Add remaining official water-heater symptom guides from Dometic XT, Suburban, and Furrion sources; investigate code-splitting if the main corpus bundle remains above 700 kB.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
