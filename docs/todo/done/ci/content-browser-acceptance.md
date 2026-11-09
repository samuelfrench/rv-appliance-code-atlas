---
title: "Adopt pinned shared content-browser acceptance for RV Atlas"
status: done
area: ci
due: null
updated: 2026-11-09
owner: agent
brief: "Reviewed pinned consumer passed CI and four live flows with separate unchanged native source/image proof."
refs: ["scripts/browser-acceptance/run.py", ".github/workflows/browser-acceptance.yml"]
test: null
---

## Scope

Delivered a thin owning consumer of reviewed explorer-pipeline engine `cf0fec8cade15194db8aec0e4403402caff8ae8d`, pinned by full revision and file hashes. Selected two actual static navigation flows within the existing 74-page indexable scope. Verify headings, canonical URLs, errors and horizontal overflow at desktop/mobile sizes; capture private JSON and screenshots. Browser success retains `revisionVerified: false`; actual Fly full GH_SHA/image digest and successful owning CI are separate before/after source evidence.

Preserve the no-breadth/no-new-code-pages, no sitemap resubmission/index-request and manufacturer-safety boundaries, disabled monetization and its explicit removal hold. No content/app changes, forms, model/job/schedule, deploy or production indexing action are part of QA. Baseline fetched main is `53f204a35424fdda1ddb11d025e18f4fd120221c`; primary's unrelated `scripts/__pycache__/` is preserved in place.

The repository has no self-hosted runner with the private canonical checkout. Hosted CI must explicitly test owning wrapper/contract/deploy separation and required corpus/runtime behavior; actual shared-engine fixtures use the existing local detached source and pinned Python runtime. Do not present an absent hosted engine as executed acceptance. Current retained application baseline is `f8587d769ce6e2c1f0092e8ab07590680642ff1c` / Deploy `42404510143`; refresh native serving identity before a live claim. Finish with focused checks, green applicable CI, exact runtime proof, committed/pushed source and executable handoff to the central observer owner.

## Implementation checkpoint

Implemented the thin pinned wrapper, static Guides → Onan and Dometic → RM8 navigation contract, private receipts, and dedicated hosted workflow. Five focused tests passed, including the real pinned engine against actual built pages at both sizes; corpus validation and 28 TODO tests passed, actionlint/generated/diff checks passed. Offline build kept all 74 ledger entries unchanged, with the pre-existing 137-word SEO warning retained. A first local fixture exposed duplicate RM10 links in the Dometic latest section; switched only the acceptance target to the existing uniquely linked RM8 table and reran the fixture successfully. No live attempt had occurred.

Hosted CI explicitly checks wrapper/contract/deploy separation and runs the repository's existing full unit/desktop-mobile runtime gates against its offline build. Its one local-engine-only test is explicitly skipped because the private canonical repo is unavailable there; the five-test local result above supplies that separate proof. Added only the acceptance scripts/workflow and deployment-workflow file itself to Deploy's tooling-only ignores, so this adoption cannot deploy an unchanged application. Application paths continue to trigger deployment normally. The source and live evidence below complete this checkpoint.

## Delivered

Consumer source `1bae5e6f68b29b9d6c73c68f2039db850f7dbba1` passed scoped review and exact Content browser acceptance CI `42566038260` plus TODO CI `42566038292`. The hosted run executed 227 unit tests and 142 existing desktop/mobile runtime tests successfully, plus corpus/SEO/build and four owning wrapper/contract checks. Its explicitly skipped private-engine positive is covered separately by all five local tests against the actual built site. No whole-engine re-review or repeated performance benchmark was needed.

Live acceptance on November 9 at 05:18:09–15 UTC passed both flows at 1440×900 and 390×844, with exact headings/canonical paths and zero page/console errors, failed owning requests, attempted HTTP/WebSocket writes or horizontal page overflow. All four target viewport captures were visually inspected; table-internal scrolling remains distinct from page overflow. The first attempt's sole `/guides/` request failed Chromium `ERR_NETWORK_CHANGED` before any page loaded; it is retained, and the one permitted retry passed. No third attempt occurred.

Native Fly before/after matched started machine `0803069b1714e8`, full application `GH_SHA` `f8587d769ce6e2c1f0092e8ab07590680642ff1c` and image digest `sha256:1dddd14da4de81e9c5acf9631cd1fcfcbba3bf6bef72a34c8407c91b208ff136`. The latest application Deploy remains the successful `42404510143`, with its retained exact jobs/steps proof. No deployment was triggered by acceptance tooling. Private combined proof: `~/.local/share/rv-appliance-code-atlas/verification/content-acceptance-20261109/verified.json`; successful browser receipt `live-2/receipt.json` SHA256 `0f655572f17f49fc3ce2e81b562d0a4c37994b57703806150e5004ddbb415c28`. Original failed receipt and native snapshots are alongside it.

Executable handoff: `python3 scripts/browser-acceptance/run.py --engine-root <detached cf0fec8 checkout> --base-url https://rvappliancefaultcodes.com --expected-revision <full serving SHA> --output-dir <fresh private directory> --browser-executable /usr/bin/google-chrome`. Contract site is `rv-appliance-fault-codes`; browser/consumer source-verification flags stay false. The combined native proof is separate, and central observer integration belongs to Cron's owning writer. No content/safety fact, indexing outcome, external service or monetization capability was validated or changed by this task.

Main checkpoint `20699c308e5aabe691c1e473aadc86a3a9f4e9ad` passed Content browser acceptance `42566654929` and TODO `42566654980`. Primary was fast-forwarded to that source; its one pre-existing untracked cache file was verified byte-identical. This final documentation closeout changes no runtime bytes. Source ownership is yielded; the next consumer may run from the current owning checkout. Shared memory and generated TODO were checked separately against these exact receipts.
