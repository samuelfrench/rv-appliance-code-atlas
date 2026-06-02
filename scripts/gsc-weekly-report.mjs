#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_API_BASE = "https://www.googleapis.com/webmasters/v3";
const DEFAULT_BASE_URL = corpus.site.baseUrl;
const DEFAULT_SITE_URL = corpus.site.searchConsole?.siteUrl || `${DEFAULT_BASE_URL.replace(/\/$/, "")}/`;
const DEFAULT_SITEMAP_URL =
  corpus.site.searchConsole?.sitemapUrl || `${DEFAULT_BASE_URL.replace(/\/$/, "")}/sitemap.xml`;
const DEFAULT_OUTPUT_PATH = "reports/gsc-weekly-traffic.json";
const DEFAULT_ROW_LIMIT = 25;
const WEBMASTERS_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";
export const DEFAULT_TOKEN_COMMAND = `gcloud auth application-default print-access-token --scopes=${WEBMASTERS_READONLY_SCOPE}`;
export const COMPAT_TOKEN_COMMAND = `gcloud auth application-default print-access-token --scopes=${WEBMASTERS_SCOPE}`;
const DEFAULT_TOKEN_SOURCE = "default gcloud ADC webmasters.readonly token command";
const COMPAT_TOKEN_SOURCE = "default gcloud ADC webmasters token command";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const DAY_MS = 86_400_000;
const DEFAULT_DATE_TIME_ZONE = "America/Los_Angeles";
const DEFAULT_DATA_DELAY_DAYS = 3;
const ADC_CREDENTIALS = path.join(process.env.HOME ?? "", ".config", "gcloud", "application_default_credentials.json");

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value, label) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`${label} must use YYYY-MM-DD: ${value}`);
  }

  const [year, month, day] = raw.split("-").map(Number);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (formatUtcDate(date) !== raw) {
    throw new Error(`${label} is not a valid calendar date: ${value}`);
  }
  return time;
}

function countInclusiveDays(startDate, endDate) {
  const startTime = parseIsoDate(startDate, "start date");
  const endTime = parseIsoDate(endDate, "end date");
  if (startTime > endTime) {
    throw new Error(`start date must be on or before end date: ${startDate} > ${endDate}`);
  }
  return Math.floor((endTime - startTime) / DAY_MS) + 1;
}

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function getDefaultWeeklyDateRange(now = new Date()) {
  const today = getDatePartsInTimeZone(now, DEFAULT_DATE_TIME_ZONE);
  const todayTime = Date.UTC(today.year, today.month - 1, today.day);
  const endDate = formatUtcDate(new Date(todayTime - DEFAULT_DATA_DELAY_DAYS * DAY_MS));
  const startDate = formatUtcDate(new Date(todayTime - (DEFAULT_DATA_DELAY_DAYS + 6) * DAY_MS));
  return {
    startDate,
    endDate,
    days: 7,
    timeZone: DEFAULT_DATE_TIME_ZONE,
    dataDelayDays: DEFAULT_DATA_DELAY_DAYS,
  };
}

function normalizeBaseUrl(value = DEFAULT_BASE_URL) {
  const trimmed = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_BASE_URL;
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`base URL must include http(s) scheme and host: ${value}`);
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "")}`;
}

function normalizePinnedBaseUrl(value = DEFAULT_BASE_URL) {
  const normalizedBaseUrl = normalizeBaseUrl(value);
  const pinnedBaseUrl = normalizeBaseUrl(DEFAULT_BASE_URL);
  if (normalizedBaseUrl !== pinnedBaseUrl) {
    throw new Error(`base URL is pinned to ${pinnedBaseUrl}: ${value}`);
  }
  return normalizedBaseUrl;
}

function normalizeUrlPrefixSiteUrl(value, baseUrl = DEFAULT_BASE_URL) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const raw = String(value || normalizedBaseUrl).trim();
  if (raw.toLowerCase().startsWith("sc-domain:")) {
    throw new Error(`site URL must be a URL-prefix property, not a domain property: ${raw}`);
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`site URL must include http(s) scheme and host: ${raw}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`site URL must include http(s) scheme and host: ${raw}`);
  }

  const base = new URL(normalizedBaseUrl);
  if (parsed.protocol !== base.protocol) {
    throw new Error(`site URL must use ${base.protocol} for the configured URL-prefix base ${normalizedBaseUrl}: ${raw}`);
  }

  if (parsed.host !== base.host) {
    throw new Error(`site URL is not on ${base.host}: ${raw}`);
  }

  const normalizedPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
  const basePath = base.pathname === "/" ? "" : base.pathname.replace(/\/+$/, "");
  if (normalizedPath !== basePath) {
    throw new Error(`site URL must match the configured URL-prefix base ${normalizedBaseUrl}: ${raw}`);
  }

  return `${parsed.protocol}//${parsed.host}${basePath}/`;
}

