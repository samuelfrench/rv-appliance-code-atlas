# RV Appliance Code Atlas

Free, source-backed lookup for RV appliance fault codes and symptoms.

Live URL: `https://rv-appliance-code-atlas.fly.dev/`

Scope:
- Dometic
- Norcold
- Suburban/Atwood
- Coleman-Mach
- Furrion
- Lippert
- Onan/Cummins

Rules:
- Official manufacturer support pages/manuals first.
- No unsourced fault-code entries.
- No DIY gas, electrical, generator, refrigerant, control-board, or safety-device repair instructions.
- Monetization placeholders are disabled until traffic data supports them.

Commands:

```bash
npm run validate:corpus
npm run test
npm run build
npm run traffic:report
npm run verify:runtime
```

Traffic monitor:

```bash
npm run traffic:monitor
```

Current corpus:
- `819` verified entries
- `72` symptom guides
- `242` official sources
- `892` generated indexable pages

Next automated batch goal:
- Triage official Dometic RUA/RUC refrigerator symptom-only support pages from sitemap-verified pages, starting with door, cooling, power, smell, cleaning, low-temperature, and battery/ventilation overlap; add only non-duplicate owner-safe symptom aliases.
