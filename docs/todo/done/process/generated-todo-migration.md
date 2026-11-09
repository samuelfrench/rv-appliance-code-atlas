---
title: "Migrate RV Atlas to generated task files"
status: done
area: process
due: null
updated: 2026-11-08
owner: agent
brief: "Generated tasks installed; original evidence and holds preserved, with no app deployment or scheduler adoption claim"
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
