import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  webServer: {
    command: "npm run build && npm run serve:dist -- 5178",
    url: "http://127.0.0.1:5178",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], baseURL: "http://127.0.0.1:5178" },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5178" },
    },
  ],
});
