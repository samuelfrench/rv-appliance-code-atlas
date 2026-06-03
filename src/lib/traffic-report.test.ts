import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const nextAutomatedBatchGoal =
  "Run a fresh official-source gap scan across current supported brands for non-duplicate owner-safe service-prep, model-label, control-behavior, storage, or service-locator guides; add no code entries unless a current manufacturer-hosted display or fault table is verified.";

describe("traffic readiness report", () => {
  it("keeps the next automated batch goal aligned with the current corpus backlog", () => {
    const output = execFileSync("node", ["scripts/traffic-report.mjs"], {
      encoding: "utf8",
    });
    const report = JSON.parse(output);

    expect(report.gscConfigured).toBe(true);
    expect(report.analyticsConfigured).toBe(true);
    expect(report.analytics).toEqual({
      provider: "GA4",
      propertyId: "540096507",
      dataStreamId: "14992447658",
      measurementId: "G-9824RBXHHR",
      defaultUri: "https://rvappliancefaultcodes.com",
      configuredAt: "2026-06-02T23:04:00Z",
    });
    expect(report.searchConsole).toEqual({
      propertyType: "URL_PREFIX",
      siteUrl: "https://rvappliancefaultcodes.com/",
      sitemapUrl: "https://rvappliancefaultcodes.com/sitemap.xml",
      verifiedAt: "2026-06-02T23:11:41Z",
      sitemapSubmittedAt: "2026-06-02T23:19:52Z",
    });
    expect(report.weeklyTrafficArtifact).toEqual({
      path: "reports/gsc-weekly-traffic.json",
      command: "npm run traffic:gsc:weekly",
      dryRunCommand: "npm run traffic:gsc:weekly:dry-run",
      cadence: "weekly",
    });
    expect(report.ga4TrafficArtifact).toEqual({
      path: "reports/ga4-weekly-traffic.json",
      command: "npm run traffic:ga4:weekly",
      dryRunCommand: "npm run traffic:ga4:weekly:dry-run",
      cadence: "weekly",
      auth: "service-account-json",
    });
    expect(report.monetizationReadinessArtifact).toEqual({
      path: "reports/monetization-readiness.json",
      command: "npm run traffic:monetization",
      source: "reports/gsc-weekly-traffic.json",
    });
    expect(report.indexNow).toEqual({
      keyLocation: "https://rvappliancefaultcodes.com/2653afc6f17313e900711f1d3eb1dcabad06e943193bf141716fcd4013f65f18.txt",
      dryRunCommand: "npm run traffic:indexnow:dry-run",
      submitCommand: "npm run traffic:indexnow:submit",
      submittedAt: "2026-06-03T10:55:21.901Z",
    });
    expect(report.nextAutomatedBatchGoal).toBe(nextAutomatedBatchGoal);

    expect(readFileSync("README.md", "utf8")).toContain(report.weeklyTrafficArtifact.command);
    expect(readFileSync("README.md", "utf8")).toContain(report.ga4TrafficArtifact.command);
    expect(readFileSync("README.md", "utf8")).toContain(report.monetizationReadinessArtifact.command);
    expect(readFileSync("README.md", "utf8")).toContain(report.indexNow.submitCommand);
    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(
      "- [x] Add weekly traffic report artifact once GSC is configured.",
    );
    expect(readFileSync("TODO.md", "utf8")).toContain("- [x] Add IndexNow key after domain/live URL is chosen.");
    expect(readFileSync("TODO.md", "utf8")).toContain(
      "- [x] Add impression-based monetization readiness report after GSC data exists.",
    );
    expect(readFileSync("TODO.md", "utf8")).toContain(
      `- Next automated batch goal: ${report.nextAutomatedBatchGoal}`,
    );
  });
});
