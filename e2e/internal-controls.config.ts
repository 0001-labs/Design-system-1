import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests", testMatch: "internal-controls.spec.ts", workers: 1,
  use: { baseURL: "http://127.0.0.1:5187" },
  webServer: { command: "node e2e/internal-controls-server.mjs", cwd: "..", url: "http://127.0.0.1:5187/e2e/fixtures/internal-controls.html", reuseExistingServer: true }
});
