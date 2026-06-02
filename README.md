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

Google Search Console launch:

```bash
npm run traffic:gsc:verify:dry-run
GSC_QUOTA_PROJECT=coffee-explorer-480514 npm run traffic:gsc:verify
npm run traffic:gsc:dry-run
GSC_QUOTA_PROJECT=coffee-explorer-480514 npm run traffic:gsc:submit
```

Traffic monitor:

```bash
npm run traffic:monitor
```

Current corpus:
- `819` verified entries
- `131` symptom guides
- `317` official sources
- `951` generated indexable pages

Next automated batch goal:
- Add GSC property and submit sitemap after live URL is stable.
