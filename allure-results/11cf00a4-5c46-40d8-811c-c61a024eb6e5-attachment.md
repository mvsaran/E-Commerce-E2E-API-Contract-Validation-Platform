# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product.spec.ts >> Scenario 2 — Load Products >> should display products and capture GET /api/products
- Location: tests\product.spec.ts:33:7

# Error details

```
Error: Products Response: Failed to parse JSON response body (status: 200) - response.body: Protocol error (Network.getResponseBody): No resource with given identifier found
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation "Main navigation" [ref=e2]:
    - generic [ref=e3]:
      - link "ShopSphere home" [ref=e4] [cursor=pointer]:
        - /url: /products.html
        - generic [ref=e5]: 🛍
        - text: ShopSphere
      - list [ref=e6]:
        - listitem [ref=e7]:
          - link "🏪 Products" [ref=e8] [cursor=pointer]:
            - /url: /products.html
        - listitem [ref=e9]:
          - link "🛒 Cart" [ref=e10] [cursor=pointer]:
            - /url: /cart.html
        - listitem [ref=e11]:
          - link "📦 Orders" [ref=e12] [cursor=pointer]:
            - /url: /order-confirmation.html
      - generic [ref=e13]:
        - generic [ref=e14]: 👤 Admin User
        - button "Sign Out" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e19]:
        - heading "Product Catalogue" [level=1] [ref=e20]
        - paragraph [ref=e21]: 6 products
      - alert
      - list "Available products" [ref=e22]:
        - listitem [ref=e23]:
          - generic [ref=e25]: 💻
          - generic [ref=e26]:
            - generic [ref=e27]: electronics
            - generic [ref=e28]: MacBook Pro 14" M3
            - generic [ref=e29]: $1999.99
            - generic "12 in stock" [ref=e30]:
              - generic [ref=e31]: ✓
              - text: 12 in stock
          - button "Add MacBook Pro 14" [ref=e33] [cursor=pointer]: 🛒 Add to Cart
        - listitem [ref=e34]:
          - generic [ref=e36]: 🎧
          - generic [ref=e37]:
            - generic [ref=e38]: audio
            - generic [ref=e39]: Sony WH-1000XM5 Headphones
            - generic [ref=e40]: $349.99
            - generic "28 in stock" [ref=e41]:
              - generic [ref=e42]: ✓
              - text: 28 in stock
          - button "Add Sony WH-1000XM5 Headphones to cart" [ref=e44] [cursor=pointer]: 🛒 Add to Cart
        - listitem [ref=e45]:
          - generic [ref=e47]: 📱
          - generic [ref=e48]:
            - generic [ref=e49]: mobile
            - generic [ref=e50]: iPhone 15 Pro Max
            - generic [ref=e51]: $1199.99
            - generic "8 in stock" [ref=e52]:
              - generic [ref=e53]: ✓
              - text: 8 in stock
          - button "Add iPhone 15 Pro Max to cart" [ref=e55] [cursor=pointer]: 🛒 Add to Cart
        - listitem [ref=e56]:
          - generic [ref=e58]: ⌨️
          - generic [ref=e59]:
            - generic [ref=e60]: accessories
            - generic [ref=e61]: Keychron K2 Mechanical Keyboard
            - generic [ref=e62]: $89.99
            - generic "45 in stock" [ref=e63]:
              - generic [ref=e64]: ✓
              - text: 45 in stock
          - button "Add Keychron K2 Mechanical Keyboard to cart" [ref=e66] [cursor=pointer]: 🛒 Add to Cart
        - listitem [ref=e67]:
          - generic [ref=e69]: 🖥️
          - generic [ref=e70]:
            - generic [ref=e71]: display
            - generic [ref=e72]: LG 27" 4K OLED Monitor
            - generic [ref=e73]: $749.99
            - generic "3 in stock" [ref=e74]:
              - generic [ref=e75]: ✓
              - text: 3 in stock
          - button "Add LG 27" [ref=e77] [cursor=pointer]: 🛒 Add to Cart
        - listitem [ref=e78]:
          - generic [ref=e80]: ⌚
          - generic [ref=e81]:
            - generic [ref=e82]: wearable
            - generic [ref=e83]: Apple Watch Ultra 2
            - generic [ref=e84]: $799.99
            - generic "15 in stock" [ref=e85]:
              - generic [ref=e86]: ✓
              - text: 15 in stock
          - button "Add Apple Watch Ultra 2 to cart" [ref=e88] [cursor=pointer]: 🛒 Add to Cart
  - status
```

# Test source

