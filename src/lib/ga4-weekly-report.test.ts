import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildGa4TrafficReport,
  buildGa4WeeklyReportPlan,
  getDefaultGa4WeeklyDateRange,
  normalizeGa4Rows,
} from "../../scripts/ga4-weekly-report.mjs";

const projectRoot = path.dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));

describe("GA4 weekly traffic report", () => {
  it("uses the last seven Pacific-time days ending yesterday by default", () => {
    expect(getDefaultGa4WeeklyDateRange(new Date("2026-06-03T18:00:00Z"))).toEqual({
      startDate: "2026-05-27",
      endDate: "2026-06-02",
      days: 7,
      timeZone: "America/Los_Angeles",
      dataDelayDays: 1,
    });
  });

  it("builds pinned GA4 Data API requests for channels and pages", () => {
    const plan = buildGa4WeeklyReportPlan({
      propertyId: "properties/540096507",
      measurementId: "G-9824RBXHHR",
      startDate: "2026-05-27",
      endDate: "2026-06-02",
      rowLimit: 10,
      serviceAccountKeyPath: "/home/sam/.config/google/rv-appliance-code-atlas-ga4.json",
    });

    expect(plan).toMatchObject({
      property: "properties/540096507",
      propertyId: "540096507",
      measurementId: "G-9824RBXHHR",
      startDate: "2026-05-27",
      endDate: "2026-06-02",
      days: 7,
      rowLimit: 10,
      outputPath: "reports/ga4-weekly-traffic.json",
      serviceAccountKeyPath: "/home/sam/.config/google/rv-appliance-code-atlas-ga4.json",
      runReportEndpoint: "https://analyticsdata.googleapis.com/v1beta/properties/540096507:runReport",
    });
    expect(plan.requests.channels).toMatchObject({
      dateRanges: [{ startDate: "2026-05-27", endDate: "2026-06-02" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
      ],
      limit: "10",
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });
    expect(plan.requests.pages.dimensions).toEqual([{ name: "pagePathPlusQueryString" }]);
  });

  it("keeps GA4 fetch output constrained to ignored report artifacts", () => {
    expect(
      buildGa4WeeklyReportPlan({
        outputPath: path.join(projectRoot, "reports", "custom-ga4.json"),
      }).outputPath,
    ).toBe("reports/custom-ga4.json");
    expect(buildGa4WeeklyReportPlan({ outputPath: "reports/nested/custom-ga4.json" }).outputPath).toBe(
      "reports/nested/custom-ga4.json",
    );
    expect(() => buildGa4WeeklyReportPlan({ outputPath: "README.md" })).toThrow(/under reports/);
    expect(() => buildGa4WeeklyReportPlan({ outputPath: "/tmp/ga4-weekly-traffic.json" })).toThrow(/under reports/);
  });

  it("normalizes GA4 rows and builds a service-account-backed traffic artifact", () => {
    const plan = buildGa4WeeklyReportPlan({
      startDate: "2026-05-27",
      endDate: "2026-06-02",
      rowLimit: 2,
    });
    const channels = normalizeGa4Rows(
      {
        rows: [
          {
            dimensionValues: [{ value: "Direct" }],
            metricValues: [{ value: "145" }, { value: "91" }, { value: "188" }, { value: "44" }],
          },
        ],
      },
      "channel",
    );
    const pages = normalizeGa4Rows(
      {
        rows: [
          {
            dimensionValues: [{ value: "/" }],
            metricValues: [{ value: "50" }, { value: "42" }, { value: "80" }, { value: "20" }],
          },
          {
            dimensionValues: [{ value: "/codes/dometic-bluetooth-ct-e1/" }],
            metricValues: [{ value: "7" }, { value: "6" }, { value: "9" }, { value: "3" }],
          },
        ],
      },
      "page",
    );
    const report = buildGa4TrafficReport({
      plan,
      channelRows: channels,
      pageRows: pages,
      serviceAccountEmail: "printablespark-ga4-reporter@coffee-explorer-480514.iam.gserviceaccount.com",
      generatedAt: "2026-06-03T02:00:00.000Z",
    });

    expect(report).toMatchObject({
      generatedAt: "2026-06-03T02:00:00.000Z",
      source: "google-analytics-data-api-runReport",
      property: "properties/540096507",
      measurementId: "G-9824RBXHHR",
      serviceAccountEmail: "printablespark-ga4-reporter@coffee-explorer-480514.iam.gserviceaccount.com",
      dataAvailable: true,
      summary: {
        channels: { rowCount: 1, sessions: 145, activeUsers: 91, screenPageViews: 188, engagedSessions: 44 },
        pages: { rowCount: 2, sessions: 57, activeUsers: 48, screenPageViews: 89, engagedSessions: 23 },
      },
    });
    expect(report.topChannels).toEqual([{ channel: "Direct", sessions: 145, activeUsers: 91, screenPageViews: 188, engagedSessions: 44 }]);
    expect(report.topPages[0]).toEqual({ page: "/", sessions: 50, activeUsers: 42, screenPageViews: 80, engagedSessions: 20 });
  });
});
