import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpusPath = path.join(root, "src/data/corpus.json");
const reportPath = path.join(root, "reports/source-audit.json");
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
const auditMode = process.argv.includes("--audit");

const unsafeOwnerTerms = [
  /\bbypass\b/i,
  /\bjump(er)?\b/i,
  /\bgas valve\b/i,
  /\bburner\b/i,
  /\bcontrol board\b/i,
  /\b120\s*vac\b/i,
  /\brefrigerant\b/i,
  /\bprobe\b/i,
  /\bopen (the )?(fuel|gas|electrical|rooftop)/i,
];

const sourcesById = new Map(corpus.sources.map((source) => [source.id, source]));
const failures = [];
const dangerousOwnerActions = [];

for (const source of corpus.sources) {
  if (!source.official) failures.push(`Source ${source.id} is not official.`);
  if (!source.url.startsWith("https://")) failures.push(`Source ${source.id} is not https.`);
}

const seenEntrySlugs = new Set();
for (const entry of corpus.entries) {
  if (!entry.sourceIds?.length) failures.push(`Entry ${entry.id} has no sources.`);
  if (!entry.modelFamilies?.length) failures.push(`Entry ${entry.id} has no model families.`);
  if (!entry.ownerSafeActions?.length) failures.push(`Entry ${entry.id} has no owner-safe actions.`);
  if (!entry.serviceOnlyActions?.length) failures.push(`Entry ${entry.id} has no service-only actions.`);
  if (!entry.safetyBoundary || entry.safetyBoundary.length < 24) failures.push(`Entry ${entry.id} lacks safety boundary.`);
  if (!entry.partCaptureHints?.length) failures.push(`Entry ${entry.id} lacks capture hints.`);
  if (seenEntrySlugs.has(entry.slug)) failures.push(`Duplicate entry slug ${entry.slug}.`);
  seenEntrySlugs.add(entry.slug);

  for (const sourceId of entry.sourceIds ?? []) {
    const source = sourcesById.get(sourceId);
    if (!source) failures.push(`Entry ${entry.id} cites missing source ${sourceId}.`);
    if (source && !source.official) failures.push(`Entry ${entry.id} cites non-official source ${sourceId}.`);
  }

  for (const action of entry.ownerSafeActions ?? []) {
    if (unsafeOwnerTerms.some((term) => term.test(action))) dangerousOwnerActions.push(`${entry.id}: ${action}`);
  }
}

for (const symptom of corpus.symptoms) {
  if (!symptom.sourceIds?.length) failures.push(`Symptom ${symptom.id} has no sources.`);
  for (const sourceId of symptom.sourceIds ?? []) {
    const source = sourcesById.get(sourceId);
    if (!source) failures.push(`Symptom ${symptom.id} cites missing source ${sourceId}.`);
    if (source && !source.official) failures.push(`Symptom ${symptom.id} cites non-official source ${sourceId}.`);
  }
}

const requiredBrands = ["Dometic", "Norcold", "Suburban/Atwood", "Coleman-Mach", "Furrion", "Lippert", "Onan"];
for (const brand of requiredBrands) {
  if (!corpus.entries.some((entry) => entry.brand === brand)) failures.push(`Missing required brand ${brand}.`);
}

if (dangerousOwnerActions.length) {
  failures.push(`Unsafe owner actions found: ${dangerousOwnerActions.length}.`);
}

const report = {
  generatedAt: new Date().toISOString(),
  verifiedEntries: corpus.entries.length,
  officialSources: corpus.sources.filter((source) => source.official).length,
  totalSymptoms: corpus.symptoms.length,
  requiredBrandsCovered: requiredBrands.filter((brand) => corpus.entries.some((entry) => entry.brand === brand)),
  failures,
  dangerousOwnerActions,
  sourceUrls: corpus.sources.map((source) => ({ id: source.id, brand: source.brand, url: source.url })),
};

if (auditMode) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
