import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { m1, m2, m3, m4, q1, q2, s1, champion } = req.body;
    const userId = req.user!.userId;

    const existing = await prisma.bracket.findUnique({ where: { userId } });
    if (existing?.locked) {
      res.status(400).json({ error: 'Bracket is already locked' });
      return;
    }

    const bracket = await prisma.bracket.upsert({
      where: { userId },
      update: { m1, m2, m3, m4, q1, q2, s1, champion },
      create: { userId, m1, m2, m3, m4, q1, q2, s1, champion },
    });

    res.status(201).json(bracket);
  } catch (err) {
    console.error('Save bracket error:', err);
    res.status(500).json({ error: 'Failed to save bracket' });
  }
});

router.post('/lock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bracket = await prisma.bracket.update({
      where: { userId: req.user!.userId },
      data: { locked: true },
    });
    res.json(bracket);
  } catch (err) {
    console.error('Lock bracket error:', err);
    res.status(500).json({ error: 'Failed to lock bracket' });
  }
});

router.get('/:username', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const bracket = await prisma.bracket.findUnique({ where: { userId: user.id } });
    if (!bracket) {
      res.status(404).json({ error: 'Bracket not found' });
      return;
    }

    res.json(bracket);
  } catch (err) {
    console.error('Fetch bracket error:', err);
    res.status(500).json({ error: 'Failed to fetch bracket' });
  }
});

export default router;
