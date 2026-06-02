#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));

const DEFAULT_INPUT_PATH = "reports/gsc-weekly-traffic.json";
const DEFAULT_OUTPUT_PATH = "reports/monetization-readiness.json";
const BLOCKED_BASE_REASONS = [
  "Checkout remains disabled.",
  "Ad slots remain disabled.",
  "Affiliate placeholders and repair-lead/sponsor items remain backlog-only or placeholder-only.",
];

function resolveRepoPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeBaseUrl() {
  return String(corpus.site.baseUrl || "").replace(/\/+$/, "");
}

function normalizePageRow(row) {
  return {
    page: String(row.page || ""),
    clicks: numberOrZero(row.clicks),
    impressions: numberOrZero(row.impressions),
    ctr: numberOrZero(row.ctr),
    position: numberOrZero(row.position),
  };
}

export function classifyPageForMonetization(pageUrl) {
  let parsed;
  try {
    parsed = new URL(String(pageUrl || ""));
  } catch {
    return null;
  }

  const base = new URL(normalizeBaseUrl());
  if (parsed.protocol !== base.protocol || parsed.host !== base.host) return null;

  const pathName = parsed.pathname;
  if (pathName === "/") return "home-inline-1";

  const segments = pathName.replace(/^\/+|\/+$/g, "").split("/");
  if (segments.length === 2 && segments[0] === "codes" && segments[1]) return "code-detail-bottom";
  if (segments.length === 2 && segments[0] === "symptoms" && segments[1]) return "symptom-guide-bottom";
  return null;
}

function pathForPinnedPage(pageUrl) {
  const parsed = new URL(pageUrl);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function emptySlot(slot) {
  return {
    slot: slot.id,
    requiredImpressions: slot.minimumImpressions,
    candidateCount: 0,
    readyPageCount: 0,
    totalImpressions: 0,
    ready: false,
    pages: [],
  };
}

function buildSlots(pageRows) {
  const slots = new Map(corpus.monetization.disabledAdSlots.map((slot) => [slot.id, emptySlot(slot)]));
  let ignoredPages = 0;

  for (const row of pageRows.map(normalizePageRow)) {
    const slotId = classifyPageForMonetization(row.page);
    if (!slotId || !slots.has(slotId)) {
      ignoredPages += 1;
      continue;
    }

    const slot = slots.get(slotId);
    const page = {
      page: row.page,
      path: pathForPinnedPage(row.page),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      ready: row.impressions >= slot.requiredImpressions,
    };
    slot.pages.push(page);
    slot.candidateCount += 1;
    slot.totalImpressions += page.impressions;
    if (page.ready) slot.readyPageCount += 1;
  }

  const orderedSlots = Array.from(slots.values()).map((slot) => ({
    ...slot,
    ready: slot.readyPageCount > 0,
    pages: slot.pages.sort((left, right) => right.impressions - left.impressions || left.page.localeCompare(right.page)),
  }));

  return { slots: orderedSlots, ignoredPages };
}

function buildRecommendation({ dataAvailable, readyPages }) {
  if (!dataAvailable) return "keep-disabled-until-gsc-page-impressions-exist";
  if (readyPages > 0) return "manual-review-ready-pages-keep-disabled";
  return "keep-disabled-thresholds-not-met";
}

function buildBlockedLaunchReasons({ dataAvailable, readyPages }) {
  const reasons = [...BLOCKED_BASE_REASONS];
  if (!dataAvailable) reasons.push("No GSC page impressions exist in the source artifact yet.");
  else if (readyPages === 0) reasons.push("No page has reached its disabled-slot impression threshold yet.");
  else reasons.push("Ready pages require manual review before any monetization is enabled.");
  return reasons;
}

export function buildMonetizationReadinessReport({
  weeklyTrafficArtifact,
  generatedAt = new Date().toISOString(),
  sourceArtifact = DEFAULT_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  if (!weeklyTrafficArtifact || typeof weeklyTrafficArtifact !== "object") {
    throw new Error("weeklyTrafficArtifact is required");
  }

  const pageRows = Array.isArray(weeklyTrafficArtifact.topPages) ? weeklyTrafficArtifact.topPages : [];
  const { slots, ignoredPages } = buildSlots(pageRows);
  const analyzedPages = slots.reduce((total, slot) => total + slot.candidateCount, 0);
  const readyPages = slots.reduce((total, slot) => total + slot.readyPageCount, 0);
  const totalImpressions = slots.reduce((total, slot) => total + slot.totalImpressions, 0);
  const dataAvailable = Boolean(weeklyTrafficArtifact.dataAvailable && pageRows.length > 0);

  return {
    generatedAt,
    source: "gsc-impression-monetization-readiness",
    sourceArtifact,
    outputPath,
    siteUrl: corpus.site.baseUrl,
    dateRange: weeklyTrafficArtifact.dateRange ?? null,
    freeSite: true,
    checkoutEnabled: false,
    adSlotsEnabled: false,
    monetizationStatus: corpus.monetization.status,
    recommendation: buildRecommendation({ dataAvailable, readyPages }),
    dataAvailable,
    summary: {
      analyzedPages,
      ignoredPages,
      totalImpressions,
      readyPages,
    },
    blockedLaunchReasons: buildBlockedLaunchReasons({ dataAvailable, readyPages }),
    affiliatePlaceholders: corpus.monetization.affiliatePlaceholders,
    slots,
  };
}

function readWeeklyTrafficArtifact(inputPath) {
  const file = resolveRepoPath(inputPath);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing GSC weekly traffic artifact: ${inputPath}. Run npm run traffic:gsc:weekly first.`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeReport(outputPath, report) {
  const file = resolveRepoPath(outputPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

function parseArgs(argv) {
  const args = {
    inputPath: process.env.MONETIZATION_GSC_REPORT || DEFAULT_INPUT_PATH,
    outputPath: process.env.MONETIZATION_READINESS_OUTPUT || DEFAULT_OUTPUT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--input") args.inputPath = next();
    else if (arg === "--output") args.outputPath = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const weeklyTrafficArtifact = readWeeklyTrafficArtifact(args.inputPath);
  const report = buildMonetizationReadinessReport({
    weeklyTrafficArtifact,
    sourceArtifact: args.inputPath,
    outputPath: args.outputPath,
  });
  const file = writeReport(args.outputPath, report);
  console.log(`Wrote monetization readiness report: ${file}`);
  console.log(JSON.stringify(report, null, 2));
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
