import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("traffic readiness report", () => {
  it("keeps the next automated batch goal aligned with the current corpus backlog", () => {
    const output = execFileSync("node", ["scripts/traffic-report.mjs"], {
      encoding: "utf8",
    });
    const report = JSON.parse(output);

    expect(report.nextAutomatedBatchGoal).toBe(
      "Research the next official Norcold refrigerator support slice, prioritizing manufacturer-hosted owner/service fault display tables for N3000, N2000, N8DCX/N10DCX, N10LX, 2118, and legacy N-series families.",
    );
  });
});
