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
- `562` verified entries
- `60` symptom guides
- `123` official sources
- `623` generated indexable pages

Next automated batch goal:
- Research the next official legacy Norcold N-series refrigerator slice, prioritizing manufacturer-hosted owner-manual fault tables for N41/N51, N61/N81, N62/N64/N82/N84, N1095, and older no-co/n lockout families.
