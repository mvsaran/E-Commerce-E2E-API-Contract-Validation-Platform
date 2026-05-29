/**
 * tests/cart.spec.ts — Scenarios 3 & 4: Add to Cart + View Cart
 * 
 * Tests:
 *   Scenario 3 — Add Product to Cart
 *     - Captures POST /api/cart
 *     - Validates: status 201, cart item created, schema valid
 * 
 *   Scenario 4 — View Cart
 *     - Captures GET /api/cart
 *     - Validates: status 200, items array, schema valid
 * 
 *   Extra — Remove item from cart
 *     - Captures DELETE /api/cart/:id
 *     - Validates: status 200, item removed
 * 
 * Integration points → validated by Postman
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CartItemSchema, CartListSchema, RemoveCartSchema } from '../schemas/CartSchema';
import { validateResponseSchema, assertResponseStatus } from '../utils/schemaValidator';
import { logResponse, attachScreenshot, addAllureStep, addTestAnnotation } from '../utils/reportHelper';
import { getAdminCredentials } from '../utils/fakerData';

async function loginAsAdmin(page: any) {
  const loginPage   = new LoginPage(page);
  const credentials = getAdminCredentials();
  await loginPage.navigate();
  await loginPage.fillCredentials(credentials.email, credentials.password);
  await loginPage.submitLogin();
  await loginPage.waitForProductsPage();
}

test.describe('Scenario 3 — Add Product to Cart', () => {

  test('should add first product to cart and capture POST /api/cart', async ({ page }) => {
    addTestAnnotation('API', 'POST /api/cart');
    addTestAnnotation('Scenario', '3 — Add to Cart');

    const productPage = new ProductPage(page);
    const cartPage    = new CartPage(page);

    // ── Step 1: Login ─────────────────────────────────────────────
    await addAllureStep('Login as admin', () => loginAsAdmin(page));

    // ── Step 2: Load products ─────────────────────────────────────
    await addAllureStep('Navigate to products page', () => productPage.navigate());

    // ── Step 3: Get first product name for assertion ──────────────
    const firstProductName = await productPage.getProductName(0);

    // ── Step 4: Add first product to cart ────────────────────────
    let apiResponse: Awaited<ReturnType<typeof productPage.addProductToCart>>;

    await addAllureStep(`Add "${firstProductName}" to cart — capture POST /api/cart`, async () => {
      apiResponse = await productPage.addProductToCart(0);

      // ✅ Validate: HTTP status 201 (Created)
      assertResponseStatus(apiResponse!, 201, 'POST /api/cart');

      await logResponse(apiResponse!, 'POST /api/cart');
    });

    // ── Step 5: Validate response schema ─────────────────────────
    await addAllureStep('Validate cart item response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, CartItemSchema, 'Add to Cart Response');

      // ✅ Validate: cart item was created with required fields
      expect((data as any).id).toBeTruthy();
      expect((data as any).productId).toBeTruthy();
      // Use toContain — innerText may truncate special chars like " in product name
      expect(firstProductName).toContain((data as any).name.split('"')[0]);
      expect((data as any).quantity).toBeGreaterThanOrEqual(1);
      expect(typeof (data as any).price).toBe('number');
      expect((data as any).addedAt).toBeTruthy();
    });

    // ── Step 6: Verify cart count badge updated ───────────────────
    await addAllureStep('Verify cart count badge updated', async () => {
      const count = await productPage.getCartCount();
      expect(count).toBeGreaterThan(0);
    });

    await attachScreenshot(page, 'Product added to cart');
  });

});

test.describe('Scenario 4 — View Cart', () => {

  test('should load cart and capture GET /api/cart', async ({ page }) => {
    addTestAnnotation('API', 'GET /api/cart');
    addTestAnnotation('Scenario', '4 — View Cart');

    // Use fresh page navigation for this test — no dependency on prior test state
    const productPage = new ProductPage(page);
    const cartPage    = new CartPage(page);

    // ── Step 1: Login ─────────────────────────────────────────────
    await addAllureStep('Login as admin', () => loginAsAdmin(page));

    // ── Step 2: Add a product first ───────────────────────────────
    await addAllureStep('Add product to cart', async () => {
      await productPage.navigate();
      await productPage.addProductToCart(0);
    });

    // ── Step 3: Navigate to cart and capture GET /api/cart ────────
    let apiResponse: Awaited<ReturnType<typeof cartPage.navigate>>;

    await addAllureStep('Navigate to cart — capture GET /api/cart', async () => {
      apiResponse = await cartPage.navigate();

      // ✅ Validate: HTTP status 200
      assertResponseStatus(apiResponse!, 200, 'GET /api/cart');

      await logResponse(apiResponse!, 'GET /api/cart');
    });

    // ── Step 4: Validate response schema ─────────────────────────
    await addAllureStep('Validate cart list response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, CartListSchema, 'Cart GET Response');

      // ✅ Validate: items array returned (may be empty for fresh session)
      expect(Array.isArray((data as any).items)).toBe(true);
      expect(typeof (data as any).total).toBe('number');
      expect(typeof (data as any).itemCount).toBe('number');
    });

    // ── Step 5: Verify cart UI shows item ────────────────────────
    await addAllureStep('Verify cart items are displayed', async () => {
      const count = await cartPage.getCartItemCount();
      expect(count).toBeGreaterThan(0);

      const total = await cartPage.getTotal();
      expect(total).toMatch(/\$/);
    });

    await attachScreenshot(page, 'Cart page — items loaded');
  });

  test('should remove an item from cart and capture DELETE /api/cart/:id', async ({ page }) => {
    addTestAnnotation('API', 'DELETE /api/cart/:id');
    addTestAnnotation('Scenario', '4 — Remove from Cart');

    const productPage = new ProductPage(page);
    const cartPage    = new CartPage(page);

    // Setup: login + add item
    await addAllureStep('Login and add product', async () => {
      await loginAsAdmin(page);
      await productPage.navigate();
      await productPage.addProductToCart(0);
    });

    // Navigate to cart
    await addAllureStep('Open cart', () => cartPage.navigate());

    // ── Remove item and capture DELETE ────────────────────────────
    let deleteResponse: Awaited<ReturnType<typeof cartPage.removeItem>>;

    await addAllureStep('Remove item — capture DELETE /api/cart/:id', async () => {
      deleteResponse = await cartPage.removeItem(0);

      // ✅ Validate: HTTP status 200
      assertResponseStatus(deleteResponse!, 200, 'DELETE /api/cart/:id');

      await logResponse(deleteResponse!, 'DELETE /api/cart/:id');
    });

    // ── Validate remove response schema ───────────────────────────
    await addAllureStep('Validate remove response schema (AJV)', async () => {
      const data = await validateResponseSchema(deleteResponse!, RemoveCartSchema, 'Remove Cart Response');
      expect((data as any).message).toBeTruthy();
      expect((data as any).id).toBeTruthy();
    });

    await attachScreenshot(page, 'Cart after item removed');
  });

});
