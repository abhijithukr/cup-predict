import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

interface Alert {
  id: string;
  severity: 'red' | 'amber' | 'green';
  title: string;
  description: string;
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const alerts: Alert[] = [];
    const now = new Date();

    // ── Upcoming fixtures (next 2 hours) ──
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const upcomingFixtures = await prisma.fixture.findMany({
      where: {
        kickoffTime: { gte: now, lte: twoHoursLater },
        isClosed: false,
      },
      include: { teamA: true, teamB: true },
      orderBy: { kickoffTime: 'asc' },
      take: 3,
    });

    for (const f of upcomingFixtures) {
      const minsUntil = Math.round((f.kickoffTime.getTime() - now.getTime()) / 60000);
      const userPrediction = await prisma.prediction.findUnique({
        where: { userId_fixtureId: { userId, fixtureId: f.id } },
      });
      alerts.push({
        id: `fixture-${f.id}`,
        severity: minsUntil <= 30 ? 'red' : 'amber',
        title: `${f.teamA.name} vs ${f.teamB.name} kicks off in ${minsUntil} min`,
        description: !userPrediction
          ? 'You haven\'t predicted this match yet!'
          : 'Your prediction is locked in.',
      });
    }

    // ── Group stage incomplete ──
    const groupPredCount = await prisma.groupPrediction.count({ where: { userId } });
    if (groupPredCount < 12) {
      alerts.push({
        id: 'group-stage-incomplete',
        severity: 'red',
        title: 'Group Stage picks incomplete',
        description: `You've completed ${groupPredCount}/12 groups. Finish your group predictions!`,
      });
    }

    // ── Knockout bracket ──
    const koPred = await prisma.knockoutPrediction.findUnique({ where: { userId } });
    if (groupPredCount >= 12 && !koPred) {
      alerts.push({
        id: 'bracket-not-started',
        severity: 'amber',
        title: 'Knockout Bracket is ready',
        description: 'Complete your group stage? Now pick your R32 winners!',
      });
    }
    if (koPred && !koPred.locked) {
      alerts.push({
        id: 'bracket-not-locked',
        severity: 'amber',
        title: 'Bracket not locked',
        description: 'Lock your bracket to earn +100 bonus points!',
      });
    }

    // ── Community stats ──
    const totalGroupUsers = (await prisma.groupPrediction.groupBy({ by: ['userId'] })).length;
    const lockedBrackets = await prisma.knockoutPrediction.count({ where: { locked: true } });
    const totalUsers = await prisma.user.count();

    alerts.push({
      id: 'community-group',
      severity: 'green',
      title: `${totalGroupUsers}/${totalUsers} users submitted group predictions`,
      description: `${lockedBrackets} brackets locked so far.`,
    });

    // ── Tournament countdown ──
    const worldCupStart = new Date('2026-06-11T00:00:00.000Z');
    const worldCupEnd = new Date('2026-07-19T23:59:59.000Z');
    if (now < worldCupStart) {
      const daysUntil = Math.ceil((worldCupStart.getTime() - now.getTime()) / 86400000);
      alerts.push({
        id: 'countdown',
        severity: 'amber',
        title: `World Cup 2026 starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
        description: 'Get your predictions ready.',
      });
    } else if (now >= worldCupStart && now <= worldCupEnd) {
      alerts.push({
        id: 'tournament-live',
        severity: 'green',
        title: 'World Cup 2026 is LIVE!',
        description: 'Follow matches and update predictions.',
      });
    }

    res.json({ alerts });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
