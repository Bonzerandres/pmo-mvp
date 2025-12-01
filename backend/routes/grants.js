import express from 'express';
import { Grant } from '../models/Grant.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(logActivity);

// Get all grants (Admin only)
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { page = 1, limit = 50, status } = req.query;
    const grants = await Grant.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    // Get total amount for active grants
    const totalAmount = await Grant.getTotalAmount({ status: 'active' });

    res.json({
      grants,
      totalAmount,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    logger.error('Get grants error', { error });
    next(error);
  }
});

// Get grant by ID
router.get('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { id } = req.params;
    const grant = await Grant.findById(id);
    if (!grant) return next(new NotFoundError('Grant not found'));

    res.json(grant);
  } catch (error) {
    logger.error('Get grant error', { error });
    next(error);
  }
});

// Create new grant (Admin only)
router.post('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { name, description, amount, status = 'active', projectId, assignedTo, startDate, endDate } = req.body;

    if (!name || !amount) {
      return next(new ValidationError('Name and amount are required'));
    }

    if (amount <= 0) {
      return next(new ValidationError('Amount must be positive'));
    }

    if (status && !['active', 'inactive', 'completed', 'cancelled'].includes(status)) {
      return next(new ValidationError('Invalid status'));
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return next(new NotFoundError('Project not found'));
    }

    // Validate user exists if provided
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) return next(new NotFoundError('User not found'));
    }

    const grant = await Grant.create({
      name,
      description,
      amount: parseFloat(amount),
      status,
      projectId,
      assignedTo,
      startDate,
      endDate
    });

    res.status(201).json(grant);
  } catch (error) {
    logger.error('Create grant error', { error });
    next(error);
  }
});

// Update grant (Admin only)
router.put('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { id } = req.params;
    const { name, description, amount, status, projectId, assignedTo, startDate, endDate } = req.body;

    const grant = await Grant.findById(id);
    if (!grant) return next(new NotFoundError('Grant not found'));

    if (amount !== undefined && amount <= 0) {
      return next(new ValidationError('Amount must be positive'));
    }

    if (status && !['active', 'inactive', 'completed', 'cancelled'].includes(status)) {
      return next(new ValidationError('Invalid status'));
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return next(new NotFoundError('Project not found'));
    }

    // Validate user exists if provided
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) return next(new NotFoundError('User not found'));
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined) updateData.status = status;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;

    const updatedGrant = await Grant.update(id, updateData);
    res.json(updatedGrant);
  } catch (error) {
    logger.error('Update grant error', { error });
    next(error);
  }
});

// Delete grant (Admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { id } = req.params;
    const grant = await Grant.findById(id);
    if (!grant) return next(new NotFoundError('Grant not found'));

    await Grant.delete(id);
    res.json({ message: 'Grant deleted successfully' });
  } catch (error) {
    logger.error('Delete grant error', { error });
    next(error);
  }
});

// Get grants by project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return next(new NotFoundError('Project not found'));

    const grants = await Grant.getGrantsByProject(projectId);
    res.json(grants);
  } catch (error) {
    logger.error('Get grants by project error', { error });
    next(error);
  }
});

// Get grants by assignee
router.get('/assignee/:userId', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new NotFoundError('Access denied'));
    }

    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('User not found'));

    const grants = await Grant.getGrantsByAssignee(userId);
    res.json(grants);
  } catch (error) {
    logger.error('Get grants by assignee error', { error });
    next(error);
  }
});

export default router;