import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const corpus = JSON.parse(fs.readFileSync(path.join(root, "src/data/corpus.json"), "utf8"));
const outputPath = path.join(root, "reports/traffic-readiness.json");
const searchConsole = corpus.site.searchConsole ?? null;
const indexNowConfig = corpus.site.indexNow ?? null;
const analytics = corpus.site.analytics ?? null;
const weeklyTrafficArtifact = {
  path: "reports/gsc-weekly-traffic.json",
  command: "npm run traffic:gsc:weekly",
  dryRunCommand: "npm run traffic:gsc:weekly:dry-run",
  cadence: "weekly",
};
const ga4TrafficArtifact = {
  path: "reports/ga4-weekly-traffic.json",
  command: "npm run traffic:ga4:weekly",
  dryRunCommand: "npm run traffic:ga4:weekly:dry-run",
  cadence: "weekly",
  auth: "service-account-json",
};
const monetizationReadinessArtifact = {
  path: "reports/monetization-readiness.json",
  command: "npm run traffic:monetization",
  source: weeklyTrafficArtifact.path,
};
const nextSourceBackedBatchGoal =
  "Triage post-Coleman official support rows by traffic potential, starting with refrigerator and HVAC symptom-only Dometic, Norcold/Thetford, Furrion/Lippert, Suburban/Airxcel, and Cummins pages; add only owner-safe non-duplicate source wiring or guides and keep service-only rows rejected except model or service-call prep.";
const indexNow = indexNowConfig
  ? {
      keyLocation: indexNowConfig.keyLocation,
      dryRunCommand: "npm run traffic:indexnow:dry-run",
      submitCommand: "npm run traffic:indexnow:submit",
      submittedAt: indexNowConfig.submittedAt,
    }
  : null;

function buildReport() {
  return {
    generatedAt: new Date().toISOString(),
    liveUrl: corpus.site.baseUrl,
    freeSite: true,
    checkoutEnabled: false,
    adSlotsEnabled: false,
    gscConfigured: Boolean(searchConsole?.siteUrl && searchConsole?.sitemapSubmittedAt),
    analyticsConfigured: Boolean(analytics?.measurementId),
    analytics,
    searchConsole,
    weeklyTrafficArtifact,
    ga4TrafficArtifact,
    monetizationReadinessArtifact,
    indexNow,
    verifiedEntries: corpus.entries.length,
    symptomGuides: corpus.symptoms.length,
    sourceCount: corpus.sources.length,
    monetizationReadiness: corpus.monetization.disabledAdSlots.map((slot) => ({
      slot: slot.id,
      requiredImpressions: slot.minimumImpressions,
      currentImpressions: 0,
      ready: false,
    })),
    nextAutomatedBatchGoal: indexNow
      ? nextSourceBackedBatchGoal
      : "Add IndexNow key after domain/live URL is chosen.",
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
