import db from '../database.js';
import { logger } from '../utils/logger.js';

// Fire-and-forget activity logger. Does not block the response.
export const logActivity = (req, res, next) => {
  const originalSend = res.json;

  res.json = function (data) {
    try {
      if (req.user && req.method !== 'GET') {
        const action = `${req.method} ${req.path}`;
        const details = JSON.stringify({ body: req.body, params: req.params, query: req.query });

        // Do not await - fire-and-forget
        db.runStmt(
          `INSERT INTO activity_log (user_id, project_id, task_id, action, details) VALUES (?, ?, ?, ?, ?)`,
          [
            req.user.id,
            req.body?.projectId || req.params?.projectId || null,
            req.body?.taskId || req.params?.taskId || null,
            action,
            details
          ]
        ).catch((err) => {
          logger.error('Error logging activity', { err, requestId: req.requestId });
        });
      }
    } catch (err) {
      logger.error('Unexpected error in logActivity middleware', { err });
    }

    return originalSend.call(this, data);
  };

  next();
};

