import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase, closeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import { requestLogger } from './middleware/requestLogger.js';
import expressErrorHandler from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Load backend env explicitly
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PMO API is running' });
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

    server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      try {
        logger.info('Received shutdown signal', { signal });
        if (server) {
          server.close(() => logger.info('HTTP server closed'));
        }
        await closeDatabase();
        logger.info('Shutdown complete, exiting');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { err });
        process.exit(1);
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

    // mount global error handler last
    app.use(expressErrorHandler);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

