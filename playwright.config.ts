import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["./tests/evidence-reporter.ts"]],
  use: {
    channel: "chrome",
    viewport: { width: 1280, height: 900 },
    trace: "off",
    screenshot: "off",
  },
});
