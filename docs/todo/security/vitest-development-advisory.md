---
title: "Resolve the retained development-only Vitest advisory"
status: next
area: security
due: null
updated: 2026-11-08
owner: agent
brief: "November 5 left development-server-only moderate advisories; no dependency change or fresh audit in this migration"
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-vitest-development-advisory"
test: null
---

- **What:** Preserve the unresolved development-only advisory after the production dependency repair.
- **Why:** The earlier receipt reports a clean production audit but a remaining Vitest-server exposure. This is historical evidence, not a new audit.
- **Next:** Check the installed versions and advisory, make the appropriate scoped development dependency update, and run the command in the original item.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 67-71, on 2026-11-08. -->
> Older history (TODO.md lines 67-69) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-vitest-development-advisory) on 2026-11-08.
- [ ] Dev-only, not fixed: `vitest` 4.1.8 / `@vitest/mocker` moderate (GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8; only while a Vitest server runs). Fix: bump vitest past 4.1.11 and rerun `npm run test:unit`.


<!-- End of verbatim migrated material. -->
