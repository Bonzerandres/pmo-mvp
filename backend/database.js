import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB = path.join(__dirname, 'database.db');
const dbPath = process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : DEFAULT_DB;
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to open database', { err, path: dbPath });
    throw err;
  }
  logger.info('Opened SQLite database', { path: dbPath });
});
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
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
    await db.runStmt('PRAGMA journal_mode = WAL;');
    await db.runStmt('PRAGMA busy_timeout = 5000;');
    await db.runStmt('PRAGMA synchronous = NORMAL;');
    await db.runStmt('PRAGMA foreign_keys = ON;');
    logger.info('Applied SQLite pragmas: WAL, busy_timeout=5000, synchronous=NORMAL');
  } catch (err) {
    logger.error('Failed to apply pragmas', { err });
    throw err;
  }
}
async function columnExists(table, column) {
  const row = await db.getAsync(`PRAGMA table_info(${table});`);
  const cols = await db.allAsync(`PRAGMA table_info(${table});`);
  return cols.some(c => c.name === column);
}
async function addColumnIfNotExists(table, columnDef) {
  const colName = columnDef.split(/\s+/)[0];
  const exists = await columnExists(table, colName);
  if (!exists) {
    await db.runStmt(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    logger.info(`Added column ${colName} to ${table}`);
  } else {
    logger.info(`Column ${colName} already exists on ${table}, skipping`);
  }
}
export async function initDatabase() {
  try {
    await applyPragmas();
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
    try {
      await addColumnIfNotExists('tasks', "priority INTEGER DEFAULT 2 CHECK(priority IN (1,2,3))");
      await addColumnIfNotExists('tasks', "real_delivery_date TEXT");
      await addColumnIfNotExists('tasks', "parent_task_id INTEGER");
      await addColumnIfNotExists('tasks', "order_index INTEGER DEFAULT 0");
      await addColumnIfNotExists('tasks', "is_macro_process INTEGER DEFAULT 0");
    } catch (err) {
      logger.error('Failed to add migrated task columns', { err });
      throw err;
    }
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS weekly_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      year INTEGER NOT NULL CHECK(year >= 2020 AND year <= 2030),
      month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
      week_number INTEGER NOT NULL CHECK(week_number >= 1 AND week_number <= 4),
      planned_status TEXT NOT NULL CHECK(planned_status IN ('P','R','RP')),
      actual_status TEXT NOT NULL CHECK(actual_status IN ('P','R','RP')),
      planned_progress REAL DEFAULT 0 CHECK(planned_progress >= 0 AND planned_progress <= 100),
      actual_progress REAL DEFAULT 0 CHECK(actual_progress >= 0 AND actual_progress <= 100),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(task_id, year, month, week_number)
    )
  `);
  await db.runStmt('CREATE INDEX IF NOT EXISTS idx_snapshots_project_date ON weekly_snapshots(project_id, year, month)');
  await db.runStmt('CREATE INDEX IF NOT EXISTS idx_snapshots_task_date ON weekly_snapshots(task_id, year, month)');
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
  await db.runStmt(`
    CREATE TABLE IF NOT EXISTS grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'completed', 'cancelled')),
      project_id INTEGER,
      assigned_to INTEGER,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
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
db.beginTransaction = function() {
  return db.runAsync('BEGIN TRANSACTION');
};

db.commitTransaction = function() {
  return db.runAsync('COMMIT');
};

db.rollbackTransaction = function() {
  return db.runAsync('ROLLBACK');
};
db.checkIntegrity = async function() {
  const res = await db.allAsync('PRAGMA integrity_check');
  return res;
};

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

