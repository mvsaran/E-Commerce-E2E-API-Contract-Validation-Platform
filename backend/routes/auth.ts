/**
 * routes/auth.ts — Authentication Routes
 * 
 * POST /api/auth/login
 *   - Validates email + password against users.json
 *   - Returns a signed JWT token + user object on success
 *   - Returns 401 on invalid credentials
 * 
 * Captured by Playwright Scenario 1 and validated by Postman.
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const router = Router();

// Load seed users from data file
const usersPath = path.join(__dirname, '..', 'data', 'users.json');

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
}

function getUsers(): User[] {
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-super-secret-jwt-key-2024';

/**
 * POST /api/auth/login
 * 
 * Request body: { email: string, password: string }
 * 
 * Response (200):
 *   {
 *     token: string,        // JWT token (24h expiry)
 *     user: {
 *       id, email, name, role
 *     }
 *   }
 * 
 * Response (401):  { error: "Invalid credentials" }
 * Response (400):  { error: "Email and password are required" }
 */
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email (case-insensitive)
  const users = getUsers();
  const user  = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim()
  );

  // Validate credentials
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Return token + sanitised user (no password)
  return res.status(200).json({
    token,
    user: {
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    },
  });
});

export default router;
