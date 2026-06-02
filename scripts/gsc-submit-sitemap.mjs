#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_API_BASE = "https://www.googleapis.com/webmasters/v3";
const DEFAULT_BASE_URL = corpus.site.baseUrl;
const DEFAULT_SITE_URL = `${DEFAULT_BASE_URL.replace(/\/$/, "")}/`;
const DEFAULT_SITEMAP_URL = `${DEFAULT_BASE_URL.replace(/\/$/, "")}/sitemap.xml`;
const DEFAULT_SITEMAP_FILE = path.join(root, "dist", "sitemap.xml");
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";
const DEFAULT_TOKEN_COMMAND = `gcloud auth application-default print-access-token --scopes=${WEBMASTERS_SCOPE}`;
const DEFAULT_TOKEN_SOURCE = "default gcloud ADC webmasters token command";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const ADC_CREDENTIALS = path.join(process.env.HOME ?? "", ".config", "gcloud", "application_default_credentials.json");

export function normalizeBaseUrl(value = DEFAULT_BASE_URL) {
  const trimmed = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_BASE_URL;
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`base URL must include http(s) scheme and host: ${value}`);
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "")}`;
}

function hostForBaseUrl(baseUrl) {
  return new URL(normalizeBaseUrl(baseUrl)).host;
}

function normalizeUrlPrefixSiteUrl(value, normalizedBaseUrl) {
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

export function parseSitemapUrls(xmlText) {
  const urls = [];
  const seen = new Set();
  for (const match of String(xmlText).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
    const url = match[1].trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function validateUrlsForHost(urls, host) {
  for (const url of urls) {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.host !== host) {
      throw new Error(`sitemap URL is not on ${host}: ${url}`);
    }
  }
}

export function buildSiteAddEndpoint(siteUrl, apiBase = DEFAULT_API_BASE) {
  return `${apiBase.replace(/\/+$/, "")}/sites/${encodeURIComponent(siteUrl)}`;
}

export function buildSitemapSubmitEndpoint(siteUrl, sitemapUrl, apiBase = DEFAULT_API_BASE) {
  return `${buildSiteAddEndpoint(siteUrl, apiBase)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
}

export function buildSubmissionPlan({
  sitemapUrls,
  baseUrl = DEFAULT_BASE_URL,
  siteUrl,
  sitemapUrl,
  apiBase = DEFAULT_API_BASE,
}) {
  if (!Array.isArray(sitemapUrls) || sitemapUrls.length === 0) {
    throw new Error("sitemap must contain at least one URL");
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const host = hostForBaseUrl(normalizedBaseUrl);
  validateUrlsForHost(sitemapUrls, host);

  const resolvedSiteUrl = normalizeUrlPrefixSiteUrl(siteUrl || normalizedBaseUrl, normalizedBaseUrl);
  const resolvedSitemapUrl = String(sitemapUrl || `${normalizedBaseUrl}/sitemap.xml`).trim();
  const parsedSitemap = new URL(resolvedSitemapUrl);
  if (!["http:", "https:"].includes(parsedSitemap.protocol) || parsedSitemap.host !== host) {
    throw new Error(`sitemap URL is not on ${host}: ${resolvedSitemapUrl}`);
  }

  return {
    siteUrl: resolvedSiteUrl,
    sitemapUrl: resolvedSitemapUrl,
    urlCount: sitemapUrls.length,
    siteAddEndpoint: buildSiteAddEndpoint(resolvedSiteUrl, apiBase),
    sitemapSubmitEndpoint: buildSitemapSubmitEndpoint(resolvedSiteUrl, resolvedSitemapUrl, apiBase),
  };
}

function readSitemapUrls(sitemapFile) {
  return parseSitemapUrls(fs.readFileSync(sitemapFile, "utf8"));
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

  const command = (process.env.GSC_ACCESS_TOKEN_COMMAND || DEFAULT_TOKEN_COMMAND).trim();
  const source = process.env.GSC_ACCESS_TOKEN_COMMAND ? "GSC_ACCESS_TOKEN_COMMAND" : DEFAULT_TOKEN_SOURCE;
  let token;
  try {
    token = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20_000,
    })
      .trim()
      .split(/\r?\n/)[0]
      ?.trim();
  } catch {
    throw new Error(`Unable to resolve Google Search Console access token from ${source}`);
  }

  if (!token) throw new Error(`Access token source returned no token: ${source}`);
  return { token, source };
}

function authHeaders(token, quotaProject) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (quotaProject) headers["X-Goog-User-Project"] = quotaProject;
  return headers;
}

async function putEndpoint(endpoint, token, quotaProject) {
  const response = await fetchWithTimeout(endpoint, {
    method: "PUT",
    headers: authHeaders(token, quotaProject),
  });
  const text = await response.text();
  if (response.status >= 200 && response.status < 300) return response.status;
  throw new Error(`Google Search Console returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
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

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    siteUrl: process.env.GSC_SITE_URL || corpus.site.searchConsoleSiteUrl || "",
    sitemapUrl: process.env.GSC_SITEMAP_URL || DEFAULT_SITEMAP_URL,
    sitemapFile: DEFAULT_SITEMAP_FILE,
    apiBase: process.env.GSC_API_BASE || DEFAULT_API_BASE,
    submit: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--submit") args.submit = true;
    else if (arg === "--dry-run") args.submit = false;
    else if (arg === "--base-url") args.baseUrl = next();
    else if (arg === "--site-url") args.siteUrl = next();
    else if (arg === "--sitemap-url") args.sitemapUrl = next();
    else if (arg === "--sitemap-file") args.sitemapFile = next();
    else if (arg === "--api-base") args.apiBase = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const sitemapUrls = readSitemapUrls(args.sitemapFile);
  const plan = buildSubmissionPlan({
    sitemapUrls,
    baseUrl: args.baseUrl,
    siteUrl: args.siteUrl || undefined,
    sitemapUrl: args.sitemapUrl,
    apiBase: args.apiBase,
  });

  console.log("Google Search Console sitemap submission plan");
  console.log(JSON.stringify(plan, null, 2));

  if (!args.submit) {
    console.log("Mode: dry-run");
    return 0;
  }

  const { token, source } = resolveAccessToken();
  const quotaProject = resolveQuotaProject();
  console.log(`Token source: ${source}`);
  if (quotaProject) console.log(`Quota project: ${quotaProject}`);

  const siteStatus = await putEndpoint(plan.siteAddEndpoint, token, quotaProject);
  console.log(`Search Console site add -> HTTP ${siteStatus}`);
  const sitemapStatus = await putEndpoint(plan.sitemapSubmitEndpoint, token, quotaProject);
  console.log(`Search Console sitemap submit -> HTTP ${sitemapStatus}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
