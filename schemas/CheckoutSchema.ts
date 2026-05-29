/**
 * schemas/CheckoutSchema.ts
 * 
 * AJV JSON Schema for POST /api/checkout response.
 * Validates that order ID, status, items, total, and customer are returned.
 */

export const CheckoutSchema = {
  type: 'object',
  required: ['orderId', 'status', 'items', 'total', 'customer', 'createdAt'],
  additionalProperties: true,
  properties: {
    orderId: {
      type: 'string',
      minLength: 1,
      description: 'Unique order identifier (e.g. ORD-XXXXXXXX)',
    },
    status: {
      type: 'string',
      enum: ['confirmed', 'pending', 'shipped', 'delivered', 'cancelled'],
    },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'name', 'price', 'quantity'],
        additionalProperties: true,
        properties: {
          productId: { type: 'string', minLength: 1 },
          name:      { type: 'string', minLength: 1 },
          price:     { type: 'number', minimum: 0 },
          quantity:  { type: 'number', minimum: 1 },
        },
      },
    },
    total: {
      type: 'number',
      minimum: 0,
      description: 'Order total including tax',
    },
    customer: {
      type: 'object',
      required: ['firstName', 'lastName'],
      additionalProperties: true,
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName:  { type: 'string', minLength: 1 },
        address:   { type: 'string' },
        city:      { type: 'string' },
        phone:     { type: 'string' },
      },
    },
    createdAt: {
      type: 'string',
      minLength: 1,
      description: 'ISO 8601 order creation timestamp',
    },
  },
};
