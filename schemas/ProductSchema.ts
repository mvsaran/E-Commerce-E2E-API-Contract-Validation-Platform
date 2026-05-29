/**
 * schemas/ProductSchema.ts
 * 
 * AJV JSON Schema for GET /api/products response.
 * Validates the products array and pagination metadata.
 */

export interface Product {
  id:          string;
  name:        string;
  category:    string;
  price:       number;
  image:       string;
  stock:       number;
  description: string;
  rating:      number;
}

export interface ProductsResponse {
  products: Product[];
  total:    number;
  page:     number;
  limit:    number;
}

export const ProductSchema = {
  type: 'object',
  required: ['products', 'total'],
  additionalProperties: true,
  properties: {
    products: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'name', 'price', 'stock', 'category'],
        additionalProperties: true,
        properties: {
          id:          { type: 'string', minLength: 1 },
          name:        { type: 'string', minLength: 1 },
          category:    { type: 'string', minLength: 1 },
          price:       { type: 'number', minimum: 0 },
          image:       { type: 'string' },
          stock:       { type: 'number', minimum: 0 },
          description: { type: 'string' },
          rating:      { type: 'number', minimum: 0, maximum: 5 },
        },
      },
    },
    total: {
      type: 'number',
      minimum: 0,
      description: 'Total product count',
    },
    page: {
      type: 'number',
      minimum: 1,
    },
    limit: {
      type: 'number',
      minimum: 0,
    },
  },
};