```ts
  1   | /**
  2   |  * utils/schemaValidator.ts
  3   |  * 
  4   |  * AJV-based JSON schema validation utilities.
  5   |  * Used in every Playwright spec to validate API responses inline.
  6   |  * 
  7   |  * Also provides helpers to parse Playwright Response objects
  8   |  * and validate their JSON bodies against schemas.
  9   |  */
  10  | 
  11  | import Ajv from 'ajv';
  12  | import addFormats from 'ajv-formats';
  13  | import { Response } from '@playwright/test';
  14  | 
  15  | // Create a shared AJV instance with format support (email, date, uri, etc.)
  16  | const ajv = new Ajv({ allErrors: true, strict: false });
  17  | addFormats(ajv);
  18  | 
  19  | // ── Core Validation ───────────────────────────────────────────────
  20  | 
  21  | export interface ValidationResult {
  22  |   valid:  boolean;
  23  |   errors: string[];
  24  |   data:   unknown;
  25  | }
  26  | 
  27  | /**
  28  |  * Validates a JavaScript object against an AJV-compatible JSON schema.
  29  |  * 
  30  |  * @param data    The data object to validate
  31  |  * @param schema  AJV schema definition
  32  |  * @returns       ValidationResult with errors list
  33  |  */
  34  | export function validateSchema(data: unknown, schema: object): ValidationResult {
  35  |   const validate = ajv.compile(schema);
  36  |   const valid    = validate(data) as boolean;
  37  | 
  38  |   const errors = valid
  39  |     ? []
  40  |     : (validate.errors || []).map(e => `${e.instancePath || '(root)'} ${e.message}`);
  41  | 
  42  |   return { valid, errors, data };
  43  | }
  44  | 
  45  | /**
  46  |  * Validates data against a schema and throws an error if invalid.
  47  |  * Convenient for use inside Playwright `expect()` assertions.
  48  |  * 
  49  |  * @param data    Data to validate
  50  |  * @param schema  AJV schema
  51  |  * @param label   Human-readable name for error messages
  52  |  * @throws        Error with details if validation fails
  53  |  */
  54  | export function assertSchema(data: unknown, schema: object, label = 'Response'): void {
  55  |   const result = validateSchema(data, schema);
  56  |   if (!result.valid) {
  57  |     const errorSummary = result.errors.join('\n  - ');
  58  |     throw new Error(
  59  |       `Schema validation FAILED for "${label}":\n  - ${errorSummary}\n\nData received:\n${JSON.stringify(data, null, 2)}`
  60  |     );
  61  |   }
  62  | }
  63  | 
  64  | // ── Playwright Response Helpers ───────────────────────────────────
  65  | 
  66  | /**
  67  |  * Parses a Playwright Response object and validates its JSON body
  68  |  * against the given schema.
  69  |  * 
  70  |  * @param response   Playwright Response object from waitForResponse()
  71  |  * @param schema     AJV schema to validate against
  72  |  * @param label      Label for error messages
  73  |  * @returns          Parsed + validated JSON data
  74  |  */
  75  | export async function validateResponseSchema<T = unknown>(
  76  |   response: Response,
  77  |   schema: object,
  78  |   label: string = 'API Response'
  79  | ): Promise<T> {
  80  |   // Parse JSON using body() buffer to avoid single-read limitation
  81  |   let data: T;
  82  |   try {
  83  |     const body = await response.body();
  84  |     data = JSON.parse(body.toString('utf-8')) as T;
  85  |   } catch (err: any) {
> 86  |     throw new Error(`${label}: Failed to parse JSON response body (status: ${response.status()}) - ${err.message}`);
      |           ^ Error: Products Response: Failed to parse JSON response body (status: 200) - response.body: Protocol error (Network.getResponseBody): No resource with given identifier found
  87  |   }
  88  | 
  89  |   // Validate against schema
  90  |   assertSchema(data, schema, label);
  91  | 
  92  |   return data;
  93  | }
  94  | 
  95  | /**
  96  |  * Checks that a Playwright Response has the expected HTTP status code.
  97  |  * Throws an error with full context if the status doesn't match.
  98  |  * 
  99  |  * @param response       Playwright Response
  100 |  * @param expectedStatus Expected HTTP status code
  101 |  * @param label          Label for error messages
  102 |  */
  103 | export function assertResponseStatus(
  104 |   response: Response,
  105 |   expectedStatus: number,
  106 |   label: string = 'API Response'
  107 | ): void {
  108 |   if (response.status() !== expectedStatus) {
  109 |     throw new Error(
  110 |       `${label}: Expected HTTP status ${expectedStatus}, got ${response.status()} for ${response.url()}`
  111 |     );
  112 |   }
  113 | }
  114 | 
```