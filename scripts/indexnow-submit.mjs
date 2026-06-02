#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_API_BASE = "https://api.indexnow.org";
const DEFAULT_BASE_URL = corpus.site.baseUrl;
const DEFAULT_REPORT_FILE = path.join(root, "dist", "indexnow-report.json");
const DEFAULT_OUTPUT_PATH = "reports/indexnow-submit-report.json";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const MAX_URLS_PER_REQUEST = 10_000;
const ACCEPTED_STATUS_CODES = [200, 202];

export const INDEXNOW_KEY = corpus.site.indexNow?.key ?? "";

function normalizeBaseUrl(value = DEFAULT_BASE_URL) {
  const raw = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`base URL must include http(s) scheme and host: ${value}`);
  }

  const normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "")}`;
  const pinned = DEFAULT_BASE_URL.replace(/\/+$/, "");
  if (normalized !== pinned) {
    throw new Error(`base URL is pinned to ${pinned}: ${value}`);
  }

  return normalized;
}

function normalizeIndexNowKey(value) {
  const key = String(value || "").trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error("IndexNow key must be 8 to 128 letters, numbers, or dashes.");
  }
  return key;
}

export function parseIndexNowReportUrls(report) {
  if (!report || !Array.isArray(report.urls)) {
    throw new Error("IndexNow report must contain a urls array.");
  }

  const urls = [];
  const seen = new Set();
  for (const rawUrl of report.urls) {
    const url = String(rawUrl || "").trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function validateUrlsForSite(urls, base) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("IndexNow report must contain at least one URL.");
  }
  if (urls.length > MAX_URLS_PER_REQUEST) {
    throw new Error("IndexNow batches support at most 10,000 URLs.");
  }

  for (const url of urls) {
    const parsed = new URL(url);
    if (parsed.protocol !== base.protocol || parsed.host !== base.host) {
      throw new Error(`IndexNow URL is not on ${base.host}: ${url}`);
    }
  }
}

function normalizeKeyLocation(value, base, key) {
  const raw = String(value || `${base.origin}/${key}.txt`).trim();
  const parsed = new URL(raw);
  if (parsed.protocol !== base.protocol) {
    throw new Error(`IndexNow keyLocation must use ${base.protocol}: ${raw}`);
  }
  if (parsed.host !== base.host) {
    throw new Error(`IndexNow keyLocation is not on ${base.host}: ${raw}`);
  }
  if (!parsed.pathname.endsWith(`/${key}.txt`)) {
    throw new Error(`IndexNow keyLocation must point to ${key}.txt: ${raw}`);
  }
  return parsed.href;
}

export function buildIndexNowPlan({
  reportUrls,
  baseUrl = DEFAULT_BASE_URL,
  key = INDEXNOW_KEY,
  keyLocation,
  apiBase = DEFAULT_API_BASE,
}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const base = new URL(normalizedBaseUrl);
  const normalizedKey = normalizeIndexNowKey(key);
  validateUrlsForSite(reportUrls, base);

  const resolvedKeyLocation = normalizeKeyLocation(keyLocation, base, normalizedKey);
  const endpoint = `${String(apiBase || DEFAULT_API_BASE).replace(/\/+$/, "")}/indexnow`;
  const payload = {
    host: base.host,
    key: normalizedKey,
    keyLocation: resolvedKeyLocation,
    urlList: reportUrls,
  };

  return {
    endpoint,
    host: base.host,
    keyLocation: resolvedKeyLocation,
    urlCount: reportUrls.length,
    payload,
  };
}

export function buildIndexNowReport({ plan, generatedAt = new Date().toISOString(), mode, responseStatus = null }) {
  return {
    generatedAt,
    mode,
    endpoint: plan.endpoint,
    host: plan.host,
    keyLocation: plan.keyLocation,
    urlCount: plan.urlCount,
    submitted: mode === "submit" && ACCEPTED_STATUS_CODES.includes(responseStatus),
    responseStatus,
    acceptedStatusCodes: ACCEPTED_STATUS_CODES,
  };
}

export function buildPrintableIndexNowPlan(plan) {
  return {
    endpoint: plan.endpoint,
    host: plan.host,
    keyLocation: plan.keyLocation,
    urlCount: plan.urlCount,
    sampleUrls: plan.payload.urlList.slice(0, 3),
    omittedUrlCount: Math.max(0, plan.urlCount - 3),
    acceptedStatusCodes: ACCEPTED_STATUS_CODES,
  };
}

function readGeneratedReport(reportFile) {
  return JSON.parse(fs.readFileSync(reportFile, "utf8"));
}

function writeLocalReport(outputPath, report) {
  const fullPath = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(report, null, 2)}\n`);
  return fullPath;
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

async function postIndexNow(plan) {
  const response = await fetchWithTimeout(plan.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(plan.payload),
  });
  const text = await response.text();
  if (ACCEPTED_STATUS_CODES.includes(response.status)) return response.status;
  throw new Error(`IndexNow returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
}

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    reportFile: DEFAULT_REPORT_FILE,
    key: process.env.INDEXNOW_KEY || INDEXNOW_KEY,
    keyLocation: process.env.INDEXNOW_KEY_LOCATION || corpus.site.indexNow?.keyLocation || "",
    apiBase: process.env.INDEXNOW_API_BASE || DEFAULT_API_BASE,
    outputPath: DEFAULT_OUTPUT_PATH,
    submit: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--submit") args.submit = true;
    else if (arg === "--dry-run") args.submit = false;
    else if (arg === "--base-url") args.baseUrl = next();
    else if (arg === "--report-file") args.reportFile = next();
    else if (arg === "--key") args.key = next();
    else if (arg === "--key-location") args.keyLocation = next();
    else if (arg === "--api-base") args.apiBase = next();
    else if (arg === "--output") args.outputPath = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const generatedReport = readGeneratedReport(args.reportFile);
  const reportUrls = parseIndexNowReportUrls(generatedReport);
  const plan = buildIndexNowPlan({
    reportUrls,
    baseUrl: args.baseUrl,
    key: args.key,
    keyLocation: args.keyLocation || undefined,
    apiBase: args.apiBase,
  });

  console.log("IndexNow submission plan");
  console.log(JSON.stringify(buildPrintableIndexNowPlan(plan), null, 2));

  const mode = args.submit ? "submit" : "dry-run";
  let responseStatus = null;
  if (args.submit) {
    responseStatus = await postIndexNow(plan);
    console.log(`IndexNow submit -> HTTP ${responseStatus}`);
  } else {
    console.log("Mode: dry-run");
  }

  const localReport = buildIndexNowReport({ plan, mode, responseStatus });
  const writtenPath = writeLocalReport(args.outputPath, localReport);
  console.log(`Wrote IndexNow report: ${writtenPath}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
