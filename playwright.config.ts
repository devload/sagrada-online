import { defineConfig, devices } from '@playwright/test'

/**
 * Sagrada E2E — mobile portrait solo playthroughs.
 * Chromium only, 375×812 (iPhone SE-ish). Base URL points at the dev server
 * already started by the harness (npm run dev -- --port 5173).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 12 * 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'off',
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  projects: [
    {
      name: 'chromium-mobile-portrait',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
  ],
})
