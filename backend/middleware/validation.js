import { body, param, validationResult } from 'express-validator';

export const loginValidation = [
  body('username').isString().isLength({ min: 3, max: 50 }).trim(),
  body('password').isString().isLength({ min: 6, max: 100 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const projectCreateValidation = [
  body('name').isString().isLength({ min: 1, max: 200 }).trim(),
  body('category').optional().isString().trim(),
  body('description').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const projectUpdateValidation = [
  body('name').optional().isString().isLength({ min: 1, max: 200 }).trim(),
  body('category').optional().isString().trim(),
  body('description').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const taskCreateValidation = [
  body('name').isString().isLength({ min: 1 }).trim(),
  body('responsible').isString().isLength({ min: 1 }).trim(),
  body('weight').optional().isFloat({ min: 0.1, max: 10 }),
  body('plannedProgress').optional().isFloat({ min: 0, max: 100 }),
  body('estimatedDate').optional().isISO8601(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const taskUpdateValidation = [
  body('actualProgress').optional().isFloat({ min: 0, max: 100 }),
  body('delayDays').optional().isInt({ min: 0 }),
  body('comments').optional().isString().isLength({ max: 1000 }),
  body('evidence').optional().isString().isLength({ max: 1000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];
