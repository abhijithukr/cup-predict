import { prisma } from '../lib/prisma';

export async function scoreFixture(predictionId: string, actualScoreA: number, actualScoreB: number): Promise<boolean> {
  const pred = await prisma.prediction.findUnique({
    where: { id: predictionId },
  });
  if (!pred) return false;

  const correct = pred.scoreA === actualScoreA && pred.scoreB === actualScoreB;
  const shouldBeStatus: 'CORRECT' | 'INCORRECT' = correct ? 'CORRECT' : 'INCORRECT';

  const newPoints = correct ? 15 : 0;
  const oldPoints = pred.pointsEarned || 0;
  const pointsDiff = newPoints - oldPoints;

  if (pointsDiff === 0 && pred.status === shouldBeStatus) return false;

  await prisma.$transaction(async (tx: any) => {
    await tx.prediction.update({
      where: { id: predictionId },
      data: { status: shouldBeStatus, pointsEarned: newPoints },
    });

    if (pointsDiff !== 0) {
      await tx.user.update({
        where: { id: pred.userId },
        data: { points: { increment: pointsDiff } },
      });
    }

    if (correct) {
      if (pred.status !== 'CORRECT') {
        await tx.user.update({
          where: { id: pred.userId },
          data: { winStreak: { increment: 1 } },
        });
      }
      const user = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
      await tx.pointEvent.create({
        data: { userId: pred.userId, points: user?.points ?? 0, earned: newPoints, reason: 'match_correct' },
      });
    } else {
      if (pred.status !== 'INCORRECT') {
        await tx.user.update({
          where: { id: pred.userId },
          data: { winStreak: 0 },
        });
      }
      if (pointsDiff < 0) {
        const user = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
        await tx.pointEvent.create({
          data: { userId: pred.userId, points: user?.points ?? 0, earned: newPoints, reason: 'scoring_correction' },
        });
      }
    }
  });

  return true;
}

const ROUND_POINTS: Record<string, number> = {
  roundOf32: 20,
  roundOf16: 25,
  quarterFinals: 30,
  semiFinals: 35,
  final: 50,
};

export async function scoreKnockoutPredictions(): Promise<number> {
  const actualResults = await prisma.fixture.findMany({
    where: { id: { startsWith: 'r32_' } },
    select: { id: true, teamACode: true, teamBCode: true, actualScoreA: true },
  });

  if (actualResults.length === 0) return 0;

  const actualWinnersMap = new Map<string, string | null>();
  for (const f of actualResults) {
    if (f.actualScoreA === null) continue;
    const matchNum = parseInt(f.id.replace('r32_', ''));
    const winner = f.actualScoreA > 0 ? f.teamACode : f.teamBCode;
    actualWinnersMap.set(`r32_${matchNum}`, winner);
  }

  const allPredictions = await prisma.knockoutPrediction.findMany({ select: { userId: true, bracket: true } });
  let scored = 0;

  for (const pred of allPredictions) {
    const bracket = pred.bracket as any;
    const rounds: Array<{ key: string; matches: any[] }> = [
      { key: 'roundOf32', matches: bracket.roundOf32 || [] },
      { key: 'roundOf16', matches: bracket.roundOf16 || [] },
      { key: 'quarterFinals', matches: bracket.quarterFinals || [] },
      { key: 'semiFinals', matches: bracket.semiFinals || [] },
    ];

    let totalEarned = 0;

    for (const round of rounds) {
      const pts = ROUND_POINTS[round.key] || 0;
      for (const m of round.matches) {
        const actualWinner = actualWinnersMap.get(`r32_${m.match}`);
        if (!actualWinner) continue;
        if (m.winner === actualWinner) {
          totalEarned += pts;
        }
      }
    }

    if (bracket.final?.winner) {
      const actualFinal = actualResults.find((f: { id: string }) => f.id === 'r32_103');
      if (actualFinal?.actualScoreA !== null) {
        const finalWinner = actualFinal!.actualScoreA! > 0 ? actualFinal!.teamACode : actualFinal!.teamBCode;
        if (bracket.final.winner === finalWinner) {
          totalEarned += ROUND_POINTS.final;
        }
      }
    }

    if (totalEarned > 0) {
      await prisma.user.update({
        where: { id: pred.userId },
        data: { points: { increment: totalEarned } },
      });
      const user = await prisma.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
      await prisma.pointEvent.create({
        data: { userId: pred.userId, points: user?.points ?? 0, earned: totalEarned, reason: 'knockout_correct' },
      });
      scored++;
    }
  }

  return scored;
}
