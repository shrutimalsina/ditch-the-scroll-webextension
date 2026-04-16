import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import nudgeRoutes from './routes/nudgeRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import { env } from './config/env.js';
import { createNudge } from '@ditch-the-scroll/shared';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.allowedOrigin }));
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('Ditch The Scroll server is running');
  });

  app.post('/session', async (req, res) => {
    const { userId = 'anonymous', site, minutes = 1 } = req.body || {};

    const nudge = createNudge({
      triggerType: 'doomscroll',
      site,
      minutes,
    });

    return res.status(200).json({ ok: true, userId, nudge: nudge.message, detail: nudge });
  });

  app.use('/auth', authRoutes);
  app.use('/nudges', nudgeRoutes);
  app.use('/activity', activityRoutes);
  app.use('/push', pushRoutes);

  return app;
}
