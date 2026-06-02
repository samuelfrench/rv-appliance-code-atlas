#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_BASE_URL = corpus.site.baseUrl;
const DEFAULT_SITE_URL = `${corpus.site.baseUrl.replace(/\/$/, "")}/`;
const DEFAULT_VERIFICATION_FILE = "googled22aa40f3a0e4dca.html";
const DEFAULT_INSERT_ENDPOINT = "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE";
const SITE_VERIFICATION_SCOPE = "https://www.googleapis.com/auth/siteverification.verify_only";
const DEFAULT_TOKEN_COMMAND = `gcloud auth application-default print-access-token --scopes=${SITE_VERIFICATION_SCOPE}`;
const DEFAULT_TOKEN_SOURCE = "default gcloud ADC site-verification token command";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const ADC_CREDENTIALS = path.join(process.env.HOME ?? "", ".config", "gcloud", "application_default_credentials.json");

function normalizeBaseUrl(value = DEFAULT_BASE_URL) {
  const trimmed = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_BASE_URL;
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`base URL must include http(s) scheme and host: ${value}`);
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "")}`;
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

export function buildVerificationPlan({
  siteUrl = DEFAULT_SITE_URL,
  baseUrl = DEFAULT_BASE_URL,
  verificationFile = DEFAULT_VERIFICATION_FILE,
  insertEndpoint = DEFAULT_INSERT_ENDPOINT,
}) {
  const resolvedSiteUrl = normalizeUrlPrefixSiteUrl(siteUrl, baseUrl);
  const fileName = path.basename(String(verificationFile).trim());
  if (!/^google[a-z0-9]+\.html$/i.test(fileName)) {
    throw new Error(`verification file must be a google*.html token file: ${verificationFile}`);
  }

  return {
    siteUrl: resolvedSiteUrl,
    method: "FILE",
    verificationFile: fileName,
    verificationFileUrl: `${resolvedSiteUrl}${fileName}`,
    insertEndpoint,
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
  const envToken = (process.env.SITE_VERIFICATION_ACCESS_TOKEN || "").trim();
  if (envToken) return { token: envToken, source: "SITE_VERIFICATION_ACCESS_TOKEN" };

  const command = (process.env.SITE_VERIFICATION_ACCESS_TOKEN_COMMAND || DEFAULT_TOKEN_COMMAND).trim();
  const source = process.env.SITE_VERIFICATION_ACCESS_TOKEN_COMMAND
    ? "SITE_VERIFICATION_ACCESS_TOKEN_COMMAND"
    : DEFAULT_TOKEN_SOURCE;
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
    throw new Error(`Unable to resolve Google Site Verification access token from ${source}`);
  }

  if (!token) throw new Error(`Access token source returned no token: ${source}`);
  return {
    token,
    source,
  };
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

async function verifyPublicFile(plan) {
  const response = await fetchWithTimeout(plan.verificationFileUrl);
  const text = await response.text();
  const expected = `google-site-verification: ${plan.verificationFile}`;
  if (response.status !== 200) {
    throw new Error(`Verification file returned HTTP ${response.status}: ${plan.verificationFileUrl}`);
  }
  if (text.trim() !== expected) {
    throw new Error(`Verification file content did not match ${expected}`);
  }
}

async function insertWebResource(plan, token, quotaProject) {
  const response = await fetchWithTimeout(plan.insertEndpoint, {
    method: "POST",
    headers: authHeaders(token, quotaProject),
    body: JSON.stringify({
      site: {
        type: "SITE",
        identifier: plan.siteUrl,
      },
    }),
  });
  const text = await response.text();
  if (response.status >= 200 && response.status < 300) return { status: response.status, body: text };
  throw new Error(`Google Site Verification returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
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
    siteUrl: process.env.GSC_SITE_URL || DEFAULT_SITE_URL,
    verificationFile: process.env.SITE_VERIFICATION_FILE || DEFAULT_VERIFICATION_FILE,
    verify: false,
    skipLiveFileCheck: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--verify") args.verify = true;
    else if (arg === "--dry-run") args.verify = false;
    else if (arg === "--site-url") args.siteUrl = next();
    else if (arg === "--verification-file") args.verificationFile = next();
    else if (arg === "--skip-live-file-check") args.skipLiveFileCheck = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = buildVerificationPlan({
    siteUrl: args.siteUrl,
    verificationFile: args.verificationFile,
  });

  console.log("Google URL-prefix verification plan");
  console.log(JSON.stringify(plan, null, 2));

  if (!args.verify) {
    console.log("Mode: dry-run");
    return 0;
  }

  if (!args.skipLiveFileCheck) {
    await verifyPublicFile(plan);
    console.log(`Verification file is live: ${plan.verificationFileUrl}`);
  }

  const { token, source } = resolveAccessToken();
  const quotaProject = resolveQuotaProject();
  console.log(`Token source: ${source}`);
  if (quotaProject) console.log(`Quota project: ${quotaProject}`);
  const result = await insertWebResource(plan, token, quotaProject);
  console.log(`Google Site Verification insert -> HTTP ${result.status}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
