import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import nudgeRoutes from './routes/nudgeRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no Origin header (e.g. same-origin, curl, server-to-server).
        if (!origin) return callback(null, true);
        // Always allow Chrome extension service workers regardless of CORS_ORIGIN setting.
        if (origin.startsWith('chrome-extension://')) return callback(null, true);
        // Allow the configured origin (wildcard or explicit domain).
        if (env.allowedOrigin === '*' || origin === env.allowedOrigin) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
    }),
  );
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('Ditch The Scroll server is running');
  });

  app.use('/auth', authRoutes);
  app.use('/nudges', nudgeRoutes);
  app.use('/activity', activityRoutes);
  app.use('/push', pushRoutes);

  return app;
}
