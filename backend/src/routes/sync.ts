import { Router, Request, Response } from 'express';
import { syncAllFixtures, syncLiveScores, processFinishedMatches, clearOldData } from '../services/sync';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/fixtures', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.query.clear === 'true') {
      await clearOldData();
    }
    await syncAllFixtures();
    res.json({ message: 'Sync complete' });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.post('/livescores', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    await syncLiveScores();
    const scored = await processFinishedMatches();
    res.json({ message: 'Live scores synced', predictionsScored: scored });
  } catch (err) {
    console.error('Live sync error:', err);
    res.status(500).json({ error: 'Live sync failed' });
  }
});

router.post('/rescore', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    await syncLiveScores();
    const scored = await processFinishedMatches();
    res.json({ message: 'Rescore complete', predictionsScored: scored });
  } catch (err) {
    console.error('Rescore error:', err);
    res.status(500).json({ error: 'Rescore failed' });
  }
});

const R32_FIXTURES: Array<{ match: number; home: string; away: string; kickoff: string }> = [
  { match: 73, home: 'South Africa', away: 'Canada', kickoff: '2026-06-28T19:00:00Z' },
  { match: 74, home: 'Germany', away: 'Paraguay', kickoff: '2026-06-29T20:30:00Z' },
  { match: 75, home: 'Netherlands', away: 'Morocco', kickoff: '2026-06-30T00:00:00Z' },
  { match: 76, home: 'Brazil', away: 'Japan', kickoff: '2026-06-29T17:00:00Z' },
  { match: 77, home: 'France', away: 'Sweden', kickoff: '2026-06-30T22:00:00Z' },
  { match: 78, home: 'Ivory Coast', away: 'Norway', kickoff: '2026-06-30T17:00:00Z' },
  { match: 79, home: 'Mexico', away: 'Ecuador', kickoff: '2026-07-01T01:00:00Z' },
  { match: 80, home: 'England', away: 'DR Congo', kickoff: '2026-07-01T16:00:00Z' },
  { match: 81, home: 'USA', away: 'Bosnia and Herzegovina', kickoff: '2026-07-02T00:00:00Z' },
  { match: 82, home: 'Belgium', away: 'Senegal', kickoff: '2026-07-01T20:00:00Z' },
  { match: 83, home: 'Portugal', away: 'Croatia', kickoff: '2026-07-02T23:00:00Z' },
  { match: 84, home: 'Spain', away: 'Austria', kickoff: '2026-07-02T19:00:00Z' },
  { match: 85, home: 'Switzerland', away: 'Algeria', kickoff: '2026-07-03T02:00:00Z' },
  { match: 86, home: 'Argentina', away: 'Cape Verde', kickoff: '2026-07-03T22:00:00Z' },
  { match: 87, home: 'Colombia', away: 'Ghana', kickoff: '2026-07-04T00:30:00Z' },
  { match: 88, home: 'Australia', away: 'Egypt', kickoff: '2026-07-03T18:00:00Z' },
];

router.post('/knockout-fixtures', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany();
    const teamMap = new Map(teams.map((t: { name: string; code: string }) => [t.name, t.code]));

    const groupResults = await prisma.groupResult.findMany();
    const grMap = new Map<string, (typeof groupResults)[0]>();
    for (const g of groupResults) {
      grMap.set(g.groupName.replace('Group ', ''), g);
    }

    // Map R32 fixture slots to actual teams
    const homeCodes: string[] = [];
    const awayCodes: string[] = [];

    // Match 73: 2A vs 2B
    const a2 = grMap.get('A')?.secondCode;
    const b2 = grMap.get('B')?.secondCode;
    homeCodes.push(a2!); awayCodes.push(b2!);

    // Match 74: 1E vs 3D
    homeCodes.push(grMap.get('E')!.firstCode); awayCodes.push(grMap.get('D')!.thirdCode);

    // Match 75: 1F vs 2C
    homeCodes.push(grMap.get('F')!.firstCode); awayCodes.push(grMap.get('C')!.secondCode);

    // Match 76: 1C vs 2F
    homeCodes.push(grMap.get('C')!.firstCode); awayCodes.push(grMap.get('F')!.secondCode);

    // Match 77: 1I vs 3F
    homeCodes.push(grMap.get('I')!.firstCode); awayCodes.push(grMap.get('F')!.thirdCode);

    // Match 78: 2E vs 2I
    homeCodes.push(grMap.get('E')!.secondCode); awayCodes.push(grMap.get('I')!.secondCode);

    // Match 79: 1A vs 3E
    homeCodes.push(grMap.get('A')!.firstCode); awayCodes.push(grMap.get('E')!.thirdCode);

    // Match 80: 1L vs 3K
    homeCodes.push(grMap.get('L')!.firstCode); awayCodes.push(grMap.get('K')!.thirdCode);

    // Match 81: 1D vs 3B
    homeCodes.push(grMap.get('D')!.firstCode); awayCodes.push(grMap.get('B')!.thirdCode);

    // Match 82: 1G vs 3I
    homeCodes.push(grMap.get('G')!.firstCode); awayCodes.push(grMap.get('I')!.thirdCode);

    // Match 83: 2K vs 2L
    homeCodes.push(grMap.get('K')!.secondCode); awayCodes.push(grMap.get('L')!.secondCode);

    // Match 84: 1H vs 2J
    homeCodes.push(grMap.get('H')!.firstCode); awayCodes.push(grMap.get('J')!.secondCode);

    // Match 85: 1B vs 3J
    homeCodes.push(grMap.get('B')!.firstCode); awayCodes.push(grMap.get('J')!.thirdCode);

    // Match 86: 1J vs 2H
    homeCodes.push(grMap.get('J')!.firstCode); awayCodes.push(grMap.get('H')!.secondCode);

    // Match 87: 1K vs 3L
    homeCodes.push(grMap.get('K')!.firstCode); awayCodes.push(grMap.get('L')!.thirdCode);

    // Match 88: 2D vs 2G
    homeCodes.push(grMap.get('D')!.secondCode); awayCodes.push(grMap.get('G')!.secondCode);

    let created = 0;
    for (let i = 0; i < 16; i++) {
      const f = R32_FIXTURES[i];
      const existing = await prisma.fixture.findUnique({ where: { id: `r32_${f.match}` } });
      if (existing) continue;

      await prisma.fixture.create({
        data: {
          id: `r32_${f.match}`,
          groupName: `R32-M${f.match}`,
          teamACode: homeCodes[i],
          teamBCode: awayCodes[i],
          kickoffTime: new Date(f.kickoff),
          status: 'scheduled',
        },
      });
      created++;
    }

    res.json({ message: `Created ${created} R32 fixtures` });
  } catch (err) {
    console.error('Create knockout fixtures error:', err);
    res.status(500).json({ error: 'Failed to create knockout fixtures' });
  }
});

router.post('/knockout-result', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { matchId, scoreA, scoreB } = req.body;
    if (!matchId || scoreA === undefined || scoreB === undefined || !Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      res.status(400).json({ error: 'Valid matchId, scoreA, and scoreB required' });
      return;
    }

    const fixture = await prisma.fixture.findUnique({ where: { id: matchId } });
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    await prisma.fixture.update({
      where: { id: matchId },
      data: { actualScoreA: scoreA, actualScoreB: scoreB, isClosed: true, status: 'finished' },
    });

    res.json({ message: 'Knockout result recorded' });
  } catch (err) {
    console.error('Knockout result error:', err);
    res.status(500).json({ error: 'Failed to record result' });
  }
});

export default router;
