import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite for the hosted DS1 libraries feature.
 *
 * Two servers run today:
 *   - the workbench SPA on 5173
 *   - a static server on 4399 serving e2e/fixtures as a *separate origin*,
 *     which is what makes the customer-page assertions meaningful
 *
 * The API worker (8787) and assets worker (8788) join this list in Phase 2 and
 * Phase 1 respectively.
 */
const APP_PORT = 5173;
const FIXTURE_PORT = 4399;

export default defineConfig({
  testDir: "./tests",
  // Keep artifacts inside e2e/ rather than the repo root.
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    // The SPA is served under /app/ in dev and in production alike, so specs
    // navigate to "/app/playground" rather than "/".
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "vp dev",
      cwd: "../app",
      url: `http://127.0.0.1:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // A deliberately different origin from the workbench, so the customer
      // page cannot accidentally inherit anything from the app.
      command: "vp exec tsx fixture-server.ts",
      env: { FIXTURE_PORT: String(FIXTURE_PORT) },
      url: `http://127.0.0.1:${FIXTURE_PORT}/customer.html`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});

export const FIXTURE_ORIGIN = `http://127.0.0.1:${FIXTURE_PORT}`;
