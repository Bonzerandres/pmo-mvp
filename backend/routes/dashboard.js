import express from 'express';
import { Alert } from '../models/Alert.js';
import { Project } from '../models/Project.js';
import { WeeklySnapshot } from '../models/WeeklySnapshot.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication and CEO/CTO/Admin roles
router.use(authenticateToken);
router.use(requireRole('CEO', 'CTO', 'Admin'));

// Simple in-memory cache for KPIs and portfolio summary
const cache = {
  kpis: { ts: 0, data: null },
  portfolio: { ts: 0, data: null }
};
const CACHE_TTL = 30 * 1000; // 30 seconds

// Get KPIs
router.get('/kpis', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cache.kpis.data && now - cache.kpis.ts < CACHE_TTL) {
      return res.json(cache.kpis.data);
    }

    const kpis = await Alert.getKPIs();
    cache.kpis = { ts: now, data: kpis };
    res.json(kpis);
  } catch (error) {
    logger.error('Get KPIs error', { error });
    next(error);
  }
});

// Get alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const pid = projectId ? parseInt(projectId) : null;
    if (projectId && Number.isNaN(pid)) return next(new NotFoundError('Invalid projectId'));

    const alerts = await Alert.generateAlerts(pid);
    res.json(alerts);
  } catch (error) {
    logger.error('Get alerts error', { error });
    next(error);
  }
});

// Get weekly trends
router.get('/weekly-trends', async (req, res, next) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    let trends;
    if (projectId) {
      trends = await WeeklySnapshot.getWeeklySummary(parseInt(projectId));
    } else {
      // Get trends for all accessible projects
      const projects = await Project.findAll();
      trends = await Promise.all(
        projects.map(async p => {
          const summary = await WeeklySnapshot.getWeeklySummary(p.id);
          return { 
            projectId: p.id,
            projectName: p.name,
            ...summary
          };
        })
      );
    }

    res.json(trends);
  } catch (error) {
    logger.error('Get weekly trends error', { error });
    next(error);
  }
});

// Get current week data
router.get('/current-week', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const current = WeeklySnapshot.getCurrentWeek();
    
    let weekData;
    if (projectId) {
      const project = await Project.findById(parseInt(projectId));
      if (!project) return next(new NotFoundError('Project not found'));
      
      weekData = await WeeklySnapshot.getCalendarData(projectId, current);
    } else {
      const projects = await Project.findAll();
      weekData = await Promise.all(
        projects.map(async p => ({
          projectId: p.id,
          projectName: p.name,
          data: await WeeklySnapshot.getCalendarData(p.id, current)
        }))
      );
    }

    res.json({ ...current, data: weekData });
  } catch (error) {
    logger.error('Get current week error', { error });
    next(error);
  }
});

// Get portfolio summary for charts (cached)
router.get('/portfolio-summary', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cache.portfolio.data && now - cache.portfolio.ts < CACHE_TTL) {
      return res.json(cache.portfolio.data);
    }

    const projects = await Project.getAllWithTasks({ page: 1, limit: 1000 });
    const { Task } = await import('../models/Task.js');

    const summary = projects.map(project => {
      const totalWeight = (project.tasks || []).reduce((sum, t) => sum + (t.weight || 1), 0);
      
      // Calculate PV (Planned Value) using Task.calculatePV
      const weightedPV = (project.tasks || []).reduce((sum, t) => {
        const weight = t.weight || 1;
        const pv = Task.calculatePV(t);
        return sum + (pv * weight);
      }, 0);
      
      // Calculate EV (Earned Value) = actual progress
      const weightedActual = (project.tasks || []).reduce((sum, t) => {
        const weight = t.weight || 1;
        return sum + ((t.actual_progress || 0) * weight);
      }, 0);

      const plannedValue = totalWeight > 0 ? weightedPV / totalWeight : 0;
      const earnedValue = totalWeight > 0 ? weightedActual / totalWeight : 0;
      const safePlannedValue = isNaN(plannedValue) ? 0 : plannedValue;
      const safeEarnedValue = isNaN(earnedValue) ? 0 : earnedValue;

      // Count tasks by status
      const statusCount = { Completado: 0, 'En Curso': 0, Retrasado: 0, Crítico: 0 };
      (project.tasks || []).forEach(t => {
        statusCount[t.status] = (statusCount[t.status] || 0) + 1;
      });

      // SV (Schedule Variance) = EV - PV
      const scheduleVariance = safeEarnedValue - safePlannedValue;

      return {
        id: project.id,
        name: project.name,
        category: project.category,
        plannedValue: Math.round(safePlannedValue * 100) / 100,
        earnedValue: Math.round(safeEarnedValue * 100) / 100,
        scheduleVariance: Math.round(scheduleVariance * 100) / 100,
        // Keep old names for backward compatibility
        plannedProgress: Math.round(safePlannedValue * 100) / 100,
        actualProgress: Math.round(safeEarnedValue * 100) / 100,
        statusCount,
        totalTasks: (project.tasks || []).length
      };
    });

    cache.portfolio = { ts: now, data: summary };
    res.json(summary);
  } catch (error) {
    logger.error('Get portfolio summary error', { error });
    next(error);
  }
});

export default router;

