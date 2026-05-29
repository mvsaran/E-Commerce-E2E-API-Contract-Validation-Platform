/**
 * pages/OrderPage.ts — Order Confirmation / History Page Object
 * 
 * Encapsulates all interactions with the order history page.
 * Used in: tests/order-history.spec.ts
 */

import { Page, Locator, Response } from '@playwright/test';

export class OrderPage {
  readonly page: Page;

  // ── Locators ────────────────────────────────────────────────────
  readonly ordersContainer:  Locator;
  readonly orderCards:       Locator;
  readonly loadingState:     Locator;
  readonly emptyOrders:      Locator;
  readonly newOrderBanner:   Locator;
  readonly latestOrderId:    Locator;
  readonly orderCountLabel:  Locator;

  constructor(page: Page) {
    this.page             = page;
    this.ordersContainer  = page.locator('#orders-container');
    this.orderCards       = page.locator('[data-testid^="order-card-"]');
    this.loadingState     = page.locator('#loading-state');
    this.emptyOrders      = page.locator('#empty-orders');
    this.newOrderBanner   = page.locator('#new-order-banner');
    this.latestOrderId    = page.locator('#latest-order-id');
    this.orderCountLabel  = page.locator('#order-count-label');
  }

  /**
   * Navigate to the order history page.
   * Captures and returns the GET /api/orders response.
   */
  async navigate(): Promise<Response> {
    const [apiResponse] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/api/orders') && r.request().method() === 'GET'),
      this.page.goto('/order-confirmation.html'),
    ]);
    // Wait for loading to finish
    await this.page.waitForLoadState('networkidle');
    return apiResponse;
  }

  /**
   * Wait for order cards to become visible.
   */
  async waitForOrders(): Promise<void> {
    await this.ordersContainer.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Returns the number of order cards rendered.
   */
  async getOrderCount(): Promise<number> {
    return this.orderCards.count();
  }

  /**
   * Returns the order ID text of the first (newest) order card.
   */
  async getFirstOrderId(): Promise<string> {
    return this.orderCards.first().locator('#order-id').innerText();
  }

  /**
   * Returns the status badge text of the first order card.
   */
  async getFirstOrderStatus(): Promise<string> {
    return this.orderCards.first().locator('#order-status').innerText();
  }

  /**
   * Returns true if the success banner (new order) is visible.
   */
  async isSuccessBannerVisible(): Promise<boolean> {
    return this.newOrderBanner.isVisible();
  }

  /**
   * Returns the order ID displayed in the new-order success banner.
   */
  async getLatestOrderIdFromBanner(): Promise<string> {
    await this.latestOrderId.waitFor({ state: 'visible' });
    return this.latestOrderId.innerText();
  }

  /**
   * Returns the order count label text.
   */
  async getOrderCountLabel(): Promise<string> {
    return this.orderCountLabel.innerText();
  }

  /**
   * Returns true if the empty-orders state is shown.
   */
  async isEmpty(): Promise<boolean> {
    return this.emptyOrders.isVisible();
  }
}
