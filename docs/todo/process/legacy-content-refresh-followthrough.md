---
title: "Reconcile the remaining October content-refresh checklist"
status: next
area: process
due: null
updated: 2026-11-08
owner: agent
brief: "Historical checks are retained; November 7 evidence supersedes old page counts and indexing instructions"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-legacy-content-refresh-followthrough"
test: null
---

- **What:** Preserve the five original open checklist items without silently claiming that this migration performed them.
- **Why:** The November 7 release records newer live checks and 74 indexable pages, says the controller already resubmitted the sitemap, and answers the Polar amber/green manual question. The old checklist is historical and needs reconciliation, not blind execution.
- **Next:** Compare each item with the November 7 quality-consolidation record. Do not resubmit the sitemap, request indexing, restore breadth batches or impose the old four/eight-week waiting gate. Any remaining source-depth correction still requires an official manufacturer source.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 106-122, on 2026-11-08. -->
> Older history (TODO.md lines 106-116) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-legacy-content-refresh-followthrough) on 2026-11-08.
- [ ] Check live (not done; the cloud session could not reach the domain): `/`, `/models/onan-quiet-diesel-generators/`, `/codes/onan-code-36-engine-stopped/`, redirect `/codes/norcold-polar-no-fl/` → `/codes/norcold-1200-no-fl/#norcold-polar-no-fl`, `/site-index.json`, `/sitemap.xml` (683 URLs), and an unknown `/codes/x/` (should show "Code not verified yet").
- [ ] Resubmit the sitemap in Search Console (GSC still holds the June 985-URL fetch) and run `npm run traffic:indexnow:submit` from a machine with credentials/network.
- [ ] Measure effect without new spend: snapshot `dist/indexnow-report.json` URLs at the deploy SHA, then compare GSC impressions/clicks and a paired URL-inspection sample at ~4 and ~8 weeks. Do not restart breadth batches on a calendar date alone.
- [ ] Source re-check: Norcold Polar `amber flashes off` and `green flashes off` carry identical meanings in the corpus; confirm against the Norcold Polar N7/N8 owner manual.
- [ ] Depth gap: Dometic RUA/RUC support pages only give reset/service steps per fault number, not what each fault means. Add meanings only if Dometic publishes an official table.


<!-- End of verbatim migrated material. -->
