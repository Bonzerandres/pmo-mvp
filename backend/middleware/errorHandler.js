import { logger } from '../utils/logger.js';

class BaseError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends BaseError { constructor(message, meta) { super(message || 'Validation error', 400, 'VALIDATION_ERROR'); this.meta = meta; } }
export class UnauthorizedError extends BaseError { constructor(message) { super(message || 'Unauthorized', 401, 'UNAUTHORIZED'); } }
export class ForbiddenError extends BaseError { constructor(message) { super(message || 'Forbidden', 403, 'FORBIDDEN'); } }
export class NotFoundError extends BaseError { constructor(message) { super(message || 'Not Found', 404, 'NOT_FOUND'); } }
export class ConflictError extends BaseError { constructor(message) { super(message || 'Conflict', 409, 'CONFLICT'); } }
export class InternalServerError extends BaseError { constructor(message) { super(message || 'Internal Server Error', 500, 'INTERNAL_ERROR'); } }

export function errorHandler(req, res, next) {
  // eslint-disable-next-line no-unused-vars
  return (err) => {
    if (!err) return next();
    const status = err.status || 500;
    const safe = {
      message: status >= 500 ? 'Internal server error' : err.message,
      code: err.code || 'ERROR',
    };
    const payload = { ...safe };
    if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack;
    if (err.meta) payload.meta = err.meta;
    logger.error('Unhandled error in route', { err });
    res.status(status).json(payload);
  };
}

// express error-handling middleware signature
export function expressErrorHandler(err, req, res, next) {
  const status = err.status || 500;
  const response = {
    message: status >= 500 ? 'Internal server error' : err.message,
    code: err.code || 'ERROR',
    requestId: req.requestId || null,
  };
  if (err.meta) response.meta = err.meta;
  if (process.env.NODE_ENV !== 'production') response.stack = err.stack;
  logger.error('Express error', { err, path: req.path, method: req.method, requestId: req.requestId });
  res.status(status).json(response);
}

export default expressErrorHandler;
