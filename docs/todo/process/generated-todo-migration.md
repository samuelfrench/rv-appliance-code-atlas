---
title: "Migrate RV Atlas to generated task files"
status: now
area: process
due: null
updated: 2026-11-08
owner: agent
brief: "Losslessly migrate the existing backlog while preserving unresolved issues, traffic evidence and explicit holds"
refs:
  - "TODO-archive.md"
test: null
---

- **What:** Complete the already-listed generated-TODO migration and expose a machine-readable task index for Cron Manager.
- **Why:** The latest backlog is 190,559 bytes / 574 lines / 505 nonempty lines with 21 open checkboxes. TODO availability is only one adoption prerequisite; it does not establish a production lane or authorize any job.
- **Next:** Preserve every original line and checkbox, archive completed history, run focused checks, publish exact TODO CI, and install the source without deploying the application. Preserve the owning checkout’s pre-existing scripts/__pycache__/ directory.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 55-56, on 2026-11-08. -->
- [ ] Convert this hand-maintained TODO.md to generated `docs/todo/` task files (global rule 2026-10-02); not started in this lane.


<!-- End of verbatim migrated material. -->

Original SHA-256: `bf0c6da874526c3541dd8de23f252181d2cebf731b3da08fb28524b15a831146`. Private original, split sections, metadata and verification evidence are retained under `/home/sam/.local/state/rv-appliance-code-atlas/todo-migration-20261108/`. The migration uses the proven helper including its null-heading preamble correction.

The one-time deploy-filter installation will use a `[skip ci]` handoff commit after the unchanged implementation passes feature-branch TODO CI, because changing the deployment workflow itself otherwise starts an app release. A following docs-only closeout will exercise the normal TODO workflow on main with the new paths-ignore rules. This does not disable or modify any scheduled job.

Verification passed: 28 TODO/migration tests; zero missing original nonempty lines (505 across 574 lines); 29 byte-exact retained text fragments covering all 18 sections; all 21 original open checkbox lines remain in task sources and none were hidden in the archive. Generated-output and task-query checks pass. The deploy-path check confirms TODO paths are ignored while application source and the deploy workflow itself still trigger releases. Implementation `8889923888a3b7e5ecd5e2f57a903ff53e79b211` passed exact feature TODO CI `42544630658`. Source installation and the normal main-branch documentation closeout remain pending.
