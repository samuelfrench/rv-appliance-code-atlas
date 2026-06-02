# TODO

## Current Batch
- [x] Scaffold free static RV Appliance Code Atlas repo.
- [x] Add first official-source corpus batch for Dometic, Norcold, Suburban/Atwood, Coleman-Mach, Furrion, Lippert, and Onan.
- [x] Add no-hallucination corpus validation gate.
- [x] Add mobile lookup UI, symptom guides, checklist, model finder, part capture, and monetization-readiness placeholders.
- [x] Generate local SDXL/Juggernaut hero image on RTX 4090: 1344x768, 30 steps, JPEG quality 90.
- [x] Deploy to Fly and verify live URL: `https://rv-appliance-code-atlas.fly.dev/`.
- [ ] Add GSC property and submit sitemap after live URL is stable.

## Current State — 2026-06-02
- Live URL: `https://rv-appliance-code-atlas.fly.dev/`
- GitHub repo: `https://github.com/samuelfrench/rv-appliance-code-atlas`
- Fly app: `rv-appliance-code-atlas`, one `shared-cpu-1x` 256 MB machine in `dfw`, auto-stop enabled.
- Latest deploy: GitHub Actions run `26799471622`, Fly image `deployment-01KT3B9NY0YP49NV4E8TB9SRKC`.
- Corpus: `19` verified entries, `12` symptom guides, `16` official sources, `32` generated indexable pages.
- Local verification passed: `npm run validate:corpus`, `npm run test:unit`, `npm run build`, `npm run test:browser`, `npm run traffic:report`, `npm run source:audit`.
- Live verification passed: `/`, `/sitemap.xml`, `/feed.xml`, `/corpus-stats.json`, and `/codes/norcold-polar-no-fl/` HTTP `200`; Playwright live smoke at `390x844` and `1366x768` found `0` console errors.
- Next automated batch goal: add full Dometic RUC/RUA and Norcold Polar tables from official manuals, then rerun source audit and static generation.

## Corpus Expansion Backlog
- [ ] Add full Dometic RUC/RUA/RM1350/CCC2 tables.
- [ ] Add full Norcold 1200, Polar N7/N8, and N15DCX/N20DCX tables.
- [ ] Add full Cummins Onan QG/QD fault-code tables by model family.
- [ ] Add full Lippert Ground Control and In-Wall Slide-out controller tables.
- [ ] Add full Furrion water heater, thermostat, rooftop AC, refrigerator, and furnace tables.
- [ ] Add additional official Coleman-Mach thermostat/AC service terms.
- [ ] Add official Atwood/Dometic legacy furnace fault tables only if manufacturer-hosted manuals are found.

## Launch Automation
- [ ] Add weekly traffic report artifact once GSC is configured.
- [ ] Add IndexNow key after domain/live URL is chosen.
- [ ] Add impression-based monetization readiness report after GSC data exists.
