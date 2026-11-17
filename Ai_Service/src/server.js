import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

let isShuttingDown = false;

const server = app.listen(env.PORT, () => {
  logger.info(`AI Microservice listening on port ${env.PORT}`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    models: env.GEMINI_MODELS,
  });
});

server.on('error', (err) => {
  logger.error('Failed to start server:', { error: err.message });
  process.exit(1);
});

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during HTTP server shutdown:', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server closed successfully. Process exiting.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 10 seconds
  setTimeout(() => {
    logger.warn('Forcing process exit after shutdown timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
