import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("traffic readiness report", () => {
  it("keeps the next automated batch goal aligned with the current corpus backlog", () => {
    const output = execFileSync("node", ["scripts/traffic-report.mjs"], {
      encoding: "utf8",
    });
    const report = JSON.parse(output);

    expect(report.nextAutomatedBatchGoal).toBe(
      "Add remaining official Dometic RM10 refrigerator support-page fault aliases from sitemap-verified Fault pages while preserving manual-backed RM10/RMD/RML rows.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
  });
});
