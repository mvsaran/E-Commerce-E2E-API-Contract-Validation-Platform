/**
 * pages/CheckoutPage.ts — Checkout Page Object
 * 
 * Encapsulates all interactions with the checkout form page.
 * Used in: tests/checkout.spec.ts
 */

import { Page, Locator, Response } from '@playwright/test';

export interface CustomerData {
  firstName: string;
  lastName:  string;
  address:   string;
  city:      string;
  phone:     string;
}

export class CheckoutPage {
  readonly page: Page;

  // ── Locators ────────────────────────────────────────────────────
  readonly firstNameInput:  Locator;
  readonly lastNameInput:   Locator;
  readonly addressInput:    Locator;
  readonly cityInput:       Locator;
  readonly phoneInput:      Locator;
  readonly placeOrderBtn:   Locator;
  readonly orderReview:     Locator;
  readonly checkoutForm:    Locator;

  constructor(page: Page) {
    this.page            = page;
    this.firstNameInput  = page.locator('#first-name');
    this.lastNameInput   = page.locator('#last-name');
    this.addressInput    = page.locator('#address');
    this.cityInput       = page.locator('#city');
    this.phoneInput      = page.locator('#phone');
    this.placeOrderBtn   = page.locator('#place-order-btn');
    this.orderReview     = page.locator('#order-review');
    this.checkoutForm    = page.locator('#checkout-form');
  }

  /**
   * Navigate to the checkout page.
   */
  async navigate(): Promise<void> {
    await this.page.goto('/checkout.html');
    await this.page.waitForLoadState('networkidle');
    await this.firstNameInput.waitFor({ state: 'visible' });
  }

  /**
   * Fills in all customer delivery detail fields.
   * @param data  CustomerData object
   */
  async fillForm(data: CustomerData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.addressInput.fill(data.address);
    await this.cityInput.fill(data.city);
    await this.phoneInput.fill(data.phone);
  }

  /**
   * Submits the checkout form (clicks Place Order).
   * Waits for POST /api/checkout API call and captures the response.
   * 
   * @returns The captured POST /api/checkout response
   */
  async placeOrder(): Promise<Response> {
    const [apiResponse] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/api/checkout') && r.request().method() === 'POST'),
      this.placeOrderBtn.click(),
    ]);
    return apiResponse;
  }

  /**
   * Full checkout flow: fill form + place order.
   * @param data  CustomerData
   * @returns     The captured API response
   */
  async checkout(data: CustomerData): Promise<Response> {
    await this.fillForm(data);
    return await this.placeOrder();
  }

  /**
   * Wait for redirect to order confirmation page.
   */
  async waitForOrderConfirmation(): Promise<void> {
    await this.page.waitForURL('**/order-confirmation.html', { timeout: 10_000 });
  }

  /**
   * Returns the text content of the order review panel.
   */
  async getOrderReviewText(): Promise<string> {
    return this.orderReview.innerText();
  }
}
