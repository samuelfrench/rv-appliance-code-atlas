import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const outputPath = path.join(root, "reports/traffic-readiness.json");

function buildReport() {
  return {
    generatedAt: new Date().toISOString(),
    liveUrl: corpus.site.baseUrl,
    freeSite: true,
    checkoutEnabled: false,
    adSlotsEnabled: false,
    gscConfigured: Boolean(process.env.GSC_SITE_URL && process.env.GOOGLE_APPLICATION_CREDENTIALS),
    verifiedEntries: corpus.entries.length,
    symptomGuides: corpus.symptoms.length,
    sourceCount: corpus.sources.length,
    monetizationReadiness: corpus.monetization.disabledAdSlots.map((slot) => ({
      slot: slot.id,
      requiredImpressions: slot.minimumImpressions,
      currentImpressions: 0,
      ready: false,
    })),
    nextAutomatedBatchGoal:
      "Add remaining official water-heater symptom guides from Dometic XT, Suburban, and Furrion sources, and continue manufacturer-hosted table discovery without adding code entries unless an official fault/display table is verified.",
    monitorCommand: "npm run traffic:monitor",
  };
}

function emit() {
  const report = buildReport();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

emit();

if (process.argv.includes("--watch")) {
  setInterval(emit, 60_000);
}
