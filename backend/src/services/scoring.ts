import { prisma } from '../lib/prisma';

export async function scoreFixture(predictionId: string, actualScoreA: number, actualScoreB: number) {
  const pred = await prisma.prediction.findUnique({
    where: { id: predictionId },
  });
  if (!pred || pred.status !== 'OPEN') return;

  const compareA = pred.scoreA === actualScoreA;
  const compareB = pred.scoreB === actualScoreB;
  const correct = compareA && compareB;

  console.log('[scoreFixture]', JSON.stringify({
    predictionId,
    predId: pred.id,
    fixtureId: pred.fixtureId,
    predScoreA: pred.scoreA,
    predScoreAType: typeof pred.scoreA,
    predScoreAJSON: JSON.stringify(pred.scoreA),
    actualScoreA,
    actualScoreAType: typeof actualScoreA,
    actualScoreAJSON: JSON.stringify(actualScoreA),
    predScoreB: pred.scoreB,
    predScoreBType: typeof pred.scoreB,
    predScoreBJSON: JSON.stringify(pred.scoreB),
    actualScoreB,
    actualScoreBType: typeof actualScoreB,
    actualScoreBJSON: JSON.stringify(actualScoreB),
    compareA,
    compareB,
    correct,
  }));

  const pointsEarned = correct ? 15 : 0;

  await prisma.$transaction(async (tx: any) => {
    await tx.prediction.update({
      where: { id: predictionId },
      data: {
        status: correct ? 'CORRECT' : 'INCORRECT',
        pointsEarned,
      },
    });

    if (correct) {
      await tx.user.update({
        where: { id: pred.userId },
        data: { points: { increment: pointsEarned }, winStreak: { increment: 1 } },
      });
      const user = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
      await tx.pointEvent.create({
        data: { userId: pred.userId, points: user?.points ?? 0, earned: pointsEarned, reason: 'match_correct' },
      });
    } else {
      await tx.user.update({
        where: { id: pred.userId },
        data: { winStreak: 0 },
      });
    }
  });
}
