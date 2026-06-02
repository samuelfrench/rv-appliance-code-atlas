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
      "Continue official legacy Dometic refrigerator display-table research, prioritizing RM8/RMS8/RML8/RMSL8 and RMD8 icon/LED status tables plus remaining Americana/RM owner display conditions with explicit owner-safe boundaries.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
  });
});
