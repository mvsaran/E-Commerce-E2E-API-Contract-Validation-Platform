/**
 * Postman Application Test Configuration
 * 
 * This file configures the Postman Application Test runner.
 * It tells Postman how to:
 *   1. Run Playwright to capture network traffic
 *   2. Replay captured traffic against the Postman collection
 *   3. Match requests to collection entries
 *   4. Execute collection assertions
 * 
 * Run with: postman application test
 * Requires: POSTMAN_API_KEY environment variable (set in .env or CI secrets)
 */

/** @type {import('postman-playwright').PostmanPlaywrightConfig} */
module.exports = {
  // Path to Playwright config
  playwrightConfig: './playwright.config.ts',

  // Postman collection to match against captured traffic
  collection: './postman/collections/Ecommerce.collection.json',

  // Postman environment file
  environment: './postman/environments/Local.environment.json',

  // Directory where captured network traffic HAR files are stored
  captureDir: './test-results',

  // Network capture options
  capture: {
    // Filter which requests to capture (match our backend API)
    urlFilter: /\/api\//,

    // Attach capture metadata to Allure report
    attachToReport: true,
  },

  // Assertion thresholds — tests fail if these are not met
  thresholds: {
    requestsCaptured: 1,   // At least 1 API request must be captured
    requestsMatched: 1,    // At least 1 must match a collection entry
    assertionsPassed: 1,   // At least 1 assertion must pass
    failures: 0,           // Zero tolerance for failures
  },

  // Reporter configuration
  reporters: ['cli', 'json'],
  reporterOptions: {
    json: {
      output: './test-results/postman-app-test-results.json',
    },
  },
};
