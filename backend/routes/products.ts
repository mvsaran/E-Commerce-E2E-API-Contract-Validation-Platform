/**
 * routes/products.ts — Product Routes
 * 
 * GET /api/products
 *   - Returns the full product catalogue
 *   - Supports optional ?category=X and ?limit=N query params
 * 
 * Captured by Playwright Scenario 2 and validated by Postman.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Load product catalogue from seed file
const productsPath = path.join(__dirname, '..', 'data', 'products.json');

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  description: string;
  rating: number;
}

function getProducts(): Product[] {
  return JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
}

/**
 * GET /api/products
 * 
 * Query params:
 *   category?: string   Filter by category
 *   limit?:    number   Limit result count
 * 
 * Response (200):
 *   {
 *     products: Product[],
 *     total: number,
 *     page: 1,
 *     limit: number
 *   }
 */
router.get('/', (req: Request, res: Response) => {
  let products = getProducts();

  // Filter by category if provided
  const { category, limit } = req.query;
  if (category && typeof category === 'string') {
    products = products.filter(p => p.category === category);
  }

  // Apply limit if provided
  const limitNum = limit ? parseInt(limit as string, 10) : undefined;
  const sliced   = limitNum ? products.slice(0, limitNum) : products;

  return res.status(200).json({
    products: sliced,
    total:    sliced.length,
    page:     1,
    limit:    limitNum || sliced.length,
  });
});

/**
 * GET /api/products/:id
 * Returns a single product by ID.
 */
router.get('/:id', (req: Request, res: Response) => {
  const products = getProducts();
  const product  = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(product);
});

export default router;
