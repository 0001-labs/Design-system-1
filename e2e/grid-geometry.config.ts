import { defineConfig } from "@playwright/test";
/** Measures shared pieces in headless Chromium against the 20px square. */
export default defineConfig({ testDir: "./tests", testMatch: "grid-geometry.spec.ts", workers: 1,
  use: { baseURL: "http://127.0.0.1:5191", viewport: { width: 1280, height: 900 } },
  webServer: { command: "node e2e/grid-geometry-server.mjs", cwd: "..", url: "http://127.0.0.1:5191/e2e/fixtures/grid-geometry.html", reuseExistingServer: true }
});
