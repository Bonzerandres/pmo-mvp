import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB = path.join(__dirname, 'database.db');
const dbPath = process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : DEFAULT_DB;

// Open the database in serialized mode (default) but with pragmas applied
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to open database', { err, path: dbPath });
    throw err;
  }
  logger.info('Opened SQLite database', { path: dbPath });
});

// Promisify commonly used methods
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Helper to run statements that return the Statement via callback
db.runStmt = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

async function applyPragmas() {
  try {
    // Enable WAL for better concurrency on Windows
    await db.runStmt('PRAGMA journal_mode = WAL;');
    // Wait up to 5000ms on locked DB
    await db.runStmt('PRAGMA busy_timeout = 5000;');
    // Balance durability and performance when using WAL
    await db.runStmt('PRAGMA synchronous = NORMAL;');
    logger.info('Applied SQLite pragmas: WAL, busy_timeout=5000, synchronous=NORMAL');
  } catch (err) {
    logger.error('Failed to apply pragmas', { err });
    throw err;
  }
}

// Initialize database schema
export async function initDatabase() {
  try {
    await applyPragmas();
  // Users table
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('CEO', 'CTO', 'PM', 'Admin')),
      canEdit INTEGER DEFAULT 0,
      canView TEXT DEFAULT 'all' CHECK(canView IN ('all', 'assigned')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tasks table (Etapas de implementación)
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      responsible TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      planned_progress REAL DEFAULT 0 CHECK(planned_progress >= 0 AND planned_progress <= 100),
      actual_progress REAL DEFAULT 0 CHECK(actual_progress >= 0 AND actual_progress <= 100),
      status TEXT DEFAULT 'En Curso' CHECK(status IN ('Completado', 'En Curso', 'Retrasado', 'Crítico')),
      estimated_date TEXT,
      delay_days INTEGER DEFAULT 0,
      comments TEXT,
      evidence TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // User-Project assignments
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS user_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(user_id, project_id)
    )
  `);

  // Activity log for audit trail
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER,
      task_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Error initializing database', { err });
    throw err;
  }
}

export async function closeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database', { err });
          return reject(err);
        }
        logger.info('Closed database connection');
        resolve();
      });
    } catch (err) {
      logger.error('Unexpected error closing database', { err });
      reject(err);
    }
  });
}

export default db;

