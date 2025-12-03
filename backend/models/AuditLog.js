import db from '../database.js';
import { logger } from '../utils/logger.js';

export class AuditLog {
  static async create({ action, entityType, entityId, userId, details, ipAddress }) {
    try {
      const result = await db.runStmt(
        `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [action, entityType, entityId, userId, JSON.stringify(details), ipAddress]
      );
      return result.lastID;
    } catch (err) {
      logger.error('AuditLog.create failed', { err });
      throw err;
    }
  }

  static async findByEntity(entityType, entityId, { limit = 50 } = {}) {
    try {
      return await db.allAsync(
        'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC LIMIT ?',
        [entityType, entityId, limit]
      );
    } catch (err) {
      logger.error('AuditLog.findByEntity failed', { err });
      throw err;
    }
  }
}