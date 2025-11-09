import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginValidation } from '../middleware/validation.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import { UnauthorizedError } from '../middleware/errorHandler.js';

const router = express.Router();

// Login
router.post('/login', loginRateLimiter, loginValidation, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    logger.info('Login attempt', { username });

    let user;
    try {
      user = await User.findByUsername(username);
    } catch (dbError) {
      logger.error('Database error during login', { error: dbError, username });
      return next(new Error('Database error occurred'));
    }

    if (!user) {
      logger.warn('Login failed - user not found', { username });
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      logger.warn('Login failed - invalid password', { username });
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET is not configured', { stack: new Error().stack });
      return next(new Error('Server configuration error'));
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn }
    );

    // Get user projects if PM
    let projects = [];
    if (user.canView === 'assigned') {
      projects = await User.getUserProjects(user.id);
    }

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        canEdit: user.canEdit === 1,
        canView: user.canView,
        projects: projects.map(p => p.id)
      }
    });
  } catch (error) {
    logger.error('Login error', { error });
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user;
    let projects = [];

    if (user.canView === 'assigned') {
      projects = await User.getUserProjects(user.id);
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      canEdit: user.canEdit === 1,
      canView: user.canView,
      projects: projects.map(p => p.id)
    });
  } catch (error) {
    logger.error('Get user error', { error });
    next(error);
  }
});

export default router;

