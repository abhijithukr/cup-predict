import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        department: true,
        points: true,
        winStreak: true,
        avatarUrl: true,
        _count: { select: { predictions: true } },
      },
    });

    const leaderboard = users.map((user: { id: string; username: string; fullName: string; department: string; points: number; winStreak: number; avatarUrl: string | null; _count: { predictions: number } }, index: number) => {
      const correctCount = 0;
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
    });

    res.json(leaderboard);
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
