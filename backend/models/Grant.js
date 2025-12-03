import db from '../database.js';
import { logger } from '../utils/logger.js';

export class Grant {
  static async create({ name, description, amount, status = 'active', projectId = null, assignedTo = null, startDate, endDate }) {
    try {
      const result = await db.runStmt(
        `INSERT INTO grants (name, description, amount, status, project_id, assigned_to, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, amount, status, projectId, assignedTo, startDate, endDate]
      );
      return this.findById(result.lastID || result.insertId);
    } catch (err) {
      logger.error('Grant.create failed', { err, name });
      throw err;
    }
  }

  static async findById(id) {
    try {
      return await db.getAsync('SELECT * FROM grants WHERE id = ?', [id]);
    } catch (err) {
      logger.error('Grant.findById failed', { err, id });
      throw err;
    }
  }

  static async findAll({ page = 1, limit = 50, status = null } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM grants';
      let params = [];

      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return await db.allAsync(query, params);
    } catch (err) {
      logger.error('Grant.findAll failed', { err });
      throw err;
    }
  }

  static async update(id, { name, description, amount, status, projectId, assignedTo, startDate, endDate }) {
    try {
      await db.runStmt(
        `UPDATE grants SET name = ?, description = ?, amount = ?, status = ?, project_id = ?, assigned_to = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, amount, status, projectId, assignedTo, startDate, endDate, id]
      );
      return this.findById(id);
    } catch (err) {
      logger.error('Grant.update failed', { err, id });
      throw err;
    }
  }

  static async delete(id) {
    try {
      await db.runStmt('DELETE FROM grants WHERE id = ?', [id]);
      return true;
    } catch (err) {
      logger.error('Grant.delete failed', { err, id });
      throw err;
    }
  }

  static async getTotalAmount({ status = 'active' } = {}) {
    try {
      const result = await db.getAsync(
        'SELECT SUM(amount) as total FROM grants WHERE status = ?',
        [status]
      );
      return result?.total || 0;
    } catch (err) {
      logger.error('Grant.getTotalAmount failed', { err });
      throw err;
    }
  }

  static async getGrantsByProject(projectId) {
    try {
      return await db.allAsync(
        'SELECT * FROM grants WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      );
    } catch (err) {
      logger.error('Grant.getGrantsByProject failed', { err, projectId });
      throw err;
    }
  }

  static async getGrantsByAssignee(userId) {
    try {
      return await db.allAsync(
        'SELECT * FROM grants WHERE assigned_to = ? ORDER BY created_at DESC',
        [userId]
      );
    } catch (err) {
      logger.error('Grant.getGrantsByAssignee failed', { err, userId });
      throw err;
    }
  }
}