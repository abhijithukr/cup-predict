import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const exclude = req.query.exclude as string | undefined;
    const whereFilter = exclude ? { username: { not: exclude } } : {};

    const users = await prisma.user.findMany({
      where: whereFilter,
      orderBy: [{ points: 'desc' }, { username: 'asc' }],
      include: { _count: { select: { predictions: true } } },
    });

    const finishedCount = await prisma.fixture.count({
      where: { isClosed: true, actualScoreA: { not: null }, actualScoreB: { not: null } },
    });

    const leaderboard = await Promise.all(
      users.map(async (user: any, index: number) => {
        const correctCount = await prisma.prediction.count({
          where: { userId: user.id, status: 'CORRECT' },
        });
        const totalPredictions = user._count.predictions;
        const correctPercentage = finishedCount > 0 && totalPredictions > 0
          ? Math.round((correctCount / totalPredictions) * 100)
          : null;

        return {
          id: user.id,
          rank: index + 1,
          username: user.username,
          fullName: user.fullName,
          department: user.department,
          points: user.points,
          winStreak: user.winStreak,
          avatarUrl: user.avatarUrl,
          correctPercentage,
          predictionsCount: totalPredictions,
        };
      })
    );

    res.json(leaderboard);
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
