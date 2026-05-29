/**
 * tests/product.spec.ts — Scenario 2: Load Products
 * 
 * Tests:
 *   1. Products page loads with data from GET /api/products
 *      - Captures GET /api/products
 *      - Validates: status 200, products array exists, schema valid
 *   2. Verifies product cards render with correct data
 * 
 * Integration point: GET /api/products → validated by Postman
 */

import { test, expect, Response } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { ProductSchema } from '../schemas/ProductSchema';
import { validateResponseSchema, assertResponseStatus } from '../utils/schemaValidator';
import { logResponse, attachScreenshot, addAllureStep, addTestAnnotation } from '../utils/reportHelper';
import { getAdminCredentials } from '../utils/fakerData';

// ── Shared login step ─────────────────────────────────────────────
async function loginAsAdmin(page: any) {
  const loginPage   = new LoginPage(page);
  const credentials = getAdminCredentials();
  await loginPage.navigate();
  await loginPage.fillCredentials(credentials.email, credentials.password);
  await loginPage.submitLogin();
  await loginPage.waitForProductsPage();
}

test.describe('Scenario 2 — Load Products', () => {

  test('should display products and capture GET /api/products', async ({ page }) => {
    addTestAnnotation('API', 'GET /api/products');
    addTestAnnotation('Scenario', '2 — Products');

    const productPage = new ProductPage(page);

    let apiResponse: Response;

    await addAllureStep('Login as admin and capture GET /api/products during redirect', async () => {
      const loginPage = new LoginPage(page);
      const credentials = getAdminCredentials();
      await loginPage.navigate();
      await loginPage.fillCredentials(credentials.email, credentials.password);
      
      const [response] = await Promise.all([
        page.waitForResponse(
          r => r.url().includes('/api/products') &&
               r.request().method() === 'GET' &&
               r.status() === 200
        ),
        loginPage.submitLogin(),
      ]);
      apiResponse = response;
      
      await productPage.productCards.first().waitFor({ state: 'visible', timeout: 10_000 });
    });

    await addAllureStep('Validate GET /api/products response', async () => {
      // ✅ Validate: HTTP status 200
      assertResponseStatus(apiResponse, 200, 'GET /api/products');

      // Log to Allure
      await logResponse(apiResponse!, 'GET /api/products');
    });

    // ── Step 3: Validate response schema ─────────────────────────
    await addAllureStep('Validate products response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, ProductSchema, 'Products Response');

      // ✅ Validate: products array exists and has items
      const products = (data as any).products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // ✅ Validate: total count matches array length
      expect((data as any).total).toBe(products.length);
    });

    // ── Step 4: Verify UI renders products ───────────────────────
    await addAllureStep('Verify product cards are displayed', async () => {
      const count = await productPage.getProductCount();
      expect(count).toBeGreaterThan(0);

      // Verify first product card has required elements
      const firstName = await productPage.getProductName(0);
      const firstPrice = await productPage.getProductPrice(0);
      expect(firstName.length).toBeGreaterThan(0);
      expect(firstPrice).toMatch(/\$/);
    });

    // ── Step 5: Verify product count label ───────────────────────
    await addAllureStep('Verify product count label is shown', async () => {
      const countText = await productPage.productCount.innerText();
      expect(countText).toMatch(/\d+\s+products?/i);
    });

    await attachScreenshot(page, 'Products page — loaded');
  });

  test('should have Add to Cart buttons for each product', async ({ page }) => {
    addTestAnnotation('API', 'GET /api/products');

    const productPage = new ProductPage(page);
    await addAllureStep('Login', () => loginAsAdmin(page));
    await addAllureStep('Navigate to products', () => productPage.navigate());

    await addAllureStep('Verify Add to Cart buttons', async () => {
      const btnCount = await productPage.addToCartBtns.count();
      expect(btnCount).toBeGreaterThan(0);

      // Each visible button should have correct text or be disabled
      for (let i = 0; i < Math.min(btnCount, 3); i++) {
        const btn = productPage.addToCartBtns.nth(i);
        await expect(btn).toBeVisible();
      }
    });

    await attachScreenshot(page, 'Products — Add to Cart buttons visible');
  });

});
