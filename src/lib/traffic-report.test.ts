import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("traffic readiness report", () => {
  it("keeps the next automated batch goal aligned with the current corpus backlog", () => {
    const output = execFileSync("node", ["scripts/traffic-report.mjs"], {
      encoding: "utf8",
    });
    const report = JSON.parse(output);

    expect(report.gscConfigured).toBe(true);
    expect(report.searchConsole).toEqual({
      propertyType: "URL_PREFIX",
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      sitemapUrl: "https://rv-appliance-code-atlas.fly.dev/sitemap.xml",
      verifiedAt: "2026-06-02T19:38:59Z",
      sitemapSubmittedAt: "2026-06-02T19:38:59Z",
    });
    expect(report.weeklyTrafficArtifact).toEqual({
      path: "reports/gsc-weekly-traffic.json",
      command: "npm run traffic:gsc:weekly",
      dryRunCommand: "npm run traffic:gsc:weekly:dry-run",
      cadence: "weekly",
    });
    expect(report.monetizationReadinessArtifact).toEqual({
      path: "reports/monetization-readiness.json",
      command: "npm run traffic:monetization",
      source: "reports/gsc-weekly-traffic.json",
    });
    expect(report.indexNow).toEqual({
      keyLocation: "https://rv-appliance-code-atlas.fly.dev/2653afc6f17313e900711f1d3eb1dcabad06e943193bf141716fcd4013f65f18.txt",
      dryRunCommand: "npm run traffic:indexnow:dry-run",
      submitCommand: "npm run traffic:indexnow:submit",
      submittedAt: "2026-06-02T21:21:29.395Z",
    });
    expect(report.nextAutomatedBatchGoal).toBe(
      "Run weekly GSC report and review monetization readiness after page impressions appear.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.weeklyTrafficArtifact.command);
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
