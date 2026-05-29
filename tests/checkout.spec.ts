/**
 * tests/checkout.spec.ts — Scenario 5: Checkout
 * 
 * Tests:
 *   1. Full checkout flow with Faker-generated customer data
 *      - Captures POST /api/checkout
 *      - Validates: status 201, orderId exists, schema valid
 *   2. Verifies redirect to order confirmation page
 * 
 * Integration point: POST /api/checkout → validated by Postman
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutSchema } from '../schemas/CheckoutSchema';
import { validateResponseSchema, assertResponseStatus } from '../utils/schemaValidator';
import { logResponse, attachScreenshot, addAllureStep, addTestAnnotation } from '../utils/reportHelper';
import { generateOrderTestData } from '../utils/fakerData';

async function loginAsAdmin(page: any) {
  const loginPage = new LoginPage(page);
  const { credentials } = generateOrderTestData();
  await loginPage.navigate();
  await loginPage.fillCredentials(credentials.email, credentials.password);
  await loginPage.submitLogin();
  await loginPage.waitForProductsPage();
}

test.describe('Scenario 5 — Checkout', () => {

  test('should complete checkout with Faker customer data and capture POST /api/checkout', async ({ page }) => {
    addTestAnnotation('API', 'POST /api/checkout');
    addTestAnnotation('Scenario', '5 — Checkout');

    const productPage  = new ProductPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Generate Faker customer data for this test run
    const { customer } = generateOrderTestData();

    // Attach Faker customer to Allure report for traceability
    await test.info().attach('🎭 Faker Customer Data', {
      body:        Buffer.from(JSON.stringify(customer, null, 2), 'utf-8'),
      contentType: 'application/json',
    });

    // ── Step 1: Login ─────────────────────────────────────────────
    await addAllureStep('Login as admin', () => loginAsAdmin(page));

    // ── Step 2: Add a product to cart ─────────────────────────────
    await addAllureStep('Add product to cart', async () => {
      await productPage.navigate();
      await productPage.addProductToCart(0);
    });

    await attachScreenshot(page, 'Product added before checkout');

    // ── Step 3: Navigate to checkout ─────────────────────────────
    await addAllureStep('Navigate to checkout page', () => checkoutPage.navigate());

    // ── Step 4: Fill form with Faker data ─────────────────────────
    await addAllureStep('Fill checkout form with Faker-generated customer', async () => {
      await checkoutPage.fillForm(customer);

      // Verify each field has been filled
      await expect(checkoutPage.firstNameInput).toHaveValue(customer.firstName);
      await expect(checkoutPage.lastNameInput).toHaveValue(customer.lastName);
      await expect(checkoutPage.addressInput).toHaveValue(customer.address);
      await expect(checkoutPage.cityInput).toHaveValue(customer.city);
      await expect(checkoutPage.phoneInput).toHaveValue(customer.phone);
    });

    await attachScreenshot(page, 'Checkout form filled');

    // ── Step 5: Place order and capture API ───────────────────────
    let apiResponse: Awaited<ReturnType<typeof checkoutPage.placeOrder>>;

    await addAllureStep('Place order — capture POST /api/checkout', async () => {
      apiResponse = await checkoutPage.placeOrder();

      // ✅ Validate: HTTP status 201 (Order Created)
      assertResponseStatus(apiResponse!, 201, 'POST /api/checkout');

      await logResponse(apiResponse!, 'POST /api/checkout');
    });

    // ── Step 6: Validate response schema ─────────────────────────
    await addAllureStep('Validate checkout response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, CheckoutSchema, 'Checkout Response');

      // ✅ Validate: orderId exists
      expect((data as any).orderId).toBeTruthy();
      expect((data as any).orderId).toMatch(/^ORD-/);

      // ✅ Validate: status is confirmed
      expect((data as any).status).toBe('confirmed');

      // ✅ Validate: items array contains items
      expect(Array.isArray((data as any).items)).toBe(true);
      expect((data as any).items.length).toBeGreaterThan(0);

      // ✅ Validate: total is a positive number
      expect((data as any).total).toBeGreaterThan(0);

      // ✅ Validate: customer data matches what was submitted
      expect((data as any).customer.firstName).toBe(customer.firstName);
      expect((data as any).customer.lastName).toBe(customer.lastName);
    });

    // ── Step 7: Verify redirect to order confirmation ─────────────
    await addAllureStep('Verify redirect to order confirmation page', async () => {
      await checkoutPage.waitForOrderConfirmation();
      await expect(page).toHaveURL(/order-confirmation\.html/);
    });

    await attachScreenshot(page, 'Order confirmation page');
  });

  test('should show order review panel with cart items', async ({ page }) => {
    addTestAnnotation('API', 'GET /api/cart (checkout preview)');

    const productPage  = new ProductPage(page);
    const checkoutPage = new CheckoutPage(page);

    await addAllureStep('Login and add product', async () => {
      await loginAsAdmin(page);
      await productPage.navigate();
      await productPage.addProductToCart(0);
    });

    await addAllureStep('Navigate to checkout', () => checkoutPage.navigate());

    await addAllureStep('Verify order review panel', async () => {
      const reviewText = await checkoutPage.getOrderReviewText();
      expect(reviewText.length).toBeGreaterThan(0);
      expect(reviewText).toMatch(/\$/);  // Contains a price
    });

    await attachScreenshot(page, 'Checkout — order review panel');
  });

});
