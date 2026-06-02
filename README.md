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

Search Console status:
- URL-prefix property: `https://rv-appliance-code-atlas.fly.dev/`
- Sitemap: `https://rv-appliance-code-atlas.fly.dev/sitemap.xml`
- Verified and submitted: `2026-06-02T19:38:59Z`

Weekly Search Console traffic artifact:

```bash
npm run traffic:gsc:weekly:dry-run
GSC_QUOTA_PROJECT=coffee-explorer-480514 npm run traffic:gsc:weekly
npm run traffic:monetization
```

Writes ignored local report artifact: `reports/gsc-weekly-traffic.json`

Monetization readiness writes ignored local report artifact: `reports/monetization-readiness.json`. It reads page impressions from the weekly GSC artifact and keeps checkout, ad slots, affiliate placeholders, repair leads, and sponsor slots disabled until manual review.

Default range: last 7 Pacific-time days ending 3 days ago, to avoid preliminary GSC data. The script tries a readonly Search Console token first and falls back to the locally authorized `webmasters` ADC scope when needed.

IndexNow launch:

```bash
npm run traffic:indexnow:dry-run
npm run traffic:indexnow:submit
```

Key location: `https://rv-appliance-code-atlas.fly.dev/2653afc6f17313e900711f1d3eb1dcabad06e943193bf141716fcd4013f65f18.txt`

Writes ignored local report artifact: `reports/indexnow-submit-report.json`

Submitted: `2026-06-02T20:30:12.144Z` with IndexNow HTTP `200`

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
- Run weekly GSC report and review monetization readiness after page impressions appear.
