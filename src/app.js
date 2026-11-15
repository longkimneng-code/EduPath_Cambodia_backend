import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './Route/authRoutes.js';
import userRoute from './Route/userRoutes.js';
import studentRoute from './Route/studentRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { createDiscoveryRoutes } from './Route/discoveryRoutes.js';
import { RequestError } from './service/discoveryQuery.js';

export function createApp({ discoveryService, logger = console } = {}) {
  const app = express();

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie']
  }));

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/auth', authRoute);
  app.use('/api/users', userRoute);
  app.use('/api/students', studentRoute);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', createDiscoveryRoutes(discoveryService));
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
  app.use((error, req, res, next) => {
    if (error instanceof RequestError) return res.status(error.status).json({ message: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
    logger.error('Request failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  });
  return app;
}
