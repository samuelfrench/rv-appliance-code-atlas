---
title: "Migrate RV Atlas to generated task files"
status: done
area: process
due: null
updated: 2026-11-08
owner: agent
brief: "Generated tasks and archive-aware history tests installed; current scope remains checked through the task index"
refs:
  - "TODO-archive.md"
  - "8889923888a3b7e5ecd5e2f57a903ff53e79b211"
  - "https://github.com/samuelfrench/rv-appliance-code-atlas/actions/runs/42544630658"
test: null
---

- **What:** Complete the already-listed generated-TODO migration and expose a machine-readable task index for Cron Manager.
- **Why:** The latest backlog is 190,559 bytes / 574 lines / 505 nonempty lines with 21 open checkboxes. TODO availability is only one adoption prerequisite; it does not establish a production lane or authorize any job.
- **Completed:** Implementation `8889923888a3b7e5ecd5e2f57a903ff53e79b211` passed exact feature TODO CI `42544630658`, and the verified source is installed and pushed on owning main through handoff `f07f385`. Tracked files are clean; the one pre-existing untracked `scripts/__pycache__/` file remains untouched. The other nine task files remain open. This completes the task-index prerequisite only, with no app deployment or full production-adoption claim.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 55-56, on 2026-11-08. -->
- [ ] Convert this hand-maintained TODO.md to generated `docs/todo/` task files (global rule 2026-10-02); not started in this lane.


<!-- End of verbatim migrated material. -->

Original SHA-256: `bf0c6da874526c3541dd8de23f252181d2cebf731b3da08fb28524b15a831146`. Private original, split sections, metadata and verification evidence are retained under `/home/sam/.local/state/rv-appliance-code-atlas/todo-migration-20261108/`. The migration uses the proven helper including its null-heading preamble correction.

The one-time deploy-filter installation used `[skip ci]` handoff `f07f385` after the unchanged implementation passed feature-branch TODO CI, because changing the deployment workflow itself otherwise starts an app release. This documentation-only closeout exercises the normal TODO workflow on main with the new paths-ignore rules. No scheduled job was disabled or modified, and the deployment workflow remains enabled for application changes.

Verification passed: 28 TODO/migration tests; zero missing original nonempty lines (505 across 574 lines); 29 byte-exact retained text fragments covering all 18 sections; all 21 original checkbox lines remain in task sources and none were hidden in the archive. The original migration checkbox above is preserved as historical text; this task's `done` status records its completion. Generated-output and task-query checks pass. The deploy-path check confirms TODO paths are ignored while application source and the deploy workflow itself still trigger releases. Application, content, dependency, Docker/Fly and scheduler files are unchanged relative to the current remote baseline `7f65a1f45e64fc55d019decdbc6052d368ec2547`; installing the source also fast-forwarded the owning checkout's five previously missing remote commits.

Follow-through correction (November 8, 19:22 CT): the first migration missed two existing tests that read completed historical statements directly from `TODO.md`: `src/lib/traffic-report.test.ts` and `src/lib/monetization-readiness-report.test.ts`. The focused run reproduced two failures / five tests. Completed facts now read `TODO-archive.md`; the current no-breadth scope still checks the generated index, its current task body and its generated TODO link. Both affected files now pass all five tests. Full corpus validation and 227 unit tests passed; SEO self-check passed. The TODO workflow now runs these existing five tests so future task/archive changes cannot silently break that contract. No assertion was dropped, no production code or dependency changed, and deploy ignores are unchanged. The offline production build also passed with 74 unchanged ledger entries and the existing 137-word guard warning; no live fetch was made. Correction source `c9dac4836cdae15cfc4d1a34ba9b9cabdba5312e` passed exact TODO CI `42545309603`, including all five affected tests. The correction is installed and pushed on owning main through handoff `3efffb8`; the pre-existing untracked cache is preserved. That one-time `[skip ci]` source-install handoff avoided an unnecessary app release. This normal documentation closeout reruns final main TODO checks, now including the five archive/current-task contract tests. Deploy ignores were not broadened. The earlier migration completion was incomplete because those two existing tests had not been checked; this follow-through corrects that verification gap.
