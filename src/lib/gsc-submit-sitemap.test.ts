import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  buildSubmissionPlan,
  parseSitemapUrls,
} from "../../scripts/gsc-submit-sitemap.mjs";
import { buildVerificationPlan } from "../../scripts/gsc-verify-url-prefix.mjs";

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rv-appliance-code-atlas.fly.dev/</loc></url>
  <url><loc>https://rv-appliance-code-atlas.fly.dev/codes/example/</loc></url>
  <url><loc>https://rv-appliance-code-atlas.fly.dev/codes/example/</loc></url>
</urlset>
`;

describe("GSC sitemap submission", () => {
  it("deduplicates sitemap URLs and builds URL-prefix submission endpoints for the Fly URL", () => {
    const urls = parseSitemapUrls(sitemapXml);
    const plan = buildSubmissionPlan({
      sitemapUrls: urls,
      baseUrl: "https://rv-appliance-code-atlas.fly.dev",
    });

    expect(urls).toEqual([
      "https://rv-appliance-code-atlas.fly.dev/",
      "https://rv-appliance-code-atlas.fly.dev/codes/example/",
    ]);
    expect(plan.siteUrl).toBe("https://rv-appliance-code-atlas.fly.dev/");
    expect(plan.sitemapUrl).toBe("https://rv-appliance-code-atlas.fly.dev/sitemap.xml");
    expect(plan.urlCount).toBe(2);
    expect(plan.siteAddEndpoint).toContain("https%3A%2F%2Frv-appliance-code-atlas.fly.dev%2F");
    expect(plan.sitemapSubmitEndpoint).toContain("https%3A%2F%2Frv-appliance-code-atlas.fly.dev%2Fsitemap.xml");
  });

  it("rejects sitemap URLs outside the configured host", () => {
    expect(() =>
      buildSubmissionPlan({
        sitemapUrls: [
          "https://rv-appliance-code-atlas.fly.dev/",
          "https://example.com/not-this-site/",
        ],
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
      }),
    ).toThrow(/not on rv-appliance-code-atlas\.fly\.dev/);
  });

  it("rejects domain properties and foreign URL-prefix properties for sitemap submission", () => {
    const sitemapUrls = parseSitemapUrls(sitemapXml);

    expect(() =>
      buildSubmissionPlan({
        sitemapUrls,
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "sc-domain:rv-appliance-code-atlas.fly.dev",
      }),
    ).toThrow(/URL-prefix/);

    expect(() =>
      buildSubmissionPlan({
        sitemapUrls,
        baseUrl: "https://rv-appliance-code-atlas.fly.dev",
        siteUrl: "https://example.com/",
      }),
    ).toThrow(/site URL is not on rv-appliance-code-atlas\.fly\.dev/);
  });

  it("ships the URL-prefix verification file Google requested", () => {
    expect(readFileSync("public/googled22aa40f3a0e4dca.html", "utf8")).toBe(
      "google-site-verification: googled22aa40f3a0e4dca.html\n",
    );
  });

  it("builds a Site Verification FILE plan for the Fly URL-prefix property", () => {
    const plan = buildVerificationPlan({
      siteUrl: "https://rv-appliance-code-atlas.fly.dev/",
      verificationFile: "googled22aa40f3a0e4dca.html",
    });

    expect(plan.siteUrl).toBe("https://rv-appliance-code-atlas.fly.dev/");
    expect(plan.method).toBe("FILE");
    expect(plan.verificationFileUrl).toBe("https://rv-appliance-code-atlas.fly.dev/googled22aa40f3a0e4dca.html");
    expect(plan.insertEndpoint).toBe(
      "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE",
    );
  });

  it("rejects malformed, domain, and foreign properties for URL-prefix verification", () => {
    expect(() =>
      buildVerificationPlan({
        siteUrl: "sc-domain:rv-appliance-code-atlas.fly.dev",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/URL-prefix/);

    expect(() =>
      buildVerificationPlan({
        siteUrl: "rv-appliance-code-atlas.fly.dev",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/http\(s\) scheme/);

    expect(() =>
      buildVerificationPlan({
        siteUrl: "https://example.com/",
        verificationFile: "googled22aa40f3a0e4dca.html",
      }),
    ).toThrow(/site URL is not on rv-appliance-code-atlas\.fly\.dev/);
  });

  it("exposes repeatable npm commands for URL-prefix verification and sitemap submission", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(packageJson.scripts["traffic:gsc:verify:dry-run"]).toBe("node scripts/gsc-verify-url-prefix.mjs --dry-run");
    expect(packageJson.scripts["traffic:gsc:verify"]).toBe("node scripts/gsc-verify-url-prefix.mjs --verify");
    expect(packageJson.scripts["traffic:gsc:dry-run"]).toBe("npm run build && node scripts/gsc-submit-sitemap.mjs --dry-run");
    expect(packageJson.scripts["traffic:gsc:submit"]).toBe("npm run build && node scripts/gsc-submit-sitemap.mjs --submit");
  });
});
