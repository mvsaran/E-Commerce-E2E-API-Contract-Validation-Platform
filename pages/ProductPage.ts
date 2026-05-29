/**
 * pages/ProductPage.ts — Products Page Object
 * 
 * Encapsulates all interactions with the products listing page.
 * Used in: tests/product.spec.ts, tests/cart.spec.ts
 */

import { Page, Locator, Response } from '@playwright/test';

export class ProductPage {
  readonly page: Page;

  // ── Locators ────────────────────────────────────────────────────
  readonly productsGrid:    Locator;
  readonly productCards:    Locator;
  readonly addToCartBtns:   Locator;
  readonly cartCountBadge:  Locator;
  readonly loadingIndicator: Locator;
  readonly productCount:    Locator;
  readonly cartFloatingBtn: Locator;
  readonly navCart:         Locator;

  constructor(page: Page) {
    this.page             = page;
    this.productsGrid     = page.locator('#products-grid');
    this.productCards     = page.locator('.product-card');
    this.addToCartBtns    = page.locator('.add-to-cart-btn');
    this.cartCountBadge   = page.locator('#cart-count');
    this.loadingIndicator = page.locator('#loading-indicator');
    this.productCount     = page.locator('#product-count');
    this.cartFloatingBtn  = page.locator('#view-cart-btn');
    this.navCart          = page.locator('#nav-cart');
  }

  /**
   * Navigate to the products page.
   * Waits for the API call to complete and products to render.
   */
  async navigate(): Promise<Response> {
    const [apiResponse] = await Promise.all([
      // Capture the GET /api/products call specifically (exclude /api/cart)
      this.page.waitForResponse(
        r => r.url().includes('/api/products') &&
             !r.url().includes('/api/cart') &&
             r.request().method() === 'GET' &&
             r.status() === 200
      ),
      this.page.goto('/products.html'),
    ]);
    // Wait for product cards to appear (skeleton removed)
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10_000 });
    return apiResponse;
  }

  /**
   * Returns all visible product card locators.
   */
  async getProductCards(): Promise<Locator[]> {
    await this.productCards.first().waitFor({ state: 'visible' });
    return this.productCards.all();
  }

  /**
   * Returns the count of displayed products.
   */
  async getProductCount(): Promise<number> {
    return this.productCards.count();
  }

  /**
   * Get the product name at the given index (0-based).
   */
  async getProductName(index: number): Promise<string> {
    return this.productCards.nth(index).locator('.product-name').innerText();
  }

  /**
   * Get the product price at the given index (0-based).
   */
  async getProductPrice(index: number): Promise<string> {
    return this.productCards.nth(index).locator('.product-price').innerText();
  }

  /**
   * Clicks "Add to Cart" for the product at index and waits for API response.
   * 
   * @param index  0-based product index
   * @returns      The captured POST /api/cart response
   */
  async addProductToCart(index: number = 0): Promise<Response> {
    const btn = this.addToCartBtns.nth(index);
    await btn.waitFor({ state: 'visible' });

    const [apiResponse] = await Promise.all([
      // Capture POST /api/cart API call
      this.page.waitForResponse(r => r.url().includes('/api/cart') && r.request().method() === 'POST'),
      btn.click(),
    ]);

    return apiResponse;
  }

  /**
   * Get the current cart count from the navbar badge.
   * Returns 0 if badge is hidden.
   */
  async getCartCount(): Promise<number> {
    const isVisible = await this.cartCountBadge.isVisible();
    if (!isVisible) return 0;
    const text = await this.cartCountBadge.innerText();
    return parseInt(text.trim(), 10) || 0;
  }

  /**
   * Navigate to cart via the navbar link.
   */
  async goToCart(): Promise<void> {
    await this.navCart.click();
    await this.page.waitForURL('**/cart.html');
  }
}
