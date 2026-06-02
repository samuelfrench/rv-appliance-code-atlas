import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production domain nginx config", () => {
  it("redirects www to the canonical apex host while preserving the default app server", () => {
    const config = readFileSync("nginx.conf", "utf8");

    expect(config).toContain("server_name www.rvappliancefaultcodes.com;");
    expect(config).toContain("return 301 https://rvappliancefaultcodes.com$request_uri;");
    expect(config).toContain("listen 8080 default_server;");
    expect(config).toContain("server_name _;");
  });
});
