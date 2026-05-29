/**
 * utils/fakerData.ts
 * 
 * Generates realistic, randomised test data using @faker-js/faker.
 * Used across all Playwright specs to ensure dynamic, non-brittle tests.
 */

import { faker } from '@faker-js/faker';

// ── Customer Data ─────────────────────────────────────────────────

export interface CustomerData {
  firstName: string;
  lastName:  string;
  address:   string;
  city:      string;
  phone:     string;
  email:     string;
}

/**
 * Generates a realistic customer profile for checkout testing.
 * @returns CustomerData
 */
export function generateCustomer(): CustomerData {
  return {
    firstName: faker.person.firstName(),
    lastName:  faker.person.lastName(),
    address:   faker.location.streetAddress(),
    city:      faker.location.city(),
    phone:     faker.phone.number(),
    email:     faker.internet.email(),
  };
}

// ── Product Data ──────────────────────────────────────────────────

export interface ProductData {
  name:        string;
  category:    string;
  price:       number;
  description: string;
  stock:       number;
}

/**
 * Generates a random product (for mocking/testing purposes).
 * @returns ProductData
 */
export function generateProduct(): ProductData {
  const categories = ['electronics', 'audio', 'mobile', 'accessories', 'display', 'wearable'];
  return {
    name:        faker.commerce.productName(),
    category:    faker.helpers.arrayElement(categories),
    price:       parseFloat(faker.commerce.price({ min: 10, max: 2000, dec: 2 })),
    description: faker.commerce.productDescription(),
    stock:       faker.number.int({ min: 0, max: 100 }),
  };
}

// ── Payment / Card Data ───────────────────────────────────────────

export interface CardData {
  cardNumber: string;  // Masked
  expiry:     string;
  cvv:        string;
}

/**
 * Generates a demo credit card (masked number, not real).
 * @returns CardData
 */
export function generateCreditCard(): CardData {
  return {
    cardNumber: '4242 4242 4242 4242',   // Stripe test card format
    expiry:     faker.date.future().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }),
    cvv:        '***',
  };
}

// ── Auth / Login Data ─────────────────────────────────────────────

export interface LoginData {
  email:    string;
  password: string;
}

/**
 * Returns the default test admin credentials.
 * These match backend/data/users.json.
 */
export function getAdminCredentials(): LoginData {
  return {
    email:    process.env.TEST_EMAIL    || 'admin@test.com',
    password: process.env.TEST_PASSWORD || 'password123',
  };
}

/**
 * Generates invalid credentials for negative testing.
 */
export function generateInvalidCredentials(): LoginData {
  return {
    email:    faker.internet.email(),
    password: faker.internet.password({ length: 8 }),
  };
}

// ── Order Test Data ───────────────────────────────────────────────

export interface OrderTestData {
  customer:   CustomerData;
  credentials: LoginData;
}

/**
 * Generates a complete order test data set:
 * valid admin credentials + a Faker-generated customer profile.
 */
export function generateOrderTestData(): OrderTestData {
  return {
    customer:   generateCustomer(),
    credentials: getAdminCredentials(),
  };
}
