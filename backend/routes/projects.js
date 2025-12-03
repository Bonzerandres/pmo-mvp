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
router.use(authenticateToken);
router.use(logActivity);
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    let projects;

    if (user.canView === 'all' || ['CEO', 'CTO', 'Admin'].includes(user.role)) {
      projects = await Project.getAllWithTasks({ page, limit });
    } else {
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
router.get('/:id', idParamValidation, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
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
router.delete('/:id', idParamValidation, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return next(new ForbiddenError('Only admins can delete projects'));

    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return next(new NotFoundError('Project not found'));
    const taskCount = await Task.getTaskCount(id);
    logger.info('Attempting project delete', { projectId: id, projectName: project.name, taskCount, userId: req.user.id });

    const result = await Project.delete(id);
    if (!result) return next(new NotFoundError('Project not found'));
    res.json({ message: 'Project deleted successfully', projectId: parseInt(id, 10), deletedTasks: result.deletedTaskCount || taskCount });
  } catch (error) {
    logger.error('Delete project error', { error });
    next(error);
  }
});
router.get('/:id/tasks', idParamValidation, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const canAccess = await User.canAccessProject(user.id, parseInt(id));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const tasks = await Task.findByProject(id);
    const tasksWithPV = tasks.map(task => ({
      ...task,
      pv: Task.calculatePV(task)
    }));

    res.json(tasksWithPV);
  } catch (error) {
    logger.error('Get project tasks error', { error });
    next(error);
  }
});
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
router.put('/:id/tasks/:taskId', idParamValidation, taskUpdateValidation, async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const user = req.user;
    const canEdit = await User.canEditProject(user.id, parseInt(id));
    if (!canEdit && user.role !== 'Admin') return next(new ForbiddenError('No permission to edit this project'));

    const { actualProgress, delayDays, comments, evidence, name, responsible, weight, plannedProgress, estimatedDate } = req.body;
    let task;
    if (user.role === 'PM') {
      task = await Task.update(taskId, { actualProgress, delayDays, comments, evidence });
    } else {
      task = await Task.update(taskId, { name, responsible, weight, plannedProgress, actualProgress, estimatedDate, comments, evidence });
    }
    res.json(task);
  } catch (error) {
    logger.error('Update task error', { error });
    next(error);
  }
});
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

