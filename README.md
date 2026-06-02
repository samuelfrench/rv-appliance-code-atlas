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
- `125` symptom guides
- `313` official sources
- `945` generated indexable pages

Next automated batch goal:
- Triage official Cummins Onan generator symptom-only support pages for no-start, cranks/no output, breaker or load shedding, fuel/oil/maintenance, altitude, and service-only generator/electrical/exhaust boundaries; add only non-duplicate owner-safe guides.
