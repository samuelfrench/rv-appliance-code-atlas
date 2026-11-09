---
title: "Reconcile the historical instruction proposals with current code"
status: next
area: process
due: null
updated: 2026-11-08
owner: agent
brief: "October proposals remain retained; compare against the November 7 architecture before applying any stale rule"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-legacy-instruction-handoff"
test: null
---

- **What:** Retain the three unresolved instruction-proposal checkboxes from the October handoff.
- **Why:** Some proposals describe the old 683-page architecture. The November 7 release now uses 74 indexable pages and 1,057 redirects; current source and current standing instructions take precedence.
- **Next:** Reconcile the historical proposals against current code and AGENTS.md before a scoped documentation update. Routine instructions do not need a new approval round-trip; do not revive old cloud-session commands or obsolete URL rules verbatim.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 84-105, on 2026-11-08. -->
- [ ] Approve or edit the proposed `AGENTS.md` additions below.

> Older history (TODO.md lines 86-93) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-legacy-instruction-handoff) on 2026-11-08.
### Proposed `AGENTS.md` additions (for Sam to approve; not yet applied)

- [ ] Add under "Project rules":
  - Every corpus entry must belong to a model line in `src/data/families.json` (exact `modelFamilies` match); `npm run validate:corpus` fails otherwise. Add a line (and a family if needed) when adding codes for a new model.
  - Detail pages are static HTML rendered by `scripts/lib/render.mjs`. Do not mount React or load `corpus.json` on code/model/brand/guide pages; the app is only for homepage search, part capture, and the not-found page.
  - Never delete or rename a `/codes/<slug>/` URL. Merged duplicates stay as noindex redirects to `canonical#entry-id`; the canonical is the shortest existing slug in the brand + appliance type + code group, so avoid slug edits that change it.
  - Display helpers (`shortMeaning`, `compactMeaning`, near-duplicate merging) only reformat sourced text. Never write new meanings, causes, or actions into templates; new facts go into `corpus.json` with an official source.
  - Record-and-call "prep" guides are noindex by rule (`isThinSymptom`) and are not a growth lever. Breadth batches stay on hold; improve depth only when a manufacturer source adds real meaning.
  - Bump `CONTENT_UPDATED` in `scripts/generate-static.mjs` when page content or structure changes (sitemap `lastmod`).
  - Keep internal business status (monetization readiness, traffic thresholds, source counts) out of public pages.
- [ ] Add a "Cloud sessions" note: manufacturer sites, the live domain, and googletagmanager are blocked by the egress proxy, so new entries cannot be source-verified and live checks must happen elsewhere; use the local browser-verification recipe in this handoff; the `/home/sam/...` memory files are absent, so `TODO.md` is the handoff record.


<!-- End of verbatim migrated material. -->
