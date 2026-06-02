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
      "Triage official Cummins Onan generator symptom-only support pages for no-start, cranks/no output, breaker or load shedding, fuel/oil/maintenance, altitude, and service-only generator/electrical/exhaust boundaries; add only non-duplicate owner-safe guides.",
    );

    expect(readFileSync("README.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
    expect(readFileSync("TODO.md", "utf8")).toContain(report.nextAutomatedBatchGoal);
  });
});
