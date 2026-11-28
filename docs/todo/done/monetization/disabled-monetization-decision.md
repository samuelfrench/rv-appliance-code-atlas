---
title: "Preserve the explicit hold on removing disabled monetization scaffolding"
status: done
area: monetization
due: null
updated: 2026-11-28
owner: agent
brief: "Closed 2026-11-28: Sam left the disabled monetization scaffolding in place. The standing hold remains: do not remove it without an explicit yes from Sam."
refs:
  - "TODO-archive.md"
  - "TODO-archive.md#todo-migration-2026-11-08-disabled-monetization-decision"
test: null
---

- **What:** Preserve the October 1 owner-only decision about disabled placeholders.
- **Why:** The original instruction explicitly says not to remove the scaffolding without approval. The site remains free and this migration changes no monetization behavior.
- **Next:** Keep the disabled state and original decision text. Any later owner decision must identify the exact removal scope; do not treat the old revenue plan as an active initiative.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 76-83, on 2026-11-08. -->
> Older history (TODO.md lines 76-82) moved verbatim to [TODO-archive.md](../../../TODO-archive.md#todo-migration-2026-11-08-disabled-monetization-decision) on 2026-11-08.
- [ ] Monetization placeholders: nothing has ever been sold (no checkout, paywall, or paid tier). Sam asked to "give away whatever was being sold"; the answer was that everything is already free. Pending confirmation: remove the disabled ad/affiliate placeholders (`corpus.monetization`, `scripts/monetization-readiness-report.mjs`, readiness tests) and retire the unbuilt lead-selling plan in `docs/monetization-plan.md`, optionally adding a "free, no ads or paid tiers" note. Do not remove without that explicit yes.


<!-- End of verbatim migrated material. -->

## Inbox reply sheet 2026-11-28

- 2026-11-28 — Sam (inbox reply sheet): "leave the disabled monetization scaffolding."
- Outcome: Decision row closed. Scaffolding stays (corpus.monetization placeholders, scripts/monetization-readiness-report.mjs and its test, docs/monetization-plan.md); nothing is sold on RV Atlas. The hold stays in force: no agent removes it without an explicit owner yes. Revisit if the 500 weekly impression gate in docs/monetization-plan.md is ever met.
