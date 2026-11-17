import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { ApiError } from './utils/ApiError.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, mobile apps, server-to-server)
        if (!origin || env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new ApiError(403, `CORS policy violation: Origin "${origin}" not allowed`));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    })
  );

  // Body Parsing with configured limits
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

  // Mount API Endpoints
  app.use('/', healthRoutes);
  app.use('/api/ai', aiRoutes);

  // 404 Handler for undefined routes
  app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Global Error Handling Middleware
  app.use((err, req, res, next) => {
    // 1. Handle SyntaxError for malformed JSON bodies
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        success: false,
        error: 'Malformed JSON body in request',
      });
    }

    // 2. Handle Custom Operational ApiErrors
    if (err instanceof ApiError) {
      if (err.statusCode >= 500) {
        logger.error(`Server Error: ${err.message}`, { statusCode: err.statusCode, details: err.details });
      }
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }

    // 3. Handle Unexpected Provider or Internal Errors
    logger.error(`Unhandled Error: ${err?.message || err}`, { stack: env.NODE_ENV === 'development' ? err?.stack : undefined });

    return res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred',
    });
  });

  return app;
}
