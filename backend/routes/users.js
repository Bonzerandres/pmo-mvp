import express from 'express';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
router.use(authenticateToken);
router.use(logActivity);
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { page = 1, limit = 50 } = req.query;
    const users = await User.findAll({ page: parseInt(page), limit: parseInt(limit) });
    res.json(users);
  } catch (error) {
    logger.error('Get users error', { error });
    next(error);
  }
});
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(id)) {
      return next(new NotFoundError('Access denied'));
    }

    const user = await User.findById(id);
    if (!user) return next(new NotFoundError('User not found'));
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Get user error', { error });
    next(error);
  }
});
router.post('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { username, password, role, canEdit = false, canView = 'all' } = req.body;

    if (!username || !password || !role) {
      return next(new ValidationError('Username, password, and role are required'));
    }

    if (!['CEO', 'CTO', 'PM', 'Admin'].includes(role)) {
      return next(new ValidationError('Invalid role'));
    }

    const user = await User.create({ username, password, role, canEdit, canView });
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return next(new ValidationError('Username already exists'));
    }
    logger.error('Create user error', { error });
    next(error);
  }
});
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, role, canEdit, canView } = req.body;
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(id)) {
      return next(new NotFoundError('Access denied'));
    }
    if (req.user.role !== 'Admin' && (role || canEdit !== undefined || canView)) {
      return next(new NotFoundError('Access denied'));
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) {
      if (!['CEO', 'CTO', 'PM', 'Admin'].includes(role)) {
        return next(new ValidationError('Invalid role'));
      }
      updateData.role = role;
    }
    if (canEdit !== undefined) updateData.canEdit = canEdit;
    if (canView) updateData.canView = canView;

    const user = await User.update(id, updateData);
    if (!user) return next(new NotFoundError('User not found'));

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return next(new ValidationError('Username already exists'));
    }
    logger.error('Update user error', { error });
    next(error);
  }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { id } = req.params;
    if (req.user.id === parseInt(id)) {
      return next(new ValidationError('Cannot delete your own account'));
    }

    const user = await User.findById(id);
    if (!user) return next(new NotFoundError('User not found'));

    await User.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error', { error });
    next(error);
  }
});
router.get('/:userId/tasks', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    if (currentUser.role !== 'Admin' && currentUser.id !== parseInt(userId)) {
      return next(new NotFoundError('Access denied'));
    }
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('User not found'));
    const tasks = await Task.findByResponsible(user.name);

    res.json(tasks);
  } catch (error) {
    logger.error('Get user tasks error', { error });
    next(error);
  }
});

export default router;