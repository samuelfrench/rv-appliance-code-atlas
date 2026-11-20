---
title: "Reuse the tested production build on a future authorized release"
status: now
area: infra
due: null
updated: 2026-11-20
owner: agent
brief: "Single-build pipeline committed (image built once, static+nginx checks, deploy by digest); one dispatched release must prove it"
refs:
  - "TODO-archive.md"
  - ".github/workflows/deploy.yml"
  - "scripts/release/check-release.mjs"
  - "scripts/release/__tests__/pipeline-contract.test.mjs"
test: null
---

- **What:** Preserve the existing immutable-artifact release-pipeline proposal.
- **Why:** Its historical audit reports two frontend builds. Current pipeline behavior must be rechecked before implementation; another site’s timing is not a forecast for RV Atlas.
- **Next:** Dispatch Deploy to Fly once (`gh workflow run deploy.yml -R samuelfrench/rv-appliance-code-atlas --ref main`) and record run ID, duration, digest, machine binding and live desktop/mobile proof below.

## 2026-11-20 implementation (headroom-due run)

- **Recheck at 390772c:** still two builds: `.github/workflows/deploy.yml` ran `npm run build` on the host, then `flyctl deploy --remote-only` rebuilt via `Dockerfile:6`. The host `dist/` was discarded; the deployed image came from an untested remote build, and no CI step ever exercised nginx (redirect map, 404, www host).
- **Baseline (GitHub Actions jobs API, `gh api repos/samuelfrench/rv-appliance-code-atlas/actions/runs/<id>/jobs`):** 44778632940 85 s (host build 3 s, remote build+deploy 65 s); 42404510143 67 s (3/47); 42398089246 74 s (3/51); 42041611448 99 s (3/35); 41957218147 64 s (2/42). Median job 74 s. setup-node npm cache warm; Fly remote-builder layer cache state not reported. The second build costs about 3 s, so this change is for exact-artifact correctness, not speed.
- **New pipeline:** host `npm ci`, `validate:corpus`, `seo:self-check`, `test:unit`, then `node --test scripts/release/__tests__/*.test.mjs`; one `docker build` (the Dockerfile's `npm run build`, labelled `org.opencontainers.image.revision=$GITHUB_SHA`); `check-release.mjs static` on `/usr/share/nginx/html` and `/etc/nginx/rv-redirects.map` copied out of that image (required files, every sitemap URL has a page, every redirect target page and `#anchor` exists, no redirect shadows a page, no chains); `check-release.mjs runtime` against the image's nginx on 127.0.0.1:8080 (home 200 + nosniff, all sitemap pages 200 text/html, sitemap/robots types, 26 sampled 301 Locations, 404 body, www 301); push `registry.fly.io/rv-appliance-code-atlas:ci-<sha>-<run>-<attempt>` with a throwaway `DOCKER_CONFIG`, parse the push digest, pull by digest and require config ID + revision label to match, `flyctl deploy --image registry.fly.io/rv-appliance-code-atlas@<digest>`, require every machine on that digest, then rerun the runtime check against https://rvappliancefaultcodes.com. `scripts/release/**` joined `paths-ignore` (non-shipping tooling, same treatment as `deploy.yml`).
- **Local evidence 2026-11-20:** `node --test scripts/release/__tests__/*.test.mjs` 9/9 pass; the 4 contract tests all fail against the old `deploy.yml` (mutation check). `check-release.mjs static dist build/nginx-redirects.map` on a local build: OK (74 sitemap pages, 2,114 map lines). `check-release.mjs runtime https://rvappliancefaultcodes.com ...` against the current live nginx: OK in 1.5 s. Docker was not run locally (not inside the cron resource slice); the image steps are first exercised in CI.
- **Assumption:** `flyctl machine list --json` exposes `image_ref.digest` and `config.image`; flyctl was not authenticated locally, so the post-deploy machine check accepts either field and prints both for evidence.

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
