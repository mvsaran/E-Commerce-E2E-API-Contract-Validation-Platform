/**
 * schemas/CartSchema.ts
 * 
 * AJV JSON Schemas for cart API responses:
 *   - CartItemSchema:   POST /api/cart response (single item)
 *   - CartListSchema:   GET /api/cart response  (full cart)
 *   - RemoveCartSchema: DELETE /api/cart/:id response
 */

// ── POST /api/cart — response schema ─────────────────────────────
export const CartItemSchema = {
  type: 'object',
  required: ['id', 'productId', 'name', 'price', 'quantity', 'addedAt'],
  additionalProperties: true,
  properties: {
    id: {
      type: 'string',
      minLength: 1,
      description: 'Unique cart entry UUID',
    },
    productId: {
      type: 'string',
      minLength: 1,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    price: {
      type: 'number',
      minimum: 0,
    },
    quantity: {
      type: 'number',
      minimum: 1,
    },
    category: {
      type: 'string',
    },
    addedAt: {
      type: 'string',
      minLength: 1,
      description: 'ISO 8601 timestamp',
    },
  },
};

// ── GET /api/cart — response schema ──────────────────────────────
export const CartListSchema = {
  type: 'object',
  required: ['items', 'total', 'itemCount'],
  additionalProperties: true,
  properties: {
    items: {
      type: 'array',
      items: CartItemSchema,
      description: 'Array of cart items (may be empty)',
    },
    total: {
      type: 'number',
      minimum: 0,
      description: 'Total price of all items',
    },
    itemCount: {
      type: 'number',
      minimum: 0,
      description: 'Sum of all quantities',
    },
  },
};

// ── DELETE /api/cart/:id — response schema ────────────────────────
export const RemoveCartSchema = {
  type: 'object',
  required: ['message', 'id'],
  additionalProperties: true,
  properties: {
    message: {
      type: 'string',
      minLength: 1,
    },
    id: {
      type: 'string',
      minLength: 1,
    },
  },
};
