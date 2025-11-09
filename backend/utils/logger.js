import util from 'util';
import os from 'os';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return LEVELS[level] <= LEVELS[LOG_LEVEL];
}

function formatMessage(level, msg, meta) {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, pid: process.pid, host: os.hostname() };
  const out = Object.assign({}, base, { message: msg });
  if (meta) out.meta = meta;
  return out;
}

function output(level, msg, meta) {
  if (!shouldLog(level)) return;
  const formatted = formatMessage(level, msg, meta);
  if (ENV === 'production') {
    // JSON-friendly for log aggregation
    console.log(JSON.stringify(formatted));
  } else {
    // Human-friendly colored output in development
    const colors = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[32m', debug: '\x1b[36m' };
    const reset = '\x1b[0m';
    const line = `${formatted.timestamp} ${colors[level] || ''}${level.toUpperCase()}${reset} - ${formatted.message}`;
    console.log(line);
    if (formatted.meta) console.log(util.inspect(formatted.meta, { colors: true, depth: 5 }));
  }
}

export const logger = {
  error: (msg, meta) => output('error', msg, meta),
  warn: (msg, meta) => output('warn', msg, meta),
  info: (msg, meta) => output('info', msg, meta),
  debug: (msg, meta) => output('debug', msg, meta),
};
