# RV Appliance Code Atlas

Free, source-backed lookup for RV appliance fault codes and symptoms.

Live URL: `https://rvappliancefaultcodes.com/`

Permanent domain:
- Route53 domain: `rvappliancefaultcodes.com`
- Fly certificates: issued for `rvappliancefaultcodes.com` and `www.rvappliancefaultcodes.com`
- Billing: Route53 `.com` registration `$15/year`, auto-renew on at `$15/year`

Google Analytics:
- GA4 property: `properties/540096507`
- Web stream: `properties/540096507/dataStreams/14992447658`
- Measurement ID: `G-9824RBXHHR`
- Default URI: `https://rvappliancefaultcodes.com`
- Local GA4 Data API reporting uses service-account JSON at `~/.config/google/rv-appliance-code-atlas-ga4.json`.

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
- URL-prefix property: `https://rvappliancefaultcodes.com/`
- Sitemap: `https://rvappliancefaultcodes.com/sitemap.xml`
- Verified: `2026-06-02T23:11:41Z`
- Sitemap submitted: `2026-06-02T23:19:52Z`

Weekly Search Console traffic artifact:

```bash
npm run traffic:gsc:weekly:dry-run
GSC_QUOTA_PROJECT=coffee-explorer-480514 npm run traffic:gsc:weekly
npm run traffic:monetization
```

Writes ignored local report artifact: `reports/gsc-weekly-traffic.json`

Monetization readiness writes ignored local report artifact: `reports/monetization-readiness.json`. It reads page impressions from the weekly GSC artifact and keeps checkout, ad slots, affiliate placeholders, repair leads, and sponsor slots disabled until manual review.

Default range: last 7 Pacific-time days ending 3 days ago, to avoid preliminary GSC data. The script tries a readonly Search Console token first and falls back to the locally authorized `webmasters` ADC scope when needed.

Weekly GA4 traffic artifact:

```bash
npm run traffic:ga4:weekly:dry-run
npm run traffic:ga4:weekly
```

Writes ignored local report artifact: `reports/ga4-weekly-traffic.json`

Default range: last 7 Pacific-time days ending yesterday. The script uses a local service-account JSON path instead of browser OAuth or API Explorer clicks.

IndexNow launch:

```bash
npm run traffic:indexnow:dry-run
npm run traffic:indexnow:submit
```

Key location: `https://rvappliancefaultcodes.com/2653afc6f17313e900711f1d3eb1dcabad06e943193bf141716fcd4013f65f18.txt`

Writes ignored local report artifact: `reports/indexnow-submit-report.json`

Submitted: `2026-06-03T03:12:23.761Z` with `1046` URLs and IndexNow HTTP `200`

Traffic monitor:

```bash
npm run traffic:monitor
```

Current corpus:
- `850` verified entries
- `199` symptom guides
- `348` official sources
- `1050` generated indexable pages

Next automated batch goal:
- Triage official Coleman-Mach 48000 Series Air Conditioners-International and remaining model-family manual sources, then add only non-duplicate owner-safe symptom pages or source wiring.
