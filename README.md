# E-Commerce E2E + API Contract Validation Platform

> **Portfolio-Grade** integration of Playwright UI automation, Postman API contract testing, AJV schema validation, Faker-generated test data, and Allure reporting — all wired into a realistic e-commerce application.
>
> Based on the official Postman article: [Validate APIs During Your Playwright Tests with Postman](https://blog.postman.com/validate-apis-during-your-playwright-tests-with-postman/)

---

## 💡 Why This Exists

Every Playwright run already produces the most realistic API traffic your product makes — real auth, real payloads, real ordering — and almost every team throws it away. The UI test passes, the API layer underneath could be silently broken, and nobody notices until production.

This project wires Postman's `postman app test` into a Playwright suite so the captured network traffic does real work: validates contracts, surfaces drift, documents dependencies, and stops **UI-green-but-API-broken** bugs before they ship.

### What this catches that UI tests alone don't

| Problem | Description |
|---------|-------------|
| **False green tests** | UI looks correct, but the wrong endpoint was called or the payload is wrong |
| **Silent degradation** | A backend error gets swallowed by a graceful UI fallback — test passes, UX is broken |
| **Contract drift** | Schema, header, or content-type changes the UI tolerates but downstream consumers won't |
| **Poor diagnosability** | A flaky failure becomes a 30-minute trace dive — structured captures turn it into a one-line answer |

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

### Step 1 — Link your repo to a Postman workspace

Before running `postman app test`, your project must be linked to a Postman workspace through Postman's native Git integration.

👉 Follow the official guide: [Connect your Git project to your workspace](https://learning.postman.com/docs/agent-mode/native-git#connect-your-git-project-to-your-workspace)

Once linked, your `postman/` folder (collections + environments) syncs with your workspace automatically.

---

### Step 2 — Install the CLI and the Playwright plugin

```bash
npm install -g postman-cli
npm install -D postman-playwright
```

Or install all project dependencies at once:

```bash
npm install
npx playwright install chromium
```

---

### Step 3 — Wrap your Playwright test fixture

The `postman-playwright` plugin attaches network capture to your Playwright fixture. This is already done in `tests/postman.fixture.ts`:

```typescript
import { test as base, expect } from '@playwright/test';
import { attachNetworkCapture } from 'postman-playwright';

export { expect };
export const test = attachNetworkCapture(base);
```

Every spec file imports `test` from this fixture instead of directly from `@playwright/test`, so all network traffic is automatically captured.

---

### Step 4 — Initialize your application

In the root of your project, run:

```bash
postman app init
```

This is interactive. It asks which collections describe the APIs your app depends on, which environment to use, and which UI command to run. It writes the answers to `postman.config.cjs` — already committed and pre-configured in this project:

```javascript
module.exports = {
  command: 'npx playwright test',
  targets: {
    default: {
      environment: 'Local',
      collections: ['Ecommerce E2E + API Contract Validation'],
    },
    staging: {
      environment: 'Local',
      collections: ['Ecommerce E2E + API Contract Validation'],
    },
  },
  filters: {
    urlPatterns: ['\\.css$', '\\.js$', '\\.png$', '^data:', /* ... */],
  },
};
```

> **Targets** are named runtime setups. The same repo can validate against `default`, `staging`, or `prod` without rewriting config — handy when you want different dependency surfaces in CI vs a developer laptop.

You only need to re-run `postman app init` if starting a fresh clone without the committed config.

---

### Step 5 — Run it

#### Windows — Command Prompt

```cmd
set CI=true && postman app test --command "npx playwright test"
```

#### Windows — PowerShell

```powershell
$env:CI="true"; postman app test --command "npx playwright test"
```

#### macOS / Linux

```bash
CI=true postman app test --command "npx playwright test"
```

#### Cross-platform via npm script (recommended)

`cross-env` is already installed as a dev dependency:

```bash
npm run postman:test
```

> **`CI=true` explained** — without it, results stay in your terminal only, useful while iterating locally. With it, results are pushed to Postman Application Inventory so you can track contract drift over time.

---

## 🧪 What You'll See

In the terminal after a run:

```
✔ 1. Login       [POST] /api/auth/login   (6 passed, 0 failed)
✔ 2. Get Products [GET] /api/products     (4 passed, 0 failed)
✔ 4. Get Cart     [GET] /api/cart         (5 passed, 0 failed)

requests captured  │ 149  (195 filtered, 64 deduplicated)
requests matched   │ 42 matched  ★ 43 not matched
assertions         │ 215 total  ★ 203 passed  ★ 12 failed
```

- **Playwright tests passed/failed** — UI layer
- **API calls captured** — every real HTTP request made during the run
- **Matched calls** — captured requests that correspond to a collection request, with `pm.test` assertion results
- **Unmatched calls** — potential coverage gaps (endpoints your app calls but have no Postman tests yet)

The same data lands in **Application Inventory** in your Postman workspace: a continuously-updated view of which APIs your application calls, which have test coverage, and which dependency contracts have drifted.

---

## 🧪 Running Tests

### Playwright only (all 6 scenarios)

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

### Target a specific environment

```cmd
# Windows CMD
set CI=true && postman app test --command "npx playwright test" --target staging

# PowerShell
$env:CI="true"; postman app test --command "npx playwright test" --target staging

# npm script
npm run postman:test:staging
```

---

## 📸 Capture Only (no collections yet?)

The most common objection is: *"We don't have Postman collections for our APIs yet."*

That's exactly what `--capture-only` is for:

```bash
npm run postman:capture
# or
postman app test --capture-only
```

In `--capture-only` mode the CLI skips validation and instead **generates a draft Postman collection** from the traffic your UI tests produced. From there you can:

1. Review the captured requests and trim the ones you don't care about
2. Ask Postman's Agent Mode to generate `pm.test` assertions from the observed responses
3. Save the result as a real collection and switch to `postman app test` for ongoing validation

The same UI traffic that powers validation today becomes the foundation of a growing API contract suite over time — no one has to sit down and write the first hundred tests by hand.

---

## 🔇 Noise Controls

Real apps are noisy. Fonts, analytics, hot-reload sockets, telemetry beacons — none of that should fail your build. Filter it out in `postman.config.cjs`:

```javascript
filters: {
  urlPatterns: ['fonts.googleapis.com', 'localhost:3007', 'fonts.gstatic.com'],
  methods: ['OPTIONS'],
  headers: { 'x-client': 'analytics' },
},
```

Anything matching a filter is ignored before matching, so it can't trigger an under- or over-coverage warning.

---

## 📊 Reports

### Allure Report

```bash
npm run allure:generate   # generate from allure-results/
npm run allure:serve      # open in browser
```

### Playwright HTML Report

```bash
npx playwright show-report
# or open playwright-report/index.html directly
```

### Newman Collection Report

```bash
npm run postman:run
# Results saved to test-results/newman-results.json
```

---

## 🔌 Backend API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
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
4. Runs all Playwright tests (backend auto-starts via `global-setup.ts`)
5. Generates Allure report
6. Uploads test artifacts (videos, traces, screenshots)
7. Runs Newman collection validation

---

## 🐛 Known Issues & Fixes Applied

### `SecurityError: Failed to read 'localStorage'` — all tests failing

**Cause:** `page.evaluate(() => localStorage.clear())` was called before any navigation, leaving the browser context on `about:blank` where Chromium blocks storage access.

**Fix in `pages/LoginPage.ts`:** Navigate first, then clear `localStorage` within the correct origin.

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

**Cause:** `workers: 1` reuses the same browser context. A successful login writes a JWT to `localStorage` that persists into the next test.

**Fix in `playwright.config.ts`:** Added `storageState: { cookies: [], origins: [] }` to the `use` block so every test starts with a clean slate.

### `postman app test` fails on Windows with `CI=true`

**Cause:** `VAR=value command` syntax is bash-only and not recognised by Windows Command Prompt or PowerShell.

**Fix:** Use the platform-correct syntax shown in [Step 5](#step-5--run-it), or use `npm run postman:test` which uses `cross-env` under the hood.

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

---

## 📚 Resources

- [Validate APIs During Your Playwright Tests with Postman](https://blog.postman.com/validate-apis-during-your-playwright-tests-with-postman/) — Official Postman article this project is based on
- [Connect your Git project to your workspace](https://learning.postman.com/docs/agent-mode/native-git#connect-your-git-project-to-your-workspace) — Postman native Git integration guide
- [Postman CLI documentation](https://learning.postman.com/docs/postman-cli/postman-cli-overview/)
- [Writing Postman test scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [postman-playwright on npm](https://www.npmjs.com/package/postman-playwright)
- [Postman Agent Mode](https://learning.postman.com/docs/agent-mode/agent-mode-overview/)
