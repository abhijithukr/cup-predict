import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const GROUP_NAMES = [
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
  'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
];

interface TeamStanding {
  code: string;
  name: string;
  flagUrl: string;
  pts: number;
  gd: number;
  gf: number;
  ga: number;
  position: number;
}

interface GroupStandingResult {
  groupName: string;
  standings: TeamStanding[];
}

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const results: GroupStandingResult[] = [];

    for (const groupName of GROUP_NAMES) {
      const teams = await prisma.team.findMany({ where: { groupName } });
      if (teams.length !== 4) continue;

      const fixtures = await prisma.fixture.findMany({
        where: { groupName, actualScoreA: { not: null }, actualScoreB: { not: null } },
      });

      if (fixtures.length < 6) continue;

      const map: Record<string, TeamStanding> = {};
      for (const t of teams) {
        map[t.code] = { code: t.code, name: t.name, flagUrl: t.flagUrl, pts: 0, gd: 0, gf: 0, ga: 0, position: 0 };
      }

      for (const f of fixtures) {
        const a = f.actualScoreA!;
        const b = f.actualScoreB!;
        map[f.teamACode].gf += a;
        map[f.teamACode].ga += b;
        map[f.teamACode].gd += a - b;
        map[f.teamBCode].gf += b;
        map[f.teamBCode].ga += a;
        map[f.teamBCode].gd += b - a;
        if (a > b) {
          map[f.teamACode].pts += 3;
        } else if (b > a) {
          map[f.teamBCode].pts += 3;
        } else {
          map[f.teamACode].pts += 1;
          map[f.teamBCode].pts += 1;
        }
      }

      const sorted = Object.values(map).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.code.localeCompare(b.code);
      });

      sorted.forEach((s, i) => { s.position = i + 1; });

      results.push({ groupName, standings: sorted });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group standings' });
  }
});

export default router;
