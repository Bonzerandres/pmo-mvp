import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedError('Access token required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET is not configured');
      return next(new Error('Server configuration'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return next(new UnauthorizedError('Token expired'));
      return next(new UnauthorizedError('Invalid token'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) return next(new UnauthorizedError('User not found'));

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    next(error);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Not authenticated'));
    if (!roles.includes(req.user.role)) return next(new ForbiddenError('Insufficient role'));
    next();
  };
};

