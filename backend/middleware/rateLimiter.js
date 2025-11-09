import { logger } from '../utils/logger.js';

// Simple in-memory rate limiter. Not suitable for multi-process production.
const stores = {
  login: new Map(),
  general: new Map(),
};

function cleanup(map, windowMs) {
  const now = Date.now();
  for (const [key, entry] of map.entries()) {
    if (entry.reset <= now) map.delete(key);
  }
}

export function rateLimit({ windowMs, max, keyPrefix = 'general' }) {
  const store = stores[keyPrefix] || stores.general;
  return (req, res, next) => {
    try {
      cleanup(store, windowMs);
      const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      let entry = store.get(key);
      const now = Date.now();
      if (!entry || entry.reset <= now) {
        entry = { count: 1, reset: now + windowMs };
        store.set(key, entry);
      } else {
        entry.count += 1;
      }
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      if (entry.count > max) {
        logger.warn('Rate limit exceeded', { ip: key, path: req.path });
        return res.status(429).json({ message: 'Too many requests' });
      }
      next();
    } catch (err) {
      logger.error('Rate limiter error', { err });
      next();
    }
  };
}

export const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'login' });
export const apiRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, keyPrefix: 'general' });
export const dashboardRateLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: 'general' });
