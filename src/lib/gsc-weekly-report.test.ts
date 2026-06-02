import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  COMPAT_TOKEN_COMMAND,
  DEFAULT_TOKEN_COMMAND,
  buildWeeklyReportPlan,
  buildWeeklyTrafficReport,
  getDefaultWeeklyDateRange,
  normalizeSearchAnalyticsRows,
  summarizeSearchAnalyticsRows,
} from "../../scripts/gsc-weekly-report.mjs";

describe("GSC weekly traffic report", () => {
  it("defaults to the last seven Pacific-time days ending three days ago", () => {
    expect(getDefaultWeeklyDateRange(new Date(Date.UTC(2026, 5, 2, 12, 0, 0)))).toEqual({
      startDate: "2026-05-24",
      endDate: "2026-05-30",
      days: 7,
      timeZone: "America/Los_Angeles",
      dataDelayDays: 3,
    });
  });

  it("builds Search Analytics query and page requests for the configured URL-prefix property", () => {
    const plan = buildWeeklyReportPlan({
      baseUrl: "https://rv-appliance-code-atlas.fly.dev",
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      sitemapUrl: "https://rv-appliance-code-atlas.fly.dev/sitemap.xml",
      startDate: "2026-05-26",
      endDate: "2026-06-01",
      rowLimit: 20,
      outputPath: "reports/gsc-weekly-traffic.json",
      apiBase: "https://gsc.example/webmasters/v3",
    });

    expect(plan).toEqual({
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      sitemapUrl: "https://rv-appliance-code-atlas.fly.dev/sitemap.xml",
      startDate: "2026-05-26",
      endDate: "2026-06-01",
      days: 7,
      rowLimit: 20,
      outputPath: "reports/gsc-weekly-traffic.json",
      searchAnalyticsEndpoint:
        "https://gsc.example/webmasters/v3/sites/https%3A%2F%2Frv-appliance-code-atlas.fly.dev%2F/searchAnalytics/query",
      requests: {
        queries: {
          startDate: "2026-05-26",
          endDate: "2026-06-01",
          dimensions: ["query"],
          rowLimit: 20,
        },
        pages: {
          startDate: "2026-05-26",
          endDate: "2026-06-01",
          dimensions: ["page"],
          rowLimit: 20,
        },
      },
    });
  });

  it("rejects domain, malformed, and foreign URL-prefix properties", () => {
    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "sc-domain:rv-appliance-code-atlas.fly.dev",
      }),
    ).toThrow(/URL-prefix/);

    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "rv-appliance-code-atlas.fly.dev",
      }),
    ).toThrow(/http\(s\) scheme/);

    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "https://example.com/",
      }),
    ).toThrow(/site URL is not on rv-appliance-code-atlas\.fly\.dev/);
  });

  it("rejects scheme mismatches and attempts to repin the report away from the corpus site", () => {
    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "http://rv-appliance-code-atlas.fly.dev/",
      }),
    ).toThrow(/must use https:/);

    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://example.com",
        siteUrl: "https://example.com/",
      }),
    ).toThrow(/base URL is pinned to https:\/\/rv-appliance-code-atlas\.fly\.dev/);

    expect(() =>
      buildWeeklyReportPlan({
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
        sitemapUrl: "http://rv-appliance-code-atlas.fly.dev/sitemap.xml",
      }),
    ).toThrow(/sitemap URL must use https:/);
  });

  it("normalizes Search Analytics rows and summarizes weighted traffic metrics", () => {
    const rows = normalizeSearchAnalyticsRows(
      {
        rows: [
          { keys: ["dometic e1"], clicks: 2, impressions: 10, ctr: 0.2, position: 4.5 },
          { keys: [], clicks: 0, impressions: 5, ctr: 0, position: 12 },
        ],
      },
      "query",
    );

    expect(rows).toEqual([
      { query: "dometic e1", clicks: 2, impressions: 10, ctr: 0.2, position: 4.5 },
      { query: "(not provided)", clicks: 0, impressions: 5, ctr: 0, position: 12 },
    ]);

    const summary = summarizeSearchAnalyticsRows(rows);
    expect(summary.rowCount).toBe(2);
    expect(summary.clicks).toBe(2);
    expect(summary.impressions).toBe(15);
    expect(summary.ctr).toBeCloseTo(2 / 15);
    expect(summary.averagePosition).toBeCloseTo((10 * 4.5 + 5 * 12) / 15);
  });

  it("builds a deterministic weekly report and handles empty GSC data", () => {
    const plan = buildWeeklyReportPlan({
      baseUrl: "https://rv-appliance-code-atlas.fly.dev",
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      sitemapUrl: "https://rv-appliance-code-atlas.fly.dev/sitemap.xml",
      startDate: "2026-05-26",
      endDate: "2026-06-01",
      rowLimit: 10,
    });

    const report = buildWeeklyTrafficReport({
      plan,
      queryRows: normalizeSearchAnalyticsRows(
        { rows: [{ keys: ["onan generator no output"], clicks: 1, impressions: 4, ctr: 0.25, position: 3 }] },
        "query",
      ),
      pageRows: normalizeSearchAnalyticsRows(
        {
          rows: [
            {
              keys: ["https://rv-appliance-code-atlas.fly.dev/symptoms/cummins-onan-generator-no-output-load-management/"],
              clicks: 1,
              impressions: 4,
              ctr: 0.25,
              position: 3,
            },
          ],
        },
        "page",
      ),
      generatedAt: "2026-06-02T20:00:00.000Z",
    });

    expect(report).toMatchObject({
      generatedAt: "2026-06-02T20:00:00.000Z",
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      dataAvailable: true,
      dateRange: {
        startDate: "2026-05-26",
        endDate: "2026-06-01",
        days: 7,
      },
      summary: {
        queries: { clicks: 1, impressions: 4 },
        pages: { clicks: 1, impressions: 4 },
      },
    });
    expect(report.topQueries[0].query).toBe("onan generator no output");
    expect(report.topPages[0].page).toContain("/symptoms/cummins-onan-generator-no-output-load-management/");

    const emptyReport = buildWeeklyTrafficReport({
      plan,
      queryRows: [],
      pageRows: [],
      generatedAt: "2026-06-02T20:00:00.000Z",
    });
    expect(emptyReport.dataAvailable).toBe(false);
    expect(emptyReport.summary.queries).toEqual({
      rowCount: 0,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: 0,
    });
  });

  it("exposes repeatable npm commands for weekly GSC report generation", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(packageJson.scripts["traffic:gsc:weekly:dry-run"]).toBe("node scripts/gsc-weekly-report.mjs --dry-run");
    expect(packageJson.scripts["traffic:gsc:weekly"]).toBe("node scripts/gsc-weekly-report.mjs --fetch");
  });

  it("prefers readonly GSC tokens and keeps a local ADC compatibility fallback", () => {
    expect(DEFAULT_TOKEN_COMMAND).toContain("https://www.googleapis.com/auth/webmasters.readonly");
    expect(COMPAT_TOKEN_COMMAND).toContain("https://www.googleapis.com/auth/webmasters");
    expect(COMPAT_TOKEN_COMMAND).not.toContain("webmasters.readonly");
  });
});
