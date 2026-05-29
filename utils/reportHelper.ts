/**
 * utils/reportHelper.ts
 * 
 * Allure reporting integration helpers.
 * Wraps test steps in named Allure steps with attachments.
 * Used throughout test specs to enrich the Allure report.
 */

import { Page, Response, test } from '@playwright/test';

// ── Allure Step Wrappers ──────────────────────────────────────────

/**
 * Wraps an async function in a named Allure test step.
 * The step appears in the Allure report timeline.
 * 
 * @param name  Step label shown in Allure
 * @param fn    Async function to execute inside the step
 * @returns     The return value of fn
 */
export async function addAllureStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return test.step(name, fn);
}

// ── Screenshot Attachments ────────────────────────────────────────

/**
 * Takes a screenshot and attaches it to the current Allure step.
 * 
 * @param page   Playwright Page object
 * @param name   Attachment name (shown in Allure)
 */
export async function attachScreenshot(page: Page, name: string): Promise<void> {
  const screenshot = await page.screenshot({ fullPage: false });
  await test.info().attach(name, {
    body:      screenshot,
    contentType: 'image/png',
  });
}

// ── API Capture Logging ───────────────────────────────────────────

export interface ApiCaptureData {
  method:   string;
  url:      string;
  status:   number;
  body?:    unknown;
}

/**
 * Logs a captured API call as a JSON attachment in the Allure report.
 * Call this after every waitForResponse() to track captured traffic.
 * 
 * @param label    Attachment label (e.g. "POST /api/auth/login")
 * @param capture  ApiCaptureData object
 */
export async function logApiCapture(label: string, capture: ApiCaptureData): Promise<void> {
  const json = JSON.stringify(capture, null, 2);
  await test.info().attach(`📡 Captured: ${label}`, {
    body:        Buffer.from(json, 'utf-8'),
    contentType: 'application/json',
  });
}

/**
 * Convenience: extracts key data from a Playwright Response and logs it.
 * 
 * @param response  Playwright Response object
 * @param label     Attachment label
 */
export async function logResponse(response: Response, label?: string): Promise<void> {
  let body: unknown;
  try {
    const buf = await response.body();
    body = JSON.parse(buf.toString('utf-8'));
  } catch {
    body = '(non-JSON body)';
  }

  const url = response.url().replace(/^https?:\/\/[^/]+/, ''); // strip host

  await logApiCapture(label || url, {
    method: response.request().method(),
    url:    response.url(),
    status: response.status(),
    body,
  });
}

// ── Schema Validation Attachment ──────────────────────────────────

/**
 * Attaches AJV schema validation results to the Allure report.
 * 
 * @param label   Label for the attachment
 * @param valid   Whether schema validation passed
 * @param errors  Array of AJV error strings (empty if valid)
 */
export async function attachValidationResult(
  label: string,
  valid: boolean,
  errors: string[]
): Promise<void> {
  const result = {
    valid,
    errors: valid ? [] : errors,
    timestamp: new Date().toISOString(),
  };

  await test.info().attach(`✅ Schema: ${label}`, {
    body:        Buffer.from(JSON.stringify(result, null, 2), 'utf-8'),
    contentType: 'application/json',
  });
}

// ── Test Context Helpers ──────────────────────────────────────────

/**
 * Adds a descriptive annotation to the current test in Allure.
 * 
 * @param key    Annotation key (e.g. "API", "Scenario")
 * @param value  Annotation value
 */
export function addTestAnnotation(key: string, value: string): void {
  test.info().annotations.push({ type: key, description: value });
}
