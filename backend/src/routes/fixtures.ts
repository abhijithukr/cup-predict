import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const fixtures = await prisma.fixture.findMany({
      include: { teamA: true, teamB: true, predictions: true },
      orderBy: { kickoffTime: 'asc' },
    });
    res.json({ value: fixtures, Count: fixtures.length });
  } catch (err) {
    console.error('Fetch fixtures error:', err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

router.get('/next', authMiddleware, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const fixture = await prisma.fixture.findFirst({
      where: {
        status: { not: 'finished' },
        kickoffTime: { gte: now },
      },
      include: { teamA: true, teamB: true, predictions: { where: { userId: req.user!.userId } } },
      orderBy: { kickoffTime: 'asc' },
    });
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (err) {
    console.error('Fetch next fixture error:', err);
    res.status(500).json({ error: 'Failed to fetch next fixture' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { id: req.params.id },
      include: { teamA: true, teamB: true, predictions: true },
    });
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (err) {
    console.error('Fetch fixture error:', err);
    res.status(500).json({ error: 'Failed to fetch fixture' });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { fixtureId: req.params.id },
    });
    const total = predictions.length;
    if (total === 0) {
      res.json({ total: 0, teamAWinPct: null, drawPct: null, teamBWinPct: null });
      return;
    }
    const teamAWin = predictions.filter((p) => p.scoreA > p.scoreB).length;
    const draw = predictions.filter((p) => p.scoreA === p.scoreB).length;
    const teamBWin = predictions.filter((p) => p.scoreA < p.scoreB).length;
    res.json({
      total,
      teamAWinPct: Math.round((teamAWin / total) * 100),
      drawPct: Math.round((draw / total) * 100),
      teamBWinPct: Math.round((teamBWin / total) * 100),
    });
  } catch (err) {
    console.error('Fetch fixture stats error:', err);
    res.status(500).json({ error: 'Failed to fetch fixture stats' });
  }
});

router.post('/result', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fixtureId, scoreA, scoreB } = req.body;

    const fixture = await prisma.fixture.update({
      where: { id: fixtureId },
      data: { actualScoreA: scoreA, actualScoreB: scoreB, isClosed: true },
      include: { predictions: true },
    });

    for (const pred of fixture.predictions) {
      const correct = pred.scoreA === scoreA && pred.scoreB === scoreB;
      const pointsEarned = correct ? 150 : 0;

      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          status: correct ? 'CORRECT' : 'INCORRECT',
          pointsEarned,
        },
      });

      if (correct) {
        await prisma.user.update({
          where: { id: pred.userId },
          data: { points: { increment: pointsEarned }, winStreak: { increment: 1 } },
        });
      } else {
        await prisma.user.update({
          where: { id: pred.userId },
          data: { winStreak: 0 },
        });
      }
    }

    res.json(fixture);
  } catch (err) {
    console.error('Submit result error:', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

export default router;
