import express from 'express';
import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { logger } from '../utils/logger.js';
import {
  snapshotCreateValidation,
  snapshotUpdateValidation,
  calendarQueryValidation
} from '../middleware/validation.js';
import { ValidationError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(logActivity);

// Get calendar data for a project
router.get('/projects/:projectId/calendar', calendarQueryValidation, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { startYear, startMonth, endYear, endMonth } = req.query;

    // Check user access
    const canAccess = await User.canAccessProject(req.user.id, parseInt(projectId));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const data = await WeeklySnapshot.getCalendarData(projectId, {
      startYear: parseInt(startYear),
      startMonth: parseInt(startMonth),
      endYear: parseInt(endYear),
      endMonth: parseInt(endMonth)
    });

    res.json(data);
  } catch (error) {
    logger.error('Get calendar data error', { error });
    next(error);
  }
});

// Get weekly summary for a project
router.get('/projects/:projectId/calendar/summary', calendarQueryValidation, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { year, month, week } = req.query;

    // Check user access
    const canAccess = await User.canAccessProject(req.user.id, parseInt(projectId));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const summary = await WeeklySnapshot.getWeeklySummary(
      parseInt(projectId),
      parseInt(year),
      parseInt(month),
      parseInt(week)
    );

    res.json(summary);
  } catch (error) {
    logger.error('Get weekly summary error', { error });
    next(error);
  }
});

// Get snapshots for a task
router.get('/projects/:projectId/tasks/:taskId/snapshots', calendarQueryValidation, async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { year, month } = req.query;

    // Check user access
    const canAccess = await User.canAccessProject(req.user.id, parseInt(projectId));
    if (!canAccess) return next(new ForbiddenError('Access denied to project'));

    const snapshots = await WeeklySnapshot.findByTask(parseInt(taskId), {
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined
    });

    res.json(snapshots);
  } catch (error) {
    logger.error('Get task snapshots error', { error });
    next(error);
  }
});

// Create or update weekly snapshot
router.post('/projects/:projectId/tasks/:taskId/snapshots', snapshotCreateValidation, async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { year, month, weekNumber, plannedStatus, actualStatus, plannedProgress, actualProgress, comments } = req.body;

    // Check edit permission
    const canEdit = await User.canEditProject(req.user.id, parseInt(projectId));
    if (!canEdit && req.user.role !== 'Admin') {
      return next(new ForbiddenError('No permission to edit project'));
    }

    // Verify task belongs to project
    const task = await Task.findById(taskId);
    if (!task || task.project_id !== parseInt(projectId)) {
      return next(new ValidationError('Task does not belong to project'));
    }

    const snapshot = await WeeklySnapshot.upsert({
      taskId: parseInt(taskId),
      projectId: parseInt(projectId),
      year: parseInt(year),
      month: parseInt(month),
      weekNumber: parseInt(weekNumber),
      plannedStatus,
      actualStatus,
      plannedProgress,
      actualProgress,
      comments
    });

    res.json(snapshot);
  } catch (error) {
    logger.error('Create/update snapshot error', { error });
    next(error);
  }
});

// Update existing snapshot
router.put('/snapshots/:id', snapshotUpdateValidation, async (req, res, next) => {
  try {
    const { id } = req.params;
    const snapshot = await WeeklySnapshot.findById(id);
    if (!snapshot) return next(new NotFoundError('Snapshot not found'));

    // Check edit permission
    const canEdit = await User.canEditProject(req.user.id, snapshot.project_id);
    if (!canEdit && req.user.role !== 'Admin') {
      return next(new ForbiddenError('No permission to edit snapshot'));
    }

    const updated = await WeeklySnapshot.update(id, req.body);
    res.json(updated);
  } catch (error) {
    logger.error('Update snapshot error', { error });
    next(error);
  }
});

// Delete snapshot (Admin only)
router.delete('/snapshots/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new ForbiddenError('Only admins can delete snapshots'));
    }

    const { id } = req.params;
    const snapshot = await WeeklySnapshot.findById(id);
    if (!snapshot) return next(new NotFoundError('Snapshot not found'));

    await WeeklySnapshot.delete(id);
    res.json({ message: 'Snapshot deleted successfully' });
  } catch (error) {
    logger.error('Delete snapshot error', { error });
    next(error);
  }
});

// Bulk create/update snapshots (Admin only)
router.post('/projects/:projectId/snapshots/bulk', async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return next(new ForbiddenError('Only admins can bulk create snapshots'));
    }

    const { projectId } = req.params;
    const { snapshots } = req.body;

    if (!Array.isArray(snapshots)) {
      return next(new ValidationError('Snapshots must be an array'));
    }

    const results = [];
    for (const data of snapshots) {
      const snapshot = await WeeklySnapshot.upsert({
        ...data,
        projectId: parseInt(projectId)
      });
      results.push(snapshot);
    }

    res.json({
      message: 'Bulk snapshot creation completed',
      created: results.length
    });
  } catch (error) {
    logger.error('Bulk create snapshots error', { error });
    next(error);
  }
});

export default router;