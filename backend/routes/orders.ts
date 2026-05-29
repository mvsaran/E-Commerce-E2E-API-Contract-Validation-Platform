/**
 * routes/orders.ts — Order Routes
 * 
 * POST /api/checkout   — Creates order from current cart, clears cart
 * GET  /api/orders     — Returns all orders for the authenticated user
 * 
 * Captured by Playwright Scenarios 5 & 6 and validated by Postman.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { cartStore } from './cart';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-super-secret-jwt-key-2024';

// In-memory order store: Map<userId, Order[]>
const orderStore = new Map<string, Order[]>();

interface OrderItem {
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
}

interface Customer {
  firstName: string;
  lastName:  string;
  address:   string;
  city:      string;
  phone:     string;
}

interface Order {
  orderId:   string;
  userId:    string;
  status:    'confirmed' | 'pending' | 'shipped' | 'delivered';
  items:     OrderItem[];
  total:     number;
  customer:  Customer;
  createdAt: string;
}

interface JwtPayload {
  userId: string;
  email:  string;
  role:   string;
}

/**
 * Middleware: extract and verify JWT, attach userId and token to request.
 */
function authMiddleware(
  req: Request & { userId?: string; userToken?: string },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId    = payload.userId;
    req.userToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.use(authMiddleware as any);

/**
 * POST /api/checkout
 * 
 * Creates an order from the current cart contents.
 * Clears the cart after successful order creation.
 * 
 * Request body:
 *   { customer: { firstName, lastName, address, city, phone } }
 * 
 * Response (201):
 *   {
 *     orderId:   string,
 *     status:    'confirmed',
 *     items:     OrderItem[],
 *     total:     number,
 *     customer:  Customer,
 *     createdAt: string
 *   }
 * 
 * Response (400): empty cart or missing customer details
 */
router.post('/checkout', (req: Request & { userId?: string; userToken?: string }, res: Response) => {
  const { customer } = req.body;
  const token  = req.userToken!;
  const userId = req.userId!;

  // Validate customer info
  if (!customer || !customer.firstName || !customer.lastName) {
    return res.status(400).json({ error: 'Customer details are required' });
  }

  // Get cart for this session
  const cartItems = cartStore.get(token) || [];

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty — add items before checkout' });
  }

  // Calculate total (with 8% tax)
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax      = subtotal * 0.08;
  const total    = parseFloat((subtotal + tax).toFixed(2));

  // Build order
  const order: Order = {
    orderId:  `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
    userId,
    status:   'confirmed',
    items:    cartItems.map(i => ({
      productId: i.productId,
      name:      i.name,
      price:     i.price,
      quantity:  i.quantity,
    })),
    total,
    customer: {
      firstName: customer.firstName,
      lastName:  customer.lastName,
      address:   customer.address  || '',
      city:      customer.city     || '',
      phone:     customer.phone    || '',
    },
    createdAt: new Date().toISOString(),
  };

  // Save order
  if (!orderStore.has(userId)) {
    orderStore.set(userId, []);
  }
  orderStore.get(userId)!.push(order);

  // Clear the cart after successful checkout
  cartStore.set(token, []);

  return res.status(201).json(order);
});

/**
 * GET /api/orders
 * 
 * Returns all orders for the authenticated user.
 * 
 * Response (200):
 *   {
 *     orders: Order[],
 *     count:  number
 *   }
 */
router.get('/orders', (req: Request & { userId?: string }, res: Response) => {
  const userId = req.userId!;
  const orders = orderStore.get(userId) || [];

  return res.status(200).json({
    orders,
    count: orders.length,
  });
});

export default router;
