# E-Commerce E2E + API Contract Validation Platform

> **Portfolio-Grade** integration of Playwright UI automation, Postman API/contract testing, AJV schema validation, Faker-generated test data, and Allure reporting — all wired into a realistic e-commerce application.

---

## 🏗 Architecture

```
Browser UI (HTML/CSS/JS)
       ↓
  Playwright Tests (TypeScript + POM)
       ↓
  Backend APIs (Node.js / Express / TypeScript)
       ↓
  Network Capture (postman-playwright)
       ↓
  Postman Application Test
       ↓
  Contract Validation (AJV)
       ↓
  Allure + HTML Reports
```

---

## 📁 Project Structure

```
ecommerce-playwright-postman/
├── frontend/                     # HTML/CSS/Vanilla JS application
│   ├── login.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order-confirmation.html
│   ├── css/styles.css
│   └── js/                       # Per-page JS + shared api.js client
│
├── backend/                      # Express TypeScript API server
│   ├── server.ts                 # Entry point, mounts routes
│   ├── routes/                   # auth, products, cart, orders
│   └── data/                     # Seed JSON files
│
├── tests/                        # Playwright test specs (6 scenarios)
├── pages/                        # Page Object Model classes
├── schemas/                      # AJV JSON schemas
├── utils/                        # fakerData, schemaValidator, reportHelper
│
├── postman/
│   ├── collections/Ecommerce.collection.json
│   └── environments/Local.environment.json
│
├── global-setup.ts               # Starts Express before tests
├── global-teardown.ts            # Stops Express after tests
├── playwright.config.ts
├── postman.config.js
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- **Allure CLI** (for reports): `npm install -g allure-commandline`
- **Newman** (for collection runs): included in devDependencies
- **Postman CLI** (optional, for `postman application test`): [download here](https://learning.postman.com/docs/postman-cli/postman-cli-installation/)

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env — add your POSTMAN_API_KEY if using postman application test
```

### 3. Start the Application

```bash
npm run start
# → Express server running at http://localhost:3000
# → Frontend served at http://localhost:3000/login.html
```

---

## 🧪 Running Tests

### Playwright Tests (all scenarios)

```bash
npx playwright test
```

### Playwright with UI Mode (interactive)

```bash
npm run test:ui
```

### Playwright Headed (watch the browser)

```bash
npm run test:headed
```

### Generate & Serve Allure Report

```bash
npm run allure:generate
npm run allure:serve
```

### Run Postman Collection via Newman

```bash
npm run postman:run
```

### Run Postman Application Test (requires Postman CLI + API key)

```powershell
$env:CI="true"
postman application test
```

---

## 🔌 Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user, returns JWT token |
| `GET` | `/api/products` | List all products |
| `POST` | `/api/cart` | Add product to cart |
| `GET` | `/api/cart` | Get current cart |
| `DELETE` | `/api/cart/:id` | Remove item from cart |
| `POST` | `/api/checkout` | Place order from cart |
| `GET` | `/api/orders` | List all orders |

### Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `password123` | admin |

---

## 🧩 Test Scenarios

| # | Scenario | API Captured | Validated |
|---|----------|-------------|-----------|
| 1 | Login | `POST /api/auth/login` | Status 200, token, schema |
| 2 | View Products | `GET /api/products` | Status 200, products[], schema |
| 3 | Add to Cart | `POST /api/cart` | Status 201, cartItem, schema |
| 4 | View Cart | `GET /api/cart` | Status 200, items[], schema |
| 5 | Checkout | `POST /api/checkout` | Status 201, orderId, schema |
| 6 | Order History | `GET /api/orders` | Status 200, orders[], schema |

---

## 📊 Expected Results

| Metric | Expected |
|--------|----------|
| Playwright Tests | ✅ 6/6 Passed |
| AJV Schema Validations | ✅ All Pass |
| Postman Collection (Newman) | ✅ All Pass |
| Postman App Test — Captured | > 0 |
| Postman App Test — Matched | > 0 |
| Postman App Test — Failures | 0 |

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (dark glassmorphism), Vanilla JS |
| Backend | Node.js, Express, TypeScript |
| UI Automation | Playwright (TypeScript) |
| Test Pattern | Page Object Model (POM) |
| API Testing | Postman Collection, Newman |
| Contract Testing | AJV Schema Validation |
| Network Capture | postman-playwright |
| Test Data | @faker-js/faker |
| Reporting | Allure, Playwright HTML |
| CI/CD | GitHub Actions |

---

## 🔄 CI/CD

This project includes a GitHub Actions workflow at `.github/workflows/ci.yml` that:

1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies + Playwright browsers
4. Starts the Express backend
5. Runs all Playwright tests
6. Generates Allure report
7. Uploads test artifacts (videos, traces, screenshots)
8. Runs Newman collection validation

---

## 📝 Key Integration Points

- **`global-setup.ts`** — Auto-starts Express server before Playwright runs
- **`global-teardown.ts`** — Cleanly stops the server after all tests
- **`utils/schemaValidator.ts`** — AJV validates every API response inline during tests
- **`utils/fakerData.ts`** — Generates realistic customer/product data per test run
- **`utils/reportHelper.ts`** — Attaches API captures and screenshots to Allure steps
- **`postman.config.js`** — Wires captured HAR traffic to Postman collection replay
