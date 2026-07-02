import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { familyRouter } from './routes/family.routes.js';
import { childrenRouter } from './routes/children.routes.js';
import { curriculumRouter } from './routes/curriculum.routes.js';
import { examRouter } from './routes/exam.routes.js';
import { aiRouter } from './routes/ai.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'treasure-hunter-api' });
  });

  app.use('/auth', authRouter);
  app.use('/family', familyRouter);
  app.use('/children', childrenRouter);
  app.use('/curriculum', curriculumRouter);
  app.use('/exam', examRouter);
  app.use('/ai', aiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  return app;
}
