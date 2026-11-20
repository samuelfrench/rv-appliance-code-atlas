---
title: "Unpin browser acceptance from ubuntu-24.04 by upgrading Playwright"
status: idea
area: infra
due: null
updated: 2026-11-20
owner: agent
brief: "Acceptance pinned to ubuntu-24.04 (ef6514c) because Playwright 1.60.0 cannot install Chromium on ubuntu-latest = 26.04"
refs:
  - ".github/workflows/browser-acceptance.yml"
  - "package.json"
test: null
---

- **What:** `.github/workflows/browser-acceptance.yml` runs on `ubuntu-24.04` instead of `ubuntu-latest`. Runs 44820521573 and 44820876574 (2026-11-20) failed at `npx playwright install --with-deps chromium` with `ERROR: Playwright does not support chromium on ubuntu26.04-x64`; run 44821488198 on ubuntu-24.04 passed 142/142.
- **Why:** The pin works until GitHub retires the 24.04 image. `deploy.yml` and `todo.yml` stay on `ubuntu-latest` (no Playwright; Deploy run 44820875169 passed on 26.04).
- **Next:** When a `@playwright/test` release supports ubuntu 26.04, bump `@playwright/test` (currently 1.60.0) in `package.json`, run `npm run verify:runtime` locally, set `runs-on: ubuntu-latest` back, and confirm the Content browser acceptance run is green. Done = acceptance green on `ubuntu-latest`.
