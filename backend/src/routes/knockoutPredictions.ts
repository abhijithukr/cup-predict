import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { generateBracket, advanceWinners } from '../services/bracketGenerator';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.knockoutPrediction.findUnique({
      where: { userId: req.user!.userId },
    });

    const groupResults = await prisma.groupResult.findMany({ orderBy: { groupName: 'asc' } });
    if (groupResults.length < 12) {
      res.status(400).json({ error: 'Group stage not yet complete' });
      return;
    }

    const bracket = generateBracket(groupResults);

    if (existing) {
      const saved = existing.bracket as any;

      // Check if saved bracket is from old format (match# < 73) — reset if so
      const oldFormat = saved.roundOf32?.some((m: any) => m.match < 73);
      if (oldFormat) {
        await prisma.knockoutPrediction.delete({ where: { userId: req.user!.userId } });
        const advanced = advanceWinners(bracket);
        res.json({ bracket: advanced, locked: false });
        return;
      }

      const r32 = saved.roundOf32 || [];
      for (const m of r32) {
        const live = bracket.roundOf32.find(x => x.match === m.match);
        if (live) live.winner = m.winner || null;
      }
      const r16 = saved.roundOf16 || [];
      for (const m of r16) {
        const live = bracket.roundOf16.find(x => x.match === m.match);
        if (live) live.winner = m.winner || null;
      }
      const qf = saved.quarterFinals || [];
      for (const m of qf) {
        const live = bracket.quarterFinals.find(x => x.match === m.match);
        if (live) live.winner = m.winner || null;
      }
      const sf = saved.semiFinals || [];
      for (const m of sf) {
        const live = bracket.semiFinals.find(x => x.match === m.match);
        if (live) live.winner = m.winner || null;
      }
      if (saved.final?.winner) {
        bracket.final.winner = saved.final.winner;
      }
      const advanced = advanceWinners(bracket);
      res.json({ bracket: advanced, locked: existing.locked });
      return;
    }

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
