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
    expect(report.nextAutomatedBatchGoal).toBe("Add weekly traffic report artifact once GSC is configured.");

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(
      `- Next automated batch goal: ${report.nextAutomatedBatchGoal}`,
    );
  });
});
