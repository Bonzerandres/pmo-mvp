import db from '../database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

export class User {
  static async create({ username, password, role, canEdit = false, canView = 'all' }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.runStmt(
        `INSERT INTO users (username, password, role, canEdit, canView)
         VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, role, canEdit ? 1 : 0, canView]
      );
      return this.findById(result.lastID || result.insertId);
    } catch (err) {
      logger.error('User.create failed', { err, username });
      throw err;
    }
  }

  static async findById(id) {
    try {
      return await db.getAsync('SELECT * FROM users WHERE id = ?', [id]);
    } catch (err) {
      logger.error('User.findById failed', { err, id });
      throw err;
    }
  }

  static async findByUsername(username) {
    try {
      return await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
    } catch (err) {
      logger.error('User.findByUsername failed', { err, username });
      throw err;
    }
  }

  static async findAll({ page = 1, limit = 50 } = {}) {
    try {
      const offset = (page - 1) * limit;
      const users = await db.allAsync(
        'SELECT id, username, role, canEdit, canView, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return users;
    } catch (err) {
      logger.error('User.findAll failed', { err });
      throw err;
    }
  }

  static async update(id, { username, password, role, canEdit, canView }) {
    try {
      let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      let params = [];
      let updates = [];

      if (username !== undefined) {
        updates.push('username = ?');
        params.push(username);
      }
      if (password !== undefined) {
        updates.push('password = ?');
        params.push(password);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        params.push(role);
      }
      if (canEdit !== undefined) {
        updates.push('canEdit = ?');
        params.push(canEdit ? 1 : 0);
      }
      if (canView !== undefined) {
        updates.push('canView = ?');
        params.push(canView);
      }

      if (updates.length === 0) {
        return this.findById(id);
      }

      query += ', ' + updates.join(', ') + ' WHERE id = ?';
      params.push(id);

      await db.runStmt(query, params);
      return this.findById(id);
    } catch (err) {
      logger.error('User.update failed', { err, id });
      throw err;
    }
  }

  static async delete(id) {
    try {
      await db.runStmt('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (err) {
      logger.error('User.delete failed', { err, id });
      throw err;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      logger.error('User.verifyPassword failed', { err });
      throw err;
    }
  }

  static async getUserProjects(userId) {
    try {
      return await db.allAsync(
        `SELECT p.* FROM projects p
         INNER JOIN user_projects up ON p.id = up.project_id
         WHERE up.user_id = ?`,
        [userId]
      );
    } catch (err) {
      logger.error('User.getUserProjects failed', { err, userId });
      throw err;
    }
  }

  static async assignProject(userId, projectId) {
    try {
      await db.runStmt('INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)', [userId, projectId]);
      return true;
    } catch (error) {
      if (String(error).includes('UNIQUE constraint')) {
        return false; // Already assigned
      }
      logger.error('User.assignProject failed', { error, userId, projectId });
      throw error;
    }
  }

  static async canAccessProject(userId, projectId) {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      // CEO, CTO, Admin can view all
      if (user.canView === 'all' || ['CEO', 'CTO', 'Admin'].includes(user.role)) {
        return true;
      }

      // PM can only view assigned projects
      const assignment = await db.getAsync('SELECT * FROM user_projects WHERE user_id = ? AND project_id = ?', [userId, projectId]);
      return !!assignment;
    } catch (err) {
      logger.error('User.canAccessProject failed', { err, userId, projectId });
      throw err;
    }
  }

  static async canEditProject(userId, projectId) {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      // Admin can always edit
      if (user.role === 'Admin') return true;

      // Check canEdit permission
      if (!user.canEdit) return false;

      // For PM, must be assigned to the project
      if (user.role === 'PM') {
        const assignment = await db.getAsync('SELECT * FROM user_projects WHERE user_id = ? AND project_id = ?', [userId, projectId]);
        return !!assignment;
      }

      // CEO/CTO cannot edit (read-only)
      return false;
    } catch (err) {
      logger.error('User.canEditProject failed', { err, userId, projectId });
      throw err;
    }
  }
}

