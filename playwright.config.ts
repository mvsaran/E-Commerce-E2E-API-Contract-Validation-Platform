import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * 
 * - Runs all specs in /tests directory
 * - Uses Chromium browser (headed or headless based on CI)
 * - Allure reporter + HTML reporter for rich reporting
 * - Captures video, screenshots, and traces on failure
 * - Global setup starts the Express backend before tests run
 * - Global teardown stops the backend after all tests complete
 */
export default defineConfig({
  // Directory where all test specs live
  testDir: './tests',

  // Maximum time one test can run (30 seconds)
  timeout: 30_000,

  // Expect assertion timeout
  expect: {
    timeout: 10_000,
  },

  // Run tests in parallel (set to false for sequential API capture)
  fullyParallel: false,

  // Fail the build on CI if any test.only is left
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Use single worker to keep API session state consistent
  workers: 1,

  // Reporters: Allure for rich report, HTML for quick preview
  reporter: [
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
    }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Global setup and teardown for Express server lifecycle
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  use: {
    // Application base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Always collect traces (viewable in Playwright trace viewer)
    trace: 'on',

    // Record video on first retry (saves storage)
    video: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 10_000,

    // Navigation timeout
    navigationTimeout: 15_000,
  },

  // Test projects — using Chromium only (add more as needed)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Output directories for artifacts
  outputDir: 'test-results',
});
