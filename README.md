# E-Commerce E2E + API Contract Validation Platform

> **Portfolio-Grade** integration of Playwright UI automation, Postman API contract testing, AJV schema validation, Faker-generated test data, and Allure reporting — all wired into a realistic e-commerce application.

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
PLAYWRIGHTPOSTMANINTEGRATION/
├── frontend/                        # HTML/CSS/Vanilla JS application
│   ├── login.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order-confirmation.html
│   ├── css/styles.css
│   └── js/                          # Per-page JS modules + shared api.js client
│
├── backend/                         # Express TypeScript API server
│   ├── server.ts                    # Entry point — mounts all routes
│   ├── routes/                      # auth, products, cart, orders
│   └── data/                        # Seed JSON files (users, products, orders)
│
├── tests/                           # Playwright test specs (6 scenarios)
│   ├── login.spec.ts
│   ├── product.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   ├── order-history.spec.ts
│   └── postman.fixture.ts           # attachNetworkCapture fixture
│
├── pages/                           # Page Object Model classes
│   ├── LoginPage.ts
│   ├── ProductPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── OrderPage.ts
│
├── schemas/                         # AJV JSON schemas for response validation
│   ├── LoginSchema.ts
│   ├── ProductSchema.ts
│   ├── CartSchema.ts
│   ├── CheckoutSchema.ts
│   └── OrderSchema.ts
│
├── utils/
│   ├── fakerData.ts                 # Faker-generated test credentials & data
│   ├── schemaValidator.ts           # AJV wrapper used inline in tests
│   └── reportHelper.ts             # Allure step/attachment helpers
│
├── postman/
│   ├── collections/
│   │   └── Ecommerce E2E + API Contract Validation/
│   │       ├── 1. Login.request.yaml
│   │       ├── 2. Get Products.request.yaml
│   │       ├── 3. Add to Cart.request.yaml
│   │       ├── 4. Get Cart.request.yaml
│   │       ├── 5. Checkout.request.yaml
│   │       └── 6. Get Orders.request.yaml
│   └── environments/
│       └── Local.environment.yaml
│
├── scripts/
│   ├── start-backend.js             # Spawns Express for postman:test scripts
│   └── stop-backend.js
│
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
├── global-setup.ts                  # Starts Express before Playwright runs
├── global-teardown.ts               # Stops Express after all tests complete
├── playwright.config.ts
├── postman.config.cjs
├── .env.example
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18.0 | Required |
| npm | ≥ 9.0 | Required |
| Postman CLI | latest | Required for `postman app test` — [install here](https://learning.postman.com/docs/postman-cli/postman-cli-installation/) |
| Allure CLI | latest | Optional, for HTML reports — `npm install -g allure-commandline` |

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd PLAYWRIGHTPOSTMANINTEGRATION

npm install
npx playwright install chromium
```

---

### 2. Configure Environment

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and set your Postman API key (required only for `postman app test`):

```env
POSTMAN_API_KEY=your-postman-api-key-here
```

> Get your API key from: https://go.postman.co/settings/me/api-keys

---

### 3. Link Repo to Postman Workspace

Before running `postman app test`, link this project to your Postman workspace:

```bash
postman app init
```

This is interactive — it asks which collections and environment to use, then writes `postman.config.cjs`. The file is already committed and pre-configured; you only need to run `init` if starting fresh.

---

### 4. Start the Backend (manual, optional)

The backend starts and stops **automatically** during Playwright runs via `global-setup.ts` / `global-teardown.ts`. To start it manually for local exploration:

```bash
npm run start
# → Express server at http://localhost:3000
# → Frontend at   http://localhost:3000/login.html
```

---

## 🧪 Running Tests

### Playwright Tests (all 6 scenarios)

```bash
npm test
# or
npx playwright test
```

### Playwright — Headed Mode (watch the browser)

```bash
npm run test:headed
```

### Playwright — Interactive UI Mode

```bash
npm run test:ui
```

### Playwright — Debug Mode

```bash
npm run test:debug
```

---

## 📬 Postman Application Test

Runs Playwright tests **and** validates the captured API traffic against your Postman collection in one command.

### Windows — Command Prompt

```cmd
set CI=true && postman app test --command "npx playwright test"
```

### Windows — PowerShell

```powershell
$env:CI="true"; postman app test --command "npx playwright test"
```

### macOS / Linux

```bash
CI=true postman app test --command "npx playwright test"
```

### Using npm scripts (cross-platform, recommended)

`cross-env` is already installed as a dev dependency:

```bash
npm run postman:test
```

### Target a specific environment

```bash
# Windows CMD
set CI=true && postman app test --command "npx playwright test" --target staging

# PowerShell
$env:CI="true"; postman app test --command "npx playwright test" --target staging

# npm script
npm run postman:test:staging
```

### Capture only (generate collection from traffic, no validation)

```bash
npm run postman:capture
# or
postman app test --capture-only
```

> **`CI=true` explained** — without it, results stay in your terminal only. With it, results are pushed to Postman Application Inventory so you can track contract drift over time.

---

## 📊 Reports

### Allure Report

```bash
# Generate report from allure-results/
npm run allure:generate

# Open report in browser
npm run allure:serve
```

### Playwright HTML Report

After any test run, open:

```
playwright-report/index.html
```

Or run:

```bash
npx playwright show-report
```

### Newman Collection Report

```bash
npm run postman:run
# Results saved to test-results/newman-results.json
```

---

## 🔌 Backend API Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/api/auth/login` | ❌ | Authenticate user, returns JWT token |
| `GET` | `/api/products` | ✅ | List all products |
| `POST` | `/api/cart` | ✅ | Add product to cart |
| `GET` | `/api/cart` | ✅ | Get current cart contents |
| `DELETE` | `/api/cart/:id` | ✅ | Remove item from cart |
| `POST` | `/api/checkout` | ✅ | Place order, clears cart |
| `GET` | `/api/orders` | ✅ | List all orders |

### Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `password123` | admin |

---

## 🧩 Test Scenarios

| # | Scenario | Spec File | API Captured | Assertions |
|---|----------|-----------|-------------|------------|
| 1 | Login | `login.spec.ts` | `POST /api/auth/login` | Status 200, JWT token, user schema |
| 2 | View Products | `product.spec.ts` | `GET /api/products` | Status 200, products array, schema |
| 3 | Add to Cart | `cart.spec.ts` | `POST /api/cart` | Status 201, cart item, schema |
| 4 | View Cart | `cart.spec.ts` | `GET /api/cart` | Status 200, items array, schema |
| 5 | Checkout | `checkout.spec.ts` | `POST /api/checkout` | Status 201, orderId, schema |
| 6 | Order History | `order-history.spec.ts` | `GET /api/orders` | Status 200, orders array, schema |

---

## 📈 Expected Results

| Metric | Expected |
|--------|----------|
| Playwright Tests | ✅ All passed |
| AJV Schema Validations | ✅ All passed |
| Newman Collection Run | ✅ All passed |
| Postman App — Requests Captured | > 0 |
| Postman App — Requests Matched | > 0 |
| Postman App — Assertion Failures | 0 |

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

The GitHub Actions workflow at `.github/workflows/ci.yml`:

1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies and Playwright browsers
4. Runs all Playwright tests (backend auto-starts via global-setup)
5. Generates Allure report
6. Uploads test artifacts (videos, traces, screenshots)
7. Runs Newman collection validation

---

## 🐛 Known Issues & Fixes Applied

### `SecurityError: Failed to read 'localStorage'` — all tests failing

**Cause:** `page.evaluate(() => localStorage.clear())` was called before any navigation, leaving the browser context on `about:blank` where Chromium blocks storage access.

**Fix in `pages/LoginPage.ts`:** Navigate to the page first, then clear `localStorage` within the correct origin.

```typescript
async navigate(): Promise<void> {
  await this.page.goto('/login.html');                 // ✅ establish origin first
  await this.page.evaluate(() => {
    try { localStorage.clear(); } catch (_) {}         // ✅ safe — same origin
  });
  await this.page.waitForLoadState('networkidle');
}
```

### JWT bleeding across tests (shared browser context)

**Cause:** `workers: 1` reuses the same browser context across tests. A successful login writes a JWT to `localStorage` that persists into the next test.

**Fix in `playwright.config.ts`:** Added `storageState: { cookies: [], origins: [] }` to the `use` block so every test starts with a clean slate.

### `postman app test` fails on Windows with `CI=true`

**Cause:** `VAR=value command` syntax is bash-only and not recognised by Windows Command Prompt or PowerShell.

**Fix:** Use the platform-correct syntax:

```cmd
# CMD
set CI=true && postman app test --command "npx playwright test"

# PowerShell
$env:CI="true"; postman app test --command "npx playwright test"

# Cross-platform (npm script using cross-env)
npm run postman:test
```

---

## 📝 Key Integration Points

| File | Purpose |
|------|---------|
| `global-setup.ts` | Auto-starts Express server before Playwright runs |
| `global-teardown.ts` | Cleanly stops Express after all tests complete |
| `tests/postman.fixture.ts` | Wraps Playwright's `test` with `attachNetworkCapture` for traffic recording |
| `playwright.config.ts` | `withPostman()` wrapper enables Postman network interception |
| `postman.config.cjs` | Maps captured traffic to collection name and environment name |
| `utils/schemaValidator.ts` | AJV validates every API response inline during tests |
| `utils/fakerData.ts` | Generates realistic customer/product data per test run |
| `utils/reportHelper.ts` | Attaches API captures and screenshots to Allure steps |
