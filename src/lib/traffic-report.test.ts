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
      "Research the next official legacy Norcold N-series refrigerator slice, prioritizing manufacturer-hosted owner-manual fault tables for N41/N51, N61/N81, N62/N64/N82/N84, N1095, and older no-co/n lockout families.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
  });
});
