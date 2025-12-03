import db from '../database.js';
import { logger } from '../utils/logger.js';
import { Task } from './Task.js';

export class Project {
  static async create({ name, category, description }) {
    try {
      const stmt = await db.runStmt(
        `INSERT INTO projects (name, category, description) VALUES (?, ?, ?)`,
        [name, category, description]
      );
      const lastId = stmt.lastID || stmt.insertId;
      return this.findById(lastId);
    } catch (err) {
      logger.error('Project.create failed', { err });
      throw err;
    }
  }

  static async findById(id) {
    try {
      return await db.getAsync('SELECT * FROM projects WHERE id = ?', [id]);
    } catch (err) {
      logger.error('Project.findById failed', { err, id });
      throw err;
    }
  }

  static async findAll({ page = 1, limit = 50 } = {}) {
    try {
      const offset = (page - 1) * limit;
      return await db.allAsync('SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    } catch (err) {
      logger.error('Project.findAll failed', { err, page, limit });
      throw err;
    }
  }

  static async update(id, { name, category, description }) {
    try {
      await db.runAsync(
        `UPDATE projects SET name = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, category, description, id]
      );
      return this.findById(id);
    } catch (err) {
      logger.error('Project.update failed', { err, id });
      throw err;
    }
  }

  static async delete(id) {
    try {
      const project = await this.findById(id);
      if (!project) {
        return null;
      }
      const taskCount = await Task.getTaskCount(id);
      logger.info('Deleting project and associated tasks', { id, name: project.name, taskCount });
      await db.beginTransaction();

      try {
        await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
        await db.commitTransaction();

        logger.info('Project deleted successfully', { id });
        return { success: true, deletedProjectId: parseInt(id, 10), deletedTaskCount: taskCount };
      } catch (err) {
        await db.rollbackTransaction();
        throw err;
      }
    } catch (err) {
      logger.error('Project.delete failed', { err, id });
      throw err;
    }
  }

  static async getWithTasks(id) {
    try {
      const rows = await db.allAsync(
        `SELECT p.id as project_id, p.name as project_name, p.category as project_category, p.description as project_description,
                p.created_at as project_created_at, p.updated_at as project_updated_at,
                t.id as task_id, t.name as task_name, t.responsible as task_responsible,
                t.weight as task_weight, t.planned_progress as task_planned_progress,
                t.actual_progress as task_actual_progress, t.status as task_status,
                t.estimated_date as task_estimated_date, t.delay_days as task_delay_days,
                t.comments as task_comments, t.evidence as task_evidence, t.created_at as task_created_at, t.updated_at as task_updated_at
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         WHERE p.id = ?
         ORDER BY t.created_at ASC`,
        [id]
      );

      if (!rows || rows.length === 0) {
        const project = await this.findById(id);
        if (!project) return null;
        return { ...project, tasks: [] };
      }

      const projectRow = rows[0];
      const project = {
        id: projectRow.project_id,
        name: projectRow.project_name,
        category: projectRow.project_category,
        description: projectRow.project_description,
        created_at: projectRow.project_created_at,
        updated_at: projectRow.project_updated_at,
        tasks: []
      };

      for (const r of rows) {
        if (r.task_id) {
          project.tasks.push({
            id: r.task_id,
            name: r.task_name,
            responsible: r.task_responsible,
            weight: r.task_weight,
            planned_progress: r.task_planned_progress,
            actual_progress: r.task_actual_progress,
            status: r.task_status,
            estimated_date: r.task_estimated_date,
            delay_days: r.task_delay_days,
            comments: r.task_comments,
            evidence: r.task_evidence,
            created_at: r.task_created_at,
            updated_at: r.task_updated_at
          });
        }
      }

      return project;
    } catch (err) {
      logger.error('Project.getWithTasks failed', { err, id });
      throw err;
    }
  }

  static async getAllWithTasks({ page = 1, limit = 50 } = {}) {
    try {
      const offset = (page - 1) * limit;
      const rows = await db.allAsync(
        `SELECT p.id as project_id, p.name as project_name, p.category as project_category, p.description as project_description,
                p.created_at as project_created_at, p.updated_at as project_updated_at,
                t.id as task_id, t.name as task_name, t.responsible as task_responsible,
                t.weight as task_weight, t.planned_progress as task_planned_progress,
                t.actual_progress as task_actual_progress, t.status as task_status,
                t.estimated_date as task_estimated_date, t.delay_days as task_delay_days,
                t.comments as task_comments, t.evidence as task_evidence, t.created_at as task_created_at, t.updated_at as task_updated_at
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         ORDER BY p.created_at DESC, t.created_at ASC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const projectsMap = new Map();
      for (const r of rows) {
        if (!projectsMap.has(r.project_id)) {
          projectsMap.set(r.project_id, {
            id: r.project_id,
            name: r.project_name,
            category: r.project_category,
            description: r.project_description,
            created_at: r.project_created_at,
            updated_at: r.project_updated_at,
            tasks: []
          });
        }
        if (r.task_id) {
          projectsMap.get(r.project_id).tasks.push({
            id: r.task_id,
            name: r.task_name,
            responsible: r.task_responsible,
            weight: r.task_weight,
            planned_progress: r.task_planned_progress,
            actual_progress: r.task_actual_progress,
            status: r.task_status,
            estimated_date: r.task_estimated_date,
            delay_days: r.task_delay_days,
            comments: r.task_comments,
            evidence: r.task_evidence,
            created_at: r.task_created_at,
            updated_at: r.task_updated_at
          });
        }
      }
      if (!rows || rows.length === 0) {
        const projects = await this.findAll({ page, limit });
        return projects.map(p => ({ ...p, tasks: [] }));
      }

      return Array.from(projectsMap.values());
    } catch (err) {
      logger.error('Project.getAllWithTasks failed', { err, page, limit });
      throw err;
    }
  }
  static async calculateMetrics(projectId) {
    const tasks = await db.allAsync('SELECT * FROM tasks WHERE project_id = ?', [projectId]);

    if (tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        averageProgress: 0,
        plannedValue: 0,
        earnedValue: 0,
        scheduleVariance: 0,
        totalDelayDays: 0,
        criticalTasks: 0,
        delayedTasks: 0
      };
    }

    const completedTasks = tasks.filter(t => t.status === 'Completado').length;
    const criticalTasks = tasks.filter(t => t.status === 'Crítico').length;
    const delayedTasks = tasks.filter(t => t.status === 'Retrasado' || t.status === 'Crítico').length;

    const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
    const weightedProgress = tasks.reduce((sum, t) => {
      const weight = t.weight || 1;
      return sum + ((t.actual_progress || 0) * weight);
    }, 0);
    const earnedValue = totalWeight > 0 ? weightedProgress / totalWeight : 0;
    const weightedPV = tasks.reduce((sum, t) => {
      const weight = t.weight || 1;
      const pv = Task.calculatePV(t);
      return sum + (pv * weight);
    }, 0);
    const plannedValue = totalWeight > 0 ? weightedPV / totalWeight : 0;
    const scheduleVariance = earnedValue - plannedValue;

    const totalDelayDays = tasks.reduce((sum, t) => sum + (t.delay_days || 0), 0);

    return {
      totalTasks: tasks.length,
      completedTasks,
      averageProgress: Math.round(earnedValue * 100) / 100,
      plannedValue: Math.round(plannedValue * 100) / 100,
      earnedValue: Math.round(earnedValue * 100) / 100,
      scheduleVariance: Math.round(scheduleVariance * 100) / 100,
      totalDelayDays,
      criticalTasks,
      delayedTasks
    };
  }
}

