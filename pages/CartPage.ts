/**
 * pages/CartPage.ts — Shopping Cart Page Object
 * 
 * Encapsulates all interactions with the cart page.
 * Used in: tests/cart.spec.ts, tests/checkout.spec.ts
 */

import { Page, Locator, Response } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  // ── Locators ────────────────────────────────────────────────────
  readonly cartLayout:    Locator;
  readonly cartItemsList: Locator;
  readonly cartItems:     Locator;
  readonly emptyCart:     Locator;
  readonly checkoutBtn:   Locator;
  readonly summaryTotal:  Locator;
  readonly summaryTax:    Locator;
  readonly loadingState:  Locator;

  constructor(page: Page) {
    this.page           = page;
    this.cartLayout     = page.locator('#cart-layout');
    this.cartItemsList  = page.locator('#cart-items-list');
    this.cartItems      = page.locator('.cart-item');
    this.emptyCart      = page.locator('#empty-cart');
    this.checkoutBtn    = page.locator('#checkout-btn');
    this.summaryTotal   = page.locator('#summary-total');
    this.summaryTax     = page.locator('#summary-tax');
    this.loadingState   = page.locator('#loading-state');
  }

  /**
   * Navigate to the cart page.
   * Captures and returns the GET /api/cart API response.
   */
  async navigate(): Promise<Response> {
    const [apiResponse] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/api/cart') && r.request().method() === 'GET'),
      this.page.goto('/cart.html'),
    ]);
    // Wait for loading to complete
    await this.cartLayout.waitFor({ state: 'visible', timeout: 10_000 });
    return apiResponse;
  }

  /**
   * Wait for the cart to finish loading (after navigation).
   */
  async waitForLoad(): Promise<void> {
    await this.cartLayout.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Returns all cart item row locators.
   */
  async getCartItems(): Promise<Locator[]> {
    return this.cartItems.all();
  }

  /**
   * Returns the number of cart items displayed.
   */
  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  /**
   * Returns the name of the cart item at the given index.
   */
  async getCartItemName(index: number): Promise<string> {
    return this.cartItems.nth(index).locator('.cart-item-name').innerText();
  }

  /**
   * Returns the price text of the cart item at the given index.
   */
  async getCartItemPrice(index: number): Promise<string> {
    return this.cartItems.nth(index).locator('.cart-item-price').innerText();
  }

  /**
   * Clicks "Remove" on a cart item and waits for the DELETE API call.
   * 
   * @param index  0-based cart item index
   * @returns      The captured DELETE /api/cart/:id response
   */
  async removeItem(index: number = 0): Promise<Response> {
    const removeBtn = this.cartItems.nth(index).locator('.remove-btn');
    const cartItemId = await this.cartItems.nth(index).getAttribute('data-cart-item-id');

    const [apiResponse] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/api/cart') && r.request().method() === 'DELETE'),
      removeBtn.click(),
    ]);

    return apiResponse;
  }

  /**
   * Returns the displayed order total string.
   */
  async getTotal(): Promise<string> {
    return this.summaryTotal.innerText();
  }

  /**
   * Clicks "Proceed to Checkout" button.
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutBtn.click();
    await this.page.waitForURL('**/checkout.html');
  }

  /**
   * Checks whether the empty-cart state is visible.
   */
  async isEmpty(): Promise<boolean> {
    return this.emptyCart.isVisible();
  }
}
