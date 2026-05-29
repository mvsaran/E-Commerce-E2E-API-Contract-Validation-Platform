/**
 * utils/schemaValidator.ts
 * 
 * AJV-based JSON schema validation utilities.
 * Used in every Playwright spec to validate API responses inline.
 * 
 * Also provides helpers to parse Playwright Response objects
 * and validate their JSON bodies against schemas.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Response } from '@playwright/test';

// Create a shared AJV instance with format support (email, date, uri, etc.)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// ── Core Validation ───────────────────────────────────────────────

export interface ValidationResult {
  valid:  boolean;
  errors: string[];
  data:   unknown;
}

/**
 * Validates a JavaScript object against an AJV-compatible JSON schema.
 * 
 * @param data    The data object to validate
 * @param schema  AJV schema definition
 * @returns       ValidationResult with errors list
 */
export function validateSchema(data: unknown, schema: object): ValidationResult {
  const validate = ajv.compile(schema);
  const valid    = validate(data) as boolean;

  const errors = valid
    ? []
    : (validate.errors || []).map(e => `${e.instancePath || '(root)'} ${e.message}`);

  return { valid, errors, data };
}

/**
 * Validates data against a schema and throws an error if invalid.
 * Convenient for use inside Playwright `expect()` assertions.
 * 
 * @param data    Data to validate
 * @param schema  AJV schema
 * @param label   Human-readable name for error messages
 * @throws        Error with details if validation fails
 */
export function assertSchema(data: unknown, schema: object, label = 'Response'): void {
  const result = validateSchema(data, schema);
  if (!result.valid) {
    const errorSummary = result.errors.join('\n  - ');
    throw new Error(
      `Schema validation FAILED for "${label}":\n  - ${errorSummary}\n\nData received:\n${JSON.stringify(data, null, 2)}`
    );
  }
}

// ── Playwright Response Helpers ───────────────────────────────────

/**
 * Parses a Playwright Response object and validates its JSON body
 * against the given schema.
 * 
 * @param response   Playwright Response object from waitForResponse()
 * @param schema     AJV schema to validate against
 * @param label      Label for error messages
 * @returns          Parsed + validated JSON data
 */
export async function validateResponseSchema<T = unknown>(
  response: Response,
  schema: object,
  label: string = 'API Response'
): Promise<T> {
  // Parse JSON using body() buffer to avoid single-read limitation
  let data: T;
  try {
    const body = await response.body();
    data = JSON.parse(body.toString('utf-8')) as T;
  } catch (err: any) {
    throw new Error(`${label}: Failed to parse JSON response body (status: ${response.status()}) - ${err.message}`);
  }

  // Validate against schema
  assertSchema(data, schema, label);

  return data;
}

/**
 * Checks that a Playwright Response has the expected HTTP status code.
 * Throws an error with full context if the status doesn't match.
 * 
 * @param response       Playwright Response
 * @param expectedStatus Expected HTTP status code
 * @param label          Label for error messages
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number,
  label: string = 'API Response'
): void {
  if (response.status() !== expectedStatus) {
    throw new Error(
      `${label}: Expected HTTP status ${expectedStatus}, got ${response.status()} for ${response.url()}`
    );
  }
}
