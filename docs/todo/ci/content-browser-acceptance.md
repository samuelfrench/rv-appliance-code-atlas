---
title: "Adopt pinned shared content-browser acceptance for RV Atlas"
status: now
area: ci
due: null
updated: 2026-11-09
owner: agent
brief: "Verify existing indexed-page navigation using the shared engine and separate native source proof."
refs: ["scripts/browser-acceptance/run.py", ".github/workflows/browser-acceptance.yml"]
test: null
---

## What / Why / Next

Add a thin owning consumer of reviewed explorer-pipeline engine `cf0fec8cade15194db8aec0e4403402caff8ae8d`, pinned by full revision and file hashes. Select two actual static navigation flows within the existing 74-page indexable scope. Verify headings, canonical URLs, errors and horizontal overflow at desktop/mobile sizes; capture private JSON and screenshots. Browser success retains `revisionVerified: false`; actual Fly full GH_SHA/image digest and successful owning CI are separate before/after source evidence.

Preserve the no-breadth/no-new-code-pages, no sitemap resubmission/index-request and manufacturer-safety boundaries, disabled monetization and its explicit removal hold. No content/app changes, forms, model/job/schedule, deploy or production indexing action are part of QA. Baseline fetched main is `53f204a35424fdda1ddb11d025e18f4fd120221c`; primary's unrelated `scripts/__pycache__/` is preserved in place.

The repository has no self-hosted runner with the private canonical checkout. Hosted CI must explicitly test owning wrapper/contract/deploy separation and required corpus/runtime behavior; actual shared-engine fixtures use the existing local detached source and pinned Python runtime. Do not present an absent hosted engine as executed acceptance. Current retained application baseline is `f8587d769ce6e2c1f0092e8ab07590680642ff1c` / Deploy `42404510143`; refresh native serving identity before a live claim. Finish with focused checks, green applicable CI, exact runtime proof, committed/pushed source and executable handoff to the central observer owner.
