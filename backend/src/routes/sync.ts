import { Router, Request, Response } from 'express';
import { syncAllFixtures, syncLiveScores, processFinishedMatches, clearOldData } from '../services/sync';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/fixtures', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.query.clear === 'true') {
      await clearOldData();
    }
    await syncAllFixtures();
    res.json({ message: 'Sync complete' });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.post('/livescores', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    await syncLiveScores();
    const scored = await processFinishedMatches();
    res.json({ message: 'Live scores synced', predictionsScored: scored });
  } catch (err) {
    console.error('Live sync error:', err);
    res.status(500).json({ error: 'Live sync failed' });
  }
});

router.post('/rescore', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    await syncLiveScores();
    const scored = await processFinishedMatches();
    res.json({ message: 'Rescore complete', predictionsScored: scored });
  } catch (err) {
    console.error('Rescore error:', err);
    res.status(500).json({ error: 'Rescore failed' });
  }
});

export default router;
