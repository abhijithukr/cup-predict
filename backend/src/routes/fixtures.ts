import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { computeAllGroupStandings } from '../services/groupStandings';
import { scoreFixture } from '../services/scoring';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const fixtures = await prisma.fixture.findMany({
      include: { teamA: true, teamB: true, predictions: { where: { userId: req.user!.userId } } },
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
        isClosed: false,
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

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { id: req.params.id },
      include: { teamA: true, teamB: true, predictions: { where: { userId: req.user!.userId } } },
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

router.get('/:id/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { fixtureId: req.params.id },
    });
    const total = predictions.length;
    if (total === 0) {
      res.json({ total: 0, teamAWinPct: null, drawPct: null, teamBWinPct: null });
      return;
    }
    const teamAWin = predictions.filter((p: { scoreA: number; scoreB: number }) => p.scoreA > p.scoreB).length;
    const draw = predictions.filter((p: { scoreA: number; scoreB: number }) => p.scoreA === p.scoreB).length;
    const teamBWin = predictions.filter((p: { scoreA: number; scoreB: number }) => p.scoreA < p.scoreB).length;
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

router.post('/result', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { fixtureId, scoreA, scoreB } = req.body;

    if (!fixtureId || scoreA === undefined || scoreB === undefined || !Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      res.status(400).json({ error: 'Valid fixtureId, scoreA, and scoreB required' });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      const fixture = await tx.fixture.update({
        where: { id: fixtureId },
        data: { actualScoreA: scoreA, actualScoreB: scoreB, isClosed: true },
        include: { predictions: true },
      });

      for (const pred of fixture.predictions) {
        if (pred.status !== 'OPEN') continue;
        const correct = pred.scoreA === scoreA && pred.scoreB === scoreB;
        const pts = correct ? 15 : 0;
        await tx.prediction.update({
          where: { id: pred.id },
          data: { status: correct ? 'CORRECT' : 'INCORRECT', pointsEarned: pts },
        });
        if (correct) {
          await tx.user.update({ where: { id: pred.userId }, data: { points: { increment: pts }, winStreak: { increment: 1 } } });
          const u = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
          await tx.pointEvent.create({ data: { userId: pred.userId, points: u?.points ?? 0, earned: pts, reason: 'match_correct' } });
        } else {
          await tx.user.update({ where: { id: pred.userId }, data: { winStreak: 0 } });
        }
      }
    });

    await computeAllGroupStandings();

    res.json({ message: 'Result submitted' });
  } catch (err) {
    console.error('Submit result error:', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

export default router;
