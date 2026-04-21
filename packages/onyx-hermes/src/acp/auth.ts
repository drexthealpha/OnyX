/**
 * API key authentication middleware.
 * Reads HERMES_API_KEY from environment.
 * If not set, skips auth (dev mode).
 * Clients must send: Authorization: Bearer <key>
 */

import { Request, Response, NextFunction } from 'express';

const REQUIRED_KEY = process.env.HERMES_API_KEY ?? '';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth in dev mode (no key configured)
  if (!REQUIRED_KEY) {
    next();
    return;
  }

  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header. Expected: Bearer <key>' });
    return;
  }

  const providedKey = authHeader.slice(7).trim();
  if (providedKey !== REQUIRED_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}