# RV Appliance Code Atlas Instructions

Load before work:
- `/home/sam/.codex/memories/MEMORY.md`
- `/home/sam/.codex/memories/global-preferences.md`
- `/home/sam/TODO.md`
- `TODO.md`

Project rules:
- Free traffic-first site only. No checkout, payment provider, or approval-gated monetization.
- Cite every appliance code/action with official manufacturer support pages or manuals first.
- Reject unsourced codes. Do not publish forum-sourced fault-code entries as authoritative.
- Keep dangerous gas, electrical, generator, refrigerant, slide/jack, and control-board work at shut off power/LP/fuel and call a qualified technician boundaries.
- Commit and push every code/TODO/memory update.
- Application changes deploy through GitHub Actions to Fly. TODO/docs/tooling-only changes must not deploy; keep their paths in the deploy workflow’s paths-ignore list.
- Always run corpus validation and runtime verification before claiming web work is complete.
- Sitemap `lastmod`, `/seo/content-dates.json` and the "Latest" blocks come from the shared SEO template vendored in `scripts/seo-template/` (never edit it; site rules live in `scripts/seo-adapter.mjs`). Never hand-maintain dates. Lists computed from other pages carry `data-seo-ignore`.

Generated task contract:
- `TODO.md` and `docs/todo/index.json` are generated. Edit task sources under `docs/todo/`, run `node scripts/todo/build.mjs`, and commit source plus both outputs together. Read `docs/todo/README.md` for fields and query commands.
- For TODO tooling changes, run `node --test scripts/todo/__tests__/*.test.mjs` and `node scripts/todo/build.mjs --check`. The dedicated TODO workflow performs these checks without app build/deployment; website validation rules above remain applicable to actual web changes.
- Historical source, traffic, release and rejected-idea evidence remains verbatim in `TODO-archive.md`. Old page counts, waiting dates and handoffs do not supersede current source or establish fresh live/provider proof.
- Preserve existing holds: no breadth batches, no new code pages, no sitemap resubmission/indexing request from the November 7 follow-up, and no removal of disabled monetization scaffolding without the explicit owner decision recorded in its task. No job or schedule is installed by the task-file migration.
