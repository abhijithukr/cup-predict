import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({ orderBy: { groupName: 'asc' } });
    const groups: Record<string, { groupName: string; teams: { code: string; name: string; flagUrl: string }[]; prediction: { firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean } | null }> = {};
    for (const t of teams) {
      if (!groups[t.groupName]) {
        groups[t.groupName] = { groupName: t.groupName, teams: [], prediction: null };
      }
      groups[t.groupName].teams.push({ code: t.code, name: t.name, flagUrl: t.flagUrl });
    }

    const existing = await prisma.groupPrediction.findMany({
      where: { userId: req.user!.userId },
    });
    for (const p of existing) {
      if (groups[p.groupName]) {
        groups[p.groupName].prediction = {
          firstCode: p.firstCode,
          secondCode: p.secondCode,
          thirdCode: p.thirdCode,
          thirdQualifies: p.thirdQualifies,
        };
      }
    }

    const result = Object.values(groups).sort((a, b) => a.groupName.localeCompare(b.groupName));
    res.json(result);
  } catch (err) {
    console.error('Fetch group predictions error:', err);
    res.status(500).json({ error: 'Failed to fetch group predictions' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (new Date() > new Date('2026-06-17T18:30:00Z')) {
      res.status(400).json({ error: 'Group predictions closed after June 17' });
      return;
    }

    const { groups: predictions } = req.body as { groups: { groupName: string; firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean }[] };

    if (!Array.isArray(predictions) || predictions.length === 0) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    for (const p of predictions) {
      await prisma.groupPrediction.upsert({
        where: { userId_groupName: { userId: req.user!.userId, groupName: p.groupName } },
        update: {
          firstCode: p.firstCode,
          secondCode: p.secondCode,
          thirdCode: p.thirdCode,
          thirdQualifies: p.thirdQualifies,
        },
        create: {
          userId: req.user!.userId,
          groupName: p.groupName,
          firstCode: p.firstCode,
          secondCode: p.secondCode,
          thirdCode: p.thirdCode,
          thirdQualifies: p.thirdQualifies,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save group predictions error:', err);
    res.status(500).json({ error: 'Failed to save group predictions' });
  }
});

export default router;
