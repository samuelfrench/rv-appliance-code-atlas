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
- `715` verified entries
- `62` symptom guides
- `136` official sources
- `778` generated indexable pages

Next automated batch goal:
- Continue official legacy Dometic refrigerator display-table research, prioritizing RM8/RMS8/RML8/RMSL8 and RMD8 icon/LED status tables plus remaining Americana/RM owner display conditions with explicit owner-safe boundaries.
