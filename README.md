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
- `475` verified entries
- `45` symptom guides
- `94` official sources
- `521` generated indexable pages

Next automated batch goal:
- Research official legacy Girard GSWH-1/GSWH-1M owner manuals and remaining manufacturer-hosted water-heater support sources; keep GSWH-1, GSWH-2, Furrion, Suburban, and Dometic model families separate and add code entries only from official fault/display tables.
