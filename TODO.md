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
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: Fly release v4, image `deployment-01KT3CX5WH3TGRK6DKPWWANA72`, code commit `2937076`; GitHub run ID unavailable locally because `gh` API was rate-limited.
- Corpus: `118` verified entries, `12` symptom guides, `21` official sources, `131` generated indexable pages.
- Local verification passed: `npm run validate:corpus`, `npm run test:unit`, `npm run build`, `npm run test:browser`, `npm run traffic:report`, `npm run source:audit`.
- Live verification passed: `/`, `/sitemap.xml`, `/feed.xml`, `/corpus-stats.json`, `/codes/dometic-rm1350-e4/`, `/codes/dometic-ccc2-e7/`, `/codes/norcold-1200-no-fl/`, and `/codes/norcold-n15-n20-e9/` HTTP `200`; Playwright live smoke at `390x844` and `1366x768` found `0` console errors.
- Next automated batch goal: add full Cummins Onan QG/QD, Lippert controller, Furrion appliance, and Coleman-Mach thermostat/AC tables from official manuals, then rerun source audit and static generation.

## Corpus Expansion Backlog
- [x] Add full Dometic RUC/RUA tables.
- [x] Add full Norcold Polar N7/N8 owner-manual tables.
- [x] Add full Dometic RM1350/CCC2 tables.
- [x] Add full Norcold 1200 and N15DCX/N20DCX tables.
- [ ] Add full Cummins Onan QG/QD fault-code tables by model family.
- [ ] Add full Lippert Ground Control and In-Wall Slide-out controller tables.
- [ ] Add full Furrion water heater, thermostat, rooftop AC, refrigerator, and furnace tables.
- [ ] Add additional official Coleman-Mach thermostat/AC service terms.
- [ ] Add official Atwood/Dometic legacy furnace fault tables only if manufacturer-hosted manuals are found.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
