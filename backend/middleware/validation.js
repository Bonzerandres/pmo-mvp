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

export const snapshotCreateValidation = [
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('weekNumber').isInt({ min: 1, max: 4 }).withMessage('Week number must be between 1 and 4'),
  body('plannedStatus').optional().isIn(['P', 'R', 'RP']).withMessage('Planned status must be P, R, or RP'),
  body('actualStatus').optional().isIn(['P', 'R', 'RP']).withMessage('Actual status must be P, R, or RP'),
  body('plannedProgress').optional().isFloat({ min: 0, max: 100 }).withMessage('Planned progress must be 0-100'),
  body('actualProgress').optional().isFloat({ min: 0, max: 100 }).withMessage('Actual progress must be 0-100'),
  body('comments').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const snapshotUpdateValidation = [
  body('plannedStatus').optional().isIn(['P', 'R', 'RP']).withMessage('Planned status must be P, R, or RP'),
  body('actualStatus').optional().isIn(['P', 'R', 'RP']).withMessage('Actual status must be P, R, or RP'),
  body('plannedProgress').optional().isFloat({ min: 0, max: 100 }).withMessage('Planned progress must be 0-100'),
  body('actualProgress').optional().isFloat({ min: 0, max: 100 }).withMessage('Actual progress must be 0-100'),
  body('comments').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const calendarQueryValidation = [
  body('startYear').optional().isInt({ min: 2020, max: 2030 }).withMessage('Start year must be between 2020 and 2030'),
  body('startMonth').optional().isInt({ min: 1, max: 12 }).withMessage('Start month must be between 1 and 12'),
  body('endYear').optional().isInt({ min: 2020, max: 2030 }).withMessage('End year must be between 2020 and 2030'),
  body('endMonth').optional().isInt({ min: 1, max: 12 }).withMessage('End month must be between 1 and 12'),
  body('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('week').optional().isInt({ min: 1, max: 4 }).withMessage('Week must be between 1 and 4'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];
