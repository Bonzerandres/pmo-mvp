import db from '../database.js';
import { logger } from '../utils/logger.js';

export class WeeklySnapshot {
  static async create({ taskId, projectId, year, month, weekNumber, plannedStatus, actualStatus, plannedProgress, actualProgress, comments }) {
    try {
      const stmt = await db.runStmt(
        `INSERT INTO weekly_snapshots (
          task_id, project_id, year, month, week_number,
          planned_status, actual_status, planned_progress, actual_progress, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, projectId, year, month, weekNumber, plannedStatus, actualStatus, plannedProgress, actualProgress, comments]
      );
      return this.findById(stmt.lastID);
    } catch (err) {
      logger.error('WeeklySnapshot.create failed', { err, taskId, projectId });
      throw err;
    }
  }

  static async findById(id) {
    try {
      return await db.getAsync('SELECT * FROM weekly_snapshots WHERE id = ?', [id]);
    } catch (err) {
      logger.error('WeeklySnapshot.findById failed', { err, id });
      throw err;
    }
  }

  static async findByTask(taskId, { year, month }) {
    try {
      const query = `
        SELECT * FROM weekly_snapshots 
        WHERE task_id = ? 
        ${year ? 'AND year = ?' : ''} 
        ${month ? 'AND month = ?' : ''} 
        ORDER BY year DESC, month DESC, week_number DESC`;
      
      const params = [taskId];
      if (year) params.push(year);
      if (month) params.push(month);

      return await db.allAsync(query, params);
    } catch (err) {
      logger.error('WeeklySnapshot.findByTask failed', { err, taskId });
      throw err;
    }
  }

  static async findByProject(projectId, { year, month }) {
    try {
      const query = `
        SELECT ws.*, t.name as task_name, t.order_index
        FROM weekly_snapshots ws
        JOIN tasks t ON ws.task_id = t.id
        WHERE ws.project_id = ? 
        ${year ? 'AND ws.year = ?' : ''} 
        ${month ? 'AND ws.month = ?' : ''} 
        ORDER BY t.order_index ASC, t.created_at ASC, ws.week_number ASC`;
      
      const params = [projectId];
      if (year) params.push(year);
      if (month) params.push(month);

      return await db.allAsync(query, params);
    } catch (err) {
      logger.error('WeeklySnapshot.findByProject failed', { err, projectId });
      throw err;
    }
  }

  static async update(id, { plannedStatus, actualStatus, plannedProgress, actualProgress, comments }) {
    try {
      await db.runStmt(
        `UPDATE weekly_snapshots SET 
          planned_status = COALESCE(?, planned_status),
          actual_status = COALESCE(?, actual_status),
          planned_progress = COALESCE(?, planned_progress),
          actual_progress = COALESCE(?, actual_progress),
          comments = COALESCE(?, comments),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [plannedStatus, actualStatus, plannedProgress, actualProgress, comments, id]
      );
      return this.findById(id);
    } catch (err) {
      logger.error('WeeklySnapshot.update failed', { err, id });
      throw err;
    }
  }

  static async upsert({ taskId, projectId, year, month, weekNumber, ...fields }) {
    try {
      const existing = await db.getAsync(
        'SELECT id FROM weekly_snapshots WHERE task_id = ? AND year = ? AND month = ? AND week_number = ?',
        [taskId, year, month, weekNumber]
      );

      if (existing) {
        await this.update(existing.id, fields);
        return this.findById(existing.id);
      } else {
        return this.create({ taskId, projectId, year, month, weekNumber, ...fields });
      }
    } catch (err) {
      logger.error('WeeklySnapshot.upsert failed', { err, taskId });
      throw err;
    }
  }

