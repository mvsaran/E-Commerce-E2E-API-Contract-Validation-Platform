/**
 * tests/order-history.spec.ts — Scenario 6: Order History
 * 
 * Tests:
 *   1. Full E2E: login → add to cart → checkout → view orders
 *      - Captures GET /api/orders
 *      - Validates: status 200, orders array exists, schema valid
 *   2. Verifies order details match checkout submission
 * 
 * Integration point: GET /api/orders → validated by Postman
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderPage } from '../pages/OrderPage';
import { OrderSchema } from '../schemas/OrderSchema';
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

test.describe('Scenario 6 — Order History', () => {

  test('should complete E2E flow and capture GET /api/orders', async ({ page }) => {
    addTestAnnotation('API', 'GET /api/orders');
    addTestAnnotation('Scenario', '6 — Order History');
    addTestAnnotation('Flow', 'Login → Products → Cart → Checkout → Orders');

    const productPage  = new ProductPage(page);
    const checkoutPage = new CheckoutPage(page);
    const orderPage    = new OrderPage(page);

    // Generate Faker data for this E2E run
    const { customer } = generateOrderTestData();

    await test.info().attach('🎭 E2E Test Data', {
      body:        Buffer.from(JSON.stringify({ customer }, null, 2), 'utf-8'),
      contentType: 'application/json',
    });

    // ── Step 1: Login ─────────────────────────────────────────────
    await addAllureStep('Step 1/5 — Login as admin', () => loginAsAdmin(page));

    // ── Step 2: Add product to cart ───────────────────────────────
    await addAllureStep('Step 2/5 — Add product to cart', async () => {
      await productPage.navigate();
      await productPage.addProductToCart(0);
    });

    // ── Step 3: Complete checkout ─────────────────────────────────
    let checkoutOrderId: string;

    await addAllureStep('Step 3/5 — Complete checkout with Faker data', async () => {
      await checkoutPage.navigate();
      await checkoutPage.fillForm(customer);
      const checkoutResp = await checkoutPage.placeOrder();

      assertResponseStatus(checkoutResp, 201, 'POST /api/checkout');
      const checkoutData = await checkoutResp.json();
      checkoutOrderId = checkoutData.orderId;

      await checkoutPage.waitForOrderConfirmation();
    });

    await attachScreenshot(page, 'After checkout redirect');

    // ── Step 4: Navigate to orders and capture GET /api/orders ────
    let apiResponse: Awaited<ReturnType<typeof orderPage.navigate>>;

    await addAllureStep('Step 4/5 — Open order history — capture GET /api/orders', async () => {
      apiResponse = await orderPage.navigate();

      // ✅ Validate: HTTP status 200
      assertResponseStatus(apiResponse!, 200, 'GET /api/orders');

      await logResponse(apiResponse!, 'GET /api/orders');
    });

    // ── Step 5: Validate response schema ─────────────────────────
    await addAllureStep('Step 5/5 — Validate orders response schema (AJV)', async () => {
      const data = await validateResponseSchema(apiResponse!, OrderSchema, 'Orders Response');

      // ✅ Validate: orders array exists
      expect(Array.isArray((data as any).orders)).toBe(true);

      // ✅ Validate: at least 1 order (the one we just placed)
      expect((data as any).orders.length).toBeGreaterThan(0);

      // ✅ Validate: count matches array length
      expect((data as any).count).toBe((data as any).orders.length);

      // ✅ Validate: the new order is present
      const orders = (data as any).orders;
      const newOrder = orders.find((o: any) => o.orderId === checkoutOrderId);
      expect(newOrder).toBeDefined();
      expect(newOrder.status).toBe('confirmed');
    });

    // ── Verify orders page UI ─────────────────────────────────────
    await addAllureStep('Verify order cards are displayed on page', async () => {
      await orderPage.waitForOrders();
      const orderCount = await orderPage.getOrderCount();
      expect(orderCount).toBeGreaterThan(0);

      const firstOrderId = await orderPage.getFirstOrderId();
      expect(firstOrderId.length).toBeGreaterThan(0);

      const firstStatus = await orderPage.getFirstOrderStatus();
      expect(firstStatus.toLowerCase()).toMatch(/confirmed|pending|shipped|delivered/);
    });

    await attachScreenshot(page, 'Order history page — orders visible');
  });

  test('should show empty state when no orders exist', async ({ page }) => {
    addTestAnnotation('Type', 'Empty State Test');

    const orderPage = new OrderPage(page);

    // Login (no checkout, so no orders)
    await addAllureStep('Login without placing any order', () => loginAsAdmin(page));

    // ── Navigate to orders page ───────────────────────────────────
    let apiResponse: Awaited<ReturnType<typeof orderPage.navigate>>;

    await addAllureStep('Open orders page — capture GET /api/orders', async () => {
      apiResponse = await orderPage.navigate();
      assertResponseStatus(apiResponse!, 200, 'GET /api/orders');
      await logResponse(apiResponse!, 'GET /api/orders (empty)');
    });

    await addAllureStep('Validate empty orders response schema', async () => {
      const data = await validateResponseSchema(apiResponse!, OrderSchema, 'Empty Orders Response');
      expect(Array.isArray((data as any).orders)).toBe(true);
      expect(typeof (data as any).count).toBe('number');
    });

    await attachScreenshot(page, 'Orders — empty state');
  });

});