function normalizeSitemapUrl(value, baseUrl = DEFAULT_BASE_URL) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const raw = String(value || `${normalizedBaseUrl}/sitemap.xml`).trim();
  const parsed = new URL(raw);
  const base = new URL(normalizedBaseUrl);
  if (parsed.protocol !== base.protocol) {
    throw new Error(`sitemap URL must use ${base.protocol} for the configured URL-prefix base ${normalizedBaseUrl}: ${raw}`);
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.host !== base.host) {
    throw new Error(`sitemap URL is not on ${base.host}: ${raw}`);
  }
  return parsed.href;
}

function normalizeRowLimit(value = DEFAULT_ROW_LIMIT) {
  const rowLimit = Number(value);
  if (!Number.isInteger(rowLimit) || rowLimit < 1 || rowLimit > 25_000) {
    throw new Error(`row limit must be an integer from 1 to 25000: ${value}`);
  }
  return rowLimit;
}

export function buildSearchAnalyticsEndpoint(siteUrl, apiBase = DEFAULT_API_BASE) {
  return `${apiBase.replace(/\/+$/, "")}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
}

function buildSearchAnalyticsRequest({ startDate, endDate, dimension, rowLimit }) {
  return {
    startDate,
    endDate,
    dimensions: [dimension],
    rowLimit,
  };
}

export function buildWeeklyReportPlan({
  baseUrl = DEFAULT_BASE_URL,
  siteUrl = DEFAULT_SITE_URL,
  sitemapUrl = DEFAULT_SITEMAP_URL,
  startDate,
  endDate,
  rowLimit = DEFAULT_ROW_LIMIT,
  outputPath = DEFAULT_OUTPUT_PATH,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  const normalizedBaseUrl = normalizePinnedBaseUrl(baseUrl);
  const defaultRange = getDefaultWeeklyDateRange();
  const resolvedStartDate = startDate || defaultRange.startDate;
  const resolvedEndDate = endDate || defaultRange.endDate;
  const days = countInclusiveDays(resolvedStartDate, resolvedEndDate);
  const resolvedRowLimit = normalizeRowLimit(rowLimit);
  const resolvedSiteUrl = normalizeUrlPrefixSiteUrl(siteUrl, normalizedBaseUrl);
  const resolvedSitemapUrl = normalizeSitemapUrl(sitemapUrl, normalizedBaseUrl);
  const searchAnalyticsEndpoint = buildSearchAnalyticsEndpoint(resolvedSiteUrl, apiBase);

  return {
    siteUrl: resolvedSiteUrl,
    sitemapUrl: resolvedSitemapUrl,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    days,
    rowLimit: resolvedRowLimit,
    outputPath: String(outputPath || DEFAULT_OUTPUT_PATH),
    searchAnalyticsEndpoint,
    requests: {
      queries: buildSearchAnalyticsRequest({
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        dimension: "query",
        rowLimit: resolvedRowLimit,
      }),
      pages: buildSearchAnalyticsRequest({
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        dimension: "page",
        rowLimit: resolvedRowLimit,
      }),
    },
  };
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeSearchAnalyticsRows(response, keyName) {
  const rows = Array.isArray(response?.rows) ? response.rows : [];
  return rows.map((row) => {
    const key = Array.isArray(row.keys) && row.keys[0] ? String(row.keys[0]) : "(not provided)";
    return {
      [keyName]: key,
      clicks: numberOrZero(row.clicks),
      impressions: numberOrZero(row.impressions),
      ctr: numberOrZero(row.ctr),
      position: numberOrZero(row.position),
    };
  });
}

export function summarizeSearchAnalyticsRows(rows) {
  const summary = {
    rowCount: rows.length,
    clicks: 0,
    impressions: 0,
    ctr: 0,
    averagePosition: 0,
  };

  let weightedPosition = 0;
  for (const row of rows) {
    const clicks = numberOrZero(row.clicks);
    const impressions = numberOrZero(row.impressions);
    const position = numberOrZero(row.position);
    summary.clicks += clicks;
    summary.impressions += impressions;
    weightedPosition += position * impressions;
  }

  if (summary.impressions > 0) {
    summary.ctr = summary.clicks / summary.impressions;
    summary.averagePosition = weightedPosition / summary.impressions;
  }

  return summary;
}

export function buildWeeklyTrafficReport({
  plan,
  queryRows,
  pageRows,
  generatedAt = new Date().toISOString(),
}) {
  return {
    generatedAt,
    source: "google-search-console-searchanalytics",
    siteUrl: plan.siteUrl,
    sitemapUrl: plan.sitemapUrl,
    dateRange: {
      startDate: plan.startDate,
      endDate: plan.endDate,
      days: plan.days,
    },
    rowLimit: plan.rowLimit,
    dataAvailable: queryRows.length > 0 || pageRows.length > 0,
    summary: {
      queries: summarizeSearchAnalyticsRows(queryRows),
      pages: summarizeSearchAnalyticsRows(pageRows),
    },
    topQueries: queryRows,
    topPages: pageRows,
  };
}

function resolveQuotaProject() {
  const envProject = (process.env.GSC_QUOTA_PROJECT || "").trim();
  if (envProject) return envProject;

  try {
    const credentials = JSON.parse(fs.readFileSync(ADC_CREDENTIALS, "utf8"));
    const quotaProject = String(credentials.quota_project_id || "").trim();
    if (quotaProject) return quotaProject;
  } catch {
    // Fall through to gcloud config.
  }

  try {
    const project = execFileSync("gcloud", ["config", "get-value", "project"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }).trim();
    return project || null;
  } catch {
    return null;
  }
}

function resolveAccessToken() {
  const envToken = (process.env.GSC_ACCESS_TOKEN || "").trim();
  if (envToken) return { token: envToken, source: "GSC_ACCESS_TOKEN" };

  const explicitCommand = (process.env.GSC_ACCESS_TOKEN_COMMAND || "").trim();
  const attempts = explicitCommand
    ? [{ command: explicitCommand, source: "GSC_ACCESS_TOKEN_COMMAND" }]
    : [
        { command: DEFAULT_TOKEN_COMMAND, source: DEFAULT_TOKEN_SOURCE },
        { command: COMPAT_TOKEN_COMMAND, source: COMPAT_TOKEN_SOURCE },
      ];

  for (const attempt of attempts) {
    let token;
    try {
      token = execSync(attempt.command, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 20_000,
      })
        .trim()
        .split(/\r?\n/)[0]
        ?.trim();
    } catch {
      continue;
    }

    if (token) return { token, source: attempt.source };
  }

  const sources = attempts.map((attempt) => attempt.source).join(", ");
  throw new Error(`Unable to resolve Google Search Console access token from ${sources}`);
}

function authHeaders(token, quotaProject) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (quotaProject) headers["X-Goog-User-Project"] = quotaProject;
  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function postSearchAnalytics(endpoint, request, token, quotaProject) {
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: authHeaders(token, quotaProject),
    body: JSON.stringify(request),
  });
  const text = await response.text();
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Google Search Console returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }

  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Google Search Console returned invalid JSON: ${text.slice(0, 1000)}`);
  }
}

