import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { generateBracket, advanceWinners, GroupStanding } from '../services/bracketGenerator';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.knockoutPrediction.findUnique({
      where: { userId: req.user!.userId },
    });

    if (existing) {
      res.json(existing);
      return;
    }

    // Build bracket from group predictions
    const groupPreds = await prisma.groupPrediction.findMany({
      where: { userId: req.user!.userId },
    });

    if (groupPreds.length < 12) {
      res.status(400).json({ error: 'Complete all 12 group predictions first' });
      return;
    }

    const standings: GroupStanding[] = groupPreds.map((g: { groupName: string; firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean }) => ({
      groupName: g.groupName,
      first: g.firstCode,
      second: g.secondCode,
      third: g.thirdCode,
      thirdQualifies: g.thirdQualifies,
    }));

    const bracket = generateBracket(standings);
    res.json({ bracket, locked: false });
  } catch (err) {
    console.error('Fetch knockout predictions error:', err);
    res.status(500).json({ error: 'Failed to fetch knockout predictions' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bracket } = req.body;

    if (!bracket) {
      res.status(400).json({ error: 'Bracket required' });
      return;
    }

    const existing = await prisma.knockoutPrediction.findUnique({
      where: { userId: req.user!.userId },
    });

    if (existing?.locked) {
      res.status(400).json({ error: 'Bracket is locked' });
      return;
    }

    const updated = await prisma.knockoutPrediction.upsert({
      where: { userId: req.user!.userId },
      update: { bracket: JSON.parse(JSON.stringify(bracket)) },
      create: {
        userId: req.user!.userId,
        bracket: JSON.parse(JSON.stringify(bracket)),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Save knockout predictions error:', err);
    res.status(500).json({ error: 'Failed to save knockout predictions' });
  }
});

router.post('/lock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.knockoutPrediction.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!existing) {
      res.status(400).json({ error: 'No bracket to lock' });
      return;
    }

    const updated = await prisma.knockoutPrediction.update({
      where: { userId: req.user!.userId },
      data: { locked: true },
    });

    res.json(updated);
  } catch (err) {
    console.error('Lock knockout predictions error:', err);
    res.status(500).json({ error: 'Failed to lock knockout predictions' });
  }
});

router.post('/advance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bracket } = req.body;
    if (!bracket) {
      res.status(400).json({ error: 'Bracket required' });
      return;
    }
    const advanced = advanceWinners(bracket);
    res.json(advanced);
  } catch (err) {
    console.error('Advance bracket error:', err);
    res.status(500).json({ error: 'Failed to advance bracket' });
  }
});

export default router;
