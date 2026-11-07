"""Read-only Search Console measurement for the 2026-11-07 quality consolidation.

Usage (run with the conda python that has google libs; reuses traffic-report auth):
  python3 scripts/seo/gsc-quality-sample.py pages   <out.json> [days=90]
  python3 scripts/seo/gsc-quality-sample.py inspect <manifest.json> <out.json>

`pages` writes 90-day page-level clicks/impressions (dimension page, all rows).
`inspect` runs URL Inspection on every URL in the manifest (a JSON list of
{"url", "stratum"}) and writes coverageState, lastCrawl, referrers and canonicals.
It never writes to Search Console (no sitemap submit, no Indexing API).
"""
from __future__ import annotations

import json
import socket
import sys
import time
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote

_orig = socket.getaddrinfo


def _v4(host, port, family=0, type=0, proto=0, flags=0):  # this host's IPv6 stalls Google APIs
    return _orig(host, port, socket.AF_INET, type, proto, flags)


socket.getaddrinfo = _v4

TR = Path.home() / "claude-workspace/traffic-report"
sys.path.insert(0, str(TR / "scripts"))
import collect as tc  # noqa: E402

PROPERTY = "https://rvappliancefaultcodes.com/"


def client():
    profiles, _errors = tc.build_gsc_profiles()
    clients, _ = tc.preferred_gsc_clients(profiles)
    c = clients.get(PROPERTY)
    if c is None:
        raise SystemExit(f"No readable Search Console client for {PROPERTY}")
    return c


def call(c, url, body):
    if hasattr(c, "_service"):
        raise SystemExit("service-account client path not implemented; use ADC")
    return c._request(url, body)


def pages(out: Path, days: int) -> None:
    c = client()
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=days - 1)
    rows, offset = [], 0
    while True:
        body = {"startDate": str(start), "endDate": str(end), "dimensions": ["page"], "rowLimit": 25000,
                "startRow": offset, "type": "web", "dataState": "all"}
        r = c.query(PROPERTY, body)
        batch = r.get("rows", [])
        rows += batch
        if len(batch) < 25000:
            break
        offset += 25000
    total = c.query(PROPERTY, {"startDate": str(start), "endDate": str(end), "type": "web", "dataState": "all"})
    out.write_text(json.dumps({"property": PROPERTY, "startDate": str(start), "endDate": str(end),
                               "propertyTotal": (total.get("rows") or [{}])[0],
                               "pages": [{"url": row["keys"][0], "clicks": row["clicks"], "impressions": row["impressions"],
                                          "position": round(row["position"], 1)} for row in rows]}, indent=1))
    print(f"{len(rows)} page rows {start}..{end}; property total {(total.get('rows') or [{}])[0]}")


def inspect(manifest: Path, out: Path) -> None:
    c = client()
    items = json.loads(manifest.read_text())
    results = []
    for i, item in enumerate(items):
        body = {"siteUrl": PROPERTY, "inspectionUrl": item["url"], "languageCode": "en-US"}
        for attempt in range(2):
            try:
                r = call(c, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", body)
                ir = r.get("inspectionResult", {}).get("indexStatusResult", {})
                results.append({**item, "verdict": ir.get("verdict"), "coverage": ir.get("coverageState"),
                                "lastCrawl": ir.get("lastCrawlTime"), "pageFetch": ir.get("pageFetchState"),
                                "robots": ir.get("robotsTxtState"), "indexing": ir.get("indexingState"),
                                "googleCanonical": ir.get("googleCanonical"), "userCanonical": ir.get("userCanonical"),
                                "sitemaps": ir.get("sitemap") or [], "referring": ir.get("referringUrls") or []})
                break
            except Exception as e:  # noqa: BLE001
                if attempt:
                    results.append({**item, "error": type(e).__name__, "detail": str(e)[:200]})
                time.sleep(2)
        print(i + 1, item["url"], results[-1].get("coverage") or results[-1].get("error"), flush=True)
    out.write_text(json.dumps({"property": PROPERTY, "inspectedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                               "results": results}, indent=1))


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "pages":
        pages(Path(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 90)
    elif mode == "inspect":
        inspect(Path(sys.argv[2]), Path(sys.argv[3]))
    else:
        raise SystemExit(__doc__)
