import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:5178";
const baseURL = process.env.BASE_URL ?? localBaseURL;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run serve:dist -- 5178",
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], baseURL },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], baseURL },
    },
  ],
});
