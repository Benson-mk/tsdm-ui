import { defineConfig } from "@playwright/test";

const channel = process.env.TSDM_E2E_CHANNEL ?? "msedge";
if (channel !== "msedge" && channel !== "chrome")
  throw new Error("TSDM_E2E_CHANNEL must be msedge or chrome");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["./tests/evidence-reporter.ts"]],
  use: {
    channel,
    // Routed cases must fail closed if a redirect escapes HTTP interception.
    // The real-302 fixture uses a separate context behind a local-only proxy.
    offline: true,
    viewport: { width: 1280, height: 900 },
    trace: "off",
    screenshot: "off",
  },
});
