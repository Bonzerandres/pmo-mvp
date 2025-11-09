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

    const summary = projects.map(project => {
      const totalWeight = (project.tasks || []).reduce((sum, t) => sum + (t.weight || 1), 0);
      const weightedPlanned = (project.tasks || []).reduce((sum, t) => {
        const weight = t.weight || 1;
        return sum + ((t.planned_progress || 0) * weight);
      }, 0);
      const weightedActual = (project.tasks || []).reduce((sum, t) => {
        const weight = t.weight || 1;
        return sum + ((t.actual_progress || 0) * weight);
      }, 0);

      const plannedProgress = totalWeight > 0 ? weightedPlanned / totalWeight : 0;
      const actualProgress = totalWeight > 0 ? weightedActual / totalWeight : 0;

      // Count tasks by status
      const statusCount = { Completado: 0, 'En Curso': 0, Retrasado: 0, Crítico: 0 };
      (project.tasks || []).forEach(t => {
        statusCount[t.status] = (statusCount[t.status] || 0) + 1;
      });

      return {
        id: project.id,
        name: project.name,
        category: project.category,
        plannedProgress: Math.round(plannedProgress * 100) / 100,
        actualProgress: Math.round(actualProgress * 100) / 100,
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

