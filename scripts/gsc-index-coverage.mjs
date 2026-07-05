import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const SITE_URL = process.env.GSC_SITE_URL || "https://rvappliancefaultcodes.com/";
const SAMPLE_SIZE = Number(process.env.GSC_COVERAGE_SAMPLE || 100);
const OUTPUT_PATH = path.join(root, "reports/gsc-index-coverage.json");
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

function resolveToken() {
  const envToken = (process.env.GSC_ACCESS_TOKEN || "").trim();
  if (envToken) return envToken;
  return execFileSync("gcloud", ["auth", "application-default", "print-access-token", `--scopes=${WEBMASTERS_SCOPE}`], {
    encoding: "utf8",
  }).trim();
}

function loadUrls() {
  const report = JSON.parse(fs.readFileSync(path.join(root, "dist/indexnow-report.json"), "utf8"));
  return report.urls;
}

function sampleEvenly(urls, size) {
  if (urls.length <= size) return urls;
  const step = urls.length / size;
  const sampled = [];
  for (let i = 0; i < size; i += 1) sampled.push(urls[Math.floor(i * step)]);
  return sampled;
}

async function inspect(url, token, quotaProject) {
  const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(quotaProject ? { "x-goog-user-project": quotaProject } : {}),
    },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  const result = data.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: result.verdict ?? "UNKNOWN",
    coverageState: result.coverageState ?? "unknown",
    lastCrawlTime: result.lastCrawlTime ?? null,
    googleCanonical: result.googleCanonical ?? null,
  };
}

const token = resolveToken();
const quotaProject = (process.env.GSC_QUOTA_PROJECT || "").trim() || null;
const urls = sampleEvenly(loadUrls(), SAMPLE_SIZE);
const results = [];
for (const url of urls) {
  try {
    results.push(await inspect(url, token, quotaProject));
  } catch (error) {
    results.push({ url, verdict: "ERROR", coverageState: `error: ${error.message}`, lastCrawlTime: null, googleCanonical: null });
  }
  process.stdout.write(".");
}
process.stdout.write("\n");

const byState = {};
for (const row of results) byState[row.coverageState] = (byState[row.coverageState] ?? 0) + 1;

const report = {
  generatedAt: new Date().toISOString(),
  siteUrl: SITE_URL,
  totalSitemapUrls: loadUrls().length,
  sampledUrls: results.length,
  coverageStateCounts: byState,
  results,
};
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ totalSitemapUrls: report.totalSitemapUrls, sampledUrls: report.sampledUrls, coverageStateCounts: byState }, null, 2));
console.log(`Report written to ${OUTPUT_PATH}`);
