# RV Atlas content navigation

`run.py` delegates to the immutable explorer-pipeline engine in `engine.json`. It checks Guides → the existing Onan guide and Dometic → the existing RM8 model table at 1440×900 and 390×844. These are static document links within the current 74-page indexable scope. The runner checks exact headings, paths and canonicals, runtime errors and horizontal overflow. It does not submit search or other forms, follow manufacturer links, change content, or exercise monetization.

Provide a detached canonical checkout at the pinned commit. The wrapper verifies HEAD and both file hashes before running. It never fetches source, installs dependencies or changes credentials.

```sh
python3 scripts/browser-acceptance/run.py --engine-root /absolute/path/to/pinned/explorer-pipeline --base-url https://rvappliancefaultcodes.com --expected-revision FULL_APPLICATION_SHA --output-dir /absolute/fresh/private/evidence --browser-executable /usr/bin/google-chrome
```

A zero exit and JSON `status: "passed"` verify only the declared browser behavior. `receipt.json` retains `revisionVerified: false`; `consumer.json` retains `currentServingRevisionVerified: false` and hashes the browser receipt. Independently bind the actual Fly machine image digest and full `GH_SHA` to the successful owning deployment before and after this command. No public source-revision endpoint is assumed.

Output must be fresh, absolute and outside both repositories. HTTP mutations, API paths, external services and WebSockets are intercepted. Analytics delivery and external manufacturer pages are not validated. For a local built preview, set `--canonical-origin https://rvappliancefaultcodes.com`.

This repository has no self-hosted runner with access to the private canonical engine. Hosted CI builds the actual site offline, validates this contract against the generated indexed pages, tests wrapper boundaries and runs the existing desktop/mobile Playwright suite. Its explicitly skipped shared-engine check is not browser acceptance proof. Locally, build with `SEO_OFFLINE=1 npm run build`, then set `RV_ACCEPTANCE_ENGINE_ROOT` to the pinned checkout and `RV_ACCEPTANCE_BROWSER` to the installed Chrome path when running `python3 -m unittest discover -s scripts/browser-acceptance -p 'test_*.py' -v`; that test runs the real engine against the actual built static pages on an OS-assigned port.

All no-breadth, no-indexing-request, manufacturer-safety and disabled-monetization holds remain. Tooling-only changes do not deploy the application or create a schedule.
