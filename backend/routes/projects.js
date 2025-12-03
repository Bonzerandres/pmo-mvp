import express from 'express';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Alert } from '../models/Alert.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { logger } from '../utils/logger.js';
import {
  projectCreateValidation,
  projectUpdateValidation,
  taskCreateValidation,
  taskUpdateValidation,
  idParamValidation
} from '../middleware/validation.js';
import { ValidationError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(logActivity);

// Get all projects (with access control) with pagination
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    let projects;

    if (user.canView === 'all' || ['CEO', 'CTO', 'Admin'].includes(user.role)) {
      projects = await Project.getAllWithTasks({ page, limit });
    } else {
      // PM can only see assigned projects
      const assignedProjects = await User.getUserProjects(user.id);
      projects = await Promise.all(
        assignedProjects.map(p => Project.getWithTasks(p.id))
      );
    }

    res.json(projects);
  } catch (error) {
    logger.error('Get projects error', { error });
    next(error);
  }
});

// Get single project
router.get('/:id', idParamValidation, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check access
    const canAccess = await User.canAccessProject(user.id, parseInt(id));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const project = await Project.getWithTasks(id);
    if (!project) return next(new NotFoundError('Project not found'));

    res.json(project);
  } catch (error) {
    logger.error('Get project error', { error });
    next(error);
  }
});

// Create project (Admin only)
router.post('/', projectCreateValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can create projects'));

    const { name, category, description } = req.body;
    const project = await Project.create({ name, category, description });
    res.status(201).json(project);
  } catch (error) {
    logger.error('Create project error', { error });
    next(error);
  }
});

// Update project (Admin only)
router.put('/:id', idParamValidation, projectUpdateValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can edit projects'));

    const { id } = req.params;
    const { name, category, description } = req.body;

    const project = await Project.update(id, { name, category, description });
    if (!project) return next(new NotFoundError('Project not found'));

    res.json(project);
  } catch (error) {
    logger.error('Update project error', { error });
    next(error);
  }
});

// Delete project (Admin only)
router.delete('/:id', idParamValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can delete projects'));

    const { id } = req.params;
    await Project.delete(id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    logger.error('Delete project error', { error });
    next(error);
  }
});

// Get project metrics
router.get('/:id/metrics', idParamValidation, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const canAccess = await User.canAccessProject(user.id, parseInt(id));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const metrics = await Project.calculateMetrics(id);
    res.json(metrics);
  } catch (error) {
    logger.error('Get metrics error', { error });
    next(error);
  }
});

// Create task (Admin only)
router.post('/:id/tasks', idParamValidation, taskCreateValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can create tasks'));

    const { id } = req.params;
    const { name, responsible, weight, plannedProgress, estimatedDate } = req.body;

    const task = await Task.create({
      projectId: id,
      name,
      responsible,
      weight: weight || 1.0,
      plannedProgress: plannedProgress || 0,
      estimatedDate
    });

    res.status(201).json(task);
  } catch (error) {
    logger.error('Create task error', { error });
    next(error);
  }
});

// Update task (PM with permission or Admin)
router.put('/:id/tasks/:taskId', idParamValidation, taskUpdateValidation, async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const user = req.user;

    // Check edit permission
    const canEdit = await User.canEditProject(user.id, parseInt(id));
    if (!canEdit && user.role !== 'Admin') return next(new ForbiddenError('No permission to edit this project'));

    const { actualProgress, delayDays, comments, evidence, name, responsible, weight, plannedProgress, estimatedDate } = req.body;

    // PM can only update progress, delay, comments, evidence
    let task;
    if (user.role === 'PM') {
      task = await Task.update(taskId, { actualProgress, delayDays, comments, evidence });
    } else {
      // Admin can update everything
      task = await Task.update(taskId, { name, responsible, weight, plannedProgress, actualProgress, estimatedDate, comments, evidence });
    }
    res.json(task);
  } catch (error) {
    logger.error('Update task error', { error });
    next(error);
  }
});

// Delete task (Admin only)
router.delete('/:id/tasks/:taskId', idParamValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can delete tasks'));

    const { taskId } = req.params;
    await Task.delete(taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    logger.error('Delete task error', { error });
    next(error);
  }
});

export default router;

