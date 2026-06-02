import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  buildSubmissionPlan,
  parseSitemapUrls,
} from "../../scripts/gsc-submit-sitemap.mjs";
import { buildVerificationPlan } from "../../scripts/gsc-verify-url-prefix.mjs";

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rvappliancefaultcodes.com/</loc></url>
  <url><loc>https://rvappliancefaultcodes.com/codes/example/</loc></url>
  <url><loc>https://rvappliancefaultcodes.com/codes/example/</loc></url>
</urlset>
`;

describe("GSC sitemap submission", () => {
  it("deduplicates sitemap URLs and builds URL-prefix submission endpoints for the Fly URL", () => {
    const urls = parseSitemapUrls(sitemapXml);
    const plan = buildSubmissionPlan({
      sitemapUrls: urls,
      baseUrl: "https://rvappliancefaultcodes.com",
    });

    expect(urls).toEqual([
      "https://rvappliancefaultcodes.com/",
      "https://rvappliancefaultcodes.com/codes/example/",
    ]);
    expect(plan.siteUrl).toBe("https://rvappliancefaultcodes.com/");
    expect(plan.sitemapUrl).toBe("https://rvappliancefaultcodes.com/sitemap.xml");
    expect(plan.urlCount).toBe(2);
    expect(plan.siteAddEndpoint).toContain("https%3A%2F%2Frvappliancefaultcodes.com%2F");
    expect(plan.sitemapSubmitEndpoint).toContain("https%3A%2F%2Frvappliancefaultcodes.com%2Fsitemap.xml");
  });

  it("rejects sitemap URLs outside the configured host", () => {
    expect(() =>
      buildSubmissionPlan({
        sitemapUrls: [
          "https://rvappliancefaultcodes.com/",
          "https://example.com/not-this-site/",
        ],
        baseUrl: "https://rvappliancefaultcodes.com",
      }),
    ).toThrow(/not on rvappliancefaultcodes\.com/);
  });

  it("rejects domain properties and foreign URL-prefix properties for sitemap submission", () => {
    const sitemapUrls = parseSitemapUrls(sitemapXml);

    expect(() =>
      buildSubmissionPlan({
        sitemapUrls,
        baseUrl: "https://rvappliancefaultcodes.com",
        siteUrl: "sc-domain:rvappliancefaultcodes.com",
      }),
    ).toThrow(/URL-prefix/);

    expect(() =>
      buildSubmissionPlan({
        sitemapUrls,
        baseUrl: "https://rvappliancefaultcodes.com",
        siteUrl: "https://example.com/",
      }),
    ).toThrow(/site URL is not on rvappliancefaultcodes\.com/);
  });

  it("ships the URL-prefix verification file Google requested", () => {
    expect(readFileSync("public/googled22aa40f3a0e4dca.html", "utf8")).toBe(
      "google-site-verification: googled22aa40f3a0e4dca.html\n",
    );
  });

  it("builds a Site Verification FILE plan for the Fly URL-prefix property", () => {
    const plan = buildVerificationPlan({
      siteUrl: "https://rvappliancefaultcodes.com/",
      verificationFile: "googled22aa40f3a0e4dca.html",
    });

    expect(plan.siteUrl).toBe("https://rvappliancefaultcodes.com/");
    expect(plan.method).toBe("FILE");
    expect(plan.verificationFileUrl).toBe("https://rvappliancefaultcodes.com/googled22aa40f3a0e4dca.html");
    expect(plan.insertEndpoint).toBe(
      "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE",
    );
  });

  it("rejects malformed, domain, and foreign properties for URL-prefix verification", () => {
    expect(() =>
      buildVerificationPlan({
        siteUrl: "sc-domain:rvappliancefaultcodes.com",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/URL-prefix/);

    expect(() =>
      buildVerificationPlan({
        siteUrl: "rvappliancefaultcodes.com",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/http\(s\) scheme/);

    expect(() =>
      buildVerificationPlan({
        siteUrl: "https://example.com/",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/site URL is not on rvappliancefaultcodes\.com/);
  });

  it("exposes repeatable npm commands for URL-prefix verification and sitemap submission", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(packageJson.scripts["traffic:gsc:verify:dry-run"]).toBe("node scripts/gsc-verify-url-prefix.mjs --dry-run");
    expect(packageJson.scripts["traffic:gsc:verify"]).toBe("node scripts/gsc-verify-url-prefix.mjs --verify");
    expect(packageJson.scripts["traffic:gsc:dry-run"]).toBe("npm run build && node scripts/gsc-submit-sitemap.mjs --dry-run");
    expect(packageJson.scripts["traffic:gsc:submit"]).toBe("npm run build && node scripts/gsc-submit-sitemap.mjs --submit");
  });
});
