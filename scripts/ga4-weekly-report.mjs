#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ANALYTICS_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DEFAULT_OUTPUT_PATH = "reports/ga4-weekly-traffic.json";
const DEFAULT_ROW_LIMIT = 25;
const DAY_MS = 86_400_000;
const DEFAULT_DATE_TIME_ZONE = "America/Los_Angeles";
const DEFAULT_DATA_DELAY_DAYS = 1;
const DEFAULT_KEY_PATH = path.join(
  process.env.HOME ?? "",
  ".config",
  "google",
  "rv-appliance-code-atlas-ga4.json",
);
const FALLBACK_KEY_PATHS = [
  DEFAULT_KEY_PATH,
  path.join(process.env.HOME ?? "", ".config", "google", "honey-explorer-analytics.json"),
  path.join(process.env.HOME ?? "", "claude-workspace", "coffee-explorer", "scripts", "ga4-credentials.json"),
];
const DEFAULT_METRICS = ["sessions", "activeUsers", "screenPageViews", "engagedSessions"];

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

export function getDefaultGa4WeeklyDateRange(now = new Date()) {
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

function normalizePropertyId(value = corpus.site.analytics?.propertyId) {
  const raw = String(value || "").trim().replace(/^properties\//, "");
  if (!/^\d+$/.test(raw)) {
    throw new Error(`GA4 property ID must be numeric: ${value}`);
  }
  return raw;
}

function normalizeRowLimit(value = DEFAULT_ROW_LIMIT) {
  const rowLimit = Number(value);
  if (!Number.isInteger(rowLimit) || rowLimit < 1 || rowLimit > 250_000) {
    throw new Error(`row limit must be an integer from 1 to 250000: ${value}`);
  }
  return rowLimit;
}

function normalizeKeyPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(root, raw);
}

function resolveOutputFile(outputPath) {
  const raw = String(outputPath || DEFAULT_OUTPUT_PATH).trim() || DEFAULT_OUTPUT_PATH;
  const file = path.isAbsolute(raw) ? raw : path.join(root, raw);
  const reportsDir = path.join(root, "reports");
  const relativeToReports = path.relative(reportsDir, file);
  if (relativeToReports === "" || relativeToReports.startsWith("..") || path.isAbsolute(relativeToReports)) {
    throw new Error(`GA4 report output must be a file under reports/: ${outputPath}`);
  }
  return file;
}

function normalizeOutputPath(value = DEFAULT_OUTPUT_PATH) {
  const file = resolveOutputFile(value);
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveKeyPath(explicitPath) {
  const envPath = normalizeKeyPath(process.env.GA4_SERVICE_ACCOUNT_JSON);
  const requestedPath = normalizeKeyPath(explicitPath);
  const candidates = requestedPath ? [requestedPath] : envPath ? [envPath] : FALLBACK_KEY_PATHS;
  const found = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (found) return found;
  throw new Error(`Unable to find a GA4 service-account JSON file. Checked: ${candidates.join(", ")}`);
}

export function buildRunReportRequest({ startDate, endDate, dimension, rowLimit }) {
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: dimension }],
    metrics: DEFAULT_METRICS.map((name) => ({ name })),
    limit: String(rowLimit),
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  };
}

