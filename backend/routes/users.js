import express from 'express';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(logActivity);

// Get tasks assigned to a specific user
router.get('/:userId/tasks', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Users can only see their own tasks, unless they are admin
    if (currentUser.role !== 'Admin' && currentUser.id !== parseInt(userId)) {
      return next(new NotFoundError('Access denied'));
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('User not found'));

    // Get tasks where responsible matches the user's name
    const tasks = await Task.findByResponsible(user.name);

    res.json(tasks);
  } catch (error) {
    logger.error('Get user tasks error', { error });
    next(error);
  }
});

export default router;