  static async getCalendarData(projectId, { startYear, startMonth, endYear, endMonth }) {
    try {
      // Default to current month if no range provided
      if (!startYear || !startMonth) {
        const now = new Date();
        startYear = now.getFullYear();
        startMonth = now.getMonth() + 1;
        endYear = startYear;
        endMonth = startMonth;
      }

      // Ensure end date is provided
      endYear = endYear || startYear;
      endMonth = endMonth || startMonth;

      const query = `
        SELECT 
          t.id as task_id, t.name as task_name, t.order_index,
          ws.year, ws.month, ws.week_number,
          ws.planned_status, ws.actual_status,
          ws.planned_progress, ws.actual_progress,
          ws.comments
        FROM tasks t
        LEFT JOIN weekly_snapshots ws ON t.id = ws.task_id
          AND ws.year BETWEEN ? AND ?
          AND ((ws.year = ? AND ws.month >= ?) OR ws.year > ?)
          AND ((ws.year = ? AND ws.month <= ?) OR ws.year < ?)
        WHERE t.project_id = ?
        ORDER BY t.order_index ASC, t.created_at ASC, ws.year ASC, ws.month ASC, ws.week_number ASC`;

      const rows = await db.allAsync(query, [
        startYear, endYear,
        startYear, startMonth, startYear,
        endYear, endMonth, endYear,
        projectId
      ]);

      // Group by task
      const taskMap = new Map();
      rows.forEach(row => {
        if (!taskMap.has(row.task_id)) {
          taskMap.set(row.task_id, {
            id: row.task_id,
            name: row.task_name,
            order_index: row.order_index,
            weeks: []
          });
        }

        if (row.year && row.month && row.week_number) {
          taskMap.get(row.task_id).weeks.push({
            year: row.year,
            month: row.month,
            week: row.week_number,
            plannedStatus: row.planned_status,
            actualStatus: row.actual_status,
            plannedProgress: row.planned_progress,
            actualProgress: row.actual_progress,
            comments: row.comments
          });
        }
      });

      return Array.from(taskMap.values());
    } catch (err) {
      logger.error('WeeklySnapshot.getCalendarData failed', { err, projectId });
      throw err;
    }
  }

  static async getWeeklySummary(projectId, year, month, weekNumber) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN actual_progress >= 100 THEN 1 END) as completed_tasks,
          COALESCE(AVG(planned_progress), 0) as avg_planned_progress,
          COALESCE(AVG(actual_progress), 0) as avg_actual_progress,
          COUNT(CASE WHEN actual_status = 'P' THEN 1 END) as status_p_count,
          COUNT(CASE WHEN actual_status = 'R' THEN 1 END) as status_r_count,
          COUNT(CASE WHEN actual_status = 'RP' THEN 1 END) as status_rp_count
        FROM weekly_snapshots
        WHERE ${projectId ? 'project_id = ? AND' : ''}
          year = ? AND month = ? AND week_number = ?`;

      const params = projectId ? [projectId, year, month, weekNumber] : [year, month, weekNumber];
      const summary = await db.getAsync(query, params);

      return {
        totalTasks: Number(summary.total_tasks) || 0,
        completedTasks: Number(summary.completed_tasks) || 0,
        averagePlannedProgress: Math.round((Number(summary.avg_planned_progress) || 0) * 100) / 100,
        averageActualProgress: Math.round((Number(summary.avg_actual_progress) || 0) * 100) / 100,
        deviation: Math.round(((Number(summary.avg_actual_progress) || 0) - (Number(summary.avg_planned_progress) || 0)) * 100) / 100,
        statusCounts: {
          programado: Number(summary.status_p_count) || 0,
          real: Number(summary.status_r_count) || 0,
          reprogramado: Number(summary.status_rp_count) || 0
        }
      };
    } catch (err) {
      logger.error('WeeklySnapshot.getWeeklySummary failed', { err, projectId });
      throw err;
    }
  }

  static getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Calculate week number (1-4)
    let weekNumber;
    if (day <= 7) weekNumber = 1;
    else if (day <= 14) weekNumber = 2;
    else if (day <= 21) weekNumber = 3;
    else weekNumber = 4;

    return { year, month, weekNumber };
  }

  static getWeekDateRange(year, month, weekNumber) {
    const startDay = (weekNumber - 1) * 7 + 1;
    const date = new Date(year, month - 1, startDay);
    const endDate = new Date(year, month - 1, Math.min(startDay + 6, new Date(year, month, 0).getDate()));
    
    return {
      start: date,
      end: endDate
    };
  }

  static async delete(id) {
    try {
      await db.runStmt('DELETE FROM weekly_snapshots WHERE id = ?', [id]);
      return true;
    } catch (err) {
      logger.error('WeeklySnapshot.delete failed', { err, id });
      throw err;
    }
  }
}