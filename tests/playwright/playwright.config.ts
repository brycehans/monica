import { defineConfig, devices } from '@playwright/test';

// Base URL: defaults to the dev compose stack (docker-compose.dev.yml maps app:80 -> host:8082).
// Override with SMOKE_BASE_URL for any other env (e.g. a Forge staging server).
const baseURL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8082';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,           // single-account dev DB; parallel runs would step on each other
  forbidOnly: !!process.env.CI,
  retries: 0,                     // smoke tests should be deterministic; flake = bug
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
