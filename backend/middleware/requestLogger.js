import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export function requestLogger(req, res, next) {
  const requestId = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
  req.requestId = requestId;
  const start = Date.now();
  const userId = req.user ? req.user.id : null;
  logger.info('Incoming request', { requestId, method: req.method, url: req.originalUrl, ip: req.ip, userId });
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request complete', { requestId, method: req.method, url: req.originalUrl, status: res.statusCode, duration });
  });
  next();
}

export default requestLogger;
