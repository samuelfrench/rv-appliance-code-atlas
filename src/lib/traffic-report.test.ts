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
      "Continue official Dometic refrigerator support-page gap research for remaining RM8/RM10/RUA/RUC/RMD support aliases not already covered by manuals, with duplicate filtering and owner-safe boundaries.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
  });
});
