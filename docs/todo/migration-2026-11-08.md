# TODO.md → task files: migration map (2026-11-08)

Source: `TODO.md` @ `7f65a1f45e64fc55d019decdbc6052d368ec2547` (18 sections, including any preamble). Produced by `node scripts/todo/migrate-monolith.mjs`. Every non-empty line of the old file is in a task file below or in the `[MIGRATED 2026-11-08]` appendix of `TODO-archive.md` (proof: `migrate-monolith.mjs verify`). Merged sections were duplicates or superseded versions of the same task.

| Section | Old lines | Old heading (first 110 chars) | New file | Note |
|---|---|---|---|---|
| S000 | 1-2 | Preamble | TODO-archive.md | retired (not a task) — archived verbatim |
| S001 | 3-23 | Shared SEO template: lastmod ledger + latest links — 2026-11-07 (lane rv-seo, fan-out wave 2) | [seo/seo-template-followthrough.md](seo/seo-template-followthrough.md) | history archived |
| S002 | 24-62 | Quality consolidation — 2026-11-07 (lane rv-quality; Sam: "a quality problem, not a discovery problem") | 3 files | split into focused task files; original text retained |
| S002 | 24-54 | Quality consolidation — 2026-11-07 (lane rv-quality; Sam: "a quality problem, not a discovery problem") | [content/quality-consolidation-followthrough.md](content/quality-consolidation-followthrough.md) | history archived |
| S002 | 55-56 | Quality consolidation — 2026-11-07 (lane rv-quality; Sam: "a quality problem, not a discovery problem") | [process/generated-todo-migration.md](process/generated-todo-migration.md) |  |
| S002 | 57-62 | Quality consolidation — 2026-11-07 (lane rv-quality; Sam: "a quality problem, not a discovery problem") | [content/quality-consolidation-followthrough.md](content/quality-consolidation-followthrough.md) | history archived |
| S003 | 63-66 | GA4 client-error events | [analytics/ga4-client-error-events.md](analytics/ga4-client-error-events.md) |  |
| S004 | 67-71 | Security — npm advisories (2026-11-05) | [security/vitest-development-advisory.md](security/vitest-development-advisory.md) | history archived |
| S005 | 72-75 | Deploy trigger | TODO-archive.md | retired (not a task) — archived verbatim |
| S006 | 76-105 | Handoff — 2026-10-01 (cloud session, ready to exit) | 2 files | split into focused task files; original text retained |
| S006 | 76-83 | Handoff — 2026-10-01 (cloud session, ready to exit) | [monetization/disabled-monetization-decision.md](monetization/disabled-monetization-decision.md) | history archived |
| S006 | 84-105 | Handoff — 2026-10-01 (cloud session, ready to exit) | [process/legacy-instruction-handoff.md](process/legacy-instruction-handoff.md) | history archived |
| S007 | 106-122 | 2026-10-01 — content refresh for usefulness (Sam asked: "Refresh the site content to make it genuinely useful" | [process/legacy-content-refresh-followthrough.md](process/legacy-content-refresh-followthrough.md) | history archived |
| S008 | 123-126 | [x] 2026-09-14 — hero generator switched to Juggernaut X v10 | TODO-archive.md | retired (not a task) — archived verbatim |
| S009 | 127-138 | Mothball assessment — 2026-09-06 | TODO-archive.md | retired (not a task) — archived verbatim |
| S010 | 139-204 | Earlier 2026-09-06 checkpoint analysis — interpretation corrected | TODO-archive.md | retired (not a task) — archived verbatim |
| S011 | 205-237 | Release pipeline follow-up — 2026-09-06 | [infra/reuse-tested-production-build.md](infra/reuse-tested-production-build.md) |  |
| S012 | 238-338 | Current Batch | TODO-archive.md | retired (not a task) — archived verbatim |
| S013 | 339-347 | Current State — 2026-07-04 (session update) | TODO-archive.md | retired (not a task) — archived verbatim |
| S014 | 348-484 | Current State — 2026-06-04 | TODO-archive.md | retired (not a task) — archived verbatim |
| S015 | 485-555 | Corpus Expansion Backlog | [content/depth-only-content-scope.md](content/depth-only-content-scope.md) | history archived |
| S016 | 556-570 | Growth & Monetization — next steps (added 2026-07-04) | TODO-archive.md | retired (not a task) — archived verbatim |
| S017 | 571-574 | Launch Automation | TODO-archive.md | retired (not a task) — archived verbatim |

The metadata recipe is [migration-2026-11-08-metadata.json](migration-2026-11-08-metadata.json). Reproduce only in a fresh temporary checkout: recover `TODO.md` with `git show 7f65a1f45e64fc55d019decdbc6052d368ec2547:TODO.md`, use an empty archive base, split it, apply the recipe, then run `verify`. All 18 original sections are mapped; completed historical sections and completed ranges are archived verbatim. Original open checkboxes remain in the task sources. The explicit end markers keep original blank lines inside their preserved sections.
