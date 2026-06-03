import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildMonetizationReadinessReport,
  classifyPageForMonetization,
} from "../../scripts/monetization-readiness-report.mjs";

const weeklyTrafficArtifact = {
  generatedAt: "2026-06-02T21:00:00.000Z",
  source: "google-search-console-searchanalytics",
  siteUrl: "https://rvappliancefaultcodes.com/",
  sitemapUrl: "https://rvappliancefaultcodes.com/sitemap.xml",
  dateRange: {
    startDate: "2026-05-26",
    endDate: "2026-06-01",
    days: 7,
  },
  rowLimit: 25,
  dataAvailable: true,
  summary: {
    queries: { rowCount: 0, clicks: 0, impressions: 0, ctr: 0, averagePosition: 0 },
    pages: { rowCount: 4, clicks: 17, impressions: 2150, ctr: 17 / 2150, averagePosition: 4.2 },
  },
  topQueries: [],
  topPages: [
    {
      page: "https://rvappliancefaultcodes.com/",
      clicks: 10,
      impressions: 1100,
      ctr: 10 / 1100,
      position: 3.4,
    },
    {
      page: "https://rvappliancefaultcodes.com/codes/norcold-polar-no-fl/",
      clicks: 4,
      impressions: 540,
      ctr: 4 / 540,
      position: 4.5,
    },
    {
      page: "https://rvappliancefaultcodes.com/symptoms/cummins-onan-generator-no-output-load-management/",
      clicks: 3,
      impressions: 510,
      ctr: 3 / 510,
      position: 5.1,
    },
    {
      page: "https://example.com/codes/foreign/",
      clicks: 99,
      impressions: 9900,
      ctr: 0.01,
      position: 1,
    },
  ],
};

describe("monetization readiness report", () => {
  it("classifies only pinned site pages into disabled slot groups", () => {
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/")).toBe("home-inline-1");
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/codes/norcold-polar-no-fl/")).toBe(
      "code-detail-bottom",
    );
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/codes")).toBe(null);
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/codes/")).toBe(null);
    expect(
      classifyPageForMonetization(
        "https://rvappliancefaultcodes.com/symptoms/cummins-onan-generator-no-output-load-management/",
      ),
    ).toBe("symptom-guide-bottom");
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/symptoms")).toBe(null);
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/symptoms/")).toBe(null);
    expect(classifyPageForMonetization("https://rvappliancefaultcodes.com/sitemap.xml")).toBe(null);
    expect(classifyPageForMonetization("https://example.com/codes/norcold-polar-no-fl/")).toBe(null);
  });

  it("builds a readiness report from GSC page impressions without enabling monetization", () => {
    const report = buildMonetizationReadinessReport({
      weeklyTrafficArtifact,
      generatedAt: "2026-06-02T21:05:00.000Z",
    });

    expect(report).toMatchObject({
      generatedAt: "2026-06-02T21:05:00.000Z",
      sourceArtifact: "reports/gsc-weekly-traffic.json",
      outputPath: "reports/monetization-readiness.json",
      freeSite: true,
      checkoutEnabled: false,
      adSlotsEnabled: false,
      monetizationStatus: "disabled-until-traffic",
      recommendation: "manual-review-ready-pages-keep-disabled",
      dataAvailable: true,
      summary: {
        analyzedPages: 3,
        ignoredPages: 1,
        totalImpressions: 2150,
        readyPages: 3,
      },
    });

    expect(report.affiliatePlaceholders).toEqual([
      { vendorCategory: "RV parts vendors", status: "placeholder-only" },
      { vendorCategory: "mobile RV repair leads", status: "backlog-only" },
      { vendorCategory: "sponsor slots", status: "backlog-only" },
    ]);

    expect(report.slots).toEqual([
      {
        slot: "home-inline-1",
        requiredImpressions: 1000,
        candidateCount: 1,
        readyPageCount: 1,
        totalImpressions: 1100,
        ready: true,
        pages: [
          {
            page: "https://rvappliancefaultcodes.com/",
            path: "/",
            clicks: 10,
            impressions: 1100,
            ctr: 10 / 1100,
            position: 3.4,
            ready: true,
          },
        ],
      },
      {
        slot: "code-detail-bottom",
        requiredImpressions: 500,
        candidateCount: 1,
        readyPageCount: 1,
        totalImpressions: 540,
        ready: true,
        pages: [
          {
            page: "https://rvappliancefaultcodes.com/codes/norcold-polar-no-fl/",
            path: "/codes/norcold-polar-no-fl/",
            clicks: 4,
            impressions: 540,
            ctr: 4 / 540,
            position: 4.5,
            ready: true,
          },
        ],
      },
      {
        slot: "symptom-guide-bottom",
        requiredImpressions: 500,
        candidateCount: 1,
        readyPageCount: 1,
        totalImpressions: 510,
        ready: true,
        pages: [
          {
            page: "https://rvappliancefaultcodes.com/symptoms/cummins-onan-generator-no-output-load-management/",
            path: "/symptoms/cummins-onan-generator-no-output-load-management/",
            clicks: 3,
            impressions: 510,
            ctr: 3 / 510,
            position: 5.1,
            ready: true,
          },
        ],
      },
    ]);
  });

  it("keeps every slot disabled when GSC has no page data", () => {
    const report = buildMonetizationReadinessReport({
      weeklyTrafficArtifact: {
        ...weeklyTrafficArtifact,
        dataAvailable: false,
        summary: {
          ...weeklyTrafficArtifact.summary,
          pages: { rowCount: 0, clicks: 0, impressions: 0, ctr: 0, averagePosition: 0 },
        },
        topPages: [],
      },
      generatedAt: "2026-06-02T21:05:00.000Z",
    });

    expect(report.recommendation).toBe("keep-disabled-until-gsc-page-impressions-exist");
    expect(report.summary.readyPages).toBe(0);
    expect(report.slots.every((slot) => slot.ready === false)).toBe(true);
    expect(report.blockedLaunchReasons).toEqual([
      "Checkout remains disabled.",
      "Ad slots remain disabled.",
      "Affiliate placeholders and repair-lead/sponsor items remain backlog-only or placeholder-only.",
      "No GSC page impressions exist in the source artifact yet.",
    ]);
  });

  it("exposes repeatable npm commands and traffic report wiring", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    expect(packageJson.scripts["traffic:monetization"]).toBe("node scripts/monetization-readiness-report.mjs");

    const output = execFileSync("node", ["scripts/traffic-report.mjs"], { encoding: "utf8" });
    const report = JSON.parse(output);

    expect(report.monetizationReadinessArtifact).toEqual({
      path: "reports/monetization-readiness.json",
      command: "npm run traffic:monetization",
      source: "reports/gsc-weekly-traffic.json",
    });
    expect(report.nextAutomatedBatchGoal).toBe(
      "Triage official Coleman-Mach Wi-Fi/48000 thermostat and rooftop AC symptom-only sources, then add only owner-safe guides without inventing code entries.",
    );
    expect(readFileSync("README.md", "utf8")).toContain("npm run traffic:monetization");
    expect(readFileSync("TODO.md", "utf8")).toContain(
      "- [x] Add impression-based monetization readiness report after GSC data exists.",
    );
  });
});
