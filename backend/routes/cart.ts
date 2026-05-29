/**
 * routes/cart.ts — Shopping Cart Routes
 * 
 * In-memory cart store keyed by auth token.
 * Each user session gets an isolated cart.
 * 
 * POST   /api/cart        — Add item to cart
 * GET    /api/cart        — Get current cart
 * DELETE /api/cart/:id    — Remove item from cart
 * 
 * Captured by Playwright Scenarios 3 & 4 and validated by Postman.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-super-secret-jwt-key-2024';

// In-memory cart store: Map<token, CartItem[]>
// Keyed by the user's JWT token string for session isolation
const cartStore = new Map<string, CartItem[]>();

interface CartItem {
  id:        string;   // Unique cart entry ID
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
  category?: string;
  addedAt:   string;
}

interface JwtPayload {
  userId: string;
  email:  string;
  role:   string;
}

/**
 * Middleware: extract token from Authorization header.
 * Attaches `req.userToken` (raw token string) for cart lookup.
 * Returns 401 if no valid token.
 */
function extractToken(req: Request & { userToken?: string }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token is valid (don't need payload for cart operations)
    jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Apply auth middleware to all cart routes
router.use(extractToken as any);

/**
 * POST /api/cart
 * 
 * Adds a product to the cart (or increments quantity if already exists).
 * 
 * Request body:
 *   { productId: string, name: string, price: number, quantity?: number }
 * 
 * Response (201):
 *   { id, productId, name, price, quantity, addedAt }
 */
router.post('/', (req: Request & { userToken?: string }, res: Response) => {
  const { productId, name, price, quantity = 1, category } = req.body;
  const token = req.userToken!;

  if (!productId || !name || price === undefined) {
    return res.status(400).json({ error: 'productId, name, and price are required' });
  }

  if (!cartStore.has(token)) {
    cartStore.set(token, []);
  }

  const cart     = cartStore.get(token)!;
  const existing = cart.find(i => i.productId === productId);

  if (existing) {
    // Increment quantity if product already in cart
    existing.quantity += Number(quantity);
    return res.status(201).json(existing);
  }

  const newItem: CartItem = {
    id:        uuidv4(),
    productId,
    name,
    price:     Number(price),
    quantity:  Number(quantity),
    category:  category || 'electronics',
    addedAt:   new Date().toISOString(),
  };

  cart.push(newItem);
  cartStore.set(token, cart);

  return res.status(201).json(newItem);
});

/**
 * GET /api/cart
 * 
 * Returns the current cart for the authenticated user.
 * 
 * Response (200):
 *   {
 *     items: CartItem[],
 *     total: number,          // Total price
 *     itemCount: number       // Sum of all quantities
 *   }
 */
router.get('/', (req: Request & { userToken?: string }, res: Response) => {
  const token = req.userToken!;
  const items = cartStore.get(token) || [];

  const total     = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return res.status(200).json({ items, total, itemCount });
});

/**
 * DELETE /api/cart/:id
 * 
 * Removes a specific item from the cart by cart entry ID.
 * 
 * Response (200): { message: "Item removed", id }
 * Response (404): { error: "Item not found" }
 */
router.delete('/:id', (req: Request & { userToken?: string }, res: Response) => {
  const token  = req.userToken!;
  const itemId = req.params.id;
  const cart   = cartStore.get(token) || [];

  const index = cart.findIndex(i => i.id === itemId);

  if (index === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  cart.splice(index, 1);
  cartStore.set(token, cart);

  return res.status(200).json({ message: 'Item removed from cart', id: itemId });
});

// Expose cartStore for use by orders route (checkout clears cart)
export { cartStore };
export default router;
