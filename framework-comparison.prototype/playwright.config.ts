import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./probes",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:4177",
    browserName: "chromium",
    viewport: { width: 1440, height: 1050 },
    trace: "on",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: true,
  },
});
