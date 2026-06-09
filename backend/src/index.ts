import express from 'express';
import cors from 'cors';
import { config } from './config';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import fixtureRoutes from './routes/fixtures';
import predictionRoutes from './routes/predictions';
import bracketRoutes from './routes/brackets';
import leaderboardRoutes from './routes/leaderboard';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/brackets', bracketRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, () => {
  console.log(`CupPredict API running on port ${config.port}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
