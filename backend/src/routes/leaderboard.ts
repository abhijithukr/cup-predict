import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      include: { _count: { select: { predictions: true } } },
    });

    const leaderboard = await Promise.all(
      users.map(async (user: any, index: number) => {
        const correctCount = await prisma.prediction.count({
          where: { userId: user.id, status: 'CORRECT' },
        });
        const totalPredictions = user._count.predictions;
        const correctPercentage = totalPredictions > 0
          ? Math.round((correctCount / totalPredictions) * 100)
          : 0;

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
