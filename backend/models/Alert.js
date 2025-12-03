import db from '../database.js';
import { logger } from '../utils/logger.js';

// Simple cache for alerts to avoid regenerating too frequently
const alertCache = { ts: 0, data: null };
const ALERT_CACHE_TTL = 30 * 1000; // 30 seconds

export class Alert {
  static async generateAlerts(projectId = null) {
    try {
      const now = Date.now();
      if (!projectId && alertCache.data && now - alertCache.ts < ALERT_CACHE_TTL) {
        return alertCache.data;
      }

      let tasks;
      if (projectId) {
        tasks = await db.allAsync('SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.project_id = ?', [projectId]);
      } else {
        tasks = await db.allAsync('SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id');
      }

      const alerts = [];

      for (const task of tasks) {
        // Critical deviation: actual <= planned - 30%
        if ((task.actual_progress || 0) <= (task.planned_progress || 0) - 30) {
          alerts.push({
            type: 'critical_deviation',
            severity: 'high',
            message: `Desviación crítica en "${task.name}" del proyecto "${task.project_name}". Avance real (${task.actual_progress}%) está muy por debajo del programado (${task.planned_progress}%)`,
            projectId: task.project_id,
            taskId: task.id,
            projectName: task.project_name,
            taskName: task.name
          });
        }

        // Significant delay: delay_days > 7
        if ((task.delay_days || 0) > 7) {
          alerts.push({
            type: 'significant_delay',
            severity: 'high',
            message: `Retraso significativo en "${task.name}" del proyecto "${task.project_name}". ${task.delay_days} días de retraso`,
            projectId: task.project_id,
            taskId: task.id,
            projectName: task.project_name,
            taskName: task.name
          });
        }

        // Upcoming deadline: estimated_date <= 7 days
        if (task.estimated_date) {
          const estimated = new Date(task.estimated_date);
          const today = new Date();
          const diffTime = estimated - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays <= 7) {
            alerts.push({
              type: 'upcoming_deadline',
              severity: diffDays <= 3 ? 'high' : 'medium',
              message: `Fecha próxima a vencer: "${task.name}" del proyecto "${task.project_name}" vence en ${diffDays} día(s)`,
              projectId: task.project_id,
              taskId: task.id,
              projectName: task.project_name,
              taskName: task.name,
              daysRemaining: diffDays
            });
          }
        }

        // Overdue: estimated_date < today
        if (task.estimated_date) {
          const estimated = new Date(task.estimated_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          estimated.setHours(0, 0, 0, 0);
          
          if (estimated < today && task.status !== 'Completado') {
            alerts.push({
              type: 'overdue',
              severity: 'high',
              message: `Proyecto vencido: "${task.name}" del proyecto "${task.project_name}" ya pasó su fecha estimada`,
              projectId: task.project_id,
              taskId: task.id,
              projectName: task.project_name,
              taskName: task.name
            });
          }
        }

        // Critical status
        if (task.status === 'Crítico') {
          alerts.push({
            type: 'critical_status',
            severity: 'high',
            message: `Estado crítico: "${task.name}" del proyecto "${task.project_name}" está en estado crítico`,
            projectId: task.project_id,
            taskId: task.id,
            projectName: task.project_name,
            taskName: task.name
          });
        }
      }

      const sorted = alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      if (!projectId) {
        alertCache.ts = now;
        alertCache.data = sorted;
      }

      return sorted;
    } catch (err) {
      logger.error('Alert.generateAlerts failed', { err, projectId });
      throw err;
    }
  }

  static async getKPIs() {
    try {
      const projects = await db.allAsync('SELECT * FROM projects');
      const tasks = await db.allAsync('SELECT * FROM tasks');

      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        return projectTasks.length > 0 && projectTasks.every(t => t.status === 'Completado');
      }).length;

      const delayedProjects = projects.filter(p => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        return projectTasks.some(t => t.status === 'Retrasado' || t.status === 'Crítico');
      }).length;

      // Calculate average portfolio progress
      const projectProgresses = projects.map((p) => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        if (projectTasks.length === 0) return 0;

        const totalWeight = projectTasks.reduce((sum, t) => sum + (t.weight || 1), 0);
        const weightedProgress = projectTasks.reduce((sum, t) => {
          const weight = t.weight || 1;
          return sum + ((t.actual_progress || 0) * weight);
        }, 0);
        return totalWeight > 0 ? weightedProgress / totalWeight : 0;
      });
      const averageProgress = projectProgresses.length > 0
        ? projectProgresses.reduce((sum, p) => sum + p, 0) / projectProgresses.length
        : 0;
      const safeAverageProgress = isNaN(averageProgress) ? 0 : averageProgress;

      // Total delay days
      const totalDelayDays = tasks.reduce((sum, t) => sum + (t.delay_days || 0), 0);

      // High priority projects (with critical tasks)
      const highPriorityProjects = projects.filter(p => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        return projectTasks.some(t => t.status === 'Crítico');
      }).length;

      return {
        totalProjects,
        completedProjects,
        delayedProjects,
        averageProgress: Math.round(safeAverageProgress * 100) / 100,
        totalDelayDays,
        highPriorityProjects
      };
    } catch (err) {
      logger.error('Alert.getKPIs failed', { err });
      throw err;
    }
  }
}

