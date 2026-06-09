import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fixtureId, scoreA, scoreB } = req.body;
    const userId = req.user!.userId;

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    if (fixture.isClosed || new Date() > fixture.kickoffTime) {
      res.status(400).json({ error: 'Match has already started or closed' });
      return;
    }

    const prediction = await prisma.prediction.upsert({
      where: { userId_fixtureId: { userId, fixtureId } },
      update: { scoreA, scoreB },
      create: { userId, fixtureId, scoreA, scoreB },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 25 } },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    res.status(201).json({ prediction, pointsAwarded: 25, totalPoints: updatedUser?.points });
  } catch (err) {
    console.error('Submit prediction error:', err);
    res.status(500).json({ error: 'Failed to submit prediction' });
  }
});

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId: req.user!.userId },
      include: { fixture: { include: { teamA: true, teamB: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(predictions);
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

export default router;
