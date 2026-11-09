# Task sources

`TODO.md` and `docs/todo/index.json` are generated from these task files using the Coffee Explorer TODO engine. Edit sources under `docs/todo/<area>/<slug>.md`, run `node scripts/todo/build.mjs`, and commit the source plus both outputs together. The builder moves finished tasks to `docs/todo/done/<area>/` and restores reopened tasks to their area.

Each task starts with this frontmatter:

```yaml
---
title: "Describe the result needed"
status: next
area: product
due: null
updated: 2026-11-08
owner: agent
brief: "Current state or the concrete next step"
refs: []
test: null
---
```

Follow it with **What**, **Why**, and **Next** paragraphs that retain exact file references, measurements, reproduction commands and the completion condition. All displayed fields are required; `test` must identify a failing command for `known-failure`. Valid statuses are `now`, `waiting-sam`, `scheduled`, `next`, `idea`, `known-failure`, and `done`. A `scheduled` task needs a real `due` date; otherwise use a date or `null`. `owner` is `agent` or `sam`. Allowed areas are listed in `scripts/todo/lib.mjs`.

Useful queries:

```bash
node scripts/todo/query.mjs --status now,waiting-sam
node scripts/todo/query.mjs --area security
node scripts/todo/query.mjs --grep router --all
node scripts/todo/query.mjs --test '<command>'
```

Run `node --test scripts/todo/__tests__/*.test.mjs` and `node scripts/todo/build.mjs --check` for tooling changes. Ordinary task updates need generation and `--check`; the existing engine tests run in the dedicated TODO checks workflow. This workflow has no application build or deployment steps, and its paths are excluded from Deploy to Fly. Application deployment remains separate from these checks.

The original November 8 migration is mapped in [migration-2026-11-08.md](migration-2026-11-08.md). Completed sections and the original preamble remain verbatim in [TODO-archive.md](../../TODO-archive.md). The original 21 open checkboxes are retained across ten focused task files; the existing migration checkbox is completed through its task status, while its original wording remains as historical evidence. Older checklists are explicitly labelled for reconciliation rather than reactivated. Historical audit counts and release statements keep their original dates; they are not fresh verification.

`migrate-monolith.mjs` is a one-time archival tool. Do not run `apply` against an existing task tree: it replaces task directories. Its pure migration and line-preservation functions have focused fixtures. The migration map records how to reproduce the original split and losslessness check from the retained base commit.

Current source baseline is `7f65a1f45e64fc55d019decdbc6052d368ec2547`. Its November 7 release records 74 indexable pages; older 683/1,937-page counts and low-traffic measurements are historical. The archive retains the failed forecasts, aggregation correction (46 property impressions versus 55 summed page impressions), rejected pivots, and sample limitations verbatim. No new traffic/provider measurement was made for migration.

The existing no-breadth, no-sitemap-resubmission/no-index-request and disabled-monetization boundaries remain in force. Retained dates describe prior observation plans, not new timers or minimum waiting windows; useful factual corrections need not wait. `waiting-sam` is used only for the explicit removal hold on disabled monetization scaffolding. An older routine documentation-approval request is retained as history and does not create a new owner-only gate.
