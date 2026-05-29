/**
 * schemas/OrderSchema.ts
 * 
 * AJV JSON Schema for GET /api/orders response.
 * Validates the orders array and count field.
 */

export const OrderSchema = {
  type: 'object',
  required: ['orders', 'count'],
  additionalProperties: true,
  properties: {
    orders: {
      type: 'array',
      description: 'Array of orders (may be empty on first visit)',
      items: {
        type: 'object',
        required: ['orderId', 'status', 'items', 'total', 'createdAt'],
        additionalProperties: true,
        properties: {
          orderId: {
            type: 'string',
            minLength: 1,
          },
          userId: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['confirmed', 'pending', 'shipped', 'delivered', 'cancelled'],
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'name', 'price', 'quantity'],
              additionalProperties: true,
              properties: {
                productId: { type: 'string' },
                name:      { type: 'string' },
                price:     { type: 'number', minimum: 0 },
                quantity:  { type: 'number', minimum: 1 },
              },
            },
          },
          total: {
            type: 'number',
            minimum: 0,
          },
          customer: {
            type: 'object',
            additionalProperties: true,
            properties: {
              firstName: { type: 'string' },
              lastName:  { type: 'string' },
              city:      { type: 'string' },
            },
          },
          createdAt: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
    count: {
      type: 'number',
      minimum: 0,
      description: 'Total number of orders',
    },
  },
};