export function buildGa4WeeklyReportPlan({
  propertyId = corpus.site.analytics?.propertyId,
  measurementId = corpus.site.analytics?.measurementId,
  startDate,
  endDate,
  rowLimit = DEFAULT_ROW_LIMIT,
  outputPath = DEFAULT_OUTPUT_PATH,
  apiBase = DEFAULT_API_BASE,
  serviceAccountKeyPath,
} = {}) {
  const defaultRange = getDefaultGa4WeeklyDateRange();
  const resolvedStartDate = startDate || defaultRange.startDate;
  const resolvedEndDate = endDate || defaultRange.endDate;
  const days = countInclusiveDays(resolvedStartDate, resolvedEndDate);
  const resolvedRowLimit = normalizeRowLimit(rowLimit);
  const resolvedPropertyId = normalizePropertyId(propertyId);
  const property = `properties/${resolvedPropertyId}`;
  const runReportEndpoint = `${apiBase.replace(/\/+$/, "")}/${property}:runReport`;

  return {
    property,
    propertyId: resolvedPropertyId,
    measurementId: measurementId || null,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    days,
    rowLimit: resolvedRowLimit,
    outputPath: normalizeOutputPath(outputPath),
    serviceAccountKeyPath: normalizeKeyPath(serviceAccountKeyPath) || process.env.GA4_SERVICE_ACCOUNT_JSON || DEFAULT_KEY_PATH,
    runReportEndpoint,
    requests: {
      channels: buildRunReportRequest({
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        dimension: "sessionDefaultChannelGroup",
        rowLimit: resolvedRowLimit,
      }),
      pages: buildRunReportRequest({
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        dimension: "pagePathPlusQueryString",
        rowLimit: resolvedRowLimit,
      }),
    },
  };
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeGa4Rows(response, keyName) {
  const rows = Array.isArray(response?.rows) ? response.rows : [];
  return rows.map((row) => {
    const key = Array.isArray(row.dimensionValues) && row.dimensionValues[0]?.value ? String(row.dimensionValues[0].value) : "(not set)";
    const metrics = Array.isArray(row.metricValues) ? row.metricValues : [];
    return {
      [keyName]: key,
      sessions: numberOrZero(metrics[0]?.value),
      activeUsers: numberOrZero(metrics[1]?.value),
      screenPageViews: numberOrZero(metrics[2]?.value),
      engagedSessions: numberOrZero(metrics[3]?.value),
    };
  });
}

export function summarizeGa4Rows(rows) {
  return rows.reduce(
    (summary, row) => ({
      rowCount: summary.rowCount + 1,
      sessions: summary.sessions + numberOrZero(row.sessions),
      activeUsers: summary.activeUsers + numberOrZero(row.activeUsers),
      screenPageViews: summary.screenPageViews + numberOrZero(row.screenPageViews),
      engagedSessions: summary.engagedSessions + numberOrZero(row.engagedSessions),
    }),
    { rowCount: 0, sessions: 0, activeUsers: 0, screenPageViews: 0, engagedSessions: 0 },
  );
}

export function buildGa4TrafficReport({
  plan,
  channelRows,
  pageRows,
  serviceAccountEmail = null,
  generatedAt = new Date().toISOString(),
}) {
  return {
    generatedAt,
    source: "google-analytics-data-api-runReport",
    property: plan.property,
    measurementId: plan.measurementId,
    serviceAccountEmail,
    dateRange: {
      startDate: plan.startDate,
      endDate: plan.endDate,
      days: plan.days,
    },
    rowLimit: plan.rowLimit,
    dataAvailable: channelRows.length > 0 || pageRows.length > 0,
    summary: {
      channels: summarizeGa4Rows(channelRows),
      pages: summarizeGa4Rows(pageRows),
    },
    topChannels: channelRows,
    topPages: pageRows,
  };
}

function readServiceAccountCredentials(keyPath) {
  const credentials = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) {
    throw new Error(`GA4 credentials must be a service-account JSON file: ${keyPath}`);
  }
  return credentials;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(credentials, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: ANALYTICS_READONLY_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key);
  return `${unsigned}.${base64Url(signature)}`;
}

async function requestAccessToken(credentials) {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: createJwt(credentials),
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await response.text();
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Google OAuth token request returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }
  const data = JSON.parse(text);
  if (!data.access_token) throw new Error("Google OAuth token response did not include access_token");
  return data.access_token;
}

async function postRunReport(endpoint, request, accessToken) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  const text = await response.text();
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`GA4 Data API returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }
  return text.trim() ? JSON.parse(text) : {};
}

function writeReport(outputPath, report) {
  const file = resolveOutputFile(outputPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

function parseArgs(argv) {
  const defaultRange = getDefaultGa4WeeklyDateRange();
  const args = {
    propertyId: process.env.GA4_PROPERTY_ID || corpus.site.analytics?.propertyId,
    measurementId: corpus.site.analytics?.measurementId,
    startDate: process.env.GA4_WEEKLY_START_DATE || defaultRange.startDate,
    endDate: process.env.GA4_WEEKLY_END_DATE || defaultRange.endDate,
    rowLimit: process.env.GA4_WEEKLY_ROW_LIMIT || DEFAULT_ROW_LIMIT,
    outputPath: process.env.GA4_WEEKLY_REPORT_OUTPUT || DEFAULT_OUTPUT_PATH,
    apiBase: process.env.GA4_DATA_API_BASE || DEFAULT_API_BASE,
    serviceAccountKeyPath: process.env.GA4_SERVICE_ACCOUNT_JSON || "",
    fetch: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--fetch") args.fetch = true;
    else if (arg === "--dry-run") args.fetch = false;
    else if (arg === "--property-id") args.propertyId = next();
    else if (arg === "--start-date") args.startDate = next();
    else if (arg === "--end-date") args.endDate = next();
    else if (arg === "--row-limit") args.rowLimit = next();
    else if (arg === "--output") args.outputPath = next();
    else if (arg === "--api-base") args.apiBase = next();
    else if (arg === "--credentials") args.serviceAccountKeyPath = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = buildGa4WeeklyReportPlan(args);

  console.log("GA4 weekly traffic report plan");
  console.log(JSON.stringify(plan, null, 2));

  if (!args.fetch) {
    console.log("Mode: dry-run");
    return 0;
  }

  const keyPath = resolveKeyPath(args.serviceAccountKeyPath);
  const credentials = readServiceAccountCredentials(keyPath);
  console.log(`Service account: ${credentials.client_email}`);
  const accessToken = await requestAccessToken(credentials);
  const [channelResponse, pageResponse] = await Promise.all([
    postRunReport(plan.runReportEndpoint, plan.requests.channels, accessToken),
    postRunReport(plan.runReportEndpoint, plan.requests.pages, accessToken),
  ]);

  const report = buildGa4TrafficReport({
    plan,
    channelRows: normalizeGa4Rows(channelResponse, "channel"),
    pageRows: normalizeGa4Rows(pageResponse, "page"),
    serviceAccountEmail: credentials.client_email,
  });
  const file = writeReport(plan.outputPath, report);
  console.log(`Wrote weekly GA4 traffic report: ${file}`);
  console.log(JSON.stringify(report, null, 2));
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
