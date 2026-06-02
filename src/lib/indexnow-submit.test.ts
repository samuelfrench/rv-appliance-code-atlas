import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  INDEXNOW_KEY,
  buildIndexNowPlan,
  buildIndexNowReport,
  buildPrintableIndexNowPlan,
  parseIndexNowReportUrls,
} from "../../scripts/indexnow-submit.mjs";

const sampleReport = {
  generatedAt: "2026-06-02T20:10:00.000Z",
  status: "ready-key-configured",
  urlCount: 3,
  urls: [
    "https://rvappliancefaultcodes.com/",
    "https://rvappliancefaultcodes.com/codes/example/",
    "https://rvappliancefaultcodes.com/codes/example/",
  ],
};

describe("IndexNow submission", () => {
  it("ships a root key file matching the configured public key", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{64}$/);
    expect(readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8")).toBe(`${INDEXNOW_KEY}\n`);
  });

  it("deduplicates the generated IndexNow report URLs and builds the POST payload", () => {
    const urls = parseIndexNowReportUrls(sampleReport);
    const plan = buildIndexNowPlan({
      reportUrls: urls,
      baseUrl: "https://rvappliancefaultcodes.com",
      key: INDEXNOW_KEY,
      apiBase: "https://api.indexnow.example",
    });

    expect(urls).toEqual([
      "https://rvappliancefaultcodes.com/",
      "https://rvappliancefaultcodes.com/codes/example/",
    ]);
    expect(plan.endpoint).toBe("https://api.indexnow.example/indexnow");
    expect(plan.host).toBe("rvappliancefaultcodes.com");
    expect(plan.urlCount).toBe(2);
    expect(plan.keyLocation).toBe(`https://rvappliancefaultcodes.com/${INDEXNOW_KEY}.txt`);
    expect(plan.payload).toEqual({
      host: "rvappliancefaultcodes.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://rvappliancefaultcodes.com/${INDEXNOW_KEY}.txt`,
      urlList: [
        "https://rvappliancefaultcodes.com/",
        "https://rvappliancefaultcodes.com/codes/example/",
      ],
    });
  });

  it("rejects malformed keys, foreign URLs, and oversize URL batches", () => {
    expect(() =>
      buildIndexNowPlan({
        reportUrls: ["https://rvappliancefaultcodes.com/"],
        baseUrl: "https://rvappliancefaultcodes.com",
        key: "bad key",
      }),
    ).toThrow(/IndexNow key/);

    expect(() =>
      buildIndexNowPlan({
        reportUrls: ["https://example.com/not-this-site/"],
        baseUrl: "https://rvappliancefaultcodes.com",
        key: INDEXNOW_KEY,
      }),
    ).toThrow(/not on rvappliancefaultcodes\.com/);

    expect(() =>
      buildIndexNowPlan({
        reportUrls: Array.from({ length: 10_001 }, (_, index) => `https://rvappliancefaultcodes.com/codes/${index}/`),
        baseUrl: "https://rvappliancefaultcodes.com",
        key: INDEXNOW_KEY,
      }),
    ).toThrow(/10,000/);
  });

  it("builds a deterministic local report for dry runs and submissions", () => {
    const plan = buildIndexNowPlan({
      reportUrls: parseIndexNowReportUrls(sampleReport),
      baseUrl: "https://rvappliancefaultcodes.com",
      key: INDEXNOW_KEY,
      apiBase: "https://api.indexnow.example",
    });

    expect(
      buildIndexNowReport({
        plan,
        generatedAt: "2026-06-02T20:15:00.000Z",
        mode: "dry-run",
      }),
    ).toEqual({
      generatedAt: "2026-06-02T20:15:00.000Z",
      mode: "dry-run",
      endpoint: "https://api.indexnow.example/indexnow",
      host: "rvappliancefaultcodes.com",
      keyLocation: `https://rvappliancefaultcodes.com/${INDEXNOW_KEY}.txt`,
      urlCount: 2,
      submitted: false,
      responseStatus: null,
      acceptedStatusCodes: [200, 202],
    });
  });

  it("prints a compact plan summary instead of dumping every URL", () => {
    const reportUrls = parseIndexNowReportUrls({
      ...sampleReport,
      urls: [
        "https://rvappliancefaultcodes.com/",
        "https://rvappliancefaultcodes.com/codes/a/",
        "https://rvappliancefaultcodes.com/codes/b/",
        "https://rvappliancefaultcodes.com/codes/c/",
        "https://rvappliancefaultcodes.com/codes/d/",
        "https://rvappliancefaultcodes.com/codes/e/",
      ],
    });
    const plan = buildIndexNowPlan({
      reportUrls,
      baseUrl: "https://rvappliancefaultcodes.com",
      key: INDEXNOW_KEY,
      apiBase: "https://api.indexnow.example",
    });

    expect(buildPrintableIndexNowPlan(plan)).toEqual({
      endpoint: "https://api.indexnow.example/indexnow",
      host: "rvappliancefaultcodes.com",
      keyLocation: `https://rvappliancefaultcodes.com/${INDEXNOW_KEY}.txt`,
      urlCount: 6,
      sampleUrls: [
        "https://rvappliancefaultcodes.com/",
        "https://rvappliancefaultcodes.com/codes/a/",
        "https://rvappliancefaultcodes.com/codes/b/",
      ],
      omittedUrlCount: 3,
      acceptedStatusCodes: [200, 202],
    });
  });

  it("exposes repeatable npm commands for IndexNow dry runs and submissions", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(packageJson.scripts["traffic:indexnow:dry-run"]).toBe("npm run build && node scripts/indexnow-submit.mjs --dry-run");
    expect(packageJson.scripts["traffic:indexnow:submit"]).toBe("npm run build && node scripts/indexnow-submit.mjs --submit");
  });
});
