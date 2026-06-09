import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config } from './config';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import fixtureRoutes from './routes/fixtures';
import predictionRoutes from './routes/predictions';
import bracketRoutes from './routes/brackets';
import leaderboardRoutes from './routes/leaderboard';
import syncRoutes from './routes/sync';
import { syncAllFixtures, syncLiveScores, processFinishedMatches, clearOldData } from './services/sync';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/brackets', bracketRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/sync', syncRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, async () => {
  console.log(`CupPredict API running on port ${config.port}`);

  if (config.rapidApiKey) {
    try {
      await clearOldData();
      await syncAllFixtures();
      console.log('[cron] Initial sync complete');
    } catch (err) {
      console.error('[cron] Initial sync failed:', err);
    }

    cron.schedule('*/15 * * * *', async () => {
      console.log('[cron] Checking live scores...');
      try {
        await syncLiveScores();
        const scored = await processFinishedMatches();
        if (scored > 0) console.log(`[cron] Scored ${scored} predictions`);
      } catch (err) {
        console.error('[cron] Live sync error:', err);
      }
    });
  } else {
    console.log('[cron] RAPIDAPI_KEY not set, skipping sync');
  }
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
