import { prisma } from '../lib/prisma';

const GROUP_NAMES = [
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
  'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
];

interface TeamStanding {
  code: string;
  pts: number;
  gd: number;
  gf: number;
}

export async function computeAllGroupStandings() {
  for (const groupName of GROUP_NAMES) {
    await computeGroupStanding(groupName);
  }
}

async function computeGroupStanding(groupName: string) {
  const teams = await prisma.team.findMany({ where: { groupName } });
  if (teams.length !== 4) return;

  const fixtures = await prisma.fixture.findMany({
    where: { groupName, actualScoreA: { not: null }, actualScoreB: { not: null } },
  });

  if (fixtures.length < 6) return;

  const map: Record<string, TeamStanding> = {};
  for (const t of teams) {
    map[t.code] = { code: t.code, pts: 0, gd: 0, gf: 0 };
  }

  for (const f of fixtures) {
    const a = f.actualScoreA!;
    const b = f.actualScoreB!;
    map[f.teamACode].gf += a;
    map[f.teamACode].gd += a - b;
    map[f.teamBCode].gf += b;
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

  const first = sorted[0].code;
  const second = sorted[1].code;
  const third = sorted[2].code;

  await prisma.groupResult.upsert({
    where: { groupName },
    update: { firstCode: first, secondCode: second, thirdCode: third },
    create: { groupName, firstCode: first, secondCode: second, thirdCode: third },
  });

  await scoreGroupPredictions(groupName, first, second, third);
}

async function scoreGroupPredictions(groupName: string, first: string, second: string, third: string) {
  const predictions = await prisma.groupPrediction.findMany({ where: { groupName } });

  for (const pred of predictions) {
    let points = 0;

    const firstOk = !pred.scoredFirst && pred.firstCode === first;
    const secondOk = !pred.scoredSecond && pred.secondCode === second;
    const thirdOk = !pred.scoredThird && pred.thirdCode && pred.thirdCode === third;

    if (firstOk) points += 5;
    if (secondOk) points += 5;
    if (thirdOk) points += 5;

    if (points > 0) {
      await prisma.$transaction(async (tx: any) => {
        if (firstOk) {
          const r = await tx.groupPrediction.updateMany({ where: { id: pred.id, scoredFirst: false }, data: { scoredFirst: true } });
          if (r.count === 0) points -= 5;
        }
        if (secondOk) {
          const r = await tx.groupPrediction.updateMany({ where: { id: pred.id, scoredSecond: false }, data: { scoredSecond: true } });
          if (r.count === 0) points -= 5;
        }
        if (thirdOk) {
          const r = await tx.groupPrediction.updateMany({ where: { id: pred.id, scoredThird: false }, data: { scoredThird: true } });
          if (r.count === 0) points -= 5;
        }

        if (points > 0) {
          await tx.user.update({ where: { id: pred.userId }, data: { points: { increment: points } } });
          const u = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
          await tx.pointEvent.create({ data: { userId: pred.userId, points: u?.points ?? 0, earned: points, reason: 'group_position' } });
        }
      });
    }
  }
}
