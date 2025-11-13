import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import calendarRoutes from './routes/calendar.js';
import usersRoutes from './routes/users.js';
import { requestLogger } from './middleware/requestLogger.js';
import expressErrorHandler from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend env explicitly (stable path)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// For static serving (if needed)
const staticDir = path.resolve(__dirname, '../frontend/dist');
const PORT = process.env.PORT || 3001;

// Middleware
// Dynamic CORS origin from env
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed from origin: ' + origin), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
logger.info('CORS allowed origins:', allowedOrigins);
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/user', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PMO API is running' });
});

// Welcome endpoint
app.get('/api/welcome', (req, res) => {
  res.json({ message: 'Welcome to the PMO API Service!' });
});

// Hello endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the PMO API!' });
});

// Root route: in production serve frontend, otherwise redirect to API health
if (process.env.NODE_ENV === 'production') {
  const staticDir = path.resolve(process.cwd(), 'frontend', 'dist');
  app.use(express.static(staticDir));
  app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.redirect('/api/health'));
}

// Initialize database and start server
let server;

async function startServer() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${PORT}`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      try {
        logger.info('Received shutdown signal', { signal });
        if (server) {
          server.close(() => logger.info('HTTP server closed'));
        }
        await closeDatabase();
        logger.info('Shutdown complete');
        if (signal === 'FORCE') {
          process.exit(0);
        }
      } catch (err) {
        logger.error('Error during shutdown', { err });
        if (signal === 'FORCE') {
          process.exit(1);
        }
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { err });
      // attempt graceful shutdown
      shutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}


// Add catch-all 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// mount global error handler last
app.use(expressErrorHandler);

startServer();

