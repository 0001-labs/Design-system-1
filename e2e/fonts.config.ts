import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.DOCS_URL || 'http://127.0.0.1:4401';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  testMatch: 'fonts.spec.ts',
  outputDir: './test-results/fonts',
  use: { baseURL },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' } },
  ],
  webServer: process.env.DOCS_URL ? undefined : {
    command: 'vp run docs:dev --host 127.0.0.1 --port 4401',
    cwd: '..',
    url: baseURL,
    reuseExistingServer: true,
  },
});
