import { afterEach, describe, expect, it, vi } from "vitest";

const originalBaseUrl = process.env.BASE_URL;

async function loadConfig(caseName: "external" | "local") {
  vi.resetModules();
  if (caseName === "external") {
    return (await import("../../playwright.config.ts?external")).default;
  }
  return (await import("../../playwright.config.ts?local")).default;
}

describe("playwright config", () => {
  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = originalBaseUrl;
    }
  });

  it("uses the configured external BASE_URL without starting the local static server", async () => {
    process.env.BASE_URL = "https://rvappliancefaultcodes.com";

    const config = await loadConfig("external");

    expect(config.webServer).toBeUndefined();
    expect(config.projects?.map((project) => project.use?.baseURL)).toEqual([
      "https://rvappliancefaultcodes.com",
      "https://rvappliancefaultcodes.com",
    ]);
  });

  it("keeps the local static server for normal local test runs", async () => {
    delete process.env.BASE_URL;

    const config = await loadConfig("local");

    expect(config.webServer).toEqual({
      command: "npm run build && npm run serve:dist -- 5178",
      url: "http://127.0.0.1:5178",
      reuseExistingServer: !process.env.CI,
    });
    expect(config.projects?.map((project) => project.use?.baseURL)).toEqual([
      "http://127.0.0.1:5178",
      "http://127.0.0.1:5178",
    ]);
  });
});
