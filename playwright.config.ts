import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["./tests/evidence-reporter.ts"]],
  use: {
    channel: "chrome",
    // Routed cases must fail closed if a redirect escapes HTTP interception.
    // The real-302 fixture uses a separate context behind a local-only proxy.
    offline: true,
    viewport: { width: 1280, height: 900 },
    trace: "off",
    screenshot: "off",
  },
});
