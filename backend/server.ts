/**
 * server.ts — Express Application Entry Point
 * 
 * Sets up the Express server:
 *   - Serves static frontend files from /frontend directory
 *   - Mounts all API route modules under /api
 *   - Configures CORS, JSON body parsing, and error handling
 *   - Listens on PORT (default 3000)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Route modules
import authRoutes     from './routes/auth';
import productsRoutes from './routes/products';
import cartRoutes     from './routes/cart';
import ordersRoutes   from './routes/orders';

// Load environment variables
dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Middleware ────────────────────────────────────────────────────

// CORS — allow all origins in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON body parser (max 5MB)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (helpful for debugging captured traffic)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Static Frontend ───────────────────────────────────────────────
// Serve the frontend HTML/CSS/JS from the /frontend directory
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Root redirect → login page
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/login.html');
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart',     cartRoutes);
// Checkout and orders are both in ordersRoutes:
// POST /api/checkout  → router.post('/checkout')
// GET  /api/orders    → router.get('/')
// Mount at /api to handle both paths correctly
app.use('/api',          ordersRoutes);

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── 404 Handler ───────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start Server ─────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅ ShopSphere API running at http://localhost:${PORT}`);
  console.log(`🖥  Frontend available at http://localhost:${PORT}/login.html`);
});

// Graceful shutdown support (used by global-teardown.ts)
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down...');
  server.close(() => process.exit(0));
});

export default app;
