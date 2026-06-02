import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import corpus from "../data/corpus.json";

describe("Google Analytics wiring", () => {
  it("records the automated GA4 property and web stream in corpus metadata", () => {
    expect(corpus.site.analytics).toEqual({
      provider: "GA4",
      propertyId: "540096507",
      dataStreamId: "14992447658",
      measurementId: "G-9824RBXHHR",
      defaultUri: "https://rvappliancefaultcodes.com",
      configuredAt: "2026-06-02T23:04:00Z",
    });
  });

  it("ships exactly the reviewed GA4 gtag snippet for the permanent domain", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-9824RBXHHR");
    expect(html).toContain("gtag('config', 'G-9824RBXHHR');");
    expect(html).toContain('<link rel="canonical" href="https://rvappliancefaultcodes.com/" />');
  });
});
