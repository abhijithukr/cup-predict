import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const events = await prisma.pointEvent.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(events);
  } catch (err) {
    console.error('Point history error:', err);
    res.status(500).json({ error: 'Failed to fetch point history' });
  }
});

export default router;
