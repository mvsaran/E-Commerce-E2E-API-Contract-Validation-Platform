/**
 * tests/login.spec.ts — Scenario 1: Login
 * 
 * Tests:
 *   1. Successful login with valid credentials
 *      - Captures POST /api/auth/login
 *      - Validates: status 200, token exists, schema valid
 *   2. Failed login with wrong password (negative test)
 *   3. Login form validation (empty fields)
 * 
 * Integration point: POST /api/auth/login → validated by Postman
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LoginSchema } from '../schemas/LoginSchema';
import { validateResponseSchema, assertResponseStatus } from '../utils/schemaValidator';
import { logResponse, attachScreenshot, addAllureStep, addTestAnnotation } from '../utils/reportHelper';
import { getAdminCredentials, generateInvalidCredentials } from '../utils/fakerData';

test.describe('Scenario 1 — Login', () => {

  test('should login successfully with valid credentials and capture POST /api/auth/login', async ({ page }) => {
    addTestAnnotation('API', 'POST /api/auth/login');
    addTestAnnotation('Scenario', '1 — Login');

    const loginPage   = new LoginPage(page);
    const credentials = getAdminCredentials();

    // ── Step 1: Navigate to Login Page ───────────────────────────
    await addAllureStep('Navigate to login page', async () => {
      await loginPage.navigate();
      await expect(page).toHaveTitle(/Login.*ShopSphere/i);
    });

    // ── Step 2: Verify form elements are visible ─────────────────
    await addAllureStep('Verify login form elements', async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginBtn).toBeVisible();
      await expect(loginPage.demoCredentials).toBeVisible();
    });

    // ── Step 3: Enter credentials ─────────────────────────────────
    await addAllureStep('Enter valid credentials', async () => {
      await loginPage.fillCredentials(credentials.email, credentials.password);
      await expect(loginPage.emailInput).toHaveValue(credentials.email);
      await expect(loginPage.passwordInput).toHaveValue(credentials.password);
    });

    // ── Step 4: Submit and capture API response ───────────────────
    let apiResponse: Awaited<ReturnType<typeof loginPage.submitLogin>>;

    await addAllureStep('Submit login form — capture POST /api/auth/login', async () => {
      apiResponse = await loginPage.submitLogin();

      // ✅ Validate: HTTP status 200
      assertResponseStatus(apiResponse!, 200, 'POST /api/auth/login');

      // Log captured request to Allure
      await logResponse(apiResponse!, 'POST /api/auth/login');
    });

    // ── Step 5: Validate response schema ─────────────────────────
    await addAllureStep('Validate response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, LoginSchema, 'Login Response');

      // ✅ Validate: token exists and is non-empty
      expect((data as any).token).toBeTruthy();
      expect(typeof (data as any).token).toBe('string');

      // ✅ Validate: user object contains required fields
      expect((data as any).user).toBeDefined();
      expect((data as any).user.email).toBe(credentials.email);
      expect((data as any).user.role).toBe('admin');
    });

    // ── Step 6: Verify redirect to products page ──────────────────
    await addAllureStep('Verify redirect to products page', async () => {
      await loginPage.waitForProductsPage();
      await expect(page).toHaveURL(/products\.html/);
      await expect(page).toHaveTitle(/Products.*ShopSphere/i);
    });

    // Attach final screenshot
    await attachScreenshot(page, 'Products page after login');
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    addTestAnnotation('API', 'POST /api/auth/login');
    addTestAnnotation('Type', 'Negative Test');

    const loginPage   = new LoginPage(page);
    const badCreds    = generateInvalidCredentials();

    await loginPage.navigate();

    // ── Capture failed login API response ─────────────────────────
    await addAllureStep('Submit with wrong credentials', async () => {
      const apiResponse = await loginPage.login(badCreds.email, badCreds.password);

      // ✅ Validate: 401 status for invalid credentials
      assertResponseStatus(apiResponse, 401, 'POST /api/auth/login (invalid)');
      await logResponse(apiResponse, 'POST /api/auth/login (invalid)');
    });

    // ── Verify error UI ───────────────────────────────────────────
    await addAllureStep('Verify error message is displayed', async () => {
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg.length).toBeGreaterThan(0);
      expect(page.url()).not.toContain('products.html');
    });

    await attachScreenshot(page, 'Login error state');
  });

  test('should validate empty form submission', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await addAllureStep('Click login without filling form', async () => {
      await loginPage.loginBtn.click();
      // Should NOT make API call — client-side validation fires first
      await expect(loginPage.emailError).toBeVisible();
    });

    await attachScreenshot(page, 'Empty form validation');
  });

});
