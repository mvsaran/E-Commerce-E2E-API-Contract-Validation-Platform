/**
 * pages/LoginPage.ts — Login Page Object
 * 
 * Encapsulates all interactions with the login page.
 * Used in: tests/login.spec.ts
 */

import { Page, Locator, Response } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // ── Locators ────────────────────────────────────────────────────
  readonly emailInput:     Locator;
  readonly passwordInput:  Locator;
  readonly loginBtn:       Locator;
  readonly loginError:     Locator;
  readonly errorText:      Locator;
  readonly emailError:     Locator;
  readonly passwordError:  Locator;
  readonly demoCredentials: Locator;

  constructor(page: Page) {
    this.page           = page;
    this.emailInput     = page.locator('#email');
    this.passwordInput  = page.locator('#password');
    this.loginBtn       = page.locator('#login-btn');
    this.loginError     = page.locator('#login-error');
    this.errorText      = page.locator('#error-text');
    this.emailError     = page.locator('#email-error');
    this.passwordError  = page.locator('#password-error');
    this.demoCredentials = page.locator('#demo-credentials');
  }

  /**
   * Navigate to the login page.
   */
  async navigate(): Promise<void> {
    await this.page.goto('/login.html');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill email and password fields.
   * @param email
   * @param password
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form.
   * Returns the API response for POST /api/auth/login.
   */
  async submitLogin(): Promise<Response> {
    const [apiResponse] = await Promise.all([
      // Wait for the login API call
      this.page.waitForResponse(r => r.url().includes('/api/auth/login')),
      this.loginBtn.click(),
    ]);
    return apiResponse;
  }

  /**
   * Full login flow: navigate → fill → submit.
   * Waits for either redirect (success) or error message (failure).
   * 
   * @param email
   * @param password
   * @returns The captured API response
   */
  async login(email: string, password: string): Promise<Response> {
    await this.navigate();
    await this.fillCredentials(email, password);
    return await this.submitLogin();
  }

  /**
   * Get visible error message text.
   */
  async getErrorMessage(): Promise<string> {
    // Wait up to 15s for the JS to unhide the error div after API response
    await this.loginError.waitFor({ state: 'visible', timeout: 15_000 });
    return this.errorText.innerText();
  }

  /**
   * Wait for successful redirect to products page.
   */
  async waitForProductsPage(): Promise<void> {
    await this.page.waitForURL('**/products.html', { timeout: 10_000 });
  }

  /**
   * Check whether the login error banner is visible.
   */
  async isErrorVisible(): Promise<boolean> {
    return this.loginError.isVisible();
  }
}
