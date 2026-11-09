---
title: "Reuse the tested production build on a future authorized release"
status: next
area: infra
due: null
updated: 2026-11-08
owner: agent
brief: "Retain the existing two-build release follow-up; do not deploy or optimize the release pipeline during TODO adoption"
refs:
  - "TODO-archive.md"
test: null
---

- **What:** Preserve the existing immutable-artifact release-pipeline proposal.
- **Why:** Its historical audit reports two frontend builds. Current pipeline behavior must be rechecked before implementation; another site’s timing is not a forecast for RV Atlas.
- **Next:** Follow the retained scope and validation criteria when this engineering lane is selected. This migration changes only TODO/deploy filtering and does not perform a release.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 205-237, on 2026-11-08. -->
## Release pipeline follow-up — 2026-09-06

- [ ] Reuse the tested production build in releases (2026-09-06; origin/main@a6fa61cd83a7)
  Audited build invocations: 2 frontend builds on the normal release path.

  The workflow compiles frontend/static pages, then Fly remotely rebuilds the same source via
  Dockerfile; no tested-dist transfer exists.

  Evidence: .github/workflows/deploy.yml:24, .github/workflows/deploy.yml:26, .github/workflows/deploy.yml:28, Dockerfile:6. Keep corpus/unit validation, compile one
  runtime image, check its extracted static output and runtime, then deploy the verified immutable
  digest.

  Preserve: official-source corpus validation, unit tests, TypeScript/Vite/static generation;
  runtime verification and nginx port 8080; cancel-in-progress=false and current runner/release
  rules; manufacturer safety guidance/content unchanged; no checkout/payment/provider/monetization
  work.

  Reproduce: `git -C /home/sam/claude-workspace/rv-appliance-code-atlas grep -n -E 'npm.*(build|verify|test:e2e)|fly(ct[l])? deploy|build-and-smoke|runtime-prebuilt|build-only|GITHUB_OUTPUT' a6fa61cd83a7a5d3c1afa771d83ead73f1c74fc1 -- .github/workflows/deploy.yml Dockerfile`.

  Done: Run focused fail-closed pipeline-contract checks, then every existing quality gate on the
  exact production artifact/image. On the next already-authorized release, retain green CI, full
  source SHA, tested config ID, published/deployed digest and independent desktop/mobile runtime
  evidence; measure before/after durations with cache state and no skipped frontend build. Do not
  extrapolate Honey timing or set a universal 15-minute target.

  Offline implementation/review needs no new external approval clock, account, service or recurring
  cost. Production release remains subject to this repo's existing approval and scheduling rules.

  Reference: [Honey implementation and measured
  run](https://github.com/samuelfrench/honey-explorer/blob/703e0be09a303e123f324cb388240d8683ced98c/insights/release-speed-2026-09-06.md).
  Honey measured 831 seconds versus 1,676 seconds; measure this repo separately with cache state
  recorded.


<!-- End of verbatim migrated material. -->