function resolveOutputFile(outputPath) {
  return path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
}

function writeReport(outputPath, report) {
  const file = resolveOutputFile(outputPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

function parseArgs(argv) {
  const defaultRange = getDefaultWeeklyDateRange();
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    siteUrl: process.env.GSC_SITE_URL || DEFAULT_SITE_URL,
    sitemapUrl: process.env.GSC_SITEMAP_URL || DEFAULT_SITEMAP_URL,
    startDate: process.env.GSC_WEEKLY_START_DATE || defaultRange.startDate,
    endDate: process.env.GSC_WEEKLY_END_DATE || defaultRange.endDate,
    rowLimit: process.env.GSC_WEEKLY_ROW_LIMIT || DEFAULT_ROW_LIMIT,
    outputPath: process.env.GSC_WEEKLY_REPORT_OUTPUT || DEFAULT_OUTPUT_PATH,
    apiBase: process.env.GSC_API_BASE || DEFAULT_API_BASE,
    fetch: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--fetch") args.fetch = true;
    else if (arg === "--dry-run") args.fetch = false;
    else if (arg === "--base-url") args.baseUrl = next();
    else if (arg === "--site-url") args.siteUrl = next();
    else if (arg === "--sitemap-url") args.sitemapUrl = next();
    else if (arg === "--start-date") args.startDate = next();
    else if (arg === "--end-date") args.endDate = next();
    else if (arg === "--row-limit") args.rowLimit = next();
    else if (arg === "--output") args.outputPath = next();
    else if (arg === "--api-base") args.apiBase = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = buildWeeklyReportPlan({
    baseUrl: args.baseUrl,
    siteUrl: args.siteUrl,
    sitemapUrl: args.sitemapUrl,
    startDate: args.startDate,
    endDate: args.endDate,
    rowLimit: args.rowLimit,
    outputPath: args.outputPath,
    apiBase: args.apiBase,
  });

  console.log("Google Search Console weekly traffic report plan");
  console.log(JSON.stringify(plan, null, 2));

  if (!args.fetch) {
    console.log("Mode: dry-run");
    return 0;
  }

  const { token, source } = resolveAccessToken();
  const quotaProject = resolveQuotaProject();
  console.log(`Token source: ${source}`);
  if (quotaProject) console.log(`Quota project: ${quotaProject}`);

  const [queryResponse, pageResponse] = await Promise.all([
    postSearchAnalytics(plan.searchAnalyticsEndpoint, plan.requests.queries, token, quotaProject),
    postSearchAnalytics(plan.searchAnalyticsEndpoint, plan.requests.pages, token, quotaProject),
  ]);

  const report = buildWeeklyTrafficReport({
    plan,
    queryRows: normalizeSearchAnalyticsRows(queryResponse, "query"),
    pageRows: normalizeSearchAnalyticsRows(pageResponse, "page"),
  });
  const file = writeReport(plan.outputPath, report);
  console.log(`Wrote weekly GSC traffic report: ${file}`);
  console.log(JSON.stringify(report, null, 2));
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
