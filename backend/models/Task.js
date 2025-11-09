import db from '../database.js';
import { logger } from '../utils/logger.js';

export class Task {
  static async create({ projectId, name, responsible, weight = 1.0, plannedProgress = 0, estimatedDate }) {
    try {
      const status = this.calculateStatus(plannedProgress, 0, 0);
      const result = await db.runStmt(
        `INSERT INTO tasks (project_id, name, responsible, weight, planned_progress, actual_progress, 
                           status, estimated_date, delay_days) 
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`,
        [projectId, name, responsible, weight, plannedProgress, status, estimatedDate]
      );
      return this.findById(result.lastID);
    } catch (err) {
      logger.error('Task.create failed', { err });
      throw err;
    }
  }

  static async findById(id) {
    try {
      return await db.getAsync('SELECT * FROM tasks WHERE id = ?', [id]);
    } catch (err) {
      logger.error('Task.findById failed', { err, id });
      throw err;
    }
  }

  static async findByProject(projectId) {
    try {
      return await db.allAsync('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC', [projectId]);
    } catch (err) {
      logger.error('Task.findByProject failed', { err, projectId });
      throw err;
    }
  }

  static async getTaskCount(projectId) {
    try {
      const result = await db.getAsync(
        'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
        [projectId]
      );
      return result.count || 0;
    } catch (err) {
      logger.error('Task.getTaskCount failed', { err, projectId });
      throw err;
    }
  }

  static async update(id, { name, responsible, weight, plannedProgress, actualProgress, estimatedDate, delayDays, comments, evidence }) {
    try {
      const task = await this.findById(id);
      if (!task) throw new Error('Task not found');

      // Calculate delay days if not provided or if estimatedDate changed
      const finalEstimatedDate = estimatedDate ?? task.estimated_date;
      const calculatedDelayDays = delayDays !== undefined ? delayDays : this.calculateDelayDays(finalEstimatedDate);
      
      // Calculate status based on progress and delays
      const finalPlannedProgress = plannedProgress ?? task.planned_progress;
      const finalActualProgress = actualProgress ?? task.actual_progress;
      const status = this.calculateStatus(
        finalPlannedProgress,
        finalActualProgress,
        calculatedDelayDays
      );

      await db.runStmt(
        `UPDATE tasks SET 
          name = COALESCE(?, name),
          responsible = COALESCE(?, responsible),
          weight = COALESCE(?, weight),
          planned_progress = COALESCE(?, planned_progress),
          actual_progress = COALESCE(?, actual_progress),
          status = ?,
          estimated_date = COALESCE(?, estimated_date),
          delay_days = ?,
          comments = COALESCE(?, comments),
          evidence = COALESCE(?, evidence),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, responsible, weight, plannedProgress, actualProgress, status, finalEstimatedDate, calculatedDelayDays, comments, evidence, id]
      );

      // Update project updated_at
      await db.runStmt('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [task.project_id]);

      return this.findById(id);
    } catch (err) {
      logger.error('Task.update failed', { err, id });
      throw err;
    }
  }

  static calculateStatus(plannedProgress, actualProgress, delayDays) {
    if (actualProgress >= 100) {
      return 'Completado';
    }

    const deviation = actualProgress - plannedProgress;
    
    if (deviation <= -30 || delayDays > 10) {
      return 'Crítico';
    }

    if (deviation < -10 || delayDays > 0) {
      return 'Retrasado';
    }

    return 'En Curso';
  }

  static calculateDelayDays(estimatedDate) {
    if (!estimatedDate) return 0;
    
    const estimated = new Date(estimatedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    estimated.setHours(0, 0, 0, 0);
    
    const diffTime = today - estimated;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  static async delete(id) {
    try {
      await db.runStmt('DELETE FROM tasks WHERE id = ?', [id]);
    } catch (err) {
      logger.error('Task.delete failed', { err, id });
      throw err;
    }
  }
}

